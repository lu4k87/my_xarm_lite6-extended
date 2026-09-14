#!/usr/bin/env python3
import math
import os

import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy
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
        super().__init__('yolo_3d_bbox_for_zed_m')
        
        # Declare parameter for model path — strictly defaults to yolov8l.pt
        self.declare_parameter('model_path', 'yolov8l.pt')
        model_name = self.get_parameter('model_path').value

        # Resolve full path if file exists in workspace or relative
        if not os.path.isabs(model_name):
            ws_root = os.environ.get("ROS2_WS", os.path.expanduser('~/dev_ws'))
            ws_model = os.path.join(ws_root, model_name)
            if not os.path.exists(ws_model):
                ws_model = os.path.expanduser(f'~/dev_ws/{model_name}')
            if os.path.exists(ws_model):
                model_name = ws_model

        # Load YOLO model
        self.get_logger().info(f'Lade YOLO Modell: {model_name}...')
        self.model = YOLO(model_name)
        self.get_logger().info(f'Modell {model_name} erfolgreich geladen.')
        
        self.bridge = CvBridge()
        
        # Default camera intrinsics for ZED Mini HD720 (1280x720) as fallback
        self.camera_info = None
        self.fx = 700.0
        self.fy = 700.0
        self.cx = 640.0
        self.cy = 360.0
        
        # Track published marker IDs to delete removed objects cleanly without DELETEALL
        self.published_marker_ids = set()
        self.consecutive_empty_frames = 0
        
        self.tf_buffer = tf2_ros.Buffer()
        self.tf_listener = tf2_ros.TransformListener(self.tf_buffer, self)
        
        # Subscribers
        cam_info_qos = QoSProfile(
            reliability=ReliabilityPolicy.BEST_EFFORT,
            history=HistoryPolicy.KEEP_LAST,
            depth=10
        )
        self.sub_cam_info = self.create_subscription(
            CameraInfo,
            '/zed/zed_node/rgb/camera_info',
            self.camera_info_callback,
            cam_info_qos
        )
        
        self.sub_rgb = message_filters.Subscriber(self, Image, '/zed/zed_node/rgb/image_rect_color')
        self.sub_depth = message_filters.Subscriber(self, Image, '/zed/zed_node/depth/depth_registered')
        
        # Approximate time synchronizer for RGB and Depth (generous queue and slop for neural depth)
        self.ts = message_filters.ApproximateTimeSynchronizer([self.sub_rgb, self.sub_depth], queue_size=30, slop=0.3)
        self.ts.registerCallback(self.sync_callback)
        
        # Publisher for the 3D Markers
        self.pub_markers = self.create_publisher(MarkerArray, '/zed/bboxes_3d', 10)
        
        # Color mapping for different classes
        self.colors = np.random.uniform(0.3, 1.0, size=(100, 3))
        
        # EMA Filtering state: maps cls_id -> dict of {obj_id: {'state': np.array, 'last_seen': float}}
        self.ema_states = {}
        
        # Declare parameters
        self.declare_parameter('confidence_threshold', 0.35)
        self.declare_parameter('ema_alpha', 0.4)
        # Default empty: all object dimensions are dynamically measured from 3D point cloud
        self.declare_parameter('class_dimension_overrides', [])
        
        # Calibrated ZED Mini fallback matrices (world -> zed_left_camera_optical_frame)
        # Guarantees valid world-frame coordinates even if TF lookup is delayed
        self.last_R = np.array([
            [ 0.10766608,  0.88303187, -0.45679615],
            [ 0.99398310, -0.08630119,  0.06745145],
            [ 0.02013973, -0.46130989, -0.88701047]
        ])
        self.last_T = np.array([[0.45806985], [-0.02867600], [0.51550816]])
        self.last_cam_pos = (0.473, 0.0, 0.510)
        
        # Rate Limiting (~2.5 Hz inference)
        self.last_inference_time = 0.0

        self.get_logger().info('ZED YOLO 3D BBox Node bereit und gestartet.')

    def camera_info_callback(self, msg):
        self.camera_info = msg
        self.fx = float(msg.k[0])
        self.fy = float(msg.k[4])
        self.cx = float(msg.k[2])
        self.cy = float(msg.k[5])
        self.get_logger().info(f'CameraInfo empfangen: fx={self.fx:.1f}, fy={self.fy:.1f}, cx={self.cx:.1f}, cy={self.cy:.1f}')
        self.destroy_subscription(self.sub_cam_info)

    def sync_callback(self, rgb_msg, depth_msg):
        # Limit Inference to ~2.5 Hz (0.4 seconds)
        current_t = self.get_clock().now().nanoseconds / 1e9
        if (current_t - self.last_inference_time) < 0.4:
            return
        self.last_inference_time = current_t
            
        try:
            # Convert ROS messages to OpenCV arrays
            cv_rgb = self.bridge.imgmsg_to_cv2(rgb_msg, desired_encoding='bgr8')
            # Depth map in 32FC1 (meters)
            cv_depth = self.bridge.imgmsg_to_cv2(depth_msg, desired_encoding='32FC1')
        except Exception as e:
            self.get_logger().error(f'Fehler beim Konvertieren der Bilder: {e}')
            return

        # Get parameters
        conf_thresh = self.get_parameter('confidence_threshold').value
        self.alpha = self.get_parameter('ema_alpha').value
        overrides_raw = self.get_parameter('class_dimension_overrides').value
        
        # Parse overrides
        self.dimension_overrides = {}
        for override in overrides_raw:
            if ':' in override:
                cls_name, dims_val = override.split(':', 1)
                try:
                    dims = [float(d.strip()) for d in dims_val.split(',')]
                    if len(dims) == 1:
                        self.dimension_overrides[cls_name.strip()] = (dims[0], dims[0], dims[0])
                    elif len(dims) == 3:
                        self.dimension_overrides[cls_name.strip()] = (dims[0], dims[1], dims[2])
                    else:
                        self.get_logger().warn(f"Ungueltiges Dimension Override Format: {override}")
                except ValueError:
                    self.get_logger().warn(f"Ungueltiges Dimension Override: {override}")

        # Run YOLO inference (GPU beschleunigt)
        results = self.model.predict(cv_rgb, verbose=False, conf=conf_thresh)
        
        # Handle empty detections
        if len(results) == 0 or len(results[0].boxes) == 0:
            self.consecutive_empty_frames += 1
            if self.consecutive_empty_frames >= 3 and len(self.published_marker_ids) > 0:
                # Cleanly delete all previously visible markers
                del_array = MarkerArray()
                for old_id in self.published_marker_ids:
                    for ns in ['yolo_bboxes', 'yolo_object_grasp_center_point',
                               'yolo_labels_class', 'yolo_labels_x', 'yolo_labels_y', 'yolo_labels_z']:
                        dm = Marker()
                        dm.header.frame_id = 'world'
                        dm.header.stamp = self.get_clock().now().to_msg()
                        dm.ns = ns
                        dm.id = old_id
                        dm.action = Marker.DELETE
                        del_array.markers.append(dm)
                self.pub_markers.publish(del_array)
                self.published_marker_ids.clear()
            return
        
        self.consecutive_empty_frames = 0
        boxes = results[0].boxes.xyxy.cpu().numpy()
        classes = results[0].boxes.cls.cpu().numpy().astype(int)
        names = results[0].names
        
        # Camera intrinsics (use live camera_info or fallback)
        if self.camera_info is not None:
            fx = float(self.camera_info.k[0])
            fy = float(self.camera_info.k[4])
            cx = float(self.camera_info.k[2])
            cy = float(self.camera_info.k[5])
        else:
            fx, fy, cx, cy = self.fx, self.fy, self.cx, self.cy
        
        current_time = self.get_clock().now().to_msg()
        frame_id = rgb_msg.header.frame_id

        # Transform matrix (optical frame -> world)
        R = self.last_R
        T = self.last_T
        cam_x, cam_y, cam_z = self.last_cam_pos
        try:
            trans = self.tf_buffer.lookup_transform('world', frame_id, rclpy.time.Time())
            q = trans.transform.rotation
            t = trans.transform.translation
            x_q, y_q, z_q, w_q = q.x, q.y, q.z, q.w
            R = np.array([
                [1 - 2*y_q*y_q - 2*z_q*z_q,     2*x_q*y_q - 2*z_q*w_q,     2*x_q*z_q + 2*y_q*w_q],
                [    2*x_q*y_q + 2*z_q*w_q, 1 - 2*x_q*x_q - 2*z_q*z_q,     2*y_q*z_q - 2*x_q*w_q],
                [    2*x_q*z_q - 2*y_q*w_q,     2*y_q*z_q + 2*x_q*w_q, 1 - 2*x_q*x_q - 2*y_q*y_q]
            ])
            T = np.array([[t.x], [t.y], [t.z]])
            self.last_R = R
            self.last_T = T
            self.last_cam_pos = (float(t.x), float(t.y), float(t.z))
            cam_x, cam_y, cam_z = self.last_cam_pos
        except Exception:
            pass

        marker_array = MarkerArray()
        current_frame_ids = set()

        for i, (box, cls_id) in enumerate(zip(boxes, classes)):
            x_min, y_min, x_max, y_max = map(int, box)
            
            # Ensure within bounds
            h, w = cv_depth.shape
            x_min, x_max = max(0, x_min), min(w-1, x_max)
            y_min, y_max = max(0, y_min), min(h-1, y_max)
            
            if (x_max - x_min) < 5 or (y_max - y_min) < 5:
                continue
                
            # Extract depth ROI
            depth_roi = cv_depth[y_min:y_max, x_min:x_max]
            
            # Filter out NaNs, zeros, infinities, and invalid distances (< 0.15m or > 2.2m)
            valid_depth_mask = (depth_roi > 0.15) & (depth_roi < 2.2) & ~np.isnan(depth_roi) & ~np.isinf(depth_roi)
            
            if np.sum(valid_depth_mask) < 8:
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
            
            # Transform to world frame (link_base)
            pts_base = R @ pts_opt + T
            
            # Robust workspace filter:
            # Table height: Z > -0.04 (allow small calibration tolerance below 0) and Z < 0.60
            # Distance from robot base: radius > 0.08 m
            # Workspace limits: X in [-0.10, 1.20], Y in [-0.80, 0.80]
            dist_from_base = np.sqrt(pts_base[0, :]**2 + pts_base[1, :]**2)
            valid_pts_filter = (
                (pts_base[2, :] > -0.04) &
                (pts_base[2, :] < 0.60) &
                (dist_from_base > 0.08) &
                (pts_base[0, :] > -0.10) & (pts_base[0, :] < 1.20) &
                (pts_base[1, :] > -0.80) & (pts_base[1, :] < 0.80)
            )
            if np.sum(valid_pts_filter) < 8:
                continue
                
            pts_base = pts_base[:, valid_pts_filter]
            pts_opt = pts_opt[:, valid_pts_filter]
            
            # --- Robust Object Height & Point Isolation ---
            # Distance of each point to the camera
            dists_cam = np.linalg.norm(pts_opt, axis=0)
            
            # Separate table surface (Z <= 0.015 m) from object structure (Z > 0.015 m)
            above_table_mask = pts_base[2] > 0.015
            
            bot_z_raw = float(np.percentile(pts_base[2], 2.0))
            if bot_z_raw < 0.04:
                bottom_z = 0.0
            else:
                bottom_z = max(0.0, bot_z_raw)
            
            if np.sum(above_table_mask) >= 8:
                # We have structure rising above the table
                # Filter out background behind the object by clustering depth of points above table
                obj_cam_dists = dists_cam[above_table_mask]
                closest_obj_dist = float(np.percentile(obj_cam_dists, 5.0))
                # Keep foreground points within 25 cm of the closest object point
                fg_mask = above_table_mask & (dists_cam <= closest_obj_dist + 0.25)
                
                if np.sum(fg_mask) >= 6:
                    obj_pts = pts_base[:, fg_mask]
                else:
                    obj_pts = pts_base[:, above_table_mask]
                
                # The top of the object is calculated from the OBJECT'S OWN POINTS (96th percentile)
                # Immune to how many table points are inside the 2D bounding box
                top_z = float(np.percentile(obj_pts[2], 96.0))
                top_z = min(0.60, max(bottom_z + 0.025, top_z))
            else:
                # Very flat object on table (e.g. coaster or small item)
                top_z = max(bottom_z + 0.025, float(np.percentile(pts_base[2], 96.0)))
                obj_pts = pts_base
            
            scale_z = max(0.025, top_z - bottom_z)
            center_z = bottom_z + (scale_z / 2.0)
            display_z = top_z
            
            # --- Object Horizontal Position & Dimensions ---
            obj_pts_x = obj_pts[0]
            obj_pts_y = obj_pts[1]
            
            # Vorderster Oberflächenpunkt bezogen auf die Kameraposition
            dists_2d = np.sqrt((obj_pts_x - cam_x)**2 + (obj_pts_y - cam_y)**2)
            dist_thresh = np.percentile(dists_2d, 10.0)
            closest_mask = dists_2d <= dist_thresh
            
            surf_x = float(np.mean(obj_pts_x[closest_mask]))
            surf_y = float(np.mean(obj_pts_y[closest_mask]))
            
            # Sichtstrahl von Kamera zu Objekt in XY
            dir_x = surf_x - cam_x
            dir_y = surf_y - cam_y
            length = math.sqrt(dir_x**2 + dir_y**2)
            if length > 0:
                ndir_x = dir_x / length
                ndir_y = dir_y / length
            else:
                ndir_x, ndir_y = -1.0, 0.0
                
            # Orthogonaler Vektor quer zur Sichtlinie
            uorth_x = -ndir_y
            uorth_y = ndir_x
            
            # Sichtbare Breite quer zur Sichtlinie
            proj_orth = (obj_pts_x - surf_x) * uorth_x + (obj_pts_y - surf_y) * uorth_y
            orth_min = float(np.percentile(proj_orth, 2.0))
            orth_max = float(np.percentile(proj_orth, 98.0))
            apparent_width = max(0.03, orth_max - orth_min)
            orth_offset = (orth_min + orth_max) / 2.0
            
            # Sichtbare Tiefe entlang des Sichtstrahls
            proj_depth = (obj_pts_x - surf_x) * ndir_x + (obj_pts_y - surf_y) * ndir_y
            depth_seen = max(0.03, float(np.percentile(proj_depth, 98.0)))
            
            cls_name = names[cls_id]
            if cls_name in self.dimension_overrides:
                dx, dy, dz = self.dimension_overrides[cls_name]
                if dz > 0:
                    scale_z = dz
                    center_z = bottom_z + (dz / 2.0)
                    display_z = bottom_z + dz
                scale_x, scale_y = dx, dy
                center_x = surf_x + orth_offset * uorth_x + ndir_x * (dx / 2.0)
                center_y = surf_y + orth_offset * uorth_y + ndir_y * (dy / 2.0)
            else:
                # Dynamische Dimensionen aus Punktwolke
                estimated_depth = max(apparent_width, depth_seen)
                center_x = surf_x + orth_offset * uorth_x + ndir_x * (estimated_depth / 2.0)
                center_y = surf_y + orth_offset * uorth_y + ndir_y * (estimated_depth / 2.0)
                
                margin_xy = 0.01
                span_x = float(np.percentile(obj_pts_x, 98.0) - np.percentile(obj_pts_x, 2.0))
                span_y = float(np.percentile(obj_pts_y, 98.0) - np.percentile(obj_pts_y, 2.0))
                scale_x = max(0.035, max(span_x, estimated_depth) + margin_xy)
                scale_y = max(0.035, max(span_y, apparent_width) + margin_xy)
                
            marker_frame = 'world'
            
            # --- Exponential Moving Average (EMA) Smoothing ---
            current_t = current_time.sec + current_time.nanosec * 1e-9
            state = np.array([center_x, center_y, center_z, scale_x, scale_y, scale_z])
            
            if cls_id not in self.ema_states:
                self.ema_states[cls_id] = {}
                
            # Clean up old states
            expired_ids = [obj_id for obj_id, s in self.ema_states[cls_id].items() if (current_t - s['last_seen']) > 2.0]
            for obj_id in expired_ids:
                del self.ema_states[cls_id][obj_id]
            
            best_match_id = -1
            min_dist = float('inf')
            
            for obj_id, s in self.ema_states[cls_id].items():
                if s['last_seen'] == current_t:
                    continue
                dist = np.linalg.norm(s['state'][:3] - state[:3])
                if dist < min_dist:
                    min_dist = dist
                    best_match_id = obj_id
            
            if best_match_id != -1 and min_dist < 0.3:
                # Adapt quickly if size or height changes noticeably
                dim_diff = np.linalg.norm(self.ema_states[cls_id][best_match_id]['state'][3:] - state[3:])
                effective_alpha = 0.85 if dim_diff > 0.025 else self.alpha
                self.ema_states[cls_id][best_match_id]['state'] = (
                    effective_alpha * state + (1.0 - effective_alpha) * self.ema_states[cls_id][best_match_id]['state']
                )
                self.ema_states[cls_id][best_match_id]['last_seen'] = current_t
                center_x, center_y, center_z, scale_x, scale_y, scale_z = self.ema_states[cls_id][best_match_id]['state']
                assigned_id = best_match_id
            else:
                existing_ids = self.ema_states[cls_id].keys()
                assigned_id = 1
                while assigned_id in existing_ids:
                    assigned_id += 1
                self.ema_states[cls_id][assigned_id] = {'state': state, 'last_seen': current_t}
                
            color = self.colors[cls_id % 100]
            class_name = names[cls_id]
            
            if len(self.ema_states[cls_id]) > 1:
                class_name = f"{class_name}_{assigned_id}"
            
            # --- Marker 1: The Bounding Box Edges (Line List) ---
            marker = Marker()
            marker.header.stamp = current_time
            marker.header.frame_id = marker_frame
            marker.ns = 'yolo_bboxes'
            marker.id = i
            marker.type = Marker.LINE_LIST
            marker.action = Marker.ADD
            marker.pose.orientation.w = 1.0
            
            # Line thickness (3mm) for clearly visible, crisp edges in RViz
            marker.scale.x = 0.003
            
            # 8 corners of the bounding box using smoothed state
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
            
            # 12 edges
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
            marker.color.a = 0.90
            marker.lifetime.sec = 2
            marker.lifetime.nanosec = 0
            
            marker_array.markers.append(marker)
            
            x_mm = int(center_x * 1000)
            y_mm = int(center_y * 1000)
            
            # The UI / Text / Grasp Point sits precisely at the TOP surface center of the object
            display_z = center_z + (scale_z / 2.0)
            z_mm = int(display_z * 1000)
            safe_class_name = class_name.replace(' ', '_')
            
            # --- Marker 2: Grasp Center Point (Red Sphere) at the top of the object ---
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
            
            # Make it clearly visible on top of the object (2.5 cm diameter)
            point_marker.scale.x = 0.025
            point_marker.scale.y = 0.025
            point_marker.scale.z = 0.025
            
            # Bright Red color to stand out in RViz
            point_marker.color.r = 1.0
            point_marker.color.g = 0.0
            point_marker.color.b = 0.0
            point_marker.color.a = 1.0
            point_marker.lifetime.sec = 2
            point_marker.lifetime.nanosec = 0
            
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
                tm.pose.position.z = float(display_z) + 0.015 + z_offset
                tm.pose.orientation.w = 1.0
                
                tm.scale.z = 0.012
                tm.color.r = float(r)
                tm.color.g = float(g)
                tm.color.b = float(b)
                tm.color.a = 1.0
                tm.text = text
                tm.lifetime.sec = 2
                tm.lifetime.nanosec = 0
                return tm
                
            # Stack the text vertically above the top of the object
            marker_array.markers.append(create_text_marker('class', i, safe_class_name, 1.0, 1.0, 1.0, 0.036))
            marker_array.markers.append(create_text_marker('x', i, f"X:_{x_mm}_mm", 1.0, 0.2, 0.2, 0.024))
            marker_array.markers.append(create_text_marker('y', i, f"Y:_{y_mm}_mm", 0.2, 1.0, 0.2, 0.012))
            marker_array.markers.append(create_text_marker('z', i, f"Z:_{z_mm}_mm", 0.2, 0.5, 1.0, 0.000))
            
            current_frame_ids.add(i)
            
            # Log the coordinates to the terminal
            self.get_logger().info(
                f"[{class_name}] X: {x_mm} mm | Y: {y_mm} mm | Z: {z_mm} mm | "
                f"Höhe: {int(scale_z*1000)} mm | Greifpunkt-Z: {display_z*1000:.1f} mm"
            )
            
        # Cleanly delete markers that disappeared from previous frames (WITHOUT DELETEALL)
        removed_ids = self.published_marker_ids - current_frame_ids
        for old_id in removed_ids:
            for ns in ['yolo_bboxes', 'yolo_object_grasp_center_point',
                       'yolo_labels_class', 'yolo_labels_x', 'yolo_labels_y', 'yolo_labels_z']:
                dm = Marker()
                dm.header.frame_id = 'world'
                dm.header.stamp = current_time
                dm.ns = ns
                dm.id = old_id
                dm.action = Marker.DELETE
                marker_array.markers.append(dm)
                
        self.published_marker_ids = current_frame_ids

        if len(marker_array.markers) > 0:
            self.pub_markers.publish(marker_array)

def main(args=None):
    rclpy.init(args=args)
    node = ZedYolo3DNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
