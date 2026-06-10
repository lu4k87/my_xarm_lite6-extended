#!/usr/bin/env python3

import sys
import rclpy
from rclpy.node import Node
from trajectory_msgs.msg import JointTrajectory, JointTrajectoryPoint
from builtin_interfaces.msg import Duration

class InitialPoseSetter(Node):
    def __init__(self):
        super().__init__('initial_pose_setter')
        
        self.publisher_ = self.create_publisher(
            JointTrajectory, 
            '/lite6_traj_controller/joint_trajectory', 
            10
        )
        
        # Warte 2 Sekunden, um sicherzugehen, dass RViz und der Controller laufen
        self.get_logger().info('Warte auf Controller (/lite6_traj_controller)...')
        self.timer = self.create_timer(2.0, self.publish_pose)
        self.published = False

    def publish_pose(self):
        if self.published:
            return
            
        msg = JointTrajectory()
        msg.joint_names = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6']
        
        point = JointTrajectoryPoint()
        
        # Inverskinematik fuer TCP: X=200mm, Y=0mm, Z=150mm (nach unten gerichtet)
        # Bypassing MoveIt-Planung, damit wir Probleme mit Startkollisionen (bei 0,0,0,0,0,0) vermeiden
        point.positions = [0.0, 0.4244, 0.5627, 0.0, 0.1383, 0.0]
        point.velocities = [0.0] * 6
        
        # Fahre die Position in 0.5 Sekunden an
        point.time_from_start = Duration(sec=0, nanosec=500000000)
        
        msg.points.append(point)
        
        self.publisher_.publish(msg)
        self.get_logger().info('Erfolgreich! Die Fake-Hardware faehrt nun in die Startpose: X=200, Y=0, Z=150')
        self.published = True
        
        # Beende den Node, nachdem der Befehl gesendet wurde
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
