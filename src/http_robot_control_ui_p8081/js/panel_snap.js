// ── Panel Snapping & Responsive Auto-Fit ("Anheften & Größe anpassen") ──────
//
// Wenn eine Section (.glass-panel) kleiner gezogen wird (z. B. mit dem
// Resize-Handle) und anschließend wieder in Richtung Spaltenrand gezogen wird
// (z. B. in der mittleren Spalte nach rechts zum Viewport oder in der rechten
// Spalte nach links zum Viewport bzw. nach rechts zum Außenrand), soll sie sich
// automatisch an die Maximalbreite der Spalte anheften (100% Breite,
// voll responsiv ohne starre px-Breite).
//
// Features:
// 1. Snapping am rechten Resize-Handle (Standard-Browser-Handle & Drag):
//    Sobald die Breite innerhalb von 38 px der Spaltenbreite liegt oder an den
//    Rand gezogen wird, rastet die Section ein (Entfernen der inline width).
// 2. Linker Resize-Grip (.panel-resize-grip-left):
//    Ermöglicht auch in der rechten Spalte das Verkleinern/Vergrößern von der
//    dem Viewport zugewandten linken Kante und das Anheften nach links zum Viewport.
// 3. Doppelklick auf Header (h2) oder Resize-Grip:
//    Setzt die Section sofort auf die maximale Spaltenbreite (100% responsive) zurück.
// 4. SortableJS-Integration:
//    Beim Verschieben in eine andere Spalte passt sich die Section automatisch an.

import { resizeDigitalTwin } from './twin/digital_twin.js';
import { logMsg } from './log.js';

const SNAP_THRESHOLD_PX = 38;

let activeResizePanel = null;
let activeResizeType = null; // 'right' | 'left'

export function snapPanelToColumn(panel, silent = false) {
  if (!panel || !panel.classList.contains('glass-panel')) return;

  panel.style.removeProperty('width');
  panel.style.removeProperty('margin-left');
  panel.style.removeProperty('margin-right');
  panel.style.removeProperty('align-self');

  panel.classList.remove('is-snapping');
  panel.classList.remove('is-snapped');

  // Trigger reflow to restart animation reliably
  void panel.offsetWidth;
  panel.classList.add('is-snapped');
  setTimeout(() => panel.classList.remove('is-snapped'), 400);

  if (typeof resizeDigitalTwin === 'function') {
    requestAnimationFrame(resizeDigitalTwin);
    setTimeout(resizeDigitalTwin, 100);
  }

  if (!silent) {
    const titleEl = panel.querySelector(':scope > h2, :scope > .centerpiece-header');
    const name = titleEl ? titleEl.textContent.trim().split('\n')[0] : panel.id;
    logMsg('UI', `⚡ [Snap] ${name} an Spaltenbreite angeheftet (100% responsive)`);
  }
}

export function setupPanel(panel) {
  if (!panel || panel.dataset.snapInitialized) return;
  panel.dataset.snapInitialized = '1';

  // 1. Linker Resize-Grip (insbesondere für rechte Spalte / "andersrum" zum Viewport)
  let leftGrip = panel.querySelector('.panel-resize-grip-left');
  if (!leftGrip) {
    leftGrip = document.createElement('div');
    leftGrip.className = 'panel-resize-grip-left';
    leftGrip.title = 'Ziehen zum Vergrößern/Verkleinern · Doppelklick zum Anheften (100% Spaltenbreite)';
    leftGrip.innerHTML = '<span class="resize-grip-dots">⋰</span>';
    panel.appendChild(leftGrip);
  }

  // Pointer drag für den linken Grip
  leftGrip.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    leftGrip.setPointerCapture(e.pointerId);
    leftGrip.classList.add('is-dragging');
    panel.classList.add('is-resizing-left');

    const col = panel.parentElement;
    const startX = e.clientX;
    const startWidth = panel.offsetWidth;
    const startColRect = col ? col.getBoundingClientRect() : { left: 0, right: window.innerWidth };

    // Verankerung rechts, Freiraum entsteht links (zum Viewport)
    panel.style.marginLeft = 'auto';
    panel.style.marginRight = '0';

    const onPointerMove = (ev) => {
      const deltaX = ev.clientX - startX;
      // Nach links ziehen vergrößert die Section
      const targetWidth = startWidth - deltaX;
      const maxColWidth = col ? col.clientWidth : window.innerWidth;
      const clampedWidth = Math.max(260, Math.min(targetWidth, maxColWidth));
      panel.style.width = `${clampedWidth}px`;

      // Distanz zur linken Kante (zum Viewport / Spaltenrand)
      const currentPanelRect = panel.getBoundingClientRect();
      const distanceToLeft = currentPanelRect.left - startColRect.left;
      const isNearLeft = (distanceToLeft <= SNAP_THRESHOLD_PX) || (clampedWidth >= maxColWidth - SNAP_THRESHOLD_PX);

      if (isNearLeft) {
        panel.classList.add('is-snapping');
      } else {
        panel.classList.remove('is-snapping');
      }
    };

    const onPointerUp = (ev) => {
      try {
        leftGrip.releasePointerCapture(ev.pointerId);
      } catch (err) {}

      leftGrip.removeEventListener('pointermove', onPointerMove);
      leftGrip.removeEventListener('pointerup', onPointerUp);
      leftGrip.removeEventListener('pointercancel', onPointerUp);

      leftGrip.classList.remove('is-dragging');
      panel.classList.remove('is-resizing-left');

      const colWidth = col ? col.clientWidth : window.innerWidth;
      const currentPanelRect = panel.getBoundingClientRect();
      const distanceToLeft = currentPanelRect.left - startColRect.left;
      const currentWidth = panel.offsetWidth;
      const shouldSnap = (distanceToLeft <= SNAP_THRESHOLD_PX) || (currentWidth >= colWidth - SNAP_THRESHOLD_PX);

      if (shouldSnap) {
        snapPanelToColumn(panel);
      } else {
        panel.classList.remove('is-snapping');
      }
    };

    leftGrip.addEventListener('pointermove', onPointerMove);
    leftGrip.addEventListener('pointerup', onPointerUp);
    leftGrip.addEventListener('pointercancel', onPointerUp);
  });

  // Doppelklick auf linken Grip -> sofort anheften
  leftGrip.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    snapPanelToColumn(panel);
  });

  // 2. Rechter Resize-Grip (Browser native `resize: both` unten rechts)
  panel.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button, input, select, a, .joy-arrow-btn, .col-splitter-btn, .panel-resize-grip-left')) return;

    const rect = panel.getBoundingClientRect();
    // Native resize zone unten rechts (~24x24 px)
    const inGripZone = (e.clientX >= rect.right - 26 && e.clientY >= rect.bottom - 26);
    if (inGripZone) {
      activeResizePanel = panel;
      activeResizeType = 'right';
    }
  });

  // 3. Doppelklick auf Header -> sofort anheften
  const header = panel.querySelector(':scope > h2, :scope > .centerpiece-header');
  if (header) {
    header.addEventListener('dblclick', (e) => {
      if (e.target.closest('button, input, select, a, .panel-collapse-btn')) return;
      snapPanelToColumn(panel);
    });
  }
}

// Globaler Pointer-Move / Pointer-Up für das native rechte Resize-Handle
window.addEventListener('pointermove', (e) => {
  if (activeResizePanel && activeResizeType === 'right') {
    const col = activeResizePanel.parentElement;
    if (col) {
      const colW = col.clientWidth;
      const panelW = activeResizePanel.offsetWidth;
      const colRect = col.getBoundingClientRect();
      const panelRect = activeResizePanel.getBoundingClientRect();
      const distToRight = colRect.right - panelRect.right;

      if (distToRight <= SNAP_THRESHOLD_PX || panelW >= colW - SNAP_THRESHOLD_PX) {
        activeResizePanel.classList.add('is-snapping');
      } else {
        activeResizePanel.classList.remove('is-snapping');
      }
    }
  }
});

window.addEventListener('pointerup', (e) => {
  if (activeResizePanel && activeResizeType === 'right') {
    const panel = activeResizePanel;
    const col = panel.parentElement;
    activeResizePanel = null;
    activeResizeType = null;

    if (col) {
      const colW = col.clientWidth;
      const panelW = panel.offsetWidth;
      const colRect = col.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const distToRight = colRect.right - panelRect.right;
      const shouldSnap = (distToRight <= SNAP_THRESHOLD_PX) || (panelW >= colW - SNAP_THRESHOLD_PX);

      if (shouldSnap) {
        snapPanelToColumn(panel);
      } else {
        panel.classList.remove('is-snapping');
      }
    }
  }
});

export function initPanelSnapping() {
  document.querySelectorAll('.glass-panel').forEach(setupPanel);

  // ResizeObserver: Wenn eine Spalte schrumpft und eine Section starre px-Breite hat,
  // die über den Rand ragen würde, sofort sanft einpassen (Zero Overlap Policy).
  const ro = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const panel = entry.target;
      if (panel === activeResizePanel) continue;
      const col = panel.parentElement;
      if (col && panel.style.width) {
        const colW = col.clientWidth;
        if (panel.offsetWidth >= colW - 5) {
          snapPanelToColumn(panel, true);
        }
      }
    }
  });

  document.querySelectorAll('.glass-panel').forEach(p => ro.observe(p));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPanelSnapping);
} else {
  initPanelSnapping();
}
