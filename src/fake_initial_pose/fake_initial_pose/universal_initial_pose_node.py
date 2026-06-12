#!/usr/bin/env python3

import time
import rclpy
from rclpy.node import Node
from trajectory_msgs.msg import JointTrajectory, JointTrajectoryPoint
from builtin_interfaces.msg import Duration
from std_srvs.srv import Trigger

class UniversalInitialPoseNode(Node):
    def __init__(self):
        super().__init__('universal_initial_pose_node')
        
        self.publisher_ = self.create_publisher(
            JointTrajectory, 
            '/lite6_traj_controller/joint_trajectory', 
            10
        )
        
        self.servo_stop_client = self.create_client(Trigger, '/servo_server/stop_servo')
        self.servo_start_client = self.create_client(Trigger, '/servo_server/start_servo')
        
        self.srv = self.create_service(
            Trigger, 
            '/ui/execute_initial_pose', 
            self.execute_initial_pose_cb
        )
        self.get_logger().info('Universal Initial Pose Service /ui/execute_initial_pose ready.')
        self.is_executing = False

    def execute_initial_pose_cb(self, request, response):
        if self.is_executing:
            response.success = False
            response.message = "Already executing."
            return response
            
        self.is_executing = True
        
        try:
            # 1. Stop MoveIt Servo
            if self.servo_stop_client.wait_for_service(timeout_sec=1.0):
                req = Trigger.Request()
                self.servo_stop_client.call_async(req)
                self.get_logger().info('MoveIt Servo pausiert.')
                time.sleep(0.5) 
                
            # 2. Publish our trajectory
            msg = JointTrajectory()
            msg.joint_names = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6']
            
            point = JointTrajectoryPoint()
            point.positions = [0.0, 0.4244, 0.5627, 0.0, 0.1383, 0.0]
            point.velocities = [0.0] * 6
            point.time_from_start = Duration(sec=1, nanosec=500000000)
            
            msg.points.append(point)
            self.publisher_.publish(msg)
            self.get_logger().info('Trajektorie gesendet. Fahre auf Startpose...')
            
            # Warte auf die Ausfuehrung der Bewegung
            time.sleep(2.0)
            
            # 3. Start MoveIt Servo again
            if self.servo_start_client.wait_for_service(timeout_sec=1.0):
                req = Trigger.Request()
                self.servo_start_client.call_async(req)
                self.get_logger().info('MoveIt Servo wieder gestartet.')
                time.sleep(0.5)
                
            response.success = True
            response.message = "Initial Pose reached."
        except Exception as e:
            self.get_logger().error(f"Error: {e}")
            response.success = False
            response.message = str(e)
        finally:
            self.is_executing = False
            
        return response

def main(args=None):
    rclpy.init(args=args)
    node = UniversalInitialPoseNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
