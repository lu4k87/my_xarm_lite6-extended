#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image
from cv_bridge import CvBridge
import subprocess
import re
import cv2
import mss
import numpy as np

class WindowCaptureNode(Node):
    def __init__(self):
        super().__init__('window_capture_node')

        # WM_CLASS des zu erfassenden X11-Fensters (Default: RViz2)
        self.window_name = self.declare_parameter('window_name', 'rviz2').value

        self.publisher_ = self.create_publisher(Image, '/window_capture/image_raw', 10)
        self.timer = self.create_timer(1.0 / 15.0, self.timer_callback) # 15 FPS
        self.bridge = CvBridge()
        self.sct = mss.mss()
        self.win_geom = None
        self.find_win_attempts = 0
        
        self.get_logger().info(f'Window Capture Node started. Waiting for "{self.window_name}" window...')

    def get_window_geometry(self):
        try:
            out = subprocess.check_output(['xwininfo', '-root', '-tree'], text=True)
            win_id = None
            for line in out.splitlines():
                if f'("{self.window_name}"' in line:
                    match = re.search(r'(0x[0-9a-fA-F]+)\s+', line)
                    if match:
                        size_match = re.search(r'\s+(\d+)x(\d+)\+', line)
                        if size_match:
                            w, h = int(size_match.group(1)), int(size_match.group(2))
                            if w > 100 and h > 100:
                                win_id = match.group(1)
                                break

            if not win_id:
                return None

            geom_out = subprocess.check_output(['xwininfo', '-id', win_id], text=True)
            x = y = w = h = 0
            for line in geom_out.splitlines():
                if 'Absolute upper-left X:' in line:
                    x = int(line.split(':')[-1].strip())
                elif 'Absolute upper-left Y:' in line:
                    y = int(line.split(':')[-1].strip())
                elif 'Width:' in line:
                    w = int(line.split(':')[-1].strip())
                elif 'Height:' in line:
                    h = int(line.split(':')[-1].strip())
            
            return {'left': x, 'top': y, 'width': w, 'height': h}
        except Exception as e:
            return None

    def timer_callback(self):
        if not self.win_geom:
            self.find_win_attempts += 1
            if self.find_win_attempts % 15 == 0: # Check every 1 second
                self.win_geom = self.get_window_geometry()
                if self.win_geom:
                    self.get_logger().info(f'Found "{self.window_name}" window: {self.win_geom}. Starting capture...')
            return

        try:
            # Capture the target window
            sct_img = self.sct.grab(self.win_geom)
            
            # Convert to numpy array and drop alpha channel (BGRA -> BGR)
            img = np.array(sct_img)[:, :, :3]
            
            # Convert to ROS Image message
            msg = self.bridge.cv2_to_imgmsg(img, encoding="bgr8")
            self.publisher_.publish(msg)
            
        except mss.exception.ScreenShotError:
            # Window probably closed or moved out of bounds
            self.get_logger().warn('Failed to capture screen. Window might have closed.')
            self.win_geom = None
            
        except Exception as e:
            self.get_logger().error(f'Error capturing window: {e}')

def main(args=None):
    rclpy.init(args=args)
    node = WindowCaptureNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
