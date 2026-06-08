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
from geometry_msgs.msg import PointStamped

try:
    from ultralytics import YOLO
except ImportError:
    print("Bitte installiere ultralytics: pip3 install ultralytics")
    exit(1)

class ZedYolo3DNode(Node):
    def __init__(self):
        super().__init__('zed_yolo_3d_bbox')
        
        # Load the official YOLOv8s model
        self.get_logger().info('Lade YOLOv8s Modell...')
        self.model = YOLO('yolov8s.pt')
        self.model.to('cpu')  # Force CPU to avoid CUDA OOM with ZED SDK
        self.get_logger().info('Modell erfolgreich geladen (auf CPU).')
        
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

        # Crop the top 50% of the image to ignore background and speed up inference
        img_h, img_w = cv_rgb.shape[:2]
        crop_y = int(img_h * 0.5)
        cv_rgb_cropped = cv_rgb[crop_y:, :]

        # Run YOLO inference on CPU to save VRAM
        results = self.model.predict(cv_rgb_cropped, verbose=False, conf=0.5, device='cpu')
        
        marker_array = MarkerArray()
        
        if len(results) == 0 or len(results[0].boxes) == 0:
            # Publish empty array to clear old markers
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
            x_min, y_min_crop, x_max, y_max_crop = map(int, box)
            
            # Restore original image coordinates
            y_min = y_min_crop + crop_y
            y_max = y_max_crop + crop_y
            
            # Ensure within bounds
            h, w = cv_depth.shape
            x_min, x_max = max(0, x_min), min(w-1, x_max)
            y_min, y_max = max(0, y_min), min(h-1, y_max)
            
            if x_max <= x_min or y_max <= y_min:
                continue
                
            # Extract depth ROI
            depth_roi = cv_depth[y_min:y_max, x_min:x_max]
            
            # Filter out NaNs, zeros, and infinities
            valid_depths = depth_roi[(depth_roi > 0.1) & (depth_roi < 10.0) & ~np.isnan(depth_roi) & ~np.isinf(depth_roi)]
            
            if len(valid_depths) == 0:
                continue
                
            z_median = np.median(valid_depths)
            if np.isnan(z_median) or z_median <= 0:
                continue
                
            # Isolate object from background/table (within 10cm of median depth)
            obj_mask = (depth_roi > 0.1) & (depth_roi < 10.0) & ~np.isnan(depth_roi) & ~np.isinf(depth_roi) & (np.abs(depth_roi - z_median) < 0.1)
            
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
                if np.sum(table_filter) > 10:
                    pts_base = pts_base[:, table_filter]
                
                # Compute 3D Bounding Box in link_base
                min_x, max_x = np.min(pts_base[0]), np.max(pts_base[0])
                min_y, max_y = np.min(pts_base[1]), np.max(pts_base[1])
                min_z, max_z = np.min(pts_base[2]), np.max(pts_base[2])
                
                center_x = (min_x + max_x) / 2.0
                center_y = (min_y + max_y) / 2.0
                center_z = (min_z + max_z) / 2.0
                
                scale_x = max(0.02, max_x - min_x)
                scale_y = max(0.02, max_y - min_y)
                scale_z = max(0.02, max_z - min_z)
                
                marker_frame = 'link_base'
            else:
                # Fallback to optical frame bounding box
                min_x, max_x = np.min(pts_opt[0]), np.max(pts_opt[0])
                min_y, max_y = np.min(pts_opt[1]), np.max(pts_opt[1])
                min_z, max_z = np.min(pts_opt[2]), np.max(pts_opt[2])
                
                center_x = (min_x + max_x) / 2.0
                center_y = (min_y + max_y) / 2.0
                center_z = (min_z + max_z) / 2.0
                
                scale_x = max(0.02, max_x - min_x)
                scale_y = max(0.02, max_y - min_y)
                scale_z = max(0.02, max_z - min_z)
                
                marker_frame = frame_id
                
            color = self.colors[cls_id % 100]
            class_name = names[cls_id]
            
            # --- Marker 1: The Bounding Box Cube ---
            marker = Marker()
            marker.header.stamp = current_time
            marker.header.frame_id = marker_frame
            marker.ns = 'yolo_bboxes'
            marker.id = i * 2
            marker.type = Marker.CUBE
            marker.action = Marker.ADD
            
            marker.pose.position.x = float(center_x)
            marker.pose.position.y = float(center_y)
            marker.pose.position.z = float(center_z)
            marker.pose.orientation.w = 1.0
            
            marker.scale.x = float(scale_x)
            marker.scale.y = float(scale_y)
            marker.scale.z = float(scale_z)
            
            marker.pose.orientation.w = 1.0
            
            marker.color.r = float(color[0])
            marker.color.g = float(color[1])
            marker.color.b = float(color[2])
            marker.color.a = 0.4 # Semi-transparent
            
            marker.lifetime.sec = 0
            marker.lifetime.nanosec = int(500 * 1e6) # 0.5s lifetime
            
            marker_array.markers.append(marker)
            
            # --- Marker 2: The Text Label ---
            text_marker = Marker()
            text_marker.header.frame_id = marker.header.frame_id
            text_marker.header.stamp = current_time
            text_marker.ns = 'yolo_bboxes_text'
            text_marker.id = i * 2 + 1
            text_marker.type = Marker.TEXT_VIEW_FACING
            text_marker.action = Marker.ADD
            
            # Place text slightly above the box
            text_marker.pose.position.x = marker.pose.position.x
            text_marker.pose.position.y = marker.pose.position.y
            if marker.header.frame_id == 'link_base':
                text_marker.pose.position.z = marker.pose.position.z + (scale_z / 2.0) + 0.02
            else:
                text_marker.pose.position.z = marker.pose.position.z
                text_marker.pose.position.y -= (scale_y / 2.0) + 0.02
                
            text_marker.pose.orientation.w = 1.0
            
            text_marker.scale.z = 0.03 # Height of the text (3 cm)
            text_marker.color.r = 1.0
            text_marker.color.g = 1.0
            text_marker.color.b = 1.0
            text_marker.color.a = 1.0
            text_marker.text = class_name
            
            text_marker.lifetime.sec = 0
            text_marker.lifetime.nanosec = int(500 * 1e6)
            
            marker_array.markers.append(text_marker)
            
        self.pub_markers.publish(marker_array)

def main(args=None):
    rclpy.init(args=args)
    node = ZedYolo3DNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
