import rclpy
from rclpy.node import Node
import json
from std_msgs.msg import String, Float64
from geometry_msgs.msg import TwistStamped
from xarm_msgs.srv import Call

class VRTeleopNode(Node):
    def __init__(self):
        super().__init__('vr_quest3_teleop_node')
        
        # Subscriptions
        self.sub = self.create_subscription(String, '/vr_teleop/controller_data', self.controller_cb, 10)
        
        # Publishers
        self.twist_pub = self.create_publisher(TwistStamped, '/servo_server/delta_twist_cmds', 10)
        self.linear_axis_pub = self.create_publisher(Float64, '/linear_axis_cmd', 10)
        
        # Services
        self.open_gripper_cli = self.create_client(Call, '/ufactory/open_lite6_gripper')
        self.close_gripper_cli = self.create_client(Call, '/ufactory/close_lite6_gripper')
        
        # State variables
        self.grip_pressed = False
        self.initial_pos = None
        self.k_linear = 2.0  # Sensitivity for translation
        
        self.index_pressed = False
        self.gripper_open = True
        
        self.linear_axis_pos = 0.0
        
        self.get_logger().info("VR Quest 3 Teleop Node started.")
        
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
        
        # 1. Gripper Control (Index Trigger)
        if curr_index and not self.index_pressed:
            req = Call.Request()
            if self.gripper_open:
                self.close_gripper_cli.call_async(req)
                self.gripper_open = False
                self.get_logger().info("Closing Gripper")
            else:
                self.open_gripper_cli.call_async(req)
                self.gripper_open = True
                self.get_logger().info("Opening Gripper")
        self.index_pressed = curr_index
        
        # 2. Cartesian Control (Grip Trigger as Virtual Joystick)
        twist_msg = TwistStamped()
        twist_msg.header.stamp = self.get_clock().now().to_msg()
        twist_msg.header.frame_id = 'link_base'
        
        if curr_grip:
            if not self.grip_pressed:
                # First press, record initial position
                self.initial_pos = pos
                self.grip_pressed = True
            else:
                # Calculate delta
                dx = pos['x'] - self.initial_pos['x']
                dy = pos['y'] - self.initial_pos['y']
                dz = pos['z'] - self.initial_pos['z']
                
                # Map VR space to ROS space (VR: -Z is Forward, -X is Left, Y is Up)
                # ROS: +X is Forward, +Y is Left, +Z is Up
                ros_vx = -dz * self.k_linear
                ros_vy = -dx * self.k_linear
                ros_vz = dy * self.k_linear
                
                # Deadzone
                deadzone = 0.02 # 2cm deadzone
                if abs(dz) < deadzone: ros_vx = 0.0
                if abs(dx) < deadzone: ros_vy = 0.0
                if abs(dy) < deadzone: ros_vz = 0.0
                
                # Limit max velocity
                max_v = 0.3
                twist_msg.twist.linear.x = max(-max_v, min(max_v, ros_vx))
                twist_msg.twist.linear.y = max(-max_v, min(max_v, ros_vy))
                twist_msg.twist.linear.z = max(-max_v, min(max_v, ros_vz))
                
                self.twist_pub.publish(twist_msg)
        else:
            if self.grip_pressed:
                # Just released, send zero velocity to stop
                self.twist_pub.publish(twist_msg)
                self.grip_pressed = False
                
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
