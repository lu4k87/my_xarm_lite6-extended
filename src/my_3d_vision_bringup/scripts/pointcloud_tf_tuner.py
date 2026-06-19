#!/usr/bin/env python3
import sys
import os
import signal
import rclpy
from rclpy.node import Node
from tf2_ros import TransformBroadcaster
from geometry_msgs.msg import TransformStamped
import math
from PyQt5.QtWidgets import QApplication, QWidget, QVBoxLayout, QSlider, QLabel, QHBoxLayout, QDoubleSpinBox
from PyQt5.QtCore import Qt, QTimer

class TFTunerGUI(QWidget):
    def __init__(self, node):
        super().__init__()
        self.node = node
        self.initUI()
        
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.publish_tf)
        self.timer.start(50) # 20 Hz

    def initUI(self):
        self.setWindowTitle('ZED Camera TF Tuner')
        layout = QVBoxLayout()

        # Z Slider
        z_layout = QHBoxLayout()
        self.z_label = QLabel('Z (Height):')
        self.z_slider = QSlider(Qt.Horizontal)
        self.z_slider.setRange(0, 1000) # 0.0m to 1.0m
        self.z_slider.setValue(390)
        
        self.z_spin = QDoubleSpinBox()
        self.z_spin.setRange(0.0, 1.0)
        self.z_spin.setDecimals(3)
        self.z_spin.setSingleStep(0.01)
        self.z_spin.setSuffix(" m")
        self.z_spin.setValue(0.390)
        
        # Synchronize Slider and SpinBox
        self.z_slider.valueChanged.connect(lambda v: self.z_spin.setValue(v / 1000.0))
        self.z_spin.valueChanged.connect(lambda v: self.z_slider.setValue(int(v * 1000.0)))
        
        z_layout.addWidget(self.z_label)
        z_layout.addWidget(self.z_slider)
        z_layout.addWidget(self.z_spin)
        layout.addLayout(z_layout)

        # Roll Slider
        roll_layout = QHBoxLayout()
        self.roll_label = QLabel('Roll (Rotation X):')
        self.roll_slider = QSlider(Qt.Horizontal)
        self.roll_slider.setRange(-1800, 1800) # -180.0 to 180.0 degrees
        self.roll_slider.setValue(0)
        
        self.roll_spin = QDoubleSpinBox()
        self.roll_spin.setRange(-180.0, 180.0)
        self.roll_spin.setDecimals(1)
        self.roll_spin.setSingleStep(1.0)
        self.roll_spin.setSuffix("°")
        self.roll_spin.setValue(0.0)
        
        self.roll_slider.valueChanged.connect(lambda v: self.roll_spin.setValue(v / 10.0))
        self.roll_spin.valueChanged.connect(lambda v: self.roll_slider.setValue(int(v * 10.0)))
        
        roll_layout.addWidget(self.roll_label)
        roll_layout.addWidget(self.roll_slider)
        roll_layout.addWidget(self.roll_spin)
        layout.addLayout(roll_layout)

        # Pitch Slider
        pitch_layout = QHBoxLayout()
        self.pitch_label = QLabel('Pitch (Rotation Y):')
        self.pitch_slider = QSlider(Qt.Horizontal)
        self.pitch_slider.setRange(200, 700) # 20.0 to 70.0 degrees
        self.pitch_slider.setValue(450)
        
        self.pitch_spin = QDoubleSpinBox()
        self.pitch_spin.setRange(20.0, 70.0)
        self.pitch_spin.setDecimals(1)
        self.pitch_spin.setSingleStep(1.0)
        self.pitch_spin.setSuffix("°")
        self.pitch_spin.setValue(45.0)
        
        self.pitch_slider.valueChanged.connect(lambda v: self.pitch_spin.setValue(v / 10.0))
        self.pitch_spin.valueChanged.connect(lambda v: self.pitch_slider.setValue(int(v * 10.0)))
        
        pitch_layout.addWidget(self.pitch_label)
        pitch_layout.addWidget(self.pitch_slider)
        pitch_layout.addWidget(self.pitch_spin)
        layout.addLayout(pitch_layout)
        
        # Yaw Slider
        yaw_layout = QHBoxLayout()
        self.yaw_label = QLabel('Yaw (Rotation Z):')
        self.yaw_slider = QSlider(Qt.Horizontal)
        self.yaw_slider.setRange(900, 2700) # 90.0 to 270.0 degrees
        self.yaw_slider.setValue(1800)
        
        self.yaw_spin = QDoubleSpinBox()
        self.yaw_spin.setRange(90.0, 270.0)
        self.yaw_spin.setDecimals(1)
        self.yaw_spin.setSingleStep(1.0)
        self.yaw_spin.setSuffix("°")
        self.yaw_spin.setValue(180.0)
        
        self.yaw_slider.valueChanged.connect(lambda v: self.yaw_spin.setValue(v / 10.0))
        self.yaw_spin.valueChanged.connect(lambda v: self.yaw_slider.setValue(int(v * 10.0)))
        
        yaw_layout.addWidget(self.yaw_label)
        yaw_layout.addWidget(self.yaw_slider)
        yaw_layout.addWidget(self.yaw_spin)
        layout.addLayout(yaw_layout)
        
        # X Slider
        x_layout = QHBoxLayout()
        self.x_label = QLabel('X (Forward/Backward):')
        self.x_slider = QSlider(Qt.Horizontal)
        self.x_slider.setRange(500, 1000) # 0.5m to 1.0m
        self.x_slider.setValue(650)
        
        self.x_spin = QDoubleSpinBox()
        self.x_spin.setRange(0.5, 1.0)
        self.x_spin.setDecimals(3)
        self.x_spin.setSingleStep(0.01)
        self.x_spin.setSuffix(" m")
        self.x_spin.setValue(0.650)
        
        self.x_slider.valueChanged.connect(lambda v: self.x_spin.setValue(v / 1000.0))
        self.x_spin.valueChanged.connect(lambda v: self.x_slider.setValue(int(v * 1000.0)))
        
        x_layout.addWidget(self.x_label)
        x_layout.addWidget(self.x_slider)
        x_layout.addWidget(self.x_spin)
        layout.addLayout(x_layout)

        self.setLayout(layout)
        self.resize(550, 250)

    def publish_tf(self):
        z_val = self.z_slider.value() / 1000.0
        roll_deg = self.roll_slider.value() / 10.0
        pitch_deg = self.pitch_slider.value() / 10.0
        yaw_deg = self.yaw_slider.value() / 10.0
        x_val = self.x_slider.value() / 1000.0
        
        roll_rad = math.radians(roll_deg)
        pitch_rad = math.radians(pitch_deg)
        yaw_rad = math.radians(yaw_deg)

        t = TransformStamped()
        t.header.stamp = self.node.get_clock().now().to_msg()
        t.header.frame_id = 'link_base'
        t.child_frame_id = 'zed_camera_link'

        t.transform.translation.x = x_val
        t.transform.translation.y = 0.0
        t.transform.translation.z = z_val

        # Euler to Quaternion (Roll, Pitch, Yaw)
        cy = math.cos(yaw_rad * 0.5)
        sy = math.sin(yaw_rad * 0.5)
        cp = math.cos(pitch_rad * 0.5)
        sp = math.sin(pitch_rad * 0.5)
        cr = math.cos(roll_rad * 0.5)
        sr = math.sin(roll_rad * 0.5)

        t.transform.rotation.w = cr * cp * cy + sr * sp * sy
        t.transform.rotation.x = sr * cp * cy - cr * sp * sy
        t.transform.rotation.y = cr * sp * cy + sr * cp * sy
        t.transform.rotation.z = cr * cp * sy - sr * sp * cy

        self.node.tf_broadcaster.sendTransform(t)

class TFTunerNode(Node):
    def __init__(self):
        super().__init__('tf_tuner_node')
        self.tf_broadcaster = TransformBroadcaster(self)

def main(args=None):
    rclpy.init(args=args)
    
    # Kill the static TF publisher from the launch file to prevent flickering / jumping
    os.system("pkill -f 'static_transform_publisher.*zed_camera_link'")
    
    node = TFTunerNode()
    
    app = QApplication(sys.argv)
    
    # Strg+C (SIGINT) an Python durchreichen, damit die GUI im Terminal killbar bleibt
    signal.signal(signal.SIGINT, signal.SIG_DFL)
    
    gui = TFTunerGUI(node)
    gui.show()
    
    # Process ROS callbacks inside the Qt event loop safely
    def ros_spin():
        if rclpy.ok():
            rclpy.spin_once(node, timeout_sec=0.01)
    
    timer = QTimer()
    timer.timeout.connect(ros_spin)
    timer.start(10)
    
    # Skript blockieren, bis Fenster geschlossen wird
    exit_code = app.exec_()
    
    # === SAUBERES AUFRÄUMEN (Verhindert den Segfault) ===
    timer.stop()
    gui.timer.stop()
    node.destroy_node()
    
    if rclpy.ok():
        rclpy.shutdown()
    
    sys.exit(exit_code)

if __name__ == '__main__':
    main()
