#!/bin/bash

# start.sh - Workspace Launcher
#Test NEU push test von lab pc
# test NEU pull vom repo 
#!/bin/bash

# Prüfen, ob das Verzeichnis existiert
if [ ! -d "$HOME/dev_ws" ]; then
    echo "Fehler: ROS 2 Workspace '~/dev_ws' wurde nicht gefunden."
    exit 1
fi

echo "Starte ROS 2 Nodes aus dem Workspace: ~/dev_ws"
echo "----------------------------------------------"

# Fenster 1:
#echo "Starte[NODE]: [X-Arm - MOVEIT SERVO für Lite6]"
#gnome-terminal --geometry=2560x1440 --title="[NODE]: X-Arm MOVEIT SERVO" -- bash -c "ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 #add_gripper:=true report_type:=dev; exec bash"
#sleep 1


# Fenster 2:
echo "Starte[NODE]: [YOLO Homographie]"
gnome-terminal --title="[NODE]: YOLO Homographie" -- bash -c "ros2 run yolo_object_detector yolo_homography_node; exec bash"
sleep 1


# Fenster 3:
echo "Starte[NODE]: [Collision Check]"
gnome-terminal --title="[NODE]: Collision Check" -- bash -c "ros2 run collision_check checker; exec bash"
sleep 1


# Fenster 4:
echo "Starte[NODE]: [Motion Sequence]"
gnome-terminal --title="[NODE]: Motion Sequence" -- bash -c "ros2 launch motion_sequence motion_sequence_launch.py; exec bash"
sleep 1


# Fenster 5:
echo "Starte[NODE]: [Whisper Bringup]"
gnome-terminal --title="[NODE]: Whisper Bringup" -- bash -c "ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=True; exec bash"
sleep 1

# Fenster 6:
echo "Starte[NODE]: [Whisper Stream Demo]"
gnome-terminal --title="[NODE]: Whisper Stream Demo" -- bash -c "ros2 run whisper_demos whisper_on_key; exec bash"
sleep 1


# Fenster 7:
echo "Starte[NODE]: [Voice Command Listener]"
gnome-terminal --title="[NODE]: Voice Command Listener" -- bash -c "ros2 run voice_command_listener listener; exec bash"
sleep 1


# Fenster 8:
echo "Starte[NODE]: [Move To Coordinator]"
gnome-terminal --title="[NODE]: Move To Coordinator" -- bash -c "ros2 run move_to_coordinator move_to_coordinator; exec bash"
sleep 1


# Fenster 9:
echo "Starte[NODE]: [RViz Publisher]"
gnome-terminal --title="[NODE]: RIZ Publisher" -- bash -c "ros2 run rviz_marker marker_publisher; exec bash"
sleep 1


# Fenster 10
echo "ROS Bridge - Websocket:"
gnome-terminal -- bash -c "ros2 launch rosbridge_server rosbridge_websocket_launch.xml; exec bash" 


# Fenster 11  - OBS
echo "Starte[OBS Studio]:"
gnome-terminal -- bash -c "obs; exec bash"
sleep 1


##################################  - Websocket(server) + ROS2 Bridge + web_analyser.py #############################################


gnome-terminal -- bash -c "source /opt/ros/humble/setup.bash; source ~/dev_ws/install/setup.bash; ros2 launch rosbridge_server rosbridge_websocket_launch.xml; exec bash"


gnome-terminal -- bash -c "source /opt/ros/humble/setup.bash; source ~/dev_ws/install/setup.bash; cd ~/dev_ws/src/websocket_ui; python3 workspace_analyzer.py; exec bash"


gnome-terminal -- bash -c "cd ~/dev_ws/src/websocket_ui; python3 -m http.server 8080; exec bash"
sleep 2

xdg-open http://localhost:8080/dashboard_index.html


#######################################################################################################################################




echo "Dashboard und Nodes wurden in neuen Terminals gestartet!"
