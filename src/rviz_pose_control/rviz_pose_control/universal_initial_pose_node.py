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
            # 1. Pause Servo
            if self.servo_stop_client.wait_for_service(timeout_sec=1.0):
                req = Trigger.Request()
                self.servo_stop_client.call_async(req)
                time.sleep(0.5)
                
            # 2. Call IK
            ik_client = self.create_client(GetPositionIK, '/compute_ik', callback_group=self.cb_group)
            if not ik_client.wait_for_service(timeout_sec=15.0):
                raise Exception("IK service not available")
                
            ik_req = GetPositionIK.Request()
            ik_req.ik_request.group_name = 'lite6'
            ik_req.ik_request.pose_stamped.header.frame_id = 'link_base'
            
            # Request pose is [x, y, z, roll, pitch, yaw] in mm and radians? 
            # Wait, RViz panel sends in mm and radians! 
            # Actually, RViz panel sent x,y,z in mm to python service originally!
            x = request.pose[0] / 1000.0
            y = request.pose[1] / 1000.0
            z = request.pose[2] / 1000.0
            qx, qy, qz, qw = get_quaternion_from_euler(request.pose[3], request.pose[4], request.pose[5])
            
            ik_req.ik_request.pose_stamped.pose.position.x = x
            ik_req.ik_request.pose_stamped.pose.position.y = y
            ik_req.ik_request.pose_stamped.pose.position.z = z
            ik_req.ik_request.pose_stamped.pose.orientation.x = qx
            ik_req.ik_request.pose_stamped.pose.orientation.y = qy
            ik_req.ik_request.pose_stamped.pose.orientation.z = qz
            ik_req.ik_request.pose_stamped.pose.orientation.w = qw
            
            ik_res = ik_client.call(ik_req)
            if ik_res.error_code.val != 1: # SUCCESS
                raise Exception(f"IK failed with code {ik_res.error_code.val}")
                
            # 3. Publish Trajectory
            msg = JointTrajectory()
            msg.joint_names = ik_res.solution.joint_state.name
            
            point = JointTrajectoryPoint()
            point.positions = ik_res.solution.joint_state.position
            point.time_from_start = Duration(sec=2, nanosec=0)
            msg.points.append(point)
            
            self.publisher_.publish(msg)
            time.sleep(2.5)
            
            # 4. Resume Servo
            if self.servo_start_client.wait_for_service(timeout_sec=1.0):
                req = Trigger.Request()
                self.servo_start_client.call_async(req)
                
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
