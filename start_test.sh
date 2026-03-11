#!/bin/bash

# dashboard.sh - Workspace Launcher

# 0. Cleanup: Alte Prozesse beenden damit sich nichts doppelt
echo "Beende alte Instanzen..."
pkill -f "rosbridge_server"
pkill -f "workspace_analyzer.py"
pkill -f "lite6_moveit_servo_fake.launch.py"
pkill -f "http.server 8080"
sleep 1

# 1. Terminal: ROS Bridge
gnome-terminal --title="[NODE]: ROS Bridge (Websocket)" -- bash -c "source /opt/ros/humble/setup.bash; source ~/dev_ws/install/setup.bash; ros2 launch rosbridge_server rosbridge_websocket_launch.xml; exec bash"

# 2. Terminal: Lokaler Webserver (für UI)
gnome-terminal --title="[PROGRAM]: Webserver (Dashboard UI)" -- bash -c "cd ~/dev_ws/src/websocket; python3 -m http.server 8080; exec bash"

# 3. Terminal: Workspace Analyzer
gnome-terminal --title="[SCRIPT]: Workspace Analyzer" -- bash -c "source /opt/ros/humble/setup.bash; source ~/dev_ws/install/setup.bash; cd ~/dev_ws/src/websocket; python3 workspace_analyzer.py; exec bash"

# 4. Terminal: MoveIt Servo (Fake)
gnome-terminal --title="[NODE]: MoveIt Servo (Fake)" -- bash -c "source /opt/ros/humble/setup.bash; source ~/dev_ws/install/setup.bash; ros2 launch xarm_moveit_servo lite6_moveit_servo_fake.launch.py; exec bash"

# 5. Terminal: MoveIt Servo (Fake)
gnome-terminal --title="[NODE]: X-Arm Keyboard Input" -- bash -c "source /opt/ros/humble/setup.bash; source ~/dev_ws/install/setup.bash; ros2 run xarm_moveit_servo xarm_keyboard_input; exec bash"

# 6. Browser: Open Dashboard
xdg-open http://localhost:8080/dashboard_index.html

echo "Dashboard und Nodes wurden in neuen Terminals gestartet!"
