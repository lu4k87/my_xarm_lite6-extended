import re

with open('/home/mk/dev_ws/ros2_nexus/ros2_nexus_script.js', 'r') as f:
    content = f.read()

# Generate the full list for DEV FAKE (has checker and web UI and joy? No, DEV has Web UI)
# Wait, DEV setup:
# 1. servoCmd
# 2. moveGroupCmd
# 3. rviz_marker
# 4. robot_motion_handler
# 5. scan_trajectory
# 6. servo_status_overlay
# 7. zed_cam_rviz_... (includes pointcloud_optimizer.py, yolov8_node.py)
# 8. whisper_bringup
# 9. voice_command_listener
# 10. rosbridge_server
# 11. pointcloud_tf_tuner.py
# 12. robot_control_web_ui (python HTTP server)
# Note: DEV setup doesn't run checker.py either? Wait, yes it does!
# Wait, let's look at `runDevSetup` actions:
# { cmd: "ros2 run robot_motion_handler_movegroup robot_motion_handler_movegroup", title: "Robot Motion Handler MoveGroup Node" },
# No checker.py in `runDevSetup`? Wait, the user has collision_checker running somewhere. Ah, `lite6_moveit_servo_fake.launch.py` launches checker.py implicitly unless `joystick_and_checker:=false` is passed!
# Yes, `runServerSetup` passes `joystick_and_checker:=false`. `runDevSetup` DOES NOT, so it launches the checker implicitly.

fake_dev_list = """                   <li><span style="color: var(--accent);">lite6_moveit_servo_fake.launch.py</span> (MoveIt Servo)</li>
                   <li><span style="color: var(--accent);">servo_node.cpp</span> (MoveIt Servo)</li>
                   <li><span style="color: var(--accent);">checker.py</span> (Collision Checker)</li>
                   <li><span style="color: var(--accent);">standalone_move_group.launch.py</span> (MoveGroup)</li>
                   <li><span style="color: var(--accent);">rviz_marker_static_scene_objects.launch.py</span> (RViz Marker)</li>
                   <li><span style="color: var(--accent);">robot_motion_handler_movegroup.py</span> (Motion Handler)</li>
                   <li><span style="color: var(--accent);">scan_trajectory_node.cpp</span> (Motion Handler)</li>
                   <li><span style="color: var(--accent);">servo_status_overlay.py</span> (RViz Overlay)</li>
                   <li><span style="color: var(--accent);">zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py</span> (Vision Bringup)</li>
                   <li><span style="color: var(--accent);">zed_wrapper.cpp</span> (ZED Camera)</li>
                   <li><span style="color: var(--accent);">yolov8_node.py</span> (YOLO Detection)</li>
                   <li><span style="color: var(--accent);">yolo_planned_grasp_executor.py</span> (YOLO Grasp)</li>
                   <li><span style="color: var(--accent);">pointcloud_optimizer.py</span> (Pointcloud Filter)</li>
                   <li><span style="color: var(--accent);">bringup.launch.py</span> (Whisper Bringup)</li>
                   <li><span style="color: var(--accent);">audio_listener.py</span> (Mic Stream)</li>
                   <li><span style="color: var(--accent);">inference.cpp</span> (Whisper Core)</li>
                   <li><span style="color: var(--accent);">voice_command_listener.py</span> (Voice Controller)</li>
                   <li><span style="color: var(--accent);">rosbridge_websocket.py</span> (ROS Bridge)</li>
                   <li><span style="color: var(--accent);">pointcloud_tf_tuner.py</span> (TF Tuner)</li>
                   <li><span style="color: var(--accent);">robot_control_web_ui</span> (Web Server)</li>"""

real_dev_list = fake_dev_list.replace("lite6_moveit_servo_fake.launch.py", "lite6_moveit_servo_realmove.launch.py")

fake_server_list = """                   <li><span style="color: var(--accent);">lite6_moveit_servo_fake.launch.py</span> (MoveIt Servo)</li>
                   <li><span style="color: var(--accent);">servo_node.cpp</span> (MoveIt Servo)</li>
                   <li><span style="color: var(--accent);">standalone_move_group.launch.py</span> (MoveGroup)</li>
                   <li><span style="color: var(--accent);">rviz_marker_static_scene_objects.launch.py</span> (RViz Marker)</li>
                   <li><span style="color: var(--accent);">robot_motion_handler_movegroup.py</span> (Motion Handler)</li>
                   <li><span style="color: var(--accent);">scan_trajectory_node.cpp</span> (Motion Handler)</li>
                   <li><span style="color: var(--accent);">servo_status_overlay.py</span> (RViz Overlay)</li>
                   <li><span style="color: var(--accent);">zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py</span> (Vision Bringup)</li>
                   <li><span style="color: var(--accent);">zed_wrapper.cpp</span> (ZED Camera)</li>
                   <li><span style="color: var(--accent);">yolov8_node.py</span> (YOLO Detection)</li>
                   <li><span style="color: var(--accent);">yolo_planned_grasp_executor.py</span> (YOLO Grasp)</li>
                   <li><span style="color: var(--accent);">pointcloud_optimizer.py</span> (Pointcloud Filter)</li>
                   <li><span style="color: var(--accent);">bringup.launch.py</span> (Whisper Bringup)</li>
                   <li><span style="color: var(--accent);">audio_listener.py</span> (Mic Stream)</li>
                   <li><span style="color: var(--accent);">inference.cpp</span> (Whisper Core)</li>
                   <li><span style="color: var(--accent);">voice_command_listener.py</span> (Voice Controller)</li>
                   <li><span style="color: var(--accent);">pointcloud_tf_tuner.py</span> (TF Tuner)</li>"""

real_server_list = fake_server_list.replace("lite6_moveit_servo_fake.launch.py", "lite6_moveit_servo_realmove.launch.py")


client_list = """                   <li><span style="color: var(--accent);">joy_node.cpp</span> (Gamepad Driver)</li>
                   <li><span style="color: var(--accent);">checker.py</span> (Collision Checker)</li>
                   <li><span style="color: var(--accent);">rosbridge_websocket.py</span> (ROS Bridge)</li>
                   <li><span style="color: var(--accent);">rosapi_node.py</span> (ROS API)</li>
                   <li><span style="color: var(--accent);">servo.rviz</span> (RViz2 Operator View)</li>
                   <li><span style="color: var(--accent);">robot_control_web_ui</span> (Web Server)</li>"""

# Replace in content using regex to match the inner `<ul>...</ul>` for each tooltip
def replace_ul(title, new_li, html):
    # Find the tooltip title block, then the following <ul> block
    pattern = f'(<div class="card-tooltip-title">.*?{title}</div>.*?<ul.*?>).*?(</ul>)'
    return re.sub(pattern, lambda m: f'{m.group(1)}\n{new_li}\n{m.group(2)}', html, flags=re.DOTALL)

content = replace_ul('RUN DEV Setup \\(FAKE\\)', fake_dev_list, content)
content = replace_ul('RUN DEV Setup \\(REAL\\)', real_dev_list, content)
content = replace_ul('RUN SERVER \\(FAKE\\)', fake_server_list, content)
content = replace_ul('RUN SERVER \\(REAL\\)', real_server_list, content)
content = replace_ul('RUN CLIENT \\(Operator Station\\)', client_list, content)

with open('/home/mk/dev_ws/ros2_nexus/ros2_nexus_script.js', 'w') as f:
    f.write(content)
