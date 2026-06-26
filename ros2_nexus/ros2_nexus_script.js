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
    async function runDevSetup(mode) {
      let servoCmd = "ros2 launch xarm_moveit_servo lite6_moveit_servo_fake.launch.py add_gripper:=true";
      let servoTitle = "MoveIt Servo (Fake)";
      let moveGroupCmd = "ros2 launch my_3d_vision_bringup standalone_move_group.launch.py add_gripper:=true";
      let moveGroupTitle = "MoveIt MoveGroup (Standalone/Fake)";

      if (mode === "real") {
        servoCmd = "ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_gripper:=True report_type:=dev";
        servoTitle = "MoveIt Servo (Real)";
        moveGroupCmd = "ros2 launch my_3d_vision_bringup standalone_move_group.launch.py add_gripper:=true robot_ip:=192.168.1.175";
        moveGroupTitle = "MoveIt MoveGroup (Standalone/Real)";
      }

      const actions = [
        { cmd: servoCmd, title: servoTitle },
        { cmd: moveGroupCmd, title: moveGroupTitle },
        { cmd: "ros2 launch rviz_marker_static_scene_objects rviz_marker_static_scene_objects.launch.py", title: "RViz Marker Launch" },
        { cmd: "ros2 run rviz_servo_status_overlay servo_status_overlay", title: "Rviz2 - Overlay: MoveIt Servo Status Warning" },
        { cmd: "ros2 launch my_3d_vision_bringup zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py", title: "3D Vision Bringup (cam, tf, yolo3d, pc_opt, grasp)" },
        { cmd: "ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=True use_gpu:=True", title: "Whisper Bringup (Voice AI)" },
        { cmd: "ros2 run voice_command_listener listener", title: "Voice Command Listener" },
        { cmd: "ros2 launch rosbridge_server rosbridge_websocket_launch.xml", title: "ROS Bridge Websocket Launch PORT: 9090" },
        { cmd: "ros2 run tf_tuner tf_tuner", title: "Transform Tuner (tf_tuner)" },
        { cmd: "python3 -m http.server 8081 -d src/robot_control_web_ui & sleep 1 && (google-chrome --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || chromium-browser --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || xdg-open http://127.0.0.2:8081/index.html) & wait", title: "Robot Control Web UI SERVER PORT: 8081" }
      ];

      showToast('🚀 DEV Setup gestartet... (12 Terminals)');

      for (const a of actions) {
        try {
          await fetch('/api/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: a.cmd, title: a.title, mode: "ros" })
          });
          // Delay so terminals open sequentially and nodes have time to initialize
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
          console.error("Failed to start command:", a.cmd, e);
        }
      }
    }

    async function runServerSetup(mode) {
      let servoCmd = "ros2 launch xarm_moveit_servo lite6_moveit_servo_fake.launch.py add_gripper:=true joystick_and_checker:=false";
      let servoTitle = "MoveIt Servo (Fake) [Server]";
      let moveGroupCmd = "ros2 launch my_3d_vision_bringup standalone_move_group.launch.py add_gripper:=true";
      let moveGroupTitle = "MoveIt MoveGroup (Standalone/Fake)";

      if (mode === "real") {
        servoCmd = "ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_gripper:=True report_type:=dev joystick_and_checker:=false";
        servoTitle = "MoveIt Servo (Real) [Server]";
        moveGroupCmd = "ros2 launch my_3d_vision_bringup standalone_move_group.launch.py add_gripper:=true robot_ip:=192.168.1.175";
        moveGroupTitle = "MoveIt MoveGroup (Standalone/Real)";
      }

      const actions = [
        { cmd: servoCmd, title: servoTitle },
        { cmd: moveGroupCmd, title: moveGroupTitle },
        { cmd: "ros2 launch rviz_marker_static_scene_objects rviz_marker_static_scene_objects.launch.py", title: "RViz Marker Launch" },
        { cmd: "ros2 run rviz_servo_status_overlay servo_status_overlay", title: "Rviz2 - Overlay: MoveIt Servo Status Warning" },
        { cmd: "ros2 launch my_3d_vision_bringup zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py", title: "3D Vision Bringup (cam, tf, yolo3d, pc_opt, grasp)" },
        { cmd: "ros2 run tf_tuner tf_tuner", title: "Transform Tuner (tf_tuner)" }
      ];

      showToast(`🚀 SERVER Setup (${mode.toUpperCase()}) gestartet... (${actions.length} Terminals)`);

      for (const a of actions) {
        try {
          await fetch('/api/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: a.cmd, title: a.title, mode: "ros" })
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
          console.error("Failed to start command:", a.cmd, e);
        }
      }
    }

    async function runClientSetup() {
      const actions = [
        { cmd: "ros2 run joy joy_node", title: "Gamepad Driver (joy_node)" },
        { cmd: "ros2 run collision_check checker", title: "Collision Checker Node" },
        { cmd: "ros2 launch rosbridge_server rosbridge_websocket_launch.xml", title: "ROS Bridge Websocket Launch PORT: 9090" },
        { cmd: "ros2 run rviz2 rviz2 -d ~/dev_ws/src/xarm_ros2/xarm_moveit_servo/rviz/servo.rviz", title: "RViz2 (Operator View)" },
        { cmd: "ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=False use_gpu:=False", title: "Whisper Bringup (Voice AI) - CPU Mode" },
        { cmd: "ros2 run voice_command_listener listener", title: "Voice Command Listener" },
        { cmd: "python3 -m http.server 8081 -d src/robot_control_web_ui & sleep 1 && (google-chrome --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || chromium-browser --user-data-dir=$HOME/.robot_control_profile --class=\"robot-control-ui\" --start-maximized --app=http://127.0.0.2:8081/index.html || xdg-open http://127.0.0.2:8081/index.html) & wait", title: "Robot Control Web UI SERVER PORT: 8081" }
      ];

      showToast(`🚀 CLIENT Setup gestartet... (${actions.length} Terminals)`);

      for (const a of actions) {
        try {
          await fetch('/api/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: a.cmd, title: a.title, mode: "ros" })
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (e) {
          console.error("Failed to start command:", a.cmd, e);
        }
      }
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
      node: { cls: "badge-node", icon: "fa-solid fa-circle-dot", label: "NODE" },
      launch: { cls: "badge-launch", icon: "fa-solid fa-rocket", label: "LAUNCH" },
      pub: { cls: "badge-pub", icon: "fa-solid fa-arrow-up-from-bracket", label: "PUB MSG ON TOPIC" },
      sys: { cls: "badge-sys", icon: "fa-solid fa-terminal", label: "CMD" },
      kill: { cls: "badge-kill", icon: "fa-solid fa-skull-crossbones", label: "KILL" },
    };

    const CMD_DETAILS = {
      // ── Launch Files ────────────────────────────────────────────────────────
      "ros2 launch xarm_moveit_servo lite6_moveit_servo_fake.launch.py add_gripper:=true": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span style="color: var(--c-launch);">lite6_moveit_servo_fake.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span><ul style="padding-left: 16px; margin: 2px 0 0 0;"><li><span style="color: var(--accent);">servo_node.cpp</span> <span style="float: right; opacity: 0.7;">(MoveIt Servo)</span></li><li><span style="color: var(--accent);">fake_components.cpp</span> <span style="float: right; opacity: 0.7;">(Mock Hardware)</span></li></ul></li></ul>`,
      "ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_gripper:=true report_type:=dev": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span style="color: var(--c-launch);">lite6_moveit_servo_realmove.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span><ul style="padding-left: 16px; margin: 2px 0 0 0;"><li><span style="color: var(--accent);">servo_node.cpp</span> <span style="float: right; opacity: 0.7;">(MoveIt Servo)</span></li><li><span style="color: var(--accent);">ufactory_driver.cpp</span> <span style="float: right; opacity: 0.7;">(Real Hardware Driver)</span></li></ul></li></ul>`,
      "ros2 launch my_3d_vision_bringup standalone_move_group.launch.py add_gripper:=true": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span style="color: var(--c-launch);">standalone_move_group.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span><ul style="padding-left: 16px; margin: 2px 0 0 0;"><li><span style="color: var(--accent);">move_group</span> <span style="float: right; opacity: 0.7;">(MoveIt Planning Server)</span></li></ul></li></ul>`,
      "ros2 launch my_3d_vision_bringup standalone_move_group.launch.py robot_ip:=192.168.1.175 add_gripper:=true report_type:=dev": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span style="color: var(--c-launch);">standalone_move_group.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span><ul style="padding-left: 16px; margin: 2px 0 0 0;"><li><span style="color: var(--accent);">move_group</span> <span style="float: right; opacity: 0.7;">(MoveIt Planning Server)</span></li></ul></li></ul>`,
      "ros2 launch my_3d_vision_bringup zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span style="color: var(--c-launch);">zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py</span> <span style="float: right; opacity: 0.7;">(Vision Bringup)</span><ul style="padding-left: 16px; margin: 2px 0 0 0;"><li><span style="color: var(--accent);">zed_wrapper.cpp</span> <span style="float: right; opacity: 0.7;">(ZED Camera Driver)</span></li><li><span style="color: var(--accent);">static_transform_publisher</span> <span style="float: right; opacity: 0.7;">(TF: link_base → zed_camera_link)</span></li><li><span style="color: var(--accent);">zed_stand_publisher.py</span> <span style="float: right; opacity: 0.7;">(3D Stativ Marker)</span></li><li><span style="color: var(--accent);">pointcloud_optimizer.py</span> <span style="float: right; opacity: 0.7;">(PointCloud ROI Filter)</span></li><li><span style="color: var(--accent);">yolo_moveit_collision.py</span> <span style="float: right; opacity: 0.7;">(YOLO → MoveIt Collision)</span></li><li><span style="color: var(--accent);">zed_yolo_3d_bbox.py</span> <span style="float: right; opacity: 0.7;">(YOLO 3D BBox)</span></li><li><span style="color: var(--accent);">yolo_planned_grasp_executor.py</span> <span style="float: right; opacity: 0.7;">(Grasp Executor)</span></li><li><span style="color: var(--accent);">grasp_action_bridge.py</span> <span style="float: right; opacity: 0.7;">(Action Bridge)</span></li></ul></li></ul>`,
      "ros2 launch my_3d_vision_bringup zed_cam_eef_rviz_octomap_yolo.launch.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span style="color: var(--c-launch);">zed_cam_eef_rviz_octomap_yolo.launch.py</span> <span style="float: right; opacity: 0.7;">(Vision Bringup)</span><ul style="padding-left: 16px; margin: 2px 0 0 0;"><li><span style="color: var(--accent);">zed_wrapper.cpp</span> <span style="float: right; opacity: 0.7;">(ZED Camera Driver)</span></li><li><span style="color: var(--accent);">static_transform_publisher</span> <span style="float: right; opacity: 0.7;">(TF: link_tcp → zed_camera_link)</span></li><li><span style="color: var(--accent);">octomap_server_node</span> <span style="float: right; opacity: 0.7;">(Octomap 3D Voxelkarte)</span></li><li><span style="color: var(--accent);">pointcloud_optimizer.py</span> <span style="float: right; opacity: 0.7;">(PointCloud ROI Filter)</span></li><li><span style="color: var(--accent);">yolo_moveit_collision.py</span> <span style="float: right; opacity: 0.7;">(YOLO → MoveIt Collision)</span></li><li><span style="color: var(--accent);">zed_yolo_3d_bbox.py</span> <span style="float: right; opacity: 0.7;">(YOLO 3D BBox)</span></li><li><span style="color: var(--accent);">yolo_planned_grasp_executor.py</span> <span style="float: right; opacity: 0.7;">(Grasp Executor)</span></li><li><span style="color: var(--accent);">grasp_action_bridge.py</span> <span style="float: right; opacity: 0.7;">(Action Bridge)</span></li></ul></li></ul>`,
      "ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=False use_gpu:=False": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span style="color: var(--c-launch);">bringup.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span><ul style="padding-left: 16px; margin: 2px 0 0 0;"><li><span style="color: var(--accent);">audio_listener.py</span> <span style="float: right; opacity: 0.7;">(Mic Stream)</span></li><li><span style="color: var(--accent);">inference.cpp</span> <span style="float: right; opacity: 0.7;">(Whisper CPU Engine)</span></li></ul></li></ul>`,
      "ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=True use_gpu:=True": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span style="color: var(--c-launch);">bringup.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span><ul style="padding-left: 16px; margin: 2px 0 0 0;"><li><span style="color: var(--accent);">audio_listener.py</span> <span style="float: right; opacity: 0.7;">(Mic Stream)</span></li><li><span style="color: var(--accent);">inference.cpp</span> <span style="float: right; opacity: 0.7;">(Whisper C++ Engine)</span></li></ul></li></ul>`,
      "ros2 launch motion_sequence motion_sequence_launch.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span style="color: var(--c-launch);">motion_sequence_launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span><ul style="padding-left: 16px; margin: 2px 0 0 0;"><li><span style="color: var(--accent);">motion_sequence.py</span> <span style="float: right; opacity: 0.7;">(Sequencer)</span></li></ul></li></ul>`,
      "ros2 launch rviz_marker_static_scene_objects rviz_marker_static_scene_objects.launch.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span style="color: var(--c-launch);">rviz_marker_static_scene_objects.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span><ul style="padding-left: 16px; margin: 2px 0 0 0;"><li><span style="color: var(--accent);">rviz_marker_static_scene_objects.py</span> <span style="float: right; opacity: 0.7;">(Statische RViz Marker)</span></li></ul></li></ul>`,
      "ros2 launch rosbridge_server rosbridge_websocket_launch.xml": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;"><li><span style="color: var(--c-launch);">rosbridge_websocket_launch.xml</span> <span style="float: right; opacity: 0.7;">(Main)</span><ul style="padding-left: 16px; margin: 2px 0 0 0;"><li><span style="color: var(--accent);">rosbridge_websocket.py</span> <span style="float: right; opacity: 0.7;">(WebSocket Server Port 9090)</span></li><li><span style="color: var(--accent);">rosapi_node.py</span> <span style="float: right; opacity: 0.7;">(ROS API Service)</span></li></ul></li></ul>`,
      // ── Node Commands ───────────────────────────────────────────────────────
      "ros2 run collision_check checker": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--accent);">collision_check</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--accent);">checker</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Source File:</b> <span style="color: var(--accent);">checker.py</span></div>`,
      "ros2 run voice_command_listener listener": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--accent);">voice_command_listener</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--accent);">listener</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Source File:</b> <span style="color: var(--accent);">voice_command_listener.py</span></div>`,
      "ros2 run move_to_coordinator move_to_coordinator": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--accent);">move_to_coordinator</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--accent);">move_to_coordinator</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Source File:</b> <span style="color: var(--accent);">move_to_coordinator.py</span></div>`,
      "ros2 run gaze_control gaze_ui": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--accent);">gaze_control</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--accent);">gaze_ui</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Source File:</b> <span style="color: var(--accent);">gaze_ui_node.py</span></div>`,
      "ros2 run whisper_demos whisper_on_key": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--accent);">whisper_demos</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--accent);">whisper_on_key</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Source File:</b> <span style="color: var(--accent);">stream.py</span></div>`,
      "ros2 run xarm_moveit_servo xarm_keyboard_input": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--accent);">xarm_moveit_servo</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--accent);">xarm_keyboard_input</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Source File:</b> <span style="color: var(--accent);">xarm_keyboard_input.cpp</span></div>`,
      "ros2 run rviz_servo_status_overlay servo_status_overlay": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--accent);">rviz_servo_status_overlay</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--accent);">servo_status_overlay</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Source File:</b> <span style="color: var(--accent);">servo_status_overlay.py</span></div>`,
      "ros2 run yolo_object_detector yolo_homography_node": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--accent);">yolo_object_detector</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--accent);">yolo_homography_node</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Source File:</b> <span style="color: var(--accent);">yolo_homography_node.py</span></div>`,
      "ros2 run my_3d_vision_bringup yolo_grasp_executor.py": `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--accent);">my_3d_vision_bringup</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--accent);">yolo_grasp_executor.py</span></div><div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Source File:</b> <span style="color: var(--accent);">yolo_grasp_executor.py</span></div>`
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
              <div class="action-card" data-type="dev" onclick="runDevSetup('fake')" style="cursor: pointer;">
                <div class="action-btn" style="pointer-events: none;">
                  <div class="btn-top">
                    <span class="badge badge-dev"><i class="fa-solid fa-rocket"></i>DEV SEQUENCE</span>
                    <span class="label">RUN DEV Setup (FAKE)</span>
                  </div>
                  <div class="cmd-wrap"><span class="cmd-text" style="color: var(--mut);">Startet die simulierte Roboter-Umgebung in Terminals</span></div>
                </div>
                <div class="side-icon" style="width: 54px; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.1); border-left: 1px solid var(--brd); color: var(--c-dev); font-size: 20px; flex-shrink: 0; transition: all 0.2s;">
                  <i class="fa-solid fa-rocket"></i>
                </div>
              </div>
              <div class="card-tooltip">
                <div class="card-tooltip-title"><i class="fa-solid fa-rocket"></i> RUN DEV Setup (FAKE)</div>
                <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div>
                <ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;">
                   <li><span style="color: var(--c-launch);">lite6_moveit_servo_fake.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--accent);">servo_node.cpp</span> <span style="float: right; opacity: 0.7;">(MoveIt Servo)</span></li>
                       <li><span style="color: var(--accent);">fake_components.cpp</span> <span style="float: right; opacity: 0.7;">(Mock Hardware)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-launch);">standalone_move_group.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--accent);">move_group</span> <span style="float: right; opacity: 0.7;">(MoveIt Planning Server)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-launch);">rviz_marker_static_scene_objects.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--accent);">rviz_marker_static_scene_objects.py</span> <span style="float: right; opacity: 0.7;">(Static Markers)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--accent);">robot_motion_handler_movegroup</span> <span style="float: right; opacity: 0.7;">(Motion Handler)</span></li>
                   <li><span style="color: var(--accent);">servo_status_overlay.py</span> <span style="float: right; opacity: 0.7;">(RViz Overlay)</span></li>
                   <li><span style="color: var(--c-launch);">zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py</span> <span style="float: right; opacity: 0.7;">(Vision Bringup)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--accent);">zed_wrapper.cpp</span> <span style="float: right; opacity: 0.7;">(ZED Camera)</span></li>
                       <li><span style="color: var(--accent);">static_transform_publisher</span> <span style="float: right; opacity: 0.7;">(TF)</span></li>
                       <li><span style="color: var(--accent);">zed_stand_publisher.py</span> <span style="float: right; opacity: 0.7;">(Stativ Marker)</span></li>
                       <li><span style="color: var(--accent);">pointcloud_optimizer.py</span> <span style="float: right; opacity: 0.7;">(PointCloud Filter)</span></li>
                       <li><span style="color: var(--accent);">yolo_moveit_collision.py</span> <span style="float: right; opacity: 0.7;">(YOLO Collision)</span></li>
                       <li><span style="color: var(--accent);">zed_yolo_3d_bbox.py</span> <span style="float: right; opacity: 0.7;">(YOLO BBox)</span></li>
                       <li><span style="color: var(--accent);">yolo_planned_grasp_executor.py</span> <span style="float: right; opacity: 0.7;">(Grasp Executor)</span></li>
                       <li><span style="color: var(--accent);">grasp_action_bridge.py</span> <span style="float: right; opacity: 0.7;">(Action Bridge)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-launch);">bringup.launch.py</span> <span style="float: right; opacity: 0.7;">(Whisper Bringup)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--accent);">audio_listener.py</span> <span style="float: right; opacity: 0.7;">(Mic Stream)</span></li>
                       <li><span style="color: var(--accent);">inference.cpp</span> <span style="float: right; opacity: 0.7;">(Whisper Engine)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--accent);">voice_command_listener.py</span> <span style="float: right; opacity: 0.7;">(Voice Controller)</span></li>
                   <li><span style="color: var(--c-launch);">rosbridge_websocket_launch.xml</span> <span style="float: right; opacity: 0.7;">(ROS Bridge)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--accent);">rosbridge_websocket.py</span> <span style="float: right; opacity: 0.7;">(WebSocket Server)</span></li>
                       <li><span style="color: var(--accent);">rosapi_node.py</span> <span style="float: right; opacity: 0.7;">(ROS API)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--accent);">tf_tuner</span> <span style="float: right; opacity: 0.7;">(TF Tuner)</span></li>
                   <li><span style="color: var(--accent);">robot_control_web_ui</span> <span style="float: right; opacity: 0.7;">(Web Server)</span></li>
                </ul>
              </div>
            </div>
            <div class="card-wrapper">
              <div class="action-card" data-type="dev" onclick="runDevSetup('real')" style="cursor: pointer;">
                <div class="action-btn" style="pointer-events: none;">
                  <div class="btn-top">
                    <span class="badge badge-dev"><i class="fa-solid fa-rocket"></i>DEV SEQUENCE</span>
                    <span class="label">RUN DEV Setup (REAL)</span>
                  </div>
                  <div class="cmd-wrap"><span class="cmd-text" style="color: var(--mut);">Verbindet mit dem physischen xArm Lite 6 (IP: 192.168.1.175)</span></div>
                </div>
                <div class="side-icon" style="width: 54px; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.1); border-left: 1px solid var(--brd); color: var(--c-dev); font-size: 20px; flex-shrink: 0; transition: all 0.2s;">
                  <i class="fa-solid fa-rocket"></i>
                </div>
              </div>
              <div class="card-tooltip">
                <div class="card-tooltip-title"><i class="fa-solid fa-rocket"></i> RUN DEV Setup (REAL)</div>
                <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div>
                <ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;">
                   <li><span style="color: var(--c-launch);">lite6_moveit_servo_realmove.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--accent);">servo_node.cpp</span> <span style="float: right; opacity: 0.7;">(MoveIt Servo)</span></li>
                       <li><span style="color: var(--accent);">ufactory_driver.cpp</span> <span style="float: right; opacity: 0.7;">(Real Hardware)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-launch);">standalone_move_group.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--accent);">move_group</span> <span style="float: right; opacity: 0.7;">(MoveIt Planning Server)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-launch);">rviz_marker_static_scene_objects.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--accent);">rviz_marker_static_scene_objects.py</span> <span style="float: right; opacity: 0.7;">(Static Markers)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--accent);">robot_motion_handler_movegroup</span> <span style="float: right; opacity: 0.7;">(Motion Handler)</span></li>
                   <li><span style="color: var(--accent);">servo_status_overlay.py</span> <span style="float: right; opacity: 0.7;">(RViz Overlay)</span></li>
                   <li><span style="color: var(--c-launch);">zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py</span> <span style="float: right; opacity: 0.7;">(Vision Bringup)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--accent);">zed_wrapper.cpp</span> <span style="float: right; opacity: 0.7;">(ZED Camera)</span></li>
                       <li><span style="color: var(--accent);">static_transform_publisher</span> <span style="float: right; opacity: 0.7;">(TF)</span></li>
                       <li><span style="color: var(--accent);">zed_stand_publisher.py</span> <span style="float: right; opacity: 0.7;">(Stativ Marker)</span></li>
                       <li><span style="color: var(--accent);">pointcloud_optimizer.py</span> <span style="float: right; opacity: 0.7;">(PointCloud Filter)</span></li>
                       <li><span style="color: var(--accent);">yolo_moveit_collision.py</span> <span style="float: right; opacity: 0.7;">(YOLO Collision)</span></li>
                       <li><span style="color: var(--accent);">zed_yolo_3d_bbox.py</span> <span style="float: right; opacity: 0.7;">(YOLO BBox)</span></li>
                       <li><span style="color: var(--accent);">yolo_planned_grasp_executor.py</span> <span style="float: right; opacity: 0.7;">(Grasp Executor)</span></li>
                       <li><span style="color: var(--accent);">grasp_action_bridge.py</span> <span style="float: right; opacity: 0.7;">(Action Bridge)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-launch);">bringup.launch.py</span> <span style="float: right; opacity: 0.7;">(Whisper Bringup)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--accent);">audio_listener.py</span> <span style="float: right; opacity: 0.7;">(Mic Stream)</span></li>
                       <li><span style="color: var(--accent);">inference.cpp</span> <span style="float: right; opacity: 0.7;">(Whisper Engine)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--accent);">voice_command_listener.py</span> <span style="float: right; opacity: 0.7;">(Voice Controller)</span></li>
                   <li><span style="color: var(--c-launch);">rosbridge_websocket_launch.xml</span> <span style="float: right; opacity: 0.7;">(ROS Bridge)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--accent);">rosbridge_websocket.py</span> <span style="float: right; opacity: 0.7;">(WebSocket Server)</span></li>
                       <li><span style="color: var(--accent);">rosapi_node.py</span> <span style="float: right; opacity: 0.7;">(ROS API)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--accent);">tf_tuner</span> <span style="float: right; opacity: 0.7;">(TF Tuner)</span></li>
                   <li><span style="color: var(--accent);">robot_control_web_ui</span> <span style="float: right; opacity: 0.7;">(Web Server)</span></li>
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
              <div class="action-card" data-type="server" onclick="runServerSetup('fake')" style="cursor: pointer;">
                <div class="action-btn" style="pointer-events: none;">
                  <div class="btn-top">
                    <span class="badge badge-server"><i class="fa-solid fa-server"></i>SERVER LAUNCH SEQUENCE</span>
                    <span class="label">RUN SERVER (FAKE)</span>
                  </div>
                  <div class="cmd-wrap"><span class="cmd-text" style="color: var(--mut);">Host-PC: MoveIt Fake, RViz2, Vision, AI</span></div>
                </div>
                <div class="side-icon" style="width: 54px; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.1); border-left: 1px solid var(--brd); color: var(--c-server); font-size: 20px; flex-shrink: 0; transition: all 0.2s;">
                  <i class="fa-solid fa-server"></i>
                </div>
              </div>
              <div class="card-tooltip">
                <div class="card-tooltip-title"><i class="fa-solid fa-server"></i> RUN SERVER (FAKE)</div>
                <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div>
                <ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;">
                   <li><span style="color: var(--c-launch);">lite6_moveit_servo_fake.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--accent);">servo_node.cpp</span> <span style="float: right; opacity: 0.7;">(MoveIt Servo)</span></li>
                       <li><span style="color: var(--accent);">fake_components.cpp</span> <span style="float: right; opacity: 0.7;">(Mock Hardware)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-launch);">standalone_move_group.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--accent);">move_group</span> <span style="float: right; opacity: 0.7;">(MoveIt Planning Server)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-launch);">rviz_marker_static_scene_objects.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--accent);">rviz_marker_static_scene_objects.py</span> <span style="float: right; opacity: 0.7;">(Static Markers)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--accent);">robot_motion_handler_movegroup</span> <span style="float: right; opacity: 0.7;">(Motion Handler)</span></li>
                   <li><span style="color: var(--accent);">servo_status_overlay.py</span> <span style="float: right; opacity: 0.7;">(RViz Overlay)</span></li>
                   <li><span style="color: var(--c-launch);">zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py</span> <span style="float: right; opacity: 0.7;">(Vision Bringup)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--accent);">zed_wrapper.cpp</span> <span style="float: right; opacity: 0.7;">(ZED Camera)</span></li>
                       <li><span style="color: var(--accent);">static_transform_publisher</span> <span style="float: right; opacity: 0.7;">(TF)</span></li>
                       <li><span style="color: var(--accent);">zed_stand_publisher.py</span> <span style="float: right; opacity: 0.7;">(Stativ Marker)</span></li>
                       <li><span style="color: var(--accent);">pointcloud_optimizer.py</span> <span style="float: right; opacity: 0.7;">(PointCloud Filter)</span></li>
                       <li><span style="color: var(--accent);">yolo_moveit_collision.py</span> <span style="float: right; opacity: 0.7;">(YOLO Collision)</span></li>
                       <li><span style="color: var(--accent);">zed_yolo_3d_bbox.py</span> <span style="float: right; opacity: 0.7;">(YOLO BBox)</span></li>
                       <li><span style="color: var(--accent);">yolo_planned_grasp_executor.py</span> <span style="float: right; opacity: 0.7;">(Grasp Executor)</span></li>
                       <li><span style="color: var(--accent);">grasp_action_bridge.py</span> <span style="float: right; opacity: 0.7;">(Action Bridge)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--accent);">tf_tuner</span> <span style="float: right; opacity: 0.7;">(TF Tuner)</span></li>
                </ul>
              </div>
            </div>
            
            <div class="card-wrapper">
              <div class="action-card" data-type="server" onclick="runServerSetup('real')" style="cursor: pointer;">
                <div class="action-btn" style="pointer-events: none;">
                  <div class="btn-top">
                    <span class="badge badge-server"><i class="fa-solid fa-server"></i>SERVER LAUNCH SEQUENCE</span>
                    <span class="label">RUN SERVER (REAL)</span>
                  </div>
                  <div class="cmd-wrap"><span class="cmd-text" style="color: var(--mut);">Host-PC: MoveIt Real, RViz2, Vision, AI (IP: 192.168.1.175)</span></div>
                </div>
                <div class="side-icon" style="width: 54px; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.1); border-left: 1px solid var(--brd); color: var(--c-server); font-size: 20px; flex-shrink: 0; transition: all 0.2s;">
                  <i class="fa-solid fa-server"></i>
                </div>
              </div>
              <div class="card-tooltip">
                <div class="card-tooltip-title"><i class="fa-solid fa-server"></i> RUN SERVER (REAL)</div>
                <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div>
                <ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;">
                   <li><span style="color: var(--c-launch);">lite6_moveit_servo_realmove.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--accent);">servo_node.cpp</span> <span style="float: right; opacity: 0.7;">(MoveIt Servo)</span></li>
                       <li><span style="color: var(--accent);">ufactory_driver.cpp</span> <span style="float: right; opacity: 0.7;">(Real Hardware)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-launch);">standalone_move_group.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--accent);">move_group</span> <span style="float: right; opacity: 0.7;">(MoveIt Planning Server)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--c-launch);">rviz_marker_static_scene_objects.launch.py</span> <span style="float: right; opacity: 0.7;">(Main)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--accent);">rviz_marker_static_scene_objects.py</span> <span style="float: right; opacity: 0.7;">(Static Markers)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--accent);">robot_motion_handler_movegroup</span> <span style="float: right; opacity: 0.7;">(Motion Handler)</span></li>
                   <li><span style="color: var(--accent);">servo_status_overlay.py</span> <span style="float: right; opacity: 0.7;">(RViz Overlay)</span></li>
                   <li><span style="color: var(--c-launch);">zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py</span> <span style="float: right; opacity: 0.7;">(Vision Bringup)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--accent);">zed_wrapper.cpp</span> <span style="float: right; opacity: 0.7;">(ZED Camera)</span></li>
                       <li><span style="color: var(--accent);">static_transform_publisher</span> <span style="float: right; opacity: 0.7;">(TF)</span></li>
                       <li><span style="color: var(--accent);">zed_stand_publisher.py</span> <span style="float: right; opacity: 0.7;">(Stativ Marker)</span></li>
                       <li><span style="color: var(--accent);">pointcloud_optimizer.py</span> <span style="float: right; opacity: 0.7;">(PointCloud Filter)</span></li>
                       <li><span style="color: var(--accent);">yolo_moveit_collision.py</span> <span style="float: right; opacity: 0.7;">(YOLO Collision)</span></li>
                       <li><span style="color: var(--accent);">zed_yolo_3d_bbox.py</span> <span style="float: right; opacity: 0.7;">(YOLO BBox)</span></li>
                       <li><span style="color: var(--accent);">yolo_planned_grasp_executor.py</span> <span style="float: right; opacity: 0.7;">(Grasp Executor)</span></li>
                       <li><span style="color: var(--accent);">grasp_action_bridge.py</span> <span style="float: right; opacity: 0.7;">(Action Bridge)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--accent);">tf_tuner</span> <span style="float: right; opacity: 0.7;">(TF Tuner)</span></li>
                </ul>
              </div>
            </div>
            
            <div class="card-wrapper">
              <div class="action-card" data-type="client" onclick="runClientSetup()" style="cursor: pointer;">
                <div class="action-btn" style="pointer-events: none;">
                  <div class="btn-top">
                    <span class="badge badge-client"><i class="fa-solid fa-desktop"></i>CLIENT LAUNCH SEQUENCE</span>
                    <span class="label">RUN CLIENT (Operator Station)</span>
                  </div>
                  <div class="cmd-wrap"><span class="cmd-text" style="color: var(--mut);">Client-PC: Gamepad, Kollisionswächter, RViz2 & ROS-Bridge</span></div>
                </div>
                <div class="side-icon" style="width: 54px; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.1); border-left: 1px solid var(--brd); color: var(--c-client); font-size: 20px; flex-shrink: 0; transition: all 0.2s;">
                  <i class="fa-solid fa-desktop"></i>
                </div>
              </div>
              <div class="card-tooltip">
                <div class="card-tooltip-title"><i class="fa-solid fa-desktop"></i> RUN CLIENT (Operator Station)</div>
                <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div>
                <ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;">
                   <li><span style="color: var(--accent);">joy_node.cpp</span> <span style="float: right; opacity: 0.7;">(Gamepad Driver)</span></li>
                   <li><span style="color: var(--accent);">checker.py</span> <span style="float: right; opacity: 0.7;">(Collision Checker)</span></li>
                   <li><span style="color: var(--c-launch);">rosbridge_websocket_launch.xml</span> <span style="float: right; opacity: 0.7;">(ROS Bridge)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--accent);">rosbridge_websocket.py</span> <span style="float: right; opacity: 0.7;">(WebSocket Server)</span></li>
                       <li><span style="color: var(--accent);">rosapi_node.py</span> <span style="float: right; opacity: 0.7;">(ROS API)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--accent);">servo.rviz</span> <span style="float: right; opacity: 0.7;">(RViz2 Operator View)</span></li>
                   <li><span style="color: var(--c-launch);">bringup.launch.py</span> <span style="float: right; opacity: 0.7;">(Whisper Bringup CPU)</span>
                     <ul style="padding-left: 16px; margin: 2px 0 4px 0;">
                       <li><span style="color: var(--accent);">audio_listener.py</span> <span style="float: right; opacity: 0.7;">(Mic Stream)</span></li>
                       <li><span style="color: var(--accent);">inference.cpp</span> <span style="float: right; opacity: 0.7;">(Whisper Engine CPU)</span></li>
                     </ul>
                   </li>
                   <li><span style="color: var(--accent);">voice_command_listener.py</span> <span style="float: right; opacity: 0.7;">(Voice Controller)</span></li>
                   <li><span style="color: var(--accent);">robot_control_web_ui</span> <span style="float: right; opacity: 0.7;">(Web Server)</span></li>
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
             tooltipHtml = `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--accent);">${pkg}</span></div>
                            <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--accent);">${launchFile}</span></div>
                            ${args ? `<div style="font-size: 11px; color: var(--mut); margin-top: 4px;"><b>Arguments:</b> <span style="color: var(--accent);">${args}</span></div>` : ''}`;
          } else if (a.cmd.startsWith('ros2 run')) {
             const parts = a.cmd.split(' ');
             const pkg = parts[2] || '';
             let node = parts[3] || '';
             if (!node.includes('.')) node += ' (Source: .py / .cpp)';
             const args = parts.slice(4).join(' ');
             tooltipHtml = `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Package:</b> <span style="color: var(--accent);">${pkg}</span></div>
                            <div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Executable:</b> <span style="color: var(--accent);">${node}</span></div>
                            ${args ? `<div style="font-size: 11px; color: var(--mut); margin-top: 4px;"><b>Arguments:</b> <span style="color: var(--accent);">${args}</span></div>` : ''}`;
          } else {
             tooltipHtml = `<div class="card-tooltip-cmd">${a.cmd}</div>`;
          }
          
          html += `
        <div class="card-wrapper">
          <div class="action-card" data-type="${a.type}" data-action-index="${aIndex}">
            <div class="action-btn" data-cmd="${safeCmd}" data-label="${safeLbl}" data-mode="${mode}">
              <div class="btn-top">
                <span class="badge ${b.cls}"><i class="${b.icon}"></i>${b.label}</span>
                <span class="label">${a.label}</span>
              </div>
              <div class="cmd-wrap"><span class="cmd-text">${a.cmd}</span></div>
            </div>
            <button class="copy-btn" data-cmd="${safeCmd}" title="Befehl kopieren"><i class="fa-regular fa-copy"></i></button>
          </div>
          <div class="card-tooltip">
            <div class="card-tooltip-title"><i class="${b.icon}"></i> ${a.label}</div>
            ${tooltipHtml}
          </div>
        </div>`;
        });
        html += `</div></div>`;

        colHtml[sec.col] += html;
      });

      document.getElementById('main-content').innerHTML = colHtml[0] + '</div>' + colHtml[1] + '</div>' + colHtml[2] + '</div>';

      document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', () => runCmd(btn.dataset.cmd, btn.dataset.label, btn.dataset.mode));
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
    async function runCmd(command, title, mode = 'ros') {
      try {
        const res = await fetch('/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command, title, mode }) });
        const data = await res.json();
        if (data.ok) showToast(`✓ ${title} gestartet`);
        else showToast(`✗ Fehler: ${data.error}`, true);
      } catch (err) { showToast('✗ Nexus Web Backend nicht erreichbar', true); }
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

    async function killAllProcesses() {
      if (!confirm("Wirklich ALLE Nexus Web Backend-Prozesse beenden? (Das Dashboard muss danach per Terminal neu gestartet werden)")) return;
      try {
        await fetch('/api/kill_all', { method: 'POST' });
        document.getElementById('offline-overlay').style.display = 'flex';
      } catch (err) {
        document.getElementById('offline-overlay').style.display = 'flex';
      }
    }

    async function killAllROS2() {
      if (!confirm("Wirklich ALLE ROS2 Prozesse UND die dazugehörigen Terminals beenden?")) return;
      try {
        await fetch('/api/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            command: "pkill -f 'ros2 run'; pkill -f 'ros2 launch'; pkill -f rviz2; pkill -f 'eval.*exec bash'", 
            title: "Kill All ROS2", 
            mode: "bg" 
          })
        });
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

