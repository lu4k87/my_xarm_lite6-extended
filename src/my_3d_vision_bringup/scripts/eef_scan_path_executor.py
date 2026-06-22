#!/usr/bin/env python3

import rclpy
from rclpy.node import Node
from std_srvs.srv import Trigger
from xarm_msgs.srv import MoveCartesian
import time

class EEFScanPathExecutor(Node):
    def __init__(self):
        super().__init__('eef_scan_path_executor')
        
        # Service server to start the scan
        self.srv = self.create_service(
            Trigger, 
            '/ui/start_octomap_scan', 
            self.scan_callback
        )
        
        # Service client to move the robot
        self.move_client = self.create_client(MoveCartesian, '/ui/execute_move_to_pose')
        
        self.get_logger().info('EEF Scan Path Executor ready. Call /ui/start_octomap_scan to begin.')
        self.is_scanning = False

    def scan_callback(self, request, response):
        if self.is_scanning:
            response.success = False
            response.message = "Scan is already running!"
            return response

        self.is_scanning = True
        
        # Raster Wegpunkte (S-Kurve über dem Tisch)
        # Koordinaten in mm, Orientierung in Radiant
        # x, y, z, roll, pitch, yaw
        # Z auf 400mm (40cm), Roll=3.14 (Greifer zeigt nach unten)
        z_height = 400.0
        roll = 3.14159
        pitch = 0.0
        yaw = 0.0
        
        waypoints = [
            # Reihe 1 (vorne)
            [250.0, -200.0, z_height, roll, pitch, yaw],
            [250.0,  0.0,   z_height, roll, pitch, yaw],
            [250.0,  200.0, z_height, roll, pitch, yaw],
            # Reihe 2 (mitte)
            [350.0,  200.0, z_height, roll, pitch, yaw],
            [350.0,  0.0,   z_height, roll, pitch, yaw],
            [350.0, -200.0, z_height, roll, pitch, yaw],
            # Reihe 3 (hinten)
            [450.0, -200.0, z_height, roll, pitch, yaw],
            [450.0,  0.0,   z_height, roll, pitch, yaw],
            [450.0,  200.0, z_height, roll, pitch, yaw],
        ]

        self.get_logger().info(f'Starting scan with {len(waypoints)} waypoints.')
        
        try:
            for i, wp in enumerate(waypoints):
                self.get_logger().info(f'Moving to waypoint {i+1}/{len(waypoints)}: {wp}')
                success = self.call_move_service(wp)
                if not success:
                    self.get_logger().error(f'Failed to reach waypoint {i+1}. Aborting scan.')
                    response.success = False
                    response.message = "Aborted due to IK or movement failure."
                    self.is_scanning = False
                    return response
                
                # Kurze Pause an jedem Wegpunkt, damit die Octomap die Punkte gut aufnimmt
                time.sleep(1.0)
                
            response.success = True
            response.message = "Scan path completed successfully."
        except Exception as e:
            response.success = False
            response.message = str(e)
            self.get_logger().error(f'Error during scan: {e}')
            
        self.is_scanning = False
        return response

    def call_move_service(self, pose):
        if not self.move_client.wait_for_service(timeout_sec=2.0):
            self.get_logger().error('Move service /ui/execute_move_to_pose not available!')
            return False

        req = MoveCartesian.Request()
        req.pose = pose
        
        # We need to call service asynchronously and wait for it inside a node loop,
        # but since we are in a callback, spinning might block. 
        # A simple workaround for simple scripts is to use a client in a separate thread,
        # or use the multi-threaded executor. 
        # For simplicity, we just use the synchrnous call since this is a Trigger callback.
        # Wait, synchronous call in a callback in rclpy will deadlock if using SingleThreadedExecutor.
        # Let's handle this properly.
        
        future = self.move_client.call_async(req)
        # We can wait for future in a loop if we are careful, or better use MultiThreadedExecutor.
        
        # Loop until done
        while rclpy.ok() and not future.done():
            time.sleep(0.1)
            
        try:
            result = future.result()
            if result.ret == 0:
                return True
            else:
                self.get_logger().error(f'Move failed with message: {result.message}')
                return False
        except Exception as e:
            self.get_logger().error(f'Service call failed: {e}')
            return False

def main(args=None):
    rclpy.init(args=args)
    node = EEFScanPathExecutor()
    # Use MultiThreadedExecutor to allow service calls within callbacks
    from rclpy.executors import MultiThreadedExecutor
    executor = MultiThreadedExecutor()
    executor.add_node(node)
    
    # We must assign the callbacks to a ReentrantCallbackGroup to allow parallel execution
    from rclpy.callback_groups import ReentrantCallbackGroup
    cb_group = ReentrantCallbackGroup()
    node.srv = node.create_service(Trigger, '/ui/start_octomap_scan', node.scan_callback, callback_group=cb_group)
    node.move_client = node.create_client(MoveCartesian, '/ui/execute_move_to_pose', callback_group=cb_group)
    
    try:
        executor.spin()
    except KeyboardInterrupt:
        pass
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
