from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    port_arg = DeclareLaunchArgument(
        'port',
        default_value='8082',
        description='Port for Web Video Server'
    )

    web_video_server_node = Node(
        package='web_video_server',
        executable='web_video_server',
        name='http_web_video_server_p8082',
        parameters=[{
            'port': LaunchConfiguration('port')
        }],
        output='screen'
    )

    rviz_streamer_node = Node(
        package='window_x11_streamer',
        executable='window_capture_node',
        name='window_capture_node',
        output='screen'
    )

    return LaunchDescription([
        port_arg,
        web_video_server_node,
        rviz_streamer_node
    ])

