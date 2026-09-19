#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
RViz Object Distance Visualizer Node
Visualizes:
1. A thin, transparent, dashed 3D green line in RViz from link_tcp to the nearest YOLO detected object.
2. A 2D overlay in the top-left of the RViz viewport with millimeter distances and matching YOLO colors.
"""

import math
import rclpy
from rclpy.node import Node
from rclpy.duration import Duration
from geometry_msgs.msg import Point
from visualization_msgs.msg import Marker, MarkerArray
from rviz_2d_overlay_msgs.msg import OverlayText
from std_msgs.msg import ColorRGBA
import tf2_ros


class RvizObjectDistanceVisualizer(Node):
    def __init__(self):
        super().__init__('rviz_object_distance_visualizer')

        self.sub_markers = self.create_subscription(
            MarkerArray,
            '/zed/bboxes_3d',
            self.markers_callback,
            10
        )

        self.pub_markers = self.create_publisher(
            MarkerArray,
            '/rviz/gripper_object_distance',
            10
        )

        self.pub_overlay = self.create_publisher(
            OverlayText,
            '/rviz/gripper_object_distance_overlay',
            10
        )

        self.tf_buffer = tf2_ros.Buffer()
        self.tf_listener = tf2_ros.TransformListener(self.tf_buffer, self)

        # Priority: link_tcp first as requested by user, then fallbacks
        self.tcp_frames = [
            'link_tcp',
            'uflite_vacuum_gripper_link',
            'link_eef',
            'vacuum_gripper_link'
        ]

        self.last_detection_time = self.get_clock().now()
        self.is_active = False

        # Timeout timer (check every 0.5s if detections timed out)
        self.timer = self.create_timer(0.5, self.check_timeout)

        self.get_logger().info('RvizObjectDistanceVisualizer node started successfully.')

    def get_tcp_position(self):
        for frame in self.tcp_frames:
            try:
                trans = self.tf_buffer.lookup_transform(
                    'world',
                    frame,
                    rclpy.time.Time(),
                    timeout=Duration(seconds=0.05)
                )
                p = Point()
                p.x = trans.transform.translation.x
                p.y = trans.transform.translation.y
                p.z = trans.transform.translation.z
                return p, frame
            except Exception:
                continue
        return None, None

    def markers_callback(self, msg: MarkerArray):
        tcp_pos, used_frame = self.get_tcp_position()
        if tcp_pos is None:
            self.clear_all()
            return

        target_points = {}
        class_names = {}

        for marker in msg.markers:
            if marker.action == Marker.ADD:
                if marker.ns == 'yolo_object_grasp_center_point':
                    target_points[marker.id] = marker.pose.position
                elif marker.ns == 'yolo_labels_class':
                    class_names[marker.id] = marker.text

        if not target_points:
            self.clear_all()
            return

        # Find closest object to TCP
        closest_id = None
        min_dist = float('inf')
        closest_point = None

        for m_id, pt in target_points.items():
            dist = math.sqrt(
                (pt.x - tcp_pos.x) ** 2 +
                (pt.y - tcp_pos.y) ** 2 +
                (pt.z - tcp_pos.z) ** 2
            )
            if dist < min_dist:
                min_dist = dist
                closest_point = pt
                closest_id = m_id

        if closest_point is None:
            self.clear_all()
            return

        raw_name = class_names.get(closest_id, 'Object')
        obj_name = raw_name.replace('_', ' ').title()

        self.publish_visualization(tcp_pos, closest_point, min_dist, obj_name)
        self.last_detection_time = self.get_clock().now()
        self.is_active = True

    def publish_visualization(self, p1: Point, p2: Point, dist: float, obj_name: str):
        current_time = self.get_clock().now().to_msg()

        # 1. 3D Dashed Line Marker
        line_marker = Marker()
        line_marker.header.frame_id = 'world'
        line_marker.header.stamp = current_time
        line_marker.ns = 'distance_line'
        line_marker.id = 0
        line_marker.type = Marker.LINE_LIST
        line_marker.action = Marker.ADD

        # Thin and transparent
        line_marker.scale.x = 0.0018  # very thin
        line_marker.color.r = 0.0
        line_marker.color.g = 1.0
        line_marker.color.b = 0.0
        line_marker.color.a = 0.55  # slightly transparent green

        # Dashed line points: dash 1.5 cm, gap 1.0 cm
        dash_len = 0.015
        gap_len = 0.010
        step = dash_len + gap_len

        dx = p2.x - p1.x
        dy = p2.y - p1.y
        dz = p2.z - p1.z

        if dist > 0:
            ux = dx / dist
            uy = dy / dist
            uz = dz / dist

            cur_d = 0.0
            while cur_d < dist:
                seg_end_d = min(cur_d + dash_len, dist)

                pt_a = Point(
                    x=p1.x + ux * cur_d,
                    y=p1.y + uy * cur_d,
                    z=p1.z + uz * cur_d
                )
                pt_b = Point(
                    x=p1.x + ux * seg_end_d,
                    y=p1.y + uy * seg_end_d,
                    z=p1.z + uz * seg_end_d
                )

                line_marker.points.append(pt_a)
                line_marker.points.append(pt_b)

                cur_d += step

        if not line_marker.points:
            line_marker.points.append(p1)
            line_marker.points.append(p2)

        ma = MarkerArray()
        ma.markers.append(line_marker)
        self.pub_markers.publish(ma)

        # 2. 2D RViz Screen Overlay (top-left)
        dx_mm = int(abs(p2.x - p1.x) * 1000.0)
        dy_mm = int(abs(p2.y - p1.y) * 1000.0)
        dz_mm = int(abs(p2.z - p1.z) * 1000.0)
        d_mm = int(dist * 1000.0)

        overlay_msg = OverlayText()
        overlay_msg.action = OverlayText.ADD
        overlay_msg.horizontal_alignment = OverlayText.LEFT
        overlay_msg.vertical_alignment = OverlayText.TOP
        overlay_msg.horizontal_distance = 15  # margin left
        overlay_msg.vertical_distance = 15    # margin top

        overlay_msg.width = 180
        overlay_msg.height = 112
        overlay_msg.bg_color = ColorRGBA(r=0.0, g=0.0, b=0.0, a=0.35)
        overlay_msg.fg_color = ColorRGBA(r=1.0, g=1.0, b=1.0, a=1.0)
        overlay_msg.text_size = 10.0
        overlay_msg.font = "DejaVu Sans Mono"
        overlay_msg.line_width = 1

        # Tabular monospace formatting with right-aligned numbers (&nbsp; prevents HTML space collapsing)
        x_str = f"{dx_mm:>4d}".replace(' ', '&nbsp;')
        y_str = f"{dy_mm:>4d}".replace(' ', '&nbsp;')
        z_str = f"{dz_mm:>4d}".replace(' ', '&nbsp;')
        d_str = f"{d_mm:>4d}".replace(' ', '&nbsp;')

        # Formatted with clean table padding (top & left) and right-aligned measurements:
        # Distance to Object: (White)
        # <Object Name> (Purple / Lila: #d070ff)
        # X: Red (#ff4444)
        # Y: Green (#44ff44)
        # Z: Blue (#44aaff)
        # D: Yellow (#ffff44)
        overlay_msg.text = (
            '<table border="0" cellpadding="0" cellspacing="0" style="font-family: monospace; font-size: 10pt; line-height: 125%;">'
            '<tr><td style="padding-top: 7px; padding-left: 9px; padding-right: 9px; padding-bottom: 7px;">'
            f'<nobr><b style="color: #ffffff;">Distance to Object:</b></nobr><br>'
            f'<nobr><b style="color: #d070ff;">{obj_name}</b></nobr><br>'
            f'<nobr><span style="color: #ff4444;">X:&nbsp;{x_str}&nbsp;mm</span></nobr><br>'
            f'<nobr><span style="color: #44ff44;">Y:&nbsp;{y_str}&nbsp;mm</span></nobr><br>'
            f'<nobr><span style="color: #44aaff;">Z:&nbsp;{z_str}&nbsp;mm</span></nobr><br>'
            f'<nobr><span style="color: #ffff44;">D:&nbsp;{d_str}&nbsp;mm</span></nobr>'
            '</td></tr></table>'
        )

        self.pub_overlay.publish(overlay_msg)

    def clear_all(self):
        # Clear 3D Marker
        ma = MarkerArray()
        del_m = Marker()
        del_m.header.frame_id = 'world'
        del_m.header.stamp = self.get_clock().now().to_msg()
        del_m.ns = 'distance_line'
        del_m.id = 0
        del_m.action = Marker.DELETE
        ma.markers.append(del_m)
        self.pub_markers.publish(ma)

        # Clear 2D Overlay
        empty_overlay = OverlayText()
        empty_overlay.action = OverlayText.DELETE
        empty_overlay.horizontal_alignment = OverlayText.LEFT
        empty_overlay.vertical_alignment = OverlayText.TOP
        empty_overlay.text = ""
        self.pub_overlay.publish(empty_overlay)

        self.is_active = False

    def check_timeout(self):
        if self.is_active:
            now = self.get_clock().now()
            if (now - self.last_detection_time).nanoseconds > 1.5e9:  # 1.5 seconds timeout
                self.clear_all()


def main(args=None):
    rclpy.init(args=args)
    node = RvizObjectDistanceVisualizer()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
