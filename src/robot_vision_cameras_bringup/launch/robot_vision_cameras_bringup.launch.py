"""
robot_vision_cameras_bringup.launch.py — Robot Vision & Cameras Bringup Launch File
===================================================================================
Unterstützt zwei Kamera-Modi (wählbar über 'camera:=zed_m' oder 'camera:=ip_cam'):

1. zed_m (Standard):
   - Startet den Stereolabs ZED M Kameratreiber (zed_wrapper).
   - Publiziert die statische TF-Transformation (world → zed_camera_link).
   - Startet den PointCloud ROI Optimizer (pointcloud_optimizer.py).
   - Startet die 3D Bounding-Box Erkennung über ZED Punktwolke (yolo_3d_bbox_for_zed_m.py).

2. ip_cam:
   - Startet die IP-Kamera 3D Bounding-Box Erkennung über ArUco-Homographie (yolo_3d_bbox_for_ip_cam.py).
   - Startet den ArUco 6-Pose TF Coordinate Node (ip_cam_aruco_6pose_tf_coord).
   - Benötigt keine ZED-Hardware oder Punktwolke.

Gemeinsame Pipeline (in beiden Modi aktiv):
   - YOLO MoveIt Collision Node (yolo_moveit_collision.py)
   - YOLO Planned Grasp Executor Node (yolo_planned_grasp_executor.py)
   - Grasp Action Bridge Node (grasp_action_bridge.py)
   - Virtuelle Objekt-Erkennung (virtual_object_detections.py): Cube, Rectangle
     und Cylinder aus dem TF Tuner als "erkannte" Objekte. Startet AUS, der
     Schalter sitzt im SCENE-Tab der Robot Control UI.

Verwendung:
   ros2 launch robot_vision_cameras_bringup robot_vision_cameras_bringup.launch.py camera:=zed_m
   ros2 launch robot_vision_cameras_bringup robot_vision_cameras_bringup.launch.py camera:=ip_cam
"""

from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription
from launch.substitutions import LaunchConfiguration, PythonExpression
from launch.conditions import IfCondition, LaunchConfigurationEquals
from launch_ros.actions import Node
from launch.launch_description_sources import PythonLaunchDescriptionSource
from ament_index_python.packages import get_package_share_directory, PackageNotFoundError
import os
import yaml


def _yaml_params(path, node):
    """ros__parameters eines Nodes aus einer Config-YAML ({} bei Fehler)."""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return (yaml.safe_load(f) or {}).get(node, {}).get('ros__parameters', {}) or {}
    except (OSError, yaml.YAMLError):
        return {}


def _yaml_arg(name, params, fallback, description):
    """Launch-Argument, dessen Standard aus der Config-YAML kommt.

    Die YAML bleibt die Quelle der Werte; das Argument erlaubt nur ein
    gezieltes Ueberschreiben beim Start (z.B. aus der Nexus Webapp).
    """
    return DeclareLaunchArgument(name, default_value=str(params.get(name, fallback)),
                                 description=description)


def generate_launch_description():

    # -----------------------------------------------------------------------
    # Setup Paths
    # -----------------------------------------------------------------------
    pkg_share = get_package_share_directory('robot_vision_cameras_bringup')
    grasping_params_file = os.path.join(pkg_share, 'config', 'grasping_params.yaml')
    perception_params_file = os.path.join(pkg_share, 'config', 'perception_params.yaml')

    # -----------------------------------------------------------------------
    # Launch Arguments
    # -----------------------------------------------------------------------
    camera_arg = DeclareLaunchArgument(
        'camera',
        default_value='zed_m',
        choices=['zed_m', 'ip_cam'],
        description='Aktive Kameraquelle: zed_m (Stereolabs ZED Mini) oder ip_cam (HTTP IP-Kamera .123)'
    )

    camera_model_arg = DeclareLaunchArgument(
        'camera_model',
        default_value='zedm',
        description='ZED Kameramodell (zedm, zed, zed2, zed2i, zedx, zedxm)'
    )

    # TF: Position der ZED-Kamera relativ zu link_base / world
    tf_x_arg = DeclareLaunchArgument('tf_x', default_value='0.473',
        description='Kamera X-Position relativ zu link_base [m]')
    tf_y_arg = DeclareLaunchArgument('tf_y', default_value='0.0',
        description='Kamera Y-Position relativ zu link_base [m]')
    tf_z_arg = DeclareLaunchArgument('tf_z', default_value='0.368',
        description='Kamera Z-Position (Höhe) relativ zu link_base [m]')
    tf_roll_arg = DeclareLaunchArgument('tf_roll', default_value='0.0',
        description='Kamera Roll-Winkel [rad] (0.0 = 0.0°)')
    tf_pitch_arg = DeclareLaunchArgument('tf_pitch', default_value='1.00356',
        description='Kamera Pitch-Winkel [rad] (positiv = nach unten geneigt, 1.00356 = ~57.5°)')
    tf_yaw_arg = DeclareLaunchArgument('tf_yaw', default_value='3.14159',
        description='Kamera Yaw-Winkel [rad] (3.14159 = 180°, zeigt zum Roboter)')

    yolo_model_arg = DeclareLaunchArgument('yolo_model', default_value='yolov8l.pt',
        description='YOLO Modell-Datei (z.B. yolov8l.pt, yolov8s.pt, my_yolo_model.pt)')

    # Config-Parameter (Standard aus perception_params.yaml / grasping_params.yaml)
    perception = _yaml_params(perception_params_file, 'yolo_3d_bbox_for_zed_m')
    grasping = _yaml_params(grasping_params_file, 'yolo_planned_grasp_executor')
    config_args = [
        _yaml_arg('confidence_threshold', perception, 0.35,
                  'YOLO Konfidenz-Schwelle (0..1) - perception_params.yaml'),
        _yaml_arg('ema_alpha', perception, 0.4,
                  'EMA-Glaettung der 3D-Boxen (0..1, kleiner = ruhiger) - perception_params.yaml'),
        _yaml_arg('safe_z_hover_height', grasping, 0.15,
                  'Sichere Hover-Hoehe ueber dem Objekt [m] - grasping_params.yaml'),
        _yaml_arg('grasp_z_offset', grasping, 0.02,
                  'Z-Offset auf die Objekt-Oberkante beim Greifen [m] - grasping_params.yaml'),
        _yaml_arg('velocity_scaling', grasping, 0.2,
                  'MoveIt Geschwindigkeits-Skalierung der Greifbewegung (0..1) - grasping_params.yaml'),
        _yaml_arg('acceleration_scaling', grasping, 0.1,
                  'MoveIt Beschleunigungs-Skalierung der Greifbewegung (0..1) - grasping_params.yaml'),
    ]

    # Path to parameter override
    config_override_path = os.path.join(
        get_package_share_directory('robot_vision_cameras_bringup'),
        'config',
        'zed_override.yaml'
    )

    # -----------------------------------------------------------------------
    # ZED Wrapper Launch (Nur aktiv wenn camera==zed_m)
    # -----------------------------------------------------------------------
    zed_wrapper_launch = None
    try:
        zed_share = get_package_share_directory('zed_wrapper')
        zed_launch_file = os.path.join(zed_share, 'launch', 'zed_camera.launch.py')
        zed_wrapper_launch = IncludeLaunchDescription(
            PythonLaunchDescriptionSource(zed_launch_file),
            launch_arguments={
                'camera_model': LaunchConfiguration('camera_model'),
                'publish_tf': 'false',
                'publish_map_tf': 'false',
                'ros_params_override_path': config_override_path,
            }.items(),
            condition=LaunchConfigurationEquals('camera', 'zed_m')
        )
    except PackageNotFoundError:
        pass  # zed_wrapper is missing, so we just don't add it

    # -----------------------------------------------------------------------
    # Statischer TF Publisher: world → zed_camera_link (nur für ZED M)
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
            '--frame-id', 'world',
            '--child-frame-id', 'zed_camera_link',
        ],
        output='screen',
        condition=LaunchConfigurationEquals('camera', 'zed_m')
    )

    # -----------------------------------------------------------------------
    # PointCloud ROI Optimizer (Crops Top 50% Background - nur für ZED M)
    # -----------------------------------------------------------------------
    pointcloud_optimizer_node = Node(
        package='robot_vision_cameras_bringup',
        executable='pointcloud_optimizer.py',
        name='pointcloud_optimizer',
        output='screen',
        condition=LaunchConfigurationEquals('camera', 'zed_m')
    )

    # -----------------------------------------------------------------------
    # YOLO 3D BBox Node: ZED M (Punktwolken-Clusterung)
    # -----------------------------------------------------------------------
    zed_yolo_3d_bbox_node = Node(
        package='robot_vision_cameras_bringup',
        executable='yolo_3d_bbox_for_zed_m.py',
        name='yolo_3d_bbox_for_zed_m',
        output='screen',
        parameters=[
            perception_params_file,
            {
                'model_path': LaunchConfiguration('yolo_model'),
                'confidence_threshold': LaunchConfiguration('confidence_threshold'),
                'ema_alpha': LaunchConfiguration('ema_alpha'),
            },
        ],
        condition=LaunchConfigurationEquals('camera', 'zed_m')
    )

    # -----------------------------------------------------------------------
    # YOLO 3D BBox Node: IP Camera (Homographie & ArUco-Erkennung)
    # -----------------------------------------------------------------------
    ip_cam_yolo_3d_bbox_node = Node(
        package='robot_vision_cameras_bringup',
        executable='yolo_3d_bbox_for_ip_cam.py',
        name='yolo_3d_bbox_for_ip_cam',
        output='screen',
        parameters=[
            {'model_path': LaunchConfiguration('yolo_model')}
        ],
        condition=LaunchConfigurationEquals('camera', 'ip_cam')
    )

    # -----------------------------------------------------------------------
    # ArUco 6-Pose TF Coord Node: IP Camera (nur für IP Cam Modus)
    # -----------------------------------------------------------------------
    ip_cam_aruco_node = Node(
        package='ip_cam_aruco_6pose_tf_coord',
        executable='ip_cam_aruco_6pose_tf_coord',
        name='ip_cam_aruco_6pose_tf_coord',
        output='screen',
        condition=LaunchConfigurationEquals('camera', 'ip_cam')
    )

    # -----------------------------------------------------------------------
    # Gemeinsame Vision- & Grasp-Pipeline (in beiden Modi aktiv)
    # -----------------------------------------------------------------------
    yolo_moveit_collision_node = Node(
        package='robot_vision_cameras_bringup',
        executable='yolo_moveit_collision.py',
        name='yolo_moveit_collision',
        output='screen'
    )

    yolo_planned_grasp_executor_node = Node(
        package='robot_vision_cameras_bringup',
        executable='yolo_planned_grasp_executor.py',
        name='yolo_planned_grasp_executor',
        output='screen',
        parameters=[
            grasping_params_file,
            {
                'safe_z_hover_height': LaunchConfiguration('safe_z_hover_height'),
                'grasp_z_offset': LaunchConfiguration('grasp_z_offset'),
                'velocity_scaling': LaunchConfiguration('velocity_scaling'),
                'acceleration_scaling': LaunchConfiguration('acceleration_scaling'),
            },
        ]
    )

    virtual_object_detections_node = Node(
        package='robot_vision_cameras_bringup',
        executable='virtual_object_detections.py',
        name='virtual_object_detections',
        output='screen'
    )

    grasp_action_bridge_node = Node(
        package='robot_vision_cameras_bringup',
        executable='grasp_action_bridge.py',
        name='grasp_action_bridge',
        output='screen'
    )

    rviz_object_distance_visualizer_node = Node(
        package='rviz_object_distance_visualizer',
        executable='rviz_object_distance_visualizer.py',
        name='rviz_object_distance_visualizer',
        output='screen'
    )

    rviz_servo_status_node = Node(
        package='rviz_overlay_servo_status',
        executable='rviz_servo_status',
        name='rviz_servo_status',
        output='screen'
    )

    ld = LaunchDescription([
        # Arguments
        camera_arg,
        camera_model_arg,
        yolo_model_arg,
        tf_x_arg,
        tf_y_arg,
        tf_z_arg,
        tf_roll_arg,
        tf_pitch_arg,
        tf_yaw_arg,
        *config_args,
        # Camera-specific Nodes
        static_tf_node,
        pointcloud_optimizer_node,
        zed_yolo_3d_bbox_node,
        ip_cam_yolo_3d_bbox_node,
        ip_cam_aruco_node,
        # Common Nodes
        yolo_moveit_collision_node,
        yolo_planned_grasp_executor_node,
        grasp_action_bridge_node,
        virtual_object_detections_node,
        rviz_object_distance_visualizer_node,
        rviz_servo_status_node,
    ])

    if zed_wrapper_launch is not None:
        ld.add_action(zed_wrapper_launch)

    return ld
