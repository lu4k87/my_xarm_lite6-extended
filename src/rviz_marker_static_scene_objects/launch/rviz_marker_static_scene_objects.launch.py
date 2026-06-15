import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch_ros.actions import Node
from launch_ros.parameter_descriptions import ParameterValue
from launch.substitutions import Command

def generate_launch_description():
    # 4. Node 2: Der Marker Publisher für das Liniennetz und die Hohlkörper
    marker_node = Node(
        package='rviz_marker_static_scene_objects',
        executable='rviz_marker_static_scene_objects',
        name='rviz_marker_static_scene_objects'
    )

    # 5. Node starten
    return LaunchDescription([
        marker_node
    ])
