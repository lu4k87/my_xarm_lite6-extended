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
                    zedHwLabel.style.left = '16px';
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
                            liEl.style.opacity = isLinearAxisActive ? '1' : '0.4';
                        }
                    }
                });
                modalBody.querySelectorAll('label').forEach(lbl => {
                    const span = lbl.querySelector('span');
                    const cb = lbl.querySelector('input');
                    if (span && span.textContent.includes('linear_axis') && cb) {
                        cb.checked = isLinearAxisActive;
                        lbl.style.opacity = isLinearAxisActive ? '1' : '0.4';
                        lbl.style.borderColor = isLinearAxisActive ? 'rgba(0,255,102,0.3)' : 'rgba(255,255,255,0.1)';
                    }
                });
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
           argsDiv.style.flex = '1';
           argsDiv.style.display = 'flex';
           argsDiv.style.flexDirection = 'column'; // Stack vertically
           argsDiv.style.gap = '8px';
           argsDiv.style.alignItems = 'flex-start';
           argsDiv.style.marginTop = '8px';
           
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
                   argLbl.style.cssText = 'display:flex; align-items:center; gap:8px; font-size:13.5px; font-weight:500; color:var(--accent); background:rgba(0,255,102,0.1); padding:6px 12px; border-radius:6px; border:1px solid rgba(0,255,102,0.3); cursor:pointer; transition:all 0.2s; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; max-width:100%;';
                   
                   const argCb = document.createElement('input');
                   argCb.type = 'checkbox';
                   argCb.checked = !!argObj.checked;
                   argCb.style.cssText = 'accent-color:#00FF66; cursor:pointer; flex-shrink:0; width:16px; height:16px;';
                   
                   argLbl.style.opacity = argObj.checked ? '1' : '0.4';
                   argLbl.style.borderColor = argObj.checked ? 'rgba(0,255,102,0.3)' : 'rgba(255,255,255,0.1)';

                   argCb.onclick = (e) => e.stopPropagation();
                   argCb.onchange = (e) => {
                       argObj.checked = e.target.checked;
                       
                       // Mutually exclusive yolo_model selection
                       if (e.target.checked && argObj.text.startsWith('yolo_model:=')) {
                           action.args.forEach(otherArg => {
                               if (otherArg !== argObj && otherArg.text.startsWith('yolo_model:=')) {
                                   otherArg.checked = false;
                               }
                           });
                           argsDiv.querySelectorAll('label').forEach(lbl => {
                               const cb = lbl.querySelector('input');
                               const txtSpan = lbl.querySelector('span');
                               if (txtSpan && cb) {
                                   const matchArg = action.args.find(a => a.text === txtSpan.textContent);
                                   if (matchArg) {
                                       cb.checked = matchArg.checked;
                                       lbl.style.opacity = matchArg.checked ? '1' : '0.4';
                                       lbl.style.borderColor = matchArg.checked ? 'rgba(0,255,102,0.3)' : 'rgba(255,255,255,0.1)';
                                   }
                               }
                           });
                       } else {
                           argLbl.style.opacity = e.target.checked ? '1' : '0.4';
                           argLbl.style.borderColor = e.target.checked ? 'rgba(0,255,102,0.3)' : 'rgba(255,255,255,0.1)';
                       }

                       // Linear Axis dynamic title and checkbox synchronization
                       if (argObj.text.includes('linear_axis')) {
                           const isChecked = e.target.checked;
                           actionsData.forEach(act => {
                               if (act.args) {
                                   act.args.forEach(a => {
                                       if (a.text.includes('linear_axis')) {
                                           a.checked = isChecked;
                                       }
                                   });
                               }
                               if (act.title && (act.cmd.includes('servo') || act.cmd.includes('move_group') || act.cmd.includes('standalone_move_group') || act.title.toLowerCase().includes('linear axis'))) {
                                   if (!isChecked) {
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
                               tunerAction.active = isChecked;
                               const topUl = document.getElementById('launch-modal-body') ? document.getElementById('launch-modal-body').querySelector('ul') : null;
                               if (topUl) {
                                   topUl.querySelectorAll('li').forEach(liEl => {
                                       if (liEl.dataset.cmd && liEl.dataset.cmd.includes('rviz_linear_axis_tuner')) {
                                           const cb = liEl.querySelector('.main-action-cb');
                                           if (cb) cb.checked = isChecked;
                                           liEl.style.opacity = isChecked ? '1' : '0.4';
                                       }
                                   });
                               }
                           }

                           const modalBody = document.getElementById('launch-modal-body');
                           if (modalBody) {
                               modalBody.querySelectorAll('label').forEach(lbl => {
                                   const span = lbl.querySelector('span');
                                   const cb = lbl.querySelector('input');
                                   if (span && span.textContent.includes('linear_axis') && cb) {
                                       cb.checked = isChecked;
                                       lbl.style.opacity = isChecked ? '1' : '0.4';
                                       lbl.style.borderColor = isChecked ? 'rgba(0,255,102,0.3)' : 'rgba(255,255,255,0.1)';
                                   }
                               });
                           }
                       }
                       
                       saveActiveState();
                   };
                   
                   const txtSpan = document.createElement('span');
                   txtSpan.style.overflow = 'hidden';
                   txtSpan.style.textOverflow = 'ellipsis';
                   txtSpan.style.whiteSpace = 'nowrap';
                   txtSpan.textContent = argObj.text;
                   
                   argLbl.appendChild(argCb);
                   argLbl.appendChild(txtSpan);
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
          topUl.style.margin = '0 auto';
          topUl.style.width = '85%';
          
          const selectAllDiv = document.createElement('div');
          selectAllDiv.style.cssText = 'display:flex; justify-content:flex-end; align-items:center; margin:0 auto -5px auto; padding-right:5px; width:85%;';
          const selectAllLabel = document.createElement('label');
          selectAllLabel.style.cssText = 'display:flex; align-items:center; gap:8px; font-size:12px; color:var(--mut); cursor:pointer; font-weight:bold; letter-spacing:1px; text-transform:uppercase;';
          const selectAllCb = document.createElement('input');
          selectAllCb.type = 'checkbox';
          selectAllCb.checked = false;
          selectAllCb.style.cssText = 'accent-color:#00FF66; cursor:pointer; width:16px; height:16px; filter: drop-shadow(0 0 4px rgba(0,255,102,0.4));';
          selectAllCb.onchange = (e) => {
              const targetChecked = e.target.checked;
              Array.from(topUl.querySelectorAll('.main-action-cb')).forEach(cb => {
                  if (cb.checked !== targetChecked) {
                      cb.checked = targetChecked;
                      // Trigger only visually and update action state
                      const ev = new Event('change');
                      ev.simulated = true;
                      cb.dispatchEvent(ev);
                  }
              });
              selectAllCb.checked = targetChecked;
              saveActiveState();
          };
          selectAllLabel.appendChild(selectAllCb);
          selectAllLabel.appendChild(document.createTextNode('Select All'));
          selectAllDiv.appendChild(selectAllLabel);
          contentClone.insertBefore(selectAllDiv, topUl);
          
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
              
              // Build Flex Layout
              const cardLayout = document.createElement('div');
              cardLayout.className = 'modal-card-layout';
              cardLayout.style.display = 'flex';
              cardLayout.style.width = '100%';
              cardLayout.style.justifyContent = 'space-between';
              cardLayout.style.alignItems = 'stretch';
              cardLayout.style.gap = '30px';
              
              const leftCol = document.createElement('div');
              leftCol.className = 'modal-card-left-col';
              leftCol.style.display = 'flex';
              leftCol.style.flexDirection = 'column';
              leftCol.style.gap = '16px';
              leftCol.style.flex = '1';
              
              const titleDiv = document.createElement('div');
              titleDiv.style.display = 'flex';
              titleDiv.style.alignItems = 'center';
              titleDiv.style.gap = '8px';
              titleDiv.style.minHeight = '32px'; // Height for 1st row
              
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
              
              const rawCmdData = li.getAttribute('data-raw-cmd');
              const cmdToDisplay = (action && action.cmd) ? action.cmd : (rawCmdData ? rawCmdData : (li.dataset.cmd || ''));
              const isLaunchCard = (action && action.cmd && action.cmd.startsWith('ros2 launch')) || (cmdToDisplay && cmdToDisplay.startsWith('ros2 launch'));

              const middleCol = document.createElement('div');
              middleCol.className = 'modal-card-middle-col';
              middleCol.style.flex = '0 0 280px'; // Width for args and parameters
              middleCol.style.display = 'flex';
              middleCol.style.flexDirection = 'column';
              middleCol.style.borderLeft = isLaunchCard ? '1px solid rgba(255, 255, 255, 0.35)' : 'none';
              middleCol.style.padding = '0 20px';
              middleCol.style.minWidth = '0';
              
              const spacer = document.createElement('div');
              spacer.style.height = '32px';
              spacer.style.flexShrink = '0';
              spacer.style.display = 'flex';
              spacer.style.alignItems = 'center';
              spacer.style.fontSize = '12px';
              spacer.style.fontWeight = 'bold';
              spacer.style.color = 'var(--mut)';
              spacer.style.textTransform = 'uppercase';
              spacer.style.letterSpacing = '1px';
              spacer.innerText = 'Parameters / Arguments';
              middleCol.appendChild(spacer);
              
              const argsDiv = createArgsDiv(action);
              argsDiv.style.marginTop = '16px';
              middleCol.appendChild(argsDiv);
              
              // rawCmdData and cmdToDisplay are defined above
              const cmdBadge1 = document.createElement('div');
              cmdBadge1.innerHTML = `<i class="fa-solid fa-terminal"></i> CMD<div class="cmd-tooltip" style="position:absolute; background:rgba(15,23,42,0.95); border:1px solid rgba(255,255,255,0.4); border-radius:6px; padding:8px 12px; font-size:10px; color:#fff; white-space:pre-wrap; overflow-wrap:break-word; width:350px; text-align:left; pointer-events:none; opacity:0; transition:opacity 0.1s; box-shadow:0 4px 12px rgba(0,0,0,0.5); z-index:999999; font-family:monospace; letter-spacing:0; line-height:1.3;">${cmdToDisplay.replace(/"/g, '&quot;')}</div>`;
              cmdBadge1.style.cssText = 'position:relative; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.3); border-radius:4px; padding:3px 6px; font-size:9px; color:#fff; cursor:pointer; font-weight:bold; letter-spacing:1px; display:flex; align-items:center; gap:4px; transition:all 0.2s;';
              cmdBadge1.onmouseover = (e) => {
                  cmdBadge1.style.background = 'rgba(255,255,255,0.2)';
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
                  cmdBadge1.style.background = 'rgba(0,0,0,0.5)';
                  cmdBadge1.querySelector('.cmd-tooltip').style.opacity = '0';
              };
              cmdBadge1.onclick = (e) => {
                  e.stopPropagation();
                  const cmdToCopy = rawCmdData ? rawCmdData : (action ? action.cmd : text);
                  navigator.clipboard.writeText(cmdToCopy).then(() => {
                      const icon = cmdBadge1.querySelector('i');
                      icon.className = 'fa-solid fa-check';
                      icon.style.color = '#00FF66';
                      setTimeout(() => {
                          icon.className = 'fa-solid fa-terminal';
                          icon.style.color = '#fff';
                      }, 1500);
                  });
              };
              const badgeContainer = document.createElement('div');
              badgeContainer.style.display = 'flex';
              badgeContainer.style.alignItems = 'center';
              badgeContainer.style.gap = '8px';
              badgeContainer.style.marginLeft = 'auto';
              badgeContainer.style.marginRight = '8px';
              titleDiv.appendChild(badgeContainer);

              cmdBadge1.style.marginLeft = '0';
              badgeContainer.appendChild(cmdBadge1);
              
              let isRos2 = (action && action.cmd && action.cmd.startsWith('ros2 run')) || (cmdToDisplay && cmdToDisplay.startsWith('ros2 run'));
              if (isRos2) {
                  const ros2Badge = document.createElement('div');
                  ros2Badge.innerHTML = `<i class="fa-solid fa-robot"></i> ROS 2`;
                  ros2Badge.style.cssText = 'background:rgba(59,130,246,0.2); border:1px solid rgba(59,130,246,0.5); border-radius:4px; padding:3px 6px; font-size:9px; color:#93c5fd; font-weight:bold; letter-spacing:1px; display:flex; align-items:center; gap:4px; flex-shrink:0;';
                  badgeContainer.insertBefore(ros2Badge, cmdBadge1);
              }
              
              let hasPython3 = (action && action.cmd && action.cmd.includes('python3')) || (cmdToDisplay && cmdToDisplay.includes('python3'));
              if (hasPython3) {
                  const pythonBadge = document.createElement('div');
                  pythonBadge.innerHTML = `<i class="fa-brands fa-python"></i> Python3`;
                  pythonBadge.style.cssText = 'background:rgba(234,179,8,0.15); border:1px solid rgba(234,179,8,0.4); border-radius:4px; padding:3px 6px; font-size:9px; color:#fde047; font-weight:bold; letter-spacing:1px; display:flex; align-items:center; gap:4px; flex-shrink:0;';
                  badgeContainer.insertBefore(pythonBadge, cmdBadge1);
              }
              
              let hasChrome = (action && action.cmd && (action.cmd.includes('google-chrome') || action.cmd.includes('chromium-browser'))) || (cmdToDisplay && (cmdToDisplay.includes('google-chrome') || cmdToDisplay.includes('chromium-browser')));
              if (hasChrome) {
                  const chromeBadge = document.createElement('div');
                  chromeBadge.innerHTML = `<i class="fa-brands fa-chrome"></i> +CHROME`;
                  chromeBadge.style.cssText = 'background:rgba(66,133,244,0.15); border:1px solid rgba(66,133,244,0.3); border-radius:4px; padding:3px 6px; font-size:9px; color:#4285F4; font-weight:bold; letter-spacing:1px; display:flex; align-items:center; gap:4px; flex-shrink:0;';
                  badgeContainer.insertBefore(chromeBadge, cmdBadge1);
              }
              
              const mainCb = document.createElement('input');
              mainCb.type = 'checkbox';
              mainCb.className = 'main-action-cb';
              mainCb.checked = action ? action.active : (activeSet ? activeSet.has(li.dataset.cmd) : false);
              li.style.opacity = mainCb.checked ? '1' : '0.4';
              mainCb.style.cssText = 'accent-color: #00FF66; cursor: pointer; flex-shrink: 0; width: 18px; height: 18px; filter: drop-shadow(0 0 8px rgba(0,255,102,0.4)); margin-right: 10px; margin-left: 4px;';
              mainCb.onclick = (e) => e.stopPropagation();
              mainCb.onchange = (e) => {
                  if (action) action.active = e.target.checked;
                  li.style.opacity = e.target.checked ? '1' : '0.4';
                  
                  if (action && (action.cmd.includes('rviz_linear_axis_tuner') || action.cmd.includes('linear_axis'))) {
                      syncLinearAxisState(e.target.checked);
                  }
                  
                  const allCbs = Array.from(topUl.querySelectorAll('.main-action-cb'));
                  if (allCbs.length > 0) {
                      selectAllCb.checked = allCbs.every(c => c.checked);
                  }
                  if (!e.simulated) saveActiveState();
              };
              
              li.style.cursor = 'pointer';
              li.onclick = (e) => {
                  if (e.target === mainCb || e.target.closest('label') || e.target.closest('a')) return;
                  mainCb.checked = !mainCb.checked;
                  mainCb.dispatchEvent(new Event('change'));
              };
              
              cardLayout.appendChild(leftCol);
              cardLayout.appendChild(middleCol);
              cardLayout.style.flex = '1';
              cardLayout.style.minWidth = '0'; // Prevent overflow

              const liInnerWrapper = document.createElement('div');
              liInnerWrapper.style.display = 'flex';
              liInnerWrapper.style.alignItems = 'center'; // Vertically center!
              liInnerWrapper.style.width = '100%';
              
              const cbContainer = document.createElement('div');
              cbContainer.style.display = 'flex';
              cbContainer.style.alignItems = 'center';
              cbContainer.style.justifyContent = 'center';
              cbContainer.style.width = '40px';
              cbContainer.style.flexShrink = '0';
              
              mainCb.style.marginRight = '0';
              mainCb.style.marginLeft = '0';
              cbContainer.appendChild(mainCb);
              
              liInnerWrapper.appendChild(cbContainer);
              liInnerWrapper.appendChild(cardLayout);
              
              li.insertBefore(liInnerWrapper, li.firstChild);
              
              li.style.position = 'relative';
              
              if (isLaunchCard) {
                  const hrLine = document.createElement('div');
                  hrLine.style.position = 'absolute';
                  hrLine.style.top = '42px'; // 10px li padding + 32px row height
                  hrLine.style.left = '55px'; // 15px li padding + 40px cb width
                  hrLine.style.width = 'calc(100% - 110px)';
                  hrLine.style.height = '1px';
                  hrLine.style.background = 'rgba(255, 255, 255, 0.35)';
                  hrLine.style.pointerEvents = 'none';
                  li.appendChild(hrLine);
              }

              li.style.background = 'rgba(255, 255, 255, 0.03)';
              li.style.border = '1px solid rgba(255, 255, 255, 0.08)';
              li.style.borderRadius = '8px';
              li.style.padding = '10px 15px';
              li.style.marginBottom = '16px';
              li.style.fontSize = '13px';
              li.style.color = '#fff';
              li.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
              li.style.transition = 'all 0.3s ease';
              
              li.onmouseover = () => { li.style.background = 'rgba(255, 255, 255, 0.08)'; li.style.transform = 'translateX(5px)'; li.style.borderColor = 'rgba(0, 255, 102, 0.3)'; };
              li.onmouseout = () => { li.style.background = 'rgba(255, 255, 255, 0.03)'; li.style.transform = 'translateX(0)'; li.style.borderColor = 'rgba(255, 255, 255, 0.08)'; };
              
              let descText = 'Details zur Node / zum Launch-File';
              const rightSpan = Array.from(titleDiv.children).find(n => n.tagName === 'SPAN' && (n.style.marginLeft === 'auto' || n.style.float === 'right'));
              if (rightSpan) {
                  descText = rightSpan.textContent.replace(/^\(|\)$/g, '').trim();
              } else if (action && action.title) {
                  descText = action.title;
              }
              
              const infoBadge = document.createElement('div');
              infoBadge.innerHTML = `<i class="fa-solid fa-info"></i><div class="info-tooltip" style="position:absolute; top:25px; right:0; background:rgba(15,23,42,0.95); border:1px solid rgba(255,255,255,0.4); border-radius:6px; padding:8px 12px; font-size:11px; color:#fff; white-space:normal; width:max-content; max-width:250px; pointer-events:none; opacity:0; transition:opacity 0.2s; box-shadow:0 4px 12px rgba(0,0,0,0.5); z-index:100; line-height:1.4;">${descText.replace(/"/g, '&quot;')}</div>`;
              infoBadge.style.cssText = 'position:absolute; top:10px; right:10px; width:18px; height:18px; background:rgba(255,255,255,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; color:#fff; cursor:default; transition:all 0.2s; border:1px solid rgba(255,255,255,0.2); z-index:10;';
              infoBadge.onmouseover = () => {
                  infoBadge.style.background = 'rgba(255,255,255,0.3)';
                  infoBadge.querySelector('.info-tooltip').style.opacity = '1';
              };
              infoBadge.onmouseout = () => {
                  infoBadge.style.background = 'rgba(255,255,255,0.1)';
                  infoBadge.querySelector('.info-tooltip').style.opacity = '0';
              };
              li.appendChild(infoBadge);
              
              // Preserve original inline styles for nested elements from CMD_DETAILS
          });
          
          // Append any unmatched actions to the bottom to ensure nothing is missing
          const unmatchedActions = actionsData.filter(a => !matchedCmds.has(a.cmd));
          unmatchedActions.forEach(action => {
              const li = document.createElement('li');
              
              let baseHtml = `<span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> SCRIPT</span>`;
              if (action.cmd.startsWith('ros2 launch')) {
                  baseHtml = `<span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span>`;
              } else if (action.cmd.includes('python3 -m http.server') || action.cmd.includes('http_robot_control_ui_p8081')) {
                  baseHtml = `<span class="badge badge-server" style="margin-right: 6px;"><i class="fa-solid fa-server" style="margin-right: 4px;"></i>SERVER</span>`;
              }
              
              let cmdName = action.title || action.cmd.split(' ').slice(0, 3).join(' ');
              
              const cardLayout = document.createElement('div');
              cardLayout.className = 'modal-card-layout';
              cardLayout.style.display = 'flex';
              cardLayout.style.width = '100%';
              cardLayout.style.justifyContent = 'space-between';
              cardLayout.style.alignItems = 'stretch';
              cardLayout.style.gap = '15px';
              
              const leftCol = document.createElement('div');
              leftCol.className = 'modal-card-left-col';
              leftCol.style.display = 'flex';
              leftCol.style.flexDirection = 'column';
              leftCol.style.gap = '8px';
              leftCol.style.flex = '1';
              
              const titleDiv = document.createElement('div');
              titleDiv.style.display = 'flex';
              titleDiv.style.alignItems = 'center';
              titleDiv.style.gap = '8px';
              titleDiv.style.minHeight = '32px';
              titleDiv.innerHTML = `${baseHtml}<span style="color: var(--c-launch); font-weight: bold;">${cmdName}</span> <span style="color: var(--mut); font-size: 11px; margin-left: 8px;">(Auto-Added)</span>`;
              
              leftCol.appendChild(titleDiv);
              
              const isLaunchCard2 = action.cmd.startsWith('ros2 launch');
              
              const middleCol = document.createElement('div');
              middleCol.className = 'modal-card-middle-col';
              middleCol.style.flex = '0 0 280px'; // Width for args and parameters
              middleCol.style.display = 'flex';
              middleCol.style.flexDirection = 'column';
              middleCol.style.borderLeft = isLaunchCard2 ? '1px solid rgba(255, 255, 255, 0.35)' : 'none';
              middleCol.style.padding = '0 20px';
              middleCol.style.minWidth = '0';
              
              const spacer = document.createElement('div');
              spacer.style.height = '32px';
              spacer.style.flexShrink = '0';
              spacer.style.display = 'flex';
              spacer.style.alignItems = 'center';
              spacer.style.fontSize = '12px';
              spacer.style.fontWeight = 'bold';
              spacer.style.color = 'var(--mut)';
              spacer.style.textTransform = 'uppercase';
              spacer.style.letterSpacing = '1px';
              spacer.innerText = 'Parameters / Arguments';
              middleCol.appendChild(spacer);
              
              parseArgs(action);
              li.dataset.cmd = action.cmd;
              let isActive = activeSet ? activeSet.has(li.dataset.cmd) : false;
              action.active = isActive;
              const argsDiv = createArgsDiv(action);
              middleCol.appendChild(argsDiv);
              
              const cmdBadge1 = document.createElement('div');
              cmdBadge1.innerHTML = `<i class="fa-solid fa-terminal"></i> CMD<div class="cmd-tooltip" style="position:absolute; top:-30px; right:0; background:rgba(15,23,42,0.95); border:1px solid rgba(255,255,255,0.4); border-radius:6px; padding:6px 10px; font-size:10px; color:#fff; white-space:nowrap; pointer-events:none; opacity:0; transition:opacity 0.2s; box-shadow:0 4px 12px rgba(0,0,0,0.5); z-index:100; font-family:monospace; letter-spacing:0;">${(action ? action.cmd : text).replace(/"/g, '&quot;')}</div>`;
              cmdBadge1.style.cssText = 'position:relative; background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.3); border-radius:4px; padding:3px 6px; font-size:9px; color:#fff; cursor:pointer; font-weight:bold; letter-spacing:1px; display:flex; align-items:center; gap:4px; transition:all 0.2s;';
              cmdBadge1.onmouseover = () => {
                  cmdBadge1.style.background = 'rgba(255,255,255,0.2)';
                  cmdBadge1.querySelector('.cmd-tooltip').style.opacity = '1';
              };
              cmdBadge1.onmouseout = () => {
                  cmdBadge1.style.background = 'rgba(0,0,0,0.5)';
                  cmdBadge1.querySelector('.cmd-tooltip').style.opacity = '0';
              };
              cmdBadge1.onclick = (e) => {
                  e.stopPropagation();
                  const cmdToCopy = action ? action.cmd : text;
                  navigator.clipboard.writeText(cmdToCopy).then(() => {
                      const icon = cmdBadge1.querySelector('i');
                      icon.className = 'fa-solid fa-check';
                      icon.style.color = '#00FF66';
                      setTimeout(() => {
                          icon.className = 'fa-solid fa-terminal';
                          icon.style.color = '#fff';
                      }, 1500);
                  });
              };
              const badgeContainer = document.createElement('div');
              badgeContainer.style.display = 'flex';
              badgeContainer.style.alignItems = 'center';
              badgeContainer.style.gap = '8px';
              badgeContainer.style.marginLeft = 'auto';
              badgeContainer.style.marginRight = '8px';
              titleDiv.appendChild(badgeContainer);

              cmdBadge1.style.marginLeft = '0';
              badgeContainer.appendChild(cmdBadge1);
              
              let isRos2_2 = action && action.cmd && action.cmd.startsWith('ros2 run');
              if (isRos2_2) {
                  const ros2Badge2 = document.createElement('div');
                  ros2Badge2.innerHTML = `<i class="fa-solid fa-robot"></i> ROS 2`;
                  ros2Badge2.style.cssText = 'background:rgba(59,130,246,0.2); border:1px solid rgba(59,130,246,0.5); border-radius:4px; padding:3px 6px; font-size:9px; color:#93c5fd; font-weight:bold; letter-spacing:1px; display:flex; align-items:center; gap:4px; flex-shrink:0;';
                  badgeContainer.insertBefore(ros2Badge2, cmdBadge1);
              }
              
              let hasPython3_2 = action && action.cmd && action.cmd.includes('python3');
              if (hasPython3_2) {
                  const pythonBadge2 = document.createElement('div');
                  pythonBadge2.innerHTML = `<i class="fa-brands fa-python"></i> Python3`;
                  pythonBadge2.style.cssText = 'background:rgba(234,179,8,0.15); border:1px solid rgba(234,179,8,0.4); border-radius:4px; padding:3px 6px; font-size:9px; color:#fde047; font-weight:bold; letter-spacing:1px; display:flex; align-items:center; gap:4px; flex-shrink:0;';
                  badgeContainer.insertBefore(pythonBadge2, cmdBadge1);
              }
              
              let hasChrome_2 = action && action.cmd && (action.cmd.includes('google-chrome') || action.cmd.includes('chromium-browser'));
              if (hasChrome_2) {
                  const chromeBadge2 = document.createElement('div');
                  chromeBadge2.innerHTML = `<i class="fa-brands fa-chrome"></i> +CHROME`;
                  chromeBadge2.style.cssText = 'background:rgba(66,133,244,0.15); border:1px solid rgba(66,133,244,0.3); border-radius:4px; padding:3px 6px; font-size:9px; color:#4285F4; font-weight:bold; letter-spacing:1px; display:flex; align-items:center; gap:4px; flex-shrink:0;';
                  badgeContainer.insertBefore(chromeBadge2, cmdBadge1);
              }
              
              const mainCb = document.createElement('input');
              mainCb.type = 'checkbox';
              mainCb.className = 'main-action-cb';
              mainCb.checked = isActive;
              li.style.opacity = mainCb.checked ? '1' : '0.4';
              mainCb.style.cssText = 'accent-color: #00FF66; cursor: pointer; flex-shrink: 0; width: 18px; height: 18px; filter: drop-shadow(0 0 8px rgba(0,255,102,0.4)); margin-right: 10px; margin-left: 4px;';
              mainCb.onclick = (e) => e.stopPropagation();
              mainCb.onchange = (e) => {
                  action.active = e.target.checked;
                  li.style.opacity = e.target.checked ? '1' : '0.4';
                  if (action && (action.cmd.includes("rviz_linear_axis_tuner") || action.cmd.includes("linear_axis"))) {
                      syncLinearAxisState(e.target.checked);
                  }
                  
                  const allCbs = Array.from(topUl.querySelectorAll('.main-action-cb'));
                  if (allCbs.length > 0) {
                      selectAllCb.checked = allCbs.every(c => c.checked);
                  }
                  if (!e.simulated) saveActiveState();
              };
              
              li.style.cursor = 'pointer';
              li.onclick = (e) => {
                  if (e.target === mainCb || e.target.closest('label') || e.target.closest('a')) return;
                  mainCb.checked = !mainCb.checked;
                  mainCb.dispatchEvent(new Event('change'));
              };
              
              titleDiv.insertBefore(mainCb, titleDiv.firstChild);
              cardLayout.appendChild(leftCol);
              cardLayout.appendChild(middleCol);
              
              li.appendChild(cardLayout);
              
              li.style.position = 'relative';
              
              if (isLaunchCard2) {
                  const hrLine2 = document.createElement('div');
                  hrLine2.style.position = 'absolute';
                  hrLine2.style.top = '42px';
                  hrLine2.style.left = '15px';
                  hrLine2.style.width = 'calc(100% - 70px)';
                  hrLine2.style.height = '1px';
                  hrLine2.style.background = 'rgba(255, 255, 255, 0.35)';
                  hrLine2.style.pointerEvents = 'none';
                  li.appendChild(hrLine2);
              }

              li.style.background = 'rgba(255, 255, 255, 0.03)';
              li.style.border = '1px solid rgba(255, 255, 255, 0.08)';
              li.style.borderRadius = '8px';
              li.style.padding = '10px 15px';
              li.style.marginBottom = '16px';
              li.style.fontSize = '13px';
              li.style.color = '#fff';
              li.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
              li.style.transition = 'all 0.3s ease';
              
              li.onmouseover = () => { li.style.background = 'rgba(255, 255, 255, 0.08)'; li.style.transform = 'translateX(5px)'; li.style.borderColor = 'rgba(0, 255, 102, 0.3)'; };
              li.onmouseout = () => { li.style.background = 'rgba(255, 255, 255, 0.03)'; li.style.transform = 'translateX(0)'; li.style.borderColor = 'rgba(255, 255, 255, 0.08)'; };
              
              let descText2 = action.title || cmdName || 'Details zur Node / zum Launch-File';
              const rightSpan2 = Array.from(titleDiv.children).find(n => n.tagName === 'SPAN' && (n.style.marginLeft === 'auto' || n.style.float === 'right'));
              if (rightSpan2) {
                  descText2 = rightSpan2.textContent.replace(/^\(|\)$/g, '').trim();
              }
              
              const infoBadge2 = document.createElement('div');
              infoBadge2.innerHTML = `<i class="fa-solid fa-info"></i><div class="info-tooltip" style="position:absolute; top:25px; right:0; background:rgba(15,23,42,0.95); border:1px solid rgba(255,255,255,0.4); border-radius:6px; padding:8px 12px; font-size:11px; color:#fff; white-space:normal; width:max-content; max-width:250px; pointer-events:none; opacity:0; transition:opacity 0.2s; box-shadow:0 4px 12px rgba(0,0,0,0.5); z-index:100; line-height:1.4;">${descText2.replace(/"/g, '&quot;')}</div>`;
              infoBadge2.style.cssText = 'position:absolute; top:10px; right:10px; width:18px; height:18px; background:rgba(255,255,255,0.1); border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; color:#fff; cursor:default; transition:all 0.2s; border:1px solid rgba(255,255,255,0.2); z-index:10;';
              infoBadge2.onmouseover = () => {
                  infoBadge2.style.background = 'rgba(255,255,255,0.3)';
                  infoBadge2.querySelector('.info-tooltip').style.opacity = '1';
              };
              infoBadge2.onmouseout = () => {
                  infoBadge2.style.background = 'rgba(255,255,255,0.1)';
                  infoBadge2.querySelector('.info-tooltip').style.opacity = '0';
              };
              li.appendChild(infoBadge2);
              
              topUl.appendChild(li);
          });
          
          const allCbs = Array.from(topUl.querySelectorAll('.main-action-cb'));
          if (allCbs.length > 0) {
              selectAllCb.checked = allCbs.every(c => c.checked);
          }

       } else {
           contentClone.style.background = 'rgba(255,255,255,0.03)';
           contentClone.style.border = '1px solid rgba(255,255,255,0.08)';
           contentClone.style.borderRadius = '8px';
           contentClone.style.padding = '12px';
           contentClone.style.fontSize = '13px';
           contentClone.style.color = '#fff';
           
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
       
       const modalHtml = `
              <div id="launch-modal" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.35); z-index:10000; display:flex; align-items:center; justify-content:center; backdrop-filter: blur(12px) saturate(0.7); -webkit-backdrop-filter: blur(12px) saturate(0.7); animation: fadeIn 0.3s ease; font-family:var(--font-sans, 'Plus Jakarta Sans', sans-serif);">
              <div style="background: linear-gradient(145deg, rgba(20,25,35,0.97), rgba(10,15,25,0.99)); border:1px solid rgba(0, 255, 102, 0.2); border-radius:24px; width:72vw; max-width: 72vw; height:90vh; max-height: 90vh; display:flex; flex-direction:column; box-shadow:0 30px 70px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,255,102,0.08), inset 0 0 30px rgba(0,255,102,0.03); transform: translateY(20px); animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; isolation: isolate; filter: none;">
                 
                 <div style="padding:15px 25px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2); border-radius: 24px 24px 0 0;">
                    <h2 style="margin:0; font-size:18px; font-weight:600; letter-spacing:-0.02em; color:#fff; text-shadow:0 0 15px rgba(0,255,102,0.3); display:flex; align-items:center; gap:12px; font-family:var(--font-sans, 'Plus Jakarta Sans', sans-serif);">
                       ${titleHTML.replace('<i', '<i style="color: #00FF66;"')}
                    </h2>
                    <button onclick="document.getElementById('launch-modal').remove()" style="background:rgba(255,255,255,0.08); border:none; color:#fff; width:32px; height:32px; border-radius:50%; font-size:16px; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center;" onmouseover="this.style.background='rgba(255,50,50,0.8)'; this.style.transform='rotate(90deg)';" onmouseout="this.style.background='rgba(255,255,255,0.08)'; this.style.transform='rotate(0)';"><i class="fa-solid fa-xmark"></i></button>
                 </div>
                 
                 <div id="launch-modal-body" style="flex:1; padding:20px; overflow-y:auto; overflow-x:hidden; font-family:var(--font-sans, 'Plus Jakarta Sans', sans-serif); font-weight:350; letter-spacing:-0.01em;">
                 </div>
                 
                 <div style="padding:15px; border-top:1px solid rgba(255,255,255,0.08); display:flex; justify-content:center; align-items:center; background:rgba(0,0,0,0.3); border-radius: 0 0 24px 24px;">
                    <button id="launch-modal-start-btn" style="background:linear-gradient(135deg, #00FF66, #00CC55); color:#000; font-size:15px; font-weight:700; padding:12px 45px; border-radius:50px; border:none; cursor:pointer; box-shadow:0 10px 30px rgba(0,255,102,0.3); transition:all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); letter-spacing: 1.5px; text-transform:uppercase; display:flex; align-items:center; gap:10px; font-family:var(--font-sans, 'Plus Jakarta Sans', sans-serif);">
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
       startBtn.onmouseover = () => { startBtn.style.transform='scale(1.05) translateY(-2px)'; startBtn.style.boxShadow='0 15px 35px rgba(0,255,102,0.5)'; };
       startBtn.onmouseout = () => { startBtn.style.transform='scale(1) translateY(0)'; startBtn.style.boxShadow='0 10px 30px rgba(0,255,102,0.3)'; };
       
       startBtn.addEventListener('click', async () => {
          saveActiveState();
          document.getElementById('launch-modal').remove();
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

