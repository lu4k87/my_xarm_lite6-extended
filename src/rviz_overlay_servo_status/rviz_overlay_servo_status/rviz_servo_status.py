#!/usr/bin/env python3

import rclpy
from rclpy.node import Node
from rviz_2d_overlay_msgs.msg import OverlayText
from std_msgs.msg import ColorRGBA
from std_msgs.msg import Int8, String
import time

class RvizServoStatusOverlayNode(Node):
    def __init__(self):
        super().__init__('rviz_overlay_servo_status_node')

        self.warning_publisher = self.create_publisher(OverlayText, '/ui/rviz_overlay_warning', 10)
        self.banner_publisher = self.create_publisher(OverlayText, '/ui/rviz_overlay_warning_banner', 10)
        
        self.status_sub = self.create_subscription(
            Int8,
            '/servo_server/status',
            self.status_callback,
            10
        )
        self.plane_col_sub = self.create_subscription(
            String,
            '/ui/collision_msg',
            self.plane_collision_callback,
            10
        )

        self.singularity_active = False
        self.servo_collision_active = False
        self.plane_collision_active = False

        self.last_singularity_time = 0.0
        self.last_servo_collision_time = 0.0
        
        # 10 Hz Update Rate
        self.timer = self.create_timer(0.1, self.timer_callback)
        self.get_logger().info('RViz Servo Status Warning Overlay Node gestartet.')

    def status_callback(self, msg):
        # MoveIt Servo Status:
        # 1: APPROACHING SINGULARITY
        # 2: HALT: SINGULARITY
        # 3: APPROACHING COLLISION
        # 4: HALT: COLLISION
        # 5: HALT: JOINT BOUND
        now = time.time()
        if msg.data in (1, 2):
            self.singularity_active = True
            self.last_singularity_time = now
        elif msg.data in (3, 4):
            self.servo_collision_active = True
            self.last_servo_collision_time = now
        elif msg.data == 0:
            self.singularity_active = False
            self.servo_collision_active = False
            self.last_singularity_time = 0.0
            self.last_servo_collision_time = 0.0

    def plane_collision_callback(self, msg):
        self.plane_collision_active = bool(msg.data and msg.data.strip())

    def timer_callback(self):
        try:
            now = time.time()
            # Timeout nach 1.5s ohne erneute Servo-Warnung
            if self.singularity_active and (now - self.last_singularity_time > 1.5):
                self.singularity_active = False
            if self.servo_collision_active and (now - self.last_servo_collision_time > 1.5):
                self.servo_collision_active = False

            collision_active = self.servo_collision_active or self.plane_collision_active
            singularity_active = self.singularity_active

            # 2D RViz Screen Overlay (top-right)
            warn_msg = OverlayText()
            warn_msg.action = OverlayText.ADD
            warn_msg.horizontal_alignment = OverlayText.RIGHT
            warn_msg.vertical_alignment = OverlayText.TOP
            warn_msg.horizontal_distance = 15  # margin right
            warn_msg.vertical_distance = 15    # margin top

            warn_msg.width = 146
            warn_msg.height = 64
            warn_msg.bg_color = ColorRGBA(r=0.0, g=0.0, b=0.0, a=0.35)
            warn_msg.fg_color = ColorRGBA(r=1.0, g=1.0, b=1.0, a=1.0)
            warn_msg.text_size = 9.5
            warn_msg.font = "DejaVu Sans Mono"
            warn_msg.line_width = 1

            # Tabular formatting matching the top-left distance overlay:
            # Monospace alignment:
            # "Singularity: " -> 13 chars
            # "Collision:   " -> 13 chars
            # "Off" / "On "   -> 3 chars
            sing_val = "On&nbsp;" if singularity_active else "Off"
            sing_col = "#ff4444" if singularity_active else "#44ff44"

            col_val = "On&nbsp;" if collision_active else "Off"
            col_col = "#ff4444" if collision_active else "#44ff44"

            warn_msg.text = (
                '<table border="0" cellpadding="0" cellspacing="0" style="font-family: \'DejaVu Sans Mono\', monospace; font-size: 9.5pt; font-weight: 300; line-height: 125%;">'
                '<tr><td style="padding-top: 6px; padding-left: 8px; padding-right: 8px; padding-bottom: 6px;">'
                '<nobr><span style="color: #ffffff; font-weight: 300;">Warnings:</span></nobr><br>'
                f'<nobr><span style="color: #cccccc; font-weight: 300;">Singularity:&nbsp;</span><span style="color: {sing_col}; font-weight: 300;">{sing_val}</span></nobr><br>'
                f'<nobr><span style="color: #cccccc; font-weight: 300;">Collision:&nbsp;&nbsp;&nbsp;</span><span style="color: {col_col}; font-weight: 300;">{col_val}</span></nobr>'
                '</td></tr></table>'
            )

            self.warning_publisher.publish(warn_msg)

        except Exception:
            pass

def main(args=None):
    rclpy.init(args=args)
    node = RvizServoStatusOverlayNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
