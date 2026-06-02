function renderLaunchFiles() {
    if (hasRenderedLaunches) return; // Bricht ab, wenn bereits 1x gerendert

    const listContainer = document.getElementById('launch-list-container');
    const detailContainer = document.getElementById('dynamic-launch-container');
    if (!listContainer || !detailContainer) return;

    if (!workspaceData.all_launches || workspaceData.all_launches.length === 0) {
        listContainer.innerHTML = "<div class='empty-state' style='padding: 15px;'>Keine gefunden.</div>";
        detailContainer.innerHTML = "<div class='empty-state' style='padding: 30px;'>Keine lokalen Launch-Files gefunden.</div>";
        return;
    }

    const launchesMap = {};
    const allIncluded = new Set();

    workspaceData.all_launches.forEach(l => {
        launchesMap[l.file_name] = l;
        (l.parsed_includes || []).forEach(inc => {
            allIncluded.add(inc);
        });
    });

    // Global sichern, damit die Click-Funktion darauf zugreifen kann
    window.currentLaunchesMap = launchesMap;

    const rootLaunches = workspaceData.all_launches.filter(l => !allIncluded.has(l.file_name));

    // LINKE SEITE (Liste) aufbauen
    if (rootLaunches.length > 0) {
        let listHtml = '';
        const groups = {};
        
        rootLaunches.forEach((root, index) => {
            // Führende Unterstriche ignorieren beim Gruppieren
            const baseName = root.file_name.replace(/^_+/, '');
            let groupName = baseName.split('_')[0];
            if (!groupName) groupName = "Sonstige";
            if (!groups[groupName]) groups[groupName] = [];
            groups[groupName].push({ root, index });
        });

        const sortedGroups = Object.keys(groups).sort();

        sortedGroups.forEach(groupName => {
            listHtml += `
                <li class="launch-group-header" onclick="const ul=this.nextElementSibling; const isHidden=ul.style.display==='none'; ul.style.display=isHidden?'block':'none'; this.querySelector('.fa-chevron-right').style.transform=isHidden?'rotate(90deg)':'rotate(0deg)';" style="cursor: pointer; margin-bottom: 5px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 8px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; transition: background 0.2s;" onmouseover="this.style.background='rgba(56,189,248,0.1)'" onmouseout="this.style.background='rgba(0,0,0,0.2)'">
                    <i class="fa-solid fa-chevron-right" style="margin-right: 10px; font-size: 0.8rem; color: var(--accent-primary); transition: transform 0.2s;"></i>
                    <i class="fa-regular fa-folder" style="margin-right: 10px; color: var(--text-secondary);"></i>
                    <span>${groupName}</span>
                    <span style="margin-left: auto; font-size: 0.75rem; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; color: var(--text-secondary);">${groups[groupName].length}</span>
                </li>
                <ul class="launch-group-list" style="display: none; padding-left: 15px; list-style: none; margin-bottom: 12px; margin-top: 5px;">
            `;

            groups[groupName].forEach(item => {
                const root = item.root;
                const index = item.index;

                let pkgObj = root.path ? root.path.split('/')[2] : 'Unbekannt';
                if (root.path && root.path.startsWith('opt')) {
                    pkgObj = root.path.split('/')[4] || 'System';
                    if (root.path.includes('share/')) {
                        pkgObj = root.path.split('share/')[1].split('/')[0];
                    }
                } else if (root.path && root.path.includes('src/')) {
                    const parts = root.path.split('/');
                    const srcIdx = parts.indexOf('src');
                    if (parts.length > srcIdx + 2) {
                        const launchIdx = parts.indexOf('launch');
                        if (launchIdx > 0) {
                            pkgObj = parts[launchIdx - 1];
                        }
                    }
                }

                listHtml += `
                    <li class="ws-node node-card" id="launch-li-${index}" onclick="selectLaunchFile('${root.file_name}', ${index})" style="cursor: pointer; margin-bottom: 6px; padding: 10px 14px;">
                        <div class="node-card-content" style="display:flex; justify-content:space-between; align-items:center; width: 100%;">
                            <div style="display: flex; align-items: center; overflow: hidden; min-width: 0;">
                                <i class="fa-solid fa-play" style="color: #38bdf8; margin-right: 12px; flex-shrink: 0;"></i>
                                <span class="node-name-text text-truncate" title="${root.file_name}" style="font-size: 0.9rem;">${root.file_name}</span>
                            </div>
                            <span class="node-package-badge" style="font-size: 0.7rem; color: #fff; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; margin-left: 8px; flex-shrink: 0;">${pkgObj}</span>
                        </div>
                    </li>
                `;
            });
            listHtml += `</ul>`;
        });
        listContainer.innerHTML = listHtml;
        hasRenderedLaunches = true;

        // Wähle automatisch das erste Element in der Liste aus
        setTimeout(() => selectLaunchFile(rootLaunches[0].file_name, 0), 100);
    } else {
        listContainer.innerHTML = "<div class='empty-state' style='padding: 15px;'>Keine Root-Launches.</div>";
        detailContainer.innerHTML = "<div class='empty-state' style='padding: 30px;'>Keine lokalen Launch-Files gefunden.</div>";
    }
}

// RECHTE SEITE (Baum rendern beim Klicken auf die Liste)
window.selectLaunchFile = function (fileName, index) {
    // Liste markieren
    const items = document.querySelectorAll('#launch-list-container li.node-card');
    items.forEach(item => item.classList.remove('active'));
    const activeItem = document.getElementById(`launch-li-${index}`);
    if (activeItem) activeItem.classList.add('active');

    const container = document.getElementById('dynamic-launch-container');
    if (!container || !window.currentLaunchesMap) return;

    function buildNodeHtml(nodeObj) {
        let nodeName = nodeObj.name || nodeObj.executable;
        let pkg = nodeObj.package || 'Unbekannt';

        let badge = `<span class="t-badge badge-node"><i class="fa-solid fa-microchip"></i> NODE</span>`;
        let borderStyle = ""; // Kein farbiger Rahmen mehr links
        let bgStyle = "rgba(192, 132, 252, 0.15);"; // Standard Purple für Node
        let marginStyle = "margin-bottom: 12px;";

        if (nodeObj.is_container || pkg.includes('component_container') || nodeName.includes('_container')) {
            badge = `<span class="t-badge badge-container"><i class="fa-solid fa-layer-group"></i> CONTAINER</span>`;
            borderStyle = ""; 
            bgStyle = "rgba(45, 212, 191, 0.15);"; // Teal für Container
        } else if (nodeObj.is_component) {
            badge = `<span class="t-badge badge-component"><i class="fa-solid fa-puzzle-piece"></i> COMPONENT</span>`;
            borderStyle = "margin-left: 20px;"; // Nur Einrückung behalten
            bgStyle = "rgba(244, 63, 94, 0.15);"; // Red für Component
            marginStyle = "margin-bottom: 8px;";
        }

        return `
            <li style="${marginStyle}">
                <div class="tree-card" style="border: 1px solid rgba(255, 255, 255, 0.15); border-left: none; ${borderStyle} background: ${bgStyle} padding: 10px;">
                    <div class="d-flex justify-content-between align-items-center flex-wrap" style="gap: 12px; width: 100%;">
                        <div class="d-flex align-items-center" style="gap: 12px; min-width: 0; flex: 1;">
                            <span class="tree-card-title text-truncate" title="${nodeName}" style="font-size: 0.95rem;">${nodeName}</span>
                            <span class="tree-card-pkg">${pkg}</span>
                        </div>
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

        const launch = window.currentLaunchesMap[launchFileName];
        if (!launch) return '';

        let badgeClass = isRoot ? 'is-entry' : 'is-launch';
        let badgeHtml = isRoot
            ? `<div class="tree-card-badges"><span class="t-badge badge-entry">ENTRY POINT</span></div>`
            : ``;

        let iconHtml = isRoot
            ? `<i class="fa-solid fa-play" style="color: #38bdf8; font-size: 1.2rem;"></i>`
            : `<i class="fa-solid fa-rocket" style="color: var(--accent-secondary); font-size: 1.1rem;"></i>`;

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
        if (displayPath.length > 65) {
            const parts = displayPath.split('/');
            displayPath = parts.slice(0, 3).join('/') + '/.../' + parts[parts.length - 1];
        }

        // Bessere, responsive Karten für Launch-Includes
        let treeHtml = `
            <li style="margin-bottom: 20px;">
                <div class="tree-card ${badgeClass}" style="border: 1px solid ${isRoot ? 'rgba(14, 165, 233, 0.4)' : 'rgba(255, 255, 255, 0.15)'}; border-left: none; background: ${isRoot ? 'rgba(14, 165, 233, 0.15)' : 'rgba(245, 158, 11, 0.15)'}; padding: 18px;">
                    <div class="d-flex justify-content-between align-items-start flex-wrap" style="gap: 15px; width: 100%;">
                        <div class="d-flex align-items-center" style="gap: 15px; min-width: 0; flex: 1;">
                            ${iconHtml}
                            <span class="tree-card-title text-truncate" style="font-size: 1.1rem; font-weight: 600;" title="${launch.file_name}">${launch.file_name}</span>
                            <span class="tree-card-pkg">${pkgObj}</span>
                        </div>
                        <div class="tree-card-badges d-flex align-items-center" style="gap: 10px;">
                            ${badgeHtml}
                            ${!isRoot ? '<span class="t-badge badge-launch">LAUNCH</span>' : ''}
                        </div>
                    </div>
                    <div class="tree-card-path" onclick="openInExplorer('${launch.path}')" style="display: inline-flex; width: fit-content; background: rgba(0,0,0,0.3); margin-top: 15px; border: 1px solid rgba(255,255,255,0.05); border-radius: 6px; padding: 6px 12px; cursor: pointer;">
                        <i class="fa-regular fa-folder-open" style="margin-right: 8px;"></i> ${displayPath}
                    </div>
                </div>
        `;

        if ((launch.parsed_nodes && launch.parsed_nodes.length > 0) || (launch.parsed_includes && launch.parsed_includes.length > 0)) {
            treeHtml += `<ul style="border-left: 2px solid rgba(255,255,255,0.05); padding-left: 25px; margin-left: 15px; margin-top: 15px;">`;

            if (launch.parsed_nodes) {
                launch.parsed_nodes.forEach(n => {
                    treeHtml += buildNodeHtml(n);
                });
            }

            if (launch.parsed_includes) {
                launch.parsed_includes.forEach(inc => {
                    treeHtml += buildTreeHtml(inc, false, new Set(visited));
                });
            }

            treeHtml += `</ul>`;
        }

        treeHtml += `</li>`;
        return treeHtml;
    }

    // Baum zusammenbauen und rechts anzeigen
    let rightHtml = `<div class="launch-tree-container" style="background: rgba(0, 0, 0, 0.2); border: 1px solid rgba(255, 255, 255, 0.05); padding: 30px; border-radius: 16px;"><ul class="modern-tree" style="margin: 0; padding: 0;">`;
    rightHtml += buildTreeHtml(fileName, true);
    rightHtml += `</ul></div>`;

    container.innerHTML = rightHtml;
};

// --- Suchfunktion für lokale Launch-Files ---
window.filterLaunches = function () {
    const input = document.getElementById('launch-search');
    if (!input) return;

    const filter = input.value.toLowerCase();
    const listContainer = document.getElementById('launch-list-container');
    if (!listContainer) return;

    const items = listContainer.getElementsByTagName('li');

    for (let i = 0; i < items.length; i++) {
        if (items[i].classList.contains('empty-state')) continue;

        const text = items[i].textContent || items[i].innerText;
        if (text.toLowerCase().indexOf(filter) > -1) {
            items[i].style.display = "flex";
        } else {
            items[i].style.display = "none";
        }
    }
};


