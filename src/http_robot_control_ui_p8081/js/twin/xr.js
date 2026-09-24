// ── VR-Viewport fuer die Meta Quest 3 (WebXR) ──────────────────────────────
//
// Laeuft nur in einem sicheren Kontext, also ueber https://<host>:8443/
// (vr_quest3_teleop liefert die Robot Control UI dort aus). Auf Port 8081
// (HTTP) gibt es kein navigator.xr - die VR-Buttons bleiben dann versteckt.
//
// Aufbau:
//   * Dieselbe Szene, Kamera und derselbe Renderer wie der Digital Twin. Die
//     Welt bleibt im ROS-Frame (Z oben, Meter). Kamera und Controller haengen
//     an einem Rig, das den XR-Raum (Y oben, -Z vorne) in den ROS-Frame dreht
//     und verschiebt. Rig-Pose = Standort des Nutzers (bzw. AR-Kalibrierung).
//   * Linker Controller: Handgelenk-Panel mit den Tabs und Icons des
//     Viewports. Die Eintraege spiegeln die echten DOM-Buttons (Zustand,
//     Farbe, Klick) - dieselbe Logik wie auf dem Desktop, nichts doppelt.
//   * Rechter Controller: Laser (Panel bedienen, Greifkugel waehlen).
//     Modus SERVO: Grip = MoveIt Servo (wie controller_reader.html),
//     Trigger = Greifer.  Modus PLAN: Grip zieht den Ghost (TCP-Gizmo),
//     Loslassen plant; Execute/Discard im Panel (Tab MOVEIT).
//   * Tasten: X (links) Panel ein/aus, B (rechts) SERVO <-> PLAN,
//     linker Stick = gehen (nur VR), rechter Stick X = Linearachse (SERVO).
//   * Not-Aus: roter Button im Panel, beide Grips + beide Trigger zugleich.
//     Session-Ende, verdeckte Session oder Tracking-Verlust stoppen Servo.

import * as THREE from 'three';
import * as twin from './digital_twin.js';
import { estopLatched, motionAllowed, ros, rosHooks } from '../ros.js';
import { logMsg } from '../log.js';
import { lsGet, lsSet } from '../util.js';
import { emergencyStop, resetEmergencyStop } from '../safety.js';
import { approachObjectFromAbove, disabledCollisionObjects, setObjectCollision } from '../grasp.js';
import { playObjectSelectSound } from '../audio.js';

// ── Konstanten ──────────────────────────────────────────────────────────────
const VR_TOPIC = '/vr_teleop/controller_data';
const RIG_LS_KEY = 'robot_control_xr_rig_v1';
// Standard: Nutzer steht 65 cm hinter der Roboterbasis und schaut in +X,
// die Tischplatte (ROS z = 0) liegt 75 cm ueber dem Boden.
const RIG_DEFAULT = { x: -0.65, y: 0.0, z: -0.75, yaw: 0.0 };
const WALK_SPEED = 0.8;              // m/s, linker Stick (nur VR)
const STICK_DEADZONE = 0.15;
const PANEL_W_M = 0.27;              // Panelbreite in der Brille [m]
const PANEL_REDRAW_MS = 200;         // Zustand der DOM-Buttons nachziehen

// Canvas-Layout des Panels [px]. Alles in festen Zeilen/Spalten mit Abstand -
// nichts ueberlappt, egal wie viele Eintraege ein Tab hat (siehe AGENTS.md).
const CW = 1024, CH = 1152, PAD = 24, GAP = 16;
const HEADER_H = 72, TAB_H = 96, ESTOP_H = 140;
const CONTENT_Y = PAD + HEADER_H + GAP + TAB_H + GAP;
const CONTENT_BOTTOM = CH - PAD - ESTOP_H - GAP;
const GRID_COLS = 4, BTN_H = 132, INFO_LINE_H = 40;

const COL = {
  bg: '#0b1120', panel: '#111827', btn: '#1a2335', btnHover: '#27344d',
  border: '#2c3a52', text: '#e2e8f0', mut: '#94a3b8', dim: '#64748b',
  cyan: '#38bdf8', green: '#10b981', orange: '#f59e0b', red: '#ef4444',
};

// Basis-Drehung XR -> ROS: XR +X (rechts) -> ROS -Y, XR +Y (oben) -> ROS +Z,
// XR +Z (hinten) -> ROS -X. Blickrichtung (-Z) zeigt damit bei yaw = 0 in +X.
const Q_BASE = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(
  new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1, 0, 0)));
const Z_AXIS = new THREE.Vector3(0, 0, 1);

// ── Zustand ─────────────────────────────────────────────────────────────────
let h = null;                   // { scene, camera, renderer, controls, gridHelper }
let session = null;
let xrKind = 'vr';              // 'vr' | 'ar'
let ctrlMode = 'servo';         // 'servo' | 'plan'
let rig = null, floorDisc = null;
let rigCal = loadRigCal();
let savedBackground = null, savedClearAlpha = 1;
const hands = { left: null, right: null };   // { ctrl, grip, source, prev }
let laser = null, reticle = null;
let panel = null, panelCanvas = null, panelCtx = null, panelTex = null;
let panelVisible = true;
let activeTab = 'moveit';
let hitRects = [];
let hoverKey = null;
let panelDirty = true, lastPanelDraw = 0;
let hoverObject = null;
let triggerConsumed = false;
let estopGestureArmed = true;
let servoGrip = false, servoIndex = false, lastServoSent = false;
let planDrag = null;            // { gizmo:{position,quaternion}, ctrlPos, ctrlQuat }
let lastFrameT = 0;
let vrTopic = null;
let flashText = '', flashUntil = 0;

const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _ray = new THREE.Raycaster();

// ── Rig / Kalibrierung ──────────────────────────────────────────────────────
function loadRigCal() {
  let st = null;
  try { st = JSON.parse(lsGet(RIG_LS_KEY) || 'null'); } catch (e) { st = null; }
  const pick = (o) => ({ ...RIG_DEFAULT, ...(o && typeof o === 'object' ? o : {}) });
  return { vr: pick(st && st.vr), ar: pick(st && st.ar) };
}

function saveRigCal() {
  lsSet(RIG_LS_KEY, JSON.stringify(rigCal));
  flash('Kalibrierung gespeichert');
}

function applyRig() {
  if (!rig) return;
  const c = rigCal[xrKind];
  rig.position.set(c.x, c.y, c.z);
  rig.quaternion.setFromAxisAngle(Z_AXIS, c.yaw).multiply(Q_BASE);
  rig.updateMatrixWorld(true);
  panelDirty = true;
}

// Den virtuellen Roboter relativ zum Nutzer verschieben/drehen. Das Rig
// bewegt sich dafuer entgegengesetzt; die Drehung laeuft um die Roboterbasis.
function nudgeRobot(dx, dy, dz, dyawDeg) {
  const c = rigCal[xrKind];
  c.x -= dx; c.y -= dy; c.z -= dz;
  if (dyawDeg) {
    const a = -THREE.MathUtils.degToRad(dyawDeg);
    const x = c.x * Math.cos(a) - c.y * Math.sin(a);
    const y = c.x * Math.sin(a) + c.y * Math.cos(a);
    c.x = x; c.y = y; c.yaw += a;
  }
  applyRig();
}

// Kalibrierung: rechten Controller auf die Roboterbasis legen (nach vorn in
// Roboter-+X zeigend) und ausloesen. Die Basis landet dann genau dort.
// (Vorbereitet fuer Passthrough-AR, am echten Roboter noch nicht getestet.)
function placeBaseAtController() {
  const r = hands.right;
  if (!r || !r.grip.visible) { flash('Rechter Controller nicht getrackt'); return; }
  const local = r.grip.position.clone();                         // XR-Raum
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(r.grip.quaternion).applyQuaternion(Q_BASE);
  const yaw = -Math.atan2(fwd.y, fwd.x);
  const qRig = new THREE.Quaternion().setFromAxisAngle(Z_AXIS, yaw).multiply(Q_BASE);
  const p = local.applyQuaternion(qRig);
  const c = rigCal[xrKind];
  c.x = -p.x; c.y = -p.y; c.z = -p.z; c.yaw = yaw;
  applyRig();
  flash('Basis auf Controller gesetzt');
}

function resetRig() {
  rigCal[xrKind] = { ...RIG_DEFAULT };
  applyRig();
  flash('Standort zurueckgesetzt');
}

// ── Controller ──────────────────────────────────────────────────────────────
function makeControllerMesh(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.022, 0.11, 16),
    new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.2, roughness: 0.6 }));
  body.rotation.x = Math.PI / 2;
  body.position.z = 0.03;
  g.add(body);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.035, 0.005, 8, 32),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 }));
  ring.position.z = -0.03;
  g.add(ring);
  return g;
}

function setupControllers() {
  const r = h.renderer;
  for (let i = 0; i < 2; i++) {
    const ctrl = r.xr.getController(i);
    const grip = r.xr.getControllerGrip(i);
    rig.add(ctrl);
    rig.add(grip);
    const entry = { ctrl, grip, source: null, prev: {}, mesh: null };
    ctrl.addEventListener('connected', (e) => {
      entry.source = e.data;
      const hand = e.data && e.data.handedness === 'left' ? 'left' : 'right';
      entry.hand = hand;
      hands[hand] = entry;
      if (!entry.mesh) {
        entry.mesh = makeControllerMesh(hand === 'left' ? 0x10b981 : 0x38bdf8);
        grip.add(entry.mesh);
      }
      if (hand === 'left') attachPanel(grip);
      if (hand === 'right') attachLaser(ctrl);
      panelDirty = true;
    });
    ctrl.addEventListener('disconnected', () => {
      if (entry.hand && hands[entry.hand] === entry) hands[entry.hand] = null;
      if (entry.hand === 'right') stopMotion('Controller getrennt');
      entry.source = null;
      panelDirty = true;
    });
  }
}

function attachLaser(ctrl) {
  if (!laser) {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
    laser = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 }));
    laser.scale.z = 1.5;
  }
  if (!reticle) {
    reticle = new THREE.Mesh(
      new THREE.SphereGeometry(0.006, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, depthTest: false }));
    reticle.renderOrder = 1000;
    reticle.visible = false;
    h.scene.add(reticle);
  }
  ctrl.add(laser);
}

function pulse(hand, strength = 0.4, ms = 25) {
  const e = hands[hand];
  const act = e && e.source && e.source.gamepad && e.source.gamepad.hapticActuators;
  if (act && act[0] && typeof act[0].pulse === 'function') {
    try { act[0].pulse(strength, ms); } catch (err) { /* nicht unterstuetzt */ }
  }
}

function readPad(entry) {
  const gp = entry && entry.source && entry.source.gamepad;
  if (!gp) return null;
  const b = (i) => Boolean(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5));
  return {
    trigger: b(0), grip: b(1), btnA: b(4), btnB: b(5),
    sx: gp.axes.length >= 4 ? gp.axes[2] : (gp.axes[0] || 0),
    sy: gp.axes.length >= 4 ? gp.axes[3] : (gp.axes[1] || 0),
  };
}

function worldPose(obj) {
  obj.updateMatrixWorld(true);
  const pos = new THREE.Vector3(), quat = new THREE.Quaternion();
  obj.matrixWorld.decompose(pos, quat, _s);
  return { pos, quat };
}

// ── Servo-Teleop (gleiches Format wie controller_reader.html) ───────────────
// Der Teleop-Node rechnet: ROS vx = -dz, vy = -dx, vz = dy. Die Position geht
// deshalb aus dem ROS-Frame zurueck in diese Konvention. So folgt der Roboter
// der Hand immer in den Achsen, die man in der Brille sieht - egal wie das
// Rig steht.
function publishController(pos, quat, grip, index, thumbX) {
  if (!ros) return;
  if (!vrTopic) vrTopic = new ROSLIB.Topic({ ros, name: VR_TOPIC, messageType: 'std_msgs/String' });
  const p = pos || new THREE.Vector3();
  const q = quat || new THREE.Quaternion();
  vrTopic.publish(new ROSLIB.Message({
    data: JSON.stringify({
      position: { x: -p.y, y: p.z, z: -p.x },
      orientation: { x: q.x, y: q.y, z: q.z, w: q.w },
      buttons: { grip, index, a: false, b: false },
      axes: { x: thumbX },
      source: 'robot_control_ui_xr',
    }),
  }));
}

// Sofort-Stopp: Grip/Trigger los melden (der Node schickt dann einen
// Null-Twist) und einen laufenden Ghost-Drag ohne Planung abbrechen.
function stopMotion(reason) {
  if (servoGrip || servoIndex || lastServoSent) {
    publishController(null, null, false, false, 0);
    if (reason) logMsg('VR', `⏹ Servo stop: ${reason}`, 'warn');
  }
  servoGrip = false;
  servoIndex = false;
  lastServoSent = false;
  if (planDrag) {
    twin.cancelGizmoExternalDrag();
    planDrag = null;
  }
}

function fireEstop(source) {
  stopMotion(null);
  emergencyStop();
  pulse('left', 1.0, 250);
  pulse('right', 1.0, 250);
  flash(`NOT-AUS (${source})`);
  logMsg('VR', `🚨 Emergency stop from VR (${source})`, 'err');
}

function setCtrlMode(mode) {
  if (mode === ctrlMode) return;
  stopMotion(null);
  ctrlMode = mode;
  if (mode === 'plan' && !twin.isTCPGizmoActive()) twin.toggleTCPGizmo(true);
  flash(mode === 'plan' ? 'Modus PLAN: Grip zieht den Ghost' : 'Modus SERVO: Grip steuert den Roboter');
  pulse('right', 0.6, 60);
  panelDirty = true;
}

// ── Panel: Tabs und Icons ───────────────────────────────────────────────────
function attachPanel(grip) {
  if (!panel) {
    if (!panelCanvas) {
      panelCanvas = document.createElement('canvas');
      panelCanvas.width = CW;
      panelCanvas.height = CH;
      panelCtx = panelCanvas.getContext('2d');
    }
    panelTex = new THREE.CanvasTexture(panelCanvas);
    panelTex.colorSpace = THREE.SRGBColorSpace;
    panelTex.anisotropy = 4;
    const geo = new THREE.PlaneGeometry(PANEL_W_M, PANEL_W_M * CH / CW);
    panel = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: panelTex, transparent: true, toneMapped: false }));
    // Ueber dem linken Controller, zum Gesicht geneigt.
    panel.position.set(0.0, 0.16, -0.05);
    panel.rotation.x = -0.75;
    panel.renderOrder = 900;
  }
  grip.add(panel);
  panel.visible = panelVisible;
  panelDirty = true;
}

const glyphCache = new Map();
function glyphFor(faName) {
  if (glyphCache.has(faName)) return glyphCache.get(faName);
  const i = document.createElement('i');
  i.className = `fa-solid ${faName}`;
  i.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
  document.body.appendChild(i);
  const g = glyphOfEl(i);
  i.remove();
  glyphCache.set(faName, g);
  return g;
}

function glyphOfEl(iEl) {
  if (!iEl) return '';
  const c = getComputedStyle(iEl, '::before').content || '';
  if (!c || c === 'none' || c === 'normal') return '';
  return c.replace(/^["']|["']$/g, '');
}

function shortLabel(text) {
  let t = String(text || '').replace(/\s+/g, ' ').trim();
  t = t.split(/ \(| \[| - /)[0];
  return t.length > 30 ? t.slice(0, 29) + '…' : t;
}

// Ein Panel-Eintrag, der einen echten Button der Seite spiegelt.
function domItem(el, label) {
  if (!el) return null;
  const cs = getComputedStyle(el);
  const isCheck = el.tagName === 'INPUT' && el.type === 'checkbox';
  const active = isCheck ? el.checked : (el.classList.contains('active') || el.getAttribute('aria-pressed') === 'true');
  return {
    key: el.id || `${el.dataset.action || ''}:${el.dataset.args || ''}:${label || ''}`,
    glyph: isCheck ? glyphFor(el.checked ? 'fa-square-check' : 'fa-square') : glyphOfEl(el.querySelector('i')),
    label: label || shortLabel(el.getAttribute('title') || el.textContent),
    color: isCheck ? (el.checked ? COL.cyan : COL.mut) : cs.color,
    active,
    disabled: el.disabled || parseFloat(cs.opacity) < 0.5,
    onClick: () => el.click(),
  };
}

function ownItem(key, fa, label, onClick, opts = {}) {
  return { key, glyph: glyphFor(fa), label, onClick, color: opts.color || COL.text, active: !!opts.active,
           disabled: !!opts.disabled, danger: !!opts.danger };
}

const q = (sel) => document.querySelector(sel);
const qa = (sel) => Array.from(document.querySelectorAll(sel));
const txt = (sel) => { const el = q(sel); return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; };

const TABS = [
  { id: 'view',   fa: 'fa-cube',        label: 'VIEW' },
  { id: 'scene',  fa: 'fa-layer-group', label: 'SCENE' },
  { id: 'motion', fa: 'fa-bolt',        label: 'MOTION' },
  { id: 'moveit', fa: 'fa-route',       label: 'MOVEIT' },
  { id: 'object', fa: 'fa-bullseye',    label: 'OBJEKT' },
  { id: 'xr',     fa: 'fa-vr-cardboard', label: 'VR' },
];

function tabContent(id) {
  const info = [];
  let items = [];
  if (id === 'view') {
    // Kamera-Ansichten (Reset/Top) steuert in der Brille der Kopf - weggelassen.
    items = qa('.twin-toolbar button')
      .filter(b => !['resetDigitalTwinView', 'setDigitalTwinTopView', 'enterTwinXR'].includes(b.dataset.action))
      .map(b => domItem(b));
  } else if (id === 'scene') {
    items = qa('#hud-tab-scene .hud-tab-body button').map(b => domItem(b));
  } else if (id === 'motion') {
    info.push({ label: 'SPEED', value: txt('#speed-val') });
    info.push({ label: 'REACH', value: txt('#hud-manip-val') });
    info.push({ label: 'FLOOR', value: txt('#hud-floor-val') });
    info.push({ label: 'SERVO', value: txt('#moveit-badge') });
    items = qa('#hud-tab-motion .hud-tab-body button').map(b => domItem(b));
    items.push(domItem(q('#hud-tab-pose button[data-action="requestMotion"]'), 'Go (Pose)'));
    items.push(ownItem('speed-', 'fa-minus', 'Speed −', () => stepSpeed(-1)));
    items.push(ownItem('speed+', 'fa-plus', 'Speed +', () => stepSpeed(1)));
    qa('[data-action="setGripper"]').forEach(b => items.push(domItem(b, `Greifer ${shortLabel(b.textContent)}`)));
  } else if (id === 'moveit') {
    const mp = q('#moveit-popup');
    const hidden = !mp || mp.classList.contains('mp-hidden');
    info.push({ label: 'PHASE', value: hidden ? '– (Popup zu)' : txt('#mp-phase') });
    const obj = txt('#mp-object-name');
    if (obj) info.push({ label: 'OBJEKT', value: obj });
    info.push({ label: 'ZIEL', value: `X ${txt('#gizmo-hud-x')}  Y ${txt('#gizmo-hud-y')}  Z ${txt('#gizmo-hud-z')} mm   ${txt('#gizmo-hud-delta')}` });
    const detail = txt('#mp-detail');
    if (detail && !hidden) info.push({ label: 'INFO', value: detail });
    items = [
      domItem(q('#moveit-popup .mp-btn-exec'), 'Execute'),
      domItem(q('#moveit-popup .mp-btn-discard'), 'Discard'),
      domItem(q('#mp-btn-path-preview'), 'Ghost-Vorschau'),
      domItem(q('#chk-gizmo-auto-drop'), 'Auto-Move'),
      domItem(q('#btn-twin-gizmo-mode'), twin.getTCPGizmoMode() === 'rotate' ? 'Gizmo: Rotation' : 'Gizmo: Translation'),
      domItem(q('#btn-twin-gizmo-sync'), 'Gizmo → TCP'),
      domItem(q('#mp-btn-distance-line'), 'Distanzlinie'),
      domItem(q('#btn-twin-gizmo'), 'TCP-Gizmo'),
    ];
  } else if (id === 'object') {
    const sel = twin.getDigitalTwinSelectedGrasp();
    const infoSel = sel ? twin.getDetectedObjectInfo(sel) : null;
    info.push({ label: 'AUSWAHL', value: sel ? sel.replace(/_/g, ' ') : '– (Laser auf Greifkugel + Trigger)' });
    if (infoSel && infoSel.grasp) {
      info.push({ label: 'GREIFPUNKT', value: `X ${infoSel.grasp.x}  Y ${infoSel.grasp.y}  Z ${infoSel.grasp.z} mm` });
    }
    if (infoSel) {
      const off = infoSel.collisionName && disabledCollisionObjects.has(infoSel.collisionName);
      items.push(ownItem('obj-approach', 'fa-arrow-down', 'Approach von oben', () => approachObjectFromAbove(infoSel),
        { disabled: !infoSel.grasp, color: COL.cyan }));
      items.push(ownItem('obj-grasp', 'fa-hand-holding', 'Grasp (n. impl.)',
        () => logMsg('UI', 'ℹ️ Grasp function is not yet implemented.', 'info'), { color: COL.dim }));
      items.push(ownItem('obj-coll', off ? 'fa-shield-halved' : 'fa-shield',
        off ? 'Kollision an' : 'Kollision aus', () => setObjectCollision(infoSel, !!off),
        { disabled: !infoSel.collisionName, color: off ? COL.green : COL.orange }));
    }
    for (const o of twin.listDetectedObjects().slice(0, 8)) {
      items.push(ownItem(`obj:${o.name}`, 'fa-cube', o.name.replace(/_/g, ' '), () => selectObject(o.name),
        { active: o.name === sel, color: o.name === sel ? COL.red : COL.text }));
    }
  } else if (id === 'xr') {
    const c = rigCal[xrKind];
    info.push({ label: 'SESSION', value: xrKind === 'ar' ? 'Passthrough (AR, Vorbereitung)' : 'Voll-VR' });
    info.push({ label: 'RIG', value: `X ${c.x.toFixed(2)}  Y ${c.y.toFixed(2)}  Z ${c.z.toFixed(2)} m  Yaw ${THREE.MathUtils.radToDeg(c.yaw).toFixed(0)}°` });
    items = [
      ownItem('mode-servo', 'fa-gamepad', 'SERVO', () => setCtrlMode('servo'), { active: ctrlMode === 'servo', color: ctrlMode === 'servo' ? COL.cyan : COL.mut }),
      ownItem('mode-plan', 'fa-ghost', 'PLAN', () => setCtrlMode('plan'), { active: ctrlMode === 'plan', color: ctrlMode === 'plan' ? COL.orange : COL.mut }),
      ownItem('rig-place', 'fa-anchor', 'Basis = Controller', placeBaseAtController, { color: COL.cyan }),
      ownItem('rig-reset', 'fa-street-view', 'Standort reset', resetRig),
      ownItem('rig-x+', 'fa-arrow-up', 'Robot X +1 cm', () => nudgeRobot(0.01, 0, 0, 0)),
      ownItem('rig-x-', 'fa-arrow-down', 'Robot X −1 cm', () => nudgeRobot(-0.01, 0, 0, 0)),
      ownItem('rig-y+', 'fa-arrow-left', 'Robot Y +1 cm', () => nudgeRobot(0, 0.01, 0, 0)),
      ownItem('rig-y-', 'fa-arrow-right', 'Robot Y −1 cm', () => nudgeRobot(0, -0.01, 0, 0)),
      ownItem('rig-z+', 'fa-angles-up', 'Robot Z +1 cm', () => nudgeRobot(0, 0, 0.01, 0)),
      ownItem('rig-z-', 'fa-angles-down', 'Robot Z −1 cm', () => nudgeRobot(0, 0, -0.01, 0)),
      ownItem('rig-yaw+', 'fa-rotate-left', 'Yaw +1°', () => nudgeRobot(0, 0, 0, 1)),
      ownItem('rig-yaw-', 'fa-rotate-right', 'Yaw −1°', () => nudgeRobot(0, 0, 0, -1)),
      ownItem('rig-save', 'fa-floppy-disk', 'Speichern', saveRigCal, { color: COL.green }),
      ownItem('xr-exit', 'fa-right-from-bracket', 'VR beenden', () => session && session.end(), { color: COL.red }),
    ];
  }
  return { info, items: items.filter(Boolean) };
}

function stepSpeed(delta) {
  const s = /** @type {HTMLInputElement|null} */ (q('#speed-slider'));
  if (!s) return;
  const v = Math.max(Number(s.min), Math.min(Number(s.max), Number(s.value) + delta));
  if (String(v) === s.value) return;
  s.value = String(v);
  s.dispatchEvent(new Event('input', { bubbles: true }));
}

function selectObject(name) {
  if (!name) return;
  twin.selectDetectedObject(name);
  playObjectSelectSound();
  activeTab = 'object';
  panelDirty = true;
}

function flash(text) {
  flashText = text;
  flashUntil = performance.now() + 2500;
  panelDirty = true;
}

function roundRect(ctx, x, y, w, hgt, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + hgt, r);
  ctx.arcTo(x + w, y + hgt, x, y + hgt, r);
  ctx.arcTo(x, y + hgt, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

// Zwei Zeilen, an Leerzeichen umbrochen, Rest mit Auslassungszeichen.
function wrap2(ctx, text, maxW) {
  const words = String(text).split(' ');
  let l1 = '';
  let i = 0;
  for (; i < words.length; i++) {
    const t = l1 ? `${l1} ${words[i]}` : words[i];
    if (ctx.measureText(t).width > maxW && l1) break;
    l1 = t;
  }
  const rest = words.slice(i).join(' ');
  return rest ? [fitText(ctx, l1, maxW), fitText(ctx, rest, maxW)] : [fitText(ctx, l1, maxW)];
}

const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
const FA_FONT = '"Font Awesome 6 Free"';

function pill(ctx, xRight, y, text, color) {
  ctx.font = `700 24px ${FONT}`;
  const w = ctx.measureText(text).width + 28;
  const x = xRight - w;
  roundRect(ctx, x, y, w, 44, 22);
  ctx.fillStyle = color + '33';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + 23);
  return x - 12;   // naechste Pille links davon, mit Abstand
}

function drawButton(ctx, r, item, hovered) {
  roundRect(ctx, r.x, r.y, r.w, r.h, 16);
  ctx.fillStyle = item.danger ? '#7f1d1d' : (hovered && !item.disabled ? COL.btnHover : COL.btn);
  ctx.fill();
  ctx.lineWidth = item.active ? 4 : 2;
  ctx.strokeStyle = item.active ? (item.color || COL.cyan) : (hovered ? COL.cyan : COL.border);
  ctx.stroke();
  ctx.globalAlpha = item.disabled ? 0.35 : 1;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (item.glyph) {
    ctx.font = `900 46px ${FA_FONT}`;
    ctx.fillStyle = item.color || COL.text;
    ctx.fillText(item.glyph, r.x + r.w / 2, r.y + 44);
  }
  ctx.font = `600 22px ${FONT}`;
  ctx.fillStyle = COL.text;
  const lines = wrap2(ctx, item.label, r.w - 20);
  lines.forEach((ln, i) => ctx.fillText(ln, r.x + r.w / 2, r.y + (lines.length === 1 ? 98 : 88 + i * 26)));
  ctx.globalAlpha = 1;
}

function drawPanel() {
  const ctx = panelCtx;
  if (!ctx) return;
  hitRects = [];
  ctx.clearRect(0, 0, CW, CH);
  roundRect(ctx, 0, 0, CW, CH, 36);
  ctx.fillStyle = 'rgba(11, 17, 32, 0.94)';
  ctx.fill();
  ctx.strokeStyle = COL.border;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Kopfzeile: Titel links, Status-Pillen rechts (von rechts nach links gesetzt).
  const warnBanner = q('#twin-warning-banner');
  const warn = warnBanner && !warnBanner.classList.contains('banner-hidden') ? txt('#twin-warning-text') : '';
  const flashing = flashText && performance.now() < flashUntil;
  let xr = CW - PAD;
  xr = pill(ctx, xr, PAD + 14, ros && ros.isConnected ? 'ROS' : 'ROS OFF', ros && ros.isConnected ? COL.green : COL.red);
  xr = pill(ctx, xr, PAD + 14, ctrlMode === 'plan' ? 'PLAN' : 'SERVO', ctrlMode === 'plan' ? COL.orange : COL.cyan);
  if (estopLatched) xr = pill(ctx, xr, PAD + 14, 'E-STOP', COL.red);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `700 28px ${FONT}`;
  ctx.fillStyle = warn ? COL.red : (flashing ? COL.orange : COL.cyan);
  const title = warn ? `⚠ ${warn}` : (flashing ? flashText : `XR · ${xrKind === 'ar' ? 'PASSTHROUGH' : 'VR'} VIEWPORT`);
  ctx.fillText(fitText(ctx, title, xr - PAD - 8), PAD + 8, PAD + 36);

  // Tabs
  const tabW = (CW - 2 * PAD - (TABS.length - 1) * GAP) / TABS.length;
  const tabY = PAD + HEADER_H + GAP;
  TABS.forEach((t, i) => {
    const r = { x: PAD + i * (tabW + GAP), y: tabY, w: tabW, h: TAB_H };
    const key = `tab:${t.id}`;
    const on = activeTab === t.id;
    roundRect(ctx, r.x, r.y, r.w, r.h, 14);
    ctx.fillStyle = on ? '#0c4a6e' : (hoverKey === key ? COL.btnHover : COL.panel);
    ctx.fill();
    ctx.strokeStyle = on ? COL.cyan : COL.border;
    ctx.lineWidth = on ? 3 : 2;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 34px ${FA_FONT}`;
    ctx.fillStyle = on ? COL.cyan : COL.mut;
    ctx.fillText(glyphFor(t.fa), r.x + r.w / 2, r.y + 34);
    ctx.font = `700 20px ${FONT}`;
    ctx.fillStyle = on ? COL.text : COL.mut;
    ctx.fillText(t.label, r.x + r.w / 2, r.y + 74);
    hitRects.push({ ...r, key, onClick: () => { activeTab = t.id; panelDirty = true; } });
  });

  // Inhalt: Infozeilen, darunter das Button-Raster
  const { info, items } = tabContent(activeTab);
  let y = CONTENT_Y;
  ctx.textBaseline = 'middle';
  for (const line of info) {
    ctx.textAlign = 'left';
    ctx.font = `700 20px ${FONT}`;
    ctx.fillStyle = COL.dim;
    ctx.fillText(line.label, PAD + 8, y + INFO_LINE_H / 2);
    ctx.font = `500 24px ${FONT}`;
    ctx.fillStyle = COL.text;
    ctx.fillText(fitText(ctx, line.value || '–', CW - 2 * PAD - 180), PAD + 180, y + INFO_LINE_H / 2);
    y += INFO_LINE_H;
  }
  if (info.length) y += GAP;

  const btnW = (CW - 2 * PAD - (GRID_COLS - 1) * GAP) / GRID_COLS;
  const rowsFit = Math.max(0, Math.floor((CONTENT_BOTTOM - y + GAP) / (BTN_H + GAP)));
  const maxItems = rowsFit * GRID_COLS;
  items.slice(0, maxItems).forEach((it, i) => {
    const r = { x: PAD + (i % GRID_COLS) * (btnW + GAP), y: y + Math.floor(i / GRID_COLS) * (BTN_H + GAP), w: btnW, h: BTN_H };
    drawButton(ctx, r, it, hoverKey === it.key);
    if (!it.disabled) hitRects.push({ ...r, key: it.key, onClick: it.onClick });
  });
  if (items.length > maxItems) {
    ctx.textAlign = 'right';
    ctx.font = `500 20px ${FONT}`;
    ctx.fillStyle = COL.dim;
    ctx.fillText(`+${items.length - maxItems} weitere am Desktop`, CW - PAD, CONTENT_BOTTOM + 4);
  }

  // Not-Aus immer unten; ist er verriegelt, daneben Reset.
  const ey = CH - PAD - ESTOP_H;
  const resetW = estopLatched ? (CW - 2 * PAD - GAP) / 3 : 0;
  const estopR = { x: PAD, y: ey, w: CW - 2 * PAD - (resetW ? resetW + GAP : 0), h: ESTOP_H };
  roundRect(ctx, estopR.x, estopR.y, estopR.w, estopR.h, 22);
  ctx.fillStyle = hoverKey === 'estop' ? '#dc2626' : '#b91c1c';
  ctx.fill();
  ctx.strokeStyle = '#fecaca';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.font = `900 52px ${FA_FONT}`;
  ctx.fillText(glyphFor('fa-hand'), estopR.x + estopR.w / 2 - 150, ey + ESTOP_H / 2);
  ctx.font = `800 48px ${FONT}`;
  ctx.fillText('NOT-AUS', estopR.x + estopR.w / 2 + 40, ey + ESTOP_H / 2);
  hitRects.push({ ...estopR, key: 'estop', onClick: () => fireEstop('Panel') });
  if (resetW) {
    const rr = { x: CW - PAD - resetW, y: ey, w: resetW, h: ESTOP_H };
    drawButton(ctx, rr, { glyph: glyphFor('fa-rotate-left'), label: 'Reset', color: COL.orange, active: true }, hoverKey === 'estop-reset');
    hitRects.push({ ...rr, key: 'estop-reset', onClick: () => resetEmergencyStop() });
  }

  panelTex.needsUpdate = true;
  panelDirty = false;
  lastPanelDraw = performance.now();
}

function panelHitAt(uv) {
  const x = uv.x * CW, y = (1 - uv.y) * CH;
  return hitRects.find(r => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) || null;
}

// Panel ohne Brille zeichnen (Layout-Pruefung am Desktop / in Tests).
export function renderXRPanelPreview(tab = activeTab) {
  if (!panelCanvas) {
    panelCanvas = document.createElement('canvas');
    panelCanvas.width = CW;
    panelCanvas.height = CH;
    panelCtx = panelCanvas.getContext('2d');
    panelTex = { needsUpdate: false };
  }
  activeTab = tab;
  drawPanel();
  return panelCanvas;
}

// ── Frame-Schleife ──────────────────────────────────────────────────────────
function onXRFrame(time) {
  const dt = lastFrameT ? Math.min(0.1, (time - lastFrameT) / 1000) : 0;
  lastFrameT = time;
  rig.updateMatrixWorld(true);
  handleInput(dt);
  twin.runTwinFrameUpdates();
  if (panel && panel.visible && (panelDirty || performance.now() - lastPanelDraw > PANEL_REDRAW_MS)) drawPanel();
  h.renderer.render(h.scene, h.camera);
}

function handleInput(dt) {
  const L = hands.left, R = hands.right;
  const lp = readPad(L), rp = readPad(R);

  // Not-Aus-Geste: beide Grips + beide Trigger zugleich (Flanke).
  const gesture = lp && rp && lp.grip && lp.trigger && rp.grip && rp.trigger;
  if (gesture && estopGestureArmed) {
    estopGestureArmed = false;
    fireEstop('Geste');
  } else if (!gesture && !(lp && (lp.grip || lp.trigger)) && !(rp && (rp.grip || rp.trigger))) {
    estopGestureArmed = true;          // erst nach komplettem Loslassen wieder scharf
  }
  if (!estopGestureArmed) {
    if (reticle) reticle.visible = false;
    if (L) L.prev = lp || {};
    if (R) R.prev = rp || {};
    return;
  }

  // Linke Hand: X = Panel ein/aus, Stick = gehen (nur VR)
  if (L && lp) {
    if (lp.btnA && !L.prev.btnA) {
      panelVisible = !panelVisible;
      if (panel) panel.visible = panelVisible;
      pulse('left', 0.3, 20);
    }
    if (xrKind === 'vr' && (Math.abs(lp.sx) > STICK_DEADZONE || Math.abs(lp.sy) > STICK_DEADZONE)) walk(lp.sx, lp.sy, dt);
    L.prev = lp;
  }

  if (!R || !rp) {
    if (servoGrip || planDrag) stopMotion('rechter Controller ohne Daten');
    if (reticle) reticle.visible = false;
    return;
  }

  // B = SERVO <-> PLAN
  if (rp.btnB && !R.prev.btnB) setCtrlMode(ctrlMode === 'servo' ? 'plan' : 'servo');

  // Laser: Panel hat Vorrang, sonst Greifkugeln
  const ray = updateLaser(R);
  const trigEdge = rp.trigger && !R.prev.trigger;
  if (!rp.trigger) triggerConsumed = false;
  if (trigEdge && ray) {
    if (ray.panelHit) {
      triggerConsumed = true;
      pulse('right', 0.5, 30);
      ray.panelHit.onClick();
      panelDirty = true;
    } else if (ray.object && ray.object.name) {
      triggerConsumed = true;
      pulse('right', 0.6, 40);
      selectObject(ray.object.name);
      if (!panelVisible) { panelVisible = true; if (panel) panel.visible = true; }
    }
  }

  const tracked = R.grip.visible;
  if (ctrlMode === 'servo') {
    handleServo(R, rp, tracked);
  } else {
    handlePlan(R, rp, tracked);
  }
  R.prev = rp;
}

function walk(sx, sy, dt) {
  // Richtung aus der Blickrichtung (nur horizontal), im ROS-Frame
  const cam = h.renderer.xr.getCamera();
  cam.getWorldDirection(_v);
  _v.z = 0;
  if (_v.lengthSq() < 1e-6) return;
  _v.normalize();
  const right = new THREE.Vector3(_v.y, -_v.x, 0);
  const c = rigCal[xrKind];
  const step = WALK_SPEED * dt;
  c.x += (_v.x * -sy + right.x * sx) * step;
  c.y += (_v.y * -sy + right.y * sx) * step;
  applyRig();
}

function updateLaser(R) {
  if (!laser || !R.ctrl.visible) {
    if (reticle) reticle.visible = false;
    return null;
  }
  const { pos, quat } = worldPose(R.ctrl);
  _ray.ray.origin.copy(pos);
  _ray.ray.direction.set(0, 0, -1).applyQuaternion(quat).normalize();
  _ray.near = 0;
  _ray.far = 5;

  let panelHit = null, object = null, dist = 1.5;
  if (panel && panel.visible) {
    const hits = _ray.intersectObject(panel, false);
    if (hits.length && hits[0].uv) {
      panelHit = panelHitAt(hits[0].uv);
      dist = hits[0].distance;
    }
  }
  const pk = panelHit ? panelHit.key : null;
  if (pk !== hoverKey) {
    hoverKey = pk;
    panelDirty = true;
    if (pk) pulse('right', 0.15, 10);
  }
  if (!panelHit && !(panel && panel.visible && dist < 1.5)) {
    object = twin.pickDetectedObjectByRay(_ray.ray);
    if (object) dist = object.distance;
  }
  const ok = object ? object.name : null;
  if (ok !== (hoverObject && hoverObject.name)) {
    twin.setDetectedObjectHover(object);
    if (ok) pulse('right', 0.2, 15);
  }
  hoverObject = object;

  laser.scale.z = dist;
  laser.material.color.set(panelHit || object ? 0xf59e0b : 0x38bdf8);
  if (reticle) {
    reticle.visible = Boolean(panelHit || object || dist < 1.5);
    reticle.position.copy(_ray.ray.origin).addScaledVector(_ray.ray.direction, dist);
  }
  return { panelHit, object };
}

function handleServo(R, rp, tracked) {
  const allowed = motionAllowed('VR Servo', true);
  // Tracking weg oder Bewegung gesperrt -> Grip gilt als losgelassen.
  const grip = rp.grip && tracked && allowed;
  // Trigger nur fuer den Greifer, wenn Laser/Panel ihn nicht verbraucht hat.
  const index = rp.trigger && !triggerConsumed && allowed;
  const thumbX = allowed && Math.abs(rp.sx) > 0.05 ? rp.sx : 0;
  if (rp.grip && !tracked && servoGrip) logMsg('VR', '⏹ Tracking lost - servo stopped', 'warn');

  const active = grip || index || thumbX !== 0;
  if (active || lastServoSent) {
    const { pos, quat } = worldPose(R.grip);
    publishController(pos, quat, grip, index, thumbX);
  }
  lastServoSent = active;
  if (grip !== servoGrip) panelDirty = true;
  servoGrip = grip;
  servoIndex = index;
}

function handlePlan(R, rp, tracked) {
  if (!tracked) {
    if (planDrag) { twin.cancelGizmoExternalDrag(); planDrag = null; flash('Tracking verloren - Ghost-Drag abgebrochen'); }
    return;
  }
  const { pos, quat } = worldPose(R.grip);
  if (rp.grip && !R.prev.grip && !planDrag) {
    const start = twin.beginGizmoExternalDrag();
    if (!start) { flash('TCP-Gizmo ist aus (VIEW)'); return; }
    planDrag = { gizmo: start, ctrlPos: pos.clone(), ctrlQuat: quat.clone() };
    activeTab = 'moveit';
    panelDirty = true;
    pulse('right', 0.4, 30);
  } else if (rp.grip && planDrag) {
    const p = planDrag.gizmo.position.clone().add(_v.copy(pos).sub(planDrag.ctrlPos));
    let qt = null;
    if (twin.getTCPGizmoMode() === 'rotate') {
      qt = quat.clone().multiply(_q.copy(planDrag.ctrlQuat).invert()).multiply(planDrag.gizmo.quaternion);
    }
    twin.setGizmoTargetWorldPose(p, qt);
  } else if (!rp.grip && planDrag) {
    planDrag = null;
    twin.endGizmoExternalDrag();     // Ghost-Modus: plant sofort; sonst Popup
    pulse('right', 0.5, 40);
    panelDirty = true;
  }
}

// ── Session ─────────────────────────────────────────────────────────────────
function onSessionEnd() {
  stopMotion('XR-Session beendet');
  const r = h.renderer;
  r.setAnimationLoop(null);
  if (h.camera.parent === rig) rig.remove(h.camera);
  if (reticle) reticle.visible = false;
  twin.setDetectedObjectHover(null);
  hoverObject = null;
  if (xrKind === 'ar') {
    h.scene.background = savedBackground;
    r.setClearAlpha(savedClearAlpha);
  }
  if (floorDisc) floorDisc.visible = false;
  if (h.controls) h.controls.enabled = true;
  session = null;
  twin.restoreTwinViewAfterXR();
  logMsg('VR', 'XR session ended', 'info');
}

function onVisibilityChange() {
  // Quest-Systemmenue o. ae.: Session verdeckt -> keine Bewegung
  if (session && session.visibilityState !== 'visible') stopMotion('Session verdeckt');
}

export function enterTwinXR(kind = 'vr') {
  h = twin.getTwinXRHandles();
  if (!h) { logMsg('VR', '❌ Digital Twin not ready', 'err'); return; }
  if (session) return;
  if (!navigator.xr) { logMsg('VR', '❌ WebXR not available - open https://<host>:8443/ in the Quest browser', 'err'); return; }
  const mode = kind === 'ar' ? 'immersive-ar' : 'immersive-vr';
  // requestSession muss direkt im Klick passieren (User-Aktivierung).
  navigator.xr.requestSession(mode, { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] })
    .then(async (s) => {
      session = s;
      xrKind = kind === 'ar' ? 'ar' : 'vr';
      const r = h.renderer;
      // Rig und Controller VOR setSession anlegen - sonst koennen die
      // 'connected'-Ereignisse der Controller verloren gehen.
      if (!rig) {
        rig = new THREE.Group();
        rig.name = 'xr_rig';
        h.scene.add(rig);
        setupControllers();
        // Boden unter dem Nutzer (nur VR) - Orientierung im leeren Raum.
        floorDisc = new THREE.Mesh(
          new THREE.CircleGeometry(2.5, 64),
          new THREE.MeshBasicMaterial({ color: 0x111827, transparent: true, opacity: 0.85 }));
        floorDisc.rotation.x = -Math.PI / 2;
        floorDisc.position.y = -0.002;
        rig.add(floorDisc);
      }
      applyRig();
      r.xr.setReferenceSpaceType('local-floor');
      await r.xr.setSession(s);
      floorDisc.visible = xrKind === 'vr';
      rig.add(h.camera);
      if (h.controls) h.controls.enabled = false;
      if (xrKind === 'ar') {
        savedBackground = h.scene.background;
        savedClearAlpha = r.getClearAlpha();
        h.scene.background = null;
        r.setClearAlpha(0);
      }
      if (document.fonts) document.fonts.load(`900 46px ${FA_FONT}`).then(() => { panelDirty = true; }).catch(() => {});
      s.addEventListener('end', onSessionEnd, { once: true });
      s.addEventListener('visibilitychange', onVisibilityChange);
      lastFrameT = 0;
      panelDirty = true;
      r.setAnimationLoop(onXRFrame);
      logMsg('VR', `🥽 ${xrKind === 'ar' ? 'Passthrough (AR)' : 'VR'} session started - X: panel, B: SERVO/PLAN, both grips + triggers: E-STOP`, 'info');
    })
    .catch((e) => {
      logMsg('VR', `❌ XR session failed: ${e && e.message ? e.message : e}`, 'err');
      if (session) { try { session.end(); } catch (err) { /* schon beendet */ } }
      session = null;
    });
}

// Not-Aus aus anderer Quelle (Desktop, Leertaste, Node) -> auch hier stoppen.
rosHooks.onEstop.push((latched) => {
  if (latched) stopMotion('E-Stop latched');
  panelDirty = true;
});
rosHooks.onConnectionLost.push(() => stopMotion('rosbridge getrennt'));

// VR-Buttons im Viewport-Header nur zeigen, wenn die Brille sie kann.
function initXRButtons() {
  if (!navigator.xr || !window.isSecureContext) return;
  [['btn-twin-xr-vr', 'immersive-vr'], ['btn-twin-xr-ar', 'immersive-ar']].forEach(([id, mode]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    navigator.xr.isSessionSupported(mode).then((ok) => { btn.style.display = ok ? '' : 'none'; }).catch(() => {});
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initXRButtons);
else initXRButtons();
