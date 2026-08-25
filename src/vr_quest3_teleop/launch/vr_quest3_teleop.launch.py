from launch import LaunchDescription
from launch.actions import ExecuteProcess, IncludeLaunchDescription, TimerAction
from launch_ros.actions import Node
from launch.launch_description_sources import AnyLaunchDescriptionSource
from ament_index_python.packages import get_package_share_directory
import os

def generate_launch_description():
    pkg_dir = get_package_share_directory('vr_quest3_teleop')
    driver_script_path = os.path.join(pkg_dir, 'driver_script', 'https_server.py')
    
    adb_rev_9090 = ExecuteProcess(
        cmd=['adb', 'reverse', 'tcp:9090', 'tcp:9090'],
        output='screen'
    )
    
    adb_rev_8443 = ExecuteProcess(
        cmd=['adb', 'reverse', 'tcp:8443', 'tcp:8443'],
        output='screen'
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
        adb_rev_9090,
        adb_rev_8443,
        TimerAction(
            period=1.0,
            actions=[https_server, teleop_node]
        )
    ])
