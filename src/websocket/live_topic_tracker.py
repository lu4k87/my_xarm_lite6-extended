import rclpy
from rclpy.node import Node
from std_msgs.msg import String
import json
import time
from rclpy.qos import QoSProfile, QoSHistoryPolicy, QoSReliabilityPolicy
from rosidl_runtime_py.utilities import get_message

class LiveTopicTracker(Node):
    def __init__(self):
        super().__init__('live_topic_tracker')
        self.cmd_sub = self.create_subscription(String, '/dashboard/request_topic_activity', self.handle_request, 10)
        self.activity_pub = self.create_publisher(String, '/dashboard/topic_activity', 10)
        
        self.tracked_topics = []
        self.subs = {}
        self.message_counts = {}
        self.last_publish_time = time.time()
        
        # Publish at 2Hz
        self.timer = self.create_timer(0.5, self.publish_activity)

    def handle_request(self, msg):
        try:
            req = json.loads(msg.data)
            # req format: {"node": "/node_name", "topics": [{"topic": "/t1", "type": "std_msgs/msg/String"}, ...]}
            new_topics = req.get('topics', [])
            
            # Clean up old subscriptions
            for topic, sub in self.subs.items():
                self.destroy_subscription(sub)
            self.subs.clear()
            self.message_counts.clear()
            self.tracked_topics = new_topics
            
            # Create new subscriptions
            qos = QoSProfile(
                history=QoSHistoryPolicy.KEEP_LAST,
                depth=1,
                reliability=QoSReliabilityPolicy.BEST_EFFORT
            )
            
            for t_info in self.tracked_topics:
                topic_name = t_info['topic']
                topic_type_str = t_info.get('type')
                
                if not topic_type_str or topic_type_str == "Unbekannt":
                    # Try to resolve type from graph
                    topic_types = self.get_topic_names_and_types()
                    for t, types in topic_types:
                        if t == topic_name and types:
                            topic_type_str = types[0]
                            break
                            
                if not topic_type_str or topic_type_str == "Unbekannt":
                    continue
                
                try:
                    # e.g. "std_msgs/msg/String"
                    msg_class = get_message(topic_type_str)
                    if msg_class:
                        self.message_counts[topic_name] = 0
                        
                        # create closure to capture topic name
                        def make_cb(t_name):
                            def cb(msg):
                                self.message_counts[t_name] += 1
                            return cb
                            
                        self.subs[topic_name] = self.create_subscription(
                            msg_class, topic_name, make_cb(topic_name), qos)
                except Exception as e:
                    self.get_logger().error(f"Failed to sub to {topic_name}: {e}")
                    
        except Exception as e:
            self.get_logger().error(f"Error handling request: {e}")

    def publish_activity(self):
        current_time = time.time()
        dt = current_time - self.last_publish_time
        self.last_publish_time = current_time
        
        if not self.tracked_topics:
            return
            
        activity_data = {}
        for topic, count in self.message_counts.items():
            hz = count / dt if dt > 0 else 0
            activity_data[topic] = {"hz": round(hz, 1), "active": count > 0}
            # Reset counter
            self.message_counts[topic] = 0
            
        self.activity_pub.publish(String(data=json.dumps(activity_data)))

def main(args=None):
    rclpy.init(args=args)
    node = LiveTopicTracker()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
