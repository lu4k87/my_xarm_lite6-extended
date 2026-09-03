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
        self.warning_msg = ""
        self.warning_time = 0.0
        
        # 10 Hz Update Rate
        self.timer = self.create_timer(0.1, self.timer_callback)
        self.get_logger().info('RViz Servo Status Warning Overlay Node gestartet.')

    def status_callback(self, msg):
        status_map = {
            1: "APPROACHING SINGULARITY",
            2: "HALT: SINGULARITY",
            3: "APPROACHING COLLISION",
            4: "HALT: COLLISION",
            5: "HALT: JOINT BOUND"
        }
        if msg.data in status_map:
            self.warning_msg = status_map[msg.data]
            self.warning_time = time.time()

    def plane_collision_callback(self, msg):
        if msg.data:
            self.warning_msg = msg.data.upper() # e.g. "PLANE COLLISION!"
            self.warning_time = time.time()
        else:
            # Wenn Leerstring, setze Overlay zurück (sofern es noch von Plane Collision ist)
            if "PLANE" in self.warning_msg:
                self.warning_msg = ""
                warn_msg = OverlayText()
                warn_msg.action = OverlayText.DELETE
                self.warning_publisher.publish(warn_msg)

    def timer_callback(self):
        try:
            # Warning Overlay Update
            if self.warning_msg:
                time_since_warning = time.time() - self.warning_time
                if time_since_warning < 2.0:
                    warn_msg = OverlayText()
                    warn_msg.action = OverlayText.ADD
                    warn_msg.horizontal_alignment = OverlayText.CENTER
                    warn_msg.vertical_alignment = OverlayText.CENTER
                    warn_msg.horizontal_distance = 0
                    warn_msg.vertical_distance = 0
                    warn_msg.width = 600
                    warn_msg.height = 60
                    
                    if "HALT" in self.warning_msg or "PLANE" in self.warning_msg or "APPROACHING COLLISION" in self.warning_msg:
                        warn_msg.bg_color = ColorRGBA(r=1.0, g=0.0, b=0.0, a=0.8) # Rot
                        warn_msg.fg_color = ColorRGBA(r=1.0, g=1.0, b=1.0, a=1.0)
                    else:
                        warn_msg.bg_color = ColorRGBA(r=1.0, g=0.5, b=0.0, a=0.8) # Orange
                        warn_msg.fg_color = ColorRGBA(r=0.0, g=0.0, b=0.0, a=1.0)
                        
                    warn_msg.text_size = 14.0
                    warn_msg.font = "monospace"
                    warn_msg.line_width = 1
                    
                    html_text = (
                        f'<div align="center" style="margin-top: 10px;">'
                        f'<b><span style="font-size: 16pt;">⚠️ WARNING: {self.warning_msg} ⚠️</span></b>'
                        f'</div>'
                    )
                    warn_msg.text = html_text
                    self.warning_publisher.publish(warn_msg)
                else:
                    # Ausblenden nach 2 Sekunden
                    warn_msg = OverlayText()
                    warn_msg.action = OverlayText.DELETE
                    self.warning_publisher.publish(warn_msg)
                    self.warning_msg = ""
            
        except Exception as e:
            pass

def main(args=None):
    rclpy.init(args=args)
    node = RvizServoStatusOverlayNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
