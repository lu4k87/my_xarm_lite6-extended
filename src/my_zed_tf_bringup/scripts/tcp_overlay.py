#!/usr/bin/env python3

import rclpy
from rclpy.node import Node
from tf2_ros import Buffer, TransformListener
from rviz_2d_overlay_msgs.msg import OverlayText
from std_msgs.msg import ColorRGBA

class TcpOverlayNode(Node):
    def __init__(self):
        super().__init__('tcp_overlay_node')

        self.tf_buffer = Buffer()
        self.tf_listener = TransformListener(self.tf_buffer, self)

        self.publisher = self.create_publisher(OverlayText, '/ui/tcp_overlay', 10)
        
        # 10 Hz Update Rate
        self.timer = self.create_timer(0.1, self.timer_callback)
        self.get_logger().info('TCP 2D Overlay Node gestartet.')

    def timer_callback(self):
        try:
            # Hole den aktuellen TCP (Endeffektor) TF relativ zur Roboter-Basis
            trans = self.tf_buffer.lookup_transform('link_base', 'link_eef', rclpy.time.Time())
            
            x_mm = int(trans.transform.translation.x * 1000.0)
            y_mm = int(trans.transform.translation.y * 1000.0)
            z_mm = int(trans.transform.translation.z * 1000.0)
            
            msg = OverlayText()
            msg.action = OverlayText.ADD
            
            # Positionierung: Oben Rechts im RViz-Fenster
            msg.horizontal_alignment = OverlayText.RIGHT
            msg.vertical_alignment = OverlayText.TOP
            msg.horizontal_distance = 10  # 10px Abstand vom rechten Rand
            msg.vertical_distance = 10    # 10px Abstand vom oberen Rand
            
            # Banner-Größe: -1 bedeutet automatische Anpassung an die Textgröße!
            msg.width = -1
            msg.height = -1
            
            # Hintergrund: Schwarz, leicht transparent (60%)
            msg.bg_color = ColorRGBA(r=0.0, g=0.0, b=0.0, a=0.6)
            
            # Text-Eigenschaften (als Fallback)
            msg.fg_color = ColorRGBA(r=1.0, g=1.0, b=1.0, a=1.0)
            msg.text_size = 14.0
            msg.font = "DejaVu Sans"
            msg.line_width = 2
            
            # HTML Rich-Text Formatierung für RViz Overlay (X=Rot, Y=Grün, Z=Blau)
            # Das <nobr> Tag verhindert Zeilenumbrüche strikt.
            html_text = (
                f'<nobr>'
                f'<span style="color:#ffffff;">EEF: tcp_link &nbsp;&nbsp;|&nbsp;&nbsp; </span>'
                f'<span style="color:#ff4444;">X: {x_mm} mm</span>'
                f' &nbsp;&nbsp;|&nbsp;&nbsp; '
                f'<span style="color:#44ff44;">Y: {y_mm} mm</span>'
                f' &nbsp;&nbsp;|&nbsp;&nbsp; '
                f'<span style="color:#44bbff;">Z: {z_mm} mm</span>'
                f'</nobr>'
            )
            
            msg.text = html_text
            
            self.publisher.publish(msg)
            
        except Exception as e:
            # Logge Fehler nur gelegentlich oder ignoriere sie (z.B. wenn TF noch nicht bereit ist)
            pass

def main(args=None):
    rclpy.init(args=args)
    node = TcpOverlayNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
