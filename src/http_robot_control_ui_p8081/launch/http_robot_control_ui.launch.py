import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import ExecuteProcess, IncludeLaunchDescription, TimerAction
from launch.launch_description_sources import AnyLaunchDescriptionSource

def generate_launch_description():
    # 1. ROS-Bridge WebSocket Server aus /opt (Standard Port 9090)
    rosbridge_launch_path = os.path.join(
        get_package_share_directory('rosbridge_server'),
        'launch',
        'rosbridge_websocket_launch.xml'
    )
    rosbridge_launch = IncludeLaunchDescription(
        AnyLaunchDescriptionSource(rosbridge_launch_path)
    )

    # 2. Robot Control UI Verzeichnis
    ws_root = os.environ.get('ROS2_WS', os.path.expanduser('~/dev_ws'))
    ui_dir = os.path.join(ws_root, 'src', 'http_robot_control_ui_p8081')
    if not os.path.isdir(ui_dir):
        ui_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

    # 3. Vorherige Webserver-Instanzen auf Port 8081 sicher beenden (Port freigeben)
    cleanup_port = ExecuteProcess(
        cmd=['bash', '-c', 'fuser -k 8081/tcp 2>/dev/null || true'],
        output='screen'
    )

    # 4. Webserver (Port 8081) und Chrome Browser-Fenster starten
    browser_cmd = (
        f"python3 -m http.server 8081 -d '{ui_dir}' & "
        "SERVER_PID=$!; "
        "sleep 1 && ("
        "google-chrome --user-data-dir=$HOME/.robot_control_profile --class='robot-control-ui' --start-maximized --app=http://127.0.0.2:8081/index.html || "
        "chromium-browser --user-data-dir=$HOME/.robot_control_profile --class='robot-control-ui' --start-maximized --app=http://127.0.0.2:8081/index.html || "
        "xdg-open http://127.0.0.2:8081/index.html) & "
        "wait $SERVER_PID"
    )

    web_server_and_browser = ExecuteProcess(
        cmd=['bash', '-c', browser_cmd],
        output='screen'
    )

    return LaunchDescription([
        cleanup_port,
        rosbridge_launch,
        TimerAction(
            period=0.5,
            actions=[web_server_and_browser]
        )
    ])
