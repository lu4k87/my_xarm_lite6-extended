import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import (DeclareLaunchArgument, ExecuteProcess,
                            IncludeLaunchDescription, TimerAction)
from launch.conditions import IfCondition
from launch.launch_description_sources import AnyLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node

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
        # Eigener Server statt "python3 -m http.server": no-cache-Header und
        # automatische ?v=-Versionen in index.html (siehe server.py).
        f"python3 '{os.path.join(ui_dir, 'http_robot_control_ui_p8081', 'server.py')}' 8081 '{ui_dir}' & "
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

    # 5. Web Video Server (Port 8082) fuer die Kamera- und RViz-Streams.
    #    Ohne ihn zeigen alle Stream-Panels in der UI "Stream Disconnected" -
    #    er lief bisher nur als separater Eintrag in der Nexus Webapp und
    #    wurde von keinem Launch-File mitgestartet.
    #    Nur 'port' setzen, wie im bereits funktionierenden
    #    web_video_server.launch.py - ein nicht deklarierter Parameter wuerde
    #    den Node beim Start scheitern lassen. Die Default-Adresse 0.0.0.0
    #    ist noetig, weil der Browser die UI unter 127.0.0.2 oeffnet.
    # Default bewusst FALSE: der Server wird ueblicherweise ueber das Popup in
    # der Nexus Webapp gestartet. Waere das hier true, wuerde der
    # 8082-Cleanup (fuser -k) genau diese laufende Instanz abschiessen.
    start_video_server_arg = DeclareLaunchArgument(
        'start_video_server', default_value='false',
        description='Web Video Server auf Port 8082 mitstarten. Standard false, '
                    'weil er normalerweise ueber die Nexus Webapp laeuft. Mit '
                    'start_video_server:=true zuschaltbar.')

    video_server_port_arg = DeclareLaunchArgument(
        'video_server_port', default_value='8082',
        description='Port des Web Video Servers.')

    cleanup_video_port = ExecuteProcess(
        cmd=['bash', '-c', 'fuser -k 8082/tcp 2>/dev/null || true'],
        output='screen',
        condition=IfCondition(LaunchConfiguration('start_video_server'))
    )

    web_video_server_node = Node(
        package='web_video_server',
        executable='web_video_server',
        name='http_web_video_server_p8082',
        parameters=[{'port': LaunchConfiguration('video_server_port')}],
        output='screen',
        condition=IfCondition(LaunchConfiguration('start_video_server'))
    )

    return LaunchDescription([
        start_video_server_arg,
        video_server_port_arg,
        cleanup_port,
        cleanup_video_port,
        rosbridge_launch,
        TimerAction(
            period=0.5,
            actions=[web_video_server_node, web_server_and_browser]
        )
    ])
