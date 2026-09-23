#!/usr/bin/env python3

import json
import threading
import time
import rclpy
from rclpy.node import Node
from rclpy.action import ActionClient
from action_msgs.msg import GoalStatus, GoalStatusArray
from rclpy.qos import QoSProfile, DurabilityPolicy
from trajectory_msgs.msg import JointTrajectory, JointTrajectoryPoint
from builtin_interfaces.msg import Duration
from std_msgs.msg import String
from std_srvs.srv import Trigger
from xarm_msgs.srv import MoveCartesian, MoveJoint
from moveit_msgs.srv import GetPositionIK
from moveit_msgs.action import MoveGroup
from moveit_msgs.msg import Constraints, DisplayTrajectory, JointConstraint, MotionPlanRequest, MoveItErrorCodes
import math
import numpy as np
from scipy.spatial.transform import Rotation as R
from rclpy.callback_groups import ReentrantCallbackGroup, MutuallyExclusiveCallbackGroup
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

class RobotMotionHandlerMovegroup(Node):
    def __init__(self):
        super().__init__('robot_motion_handler_movegroup')
        
        self.cb_group = ReentrantCallbackGroup()
        self.stop_cb_group = MutuallyExclusiveCallbackGroup()
        self.state_cb_group = MutuallyExclusiveCallbackGroup()
        
        import tf2_ros
        from geometry_msgs.msg import TwistStamped
        self.tf_buffer = tf2_ros.Buffer()
        self.tf_listener = tf2_ros.TransformListener(self.tf_buffer, self)
        self.twist_pub = self.create_publisher(TwistStamped, '/servo_server/delta_twist_cmds', 10)
        
        try:
            import pygame
            import os
            pygame.mixer.init()
            ws_root = os.environ.get("ROS2_WS", os.path.expanduser('~/dev_ws'))
            sounds_dir = os.path.join(ws_root, 'sounds')
            if not os.path.isdir(sounds_dir):
                sounds_dir = os.path.expanduser('~/dev_ws/sounds/')
            self.sound_initial = pygame.mixer.Sound(os.path.join(sounds_dir, '_voice_robot_moves_to_initial_pose.mp3'))
            self.sound_absolute = pygame.mixer.Sound(os.path.join(sounds_dir, '_voice_robot_moves_to_absolute_pose.mp3'))
        except Exception as e:
            self.get_logger().warning(f"Could not init audio: {e}")
            self.sound_initial = None
            self.sound_absolute = None


        
        from std_msgs.msg import Bool
        self.sound_enabled = True
        self.sound_sub = self.create_subscription(
            Bool,
            '/ui/sound_enabled',
            self._sound_enabled_cb,
            10
        )

        self.publisher_ = self.create_publisher(
            JointTrajectory, 
            '/lite6_traj_controller/joint_trajectory', 
            10
        )
        
        from std_msgs.msg import String
        self.ui_log_pub = self.create_publisher(String, '/ui/motion_status', 10)
        
        self.ik_client = self.create_client(GetPositionIK, '/compute_ik', callback_group=self.cb_group)

        # MoveTo lets move_group (OMPL) plan a collision-free path to the IK goal
        # instead of sending the joint angles straight to the controller. Only
        # this way every intermediate pose is checked against objects and ground.
        self.move_group_client = ActionClient(self, MoveGroup, '/move_action', callback_group=self.cb_group)
        self._move_goal_handle = None
        self.declare_parameter('moveto_planning_time', 5.0)
        self.declare_parameter('moveto_planning_attempts', 10)
        self.declare_parameter('moveto_timeout', 120.0)  # planning + execution in total (s)
        # Index = UI speed level (0: Slow, 1: Normal, 2: Fast)
        self.declare_parameter('moveto_velocity_scaling', [0.15, 0.3, 0.6])
        self.declare_parameter('moveto_acceleration_scaling', [0.15, 0.3, 0.6])

        # Live MoveTo progress for the MoveIt popup in the Robot Control UI
        # (JSON in std_msgs/String). move_group itself only reports PLANNING and
        # IDLE, so the phases are derived from two other sources:
        #  - /display_planned_path: a candidate path was computed. The pipeline
        #    publishes it even if the path fails validation afterwards, so it
        #    does NOT mean execution has started.
        #  - the trajectory controller's action status: a goal switching to
        #    EXECUTING is the moment move_group actually starts moving the arm.
        self.declare_parameter(
            'moveit_controller_status_topic', '/lite6_traj_controller/follow_joint_trajectory/_action/status')
        self.moveit_state_pub = self.create_publisher(String, '/ui/moveit_motion_state', 10)
        self._moveit_run = None
        self._moveit_seq = 0
        self._moveit_lock = threading.Lock()
        self._controller_goals_seen = set()
        self.create_subscription(
            DisplayTrajectory, '/display_planned_path', self._planned_path_cb, 10,
            callback_group=self.cb_group)
        status_qos = QoSProfile(depth=10, durability=DurabilityPolicy.TRANSIENT_LOCAL)
        self.create_subscription(
            GoalStatusArray, self.get_parameter('moveit_controller_status_topic').value,
            self._controller_status_cb, status_qos, callback_group=self.cb_group)
        
        self.servo_stop_client = self.create_client(Trigger, '/servo_server/stop_servo', callback_group=self.cb_group)
        self.servo_start_client = self.create_client(Trigger, '/servo_server/start_servo', callback_group=self.cb_group)
        
        from xarm_msgs.srv import SetInt16
        self.ufactory_state_client = self.create_client(SetInt16, '/ufactory/set_state', callback_group=self.stop_cb_group)
        self.xarm_state_client = self.create_client(SetInt16, '/xarm/set_state', callback_group=self.stop_cb_group)
        
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
        # Same MoveTo without the "robot moves to absolute pose" voice - used by
        # the viewport TCP gizmo, where the announcement on every drag is noise.
        self.move_silent_srv = self.create_service(
            MoveCartesian,
            '/ui/execute_move_to_pose_silent',
            self.execute_move_to_pose_silent_cb,
            callback_group=self.cb_group
        )
        self.move_joint_srv = self.create_service(
            MoveJoint,
            '/ui/execute_move_joint',
            self.execute_move_joint_cb,
            callback_group=self.cb_group
        )
        self.scan_srv = self.create_service(
            Trigger, 
            '/ui/start_octomap_scan', 
            self.execute_scan_path_cb,
            callback_group=self.cb_group
        )
        self.object_scan_srv = self.create_service(
            Trigger, 
            '/ui/start_object_scan', 
            self.execute_object_scan_cb,
            callback_group=self.cb_group
        )
        self.stop_srv = self.create_service(
            Trigger, 
            '/ui/emergency_stop', 
            self.emergency_stop_cb,
            callback_group=self.stop_cb_group
        )
        # Backward-compatible aliases for RViz control panel & legacy clients
        self.legacy_scan_srv = self.create_service(
            Trigger,
            '/ui/execute_scan_trajectory',
            self.execute_scan_path_cb,
            callback_group=self.cb_group
        )
        self.legacy_stop_srv = self.create_service(
            Trigger,
            '/ui/stop_motion',
            self.emergency_stop_cb,
            callback_group=self.stop_cb_group
        )
        
        from std_msgs.msg import Empty
        self.stop_sub = self.create_subscription(
            Empty, 
            '/ui/emergency_stop_topic', 
            self.emergency_stop_topic_cb,
            10,
            callback_group=self.stop_cb_group
        )
        # Not-Aus bleibt verriegelt, bis er ueber /ui/reset_emergency_stop
        # quittiert wird. Vorher hob jede neue Bewegung ihn stillschweigend auf.
        self.reset_estop_srv = self.create_service(
            Trigger,
            '/ui/reset_emergency_stop',
            self.reset_emergency_stop_cb,
            callback_group=self.stop_cb_group
        )
        from std_msgs.msg import Bool
        latched_qos = QoSProfile(depth=1, durability=DurabilityPolicy.TRANSIENT_LOCAL)
        self.estop_state_pub = self.create_publisher(Bool, '/ui/emergency_stop_active', latched_qos)

        self.ui_log('Universal Control Services (/ui/execute_initial_pose, /ui/execute_move_to_pose[_silent], /ui/start_octomap_scan, /ui/start_object_scan, /ui/execute_move_joint, /ui/emergency_stop, /ui/reset_emergency_stop) ready.', 'success')
        self.is_executing = False
        self.stop_requested = False
        self.estop_latched = False
        self._exec_state_lock = threading.Lock()
        self._publish_estop_state()

        # Beim Start automatisch in die Initialpose fahren (bisheriges Verhalten).
        # Mit auto_initial_pose:=false bleibt der Arm stehen, bis jemand ihn bewegt.
        self.declare_parameter('auto_initial_pose', True)
        
        from sensor_msgs.msg import JointState
        self.current_joint_state = None
        self.joint_state_sub = self.create_subscription(
            JointState,
            '/joint_states',
            self.joint_state_cb,
            10,
            callback_group=self.state_cb_group
        )
        from std_msgs.msg import Float32
        self.current_speed_scale = 0.5
        self.speed_sub = self.create_subscription(
            Float32,
            '/ui/robot_control/current_speed',
            self.speed_cb,
            10,
            callback_group=self.cb_group
        )
        

        from std_msgs.msg import Int32
        self.current_scan_speed = 1 # 0: Slow, 1: Normal, 2: Fast
        self.scan_speed_sub = self.create_subscription(
            Int32,
            '/ui/scan_speed',
            self.scan_speed_cb,
            10,
            callback_group=self.cb_group
        )
        
        from std_msgs.msg import Float32MultiArray
        self.safe_x = 0.0
        self.safe_y = 0.0
        self.safe_radius = 0.138  # Bahnabstand zur Base = aeussere Grenze der Innen-Singularitaetszone
        self.safety_sub = self.create_subscription(
            Float32MultiArray,
            '/ui/safety_zone_params',
            self.safety_cb,
            10,
            callback_group=self.cb_group
        )
        
        # Start initial pose automatically once MoveIt Servo is ready
        self.startup_timer = self.create_timer(1.0, self._check_servo_ready, callback_group=self.cb_group)
        
    def ui_log(self, msg, level='info'):
        from std_msgs.msg import String
        if level == 'info':
            self.get_logger().info(msg)
            self.ui_log_pub.publish(String(data=f"INFO: {msg}"))
        elif level == 'warn':
            self.get_logger().warn(msg)
            self.ui_log_pub.publish(String(data=f"WARN: {msg}"))
        elif level == 'error':
            self.get_logger().error(msg)
            self.ui_log_pub.publish(String(data=f"ERR: {msg}"))
        elif level == 'success':
            self.get_logger().info(msg)
            self.ui_log_pub.publish(String(data=f"SUCCESS: {msg}"))
        elif level == 'action':
            self.get_logger().info(msg)
            self.ui_log_pub.publish(String(data=f"ACTION: {msg}"))

    def scan_speed_cb(self, msg):
        self.current_scan_speed = msg.data

    def speed_cb(self, msg):
        self.current_speed_scale = msg.data

    def safety_cb(self, msg):
        if len(msg.data) >= 3:
            self.safe_x = msg.data[0]
            self.safe_y = msg.data[1]
            self.safe_radius = msg.data[2]

    def _check_servo_ready(self):
        if not (self.servo_start_client.service_is_ready() and self.servo_stop_client.service_is_ready()):
            return
        self.startup_timer.cancel()
        if not self.get_parameter('auto_initial_pose').value:
            self.ui_log('MoveIt Servo fully loaded. Auto initial pose disabled (auto_initial_pose:=false).', 'success')
            return
        # Laeuft ueber dieselbe Sperre wie jede andere Bewegung, damit kein
        # zweiter Befehl parallel startet, und blockiert keinen Executor-Thread.
        if self.estop_latched or not self._begin_execution():
            return
        self.ui_log('MoveIt Servo fully loaded. Auto-triggering initial pose in 1s...', 'success')

        def _task():
            try:
                time.sleep(1.0)  # Give TF a moment to stabilize
                self._go_to_joints([0.0, 0.4244, 0.5627, 0.0, 0.1383, 0.0], "Moving to Initial Pose...")
            finally:
                self.is_executing = False

        threading.Thread(target=_task, daemon=True).start()

    def _begin_execution(self):
        """Prueft und belegt die Ausfuehrung atomar (16 Executor-Threads)."""
        with self._exec_state_lock:
            if self.is_executing:
                return False
            self.is_executing = True
            return True

    def _estop_rejection(self):
        """Meldung, wenn der Not-Aus noch verriegelt ist, sonst None."""
        if self.estop_latched:
            msg = 'EMERGENCY STOP active - acknowledge it first (/ui/reset_emergency_stop).'
            self.ui_log(msg, 'warn')
            return msg
        return None

    def _publish_estop_state(self):
        from std_msgs.msg import Bool
        self.estop_state_pub.publish(Bool(data=self.estop_latched))

    def _pause_servo(self, log_msg=None):
        if self.servo_stop_client.wait_for_service(timeout_sec=1.0):
            self.servo_stop_client.call_async(Trigger.Request())
            if log_msg:
                self.ui_log(log_msg, 'info')
            time.sleep(0.5)

    def _resume_servo(self):
        # Nach einem Not-Aus bleibt Servo aus - erst das Quittieren startet es wieder.
        if self.stop_requested:
            return
        if self.servo_start_client.wait_for_service(timeout_sec=1.0):
            self.servo_start_client.call_async(Trigger.Request())
            self.ui_log('MoveIt Servo resumed.', 'info')
            time.sleep(0.5)

    def reset_emergency_stop_cb(self, request, response):
        if not self.estop_latched:
            response.success = True
            response.message = "No emergency stop active."
            return response
        self.estop_latched = False
        self.stop_requested = False
        self._reset_hardware_state()
        if self.servo_start_client.service_is_ready():
            self.servo_start_client.call_async(Trigger.Request())
        self._publish_estop_state()
        self.ui_log('Emergency stop acknowledged. Robot state reset, MoveIt Servo resumed.', 'success')
        response.success = True
        response.message = "Emergency stop acknowledged."
        return response

    def _reset_hardware_state(self):
        from xarm_msgs.srv import SetInt16
        req = SetInt16.Request()
        req.data = 0
        if self.ufactory_state_client.service_is_ready():
            self.ufactory_state_client.call_async(req)
        if self.xarm_state_client.service_is_ready():
            self.xarm_state_client.call_async(req)

    def _sound_enabled_cb(self, msg):
        self.sound_enabled = bool(msg.data)
        if not self.sound_enabled:
            try:
                import pygame
                if pygame.mixer.get_init():
                    pygame.mixer.stop()
            except Exception:
                pass
        self.get_logger().info(f"UI Sound State received: enabled={self.sound_enabled}")

    def execute_initial_pose_cb(self, request, response):
        rejection = self._estop_rejection()
        if rejection:
            response.success = False
            response.message = rejection
            return response
        if not self._begin_execution():
            response.success = False
            response.message = "Already executing."
            return response

        self._reset_hardware_state()
        self.stop_requested = False
        
        if self.sound_enabled and self.sound_initial:
            self.sound_initial.play()
        
        def _task():
            try:
                # --- DIRECT MOVE TO INITIAL POSE ---
                self._go_to_joints([0.0, 0.4244, 0.5627, 0.0, 0.1383, 0.0], "Moving to Initial Pose...")
                    
                self.ui_log("Initial Pose reached.", 'success')
            except Exception as e:
                self.ui_log(f"Error: {e}", 'error')
            finally:
                self.is_executing = False

        threading.Thread(target=_task, daemon=True).start()
        
        response.success = True
        response.message = "Initial Pose sequence started."
        return response

    def _go_to_joints(self, target_joints, log_msg="Moving to target pose..."):
        # 1. Stop MoveIt Servo
        self._pause_servo('MoveIt Servo paused for direct joint motion.')
            
        # 2. Publish trajectory
        msg = JointTrajectory()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.joint_names = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6']
        
        point = JointTrajectoryPoint()
        point.positions = target_joints
        point.velocities = [0.0] * 6
        
        # Skaliere Dauer anhand der Speed-Radiobuttons (0: Slow, 1: Normal, 2: Fast)
        if self.current_scan_speed == 0:
            speed_multiplier = 0.5
        elif self.current_scan_speed == 2:
            speed_multiplier = 2.0
        else:
            speed_multiplier = 1.0
            
        duration_sec = max(1.0, 2.0 / speed_multiplier)
        point.time_from_start = Duration(sec=int(duration_sec), nanosec=int((duration_sec - int(duration_sec)) * 1e9))
        
        msg.points.append(point)
        
        if self.stop_requested:
            self.ui_log('Execution aborted due to EMERGENCY STOP.', 'error')
            return
            
        self.publisher_.publish(msg)
        self.ui_log(f'Trajectory sent. {log_msg}', 'action')
        
        # Warte auf die Ausfuehrung der Bewegung
        start_wait = time.time()
        while time.time() - start_wait < duration_sec + 0.5:
            if self.stop_requested:
                self.ui_log('Movement interrupted by EMERGENCY STOP!', 'error')
                break
            time.sleep(0.1)
        
        # 3. Start MoveIt Servo again
        self._resume_servo()

    def _go_to_joints_trajectory(self, target_joint_points, log_msg="Executing trajectory..."):
        # 1. Stop MoveIt Servo
        self._pause_servo('MoveIt Servo paused for direct trajectory execution.')
            
        # 2. Publish trajectory
        msg = JointTrajectory()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.joint_names = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6']
        
        if self.current_scan_speed == 0:
            speed_multiplier = 0.5
        elif self.current_scan_speed == 2:
            speed_multiplier = 2.0
        else:
            speed_multiplier = 1.0
            
        total_duration = 0.0
        
        for idx, point_data in enumerate(target_joint_points):
            target_joints, duration_sec = point_data
            
            # Skaliere Dauer
            scaled_duration = max(0.1, duration_sec / speed_multiplier)
            total_duration += scaled_duration
            
            point = JointTrajectoryPoint()
            point.positions = target_joints
            
            # Setze velocity nur beim letzten Punkt auf 0 (Stop). 
            # Dazwischen weglassen, damit der ROS2-Controller die Punkte weich interpoliert (Spline)
            if idx == len(target_joint_points) - 1:
                point.velocities = [0.0] * 6
                
            point.time_from_start = Duration(sec=int(total_duration), nanosec=int((total_duration - int(total_duration)) * 1e9))
            msg.points.append(point)
            
        if self.stop_requested:
            self.ui_log('Execution aborted due to EMERGENCY STOP.', 'error')
            return
            
        self.publisher_.publish(msg)
        self.ui_log(f'Trajectory sent with {len(msg.points)} points. {log_msg}', 'action')
        
        # Warte auf die Ausfuehrung der Bewegung
        start_wait = time.time()
        while time.time() - start_wait < total_duration + 0.5:
            if self.stop_requested:
                self.ui_log('Movement interrupted by EMERGENCY STOP!', 'error')
                break
            time.sleep(0.1)
        
        # 3. Start MoveIt Servo again
        self._resume_servo()

    def execute_move_joint_cb(self, request, response):
        rejection = self._estop_rejection()
        if rejection:
            response.ret = -1
            response.message = rejection
            return response
        if not self._begin_execution():
            response.ret = -1
            response.message = "Already executing."
            return response

        self.stop_requested = False
        
        def _task():
            try:
                # 1. Stop MoveIt Servo
                self._pause_servo()
                    
                # 2. Publish trajectory
                msg = JointTrajectory()
                msg.joint_names = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6']
                
                point = JointTrajectoryPoint()
                # request.angles is a list of floats (radians)
                if len(request.angles) >= 6:
                    point.positions = [float(request.angles[0]), float(request.angles[1]), float(request.angles[2]), 
                                       float(request.angles[3]), float(request.angles[4]), float(request.angles[5])]
                else:
                    raise Exception("Not enough joint angles provided")
                    
                point.velocities = [0.0] * 6
                # Duration based on speed scale
                if self.current_scan_speed == 0:
                    speed_multiplier = 0.5
                elif self.current_scan_speed == 2:
                    speed_multiplier = 2.0
                else:
                    speed_multiplier = 1.0
                    
                duration_sec = max(1.0, 2.0 / speed_multiplier)
                
                point.time_from_start = Duration(sec=int(duration_sec), nanosec=int((duration_sec - int(duration_sec)) * 1e9))
                
                msg.points.append(point)
                if self.stop_requested:
                    self.ui_log('Execution aborted due to EMERGENCY STOP.', 'error')
                    return
                self.publisher_.publish(msg)
                self.ui_log('Trajectory sent. Moving to Joint Pose...', 'action')
                
                # Warte auf die Ausfuehrung der Bewegung
                start_wait = time.time()
                while time.time() - start_wait < duration_sec + 0.5:
                    if self.stop_requested:
                        self.ui_log('Movement interrupted by EMERGENCY STOP!', 'error')
                        break
                    time.sleep(0.1)
                
                # 3. Start MoveIt Servo again
                self._resume_servo()
                    
            except Exception as e:
                self.ui_log(f"Error: {e}", 'error')
            finally:
                self.is_executing = False

        threading.Thread(target=_task, daemon=True).start()
        
        response.ret = 0
        response.message = "Joint Pose sequence started."
        return response

    def joint_state_cb(self, msg):
        self.current_joint_state = msg

    def emergency_stop_topic_cb(self, msg):
        class DummyResponse:
            pass
        self.emergency_stop_cb(None, DummyResponse())

    def emergency_stop_cb(self, request, response):
        self.stop_requested = True
        self.estop_latched = True
        self._publish_estop_state()
        self.ui_log('<span style="color: var(--rviz-x); font-weight: bold; font-size: 1.2em;">EMERGENCY STOP TRIGGERED!</span>', 'error')

        # Cancel a planned MoveTo path that move_group is currently running.
        goal_handle = self._move_goal_handle
        if goal_handle is not None:
            goal_handle.cancel_goal_async()

        # Servo anhalten, damit auch Jogging (UI, Gamepad) bis zum Quittieren ruht.
        if self.servo_stop_client.service_is_ready():
            self.servo_stop_client.call_async(Trigger.Request())
        
        # 1. HARDWARE STOP (Firmware level halt)
        from xarm_msgs.srv import SetInt16
        req = SetInt16.Request()
        req.data = 4 # STOP State
        if self.ufactory_state_client.service_is_ready():
            self.ufactory_state_client.call_async(req)
            self.ui_log('Hardware STOP signal sent (/ufactory).', 'success')
        if self.xarm_state_client.service_is_ready():
            self.xarm_state_client.call_async(req)
            self.ui_log('Hardware STOP signal sent (/xarm).', 'success')
            
        # 2. Publish current joint state with zero velocity to stop controller immediately
        if hasattr(self, 'current_joint_state') and self.current_joint_state:
            msg = JointTrajectory()
            msg.header.stamp = self.get_clock().now().to_msg()
            msg.joint_names = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6']
            
            current_positions = [0.0]*6
            for j in range(1, 7):
                j_name = f'joint{j}'
                if j_name in self.current_joint_state.name:
                    idx = self.current_joint_state.name.index(j_name)
                    current_positions[j-1] = self.current_joint_state.position[idx]

            point = JointTrajectoryPoint()
            point.positions = current_positions
            point.velocities = [0.0] * 6
            point.time_from_start = Duration(sec=0, nanosec=100000000) # 0.1s
            msg.points.append(point)
            
            self.publisher_.publish(msg)
            self.ui_log('Published STOP trajectory holding current position.', 'info')
        else:
            # Ohne Gelenkdaten: eine Trajektorie ganz ohne Punkte. Der
            # joint_trajectory_controller bricht damit die laufende Bahn ab und
            # haelt die aktuelle Position. Ein Punkt ohne positions wuerde er
            # dagegen als ungueltig verwerfen.
            msg = JointTrajectory()
            msg.header.stamp = self.get_clock().now().to_msg()
            msg.joint_names = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6']
            self.publisher_.publish(msg)
            self.ui_log('Warning: No joint states. Published empty STOP trajectory (controller holds position).', 'warn')
        
        response.success = True
        response.message = "Emergency Stop Executed."
        return response

    def generate_wave_trajectory(self, min_x=0.250, max_x=0.450, min_y=-0.250, max_y=0.250, base_z=0.300, z_amplitude=0.080):
        """
        Generiert Wegpunkte für eine Sinuswelle ueber das Workspace.
        Der EEF wird dynamisch geneigt, um kontinuierlich auf das Zentrum 
        des abgefahrenen Bereichs zu "schauen".
        """
        waypoints = []
        num_x_steps = 10  # Schritte entlang der X-Achse
        points_per_sweep = 15 # Dichte der Punkte entlang Y
        
        sweep_direction = 1
        
        # Focal point auf dem Tisch (Zentrum des Suchbereichs)
        cx = (min_x + max_x) / 2.0
        cy = (min_y + max_y) / 2.0
        cz = 0.0
        
        # Faktoren zur Dämpfung und Begrenzung der Neigung (IK-Singularitaeten vermeiden!)
        tilt_factor = 0.2
        max_tilt = math.radians(8)
        
        for i in range(num_x_steps):
            x = min_x + (max_x - min_x) * (i / max(1, (num_x_steps - 1)))
            
            y_range = np.linspace(min_y, max_y, points_per_sweep)
            if sweep_direction == -1:
                y_range = reversed(y_range)
                
            for j, y in enumerate(y_range):
                # Sinus in Z auf Basis von Y
                # Wenn Y von min_y nach max_y geht, durchlaufen wir z.B. 1 volle Sinusperiode
                phase = (j / (points_per_sweep - 1)) * 2 * math.pi
                z = base_z + math.sin(phase) * z_amplitude
                
                # Vektor vom EEF zum Focal Point berechnen
                dx = cx - x
                dy = cy - y
                dz = cz - z # ist negativ, da cz (0) < z (ca. 0.3)
                
                # Roll Tilt (Neigung um X-Achse, zielt auf Y-Abweichung)
                roll_tilt = math.atan2(dy, -dz) * tilt_factor
                roll_tilt = max(-max_tilt, min(max_tilt, roll_tilt))
                
                # Pitch Tilt (Neigung um Y-Achse, zielt auf X-Abweichung)
                pitch_tilt = math.atan2(-dx, -dz) * tilt_factor
                pitch_tilt = max(-max_tilt, min(max_tilt, pitch_tilt))
                
                # Zuweisen der Winkel 
                # (Yaw bleibt 0, um unnötigen Twist des gesamten Arms zu vermeiden)
                roll = math.pi + roll_tilt
                pitch = pitch_tilt
                yaw = 0.0
                
                waypoints.append([x, y, z, roll, pitch, yaw])
                
            sweep_direction *= -1
            
        return waypoints

    def generate_single_object_trajectory(self, obj_pos, prev_obj_pos=None, cross_size=0.08, approach_height=0.20, scan_height=0.14):
        """
        Generiert eine Trajektorie (Anflug + Kreuz) fuer ein einzelnes Objekt.
        Fährt einen echten Bogen (Kugeloberfläche) über das Objekt, wobei die Kamera
        immer auf das Zentrum gerichtet bleibt (konstanter Radius).
        """
        waypoints = []
        obj_x, obj_y = obj_pos
        
        half_size = cross_size / 2.0
        # Maximaler Winkel für den Bogen
        max_angle = math.atan2(half_size, scan_height)
        R = scan_height
        
        def add_arc_segment(theta_x_start, theta_x_end, theta_y_start, theta_y_end, steps, yaw_angle=0.0):
            for i in range(steps):
                f = i / max(1, (steps - 1)) if steps > 1 else 1.0
                tx = theta_x_start + (theta_x_end - theta_x_start) * f
                ty = theta_y_start + (theta_y_end - theta_y_start) * f
                
                # Bogen-Koordinaten (Kugeloberfläche)
                x = obj_x - R * math.sin(tx)
                y = obj_y - R * math.sin(ty)
                
                active_theta = tx if abs(tx) > abs(ty) else ty
                z = R * math.cos(active_theta)
                
                # Sicherheitsabstand zur anpassbaren Safety Zone
                r_base = math.hypot(x - self.safe_x, y - self.safe_y)
                if r_base < self.safe_radius and r_base > 0.001:
                    scale = self.safe_radius / r_base
                    x = self.safe_x + (x - self.safe_x) * scale
                    y = self.safe_y + (y - self.safe_y) * scale
                    
                # Exakte Look-At Logik auf (obj_x, obj_y, 0)
                dx = obj_x - x
                dy = obj_y - y
                dz = 0.0 - z
                
                # Kompensation der Z-Rotation (yaw), damit Roll/Pitch weiterhin korrekt berechnet werden
                dx_eff = dx * math.cos(yaw_angle) + dy * math.sin(yaw_angle)
                dy_eff = -dx * math.sin(yaw_angle) + dy * math.cos(yaw_angle)
                
                roll_tilt = math.atan2(dy_eff, -dz)
                pitch_tilt = math.atan2(-dx_eff, -dz)
                
                roll = math.pi + roll_tilt
                pitch = pitch_tilt
                yaw = yaw_angle
                
                waypoints.append([x, y, z, roll, pitch, yaw])
                
        def add_linear_segment(p_start, p_end, steps, is_transition=False, yaw_start=0.0, yaw_end=0.0):
            # p_start, p_end: (x, y, z)
            for i in range(steps):
                f = i / max(1, (steps - 1)) if steps > 1 else 1.0
                x = p_start[0] + (p_end[0] - p_start[0]) * f
                y = p_start[1] + (p_end[1] - p_start[1]) * f
                z = p_start[2] + (p_end[2] - p_start[2]) * f
                
                # Sicherheitsabstand
                r_base = math.hypot(x - self.safe_x, y - self.safe_y)
                if r_base < self.safe_radius and r_base > 0.001:
                    scale = self.safe_radius / r_base
                    x = self.safe_x + (x - self.safe_x) * scale
                    y = self.safe_y + (y - self.safe_y) * scale
                
                yaw = yaw_start + (yaw_end - yaw_start) * f
                
                if is_transition:
                    roll = math.pi
                    pitch = 0.0
                else:
                    dx = obj_x - x
                    dy = obj_y - y
                    dz = 0.0 - z
                    
                    dx_eff = dx * math.cos(yaw) + dy * math.sin(yaw)
                    dy_eff = -dx * math.sin(yaw) + dy * math.cos(yaw)
                    
                    roll_tilt = math.atan2(dy_eff, -dz)
                    pitch_tilt = math.atan2(-dx_eff, -dz)
                    roll = math.pi + roll_tilt
                    pitch = pitch_tilt
                
                waypoints.append([x, y, z, roll, pitch, yaw])

        c_app = (obj_x, obj_y, approach_height)
        c_scan = (obj_x, obj_y, scan_height)
        
        # 1. Anflug zum Zentrum
        if prev_obj_pos is not None:
            prev_app = (prev_obj_pos[0], prev_obj_pos[1], approach_height)
            add_linear_segment(prev_app, c_app, 15, is_transition=True)
        else:
            add_linear_segment(c_app, c_app, 1, is_transition=True)
            
        # 1.5 Nach unten fahren
        add_linear_segment(c_app, c_scan, 5, is_transition=True)

        # 2. Bogen abfahren (theta_x, theta_y)
        # X-Bogen mit Yaw=0
        add_arc_segment(0.0, max_angle, 0.0, 0.0, 6, yaw_angle=0.0) # Mitte nach X- (Zurück)
        add_arc_segment(max_angle, -max_angle, 0.0, 0.0, 12, yaw_angle=0.0) # X- nach X+ (Vor, über Mitte)
        add_arc_segment(-max_angle, 0.0, 0.0, 0.0, 6, yaw_angle=0.0) # X+ nach Mitte
        
        # 2.5 Rotation um Z-Achse um -90 Grad, damit Joint 5 den Y-Bogen übernehmen kann
        add_linear_segment(c_scan, c_scan, 5, is_transition=True, yaw_start=0.0, yaw_end=-math.pi/2.0)
        
        # Y-Bogen mit Yaw=-90
        add_arc_segment(0.0, 0.0, 0.0, max_angle, 6, yaw_angle=-math.pi/2.0) # Mitte nach Y- (Rechts)
        add_arc_segment(0.0, 0.0, max_angle, -max_angle, 12, yaw_angle=-math.pi/2.0) # Y- nach Y+ (Links, über Mitte)
        add_arc_segment(0.0, 0.0, -max_angle, 0.0, 6, yaw_angle=-math.pi/2.0) # Y+ nach Mitte

        # 2.6 Rotation zurück auf Yaw=0
        add_linear_segment(c_scan, c_scan, 5, is_transition=True, yaw_start=-math.pi/2.0, yaw_end=0.0)

        # 3. Wieder nach oben fahren
        add_linear_segment(c_scan, c_app, 5, is_transition=True)
        
        return waypoints

    def execute_scan_path_cb(self, request, response):
        rejection = self._estop_rejection()
        if rejection:
            response.success = False
            response.message = rejection
            return response
        if not self._begin_execution():
            response.success = False
            response.message = "System is already executing a move."
            return response

        self._reset_hardware_state()
        self.stop_requested = False
        self.ui_log('Generating 3D Wave Scan Path...', 'info')
        # Parameter: X: 250 bis 360mm, Y: -150 bis 150mm, Z wippt zwischen 100mm und 200mm
        # base_z von 250 auf 150 reduziert, damit die Kamera extrem nah (10-20cm) ueber die 
        # Objekte (Cube, Cylinder etc.) fliegt, was eine perfekte Octomap/Punktewolke generiert.
        waypoints = self.generate_wave_trajectory(min_x=0.250, max_x=0.360, min_y=-0.150, max_y=0.150, base_z=0.150, z_amplitude=0.050)
        
        if self.stop_requested:
            self.is_executing = False
            return response
            
        self.ui_log(f'{len(waypoints)} waypoints generated. Starting IK resolution.', 'success')
        
        def _task():
            try:
                from geometry_msgs.msg import PoseStamped
                from moveit_msgs.msg import RobotState
                from sensor_msgs.msg import JointState

                # Zuerst lesen wir den aktuellen Zustand aus, um den ersten Seed zu haben
                # Wir verwenden einfach den ersten Punkt und loesen ihn ohne Seed (oder mit aktueller Roboterpose)
                current_seed_joints = None
                
                trajectory_points = []
                
                for i, wp in enumerate(waypoints):
                    target_x, target_y, target_z, target_r, target_p, target_yaw = wp
                    
                    target_rot = R.from_euler('xyz', [target_r, target_p, target_yaw], degrees=False)
                    q = target_rot.as_quat()
                    
                    ik_req = GetPositionIK.Request()
                    ik_req.ik_request.group_name = "lite6"
                    ik_req.ik_request.pose_stamped = PoseStamped()
                    ik_req.ik_request.pose_stamped.header.frame_id = "link_base"
                    ik_req.ik_request.pose_stamped.pose.position.x = float(target_x)
                    ik_req.ik_request.pose_stamped.pose.position.y = float(target_y)
                    ik_req.ik_request.pose_stamped.pose.position.z = float(target_z)
                    ik_req.ik_request.pose_stamped.pose.orientation.x = float(q[0])
                    ik_req.ik_request.pose_stamped.pose.orientation.y = float(q[1])
                    ik_req.ik_request.pose_stamped.pose.orientation.z = float(q[2])
                    ik_req.ik_request.pose_stamped.pose.orientation.w = float(q[3])
                    ik_req.ik_request.timeout.sec = 1
                    
                    # Verwende den letzten Loesungsstand als Seed für den naechsten Punkt!
                    if current_seed_joints is not None:
                        rs = RobotState()
                        js = JointState()
                        js.name = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6']
                        js.position = current_seed_joints
                        rs.joint_state = js
                        ik_req.ik_request.robot_state = rs
                    
                    if not self.ik_client.wait_for_service(timeout_sec=2.0):
                        raise Exception("IK Service /compute_ik not available!")
                        
                    future = self.ik_client.call_async(ik_req)
                    
                    start_wait = time.time()
                    while not future.done():
                        if time.time() - start_wait > 2.0:
                            raise Exception("Timeout while waiting for IK response.")
                        time.sleep(0.01)
                        
                    ik_res = future.result()
                    
                    if ik_res.error_code.val != 1:
                        raise Exception(f"IK calculation failed at waypoint {i}. Target out of reach or singularity.")
                        
                    joint_names = ik_res.solution.joint_state.name
                    positions = ik_res.solution.joint_state.position
                    
                    target_joints = [0.0] * 6
                    for j in range(1, 7):
                        j_name = f'joint{j}'
                        idx = joint_names.index(j_name)
                        target_joints[j-1] = positions[idx]
                        
                    current_seed_joints = target_joints
                    
                    if self.current_scan_speed == 0:
                        duration = 4.0 if i == 0 else 0.8
                    elif self.current_scan_speed == 2:
                        duration = 1.0 if i == 0 else 0.2
                    else:
                        duration = 2.0 if i == 0 else 0.4
                    trajectory_points.append((target_joints, duration))

                self.ui_log('All IK points successfully resolved. Executing continuous wave trajectory...', 'success')
                self._go_to_joints_trajectory(trajectory_points, "Executing continuous Octomap Wave Scan...")
                
            except Exception as e:
                self.ui_log(f"Error during scan path: {e}", 'error')
            finally:
                self.is_executing = False
                
        threading.Thread(target=_task, daemon=True).start()
        
        response.success = True
        response.message = "Scan path processing started."
        return response

    def execute_object_scan_cb(self, request, response):
        rejection = self._estop_rejection()
        if rejection:
            response.success = False
            response.message = rejection
            return response
        if not self._begin_execution():
            response.success = False
            response.message = "System is already executing a move."
            return response

        self._reset_hardware_state()
        self.stop_requested = False
        
        def _task():
            try:
                from geometry_msgs.msg import PoseStamped
                from moveit_msgs.msg import RobotState
                from sensor_msgs.msg import JointState
                pass
                
                object_configs = [
                    ("Blue Cube", "target_blue_cube", (0.300, 0.082), "var(--rviz-z)"),
                    ("Red Rectangle", "target_red_rectangle", (0.219, -0.083), "var(--rviz-x)"),
                    ("Green Cylinder", "target_green_cylinder", (0.274, 0.018), "var(--rviz-y)")
                ]
                
                current_seed_joints = None
                if self.current_joint_state is not None:
                    joint_names = self.current_joint_state.name
                    positions = self.current_joint_state.position
                    current_seed_joints = [0.0] * 6
                    for j in range(1, 7):
                        j_name = f'joint{j}'
                        if j_name in joint_names:
                            current_seed_joints[j-1] = positions[joint_names.index(j_name)]
                prev_obj_pos = None

                for idx, (name, frame_id, default_pos, cvar) in enumerate(object_configs):
                    if self.stop_requested:
                        self.ui_log('Scan Loop interrupted by EMERGENCY STOP!', 'error')
                        break
                        
                    name_html = f"<span style='color: {cvar}; font-weight: 700;'>{name}</span>"
                    self.ui_log(f'Fetching Live-Position for {name_html} via TF...', 'info')
                    try:
                        t = self.tf_buffer.lookup_transform('link_base', frame_id, rclpy.time.Time())
                        obj_x = t.transform.translation.x
                        obj_y = t.transform.translation.y
                        self.ui_log(f'Live-Position {name_html}: <span style="color: var(--rviz-x);">X={obj_x:.3f}</span>, <span style="color: var(--rviz-y);">Y={obj_y:.3f}</span>', 'success')
                    except Exception:
                        self.ui_log(f'Live-Position for {name_html} not found. Using Fallback.', 'warn')
                        obj_x = default_pos[0]
                        obj_y = default_pos[1]
                        
                    obj_pos = (obj_x, obj_y)
                    self.ui_log(f'Generating Cross Scan Path for {name_html}...', 'info')
                    
                    waypoints = self.generate_single_object_trajectory(obj_pos, prev_obj_pos)
                    
                    trajectory_points = []
                    for i, wp in enumerate(waypoints):
                        target_x, target_y, target_z, target_r, target_p, target_yaw = wp
                        
                        target_rot = R.from_euler('xyz', [target_r, target_p, target_yaw], degrees=False)
                        q = target_rot.as_quat()
                        
                        ik_req = GetPositionIK.Request()
                        ik_req.ik_request.group_name = "lite6"
                        ik_req.ik_request.pose_stamped = PoseStamped()
                        ik_req.ik_request.pose_stamped.header.frame_id = "link_base"
                        ik_req.ik_request.pose_stamped.pose.position.x = float(target_x)
                        ik_req.ik_request.pose_stamped.pose.position.y = float(target_y)
                        ik_req.ik_request.pose_stamped.pose.position.z = float(target_z)
                        ik_req.ik_request.pose_stamped.pose.orientation.x = float(q[0])
                        ik_req.ik_request.pose_stamped.pose.orientation.y = float(q[1])
                        ik_req.ik_request.pose_stamped.pose.orientation.z = float(q[2])
                        ik_req.ik_request.pose_stamped.pose.orientation.w = float(q[3])
                        ik_req.ik_request.timeout.sec = 1
                        
                        if current_seed_joints is not None:
                            rs = RobotState()
                            js = JointState()
                            js.name = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6']
                            js.position = current_seed_joints
                            rs.joint_state = js
                            ik_req.ik_request.robot_state = rs
                        
                        if not self.ik_client.wait_for_service(timeout_sec=2.0):
                            raise Exception("IK Service /compute_ik not available!")
                            
                        future = self.ik_client.call_async(ik_req)
                        
                        start_wait = time.time()
                        while not future.done():
                            if time.time() - start_wait > 2.0:
                                raise Exception("Timeout while waiting for IK response.")
                            time.sleep(0.01)
                            
                        ik_res = future.result()
                        
                        if ik_res.error_code.val != 1:
                            raise Exception(f"IK calculation failed at waypoint {i}. Target out of reach or singularity.")
                            
                        joint_names = ik_res.solution.joint_state.name
                        positions = ik_res.solution.joint_state.position
                        
                        target_joints = [0.0] * 6
                        for j in range(1, 7):
                            j_name = f'joint{j}'
                            idx = joint_names.index(j_name)
                            angle = positions[idx]
                            
                            # Unwrap joint angles to prevent 360 spins!
                            if current_seed_joints is not None:
                                prev_angle = current_seed_joints[j-1]
                                diff = angle - prev_angle
                                while diff > math.pi:
                                    angle -= 2 * math.pi
                                    diff -= 2 * math.pi
                                while diff < -math.pi:
                                    angle += 2 * math.pi
                                    diff += 2 * math.pi
                                    
                            target_joints[j-1] = angle
                            
                        current_seed_joints = target_joints
                        
                        if self.current_scan_speed == 0:
                            duration = 4.0 if i == 0 else 0.5
                        elif self.current_scan_speed == 2:
                            duration = 1.0 if i == 0 else 0.15
                        else:
                            duration = 2.0 if i == 0 else 0.25
                        trajectory_points.append((target_joints, duration))

                    if self.stop_requested:
                        self.ui_log('Scan Loop interrupted by EMERGENCY STOP before execution!', 'error')
                        break

                    self.ui_log(f'Executing Scan for {name_html}...', 'action')
                    self._go_to_joints_trajectory(trajectory_points, f"Executing Cross Scan for {name_html}...")
                    
                    prev_obj_pos = obj_pos

                # Am Ende zurueck zur Initial Pose
                if not self.stop_requested:
                    init_html = "<span style='color: var(--orange); font-weight: 700;'>Initial Pose</span>"
                    self._go_to_joints([0.0, 0.4244, 0.5627, 0.0, 0.1383, 0.0], f"Returning to {init_html}...")
                
            except Exception as e:
                self.ui_log(f"Error during scan path: {e}", 'error')
            finally:
                self.is_executing = False
                
        threading.Thread(target=_task, daemon=True).start()
        
        response.success = True
        response.message = "Object Scan processing started."
        return response

    def execute_move_to_pose_silent_cb(self, request, response):
        return self.execute_move_to_pose_cb(request, response, announce=False)

    def execute_move_to_pose_cb(self, request, response, announce=True):
        rejection = self._estop_rejection()
        if rejection:
            response.ret = -1
            response.message = rejection
            return response
        if not self._begin_execution():
            response.ret = -1
            response.message = "Already executing."
            return response

        self._reset_hardware_state()
        self.stop_requested = False
        def _task():
            try:
                self._execute_move_to_pose_core(request, response, announce)
            finally:
                self.is_executing = False
                
        threading.Thread(target=_task, daemon=True).start()
        
        response.ret = 0
        response.message = "Move to pose started."
        return response

    def _execute_move_to_pose_core(self, request, response, announce=True):
        try:
            from geometry_msgs.msg import PoseStamped
            
            # Ziel-Koordinaten (Panel sendet mm, Konvertierung in m)
            target_x = request.pose[0] / 1000.0
            target_y = request.pose[1] / 1000.0
            target_z = request.pose[2] / 1000.0
            
            target_r = request.pose[3]
            target_p = request.pose[4]
            target_yaw = request.pose[5]
            
            is_scan_pos = (abs(target_x - 0.3) < 0.001 and abs(target_y - 0.0) < 0.001 and abs(target_z - 0.4) < 0.001)
            is_hover_pos = (abs(target_z - 0.04) < 0.001)
            
            if announce and self.sound_enabled and self.sound_absolute and not is_scan_pos and not is_hover_pos:
                self.sound_absolute.play()
            
            self._moveit_begin(request.pose[:3])
            self.ui_log(f"MoveTo started: target X={request.pose[0]:.0f} Y={request.pose[1]:.0f} Z={request.pose[2]:.0f} mm", 'action')
            self.ui_log("MoveIt [1/3] Solving IK for a collision-free goal pose...", 'info')
            
            # 1. Konvertiere Euler zu Quaternion
            target_rot = R.from_euler('xyz', [target_r, target_p, target_yaw], degrees=False)
            q = target_rot.as_quat() # [x, y, z, w]
            
            # 2. Safety boundary check (Inner workspace singularity & self-collision radius)
            r_xy = (target_x**2 + target_y**2)**0.5
            if r_xy < 0.125 and target_z < 0.28:
                raise Exception(f"Ziel liegt in der inneren Singularitätszone (r={r_xy*1000:.0f} mm < 125 mm). Kollisionsgefahr mit eigenem Sockel!")

            # 3. IK Request aufbauen mit aktiver Kollisionsprüfung (avoid_collisions = True)
            ik_req = GetPositionIK.Request()
            ik_req.ik_request.group_name = "lite6"
            ik_req.ik_request.avoid_collisions = True
            ik_req.ik_request.robot_state.is_diff = True  # seed = current robot state
            ik_req.ik_request.pose_stamped = PoseStamped()
            ik_req.ik_request.pose_stamped.header.frame_id = "link_base"
            ik_req.ik_request.pose_stamped.pose.position.x = float(target_x)
            ik_req.ik_request.pose_stamped.pose.position.y = float(target_y)
            ik_req.ik_request.pose_stamped.pose.position.z = float(target_z)
            ik_req.ik_request.pose_stamped.pose.orientation.x = float(q[0])
            ik_req.ik_request.pose_stamped.pose.orientation.y = float(q[1])
            ik_req.ik_request.pose_stamped.pose.orientation.z = float(q[2])
            ik_req.ik_request.pose_stamped.pose.orientation.w = float(q[3])
            ik_req.ik_request.timeout.sec = 1
            
            # 3. Call IK Service
            if not self.ik_client.wait_for_service(timeout_sec=2.0):
                raise Exception("IK Service /compute_ik not available!")
                
            future = self.ik_client.call_async(ik_req)
            
            # Warte auf IK Antwort
            pass
            start_wait = time.time()
            while not future.done():
                if time.time() - start_wait > 2.0:
                    raise Exception("Timeout while waiting for IK response.")
                time.sleep(0.05)
                
            ik_res = future.result()
            
            if ik_res.error_code.val != 1: # 1 == SUCCESS
                raise Exception(f"IK calculation failed (Error Code: {ik_res.error_code.val}). Target out of reach or in collision.")
                
            # 4. Extrahiere Gelenkwinkel
            joint_names = ik_res.solution.joint_state.name
            positions = ik_res.solution.joint_state.position
            
            # Sicherstellen, dass die Reihenfolge joint1...joint6 ist
            target_joints = [0.0] * 6
            for i in range(1, 7):
                j_name = f'joint{i}'
                if j_name in joint_names:
                    idx = joint_names.index(j_name)
                    target_joints[i-1] = positions[idx]
                else:
                    raise Exception(f"Joint {j_name} not found in IK solution!")
                    
            self._moveit_mark('t_ik')

            # 5. Plan and execute a collision-free path
            self._plan_and_execute_joints(target_joints)

            run = self._moveit_finish('succeeded')
            self.ui_log(f"MoveTo target reached ({self._moveit_timing_text(run)}).", 'success')
            response.ret = 0
            response.message = "Success"
            
        except Exception as e:
            aborted = self.stop_requested
            run = self._moveit_finish('aborted' if aborted else 'failed', message=str(e))
            phase_names = {'ik': 'IK', 'preparing': 'setup', 'planning': 'planning', 'executing': 'execution'}
            failed_phase = run.get('failed_phase') if run else None
            where = f" during {phase_names.get(failed_phase, failed_phase)}" if failed_phase else ""
            elapsed = f" after {run['elapsed']:.1f} s" if run else ""
            self.ui_log(f"MoveTo {'aborted' if aborted else 'failed'}{where}{elapsed}: {e}", 'error')
            response.ret = -1
            response.message = str(e)
            
        return response

    _MOVEIT_ERROR_TEXT = {
        MoveItErrorCodes.PLANNING_FAILED: 'no collision-free path found',
        MoveItErrorCodes.INVALID_MOTION_PLAN: 'no valid path - every candidate path failed collision validation',
        MoveItErrorCodes.MOTION_PLAN_INVALIDATED_BY_ENVIRONMENT_CHANGE: 'path blocked by a changed scene',
        MoveItErrorCodes.CONTROL_FAILED: 'controller failed to execute the path',
        MoveItErrorCodes.TIMED_OUT: 'planning timed out',
        MoveItErrorCodes.PREEMPTED: 'motion was preempted',
        MoveItErrorCodes.START_STATE_IN_COLLISION: 'robot is already in collision at its current pose',
        MoveItErrorCodes.GOAL_IN_COLLISION: 'target pose is in collision',
        MoveItErrorCodes.GOAL_CONSTRAINTS_VIOLATED: 'target not reached within tolerance',
        MoveItErrorCodes.NO_IK_SOLUTION: 'no IK solution',
    }

    @staticmethod
    def _cancel_when_accepted(send_future):
        goal_handle = send_future.result()
        if goal_handle is not None and goal_handle.accepted:
            goal_handle.cancel_goal_async()

    def _plan_and_execute_joints(self, target_joints):
        """Plan a collision-free path to target_joints with move_group and execute it.

        If move_group is unreachable there is deliberately NO fallback to the
        direct, unchecked joint motion.
        """
        if not self.move_group_client.wait_for_server(timeout_sec=2.0):
            raise Exception("MoveGroup action /move_action not available - motion aborted (no unchecked fallback).")

        speed_idx = min(max(int(self.current_scan_speed), 0), 2)
        vel_scaling = self.get_parameter('moveto_velocity_scaling').value
        acc_scaling = self.get_parameter('moveto_acceleration_scaling').value
        planning_time = float(self.get_parameter('moveto_planning_time').value)

        req = MotionPlanRequest()
        req.group_name = 'lite6'
        req.num_planning_attempts = int(self.get_parameter('moveto_planning_attempts').value)
        req.allowed_planning_time = planning_time
        req.max_velocity_scaling_factor = float(vel_scaling[speed_idx])
        req.max_acceleration_scaling_factor = float(acc_scaling[speed_idx])

        goal = Constraints()
        for i, position in enumerate(target_joints):
            jc = JointConstraint()
            jc.joint_name = f'joint{i + 1}'
            jc.position = float(position)
            jc.tolerance_above = 0.001
            jc.tolerance_below = 0.001
            jc.weight = 1.0
            goal.joint_constraints.append(jc)
        req.goal_constraints.append(goal)

        goal_msg = MoveGroup.Goal()
        goal_msg.request = req
        goal_msg.planning_options.plan_only = False  # planen UND ausfuehren
        goal_msg.planning_options.look_around = False
        goal_msg.planning_options.replan = True
        goal_msg.planning_options.replan_attempts = 3
        goal_msg.planning_options.replan_delay = 0.1

        # Servo and move_group must not command the trajectory controller at the same time.
        self._moveit_phase('preparing')
        self._pause_servo('MoveIt Servo paused for the planned MoveTo motion.')
        try:
            if self.stop_requested:
                raise Exception("aborted by EMERGENCY STOP.")

            speed_label = ('Slow', 'Normal', 'Fast')[speed_idx]
            self._moveit_phase('planning', planning_budget=planning_time,
                               speed=speed_label, velocity_scaling=req.max_velocity_scaling_factor)
            self.ui_log(f"MoveIt [2/3] Planning a collision-free path (budget {planning_time:.1f} s, "
                        f"speed {speed_label} x{req.max_velocity_scaling_factor:.2f})...", 'info')
            # move_group (Humble) may acknowledge the goal only after planning
            # AND execution. A short timeout on the acceptance would report
            # MoveTo as failed while the arm keeps moving - hence only one
            # generous deadline for the whole sequence.
            deadline = time.time() + float(self.get_parameter('moveto_timeout').value)
            send_future = self.move_group_client.send_goal_async(goal_msg)
            while not send_future.done():
                if self.stop_requested or time.time() > deadline:
                    send_future.add_done_callback(self._cancel_when_accepted)
                    raise Exception("Movement interrupted by EMERGENCY STOP!" if self.stop_requested
                                    else "Timeout waiting for move_group.")
                time.sleep(0.05)

            goal_handle = send_future.result()
            if not goal_handle.accepted:
                raise Exception("move_group rejected the MoveTo goal.")
            self._move_goal_handle = goal_handle

            result_future = goal_handle.get_result_async()
            while not result_future.done():
                if self.stop_requested or time.time() > deadline:
                    goal_handle.cancel_goal_async()
                    raise Exception("Movement interrupted by EMERGENCY STOP!" if self.stop_requested
                                    else "Timeout waiting for move_group.")
                time.sleep(0.05)

            code = result_future.result().result.error_code.val
            if code != MoveItErrorCodes.SUCCESS:
                reason = self._MOVEIT_ERROR_TEXT.get(code, 'MoveIt error')
                raise Exception(f"{reason} (MoveIt error code {code}).")
        finally:
            self._move_goal_handle = None
            self._resume_servo()


    # ── MoveIt progress reporting (UI popup + log) ─────────────────────────
    def _moveit_begin(self, target_mm):
        now = time.time()
        with self._moveit_lock:
            self._moveit_seq += 1
            self._moveit_run = {
                'seq': self._moveit_seq,
                'target': [round(float(v), 1) for v in target_mm],
                't0': now,
                'phase_t0': now,
            }
        self._moveit_phase('ik')

    def _moveit_publish(self, run):
        msg = {k: v for k, v in run.items() if k not in ('t0', 'phase_t0')}
        msg['elapsed'] = round(time.time() - run['t0'], 3)
        msg['phase_elapsed'] = round(time.time() - run['phase_t0'], 3)
        self.moveit_state_pub.publish(String(data=json.dumps(msg)))

    def _moveit_phase(self, phase, **info):
        with self._moveit_lock:
            run = self._moveit_run
            if run is None:
                return
            run.update(info)
            run['phase'] = phase
            run['phase_t0'] = time.time()
            self._moveit_publish(run)

    def _moveit_mark(self, key):
        """Store the duration of the phase that just ended (e.g. t_ik)."""
        with self._moveit_lock:
            run = self._moveit_run
            if run is not None:
                run[key] = round(time.time() - run['phase_t0'], 3)

    def _moveit_finish(self, outcome, message=''):
        """Publish the final state and return a copy of the run (None if none was active)."""
        with self._moveit_lock:
            run = self._moveit_run
            if run is None:
                return None
            now = time.time()
            if outcome == 'succeeded':
                if run.get('phase') == 'executing':
                    run['t_exec'] = round(now - run['phase_t0'], 3)
                elif run.get('phase') == 'planning':
                    # No /display_planned_path seen: planning and execution cannot be told apart.
                    run['t_plan_exec'] = round(now - run['phase_t0'], 3)
            else:
                run['failed_phase'] = run.get('phase')
                if run.get('phase') == 'planning':
                    run['t_plan'] = round(now - run['phase_t0'], 3)
            run['message'] = message
            run['phase'] = outcome
            run['phase_t0'] = now
            self._moveit_publish(run)
            result = dict(run)
            result['elapsed'] = round(now - run['t0'], 3)
            self._moveit_run = None
            return result

    @staticmethod
    def _moveit_timing_text(run):
        if not run:
            return 'no timing'
        parts = []
        if 't_ik' in run:
            parts.append(f"IK {run['t_ik']:.2f} s")
        if 't_plan' in run:
            parts.append(f"planning {run['t_plan']:.2f} s")
        if 't_exec' in run:
            parts.append(f"execution {run['t_exec']:.2f} s")
        if 't_plan_exec' in run:
            parts.append(f"planning + execution {run['t_plan_exec']:.2f} s")
        parts.append(f"total {run['elapsed']:.2f} s")
        return ', '.join(parts)

    def _planned_path_cb(self, msg):
        """move_group computed a candidate path (it may still fail validation)."""
        if not msg.trajectory:
            return
        points = msg.trajectory[-1].joint_trajectory.points
        expected = 0.0
        if points:
            t = points[-1].time_from_start
            expected = t.sec + t.nanosec * 1e-9
        with self._moveit_lock:
            run = self._moveit_run
            if run is None or run.get('phase') not in ('planning', 'executing'):
                return
            run['attempt'] = run.get('attempt', 0) + 1
            run['waypoints'] = len(points)
            run['exec_expected'] = round(expected, 3)
            attempt = run['attempt']
            phase = run['phase']
            if phase == 'planning':
                self._moveit_publish(run)
        if phase == 'planning' and attempt > 1:
            self.ui_log(f"MoveIt: previous path failed validation - new candidate path found "
                        f"(attempt {attempt}, {len(points)} waypoint{'s' if len(points) != 1 else ''}).", 'warn')

    def _controller_status_cb(self, msg):
        """A new controller goal switching to EXECUTING = move_group starts moving the arm."""
        started = False
        for status in msg.status_list:
            if status.status != GoalStatus.STATUS_EXECUTING:
                continue
            goal_id = bytes(status.goal_info.goal_id.uuid)
            if goal_id in self._controller_goals_seen:
                continue
            self._controller_goals_seen.add(goal_id)
            started = True
        if len(self._controller_goals_seen) > 200:
            self._controller_goals_seen.clear()
        if not started:
            return

        with self._moveit_lock:
            run = self._moveit_run
            if run is None or run.get('phase') not in ('planning', 'executing'):
                return
            replanned = run['phase'] == 'executing'
            if replanned:
                run['replans'] = run.get('replans', 0) + 1
            else:
                run['t_plan'] = round(time.time() - run['phase_t0'], 3)
            run['phase'] = 'executing'
            run['phase_t0'] = time.time()
            t_plan = run.get('t_plan', 0.0)
            waypoints = run.get('waypoints')
            expected = run.get('exec_expected')
            self._moveit_publish(run)

        path_info = (f"{waypoints} waypoint{'s' if waypoints != 1 else ''}, est. {expected:.1f} s"
                     if waypoints else "path details unavailable")
        if replanned:
            self.ui_log(f"MoveIt replanned during execution ({path_info}) - executing the new path.", 'warn')
        else:
            self.ui_log(f"MoveIt [3/3] Collision-free path found in {t_plan:.2f} s ({path_info}) - executing.", 'info')

def main(args=None):
    rclpy.init(args=args)
    node = RobotMotionHandlerMovegroup()
    executor = MultiThreadedExecutor(num_threads=16)
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