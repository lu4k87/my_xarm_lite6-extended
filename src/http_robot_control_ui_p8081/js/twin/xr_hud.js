// ── VR-HUD: Viewport-Overlays am Sichtrand (Meta Quest 3) ──────────────────
//
// Spiegelt das Overlay-Raster des Desktop-Viewports (.twin-overlay-grid in
// style.css) in die Brille, in derselben Anordnung:
//
//                 [ Toolbar: Viewport-Icons | SERVO/PLAN | VR/PT | ... ]
//                 [   MoveIt-Status + Warnbanner (nur wenn aktiv)      ]
//     [ MOTION ]                                             [ SCENE ]
//                              [ NOT-AUS ]
//     [ TELEMETRY ]            [  POSE   ]              [ SPEED ]
//
// Jede Flaeche ist ein Canvas auf einer Ebene. Alle liegen auf einer
// Kugelschale um den Kopf, zur Mitte gedreht, in festen Winkel-Slots mit
// Abstand - nichts ueberlappt (AGENTS.md), egal wie viel Inhalt ein Tab hat.
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
import {
  COL, FONT, FA_FONT, XR_ORDER, domItem, ownItem, glyphFor, shortLabel, q, qa, txt, stepSpeed,
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
// Winkel-Ausdehnung (halbe Breite/Hoehe bei 1,2 m): Toolbar ±25,0°/±1,8°,
// MoveIt ±13,1°/±5,9°, Seiten ±7,1°/±8,1..9,5°, Not-Aus ±9,5°/±1,8°,
// untere Reihe ±8,1°/±4,3°. Dazwischen bleiben ueberall mind. 3° frei.
const SLOTS = [
  { id: 'toolbar',   az: 0,   el: 27,  w: 1.12, h: 0.075, anchor: 'top', pad: 14 },
  { id: 'moveit',    az: 0,   el: 16,  w: 0.56, h: 0.25,  anchor: 'top' },
  { id: 'motion',    az: -34, el: 8,   w: 0.30, h: 0.40,  anchor: 'top' },
  { id: 'scene',     az: 34,  el: 12,  w: 0.30, h: 0.34,  anchor: 'top' },
  { id: 'estop',     az: 0,   el: -18, w: 0.40, h: 0.075, anchor: 'top', pad: 14 },
  { id: 'telemetry', az: -24, el: -28, w: 0.34, h: 0.18,  anchor: 'bottom' },
  { id: 'pose',      az: 0,   el: -28, w: 0.34, h: 0.18,  anchor: 'bottom' },
  { id: 'speed',     az: 24,  el: -28, w: 0.34, h: 0.18,  anchor: 'bottom' },
];

// Canvas-Layout [px]
const P = 18, G = 12;
const HEAD_H = 60, INFO_H = 42, BANNER_H = 48, BTN_H = 124, FLAT_BTN_H = 84;
const LABEL_COL_W = 150;
const TB_DIV_W = 20;

// Kurze Namen fuer die SCENE-Icons (die Tooltips am Desktop sind lang).
const SCENE_LABELS = {
  'btn-twin-scene-objects': 'Objekte',
  'btn-twin-scene-plane': 'Ebene',
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

const ORIGIN = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const _m = new THREE.Matrix4();
const _head = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _f = new THREE.Vector3();
const _rc = new THREE.Raycaster();

// ── Aufbau ──────────────────────────────────────────────────────────────────
export function createHud(parent, xrRenderer, xrApi) {
  api = xrApi;
  renderer = xrRenderer;
  if (hud) { parent.add(hud); return; }
  hud = new THREE.Group();
  hud.name = 'xr_hud';
  hud.visible = false;
  surfaces = SLOTS.map(makeSurface);
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
  const az = DEG(slot.az), el = DEG(slot.el);
  mesh.position.set(HUD_DIST * Math.sin(az) * Math.cos(el), HUD_DIST * Math.sin(el), -HUD_DIST * Math.cos(az) * Math.cos(el));
  // Vorderseite (+Z) zeigt zum Kopf, ohne Rollen.
  _m.lookAt(ORIGIN, mesh.position, UP);
  mesh.quaternion.setFromRotationMatrix(_m);
  return { ...slot, pad: slot.pad || P, cw, ch, canvas, ctx: canvas.getContext('2d'), tex, mesh, hits: [], drawn: null, sig: '' };
}

// ── Sichtbarkeit / Steuerung von aussen ─────────────────────────────────────
export function hudOnSessionStart() {
  if (!hud) return;
  hud.visible = enabled;
  placed = false;
  dirty = true;
}

export function hudOnSessionEnd() {
  if (hud) hud.visible = false;
  hoverKey = '';
}

export function toggleHud() {
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
    const r = s.hits.find(t => x >= t.x && x <= t.x + t.w && y >= t.y && y <= t.y + t.h) || null;
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
    const sig = JSON.stringify(model, sigReplacer) + '|' + hov;
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
    const d = (sel, label) => domItem(q(sel), label);
    const plan = st.ctrlMode === 'plan';
    const ar = st.xrKind === 'ar';
    return {
      toolbar: true,
      items: [
        d('#btn-twin-grid', 'Grid'),
        d('#btn-twin-edges', 'Kanten'),
        d('#btn-twin-gizmo', 'Gizmo'),
        d('#btn-twin-gizmo-mode', twin.getTCPGizmoMode() === 'rotate' ? 'Rotation' : 'Transl.'),
        d('#btn-twin-gizmo-sync', 'Sync'),
        d('#btn-twin-path-preview', 'Ghost'),
        d('#btn-hud-tabs-toggle', 'Panels'),
        d('#btn-sound-toggle', 'Sound'),
        DIV,
        ownItem('mode', plan ? 'fa-ghost' : 'fa-gamepad', plan ? 'PLAN' : 'SERVO', api.toggleCtrlMode,
          { active: true, color: plan ? COL.orange : COL.cyan }),
        DIV,
        ownItem('view-vr', 'fa-vr-cardboard', 'VR', () => api.setViewMode('vr'),
          { active: !ar, color: ar ? COL.mut : COL.cyan }),
        { ...ownItem('view-ar', 'fa-glasses', 'Passthrough', () => api.setViewMode('ar'),
          { active: ar, color: ar ? COL.cyan : COL.mut, disabled: !st.canSwitch }), span: 1.35 },
        DIV,
        { ...ownItem('wrist', 'fa-hand', 'Handpanel', api.togglePanel,
          { active: st.panelVisible, color: st.panelVisible ? COL.cyan : COL.mut }), span: 1.2 },
        ownItem('exit', 'fa-right-from-bracket', 'Beenden', api.exit, { color: COL.red }),
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
      title: 'MOVEIT', fa: 'fa-route',
      badge: `${txt('#mp-phase')} · ${txt('#mp-timer')}`, badgeColor: COL.cyan,
      close: domItem(q('#moveit-popup .mp-close'), 'Schliessen'),
      banner, info,
      items: actions ? [domItem(q('#moveit-popup .mp-btn-exec'), 'Execute'), domItem(q('#moveit-popup .mp-btn-discard'), 'Discard')].filter(Boolean) : [],
      cols: 2, btnH: FLAT_BTN_H,
    };
  },

  motion() {
    return tabCard('motion', 'MOTION', 'fa-bolt', {
      items: [
        ...qa('#hud-tab-motion .hud-tab-body button').map(b => domItem(b)),
        ...qa('[data-action="setGripper"]').map(b => domItem(b, `Greifer ${shortLabel(b.textContent)}`)),
      ].filter(Boolean),
    });
  },

  scene() {
    return tabCard('scene', 'SCENE', 'fa-layer-group', {
      items: qa('#hud-tab-scene .hud-tab-body button').map(b => domItem(b, SCENE_LABELS[b.id])).filter(Boolean),
      cols: 3,
    });
  },

  estop() {
    return { estop: true, latched: !!estopLatched };
  },

  telemetry() {
    const bar = q('#hud-manip-bar');
    const online = !!(ros && ros.isConnected);
    return tabCard('telemetry', 'TELEMETRY', 'fa-gauge-high', {
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
      info: [
        { label: 'XYZ', value: `X ${val('#inp-x')}   Y ${val('#inp-y')}   Z ${val('#inp-z')} mm` },
        { label: 'RPY', value: `R ${val('#inp-r')}   P ${val('#inp-p')}   Y ${val('#inp-yw')}` },
      ],
      items: [domItem(q('#hud-tab-pose button[data-action="requestMotion"]'), 'Go (Pose)')].filter(Boolean),
      cols: 1, btnH: FLAT_BTN_H,
    });
  },

  speed() {
    return tabCard('speed', 'SPEED', 'fa-gauge', {
      badge: txt('#speed-val'), badgeColor: COL.cyan,
      items: [
        ownItem('speed-', 'fa-minus', 'Langsamer', () => stepSpeed(-1)),
        ownItem('speed+', 'fa-plus', 'Schneller', () => stepSpeed(1)),
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
  else drawCard(s, m, hov);
}

function addHit(s, r, key, onClick) {
  s.hits.push({ ...r, key: `hud:${s.id}:${key}`, onClick });
}

function cardBackground(ctx, x, y, w, hgt) {
  roundRect(ctx, x, y, w, hgt, 28);
  ctx.fillStyle = 'rgba(11, 17, 32, 0.86)';
  ctx.fill();
  ctx.strokeStyle = COL.border;
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
  const unitW = (s.cw - 2 * p - (n - 1) * G - d * TB_DIV_W) / units;
  const btnH = s.ch - 2 * p;
  cardBackground(ctx, 0, 0, s.cw, s.ch);
  s.drawn = { x: 0, y: 0, w: s.cw, h: s.ch };
  let x = p;
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
  const resetW = m.latched ? (s.cw - 2 * p - G) / 3 : 0;
  const r = { x: p, y: p, w: s.cw - 2 * p - (resetW ? resetW + G : 0), h: hgt };
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
  const x0 = r.x + (r.w - (gw + 18 + lw)) / 2;
  ctx.fillStyle = '#fff';
  ctx.font = `900 44px ${FA_FONT}`;
  ctx.fillText(glyph, x0, r.y + r.h / 2);
  ctx.font = `800 40px ${FONT}`;
  ctx.fillText(label, x0 + gw + 18, r.y + r.h / 2);
  addHit(s, r, 'estop', () => api.estop('HUD'));
  if (resetW) {
    const rr = { x: s.cw - p - resetW, y: p, w: resetW, h: hgt };
    drawButton(ctx, rr, { glyph: glyphFor('fa-rotate-left'), label: 'Reset', color: COL.orange, active: true }, hov === `hud:${s.id}:reset`);
    addHit(s, rr, 'reset', () => api.estopReset());
  }
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
  cardBackground(ctx, 0, y0, s.cw, hgt);
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
    if (!it.disabled) addHit(s, r, it.key, it.onClick);
  });
}

function drawHeader(s, m, y, hov) {
  const ctx = s.ctx;
  const x = P, w = s.cw - 2 * P, cy = y + HEAD_H / 2;
  const headKey = `hud:${s.id}:head`;
  if (m.head && hov === headKey) {
    roundRect(ctx, x, y, w, HEAD_H, 14);
    ctx.fillStyle = COL.btnHover;
    ctx.fill();
  }
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `900 30px ${FA_FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(glyphFor(m.fa), x + 12, cy);
  ctx.font = `800 26px ${FONT}`;
  ctx.fillText(m.title, x + 58, cy);
  const titleEnd = x + 58 + ctx.measureText(m.title).width;

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
  if (m.head) addHit(s, { x, y, w, h: HEAD_H }, 'head', () => m.head.click());
}

// Alle Flaechen ohne Brille zeichnen (Layout-Pruefung am Desktop / in Tests).
export function renderXRHudPreview(state) {
  const st = { xrKind: 'vr', canSwitch: true, ctrlMode: 'servo', panelVisible: false, flash: '', ...state };
  if (!api) api = { state: () => st, setViewMode() {}, toggleCtrlMode() {}, togglePanel() {}, exit() {}, estop() {}, estopReset() {} };
  if (!surfaces.length) surfaces = SLOTS.map(makeSurface);
  return surfaces.map((s) => {
    const model = MODELS[s.id](st);
    if (model) drawSurface(s, model, '');
    else { s.ctx.clearRect(0, 0, s.cw, s.ch); s.drawn = null; }
    return { id: s.id, canvas: s.canvas, drawn: s.drawn, hits: s.hits.map(({ onClick, ...r }) => r) };
  });
}

// Winkel-Ausdehnung der Slots (Grad), fuer die Ueberlappungspruefung.
export function hudSlotExtents() {
  const atanDeg = (v) => THREE.MathUtils.radToDeg(Math.atan(v));
  return SLOTS.map(s => ({
    id: s.id,
    az: [s.az - atanDeg(s.w / 2 / HUD_DIST), s.az + atanDeg(s.w / 2 / HUD_DIST)],
    el: [s.el - atanDeg(s.h / 2 / HUD_DIST), s.el + atanDeg(s.h / 2 / HUD_DIST)],
  }));
}
