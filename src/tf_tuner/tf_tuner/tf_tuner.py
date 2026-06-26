#!/usr/bin/env python3
import sys
import os
import signal
import rclpy
from rclpy.node import Node
from tf2_ros import TransformBroadcaster
from geometry_msgs.msg import TransformStamped
import math
from PyQt5.QtWidgets import QApplication, QWidget, QVBoxLayout, QSlider, QLabel, QHBoxLayout, QDoubleSpinBox, QComboBox
from PyQt5.QtCore import Qt, QTimer

class TFTunerGUI(QWidget):
    def __init__(self, node):
        super().__init__()
        self.node = node
        
        self.elements = {
            'Zed M Camera': {
                'frame_id': 'zed_camera_link',
                'x': 650, 'y': 0, 'z': 390,
                'roll': 0, 'pitch': 450, 'yaw': 1800
            },
            'Blue Cube': {
                'frame_id': 'target_blue_cube',
                'x': 174, 'y': 82, 'z': 0,
                'roll': 0, 'pitch': 0, 'yaw': 0
            },
            'Red Rectangle': {
                'frame_id': 'target_red_rectangle',
                'x': 219, 'y': -83, 'z': 0,
                'roll': 0, 'pitch': 0, 'yaw': -450
            },
            'Green Cylinder': {
                'frame_id': 'target_green_cylinder',
                'x': 274, 'y': 18, 'z': 0,
                'roll': 0, 'pitch': 0, 'yaw': 0
            },
            'White Plane': {
                'frame_id': 'target_white_plane',
                'x': 220, 'y': 0, 'z': -3,
                'roll': 0, 'pitch': 0, 'yaw': 0
            }
        }
        self.current_selection = 'Zed M Camera'
        
        self.initUI()
        
        # State tracking for logging
        self.last_log_values = None

        self.timer = QTimer(self)
        self.timer.timeout.connect(self.publish_tf)
        self.timer.start(50) # 20 Hz

    def initUI(self):
        self.setWindowTitle('3D Elements TF Tuner')
        layout = QVBoxLayout()
        
        # Dropdown Menu
        self.combo_box = QComboBox()
        self.combo_box.addItems(self.elements.keys())
        self.combo_box.currentTextChanged.connect(self.on_selection_changed)
        layout.addWidget(self.combo_box)

        # X Slider
        x_layout = QHBoxLayout()
        self.x_label = QLabel('X (Forward/Backward):')
        self.x_slider = QSlider(Qt.Horizontal)
        self.x_slider.setRange(-500, 1000) # -0.5m to 1.0m
        self.x_slider.setValue(self.elements[self.current_selection]['x'])
        
        self.x_spin = QDoubleSpinBox()
        self.x_spin.setRange(-0.5, 1.0)
        self.x_spin.setDecimals(3)
        self.x_spin.setSingleStep(0.01)
        self.x_spin.setSuffix(" m")
        self.x_spin.setValue(self.elements[self.current_selection]['x'] / 1000.0)
        
        self.x_slider.valueChanged.connect(lambda v: self.x_spin.setValue(v / 1000.0))
        self.x_spin.valueChanged.connect(lambda v: self.x_slider.setValue(int(v * 1000.0)))
        
        x_layout.addWidget(self.x_label)
        x_layout.addWidget(self.x_slider)
        x_layout.addWidget(self.x_spin)
        layout.addLayout(x_layout)
        
        # Y Slider
        y_layout = QHBoxLayout()
        self.y_label = QLabel('Y (Left/Right):')
        self.y_slider = QSlider(Qt.Horizontal)
        self.y_slider.setRange(-500, 500) # -0.5m to 0.5m
        self.y_slider.setValue(self.elements[self.current_selection]['y'])
        
        self.y_spin = QDoubleSpinBox()
        self.y_spin.setRange(-0.5, 0.5)
        self.y_spin.setDecimals(3)
        self.y_spin.setSingleStep(0.01)
        self.y_spin.setSuffix(" m")
        self.y_spin.setValue(self.elements[self.current_selection]['y'] / 1000.0)
        
        self.y_slider.valueChanged.connect(lambda v: self.y_spin.setValue(v / 1000.0))
        self.y_spin.valueChanged.connect(lambda v: self.y_slider.setValue(int(v * 1000.0)))
        
        y_layout.addWidget(self.y_label)
        y_layout.addWidget(self.y_slider)
        y_layout.addWidget(self.y_spin)
        layout.addLayout(y_layout)

        # Z Slider
        z_layout = QHBoxLayout()
        self.z_label = QLabel('Z (Height):')
        self.z_slider = QSlider(Qt.Horizontal)
        self.z_slider.setRange(-500, 1000) # -0.5m to 1.0m
        self.z_slider.setValue(self.elements[self.current_selection]['z'])
        
        self.z_spin = QDoubleSpinBox()
        self.z_spin.setRange(-0.5, 1.0)
        self.z_spin.setDecimals(3)
        self.z_spin.setSingleStep(0.01)
        self.z_spin.setSuffix(" m")
        self.z_spin.setValue(self.elements[self.current_selection]['z'] / 1000.0)
        
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
        self.roll_slider.setValue(self.elements[self.current_selection]['roll'])
        
        self.roll_spin = QDoubleSpinBox()
        self.roll_spin.setRange(-180.0, 180.0)
        self.roll_spin.setDecimals(1)
        self.roll_spin.setSingleStep(1.0)
        self.roll_spin.setSuffix("°")
        self.roll_spin.setValue(self.elements[self.current_selection]['roll'] / 10.0)
        
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
        self.pitch_slider.setRange(-1800, 1800) # -180.0 to 180.0 degrees
        self.pitch_slider.setValue(self.elements[self.current_selection]['pitch'])
        
        self.pitch_spin = QDoubleSpinBox()
        self.pitch_spin.setRange(-180.0, 180.0)
        self.pitch_spin.setDecimals(1)
        self.pitch_spin.setSingleStep(1.0)
        self.pitch_spin.setSuffix("°")
        self.pitch_spin.setValue(self.elements[self.current_selection]['pitch'] / 10.0)
        
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
        self.yaw_slider.setRange(-1800, 2700) # -180.0 to 270.0 degrees
        self.yaw_slider.setValue(self.elements[self.current_selection]['yaw'])
        
        self.yaw_spin = QDoubleSpinBox()
        self.yaw_spin.setRange(-180.0, 270.0)
        self.yaw_spin.setDecimals(1)
        self.yaw_spin.setSingleStep(1.0)
        self.yaw_spin.setSuffix("°")
        self.yaw_spin.setValue(self.elements[self.current_selection]['yaw'] / 10.0)
        
        self.yaw_slider.valueChanged.connect(lambda v: self.yaw_spin.setValue(v / 10.0))
        self.yaw_spin.valueChanged.connect(lambda v: self.yaw_slider.setValue(int(v * 10.0)))
        
        yaw_layout.addWidget(self.yaw_label)
        yaw_layout.addWidget(self.yaw_slider)
        yaw_layout.addWidget(self.yaw_spin)
        layout.addLayout(yaw_layout)

        self.setLayout(layout)
        self.resize(550, 300)

    def on_selection_changed(self, text):
        # Save current state
        self.elements[self.current_selection]['x'] = self.x_slider.value()
        self.elements[self.current_selection]['y'] = self.y_slider.value()
        self.elements[self.current_selection]['z'] = self.z_slider.value()
        self.elements[self.current_selection]['roll'] = self.roll_slider.value()
        self.elements[self.current_selection]['pitch'] = self.pitch_slider.value()
        self.elements[self.current_selection]['yaw'] = self.yaw_slider.value()
        
        # Update selection
        self.current_selection = text
        
        # Temporarily block signals to avoid triggering valueChanged events
        self.x_slider.blockSignals(True)
        self.y_slider.blockSignals(True)
        self.z_slider.blockSignals(True)
        self.roll_slider.blockSignals(True)
        self.pitch_slider.blockSignals(True)
        self.yaw_slider.blockSignals(True)
        
        # Load new state
        self.x_slider.setValue(self.elements[text]['x'])
        self.y_slider.setValue(self.elements[text]['y'])
        self.z_slider.setValue(self.elements[text]['z'])
        self.roll_slider.setValue(self.elements[text]['roll'])
        self.pitch_slider.setValue(self.elements[text]['pitch'])
        self.yaw_slider.setValue(self.elements[text]['yaw'])
        
        # Unblock signals
        self.x_slider.blockSignals(False)
        self.y_slider.blockSignals(False)
        self.z_slider.blockSignals(False)
        self.roll_slider.blockSignals(False)
        self.pitch_slider.blockSignals(False)
        self.yaw_slider.blockSignals(False)
        
        # Manually trigger updates for spinboxes
        self.x_spin.setValue(self.elements[text]['x'] / 1000.0)
        self.y_spin.setValue(self.elements[text]['y'] / 1000.0)
        self.z_spin.setValue(self.elements[text]['z'] / 1000.0)
        self.roll_spin.setValue(self.elements[text]['roll'] / 10.0)
        self.pitch_spin.setValue(self.elements[text]['pitch'] / 10.0)
        self.yaw_spin.setValue(self.elements[text]['yaw'] / 10.0)
        
        self.last_log_values = None # Force log update

    def publish_tf(self):
        # Update currently selected element with live slider values
        self.elements[self.current_selection]['x'] = self.x_slider.value()
        self.elements[self.current_selection]['y'] = self.y_slider.value()
        self.elements[self.current_selection]['z'] = self.z_slider.value()
        self.elements[self.current_selection]['roll'] = self.roll_slider.value()
        self.elements[self.current_selection]['pitch'] = self.pitch_slider.value()
        self.elements[self.current_selection]['yaw'] = self.yaw_slider.value()

        # Log only if current selection changed
        sel = self.elements[self.current_selection]
        current_values = (sel['x'], sel['y'], sel['z'], sel['roll'], sel['pitch'], sel['yaw'])
        if current_values != self.last_log_values:
            self.node.get_logger().info(
                f"[{self.current_selection}] X: {sel['x']/1000.0:.3f}m | Y: {sel['y']/1000.0:.3f}m | Z: {sel['z']/1000.0:.3f}m | Roll: {sel['roll']/10.0:.1f}° | Pitch: {sel['pitch']/10.0:.1f}° | Yaw: {sel['yaw']/10.0:.1f}°"
            )
            self.last_log_values = current_values
            
        timestamp = self.node.get_clock().now().to_msg()

        transforms = []
        for name, data in self.elements.items():
            t = TransformStamped()
            t.header.stamp = timestamp
            t.header.frame_id = 'link_base'
            t.child_frame_id = data['frame_id']
    
            t.transform.translation.x = data['x'] / 1000.0
            t.transform.translation.y = data['y'] / 1000.0
            t.transform.translation.z = data['z'] / 1000.0
    
            roll_rad = math.radians(data['roll'] / 10.0)
            pitch_rad = math.radians(data['pitch'] / 10.0)
            yaw_rad = math.radians(data['yaw'] / 10.0)
    
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
    
            transforms.append(t)
            
        self.node.tf_broadcaster.sendTransform(transforms)

class TFTunerNode(Node):
    def __init__(self):
        super().__init__('tf_tuner_node')
        self.tf_broadcaster = TransformBroadcaster(self)
        self.get_logger().info("=========================================================")
        self.get_logger().info("🚀 ZED Camera & 3D Elements TF Tuner erfolgreich gestartet!")
        self.get_logger().info("=========================================================")

def main(args=None):
    rclpy.init(args=args)
    
    # Kill the static TF publisher from the launch file to prevent flickering / jumping
    os.system("pkill -f 'static_transform_publisher.*zed_camera_link'")
    # We don't have static TF publishers for the other elements right now, so this is fine.
    
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
