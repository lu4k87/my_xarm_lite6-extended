#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
import cv2
import cv2.aruco as aruco
import numpy as np

class WebcamArucoPoseNode(Node):
    def __init__(self):
        super().__init__('webcam_aruco_6_pose_node')
        self.get_logger().info('Initializing Webcam ArUco 6D Pose Node...')
        
        # Initialize video capture (try /dev/video0 or /dev/video2)
        # Often webcams might be video0 or video2. We will start with 0.
        self.cap = cv2.VideoCapture(0)
        if not self.cap.isOpened():
            self.cap = cv2.VideoCapture(2)
        
        if not self.cap.isOpened():
            self.get_logger().error('Could not open webcam!')
            return
            
        # Optimize capture to reduce latency
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        self.cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'MJPG'))
        
        # Set a decent resolution
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        
        # Aruco setup (OpenCV 4.7+)
        self.aruco_dict = aruco.getPredefinedDictionary(aruco.DICT_4X4_50)
        self.aruco_params = aruco.DetectorParameters()
        self.detector = aruco.ArucoDetector(self.aruco_dict, self.aruco_params)
        
        # Marker size in meters (user specified 3 cm)
        self.marker_size = 0.03
        
        # Timer for capture loop (30 FPS)
        self.timer = self.create_timer(1.0 / 30.0, self.timer_callback)
        self.get_logger().info('Webcam ArUco Node started. Press "q" in the window to close.')

    def timer_callback(self):
        ret, frame = self.cap.read()
        if not ret:
            self.get_logger().warning('Failed to grab frame')
            return

        # Da die Kamera von gegenüber filmt, drehen wir das Bild um 180 Grad
        # (Spiegelung horizontal und vertikal = -1)
        frame = cv2.flip(frame, -1)

        # Leichtes Weichzeichnen (Gaussian Blur) um Bildrauschen zu reduzieren
        frame = cv2.GaussianBlur(frame, (5, 5), 0)

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Detect markers
        corners, ids, rejected = self.detector.detectMarkers(gray)
        
        if ids is not None:
            # Draw detected markers
            aruco.drawDetectedMarkers(frame, corners, ids)
            
            # Since we don't have camera intrinsics, we approximate them
            h, w = frame.shape[:2]
            focal_length = w
            center = (w / 2, h / 2)
            camera_matrix = np.array([
                [focal_length, 0, center[0]],
                [0, focal_length, center[1]],
                [0, 0, 1]
            ], dtype=np.float64)
            dist_coeffs = np.zeros((4, 1))

            # Define the 3D points of the marker corners
            half_size = self.marker_size / 2.0
            obj_points = np.array([
                [-half_size,  half_size, 0],
                [ half_size,  half_size, 0],
                [ half_size, -half_size, 0],
                [-half_size, -half_size, 0]
            ], dtype=np.float32)

            # Estimate pose for each marker
            poses = {}
            for i in range(len(ids)):
                # Get the 2D points of the marker corners
                img_points = corners[i][0]
                
                # Solve PnP
                success, rvec, tvec = cv2.solvePnP(obj_points, img_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_IPPE_SQUARE)
                
                if success:
                    # Draw axis (OpenCV 4.x)
                    cv2.drawFrameAxes(frame, camera_matrix, dist_coeffs, rvec, tvec, self.marker_size)
                    
                    marker_id = ids[i][0]
                    poses[marker_id] = (rvec, tvec)
                    
            # Calculate and display relative positions if ID 0 is detected
            if 0 in poses:
                rvec_0, tvec_0 = poses[0]
                R_0, _ = cv2.Rodrigues(rvec_0)
                R_0_inv = R_0.T
                
                for marker_id, (rvec_i, tvec_i) in poses.items():
                    if marker_id == 0:
                        rel_tvec = np.zeros((3, 1))
                    else:
                        rel_tvec = np.dot(R_0_inv, tvec_i - tvec_0)
                        
                    # Display the relative position
                    x, y, z = rel_tvec.flatten()
                    
                    # Convert to cm
                    x_cm, y_cm, z_cm = x * 100.0, y * 100.0, z * 100.0
                    
                    # Log to terminal (don't log 0 since it's always 0,0,0 relative to itself)
                    if marker_id != 0:
                        self.get_logger().info(f"Marker {marker_id} relative to Marker 0 -> x: {x_cm:.1f}cm | y: {y_cm:.1f}cm | z: {z_cm:.1f}cm")
                    
                    # Text parts
                    part_id = f"ID {marker_id}: "
                    part_x = f"x={x_cm:.1f}cm "
                    part_y = f"y={y_cm:.1f}cm "
                    part_z = f"z={z_cm:.1f}cm"
                    
                    # Colors (BGR)
                    color_id = (255, 255, 255) # White
                    color_x = (0, 0, 255)      # Red
                    color_y = (0, 255, 0)      # Green
                    color_z = (255, 0, 0)      # Blue
                    
                    # Calculate total width to draw background
                    font = cv2.FONT_HERSHEY_SIMPLEX
                    scale = 0.6
                    thick = 1
                    (tw_id, th), _ = cv2.getTextSize(part_id, font, scale, thick)
                    (tw_x, _), _ = cv2.getTextSize(part_x, font, scale, thick)
                    (tw_y, _), _ = cv2.getTextSize(part_y, font, scale, thick)
                    (tw_z, _), _ = cv2.getTextSize(part_z, font, scale, thick)
                    
                    total_tw = tw_id + tw_x + tw_y + tw_z
                    
                    # Find coordinates to draw text (exactly centered on the marker)
                    idx = np.where(ids == marker_id)[0][0]
                    center = np.mean(corners[idx][0], axis=0)
                    
                    # Draw a small dot precisely at the center
                    cv2.circle(frame, (int(center[0]), int(center[1])), 4, (0, 255, 255), -1)
                    
                    # Center text box around the marker
                    org_x = int(center[0] - total_tw / 2)
                    # Shift text slightly below the center dot so they don't overlap entirely
                    org_y = int(center[1] + th / 2 + 15)
                    
                    # Draw background rectangle
                    cv2.rectangle(frame, (org_x, org_y - th - 5), (org_x + total_tw, org_y + 5), (0, 0, 0), -1)
                    
                    # Draw text parts sequentially
                    cv2.putText(frame, part_id, (org_x, org_y), font, scale, color_id, thick, cv2.LINE_AA)
                    cv2.putText(frame, part_x, (org_x + tw_id, org_y), font, scale, color_x, thick, cv2.LINE_AA)
                    cv2.putText(frame, part_y, (org_x + tw_id + tw_x, org_y), font, scale, color_y, thick, cv2.LINE_AA)
                    cv2.putText(frame, part_z, (org_x + tw_id + tw_x + tw_y, org_y), font, scale, color_z, thick, cv2.LINE_AA)
                    
        # Display the frame in a large window
        cv2.namedWindow('Webcam ArUco 6D Pose', cv2.WINDOW_NORMAL)
        cv2.resizeWindow('Webcam ArUco 6D Pose', 1280, 720)
        cv2.imshow('Webcam ArUco 6D Pose', frame)
        
        # Handle key events
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            self.get_logger().info('Closing window...')
            self.cap.release()
            cv2.destroyAllWindows()
            self.destroy_node()
            rclpy.shutdown()

def main(args=None):
    rclpy.init(args=args)
    node = WebcamArucoPoseNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        if node.cap.isOpened():
            node.cap.release()
        cv2.destroyAllWindows()
        # Destroy the node explicitly
        # (optional - otherwise it will be done automatically
        # when the garbage collector destroys the node object)
        if rclpy.ok():
            node.destroy_node()
            rclpy.shutdown()

if __name__ == '__main__':
    main()
