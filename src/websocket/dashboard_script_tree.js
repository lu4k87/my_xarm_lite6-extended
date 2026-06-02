window.toggleFolder = function (event, path) {
    event.stopPropagation();
    if (expandedFolders.has(path)) {
        expandedFolders.delete(path);
    } else {
        if (workspaceData.tree) {
            const targetNode = findNodeByPath(workspaceData.tree, path);
            if (targetNode) {
                const parentPath = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : "";
                expandTreeRecursively(targetNode, parentPath);
            } else {
                expandedFolders.add(path);
            }
        } else {
            expandedFolders.add(path);
        }
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



