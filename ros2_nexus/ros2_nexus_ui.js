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




    function getSavedArgState(popupId, cmd, baseCmd, argText) {
        const keysToCheck = [cmd, baseCmd].filter(Boolean);
        
        // 1. Check popup-specific args in window.TABS
        if (popupId && window.TABS && window.TABS['__popups_args'] && window.TABS['__popups_args'][popupId]) {
            const popupArgs = window.TABS['__popups_args'][popupId];
            for (const k of keysToCheck) {
                if (popupArgs[k] && popupArgs[k][argText] !== undefined) {
                    return popupArgs[k][argText];
                }
            }
        }
        
        // 2. Check global __cmd_args in window.TABS
        if (window.TABS && window.TABS['__cmd_args']) {
            for (const k of keysToCheck) {
                if (window.TABS['__cmd_args'][k] && window.TABS['__cmd_args'][k][argText] !== undefined) {
                    return window.TABS['__cmd_args'][k][argText];
                }
            }
        }

        // 3. Check localStorage
        try {
            const localPopups = JSON.parse(localStorage.getItem('ros2_nexus_popups_args') || '{}');
            if (popupId && localPopups[popupId]) {
                for (const k of keysToCheck) {
                    if (localPopups[popupId][k] && localPopups[popupId][k][argText] !== undefined) {
                        return localPopups[popupId][k][argText];
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

        // Default:
        if (argText.startsWith('yolo_model:=')) {
            return argText === 'yolo_model:=yolov8l.pt';
        }
        if (argText === 'use_zed_hardware:=false') {
            return false;
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
                    const targetCenterY = (targetRect.top + targetRect.height / 2) - middleColRect.top;
                    const labelHeight = labelRect.height || 32;
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
       
       let activeSet = null;
       if (window.TABS && window.TABS['__popups_active'] && window.TABS['__popups_active'][effPopupId]) {
           activeSet = new Set(window.TABS['__popups_active'][effPopupId]);
       } else {
           try {
               const localActive = JSON.parse(localStorage.getItem('ros2_nexus_popups_active') || '{}');
               if (localActive[effPopupId]) {
                   activeSet = new Set(localActive[effPopupId]);
               }
           } catch(e) {}
       }
       
       actionsData.forEach(a => { 
           if (activeSet) {
               a.active = activeSet.has(a.cmd); 
           } else {
               a.active = true; 
           }
           a.baseCmd = a.cmd; 
           a.args = []; 
       });
       
       const saveActiveState = () => {
           const activeCmds = [];
           const topUl = document.getElementById('launch-modal-body') ? document.getElementById('launch-modal-body').querySelector('ul') : null;
           if (topUl) {
               topUl.querySelectorAll('li').forEach(item => {
                   const cb = item.querySelector('.main-action-cb');
                   if (cb && cb.checked && item.dataset.cmd) {
                       activeCmds.push(item.dataset.cmd);
                   }
               });
           }
           
           // Sync with actionsData
           actionsData.forEach(a => {
               if (topUl && a.cmd) {
                   a.active = activeCmds.includes(a.cmd);
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

           window.TABS['__popups_active'][effPopupId] = activeCmds;
           window.TABS['__popups_args'][effPopupId] = Object.assign(window.TABS['__popups_args'][effPopupId] || {}, currentArgsState);

           Object.keys(currentArgsState).forEach(k => {
               window.TABS['__cmd_args'][k] = Object.assign(window.TABS['__cmd_args'][k] || {}, currentArgsState[k]);
           });

           // LocalStorage backup
           try {
               localStorage.setItem('ros2_nexus_popups_active', JSON.stringify(window.TABS['__popups_active']));
               localStorage.setItem('ros2_nexus_popups_args', JSON.stringify(window.TABS['__popups_args']));
               localStorage.setItem('ros2_nexus_cmd_args', JSON.stringify(window.TABS['__cmd_args']));
           } catch (e) {}

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

            const tunerAction = actionsData.find(act => act.cmd && act.cmd.includes('rviz_linear_axis_tuner'));
            if (tunerAction) {
                tunerAction.active = isLinearAxisActive;
            }

            const modalBody = document.getElementById('launch-modal-body');
            if (modalBody) {
                modalBody.querySelectorAll('li').forEach(liEl => {
                    if (liEl.dataset.cmd && liEl.dataset.cmd.includes('rviz_linear_axis_tuner')) {
                        const cb = liEl.querySelector('.main-action-cb');
                        if (cb && cb.checked !== isLinearAxisActive) {
                            cb.checked = isLinearAxisActive;
                            liEl.classList.toggle('card-active', isLinearAxisActive);
                            liEl.classList.toggle('card-inactive', !isLinearAxisActive);
                        }
                    }
                });
                modalBody.querySelectorAll('label.param-chip, label').forEach(lbl => {
                    const span = lbl.querySelector('span');
                    const cb = lbl.querySelector('input');
                    if (span && span.textContent.includes('linear_axis') && cb) {
                        cb.checked = isLinearAxisActive;
                        lbl.classList.toggle('chip-inactive', !isLinearAxisActive);
                    }
                });
            }
            updateModalStats();
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
                    const tunerNode = actionsData.find(a => a.cmd && a.cmd.includes('rviz_linear_axis_tuner'));
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

           // Ensure ZED M YOLO models and use_zed_hardware args are available for zed_cam_rviz_pointcloud_tf_yolo_planned_grasp
           if (action.baseCmd && action.baseCmd.includes('zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py')) {
               const zedDefaults = [
                   'yolo_model:=yolov8l.pt',
                   'yolo_model:=yolov8s.pt',
                   'yolo_model:=my_yolo_model.pt',
                   'use_zed_hardware:=false'
               ];
               zedDefaults.forEach(defArg => {
                   if (!action.args.some(a => a.text === defArg)) {
                       const isChecked = getSavedArgState(effPopupId, action.cmd, action.baseCmd, defArg);
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
                // Ensure at most one yolo_model:= arg is checked initially
                const checkedYoloModels = action.args.filter(a => a.text.startsWith('yolo_model:=') && a.checked);
                if (checkedYoloModels.length > 1) {
                    const preferred = checkedYoloModels.find(a => a.text === 'yolo_model:=yolov8l.pt') || checkedYoloModels[0];
                    checkedYoloModels.forEach(a => { if (a !== preferred) a.checked = false; });
                }

                // Put yolo_model args first, use_zed_hardware after
                action.args.sort((a, b) => {
                    const isYoloA = a.text.startsWith('yolo_model:=');
                    const isYoloB = b.text.startsWith('yolo_model:=');
                    const isZedHwA = a.text.startsWith('use_zed_hardware');
                    const isZedHwB = b.text.startsWith('use_zed_hardware');
                    if (isYoloA && !isYoloB) return -1;
                    if (!isYoloA && isYoloB) return 1;
                    if (isZedHwA && !isZedHwB) return 1;
                    if (!isZedHwA && isZedHwB) return -1;
                    return 0;
                });

                action.args.forEach(argObj => {
                    const argLbl = document.createElement('label');
                    argLbl.className = 'param-chip' + (argObj.checked ? '' : ' chip-inactive');
                    argLbl.dataset.argText = argObj.text;
                    
                    const argCb = document.createElement('input');
                    argCb.type = 'checkbox';
                    argCb.checked = !!argObj.checked;
                    
                    argCb.onclick = (e) => e.stopPropagation();
                    argCb.onchange = (e) => {
                        argObj.checked = e.target.checked;
                        argLbl.classList.toggle('chip-inactive', !e.target.checked);
                        
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
          topUl.style.cssText = 'width: 100%; max-width: 1220px; margin: 0 auto; list-style: none; padding: 0; display: flex; flex-direction: column; gap: 12px;';
          
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
              cardLayout.style.cssText = 'display: flex; width: 100%; justify-content: space-between; align-items: stretch; gap: 24px; flex: 1; min-width: 0;';
              
              const leftCol = document.createElement('div');
              leftCol.className = 'modal-card-left-col';
              leftCol.style.cssText = 'display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 0;';
              
              const titleDiv = document.createElement('div');
              titleDiv.style.cssText = 'display: flex; align-items: center; gap: 8px; min-height: 32px; flex-wrap: wrap;';
              
              const ulNode = Array.from(li.childNodes).find(n => n.tagName === 'UL');
              Array.from(li.childNodes).forEach(node => {
                  if (node !== ulNode) {
                      if (node.nodeType === 1 && node.style.float === 'right') {
                          node.style.float = 'none';
                          node.style.marginLeft = '8px';
                      }
                      titleDiv.appendChild(node);
                  }
              });
              
              leftCol.appendChild(titleDiv);
              if (ulNode) {
                  ulNode.style.marginLeft = '20px';
                  leftCol.appendChild(ulNode);
              }

              const middleCol = document.createElement('div');
              middleCol.className = 'modal-card-middle-col';
              if (isLaunchCard) middleCol.classList.add('has-divider-v');
              
              const spacer = document.createElement('div');
              spacer.className = 'modal-params-header';
              spacer.innerHTML = `<i class="fa-solid fa-sliders" style="font-size:11px; color:var(--accent);"></i> <span>PARAMETERS &amp; ARGS</span>`;
              middleCol.appendChild(spacer);
              
              const argsDiv = createArgsDiv(action);
              middleCol.appendChild(argsDiv);
              
              const badgeContainer = document.createElement('div');
              badgeContainer.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-left: auto; flex-shrink: 0;';
              titleDiv.appendChild(badgeContainer);

              let isRos2 = (action && action.cmd && action.cmd.startsWith('ros2 run')) || (cmdToDisplay && cmdToDisplay.startsWith('ros2 run'));
              if (isRos2) {
                  const ros2Badge = document.createElement('div');
                  ros2Badge.innerHTML = `<i class="fa-solid fa-robot"></i> ROS 2`;
                  ros2Badge.style.cssText = 'background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.35); border-radius:5px; padding:3px 7px; font-size:10px; color:#93c5fd; font-weight:bold; letter-spacing:0.5px; display:flex; align-items:center; gap:5px; flex-shrink:0;';
                  badgeContainer.appendChild(ros2Badge);
              }
              
              let hasPython3 = (action && action.cmd && action.cmd.includes('python3')) || (cmdToDisplay && cmdToDisplay.includes('python3'));
              if (hasPython3) {
                  const pythonBadge = document.createElement('div');
                  pythonBadge.innerHTML = `<i class="fa-brands fa-python"></i> Python3`;
                  pythonBadge.style.cssText = 'background:rgba(234,179,8,0.15); border:1px solid rgba(234,179,8,0.35); border-radius:5px; padding:3px 7px; font-size:10px; color:#fde047; font-weight:bold; letter-spacing:0.5px; display:flex; align-items:center; gap:5px; flex-shrink:0;';
                  badgeContainer.appendChild(pythonBadge);
              }
              
              let hasChrome = (action && action.cmd && (action.cmd.includes('google-chrome') || action.cmd.includes('chromium-browser'))) || (cmdToDisplay && (cmdToDisplay.includes('google-chrome') || cmdToDisplay.includes('chromium-browser')));
              if (hasChrome) {
                  const chromeBadge = document.createElement('div');
                  chromeBadge.innerHTML = `<i class="fa-brands fa-chrome"></i> +CHROME`;
                  chromeBadge.style.cssText = 'background:rgba(66,133,244,0.15); border:1px solid rgba(66,133,244,0.35); border-radius:5px; padding:3px 7px; font-size:10px; color:#4285F4; font-weight:bold; letter-spacing:0.5px; display:flex; align-items:center; gap:5px; flex-shrink:0;';
                  badgeContainer.appendChild(chromeBadge);
              }
              
              const cmdBadge1 = document.createElement('div');
              cmdBadge1.className = 'modal-cmd-btn';
              cmdBadge1.innerHTML = `<i class="fa-solid fa-terminal" style="font-size:10px; color:#38bdf8;"></i> CMD<div class="cmd-tooltip" style="position:absolute; background:rgba(15,23,42,0.96); border:1px solid rgba(56,189,248,0.4); border-radius:8px; padding:10px 14px; font-size:11px; color:#f8fafc; white-space:pre-wrap; overflow-wrap:break-word; width:360px; text-align:left; pointer-events:none; opacity:0; transition:opacity 0.15s ease; box-shadow:0 8px 24px rgba(0,0,0,0.6); z-index:999999; font-family:var(--font-mono); letter-spacing:0; line-height:1.4;">${cmdToDisplay.replace(/"/g, '&quot;')}</div>`;
              cmdBadge1.onmouseover = (e) => {
                  const tooltip = cmdBadge1.querySelector('.cmd-tooltip');
                  tooltip.style.opacity = '1';
                  const rect = cmdBadge1.getBoundingClientRect();
                  tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
                  tooltip.style.top = (e.clientY - rect.top + 15) + 'px';
              };
              cmdBadge1.onmousemove = (e) => {
                  const tooltip = cmdBadge1.querySelector('.cmd-tooltip');
                  const rect = cmdBadge1.getBoundingClientRect();
                  tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
                  tooltip.style.top = (e.clientY - rect.top + 15) + 'px';
              };
              cmdBadge1.onmouseout = () => {
                  cmdBadge1.querySelector('.cmd-tooltip').style.opacity = '0';
              };
              cmdBadge1.onclick = (e) => {
                  e.stopPropagation();
                  const cmdToCopy = rawCmdData ? rawCmdData : (action ? action.cmd : text);
                  navigator.clipboard.writeText(cmdToCopy).then(() => {
                      const icon = cmdBadge1.querySelector('i');
                      icon.className = 'fa-solid fa-check';
                      icon.style.color = '#10b981';
                      showToast('✓ Befehl in Zwischenablage kopiert');
                      setTimeout(() => {
                          icon.className = 'fa-solid fa-terminal';
                          icon.style.color = '#38bdf8';
                      }, 1500);
                  });
              };
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
              
              const mainCb = document.createElement('input');
              mainCb.type = 'checkbox';
              mainCb.className = 'main-action-cb';
              mainCb.checked = action ? action.active : (activeSet ? activeSet.has(li.dataset.cmd) : false);

              li.className = 'modal-action-card ' + (mainCb.checked ? 'card-active' : 'card-inactive');
              mainCb.onclick = (e) => e.stopPropagation();
              mainCb.onchange = (e) => {
                  if (action) action.active = e.target.checked;
                  li.classList.toggle('card-active', e.target.checked);
                  li.classList.toggle('card-inactive', !e.target.checked);
                  
                  if (action && (action.cmd.includes('rviz_linear_axis_tuner') || action.cmd.includes('linear_axis'))) {
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
              
              cardLayout.appendChild(leftCol);
              cardLayout.appendChild(middleCol);

              const cbContainer = document.createElement('div');
              cbContainer.className = 'modal-cb-wrap';
              cbContainer.appendChild(mainCb);

              const liInnerWrapper = document.createElement('div');
              liInnerWrapper.style.cssText = 'display: flex; align-items: stretch; width: 100%; gap: 14px;';
              liInnerWrapper.appendChild(cbContainer);
              liInnerWrapper.appendChild(cardLayout);
              
              li.insertBefore(liInnerWrapper, li.firstChild);
              
              if (isLaunchCard) {
                  const hrLine = document.createElement('div');
                  hrLine.style.position = 'absolute';
                  hrLine.style.top = '48px';
                  hrLine.style.left = '52px';
                  hrLine.style.width = 'calc(100% - 70px)';
                  hrLine.style.height = '1px';
                  hrLine.style.background = 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.22) 15%, rgba(255, 255, 255, 0.22) 85%, transparent 100%)';
                  hrLine.style.pointerEvents = 'none';
                  li.appendChild(hrLine);
              }
          });
          
              // Append any unmatched actions to the bottom to ensure nothing is missing
          const unmatchedActions = actionsData.filter(a => !matchedCmds.has(a.cmd));
          unmatchedActions.forEach(action => {
              const li = document.createElement('li');
              li.dataset.cmd = action.cmd;
              parseArgs(action);
              let isActive = activeSet ? activeSet.has(li.dataset.cmd) : false;
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
              cardLayout.style.cssText = 'display: flex; width: 100%; justify-content: space-between; align-items: stretch; gap: 24px; flex: 1; min-width: 0;';
              
              const leftCol = document.createElement('div');
              leftCol.className = 'modal-card-left-col';
              leftCol.style.cssText = 'display: flex; flex-direction: column; gap: 10px; flex: 1; min-width: 0;';
              
              const titleDiv = document.createElement('div');
              titleDiv.style.cssText = 'display: flex; align-items: center; gap: 8px; min-height: 32px; flex-wrap: wrap;';
              titleDiv.innerHTML = `${baseHtml}<span style="color: var(--c-launch); font-weight: 600; font-size: 14px;">${cmdName}</span> <span style="color: #64748b; font-size: 11px; margin-left: 6px;">(Auto-Added)</span>`;
              leftCol.appendChild(titleDiv);
              
              const isLaunchCard2 = action.cmd.startsWith('ros2 launch');
              const middleCol = document.createElement('div');
              middleCol.className = 'modal-card-middle-col';
              if (isLaunchCard2) middleCol.classList.add('has-divider-v');
              
              const spacer = document.createElement('div');
              spacer.className = 'modal-params-header';
              spacer.innerHTML = `<i class="fa-solid fa-sliders" style="font-size:11px; color:var(--accent);"></i> <span>PARAMETERS &amp; ARGS</span>`;
              middleCol.appendChild(spacer);
              
              const argsDiv = createArgsDiv(action);
              middleCol.appendChild(argsDiv);
              
              const badgeContainer = document.createElement('div');
              badgeContainer.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-left: auto; flex-shrink: 0;';
              
              if (action.cmd.startsWith('ros2 run')) {
                  const ros2Badge2 = document.createElement('div');
                  ros2Badge2.innerHTML = `<i class="fa-solid fa-robot"></i> ROS 2`;
                  ros2Badge2.style.cssText = 'background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.35); border-radius:5px; padding:3px 7px; font-size:10px; color:#93c5fd; font-weight:bold; letter-spacing:0.5px; display:flex; align-items:center; gap:5px; flex-shrink:0;';
                  badgeContainer.appendChild(ros2Badge2);
              }
              if (action.cmd.includes('python3')) {
                  const pythonBadge2 = document.createElement('div');
                  pythonBadge2.innerHTML = `<i class="fa-brands fa-python"></i> Python3`;
                  pythonBadge2.style.cssText = 'background:rgba(234,179,8,0.15); border:1px solid rgba(234,179,8,0.35); border-radius:5px; padding:3px 7px; font-size:10px; color:#fde047; font-weight:bold; letter-spacing:0.5px; display:flex; align-items:center; gap:5px; flex-shrink:0;';
                  badgeContainer.appendChild(pythonBadge2);
              }
              if (action.cmd.includes('google-chrome') || action.cmd.includes('chromium-browser')) {
                  const chromeBadge2 = document.createElement('div');
                  chromeBadge2.innerHTML = `<i class="fa-brands fa-chrome"></i> +CHROME`;
                  chromeBadge2.style.cssText = 'background:rgba(66,133,244,0.15); border:1px solid rgba(66,133,244,0.35); border-radius:5px; padding:3px 7px; font-size:10px; color:#4285F4; font-weight:bold; letter-spacing:0.5px; display:flex; align-items:center; gap:5px; flex-shrink:0;';
                  badgeContainer.appendChild(chromeBadge2);
              }
              
              const cmdBadge1 = document.createElement('div');
              cmdBadge1.className = 'modal-cmd-btn';
              cmdBadge1.innerHTML = `<i class="fa-solid fa-terminal" style="font-size:10px; color:#38bdf8;"></i> CMD<div class="cmd-tooltip" style="position:absolute; background:rgba(15,23,42,0.96); border:1px solid rgba(56,189,248,0.4); border-radius:8px; padding:10px 14px; font-size:11px; color:#f8fafc; white-space:pre-wrap; overflow-wrap:break-word; width:360px; text-align:left; pointer-events:none; opacity:0; transition:opacity 0.15s ease; box-shadow:0 8px 24px rgba(0,0,0,0.6); z-index:999999; font-family:var(--font-mono); letter-spacing:0; line-height:1.4;">${action.cmd.replace(/"/g, '&quot;')}</div>`;
              cmdBadge1.onmouseover = (e) => {
                  const tooltip = cmdBadge1.querySelector('.cmd-tooltip');
                  tooltip.style.opacity = '1';
                  const rect = cmdBadge1.getBoundingClientRect();
                  tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
                  tooltip.style.top = (e.clientY - rect.top + 15) + 'px';
              };
              cmdBadge1.onmousemove = (e) => {
                  const tooltip = cmdBadge1.querySelector('.cmd-tooltip');
                  const rect = cmdBadge1.getBoundingClientRect();
                  tooltip.style.left = (e.clientX - rect.left + 15) + 'px';
                  tooltip.style.top = (e.clientY - rect.top + 15) + 'px';
              };
              cmdBadge1.onmouseout = () => {
                  cmdBadge1.querySelector('.cmd-tooltip').style.opacity = '0';
              };
              cmdBadge1.onclick = (e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(action.cmd).then(() => {
                      const icon = cmdBadge1.querySelector('i');
                      icon.className = 'fa-solid fa-check';
                      icon.style.color = '#10b981';
                      showToast('✓ Befehl in Zwischenablage kopiert');
                      setTimeout(() => {
                          icon.className = 'fa-solid fa-terminal';
                          icon.style.color = '#38bdf8';
                      }, 1500);
                  });
              };
              badgeContainer.appendChild(cmdBadge1);
              
              titleDiv.appendChild(badgeContainer);
              
              const mainCb = document.createElement('input');
              mainCb.type = 'checkbox';
              mainCb.className = 'main-action-cb';
              mainCb.checked = isActive;
              mainCb.onclick = (e) => e.stopPropagation();
              mainCb.onchange = (e) => {
                  action.active = e.target.checked;
                  li.classList.toggle('card-active', e.target.checked);
                  li.classList.toggle('card-inactive', !e.target.checked);
                  if (action && (action.cmd.includes("rviz_linear_axis_tuner") || action.cmd.includes("linear_axis"))) {
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
              
              const cbContainer = document.createElement('div');
              cbContainer.className = 'modal-cb-wrap';
              cbContainer.appendChild(mainCb);
              
              cardLayout.appendChild(leftCol);
              cardLayout.appendChild(middleCol);
              
              const liInnerWrapper = document.createElement('div');
              liInnerWrapper.style.cssText = 'display: flex; align-items: stretch; width: 100%; gap: 14px;';
              liInnerWrapper.appendChild(cbContainer);
              liInnerWrapper.appendChild(cardLayout);
              
              li.appendChild(liInnerWrapper);
              
              if (isLaunchCard2) {
                  const hrLine2 = document.createElement('div');
                  hrLine2.style.position = 'absolute';
                  hrLine2.style.top = '48px';
                  hrLine2.style.left = '52px';
                  hrLine2.style.width = 'calc(100% - 70px)';
                  hrLine2.style.height = '1px';
                  hrLine2.style.background = 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.22) 15%, rgba(255, 255, 255, 0.22) 85%, transparent 100%)';
                  hrLine2.style.pointerEvents = 'none';
                  li.appendChild(hrLine2);
              }
              
              topUl.appendChild(li);
          });
       } else {
           contentClone.className = 'modal-action-card card-active';
           contentClone.style.cssText = 'width: 100%; max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; padding: 18px 24px;';
           
           if (actionsData[0]) {
               parseArgs(actionsData[0]);
               const argsDiv = createArgsDiv(actionsData[0]);
               if (actionsData[0].args.length > 0) {
                   argsDiv.style.marginTop = '10px';
                   argsDiv.style.justifyContent = 'flex-start';
                   contentClone.appendChild(argsDiv);
               }
           }
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
       document.getElementById('launch-modal-body').appendChild(contentClone);
       
       const closeModal = () => {
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
       
       requestAnimationFrame(() => {
           alignModalArgs(contentClone);
           setTimeout(() => alignModalArgs(contentClone), 100);
           setTimeout(() => alignModalArgs(contentClone), 300);
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

          const linearAxisNode = actionsData.find(a => a.cmd && a.cmd.includes('rviz_linear_axis_tuner'));
          const isLinearAxisNodeActive = linearAxisNode ? linearAxisNode.active : true;
          
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
                  body: JSON.stringify({ command: finalCmd, title: finalTitle, mode: "ros" })
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

