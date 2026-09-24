    // ─── PARAMETER-KLASSIFIKATION ─────────────────────────────────────────────
    // Die Chips in den Action Cards sehen bisher alle gleich aus, obwohl drei
    // verschiedene ROS-2-Dinge dahinterstecken. /api/launch_args liefert die
    // tatsaechlich deklarierten Launch-Argumente je Paket/Datei, damit ein
    // Parameter, der ins Leere laeuft, auch als solcher erkennbar wird.
    window.NEXUS_LAUNCH_ARGS = null;

    fetch('/api/launch_args')
      .then(r => r.json())
      .then(d => { if (d && d.ok) window.NEXUS_LAUNCH_ARGS = d.launch_files || {}; })
      .catch(() => { /* ohne Backend bleiben die Chips neutral */ });

    // "ros2 launch <paket> <datei>.launch.py" -> "paket/datei.launch.py"
    function launchKeyOf(cmd) {
      if (!cmd) return null;
      const m = cmd.match(/ros2\s+launch\s+(\S+)\s+(\S+\.launch\.py)/);
      return m ? `${m[1]}/${m[2]}` : null;
    }

    // Liefert { cls, title } fuer einen Argument-Chip.
    function classifyArg(text, launchKey) {
      const t = String(text || '').trim();

      if (/(^|\s)-r(\s|$)/.test(t) || t.includes('__node:=') || /^__[a-z]+:=/.test(t)) {
        return { cls: 'chip-kind-remap', title: 'ROS-2-Remapping (--ros-args -r) - benennt Node/Topic um' };
      }
      if (/(^|\s)-p(\s|$)/.test(t)) {
        return { cls: 'chip-kind-param', title: 'ROS-2-Node-Parameter (--ros-args -p) - wird an den Node gesetzt' };
      }

      const m = t.match(/^([A-Za-z_][A-Za-z0-9_]*):=/);
      if (!m) return { cls: '', title: '' };
      const name = m[1];

      if (!launchKey) {
        // Kein "ros2 launch" - z.B. "ros2 run" oder ein Shell-Kommando.
        return { cls: '', title: 'Argument (kein ros2-launch-Kommando - nicht pruefbar)' };
      }
      const map = window.NEXUS_LAUNCH_ARGS;
      if (!map) return { cls: '', title: '' };   // noch nicht geladen

      const declared = map[launchKey];
      if (!declared) {
        return { cls: 'chip-kind-unknown', title: `Launch-Datei "${launchKey}" nicht gefunden - Paket oder Datei existiert nicht` };
      }
      if (declared.indexOf(name) !== -1) {
        return { cls: 'chip-kind-launch', title: `Echtes Launch-Argument von ${launchKey}` };
      }
      return { cls: 'chip-kind-dead', title: `"${name}" wird von ${launchKey} nicht deklariert - dieser Parameter bleibt wirkungslos` };
    }

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




    // ── Whisper CPU/GPU-Umschalter (Voice Command Listener) ─────────────────
    const WHISPER_GPU_ARG = 'use_gpu:=true';
    let whisperToggleSeq = 0;

    function isWhisperLaunch(baseCmd) {
        return /voice_listener\.launch\.py|whisper_bringup\s+bringup\.launch\.py/.test(baseCmd || '');
    }

    function buildWhisperDeviceToggle(argObj, onChange) {
        const wrap = document.createElement('div');
        wrap.className = 'param-device-toggle';
        wrap.title = 'Whisper-Inferenz auf CPU oder GPU (CUDA) - startet mit use_gpu:=false bzw. use_gpu:=true';
        const name = 'whisper-device-' + (++whisperToggleSeq);

        const label = document.createElement('span');
        label.className = 'param-device-label';
        label.textContent = 'Whisper';
        wrap.appendChild(label);

        [['cpu', 'CPU', 'fa-microchip'], ['gpu', 'GPU', 'fa-bolt']].forEach(([value, text, icon]) => {
            const opt = document.createElement('label');
            opt.className = 'param-device-opt';
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = name;
            input.value = value;
            input.checked = (value === 'gpu') === !!argObj.checked;
            input.onclick = (e) => e.stopPropagation();
            input.onchange = () => {
                if (!input.checked) return;
                argObj.checked = (value === 'gpu');
                if (typeof onChange === 'function') onChange();
            };
            const span = document.createElement('span');
            span.innerHTML = `<i class="fa-solid ${icon}"></i> ${text}`;
            opt.appendChild(input);
            opt.appendChild(span);
            opt.onclick = (e) => e.stopPropagation();
            wrap.appendChild(opt);
        });
        return wrap;
    }

    function getSavedArgState(popupId, cmd, baseCmd, argText, fallback) {
        const keysToCheck = [cmd, baseCmd].filter(Boolean);
        const popupKeys = [popupId];
        if (popupId && popupId.startsWith('sec_')) {
            const m = popupId.match(/sec_[^_]+_(\d+)/);
            if (m) popupKeys.push(`sec_${m[1]}`);
        }
        
        // 1. Check localStorage first (user's latest browser interactions)
        try {
            const localPopups = JSON.parse(localStorage.getItem('ros2_nexus_popups_args') || '{}');
            for (const pKey of popupKeys) {
                if (pKey && localPopups[pKey]) {
                    for (const k of keysToCheck) {
                        if (localPopups[pKey][k] && localPopups[pKey][k][argText] !== undefined) {
                            return localPopups[pKey][k][argText];
                        }
                    }
                }
            }
            const localCmds = JSON.parse(localStorage.getItem('ros2_nexus_cmd_args') || '{}');
            for (const k of keysToCheck) {
                if (localCmds[k] && localCmds[k][argText] !== undefined) {
                    return localCmds[k][argText];
                }
            }
        } catch (e) {}

        // 2. Check window.TABS popup-specific args
        if (window.TABS && window.TABS['__popups_args']) {
            for (const pKey of popupKeys) {
                if (pKey && window.TABS['__popups_args'][pKey]) {
                    const popupArgs = window.TABS['__popups_args'][pKey];
                    for (const k of keysToCheck) {
                        if (popupArgs[k] && popupArgs[k][argText] !== undefined) {
                            return popupArgs[k][argText];
                        }
                    }
                }
            }
        }
        
        // 3. Check global __cmd_args in window.TABS
        if (window.TABS && window.TABS['__cmd_args']) {
            for (const k of keysToCheck) {
                if (window.TABS['__cmd_args'][k] && window.TABS['__cmd_args'][k][argText] !== undefined) {
                    return window.TABS['__cmd_args'][k][argText];
                }
            }
        }

        // Default:
        if (fallback !== undefined) return fallback;
        if (argText.startsWith('yolo_model:=')) {
            return argText === 'yolo_model:=yolov8l.pt';
        }
        if (argText === 'static_objects:=true' || argText === 'static_onjects:=true') {
            return true;
        }
        if (argText === 'add_gripper:=true') {
            return false;
        }
        if (argText === 'add_vacuum_gripper:=true') {
            return true;
        }
        if (argText.startsWith('report_type:=')) {
            return argText === 'report_type:=dev';
        }
        if (argText.startsWith('robot_ip:=')) {
            return true;
        }
        return true;
    }

    function openLaunchModalFromCard(card) {
       const btn = card.querySelector('.action-btn');
       if (!btn) return;
       const wrapper = card.closest('.card-wrapper');
       if (!wrapper) return;
       const popupKey = btn.dataset.label ? 'card_' + btn.dataset.label.replace(/\s+/g, '_') : 'card_single';
       openLaunchModal(wrapper, [{cmd: btn.dataset.cmd, title: btn.dataset.label}], `🚀 ${btn.dataset.label} gestartet...`, popupKey);
    }

    function alignModalArgs(container) {
        if (!container) return;
        const layouts = container.querySelectorAll('.modal-card-layout');
        layouts.forEach(cardLayout => {
            const leftCol = cardLayout.querySelector('.modal-card-left-col');
            const middleCol = cardLayout.querySelector('.modal-card-middle-col');
            if (!leftCol || !middleCol) return;

            // Find element for zed_camera.launch.py in leftCol
            const zedLaunchEl = Array.from(leftCol.querySelectorAll('li, span, div')).find(el => 
                el.textContent && el.textContent.includes('zed_camera.launch.py') && (el.tagName === 'LI' || el.classList.contains('badge-launch'))
            );

            // Find use_zed_hardware label in middleCol
            const zedHwLabel = Array.from(middleCol.querySelectorAll('label')).find(lbl => 
                lbl.textContent && lbl.textContent.includes('use_zed_hardware')
            );

            if (zedLaunchEl && zedHwLabel) {
                const targetLine = zedLaunchEl.tagName === 'LI' ? (zedLaunchEl.querySelector('.badge-launch') || zedLaunchEl) : zedLaunchEl;
                
                const middleColRect = middleCol.getBoundingClientRect();
                const targetRect = targetLine.getBoundingClientRect();
                const labelRect = zedHwLabel.getBoundingClientRect();

                if (middleColRect.height > 0 && targetRect.height > 0) {
                    const modalWindow = document.getElementById('launch-modal-window');
                    const zoom = (modalWindow ? (parseFloat(getComputedStyle(modalWindow).zoom) || 1) : 1);
                    const targetCenterY = ((targetRect.top + targetRect.height / 2) - middleColRect.top) / zoom;
                    const labelHeight = (labelRect.height / zoom) || 32;
                    const desiredTop = targetCenterY - (labelHeight / 2);

                    zedHwLabel.style.position = 'absolute';
                    zedHwLabel.style.top = desiredTop + 'px';
                    zedHwLabel.style.left = '20px';
                    zedHwLabel.style.margin = '0';
                    middleCol.style.position = 'relative';
                }
            }
        });
     }

    let globalCmdTooltipEl = null;

    function getGlobalCmdTooltip() {
        if (!globalCmdTooltipEl) {
            globalCmdTooltipEl = document.createElement('div');
            globalCmdTooltipEl.id = 'global-cmd-tooltip';
            globalCmdTooltipEl.className = 'global-cmd-floating-tooltip';
            document.body.appendChild(globalCmdTooltipEl);
        }
        return globalCmdTooltipEl;
    }

    function showGlobalCmdTooltip(targetEl, cmdText) {
        if (!cmdText) return;
        const tip = getGlobalCmdTooltip();
        const safeCmd = String(cmdText)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        tip.innerHTML = `
            <div class="cmd-tip-header">
                <span><i class="fa-solid fa-terminal" style="color:#38bdf8; margin-right:5px;"></i>Befehl</span>
                <span class="cmd-tip-hint"><i class="fa-regular fa-copy"></i> Klick zum Kopieren</span>
            </div>
            <div class="cmd-tip-code">${safeCmd}</div>
        `;

        tip.style.left = '-9999px';
        tip.style.top = '-9999px';
        tip.style.display = 'block';
        tip.classList.add('visible');

        const rect = targetEl.getBoundingClientRect();
        const tipRect = tip.getBoundingClientRect();

        let left = rect.left + (rect.width / 2) - (tipRect.width / 2);
        left = Math.max(12, Math.min(left, window.innerWidth - tipRect.width - 12));

        let top = rect.bottom + 8;
        if (top + tipRect.height > window.innerHeight - 12) {
            top = Math.max(12, rect.top - tipRect.height - 8);
        }

        tip.style.left = Math.round(left) + 'px';
        tip.style.top = Math.round(top) + 'px';
    }

    function hideGlobalCmdTooltip() {
        if (globalCmdTooltipEl) {
            globalCmdTooltipEl.classList.remove('visible');
        }
    }

    function createCmdBadge(cmdText) {
        const btn = document.createElement('div');
        btn.className = 'modal-cmd-btn';
        btn.style.cssText = 'padding: 2px 6px; font-size: 9.5px;';
        btn.innerHTML = `<i class="fa-solid fa-terminal" style="font-size:9px; color:#38bdf8;"></i> CMD`;

        btn.onmouseenter = () => showGlobalCmdTooltip(btn, cmdText);
        btn.onmouseleave = () => hideGlobalCmdTooltip();

        btn.onclick = (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(cmdText).then(() => {
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.className = 'fa-solid fa-check';
                    icon.style.color = '#10b981';
                }
                showToast('✓ Befehl in Zwischenablage kopiert');
                setTimeout(() => {
                    if (icon) {
                        icon.className = 'fa-solid fa-terminal';
                        icon.style.color = '#38bdf8';
                    }
                }, 1500);
            });
        };
        return btn;
    }

    function getActionIconMeta(action, fallbackCmd) {
        const rawCmd = (action && (action.baseCmd || action.cmd)) ? (action.baseCmd || action.cmd) : (fallbackCmd || '');
        const firstCmd = rawCmd.split(/(?:&&|&|;)/)[0].trim().toLowerCase();
        const title = ((action && (action.title || action.label)) || '').toLowerCase();
        const type = ((action && action.type) || '').toLowerCase();
        const combined = (firstCmd + ' ' + title + ' ' + type + ' ' + rawCmd.toLowerCase());

        // 0. Ausdrücklich KEINE Icons für Helper/Tuner/Overlay/Streamer-Nodes (web_video_server ausgenommen!)
        if (!/web_video_server/.test(combined) && (/fake_linear_axis|yolo_3d_bbox_for_ip_cam|rviz_marker_3d_scene_objects|servo_status_overlay|rviz_servo_status|rviz_overlay_servo_status|rviz_window_streamer/.test(firstCmd) ||
            /linear axis tuner|yolo 3d bbox|rviz marker|servo status warning|rviz streamer/.test(title))) {
            if (!/lite6_moveit|xarm_moveit|standalone_move_group|zed_cam|robot_vision/.test(firstCmd)) {
                return [];
            }
        }

        // VR Action Card: BEIDE VR-Icons daneben (Headset & Controller)!
        if (/vr_quest|quest3|vr_controller|quest teleop|vr teleop/.test(combined)) {
            return [
                { path: '_imgs/icons/icon_vr_headsetVR.svg?v=6', label: 'Meta Quest 3 VR Headset' },
                { path: '_imgs/icons/icon_vr_controller.svg?v=6', label: 'VR Controller Teleoperation' }
            ];
        }

        // Web Video Server / Stream Server
        if (/web_video_server/.test(combined)) {
            return [{ path: '_imgs/icons/icon_websocket.svg?v=6', label: 'ROS WebSocket Video Server' }];
        }

        // ZED-M Stereo-Kamera mit integrierter YOLO 3D Objekterkennung:
        // z.B. robot_vision_cameras_bringup oder zed_cam_eef_rviz_octomap_yolo
        if ((firstCmd.includes('zed') || firstCmd.includes('robot_vision') || /robot_vision|zed_camera|zed_wrapper|zed m camera/.test(combined)) && (/yolo/.test(combined) || /camera/.test(combined))) {
            return [
                { path: '_imgs/icons/icon_zed_m.svg?v=6', label: 'ZED-M Stereo-Kamera' },
                { path: '_imgs/icons/icon_object_detection.svg?v=7', label: 'YOLO 3D Object Detection' }
            ];
        }

        // ZED-M Stereo-Kamera Launcher (ohne YOLO)
        if (/zed_camera|zed_wrapper|zed m camera/.test(combined) || (firstCmd.includes('zed') && !firstCmd.includes('gaze'))) {
            return [{ path: '_imgs/icons/icon_zed_m.svg?v=6', label: 'ZED-M Stereo-Kamera' }];
        }

        // xArm Lite 6 Launch mit MoveIt, RViz & Gamepad Controller (lite6_moveit_servo_fake / lite6_moveit_servo_realmove):
        // Zeigt das passende xArm Lite 6 Icon (Simulation für Fake, Real für Realmove) + MoveIt + RViz + Gamepad Controller
        if (/lite6_moveit_servo|servo_fake|servo_real/.test(firstCmd) || 
            (firstCmd.startsWith('ros2 launch') && /lite6/.test(combined) && /moveit|servo/.test(combined))) {
            const isSim = /fake|sim|mock/.test(combined);
            return [
                { 
                    path: isSim ? '_imgs/icons/icon_robot_lite6_sim.svg?v=6' : '_imgs/icons/icon_robot_lite6_real.svg?v=6', 
                    label: isSim ? 'xArm Lite 6 (Simulation)' : 'xArm Lite 6 (Physischer Roboter)' 
                },
                { path: '_imgs/icons/icon_moveit2.svg?v=2', label: 'MoveIt Motion Planning' },
                { path: '_imgs/icons/icon_rviz.svg', label: 'RViz 3D-Visualisierung' },
                { path: '_imgs/icons/icon_gamepad.svg?v=6', label: 'Gamepad Roboter-Steuerung' }
            ];
        }

        // xArm Lite 6 Roboter (eigenständig)
        if (/lite6|xarm.*lite/.test(combined)) {
            const isSim = /fake|sim|mock/.test(combined);
            return [{
                path: isSim ? '_imgs/icons/icon_robot_lite6_sim.svg?v=6' : '_imgs/icons/icon_robot_lite6_real.svg?v=6',
                label: isSim ? 'xArm Lite 6 (Simulation)' : 'xArm Lite 6 (Physischer Roboter)'
            }];
        }

        // 1. RViz / RViz2 3D-Visualisierung (eigenes weißes SVG Icon mit 3D Frame & rviz2 Schriftzug)
        if (/\brviz\b|\brviz2\b/.test(firstCmd) || /\brviz\b|\brviz2\b/.test(title)) {
            return [{ path: '_imgs/icons/icon_rviz.svg', label: 'RViz 3D-Visualisierung' }];
        }
        // 2. MoveIt / Motion Planning (eigenes weißes SVG Icon mit Roboterarm & moveit2 Schriftzug)
        if (/moveit|move_group|movegroup|moveit_servo|lite6_moveit|xarm_moveit/.test(combined)) {
            if (/yolo/.test(combined)) {
                return [
                    { path: '_imgs/icons/icon_moveit2.svg?v=2', label: 'MoveIt Motion Planning' },
                    { path: '_imgs/icons/icon_object_detection.svg?v=7', label: 'YOLO 3D Object Detection' }
                ];
            }
            return [{ path: '_imgs/icons/icon_moveit2.svg?v=2', label: 'MoveIt Motion Planning' }];
        }
        // 3. Voice / Whisper / Speech Audio
        if (/voice|whisper|speech|audio|listener|silero/.test(combined)) {
            return [{ path: '_imgs/icons/icon_voice.svg?v=6', label: 'Sprachsteuerung & Audio' }];
        }
        // 4. Gaze / Tobii Eye Tracking (mit oder ohne YOLO)
        if (/gaze|tobii|glasses/.test(combined)) {
            if (/yolo/.test(combined)) {
                return [
                    { path: '_imgs/icons/icon_gaze.svg?v=6', label: 'Blickerfassung (Tobii Gaze)' },
                    { path: '_imgs/icons/icon_object_detection.svg?v=7', label: 'YOLO 3D Object Detection' }
                ];
            }
            return [{ path: '_imgs/icons/icon_gaze.svg?v=6', label: 'Blickerfassung (Tobii Gaze)' }];
        }
        // YOLO 3D Objekterkennung (eigenes weißes SVG Icon mit 3D Bounding Box & Sucher-Ecken)
        if (/yolo|object_detection|detection_3d|bbox_3d/.test(combined)) {
            return [{ path: '_imgs/icons/icon_object_detection.svg?v=7', label: 'YOLO 3D Object Detection' }];
        }
        // 5. VR Headset / Isaac Sim / 3D Simulation
        if (/isaac|sim_lite6|headset|vr_exo|vr_ego|vr_seq/.test(combined)) {
            return [{ path: '_imgs/icons/icon_vr_headsetVR.svg?v=6', label: 'VR Headset / Simulation' }];
        }
        // 6. Client / Operator Station
        if (/client|operator_station|operator/.test(combined)) {
            return [{ path: '_imgs/icons/icon_client.svg', label: 'Client / Operator Station' }];
        }
        // 7. Gamepad / Joystick / Keyboard / Collision Checker
        if (/gamepad|joy|keyboard|linear_axis|collision_check|teleop_pre_collision/.test(combined)) {
            return [{ path: '_imgs/icons/icon_gamepad.svg?v=6', label: 'Gamepad & Roboter-Steuerung' }];
        }
        // Robot Control UI + WebSocket Server (kombinierte Action Card mit BEIDEN Icons)
        if (/http_robot_control_ui/.test(combined) || ((/robot_control|8081/.test(combined)) && (/websocket|rosbridge|9090/.test(combined)))) {
            return [
                { path: '_imgs/icons/icon_robot_control_ui.svg?v=6', label: 'Robot Control UI' },
                { path: '_imgs/icons/icon_websocket.svg?v=6', label: 'ROS WebSocket' }
            ];
        }
        // 8. Web-UI / Dashboard / Overlays / Streams / OBS
        if (/robot_control|dashboard|rqt|overlay|streamer|obs|8080|8081|ui_node/.test(combined)) {
            return [{ path: '_imgs/icons/icon_robot_control_ui.svg?v=6', label: 'Web-UI & Visualisierung' }];
        }
        // 9. ROS WebSocket / ROS Bridge / Backend
        if (/rosbridge|websocket|analyzer|vision|pointcloud|aruco|server|kill|pkill/.test(combined)) {
            return [{ path: '_imgs/icons/icon_websocket.svg?v=6', label: 'ROS WebSocket' }];
        }

        if (firstCmd.startsWith('ros2 launch')) {
            return [{ path: '_imgs/icons/icon_websocket.svg?v=6', label: 'ROS WebSocket Launch' }];
        }
        return [{ path: '_imgs/icons/icon_robot_control_ui.svg?v=6', label: 'Komponente' }];
    }

    function openLaunchModal(wrapper, actionsData, toastMsg, popupId) {
       const tooltip = wrapper.querySelector('.card-tooltip');
       if (!tooltip) return;
       const titleEl = tooltip.querySelector('.card-tooltip-title');
       const titleHTML = titleEl ? titleEl.innerHTML : 'Launch Command';
       
       const contentClone = tooltip.cloneNode(true);
       contentClone.className = '';
       contentClone.style.cssText = 'width: 100%; display: flex; flex-direction: column; gap: 15px; padding: 10px;';
       
       const cloneTitle = contentClone.querySelector('.card-tooltip-title');
       if (cloneTitle) cloneTitle.remove();
       
       const effPopupId = popupId || (actionsData && actionsData[0] && actionsData[0].cmd ? 'cmd_' + actionsData[0].cmd.split(' ')[0] : 'general');
       
       const popupCandidateKeys = [effPopupId];
       if (effPopupId && effPopupId.startsWith('sec_')) {
           const m = effPopupId.match(/sec_[^_]+_(\d+)/);
           if (m) popupCandidateKeys.push(`sec_${m[1]}`);
       }

       let activeSet = null;
       // 1. Try localStorage first (user's latest browser interactions)
       try {
           const localActive = JSON.parse(localStorage.getItem('ros2_nexus_popups_active') || '{}');
           for (const pKey of popupCandidateKeys) {
               if (pKey && Array.isArray(localActive[pKey])) {
                   activeSet = new Set(localActive[pKey]);
                   break;
               }
           }
       } catch(e) {}

       // 2. Try window.TABS
       if (!activeSet && window.TABS && window.TABS['__popups_active']) {
           for (const pKey of popupCandidateKeys) {
               if (pKey && Array.isArray(window.TABS['__popups_active'][pKey])) {
                   activeSet = new Set(window.TABS['__popups_active'][pKey]);
                   break;
               }
           }
       }
       
       // ROS_LOCALHOST_ONLY je Popup (Checkbox im Header, persistiert in __popups_env)
       let localhostOnly = false;
       const popupsEnv = (window.TABS && window.TABS['__popups_env']) || {};
       for (const pKey of popupCandidateKeys) {
           if (pKey && popupsEnv[pKey] && popupsEnv[pKey].localhost_only !== undefined) {
               localhostOnly = !!popupsEnv[pKey].localhost_only;
               break;
           }
       }

       actionsData.forEach(a => { 
           a.baseCmd = a.cmd; 
           a.args = []; 
           if (activeSet) {
               a.active = activeSet.has(a.cmd) || (a.baseCmd && activeSet.has(a.baseCmd)) || (a.title && activeSet.has(a.title)); 
           } else {
               a.active = (a.active !== undefined) ? a.active : true; 
           }
       });
       
       // ── Action Card Collapse (Ein-/Ausklappen pro Card, je Popup persistiert) ──
       const COLLAPSE_LS_KEY = 'ros2_nexus_cards_collapsed';

       const readCollapsedStore = () => {
           try { return JSON.parse(localStorage.getItem(COLLAPSE_LS_KEY) || '{}'); } catch (e) { return {}; }
       };

       const isCardCollapsed = (cardKey) => {
           if (!cardKey) return false;
           const store = readCollapsedStore();
           for (const pKey of popupCandidateKeys) {
               if (pKey && store[pKey] && store[pKey][cardKey] !== undefined) return !!store[pKey][cardKey];
           }
           return false;
       };

       const saveCardCollapsed = (cardKey, collapsed) => {
           if (!cardKey) return;
           const store = readCollapsedStore();
           popupCandidateKeys.forEach(pKey => {
               if (!pKey) return;
               if (!store[pKey]) store[pKey] = {};
               store[pKey][cardKey] = collapsed;
           });
           try { localStorage.setItem(COLLAPSE_LS_KEY, JSON.stringify(store)); } catch (e) {}
       };

       // Haengt den kleinen Chevron-Button oben rechts in die Card.
       // headerHost bleibt immer sichtbar, alles in bodyEls klappt weg.
       // Die Hoehe wird per JS gesetzt: im offenen Zustand steht max-height wieder
       // auf '' (natuerliche Hoehe) und overflow auf visible, damit die
       // Tree-Connector-Linien der Launch-Baeume nicht abgeschnitten werden.
       const attachCardCollapse = (cardDiv, headerHost, cardKey, bodyEls) => {
           if (!cardDiv || !headerHost) return;
           const bodies = (bodyEls || []).filter(Boolean);
           bodies.forEach(el => el.classList.add('card-collapsible-body'));

           const btn = document.createElement('button');
           btn.type = 'button';
           btn.className = 'modal-card-collapse-btn';
           btn.innerHTML = '<i class="fa-solid fa-chevron-up"></i>';

           const setBodyHeights = (collapsed, animate) => {
               bodies.forEach(el => {
                   if (!animate) {
                       el.classList.remove('is-animating');
                       el.style.maxHeight = collapsed ? '0px' : '';
                       return;
                   }

                   // overflow:hidden zuerst setzen, damit scrollHeight zuverlaessig
                   // die volle Inhaltshoehe liefert
                   el.classList.add('is-animating');
                   const full = el.scrollHeight;

                   const done = (ev) => {
                       if (ev.propertyName !== 'max-height') return;
                       el.removeEventListener('transitionend', done);
                       el.classList.remove('is-animating');
                       // Offen: natuerliche Hoehe zurueckgeben, sonst wuerde
                       // hoher Inhalt spaeter am fixen Wert haengen bleiben.
                       if (!cardDiv.classList.contains('card-collapsed')) el.style.maxHeight = '';
                   };
                   el.addEventListener('transitionend', done);

                   el.style.maxHeight = (collapsed ? full : 0) + 'px';
                   void el.offsetHeight; // Reflow erzwingen, damit die Transition startet
                   el.style.maxHeight = (collapsed ? 0 : full) + 'px';
               });
           };

           const apply = (collapsed, animate) => {
               cardDiv.classList.toggle('card-collapsed', collapsed);
               const ic = btn.querySelector('i');
               if (ic) ic.className = collapsed ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up';
               btn.title = collapsed ? 'Action Card ausklappen' : 'Action Card einklappen';
               btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
               setBodyHeights(collapsed, animate);
           };

           apply(isCardCollapsed(cardKey), false);

           btn.onclick = (e) => {
               e.stopPropagation();
               e.preventDefault();
               const collapsed = !cardDiv.classList.contains('card-collapsed');
               apply(collapsed, true);
               saveCardCollapsed(cardKey, collapsed);
           };

           headerHost.appendChild(btn);
       };

       const saveActiveState = () => {
           const modalBody = document.getElementById('launch-modal-body');
           const container = modalBody || contentClone;

           // Sync action.active from DOM checkboxes if available
           if (container) {
               container.querySelectorAll('li, .modal-card-row, .modal-action-card').forEach(row => {
                   const cb = row.querySelector('.main-action-cb');
                   const cmd = row.dataset.cmd;
                   if (cb && cmd) {
                       const matchedAction = actionsData.find(a => a.cmd === cmd || a.baseCmd === cmd);
                       if (matchedAction) {
                           matchedAction.active = cb.checked;
                       }
                   }
               });
           }

           const activeCmds = [];
           actionsData.forEach(a => {
               if (a.active) {
                   if (a.cmd && !activeCmds.includes(a.cmd)) activeCmds.push(a.cmd);
                   if (a.baseCmd && a.baseCmd !== a.cmd && !activeCmds.includes(a.baseCmd)) {
                       activeCmds.push(a.baseCmd);
                   }
               }
           });

           // Gather args state
           const currentArgsState = {};
           actionsData.forEach(a => {
               if (a.args && a.args.length > 0) {
                   const cmdKey = a.cmd || a.baseCmd;
                   if (!currentArgsState[cmdKey]) currentArgsState[cmdKey] = {};
                   a.args.forEach(argObj => {
                       currentArgsState[cmdKey][argObj.text] = !!argObj.checked;
                   });
                   if (a.baseCmd && a.baseCmd !== a.cmd) {
                       if (!currentArgsState[a.baseCmd]) currentArgsState[a.baseCmd] = {};
                       a.args.forEach(argObj => {
                           currentArgsState[a.baseCmd][argObj.text] = !!argObj.checked;
                       });
                   }
               }
           });

           if (!window.TABS) window.TABS = {};
           if (!window.TABS['__popups_active']) window.TABS['__popups_active'] = {};
           if (!window.TABS['__popups_args']) window.TABS['__popups_args'] = {};
           if (!window.TABS['__cmd_args']) window.TABS['__cmd_args'] = {};
           if (!window.TABS['__popups_env']) window.TABS['__popups_env'] = {};

           const localhostCb = document.getElementById('modal-localhost-cb');
           if (localhostCb) localhostOnly = localhostCb.checked;
           popupCandidateKeys.forEach(pKey => {
               if (pKey) window.TABS['__popups_env'][pKey] = Object.assign(window.TABS['__popups_env'][pKey] || {}, { localhost_only: localhostOnly });
           });

           window.TABS['__popups_active'][effPopupId] = activeCmds;
           window.TABS['__popups_args'][effPopupId] = Object.assign(window.TABS['__popups_args'][effPopupId] || {}, currentArgsState);

           if (effPopupId.startsWith('sec_')) {
               const m = effPopupId.match(/sec_[^_]+_(\d+)/);
               if (m) {
                   window.TABS['__popups_active'][`sec_${m[1]}`] = activeCmds;
                   window.TABS['__popups_args'][`sec_${m[1]}`] = Object.assign(window.TABS['__popups_args'][`sec_${m[1]}`] || {}, currentArgsState);
               }
           }

           Object.keys(currentArgsState).forEach(k => {
               window.TABS['__cmd_args'][k] = Object.assign(window.TABS['__cmd_args'][k] || {}, currentArgsState[k]);
           });

           // LocalStorage backup
           try {
               localStorage.setItem('ros2_nexus_popups_active', JSON.stringify(window.TABS['__popups_active']));
               localStorage.setItem('ros2_nexus_popups_args', JSON.stringify(window.TABS['__popups_args']));
               localStorage.setItem('ros2_nexus_cmd_args', JSON.stringify(window.TABS['__cmd_args']));
           } catch (e) {
               console.error('Error saving to localStorage:', e);
           }

           // Save to backend config file
           fetch('/api/config', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(window.TABS)
           }).catch(err => console.error('Failed to save config to /api/config:', err));
       };
       
        const updateModalStats = () => {
            const topUl = document.getElementById('launch-modal-body') ? document.getElementById('launch-modal-body').querySelector('ul') : null;
            const selectAllLbl = document.getElementById('modal-select-all-lbl');
            const selectAllCb = document.getElementById('modal-select-all-cb');
            const selectAllText = document.getElementById('modal-select-all-text');
            const footerStatsText = document.getElementById('modal-footer-stats-text');

            if (!topUl) {
                if (selectAllLbl) selectAllLbl.style.display = 'none';
                if (footerStatsText) footerStatsText.textContent = '1 Aktion bereit zur Ausführung';
                return;
            }

            const allCbs = Array.from(topUl.querySelectorAll('.main-action-cb'));
            const total = allCbs.length;
            const activeCount = allCbs.filter(c => c.checked).length;

            if (selectAllCb) {
                selectAllCb.checked = (total > 0 && activeCount === total);
                selectAllCb.indeterminate = (activeCount > 0 && activeCount < total);
            }
            if (selectAllText) {
                selectAllText.textContent = `Alle auswählen (${activeCount}/${total})`;
            }
            if (footerStatsText) {
                footerStatsText.textContent = `${activeCount} von ${total} Aktionen aktiv · Bereit zur Ausführung`;
            }
        };
        
        function syncLinearAxisState(isLinearAxisActive) {
            actionsData.forEach(act => {
                if (act.args) {
                    act.args.forEach(a => {
                        if (a.text.includes('linear_axis')) {
                            a.checked = isLinearAxisActive;
                        }
                    });
                }
                if (act.title && (act.cmd.includes('servo') || act.cmd.includes('move_group') || act.cmd.includes('standalone_move_group') || act.title.toLowerCase().includes('linear axis'))) {
                    if (!isLinearAxisActive) {
                        act.title = act.title.replace(/\s*\+\s*Linear\s*Axis/gi, '')
                                             .replace(/\s*\(\s*\+\s*Linear\s*Axis\s*\)/gi, '')
                                             .replace(/\s*-\s*Linear\s*Axis/gi, '')
                                             .trim();
                    } else if (!act.title.toLowerCase().includes('linear axis')) {
                        act.title += ' + Linear Axis';
                    }
                }
            });

            const tunerAction = actionsData.find(act => act.cmd && act.cmd.includes('fake_linear_axis'));
            if (tunerAction) {
                tunerAction.active = isLinearAxisActive;
            }

            const modalBody = document.getElementById('launch-modal-body');
            const targetContainer = modalBody || contentClone;
            if (targetContainer) {
                targetContainer.querySelectorAll('li').forEach(liEl => {
                    if (liEl.dataset.cmd && liEl.dataset.cmd.includes('fake_linear_axis')) {
                        const cb = liEl.querySelector('.main-action-cb');
                        if (cb && cb.checked !== isLinearAxisActive) {
                            cb.checked = isLinearAxisActive;
                            liEl.classList.toggle('card-active', isLinearAxisActive);
                            liEl.classList.toggle('card-inactive', !isLinearAxisActive);
                        }
                    }
                });
                targetContainer.querySelectorAll('label.param-chip, label').forEach(lbl => {
                    const span = lbl.querySelector('span');
                    const cb = lbl.querySelector('input');
                    if (span && span.textContent.includes('linear_axis') && cb) {
                        cb.checked = isLinearAxisActive;
                        lbl.classList.toggle('chip-inactive', !isLinearAxisActive);
                    }
                });

                updateLinearAxisTreeNodes(targetContainer, isLinearAxisActive);
            }
            updateModalStats();
        }

        function syncGripperState(selectedGripperText) {
            const isVacuum = (selectedGripperText === 'add_vacuum_gripper:=true');
            actionsData.forEach(act => {
                const isMoveIt = (act.baseCmd && (act.baseCmd.includes('lite6_moveit_servo') || act.baseCmd.includes('standalone_move_group'))) ||
                                 (act.cmd && (act.cmd.includes('lite6_moveit_servo') || act.cmd.includes('standalone_move_group')));
                if (isMoveIt && act.args) {
                    act.args.forEach(a => {
                        if (a.text === 'add_vacuum_gripper:=true') a.checked = isVacuum;
                        if (a.text === 'add_gripper:=true') a.checked = !isVacuum;
                    });
                }
            });
            const modalBody = document.getElementById('launch-modal-body');
            if (modalBody) {
                modalBody.querySelectorAll('label.param-chip').forEach(lbl => {
                    const cb = lbl.querySelector('input');
                    if (cb && lbl.dataset.argText) {
                        if (lbl.dataset.argText === 'add_vacuum_gripper:=true') {
                            cb.checked = isVacuum;
                            lbl.classList.toggle('chip-inactive', !isVacuum);
                        } else if (lbl.dataset.argText === 'add_gripper:=true') {
                            cb.checked = !isVacuum;
                            lbl.classList.toggle('chip-inactive', isVacuum);
                        }
                    }
                });
            }
        }

        function syncReportTypeState(selectedReportType) {
            actionsData.forEach(act => {
                const isRealMove = (act.baseCmd && (act.baseCmd.includes('lite6_moveit_servo_realmove') || act.baseCmd.includes('standalone_move_group') || act.baseCmd.includes('report_type'))) ||
                                   (act.cmd && (act.cmd.includes('lite6_moveit_servo_realmove') || act.cmd.includes('standalone_move_group') || act.cmd.includes('report_type')));
                if (isRealMove && act.args) {
                    act.args.forEach(a => {
                        if (a.text.startsWith('report_type:=')) {
                            a.checked = (a.text === selectedReportType);
                        }
                    });
                }
            });
            const modalBody = document.getElementById('launch-modal-body');
            if (modalBody) {
                modalBody.querySelectorAll('label.param-chip').forEach(lbl => {
                    const cb = lbl.querySelector('input');
                    if (cb && lbl.dataset.argText && lbl.dataset.argText.startsWith('report_type:=')) {
                        const isSelected = (lbl.dataset.argText === selectedReportType);
                        cb.checked = isSelected;
                        lbl.classList.toggle('chip-inactive', !isSelected);
                    }
                });
            }
        }

        function isNodeZedOnly(item) {
            const selfSpan = item.querySelector('span:not(.badge):not([style*="float"])');
            const selfName = selfSpan ? selfSpan.textContent.trim().toLowerCase() : '';
            if (selfName.includes('yolo_3d_bbox_for_zed_m') ||
                selfName.includes('pointcloud_optimizer') ||
                selfName.includes('static_transform_publisher') ||
                selfName.includes('zed_camera.launch.py') ||
                selfName.includes('zed_wrapper') ||
                selfName.includes('robot_state_publisher')) {
                return true;
            }
            const text = (item.textContent || '').toLowerCase();
            if (text.includes('camera:=zed_m')) return true;
            if (item.closest('.sub-launch-tree')) return true;
            return false;
        }

        function isNodeIpCamOnly(item) {
            const selfSpan = item.querySelector('span:not(.badge):not([style*="float"])');
            const selfName = selfSpan ? selfSpan.textContent.trim().toLowerCase() : '';
            if (selfName.includes('yolo_3d_bbox_for_ip_cam') ||
                selfName.includes('ip_cam_aruco_6pose_tf_coord')) {
                return true;
            }
            const text = (item.textContent || '').toLowerCase();
            if (text.includes('camera:=ip_cam')) return true;
            return false;
        }

        function isNodeStaticObjects(item) {
            const selfSpan = item.querySelector('span:not(.badge):not([style*="float"])');
            const selfName = selfSpan ? selfSpan.textContent.trim().toLowerCase() : '';
            if (selfName.includes('rviz_marker_3d_scene_objects') ||
                selfName.includes('rviz_marker_3d_scene_plane') ||
                selfName.includes('rviz_marker_3d_scene_safety_zone') ||
                selfName.includes('rviz_marker_3d_scene_zedm_stand')) {
                return true;
            }
            const text = (item.textContent || '').toLowerCase();
            if (text.includes('rviz_marker_3d_scene_objects') || text.includes('rviz_marker_3d_scene_plane') || text.includes('rviz_marker_3d_scene_safety_zone') || text.includes('rviz_marker_3d_scene_zedm_stand') || text.includes('3d szene marker')) {
                return true;
            }
            return false;
        }

        function updateStaticObjectsTreeNodes(container, isStaticObjectsActive) {
            if (!container) return;

            if (typeof isStaticObjectsActive !== 'boolean') {
                const staticCb = container.querySelector('label.param-chip[data-arg-text="static_objects:=true"] input, label.param-chip[data-arg-text="static_onjects:=true"] input') ||
                                 document.querySelector('#launch-modal-body label.param-chip[data-arg-text="static_objects:=true"] input, #launch-modal-body label.param-chip[data-arg-text="static_onjects:=true"] input');
                isStaticObjectsActive = staticCb ? staticCb.checked : true;
            }

            const rows = container.querySelectorAll('.modal-card-row, .modal-action-card, li');
            rows.forEach(row => {
                const cmd = row.dataset.cmd || row.getAttribute('data-raw-cmd') || '';
                const text = row.textContent || '';
                if (cmd.includes('lite6_moveit_servo') || text.includes('lite6_moveit_servo')) {
                    const leftCol = row.querySelector('.modal-card-left-col') || row;
                    const subItems = leftCol.querySelectorAll('li');
                    subItems.forEach(item => {
                        if (isNodeStaticObjects(item)) {
                            setNodeState(item, isStaticObjectsActive, 'static_objects');
                        }
                    });
                }
            });
        }

        function isNodeLinearAxis(item) {
            const selfSpan = item.querySelector('span:not(.badge):not([style*="float"])');
            const selfName = selfSpan ? selfSpan.textContent.trim().toLowerCase() : '';
            if (selfName.includes('fake_linear_axis') || selfName === 'linear_axis') {
                return true;
            }
            const descSpan = Array.from(item.querySelectorAll('span')).find(s => s.style.float === 'right');
            const desc = descSpan ? descSpan.textContent.toLowerCase() : '';
            if (desc.includes('linearachse tf') || desc.includes('fake_linear_axis')) {
                return true;
            }
            return false;
        }

        function updateLinearAxisTreeNodes(container, isLinearAxisActive) {
            if (!container) return;

            if (typeof isLinearAxisActive !== 'boolean') {
                const axisCb = container.querySelector('label.param-chip[data-arg-text*="linear_axis"] input') ||
                               document.querySelector('#launch-modal-body label.param-chip[data-arg-text*="linear_axis"] input');
                isLinearAxisActive = axisCb ? axisCb.checked : false;
            }

            const rows = container.querySelectorAll('.modal-card-row, .modal-action-card, li');
            rows.forEach(row => {
                const cmd = row.dataset.cmd || row.getAttribute('data-raw-cmd') || '';
                const text = row.textContent || '';
                if (cmd.includes('lite6_moveit_servo') || text.includes('lite6_moveit_servo')) {
                    const leftCol = row.querySelector('.modal-card-left-col') || row;
                    const subItems = leftCol.querySelectorAll('li');
                    subItems.forEach(item => {
                        if (isNodeLinearAxis(item)) {
                            setNodeState(item, isLinearAxisActive, 'linear_axis');
                        }
                    });
                }
            });
        }

        function syncStaticObjectsState(isStaticObjectsActive) {
            actionsData.forEach(act => {
                const isServoLaunch = (act.baseCmd && act.baseCmd.includes('lite6_moveit_servo')) ||
                                      (act.cmd && act.cmd.includes('lite6_moveit_servo'));
                if (isServoLaunch && act.args) {
                    act.args.forEach(a => {
                        if (a.text === 'static_objects:=true' || a.text === 'static_onjects:=true') {
                            a.checked = isStaticObjectsActive;
                        }
                    });
                }
            });

            const modalBody = document.getElementById('launch-modal-body');
            const targetContainer = modalBody || contentClone;
            if (targetContainer) {
                targetContainer.querySelectorAll('label.param-chip').forEach(lbl => {
                    const cb = lbl.querySelector('input');
                    if (cb && lbl.dataset.argText && (lbl.dataset.argText === 'static_objects:=true' || lbl.dataset.argText === 'static_onjects:=true')) {
                        cb.checked = isStaticObjectsActive;
                        lbl.classList.toggle('chip-inactive', !isStaticObjectsActive);
                    }
                });

                targetContainer.querySelectorAll('.modal-card-row, .modal-action-card, li').forEach(row => {
                    const rowCmd = row.dataset.cmd || row.getAttribute('data-raw-cmd') || '';
                    if (rowCmd.includes('rviz_marker_3d_scene_objects.launch.py')) {
                        const cb = row.querySelector('.main-action-cb');
                        if (cb) {
                            cb.checked = isStaticObjectsActive;
                            row.classList.toggle('card-active', isStaticObjectsActive);
                            row.classList.toggle('row-active', isStaticObjectsActive);
                            row.classList.toggle('card-inactive', !isStaticObjectsActive);
                            row.classList.toggle('row-inactive', !isStaticObjectsActive);
                            const matchedAct = actionsData.find(a => a.cmd === rowCmd || a.baseCmd === rowCmd);
                            if (matchedAct) matchedAct.active = isStaticObjectsActive;
                        }
                    }
                });

                updateStaticObjectsTreeNodes(targetContainer, isStaticObjectsActive);
            }
        }

        function setNodeState(item, isActive, type) {
            if (isActive) {
                item.classList.remove('camera-node-inactive');
                item.classList.add('camera-node-active');
                item.removeAttribute('aria-disabled');
                item.title = (type === 'common') ? "Aktiv (wird in beiden Modi gestartet)" : "Aktiv (wird gestartet)";
                
                const descSpan = Array.from(item.querySelectorAll('span')).find(s => 
                    s.style.float === 'right' || s.textContent.includes('camera:=') || s.textContent.includes('inaktiv') || s.textContent.includes('aktiv')
                );
                if (descSpan) {
                    if (!descSpan.dataset.origText) descSpan.dataset.origText = descSpan.textContent;
                    let clean = descSpan.dataset.origText
                        .replace(/\s*·\s*inaktiv/gi, '')
                        .replace(/\s*·\s*aktiv/gi, '')
                        .replace(/\s*·\s*wird nicht gestartet/gi, '')
                        .replace(/\s*·\s*wird gestartet/gi, '')
                        .trim();
                    if (type !== 'common' && !clean.includes('aktiv')) {
                        clean = clean.replace(/\)$/, ' · aktiv)');
                    }
                    descSpan.textContent = clean;
                    descSpan.style.removeProperty('color');
                    descSpan.style.removeProperty('opacity');
                }
            } else {
                item.classList.add('camera-node-inactive');
                item.classList.remove('camera-node-active');
                item.setAttribute('aria-disabled', 'true');
                item.title = (type === 'zed' || type === 'ip') ? "Inaktiv im aktuellen Kamera-Modus (wird nicht gestartet)" : "Inaktiv (wird nicht gestartet)";
                
                const descSpan = Array.from(item.querySelectorAll('span')).find(s => 
                    s.style.float === 'right' || s.textContent.includes('camera:=') || s.textContent.includes('inaktiv') || s.textContent.includes('aktiv')
                );
                if (descSpan) {
                    if (!descSpan.dataset.origText) descSpan.dataset.origText = descSpan.textContent;
                    let clean = descSpan.dataset.origText
                        .replace(/\s*·\s*inaktiv/gi, '')
                        .replace(/\s*·\s*aktiv/gi, '')
                        .replace(/\s*·\s*wird nicht gestartet/gi, '')
                        .replace(/\s*·\s*wird gestartet/gi, '')
                        .trim();
                    clean = clean.replace(/\)$/, ' · inaktiv)');
                    descSpan.textContent = clean;
                    descSpan.style.setProperty('color', '#64748b', 'important');
                    descSpan.style.setProperty('opacity', '0.6', 'important');
                }
            }
        }

        function updateVisionTreeNodes(container, isIpCam) {
            if (!container) return;

            // Determine isIpCam from DOM if not passed as boolean
            if (typeof isIpCam !== 'boolean') {
                const ipCb = container.querySelector('label.param-chip[data-arg-text="camera:=ip_cam"] input') ||
                             document.querySelector('#launch-modal-body label.param-chip[data-arg-text="camera:=ip_cam"] input');
                isIpCam = ipCb ? ipCb.checked : false;
            }

            const rows = container.querySelectorAll('.modal-card-row, .modal-action-card, li');
            rows.forEach(row => {
                const cmd = row.dataset.cmd || row.getAttribute('data-raw-cmd') || '';
                const text = row.textContent || '';
                if (cmd.includes('robot_vision_cameras_bringup') || text.includes('robot_vision_cameras_bringup.launch.py')) {
                    const leftCol = row.querySelector('.modal-card-left-col') || row;
                    const subItems = leftCol.querySelectorAll('li');
                    subItems.forEach(item => {
                        const isZed = isNodeZedOnly(item);
                        const isIp = isNodeIpCamOnly(item);

                        if (isZed) {
                            setNodeState(item, !isIpCam, 'zed');
                        } else if (isIp) {
                            setNodeState(item, isIpCam, 'ip');
                        } else {
                            setNodeState(item, true, 'common');
                        }
                    });
                }
            });
        }

        function syncCameraVisionState(selectedCameraArg) {
            const isIpCam = (selectedCameraArg === 'camera:=ip_cam');
            actionsData.forEach(act => {
                const isVisionBringup = (act.baseCmd && act.baseCmd.includes('robot_vision_cameras_bringup.launch.py')) ||
                                        (act.cmd && act.cmd.includes('robot_vision_cameras_bringup.launch.py'));
                if (isVisionBringup && act.args) {
                    act.args.forEach(a => {
                        if (a.text === 'camera:=ip_cam') a.checked = isIpCam;
                        if (a.text === 'camera:=zed_m') a.checked = !isIpCam;
                    });
                }
            });
            const modalBody = document.getElementById('launch-modal-body');
            const targetContainer = modalBody || contentClone;
            if (targetContainer) {
                targetContainer.querySelectorAll('label.param-chip').forEach(lbl => {
                    const cb = lbl.querySelector('input');
                    if (cb && lbl.dataset.argText) {
                        if (lbl.dataset.argText === 'camera:=ip_cam') {
                            cb.checked = isIpCam;
                            lbl.classList.toggle('chip-inactive', !isIpCam);
                        } else if (lbl.dataset.argText === 'camera:=zed_m') {
                            cb.checked = !isIpCam;
                            lbl.classList.toggle('chip-inactive', isIpCam);
                        }
                    }
                });

                // Also sync standalone ZED-specific action cards in the same modal if present
                targetContainer.querySelectorAll('.modal-card-row, .modal-action-card, li').forEach(row => {
                    const rowCmd = row.dataset.cmd || row.getAttribute('data-raw-cmd') || '';
                    if (rowCmd.includes('yolo_3d_bbox_for_zed_m.py')) {
                        const cb = row.querySelector('.main-action-cb');
                        if (cb) {
                            cb.checked = !isIpCam;
                            row.classList.toggle('card-active', !isIpCam);
                            row.classList.toggle('row-active', !isIpCam);
                            row.classList.toggle('card-inactive', isIpCam);
                            row.classList.toggle('row-inactive', isIpCam);
                            const matchedAct = actionsData.find(a => a.cmd === rowCmd || a.baseCmd === rowCmd);
                            if (matchedAct) matchedAct.active = !isIpCam;
                        }
                    }
                });

                updateVisionTreeNodes(targetContainer, isIpCam);
                updateModalStats();
            }
        }
        
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
           if (fileIndex === -1 && tokens[0] === 'ros2' && tokens[1] === 'topic' && tokens[2] === 'pub') {
                // For 'ros2 topic pub', scan past optional flags to find topic-name and msg-type
                // Structure: ros2 topic pub [flags] <topic> <msg_type> [<msg_yaml>]
                // We want: baseCmd = everything up to and including msg_type
                // So only the message payload (and nothing else) becomes a checkbox
                let idx = 3;
                // skip optional flags like --rate <n>, --once, --keep-alive <s>, etc.
                while (idx < tokens.length && tokens[idx].startsWith('-')) {
                    idx++; // skip the flag name
                    if (idx < tokens.length && !tokens[idx].startsWith('-') && !tokens[idx].startsWith('/')) {
                        idx++; // skip the flag value
                    }
                }
                // idx now points to <topic>, skip topic and msg_type
                idx += 2; // past <topic> and <msg_type>
                fileIndex = idx - 1; // fileIndex is last mandatory token (msg_type)
            }
           
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
               
               let mergedArgs = [];
               for (let i = 0; i < argTokens.length; i++) {
                   let t = argTokens[i];
                   if (t.startsWith('-')) {
                       let group = t;
                       while (i + 1 < argTokens.length) {
                           let nextToken = argTokens[i+1];
                           if (nextToken.startsWith('-')) {
                               group += ' ' + nextToken;
                               i++;
                           } else {
                               group += ' ' + nextToken;
                               i++;
                               break;
                           }
                       }
                       mergedArgs.push(group);
                   } else {
                       mergedArgs.push(t);
                   }
               }

                mergedArgs.forEach(arg => {
                    const isChecked = getSavedArgState(effPopupId, action.cmd, action.baseCmd, arg);
                    action.args.push({ text: arg, checked: isChecked });
                });

                // Update action.title if linear_axis arg or tuner node is not checked initially
                const hasLinearAxisArg = action.args.some(a => a.text.includes('linear_axis'));
                if ((hasLinearAxisArg || (action.title && action.title.toLowerCase().includes('linear axis'))) && action.title) {
                    const isLinearAxisChecked = action.args.some(a => a.text.includes('linear_axis') && a.checked);
                    const tunerNode = actionsData.find(a => a.cmd && a.cmd.includes('fake_linear_axis'));
                    const isTunerActive = tunerNode ? tunerNode.active : true;
                    if (!isLinearAxisChecked || !isTunerActive) {
                        action.title = action.title.replace(/\s*\+\s*Linear\s*Axis/gi, '')
                                                   .replace(/\s*\(\s*\+\s*Linear\s*Axis\s*\)/gi, '')
                                                   .replace(/\s*-\s*Linear\s*Axis/gi, '')
                                                   .trim();
                    }
                }
            } else {
               action.baseCmd = action.cmd;
               action.postCmd = '';
           }

            // Whisper (Sprachsteuerung): CPU/GPU als Umschalter statt Chips.
            // silero_vad_use_cuda wirkt nicht (kein VAD in whisper_bringup) und
            // wird nicht mehr angeboten. Ein abgewaehltes use_gpu:=true wuerde
            // nur weggelassen und damit den Launch-Standard (GPU) behalten -
            // deshalb haengt der Start immer use_gpu:=true oder :=false an.
            if (isWhisperLaunch(action.baseCmd)) {
                const gpuDefault = !action.args.some(a => /^use_gpu:=false$/i.test(a.text));
                action.args = action.args.filter(a => !/^(silero_vad_use_cuda|use_gpu):=/i.test(a.text));
                // Nur der exakte Befehl zaehlt: GPU- und CPU-Karte teilen sich den
                // Grundbefehl, die Wahl der einen soll die andere nicht umstellen.
                const useGpu = getSavedArgState(effPopupId, action.cmd, null, WHISPER_GPU_ARG, gpuDefault);
                action.args.unshift({ text: WHISPER_GPU_ARG, checked: !!useGpu, kind: 'gpu-toggle' });
            }

               // Ensure static_objects:=true is available for lite6_moveit_servo
            if (action.baseCmd && (action.baseCmd.includes('lite6_moveit_servo_realmove.launch.py') || action.baseCmd.includes('lite6_moveit_servo_fake.launch.py'))) {
                const staticArgText = 'static_objects:=true';
                if (!action.args.some(a => a.text === staticArgText || a.text === 'static_onjects:=true')) {
                    const isChecked = getSavedArgState(effPopupId, action.cmd, action.baseCmd, staticArgText);
                    action.args.push({ text: staticArgText, checked: isChecked });
                }
                // RViz mitstarten ja/nein - echtes Launch-Argument "rviz" der
                // Servo-Launches (Standard: an). Ohne Haken wird rviz:=false
                // angehaengt, siehe buildCmdWithArgs.
                const rvizArgText = 'rviz:=true';
                if (!action.args.some(a => a.text.startsWith('rviz:='))) {
                    const isChecked = getSavedArgState(effPopupId, action.cmd, action.baseCmd, rvizArgText);
                    action.args.push({ text: rvizArgText, checked: isChecked });
                }
            }

            // Ensure camera selection and ZED M YOLO models args are available for robot_vision_cameras_bringup
            if (action.baseCmd && action.baseCmd.includes('robot_vision_cameras_bringup.launch.py')) {
                action.args = action.args.filter(a => !a.text.startsWith('use_zed_hardware'));
                const visionDefaults = [
                    'camera:=zed_m',
                    'camera:=ip_cam',
                    'yolo_model:=yolov8l.pt',
                    'yolo_model:=yolov8s.pt',
                    'yolo_model:=my_yolo_model.pt'
                ];
                visionDefaults.forEach(defArg => {
                    if (!action.args.some(a => a.text === defArg)) {
                        let isChecked = getSavedArgState(effPopupId, action.cmd, action.baseCmd, defArg);
                        if (defArg === 'camera:=zed_m' && isChecked === false) {
                            const ipSaved = getSavedArgState(effPopupId, action.cmd, action.baseCmd, 'camera:=ip_cam');
                            if (!ipSaved) isChecked = true;
                        }
                        action.args.push({ text: defArg, checked: isChecked });
                    }
                });
            }

            // Ensure gripper selection args (add_vacuum_gripper and add_gripper) are available for Lite6 MoveIt Servo / MoveGroup
            const isMoveItGripperCmd = (action.baseCmd && (
                action.baseCmd.includes('lite6_moveit_servo') || 
                action.baseCmd.includes('standalone_move_group')
            )) || (action.cmd && (
                action.cmd.includes('lite6_moveit_servo') || 
                action.cmd.includes('standalone_move_group')
            ));

            if (isMoveItGripperCmd) {
                const gripperDefaults = [
                    'add_vacuum_gripper:=true',
                    'add_gripper:=true'
                ];
                gripperDefaults.forEach(defArg => {
                    if (!action.args.some(a => a.text === defArg)) {
                        let isChecked = getSavedArgState(effPopupId, action.cmd, action.baseCmd, defArg);
                        if (defArg === 'add_vacuum_gripper:=true' && isChecked === false) {
                            const gripSaved = getSavedArgState(effPopupId, action.cmd, action.baseCmd, 'add_gripper:=true');
                            if (!gripSaved) isChecked = true;
                        }
                        action.args.push({ text: defArg, checked: isChecked });
                    }
                });
            }

            // Ensure report_type selection args (dev, normal, rich) are available for Real Move commands
            const isRealMoveReportCmd = (action.baseCmd && (
                action.baseCmd.includes('lite6_moveit_servo_realmove') || 
                (action.baseCmd.includes('standalone_move_group') && (action.baseCmd.includes('robot_ip') || (action.cmd && action.cmd.includes('robot_ip')))) ||
                action.baseCmd.includes('report_type')
            )) || (action.cmd && (
                action.cmd.includes('lite6_moveit_servo_realmove') || 
                (action.cmd.includes('standalone_move_group') && action.cmd.includes('robot_ip')) ||
                action.cmd.includes('report_type')
            ));

            if (isRealMoveReportCmd) {
                // Ensure robot_ip:=192.168.1.175 is available and checked by default for realmove
                const defaultIp = 'robot_ip:=192.168.1.175';
                if (!action.args.some(a => a.text.startsWith('robot_ip:='))) {
                    let isChecked = getSavedArgState(effPopupId, action.cmd, action.baseCmd, defaultIp);
                    if (isChecked === undefined || isChecked === false) isChecked = true;
                    action.args.push({ text: defaultIp, checked: isChecked });
                } else {
                    const ipArg = action.args.find(a => a.text.startsWith('robot_ip:='));
                    if (ipArg && !ipArg.checked) {
                        ipArg.checked = true;
                    }
                }

                const reportDefaults = [
                    'report_type:=dev',
                    'report_type:=normal',
                    'report_type:=rich'
                ];
                reportDefaults.forEach(defArg => {
                    if (!action.args.some(a => a.text === defArg)) {
                        let isChecked = getSavedArgState(effPopupId, action.cmd, action.baseCmd, defArg);
                        if (defArg === 'report_type:=dev' && isChecked === false) {
                            const normalSaved = getSavedArgState(effPopupId, action.cmd, action.baseCmd, 'report_type:=normal');
                            const richSaved = getSavedArgState(effPopupId, action.cmd, action.baseCmd, 'report_type:=rich');
                            if (!normalSaved && !richSaved) isChecked = true;
                        }
                        action.args.push({ text: defArg, checked: isChecked });
                    }
                });
            }
        }
        
            function createArgsDiv(action) {
             const argsDiv = document.createElement('div');
             argsDiv.className = 'modal-args-list';
             argsDiv.style.cssText = 'flex: 1; display: flex; flex-direction: column; gap: 8px; align-items: flex-start; min-width: 0;';
             
             if (action && action.args.length > 0) {
                 // Ensure exactly one camera:= arg is checked initially
                 const checkedCams = action.args.filter(a => a.text.startsWith('camera:=') && a.checked);
                 if (checkedCams.length > 1) {
                     const preferred = checkedCams.find(a => a.text === 'camera:=zed_m') || checkedCams[0];
                     checkedCams.forEach(a => { if (a !== preferred) a.checked = false; });
                 } else if (checkedCams.length === 0 && action.args.some(a => a.text.startsWith('camera:='))) {
                     const defaultCam = action.args.find(a => a.text === 'camera:=zed_m') || action.args.find(a => a.text.startsWith('camera:='));
                     if (defaultCam) defaultCam.checked = true;
                 }

                 // Ensure at most one yolo_model:= arg is checked initially
                 const checkedYoloModels = action.args.filter(a => a.text.startsWith('yolo_model:=') && a.checked);
                 if (checkedYoloModels.length > 1) {
                     const preferred = checkedYoloModels.find(a => a.text === 'yolo_model:=yolov8l.pt') || checkedYoloModels[0];
                     checkedYoloModels.forEach(a => { if (a !== preferred) a.checked = false; });
                 }

                 // Ensure exactly one gripper arg is checked initially
                 const gripperArgs = action.args.filter(a => a.text === 'add_vacuum_gripper:=true' || a.text === 'add_gripper:=true');
                 if (gripperArgs.length > 0) {
                     const checkedGrippers = gripperArgs.filter(a => a.checked);
                     if (checkedGrippers.length > 1) {
                         const preferred = checkedGrippers.find(a => a.text === 'add_vacuum_gripper:=true') || checkedGrippers[0];
                         checkedGrippers.forEach(a => { if (a !== preferred) a.checked = false; });
                     } else if (checkedGrippers.length === 0) {
                         const defaultGripper = gripperArgs.find(a => a.text === 'add_vacuum_gripper:=true') || gripperArgs[0];
                         if (defaultGripper) defaultGripper.checked = true;
                     }
                 }

                 // Ensure exactly one report_type:= arg is checked initially
                 const reportTypeArgs = action.args.filter(a => a.text.startsWith('report_type:='));
                 if (reportTypeArgs.length > 0) {
                     const checkedReports = reportTypeArgs.filter(a => a.checked);
                     if (checkedReports.length > 1) {
                         const preferred = checkedReports.find(a => a.text === 'report_type:=dev') || checkedReports[0];
                         checkedReports.forEach(a => { if (a !== preferred) a.checked = false; });
                     } else if (checkedReports.length === 0) {
                         const defaultReport = reportTypeArgs.find(a => a.text === 'report_type:=dev') || reportTypeArgs[0];
                         if (defaultReport) defaultReport.checked = true;
                     }
                 }

                 // Put robot_ip args first, camera args next, yolo_model args next, gripper args grouped together, report_type args grouped together
                 action.args.sort((a, b) => {
                     const isIpA = a.text.startsWith('robot_ip:=');
                     const isIpB = b.text.startsWith('robot_ip:=');
                     if (isIpA && !isIpB) return -1;
                     if (!isIpA && isIpB) return 1;

                     const isCamA = a.text.startsWith('camera:=');
                     const isCamB = b.text.startsWith('camera:=');
                     const isYoloA = a.text.startsWith('yolo_model:=');
                     const isYoloB = b.text.startsWith('yolo_model:=');
                     if (isCamA && !isCamB) return -1;
                     if (!isCamA && isCamB) return 1;
                     if (isYoloA && !isYoloB) return -1;
                     if (!isYoloA && isYoloB) return 1;

                     const isGripA = (a.text === 'add_vacuum_gripper:=true' || a.text === 'add_gripper:=true');
                     const isGripB = (b.text === 'add_vacuum_gripper:=true' || b.text === 'add_gripper:=true');
                     if (isGripA && isGripB) {
                         if (a.text === 'add_vacuum_gripper:=true') return -1;
                         if (b.text === 'add_vacuum_gripper:=true') return 1;
                     }
                     if (isGripA && !isGripB) return -1;
                     if (!isGripA && isGripB) return 1;

                     const isRepA = a.text.startsWith('report_type:=');
                     const isRepB = b.text.startsWith('report_type:=');
                     if (isRepA && isRepB) {
                         const repOrder = ['report_type:=dev', 'report_type:=normal', 'report_type:=rich'];
                         const idxA = repOrder.indexOf(a.text);
                         const idxB = repOrder.indexOf(b.text);
                         return (idxA !== -1 && idxB !== -1) ? idxA - idxB : 0;
                     }
                     if (isRepA && !isRepB) return -1;
                     if (!isRepA && isRepB) return 1;

                     return 0;
                 });

                 const argLaunchKey = launchKeyOf(action.baseCmd || action.cmd);

                 action.args.forEach(argObj => {
                     if (argObj.kind === 'gpu-toggle') {
                         argsDiv.appendChild(buildWhisperDeviceToggle(argObj, saveActiveState));
                         return;
                     }
                     const argLbl = document.createElement('label');
                     const kind = classifyArg(argObj.text, argLaunchKey);
                     argLbl.className = 'param-chip'
                         + (argObj.checked ? '' : ' chip-inactive')
                         + (kind.cls ? ' ' + kind.cls : '');
                     if (kind.title) argLbl.title = kind.title;
                     argLbl.dataset.argText = argObj.text;
                     
                     const argCb = document.createElement('input');
                     argCb.type = 'checkbox';
                     argCb.checked = !!argObj.checked;
                     
                     argCb.onclick = (e) => e.stopPropagation();
                     argCb.onchange = (e) => {
                         argObj.checked = e.target.checked;
                         argLbl.classList.toggle('chip-inactive', !e.target.checked);
                         
                         // Mutually exclusive camera selection (Toggle between camera:=zed_m and camera:=ip_cam)
                         if (argObj.text.startsWith('camera:=')) {
                             const targetCam = (!e.target.checked) ? 
                                 ((argObj.text === 'camera:=zed_m') ? 'camera:=ip_cam' : 'camera:=zed_m') : 
                                 argObj.text;
                             syncCameraVisionState(targetCam);
                         }

                         // Mutually exclusive yolo_model selection
                         if (e.target.checked && argObj.text.startsWith('yolo_model:=')) {
                             action.args.forEach(otherArg => {
                                 if (otherArg !== argObj && otherArg.text.startsWith('yolo_model:=')) {
                                     otherArg.checked = false;
                                 }
                             });
                             argsDiv.querySelectorAll('label.param-chip').forEach(lbl => {
                                 const cb = lbl.querySelector('input');
                                 if (cb && lbl.dataset.argText) {
                                     const matchArg = action.args.find(a => a.text === lbl.dataset.argText);
                                     if (matchArg) {
                                         cb.checked = matchArg.checked;
                                         lbl.classList.toggle('chip-inactive', !matchArg.checked);
                                     }
                                 }
                             });
                         }

                         // Mutually exclusive gripper selection (Toggle between add_vacuum_gripper:=true and add_gripper:=true)
                         if (argObj.text === 'add_vacuum_gripper:=true' || argObj.text === 'add_gripper:=true') {
                             const targetGripper = (!e.target.checked) ? 
                                 ((argObj.text === 'add_vacuum_gripper:=true') ? 'add_gripper:=true' : 'add_vacuum_gripper:=true') : 
                                 argObj.text;
                             syncGripperState(targetGripper);
                         }

                         // Mutually exclusive report_type selection (Toggle between dev, normal, rich)
                         if (argObj.text.startsWith('report_type:=')) {
                             const targetReportType = (!e.target.checked) ? 'report_type:=dev' : argObj.text;
                             syncReportTypeState(targetReportType);
                         }

                        // Static Objects sync
                        if (argObj.text === 'static_objects:=true' || argObj.text === 'static_onjects:=true') {
                            syncStaticObjectsState(e.target.checked);
                        }

                        // Linear Axis dynamic title and checkbox synchronization
                        if (argObj.text.includes('linear_axis')) {
                            syncLinearAxisState(e.target.checked);
                        }
                        
                        saveActiveState();
                    };
                    
                    const txtSpan = document.createElement('span');
                    txtSpan.style.overflow = 'hidden';
                    txtSpan.style.textOverflow = 'ellipsis';
                    txtSpan.style.whiteSpace = 'nowrap';
                    
                    if (argObj.text.includes(':=')) {
                        const parts = argObj.text.split(':=');
                        txtSpan.innerHTML = `<span style="color:#38bdf8;opacity:0.9;">${parts[0]}:=</span><span style="color:#f8fafc;font-weight:600;">${parts.slice(1).join(':=')}</span>`;
                    } else if (argObj.text.includes('=')) {
                        const parts = argObj.text.split('=');
                        txtSpan.innerHTML = `<span style="color:#38bdf8;opacity:0.9;">${parts[0]}=</span><span style="color:#f8fafc;font-weight:600;">${parts.slice(1).join('=')}</span>`;
                    } else {
                        txtSpan.textContent = argObj.text;
                    }
                    
                    argLbl.appendChild(argCb);
                    argLbl.appendChild(txtSpan);
                    argsDiv.appendChild(argLbl);
                });
            } else {
                const noArgsEl = document.createElement('div');
                noArgsEl.style.cssText = 'font-family:var(--font-mono); font-size:11px; color:#64748b; font-style:italic; padding:6px 0; user-select:none;';
                noArgsEl.textContent = 'Keine Parameter';
                argsDiv.appendChild(noArgsEl);
            }
            return argsDiv;
        }

       const topUls = Array.from(contentClone.children).filter(n => n.tagName === 'UL');
       if (topUls.length > 0) {
          const topUl = topUls[0];
          topUl.style.cssText = 'width: 100%; max-width: 1380px; margin: 0 auto; list-style: none; padding: 0; display: flex; flex-direction: column; gap: 14px;';
          let hasAnyDual = false;
          
          const topLis = Array.from(topUl.children).filter(n => n.tagName === 'LI');
          const matchedCmds = new Set();
          topLis.forEach(li => {
              let action = null;
              const actionIndex = li.dataset.actionIndex !== undefined ? parseInt(li.dataset.actionIndex, 10) : -1;
              if (actionIndex >= 0 && actionIndex < actionsData.length && !matchedCmds.has(actionsData[actionIndex].cmd)) {
                  action = actionsData[actionIndex];
              }
              if (!action && li.dataset.cmd) {
                  action = actionsData.find(a => a.cmd === li.dataset.cmd && !matchedCmds.has(a.cmd));
              }
              if (!action && li.dataset.rawCmd) {
                  action = actionsData.find(a => a.cmd === li.dataset.rawCmd && !matchedCmds.has(a.cmd));
              }
              if (!action) {
                  const clone = li.cloneNode(true);
                  Array.from(clone.children).forEach(c => { if (c.tagName === 'UL' || c.classList.contains('badge')) c.remove(); });
                  const text = clone.textContent.replace(/\(.*?\)/g, '').trim();
                  if (text) {
                      action = actionsData.find(a => {
                          if (matchedCmds.has(a.cmd)) return false;
                          const cmdTokens = a.cmd.split(/\s+/);
                          if (cmdTokens.some(t => t === text || t.endsWith('/' + text))) return true;
                          const baseTerm = text.replace(/\.(py|cpp|xml)$/, '');
                          if (cmdTokens.some(t => t === baseTerm || t === baseTerm + '.py' || t === baseTerm + '.cpp' || t === baseTerm + '.xml')) return true;
                          if (cmdTokens.some(t => t.replace(/_node$/, '') === baseTerm)) return true;
                          return false;
                      });
                  }
              }
              
              if (action) {
                  matchedCmds.add(action.cmd);
                  parseArgs(action);
                  li.dataset.cmd = action.cmd;
              }
              
              const rawCmdData = li.getAttribute('data-raw-cmd');
              const cmdToDisplay = (action && action.cmd) ? action.cmd : (rawCmdData ? rawCmdData : (li.dataset.cmd || ''));
              const isLaunchCard = (action && action.cmd && action.cmd.startsWith('ros2 launch')) || (cmdToDisplay && cmdToDisplay.startsWith('ros2 launch'));

              // Build Flex Layout
              const cardLayout = document.createElement('div');
              cardLayout.className = 'modal-card-layout';
              cardLayout.style.cssText = 'display: flex; width: 100%; justify-content: space-between; align-items: stretch; gap: 20px; flex: 1; min-width: 0;';
              
              const leftCol = document.createElement('div');
              leftCol.className = 'modal-card-left-col';
              leftCol.style.cssText = 'display: flex; flex-direction: column; gap: 0; flex: 1 1 0%; min-width: 0; overflow: visible;';
              
              const titleDiv = document.createElement('div');
              titleDiv.style.cssText = 'display: flex; align-items: center; gap: 8px; height: 32px; min-height: 32px; flex-wrap: nowrap; min-width: 0; width: 100%; overflow: visible;';
              
              const ulNode = Array.from(li.childNodes).find(n => n.tagName === 'UL');
              Array.from(li.childNodes).forEach(node => {
                  if (node !== ulNode) {
                      if (node.nodeType === 1) {
                          const textContent = (node.textContent || '').trim();
                          const isDesc = (node.style.float === 'right') || 
                                         (textContent.startsWith('(') && textContent.endsWith(')'));
                          if (isDesc) {
                              node.style.float = 'none';
                              node.style.marginLeft = '6px';
                              node.style.fontSize = '10.5px';
                              node.style.color = '#64748b';
                              node.style.whiteSpace = 'nowrap';
                              node.style.overflow = 'hidden';
                              node.style.textOverflow = 'ellipsis';
                              node.style.flexShrink = '2';
                              node.style.minWidth = '0';
                          } else if (!node.classList.contains('badge') && !node.classList.contains('modal-cmd-btn')) {
                              node.style.whiteSpace = 'nowrap';
                              node.style.overflow = 'hidden';
                              node.style.textOverflow = 'ellipsis';
                              node.style.flexShrink = '1';
                              node.style.minWidth = '0';
                              node.style.fontSize = '12.5px';
                              node.style.fontWeight = '600';
                          }
                      }
                      titleDiv.appendChild(node);
                  }
              });
              
              leftCol.appendChild(titleDiv);
              if (ulNode) {
                  ulNode.style.cssText = 'margin-left: 6px; margin-top: 20px; margin-bottom: 2px; border: none; padding: 0;';
                  ulNode.querySelectorAll('ul').forEach(subUl => {
                      subUl.classList.add('sub-launch-tree');
                  });
                  leftCol.appendChild(ulNode);
              }

              const middleCol = document.createElement('div');
              middleCol.className = 'modal-card-middle-col has-divider-v';
              
              const spacer = document.createElement('div');
              spacer.className = 'modal-params-header';
              spacer.style.cssText = 'height: 32px; min-height: 32px; flex-shrink: 0; display: flex; align-items: center; gap: 6px;';
              spacer.innerHTML = `<i class="fa-solid fa-sliders" style="font-size:10px; color:var(--accent);"></i> <span>PARAMETERS &amp; ARGS</span>`;
              middleCol.appendChild(spacer);
              
              const argsDiv = createArgsDiv(action);
              argsDiv.style.marginTop = '20px';
              middleCol.appendChild(argsDiv);
              
              const badgeContainer = document.createElement('div');
              badgeContainer.style.cssText = 'display: flex; align-items: center; gap: 6px; margin-left: auto; flex-shrink: 0;';
              titleDiv.appendChild(badgeContainer);

              let isRos2 = (action && action.cmd && action.cmd.startsWith('ros2 run')) || (cmdToDisplay && cmdToDisplay.startsWith('ros2 run'));
              if (isRos2) {
                  const ros2Badge = document.createElement('div');
                  ros2Badge.innerHTML = `<i class="fa-solid fa-robot"></i> ROS 2`;
                  ros2Badge.style.cssText = 'background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.35); border-radius:5px; padding:2px 6px; font-size:9.5px; color:#93c5fd; font-weight:bold; letter-spacing:0.5px; display:flex; align-items:center; gap:4px; flex-shrink:0;';
                  badgeContainer.appendChild(ros2Badge);
              }
              
              let hasPython3 = (action && action.cmd && action.cmd.includes('python3')) || (cmdToDisplay && cmdToDisplay.includes('python3'));
              if (hasPython3) {
                  const pythonBadge = document.createElement('div');
                  pythonBadge.innerHTML = `<i class="fa-brands fa-python"></i> Python3`;
                  pythonBadge.style.cssText = 'background:rgba(234,179,8,0.15); border:1px solid rgba(234,179,8,0.35); border-radius:5px; padding:2px 6px; font-size:9.5px; color:#fde047; font-weight:bold; letter-spacing:0.5px; display:flex; align-items:center; gap:4px; flex-shrink:0;';
                  badgeContainer.appendChild(pythonBadge);
              }
              
              let hasChrome = (action && action.cmd && (action.cmd.includes('google-chrome') || action.cmd.includes('chromium-browser'))) || (cmdToDisplay && (cmdToDisplay.includes('google-chrome') || cmdToDisplay.includes('chromium-browser')));
              if (hasChrome) {
                  const chromeBadge = document.createElement('div');
                  chromeBadge.innerHTML = `<i class="fa-brands fa-chrome"></i> +CHROME`;
                  chromeBadge.style.cssText = 'background:rgba(66,133,244,0.15); border:1px solid rgba(66,133,244,0.35); border-radius:5px; padding:2px 6px; font-size:9.5px; color:#4285F4; font-weight:bold; letter-spacing:0.5px; display:flex; align-items:center; gap:4px; flex-shrink:0;';
                  badgeContainer.appendChild(chromeBadge);
              }
              
              const cmdToCopy = rawCmdData ? rawCmdData : (action ? action.cmd : text);
              const cmdBadge1 = createCmdBadge(cmdToCopy);
              badgeContainer.appendChild(cmdBadge1);

              let descText = 'Details zur Node / zum Launch-File';
              const rightSpan = Array.from(titleDiv.children).find(n => n.tagName === 'SPAN' && (n.style.marginLeft === 'auto' || n.style.float === 'right'));
              if (rightSpan) {
                  descText = rightSpan.textContent.replace(/^\(|\)$/g, '').trim();
                  rightSpan.style.color = '#94a3b8';
                  rightSpan.style.fontSize = '12px';
              } else if (action && action.title) {
                  descText = action.title;
              }
              
              const infoBadge = document.createElement('div');
              infoBadge.innerHTML = `<i class="fa-solid fa-circle-info"></i><div class="info-tooltip" style="position:absolute; top:28px; right:0; background:rgba(15,23,42,0.96); border:1px solid rgba(56,189,248,0.4); border-radius:8px; padding:10px 14px; font-size:11px; color:#f8fafc; white-space:normal; width:max-content; max-width:280px; pointer-events:none; opacity:0; transition:opacity 0.2s ease; box-shadow:0 8px 24px rgba(0,0,0,0.6); z-index:100; line-height:1.4;">${descText.replace(/"/g, '&quot;')}</div>`;
              infoBadge.style.cssText = 'position:relative; width:22px; height:22px; background:rgba(255,255,255,0.06); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; color:#94a3b8; cursor:help; transition:all 0.2s ease; border:1px solid rgba(255,255,255,0.12); flex-shrink:0;';
              infoBadge.onmouseover = () => {
                  infoBadge.style.background = 'rgba(56,189,248,0.15)';
                  infoBadge.style.borderColor = 'rgba(56,189,248,0.4)';
                  infoBadge.style.color = '#38bdf8';
                  infoBadge.querySelector('.info-tooltip').style.opacity = '1';
              };
              infoBadge.onmouseout = () => {
                  infoBadge.style.background = 'rgba(255,255,255,0.06)';
                  infoBadge.style.borderColor = 'rgba(255,255,255,0.12)';
                  infoBadge.style.color = '#94a3b8';
                  infoBadge.querySelector('.info-tooltip').style.opacity = '0';
              };
              badgeContainer.appendChild(infoBadge);
              
              const isChecked = action ? !!action.active : (activeSet ? (activeSet.has(li.dataset.cmd) || (action && action.baseCmd && activeSet.has(action.baseCmd))) : true);
              if (action) action.active = isChecked;

              const mainCb = document.createElement('input');
              mainCb.type = 'checkbox';
              mainCb.className = 'main-action-cb';
              mainCb.checked = isChecked;

              cardLayout.appendChild(leftCol);
              cardLayout.appendChild(middleCol);

              const iconMetas = getActionIconMeta(action, cmdToDisplay);
              const isDual = iconMetas.length > 1;
              if (isDual) hasAnyDual = true;

              const iconCol = document.createElement('div');
              iconCol.className = 'modal-card-icon-col' + (isDual ? ' is-vr-dual is-multiple-icons' : '') + (iconMetas.length === 0 ? ' is-empty-spacer' : '');

              iconMetas.forEach(meta => {
                  const iconBadge = document.createElement('div');
                  iconBadge.className = 'modal-card-icon-badge';
                  iconBadge.title = meta.label;

                  const img = document.createElement('img');
                  img.src = meta.path;
                  img.className = 'modal-card-side-img';
                  img.alt = meta.label;

                  iconBadge.appendChild(img);
                  iconCol.appendChild(iconBadge);
              });

              const cbContainer = document.createElement('div');
              cbContainer.className = 'modal-cb-wrap';
              cbContainer.appendChild(mainCb);

              const liInnerWrapper = document.createElement('div');
              liInnerWrapper.style.cssText = 'display: flex; align-items: stretch; width: 100%; gap: 14px;';
              liInnerWrapper.appendChild(cbContainer);
              liInnerWrapper.appendChild(iconCol);
              liInnerWrapper.appendChild(cardLayout);
              
              const cardDiv = document.createElement('div');
              cardDiv.className = 'modal-action-card ' + (isChecked ? 'card-active' : 'card-inactive');
              cardDiv.appendChild(liInnerWrapper);
              
              const hasBodyContent = !!ulNode || (action && action.args && action.args.length > 0);
              if (hasBodyContent) {
                  const hrLine = document.createElement('div');
                  hrLine.className = 'modal-card-divider-h';
                  hrLine.style.position = 'absolute';
                  hrLine.style.top = '52px';
                  hrLine.style.left = '142px';
                  hrLine.style.width = 'calc(100% - 158px)';
                  hrLine.style.height = '1px';
                  hrLine.style.background = 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.22) 15%, rgba(255, 255, 255, 0.22) 85%, transparent 100%)';
                  hrLine.style.pointerEvents = 'none';
                  cardDiv.appendChild(hrLine);
              }

              // Chevron nur, wenn es auch etwas einzuklappen gibt (Baum oder Args)
              if (hasBodyContent) {
                  attachCardCollapse(cardDiv, spacer,
                      (action && (action.cmd || action.baseCmd)) || cmdToDisplay || li.dataset.cmd,
                      [ulNode, argsDiv]);
              }

              li.className = 'modal-card-row ' + (isChecked ? 'row-active' : 'row-inactive');
              li.innerHTML = '';
              li.appendChild(cardDiv);

              mainCb.onclick = (e) => e.stopPropagation();
              mainCb.onchange = (e) => {
                  if (action) action.active = e.target.checked;
                  cardDiv.classList.toggle('card-active', e.target.checked);
                  cardDiv.classList.toggle('card-inactive', !e.target.checked);
                  li.classList.toggle('row-active', e.target.checked);
                  li.classList.toggle('row-inactive', !e.target.checked);
                  
                  if (action && (action.cmd.includes('fake_linear_axis') || action.cmd.includes('linear_axis'))) {
                      syncLinearAxisState(e.target.checked);
                  }
                  
                  updateModalStats();
                  if (!e.simulated) saveActiveState();
              };
              
              li.onclick = (e) => {
                  if (e.target === mainCb || e.target.closest('label') || e.target.closest('a') || e.target.closest('.modal-cmd-btn') || e.target.closest('button')) return;
                  mainCb.checked = !mainCb.checked;
                  mainCb.dispatchEvent(new Event('change'));
              };
          });
          
              // Append any unmatched actions to the bottom to ensure nothing is missing
          const unmatchedActions = actionsData.filter(a => !matchedCmds.has(a.cmd));
          unmatchedActions.forEach(action => {
              const li = document.createElement('li');
              li.dataset.cmd = action.cmd;
              parseArgs(action);
              let isActive = action ? !!action.active : (activeSet ? (activeSet.has(li.dataset.cmd) || (action && action.baseCmd && activeSet.has(action.baseCmd))) : true);
              action.active = isActive;
              
              li.className = 'modal-action-card ' + (isActive ? 'card-active' : 'card-inactive');
              
              let baseHtml = `<span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> SCRIPT</span>`;
              if (action.cmd.startsWith('ros2 launch')) {
                  baseHtml = `<span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span>`;
              } else if (action.cmd.includes('python3 -m http.server') || action.cmd.includes('http_robot_control_ui_p8081')) {
                  baseHtml = `<span class="badge badge-server" style="margin-right: 6px;"><i class="fa-solid fa-server" style="margin-right: 4px;"></i>SERVER</span>`;
              }
              
              let cmdName = action.title || action.cmd.split(' ').slice(0, 3).join(' ');
              
              const cardLayout = document.createElement('div');
              cardLayout.className = 'modal-card-layout';
              cardLayout.style.cssText = 'display: flex; width: 100%; justify-content: space-between; align-items: stretch; gap: 20px; flex: 1; min-width: 0;';
              
              const leftCol = document.createElement('div');
              leftCol.className = 'modal-card-left-col';
              leftCol.style.cssText = 'display: flex; flex-direction: column; gap: 0; flex: 1 1 0%; min-width: 0; overflow: visible;';
              
              const titleDiv = document.createElement('div');
              titleDiv.style.cssText = 'display: flex; align-items: center; gap: 8px; height: 32px; min-height: 32px; flex-wrap: nowrap; min-width: 0; width: 100%; overflow: visible;';
              titleDiv.innerHTML = `${baseHtml}<span style="color: var(--c-launch); font-weight: 600; font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex-shrink: 1;">${cmdName}</span> <span style="color: #64748b; font-size: 10.5px; margin-left: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 2; min-width: 0;">(Auto-Added)</span>`;
              leftCol.appendChild(titleDiv);
              
              const isLaunchCard2 = action.cmd.startsWith('ros2 launch');
              const middleCol = document.createElement('div');
              middleCol.className = 'modal-card-middle-col has-divider-v';
              
              const spacer = document.createElement('div');
              spacer.className = 'modal-params-header';
              spacer.style.cssText = 'height: 32px; min-height: 32px; flex-shrink: 0; display: flex; align-items: center; gap: 6px;';
              spacer.innerHTML = `<i class="fa-solid fa-sliders" style="font-size:10px; color:var(--accent);"></i> <span>PARAMETERS &amp; ARGS</span>`;
              middleCol.appendChild(spacer);
              
              const argsDiv = createArgsDiv(action);
              argsDiv.style.marginTop = '20px';
              middleCol.appendChild(argsDiv);
              
              const badgeContainer = document.createElement('div');
              badgeContainer.style.cssText = 'display: flex; align-items: center; gap: 6px; margin-left: auto; flex-shrink: 0;';
              
              if (action.cmd.startsWith('ros2 run')) {
                  const ros2Badge2 = document.createElement('div');
                  ros2Badge2.innerHTML = `<i class="fa-solid fa-robot"></i> ROS 2`;
                  ros2Badge2.style.cssText = 'background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.35); border-radius:5px; padding:2px 6px; font-size:9.5px; color:#93c5fd; font-weight:bold; letter-spacing:0.5px; display:flex; align-items:center; gap:4px; flex-shrink:0;';
                  badgeContainer.appendChild(ros2Badge2);
              }
              if (action.cmd.includes('python3')) {
                  const pythonBadge2 = document.createElement('div');
                  pythonBadge2.innerHTML = `<i class="fa-brands fa-python"></i> Python3`;
                  pythonBadge2.style.cssText = 'background:rgba(234,179,8,0.15); border:1px solid rgba(234,179,8,0.35); border-radius:5px; padding:2px 6px; font-size:9.5px; color:#fde047; font-weight:bold; letter-spacing:0.5px; display:flex; align-items:center; gap:4px; flex-shrink:0;';
                  badgeContainer.appendChild(pythonBadge2);
              }
              if (action.cmd.includes('google-chrome') || action.cmd.includes('chromium-browser')) {
                  const chromeBadge2 = document.createElement('div');
                  chromeBadge2.innerHTML = `<i class="fa-brands fa-chrome"></i> +CHROME`;
                  chromeBadge2.style.cssText = 'background:rgba(66,133,244,0.15); border:1px solid rgba(66,133,244,0.35); border-radius:5px; padding:2px 6px; font-size:9.5px; color:#4285F4; font-weight:bold; letter-spacing:0.5px; display:flex; align-items:center; gap:4px; flex-shrink:0;';
                  badgeContainer.appendChild(chromeBadge2);
              }
              
              const cmdBadge1 = createCmdBadge(action.cmd);
              badgeContainer.appendChild(cmdBadge1);
              
              titleDiv.appendChild(badgeContainer);
              
              const isChecked2 = action ? !!action.active : (activeSet ? (activeSet.has(li.dataset.cmd) || (action && action.baseCmd && activeSet.has(action.baseCmd))) : true);
              if (action) action.active = isChecked2;

              const mainCb = document.createElement('input');
              mainCb.type = 'checkbox';
              mainCb.className = 'main-action-cb';
              mainCb.checked = isChecked2;

              cardLayout.appendChild(leftCol);
              cardLayout.appendChild(middleCol);

                const iconMetas2 = getActionIconMeta(action, action.cmd);
                const isDual2 = iconMetas2.length > 1;
                if (isDual2) hasAnyDual = true;

                const iconCol2 = document.createElement('div');
                iconCol2.className = 'modal-card-icon-col' + (isDual2 ? ' is-vr-dual is-multiple-icons' : '') + (iconMetas2.length === 0 ? ' is-empty-spacer' : '');

                iconMetas2.forEach(meta => {
                    const iconBadge2 = document.createElement('div');
                    iconBadge2.className = 'modal-card-icon-badge';
                    iconBadge2.title = meta.label;

                    const img2 = document.createElement('img');
                    img2.src = meta.path;
                    img2.className = 'modal-card-side-img';
                    img2.alt = meta.label;

                    iconBadge2.appendChild(img2);
                    iconCol2.appendChild(iconBadge2);
                });

                const cbContainer = document.createElement('div');
                cbContainer.className = 'modal-cb-wrap';
                cbContainer.appendChild(mainCb);

                const liInnerWrapper = document.createElement('div');
                liInnerWrapper.style.cssText = 'display: flex; align-items: stretch; width: 100%; gap: 14px;';
                liInnerWrapper.appendChild(cbContainer);
                liInnerWrapper.appendChild(iconCol2);
                liInnerWrapper.appendChild(cardLayout);

                const cardDiv = document.createElement('div');
                cardDiv.className = 'modal-action-card ' + (isChecked2 ? 'card-active' : 'card-inactive');
                cardDiv.appendChild(liInnerWrapper);

                const hasBodyContent2 = action && action.args && action.args.length > 0;
                if (hasBodyContent2) {
                    const hrLine2 = document.createElement('div');
                    hrLine2.className = 'modal-card-divider-h';
                    hrLine2.style.position = 'absolute';
                    hrLine2.style.top = '52px';
                    hrLine2.style.left = '142px';
                    hrLine2.style.width = 'calc(100% - 158px)';
                    hrLine2.style.height = '1px';
                    hrLine2.style.background = 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.22) 15%, rgba(255, 255, 255, 0.22) 85%, transparent 100%)';
                    hrLine2.style.pointerEvents = 'none';
                    cardDiv.appendChild(hrLine2);
                }

                // Chevron nur, wenn es auch etwas einzuklappen gibt
                if (hasBodyContent2) {
                    attachCardCollapse(cardDiv, spacer,
                        (action && (action.cmd || action.baseCmd)) || li.dataset.cmd,
                        [argsDiv]);
                }

                li.className = 'modal-card-row ' + (isChecked2 ? 'row-active' : 'row-inactive');
                li.innerHTML = '';
                li.appendChild(cardDiv);

               mainCb.onclick = (e) => e.stopPropagation();
               mainCb.onchange = (e) => {
                   action.active = e.target.checked;
                   cardDiv.classList.toggle('card-active', e.target.checked);
                   cardDiv.classList.toggle('card-inactive', !e.target.checked);
                   li.classList.toggle('row-active', e.target.checked);
                   li.classList.toggle('row-inactive', !e.target.checked);
                   if (action && (action.cmd.includes("fake_linear_axis") || action.cmd.includes("linear_axis"))) {
                       syncLinearAxisState(e.target.checked);
                   }
                   updateModalStats();
                   if (!e.simulated) saveActiveState();
               };
               
               li.onclick = (e) => {
                   if (e.target === mainCb || e.target.closest('label') || e.target.closest('a') || e.target.closest('.modal-cmd-btn') || e.target.closest('button')) return;
                   mainCb.checked = !mainCb.checked;
                   mainCb.dispatchEvent(new Event('change'));
               };

               topUl.appendChild(li);
           });

          if (hasAnyDual) {
              topUl.classList.add('has-dual-icons');
          }
       } else {
           const action = actionsData[0];
           const iconMetas = getActionIconMeta(action, action ? action.cmd : '');
           const isDual = iconMetas.length > 1;

               contentClone.className = 'modal-card-row row-active' + (isDual ? ' has-dual-icons' : '');
            contentClone.style.cssText = 'width: 100%; max-width: 1200px; margin: 0 auto; display: flex; align-items: center; gap: 0; padding: 10px;';

            const iconCol = document.createElement('div');
            iconCol.className = 'modal-card-icon-col' + (isDual ? ' is-vr-dual is-multiple-icons' : '') + (iconMetas.length === 0 ? ' is-empty-spacer' : '');

            iconMetas.forEach(meta => {
                const iconBadge = document.createElement('div');
                iconBadge.className = 'modal-card-icon-badge';
                iconBadge.title = meta.label;
                const img = document.createElement('img');
                img.src = meta.path;
                img.className = 'modal-card-side-img';
                img.alt = meta.label;
                iconBadge.appendChild(img);
                iconCol.appendChild(iconBadge);
            });

            const cardDiv = document.createElement('div');
            cardDiv.className = 'modal-action-card card-active';
            cardDiv.style.cssText = 'flex: 1; min-width: 0; display: flex; flex-direction: row; align-items: stretch; gap: 14px; padding: 18px 24px;';

            cardDiv.appendChild(iconCol);

            const innerCol = document.createElement('div');
            innerCol.style.cssText = 'flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 14px;';

            let singleArgsDiv = null;
            let singleHeader = null;
            if (action) {
                parseArgs(action);
                const argsDiv = createArgsDiv(action);
                if (action.args.length > 0) {
                    // Kopfzeile nur anlegen, wenn es auch etwas einzuklappen gibt
                    singleHeader = document.createElement('div');
                    singleHeader.className = 'modal-params-header';
                    singleHeader.innerHTML = `<i class="fa-solid fa-sliders" style="font-size:10px; color:var(--accent);"></i> <span>PARAMETERS &amp; ARGS</span>`;
                    innerCol.appendChild(singleHeader);

                    argsDiv.style.marginTop = '10px';
                    argsDiv.style.justifyContent = 'flex-start';
                    innerCol.appendChild(argsDiv);
                    singleArgsDiv = argsDiv;
                }
            }
            cardDiv.appendChild(innerCol);

            if (singleHeader && singleArgsDiv) {
                attachCardCollapse(cardDiv, singleHeader,
                    (action && (action.cmd || action.baseCmd)) || effPopupId,
                    [singleArgsDiv]);
            }
            contentClone.appendChild(cardDiv);
       }
       
       let headerIconClass = 'fa-solid fa-rocket';
       let cleanTitleText = titleHTML;
       const iconMatch = titleHTML.match(/<i\s+class="([^"]+)"[^>]*><\/i>/i);
       if (iconMatch) {
           headerIconClass = iconMatch[1];
           cleanTitleText = titleHTML.replace(/<i\s+class="[^"]+"[^>]*><\/i>/i, '').trim();
       }

       const modalHtml = `
          <div id="launch-modal">
             <div id="launch-modal-window">
                <div id="launch-modal-header">
                   <div class="modal-header-left">
                      <div class="modal-header-icon">
                         <i class="${headerIconClass}"></i>
                      </div>
                      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                         <h2 class="modal-header-title">${cleanTitleText}</h2>
                         <span class="modal-header-tag">Sequence Config</span>
                      </div>
                   </div>
                   
                   <div class="modal-header-right">
                      <label class="modal-select-all-btn" id="modal-select-all-lbl" title="Alle Aktionen aktivieren/deaktivieren">
                         <input type="checkbox" id="modal-select-all-cb">
                         <span id="modal-select-all-text">Alle auswählen</span>
                      </label>
                      <button class="modal-close-btn" id="modal-close-btn" title="Schließen (ESC)">
                         <i class="fa-solid fa-xmark"></i>
                      </button>
                   </div>

                   <div class="modal-dds-bar">
                      <label class="modal-select-all-btn modal-localhost-btn" id="modal-localhost-lbl" title="ROS_LOCALHOST_ONLY=1: DDS-Verkehr bleibt auf diesem Rechner und flutet nicht das LAN. Andere Rechner sehen die ROS-2-Topics dann nicht mehr (Quest 3 WebXR ist nicht betroffen).">
                         <input type="checkbox" id="modal-localhost-cb" ${localhostOnly ? 'checked' : ''}>
                         <span>Nur localhost (DDS)</span>
                      </label>
                      <span class="dds-chip" title="ROS_DOMAIN_ID: nur Nodes mit derselben ID sehen sich"><i class="fa-solid fa-hashtag"></i><span class="dds-chip-key">Domain</span><span class="dds-chip-val" id="dds-chip-domain">–</span></span>
                      <span class="dds-chip" title="RMW_IMPLEMENTATION: verwendete DDS-Middleware"><i class="fa-solid fa-diagram-project"></i><span class="dds-chip-key">RMW</span><span class="dds-chip-val" id="dds-chip-rmw">–</span></span>
                      <span class="dds-chip" id="dds-chip-scope-wrap" title="Wohin der DDS-Verkehr der gestarteten Nodes geht"><i class="fa-solid fa-tower-broadcast"></i><span class="dds-chip-key">Scope</span><span class="dds-chip-val" id="dds-chip-scope">–</span></span>
                      <span class="dds-chip" title="Netzwerk-Interface der Default-Route und IP dieses Rechners"><i class="fa-solid fa-ethernet"></i><span class="dds-chip-val" id="dds-chip-net">–</span></span>
                      <span class="dds-chip" id="dds-chip-traffic-wrap" title="Aktueller Netzwerkverkehr auf dem LAN-Interface (Senden / Empfangen). Dauerhaft hohes TX bei wenig RX deutet auf DDS-Flut ins LAN hin."><i class="fa-solid fa-arrow-right-arrow-left"></i><span class="dds-chip-val" id="dds-chip-traffic">–</span></span>
                   </div>
                </div>
                
                <div id="launch-modal-body"></div>
                
                <div id="launch-modal-footer">
                   <div class="modal-footer-status">
                      <div class="status-pulsing-dot"></div>
                      <span id="modal-footer-stats-text">Bereit zur Ausführung</span>
                   </div>
                   
                   <div class="modal-footer-actions">
                      <button class="modal-cancel-btn" id="modal-cancel-btn">Abbrechen</button>
                      <button id="launch-modal-start-btn">
                         <i class="fa-solid fa-play"></i> EXECUTE
                      </button>
                   </div>
                </div>
             </div>
          </div>
       `;
       
       document.body.insertAdjacentHTML('beforeend', modalHtml);
       const modalBodyEl = document.getElementById('launch-modal-body');
       if (modalBodyEl) {
           modalBodyEl.appendChild(contentClone);
           modalBodyEl.addEventListener('scroll', hideGlobalCmdTooltip, { passive: true });
       }
       
       let ddsStatusTimer = null;
       let ddsLastSample = null;
       let ddsStatus = null;

       const fmtRate = (bps) => {
           if (bps >= 1e6) return (bps / 1e6).toFixed(1) + ' MB/s';
           if (bps >= 1e3) return (bps / 1e3).toFixed(0) + ' kB/s';
           return Math.round(bps) + ' B/s';
       };

       const renderDdsScope = () => {
           const el = document.getElementById('dds-chip-scope');
           const wrap = document.getElementById('dds-chip-scope-wrap');
           if (!el || !wrap) return;
           const uri = ddsStatus && ddsStatus.cyclonedds_uri;
           let text, cls;
           if (localhostOnly) { text = 'nur localhost'; cls = 'ok'; }
           else if (uri) { text = 'LAN · ' + uri.split('/').pop(); cls = 'info'; }
           else { text = 'LAN · Multicast'; cls = 'warn'; }
           el.textContent = text;
           wrap.dataset.state = cls;
       };

       const refreshDdsStatus = async () => {
           try {
               const res = await fetch('/api/status');
               const st = await res.json();
               ddsStatus = st;
               const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
               set('dds-chip-domain', st.ros_domain_id || '–');
               set('dds-chip-rmw', (st.rmw_implementation || '–').replace(/^rmw_/, '').replace(/_cpp$/, ''));
               set('dds-chip-net', st.net_iface ? `${st.net_iface} · ${st.net_ip || 'keine IP'}` : 'kein Netz');
               renderDdsScope();

               const trafficWrap = document.getElementById('dds-chip-traffic-wrap');
               if (st.tx_bytes != null && ddsLastSample && st.ts > ddsLastSample.ts) {
                   const dt = st.ts - ddsLastSample.ts;
                   const tx = (st.tx_bytes - ddsLastSample.tx) / dt;
                   const rx = (st.rx_bytes - ddsLastSample.rx) / dt;
                   set('dds-chip-traffic', `↑ ${fmtRate(tx)}  ↓ ${fmtRate(rx)}`);
                   // > 5 MB/s Senden bei deutlich weniger Empfang: typisches DDS-Flut-Muster
                   if (trafficWrap) trafficWrap.dataset.state = (tx > 5e6 && tx > rx * 5) ? 'warn' : 'ok';
               } else if (st.tx_bytes == null) {
                   set('dds-chip-traffic', 'n/a');
               } else {
                   set('dds-chip-traffic', 'misst …');
               }
               if (st.tx_bytes != null) ddsLastSample = { ts: st.ts, tx: st.tx_bytes, rx: st.rx_bytes };
           } catch (e) {
               const el = document.getElementById('dds-chip-traffic');
               if (el) el.textContent = 'Backend offline';
           }
       };

       const closeModal = () => {
           if (ddsStatusTimer) { clearInterval(ddsStatusTimer); ddsStatusTimer = null; }
           saveActiveState();
           hideGlobalCmdTooltip();
           const m = document.getElementById('launch-modal');
           if (m) m.remove();
           document.removeEventListener('keydown', handleEsc);
       };

       const handleEsc = (e) => {
           if (e.key === 'Escape') closeModal();
       };
       document.addEventListener('keydown', handleEsc);

       const closeBtn = document.getElementById('modal-close-btn');
       if (closeBtn) closeBtn.onclick = closeModal;

       const cancelBtn = document.getElementById('modal-cancel-btn');
       if (cancelBtn) cancelBtn.onclick = closeModal;

       const modalRoot = document.getElementById('launch-modal');
       if (modalRoot) {
           modalRoot.addEventListener('click', (e) => {
               if (e.target === modalRoot) closeModal();
           });
       }

       const headerLocalhostCb = document.getElementById('modal-localhost-cb');
       if (headerLocalhostCb) {
           headerLocalhostCb.onchange = (e) => {
               localhostOnly = e.target.checked;
               renderDdsScope();
               saveActiveState();
           };
       }
       renderDdsScope();
       refreshDdsStatus();
       ddsStatusTimer = setInterval(refreshDdsStatus, 2000);

       const topUlElement = contentClone.querySelector('ul');
       const headerSelectAllCb = document.getElementById('modal-select-all-cb');
       if (headerSelectAllCb && topUlElement) {
           headerSelectAllCb.onchange = (e) => {
               const targetChecked = e.target.checked;
               Array.from(topUlElement.querySelectorAll('.main-action-cb')).forEach(cb => {
                   if (cb.checked !== targetChecked) {
                       cb.checked = targetChecked;
                       const ev = new Event('change');
                       ev.simulated = true;
                       cb.dispatchEvent(ev);
                   }
               });
               updateModalStats();
               saveActiveState();
           };
       }

       updateModalStats();
       
       // Initial visual sync for camera-dependent vision nodes, static objects, and linear axis
        const visionAct = actionsData.find(a => (a.baseCmd && a.baseCmd.includes('robot_vision_cameras_bringup')) || (a.cmd && a.cmd.includes('robot_vision_cameras_bringup')));
        const initialIsIpCam = visionAct && visionAct.args ? visionAct.args.some(a => a.text === 'camera:=ip_cam' && a.checked) : false;
        const servoAct = actionsData.find(a => (a.baseCmd && a.baseCmd.includes('lite6_moveit_servo')) || (a.cmd && a.cmd.includes('lite6_moveit_servo')));
        const initialIsStaticObjects = servoAct && servoAct.args ? servoAct.args.some(a => (a.text === 'static_objects:=true' || a.text === 'static_onjects:=true') && a.checked) : true;
        const initialIsLinearAxis = servoAct && servoAct.args ? servoAct.args.some(a => a.text.includes('linear_axis') && a.checked) : (servoAct ? (servoAct.cmd.includes('linear_axis') || (servoAct.baseCmd && servoAct.baseCmd.includes('linear_axis'))) : false);
        const currentModalBody = document.getElementById('launch-modal-body') || contentClone;
        updateVisionTreeNodes(currentModalBody, initialIsIpCam);
        updateStaticObjectsTreeNodes(currentModalBody, initialIsStaticObjects);
        updateLinearAxisTreeNodes(currentModalBody, initialIsLinearAxis);
        
        requestAnimationFrame(() => {
            const mBody = document.getElementById('launch-modal-body') || contentClone;
            alignModalArgs(mBody);
            updateVisionTreeNodes(mBody, initialIsIpCam);
            updateStaticObjectsTreeNodes(mBody, initialIsStaticObjects);
            updateLinearAxisTreeNodes(mBody, initialIsLinearAxis);
            setTimeout(() => {
                const mb = document.getElementById('launch-modal-body') || contentClone;
                alignModalArgs(mb);
                updateVisionTreeNodes(mb, initialIsIpCam);
                updateStaticObjectsTreeNodes(mb, initialIsStaticObjects);
                updateLinearAxisTreeNodes(mb, initialIsLinearAxis);
            }, 100);
            setTimeout(() => {
                const mb = document.getElementById('launch-modal-body') || contentClone;
                alignModalArgs(mb);
                updateVisionTreeNodes(mb, initialIsIpCam);
                updateStaticObjectsTreeNodes(mb, initialIsStaticObjects);
                updateLinearAxisTreeNodes(mb, initialIsLinearAxis);
            }, 300);
        });
       
       if (popupId) {
           const actualTopUl = contentClone.querySelector('ul');
           if (actualTopUl) {
               new Sortable(actualTopUl, {
                   animation: 200,
                   ghostClass: 'sortable-ghost',
                   onEnd: async function (evt) {
                       const newOrder = Array.from(actualTopUl.children).filter(el => el.tagName === 'LI').map(li => li.dataset.cmd).filter(c => c);
                       if (!window.TABS) window.TABS = {};
                       if (!window.TABS['__popups']) window.TABS['__popups'] = {};
                       window.TABS['__popups'][popupId] = newOrder;
                       
                       try {
                           const res = await fetch('/api/config', {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify(window.TABS)
                           });
                           const data = await res.json();
                           if (data.ok) showToast('✓ Layout gespeichert');
                           else showToast('✗ Speichern fehlgeschlagen', true);
                       } catch (err) {
                           showToast('✗ Speichern fehlgeschlagen', true);
                       }
                       if (window.renderTab && typeof window.currentTab !== 'undefined') {
                           window.renderTab(window.currentTab);
                       }
                   }
               });
           }
       }
       
       const startBtn = document.getElementById('launch-modal-start-btn');
       startBtn.addEventListener('click', async () => {
          saveActiveState();
          closeModal();
          if (toastMsg) showToast(toastMsg);

          const linearAxisNode = actionsData.find(a => a.cmd && a.cmd.includes('fake_linear_axis'));
          const isLinearAxisNodeActive = linearAxisNode ? linearAxisNode.active : true;
          
          for (const action of actionsData) {
              if (!action.active) continue;
              
              // Reconstruct command based on checked args
              let finalCmd = action.baseCmd;
              if (action.args.length > 0) {
                  const activeArgs = action.args.filter(a => a.checked).map(a => a.text);
                  // rviz ist standardmaessig an - ein fehlendes Argument wuerde
                  // RViz also trotzdem starten. Deshalb explizit abschalten.
                  if (action.args.some(a => a.text === 'rviz:=true' && !a.checked)) {
                      activeArgs.push('rviz:=false');
                  }
                  // Whisper CPU: ohne explizites false bliebe der Launch-Standard (GPU).
                  if (action.args.some(a => a.text === WHISPER_GPU_ARG && !a.checked)) {
                      activeArgs.push('use_gpu:=false');
                  }
                  if (activeArgs.length > 0) {
                      finalCmd += ' ' + activeArgs.join(' ');
                  }
              }
              if (action.postCmd) {
                  finalCmd += action.postCmd;
              }

              // Dynamically compute terminal window title based on linear axis active state
              let finalTitle = action.title || 'Launch';
              const hasLinearAxisArgChecked = action.args && action.args.some(a => a.text.includes('linear_axis') && a.checked);
              const cmdHasLinearAxis = finalCmd.includes('linear_axis');
              const isLinearAxisEnabled = isLinearAxisNodeActive && (cmdHasLinearAxis || hasLinearAxisArgChecked);

              if (!isLinearAxisEnabled) {
                  finalTitle = finalTitle.replace(/\s*\+\s*Linear\s*Axis/gi, '')
                                         .replace(/\s*\(\s*\+\s*Linear\s*Axis\s*\)/gi, '')
                                         .replace(/\s*-\s*Linear\s*Axis/gi, '')
                                         .trim();
                  if (!isLinearAxisNodeActive && finalCmd.includes('attach_to:=linear_axis_link')) {
                      finalCmd = finalCmd.replace(/\s*attach_to:=linear_axis_link/g, '').trim();
                  }
              } else {
                  if ((finalTitle.toLowerCase().includes('servo') || finalTitle.toLowerCase().includes('movegroup')) && !finalTitle.toLowerCase().includes('linear axis')) {
                      finalTitle += ' + Linear Axis';
                  }
              }
              
              try {
                await fetch('/api/run', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ command: finalCmd, title: finalTitle, mode: "ros", localhost_only: localhostOnly })
                });
                await new Promise(resolve => setTimeout(resolve, 1000));
              } catch (e) {
                console.error("Failed to start:", finalCmd);
              }
          }
       });
    }

    // ─── GLOBAL EXPORTS (required for inline onclick="..." attributes) ──────────────
    window.openLaunchModalFromCard = openLaunchModalFromCard;
    window.openLaunchModal = openLaunchModal;
    window.copyCmd = copyCmd;
    window.showToast = showToast;
    window.toggleConsole = toggleConsole;
    window.checkStatus = checkStatus;

    // ─── CLICK SOUND ──────────────────────────────────────────────────────────────
    function playClickSound() {
        const sound = new Audio('ui_mouse_click.mp3');
        sound.volume = 0.5;
        sound.play().catch(err => console.warn('Audio play failed:', err));
    }

    document.addEventListener('click', function(e) {
      const isClickable = e.target.closest('button') || 
                          e.target.closest('.action-card') || 
                          e.target.closest('.tab-btn') || 
                          e.target.closest('.footer-btn') || 
                          e.target.closest('a') || 
                          e.target.closest('#console-toggle-icon') ||
                          e.target.closest('div[onclick]') ||
                          e.target.closest('label') ||
                          e.target.closest('li'); // for popup action cards
      
      // Checkboxes have their own change listener, but if we clicked a label or other clickable
      if (isClickable && e.target.type !== 'checkbox') {
        playClickSound();
      }
    });

    document.addEventListener('change', function(e) {
      if (e.target.type === 'checkbox' || e.target.type === 'radio') {
        playClickSound();
      }
    });

