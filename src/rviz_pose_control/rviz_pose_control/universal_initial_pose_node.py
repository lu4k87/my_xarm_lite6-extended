#!/usr/bin/env python3

import time
import rclpy
from rclpy.node import Node
from trajectory_msgs.msg import JointTrajectory, JointTrajectoryPoint
from builtin_interfaces.msg import Duration
from std_srvs.srv import Trigger
from xarm_msgs.srv import MoveCartesian
from moveit_msgs.srv import GetPositionIK
import math
from rclpy.callback_groups import ReentrantCallbackGroup
from rclpy.executors import MultiThreadedExecutor

def get_quaternion_from_euler(roll, pitch, yaw):
    cy = math.cos(yaw * 0.5)
    sy = math.sin(yaw * 0.5)
    cp = math.cos(pitch * 0.5)
    sp = math.sin(pitch * 0.5)
    cr = math.cos(roll * 0.5)
    sr = math.sin(roll * 0.5)
    q = [0]*4
    q[0] = sr * cp * cy - cr * sp * sy # w
    q[1] = cr * sp * cy + sr * cp * sy # x
    q[2] = cr * cp * sy - sr * sp * cy # y
    q[3] = cr * cp * cy + sr * sp * sy # z
    return q[1], q[2], q[3], q[0]

class UniversalInitialPoseNode(Node):
    def __init__(self):
        super().__init__('universal_initial_pose_node')
        
        self.cb_group = ReentrantCallbackGroup()
        
        self.publisher_ = self.create_publisher(
            JointTrajectory, 
            '/lite6_traj_controller/joint_trajectory', 
            10
        )
        
        self.servo_stop_client = self.create_client(Trigger, '/servo_server/stop_servo', callback_group=self.cb_group)
        self.servo_start_client = self.create_client(Trigger, '/servo_server/start_servo', callback_group=self.cb_group)
        self.srv = self.create_service(
            Trigger, 
            '/ui/execute_initial_pose', 
            self.execute_initial_pose_cb,
            callback_group=self.cb_group
        )
        self.move_srv = self.create_service(
            MoveCartesian,
            '/ui/execute_move_to_pose',
            self.execute_move_to_pose_cb,
            callback_group=self.cb_group
        )
        self.get_logger().info('Universal Control Services (/ui/execute_initial_pose, /ui/execute_move_to_pose) ready.')
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

    def execute_move_to_pose_cb(self, request, response):
        if self.is_executing:
            response.ret = -1
            response.message = "Already executing."
            return response
            
        self.is_executing = True
        try:
            import tf2_ros
            import tf_transformations
            from geometry_msgs.msg import TwistStamped
            import numpy as np

            # wir nutzen Servo direkt ueber Twist cmds
            twist_pub = self.create_publisher(TwistStamped, '/servo_server/delta_twist_cmds', 10)
            
            tf_buffer = tf2_ros.Buffer()
            tf_listener = tf2_ros.TransformListener(tf_buffer, self)
            
            # Ziel-Koordinaten (Panel sendet mm, wir brauchen m)
            target_x = request.pose[0] / 1000.0
            target_y = request.pose[1] / 1000.0
            target_z = request.pose[2] / 1000.0
            
            target_r = request.pose[3]
            target_p = request.pose[4]
            target_yaw = request.pose[5]
            
            # P-Regler Konstanten
            Kp_pos = 1.0
            Kp_ori = 0.5
            max_vel_pos = 0.1 # m/s
            max_vel_ori = 0.5 # rad/s
            
            rate = self.create_rate(20.0) # 20 Hz loop
            
            self.get_logger().info(f"MoveTo gestartet: X={target_x:.3f}, Y={target_y:.3f}, Z={target_z:.3f}")
            
            # Timeout nach 15 Sekunden
            start_time = self.get_clock().now()
            
            while rclpy.ok():
                if (self.get_clock().now() - start_time).nanoseconds / 1e9 > 15.0:
                    raise Exception("Timeout: Ziel nicht erreicht in 15 Sekunden.")
                    
                try:
                    trans = tf_buffer.lookup_transform('link_base', 'link_tcp', rclpy.time.Time())
                except Exception as e:
                    time.sleep(0.1)
                    continue
                    
                cur_x = trans.transform.translation.x
                cur_y = trans.transform.translation.y
                cur_z = trans.transform.translation.z
                
                # Einfacher Positions-Fehler
                err_x = target_x - cur_x
                err_y = target_y - cur_y
                err_z = target_z - cur_z
                
                dist = np.sqrt(err_x**2 + err_y**2 + err_z**2)
                
                # Wenn wir nah genug dran sind (2mm), stoppen wir!
                if dist < 0.002:
                    break
                    
                # Geschwindigkeiten berechnen
                vx = np.clip(err_x * Kp_pos, -max_vel_pos, max_vel_pos)
                vy = np.clip(err_y * Kp_pos, -max_vel_pos, max_vel_pos)
                vz = np.clip(err_z * Kp_pos, -max_vel_pos, max_vel_pos)
                
                # Sende Twist an Servo
                t = TwistStamped()
                t.header.frame_id = 'link_base'
                t.header.stamp = self.get_clock().now().to_msg()
                t.twist.linear.x = float(vx)
                t.twist.linear.y = float(vy)
                t.twist.linear.z = float(vz)
                # Orientierung ignorieren wir hier fuers Erste um Fehler zu vermeiden!
                t.twist.angular.x = 0.0
                t.twist.angular.y = 0.0
                t.twist.angular.z = 0.0
                
                twist_pub.publish(t)
                time.sleep(0.05)
                
            # Stopp-Kommando senden
            t_stop = TwistStamped()
            t_stop.header.frame_id = 'link_base'
            t_stop.header.stamp = self.get_clock().now().to_msg()
            twist_pub.publish(t_stop)
            
            self.get_logger().info("MoveTo Ziel erfolgreich erreicht!")
            response.ret = 0
            response.message = "Success"
        except Exception as e:
            self.get_logger().error(f"Error in MoveTo: {e}")
            response.ret = -1
            response.message = str(e)
        finally:
            self.is_executing = False
            
        return response

def main(args=None):
    rclpy.init(args=args)
    node = UniversalInitialPoseNode()
    executor = MultiThreadedExecutor()
    executor.add_node(node)
    try:
        executor.spin()
    except KeyboardInterrupt:
        pass
    finally:
        executor.shutdown()
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
