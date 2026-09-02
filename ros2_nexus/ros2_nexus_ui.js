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




    function openLaunchModalFromCard(card) {
       const btn = card.querySelector('.action-btn');
       if (!btn) return;
       const wrapper = card.closest('.card-wrapper');
       if (!wrapper) return;
       openLaunchModal(wrapper, [{cmd: btn.dataset.cmd, title: btn.dataset.label}], `🚀 ${btn.dataset.label} gestartet...`);
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
       
       let activeSet = null;
       if (popupId && window.TABS && window.TABS['__popups_active'] && window.TABS['__popups_active'][popupId]) {
           activeSet = new Set(window.TABS['__popups_active'][popupId]);
       }
       
       actionsData.forEach(a => { 
           if (popupId) {
               a.active = activeSet ? activeSet.has(a.cmd) : false; 
           } else {
               a.active = true;
           }
           a.baseCmd = a.cmd; 
           a.args = []; 
       });
       
       const saveActiveState = () => {
           if (!popupId) return;
           const activeCmds = [];
           const topUl = document.getElementById('launch-modal-body').querySelector('ul');
           if (!topUl) return;
           topUl.querySelectorAll('li').forEach(item => {
               const cb = item.querySelector('.main-action-cb');
               if (cb && cb.checked && item.dataset.cmd) {
                   activeCmds.push(item.dataset.cmd);
               }
           });
           if (!window.TABS) window.TABS = {};
           if (!window.TABS['__popups_active']) window.TABS['__popups_active'] = {};
           window.TABS['__popups_active'][popupId] = activeCmds;
           
           fetch('/api/config', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(window.TABS)
           }).catch(err => console.error(err));
       };
       
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
                   action.args.push({ text: arg, checked: true });
               });
           } else {
               action.baseCmd = action.cmd;
               action.postCmd = '';
           }
       }
       
       function createArgsDiv(action) {
           const argsDiv = document.createElement('div');
           argsDiv.style.flex = '1';
           argsDiv.style.display = 'flex';
           argsDiv.style.flexDirection = 'column'; // Stack vertically
           argsDiv.style.gap = '6px';
           argsDiv.style.alignItems = 'flex-start';
           argsDiv.style.marginTop = '8px';
           
           if (action && action.args.length > 0) {
               action.args.forEach(argObj => {
                   const argLbl = document.createElement('label');
                   argLbl.style.cssText = 'display:flex; align-items:center; gap:6px; font-size:11px; color:var(--accent); background:rgba(0,255,102,0.1); padding:4px 8px; border-radius:6px; border:1px solid rgba(0,255,102,0.3); cursor:pointer; transition:all 0.2s; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; max-width:100%;';
                   
                   const argCb = document.createElement('input');
                   argCb.type = 'checkbox';
                   argCb.checked = true;
                   argCb.style.accentColor = '#00FF66';
                   argCb.style.cursor = 'pointer';
                   argCb.style.flexShrink = '0';
                   argCb.onclick = (e) => e.stopPropagation();
                   argCb.onchange = (e) => {
                       argObj.checked = e.target.checked;
                       argLbl.style.opacity = e.target.checked ? '1' : '0.4';
                       argLbl.style.borderColor = e.target.checked ? 'rgba(0,255,102,0.3)' : 'rgba(255,255,255,0.1)';
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
              const clone = li.cloneNode(true);
              Array.from(clone.children).forEach(c => { if (c.tagName === 'UL' || c.classList.contains('badge')) c.remove(); });
              const text = clone.textContent.replace(/\(.*?\)/g, '').trim();
              if (!text) return;
              
              const action = actionsData.find(a => {
                  if (matchedCmds.has(a.cmd)) return false;
                  const cmdTokens = a.cmd.split(/\s+/);
                  if (cmdTokens.some(t => t === text || t.endsWith('/' + text))) return true;
                  const baseTerm = text.replace(/\.(py|cpp|xml)$/, '');
                  if (cmdTokens.some(t => t === baseTerm || t === baseTerm + '.py' || t === baseTerm + '.cpp' || t === baseTerm + '.xml')) return true;
                  if (cmdTokens.some(t => t.replace(/_node$/, '') === baseTerm)) return true;
                  return false;
              });
              
              if (action) {
                  matchedCmds.add(action.cmd);
                  parseArgs(action);
                  li.dataset.cmd = action.cmd;
              }
              
              // Build Flex Layout
              const cardLayout = document.createElement('div');
              cardLayout.style.display = 'flex';
              cardLayout.style.width = '100%';
              cardLayout.style.justifyContent = 'space-between';
              cardLayout.style.alignItems = 'stretch';
              cardLayout.style.gap = '30px';
              
              const leftCol = document.createElement('div');
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
                          node.style.marginLeft = 'auto';
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
              const cmdToDisplay = rawCmdData ? rawCmdData : (action ? action.cmd : text);
              const isLaunchCard = (action && action.cmd && action.cmd.startsWith('ros2 launch')) || (cmdToDisplay && cmdToDisplay.startsWith('ros2 launch'));

              const middleCol = document.createElement('div');
              middleCol.style.flex = '0 0 240px'; // Fixed width so leftCol is identical across cards
              middleCol.style.display = 'flex';
              middleCol.style.flexDirection = 'column';
              middleCol.style.borderLeft = isLaunchCard ? '1px solid rgba(255, 255, 255, 0.35)' : 'none';
              middleCol.style.padding = '0 30px';
              middleCol.style.minWidth = '0';
              
              const spacer = document.createElement('div');
              spacer.style.height = '32px';
              spacer.style.flexShrink = '0';
              spacer.style.display = 'flex';
              spacer.style.alignItems = 'center';
              spacer.style.fontSize = '10px';
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
              cmdBadge1.style.marginLeft = '8px';
              const autoMarginNode = Array.from(titleDiv.children).find(n => n.style && n.style.marginLeft === 'auto');
              if (autoMarginNode) {
                  titleDiv.insertBefore(cmdBadge1, autoMarginNode);
              } else {
                  titleDiv.appendChild(cmdBadge1);
              }
              
              let isRos2 = (action && action.cmd && action.cmd.startsWith('ros2 run')) || (cmdToDisplay && cmdToDisplay.startsWith('ros2 run'));
              if (isRos2) {
                  const ros2Badge = document.createElement('div');
                  ros2Badge.innerHTML = `<i class="fa-solid fa-robot"></i> ROS 2`;
                  ros2Badge.style.cssText = 'background:rgba(59,130,246,0.2); border:1px solid rgba(59,130,246,0.5); border-radius:4px; padding:3px 6px; font-size:9px; color:#93c5fd; font-weight:bold; letter-spacing:1px; display:flex; align-items:center; gap:4px; margin-left:8px; flex-shrink:0;';
                  titleDiv.insertBefore(ros2Badge, cmdBadge1);
              }
              
              let hasPython3 = (action && action.cmd && action.cmd.includes('python3')) || (cmdToDisplay && cmdToDisplay.includes('python3'));
              if (hasPython3) {
                  const pythonBadge = document.createElement('div');
                  pythonBadge.innerHTML = `<i class="fa-brands fa-python"></i> Python3`;
                  pythonBadge.style.cssText = 'background:rgba(234,179,8,0.15); border:1px solid rgba(234,179,8,0.4); border-radius:4px; padding:3px 6px; font-size:9px; color:#fde047; font-weight:bold; letter-spacing:1px; display:flex; align-items:center; gap:4px; margin-left:8px; flex-shrink:0;';
                  if (autoMarginNode) {
                      titleDiv.insertBefore(pythonBadge, autoMarginNode);
                  } else {
                      titleDiv.appendChild(pythonBadge);
                  }
              }
              
              let hasChrome = (action && action.cmd && (action.cmd.includes('google-chrome') || action.cmd.includes('chromium-browser'))) || (cmdToDisplay && (cmdToDisplay.includes('google-chrome') || cmdToDisplay.includes('chromium-browser')));
              if (hasChrome) {
                  const chromeBadge = document.createElement('div');
                  chromeBadge.innerHTML = `<i class="fa-brands fa-chrome"></i> +CHROME`;
                  chromeBadge.style.cssText = 'background:rgba(66,133,244,0.15); border:1px solid rgba(66,133,244,0.3); border-radius:4px; padding:3px 6px; font-size:9px; color:#4285F4; font-weight:bold; letter-spacing:1px; display:flex; align-items:center; gap:4px; margin-left:8px; flex-shrink:0;';
                  if (autoMarginNode) {
                      titleDiv.insertBefore(chromeBadge, autoMarginNode);
                  } else {
                      titleDiv.appendChild(chromeBadge);
                  }
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
              cardLayout.style.display = 'flex';
              cardLayout.style.width = '100%';
              cardLayout.style.justifyContent = 'space-between';
              cardLayout.style.alignItems = 'stretch';
              cardLayout.style.gap = '15px';
              
              const leftCol = document.createElement('div');
              leftCol.style.display = 'flex';
              leftCol.style.flexDirection = 'column';
              leftCol.style.gap = '8px';
              leftCol.style.flex = '1';
              
              const titleDiv = document.createElement('div');
              titleDiv.style.display = 'flex';
              titleDiv.style.alignItems = 'center';
              titleDiv.style.gap = '8px';
              titleDiv.style.minHeight = '32px';
              titleDiv.innerHTML = `${baseHtml}<span style="color: var(--c-launch); font-weight: bold;">${cmdName}</span> <span style="color: var(--mut); font-size: 11px; margin-left: auto;">(Auto-Added)</span>`;
              
              leftCol.appendChild(titleDiv);
              
              const isLaunchCard2 = action.cmd.startsWith('ros2 launch');
              
              const middleCol = document.createElement('div');
              middleCol.style.flex = '0 0 210px'; // Fixed width so leftCol is identical across cards
              middleCol.style.display = 'flex';
              middleCol.style.flexDirection = 'column';
              middleCol.style.borderLeft = isLaunchCard2 ? '1px solid rgba(255, 255, 255, 0.35)' : 'none';
              middleCol.style.padding = '0 15px';
              middleCol.style.minWidth = '0';
              
              const spacer = document.createElement('div');
              spacer.style.height = '32px';
              spacer.style.flexShrink = '0';
              spacer.style.display = 'flex';
              spacer.style.alignItems = 'center';
              spacer.style.fontSize = '10px';
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
              cmdBadge1.style.marginLeft = '8px';
              const autoMarginNode2 = Array.from(titleDiv.children).find(n => n.style && n.style.marginLeft === 'auto');
              if (autoMarginNode2) {
                  titleDiv.insertBefore(cmdBadge1, autoMarginNode2);
              } else {
                  titleDiv.appendChild(cmdBadge1);
              }
              
              let isRos2_2 = action && action.cmd && action.cmd.startsWith('ros2 run');
              if (isRos2_2) {
                  const ros2Badge2 = document.createElement('div');
                  ros2Badge2.innerHTML = `<i class="fa-solid fa-robot"></i> ROS 2`;
                  ros2Badge2.style.cssText = 'background:rgba(59,130,246,0.2); border:1px solid rgba(59,130,246,0.5); border-radius:4px; padding:3px 6px; font-size:9px; color:#93c5fd; font-weight:bold; letter-spacing:1px; display:flex; align-items:center; gap:4px; margin-left:8px; flex-shrink:0;';
                  titleDiv.insertBefore(ros2Badge2, cmdBadge1);
              }
              
              let hasPython3_2 = action && action.cmd && action.cmd.includes('python3');
              if (hasPython3_2) {
                  const pythonBadge2 = document.createElement('div');
                  pythonBadge2.innerHTML = `<i class="fa-brands fa-python"></i> Python3`;
                  pythonBadge2.style.cssText = 'background:rgba(234,179,8,0.15); border:1px solid rgba(234,179,8,0.4); border-radius:4px; padding:3px 6px; font-size:9px; color:#fde047; font-weight:bold; letter-spacing:1px; display:flex; align-items:center; gap:4px; margin-left:8px; flex-shrink:0;';
                  if (autoMarginNode2) {
                      titleDiv.insertBefore(pythonBadge2, autoMarginNode2);
                  } else {
                      titleDiv.appendChild(pythonBadge2);
                  }
              }
              
              let hasChrome_2 = action && action.cmd && (action.cmd.includes('google-chrome') || action.cmd.includes('chromium-browser'));
              if (hasChrome_2) {
                  const chromeBadge2 = document.createElement('div');
                  chromeBadge2.innerHTML = `<i class="fa-brands fa-chrome"></i> +CHROME`;
                  chromeBadge2.style.cssText = 'background:rgba(66,133,244,0.15); border:1px solid rgba(66,133,244,0.3); border-radius:4px; padding:3px 6px; font-size:9px; color:#4285F4; font-weight:bold; letter-spacing:1px; display:flex; align-items:center; gap:4px; margin-left:8px; flex-shrink:0;';
                  if (autoMarginNode2) {
                      titleDiv.insertBefore(chromeBadge2, autoMarginNode2);
                  } else {
                      titleDiv.appendChild(chromeBadge2);
                  }
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
          <div id="launch-modal" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.35); z-index:10000; display:flex; align-items:center; justify-content:center; backdrop-filter: blur(12px) saturate(0.7); -webkit-backdrop-filter: blur(12px) saturate(0.7); animation: fadeIn 0.3s ease;">
             <div style="background: linear-gradient(145deg, rgba(20,25,35,0.97), rgba(10,15,25,0.99)); border:1px solid rgba(0, 255, 102, 0.2); border-radius:24px; width:72vw; max-width: 72vw; height:90vh; max-height: 90vh; display:flex; flex-direction:column; box-shadow:0 30px 70px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,255,102,0.08), inset 0 0 30px rgba(0,255,102,0.03); transform: translateY(20px); animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; isolation: isolate; filter: none;">
                
                <div style="padding:15px 25px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.2); border-radius: 24px 24px 0 0;">
                   <h2 style="margin:0; font-size:18px; font-weight:800; color:#fff; text-shadow:0 0 15px rgba(0,255,102,0.3); display:flex; align-items:center; gap:12px;">
                      ${titleHTML.replace('<i', '<i style="color: #00FF66;"')}
                   </h2>
                   <button onclick="document.getElementById('launch-modal').remove()" style="background:rgba(255,255,255,0.08); border:none; color:#fff; width:32px; height:32px; border-radius:50%; font-size:16px; cursor:pointer; transition:all 0.2s; display:flex; align-items:center; justify-content:center;" onmouseover="this.style.background='rgba(255,50,50,0.8)'; this.style.transform='rotate(90deg)';" onmouseout="this.style.background='rgba(255,255,255,0.08)'; this.style.transform='rotate(0)';"><i class="fa-solid fa-xmark"></i></button>
                </div>
                
                <div id="launch-modal-body" style="flex:1; padding:20px; overflow-y:auto; overflow-x:hidden;">
                </div>
                
                <div style="padding:15px; border-top:1px solid rgba(255,255,255,0.08); display:flex; justify-content:center; align-items:center; background:rgba(0,0,0,0.3); border-radius: 0 0 24px 24px;">
                   <button id="launch-modal-start-btn" style="background:linear-gradient(135deg, #00FF66, #00CC55); color:#000; font-size:16px; font-weight:900; padding:12px 45px; border-radius:50px; border:none; cursor:pointer; box-shadow:0 10px 30px rgba(0,255,102,0.3); transition:all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); letter-spacing: 2px; text-transform:uppercase; display:flex; align-items:center; gap:10px;">
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
       
       if (popupId) {
           const actualTopUl = contentClone.querySelector('ul');
           if (actualTopUl) {
               new Sortable(actualTopUl, {
                   animation: 200,
                   ghostClass: 'sortable-ghost',
                   onEnd: async function (evt) {
                       const newOrder = Array.from(actualTopUl.querySelectorAll('li')).map(li => li.dataset.cmd).filter(c => c);
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

