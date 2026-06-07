#!/usr/bin/env python3

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import PointCloud2, PointField
import sensor_msgs_py.point_cloud2 as pc2
import numpy as np



class PointCloudOptimizerNode(Node):
    def __init__(self):
        super().__init__('pointcloud_optimizer')
        
        # Parameters
        self.declare_parameter('voxel_size', 0.05)
        self.voxel_size = self.get_parameter('voxel_size').value
        
        self.declare_parameter('nb_neighbors', 20)
        self.nb_neighbors = self.get_parameter('nb_neighbors').value
        
        self.declare_parameter('std_ratio', 2.0)
        self.std_ratio = self.get_parameter('std_ratio').value
        
        # Subscriber
        self.subscription = self.create_subscription(
            PointCloud2,
            '/zed/zed_node/point_cloud/cloud_registered',
            self.listener_callback,
            10
        )
        
        # Publisher
        self.publisher = self.create_publisher(
            PointCloud2,
            '/zed/zed_node/point_cloud/cloud_optimized',
            10
        )
        
        self.get_logger().info('Point Cloud Optimizer Node (Pure Numpy) has been started.')

    def listener_callback(self, msg):


        # Read points
        gen = pc2.read_points(msg, field_names=("x", "y", "z", "rgb"), skip_nans=True)
        points_data = list(gen)
        
        if not points_data:
            return
            
        points_data = np.array(points_data)
        if len(points_data.shape) != 2 or points_data.shape[1] < 3:
            return

        xyz = points_data[:, :3]
        
        # --- Apply Optical to ROS Rotation ---
        # Optical: Z=forward, X=right, Y=down
        # ROS: X=forward, Y=left, Z=up
        xyz_ros = np.empty_like(xyz)
        xyz_ros[:, 0] = xyz[:, 2]   # X_ros = Z_opt
        xyz_ros[:, 1] = -xyz[:, 0]  # Y_ros = -X_opt
        xyz_ros[:, 2] = -xyz[:, 1]  # Z_ros = -Y_opt
        xyz = xyz_ros
        # -------------------------------------
        
        # Extract RGB if present
        has_rgb = False
        if points_data.shape[1] >= 4:
            has_rgb = True
            rgb_float = points_data[:, 3]
            rgb_uint32 = rgb_float.view(np.uint32)
            r = ((rgb_uint32 >> 16) & 0x000000FF) / 255.0
            g = ((rgb_uint32 >> 8) & 0x000000FF) / 255.0
            b = (rgb_uint32 & 0x000000FF) / 255.0
            colors = np.vstack((r, g, b)).T

        # Optimization 1: Voxel Downsampling (Pure Numpy - Hash Based)
        if self.voxel_size > 0:
            voxel_coords = np.floor(xyz / self.voxel_size).astype(np.int32)
            
            # Fast 1D hash for unique voxel identification
            voxel_coords_64 = voxel_coords.astype(np.int64)
            hashes = voxel_coords_64[:, 0] * 73856093 ^ voxel_coords_64[:, 1] * 19349663 ^ voxel_coords_64[:, 2] * 83492791
            
            _, unique_indices = np.unique(hashes, return_index=True)
            
            xyz = xyz[unique_indices]
            if has_rgb:
                colors = colors[unique_indices]

        # Optimization 2: Statistical Outlier Removal
        if self.nb_neighbors > 0:
            self.get_logger().warn_once('Statistical Outlier Removal is currently disabled to support Numpy 2.x natively without Open3D.')

        optimized_xyz = xyz
        if len(optimized_xyz) == 0:
            return
            
        fields = [
            PointField(name='x', offset=0, datatype=PointField.FLOAT32, count=1),
            PointField(name='y', offset=4, datatype=PointField.FLOAT32, count=1),
            PointField(name='z', offset=8, datatype=PointField.FLOAT32, count=1),
        ]
        
        if has_rgb:
            optimized_colors = colors * 255.0
            optimized_colors = np.clip(optimized_colors, 0, 255).astype(np.uint32)
            # Pack rgb
            rgb = (optimized_colors[:, 0] << 16) | (optimized_colors[:, 1] << 8) | optimized_colors[:, 2]
            rgb_float = rgb.view(np.float32)
            
            points_out = np.empty(len(optimized_xyz), dtype=[('x', np.float32), ('y', np.float32), ('z', np.float32), ('rgb', np.float32)])
            points_out['x'] = optimized_xyz[:, 0]
            points_out['y'] = optimized_xyz[:, 1]
            points_out['z'] = optimized_xyz[:, 2]
            points_out['rgb'] = rgb_float
            
            fields.append(PointField(name='rgb', offset=12, datatype=PointField.FLOAT32, count=1))
        else:
            points_out = np.empty(len(optimized_xyz), dtype=[('x', np.float32), ('y', np.float32), ('z', np.float32)])
            points_out['x'] = optimized_xyz[:, 0]
            points_out['y'] = optimized_xyz[:, 1]
            points_out['z'] = optimized_xyz[:, 2]
            
        header = msg.header
        header.frame_id = 'zed_camera_link'
        
        msg_out = pc2.create_cloud(header, fields, points_out.tolist())
        self.publisher.publish(msg_out)

def main(args=None):
    rclpy.init(args=args)
    node = PointCloudOptimizerNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        if rclpy.ok():
            rclpy.shutdown()

if __name__ == '__main__':
    main()
