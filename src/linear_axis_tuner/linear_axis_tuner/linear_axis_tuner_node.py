#!/usr/bin/env python3

import rclpy
from rclpy.node import Node
from geometry_msgs.msg import TransformStamped
from tf2_ros import TransformBroadcaster
from visualization_msgs.msg import Marker, MarkerArray
from std_msgs.msg import Float64

class LinearAxisTuner(Node):
    def __init__(self):
        super().__init__('linear_axis_tuner')
        self.tf_broadcaster = TransformBroadcaster(self)
        self.marker_pub = self.create_publisher(MarkerArray, '/visualization_marker_array', 10)
        
        # Subscribe to command from Web UI
        self.sub = self.create_subscription(Float64, '/linear_axis_cmd', self.cmd_callback, 10)
        
        self.current_position = 0.0
        self.get_logger().info(f'Linear axis initialized at position: {self.current_position:.3f} m')

        # Timer to publish TF and Markers
        self.timer = self.create_timer(0.05, self.timer_callback) # 20 Hz

    def cmd_callback(self, msg):
        if self.current_position != msg.data:
            self.current_position = msg.data
            self.get_logger().info(f'Linear axis position updated to: {self.current_position:.3f} m')

    def timer_callback(self):
        now = self.get_clock().now().to_msg()
        
        # Publish TF
        t = TransformStamped()
        t.header.stamp = now
        t.header.frame_id = 'world'
        t.child_frame_id = 'linear_axis_link'
        
        # Translation on Y-Axis
        t.transform.translation.x = 0.0
        t.transform.translation.y = self.current_position
        t.transform.translation.z = 0.0
        
        t.transform.rotation.x = 0.0
        t.transform.rotation.y = 0.0
        t.transform.rotation.z = 0.0
        t.transform.rotation.w = 1.0

        self.tf_broadcaster.sendTransform(t)

        # Publish visual markers for the rail (MarkerArray)
        marker_array = MarkerArray()

        # 1. Main Rail (Fixed in world)
        main_rail = Marker()
        main_rail.header.stamp = now
        main_rail.header.frame_id = 'world'
        main_rail.ns = 'linear_axis_rail'
        main_rail.id = 0
        main_rail.type = Marker.CUBE
        main_rail.action = Marker.ADD
        main_rail.pose.position.x = 0.0
        main_rail.pose.position.y = 0.0
        main_rail.pose.position.z = -0.04
        main_rail.pose.orientation.w = 1.0
        main_rail.scale.x = 0.15 # width
        main_rail.scale.y = 1.2  # length
        main_rail.scale.z = 0.03 # height
        # White color to match the robot
        main_rail.color.r = 0.95
        main_rail.color.g = 0.95
        main_rail.color.b = 0.95
        main_rail.color.a = 1.0
        marker_array.markers.append(main_rail)
        
        # 2. Guide Rail Left (Fixed in world)
        guide_left = Marker()
        guide_left.header.stamp = now
        guide_left.header.frame_id = 'world'
        guide_left.ns = 'linear_axis_rail'
        guide_left.id = 1
        guide_left.type = Marker.CUBE
        guide_left.action = Marker.ADD
        guide_left.pose.position.x = 0.04
        guide_left.pose.position.y = 0.0
        guide_left.pose.position.z = -0.015
        guide_left.pose.orientation.w = 1.0
        guide_left.scale.x = 0.02
        guide_left.scale.y = 1.2
        guide_left.scale.z = 0.02
        guide_left.color.r = 0.7
        guide_left.color.g = 0.7
        guide_left.color.b = 0.7
        guide_left.color.a = 1.0
        marker_array.markers.append(guide_left)

        # 3. Guide Rail Right (Fixed in world)
        guide_right = Marker()
        guide_right.header.stamp = now
        guide_right.header.frame_id = 'world'
        guide_right.ns = 'linear_axis_rail'
        guide_right.id = 2
        guide_right.type = Marker.CUBE
        guide_right.action = Marker.ADD
        guide_right.pose.position.x = -0.04
        guide_right.pose.position.y = 0.0
        guide_right.pose.position.z = -0.015
        guide_right.pose.orientation.w = 1.0
        guide_right.scale.x = 0.02
        guide_right.scale.y = 1.2
        guide_right.scale.z = 0.02
        guide_right.color.r = 0.7
        guide_right.color.g = 0.7
        guide_right.color.b = 0.7
        guide_right.color.a = 1.0
        marker_array.markers.append(guide_right)

        # 4. Carriage (Moves with the robot base)
        carriage = Marker()
        carriage.header.stamp = now
        # Attached to linear_axis_link so it moves automatically with the robot
        carriage.header.frame_id = 'linear_axis_link'
        carriage.ns = 'linear_axis_carriage'
        carriage.id = 3
        carriage.type = Marker.CUBE
        carriage.action = Marker.ADD
        carriage.pose.position.x = 0.0
        carriage.pose.position.y = 0.0
        carriage.pose.position.z = -0.01
        carriage.pose.orientation.w = 1.0
        carriage.scale.x = 0.16
        carriage.scale.y = 0.16
        carriage.scale.z = 0.02
        carriage.color.r = 0.8
        carriage.color.g = 0.8
        carriage.color.b = 0.8
        carriage.color.a = 1.0
        marker_array.markers.append(carriage)

        self.marker_pub.publish(marker_array)


def main(args=None):
    rclpy.init(args=args)
    tuner = LinearAxisTuner()
    try:
        rclpy.spin(tuner)
    except KeyboardInterrupt:
        pass
    finally:
        tuner.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
