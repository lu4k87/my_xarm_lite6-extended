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
            '/ui/execute_scan_path', 
            self.execute_scan_path_cb,
            callback_group=self.cb_group
        )
        self.get_logger().info('Universal Control Services (/ui/execute_initial_pose, /ui/execute_move_to_pose, /ui/execute_scan_path, /ui/execute_move_joint) ready.')
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
        
    def speed_cb(self, msg):
        self.current_speed_scale = msg.data

    def _check_servo_ready(self):
        if self.servo_start_client.service_is_ready() and self.servo_stop_client.service_is_ready():
            self.startup_timer.cancel()
            self.get_logger().info('MoveIt Servo fully loaded. Auto-triggering initial pose in 1s...')
            import time
            time.sleep(1.0) # Give TF a moment to stabilize
            # Startup: Just move to initial pose directly
            self._go_to_initial_pose_joints()

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
                
                self.get_logger().info('Phase 1: Fahre zunaechst 15cm nach oben (Retract)...')
                self.is_executing = False
                self.execute_move_to_pose_cb(move_req, move_res)
                self.is_executing = True
                
            except Exception as e:
                self.get_logger().warn(f'Retract Phase fehlgeschlagen oder uebersprungen: {e}')
                self.is_executing = True

            # --- PHASE 2: MOVE TO INITIAL POSE ---
            self._go_to_joints([0.0, 0.4244, 0.5627, 0.0, 0.1383, 0.0], "Fahre auf Startpose...")
                
            response.success = True
            response.message = "Initial Pose reached."
        except Exception as e:
            self.get_logger().error(f"Error: {e}")
            response.success = False
            response.message = str(e)
        finally:
            self.is_executing = False
            
        return response

    def _go_to_joints(self, target_joints, log_msg="Fahre zu Zielpose..."):
        # 1. Stop MoveIt Servo
        if self.servo_stop_client.wait_for_service(timeout_sec=1.0):
            from std_srvs.srv import Trigger
            req = Trigger.Request()
            self.servo_stop_client.call_async(req)
            self.get_logger().info('MoveIt Servo pausiert für direkte Gelenk-Fahrt.')
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
        self.get_logger().info(f'Trajektorie gesendet. {log_msg}')
        
        # Warte auf die Ausfuehrung der Bewegung
        time.sleep(duration_sec + 0.5)
        
        # 3. Start MoveIt Servo again
        if self.servo_start_client.wait_for_service(timeout_sec=1.0):
            req = Trigger.Request()
            self.servo_start_client.call_async(req)
            self.get_logger().info('MoveIt Servo wieder gestartet.')
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
            self.get_logger().info('Trajektorie gesendet. Fahre zu Joint Pose...')
            
            # Warte auf die Ausfuehrung der Bewegung
            time.sleep(duration_sec + 0.5)
            
            # 3. Start MoveIt Servo again
            if self.servo_start_client.wait_for_service(timeout_sec=1.0):
                req = Trigger.Request()
                self.servo_start_client.call_async(req)
                time.sleep(0.5)
                
            response.ret = 0
            response.message = "Joint Pose reached."
        except Exception as e:
            self.get_logger().error(f"Error: {e}")
            response.ret = -1
            response.message = str(e)
        finally:
            self.is_executing = False
            
        return response

    def generate_spherical_waypoints(self, center_x, center_y, center_z, radius, num_latitudes=4, num_longitudes=8):
        """
        Generiert Wegpunkte auf einer Halbkugel.
        Die Z-Achse des TCP zeigt auf den Mittelpunkt (center_x, center_y, center_z).
        """
        waypoints = []
        
        # lat (Theta): 0 (direkt ueber dem Objekt) bis pi/2 (auf Aequator-Hoehe)
        # lon (Phi): 0 bis 2*pi (einmal um das Objekt herum)
        for lat in np.linspace(0, math.pi / 2.5, num_latitudes): 
            for lon in np.linspace(0, 2 * math.pi, num_longitudes, endpoint=False):
                # 1. Position auf der Kugeloberflaeche berechnen
                x = center_x + radius * math.sin(lat) * math.cos(lon)
                y = center_y + radius * math.sin(lat) * math.sin(lon)
                z = center_z + radius * math.cos(lat)
                
                # 2. Look-At Vektor berechnen (Z-Achse des TCP)
                forward = np.array([center_x - x, center_y - y, center_z - z])
                forward = forward / np.linalg.norm(forward)
                
                # Referenz-Up-Vektor der Welt (Z-Achse)
                world_up = np.array([0, 0, 1])
                
                # Singularitaet abfangen, wenn der Roboter exakt senkrecht ueber dem Objekt steht
                if abs(np.dot(forward, world_up)) > 0.99:
                    world_up = np.array([1, 0, 0])
                
                # X- und Y-Achse des TCP berechnen (Kreuzprodukt)
                right = np.cross(world_up, forward)
                right = right / np.linalg.norm(right)
                up = np.cross(forward, right)
                up = up / np.linalg.norm(up)
                
                # Rotationsmatrix erstellen: Spalten sind die X, Y, Z Achsen des TCP
                rot_matrix = np.column_stack((right, up, forward))
                
                # In Euler-Winkel konvertieren (Roll, Pitch, Yaw)
                rot = R.from_matrix(rot_matrix)
                euler = rot.as_euler('xyz', degrees=False)
                
                # Wegpunkt speichern: [x, y, z, roll, pitch, yaw] (in Meter und Radiant)
                waypoints.append([x, y, z, euler[0], euler[1], euler[2]])
                
        return waypoints

    def execute_scan_path_cb(self, request, response):
        if self.is_executing:
            response.success = False
            response.message = "System is already executing a move."
            return response
            
        # Parameter fuer das zu scannende Objekt
        # Fokuspunkt (x, y, z) im Roboter-Koordinatensystem in Meter
        obj_center_x = 0.400 
        obj_center_y = 0.000
        obj_center_z = 0.050
        
        # Scan-Radius um das Objekt in Meter
        scan_radius = 0.250 
        
        self.get_logger().info(f'Generiere 3D Scan Pfad (Radius: {scan_radius}m)...')
        waypoints = self.generate_spherical_waypoints(
            obj_center_x, obj_center_y, obj_center_z, scan_radius, 
            num_latitudes=3, num_longitudes=6
        )
        
        self.get_logger().info(f'{len(waypoints)} Wegpunkte generiert. Starte Scanvorgang.')
        
        # Fake-Request Objekt fuer den Aufruf der bestehenden Move-Methode
        class DummyRequest:
            pose = [0.0] * 6

        move_req = DummyRequest()
        move_res = Trigger.Response() # Platzhalter, ret property wird genutzt
        
        try:
            for i, wp in enumerate(waypoints):
                self.get_logger().info(f'Fahre Wegpunkt {i+1}/{len(waypoints)} an...')
                
                # Die Move-Methode erwartet Millimeter fuer XYZ
                move_req.pose[0] = wp[0] * 1000.0
                move_req.pose[1] = wp[1] * 1000.0
                move_req.pose[2] = wp[2] * 1000.0
                move_req.pose[3] = wp[3] # Roll
                move_req.pose[4] = wp[4] # Pitch
                move_req.pose[5] = wp[5] # Yaw
                
                # Nutze die Logik zum Anfahren (blockiert bis Ziel erreicht)
                self.execute_move_to_pose_cb(move_req, move_res)
                
                # Kurze Pause an jedem Wegpunkt
                time.sleep(1.0) 
                
            response.success = True
            response.message = "Scan path completed."
        except Exception as e:
            self.get_logger().error(f"Fehler beim Scan-Pfad: {e}")
            response.success = False
            response.message = str(e)
            
        return response

    def execute_move_to_pose_cb(self, request, response):
        if self.is_executing:
            response.ret = -1
            response.message = "Already executing."
            return response
            
        self.is_executing = True
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
            
            self.get_logger().info(f"MoveTo gestartet (IK-Modus): X={target_x:.3f}, Y={target_y:.3f}, Z={target_z:.3f}")
            
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
            self._go_to_joints(target_joints, log_msg="Execute MoveTo Pose via IK...")
            
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