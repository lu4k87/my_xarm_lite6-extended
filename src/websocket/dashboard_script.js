let workspaceData = {};
let network = null;
let visNodes = new vis.DataSet();
let visEdges = new vis.DataSet();
let codeRequestPub = null;
let nodeDetailReqPub = null;
let currentRequestedPath = "";

let expandedFolders = new Set(['dev_ws/src']);
let isTreeFullyExpanded = false;

// ── Debounce-Helper ──────────────────────────────────────────────────────────
// Verhindert Burst-Anfragen wenn der User schnell zwischen Nodes wechselt.
function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}


function expandTreeRecursively(treeNode, currentPath = "") {
    if (!treeNode || treeNode.type !== 'folder') return;
    const nodePath = currentPath ? `${currentPath}/${treeNode.name}` : treeNode.name;
    expandedFolders.add(nodePath);
    if (treeNode.children) {
        treeNode.children.forEach(child => expandTreeRecursively(child, nodePath));
    }
}

function wrapNodeTooltip(name, customClass = "") {
    // Falls Name > 20 Zeichen, Tooltip-Struktur verwenden (außer bei Hardware-Input)
    if (name.length > 20 && name !== "Input-Stream Linux-Systemebene") {
        return `<div class="tooltip-container ${customClass}">
                    <span class="text-truncate">${name}</span>
                    <div class="tooltip-text tooltip-text-node">${name}</div>
                </div>`;
    }
    return `<span class="text-truncate ${customClass}">${name}</span>`;
}

function truncateTopic(topic, maxLen = 35) {
    // Kürzt Topic-Namen und zeigt den vollständigen Namen als Hover-Tooltip
    if (!topic || topic.length <= maxLen) {
        return `<span style="font-family:'JetBrains Mono',monospace; font-size:0.82rem;">${topic}</span>`;
    }
    const short = topic.slice(0, maxLen - 1) + '\u2026'; // … Unicode
    return `<span class="topic-name-truncated" title="${topic}" style="
        font-family:'JetBrains Mono',monospace; font-size:0.82rem;
        cursor: help;
        border-bottom: 1px dashed rgba(255,255,255,0.25);
        white-space: nowrap;
    ">${short}<span class="topic-full-tooltip">${topic}</span></span>`;
}

let loadingCountdown = 0;
let isLoadingLock = false;

function startLoadingTimer() {
    // Timer entfernt
}

window.toggleFolder = function (event, path) {
    event.stopPropagation();
    if (expandedFolders.has(path)) {
        expandedFolders.delete(path);
    } else {
        expandedFolders.add(path);
    }
    if (workspaceData.tree) {
        document.getElementById('ws-tree-container').innerHTML = renderWorkspaceTree(workspaceData.tree);
    }
};

function renderWorkspaceTree(treeNode, currentPath = "") {
    if (!treeNode) return '';
    const nodePath = currentPath ? `${currentPath}/${treeNode.name}` : treeNode.name;

    if (treeNode.type === 'folder') {
        const isOpen = expandedFolders.has(nodePath);
        const safePath = nodePath.replace(/'/g, "\\\\'");

        let html = `
            <div class="tree-item folder" onclick="toggleFolder(event, '${safePath}')">
                <i class="fa-solid fa-chevron-right tree-caret ${isOpen ? 'open' : ''}"></i>
                <i class="fa-solid ${isOpen ? 'fa-folder-open' : 'fa-folder'} folder-icon"></i>
                <span class="tree-name">${treeNode.name}</span>
            </div>
        `;

        if (isOpen && treeNode.children && treeNode.children.length > 0) {
            html += `<div class="tree-children">`;
            treeNode.children.forEach(child => {
                html += renderWorkspaceTree(child, nodePath);
            });
            html += `</div>`;
        }
        return html;
    } else {
        let iconClass = "fa-solid fa-file";
        let colorStyle = "color: var(--text-secondary);";

        if (treeNode.name.endsWith('.py')) {
            iconClass = "fa-brands fa-python";
            colorStyle = "color: #fbbf24;";
        } else if (treeNode.name.endsWith('.cpp') || treeNode.name.endsWith('.hpp') || treeNode.name.endsWith('.h') || treeNode.name.endsWith('.c')) {
            iconClass = "fa-solid fa-file-code";
            colorStyle = "color: #3b82f6;";
        } else if (treeNode.name.includes('launch')) {
            iconClass = "fa-solid fa-rocket";
            colorStyle = "color: #ef4444;";
        } else if (treeNode.name.endsWith('.xml') || treeNode.name.endsWith('.yaml') || treeNode.name.endsWith('.json')) {
            iconClass = "fa-solid fa-sliders";
            colorStyle = "color: #10b981;";
        }

        return `
            <div class="tree-item file">
                <span class="spacer"></span>
                <i class="${iconClass}" style="${colorStyle}"></i>
                <span class="tree-name">${treeNode.name}</span>
            </div>
        `;
    }
}



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
            const pulseColor = isNodeRunning ? 'rgb(34, 197, 94)' : 'rgb(100, 116, 139)';
            const statusPulse = `<span class="status-pulse" style="width: 6px; height: 6px; margin: 0 8px 0 0; background-color: ${pulseColor};"></span>`;

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
                    const cPulseColor = isChildRunning ? 'rgb(34, 197, 94)' : 'rgb(100, 116, 139)';
                    const cStatusPulse = `<span class="status-pulse" style="width: 6px; height: 6px; margin: 0 8px 0 0; background-color: ${cPulseColor};"></span>`;

                    outHtml += `<li class="${nodeClass} node-card sub-node-item ${activeClass}" data-name="${child}" onclick="selectNode('${child}')">
                                <div class="node-card-content" style="padding-left: 20px; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                                    <div style="display: flex; align-items: center;">
                                        ${cStatusPulse}
                                        <img src="node-icon.svg" style="width: 14px; height: 14px; margin-right: 12px; filter: opacity(0.7);" alt="Node">
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
                                        <img src="node-icon.svg" style="width: 18px; height: 18px; margin-right: 12px; filter: opacity(0.8);" alt="Node">
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
                                            <img src="node-icon.svg" style="width: 14px; height: 14px; margin-right: 12px; filter: opacity(0.7);" alt="Node">
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
                        <span><i class="fa-solid fa-code" style="margin-right: 8px;"></i>Workspace Nodes</span>
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
                        <span><i class="fa-regular fa-file-code" style="margin-right: 8px;"></i>Lokale Dateien (.py, .cpp)</span>
                        <i class="fa-solid fa-chevron-right group-toggle-caret" style="transform: rotate(90deg); transition: transform 0.2s; font-size: 0.8rem; margin-left: auto;"></i>
                    </div>
                    <div class="node-group-body">`;
        inactiveWsNodes.forEach(n => {
            const activeClass = (n === activeNodeName) ? 'active' : '';
            const iconColor = (n === activeNodeName) ? 'var(--accent-primary)' : '#64748b';
            const statusPulse = '<span style="display:inline-block; width: 6px; height: 6px; margin: 0 8px 0 0; background-color: #64748b; border-radius: 50%;"></span>';

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
            'workspace': { icon: 'fa-code-branch', color: 'var(--accent-primary)', label: '' },
            'system_via_launch': { icon: 'fa-rocket', color: '#f59e0b', label: ' (via Launch)' },
            'system': { icon: 'fa-microchip', color: 'var(--text-secondary)', label: ' (ROS 2 System)' },
        }[category] || { icon: 'fa-box', color: 'var(--text-secondary)', label: '' };

        // 1. Paketname + Label
        elPkg.innerHTML = `${data.package || 'Unbekannt'}<span style="font-size:0.65rem; opacity:0.6; margin-left:6px; font-weight:400;">${catBadge.label}</span>`;

        // 2. Icon im Chip
        if (elPkgIcon) {
            elPkgIcon.className = `fa-solid ${catBadge.icon} chip-main-icon`;
            elPkgIcon.style.color = catBadge.color;
        }

        // 3. Farbe des Haupt-Node-Icons im Header
        if (elHeaderIcon) {
            elHeaderIcon.style.backgroundColor = catBadge.color;
        }
    }

    const elPath = document.getElementById('nd-path');
    if (elPath) {
        const category = data.category || (data.is_workspace ? 'workspace' : 'system');
        elPath.textContent = data.file_path || 'Pfad unbekannt';

        // Interaktivität des Pfad-Chips (neu: .nd-header-path)
        const pathChip = document.querySelector('.nd-header-path');
        if (pathChip) {
            if (category === 'workspace') {
                pathChip.classList.add('interactive');
                pathChip.style.opacity = '1';
                pathChip.style.pointerEvents = '';
            } else {
                pathChip.classList.remove('interactive');
                pathChip.style.opacity = '0.55';
                pathChip.style.pointerEvents = 'none';
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
                    <div class="dep-legend" style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px; background: rgba(0,0,0,0.2); padding: 12px 18px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); flex-wrap: wrap; width: 100%; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
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

                let categorizedHtml = '';
                for (const [title, group] of Object.entries(groups)) {
                    if (group.deps.length > 0) {
                        group.deps.sort((a, b) => a.name.localeCompare(b.name));
                        categorizedHtml += `
                            <div class="dep-category-group" style="margin-bottom: 25px; border-left: 3px solid ${group.color}; padding-left: 15px; background: rgba(255,255,255,0.01); border-radius: 0 8px 8px 0; padding-top: 5px; padding-bottom: 10px;">
                                <div style="font-size: 0.75rem; color: ${group.color}; text-transform: uppercase; font-weight: 700; letter-spacing: 1.5px; margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
                                    <i class="fa-solid ${group.icon}"></i> ${title}
                                    <span style="background: ${group.color}; color: #000; padding: 1px 6px; border-radius: 10px; font-size: 0.65rem; margin-left: 5px;">${group.deps.length}</span>
                                </div>
                                <div class="nd-dependencies-list" style="display: flex; flex-wrap: wrap; gap: 8px;">
                                    ${group.deps.map(d => {
                            const config = typeColorMap[d.type] || { label: "Dep", colorClass: "dep-general" };
                            return `<span class='dep-badge ${config.colorClass}' style="box-shadow: 0 4px 10px rgba(0,0,0,0.15);"><i class="fa-solid fa-box-open"></i> ${d.name}</span>`;
                        }).join('')}
                                </div>
                            </div>
                        `;
                    }
                }

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
                    <span class='conn-node-name m-0' title='Input-Stream Linux-Systemebene'>
                        <i class="fa-brands fa-linux me-2" style="color: #94a3b8;"></i><span class="multiline-label">Input-Stream <br> Linux-Systemebene</span>
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
                            <span class="me-2" style="display:inline-block; width: 18px; height: 18px; background-color: #a855f7; -webkit-mask: url(service-icon.svg) no-repeat center / contain; mask: url(service-icon.svg) no-repeat center / contain; flex-shrink: 0;"></span><span class="text-truncate">Service Server</span>
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
                <div class="comm-badge" style="position: absolute; top: -35px; left: 50%; transform: translateX(-50%); background: rgba(245, 158, 11, 0.12); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3);">SUB</div>
                <i class="fa-solid fa-chevron-right chevron-anim" style="animation-delay: 0.0s"></i>
                <i class="fa-solid fa-chevron-right chevron-anim" style="animation-delay: 0.4s"></i>
                <i class="fa-solid fa-chevron-right chevron-anim" style="animation-delay: 0.8s"></i>
                <i class="fa-solid fa-chevron-right chevron-anim" style="animation-delay: 1.2s"></i>
                <i class="fa-solid fa-chevron-right chevron-anim" style="animation-delay: 1.6s"></i>
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
                        <span class="me-2" style="display:inline-block; width: 18px; height: 18px; background-color: #38bdf8; -webkit-mask: url(service-icon.svg) no-repeat center / contain; mask: url(service-icon.svg) no-repeat center / contain; flex-shrink: 0;"></span><span class="text-truncate">Service Client</span>
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
                <div class="comm-badge" style="position: absolute; top: -35px; left: 50%; transform: translateX(-50%); background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);">PUB</div>
                <i class="fa-solid fa-chevron-right chevron-anim" style="animation-delay: 0.0s"></i>
                <i class="fa-solid fa-chevron-right chevron-anim" style="animation-delay: 0.4s"></i>
                <i class="fa-solid fa-chevron-right chevron-anim" style="animation-delay: 0.8s"></i>
                <i class="fa-solid fa-chevron-right chevron-anim" style="animation-delay: 1.2s"></i>
                <i class="fa-solid fa-chevron-right chevron-anim" style="animation-delay: 1.6s"></i>
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
                dot.style.width = '8px';
                dot.style.height = '8px';
                dot.style.borderRadius = '50%';
                dot.style.marginRight = '8px';
                dot.style.background = '#10b981';
                dot.style.boxShadow = '0 0 8px rgba(16,185,129,0.8)';
                dot.style.animation = 'pulse-dot 2s infinite';
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
                            <div class="topic-info-row msg-content" id="msg-${s.topic.replace(/\//g, '-')}"><span class="topic-lbl">Msg:</span><span class="topic-val" title="Wartet auf Daten..." style="color:var(--text-secondary); font-size:0.8rem;">Wartet auf Daten...</span></div>
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
                            <div class="topic-info-row msg-content" id="msg-${p.topic.replace(/\//g, '-')}"><span class="topic-lbl">Msg:</span><span class="topic-val" title="Wartet auf Daten..." style="color:var(--text-secondary); font-size:0.8rem;">Wartet auf Daten...</span></div>
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
            ? `<div style="background: rgba(34, 197, 94, 0.1); color: rgb(34, 197, 94); border: 1px solid rgba(34, 197, 94, 0.2); font-size: 0.65rem; padding: 2px 8px; border-radius: 10px; display:inline-flex; align-items:center; gap: 5px; font-weight: 600; letter-spacing: 0.5px;"><span class="status-pulse" style="width:5px; height:5px;"></span>LÄUFT</div>`
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
        gridHtml += `<div class="nd-section-title" style="margin-top: 10px;">Workspace Nodes</div>`;
        wsNodeElements.forEach(el => gridHtml += generateCard(el, true));
    }

    if (sysNodeElements.length > 0) {
        gridHtml += `<div class="nd-section-title" style="margin-top: 30px;">System Nodes</div>`;
        sysNodeElements.forEach(el => gridHtml += generateCard(el, false));
    }

    grid.innerHTML = gridHtml;
}

function refreshNodeGraph() {
    if (!window.ros) return;
    const nodeNames = Object.keys(workspaceData.nodes || {});
    if (nodeNames.length === 0) return;

    const container = document.getElementById('vis-container');
    visNodes.clear(); visEdges.clear();

    visNodes.add(nodeNames.map((name) => ({ id: name, label: name, shape: 'image', image: 'node-icon.svg', size: 24, font: { color: '#f8fafc', face: 'Inter' } })));

    nodeNames.forEach(name => {
        const conns = findConnections(name);
        conns.connectedTo.forEach(target => {
            if (!target.isUnbound) {
                visEdges.add({ from: name, to: target.node, arrows: 'to', color: { color: 'rgba(56, 189, 248, 0.5)' } });
            }
        });
    });

    if (network) network.destroy();
    network = new vis.Network(container, { nodes: visNodes, edges: visEdges }, { physics: { stabilization: true, barnesHut: { springLength: 200 } } });
    network.on("click", function (params) {
        if (params.nodes.length > 0) selectNode(params.nodes[0]);
    });
}

function restartSystemNode(nodeName) {
    if (!window.ros) return;
    if (!window.restartNodePub) {
        window.restartNodePub = new ROSLIB.Topic({ ros: window.ros, name: '/ui/request_restart_node', messageType: 'std_msgs/String' });
    }
    window.restartNodePub.publish(new ROSLIB.Message({ data: nodeName }));
    logToTerminal(`Neustart für System-Node '${nodeName}' angefordert.`, 'warn');
}

function initCopyButtons() {
    document.querySelectorAll('.exec-cmd').forEach(cmdEl => {
        if (cmdEl.querySelector('.copy-btn-overlay')) return; // Bereits hinzugefügt

        const btn = document.createElement('button');
        btn.className = 'copy-btn-overlay';
        btn.innerHTML = '<i class="fa-regular fa-copy"></i>';
        btn.title = 'Kopieren';

        btn.onclick = function (e) {
            e.stopPropagation();

            // Extrahiert den reinen Text ohne den Button selbst
            let textToCopy = Array.from(cmdEl.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('copy-btn-overlay')))
                .map(node => node.textContent)
                .join('')
                .trim();

            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    showSuccess(btn);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                    fallbackCopyTextToClipboard(textToCopy, btn);
                });
            } else {
                fallbackCopyTextToClipboard(textToCopy, btn);
            }
        };

        cmdEl.appendChild(btn);
    });
}

function showSuccess(btn) {
    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
    btn.classList.add('success');
    setTimeout(() => {
        btn.innerHTML = '<i class="fa-regular fa-copy"></i>';
        btn.classList.remove('success');
    }, 2000);
}

function fallbackCopyTextToClipboard(text, btn) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        if (successful) showSuccess(btn);
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textArea);
}

async function loadExternalViews() {
    const sections = document.querySelectorAll('section[data-view]');
    const promises = Array.from(sections).map(async section => {
        const url = section.getAttribute('data-view');
        try {
            const response = await fetch(url);
            if (response.ok) {
                const html = await response.text();
                section.innerHTML = html;
            } else {
                console.error(`Failed to load ${url}: ${response.statusText}`);
            }
        } catch (err) {
            console.error(`Error fetching ${url}:`, err);
        }
    });

    await Promise.all(promises);

    // Initialisiere Lade-Zustand (Spinner/Timer) SOFORT nach dem Injezieren der HTML-Teile
    updateNodeList();
    showNodesOverview();
    // startLoadingTimer(); // Entfernt

    // After all views have been injected into the DOM, initialize dynamic elements
    if (typeof initCopyButtons === 'function') {
        initCopyButtons();
    }
}

// Load views asynchronously when DOM is parsed
document.addEventListener('DOMContentLoaded', () => {
    loadExternalViews();
    initSidebarAutoHide();
});

let sidebarTimeout;
function initSidebarAutoHide() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    sidebar.addEventListener('mouseenter', () => {
        sidebar.classList.remove('collapsed');
        clearTimeout(sidebarTimeout);
    });

    sidebar.addEventListener('mouseleave', () => {
        clearTimeout(sidebarTimeout);
        sidebar.classList.add('collapsed');
    });

    // Start initial timer
    sidebar.classList.remove('collapsed');
    sidebarTimeout = setTimeout(() => {
        sidebar.classList.add('collapsed');
    }, 2000);
}

window.restartSystemNode = restartSystemNode;
window.initCopyButtons = initCopyButtons;
window.loadExternalViews = loadExternalViews;

function switchView(viewId) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.wiki-list li').forEach(li => li.classList.remove('active'));

    const clickedElement = event ? event.currentTarget : null;
    if (clickedElement) clickedElement.classList.add('active');

    document.querySelectorAll('.view-section').forEach(section => section.classList.remove('active'));
    const targetSection = document.getElementById(viewId);
    if (targetSection) targetSection.classList.add('active');

    if (viewId === 'network') {
        if (!network) refreshNodeGraph();
        showNodesOverview();
    }

    if (viewId === 'launch-files') {
        if (typeof renderLaunchFiles === 'function') renderLaunchFiles();
    }

    // Trigger syntax highlighting for freshly visible pre/code blocks
    if (typeof hljs !== 'undefined') {
        hljs.highlightAll();
    }
}

window.openInExplorer = function (path) {
    if (!window.ros) return;
    if (!path || path.includes('Pfad unbekannt') || path.includes('System')) return;

    if (!window.openExplorerPub) {
        window.openExplorerPub = new ROSLIB.Topic({ ros: window.ros, name: '/dashboard/request_open_explorer', messageType: 'std_msgs/String' });
    }
    window.openExplorerPub.publish(new ROSLIB.Message({ data: path.trim() }));
};

function requestSourceCode() {
    const pathNode = document.getElementById('nd-path').textContent;
    if (!pathNode || pathNode.includes('Pfad unbekannt') || pathNode.includes('System')) return;

    currentRequestedPath = pathNode;

    document.getElementById('code-modal').classList.remove('hidden');
    document.getElementById('code-modal-title').textContent = pathNode.split('/').pop();
    document.getElementById('code-modal-text').innerHTML = "Lade Quellcode über ROS 2 WebSocket...";

    if (codeRequestPub) {
        const req = new ROSLIB.Message({ data: pathNode });
        codeRequestPub.publish(req);
    }
}

function requestFileContent(path) {
    if (!window.ros || !path) return;

    currentRequestedPath = path;

    document.getElementById('code-modal').classList.remove('hidden');
    document.getElementById('code-modal-title').textContent = path.split('/').pop();
    document.getElementById('code-modal-text').innerHTML = "Lade Quellcode über ROS 2 WebSocket...";

    if (codeRequestPub) {
        const req = new ROSLIB.Message({ data: path });
        codeRequestPub.publish(req);
    }
}

function closeCodeViewer() {
    document.getElementById('code-modal').classList.add('hidden');
}

function renderCode(rawCode, path) {
    const el = document.getElementById('code-modal-text');
    // highlight.js nutzen falls vorhanden (exakter, sicherer als Regex)
    if (typeof hljs !== 'undefined') {
        const lang = path.endsWith('.py') ? 'python'
            : path.endsWith('.cpp') || path.endsWith('.hpp') || path.endsWith('.h') ? 'cpp'
                : path.endsWith('.xml') ? 'xml'
                    : path.endsWith('.yaml') || path.endsWith('.yml') ? 'yaml'
                        : 'plaintext';
        try {
            const result = hljs.highlight(rawCode, { language: lang, ignoreIllegals: true });
            el.innerHTML = result.value;
            return;
        } catch (e) { /* Fallback unten */ }
    }
    // Fallback: einfaches HTML-Escaping ohne Highlighting
    el.innerHTML = rawCode.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderLaunchFiles() {
    const container = document.getElementById('dynamic-launch-container');
    if (!container) return;

    if (!workspaceData.launches || workspaceData.launches.length === 0) {
        container.innerHTML = "<div class='empty-state' style='padding: 30px;'>Keine aktiven Launch-Files gefunden.</div>";
        return;
    }

    const launchesMap = {};
    const allIncluded = new Set();

    workspaceData.launches.forEach(l => {
        launchesMap[l.file_name] = l;
        (l.parsed_includes || []).forEach(inc => {
            allIncluded.add(inc);
        });
    });

    const rootLaunches = workspaceData.launches.filter(l => !allIncluded.has(l.file_name));

    let html = '';

    function buildNodeHtml(nodeName) {
        const nodeInfo = getNodeData(nodeName) || {};
        const pkg = nodeInfo.package || 'Unbekannt';

        let badge = `<span class="t-badge badge-node"><i class="fa-solid fa-microchip"></i> NODE</span>`;
        if (pkg.includes('component_container') || nodeName.includes('_container')) {
            badge = `<span class="t-badge badge-container"><i class="fa-solid fa-box-open"></i> CONTAINER</span>`;
        }

        return `
            <li>
                <div class="tree-card">
                    <div class="tree-card-header">
                        <span class="tree-card-title">${nodeName.startsWith('/') ? nodeName.substring(1) : nodeName}</span>
                        <span class="tree-card-pkg">${pkg}</span>
                        <div class="tree-card-badges">
                            ${badge}
                        </div>
                    </div>
                </div>
            </li>
        `;
    }

    function buildTreeHtml(launchFileName, isRoot, visited = new Set()) {
        if (visited.has(launchFileName)) return '';
        visited.add(launchFileName);

        const launch = launchesMap[launchFileName];
        if (!launch) return '';

        let badgeClass = isRoot ? 'is-entry' : 'is-launch';
        let badgeHtml = isRoot
            ? `<div class="tree-card-badges"><span class="t-badge badge-entry">ENTRY POINT</span></div>`
            : '';

        let iconHtml = isRoot
            ? `<i class="fa-solid fa-play" style="color: #38bdf8;"></i>`
            : `<i class="fa-solid fa-rocket" style="color: var(--accent-secondary);"></i>`;

        let pkgObj = launch.path ? launch.path.split('/')[2] : 'Unbekannt';
        if (launch.path && launch.path.startsWith('opt')) {
            pkgObj = launch.path.split('/')[4] || 'System';
            if (launch.path.includes('share/')) {
                pkgObj = launch.path.split('share/')[1].split('/')[0];
            }
        } else if (launch.path && launch.path.includes('src/')) {
            const parts = launch.path.split('/');
            const srcIdx = parts.indexOf('src');
            if (parts.length > srcIdx + 2) {
                const launchIdx = parts.indexOf('launch');
                if (launchIdx > 0) {
                    pkgObj = parts[launchIdx - 1];
                }
            }
        }

        let displayPath = launch.path || 'Pfad unbekannt';
        if (displayPath.length > 55) {
            const parts = displayPath.split('/');
            displayPath = parts.slice(0, 3).join('/') + '/.../' + parts[parts.length - 1];
        }

        let html = `
            <li>
                <div class="tree-card ${badgeClass}">
                    <div class="tree-card-header">
                        ${iconHtml}
                        <span class="tree-card-title">${launch.file_name}</span>
                        <span class="tree-card-pkg">${pkgObj}</span>
                        <div class="tree-card-path" onclick="openInExplorer('${launch.path}')">
                            <i class="fa-regular fa-folder-open"></i> ${displayPath}
                        </div>
                        <div class="tree-card-badges">
                            ${badgeHtml}
                            ${!isRoot ? '<span class="t-badge badge-launch">LAUNCH</span>' : ''}
                        </div>
                    </div>
                </div>
        `;

        if ((launch.active_nodes && launch.active_nodes.length > 0) || (launch.parsed_includes && launch.parsed_includes.length > 0)) {
            html += `<ul>`;

            if (launch.active_nodes) {
                const sortedNodes = [...launch.active_nodes].sort();
                sortedNodes.forEach(node => {
                    html += buildNodeHtml(node);
                });
            }

            if (launch.parsed_includes) {
                launch.parsed_includes.forEach(inc => {
                    html += buildTreeHtml(inc, false, new Set(visited));
                });
            }

            html += `</ul>`;
        }

        html += `</li>`;
        return html;
    }

    if (rootLaunches.length > 0) {
        rootLaunches.forEach(root => {
            html += `<div class="launch-tree-container"><ul class="modern-tree">`;
            html += buildTreeHtml(root.file_name, true);
            html += `</ul></div>`;
        });
    } else {
        html = "<div class='empty-state' style='padding: 30px;'>Es laufen derzeit keine Launch-Files.</div>";
    }

    container.innerHTML = html;
}

function renderBashrc(bashrcArray) {
    const container = document.getElementById('bashrc-content');
    if (!bashrcArray || bashrcArray.length === 0) {
        container.innerHTML = "Keine ROS2/CUDA Einträge gefunden.<br>Bitte Skript-Pfad prüfen.";
        return;
    }

    const htmlLines = bashrcArray.map(line => {
        let esc = line.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        if (esc.trim().startsWith('#')) {
            return `<span style="color: #64748b; font-style: italic;">${esc}</span>`;
        } else {
            return esc
                .replace(/\b(export|source|if|then|fi)\b/g, '<span style="color: #c678dd; font-weight: bold;">$1</span>')
                .replace(/\b(ROS_DOMAIN_ID|ROS_DISTRO|RMW_IMPLEMENTATION|LD_LIBRARY_PATH|PATH|ROS_LOCALHOST_ONLY)\b/g, '<span style="color: #e06c75;">$1</span>')
                .replace(/=/g, '<span style="color: #56b6c2;">=</span>');
        }
    });
    container.innerHTML = htmlLines.join('<br>');
}

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
                                const msgValEl = document.querySelector(`#msg-${safeTopicId} .topic-val`);
                                if (msgValEl) {
                                    msgValEl.textContent = activity.last_msg;
                                    msgValEl.title = activity.last_msg;
                                    msgValEl.style.color = "var(--text-primary)";
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
                if (!isTreeFullyExpanded) {
                    expandTreeRecursively(workspaceData.tree);
                    isTreeFullyExpanded = true;
                }
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
