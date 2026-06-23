import os

from ament_index_python import get_package_share_directory
from launch import LaunchDescription
from launch_ros.actions import ComposableNodeContainer, Node
from launch_ros.descriptions import ComposableNode

from launch.actions import DeclareLaunchArgument
# from launch.substitutions import LaunchConfiguration, PythonExpression
from launch.substitutions import LaunchConfiguration

def generate_launch_description() -> LaunchDescription:
    active_arg = DeclareLaunchArgument(
        'active',
        default_value="true",
        description='Start with whisper node active'
    )
    active = LaunchConfiguration('active')

    use_gpu_arg = DeclareLaunchArgument(
        'use_gpu',
        default_value="true",
        description='Use GPU for Whisper inference'
    )
    use_gpu = LaunchConfiguration('use_gpu')

    device_index_arg = DeclareLaunchArgument(
        'device_index',
        default_value="-1",
        description='PyAudio Device Index (-1 for default)'
    )
    device_index = LaunchConfiguration('device_index')

    ld = LaunchDescription()

    # ARGUMENTS MUST GO FIRST!
    ld.add_action(active_arg)
    ld.add_action(device_index_arg)
    ld.add_action(use_gpu_arg)

    # launch audio listener
    ld.add_action(
        Node(
            package="audio_listener",
            executable="audio_listener",
            output="screen",
            parameters=[{'device_index': device_index}]
        )
    )

    # launch whisper
    whisper_config = os.path.join(
        get_package_share_directory("whisper_server"), "config", "whisper.yaml"
    )


    container = ComposableNodeContainer(
            name='whisper_container',
            package='rclcpp_components',
            namespace='',
            executable='component_container_mt',  # Use 'component_container' for single-threaded
            output={
                    'stdout': 'screen',
                    'stderr': 'screen',
                },
            emulate_tty=True,
            # arguments=['--ros-args', '--log-level', 'debug'],
            composable_node_descriptions=[
                # Whisper
                ComposableNode(
                    package='whisper_server',
                    plugin='whisper::Inference',
                    name='inference',
                    namespace="whisper",
                    # parameters=[whisper_config, {'active': False}],
                    parameters=[whisper_config, {'active': active, 'cparams.use_gpu': use_gpu}],
                    # parameters=[whisper_config, {'active': PythonExpression(['"', active, '" == "true"'])}],
                    remappings=[("audio", "/audio_listener/audio")],
                ),
                # Transcript manager
                ComposableNode(
                    package='transcript_manager',
                    plugin='whisper::TranscriptManager',
                    name='transcript_manager',
                    namespace="whisper",
                ),
            ],
        )
    ld.add_action(container)
    return ld
