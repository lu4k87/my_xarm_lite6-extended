#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import time
import math
import rclpy
from rclpy.node import Node
from rclpy.action import ActionClient
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

        # Subscribers
        self.create_subscription(
            String, 
            '/ui/grasp_object_cmd', 
            self.grasp_cmd_callback, 
            10,
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

    def publish_status(self, msg_str: str):
        self.get_logger().info(msg_str)
        self.status_pub.publish(String(data=msg_str))

    def marker_callback(self, msg: MarkerArray):
        self.latest_markers = msg.markers

    def grasp_cmd_callback(self, msg: String):
        with self.exec_lock:
            if self.is_executing:
                self.get_logger().warn("Already executing a grasp sequence. Ignoring command.")
                return
            self.is_executing = True

        self.target_object_name = msg.data.strip().lower()
        if not self.target_object_name:
            self.is_executing = False
            return

        self.publish_status(f"➤ Start Planned Grasping: '{self.target_object_name}'")
        
        import threading
        threading.Thread(target=self.execute_grasp_sequence).start()

    def execute_grasp_sequence(self):
        try:
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
                self.publish_status(f"❌ Error: Object '{self.target_object_name}' not found in current RViz markers.")
                return

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
                self.publish_status(f"❌ Error: Grasp center point for object '{self.target_object_name}' not found.")
                return

            # WICHTIG: Entferne das Zielobjekt SOFORT aus der Kollisionswelt!
            # Dadurch blockiert es weder Phase 1 (falls der Arm eng darüber fährt) noch Phase 2.
            ignore_msg = String()
            ignore_msg.data = collision_object_name
            self.ignore_pub.publish(ignore_msg)
            time.sleep(0.5) # Kurzer Moment, damit yolo_moveit_collision das Objekt entfernt

            # Target Z is 2 cm (0.02 m) above the object
            grasp_z_above = grasp_z + 0.02
            
            self.publish_status(f"✓ Found '{self.target_object_name}' (ID: {collision_object_name}) at X={grasp_x*1000.0:.1f}mm, Y={grasp_y*1000.0:.1f}mm, Z={grasp_z_above*1000.0:.1f}mm")

            if not self.move_group_client.wait_for_server(timeout_sec=5.0):
                self.publish_status("❌ Error: MoveIt action server /move_action not available!")
                return

            tf_buffer = tf2_ros.Buffer()
            tf_listener = tf2_ros.TransformListener(tf_buffer, self)
            
            # Allow time for TF tree to populate
            time.sleep(0.5)
            
            try:
                trans = tf_buffer.lookup_transform('link_base', 'link_tcp', rclpy.time.Time())
                cur_x = trans.transform.translation.x
                cur_y = trans.transform.translation.y
                cur_z = trans.transform.translation.z
                
                cur_q = [
                    trans.transform.rotation.x,
                    trans.transform.rotation.y,
                    trans.transform.rotation.z,
                    trans.transform.rotation.w
                ]
                
                # Wir erzwingen, dass der TCP immer exakt senkrecht nach unten zeigt
                grasp_roll = 3.14159
                grasp_pitch = 0.0
                grasp_yaw = 0.0
                target_quat = get_quaternion_from_euler(grasp_roll, grasp_pitch, grasp_yaw)
                
                self.publish_status(f"➤ Erzwinge Top-Down Orientierung: Roll={grasp_roll:.2f}, Pitch={grasp_pitch:.2f}, Yaw={grasp_yaw:.2f}")
            except Exception as e:
                self.get_logger().warn(f"TF lookup failed: {e}. Falling back to default top-down orientation.")
                cur_x = grasp_x
                cur_y = grasp_y
                cur_z = grasp_z + 0.15
                grasp_roll = 3.14159
                grasp_pitch = 0.0
                grasp_yaw = 0.0
                target_quat = get_quaternion_from_euler(grasp_roll, grasp_pitch, grasp_yaw)

            if not self.ik_client.wait_for_service(timeout_sec=1.0):
                self.get_logger().warn("IK service not available. Skipping IK check.")

            safe_z = grasp_z + 0.15
            retract_z = max(cur_z + 0.10, safe_z)
            
            # --- PHASE 1: RETRACT (UP) ---
            self.publish_status("➤ Phase 1: Hebe Arm an, um Kollisionen zu vermeiden.")
            ik_valid_0 = self._check_ik(cur_x, cur_y, retract_z, target_quat)
            if not ik_valid_0:
                self.publish_status("❌ Error: IK check failed for Phase 1. Using Fallback Direct Move.")
                self._fallback_move(cur_x, cur_y, retract_z, grasp_roll, grasp_pitch, grasp_yaw)
            else:
                success = self._plan_and_execute(cur_x, cur_y, retract_z, target_quat, allow_object=None)
                if not success: 
                    self.publish_status("❌ Error: Phase 1 MoveIt Planning failed. Using Fallback Direct Move.")
                    self._fallback_move(cur_x, cur_y, retract_z, grasp_roll, grasp_pitch, grasp_yaw)
            
            time.sleep(1.0)
            
            # --- PHASE 2: HOVER (OVER OBJECT) ---
            self.publish_status("➤ Phase 2: Bewege Arm direkt über das Zielobjekt.")
            ik_valid_1 = self._check_ik(grasp_x, grasp_y, safe_z, target_quat)
            if not ik_valid_1:
                self.publish_status("❌ Error: IK check failed for Phase 2. Using Fallback Direct Move.")
                self._fallback_move(grasp_x, grasp_y, safe_z, grasp_roll, grasp_pitch, grasp_yaw)
            else:
                success = self._plan_and_execute(grasp_x, grasp_y, safe_z, target_quat, allow_object=None)
                if not success: 
                    self.publish_status("❌ Error: Phase 2 MoveIt Planning failed. Using Fallback Direct Move.")
                    self._fallback_move(grasp_x, grasp_y, safe_z, grasp_roll, grasp_pitch, grasp_yaw)
            
            time.sleep(1.0)

            # --- PREPARE PHASE 3 ---
            # To prevent MoveIt and Servo from rejecting the downward motion due to collision,
            # we must temporarily remove the target object from the global planning scene!
            self.publish_status(f"➤ Vorbereitung Phase 3: Schalte Kollisionserkennung für '{collision_object_name}' aus, um zugreifen zu können.")
            ignore_msg = String()
            ignore_msg.data = collision_object_name
            self.ignore_pub.publish(ignore_msg)
            
            # Wait a moment for yolo_moveit_collision to remove it
            time.sleep(0.5)

            # --- PHASE 3: APPROACH (DOWN TO OBJECT) ---
            self.publish_status(f"➤ Phase 3: Greifer fährt nach unten zum Zugreifen.")
            
            ik_valid_2 = self._check_ik(grasp_x, grasp_y, grasp_z_above, target_quat)
            if not ik_valid_2:
                self.publish_status("❌ Error: IK check failed for Phase 3. Using Fallback Direct Move.")
                self._fallback_move(grasp_x, grasp_y, grasp_z_above, grasp_roll, grasp_pitch, grasp_yaw)
            else:
                success = self._plan_and_execute(grasp_x, grasp_y, grasp_z_above, target_quat, allow_object=None)
                if not success: 
                    self.publish_status("❌ Error: Phase 3 MoveIt Planning failed. Using Fallback Direct Move.")
                    self._fallback_move(grasp_x, grasp_y, grasp_z_above, grasp_roll, grasp_pitch, grasp_yaw)

            self.publish_status("✓ Planned Grasp Sequence Completed Successfully!")

        except Exception as e:
            self.publish_status(f"❌ Error executing planned grasp sequence: {e}")
        finally:
            self.is_executing = False

    def _fallback_move(self, x, y, z, roll, pitch, yaw):
        self.publish_status("➤ Executing Fallback Move via Servo...")
        req = MoveCartesian.Request()
        req.pose = [float(x * 1000.0), float(y * 1000.0), float(z * 1000.0), float(roll), float(pitch), float(yaw)]
        req.speed = 0.0
        req.acc = 0.0
        req.mvtime = 0.0
        
        future = self.servo_client.call_async(req)
        while rclpy.ok() and not future.done():
            time.sleep(0.1)
        if future.result() is not None:
            if future.result().ret == 0:
                self.publish_status("✓ Fallback Move Completed")
            else:
                self.publish_status(f"❌ Fallback Move Failed (ret={future.result().ret}, msg={future.result().message})")
        else:
            self.publish_status("❌ Fallback Move Service Call Failed")


    def _check_ik(self, x, y, z, quat) -> bool:
        req = GetPositionIK.Request()
        req.ik_request.group_name = 'lite6'
        req.ik_request.timeout.sec = 1
        
        pose_stamped = PoseStamped()
        pose_stamped.header.frame_id = "link_base"
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

    def _plan_and_execute(self, x, y, z, quat, allow_object=None) -> bool:
        goal_msg = MoveGroup.Goal()
        
        req = MotionPlanRequest()
        req.workspace_parameters.header.frame_id = "link_base"
        req.workspace_parameters.min_corner.x = -1.0
        req.workspace_parameters.min_corner.y = -1.0
        req.workspace_parameters.min_corner.z = -0.5
        req.workspace_parameters.max_corner.x = 1.0
        req.workspace_parameters.max_corner.y = 1.0
        req.workspace_parameters.max_corner.z = 1.0
        
        req.group_name = 'lite6'
        req.num_planning_attempts = 10
        req.allowed_planning_time = 5.0
        req.max_velocity_scaling_factor = 0.5
        req.max_acceleration_scaling_factor = 0.5
        
        p_constraint = PositionConstraint()
        p_constraint.header.frame_id = "link_base"
        p_constraint.link_name = "link_tcp"
        
        bv = BoundingVolume()
        sphere = SolidPrimitive()
        sphere.type = SolidPrimitive.SPHERE
        sphere.dimensions = [0.005] # 5mm tolerance for IK success (reduced from 15mm for higher precision)
        bv.primitives.append(sphere)
        
        pose = Pose()
        pose.position.x = float(x)
        pose.position.y = float(y)
        pose.position.z = float(z)
        bv.primitive_poses.append(pose)
        
        p_constraint.constraint_region = bv
        p_constraint.weight = 1.0

        o_constraint = OrientationConstraint()
        o_constraint.header.frame_id = "link_base"
        o_constraint.link_name = "link_tcp"
        o_constraint.orientation = quat
        o_constraint.absolute_x_axis_tolerance = 0.001
        o_constraint.absolute_y_axis_tolerance = 0.001
        o_constraint.absolute_z_axis_tolerance = 0.001
        o_constraint.weight = 1.0

        constraints = Constraints()
        constraints.position_constraints.append(p_constraint)
        constraints.orientation_constraints.append(o_constraint)
        req.goal_constraints.append(constraints)

        goal_msg.request = req
        goal_msg.planning_options.plan_only = True # <--- Wir lassen MoveIt NUR planen!
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
            time.sleep(0.1)
            
        if not future.done() or not future.result().accepted:
            self.get_logger().error("MoveIt Action Goal rejected.")
            return False
            
        result_future = future.result().get_result_async()
        while rclpy.ok() and not result_future.done():
            time.sleep(0.1)
            
        result = result_future.result().result
        
        # moveit_msgs/MoveItErrorCodes
        # 1 = SUCCESS
        if result.error_code.val != 1:
            self.publish_status(f"❌ MoveIt Planning failed with error code: {result.error_code.val}")
            return False
            
        self.publish_status("✓ MoveIt Path Planned! Executing via Trajectory Controller...")
        
        # Execute by publishing the planned trajectory directly
        if result.planned_trajectory and result.planned_trajectory.joint_trajectory.points:
            traj_msg = result.planned_trajectory.joint_trajectory
            self.traj_pub.publish(traj_msg)
            
            # Wait for execution to finish
            duration = traj_msg.points[-1].time_from_start
            wait_time = duration.sec + duration.nanosec * 1e-9 + 0.5
            time.sleep(wait_time)
        else:
            self.publish_status("❌ No valid trajectory generated by MoveIt.")
            return False
            
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
