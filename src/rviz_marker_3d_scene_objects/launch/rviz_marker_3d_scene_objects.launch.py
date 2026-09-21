import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch_ros.actions import Node
from launch_ros.parameter_descriptions import ParameterValue
from launch.substitutions import Command

def generate_launch_description():
    # Node 1: Marker Publisher für Liniennetz und Hohlkörper
    marker_node = Node(
        package='rviz_marker_3d_scene_objects',
        executable='rviz_marker_3d_scene_objects',
        name='rviz_marker_3d_scene_objects'
    )

    # Node 2: Template Plane Marker Publisher (DIN A4 Tisch-Schablone)
    plane_node = Node(
        package='rviz_marker_3d_scene_objects',
        executable='rviz_marker_3d_scene_plane',
        name='rviz_marker_3d_scene_plane'
    )

    # Node 3: Safety Zone Marker Publisher
    safety_zone_node = Node(
        package='rviz_marker_3d_scene_objects',
        executable='rviz_marker_3d_scene_safety_zone',
        name='rviz_marker_3d_scene_safety_zone'
    )

    # Node 4: ZED Stand + Mesh Publisher
    zedm_stand_node = Node(
        package='rviz_marker_3d_scene_objects',
        executable='rviz_marker_3d_scene_zedm_stand',
        name='rviz_marker_3d_scene_zedm_stand'
    )

    # Nodes starten
    return LaunchDescription([
        marker_node,
        plane_node,
        safety_zone_node,
        zedm_stand_node
    ])
