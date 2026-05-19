import sys
import json
import threading
import time
import os
from PyQt5.QtWidgets import QApplication, QWidget, QPushButton, QGridLayout, QLabel
from PyQt5.QtCore import QTimer, Qt, QPoint
from PyQt5.QtGui import QCursor

import rclpy
from rclpy.node import Node
from geometry_msgs.msg import TwistStamped
from xarm_msgs.srv import Call

try:
    import av
    av.logging.set_level(av.logging.ERROR) 
    import cv2
    import numpy as np
except ImportError:
    print("\n[FEHLER] Fehlende Pakete! Bitte installiere sie mit:")
    print("sudo apt install python3-opencv python3-av\n")
    sys.exit(1)

# ArUco Wörterbuch
try:
    ARUCO_DICT = cv2.aruco.Dictionary_get(cv2.aruco.DICT_4X4_50)
    ARUCO_PARAMS = cv2.aruco.DetectorParameters_create()
    USE_LEGACY_ARUCO = True
except AttributeError:
    ARUCO_DICT = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
    ARUCO_PARAMS = cv2.aruco.DetectorParameters()
    ARUCO_DETECTOR = cv2.aruco.ArucoDetector(ARUCO_DICT, ARUCO_PARAMS)
    USE_LEGACY_ARUCO = False

class EyeRosNode(Node):
    def __init__(self):
        super().__init__('eye_ui_ros2_node')
        self.twist_pub = self.create_publisher(TwistStamped, '/servo_server/delta_twist_cmds', 10)
        self.speed_scale = 0.50 
        
        # Gripper clients
        self.open_gripper_client = self.create_client(Call, '/ufactory/open_lite6_gripper')
        self.close_gripper_client = self.create_client(Call, '/ufactory/close_lite6_gripper')
        self.stop_gripper_client = self.create_client(Call, '/ufactory/stop_lite6_gripper')
        self.gripper_state = "OFF"

    def toggle_gripper(self):
        req = Call.Request()
        if self.gripper_state == "OPEN" or self.gripper_state == "OFF":
            self.close_gripper_client.call_async(req)
            self.gripper_state = "CLOSE"
            return "CLOSE"
        else: # state is "CLOSE"
            self.open_gripper_client.call_async(req)
            self.gripper_state = "OPEN"
            return "OPEN"

    def stop_gripper(self):
        req = Call.Request()
        self.stop_gripper_client.call_async(req)
        self.gripper_state = "OFF"
        return "OFF"

    def publish_twist(self, vector):
        msg = TwistStamped()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = "link_base" 
        msg.twist.linear.x = float(vector.get('x', 0.0)) * self.speed_scale
        msg.twist.linear.y = float(vector.get('y', 0.0)) * self.speed_scale
        msg.twist.linear.z = float(vector.get('z', 0.0)) * self.speed_scale
        msg.twist.angular.x = 0.0
        msg.twist.angular.y = 0.0
        msg.twist.angular.z = float(vector.get('rz', 0.0))
        self.twist_pub.publish(msg)

class EyeControlUI(QWidget):
    def __init__(self, ros_node):
        super().__init__()
        self.ros_node = ros_node 
        self.timer_interval = 40      
        self.cooldown_time = 1500     
        self.current_target = None
        self.current_dwell_time = 0
        
        # Master-Toggle für das gesamte System (Startet auf AUS für maximale Sicherheit)
        self.system_active = False

        # ZUSTÄNDE FÜR DIE DAUERFAHRT
        self.is_driving = False   
        self.in_cooldown = False  
        
        self.active_vector = {"x": 0.0, "y": 0.0, "z": 0.0, "rz": 0.0} 
        
        # Timer
        self.servo_publish_timer = QTimer(self)
        self.servo_publish_timer.timeout.connect(self.publish_active_vector)

        self.pulse_timer = QTimer(self)
        self.pulse_timer.timeout.connect(self.animate_pulse)
        self.pulse_state = False

        self.cooldown_timer = QTimer(self)
        self.cooldown_timer.setSingleShot(True)
        self.cooldown_timer.timeout.connect(self.end_cooldown)

        self.target_mapped_x = -1.0 
        self.target_mapped_y = -1.0
        self.smoothed_x = -1.0
        self.smoothed_y = -1.0
        self.gaze_active = False
        
        self.last_debug_time = 0
        self.last_img_save_time = 0
        self.script_running = True 
        
        self.init_ui()
        self.init_eye_tracker()
        
        self.main_timer = QTimer(self)
        self.main_timer.timeout.connect(self.update_loop)
        self.main_timer.start(self.timer_interval)

    def init_ui(self):
        self.setWindowTitle("ROS 2 Control (God-Mode ArUco Mapping)")
        self.resize(1000, 600)
        self.setStyleSheet("""
            QWidget {
                background-color: qlineargradient(spread:pad, x1:0, y1:0, x2:1, y2:1, stop:0 #1a1a1a, stop:1 #2c3e50);
            }
        """)
        layout = QGridLayout()
        layout.setSpacing(20)
        layout.setContentsMargins(40, 40, 40, 40)
        
        self.buttons = []
        # Englisch + Links/Rechts Vektoren getauscht
        btns = [
            ("⟲ ROTATE | Z+", 0, 0, (0.0, 0.0, 0.0, 1.0), "rgba(142, 68, 173, 0.4)", False),
            ("⬆ FORWARD | X+", 0, 1, (1.0, 0.0, 0.0, 0.0), "rgba(52, 73, 94, 0.4)", False),
            ("⇈ UP | Z+", 0, 2, (0.0, 0.0, 1.0, 0.0), "rgba(41, 128, 185, 0.4)", False),
            ("GRIPPER_TOGGLE", 0, 3, (0.0, 0.0, 0.0, 0.0), "rgba(243, 156, 18, 0.5)", False),
            
            ("⬅ LEFT | Y+", 1, 0, (0.0, 1.0, 0.0, 0.0), "rgba(52, 73, 94, 0.4)", False),
            ("🛑 STOP", 1, 1, (0.0, 0.0, 0.0, 0.0), "rgba(192, 57, 43, 0.5)", False),
            ("➡ RIGHT | Y-", 1, 2, (0.0, -1.0, 0.0, 0.0), "rgba(52, 73, 94, 0.4)", False),
            ("GRIPPER_OFF", 1, 3, (0.0, 0.0, 0.0, 0.0), "rgba(230, 126, 34, 0.5)", False),
            
            ("⟳ ROTATE | Z-", 2, 0, (0.0, 0.0, 0.0, -1.0), "rgba(142, 68, 173, 0.4)", False),
            ("⬇ BACKWARD | X-", 2, 1, (-1.0, 0.0, 0.0, 0.0), "rgba(52, 73, 94, 0.4)", False),
            ("⇊ DOWN | Z-", 2, 2, (0.0, 0.0, -1.0, 0.0), "rgba(41, 128, 185, 0.4)", False),
            ("SYSTEM", 2, 3, (0.0, 0.0, 0.0, 0.0), "rgba(0,0,0,0)", True)
        ]
        
        for text, r, c, vec, color, is_toggle in btns:
            b = self.create_button(text, color, is_toggle)
            b.setProperty("vec", vec)
            
            if "STOP" in text:
                b.setProperty("dwell_time", 0)
                
            layout.addWidget(b, r, c)
            self.buttons.append(b)
            
        self.setLayout(layout)
        
        self.cursor_dot = QLabel(self)
        self.cursor_dot.resize(60, 60)
        self.cursor_dot.setStyleSheet("background-color: rgba(255, 0, 0, 0.8); border: 3px solid rgba(255, 255, 255, 0.9); border-radius: 30px;")
        self.cursor_dot.setAttribute(Qt.WA_TransparentForMouseEvents)
        self.cursor_dot.hide()

        # Initialisiert die Buttons direkt im grauen "AUS"-Zustand
        self.update_buttons_state()

    def create_button(self, text, color, is_toggle):
        btn = QPushButton(text)
        btn.setSizePolicy(btn.sizePolicy().Ignored, btn.sizePolicy().Ignored)
        btn.setProperty("default_text", text)
        btn.setProperty("default_color", color)
        btn.setProperty("dwell_time", 1500) 
        btn.setProperty("is_toggle", is_toggle)
        
        return btn

    def init_eye_tracker(self):
        self.g3_ip = "192.168.75.51"
        self.H_matrix = None
        self.latest_frame_shape = None
        
        def rtsp_worker():
            rtsp_url = f"rtsp://{self.g3_ip}:8554/live/all"
            print(f"\n[OPENCV] Greife auf Videostream zu: {rtsp_url}")
            
            while self.script_running:
                try:
                    container = av.open(rtsp_url, options={'rtsp_transport': 'tcp', 'stimeout': '5000000'})
                    video_stream = next((s for s in container.streams if s.type == 'video'), None)
                    data_stream = next((s for s in container.streams if s.type == 'data'), None)
                    
                    if not video_stream or not data_stream:
                        time.sleep(2)
                        continue
                        
                    for packet in container.demux([video_stream, data_stream]):
                        if not self.script_running:
                            break
                        if packet.dts is None: continue
                        
                        if packet.stream.type == 'data':
                            try:
                                payload = bytes(packet).decode('utf-8')
                                data = json.loads(payload)
                                if 'gaze2d' in data and self.H_matrix is not None and self.latest_frame_shape is not None:
                                    raw_x, raw_y = data['gaze2d']
                                    cam_px = np.array([[[raw_x * self.latest_frame_shape[1], 
                                                         raw_y * self.latest_frame_shape[0]]]], dtype=np.float32)
                                    
                                    mapped = cv2.perspectiveTransform(cam_px, self.H_matrix)
                                    self.target_mapped_x = mapped[0][0][0]
                                    self.target_mapped_y = mapped[0][0][1]
                                    self.gaze_active = True
                            except Exception:
                                pass 
                                
                        elif packet.stream.type == 'video':
                            try:
                                for frame in packet.decode():
                                    img = frame.to_ndarray(format='bgr24')
                                    self.latest_frame_shape = img.shape
                                    
                                    if USE_LEGACY_ARUCO:
                                        corners, ids, _ = cv2.aruco.detectMarkers(img, ARUCO_DICT, parameters=ARUCO_PARAMS)
                                    else:
                                        corners, ids, _ = ARUCO_DETECTOR.detectMarkers(img)
                                        
                                    ids_flat = [] if ids is None else ids.flatten().tolist()
                                    
                                    if ids is not None and len(ids_flat) >= 4:
                                        src_pts = np.zeros((4, 2), dtype=np.float32)
                                        found_all = True
                                        
                                        for target_id in [0, 1, 2, 3]:
                                            if target_id in ids_flat:
                                                idx = ids_flat.index(target_id)
                                                m_corners = corners[idx][0]
                                                cx = np.mean(m_corners[:, 0])
                                                cy = np.mean(m_corners[:, 1])
                                                src_pts[target_id] = [cx, cy] 
                                            else:
                                                found_all = False
                                                break
                                                
                                        if found_all:
                                            dst_pts = np.array([
                                                [0, 0],
                                                [self.width(), 0],
                                                [self.width(), self.height()],
                                                [0, self.height()]
                                            ], dtype=np.float32)
                                            
                                            H, _ = cv2.findHomography(src_pts, dst_pts)
                                            if H is not None:
                                                self.H_matrix = H
                                                
                            except Exception:
                                pass 
                except Exception as e:
                    self.gaze_active = False
                    time.sleep(2)

        self.t = threading.Thread(target=rtsp_worker, daemon=True)
        self.t.start()

    def update_loop(self):
        rclpy.spin_once(self.ros_node, timeout_sec=0)
        
        if self.in_cooldown:
            return

        if self.gaze_active and self.target_mapped_x != -1.0:
            alpha = 0.4 
            if self.smoothed_x == -1.0: 
                self.smoothed_x, self.smoothed_y = self.target_mapped_x, self.target_mapped_y
            else:
                self.smoothed_x = self.smoothed_x * (1-alpha) + self.target_mapped_x * alpha
                self.smoothed_y = self.smoothed_y * (1-alpha) + self.target_mapped_y * alpha
            
            lx = int(self.smoothed_x)
            ly = int(self.smoothed_y)
            
            lx = max(0, min(self.width() - 60, lx))
            ly = max(0, min(self.height() - 60, ly))
            
            target_pos = QPoint(lx, ly)
            self.cursor_dot.move(lx - 30, ly - 30) 
            self.cursor_dot.show()
            self.cursor_dot.raise_()
        else:
            target_pos = self.mapFromGlobal(QCursor.pos())
            self.cursor_dot.hide()

        hovered_widget = self.childAt(target_pos)

        if self.current_target and hovered_widget != self.current_target:
            if self.is_driving:
                self.stop_driving()
            else:
                self.reset_button(self.current_target)
            self.current_target = None
            self.current_dwell_time = 0

        if isinstance(hovered_widget, QPushButton):
            if self.current_target is None:
                self.current_target = hovered_widget
                self.current_dwell_time = 0

            if hovered_widget == self.current_target:
                is_sys_toggle = hovered_widget.property("is_toggle")
                
                if not self.system_active and not is_sys_toggle:
                    return

                if self.is_driving and not is_sys_toggle:
                    pass 
                else:
                    self.current_dwell_time += self.timer_interval
                    target_limit = hovered_widget.property("dwell_time")
                    
                    if self.current_dwell_time >= target_limit:
                        self.execute_command(hovered_widget)
                    else:
                        if target_limit > 0:
                            secs_left = max(0.0, (target_limit - self.current_dwell_time) / 1000.0)
                            
                            if is_sys_toggle:
                                base_text = "DISABLING..." if self.system_active else "ENABLING..."
                                hovered_widget.setText(f"{base_text}\n{secs_left:.1f}s")
                            else:
                                base_text = hovered_widget.property("default_text")
                                if base_text == "GRIPPER_TOGGLE":
                                    base_text = "GRIPPER OPEN" if self.ros_node.gripper_state == "CLOSE" else "GRIPPER CLOSE"
                                elif base_text == "GRIPPER_OFF":
                                    base_text = "GRIPPER OFF"
                                hovered_widget.setText(f"{base_text}\n{secs_left:.1f}s")
                            
                            hovered_widget.setStyleSheet(f"""
                                QPushButton {{
                                    background-color: rgba(241, 196, 15, 0.7); 
                                    color: white; 
                                    font-size: 22px; 
                                    font-weight: bold; 
                                    border-radius: 15px; 
                                    border: 2px solid rgba(241, 196, 15, 1.0);
                                }}
                            """)

    def animate_pulse(self):
        if self.current_target and self.is_driving:
            self.pulse_state = not self.pulse_state
            if self.pulse_state:
                self.current_target.setStyleSheet("""
                    QPushButton {
                        background-color: rgba(46, 204, 113, 0.9); 
                        color: white; 
                        font-size: 28px; 
                        font-weight: bold; 
                        border-radius: 15px; 
                        border: 4px solid rgba(255, 255, 255, 0.8);
                    }
                """)
            else:
                self.current_target.setStyleSheet("""
                    QPushButton {
                        background-color: rgba(46, 204, 113, 0.5); 
                        color: white; 
                        font-size: 26px; 
                        font-weight: bold; 
                        border-radius: 15px; 
                        border: 2px solid rgba(46, 204, 113, 0.8);
                    }
                """)

    def publish_active_vector(self):
        self.ros_node.publish_twist(self.active_vector)

    def stop_driving(self):
        self.servo_publish_timer.stop()
        self.pulse_timer.stop() 
        self.ros_node.publish_twist({"x": 0.0, "y": 0.0, "z": 0.0, "rz": 0.0}) 
        if self.current_target:
            self.reset_button(self.current_target)
        self.is_driving = False
        self.current_dwell_time = 0
        print("[ROS 2] -> Driving stopped (Gaze averted).")

    def update_buttons_state(self):
        for btn in self.buttons:
            self.reset_button(btn)

    def reset_button(self, btn):
        if not btn: return
        
        if btn.property("is_toggle"):
            if self.system_active:
                btn.setText("Eye Control\nON")
                btn.setStyleSheet("""
                    QPushButton {
                        background-color: rgba(46, 204, 113, 0.4); 
                        color: rgba(255, 255, 255, 0.9); 
                        font-size: 22px; 
                        font-weight: bold; 
                        border-radius: 15px; 
                        border: 2px solid rgba(255, 255, 255, 0.15);
                    }
                """)
            else:
                btn.setText("Eye Control\nOFF")
                btn.setStyleSheet("""
                    QPushButton {
                        background-color: rgba(192, 57, 43, 0.4); 
                        color: rgba(255, 255, 255, 0.9); 
                        font-size: 22px; 
                        font-weight: bold; 
                        border-radius: 15px; 
                        border: 2px solid rgba(255, 255, 255, 0.15);
                    }
                """)
        else:
            text = btn.property("default_text")
            is_off_btn = False
            if text == "GRIPPER_TOGGLE":
                text = "GRIPPER\nOPEN" if self.ros_node.gripper_state == "CLOSE" else "GRIPPER\nCLOSE"
            elif text == "GRIPPER_OFF":
                text = "GRIPPER\nOFF"
                is_off_btn = True

            if not self.system_active:
                btn.setText(text)
                btn.setStyleSheet("""
                    QPushButton {
                        background-color: rgba(50, 50, 50, 0.2); 
                        color: rgba(255, 255, 255, 0.2); 
                        font-size: 22px; 
                        font-weight: bold; 
                        border-radius: 15px; 
                        border: 2px solid rgba(255, 255, 255, 0.05);
                    }
                """)
            else:
                color = btn.property("default_color")
                # Grey out the OFF button if state is already OFF
                if is_off_btn and self.ros_node.gripper_state == "OFF":
                    color = "rgba(100, 100, 100, 0.4)"
                    
                btn.setText(text)
                btn.setStyleSheet(f"""
                    QPushButton {{
                        background-color: {color}; 
                        color: rgba(255, 255, 255, 0.9); 
                        font-size: 22px; 
                        font-weight: bold; 
                        border-radius: 15px; 
                        border: 2px solid rgba(255, 255, 255, 0.15);
                    }}
                """)

    def execute_command(self, btn):
        if btn.property("is_toggle"):
            self.system_active = not self.system_active
            self.update_buttons_state()
            self.in_cooldown = True
            self.cooldown_timer.start(1000) 
            print(f"[ROS 2] -> System is now {'ENABLED' if self.system_active else 'DISABLED'}")
            return

        cmd = btn.property("default_text")
        vec = btn.property("vec")
        self.active_vector = {"x": vec[0], "y": vec[1], "z": vec[2], "rz": vec[3] if len(vec) > 3 else 0.0}
        
        if cmd == "🛑 STOP":
            self.in_cooldown = True
            btn.setText("STOPPED!")
            btn.setStyleSheet("""
                QPushButton {
                    background-color: rgba(192, 57, 43, 0.8); 
                    color: white; 
                    font-size: 26px; 
                    font-weight: bold; 
                    border-radius: 15px; 
                    border: 4px solid rgba(255, 255, 255, 0.8);
                }
            """)
            self.ros_node.publish_twist({"x": 0.0, "y": 0.0, "z": 0.0, "rz": 0.0})
            self.cooldown_timer.start(self.cooldown_time)
            print(f"[ROS 2] -> EMERGENCY STOP: {cmd}")
        elif cmd == "GRIPPER_TOGGLE":
            new_state = self.ros_node.toggle_gripper()
            self.in_cooldown = True
            
            self.update_buttons_state()
            
            btn.setStyleSheet("""
                QPushButton {
                    background-color: rgba(243, 156, 18, 0.8); 
                    color: white; 
                    font-size: 22px; 
                    font-weight: bold; 
                    border-radius: 15px; 
                    border: 4px solid rgba(255, 255, 255, 0.8);
                }
            """)
            self.cooldown_timer.start(1500)
            print(f"[ROS 2] -> GRIPPER TOGGLED: {new_state}")
            
        elif cmd == "GRIPPER_OFF":
            new_state = self.ros_node.stop_gripper()
            self.in_cooldown = True
            
            self.update_buttons_state()
            
            btn.setStyleSheet("""
                QPushButton {
                    background-color: rgba(230, 126, 34, 0.8); 
                    color: white; 
                    font-size: 22px; 
                    font-weight: bold; 
                    border-radius: 15px; 
                    border: 4px solid rgba(255, 255, 255, 0.8);
                }
            """)
            self.cooldown_timer.start(1500)
            print(f"[ROS 2] -> GRIPPER STOPPED ({new_state})")
        else:
            self.is_driving = True
            btn.setText("DRIVING!")
            self.pulse_state = True
            btn.setStyleSheet("""
                QPushButton {
                    background-color: rgba(46, 204, 113, 0.9); 
                    color: white; 
                    font-size: 28px; 
                    font-weight: bold; 
                    border-radius: 15px; 
                    border: 4px solid rgba(255, 255, 255, 0.8);
                }
            """)
            self.pulse_timer.start(400) 
            self.servo_publish_timer.start(50) 
            print(f"[ROS 2] -> DRIVING started: {cmd}")

    def end_cooldown(self):
        self.reset_button(self.current_target)
        self.current_target = None
        self.current_dwell_time = 0
        self.in_cooldown = False
        QApplication.processEvents()

    def closeEvent(self, event):
        self.script_running = False
        event.accept()

def main(args=None):
    rclpy.init(args=args)
    app = QApplication(sys.argv)
    ui = EyeControlUI(EyeRosNode())
    ui.showFullScreen()
    app.exec_()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
