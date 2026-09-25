// ── VR-HUD: Viewport-Overlays am Sichtrand (Meta Quest 3) ──────────────────
//
// Spiegelt das Overlay-Raster des Desktop-Viewports (.twin-overlay-grid in
// style.css) in die Brille, in derselben Anordnung:
//
//                 [ Toolbar: Viewport-Icons | SERVO PLAN | VR/PT | ... ]
//                           [ MODE: SERVO / PLAN ]
//     [ MOTION ]                                             [ SCENE ]
//                 [ MoveIt-Popup (Bahn bestaetigen) + Warnbanner ]
//                              [ NOT-AUS ]
//     [ TELEMETRY ]            [  POSE   ]              [ SPEED ]
//
// Jede Flaeche ist ein Canvas auf einer Ebene. Alle liegen auf einer
// Kugelschale um den Kopf, zur Mitte gedreht, in Winkel-Slots mit Abstand -
// nichts ueberlappt (AGENTS.md), egal wie viel Inhalt ein Tab hat.
//
// Verschieben: Trigger rechts auf der Kopfzeile, dem Griff (⋮⋮) oder einer
// freien Stelle einer Flaeche halten und ziehen. Die Flaeche gleitet auf der
// Schale mit; wuerde sie beim Loslassen eine andere beruehren, rutscht sie
// auf den naechsten freien Platz. Die Anordnung bleibt gespeichert
// (localStorage), "HUD-Layout" im VR-Tab stellt die Standardanordnung her.
// Eingeklappte Tabs am Desktop sind hier ebenfalls eingeklappt (derselbe
// DOM-Zustand); ein Klick auf den Kopf klappt beide um.
//
// Folgen ("tag-along"): Die Schale bleibt stehen, solange der Blick in der
// Totzone bleibt - so lassen sich die Seitenpanels mit einer kleinen
// Kopfdrehung scharf ansehen. Dreht man sich weiter, zieht sie weich nach.
// hudRecenter() holt sie sofort vor den Blick.
//
// Die Flaechen werden ohne Tiefentest als Overlay gezeichnet (wie die HUDs
// ueber dem Desktop-Viewport) und nur neu gerendert, wenn sich ihr Inhalt
// geaendert hat.

import * as THREE from 'three';
import * as twin from './digital_twin.js';
import { estopLatched, ros } from '../ros.js';
import { lsGet, lsSet } from '../util.js';
import {
  COL, groupColor, FONT, FA_FONT, XR_ORDER, domItem, ownItem, glyphFor, q, qa, txt, stepSpeed,
  GRIPPER_LABELS, poseLabel,
  roundRect, fitText, drawButton, pill, drawInfoLine,
  moveitActionsVisible, moveitTargetLine, moveitProgressLines,
} from './xr_ui.js';

const DEG = THREE.MathUtils.degToRad;
const HUD_DIST = 1.2;                 // m, Radius der Schale um den Kopf
const PX_PER_M = 2000;                // Canvas-Aufloesung der Flaechen
const HUD_REFRESH_MS = 200;           // DOM-Zustand nachziehen
const YAW_DEADZONE = DEG(40);
const PITCH_DEADZONE = DEG(32);
const PITCH_MIN = DEG(-60), PITCH_MAX = DEG(40);
const POS_DEADZONE = 0.25;            // m
const FOLLOW_RATE = 5;                // 1/s, exponentielles Nachziehen
const RENDER_ORDER = XR_ORDER.hud;    // unter Handgelenk-Panel, Controllern und Laser

// Slots: Mitte in Grad (az + rechts, el + oben), Groesse in Metern. anchor:
// an welcher Kante der Inhalt klebt, wenn er kuerzer als die Flaeche ist -
// die untere Reihe waechst wie am Desktop nach oben.
// Das MoveIt-Popup sitzt direkt ueber dem Not-Aus und waechst nach oben.
// Die MODE-Badge zeigt immer den aktiven Steuermodus, mittig unter der Toolbar.
// Winkel-Ausdehnung (halbe Breite/Hoehe bei 1,2 m): Toolbar ±27,3°/±1,8°,
// MODE ±7,1°/±1,8°, MoveIt ±13,1°/±5,9°, Seiten ±7,1°/±8,1..9,5°, Not-Aus ±9,5°/±1,8°,
// untere Reihe ±8,1°/±4,3°. Dazwischen bleiben ueberall mind. 3° frei
// (geprueft wie beim Verschieben, siehe overlaps()).
const SLOTS = [
  { id: 'toolbar',   az: 0,   el: 27,  w: 1.24, h: 0.075, anchor: 'top', pad: 14 },
  { id: 'mode',      az: 0,   el: 20,  w: 0.30, h: 0.075, anchor: 'top', pad: 14 },
  { id: 'motion',    az: -34, el: 8,   w: 0.30, h: 0.40,  anchor: 'top' },
  { id: 'scene',     az: 34,  el: 12,  w: 0.30, h: 0.34,  anchor: 'top' },
  { id: 'moveit',    az: 0,   el: -15, w: 0.56, h: 0.25,  anchor: 'bottom' },
  { id: 'estop',     az: 0,   el: -26, w: 0.40, h: 0.075, anchor: 'top', pad: 14 },
  { id: 'telemetry', az: -24, el: -35, w: 0.34, h: 0.18,  anchor: 'bottom' },
  { id: 'pose',      az: 0,   el: -35, w: 0.34, h: 0.18,  anchor: 'bottom' },
  { id: 'speed',     az: 24,  el: -35, w: 0.34, h: 0.18,  anchor: 'bottom' },
];

// Verschieben: Mindestabstand zwischen Flaechen und erlaubter Bereich [Grad]
const LAYOUT_LS_KEY = 'robot_control_xr_hud_layout_v1';
const MIN_GAP_DEG = 2;
const AZ_LIMIT = 150, EL_LIMIT = 70;

// Canvas-Layout [px]
const P = 18, G = 12;
const HEAD_H = 60, INFO_H = 42, BANNER_H = 48, BTN_H = 124, FLAT_BTN_H = 84;
const LABEL_COL_W = 150;
const TB_DIV_W = 20;
const HANDLE_W = 48;                  // Griff zum Verschieben (Toolbar, Not-Aus)
const CARD_ALPHA = 0.72;              // Hintergrund der Karten, leicht transparent

// Farben: jede Karte und jeder Toolbar-Button traegt die Farbe seiner
// Funktionsgruppe (GROUP in xr_ui.js) - dieselbe wie im Handgelenk-Panel.

// Kurze Namen fuer die SCENE-Icons (die Tooltips am Desktop sind lang).
const SCENE_LABELS = {
  'btn-twin-scene-objects': 'Objekte',
  'btn-twin-scene-plane': 'A4-Vorlage',
  'btn-twin-scene-safety': 'Safety-Zone',
  'btn-twin-scene-zedm': 'ZED-Stativ',
  'btn-twin-detections': 'YOLO',
  'btn-twin-pointcloud': 'Punktwolke',
  'btn-twin-distance-line': 'Distanzlinie',
  'btn-moveit-coll-objects': 'Koll. Objekte',
  'btn-moveit-coll-ground': 'Koll. Boden',
};

let hud = null;                  // THREE.Group, Kind des Rigs (XR-Raum, Y oben)
let api = null;                  // Zustand und Aktionen aus xr.js
let renderer = null;
let surfaces = [];
let enabled = true;              // Nutzerwahl (Y links), bleibt ueber Sessions
let placed = false;
let following = false, posFollowing = false;
let hudYaw = 0, hudPitch = 0;
let hoverKey = '';
let dirty = true, lastRefresh = 0;
let drag = null;                 // { s, hitAz, hitEl, az0, el0 } waehrend des Verschiebens

const ORIGIN = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4();
const _head = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _f = new THREE.Vector3();
const _rc = new THREE.Raycaster();
const _inv = new THREE.Matrix4();
const _o = new THREE.Vector3();
const _d = new THREE.Vector3();

// ── Aufbau ──────────────────────────────────────────────────────────────────
export function createHud(parent, xrRenderer, xrApi) {
  api = xrApi;
  renderer = xrRenderer;
  if (hud) { parent.add(hud); return; }
  hud = new THREE.Group();
  hud.name = 'xr_hud';
  hud.visible = false;
  if (!surfaces.length) {
    surfaces = SLOTS.map(makeSurface);
    // Neue Flaeche (noch nicht gespeichert), die in einer gespeicherten
    // Anordnung auf einer anderen laege: auf den naechsten freien Platz.
    const saved = savedLayout();
    for (const s of surfaces) {
      if (!saved[s.id] && blocked(s)) { freeSpot(s); placeSurface(s); }
    }
  }
  surfaces.forEach(s => hud.add(s.mesh));
  parent.add(hud);
}

function makeSurface(slot) {
  const cw = Math.round(slot.w * PX_PER_M), ch = Math.round(slot.h * PX_PER_M);
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(slot.w, slot.h),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
  mesh.name = `xr_hud_${slot.id}`;
  mesh.renderOrder = RENDER_ORDER;
  mesh.visible = false;
  const s = { ...slot, pad: slot.pad || P, cw, ch, canvas, ctx: canvas.getContext('2d'), tex, mesh,
              hits: [], drawn: null, sig: '', dragState: '' };
  const saved = savedLayout()[slot.id];
  if (saved) { s.az = saved.az; s.el = saved.el; }
  placeSurface(s);
  return s;
}

function placeSurface(s) {
  const az = DEG(s.az), el = DEG(s.el);
  s.mesh.position.set(HUD_DIST * Math.sin(az) * Math.cos(el), HUD_DIST * Math.sin(el), -HUD_DIST * Math.cos(az) * Math.cos(el));
  // Vorderseite (+Z) zeigt zum Kopf, ohne Rollen.
  _m.lookAt(ORIGIN, s.mesh.position, UP);
  s.mesh.quaternion.setFromRotationMatrix(_m);
}

// ── Anordnung speichern / laden ─────────────────────────────────────────────
function savedLayout() {
  let st = null;
  try { st = JSON.parse(lsGet(LAYOUT_LS_KEY) || 'null'); } catch (e) { st = null; }
  const out = {};
  if (!st || typeof st !== 'object') return out;
  for (const [id, v] of Object.entries(st)) {
    if (v && Number.isFinite(v.az) && Number.isFinite(v.el)) {
      out[id] = { az: clampAz(v.az), el: THREE.MathUtils.clamp(v.el, -EL_LIMIT, EL_LIMIT) };
    }
  }
  return out;
}

function saveLayout() {
  const st = {};
  for (const s of surfaces) st[s.id] = { az: +s.az.toFixed(2), el: +s.el.toFixed(2) };
  lsSet(LAYOUT_LS_KEY, JSON.stringify(st));
}

export function hudResetLayout() {
  hudDragCancel();
  for (const s of surfaces) {
    const def = SLOTS.find(d => d.id === s.id);
    s.az = def.az;
    s.el = def.el;
    placeSurface(s);
  }
  lsSet(LAYOUT_LS_KEY, 'null');
  dirty = true;
}

// ── Ueberlappung (Winkel auf der Schale) ────────────────────────────────────
const RAD2DEG = THREE.MathUtils.radToDeg;
const wrapDeg = (a) => ((a + 180) % 360 + 360) % 360 - 180;
const clampAz = (a) => THREE.MathUtils.clamp(wrapDeg(a), -AZ_LIMIT, AZ_LIMIT);

// Halbe Ausdehnung in Azimut/Elevation. Zu den Polen hin ueberstreicht
// dieselbe Breite mehr Azimut - gerechnet wird mit der polnaeheren Kante.
function extent(s) {
  const hEl = RAD2DEG(Math.atan(s.h / 2 / HUD_DIST));
  const far = Math.min(85, Math.abs(s.el) + hEl);
  return { hAz: RAD2DEG(Math.atan(s.w / 2 / HUD_DIST)) / Math.cos(DEG(far)), hEl };
}

function overlaps(a, b) {
  const ea = extent(a), eb = extent(b);
  return Math.abs(wrapDeg(a.az - b.az)) < ea.hAz + eb.hAz + MIN_GAP_DEG
      && Math.abs(a.el - b.el) < ea.hEl + eb.hEl + MIN_GAP_DEG;
}

const blocked = (s) => surfaces.some(o => o !== s && overlaps(s, o));

// Naechster freier Platz um die Abwurfstelle, in Ringen von 1° nach aussen.
function freeSpot(s) {
  const az0 = s.az, el0 = s.el;
  for (let r = 1; r <= 60; r++) {
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      s.az = clampAz(az0 + r * Math.cos(a));
      s.el = THREE.MathUtils.clamp(el0 + r * Math.sin(a), -EL_LIMIT, EL_LIMIT);
      if (!blocked(s)) return true;
    }
  }
  s.az = az0;
  s.el = el0;
  return false;
}

// ── Verschieben mit dem Laser ───────────────────────────────────────────────
// Treffpunkt eines Strahls auf der Schale (HUD-Raum) als Azimut/Elevation.
// Der Controller liegt innerhalb der Schale - es gibt immer einen Treffer.
function rayAngles(ray) {
  _inv.copy(hud.matrixWorld).invert();
  _o.copy(ray.origin).applyMatrix4(_inv);
  _d.copy(ray.direction).transformDirection(_inv);
  const b = _o.dot(_d), c = _o.lengthSq() - HUD_DIST * HUD_DIST;
  const disc = b * b - c;
  if (disc < 0) return null;
  const t = -b + Math.sqrt(disc);
  if (t <= 0) return null;
  _o.addScaledVector(_d, t);
  return { az: RAD2DEG(Math.atan2(_o.x, -_o.z)), el: RAD2DEG(Math.asin(THREE.MathUtils.clamp(_o.y / HUD_DIST, -1, 1))) };
}

// ray: Strahl beim Druecken des Triggers - der gegriffene Punkt bleibt so
// unter dem Laser.
export function hudDragBegin(surfaceId, ray) {
  const s = surfaces.find(t => t.id === surfaceId);
  if (!hud || !hud.visible || !s) return false;
  const a = rayAngles(ray);
  if (!a) return false;
  drag = { s, hitAz: a.az, hitEl: a.el, az0: s.az, el0: s.el };
  s.dragState = blocked(s) ? 'blocked' : 'drag';
  dirty = true;
  return true;
}

export function hudDragMove(ray) {
  if (!drag) return;
  const a = rayAngles(ray);
  if (!a) return;
  const s = drag.s;
  s.az = clampAz(drag.az0 + wrapDeg(a.az - drag.hitAz));
  s.el = THREE.MathUtils.clamp(drag.el0 + a.el - drag.hitEl, -EL_LIMIT, EL_LIMIT);
  placeSurface(s);
  const st = blocked(s) ? 'blocked' : 'drag';
  if (st !== s.dragState) { s.dragState = st; dirty = true; }
}

// Loslassen: bei Ueberlappung auf den naechsten freien Platz, gibt es keinen,
// zurueck an den Start. Gibt zurueck, ob die Flaeche ausweichen musste.
export function hudDragEnd() {
  if (!drag) return false;
  const { s, az0, el0 } = drag;
  drag = null;
  let moved = false;
  if (blocked(s)) {
    moved = true;
    if (!freeSpot(s)) { s.az = az0; s.el = el0; }
  }
  placeSurface(s);
  s.dragState = '';
  saveLayout();
  dirty = true;
  return moved;
}

export function hudDragCancel() {
  if (!drag) return;
  const { s, az0, el0 } = drag;
  drag = null;
  s.az = az0;
  s.el = el0;
  placeSurface(s);
  s.dragState = '';
  dirty = true;
}

// ── Sichtbarkeit / Steuerung von aussen ─────────────────────────────────────
export function hudOnSessionStart() {
  if (!hud) return;
  hud.visible = enabled;
  placed = false;
  dirty = true;
}

export function hudOnSessionEnd() {
  hudDragEnd();
  if (hud) hud.visible = false;
  hoverKey = '';
}

export function toggleHud() {
  hudDragEnd();
  enabled = !enabled;
  if (hud) hud.visible = enabled;
  placed = false;
  dirty = true;
  return enabled;
}

export const isHudEnabled = () => enabled;

export function hudRecenter() {
  placed = false;
}

export function markHudDirty() {
  dirty = true;
}

export function setHudHover(key) {
  const k = key || '';
  if (k === hoverKey) return;
  hoverKey = k;
  dirty = true;
}

// Laser-Treffer auf dem HUD. Zaehlt nur auf gezeichnetem Inhalt - durch die
// leeren Teile einer Flaeche (z. B. eingeklappter Tab) zielt man hindurch.
// Freie Stellen der Karte liefern einen Treffer zum Verschieben (drag).
export function hudPick(ray, maxDist = Infinity) {
  if (!hud || !hud.visible) return null;
  let best = null;
  _rc.ray.copy(ray);
  _rc.near = 0;
  _rc.far = maxDist;
  for (const s of surfaces) {
    if (!s.mesh.visible || !s.drawn) continue;
    const hit = _rc.intersectObject(s.mesh, false)[0];
    if (!hit || !hit.uv || (best && hit.distance >= best.distance)) continue;
    const x = hit.uv.x * s.cw, y = (1 - hit.uv.y) * s.ch;
    const d = s.drawn;
    if (x < d.x || x > d.x + d.w || y < d.y || y > d.y + d.h) continue;
    const r = s.hits.find(t => x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h)
      || { key: `hud:${s.id}:bg`, surface: s.id, drag: true, onClick: null };
    best = { hit: r, distance: hit.distance };
  }
  return best;
}

// ── Pro Frame ───────────────────────────────────────────────────────────────
export function updateHud(frame, dt) {
  if (!hud || !hud.visible) return;
  follow(frame, dt);
  const now = performance.now();
  if (!dirty && now - lastRefresh < HUD_REFRESH_MS) return;
  dirty = false;
  lastRefresh = now;
  const st = api.state();
  for (const s of surfaces) {
    const model = MODELS[s.id](st);
    if (!model) {
      s.mesh.visible = false;
      s.drawn = null;
      s.sig = '';
      continue;
    }
    const hov = hoverKey.startsWith(`hud:${s.id}:`) ? hoverKey : '';
    const sig = JSON.stringify(model, sigReplacer) + '|' + hov + '|' + s.dragState;
    s.mesh.visible = true;
    if (sig === s.sig) continue;
    s.sig = sig;
    drawSurface(s, model, hov);
    s.tex.needsUpdate = true;
  }
}

function sigReplacer(k, v) {
  return typeof v === 'function' || v instanceof Element ? undefined : v;
}

const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function follow(frame, dt) {
  if (drag) return;                   // beim Verschieben steht die Schale still
  const space = renderer && renderer.xr.getReferenceSpace();
  const pose = frame && space ? frame.getViewerPose(space) : null;
  if (!pose) return;
  const p = pose.transform.position, o = pose.transform.orientation;
  _head.set(p.x, p.y, p.z);
  _q.set(o.x, o.y, o.z, o.w);
  _f.set(0, 0, -1).applyQuaternion(_q);
  const yaw = Math.atan2(-_f.x, -_f.z);
  const pitch = THREE.MathUtils.clamp(Math.asin(THREE.MathUtils.clamp(_f.y, -1, 1)), PITCH_MIN, PITCH_MAX);
  if (!placed) {
    hudYaw = yaw;
    hudPitch = pitch;
    hud.position.copy(_head);
    placed = true;
    following = posFollowing = false;
  } else {
    const k = 1 - Math.exp(-dt * FOLLOW_RATE);
    const dYaw = wrapAngle(yaw - hudYaw), dPitch = pitch - hudPitch;
    if (Math.abs(dYaw) > YAW_DEADZONE || Math.abs(dPitch) > PITCH_DEADZONE) following = true;
    if (following) {
      hudYaw = wrapAngle(hudYaw + dYaw * k);
      hudPitch += dPitch * k;
      if (Math.abs(dYaw) < DEG(2) && Math.abs(dPitch) < DEG(2)) following = false;
    }
    const dist = hud.position.distanceTo(_head);
    if (dist > POS_DEADZONE) posFollowing = true;
    if (posFollowing) {
      hud.position.lerp(_head, k);
      if (dist < 0.02) posFollowing = false;
    }
  }
  hud.rotation.set(hudPitch, hudYaw, 0, 'YXZ');
  hud.updateMatrixWorld(true);
}

// ── Inhalte (spiegeln den DOM) ──────────────────────────────────────────────
const DIV = { div: true };
const val = (sel) => { const el = q(sel); return el ? el.value : ''; };

function tabCard(key, title, fa, rest) {
  const tab = q(`#hud-tab-${key}`);
  return {
    title, fa,
    head: tab ? tab.querySelector('.hud-tab-head') : null,
    collapsed: !!(tab && tab.classList.contains('is-collapsed')),
    info: [], items: [], cols: 2, btnH: BTN_H,
    ...rest,
  };
}

const MODELS = {
  toolbar(st) {
    const d = (sel, label, group) => domItem(q(sel), label, { group });
    const plan = st.ctrlMode === 'plan';
    const ar = st.xrKind === 'ar';
    const xrOpts = (on) => ({ active: on, group: 'xr', color: on ? groupColor('xr') : COL.mut });
    return {
      toolbar: true,
      items: [
        d('#btn-twin-grid', 'Raster', 'scene'),
        d('#btn-twin-edges', 'Kanten', 'scene'),
        d('#btn-hud-tabs-toggle', 'Panels', 'scene'),
        d('#btn-sound-toggle', 'Sound', 'scene'),
        DIV,
        d('#btn-twin-gizmo', 'Gizmo', 'plan'),
        d('#btn-twin-gizmo-mode', twin.getTCPGizmoMode() === 'rotate' ? 'Rotation' : 'Schieben', 'plan'),
        d('#btn-twin-gizmo-sync', 'Sync', 'plan'),
        d('#btn-twin-path-preview', 'Ghost', 'plan'),
        DIV,
        ownItem('mode-servo', 'fa-gamepad', 'SERVO', () => api.setCtrlMode('servo'),
          { active: !plan, group: 'robot', solid: true }),
        ownItem('mode-plan', 'fa-ghost', 'PLAN', () => api.setCtrlMode('plan'),
          { active: plan, group: 'plan', solid: true }),
        DIV,
        ownItem('view-vr', 'fa-vr-cardboard', 'VR', () => api.setViewMode('vr'), xrOpts(!ar)),
        { ...ownItem('view-ar', 'fa-glasses', 'Passthrough', () => api.setViewMode('ar'),
          { ...xrOpts(ar), disabled: !st.canSwitch }), span: 1.35 },
        { ...ownItem('wrist', 'fa-hand', 'Handpanel', api.togglePanel, xrOpts(st.panelVisible)), span: 1.2 },
        ownItem('exit', 'fa-right-from-bracket', 'Beenden', api.exit, { group: 'xr', color: COL.red }),
      ].filter(Boolean),
    };
  },

  moveit(st) {
    const mp = q('#moveit-popup');
    const open = !!mp && !mp.classList.contains('mp-hidden');
    const warnEl = q('#twin-warning-banner');
    const warn = warnEl && !warnEl.classList.contains('banner-hidden') ? txt('#twin-warning-text') : '';
    const banner = warn ? { text: `⚠ ${warn}`, color: COL.red } : (st.flash ? { text: st.flash, color: COL.orange } : null);
    if (!open && !banner) return null;
    if (!open) return { banner, info: [], items: [] };
    const info = [];
    const obj = txt('#mp-object-name');
    if (obj) info.push({ label: 'OBJEKT', value: obj });
    info.push(moveitTargetLine());
    info.push(...moveitProgressLines());
    const detail = txt('#mp-detail');
    if (detail) info.push({ label: 'INFO', value: detail });
    const actions = moveitActionsVisible();
    return {
      title: 'MOVEIT', fa: 'fa-route', group: 'plan',
      badge: `${txt('#mp-phase')} · ${txt('#mp-timer')}`, badgeColor: groupColor('plan'),
      close: domItem(q('#moveit-popup .mp-close'), 'Schliessen'),
      banner, info,
      items: actions ? [
        domItem(q('#moveit-popup .mp-btn-exec'), 'Ausführen', { group: 'plan', color: COL.green }),
        domItem(q('#moveit-popup .mp-btn-discard'), 'Verwerfen', { group: 'plan', color: COL.red }),
      ].filter(Boolean) : [],
      cols: 2, btnH: FLAT_BTN_H,
    };
  },

  motion() {
    return tabCard('motion', 'MOTION', 'fa-bolt', {
      group: 'robot',
      items: [
        ...qa('#hud-tab-motion .hud-tab-body button').map(b => domItem(b, poseLabel(b), { group: 'robot' })),
        ...qa('[data-action="setGripper"]').map(b => domItem(b, GRIPPER_LABELS[b.id], { group: 'grip' })),
      ].filter(Boolean),
    });
  },

  scene() {
    return tabCard('scene', 'SCENE', 'fa-layer-group', {
      group: 'scene',
      items: qa('#hud-tab-scene .hud-tab-body button').map(b => domItem(b, SCENE_LABELS[b.id], { group: 'scene' })).filter(Boolean),
      cols: 3,
    });
  },

  estop() {
    return { estop: true, latched: !!estopLatched };
  },

  mode(st) {
    return { modeBadge: true, plan: st.ctrlMode === 'plan' };
  },

  telemetry() {
    const bar = q('#hud-manip-bar');
    const online = !!(ros && ros.isConnected);
    return tabCard('telemetry', 'TELEMETRY', 'fa-gauge-high', {
      group: 'help',
      info: [
        { label: 'REACH', value: txt('#hud-manip-val'),
          bar: bar ? { pct: parseFloat(bar.style.width) || 0, color: getComputedStyle(bar).backgroundColor } : null },
        { label: 'FLOOR', value: txt('#hud-floor-val') },
        { label: 'SERVO', value: txt('#moveit-badge') },
        { label: 'ROS', value: online ? 'verbunden' : 'GETRENNT', color: online ? COL.green : COL.red },
      ],
    });
  },

  pose() {
    return tabCard('pose', 'POSE', 'fa-location-crosshairs', {
      group: 'robot',
      info: [
        { label: 'XYZ', value: `X ${val('#inp-x')}   Y ${val('#inp-y')}   Z ${val('#inp-z')} mm` },
        { label: 'RPY', value: `R ${val('#inp-r')}   P ${val('#inp-p')}   Y ${val('#inp-yw')}` },
      ],
      items: [domItem(q('#hud-tab-pose button[data-action="requestMotion"]'), 'Pose anfahren', { group: 'robot' })].filter(Boolean),
      cols: 1, btnH: FLAT_BTN_H,
    });
  },

  speed() {
    return tabCard('speed', 'SPEED', 'fa-gauge', {
      group: 'robot',
      badge: txt('#speed-val'), badgeColor: groupColor('robot'),
      items: [
        ownItem('speed-', 'fa-minus', 'Langsamer', () => stepSpeed(-1), { group: 'robot', repeat: true }),
        ownItem('speed+', 'fa-plus', 'Schneller', () => stepSpeed(1), { group: 'robot', repeat: true }),
      ],
      btnH: FLAT_BTN_H,
    });
  },
};

// ── Zeichnen ────────────────────────────────────────────────────────────────
function drawSurface(s, m, hov) {
  const ctx = s.ctx;
  ctx.clearRect(0, 0, s.cw, s.ch);
  s.hits = [];
  if (m.toolbar) drawToolbar(s, m, hov);
  else if (m.estop) drawEstop(s, m, hov);
  else if (m.modeBadge) drawModeBadge(s, m);
  else drawCard(s, m, hov);
  // Beim Verschieben: Rahmen cyan, rot solange die Flaeche eine andere beruehrt.
  if (s.dragState && s.drawn) {
    const d = s.drawn;
    roundRect(ctx, d.x + 3, d.y + 3, d.w - 6, d.h - 6, 26);
    ctx.strokeStyle = s.dragState === 'blocked' ? COL.red : COL.cyan;
    ctx.lineWidth = 6;
    ctx.stroke();
  }
}

// extra.drag: Druecken + Ziehen verschiebt die Flaeche, kurzes Druecken
// klickt beim Loslassen. extra.repeat: Klick wiederholt sich beim Halten.
function addHit(s, r, key, onClick, extra = {}) {
  s.hits.push({ ...r, key: `hud:${s.id}:${key}`, surface: s.id, onClick, ...extra });
}

// Griff (⋮⋮) links an Toolbar und Not-Aus: dort fasst man die Leiste an.
function drawHandle(s, r, hov) {
  const ctx = s.ctx;
  const key = `hud:${s.id}:handle`;
  roundRect(ctx, r.x, r.y, r.w, r.h, 14);
  ctx.fillStyle = hov === key ? COL.btnHover : COL.btn;
  ctx.fill();
  ctx.strokeStyle = hov === key ? COL.cyan : COL.border;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 30px ${FA_FONT}`;
  ctx.fillStyle = s.dragState ? COL.cyan : COL.mut;
  ctx.fillText(glyphFor('fa-grip-vertical'), r.x + r.w / 2, r.y + r.h / 2);
  addHit(s, r, 'handle', null, { drag: true });
}

function cardBackground(ctx, x, y, w, hgt, group) {
  roundRect(ctx, x, y, w, hgt, 28);
  ctx.fillStyle = `rgba(11, 17, 32, ${CARD_ALPHA})`;
  ctx.fill();
  ctx.strokeStyle = group ? groupColor(group) + '99' : COL.border;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawToolbar(s, m, hov) {
  const ctx = s.ctx, p = s.pad;
  const btns = m.items.filter(it => !it.div);
  const n = btns.length;
  const d = m.items.length - n;
  // Breite pro Einheit; lange Beschriftungen (span > 1) bekommen mehr Platz.
  const units = btns.reduce((a, it) => a + (it.span || 1), 0);
  const unitW = (s.cw - 2 * p - HANDLE_W - n * G - d * TB_DIV_W) / units;
  const btnH = s.ch - 2 * p;
  cardBackground(ctx, 0, 0, s.cw, s.ch);
  s.drawn = { x: 0, y: 0, w: s.cw, h: s.ch };
  drawHandle(s, { x: p, y: p, w: HANDLE_W, h: btnH }, hov);
  let x = p + HANDLE_W + G;
  for (const it of m.items) {
    if (it.div) {
      // Trennstrich mittig zwischen den Nachbar-Buttons
      const cx = x - G + (G + TB_DIV_W) / 2;
      ctx.strokeStyle = COL.border;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, p + 16);
      ctx.lineTo(cx, s.ch - p - 16);
      ctx.stroke();
      x += TB_DIV_W;
      continue;
    }
    const r = { x, y: p, w: unitW * (it.span || 1), h: btnH };
    const key = `hud:${s.id}:${it.key}`;
    drawButton(ctx, r, it, hov === key);
    if (!it.disabled) addHit(s, r, it.key, it.onClick);
    x += r.w + G;
  }
}

function drawEstop(s, m, hov) {
  const ctx = s.ctx, p = s.pad;
  const hgt = s.ch - 2 * p;
  const x0 = p + HANDLE_W + G;
  const resetW = m.latched ? (s.cw - p - x0 - G) / 3 : 0;
  const r = { x: x0, y: p, w: s.cw - p - x0 - (resetW ? resetW + G : 0), h: hgt };
  drawHandle(s, { x: p, y: p, w: HANDLE_W, h: hgt }, hov);
  const key = `hud:${s.id}:estop`;
  roundRect(ctx, r.x, r.y, r.w, r.h, 20);
  ctx.fillStyle = hov === key ? '#dc2626' : '#b91c1c';
  ctx.fill();
  ctx.strokeStyle = '#fecaca';
  ctx.lineWidth = 4;
  ctx.stroke();
  // Icon und Text als Gruppe mittig
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `900 44px ${FA_FONT}`;
  const glyph = glyphFor('fa-hand');
  const gw = ctx.measureText(glyph).width;
  ctx.font = `800 40px ${FONT}`;
  const label = 'NOT-AUS';
  const lw = ctx.measureText(label).width;
  const lx = r.x + (r.w - (gw + 18 + lw)) / 2;
  ctx.fillStyle = '#fff';
  ctx.font = `900 44px ${FA_FONT}`;
  ctx.fillText(glyph, lx, r.y + r.h / 2);
  ctx.font = `800 40px ${FONT}`;
  ctx.fillText(label, lx + gw + 18, r.y + r.h / 2);
  addHit(s, r, 'estop', () => api.estop('HUD'));
  if (resetW) {
    const rr = { x: s.cw - p - resetW, y: p, w: resetW, h: hgt };
    drawButton(ctx, rr, { glyph: glyphFor('fa-rotate-left'), label: 'Reset', color: COL.orange, active: true }, hov === `hud:${s.id}:reset`);
    addHit(s, rr, 'reset', () => api.estopReset());
  }
  s.drawn = { x: 0, y: 0, w: s.cw, h: s.ch };
}

// MODE-Badge: voll in der Farbe des aktiven Modus (SERVO blau, PLAN violett),
// wie der aktive Modus-Button. Reine Anzeige - die ganze Flaeche ist Griff
// zum Verschieben (freie Stelle in hudPick), B rechts wechselt den Modus.
function drawModeBadge(s, m) {
  const ctx = s.ctx, p = s.pad;
  const color = groupColor(m.plan ? 'plan' : 'robot');
  const r = { x: p, y: p, w: s.cw - 2 * p, h: s.ch - 2 * p };
  const cy = r.y + r.h / 2;
  roundRect(ctx, r.x, r.y, r.w, r.h, r.h / 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = COL.bg;
  // links Griff + "MODE", rechts der Tastenhinweis, dazwischen mittig der Modus
  ctx.font = `900 24px ${FA_FONT}`;
  const grip = glyphFor('fa-grip-vertical');
  ctx.fillText(grip, r.x + 28, cy);
  let xl = r.x + 28 + ctx.measureText(grip).width + 16;
  ctx.font = `800 22px ${FONT}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
  ctx.fillText('MODE', xl, cy);
  xl += ctx.measureText('MODE').width + 16;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.textAlign = 'right';
  ctx.font = `700 22px ${FONT}`;
  const hint = 'B ⇄';
  const xr = r.x + r.w - 32 - ctx.measureText(hint).width - 16;
  ctx.fillText(hint, r.x + r.w - 32, cy);
  const glyph = glyphFor(m.plan ? 'fa-ghost' : 'fa-gamepad');
  const label = m.plan ? 'PLAN' : 'SERVO';
  ctx.font = `900 40px ${FA_FONT}`;
  const gw = ctx.measureText(glyph).width;
  ctx.font = `900 42px ${FONT}`;
  const lw = ctx.measureText(label).width;
  const x0 = Math.max(xl, (xl + xr) / 2 - (gw + 16 + lw) / 2);
  ctx.textAlign = 'left';
  ctx.font = `900 40px ${FA_FONT}`;
  ctx.fillText(glyph, x0, cy);
  ctx.font = `900 42px ${FONT}`;
  ctx.fillText(label, x0 + gw + 16, cy + 2);
  s.drawn = { x: 0, y: 0, w: s.cw, h: s.ch };
}

function cardHeight(s, m, rows) {
  let hgt = 2 * P;
  if (m.banner) hgt += BANNER_H + (m.title ? G : 0);
  if (m.title) hgt += HEAD_H;
  if (!m.collapsed) {
    let body = m.info.length * INFO_H;
    if (rows) body += (body ? G : 0) + rows * m.btnH + (rows - 1) * G;
    if (body) hgt += (m.title || m.banner ? G : 0) + body;
  }
  return hgt;
}

function drawCard(s, m, hov) {
  const ctx = s.ctx;
  const btnH = m.btnH || BTN_H;
  const cols = m.cols || 2;
  const items = m.collapsed ? [] : (m.items || []);
  // So viele Button-Reihen, wie in die Flaeche passen
  let rows = Math.ceil(items.length / cols);
  while (rows > 0 && cardHeight(s, { ...m, btnH }, rows) > s.ch) rows--;
  const hgt = cardHeight(s, { ...m, btnH }, rows);
  const y0 = s.anchor === 'bottom' ? s.ch - hgt : 0;
  cardBackground(ctx, 0, y0, s.cw, hgt, m.group);
  s.drawn = { x: 0, y: y0, w: s.cw, h: hgt };

  let y = y0 + P;
  const x = P, w = s.cw - 2 * P;
  ctx.textBaseline = 'middle';

  if (m.banner) {
    roundRect(ctx, x, y, w, BANNER_H, 12);
    ctx.fillStyle = m.banner.color + '33';
    ctx.fill();
    ctx.strokeStyle = m.banner.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = `700 24px ${FONT}`;
    ctx.fillStyle = m.banner.color;
    ctx.fillText(fitText(ctx, m.banner.text, w - 24), x + w / 2, y + BANNER_H / 2);
    y += BANNER_H + (m.title ? G : 0);
  }

  if (m.title) {
    drawHeader(s, m, y, hov);
    y += HEAD_H;
  }
  if (m.collapsed) return;
  if (m.info.length || rows) y += (m.title || m.banner ? G : 0);

  for (const line of m.info) {
    drawInfoLine(ctx, line, x, y, w, INFO_H, LABEL_COL_W);
    y += INFO_H;
  }
  if (m.info.length && rows) y += G;

  const btnW = (w - (cols - 1) * G) / cols;
  items.slice(0, rows * cols).forEach((it, i) => {
    const r = { x: x + (i % cols) * (btnW + G), y: y + Math.floor(i / cols) * (btnH + G), w: btnW, h: btnH };
    drawButton(ctx, r, it, hov === `hud:${s.id}:${it.key}`);
    if (!it.disabled) addHit(s, r, it.key, it.onClick, { repeat: !!it.repeat });
  });
}

function drawHeader(s, m, y, hov) {
  const ctx = s.ctx;
  const x = P, w = s.cw - 2 * P, cy = y + HEAD_H / 2;
  const headKey = `hud:${s.id}:head`;
  if (hov === headKey) {
    roundRect(ctx, x, y, w, HEAD_H, 14);
    ctx.fillStyle = COL.btnHover;
    ctx.fill();
  }
  // Griff (⋮⋮): die Kopfzeile verschiebt die Karte
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `900 22px ${FA_FONT}`;
  ctx.fillStyle = s.dragState ? COL.cyan : COL.dim;
  ctx.fillText(glyphFor('fa-grip-vertical'), x + 10, cy);
  ctx.font = `900 30px ${FA_FONT}`;
  ctx.fillStyle = m.group ? groupColor(m.group) : '#ffffff';
  ctx.fillText(glyphFor(m.fa), x + 38, cy);
  ctx.font = `800 26px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(m.title, x + 84, cy);
  const titleEnd = x + 84 + ctx.measureText(m.title).width;

  // Rechts: Schliessen bzw. Klapp-Pfeil, davor das Badge.
  let xr = x + w - 8;
  if (m.close) {
    const cr = { x: xr - 52, y: y + 4, w: 52, h: HEAD_H - 8 };
    const ck = `hud:${s.id}:close`;
    roundRect(ctx, cr.x, cr.y, cr.w, cr.h, 12);
    ctx.fillStyle = hov === ck ? COL.btnHover : COL.btn;
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.font = `900 26px ${FA_FONT}`;
    ctx.fillStyle = COL.mut;
    ctx.fillText(glyphFor('fa-xmark'), cr.x + cr.w / 2, cy);
    addHit(s, cr, 'close', m.close.onClick);
    xr = cr.x - G;
  } else if (m.head) {
    ctx.textAlign = 'center';
    ctx.font = `900 24px ${FA_FONT}`;
    ctx.fillStyle = COL.mut;
    ctx.fillText(glyphFor(m.collapsed ? 'fa-chevron-right' : 'fa-chevron-down'), xr - 18, cy);
    xr -= 36 + G;
  }
  if (m.badge) {
    ctx.font = `700 24px ${FONT}`;
    const t = fitText(ctx, m.badge, Math.max(0, xr - titleEnd - G - 28));
    if (t && t !== '…') pill(ctx, xr, y + (HEAD_H - 44) / 2, t, m.badgeColor || COL.cyan);
  }
  // Nach dem Schliessen-Button eingetragen - der hat so Vorrang.
  addHit(s, { x, y, w, h: HEAD_H }, 'head', m.head ? () => m.head.click() : null, { drag: true });
}

// Alle Flaechen ohne Brille zeichnen (Layout-Pruefung am Desktop / in Tests).
export function renderXRHudPreview(state) {
  const st = { xrKind: 'vr', canSwitch: true, ctrlMode: 'servo', panelVisible: false, flash: '', ...state };
  if (!api) api = { state: () => st, setViewMode() {}, setCtrlMode() {}, togglePanel() {}, exit() {}, estop() {}, estopReset() {} };
  if (!surfaces.length) surfaces = SLOTS.map(makeSurface);
  return surfaces.map((s) => {
    const model = MODELS[s.id](st);
    if (model) drawSurface(s, model, '');
    else { s.ctx.clearRect(0, 0, s.cw, s.ch); s.drawn = null; }
    return { id: s.id, canvas: s.canvas, drawn: s.drawn, hits: s.hits.map(({ onClick, ...r }) => r) };
  });
}

// Winkel-Ausdehnung der Flaechen (Grad) in der aktuellen Anordnung und die
// Paare, die sich beruehren (muss leer sein) - fuer Tests / Diagnose.
export function hudSlotExtents() {
  const list = surfaces.length ? surfaces : SLOTS;
  return {
    slots: list.map((s) => {
      const e = extent(s);
      return { id: s.id, az: [s.az - e.hAz, s.az + e.hAz], el: [s.el - e.hEl, s.el + e.hEl] };
    }),
    overlaps: list.flatMap((a, i) => list.slice(i + 1).filter(b => overlaps(a, b)).map(b => `${a.id}/${b.id}`)),
  };
}
