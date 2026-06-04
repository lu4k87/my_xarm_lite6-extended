"""
zed_camera.launch.py — ZED M Bringup Launch File
==================================================
Startet den ZED M Kameratreiber (zed_wrapper) und publiziert gleichzeitig
die statische Koordinaten-Transformation (TF) zwischen dem Roboter-Basisrahmen
und dem ZED-Kamerarahmen.

Physische Konfiguration:
  - Kamera: Stereolabs ZED M, auf einem Stativ befestigt.
  - Position: Ca. 5.0 m in X-Richtung (vor dem Roboter), 0.5 m Höhe.
  - Ausrichtung: Kamera zeigt zurück zum Roboter (~180° Yaw),
                 leicht nach unten geneigt (~20° Pitch), um die
                 Tischplatte (Operationsbereich) aufzunehmen.

TF-Parameter (relativ zu link_base):
  x=5.0, y=0.0, z=0.5
  roll=0.0, pitch=-0.35 rad (~20° nach unten), yaw=3.14159 rad (180°, zurück zum Roboter)

Verwendung:
  ros2 launch zed_bringup zed_camera.launch.py

Kalibrierung:
  Wenn die Kamera physisch ausgemessen wird, können die TF-Parameter
  (x, y, z, roll, pitch, yaw) hier zentral angepasst werden.
  Alle Nodes (RViz2, Nexus etc.) übernehmen die Änderung automatisch.
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
    # Launch Arguments (für spätere Kalibrierung leicht anpassbar)
    # -----------------------------------------------------------------------
    camera_model_arg = DeclareLaunchArgument(
        'camera_model',
        default_value='zedm',
        description='ZED Kameramodell (zedm, zed, zed2, zed2i, zedx, zedxm)'
    )

    # TF: Position der Kamera relativ zu link_base
    # ANPASSEN: Wenn die Kamera physisch eingemessen wird, diese 6 Werte ändern!
    tf_x_arg = DeclareLaunchArgument('tf_x', default_value='0.75',
        description='Kamera X-Position relativ zu link_base [m]')
    tf_y_arg = DeclareLaunchArgument('tf_y', default_value='0.0',
        description='Kamera Y-Position relativ zu link_base [m]')
    tf_z_arg = DeclareLaunchArgument('tf_z', default_value='0.5',
        description='Kamera Z-Position (Höhe) relativ zu link_base [m]')
    tf_roll_arg = DeclareLaunchArgument('tf_roll', default_value='0.0',
        description='Kamera Roll-Winkel [rad]')
    tf_pitch_arg = DeclareLaunchArgument('tf_pitch', default_value='0.785',
        description='Kamera Pitch-Winkel [rad] (positiv = nach unten geneigt, 0.785 = 45°)')
    tf_yaw_arg = DeclareLaunchArgument('tf_yaw', default_value='3.14159',
        description='Kamera Yaw-Winkel [rad] (3.14159 = 180°, zeigt zum Roboter)')

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
            LaunchConfiguration('tf_x'),
            LaunchConfiguration('tf_y'),
            LaunchConfiguration('tf_z'),
            LaunchConfiguration('tf_yaw'),
            LaunchConfiguration('tf_pitch'),
            LaunchConfiguration('tf_roll'),
            'link_base',        # Elternrahmen (Roboterbasis)
            'zed_camera_link',  # Kindrahmen (ZED-Kamera)
        ],
        output='screen'
    )

    # -----------------------------------------------------------------------
    # ZED Stativ (3D Marker) Publisher
    # -----------------------------------------------------------------------
    zed_stand_publisher_node = Node(
        package='my_zed_tf_bringup',
        executable='zed_stand_publisher.py',
        name='zed_stand_publisher',
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
        zed_stand_publisher_node,
    ])
