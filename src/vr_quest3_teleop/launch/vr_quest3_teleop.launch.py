from launch import LaunchDescription
from launch.actions import ExecuteProcess, IncludeLaunchDescription, TimerAction
from launch_ros.actions import Node
from launch.launch_description_sources import AnyLaunchDescriptionSource
from ament_index_python.packages import get_package_share_directory
import os

def generate_launch_description():
    pkg_dir = get_package_share_directory('vr_quest3_teleop')
    driver_script_path = os.path.join(pkg_dir, 'driver_script', 'https_vr_webxr_p8443.py')
    
    # Kill any existing https_server to avoid port conflicts (8443)
    kill_existing = ExecuteProcess(
        cmd=['bash', '-c', 'pkill -9 -f https_vr_webxr_p8443.py || true'],
        output='screen'
    )

    adb_rev_9091 = ExecuteProcess(
        cmd=['adb', 'reverse', 'tcp:9091', 'tcp:9091'],
        output='screen'
    )
    
    adb_rev_8443 = ExecuteProcess(
        cmd=['adb', 'reverse', 'tcp:8443', 'tcp:8443'],
        output='screen'
    )

    rosbridge = IncludeLaunchDescription(
        AnyLaunchDescriptionSource(
            os.path.join(get_package_share_directory('rosbridge_server'), 'launch', 'rosbridge_websocket_launch.xml')
        ),
        launch_arguments={'port': '9091'}.items()
    )

    https_server = ExecuteProcess(
        cmd=['python3', driver_script_path],
        output='screen'
    )
    
    teleop_node = Node(
        package='vr_quest3_teleop',
        executable='vr_quest3_teleop_node',
        name='vr_quest3_teleop_node',
        output='screen'
    )
    
    return LaunchDescription([
        kill_existing,
        adb_rev_9091,
        adb_rev_8443,
        TimerAction(
            period=1.5,
            actions=[rosbridge, https_server, teleop_node]
        )
    ])
