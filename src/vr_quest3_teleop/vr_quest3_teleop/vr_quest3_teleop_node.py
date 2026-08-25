import rclpy
from rclpy.node import Node
import json
from std_msgs.msg import String, Float64
from geometry_msgs.msg import TwistStamped
from xarm_msgs.srv import Call, VacuumGripperCtrl
from std_srvs.srv import Trigger

class VRTeleopNode(Node):
    def __init__(self):
        super().__init__('vr_quest3_teleop_node')
        
        # Subscriptions
        self.sub = self.create_subscription(String, '/vr_teleop/controller_data', self.controller_cb, 10)
        
        # Publishers
        self.twist_pub = self.create_publisher(TwistStamped, '/servo_server/delta_twist_cmds', 10)
        self.linear_axis_pub = self.create_publisher(Float64, '/linear_axis_cmd', 10)
        
        # Service Clients
        self.open_gripper_cli = self.create_client(Call, '/ufactory/open_lite6_gripper')
        self.close_gripper_cli = self.create_client(Call, '/ufactory/close_lite6_gripper')
        self.vacuum_gripper_cli = self.create_client(VacuumGripperCtrl, '/ufactory/set_vacuum_gripper')
        self.servo_start_cli = self.create_client(Trigger, '/servo_server/start_servo')
        
        # State variables
        self.grip_pressed = False
        self.initial_pos = None
        self.k_linear = 2.5  # Sensitivity for translation
        
        self.index_pressed = False
        self.gripper_open = True
        self.servo_started = False
        
        self.linear_axis_pos = 0.0
        
        self.get_logger().info("VR Quest 3 Teleop Node started.")

    def ensure_servo_started(self):
        if not self.servo_started:
            if self.servo_start_cli.wait_for_service(timeout_sec=0.2):
                self.servo_start_cli.call_async(Trigger.Request())
                self.servo_started = True
                self.get_logger().info("Started MoveIt Servo Server.")
            else:
                self.get_logger().warn("Servo Server service '/servo_server/start_servo' not available yet.")

    def toggle_gripper(self):
        self.gripper_open = not self.gripper_open
        gripper_state_str = "OPEN" if self.gripper_open else "CLOSED/ON"
        self.get_logger().info(f"Toggling Gripper to: {gripper_state_str}")

        # Attempt vacuum gripper
        vac_req = VacuumGripperCtrl.Request()
        vac_req.on = not self.gripper_open
        self.vacuum_gripper_cli.call_async(vac_req)

        # Also attempt Lite6 finger gripper call if present
        call_req = Call.Request()
        if not self.gripper_open:
            self.close_gripper_cli.call_async(call_req)
        else:
            self.open_gripper_cli.call_async(call_req)
        
    def controller_cb(self, msg):
        try:
            data = json.loads(msg.data)
        except json.JSONDecodeError:
            self.get_logger().error("Invalid JSON received")
            return
            
        buttons = data.get('buttons', {})
        pos = data.get('position', {})
        axes = data.get('axes', {})
        
        curr_grip = buttons.get('grip', False)
        curr_index = buttons.get('index', False)
        
        # 1. Gripper Control (Index Trigger Edge Detection)
        if curr_index and not self.index_pressed:
            self.toggle_gripper()
        self.index_pressed = curr_index
        
        # 2. Cartesian Control (Grip Trigger)
        twist_msg = TwistStamped()
        twist_msg.header.stamp = self.get_clock().now().to_msg()
        twist_msg.header.frame_id = 'link_base'
        
        if curr_grip:
            self.ensure_servo_started()
            
            # Check if pos is non-zero (valid WebXR tracking pose)
            pos_valid = ('x' in pos and 'y' in pos and 'z' in pos and (abs(pos.get('x',0)) + abs(pos.get('y',0)) + abs(pos.get('z',0)) > 0.0001))
            
            if not self.grip_pressed:
                if pos_valid:
                    # First valid frame after grip press: anchor initial position
                    self.initial_pos = pos
                    self.grip_pressed = True
                    self.get_logger().info(f"Grip engaged. Initial VR Pos: x={pos['x']:.3f}, y={pos['y']:.3f}, z={pos['z']:.3f}")
            else:
                if self.initial_pos and pos_valid:
                    # Calculate delta
                    dx = pos['x'] - self.initial_pos['x']
                    dy = pos['y'] - self.initial_pos['y']
                    dz = pos['z'] - self.initial_pos['z']
                    
                    # Map VR space to ROS space (VR: -Z is Forward, -X is Left, +Y is Up)
                    # ROS: +X is Forward, +Y is Left, +Z is Up
                    ros_vx = -dz * self.k_linear
                    ros_vy = -dx * self.k_linear
                    ros_vz = dy * self.k_linear
                    
                    # Deadzone (1.5cm)
                    deadzone = 0.015
                    if abs(dz) < deadzone: ros_vx = 0.0
                    if abs(dx) < deadzone: ros_vy = 0.0
                    if abs(dy) < deadzone: ros_vz = 0.0
                    
                    # Velocity limits for MoveIt Servo unitless input [-1.0, 1.0]
                    max_v = 0.8
                    twist_msg.twist.linear.x = max(-max_v, min(max_v, ros_vx))
                    twist_msg.twist.linear.y = max(-max_v, min(max_v, ros_vy))
                    twist_msg.twist.linear.z = max(-max_v, min(max_v, ros_vz))
                    
                    self.twist_pub.publish(twist_msg)
        else:
            if self.grip_pressed:
                # Squeeze released, send zero velocity to halt
                self.twist_pub.publish(twist_msg)
                self.grip_pressed = False
                self.initial_pos = None
                self.get_logger().info("Grip released. Halting robot.")
                
        # 3. Linear Axis Control (Thumbstick X)
        thumb_x = axes.get('x', 0.0)
        if abs(thumb_x) > 0.1:
            self.linear_axis_pos += thumb_x * 0.005
            self.linear_axis_pos = max(-0.5, min(0.5, self.linear_axis_pos))
            axis_msg = Float64()
            axis_msg.data = self.linear_axis_pos
            self.linear_axis_pub.publish(axis_msg)

def main(args=None):
    rclpy.init(args=args)
    node = VRTeleopNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
