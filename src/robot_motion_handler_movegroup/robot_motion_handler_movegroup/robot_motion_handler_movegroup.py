#!/usr/bin/env python3

import time
import rclpy
from rclpy.node import Node
from trajectory_msgs.msg import JointTrajectory, JointTrajectoryPoint
from builtin_interfaces.msg import Duration
from std_srvs.srv import Trigger
from xarm_msgs.srv import MoveCartesian, MoveJoint
from moveit_msgs.srv import GetPositionIK
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
            sounds_dir = os.path.expanduser('~/dev_ws/sounds/')
            self.sound_initial = pygame.mixer.Sound(os.path.join(sounds_dir, '_voice_robot_moves_to_initial_pose.mp3'))
            self.sound_absolute = pygame.mixer.Sound(os.path.join(sounds_dir, '_voice_robot_moves_to_absolute_pose.mp3'))
        except Exception as e:
            self.get_logger().warning(f"Could not init audio: {e}")
            self.sound_initial = None
            self.sound_absolute = None


        
        self.publisher_ = self.create_publisher(
            JointTrajectory, 
            '/lite6_traj_controller/joint_trajectory', 
            10
        )
        
        from std_msgs.msg import String
        self.ui_log_pub = self.create_publisher(String, '/ui/motion_status', 10)
        
        from moveit_msgs.srv import GetPositionIK
        self.ik_client = self.create_client(GetPositionIK, '/compute_ik', callback_group=self.cb_group)
        
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
        
        from std_msgs.msg import Empty
        self.stop_sub = self.create_subscription(
            Empty, 
            '/ui/emergency_stop_topic', 
            self.emergency_stop_topic_cb,
            10,
            callback_group=self.stop_cb_group
        )
        self.ui_log('Universal Control Services (/ui/execute_initial_pose, /ui/execute_move_to_pose, /ui/start_octomap_scan, /ui/start_object_scan, /ui/execute_move_joint, /ui/emergency_stop) ready.', 'success')
        self.is_executing = False
        self.stop_requested = False
        
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
        self.safe_radius = 0.20 # 20cm default
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
        if self.servo_start_client.service_is_ready() and self.servo_stop_client.service_is_ready():
            self.startup_timer.cancel()
            self.ui_log('MoveIt Servo fully loaded. Auto-triggering initial pose in 1s...', 'success')
            pass
            time.sleep(1.0) # Give TF a moment to stabilize
            # Startup: Just move to initial pose directly
            self._go_to_joints([0.0, 0.4244, 0.5627, 0.0, 0.1383, 0.0], "Moving to Initial Pose...")

    def _reset_hardware_state(self):
        from xarm_msgs.srv import SetInt16
        req = SetInt16.Request()
        req.data = 0
        if self.ufactory_state_client.service_is_ready():
            self.ufactory_state_client.call_async(req)
        if self.xarm_state_client.service_is_ready():
            self.xarm_state_client.call_async(req)

    def execute_initial_pose_cb(self, request, response):
        if self.is_executing:
            response.success = False
            response.message = "Already executing."
            return response
            
        self._reset_hardware_state()
        self.is_executing = True
        self.stop_requested = False
        
        if self.sound_initial:
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

        import threading
        threading.Thread(target=_task).start()
        
        response.success = True
        response.message = "Initial Pose sequence started."
        return response

    def _go_to_joints(self, target_joints, log_msg="Moving to target pose..."):
        # 1. Stop MoveIt Servo
        if self.servo_stop_client.wait_for_service(timeout_sec=1.0):
            req = Trigger.Request()
            self.servo_stop_client.call_async(req)
            self.ui_log('MoveIt Servo paused for direct joint motion.', 'info')
            time.sleep(0.5) 
            
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
        if self.servo_start_client.wait_for_service(timeout_sec=1.0):
            req = Trigger.Request()
            self.servo_start_client.call_async(req)
            self.ui_log('MoveIt Servo resumed.', 'info')
            time.sleep(0.5)

    def _go_to_joints_trajectory(self, target_joint_points, log_msg="Executing trajectory..."):
        # 1. Stop MoveIt Servo
        if self.servo_stop_client.wait_for_service(timeout_sec=1.0):
            req = Trigger.Request()
            self.servo_stop_client.call_async(req)
            self.ui_log('MoveIt Servo paused for direct trajectory execution.', 'info')
            time.sleep(0.5) 
            
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
        if self.servo_start_client.wait_for_service(timeout_sec=1.0):
            req = Trigger.Request()
            self.servo_start_client.call_async(req)
            self.ui_log('MoveIt Servo resumed.', 'info')
            time.sleep(0.5)

    def execute_move_joint_cb(self, request, response):
        if self.is_executing:
            response.ret = -1
            response.message = "Already executing."
            return response
            
        self.is_executing = True
        self.stop_requested = False
        
        def _task():
            try:
                # 1. Stop MoveIt Servo
                if self.servo_stop_client.wait_for_service(timeout_sec=1.0):
                    req = Trigger.Request()
                    self.servo_stop_client.call_async(req)
                    time.sleep(0.5) 
                    
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
                if self.servo_start_client.wait_for_service(timeout_sec=1.0):
                    req = Trigger.Request()
                    self.servo_start_client.call_async(req)
                    self.ui_log('MoveIt Servo resumed.', 'info')
                    time.sleep(0.5)
                    
            except Exception as e:
                self.ui_log(f"Error: {e}", 'error')
            finally:
                self.is_executing = False

        import threading
        threading.Thread(target=_task).start()
        
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
        self.ui_log('<span style="color: var(--rviz-x); font-weight: bold; font-size: 1.2em;">EMERGENCY STOP TRIGGERED!</span>', 'error')
        
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
            # Fallback if no joint states: try an empty point to force preempt
            msg = JointTrajectory()
            msg.header.stamp = self.get_clock().now().to_msg()
            msg.joint_names = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6']
            point = JointTrajectoryPoint()
            point.time_from_start = Duration(sec=0, nanosec=100000000)
            msg.points.append(point)
            self.publisher_.publish(msg)
            self.ui_log('Warning: No joint states. Published fallback STOP trajectory.', 'warn')
        
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
        if self.is_executing:
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
        
        self.is_executing = True
        self.stop_requested = False
        
        def _task():
            try:
                from moveit_msgs.srv import GetPositionIK
                from geometry_msgs.msg import PoseStamped
                from scipy.spatial.transform import Rotation as R
                from moveit_msgs.msg import RobotState
                from sensor_msgs.msg import JointState
                pass
                
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
                
        import threading
        threading.Thread(target=_task).start()
        
        response.success = True
        response.message = "Scan path processing started."
        return response

    def execute_object_scan_cb(self, request, response):
        if self.is_executing:
            response.success = False
            response.message = "System is already executing a move."
            return response
            
        self._reset_hardware_state()
        self.is_executing = True
        self.stop_requested = False
        
        def _task():
            try:
                from moveit_msgs.srv import GetPositionIK
                from geometry_msgs.msg import PoseStamped
                from scipy.spatial.transform import Rotation as R
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
                    except Exception as e:
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
                
        import threading
        threading.Thread(target=_task).start()
        
        response.success = True
        response.message = "Object Scan processing started."
        return response

    def execute_move_to_pose_cb(self, request, response):
        if self.is_executing:
            response.ret = -1
            response.message = "Already executing."
            return response
            
        self._reset_hardware_state()
        self.is_executing = True
        self.stop_requested = False
        def _task():
            try:
                self._execute_move_to_pose_core(request, response)
            finally:
                self.is_executing = False
                
        import threading
        threading.Thread(target=_task).start()
        
        response.ret = 0
        response.message = "Move to pose started."
        return response

    def _execute_move_to_pose_core(self, request, response):
        try:
            from moveit_msgs.srv import GetPositionIK
            from geometry_msgs.msg import PoseStamped
            from scipy.spatial.transform import Rotation as R
            
            # Ziel-Koordinaten (Panel sendet mm, Konvertierung in m)
            target_x = request.pose[0] / 1000.0
            target_y = request.pose[1] / 1000.0
            target_z = request.pose[2] / 1000.0
            
            target_r = request.pose[3]
            target_p = request.pose[4]
            target_yaw = request.pose[5]
            
            is_scan_pos = (abs(target_x - 0.3) < 0.001 and abs(target_y - 0.0) < 0.001 and abs(target_z - 0.4) < 0.001)
            is_hover_pos = (abs(target_z - 0.04) < 0.001)
            
            if self.sound_absolute and not is_scan_pos and not is_hover_pos:
                self.sound_absolute.play()
            
            self.ui_log(f"MoveTo started (IK mode): X={target_x:.3f}, Y={target_y:.3f}, Z={target_z:.3f}", 'action')
            
            # 1. Konvertiere Euler zu Quaternion
            target_rot = R.from_euler('xyz', [target_r, target_p, target_yaw], degrees=False)
            q = target_rot.as_quat() # [x, y, z, w]
            
            # 2. IK Request aufbauen
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
                    
            # 5. Führe Gelenkbewegung aus
            self._go_to_joints(target_joints, log_msg="Executing MoveTo Pose via IK...")
            
            self.ui_log("MoveTo target successfully reached!", 'success')
            response.ret = 0
            response.message = "Success"
            
        except Exception as e:
            self.ui_log(f"Error in MoveTo: {e}", 'error')
            response.ret = -1
            response.message = str(e)
            
        return response

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