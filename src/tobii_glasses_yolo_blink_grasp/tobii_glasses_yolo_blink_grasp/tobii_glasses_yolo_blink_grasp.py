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

from ultralytics import YOLO

class TobiiYoloBlinkGrasp(Node):
    def __init__(self):
        super().__init__('tobii_glasses_yolo_blink_grasp')
        
        yolo_path = os.path.expanduser('~/dev_ws/my_yolo_model.pt')
        if not os.path.exists(yolo_path):
            self.get_logger().error(f"YOLO model not found at {yolo_path}")
            return
            
        self.yolo_model = YOLO(yolo_path)
        self.move_client = self.create_client(MoveCartesian, '/ui/execute_move_to_pose')
        
        self.state = 0  # 0: wait for blink, 1: moving to scene, 2: capturing eef & localizing, 3: moving to hover, 4: done/cooldown
        
        self.blink_times = []
        self.last_blink_state = False
        
        self.selected_object_class = None
        self.tobii_ip = "192.168.75.51"
        self.script_running = True
        
        self.last_valid_gaze = None
        self.last_valid_frame = None
        
        # Aruco setup for EEF camera
        try:
            self.aruco_dict = cv2.aruco.Dictionary_get(cv2.aruco.DICT_4X4_50)
            self.aruco_params = cv2.aruco.DetectorParameters_create()
        except AttributeError:
            self.aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
            self.aruco_params = cv2.aruco.DetectorParameters()
            self.aruco_detector = cv2.aruco.ArucoDetector(self.aruco_dict, self.aruco_params)
            
        self.t = threading.Thread(target=self.tobii_worker, daemon=True)
        self.t.start()
        self.get_logger().info("Tobii YOLO Blink Grasp Node started. Waiting for 4x blink...")

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
                container = av.open(rtsp_url, options={'rtsp_transport': 'tcp', 'stimeout': '5000000'})
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
                            has_gaze = 'gaze2d' in data
                            
                            if has_gaze:
                                self.last_valid_gaze = data['gaze2d']
                                
                            current_blink_state = not has_gaze
                            
                            if current_blink_state and not self.last_blink_state:
                                current_time = time.time()
                                self.blink_times = [t for t in self.blink_times if current_time - t < 2.0]
                                self.blink_times.append(current_time)
                                
                                if len(self.blink_times) >= 4 and self.state == 0:
                                    self.get_logger().info("4x Blink Triggered!")
                                    self.blink_times = []
                                    self.process_trigger()
                                    
                            self.last_blink_state = current_blink_state
                            
                        except Exception as e:
                            pass
                            
            except Exception as e:
                self.get_logger().error(f"Tobii connection error: {e}")
                time.sleep(2)

    def process_trigger(self):
        if self.last_valid_frame is None or self.last_valid_gaze is None:
            self.get_logger().warning("No valid frame or gaze to process trigger.")
            return
            
        results = self.yolo_model(self.last_valid_frame, verbose=False)
        g_x = int(self.last_valid_gaze[0] * self.last_valid_frame.shape[1])
        g_y = int(self.last_valid_gaze[1] * self.last_valid_frame.shape[0])
        
        target_class = None
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0]
                if x1 <= g_x <= x2 and y1 <= g_y <= y2:
                    cls_id = int(box.cls[0])
                    target_class = result.names[cls_id]
                    break
            if target_class:
                break
                
        if not target_class:
            self.get_logger().warning(f"Looked at nothing recognizable at {g_x},{g_y}.")
            return
            
        self.get_logger().info(f"Target selected via Tobii: {target_class}")
        self.selected_object_class = target_class
        self.state = 1
        
        self.move_to_pose(300.0, 0.0, 400.0, 3.14, 0.0, 0.0, self.on_show_scene_reached)

    def on_show_scene_reached(self, future):
        res = future.result()
        if res.ret != 0:
            self.get_logger().error(f"Failed to move to Show Scene: {res.message}")
            self.state = 0
            return
            
        self.get_logger().info("Reached Show Scene. Capturing EEF image for localization...")
        # Short wait to let camera stabilize
        time.sleep(1.0)
        self.state = 2
        
        try:
            req = urllib.request.urlopen('http://192.168.0.123/html/cam_pic.php?time=0', timeout=5)
            arr = np.asarray(bytearray(req.read()), dtype=np.uint8)
            eef_img = cv2.imdecode(arr, -1)
            
            if eef_img is None:
                self.get_logger().error("Failed to decode EEF image")
                self.state = 0
                return
                
            self.process_eef_image(eef_img)
        except Exception as e:
            self.get_logger().error(f"Error fetching EEF image: {e}")
            self.state = 0

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
        
        # 1. Detect ArUco
        try:
            corners, ids, _ = cv2.aruco.detectMarkers(eef_img, self.aruco_dict, parameters=self.aruco_params)
        except AttributeError:
            corners, ids, _ = self.aruco_detector.detectMarkers(eef_img)
            
        if ids is None or len(ids) == 0:
            self.get_logger().warning("No ArUco markers found in EEF image. Cannot calculate homography.")
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
            self.get_logger().warning(f"Not enough known ArUco markers found ({len(src_pts)}/4).")
            self.state = 0
            return
            
        src_pts = np.array(src_pts, dtype=np.float32)
        dst_pts = np.array(dst_pts, dtype=np.float32)
        
        H, _ = cv2.findHomography(src_pts, dst_pts)
        if H is None:
            self.get_logger().error("Failed to compute homography matrix.")
            self.state = 0
            return
            
        self.get_logger().info("Homography successfully computed based on ArUco markers.")
        
        # 2. Run YOLO to find target
        results = self.yolo_model(eef_img, verbose=False)
        target_box = None
        
        for result in results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                class_name = result.names[cls_id]
                if class_name == self.selected_object_class:
                    target_box = box.xyxy[0]
                    break
            if target_box is not None:
                break
                
        if target_box is None:
            self.get_logger().warning(f"Could not find {self.selected_object_class} in EEF image.")
            self.state = 0
            return
            
        # 3. Calculate target coordinates using Homography
        x1, y1, x2, y2 = target_box
        obj_cx = float((x1 + x2) / 2.0)
        obj_cy = float((y1 + y2) / 2.0)
        
        pt_px = np.array([[[obj_cx, obj_cy]]], dtype=np.float32)
        pt_robot = cv2.perspectiveTransform(pt_px, H)
        
        target_x = float(pt_robot[0][0][0])
        target_y = float(pt_robot[0][0][1])
        target_z = 200.0  # Hover height
        
        self.get_logger().info(f"Object {self.selected_object_class} found! Hovering at X={target_x:.1f}, Y={target_y:.1f}, Z={target_z:.1f}")
        
        self.state = 3
        self.move_to_pose(target_x, target_y, target_z, 3.14, 0.0, 0.0, self.on_hover_reached)

    def on_hover_reached(self, future):
        res = future.result()
        if res.ret == 0:
            self.get_logger().info("Hovering complete. Ready for next command.")
        else:
            self.get_logger().error(f"Hover move failed: {res.message}")
            
        # Reset state
        self.state = 0

def main(args=None):
    rclpy.init(args=args)
    node = TobiiYoloBlinkGrasp()
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
