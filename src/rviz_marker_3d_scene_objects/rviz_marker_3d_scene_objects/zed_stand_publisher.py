#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from visualization_msgs.msg import Marker, MarkerArray
from ament_index_python.packages import get_package_share_directory
import os

class ZedVisualPublisher(Node):
    def __init__(self):
        super().__init__('zed_stand_publisher')
        # We publish a MarkerArray to easily combine multiple 3D elements
        self.publisher_ = self.create_publisher(MarkerArray, 'zed_visual_markers', 10)
        self.timer_ = self.create_timer(1.0, self.publish_markers)
        self.get_logger().info('ZED Visual Publisher (Stand + Mesh) Node started.')

    def publish_markers(self):
        marker_array = MarkerArray()
        
        # Set to 0 so RViz always uses the latest available transform
        now = rclpy.time.Time().to_msg()

        # =========================================================
        # MARKER 1: V-Slot Aluminum Profile (20x20mm) Stand
        h = 0.139
        cx = 0.530
        cy = 0.0
        cz = 0.0695
        
        # Color: Aluminum / Light Grey
        r, g, b, a = 0.8, 0.8, 0.8, 1.0  # Silver (Aluminum)
        
        def create_profile_part(m_id, dx, dy, sx, sy):
            m = Marker()
            m.header.frame_id = 'world'
            m.header.stamp = now
            m.ns = 'zed_visuals_stand'
            m.id = m_id
            m.type = Marker.CUBE
            m.action = Marker.ADD
            m.pose.position.x = cx + dx
            m.pose.position.y = cy + dy
            m.pose.position.z = cz
            m.pose.orientation.w = 1.0
            m.scale.x = sx
            m.scale.y = sy
            m.scale.z = h
            m.color.r = r
            m.color.g = g
            m.color.b = b
            m.color.a = a
            return m
            
        # Core (8x8mm)
        marker_array.markers.append(create_profile_part(1, 0.0, 0.0, 0.008, 0.008))
        
        # 4 Corners (6x6mm) placed at the outer edges to create a 20x20mm profile with an 8mm groove
        d = 0.007 # distance from center to corner center
        s = 0.006 # size of corner
        marker_array.markers.append(create_profile_part(2,  d,  d, s, s))
        marker_array.markers.append(create_profile_part(3,  d, -d, s, s))
        marker_array.markers.append(create_profile_part(4, -d,  d, s, s))
        marker_array.markers.append(create_profile_part(5, -d, -d, s, s))

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
        
        # Resolve absolute path to bypass potential RViz package:// resolution bugs
        pkg_share = get_package_share_directory('rviz_marker_3d_scene_objects')
        mesh_file_path = os.path.join(pkg_share, 'meshes', 'ZEDM.stl')
        camera_mesh.mesh_resource = "file://" + mesh_file_path
        
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

        # Color: Black (so it matches the real ZED M camera)
        camera_mesh.color.r = 0.05
        camera_mesh.color.g = 0.05
        camera_mesh.color.b = 0.05
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
