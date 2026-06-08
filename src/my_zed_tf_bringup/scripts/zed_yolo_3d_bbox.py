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

        # Run YOLO inference on CPU to save VRAM
        results = self.model.predict(cv_rgb, verbose=False, conf=0.5, device='cpu')
        
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
            valid_depths = depth_roi[(depth_roi > 0.1) & (depth_roi < 10.0) & ~np.isnan(depth_roi) & ~np.isinf(depth_roi)]
            
            if len(valid_depths) == 0:
                continue
                
            # Use median depth to ignore background/foreground outliers
            z_median = np.median(valid_depths)
            
            if np.isnan(z_median) or z_median <= 0:
                continue
                
            # Calculate 2D center
            u_center = (x_min + x_max) / 2.0
            v_center = (y_min + y_max) / 2.0
            
            # Project to 3D Space (Optical Frame: X right, Y down, Z forward)
            x_3d = (u_center - cx) * z_median / fx
            y_3d = (v_center - cy) * z_median / fy
            z_3d = float(z_median)
            
            # Calculate physical dimensions
            width_3d = (x_max - x_min) * z_median / fx
            height_3d = (y_max - y_min) * z_median / fy
            
            # Estimate depth (thickness) of the object, limit to reasonable bounds
            depth_3d = min(width_3d, height_3d) * 0.8
            depth_3d = max(0.05, min(0.3, depth_3d)) # Min 5cm, Max 30cm thickness
            
            color = self.colors[cls_id % 100]
            class_name = names[cls_id]
            
            # --- Marker 1: The Bounding Box Cube ---
            marker = Marker()
            marker.header.stamp = current_time
            marker.ns = 'yolo_bboxes'
            marker.id = i * 2
            marker.type = Marker.CUBE
            marker.action = Marker.ADD
            
            # Transform point to link_base to keep the bounding box upright
            pt_opt = PointStamped()
            pt_opt.header.frame_id = frame_id
            pt_opt.header.stamp = rgb_msg.header.stamp
            pt_opt.point.x = float(x_3d)
            pt_opt.point.y = float(y_3d)
            pt_opt.point.z = float(z_3d)
            
            try:
                pt_base = self.tf_buffer.transform(pt_opt, 'link_base')
                marker.header.frame_id = 'link_base'
                marker.pose.position.x = pt_base.point.x
                marker.pose.position.y = pt_base.point.y
                marker.pose.position.z = pt_base.point.z
                # Scale mapping for link_base (X=depth, Y=width, Z=height)
                marker.scale.x = float(depth_3d)
                marker.scale.y = float(width_3d)
                marker.scale.z = float(height_3d)
            except Exception as e:
                # Fallback to optical frame if TF fails
                marker.header.frame_id = frame_id
                marker.pose.position.x = float(x_3d)
                marker.pose.position.y = float(y_3d)
                marker.pose.position.z = float(z_3d)
                marker.scale.x = float(width_3d)
                marker.scale.y = float(height_3d)
                marker.scale.z = float(depth_3d)
            
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
                text_marker.pose.position.z = marker.pose.position.z + height_3d/2 + 0.05
            else:
                text_marker.pose.position.z = marker.pose.position.z
                text_marker.pose.position.y -= height_3d/2 + 0.05
                
            text_marker.pose.orientation.w = 1.0
            
            text_marker.scale.z = 0.08 # Height of the text
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
