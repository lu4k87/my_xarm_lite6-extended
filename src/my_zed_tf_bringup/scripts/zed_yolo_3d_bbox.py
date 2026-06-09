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
        
        # Load the locally available YOLOv8s model
        self.get_logger().info('Lade YOLOv8s Modell...')
        self.model = YOLO('yolov8s.pt')
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
        
        self.get_logger().info('ZED YOLO 3D BBox Node gestartet.')

    def camera_info_callback(self, msg):
        self.camera_info = msg
        # We only need it once
        self.destroy_subscription(self.sub_cam_info)
        self.get_logger().info('CameraInfo empfangen.')

    def sync_callback(self, rgb_msg, depth_msg):
        if self.camera_info is None:
            return
            
        try:
            # Convert ROS messages to OpenCV arrays
            cv_rgb = self.bridge.imgmsg_to_cv2(rgb_msg, desired_encoding='bgr8')
            # Depth map in 32FC1 (meters)
            cv_depth = self.bridge.imgmsg_to_cv2(depth_msg, desired_encoding='32FC1')
        except Exception as e:
            self.get_logger().error(f'Error converting images: {e}')
            return

        # We do not crop the image anymore so YOLO can detect the full objects
        # Run YOLO inference (GPU beschleunigt)
        results = self.model.predict(cv_rgb, verbose=False, conf=0.5)
        
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
            trans = self.tf_buffer.lookup_transform('link_base', frame_id, rgb_msg.header.stamp)
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
            
            # Filter out NaNs, zeros, and infinities
            # Use inner 50% of the bounding box to determine the object's median depth robustly
            roi_h, roi_w = depth_roi.shape
            inner_x_min = int(roi_w * 0.25)
            inner_x_max = int(roi_w * 0.75)
            inner_y_min = int(roi_h * 0.25)
            inner_y_max = int(roi_h * 0.75)
            
            inner_depth_roi = depth_roi[inner_y_min:inner_y_max, inner_x_min:inner_x_max]
            valid_inner_depths = inner_depth_roi[(inner_depth_roi > 0.1) & (inner_depth_roi < 10.0) & ~np.isnan(inner_depth_roi) & ~np.isinf(inner_depth_roi)]
            
            # Fallback to entire ROI if inner ROI is empty or invalid
            if len(valid_inner_depths) > 10:
                z_median = np.median(valid_inner_depths)
            else:
                valid_depths = depth_roi[(depth_roi > 0.1) & (depth_roi < 10.0) & ~np.isnan(depth_roi) & ~np.isinf(depth_roi)]
                if len(valid_depths) == 0:
                    continue
                z_median = np.median(valid_depths)
                
            if np.isnan(z_median) or z_median <= 0:
                continue
                
            # Isolate object from background/table (within 10cm of median depth to encompass the object cleanly but avoid background)
            obj_mask = (depth_roi > 0.1) & (depth_roi < 10.0) & ~np.isnan(depth_roi) & ~np.isinf(depth_roi) & (np.abs(depth_roi - z_median) < 0.10)
            
            if not np.any(obj_mask):
                continue
                
            # Extract 2D pixel coordinates for the object
            v_roi, u_roi = np.where(obj_mask)
            u_img = u_roi + x_min
            v_img = v_roi + y_min
            z_vals = depth_roi[obj_mask]
            
            # Convert to 3D Optical Frame
            x_opt = (u_img - cx) * z_vals / fx
            y_opt = (v_img - cy) * z_vals / fy
            z_opt = z_vals
            
            pts_opt = np.vstack((x_opt, y_opt, z_opt)) # shape (3, N)
            
            if tf_available:
                # Transform to link_base
                pts_base = R @ pts_opt + T
                
                # Filter out table points (Z < 0.02)
                table_filter = pts_base[2, :] > 0.02
                if np.sum(table_filter) < 10:
                    continue # Not enough points belonging to the object
                pts_base = pts_base[:, table_filter]
                
                # Compute 3D Bounding Box in link_base (use 2nd/98th percentiles to heavily filter out flying pixels from specular objects like balls)
                min_x, max_x = np.percentile(pts_base[0], 2), np.percentile(pts_base[0], 98)
                min_y, max_y = np.percentile(pts_base[1], 2), np.percentile(pts_base[1], 98)
                min_z, max_z = np.percentile(pts_base[2], 2), np.percentile(pts_base[2], 98)
                
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
                
                center_x = (min_x + max_x) / 2.0
                center_y = (min_y + max_y) / 2.0
                center_z = (min_z + max_z) / 2.0
                
                scale_x = max(0.02, max_x - min_x)
                scale_y = max(0.02, max_y - min_y)
                scale_z = max(0.02, max_z - min_z)
                
                marker_frame = frame_id
                
            color = self.colors[cls_id % 100]
            class_name = names[cls_id]
            
            # --- Marker 1: The Bounding Box Edges (Line List) ---
            marker = Marker()
            marker.header.stamp = current_time
            marker.header.frame_id = marker_frame
            marker.ns = 'yolo_bboxes'
            marker.id = i
            marker.type = Marker.LINE_LIST
            marker.action = Marker.ADD
            
            marker.pose.orientation.w = 1.0
            
            # Line thickness (3mm)
            marker.scale.x = 0.003 
            
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
            
            marker.lifetime.sec = 0
            marker.lifetime.nanosec = int(500 * 1e6) # 0.5s lifetime
            
            marker_array.markers.append(marker)
            
            # --- Marker 2: The Text Label (Name + Coords combined) ---
            text_marker = Marker()
            text_marker.header.frame_id = marker.header.frame_id
            text_marker.header.stamp = current_time
            text_marker.ns = 'yolo_labels'
            text_marker.id = i
            text_marker.type = Marker.TEXT_VIEW_FACING
            text_marker.action = Marker.ADD
            
            # Place text cleanly above the box
            text_marker.pose.position.x = marker.pose.position.x
            text_marker.pose.position.y = marker.pose.position.y
            if marker.header.frame_id == 'link_base':
                text_marker.pose.position.z = marker.pose.position.z + (scale_z / 2.0) + 0.04
            else:
                text_marker.pose.position.z = marker.pose.position.z
                text_marker.pose.position.y -= (scale_y / 2.0) + 0.04
                
            text_marker.pose.orientation.w = 1.0
            
            text_marker.scale.z = 0.025 # Text height
            text_marker.color.r = 1.0
            text_marker.color.g = 1.0
            text_marker.color.b = 0.0 # Yellow text for better visibility
            text_marker.color.a = 1.0
            
            x_mm = int(center_x * 1000)
            y_mm = int(center_y * 1000)
            z_mm = int(center_z * 1000)
            
            # Remove spaces to prevent RViz Ogre3D from massively justifying the text horizontally
            safe_class_name = class_name.replace(' ', '_')
            text_marker.text = f"{safe_class_name}\nX:{x_mm}mm\nY:{y_mm}mm\nZ:{z_mm}mm"
            
            text_marker.lifetime.sec = 0
            text_marker.lifetime.nanosec = int(500 * 1e6)
            
            marker_array.markers.append(text_marker)
            
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
