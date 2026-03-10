from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    return LaunchDescription([
        Node(
            package='voice_command_listener',
            executable='listener',
            name='voice_command_listener',
            output='screen'
        )
    ])

