    // ─── CONSOLE LOGIC ────────────────────────────────────────────────────────────
    let lastLogId = 0;

    // Drag logic for the console popup
    const popup = document.getElementById('console-popup');
    const header = popup.querySelector('div');
    let isDragging = false;
    let dragStartX = 0, dragStartY = 0;
    let popupStartX = 0, popupStartY = 0;

    header.addEventListener('mousedown', (e) => {
      // Don't drag if clicking the toggle icon area
      if (e.target.closest('#console-toggle-icon') || e.target.closest('div[onclick]')) return;
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      const rect = popup.getBoundingClientRect();
      // Calculate start position relative to bottom/right
      popupStartX = window.innerWidth - rect.right;
      popupStartY = window.innerHeight - rect.bottom;
      document.addEventListener('mousemove', dragPopup);
      document.addEventListener('mouseup', stopDrag);
    });

    // Handle toggle via icon explicitly
    document.getElementById('console-toggle-icon').parentElement.onclick = (e) => {
      e.stopPropagation();
      toggleConsole();
    };

    // Remove the onclick from the header div to prevent conflict with drag
    header.removeAttribute('onclick');
    // Add double click to toggle as fallback
    header.addEventListener('dblclick', toggleConsole);

    function dragPopup(e) {
      if (!isDragging) return;
      e.preventDefault();
      const dx = dragStartX - e.clientX;
      const dy = dragStartY - e.clientY;

      let newRight = popupStartX + dx;
      let newBottom = popupStartY + dy;

      // Keep within window bounds
      newRight = Math.max(0, Math.min(newRight, window.innerWidth - popup.offsetWidth));
      newBottom = Math.max(0, Math.min(newBottom, window.innerHeight - popup.offsetHeight));

      popup.style.right = newRight + 'px';
      popup.style.bottom = newBottom + 'px';
    }

    function stopDrag() {
      isDragging = false;
      document.removeEventListener('mousemove', dragPopup);
      document.removeEventListener('mouseup', stopDrag);
    }

   
    let lastConsoleHeight = '300px';
    let lastConsoleWidth = '1012px';
    let isConsoleMinimized = true; // Sagt dem Script: "Wir starten minimiert!"

    function toggleConsole() {
      const popup = document.getElementById('console-popup');
      const icon = document.getElementById('console-toggle-icon');

      if (isConsoleMinimized) {
        // Aufklappen und gespeicherte Größe wiederherstellen
        popup.style.height = lastConsoleHeight;
        popup.style.width = lastConsoleWidth;
        icon.className = 'fa-solid fa-minus';
        isConsoleMinimized = false;
      } else {
        // Aktuelle Größe für später speichern (falls du es größer gezogen hast)
        if (popup.style.height && popup.style.height !== '40px') lastConsoleHeight = popup.style.height;
        if (popup.style.width && popup.style.width !== '300px') lastConsoleWidth = popup.style.width;
        
        // Zuklappen
        popup.style.height = '40px';
        popup.style.width = '300px';
        icon.className = 'fa-solid fa-window-maximize';
        isConsoleMinimized = true;
      }
    }

    let pollFailures = 0;
    let pollInterval;

    async function pollLogs() {
      try {
        const res = await fetch(`/api/logs?since=${lastLogId}`);
        if (!res.ok) throw new Error("Server offline");
        const data = await res.json();
        pollFailures = 0; // Reset
        if (data.logs && data.logs.length > 0) {
          const content = document.getElementById('console-content');
          data.logs.forEach(log => {
            lastLogId = Math.max(lastLogId, log.id);
            const div = document.createElement('div');
            const timeStr = new Date(log.timestamp * 1000).toLocaleTimeString();
            const color = log.event === 'start' ? 'var(--green)' : 'var(--red)';
            const icon = log.event === 'start' ? 'fa-play' : 'fa-stop';
            div.innerHTML = `<span style="color: var(--dim);">[${timeStr}]</span> <span style="color: ${color};"><i class="fa-solid ${icon}"></i> PID ${log.pid}</span> <span style="color: var(--txt);">${log.command}</span>`;
            content.appendChild(div);
          });
          content.scrollTop = content.scrollHeight;
        }
      } catch (e) {
        pollFailures++;
        if (pollFailures >= 3) {
          clearInterval(pollInterval);
          // Versuche den Tab automatisch zu schließen (funktioniert meist nur bei --app Modus)
          window.close();

          // Fallback-UI, falls der Browser window.close() blockiert
          document.body.innerHTML = `
            <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; background:#0f172a; font-family:'Inter', sans-serif; text-align:center; padding:20px;">
              <i class="fa-solid fa-power-off" style="font-size: 64px; color: #ef4444; margin-bottom: 24px;"></i>
              <h1 style="color:#f8fafc; margin-bottom:8px;">Verbindung getrennt</h1>
              <p style="color:#94a3b8; font-size:16px;">Das ROS 2 Nexus Backend wurde beendet.</p>
              <p style="color:#64748b; font-size:14px; margin-top:24px;">Du kannst diesen Tab nun schließen.</p>
            </div>
          `;
        }
      }
    }

    pollInterval = setInterval(pollLogs, 1000);

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
        { cmd: "ros2 launch rosbridge_server rosbridge_websocket_launch.xml", title: "ROS Bridge Websocket Launch PORT: 9090" },
        { cmd: "ros2 run tf_tuner tf_tuner", title: "Transform Tuner (tf_tuner)" },
        { cmd: "python3 -m http.server 8081 -d src/robot_control_web_ui & sleep 1 && (google-chrome --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || chromium-browser --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || xdg-open http://127.0.0.2:8081/index.html) & wait", title: "Robot Control Web UI SERVER PORT: 8081" },
        { cmd: "ros2 run web_video_server web_video_server --ros-args -p port:=8082", title: "Web Video Server (Port 8082)" },
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
      ];

      

      return actions;
    }

    function getClientSetupActions() {
      const actions = [
        { cmd: "ros2 run joy joy_node", title: "Gamepad Driver (joy_node)" },
        { cmd: "ros2 run collision_check checker", title: "Collision Checker Node" },
        { cmd: "ros2 launch rosbridge_server rosbridge_websocket_launch.xml", title: "ROS Bridge Websocket Launch PORT: 9090" },
        { cmd: "ros2 run rviz2 rviz2 -d ~/dev_ws/src/xarm_ros2/xarm_moveit_servo/rviz/servo.rviz", title: "RViz2 (Operator View)" },
        { cmd: "ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=False use_gpu:=False", title: "Whisper Bringup (Voice AI) - CPU Mode" },
        { cmd: "ros2 run voice_command_listener listener", title: "Voice Command Listener" },
        { cmd: "python3 -m http.server 8081 -d src/robot_control_web_ui & sleep 1 && (google-chrome --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || chromium-browser --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || xdg-open http://127.0.0.2:8081/index.html) & wait", title: "Robot Control Web UI SERVER PORT: 8081" }
      ];

      

      return actions;
    }

    // ─── EXTRAS EXEC SETUP ───────────────────────────────────────────────────────
    function getExtrasExecActions() {
      // Alles was runDevSetup('real') startet + Gaze UI Glasses Node
      const actions = [
        { cmd: "ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_vacuum_gripper:=true report_type:=dev", title: "MoveIt Servo (Real)" },
        { cmd: "ros2 launch robot_motion_handler_movegroup standalone_move_group.launch.py add_vacuum_gripper:=true robot_ip:=192.168.1.175", title: "MoveIt MoveGroup (Standalone/Real)" },
        { cmd: "ros2 launch rosbridge_server rosbridge_websocket_launch.xml", title: "ROS Bridge Websocket Launch PORT: 9090" },
        { cmd: "python3 -m http.server 8081 -d src/robot_control_web_ui & sleep 1 && (google-chrome --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || chromium-browser --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || xdg-open http://127.0.0.2:8081/index.html) & wait", title: "Robot Control Web UI SERVER PORT: 8081" },
        { cmd: "ros2 run web_video_server web_video_server --ros-args -p port:=8082", title: "Web Video Server (Port 8082)" },
        { cmd: "ros2 run gaze_control_ui_tobii_glasses gaze_ui_zedm", title: "Gaze UI Node ZED M (Glasses 3 Pro)" },
        { cmd: "ros2 launch zed_wrapper zed_camera.launch.py camera_model:=zedm", title: "ZED M Camera Node" }
      ];

      

      return actions;
    }

    async function runExtrasExecLegacyCam() {
      const actions = [
        { cmd: "ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_vacuum_gripper:=true report_type:=dev", title: "MoveIt Servo (Real)" },
        { cmd: "ros2 launch robot_motion_handler_movegroup standalone_move_group.launch.py add_vacuum_gripper:=true robot_ip:=192.168.1.175", title: "MoveIt MoveGroup (Standalone/Real)" },
        { cmd: "ros2 launch rosbridge_server rosbridge_websocket_launch.xml", title: "ROS Bridge Websocket Launch PORT: 9090" },
        { cmd: "python3 -m http.server 8081 -d src/robot_control_web_ui & sleep 1 && (google-chrome --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || chromium-browser --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || xdg-open http://127.0.0.2:8081/index.html) & wait", title: "Robot Control Web UI SERVER PORT: 8081" },
        { cmd: "ros2 run gaze_control_ui_tobii_glasses gaze_ui", title: "Gaze UI Node (Legacy IP Cam .124)" }
      ];

      showToast(`🚀 EXTRAS EXEC (Legacy) gestartet... (${actions.length} Terminals)`);

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

    const CMD_DETAILS = {
      // ── Launch Files ────────────────────────────────────────────────────────
      "ros2 launch xarm_moveit_servo lite6_moveit_servo_fake.launch.py add_vacuum_gripper:=true": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> lite6_moveit_servo_fake.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span><ul style="padding-left: 16px; margin: 2px 0 0 0;"><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> servo_node.cpp</span> <span style="float: right; opacity: 0.7;">(MoveIt Servo)</span></li><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> fake_components.cpp</span> <span style="float: right; opacity: 0.7;">(Mock Hardware)</span></li></ul></li></ul>`,
      "ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_vacuum_gripper:=true report_type:=dev": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> lite6_moveit_servo_realmove.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span><ul style="padding-left: 16px; margin: 2px 0 0 0;"><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> servo_node.cpp</span> <span style="float: right; opacity: 0.7;">(MoveIt Servo)</span></li><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> ufactory_driver.cpp</span> <span style="float: right; opacity: 0.7;">(Real Hardware Driver)</span></li></ul></li></ul>`,
      "ros2 launch robot_motion_handler_movegroup standalone_move_group.launch.py add_vacuum_gripper:=true": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> standalone_move_group.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span><ul style="padding-left: 16px; margin: 2px 0 0 0;"><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> move_group.cpp</span> <span style="float: right; opacity: 0.7;">(MoveIt Planning Server)</span></li></ul></li></ul>`,
      "ros2 launch robot_motion_handler_movegroup standalone_move_group.launch.py robot_ip:=192.168.1.175 add_vacuum_gripper:=true report_type:=dev": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> standalone_move_group.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span><ul style="padding-left: 16px; margin: 2px 0 0 0;"><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> move_group.cpp</span> <span style="float: right; opacity: 0.7;">(MoveIt Planning Server)</span></li></ul></li></ul>`,
      "ros2 launch my_3d_vision_bringup zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py</span> <span style="float: right; opacity: 0.7;">(Vision Bringup)</span><ul style="padding-left: 16px; margin: 2px 0 0 0;"><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> pointcloud_optimizer.py</span> <span style="float: right; opacity: 0.7;">(PointCloud ROI Filter)</span></li><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> yolo_moveit_collision.py</span> <span style="float: right; opacity: 0.7;">(YOLO → MoveIt Collision)</span></li><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> zed_yolo_3d_bbox.py</span> <span style="float: right; opacity: 0.7;">(YOLO 3D BBox)</span></li><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> yolo_planned_grasp_executor.py</span> <span style="float: right; opacity: 0.7;">(Grasp Executor)</span></li><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> grasp_action_bridge.py</span> <span style="float: right; opacity: 0.7;">(Action Bridge)</span></li></ul></li></ul>`,
      "ros2 launch my_3d_vision_bringup zed_cam_eef_rviz_octomap_yolo.launch.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> zed_cam_eef_rviz_octomap_yolo.launch.py</span> <span style="float: right; opacity: 0.7;">(Vision Bringup)</span><ul style="padding-left: 16px; margin: 2px 0 0 0;"><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> zed_wrapper.cpp</span> <span style="float: right; opacity: 0.7;">(ZED Camera Driver)</span></li><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> static_transform_publisher.cpp</span> <span style="float: right; opacity: 0.7;">(TF: link_tcp → zed_camera_link)</span></li><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> octomap_server_node.cpp</span> <span style="float: right; opacity: 0.7;">(Octomap 3D Voxelkarte)</span></li><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> pointcloud_optimizer.py</span> <span style="float: right; opacity: 0.7;">(PointCloud ROI Filter)</span></li><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> yolo_moveit_collision.py</span> <span style="float: right; opacity: 0.7;">(YOLO → MoveIt Collision)</span></li><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> zed_yolo_3d_bbox.py</span> <span style="float: right; opacity: 0.7;">(YOLO 3D BBox)</span></li><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> yolo_planned_grasp_executor.py</span> <span style="float: right; opacity: 0.7;">(Grasp Executor)</span></li><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> grasp_action_bridge.py</span> <span style="float: right; opacity: 0.7;">(Action Bridge)</span></li></ul></li></ul>`,
      "ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=False use_gpu:=False": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> bringup.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span><ul style="padding-left: 16px; margin: 2px 0 0 0;"><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> audio_listener.py</span> <span style="float: right; opacity: 0.7;">(Mic Stream)</span></li><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> inference.cpp</span> <span style="float: right; opacity: 0.7;">(Whisper CPU Engine)</span></li></ul></li></ul>`,
      "ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=True use_gpu:=True": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> bringup.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span><ul style="padding-left: 16px; margin: 2px 0 0 0;"><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> audio_listener.py</span> <span style="float: right; opacity: 0.7;">(Mic Stream)</span></li><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> inference.cpp</span> <span style="float: right; opacity: 0.7;">(Whisper C++ Engine)</span></li></ul></li></ul>`,
      "ros2 launch motion_sequence motion_sequence_launch.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> motion_sequence_launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span><ul style="padding-left: 16px; margin: 2px 0 0 0;"><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> motion_sequence.py</span> <span style="float: right; opacity: 0.7;">(Sequencer)</span></li></ul></li></ul>`,
      "ros2 launch rviz_3d_scene_objects rviz_3d_scene_objects.launch.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> rviz_3d_scene_objects.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span><ul style="padding-left: 16px; margin: 2px 0 0 0;"><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> rviz_3d_scene_objects.py</span> <span style="float: right; opacity: 0.7;">(Statische RViz Marker)</span></li><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> zed_stand_publisher.py</span> <span style="float: right; opacity: 0.7;">(3D Stativ Marker)</span></li></ul></li></ul>`,
      "ros2 launch rosbridge_server rosbridge_websocket_launch.xml": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> rosbridge_websocket_launch.xml</span> <span style="float: right; opacity: 0.7;">(Main)</span><ul style="padding-left: 16px; margin: 2px 0 0 0;"><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> rosbridge_websocket.py</span> <span style="float: right; opacity: 0.7;">(WebSocket Server Port 9090)</span></li><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> rosapi_node.py</span> <span style="float: right; opacity: 0.7;">(ROS API Service)</span></li></ul></li></ul>`,
      // ── Node Commands ───────────────────────────────────────────────────────
      "ros2 run collision_check checker": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--c-node);">collision_check</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> checker.py</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Source File:</b> <span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> checker.py</span></div>`,
      "ros2 run voice_command_listener listener": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--c-node);">voice_command_listener</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> listener</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Source File:</b> <span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> voice_command_listener.py</span></div>`,
      "ros2 run move_to_coordinator move_to_coordinator": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--c-node);">move_to_coordinator</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> move_to_coordinator</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Source File:</b> <span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> move_to_coordinator.py</span></div>`,
      "ros2 run gaze_control_ui_tobii_glasses gaze_ui": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--c-node);">gaze_control_ui_tobii_glasses</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> gaze_ui</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Source File:</b> <span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> gaze_ui_node_tobii_glasses.py</span></div>`,
      "ros2 run whisper_demos whisper_on_key": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--c-node);">whisper_demos</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> whisper_on_key</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Source File:</b> <span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> stream.py</span></div>`,
      "ros2 run xarm_moveit_servo xarm_keyboard_input": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--c-node);">xarm_moveit_servo</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> xarm_keyboard_input</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Source File:</b> <span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> xarm_keyboard_input.cpp</span></div>`,
      "ros2 run rviz_servo_status_overlay servo_status_overlay": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--c-node);">rviz_servo_status_overlay</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> servo_status_overlay</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Source File:</b> <span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> servo_status_overlay.py</span></div>`,
      "ros2 run yolo_object_detector yolo_homography_node": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--c-node);">yolo_object_detector</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> yolo_homography_node</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Source File:</b> <span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> yolo_homography_node.py</span></div>`,
      "ros2 run my_3d_vision_bringup yolo_grasp_executor.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--c-node);">my_3d_vision_bringup</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> yolo_grasp_executor.py</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Source File:</b> <span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> yolo_grasp_executor.py</span></div>`,
      "ros2 run web_video_server web_video_server --ros-args -p port:=8082": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--c-node);">web_video_server.cpp</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> web_video_server.cpp</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Info:</b> <span style="color: var(--accent);">Serves ROS image topics to web browsers via HTTP on port 8082</span></div>`,
      "ros2 run linear_axis_tuner linear_axis_tuner": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--c-node);">linear_axis_tuner_node.py</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> linear_axis_tuner_node.py</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Source File:</b> <span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> linear_axis_tuner_node.py</span></div>`
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
                <div class="side-icon" style="width: 54px; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.1); border-right: 1px solid var(--brd); color: var(--c-dev); font-size: 20px; flex-shrink: 0; transition: all 0.2s;">
                  <i class="fa-solid fa-rocket"></i>
                </div>
                <div class="action-btn" style="pointer-events: none;">
                  <div class="btn-top">
                    <span class="badge badge-dev"><i class="fa-solid fa-rocket"></i>DEV SEQUENCE</span>
                    <span class="label">RUN DEV Setup (FAKE)</span>
                  </div>
                  <div class="cmd-wrap"><span class="cmd-text" style="color: var(--mut);">Startet die simulierte Roboter-Umgebung in Terminals</span></div>
                </div>
                 <button class="copy-btn" data-cmd="ros2 launch xarm_moveit_servo lite6_moveit_servo_fake.launch.py add_vacuum_gripper:=true" title="Kopieren:\nros2 launch xarm_moveit_servo lite6_moveit_servo_fake.launch.py add_vacuum_gripper:=true"><i class="fa-regular fa-copy"></i></button>
              </div>
              <div class="card-tooltip">
                <div class="card-tooltip-title"><i class="fa-solid fa-rocket"></i> RUN DEV Setup (FAKE)</div>
                <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div>
                <ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;">
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> lite6_moveit_servo_fake.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> servo_node.cpp</span> <span style="float: right; opacity: 0.7;">(MoveIt Servo)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> fake_components.cpp</span> <span style="float: right; opacity: 0.7;">(Mock Hardware)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> standalone_move_group.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> move_group.cpp</span> <span style="float: right; opacity: 0.7;">(MoveIt Planning Server)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> rviz_3d_scene_objects.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> rviz_3d_scene_objects.py</span> <span style="float: right; opacity: 0.7;">(Static Markers)</span></li><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> zed_stand_publisher.py</span> <span style="float: right; opacity: 0.7;">(3D Stativ Marker)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> robot_motion_handler_movegroup.py</span> <span style="float: right; opacity: 0.7;">(Motion Handler)</span></li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> servo_status_overlay.py</span> <span style="float: right; opacity: 0.7;">(RViz Overlay)</span></li>
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py</span> <span style="float: right; opacity: 0.7;">(Vision Bringup)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> zed_wrapper.cpp</span> <span style="float: right; opacity: 0.7;">(ZED Camera)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> static_transform_publisher.cpp</span> <span style="float: right; opacity: 0.7;">(TF)</span></li>
                       
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> pointcloud_optimizer.py</span> <span style="float: right; opacity: 0.7;">(PointCloud Filter)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> yolo_moveit_collision.py</span> <span style="float: right; opacity: 0.7;">(YOLO Collision)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> zed_yolo_3d_bbox.py</span> <span style="float: right; opacity: 0.7;">(YOLO BBox)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> yolo_planned_grasp_executor.py</span> <span style="float: right; opacity: 0.7;">(Grasp Executor)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> grasp_action_bridge.py</span> <span style="float: right; opacity: 0.7;">(Action Bridge)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> bringup.launch.py</span> <span style="float: right; opacity: 0.7;">(Whisper Bringup)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> audio_listener.py</span> <span style="float: right; opacity: 0.7;">(Mic Stream)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> inference.cpp</span> <span style="float: right; opacity: 0.7;">(Whisper Engine)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> voice_command_listener.py</span> <span style="float: right; opacity: 0.7;">(Voice Controller)</span></li>
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> rosbridge_websocket_launch.xml</span> <span style="float: right; opacity: 0.7;">(ROS Bridge)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> rosbridge_websocket.py</span> <span style="float: right; opacity: 0.7;">(WebSocket Server)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> rosapi_node.py</span> <span style="float: right; opacity: 0.7;">(ROS API)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> tf_tuner.py</span> <span style="float: right; opacity: 0.7;">(TF Tuner)</span></li>
                   <li><span style="color: var(--c-cmd);"><i class="fa-solid fa-server" style="margin-right: 4px; font-size: 10px;"></i> robot_control_web_ui.py</span> <span style="float: right; opacity: 0.7;">(Web Server)</span></li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> web_video_server.cpp</span> <span style="float: right; opacity: 0.7;">(ROS Video Stream :8082)</span></li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> rviz_streamer_node.py</span> <span style="float: right; opacity: 0.7;">(RViz Streamer)</span></li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> linear_axis_tuner_node.py</span> <span style="float: right; opacity: 0.7;">(Linear Axis FAKE)</span></li>
                </ul>
              </div>
            </div>
            <div class="card-wrapper">
              <div class="action-card" data-type="dev" onclick="openLaunchModal(this.closest('.card-wrapper'), getDevSetupActions('real'), '🚀 DEV Setup gestartet...')" style="cursor: pointer;">
                <div class="side-icon" style="width: 54px; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.1); border-right: 1px solid var(--brd); color: var(--c-dev); font-size: 20px; flex-shrink: 0; transition: all 0.2s;">
                  <i class="fa-solid fa-rocket"></i>
                </div>
                <div class="action-btn" style="pointer-events: none;">
                  <div class="btn-top">
                    <span class="badge badge-dev"><i class="fa-solid fa-rocket"></i>DEV SEQUENCE</span>
                    <span class="label">RUN DEV Setup (REAL)</span>
                  </div>
                  <div class="cmd-wrap"><span class="cmd-text" style="color: var(--mut);">Verbindet mit dem physischen xArm Lite 6 (IP: 192.168.1.175)</span></div>
                </div>
                 <button class="copy-btn" data-cmd="ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_vacuum_gripper:=true report_type:=dev" title="Kopieren:\nros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_vacuum_gripper:=true report_type:=dev"><i class="fa-regular fa-copy"></i></button>
              </div>
              <div class="card-tooltip">
                <div class="card-tooltip-title"><i class="fa-solid fa-rocket"></i> RUN DEV Setup (REAL)</div>
                <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div>
                <ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;">
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> lite6_moveit_servo_realmove.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> servo_node.cpp</span> <span style="float: right; opacity: 0.7;">(MoveIt Servo)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> ufactory_driver.cpp</span> <span style="float: right; opacity: 0.7;">(Real Hardware)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> standalone_move_group.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> move_group.cpp</span> <span style="float: right; opacity: 0.7;">(MoveIt Planning Server)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> rviz_3d_scene_objects.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> rviz_3d_scene_objects.py</span> <span style="float: right; opacity: 0.7;">(Static Markers)</span></li><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> zed_stand_publisher.py</span> <span style="float: right; opacity: 0.7;">(3D Stativ Marker)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> robot_motion_handler_movegroup.py</span> <span style="float: right; opacity: 0.7;">(Motion Handler)</span></li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> servo_status_overlay.py</span> <span style="float: right; opacity: 0.7;">(RViz Overlay)</span></li>
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py</span> <span style="float: right; opacity: 0.7;">(Vision Bringup)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> zed_wrapper.cpp</span> <span style="float: right; opacity: 0.7;">(ZED Camera)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> static_transform_publisher.cpp</span> <span style="float: right; opacity: 0.7;">(TF)</span></li>
                       
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> pointcloud_optimizer.py</span> <span style="float: right; opacity: 0.7;">(PointCloud Filter)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> yolo_moveit_collision.py</span> <span style="float: right; opacity: 0.7;">(YOLO Collision)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> zed_yolo_3d_bbox.py</span> <span style="float: right; opacity: 0.7;">(YOLO BBox)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> yolo_planned_grasp_executor.py</span> <span style="float: right; opacity: 0.7;">(Grasp Executor)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> grasp_action_bridge.py</span> <span style="float: right; opacity: 0.7;">(Action Bridge)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> bringup.launch.py</span> <span style="float: right; opacity: 0.7;">(Whisper Bringup)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> audio_listener.py</span> <span style="float: right; opacity: 0.7;">(Mic Stream)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> inference.cpp</span> <span style="float: right; opacity: 0.7;">(Whisper Engine)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> rosbridge_websocket_launch.xml</span> <span style="float: right; opacity: 0.7;">(ROS Bridge)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> rosbridge_websocket.py</span> <span style="float: right; opacity: 0.7;">(WebSocket Server)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> rosapi_node.py</span> <span style="float: right; opacity: 0.7;">(ROS API)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> tf_tuner.py</span> <span style="float: right; opacity: 0.7;">(TF Tuner)</span></li>
                   <li><span style="color: var(--c-cmd);"><i class="fa-solid fa-server" style="margin-right: 4px; font-size: 10px;"></i> robot_control_web_ui.py</span> <span style="float: right; opacity: 0.7;">(Web Server)</span></li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> web_video_server.cpp</span> <span style="float: right; opacity: 0.7;">(ROS Video Stream :8082)</span></li>
                </ul>
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
                <div class="side-icon" style="width: 54px; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.1); border-right: 1px solid var(--brd); color: var(--c-server); font-size: 20px; flex-shrink: 0; transition: all 0.2s;">
                  <i class="fa-solid fa-server"></i>
                </div>
                <div class="action-btn" style="pointer-events: none;">
                  <div class="btn-top">
                    <span class="badge badge-server"><i class="fa-solid fa-server"></i>SERVER LAUNCH SEQUENCE</span>
                    <span class="label">RUN SERVER (FAKE)</span>
                  </div>
                  <div class="cmd-wrap"><span class="cmd-text" style="color: var(--mut);">Host-PC: MoveIt Fake, RViz2, Vision, AI</span></div>
                </div>
                 <button class="copy-btn" data-cmd="ros2 launch xarm_moveit_servo lite6_moveit_servo_fake.launch.py add_vacuum_gripper:=true" title="Kopieren:\nros2 launch xarm_moveit_servo lite6_moveit_servo_fake.launch.py add_vacuum_gripper:=true"><i class="fa-regular fa-copy"></i></button>
              </div>
              <div class="card-tooltip">
                <div class="card-tooltip-title"><i class="fa-solid fa-server"></i> RUN SERVER (FAKE)</div>
                <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div>
                <ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;">
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> lite6_moveit_servo_fake.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> servo_node.cpp</span> <span style="float: right; opacity: 0.7;">(MoveIt Servo)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> fake_components.cpp</span> <span style="float: right; opacity: 0.7;">(Mock Hardware)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> standalone_move_group.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> move_group.cpp</span> <span style="float: right; opacity: 0.7;">(MoveIt Planning Server)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> rviz_3d_scene_objects.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> rviz_3d_scene_objects.py</span> <span style="float: right; opacity: 0.7;">(Static Markers)</span></li><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> zed_stand_publisher.py</span> <span style="float: right; opacity: 0.7;">(3D Stativ Marker)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> robot_motion_handler_movegroup.py</span> <span style="float: right; opacity: 0.7;">(Motion Handler)</span></li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> servo_status_overlay.py</span> <span style="float: right; opacity: 0.7;">(RViz Overlay)</span></li>
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py</span> <span style="float: right; opacity: 0.7;">(Vision Bringup)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> zed_wrapper.cpp</span> <span style="float: right; opacity: 0.7;">(ZED Camera)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> static_transform_publisher.cpp</span> <span style="float: right; opacity: 0.7;">(TF)</span></li>
                       
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> pointcloud_optimizer.py</span> <span style="float: right; opacity: 0.7;">(PointCloud Filter)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> yolo_moveit_collision.py</span> <span style="float: right; opacity: 0.7;">(YOLO Collision)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> zed_yolo_3d_bbox.py</span> <span style="float: right; opacity: 0.7;">(YOLO BBox)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> yolo_planned_grasp_executor.py</span> <span style="float: right; opacity: 0.7;">(Grasp Executor)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> grasp_action_bridge.py</span> <span style="float: right; opacity: 0.7;">(Action Bridge)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> tf_tuner.py</span> <span style="float: right; opacity: 0.7;">(TF Tuner)</span></li>
                </ul>
              </div>
            </div>
            
            <div class="card-wrapper">
              <div class="action-card" data-type="server" onclick="openLaunchModal(this.closest('.card-wrapper'), getServerSetupActions('real'), '🚀 SERVER Setup gestartet...')" style="cursor: pointer;">
                <div class="side-icon" style="width: 54px; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.1); border-right: 1px solid var(--brd); color: var(--c-server); font-size: 20px; flex-shrink: 0; transition: all 0.2s;">
                  <i class="fa-solid fa-server"></i>
                </div>
                <div class="action-btn" style="pointer-events: none;">
                  <div class="btn-top">
                    <span class="badge badge-server"><i class="fa-solid fa-server"></i>SERVER LAUNCH SEQUENCE</span>
                    <span class="label">RUN SERVER (REAL)</span>
                  </div>
                  <div class="cmd-wrap"><span class="cmd-text" style="color: var(--mut);">Host-PC: MoveIt Real, RViz2, Vision, AI (IP: 192.168.1.175)</span></div>
                </div>
                 <button class="copy-btn" data-cmd="ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_vacuum_gripper:=true report_type:=dev" title="Kopieren:\nros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_vacuum_gripper:=true report_type:=dev"><i class="fa-regular fa-copy"></i></button>
              </div>
              <div class="card-tooltip">
                <div class="card-tooltip-title"><i class="fa-solid fa-server"></i> RUN SERVER (REAL)</div>
                <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div>
                <ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;">
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> lite6_moveit_servo_realmove.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> servo_node.cpp</span> <span style="float: right; opacity: 0.7;">(MoveIt Servo)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> ufactory_driver.cpp</span> <span style="float: right; opacity: 0.7;">(Real Hardware)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> standalone_move_group.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> move_group.cpp</span> <span style="float: right; opacity: 0.7;">(MoveIt Planning Server)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> rviz_3d_scene_objects.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> rviz_3d_scene_objects.py</span> <span style="float: right; opacity: 0.7;">(Static Markers)</span></li><li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> zed_stand_publisher.py</span> <span style="float: right; opacity: 0.7;">(3D Stativ Marker)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> robot_motion_handler_movegroup.py</span> <span style="float: right; opacity: 0.7;">(Motion Handler)</span></li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> servo_status_overlay.py</span> <span style="float: right; opacity: 0.7;">(RViz Overlay)</span></li>
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py</span> <span style="float: right; opacity: 0.7;">(Vision Bringup)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> zed_wrapper.cpp</span> <span style="float: right; opacity: 0.7;">(ZED Camera)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> static_transform_publisher.cpp</span> <span style="float: right; opacity: 0.7;">(TF)</span></li>
                       
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> pointcloud_optimizer.py</span> <span style="float: right; opacity: 0.7;">(PointCloud Filter)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> yolo_moveit_collision.py</span> <span style="float: right; opacity: 0.7;">(YOLO Collision)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> zed_yolo_3d_bbox.py</span> <span style="float: right; opacity: 0.7;">(YOLO BBox)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> yolo_planned_grasp_executor.py</span> <span style="float: right; opacity: 0.7;">(Grasp Executor)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> grasp_action_bridge.py</span> <span style="float: right; opacity: 0.7;">(Action Bridge)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> tf_tuner.py</span> <span style="float: right; opacity: 0.7;">(TF Tuner)</span></li>
                </ul>
              </div>
            </div>
            
            <div class="card-wrapper">
              <div class="action-card" data-type="client" onclick="openLaunchModal(this.closest('.card-wrapper'), getClientSetupActions(), '🚀 CLIENT Setup gestartet...')" style="cursor: pointer;">
                <div class="side-icon" style="width: 54px; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.1); border-right: 1px solid var(--brd); color: var(--c-client); font-size: 20px; flex-shrink: 0; transition: all 0.2s;">
                  <i class="fa-solid fa-desktop"></i>
                </div>
                <div class="action-btn" style="pointer-events: none;">
                  <div class="btn-top">
                    <span class="badge badge-client"><i class="fa-solid fa-desktop"></i>CLIENT LAUNCH SEQUENCE</span>
                    <span class="label">RUN CLIENT (Operator Station)</span>
                  </div>
                  <div class="cmd-wrap"><span class="cmd-text" style="color: var(--mut);">Client-PC: Gamepad, Kollisionswächter, RViz2 & ROS-Bridge</span></div>
                </div>
                 <button class="copy-btn" data-cmd="ros2 launch rosbridge_server rosbridge_websocket_launch.xml" title="Kopieren:\nros2 launch rosbridge_server rosbridge_websocket_launch.xml"><i class="fa-regular fa-copy"></i></button>
              </div>
              <div class="card-tooltip">
                <div class="card-tooltip-title"><i class="fa-solid fa-desktop"></i> RUN CLIENT (Operator Station)</div>
                <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div>
                <ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;">
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> joy_node.cpp</span> <span style="float: right; opacity: 0.7;">(Gamepad Driver)</span></li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> checker.py</span> <span style="float: right; opacity: 0.7;">(Collision Checker)</span></li>
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> rosbridge_websocket_launch.xml</span> <span style="float: right; opacity: 0.7;">(ROS Bridge)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> rosbridge_websocket.py</span> <span style="float: right; opacity: 0.7;">(WebSocket Server)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> rosapi_node.py</span> <span style="float: right; opacity: 0.7;">(ROS API)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-cmd);"><i class="fa-solid fa-server" style="margin-right: 4px; font-size: 10px;"></i> servo.rviz</span> <span style="float: right; opacity: 0.7;">(RViz2 Operator View)</span></li>
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> bringup.launch.py</span> <span style="float: right; opacity: 0.7;">(Whisper Bringup CPU)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> audio_listener.py</span> <span style="float: right; opacity: 0.7;">(Mic Stream)</span></li>
                       <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> inference.cpp</span> <span style="float: right; opacity: 0.7;">(Whisper Engine CPU)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> voice_command_listener.py</span> <span style="float: right; opacity: 0.7;">(Voice Controller)</span></li>
                   <li><span style="color: var(--c-cmd);"><i class="fa-solid fa-server" style="margin-right: 4px; font-size: 10px;"></i> robot_control_web_ui.py</span> <span style="float: right; opacity: 0.7;">(Web Server)</span></li>
                </ul>
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
                <div class="side-icon" style="width: 54px; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.1); border-right: 1px solid var(--brd); color: #a855f7; font-size: 20px; flex-shrink: 0; transition: all 0.2s;">
                  <i class="fa-solid fa-bolt"></i>
                </div>
                <div class="action-btn" style="pointer-events: none;">
                  <div class="btn-top">
                    <span class="badge badge-dev"><i class="fa-solid fa-bolt"></i>EXTRAS SEQUENCE</span>
                    <span class="label">RUN DEV + Gaze UI (ZED M) - Exocentric</span>
                  </div>
                  <div class="cmd-wrap"><span class="cmd-text" style="color: var(--mut);">DEV Setup (Real) + Gaze UI Node (Glasses 3 Pro) — 7 Terminals</span></div>
                </div>
                 <button class="copy-btn" data-cmd="ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_vacuum_gripper:=true report_type:=dev" title="Kopieren:\nros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_vacuum_gripper:=true report_type:=dev"><i class="fa-regular fa-copy"></i></button>
              </div>
              <div class="card-tooltip">
                <div class="card-tooltip-title"><i class="fa-solid fa-bolt"></i> RUN DEV + Gaze UI (ZED M) - Exocentric</div>
                <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Startet folgende Terminals:</b></div>
                <ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;">
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> lite6_moveit_servo_realmove.launch.py</span> <span style="float: right; opacity: 0.7;">(MoveIt Servo Real)</span></li>
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> standalone_move_group.launch.py</span> <span style="float: right; opacity: 0.7;">(MoveGroup Real)</span></li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> voice_command_listener.py</span> <span style="float: right; opacity: 0.7;">(Voice Controller)</span></li>
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> rosbridge_websocket_launch.xml</span> <span style="float: right; opacity: 0.7;">(ROS Bridge)</span></li>
                   <li><span style="color: var(--c-cmd);"><i class="fa-solid fa-server" style="margin-right: 4px; font-size: 10px;"></i> robot_control_web_ui.py</span> <span style="float: right; opacity: 0.7;">(Web Server)</span></li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> web_video_server.cpp</span> <span style="float: right; opacity: 0.7;">(ROS Video Stream :8082)</span></li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> gaze_ui_node_tobii_glasses_zedm.py</span> <span style="float: right; opacity: 0.7;">(Gaze UI ZED M Glasses 3 Pro))</span></li>
                </ul>
              </div>
            </div>
            <div class="card-wrapper">
              <div class="action-card" data-type="dev" onclick="runExtrasExecLegacyCam()" style="cursor: pointer;">
                <div class="side-icon" style="width: 54px; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.1); border-right: 1px solid var(--brd); color: #a855f7; font-size: 20px; flex-shrink: 0; transition: all 0.2s;">
                  <i class="fa-solid fa-bolt"></i>
                </div>
                <div class="action-btn" style="pointer-events: none;">
                  <div class="btn-top">
                    <span class="badge badge-extras"><i class="fa-solid fa-bolt"></i>EXTRAS SEQUENCE</span>
                    <span class="label">RUN DEV + Gaze UI (Rpi Cam) - Egocentric</span>
                  </div>
                  <div class="cmd-wrap"><span class="cmd-text" style="color: var(--mut);">DEV Setup (Real) + Gaze UI Node (IP Cam: .124) — 6 Terminals</span></div>
                </div>
                 <button class="copy-btn" data-cmd="ros2 run gaze_control_ui_tobii_glasses gaze_ui --legacy-cam" title="Kopieren"><i class="fa-regular fa-copy"></i></button>
              </div>
              <div class="card-tooltip">
                <div class="card-tooltip-title"><i class="fa-solid fa-bolt"></i> RUN DEV + Gaze UI (Rpi Cam) - Egocentric</div>
                <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Startet folgende Terminals:</b></div>
                <ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;">
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> lite6_moveit_servo_realmove.launch.py</span> <span style="float: right; opacity: 0.7;">(MoveIt Servo Real)</span></li>
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> standalone_move_group.launch.py</span> <span style="float: right; opacity: 0.7;">(MoveGroup Real)</span></li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> voice_command_listener.py</span> <span style="float: right; opacity: 0.7;">(Voice Controller)</span></li>
                   <li><span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> rosbridge_websocket_launch.xml</span> <span style="float: right; opacity: 0.7;">(ROS Bridge)</span></li>
                   <li><span style="color: var(--c-cmd);"><i class="fa-solid fa-server" style="margin-right: 4px; font-size: 10px;"></i> robot_control_web_ui.py</span> <span style="float: right; opacity: 0.7;">(Web Server)</span></li>
                   <li><span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> gaze_ui_node_tobii_glasses.py</span> <span style="float: right; opacity: 0.7;">(Gaze UI Legacy Cam)</span></li>
                </ul>
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
          if (CMD_DETAILS[a.cmd]) {
             tooltipHtml = CMD_DETAILS[a.cmd];
          } else if (a.cmd.startsWith('ros2 launch')) {
             const parts = a.cmd.split(' ');
             const pkg = parts[2] || '';
             const launchFile = parts[3] || '';
             const args = parts.slice(4).join(' ');
             tooltipHtml = `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--c-node);">${pkg}</span></div>
                            <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Launch File:</b> <span style="color: var(--c-launch);"><i class="fa-solid fa-rocket" style="margin-right: 4px; font-size: 10px;"></i> ${launchFile}</span></div>
                            ${args ? `<div style="font-size: 11px; color: var(--mut); margin-top: 4px;"><b>Arguments:</b> <span style="color: var(--c-node);">${args}</span></div>` : ''}`;
          } else if (a.cmd.startsWith('ros2 run')) {
             const parts = a.cmd.split(' ');
             const pkg = parts[2] || '';
             let node = parts[3] || '';
             if (!node.includes('.')) node += ' (Source: .py / .cpp)';
             const args = parts.slice(4).join(' ');
             tooltipHtml = `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--c-node);">${pkg}</span></div>
                            <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--c-node);"><svg viewBox="0 0 100 100" style="width: 12px; height: 12px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> ${node}</span></div>
                            ${args ? `<div style="font-size: 11px; color: var(--mut); margin-top: 4px;"><b>Arguments:</b> <span style="color: var(--c-node);">${args}</span></div>` : ''}`;
          } else {
             tooltipHtml = `<div class="card-tooltip-cmd">${a.cmd}</div>`;
          }
          
          html += `
        <div class="card-wrapper">
          <div class="action-card" data-type="${a.type}" data-action-index="${aIndex}">
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

      document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
           const wrapper = e.currentTarget.closest('.card-wrapper');
           openLaunchModal(wrapper, [{cmd: btn.dataset.cmd, title: btn.dataset.label}], `🚀 ${btn.dataset.label} gestartet...`);
        });
      });
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

    function copyCmd(text, btn) {
      navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        btn.style.color = 'var(--green)';
        setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i>'; btn.style.color = ''; }, 1400);
      });
    }

    function showToast(msg, isErr = false) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.className = 'toast show' + (isErr ? ' err' : '');
      setTimeout(() => t.classList.remove('show'), 2800);
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

    // ─── STATUS ───────────────────────────────────────────────────────────────────
    async function checkStatus() {
      try {
        const data = await (await fetch('/api/ping')).json();
        document.getElementById('status-dot').classList.toggle('ok', data.ok);
        const host = window.location.host || 'local';
        document.getElementById('status-text').textContent = data.ok ? `Online • ${host}` : 'Offline';
      } catch (err) {
        document.getElementById('status-dot').classList.remove('ok');
        document.getElementById('status-text').textContent = 'Offline';
      }
    }

    // ─── INIT ─────────────────────────────────────────────────────────────────────
    loadConfig();
    checkStatus();
    setInterval(checkStatus, 5000);
    // ─── DYNAMIC TOOLTIP POSITIONING ──────────────────────────────────────────────
    document.addEventListener('mouseover', function(e) {
      const wrapper = e.target.closest('.card-wrapper');
      if (!wrapper) return;
      const tooltip = wrapper.querySelector('.card-tooltip');
      if (!tooltip) return;
      
      const rect = wrapper.getBoundingClientRect();
      // Calculate actual height if possible, fallback to 250px
      const tooltipHeight = tooltip.offsetHeight || 250; 
      
      // If there is not enough space above the button, force the tooltip below it
      if (rect.top < tooltipHeight + 20) {
         tooltip.classList.add('tooltip-bottom');
      } else {
         tooltip.classList.remove('tooltip-bottom');
      }
    });

    
    function openLaunchModal(wrapper, actionsData, toastMsg) {
       const tooltip = wrapper.querySelector('.card-tooltip');
       if (!tooltip) return;
       const titleEl = tooltip.querySelector('.card-tooltip-title');
       const titleHTML = titleEl ? titleEl.innerHTML : 'Launch Command';
       
       const contentClone = tooltip.cloneNode(true);
       contentClone.className = '';
       contentClone.style.cssText = 'width: 100%; display: flex; flex-direction: column; gap: 15px; padding: 10px;';
       
       const cloneTitle = contentClone.querySelector('.card-tooltip-title');
       if (cloneTitle) cloneTitle.remove();
       
       // Initialize active states
       actionsData.forEach(a => { a.active = true; a.baseCmd = a.cmd; a.args = []; });
       
              function parseArgs(action) {
           if (!action.cmd.startsWith('ros2 launch') && !action.cmd.startsWith('ros2 run') && !action.cmd.startsWith('ros2 topic pub')) {
               action.baseCmd = action.cmd;
               action.postCmd = '';
               return;
           }

           const tokens = action.cmd.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
           
           let fileIndex = -1;
           for (let i = 0; i < tokens.length; i++) {
              if (tokens[i].endsWith('.py') || tokens[i].endsWith('.cpp') || tokens[i].endsWith('.xml')) {
                  fileIndex = i; break;
              }
           }
           if (fileIndex === -1 && tokens[0] === 'ros2' && tokens[1] === 'run') fileIndex = 3;
           if (fileIndex === -1 && tokens[0] === 'ros2' && tokens[1] === 'topic' && tokens[2] === 'pub') fileIndex = 4;
           
           if (fileIndex !== -1 && fileIndex < tokens.length - 1) {
               let baseTokens = tokens.slice(0, fileIndex + 1);
               let argTokens = [];
               let postArgsTokens = [];
               let parsingArgs = true;
               
               for (let i = fileIndex + 1; i < tokens.length; i++) {
                   const t = tokens[i];
                   if (t === '&' || t === '&&' || t === ';' || t === '|' || t === '||') {
                       parsingArgs = false;
                   }
                   if (parsingArgs) {
                       argTokens.push(t);
                   } else {
                       postArgsTokens.push(t);
                   }
               }
               
               action.baseCmd = baseTokens.join(' ');
               action.postCmd = postArgsTokens.length > 0 ? ' ' + postArgsTokens.join(' ') : '';
               
               argTokens.forEach(arg => {
                   action.args.push({ text: arg, checked: true });
               });
           } else {
               action.baseCmd = action.cmd;
               action.postCmd = '';
           }
       }
       
       function createArgsDiv(action) {
           const argsDiv = document.createElement('div');
           argsDiv.style.display = 'flex';
           argsDiv.style.flexWrap = 'wrap';
           argsDiv.style.gap = '8px';
           argsDiv.style.flex = '1';
           argsDiv.style.justifyContent = 'center';
           argsDiv.style.padding = '0 15px';
           
           if (action && action.args.length > 0) {
               action.args.forEach(argObj => {
                   const argLbl = document.createElement('label');
                   argLbl.style.cssText = 'display:flex; align-items:center; gap:6px; font-size:12px; color:var(--accent); background:rgba(0,255,102,0.1); padding:4px 8px; border-radius:6px; border:1px solid rgba(0,255,102,0.3); cursor:pointer; transition:all 0.2s; white-space:nowrap;';
                   
                   const argCb = document.createElement('input');
                   argCb.type = 'checkbox';
                   argCb.checked = true;
                   argCb.style.accentColor = '#00FF66';
                   argCb.style.cursor = 'pointer';
                   argCb.onclick = (e) => e.stopPropagation();
                   argCb.onchange = (e) => {
                       argObj.checked = e.target.checked;
                       argLbl.style.opacity = e.target.checked ? '1' : '0.4';
                       argLbl.style.borderColor = e.target.checked ? 'rgba(0,255,102,0.3)' : 'rgba(255,255,255,0.1)';
                   };
                   
                   argLbl.appendChild(argCb);
                   argLbl.appendChild(document.createTextNode(argObj.text));
                   argsDiv.appendChild(argLbl);
               });
           }
           return argsDiv;
       }

       const topUls = Array.from(contentClone.children).filter(n => n.tagName === 'UL');
       if (topUls.length > 0) {
          const topUl = topUls[0];
          topUl.style.listStyle = 'none';
          topUl.style.padding = '0';
          topUl.style.margin = '0';
          
          const topLis = Array.from(topUl.children).filter(n => n.tagName === 'LI');
          topLis.forEach(li => {
              const clone = li.cloneNode(true);
              Array.from(clone.children).forEach(c => { if (c.tagName === 'UL') c.remove(); });
              const text = clone.textContent.replace(/\(.*?\)/g, '').trim();
              if (!text) return;
              
              // Find matching action
              const action = actionsData.find(a => {
                  if (a.cmd.includes(text)) return true;
                  const baseTerm = text.replace('.py', '').replace('.cpp', '').replace('.xml', '');
                  if (a.cmd.includes(baseTerm)) return true;
                  if (a.cmd.includes(baseTerm.replace('_node', ''))) return true;
                  return false;
              });
              
              if (action) parseArgs(action);
              
              // Build Flex Header
              const headerDiv = document.createElement('div');
              headerDiv.style.display = 'flex';
              headerDiv.style.justifyContent = 'space-between';
              headerDiv.style.alignItems = 'flex-start';
              headerDiv.style.width = '100%';
              headerDiv.style.gap = '15px';
              
              const textDiv = document.createElement('div');
              textDiv.style.display = 'flex';
              textDiv.style.alignItems = 'center';
              textDiv.style.gap = '8px';
              
              Array.from(li.childNodes).forEach(node => {
                  if (node.tagName !== 'UL') textDiv.appendChild(node);
              });
              
              const argsDiv = createArgsDiv(action);
              
              const mainCb = document.createElement('input');
              mainCb.type = 'checkbox';
              mainCb.checked = true;
              mainCb.style.cssText = 'accent-color: #00FF66; cursor: pointer; flex-shrink: 0; width: 24px; height: 24px; filter: drop-shadow(0 0 8px rgba(0,255,102,0.4)); margin-top: 2px;';
              mainCb.onclick = (e) => e.stopPropagation();
              mainCb.onchange = (e) => {
                  if (action) action.active = e.target.checked;
                  li.style.opacity = e.target.checked ? '1' : '0.4';
              };
              
              headerDiv.appendChild(textDiv);
              headerDiv.appendChild(argsDiv);
              headerDiv.appendChild(mainCb);
              
              li.insertBefore(headerDiv, li.firstChild);
              
              li.style.background = 'rgba(255, 255, 255, 0.03)';
              li.style.border = '1px solid rgba(255, 255, 255, 0.08)';
              li.style.borderRadius = '12px';
              li.style.padding = '18px 20px';
              li.style.marginBottom = '12px';
              li.style.fontSize = '16px';
              li.style.color = '#fff';
              li.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
              li.style.transition = 'all 0.3s ease';
              
              li.onmouseover = () => { li.style.background = 'rgba(255, 255, 255, 0.08)'; li.style.transform = 'translateX(5px)'; li.style.borderColor = 'rgba(0, 255, 102, 0.3)'; };
              li.onmouseout = () => { li.style.background = 'rgba(255, 255, 255, 0.03)'; li.style.transform = 'translateX(0)'; li.style.borderColor = 'rgba(255, 255, 255, 0.08)'; };
              
              const nestedUls = li.querySelectorAll('ul');
              nestedUls.forEach(ul => {
                  ul.style.listStyle = 'none';
                  ul.style.marginTop = '15px';
                  ul.style.paddingLeft = '20px';
                  ul.style.borderLeft = '2px solid rgba(255,255,255,0.1)';
              });
              li.querySelectorAll('li').forEach(subLi => {
                  subLi.style.marginBottom = '8px';
                  subLi.style.fontSize = '14px';
                  subLi.style.color = 'var(--mut)';
                  subLi.style.display = 'flex';
                  subLi.style.alignItems = 'center';
                  subLi.style.gap = '8px';
              });
          });
       } else {
           contentClone.style.background = 'rgba(255,255,255,0.03)';
           contentClone.style.border = '1px solid rgba(255,255,255,0.08)';
           contentClone.style.borderRadius = '12px';
           contentClone.style.padding = '20px';
           contentClone.style.fontSize = '16px';
           contentClone.style.color = '#fff';
           
           if (actionsData[0]) {
               parseArgs(actionsData[0]);
               const argsDiv = createArgsDiv(actionsData[0]);
               if (actionsData[0].args.length > 0) {
                   argsDiv.style.marginTop = '15px';
                   argsDiv.style.justifyContent = 'flex-start';
                   contentClone.appendChild(argsDiv);
               }
           }
       }
       
       const modalHtml = `
          <div id="launch-modal" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.75); z-index:10000; display:flex; align-items:center; justify-content:center; backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); animation: fadeIn 0.3s ease;">
             <div style="background: linear-gradient(145deg, rgba(20,25,35,0.95), rgba(10,15,25,0.98)); border:1px solid rgba(0, 255, 102, 0.2); border-radius:24px; width:85vw; max-width: 1000px; height:85vh; max-height: 800px; display:flex; flex-direction:column; box-shadow:0 30px 70px rgba(0,0,0,0.8), inset 0 0 30px rgba(0,255,102,0.03); transform: translateY(20px); animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;">
                
                <div style="padding:25px 35px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2); border-radius: 24px 24px 0 0;">
                   <h2 style="margin:0; font-size:26px; font-weight:800; color:#fff; text-shadow:0 0 15px rgba(0,255,102,0.3); display:flex; align-items:center; gap:12px;">
                      ${titleHTML.replace('<i', '<i style="color: #00FF66;"')}
                   </h2>
                   <button onclick="document.getElementById('launch-modal').remove()" style="background:rgba(255,255,255,0.08); border:none; color:#fff; width:45px; height:45px; border-radius:50%; font-size:20px; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center;" onmouseover="this.style.background='rgba(255,50,50,0.8)'; this.style.transform='rotate(90deg)';" onmouseout="this.style.background='rgba(255,255,255,0.08)'; this.style.transform='rotate(0)';"><i class="fa-solid fa-xmark"></i></button>
                </div>
                
                <div id="launch-modal-body" style="flex:1; padding:35px; overflow-y:auto; overflow-x:hidden;">
                </div>
                
                <div style="padding:25px; border-top:1px solid rgba(255,255,255,0.08); display:flex; justify-content:center; align-items:center; background:rgba(0,0,0,0.3); border-radius: 0 0 24px 24px;">
                   <button id="launch-modal-start-btn" style="background:linear-gradient(135deg, #00FF66, #00CC55); color:#000; font-size:22px; font-weight:900; padding:18px 70px; border-radius:50px; border:none; cursor:pointer; box-shadow:0 10px 30px rgba(0,255,102,0.3); transition:all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); letter-spacing: 2px; text-transform:uppercase; display:flex; align-items:center; gap:12px;">
                      <i class="fa-solid fa-play"></i> EXECUTE
                   </button>
                </div>
                
                <style>
                  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                  @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                  #launch-modal-body::-webkit-scrollbar { width: 8px; }
                  #launch-modal-body::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 10px; }
                  #launch-modal-body::-webkit-scrollbar-thumb { background: rgba(0,255,102,0.3); border-radius: 10px; }
                  #launch-modal-body::-webkit-scrollbar-thumb:hover { background: rgba(0,255,102,0.5); }
                </style>
             </div>
          </div>
       `;
       
       document.body.insertAdjacentHTML('beforeend', modalHtml);
       document.getElementById('launch-modal-body').appendChild(contentClone);
       
       const startBtn = document.getElementById('launch-modal-start-btn');
       startBtn.onmouseover = () => { startBtn.style.transform='scale(1.05) translateY(-2px)'; startBtn.style.boxShadow='0 15px 35px rgba(0,255,102,0.5)'; };
       startBtn.onmouseout = () => { startBtn.style.transform='scale(1) translateY(0)'; startBtn.style.boxShadow='0 10px 30px rgba(0,255,102,0.3)'; };
       
       startBtn.addEventListener('click', async () => {
          document.getElementById('launch-modal').remove();
          if (toastMsg) showToast(toastMsg);
          
          for (const action of actionsData) {
              if (!action.active) continue;
              
              // Reconstruct command based on checked args
              let finalCmd = action.baseCmd;
              if (action.args.length > 0) {
                  const activeArgs = action.args.filter(a => a.checked).map(a => a.text);
                  if (activeArgs.length > 0) {
                      finalCmd += ' ' + activeArgs.join(' ');
                  }
              }
              if (action.postCmd) {
                  finalCmd += action.postCmd;
              }
              
              try {
                await fetch('/api/run', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ command: finalCmd, title: action.title || 'Launch', mode: "ros" })
                });
                await new Promise(resolve => setTimeout(resolve, 1000));
              } catch (e) {
                console.error("Failed to start:", finalCmd);
              }
          }
       });
    }
