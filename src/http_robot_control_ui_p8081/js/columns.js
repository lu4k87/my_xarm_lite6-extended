// ── Aussenspalten: Breite ziehen, ein-/ausklappen ──────────────────────────
//
// Zwischen linker/rechter Spalte und der Mitte sitzt je eine Trennleiste
// (.col-splitter in index.html):
//   - ziehen          -> Breite der Aussenspalte (in px)
//   - Doppelklick     -> Standardbreite (Verhaeltnis 1 : 2 : 1.2)
//   - Pfeil-Button    -> Spalte einklappen / wieder ausklappen
// Die Mitte ist minmax(0, 2fr) und bekommt damit immer den Rest - der
// Digital Twin waechst mit (ResizeObserver im Twin).
// Der Zustand steht in localStorage und wird schon beim Laden des Moduls
// angewendet, damit das Layout nicht sichtbar springt.

import { lsGet, lsSet } from './util.js';
import { resizeDigitalTwin } from './twin/digital_twin.js';

const LS_KEY = 'robot_control_columns_v1';
const MIN_COL_PX = 300;          // Kamera-Panels haben min-width: 300px
const MAX_COL_FRACTION = 0.42;   // eine Aussenspalte hoechstens 42 % der Breite
const MIN_MIDDLE_PX = 480;       // der 3D-Viewport braucht Platz

const grid = document.querySelector('.grid-layout');
const state = { left: { w: null, collapsed: false }, right: { w: null, collapsed: false } };

function load() {
  try {
    const s = JSON.parse(lsGet(LS_KEY) || 'null');
    for (const side of ['left', 'right']) {
      if (s && s[side]) {
        state[side].w = Number.isFinite(s[side].w) ? s[side].w : null;
        state[side].collapsed = !!s[side].collapsed;
      }
    }
  } catch (e) { /* Standard behalten */ }
}

function save() {
  lsSet(LS_KEY, JSON.stringify(state));
}

function clampWidth(side, px) {
  const total = grid.getBoundingClientRect().width;
  const other = side === 'left' ? 'right' : 'left';
  const otherEl = document.getElementById(`col-${other}`);
  const otherW = state[other].collapsed || !otherEl ? 0 : otherEl.getBoundingClientRect().width;
  const max = Math.min(total * MAX_COL_FRACTION, total - otherW - 24 - MIN_MIDDLE_PX);
  return Math.round(Math.max(MIN_COL_PX, Math.min(px, Math.max(MIN_COL_PX, max))));
}

function apply() {
  if (!grid) return;
  for (const side of ['left', 'right']) {
    const st = state[side];
    grid.classList.toggle(`col-${side}-collapsed`, st.collapsed);
    // Eingeklappt: 0 px auch inline setzen - eine gespeicherte Inline-Breite
    // wuerde sonst die Klassenregel der eingeklappten Spalte ueberstimmen.
    if (st.collapsed) grid.style.setProperty(`--col-${side}-w`, '0px');
    else if (st.w) grid.style.setProperty(`--col-${side}-w`, `${st.w}px`);
    else grid.style.removeProperty(`--col-${side}-w`);
    const btn = document.getElementById(`col-splitter-btn-${side}`);
    if (btn) {
      // Pfeil zeigt in die Richtung, in die sich die Spalte bewegt.
      const towardsEdge = side === 'left' ? 'fa-chevron-left' : 'fa-chevron-right';
      const awayFromEdge = side === 'left' ? 'fa-chevron-right' : 'fa-chevron-left';
      const icon = btn.querySelector('i');
      if (icon) icon.className = `fa-solid ${st.collapsed ? awayFromEdge : towardsEdge}`;
      btn.title = st.collapsed ? `Expand the ${side} column` : `Collapse the ${side} column`;
    }
    const splitter = document.getElementById(`col-splitter-${side}`);
    if (splitter) splitter.style.cursor = st.collapsed ? 'default' : '';
  }
  // Twin sofort nachziehen; der ResizeObserver des Twins faengt den Rest ab.
  requestAnimationFrame(() => resizeDigitalTwin());
}

// Standardbreiten sind relativ (fr). Vor jeder Aenderung die aktuelle Breite
// beider Aussenspalten in px festhalten - sonst verteilt das Raster frei
// werdenden Platz auch auf die andere Aussenspalte statt nur auf die Mitte.
function freezeWidths() {
  for (const side of ['left', 'right']) {
    const el = document.getElementById(`col-${side}`);
    if (state[side].w === null && !state[side].collapsed && el && el.offsetParent) {
      state[side].w = Math.round(el.getBoundingClientRect().width);
    }
  }
}

function toggleCollapse(side) {
  freezeWidths();
  state[side].collapsed = !state[side].collapsed;
  apply();
  save();
}

function initSplitter(side) {
  const splitter = document.getElementById(`col-splitter-${side}`);
  const btn = document.getElementById(`col-splitter-btn-${side}`);
  if (!splitter) return;

  if (btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCollapse(side);
    });
    // Klick auf den Button soll kein Ziehen starten.
    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
  }

  splitter.addEventListener('dblclick', (e) => {
    if (e.target.closest('.col-splitter-btn') || state[side].collapsed) return;
    // Doppelklick = Standardlayout (beide Aussenspalten wieder relativ)
    state.left.w = null;
    state.right.w = null;
    apply();
    save();
  });

  splitter.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || state[side].collapsed) return;
    e.preventDefault();
    freezeWidths();
    splitter.setPointerCapture(e.pointerId);
    splitter.classList.add('is-dragging');
    document.body.classList.add('col-resizing');
    let raf = 0;

    const onMove = (ev) => {
      const r = grid.getBoundingClientRect();
      const px = side === 'left' ? ev.clientX - r.left - 6 : r.right - ev.clientX - 6;
      state[side].w = clampWidth(side, px);
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          grid.style.setProperty(`--col-${side}-w`, `${state[side].w}px`);
          resizeDigitalTwin();
        });
      }
    };
    const onUp = () => {
      splitter.removeEventListener('pointermove', onMove);
      splitter.removeEventListener('pointerup', onUp);
      splitter.removeEventListener('pointercancel', onUp);
      splitter.classList.remove('is-dragging');
      document.body.classList.remove('col-resizing');
      apply();
      save();
    };
    splitter.addEventListener('pointermove', onMove);
    splitter.addEventListener('pointerup', onUp);
    splitter.addEventListener('pointercancel', onUp);
  });
}

if (grid) {
  load();
  apply();
  initSplitter('left');
  initSplitter('right');
  // Gespeicherte px-Breiten nach einer Fensteraenderung wieder einpassen.
  window.addEventListener('resize', () => {
    for (const side of ['left', 'right']) {
      if (state[side].w) state[side].w = clampWidth(side, state[side].w);
    }
    apply();
  });
}
