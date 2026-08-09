#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import time
import math
import rclpy
from rclpy.node import Node
from rclpy.action import ActionClient, ActionServer, CancelResponse, GoalResponse
from std_srvs.srv import Trigger
from my_3d_vision_bringup.action import GraspObject
from std_msgs.msg import String
from visualization_msgs.msg import MarkerArray, Marker
from moveit_msgs.action import MoveGroup
from moveit_msgs.msg import MotionPlanRequest, Constraints, PositionConstraint, OrientationConstraint, BoundingVolume, PlanningScene, AllowedCollisionMatrix, AllowedCollisionEntry
from moveit_msgs.srv import GetPositionIK
from shape_msgs.msg import SolidPrimitive
from geometry_msgs.msg import Pose, PoseStamped, Quaternion
from trajectory_msgs.msg import JointTrajectory
from xarm_msgs.srv import MoveCartesian
from rclpy.callback_groups import ReentrantCallbackGroup
from rclpy.executors import MultiThreadedExecutor
from scipy.spatial.transform import Rotation as R
import tf2_ros

def get_quaternion_from_euler(roll, pitch, yaw):
    r = R.from_euler('xyz', [roll, pitch, yaw], degrees=False)
    q_array = r.as_quat()
    q = Quaternion()
    q.x = q_array[0]
    q.y = q_array[1]
    q.z = q_array[2]
    q.w = q_array[3]
    return q

class YoloPlannedGraspExecutor(Node):
    def __init__(self):
        super().__init__('yolo_planned_grasp_executor')

        self.cb_group = ReentrantCallbackGroup()

        # Target object state
        self.target_object_name = ""
        self.latest_markers = []
        self.is_executing = False

        # End effector links that are allowed to collide with the objects
        self.eef_links = [
            'link5', 'link6', 'link_tcp', 'link_eef',
            'uflite_vacuum_gripper_link', 'uflite_gripper_link',
            'vacuum_gripper_link', 'lite_gripper_link', 'other_geometry_link'
        ]

        # Declare parameters
        self.declare_parameter('safe_z_hover_height', 0.15)
        self.declare_parameter('grasp_z_offset', 0.02)
        self.declare_parameter('target_roll', 3.14159)
        self.declare_parameter('target_pitch', 0.0)
        self.declare_parameter('target_yaw', 0.0)
        self.declare_parameter('ik_tolerance_position', 0.005)
        self.declare_parameter('ik_tolerance_orientation', 0.001)
        self.declare_parameter('velocity_scaling', 0.2)
        self.declare_parameter('acceleration_scaling', 0.1)

        # Action Server
        self._action_server = ActionServer(
            self,
            GraspObject,
            '/ui/grasp_object',
            execute_callback=self.execute_grasp_sequence,
            goal_callback=self.goal_callback,
            cancel_callback=self.cancel_callback,
            callback_group=self.cb_group
        )
        self.create_subscription(
            MarkerArray, 
            '/zed/bboxes_3d', 
            self.marker_callback, 
            10,
            callback_group=self.cb_group
        )

        # Action Client for MoveIt 2 Motion Planning
        self.move_group_client = ActionClient(
            self, 
            MoveGroup, 
            '/move_action', 
            callback_group=self.cb_group
        )
        
        # IK Client
        self.ik_client = self.create_client(GetPositionIK, '/compute_ik', callback_group=self.cb_group)
        
        # Fallback Servo Client
        self.servo_client = self.create_client(MoveCartesian, '/ui/execute_move_to_pose', callback_group=self.cb_group)
        
        # MoveIt Servo Stop/Start — CRITICAL: Servo must be paused during MoveGroup execution
        self.servo_stop_client = self.create_client(Trigger, '/servo_server/stop_servo', callback_group=self.cb_group)
        self.servo_start_client = self.create_client(Trigger, '/servo_server/start_servo', callback_group=self.cb_group)
        
        # Trajectory Publisher
        self.traj_pub = self.create_publisher(JointTrajectory, '/lite6_traj_controller/joint_trajectory', 10)
        
        # Planning Scene Publisher for Global ACM updates (Fixing Self-Collisions)
        self.scene_pub = self.create_publisher(PlanningScene, '/planning_scene', 10)
        
        # Publisher to tell yolo_moveit_collision to ignore the target object
        self.ignore_pub = self.create_publisher(String, '/ui/ignore_collision_object', 10)
        
        self.status_pub = self.create_publisher(String, '/ui/grasp_status', 10)

        self.get_logger().info("YOLO Planned Grasp Executor ready. Listening on /ui/grasp_object_cmd")
        
        # Lock to prevent race conditions from duplicate web UI commands
        import threading
        self.exec_lock = threading.Lock()

    def publish_status(self, msg_str: str, goal_handle=None):
        self.get_logger().info(msg_str)
        self.status_pub.publish(String(data=msg_str))
        if goal_handle:
            feedback_msg = GraspObject.Feedback()
            feedback_msg.current_phase = msg_str
            feedback_msg.status_message = msg_str
            goal_handle.publish_feedback(feedback_msg)

    def marker_callback(self, msg: MarkerArray):
        self.latest_markers = msg.markers

    def goal_callback(self, goal_request):
        self.get_logger().info(f'Received grasp goal request for: {goal_request.object_name}')
        with self.exec_lock:
            if self.is_executing:
                self.get_logger().warn("Already executing a grasp sequence. Rejecting new goal.")
                return GoalResponse.REJECT
            return GoalResponse.ACCEPT

    def cancel_callback(self, goal_handle):
        self.get_logger().info('Received cancel request for grasp sequence')
        return CancelResponse.ACCEPT

    def execute_grasp_sequence(self, goal_handle):
        with self.exec_lock:
            self.is_executing = True

        self.target_object_name = goal_handle.request.object_name.strip().lower()
        result = GraspObject.Result()

        try:
            self.publish_status(f"➤ Start Planned Grasping: '{self.target_object_name}'", goal_handle)
            
            # CRITICAL: Stop MoveIt Servo before MoveGroup execution!
            # MoveIt Servo and MoveGroup cannot control the trajectory controller simultaneously.
            self._stop_servo(goal_handle)
            
            # 1. Find the object in the latest markers
            target_id = None
            object_base_name = ""
            
            for marker in self.latest_markers:
                if marker.ns.startswith('yolo_labels_') and marker.type == Marker.TEXT_VIEW_FACING:
                    if marker.text.strip().lower() == self.target_object_name:
                        target_id = marker.id
                        object_base_name = marker.text.strip()
                        break
            
            if target_id is None:
                self.publish_status(f"❌ Error: Object '{self.target_object_name}' not found in current RViz markers.", goal_handle)
                goal_handle.abort()
                result.success = False
                result.message = f"Object '{self.target_object_name}' not found."
                return result

            # Construct the MoveIt collision object name exactly as yolo_moveit_collision.py does
            collision_object_name = f"{object_base_name}_{target_id}".replace(' ', '_')

            # Find the sphere marker with the same ID
            grasp_x, grasp_y, grasp_z = None, None, None
            for marker in self.latest_markers:
                if marker.id == target_id and marker.ns == 'yolo_object_grasp_center_point':
                    grasp_x = marker.pose.position.x
                    grasp_y = marker.pose.position.y
                    grasp_z = marker.pose.position.z
                    break

            if grasp_x is None:
                self.publish_status(f"❌ Error: Grasp center point for object '{self.target_object_name}' not found.", goal_handle)
                goal_handle.abort()
                result.success = False
                result.message = f"Grasp center point for '{self.target_object_name}' not found."
                return result

            # WICHTIG: Entferne das Zielobjekt SOFORT aus der Kollisionswelt!
            # Dadurch blockiert es weder Phase 1 (falls der Arm eng darüber fährt) noch Phase 2.
            ignore_msg = String()
            ignore_msg.data = collision_object_name
            self.ignore_pub.publish(ignore_msg)
            time.sleep(0.5) # Kurzer Moment, damit yolo_moveit_collision das Objekt entfernt

            # Get parameters
            safe_z_hover_height = self.get_parameter('safe_z_hover_height').value
            grasp_z_offset = self.get_parameter('grasp_z_offset').value
            target_roll = self.get_parameter('target_roll').value
            target_pitch = self.get_parameter('target_pitch').value
            target_yaw = self.get_parameter('target_yaw').value

            # Target Z is slightly above the object
            grasp_z_above = grasp_z + grasp_z_offset
            
            self.publish_status(f"✓ Found '{self.target_object_name}' (ID: {collision_object_name}) at X={grasp_x*1000.0:.1f}mm, Y={grasp_y*1000.0:.1f}mm, Z={grasp_z_above*1000.0:.1f}mm", goal_handle)

            if not self.move_group_client.wait_for_server(timeout_sec=5.0):
                self.publish_status("❌ Error: MoveIt action server /move_action not available!", goal_handle)
                goal_handle.abort()
                result.success = False
                result.message = "MoveIt action server /move_action not available!"
                return result

            tf_buffer = tf2_ros.Buffer()
            tf_listener = tf2_ros.TransformListener(tf_buffer, self)
            
            # Allow time for TF tree to populate
            time.sleep(0.5)
            
            try:
                trans = tf_buffer.lookup_transform('world', 'link_tcp', rclpy.time.Time())
                cur_x = trans.transform.translation.x
                cur_y = trans.transform.translation.y
                cur_z = trans.transform.translation.z
                
                cur_q = [
                    trans.transform.rotation.x,
                    trans.transform.rotation.y,
                    trans.transform.rotation.z,
                    trans.transform.rotation.w
                ]
                
                # Wir nutzen Parameter für die Top-Down Orientierung
                grasp_roll = target_roll
                grasp_pitch = target_pitch
                grasp_yaw = target_yaw
                target_quat = get_quaternion_from_euler(grasp_roll, grasp_pitch, grasp_yaw)
                
                self.publish_status(f"➤ Forcing orientation: Roll={grasp_roll:.2f}, Pitch={grasp_pitch:.2f}, Yaw={grasp_yaw:.2f}", goal_handle)
            except Exception as e:
                self.get_logger().warn(f"TF lookup failed: {e}. Falling back to default top-down orientation.")
                cur_x = grasp_x
                cur_y = grasp_y
                cur_z = grasp_z + safe_z_hover_height
                grasp_roll = target_roll
                grasp_pitch = target_pitch
                grasp_yaw = target_yaw
                target_quat = get_quaternion_from_euler(grasp_roll, grasp_pitch, grasp_yaw)

            if not self.ik_client.wait_for_service(timeout_sec=1.0):
                self.get_logger().warn("IK service not available. Skipping IK check.")

            safe_z = grasp_z + safe_z_hover_height
            retract_z = max(cur_z + 0.10, safe_z)
            
            # Helper to check cancel
            def check_cancel():
                if goal_handle.is_cancel_requested:
                    goal_handle.canceled()
                    self.publish_status("❌ Grasping cancelled by user.", goal_handle)
                    return True
                return False

            # --- PHASE 1: RETRACT (UP) ---
            if check_cancel(): return GraspObject.Result(success=False, message="Cancelled")
            self.publish_status("➤ Phase 1: Lifting arm to avoid collisions.", goal_handle)
            ik_valid_0 = self._check_ik(cur_x, cur_y, retract_z, target_quat)
            if not ik_valid_0:
                self.publish_status("❌ Error: IK check failed for Phase 1. Using Fallback Direct Move.", goal_handle)
                self._fallback_move(cur_x, cur_y, retract_z, grasp_roll, grasp_pitch, grasp_yaw, goal_handle)
            else:
                success = self._plan_and_execute(cur_x, cur_y, retract_z, target_quat, allow_object=None, goal_handle=goal_handle)
                if not success: 
                    self.publish_status("❌ Error: Phase 1 MoveIt Planning failed. Using Fallback Direct Move.", goal_handle)
                    self._fallback_move(cur_x, cur_y, retract_z, grasp_roll, grasp_pitch, grasp_yaw, goal_handle)
            
            time.sleep(1.0)
            
            # --- PHASE 2: HOVER (OVER OBJECT) ---
            if check_cancel(): return GraspObject.Result(success=False, message="Cancelled")
            self.publish_status("➤ Phase 2: Moving arm directly over the target object.", goal_handle)
            ik_valid_1 = self._check_ik(grasp_x, grasp_y, safe_z, target_quat)
            if not ik_valid_1:
                self.publish_status("❌ Error: IK check failed for Phase 2. Using Fallback Direct Move.", goal_handle)
                self._fallback_move(grasp_x, grasp_y, safe_z, grasp_roll, grasp_pitch, grasp_yaw, goal_handle)
            else:
                success = self._plan_and_execute(grasp_x, grasp_y, safe_z, target_quat, allow_object=None, goal_handle=goal_handle)
                if not success: 
                    self.publish_status("❌ Error: Phase 2 MoveIt Planning failed. Using Fallback Direct Move.", goal_handle)
                    self._fallback_move(grasp_x, grasp_y, safe_z, grasp_roll, grasp_pitch, grasp_yaw, goal_handle)
            
            time.sleep(1.0)

            # --- PREPARE PHASE 3 ---
            if check_cancel(): return GraspObject.Result(success=False, message="Cancelled")
            self.publish_status(f"➤ Preparing Phase 3: Disabling collision detection for '{collision_object_name}' to allow grasping.", goal_handle)
            ignore_msg = String()
            ignore_msg.data = collision_object_name
            self.ignore_pub.publish(ignore_msg)
            
            time.sleep(0.5)

            # --- PHASE 3: APPROACH (DOWN TO OBJECT) ---
            if check_cancel(): return GraspObject.Result(success=False, message="Cancelled")
            self.publish_status(f"➤ Phase 3: Gripper moving down to grasp.", goal_handle)
            
            ik_valid_2 = self._check_ik(grasp_x, grasp_y, grasp_z_above, target_quat)
            if not ik_valid_2:
                self.publish_status("❌ Error: IK check failed for Phase 3. Using Fallback Direct Move.", goal_handle)
                self._fallback_move(grasp_x, grasp_y, grasp_z_above, grasp_roll, grasp_pitch, grasp_yaw, goal_handle)
            else:
                success = self._plan_and_execute(grasp_x, grasp_y, grasp_z_above, target_quat, allow_object=None, goal_handle=goal_handle)
                if not success: 
                    self.publish_status("❌ Error: Phase 3 MoveIt Planning failed. Using Fallback Direct Move.", goal_handle)
                    self._fallback_move(grasp_x, grasp_y, grasp_z_above, grasp_roll, grasp_pitch, grasp_yaw, goal_handle)

            self.publish_status("✓ Planned Grasp Sequence Completed Successfully!", goal_handle)
            
            # Restart MoveIt Servo after successful execution
            self._start_servo(goal_handle)
            
            goal_handle.succeed()
            result.success = True
            result.message = "Successfully grasped."
            return result

        except Exception as e:
            self.publish_status(f"❌ Error executing planned grasp sequence: {e}", goal_handle)
            # Restart MoveIt Servo even on error so joystick/gamepad control resumes
            self._start_servo(goal_handle)
            goal_handle.abort()
            result.success = False
            result.message = str(e)
            return result
        finally:
            with self.exec_lock:
                self.is_executing = False

    def _stop_servo(self, goal_handle=None):
        """Stop MoveIt Servo to release the trajectory controller for MoveGroup."""
        self.publish_status("➤ Pausing MoveIt Servo for MoveGroup execution...", goal_handle)
        if self.servo_stop_client.wait_for_service(timeout_sec=2.0):
            future = self.servo_stop_client.call_async(Trigger.Request())
            while rclpy.ok() and not future.done():
                time.sleep(0.05)
            time.sleep(0.3)  # Short pause to let Servo fully release the controller
            self.publish_status("✓ MoveIt Servo paused.", goal_handle)
        else:
            self.publish_status("⚠ MoveIt Servo stop service not available (continuing anyway).", goal_handle)

    def _start_servo(self, goal_handle=None):
        """Restart MoveIt Servo after MoveGroup execution."""
        self.publish_status("➤ Resuming MoveIt Servo...", goal_handle)
        if self.servo_start_client.wait_for_service(timeout_sec=2.0):
            future = self.servo_start_client.call_async(Trigger.Request())
            while rclpy.ok() and not future.done():
                time.sleep(0.05)
            time.sleep(0.3)
            self.publish_status("✓ MoveIt Servo resumed.", goal_handle)
        else:
            self.publish_status("⚠ MoveIt Servo start service not available.", goal_handle)

    def _fallback_move(self, x, y, z, roll, pitch, yaw, goal_handle=None):
        self.publish_status("➤ Executing Fallback Move via Servo...", goal_handle)
        req = MoveCartesian.Request()
        req.pose = [float(x * 1000.0), float(y * 1000.0), float(z * 1000.0), float(roll), float(pitch), float(yaw)]
        req.speed = 0.0
        req.acc = 0.0
        req.mvtime = 0.0
        
        future = self.servo_client.call_async(req)
        while rclpy.ok() and not future.done():
            if goal_handle and goal_handle.is_cancel_requested:
                return
            time.sleep(0.1)
            
        if future.result() is not None:
            if future.result().ret == 0:
                self.publish_status("✓ Fallback Move Completed", goal_handle)
            else:
                self.publish_status(f"❌ Fallback Move Failed (ret={future.result().ret}, msg={future.result().message})", goal_handle)
        else:
            self.publish_status("❌ Fallback Move Service Call Failed", goal_handle)


    def _check_ik(self, x, y, z, quat) -> bool:
        req = GetPositionIK.Request()
        req.ik_request.group_name = 'lite6'
        req.ik_request.timeout.sec = 1
        
        pose_stamped = PoseStamped()
        pose_stamped.header.frame_id = "world"
        pose_stamped.pose.position.x = float(x)
        pose_stamped.pose.position.y = float(y)
        pose_stamped.pose.position.z = float(z)
        pose_stamped.pose.orientation = quat
        
        req.ik_request.pose_stamped = pose_stamped
        
        future = self.ik_client.call_async(req)
        while rclpy.ok() and not future.done():
            time.sleep(0.05)
            
        try:
            res = future.result()
            if res and res.error_code.val == 1:
                return True
            else:
                return False
        except Exception:
            return False

    def _plan_and_execute(self, x, y, z, quat, allow_object=None, goal_handle=None) -> bool:
        ik_tol_pos = self.get_parameter('ik_tolerance_position').value
        ik_tol_ori = self.get_parameter('ik_tolerance_orientation').value

        goal_msg = MoveGroup.Goal()
        
        req = MotionPlanRequest()
        req.workspace_parameters.header.frame_id = "world"
        req.workspace_parameters.min_corner.x = -1.0
        req.workspace_parameters.min_corner.y = -1.0
        req.workspace_parameters.min_corner.z = -0.5
        req.workspace_parameters.max_corner.x = 1.0
        req.workspace_parameters.max_corner.y = 1.0
        req.workspace_parameters.max_corner.z = 1.0
        
        req.group_name = 'lite6'
        req.num_planning_attempts = 10
        req.allowed_planning_time = 5.0
        req.max_velocity_scaling_factor = float(self.get_parameter('velocity_scaling').value)
        req.max_acceleration_scaling_factor = float(self.get_parameter('acceleration_scaling').value)
        
        p_constraint = PositionConstraint()
        p_constraint.header.frame_id = "world"
        p_constraint.link_name = "link_tcp"
        
        bv = BoundingVolume()
        sphere = SolidPrimitive()
        sphere.type = SolidPrimitive.SPHERE
        sphere.dimensions = [float(ik_tol_pos)] 
        bv.primitives.append(sphere)
        
        pose = Pose()
        pose.position.x = float(x)
        pose.position.y = float(y)
        pose.position.z = float(z)
        bv.primitive_poses.append(pose)
        
        p_constraint.constraint_region = bv
        p_constraint.weight = 1.0

        o_constraint = OrientationConstraint()
        o_constraint.header.frame_id = "world"
        o_constraint.link_name = "link_tcp"
        o_constraint.orientation = quat
        o_constraint.absolute_x_axis_tolerance = float(ik_tol_ori)
        o_constraint.absolute_y_axis_tolerance = float(ik_tol_ori)
        o_constraint.absolute_z_axis_tolerance = float(ik_tol_ori)
        o_constraint.weight = 1.0

        constraints = Constraints()
        constraints.position_constraints.append(p_constraint)
        constraints.orientation_constraints.append(o_constraint)
        req.goal_constraints.append(constraints)

        goal_msg.request = req
        goal_msg.planning_options.plan_only = False # Let MoveIt plan AND execute
        goal_msg.planning_options.look_around = False
        goal_msg.planning_options.replan = True
        goal_msg.planning_options.replan_attempts = 3
        goal_msg.planning_options.replan_delay = 0.1
        
        # Modify the Allowed Collision Matrix if an object is specified
        if allow_object:
            scene_diff = PlanningScene()
            scene_diff.is_diff = True
            
            acm = AllowedCollisionMatrix()
            # We want to allow collision between allow_object and all eef_links
            acm.entry_names = [allow_object] + self.eef_links
            
            # Create the True entries
            for i in range(len(acm.entry_names)):
                ace = AllowedCollisionEntry()
                ace.enabled = [True] * len(acm.entry_names)
                acm.entry_values.append(ace)
                
            scene_diff.allowed_collision_matrix = acm
            goal_msg.planning_options.planning_scene_diff = scene_diff

        future = self.move_group_client.send_goal_async(goal_msg)
        
        while rclpy.ok() and not future.done():
            if goal_handle and goal_handle.is_cancel_requested:
                future.cancel()
                return False
            time.sleep(0.1)
            
        if not future.done() or not future.result().accepted:
            self.get_logger().error("MoveIt Action Goal rejected.")
            return False
            
        result_future = future.result().get_result_async()
        while rclpy.ok() and not result_future.done():
            if goal_handle and goal_handle.is_cancel_requested:
                # Note: We should actually send a cancel goal to MoveIt here for robustness
                return False
            time.sleep(0.1)
            
        result = result_future.result().result
        
        # moveit_msgs/MoveItErrorCodes
        # 1 = SUCCESS
        if result.error_code.val != 1:
            self.publish_status(f"❌ MoveIt Planning failed with error code: {result.error_code.val}", goal_handle)
            return False
            
        self.publish_status("✓ MoveIt Path Planned and Executed successfully!", goal_handle)
        
        return True

def main(args=None):
    rclpy.init(args=args)
    node = YoloPlannedGraspExecutor()
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
