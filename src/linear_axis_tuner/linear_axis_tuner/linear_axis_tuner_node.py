#!/usr/bin/env python3

import sys
import rclpy
from rclpy.node import Node
from PyQt5.QtWidgets import QApplication, QWidget, QVBoxLayout, QLabel, QSlider
from PyQt5.QtCore import Qt, QTimer
from geometry_msgs.msg import TransformStamped
from tf2_ros import TransformBroadcaster
from visualization_msgs.msg import Marker

class LinearAxisTuner(Node):
    def __init__(self):
        super().__init__('linear_axis_tuner')
        self.tf_broadcaster = TransformBroadcaster(self)
        self.marker_pub = self.create_publisher(Marker, '/visualization_marker', 10)
        self.current_position = 0.0

        # PyQt5 Setup
        self.app = QApplication(sys.argv)
        self.window = QWidget()
        self.window.setWindowTitle('Linear Axis Tuner (FAKE Mode)')
        self.window.resize(400, 150)

        layout = QVBoxLayout()
        
        self.label = QLabel("Linear Axis Position (Y-Axis): 0.00 m")
        self.label.setAlignment(Qt.AlignCenter)
        self.label.setStyleSheet("font-size: 14px; font-weight: bold;")
        layout.addWidget(self.label)

        self.slider = QSlider(Qt.Horizontal)
        self.slider.setMinimum(-500) # -0.5m
        self.slider.setMaximum(500)  # +0.5m
        self.slider.setValue(0)
        self.slider.setTickPosition(QSlider.TicksBelow)
        self.slider.setTickInterval(100)
        self.slider.valueChanged.connect(self.on_slider_changed)
        layout.addWidget(self.slider)

        self.window.setLayout(layout)
        self.window.show()

        # Timer to spin ROS 2 and publish TF
        self.timer = QTimer()
        self.timer.timeout.connect(self.spin_and_publish)
        self.timer.start(50) # 20 Hz

    def on_slider_changed(self, value):
        self.current_position = value / 1000.0
        self.label.setText(f"Linear Axis Position (Y-Axis): {self.current_position:.2f} m")

    def spin_and_publish(self):
        rclpy.spin_once(self, timeout_sec=0)
        
        t = TransformStamped()
        t.header.stamp = self.get_clock().now().to_msg()
        t.header.frame_id = 'world'
        t.child_frame_id = 'linear_axis_link'
        
        # Verschiebung auf der Y-Achse
        t.transform.translation.x = 0.0
        t.transform.translation.y = self.current_position
        t.transform.translation.z = 0.0
        
        t.transform.rotation.x = 0.0
        t.transform.rotation.y = 0.0
        t.transform.rotation.z = 0.0
        t.transform.rotation.w = 1.0

        self.tf_broadcaster.sendTransform(t)

        # Publish visual marker for the rail
        marker = Marker()
        marker.header.stamp = self.get_clock().now().to_msg()
        marker.header.frame_id = 'world'
        marker.ns = 'linear_axis_rail'
        marker.id = 0
        marker.type = Marker.CUBE
        marker.action = Marker.ADD
        marker.pose.position.x = 0.0
        marker.pose.position.y = 0.0
        marker.pose.position.z = -0.025
        marker.pose.orientation.w = 1.0
        marker.scale.x = 0.12 # width
        marker.scale.y = 1.2  # length
        marker.scale.z = 0.05 # height
        marker.color.r = 0.3
        marker.color.g = 0.3
        marker.color.b = 0.3
        marker.color.a = 1.0
        self.marker_pub.publish(marker)

    def run(self):
        sys.exit(self.app.exec_())

def main(args=None):
    rclpy.init(args=args)
    tuner = LinearAxisTuner()
    tuner.run()
    tuner.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
