let workspaceData = {};
let hasRenderedLaunches = false;
let network = null;
let visNodes = new vis.DataSet();
let visEdges = new vis.DataSet();
let codeRequestPub = null;
let nodeDetailReqPub = null;
let currentRequestedPath = "";

let expandedFolders = new Set(['dev_ws', 'dev_ws/src', 'src']);
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
    // Falls Name > 100 Zeichen, Tooltip-Struktur verwenden (außer bei Hardware-Input)
    if (name.length > 100 && name !== "Input-Stream Linux-Systemebene") {
        return `<div class="tooltip-container ${customClass}">
                    <span class="text-truncate">${name}</span>
                    <div class="tooltip-text tooltip-text-node">${name}</div>
                </div>`;
    }
    return `<span class="text-truncate ${customClass}">${name}</span>`;
}

function truncateTopic(topic, maxLen = 35) {
    // Kürzt Topic-Namen und nutzt nun den globalen coolen Hover-Effekt
    if (!topic || topic.length <= maxLen) {
        return `<span style="font-family:'JetBrains Mono',monospace; font-size:0.82rem;">${topic}</span>`;
    }
    const short = topic.slice(0, maxLen - 1) + '\u2026'; // … Unicode

    return `<div class="tooltip-container" style="display: inline-flex; vertical-align: bottom;">
                <span style="font-family:'JetBrains Mono',monospace; font-size:0.82rem; border-bottom: 1px dashed rgba(255,255,255,0.25); white-space: nowrap;">${short}</span>
                <div class="tooltip-text" style="width: max-content; max-width: 400px; word-break: break-all; z-index: 9999; font-family:'JetBrains Mono',monospace; font-size:0.75rem;">${topic}</div>
            </div>`;
}

let loadingCountdown = 0;
let isLoadingLock = false;

function startLoadingTimer() {
    // Timer entfernt
}

function findNodeByPath(node, targetPath, currentPath = "") {
    if (!node) return null;
    const nodePath = currentPath ? `${currentPath}/${node.name}` : node.name;
    if (nodePath === targetPath) return node;
    if (node.children) {
        for (let child of node.children) {
            let found = findNodeByPath(child, targetPath, nodePath);
            if (found) return found;
        }
    }
    return null;
}

