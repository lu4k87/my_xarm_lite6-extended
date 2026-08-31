    // ─── DEV SETUP ────────────────────────────────────────────────────────────────
    function getDevSetupActions(mode) {
      let servoCmd = "ros2 launch xarm_moveit_servo lite6_moveit_servo_fake.launch.py add_vacuum_gripper:=true attach_to:=linear_axis_link";
      let servoTitle = "MoveIt Servo (Fake) + Linear Axis";
      let moveGroupCmd = "ros2 launch robot_motion_handler_movegroup standalone_move_group.launch.py add_vacuum_gripper:=true attach_to:=linear_axis_link";
      let moveGroupTitle = "MoveIt MoveGroup (Standalone/Fake) + Linear Axis";
      let zedBringupCmd = "ros2 launch my_3d_vision_bringup zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py use_zed_hardware:=false";

      if (mode === "real") {
        servoCmd = "ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_vacuum_gripper:=true report_type:=dev";
        servoTitle = "MoveIt Servo (Real)";
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
        { cmd: "ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=True use_gpu:=True", title: "Whisper Bringup (Voice AI)" },
        { cmd: "ros2 run voice_command_listener listener", title: "Voice Command Listener" },
        { cmd: "ros2 launch rosbridge_server rosbridge_websocket_launch.xml", title: "ws_rosbridge_main_p9090" },
        { cmd: "ros2 run tf_tuner tf_tuner", title: "Transform Tuner (tf_tuner)" },
        { cmd: "python3 -m http.server 8081 -d src/http_robot_control_ui_p8081 & sleep 1 && (google-chrome --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || chromium-browser --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || xdg-open http://127.0.0.2:8081/index.html) & wait", title: "http_robot_control_ui_p8081" },
        { cmd: "ros2 run web_video_server web_video_server --ros-args -r __node:=http_web_video_server_p8082 -p port:=8082", title: "http_web_video_server_p8082" },
        { cmd: "ros2 run rviz_streamer rviz_streamer_node", title: "RViz Streamer Node" },
        { cmd: "ros2 run gaze_grasp_routine_tobii_glasses gaze_grasp_routine_tobii_glasses", title: "Tobii Gaze Grasp Node" }
      ];

      if (mode !== "real") {
        actions.push({ cmd: "ros2 run linear_axis_tuner linear_axis_tuner", title: "Linear Axis Tuner (FAKE Mode)" });
      }

      

      return actions;
    }

    function getServerSetupActions(mode) {
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
      ];

      

      return actions;
    }

    function getClientSetupActions() {
      const actions = [
        { cmd: "ros2 run joy joy_node", title: "Gamepad Driver (joy_node)" },
        { cmd: "ros2 run collision_check checker", title: "Collision Checker Node" },
        { cmd: "ros2 launch rosbridge_server rosbridge_websocket_launch.xml", title: "ws_rosbridge_main_p9090" },
        { cmd: "ros2 run rviz2 rviz2 -d ~/dev_ws/src/xarm_ros2/xarm_moveit_servo/rviz/servo.rviz", title: "RViz2 (Operator View)" },
        { cmd: "ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=False use_gpu:=False", title: "Whisper Bringup (Voice AI) - CPU Mode" },
        { cmd: "ros2 run voice_command_listener listener", title: "Voice Command Listener" },
        { cmd: "python3 -m http.server 8081 -d src/http_robot_control_ui_p8081 & sleep 1 && (google-chrome --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || chromium-browser --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || xdg-open http://127.0.0.2:8081/index.html) & wait", title: "http_robot_control_ui_p8081" }
      ];

      

      return actions;
    }

    // ─── EXTRAS EXEC SETUP ───────────────────────────────────────────────────────
    function getExtrasExecActions() {
      // Alles was runDevSetup('real') startet + Gaze UI Glasses Node
      const actions = [
        { cmd: "ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_vacuum_gripper:=true report_type:=dev", title: "MoveIt Servo (Real)" },
        { cmd: "ros2 launch robot_motion_handler_movegroup standalone_move_group.launch.py add_vacuum_gripper:=true robot_ip:=192.168.1.175", title: "MoveIt MoveGroup (Standalone/Real)" },
        { cmd: "ros2 launch rosbridge_server rosbridge_websocket_launch.xml", title: "ws_rosbridge_main_p9090" },
        { cmd: "python3 -m http.server 8081 -d src/http_robot_control_ui_p8081 & sleep 1 && (google-chrome --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || chromium-browser --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || xdg-open http://127.0.0.2:8081/index.html) & wait", title: "http_robot_control_ui_p8081" },
        { cmd: "ros2 run web_video_server web_video_server --ros-args -r __node:=http_web_video_server_p8082 -p port:=8082", title: "http_web_video_server_p8082" },
        { cmd: "ros2 run gaze_control_ui_tobii_glasses gaze_ui_zedm", title: "Gaze UI Node ZED M (Glasses 3 Pro)" },
        { cmd: "ros2 launch zed_wrapper zed_camera.launch.py camera_model:=zedm", title: "ZED M Camera Node" }
      ];

      

      return actions;
    }

    function getExtrasExecLegacyCamActions() {
      const actions = [
        { cmd: "ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_vacuum_gripper:=true report_type:=dev", title: "MoveIt Servo (Real)" },
        { cmd: "ros2 launch robot_motion_handler_movegroup standalone_move_group.launch.py add_vacuum_gripper:=true robot_ip:=192.168.1.175", title: "MoveIt MoveGroup (Standalone/Real)" },
        { cmd: "ros2 launch rosbridge_server rosbridge_websocket_launch.xml", title: "ws_rosbridge_main_p9090" },
        { cmd: "python3 -m http.server 8081 -d src/http_robot_control_ui_p8081 & sleep 1 && (google-chrome --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || chromium-browser --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || xdg-open http://127.0.0.2:8081/index.html) & wait", title: "http_robot_control_ui_p8081" },
        { cmd: "ros2 run gaze_control_ui_tobii_glasses gaze_ui --legacy-cam", title: "Gaze UI Node (Legacy IP Cam .124)" }
      ];
      return actions;
    }

    // ─── TAB DATA ────────────────────────────────────────────────────────────────
    let TABS = {};

    async function loadConfig() {
      try {
        const res = await fetch('/api/config');
        TABS = await res.json();
        renderTab(currentTab);
      } catch (err) {
        console.error("Failed to load config:", err);
        showToast('✗ Konfiguration konnte nicht geladen werden', true);
      }
    }

    // ─── BADGE CONFIG ─────────────────────────────────────────────────────────────

    const BADGE = {
      node: { cls: "badge-node", icon: `<svg viewBox="0 0 100 100" style="width: 14px; height: 14px; margin-right: 6px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg>`, label: "NODE" },
      launch: { cls: "badge-launch", icon: "fa-solid fa-rocket", label: "LAUNCH" },
      pub: { cls: "badge-pub", icon: "fa-solid fa-arrow-up-from-bracket", label: "PUB MSG ON TOPIC" },
      sys: { cls: "badge-sys", icon: "fa-solid fa-terminal", label: "CMD" },
      kill: { cls: "badge-kill", icon: "fa-solid fa-skull-crossbones", label: "KILL" },
    };

    const OPT_NODES = [
        'robot_state_publisher', 'servo_node', 'joy_to_servo_node',
        'ros2_control_node', 'component_container', 'spawner', 'spawner ×2',
        'rviz2', 'joint_state_publisher', 'static_tf2_broadcaster',
        'static_transform_publisher', 'move_group', 'octomap_server_node',
        'rosbridge_websocket.py', 'rosapi_node.py', 'joy_node', 'web_video_server', 'rviz_streamer_node'
    ];

    function injectOptBadges(htmlStr) {
        let res = htmlStr;
        OPT_NODES.forEach(nodeName => {
            const escapedNode = nodeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex1 = new RegExp(`(NODE<\\/span>)(<span style="color: var\\(--c-node\\);">(?:&nbsp;|\\s)*)(${escapedNode})(<\\/span>)`, 'g');
            const regex2 = new RegExp(`(SERVER<\\/span>)(<span style="color: var\\(--c-cmd\\);">(?:&nbsp;|\\s)*)(${escapedNode})(<\\/span>)`, 'g');
            res = res.replace(regex1, `$1<span class="badge badge-opt" style="margin-right: 6px; padding: 2px 4px; font-size: 8.5px;">OPT</span>$2$3$4`);
            res = res.replace(regex2, `$1<span class="badge badge-opt" style="margin-right: 6px; padding: 2px 4px; font-size: 8.5px;">OPT</span>$2$3$4`);
        });
        return res;
    }

    function buildExpandedTooltip(actions) {
       let html = `<ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;">`;
       actions.forEach(a => {
           let subCmds = a.cmd.split(/(?:&&|&)/).map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('sleep') && !s.startsWith('wait'));
           subCmds.forEach(subCmd => {
               let expanded = CMD_DETAILS[subCmd];
               if (!expanded) {
                   const matchedKey = Object.keys(CMD_DETAILS)
                                      .sort((k1, k2) => k2.length - k1.length)
                                      .find(k => subCmd.includes(k));
                   if (matchedKey) expanded = CMD_DETAILS[matchedKey];
               }
               
               if (expanded) {
                   let match = expanded.match(/<ul[^>]*>([\s\S]*?)<\/ul>$/);
                   if (match) {
                       html += match[1];
                   } else {
                       html += `<li data-raw-cmd="${subCmd.replace(/"/g, '&quot;')}"><span class="badge badge-sys" style="margin-right: 6px;">CMD</span><span style="color: var(--c-cmd);">${subCmd}</span></li>`;
                   }
               } else if (subCmd.startsWith('(google-chrome') || subCmd.startsWith('google-chrome')) {
                   html += `<li data-raw-cmd="${subCmd.replace(/"/g, '&quot;')}"><span class="badge badge-server" style="margin-right: 6px;"><i class="fa-solid fa-globe"></i>WEB</span><span style="color: var(--c-cmd);"> Chrome Browser</span> <span style="float: right; opacity: 0.7;">(Frontend)</span></li>`;
               } else {
                   let badge = subCmd.startsWith('ros2 launch') ? `<span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);">` : `<span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">`;
                   let term = subCmd.split(' ').slice(2).join(' ') || subCmd;
                   if (subCmd.includes('http.server')) {
                       badge = `<span class="badge badge-server" style="margin-right: 6px;"><i class="fa-solid fa-server" style="margin-right: 4px;"></i>SERVER</span><span style="color: var(--c-cmd);">`;
                       term = "http_robot_control_ui_p8081";
                   }
                   // Use a.title if there's only 1 subCmd, otherwise we don't have a specific title.
                   let lbl = subCmds.length === 1 ? a.title : term;
                   html += `<li data-raw-cmd="${subCmd.replace(/"/g, '&quot;')}">${badge} ${term}</span> <span style="float: right; opacity: 0.7;">(${lbl})</span></li>`;
               }
           });
       });
       html += `</ul>`;
       return html;
    }

    const CMD_DETAILS = {
      // ── Launch Files ────────────────────────────────────────────────────────
      "ros2 launch xarm_moveit_servo lite6_moveit_servo_fake.launch.py add_vacuum_gripper:=true": `<div style="font-size:11px;color:var(--mut);margin-bottom:4px;"><b>Included Source Files:</b></div><ul style="padding-left:16px;margin:0;font-size:11px;color:var(--mut);line-height:1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> lite6_moveit_servo_fake.launch.py</span> <span style="float:right;opacity:0.7;">(Launch-File)</span><ul style="padding-left:14px;margin:4px 0 0 0;border-left:1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> _robot_moveit_servo_fake.launch.py</span> <span style="float:right;opacity:0.7;">(Sub-Launch · MoveIt Servo Stack)</span><ul style="padding-left:14px;margin:4px 0 0 0;border-left:1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> robot_state_publisher</span> <span style="float:right;opacity:0.7;">(URDF / TF)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> servo_node</span> <span style="float:right;opacity:0.7;">(MoveIt Servo)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> joy_to_servo_node</span> <span style="float:right;opacity:0.7;">(Gamepad to Servo)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> ros2_control_node</span> <span style="float:right;opacity:0.7;">(Mock Hardware)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> component_container</span> <span style="float:right;opacity:0.7;">(Composable Node Container)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> spawner ×2</span> <span style="float:right;opacity:0.7;">(Controller Manager)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> checker</span> <span style="float:right;opacity:0.7;">(Collision Check)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> robot_motion_handler_movegroup</span> <span style="float:right;opacity:0.7;">(Pose MoveIt Node)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> rviz2</span> <span style="float:right;opacity:0.7;">(Visualisierung)</span></li></ul></li></ul></li></ul>`,
      "ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_vacuum_gripper:=true report_type:=dev": `<div style="font-size:11px;color:var(--mut);margin-bottom:4px;"><b>Included Source Files:</b></div><ul style="padding-left:16px;margin:0;font-size:11px;color:var(--mut);line-height:1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> lite6_moveit_servo_realmove.launch.py</span> <span style="float:right;opacity:0.7;">(Launch-File)</span><ul style="padding-left:14px;margin:4px 0 0 0;border-left:1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> _robot_moveit_servo_realmove.launch.py</span> <span style="float:right;opacity:0.7;">(Sub-Launch · MoveIt Servo Stack)</span><ul style="padding-left:14px;margin:4px 0 0 0;border-left:1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> robot_state_publisher</span> <span style="float:right;opacity:0.7;">(URDF / TF)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> joint_state_publisher</span> <span style="float:right;opacity:0.7;">(Joint States)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> static_tf2_broadcaster</span> <span style="float:right;opacity:0.7;">(TF: world → link_base)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> servo_node</span> <span style="float:right;opacity:0.7;">(MoveIt Servo)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> joy_to_servo_node</span> <span style="float:right;opacity:0.7;">(Gamepad to Servo)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> ros2_control_node</span> <span style="float:right;opacity:0.7;">(Hardware Interface)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> component_container</span> <span style="float:right;opacity:0.7;">(Composable Node Container)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> spawner</span> <span style="float:right;opacity:0.7;">(Controller Manager)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> checker</span> <span style="float:right;opacity:0.7;">(Collision Check)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> robot_motion_handler_movegroup</span> <span style="float:right;opacity:0.7;">(Pose MoveIt Node)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> rviz2</span> <span style="float:right;opacity:0.7;">(Visualisierung)</span></li></ul></li></ul></li></ul>`,
      "ros2 launch robot_motion_handler_movegroup standalone_move_group.launch.py add_vacuum_gripper:=true": `<div style="font-size:11px;color:var(--mut);margin-bottom:4px;"><b>Included Source Files:</b></div><ul style="padding-left:16px;margin:0;font-size:11px;color:var(--mut);line-height:1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> standalone_move_group.launch.py</span> <span style="float:right;opacity:0.7;">(Launch-File)</span><ul style="padding-left:14px;margin:4px 0 0 0;border-left:1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> move_group</span> <span style="float:right;opacity:0.7;">(MoveIt Planning Server (OMPL))</span></li></ul></li></ul>`,
      "ros2 launch robot_motion_handler_movegroup standalone_move_group.launch.py robot_ip:=192.168.1.175 add_vacuum_gripper:=true report_type:=dev": `<div style="font-size:11px;color:var(--mut);margin-bottom:4px;"><b>Included Source Files:</b></div><ul style="padding-left:16px;margin:0;font-size:11px;color:var(--mut);line-height:1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> standalone_move_group.launch.py</span> <span style="float:right;opacity:0.7;">(Launch-File)</span><ul style="padding-left:14px;margin:4px 0 0 0;border-left:1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> move_group</span> <span style="float:right;opacity:0.7;">(MoveIt Planning Server (OMPL))</span></li></ul></li></ul>`,
      "ros2 launch my_3d_vision_bringup zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py": `<div style="font-size:11px;color:var(--mut);margin-bottom:4px;"><b>Included Source Files:</b></div><ul style="padding-left:16px;margin:0;font-size:11px;color:var(--mut);line-height:1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py</span> <span style="float:right;opacity:0.7;">(Launch-File)</span><ul style="padding-left:14px;margin:4px 0 0 0;border-left:1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> static_transform_publisher</span> <span style="float:right;opacity:0.7;">(TF: world → zed_camera_link)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> pointcloud_optimizer.py</span> <span style="float:right;opacity:0.7;">(PointCloud ROI Filter)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> zed_yolo_3d_bbox.py</span> <span style="float:right;opacity:0.7;">(YOLO 3D BBox)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> yolo_planned_grasp_executor.py</span> <span style="float:right;opacity:0.7;">(Grasp Executor)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> grasp_action_bridge.py</span> <span style="float:right;opacity:0.7;">(Action Bridge)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> yolo_moveit_collision.py</span> <span style="float:right;opacity:0.7;">(YOLO → MoveIt Collision)</span></li><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> zed_camera.launch.py</span> <span style="float:right;opacity:0.7;">(Sub-Launch · ZED SDK (zed_wrapper))</span><ul style="padding-left:14px;margin:4px 0 0 0;border-left:1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> zed_wrapper</span> <span style="float:right;opacity:0.7;">(ZED SDK Treiber)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> robot_state_publisher</span> <span style="float:right;opacity:0.7;">(URDF / TF)</span></li></ul></li></ul></li></ul>`,
      "ros2 launch my_3d_vision_bringup zed_cam_eef_rviz_octomap_yolo.launch.py": `<div style="font-size:11px;color:var(--mut);margin-bottom:4px;"><b>Included Source Files:</b></div><ul style="padding-left:16px;margin:0;font-size:11px;color:var(--mut);line-height:1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> zed_cam_eef_rviz_octomap_yolo.launch.py</span> <span style="float:right;opacity:0.7;">(Launch-File)</span><ul style="padding-left:14px;margin:4px 0 0 0;border-left:1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> static_transform_publisher</span> <span style="float:right;opacity:0.7;">(TF: link_tcp → zed_camera_link)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> octomap_server_node</span> <span style="float:right;opacity:0.7;">(Octomap 3D Voxelkarte)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> pointcloud_optimizer.py</span> <span style="float:right;opacity:0.7;">(PointCloud ROI Filter)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> zed_yolo_3d_bbox.py</span> <span style="float:right;opacity:0.7;">(YOLO 3D BBox)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> yolo_moveit_collision.py</span> <span style="float:right;opacity:0.7;">(YOLO → MoveIt Collision)</span></li><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> zed_camera.launch.py</span> <span style="float:right;opacity:0.7;">(Sub-Launch · ZED SDK (zed_wrapper))</span><ul style="padding-left:14px;margin:4px 0 0 0;border-left:1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> zed_wrapper</span> <span style="float:right;opacity:0.7;">(ZED SDK Treiber)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> robot_state_publisher</span> <span style="float:right;opacity:0.7;">(URDF / TF)</span></li></ul></li></ul></li></ul>`,
      "ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=False use_gpu:=False": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> bringup.launch.py</span> <span style="float: right; opacity: 0.7;">(Launch-File)</span><ul style="padding-left: 14px; margin: 4px 0 0 0; border-left: 1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> audio_listener.py</span> <span style="float: right; opacity: 0.7;">(Mic Stream)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> inference.cpp</span> <span style="float: right; opacity: 0.7;">(Whisper CPU Engine)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> transcript_manager</span> <span style="float: right; opacity: 0.7;">(Transcript Manager)</span></li></ul></li></ul>`,
      "ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=True use_gpu:=True": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> bringup.launch.py</span> <span style="float: right; opacity: 0.7;">(Launch-File)</span><ul style="padding-left: 14px; margin: 4px 0 0 0; border-left: 1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> audio_listener.py</span> <span style="float: right; opacity: 0.7;">(Mic Stream)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> inference.cpp</span> <span style="float: right; opacity: 0.7;">(Whisper C++ Engine)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> transcript_manager</span> <span style="float: right; opacity: 0.7;">(Transcript Manager)</span></li></ul></li></ul>`,
      "ros2 launch rviz_3d_scene_objects rviz_3d_scene_objects.launch.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> rviz_3d_scene_objects.launch.py</span> <span style="float: right; opacity: 0.7;">(Launch-File)</span><ul style="padding-left: 14px; margin: 4px 0 0 0; border-left: 1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> rviz_3d_scene_objects.py</span> <span style="float: right; opacity: 0.7;">(Statische RViz Marker)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> zed_stand_publisher.py</span> <span style="float: right; opacity: 0.7;">(3D Stativ Marker)</span></li></ul></li></ul>`,
      "ros2 launch rosbridge_server rosbridge_websocket_launch.xml": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> rosbridge_websocket_launch.xml</span> <span style="float: right; opacity: 0.7;">(Launch-File)</span><ul style="padding-left: 14px; margin: 4px 0 0 0; border-left: 1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> rosbridge_websocket.py</span> <span style="float: right; opacity: 0.7;">(WebSocket Server Port 9090)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> rosapi_node.py</span> <span style="float: right; opacity: 0.7;">(ROS API Service)</span></li></ul></li></ul>`,
      // ── Node Commands ───────────────────────────────────────────────────────
      "ros2 run collision_check checker": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  checker.py</span> <span style="float: right; opacity: 0.7;">(collision_check)</span></li></ul>`,
      "ros2 run voice_command_listener listener": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  listener</span> <span style="float: right; opacity: 0.7;">(voice_command_listener)</span></li></ul>`,
      "ros2 run move_to_coordinator move_to_coordinator": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  move_to_coordinator</span> <span style="float: right; opacity: 0.7;">(move_to_coordinator)</span></li></ul>`,
      "ros2 run gaze_control_ui_tobii_glasses gaze_ui": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  gaze_ui</span> <span style="float: right; opacity: 0.7;">(gaze_control_ui_tobii_glasses)</span></li></ul>`,
      "ros2 run whisper_demos whisper_on_key": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  whisper_on_key</span> <span style="float: right; opacity: 0.7;">(whisper_demos)</span></li></ul>`,
      "ros2 run xarm_moveit_servo xarm_keyboard_input": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  xarm_keyboard_input</span> <span style="float: right; opacity: 0.7;">(xarm_moveit_servo)</span></li></ul>`,
      "ros2 run rviz_servo_status_overlay servo_status_overlay": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  servo_status_overlay</span> <span style="float: right; opacity: 0.7;">(rviz_servo_status_overlay)</span></li></ul>`,
      "ros2 run yolo_object_detector yolo_homography_node": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  yolo_homography_node</span> <span style="float: right; opacity: 0.7;">(yolo_object_detector)</span></li></ul>`,
      "ros2 run my_3d_vision_bringup yolo_grasp_executor.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  yolo_grasp_executor.py</span> <span style="float: right; opacity: 0.7;">(my_3d_vision_bringup)</span></li></ul>`,
      "ros2 run web_video_server web_video_server --ros-args -r __node:=http_web_video_server_p8082 -p port:=8082": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-server" style="margin-right: 6px;"><i class="fa-solid fa-server" style="margin-right: 4px;"></i>SERVER</span><span style="color: var(--c-cmd);"> web_video_server</span> <span style="float: right; opacity: 0.7;">(Web Video Server Port 8082)</span></li></ul>`,
      "ros2 run linear_axis_tuner linear_axis_tuner": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  linear_axis_tuner</span> <span style="float: right; opacity: 0.7;">(linear_axis_tuner)</span></li></ul>`,
      "ros2 launch vr_quest3_teleop vr_quest3_teleop.launch.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> vr_quest3_teleop.launch.py</span> <span style="float: right; opacity: 0.7;">(Launch-File)</span><ul style="padding-left: 14px; margin: 4px 0 0 0; border-left: 1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> pkill -9 https_server</span> <span style="float: right; opacity: 0.7;">(VR HTTPS Cleanup)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> adb reverse tcp:9091</span> <span style="float: right; opacity: 0.7;">(Quest 3 Port Forwarding)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> adb reverse tcp:8443</span> <span style="float: right; opacity: 0.7;">(Quest 3 Port Forwarding)</span></li><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> rosbridge_websocket_launch.xml</span> <span style="float: right; opacity: 0.7;">(Sub-Launch)</span><ul style="padding-left: 14px; margin: 4px 0 0 0; border-left: 1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> rosbridge_websocket.py</span> <span style="float: right; opacity: 0.7;">(WebSocket Server Port 9091)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> rosapi_node.py</span> <span style="float: right; opacity: 0.7;">(ROS API)</span></li></ul></li><li><span class="badge badge-server" style="margin-right: 6px;"><i class="fa-solid fa-server" style="margin-right: 4px;"></i>SERVER</span><span style="color: var(--c-cmd);"> https_server.py</span> <span style="float: right; opacity: 0.7;">(HTTPS WebXR Server Port 8443)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> vr_quest3_teleop_node</span> <span style="float: right; opacity: 0.7;">(Teleoperation Bridge)</span></li></ul></li></ul>`,
      "ros2 run rviz_streamer rviz_streamer_node": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  rviz_streamer_node</span> <span style="float: right; opacity: 0.7;">(rviz_streamer)</span></li></ul>`,
      "ros2 run gaze_grasp_routine_tobii_glasses gaze_grasp_routine_tobii_glasses": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  gaze_grasp_routine_tobii_glasses</span> <span style="float: right; opacity: 0.7;">(gaze_grasp_routine_tobii_glasses)</span></li></ul>`,
      "ros2 run my_3d_vision_bringup pointcloud_optimizer.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  pointcloud_optimizer.py</span> <span style="float: right; opacity: 0.7;">(my_3d_vision_bringup)</span></li></ul>`,
      "ros2 run my_3d_vision_bringup yolo_planned_grasp_executor.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  yolo_planned_grasp_executor.py</span> <span style="float: right; opacity: 0.7;">(my_3d_vision_bringup)</span></li></ul>`,
      "ros2 run my_3d_vision_bringup zed_yolo_3d_bbox.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  zed_yolo_3d_bbox.py</span> <span style="float: right; opacity: 0.7;">(my_3d_vision_bringup)</span></li></ul>`,
      "ros2 run tf_tuner tf_tuner": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  tf_tuner</span> <span style="float: right; opacity: 0.7;">(tf_tuner)</span></li></ul>`,
      "ros2 run gaze_control_ui_tobii_glasses gaze_ui_zedm": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  gaze_ui_zedm</span> <span style="float: right; opacity: 0.7;">(gaze_control_ui_tobii_glasses)</span></li></ul>`,
      "ros2 run joy joy_node": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  joy_node</span> <span style="float: right; opacity: 0.7;">(joy)</span></li></ul>`,
      "ros2 launch zed_wrapper zed_camera.launch.py camera_model:=zedm": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> zed_camera.launch.py</span> <span style="float: right; opacity: 0.7;">(Launch-File)</span><ul style="padding-left: 14px; margin: 4px 0 0 0; border-left: 1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> zed_wrapper_node</span> <span style="float: right; opacity: 0.7;">(zed_wrapper)</span></li></ul></li></ul>`,
      "ros2 run rviz2 rviz2 -d ~/dev_ws/src/xarm_ros2/xarm_moveit_servo/rviz/servo.rviz": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  rviz2</span> <span style="float: right; opacity: 0.7;">(rviz2)</span></li></ul>`,
      "python3 src/http_dashboard_monitoring_p8080/workspace_analyzer.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> workspace_analyzer.py</span> <span style="float: right; opacity: 0.7;">(Dashboard Monitoring)</span></li></ul>`,
      "python3 -m http.server 8080 -d src/http_dashboard_monitoring_p8080 & sleep 1 && (google-chrome --app=http://localhost:8080/dashboard_index.html || chromium-browser --app=http://localhost:8080/dashboard_index.html || xdg-open http://localhost:8080/dashboard_index.html) & wait": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-server" style="margin-right: 6px;"><i class="fa-solid fa-server" style="margin-right: 4px;"></i>SERVER</span><span style="color: var(--c-cmd);"> http_dashboard_monitoring_p8080</span> <span style="float: right; opacity: 0.7;">(Web Server Port 8080)</span></li></ul>`,
      "python3 -m http.server 8081 -d src/http_robot_control_ui_p8081 & sleep 1 && (google-chrome --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || chromium-browser --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || xdg-open http://127.0.0.2:8081/index.html) & wait": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-server" style="margin-right: 6px;"><i class="fa-solid fa-server" style="margin-right: 4px;"></i>SERVER</span><span style="color: var(--c-cmd);"> http_robot_control_ui_p8081</span> <span style="float: right; opacity: 0.7;">(Web Server Port 8081)</span></li></ul>`
    };

    // ─── RENDER ───────────────────────────────────────────────────────────────────
    function renderTab(tabId) {
      try {
      const sections = TABS[tabId] || [];

      // Ensure each section has a column assignment, default to distributing 0, 1, 2
      sections.forEach((sec, i) => {
        if (sec.col === undefined) sec.col = i % 3;
      });

      let colHtml = ['<div class="col" id="col-0">', '<div class="col" id="col-1">', '<div class="col" id="col-2">'];

      sections.forEach((sec, secIndex) => {
        if (sec.is_bringup_section) {
          colHtml[sec.col] += `
        <div class="section" data-sec-id="${secIndex}" style="${sec.style || ''}">
          <div class="section-title" style="color: var(--red);"><i class="${sec.icon} section-icon"></i>${sec.title}<span class="title-line"></span></div>
          <div class="actions-grid" style="grid-template-columns: 1fr;">
            <div class="card-wrapper">
              <div class="action-card" data-type="dev" onclick="openLaunchModal(this.closest('.card-wrapper'), getDevSetupActions('fake'), '🚀 DEV Setup gestartet...')" style="cursor: pointer;">
                <div class="action-btn" style="pointer-events: none;">
                  <div class="btn-top">
                    <span class="badge badge-dev"><i class="fa-solid fa-rocket"></i>DEV SEQUENCE</span>
                    <span class="label">RUN DEV Setup (FAKE)</span>
                  </div>
                  <div class="cmd-wrap"><span class="cmd-text" style="color: var(--mut);">Startet die simulierte Roboter-Umgebung in Terminals</span></div>
                </div>
                 
              </div>
              <div class="card-tooltip">
                <div class="card-tooltip-title"><i class="fa-solid fa-rocket"></i> RUN DEV Setup (FAKE)</div>
                <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div>
                ${buildExpandedTooltip(getDevSetupActions('fake'))}
              </div>
            </div>
            <div class="card-wrapper">
              <div class="action-card" data-type="dev" onclick="openLaunchModal(this.closest('.card-wrapper'), getDevSetupActions('real'), '🚀 DEV Setup gestartet...')" style="cursor: pointer;">
                <div class="action-btn" style="pointer-events: none;">
                  <div class="btn-top">
                    <span class="badge badge-dev"><i class="fa-solid fa-rocket"></i>DEV SEQUENCE</span>
                    <span class="label">RUN DEV Setup (REAL)</span>
                  </div>
                  <div class="cmd-wrap"><span class="cmd-text" style="color: var(--mut);">Verbindet mit dem physischen xArm Lite 6 (IP: 192.168.1.175)</span></div>
                </div>
                 
              </div>
              <div class="card-tooltip">
                <div class="card-tooltip-title"><i class="fa-solid fa-rocket"></i> RUN DEV Setup (REAL)</div>
                <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div>
                ${buildExpandedTooltip(getDevSetupActions('real'))}
              </div>
            </div>
          </div>
        </div>`;
          return;
        }

        if (sec.is_remote_bringup_section) {
          colHtml[sec.col] += `
        <div class="section" data-sec-id="${secIndex}" style="${sec.style || ''}">
          <div class="section-title" style="color: var(--cyan);">
            <i class="${sec.icon} section-icon"></i>${sec.title}
            <span class="title-line" style="margin-left: 12px;"></span>
          </div>
          <div class="actions-grid" style="grid-template-columns: 1fr;">
            <div class="card-wrapper">
              <div class="action-card" data-type="server" onclick="openLaunchModal(this.closest('.card-wrapper'), getServerSetupActions('fake'), '🚀 SERVER Setup gestartet...')" style="cursor: pointer;">
                <div class="action-btn" style="pointer-events: none;">
                  <div class="btn-top">
                    <span class="badge badge-server"><i class="fa-solid fa-server"></i>SERVER LAUNCH SEQUENCE</span>
                    <span class="label">RUN SERVER (FAKE)</span>
                  </div>
                  <div class="cmd-wrap"><span class="cmd-text" style="color: var(--mut);">Host-PC: MoveIt Fake, RViz2, Vision, AI</span></div>
                </div>
                 
              </div>
              <div class="card-tooltip">
                <div class="card-tooltip-title"><i class="fa-solid fa-server"></i> RUN SERVER (FAKE)</div>
                <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div>
                ${buildExpandedTooltip(getServerSetupActions("fake"))}
              </div>
            </div>
            
            <div class="card-wrapper">
              <div class="action-card" data-type="server" onclick="openLaunchModal(this.closest('.card-wrapper'), getServerSetupActions('real'), '🚀 SERVER Setup gestartet...')" style="cursor: pointer;">
                <div class="action-btn" style="pointer-events: none;">
                  <div class="btn-top">
                    <span class="badge badge-server"><i class="fa-solid fa-server"></i>SERVER LAUNCH SEQUENCE</span>
                    <span class="label">RUN SERVER (REAL)</span>
                  </div>
                  <div class="cmd-wrap"><span class="cmd-text" style="color: var(--mut);">Host-PC: MoveIt Real, RViz2, Vision, AI (IP: 192.168.1.175)</span></div>
                </div>
                 
              </div>
              <div class="card-tooltip">
                <div class="card-tooltip-title"><i class="fa-solid fa-server"></i> RUN SERVER (REAL)</div>
                <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div>
                ${buildExpandedTooltip(getServerSetupActions("real"))}
              </div>
            </div>
            
            <div class="card-wrapper">
              <div class="action-card" data-type="client" onclick="openLaunchModal(this.closest('.card-wrapper'), getClientSetupActions(), '🚀 CLIENT Setup gestartet...')" style="cursor: pointer;">
                <div class="action-btn" style="pointer-events: none;">
                  <div class="btn-top">
                    <span class="badge badge-client"><i class="fa-solid fa-desktop"></i>CLIENT LAUNCH SEQUENCE</span>
                    <span class="label">RUN CLIENT (Operator Station)</span>
                  </div>
                  <div class="cmd-wrap"><span class="cmd-text" style="color: var(--mut);">Client-PC: Gamepad, Kollisionswächter, RViz2 & ROS-Bridge</span></div>
                </div>
                 
              </div>
              <div class="card-tooltip">
                <div class="card-tooltip-title"><i class="fa-solid fa-desktop"></i> RUN CLIENT (Operator Station)</div>
                <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div>
                ${buildExpandedTooltip(getClientSetupActions())}
              </div>
            </div>
          </div>
        </div>`;
          return;
        }

        if (sec.is_extras_section) {
          colHtml[sec.col] += `
        <div class="section" data-sec-id="${secIndex}" style="${sec.style || ''}">
          <div class="section-title" style="color: #a855f7;"><i class="${sec.icon} section-icon"></i>${sec.title}<span class="title-line"></span></div>
          <div class="actions-grid" style="grid-template-columns: 1fr;">
            <div class="card-wrapper">
              <div class="action-card" data-type="dev" onclick="openLaunchModal(this.closest('.card-wrapper'), getExtrasExecActions(), '🚀 EXTRAS EXEC gestartet...')" style="cursor: pointer;">
                <div class="action-btn" style="pointer-events: none;">
                  <div class="btn-top">
                    <span class="badge badge-dev"><i class="fa-solid fa-bolt"></i>EXTRAS SEQUENCE</span>
                    <span class="label">RUN DEV + Gaze UI (ZED M) - Exocentric</span>
                  </div>
                  <div class="cmd-wrap"><span class="cmd-text" style="color: var(--mut);">DEV Setup (Real) + Gaze UI Node (Glasses 3 Pro) — 7 Terminals</span></div>
                </div>
                 
              </div>
              <div class="card-tooltip">
                <div class="card-tooltip-title"><i class="fa-solid fa-bolt"></i> RUN DEV + Gaze UI (ZED M) - Exocentric</div>
                <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Startet folgende Terminals:</b></div>
                ${buildExpandedTooltip(getExtrasExecActions())}
              </div>
            </div>
            <div class="card-wrapper">
              <div class="action-card" data-type="dev" onclick="openLaunchModal(this.closest('.card-wrapper'), getExtrasExecLegacyCamActions(), '🚀 EXTRAS EXEC (Legacy) gestartet...')" style="cursor: pointer;">
                <div class="action-btn" style="pointer-events: none;">
                  <div class="btn-top">
                    <span class="badge badge-extras"><i class="fa-solid fa-bolt"></i>EXTRAS SEQUENCE</span>
                    <span class="label">RUN DEV + Gaze UI (Rpi Cam) - Egocentric</span>
                  </div>
                  <div class="cmd-wrap"><span class="cmd-text" style="color: var(--mut);">DEV Setup (Real) + Gaze UI Node (IP Cam: .124) — 6 Terminals</span></div>
                </div>
                 
              </div>
              <div class="card-tooltip">
                <div class="card-tooltip-title"><i class="fa-solid fa-bolt"></i> RUN DEV + Gaze UI (Rpi Cam) - Egocentric</div>
                <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Startet folgende Terminals:</b></div>
                ${buildExpandedTooltip(getExtrasExecLegacyCamActions())}
              </div>
            </div>
          </div>
        </div>`;
          return;
        }

        const extraStyle = sec.style ? ` style="${sec.style}"` : '';
        const actionCount = sec.actions ? sec.actions.length : 0;
        const runAllBtn = actionCount > 1
          ? `<button class="run-all-badge" data-sec-index="${secIndex}" onclick="event.stopPropagation(); runAllInSection(${secIndex})" title="Alle ${actionCount} Befehle nacheinander ausführen"><i class="fa-solid fa-play"></i>RUN ALL</button>`
          : '';
        let html = `<div class="section"${extraStyle} data-sec-id="${secIndex}">
      <div class="section-title"><i class="${sec.icon} section-icon"></i>${sec.title}<span class="title-line"></span>${runAllBtn}</div>
      <div class="actions-grid" data-sec-index="${secIndex}">`;
        sec.actions.forEach((a, aIndex) => {
          const mode = a.mode || 'ros';
          const b = BADGE[a.type] || BADGE.sys;
          const safeCmd = a.cmd.replace(/"/g, '&quot;');
          const safeLbl = a.label.replace(/"/g, '&quot;');
          
          let tooltipHtml = '';
          let subCmds = a.cmd.split(/(?:&&|&)/).map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('sleep') && !s.startsWith('wait'));
          
          if (subCmds.length > 1) {
             tooltipHtml = `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;">`;
             subCmds.forEach(subCmd => {
                 let mKey = Object.keys(CMD_DETAILS)
                              .sort((k1, k2) => k2.length - k1.length)
                              .find(k => subCmd.includes(k));
                 if (mKey) {
                     let match = CMD_DETAILS[mKey].match(/<ul[^>]*>([\s\S]*?)<\/ul>$/);
                     if (match) {
                         tooltipHtml += match[1];
                     } else {
                         tooltipHtml += CMD_DETAILS[mKey];
                     }
                 } else if (subCmd.startsWith('ros2 run')) {
                     const parts = subCmd.split(' ');
                     const pkg = parts[2] || '';
                     let node = parts[3] || '';
                     if (!node.includes('.')) node += ' (Source: .py / .cpp)';
                     tooltipHtml += `<li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> ${node}</span> <span style="float: right; opacity: 0.7;">(${pkg})</span></li>`;
                 } else if (subCmd.startsWith('(google-chrome') || subCmd.startsWith('google-chrome')) {
                     tooltipHtml += `<li><span class="badge badge-server" style="margin-right: 6px;"><i class="fa-solid fa-globe"></i>WEB</span><span style="color: var(--c-cmd);"> Chrome Browser</span> <span style="float: right; opacity: 0.7;">(Frontend)</span></li>`;
                 }
             });
             tooltipHtml += `</ul>`;
          } else {
             const aCmdBase = a.cmd.split(' &')[0].trim();
             let matchedKey = Object.keys(CMD_DETAILS)
                                 .sort((k1, k2) => k2.length - k1.length)
                                 .find(k => a.cmd.includes(k) || k.includes(aCmdBase));
             
             if (matchedKey) {
                tooltipHtml = CMD_DETAILS[matchedKey];
             } else if (a.cmd.startsWith('ros2 launch')) {
             const parts = a.cmd.split(' ');
             const pkg = parts[2] || '';
             const launchFile = parts[3] || '';
             const args = parts.slice(4).join(' ');
             tooltipHtml = `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div>
                            <ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;">
                              <li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> ${launchFile}</span> <span style="float: right; opacity: 0.7;">(${pkg})</span>
                              
                              </li>
                            </ul>`;
          } else if (a.cmd.startsWith('ros2 run')) {
             const parts = a.cmd.split(' ');
             const pkg = parts[2] || '';
             let node = parts[3] || '';
             if (!node.includes('.')) node += ' (Source: .py / .cpp)';
             const args = parts.slice(4).join(' ');
             tooltipHtml = `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div>
                            <ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;">
                              <li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> ${node}</span> <span style="float: right; opacity: 0.7;">(${pkg})</span>
                              
                              </li>
                            </ul>`;
          } else {
             tooltipHtml = `<div class="card-tooltip-cmd">${a.cmd}</div>`;
          }
          }
          
          if (tooltipHtml) {
              tooltipHtml = injectOptBadges(tooltipHtml);
          }
          
          html += `
        <div class="card-wrapper">
          <div class="action-card" data-type="${a.type}" data-action-index="${aIndex}" onclick="openLaunchModalFromCard(this)" style="cursor: pointer;">
            <div class="action-btn" data-cmd="${safeCmd}" data-label="${safeLbl}" data-mode="${mode}">
              <div class="btn-top">
                <span class="badge ${b.cls}">${b.icon.startsWith('<svg') ? b.icon : `<i class="${b.icon}"></i>`}${b.label}</span>
                <span class="label">${a.label}</span>
              </div>
              <div class="cmd-wrap"><span class="cmd-text">${a.cmd}</span></div>
            </div>
            <button class="copy-btn" data-cmd="${safeCmd}" title="Kopieren:\n${safeCmd}"><i class="fa-regular fa-copy"></i></button>
          </div>
          <div class="card-tooltip">
            <div class="card-tooltip-title">${b.icon.startsWith('<svg') ? b.icon : `<i class="${b.icon}"></i>`} ${a.label}</div>
            ${tooltipHtml}
          </div>
        </div>`;
        });
        html += `</div></div>`;

        colHtml[sec.col] += html;
      });

      document.getElementById('main-content').innerHTML = colHtml[0] + '</div>' + colHtml[1] + '</div>' + colHtml[2] + '</div>';

      // Event listeners for copy buttons
      document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', e => { e.stopPropagation(); copyCmd(btn.dataset.cmd, btn); });
      });

      // Initialize SortableJS for drag-and-drop
      document.querySelectorAll('.actions-grid').forEach(grid => {
        new Sortable(grid, {
          animation: 200,
          ghostClass: 'sortable-ghost',
          onEnd: async function (evt) {
            const secIndex = parseInt(evt.from.dataset.secIndex);
            const oldIdx = evt.oldIndex;
            const newIdx = evt.newIndex;
            if (oldIdx === newIdx) return;

            // Update internal state
            const arr = TABS[tabId][secIndex].actions;
            const movedItem = arr.splice(oldIdx, 1)[0];
            arr.splice(newIdx, 0, movedItem);

            // Save to backend
            try {
              const res = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(TABS)
              });
              const data = await res.json();
              if (data.ok) showToast('✓ Layout gespeichert');
              else showToast('✗ Speichern fehlgeschlagen', true);
            } catch (err) {
              showToast('✗ Speichern fehlgeschlagen', true);
            }

            // Re-render to ensure DOM perfectly matches internal state
            renderTab(tabId);
          }
        });
      });

      // Initialize SortableJS for drag-and-drop of SECTIONS between columns
      document.querySelectorAll('.col').forEach(col => {
        new Sortable(col, {
          group: 'sections',
          animation: 200,
          ghostClass: 'sortable-ghost',
          handle: '.section-title',
          revertOnSpill: true,
          emptyInsertThreshold: 500, // Erlaubt das Ablegen weit unterhalb der Elemente / in leeren Spalten
          invertSwap: true, // Fix for items with drastically different heights
          onEnd: async function (evt) {
            // Reconstruct the JSON array based on DOM state
            let newSections = [];
            let c0 = Array.from(document.getElementById('col-0').querySelectorAll('.section'));
            let c1 = Array.from(document.getElementById('col-1').querySelectorAll('.section'));
            let c2 = Array.from(document.getElementById('col-2').querySelectorAll('.section'));

            c0.forEach(el => {
              if (!el.dataset.secId) return;
              let s = TABS[tabId][parseInt(el.dataset.secId)];
              if (s) { s.col = 0; newSections.push(s); }
            });
            c1.forEach(el => {
              if (!el.dataset.secId) return;
              let s = TABS[tabId][parseInt(el.dataset.secId)];
              if (s) { s.col = 1; newSections.push(s); }
            });
            c2.forEach(el => {
              if (!el.dataset.secId) return;
              let s = TABS[tabId][parseInt(el.dataset.secId)];
              if (s) { s.col = 2; newSections.push(s); }
            });

            // CRITICAL SAFETY CHECK: Prevent data loss if DOM misread
            if (newSections.length !== TABS[tabId].length) {
              console.error("Data loss detected! Aborting save.");
              renderTab(tabId);
              return;
            }

            TABS[tabId] = newSections;

            // Save to backend
            try {
              const res = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(TABS)
              });
              const data = await res.json();
              if (data.ok) showToast('✓ Layout gespeichert');
              else showToast('✗ Speichern fehlgeschlagen', true);
            } catch (err) {
              showToast('✗ Speichern fehlgeschlagen', true);
            }

            // Re-render
            renderTab(tabId);
          }
        });
      });
      } catch (e) {
        document.getElementById('main-content').innerHTML = '<div style="color: red; padding: 20px; font-family: monospace;"><h2>JS RENDER ERROR</h2><pre>' + e.stack + '</pre></div>';
        console.error("renderTab Error:", e);
      }
    }

    // ─── TABS ─────────────────────────────────────────────────────────────────────
    let currentTab = 'nodes';
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.dataset.tab;
        renderTab(currentTab);
      });
    });

    // ─── NEXUS WEB BACKEND ──────────────────────────────────────────────────────────────────
    // Globale Queue für Befehle (damit bei schnellen Klicks immer 1 Sekunde Delay dazwischen liegt)
    let cmdExecutionQueue = Promise.resolve();

    function runCmd(command, title, mode = 'ros') {
      cmdExecutionQueue = cmdExecutionQueue.then(async () => {
        try {
          const res = await fetch('/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command, title, mode }) });
          const data = await res.json();
          if (data.ok) showToast(`✓ ${title} gestartet`);
          else showToast(`✗ Fehler: ${data.error}`, true);
        } catch (err) { showToast('✗ Nexus Web Backend nicht erreichbar', true); }
        // 1 Sekunde Delay nach jedem Command
        await new Promise(resolve => setTimeout(resolve, 1000));
      });
      return cmdExecutionQueue;
    }

    // ─── RUN ALL IN SECTION ──────────────────────────────────────────────────────
    async function runAllInSection(secIndex) {
      const sections = TABS[currentTab];
      if (!sections || !sections[secIndex]) return;
      const actions = sections[secIndex].actions;
      if (!actions || actions.length === 0) return;

      // Find and style the badge
      const badge = document.querySelector(`.run-all-badge[data-sec-index="${secIndex}"]`);
      if (badge) {
        badge.classList.add('running');
        badge.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>0 / ${actions.length}`;
      }

      // Highlight each action card as it runs
      const cards = document.querySelectorAll(`.actions-grid[data-sec-index="${secIndex}"] .action-card`);

      for (let i = 0; i < actions.length; i++) {
        const a = actions[i];
        const mode = a.mode || 'ros';

        // Highlight current card
        if (cards[i]) {
          cards[i].style.borderColor = 'rgba(56, 189, 248, .6)';
          cards[i].style.boxShadow = '0 0 18px rgba(56, 189, 248, .25)';
        }

        if (badge) badge.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>${i + 1} / ${actions.length}`;

        try {
          await runCmd(a.cmd, a.label, mode);
        } catch (e) {
          console.error(`RUN ALL: Error running "${a.label}":`, e);
        }

        // Reset card highlight
        if (cards[i]) {
          cards[i].style.borderColor = '';
          cards[i].style.boxShadow = '';
        }

        // Short delay between commands so ROS nodes can initialize
        if (i < actions.length - 1) {
          await new Promise(r => setTimeout(r, 1500));
        }
      }

      // Done state
      if (badge) {
        badge.classList.remove('running');
        badge.classList.add('done');
        badge.innerHTML = `<i class="fa-solid fa-check"></i>DONE`;
        setTimeout(() => {
          badge.classList.remove('done');
          badge.innerHTML = `<i class="fa-solid fa-play"></i>RUN ALL`;
        }, 3000);
      }

      showToast(`✓ Alle ${actions.length} Befehle in "${sections[secIndex].title}" ausgeführt`);
    }

    async function killAllROS2() {
      if (!confirm("Wirklich ALLE ROS2 Prozesse UND die dazugehörigen Terminals beenden?")) return;
      try {
        await fetch('/api/kill_all_ros2', { method: 'POST' });
        showToast('✓ Alle ROS2 Prozesse und Terminals werden beendet');
      } catch (err) {
        showToast('✗ Fehler beim Beenden der Prozesse', true);
      }
    }

    // ─── GLOBAL EXPORTS (required for inline onclick="..." attributes) ──────────────
    window.renderTab = renderTab;
    window.runCmd = runCmd;

    // ─── INIT ─────────────────────────────────────────────────────────────────────
    loadConfig();
    window.checkStatus();
    setInterval(() => window.checkStatus(), 5000);
