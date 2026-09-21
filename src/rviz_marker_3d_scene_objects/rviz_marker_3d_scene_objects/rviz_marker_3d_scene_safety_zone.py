#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import rclpy
from rclpy.node import Node
from visualization_msgs.msg import Marker, MarkerArray
from geometry_msgs.msg import Quaternion
from std_msgs.msg import Float32MultiArray

# =========================================================
# GLOBALE KONSTANTEN
# =========================================================
TARGET_FRAME = 'world'

class SceneSafetyZonePublisher(Node):
    """
    Knoten für die Visualisierung der Safety Zone:
    - Empfängt Safety-Zone-Parameter (x, y, radius) über /ui/safety_zone_params.
    - Publiziert eine dynamische, transparente grüne Zylinder-Markierung in RViz2.
    """
    def __init__(self):
        super().__init__('rviz_marker_3d_scene_safety_zone')

        # Publisher für visualization_marker_array
        self.publisher_ = self.create_publisher(MarkerArray, 'visualization_marker_array', 10)

        # Update-Loop (2 Hz / alle 0.5 Sek)
        self.timer_ = self.create_timer(0.5, self.update_safety_zone)

        # Safety Zone Parameter (Defaults)
        self.safe_x = 0.0
        self.safe_y = 0.0
        self.safe_radius = 0.20

        # Subscriber für Safety Zone Parameter vom UI
        self.safety_sub = self.create_subscription(
            Float32MultiArray,
            '/ui/safety_zone_params',
            self.safety_cb,
            10
        )

        self.get_logger().info('rviz_marker_3d_scene_safety_zone erfolgreich aktiv.')

    def safety_cb(self, msg):
        if len(msg.data) >= 3:
            self.safe_x = msg.data[0]
            self.safe_y = msg.data[1]
            self.safe_radius = msg.data[2]

    def update_safety_zone(self):
        marker_array = MarkerArray()

        m_safe = Marker()
        m_safe.header.frame_id = TARGET_FRAME
        # Zeitstempel 0 (Time().to_msg()), damit RViz immer die neueste TF nutzt (Anti-Flickering)
        m_safe.header.stamp = rclpy.time.Time().to_msg()
        m_safe.ns = "safety_zone"
        m_safe.id = 0
        m_safe.type = Marker.CYLINDER
        m_safe.action = Marker.ADD
        m_safe.pose.position.x = self.safe_x
        m_safe.pose.position.y = self.safe_y
        m_safe.pose.position.z = 0.0
        m_safe.pose.orientation = Quaternion(x=0.0, y=0.0, z=0.0, w=1.0)
        m_safe.scale.x = self.safe_radius * 2.0
        m_safe.scale.y = self.safe_radius * 2.0
        m_safe.scale.z = 0.001
        m_safe.color.r = 0.0
        m_safe.color.g = 1.0
        m_safe.color.b = 0.0
        m_safe.color.a = 0.2
        marker_array.markers.append(m_safe)

        self.publisher_.publish(marker_array)

def main(args=None):
    rclpy.init(args=args)
    node = SceneSafetyZonePublisher()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
