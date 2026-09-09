#!/usr/bin/env python3

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import PointCloud2, PointField
import sensor_msgs_py.point_cloud2 as pc2
import numpy as np



class PointCloudOptimizerNode(Node):
    def __init__(self):
        super().__init__('pointcloud_optimizer')
        

        
        # Subscriber
        self.subscription = self.create_subscription(
            PointCloud2,
            '/zed/zed_node/point_cloud/cloud_registered',
            self.listener_callback,
            10
        )
        
        # Publisher
        self.publisher = self.create_publisher(
            PointCloud2,
            '/zed/zed_node/point_cloud/cloud_optimized',
            10
        )
        
        self.get_logger().info('Point Cloud Optimizer Node (Pure Numpy) has been started.')

    def listener_callback(self, msg):


        # Read points
        field_names = [f.name for f in msg.fields]
        has_rgb = 'rgb' in field_names
        req_fields = ['x', 'y', 'z', 'rgb'] if has_rgb else ['x', 'y', 'z']

        try:
            points_data = pc2.read_points_numpy(msg, field_names=req_fields, skip_nans=True)
        except Exception:
            gen = pc2.read_points(msg, field_names=req_fields, skip_nans=True)
            points_data = np.array(list(gen))
        
        if points_data is None or len(points_data) == 0:
            return
            
        if len(points_data.shape) != 2 or points_data.shape[1] < 3:
            return

        # --- Apply Optical to ROS Rotation ---
        # Optical: Z=forward, X=right, Y=down
        # ROS: X=forward, Y=left, Z=up
        xyz_ros_x = points_data[:, 2].astype(np.float32)   # X_ros = Z_opt
        xyz_ros_y = -points_data[:, 0].astype(np.float32)  # Y_ros = -X_opt
        xyz_ros_z = -points_data[:, 1].astype(np.float32)  # Z_ros = -Y_opt
        # -------------------------------------

        fields = [
            PointField(name='x', offset=0, datatype=PointField.FLOAT32, count=1),
            PointField(name='y', offset=4, datatype=PointField.FLOAT32, count=1),
            PointField(name='z', offset=8, datatype=PointField.FLOAT32, count=1),
        ]

        if has_rgb and points_data.shape[1] >= 4:
            fields.append(PointField(name='rgb', offset=12, datatype=PointField.FLOAT32, count=1))
            points_out = np.empty(len(points_data), dtype=[
                ('x', np.float32),
                ('y', np.float32),
                ('z', np.float32),
                ('rgb', np.float32)
            ])
            points_out['x'] = xyz_ros_x
            points_out['y'] = xyz_ros_y
            points_out['z'] = xyz_ros_z
            points_out['rgb'] = points_data[:, 3].astype(np.float32)
        else:
            points_out = np.empty(len(points_data), dtype=[
                ('x', np.float32),
                ('y', np.float32),
                ('z', np.float32)
            ])
            points_out['x'] = xyz_ros_x
            points_out['y'] = xyz_ros_y
            points_out['z'] = xyz_ros_z

        header = msg.header
        header.frame_id = 'zed_camera_link'

        msg_out = pc2.create_cloud(header, fields, points_out)
        self.publisher.publish(msg_out)

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
