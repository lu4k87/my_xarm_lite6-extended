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
          const matchedCmds = new Set();
          topLis.forEach(li => {
              const clone = li.cloneNode(true);
              Array.from(clone.children).forEach(c => { if (c.tagName === 'UL') c.remove(); });
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
              }
              
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

    // ─── GLOBAL EXPORTS (required for inline onclick="..." attributes) ──────────────
    window.openLaunchModalFromCard = openLaunchModalFromCard;
    window.openLaunchModal = openLaunchModal;
    window.copyCmd = copyCmd;
    window.showToast = showToast;
    window.toggleConsole = toggleConsole;
    window.checkStatus = checkStatus;
