import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    
    # Pfad zur Konfigurationsdatei
    params_file = os.path.join(
        get_package_share_directory('yolo_object_detector'),
        'config',
        'yolo_params.yaml'
    )

    # Definition des Nodes
    yolo_detector_node = Node(
        package='yolo_object_detector',
        executable='yolo_detector_node',
        name='yolo_object_detector',
        output='screen',
        emulate_tty=True, # Stellt sicher, dass die Log-Ausgaben farbig sind
        parameters=[params_file]
    )
    
    return LaunchDescription([
        yolo_detector_node
    ])
