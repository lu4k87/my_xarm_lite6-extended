from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription, DeclareLaunchArgument
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node
from launch_ros.substitutions import FindPackageShare

def generate_launch_description():
    silero_vad_use_cuda = LaunchConfiguration('silero_vad_use_cuda', default='True')
    use_gpu = LaunchConfiguration('use_gpu', default='True')

    return LaunchDescription([
        DeclareLaunchArgument('silero_vad_use_cuda', default_value='True', description='Unused: whisper_bringup has no Silero VAD (kept for launcher compatibility)'),
        DeclareLaunchArgument('use_gpu', default_value='True', description='Use GPU for Whisper inference'),
        
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource(
                PathJoinSubstitution([FindPackageShare('whisper_bringup'), 'launch', 'bringup.launch.py'])
            ),
            launch_arguments={
                'silero_vad_use_cuda': silero_vad_use_cuda,
                'use_gpu': use_gpu,
            }.items()
        ),
        
        Node(
            package='voice_command_listener',
            executable='listener',
            name='voice_command_listener',
            output='screen'
        )
    ])
