// ── Letzten UI-Zustand speichern und beim Start wiederherstellen ────────────
//
// Ergaenzt die Einzel-Schluessel, die es schon gibt (Spalten-Layout,
// eingeklappte Sections/HUD-Tabs, Sound, YOLO-Overlay, Distanzlinie,
// ZED-Modus), um alles, was bisher nach einem Neustart weg war:
//   - Digital Twin: Grid, CAD-Kanten, TCP-Gizmo an/aus + Modus, Kameraansicht
//   - Auto-Move-Haken, Base/TCP-Frame
//   - SCENE-Schalter und alle TF-Tuner-Werte samt gewaehltem Element
//   - Groesse der Sections (per Ziehen an der Ecke veraendert)
// Bewusst NICHT: Werte des Roboters (Posen-Eingaben, Speed, Linearachse) -
// die kommen live vom Roboter bzw. gelten nur fuer die jeweilige Fahrt.
//
// Gespeichert wird als ein JSON-Snapshot: kurz nach jeder Bedienung und beim
// Schliessen der Seite.

import { lsGet, lsSet } from './util.js';
import { currentFrame, setFrame } from './jog.js';
import { applyTunerState, getTunerState } from './tf_tuner.js';
import { applyTwinViewState, getTwinViewState } from './twin/digital_twin.js';

const STATE_KEY = 'robot_control_ui_state_v1';
const SAVE_DELAY_MS = 400;

let restored = false;       // vor dem Wiederherstellen nichts ueberschreiben
let saveTimer = null;
const initialPanelSize = new Map();   // Inline-Groesse aus index.html

function loadState() {
  try {
    const s = JSON.parse(lsGet(STATE_KEY) || 'null');
    return (s && typeof s === 'object') ? s : null;
  } catch (e) {
    return null;
  }
}

function panelSizes() {
  const out = {};
  document.querySelectorAll('.glass-panel[id]').forEach((p) => {
    const init = initialPanelSize.get(p.id) || { w: '', h: '' };
    // Nur speichern, was der Nutzer per Ziehen geaendert hat.
    if (p.style.width !== init.w || p.style.height !== init.h) {
      out[p.id] = { w: p.style.width, h: p.style.height };
    }
  });
  return out;
}

function snapshot() {
  const prev = loadState() || {};
  const auto = document.getElementById('chk-gizmo-auto-drop');
  return {
    // Solange der Twin noch laedt, den alten Stand behalten.
    twin: getTwinViewState() || prev.twin || null,
    autoMove: auto ? auto.checked : prev.autoMove,
    frame: currentFrame,
    tuner: getTunerState(),
    panels: panelSizes(),
  };
}

export function saveUiState() {
  if (!restored) return;
  lsSet(STATE_KEY, JSON.stringify(snapshot()));
}

function scheduleSave() {
  if (!restored) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveUiState, SAVE_DELAY_MS);
}

// Der Twin baut Kamera und Controls asynchron auf - warten, bis es sie gibt.
function applyTwinWhenReady(st, triesLeft = 50) {
  if (!st) return;
  if (applyTwinViewState(st)) return;
  if (triesLeft > 0) setTimeout(() => applyTwinWhenReady(st, triesLeft - 1), 100);
}

function restore() {
  document.querySelectorAll('.glass-panel[id]').forEach((p) => {
    initialPanelSize.set(p.id, { w: p.style.width, h: p.style.height });
  });

  const st = loadState();
  if (st) {
    try {
      if (st.panels) {
        for (const [id, sz] of Object.entries(st.panels)) {
          const p = document.getElementById(id);
          if (!p || !sz) continue;
          p.style.width = sz.w || '';
          p.style.height = sz.h || '';
        }
      }
      const auto = document.getElementById('chk-gizmo-auto-drop');
      if (auto && typeof st.autoMove === 'boolean') auto.checked = st.autoMove;
      if (st.frame === 'link_base' || st.frame === 'link_tcp') {
        if (st.frame !== currentFrame) setFrame(st.frame);
      }
      if (st.tuner) applyTunerState(st.tuner);
      applyTwinWhenReady(st.twin);
    } catch (e) {
      console.warn('[persist] restore failed', e);
    }
  }
  restored = true;
}

// Nach den anderen Restore-Schritten (layout.js arbeitet mit 300-400 ms).
document.addEventListener('DOMContentLoaded', () => setTimeout(restore, 500));

// Jede Bedienung kann Zustand aendern - gesammelt speichern.
['click', 'change', 'input', 'pointerup', 'wheel', 'keyup'].forEach((type) => {
  document.addEventListener(type, scheduleSave, { capture: true, passive: true });
});
window.addEventListener('pagehide', saveUiState);
window.addEventListener('beforeunload', saveUiState);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) saveUiState();
});
