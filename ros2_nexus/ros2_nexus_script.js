    // ─── DEV SETUP ────────────────────────────────────────────────────────────────
    function sortActions(actions, popupId) {
        if (window.TABS && window.TABS['__popups'] && window.TABS['__popups'][popupId]) {
            const order = window.TABS['__popups'][popupId];
            actions.sort((a, b) => {
                let idxA = order.indexOf(a.cmd);
                let idxB = order.indexOf(b.cmd);
                if (idxA === -1) idxA = 999;
                if (idxB === -1) idxB = 999;
                return idxA - idxB;
            });
        }
        return actions;
    }

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
        { cmd: "ros2 run my_3d_vision_bringup ip_cam_yolo_3d_bbox.py", title: "IP Cam YOLO 3D BBox (Homography .123)" },
        { cmd: "ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=True use_gpu:=True", title: "Whisper Bringup (Voice AI)" },
        { cmd: "ros2 run voice_command_listener voice_command_listener", title: "Voice Command Listener" },
        { cmd: "ros2 launch rosbridge_server rosbridge_websocket_launch.xml", title: "ws_rosbridge_main_p9090" },
        { cmd: "ros2 run tf_control_tuner tf_control_tuner", title: "Transform Tuner (tf_control_tuner)" },
        { cmd: "python3 -m http.server 8081 -d src/http_robot_control_ui_p8081 & sleep 1 && (google-chrome --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || chromium-browser --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || xdg-open http://127.0.0.2:8081/index.html) & wait", title: "http_robot_control_ui_p8081" },
        { cmd: "ros2 run web_video_server web_video_server --ros-args -r __node:=http_web_video_server_p8082 -p port:=8082", title: "http_web_video_server_p8082" },
        { cmd: "ros2 run rviz_streamer rviz_streamer_node", title: "RViz Streamer Node" },
        { cmd: "ros2 run gaze_grasp_routine_tobii_glasses gaze_grasp_routine_tobii_glasses", title: "Tobii Gaze Grasp Node" },
        { cmd: "ros2 launch vr_quest3_teleop vr_quest3_teleop.launch.py", title: "VR Quest 3 Teleop (Port 9091 / 8443)" }
      ];

      if (mode !== "real") {
        actions.push({ cmd: "ros2 run rviz_linear_axis_tuner rviz_linear_axis_tuner", title: "Linear Axis Tuner (FAKE Mode)" });
      }

      

      return sortActions(actions, 'dev_' + mode);
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
        { cmd: "ros2 run tf_control_tuner tf_control_tuner", title: "Transform Tuner (tf_control_tuner)" }
      ];

      

      return sortActions(actions, 'server_' + mode);
    }

    function getClientSetupActions() {
      const actions = [
        { cmd: "ros2 run joy joy_node", title: "Gamepad Driver (joy_node)" },
        { cmd: "ros2 run collision_check checker", title: "Collision Checker Node" },
        { cmd: "ros2 launch rosbridge_server rosbridge_websocket_launch.xml", title: "ws_rosbridge_main_p9090" },
        { cmd: "ros2 run rviz2 rviz2 -d ~/dev_ws/src/xarm_ros2/xarm_moveit_servo/rviz/servo.rviz", title: "RViz2 (Operator View)" },
        { cmd: "ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=False use_gpu:=False", title: "Whisper Bringup (Voice AI) - CPU Mode" },
        { cmd: "ros2 run voice_command_listener voice_command_listener", title: "Voice Command Listener" },
        { cmd: "python3 -m http.server 8081 -d src/http_robot_control_ui_p8081 & sleep 1 && (google-chrome --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || chromium-browser --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || xdg-open http://127.0.0.2:8081/index.html) & wait", title: "http_robot_control_ui_p8081" }
      ];

      

      return sortActions(actions, 'client');
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

      

      return sortActions(actions, 'extras');
    }

    function getExtrasExecLegacyCamActions() {
      const actions = [
        { cmd: "ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_vacuum_gripper:=true report_type:=dev", title: "MoveIt Servo (Real)" },
        { cmd: "ros2 launch robot_motion_handler_movegroup standalone_move_group.launch.py add_vacuum_gripper:=true robot_ip:=192.168.1.175", title: "MoveIt MoveGroup (Standalone/Real)" },
        { cmd: "ros2 launch rosbridge_server rosbridge_websocket_launch.xml", title: "ws_rosbridge_main_p9090" },
        { cmd: "python3 -m http.server 8081 -d src/http_robot_control_ui_p8081 & sleep 1 && (google-chrome --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || chromium-browser --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || xdg-open http://127.0.0.2:8081/index.html) & wait", title: "http_robot_control_ui_p8081" },
        { cmd: "ros2 run gaze_control_ui_tobii_glasses gaze_ui --legacy-cam", title: "Gaze UI Node (Legacy IP Cam .124)" }
      ];
      return sortActions(actions, 'extras_legacy');
    }

    // ─── TAB DATA ────────────────────────────────────────────────────────────────
    let TABS = {};
    window.TABS = TABS;

    async function loadConfig() {
      try {
        const res = await fetch('/api/config');
        TABS = await res.json();
        window.TABS = TABS;
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
        'rosbridge_websocket.py', 'rosapi_node.py', 'joy_node', 'web_video_server'
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
           let expandedWhole = CMD_DETAILS[a.cmd];
           if (expandedWhole) {
               let match = expandedWhole.match(/<ul[^>]*>([\s\S]*?)<\/ul>$/);
               if (match) {
                   html += match[1];
               } else {
                   html += `<li data-raw-cmd="${a.cmd.replace(/"/g, '&quot;')}"><span class="badge badge-sys" style="margin-right: 6px;">CMD</span><span style="color: var(--c-cmd);">${a.cmd}</span></li>`;
               }
               return; // Skip splitting
           }

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
                   if (!a.cmd.includes('http.server')) {
                       html += `<li data-raw-cmd="${subCmd.replace(/"/g, '&quot;')}"><span class="badge badge-server" style="margin-right: 6px;"><i class="fa-solid fa-globe"></i>WEB</span><span class="badge" style="background: rgba(66, 133, 244, 0.15); color: #4285F4; border: 1px solid rgba(66, 133, 244, 0.3); margin-right: 6px;"><i class="fa-brands fa-chrome" style="margin-right: 4px;"></i>+CHROME</span><span style="color: var(--c-cmd);"> Chrome Browser</span> <span style="float: right; opacity: 0.7;">(Frontend)</span></li>`;
                   }
               } else {
                   let badge = subCmd.startsWith('ros2 launch') ? `<span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);">` : `<span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">`;
                   let term = subCmd.split(' ').slice(2).join(' ') || subCmd;
                   if (subCmd.includes('http.server')) {
                       let chromeBadgeStr = a.cmd.includes('google-chrome') || a.cmd.includes('chromium-browser') ? `<span class="badge" style="background: rgba(66, 133, 244, 0.15); color: #4285F4; border: 1px solid rgba(66, 133, 244, 0.3); margin-right: 6px;"><i class="fa-brands fa-chrome" style="margin-right: 4px;"></i>+CHROME</span>` : '';
                       badge = `<span class="badge badge-server" style="margin-right: 6px;"><i class="fa-solid fa-server" style="margin-right: 4px;"></i>SERVER</span>${chromeBadgeStr}<span style="color: var(--c-cmd);">`;
                       term = a.cmd.includes('dashboard') ? "http_dashboard_monitoring_p8080" : "http_robot_control_ui_p8081";
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
      "ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_vacuum_gripper:=true report_type:=dev": `<div style="font-size:11px;color:var(--mut);margin-bottom:4px;"><b>Included Source Files:</b></div><ul style="padding-left:16px;margin:0;font-size:11px;color:var(--mut);line-height:1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> lite6_moveit_servo_realmove.launch.py</span> <span style="float:right;opacity:0.7;">(Launch-File)</span><ul style="padding-left:14px;margin:4px 0 0 0;border-left:1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> _robot_moveit_servo_realmove.launch.py</span> <span style="float:right;opacity:0.7;">(Sub-Launch · MoveIt Servo Stack)</span><ul style="padding-left:14px;margin:4px 0 0 0;border-left:1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> robot_state_publisher</span> <span style="float:right;opacity:0.7;">(URDF / TF)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> joint_state_publisher</span> <span style="float:right;opacity:0.7;">(Joint States)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> static_tf2_broadcaster</span> <span style="float:right;opacity:0.7;">(TF: world → link_base)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> servo_node</span> <span style="float:right;opacity:0.7;">(MoveIt Servo)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> joy_to_servo_node</span> <span style="float:right;opacity:0.7;">(Gamepad to Servo)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> ros2_control_node</span> <span style="float:right;opacity:0.7;">(Hardware Interface)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> component_container</span> <span style="float:right;opacity:0.7;">(Composable Node Container)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> spawner</span> <span style="float:right;opacity:0.7;">(Controller Manager)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> checker</span> <span style="float:right;opacity:0.7;">(Collision Check)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> robot_motion_handler_movegroup</span> <span style="float:right;opacity:0.7;">(Pose MoveIt Node)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> rviz2</span> <span style="float:right;opacity:0.7;">(Visualisierung)</span></li></ul></li></ul></li></ul>`,

      "ros2 launch robot_motion_handler_movegroup standalone_move_group.launch.py add_vacuum_gripper:=true": `<div style="font-size:11px;color:var(--mut);margin-bottom:4px;"><b>Included Source Files:</b></div><ul style="padding-left:16px;margin:0;font-size:11px;color:var(--mut);line-height:1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> standalone_move_group.launch.py</span> <span style="float:right;opacity:0.7;">(Launch-File)</span><ul style="padding-left:14px;margin:4px 0 0 0;border-left:1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> move_group</span> <span style="float:right;opacity:0.7;">(MoveIt Planning Server (OMPL))</span></li></ul></li></ul>`,
      "ros2 launch robot_motion_handler_movegroup standalone_move_group.launch.py robot_ip:=192.168.1.175 add_vacuum_gripper:=true report_type:=dev": `<div style="font-size:11px;color:var(--mut);margin-bottom:4px;"><b>Included Source Files:</b></div><ul style="padding-left:16px;margin:0;font-size:11px;color:var(--mut);line-height:1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> standalone_move_group.launch.py</span> <span style="float:right;opacity:0.7;">(Launch-File)</span><ul style="padding-left:14px;margin:4px 0 0 0;border-left:1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> move_group</span> <span style="float:right;opacity:0.7;">(MoveIt Planning Server (OMPL))</span></li></ul></li></ul>`,
      "ros2 launch my_3d_vision_bringup zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py use_zed_hardware:=false": `<div style="font-size:11px;color:var(--mut);margin-bottom:4px;"><b>Included Source Files:</b></div><ul style="padding-left:16px;margin:0;font-size:11px;color:var(--mut);line-height:1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py</span> <span style="float:right;opacity:0.7;">(Launch-File)</span><ul style="padding-left:14px;margin:4px 0 0 0;border-left:1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> static_transform_publisher</span> <span style="float:right;opacity:0.7;">(TF: world → zed_camera_link)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> pointcloud_optimizer</span> <span style="float:right;opacity:0.7;">(PointCloud ROI Filter)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> zed_yolo_3d_bbox</span> <span style="float:right;opacity:0.7;">(YOLO 3D BBox)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> yolo_planned_grasp_executor</span> <span style="float:right;opacity:0.7;">(Grasp Executor)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> grasp_action_bridge</span> <span style="float:right;opacity:0.7;">(Action Bridge)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> yolo_moveit_collision</span> <span style="float:right;opacity:0.7;">(YOLO → MoveIt Collision)</span></li></ul></li></ul>`,
      "ros2 launch my_3d_vision_bringup zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py": `<div style="font-size:11px;color:var(--mut);margin-bottom:4px;"><b>Included Source Files:</b></div><ul style="padding-left:16px;margin:0;font-size:11px;color:var(--mut);line-height:1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py</span> <span style="float:right;opacity:0.7;">(Launch-File)</span><ul style="padding-left:14px;margin:4px 0 0 0;border-left:1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> static_transform_publisher</span> <span style="float:right;opacity:0.7;">(TF: world → zed_camera_link)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> pointcloud_optimizer</span> <span style="float:right;opacity:0.7;">(PointCloud ROI Filter)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> zed_yolo_3d_bbox</span> <span style="float:right;opacity:0.7;">(YOLO 3D BBox)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> yolo_planned_grasp_executor</span> <span style="float:right;opacity:0.7;">(Grasp Executor)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> grasp_action_bridge</span> <span style="float:right;opacity:0.7;">(Action Bridge)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> yolo_moveit_collision</span> <span style="float:right;opacity:0.7;">(YOLO → MoveIt Collision)</span></li><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> zed_camera.launch.py</span> <span style="float:right;opacity:0.7;">(Sub-Launch · ZED SDK (zed_wrapper))</span><ul style="padding-left:14px;margin:4px 0 0 0;border-left:1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> zed_wrapper</span> <span style="float:right;opacity:0.7;">(ZED SDK Treiber)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> robot_state_publisher</span> <span style="float:right;opacity:0.7;">(URDF / TF)</span></li></ul></li></ul></li></ul>`,
      "ros2 launch my_3d_vision_bringup zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py use_zed_hardware:=true": `<div style="font-size:11px;color:var(--mut);margin-bottom:4px;"><b>Included Source Files:</b></div><ul style="padding-left:16px;margin:0;font-size:11px;color:var(--mut);line-height:1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py</span> <span style="float:right;opacity:0.7;">(Launch-File)</span><ul style="padding-left:14px;margin:4px 0 0 0;border-left:1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> static_transform_publisher</span> <span style="float:right;opacity:0.7;">(TF: world → zed_camera_link)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> pointcloud_optimizer</span> <span style="float:right;opacity:0.7;">(PointCloud ROI Filter)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> zed_yolo_3d_bbox</span> <span style="float:right;opacity:0.7;">(YOLO 3D BBox)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> yolo_planned_grasp_executor</span> <span style="float:right;opacity:0.7;">(Grasp Executor)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> grasp_action_bridge</span> <span style="float:right;opacity:0.7;">(Action Bridge)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> yolo_moveit_collision</span> <span style="float:right;opacity:0.7;">(YOLO → MoveIt Collision)</span></li><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> zed_camera.launch.py</span> <span style="float:right;opacity:0.7;">(Sub-Launch · ZED SDK (zed_wrapper))</span><ul style="padding-left:14px;margin:4px 0 0 0;border-left:1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> zed_wrapper</span> <span style="float:right;opacity:0.7;">(ZED SDK Treiber)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> robot_state_publisher</span> <span style="float:right;opacity:0.7;">(URDF / TF)</span></li></ul></li></ul></li></ul>`,
      "ros2 launch my_3d_vision_bringup zed_cam_eef_rviz_octomap_yolo.launch.py": `<div style="font-size:11px;color:var(--mut);margin-bottom:4px;"><b>Included Source Files:</b></div><ul style="padding-left:16px;margin:0;font-size:11px;color:var(--mut);line-height:1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> zed_cam_eef_rviz_octomap_yolo.launch.py</span> <span style="float:right;opacity:0.7;">(Launch-File)</span><ul style="padding-left:14px;margin:4px 0 0 0;border-left:1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> static_transform_publisher</span> <span style="float:right;opacity:0.7;">(TF: link_tcp → zed_camera_link)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> octomap_server_node</span> <span style="float:right;opacity:0.7;">(Octomap 3D Voxelkarte)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> pointcloud_optimizer</span> <span style="float:right;opacity:0.7;">(PointCloud ROI Filter)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> zed_yolo_3d_bbox</span> <span style="float:right;opacity:0.7;">(YOLO 3D BBox)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> yolo_moveit_collision</span> <span style="float:right;opacity:0.7;">(YOLO → MoveIt Collision)</span></li><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> zed_camera.launch.py</span> <span style="float:right;opacity:0.7;">(Sub-Launch · ZED SDK (zed_wrapper))</span><ul style="padding-left:14px;margin:4px 0 0 0;border-left:1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> zed_wrapper</span> <span style="float:right;opacity:0.7;">(ZED SDK Treiber)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> robot_state_publisher</span> <span style="float:right;opacity:0.7;">(URDF / TF)</span></li></ul></li></ul></li></ul>`,
      "ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=False use_gpu:=False": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> bringup.launch.py</span> <span style="float: right; opacity: 0.7;">(Launch-File)</span><ul style="padding-left: 14px; margin: 4px 0 0 0; border-left: 1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> audio_listener</span> <span style="float: right; opacity: 0.7;">(Mic Stream)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> inference.cpp</span> <span style="float: right; opacity: 0.7;">(Whisper CPU Engine)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> transcript_manager</span> <span style="float: right; opacity: 0.7;">(Transcript Manager)</span></li></ul></li></ul>`,
      "ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=True use_gpu:=True": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> bringup.launch.py</span> <span style="float: right; opacity: 0.7;">(Launch-File)</span><ul style="padding-left: 14px; margin: 4px 0 0 0; border-left: 1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> audio_listener</span> <span style="float: right; opacity: 0.7;">(Mic Stream)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> inference.cpp</span> <span style="float: right; opacity: 0.7;">(Whisper C++ Engine)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> transcript_manager</span> <span style="float: right; opacity: 0.7;">(Transcript Manager)</span></li></ul></li></ul>`,
      "ros2 launch rviz_3d_scene_objects rviz_3d_scene_objects.launch.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> rviz_3d_scene_objects.launch.py</span> <span style="float: right; opacity: 0.7;">(Launch-File)</span><ul style="padding-left: 14px; margin: 4px 0 0 0; border-left: 1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> rviz_3d_scene_objects</span> <span style="float: right; opacity: 0.7;">(Statische RViz Marker)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> zed_stand_publisher</span> <span style="float: right; opacity: 0.7;">(3D Stativ Marker)</span></li></ul></li></ul>`,
      "ros2 launch rosbridge_server rosbridge_websocket_launch.xml": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> rosbridge_websocket_launch.xml</span> <span style="float: right; opacity: 0.7;">(Launch-File)</span><ul style="padding-left: 14px; margin: 4px 0 0 0; border-left: 1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> rosbridge_websocket</span> <span style="float: right; opacity: 0.7;">(WebSocket Server Port 9090)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> rosapi_node</span> <span style="float: right; opacity: 0.7;">(ROS API Service)</span></li></ul></li></ul>`,
      // ── Node Commands ───────────────────────────────────────────────────────
      "ros2 run collision_check checker": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  checker</span> <span style="float: right; opacity: 0.7;">(collision_check)</span></li></ul>`,
      "ros2 run voice_command_listener voice_command_listener": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  voice_command_listener</span> <span style="float: right; opacity: 0.7;">(voice_command_listener)</span></li></ul>`,
      "ros2 run move_to_coordinator move_to_coordinator": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  move_to_coordinator</span> <span style="float: right; opacity: 0.7;">(move_to_coordinator)</span></li></ul>`,
      "ros2 run gaze_control_ui_tobii_glasses gaze_ui": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  gaze_ui</span> <span style="float: right; opacity: 0.7;">(gaze_control_ui_tobii_glasses)</span></li></ul>`,
      "ros2 run whisper_demos whisper_on_key": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  whisper_on_key</span> <span style="float: right; opacity: 0.7;">(whisper_demos)</span></li></ul>`,
      "ros2 run xarm_moveit_servo xarm_keyboard_input": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  xarm_keyboard_input</span> <span style="float: right; opacity: 0.7;">(xarm_moveit_servo)</span></li></ul>`,
      "ros2 run rviz_servo_status_overlay servo_status_overlay": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  servo_status_overlay</span> <span style="float: right; opacity: 0.7;">(rviz_servo_status_overlay)</span></li></ul>`,
      "ros2 run yolo_object_detector yolo_homography_node": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  yolo_homography_node</span> <span style="float: right; opacity: 0.7;">(yolo_object_detector)</span></li></ul>`,
      "ros2 run my_3d_vision_bringup yolo_grasp_executor.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  yolo_grasp_executor</span> <span style="float: right; opacity: 0.7;">(my_3d_vision_bringup)</span></li></ul>`,
      "ros2 run web_video_server web_video_server --ros-args -r __node:=http_web_video_server_p8082 -p port:=8082": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-server" style="margin-right: 6px;"><i class="fa-solid fa-server" style="margin-right: 4px;"></i>SERVER</span><span style="color: var(--c-cmd);"> web_video_server</span> <span style="float: right; opacity: 0.7;">(Web Video Server Port 8082)</span></li></ul>`,
      "ros2 run rviz_linear_axis_tuner rviz_linear_axis_tuner": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  rviz_linear_axis_tuner</span> <span style="float: right; opacity: 0.7;">(rviz_linear_axis_tuner)</span></li></ul>`,
      "ros2 launch vr_quest3_teleop vr_quest3_teleop.launch.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> vr_quest3_teleop.launch.py</span> <span style="float: right; opacity: 0.7;">(Launch-File)</span><ul style="padding-left: 14px; margin: 4px 0 0 0; border-left: 1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> pkill -9 -f https_vr_webxr_p8443.py</span> <span style="float: right; opacity: 0.7;">(VR HTTPS Cleanup)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> adb reverse tcp:9091</span> <span style="float: right; opacity: 0.7;">(Quest 3 Port Forwarding)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> adb reverse tcp:8443</span> <span style="float: right; opacity: 0.7;">(Quest 3 Port Forwarding)</span></li><li><span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);"> rosbridge_websocket_launch.xml</span> <span style="float: right; opacity: 0.7;">(Sub-Launch)</span><ul style="padding-left: 14px; margin: 4px 0 0 0; border-left: 1px solid rgba(255, 255, 255, 0.35);"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> rosbridge_websocket</span> <span style="float: right; opacity: 0.7;">(WebSocket Server Port 9091)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> rosapi_node</span> <span style="float: right; opacity: 0.7;">(ROS API)</span></li></ul></li><li><span class="badge badge-server" style="margin-right: 6px;"><i class="fa-solid fa-server" style="margin-right: 4px;"></i>SERVER</span><span style="color: var(--c-cmd);"> https_vr_webxr_p8443.py</span> <span style="float: right; opacity: 0.7;">(HTTPS WebXR Server Port 8443)</span></li><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> vr_quest3_teleop_node</span> <span style="float: right; opacity: 0.7;">(Teleoperation Bridge)</span></li></ul></li></ul>`,
      "ros2 run rviz_streamer rviz_streamer_node": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  rviz_streamer_node</span> <span style="float: right; opacity: 0.7;">(rviz_streamer)</span></li></ul>`,
      "ros2 run gaze_grasp_routine_tobii_glasses gaze_grasp_routine_tobii_glasses": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  gaze_grasp_routine_tobii_glasses</span> <span style="float: right; opacity: 0.7;">(gaze_grasp_routine_tobii_glasses)</span></li></ul>`,
      "ros2 run my_3d_vision_bringup pointcloud_optimizer.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  pointcloud_optimizer</span> <span style="float: right; opacity: 0.7;">(my_3d_vision_bringup)</span></li></ul>`,
      "ros2 run my_3d_vision_bringup yolo_planned_grasp_executor.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  yolo_planned_grasp_executor</span> <span style="float: right; opacity: 0.7;">(my_3d_vision_bringup)</span></li></ul>`,
      "ros2 run my_3d_vision_bringup zed_yolo_3d_bbox.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  zed_yolo_3d_bbox</span> <span style="float: right; opacity: 0.7;">(my_3d_vision_bringup)</span></li></ul>`,
      "ros2 run my_3d_vision_bringup ip_cam_yolo_3d_bbox.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  ip_cam_yolo_3d_bbox</span> <span style="float: right; opacity: 0.7;">(my_3d_vision_bringup)</span></li></ul>`,
      "ros2 run tf_control_tuner tf_control_tuner": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  tf_control_tuner</span> <span style="float: right; opacity: 0.7;">(tf_control_tuner)</span></li></ul>`,
      "ros2 run gaze_control_ui_tobii_glasses gaze_ui_zedm": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">  gaze_ui_zedm</span> <span style="float: right; opacity: 0.7;">(gaze_control_ui_tobii_glasses)</span></li></ul>`,
    };

    // ─── RENDER ───────────────────────────────────────────────────────────────────
    function renderTab(tabId) {
      try {
      const sections = TABS[tabId] || [];

      // Ensure each section has a column assignment, default to distributing 0, 1, 2
      sections.forEach((sec, i) => {
        if (sec.col === undefined) sec.col = i % 3;
      });

      let colHtml = [
        '<div class="col-wrapper" style="flex: 1; display: flex; flex-direction: column; position: relative;"><h2 style="text-align: center; color: rgba(255,255,255,0.9); font-size: 22px; font-weight: 900; letter-spacing: 3px; margin-bottom: 15px; margin-top: 0; text-transform: uppercase;">Full Setups</h2><div style="height: 2px; background: rgba(255,255,255,0.25); margin: 0 40px 30px 40px;"></div><div class="col" id="col-0" style="flex: 1;">',
        '<div class="col-wrapper" style="flex: 1; display: flex; flex-direction: column; position: relative;"><h2 style="text-align: center; color: rgba(255,255,255,0.9); font-size: 22px; font-weight: 900; letter-spacing: 3px; margin-bottom: 15px; margin-top: 0; text-transform: uppercase;">Launches / Nodes</h2><div style="height: 2px; background: rgba(255,255,255,0.25); margin: 0 40px 30px 40px;"></div><div class="col" id="col-1" style="flex: 1;">',
        '<div class="col-wrapper" style="flex: 1; display: flex; flex-direction: column; position: relative;"><h2 style="text-align: center; color: rgba(255,255,255,0.9); font-size: 22px; font-weight: 900; letter-spacing: 3px; margin-bottom: 15px; margin-top: 0; text-transform: uppercase;">Web/-Server and more</h2><div style="height: 2px; background: rgba(255,255,255,0.25); margin: 0 40px 30px 40px;"></div><div class="col" id="col-2" style="flex: 1;">'
      ];

      sections.forEach((sec, secIndex) => {
        let isSpecialSection = sec.is_bringup_section || sec.is_server_bringup_section || sec.is_client_bringup_section || sec.is_extras_section;
        

        if (isSpecialSection) {
            let badgeColors = {
                'dev_fake': { primary: 'var(--c-dev)', bg1: 'rgba(240, 180, 41, 0.15)', bg2: 'rgba(240, 180, 41, 0.05)', border: 'rgba(240, 180, 41, 0.4)', glow: 'rgba(240, 180, 41, 0.2)' },
                'dev_real': { primary: '#00e5ff', bg1: 'rgba(0, 229, 255, 0.15)', bg2: 'rgba(0, 229, 255, 0.05)', border: 'rgba(0, 229, 255, 0.4)', glow: 'rgba(0, 229, 255, 0.3)' },
                'server_fake': { primary: '#93c5fd', bg1: 'rgba(147, 197, 253, 0.15)', bg2: 'rgba(147, 197, 253, 0.05)', border: 'rgba(147, 197, 253, 0.4)', glow: 'rgba(147, 197, 253, 0.2)' },
                'server_real': { primary: '#3b82f6', bg1: 'rgba(59, 130, 246, 0.15)', bg2: 'rgba(59, 130, 246, 0.05)', border: 'rgba(59, 130, 246, 0.4)', glow: 'rgba(59, 130, 246, 0.3)' },
                'client': { primary: '#a78bfa', bg1: 'rgba(167, 139, 250, 0.15)', bg2: 'rgba(167, 139, 250, 0.05)', border: 'rgba(167, 139, 250, 0.4)', glow: 'rgba(167, 139, 250, 0.3)' },
                'extras_zed': { primary: '#4ade80', bg1: 'rgba(74, 222, 128, 0.15)', bg2: 'rgba(74, 222, 128, 0.05)', border: 'rgba(74, 222, 128, 0.4)', glow: 'rgba(74, 222, 128, 0.3)' },
                'extras_legacy': { primary: '#fb923c', bg1: 'rgba(251, 146, 60, 0.15)', bg2: 'rgba(251, 146, 60, 0.05)', border: 'rgba(251, 146, 60, 0.4)', glow: 'rgba(251, 146, 60, 0.3)' },
                'vr_exocentric': { primary: '#8b5cf6', bg1: 'rgba(139, 92, 246, 0.15)', bg2: 'rgba(139, 92, 246, 0.05)', border: 'rgba(139, 92, 246, 0.4)', glow: 'rgba(139, 92, 246, 0.3)' },
                'vr_egocentric': { primary: '#a78bfa', bg1: 'rgba(167, 139, 250, 0.15)', bg2: 'rgba(167, 139, 250, 0.05)', border: 'rgba(167, 139, 250, 0.4)', glow: 'rgba(167, 139, 250, 0.3)' }
            };

            let secBgGradient1 = 'rgba(240, 180, 41, 0.15)';
            let secBgGradient2 = 'rgba(0, 229, 255, 0.12)';
            if (sec.is_server_bringup_section) { secBgGradient1 = 'rgba(59, 130, 246, 0.15)'; secBgGradient2 = 'rgba(147, 197, 253, 0.12)'; }
            else if (sec.is_client_bringup_section) { secBgGradient1 = 'rgba(167, 139, 250, 0.15)'; secBgGradient2 = 'rgba(139, 92, 246, 0.12)'; }
            else if (sec.is_extras_section) { secBgGradient1 = 'rgba(244, 114, 182, 0.15)'; secBgGradient2 = 'rgba(251, 146, 60, 0.12)'; }

            let sectionHtml = `
        <div class="section" data-sec-id="${secIndex}" style="position: relative; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 20px; background: linear-gradient(145deg, rgba(15, 15, 20, 0.8) 0%, rgba(5, 5, 8, 0.95) 100%); box-shadow: 0 30px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05); padding: 16px; ${sec.style || ''}">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 20px; overflow: hidden; pointer-events: none; z-index: 0;">
             <!-- Abstract Background Elements -->
             <div style="position: absolute; top: -300px; right: -300px; width: 800px; height: 800px; background: radial-gradient(circle, ${secBgGradient1} 0%, transparent 60%); pointer-events: none; z-index: 0;"></div>
             <div style="position: absolute; bottom: -250px; left: -250px; width: 600px; height: 600px; background: radial-gradient(circle, ${secBgGradient2} 0%, transparent 60%); pointer-events: none; z-index: 0;"></div>
          </div>
          
          <div class="section-title" style="position: relative; z-index: 1; margin-bottom: 16px; display: flex; align-items: center; justify-content: center; gap: 12px; color: #fff;">
             <span style="height: 1px; flex: 1; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1));"></span>
             <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                 <span style="font-size: 14px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; background: linear-gradient(135deg, #fff 0%, #a0a5b0 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"><i class="${sec.icon} section-icon" style="color: ${badgeColors[sec.actions[0]?.type || 'dev_fake']?.primary || 'var(--c-dev)'}; margin-right: 10px; -webkit-text-fill-color: initial;"></i>${sec.title}</span>
             </div>
             <span style="height: 1px; flex: 1; background: linear-gradient(270deg, transparent, rgba(255,255,255,0.1));"></span>
          </div>

          <div class="actions-grid" data-sec-index="${secIndex}" style="grid-template-columns: 1fr; gap: 10px; position: relative; z-index: 1;">`;

            (sec.actions || []).forEach((a, aIndex) => {
                let badgeParams = badgeColors[a.type] || badgeColors['dev_fake'];
                let actionFunc = "[]";
                let cmdTitle = "";
                let cmdSub = "";
                let cmdDesc = "";
                let badgeIcon = "fa-solid fa-rocket";
                let badgeText = "SEQUENCE";

                let cmdBadges = [];

                if (a.type === 'dev_fake') {
                    actionFunc = "getDevSetupActions('fake')";
                    cmdTitle = `DEV SETUP`;
                    cmdBadges = ['FAKE'];
                    cmdSub = "Virtual Mode";
                    cmdDesc = "Startet die simulierte Roboter-Umgebung in Terminals";
                    badgeIcon = "fa-solid fa-rocket"; badgeText = "DEV SEQUENCE";
                } else if (a.type === 'dev_real') {
                    actionFunc = "getDevSetupActions('real')";
                    cmdTitle = `DEV SETUP`;
                    cmdBadges = ['REAL'];
                    cmdSub = "Hardware Mode";
                    cmdDesc = "Verbindet mit dem physischen xArm Lite 6 (IP: 192.168.1.175)";
                    badgeIcon = "fa-solid fa-bolt"; badgeText = "DEV SEQUENCE";
                } else if (a.type === 'server_fake') {
                    actionFunc = "getServerSetupActions('fake')";
                    cmdTitle = `SERVER SETUP`;
                    cmdBadges = ['FAKE'];
                    cmdSub = "Virtual Mode";
                    cmdDesc = "Host-PC: MoveIt Fake, RViz2, Vision, AI";
                    badgeIcon = "fa-solid fa-server"; badgeText = "SERVER SEQUENCE";
                } else if (a.type === 'server_real') {
                    actionFunc = "getServerSetupActions('real')";
                    cmdTitle = `SERVER SETUP`;
                    cmdBadges = ['REAL'];
                    cmdSub = "Hardware Mode";
                    cmdDesc = "Host-PC: MoveIt Real, RViz2, Vision, AI (IP: 192.168.1.175)";
                    badgeIcon = "fa-solid fa-server"; badgeText = "SERVER SEQUENCE";
                } else if (a.type === 'client') {
                    actionFunc = "getClientSetupActions()";
                    cmdTitle = `CLIENT SETUP`;
                    cmdBadges = ['CLIENT'];
                    cmdSub = "Operator Station";
                    cmdDesc = "Client-PC: Gamepad, Kollisionswächter, RViz2 & ROS-Bridge";
                    badgeIcon = "fa-solid fa-desktop"; badgeText = "CLIENT SEQUENCE";
                } else if (a.type === 'extras_zed') {
                    actionFunc = "getExtrasExecActions()";
                    cmdTitle = `DEV + Gaze UI`;
                    cmdBadges = ['ZED M', 'TobiiEyeGlasses3'];
                    cmdSub = "Exocentric Mode";
                    cmdDesc = "DEV Setup (Real) + Gaze UI Node (Glasses 3 Pro) — 7 Terminals";
                    badgeIcon = "fa-solid fa-bolt"; badgeText = "EXTRAS SEQUENCE";
                } else if (a.type === 'extras_legacy') {
                    actionFunc = "getExtrasExecLegacyCamActions()";
                    cmdTitle = `DEV + Gaze UI`;
                    cmdBadges = ['Rpi Cam', 'TobiiEyeGlasses3'];
                    cmdSub = "Egocentric Mode";
                    cmdDesc = "DEV Setup (Real) + Gaze UI Node (IP Cam: .124) — 6 Terminals";
                    badgeIcon = "fa-solid fa-bolt"; badgeText = "EXTRAS SEQUENCE";
                } else if (a.type === 'vr_exocentric') {
                    actionFunc = "getExtrasExecActions()";
                    cmdTitle = a.label;
                    cmdSub = "VR Exocentric Camera Mode";
                    cmdDesc = "Meta Quest VR Teleop + Gaze UI (ZED M) — Exocentric";
                    badgeIcon = "fa-solid fa-vr-cardboard"; badgeText = "VR CONTROL SEQUENCE";
                } else if (a.type === 'vr_egocentric') {
                    actionFunc = "getExtrasExecLegacyCamActions()";
                    cmdTitle = a.label;
                    cmdSub = "VR Egocentric Camera Mode";
                    cmdDesc = "Meta Quest VR Teleop + Gaze UI (Rpi Cam) — Egocentric";
                    badgeIcon = "fa-solid fa-vr-cardboard"; badgeText = "VR CONTROL SEQUENCE";
                }

                let words = badgeText.split(' ');
                let bText1 = words[0];
                let bText2 = words.slice(1).join(' ');
                const _tooltipActions = (function() { try { return eval(actionFunc); } catch(e) { return []; } })();

                sectionHtml += `
            <div class="card-wrapper" style="width: 100%;">
              <div class="action-card" data-type="dev" onclick="openLaunchModal(this.closest('.card-wrapper'), ${actionFunc}, '🚀 ${a.label} gestartet...', '${a.type}')" style="cursor: pointer; border-radius: 14px; background: rgba(0,0,0,0.5); border: 1px solid ${badgeParams.border}; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; --card-accent: linear-gradient(90deg, ${badgeParams.primary} 0%, transparent 50%);">
                <div style="position: absolute; top: 0; right: 0; width: 5px; height: 100%; background: linear-gradient(270deg, ${badgeParams.primary} 0%, transparent 100%); pointer-events: none; border-top-right-radius: 13px; border-bottom-right-radius: 13px; z-index: 0;"></div>
                <div class="action-btn" style="pointer-events: none; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 14px 12px; position: relative; z-index: 1;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 12px; width: 100%; position: relative;">
                    ${cmdBadges.length ? `<div style="position: absolute; left: 24px; top: 50%; transform: translateY(-50%); display: flex; gap: 6px; align-items: center;">${cmdBadges.map(b => `<span style="background: ${badgeParams.bg1}; border: 1px solid ${badgeParams.border}; border-radius: 6px; padding: 3px 9px; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: ${badgeParams.primary}; text-shadow: 0 0 12px ${badgeParams.glow}; white-space: nowrap;">${b}</span>`).join('')}</div>` : ''}
                    <div style="background: linear-gradient(135deg, ${badgeParams.bg1}, ${badgeParams.bg2}); border: 1px solid ${badgeParams.border}; border-radius: 10px; padding: 6px 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(0,0,0,0.4), inset 0 0 15px ${badgeParams.bg1};">
                      <span style="color: ${badgeParams.primary}; font-size: 8px; font-weight: 800; letter-spacing: 2px;"><i class="${badgeIcon}" style="margin-right: 6px;"></i>${bText1}</span>
                      <span style="color: #fff; font-size: 10px; font-weight: 900; letter-spacing: 1.5px;">${bText2}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; text-align: left;">
                      <span style="font-size: 24px; font-weight: 900; color: #fff; letter-spacing: -0.5px; line-height: 1.1; text-shadow: 0 0 40px ${badgeParams.glow};">${cmdTitle}</span>
                      <span style="font-size: 11px; color: ${badgeParams.primary}; font-weight: 800; letter-spacing: 4px; text-transform: uppercase; margin-top: 2px; opacity: 0.9;">${cmdSub}</span>
                    </div>
                  </div>
                  <div class="cmd-wrap" style="width: 100%; text-align: left; background: rgba(0,0,0,0.7); border: 1px solid rgba(255,255,255,0.05); padding: 10px 12px; border-radius: 10px; position: relative; overflow: hidden; box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);">
                     <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: ${badgeParams.primary}; box-shadow: 0 0 10px ${badgeParams.primary}; opacity: 0.8;"></div>
                     <div style="position: absolute; top: 0; right: 0; width: 4px; height: 100%; background: ${badgeParams.primary}; box-shadow: 0 0 10px ${badgeParams.primary}; opacity: 0.8;"></div>
                     <span class="cmd-text" style="color: var(--mut); font-size: 10px; font-family: 'JetBrains Mono', monospace;"><span style="color: ${badgeParams.primary};">></span> ${cmdDesc}<span style="animation: pulse-dot 1s infinite;">_</span></span>
                  </div>
                </div>
              </div>
              <div class="card-tooltip">
                <div class="card-tooltip-title"><i class="${badgeIcon}"></i> ${a.label}</div>
                <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div>
                ${buildExpandedTooltip(_tooltipActions)}
              </div>
            </div>`;
            });
            sectionHtml += `</div></div>`;
            colHtml[sec.col] += sectionHtml;
            return;
        }

        const extraStyle = sec.style ? ` style="${sec.style}"` : '';
        const actionCount = sec.actions ? sec.actions.length : 0;
        
        const colors = ['#38bdf8', '#a855f7', '#f43f5e', '#10b981', '#f59e0b', '#ec4899', '#14b8a6'];
        let hash = 0;
        for (let i = 0; i < sec.title.length; i++) hash = sec.title.charCodeAt(i) + ((hash << 5) - hash);
        const secColor = sec.color || colors[Math.abs(hash) % colors.length];
        
        let html = `
        <div class="section"${extraStyle} data-sec-id="${secIndex}" style="position: relative; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 20px; background: linear-gradient(145deg, rgba(15, 15, 20, 0.8) 0%, rgba(5, 5, 8, 0.95) 100%); box-shadow: 0 30px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05); padding: 16px;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; border-radius: 20px; overflow: hidden; pointer-events: none; z-index: 0;">
             <!-- Abstract Background Elements -->
             <div style="position: absolute; top: -300px; right: -300px; width: 800px; height: 800px; background: radial-gradient(circle, ${secColor} 0%, transparent 60%); opacity: 0.15; pointer-events: none; z-index: 0;"></div>
             <div style="position: absolute; bottom: -250px; left: -250px; width: 600px; height: 600px; background: radial-gradient(circle, ${secColor} 0%, transparent 60%); opacity: 0.12; pointer-events: none; z-index: 0;"></div>
          </div>
          
          <div class="section-title" style="position: relative; z-index: 1; margin-bottom: 16px; display: flex; align-items: center; justify-content: center; gap: 12px; color: #fff;">
             <span style="height: 1px; flex: 1; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1));"></span>
             <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                 <span style="font-size: 14px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; background: linear-gradient(135deg, #fff 0%, #a0a5b0 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"><i class="${sec.icon} section-icon" style="color: ${secColor}; margin-right: 10px; -webkit-text-fill-color: initial;"></i>${sec.title}</span>
             </div>
             <span style="height: 1px; flex: 1; background: linear-gradient(270deg, transparent, rgba(255,255,255,0.1));"></span>
          </div>

          <div class="actions-grid" style="grid-template-columns: 1fr; gap: 10px; position: relative; z-index: 1;" data-sec-index="${secIndex}">
            <div class="card-wrapper" style="width: 100%;">
              <div class="action-card" data-type="sys" onclick="openLaunchModal(this.closest('.card-wrapper'), TABS[window.currentTab][${secIndex}].actions, '🚀 ${sec.title.replace(/'/g, "\\'")} gestartet...', 'sec_${secIndex}')" style="cursor: pointer; border-radius: 14px; background: rgba(0,0,0,0.5); border: 1px solid ${secColor}40; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; --card-accent: linear-gradient(90deg, ${secColor} 0%, transparent 50%);">
                <div style="position: absolute; top: 0; right: 0; width: 5px; height: 100%; background: linear-gradient(270deg, ${secColor} 0%, transparent 100%); pointer-events: none; border-top-right-radius: 13px; border-bottom-right-radius: 13px; z-index: 0;"></div>
                <div class="action-btn" style="pointer-events: none; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 14px 12px; position: relative; z-index: 1;">
                   <div style="display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 12px; width: 100%; position: relative;">
                    ${sec.badge ? `<span style="position: absolute; left: 24px; top: 50%; transform: translateY(-50%); background: ${secColor}26; border: 1px solid ${secColor}66; border-radius: 6px; padding: 3px 9px; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: ${secColor}; text-shadow: 0 0 12px ${secColor}66; white-space: nowrap;">${sec.badge}</span>` : ''}
                    <div style="background: linear-gradient(135deg, ${secColor}26, ${secColor}0D); border: 1px solid ${secColor}66; border-radius: 10px; padding: 6px 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(0,0,0,0.4), inset 0 0 15px ${secColor}26;">
                      <span style="color: ${secColor}; font-size: 8px; font-weight: 800; letter-spacing: 2px;"><i class="fa-solid fa-layer-group" style="margin-right: 6px;"></i>MODULE</span>
                      <span style="color: #fff; font-size: 10px; font-weight: 900; letter-spacing: 1.5px;">SEQUENCE</span>
                    </div>
                    <div style="display: flex; flex-direction: column; text-align: left;">
                      ${sec.title === 'CONTROLLERS (INPUT -> MOVEIT SERVO)' ? 
                        `<span style="font-size: 18px; font-weight: 900; color: #fff; letter-spacing: -0.5px; line-height: 1.1; text-shadow: 0 0 40px ${secColor}33;">Choose: Robot Control Moveit - Input Device</span>` : 
                        `<span style="font-size: 20px; font-weight: 900; color: #fff; letter-spacing: -0.5px; line-height: 1.1; text-shadow: 0 0 40px ${secColor}33;">${sec.title}</span>`}
                      <span style="font-size: 11px; color: ${secColor}; font-weight: 800; letter-spacing: 4px; text-transform: uppercase; margin-top: 2px; opacity: 0.9;">Contains ${actionCount} Components</span>
                    </div>
                  </div>
                  <div class="cmd-wrap" style="width: 100%; text-align: left; background: rgba(0,0,0,0.7); border: 1px solid rgba(255,255,255,0.05); padding: 10px 12px; border-radius: 10px; position: relative; overflow: hidden; box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);">
                     <div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: ${secColor}; box-shadow: 0 0 10px ${secColor}; opacity: 0.8;"></div>
                     <div style="position: absolute; top: 0; right: 0; width: 4px; height: 100%; background: ${secColor}; box-shadow: 0 0 10px ${secColor}; opacity: 0.8;"></div>
                     <span class="cmd-text" style="color: var(--mut); font-size: 10px; font-family: 'JetBrains Mono', monospace;"><span style="color: ${secColor};">></span> Öffnet Launcher Menu für ${actionCount} hinterlegte Nodes/Launches<span style="animation: pulse-dot 1s infinite;">_</span></span>
                  </div>
                </div>
              </div>
              <div class="card-tooltip">
                <div class="card-tooltip-title"><i class="fa-solid fa-layer-group"></i> ${sec.title}</div>
                <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div>
                ${buildExpandedTooltip(sec.actions)}
              </div>
            </div>
          </div>
        </div>`;

        colHtml[sec.col] += html;
      });

      document.getElementById('main-content').innerHTML = colHtml[0] + '</div></div>' + colHtml[1] + '</div></div>' + colHtml[2] + '</div></div>';

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
        window.currentTab = currentTab;
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
    window.currentTab = currentTab;
    window.runCmd = runCmd;

    // ─── INIT ─────────────────────────────────────────────────────────────────────
    loadConfig();
    window.checkStatus();
    setInterval(() => window.checkStatus(), 5000);
