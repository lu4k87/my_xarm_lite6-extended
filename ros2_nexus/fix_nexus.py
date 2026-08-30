import re
import json

file = '/home/mk/dev_ws/ros2_nexus/ros2_nexus_script.js'
with open(file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add --legacy-cam to getExtrasExecLegacyCamActions
content = content.replace(
    '{ cmd: "ros2 run gaze_control_ui_tobii_glasses gaze_ui", title: "Gaze UI Node (Legacy IP Cam .124)" }',
    '{ cmd: "ros2 run gaze_control_ui_tobii_glasses gaze_ui --legacy-cam", title: "Gaze UI Node (Legacy IP Cam .124)" }'
)

# 2. Fix getServerSetupActions(mode)
old_server_func = """    function getServerSetupActions(mode) {
      let servoCmd = "ros2 launch xarm_moveit_servo lite6_moveit_servo_fake.launch.py add_vacuum_gripper:=true joystick_and_checker:=false";
      let servoTitle = "MoveIt Servo (Fake) [Server]";
      let moveGroupCmd = "ros2 launch robot_motion_handler_movegroup standalone_move_group.launch.py add_vacuum_gripper:=true";
      let moveGroupTitle = "MoveIt MoveGroup (Standalone/Fake)";

      if (mode === "real") {
        servoCmd = "ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_vacuum_gripper:=true report_type:=dev joystick_and_checker:=false";
        servoTitle = "MoveIt Servo (Real) [Server]";
        moveGroupCmd = "ros2 launch robot_motion_handler_movegroup standalone_move_group.launch.py add_vacuum_gripper:=true robot_ip:=192.168.1.175";
        moveGroupTitle = "MoveIt MoveGroup (Standalone/Real)";
      }

      const actions = [
        { cmd: servoCmd, title: servoTitle },
        { cmd: moveGroupCmd, title: moveGroupTitle },
        { cmd: "ros2 launch rviz_3d_scene_objects rviz_3d_scene_objects.launch.py", title: "RViz Marker Launch" },
        { cmd: "ros2 run rviz_servo_status_overlay servo_status_overlay", title: "Rviz2 - Overlay: MoveIt Servo Status Warning" },
        { cmd: "ros2 launch my_3d_vision_bringup zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py", title: "3D Vision Bringup (cam, tf, yolo3d, pc_opt, grasp)" },
        { cmd: "ros2 run tf_tuner tf_tuner", title: "Transform Tuner (tf_tuner)" }
      ];"""

new_server_func = """    function getServerSetupActions(mode) {
      let servoCmd = "ros2 launch xarm_moveit_servo lite6_moveit_servo_fake.launch.py add_vacuum_gripper:=true joystick_and_checker:=false";
      let servoTitle = "MoveIt Servo (Fake) [Server]";
      let moveGroupCmd = "ros2 launch robot_motion_handler_movegroup standalone_move_group.launch.py add_vacuum_gripper:=true";
      let moveGroupTitle = "MoveIt MoveGroup (Standalone/Fake)";
      let zedBringupCmd = "ros2 launch my_3d_vision_bringup zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py use_zed_hardware:=false";

      if (mode === "real") {
        servoCmd = "ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_vacuum_gripper:=true report_type:=dev joystick_and_checker:=false";
        servoTitle = "MoveIt Servo (Real) [Server]";
        moveGroupCmd = "ros2 launch robot_motion_handler_movegroup standalone_move_group.launch.py add_vacuum_gripper:=true robot_ip:=192.168.1.175";
        moveGroupTitle = "MoveIt MoveGroup (Standalone/Real)";
        zedBringupCmd = "ros2 launch my_3d_vision_bringup zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py use_zed_hardware:=true";
      }

      const actions = [
        { cmd: servoCmd, title: servoTitle },
        { cmd: moveGroupCmd, title: moveGroupTitle },
        { cmd: "ros2 launch rviz_3d_scene_objects rviz_3d_scene_objects.launch.py", title: "RViz Marker Launch" },
        { cmd: "ros2 run rviz_servo_status_overlay servo_status_overlay", title: "Rviz2 - Overlay: MoveIt Servo Status Warning" },
        { cmd: zedBringupCmd, title: "3D Vision Bringup (cam, tf, yolo3d, pc_opt, grasp)" },
        { cmd: "ros2 run tf_tuner tf_tuner", title: "Transform Tuner (tf_tuner)" }
      ];"""
content = content.replace(old_server_func, new_server_func)

# 3. Remove copy buttons for Macro cards in ros2_nexus_script.js
# We need to remove the lines containing `<button class="copy-btn"` for those cards.
# Let's use regex for specific macro titles.
def remove_copy_btn(text, label_match):
    # This finds the action-card with a given label and removes its adjacent copy-btn
    pattern = rf'(<span class="label">{label_match}</span>[\s\S]*?)<button class="copy-btn"[^>]*>.*?<\/button>'
    return re.sub(pattern, r'\1', text)

content = remove_copy_btn(content, r'RUN DEV Setup \(FAKE\)')
content = remove_copy_btn(content, r'RUN DEV Setup \(REAL\)')
content = remove_copy_btn(content, r'RUN SERVER \(FAKE\)')
content = remove_copy_btn(content, r'RUN SERVER \(REAL\)')
content = remove_copy_btn(content, r'RUN CLIENT \(Operator Station\)')
content = remove_copy_btn(content, r'RUN DEV \+ Gaze UI \(ZED M\) - Exocentric')
content = remove_copy_btn(content, r'RUN DEV \+ Gaze UI \(Rpi Cam\) - Egocentric')

# 4. Remove dead CMD_DETAILS entry motion_sequence_launch.py
content = re.sub(r'\s*"ros2 launch motion_sequence motion_sequence_launch.py": `<div[^>]*>.*?</ul></li></ul>`,', '', content, flags=re.DOTALL)

with open(file, 'w', encoding='utf-8') as f:
    f.write(content)

print("First batch of fixes applied.")
