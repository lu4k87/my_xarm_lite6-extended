import sys
import json
import threading
import time
import os
import pygame
from PyQt5.QtWidgets import QApplication, QWidget, QPushButton, QGridLayout, QLabel, QVBoxLayout
from PyQt5.QtCore import QTimer, Qt, QPoint, QUrl
from PyQt5.QtGui import QCursor, QColor

try:
    from PyQt5.QtWebEngineWidgets import QWebEngineView, QWebEnginePage, QWebEngineSettings
    HAS_WEBENGINE = True
except ImportError:
    HAS_WEBENGINE = False
    print("[WARNUNG] PyQt5.QtWebEngineWidgets nicht gefunden. Kein Livestream-Hintergrund.")
    print("Installiere mit: sudo apt install python3-pyqt5.qtwebengine")

import rclpy
from rclpy.node import Node
from geometry_msgs.msg import TwistStamped
from xarm_msgs.srv import VacuumGripperCtrl
from std_msgs.msg import Float32MultiArray
from std_srvs.srv import Trigger

try:
    import av
    av.logging.set_level(av.logging.ERROR) 
    
    # Save the original plugin path to avoid cv2 conflicts with PyQt5
    original_plugin_path = os.environ.get('QT_QPA_PLATFORM_PLUGIN_PATH')
    
    import cv2
    
    # Restore the original plugin path
    if original_plugin_path is not None:
        os.environ['QT_QPA_PLATFORM_PLUGIN_PATH'] = original_plugin_path
    elif 'QT_QPA_PLATFORM_PLUGIN_PATH' in os.environ:
        del os.environ['QT_QPA_PLATFORM_PLUGIN_PATH']
        
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
        super().__init__('gaze_ui_ros2_node')
        self.twist_pub = self.create_publisher(TwistStamped, '/servo_server/delta_twist_cmds', 10)
        self.speed_scale = 0.10 
        
        self.current_z = 100.0  # Default safe value in mm
        self.eef_sub = self.create_subscription(Float32MultiArray, '/ui/eef_position', self.eef_callback, 10)
        
        # Gripper clients
        self.set_vacuum_gripper_client = self.create_client(VacuumGripperCtrl, '/ufactory/set_vacuum_gripper')
        self.gripper_state = "OFF"
        
        self.initial_pose_client = self.create_client(Trigger, '/ui/execute_initial_pose')

    def trigger_initial_pose(self):
        req = Trigger.Request()
        self.initial_pose_client.call_async(req)
        return True

    def eef_callback(self, msg):
        if len(msg.data) >= 3:
            self.current_z = msg.data[2]

    def turn_on_gripper(self):
        req = VacuumGripperCtrl.Request()
        req.on = True
        self.set_vacuum_gripper_client.call_async(req)
        self.gripper_state = "ON"
        return self.gripper_state

    def turn_off_gripper(self):
        req = VacuumGripperCtrl.Request()
        req.on = False
        self.set_vacuum_gripper_client.call_async(req)
        self.gripper_state = "OFF"
        return self.gripper_state

    def publish_twist(self, vector):
        msg = TwistStamped()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = "link_base" 
        msg.twist.linear.x = float(vector.get('x', 0.0)) * self.speed_scale
        msg.twist.linear.y = float(vector.get('y', 0.0)) * self.speed_scale
        
        linear_z = float(vector.get('z', 0.0)) * self.speed_scale
        
        # --- SOFT-LANDING BREMSZONE ---
        # Verhindert Latenz-Overshoot: Ab 40.0mm wird die Geschwindigkeit
        # quadratisch reduziert, bei 33.0mm ist sie exakt 0.
        z_hard_stop = 33.0   # Absoluter Stopp (mm)
        z_brake_start = 40.0 # Bremszone beginnt (mm)
        
        if linear_z < 0:  # Nur bei Abwärtsbewegung
            if self.current_z <= z_hard_stop:
                linear_z = 0.0
                print(f"[SAFETY] HARD STOP bei Z={z_hard_stop}mm! (Aktuell: {self.current_z:.1f}mm)")
            elif self.current_z <= z_brake_start:
                # Quadratische Bremskurve: Fällt viel schneller ab als linear,
                # dadurch fährt er in der Bremszone NOCH langsamer
                scale = ((self.current_z - z_hard_stop) / (z_brake_start - z_hard_stop)) ** 2.0
                linear_z *= scale
                print(f"[SAFETY] Bremszone: Z={self.current_z:.1f}mm, Speed-Faktor: {scale:.0%}")
            
        msg.twist.linear.z = linear_z
        msg.twist.angular.x = 0.0
        msg.twist.angular.y = 0.0
        msg.twist.angular.z = float(vector.get('rz', 0.0))
        self.twist_pub.publish(msg)

class SilentWebEnginePage(QWebEnginePage):
    def javaScriptAlert(self, securityOrigin, msg):
        print(f"[STREAM] Unterdrückter Javascript-Alert: {msg}")
    
    def javaScriptConfirm(self, securityOrigin, msg):
        return True

    def javaScriptPrompt(self, securityOrigin, msg, defaultValue):
        return True, defaultValue

class EyeControlUI(QWidget):
    def __init__(self, ros_node):
        super().__init__()
        self.ros_node = ros_node 
        self.timer_interval = 40      
        self.cooldown_time = 1000     
        self.current_target = None
        self.current_dwell_time = 0
        
        # --- EXAKTE OFFSET-BERECHNUNG FÜR FHD (1920x1080) AUF 27 ZOLL ---
        # 27 Zoll 16:9 = 59,77 cm Breite. 1920 / 59,77 = 32,12 Pixel/cm.
        # Abstand vom Marker-Zentrum bis zum Display-Rand = 3 cm.
        # 3 cm * 32,12 = ~96 Pixel.
        self.offset_x = 96  
        self.offset_y = 96  
        
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
        self.pulse_opacity = 0.9
        self.pulse_direction = -1  # -1 = fading out, +1 = fading in

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
        
        try:
            pygame.mixer.init()
            sound_path = os.path.expanduser("~/dev_ws/src/gaze_control/gaze_control/ui_mouse_click.mp3")
            if os.path.exists(sound_path):
                self.click_sound = pygame.mixer.Sound(sound_path)
            else:
                print(f"[WARNUNG] Soundfile nicht gefunden: {sound_path}")
                self.click_sound = None
        except Exception as e:
            print(f"[WARNUNG] Pygame Mixer konnte nicht initialisiert werden: {e}")
            self.click_sound = None
        
        self.init_ui()
        self.init_eye_tracker()
        
        self.main_timer = QTimer(self)
        self.main_timer.timeout.connect(self.update_loop)
        self.main_timer.start(self.timer_interval)

    def init_ui(self):
        self.setWindowTitle("ROS2 Nexus (God-Mode ArUco Mapping)")
        self.resize(1000, 600)
        self.setAttribute(Qt.WA_StyledBackground, True)
        self.setStyleSheet("""
            #main_window {
                background-color: #333333;
            }
        """)
        self.setObjectName("main_window")

        # --- LIVESTREAM HINTERGRUND ---
        self.web_view = None
        self.web_view_small = None
        if HAS_WEBENGINE:
            self.web_view = QWebEngineView(self)
            self.web_view.setPage(SilentWebEnginePage(self.web_view))
            self.web_view.setUrl(QUrl("http://192.168.0.124/html/"))
            # Scrollbars und Interaktion deaktivieren - nur Anzeige
            self.web_view.setFocusPolicy(Qt.NoFocus)
            self.web_view.setAttribute(Qt.WA_TransparentForMouseEvents)
            self.web_view.setAttribute(Qt.WA_TranslucentBackground)
            self.web_view.page().setBackgroundColor(Qt.transparent)
            self.web_view.setStyleSheet("background: transparent;")
            # Web-Seite nach dem Laden so anpassen, dass der Body den gesamten Bereich füllt
            self.web_view.loadFinished.connect(self._on_stream_loaded)
            
            print("[STREAM] Livestreams werden geladen...")
        else:
            print("[STREAM] Kein WebEngine - Fallback auf dunkelgrauen Hintergrund.")
            
        # --- BUTTON OVERLAY (separates Top-Level-Fenster) ---
        # QWebEngineView erzeugt ein natives X11-Fenster, das sich IMMER über
        # normale QWidget-Kinder legt. Einzige Lösung: ein eigenständiges
        # rahmenloses Top-Level-Fenster, das der Window-Manager korrekt über
        # das native Chromium-Fenster compositen kann.
        self.button_overlay = QWidget(None)  # KEIN Parent = Top-Level!
        self.button_overlay.setWindowFlags(
            Qt.FramelessWindowHint | Qt.Tool | Qt.WindowStaysOnTopHint
        )
        self.button_overlay.setAttribute(Qt.WA_TranslucentBackground)
        self.button_overlay.setStyleSheet("background: transparent;")
        
        # Kleiner Livestream jetzt als Kind des Overlays (damit er auch sichtbar bleibt)
        self.web_view_small = None
        if HAS_WEBENGINE:
            self.web_view_small = QWebEngineView(self.button_overlay)
            self.web_view_small.setPage(SilentWebEnginePage(self.web_view_small))
            self.web_view_small.setUrl(QUrl("http://192.168.0.123/html/"))
            self.web_view_small.setFocusPolicy(Qt.NoFocus)
            self.web_view_small.setAttribute(Qt.WA_TransparentForMouseEvents)
            self.web_view_small.setAttribute(Qt.WA_TranslucentBackground)
            self.web_view_small.page().setBackgroundColor(QColor("#444444"))
            self.web_view_small.setStyleSheet("background-color: #444444; border: 4px solid rgba(128, 128, 128, 0.6);")
            self.web_view_small.loadFinished.connect(self._on_stream_loaded)

        self.buttons = []
        self.button_map = {}  # name -> button für Positionierung
        btns = [
            ("⟲", (0.0, 0.0, 0.0, 0.5), "rgba(52, 73, 94, 0.4)", False),
            ("⟳", (0.0, 0.0, 0.0, -0.5), "rgba(52, 73, 94, 0.4)", False),
            ("Forward ⬆", (1.0, 0.0, 0.0, 0.0), "rgba(52, 73, 94, 0.4)", False),
            ("UP ⇈", (0.0, 0.0, 1.0, 0.0), "rgba(52, 73, 94, 0.4)", False),
            ("DOWN ⇊", (0.0, 0.0, -1.0, 0.0), "rgba(52, 73, 94, 0.4)", False),
            ("⬅ Left", (0.0, 1.0, 0.0, 0.0), "rgba(52, 73, 94, 0.4)", False),
            ("Right ➡", (0.0, -1.0, 0.0, 0.0), "rgba(52, 73, 94, 0.4)", False),
            ("GRIPPER_OFF", (0.0, 0.0, 0.0, 0.0), "rgba(52, 73, 94, 0.4)", False),
            ("GRIPPER_ON", (0.0, 0.0, 0.0, 0.0), "rgba(52, 73, 94, 0.4)", False),
            ("SYSTEM", (0.0, 0.0, 0.0, 0.0), "rgba(0,0,0,0)", True),
            ("HOME ⌂", (0.0, 0.0, 0.0, 0.0), "rgba(52, 73, 94, 0.4)", False),
            ("Back ⬇", (-1.0, 0.0, 0.0, 0.0), "rgba(52, 73, 94, 0.4)", False),
        ]
        
        for btn_text, vec, color, is_toggle in btns:
            # Create hitbox frame FIRST so it renders behind the button
            frame = QLabel(self.button_overlay)
            if btn_text in ["⟲", "⟳"]:
                frame.setStyleSheet("background-color: transparent; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 60px;")
            else:
                frame.setStyleSheet("background-color: transparent; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 5px;")
            
            b = self.create_button(btn_text, color, is_toggle)
            b.setParent(self.button_overlay)
            b.setProperty("vec", vec)
            b.hitbox_frame = frame
            frame.linked_btn = b
            
            self.button_map[btn_text] = b
            self.buttons.append(b)
        
        self.cursor_dot = QLabel(self.button_overlay)
        self.cursor_dot.resize(60, 60)
        self.cursor_dot.setStyleSheet("background-color: rgba(255, 0, 0, 0.8); border: 1px solid rgba(255, 255, 255, 0.9); border-radius: 30px;")
        self.cursor_dot.setAttribute(Qt.WA_TransparentForMouseEvents)
        self.cursor_dot.hide()

        self.update_buttons_state()

    def create_button(self, text, color, is_toggle):
        btn = QPushButton("")
        if text in ["⟲", "⟳"]:
            btn.setFixedSize(75, 75)
            btn.setProperty("is_round", True)
        elif text in ["UP ⇈", "DOWN ⇊"]:
            btn.setFixedSize(100, 75)
            btn.setProperty("is_round", False)
        else:
            btn.setFixedSize(150, 75)
            btn.setProperty("is_round", False)
        btn.setProperty("default_text", text)
        btn.setProperty("default_color", color)
        btn.setProperty("dwell_time", 1000) 
        btn.setProperty("is_toggle", is_toggle)

        layout = QVBoxLayout(btn)
        layout.setContentsMargins(2, 2, 2, 2)
        layout.setSpacing(0)

        arrow_label = QLabel("")
        arrow_label.setAlignment(Qt.AlignCenter)
        arrow_label.setAttribute(Qt.WA_TransparentForMouseEvents)

        text_label = QLabel("")
        text_label.setAlignment(Qt.AlignCenter)
        text_label.setWordWrap(True)
        text_label.setAttribute(Qt.WA_TransparentForMouseEvents)

        layout.addWidget(arrow_label)
        layout.addWidget(text_label)

        btn._arrow_label = arrow_label
        btn._text_label = text_label

        return btn

    def set_button_text(self, btn, full_text, text_color="rgba(255, 255, 255, 0.9)"):
        """Setzt Button-Text mit großem Pfeil-Symbol und kleinem Label."""
        arrows = set("⟲⟳⇈⇊")
        if full_text and full_text[0] in arrows:
            arrow_char = full_text[0]
            label_text = full_text[1:].strip()
            btn._arrow_label.setText(arrow_char)
            btn._arrow_label.setStyleSheet(
                f"font-size: 40px; color: {text_color}; font-weight: normal; background: transparent;")
            btn._arrow_label.show()
            btn._text_label.setText(label_text)
            if label_text == "":
                btn._text_label.hide()
            else:
                btn._text_label.show()
            btn._text_label.setStyleSheet(
                f"font-size: 14px; color: {text_color}; background: transparent;")
        else:
            btn._arrow_label.setText("")
            btn._arrow_label.hide()
            btn._text_label.setText(full_text)
            
            if "UP" in full_text or "DOWN" in full_text or "HOME" in full_text:
                fsize = 20
                btn._text_label.setWordWrap(False)
            elif "DRIVING!" in full_text:
                fsize = 18
                btn._text_label.setWordWrap(False)
            else:
                fsize = 24
                btn._text_label.setWordWrap(True)
                
            btn._text_label.setStyleSheet(
                f"font-size: {fsize}px; color: {text_color}; font-weight: normal; background: transparent;")

    def _position_buttons(self):
        """Positioniert alle Buttons absolut basierend auf der Fenstergröße."""
        w = self.width()
        h = self.height()
        
        # Center coordinates
        bottom_cy = h - 110 
        sys_cx = 100
        home_cx = sys_cx + 260
        
        group_gap = 170
        start_cx = w // 2 - int(group_gap * 1.5)
        
        up_cx = start_cx
        down_cx = up_cx + group_gap
        rot_left_cx = down_cx + group_gap
        rot_right_cx = rot_left_cx + group_gap
        
        gripper_off_cx = w - 100
        gripper_on_cx = gripper_off_cx - 190

        margin_x = int(w * 0.28)
        margin_y = h // 4

        positions = {
            "SYSTEM":          (sys_cx, "BOTTOM"),
            "HOME ⌂":          (home_cx, "BOTTOM"),
            "Forward ⬆":     (w // 2, margin_y),
            "⬅ Left":        (margin_x, h // 2),
            "Right ➡":       (w - margin_x, h // 2),
            "UP ⇈":          (up_cx, "BOTTOM"),
            "DOWN ⇊":        (down_cx, "BOTTOM"),
            "⟲":             (rot_left_cx, "BOTTOM"),
            "⟳":             (rot_right_cx, "BOTTOM"),
            "GRIPPER_ON":      (gripper_on_cx, "BOTTOM"),
            "GRIPPER_OFF":     (gripper_off_cx, "BOTTOM"),
            "Back ⬇":        (w // 2, h - margin_y),
        }
        
        frame_sizes = {
            "SYSTEM": (160, 200),
            "HOME ⌂": (160, 200),
            "GRIPPER_ON": (160, 200),
            "GRIPPER_OFF": (160, 200),
            "Forward ⬆": (280, 250),
            "Back ⬇": (280, 200),
            "⬅ Left": (250, 300),
            "Right ➡": (250, 300),
            "UP ⇈": (150, 120),
            "DOWN ⇊": (150, 120),
            "⟲": (150, 120),
            "⟳": (150, 120),
        }
        
        for name, (cx, cy) in positions.items():
            if name in self.button_map:
                b = self.button_map[name]
                fw, fh = frame_sizes.get(name, (200, 200))
                
                # Wenn es ein Bottom-Button ist, setze cy so, dass die Hitbox unten (h) abschließt
                if cy == "BOTTOM":
                    cy = h - fh / 2
                    
                b.move(int(cx - b.width() / 2), int(cy - b.height() / 2))
                if hasattr(b, 'hitbox_frame'):
                    b.hitbox_frame.setFixedSize(fw, fh)
                    fx = int(cx - fw / 2)
                    fy = int(cy - fh / 2)
                    if fx < 0: fx = 0
                    if fy < 0: fy = 0
                    if fx + fw > w: fx = w - fw
                    if fy + fh > h: fy = h - fh
                    b.hitbox_frame.move(fx, fy)

    def _sync_overlay(self):
        """Synchronisiert Position und Größe des Top-Level-Overlays mit dem Hauptfenster."""
        if hasattr(self, 'button_overlay') and self.button_overlay:
            pos = self.mapToGlobal(QPoint(0, 0))
            self.button_overlay.setGeometry(pos.x(), pos.y(), self.width(), self.height())

    def moveEvent(self, event):
        super().moveEvent(event)
        self._sync_overlay()

    def showEvent(self, event):
        super().showEvent(event)
        if hasattr(self, 'button_overlay'):
            self.button_overlay.show()
        self._sync_overlay()

    def hideEvent(self, event):
        super().hideEvent(event)
        if hasattr(self, 'button_overlay'):
            self.button_overlay.hide()

    def resizeEvent(self, event):
        """Hält WebView und Button-Overlay synchron mit dem Fenster."""
        super().resizeEvent(event)
        if self.web_view:
            self.web_view.setGeometry(0, 0, self.width(), self.height())
            
        self._sync_overlay()
            
        if hasattr(self, 'web_view_small') and self.web_view_small:
            bw, bh = 150, 75
            gap = 10
            gripper_w = bw * 2 + gap

            small_w = int(gripper_w * 1.8)
            small_h = int(small_w * 9 / 16)
            
            margin_right = 20
            margin_top = 20
            
            small_x = self.width() - small_w - margin_right
            small_y = margin_top

            self.web_view_small.setGeometry(small_x, small_y, small_w, small_h)
            
        self._position_buttons()

    def _on_stream_loaded(self, ok):
        """Wird aufgerufen wenn die Stream-Seite geladen ist. Scrollbars entfernen und Video strecken."""
        sender = self.sender()
        if ok and sender:
            is_small = hasattr(self, 'web_view_small') and sender == self.web_view_small
            b_rad = "0px"
            
            js = f"""
            document.body.style.margin = '0';
            document.body.style.padding = '0';
            document.body.style.overflow = 'hidden';
            document.body.style.background = 'transparent';

            // RPi Cam Control Titelleiste und alle UI-Elemente ausblenden
            var allElements = document.querySelectorAll('div, nav, header, footer, table, form, select, input, button, a, span, p, h1, h2, h3, h4');
            for (var i = 0; i < allElements.length; i++) {{
                var el = allElements[i];
                if (!el.querySelector('video, img, canvas, object, embed') 
                    && el.tagName !== 'VIDEO' && el.tagName !== 'IMG' && el.tagName !== 'CANVAS') {{
                    el.style.display = 'none';
                }}
            }}

            var applyStyles = function(elements) {{
                for (var i = 0; i < elements.length; i++) {{
                    elements[i].style.width = '100vw';
                    elements[i].style.height = '100vh';
                    elements[i].style.objectFit = 'cover';
                    elements[i].style.position = 'fixed';
                    elements[i].style.top = '0';
                    elements[i].style.left = '0';
                    elements[i].style.borderRadius = '{b_rad}';
                }}
            }};
            
            applyStyles(document.querySelectorAll('video'));
            applyStyles(document.querySelectorAll('img'));
            """
            sender.page().runJavaScript(js)
            print("[STREAM] Livestream-Seite erfolgreich geladen und angepasst.")
        else:
            if sender:
                is_small = hasattr(self, 'web_view_small') and sender == self.web_view_small
                if not is_small:
                    print("[STREAM] Haupt-Livestream konnte nicht geladen werden. Verstecke View.")
                    sender.hide()
                else:
                    print("[STREAM] 2. Livestream konnte nicht geladen werden. Zeige Platzhalter.")
                    sender.setHtml("<html><body style='background-color: #444444;'></body></html>")

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
                                        
                                    # Subpixel-Genauigkeit zur Reduzierung von Kamera-Zittern anwenden
                                    if ids is not None and len(ids) > 0:
                                        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                                        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.001)
                                        for i in range(len(corners)):
                                            cv2.cornerSubPix(gray, corners[i], (3, 3), (-1, -1), criteria)
                                        
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
                                            # Zielpunkte nutzen nun die korrekten Offsets für 6x6cm Marker auf 27 Zoll WQHD
                                            dst_pts = np.array([
                                                [-self.offset_x, -self.offset_y],
                                                [self.width() + self.offset_x, -self.offset_y],
                                                [self.width() + self.offset_x, self.height() + self.offset_y],
                                                [-self.offset_x, self.height() + self.offset_y]
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
            # Alpha-Glättung auf 0.20 reduziert für stabilere Filterung
            alpha = 0.20 
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

        # Buttons leben im Top-Level-Overlay: dort suchen
        hovered_widget = self.button_overlay.childAt(target_pos)
        # Wenn der transparente Rahmen getroffen wird, navigiere zum eigentlichen Button
        if hasattr(hovered_widget, 'linked_btn'):
            hovered_widget = hovered_widget.linked_btn
            
        # Wenn ein internes QLabel getroffen wird, zum übergeordneten QPushButton navigieren
        if isinstance(hovered_widget, QLabel) and isinstance(hovered_widget.parentWidget(), QPushButton):
            hovered_widget = hovered_widget.parentWidget()

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
                                self.set_button_text(hovered_widget, f"{base_text}\n{secs_left:.1f}s")
                            else:
                                base_text = hovered_widget.property("default_text")
                                if base_text == "GRIPPER_ON":
                                    base_text = "Gripper ON"
                                elif base_text == "GRIPPER_OFF":
                                    base_text = "Gripper OFF"
                                self.set_button_text(hovered_widget, f"{base_text}\n{secs_left:.1f}s")
                            
                            radius = "37px" if hovered_widget.property("is_round") else "5px"
                            hovered_widget.setStyleSheet(f"""
                                QPushButton {{
                                    background-color: rgba(241, 196, 15, 0.7); 
                                    color: white; 
                                    font-size: 22px; 
                                    font-weight: normal; 
                                    border-radius: {radius}; 
                                    border: 2px solid rgba(241, 196, 15, 1.0);
                                }}
                            """)

    def animate_pulse(self):
        if self.current_target and self.is_driving:
            # Sanfter Fade: Opacity pendelt zwischen 0.35 und 0.9
            step = 0.025
            self.pulse_opacity += step * self.pulse_direction
            if self.pulse_opacity >= 0.9:
                self.pulse_opacity = 0.9
                self.pulse_direction = -1
            elif self.pulse_opacity <= 0.35:
                self.pulse_opacity = 0.35
                self.pulse_direction = 1

            op = self.pulse_opacity
            border_op = min(1.0, op + 0.1)
            radius = "37px" if self.current_target.property("is_round") else "5px"
            self.current_target.setStyleSheet(f"""
                QPushButton {{
                    background-color: rgba(46, 204, 113, {op:.2f}); 
                    border-radius: {radius}; 
                    border: 1px solid rgba(255, 255, 255, {border_op:.2f});
                }}
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
                self.set_button_text(btn, "Gaze On")
                btn.setStyleSheet("""
                    QPushButton {
                        background-color: rgba(46, 204, 113, 0.4); 
                        border-radius: 5px; 
                        border: 2px solid rgba(255, 255, 255, 0.15);
                    }
                """)
            else:
                self.set_button_text(btn, "Gaze Off")
                btn.setStyleSheet("""
                    QPushButton {
                        background-color: rgba(192, 57, 43, 0.4); 
                        border-radius: 5px; 
                        border: 2px solid rgba(255, 255, 255, 0.15);
                    }
                """)
        else:
            text = btn.property("default_text")
            
            if text == "GRIPPER_ON":
                text = "Gripper\nON"
                color = "rgba(243, 156, 18, 0.6)" if self.ros_node.gripper_state == "ON" else "rgba(52, 73, 94, 0.4)"
            elif text == "GRIPPER_OFF":
                text = "Gripper\nOFF"
                color = "rgba(230, 126, 34, 0.6)" if self.ros_node.gripper_state == "OFF" else "rgba(52, 73, 94, 0.4)"
            else:
                color = btn.property("default_color")

            if not self.system_active:
                self.set_button_text(btn, text, "rgba(255, 255, 255, 0.2)")
                radius = "37px" if btn.property("is_round") else "5px"
                btn.setStyleSheet(f"""
                    QPushButton {{
                        background-color: rgba(50, 50, 50, 0.2); 
                        border-radius: {radius}; 
                        border: 2px solid rgba(255, 255, 255, 0.05);
                    }}
                """)
            else:
                self.set_button_text(btn, text)
                radius = "37px" if btn.property("is_round") else "5px"
                btn.setStyleSheet(f"""
                    QPushButton {{
                        background-color: {color}; 
                        border-radius: {radius}; 
                        border: 2px solid rgba(255, 255, 255, 0.15);
                    }}
                """)

    def execute_command(self, btn):
        if hasattr(self, 'click_sound') and self.click_sound:
            self.click_sound.play()

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
        
        if cmd == "GRIPPER_ON":
            new_state = self.ros_node.turn_on_gripper()
            self.in_cooldown = True
            
            self.update_buttons_state()
            
            btn.setStyleSheet("""
                QPushButton {
                    background-color: rgba(243, 156, 18, 0.8); 
                    color: white; 
                    font-size: 22px; 
                    font-weight: normal; 
                    border-radius: 5px; 
                    border: 1px solid rgba(255, 255, 255, 0.8);
                }
            """)
            self.cooldown_timer.start(1000)
            print(f"[ROS 2] -> VACUUM GRIPPER ON ({new_state})")
            
        elif cmd == "GRIPPER_OFF":
            new_state = self.ros_node.turn_off_gripper()
            self.in_cooldown = True
            
            self.update_buttons_state()
            
            btn.setStyleSheet("""
                QPushButton {
                    background-color: rgba(230, 126, 34, 0.8); 
                    color: white; 
                    font-size: 22px; 
                    font-weight: normal; 
                    border-radius: 5px; 
                    border: 1px solid rgba(255, 255, 255, 0.8);
                }
            """)
            self.cooldown_timer.start(1000)
            print(f"[ROS 2] -> VACUUM GRIPPER OFF ({new_state})")
        elif cmd == "HOME ⌂":
            self.ros_node.trigger_initial_pose()
            self.in_cooldown = True
            self.update_buttons_state()
            btn.setStyleSheet("""
                QPushButton {
                    background-color: rgba(52, 152, 219, 0.8); 
                    color: white; 
                    font-size: 22px; 
                    font-weight: normal; 
                    border-radius: 5px; 
                    border: 1px solid rgba(255, 255, 255, 0.8);
                }
            """)
            self.cooldown_timer.start(1000)
            print("[ROS 2] -> HOME POSITION (INITIAL) TRIGGERED")
        else:
            self.is_driving = True
            self.set_button_text(btn, cmd)
            self.pulse_opacity = 0.9
            self.pulse_direction = -1
            radius = "37px" if btn.property("is_round") else "5px"
            btn.setStyleSheet(f"""
                QPushButton {{
                    background-color: rgba(46, 204, 113, 0.9); 
                    border-radius: {radius}; 
                    border: 1px solid rgba(255, 255, 255, 0.9);
                }}
            """)
            self.pulse_timer.start(50) 
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
        if hasattr(self, 'button_overlay') and self.button_overlay:
            self.button_overlay.close()
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
