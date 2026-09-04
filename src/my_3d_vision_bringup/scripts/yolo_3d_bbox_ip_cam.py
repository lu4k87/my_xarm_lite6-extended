#!/usr/bin/env python3
import math
import rclpy
from rclpy.node import Node
from visualization_msgs.msg import Marker, MarkerArray
from geometry_msgs.msg import Point
import cv2
import urllib.request
import numpy as np
import time
import os

try:
    from ultralytics import YOLO
except ImportError:
    print("Bitte installiere ultralytics: pip3 install ultralytics")
    exit(1)

class IPCamYolo3DNode(Node):
    def __init__(self):
        super().__init__('yolo_3d_bbox_ip_cam')
        
        yolo_path = os.path.expanduser('~/dev_ws/my_yolo_model.pt')
        self.get_logger().info(f'Lade {yolo_path} Modell...')
        self.model = YOLO(yolo_path)
        self.get_logger().info('Modell erfolgreich geladen (nutzt GPU falls verfügbar).')
        
        # Publisher for the 3D Markers (so the UI can see it)
        self.pub_markers = self.create_publisher(MarkerArray, '/zed/bboxes_3d', 10)
        
        # Color mapping for different classes
        self.colors = np.random.uniform(0.3, 1.0, size=(100, 3))
        
        # Aruco setup for Homography
        try:
            self.aruco_dict = cv2.aruco.Dictionary_get(cv2.aruco.DICT_4X4_50)
            self.aruco_params = cv2.aruco.DetectorParameters_create()
            self.aruco_params.minMarkerPerimeterRate = 0.01
            self.aruco_params.cornerRefinementMethod = cv2.aruco.CORNER_REFINE_APRILTAG
            self.aruco_params.adaptiveThreshWinSizeMin = 3
            self.aruco_params.adaptiveThreshWinSizeMax = 23
            self.aruco_params.adaptiveThreshWinSizeStep = 10
        except AttributeError:
            self.aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
            self.aruco_params = cv2.aruco.DetectorParameters()
            self.aruco_params.minMarkerPerimeterRate = 0.01
            self.aruco_params.cornerRefinementMethod = cv2.aruco.CORNER_REFINE_APRILTAG
            self.aruco_params.adaptiveThreshWinSizeMin = 3
            self.aruco_params.adaptiveThreshWinSizeMax = 23
            self.aruco_params.adaptiveThreshWinSizeStep = 10
            self.aruco_detector = cv2.aruco.ArucoDetector(self.aruco_dict, self.aruco_params)
            
        self.KNOWN_MARKERS = {
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
        
        # Dimensions overrides (m)
        self.dimension_overrides = {
            'sports ball': (0.0654, 0.0654, 0.0654),
            'cup': (0.08, 0.08, 0.095),
            'blue_cube': (0.03, 0.03, 0.03),
            'red_rectangle': (0.06, 0.03, 0.03),
            'green_cylinder': (0.03, 0.03, 0.03)
        }
        
        # EMA Filtering state
        self.ema_states = {}
        self.alpha = 0.2
        self.last_H = None
        
        # Timer at 4 Hz
        self.timer = self.create_timer(0.25, self.process_frame)
        self.get_logger().info('IP Cam YOLO Homography Node gestartet (.123)')

    def get_homography_and_draw(self, img, draw=True, scale_factor=1.8):
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        try:
            corners1, ids1, _ = cv2.aruco.detectMarkers(gray, self.aruco_dict, parameters=self.aruco_params)
        except AttributeError:
            corners1, ids1, _ = self.aruco_detector.detectMarkers(gray)
            
        gray_flipped = cv2.flip(gray, 1)
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
            w = gray.shape[1]
            for i, c in enumerate(corners2):
                if ids2[i][0] not in ids_list:
                    c_unf = c.copy()
                    c_unf[0, :, 0] = w - 1 - c_unf[0, :, 0]
                    c_unf = c_unf[:, [1, 0, 3, 2], :]
                    corners.append(c_unf)
                    ids_list.append(ids2[i][0])

        big_img = img.copy()
        if draw:
            big_img = cv2.resize(img, (0, 0), fx=scale_factor, fy=scale_factor)
            if len(ids_list) > 0:
                scaled_corners = [c * scale_factor for c in corners]
                for i, marker_id in enumerate(ids_list):
                    c = scaled_corners[i][0]
                    pts = np.int32(c).reshape(-1, 1, 2)
                    cv2.polylines(big_img, [pts], True, (0, 255, 0), 1, cv2.LINE_AA)
                    
                    cx = int(np.mean(c[:, 0]))
                    cy = int(np.mean(c[:, 1]))
                    
                    if marker_id in self.KNOWN_MARKERS:
                        mx, my = self.KNOWN_MARKERS[marker_id]
                        cv2.arrowedLine(big_img, (cx, cy), (cx + 35, cy), (0, 0, 255), 1, line_type=cv2.LINE_AA, tipLength=0.2)
                        cv2.putText(big_img, "X", (cx + 40, cy + 3), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1, cv2.LINE_AA)
                        cv2.arrowedLine(big_img, (cx, cy), (cx, cy - 35), (0, 255, 0), 1, line_type=cv2.LINE_AA, tipLength=0.2)
                        cv2.putText(big_img, "Y", (cx - 4, cy - 40), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 0), 1, cv2.LINE_AA)
                        coord_text = f"ID:{marker_id} [{mx:.0f}, {my:.0f}]"
                        cv2.putText(big_img, coord_text, (cx + 5, cy + 15), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 0), 1, cv2.LINE_AA)
                    else:
                        cv2.putText(big_img, f"ID:{marker_id}", (cx, cy), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 0, 0), 1, cv2.LINE_AA)

        src_pts = []
        dst_pts = []
        
        for i, marker_id in enumerate(ids_list):
            if marker_id in self.KNOWN_MARKERS:
                c = corners[i][0]
                cx = np.mean(c[:, 0])
                cy = np.mean(c[:, 1])
                src_pts.append([cx, cy])
                dst_pts.append([self.KNOWN_MARKERS[marker_id][0], self.KNOWN_MARKERS[marker_id][1]])
                
        H = None
        if len(src_pts) >= 4:
            src_pts = np.array(src_pts, dtype=np.float32)
            dst_pts = np.array(dst_pts, dtype=np.float32)
            H, _ = cv2.findHomography(src_pts, dst_pts)
            
        return H, big_img

    def process_frame(self):
        try:
            req = urllib.request.urlopen('http://192.168.0.123/html/cam_pic.php?time=0', timeout=2)
            arr = np.asarray(bytearray(req.read()), dtype=np.uint8)
            eef_img = cv2.imdecode(arr, -1)
        except Exception as e:
            self.get_logger().error(f"Failed to fetch IP camera image: {e}")
            return
            
        if eef_img is None:
            return

        H, big_img = self.get_homography_and_draw(eef_img, draw=True, scale_factor=1.8)
        if H is not None:
            self.last_H = H
        else:
            H = self.last_H
            
        if not hasattr(self, 'window_created'):
            cv2.namedWindow('IP Camera 3D Bounding Boxes (.123)', cv2.WINDOW_NORMAL)
            cv2.resizeWindow('IP Camera 3D Bounding Boxes (.123)', 1280, 960)
            self.window_created = True
            
        if H is None:
            self.get_logger().warning("No ArUco markers found. Cannot calculate homography.")
            # Clear UI markers if no tracking
            clear_marker = Marker()
            clear_marker.action = Marker.DELETEALL
            m_array = MarkerArray()
            m_array.markers.append(clear_marker)
            self.pub_markers.publish(m_array)
            
            cv2.imshow('IP Camera 3D Bounding Boxes (.123)', big_img)
            cv2.waitKey(1)
            return

        results = self.model.predict(eef_img, verbose=False, conf=0.25)
        
        marker_array = MarkerArray()
        clear_marker = Marker()
        clear_marker.action = Marker.DELETEALL
        marker_array.markers.append(clear_marker)
        
        if len(results) == 0 or len(results[0].boxes) == 0:
            self.pub_markers.publish(marker_array)
            cv2.imshow('IP Camera 3D Bounding Boxes (.123)', big_img)
            cv2.waitKey(1)
            return

        boxes = results[0].boxes.xyxy.cpu().numpy()
        classes = results[0].boxes.cls.cpu().numpy().astype(int)
        names = results[0].names
        
        current_time = self.get_clock().now().to_msg()
        current_t = current_time.sec + current_time.nanosec * 1e-9

        for i, (box, cls_id) in enumerate(zip(boxes, classes)):
            x_min, y_min, x_max, y_max = map(int, box)
            
            # Draw YOLO boxes on big_img
            conf = float(results[0].boxes.conf[i].cpu().numpy())
            class_name = names[cls_id]
            sx1, sy1, sx2, sy2 = int(x_min*1.8), int(y_min*1.8), int(x_max*1.8), int(y_max*1.8)
            cv2.rectangle(big_img, (sx1, sy1), (sx2, sy2), (255, 100, 100), 2, cv2.LINE_AA)
            cv2.putText(big_img, f"{class_name} {conf:.2f}", (sx1, sy1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
            
            
            # Bottom center of bounding box to project to table surface (Z=0)
            obj_cx = (x_min + x_max) / 2.0
            obj_cy = y_max
            
            pt_px = np.array([[[obj_cx, obj_cy]]], dtype=np.float32)
            pt_robot = cv2.perspectiveTransform(pt_px, H)
            
            target_x_mm = float(pt_robot[0][0][0])
            target_y_mm = float(pt_robot[0][0][1])
            
            center_x = target_x_mm / 1000.0
            center_y = target_y_mm / 1000.0
            
            cls_name = names[cls_id]
            if cls_name in self.dimension_overrides:
                dx, dy, dz = self.dimension_overrides[cls_name]
                scale_x, scale_y, scale_z = dx, dy, dz
            else:
                width_px = x_max - x_min
                # Rough approximation: convert px width to meters
                scale_x = scale_y = scale_z = max(0.02, width_px * 0.001)
                
            center_z = scale_z / 2.0
            
            # --- Exponential Moving Average (EMA) Smoothing ---
            state = np.array([center_x, center_y, center_z, scale_x, scale_y, scale_z])
            
            if cls_id not in self.ema_states:
                self.ema_states[cls_id] = {}
                
            expired_ids = [obj_id for obj_id, s in self.ema_states[cls_id].items() if (current_t - s['last_seen']) > 2.0]
            for obj_id in expired_ids:
                del self.ema_states[cls_id][obj_id]
            
            best_match_id = -1
            min_dist = float('inf')
            
            for obj_id, s in self.ema_states[cls_id].items():
                if s['last_seen'] == current_t: continue 
                dist = np.linalg.norm(s['state'][:3] - state[:3])
                if dist < 0.3:
                    if dist < min_dist:
                        min_dist = dist
                        best_match_id = obj_id
            
            if best_match_id != -1:
                self.ema_states[cls_id][best_match_id]['state'] = self.alpha * state + (1.0 - self.alpha) * self.ema_states[cls_id][best_match_id]['state']
                self.ema_states[cls_id][best_match_id]['last_seen'] = current_t
                center_x, center_y, center_z, scale_x, scale_y, scale_z = self.ema_states[cls_id][best_match_id]['state']
                assigned_id = best_match_id
            else:
                existing_ids = self.ema_states[cls_id].keys()
                assigned_id = 1
                while assigned_id in existing_ids: assigned_id += 1
                self.ema_states[cls_id][assigned_id] = {'state': state, 'last_seen': current_t}
                
            color = self.colors[cls_id % 100]
            class_name = names[cls_id]
            if len(self.ema_states[cls_id]) > 1:
                class_name = f"{class_name}_{assigned_id}"

            marker_frame = 'link_base'

            # --- Marker 1: The Bounding Box Edges (Line List) ---
            marker = Marker()
            marker.header.stamp = current_time
            marker.header.frame_id = marker_frame
            marker.ns = 'yolo_bboxes'
            marker.id = i
            marker.type = Marker.LINE_LIST
            marker.action = Marker.ADD
            marker.pose.orientation.w = 1.0
            marker.scale.x = 0.002
            
            e_min_x = center_x - scale_x / 2.0
            e_max_x = center_x + scale_x / 2.0
            e_min_y = center_y - scale_y / 2.0
            e_max_y = center_y + scale_y / 2.0
            e_min_z = center_z - scale_z / 2.0
            e_max_z = center_z + scale_z / 2.0
            
            p1 = Point(x=float(e_min_x), y=float(e_min_y), z=float(e_min_z))
            p2 = Point(x=float(e_max_x), y=float(e_min_y), z=float(e_min_z))
            p3 = Point(x=float(e_max_x), y=float(e_max_y), z=float(e_min_z))
            p4 = Point(x=float(e_min_x), y=float(e_max_y), z=float(e_min_z))
            p5 = Point(x=float(e_min_x), y=float(e_min_y), z=float(e_max_z))
            p6 = Point(x=float(e_max_x), y=float(e_min_y), z=float(e_max_z))
            p7 = Point(x=float(e_max_x), y=float(e_max_y), z=float(e_max_z))
            p8 = Point(x=float(e_min_x), y=float(e_max_y), z=float(e_max_z))
            
            marker.points = [
                p1, p2, p2, p3, p3, p4, p4, p1,
                p5, p6, p6, p7, p7, p8, p8, p5,
                p1, p5, p2, p6, p3, p7, p4, p8
            ]
            marker.color.r = float(color[0])
            marker.color.g = float(color[1])
            marker.color.b = float(color[2])
            marker.color.a = 0.8
            marker.lifetime.sec = 1
            marker_array.markers.append(marker)
            
            x_mm = int(center_x * 1000)
            y_mm = int(center_y * 1000)
            display_z = center_z + (scale_z / 2.0)
            z_mm = int(display_z * 1000)
            safe_class_name = class_name.replace(' ', '_')
            
            # --- Marker 2: Sphere ---
            point_marker = Marker()
            point_marker.header.stamp = current_time
            point_marker.header.frame_id = marker_frame
            point_marker.ns = 'yolo_object_grasp_center_point'
            point_marker.id = i
            point_marker.type = Marker.SPHERE
            point_marker.action = Marker.ADD
            point_marker.pose.position.x = float(center_x)
            point_marker.pose.position.y = float(center_y)
            point_marker.pose.position.z = float(display_z)
            point_marker.pose.orientation.w = 1.0
            point_marker.scale.x = 0.015
            point_marker.scale.y = 0.015
            point_marker.scale.z = 0.015
            point_marker.color.r = 1.0
            point_marker.color.a = 1.0
            point_marker.lifetime.sec = 1
            marker_array.markers.append(point_marker)
            
            def create_text_marker(ns_suffix, m_id, text, r, g, b, z_offset):
                tm = Marker()
                tm.header.frame_id = marker_frame
                tm.header.stamp = current_time
                tm.ns = f'yolo_labels_{ns_suffix}'
                tm.id = m_id
                tm.type = Marker.TEXT_VIEW_FACING
                tm.action = Marker.ADD
                tm.pose.position.x = float(center_x)
                tm.pose.position.y = float(center_y)
                tm.pose.position.z = float(display_z) + 0.02 + z_offset
                tm.pose.orientation.w = 1.0
                tm.scale.z = 0.010
                tm.color.r, tm.color.g, tm.color.b, tm.color.a = float(r), float(g), float(b), 1.0
                tm.text = text
                tm.lifetime.sec = 1
                return tm
                
            marker_array.markers.append(create_text_marker('class', i, safe_class_name, 1.0, 1.0, 1.0, 0.036))
            marker_array.markers.append(create_text_marker('x', i, f"X:_{x_mm}_mm", 1.0, 0.2, 0.2, 0.024))
            marker_array.markers.append(create_text_marker('y', i, f"Y:_{y_mm}_mm", 0.2, 1.0, 0.2, 0.012))
            marker_array.markers.append(create_text_marker('z', i, f"Z:_{z_mm}_mm", 0.2, 0.5, 1.0, 0.000))
            
        self.pub_markers.publish(marker_array)
        
        cv2.imshow('IP Camera 3D Bounding Boxes (.123)', big_img)
        cv2.waitKey(1)

def main(args=None):
    rclpy.init(args=args)
    node = IPCamYolo3DNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
