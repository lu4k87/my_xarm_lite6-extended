#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import rclpy
from rclpy.node import Node
from visualization_msgs.msg import Marker, MarkerArray
import math

from geometry_msgs.msg import Point, Quaternion
from std_msgs.msg import Float32MultiArray

# =========================================================
# GLOBALE KONSTANTEN
# =========================================================
TARGET_FRAME = 'world'
# Unerreichbare Zone um die Roboterachse, mit MoveIt vermessen (IK mit
# Kollisionspruefung, Greifer nach unten) - identisch mit UNREACHABLE_PROFILE
# in src/http_robot_control_ui_p8081/js/robot_limits.js. Paare (z, r) in m.
UNREACHABLE_PROFILE = [
    (0.000, 0.100), (0.060, 0.100), (0.080, 0.080), (0.240, 0.080),
    (0.260, 0.060), (0.280, 0.030), (0.300, 0.000),
]
SEGMENTS = 64

class SceneSafetyZonePublisher(Node):
    """
    Knoten für die Visualisierung der Safety Zone:
    - Empfängt Safety-Zone-Parameter (x, y, radius) über /ui/safety_zone_params.
    - Publiziert in RViz2 die unerreichbare Zone um die Roboterachse als
      roten Drehkoerper (vermessenes Profil, mit Konturringen) und den
      Bahnabstand der Scans (Safety-Zone-Radius) als flache orange Scheibe.
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
        # 138 mm - aeussere Grenze der wegen Singularitaet / Eigenkollision
        # nicht anfahrbaren Innenzone. Wird vom UI ueber
        # /ui/safety_zone_params ueberschrieben.
        self.safe_radius = 0.138

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

    def _marker(self, mid, mtype):
        m = Marker()
        m.header.frame_id = TARGET_FRAME
        # Zeitstempel 0 (Time().to_msg()), damit RViz immer die neueste TF nutzt (Anti-Flickering)
        m.header.stamp = rclpy.time.Time().to_msg()
        m.ns = "safety_zone"
        m.id = mid
        m.type = mtype
        m.action = Marker.ADD
        m.pose.orientation = Quaternion(x=0.0, y=0.0, z=0.0, w=1.0)
        return m

    def _disc(self, mid, radius, rgba):
        m = self._marker(mid, Marker.CYLINDER)
        m.pose.position.x = self.safe_x
        m.pose.position.y = self.safe_y
        m.pose.position.z = 0.0005
        m.scale.x = m.scale.y = radius * 2.0
        m.scale.z = 0.001
        m.color.r, m.color.g, m.color.b, m.color.a = rgba
        return m

    def _ring_points(self, m, radius, z, cx, cy):
        for i in range(SEGMENTS):
            for k in (i, i + 1):
                a = 2.0 * math.pi * k / SEGMENTS
                m.points.append(Point(x=cx + radius * math.cos(a), y=cy + radius * math.sin(a), z=z))

    def _lathe(self, mid, rgba):
        # Drehkoerper um die Roboterachse (world-Ursprung = link_base)
        m = self._marker(mid, Marker.TRIANGLE_LIST)
        m.scale.x = m.scale.y = m.scale.z = 1.0
        m.color.r, m.color.g, m.color.b, m.color.a = rgba
        prof = [(0.0, 0.0)] + UNREACHABLE_PROFILE
        for (z0, r0), (z1, r1) in zip(prof, prof[1:]):
            for i in range(SEGMENTS):
                a0 = 2.0 * math.pi * i / SEGMENTS
                a1 = 2.0 * math.pi * (i + 1) / SEGMENTS
                p00 = Point(x=r0 * math.cos(a0), y=r0 * math.sin(a0), z=z0)
                p01 = Point(x=r0 * math.cos(a1), y=r0 * math.sin(a1), z=z0)
                p10 = Point(x=r1 * math.cos(a0), y=r1 * math.sin(a0), z=z1)
                p11 = Point(x=r1 * math.cos(a1), y=r1 * math.sin(a1), z=z1)
                m.points.extend([p00, p01, p11, p00, p11, p10])
        return m

    def _contours(self, mid, rgba):
        m = self._marker(mid, Marker.LINE_LIST)
        m.scale.x = 0.002
        m.color.r, m.color.g, m.color.b, m.color.a = rgba
        for z, r in UNREACHABLE_PROFILE:
            if r > 0:
                self._ring_points(m, r, max(z, 0.001), 0.0, 0.0)
        return m

    def update_safety_zone(self):
        marker_array = MarkerArray()
        orange = (0.96, 0.62, 0.04)
        red = (0.94, 0.27, 0.27)
        # Alte ids 0-3 (Zylinder-Darstellung) werden durch diese ersetzt.
        marker_array.markers.append(self._disc(0, self.safe_radius, (*orange, 0.18)))
        ring = self._marker(1, Marker.LINE_LIST)
        ring.scale.x = 0.002
        ring.color.r, ring.color.g, ring.color.b, ring.color.a = (*orange, 0.8)
        self._ring_points(ring, self.safe_radius, 0.001, self.safe_x, self.safe_y)
        marker_array.markers.append(ring)
        marker_array.markers.append(self._lathe(2, (*red, 0.18)))
        marker_array.markers.append(self._contours(3, (*red, 0.85)))
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

