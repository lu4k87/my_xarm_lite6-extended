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
        return { cls: 'chip-kind-remap', title: 'ROS 2 remapping (--ros-args -r): renames node/topic' };
      }
      if (/(^|\s)-p(\s|$)/.test(t)) {
        return { cls: 'chip-kind-param', title: 'ROS 2 node parameter (--ros-args -p)' };
      }

      const m = t.match(/^([A-Za-z_][A-Za-z0-9_]*):=/);
      if (!m) return { cls: '', title: '' };
      const name = m[1];

      if (!launchKey) {
        // Kein "ros2 launch" - z.B. "ros2 run" oder ein Shell-Kommando.
        return { cls: '', title: 'Argument (no ros2 launch command, not checked)' };
      }
      const map = window.NEXUS_LAUNCH_ARGS;
      if (!map) return { cls: '', title: '' };   // noch nicht geladen

      const declared = map[launchKey];
      if (!declared) {
        return { cls: 'chip-kind-unknown', title: `Launch file "${launchKey}" not found` };
      }
      if (declared.indexOf(name) !== -1) {
        return { cls: 'chip-kind-launch', title: `Launch argument of ${launchKey}` };
      }
      return { cls: 'chip-kind-dead', title: `"${name}" is not declared by ${launchKey}, no effect` };
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




    // ── Segment-Control fuer "genau 1 aus N" ─────────────────────────────
    // Einheitliche Auswahl fuer CPU/GPU und kurze Auswahllisten. Verhaelt
    // sich nach aussen wie ein <select>: .value, .disabled und ein
    // blubberndes "change"-Event, damit Befehlsanzeige und Refresher mitziehen.
    const PARAM_SEGMENT_MAX = 5;

    function buildParamSegment(options) {
        const seg = document.createElement('div');
        seg.className = 'param-segment';
        seg.setAttribute('role', 'radiogroup');
        let current = null;
        let disabled = false;

        const paint = () => {
            seg.querySelectorAll('.param-seg-opt').forEach(b => {
                const on = b.dataset.value === current;
                b.classList.toggle('is-active', on);
                b.setAttribute('aria-checked', String(on));
                b.disabled = disabled;
            });
        };

        const addOption = (opt) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'param-seg-opt';
            b.setAttribute('role', 'radio');
            b.dataset.value = opt.value;
            b.innerHTML = opt.html || escHtml(opt.value);
            if (opt.title) b.title = opt.title;
            b.onclick = (e) => {
                e.stopPropagation();
                if (disabled || current === opt.value) return;
                current = opt.value;
                paint();
                seg.dispatchEvent(new Event('change', { bubbles: true }));
            };
            seg.appendChild(b);
        };
        options.forEach(addOption);

        Object.defineProperty(seg, 'value', {
            get: () => current,
            set: (v) => { current = v == null ? null : String(v); paint(); }
        });
        Object.defineProperty(seg, 'disabled', {
            get: () => disabled,
            set: (v) => { disabled = !!v; seg.classList.toggle('is-disabled', disabled); paint(); }
        });
        // Wert aus YAML/Launch, der nicht in der Liste steht, trotzdem anzeigen
        seg._ensureOption = (v) => {
            if (v && !seg.querySelector(`.param-seg-opt[data-value="${CSS.escape(v)}"]`)) addOption({ value: v });
        };
        return seg;
    }

    // ── Whisper CPU/GPU-Umschalter (Voice Command Listener) ─────────────────
    const WHISPER_GPU_ARG = 'use_gpu:=true';

    function isWhisperLaunch(baseCmd) {
        return /voice_listener\.launch\.py|whisper_bringup\s+bringup\.launch\.py/.test(baseCmd || '');
    }

    function buildWhisperDeviceToggle(argObj, onChange) {
        const row = document.createElement('div');
        row.className = 'param-value param-device-row';
        row.title = 'Whisper inference on CPU or GPU (CUDA): use_gpu:=false / true';
        row.onclick = (e) => e.stopPropagation();

        const label = document.createElement('span');
        label.className = 'param-value-label';
        label.textContent = 'Whisper';

        const seg = buildParamSegment([
            { value: 'cpu', html: '<i class="fa-solid fa-microchip"></i>CPU', title: 'use_gpu:=false' },
            { value: 'gpu', html: '<i class="fa-solid fa-bolt"></i>GPU', title: 'use_gpu:=true' }
        ]);
        seg.setAttribute('aria-label', 'Whisper device');
        seg.value = argObj.checked ? 'gpu' : 'cpu';
        seg.addEventListener('change', () => {
            argObj.checked = seg.value === 'gpu';
            if (typeof onChange === 'function') onChange();
        });

        row.append(label, seg);
        return row;
    }

    // ── Eyetracker Gaze Control: Real World <-> UI Gaze ─────────────────────
    // Eine Karte, zwei Nodes. Die Chips "gaze_mode:=..." sind keine echten
    // Argumente: beim Start ersetzen sie den Befehl durch den gewaehlten Node.
    const GAZE_REAL_CMD = 'ros2 run gaze_grasp_routine_tobii_glasses gaze_grasp_routine_tobii_glasses';
    const GAZE_MODES = {
        'gaze_mode:=real_world': { cmd: GAZE_REAL_CMD, title: 'Eyetracker - Gaze Control (Real World)' },
        'gaze_mode:=ui_gaze': { cmd: 'ros2 run gaze_control_ui_tobii_glasses gaze_ui', title: 'Eyetracker - Gaze Control (UI Gaze)' }
    };

    function isGazeModeCard(baseCmd) {
        return (baseCmd || '').trim() === GAZE_REAL_CMD;
    }

    // Gewaehlter Modus einer Aktion (oder null, wenn die Karte keinen hat)
    function getGazeMode(action) {
        const arg = action && action.args && action.args.find(a => a.kind === 'gaze-mode' && a.checked);
        return arg ? GAZE_MODES[arg.text] : null;
    }

    // Befehl so, wie der Start-Button ihn ausfuehrt (Basis + aktive Args + Rest)
    function buildFinalCmd(action) {
        let finalCmd = action.baseCmd || action.cmd || '';
        // Eyetracker: der Gaze-Modus bestimmt den Node, nicht ein Argument
        const gazeMode = getGazeMode(action);
        if (gazeMode) finalCmd = gazeMode.cmd;
        if (action.args && action.args.length > 0) {
            const activeArgs = action.args.filter(a => a.checked && a.kind !== 'gaze-mode' && a.kind !== 'value').map(a => a.text);
            // Wert-Felder: nur Abweichungen vom Standard; Node-Parameter ("ros2 run")
            // gehen gesammelt hinter --ros-args
            const nodeParams = [];
            action.args.filter(a => a.kind === 'value').forEach(a => {
                const txt = valueArgCmdText(action, a);
                if (txt) (a.def.source === 'node' ? nodeParams : activeArgs).push(txt);
            });
            // rviz ist standardmaessig an - ein fehlendes Argument wuerde
            // RViz also trotzdem starten. Deshalb explizit abschalten.
            if (action.args.some(a => a.text === 'rviz:=true' && !a.checked)) {
                activeArgs.push('rviz:=false');
            }
            // Whisper CPU: ohne explizites false bliebe der Launch-Standard (GPU).
            if (action.args.some(a => a.text === WHISPER_GPU_ARG && !a.checked)) {
                activeArgs.push('use_gpu:=false');
            }
            // --ros-args muss als letztes kommen
            if (nodeParams.length > 0) {
                activeArgs.push('--ros-args ' + nodeParams.map(p => '-p ' + p).join(' '));
            }
            if (activeArgs.length > 0) {
                finalCmd += ' ' + activeArgs.join(' ');
            }
        }
        if (action.postCmd) {
            finalCmd += action.postCmd;
        }
        return finalCmd;
    }

    // Befehl + Terminal-Titel fuer den Start einer Aktion (EXECUTE im
    // Sequenz-Popup und Klick auf eine Karte der Multimodal-Uebersicht)
    function resolveLaunch(action, isLinearAxisNodeActive) {
        let finalCmd = buildFinalCmd(action);
        const gazeMode = getGazeMode(action);

        // Terminal-Titel je nach Linear-Axis-Zustand
        let finalTitle = (gazeMode && gazeMode.title) || action.title || 'Launch';
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
        } else if ((finalTitle.toLowerCase().includes('servo') || finalTitle.toLowerCase().includes('movegroup')) && !finalTitle.toLowerCase().includes('linear axis')) {
            finalTitle += ' + Linear Axis';
        }
        return { cmd: finalCmd, title: finalTitle };
    }

    // Verkettete Befehle (&, &&, ;) in Einzelbefehle zerlegen - eine Zeile je Befehl
    function splitCmdLines(cmd) {
        return String(cmd || '').split(/\s*(?:&&|;|&(?!&))\s*/).map(c => c.trim()).filter(Boolean);
    }

    // Befehl-Bloecke im Sequenz-Popup: bei jeder Parameter-Aenderung neu
    // zeichnen (auch gekoppelte Karten, z.B. Kamera-Sync, aendern sich mit).
    const seqCmdRefreshers = new Set();
    document.addEventListener('change', (e) => {
        if (!e.target.closest('#launch-modal-body')) return;
        requestAnimationFrame(() => {
            seqCmdRefreshers.forEach(fn => {
                if (!fn.el.isConnected) { seqCmdRefreshers.delete(fn); return; }
                fn();
            });
        });
    });

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
                <span><i class="fa-solid fa-terminal" style="color:#38bdf8; margin-right:5px;"></i>Command</span>
                <span class="cmd-tip-hint"><i class="fa-regular fa-copy"></i> Click to copy</span>
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

        // cmdText darf eine Funktion sein, wenn sich der Befehl mit den Parametern aendert
        const resolveCmd = () => (typeof cmdText === 'function' ? cmdText() : cmdText);
        btn.onmouseenter = () => showGlobalCmdTooltip(btn, resolveCmd());
        btn.onmouseleave = () => hideGlobalCmdTooltip();

        btn.onclick = (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(resolveCmd()).then(() => {
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.className = 'fa-solid fa-check';
                    icon.style.color = '#10b981';
                }
                showToast('✓ Command copied to clipboard');
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

    // Belegte Ports je Action Card und wofuer sie verwendet werden
    const ACTION_PORTS = [
        {
            match: /http_robot_control_ui/,
            ports: [
                { port: 8081, icon: 'fa-solid fa-display', use: 'Robot Control UI' },
                { port: 9090, icon: 'fa-solid fa-right-left', use: 'ROS Bridge WebSocket (UI \u2194 ROS 2)' },
                { port: 8082, icon: 'fa-solid fa-video', use: 'Web Video Server (camera)' }
            ]
        },
        {
            match: /vr_quest3_teleop/,
            ports: [
                { port: 9091, icon: 'fa-solid fa-right-left', use: 'ROS Bridge WebSocket (SSL)' },
                { port: 8443, icon: 'fa-solid fa-vr-cardboard', use: 'HTTPS / WebXR (Quest 3)' }
            ]
        }
    ];

    function getActionPorts(cmd) {
        const entry = ACTION_PORTS.find(e => e.match.test(cmd || ''));
        return entry ? entry.ports : [];
    }

    // Kartentitel aufteilen: "(Port …)" faellt weg (die Ports stehen als Chips
    // darunter), eine Komma-Liste am Ende wird zu Tags, restliche Klammern am
    // Ende werden als gedaempfter Zusatz dargestellt.
    function splitSeqTitle(text) {
        let main = String(text || '').replace(/\s*\(\s*Ports?\b[^()]*\)/gi, '').trim();
        let tags = [];
        const list = main.match(/^(.+?)\s*\(([^()]*,[^()]*)\)\s*$/);
        if (list) {
            main = list[1].trim();
            tags = list[2].split(',').map(s => s.trim()).filter(Boolean);
        }
        let sub = '';
        const tail = main.match(/^(.+?)\s*((?:[|·]?\s*\([^()]*\)\s*)+)$/);
        if (tail) {
            main = tail[1].trim();
            sub = tail[2].trim();
        }
        return { main, sub, tags };
    }

    // "(Real)" / "(Fake)" wird als "(REAL)" / "(FAKE)" in der Farbe des
    // FAKE|REAL-Umschalters hervorgehoben, der restliche Text bleibt Text.
    function appendSeqTitleText(parent, str) {
        str.split(/(\((?:Real|Fake)\))/i).forEach(seg => {
            if (!seg) return;
            const m = seg.match(/^\((Real|Fake)\)$/i);
            if (m) {
                const tag = document.createElement('span');
                tag.className = 'seq-title-mode is-' + m[1].toLowerCase();
                tag.textContent = '(' + m[1].toUpperCase() + ')';
                parent.appendChild(tag);
            } else {
                parent.appendChild(document.createTextNode(seg));
            }
        });
    }

    function renderSeqTitle(titleEl, text) {
        const parts = splitSeqTitle(text);
        titleEl.textContent = '';
        appendSeqTitleText(titleEl, parts.main);
        if (parts.sub) {
            const sub = document.createElement('span');
            sub.className = 'seq-card-title-sub';
            appendSeqTitleText(sub, ' ' + parts.sub);
            titleEl.appendChild(sub);
        }
        titleEl.title = text;
        return parts;
    }

    function getActionIconMeta(action, fallbackCmd) {
        const rawCmd = (action && (action.baseCmd || action.cmd)) ? (action.baseCmd || action.cmd) : (fallbackCmd || '');
        const firstCmd = rawCmd.split(/(?:&&|&|;)/)[0].trim().toLowerCase();
        const title = ((action && (action.title || action.label)) || '').toLowerCase();
        const type = ((action && action.type) || '').toLowerCase();
        const combined = (firstCmd + ' ' + title + ' ' + type + ' ' + rawCmd.toLowerCase());

        // 0. Ausdrücklich KEINE Icons für Helper/Tuner/Overlay/Streamer-Nodes (web_video_server ausgenommen!)
        if (!/web_video_server/.test(combined) && (/fake_linear_axis|yolo_3d_bbox_for_ip_cam|rviz_marker_3d_scene_objects|servo_status_overlay|rviz_servo_status|rviz_overlay_servo_status|window_x11_streamer/.test(firstCmd) ||
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
                { path: '_imgs/icons/icon_zed_m.svg?v=6', label: 'ZED-M stereo camera' },
                { path: '_imgs/icons/icon_object_detection.svg?v=7', label: 'YOLO 3D Object Detection' }
            ];
        }

        // ZED-M Stereo-Kamera Launcher (ohne YOLO)
        if (/zed_camera|zed_wrapper|zed m camera/.test(combined) || (firstCmd.includes('zed') && !firstCmd.includes('gaze'))) {
            return [{ path: '_imgs/icons/icon_zed_m.svg?v=6', label: 'ZED-M stereo camera' }];
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
                { path: '_imgs/icons/icon_rviz.svg', label: 'RViz 3D visualization' },
                { path: '_imgs/icons/icon_gamepad.svg?v=6', label: 'Gamepad robot control' }
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
            return [{ path: '_imgs/icons/icon_rviz.svg', label: 'RViz 3D visualization' }];
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
            return [{ path: '_imgs/icons/icon_voice.svg?v=6', label: 'Voice control & audio' }];
        }
        // 4. Gaze / Tobii Eye Tracking (mit oder ohne YOLO)
        if (/gaze|tobii|glasses/.test(combined)) {
            if (/yolo/.test(combined)) {
                return [
                    { path: '_imgs/icons/icon_gaze.svg?v=6', label: 'Eye tracking (Tobii Gaze)' },
                    { path: '_imgs/icons/icon_object_detection.svg?v=7', label: 'YOLO 3D Object Detection' }
                ];
            }
            return [{ path: '_imgs/icons/icon_gaze.svg?v=6', label: 'Eye tracking (Tobii Gaze)' }];
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
            return [{ path: '_imgs/icons/icon_gamepad.svg?v=6', label: 'Gamepad & robot control' }];
        }
        // Robot Control UI + WebSocket Server + Web Video Server (kombinierte Action Card, startet alle drei)
        if (/http_robot_control_ui/.test(combined) || ((/robot_control|8081/.test(combined)) && (/websocket|rosbridge|9090/.test(combined)))) {
            return [
                { path: '_imgs/icons/icon_robot_control_ui.svg?v=6', label: 'Robot Control UI' },
                { path: '_imgs/icons/icon_analog_stick.svg?v=4', label: 'Analog stick (virtual joystick)' },
                { path: '_imgs/icons/icon_websocket.svg?v=6', label: 'ROS WebSocket' },
                { path: '_imgs/icons/icon_server.svg?v=6', label: 'Web Video Server (Port 8082)' }
            ];
        }
        // 8. Web-UI / Dashboard / Overlays / Streams / OBS
        if (/robot_control|dashboard|rqt|overlay|streamer|obs|8080|8081|ui_node/.test(combined)) {
            return [{ path: '_imgs/icons/icon_robot_control_ui.svg?v=6', label: 'Web UI & visualization' }];
        }
        // 9. ROS WebSocket / ROS Bridge / Backend
        if (/rosbridge|websocket|analyzer|vision|pointcloud|aruco|server|kill|pkill/.test(combined)) {
            return [{ path: '_imgs/icons/icon_websocket.svg?v=6', label: 'ROS WebSocket' }];
        }

        if (firstCmd.startsWith('ros2 launch')) {
            return [{ path: '_imgs/icons/icon_websocket.svg?v=6', label: 'ROS WebSocket Launch' }];
        }
        return [{ path: '_imgs/icons/icon_robot_control_ui.svg?v=6', label: 'Component' }];
    }

    // ─── SEQUENZ-POPUP: Kategorien & Parameter-Gruppen ──────────────────────────
    // Dieselben Bereiche (Farbe + Icon) wie in der Multimodal-Uebersicht
    // (buildUserAppOverviewHtml), damit beide Popups eine Sprache sprechen.
    // VR und Speech sind im Sequenz-Popup zusaetzlich eigene Sections.
    const SEQ_CATEGORIES = {
        robot:  { key: 'robot',  label: 'Robot + Motion Planning + Teleop (Gamepad)', icon: 'fa-solid fa-robot',         color: '#38bdf8' },
        teleop: { key: 'teleop', label: 'Eyetracker - Gaze Control', icon: 'fa-solid fa-eye', color: '#c084fc' },
        vr:     { key: 'vr',     label: 'VR Teleop (Quest 3)',            icon: 'fa-solid fa-vr-cardboard',  color: '#f472b6' },
        speech: { key: 'speech', label: 'Speech Control',                 icon: 'fa-solid fa-microphone-lines', color: '#2dd4bf' },
        vision: { key: 'vision', label: '3D Vision & Perception',         icon: 'fa-solid fa-camera',        color: '#4ade80' },
        infra:  { key: 'infra',  label: 'UI (Web Interface)',             icon: 'fa-solid fa-network-wired', color: '#f59e0b' },
        system: { key: 'system', label: 'System & Tools',                 icon: 'fa-solid fa-terminal',      color: '#94a3b8' }
    };

    function getSeqCategory(action, fallbackCmd) {
        const cmd = ((action && (action.baseCmd || action.cmd)) || fallbackCmd || '').toLowerCase();
        const title = ((action && action.title) || '').toLowerCase();
        const s = cmd + ' ' + title;
        // VR und Sprachsteuerung bekommen je eine eigene Section
        if (/vr_quest|quest/.test(s)) return SEQ_CATEGORIES.vr;
        if (/voice|whisper|speech/.test(s)) return SEQ_CATEGORIES.speech;
        if (/gaze|tobii/.test(s)) return SEQ_CATEGORIES.teleop;
        // Gamepad gehoert zu "Robot + Motion Planning + Teleop (Gamepad)"
        if (/joy_node|\bjoy\b|gamepad/.test(s)) return SEQ_CATEGORIES.robot;
        if (/robot_vision|zed|yolo|camera|aruco|pointcloud/.test(s)) return SEQ_CATEGORIES.vision;
        if (/web_video_server|http_robot_control_ui|rosbridge|websocket|overlay|streamer|rviz_servo_status|http\.server|dashboard/.test(s)) return SEQ_CATEGORIES.infra;
        if (/lite6|xarm|moveit|move_group|movegroup|servo|collision|rviz_marker|linear_axis|rviz2/.test(s)) return SEQ_CATEGORIES.robot;
        return SEQ_CATEGORIES.system;
    }

    // Ordnet einen Parameter-Chip einer Gruppe zu. "exclusive" = genau/max. eine
    // Option aktiv (die Logik dafuer steckt in den onchange-Handlern der Chips).
    function getArgGroup(argObj) {
        const t = String((argObj && argObj.text) || '');
        if (argObj && argObj.kind === 'value') {
            const g = VALUE_GROUPS[argObj.def.group] || { label: 'Values', icon: 'fa-solid fa-sliders' };
            return { key: 'val_' + argObj.def.group, label: g.label, icon: g.icon };
        }
        if (argObj && argObj.kind === 'gpu-toggle') return { key: 'device', label: 'Inference', icon: 'fa-solid fa-microchip' };
        if (argObj && argObj.kind === 'gaze-mode') return { key: 'gaze', label: 'Gaze Mode', icon: 'fa-solid fa-eye', exclusive: 'exactly 1' };
        if (t.startsWith('robot_ip:='))  return { key: 'ip', label: 'Robot Connection', icon: 'fa-solid fa-ethernet' };
        if (t.startsWith('camera:='))    return { key: 'camera', label: 'Camera', icon: 'fa-solid fa-camera', exclusive: 'exactly 1' };
        if (t.startsWith('yolo_model:=')) return { key: 'yolo', label: 'YOLO Model', icon: 'fa-solid fa-brain', exclusive: 'max. 1' };
        if (t === 'add_vacuum_gripper:=true' || t === 'add_gripper:=true') return { key: 'gripper', label: 'Gripper', icon: 'fa-solid fa-hand', exclusive: 'exactly 1' };
        if (t.startsWith('report_type:=')) return { key: 'report', label: 'Report-Level', icon: 'fa-solid fa-file-lines', exclusive: 'exactly 1' };
        if (/(^|\s)-[rp](\s|$)/.test(t) || t.startsWith('--')) return { key: 'rosargs', label: 'ROS-Args', icon: 'fa-solid fa-gears' };
        return { key: 'options', label: 'Options', icon: 'fa-solid fa-toggle-on' };
    }

    // "genau 1 aus N"-Gruppen erscheinen als Segment-Control. Die Chips bleiben
    // Checkbox-Labels (die Sync-Funktionen arbeiten auf ihnen), nur ein Klick
    // auf das bereits aktive Segment wird ignoriert.
    function markSegmentGroup(chipsEl, group) {
        if (group.exclusive !== 'exactly 1') return;
        chipsEl.classList.add('is-segment');
        chipsEl.setAttribute('role', 'radiogroup');
        chipsEl.setAttribute('aria-label', group.label);
        chipsEl.addEventListener('click', (e) => {
            const lbl = e.target.closest('label.param-chip');
            if (!lbl || e.target.tagName === 'INPUT') return;
            const cb = lbl.querySelector('input[type="checkbox"]');
            if (cb && cb.checked) e.preventDefault();
        }, true);   // Capture: die Chips stoppen das Bubbling selbst
    }

    // ─── WERT-PARAMETER (Eingabefeld statt Chip) ────────────────────────────────
    // Launch-Argumente, Config-Werte (YAML) und Node-Parameter, die sich vor dem
    // Start einstellen lassen. Hier steht nur die Darstellung (Label, Typ,
    // Bereich). Standardwert und Herkunft kommen aus /api/launch_details, damit
    // Launch-Datei bzw. YAML die Quelle der Werte bleiben. Angehaengt wird ein
    // Wert nur, wenn er vom Standard abweicht; value === null heisst "Standard".
    window.NEXUS_LAUNCH_DETAILS = null;

    function loadLaunchDetails() {
        return fetch('/api/launch_details')
            .then(r => r.json())
            .then(d => {
                if (!d || !d.ok) return;
                window.NEXUS_LAUNCH_DETAILS = d.launch || {};
                // Schon gebaute Wert-Zeilen zeigen jetzt die echten Standardwerte
                document.querySelectorAll('[data-value-param]').forEach(r => { if (r._update) r._update(); });
            })
            .catch(() => { /* ohne Backend gelten die Defaults unten */ });
    }
    loadLaunchDetails();

    const ZED_ONLY = { arg: 'camera', equals: 'zed_m' };
    const GAZE_REAL_ONLY = { arg: 'gaze_mode', equals: 'real_world' };
    // "info" = kurze Beschreibung (Englisch) fuer den Hover-Tooltip der Zeile
    const WHISPER_VALUE_PARAMS = [
        { name: 'model_name', label: 'Model', type: 'choice', choices: ['tiny', 'base', 'small', 'medium'], group: 'whisper',
          info: 'Whisper model size. Larger models transcribe more accurately but take longer per phrase. Missing models are downloaded at start.' },
        { name: 'language', label: 'Language', type: 'choice', choices: ['auto', 'de', 'en'], group: 'whisper',
          info: 'Spoken language for speech recognition. "auto" detects it per phrase (slightly slower and less reliable).' },
        { name: 'device_index', label: 'Device index', type: 'int', min: -1, max: 64, step: 1, group: 'mic',
          info: 'Audio input device used as microphone. -1 = system default input.' }
    ];
    const VALUE_PARAMS = {
        'xarm_moveit_servo/lite6_moveit_servo_realmove.launch.py': [
            { name: 'robot_ip', label: 'Robot IP', type: 'ip', group: 'ip',
              info: 'IP address of the xArm Lite 6 control box the driver connects to.' }
        ],
        'robot_vision_cameras_bringup/robot_vision_cameras_bringup.launch.py': [
            { name: 'camera_model', label: 'Model', type: 'choice', choices: ['zedm', 'zed2', 'zed2i', 'zedx', 'zedxm'], group: 'zed', when: ZED_ONLY,
              info: 'Connected ZED camera model. Selects the matching camera profile of the ZED wrapper - must match the hardware.' },
            { name: 'confidence_threshold', label: 'Confidence', type: 'float', min: 0.05, max: 0.95, step: 0.05, group: 'detect', when: ZED_ONLY,
              info: 'Minimum YOLO confidence. Detections below it are discarded - higher = fewer false detections, but objects may be missed.' },
            { name: 'ema_alpha', label: 'EMA smoothing', type: 'float', min: 0.05, max: 1, step: 0.05, group: 'detect', when: ZED_ONLY,
              info: 'Smoothing of the 3D bounding boxes over time. Lower = steadier boxes but slower to follow movement, 1 = no smoothing.' },
            { name: 'safe_z_hover_height', label: 'Hover height', unit: 'm', type: 'float', min: 0.02, max: 0.4, step: 0.01, group: 'grasp',
              info: 'Height above the object the gripper moves to before descending and returns to after grasping.' },
            { name: 'grasp_z_offset', label: 'Offset Z', unit: 'm', type: 'float', min: -0.05, max: 0.1, step: 0.005, group: 'grasp',
              info: 'Extra height above the object top at the grasp point. Increase if the gripper pushes into the object, decrease if it misses it.' },
            { name: 'velocity_scaling', label: 'Velocity', type: 'float', min: 0.01, max: 1, step: 0.05, group: 'grasp',
              info: 'MoveIt velocity factor for the grasp motion (1 = full joint speed).' },
            { name: 'acceleration_scaling', label: 'Accel.', type: 'float', min: 0.01, max: 1, step: 0.05, group: 'grasp',
              info: 'MoveIt acceleration factor for the grasp motion (1 = full acceleration). Lower = smoother starts and stops.' },
            { name: 'tf_x', label: 'X', unit: 'm', type: 'float', min: -2, max: 2, step: 0.005, group: 'tf', when: ZED_ONLY,
              info: 'Camera X position relative to link_base. Shifts where detected objects end up in the robot frame.' },
            { name: 'tf_y', label: 'Y', unit: 'm', type: 'float', min: -2, max: 2, step: 0.005, group: 'tf', when: ZED_ONLY,
              info: 'Camera Y position relative to link_base. Shifts where detected objects end up in the robot frame.' },
            { name: 'tf_z', label: 'Z', unit: 'm', type: 'float', min: -2, max: 2, step: 0.005, group: 'tf', when: ZED_ONLY,
              info: 'Camera height relative to link_base. Wrong values make grasps too high or too low.' },
            { name: 'tf_roll', label: 'Roll', unit: 'rad', type: 'float', min: -3.1416, max: 3.1416, step: 0.01, group: 'tf', when: ZED_ONLY,
              info: 'Camera rotation around its viewing axis relative to link_base.' },
            { name: 'tf_pitch', label: 'Pitch', unit: 'rad', type: 'float', min: -3.1416, max: 3.1416, step: 0.01, group: 'tf', when: ZED_ONLY,
              info: 'Camera tilt relative to link_base (positive = looking down). Small errors shift objects noticeably with distance.' },
            { name: 'tf_yaw', label: 'Yaw', unit: 'rad', type: 'float', min: -3.1416, max: 3.1416, step: 0.01, group: 'tf', when: ZED_ONLY,
              info: 'Camera heading relative to link_base (3.14159 = facing the robot).' }
        ],
        'voice_command_listener/voice_listener.launch.py': WHISPER_VALUE_PARAMS,
        'whisper_bringup/bringup.launch.py': WHISPER_VALUE_PARAMS,
        'http_robot_control_ui_p8081/http_robot_control_ui.launch.py': [
            { name: 'start_video_server', label: 'Video server + window capture', type: 'bool', group: 'video',
              info: 'Starts the video server and window capture for camera / RViz streams on port 8082. Off saves CPU, but the Robot Control UI shows no video.' }
        ],
        // "ros2 run": Node-Parameter, angehaengt als --ros-args -p name:=wert
        [GAZE_REAL_CMD]: [
            { name: 'dwell_threshold', label: 'Dwell time', unit: 's', type: 'float', min: 0.3, max: 5, step: 0.1, def: '2.0',
              source: 'node', group: 'gazeparam', when: GAZE_REAL_ONLY,
              info: 'How long the gaze must rest on an object before the grasp is triggered. Lower = faster, but more accidental grasps.' },
            { name: 'tobii_ip', label: 'Tobii IP', type: 'ip', def: '192.168.100.2', source: 'node', group: 'gazeparam', when: GAZE_REAL_ONLY,
              info: 'IP address of the Tobii eye-tracking glasses.' }
        ]
    };

    const VALUE_GROUPS = {
        ip:        { label: 'Robot Connection',   icon: 'fa-solid fa-ethernet' },
        zed:       { label: 'ZED Camera',         icon: 'fa-solid fa-camera' },
        detect:    { label: 'Detection (YOLO)',   icon: 'fa-solid fa-crosshairs' },
        grasp:     { label: 'Grasp Motion',       icon: 'fa-solid fa-hand-holding' },
        tf:        { label: 'Camera Pose (TF)',   icon: 'fa-solid fa-up-down-left-right' },
        whisper:   { label: 'Whisper',            icon: 'fa-solid fa-language' },
        mic:       { label: 'Microphone',         icon: 'fa-solid fa-microphone' },
        video:     { label: 'Video-Streaming',    icon: 'fa-solid fa-video' },
        gazeparam: { label: 'Gaze Routine',       icon: 'fa-solid fa-stopwatch' }
    };

    const PARAM_SRC_BADGES = {
        config: { text: 'CONFIG', icon: 'fa-solid fa-file-code' },
        launch: { text: 'ARG',    icon: 'fa-solid fa-rocket' },
        node:   { text: 'PARAM',  icon: 'fa-solid fa-circle-nodes' }
    };

    function valueParamDefs(action) {
        const base = String((action && (action.baseCmd || action.cmd)) || '').trim();
        return VALUE_PARAMS[launchKeyOf(base)] || VALUE_PARAMS[base] || [];
    }

    function launchDetailsOf(action) {
        const map = window.NEXUS_LAUNCH_DETAILS;
        const key = launchKeyOf((action && (action.baseCmd || action.cmd)) || '');
        return (map && key && map[key]) || null;
    }

    function formatParamValue(def, v) {
        if (v === null || v === undefined) return '';
        if (typeof v === 'boolean') return v ? 'true' : 'false';
        let s = String(v).trim();
        if (def.type === 'bool') s = s.toLowerCase();
        // ROS liest "2" als int - ein double-Parameter braucht "2.0"
        if (def.type === 'float' && /^-?\d+$/.test(s)) s += '.0';
        return s;
    }

    // Eingabe pruefen, null = ungueltig. Der Wert landet in einer Shell,
    // deshalb nur Zahlen, IPs und feste Auswahlwerte.
    function parseParamInput(def, raw) {
        const s = String(raw == null ? '' : raw).trim();
        if (def.type === 'choice') return def.choices.includes(s) ? s : null;
        if (def.type === 'bool') return (s === 'true' || s === 'false') ? s : null;
        if (def.type === 'ip') {
            return /^\d{1,3}(\.\d{1,3}){3}$/.test(s) && s.split('.').every(n => Number(n) <= 255) ? s : null;
        }
        if (def.type === 'int' || def.type === 'float') {
            const re = def.type === 'int' ? /^-?\d+$/ : /^-?(\d+\.?\d*|\.\d+)$/;
            if (!re.test(s)) return null;
            const n = Number(s);
            if ((def.min !== undefined && n < def.min) || (def.max !== undefined && n > def.max)) return null;
            return formatParamValue(def, s);
        }
        return /^[A-Za-z0-9._\/-]+$/.test(s) ? s : null;
    }

    // Aktueller Wert eines Arguments dieser Aktion (Wert-Feld, GPU-Schalter,
    // aktiver Chip, sonst Launch-Default) - fuer "when"-Bedingungen.
    function actionArgValue(action, name) {
        const args = (action && action.args) || [];
        const valArg = args.find(a => a.kind === 'value' && a.name === name);
        if (valArg) return effectiveParamValue(action, valArg);
        const gpu = args.find(a => a.kind === 'gpu-toggle' && a.text.startsWith(name + ':='));
        if (gpu) return gpu.checked ? 'true' : 'false';
        const chip = args.find(a => a.checked && a.kind !== 'value' && a.text.startsWith(name + ':='));
        if (chip) return chip.text.slice(name.length + 2);
        const d = launchDetailsOf(action);
        const info = d && d.args && d.args[name];
        return info && info.default !== undefined ? String(info.default) : '';
    }

    // Standardwert + Herkunft: YAML-Wert (CONFIG), sonst Default des Launch-
    // Arguments (ARG), sonst der hinterlegte Node-Default (PARAM). Von mehreren
    // passenden YAMLs gewinnt die zuletzt geladene (z.B. Whisper CPU-Profil).
    function paramDefaultInfo(action, def) {
        const d = launchDetailsOf(action);
        const configs = (d && d.configs) || [];
        const findHit = (respectWhen) => {
            let hit = null;
            configs.forEach(cfg => {
                if (respectWhen && cfg.when &&
                    actionArgValue(action, cfg.when.arg).toLowerCase() !== String(cfg.when.equals).toLowerCase()) return;
                (cfg.values || []).forEach(v => { if (v.arg === def.name) hit = { cfg, v }; });
            });
            return hit;
        };
        const hit = findHit(true) || findHit(false);
        if (hit) {
            return { value: formatParamValue(def, hit.v.value), source: 'config',
                     file: hit.cfg.file, pkg: hit.cfg.pkg, key: hit.v.key, desc: '' };
        }
        const info = d && d.args && d.args[def.name];
        if (info && info.default) {
            return { value: formatParamValue(def, info.default), source: def.source || 'launch', desc: info.description || '' };
        }
        return { value: formatParamValue(def, def.def), source: def.source || 'launch', desc: '' };
    }

    function effectiveParamValue(action, argObj) {
        return argObj.value !== null ? argObj.value : paramDefaultInfo(action, argObj.def).value;
    }

    function paramWhenOk(action, def) {
        return !def.when || actionArgValue(action, def.when.arg) === def.when.equals;
    }

    // "name:=wert" fuer den Start oder null (Standard / Bedingung nicht erfuellt)
    function valueArgCmdText(action, argObj) {
        if (argObj.value === null || !paramWhenOk(action, argObj.def)) return null;
        if (argObj.value === paramDefaultInfo(action, argObj.def).value) return null;
        return `${argObj.name}:=${argObj.value}`;
    }

    // Speicherformat: Chips als "text": bool, Wert-Felder als "val:name": wert|null
    function storeArgState(target, argObj) {
        if (argObj.kind === 'value') target['val:' + argObj.name] = argObj.value;
        else target[argObj.text] = !!argObj.checked;
    }

    // Hover-Tooltip der Wert-Zeilen: fixed am body wie der CMD-Tooltip, damit
    // er nicht von Karte oder Popup abgeschnitten wird.
    let paramTipEl = null;
    let paramTipRow = null;

    function escHtml(v) {
        return String(v == null ? '' : v)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function showParamTip(row) {
        const t = row._tip;
        if (!t || !row.isConnected) return hideParamTip();
        if (!paramTipEl) {
            paramTipEl = document.createElement('div');
            paramTipEl.className = 'param-floating-tooltip';
            document.body.appendChild(paramTipEl);
        }
        paramTipRow = row;
        const unit = t.unit ? ` ${escHtml(t.unit)}` : '';
        paramTipEl.innerHTML = `
            <div class="ptip-head">
                <span class="ptip-name">${escHtml(t.name)}</span>
                <span class="ptip-src">${escHtml(t.source)}</span>
            </div>
            ${t.info ? `<div class="ptip-info">${escHtml(t.info)}</div>` : ''}
            <div class="ptip-meta">
                <span>Value</span><code>${escHtml(t.value || '(empty)')}${unit}</code>
                <span>Default</span><code>${escHtml(t.def)}${unit}</code>
                <span>Source</span><code>${escHtml(t.origin)}</code>
            </div>
            <div class="ptip-state ${t.stateCls}">${escHtml(t.state)}</div>`;

        paramTipEl.style.left = '-9999px';
        paramTipEl.style.top = '-9999px';
        paramTipEl.classList.add('visible');
        const rect = row.getBoundingClientRect();
        const tipRect = paramTipEl.getBoundingClientRect();
        let left = rect.left + rect.width / 2 - tipRect.width / 2;
        left = Math.max(12, Math.min(left, window.innerWidth - tipRect.width - 12));
        let top = rect.bottom + 8;
        if (top + tipRect.height > window.innerHeight - 12) top = Math.max(12, rect.top - tipRect.height - 8);
        paramTipEl.style.left = Math.round(left) + 'px';
        paramTipEl.style.top = Math.round(top) + 'px';
    }

    function hideParamTip() {
        paramTipRow = null;
        if (paramTipEl) paramTipEl.classList.remove('visible');
    }
    // Beim Scrollen wuerde der Tooltip an der alten Stelle stehen bleiben
    window.addEventListener('scroll', hideParamTip, true);

    // Herkunfts-Badge einer Wert-Zeile bzw. eines Bool-Chips setzen
    function paintParamSrcBadge(badge, info) {
        const src = PARAM_SRC_BADGES[info.source] || PARAM_SRC_BADGES.launch;
        badge.className = 'param-src-badge src-' + info.source;
        badge.innerHTML = `<i class="${src.icon}"></i>${src.text}`;
        // Launch-Argumente sind der Normalfall - nur CONFIG/PARAM markieren
        badge.style.display = info.source === 'launch' ? 'none' : '';
        return src;
    }

    // Inhalt des Hover-Tooltips (showParamTip) fuer Wert-Zeilen und Bool-Chips
    function valueParamTip(def, info, src, shown, whenOk, modified) {
        return {
            name: def.name,
            info: def.info || info.desc || '',
            source: src.text,
            origin: info.source === 'config' ? `${info.pkg}/${info.file} → ${info.key}`
                : info.source === 'node' ? 'Node parameter (--ros-args -p)' : 'Launch argument',
            value: shown,
            def: info.value || '(empty)',
            unit: def.unit || '',
            state: !whenOk ? `Only used with ${def.when.arg}:=${def.when.equals}`
                : modified ? 'Changed – appended to the start command' : 'Default – not appended',
            stateCls: !whenOk ? 'off' : modified ? 'mod' : ''
        };
    }

    // An/Aus-Wert als Checkbox-Chip wie die Flag-Chips. Angehaengt wird er wie
    // jeder Wert-Parameter nur, wenn er vom Standard abweicht.
    function buildBoolParamChip(action, argObj, onChange) {
        const def = argObj.def;
        const chip = document.createElement('label');
        chip.className = 'param-chip param-bool-chip';
        chip.dataset.argText = argObj.text;
        chip.dataset.valueParam = '1';
        chip.onclick = (e) => e.stopPropagation();

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.onclick = (e) => e.stopPropagation();
        const badge = document.createElement('span');
        const txt = document.createElement('span');
        txt.className = 'param-bool-label';
        txt.textContent = def.label;
        chip.append(cb, badge, txt);

        const update = () => {
            const info = paramDefaultInfo(action, def);
            const whenOk = paramWhenOk(action, def);
            const shown = argObj.value !== null ? argObj.value : info.value;
            const on = shown === 'true';
            const modified = argObj.value !== null && argObj.value !== info.value;
            argObj.checked = modified && whenOk;
            cb.checked = on;
            cb.disabled = !whenOk;
            chip.classList.toggle('chip-inactive', !on);
            chip.classList.toggle('is-modified', modified);
            chip.classList.toggle('is-off', !whenOk);
            const src = paintParamSrcBadge(badge, info);
            chip._tip = valueParamTip(def, info, src, shown, whenOk, modified);
            if (paramTipRow === chip) showParamTip(chip);
        };

        chip.addEventListener('mouseenter', () => showParamTip(chip));
        chip.addEventListener('mouseleave', hideParamTip);
        // "change" blubbert weiter und aktualisiert die Befehlsanzeige
        cb.addEventListener('change', () => {
            const v = cb.checked ? 'true' : 'false';
            argObj.value = (v === paramDefaultInfo(action, def).value) ? null : v;
            update();
            onChange();
        });

        chip._update = update;
        update();
        return chip;
    }

    // Eine Zeile: Herkunfts-Badge · Label · Eingabe · Einheit · Zuruecksetzen
    function buildValueParamRow(action, argObj, onChange) {
        const def = argObj.def;
        if (def.type === 'bool') return buildBoolParamChip(action, argObj, onChange);
        const row = document.createElement('div');
        row.className = 'param-value';
        row.dataset.argText = argObj.text;
        row.dataset.valueParam = '1';
        row.onclick = (e) => e.stopPropagation();

        const badge = document.createElement('span');
        badge.className = 'param-src-badge';

        const label = document.createElement('span');
        label.className = 'param-value-label';
        label.textContent = def.label;

        // Kurze Auswahllisten als Segment, lange als Dropdown
        let input;
        if (def.type === 'choice' && def.choices.length <= PARAM_SEGMENT_MAX) {
            input = buildParamSegment(def.choices.map(c => ({ value: c })));
        } else if (def.type === 'choice') {
            input = document.createElement('select');
            def.choices.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                input.appendChild(opt);
            });
        } else {
            input = document.createElement('input');
            input.type = (def.type === 'int' || def.type === 'float') ? 'number' : 'text';
            if (def.min !== undefined) input.min = def.min;
            if (def.max !== undefined) input.max = def.max;
            if (def.step !== undefined) input.step = def.step;
            input.spellcheck = false;
            input.autocomplete = 'off';
        }
        if (!input._ensureOption) input.className = 'param-value-input param-value-' + def.type;
        input.setAttribute('aria-label', def.label);

        const reset = document.createElement('button');
        reset.type = 'button';
        reset.className = 'param-value-reset';
        reset.innerHTML = '<i class="fa-solid fa-rotate-left"></i>';

        // Einheit immer als (ggf. leere) Spalte, damit die Felder buendig stehen
        const unit = document.createElement('span');
        unit.className = 'param-value-unit';
        unit.textContent = def.unit || '';
        row.append(badge, label, input, unit, reset);

        const update = () => {
            const info = paramDefaultInfo(action, def);
            const whenOk = paramWhenOk(action, def);
            const shown = argObj.value !== null ? argObj.value : info.value;
            if (input._ensureOption) input._ensureOption(shown);
            else if (input.tagName === 'SELECT' && shown && !Array.from(input.options).some(o => o.value === shown)) {
                const opt = document.createElement('option');
                opt.value = shown;
                opt.textContent = shown;
                input.appendChild(opt);
            }
            if (document.activeElement !== input && !row.classList.contains('is-invalid')) input.value = shown;

            const modified = argObj.value !== null && argObj.value !== info.value;
            argObj.checked = modified && whenOk;
            row.classList.toggle('is-modified', modified);
            row.classList.toggle('is-off', !whenOk);
            input.disabled = !whenOk;
            reset.disabled = !modified;

            const src = paintParamSrcBadge(badge, info);
            row.dataset.src = info.source;

            reset.title = `Reset to ${info.value || '(empty)'}`;
            row._tip = valueParamTip(def, info, src, shown, whenOk, modified);
            if (paramTipRow === row) showParamTip(row);
        };

        row.addEventListener('mouseenter', () => showParamTip(row));
        row.addEventListener('mouseleave', hideParamTip);

        input.addEventListener('input', () => {
            row.classList.toggle('is-invalid', parseParamInput(def, input.value) === null);
        });
        input.addEventListener('keydown', (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') input.blur();
        });
        // "change" blubbert weiter und aktualisiert die Befehlsanzeige
        input.addEventListener('change', () => {
            const v = parseParamInput(def, input.value);
            row.classList.toggle('is-invalid', v === null);
            if (v === null) return;
            argObj.value = (v === paramDefaultInfo(action, def).value) ? null : v;
            update();
            onChange();
        });
        reset.onclick = (e) => {
            e.stopPropagation();
            argObj.value = null;
            row.classList.remove('is-invalid');
            update();
            onChange();
            row.dispatchEvent(new Event('change', { bubbles: true }));
        };

        row._update = update;
        update();
        return row;
    }

    // Wert-Zeilen eines Containers neu bewerten (Bedingungen, Defaults), z.B.
    // nach Kamera- oder CPU/GPU-Wechsel.
    // Der Handler des ausloesenden Chips laeuft vor dem Bubbling, der neue
    // Zustand steht hier also schon fest.
    function watchValueParamRows(container) {
        container.addEventListener('change', () => {
            container.querySelectorAll('[data-value-param]').forEach(r => { if (r._update) r._update(); });
        });
    }

    // ─── CONFIG-DATEIEN EINER AKTION ────────────────────────────────────────────
    // Zeigt die YAML-Configs, die eine Launch-Datei laedt (/api/launch_details):
    // wichtige Werte mit Einheit, ob die Datei beim aktuellen Parametersatz
    // ueberhaupt geladen wird, welche Werte ein Launch-Argument bzw. eine
    // spaeter geladene Config ueberschreibt, und ob eine Aenderung an der YAML
    // sofort wirkt (install/ verlinkt auf src/) oder erst nach colcon build.
    // Die Daten werden beim Oeffnen des Popups frisch geholt, damit eine
    // gerade bearbeitete YAML ohne Neuladen der Seite sichtbar ist.
    let launchDetailsFetchedAt = 0;
    let launchDetailsPending = null;
    function refreshLaunchDetails(maxAgeMs) {
        if (Date.now() - launchDetailsFetchedAt < maxAgeMs && window.NEXUS_LAUNCH_DETAILS) return Promise.resolve();
        if (!launchDetailsPending) {
            launchDetailsPending = loadLaunchDetails().then(() => {
                launchDetailsFetchedAt = Date.now();
                launchDetailsPending = null;
            });
        }
        return launchDetailsPending;
    }

    const CFG_STATUS = {
        linked:  { text: 'Live',          cls: 'ok',   title: 'install/ links to src/: YAML edits apply on next start' },
        copy:    { text: 'Copy',          cls: 'info', title: 'install/ holds a copy: run colcon build after edits' },
        stale:   { text: 'Build needed',  cls: 'warn', title: 'install/ holds an outdated copy: run colcon build' },
        missing: { text: 'Not built',     cls: 'warn', title: 'Missing in install/: run colcon build' }
    };

    function formatCfgValue(v) {
        if (v === null || v === undefined) return '—';
        if (typeof v === 'boolean') return v ? 'true' : 'false';
        if (typeof v === 'object') return JSON.stringify(v);
        return String(v) === '' ? '""' : String(v);
    }

    // Gleicher Wert trotz anderer Schreibweise? ("0.35" vs 0.35, "True" vs true)
    function sameCfgValue(a, b) {
        const sa = String(a).trim().toLowerCase(), sb = String(b).trim().toLowerCase();
        if (sa === sb) return true;
        return sa !== '' && sb !== '' && !isNaN(Number(sa)) && Number(sa) === Number(sb);
    }

    // Abgehobene Sektion einer Action Card (Parameter, Launch-Struktur,
    // Befehl, Configs): Kopfleiste mit Titel, optionalem Zaehler und dem
    // Einklapp-Chevron rechts; der Inhalt klappt per grid-template-rows weich
    // ein/aus. Die Klick-Logik haengt die Karte an (Zustand je Karte gespeichert).
    function createSeqBox(kind, icon, title) {
        const pane = document.createElement('div');
        pane.className = `seq-pane seq-pane-box seq-pane-${kind}`;
        const head = document.createElement('div');
        head.className = 'seq-pane-head seq-box-head';
        head.innerHTML = `<i class="fa-solid ${icon}"></i><b class="seq-box-title"></b>`
            + `<span class="seq-pane-count" hidden></span>`
            + `<span class="seq-box-toggle"><i class="fa-solid fa-chevron-up"></i></span>`;
        const titleEl = head.querySelector('.seq-box-title');
        titleEl.innerHTML = title;
        const wrap = document.createElement('div');
        wrap.className = 'seq-box-wrap';
        const inner = document.createElement('div');
        inner.className = 'seq-box-inner';
        wrap.appendChild(inner);
        pane.append(head, wrap);
        return { pane, head, wrap, inner, titleEl, countEl: head.querySelector('.seq-pane-count') };
    }

    function buildConfigPane(action) {
        const box = createSeqBox('config', 'fa-file-code', 'Config Files');
        const pane = box.pane;
        pane._box = box;
        pane.hidden = true;
        const files = document.createElement('div');
        files.className = 'cfg-files';
        box.inner.appendChild(files);

        const render = () => {
            const d = launchDetailsOf(action);
            const configs = (d && d.configs) || [];
            pane.hidden = configs.length === 0;
            if (!configs.length) return;

            const active = configs.map(cfg => !cfg.when ||
                actionArgValue(action, cfg.when.arg).toLowerCase() === String(cfg.when.equals).toLowerCase());
            box.countEl.hidden = false;
            box.countEl.textContent = `${active.filter(Boolean).length}/${configs.length} loaded`;

            // Spaeter geladene aktive Configs ueberschreiben gleiche Schluessel
            const lastActiveIdx = {};
            configs.forEach((cfg, i) => {
                if (active[i]) (cfg.all || []).forEach(e => { lastActiveIdx[e.key] = i; });
            });

            files.innerHTML = '';
            configs.forEach((cfg, i) => {
                const box = document.createElement('div');
                box.className = 'cfg-file' + (active[i] ? '' : ' is-inactive');

                const top = document.createElement('div');
                top.className = 'cfg-file-head';
                const title = document.createElement('span');
                title.className = 'cfg-file-title';
                title.textContent = cfg.title || cfg.file;
                const name = document.createElement('code');
                name.className = 'cfg-file-name';
                name.textContent = cfg.file.split('/').pop();
                name.title = `${cfg.pkg}/${cfg.file}`;
                top.append(title, name);

                const badges = document.createElement('div');
                badges.className = 'cfg-file-badges';
                const st = CFG_STATUS[cfg.status];
                if (st) {
                    const b = document.createElement('span');
                    b.className = 'cfg-badge cfg-badge-' + st.cls;
                    b.textContent = st.text;
                    b.title = st.title;
                    badges.appendChild(b);
                }
                if (cfg.when) {
                    const b = document.createElement('span');
                    b.className = 'cfg-badge ' + (active[i] ? 'cfg-badge-ok' : 'cfg-badge-off');
                    b.textContent = active[i] ? 'loaded' : 'not loaded';
                    b.title = `Only loaded with ${cfg.when.arg}:=${cfg.when.equals}`;
                    badges.appendChild(b);
                }
                if (cfg.path) {
                    const copyBtn = document.createElement('button');
                    copyBtn.type = 'button';
                    copyBtn.className = 'cfg-copy-btn';
                    copyBtn.title = `Copy path: ${cfg.path}`;
                    copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
                    copyBtn.onclick = (e) => { e.stopPropagation(); copyCmd(cfg.path, copyBtn); };
                    badges.appendChild(copyBtn);
                }
                top.appendChild(badges);
                box.appendChild(top);

                if (cfg.error) {
                    const err = document.createElement('div');
                    err.className = 'cfg-error';
                    err.textContent = cfg.error;
                    box.appendChild(err);
                    files.appendChild(box);
                    return;
                }

                const rows = document.createElement('div');
                rows.className = 'cfg-rows';
                (cfg.values || []).forEach(v => {
                    const row = document.createElement('div');
                    row.className = 'cfg-row';
                    const key = document.createElement('span');
                    key.className = 'cfg-key';
                    key.textContent = v.label;
                    const val = document.createElement('span');
                    val.className = 'cfg-val';
                    let text = formatCfgValue(v.value);
                    if (v.hz && Number(v.value) > 0) text += ` s · ${(1 / Number(v.value)).toFixed(1)} Hz`;
                    else if (v.unit === 'rad' && typeof v.value === 'number') text += ` rad · ${Math.round(v.value * 1800 / Math.PI) / 10}°`;
                    else if (v.unit) text += ` ${v.unit}`;
                    const orig = document.createElement('span');
                    orig.className = 'cfg-val-orig';
                    orig.textContent = text;
                    val.appendChild(orig);

                    const tips = [`${cfg.file} → ${v.key}`];
                    // Launch-Argument ueberschreibt den YAML-Wert?
                    if (v.arg && active[i]) {
                        const eff = actionArgValue(action, v.arg);
                        if (eff !== '' && !sameCfgValue(eff, v.value)) {
                            row.classList.add('is-overridden');
                            const ov = document.createElement('span');
                            ov.className = 'cfg-override';
                            ov.textContent = `${eff}${v.unit && !v.hz ? ' ' + v.unit : ''}`;
                            ov.title = `Overridden by ${v.arg}:=${eff}`;
                            val.appendChild(ov);
                            tips.push(`Overridden by ${v.arg}:=${eff}`);
                        } else {
                            tips.push(`Set via ${v.arg}:=`);
                        }
                    }
                    // ... oder eine spaeter geladene Config (z.B. Whisper CPU-Profil)?
                    if (active[i] && lastActiveIdx[v.key] !== undefined && lastActiveIdx[v.key] > i && !row.classList.contains('is-overridden')) {
                        row.classList.add('is-overridden');
                        const later = configs[lastActiveIdx[v.key]];
                        tips.push(`Overridden by ${later.file.split('/').pop()}`);
                        const ov = document.createElement('span');
                        ov.className = 'cfg-override';
                        const laterVal = (later.all || []).find(e => e.key === v.key);
                        ov.textContent = laterVal ? formatCfgValue(laterVal.value) : '?';
                        ov.title = `Overridden by ${later.file.split('/').pop()}`;
                        val.appendChild(ov);
                    }
                    row.title = tips.join('\n');
                    row.append(key, val);
                    rows.appendChild(row);
                });
                box.appendChild(rows);

                // Alle Schluessel der Datei zum Nachschlagen
                if ((cfg.all || []).length > (cfg.values || []).length) {
                    const det = document.createElement('details');
                    det.className = 'cfg-all';
                    det.onclick = (e) => e.stopPropagation();
                    const sum = document.createElement('summary');
                    sum.textContent = `All values (${cfg.all.length})`;
                    det.appendChild(sum);
                    const list = document.createElement('div');
                    list.className = 'cfg-all-list';
                    cfg.all.forEach(e => {
                        const r = document.createElement('div');
                        r.className = 'cfg-all-row';
                        const k = document.createElement('span');
                        k.className = 'cfg-all-key';
                        k.textContent = e.key.replace(/^.*?\.ros__parameters\./, '');
                        k.title = e.key;
                        const vv = document.createElement('span');
                        vv.className = 'cfg-all-val';
                        vv.textContent = formatCfgValue(e.value);
                        if (e.note) { vv.title = e.note; r.classList.add('has-note'); }
                        r.append(k, vv);
                        list.appendChild(r);
                    });
                    det.appendChild(list);
                    box.appendChild(det);
                }
                files.appendChild(box);
            });
        };

        render();
        // Frisch vom Server: YAML kann sich seit dem Laden der Seite geaendert
        // haben. Danach auch die Wert-Zeilen der Karte neu bewerten (Defaults).
        refreshLaunchDetails(3000).then(() => {
            render();
            const card = pane.closest('.seq-card');
            if (card) card.querySelectorAll('[data-value-param]').forEach(r => { if (r._update) r._update(); });
        });
        pane._render = render;
        return pane;
    }

    // ─── PARAMETER EINER AKTION ─────────────────────────────────────────────────
    // Baut action.args (Chips) aus dem Befehl und dem gespeicherten Zustand des
    // Popups auf. Genutzt vom Sequenz-Popup und von den DEV-SETUP-Sections der
    // Multimodal-Uebersicht, damit beide dieselben Parameter/Defaults zeigen.
    function parseActionArgs(action, effPopupId, actionsData) {
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

        // Eyetracker: genau ein Gaze-Modus (Standard: Real World)
        if (isGazeModeCard(action.baseCmd)) {
            action.args = action.args.filter(a => !a.text.startsWith('gaze_mode:='));
            Object.keys(GAZE_MODES).forEach(modeArg => {
                const isChecked = getSavedArgState(effPopupId, action.cmd, action.baseCmd, modeArg, modeArg === 'gaze_mode:=real_world');
                action.args.push({ text: modeArg, checked: !!isChecked, kind: 'gaze-mode' });
            });
            const gazeArgs = action.args.filter(a => a.kind === 'gaze-mode');
            const checkedGaze = gazeArgs.filter(a => a.checked);
            if (checkedGaze.length !== 1) {
                const preferred = checkedGaze[0] || gazeArgs[0];
                gazeArgs.forEach(a => { a.checked = (a === preferred); });
            }
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

        // Wert-Parameter als Eingabefeld; ein fester Chip gleichen Namens aus
        // dem Befehl (z.B. robot_ip:=192.168.1.175) wird dabei ersetzt.
        valueParamDefs(action).forEach(def => {
            const prefix = def.name + ':=';
            const chip = action.args.find(a => a.kind !== 'value' && a.text.startsWith(prefix));
            action.args = action.args.filter(a => a.kind === 'value' || !a.text.startsWith(prefix));
            if (action.args.some(a => a.kind === 'value' && a.name === def.name)) return;

            const saved = getSavedArgState(effPopupId, action.cmd, action.baseCmd, 'val:' + def.name, null);
            let value = (saved === null || saved === undefined || saved === '') ? null : parseParamInput(def, saved);
            if (value === null && chip) value = parseParamInput(def, chip.text.slice(prefix.length));
            const argObj = { kind: 'value', name: def.name, def, text: prefix, value, checked: false };
            // Gleich dem Standard -> "Standard", damit spaetere YAML-Aenderungen greifen
            if (argObj.value !== null && argObj.value === paramDefaultInfo(action, def).value) argObj.value = null;
            argObj.checked = !!valueArgCmdText(action, argObj);
            action.args.push(argObj);
        });
    }

    // Exklusive Gruppen (Kamera, YOLO, Greifer, Report) bereinigen und die
    // Chips sortieren: IP, Kamera, YOLO, Greifer, Report, Rest.
    function normalizeActionArgs(action) {
        if (!action || !action.args || action.args.length === 0) return;
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
    }

    // ─── MULTIMODAL-UEBERSICHT: DEV SETUP FAKE / REAL ───────────────────────────
    // Je eine Section mit den Aktionen aus getDevSetupActions(). Checkbox,
    // Parameter und localhost-Schalter teilen sich den gespeicherten Zustand
    // mit dem DEV-Setup-Popup (popupId dev_fake / dev_real). Klick auf eine
    // Karte startet genau diese Aktion so, wie EXECUTE sie starten wuerde.
    const DEV_SETUP_SECTIONS = {
        dev_fake: { mode: 'fake', title: 'DEV SETUP · FAKE', badge: 'Simulation', icon: 'fa-solid fa-flask', color: '#f0b429' },
        dev_real: { mode: 'real', title: 'DEV SETUP · REAL', badge: 'Hardware', icon: 'fa-solid fa-bolt', color: '#00e5ff' }
    };

    function loadDevSetupActions(popupId) {
        const d = DEV_SETUP_SECTIONS[popupId];
        if (!d || typeof getDevSetupActions !== 'function') return [];
        const actions = getDevSetupActions(d.mode);

        let activeSet = null;
        try {
            const localActive = JSON.parse(localStorage.getItem('ros2_nexus_popups_active') || '{}');
            if (Array.isArray(localActive[popupId])) activeSet = new Set(localActive[popupId]);
        } catch (e) {}
        if (!activeSet && window.TABS && window.TABS['__popups_active'] && Array.isArray(window.TABS['__popups_active'][popupId])) {
            activeSet = new Set(window.TABS['__popups_active'][popupId]);
        }

        actions.forEach(a => {
            a.baseCmd = a.cmd;
            a.args = [];
            a.active = activeSet ? (activeSet.has(a.cmd) || (a.title && activeSet.has(a.title))) : true;
        });
        actions.forEach(a => {
            parseActionArgs(a, popupId, actions);
            normalizeActionArgs(a);
            if (a.active && activeSet && !activeSet.has(a.cmd) && a.baseCmd) a.active = activeSet.has(a.baseCmd) || activeSet.has(a.title);
        });
        return actions;
    }

    function isDevSetupLocalhostOnly(popupId) {
        const env = window.TABS && window.TABS['__popups_env'] && window.TABS['__popups_env'][popupId];
        return !!(env && env.localhost_only);
    }

    // Gleiches Speicherformat wie saveActiveState() im Sequenz-Popup
    function saveDevSetupState(popupId, actions) {
        const activeCmds = [];
        const argsState = {};
        actions.forEach(a => {
            if (a.active) {
                if (a.cmd && !activeCmds.includes(a.cmd)) activeCmds.push(a.cmd);
                if (a.baseCmd && a.baseCmd !== a.cmd && !activeCmds.includes(a.baseCmd)) activeCmds.push(a.baseCmd);
            }
            if (a.args && a.args.length > 0) {
                [a.cmd, a.baseCmd].filter(Boolean).forEach(k => {
                    argsState[k] = argsState[k] || {};
                    a.args.forEach(arg => storeArgState(argsState[k], arg));
                });
            }
        });

        if (!window.TABS) window.TABS = {};
        ['__popups_active', '__popups_args', '__cmd_args'].forEach(k => { if (!window.TABS[k]) window.TABS[k] = {}; });
        window.TABS['__popups_active'][popupId] = activeCmds;
        window.TABS['__popups_args'][popupId] = Object.assign(window.TABS['__popups_args'][popupId] || {}, argsState);
        Object.keys(argsState).forEach(k => {
            window.TABS['__cmd_args'][k] = Object.assign(window.TABS['__cmd_args'][k] || {}, argsState[k]);
        });

        try {
            localStorage.setItem('ros2_nexus_popups_active', JSON.stringify(window.TABS['__popups_active']));
            localStorage.setItem('ros2_nexus_popups_args', JSON.stringify(window.TABS['__popups_args']));
            localStorage.setItem('ros2_nexus_cmd_args', JSON.stringify(window.TABS['__cmd_args']));
        } catch (e) {}

        fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(window.TABS)
        }).catch(err => console.error('Failed to save config to /api/config:', err));
    }

    async function runDevSetupAction(popupId, action) {
        const { cmd, title } = resolveLaunch(action, true);
        try {
            await fetch('/api/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: cmd, title, mode: 'ros', localhost_only: isDevSetupLocalhostOnly(popupId) })
            });
            return true;
        } catch (e) {
            console.error('Failed to start:', cmd);
            return false;
        }
    }

    // Chip umschalten; exklusive Gruppen verhalten sich wie im Sequenz-Popup:
    // "genau 1" mit zwei Optionen schaltet beim Abwaehlen auf die andere,
    // mit mehr Optionen bleibt die gewaehlte aktiv; "max. 1" waehlt die
    // anderen ab.
    function toggleDevSetupArg(action, argObj, checked) {
        const g = getArgGroup(argObj);
        const peers = action.args.filter(a => a !== argObj && getArgGroup(a).key === g.key);
        if (g.exclusive === 'exactly 1') {
            let target = argObj;
            if (!checked) target = peers.length === 1 ? peers[0] : argObj;
            [argObj].concat(peers).forEach(a => { a.checked = (a === target); });
        } else {
            argObj.checked = checked;
            if (checked && g.exclusive === 'max. 1') peers.forEach(a => { a.checked = false; });
        }
        // Linear Axis / Static Objects gelten fuer alle Aktionen der Sequenz
        return argObj.text.includes('linear_axis') || argObj.text === 'static_objects:=true' || argObj.text === 'static_onjects:=true';
    }

    function buildDevSetupArgs(action, actions, onChange) {
        const wrap = document.createElement('div');
        wrap.className = 'user-dev-params';
        if (!action.args || action.args.length === 0) return wrap;

        const launchKey = launchKeyOf(action.baseCmd || action.cmd);
        const hosts = {};
        const hostFor = (argObj) => {
            const g = getArgGroup(argObj);
            if (hosts[g.key]) return hosts[g.key];
            const groupEl = document.createElement('div');
            groupEl.className = 'param-group';
            groupEl.dataset.group = g.key;
            groupEl.innerHTML = `<div class="param-group-head"><i class="${g.icon}"></i><span>${g.label}</span>`
                + (g.exclusive ? `<span class="param-group-hint" title="Mutually exclusive options">${g.exclusive}</span>` : '')
                + `</div>`;
            const chips = document.createElement('div');
            chips.className = 'param-group-chips';
            markSegmentGroup(chips, g);
            groupEl.appendChild(chips);
            wrap.appendChild(groupEl);
            hosts[g.key] = chips;
            return chips;
        };

        const syncChips = () => {
            wrap.querySelectorAll('label.param-chip').forEach(lbl => {
                const a = action.args.find(x => x.text === lbl.dataset.argText);
                const cb = lbl.querySelector('input');
                if (!a || !cb) return;
                cb.checked = !!a.checked;
                lbl.classList.toggle('chip-inactive', !a.checked);
            });
        };

        action.args.forEach(argObj => {
            if (argObj.kind === 'gpu-toggle') {
                hostFor(argObj).appendChild(buildWhisperDeviceToggle(argObj, () => {
                    onChange(false);
                    wrap.dispatchEvent(new Event('change', { bubbles: true }));
                }));
                return;
            }
            if (argObj.kind === 'value') {
                hostFor(argObj).appendChild(buildValueParamRow(action, argObj, () => onChange(false)));
                return;
            }
            const lbl = document.createElement('label');
            const kind = classifyArg(argObj.text, launchKey);
            lbl.className = 'param-chip' + (argObj.checked ? '' : ' chip-inactive') + (kind.cls ? ' ' + kind.cls : '');
            lbl.title = kind.title || argObj.text;
            lbl.dataset.argText = argObj.text;
            lbl.onclick = (e) => e.stopPropagation();

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = !!argObj.checked;
            cb.onchange = (e) => {
                const shared = toggleDevSetupArg(action, argObj, e.target.checked);
                if (shared) {
                    actions.forEach(other => (other.args || []).forEach(a => {
                        if (a.text === argObj.text) a.checked = argObj.checked;
                    }));
                }
                syncChips();
                onChange(shared);
            };

            const txt = document.createElement('span');
            txt.className = 'user-dev-chip-txt';
            const eq = argObj.text.indexOf(':=');
            if (eq !== -1) {
                txt.innerHTML = `<span class="arg-key">${argObj.text.slice(0, eq)}:=</span><span class="arg-val">${argObj.text.slice(eq + 2)}</span>`;
            } else {
                txt.textContent = argObj.text;
            }
            lbl.appendChild(cb);
            lbl.appendChild(txt);
            hostFor(argObj).appendChild(lbl);
        });
        watchValueParamRows(wrap);
        wrap.syncChips = syncChips;
        return wrap;
    }

    function mountDevSetupSections(root) {
        root.querySelectorAll('.user-dev-section').forEach(sec => {
            const popupId = sec.dataset.devPopup;
            const grid = sec.querySelector('.user-dev-grid');
            const runAllBtn = sec.querySelector('.user-dev-run-all');
            const runN = sec.querySelector('.user-dev-run-n');
            const actions = loadDevSetupActions(popupId);
            const paramViews = [];

            const updateCount = () => {
                const n = actions.filter(a => a.active).length;
                if (runN) runN.textContent = n;
                if (runAllBtn) runAllBtn.disabled = n === 0;
            };

            if (actions.length === 0) {
                grid.innerHTML = `<div class="param-empty">Keine Aktionen gefunden</div>`;
                if (runAllBtn) runAllBtn.disabled = true;
                return;
            }

            actions.forEach(action => {
                const cat = getSeqCategory(action);
                const titleParts = splitSeqTitle(action.title || action.cmd);
                const iconMetas = getActionIconMeta(action, action.cmd);

                const card = document.createElement('div');
                card.className = 'user-icon-card user-dev-card' + (action.active ? '' : ' is-off');
                card.style.setProperty('--sec-color', cat.color);
                card.tabIndex = 0;
                card.setAttribute('role', 'button');
                card.title = 'Klick: ' + (action.title || action.cmd) + ' starten';

                const top = document.createElement('div');
                top.className = 'user-dev-card-top';
                const activeLbl = document.createElement('label');
                activeLbl.className = 'user-dev-active';
                activeLbl.title = 'In der Sequenz aktiv (wird von „Aktive starten“ und EXECUTE im DEV-Setup-Popup mitgestartet)';
                activeLbl.onclick = (e) => e.stopPropagation();
                const activeCb = document.createElement('input');
                activeCb.type = 'checkbox';
                activeCb.className = 'main-action-cb';
                activeCb.checked = !!action.active;
                activeCb.onchange = (e) => {
                    action.active = e.target.checked;
                    card.classList.toggle('is-off', !action.active);
                    updateCount();
                    saveDevSetupState(popupId, actions);
                };
                const activeTxt = document.createElement('span');
                activeTxt.textContent = 'Aktiv';
                activeLbl.appendChild(activeCb);
                activeLbl.appendChild(activeTxt);
                const catTag = document.createElement('span');
                catTag.className = 'user-dev-cat';
                catTag.innerHTML = `<i class="${cat.icon}"></i>`;
                catTag.title = cat.label;
                top.appendChild(activeLbl);
                top.appendChild(catTag);
                card.appendChild(top);

                // Alle Icons der Action Card aus dem DEV-Setup-Popup
                const icons = document.createElement('div');
                icons.className = 'user-dev-icons' + (iconMetas.length > 1 ? ' is-multi' : '');
                (iconMetas.length ? iconMetas : [null]).forEach(meta => {
                    const badge = document.createElement('div');
                    badge.className = 'user-icon-badge';
                    if (meta) {
                        badge.title = meta.label || '';
                        const img = document.createElement('img');
                        img.className = 'user-icon-img';
                        img.src = meta.path;
                        img.alt = meta.label || '';
                        badge.appendChild(img);
                    } else {
                        badge.innerHTML = `<i class="${cat.icon} user-dev-fa"></i>`;
                    }
                    icons.appendChild(badge);
                });
                card.appendChild(icons);

                const title = document.createElement('div');
                title.className = 'user-icon-title';
                title.textContent = titleParts.main;
                card.appendChild(title);
                const desc = document.createElement('div');
                desc.className = 'user-icon-desc';
                desc.textContent = titleParts.sub ? titleParts.sub.replace(/^[|·]\s*/, '') : cat.label;
                card.appendChild(desc);

                const divider = document.createElement('div');
                divider.className = 'user-icon-divider';
                card.appendChild(divider);

                const params = buildDevSetupArgs(action, actions, (shared) => {
                    if (shared) paramViews.forEach(v => v.syncChips && v.syncChips());
                    saveDevSetupState(popupId, actions);
                });
                paramViews.push(params);
                card.appendChild(params);

                const hint = document.createElement('div');
                hint.className = 'user-dev-launch';
                hint.innerHTML = `<i class="fa-solid fa-play"></i><span>Klick startet</span>`;
                card.appendChild(hint);

                const launch = async () => {
                    if (card.classList.contains('is-launching')) return;
                    card.classList.add('is-launching');
                    showToast('🚀 ' + titleParts.main + ' gestartet...');
                    await runDevSetupAction(popupId, action);
                    setTimeout(() => card.classList.remove('is-launching'), 1200);
                };
                card.addEventListener('click', (e) => {
                    if (e.target.closest('label, input, .param-segment, button')) return;
                    launch();
                });
                card.addEventListener('keydown', (e) => {
                    if (e.target !== card) return;
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); launch(); }
                });
                grid.appendChild(card);
            });

            updateCount();
            if (runAllBtn) {
                runAllBtn.addEventListener('click', async () => {
                    const toRun = actions.filter(a => a.active);
                    if (toRun.length === 0) return;
                    runAllBtn.disabled = true;
                    showToast('🚀 ' + DEV_SETUP_SECTIONS[popupId].title + ' gestartet...');
                    for (const a of toRun) {
                        await runDevSetupAction(popupId, a);
                        await new Promise(r => setTimeout(r, 1000));
                    }
                    updateCount();
                });
            }
        });
    }

    function buildUserAppOverviewHtml() {
        const sections = [
            {
                title: "ROBOT & MOTION PLANNING",
                icon: "fa-solid fa-robot",
                color: "#38bdf8",
                countBadge: "4 Module",
                items: [
                    { icon: "_imgs/icons/icon_robot_lite6_real.svg?v=6", title: "Real Arm (Lite 6)", subtitle: "Hardware Motion" },
                    { icon: "_imgs/icons/icon_robot_lite6_sim.svg?v=6", title: "Sim Arm (Lite 6)", subtitle: "RViz Mock Twin" },
                    { icon: "_imgs/icons/icon_moveit2.svg?v=6", title: "MoveIt 2", subtitle: "OMPL & Servo Planning" },
                    { icon: "_imgs/icons/icon_dev.svg?v=6", title: "Dev Setup", subtitle: "Full Stack Bringup" }
                ]
            },
            {
                title: "MULTIMODAL INPUT & TELEOP",
                icon: "fa-solid fa-gamepad",
                color: "#c084fc",
                countBadge: "5 Module",
                items: [
                    { icon: "_imgs/icons/icon_gamepad.svg?v=6", title: "Gamepad", subtitle: "Cartesian Jogging" },
                    { icon: "_imgs/icons/icon_voice.svg?v=6", title: "Whisper Voice", subtitle: "Speech AI Control" },
                    { icon: "_imgs/icons/icon_gaze.svg?v=6", title: "Tobii Glasses 3", subtitle: "Eye-Gaze Tracking" },
                    { icon: "_imgs/icons/icon_vr_controller.svg?v=6", title: "VR Controller", subtitle: "Spatial 6DOF Jog" },
                    { icon: "_imgs/icons/icon_vr_headsetVR.svg?v=6", title: "Quest 3 VR", subtitle: "WebXR Teleop Twin" }
                ]
            },
            {
                title: "3D VISION & PERCEPTION",
                icon: "fa-solid fa-camera",
                color: "#4ade80",
                countBadge: "3 Module",
                items: [
                    { icon: "_imgs/icons/icon_zed_m.svg?v=6", title: "ZED Mini Camera", subtitle: "Stereo Pointcloud" },
                    { icon: "_imgs/icons/icon_object_detection.svg?v=7", title: "YOLO 3D", subtitle: "Object Detection" },
                    { icon: "_imgs/icons/icon_tf_tuner.svg?v=6", title: "TF Tuner", subtitle: "Coordinate Control" }
                ]
            },
            {
                title: "UI (WEB INTERFACE)",
                icon: "fa-solid fa-network-wired",
                color: "#f59e0b",
                countBadge: "4 Module",
                items: [
                    { icon: "_imgs/icons/icon_robot_control_ui.svg?v=6", title: "Robot Control UI", subtitle: "Port 8081 Webapp" },
                    { icon: "_imgs/icons/icon_rviz.svg?v=6", title: "RViz2 Visualizer", subtitle: "3D Motion Display" },
                    { icon: "_imgs/icons/icon_websocket.svg?v=6", title: "ROS 2 Bridge", subtitle: "Port 9090 WS" },
                    { icon: "_imgs/icons/icon_server.svg?v=6", title: "Video Server", subtitle: "Port 8082 Stream" }
                ]
            }
        ];

        const rows = [
            [sections[0], sections[1]],
            [sections[2], sections[3]]
        ];

        // Oben: DEV SETUP FAKE | REAL - Inhalt fuellt mountDevSetupSections()
        let html = `<div class="user-overview-container">`;
        html += `<div class="user-overview-row">`;
        Object.keys(DEV_SETUP_SECTIONS).forEach(popupId => {
            const d = DEV_SETUP_SECTIONS[popupId];
            html += `
                <div class="user-overview-section user-dev-section" data-dev-popup="${popupId}" style="--sec-color: ${d.color};">
                    <div class="user-overview-section-header">
                        <div class="user-sec-title-wrap">
                            <i class="${d.icon}" style="color: ${d.color}; font-size: 14px;"></i>
                            <span class="user-sec-title">${d.title}</span>
                            <span class="user-sec-badge" style="color: ${d.color}; border-color: ${d.color}40; background: ${d.color}15;">${d.badge}</span>
                        </div>
                        <button type="button" class="user-dev-run-all" title="Alle aktiven Aktionen dieser Sequenz nacheinander starten (wie EXECUTE im DEV-Setup-Popup)">
                            <i class="fa-solid fa-play"></i><span>Aktive starten</span><b class="user-dev-run-n">0</b>
                        </button>
                    </div>
                    <div class="user-overview-icons-grid user-dev-grid"></div>
                </div>`;
        });
        html += `</div>`;
        rows.forEach(rowSections => {
            html += `<div class="user-overview-row">`;
            rowSections.forEach(sec => {
                html += `
                    <div class="user-overview-section" style="--sec-color: ${sec.color};">
                        <div class="user-overview-section-header">
                            <div class="user-sec-title-wrap">
                                <i class="${sec.icon}" style="color: ${sec.color}; font-size: 14px;"></i>
                                <span class="user-sec-title">${sec.title}</span>
                            </div>
                            <span class="user-sec-badge" style="color: ${sec.color}; border-color: ${sec.color}40; background: ${sec.color}15;">${sec.countBadge}</span>
                        </div>
                        <div class="user-overview-icons-grid">
                `;
                sec.items.forEach(item => {
                    html += `
                        <div class="user-icon-card">
                            <div class="user-icon-badge">
                                <img src="${item.icon}" alt="${item.title}" class="user-icon-img">
                            </div>
                            <div class="user-icon-title">${item.title}</div>
                            <div class="user-icon-desc">${item.subtitle}</div>
                        </div>
                    `;
                });
                html += `
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        });
        html += `</div>`;
        return html;
    }

    // Popup-Theme (Dark / Light) - localStorage-Schluessel
    const POPUP_THEME_KEY = 'ros2_nexus_popup_theme';
    const POPUP_HEADER_COLLAPSED_KEY = 'ros2_nexus_popup_header_collapsed';

    // ─── FAKE / REAL Umschalter ─────────────────────────────────────────────────
    // Beide Modi sind eigene Sequenzen (eigene Nodes, Launch-Struktur und
    // Parameter, eigener gespeicherter Zustand). Der Umschalter speichert den
    // aktuellen Modus und oeffnet die Sequenz des anderen Modus an derselben Stelle.
    const SEQ_MODE_PAIRS = {
        dev_fake: { mode: 'fake', other: 'dev_real' },
        dev_real: { mode: 'real', other: 'dev_fake' },
        server_fake: { mode: 'fake', other: 'server_real' },
        server_real: { mode: 'real', other: 'server_fake' }
    };

    // Karte auf der Seite, die die Sequenz mit dieser popupId oeffnet
    function findSeqModeCard(popupId) {
        return Array.from(document.querySelectorAll('.action-card[onclick]'))
            .find(el => el.getAttribute('onclick').includes(`'${popupId}')`)) || null;
    }

    function buildSeqModeSwitchHtml(popupId) {
        const pair = SEQ_MODE_PAIRS[popupId];
        if (!pair || !findSeqModeCard(pair.other)) return '';
        const opt = (mode, icon, label, tip) =>
            `<button type="button" class="seq-mode-opt${pair.mode === mode ? ' is-active' : ''}" data-mode="${mode}" role="radio" aria-checked="${pair.mode === mode}" title="${tip}"><i class="${icon}"></i>${label}</button>`;
        return `<div class="seq-mode-switch mode-${pair.mode}" id="seq-mode-switch" role="radiogroup" aria-label="Mode">`
            + opt('fake', 'fa-solid fa-flask', 'FAKE', 'Simulation: MoveIt fake hardware, no robot needed')
            + opt('real', 'fa-solid fa-bolt', 'REAL', 'Hardware: physical xArm Lite 6 (robot_ip)')
            + `</div>`;
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
       
       // Titel-Elemente der Sequenz-Karten (fuer den dynamischen "+ Linear Axis"-Titel).
       // WeakMap statt Property am Action-Objekt, sonst landete ein DOM-Knoten in TABS/config.
       const seqTitleEls = new WeakMap();

       // ── Action Card Collapse (Ein-/Ausklappen pro Card, je Popup persistiert) ──
       const COLLAPSE_LS_KEY = 'ros2_nexus_cards_collapsed';

       // Primaer in launcher_config.json (__cards_collapsed), damit das Layout
       // browser- und rechneruebergreifend erhalten bleibt; localStorage nur
       // als Rueckfall, falls der Server nicht erreichbar ist.
       const readCollapsedStore = () => {
           if (window.TABS && window.TABS['__cards_collapsed']) return window.TABS['__cards_collapsed'];
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
           const store = JSON.parse(JSON.stringify(readCollapsedStore()));
           popupCandidateKeys.forEach(pKey => {
               if (!pKey) return;
               if (!store[pKey]) store[pKey] = {};
               store[pKey][cardKey] = collapsed;
           });
           if (!window.TABS) window.TABS = {};
           window.TABS['__cards_collapsed'] = store;
           try { localStorage.setItem(COLLAPSE_LS_KEY, JSON.stringify(store)); } catch (e) {}
           saveLayoutDebounced();
       };

       // Mehrere Klicks kurz hintereinander -> ein Schreibvorgang, ein Hinweis.
       let layoutSaveTimer = null;
       const saveLayoutDebounced = () => {
           clearTimeout(layoutSaveTimer);
           layoutSaveTimer = setTimeout(async () => {
               try {
                   const res = await fetch('/api/config', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify(window.TABS)
                   });
                   const data = await res.json();
                   if (data.ok) showToast('✓ Layout saved');
                   else showToast('✗ Could not save layout', true);
               } catch (err) {
                   showToast('✗ Could not save layout', true);
               }
           }, 400);
       };

       // Haengt den kleinen Chevron-Button in die Card (bei den Sequenz-Karten
       // unten rechts in die Kennzahl-Zeile, sonst oben rechts).
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
                   a.args.forEach(argObj => storeArgState(currentArgsState[cmdKey], argObj));
                   if (a.baseCmd && a.baseCmd !== a.cmd) {
                       if (!currentArgsState[a.baseCmd]) currentArgsState[a.baseCmd] = {};
                       a.args.forEach(argObj => storeArgState(currentArgsState[a.baseCmd], argObj));
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
            const startBtn = document.getElementById('launch-modal-start-btn');
            const cancelBtn = document.getElementById('modal-cancel-btn');

            if (!actionsData || actionsData.length === 0 || (typeof isOverviewOnly !== 'undefined' && isOverviewOnly)) {
                if (selectAllLbl) selectAllLbl.style.display = 'none';
                if (footerStatsText) footerStatsText.textContent = '16 system components available · Overview';
                if (startBtn) startBtn.classList.add('is-hidden');
                if (cancelBtn) cancelBtn.textContent = 'Close';
                return;
            }

            if (!topUl) {
                if (selectAllLbl) selectAllLbl.style.display = 'none';
                if (footerStatsText) footerStatsText.textContent = '1 action ready to run';
                return;
            }

            const allCbs = Array.from(topUl.querySelectorAll('.main-action-cb'));
            const total = allCbs.length;
            const activeCount = allCbs.filter(c => c.checked).length;

            if (total === 0) {
                if (selectAllLbl) selectAllLbl.style.display = 'none';
                if (footerStatsText) footerStatsText.textContent = 'No actions configured';
                return;
            }

            if (selectAllCb) {
                selectAllCb.checked = (total > 0 && activeCount === total);
                selectAllCb.indeterminate = (activeCount > 0 && activeCount < total);
            }
            if (selectAllText) {
                selectAllText.textContent = activeCount === total ? 'Deselect all' : 'Select all';
            }
            const headerCount = document.getElementById('modal-header-count');
            if (headerCount) headerCount.textContent = ` · ${total} ${total === 1 ? 'action' : 'actions'}`;
            // Zaehler in den Filter-Chips (Alle / Aktiv / Inaktiv)
            [['seq-filter-n-all', total], ['seq-filter-n-on', activeCount], ['seq-filter-n-off', total - activeCount]]
                .forEach(([id, n]) => { const el = document.getElementById(id); if (el) el.textContent = n; });

            // Summen ueber die aktiven Karten (Werte setzt buildSeqCard)
            let nodes = 0, launches = 0;
            allCbs.forEach(cb => {
                if (!cb.checked) return;
                const card = cb.closest('.seq-card');
                if (!card) return;
                nodes += parseInt(card.dataset.nodes, 10) || 0;
                launches += parseInt(card.dataset.launches, 10) || 0;
            });
            if (footerStatsText) {
                footerStatsText.innerHTML =
                    `<span><b>${activeCount}/${total}</b> active</span>`
                    + `<span class="modal-footer-sep"></span>`
                    + `<span><b>${nodes}</b> ${nodes === 1 ? 'Node' : 'Nodes'}</span>`
                    + `<span><b>${launches}</b> ${launches === 1 ? 'Sub-Launch' : 'Sub-Launches'}</span>`;
            }
            const dot = document.querySelector('#launch-modal-footer .status-pulsing-dot');
            if (dot) dot.classList.toggle('is-idle', activeCount === 0);
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
                    const titleEl = seqTitleEls.get(act);
                    if (titleEl) renderSeqTitle(titleEl, act.title);
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
                            const innerCard = row.querySelector('.modal-action-card');
                            if (innerCard) {
                                innerCard.classList.toggle('card-active', isStaticObjectsActive);
                                innerCard.classList.toggle('card-inactive', !(isStaticObjectsActive));
                            }
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
                item.title = (type === 'common') ? "Active (started in both modes)" : "Active (will be started)";
                
                const descSpan = Array.from(item.querySelectorAll('span')).find(s => 
                    s.style.float === 'right' || s.textContent.includes('camera:=') || /aktiv|active/i.test(s.textContent)
                );
                if (descSpan) {
                    if (!descSpan.dataset.origText) descSpan.dataset.origText = descSpan.textContent;
                    let clean = descSpan.dataset.origText
                        .replace(/\s*·\s*(inaktiv|inactive)/gi, '')
                        .replace(/\s*·\s*(aktiv|active)/gi, '')
                        .trim();
                    if (type !== 'common' && !/aktiv|active/i.test(clean)) {
                        clean = clean.replace(/\)$/, ' · active)');
                    }
                    descSpan.textContent = clean;
                    descSpan.style.removeProperty('color');
                    descSpan.style.removeProperty('opacity');
                }
            } else {
                item.classList.add('camera-node-inactive');
                item.classList.remove('camera-node-active');
                item.setAttribute('aria-disabled', 'true');
                item.title = (type === 'zed' || type === 'ip') ? "Inactive in current camera mode (not started)" : "Inactive (not started)";
                
                const descSpan = Array.from(item.querySelectorAll('span')).find(s => 
                    s.style.float === 'right' || s.textContent.includes('camera:=') || /aktiv|active/i.test(s.textContent)
                );
                if (descSpan) {
                    if (!descSpan.dataset.origText) descSpan.dataset.origText = descSpan.textContent;
                    let clean = descSpan.dataset.origText
                        .replace(/\s*·\s*(inaktiv|inactive)/gi, '')
                        .replace(/\s*·\s*(aktiv|active)/gi, '')
                        .trim();
                    clean = clean.replace(/\)$/, ' · inactive)');
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
                            const innerCard = row.querySelector('.modal-action-card');
                            if (innerCard) {
                                innerCard.classList.toggle('card-active', !isIpCam);
                                innerCard.classList.toggle('card-inactive', !(!isIpCam));
                            }
                            const matchedAct = actionsData.find(a => a.cmd === rowCmd || a.baseCmd === rowCmd);
                            if (matchedAct) matchedAct.active = !isIpCam;
                        }
                    }
                });

                updateVisionTreeNodes(targetContainer, isIpCam);
                updateModalStats();
            }
        }
        
        // Parameter-Liste wie im Sequenz-Popup (auch fuer die Multimodal-Uebersicht)
        function parseArgs(action) {
            parseActionArgs(action, effPopupId, actionsData);
        }
        
            function createArgsDiv(action) {
             const argsDiv = document.createElement('div');
             argsDiv.className = 'modal-args-list';

             
             if (action && action.args.length > 0) {
                 normalizeActionArgs(action);

                 const argLaunchKey = launchKeyOf(action.baseCmd || action.cmd);

                 // Chips thematisch gruppieren (Kamera, Greifer, Report, ...).
                 // Die Gruppen entstehen in der Reihenfolge der Sortierung oben.
                 const groupChipHosts = {};
                 const groupHostFor = (argObj) => {
                     const g = getArgGroup(argObj);
                     if (groupChipHosts[g.key]) return groupChipHosts[g.key];
                     const groupEl = document.createElement('div');
                     groupEl.className = 'param-group';
                     groupEl.dataset.group = g.key;
                     const head = document.createElement('div');
                     head.className = 'param-group-head';
                     head.innerHTML = `<i class="${g.icon}"></i><span>${g.label}</span>` +
                         (g.exclusive ? `<span class="param-group-hint" title="Mutually exclusive options">${g.exclusive}</span>` : '');
                     const chips = document.createElement('div');
                     chips.className = 'param-group-chips';
                     markSegmentGroup(chips, g);
                     groupEl.appendChild(head);
                     groupEl.appendChild(chips);
                     argsDiv.appendChild(groupEl);
                     groupChipHosts[g.key] = chips;
                     return chips;
                 };

                 action.args.forEach(argObj => {
                     if (argObj.kind === 'gpu-toggle') {
                         groupHostFor(argObj).appendChild(buildWhisperDeviceToggle(argObj, () => {
                             saveActiveState();
                             // Befehlsanzeige und abhaengige Defaults (CPU-Profil) aktualisieren
                             argsDiv.dispatchEvent(new Event('change', { bubbles: true }));
                         }));
                         return;
                     }
                     if (argObj.kind === 'value') {
                         groupHostFor(argObj).appendChild(buildValueParamRow(action, argObj, saveActiveState));
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

                        // Gaze-Modus: genau einer aktiv (Abwaehlen schaltet auf den anderen)
                        if (argObj.kind === 'gaze-mode') {
                            const gazeArgs = action.args.filter(a => a.kind === 'gaze-mode');
                            const target = e.target.checked ? argObj : (gazeArgs.find(a => a !== argObj) || argObj);
                            gazeArgs.forEach(a => { a.checked = (a === target); });
                            argsDiv.querySelectorAll('label.param-chip').forEach(lbl => {
                                const matchArg = gazeArgs.find(a => a.text === lbl.dataset.argText);
                                const cb = lbl.querySelector('input');
                                if (matchArg && cb) {
                                    cb.checked = matchArg.checked;
                                    lbl.classList.toggle('chip-inactive', !matchArg.checked);
                                }
                            });
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
                        txtSpan.innerHTML = `<span class="arg-key">${parts[0]}:=</span><span class="arg-val">${parts.slice(1).join(':=')}</span>`;
                    } else if (argObj.text.includes('=')) {
                        const parts = argObj.text.split('=');
                        txtSpan.innerHTML = `<span class="arg-key">${parts[0]}=</span><span class="arg-val">${parts.slice(1).join('=')}</span>`;
                    } else {
                        txtSpan.textContent = argObj.text;
                    }
                    
                    argLbl.appendChild(argCb);
                    argLbl.appendChild(txtSpan);
                    groupHostFor(argObj).appendChild(argLbl);
                });
            } else {
                const noArgsEl = document.createElement('div');
                noArgsEl.className = 'param-empty';
                noArgsEl.textContent = 'No parameters';
                argsDiv.appendChild(noArgsEl);
            }
            watchValueParamRows(argsDiv);
            return argsDiv;
        }


       // ── Sequenz-Karten im Stil der Multimodal-Uebersicht ────────────────────
       // Kopf: Checkbox · Icons · Kategorie/Titel/Datei · Kennzahlen & CMD
       // Body (einklappbar): Launch-Struktur | Parameter (thematisch gruppiert)
       const escHtml = (str) => String(str == null ? '' : str)
           .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

       // Zaehlt Sub-Launches (Eintraege mit Kindern oder LAUNCH-Badge),
       // Befehle (EXEC/KILL/SYS/PUB) und Nodes (alles andere) im Launch-Baum.
       const countLaunchTree = (ul) => {
           const res = { launches: 0, nodes: 0, cmds: 0 };
           if (!ul) return res;
           ul.querySelectorAll('li').forEach(item => {
               const kids = Array.from(item.children);
               const badge = kids.find(c => c.classList && c.classList.contains('badge'));
               const bc = badge ? badge.className : '';
               if (kids.some(c => c.tagName === 'UL') || /badge-launch/.test(bc)) res.launches++;
               else if (/badge-(exec|kill|sys|pub)/.test(bc)) res.cmds++;
               else res.nodes++;
           });
           return res;
       };

       function buildSeqCard(li, action, o) {
           const cat = getSeqCategory(action, o.cmdToDisplay);
           const iconMetas = getActionIconMeta(action, o.cmdToDisplay);
           const argCount = (action && action.args) ? action.args.length : 0;
           const cmdStr = o.cmdToDisplay || '';

           // Kopf-Infos aus dem Tooltip-Eintrag: Badge, Datei/Node-Name, Beschreibung
           let badgeEl = null, nameText = '', descText = '';
           const extraEls = [];
           (o.headNodes || []).forEach(node => {
               if (node.nodeType === 3) {
                   const t = node.textContent.trim();
                   if (!t) return;
                   const sp = document.createElement('span');
                   sp.textContent = t;
                   node = sp;
               }
               if (node.nodeType !== 1) return;
               const txt = (node.textContent || '').trim();
               if (!badgeEl && node.classList.contains('badge')) { badgeEl = node; return; }
               if (node.classList.contains('modal-cmd-btn')) return;
               const isDesc = node.style.float === 'right' || (txt.startsWith('(') && txt.endsWith(')'));
               if (isDesc && !descText) { descText = txt.replace(/^\(|\)$/g, '').trim(); return; }
               if (!nameText && txt) { nameText = txt; return; }
               if (txt) extraEls.push(node);
           });
           // Config-Aktionen (Sektions-Popups) tragen ihren Namen in "label"
           const headline = (action && (action.title || action.label)) || nameText || cmdStr;
           // Typ-Badge "CMD" nicht mit dem CMD-Kopierknopf rechts verwechseln lassen
           if (badgeEl && badgeEl.classList.contains('badge-sys') && badgeEl.textContent.trim() === 'CMD') {
               badgeEl.innerHTML = '<i class="fa-solid fa-terminal"></i>SHELL';
               badgeEl.title = 'Shell command';
           }

           const cardDiv = document.createElement('div');
           cardDiv.className = 'modal-action-card seq-card ' + (o.isChecked ? 'card-active' : 'card-inactive');
           cardDiv.style.setProperty('--sec-color', cat.color);
           cardDiv.dataset.cat = cat.key;

           // ── Kopf ──
           // Zeile 1: Checkbox · Kategorie · (Technik-Badges, CMD, Chevron)
           // Zeile 2: Icon-Kacheln | Titel, Datei, Ports
           // Zeile 3: Kennzahlen als Text
           const head = document.createElement('div');
           head.className = 'seq-card-head';

           const top = document.createElement('div');
           top.className = 'seq-card-top';

           const mainCb = document.createElement('input');
           mainCb.type = 'checkbox';
           mainCb.className = 'main-action-cb';
           mainCb.checked = o.isChecked;
           mainCb.title = 'Beim EXECUTE mitstarten';
           const cbWrap = document.createElement('div');
           cbWrap.className = 'modal-cb-wrap';
           cbWrap.appendChild(mainCb);
           top.appendChild(cbWrap);

           const eyebrow = document.createElement('div');
           eyebrow.className = 'seq-card-eyebrow';
           eyebrow.title = cat.label;
           eyebrow.innerHTML = `<i class="${cat.icon}"></i><span>${escHtml(cat.label.split(' + ').join(' · '))}</span>`;
           top.appendChild(eyebrow);

           const actionsRow = document.createElement('div');
           actionsRow.className = 'seq-card-actions';
           const addTech = (cls, icon, label) => {
               const b = document.createElement('span');
               b.className = 'seq-tech ' + cls;
               b.innerHTML = `<i class="${icon}"></i>${label}`;
               actionsRow.appendChild(b);
           };
           if (cmdStr.startsWith('ros2 run')) addTech('seq-tech-ros', 'fa-solid fa-robot', 'ROS 2');
           if (cmdStr.includes('python3')) addTech('seq-tech-py', 'fa-brands fa-python', 'Python3');
           if (cmdStr.includes('google-chrome') || cmdStr.includes('chromium-browser')) addTech('seq-tech-chrome', 'fa-brands fa-chrome', '+Chrome');
           const staticCmd = o.cmdToCopy || cmdStr;
           actionsRow.appendChild(createCmdBadge(getGazeMode(action) ? () => (getGazeMode(action) || {}).cmd || staticCmd : staticCmd));
           top.appendChild(actionsRow);
           head.appendChild(top);

           const main = document.createElement('div');
           main.className = 'seq-card-main';

           if (iconMetas.length > 0) {
               const icons = document.createElement('div');
               icons.className = 'seq-card-icons' + (iconMetas.length > 1 ? ' is-multi' : '');
               iconMetas.forEach(meta => {
                   const iconBadge = document.createElement('div');
                   iconBadge.className = 'modal-card-icon-badge';
                   iconBadge.title = meta.label;
                   const img = document.createElement('img');
                   img.src = meta.path;
                   img.className = 'modal-card-side-img';
                   img.alt = meta.label;
                   iconBadge.appendChild(img);
                   icons.appendChild(iconBadge);
               });
               main.appendChild(icons);
           }

           const titles = document.createElement('div');
           titles.className = 'seq-card-titles';
           const titleEl = document.createElement('div');
           titleEl.className = 'seq-card-title';
           const titleParts = renderSeqTitle(titleEl, headline);
           if (action) seqTitleEls.set(action, titleEl);
           const sub = document.createElement('div');
           sub.className = 'seq-card-sub';
           if (badgeEl) { badgeEl.removeAttribute('style'); sub.appendChild(badgeEl); }
           if (nameText && nameText !== headline) {
               const fileEl = document.createElement('span');
               fileEl.className = 'seq-card-file';
               fileEl.textContent = nameText;
               fileEl.title = nameText;
               sub.appendChild(fileEl);
           }
           if (descText && descText !== headline) {
               const descEl = document.createElement('span');
               descEl.className = 'seq-card-desc';
               descEl.textContent = descText;
               descEl.title = descText;
               sub.appendChild(descEl);
           }
           extraEls.forEach(el => { el.removeAttribute('style'); el.classList.add('seq-card-desc'); sub.appendChild(el); });
           titles.appendChild(titleEl);
           if (sub.childNodes.length) titles.appendChild(sub);
           // Port-Zeile: welcher Port wofuer verwendet wird, danach die
           // Bestandteile aus dem Titel, z. B. "(cam, tf, yolo3d)"
           const ports = getActionPorts(cmdStr);
           if (ports.length || titleParts.tags.length) {
               const portsEl = document.createElement('div');
               portsEl.className = 'seq-card-ports';
               ports.forEach(pt => {
                   const chip = document.createElement('span');
                   chip.className = 'seq-port';
                   chip.title = `Port ${pt.port}: ${pt.use}`;
                   chip.innerHTML = `<i class="${pt.icon}"></i><b>${pt.port}</b><span>${escHtml(pt.use)}</span>`;
                   portsEl.appendChild(chip);
               });
               if (titleParts.tags.length) {
                   const chip = document.createElement('span');
                   chip.className = 'seq-port seq-port-tags';
                   chip.title = titleParts.tags.join(', ');
                   chip.innerHTML = `<i class="fa-solid fa-layer-group"></i><span>${titleParts.tags.map(escHtml).join(' · ')}</span>`;
                   portsEl.appendChild(chip);
               }
               titles.appendChild(portsEl);
           }
           main.appendChild(titles);
           head.appendChild(main);

           // Kennzahlen als Textzeile; die Summen der aktiven Karten zeigt der Footer
           const stats = document.createElement('div');
           stats.className = 'seq-card-stats';
           const addStat = (n, one, many, tip) => {
               if (!n) return;
               const st = document.createElement('span');
               st.className = 'seq-stat';
               st.title = tip;
               st.innerHTML = `<b>${n}</b>${n === 1 ? one : many}`;
               stats.appendChild(st);
           };
           // Status links in der Kennzahl-Zeile, die Zahlen folgen rechts daneben;
           // welcher Text sichtbar ist, entscheidet das CSS ueber card-active /
           // card-inactive der Karte (die Klassen setzen auch die Sync-Funktionen,
           // z. B. Linear Axis). Der Einklapp-Chevron sitzt ganz rechts.
           const state = document.createElement('span');
           state.className = 'seq-card-state';
           state.innerHTML = '<span class="seq-card-state-dot"></span>'
               + '<span class="seq-state-on">Ready</span><span class="seq-state-off">Skipped</span>';
           stats.appendChild(state);
           const tree = countLaunchTree(o.ulNode);
           addStat(tree.launches, 'Sub-Launch', 'Sub-Launches', 'Included launch files');
           addStat(tree.nodes, 'Node', 'Nodes', 'Launched nodes & servers');
           addStat(tree.cmds, 'Command', 'Commands', 'Extra shell commands');
           addStat(argCount, 'Parameter', 'Parameters', 'Selectable parameters & launch args');
           cardDiv.dataset.nodes = tree.nodes;
           cardDiv.dataset.launches = tree.launches;
           head.appendChild(stats);
           cardDiv.appendChild(head);

           // ── Body: Launch-Struktur | Parameter, sonst der Befehl ──
           // Jede Karte bekommt einen Body und damit einen Chevron - sonst
           // fehlt er bei einzelnen Nodes und die Karten wirken uneinheitlich.
           const hasTree = !!o.ulNode;
           const hasArgs = argCount > 0;
           {
               const body = document.createElement('div');
               body.className = 'seq-card-body' + (hasTree ? ' has-tree' : '') + (hasArgs ? ' has-params' : '');

               // Jede Sektion ist ein abgehobenes Unterfenster; ein Klick auf
               // die Kopfleiste klappt sie ein/aus (je Karte + Sektion gespeichert)
               const boxKeyBase = (action && (action.cmd || action.baseCmd)) || cmdStr || li.dataset.cmd || '';
               const wireSeqBox = (box, part, label) => {
                   const { pane, head, wrap } = box;
                   head.setAttribute('role', 'button');
                   head.tabIndex = 0;
                   const key = `${boxKeyBase}::${part}`;
                   const apply = (collapsed) => {
                       pane.classList.toggle('is-collapsed', collapsed);
                       head.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
                       head.title = collapsed ? `${label} ausklappen` : `${label} einklappen`;
                   };
                   apply(isCardCollapsed(key));
                   // Waehrend der Animation clippt der Inhalt, offen bleibt er
                   // sichtbar (Tree-Connector-Linien, Fokus-Ringe)
                   wrap.addEventListener('transitionend', (e) => {
                       if (e.target === wrap) pane.classList.remove('is-animating');
                   });
                   const toggle = (e) => {
                       e.stopPropagation();
                       e.preventDefault();
                       const collapsed = !pane.classList.contains('is-collapsed');
                       pane.classList.add('is-animating');
                       apply(collapsed);
                       saveCardCollapsed(key, collapsed);
                   };
                   head.addEventListener('click', toggle);
                   head.addEventListener('keydown', (e) => {
                       if (e.key === 'Enter' || e.key === ' ') toggle(e);
                   });
               };

               // Reihenfolge: Parameter, Launch-Struktur, Configs - der
               // Befehl steht immer ganz unten.
               if (hasArgs) {
                   const box = createSeqBox('params', 'fa-sliders', 'Parameter &amp; Args');
                   box.inner.appendChild(createArgsDiv(action));
                   wireSeqBox(box, 'params', 'Parameter & Args');
                   body.appendChild(box.pane);
                   // Zaehler "x / y active" ueber die Checkbox-Args; laeuft
                   // mit den Befehl-Refreshern, damit auch gekoppelte
                   // Aenderungen (Gripper-/Kamera-Sync) ankommen
                   if (action) {
                       const refreshCount = () => {
                           const toggles = action.args.filter(a => a.kind !== 'value' && a.kind !== 'gpu-toggle');
                           box.countEl.hidden = toggles.length === 0;
                           box.countEl.textContent = `${toggles.filter(a => a.checked).length} / ${toggles.length} active`;
                       };
                       refreshCount();
                       refreshCount.el = box.pane;
                       seqCmdRefreshers.add(refreshCount);
                   }
               }
               let treeCol = null;
               if (hasTree) {
                   treeCol = document.createElement('div');
                   treeCol.className = 'seq-col-tree';
                   const box = createSeqBox('tree', 'fa-sitemap', 'Launch Structure');
                   const treeParts = [];
                   if (tree.launches) treeParts.push(`${tree.launches} ${tree.launches === 1 ? 'launch' : 'launches'}`);
                   if (tree.nodes) treeParts.push(`${tree.nodes} ${tree.nodes === 1 ? 'node' : 'nodes'}`);
                   if (tree.cmds) treeParts.push(`${tree.cmds} ${tree.cmds === 1 ? 'cmd' : 'cmds'}`);
                   box.countEl.hidden = treeParts.length === 0;
                   box.countEl.textContent = treeParts.join(' · ');
                   box.inner.classList.add('seq-tree-inner', 'modal-card-left-col');
                   o.ulNode.removeAttribute('style');
                   o.ulNode.querySelectorAll('ul').forEach(subUl => subUl.classList.add('sub-launch-tree'));
                   box.inner.appendChild(o.ulNode);
                   wireSeqBox(box, 'tree', 'Launch Structure');
                   treeCol.appendChild(box.pane);
                   body.appendChild(treeCol);
               }
               // YAML-Configs der Launch-Datei - volle Breite unter allem,
               // bleibt verborgen, wenn die Launch-Datei keine hat
               if (action) {
                   const cfgPane = buildConfigPane(action);
                   const refreshCfg = () => cfgPane._render();
                   refreshCfg.el = cfgPane;
                   seqCmdRefreshers.add(refreshCfg);
                   wireSeqBox(cfgPane._box, 'config', 'Config Files');
                   body.appendChild(cfgPane);
               }
               // Befehl(e) jeder Karte - immer ganz unten, verkettete Befehle zeilenweise
               {
                   const pane = document.createElement('div');
                   pane.className = 'seq-pane seq-pane-cmd';
                   const headEl = document.createElement('div');
                   headEl.className = 'seq-pane-head';
                   const cmdList = document.createElement('div');
                   cmdList.className = 'seq-cmd-list';
                   const renderCmds = () => {
                       const lines = splitCmdLines(action ? buildFinalCmd(action) : (o.cmdToCopy || cmdStr));
                       headEl.innerHTML = `<i class="fa-solid fa-terminal"></i><b>${lines.length > 1 ? `Commands (${lines.length})` : 'Command'}</b>`;
                       cmdList.innerHTML = '';
                       lines.forEach(line => {
                           const code = document.createElement('code');
                           code.className = 'seq-cmd-line';
                           code.textContent = line;
                           cmdList.appendChild(code);
                       });
                   };
                   renderCmds();
                   renderCmds.el = pane;
                   seqCmdRefreshers.add(renderCmds);
                   pane.appendChild(headEl);
                   pane.appendChild(cmdList);
                   body.appendChild(pane);
               }
               cardDiv.appendChild(body);

               attachCardCollapse(cardDiv, stats,
                   (action && (action.cmd || action.baseCmd)) || cmdStr || li.dataset.cmd,
                   [body]);
           }

           li.className = 'modal-card-row ' + (o.isChecked ? 'row-active' : 'row-inactive');
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
               if (e.target === mainCb || e.target.closest('label') || e.target.closest('a') || e.target.closest('.modal-cmd-btn') || e.target.closest('button') || e.target.closest('.param-segment')) return;
               mainCb.checked = !mainCb.checked;
               mainCb.dispatchEvent(new Event('change'));
           };
       }

       // Entfernt den alten Hinweis "Included Source Files:" ueber den Karten.
       function removeIncludedSourcesHint(topUl) {
           const container = topUl.parentElement;
           if (!container) return;
           Array.from(container.children).forEach(c => {
               if (c !== topUl && c.tagName !== 'UL' && /Included Source Files/i.test(c.textContent || '')) c.remove();
           });
       }

       // Masonry fuer die zwei Kartenspalten: Grid mit 1px-Zeilen, jede Karte
       // spannt so viele Zeilen wie sie hoch ist (+ Abstand). Dadurch rutscht
       // die naechste Karte direkt unter die kuerzere Spalte statt an die
       // Unterkante der hoeheren Nachbarkarte. Die <li> bleiben direkte Kinder
       // der Liste, damit SortableJS weiter funktioniert. Der ResizeObserver
       // haelt die Spans beim Ein-/Ausklappen und bei Breitenwechseln aktuell.
       const SEQ_CARD_GAP_PX = 20;
       function attachSeqMasonry(listEl) {
           let queued = false;
           const relayout = () => {
               queued = false;
               Array.from(listEl.children).forEach(li => {
                   if (li.tagName !== 'LI') return;
                   const card = li.firstElementChild || li;
                   // offsetHeight statt getBoundingClientRect: das Popup-Fenster
                   // hat CSS-zoom, das Grid rechnet in ungezoomten Pixeln.
                   const h = card.offsetHeight;
                   li.style.gridRowEnd = `span ${Math.max(1, Math.ceil(h + SEQ_CARD_GAP_PX))}`;
               });
           };
           // Die Liste wird gebaut, bevor das Popup im DOM haengt; abgemeldet
           // wird erst, wenn sie nach dem Schliessen wieder verschwunden ist.
           let wasConnected = false;
           const ro = new ResizeObserver(() => {
               if (!listEl.isConnected) {
                   if (wasConnected) { ro.disconnect(); mo.disconnect(); }
                   return;
               }
               wasConnected = true;
               if (queued) return;
               queued = true;
               requestAnimationFrame(relayout);
           });
           ro.observe(listEl);
           Array.from(listEl.children).forEach(li => {
               if (li.tagName === 'LI') ro.observe(li.firstElementChild || li);
           });
           // Nach Drag & Drop koennen <li> neu sortiert sein - Spans neu setzen.
           // observe() liefert undefined - den Observer daher erst speichern,
           // sonst scheitert mo.disconnect() oben beim Schliessen des Popups.
           const mo = new MutationObserver(() => {
               Array.from(listEl.children).forEach(li => {
                   if (li.tagName === 'LI') ro.observe(li.firstElementChild || li);
               });
               if (!queued) { queued = true; requestAnimationFrame(relayout); }
           });
           mo.observe(listEl, { childList: true });
       }

       const isOverviewOnly = (!actionsData || actionsData.length === 0 || popupId === 'sec_nodes_0' || effPopupId === 'sec_nodes_0' || (titleHTML && /Start - Multimodal Teleoperation|Start Multimodal Setup/.test(titleHTML)));
       if (isOverviewOnly) {
          contentClone.innerHTML = buildUserAppOverviewHtml();
          mountDevSetupSections(contentClone);
       } else {
       const topUls = Array.from(contentClone.children).filter(n => n.tagName === 'UL');
       if (topUls.length > 0) {
          const topUl = topUls[0];
          topUl.removeAttribute('style');
          topUl.classList.add('seq-card-list');
          
          const topLis = Array.from(topUl.children).filter(n => n.tagName === 'LI');
          const matchedCmds = new Set();
          if (topLis.length === 0) {
              Array.from(contentClone.children).forEach(c => {
                  if (c !== topUl) c.remove();
              });
              topUl.innerHTML = `
                <div style="padding: 60px 20px; text-align: center; color: var(--dim); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;">
                  <i class="fa-regular fa-folder-open" style="font-size: 42px; color: rgba(255,255,255,0.2);"></i>
                  <div style="font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.6); letter-spacing: 0.5px;">No launch action cards configured</div>
                  <div style="font-size: 12px; color: var(--mut); max-width: 400px; line-height: 1.5;">This section is empty. Launch action cards can be added here later.</div>
                </div>
              `;
          } else {
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
              const ulNode = Array.from(li.children).find(n => n.tagName === 'UL') || null;
              const isChecked = action ? !!action.active : (activeSet ? activeSet.has(li.dataset.cmd) : true);
              if (action) action.active = isChecked;

              buildSeqCard(li, action, {
                  ulNode,
                  headNodes: Array.from(li.childNodes).filter(n => n !== ulNode),
                  cmdToDisplay,
                  cmdToCopy: rawCmdData || cmdToDisplay,
                  isChecked
              });
          });
          
              // Append any unmatched actions to the bottom to ensure nothing is missing
          const unmatchedActions = actionsData.filter(a => !matchedCmds.has(a.cmd));
          unmatchedActions.forEach(action => {
              const li = document.createElement('li');
              li.dataset.cmd = action.cmd;
              parseArgs(action);
              const isChecked = !!action.active;

              let badgeHtml = `<span class="badge badge-node"><i class="fa-solid fa-code"></i>SCRIPT</span>`;
              if (action.cmd.startsWith('ros2 launch')) {
                  badgeHtml = `<span class="badge badge-launch"><i class="fa-solid fa-rocket"></i>LAUNCH</span>`;
              } else if (action.cmd.startsWith('ros2 run')) {
                  badgeHtml = `<span class="badge badge-node"><i class="fa-solid fa-circle-nodes"></i>NODE</span>`;
              } else if (action.cmd.includes('python3 -m http.server') || action.cmd.includes('http_robot_control_ui_p8081')) {
                  badgeHtml = `<span class="badge badge-server"><i class="fa-solid fa-server"></i>SERVER</span>`;
              }
              // "ros2 launch <pkg> <file>" / "ros2 run <pkg> <exe>" -> Datei bzw. Executable
              const cmdTokens = action.cmd.split(/\s+/);
              const entryName = (/^ros2 (launch|run)$/.test(cmdTokens.slice(0, 2).join(' ')) && cmdTokens[3])
                  ? cmdTokens[3] : cmdTokens.slice(0, 3).join(' ');

              const headTmp = document.createElement('div');
              headTmp.innerHTML = `${badgeHtml}<span></span><span style="float: right;">(Auto-Added)</span>`;
              headTmp.children[1].textContent = entryName;

              buildSeqCard(li, action, {
                  ulNode: null,
                  headNodes: Array.from(headTmp.childNodes),
                  cmdToDisplay: action.cmd,
                  cmdToCopy: action.cmd,
                  isChecked
              });

              topUl.appendChild(li);
          });

          removeIncludedSourcesHint(topUl);
          attachSeqMasonry(topUl);
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
       }
       
       let headerIconClass = isOverviewOnly ? 'fa-solid fa-shapes' : 'fa-solid fa-rocket';
       let cleanTitleText = titleHTML;
       const iconMatch = titleHTML.match(/<i\s+class="([^"]+)"[^>]*><\/i>/i);
       if (iconMatch) {
           headerIconClass = iconMatch[1];
           cleanTitleText = titleHTML.replace(/<i\s+class="[^"]+"[^>]*><\/i>/i, '').trim();
       }
       const modalTagText = isOverviewOnly ? 'Application Overview' : 'Sequence Config';
       // FAKE/REAL steht im Umschalter und im EXECUTE-Button - im Titel doppelt
       const modeSwitchHtml = buildSeqModeSwitchHtml(effPopupId);
       const execMode = (modeSwitchHtml && SEQ_MODE_PAIRS[effPopupId]) ? SEQ_MODE_PAIRS[effPopupId].mode : '';
       const headerTitleText = execMode ? cleanTitleText.replace(/\s*\((?:FAKE|REAL)\)\s*$/i, '') : cleanTitleText;

       // Popup-Theme (Dark / Light), bleibt im Browser gespeichert
       let popupTheme = 'dark';
       try { if (localStorage.getItem(POPUP_THEME_KEY) === 'light') popupTheme = 'light'; } catch (e) {}
       const themeOpt = (t, icon, label) =>
           `<button type="button" class="seq-theme-opt${t === popupTheme ? ' is-active' : ''}" data-theme="${t}" role="radio" aria-checked="${t === popupTheme}" title="${label} Theme"><i class="${icon}"></i><span>${label}</span></button>`;
       const themeSwitchHtml = `<div class="seq-theme-switch" id="seq-theme-switch" role="radiogroup" aria-label="Theme">`
           + themeOpt('dark', 'fa-solid fa-moon', 'Dark') + themeOpt('light', 'fa-solid fa-sun', 'Light') + `</div>`;

       // Suche + Filter ueber den Karten (nur im Sequenz-Popup)
       const toolbarHtml = isOverviewOnly ? '' : `
                   <div class="seq-toolbar" id="seq-toolbar">
                      <label class="seq-search" title="Filter cards by title, file, category or port">
                         <i class="fa-solid fa-magnifying-glass"></i>
                         <input type="search" id="seq-search-input" placeholder="Search action, launch file or port" autocomplete="off" spellcheck="false">
                      </label>
                      <div class="seq-filter" id="seq-filter" role="radiogroup" aria-label="Filter">
                         <button type="button" class="seq-filter-opt is-active" data-filter="all" role="radio" aria-checked="true">All <b id="seq-filter-n-all">0</b></button>
                         <button type="button" class="seq-filter-opt" data-filter="on" role="radio" aria-checked="false">Active <b id="seq-filter-n-on">0</b></button>
                         <button type="button" class="seq-filter-opt" data-filter="off" role="radio" aria-checked="false">Inactive <b id="seq-filter-n-off">0</b></button>
                      </div>
                      <div class="seq-toolbar-end">
                         <span class="seq-toolbar-hint"><i class="fa-solid fa-grip-vertical"></i>Drag &amp; drop cards to reorder</span>
                         <button type="button" class="seq-kill-btn" id="seq-kill-btn" title="Stop all ROS 2 processes, terminals and the ROS 2 daemon, then reload Nexus"><i class="fa-solid fa-skull"></i><span>Kill Daemon</span></button>
                      </div>
                   </div>`;

       // Header ein-/ausgeklappt (Netzwerk-Leiste), bleibt im Browser gespeichert
       let headerCollapsed = false;
       try { headerCollapsed = localStorage.getItem(POPUP_HEADER_COLLAPSED_KEY) === '1'; } catch (e) {}

       const modalHtml = `
          <div id="launch-modal" data-theme="${popupTheme}"${headerCollapsed ? ' class="is-header-collapsed"' : ''}>
             <div id="launch-modal-window">
                <div id="launch-modal-header">
                   <div class="modal-header-top">
                      <div class="modal-header-left">
                         <div class="modal-header-icon">
                            <i class="${headerIconClass}"></i>
                         </div>
                         <div class="modal-header-titles">
                            <h2 class="modal-header-title">${headerTitleText}</h2>
                            <span class="modal-header-sub">${modalTagText}<span id="modal-header-count"></span></span>
                         </div>
                         ${modeSwitchHtml}
                      </div>

                      <div class="modal-header-right">
                         ${themeSwitchHtml}
                         <label class="modal-select-all-btn" id="modal-select-all-lbl" title="Enable/disable all actions" ${isOverviewOnly ? 'style="display:none;"' : ''}>
                            <input type="checkbox" id="modal-select-all-cb">
                            <i class="fa-solid fa-check-double"></i>
                            <span id="modal-select-all-text">Select all</span>
                         </label>
                         <button class="modal-close-btn" id="modal-close-btn" title="Close (ESC)">
                            <i class="fa-solid fa-xmark"></i>
                         </button>
                      </div>
                   </div>

                   <div class="dds-bar">
                      <div class="dds-group">
                         <div class="dds-cell" title="Linux user running the Nexus Webapp. Launched terminals run as this user.">
                            <span class="dds-key"><i class="fa-solid fa-user"></i>User</span>
                            <span class="dds-val" id="dds-chip-user">–</span>
                            <span class="dds-desc" id="dds-chip-host">Host</span>
                         </div>
                         <div class="dds-cell" id="dds-chip-net-wrap" title="Default-route interface and IP. en… = Ethernet, wl… = Wi-Fi.">
                            <span class="dds-key"><i class="fa-solid fa-ethernet"></i><span id="dds-net-key">LAN</span></span>
                            <span class="dds-val" id="dds-chip-net">–</span>
                            <span class="dds-desc">Interface &amp; IP</span>
                         </div>
                         <div class="dds-cell dds-cell-traffic" id="dds-chip-traffic-wrap" title="Total LAN traffic of this PC (all programs, not just ROS). ↑ Send, ↓ Response.">
                            <div class="dds-cell-text">
                               <span class="dds-key"><i class="fa-solid fa-arrow-right-arrow-left"></i>Traffic</span>
                               <span class="dds-val" id="dds-chip-traffic">–</span>
                               <span class="dds-desc">Ethernet · ↑ Send ↓ Response</span>
                            </div>
                            <svg class="dds-spark" id="dds-traffic-spark" viewBox="0 0 120 24" preserveAspectRatio="none" aria-hidden="true"></svg>
                         </div>
                      </div>
                      <div class="dds-group">
                         <label class="dds-cell dds-cell-toggle" id="modal-localhost-lbl" title="ROS_LOCALHOST_ONLY=1: DDS traffic stays on this PC and does not flood the LAN.">
                            <span class="dds-key"><i class="fa-solid fa-shield-halved"></i>DDS</span>
                            <span class="dds-val"><span>Localhost only</span><input type="checkbox" class="dds-switch" role="switch" id="modal-localhost-cb" ${localhostOnly ? 'checked' : ''}></span>
                            <span class="dds-desc">Traffic stays on PC</span>
                         </label>
                         <div class="dds-cell" id="dds-chip-scope-wrap" title="Where the DDS traffic of launched nodes goes.">
                            <span class="dds-key"><i class="fa-solid fa-tower-broadcast"></i>Scope</span>
                            <span class="dds-val" id="dds-chip-scope">–</span>
                            <span class="dds-desc">Traffic destination</span>
                         </div>
                         <div class="dds-cell" title="RMW_IMPLEMENTATION: DDS middleware in use.">
                            <span class="dds-key"><i class="fa-solid fa-diagram-project"></i>RMW</span>
                            <span class="dds-val" id="dds-chip-rmw">–</span>
                            <span class="dds-desc">DDS middleware</span>
                         </div>
                         <div class="dds-cell" title="ROS_DOMAIN_ID: only nodes with the same ID see each other.">
                            <span class="dds-key"><i class="fa-solid fa-hashtag"></i>Domain ID</span>
                            <span class="dds-val" id="dds-chip-domain">–</span>
                            <span class="dds-desc">Node group ID</span>
                         </div>
                      </div>
                   </div>
                   <div class="modal-header-bottom">
                      ${toolbarHtml}
                      <div class="modal-header-actions">
                         <button type="button" class="modal-header-refresh-btn" id="modal-header-refresh-btn" title="Refresh popup" aria-label="Refresh popup">
                            <i class="fa-solid fa-rotate-right"></i>
                         </button>
                         <button type="button" class="modal-header-collapse-btn" id="modal-header-collapse-btn" aria-expanded="${!headerCollapsed}" title="${headerCollapsed ? 'Expand header' : 'Collapse header'}">
                            <i class="fa-solid fa-chevron-up"></i>
                         </button>
                      </div>
                   </div>
                </div>
                
                <div id="launch-modal-body"></div>
                
                <div id="launch-modal-footer">
                   <div class="modal-footer-status">
                      <div class="status-pulsing-dot"></div>
                      <span id="modal-footer-stats-text">${isOverviewOnly ? '16 system components available · Overview' : 'Ready to run'}</span>
                   </div>
                   
                   <div class="modal-footer-actions">
                      <button class="modal-cancel-btn" id="modal-cancel-btn">${isOverviewOnly ? 'Close' : 'Cancel'}</button>
                      <button id="launch-modal-start-btn" class="${isOverviewOnly ? 'is-hidden' : ''}${execMode ? ` is-${execMode}` : ''}">
                         <i class="fa-solid fa-play"></i> EXECUTE${execMode ? `<span class="exec-mode">${execMode.toUpperCase()}</span>` : ''}
                      </button>
                   </div>

                   <div class="modal-footer-tools">
                      <label class="modal-layout-lock-btn" id="modal-layout-lock-lbl" title="Lock/unlock card layout (drag & drop)">
                         <input type="checkbox" id="modal-layout-lock-cb">
                         <i class="fa-solid fa-lock-open" id="modal-layout-lock-icon"></i>
                         <span id="modal-layout-lock-text">Layout unlocked</span>
                      </label>
                   </div>
                </div>
             </div>
          </div>
       `;
       
       document.body.insertAdjacentHTML('beforeend', modalHtml);
       if (window.__seqModeSwitching) {
           window.__seqModeSwitching = false;
           const m = document.getElementById('launch-modal');
           if (m) m.classList.add('is-mode-switch');
       }
       const modalBodyEl = document.getElementById('launch-modal-body');
       if (modalBodyEl) {
           modalBodyEl.appendChild(contentClone);
           modalBodyEl.addEventListener('scroll', hideGlobalCmdTooltip, { passive: true });
       }
       
       let ddsStatusTimer = null;
       let ddsLastSample = null;
       let ddsStatus = null;

       // Verlauf des Gesamt-Traffics (TX + RX) fuer die Mini-Kurve im Header
       const ddsTrafficHistory = [];
       const renderTrafficSpark = () => {
           const svg = document.getElementById('dds-traffic-spark');
           if (!svg || ddsTrafficHistory.length < 2) return;
           const max = Math.max(...ddsTrafficHistory, 1);
           const step = 120 / (ddsTrafficHistory.length - 1);
           const pts = ddsTrafficHistory.map((v, i) =>
               [+(i * step).toFixed(1), +(22 - (v / max) * 19).toFixed(1)]);
           const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
           const last = pts[pts.length - 1];
           svg.innerHTML = `<path class="dds-spark-area" d="${line} L120 24 L0 24 Z"></path>`
               + `<path class="dds-spark-line" d="${line}"></path>`
               + `<circle class="dds-spark-dot" cx="${last[0]}" cy="${last[1]}" r="1.8"></circle>`;
       };

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
           if (localhostOnly) { text = 'localhost only'; cls = 'ok'; }
           else if (uri) { text = 'LAN · ' + uri.split('/').pop(); cls = 'info'; }
           else { text = 'LAN · Multicast'; cls = 'warn'; }
           el.textContent = text;
           wrap.dataset.state = cls;
       };

       // Linux-Interfacenamen lesbar machen, z. B. enp0s31f6 = Ethernet, PCI-Bus 0 / Slot 31 / Funktion 6
       const describeIface = (name) => {
           if (/^en/.test(name) || /^eth/.test(name)) {
               return 'Ethernet (LAN)';
           }
           if (/^wl/.test(name)) return 'Wi-Fi (WLAN)';
           if (/^ww/.test(name)) return 'cellular modem';
           if (/^(tun|tap|wg)/.test(name)) return 'VPN tunnel';
           if (/^(docker|br|virbr|veth)/.test(name)) return 'virtual bridge';
           if (name === 'lo') return 'Loopback';
           return 'network interface';
       };

       const refreshDdsStatus = async () => {
           try {
               const res = await fetch('/api/status');
               const st = await res.json();
               ddsStatus = st;
               const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
               set('dds-chip-domain', st.ros_domain_id || '–');
               set('dds-chip-rmw', (st.rmw_implementation || '–').replace(/^rmw_/, '').replace(/_cpp$/, ''));
               set('dds-net-key', st.net_iface ? describeIface(st.net_iface) : 'LAN');
               set('dds-chip-net', st.net_iface ? (st.net_ip || '–') : 'no network');
               const netWrap = document.getElementById('dds-chip-net-wrap');
               if (netWrap && st.net_iface) netWrap.title = `Default route: ${st.net_iface}. en… = Ethernet, wl… = Wi-Fi.`;
               set('dds-chip-user', st.user || '–');
               set('dds-chip-host', st.hostname ? '@ ' + st.hostname : 'Host');
               renderDdsScope();

               const trafficWrap = document.getElementById('dds-chip-traffic-wrap');
               if (st.tx_bytes != null && ddsLastSample && st.ts > ddsLastSample.ts) {
                   const dt = st.ts - ddsLastSample.ts;
                   const tx = (st.tx_bytes - ddsLastSample.tx) / dt;
                   const rx = (st.rx_bytes - ddsLastSample.rx) / dt;
                   set('dds-chip-traffic', `↑ ${fmtRate(tx)}  ↓ ${fmtRate(rx)}`);
                   ddsTrafficHistory.push(tx + rx);
                   if (ddsTrafficHistory.length > 30) ddsTrafficHistory.shift();
                   renderTrafficSpark();
                   // > 5 MB/s Senden bei deutlich weniger Empfang: typisches DDS-Flut-Muster
                   if (trafficWrap) trafficWrap.dataset.state = (tx > 5e6 && tx > rx * 5) ? 'warn' : 'ok';
               } else if (st.tx_bytes == null) {
                   set('dds-chip-traffic', 'n/a');
               } else {
                   set('dds-chip-traffic', 'measuring …');
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
           // Strg+Enter (Mac: Cmd+Enter) startet die Sequenz wie der EXECUTE-Button
           else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
               const btn = document.getElementById('launch-modal-start-btn');
               if (btn && !btn.classList.contains('is-hidden')) { e.preventDefault(); btn.click(); }
           }
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
       // Startseite (START-Button / App-Start) oeffnet den zuletzt genutzten DEV-Modus
       if (effPopupId === 'dev_fake' || effPopupId === 'dev_real') {
           try { localStorage.setItem('ros2_nexus_start_popup', effPopupId); } catch (err) {}
       }

       const modeSwitch = document.getElementById('seq-mode-switch');
       if (modeSwitch) {
           modeSwitch.querySelectorAll('.seq-mode-opt').forEach(optBtn => {
               optBtn.onclick = (e) => {
                   e.stopPropagation();
                   const pair = SEQ_MODE_PAIRS[effPopupId];
                   if (!pair || optBtn.dataset.mode === pair.mode) return;
                   const otherCard = findSeqModeCard(pair.other);
                   if (!otherCard) return;
                   closeModal();                      // speichert den aktuellen Modus
                   window.__seqModeSwitching = true;
                   otherCard.click();                 // oeffnet den anderen Modus
               };
           });
       }

       // Theme-Umschalter Dark / Light
       const themeSwitch = document.getElementById('seq-theme-switch');
       if (themeSwitch && modalRoot) {
           themeSwitch.querySelectorAll('.seq-theme-opt').forEach(optBtn => {
               optBtn.onclick = (e) => {
                   e.stopPropagation();
                   const t = optBtn.dataset.theme === 'light' ? 'light' : 'dark';
                   modalRoot.dataset.theme = t;
                   themeSwitch.querySelectorAll('.seq-theme-opt').forEach(b => {
                       const on = b === optBtn;
                       b.classList.toggle('is-active', on);
                       b.setAttribute('aria-checked', on);
                   });
                   try { localStorage.setItem(POPUP_THEME_KEY, t); } catch (err) {}
               };
           });
       }

       // Popup neu aufbauen: Stand speichern, schliessen und mit denselben
       // Daten wieder oeffnen; die Scroll-Position bleibt erhalten
       const headerRefreshBtn = document.getElementById('modal-header-refresh-btn');
       if (headerRefreshBtn) {
           headerRefreshBtn.onclick = (e) => {
               e.stopPropagation();
               const bodyEl = document.getElementById('launch-modal-body');
               const scrollTop = bodyEl ? bodyEl.scrollTop : 0;
               closeModal();
               openLaunchModal(wrapper, actionsData, toastMsg, popupId);
               requestAnimationFrame(() => {
                   const newBody = document.getElementById('launch-modal-body');
                   if (newBody) newBody.scrollTop = scrollTop;
               });
           };
       }

       // Header ein-/ausklappen
       const headerCollapseBtn = document.getElementById('modal-header-collapse-btn');
       if (headerCollapseBtn && modalRoot) {
           headerCollapseBtn.onclick = (e) => {
               e.stopPropagation();
               const collapsed = modalRoot.classList.toggle('is-header-collapsed');
               headerCollapseBtn.setAttribute('aria-expanded', !collapsed);
               headerCollapseBtn.title = collapsed ? 'Expand header' : 'Collapse header';
               try { localStorage.setItem(POPUP_HEADER_COLLAPSED_KEY, collapsed ? '1' : '0'); } catch (err) {}
           };
       }

       // Suche + Filter: blendet <li> nur aus (hidden), Reihenfolge und
       // Drag & Drop bleiben unberuehrt. Beim Abhaken einer Karte wird nicht
       // sofort neu gefiltert, damit sie nicht unter dem Mauszeiger verschwindet.
       const seqSearchInput = document.getElementById('seq-search-input');
       const seqKillBtn = document.getElementById('seq-kill-btn');
       if (seqKillBtn) seqKillBtn.addEventListener('click', () => { if (window.killAllROS2) window.killAllROS2(); });
       const seqFilter = document.getElementById('seq-filter');
       let seqFilterMode = 'all';
       const applySeqFilter = () => {
           const list = modalBodyEl ? modalBodyEl.querySelector('ul.seq-card-list') : null;
           if (!list) return;
           const q = (seqSearchInput ? seqSearchInput.value : '').trim().toLowerCase();
           let shown = 0;
           Array.from(list.children).forEach(li => {
               if (li.tagName !== 'LI') return;
               const cb = li.querySelector('.main-action-cb');
               const on = cb ? cb.checked : true;
               const head = li.querySelector('.seq-card-head');
               const hay = ((head ? head.textContent : li.textContent) + ' ' + (li.dataset.cmd || '')).toLowerCase();
               const visible = (seqFilterMode === 'all' || (seqFilterMode === 'on') === on) && (!q || hay.includes(q));
               li.hidden = !visible;
               if (visible) shown++;
           });
           let empty = modalBodyEl.querySelector('.seq-filter-empty');
           if (!shown) {
               if (!empty) {
                   empty = document.createElement('div');
                   empty.className = 'seq-filter-empty';
                   list.after(empty);
               }
               empty.textContent = q ? `No action matches "${q}".` : 'No actions in this filter.';
           } else if (empty) {
               empty.remove();
           }
       };
       if (seqSearchInput) {
           seqSearchInput.addEventListener('input', applySeqFilter);
           // ESC im Suchfeld leert erst die Suche, statt das Popup zu schliessen
           seqSearchInput.addEventListener('keydown', (e) => {
               if (e.key === 'Escape' && seqSearchInput.value) {
                   e.stopPropagation();
                   seqSearchInput.value = '';
                   applySeqFilter();
               }
           });
       }
       if (seqFilter) {
           seqFilter.querySelectorAll('.seq-filter-opt').forEach(optBtn => {
               optBtn.onclick = (e) => {
                   e.stopPropagation();
                   seqFilterMode = optBtn.dataset.filter;
                   seqFilter.querySelectorAll('.seq-filter-opt').forEach(b => {
                       const on = b === optBtn;
                       b.classList.toggle('is-active', on);
                       b.setAttribute('aria-checked', on);
                   });
                   applySeqFilter();
               };
           });
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
            updateVisionTreeNodes(mBody, initialIsIpCam);
            updateStaticObjectsTreeNodes(mBody, initialIsStaticObjects);
            updateLinearAxisTreeNodes(mBody, initialIsLinearAxis);
            setTimeout(() => {
                const mb = document.getElementById('launch-modal-body') || contentClone;
                updateVisionTreeNodes(mb, initialIsIpCam);
                updateStaticObjectsTreeNodes(mb, initialIsStaticObjects);
                updateLinearAxisTreeNodes(mb, initialIsLinearAxis);
            }, 100);
            setTimeout(() => {
                const mb = document.getElementById('launch-modal-body') || contentClone;
                updateVisionTreeNodes(mb, initialIsIpCam);
                updateStaticObjectsTreeNodes(mb, initialIsStaticObjects);
                updateLinearAxisTreeNodes(mb, initialIsLinearAxis);
            }, 300);
        });
       
       if (popupId) {
           const actualTopUl = contentClone.querySelector('ul');
           if (actualTopUl) {
               const seqSortable = new Sortable(actualTopUl, {
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
                           if (data.ok) showToast('✓ Layout saved');
                           else showToast('✗ Save failed', true);
                       } catch (err) {
                           showToast('✗ Save failed', true);
                       }
                       if (window.renderTab && typeof window.currentTab !== 'undefined') {
                           window.renderTab(window.currentTab);
                       }
                   }
               });

               // Layout-Lock: sperrt Drag & Drop der Karten, Zustand bleibt im Browser.
               const lockCb = document.getElementById('modal-layout-lock-cb');
               if (lockCb) {
                   const applyLock = (locked) => {
                       seqSortable.option('disabled', locked);
                       actualTopUl.classList.toggle('is-layout-locked', locked);
                       const icon = document.getElementById('modal-layout-lock-icon');
                       const txt = document.getElementById('modal-layout-lock-text');
                       if (icon) icon.className = locked ? 'fa-solid fa-lock' : 'fa-solid fa-lock-open';
                       if (txt) txt.textContent = locked ? 'Layout locked' : 'Layout unlocked';
                   };
                   let locked = false;
                   try { locked = localStorage.getItem('ros2_nexus_popup_layout_locked') === '1'; } catch (e) {}
                   lockCb.checked = locked;
                   applyLock(locked);
                   lockCb.addEventListener('change', () => {
                       applyLock(lockCb.checked);
                       try { localStorage.setItem('ros2_nexus_popup_layout_locked', lockCb.checked ? '1' : '0'); } catch (e) {}
                   });
               }
           }
       }
       if (!popupId) {
           const lockLbl = document.getElementById('modal-layout-lock-lbl');
           if (lockLbl) lockLbl.style.display = 'none';
       }
       
       const startBtn = document.getElementById('launch-modal-start-btn');
       startBtn.addEventListener('click', async () => {
          saveActiveState();
          closeModal();
          if (actionsData.length > 0 && toastMsg) showToast(toastMsg);

          const linearAxisNode = actionsData.find(a => a.cmd && a.cmd.includes('fake_linear_axis'));
          const isLinearAxisNodeActive = linearAxisNode ? linearAxisNode.active : true;
          
          for (const action of actionsData) {
              if (!action.active) continue;
              const { cmd: finalCmd, title: finalTitle } = resolveLaunch(action, isLinearAxisNodeActive);

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

