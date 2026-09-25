// ── Nozzle-Kamera: VR-Blick aus der Kamera am Endeffektor ──────────────────
//
// Die Kamera sitzt mit etwas Abstand hinter der Duese am Flansch (link_eef:
// +Z = Werkzeugrichtung, +X = TCP-X) und filmt schraeg in +X-Richtung: oben
// im Bild die Duese/der Greifer, darunter der Bereich unter dem Greifer.
//
//          Flansch ─┬─              Blick: um TILT aus der Duesenachse
//      Kamera ●     │ Duese         zur +X-Seite gekippt, Bild-oben zeigt
//              ╲    ▼               zur Duese.
//               ╲   ·
//                ╲  ·  Bereich unter dem Greifer
//
// Ist die Ansicht an, setzt xr.js das Rig jedes Frame so, dass der Kopf in
// seiner Referenzhaltung genau in dieser Kamera sitzt und durch sie blickt -
// die Sicht folgt jeder Roboterbewegung. Referenz = Kopfposition und
// Blickrichtung (nur Yaw) beim Einschalten bzw. Zentrieren (A rechts). Kopf
// drehen und leicht bewegen bleibt moeglich (Umschauen, Parallaxe).
//
// Die Einbaulage ist nicht vermessen: MOUNT_POS hier anpassen, die Neigung
// laesst sich in der Brille einstellen und wird gespeichert.

import * as THREE from 'three';
import * as twin from './digital_twin.js';
import { lsGet, lsSet } from '../util.js';

const LS_KEY = 'robot_control_xr_nozzle_cam_v1';
const EEF_LINKS = ['link_eef', 'link6'];
// Kamera im link_eef-Frame [m]: 7,5 cm hinter der Duesenachse (-X),
// 2 cm unterhalb der Flanschflaeche.
const MOUNT_POS = new THREE.Vector3(-0.075, 0, 0.02);
export const TILT_DEFAULT_DEG = 30;   // Winkel Duesenachse -> Blickrichtung
const TILT_MIN_DEG = 0, TILT_MAX_DEG = 90;
// /joint_states kommt mit ~30 Hz, die Brille rendert mit 72-90 Hz. Leicht
// nachziehen (Zeitkonstante ~40 ms), sonst ruckelt die Sicht in Stufen.
const FOLLOW_RATE = 25;               // 1/s
const SNAP_DIST = 0.3;                // m, groessere Spruenge sofort

let active = false;
let tiltDeg = loadTilt();
let needRef = true, needSnap = true;

const ONE = new THREE.Vector3(1, 1, 1);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const _mount = new THREE.Matrix4();
const _refInv = new THREE.Matrix4().makeTranslation(0, -1.6, 0);
const _m = new THREE.Matrix4();
const _pos = new THREE.Vector3(), _quat = new THREE.Quaternion(), _scl = new THREE.Vector3();
const camPos = new THREE.Vector3(), camQuat = new THREE.Quaternion();
const _q = new THREE.Quaternion(), _f = new THREE.Vector3();

function loadTilt() {
  let st = null;
  try { st = JSON.parse(lsGet(LS_KEY) || 'null'); } catch (e) { st = null; }
  const t = st && Number(st.tilt);
  return Number.isFinite(t) ? THREE.MathUtils.clamp(t, TILT_MIN_DEG, TILT_MAX_DEG) : TILT_DEFAULT_DEG;
}

// Kamera im link_eef-Frame, in XR-Kamerakonvention (-Z = Blick, +Y = oben,
// +X = rechts). Blick = (sin a, 0, cos a), Bild oben = (cos a, 0, -sin a).
function buildMount() {
  const a = THREE.MathUtils.degToRad(tiltDeg);
  const s = Math.sin(a), c = Math.cos(a);
  _mount.makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(c, 0, -s), new THREE.Vector3(-s, 0, -c));
  _mount.setPosition(MOUNT_POS);
}
buildMount();

export const isNozzleCamActive = () => active;
export const getNozzleTiltDeg = () => tiltDeg;
export const isNozzleCamAvailable = () => Boolean(twin.getTwinLinkWorldMatrix(EEF_LINKS));

export function setNozzleCam(on) {
  active = Boolean(on);
  needRef = needSnap = true;
}

export function recenterNozzleCam() {
  needRef = true;
}

export function stepNozzleTilt(deltaDeg) {
  setNozzleTilt(tiltDeg + deltaDeg);
}

export function setNozzleTilt(deg) {
  tiltDeg = THREE.MathUtils.clamp(Math.round(deg), TILT_MIN_DEG, TILT_MAX_DEG);
  lsSet(LS_KEY, JSON.stringify({ tilt: tiltDeg }));
  buildMount();
}

// Kopfhaltung als Referenz: dort sitzt das Auge genau in der Kamera.
function captureRef(frame, renderer) {
  const space = renderer.xr.getReferenceSpace();
  const pose = frame && space ? frame.getViewerPose(space) : null;
  if (!pose) return;                  // naechstes Frame erneut
  const p = pose.transform.position, o = pose.transform.orientation;
  _q.set(o.x, o.y, o.z, o.w);
  _f.set(0, 0, -1).applyQuaternion(_q);
  _q.setFromAxisAngle(Y_AXIS, Math.atan2(-_f.x, -_f.z));
  _refInv.compose(_pos.set(p.x, p.y, p.z), _q, ONE).invert();
  needRef = false;
}

// Rig so setzen, dass Rig * Kopf-Referenz = Kamera. false, solange es kein
// Robotermodell gibt (dann bleibt das Rig, wo es ist).
export function updateNozzleCam(frame, renderer, rig, dt) {
  if (!active) return false;
  const eef = twin.getTwinLinkWorldMatrix(EEF_LINKS);
  if (!eef) return false;
  if (needRef) captureRef(frame, renderer);
  _m.multiplyMatrices(eef, _mount).decompose(_pos, _quat, _scl);
  if (needSnap || camPos.distanceTo(_pos) > SNAP_DIST) {
    camPos.copy(_pos);
    camQuat.copy(_quat);
    needSnap = false;
  } else {
    const k = 1 - Math.exp(-(dt || 0) * FOLLOW_RATE);
    camPos.lerp(_pos, k);
    camQuat.slerp(_quat, k);
  }
  _m.compose(camPos, camQuat, ONE).multiply(_refInv);
  _m.decompose(rig.position, rig.quaternion, _scl);
  rig.scale.set(1, 1, 1);
  return true;
}
