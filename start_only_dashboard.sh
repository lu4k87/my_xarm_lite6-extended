
gnome-terminal --title="[NODE]: ROS Bridge (Websocket)" -- bash -c "source /opt/ros/humble/setup.bash; source ~/dev_ws/install/setup.bash; ros2 launch rosbridge_server rosbridge_websocket_launch.xml; exec bash"


gnome-terminal --title="[SCRIPT]: Workspace Analyzer" -- bash -c "source /opt/ros/humble/setup.bash; source ~/dev_ws/install/setup.bash; cd ~/dev_ws/src/websocket; python3 workspace_analyzer.py; exec bash"


gnome-terminal --title="[PROGRAM]: Webserver (Dashboard UI)" -- bash -c "cd ~/dev_ws/src/websocket; python3 -m http.server 8080; exec bash"
sleep 2

xdg-open http://localhost:8080/dashboard_index.html
