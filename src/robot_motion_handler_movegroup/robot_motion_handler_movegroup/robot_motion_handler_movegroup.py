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
from std_msgs.msg import Bool, String
from std_srvs.srv import SetBool, Trigger
from xarm_msgs.srv import MoveCartesian, MoveJoint
from moveit_msgs.srv import GetCartesianPath, GetPositionFK, GetPositionIK
from moveit_msgs.action import ExecuteTrajectory, MoveGroup
from moveit_msgs.msg import Constraints, DisplayTrajectory, JointConstraint, MotionPlanRequest, MoveItErrorCodes
from visualization_msgs.msg import Marker, MarkerArray
import math
import numpy as np
from scipy.spatial.transform import Rotation as R
from rclpy.callback_groups import ReentrantCallbackGroup, MutuallyExclusiveCallbackGroup
from rclpy.executors import MultiThreadedExecutor

class PreviewDiscarded(Exception):
    """Die Pfad-Vorschau wurde verworfen (Nutzer oder Timeout) - kein Fehler."""


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
        
        # Die Sprachansagen (Initial Pose, Absolute Pose) spielt die Robot
        # Control UI im Browser ab - so hoert man sie auf jedem PC, auf dem die
        # UI offen ist, nicht nur am Lautsprecher dieses Nodes.

        self.publisher_ = self.create_publisher(
            JointTrajectory, 
            '/lite6_traj_controller/joint_trajectory', 
            10
        )
        
        self.ui_log_pub = self.create_publisher(String, '/ui/motion_status', 10)
        
        self.ik_client = self.create_client(GetPositionIK, '/compute_ik', callback_group=self.cb_group)
        self.fk_client = self.create_client(GetPositionFK, '/compute_fk', callback_group=self.cb_group)
        self.cartesian_client = self.create_client(GetCartesianPath, '/compute_cartesian_path',
                                                   callback_group=self.cb_group)
        # Anfahrt von oben: erst kollisionsfrei auf eine Vorposition ueber dem
        # Ziel, dann geradlinig senkrecht nach unten.
        self.declare_parameter('approach_pre_height', 0.07)        # m ueber der Endpose
        self.declare_parameter('approach_descent_scaling', 0.15)   # Tempo des Absenkens

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

        # Pfad-Vorschau: Ist sie an, plant MoveTo nur (plan_only), schickt den
        # Pfad an die Robot Control UI (Geisterroboter im Digital Twin) und
        # faehrt ihn erst nach Bestaetigung ueber /execute_trajectory ab.
        # Geschaltet wird ueber /ui/set_moveto_preview, der Zustand ist latched.
        self.execute_traj_client = ActionClient(
            self, ExecuteTrajectory, '/execute_trajectory', callback_group=self.cb_group)
        self.declare_parameter('moveto_preview', False)
        self.declare_parameter('moveto_preview_timeout', 60.0)  # s bis zum automatischen Verwerfen
        self.preview_enabled = bool(self.get_parameter('moveto_preview').value)
        self._preview_event = threading.Event()
        self._preview_decision = None
        self._preview_waiting = False
        preview_qos = QoSProfile(depth=1, durability=DurabilityPolicy.TRANSIENT_LOCAL)
        self.preview_enabled_pub = self.create_publisher(Bool, '/ui/moveto_preview_enabled', preview_qos)
        # Latched, damit ein Reload der UI einen wartenden Pfad wieder anzeigt.
        self.preview_path_pub = self.create_publisher(String, '/ui/moveto_preview_path', preview_qos)
        self.create_service(SetBool, '/ui/set_moveto_preview', self.set_moveto_preview_cb,
                            callback_group=self.cb_group)
        self.create_service(SetBool, '/ui/confirm_moveto_preview', self.confirm_moveto_preview_cb,
                            callback_group=self.cb_group)
        self.preview_enabled_pub.publish(Bool(data=self.preview_enabled))
        self.preview_path_pub.publish(String(data=json.dumps({'clear': True})))

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
        # Alias fuer den Viewport-TCP-Gizmo. Frueher ohne Sprachansage; seit die
        # Ansage im Browser liegt, verhalten sich beide Services gleich.
        self.move_silent_srv = self.create_service(
            MoveCartesian,
            '/ui/execute_move_to_pose_silent',
            self.execute_move_to_pose_silent_cb,
            callback_group=self.cb_group
        )
        # Anfahrt eines erkannten Objekts von oben (Klick auf die Greifkugel).
        # pose = Endpose in mm/rad; der Arm faehrt erst auf eine Vorposition
        # darueber und senkt sich dann geradlinig ab.
        self.approach_srv = self.create_service(
            MoveCartesian,
            '/ui/approach_from_above',
            self.approach_from_above_cb,
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
        latched_qos = QoSProfile(depth=1, durability=DurabilityPolicy.TRANSIENT_LOCAL)
        self.estop_state_pub = self.create_publisher(Bool, '/ui/emergency_stop_active', latched_qos)

        self.ui_log('Universal Control Services (/ui/execute_initial_pose, /ui/execute_move_to_pose[_silent], /ui/approach_from_above, /ui/start_octomap_scan, /ui/start_object_scan, /ui/execute_move_joint, /ui/emergency_stop, /ui/reset_emergency_stop) ready.', 'success')
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

        # Rote Greifkugeln der Object Detection (/zed/bboxes_3d, Frame "world").
        # id -> {'pos': (x, y, z), 'name': str, 't': Empfangszeit}; der Objekt-Scan
        # faehrt um diese Punkte statt um feste Objektpositionen.
        self._grasp_spheres = {}
        self._grasp_lock = threading.Lock()
        self.create_subscription(MarkerArray, '/zed/bboxes_3d', self._bboxes_cb, 10,
                                 callback_group=self.cb_group)
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

    def set_moveto_preview_cb(self, request, response):
        self.preview_enabled = bool(request.data)
        self.preview_enabled_pub.publish(Bool(data=self.preview_enabled))
        response.success = True
        response.message = f"MoveTo path preview {'enabled' if self.preview_enabled else 'disabled'}"
        self.ui_log(response.message + ('' if self.preview_enabled else
                    ' - MoveTo executes planned paths without confirmation.'), 'info')
        return response

    def confirm_moveto_preview_cb(self, request, response):
        if not self._preview_waiting:
            response.success = False
            response.message = 'No planned path is waiting for confirmation.'
            return response
        self._preview_decision = bool(request.data)
        self._preview_event.set()
        response.success = True
        response.message = 'Path confirmed - executing.' if request.data else 'Path discarded.'
        return response

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

        def _task():
            try:
                if self.preview_enabled:
                    # Pfad-Vorschau an: wie MoveTo planen, als Geist zeigen und
                    # erst nach Bestaetigung fahren.
                    self._execute_joint_goal_core(self.INITIAL_JOINTS, 'Initial Pose')
                    return
                # --- DIRECT MOVE TO INITIAL POSE ---
                self._go_to_joints(self.INITIAL_JOINTS, "Moving to Initial Pose...")
                    
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

    GRASP_SPHERE_NS = 'yolo_object_grasp_center_point'
    GRASP_SPHERE_MAX_AGE = 2.5   # s - die Marker leben 2 s

    def _bboxes_cb(self, msg):
        now = time.time()
        with self._grasp_lock:
            for m in msg.markers:
                if m.action == Marker.DELETEALL:
                    self._grasp_spheres.clear()
                    continue
                if m.ns == self.GRASP_SPHERE_NS:
                    if m.action == Marker.DELETE:
                        self._grasp_spheres.pop(m.id, None)
                    elif m.header.frame_id == 'world':
                        rec = self._grasp_spheres.setdefault(m.id, {'name': f'object {m.id}'})
                        p = m.pose.position
                        rec['pos'] = (p.x, p.y, p.z)
                        rec['t'] = now
                elif m.ns == 'yolo_labels_class' and m.action == Marker.ADD:
                    rec = self._grasp_spheres.get(m.id)
                    if rec is not None and m.text:
                        rec['name'] = m.text.replace('_', ' ')

    def _detected_scan_targets(self):
        """Aktuelle Greifkugeln in link_base, als kurzer Rundweg ab dem TCP geordnet."""
        now = time.time()
        with self._grasp_lock:
            fresh = [(r['name'], r['pos']) for r in self._grasp_spheres.values()
                     if 'pos' in r and now - r.get('t', 0) <= self.GRASP_SPHERE_MAX_AGE]
        if not fresh:
            return []
        tf = self.tf_buffer.lookup_transform('link_base', 'world', rclpy.time.Time())
        rot = R.from_quat([tf.transform.rotation.x, tf.transform.rotation.y,
                           tf.transform.rotation.z, tf.transform.rotation.w])
        off = np.array([tf.transform.translation.x, tf.transform.translation.y, tf.transform.translation.z])
        targets = [(name, tuple(rot.apply(np.array(pos)) + off)) for name, pos in fresh]

        # Naechster-Nachbar-Reihenfolge ab der aktuellen TCP-Position
        try:
            t_tcp = self.tf_buffer.lookup_transform('link_base', 'link_tcp', rclpy.time.Time())
            cur = (t_tcp.transform.translation.x, t_tcp.transform.translation.y)
        except Exception:
            cur = (0.0, 0.0)
        ordered = []
        while targets:
            k = min(range(len(targets)),
                    key=lambda i: math.hypot(targets[i][1][0] - cur[0], targets[i][1][1] - cur[1]))
            name, pos = targets.pop(k)
            ordered.append((name, pos))
            cur = (pos[0], pos[1])
        return ordered

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
        self.ui_log('EMERGENCY STOP TRIGGERED!', 'error')

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

    def generate_single_object_trajectory(self, obj_pos, prev_obj_pos=None, cross_size=0.08, approach_height=0.20, scan_height=0.14, center_z=0.0, prev_center_z=None):
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
                z = center_z + R * math.cos(active_theta)
                
                # Sicherheitsabstand zur anpassbaren Safety Zone
                r_base = math.hypot(x - self.safe_x, y - self.safe_y)
                if r_base < self.safe_radius and r_base > 0.001:
                    scale = self.safe_radius / r_base
                    x = self.safe_x + (x - self.safe_x) * scale
                    y = self.safe_y + (y - self.safe_y) * scale
                    
                # Exakte Look-At Logik auf (obj_x, obj_y, center_z)
                dx = obj_x - x
                dy = obj_y - y
                dz = center_z - z
                
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
                    dz = center_z - z
                    
                    dx_eff = dx * math.cos(yaw) + dy * math.sin(yaw)
                    dy_eff = -dx * math.sin(yaw) + dy * math.cos(yaw)
                    
                    roll_tilt = math.atan2(dy_eff, -dz)
                    pitch_tilt = math.atan2(-dx_eff, -dz)
                    roll = math.pi + roll_tilt
                    pitch = pitch_tilt
                
                waypoints.append([x, y, z, roll, pitch, yaw])

        c_app = (obj_x, obj_y, center_z + approach_height)
        c_scan = (obj_x, obj_y, center_z + scan_height)
        
        # 1. Anflug zum Zentrum
        if prev_obj_pos is not None:
            pz = center_z if prev_center_z is None else prev_center_z
            prev_app = (prev_obj_pos[0], prev_obj_pos[1], pz + approach_height)
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
        # Gescannt wird um die roten Greifkugeln der Object Detection. Momentaufnahme
        # beim Start: waehrend der Arm faehrt, verdeckt er Objekte vor der Kamera.
        try:
            scan_targets = self._detected_scan_targets()
        except Exception as e:
            response.success = False
            response.message = f"No TF link_base <- world for the detected objects: {e}"
            self.ui_log(f'Object scan: {response.message}', 'error')
            return response
        if not scan_targets:
            response.success = False
            response.message = "No detected objects (red grasp spheres) - nothing to scan."
            self.ui_log(f'Object scan: {response.message}', 'warn')
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
                
                current_seed_joints = None
                if self.current_joint_state is not None:
                    joint_names = self.current_joint_state.name
                    positions = self.current_joint_state.position
                    current_seed_joints = [0.0] * 6
                    for j in range(1, 7):
                        j_name = f'joint{j}'
                        if j_name in joint_names:
                            current_seed_joints[j-1] = positions[joint_names.index(j_name)]
                self.ui_log(f'Object scan: {len(scan_targets)} detected object(s) - '
                            + ', '.join(f'"{n}"' for n, _ in scan_targets), 'info')
                # Erst alle Bahnen berechnen, dann (mit Pfad-Vorschau nach
                # Bestaetigung) abfahren.
                preview = self.preview_enabled
                plans = []
                prev_obj_pos = None
                prev_center_z = None
                for idx, (name, (obj_x, obj_y, obj_z)) in enumerate(scan_targets):
                    if self.stop_requested:
                        self.ui_log('Scan Loop interrupted by EMERGENCY STOP!', 'error')
                        break
                    name_html = f'"{name}"'
                    self.ui_log(f'Grasp sphere {name_html}: X={obj_x*1000:.0f} Y={obj_y*1000:.0f} '
                                f'Z={obj_z*1000:.0f} mm (link_base)', 'info')
                    obj_pos = (obj_x, obj_y)
                    self.ui_log(f'Generating Cross Scan Path around {name_html}...', 'info')
                    waypoints = self.generate_single_object_trajectory(
                        obj_pos, prev_obj_pos, center_z=obj_z, prev_center_z=prev_center_z)
                    
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

                    plans.append((name_html, trajectory_points))
                    prev_obj_pos = obj_pos
                    prev_center_z = obj_z

                if self.stop_requested:
                    self.ui_log('Scan Loop interrupted by EMERGENCY STOP before execution!', 'error')
                    return

                if preview:
                    first = scan_targets[0][1]
                    self._moveit_begin([first[0] * 1000.0, first[1] * 1000.0, first[2] * 1000.0])
                    self._moveit_mark('t_ik')
                    all_points = [pt for _, pts in plans for pt in pts] + [(self.INITIAL_JOINTS, 2.0)]
                    self._confirm_preview(self._joint_points_as_robot_traj(all_points))
                    self._moveit_phase('executing',
                                       exec_expected=round(sum(d for _, d in all_points), 3))

                for name_html, trajectory_points in plans:
                    if self.stop_requested:
                        self.ui_log('Scan Loop interrupted by EMERGENCY STOP!', 'error')
                        break
                    self.ui_log(f'Executing Scan for {name_html}...', 'action')
                    self._go_to_joints_trajectory(trajectory_points, f"Executing Cross Scan for {name_html}...")

                # Am Ende zurueck zur Initial Pose
                if not self.stop_requested:
                    init_html = "Initial Pose"
                    self._go_to_joints(self.INITIAL_JOINTS, f"Returning to {init_html}...")
                if preview:
                    if self.stop_requested:
                        self._moveit_finish('aborted', message='emergency stop')
                    else:
                        run = self._moveit_finish('succeeded')
                        self.ui_log(f"Object scan finished ({self._moveit_timing_text(run)}).", 'success')

            except PreviewDiscarded as e:
                self._moveit_finish('discarded', message=str(e))
                self.ui_log(f"Object scan cancelled: {e}", 'warn')
            except Exception as e:
                self._moveit_finish('aborted' if self.stop_requested else 'failed', message=str(e))
                self.ui_log(f"Error during scan path: {e}", 'error')
            finally:
                self.is_executing = False
                
        threading.Thread(target=_task, daemon=True).start()
        
        response.success = True
        response.message = "Object Scan processing started."
        return response

    def execute_move_to_pose_silent_cb(self, request, response):
        return self.execute_move_to_pose_cb(request, response)

    def execute_move_to_pose_cb(self, request, response):
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
                self._execute_move_to_pose_core(request, response)
            finally:
                self.is_executing = False
                
        threading.Thread(target=_task, daemon=True).start()
        
        response.ret = 0
        response.message = "Move to pose started."
        return response

    def approach_from_above_cb(self, request, response):
        rejection = self._estop_rejection()
        if rejection:
            response.ret = -1
            response.message = rejection
            return response
        if len(request.pose) < 6:
            response.ret = -1
            response.message = "pose needs 6 values (x, y, z in mm, roll, pitch, yaw in rad)."
            return response
        if not self._begin_execution():
            response.ret = -1
            response.message = "Already executing."
            return response

        self._reset_hardware_state()
        self.stop_requested = False
        pose = [float(v) for v in request.pose[:6]]

        def _task():
            try:
                self._execute_approach_core(pose)
            finally:
                self.is_executing = False

        threading.Thread(target=_task, daemon=True).start()
        response.ret = 0
        response.message = "Approach from above started."
        return response

    def _pose_stamped_mm(self, pose_mm):
        from geometry_msgs.msg import PoseStamped
        q = R.from_euler('xyz', pose_mm[3:6], degrees=False).as_quat()  # [x, y, z, w]
        ps = PoseStamped()
        ps.header.frame_id = "link_base"
        ps.pose.position.x = pose_mm[0] / 1000.0
        ps.pose.position.y = pose_mm[1] / 1000.0
        ps.pose.position.z = pose_mm[2] / 1000.0
        ps.pose.orientation.x = float(q[0])
        ps.pose.orientation.y = float(q[1])
        ps.pose.orientation.z = float(q[2])
        ps.pose.orientation.w = float(q[3])
        return ps

    def _execute_approach_core(self, pose_mm):
        pre_mm = list(pose_mm)
        pre_mm[2] += float(self.get_parameter('approach_pre_height').value) * 1000.0
        try:
            self._moveit_begin(pose_mm[:3])
            self.ui_log(f"Approach from above: X={pose_mm[0]:.0f} Y={pose_mm[1]:.0f} Z={pose_mm[2]:.0f} mm "
                        f"(pre-position Z={pre_mm[2]:.0f} mm, then straight down)", 'action')
            if not self.ik_client.wait_for_service(timeout_sec=2.0):
                raise Exception("IK Service /compute_ik not available!")

            # Beide Posen vorab pruefen - so faehrt der Arm gar nicht erst los,
            # wenn die Endpose unerreichbar oder in Kollision ist.
            self.ui_log("MoveIt [1/3] Solving IK for pre-position and goal...", 'info')
            pre_joints = self._solve_ik_near_current(self._pose_stamped_mm(pre_mm))
            self._call_ik_or_raise(self._pose_stamped_mm(pose_mm), pre_joints, 'goal above the object')
            self._moveit_mark('t_ik')

            # Phase 1: kollisionsfreier Pfad zur Vorposition ueber dem Objekt.
            self._plan_and_execute_joints(pre_joints)
            if self.stop_requested:
                raise Exception("Movement interrupted by EMERGENCY STOP!")

            # Phase 2: geradlinig senkrecht nach unten, kollisionsgeprueft.
            self._descend_straight(pose_mm)

            run = self._moveit_finish('succeeded')
            self.ui_log(f"Approach reached: TCP above the grasp point ({self._moveit_timing_text(run)}).", 'success')

        except PreviewDiscarded as e:
            self._moveit_finish('discarded', message=str(e))
            self.ui_log(f"Approach cancelled: {e}", 'warn')

        except Exception as e:
            aborted = self.stop_requested
            self._moveit_finish('aborted' if aborted else 'failed', message=str(e))
            self.ui_log(f"Approach {'aborted' if aborted else 'failed'}: {e}", 'error')

    def _call_ik_or_raise(self, pose, seed, what):
        sol, err = self._call_ik(pose, seed)
        if sol is None:
            raise Exception(f"IK for the {what} failed (Error Code: {err}) - out of reach or in collision.")
        return sol

    # Groesster erlaubter Gelenksprung zwischen zwei Punkten des Absenkpfads.
    # Bei 5 mm Schrittweite bewegt sich kein Gelenk annaehernd so weit - ein
    # groesserer Sprung hiesse Umklappen der Konfiguration.
    _DESCENT_MAX_JOINT_STEP = 0.3   # rad

    def _descend_straight(self, pose_mm):
        if not self.cartesian_client.wait_for_service(timeout_sec=2.0):
            raise Exception("/compute_cartesian_path not available - straight descent not possible.")
        time.sleep(0.3)   # Gelenkzustand nach Phase 1 im Planning Scene ankommen lassen

        descent_scaling = float(self.get_parameter('approach_descent_scaling').value)
        self._moveit_phase('planning', planning_budget=5.0, speed='Descent', velocity_scaling=descent_scaling)
        self.ui_log("MoveIt [2/3] Computing straight, collision-checked descent...", 'info')
        req = GetCartesianPath.Request()
        req.header.frame_id = "link_base"
        req.group_name = "lite6"
        req.link_name = "link_tcp"
        req.start_state.is_diff = True
        req.waypoints = [self._pose_stamped_mm(pose_mm).pose]
        req.max_step = 0.005
        req.jump_threshold = 0.0
        req.avoid_collisions = True
        future = self.cartesian_client.call_async(req)
        t_end = time.time() + 5.0
        while not future.done():
            if self.stop_requested:
                raise Exception("Movement interrupted by EMERGENCY STOP!")
            if time.time() > t_end:
                raise Exception("Timeout computing the straight descent.")
            time.sleep(0.02)
        res = future.result()
        if res.error_code.val != MoveItErrorCodes.SUCCESS:
            reason = self._MOVEIT_ERROR_TEXT.get(res.error_code.val, 'MoveIt error')
            raise Exception(f"straight descent not possible: {reason} (code {res.error_code.val}).")
        if res.fraction < 0.999:
            raise Exception(f"straight descent blocked after {res.fraction * 100:.0f}% "
                            "(collision or unreachable) - arm stays at the pre-position.")

        jt = res.solution.joint_trajectory
        if len(jt.points) < 2:
            return   # schon am Ziel
        for a, b in zip(jt.points, jt.points[1:]):
            if max(abs(x - y) for x, y in zip(a.positions, b.positions)) > self._DESCENT_MAX_JOINT_STEP:
                raise Exception("straight descent would flip the arm configuration - aborted.")

        self._slow_down(jt, descent_scaling)
        self._moveit_mark('t_plan')
        t = jt.points[-1].time_from_start
        self._moveit_phase('planning', waypoints=len(jt.points),
                           exec_expected=round(t.sec + t.nanosec * 1e-9, 3))

        self._pause_servo()
        try:
            if self.preview_enabled:
                self._confirm_preview(res.solution)
            self._execute_trajectory(res.solution, "MoveIt [3/3] Descending straight down onto the object.")
        finally:
            self._resume_servo()

    @staticmethod
    def _slow_down(jt, scaling):
        """Zeitstempel strecken: /compute_cartesian_path parametriert mit voller Geschwindigkeit."""
        k = 1.0 / min(max(scaling, 0.01), 1.0)
        last = jt.points[-1].time_from_start
        if last.sec == 0 and last.nanosec == 0:
            # Ohne Zeitstempel: 50 ms je 5-mm-Schritt bei voller Geschwindigkeit,
            # die Controller interpolieren dann selbst.
            for i, p in enumerate(jt.points):
                p.velocities = []
                p.accelerations = []
                t = i * 0.05
                p.time_from_start.sec = int(t)
                p.time_from_start.nanosec = int((t - int(t)) * 1e9)
        for p in jt.points:
            t = (p.time_from_start.sec + p.time_from_start.nanosec * 1e-9) * k
            p.time_from_start.sec = int(t)
            p.time_from_start.nanosec = int((t - int(t)) * 1e9)
            p.velocities = [v / k for v in p.velocities]
            p.accelerations = [a / (k * k) for a in p.accelerations]

    def _execute_move_to_pose_core(self, request, response):
        try:
            from geometry_msgs.msg import PoseStamped
            
            # Ziel-Koordinaten (Panel sendet mm, Konvertierung in m)
            target_x = request.pose[0] / 1000.0
            target_y = request.pose[1] / 1000.0
            target_z = request.pose[2] / 1000.0
            
            target_r = request.pose[3]
            target_p = request.pose[4]
            target_yaw = request.pose[5]
            
            self._moveit_begin(request.pose[:3])
            self.ui_log(f"MoveTo started: target X={request.pose[0]:.0f} Y={request.pose[1]:.0f} Z={request.pose[2]:.0f} mm", 'action')
            self.ui_log("MoveIt [1/3] Solving IK for a collision-free goal pose...", 'info')
            
            # 1. Konvertiere Euler zu Quaternion
            target_rot = R.from_euler('xyz', [target_r, target_p, target_yaw], degrees=False)
            q = target_rot.as_quat() # [x, y, z, w]
            
            # 2. Kein fester Sperrzylinder um die Achse mehr (frueher r < 125 mm
            #    bei z < 280 mm): der war deutlich groesser als der wirklich
            #    unerreichbare Bereich. Ob ein Ziel geht, entscheiden die IK mit
            #    avoid_collisions (Eigenkollision) und die Planung unten.

            # 3. IK mit Kollisionspruefung - die Loesung, die der aktuellen
            #    Stellung am naechsten liegt (siehe _solve_ik_near_current).
            if not self.ik_client.wait_for_service(timeout_sec=2.0):
                raise Exception("IK Service /compute_ik not available!")
            pose = PoseStamped()
            pose.header.frame_id = "link_base"
            pose.pose.position.x = float(target_x)
            pose.pose.position.y = float(target_y)
            pose.pose.position.z = float(target_z)
            pose.pose.orientation.x = float(q[0])
            pose.pose.orientation.y = float(q[1])
            pose.pose.orientation.z = float(q[2])
            pose.pose.orientation.w = float(q[3])
            target_joints = self._solve_ik_near_current(pose)

            self._moveit_mark('t_ik')

            # 5. Plan and execute a collision-free path
            self._plan_and_execute_joints(target_joints)

            run = self._moveit_finish('succeeded')
            self.ui_log(f"MoveTo target reached ({self._moveit_timing_text(run)}).", 'success')
            response.ret = 0
            response.message = "Success"
            
        except PreviewDiscarded as e:
            run = self._moveit_finish('discarded', message=str(e))
            self.ui_log(f"MoveTo cancelled: {e}", 'warn')
            response.ret = -1
            response.message = str(e)

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

    # Gelenke, die mehr als eine volle Umdrehung koennen (Lite 6: J1/J4/J6 +-360 Grad).
    # Fuer sie sind v und v +- 2*pi dieselbe Stellung.
    _WRAP_JOINTS = (0, 3, 5)
    _JOINT_LIMIT_WRAP = 2.0 * math.pi

    def _current_joints(self):
        js = self.current_joint_state
        if js is None:
            return None
        try:
            return [js.position[js.name.index(f'joint{i}')] for i in range(1, 7)]
        except ValueError:
            return None

    def _unwrap_near(self, sol, cur):
        """J1/J4/J6 um +-2*pi verschieben, sodass sie dem aktuellen Wert am naechsten liegen."""
        out = list(sol)
        for i in self._WRAP_JOINTS:
            cands = [sol[i] + k * 2.0 * math.pi for k in (-1, 0, 1)]
            cands = [c for c in cands if abs(c) <= self._JOINT_LIMIT_WRAP + 1e-6]
            out[i] = min(cands, key=lambda c: abs(c - cur[i]))
        return out

    def _call_ik(self, pose, seed=None):
        req = GetPositionIK.Request()
        req.ik_request.group_name = "lite6"
        req.ik_request.avoid_collisions = True
        req.ik_request.robot_state.is_diff = True  # ohne Seed: aktueller Zustand
        if seed is not None:
            req.ik_request.robot_state.joint_state.name = [f'joint{i}' for i in range(1, 7)]
            req.ik_request.robot_state.joint_state.position = [float(v) for v in seed]
        req.ik_request.pose_stamped = pose
        req.ik_request.timeout.sec = 1
        future = self.ik_client.call_async(req)
        start_wait = time.time()
        while not future.done():
            if time.time() - start_wait > 2.0:
                return None, 'timeout'
            time.sleep(0.02)
        res = future.result()
        if res.error_code.val != 1:
            return None, res.error_code.val
        names = list(res.solution.joint_state.name)
        pos = res.solution.joint_state.position
        try:
            return [pos[names.index(f'joint{i}')] for i in range(1, 7)], 1
        except ValueError:
            return None, 'joint missing'

    def _solve_ik_near_current(self, pose):
        """IK-Loesung mit der geringsten Gelenkbewegung ab der aktuellen Stellung.

        KDL liefert bei J1/J4/J6 +-360 Grad beliebige gleichwertige Loesungen
        (z. B. J4 = -2*pi oder ein umgeklappter Ellbogen) - der Arm wuerde dann
        eine volle Handgelenkdrehung oder einen Umweg fahren. Deshalb mehrere
        Seeds, darunter einer mit J1 schon in Zielrichtung, und am Ende die
        Loesung mit der kleinsten Gelenkdistanz.
        """
        cur = self._current_joints()
        seeds = [None]
        if cur is not None:
            p = pose.pose.position
            azimuth = math.atan2(p.y, p.x)
            d1 = math.atan2(math.sin(azimuth - cur[0]), math.cos(azimuth - cur[0]))
            turned = list(cur)
            turned[0] = cur[0] + d1
            turned[5] = cur[5] + d1   # Werkzeug-Yaw dreht mit J1 mit
            seeds = [turned, None, cur]
        best, best_cost, last_err = None, None, None
        for seed in seeds:
            sol, err = self._call_ik(pose, seed)
            if sol is None:
                last_err = err
                continue
            if cur is None:
                return sol
            sol = self._unwrap_near(sol, cur)
            cost = sum(abs(a - b) for a, b in zip(sol, cur))
            if best is None or cost < best_cost:
                best, best_cost = sol, cost
        if best is None:
            raise Exception(f"IK calculation failed (Error Code: {last_err}). Target out of reach or in collision.")
        return best

    INITIAL_JOINTS = [0.0, 0.4244, 0.5627, 0.0, 0.1383, 0.0]

    def _fk_tcp_mm(self, joints):
        """TCP-Position [mm] in link_base fuer eine Gelenkstellung (nur fuer die Anzeige)."""
        try:
            if not self.fk_client.wait_for_service(timeout_sec=1.0):
                return [0.0, 0.0, 0.0]
            from sensor_msgs.msg import JointState
            req = GetPositionFK.Request()
            req.header.frame_id = 'link_base'
            req.fk_link_names = ['link_tcp']
            req.robot_state.joint_state = JointState(
                name=[f'joint{i}' for i in range(1, 7)], position=[float(v) for v in joints])
            fut = self.fk_client.call_async(req)
            t_end = time.time() + 2.0
            while not fut.done() and time.time() < t_end:
                time.sleep(0.01)
            res = fut.result() if fut.done() else None
            if res is None or res.error_code.val != 1 or not res.pose_stamped:
                return [0.0, 0.0, 0.0]
            p = res.pose_stamped[0].pose.position
            return [p.x * 1000.0, p.y * 1000.0, p.z * 1000.0]
        except Exception:
            return [0.0, 0.0, 0.0]

    def _joint_points_as_robot_traj(self, points):
        """[(gelenke, dauer), ...] -> RobotTrajectory fuer die Pfad-Vorschau."""
        from moveit_msgs.msg import RobotTrajectory
        jt = JointTrajectory()
        jt.joint_names = [f'joint{i}' for i in range(1, 7)]
        t = 0.0
        for joints, duration in points:
            t += float(duration)
            pt = JointTrajectoryPoint()
            pt.positions = [float(v) for v in joints]
            pt.time_from_start = Duration(sec=int(t), nanosec=int((t - int(t)) * 1e9))
            jt.points.append(pt)
        traj = RobotTrajectory()
        traj.joint_trajectory = jt
        return traj

    def _execute_joint_goal_core(self, target_joints, label):
        """Gelenkziel ueber MoveIt anfahren - mit Pfad-Vorschau und MoveIt-Popup wie MoveTo."""
        try:
            self._moveit_begin(self._fk_tcp_mm(target_joints))
            self.ui_log(f"{label}: planning a collision-free path (path preview on)...", 'action')
            self._moveit_mark('t_ik')   # Gelenkziel - keine IK noetig
            self._plan_and_execute_joints(target_joints)
            run = self._moveit_finish('succeeded')
            self.ui_log(f"{label} reached ({self._moveit_timing_text(run)}).", 'success')
        except PreviewDiscarded as e:
            self._moveit_finish('discarded', message=str(e))
            self.ui_log(f"{label} cancelled: {e}", 'warn')
        except Exception as e:
            aborted = self.stop_requested
            self._moveit_finish('aborted' if aborted else 'failed', message=str(e))
            self.ui_log(f"{label} {'aborted' if aborted else 'failed'}: {e}", 'error')

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

        # Mit Vorschau nur planen - ausgefuehrt wird erst nach Bestaetigung.
        preview = self.preview_enabled

        goal_msg = MoveGroup.Goal()
        goal_msg.request = req
        goal_msg.planning_options.plan_only = preview
        goal_msg.planning_options.look_around = False
        goal_msg.planning_options.replan = not preview
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

            result = result_future.result().result
            code = result.error_code.val
            if code != MoveItErrorCodes.SUCCESS:
                reason = self._MOVEIT_ERROR_TEXT.get(code, 'MoveIt error')
                raise Exception(f"{reason} (MoveIt error code {code}).")
            self._move_goal_handle = None

            if preview:
                # Servo bleibt waehrend der Wartezeit pausiert: der Arm darf
                # sich nicht bewegen, sonst passt der Startzustand des Pfads
                # nicht mehr.
                self._confirm_preview(result.planned_trajectory)
                self._execute_trajectory(result.planned_trajectory)
        finally:
            self._move_goal_handle = None
            self._resume_servo()

    def _publish_preview_path(self, joint_traj):
        with self._moveit_lock:
            seq = self._moveit_run['seq'] if self._moveit_run else 0
        msg = {
            'seq': seq,
            'joint_names': list(joint_traj.joint_names),
            'points': [[round(float(v), 5) for v in p.positions] for p in joint_traj.points],
            'times': [round(p.time_from_start.sec + p.time_from_start.nanosec * 1e-9, 3)
                      for p in joint_traj.points],
        }
        self.preview_path_pub.publish(String(data=json.dumps(msg)))

    def _confirm_preview(self, robot_traj):
        """Pfad an die UI schicken und auf Ausfuehren / Verwerfen warten."""
        jt = robot_traj.joint_trajectory
        if not jt.points:
            raise Exception("MoveIt returned an empty path.")
        t = jt.points[-1].time_from_start
        expected = t.sec + t.nanosec * 1e-9
        timeout = float(self.get_parameter('moveto_preview_timeout').value)

        self._moveit_mark('t_plan')
        self._preview_decision = None
        self._preview_event.clear()
        self._preview_waiting = True
        try:
            self._publish_preview_path(jt)
            self._moveit_phase('confirm', waypoints=len(jt.points),
                               exec_expected=round(expected, 3), confirm_timeout=timeout)
            self.ui_log(f"MoveIt path preview ready ({len(jt.points)} waypoints, est. {expected:.1f} s) - "
                        f"confirm in the Robot Control UI (auto-discard after {timeout:.0f} s).", 'action')
            t_end = time.time() + timeout
            while not self._preview_event.wait(0.05):
                if self.stop_requested:
                    raise Exception("Movement interrupted by EMERGENCY STOP!")
                if time.time() > t_end:
                    raise PreviewDiscarded(f"path not confirmed within {timeout:.0f} s - discarded")
            if self.stop_requested:
                raise Exception("Movement interrupted by EMERGENCY STOP!")
            if not self._preview_decision:
                raise PreviewDiscarded("path discarded by user")
        finally:
            self._preview_waiting = False
            self.preview_path_pub.publish(String(data=json.dumps({'clear': True})))
        self._moveit_mark('t_confirm')

    def _execute_trajectory(self, robot_traj, log_msg="MoveIt [3/3] Path confirmed - executing."):
        """Den bestaetigten Pfad unveraendert ueber move_group ausfuehren."""
        if not self.execute_traj_client.wait_for_server(timeout_sec=2.0):
            raise Exception("MoveIt action /execute_trajectory not available - path not executed.")
        # preview_pending: der Controller-Start gehoert zu diesem Pfad und ist
        # KEIN Umplanen (siehe _controller_status_cb).
        self._moveit_phase('executing', preview_pending=True)
        self.ui_log(log_msg, 'info')

        goal = ExecuteTrajectory.Goal()
        goal.trajectory = robot_traj
        deadline = time.time() + float(self.get_parameter('moveto_timeout').value)
        send_future = self.execute_traj_client.send_goal_async(goal)
        while not send_future.done():
            if self.stop_requested or time.time() > deadline:
                send_future.add_done_callback(self._cancel_when_accepted)
                raise Exception("Movement interrupted by EMERGENCY STOP!" if self.stop_requested
                                else "Timeout waiting for move_group.")
            time.sleep(0.05)

        goal_handle = send_future.result()
        if not goal_handle.accepted:
            raise Exception("move_group rejected the confirmed path.")
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
        if 't_confirm' in run:
            parts.append(f"waiting for confirmation {run['t_confirm']:.1f} s")
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
            if run.get('preview_pending'):
                # Start des bestaetigten Vorschau-Pfads, kein Umplanen.
                run['preview_pending'] = False
                run['phase_t0'] = time.time()
                self._moveit_publish(run)
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