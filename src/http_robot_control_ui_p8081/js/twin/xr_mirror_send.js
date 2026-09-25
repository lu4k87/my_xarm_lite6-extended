// ── VR-Spiegel, Sender (laeuft in der Brille, aufgerufen aus xr.js) ────────
//
// Waehrend einer XR-Session gehen ueber rosbridge an das Spiegelfenster am PC
// (vr_mirror.html, js/vr_mirror.js):
//   /vr_teleop/mirror_pose   jedes Frame (max. 50 Hz): Kopf-Pose + Sichtfeld,
//                            Controller, Laser, Boden, Lage aller UI-Flaechen,
//                            Gelenke/Linearachse/Gizmo-Ziel des Twins
//   /vr_teleop/mirror_state  bei Aenderung (max. 10 Hz, sonst alle 2 s):
//                            Twin-Schalter, Auswahl, Sicherheitszustand
//   /vr_teleop/mirror_ui     Bild einer UI-Flaeche, nur wenn sie neu gezeichnet
//                            wurde (WebP, max. 4 Bilder/s je Flaeche)
//   /vr_teleop/mirror_request  (vom PC) Heartbeat alle 2 s, bei Bedarf mit
//                            resend: alles einmal nachsenden
//
// Gesendet wird nur, solange ein Spiegelfenster offen ist (Heartbeat) - sonst
// kostet der Spiegel die Brille nichts. Sie rendert auch nichts zusaetzlich:
// der PC zeichnet dieselbe Szene selbst aus der Kopfposition. UI-Flaechen
// (Handgelenk-Panel, HUD) werden generisch gefunden: jedes Mesh mit
// CanvasTexture unter dem Rig.

import * as THREE from 'three';
import * as twin from './digital_twin.js';
import { TOPICS } from '../config.js';
import { ros } from '../ros.js';
import { logMsg } from '../log.js';
import { isTwinPointCloudOn } from '../pointcloud.js';

const POSE_MS = 20;
const STATE_MS = 100;
const STATE_KEEPALIVE_MS = 2000;
const UI_MIN_MS = 250;
const UI_SCALE = 0.75;          // Aufloesung der uebertragenen Flaechen
const UI_QUALITY = 0.85;
const ENCODE_TIMEOUT_MS = 3000;
const WATCH_TIMEOUT_MS = 5000;  // so lange nach dem letzten Heartbeat senden

let poseTopic = null, stateTopic = null, uiTopic = null, requestTopic = null;
let active = false;
let watchedAt = -Infinity;      // letzter Heartbeat eines Spiegelfensters
let seq = 0;
let lastPoseAt = 0, lastStateAt = 0, lastStateSentAt = 0, lastStateJson = '';
const surfaces = new Map();     // Mesh -> { id, mesh, version, busy, sentAt, img }
let nextSurfaceId = 1;
let worker = null, workerBroken = false;
let jobSeq = 0;
const jobs = new Map();         // Job-Id -> resolve

const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
const r4 = (v) => Math.round(v * 1e4) / 1e4;
const r5 = (v) => Math.round(v * 1e5) / 1e5;

// Welt-Pose (ROS-Frame) als [x, y, z, qx, qy, qz, qw]; Skalierung bleibt in _s.
function pose(obj) {
  obj.matrixWorld.decompose(_p, _q, _s);
  return [r4(_p.x), r4(_p.y), r4(_p.z), r5(_q.x), r5(_q.y), r5(_q.z), r5(_q.w)];
}

// Sichtbar = es selbst und alle Eltern sichtbar.
function shown(obj) {
  for (let o = obj; o; o = o.parent) if (!o.visible) return false;
  return true;
}

function send(topic, obj) {
  topic.publish(new ROSLIB.Message({ data: JSON.stringify(obj) }));
}

function ensureTopics() {
  if (poseTopic) return;
  const t = (name, extra) => new ROSLIB.Topic({ ros, name, messageType: 'std_msgs/String', ...extra });
  poseTopic = t(TOPICS.vrTeleopMirrorPose, { queue_size: 1 });
  stateTopic = t(TOPICS.vrTeleopMirrorState, { queue_size: 5 });
  uiTopic = t(TOPICS.vrTeleopMirrorUi, { queue_size: 20 });
  requestTopic = t(TOPICS.vrTeleopMirrorRequest, { queue_length: 5 });
  requestTopic.subscribe(onRequest);
}

// Heartbeat eines Spiegelfensters; resend: es ist neu oder hat Flaechen ohne Bild.
function onRequest(msg) {
  let d = null;
  try { d = JSON.parse(msg.data); } catch (e) { return; }
  watchedAt = performance.now();
  if (!d || !d.resend || !active || !(ros && ros.isConnected)) return;
  lastStateJson = '';
  for (const s of surfaces.values()) if (s.img) publishUi(s);
}

// ── UI-Flaechen: Bild kodieren ──────────────────────────────────────────────
function ensureWorker() {
  if (worker) return true;
  if (workerBroken) return false;
  try {
    worker = new Worker(new URL('./xr_mirror_worker.js', import.meta.url));
    worker.onmessage = (e) => {
      const { id, url, error } = e.data || {};
      const done = jobs.get(id);
      jobs.delete(id);
      if (error) console.warn('[xr-mirror] encode failed:', error);
      if (done) done(url || null);
    };
    worker.onerror = (e) => {
      console.error('[xr-mirror] worker error', e);
      workerBroken = true;
      logMsg('VR', '⚠ VR mirror: panel images unavailable (worker error)', 'warn');
    };
    return true;
  } catch (e) {
    workerBroken = true;
    console.error('[xr-mirror] worker not available', e);
    return false;
  }
}

function encode(canvas) {
  if (!ensureWorker() || typeof createImageBitmap !== 'function') return Promise.resolve(null);
  const w = Math.max(1, Math.round(canvas.width * UI_SCALE));
  const hgt = Math.max(1, Math.round(canvas.height * UI_SCALE));
  return createImageBitmap(canvas, { resizeWidth: w, resizeHeight: hgt, resizeQuality: 'high' }).then((bmp) => new Promise((resolve) => {
    const id = ++jobSeq;
    const timer = setTimeout(() => { jobs.delete(id); resolve(null); }, ENCODE_TIMEOUT_MS);
    jobs.set(id, (url) => { clearTimeout(timer); resolve(url); });
    worker.postMessage({ id, bmp, quality: UI_QUALITY }, [bmp]);
  }));
}

function publishUi(s) {
  const m = s.mesh.material;
  send(uiTopic, {
    v: 1, id: s.id, name: s.mesh.name || '',
    order: s.mesh.renderOrder, depthTest: m.depthTest !== false,
    img: s.img,
  });
}

// Neu kodieren, sobald die Textur neu hochgeladen wurde (needsUpdate zaehlt
// version hoch). Gleiches Ergebnis wird nicht erneut geschickt.
function refreshSurface(s, now) {
  const tex = s.mesh.material.map;
  if (tex.version === s.version || s.busy || now - s.sentAt < UI_MIN_MS) return;
  const canvas = tex.image;
  if (!canvas || !canvas.width || !canvas.height) return;
  s.version = tex.version;
  s.busy = true;
  s.sentAt = now;
  encode(canvas).then((img) => {
    s.busy = false;
    if (!img || img === s.img) return;
    s.img = img;
    if (active && ros && ros.isConnected) publishUi(s);
  }).catch((e) => {
    s.busy = false;
    console.warn('[xr-mirror] snapshot failed', e);
  });
}

function collectSurfaces(rig, now) {
  const list = [];
  rig.traverse((o) => {
    const map = o.isMesh && o.material && o.material.map;
    if (!map || !map.isCanvasTexture) return;
    let s = surfaces.get(o);
    if (!s) {
      s = { id: nextSurfaceId++, mesh: o, version: -1, busy: false, sentAt: 0, img: null };
      surfaces.set(o, s);
    }
    if (!shown(o)) return;
    const pp = o.geometry && o.geometry.parameters ? o.geometry.parameters : {};
    const ps = pose(o);
    list.push([s.id, ...ps, r4((pp.width || 1) * _s.x), r4((pp.height || 1) * _s.y)]);
    refreshSurface(s, now);
  });
  return list;
}

// ── Pro XR-Frame (nach dem Rendern) ─────────────────────────────────────────
// ctx: { h: {camera}, rig, hands: {left, right}, laser, reticle, floorDisc, xrKind }
export function publishMirrorFrame(ctx) {
  if (!ros || !ros.isConnected || !ctx || !ctx.h || !ctx.rig) return;
  ensureTopics();
  const now = performance.now();
  if (now - watchedAt > WATCH_TIMEOUT_MS || now - lastPoseAt < POSE_MS) return;
  lastPoseAt = now;
  active = true;

  // Kopf: Kamera nach dem Rendern = Pose und Sichtfeld beider Augen zusammen
  // (three.js setzt sie aus der XR-Kamera). Sichtfeld als Tangenten
  // [links, rechts, unten, oben] - funktioniert auch asymmetrisch.
  const cam = ctx.h.camera;
  const e = cam.projectionMatrix.elements;
  const head = [...pose(cam),
    r5((e[8] - 1) / e[0]), r5((e[8] + 1) / e[0]), r5((e[9] - 1) / e[5]), r5((e[9] + 1) / e[5])];

  const hand = (entry) => (entry && entry.grip && shown(entry.grip) ? pose(entry.grip) : null);
  const { laser, reticle, floorDisc } = ctx;
  let ray = null;
  if (laser && shown(laser)) {
    const lp = pose(laser);
    ray = [...lp, r4(laser.scale.z), laser.material.color.getHex()];
  }
  send(poseTopic, {
    v: 1, seq: ++seq, active: true, kind: ctx.xrKind,
    head,
    hands: { left: hand(ctx.hands && ctx.hands.left), right: hand(ctx.hands && ctx.hands.right) },
    ray,
    reticle: reticle && shown(reticle) ? [r4(reticle.position.x), r4(reticle.position.y), r4(reticle.position.z)] : null,
    floor: floorDisc && shown(floorDisc) ? pose(floorDisc) : null,
    ui: collectSurfaces(ctx.rig, now),
    twin: twin.getTwinMirrorPose(),
  });

  if (now - lastStateAt >= STATE_MS) {
    lastStateAt = now;
    const json = JSON.stringify({ kind: ctx.xrKind, cloud: isTwinPointCloudOn(), twin: twin.getTwinMirrorState() });
    if (json !== lastStateJson || now - lastStateSentAt > STATE_KEEPALIVE_MS) {
      lastStateJson = json;
      lastStateSentAt = now;
      stateTopic.publish(new ROSLIB.Message({ data: json }));
    }
  }
}

// Session-Ende: der Spiegel zeigt "beendet" statt einer eingefrorenen Pose.
export function publishMirrorEnd() {
  const wasActive = active;
  active = false;
  lastStateJson = '';
  if (!wasActive || !poseTopic || !ros || !ros.isConnected) return;
  send(poseTopic, { v: 1, seq: ++seq, active: false });
}
