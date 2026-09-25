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
//   * HUD (xr_hud.js): die Overlays des Desktop-Viewports am Sichtrand in
//     derselben Anordnung - Toolbar, MoveIt, MOTION, SCENE, Not-Aus,
//     TELEMETRY, POSE, SPEED. Standardmaessig an, Y (links) blendet es aus.
//   * Ansicht VR <-> Passthrough ohne die Session zu verlassen: kann die
//     Brille immersive-ar, laeuft jede Session so. In der VR-Ansicht deckt
//     eine blickdichte Kugel um den Nutzer die Kamera komplett ab (three.js
//     erzwingt in AR-Sessions einen transparenten Hintergrund).
//   * Linker Controller: Handgelenk-Panel mit allen Tabs (auch OBJEKT und
//     VR-Kalibrierung). Die Eintraege spiegeln die echten DOM-Buttons
//     (Zustand, Farbe, Klick) - dieselbe Logik wie auf dem Desktop. Der
//     VR-Tab ist in beschriftete Sektionen gegliedert.
//   * Nozzle-Kamera (VR-Tab, xr_nozzle_cam.js): das Rig haengt an der Kamera
//     am Endeffektor, die Sicht folgt dem Roboter. Gehen/Fliegen sind dann
//     aus; Servo und Ghost-Drag rechnen im Rig vom Beginn des Griffs.
//   * Rechter Controller: Laser (Panel bedienen, Greifkugel waehlen).
//     Trigger auf Kopfzeile/Griff einer HUD-Flaeche halten und ziehen =
//     Flaeche verschieben; +/- gehalten = Wert laeuft weiter.
//     Modus SERVO: Grip = MoveIt Servo (wie controller_reader.html),
//     Trigger = Greifer.  Modus PLAN: Laser auf Pfeil/Ebene/Ring des
//     TCP-Gizmos + Trigger halten zieht es wie die Maus am Desktop; Grip
//     zieht den Ghost frei mit der Hand. Loslassen plant wie am Desktop;
//     Execute/Discard im MoveIt-Popup des HUD (sieht aus wie am Desktop,
//     xr_moveit.js) oder im Panel.
//   * Tasten: X (links) Handgelenk-Panel ein/aus, Y (links) HUD ein/aus,
//     A (rechts) HUD vor den Blick holen (Nozzle-Kamera: auch den Blick
//     zentrieren), B (rechts) SERVO <-> PLAN,
//     linker Stick = gehen (nur VR), rechter Stick ohne Grip = um den
//     Roboter fliegen (nur VR), rechter Stick X mit Grip = Linearachse (SERVO).
//   * Tastenhilfe (xr_controls.js): schaut man auf einen Controller, zeigt
//     eine Karte daneben seine aktuelle Belegung, gedrueckte Tasten leuchten.
//     Vollstaendig mit beiden Modi im Panel-Tab TASTEN; an/aus dort und im
//     VR-Tab.
//   * Not-Aus: roter Button im Panel, beide Grips + beide Trigger zugleich.
//     Session-Ende, verdeckte Session oder Tracking-Verlust stoppen Servo.
//   * SERVO <-> PLAN wird angesagt, in der Brille und in jeder offenen
//     Desktop-UI (announceCtrlMode, Topic /ui/vr_ctrl_mode).
//   * Sounds wie am Desktop: audio.js laeuft auf derselben Seite (Ansagen,
//     Fehler, Bewegungsgeraeusch, Objekt-Klick, Sound-Schalter in der HUD-
//     Toolbar). Button-Klicks im Panel/HUD: siehe clickPanelHit().

import * as THREE from 'three';
import * as twin from './digital_twin.js';
import { estopLatched, motionAllowed, ros, rosHooks, createSrv } from '../ros.js';
import { SERVICES } from '../config.js';
import { logMsg } from '../log.js';
import { lsGet, lsSet } from '../util.js';
import { emergencyStop, resetEmergencyStop } from '../safety.js';
import { approachObjectFromAbove, disabledCollisionObjects, setObjectCollision } from '../grasp.js';
import { announceCtrlMode, playButtonClick, playObjectSelectSound } from '../audio.js';
import {
  COL, GROUP, groupColor, FONT, FA_FONT, XR_ORDER, domItem, ownItem, glyphFor, q, qa, txt, stepSpeed,
  GRIPPER_LABELS, poseLabel,
  roundRect, fitText, drawButton, pill, drawInfoLine, rgba, glass, GLASS, estopFill,
  moveitActionsVisible, moveitTargetLine, moveitProgressLines,
} from './xr_ui.js';
import {
  createHud, hudOnSessionStart, hudOnSessionEnd, toggleHud, isHudEnabled, hudRecenter,
  markHudDirty, setHudHover, hudPick, updateHud,
  hudDragBegin, hudDragMove, hudDragEnd, hudDragCancel, hudResetLayout,
} from './xr_hud.js';
import { publishMirrorEnd, publishMirrorFrame } from './xr_mirror_send.js';
import {
  TILT_DEFAULT_DEG, isNozzleCamActive, isNozzleCamAvailable, setNozzleCam, recenterNozzleCam,
  getNozzleTiltDeg, stepNozzleTilt, setNozzleTilt, updateNozzleCam,
} from './xr_nozzle_cam.js';
import {
  HAND_COL, ROW_H, ROW_GAP, createControlHints, controlHintsOnSessionEnd, updateControlHints,
  isControlHintsEnabled, toggleControlHints, legendRows, drawLegendRow, drawHandHead, drawGroupLegend,
} from './xr_controls.js';

// ── Konstanten ──────────────────────────────────────────────────────────────
const VR_TOPIC = '/vr_teleop/controller_data';
const RIG_LS_KEY = 'robot_control_xr_rig_v1';
// Standard: Nutzer steht 65 cm hinter der Roboterbasis und schaut in +X,
// die Tischplatte (ROS z = 0) liegt 75 cm ueber dem Boden.
const RIG_DEFAULT = { x: -0.65, y: 0.0, z: -0.75, yaw: 0.0 };
const WALK_SPEED = 0.8;              // m/s, linker Stick (nur VR)
const ORBIT_SPEED = Math.PI / 3;     // rad/s, rechter Stick X ohne Grip (nur VR)
const FLY_SPEED = 0.6;               // m/s, rechter Stick Y ohne Grip (nur VR)
const RIG_Z_MIN = -2.5, RIG_Z_MAX = 2.0;   // Flughoehe des Rigs im ROS-Frame [m]
const STICK_DEADZONE = 0.15;
const PANEL_W_M = 0.27;              // Panelbreite in der Brille [m]
const PANEL_REDRAW_MS = 200;         // Zustand der DOM-Buttons nachziehen
const DRAG_START_RAD = THREE.MathUtils.degToRad(2.5);   // so weit schwenken = Ziehen statt Klick
const REPEAT_DELAY_MS = 450;         // +/- gehalten: erste Wiederholung
const REPEAT_MS_START = 160, REPEAT_MS_MIN = 50;        // danach immer schneller

// Canvas-Layout des Panels [px]. Alles in festen Zeilen/Spalten mit Abstand -
// nichts ueberlappt, egal wie viele Eintraege ein Tab hat (siehe AGENTS.md).
const CW = 1024, CH = 1152, PAD = 24, GAP = 16;
const HEADER_H = 72, TAB_H = 96, ESTOP_H = 140;
const CONTENT_Y = PAD + HEADER_H + GAP + TAB_H + GAP;
const CONTENT_BOTTOM = CH - PAD - ESTOP_H - GAP;
const GRID_COLS = 4, BTN_H = 132, INFO_LINE_H = 40, INFO_LABEL_W = 180;
// Sektionen (VR-Tab): Beschriftung mit Trennlinie, darunter ein Raster.
const SEC_HEAD_H = 34, SEC_HEAD_GAP = 10, SEC_GAP = 18, SEC_BTN_H = 84, NOTE_LINE_H = 30;
// Tab TASTEN: Spaltenkopf je Hand, Modus-Karten, Schalter unten.
const KEYS_HEAD_H = 36, MODE_CARD_H = 156, MODE_LINE_H = 28, KEYS_TOGGLE_H = 72;

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
let rig = null, floorDisc = null, vrBackdrop = null;
let sessionMode = '';           // 'immersive-vr' | 'immersive-ar'
const xrSupport = { 'immersive-vr': false, 'immersive-ar': false };
let rigCal = loadRigCal();
let savedBackground = null, savedClearAlpha = 1;
const hands = { left: null, right: null };   // { ctrl, grip, source, prev }
let laser = null, reticle = null;
let panel = null, panelCanvas = null, panelCtx = null, panelTex = null;
let panelVisible = false;       // HUD zeigt das Wichtigste; X blendet das Panel ein
let activeTab = 'robot';
let hitRects = [];
let hoverKey = null;
let panelDirty = true, lastPanelDraw = 0;
let hoverObject = null;
let triggerConsumed = false;
let uiPress = null;             // gehaltener Trigger auf Panel/HUD, siehe updateUiPress()
let estopGestureArmed = true;
let servoGrip = false, servoIndex = false, lastServoSent = false, lastIdleSentAt = 0;
let planDrag = null;            // { gizmo:{position,quaternion}, ctrlPos, ctrlQuat }
let gizmoLaser = null;          // Trigger zieht einen Gizmo-Griff: { dist } (Laserlaenge)
let gizmoHoverAxis = null;
let lastFrameT = 0;
let vrTopic = null;
let flashText = '', flashUntil = 0;
const pads = { left: null, right: null };   // letzter readPad-Stand (Tastenhilfe)
let padSig = '';

const _v = new THREE.Vector3();
const _aim = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _ray = new THREE.Raycaster();
const ctrlFrame = new THREE.Matrix4();   // Bezugsrahmen Servo/Ghost-Drag (Nozzle-Kamera)

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
  // Das HUD liegt ohne Tiefentest ueber der Szene. Die Controller sollen
  // davor bleiben: transparent (Opazitaet 1) und nach dem HUD gezeichnet.
  g.traverse((o) => {
    if (o.material) o.material.transparent = true;
    o.renderOrder = XR_ORDER.controller;
  });
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
    laser.renderOrder = XR_ORDER.controller;   // ueber HUD und Panel
  }
  if (!reticle) {
    reticle = new THREE.Mesh(
      new THREE.SphereGeometry(0.006, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, depthTest: false }));
    reticle.renderOrder = XR_ORDER.reticle;
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

// Controller-Pose fuer Servo und Ghost-Drag. In der Nozzle-Ansicht haengt das
// Rig am Roboter: im Weltframe wanderte die Hand mit dem Roboter mit und zoege
// ihn weiter (Rueckkopplung). Dort gilt deshalb das Rig vom Beginn des Griffs,
// eingefroren bis zum Loslassen (holding).
function controlPose(obj, holding) {
  if (!isNozzleCamActive()) return worldPose(obj);
  if (!holding) ctrlFrame.copy(rig.matrixWorld);
  const pos = new THREE.Vector3(), quat = new THREE.Quaternion();
  _m.multiplyMatrices(ctrlFrame, obj.matrix).decompose(pos, quat, _s);
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
  cancelGizmoLaser();
}

// Laser-Drag am Gizmo ohne Planung beenden (Modus, Not-Aus, Tracking weg).
function cancelGizmoLaser() {
  if (!gizmoLaser) return;
  gizmoLaser = null;
  twin.gizmoLaserUp(true);
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
  if (mode === 'plan') {
    if (!twin.isTCPGizmoActive()) twin.toggleTCPGizmo(true);
    try {
      createSrv(SERVICES.setMovetoPreview, 'std_srvs/SetBool').callService(
        new ROSLIB.ServiceRequest({ data: true }),
        () => {}
      );
    } catch (_) {}
  }
  flash(mode === 'plan' ? 'Modus PLAN: Laser + Trigger auf das Gizmo, Grip zieht den Ghost' : 'Modus SERVO: Grip steuert den Roboter');
  announceCtrlMode(mode);         // Ansage hier und in jeder Desktop-UI
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
    // Ueber dem linken Controller, etwas vorgesetzt, zum Gesicht geneigt.
    panel.position.set(0.0, 0.20, -0.11);
    panel.rotation.x = -0.75;
    panel.renderOrder = XR_ORDER.panel;
  }
  grip.add(panel);
  panel.visible = panelVisible;
  panelDirty = true;
}

// Sechs Tabs, je einer Funktionsgruppe (Farbe siehe GROUP in xr_ui.js). Jede
// Funktion gibt es genau einmal - frueher standen Gizmo & Co. doppelt in VIEW
// und MOVEIT. Reihenfolge: was man am haeufigsten braucht, zuerst.
const TABS = [
  { id: 'robot',  fa: 'fa-robot',           label: 'ROBOTER', group: 'robot' },
  { id: 'plan',   fa: 'fa-route',           label: 'PLANEN',  group: 'plan' },
  { id: 'object', fa: 'fa-bullseye',        label: 'OBJEKTE', group: 'grip' },
  { id: 'scene',  fa: 'fa-layer-group',     label: 'SZENE',   group: 'scene' },
  { id: 'xr',     fa: 'fa-vr-cardboard',    label: 'VR',      group: 'xr' },
  { id: 'keys',   fa: 'fa-circle-question', label: 'TASTEN',  group: 'help' },
];

// Kurze deutsche Namen statt der langen Desktop-Tooltips. Der Zustand steht
// in der AN/AUS-Pille, nicht mehr im Namen ("Hide ..."/"Show ...").
const SCENE_TOGGLES = [
  ['#btn-twin-scene-objects', 'Szenen-Objekte'],
  ['#btn-twin-scene-plane', 'A4-Vorlage'],
  ['#btn-twin-scene-safety', 'Safety-Zone'],
  ['#btn-twin-scene-zedm', 'ZED-Stativ'],
  ['#btn-twin-detections', 'YOLO-Boxen'],
  ['#btn-twin-pointcloud', 'Punktwolke'],
  ['#btn-twin-distance-line', 'Distanzlinie'],
  ['#btn-twin-grid', 'Bodenraster'],
  ['#btn-twin-edges', 'CAD-Kanten'],
];

const toggleOpts = (on, group) => ({ active: on, group, color: on ? groupColor(group) : COL.mut });
const span = (item, n) => item && ({ ...item, span: n });

// Zelle mit [−] Name/Wert [+], z. B. fuer Speed oder die Achsen-Justage.
function stepperItem(key, label, sub, onMinus, onPlus, n = 2) {
  return {
    key, label, sub, stepper: true, span: n,
    minus: { key: `${key}:-`, onClick: onMinus },
    plus: { key: `${key}:+`, onClick: onPlus },
  };
}

// MoveIt-Kollisionsschalter: gruen = aktiv, rot = MoveIt ignoriert sie
// (Warnung), ohne Node INAKTIV.
function collisionItem(sel, label) {
  const el = q(sel);
  if (!el) return null;
  const on = el.classList.contains('coll-on');
  const off = el.classList.contains('coll-off');
  return domItem(el, label, { group: 'scene', toggle: true, on,
    state: on ? 'AN' : (off ? 'AUS' : 'INAKTIV'), warn: off });
}

// Pfad-Vorschau (Ghost): AN/AUS, ohne erkannten Node INAKTIV - klickbar
// bleibt sie trotzdem (toggleMoveToPreview schaltet dann ein).
function previewItem() {
  const el = q('#btn-twin-path-preview');
  if (!el) return null;
  const unknown = parseFloat(getComputedStyle(el).opacity) < 0.5 && !el.classList.contains('active');
  return domItem(el, 'Ghost-Vorschau', { group: 'plan', toggle: true,
    state: unknown ? 'INAKTIV' : undefined });
}

// Inhalt eines Tabs: Infozeilen oben, darunter Sektionen (drawSections).
function tabContent(id) {
  const info = [];
  const sections = [];
  if (id === 'robot') {
    const plan = ctrlMode === 'plan';
    info.push({ label: 'SERVO', value: txt('#moveit-badge') });
    info.push({ label: 'REACH', value: txt('#hud-manip-val') });
    sections.push({
      title: 'STEUERMODUS', fa: 'fa-gamepad', group: 'robot', cols: 2, btnH: 84,
      meta: plan ? 'Grip zieht den Ghost · B wechselt' : 'Grip führt den Roboter · B wechselt',
      items: [
        ownItem('mode-servo', 'fa-gamepad', 'SERVO', () => setCtrlMode('servo'), { active: !plan, group: 'robot', solid: true }),
        ownItem('mode-plan', 'fa-ghost', 'PLAN', () => setCtrlMode('plan'), { active: plan, group: 'plan', solid: true }),
      ],
    });
    const poses = qa('#hud-tab-motion .hud-tab-body button').map(b => domItem(b, poseLabel(b), { group: 'robot' }));
    poses.push(domItem(q('#hud-tab-pose button[data-action="requestMotion"]'), 'Pose anfahren', { group: 'robot' }));
    sections.push({ title: 'POSEN ANFAHREN', fa: 'fa-location-arrow', group: 'robot', cols: 4, btnH: 108, items: poses });
    sections.push({
      title: 'GESCHWINDIGKEIT', fa: 'fa-gauge', group: 'robot', cols: 4, btnH: 72,
      items: [stepperItem('speed', 'Speed', txt('#speed-val'), () => stepSpeed(-1), () => stepSpeed(1), 4)],
    });
    sections.push({
      title: 'GREIFER', fa: 'fa-hand', group: 'grip', cols: 3, btnH: 84,
      meta: ctrlMode === 'servo' ? 'Trigger rechts: auf/zu' : '',
      items: qa('[data-action="setGripper"]').map(b => domItem(b, GRIPPER_LABELS[b.id], { group: 'grip' })),
    });
  } else if (id === 'plan') {
    const mp = q('#moveit-popup');
    const hidden = !mp || mp.classList.contains('mp-hidden');
    info.push({ label: 'PHASE', value: hidden ? '– (keine Planung)' : txt('#mp-phase') });
    const obj = txt('#mp-object-name');
    if (obj) info.push({ label: 'OBJEKT', value: obj });
    info.push(moveitTargetLine());
    if (!hidden) info.push(...moveitProgressLines());
    const detail = txt('#mp-detail');
    if (detail && !hidden) info.push({ label: 'INFO', value: detail });
    // Execute/Discard nur, wenn sie auch am Desktop sichtbar sind.
    const actions = moveitActionsVisible();
    sections.push(actions ? {
      title: 'BAHN BESTÄTIGEN', fa: 'fa-circle-check', group: 'plan', cols: 2, btnH: 84,
      items: [
        domItem(q('#moveit-popup .mp-btn-exec'), 'Ausführen', { group: 'plan', color: COL.green }),
        domItem(q('#moveit-popup .mp-btn-discard'), 'Verwerfen', { group: 'plan', color: COL.red }),
      ],
    } : {
      title: 'BAHN', fa: 'fa-circle-check', group: 'plan', cols: 2, btnH: 84, items: [],
      notes: ctrlMode === 'plan'
        ? ['Grip halten: Ghost ziehen · loslassen: Bahn wird geplant.']
        : ['Modus PLAN (B rechts), dann mit Grip den Ghost ziehen.'],
    });
    const rot = twin.getTCPGizmoMode() === 'rotate';
    sections.push({
      title: 'GHOST & TCP-GIZMO', fa: 'fa-ghost', group: 'plan', cols: 2, btnH: 72,
      items: [
        domItem(q('#btn-twin-gizmo'), 'TCP-Gizmo', { group: 'plan', toggle: true }),
        previewItem(),
        domItem(q('#chk-gizmo-auto-drop'), 'Auto-Move', { group: 'plan', toggle: true }),
        domItem(q('#btn-twin-gizmo-mode'), rot ? 'Gizmo: Rotation' : 'Gizmo: Verschieben', { group: 'plan' }),
        span(domItem(q('#btn-twin-gizmo-sync'), 'Gizmo auf TCP zurücksetzen', { group: 'plan' }), 2),
      ],
    });
  } else if (id === 'object') {
    const sel = twin.getDigitalTwinSelectedGrasp();
    const infoSel = sel ? twin.getDetectedObjectInfo(sel) : null;
    info.push({ label: 'AUSWAHL', value: sel ? sel.replace(/_/g, ' ') : '– (Laser auf Greifkugel + Trigger)' });
    if (infoSel && infoSel.grasp) {
      info.push({ label: 'GREIFPUNKT', value: `X ${infoSel.grasp.x}  Y ${infoSel.grasp.y}  Z ${infoSel.grasp.z} mm` });
    }
    if (infoSel) {
      const off = infoSel.collisionName && disabledCollisionObjects.has(infoSel.collisionName);
      sections.push({
        title: 'AKTION', fa: 'fa-hand-holding', group: 'grip', cols: 3, btnH: 84,
        items: [
          ownItem('obj-approach', 'fa-arrow-down', 'Anfahren', () => approachObjectFromAbove(infoSel),
            { disabled: !infoSel.grasp, group: 'grip' }),
          ownItem('obj-grasp', 'fa-hand-holding', 'Greifen (n. impl.)',
            () => logMsg('UI', 'ℹ️ Grasp function is not yet implemented.', 'info'), { group: 'grip', color: COL.dim }),
          ownItem('obj-coll', off ? 'fa-shield-halved' : 'fa-shield', 'Kollision', () => setObjectCollision(infoSel, !!off),
            { disabled: !infoSel.collisionName, group: 'grip', toggle: true, on: !off, warn: !!off }),
        ],
      });
    }
    const objs = twin.listDetectedObjects().slice(0, 8);
    sections.push({
      title: 'ERKANNTE OBJEKTE', fa: 'fa-cubes', group: 'grip', cols: 2, btnH: 72,
      meta: objs.length ? 'Klick = auswählen' : '',
      items: objs.map(o => ownItem(`obj:${o.name}`, 'fa-cube', o.name.replace(/_/g, ' '), () => selectObject(o.name),
        { active: o.name === sel, group: 'grip' })),
      notes: objs.length ? undefined : ['Keine Objekte erkannt (YOLO / Szene).'],
    });
  } else if (id === 'scene') {
    sections.push({
      title: 'EINBLENDEN', fa: 'fa-eye', group: 'scene', cols: 2, btnH: 64,
      items: SCENE_TOGGLES.map(([sel, label]) => domItem(q(sel), label, { group: 'scene', toggle: true })),
    });
    sections.push({
      title: 'MOVEIT-KOLLISION', fa: 'fa-shield-halved', group: 'scene', cols: 2, btnH: 64,
      meta: 'AUS = MoveIt ignoriert sie',
      items: [collisionItem('#btn-moveit-coll-objects', 'Objekte'), collisionItem('#btn-moveit-coll-ground', 'Boden')],
    });
    sections.push({
      title: 'SYSTEM', fa: 'fa-sliders', group: 'help', cols: 2, btnH: 64,
      items: [
        domItem(q('#btn-sound-toggle'), 'Sound', { group: 'scene', toggle: true }),
        domItem(q('#btn-twin-safety-test'), 'Warnungen testen', { group: 'safety' }),
      ],
    });
  } else if (id === 'xr') {
    sections.push(...xrSections());
  }
  for (const sec of sections) sec.items = sec.items.filter(Boolean);
  return { info, sections };
}

// ── VR-Tab: Sektionen ───────────────────────────────────────────────────────
// Umschalter einer Gruppe schliessen sich gegenseitig aus (VR/Passthrough/
// Nozzle). Solange die Nozzle-Kamera laeuft, ersetzt ihre Einstellung den
// Block ROBOTER AUSRICHTEN - das Rig haengt dann am Roboter, eine
// Standort-Justage waere wirkungslos. SERVO/PLAN steht im Tab ROBOTER.
function xrSections() {
  const ar = xrKind === 'ar';
  const cam = isNozzleCamActive();
  const deg = (rad) => THREE.MathUtils.radToDeg(rad).toFixed(0);
  const c = rigCal[xrKind];
  const sections = [
    {
      title: 'ANSICHT', fa: 'fa-eye', group: 'xr', cols: 3, btnH: 108,
      meta: cam ? 'Sicht folgt dem Endeffektor' : (ar ? 'Kalibrierung ungetestet' : 'Freier Standort'),
      items: [
        ownItem('view-vr', 'fa-vr-cardboard', 'VR', () => setViewMode('vr'), toggleOpts(!ar && !cam, 'xr')),
        ownItem('view-ar', 'fa-glasses', 'Passthrough', () => setViewMode('ar'),
          { ...toggleOpts(ar, 'xr'), disabled: !canSwitchView() }),
        ownItem('view-nozzle', 'fa-video', 'Kamera Nozzle', toggleNozzleView, toggleOpts(cam, 'xr')),
      ],
    },
  ];
  if (cam) {
    const tilt = getNozzleTiltDeg();
    sections.push({
      title: 'KAMERA NOZZLE', fa: 'fa-video', group: 'xr', cols: 3, btnH: 72,
      meta: `Neigung ${tilt}° zur Düsenachse`,
      items: [
        stepperItem('nozzle-tilt', 'Neigung', `${tilt}°`, () => stepNozzleTilt(-5), () => stepNozzleTilt(5)),
        ownItem('nozzle-tilt-std', 'fa-rotate-left', `Standard ${TILT_DEFAULT_DEG}°`, () => setNozzleTilt(TILT_DEFAULT_DEG),
          { disabled: tilt === TILT_DEFAULT_DEG, group: 'xr' }),
      ],
      notes: [
        'Oben im Bild die Düse, darunter der Bereich unter dem Greifer.',
        'Gehen/Fliegen aus · Servo rechnet im Rig vom Griffbeginn.',
      ],
    });
  } else {
    sections.push({
      title: 'ROBOTER AUSRICHTEN', fa: 'fa-street-view', group: 'xr', cols: 4, btnH: 72,
      meta: `X ${c.x.toFixed(2)}  Y ${c.y.toFixed(2)}  Z ${c.z.toFixed(2)} m · ${deg(c.yaw)}°`,
      items: [
        stepperItem('rig-x', 'X', '1 cm', () => nudgeRobot(-0.01, 0, 0, 0), () => nudgeRobot(0.01, 0, 0, 0)),
        stepperItem('rig-y', 'Y', '1 cm', () => nudgeRobot(0, -0.01, 0, 0), () => nudgeRobot(0, 0.01, 0, 0)),
        stepperItem('rig-z', 'Z', '1 cm', () => nudgeRobot(0, 0, -0.01, 0), () => nudgeRobot(0, 0, 0.01, 0)),
        stepperItem('rig-yaw', 'Yaw', '1°', () => nudgeRobot(0, 0, 0, -1), () => nudgeRobot(0, 0, 0, 1)),
        span(ownItem('rig-place', 'fa-anchor', 'Basis = Controller', placeBaseAtController, { group: 'xr' }), 2),
        ownItem('rig-reset', 'fa-rotate-left', 'Reset', resetRig, { group: 'xr' }),
        ownItem('rig-save', 'fa-floppy-disk', 'Speichern', saveRigCal, { group: 'xr', color: COL.green }),
      ],
    });
  }
  sections.push({
    title: 'HUD & SESSION', fa: 'fa-table-cells-large', group: 'xr', cols: 3, btnH: 64, dock: 'bottom',
    meta: 'X Panel · Y HUD · A zentrieren',
    items: [
      ownItem('hud', 'fa-table-cells-large', 'HUD', toggleHudVisible, toggleOpts(isHudEnabled(), 'xr')),
      ownItem('hints', 'fa-circle-question', 'Tastenhilfe', toggleHints, toggleOpts(isControlHintsEnabled(), 'xr')),
      ownItem('recenter', 'fa-crosshairs', 'Zentrieren', recenterView, { group: 'xr' }),
      span(ownItem('hud-layout', 'fa-rotate-left', 'HUD-Layout zurücksetzen', resetHudLayout, { group: 'xr' }), 2),
      ownItem('xr-exit', 'fa-right-from-bracket', 'Beenden', () => session && session.end(), { group: 'xr', color: COL.red }),
    ],
  });
  return sections;
}

// Klick auf einen Panel- oder HUD-Eintrag. Eintraege, die einen echten
// DOM-Button klicken, bekommen den Klick-Sound wie am Desktop von
// uievents.js (inkl. Debounce - ein gesperrter Button bleibt stumm). Rein
// virtuelle Eintraege (Tabs, SERVO/PLAN, VR/Passthrough, VR-Tab, Speed ...)
// loesen kein DOM-Klick-Event aus und spielen den Sound deshalb hier.
function clickPanelHit(hit) {
  let viaDom = false;
  const onDomClick = () => { viaDom = true; };
  document.addEventListener('click', onDomClick, true);
  try {
    hit.onClick();
  } finally {
    document.removeEventListener('click', onDomClick, true);
  }
  if (!viaDom) playButtonClick();
}

function selectObject(name) {
  if (!name) return;
  twin.selectDetectedObject(name);
  playObjectSelectSound();
  activeTab = 'object';
  panelDirty = true;
}

function flash(text, ms = 2500) {
  flashText = text;
  flashUntil = performance.now() + ms;
  panelDirty = true;
  markHudDirty();
}

// ── Tastenhilfe (xr_controls.js) ────────────────────────────────────────────
function hintState() {
  return {
    mode: ctrlMode,
    view: isNozzleCamActive() ? 'nozzle' : xrKind,
    hud: isHudEnabled(),
    panel: panelVisible,
    aim: hoverKey ? 'ui' : (gizmoLaser || gizmoHoverAxis ? 'gizmo' : (hoverObject ? 'object' : '')),
    aimName: hoverObject && hoverObject.name ? hoverObject.name.replace(/_/g, ' ') : '',
    holding: servoGrip || Boolean(planDrag) || Boolean(gizmoLaser),
    locked: Boolean(estopLatched),
    pads,
  };
}

function toggleHints() {
  const on = toggleControlHints();
  flash(on ? 'Tastenhilfe an: auf einen Controller schauen' : 'Tastenhilfe aus (Tab TASTEN)');
  panelDirty = true;
}

// Tab TASTEN: beide Controller nebeneinander mit ihrer aktuellen Belegung,
// darunter die zwei Modi (Karte klicken = Modus waehlen) und unten der
// Schalter fuer die Karten an den Controllern. Feste Hoehen - passt der
// Modus-Block nicht, entfaellt er, statt zu ueberlappen.
function drawKeysTab(ctx) {
  const st = hintState();
  const w = CW - 2 * PAD;
  const colW = (w - GAP) / 2;
  let y = CONTENT_Y;
  // Kopf mit Farblegende statt Hinweistext: die Tastenfarben = Funktionsgruppen.
  drawSectionHead(ctx, { title: 'CONTROLLER', fa: 'fa-gamepad', group: 'help', legend: true }, y);
  y += SEC_HEAD_H + SEC_HEAD_GAP;
  let rowsEnd = y;
  for (const [hand, x] of [['left', PAD], ['right', PAD + colW + GAP]]) {
    drawHandHead(ctx, x, y + KEYS_HEAD_H / 2, colW, hand);
    let ry = y + KEYS_HEAD_H + GAP / 2;
    for (const row of legendRows(hand, st)) {
      drawLegendRow(ctx, { x, y: ry, w: colW, h: ROW_H }, row, HAND_COL[hand]);
      ry += ROW_H + ROW_GAP;
    }
    rowsEnd = Math.max(rowsEnd, ry - ROW_GAP);
  }

  const toggleR = { x: PAD, y: CONTENT_BOTTOM - KEYS_TOGGLE_H, w, h: KEYS_TOGGLE_H };
  y = rowsEnd + SEC_GAP;
  if (y + SEC_HEAD_H + SEC_HEAD_GAP + MODE_CARD_H + SEC_GAP <= toggleR.y) {
    drawSectionHead(ctx, { title: 'MODI', fa: 'fa-shuffle', group: 'help', meta: 'B wechselt · Karte klicken' }, y);
    y += SEC_HEAD_H + SEC_HEAD_GAP;
    drawModeCard(ctx, { x: PAD, y, w: colW, h: MODE_CARD_H }, 'servo');
    drawModeCard(ctx, { x: PAD + colW + GAP, y, w: colW, h: MODE_CARD_H }, 'plan');
  }

  const on = isControlHintsEnabled();
  drawSectionButton(ctx, toggleR, ownItem('keys-hints', 'fa-circle-question',
    'Tastenhilfe an den Controllern', toggleHints, { ...toggleOpts(on, 'xr'), toggle: true }));
}

const MODE_INFO = {
  servo: {
    fa: 'fa-gamepad', color: GROUP.robot.color, title: 'SERVO',
    lines: [['GRIP', 'halten: Roboter folgt der Hand'], ['TRIGGER', 'Greifer auf/zu'], ['GRIP + STICK', '← → Linearachse']],
  },
  plan: {
    fa: 'fa-ghost', color: GROUP.plan.color, title: 'PLAN',
    lines: [['TRIGGER', 'Gizmo-Pfeil/Ring ziehen'], ['GRIP', 'Ghost frei ziehen'], ['LOSLASSEN', 'plant · ▶ im MoveIt-Popup']],
  },
};

function drawModeCard(ctx, r, mode) {
  const m = MODE_INFO[mode];
  const on = ctrlMode === mode;
  const key = `mode-card:${mode}`;
  const hov = hoverKey === key;
  glass(ctx, r.x, r.y, r.w, r.h, 16, {
    a: [0.35, 0.45], tint: on || hov ? m.color : null, tintA: on ? [0.3, 0.1] : [0.12, 0.04],
    border: on ? m.color : (hov ? rgba(m.color, 0.85) : null), lw: on ? 3 : 2,
  });
  // Kopf: Icon + Name links, AKTIV rechts
  const hy = r.y + 12, hc = hy + 22;
  let xr = r.x + r.w - 14;
  if (on) xr = pill(ctx, xr, hy, 'AKTIV', m.color);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `900 28px ${FA_FONT}`;
  ctx.fillStyle = m.color;
  const g = glyphFor(m.fa);
  ctx.fillText(g, r.x + 16, hc);
  const tx = r.x + 16 + ctx.measureText(g).width + 12;
  ctx.font = `800 26px ${FONT}`;
  ctx.fillStyle = COL.text;
  ctx.fillText(fitText(ctx, m.title, xr - tx - 8), tx, hc);
  // Zeilen: Taste in Modusfarbe, dahinter die Wirkung
  let ly = r.y + 62 + MODE_LINE_H / 2;
  for (const [k, text] of m.lines) {
    ctx.font = `800 18px ${FONT}`;
    ctx.fillStyle = m.color;
    ctx.fillText(k, r.x + 16, ly);
    const kx = r.x + 16 + ctx.measureText(k).width + 10;
    ctx.font = `500 21px ${FONT}`;
    ctx.fillStyle = on ? COL.text : COL.mut;
    ctx.fillText(fitText(ctx, text, r.x + r.w - 14 - kx), kx, ly);
    ly += MODE_LINE_H;
  }
  hitRects.push({ ...r, key, onClick: () => setCtrlMode(mode) });
}

function drawPanel() {
  const ctx = panelCtx;
  if (!ctx) return;
  hitRects = [];
  ctx.clearRect(0, 0, CW, CH);
  // Glas; Rahmen und ein Hauch Toenung in der Farbe des aktiven Tabs.
  const tabColor = groupColor((TABS.find(t => t.id === activeTab) || TABS[0]).group);
  glass(ctx, 1.5, 1.5, CW - 3, CH - 3, 36, { a: GLASS.panel, tint: tabColor, tintA: [0.1, 0.02], border: rgba(tabColor, 0.55), lw: 3 });

  // Kopfzeile: Titel links, Status-Pillen rechts (von rechts nach links gesetzt).
  const warnBanner = q('#twin-warning-banner');
  const warn = warnBanner && !warnBanner.classList.contains('banner-hidden') ? txt('#twin-warning-text') : '';
  const flashing = flashText && performance.now() < flashUntil;
  let xr = CW - PAD;
  xr = pill(ctx, xr, PAD + 14, ros && ros.isConnected ? 'ROS' : 'ROS OFF', ros && ros.isConnected ? COL.green : COL.red);
  xr = pill(ctx, xr, PAD + 14, ctrlMode === 'plan' ? 'PLAN' : 'SERVO', groupColor(ctrlMode === 'plan' ? 'plan' : 'robot'));
  if (estopLatched) xr = pill(ctx, xr, PAD + 14, 'E-STOP', COL.red);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `700 28px ${FONT}`;
  ctx.fillStyle = warn ? COL.red : (flashing ? COL.orange : COL.cyan);
  const view = isNozzleCamActive() ? 'KAMERA NOZZLE' : `${xrKind === 'ar' ? 'PASSTHROUGH' : 'VR'} VIEWPORT`;
  const title = warn ? `⚠ ${warn}` : (flashing ? flashText : `XR · ${view}`);
  ctx.fillText(fitText(ctx, title, xr - PAD - 8), PAD + 8, PAD + 36);

  // Tabs
  const tabW = (CW - 2 * PAD - (TABS.length - 1) * GAP) / TABS.length;
  const tabY = PAD + HEADER_H + GAP;
  // Jeder Tab zeigt seine Gruppenfarbe immer (Icon + Leiste oben), aktiv
  // zusaetzlich getoent und umrandet - so lernt man die Farben nebenbei.
  TABS.forEach((t, i) => {
    const r = { x: PAD + i * (tabW + GAP), y: tabY, w: tabW, h: TAB_H };
    const key = `tab:${t.id}`;
    const on = activeTab === t.id;
    const gc = groupColor(t.group);
    const hov = hoverKey === key && !on;
    glass(ctx, r.x, r.y, r.w, r.h, 16, {
      a: [0.3, 0.4], tint: gc, tintA: on ? [0.38, 0.14] : (hov ? [0.16, 0.05] : [0.06, 0.02]),
      border: on ? gc : (hov ? rgba(gc, 0.8) : null), lw: on ? 3 : 2,
    });
    // Farbstreifen oben (aktiv breit und voll, sonst schmal und blasser)
    const sw = on ? r.w - 32 : r.w * 0.4;
    roundRect(ctx, r.x + (r.w - sw) / 2, r.y + 6, sw, 5, 2.5);
    ctx.fillStyle = on ? gc : rgba(gc, 0.55);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 34px ${FA_FONT}`;
    ctx.fillStyle = on ? gc : rgba(gc, 0.75);
    ctx.fillText(glyphFor(t.fa), r.x + r.w / 2, r.y + 38);
    ctx.font = `700 20px ${FONT}`;
    ctx.fillStyle = on ? COL.text : COL.mut;
    ctx.fillText(t.label, r.x + r.w / 2, r.y + 76);
    hitRects.push({ ...r, key, onClick: () => { activeTab = t.id; panelDirty = true; } });
  });

  // Inhalt: Tastenbelegung, Sektionen (VR-Tab) oder Infozeilen mit
  // Button-Raster darunter
  if (activeTab === 'keys') {
    drawKeysTab(ctx);
  } else {
    const { info, sections } = tabContent(activeTab);
    drawSections(ctx, sections, info);
  }

  // Not-Aus immer unten; ist er verriegelt, daneben Reset.
  const ey = CH - PAD - ESTOP_H;
  const resetW = estopLatched ? (CW - 2 * PAD - GAP) / 3 : 0;
  const estopR = { x: PAD, y: ey, w: CW - 2 * PAD - (resetW ? resetW + GAP : 0), h: ESTOP_H };
  estopFill(ctx, estopR, 22, hoverKey === 'estop');
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

// Zellen zeilenweise fuellen; ein Eintrag mit span belegt mehrere Spalten und
// rutscht in die naechste Zeile, wenn er in der aktuellen nicht mehr passt.
function gridCells(items, cols) {
  const cells = [];
  let col = 0, row = 0;
  for (const it of items) {
    const n = Math.min(cols, it.span || 1);
    if (col + n > cols) { col = 0; row++; }
    cells.push({ it, col, row, n });
    col += n;
    if (col >= cols) { col = 0; row++; }
  }
  return { cells, rows: cells.length ? cells[cells.length - 1].row + 1 : 0 };
}

function sectionHeight(s, rows) {
  const notes = s.notes ? s.notes.length : 0;
  return SEC_HEAD_H + SEC_HEAD_GAP + rows * s.btnH + Math.max(0, rows - 1) * GAP
    + (notes ? SEC_HEAD_GAP + notes * NOTE_LINE_H : 0);
}

// Sektionen untereinander: Kopf (Icon, Titel, Trennlinie, Info rechts), darunter
// ein Raster. dock 'bottom' sitzt fest ueber dem Not-Aus und springt nicht,
// wenn sich die Sektionen darueber aendern. Passt eine Sektion nicht mehr
// ganz hinein, entfaellt sie mit Hinweis - es ueberlappt nie etwas.
function drawSections(ctx, sections, info = []) {
  const w = CW - 2 * PAD;
  let top = CONTENT_Y;
  ctx.textBaseline = 'middle';
  for (const line of info) {
    drawInfoLine(ctx, line, PAD, top, w, INFO_LINE_H, INFO_LABEL_W);
    top += INFO_LINE_H;
  }
  if (info.length) top += GAP;
  const laid = sections.map((sec) => {
    const s = { ...sec, btnH: sec.btnH || SEC_BTN_H, cols: sec.cols || GRID_COLS };
    const grid = gridCells(s.items.filter(Boolean), s.cols);
    return { s, ...grid, hgt: sectionHeight(s, grid.rows) };
  });
  let bottom = CONTENT_BOTTOM;
  for (const l of laid.filter(l => l.s.dock === 'bottom').reverse()) {
    l.y = bottom - l.hgt;
    bottom = l.y - SEC_GAP;
  }
  let y = top;
  let skipped = 0;
  for (const l of laid) {
    if (l.s.dock === 'bottom') continue;
    if (y + l.hgt > bottom) { skipped++; continue; }
    l.y = y;
    y += l.hgt + SEC_GAP;
  }
  for (const l of laid) {
    if (l.y === undefined) continue;
    if (l.y < top) { skipped++; continue; }           // angedockt, aber zu hoch
    drawSection(ctx, l, w);
  }
  if (skipped) {
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = `500 20px ${FONT}`;
    ctx.fillStyle = COL.dim;
    ctx.fillText(`+${skipped} Sektion(en) ohne Platz`, CW - PAD, CONTENT_BOTTOM + 4);
  }
}

function drawSection(ctx, { s, cells, rows, y }, w) {
  drawSectionHead(ctx, s, y);
  let gy = y + SEC_HEAD_H + SEC_HEAD_GAP;
  const colW = (w - (s.cols - 1) * GAP) / s.cols;
  for (const { it, col, row, n } of cells) {
    const r = { x: PAD + col * (colW + GAP), y: gy + row * (s.btnH + GAP), w: n * colW + (n - 1) * GAP, h: s.btnH };
    if (it.stepper) drawStepper(ctx, r, it, s.group);
    else drawSectionButton(ctx, r, it);
  }
  gy += rows * s.btnH + Math.max(0, rows - 1) * GAP;
  if (!s.notes) return;
  gy += SEC_HEAD_GAP;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `500 20px ${FONT}`;
  ctx.fillStyle = COL.mut;
  for (const line of s.notes) {
    ctx.fillText(fitText(ctx, line, w - 16), PAD + 8, gy + NOTE_LINE_H / 2);
    gy += NOTE_LINE_H;
  }
}

function drawSectionHead(ctx, s, y) {
  const cy = y + SEC_HEAD_H / 2;
  let x = PAD + 4;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const gc = s.group ? groupColor(s.group) : (s.color || COL.cyan);
  if (s.fa) {
    const g = glyphFor(s.fa);
    ctx.font = `900 22px ${FA_FONT}`;
    ctx.fillStyle = gc;
    ctx.fillText(g, x, cy);
    x += ctx.measureText(g).width + 12;
  }
  ctx.font = `800 21px ${FONT}`;
  ctx.fillStyle = s.group ? gc : COL.text;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
  ctx.fillText(s.title, x, cy);
  x += ctx.measureText(s.title).width + 16;
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  let xr = CW - PAD - 4;
  if (s.legend) xr = drawGroupLegend(ctx, xr, cy, x + 40) - 16;
  if (s.meta) {
    ctx.font = `500 19px ${FONT}`;
    const t = fitText(ctx, s.meta, Math.max(0, xr - x - 40));
    if (t && t !== '…') {
      ctx.textAlign = 'right';
      ctx.fillStyle = COL.dim;
      ctx.fillText(t, xr, cy);
      xr -= ctx.measureText(t).width + 16;
    }
  }
  if (xr - x > 16) {
    const lg = ctx.createLinearGradient(x, 0, xr, 0);
    lg.addColorStop(0, s.group ? rgba(gc, 0.55) : COL.border);
    lg.addColorStop(1, s.group ? rgba(gc, 0.05) : 'rgba(148, 163, 184, 0.04)');
    ctx.strokeStyle = lg;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.lineTo(xr, cy);
    ctx.stroke();
  }
}

function drawSectionButton(ctx, r, it) {
  drawButton(ctx, r, it, hoverKey === it.key);
  if (!it.disabled) hitRects.push({ ...r, key: it.key, onClick: it.onClick });
}

function drawStepper(ctx, r, it, group) {
  const sc = group ? groupColor(group) : null;
  glass(ctx, r.x, r.y, r.w, r.h, 16, { a: [0.3, 0.4], tint: sc, tintA: [0.1, 0.03], border: sc ? rgba(sc, 0.4) : null });
  const inset = 6, bw = Math.min(96, Math.round(r.w * 0.24));
  const minus = { x: r.x + inset, y: r.y + inset, w: bw, h: r.h - 2 * inset };
  const plus = { x: r.x + r.w - inset - bw, y: minus.y, w: bw, h: minus.h };
  for (const [br, sub, fa] of [[minus, it.minus, 'fa-minus'], [plus, it.plus, 'fa-plus']]) {
    const hov = hoverKey === sub.key;
    roundRect(ctx, br.x, br.y, br.w, br.h, 12);
    ctx.fillStyle = hov ? COL.btnHover : COL.btn;
    ctx.fill();
    if (hov && sc) {
      ctx.fillStyle = rgba(sc, 0.16);
      ctx.fill();
    }
    ctx.strokeStyle = hov ? (sc ? rgba(sc, 0.85) : COL.hover) : COL.border;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 28px ${FA_FONT}`;
    ctx.fillStyle = group ? groupColor(group) : COL.text;
    ctx.fillText(glyphFor(fa), br.x + br.w / 2, br.y + br.h / 2);
    hitRects.push({ ...br, key: sub.key, onClick: sub.onClick, repeat: true });
  }
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  const maxW = plus.x - (minus.x + minus.w) - 16;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 26px ${FONT}`;
  ctx.fillStyle = COL.text;
  ctx.fillText(fitText(ctx, it.label, maxW), cx, it.sub ? cy - 11 : cy);
  if (it.sub) {
    ctx.font = `500 19px ${FONT}`;
    ctx.fillStyle = COL.mut;
    ctx.fillText(fitText(ctx, it.sub, maxW), cx, cy + 16);
  }
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

// Tests/Diagnose: Trefferflaechen des zuletzt gezeichneten Panels und Klick
// auf einen Eintrag per Schluessel - derselbe Weg wie Laser + Trigger.
export const xrPanelPreviewHits = () => hitRects.map(({ onClick, ...r }) => r);
export function clickXRPanelPreview(key) {
  const hit = hitRects.find(r => r.key === key);
  if (!hit) return false;
  clickPanelHit(hit);
  panelDirty = true;
  return true;
}

// ── Frame-Schleife ──────────────────────────────────────────────────────────
function onXRFrame(time, frame) {
  const dt = lastFrameT ? Math.min(0.1, (time - lastFrameT) / 1000) : 0;
  lastFrameT = time;
  // Ein Fehler in der Logik darf das Rendern nie verhindern - sonst bleibt
  // die Brille komplett schwarz. Jeder Fehlertext wird einmal gemeldet.
  try {
    updateNozzleCam(frame, h.renderer, rig, dt);   // nur bei aktiver Nozzle-Kamera
    rig.updateMatrixWorld(true);
    handleInput(dt);
    twin.runTwinFrameUpdates();
  } catch (e) {
    reportFrameError('frame', e);
    stopMotion('Fehler im XR-Frame');
  }
  try {
    updateHud(frame, dt);
  } catch (e) {
    reportFrameError('hud', e);
  }
  try {
    const aimPoint = reticle && reticle.visible ? rig.worldToLocal(_aim.copy(reticle.position)) : null;
    updateControlHints(frame, h.renderer,
      { left: hands.left && hands.left.grip, right: hands.right && hands.right.grip },
      hintState(), { hide: { left: panelVisible }, aimPoint }, dt);
  } catch (e) {
    reportFrameError('hints', e);
  }
  try {
    if (panel && panel.visible && (panelDirty || performance.now() - lastPanelDraw > PANEL_REDRAW_MS)) drawPanel();
  } catch (e) {
    reportFrameError('panel', e);
  }
  try {
    h.renderer.render(h.scene, h.camera);
  } catch (e) {
    reportFrameError('render', e);
  }
  // VR-Spiegel am PC (vr_mirror.html): nach dem Rendern stimmen Kopf-Pose
  // und Sichtfeld der Kamera fuer genau dieses Bild.
  try {
    publishMirrorFrame({ h, rig, hands, laser, reticle, floorDisc, xrKind });
  } catch (e) {
    reportFrameError('mirror', e);
  }
}

const reportedFrameErrors = new Set();
function reportFrameError(where, e) {
  const text = `${where}: ${e && e.message ? e.message : e}`;
  if (reportedFrameErrors.has(text)) return;
  reportedFrameErrors.add(text);
  console.error('[xr]', where, e);
  logMsg('VR', `❌ XR ${text}`, 'err');
  flash(`Fehler ${text}`.slice(0, 60));
}

function handleInput(dt) {
  const L = hands.left, R = hands.right;
  const lp = readPad(L), rp = readPad(R);
  pads.left = lp;
  pads.right = rp;
  // Tab TASTEN zeigt gedrueckte Tasten - bei jeder Aenderung neu zeichnen.
  const sig = [lp, rp].map(p => (p ? `${+p.trigger}${+p.grip}${+p.btnA}${+p.btnB}${+(Math.abs(p.sx) > STICK_DEADZONE || Math.abs(p.sy) > STICK_DEADZONE)}` : '-')).join('|');
  if (sig !== padSig) {
    padSig = sig;
    if (activeTab === 'keys') panelDirty = true;
  }

  // Not-Aus-Geste: beide Grips + beide Trigger zugleich (Flanke).
  const gesture = lp && rp && lp.grip && lp.trigger && rp.grip && rp.trigger;
  if (gesture && estopGestureArmed) {
    estopGestureArmed = false;
    fireEstop('Geste');
  } else if (!gesture && !(lp && (lp.grip || lp.trigger)) && !(rp && (rp.grip || rp.trigger))) {
    estopGestureArmed = true;          // erst nach komplettem Loslassen wieder scharf
  }
  if (!estopGestureArmed) {
    releaseUiPress();
    cancelGizmoLaser();
    if (reticle) reticle.visible = false;
    if (L) L.prev = lp || {};
    if (R) R.prev = rp || {};
    return;
  }

  // Linke Hand: X = Handgelenk-Panel, Y = HUD, Stick = gehen (nur VR). Gehen
  // nicht, waehrend die rechte Hand den Roboter/Ghost fuehrt - das bewegte
  // Rig wuerde ihn sonst mitziehen.
  if (L && lp) {
    if (lp.btnA && !L.prev.btnA) {
      togglePanel();
      pulse('left', 0.3, 20);
    }
    if (lp.btnB && !L.prev.btnB) {
      toggleHudVisible();
      pulse('left', 0.3, 20);
    }
    if (xrKind === 'vr' && !isNozzleCamActive() && !servoGrip && !planDrag && !gizmoLaser
        && (Math.abs(lp.sx) > STICK_DEADZONE || Math.abs(lp.sy) > STICK_DEADZONE)) walk(lp.sx, lp.sy, dt);
    L.prev = lp;
  }

  if (!R || !rp) {
    releaseUiPress();
    if (servoGrip || planDrag || gizmoLaser) stopMotion('rechter Controller ohne Daten');
    if (reticle) reticle.visible = false;
    return;
  }

  // B = SERVO <-> PLAN, A = HUD vor den Blick holen
  if (rp.btnB && !R.prev.btnB) setCtrlMode(ctrlMode === 'servo' ? 'plan' : 'servo');
  if (rp.btnA && !R.prev.btnA) { recenterView(); pulse('right', 0.3, 20); }

  // Rechter Stick ohne Grip = fliegen (nur VR). Mit Grip fuehrt die Hand den
  // Roboter bzw. den Ghost - ein bewegtes Rig wuerde ihn dann mitziehen.
  if (xrKind === 'vr' && !isNozzleCamActive() && !rp.grip && !planDrag && !gizmoLaser) {
    const sx = Math.abs(rp.sx) > STICK_DEADZONE ? rp.sx : 0;
    const sy = Math.abs(rp.sy) > STICK_DEADZONE ? rp.sy : 0;
    if (sx || sy) orbit(sx, sy, dt);
  }

  // Laser: Panel hat Vorrang, dann das TCP-Gizmo (PLAN), dann Greifkugeln
  const ray = updateLaser(R);
  const trigEdge = rp.trigger && !R.prev.trigger;
  if (!rp.trigger) triggerConsumed = false;
  if (trigEdge && ray) {
    if (ray.panelHit) {
      triggerConsumed = true;
      pulse('right', 0.5, 30);
      pressUi(ray.panelHit, ray.ray);
    } else if (ray.gizmo && twin.gizmoLaserDown(ray.ray)) {
      // Wie die Maus: Achse/Ebene/Ring greifen, beim Loslassen plant der
      // Twin genau wie am Desktop (dragging-changed -> handleGizmoDragEnd).
      triggerConsumed = true;
      gizmoLaser = { dist: ray.gizmo.distance };
      pulse('right', 0.5, 30);
      panelDirty = true;
    } else if (ray.object && ray.object.name) {
      triggerConsumed = true;
      pulse('right', 0.6, 40);
      selectObject(ray.object.name);
      if (!panelVisible) { panelVisible = true; if (panel) panel.visible = true; }
    }
  }
  updateUiPress(rp.trigger, ray);
  if (gizmoLaser) {
    if (rp.trigger && ray && R.grip.visible) {
      twin.gizmoLaserMove(ray.ray);
    } else {
      // Loslassen plant; Laser/Tracking weg bricht ohne Planung ab.
      const cancel = !ray || !R.grip.visible;
      gizmoLaser = null;
      twin.gizmoLaserUp(cancel);
      pulse('right', 0.5, 40);
      panelDirty = true;
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

// ── Trigger auf Panel/HUD: Klick, Halten, Ziehen ────────────────────────────
// Normale Buttons (auch Not-Aus) loesen sofort beim Druecken aus. +/- (repeat)
// ebenfalls, und solange der Trigger gehalten wird und der Laser auf dem
// Button bleibt, laeuft der Wert immer schneller weiter. Kopfzeile, Griff und
// freie Stellen einer HUD-Flaeche (drag): Schwenkt der Laser bei gehaltenem
// Trigger weiter als DRAG_START_RAD, wird die Flaeche verschoben - sonst
// klickt die Kopfzeile beim Loslassen (Tab ein-/ausklappen).
function clickUi(hit) {
  clickPanelHit(hit);
  panelDirty = true;
  markHudDirty();
}

function pressUi(hit, ray) {
  uiPress = null;
  if (hit.drag) {
    uiPress = { hit, start: ray.clone(), dragging: false };
    return;
  }
  clickUi(hit);
  if (hit.repeat) uiPress = { hit, n: 0, next: performance.now() + REPEAT_DELAY_MS };
}

function updateUiPress(held, ray) {
  const p = uiPress;
  if (!p) return;
  if (!held || !ray) {
    uiPress = null;
    if (p.dragging) dropHud();
    else if (p.hit.drag && !held && p.hit.onClick) clickUi(p.hit);
    return;
  }
  if (p.hit.drag) {
    if (!p.dragging && p.start.direction.angleTo(ray.ray.direction) > DRAG_START_RAD) {
      p.dragging = hudDragBegin(p.hit.surface, p.start);
      if (p.dragging) pulse('right', 0.4, 25);
    }
    if (p.dragging) hudDragMove(ray.ray);
    return;
  }
  // Wiederholen nur, solange der Laser auf demselben Button bleibt.
  if (!ray.panelHit || ray.panelHit.key !== p.hit.key) { uiPress = null; return; }
  const now = performance.now();
  if (now < p.next) return;
  p.n++;
  ray.panelHit.onClick();
  pulse('right', 0.2, 8);
  p.next = now + Math.max(REPEAT_MS_MIN, REPEAT_MS_START * Math.pow(0.85, p.n));
  panelDirty = true;
  markHudDirty();
}

function dropHud() {
  if (hudDragEnd()) flash('HUD: Fläche auf freien Platz gerückt');
  pulse('right', 0.5, 30);
}

// Not-Aus-Geste oder Controller weg: laufendes Ziehen abbrechen.
function releaseUiPress() {
  if (uiPress && uiPress.dragging) hudDragCancel();
  uiPress = null;
}

function resetHudLayout() {
  hudResetLayout();
  flash('HUD-Layout zurückgesetzt');
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

// Um den Roboter fliegen: Stick X kreist um die senkrechte Achse durch die
// Roboterbasis (ROS-Ursprung), der Blick dreht mit und bleibt zur Mitte
// gerichtet. Stick Y hebt/senkt. Das Rig dreht sich dafuer als Ganzes um den
// Ursprung - auch wenn der Nutzer im Raum schon herumgelaufen ist.
function orbit(sx, sy, dt) {
  const c = rigCal[xrKind];
  const a = sx * ORBIT_SPEED * dt;
  if (a) {
    const x = c.x * Math.cos(a) - c.y * Math.sin(a);
    const y = c.x * Math.sin(a) + c.y * Math.cos(a);
    c.x = x; c.y = y; c.yaw += a;
  }
  c.z = THREE.MathUtils.clamp(c.z - sy * FLY_SPEED * dt, RIG_Z_MIN, RIG_Z_MAX);
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

  let panelHit = null, object = null, dist = 1.5, onUi = false;
  if (panel && panel.visible) {
    const hits = _ray.intersectObject(panel, false);
    if (hits.length && hits[0].uv) {
      panelHit = panelHitAt(hits[0].uv);
      dist = hits[0].distance;
      onUi = true;
    }
  }
  // HUD nur, wenn es naeher liegt als das Handgelenk-Panel.
  const hudHit = hudPick(_ray.ray, onUi ? dist : Infinity);
  if (hudHit) {
    panelHit = hudHit.hit;
    dist = hudHit.distance;
    onUi = true;
  }
  const pk = panelHit ? panelHit.key : null;
  if (pk !== hoverKey) {
    hoverKey = pk;
    panelDirty = true;
    setHudHover(pk);
    if (pk) pulse('right', 0.15, 10);
  }
  // TCP-Gizmo (nur PLAN - im SERVO gehoert der Trigger dem Greifer und der
  // Laser streift den TCP staendig). Waehrend des Ziehens bleibt die Achse.
  let gizmo = null;
  if (gizmoLaser) {
    dist = gizmoLaser.dist;
  } else if (!onUi && ctrlMode === 'plan' && !planDrag) {
    gizmo = twin.gizmoLaserHover(_ray.ray);
    if (gizmo) dist = gizmo.distance;
  } else {
    twin.gizmoLaserHover(null);
  }
  const ga = gizmoLaser ? gizmoHoverAxis : (gizmo ? gizmo.axis : null);
  if (ga !== gizmoHoverAxis) {
    gizmoHoverAxis = ga;
    if (ga) pulse('right', 0.2, 12);
  }
  if (!onUi && !gizmo && !gizmoLaser) {
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
  laser.material.color.set(panelHit || object || gizmo || gizmoLaser ? 0xf59e0b : 0x38bdf8);
  if (reticle) {
    reticle.visible = Boolean(panelHit || object || gizmo || gizmoLaser || dist < 1.5);
    reticle.position.copy(_ray.ray.origin).addScaledVector(_ray.ray.direction, dist);
  }
  return { panelHit, object, gizmo, ray: _ray.ray };
}

function handleServo(R, rp, tracked) {
  const allowed = motionAllowed('VR Servo', true);
  // Tracking weg oder Bewegung gesperrt -> Grip gilt als losgelassen.
  const grip = rp.grip && tracked && allowed;
  // Trigger nur fuer den Greifer, wenn Laser/Panel ihn nicht verbraucht hat.
  const index = rp.trigger && !triggerConsumed && allowed;
  // Linearachse nur mit Grip - ohne Grip fliegt der rechte Stick (orbit).
  const thumbX = grip && Math.abs(rp.sx) > 0.05 ? rp.sx : 0;
  if (rp.grip && !tracked && servoGrip) logMsg('VR', '⏹ Tracking lost - servo stopped', 'warn');

  const active = grip || index || thumbX !== 0;
  if (active || lastServoSent) {
    const { pos, quat } = controlPose(R.grip, servoGrip);
    publishController(pos, quat, grip, index, thumbX);
    lastIdleSentAt = performance.now();
  } else if (performance.now() - lastIdleSentAt > 1000) {
    lastIdleSentAt = performance.now();
    publishController(null, null, false, false, 0);
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
  const { pos, quat } = controlPose(R.grip, Boolean(planDrag));
  if (rp.grip && !R.prev.grip && !planDrag && !gizmoLaser) {
    const start = twin.beginGizmoExternalDrag();
    if (!start) { flash('TCP-Gizmo ist aus (Tab PLANEN)'); return; }
    planDrag = { gizmo: start, ctrlPos: pos.clone(), ctrlQuat: quat.clone() };
    activeTab = 'plan';
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

// ── Ansicht VR <-> Passthrough ──────────────────────────────────────────────
const canSwitchView = () => sessionMode === 'immersive-ar';

function applyViewMode() {
  const r = h.renderer;
  const pt = xrKind === 'ar';
  if (pt) {
    h.scene.background = null;
    r.setClearAlpha(0);
  } else {
    h.scene.background = savedBackground;
    r.setClearAlpha(savedClearAlpha);
  }
  // In einer AR-Session erzwingt three.js einen transparenten Hintergrund -
  // die VR-Ansicht braucht dort die Kugel, sonst schimmert die Kamera durch.
  if (vrBackdrop) vrBackdrop.visible = !pt && sessionMode === 'immersive-ar';
  if (floorDisc) floorDisc.visible = !pt && !isNozzleCamActive();
  applyRig();                 // VR und Passthrough haben je ein eigenes Rig
  markHudDirty();
}

function setViewMode(kind) {
  const next = kind === 'ar' ? 'ar' : 'vr';
  if (!session) return;
  // VR bzw. Passthrough waehlen beendet die Nozzle-Kamera (auch aus dem HUD).
  if (isNozzleCamActive()) setNozzleView(false);
  if (next === xrKind) return;
  if (!canSwitchView()) { flash('Passthrough: Brille kann kein immersive-ar'); return; }
  // Das Rig springt - eine laufende Servo-Bewegung oder ein Ghost-Drag
  // wuerde den Sprung sonst an den Roboter weitergeben.
  stopMotion('Ansicht gewechselt');
  xrKind = next;
  applyViewMode();
  pulse('right', 0.5, 40);
  flash(next === 'ar' ? 'Ansicht: Passthrough' : 'Ansicht: VR');
  logMsg('VR', `🥽 View: ${next === 'ar' ? 'Passthrough (AR)' : 'VR'}`, 'info');
}

// Kamera Nozzle an/aus (Button im VR-Tab). Aus Passthrough heraus erst auf VR
// umschalten - im Passthrough zaehlt die echte Umgebung.
function toggleNozzleView() {
  if (isNozzleCamActive()) { setNozzleView(false); return; }
  if (xrKind === 'ar') setViewMode('vr');
  setNozzleView(true);
}

function setNozzleView(on) {
  if (on === isNozzleCamActive()) return;
  if (on && !isNozzleCamAvailable()) { flash('Kamera Nozzle: Robotermodell noch nicht geladen'); return; }
  // Das Rig springt - wie beim Ansichtswechsel vorher Servo/Ghost-Drag stoppen.
  stopMotion(on ? 'Kamera Nozzle an' : 'Kamera Nozzle aus');
  setNozzleCam(on);
  if (floorDisc) floorDisc.visible = !on && xrKind !== 'ar';
  if (!on) applyRig();
  pulse('right', 0.5, 40);
  flash(on ? 'Kamera Nozzle: Sicht folgt dem Endeffektor' : 'Kamera Nozzle aus');
  logMsg('VR', `🎥 Nozzle camera view ${on ? 'on' : 'off'}`, 'info');
  panelDirty = true;
  markHudDirty();
}

// A (rechts) bzw. "Zentrieren": HUD vor den Blick, in der Nozzle-Ansicht auch
// die Kamerasicht auf die aktuelle Blickrichtung.
function recenterView() {
  hudRecenter();
  if (isNozzleCamActive()) recenterNozzleCam();
}

function togglePanel() {
  panelVisible = !panelVisible;
  if (panel) panel.visible = panelVisible;
  panelDirty = true;
  markHudDirty();
}

function toggleHudVisible() {
  const on = toggleHud();
  flash(on ? 'HUD an' : 'HUD aus (Y: wieder an)');
  panelDirty = true;
}

// Zustand und Aktionen fuer das HUD (xr_hud.js)
const hudApi = {
  state: () => ({
    xrKind, ctrlMode, panelVisible,
    canSwitch: canSwitchView(),
    flash: flashText && performance.now() < flashUntil ? flashText : '',
  }),
  setViewMode,
  setCtrlMode,
  togglePanel,
  exit: () => { if (session) session.end(); },
  estop: (src) => fireEstop(src),
  estopReset: () => resetEmergencyStop(),
};

// ── Session ─────────────────────────────────────────────────────────────────
function onSessionEnd() {
  stopMotion('XR-Session beendet');
  uiPress = null;
  publishMirrorEnd();
  setNozzleCam(false);
  const r = h.renderer;
  r.setAnimationLoop(null);
  if (h.camera.parent === rig) rig.remove(h.camera);
  if (reticle) reticle.visible = false;
  twin.setDetectedObjectHover(null);
  hoverObject = null;
  h.scene.background = savedBackground;
  r.setClearAlpha(savedClearAlpha);
  if (floorDisc) floorDisc.visible = false;
  if (vrBackdrop) vrBackdrop.visible = false;
  hudOnSessionEnd();
  controlHintsOnSessionEnd();
  sessionMode = '';
  if (h.controls) h.controls.enabled = true;
  session = null;
  twin.restoreTwinViewAfterXR();
  logMsg('VR', 'XR session ended', 'info');
}

function onVisibilityChange() {
  // Quest-Systemmenue o. ae.: Session verdeckt -> keine Bewegung
  if (session && session.visibilityState !== 'visible') stopMotion('Session verdeckt');
}

// Fehler beim Start zusaetzlich als Popup: im Quest-Browser ist das
// Log-Fenster meist nicht im Blick, sonst "passiert einfach nichts".
function xrFail(text) {
  logMsg('VR', `❌ ${text}`, 'err');
  console.error('[xr]', text);
  alert(`VR: ${text}`);
}

export function enterTwinXR(kind = 'vr') {
  h = twin.getTwinXRHandles();
  if (!h) { xrFail('Digital Twin not ready'); return; }
  if (session) { xrFail('XR session already active'); return; }
  if (!navigator.xr) { xrFail('WebXR not available - open https://<host>:8443/ in the Quest browser'); return; }
  // Kann die Brille Passthrough, laeuft auch die VR-Ansicht als AR-Session
  // (mit blickdichtem Hintergrund) - nur so laesst sich in der Session
  // zwischen VR und Passthrough umschalten.
  const mode = kind === 'ar' || xrSupport['immersive-ar'] ? 'immersive-ar' : 'immersive-vr';
  // requestSession muss direkt im Klick passieren (User-Aktivierung).
  navigator.xr.requestSession(mode, { optionalFeatures: ['local-floor', 'hand-tracking'] })
    .then(async (s) => {
      session = s;
      sessionMode = mode;
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
        // VR-Ansicht in einer AR-Session: blickdichte Kugel um den Nutzer,
        // zuerst gezeichnet, ohne Tiefe - alles andere liegt davor. Radius
        // unter camera.far (20 m), damit sie nie abgeschnitten wird.
        vrBackdrop = new THREE.Mesh(
          new THREE.SphereGeometry(12, 32, 16),
          new THREE.MeshBasicMaterial({ color: 0x0a0e17, side: THREE.BackSide, depthTest: false, depthWrite: false, toneMapped: false }));
        vrBackdrop.name = 'xr_vr_backdrop';
        vrBackdrop.renderOrder = -1000;
        vrBackdrop.frustumCulled = false;
        rig.add(vrBackdrop);
      }
      savedBackground = h.scene.background;
      savedClearAlpha = r.getClearAlpha();
      r.xr.setReferenceSpaceType('local-floor');
      await r.xr.setSession(s);
      rig.add(h.camera);
      if (h.controls) h.controls.enabled = false;
      createHud(rig, r, hudApi);
      createControlHints(rig);
      applyViewMode();
      hudOnSessionStart();
      flash(isControlHintsEnabled() ? 'Tipp: auf einen Controller schauen = Tastenbelegung' : 'Tastenbelegung: X → Tab TASTEN', 8000);
      if (document.fonts) document.fonts.load(`900 46px ${FA_FONT}`).then(() => { panelDirty = true; }).catch(() => {});
      s.addEventListener('end', onSessionEnd, { once: true });
      s.addEventListener('visibilitychange', onVisibilityChange);
      lastFrameT = 0;
      panelDirty = true;
      r.setAnimationLoop(onXRFrame);
      logMsg('VR', `🥽 ${xrKind === 'ar' ? 'Passthrough (AR)' : 'VR'} session started (${mode}) - look at a controller for its button map (full list: X → tab TASTEN); both grips + triggers: E-STOP`, 'info');
    })
    .catch((e) => {
      xrFail(`XR session failed: ${e && e.name ? e.name + ': ' : ''}${e && e.message ? e.message : e}`);
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
    navigator.xr.isSessionSupported(mode).then((ok) => {
      xrSupport[mode] = ok;
      btn.style.display = ok ? '' : 'none';
    }).catch(() => {});
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initXRButtons);
else initXRButtons();
