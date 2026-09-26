import * as twin from './twin/digital_twin.js';
import { logMsg } from './log.js';
import { lsGet, lsSet } from './util.js';
import { setTunerSaveHooks, updateRangeProgress, updateTunerSaveBadge } from './tf_tuner.js';

// ── Settings-Section: TCP-Gizmo und Frame-Achsen ─────────────────────────────
// Die Section "Settings" hat drei Gruppen: TF Tuner (tf_tuner.js, eigener
// Save), die Darstellung des TCP-Gizmos und die Frame-Achsen (Achsenkreuz an
// beliebigen URDF-/TF-Frames). Jede Gruppe hat ihren eigenen Save- und
// Reset-Button. Gespeichert wird wie beim TF Tuner auf dem PC (server.py,
// /api/settings), damit Desktop und Quest 3 beim Start denselben Stand laden.
// Ungespeicherte Aenderungen gelten nur bis zum Neuladen.
//
// Die drei Gruppen lassen sich am Titel per Drag & Drop umsortieren. Die
// Reihenfolge (settings.layout.order) gehoert zu jedem Save: solange sie
// ungespeichert ist, zeigen alle drei Badges "Save", und egal welches man
// klickt - die Reihenfolge wird mitgespeichert.
//
// Element-ids: set-<gruppe>-<feld>-slider / -num (Zahlen),
// set-<gruppe>-<feld> (Schalter), btn-<gruppe>-save / <gruppe>-save-label.
// Grenzen wie SETTINGS_SCHEMA in server.py.
const SETTINGS_API = 'api/settings';

const pct = { toUi: (v) => Math.round(v * 100), fromUi: (v) => v / 100 };
const oneDecimal = { toUi: (v) => v.toFixed(1), fromUi: (v) => v };

const GROUPS = {
  gizmo: {
    label: 'TCP gizmo appearance',
    // length: Faktor auf Achslaenge / Ringradius, thickness: Stufe 1..10
    // (1 = duenne 1-px-Linie wie bisher), opacity: Deckkraft.
    nums: {
      length:    { min: 0.5, max: 2.5, def: 1.0, ...pct },
      thickness: { min: 1.0, max: 10.0, def: 1.0, ...oneDecimal },
      opacity:   { min: 0.1, max: 1.0, def: 1.0, ...pct },
    },
    bools: {},
    frames: null,
    apply: (v) => twin.setTCPGizmoAppearance(v),
  },
  axes: {
    label: 'frame axes',
    // length [m] (Anzeige in cm), thickness [mm Durchmesser, 0 = 1-px-Linie].
    nums: {
      length:    { min: 0.01, max: 0.3, def: 0.08, toUi: (v) => (v * 100).toFixed(1), fromUi: (v) => v / 100 },
      thickness: { min: 0.0, max: 10.0, def: 0.0, ...oneDecimal },
      opacity:   { min: 0.1, max: 1.0, def: 1.0, ...pct },
    },
    bools: { enabled: true, labels: true, on_top: true },
    frames: [],
    apply: (v) => twin.setFrameAxesConfig(v),
  },
};

// Reihenfolge der Gruppen wie im HTML (data-group), = SETTINGS_GROUP_IDS in server.py.
const DEFAULT_ORDER = ['tf', 'gizmo', 'axes'];
let savedOrder = null; // null = nie gespeichert (Standard gilt als gespeichert)

const state = {};      // gruppe -> aktuelle Werte
const saved = {};      // gruppe -> gespeicherte Werte (null = nie gespeichert)
const busy = {};

function defaultsOf(g) {
  const cfg = GROUPS[g];
  const v = {};
  for (const [k, f] of Object.entries(cfg.nums)) v[k] = f.def;
  Object.assign(v, cfg.bools);
  if (cfg.frames) v.frames = [...cfg.frames];
  return v;
}

for (const g of Object.keys(GROUPS)) {
  state[g] = defaultsOf(g);
  saved[g] = null;
  busy[g] = false;
}

function clampNum(g, field, v) {
  const f = GROUPS[g].nums[field];
  return Math.min(f.max, Math.max(f.min, v));
}

function applyGroup(g) {
  GROUPS[g].apply({ ...state[g], ...(state[g].frames ? { frames: [...state[g].frames] } : {}) });
  updateGroupUI(g);
  updateSaveBadge(g);
}

// ── Anzeige ─────────────────────────────────────────────────────────────
function updateGroupUI(g) {
  const cfg = GROUPS[g];
  const v = state[g];
  for (const [field, f] of Object.entries(cfg.nums)) {
    const slider = /** @type {HTMLInputElement|null} */ (document.getElementById(`set-${g}-${field}-slider`));
    const num = /** @type {HTMLInputElement|null} */ (document.getElementById(`set-${g}-${field}-num`));
    const ui = f.toUi(v[field]);
    if (slider) { slider.value = String(ui); updateRangeProgress(slider); }
    if (num && document.activeElement !== num) num.value = String(ui);
  }
  for (const field of Object.keys(cfg.bools)) {
    const el = document.getElementById(`set-${g}-${field}`);
    if (!el) continue;
    el.classList.toggle('active', Boolean(v[field]));
    el.setAttribute('aria-pressed', v[field] ? 'true' : 'false');
  }
  if (g === 'axes') updateFrameChips();
}

// ── Aktionen (data-action / data-input / data-change) ──────────────────
export function onSettingInput(g, field, val) {
  const f = GROUPS[g] && GROUPS[g].nums[field];
  const n = parseFloat(val);
  if (!f || !Number.isFinite(n)) return;
  state[g][field] = clampNum(g, field, f.fromUi(n));
  applyGroup(g);
}

// Zahlenfeld: nach dem Uebernehmen den begrenzten Wert zurueckschreiben.
export function onSettingNum(g, field, val) {
  onSettingInput(g, field, val);
  const f = GROUPS[g] && GROUPS[g].nums[field];
  const num = /** @type {HTMLInputElement|null} */ (document.getElementById(`set-${g}-${field}-num`));
  if (f && num) num.value = String(f.toUi(state[g][field]));
}

export function toggleSetting(g, field) {
  if (!GROUPS[g] || !(field in GROUPS[g].bools)) return;
  state[g][field] = !state[g][field];
  applyGroup(g);
}

export function resetSettingsGroup(g) {
  if (!GROUPS[g]) return;
  // Reset setzt nur das Aussehen zurueck - die Frame-Auswahl bleibt.
  const frames = state[g].frames;
  state[g] = defaultsOf(g);
  if (frames) state[g].frames = frames;
  applyGroup(g);
  logMsg('Settings', `Reset ${GROUPS[g].label} to defaults`, 'action');
}

// ── Frame-Auswahl (Chips) ───────────────────────────────────────────────
export function toggleAxesFrame(name) {
  const list = state.axes.frames;
  const i = list.indexOf(name);
  if (i >= 0) list.splice(i, 1);
  else list.push(name);
  // Wer einen Frame anklickt, will ihn sehen.
  if (i < 0) state.axes.enabled = true;
  applyGroup('axes');
}

export function setAxesFrames(which) {
  const frames = twin.getTwinFrames();
  if (which === 'none') state.axes.frames = [];
  else {
    const pool = which === 'robot' ? frames.robot : which === 'scene' ? frames.scene : [...frames.robot, ...frames.scene];
    const names = new Set(state.axes.frames);
    pool.forEach((f) => names.add(f.name));
    state.axes.frames = [...names];
    state.axes.enabled = true;
  }
  applyGroup('axes');
}

function chipHtml(f) {
  const joint = f.joint ? `<span class="frame-chip-joint">${f.joint}</span>` : '';
  const tip = f.joint ? `${f.name} (frame of ${f.joint.replace(/^J/, 'joint')})` : f.name;
  return `<button type="button" class="frame-chip btn-no-debounce" data-frame="${f.name}" data-action="toggleAxesFrame" data-args='${JSON.stringify([f.name])}' title="Show axes of ${tip}" aria-pressed="false">`
    + `<span class="frame-chip-dot"></span><span class="frame-chip-name">${f.name}</span>${joint}</button>`;
}

function renderFrameChips() {
  const frames = twin.getTwinFrames();
  const lists = { robot: frames.robot, scene: frames.scene };
  for (const [kind, list] of Object.entries(lists)) {
    const box = document.getElementById(`axes-frames-${kind}`);
    if (!box) continue;
    box.innerHTML = list.length
      ? list.map(chipHtml).join('')
      : `<span class="frame-chip-empty">${kind === 'robot' ? 'Waiting for robot model…' : 'No frames'}</span>`;
  }
  updateFrameChips();
}

function updateFrameChips() {
  const sel = new Set(state.axes.frames);
  const on = state.axes.enabled;
  document.querySelectorAll('.frame-chip[data-frame]').forEach((chip) => {
    const active = sel.has(chip.getAttribute('data-frame'));
    chip.classList.toggle('active', active);
    chip.classList.toggle('muted', active && !on);
    chip.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  const info = document.getElementById('axes-count-info');
  if (info) {
    const all = twin.getTwinFrames();
    const known = new Set([...all.robot, ...all.scene].map((f) => f.name));
    const shown = state.axes.frames.filter((n) => known.has(n)).length;
    info.textContent = !on ? 'Axes hidden' : shown ? `${shown} of ${known.size} frames shown` : 'Select frames to show their axes';
  }
}

// ── Reihenfolge der Gruppen (Drag & Drop) ───────────────────────────────
function groupBody() {
  return document.getElementById('tf-tuner-body');
}

function normalizeOrder(order) {
  const ids = (Array.isArray(order) ? order : []).filter((g, i, a) => DEFAULT_ORDER.includes(g) && a.indexOf(g) === i);
  return [...ids, ...DEFAULT_ORDER.filter((g) => !ids.includes(g))];
}

function currentOrder() {
  const body = groupBody();
  if (!body) return [...DEFAULT_ORDER];
  return normalizeOrder([...body.querySelectorAll(':scope > .settings-group[data-group]')].map((el) => el.dataset.group));
}

function applyOrder(order) {
  const body = groupBody();
  if (!body) return;
  for (const g of normalizeOrder(order)) {
    const el = body.querySelector(`:scope > .settings-group[data-group="${g}"]`);
    if (el) body.appendChild(el);
  }
}

function orderDirty() {
  return currentOrder().join('|') !== (savedOrder || DEFAULT_ORDER).join('|');
}

function updateAllSaveBadges() {
  for (const g of Object.keys(GROUPS)) updateSaveBadge(g);
  updateTunerSaveBadge();
}

// Nur die Reihenfolge speichern (vom Save des TF Tuners aus).
async function saveOrder() {
  const order = currentOrder();
  const res = await fetch(SETTINGS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings: { layout: { order } } })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  savedOrder = order;
  updateAllSaveBadges();
}

function initGroupSortable() {
  const body = groupBody();
  if (!body || typeof Sortable === 'undefined') return;
  // Eigene Gruppe ohne pull/put: Gruppen bleiben in der Section, Sections
  // aus den Spalten koennen nicht hinein. Griff ist der Gruppentitel - der
  // liegt nicht im h2, die Spalten-Sortables reagieren darauf also nicht.
  new Sortable(body, {
    group: { name: 'settings-groups', pull: false, put: false },
    draggable: '.settings-group',
    handle: '.settings-group-title',
    animation: 200,
    ghostClass: 'sortable-ghost',
    onEnd: (evt) => {
      if (evt.oldIndex === evt.newIndex) return;
      updateAllSaveBadges();
      if (orderDirty()) logMsg('Settings', 'Group order changed - click Save to keep it', 'action');
    }
  });
}

// ── Einklappen einzelner Gruppen ────────────────────────────────────────
// Chevron ganz rechts in jeder Gruppen-Titelzeile. Eingeklappt bleibt nur die
// Titelzeile (mit Save/Reset) sichtbar. Reiner Anzeige-Zustand pro Browser
// (localStorage), gehoert nicht zu den gespeicherten Settings.
const GROUP_COLLAPSE_LS_PREFIX = 'settings_group_collapsed_';

function setGroupCollapsed(g, collapsed, save = true) {
  const el = groupBody()?.querySelector(`:scope > .settings-group[data-group="${g}"]`);
  if (!el) return;
  el.classList.toggle('group-collapsed', collapsed);
  const btn = /** @type {HTMLElement|null} */ (el.querySelector('.settings-group-collapse-btn'));
  if (btn) {
    const icon = btn.querySelector('i');
    if (icon) icon.className = collapsed ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up';
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    btn.title = `${collapsed ? 'Expand' : 'Collapse'} ${btn.dataset.groupTitle || g}`;
  }
  if (save) lsSet(GROUP_COLLAPSE_LS_PREFIX + g, collapsed ? '1' : '0');
}

export function toggleSettingsGroupCollapse(g) {
  const el = groupBody()?.querySelector(`:scope > .settings-group[data-group="${g}"]`);
  if (el) setGroupCollapsed(g, !el.classList.contains('group-collapsed'));
}

function restoreGroupCollapse() {
  for (const g of DEFAULT_ORDER) {
    if (lsGet(GROUP_COLLAPSE_LS_PREFIX + g) === '1') setGroupCollapsed(g, true, false);
  }
}

// ── Save-Badge (gleiches Verhalten wie beim TF Tuner) ──────────────────
function sameValues(g, a, b) {
  if (!a || !b) return false;
  const cfg = GROUPS[g];
  for (const k of Object.keys(cfg.nums)) if (Math.abs(Number(a[k]) - Number(b[k])) > 1e-6) return false;
  for (const k of Object.keys(cfg.bools)) if (Boolean(a[k]) !== Boolean(b[k])) return false;
  if (cfg.frames) {
    const fa = [...(a.frames || [])].sort().join('|');
    const fb = [...(b.frames || [])].sort().join('|');
    if (fa !== fb) return false;
  }
  return true;
}

function updateSaveBadge(g, forced) {
  const btn = /** @type {HTMLButtonElement|null} */ (document.getElementById(`btn-${g}-save`));
  const label = document.getElementById(`${g}-save-label`);
  if (!btn || !label) return;
  // Nie gespeichert und unveraendert = Standard, kein Grund zum Speichern.
  const clean = sameValues(g, state[g], saved[g] || defaultsOf(g)) && !orderDirty();
  const mode = forced || (busy[g] ? 'busy' : (clean ? 'saved' : 'dirty'));
  btn.classList.toggle('saved', mode === 'saved');
  btn.classList.toggle('dirty', mode === 'dirty');
  btn.classList.toggle('error', mode === 'error');
  btn.disabled = mode === 'busy';
  label.textContent = mode === 'saved' ? 'Saved' : mode === 'busy' ? 'Saving' : mode === 'error' ? 'Retry' : 'Save';
  const what = GROUPS[g].label;
  btn.title = mode === 'saved'
    ? `${what[0].toUpperCase()}${what.slice(1)} saved - loaded on every start (desktop and Quest 3)`
    : mode === 'error'
      ? 'Saving failed - click to try again'
      : `Unsaved changes - click to store the ${what} and the group order permanently`;
}

export async function saveSettingsGroup(g) {
  if (!GROUPS[g] || busy[g]) return;
  busy[g] = true;
  updateSaveBadge(g);
  const values = JSON.parse(JSON.stringify(state[g]));
  const order = currentOrder();
  try {
    const res = await fetch(SETTINGS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { [g]: values, layout: { order } } })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    saved[g] = values;
    savedOrder = order;
    busy[g] = false;
    updateAllSaveBadges();
    logMsg('Settings', `💾 ${GROUPS[g].label[0].toUpperCase()}${GROUPS[g].label.slice(1)} saved permanently`, 'success');
  } catch (e) {
    busy[g] = false;
    updateSaveBadge(g, 'error');
    logMsg('Settings', `✗ Saving ${GROUPS[g].label} failed: ${e.message || e}`, 'err');
  }
}

// ── Laden beim Start ────────────────────────────────────────────────────
async function loadSavedSettings() {
  try {
    const res = await fetch(SETTINGS_API, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const all = (data && data.settings) || {};
      if (all.layout && Array.isArray(all.layout.order)) {
        savedOrder = normalizeOrder(all.layout.order);
        applyOrder(savedOrder);
      }
      for (const [g, cfg] of Object.entries(GROUPS)) {
        const s = all[g];
        if (!s) continue;
        for (const field of Object.keys(cfg.nums)) {
          if (typeof s[field] === 'number') state[g][field] = clampNum(g, field, s[field]);
        }
        for (const field of Object.keys(cfg.bools)) {
          if (typeof s[field] === 'boolean') state[g][field] = s[field];
        }
        if (cfg.frames && Array.isArray(s.frames)) state[g].frames = s.frames.filter((n) => typeof n === 'string');
        saved[g] = JSON.parse(JSON.stringify(state[g]));
      }
    }
  } catch (e) {
    // Ohne Server-API (z. B. python3 -m http.server) bleiben die Standardwerte.
  }
  for (const g of Object.keys(GROUPS)) applyGroup(g);
  updateTunerSaveBadge();
}

// Robot-Modell geladen / TF-Tuner-Frames angelegt: Chips neu aufbauen.
document.addEventListener('twin-frames-changed', renderFrameChips);

setTunerSaveHooks({ extraDirty: orderDirty, onSave: saveOrder });

document.addEventListener('DOMContentLoaded', () => {
  initGroupSortable();
  restoreGroupCollapse();
  renderFrameChips();
  for (const g of Object.keys(GROUPS)) updateGroupUI(g);
  loadSavedSettings();
});
