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

class RobotMotionHandlerMovegroup(Node):
    def __init__(self):
        super().__init__('robot_motion_handler_movegroup')
        
        self.cb_group = ReentrantCallbackGroup()
        
        import tf2_ros
        from geometry_msgs.msg import TwistStamped
        self.tf_buffer = tf2_ros.Buffer()
        self.tf_listener = tf2_ros.TransformListener(self.tf_buffer, self)
        self.twist_pub = self.create_publisher(TwistStamped, '/servo_server/delta_twist_cmds', 10)

        
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
        self.ui_log('Universal Control Services (/ui/execute_initial_pose, /ui/execute_move_to_pose, /ui/start_octomap_scan, /ui/start_object_scan, /ui/execute_move_joint) ready.', 'success')
        self.is_executing = False
        
        from std_msgs.msg import Float32
        self.current_speed_scale = 0.5
        self.speed_sub = self.create_subscription(
            Float32,
            '/ui/robot_control/current_speed',
            self.speed_cb,
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

    def speed_cb(self, msg):
        self.current_speed_scale = msg.data

    def _check_servo_ready(self):
        if self.servo_start_client.service_is_ready() and self.servo_stop_client.service_is_ready():
            self.startup_timer.cancel()
            self.ui_log('MoveIt Servo fully loaded. Auto-triggering initial pose in 1s...', 'success')
            import time
            time.sleep(1.0) # Give TF a moment to stabilize
            # Startup: Just move to initial pose directly
            self._go_to_joints([0.0, 0.4244, 0.5627, 0.0, 0.1383, 0.0], "Moving to Initial Pose...")

    def execute_initial_pose_cb(self, request, response):
        if self.is_executing:
            response.success = False
            response.message = "Already executing."
            return response
            
        self.is_executing = True
        
        try:
            # --- PHASE 1: RETRACT (Move up by 15cm) ---
            try:
                trans = self.tf_buffer.lookup_transform('link_base', 'link_tcp', rclpy.time.Time())
                cur_x = trans.transform.translation.x * 1000.0
                cur_y = trans.transform.translation.y * 1000.0
                cur_z = trans.transform.translation.z * 1000.0
                
                cur_q = [
                    trans.transform.rotation.x,
                    trans.transform.rotation.y,
                    trans.transform.rotation.z,
                    trans.transform.rotation.w
                ]
                from scipy.spatial.transform import Rotation as R
                cur_rot = R.from_quat(cur_q)
                cur_euler = cur_rot.as_euler('xyz', degrees=False)
                
                target_z = min(cur_z + 150.0, 500.0) 
                
                class DummyRequest:
                    pose = [cur_x, cur_y, target_z, cur_euler[0], cur_euler[1], cur_euler[2]]
                
                class DummyResponse:
                    ret = 0
                    message = ""
                
                move_req = DummyRequest()
                move_res = DummyResponse()
                
                self.ui_log('Phase 1: Retracting 15cm upwards...', 'action')
                self._execute_move_to_pose_core(move_req, move_res)
                
            except Exception as e:
                self.ui_log(f'Retract Phase failed or skipped: {e}', 'warn')

            # --- PHASE 2: MOVE TO INITIAL POSE ---
            self._go_to_joints([0.0, 0.4244, 0.5627, 0.0, 0.1383, 0.0], "Moving to Initial Pose...")
                
            response.success = True
            response.message = "Initial Pose reached."
        except Exception as e:
            self.ui_log(f"Error: {e}", 'error')
            response.success = False
            response.message = str(e)
        finally:
            self.is_executing = False
            
        return response

    def _go_to_joints(self, target_joints, log_msg="Moving to target pose..."):
        # 1. Stop MoveIt Servo
        if self.servo_stop_client.wait_for_service(timeout_sec=1.0):
            from std_srvs.srv import Trigger
            req = Trigger.Request()
            self.servo_stop_client.call_async(req)
            self.ui_log('MoveIt Servo paused for direct joint motion.', 'info')
            import time
            time.sleep(0.5) 
            
        # 2. Publish trajectory
        msg = JointTrajectory()
        msg.joint_names = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6']
        
        point = JointTrajectoryPoint()
        point.positions = target_joints
        point.velocities = [0.0] * 6
        
        # Skaliere Dauer anhand des globalen Speed Factors (0.5 = 1x Speed)
        speed_multiplier = self.current_speed_scale / 0.5
        duration_sec = max(1.0, 2.0 / speed_multiplier)
        point.time_from_start = Duration(sec=int(duration_sec), nanosec=int((duration_sec - int(duration_sec)) * 1e9))
        
        msg.points.append(point)
        self.publisher_.publish(msg)
        self.ui_log(f'Trajectory sent. {log_msg}', 'action')
        
        # Warte auf die Ausfuehrung der Bewegung
        time.sleep(duration_sec + 0.5)
        
        # 3. Start MoveIt Servo again
        if self.servo_start_client.wait_for_service(timeout_sec=1.0):
            req = Trigger.Request()
            self.servo_start_client.call_async(req)
            self.ui_log('MoveIt Servo resumed.', 'info')
            time.sleep(0.5)

    def _go_to_joints_trajectory(self, target_joint_points, log_msg="Executing trajectory..."):
        # 1. Stop MoveIt Servo
        if self.servo_stop_client.wait_for_service(timeout_sec=1.0):
            from std_srvs.srv import Trigger
            req = Trigger.Request()
            self.servo_stop_client.call_async(req)
            self.ui_log('MoveIt Servo paused for direct trajectory execution.', 'info')
            import time
            time.sleep(0.5) 
            
        # 2. Publish trajectory
        msg = JointTrajectory()
        msg.joint_names = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6']
        
        speed_multiplier = self.current_speed_scale / 0.5
        
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
            
        self.publisher_.publish(msg)
        self.ui_log(f'Trajectory sent with {len(msg.points)} points. {log_msg}', 'action')
        
        # Warte auf die Ausfuehrung der Bewegung
        time.sleep(total_duration + 0.5)
        
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
            speed_multiplier = self.current_speed_scale / 0.5
            duration_sec = max(1.0, 2.0 / speed_multiplier)
            
            point.time_from_start = Duration(sec=int(duration_sec), nanosec=int((duration_sec - int(duration_sec)) * 1e9))
            
            msg.points.append(point)
            self.publisher_.publish(msg)
            self.ui_log('Trajectory sent. Moving to Joint Pose...', 'action')
            
            # Warte auf die Ausfuehrung der Bewegung
            time.sleep(duration_sec + 0.5)
            
            # 3. Start MoveIt Servo again
            if self.servo_start_client.wait_for_service(timeout_sec=1.0):
                req = Trigger.Request()
                self.servo_start_client.call_async(req)
                self.ui_log('MoveIt Servo resumed.', 'info')
                time.sleep(0.5)
                
            response.ret = 0
            response.message = "Joint Pose reached."
        except Exception as e:
            self.ui_log(f"Error: {e}", 'error')
            response.ret = -1
            response.message = str(e)
        finally:
            self.is_executing = False
            
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

    def generate_object_cross_trajectory(self, objects, cross_size=0.10, height=0.11):
        """
        Generiert eine kontinuierliche Kreuz-Trajektorie (+/- 5cm) ueber eine Liste von Objekt-Zentren.
        """
        waypoints = []
        half_size = cross_size / 2.0
        
        def add_segment(p_start, p_end, steps, target_obj_x, target_obj_y, is_transition=False):
            for i in range(steps):
                f = i / max(1, (steps - 1)) if steps > 1 else 1.0
                x = p_start[0] + (p_end[0] - p_start[0]) * f
                y = p_start[1] + (p_end[1] - p_start[1]) * f
                z = height
                
                # Look-At Logik
                if is_transition:
                    # Während der Transition einfach gerade nach unten schauen (verhindert Twisting)
                    dx = 0.0
                    dy = 0.0
                else:
                    # Exakt auf das Objekt-Zentrum schauen (keine Dämpfung!)
                    dx = target_obj_x - x
                    dy = target_obj_y - y
                
                dz = 0.0 - z
                
                # Exakte Trigonometrie für Look-At
                roll_tilt = math.atan2(dy, -dz)
                pitch_tilt = math.atan2(-dx, -dz)
                
                roll = math.pi + roll_tilt
                pitch = pitch_tilt
                yaw = 0.0
                
                waypoints.append([x, y, z, roll, pitch, yaw])

        for idx, obj in enumerate(objects):
            obj_x, obj_y = obj
            
            c = (obj_x, obj_y)
            l = (obj_x - half_size, obj_y)
            r = (obj_x + half_size, obj_y)
            b = (obj_x, obj_y - half_size)
            t = (obj_x, obj_y + half_size)
            
            # 1. Anflug zum Zentrum des aktuellen Objekts
            if idx > 0:
                prev_obj = objects[idx-1]
                add_segment(prev_obj, c, 15, obj_x, obj_y, is_transition=True) # 15 Schritte Transition
            else:
                add_segment(c, c, 1, obj_x, obj_y, is_transition=True)
                
            # 2. Das Kreuz abfahren (kontinuierlich)
            add_segment(c, l, 6, obj_x, obj_y) # Mitte nach Links
            add_segment(l, r, 12, obj_x, obj_y) # Links nach Rechts (ueber Mitte)
            add_segment(r, c, 6, obj_x, obj_y) # Rechts zurueck in Mitte
            add_segment(c, b, 6, obj_x, obj_y) # Mitte nach Unten
            add_segment(b, t, 12, obj_x, obj_y) # Unten nach Oben
            add_segment(t, c, 6, obj_x, obj_y) # Oben zurueck in Mitte
            
        return waypoints

    def execute_scan_path_cb(self, request, response):
        if self.is_executing:
            response.success = False
            response.message = "System is already executing a move."
            return response
            
        self.ui_log('Generating 3D Wave Scan Path...', 'info')
        # Parameter: X: 250 bis 360mm, Y: -150 bis 150mm, Z wippt zwischen 100mm und 200mm
        # base_z von 250 auf 150 reduziert, damit die Kamera extrem nah (10-20cm) ueber die 
        # Objekte (Cube, Cylinder etc.) fliegt, was eine perfekte Octomap/Punktewolke generiert.
        waypoints = self.generate_wave_trajectory(min_x=0.250, max_x=0.360, min_y=-0.150, max_y=0.150, base_z=0.150, z_amplitude=0.050)
        
        self.ui_log(f'{len(waypoints)} waypoints generated. Starting IK resolution.', 'success')
        
        self.is_executing = True
        
        try:
            from moveit_msgs.srv import GetPositionIK
            from geometry_msgs.msg import PoseStamped
            from scipy.spatial.transform import Rotation as R
            from moveit_msgs.msg import RobotState
            from sensor_msgs.msg import JointState
            import time
            
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
                    raise Exception("IK Service /compute_ik nicht verfuegbar!")
                    
                future = self.ik_client.call_async(ik_req)
                
                start_wait = time.time()
                while not future.done():
                    if time.time() - start_wait > 2.0:
                        raise Exception("Timeout beim Warten auf IK-Antwort.")
                    time.sleep(0.01)
                    
                ik_res = future.result()
                
                if ik_res.error_code.val != 1:
                    raise Exception(f"IK Berechnung am Wegpunkt {i} fehlgeschlagen. Ziel ausser Reichweite oder Singularitaet.")
                    
                joint_names = ik_res.solution.joint_state.name
                positions = ik_res.solution.joint_state.position
                
                target_joints = [0.0] * 6
                for j in range(1, 7):
                    j_name = f'joint{j}'
                    idx = joint_names.index(j_name)
                    target_joints[j-1] = positions[idx]
                    
                current_seed_joints = target_joints
                
                # Berechne die Dauer bis zu diesem Punkt
                # Der erste Punkt kriegt 2 Sekunden zum Anfahren, alle anderen z.B. 0.4 Sekunden (Lawnmower-Stuecke)
                duration = 2.0 if i == 0 else 0.4
                trajectory_points.append((target_joints, duration))

            self.ui_log('All IK points successfully resolved. Executing continuous wave trajectory...', 'success')
            self._go_to_joints_trajectory(trajectory_points, "Executing continuous Octomap Wave Scan...")
            
            response.success = True
            response.message = "Scan path completed."
            
        except Exception as e:
            self.ui_log(f"Error during scan path: {e}", 'error')
            response.success = False
            response.message = str(e)
        finally:
            self.is_executing = False
            
        return response

    def execute_object_scan_cb(self, request, response):
        if self.is_executing:
            response.success = False
            response.message = "System is already executing a move."
            return response
            
        self.ui_log('Ermittle Live-Positionen der Objekte über TF...', 'info')
        
        objects = []
        object_configs = [
            ("Blue Cube", "target_blue_cube", (0.174, 0.082)),
            ("Red Rectangle", "target_red_rectangle", (0.219, -0.083)),
            ("Green Cylinder", "target_green_cylinder", (0.274, 0.018))
        ]
        
        for name, frame_id, default_pos in object_configs:
            try:
                t = self.tf_buffer.lookup_transform('link_base', frame_id, rclpy.time.Time())
                x = t.transform.translation.x
                y = t.transform.translation.y
                self.ui_log(f'Live-Position {name}: X={x:.3f}, Y={y:.3f}', 'success')
                objects.append((x, y))
            except Exception as e:
                self.ui_log(f'Live-Position für {name} nicht gefunden. Nutze Fallback: X={default_pos[0]:.3f}, Y={default_pos[1]:.3f}', 'warn')
                objects.append(default_pos)
                
        self.ui_log('Generating Object-Targeted Cross Scan Path...', 'info')
        
        waypoints = self.generate_object_cross_trajectory(objects)
        
        self.ui_log(f'{len(waypoints)} waypoints generated. Starting IK resolution.', 'success')
        
        self.is_executing = True
        
        try:
            from moveit_msgs.srv import GetPositionIK
            from geometry_msgs.msg import PoseStamped
            from scipy.spatial.transform import Rotation as R
            from moveit_msgs.msg import RobotState
            from sensor_msgs.msg import JointState
            import time
            
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
                
                if current_seed_joints is not None:
                    rs = RobotState()
                    js = JointState()
                    js.name = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6']
                    js.position = current_seed_joints
                    rs.joint_state = js
                    ik_req.ik_request.robot_state = rs
                
                if not self.ik_client.wait_for_service(timeout_sec=2.0):
                    raise Exception("IK Service /compute_ik nicht verfuegbar!")
                    
                future = self.ik_client.call_async(ik_req)
                
                start_wait = time.time()
                while not future.done():
                    if time.time() - start_wait > 2.0:
                        raise Exception("Timeout beim Warten auf IK-Antwort.")
                    time.sleep(0.01)
                    
                ik_res = future.result()
                
                if ik_res.error_code.val != 1:
                    raise Exception(f"IK Berechnung am Wegpunkt {i} fehlgeschlagen. Ziel ausser Reichweite oder Singularitaet.")
                    
                joint_names = ik_res.solution.joint_state.name
                positions = ik_res.solution.joint_state.position
                
                target_joints = [0.0] * 6
                for j in range(1, 7):
                    j_name = f'joint{j}'
                    idx = joint_names.index(j_name)
                    target_joints[j-1] = positions[idx]
                    
                current_seed_joints = target_joints
                
                # Da die Wegpunkte jetzt sehr dicht und kontinuierlich sind,
                # geben wir jedem Punkt eine konstante kurze Dauer (weich und nicht zu schnell)
                duration = 2.0 if i == 0 else 0.25
                trajectory_points.append((target_joints, duration))

            # Initial Pose am Ende anhaengen!
            initial_pose_joints = [0.0, 0.4244, 0.5627, 0.0, 0.1383, 0.0]
            trajectory_points.append((initial_pose_joints, 3.0))

            self.ui_log('All IK points successfully resolved. Executing Object Cross Scan...', 'success')
            self._go_to_joints_trajectory(trajectory_points, "Executing Object-Targeted Cross Scan...")
            
            response.success = True
            response.message = "Scan path completed."
            
        except Exception as e:
            self.ui_log(f"Error during scan path: {e}", 'error')
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
            return self._execute_move_to_pose_core(request, response)
        finally:
            self.is_executing = False
            
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
                raise Exception("IK Service /compute_ik nicht verfuegbar!")
                
            future = self.ik_client.call_async(ik_req)
            
            # Warte auf IK Antwort
            import time
            start_wait = time.time()
            while not future.done():
                if time.time() - start_wait > 2.0:
                    raise Exception("Timeout beim Warten auf IK-Antwort.")
                time.sleep(0.05)
                
            ik_res = future.result()
            
            if ik_res.error_code.val != 1: # 1 == SUCCESS
                raise Exception(f"IK Berechnung fehlgeschlagen (Error Code: {ik_res.error_code.val}). Ziel auerhalb der Reichweite oder in Kollision.")
                
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
                    raise Exception(f"Gelenk {j_name} nicht in IK Loesung gefunden!")
                    
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