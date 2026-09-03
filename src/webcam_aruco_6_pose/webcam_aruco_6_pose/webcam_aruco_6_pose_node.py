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
        self.aruco_dict = aruco.getPredefinedDictionary(aruco.DICT_6X6_250)
        self.aruco_params = aruco.DetectorParameters()
        self.detector = aruco.ArucoDetector(self.aruco_dict, self.aruco_params)
        
        # Marker size in meters (default 5 cm, adjust as needed)
        self.marker_size = 0.05 
        
        # Timer for capture loop (30 FPS)
        self.timer = self.create_timer(1.0 / 30.0, self.timer_callback)
        self.get_logger().info('Webcam ArUco Node started. Press "q" in the window to close.')

    def timer_callback(self):
        ret, frame = self.cap.read()
        if not ret:
            self.get_logger().warning('Failed to grab frame')
            return

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
            for i in range(len(ids)):
                # Get the 2D points of the marker corners
                img_points = corners[i][0]
                
                # Solve PnP
                success, rvec, tvec = cv2.solvePnP(obj_points, img_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_IPPE_SQUARE)
                
                if success:
                    # Draw axis (OpenCV 4.x)
                    cv2.drawFrameAxes(frame, camera_matrix, dist_coeffs, rvec, tvec, self.marker_size)
                    
                    # Optional: log the pose
                    # self.get_logger().debug(f'Marker {ids[i][0]}: tvec={tvec.T}, rvec={rvec.T}')
                    
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
