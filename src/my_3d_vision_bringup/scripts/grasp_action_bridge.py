#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from rclpy.action import ActionClient
from std_msgs.msg import String
from my_3d_vision_bringup.action import GraspObject

class GraspActionBridge(Node):
    def __init__(self):
        super().__init__('grasp_action_bridge')
        self.sub = self.create_subscription(String, '/ui/grasp_object_cmd', self.cmd_callback, 10)
        self._action_client = ActionClient(self, GraspObject, '/ui/grasp_object')
        self.get_logger().info('Grasp Action Bridge ready. Listening on /ui/grasp_object_cmd and forwarding to Action Server.')

    def cmd_callback(self, msg):
        target = msg.data.strip()
        if not target: return
        self.get_logger().info(f"Forwarding legacy topic command to action server for target: {target}")
        
        if not self._action_client.wait_for_server(timeout_sec=2.0):
            self.get_logger().error("Action Server /ui/grasp_object not available!")
            return
            
        goal_msg = GraspObject.Goal()
        goal_msg.object_name = target
        self._action_client.send_goal_async(goal_msg)

def main(args=None):
    rclpy.init(args=args)
    node = GraspActionBridge()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
