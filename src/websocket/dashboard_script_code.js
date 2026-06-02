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

