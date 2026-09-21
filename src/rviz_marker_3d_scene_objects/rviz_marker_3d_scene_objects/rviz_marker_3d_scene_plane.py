#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import math
import rclpy
from rclpy.node import Node
from visualization_msgs.msg import Marker, MarkerArray
from geometry_msgs.msg import Quaternion
import tf2_ros
from tf2_ros import TransformException

# =========================================================
# GLOBALE KONSTANTEN
# =========================================================
TARGET_FRAME = 'world'
PLANE_TF_FRAME = 'target_white_plane'

# Template Plane: DIN A4 (0.21 x 0.30 m, 1 mm dick), z=-0.003 (direkt auf Tisch)
DEFAULT_POS = (0.305, 0.0, -0.003)
DEFAULT_YAW = 0.0
PLANE_DIMS = (0.21, 0.3, 0.001)
PLANE_COLOR = [1.0, 1.0, 1.0, 1.0]
PLANE_MARKER_ID = 14

class ScenePlaneMarkerPublisher(Node):
    """
    Knoten für die Visualisierung der 3D-Szenen-Plane (Papier-/Tisch-Schablone):
    - Publiziert die Template Plane (target_white_plane) als RViz CUBE Marker.
    - Hört auf TF target_white_plane (gesteuert z. B. über TF Tuner).
    - Verwendet einen statischen Fallback, falls kein TF aktiv ist.
    """
    def __init__(self):
        super().__init__('rviz_marker_3d_scene_plane')

        # Publisher für visualization_marker_array
        self.publisher_ = self.create_publisher(MarkerArray, 'visualization_marker_array', 10)

        # Update-Loop (2 Hz / alle 0.5 Sek)
        self.timer_ = self.create_timer(0.5, self.update_plane)

        # TF-Infrastruktur
        self.tf_buffer = tf2_ros.Buffer()
        self.tf_listener = tf2_ros.TransformListener(self.tf_buffer, self)

        # Letzte bekannte Pose
        self.last_pos = {
            'x': DEFAULT_POS[0],
            'y': DEFAULT_POS[1],
            'z': DEFAULT_POS[2],
            'yaw': DEFAULT_YAW
        }

        self.get_logger().info('rviz_marker_3d_scene_plane erfolgreich aktiv.')

    def update_plane(self):
        # TF Abfrage mit Fallback
        try:
            t = self.tf_buffer.lookup_transform(TARGET_FRAME, PLANE_TF_FRAME, rclpy.time.Time())
            self.last_pos['x'] = t.transform.translation.x
            self.last_pos['y'] = t.transform.translation.y
            self.last_pos['z'] = t.transform.translation.z
            q = t.transform.rotation
            self.last_pos['yaw'] = math.atan2(2.0 * (q.w * q.z + q.x * q.y), 1.0 - 2.0 * (q.y * q.y + q.z * q.z))
        except TransformException:
            pass

        x = self.last_pos['x']
        y = self.last_pos['y']
        z = self.last_pos['z']
        yaw = self.last_pos['yaw']

        rot_q = Quaternion(x=0.0, y=0.0, z=math.sin(yaw / 2.0), w=math.cos(yaw / 2.0))

        marker = Marker()
        marker.header.frame_id = TARGET_FRAME
        # Zeitstempel 0 (Time().to_msg()), damit RViz immer die neueste TF nutzt (Anti-Flickering)
        marker.header.stamp = rclpy.time.Time().to_msg()
        marker.ns = "static_scene"
        marker.id = PLANE_MARKER_ID
        marker.type = Marker.CUBE
        marker.action = Marker.ADD
        marker.pose.position.x = float(x)
        marker.pose.position.y = float(y)
        marker.pose.position.z = float(z)
        marker.pose.orientation = rot_q
        marker.scale.x = float(PLANE_DIMS[0])
        marker.scale.y = float(PLANE_DIMS[1])
        marker.scale.z = float(PLANE_DIMS[2])
        marker.color.r = float(PLANE_COLOR[0])
        marker.color.g = float(PLANE_COLOR[1])
        marker.color.b = float(PLANE_COLOR[2])
        marker.color.a = float(PLANE_COLOR[3])

        marker_array = MarkerArray()
        marker_array.markers.append(marker)
        self.publisher_.publish(marker_array)

def main(args=None):
    rclpy.init(args=args)
    node = ScenePlaneMarkerPublisher()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
