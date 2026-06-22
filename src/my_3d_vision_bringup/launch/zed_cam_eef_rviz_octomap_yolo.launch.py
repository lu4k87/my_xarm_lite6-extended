"""
zed_cam_eef_rviz_octomap_yolo.launch.py — 3D Vision Bringup Launch File (EEF Mounted)
==================================================
Startet den ZED M Kameratreiber (zed_wrapper) und publiziert gleichzeitig
die statische Koordinaten-Transformation (TF) zwischen dem Endeffektor (link_tcp)
und dem ZED-Kamerarahmen. Baut zusätzlich eine 3D-Octomap auf.

Physische Konfiguration:
  - Kamera: Stereolabs ZED M, am Endeffektor (EEF / link_tcp) befestigt.
  - Position: Muss je nach Halterung kalibriert werden.

TF-Parameter (relativ zu link_tcp):
  (Standardwerte für Testzwecke: x=0.0, y=0.0, z=0.1)

Verwendung:
  ros2 launch my_3d_vision_bringup zed_cam_eef_rviz_octomap_yolo.launch.py

Kalibrierung:
  Wenn die Kamera physisch ausgemessen wird, können die TF-Parameter
  (x, y, z, roll, pitch, yaw) hier zentral angepasst werden.
"""

from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node
from launch.actions import IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from ament_index_python.packages import get_package_share_directory
import os


def generate_launch_description():

    # -----------------------------------------------------------------------
    # Setup Paths
    # -----------------------------------------------------------------------
    pkg_share = get_package_share_directory('my_3d_vision_bringup')
    grasping_params_file = os.path.join(pkg_share, 'config', 'grasping_params.yaml')
    perception_params_file = os.path.join(pkg_share, 'config', 'perception_params.yaml')

    # -----------------------------------------------------------------------
    # Launch Arguments (für spätere Kalibrierung leicht anpassbar)
    # -----------------------------------------------------------------------
    camera_model_arg = DeclareLaunchArgument(
        'camera_model',
        default_value='zedm',
        description='ZED Kameramodell (zedm, zed, zed2, zed2i, zedx, zedxm)'
    )

    # TF: Position der Kamera relativ zu link_tcp
    # ANPASSEN: Wenn die Kamera physisch eingemessen wird, diese 6 Werte ändern!
    tf_x_arg = DeclareLaunchArgument('tf_x', default_value='0.0',
        description='Kamera X-Position relativ zu link_tcp [m]')
    tf_y_arg = DeclareLaunchArgument('tf_y', default_value='0.0',
        description='Kamera Y-Position relativ zu link_tcp [m]')
    tf_z_arg = DeclareLaunchArgument('tf_z', default_value='0.1',
        description='Kamera Z-Position relativ zu link_tcp [m]')
    tf_roll_arg = DeclareLaunchArgument('tf_roll', default_value='0.0',
        description='Kamera Roll-Winkel [rad]')
    tf_pitch_arg = DeclareLaunchArgument('tf_pitch', default_value='0.0',
        description='Kamera Pitch-Winkel [rad]')
    tf_yaw_arg = DeclareLaunchArgument('tf_yaw', default_value='0.0',
        description='Kamera Yaw-Winkel [rad]')

    # Path to parameter override
    config_override_path = os.path.join(
        get_package_share_directory('my_3d_vision_bringup'),
        'config',
        'zed_override.yaml'
    )

    # -----------------------------------------------------------------------
    # ZED Wrapper Launch
    # -----------------------------------------------------------------------
    zed_wrapper_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(
                get_package_share_directory('zed_wrapper'),
                'launch',
                'zed_camera.launch.py'
            )
        ),
        launch_arguments={
            'camera_model': LaunchConfiguration('camera_model'),
            'publish_tf': 'false',
            'publish_map_tf': 'false',
            'ros_params_override_path': config_override_path,
        }.items()
    )

    # -----------------------------------------------------------------------
    # Statischer TF Publisher: link_base → zed_camera_link
    # Verbindet die Kamerawelt mit der Roboterwelt in RViz2 / TF-Baum.
    # -----------------------------------------------------------------------
    static_tf_node = Node(
        package='tf2_ros',
        executable='static_transform_publisher',
        name='zed_static_tf_publisher',
        arguments=[
            '--x', LaunchConfiguration('tf_x'),
            '--y', LaunchConfiguration('tf_y'),
            '--z', LaunchConfiguration('tf_z'),
            '--yaw', LaunchConfiguration('tf_yaw'),
            '--pitch', LaunchConfiguration('tf_pitch'),
            '--roll', LaunchConfiguration('tf_roll'),
            '--frame-id', 'link_tcp',               # Elternrahmen (Endeffektor)
            '--child-frame-id', 'zed_camera_link',  # Kindrahmen (ZED-Kamera)
        ],
        output='screen'
    )

    # -----------------------------------------------------------------------
    # ZED Stativ (3D Marker) Publisher (deaktiviert für EEF, da Kamera am Arm ist)
    # -----------------------------------------------------------------------
    # zed_stand_publisher_node = Node(
    #     package='my_3d_vision_bringup',
    #     executable='zed_stand_publisher.py',
    #     name='zed_stand_publisher',
    #     output='screen'
    # )

    # -----------------------------------------------------------------------
    # Octomap Server (Generiert die 3D Voxelkarte aus der Punktwolke)
    # -----------------------------------------------------------------------
    octomap_server_node = Node(
        package='octomap_server',
        executable='octomap_server_node',
        name='octomap_server',
        output='screen',
        parameters=[{
            'resolution': 0.02,          # 2cm Voxelgröße
            'frame_id': 'link_base',     # Globale Karte relativ zum Roboterfuß
            'base_frame_id': 'link_base',
            'sensor_model/max_range': 2.0, # Ignoriere alles, was weiter als 2m weg ist
            'latch': False
        }],
        remappings=[
            ('cloud_in', '/zed/zed_node/point_cloud/cloud_registered')
        ]
    )

    # -----------------------------------------------------------------------
    # PointCloud ROI Optimizer (Crops Top 50% Background)
    # -----------------------------------------------------------------------
    pointcloud_optimizer_node = Node(
        package='my_3d_vision_bringup',
        executable='pointcloud_optimizer.py',
        name='pointcloud_optimizer',
        output='screen'
    )

    # -----------------------------------------------------------------------
    # YOLO MoveIt Collision Node
    # -----------------------------------------------------------------------
    yolo_moveit_collision_node = Node(
        package='my_3d_vision_bringup',
        executable='yolo_moveit_collision.py',
        name='yolo_moveit_collision',
        output='screen'
    )


    # -----------------------------------------------------------------------
    # YOLO Grasp Executor Node (Planned MoveIt Version)
    # -----------------------------------------------------------------------
    # Backup: old servo-based node
    # yolo_grasp_executor_node = Node(
    #     package='my_3d_vision_bringup',
    #     executable='yolo_grasp_executor.py',
    #     name='yolo_grasp_executor',
    #     output='screen'
    # )
    
    yolo_planned_grasp_executor_node = Node(
        package='my_3d_vision_bringup',
        executable='yolo_planned_grasp_executor.py',
        name='yolo_planned_grasp_executor',
        output='screen',
        parameters=[grasping_params_file]
    )

    # -----------------------------------------------------------------------
    # YOLO 3D BBox Node
    # -----------------------------------------------------------------------
    zed_yolo_3d_bbox_node = Node(
        package='my_3d_vision_bringup',
        executable='zed_yolo_3d_bbox.py',
        name='zed_yolo_3d_bbox',
        output='screen',
        parameters=[perception_params_file]
    )

    grasp_action_bridge_node = Node(
        package='my_3d_vision_bringup',
        executable='grasp_action_bridge.py',
        name='grasp_action_bridge',
        output='screen'
    )

    return LaunchDescription([
        # Arguments
        camera_model_arg,
        tf_x_arg,
        tf_y_arg,
        tf_z_arg,
        tf_roll_arg,
        tf_pitch_arg,
        tf_yaw_arg,
        # Nodes
        zed_wrapper_launch,
        static_tf_node,
        octomap_server_node,
        pointcloud_optimizer_node,
        yolo_moveit_collision_node,
        yolo_planned_grasp_executor_node,
        zed_yolo_3d_bbox_node,
        grasp_action_bridge_node,
    ])
