function refreshNodeGraph() {
    if (!window.ros) return;

    // 1. Globalen Graphen aktualisieren
    const nodeNames = Object.keys(workspaceData.nodes || {});
    if (nodeNames.length > 0) {
        const container = document.getElementById('vis-container');
        if (container) {
            visNodes.clear();
            visEdges.clear();

            visNodes.add(nodeNames.map((name) => ({
                id: name, label: name, shape: 'image', image: 'node-icon.svg', size: 24,
                font: { color: '#f8fafc', face: 'Outfit' }
            })));

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
    }

    // 2. Aktuelle Detailseite refreshen
    const activeLi = document.querySelector('#dynamic-node-list li.active');
    if (activeLi) {
        const currentNodeName = activeLi.dataset.name;
        console.log("Refreshing details for active node:", currentNodeName);
        // Ruft selectNode auf, um die Ansicht mit den neuesten workspaceData zu füllen
        selectNode(currentNodeName);
    }

    logToTerminal("Ansicht und Graph manuell aktualisiert.", "info");
}

