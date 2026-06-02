function updateNodeList() {
    const listEl = document.getElementById('dynamic-node-list');
    const nodes = Object.keys(workspaceData.nodes || {}).sort();
    const proj_keys = Object.keys(workspaceData.project_files || {}).sort();

    if (nodes.length === 0 && proj_keys.length === 0) {
        // Falls noch gar nichts geladen wurde (Initialzustand)
        listEl.innerHTML = `
            <li class="empty-state" style="display:flex; align-items:center; justify-content:center; padding: 20px;">
                <span class="loading-text">Lade Nodes...</span>
                <div class="spinner-small"></div>
            </li>`;
        return;
    }

    const runningState = nodes.map(n => workspaceData.nodes[n].is_actually_running ? '1' : '0').join('');
    const currentNodesStr = JSON.stringify({ n: nodes, p: proj_keys, r: runningState });
    if (listEl.dataset.cachedNodes === currentNodesStr && !listEl.querySelector('.empty-state')) {
        return;
    }
    listEl.dataset.cachedNodes = currentNodesStr;

    const activeLi = listEl.querySelector('li.active');
    const activeNodeName = activeLi ? activeLi.dataset.name : null;

    let activeWsNodes = [];
    let inactiveWsNodes = [];
    let sysNodes = [];

    // Erfasse direkt ueber Backend-Metadaten, wer wirklich ein Workspace Node ist
    nodes.forEach(n => {
        const info = workspaceData.nodes[n];
        let isWs = false;

        // Expliziter Ausschluss für oft genutzte RViz- und System-Nodes
        const isRvizInternal = n.includes('interactive_marker_display') || n.includes('rviz2');

        if (info && info.is_workspace && !isRvizInternal) {
            isWs = true;
        }

        // Eindeutig ein Workspace Node laut Backend
        if (isWs) {
            activeWsNodes.push(n);
        } else {
            sysNodes.push(n);
        }
    });

    // Zusaetzlich inaktive Projekt-Dateien auslesen
    if (workspaceData.project_files) {
        Object.keys(workspaceData.project_files).forEach(file => {
            const fileData = workspaceData.project_files[file];
            const activeName = fileData.active_node_name;
            // Wenn der Node nicht laeuft oder nicht zuzuordnen ist, zeige als inaktive Datei
            if (!activeName || !nodes.includes(activeName)) {
                inactiveWsNodes.push(file);
            }
        });
    }

    activeWsNodes.sort();
    sysNodes.sort();

    // Inaktive Nodes nach Package-Name sortieren, dann nach Datei-Name
    inactiveWsNodes.sort((a, b) => {
        const pkgA = workspaceData.project_files[a]?.package || '';
        const pkgB = workspaceData.project_files[b]?.package || '';
        if (pkgA === pkgB) {
            return a.localeCompare(b);
        }
        return pkgA.localeCompare(pkgB);
    });

    // Helper zur Kategorisierung in Parent/Child
    function parseNodeHierarchy(nodeList) {
        const parents = [];
        const orphans = [];

        nodeList.forEach(name => {
            // Erkennt Muster wie "_impl_...", "_private_...", "daemon" etc.
            const match = name.match(/^(.*(?:_impl_|_private_|_ros2cli_daemon)).*$/);
            if (match && name.includes('_impl_') || name.includes('_private_')) {
                // Finde potenziellen Parent
                let baseName = name.split('_impl_')[0];
                if (baseName === name) baseName = name.split('_private_')[0];

                // Wir tun den Child in den gefundenen Parent (oder erstellen einen virtuellen)
                let parentObj = parents.find(p => p.name === baseName);
                if (!parentObj) {
                    parentObj = { name: baseName, isVirtual: !nodeList.includes(baseName), children: [] };
                    parents.push(parentObj);
                }
                parentObj.children.push(name);
            } else if (name.startsWith('/_ros2cli_daemon')) {
                let daemonParent = parents.find(p => p.name === 'System Daemons (CLI)');
                if (!daemonParent) {
                    daemonParent = { name: 'System Daemons (CLI)', isVirtual: true, children: [] };
                    parents.push(daemonParent);
                }
                daemonParent.children.push(name);
            } else if (name.includes('interactive_marker_display') || name.includes('rviz')) {
                let rvizParent = parents.find(p => p.name === 'RViz 2');
                if (!rvizParent) {
                    rvizParent = { name: 'RViz 2', isVirtual: true, children: [] };
                    parents.push(rvizParent);
                }
                rvizParent.children.push(name);
            } else {
                // Wenn es bereits als Parent angelegt wurde (weil ein Child vorher dran war), skip
                if (!parents.some(p => p.name === name)) {
                    parents.push({ name: name, isVirtual: false, children: [] });
                }
            }
        });

        // Aufräumen: Wenn ein Parent keine children hat, behandle ihn einfach als flachen Node (schönerer Code)
        return parents.sort((a, b) => a.name.localeCompare(b.name));
    }

    const wsHierarchies = parseNodeHierarchy(activeWsNodes);
    const sysHierarchies = parseNodeHierarchy(sysNodes);

    let html = '';

    window.toggleNodeGroup = function (btn) {
        const container = btn.closest('.node-group-container');
        if (!container) return;
        const body = container.querySelector('.node-group-body');
        const caret = btn.querySelector('.group-toggle-caret');
        const isCollapsed = body.style.display === 'none';
        body.style.display = isCollapsed ? 'block' : 'none';
        if (caret) caret.style.transform = isCollapsed ? 'rotate(90deg)' : 'rotate(0deg)';
    };

    window.toggleSubNodes = function (event, parentName) {
        event.stopPropagation();
        const parentLi = event.currentTarget.closest('.node-card, .virtual-node-card');
        if (parentLi) {
            const subList = parentLi.nextElementSibling;
            const caret = parentLi.querySelector('.sub-node-caret');
            if (subList && subList.classList.contains('sub-node-list')) {
                const isHidden = subList.style.display === 'none';
                subList.style.display = isHidden ? 'block' : 'none';
                if (caret) caret.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
            }
        }
    };

    function renderHierarchy(hierarchies, isSystem) {
        let outHtml = '';

        const getPackageForNode = (name) => {
            // Priority 1: direct live node data from the Python backend (most accurate)
            if (workspaceData.nodes && workspaceData.nodes[name]) {
                const pkg = workspaceData.nodes[name].package;
                if (pkg && pkg !== 'ROS 2 System' && pkg !== 'Unbekannt') return pkg;
            }

            // Priority 2: project_files entry that has this node as its active instance
            if (workspaceData.project_files) {
                for (let file in workspaceData.project_files) {
                    const pf = workspaceData.project_files[file];
                    if (pf.active_node_name === name && pf.package && pf.package !== 'Unbekannt') {
                        return pf.package;
                    }
                }
            }

            // Priority 3: live node package even if it is "ROS 2 System" (better than nothing)
            if (workspaceData.nodes && workspaceData.nodes[name]) {
                const pkg = workspaceData.nodes[name].package;
                if (pkg) return pkg;
            }

            return 'Unbekannt';
        };

        hierarchies.forEach(h => {
            const hasChildren = h.children && h.children.length > 0;
            const nodeClass = isSystem ? 'sys-node' : 'ws-node';
            const iconMain = isSystem ? 'fa-share-nodes' : 'fa-diagram-project';

            const isNodeRunning = (workspaceData.nodes && workspaceData.nodes[h.name]) ?
                (workspaceData.nodes[h.name].is_actually_running !== false) : true;
            const pulseColor = isNodeRunning ? 'rgb(0, 255, 136)' : 'rgb(100, 116, 139)';
            const statusPulse = `<span class="status-pulse" style="width: 10px; height: 10px; margin: 0 8px 0 0; background-color: ${pulseColor};"></span>`;

            if (h.isVirtual && hasChildren) {
                // Virtueller Parent (z.B. für System Daemons, Container)
                outHtml += `<li class="virtual-node-card" style="padding: 10px 15px; cursor: pointer; color: var(--text-secondary); display:flex; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.02);" onclick="toggleSubNodes(event, '${h.name}')">
                                <i class="fa-solid fa-chevron-right sub-node-caret" style="margin-right: 10px; font-size: 0.8rem; transition: transform 0.2s;"></i>
                                <i class="fa-solid fa-folder-tree" style="margin-right: 10px; font-size: 1.1rem; color: #64748b;"></i>
                                <span class="node-name-text" style="font-weight: 500;">${h.name}</span>
                                <span style="margin-left:auto; font-size:0.7rem; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 10px;">${h.children.length}</span>
                            </li>`;

                outHtml += `<ul class="sub-node-list" style="display:none; list-style:none; padding: 0; background: rgba(0,0,0,0.1);">`;
                h.children.forEach(child => {
                    const activeClass = (child === activeNodeName) ? 'active' : '';
                    const childPkg = getPackageForNode(child);
                    const isChildRunning = (workspaceData.nodes && workspaceData.nodes[child]) ?
                        (workspaceData.nodes[child].is_actually_running !== false) : true;
                    const cPulseColor = isChildRunning ? 'rgb(0, 255, 136)' : 'rgb(100, 116, 139)';
                    const cStatusPulse = `<span class="status-pulse" style="width: 10px; height: 10px; margin: 0 8px 0 0; background-color: ${cPulseColor};"></span>`;

                    outHtml += `<li class="${nodeClass} node-card sub-node-item ${activeClass}" data-name="${child}" onclick="selectNode('${child}')">
                                <div class="node-card-content" style="padding-left: 20px; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                                    <div style="display: flex; align-items: center;">
                                        ${cStatusPulse}
                                        ${wrapNodeTooltip(child, "node-name-text")}
                                    </div>
                                    <span class="node-package-badge" style="font-size: 0.7rem; color: #fff; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; margin-left: 8px; flex-shrink: 0;">${childPkg}</span>
                                </div>
                             </li>`;
                });
                outHtml += `</ul>`;
            } else {
                // Normaler Node
                const activeClass = (h.name === activeNodeName) ? 'active' : '';
                const iconColor = (h.name === activeNodeName) ? 'var(--accent-primary)' : 'var(--text-secondary)';

                let caretHtml = '';
                let clickAction = `onclick="selectNode('${h.name}')"`;

                if (hasChildren) {
                    caretHtml = `<div class="sub-toggle-zone" onclick="toggleSubNodes(event, '${h.name}')" style="padding: 5px; margin-right: 5px; cursor: pointer; z-index: 2;">
                                    <i class="fa-solid fa-chevron-right sub-node-caret" style="font-size: 0.8rem; transition: transform 0.2s; color: var(--text-secondary);"></i>
                                 </div>`;
                }

                const pkg = getPackageForNode(h.name);
                outHtml += `<li class="${nodeClass} node-card ${activeClass}" data-name="${h.name}" ${clickAction}>
                                <div class="node-card-content" style="display:flex; justify-content:space-between; align-items:center; width: 100%;">
                                    <div style="display: flex; align-items: center;">
                                        ${caretHtml}
                                        ${statusPulse}
                                        ${wrapNodeTooltip(h.name, "node-name-text")}
                                    </div>
                                    <span class="node-package-badge" style="font-size: 0.7rem; color: #fff; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; margin-left: 8px; flex-shrink: 0;">${pkg}</span>
                                </div>
                             </li>`;

                if (hasChildren) {
                    outHtml += `<ul class="sub-node-list" style="display:none; list-style:none; padding: 0; background: rgba(0,0,0,0.1);">`;
                    h.children.forEach(child => {
                        const childActiveClass = (child === activeNodeName) ? 'active' : '';
                        const childPkgInner = getPackageForNode(child);
                        outHtml += `<li class="${nodeClass} node-card sub-node-item ${childActiveClass}" data-name="${child}" onclick="selectNode('${child}')">
                                    <div class="node-card-content" style="padding-left: 35px; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                                        <div style="display: flex; align-items: center;">
                                            ${statusPulse}
                                            ${wrapNodeTooltip(child, "node-name-text")}
                                        </div>
                                        <span class="node-package-badge" style="font-size: 0.7rem; color: #fff; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; margin-left: 8px; flex-shrink: 0;">${childPkgInner}</span>
                                    </div>
                                 </li>`;
                    });
                    outHtml += `</ul>`;
                }
            }
        });
        return outHtml;
    }

    // NEU: Nodes - Übersicht Button ganz oben
    html += `<li class="ws-node node-card overview-button" style="border-color: var(--accent-primary); background: rgba(56, 189, 248, 0.05);" onclick="showNodesOverview()">
                <div class="node-card-content">
                    <i class="fa-solid fa-table-cells-large" style="color: var(--accent-primary); margin-right: 12px; font-size: 1.1rem;"></i>
                    <span class="node-name-text" style="font-weight: 600;">Nodes - Übersicht</span>
                </div>
             </li>
             
             <!-- NEU: Suche DAZWISCHEN -->
             <div class="search-box" style="margin-top: 15px; margin-bottom: 15px; width: 100%;">
                 <i class="fa-solid fa-magnifying-glass"></i>
                 <input id="node-search" onkeyup="filterNodes()" placeholder="Node suchen..." type="text" />
             </div>`;

    if (activeWsNodes.length > 0) {
        html += `<div class="node-group-container">
                    <div class="node-group-header ws-header" onclick="toggleNodeGroup(this)">
                        <span style="display: flex; align-items: center;"><i class="fa-solid fa-code" style="margin-right: 8px;"></i><div style="display:inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px rgba(16, 185, 129, 0.6); animation: pulse-dot 2s infinite; margin-right: 8px;"></div>Aktive Workspace Nodes</span>
                        <i class="fa-solid fa-chevron-right group-toggle-caret" style="transform: rotate(90deg); transition: transform 0.2s; font-size: 0.8rem; margin-left: auto;"></i>
                    </div>
                    <div class="node-group-body">`;
        html += renderHierarchy(wsHierarchies, false);
        html += `</div></div>`;
    }

    if (sysNodes.length > 0) {
        html += `<div class="node-group-container">
                    <div class="node-group-header sys-header" onclick="toggleNodeGroup(this)">
                        <span><i class="fa-solid fa-server" style="margin-right: 8px;"></i>ROS2 - System Nodes</span>
                        <i class="fa-solid fa-chevron-right group-toggle-caret" style="transform: rotate(90deg); transition: transform 0.2s; font-size: 0.8rem; margin-left: auto;"></i>
                    </div>
                    <div class="node-group-body">`;
        html += renderHierarchy(sysHierarchies, true);
        html += `</div></div>`;
    }

    if (inactiveWsNodes.length > 0) {
        html += `<div class="node-group-container" style="opacity: 0.8;">
                    <div class="node-group-header ws-inactive-header" onclick="toggleNodeGroup(this)">
                        <span><i class="fa-regular fa-file-code" style="margin-right: 8px;"></i>Lokale Workspace Nodes (.py, .cpp)</span>
                        <i class="fa-solid fa-chevron-right group-toggle-caret" style="transform: rotate(90deg); transition: transform 0.2s; font-size: 0.8rem; margin-left: auto;"></i>
                    </div>
                    <div class="node-group-body">`;
        inactiveWsNodes.forEach(n => {
            const activeClass = (n === activeNodeName) ? 'active' : '';
            const iconColor = (n === activeNodeName) ? 'var(--accent-primary)' : '#64748b';
            const statusPulse = '<span style="display:inline-block; width: 10px; height: 10px; margin: 0 8px 0 0; background-color: #64748b; border-radius: 50%;"></span>';

            const pkg = workspaceData.project_files[n]?.package || 'Unknown';
            html += `<li class="ws-inactive-node node-card ${activeClass}" style="opacity: 0.7;" data-name="${n}" onclick="selectNode('${n}')">
                        <div class="node-card-content" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                            <div style="display: flex; align-items: center;">
                                ${statusPulse}
                                <i class="fa-solid fa-file" style="color: ${iconColor}; margin-right: 12px; font-size: 1.1rem;"></i>
                                <span class="node-name-text" style="color: #cbd5e1;">${n}</span>
                            </div>
                            <span class="node-package-badge" style="font-size: 0.7rem; color: #fff; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; margin-left: 8px; flex-shrink: 0;">${pkg}</span>
                        </div>
                     </li>`;
        });
        html += `</div></div>`;
    }

    listEl.innerHTML = html;
    filterNodes();
}

function filterNodes() {
    const filter = document.getElementById('node-search').value.toLowerCase();
    const items = document.getElementById('dynamic-node-list').getElementsByTagName('li');

    let wsVisible = 0;
    let sysVisible = 0;
    let wsInactiveVisible = 0;

    for (let i = 0; i < items.length; i++) {
        if (items[i].classList.contains('empty-state')) continue;
        if (items[i].classList.contains('overview-button')) continue;

        const text = items[i].textContent || items[i].innerText;
        const isMatch = text.toLowerCase().indexOf(filter) > -1;

        items[i].style.display = isMatch ? "flex" : "none";

        if (isMatch) {
            if (items[i].classList.contains('ws-node')) wsVisible++;
            if (items[i].classList.contains('sys-node')) sysVisible++;
            if (items[i].classList.contains('ws-inactive-node')) wsInactiveVisible++;
        }
    }

    // Show/hide the whole group container (header + body)
    const containers = document.querySelectorAll('.node-group-container');
    containers.forEach(container => {
        if (container.querySelector('.ws-header')) {
            container.style.display = wsVisible > 0 ? 'block' : 'none';
        } else if (container.querySelector('.sys-header')) {
            container.style.display = sysVisible > 0 ? 'block' : 'none';
        } else if (container.querySelector('.ws-inactive-header')) {
            container.style.display = wsInactiveVisible > 0 ? 'block' : 'none';
        }
    });
}

const IGNORE_TOPICS = ['/parameter_events', '/rosout'];
function filterValidTopics(topicsArray) {
    return (topicsArray || []).filter(t => !IGNORE_TOPICS.includes(t));
}

const IGNORE_SERVICES = [
    'describe_parameters',
    'get_parameter_types',
    'get_parameters',
    'list_parameters',
    'set_parameters',
    'set_parameters_atomically'
];

function filterValidServices(servicesArray) {
    return (servicesArray || []).filter(s => {
        return !IGNORE_SERVICES.some(ignore => s.name.endsWith('/' + ignore) || s.name === ignore);
    });
}

function getNodeData(name) {
    if (workspaceData.nodes && workspaceData.nodes[name]) return workspaceData.nodes[name];
    if (workspaceData.project_files && workspaceData.project_files[name]) return workspaceData.project_files[name];
    return null;
}

function findConnections(targetNode) {
    let connectedTo = [];
    let connectedFrom = [];

    const targetData = getNodeData(targetNode);
    if (!targetData) return { connectedTo, connectedFrom };

    const myPubTopics = filterValidTopics((targetData.publishers || []).map(p => p.topic));
    const mySubTopics = filterValidTopics((targetData.subscribers || []).map(s => s.topic));

    let matchedPubs = new Set();
    let matchedSubs = new Set();

    // NUR aktuell laufende Nodes berücksichtigen, wie vom User gewünscht
    const allEntities = workspaceData.nodes || {};

    for (const [otherNode, otherData] of Object.entries(allEntities)) {
        if (otherNode === targetNode) continue;

        const otherPubTopics = filterValidTopics((otherData.publishers || []).map(p => p.topic));
        const otherSubTopics = filterValidTopics((otherData.subscribers || []).map(s => s.topic));

        const commonPubSub = myPubTopics.filter(t => otherSubTopics.includes(t));
        if (commonPubSub.length > 0) {
            connectedTo.push({ node: otherNode, topics: commonPubSub, isUnbound: false });
            commonPubSub.forEach(t => matchedPubs.add(t));
        }

        const commonSubPub = mySubTopics.filter(t => otherPubTopics.includes(t));
        if (commonSubPub.length > 0) {
            connectedFrom.push({ node: otherNode, topics: commonSubPub, isUnbound: false });
            commonSubPub.forEach(t => matchedSubs.add(t));
        }
    }

    return { connectedTo, connectedFrom };
}

function selectNode(nodeName, skipRequest = false) {
    // Set video playback speed
    const video = document.querySelector('.nd-flow-video');
    if (video) video.playbackRate = 0.3;

    const items = document.getElementById('dynamic-node-list').getElementsByTagName('li');
    for (let i = 0; i < items.length; i++) {
        items[i].classList.remove('active');
        if (items[i].dataset.name === nodeName) items[i].classList.add('active');
    }

    document.getElementById('global-graph-view').classList.add('hidden');
    document.getElementById('nodes-overview-view').classList.add('hidden');
    document.getElementById('node-details-view').classList.remove('hidden');

    // On-Demand Details vom Backend anfordern (nur wenn nicht durch Update getriggert)
    if (nodeDetailReqPub && !skipRequest) {
        nodeDetailReqPub.publish(new ROSLIB.Message({ data: nodeName }));
    }

    const data = getNodeData(nodeName);
    if (!data) return;

    const elTitle = document.getElementById('nd-title');
    if (elTitle) elTitle.textContent = (data.active_node_name) ? data.active_node_name : (data.file_name ? data.file_name : nodeName);

    const elCenter = document.getElementById('nd-flow-center-name');
    const displayName = (data.active_node_name) ? data.active_node_name : (data.file_name ? data.file_name : nodeName);
    if (elCenter) {
        elCenter.innerHTML = wrapNodeTooltip(displayName);
    }

    const elHeaderNode = document.getElementById('nd-header-node-label');
    if (elHeaderNode) {
        const displayName = (data.active_node_name) ? data.active_node_name : (data.file_name ? data.file_name : nodeName);
        elHeaderNode.innerHTML = `<img src="node-icon.svg" style="width: 14px; height: 14px; opacity: 0.6;"> [node]: ${wrapNodeTooltip(displayName)}`;
    }

    const elPkg = document.getElementById('nd-pkg');
    const elPkgIcon = document.getElementById('nd-pkg-icon');
    const elHeaderIcon = document.getElementById('nd-header-icon');
    if (elPkg) {
        const category = data.category || (data.is_workspace ? 'workspace' : 'system');
        const catBadge = {
            'workspace': { icon: 'fa-code-branch', color: '#ffffff', label: '' },
            'system_via_launch': { icon: 'fa-rocket', color: '#ef4444', label: ' (via Launch)' },
            'system': { icon: 'fa-microchip', color: '#ef4444', label: ' (ROS 2 System)' },
        }[category] || { icon: 'fa-box', color: '#ef4444', label: '' };

        // Rahmen für Paket-Chip
        const pkgChip = document.querySelector('.nd-header-pkg');
        if (pkgChip) {
            pkgChip.style.border = "1px solid rgba(255, 255, 255, 0.4)";
        }

        // 1. Paketname + Label (Dopplung verhindern)
        let displayPkg = data.package || 'Unbekannt';
        let displayLabel = catBadge.label;

        // Verhindert "ROS 2 System (ROS 2 System)"
        if (displayPkg === "ROS 2 System" && displayLabel.includes("ROS 2 System")) {
            displayLabel = "";
        }

        elPkg.innerHTML = `${displayPkg}<span style="font-size:0.65rem; opacity:0.6; margin-left:6px; font-weight:400;">${displayLabel}</span>`;

        // 2. Icon im Chip
        if (elPkgIcon) {
            elPkgIcon.className = `fa-solid ${catBadge.icon} chip-main-icon`;
            elPkgIcon.style.color = catBadge.color;
        }

        // 3. Farbe des Haupt-Node-Icons im Header (Ganz links)
        if (elHeaderIcon) {
            if (category === 'workspace') {
                elHeaderIcon.style.backgroundColor = '#ffffff'; // Weiß für Workspace
            } else {
                elHeaderIcon.style.backgroundColor = '#ef4444'; // Rot für System
            }
        }
    }

    const elPath = document.getElementById('nd-path');
    if (elPath) {
        const category = data.category || (data.is_workspace ? 'workspace' : 'system');
        elPath.textContent = data.file_path || 'Pfad unbekannt';

        // Interaktivität und Rahmen des Pfad-Chips
        const pathChip = document.querySelector('.nd-header-path');
        if (pathChip) {
            // Standard: Weißer Rahmen
            pathChip.style.border = "1px solid rgba(255, 255, 255, 0.4)";

            if (category === 'workspace') {
                pathChip.classList.add('interactive');
                pathChip.style.opacity = '1';
                pathChip.style.pointerEvents = '';

                // LÖSUNG: Bei Hover den Inline-Rahmen löschen, damit die CSS-Hover-Klasse (Glow) greift
                pathChip.onmouseenter = () => pathChip.style.border = "";
                pathChip.onmouseleave = () => pathChip.style.border = "1px solid rgba(255, 255, 255, 0.4)";
            } else {
                pathChip.classList.remove('interactive');
                pathChip.style.opacity = '1'; /* Jetzt genauso leuchtend wie Workspace Nodes */
                pathChip.style.pointerEvents = 'none'; /* Bleibt nicht-klickbar, da System-Pfad */

                pathChip.onmouseenter = null;
                pathChip.onmouseleave = null;
            }
        }
    }

    const codeBtn = document.getElementById('btn-show-code');
    if (codeBtn) {
        const category = data.category || (data.is_workspace ? 'workspace' : 'system');
        const hasPath = data.file_path && !data.file_path.startsWith('/opt/ros') && !data.file_path.includes('...');
        if (category === 'workspace' && hasPath) {
            codeBtn.style.display = 'flex';
        } else {
            codeBtn.style.display = 'none';
        }
    }

    const depContainer = document.getElementById('nd-dependencies');
    if (depContainer) {
        if (data.is_workspace || (data.dependencies && data.dependencies.length > 0)) {
            const deps = data.dependencies || [];
            if (deps.length === 0) {
                depContainer.innerHTML = "<div class='empty-state'>Keine Abhängigkeiten in package.xml gefunden</div>";
            } else {
                const typeColorMap = {
                    "depend": { label: "General", colorClass: "dep-general" },
                    "build_depend": { label: "Build", colorClass: "dep-build" },
                    "exec_depend": { label: "Exec", colorClass: "dep-exec" },
                    "test_depend": { label: "Test", colorClass: "dep-test" },
                    "build_export_depend": { label: "Build Export", colorClass: "dep-build" },
                    "buildtool_depend": { label: "Tool", colorClass: "dep-build" }
                };

                const legendHtml = `
                    <div class="dep-legend" style="display: flex; justify-content: center; align-items: center; gap: 15px; margin-bottom: 20px; background: rgba(0, 0, 0, 0); padding: 12px 18px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.32); flex-wrap: wrap; width: 100%; box-shadow: inset 0 2px 4px rgba(165, 165, 165, 0.2);">
                        <span style="font-size: 0.85rem; color: var(--text-secondary); margin-right: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;"><i class="fa-solid fa-layer-group" style="margin-right: 6px; color: var(--accent-primary);"></i> Legende:</span>
                        
                        <div class="tooltip-container" style="display: flex; align-items: center; gap: 6px;">
                            <span class="dep-badge dep-build" style="padding: 2px 10px; font-size: 0.78rem; font-weight: 600;"><i class="fa-solid fa-hammer"></i> Build</span>
                            <div class="tooltip-text" style="width: 280px; padding: 12px; line-height: 1.5;">
                                <b style="color: #10b981;">Build-Phase:</b><br>
                                • <b>buildtool:</b> Benötigt zum Kompilieren (CMake/Ament)<br>
                                • <b>build:</b> Header/Bibliotheken zur Compile-Zeit<br>
                                • <b>build_export:</b> Wird von abhängigen Paketen benötigt
                            </div>
                        </div>

                        <div class="tooltip-container" style="display: flex; align-items: center; gap: 6px;">
                            <span class="dep-badge dep-exec" style="padding: 2px 10px; font-size: 0.78rem; font-weight: 600;"><i class="fa-solid fa-play"></i> Run</span>
                            <div class="tooltip-text" style="width: 280px; padding: 12px; line-height: 1.5;">
                                <b style="color: var(--accent-secondary);">Laufzeit:</b><br>
                                Pakete, die während der Ausführung des Nodes geladen oder gestartet werden müssen.
                            </div>
                        </div>

                        <div class="tooltip-container" style="display: flex; align-items: center; gap: 6px;">
                            <span class="dep-badge dep-general" style="padding: 2px 10px; font-size: 0.78rem; font-weight: 600;"><i class="fa-solid fa-link"></i> Core</span>
                            <div class="tooltip-text" style="width: 280px; padding: 12px; line-height: 1.5;">
                                <b style="color: var(--accent-primary);">Kombiniert:</b><br>
                                Standard-ROS-Abhängigkeit (Build+Run+Export).
                            </div>
                        </div>

                        <div class="tooltip-container" style="display: flex; align-items: center; gap: 6px;">
                            <span class="dep-badge dep-test" style="padding: 2px 10px; font-size: 0.78rem; font-weight: 600;"><i class="fa-solid fa-microscope"></i> Test</span>
                            <div class="tooltip-text" style="width: 280px; padding: 12px; line-height: 1.5;">
                                <b style="color: #f59e0b;">Test-Umgebung:</b><br>
                                Nur für Unit-Tests oder Linting erforderlich.
                            </div>
                        </div>
                    </div>
                `;

                // Categorization logic
                const groups = {
                    "Core": { deps: [], icon: "fa-cube", color: "var(--accent-primary)" },
                    "Build & Tools": { deps: [], icon: "fa-screwdriver-wrench", color: "#10b981" },
                    "Laufzeit (Runtime)": { deps: [], icon: "fa-play", color: "var(--accent-secondary)" },
                    "Test": { deps: [], icon: "fa-microscope", color: "#f59e0b" }
                };

                deps.forEach(d => {
                    if (d.type === "depend") groups["Core"].deps.push(d);
                    else if (d.type === "exec_depend") groups["Laufzeit (Runtime)"].deps.push(d);
                    else if (d.type === "test_depend") groups["Test"].deps.push(d);
                    else groups["Build & Tools"].deps.push(d);
                });

                let categorizedHtml = '<div class="nd-all-dependencies" style="display: flex; flex-wrap: wrap; gap: 8px;">';
                for (const [title, group] of Object.entries(groups)) {
                    if (group.deps.length > 0) {
                        group.deps.sort((a, b) => a.name.localeCompare(b.name));
                        categorizedHtml += group.deps.map(d => {
                            const config = typeColorMap[d.type] || { label: "Dep", colorClass: "dep-general" };
                            return `<span class='dep-badge ${config.colorClass}' style="box-shadow: 0 4px 10px rgba(0,0,0,0.15);"><i class="fa-solid fa-box-open"></i> ${d.name}</span>`;
                        }).join('');
                    }
                }
                categorizedHtml += '</div>';

                depContainer.innerHTML = legendHtml + categorizedHtml;
            }
        } else {
            depContainer.innerHTML = "<div class='empty-state'>System Node - keine lokalen Abhängigkeiten</div>";
        }
    }

    const conns = findConnections(nodeName);
    let hasActiveFlow = false;

    const flowOutEl = document.getElementById('nd-flow-out');
    const flowInEl = document.getElementById('nd-flow-in');
    let allRelevantTopics = [];

    const HARDWARE_INPUT_NODES = ['xarm_moveit_servo_keyboard_node', 'joy_node'];

    if (flowInEl) {
        let connInHtml = '';

        // 1. Hardware Input (Special Case)
        const checkNodeName = nodeName.startsWith('/') ? nodeName.substring(1) : nodeName;
        if (HARDWARE_INPUT_NODES.includes(checkNodeName)) {
            connInHtml += `<div class='conn-card unbound-card rx-card d-flex flex-column gap-2'>
                <div class='d-flex justify-content-between align-items-center w-100'>
                    <span class='conn-node-name m-0' title='Linux-Hardware-Input'>
                        <img src="linux-icon.png" class="me-2" style="width: 32px; height: 32px; vertical-align: middle; object-fit: contain;" alt="Linux"><span class="multiline-label">Linux-Hardware-Input </span>
                        <i class="fa-solid fa-circle-info tooltip-icon ms-2" style="color: var(--color-warning); font-size: 0.9em;" 
                           title="Dieser Node empfängt Daten direkt von der Hardware (z.B. Tastatur/Gamepad) über das Betriebssystem und nicht über das ROS-Netzwerk."></i>
                    </span>
                    <span class='card-hz-display'>Local OS</span>
                </div>
            </div>`;
        }

        // 2. Grouped Services / Action Servers (Incoming)
        if (data.services && data.services.length > 0) {
            const filteredServices = filterValidServices(data.services);
            const actionServers = filteredServices.filter(s => s.name.includes('/_action/'));
            const regularServices = filteredServices.filter(s => !s.name.includes('/_action/'));

            if (regularServices.length > 0) {
                const count = regularServices.length;
                const badge = `<div class='comm-badge badge-res'>RES</div>`;
                const wrapper = `<div class="d-flex gap-2 align-items-stretch mb-2 w-100">
                                    ${badge}
                                    <div class="d-flex flex-column gap-1 flex-grow-1 justify-content-center">
                                        <span class='conn-topic-badge text-center cursor-pointer p-2 m-0' style="background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.2); color: #c084fc;" onclick="document.getElementById('nd-services-section').scrollIntoView({behavior: 'smooth'})">
                                            ${count} Service Server${count > 1 ? 's' : ''}
                                            <i class="fa-solid fa-arrow-down ms-2" style="font-size: 0.8em; opacity: 0.7;"></i>
                                        </span>
                                    </div>
                                  </div>`;
                connInHtml += `<div class='conn-card rx-card d-flex flex-column gap-2' style='border-color: rgba(168, 85, 247, 0.5);'>
                    <div class='d-flex justify-content-between align-items-center w-100'>
                        <span class='conn-node-name m-0' title='Service Server'>
                            <span class="me-2" style="display:inline-block; width: 18px; height: 18px; background-color: #ffffff; -webkit-mask: url(service-icon.png) no-repeat center / contain; mask: url(service-icon.png) no-repeat center / contain; flex-shrink: 0;"></span><span class="text-truncate">Service Server</span>
                        </span>
                        <span class='card-hz-display' style="color: #a855f7; border-color: rgba(168, 85, 247, 0.2);">RES (Server)</span>
                    </div>
                    <div class='topics-wrapper w-100'>${wrapper}</div>
                </div>`;
            }

            if (actionServers.length > 0) {
                const actionCount = Math.max(1, Math.ceil(actionServers.length / 5));
                // Derive unique feedback topics from server-side _action entries
                const actionFeedbackTopics = [...new Set(
                    actionServers.map(s => s.name.replace(/\/_action\/.*$/, '/_action/feedback'))
                )];
                const badge = `<div class='comm-badge badge-act'>ACT</div>`;
                const wrapper = `<div class="d-flex gap-2 align-items-stretch mb-2 w-100">
                                    ${badge}
                                    <div class="d-flex flex-column gap-1 flex-grow-1 justify-content-center">
                                        <span class='conn-topic-badge topic-badge-act text-center cursor-pointer p-2 m-0' onclick="document.getElementById('nd-services-section').scrollIntoView({behavior: 'smooth'})">
                                            ${actionCount} Action Server aktiv
                                            <i class="fa-solid fa-arrow-down ms-2" style="font-size: 0.8em; opacity: 0.7;"></i>
                                        </span>
                                    </div>
                                  </div>`;
                connInHtml += `<div class='conn-card rx-card action-trackable d-flex flex-column gap-2' data-action-feedback='${JSON.stringify(actionFeedbackTopics)}' style='border-color: rgba(239, 68, 68, 0.5);'>
                    <div class='d-flex justify-content-between align-items-center w-100'>
                        <span class='conn-node-name m-0' title='Action Server'>
                            <i class="fa-solid fa-bolt me-2" style="color: #ef4444; flex-shrink: 0;"></i><span class="text-truncate">Action Server</span>
                        </span>
                        <span class='card-hz-display action-hz' style="color: #f87171; border-color: rgba(239, 68, 68, 0.2);">RES (Server)</span>
                    </div>
                    <div class='topics-wrapper w-100'>${wrapper}</div>
                </div>`;

                // Add feedback topics to the global tracker
                actionFeedbackTopics.forEach(t => allRelevantTopics.push({ topic: t, type: 'Unbekannt' }));
            }
        }

        // 3. Topic Connections
        if (conns.connectedFrom.length > 0) {
            conns.connectedFrom.forEach(c => {
                const topicsBadges = `<div class="d-flex flex-column gap-1 mb-2 w-100">
                                        ${c.topics.map(t => `
                                        <div class="d-flex gap-2 align-items-stretch w-100">
                                            <div class='comm-badge badge-pub'>PUB</div>
                                            <span class='conn-topic-badge p-2 m-0 flex-grow-1 w-100' data-topic='${t}'>${truncateTopic(t)}</span>
                                        </div>`).join('')}
                                      </div>`;
                const cardClass = c.isUnbound ? 'unbound-card rx-card live-trackable' : 'rx-card active-flow-rx live-trackable';
                const nodeIcon = c.isUnbound
                    ? '<i class="fa-solid fa-wifi me-2" style="color: #64748b;" title="Offener Endpunkt"></i>'
                    : '<span class="flow-icon-pulse me-2" style="display:inline-block; width: 28px; height: 28px; background-color: var(--color-rx); -webkit-mask: url(node-icon.svg) no-repeat center / contain; mask: url(node-icon.svg) no-repeat center / contain;" title="Empfängt Daten von"></span>';

                connInHtml += `<div class='conn-card ${cardClass} d-flex flex-column gap-2' data-topics='${JSON.stringify(c.topics)}'>
                    <div class='d-flex justify-content-between align-items-center w-100' style="position: relative;">
                        <span class='conn-node-name m-0'>${nodeIcon.replace('>', ' style="flex-shrink: 0;">')}${wrapNodeTooltip(c.node)}</span>
                        <span class='card-hz-display'>-- Hz</span>
                    </div>
                    <div class='topics-wrapper w-100'>${topicsBadges}</div>
                </div>`;

                c.topics.forEach(t => allRelevantTopics.push({ topic: t, type: "Unbekannt" }));
            });
        }

        if (connInHtml === '') {
            connInHtml = "<div style='color:#64748b; font-style:italic; text-align:center; padding: 20px;'>Empfängt keine Daten!</div>";
        }

        flowInEl.innerHTML = connInHtml;
        const arrowRxEl = document.querySelector('.flow-arrow.color-rx');
        if (arrowRxEl) {
            arrowRxEl.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <i class="fa-solid fa-chevron-right chevron-anim" style="animation-delay: 0.0s"></i>
                    <i class="fa-solid fa-chevron-right chevron-anim" style="animation-delay: 0.4s"></i>
                    <i class="fa-solid fa-chevron-right chevron-anim" style="animation-delay: 0.8s"></i>
                    <i class="fa-solid fa-chevron-right chevron-anim" style="animation-delay: 1.2s"></i>
                    <i class="fa-solid fa-chevron-right chevron-anim" style="animation-delay: 1.6s"></i>
                </div>
                <div class="comm-badge" style="margin-left: 20px; background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);">SUB</div>
            `;
        }
    }

    if (flowOutEl) {
        let connOutHtml = '';

        // 1. Grouped Service Clients / Action Clients (Outgoing)
        const filteredClients = filterValidServices(data.clients || []);
        const actionClients = filteredClients.filter(c => c.name.includes('/_action/'));
        const regularClients = filteredClients.filter(c => !c.name.includes('/_action/'));

        if (regularClients.length > 0) {
            const count = regularClients.length;
            const badge = `<div class='comm-badge badge-req'>REQ</div>`;
            const wrapper = `<div class="d-flex gap-2 align-items-stretch mb-2 w-100">
                                    ${badge}
                                    <div class="d-flex flex-column gap-1 flex-grow-1 justify-content-center">
                                        <span class='conn-topic-badge topic-badge-req text-center cursor-pointer p-2 m-0' onclick="document.getElementById('nd-services-section').scrollIntoView({behavior: 'smooth'})">
                                            ${count} Service Client (Anfrage)
                                            <i class="fa-solid fa-arrow-down ms-2" style="font-size: 0.8em; opacity: 0.7;"></i>
                                        </span>
                                    </div>
                                  </div>`;
            connOutHtml += `<div class='conn-card tx-card d-flex flex-column gap-2' style='border-color: rgba(56, 189, 248, 0.5);'>
                <div class='d-flex justify-content-between align-items-center w-100'>
                    <span class='conn-node-name m-0' title='Service Client'>
                        <span class="me-2" style="display:inline-block; width: 18px; height: 18px; background-color: #ffffff; -webkit-mask: url(service-icon.png) no-repeat center / contain; mask: url(service-icon.png) no-repeat center / contain; flex-shrink: 0;"></span><span class="text-truncate">Service Client</span>
                    </span>
                    <span class='card-hz-display' style="color: #38bdf8; border-color: rgba(56, 189, 248, 0.2);">REQ (Client)</span>
                </div>
                <div class='topics-wrapper w-100'>${wrapper}</div>
            </div>`;
        }

        if (actionClients.length > 0) {
            const actionCount = Math.max(1, Math.ceil(actionClients.length / 5));
            // Derive unique action base names, e.g. '/whisper/inference' from '/whisper/inference/_action/send_goal'
            const actionFeedbackTopics = [...new Set(
                actionClients.map(c => c.name.replace(/\/_action\/.*$/, '/_action/feedback'))
            )];
            const badge = `<div class='comm-badge badge-act'>ACT</div>`;
            const wrapper = `<div class="d-flex gap-2 align-items-stretch mb-2 w-100">
                                    ${badge}
                                    <div class="d-flex flex-column gap-1 flex-grow-1 justify-content-center">
                                        <span class='conn-topic-badge topic-badge-act text-center cursor-pointer p-2 m-0' onclick="document.getElementById('nd-services-section').scrollIntoView({behavior: 'smooth'})">
                                            ${actionCount} Action Client aktiv
                                            <i class="fa-solid fa-arrow-down ms-2" style="font-size: 0.8em; opacity: 0.7;"></i>
                                        </span>
                                    </div>
                                  </div>`;
            connOutHtml += `<div class='conn-card tx-card action-trackable d-flex flex-column gap-2' data-action-feedback='${JSON.stringify(actionFeedbackTopics)}' style='border-color: rgba(239, 68, 68, 0.5);'>
                <div class='d-flex justify-content-between align-items-center w-100'>
                    <span class='conn-node-name m-0' title='Action Client'>
                        <i class="fa-solid fa-bolt me-2" style="color: #ef4444; flex-shrink: 0;"></i><span class="text-truncate">Action Client</span>
                    </span>
                    <span class='card-hz-display action-hz' style="color: #f87171; border-color: rgba(239, 68, 68, 0.2);">REQ (Client)</span>
                </div>
                <div class='topics-wrapper w-100'>${wrapper}</div>
            </div>`;

            // Add feedback topics to the global tracker
            actionFeedbackTopics.forEach(t => allRelevantTopics.push({ topic: t, type: 'Unbekannt' }));
        }

        // 2. Topic Connections
        if (conns.connectedTo.length > 0) {
            conns.connectedTo.forEach(c => {
                const topicsBadges = `<div class="d-flex flex-column gap-1 mb-2 w-100">
                                        ${c.topics.map(t => `
                                        <div class="d-flex gap-2 align-items-stretch w-100">
                                            <div class='comm-badge badge-sub'>SUB</div>
                                            <span class='conn-topic-badge p-2 m-0 flex-grow-1 w-100' data-topic='${t}'>${truncateTopic(t)}</span>
                                        </div>`).join('')}
                                      </div>`;
                const cardClass = c.isUnbound ? 'unbound-card tx-card live-trackable' : 'tx-card active-flow-tx live-trackable';
                const nodeIcon = c.isUnbound
                    ? '<i class="fa-solid fa-satellite-dish me-2" style="color: #64748b;" title="Offener Endpunkt"></i>'
                    : '<span class="flow-icon-pulse me-2" style="display:inline-block; width: 28px; height: 28px; background-color: var(--color-tx); -webkit-mask: url(node-icon.svg) no-repeat center / contain; mask: url(node-icon.svg) no-repeat center / contain;" title="Sendet Daten an"></span>';
                connOutHtml += `<div class='conn-card ${cardClass} d-flex flex-column gap-2' data-topics='${JSON.stringify(c.topics)}'>
                    <div class='d-flex justify-content-between align-items-center w-100'>
                        <span class='conn-node-name m-0'>${nodeIcon.replace('>', ' style="flex-shrink: 0;">')}${wrapNodeTooltip(c.node)}</span>
                        <span class='card-hz-display'>-- Hz</span>
                    </div>
                    <div class='topics-wrapper w-100'>${topicsBadges}</div>
                </div>`;

                c.topics.forEach(t => allRelevantTopics.push({ topic: t, type: "Unbekannt" }));
            });
        }

        if (connOutHtml === '') {
            connOutHtml = "<div style='color:#64748b; font-style:italic; text-align:center; padding: 20px;'>Sendet keine Daten!</div>";
        }

        flowOutEl.innerHTML = connOutHtml;
        const arrowTxEl = document.querySelector('.flow-arrow.color-tx');
        if (arrowTxEl) {
            arrowTxEl.innerHTML = `
                <div class="comm-badge" style="margin-right: 20px; background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">PUB</div>
                <div style="display: flex; align-items: center;">
                    <i class="fa-solid fa-chevron-right chevron-anim" style="animation-delay: 0.0s"></i>
                    <i class="fa-solid fa-chevron-right chevron-anim" style="animation-delay: 0.4s"></i>
                    <i class="fa-solid fa-chevron-right chevron-anim" style="animation-delay: 0.8s"></i>
                    <i class="fa-solid fa-chevron-right chevron-anim" style="animation-delay: 1.2s"></i>
                    <i class="fa-solid fa-chevron-right chevron-anim" style="animation-delay: 1.6s"></i>
                </div>
            `;
        }
    }

    // Add static topics to tracker
    if (data.subscribers) data.subscribers.forEach(s => {
        if (!IGNORE_TOPICS.includes(s.topic)) allRelevantTopics.push({ topic: s.topic, type: (s.types && s.types.length > 0) ? s.types[0] : "Unbekannt" });
    });
    if (data.publishers) data.publishers.forEach(p => {
        if (!IGNORE_TOPICS.includes(p.topic)) allRelevantTopics.push({ topic: p.topic, type: (p.types && p.types.length > 0) ? p.types[0] : "Unbekannt" });
    });

    // Deduplicate topics before sending request
    const uniqueTopics = [];
    const topicSet = new Set();
    allRelevantTopics.forEach(t => {
        if (!topicSet.has(t.topic)) {
            topicSet.add(t.topic);
            uniqueTopics.push(t);
        }
    });

    // Trigger live topic activity tracker for the new node
    if (window.requestTopicActivity && uniqueTopics.length > 0) {
        window.requestTopicActivity(uniqueTopics);
    }

    const isLive = Object.keys(workspaceData.nodes || {}).includes(nodeName);

    const centerNodeBox = document.querySelector('.center-node-box');
    if (centerNodeBox) {
        centerNodeBox.classList.remove('center-node-active');
        if (isLive) {
            centerNodeBox.classList.add('node-is-live');
            const dot = centerNodeBox.querySelector('.node-status-dot');
            if (dot) {
                dot.style.display = 'inline-block';
                dot.style.width = '12px';
                dot.style.height = '12px';
                dot.style.borderRadius = '50%';
                dot.style.marginRight = '8px';
                dot.style.background = '#00ff88';
                dot.style.boxShadow = '0 0 8px rgba(0,255,136,0.6)';
                dot.style.animation = 'pulse-dot 3s infinite ease-in-out';
            }
        } else {
            centerNodeBox.classList.remove('node-is-live');
            const dot = centerNodeBox.querySelector('.node-status-dot');
            if (dot) {
                dot.style.display = 'inline-block';
                dot.style.width = '8px';
                dot.style.height = '8px';
                dot.style.borderRadius = '50%';
                dot.style.marginRight = '8px';
                dot.style.background = '#64748b';
                dot.style.boxShadow = 'none';
                dot.style.animation = 'none';
            }
        }
    }

    const subsContainer = document.getElementById('nd-subs');
    if (subsContainer) {
        const validSubs = (data.subscribers || []).filter(s => !IGNORE_TOPICS.includes(s.topic));
        let filterHtml = "";
        if (data.filtered_subs_count > 0) {
            filterHtml = `<div class="tooltip-container" style="margin-bottom: 10px; color: var(--text-secondary); font-size: 0.85rem; background: rgba(255,165,0,0.1); border-left: 3px solid orange; padding: 5px 10px; border-radius: 4px;">
                <i class="fa-solid fa-filter" style="color: orange; margin-right: 5px;"></i> ${data.filtered_subs_count} Topic(s) gefiltert
                <i class="fa-solid fa-circle-info tooltip-icon" style="margin-left: 5px; cursor: help; font-size: 0.75rem;"></i>
                <div class="tooltip-text" style="width: 250px;">
                    <b>Warum gefiltert?</b><br>
                    Diese Topics werden vom Node nur kurzzeitig oder intern dynamisch abonniert (z.B. für Live-Monitoring). Sie sind nicht Teil der festen statischen Architektur des Nodes und wurden zur besseren Übersichtlichkeit ausgeblendet.
                </div>
            </div>`;
        }

        if (validSubs.length === 0) {
            subsContainer.innerHTML = filterHtml + "<div class='empty-state' style='padding:15px; text-align:center; color:var(--text-secondary); font-style:italic;'>Keine relevanten Subscriber</div>";
        } else {
            subsContainer.innerHTML = filterHtml + validSubs.map(s => {
                const typeStr = (s.types && s.types.length > 0) ? s.types.join(', ') : "Unbekannt";
                return `<div class='topic-item live-trackable rx-card' data-topics='["${s.topic}"]' style='position: relative; transition: box-shadow 0.3s, border-color 0.3s;'>
                            <span class='card-hz-display' style='position:absolute; top: -10px; right: -5px; background: #0f172a; padding: 2px 7px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); font-size: 0.65rem;'>-- Hz</span>
                            <div class="topic-info-row"><span class="topic-lbl">Topic:</span><i class="fa-solid fa-circle-dot topic-icon" id="icon-sub-${s.topic.replace(/\//g, '-')}" style="margin-right: 6px; color: var(--text-secondary); transition: color 0.3s, text-shadow 0.3s;"></i>${wrapNodeTooltip(s.topic, "topic-val")}</div>
                            <div class="topic-info-row"><span class="topic-lbl">Type:</span><span class="topic-type-badge">${typeStr}</span></div>
                            <div class="topic-info-row msg-content" id="msg-${s.topic.replace(/\//g, '-')}">
                                <span class="topic-lbl">Msg:</span>
                                <div class="tooltip-container" style="display: inline-flex; vertical-align: bottom;">
                                    <span class="topic-val text-truncate" style="color:var(--text-secondary); font-size:0.8rem; border-bottom: 1px dashed rgba(255,255,255,0.25);">Wartet auf Daten...</span>
                                    <div class="tooltip-text msg-tooltip" style="width: max-content; max-width: 350px; white-space: pre-wrap; word-break: break-word; z-index: 9999; left: 0; transform: none; top: 100%; margin-top: 5px;">Wartet auf Daten...</div>
                                </div>
                            </div>
                        </div>`;
            }).join('');
        }
    }

    const pubsContainer = document.getElementById('nd-pubs');
    if (pubsContainer) {
        const validPubs = (data.publishers || []).filter(p => !IGNORE_TOPICS.includes(p.topic));
        if (validPubs.length === 0) {
            pubsContainer.innerHTML = "<div class='empty-state' style='padding:15px; text-align:center; color:var(--text-secondary); font-style:italic;'>Keine relevanten Publisher</div>";
        } else {
            pubsContainer.innerHTML = validPubs.map(p => {
                const typeStr = (p.types && p.types.length > 0) ? p.types.join(', ') : "Unbekannt";
                return `<div class='topic-item live-trackable tx-card' data-topics='["${p.topic}"]' style='position: relative; transition: box-shadow 0.3s, border-color 0.3s;'>
                            <span class='card-hz-display' style='position:absolute; top: -10px; right: -5px; background: #0f172a; padding: 2px 7px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1); font-size: 0.65rem;'>-- Hz</span>
                            <div class="topic-info-row"><span class="topic-lbl">Topic:</span><i class="fa-solid fa-circle-dot topic-icon" id="icon-pub-${p.topic.replace(/\//g, '-')}" style="margin-right: 6px; color: var(--text-secondary); transition: color 0.3s, text-shadow 0.3s;"></i>${wrapNodeTooltip(p.topic, "topic-val")}</div>
                            <div class="topic-info-row"><span class="topic-lbl">Type:</span><span class="topic-type-badge">${typeStr}</span></div>
                            <div class="topic-info-row msg-content" id="msg-${p.topic.replace(/\//g, '-')}">
                                <span class="topic-lbl">Msg:</span>
                                <div class="tooltip-container" style="display: inline-flex; vertical-align: bottom;">
                                    <span class="topic-val text-truncate" style="color:var(--text-secondary); font-size:0.8rem; border-bottom: 1px dashed rgba(255,255,255,0.25);">Wartet auf Daten...</span>
                                    <div class="tooltip-text msg-tooltip" style="width: max-content; max-width: 350px; white-space: pre-wrap; word-break: break-word; z-index: 9999; left: 0; transform: none; top: 100%; margin-top: 5px;">Wartet auf Daten...</div>
                                </div>
                            </div>
                        </div>`;
            }).join('');
        }
    }

    // --- SERVICES ---
    const srvsContainer = document.getElementById('nd-services');
    if (srvsContainer) {
        const filteredServices = filterValidServices(data.services || []);
        const regularServices = filteredServices.filter(s => !s.name.includes('/_action/'));
        if (regularServices.length === 0) {
            srvsContainer.innerHTML = "<div class='empty-state' style='padding:15px; text-align:center; color:var(--text-secondary); font-style:italic;'>Keine Services bereitgestellt</div>";
        } else {
            srvsContainer.innerHTML = regularServices.map(s => {
                const typeStr = (s.types && s.types.length > 0) ? s.types.join(', ') : "Unbekannt";
                return `<div class='topic-item' style='border-color: rgba(168, 85, 247, 0.3);'>
                            <div class="topic-info-row"><span class="topic-lbl" style='color: #a855f7;'>Server:</span>${wrapNodeTooltip(s.name, "topic-val")}</div>
                            <div class="topic-info-row"><span class="topic-lbl" style='color: #a855f7;'>Type:</span><span class="topic-type-badge">${typeStr}</span></div>
                        </div>`;
            }).join('');
        }
    }

    const cliContainer = document.getElementById('nd-clients');
    if (cliContainer) {
        const filteredClients = filterValidServices(data.clients || []);
        const regularClients = filteredClients.filter(c => !c.name.includes('/_action/'));
        if (regularClients.length === 0) {
            cliContainer.innerHTML = "<div class='empty-state' style='padding:15px; text-align:center; color:var(--text-secondary); font-style:italic;'>Keine Clients vorhanden</div>";
        } else {
            cliContainer.innerHTML = regularClients.map(c => {
                const typeStr = (c.types && c.types.length > 0) ? c.types.join(', ') : "Unbekannt";
                return `<div class='topic-item' style='border-color: rgba(56, 189, 248, 0.3);'>
                            <div class="topic-info-row"><span class="topic-lbl" style='color: #38bdf8;'>Client:</span>${wrapNodeTooltip(c.name, "topic-val")}</div>
                            <div class="topic-info-row"><span class="topic-lbl" style='color: #38bdf8;'>Type:</span><span class="topic-type-badge">${typeStr}</span></div>
                        </div>`;
            }).join('');
        }
    }

    // --- ACTIONS ---
    const actSrvContainer = document.getElementById('nd-act-server');
    if (actSrvContainer) {
        const actionServices = (data.services || []).filter(s => s.name.includes('/_action/'));
        if (actionServices.length === 0) {
            actSrvContainer.innerHTML = "<div class='empty-state' style='padding:15px; text-align:center; color:var(--text-secondary); font-style:italic;'>Keine Action-Server</div>";
        } else {
            // Group actions by base name (remove /_action/...)
            const grouped = {};
            actionServices.forEach(s => {
                const base = s.name.replace(/\/_action\/.*$/, '');
                if (!grouped[base]) grouped[base] = [];
                grouped[base].push(s);
            });
            actSrvContainer.innerHTML = Object.keys(grouped).map(base => {
                const types = [...new Set(grouped[base].flatMap(s => s.types))];
                return `<div class='topic-item' style='border-color: rgba(239, 68, 68, 0.3);'>
                            <div class="topic-info-row"><span class="topic-lbl" style='color: #ef4444;'>Action:</span>${wrapNodeTooltip(base, "topic-val")}</div>
                            <div class="topic-info-row"><span class="topic-lbl" style='color: #ef4444;'>Type:</span><span class="topic-type-badge">${types.join(', ')}</span></div>
                        </div>`;
            }).join('');
        }
    }

    const actCliContainer = document.getElementById('nd-act-client');
    if (actCliContainer) {
        const actionClients = (data.clients || []).filter(c => c.name.includes('/_action/'));
        if (actionClients.length === 0) {
            actCliContainer.innerHTML = "<div class='empty-state' style='padding:15px; text-align:center; color:var(--text-secondary); font-style:italic;'>Keine Action-Clients</div>";
        } else {
            const grouped = {};
            actionClients.forEach(c => {
                const base = c.name.replace(/\/_action\/.*$/, '');
                if (!grouped[base]) grouped[base] = [];
                grouped[base].push(c);
            });
            actCliContainer.innerHTML = Object.keys(grouped).map(base => {
                const types = [...new Set(grouped[base].flatMap(c => c.types))];
                return `<div class='topic-item' style='border-color: rgba(239, 68, 68, 0.3);'>
                            <div class="topic-info-row"><span class="topic-lbl" style='color: #f87171;'>Action:</span>${wrapNodeTooltip(base, "topic-val")}</div>
                            <div class="topic-info-row"><span class="topic-lbl" style='color: #f87171;'>Type:</span><span class="topic-type-badge">${types.join(', ')}</span></div>
                        </div>`;
            }).join('');
        }
    }
}

function closeNodeDetails() {
    document.getElementById('node-details-view').classList.add('hidden');
    document.getElementById('nodes-overview-view').classList.add('hidden');
    document.getElementById('global-graph-view').classList.remove('hidden');
    const items = document.getElementById('dynamic-node-list').getElementsByTagName('li');
    for (let i = 0; i < items.length; i++) items[i].classList.remove('active');
    if (network) network.fit();
}

function showNodesOverview() {
    closeNodeDetails();
    document.getElementById('global-graph-view').classList.add('hidden');
    document.getElementById('nodes-overview-view').classList.remove('hidden');

    // Remove highlight on node list
    const items = document.getElementById('dynamic-node-list').getElementsByTagName('li');
    for (let i = 0; i < items.length; i++) {
        items[i].classList.remove('active');
    }

    const grid = document.getElementById('nodes-overview-grid');
    if (!grid) return;

    // Falls noch keine Nodes geladen sind, zeige großen Spinner
    const nodes = Object.keys(workspaceData.nodes || {});
    const projs = Object.keys(workspaceData.project_files || {});

    if (nodes.length === 0 && projs.length === 0) {
        grid.innerHTML = `
            <div class="spinner-container">
                <div class="spinner-large"></div>
                <div class="loading-text" style="font-size: 1.4rem; margin-top: 10px;">Initialisiere - Dashboard...</div>
                <div style="color: var(--text-secondary); opacity: 0.6; font-size: 0.9rem; margin-top: 15px;">Warte auf Daten von ROS 2 Bridge</div>
            </div>`;
        return;
    }

    let gridHtml = '';

    const wsNodeElements = document.querySelectorAll('#dynamic-node-list li.ws-node');
    const sysNodeElements = document.querySelectorAll('#dynamic-node-list li.sys-node');

    const generateCard = (el, isWs) => {
        const nodeName = el.dataset.name;
        if (!nodeName) return '';
        const nodeData = getNodeData(nodeName) || {};

        const pubs = nodeData.publishers ? nodeData.publishers.length : 0;
        const subs = nodeData.subscribers ? nodeData.subscribers.length : 0;
        const srvs = (nodeData.services || []).filter(s => !s.name.includes('/_action/')).length;
        const srvc = (nodeData.clients || []).filter(c => !c.name.includes('/_action/')).length;

        // Actions aus Metadaten oder Fallback
        let actions = nodeData.action_count || 0;
        if (actions === 0 && (nodeData.publishers || nodeData.subscribers)) {
            const allTopics = [...(nodeData.publishers || []), ...(nodeData.subscribers || [])];
            const actionBases = new Set();
            allTopics.forEach(t => {
                if (t.topic.includes('/_action/')) {
                    actionBases.add(t.topic.split('/_action/')[0]);
                }
            });
            actions = actionBases.size;
        }

        const isLive = isWs ? Object.keys(workspaceData.nodes || {}).includes(nodeName) : true;
        const accentClass = isWs ? 'ws-card-accent' : 'sys-card-accent';

        // NEU: Paketname als Typ-String
        const typeStr = nodeData.package || (isWs ? "Workspace Node" : "System Node");

        const badgeHtml = isLive
            ? `<div style="background: rgba(0, 255, 136, 0.1); color: rgb(0, 255, 136); border: 1px solid rgba(0, 255, 136, 0.3); font-size: 0.65rem; padding: 2px 8px; border-radius: 10px; display:inline-flex; align-items:center; gap: 5px; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 0 10px rgba(0,255,136,0.15);"><span class="status-pulse" style="width:8px; height:8px;"></span>LÄUFT</div>`
            : `<div style="background: rgba(100, 116, 139, 0.1); color: #94a3b8; border: 1px solid rgba(100, 116, 139, 0.2); font-size: 0.65rem; padding: 2px 8px; border-radius: 10px; display:inline-flex; align-items:center; gap: 5px; font-weight: 500;"><span style="width:5px; height:5px; background-color:#64748b; border-radius:50%; display:inline-block;"></span>INAKTIV</div>`;

        return `
            <div class="mini-node-card ${accentClass}" onclick="selectNode('${nodeName}')" style="${!isLive ? 'opacity: 0.7;' : ''}">
                <img src="node-icon.svg" class="mini-node-icon" alt="Node">
                <div class="mini-node-info-main">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span class="mini-node-title" title="${nodeName}">${nodeName}</span>
                        ${badgeHtml}
                    </div>
                    <div class="mini-node-type">${typeStr}</div>
                </div>
                <div class="mini-stats-container">
                    <div class="mini-stat-item mini-stat-pubs">
                        <span class="mini-stat-val">${pubs}</span>
                        <span class="mini-stat-lbl">PUBS</span>
                    </div>
                    <div class="mini-stat-item mini-stat-subs">
                        <span class="mini-stat-val">${subs}</span>
                        <span class="mini-stat-lbl">SUBS</span>
                    </div>
                    <div class="mini-stat-item mini-stat-srvs">
                        <span class="mini-stat-val">${srvs}</span>
                        <span class="mini-stat-lbl">SRVS</span>
                    </div>
                    <div class="mini-stat-item mini-stat-clients">
                        <span class="mini-stat-val">${srvc}</span>
                        <span class="mini-stat-lbl">SRVC</span>
                    </div>
                    ${actions > 0 ? `
                        <div class="mini-stat-item mini-stat-actions">
                            <span class="mini-stat-val">${actions}</span>
                            <span class="mini-stat-lbl">ACTS</span>
                        </div>
                    ` : `
                        <div class="mini-stat-item" style="opacity: 0.3;">
                            <span class="mini-stat-val">0</span>
                            <span class="mini-stat-lbl">ACTS</span>
                        </div>
                    `}
                </div>
                <i class="fa-solid fa-chevron-right" style="color: var(--text-secondary); opacity: 0.5; margin-left: 10px; font-size: 0.8rem;"></i>
            </div>
        `;
    };

    if (wsNodeElements.length > 0) {
        gridHtml += `<div class="nd-section-title" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 12px; background: linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.2) 50%, transparent 100%); margin-top: 10px; margin-bottom: 15px; color: #ffffff; display: flex; justify-content: center; align-items: center;"><span style="display:inline-block; width: 18px; height: 18px; margin-right: 10px; background-color: #ffffff; -webkit-mask: url(node-icon.svg) no-repeat center / contain; mask: url(node-icon.svg) no-repeat center / contain;"></span>Workspace Nodes</div>`;
        wsNodeElements.forEach(el => gridHtml += generateCard(el, true));
    }

    if (sysNodeElements.length > 0) {
        gridHtml += `<div class="nd-section-title" style="font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 12px; background: linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.2) 50%, transparent 100%); margin-top: 30px; margin-bottom: 15px; color: #ffffff; display: flex; justify-content: center; align-items: center;"><span style="display:inline-block; width: 18px; height: 18px; margin-right: 10px; background-color: #ef4444; -webkit-mask: url(node-icon.svg) no-repeat center / contain; mask: url(node-icon.svg) no-repeat center / contain;"></span>System Nodes</div>`;
        sysNodeElements.forEach(el => gridHtml += generateCard(el, false));
    }

    grid.innerHTML = gridHtml;
}

