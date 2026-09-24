import * as twin from './twin/digital_twin.js';
import { logMsg } from './log.js';
import { initPortMonitoring } from './status.js';
import { isSceneObjectsNodeRunning, updateAllSceneNodeBtns, updateRangeProgress, updateTunerUI } from './tf_tuner.js';
import { lsGet, lsSet, setIconLabel } from './util.js';
import { snapPanelToColumn } from './panel_snap.js';

// ── YOLO 3D Overlay im Viewport ein-/ausblenden ─────────────────────────
// Zustand in localStorage, damit die Ansicht einen Reload ueberlebt.
export const TWIN_DETECTIONS_LS_KEY = 'twin_detections_visible';

// Der Button stand als einziger im Icon-Stapel ohne .active da und bekam
// damit weder den blauen Hintergrund noch den Glow aus .btn.active - er
// wechselte nur die Schriftfarbe. Jetzt schaltet er wie die Scene-Buttons.
export function applyTwinDetectionsBtn(visible) {
  const btn = document.getElementById('btn-twin-detections');
  if (!btn) return;
  btn.classList.toggle('active', visible);
  btn.style.color = visible ? 'var(--cyan)' : 'var(--dim)';
  btn.style.opacity = visible ? '1' : '0.5';
  btn.title = visible
    ? 'Hide YOLO detections in 3D view (bounding box, grasp point, labels)'
    : 'Show YOLO detections in 3D view (bounding box, grasp point, labels)';
}

// ── Distanzlinie (gestrichelt, TCP -> naechste Greifkugel) ──────────────
export const TWIN_DISTLINE_LS_KEY = 'twin_distance_line_visible';

export function applyTwinDistanceLineBtn(visible) {
  const btn = document.getElementById('btn-twin-distance-line');
  if (!btn) return;
  btn.classList.toggle('active', visible);
  btn.style.color = visible ? 'var(--cyan)' : 'var(--dim)';
  btn.style.opacity = visible ? '1' : '0.5';
  btn.title = visible
    ? 'Hide distance line (dashed line from TCP to the nearest detected object)'
    : 'Show distance line (dashed line from TCP to the nearest detected object)';
}

export function toggleTwinDistanceLine() {
  if (typeof twin.setDigitalTwinDistanceLine !== 'function') return;
  const now = !twin.getDigitalTwinDistanceLine();
  twin.setDigitalTwinDistanceLine(now);
  applyTwinDistanceLineBtn(now);
  lsSet(TWIN_DISTLINE_LS_KEY, now ? '1' : '0');
  logMsg('UI', `Distance line ${now ? 'enabled' : 'disabled'}`);
}


export function restoreTwinDistanceLine() {
  let visible = true;   // Die Linie war bisher immer an - Standard bleibt an
  try {
    const saved = lsGet(TWIN_DISTLINE_LS_KEY);
    if (saved !== null) visible = (saved === '1');
  } catch (e) {}
  if (typeof twin.setDigitalTwinDistanceLine === 'function') {
    twin.setDigitalTwinDistanceLine(visible);
  }
  applyTwinDistanceLineBtn(visible);
}

document.addEventListener('DOMContentLoaded', () => setTimeout(restoreTwinDistanceLine, 400));

// ── Header einklappen ───────────────────────────────────────────────────
// Eingeklappt bleiben nur der Reload-Button und der Pfeil selbst (der
// Not-Aus sitzt im Viewport). Zustand ueberlebt den Reload.
export const HEADER_COLLAPSED_LS_KEY = 'header_collapsed';

export function setHeaderCollapsed(collapsed, persist = true) {
  const bar = document.querySelector('.header-status');
  const btn = document.getElementById('btn-header-collapse');
  if (!bar) return;
  bar.classList.toggle('header-collapsed', !!collapsed);
  if (btn) {
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    btn.title = collapsed ? 'Expand the header' : 'Collapse the header (reload stays visible)';
    const icon = btn.querySelector('i');
    if (icon) icon.className = collapsed ? 'fa-solid fa-chevron-left' : 'fa-solid fa-chevron-right';
  }
  if (persist) lsSet(HEADER_COLLAPSED_LS_KEY, collapsed ? '1' : '0');
}

export function toggleHeaderCollapsed() {
  const bar = document.querySelector('.header-status');
  if (bar) setHeaderCollapsed(!bar.classList.contains('header-collapsed'));
}

document.addEventListener('DOMContentLoaded', () => setHeaderCollapsed(lsGet(HEADER_COLLAPSED_LS_KEY) === '1', false));

// ── Einklappbare HUD-Tabs im Viewport ───────────────────────────────────
// Jedes Overlay am Viewportrand (Gizmo-HUD, Scene-Icons, Motion, Telemetrie,
// Pose, Speed) sitzt in einem .twin-hud-tab mit eigener Kopfzeile. Der
// Zustand haengt an data-hud und ueberlebt den Reload.
export const HUD_TAB_LS_PREFIX = 'twin_hud_tab_';

export function hudTabEl(key) {
  return document.querySelector(`.twin-hud-tab[data-hud="${key}"]`);
}

export function allHudTabs() {
  return Array.from(document.querySelectorAll('.twin-hud-tab[data-hud]'));
}

export function updateHudTabsToggleBtn() {
  const btn = document.getElementById('btn-hud-tabs-toggle');
  const icon = document.getElementById('hud-tabs-toggle-icon');
  const tabs = allHudTabs();
  if (!btn || tabs.length === 0) return;
  const allCollapsed = tabs.every(t => t.classList.contains('is-collapsed'));
  btn.classList.toggle('active', allCollapsed);
  if (icon) {
    icon.className = allCollapsed
      ? 'fa-solid fa-window-maximize'
      : 'fa-solid fa-window-minimize';
  }
  btn.title = allCollapsed
    ? 'Expand all viewport panels'
    : 'Collapse all viewport panels';
}

export function setHudTabCollapsed(key, collapsed, persist = true) {
  const el = hudTabEl(key);
  if (!el) return;
  el.classList.toggle('is-collapsed', !!collapsed);
  const head = el.querySelector('.hud-tab-head');
  if (head) head.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  if (persist) lsSet(HUD_TAB_LS_PREFIX + key, collapsed ? '1' : '0');
  if (typeof twin.refitDigitalTwinHud === 'function') twin.refitDigitalTwinHud();
}

export function toggleHudTab(key) {
  const el = hudTabEl(key);
  if (!el) return;
  setHudTabCollapsed(key, !el.classList.contains('is-collapsed'));
  updateHudTabsToggleBtn();
}


// Sammelschalter in der Viewport-Tableiste: ist noch irgendein Tab offen,
// klappt der Klick alles zu - sonst wieder alles auf.
export function toggleAllHudTabs() {
  const tabs = allHudTabs();
  if (tabs.length === 0) return;
  const collapse = !tabs.every(t => t.classList.contains('is-collapsed'));
  tabs.forEach(t => setHudTabCollapsed(t.dataset.hud, collapse));
  updateHudTabsToggleBtn();
  logMsg('UI', `Viewport panels ${collapse ? 'collapsed' : 'expanded'}`);
}


export function restoreHudTabs() {
  allHudTabs().forEach(t => {
    const saved = lsGet(HUD_TAB_LS_PREFIX + t.dataset.hud);
    setHudTabCollapsed(t.dataset.hud, saved === '1', false);
  });
  updateHudTabsToggleBtn();
}

document.addEventListener('DOMContentLoaded', restoreHudTabs);

export function toggleTwinDetections() {
  if (typeof twin.setDigitalTwinDetectionsVisible !== 'function') return;
  const now = !twin.getDigitalTwinDetectionsVisible();
  twin.setDigitalTwinDetectionsVisible(now);
  applyTwinDetectionsBtn(now);
  lsSet(TWIN_DETECTIONS_LS_KEY, now ? '1' : '0');
  logMsg('UI', `YOLO 3D overlay ${now ? 'enabled' : 'disabled'}`);
}

export function restoreTwinDetections() {
  let visible = true;   // Labels und Boxen sind standardmaessig an
  try {
    const saved = lsGet(TWIN_DETECTIONS_LS_KEY);
    if (saved !== null) visible = (saved === '1');
  } catch (e) {}
  if (typeof twin.setDigitalTwinDetectionsVisible === 'function') {
    twin.setDigitalTwinDetectionsVisible(visible);
  }
  applyTwinDetectionsBtn(visible);
}

document.addEventListener('DOMContentLoaded', () => setTimeout(restoreTwinDetections, 400));

// ── Drag & Drop Layout (SortableJS) ──────────────────────────────────────
export function initDragAndDrop() {
  const colLeft = document.getElementById('col-left');
  const colMiddle = document.getElementById('col-middle');
  const colRight = document.getElementById('col-right');
  if (!colLeft || !colMiddle || !colRight || typeof Sortable === 'undefined') return;

  const layoutKey = 'robot_control_layout_v3';

  // 1. Load saved layout if available
  try {
    const saved = lsGet(layoutKey);
    if (saved) {
      const layout = JSON.parse(saved);
      // Restore left column
      if (layout.left && Array.isArray(layout.left)) {
        layout.left.forEach(id => {
          const el = document.getElementById(id);
          if (el) colLeft.appendChild(el);
        });
      }
      // Restore middle column
      if (layout.middle && Array.isArray(layout.middle)) {
        layout.middle.forEach(id => {
          const el = document.getElementById(id);
          if (el) colMiddle.appendChild(el);
        });
      }
      // Restore right column
      if (layout.right && Array.isArray(layout.right)) {
        layout.right.forEach(id => {
          const el = document.getElementById(id);
          if (el) colRight.appendChild(el);
        });
      }
    }
  } catch(e) {
    console.warn('Failed to load layout from localStorage:', e);
  }

  // 2. Save function
  function saveLayout() {
    const layout = {
      left: Array.from(colLeft.querySelectorAll('.glass-panel')).map(el => el.id).filter(id => id),
      middle: Array.from(colMiddle.querySelectorAll('.glass-panel')).map(el => el.id).filter(id => id),
      right: Array.from(colRight.querySelectorAll('.glass-panel')).map(el => el.id).filter(id => id)
    };
    lsSet(layoutKey, JSON.stringify(layout));
    logMsg('UI', '✓ Layout saved automatically', 'success');
  }

  // 3. Initialize Sortable
  const sortableOpts = {
    group: 'panels',
    animation: 200,
    handle: 'h2, .panel-drag-handle, .centerpiece-header, .panel-drag-grip',
    filter: 'button, input, select, a, .twin-toolbar, .viewport-tabs, .v-tab-btn',
    preventOnFilter: false,
    ghostClass: 'sortable-ghost',
    onEnd: (evt) => {
      saveLayout();
      if (evt && evt.item) {
        snapPanelToColumn(evt.item, true);
      }
      if (typeof twin.resizeDigitalTwin === 'function') {
        setTimeout(twin.resizeDigitalTwin, 50);
        setTimeout(twin.resizeDigitalTwin, 250);
      }
    }
  };

  new Sortable(colLeft, sortableOpts);
  new Sortable(colMiddle, sortableOpts);
  new Sortable(colRight, sortableOpts);
}

// Call init once DOM is definitely ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initDragAndDrop();
    initPortMonitoring();
  });
} else {
  initDragAndDrop();
  initPortMonitoring();
}

// ── 3D Viewport Tab Switcher (Digital Twin WebGL vs RViz Stream) ───────────
export function switch3DTab(tab) {
  const btnTwin = document.getElementById('tab-twin');
  const btnRviz = document.getElementById('tab-rviz');
  const twinViewport = document.getElementById('digital-twin-viewport');
  const rvizContainer = document.getElementById('rviz-container');
  const twinToolbar = document.querySelector('.twin-toolbar');

  if (tab === 'twin') {
    if (btnTwin) btnTwin.classList.add('active');
    if (btnRviz) btnRviz.classList.remove('active');
    if (twinViewport) twinViewport.style.display = 'block';
    if (rvizContainer) rvizContainer.style.display = 'none';
    if (twinToolbar) twinToolbar.style.display = 'flex';
    if (twin.resizeDigitalTwin) {
      twin.resizeDigitalTwin();
    }
  } else {
    if (btnRviz) btnRviz.classList.add('active');
    if (btnTwin) btnTwin.classList.remove('active');
    if (twinViewport) twinViewport.style.display = 'none';
    if (rvizContainer) rvizContainer.style.display = 'flex';
    if (twinToolbar) twinToolbar.style.display = 'none';
  }
}


// Initialize Tuner UI on ready
// ── TF Tuner Collapse Toggle ──
export function toggleTFTunerCollapse() {
  const body = document.getElementById('tf-tuner-body');
  const icon = document.getElementById('tf-collapse-icon');
  if (!body || !icon) return;
  const isCollapsed = body.classList.toggle('collapsed');
  icon.className = isCollapsed ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up';
  lsSet('tf_tuner_collapsed', isCollapsed ? '1' : '0');
}

export function restoreTFTunerCollapse() {
  const saved = lsGet('tf_tuner_collapsed');
  if (saved === '1') {
    const body = document.getElementById('tf-tuner-body');
    const icon = document.getElementById('tf-collapse-icon');
    if (body) body.classList.add('collapsed');
    if (icon) icon.className = 'fa-solid fa-chevron-down';
  }
}

// ── Collapsible sections (same pattern as the TF Control Tuner) ─────────
// Every other section gets a small chevron button at the top right of its
// header. Collapsed, only the header row stays visible; the state is kept per
// section in localStorage. The button sits inside the drag handle, but
// SortableJS filters buttons, so clicking it never starts a drag.
export const PANEL_COLLAPSE_LS_PREFIX = 'panel_collapsed_';

export function setPanelCollapsed(section, collapsed, save = true) {
  const btn = section.querySelector('.panel-collapse-btn');
  section.classList.toggle('panel-collapsed', collapsed);
  if (btn) {
    btn.querySelector('i').className = collapsed ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up';
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    btn.title = `${collapsed ? 'Expand' : 'Collapse'} ${btn.dataset.panelTitle}`;
  }
  if (save) lsSet(PANEL_COLLAPSE_LS_PREFIX + section.id, collapsed ? '1' : '0');
  // The WebGL canvas has to pick up its size again after being hidden.
  if (!collapsed && section.id === 'panel-3d-centerpiece' && typeof twin.resizeDigitalTwin === 'function') {
    setTimeout(twin.resizeDigitalTwin, 50);
    setTimeout(twin.resizeDigitalTwin, 250);
  }
}

export function togglePanelCollapse(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  const collapsed = !section.classList.contains('panel-collapsed');
  setPanelCollapsed(section, collapsed);
  logMsg('UI', `${section.querySelector('.panel-collapse-btn').dataset.panelTitle} ${collapsed ? 'collapsed' : 'expanded'}`);
}


export function initPanelCollapse() {
  document.querySelectorAll('section.glass-panel').forEach((section) => {
    // The TF Control Tuner already has its own collapse button.
    if (!section.id || section.id === 'panel-tf-tuner') return;
    let header, host;
    if (section.id === 'panel-3d-centerpiece') {
      header = section.querySelector(':scope > .centerpiece-header');
      host = header ? header.lastElementChild : null;   // right-hand toolbar row
    } else {
      header = section.querySelector(':scope > h2');
      host = header;
    }
    if (!header || !host || header.querySelector('.panel-collapse-btn')) return;

    const title = section.id === 'panel-3d-centerpiece'
      ? '3D Viewport'
      : ([...header.childNodes]
          .filter(n => !(n.classList && n.classList.contains('panel-title-meta')))
          .map(n => n.textContent).join('') || section.id).trim();
    header.classList.add('panel-collapse-header');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-icon-small panel-collapse-btn';
    btn.dataset.panelTitle = title;
    setIconLabel(btn, 'fa-solid fa-chevron-up');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanelCollapse(section.id);
    });
    host.appendChild(btn);
    setPanelCollapsed(section, lsGet(PANEL_COLLAPSE_LS_PREFIX + section.id) === '1', false);
  });
}

document.addEventListener('DOMContentLoaded', initPanelCollapse);

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    updateTunerUI();
    updateAllSceneNodeBtns(isSceneObjectsNodeRunning);
    document.querySelectorAll('input[type="range"]').forEach(updateRangeProgress);
    restoreTFTunerCollapse();
  }, 300);
});
