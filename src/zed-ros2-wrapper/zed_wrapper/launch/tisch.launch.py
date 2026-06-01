import os
from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch_ros.actions import Node
from ament_index_python.packages import get_package_share_directory

def generate_launch_description():
    
    # 1. ZED Parameter konfigurieren
    # Wir aktivieren OD und Tracking, aber verbieten der ZED, unsere Tisch-TFs zu überschreiben!
    zed_params = (
        'object_detection.od_enabled:=true;'
        'pos_tracking.pos_tracking_enabled:=true;'
        'pos_tracking.publish_tf:=false;'
        'pos_tracking.publish_map_tf:=false;'
        'pos_tracking.set_gravity_as_origin:=false'
    )

    zed_wrapper_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource([
            os.path.join(get_package_share_directory('zed_wrapper'), 'launch', 'zed_camera.launch.py')
        ]),
        launch_arguments={
            'camera_model': 'zedm',
            'camera_name': 'zed',
            'param_overrides': zed_params
        }.items()
    )

    # 2. Statischer TF: Tisch (base_link) -> Kamera
    static_tf = Node(
        package='tf2_ros',
        executable='static_transform_publisher',
        name='camera_base_link_tf',
        arguments=[
            '--x', '0.0', 
            '--y', '0.0', 
            '--z', '0.6',
            '--yaw', '0.0', 
            '--pitch', '0.78539', 
            '--roll', '0.0',
            '--frame-id', 'base_link', 
            '--child-frame-id', 'zed_camera_link'
        ]
    )

    # 3. RViz2 starten
    rviz_config = os.path.join(get_package_share_directory('zed_display_rviz2'), 'rviz2', 'zed_stereo.rviz')
    rviz_node = Node(
        package='rviz2',
        executable='rviz2',
        name='zed_rviz2',
        arguments=['-d', rviz_config]
    )

    return LaunchDescription([
        static_tf,
        zed_wrapper_launch,
        rviz_node
    ])
