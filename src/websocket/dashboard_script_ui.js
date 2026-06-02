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

function toggleAccordion(btn) {
    const body = btn.nextElementSibling;
    const isOpen = btn.classList.contains('open');
    btn.classList.toggle('open', !isOpen);
    body.classList.toggle('open', !isOpen);
}

window.toggleAccordion = toggleAccordion;

function switchView(viewId) {
    // Clear all active states
    document.querySelectorAll('.nav-btn, .nav-sub-btn, .nav-accordion-btn').forEach(btn => btn.classList.remove('active'));

    const clickedElement = event ? event.currentTarget : null;
    if (clickedElement) {
        clickedElement.classList.add('active');
        // Wenn Sub-Button: übergeordneten Accordion-Button auch markieren
        const accordionBody = clickedElement.closest('.nav-accordion-body');
        if (accordionBody) {
            const accordionBtn = accordionBody.previousElementSibling;
            if (accordionBtn) accordionBtn.classList.add('active');
        }
    }

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

