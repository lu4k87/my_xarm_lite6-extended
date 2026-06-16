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
            self._go_to_initial_pose_joints()
                
            response.success = True
            response.message = "Initial Pose reached."
        except Exception as e:
            self.get_logger().error(f"Error: {e}")
            response.success = False
            response.message = str(e)
        finally:
            self.is_executing = False
            
        return response

    def _go_to_initial_pose_joints(self):
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
            from geometry_msgs.msg import TwistStamped
            
            # Ziel-Koordinaten (Panel sendet mm, Konvertierung in m)
            target_x = request.pose[0] / 1000.0
            target_y = request.pose[1] / 1000.0
            target_z = request.pose[2] / 1000.0
            
            target_r = request.pose[3]
            target_p = request.pose[4]
            target_yaw = request.pose[5]
            
            # P-Regler Konstanten
            Kp_pos = 2.5
            Kp_ori = 1.0
            
            # Skaliere Geschwindigkeiten anhand des globalen Speed Factors (0.5 ist Standard = 1x)
            speed_multiplier = self.current_speed_scale / 0.5
            max_vel_pos = 0.2 * speed_multiplier # m/s
            max_vel_ori = 0.5 * speed_multiplier # rad/s
            
            rate = self.create_rate(20.0) # 20 Hz loop
            
            self.get_logger().info(f"MoveTo gestartet: X={target_x:.3f}, Y={target_y:.3f}, Z={target_z:.3f}")
            
            # Timeout nach 30 Sekunden
            start_time = self.get_clock().now()
            
            while rclpy.ok():
                if (self.get_clock().now() - start_time).nanoseconds / 1e9 > 30.0:
                    raise Exception("Timeout: Ziel nicht erreicht in 30 Sekunden.")
                    
                try:
                    trans = self.tf_buffer.lookup_transform('link_base', 'link_tcp', rclpy.time.Time())
                except Exception as e:
                    time.sleep(0.1)
                    continue
                    
                cur_x = trans.transform.translation.x
                cur_y = trans.transform.translation.y
                cur_z = trans.transform.translation.z
                
                # Aktuelle Orientierung (Quaternion) in Euler umwandeln
                cur_q = [
                    trans.transform.rotation.x,
                    trans.transform.rotation.y,
                    trans.transform.rotation.z,
                    trans.transform.rotation.w
                ]
                cur_rot = R.from_quat(cur_q)
                cur_euler = cur_rot.as_euler('xyz', degrees=False)
                
                cur_roll = cur_euler[0]
                cur_pitch = cur_euler[1]
                cur_yaw = cur_euler[2]
                
                # Positions-Fehler
                err_x = target_x - cur_x
                err_y = target_y - cur_y
                err_z = target_z - cur_z
                
                # Orientierungs-Fehler (kuerzesten Winkelabstand berechnen)
                err_roll = (target_r - cur_roll + math.pi) % (2 * math.pi) - math.pi
                err_pitch = (target_p - cur_pitch + math.pi) % (2 * math.pi) - math.pi
                err_yaw = (target_yaw - cur_yaw + math.pi) % (2 * math.pi) - math.pi
                
                dist_pos = np.sqrt(err_x**2 + err_y**2 + err_z**2)
                dist_ori = np.sqrt(err_roll**2 + err_pitch**2 + err_yaw**2)
                
                # Abbruchbedingung: Position < 2mm UND Winkel < ~1.1 Grad
                if dist_pos < 0.002 and dist_ori < 0.02:
                    break
                    
                # Geschwindigkeiten berechnen (Linear)
                vx = np.clip(err_x * Kp_pos, -max_vel_pos, max_vel_pos)
                vy = np.clip(err_y * Kp_pos, -max_vel_pos, max_vel_pos)
                vz = np.clip(err_z * Kp_pos, -max_vel_pos, max_vel_pos)
                
                # Geschwindigkeiten berechnen (Angular)
                wx = np.clip(err_roll * Kp_ori, -max_vel_ori, max_vel_ori)
                wy = np.clip(err_pitch * Kp_ori, -max_vel_ori, max_vel_ori)
                wz = np.clip(err_yaw * Kp_ori, -max_vel_ori, max_vel_ori)
                
                # Sende Twist an Servo
                t = TwistStamped()
                t.header.frame_id = 'link_base'
                t.header.stamp = self.get_clock().now().to_msg()
                t.twist.linear.x = float(vx)
                t.twist.linear.y = float(vy)
                t.twist.linear.z = float(vz)
                
                # Orientierung korrigieren
                t.twist.angular.x = float(wx)
                t.twist.angular.y = float(wy)
                t.twist.angular.z = float(wz)
                
                self.twist_pub.publish(t)
                time.sleep(0.05)
                
            # Stopp-Kommando senden
            t_stop = TwistStamped()
            t_stop.header.frame_id = 'link_base'
            t_stop.header.stamp = self.get_clock().now().to_msg()
            self.twist_pub.publish(t_stop)
            
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