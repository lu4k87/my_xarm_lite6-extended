// ── VR-Spiegel: zeigt am PC, was die Quest 3 gerade sieht ─────────────────
//
// Einstieg von vr_mirror.html (Button "VR-Spiegel" im Viewport-Header der
// Robot Control UI). Die Brille schickt ihre Kopf-Pose, Controller, UI-Flaechen
// und den Twin-Zustand (js/twin/xr_mirror_send.js); dieses Fenster rendert
// denselben Digital Twin aus genau dieser Position mit dem Sichtfeld der
// Brille. Erkennungen und Pfad-Vorschau kommen direkt aus ROS -
// dieselben Daten wie in der Brille.
//
// Die Seite ist rein passiv: sie bewegt nichts und publiziert nur einen
// Heartbeat bzw. die Bitte um Nachsenden (/vr_teleop/mirror_request).
// Bedienung: Mausrad = Zoom, Doppelklick oder 0 = Zoom zuruecksetzen,
// F = Vollbild, Button: ganzes Sichtfeld <-> Fenster fuellen.

import * as THREE from 'three';
import * as twin from './twin/digital_twin.js';
import { TOPICS } from './config.js';
import { ros } from './ros.js';
import { lsGet, lsSet } from './util.js';
import { XR_ORDER } from './twin/xr_ui.js';

const STALE_MS = 1500;           // so lange ohne Pose = Brille weg
const SMOOTH_TAU = 0.03;         // s, glaettet Netz-Jitter der Posen
const IDLE_FRAME_MS = 100;       // ohne Brille reichen 10 Bilder/s
const REQUEST_MS = 2000;         // Nachsende-Bitte hoechstens so oft
const HEARTBEAT_MS = 2000;       // "ich schaue zu" an die Brille (xr_mirror_send.js)
const ZOOM_MIN = 0.5, ZOOM_MAX = 4;
const ZOOM_LS_KEY = 'vr_mirror_zoom';
const FIT_LS_KEY = 'vr_mirror_fit';
const OVERLAY_IDLE_MS = 2500;

twin.setTwinExternalRender(true);

// ── Zustand ─────────────────────────────────────────────────────────────────
let h = null;                    // Twin-Handles { scene, camera, renderer, controls }
let pose = null;                 // letzte Pose-Nachricht
let poseAt = 0, poseFresh = false, lastSeq = -1;
let rateCount = 0, rate = 0, rateAt = 0;
let state = null;                // letzte Zustands-Nachricht
let zoom = clampZoom(parseFloat(lsGet(ZOOM_LS_KEY)) || 1);
// 'fit': ganzes Sichtfeld der Brille, mittig mit dunklem Rand (Standard, 1:1).
// 'fill': Fenster voll, das Sichtfeld wird oben/unten bzw. seitlich beschnitten.
let fitMode = lsGet(FIT_LS_KEY) === 'fill' ? 'fill' : 'fit';
let boxKey = '';
let lastRequestAt = 0;
let lastFrameT = 0, lastRenderAt = 0;
let headSeen = false;

const root = new THREE.Group();
root.name = 'vr_mirror';
const headTarget = { p: new THREE.Vector3(), q: new THREE.Quaternion(), fov: null };
let hands = null, ray = null, laser = null, reticle = null, floorDisc = null;
const surfaces = new Map();      // id -> { mesh, tex, target, loadSeq, hasImg }

function clampZoom(z) { return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z)); }

// ── Objekte wie in der Brille (Aussehen wie js/twin/xr.js) ─────────────────
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
  g.traverse((o) => {
    if (o.material) o.material.transparent = true;
    o.renderOrder = XR_ORDER.controller;
  });
  return g;
}

// Zu jedem gespiegelten Objekt das Ziel der Glaettung.
function tracked(obj) {
  obj.visible = false;
  obj.userData.target = { p: new THREE.Vector3(), q: new THREE.Quaternion(), snap: true };
  root.add(obj);
  return obj;
}

function buildObjects() {
  hands = { left: tracked(makeControllerMesh(0x10b981)), right: tracked(makeControllerMesh(0x38bdf8)) };
  ray = tracked(new THREE.Group());
  laser = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]),
    new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 }));
  laser.renderOrder = XR_ORDER.controller;
  ray.add(laser);
  reticle = new THREE.Mesh(
    new THREE.SphereGeometry(0.006, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, depthTest: false }));
  reticle.renderOrder = XR_ORDER.reticle;
  reticle.visible = false;
  root.add(reticle);
  // Die Brille schickt die Welt-Pose des Bodens (inkl. Drehung in die Ebene).
  floorDisc = tracked(new THREE.Mesh(
    new THREE.CircleGeometry(2.5, 64),
    new THREE.MeshBasicMaterial({ color: 0x111827, transparent: true, opacity: 0.85 })));
  h.scene.add(root);
}

// ── Empfang ─────────────────────────────────────────────────────────────────
function topic(name, extra) {
  return new ROSLIB.Topic({ ros, name, messageType: 'std_msgs/String', ...extra });
}

// Heartbeat: die Brille sendet nur, solange ein Spiegelfenster ihn schickt.
const requestTopic = topic(TOPICS.vrTeleopMirrorRequest, { queue_size: 5 });

function sendRequest(resend) {
  if (!ros || !ros.isConnected) return;
  requestTopic.publish(new ROSLIB.Message({ data: JSON.stringify({ watch: true, resend }) }));
}

function requestResend() {
  const now = performance.now();
  if (now - lastRequestAt < REQUEST_MS) return;
  lastRequestAt = now;
  sendRequest(true);
}

setInterval(() => sendRequest(false), HEARTBEAT_MS);

function parse(msg) {
  try { return JSON.parse(msg.data); } catch (e) { return null; }
}

topic(TOPICS.vrTeleopMirrorPose, { queue_length: 1 }).subscribe((msg) => {
  const d = parse(msg);
  if (!d || d.v !== 1) return;
  // Neue Session (Zaehler von vorn) oder erste Pose: alles nachfordern.
  if (!pose || d.seq < lastSeq || (d.active && pose.active === false)) {
    lastRequestAt = 0;
    requestResend();
  }
  lastSeq = d.seq;
  pose = d;
  poseAt = performance.now();
  poseFresh = true;
  rateCount++;
});

topic(TOPICS.vrTeleopMirrorState, { queue_length: 5 }).subscribe((msg) => {
  const d = parse(msg);
  if (!d) return;
  state = d;
  if (h && d.twin) twin.applyTwinMirrorState(d.twin);
});

topic(TOPICS.vrTeleopMirrorUi, { queue_length: 20 }).subscribe((msg) => {
  const d = parse(msg);
  if (!d || d.v !== 1 || typeof d.img !== 'string' || !d.img.startsWith('data:image/')) return;
  const s = ensureSurface(d.id);
  s.mesh.renderOrder = Number(d.order) || 0;
  s.mesh.material.depthTest = d.depthTest !== false;
  s.mesh.material.depthWrite = d.depthTest !== false;
  const ticket = ++s.loadSeq;
  const img = new Image();
  img.onload = () => {
    if (ticket !== s.loadSeq) return;          // ein neueres Bild war schneller
    if (s.tex.image && (s.tex.image.width !== img.width || s.tex.image.height !== img.height)) s.tex.dispose();
    s.tex.image = img;
    s.tex.needsUpdate = true;
    s.hasImg = true;
  };
  img.src = d.img;
});

// Dieselben ROS-Daten wie in der Brille (grasp.js, motion.js).
const markerTopic = (name) => new ROSLIB.Topic({
  ros, name, messageType: 'visualization_msgs/MarkerArray', throttle_rate: 100, queue_length: 1,
});
[TOPICS.zedBboxes3d, TOPICS.virtualBboxes3d, TOPICS.zedYoloCollisionMarkers].forEach((name) => {
  const virtual = name === TOPICS.virtualBboxes3d;
  markerTopic(name).subscribe((msg) => twin.updateDigitalTwinDetections((msg && msg.markers) || [], { virtual }));
});

topic(TOPICS.movetoPreviewPath).subscribe((msg) => {
  const d = parse(msg);
  if (!d || d.clear) twin.clearDigitalTwinPathPreview();
  else twin.showDigitalTwinPathPreview(d);
});

// Ohne Brille trotzdem den echten Roboter zeigen.
const JOINTS = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6'];
new ROSLIB.Topic({
  ros, name: TOPICS.jointStates, messageType: 'sensor_msgs/JointState', throttle_rate: 33, queue_length: 1,
}).subscribe((msg) => {
  if (isLive()) return;
  const vals = JOINTS.map(n => msg.position[msg.name.indexOf(n)]);
  if (vals.every(Number.isFinite)) twin.updateDigitalTwinJoints(vals);
});

// ── UI-Flaechen ─────────────────────────────────────────────────────────────
function ensureSurface(id) {
  let s = surfaces.get(id);
  if (s) return s;
  const tex = new THREE.Texture();
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
  tracked(mesh);
  s = { mesh, tex, loadSeq: 0, hasImg: false };
  surfaces.set(id, s);
  return s;
}

// ── Posen anwenden ──────────────────────────────────────────────────────────
function setTarget(obj, arr) {
  if (!Array.isArray(arr) || arr.length < 7 || !arr.slice(0, 7).every(Number.isFinite)) {
    obj.visible = false;
    obj.userData.target.snap = true;
    return false;
  }
  const t = obj.userData.target;
  t.p.set(arr[0], arr[1], arr[2]);
  t.q.set(arr[3], arr[4], arr[5], arr[6]).normalize();
  obj.visible = true;
  return true;
}

function applyPose(d) {
  if (Array.isArray(d.head) && d.head.length === 11 && d.head.every(Number.isFinite)) {
    headTarget.p.set(d.head[0], d.head[1], d.head[2]);
    headTarget.q.set(d.head[3], d.head[4], d.head[5], d.head[6]).normalize();
    headTarget.fov = d.head.slice(7, 11);
    if (!headSeen) {
      h.camera.position.copy(headTarget.p);
      h.camera.quaternion.copy(headTarget.q);
      headSeen = true;
    }
  }
  setTarget(hands.left, d.hands && d.hands.left);
  setTarget(hands.right, d.hands && d.hands.right);
  if (setTarget(ray, d.ray)) {
    laser.scale.z = Number(d.ray[7]) || 1;
    laser.material.color.setHex(Number(d.ray[8]) || 0x38bdf8);
  }
  const rt = d.reticle;
  reticle.visible = Array.isArray(rt) && rt.length === 3 && rt.every(Number.isFinite);
  if (reticle.visible) reticle.position.set(rt[0], rt[1], rt[2]);
  setTarget(floorDisc, d.floor);

  const listed = new Set();
  let missing = false;
  for (const u of Array.isArray(d.ui) ? d.ui : []) {
    if (!Array.isArray(u) || u.length < 10) continue;
    const s = ensureSurface(u[0]);
    listed.add(u[0]);
    if (setTarget(s.mesh, u.slice(1, 8))) s.mesh.scale.set(Number(u[8]) || 1, Number(u[9]) || 1, 1);
    if (!s.hasImg) { s.mesh.visible = false; missing = true; }
  }
  for (const [id, s] of surfaces) {
    if (!listed.has(id)) { s.mesh.visible = false; s.mesh.userData.target.snap = true; }
  }
  if (missing) requestResend();
  twin.applyTwinMirrorPose(d.twin);
}

function hideXRObjects() {
  for (const o of root.children) {
    o.visible = false;
    if (o.userData.target) o.userData.target.snap = true;
  }
}

// Exponentiell zum Ziel; beim ersten Auftauchen direkt hinspringen.
function follow(obj, k) {
  const t = obj.userData.target;
  if (!obj.visible) return;
  if (t.snap) {
    obj.position.copy(t.p);
    obj.quaternion.copy(t.q);
    t.snap = false;
  } else {
    obj.position.lerp(t.p, k);
    obj.quaternion.slerp(t.q, k);
  }
}

// Viewport-Groesse je Modus. Im Modus 'fit' bekommt der Viewport das
// Seitenverhaeltnis der Brille und sitzt mittig in #mirror-stage (Flexbox);
// der Twin passt Renderer und Kamera per ResizeObserver selbst an.
function layoutViewport(fov) {
  const stage = $('mirror-stage'), vp = $('digital-twin-viewport');
  const W = stage.clientWidth, H = stage.clientHeight;
  if (!W || !H) return;
  let w = W, hgt = H;
  if (fitMode === 'fit' && fov) {
    const src = (fov[1] - fov[0]) / (fov[3] - fov[2]);
    if (W / H > src) w = Math.round(H * src);
    else hgt = Math.round(W / src);
  }
  const key = `${w}x${hgt}`;
  if (key === boxKey) return;
  boxKey = key;
  vp.style.width = `${w}px`;
  vp.style.height = `${hgt}px`;
}

// Sichtfeld der Brille auf den Viewport: passt das Seitenverhaeltnis nicht
// (Modus 'fill'), wird nicht verzerrt, sondern oben/unten bzw. links/rechts
// beschnitten. camera.fov bleibt der Brillenwert - danach richtet sich die
// Groesse des TCP-Gizmos, wie in der Brille.
function applyProjection(cam, fov, w, hgt) {
  let [l, r, b, t] = fov;
  const src = (r - l) / (t - b), dst = w / hgt;
  if (dst > src) {
    const cy = (t + b) / 2, half = (r - l) / dst / 2;
    b = cy - half; t = cy + half;
  } else {
    const cx = (l + r) / 2, half = (t - b) * dst / 2;
    l = cx - half; r = cx + half;
  }
  const k = cam.near / zoom;
  cam.projectionMatrix.makePerspective(l * k, r * k, t * k, b * k, cam.near, cam.far);
  cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  cam.fov = THREE.MathUtils.radToDeg(2 * Math.atan((fov[3] - fov[2]) / 2));
}

function isLive() {
  return !!(pose && pose.active !== false && performance.now() - poseAt < STALE_MS);
}

// ── Render-Schleife ─────────────────────────────────────────────────────────
function frame(now) {
  requestAnimationFrame(frame);
  if (!h || document.hidden) return;
  const dt = lastFrameT ? Math.min(0.1, (now - lastFrameT) / 1000) : 0;
  lastFrameT = now;
  const live = isLive();

  if (now - rateAt >= 1000) {
    rate = Math.round(rateCount * 1000 / Math.max(1, now - rateAt));
    rateCount = 0;
    rateAt = now;
  }
  updateOverlay(live, now);

  const fresh = poseFresh;
  if (poseFresh) {
    poseFresh = false;
    if (pose.active === false) hideXRObjects();
    else applyPose(pose);
  }
  if (!live && !fresh && now - lastRenderAt < IDLE_FRAME_MS) return;

  const k = 1 - Math.exp(-dt / SMOOTH_TAU);
  if (headSeen) {
    h.camera.position.lerp(headTarget.p, k);
    h.camera.quaternion.slerp(headTarget.q, k);
    h.camera.updateMatrixWorld(true);
  }
  for (const obj of root.children) if (obj.userData.target) follow(obj, k);
  layoutViewport(headTarget.fov);
  const el = h.renderer.domElement;
  if (headTarget.fov && el.clientWidth > 0 && el.clientHeight > 0) {
    applyProjection(h.camera, headTarget.fov, el.clientWidth, el.clientHeight);
  }

  twin.runTwinFrameUpdates();
  h.renderer.render(h.scene, h.camera);
  lastRenderAt = now;
}

function waitForTwin() {
  h = twin.getTwinXRHandles();
  if (!h) { setTimeout(waitForTwin, 100); return; }
  if (h.controls) h.controls.enabled = false;
  buildObjects();
  if (state && state.twin) twin.applyTwinMirrorState(state.twin);
  requestAnimationFrame(frame);
}

// ── Overlay: Status, Zoom, Vollbild ─────────────────────────────────────────
const $ = (id) => document.getElementById(id);
let lastOverlayKey = '', lastPointerAt = 0;

function updateOverlay(live, now) {
  const rosOk = !!(ros && ros.isConnected);
  let status, msg, cls;
  if (!rosOk) {
    status = 'ROS disconnected'; cls = 'is-off';
    msg = 'No connection to rosbridge (port 9090).';
  } else if (live) {
    status = 'Live'; cls = 'is-live'; msg = '';
  } else if (pose && pose.active === false) {
    status = 'Session ended'; cls = 'is-wait';
    msg = 'The VR session has ended. As soon as it starts again in the headset, its view appears here.';
  } else {
    status = 'Waiting for headset'; cls = 'is-wait';
    msg = 'Open the Robot Control UI (https://<PC>:8443) on the Quest 3 and start VR.';
  }
  const kind = state && state.kind === 'ar' ? 'Passthrough (camera image not mirrored)' : 'VR';
  const key = [status, msg, kind, live ? rate : '', zoom.toFixed(2), fitMode].join('|');
  if (key !== lastOverlayKey) {
    lastOverlayKey = key;
    $('mirror-status').className = `mirror-chip mirror-status ${cls}`;
    $('mirror-status-text').textContent = status;
    $('mirror-view').textContent = kind;
    $('mirror-rate').textContent = live ? `${rate} Hz` : '– Hz';
    $('mirror-zoom').textContent = `Zoom ${zoom.toFixed(2)}×`;
    $('btn-mirror-fit').textContent = fitMode === 'fit' ? 'Fill window' : 'Full field of view';
    $('mirror-msg').textContent = msg;
    $('mirror-msg').hidden = !msg;
  }
  // Bei laufendem Bild blendet die Leiste aus, bis sich die Maus bewegt.
  document.body.classList.toggle('mirror-idle', live && now - lastPointerAt > OVERLAY_IDLE_MS);
}

function setZoom(z) {
  zoom = clampZoom(z);
  lsSet(ZOOM_LS_KEY, String(zoom));
  lastRenderAt = 0;
}

function toggleFit() {
  fitMode = fitMode === 'fit' ? 'fill' : 'fit';
  lsSet(FIT_LS_KEY, fitMode);
  lastRenderAt = 0;
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else document.documentElement.requestFullscreen().catch(() => {});
}

function initOverlay() {
  window.addEventListener('pointermove', () => { lastPointerAt = performance.now(); });
  window.addEventListener('wheel', (e) => {
    e.preventDefault();
    setZoom(zoom * Math.exp(-e.deltaY * 0.001));
  }, { passive: false });
  window.addEventListener('dblclick', (e) => {
    if (e.target.closest('button')) return;
    setZoom(1);
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === '0') setZoom(1);
    else if (e.key === '+') setZoom(zoom * 1.1);
    else if (e.key === '-') setZoom(zoom / 1.1);
    else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
  });
  $('btn-mirror-reset').addEventListener('click', () => setZoom(1));
  $('btn-mirror-fit').addEventListener('click', toggleFit);
  $('btn-mirror-fullscreen').addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', () => {
    const i = $('btn-mirror-fullscreen').querySelector('i');
    if (i) i.className = document.fullscreenElement ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
  });
}

ros.on('connection', () => { lastRequestAt = 0; requestResend(); });
if (ros.isConnected) requestResend();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { initOverlay(); waitForTwin(); });
} else {
  initOverlay();
  waitForTwin();
}
