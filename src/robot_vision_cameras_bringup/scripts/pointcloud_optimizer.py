#!/usr/bin/env python3
"""Bereitet die ZED-Punktwolke fuer MoveIt und den Web Digital Twin auf.

Eingang: /zed/zed_node/point_cloud/cloud_registered
  Die ZED veroeffentlicht die Wolke bereits in ROS-Konvention (X vorne, Z oben)
  im Frame zed_left_camera_frame - hier wird nichts gedreht, den Rest macht TF.

Ausgang 1: /zed/zed_node/point_cloud/cloud_optimized  (MoveIt OctoMap)
  Nur NaN-Punkte entfernt, Frame unveraendert. Standardmaessig AUS
  (publish_moveit_cloud), weil MoveIt sonst die Kamerawolke - inklusive der
  zu greifenden Objekte - als Hindernis in die Planung uebernimmt.
  Kein Zuschnitt: MoveIt nutzt Punkte jenseits von ros.max_range, um die
  OctoMap entlang dieser Strahlen freizuraeumen.

Ausgang 2: /zed/pointcloud_web  (Robot Control UI, Digital Twin)
  Ausgeduennt auf web_max_points, nach web_frame (world) transformiert,
  hoechstens web_rate_hz - und nur, solange ein Client abonniert hat.
"""

import time

import numpy as np
import rclpy
import sensor_msgs_py.point_cloud2 as pc2
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from rclpy.time import Time
from sensor_msgs.msg import PointCloud2, PointField
from tf2_ros import Buffer, TransformException, TransformListener


def quat_to_matrix(x, y, z, w):
    return np.array([
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
    ], dtype=np.float32)


class PointCloudOptimizerNode(Node):
    def __init__(self):
        super().__init__('pointcloud_optimizer')

        self.declare_parameter('publish_moveit_cloud', False)
        self.declare_parameter('web_max_points', 12000)
        self.declare_parameter('web_rate_hz', 4.0)
        self.declare_parameter('web_frame', 'world')

        self.publish_moveit_cloud = bool(self.get_parameter('publish_moveit_cloud').value)
        self.web_max_points = max(1, int(self.get_parameter('web_max_points').value))
        self.web_period = 1.0 / max(0.1, float(self.get_parameter('web_rate_hz').value))
        self.web_frame = str(self.get_parameter('web_frame').value)

        self.subscription = self.create_subscription(
            PointCloud2,
            '/zed/zed_node/point_cloud/cloud_registered',
            self.listener_callback,
            qos_profile_sensor_data
        )

        # Full cloud for MoveIt OctoMap
        self.publisher = self.create_publisher(
            PointCloud2,
            '/zed/zed_node/point_cloud/cloud_optimized',
            10
        )

        # Lightweight downsampled cloud for the browser WebGL Digital Twin
        self.web_publisher = self.create_publisher(
            PointCloud2,
            '/zed/pointcloud_web',
            2
        )
        self.last_web_pub_time = 0.0

        self.tf_buffer = Buffer()
        self.tf_listener = TransformListener(self.tf_buffer, self)

        self.get_logger().info(
            f'Point Cloud Optimizer started (MoveIt cloud: '
            f'{"on" if self.publish_moveit_cloud else "off"}, web stream: '
            f'{self.web_max_points} pts @ {1.0 / self.web_period:.1f} Hz in "{self.web_frame}").')

    def listener_callback(self, msg):
        want_moveit = self.publish_moveit_cloud
        now = time.monotonic()
        want_web = (self.web_publisher.get_subscription_count() > 0
                    and now - self.last_web_pub_time >= self.web_period)
        if not (want_moveit or want_web):
            return

        names = [f.name for f in msg.fields]
        has_rgb = 'rgb' in names
        field_names = ('x', 'y', 'z', 'rgb') if has_rgb else ('x', 'y', 'z')
        # Humble: strukturiertes numpy-Array (n,), NaN-Punkte entfernt
        points = pc2.read_points(msg, field_names=field_names, skip_nans=True)
        if len(points) == 0:
            return

        fields = [
            PointField(name='x', offset=0, datatype=PointField.FLOAT32, count=1),
            PointField(name='y', offset=4, datatype=PointField.FLOAT32, count=1),
            PointField(name='z', offset=8, datatype=PointField.FLOAT32, count=1),
        ]
        if has_rgb:
            fields.append(PointField(name='rgb', offset=12, datatype=PointField.FLOAT32, count=1))

        if want_moveit:
            self.publisher.publish(pc2.create_cloud(msg.header, fields, points))

        if want_web:
            self.last_web_pub_time = now
            self.publish_web_cloud(msg, points, fields, has_rgb)

    def publish_web_cloud(self, msg, points, fields, has_rgb):
        try:
            tf = self.tf_buffer.lookup_transform(self.web_frame, msg.header.frame_id, Time())
        except TransformException as e:
            self.get_logger().warn(
                f'Web cloud skipped: no TF {self.web_frame} <- {msg.header.frame_id} ({e})',
                throttle_duration_sec=10.0)
            return

        stride = max(1, len(points) // self.web_max_points)
        sub = points[::stride]
        xyz = np.column_stack((sub['x'], sub['y'], sub['z'])).astype(np.float32)

        q = tf.transform.rotation
        t = tf.transform.translation
        rot = quat_to_matrix(q.x, q.y, q.z, q.w)
        xyz = xyz @ rot.T + np.array([t.x, t.y, t.z], dtype=np.float32)

        dtype = [('x', np.float32), ('y', np.float32), ('z', np.float32)]
        if has_rgb:
            dtype.append(('rgb', np.float32))
        out = np.empty(len(xyz), dtype=dtype)
        out['x'] = xyz[:, 0]
        out['y'] = xyz[:, 1]
        out['z'] = xyz[:, 2]
        if has_rgb:
            out['rgb'] = sub['rgb']  # gepackte Farbe unveraendert uebernehmen

        header = msg.header
        header.frame_id = self.web_frame
        self.web_publisher.publish(pc2.create_cloud(header, fields, out))


def main(args=None):
    rclpy.init(args=args)
    node = PointCloudOptimizerNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        if rclpy.ok():
            rclpy.shutdown()


if __name__ == '__main__':
    main()
