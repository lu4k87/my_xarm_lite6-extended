// ── Tastenhilfe: Belegung der Quest-Controller in der Brille ───────────────
//
// Neben jedem Controller schwebt eine Karte mit seiner Belegung. Sie
// erscheint, sobald man auf den Controller schaut, bleibt, solange man sie
// liest, und verschwindet, wenn der Blick weitergeht.
//
//   ┌ ● LINKER CONTROLLER  VR ┐           ┌ ● RECHTER CONTROLLER  SERVO ┐
//   │ (X)      Handpanel      │  [L]  [R] │ TRIGGER  Greifer auf/zu     │
//   │ (Y)      HUD            │           │ GRIP     Roboter fuehren    │
//   │ STICK    Gehen          │           │ (A)      Zentrieren         │
//   │ GRIP+TRG NOT-AUS        │           │ (B)      Modus -> PLAN      │
//   └─────────────────────────┘           │ STICK    Fliegen            │
//                                         └─────────────────────────────┘
//
// Die Zeilen folgen dem Zustand (SERVO/PLAN, VR/Passthrough/Nozzle, Laser
// auf UI oder Objekt, Not-Aus): was gerade nicht geht, ist abgeblendet und
// sagt warum. Gedrueckte Tasten leuchten in der Farbe des Controllers.
// Dieselben Zeilen zeigt der Tab TASTEN im Handgelenk-Panel (xr.js).
//
// Lage: seitlich aussen neben dem Controller, so wie man ihn gerade sieht
// (links vom linken, rechts vom rechten), zum Kopf gedreht und aufrecht.
// Die linke Karte entfaellt, solange das Handgelenk-Panel offen ist - das
// Panel sitzt ueber derselben Hand und hat den Tab TASTEN. Liegt der
// Laserpunkt hinter einer Karte, blendet sie aus - sie verdeckt nie das Ziel.

import * as THREE from 'three';
import { COL, FONT, FA_FONT, glyphFor, roundRect, fitText, pill } from './xr_ui.js';
import { lsGet, lsSet } from '../util.js';

const LS_KEY = 'robot_control_xr_hints_v1';
export const HAND_COL = { left: '#10b981', right: '#38bdf8' };   // Ringe der Controller-Modelle

// Karten-Layout [px] und Groesse in der Brille [m]
const CARD_W_PX = 640, CARD_W_M = 0.15;
const P = 20, G = 8, HEAD_H = 52;
export const ROW_H = 64, ROW_GAP = 8;
const BADGE_W = 100;
const INNER_M = 0.07;                 // Abstand Controller-Mitte -> Kartenrand
const RENDER_ORDER = 960;             // ueber HUD (800), Panel (900), Controllern (950)
// Blick auf den Controller: einblenden unter SHOW_DEG, ausblenden ueber HIDE_DEG
const SHOW_DEG = 20, HIDE_DEG = 28;
const MAX_DIST = 1.0;                 // m, weiter weg keine Karte
const FADE_RATE = 10;                 // 1/s

let enabled = lsGet(LS_KEY, '1') !== '0';
let parent = null;
const cards = { left: null, right: null };

const UP = new THREE.Vector3(0, 1, 0);
const _head = new THREE.Vector3(), _hq = new THREE.Quaternion(), _fwd = new THREE.Vector3();
const _v = new THREE.Vector3(), _dir = new THREE.Vector3(), _right = new THREE.Vector3(), _up = new THREE.Vector3();
const _pos = new THREE.Vector3(), _m = new THREE.Matrix4();

export const isControlHintsEnabled = () => enabled;

export function toggleControlHints() {
  enabled = !enabled;
  lsSet(LS_KEY, enabled ? '1' : '0');
  return enabled;
}

// ── Inhalt ──────────────────────────────────────────────────────────────────
// st (aus xr.js): { mode, view: 'vr'|'ar'|'nozzle', hud, panel, aim: ''|'ui'|'object',
//   aimName, holding, locked, pads: { left, right } }  (pads wie readPad in xr.js)
const MODE_NAME = { servo: 'SERVO', plan: 'PLAN' };

export function legendRows(hand, st) {
  const pad = (st.pads && st.pads[hand]) || {};
  const stick = Math.abs(pad.sx || 0) > 0.15 || Math.abs(pad.sy || 0) > 0.15;
  if (hand === 'left') {
    const walk = st.view === 'nozzle' ? 'aus in der Kamera Nozzle'
      : st.view === 'ar' ? 'nur in der VR-Ansicht'
        : st.holding ? 'gesperrt, solange die rechte Hand führt' : '';
    return [
      { input: 'X', label: 'Handpanel ein/aus', sub: st.panel ? 'Panel ist offen' : 'Menü mit allen Tabs', pressed: pad.btnA },
      { input: 'Y', label: 'HUD ein/aus', sub: st.hud ? 'HUD ist an' : 'HUD ist aus', pressed: pad.btnB },
      { input: 'STICK', label: 'Gehen', sub: walk || 'in Blickrichtung', dim: !!walk, pressed: stick && !walk },
      { input: 'ESTOP', label: 'NOT-AUS', sub: 'beide Grips + beide Trigger zugleich', danger: true,
        pressed: pad.grip && pad.trigger },
    ];
  }
  const servo = st.mode === 'servo';
  const other = servo ? 'PLAN' : 'SERVO';
  let trig;
  if (st.aim === 'ui') trig = { label: 'Klicken', sub: 'Laser zeigt auf Panel/HUD' };
  else if (st.aim === 'object') trig = { label: 'Objekt wählen', sub: st.aimName || 'rote Greifkugel' };
  else if (servo) trig = { label: 'Greifer auf/zu', sub: st.locked ? 'gesperrt: Not-Aus aktiv' : 'Laser auf UI: klicken', dim: st.locked };
  else trig = { label: 'Klicken / Objekt wählen', sub: 'Laser auf UI oder Greifkugel' };
  const grip = servo
    ? { label: 'Roboter führen', sub: 'halten: TCP folgt der Hand' }
    : { label: 'Ghost ziehen', sub: 'loslassen: Bahn wird geplant' };
  if (st.locked) { grip.sub = 'gesperrt: Not-Aus aktiv'; grip.dim = true; }
  // Rechter Stick: mit Grip Linearachse (SERVO), ohne Grip fliegen (nur VR).
  const fly = st.view === 'vr';
  let stk;
  if (servo && pad.grip && !st.locked) stk = { label: 'Linearachse', sub: '← → verfahren' };
  else if (!fly && servo) stk = { label: 'Linearachse', sub: st.locked ? 'gesperrt: Not-Aus aktiv' : 'nur mit gedrücktem Grip', dim: true };
  else if (!fly) stk = { label: 'Fliegen', sub: st.view === 'nozzle' ? 'aus in der Kamera Nozzle' : 'nur in der VR-Ansicht', dim: true };
  else if (pad.grip) stk = { label: 'Fliegen', sub: 'erst Grip loslassen', dim: true };
  else stk = { label: 'Fliegen', sub: servo && !st.locked ? '↔ kreisen · ↕ Höhe · Grip: Linearachse' : '↔ um den Roboter · ↕ Höhe' };
  return [
    { input: 'TRIGGER', ...trig, pressed: pad.trigger },
    { input: 'GRIP', ...grip, pressed: pad.grip },
    { input: 'A', label: 'Zentrieren', sub: st.view === 'nozzle' ? 'HUD + Kamerasicht vor den Blick' : 'HUD vor den Blick holen', pressed: pad.btnA },
    { input: 'B', label: `Modus → ${other}`, sub: `aktiv: ${MODE_NAME[st.mode] || st.mode}`, pressed: pad.btnB },
    { input: 'STICK', ...stk, pressed: stick && !stk.dim },
  ];
}

// ── Zeichnen (auch fuer den Tab TASTEN im Panel) ────────────────────────────
// Badge: A/B/X/Y rund wie auf dem Controller, Trigger/Grip/Stick als Pille,
// der Not-Aus rot mit derselben Hand wie der NOT-AUS-Button. Gedrueckt =
// gefuellt in der Farbe des Controllers.
function drawBadge(ctx, x, cy, input, color, pressed, danger) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = x + BADGE_W / 2;
  const tone = danger ? COL.red : color;
  if (input.length === 1) {
    const r = 22;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = pressed ? tone : '#0f172a';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = tone;
    ctx.stroke();
    ctx.font = `800 26px ${FONT}`;
    ctx.fillStyle = pressed ? '#0b1120' : COL.text;
    ctx.fillText(input, cx, cy + 1);
    return;
  }
  const estop = input === 'ESTOP';
  const text = estop ? glyphFor('fa-hand') : input;
  let size = estop ? 24 : 18;
  const font = (s) => (estop ? `900 ${s}px ${FA_FONT}` : `800 ${s}px ${FONT}`);
  ctx.font = font(size);
  while (size > 12 && ctx.measureText(text).width > BADGE_W - 20) ctx.font = font(--size);
  const w = estop ? 64 : Math.min(BADGE_W - 4, ctx.measureText(text).width + 20), hgt = 36;
  roundRect(ctx, cx - w / 2, cy - hgt / 2, w, hgt, 10);
  ctx.fillStyle = pressed ? tone : (danger ? '#b91c1c' : '#0f172a');
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = danger ? '#fecaca' : tone;
  ctx.stroke();
  ctx.fillStyle = pressed && !danger ? '#0b1120' : (danger ? '#fff' : COL.text);
  ctx.fillText(text, cx, cy + 1);
}

// Eine Zeile: Badge links, Aktion und Erklaerung rechts daneben.
export function drawLegendRow(ctx, r, row, color) {
  const tint = row.danger ? COL.red : color;
  roundRect(ctx, r.x, r.y, r.w, r.h, 12);
  ctx.fillStyle = row.pressed ? tint + '33' : COL.panel;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = row.pressed ? tint : COL.border;
  ctx.stroke();
  const cy = r.y + r.h / 2;
  ctx.globalAlpha = row.dim ? 0.4 : 1;
  drawBadge(ctx, r.x + 6, cy, row.input, color, row.pressed, row.danger);
  const tx = r.x + 6 + BADGE_W + 12, maxW = r.x + r.w - 12 - tx;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `700 25px ${FONT}`;
  ctx.fillStyle = row.danger ? '#fca5a5' : COL.text;
  ctx.fillText(fitText(ctx, row.label, maxW), tx, row.sub ? r.y + r.h * 0.34 : cy);
  ctx.globalAlpha = 1;
  if (row.sub) {
    // Erst etwas kleiner, erst dann kuerzen (schmale Spalten im Panel).
    let size = 19;
    ctx.font = `500 ${size}px ${FONT}`;
    while (size > 16 && ctx.measureText(row.sub).width > maxW) ctx.font = `500 ${--size}px ${FONT}`;
    ctx.fillStyle = row.dim ? COL.orange : COL.mut;
    ctx.fillText(fitText(ctx, row.sub, maxW), tx, r.y + r.h * 0.74);
  }
}

// Kopf einer Hand-Spalte bzw. Karte: Farbpunkt wie der Ring am Controller.
export function drawHandHead(ctx, x, cy, w, hand, badge, badgeColor) {
  ctx.beginPath();
  ctx.arc(x + 12, cy, 9, 0, Math.PI * 2);
  ctx.fillStyle = HAND_COL[hand];
  ctx.fill();
  let xr = x + w;
  if (badge) xr = pill(ctx, xr, cy - 22, badge, badgeColor || HAND_COL[hand]);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `800 22px ${FONT}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '1px';
  ctx.fillStyle = COL.text;
  ctx.fillText(fitText(ctx, hand === 'left' ? 'LINKER CONTROLLER' : 'RECHTER CONTROLLER', xr - x - 40), x + 32, cy);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
}

const legendHeight = (n) => n * ROW_H + Math.max(0, n - 1) * ROW_GAP;

function viewBadge(st) {
  if (st.view === 'nozzle') return ['NOZZLE', COL.green];
  return st.view === 'ar' ? ['PASSTHROUGH', COL.cyan] : ['VR', COL.cyan];
}

function drawCard(c, st) {
  const ctx = c.ctx;
  const rows = legendRows(c.hand, st);
  ctx.clearRect(0, 0, c.cw, c.ch);
  roundRect(ctx, 1, 1, c.cw - 2, c.ch - 2, 24);
  ctx.fillStyle = 'rgba(11, 17, 32, 0.92)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = HAND_COL[c.hand];
  ctx.stroke();
  const [badge, badgeColor] = c.hand === 'right'
    ? [MODE_NAME[st.mode] || '', st.mode === 'plan' ? COL.orange : COL.cyan]
    : viewBadge(st);
  drawHandHead(ctx, P, P + HEAD_H / 2, c.cw - 2 * P, c.hand, badge, badgeColor);
  let y = P + HEAD_H + G;
  for (const row of rows) {
    drawLegendRow(ctx, { x: P, y, w: c.cw - 2 * P, h: ROW_H }, row, HAND_COL[c.hand]);
    y += ROW_H + ROW_GAP;
  }
}

// ── Karten in der Brille ────────────────────────────────────────────────────
function makeCard(hand) {
  const n = legendRows(hand, { pads: {} }).length;
  const cw = CARD_W_PX, ch = P + HEAD_H + G + legendHeight(n) + P;
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const w = CARD_W_M, hgt = CARD_W_M * ch / cw;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, hgt),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false }));
  mesh.name = `xr_hints_${hand}`;
  mesh.renderOrder = RENDER_ORDER;
  mesh.visible = false;
  return { hand, cw, ch, w, canvas, ctx: canvas.getContext('2d'), tex, mesh, sig: '', shown: false, alpha: 0 };
}

export function createControlHints(rig) {
  if (!cards.left) {
    cards.left = makeCard('left');
    cards.right = makeCard('right');
  }
  if (parent !== rig) {
    parent = rig;
    rig.add(cards.left.mesh, cards.right.mesh);
  }
}

export function controlHintsOnSessionEnd() {
  for (const c of Object.values(cards)) {
    if (!c) continue;
    c.mesh.visible = false;
    c.shown = false;
    c.alpha = 0;
    c.mesh.material.opacity = 0;
  }
}

// Winkel [Grad] zwischen Blickrichtung und der Richtung Kopf -> p.
function gazeDeg(p) {
  _dir.copy(p).sub(_head).normalize();
  return THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(_dir.dot(_fwd), -1, 1)));
}

// Pro Frame. grips: { left, right } = Grip-Objekte (Kinder des Rigs, also
// Pose im XR-Raum) oder null. opts.hide: { left, right } = Karte
// unterdruecken; opts.aimPoint: Laserpunkt im XR-Raum (oder null).
export function updateControlHints(frame, renderer, grips, st, opts, dt) {
  if (!cards.left) return;
  const space = renderer && renderer.xr.getReferenceSpace();
  const pose = frame && space ? frame.getViewerPose(space) : null;
  if (pose) {
    const p = pose.transform.position, o = pose.transform.orientation;
    _head.set(p.x, p.y, p.z);
    _hq.set(o.x, o.y, o.z, o.w);
    _fwd.set(0, 0, -1).applyQuaternion(_hq);
  }
  const hide = (opts && opts.hide) || {};
  const aim = opts && opts.aimPoint;
  for (const hand of ['left', 'right']) {
    const c = cards[hand];
    const g = grips[hand];
    let want = false;
    if (enabled && pose && g && g.visible && !hide[hand]) {
      const dist = g.position.distanceTo(_head);
      if (dist > 0.1 && dist < MAX_DIST) {
        place(c, g, hand === 'left' ? -1 : 1);
        // Einblenden: Blick auf den Controller. Halten: Blick auf Controller
        // oder Karte (beim Lesen wandert der Blick auf die Karte).
        want = c.shown
          ? Math.min(gazeDeg(g.position), gazeDeg(c.mesh.position)) < HIDE_DEG
          : gazeDeg(g.position) < SHOW_DEG;
        if (want && aim && covers(c, aim)) want = false;
      }
    }
    c.shown = want;
    c.alpha += ((want ? 1 : 0) - c.alpha) * (1 - Math.exp(-dt * FADE_RATE));
    if (!want && c.alpha < 0.02) c.alpha = 0;
    c.mesh.visible = c.alpha > 0;
    c.mesh.material.opacity = c.alpha;
    if (!c.mesh.visible) continue;
    const sig = JSON.stringify(legendRows(hand, st)) + st.mode + st.view;
    if (sig !== c.sig) {
      c.sig = sig;
      drawCard(c, st);
      c.tex.needsUpdate = true;
    }
  }
}

// Seitlich aussen neben dem Controller, wie ihn der Kopf gerade sieht:
// rechts/oben quer zur Sichtlinie Kopf -> Controller, Karte zum Kopf gedreht.
function place(c, g, side) {
  _v.copy(g.position).sub(_head).normalize();
  _right.crossVectors(_v, UP);
  if (_right.lengthSq() < 1e-4) _right.set(1, 0, 0).applyQuaternion(_hq);
  _right.normalize();
  _up.crossVectors(_right, _v).normalize();
  _pos.copy(g.position).addScaledVector(_right, side * (INNER_M + c.w / 2)).addScaledVector(_up, 0.01);
  c.mesh.position.copy(_pos);
  _m.lookAt(_head, _pos, UP);
  c.mesh.quaternion.setFromRotationMatrix(_m);
}

// Liegt p (vom Kopf aus gesehen) hinter der Karte? Umkreis plus 2 cm Rand.
function covers(c, p) {
  const dist = c.mesh.position.distanceTo(_head);
  const r = Math.hypot(c.w, c.w * c.ch / c.cw) / 2 + 0.02;
  _dir.copy(p).sub(_head).normalize();
  _v.copy(c.mesh.position).sub(_head).normalize();
  return Math.acos(THREE.MathUtils.clamp(_dir.dot(_v), -1, 1)) < Math.atan(r / dist);
}

// Karten ohne Brille zeichnen (Layout-Pruefung am Desktop / in Tests).
export function renderControlHintsPreview(st) {
  const s = { mode: 'servo', view: 'vr', hud: true, panel: false, aim: '', aimName: '', holding: false, locked: false, pads: {}, ...st };
  return ['left', 'right'].map((hand) => {
    const c = cards[hand] || (cards[hand] = makeCard(hand));
    drawCard(c, s);
    return { hand, canvas: c.canvas };
  });
}
