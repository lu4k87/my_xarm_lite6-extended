import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import (DeclareLaunchArgument, ExecuteProcess, GroupAction,
                            IncludeLaunchDescription, TimerAction)
from launch.conditions import IfCondition
from launch.launch_description_sources import (AnyLaunchDescriptionSource,
                                               PythonLaunchDescriptionSource)
from launch.substitutions import LaunchConfiguration

def generate_launch_description():
    # 1. ROS-Bridge WebSocket Server aus /opt (Standard Port 9090)
    rosbridge_launch_path = os.path.join(
        get_package_share_directory('rosbridge_server'),
        'launch',
        'rosbridge_websocket_launch.xml'
    )
    # call_services_in_new_thread: Standard ist False - dann arbeitet rosbridge
    # jeden Service-Aufruf im Hauptthread ab. Haengt dort ein langsamer Aufruf
    # (z.B. /rosapi/nodes der Node-Pruefung alle 2,5 s), wartet ein MoveTo
    # dahinter: gemessen 0,3-5 s bis zum Start der Planung, mit Threads
    # konstant ~0,3 s. Der Timeout verhindert, dass ein fehlender Service
    # einen Aufruf endlos offen haelt.
    rosbridge_launch = IncludeLaunchDescription(
        AnyLaunchDescriptionSource(rosbridge_launch_path),
        launch_arguments={
            'call_services_in_new_thread': 'true',
            'default_call_service_timeout': '10.0',
        }.items()
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

    # 5. Web Video Server (Port 8082) + RViz Streamer fuer die Kamera- und
    #    RViz-Streams. Ohne ihn zeigen alle Stream-Panels in der UI
    #    "Stream Disconnected". Eingebunden wird das komplette
    #    web_video_server.launch.py, damit diese Card in der Nexus Webapp die
    #    fruehere separate Card "Web Video Server & RViz Streamer" ersetzt.
    #    Der fuser-Cleanup gibt Port 8082 vorher frei, falls noch eine alte
    #    Instanz laeuft. Mit start_video_server:=false abschaltbar.
    start_video_server_arg = DeclareLaunchArgument(
        'start_video_server', default_value='true',
        description='Web Video Server (Port 8082) und RViz Streamer mitstarten.')

    video_server_port_arg = DeclareLaunchArgument(
        'video_server_port', default_value='8082',
        description='Port des Web Video Servers.')

    cleanup_video_port = ExecuteProcess(
        cmd=['bash', '-c', 'fuser -k 8082/tcp 2>/dev/null || true'],
        output='screen',
        condition=IfCondition(LaunchConfiguration('start_video_server'))
    )

    # GroupAction (scoped): rosbridge und web_video_server nutzen beide das
    # Launch-Argument 'port' - ohne eigenen Scope koennte 8082 die 9090
    # von rosbridge ueberschreiben (oder umgekehrt).
    web_video_server_launch = GroupAction(
        actions=[IncludeLaunchDescription(
            PythonLaunchDescriptionSource(os.path.join(
                get_package_share_directory('web_video_server'),
                'launch', 'web_video_server.launch.py')),
            launch_arguments={'port': LaunchConfiguration('video_server_port')}.items()
        )],
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
            actions=[web_video_server_launch, web_server_and_browser]
        )
    ])
