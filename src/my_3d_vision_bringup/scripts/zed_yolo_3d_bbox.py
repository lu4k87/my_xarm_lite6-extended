#!/usr/bin/env python3

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image, CameraInfo
from visualization_msgs.msg import Marker, MarkerArray
from cv_bridge import CvBridge
import message_filters
import numpy as np
import cv2
import tf2_ros
import tf2_geometry_msgs
from geometry_msgs.msg import PointStamped, Point

try:
    from ultralytics import YOLO
except ImportError:
    print("Bitte installiere ultralytics: pip3 install ultralytics")
    exit(1)

class ZedYolo3DNode(Node):
    def __init__(self):
        super().__init__('zed_yolo_3d_bbox')
        
        # Load the locally available YOLOv8l (Large) model
        self.get_logger().info('Lade YOLOv8l (Large) Modell...')
        self.model = YOLO('yolov8l.pt')
        self.get_logger().info('Modell erfolgreich geladen (nutzt GPU falls verfügbar).')
        
        self.bridge = CvBridge()
        self.camera_info = None
        
        self.tf_buffer = tf2_ros.Buffer()
        self.tf_listener = tf2_ros.TransformListener(self.tf_buffer, self)
        
        # Subscribers
        self.sub_cam_info = self.create_subscription(
            CameraInfo,
            '/zed/zed_node/rgb/camera_info',
            self.camera_info_callback,
            10
        )
        
        self.sub_rgb = message_filters.Subscriber(self, Image, '/zed/zed_node/rgb/image_rect_color')
        self.sub_depth = message_filters.Subscriber(self, Image, '/zed/zed_node/depth/depth_registered')
        
        # Approximate time synchronizer for RGB and Depth
        self.ts = message_filters.ApproximateTimeSynchronizer([self.sub_rgb, self.sub_depth], queue_size=10, slop=0.1)
        self.ts.registerCallback(self.sync_callback)
        
        # Publisher for the 3D Markers
        self.pub_markers = self.create_publisher(MarkerArray, '/zed/bboxes_3d', 10)
        
        # Color mapping for different classes
        self.colors = np.random.uniform(0.3, 1.0, size=(100, 3))
        
        # EMA Filtering state
        self.ema_states = {} # maps cls_id -> {'state': np.array, 'last_seen': float}
        # Declare parameters
        self.declare_parameter('confidence_threshold', 0.5)
        self.declare_parameter('ema_alpha', 0.2)
        self.declare_parameter('class_height_overrides', ['sports ball:0.064'])
        
        # Rate Limiting
        self.last_inference_time = 0.0

        self.get_logger().info('ZED YOLO 3D BBox Node gestartet.')

    def camera_info_callback(self, msg):
        self.camera_info = msg
        # We only need it once
        self.destroy_subscription(self.sub_cam_info)
        self.get_logger().info('CameraInfo empfangen.')

    def sync_callback(self, rgb_msg, depth_msg):
        if self.camera_info is None:
            return
            
        # Limit Inference to 2 Hz (0.5 seconds)
        current_t = self.get_clock().now().nanoseconds / 1e9
        if (current_t - self.last_inference_time) < 0.5:
            return
        self.last_inference_time = current_t
            
        try:
            # Convert ROS messages to OpenCV arrays
            cv_rgb = self.bridge.imgmsg_to_cv2(rgb_msg, desired_encoding='bgr8')
            # Depth map in 32FC1 (meters)
            cv_depth = self.bridge.imgmsg_to_cv2(depth_msg, desired_encoding='32FC1')
        except Exception as e:
            self.get_logger().error(f'Error converting images: {e}')
            return

        # Get parameters
        conf_thresh = self.get_parameter('confidence_threshold').value
        self.alpha = self.get_parameter('ema_alpha').value
        overrides_raw = self.get_parameter('class_height_overrides').value
        
        # Parse overrides
        self.height_overrides = {}
        for override in overrides_raw:
            if ':' in override:
                cls_name, z_val = override.split(':', 1)
                try:
                    self.height_overrides[cls_name.strip()] = float(z_val.strip())
                except ValueError:
                    self.get_logger().warn(f"Invalid height override: {override}")

        # We do not crop the image so YOLO can detect the full objects
        # Run YOLO inference (GPU beschleunigt)
        results = self.model.predict(cv_rgb, verbose=False, conf=conf_thresh)
        
        marker_array = MarkerArray()
        
        # Always send a DELETEALL first to clear ghost markers from previous frames
        clear_marker = Marker()
        clear_marker.action = Marker.DELETEALL
        marker_array.markers.append(clear_marker)
        
        if len(results) == 0 or len(results[0].boxes) == 0:
            self.pub_markers.publish(marker_array)
            return

        boxes = results[0].boxes.xyxy.cpu().numpy()
        classes = results[0].boxes.cls.cpu().numpy().astype(int)
        names = results[0].names
        
        fx = self.camera_info.k[0]
        fy = self.camera_info.k[4]
        cx = self.camera_info.k[2]
        cy = self.camera_info.k[5]
        
        current_time = self.get_clock().now().to_msg()
        frame_id = rgb_msg.header.frame_id

        # Lookup TF to map 3D points exactly into link_base
        try:
            trans = self.tf_buffer.lookup_transform('link_base', frame_id, rclpy.time.Time())
            q = trans.transform.rotation
            t = trans.transform.translation
            x_q, y_q, z_q, w_q = q.x, q.y, q.z, q.w
            # Quaternion to 3x3 Rotation Matrix
            R = np.array([
                [1 - 2*y_q*y_q - 2*z_q*z_q,     2*x_q*y_q - 2*z_q*w_q,     2*x_q*z_q + 2*y_q*w_q],
                [    2*x_q*y_q + 2*z_q*w_q, 1 - 2*x_q*x_q - 2*z_q*z_q,     2*y_q*z_q - 2*x_q*w_q],
                [    2*x_q*z_q - 2*y_q*w_q,     2*y_q*z_q + 2*x_q*w_q, 1 - 2*x_q*x_q - 2*y_q*y_q]
            ])
            T = np.array([[t.x], [t.y], [t.z]])
            tf_available = True
        except Exception as e:
            self.get_logger().warn(f'TF lookup failed: {e}')
            tf_available = False

        for i, (box, cls_id) in enumerate(zip(boxes, classes)):
            x_min, y_min, x_max, y_max = map(int, box)
            
            # Ensure within bounds
            h, w = cv_depth.shape
            x_min, x_max = max(0, x_min), min(w-1, x_max)
            y_min, y_max = max(0, y_min), min(h-1, y_max)
            
            if x_max <= x_min or y_max <= y_min:
                continue
                
            # Extract depth ROI
            depth_roi = cv_depth[y_min:y_max, x_min:x_max]
            
            # Filter out NaNs, zeros, and infinities (all valid points in the bbox)
            valid_depth_mask = (depth_roi > 0.1) & (depth_roi < 10.0) & ~np.isnan(depth_roi) & ~np.isinf(depth_roi)
            
            if not np.any(valid_depth_mask):
                continue
                
            # Extract 2D pixel coordinates for the object
            v_roi, u_roi = np.where(valid_depth_mask)
            u_img = u_roi + x_min
            v_img = v_roi + y_min
            z_vals = depth_roi[valid_depth_mask]
            
            # Convert to 3D Optical Frame
            x_opt = (u_img - cx) * z_vals / fx
            y_opt = (v_img - cy) * z_vals / fy
            z_opt = z_vals
            
            pts_opt = np.vstack((x_opt, y_opt, z_opt)) # shape (3, N)
            
            if tf_available:
                # Transform to link_base
                pts_base = R @ pts_opt + T
                
                # Robustly filter out table points (Z < 0.015) and robot base (cylinder with radius 12cm)
                # also filter out points that are too high (Z > 0.4) to avoid grasping the camera stand or robot arm
                dist_from_base = np.sqrt(pts_base[0, :]**2 + pts_base[1, :]**2)
                valid_pts_filter = (pts_base[2, :] > 0.015) & (dist_from_base > 0.12) & (pts_base[2, :] < 0.4)
                if np.sum(valid_pts_filter) < 10:
                    continue # Not enough points belonging to the object
                pts_base = pts_base[:, valid_pts_filter]
                
                # Compute 3D Bounding Box in link_base (use 2nd/98th percentiles to heavily filter out flying pixels from specular objects like balls)
                min_x, max_x = np.percentile(pts_base[0], 2), np.percentile(pts_base[0], 98)
                min_y, max_y = np.percentile(pts_base[1], 2), np.percentile(pts_base[1], 98)
                _, max_z = np.percentile(pts_base[2], 2), np.percentile(pts_base[2], 98)
                
                # Apply physical height override if configured
                cls_name = names[cls_id]
                if cls_name in self.height_overrides:
                    max_z = self.height_overrides[cls_name]
                
                # Objects always rest on the table, so force min_z to 0.0
                min_z = 0.0
                
                center_x = (min_x + max_x) / 2.0
                center_y = (min_y + max_y) / 2.0
                center_z = (min_z + max_z) / 2.0
                
                scale_x = max(0.02, max_x - min_x)
                scale_y = max(0.02, max_y - min_y)
                scale_z = max(0.02, max_z - min_z)
                
                marker_frame = 'link_base'
            else:
                if pts_opt.shape[1] < 10:
                    continue
                # Fallback to optical frame bounding box
                min_x, max_x = np.percentile(pts_opt[0], 2), np.percentile(pts_opt[0], 98)
                min_y, max_y = np.percentile(pts_opt[1], 2), np.percentile(pts_opt[1], 98)
                min_z, max_z = np.percentile(pts_opt[2], 2), np.percentile(pts_opt[2], 98)
                
                cls_name = names[cls_id]
                if cls_name in self.height_overrides:
                    max_z = self.height_overrides[cls_name]
                
                center_x = (min_x + max_x) / 2.0
                center_y = (min_y + max_y) / 2.0
                center_z = (min_z + max_z) / 2.0
                
                scale_x = max(0.02, max_x - min_x)
                scale_y = max(0.02, max_y - min_y)
                scale_z = max(0.02, max_z - min_z)
                
                marker_frame = frame_id
            
            # --- Exponential Moving Average (EMA) Smoothing ---
            # Glättet das Flackern der Bounding Box (unterstützt nun mehrere Objekte pro Klasse)
            current_t = current_time.sec + current_time.nanosec * 1e-9
            state = np.array([center_x, center_y, center_z, scale_x, scale_y, scale_z])
            
            if cls_id not in self.ema_states:
                self.ema_states[cls_id] = []
                
            # Bereinige alte states
            self.ema_states[cls_id] = [s for s in self.ema_states[cls_id] if (current_t - s['last_seen']) <= 1.0]
            
            best_match_idx = -1
            min_dist = float('inf')
            
            for idx, s in enumerate(self.ema_states[cls_id]):
                if s['last_seen'] == current_t:
                    continue # Wurde in diesem Frame bereits aktualisiert
                dist = np.linalg.norm(s['state'][:3] - state[:3])
                if dist < min_dist:
                    min_dist = dist
                    best_match_idx = idx
            
            if best_match_idx != -1 and min_dist < 0.3: # Max 30cm Abstand für dasselbe Objekt
                self.ema_states[cls_id][best_match_idx]['state'] = self.alpha * state + (1.0 - self.alpha) * self.ema_states[cls_id][best_match_idx]['state']
                self.ema_states[cls_id][best_match_idx]['last_seen'] = current_t
                center_x, center_y, center_z, scale_x, scale_y, scale_z = self.ema_states[cls_id][best_match_idx]['state']
            else:
                self.ema_states[cls_id].append({'state': state, 'last_seen': current_t})
                
            color = self.colors[cls_id % 100]
            class_name = names[cls_id]
            
            # Append numbering if there are multiple objects of the same class
            if len(self.ema_states[cls_id]) > 1:
                # obj_idx is best_match_idx if found, else the last appended index
                obj_idx = best_match_idx if best_match_idx != -1 else len(self.ema_states[cls_id]) - 1
                class_name = f"{class_name}_{obj_idx + 1}"
            
            # --- Marker 1: The Bounding Box Edges (Line List) ---
            marker = Marker()
            marker.header.stamp = current_time
            marker.header.frame_id = marker_frame
            marker.ns = 'yolo_bboxes'
            marker.id = i
            marker.type = Marker.LINE_LIST
            marker.action = Marker.ADD
            
            marker.pose.orientation.w = 1.0
            
            # Line thickness (1mm) to match the thin text
            marker.scale.x = 0.001 
            
            # 8 corners of the bounding box
            p1 = Point(x=float(min_x), y=float(min_y), z=float(min_z))
            p2 = Point(x=float(max_x), y=float(min_y), z=float(min_z))
            p3 = Point(x=float(max_x), y=float(max_y), z=float(min_z))
            p4 = Point(x=float(min_x), y=float(max_y), z=float(min_z))
            p5 = Point(x=float(min_x), y=float(min_y), z=float(max_z))
            p6 = Point(x=float(max_x), y=float(min_y), z=float(max_z))
            p7 = Point(x=float(max_x), y=float(max_y), z=float(max_z))
            p8 = Point(x=float(min_x), y=float(max_y), z=float(max_z))
            
            # 12 edges (2 points per edge for LINE_LIST)
            marker.points = [
                # Bottom face
                p1, p2, p2, p3, p3, p4, p4, p1,
                # Top face
                p5, p6, p6, p7, p7, p8, p8, p5,
                # Vertical edges
                p1, p5, p2, p6, p3, p7, p4, p8
            ]
            
            marker.color.r = float(color[0])
            marker.color.g = float(color[1])
            marker.color.b = float(color[2])
            marker.color.a = 0.8 # More opaque for thin lines
            
            marker.lifetime.sec = 1
            marker.lifetime.nanosec = int(500 * 1e6) # 1.5s lifetime
            
            marker_array.markers.append(marker)
            
            x_mm = int(center_x * 1000)
            y_mm = int(center_y * 1000)
            
            # The UI / Text should report the TOP surface of the object
            display_z = center_z + (scale_z / 2.0)
            z_mm = int(display_z * 1000)
            safe_class_name = class_name.replace(' ', '_')
            
            # --- Marker 2: Point (Sphere) at the reported coordinate ---
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
            
            # Make it a small visible dot (1cm diameter)
            point_marker.scale.x = 0.01
            point_marker.scale.y = 0.01
            point_marker.scale.z = 0.01
            
            # Bright color (Red) to stand out
            point_marker.color.r = 1.0
            point_marker.color.g = 0.0
            point_marker.color.b = 0.0
            point_marker.color.a = 1.0
            
            point_marker.lifetime.sec = 1
            point_marker.lifetime.nanosec = int(500 * 1e6)
            
            marker_array.markers.append(point_marker)
            
            # Helper to create a text marker
            def create_text_marker(ns_suffix, m_id, text, r, g, b, z_offset):
                tm = Marker()
                tm.header.frame_id = marker.header.frame_id
                tm.header.stamp = current_time
                tm.ns = f'yolo_labels_{ns_suffix}'
                tm.id = m_id
                tm.type = Marker.TEXT_VIEW_FACING
                tm.action = Marker.ADD
                
                tm.pose.position.x = float(center_x)
                tm.pose.position.y = float(center_y)
                
                if marker.header.frame_id == 'link_base':
                    base_z = float(center_z) + (scale_z / 2.0) + 0.02
                    tm.pose.position.z = base_z + z_offset
                else:
                    tm.pose.position.z = float(center_z)
                    tm.pose.position.y -= (scale_y / 2.0) + 0.02 + z_offset
                    
                tm.pose.orientation.w = 1.0
                tm.scale.z = 0.010 # Thinner and smaller font
                tm.color.r = float(r)
                tm.color.g = float(g)
                tm.color.b = float(b)
                tm.color.a = 1.0
                tm.text = text
                tm.lifetime.sec = 1
                tm.lifetime.nanosec = int(500 * 1e6) # 1.5s
                return tm
                
            # Stack the text vertically (No spaces between values to prevent RViz justification bug, use underscores instead)
            # Class name in white (Top)
            marker_array.markers.append(create_text_marker('class', i, safe_class_name, 1.0, 1.0, 1.0, 0.036))
            # X coordinate in red (Axis X)
            marker_array.markers.append(create_text_marker('x', i, f"X:_{x_mm}_mm", 1.0, 0.2, 0.2, 0.024))
            # Y coordinate in green (Axis Y)
            marker_array.markers.append(create_text_marker('y', i, f"Y:_{y_mm}_mm", 0.2, 1.0, 0.2, 0.012))
            # Z coordinate in blue (Axis Z)
            marker_array.markers.append(create_text_marker('z', i, f"Z:_{z_mm}_mm", 0.2, 0.5, 1.0, 0.000))
            
            # Log the coordinates to the terminal so they are neatly listed
            self.get_logger().info(f"[{class_name}] X: {x_mm} mm | Y: {y_mm} mm | Z: {z_mm} mm")
            
            
        self.pub_markers.publish(marker_array)

def main(args=None):
    rclpy.init(args=args)
    node = ZedYolo3DNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
