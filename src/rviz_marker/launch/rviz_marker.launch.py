import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch_ros.actions import Node
from launch_ros.parameter_descriptions import ParameterValue
from launch.substitutions import Command

def generate_launch_description():
    # 1. Pfad zur Xacro/URDF Datei im install-Verzeichnis holen
    pkg_dir = get_package_share_directory('rviz_marker')
    urdf_file = os.path.join(pkg_dir, 'urdf', 'robot_scene.urdf.xacro')

    # 2. Xacro-Befehl ausführen, um die Datei zu parsen
    robot_description_content = ParameterValue(Command(['xacro ', urdf_file]), value_type=str)

    # 3. Node 1: Der Robot State Publisher für die Szene (Kamera, Stative, Platten)
    rsp_node = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        name='scene_state_publisher',
        parameters=[{'robot_description': robot_description_content}],
        remappings=[('robot_description', '/scene_description')]
    )

    # 4. Node 2: Der Marker Publisher für das Liniennetz und die Hohlkörper
    marker_node = Node(
        package='rviz_marker',
        executable='marker_publisher',
        name='marker_publisher'
    )

    # 5. Beide Nodes gleichzeitig starten
    return LaunchDescription([
        rsp_node,
        marker_node
    ])
