#!/usr/bin/env python3

import sys
import time
import rclpy
from rclpy.node import Node
from trajectory_msgs.msg import JointTrajectory, JointTrajectoryPoint
from builtin_interfaces.msg import Duration
from std_srvs.srv import Trigger

class InitialPoseSetter(Node):
    def __init__(self):
        super().__init__('initial_pose_setter')
        
        self.publisher_ = self.create_publisher(
            JointTrajectory, 
            '/lite6_traj_controller/joint_trajectory', 
            10
        )
        
        self.servo_stop_client = self.create_client(Trigger, '/servo_server/stop_servo')
        self.servo_start_client = self.create_client(Trigger, '/servo_server/start_servo')
        
        # Warte 2 Sekunden, um sicherzugehen, dass RViz und der Controller laufen
        self.get_logger().info('Warte auf Controller (/lite6_traj_controller)...')
        self.timer = self.create_timer(2.0, self.publish_pose)
        self.published = False

    def publish_pose(self):
        if self.published:
            return
        self.published = True
            
        # 1. Stop MoveIt Servo to prevent it from overwriting our trajectory
        if self.servo_stop_client.wait_for_service(timeout_sec=1.0):
            req = Trigger.Request()
            self.servo_stop_client.call_async(req)
            self.get_logger().info('MoveIt Servo pausiert.')
            time.sleep(0.5) # Wait for halt messages to finish
            
        # 2. Publish our trajectory
        msg = JointTrajectory()
        msg.joint_names = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6']
        
        point = JointTrajectoryPoint()
        point.positions = [0.0, 0.4244, 0.5627, 0.0, 0.1383, 0.0]
        point.velocities = [0.0] * 6
        point.time_from_start = Duration(sec=0, nanosec=500000000)
        
        msg.points.append(point)
        self.publisher_.publish(msg)
        self.get_logger().info('Erfolgreich! Die Fake-Hardware faehrt nun in die Startpose: X=200, Y=0, Z=150')
        
        # Wait for the trajectory to execute
        time.sleep(1.0)
        
        # 3. Start MoveIt Servo again so the gamepad works
        if self.servo_start_client.wait_for_service(timeout_sec=1.0):
            req = Trigger.Request()
            self.servo_start_client.call_async(req)
            self.get_logger().info('MoveIt Servo wieder gestartet.')
            time.sleep(0.5)
        
        sys.exit(0)

def main(args=None):
    rclpy.init(args=args)
    node = InitialPoseSetter()
    
    try:
        rclpy.spin(node)
    except SystemExit:
        pass
    except KeyboardInterrupt:
        pass
        
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
