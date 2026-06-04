#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from visualization_msgs.msg import Marker, MarkerArray

class ZedVisualPublisher(Node):
    def __init__(self):
        super().__init__('zed_stand_publisher')
        # We publish a MarkerArray to easily combine multiple 3D elements
        self.publisher_ = self.create_publisher(MarkerArray, 'zed_visual_markers', 10)
        self.timer_ = self.create_timer(1.0, self.publish_markers)
        self.get_logger().info('ZED Visual Publisher (Stand + Mesh) Node started.')

    def publish_markers(self):
        marker_array = MarkerArray()
        
        now = self.get_clock().now().to_msg()

        # =========================================================
        # MARKER 1: The Aluminum Tripod/Stand
        # =========================================================
        stand = Marker()
        stand.header.frame_id = 'link_base'
        stand.header.stamp = now
        stand.ns = 'zed_visuals'
        stand.id = 1
        stand.type = Marker.CUBE
        stand.action = Marker.ADD

        # The camera TF is exactly at X=0.75, Z=0.5
        # The stand goes straight down from Z=0 to Z=0.5. Center is at Z=0.25
        stand.pose.position.x = 0.75
        stand.pose.position.y = 0.0
        stand.pose.position.z = 0.25
        
        # Upright
        stand.pose.orientation.x = 0.0
        stand.pose.orientation.y = 0.0
        stand.pose.orientation.z = 0.0
        stand.pose.orientation.w = 1.0

        # Scale: 2cm diameter, 50cm tall
        stand.scale.x = 0.02  
        stand.scale.y = 0.02
        stand.scale.z = 0.5   

        # Color: Aluminum / Light Grey
        stand.color.r = 0.7
        stand.color.g = 0.7
        stand.color.b = 0.7
        stand.color.a = 1.0
        
        marker_array.markers.append(stand)

        # =========================================================
        # MARKER 2: The Camera 3D Mesh (ZEDM.stl)
        # =========================================================
        camera_mesh = Marker()
        # By setting the frame to 'zed_camera_link', it automatically follows the pitch/yaw
        # from the static transform publisher!
        camera_mesh.header.frame_id = 'zed_camera_link'
        camera_mesh.header.stamp = now
        camera_mesh.ns = 'zed_visuals'
        camera_mesh.id = 2
        camera_mesh.type = Marker.MESH_RESOURCE
        camera_mesh.action = Marker.ADD
        camera_mesh.mesh_resource = "package://my_zed_tf_bringup/meshes/ZEDM.stl"
        camera_mesh.mesh_use_embedded_materials = False

        # Since it's attached directly to the camera frame, position is 0,0,0
        camera_mesh.pose.position.x = 0.0
        camera_mesh.pose.position.y = 0.0
        camera_mesh.pose.position.z = 0.0
        
        import math
        angle = -math.pi / 2.0  # -90 degrees
        camera_mesh.pose.orientation.x = 0.0
        camera_mesh.pose.orientation.y = 0.0
        camera_mesh.pose.orientation.z = math.sin(angle / 2.0)
        camera_mesh.pose.orientation.w = math.cos(angle / 2.0)

        # The mesh needs to be scaled down from millimeters to meters
        camera_mesh.scale.x = 0.001
        camera_mesh.scale.y = 0.001
        camera_mesh.scale.z = 0.001

        # Color: Dark Grey
        camera_mesh.color.r = 0.2
        camera_mesh.color.g = 0.2
        camera_mesh.color.b = 0.2
        camera_mesh.color.a = 1.0

        marker_array.markers.append(camera_mesh)

        # =========================================================
        
        self.publisher_.publish(marker_array)

def main(args=None):
    rclpy.init(args=args)
    node = ZedVisualPublisher()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
