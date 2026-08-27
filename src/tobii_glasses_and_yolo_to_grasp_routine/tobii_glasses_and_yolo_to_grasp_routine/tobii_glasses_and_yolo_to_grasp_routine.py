import rclpy
from rclpy.node import Node
from std_msgs.msg import String
from std_srvs.srv import Trigger
from xarm_msgs.srv import MoveCartesian
import cv2
import av
import json
import numpy as np
import time
import threading
import urllib.request
import os
import pygame

from ultralytics import YOLO

class TobiiYoloToGraspRoutine(Node):
    def __init__(self):
        super().__init__('tobii_glasses_and_yolo_to_grasp_routine')
        
        yolo_path = os.path.expanduser('~/dev_ws/my_yolo_model.pt')
        if not os.path.exists(yolo_path):
            self.get_logger().error(f"YOLO model not found at {yolo_path}")
            return
            
        self.yolo_model = YOLO(yolo_path)
        
        try:
            pygame.mixer.init()
            self.click_sound = pygame.mixer.Sound(os.path.expanduser('~/dev_ws/src/gaze_control/gaze_control/ui_mouse_click.mp3'))
        except Exception as e:
            self.get_logger().error(f"Could not load click sound: {e}")
            self.click_sound = None
            
        self.move_client = self.create_client(MoveCartesian, '/ui/execute_move_to_pose')
        
        self.state = 0  # 0: wait for dwell, 1: moving to scene, 2: capturing eef & localizing, 3: moving to hover, 4: done/cooldown
        
        self.selected_object_class = None
        self.tobii_ip = "192.168.75.51"
        self.script_running = True
        
        self.last_valid_gaze = None
        self.last_valid_frame = None
        self.last_eef_debug_frame = None
        self.latest_eef_image = None
        self.eef_worker_running = True
        
        # Dwell time variables
        self.current_gazed_class = None
        self.dwell_start_time = None
        self.DWELL_THRESHOLD = 2.0  # seconds
        
        # Aruco setup for EEF camera
        try:
            self.aruco_dict = cv2.aruco.Dictionary_get(cv2.aruco.DICT_4X4_50)
            self.aruco_params = cv2.aruco.DetectorParameters_create()
            self.aruco_params.minMarkerPerimeterRate = 0.01
            self.aruco_params.cornerRefinementMethod = cv2.aruco.CORNER_REFINE_SUBPIX
        except AttributeError:
            self.aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
            self.aruco_params = cv2.aruco.DetectorParameters()
            self.aruco_params.minMarkerPerimeterRate = 0.01
            self.aruco_params.cornerRefinementMethod = cv2.aruco.CORNER_REFINE_SUBPIX
            self.aruco_detector = cv2.aruco.ArucoDetector(self.aruco_dict, self.aruco_params)
            
        self.t = threading.Thread(target=self.tobii_worker, daemon=True)
        self.t.start()
        
        self.t_eef = threading.Thread(target=self.eef_worker, daemon=True)
        self.t_eef.start()
        
        # Timer for decoupled YOLO inference
        self.gaze_timer = self.create_timer(0.1, self.check_gaze_target)
        
        self.get_logger().info("Tobii YOLO Dwell Grasp Node started. Waiting for 2s gaze focus...")

    def move_to_pose(self, x, y, z, r, p, yw, callback=None):
        if not self.move_client.wait_for_service(timeout_sec=2.0):
            self.get_logger().error("MoveCartesian service not available.")
            self.state = 0
            return
            
        req = MoveCartesian.Request()
        req.pose = [float(x), float(y), float(z), float(r), float(p), float(yw)]
        req.speed = 100.0
        req.acc = 1000.0
        req.mvtime = 0.0
        
        self.get_logger().info(f"Moving to X={x}, Y={y}, Z={z}")
        future = self.move_client.call_async(req)
        
        if callback:
            future.add_done_callback(callback)

    def tobii_worker(self):
        rtsp_url = f"rtsp://{self.tobii_ip}:8554/live/all"
        
        while self.script_running:
            try:
                container = av.open(rtsp_url, options={
                    'rtsp_transport': 'tcp', 
                    'stimeout': '5000000',
                    'ffflags': 'nobuffer',
                    'flags': 'low_delay',
                    'strict': 'experimental'
                })
                video_stream = next((s for s in container.streams if s.type == 'video'), None)
                data_stream = next((s for s in container.streams if s.type == 'data'), None)
                
                if not video_stream or not data_stream:
                    time.sleep(2)
                    continue
                
                for packet in container.demux([video_stream, data_stream]):
                    if not self.script_running:
                        break
                        
                    if packet.stream.type == 'video':
                        for frame in packet.decode():
                            self.last_valid_frame = frame.to_ndarray(format='bgr24')
                            
                    elif packet.stream.type == 'data':
                        payload = bytes(packet).decode('utf-8')
                        try:
                            data = json.loads(payload)
                            if 'gaze2d' in data:
                                self.last_valid_gaze = data['gaze2d']
                            else:
                                self.last_valid_gaze = None
                        except Exception:
                            pass
                            
            except Exception as e:
                self.get_logger().error(f"Tobii connection error: {e}")
                time.sleep(2)

    def eef_worker(self):
        while self.script_running:
            try:
                req = urllib.request.urlopen('http://192.168.0.123/html/cam_pic.php?time=0', timeout=2)
                arr = np.asarray(bytearray(req.read()), dtype=np.uint8)
                eef_img = cv2.imdecode(arr, -1)
                
                if eef_img is not None:
                    self.latest_eef_image = eef_img
                    if self.state < 2:
                        # In idle or moving-to-scene state, show raw image with status
                        disp = eef_img.copy()
                        cv2.putText(disp, "EEF Camera Stream Active", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
                        self.last_eef_debug_frame = disp
            except Exception:
                pass
            time.sleep(0.2) # Update at ~5 Hz

    def check_gaze_target(self):
        if self.last_valid_frame is None:
            return
            
        frame_copy = self.last_valid_frame.copy()
        
        has_gaze = self.last_valid_gaze is not None
        g_x = 0
        g_y = 0
        if has_gaze:
            g_x = int(self.last_valid_gaze[0] * frame_copy.shape[1])
            g_y = int(self.last_valid_gaze[1] * frame_copy.shape[0])
            cv2.circle(frame_copy, (g_x, g_y), 15, (0, 0, 255), -1)
            cv2.circle(frame_copy, (g_x, g_y), 5, (255, 255, 255), -1)
            
        results = self.yolo_model(frame_copy, verbose=False)
        
        target_class = None
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                class_name = result.names[cls_id]
                
                cv2.rectangle(frame_copy, (x1, y1), (x2, y2), (255, 100, 100), 2)
                cv2.putText(frame_copy, f"{class_name} {conf:.2f}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                if self.state == 0 and has_gaze and target_class is None:
                    if x1 <= g_x <= x2 and y1 <= g_y <= y2:
                        target_class = class_name
                        
        if self.state == 0:
            if target_class:
                if target_class == self.current_gazed_class:
                    if self.dwell_start_time is None:
                        self.dwell_start_time = time.time()
                    else:
                        elapsed = time.time() - self.dwell_start_time
                        
                        bar_w = 200
                        bar_fill = int((elapsed / self.DWELL_THRESHOLD) * bar_w)
                        bar_fill = min(bar_w, bar_fill)
                        cv2.rectangle(frame_copy, (50, 50), (50 + bar_w, 80), (100, 100, 100), -1)
                        cv2.rectangle(frame_copy, (50, 50), (50 + bar_fill, 80), (0, 255, 0), -1)
                        cv2.putText(frame_copy, f"Locking {target_class}...", (50, 45), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                        
                        if elapsed >= self.DWELL_THRESHOLD:
                            if self.click_sound:
                                self.click_sound.play()
                            self.get_logger().info(f"!!! Dwell time ({self.DWELL_THRESHOLD}s) reached for {target_class} !!! Triggering Grasp Sequence.")
                            self.selected_object_class = target_class
                            self.state = 1
                            self.dwell_start_time = None
                            self.current_gazed_class = None
                            
                            self.move_to_pose(300.0, 0.0, 400.0, 3.14, 0.0, 0.0, self.on_show_scene_reached)
                else:
                    self.current_gazed_class = target_class
                    self.dwell_start_time = time.time()
                    self.get_logger().info(f"Started focusing on: {target_class}")
            else:
                if self.current_gazed_class is not None:
                    self.get_logger().info(f"Lost focus on {self.current_gazed_class}")
                self.current_gazed_class = None
                self.dwell_start_time = None
        else:
            cv2.putText(frame_copy, f"ROBOT ACTIVE: {self.selected_object_class}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 165, 255), 3)

        cv2.imshow("Tobii Gaze Grasp Stream", frame_copy)
        if self.last_eef_debug_frame is not None:
            cv2.imshow("EEF Debug View", self.last_eef_debug_frame)
        cv2.waitKey(1)

    def on_show_scene_reached(self, future):
        res = future.result()
        if res.ret != 0:
            self.get_logger().error(f"Failed to move to Show Scene: {res.message}")
            self.state = 0
            return
            
        self.get_logger().info("Reached Show Scene. Waiting 3 seconds for camera/robot to settle...")
        self.state = 2
        self.settle_timer = self.create_timer(3.0, self.capture_eef_image)

    def capture_eef_image(self):
        if hasattr(self, 'settle_timer') and self.settle_timer:
            self.settle_timer.cancel()
            self.settle_timer = None

        self.get_logger().info("Capturing EEF image for localization...")
        if self.latest_eef_image is None:
            self.get_logger().error("No EEF image available!")
            self.state = 0
            return
            
        eef_img = self.latest_eef_image.copy()
        
        # Process image directly on the latest grabbed frame
        self.process_eef_image(eef_img)

    def process_eef_image(self, eef_img):
        KNOWN_MARKERS = {
            0: (150.0, 150.0),
            1: (150.0, 0.0),
            2: (150.0, -150.0),
            3: (150.0, -250.0),
            4: (250.0, 200.0),
            5: (400.0, 200.0),
            6: (425.0, 100.0),
            7: (425.0, 0.0),
            8: (425.0, -100.0),
            9: (425.0, -200.0),
            10: (350.0, -200.0),
            11: (250.0, -200.0)
        }
        
        debug_img = eef_img.copy()
        
        # --- YOLO Detection (Run early so we see boxes even if ArUco fails) ---
        results = self.yolo_model(eef_img, verbose=False)
        target_box = None
        
        for result in results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                class_name = result.names[cls_id]
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                color = (0, 255, 0) if class_name == self.selected_object_class else (0, 0, 255)
                cv2.rectangle(debug_img, (x1, y1), (x2, y2), color, 2)
                cv2.putText(debug_img, class_name, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
                
                if class_name == self.selected_object_class:
                    target_box = box.xyxy[0]
                    break
            if target_box is not None:
                break

        # --- ArUco Marker Detection (Original Resolution with CLAHE) ---
        gray = cv2.cvtColor(eef_img, cv2.COLOR_BGR2GRAY)
        
        # Apply CLAHE to improve contrast and handle varied lighting
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        gray_enhanced = clahe.apply(gray)
        
        # 1. Normal detection
        try:
            corners1, ids1, _ = cv2.aruco.detectMarkers(gray_enhanced, self.aruco_dict, parameters=self.aruco_params)
        except AttributeError:
            corners1, ids1, _ = self.aruco_detector.detectMarkers(gray_enhanced)
            
        # 2. Flipped detection (to handle physically mirrored printouts of the board)
        gray_flipped = cv2.flip(gray_enhanced, 1)
        try:
            corners2, ids2, _ = cv2.aruco.detectMarkers(gray_flipped, self.aruco_dict, parameters=self.aruco_params)
        except AttributeError:
            corners2, ids2, _ = self.aruco_detector.detectMarkers(gray_flipped)
            
        corners = []
        ids_list = []
        
        if ids1 is not None and len(ids1) > 0:
            for i, c in enumerate(corners1):
                corners.append(c)
                ids_list.append(ids1[i][0])
                
        if ids2 is not None and len(ids2) > 0:
            w = gray_enhanced.shape[1]
            for i, c in enumerate(corners2):
                # Only add if we haven't found this ID already
                if ids2[i][0] not in ids_list:
                    c_unf = c.copy()
                    # Unflip the X coordinates of the corners
                    c_unf[0, :, 0] = w - 1 - c_unf[0, :, 0]
                    # Restore correct ArUco corner ordering (top-left, top-right, bottom-right, bottom-left)
                    c_unf = c_unf[:, [1, 0, 3, 2], :]
                    corners.append(c_unf)
                    ids_list.append(ids2[i][0])
                    
        if len(ids_list) > 0:
            ids = np.array([[i] for i in ids_list], dtype=np.int32)
            cv2.aruco.drawDetectedMarkers(debug_img, corners, ids)
        else:
            ids = None
            
        if ids is None or len(ids) == 0:
            self.get_logger().warning("No ArUco markers found in EEF image. Cannot calculate homography.")
            cv2.putText(debug_img, "ERR: No ArUco Markers!", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 3)
            self.last_eef_debug_frame = debug_img
            self.state = 0
            return
            
        src_pts = []
        dst_pts = []
        
        ids_flat = ids.flatten().tolist()
        for i, marker_id in enumerate(ids_flat):
            if marker_id in KNOWN_MARKERS:
                c = corners[i][0]
                cx = np.mean(c[:, 0])
                cy = np.mean(c[:, 1])
                src_pts.append([cx, cy])
                dst_pts.append([KNOWN_MARKERS[marker_id][0], KNOWN_MARKERS[marker_id][1]])
                
        if len(src_pts) < 4:
            self.get_logger().warning(f"Not enough known ArUco markers found ({len(src_pts)}, need at least 4).")
            cv2.putText(debug_img, f"ERR: Only {len(src_pts)} Markers (Need 4)!", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 3)
            self.last_eef_debug_frame = debug_img
            self.state = 0
            return
            
        src_pts = np.array(src_pts, dtype=np.float32)
        dst_pts = np.array(dst_pts, dtype=np.float32)
        
        H, _ = cv2.findHomography(src_pts, dst_pts)
        if H is None:
            self.get_logger().error("Failed to compute homography matrix.")
            cv2.putText(debug_img, "ERR: Homography Failed!", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 3)
            self.last_eef_debug_frame = debug_img
            self.state = 0
            return
            
        self.get_logger().info("Homography successfully computed based on ArUco markers.")
                
        if target_box is None:
            self.get_logger().warning(f"Could not find {self.selected_object_class} in EEF image.")
            cv2.putText(debug_img, f"ERR: {self.selected_object_class} not found!", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 3)
            self.last_eef_debug_frame = debug_img
            self.state = 0
            return
            
        x1, y1, x2, y2 = target_box
        obj_cx = float((x1 + x2) / 2.0)
        obj_cy = float((y1 + y2) / 2.0)
        
        pt_px = np.array([[[obj_cx, obj_cy]]], dtype=np.float32)
        pt_robot = cv2.perspectiveTransform(pt_px, H)
        
        target_x = float(pt_robot[0][0][0])
        target_y = float(pt_robot[0][0][1])
        target_z = 100.0  # Hover height (Z value constant at 100mm)
        
        self.get_logger().info(f"Object {self.selected_object_class} found! Hovering at X={target_x:.1f}, Y={target_y:.1f}, Z={target_z:.1f}")
        
        cv2.putText(debug_img, f"Calculated X:{target_x:.1f} Y:{target_y:.1f}", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 3)
        cv2.putText(debug_img, "Moving in 3s...", (20, 90), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 165, 255), 3)
        self.last_eef_debug_frame = debug_img
        
        self.state = 3
        # Add a delay so the user has more time to process the image and verify the debug view
        self.get_logger().info("Giving the system 3 seconds to show processed image before moving...")
        self.move_timer = self.create_timer(3.0, lambda: self.execute_hover_move(target_x, target_y, target_z))

    def execute_hover_move(self, target_x, target_y, target_z):
        if hasattr(self, 'move_timer') and self.move_timer:
            self.move_timer.cancel()
            self.move_timer = None
            
        self.state = 4
        self.get_logger().info("Executing move to object!")
        self.move_to_pose(target_x, target_y, target_z, 3.14, 0.0, 0.0, self.on_hover_reached)

    def on_hover_reached(self, future):
        res = future.result()
        if res.ret == 0:
            self.get_logger().info("Hovering complete. Ready for next command.")
        else:
            self.get_logger().error(f"Hover move failed: {res.message}")
            
        self.state = 0

def main(args=None):
    rclpy.init(args=args)
    node = TobiiYoloToGraspRoutine()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.script_running = False
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
