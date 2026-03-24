#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import rclpy
from rclpy.node import Node
import cv2
import numpy as np
import os
import yaml
import sys
from ultralytics import YOLO
from geometry_msgs.msg import Pose, PoseArray

# #############################################################################
# 1. SEKTION: KONFIGURATION
# #############################################################################

# -- System & Pfade --
WORLD_FRAME = "base_link"
MODEL_PATH  = "~/dev_ws/src/yolo_object_detector/models/best.pt"
STREAM_URL  = "http://192.168.0.125/html/cam_pic_new.php"
H_YAML_PATH = os.path.expanduser('~/dev_ws/src/yolo_object_detector/homography.yaml')

# -- Feature Toggles --
SHOW_ARUCO_POSITIONS = True   
SHOW_YOLO_DETECTIONS = True   

# -- Fenster & Tisch --
WINDOW_NAME   = "YOLO ROBOT VIEW" 
WINDOW_WIDTH  = 1280   
WINDOW_HEIGHT = 960    
TABLE_HEIGHT  = 0.090         # Z-Höhe für ROS (in Metern)

# -- Visuelle Stile: ArUco (BGR Format) --
COLOR_ARUCO_BOX  = (0, 255, 0)      
COLOR_ARUCO_TEXT = (0, 255, 255)    
THICKNESS_ARUCO  = 1                # MUSS Integer sein
FONT_SCALE_ARUCO = 0.4              

# -- Visuelle Stile: YOLO (BGR Format) --
THICKNESS_YOLO   = 2                # MUSS Integer sein (war 0.3 -> Fehler)
FONT_SCALE_YOLO  = 0.5              
COLOR_MAP = {
    "red rectangle":  (0, 0, 255),  
    "blue cube":      (255, 0, 0),  
    "green cylinder": (0, 255, 0)   
}

# -- ArUco & Homographie Parameter --
ARUCO_DICT        = cv2.aruco.DICT_4X4_50
MIN_MARKERS_FOR_H = 4         
H_UPDATE_INTERVAL = 30        

# -- YOLO Klassen & Topics --
DEFAULT_CLASSES = ["red rectangle", "blue cube", "green cylinder"]
CLASS_TO_TOPIC = {
    "red rectangle":  "/objects/red_rectangle/world_poses",
    "blue cube":      "/objects/blue_cube/world_poses",
    "green cylinder": "/objects/green_cylinder/world_poses",
}

MARKERS_ROBOT_XY = {
    0: (0.150, 0.150), 
    1: (0.150, 0.000), 
    2: (0.150, -0.150), 
    3: (0.150, -0.250),
    4: (0.250, 0.200), 
    5: (0.400, 0.200), 
    6: (0.425, 0.100), 
    7: (0.425, 0.000),
    8: (0.425, -0.100), 
    9: (0.425, -0.200), 
    10: (0.350, -0.200), 
    11: (0.250, -0.200),
}

class YoloHomographyNode(Node):
    def __init__(self):
        super().__init__('yolo_object_detector')
        
        self.get_logger().info("Starte YOLO Homography Node...")

        # ROS Parameter
        self.declare_parameter('confidence_threshold', 0.8)
        self.conf_threshold = self.get_parameter('confidence_threshold').value

        self.H = None
        self.frame_count = 0
        self.last_aruco_boxes_xyxy = []
        self._window_initialized = False 
        
        self._try_load_H_from_yaml()

        # YOLO Initialisierung
        self.model = YOLO(os.path.expanduser(MODEL_PATH))
        self.cap = cv2.VideoCapture(STREAM_URL)
        
        # ArUco
        self.aruco_dict = cv2.aruco.getPredefinedDictionary(ARUCO_DICT)
        self.aruco_params = cv2.aruco.DetectorParameters()
        self.aruco_detector = cv2.aruco.ArucoDetector(self.aruco_dict, self.aruco_params)

        # Publisher
        self.pose_pubs = {label: self.create_publisher(PoseArray, CLASS_TO_TOPIC[label], 10) 
                          for label in DEFAULT_CLASSES}

        self.timer = self.create_timer(0.03, self._on_timer)

    def _try_load_H_from_yaml(self):
        if os.path.exists(H_YAML_PATH):
            try:
                with open(H_YAML_PATH, 'r') as f:
                    data = yaml.safe_load(f)
                    if data and 'H' in data:
                        self.H = np.array(data['H'], dtype=np.float32)
                        self.get_logger().info("Homographie-Matrix geladen.")
            except Exception as e:
                self.get_logger().warn(f"Fehler beim Laden der YAML: {e}")

    def _save_H_to_yaml(self):
        if self.H is not None:
            with open(H_YAML_PATH, 'w') as f:
                yaml.safe_dump({'H': self.H.tolist()}, f)

    def _pixel_to_robot_xy(self, u, v):
        if self.H is None: return None
        pts = np.array([[[u, v]]], dtype=np.float32)
        res = cv2.perspectiveTransform(pts, self.H)
        return float(res[0,0,0]), float(res[0,0,1])

    def _on_timer(self):
        ret, frame = self.cap.read()
        if not ret: return

        # 1. ArUco Marker erkennen & Homographie updaten
        corners, ids, _ = self.aruco_detector.detectMarkers(frame)
        image_pts, world_pts = [], []
        self.last_aruco_boxes_xyxy = []

        if ids is not None:
            for i, cid in enumerate(ids.flatten()):
                cid = int(cid)
                c = corners[i][0]
                self.last_aruco_boxes_xyxy.append([np.min(c[:, 0]), np.min(c[:, 1]), np.max(c[:, 0]), np.max(c[:, 1])])
                
                if cid in MARKERS_ROBOT_XY:
                    image_pts.append(np.mean(c, axis=0))
                    world_pts.append(MARKERS_ROBOT_XY[cid])

                    if SHOW_ARUCO_POSITIONS:
                        pts = c.astype(np.int32)
                        cv2.polylines(frame, [pts], True, COLOR_ARUCO_BOX, THICKNESS_ARUCO)
                        cx, cy = int(np.mean(c[:, 0])), int(np.mean(c[:, 1]))
                        cv2.putText(frame, f"ID{cid}", (cx, cy), cv2.FONT_HERSHEY_SIMPLEX, 
                                    FONT_SCALE_ARUCO, COLOR_ARUCO_TEXT, THICKNESS_ARUCO)

        if len(image_pts) >= MIN_MARKERS_FOR_H and (self.frame_count % H_UPDATE_INTERVAL == 0 or self.H is None):
            new_H, _ = cv2.findHomography(np.array(image_pts), np.array(world_pts), cv2.RANSAC, 5.0)
            if new_H is not None:
                self.H = new_H.astype(np.float32)
                self._save_H_to_yaml()

        # 2. YOLO Detektion
        results = self.model.predict(source=frame, conf=self.conf_threshold, verbose=False)
        timestamp = self.get_clock().now().to_msg()
        poses_by_label = {label: PoseArray() for label in DEFAULT_CLASSES}

        for res in results:
            for box in res.boxes:
                # Koordinaten explizit zu int für OpenCV
                x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
                cls_id = int(box.cls[0].cpu().item())
                label = self.model.names[cls_id]

                if label not in DEFAULT_CLASSES: continue

                # Umrechnung Pixel -> Roboter (Mitte der Box)
                u, v = (x1 + x2) / 2, (y1 + y2) / 2
                xy = self._pixel_to_robot_xy(u, v)

                if xy:
                    p = Pose()
                    p.position.x, p.position.y, p.position.z = xy[0], xy[1], TABLE_HEIGHT
                    p.orientation.w = 1.0
                    poses_by_label[label].poses.append(p)
                    
                    if SHOW_YOLO_DETECTIONS:
                        color = COLOR_MAP.get(label, (255, 255, 255))
                        # Hier war der Fehler: Alle Werte müssen int() sein
                        cv2.rectangle(frame, (x1, y1), (x2, y2), color, int(THICKNESS_YOLO))
                        label_str = f"{label} ({int(xy[0]*1000)}, {int(xy[1]*1000)}mm)"
                        cv2.putText(frame, label_str, (x1, y1 - 10), 
                                    cv2.FONT_HERSHEY_SIMPLEX, FONT_SCALE_YOLO, color, 1)

        # 3. Publizieren & Anzeigen
        for label, pa in poses_by_label.items():
            if pa.poses:
                pa.header.frame_id = WORLD_FRAME
                pa.header.stamp = timestamp
                self.pose_pubs[label].publish(pa)

        cv2.imshow(WINDOW_NAME, frame)
        if not self._window_initialized:
            cv2.resizeWindow(WINDOW_NAME, WINDOW_WIDTH, WINDOW_HEIGHT)
            self._window_initialized = True
        cv2.waitKey(1)
        self.frame_count += 1

    def destroy_node(self):
        self.cap.release()
        cv2.destroyAllWindows()
        super().destroy_node()

def main(args=None):
    rclpy.init(args=args)
    node = YoloHomographyNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
