function logToTerminal(message, type = 'info') {
    const term = document.getElementById('sys-terminal');
    if (!term) return;
    const time = new Date().toLocaleTimeString('de-DE');
    const line = document.createElement('div');
    line.className = 'term-line';
    line.innerHTML = `<span class="time">[${time}]</span> <span class="${type}">${message}</span>`;
    term.appendChild(line);
    term.scrollTop = term.scrollHeight;
}

// ── WebSocket Reconnect State ────────────────────────────────────────────────
let rosRetryDelay = 3000;  // Startzeitraum in ms (exponentieller Backoff)

// ── Gedebounctes Topic-Activity-Request ──────────────────────────────────────
// Verhindert Burst-Requests beim schnellen Wechseln zwischen Nodes (250 ms).
const _sendTopicActivityRequest = debounce(function (topics) {
    if (window._topicActivityPub && window.ros && window.ros.isConnected) {
        window._topicActivityPub.publish(new ROSLIB.Message({
            data: JSON.stringify({ topics })
        }));
    }
}, 250);

function recursivelyParseJSON(obj) {
    if (typeof obj === 'string') {
        const trimmed = obj.trim();
        // Remove surrounding quotes if it's double-stringified
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            try {
                return recursivelyParseJSON(JSON.parse(trimmed));
            } catch (e) { }
        }
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
            (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                return recursivelyParseJSON(JSON.parse(trimmed));
            } catch (e) {
                return obj;
            }
        }
        // Handle Python's repr strings commonly found in logs if possible, but standard JSON is handled above
        return obj;
    } else if (Array.isArray(obj)) {
        return obj.map(recursivelyParseJSON);
    } else if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (const key in obj) {
            newObj[key] = recursivelyParseJSON(obj[key]);
        }
        return newObj;
    }
    return obj;
}

/**
 * Bereinigt activity.last_msg vom Backend rekursiv:
 * Das Backend liefert den Wert oft als mehrfach-JSON-kodierten String.
 */
function formatLastMsg(raw) {
    const fullyParsed = recursivelyParseJSON(raw);
    let result = typeof fullyParsed === 'string' ? fullyParsed : JSON.stringify(fullyParsed, null, 2);
    
    // Fallback: If it's a raw string that couldn't be parsed (e.g. due to backend truncation),
    // manually clean up the JSON escape characters so it looks readable.
    if (typeof result === 'string') {
        if (result.includes('\\"')) {
            result = result.replace(/\\"/g, '"');
        }
        if (result.includes('\\\\')) {
            result = result.replace(/\\\\/g, '\\');
        }
        // Remove surrounding quotes if the string was a literal JSON string
        if (result.startsWith('"') && result.endsWith('"') && result.length > 1) {
            result = result.substring(1, result.length - 1);
        }
    }
    
    return result;
}

function initRosConnection() {
    const ros = new ROSLIB.Ros({ url: 'ws://localhost:9090' });
    window.ros = ros;

    const statusText = document.getElementById('dashboard-status-text');
    const statusDot = document.getElementById('dashboard-status-dot');
    const robotText = document.getElementById('robot-status-text');
    const robotDot = document.getElementById('robot-status-dot');

    // Topic-Activity Publisher
    window._topicActivityPub = new ROSLIB.Topic({
        ros, name: '/dashboard/request_topic_activity', messageType: 'std_msgs/String'
    });
    // Öffentliche API – intern debounced
    window.topicActivityPub = window._topicActivityPub;
    window.requestTopicActivity = _sendTopicActivityRequest;


    // Sub to see live data and animate CSS classes
    new ROSLIB.Topic({ ros: ros, name: '/dashboard/topic_activity', messageType: 'std_msgs/String' }).subscribe((msg) => {
        try {
            const data = JSON.parse(msg.data);
            let anyActive = false;

            // Loop through all trackable cards
            document.querySelectorAll('.live-trackable').forEach(card => {
                let cardActive = false;
                let maxHz = 0;
                try {
                    const cardTopics = JSON.parse(card.dataset.topics || "[]");
                    cardTopics.forEach(t => {
                        const activity = data[t];
                        if (activity) {
                            if (activity.hz > maxHz) maxHz = activity.hz;
                            if (activity.active) {
                                cardActive = true;
                                anyActive = true;
                            }

                            // --- NEUER CODE: Message Content in der UI updaten ---
                            if (activity.last_msg !== undefined && activity.last_msg !== "") {
                                const safeTopicId = t.replace(/\//g, '-');
                                const formatted = formatLastMsg(activity.last_msg);
                                const msgValEl = document.querySelector(`#msg-${safeTopicId} .topic-val`);
                                if (msgValEl) {
                                    // Kurze Vorschau: als kompakter Einzeiler, volle Breite nutzen (CSS übernimmt Truncation)
                                    const compactStr = formatted.replace(/\s+/g, ' ').trim();
                                    msgValEl.textContent = compactStr;
                                    msgValEl.classList.add('text-truncate');
                                    msgValEl.removeAttribute('title');
                                    msgValEl.style.color = "var(--text-primary)";
                                }

                                // Hover-Tooltip: sauber formatierter Volltext
                                const msgTooltipEl = document.querySelector(`#msg-${safeTopicId} .msg-tooltip`);
                                if (msgTooltipEl) {
                                    msgTooltipEl.textContent = formatted;
                                }
                            }
                        }
                    });
                } catch (e) { }

                const hzDisplay = card.querySelector('.card-hz-display');
                if (hzDisplay) {
                    if (maxHz > 0) {
                        hzDisplay.textContent = `${maxHz} Hz`;
                        hzDisplay.classList.add('hz-active');
                    } else {
                        hzDisplay.textContent = "-- Hz";
                        hzDisplay.classList.remove('hz-active');
                    }
                }

                if (cardActive) {
                    card.classList.add('live-pulsing');
                } else {
                    card.classList.remove('live-pulsing');
                }

                // Toggle individual topic badge pulses inside the card
                const isRx = card.classList.contains('rx-card');
                card.querySelectorAll('.conn-topic-badge').forEach(badge => {
                    const t = badge.dataset.topic;
                    if (t && data[t] && data[t].active) {
                        badge.classList.add(isRx ? 'topic-pulsing-rx' : 'topic-pulsing-tx');
                    } else {
                        badge.classList.remove('topic-pulsing-rx', 'topic-pulsing-tx');
                    }
                });
            });

            // --- Action Activity: Red pulse for action cards ---
            document.querySelectorAll('.action-trackable').forEach(card => {
                let actionActive = false;
                let maxActionHz = 0;
                try {
                    const actionTopics = JSON.parse(card.dataset.actionFeedback || "[]");
                    actionTopics.forEach(t => {
                        const activity = data[t];
                        if (activity) {
                            if (activity.hz > maxActionHz) maxActionHz = activity.hz;
                            if (activity.active) {
                                actionActive = true;
                            }
                        }
                    });
                } catch (e) { }

                const actionHzDisplay = card.querySelector('.action-hz');
                if (actionHzDisplay) {
                    if (maxActionHz > 0) {
                        actionHzDisplay.textContent = "AKTIV";
                        actionHzDisplay.classList.add('active');
                    } else {
                        actionHzDisplay.textContent = "RES (Server)";
                        actionHzDisplay.classList.remove('active');
                    }
                }

                if (actionActive) {
                    card.classList.add('action-pulsing');
                } else {
                    card.classList.remove('action-pulsing');
                }
            });

        } catch (e) {
            console.error("Error parsing topic activity:", e);
        }
    });

    ros.on('connection', () => {
        statusText.textContent = 'Online';
        statusDot.className = 'status-indicator online';
        logToTerminal("WebSocket Verbindung etabliert.", "info");
        rosRetryDelay = 3000;   // Reset Backoff bei erfolgreicher Verbindung
    });
    ros.on('error', () => {
        statusText.textContent = 'Error';
        statusDot.className = 'status-indicator offline';
    });
    ros.on('close', () => {
        statusText.textContent = 'Offline';
        statusDot.className = 'status-indicator offline';
        robotText.textContent = 'Offline';
        robotDot.className = 'status-indicator offline';
        document.getElementById('bridge-ping').textContent = '-- ms';
        logToTerminal(`WebSocket getrennt – Reconnect in ${rosRetryDelay / 1000}s...`, 'warn');
        setTimeout(() => {
            logToTerminal('Versuche Reconnect...', 'info');
            initRosConnection();
        }, rosRetryDelay);
        // Exponentieller Backoff: max 30 s
        rosRetryDelay = Math.min(rosRetryDelay * 1.5, 30000);
    });

    // Ping Measurement
    const pingTopic = new ROSLIB.Topic({ ros: ros, name: '/dashboard/ping', messageType: 'std_msgs/Float64' });
    pingTopic.subscribe((msg) => {
        const latency = Date.now() - msg.data;
        document.getElementById('bridge-ping').textContent = latency + ' ms';
    });
    setInterval(() => {
        if (ros.isConnected) {
            pingTopic.publish(new ROSLIB.Message({ data: Date.now() }));
        }
    }, 2000);

    codeRequestPub = new ROSLIB.Topic({ ros: ros, name: '/dashboard/request_file_content', messageType: 'std_msgs/String' });
    nodeDetailReqPub = new ROSLIB.Topic({ ros: ros, name: '/dashboard/request_node_details', messageType: 'std_msgs/String' });
    window.openExplorerPub = new ROSLIB.Topic({ ros: window.ros, name: '/dashboard/request_open_explorer', messageType: 'std_msgs/String' });

    new ROSLIB.Topic({ ros: ros, name: '/dashboard/file_content', messageType: 'std_msgs/String' }).subscribe((msg) => {
        try {
            const response = JSON.parse(msg.data);
            if (response.path === currentRequestedPath || response.original_request === currentRequestedPath) {
                renderCode(response.content, response.path);
            }
        } catch (e) { }
    });

    new ROSLIB.Topic({ ros: ros, name: '/dashboard/workspace_metadata', messageType: 'std_msgs/String' }).subscribe((msg) => {
        try {
            const incoming = JSON.parse(msg.data);

            // Speichern der Daten im Hintergrund, aber UI-Update blockieren wenn Lock aktiv
            if (incoming.type !== 'node_pulse') {
                workspaceData = incoming;
            }

            // if (isLoadingLock) return; // Entfernt
            if (incoming.type === 'node_pulse') {
                if (incoming.active_nodes && workspaceData.nodes) {
                    const activeSet = new Set(incoming.active_nodes);
                    Object.keys(workspaceData.nodes).forEach(n => {
                        workspaceData.nodes[n].is_actually_running = activeSet.has(n);
                    });
                    updateNodeList();

                    // Auch den Live-Status des gerade angezeigten Nodes im Center updaten
                    const activeLi = document.querySelector('#dynamic-node-list li.active');
                    if (activeLi) {
                        const curName = activeLi.dataset.name;
                        const centerNodeBox = document.querySelector('.center-node-box');
                        if (centerNodeBox) {
                            if (activeSet.has(curName)) centerNodeBox.classList.add('node-is-live');
                            else centerNodeBox.classList.remove('node-is-live');
                        }
                    }
                }
                return;
            }

            // Fall 2: Komplette Metadaten (alle 10s oder on-demand)
            workspaceData = incoming;

            const domainEl = document.getElementById('val-domain-id');
            if (domainEl && incoming.ros_domain_id !== undefined) {
                domainEl.textContent = incoming.ros_domain_id;
            }

            const distroEl = document.getElementById('val-ros-distro');
            if (distroEl && incoming.ros_distro) {
                distroEl.textContent = incoming.ros_distro.toUpperCase();
            }

            const rmwEl = document.getElementById('val-rmw-impl');
            if (rmwEl && incoming.rmw_impl) {
                // Kürzere Anzeige: rmw_cyclonedds_cpp → CycloneDDS
                const rmwShort = incoming.rmw_impl
                    .replace('rmw_', '')
                    .replace('_cpp', '')
                    .replace('fastrtps', 'FastDDS')
                    .replace('cyclonedds', 'CycloneDDS')
                    .replace('connextdds', 'ConnextDDS');
                rmwEl.textContent = rmwShort;
                rmwEl.title = incoming.rmw_impl;  // Vollname als Tooltip
            }

            const localhostEl = document.getElementById('val-localhost-only');
            if (localhostEl && incoming.localhost_only !== undefined) {
                const isOn = incoming.localhost_only === '1' || incoming.localhost_only === 1;
                localhostEl.textContent = isOn ? 'ON' : 'OFF';
                localhostEl.style.color = isOn ? '#f59e0b' : '#10b981';
            }

            // Roboter Status Detektion
            const isRobotOnline = workspaceData.robot_hardware_connected === true;

            const robotText = document.getElementById('robot-status-text');
            const robotDot = document.getElementById('robot-status-dot');
            if (isRobotOnline) {
                robotText.textContent = 'Online';
                robotDot.className = 'status-indicator online';
            } else {
                robotText.textContent = 'Offline';
                robotDot.className = 'status-indicator offline';
            }

            updateNodeList();
            renderBashrc(workspaceData.bashrc);
            if (typeof renderLaunchFiles === 'function') renderLaunchFiles();

            if (workspaceData.tree) {
                document.getElementById('ws-tree-container').innerHTML = renderWorkspaceTree(workspaceData.tree);
            }


            if (!document.getElementById('node-details-view').classList.contains('hidden')) {
                const currentNodeActiveEl = document.querySelector('#dynamic-node-list li.active');
                if (currentNodeActiveEl) {
                    const currentNodeName = currentNodeActiveEl.dataset.name;
                    // Nutze skipRequest = true um Endlosschleife zu verhindern
                    if (getNodeData(currentNodeName)) selectNode(currentNodeName, true);
                }
            } else if (!document.getElementById('nodes-overview-view').classList.contains('hidden')) {
                showNodesOverview();
            }
        } catch (e) { }
    });

    new ROSLIB.Topic({ ros: ros, name: '/ui/eef_position', messageType: 'std_msgs/Float32MultiArray' }).subscribe((msg) => {
        document.getElementById('val-x').textContent = msg.data[0].toFixed(0); document.getElementById('val-y').textContent = msg.data[1].toFixed(0); document.getElementById('val-z').textContent = msg.data[2].toFixed(0);
    });
    new ROSLIB.Topic({ ros: ros, name: '/ui/robot_control/current_speed', messageType: 'std_msgs/Float32' }).subscribe((msg) => {
        const pct = Math.round(msg.data * 100); document.getElementById('val-speed').textContent = `${pct}%`; document.getElementById('speed-bar').style.width = `${pct}%`;
    });
    new ROSLIB.Topic({ ros: ros, name: '/ui/joy_button_presses', messageType: 'std_msgs/String' }).subscribe((msg) => { logToTerminal(`Joy-Input: ${msg.data}`, "joy"); });
    new ROSLIB.Topic({ ros: ros, name: '/ui/voice_feedback', messageType: 'std_msgs/String' }).subscribe((msg) => { logToTerminal(`Voice: ${msg.data}`, "voice"); });

    // Placeholder für Planning Frame
    new ROSLIB.Topic({ ros: ros, name: '/ui/planning_frame', messageType: 'std_msgs/String' }).subscribe((msg) => {
        const pfEl = document.getElementById('val-planning-frame');
        if (pfEl) pfEl.textContent = msg.data;
    });

    const alertBanner = document.getElementById('collision-banner');
    new ROSLIB.Topic({ ros: ros, name: '/ui/collision_msg', messageType: 'std_msgs/String' }).subscribe((msg) => {
        const text = msg.data.trim();
        if (!text) return;
        if (text.includes('Kollision')) { alertBanner.classList.remove('hidden'); logToTerminal(`CRITICAL: ${text}`, "collision"); }
    });
}

// Initialer Verbindungsaufbau beim Laden der Seite
window.onload = initRosConnection;
