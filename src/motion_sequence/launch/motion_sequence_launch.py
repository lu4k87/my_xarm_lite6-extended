# motion_sequence_launch.py
from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    return LaunchDescription([
        Node(
            package='motion_sequence', # Ersetze dies durch den tatsächlichen Namen deines Python-Pakets
            executable='motion_sequence', # Der Entry Point aus setup.py
            name='motion_sequence_node',
            output='screen',
            emulate_tty=True, # Für farbigen Log-Output in der Konsole
        )
    ])
