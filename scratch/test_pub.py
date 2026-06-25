import rclpy
from rclpy.node import Node
from std_msgs.msg import String

class TestPub(Node):
    def __init__(self):
        super().__init__('test_pub')
        self.pub = self.create_publisher(String, '/ui/motion_status', 10)
        self.timer = self.create_timer(1.0, self.timer_callback)
        self.count = 0

    def timer_callback(self):
        msg = String()
        msg.data = f"INFO: Test message {self.count}"
        self.pub.publish(msg)
        self.get_logger().info(f'Publishing: "{msg.data}"')
        self.count += 1

def main(args=None):
    rclpy.init(args=args)
    test_pub = TestPub()
    rclpy.spin(test_pub)
    test_pub.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
