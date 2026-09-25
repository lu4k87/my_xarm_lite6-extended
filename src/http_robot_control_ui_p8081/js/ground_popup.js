import { TOPICS } from './config.js';
import * as twin from './twin/digital_twin.js';
import { logMsg } from './log.js';
import { ros } from './ros.js';
import { LIM, floorGuard, lsGet, lsSet } from './util.js';

// ── Ground-Collision-Popup im Viewport ───────────────────────────────────
// Erscheint nur beim EINschalten des Boden-Kollisions-Icons (SCENE-Panel)
// unten mittig im Viewport - eigene Rasterzeile "gc" ueber dem Not-Aus, also
// ohne Ueberlappung mit POSE & Co. Das Feld ist mit dem zuletzt bestaetigten
// Z Collision Level (TCP-Hoehe) vorbelegt; +/- und Tippen aendern nur das
// Feld. Erst OK (oder Enter) uebernimmt den Wert: UI-Bodensperre
// (floorGuard.levelMm) sofort, dazu an moveit_floor_collision, das die
// MoveIt-Box nachzieht und den gueltigen Wert latched zurueckmeldet.
const AUTO_HIDE_MS = 10000;   // unveraendert und ohne Bedienung wieder ausblenden
const LS_KEY = 'groundCollisionLevelMm';   // zuletzt bestaetigter Wert

let hideTimer = null;
let dirty = false;   // Feld weicht vom uebernommenen Wert ab

const levelSetPub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.setGroundCollisionLevel,
  messageType: 'std_msgs/Float64'
});

// Latched vom Node: Stand nach einem Reload und nach dem Klemmen auf min/max.
// Das offene Feld bleibt unangetastet, dort steht die Eingabe des Nutzers.
new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.groundCollisionLevel,
  messageType: 'std_msgs/Float64'
}).subscribe((msg) => {
  const mm = Number(msg.data);
  if (!Number.isFinite(mm)) return;
  floorGuard.levelMm = mm;
});

function popupEl() {
  return document.getElementById('ground-coll-popup');
}

function inputEl() {
  return document.getElementById('gc-level');
}

function clampLevel(mm) {
  return Math.min(LIM.FLOOR_LEVEL_MAX_MM, Math.max(LIM.FLOOR_LEVEL_MIN_MM, mm));
}

// Vorbelegung: zuletzt per OK bestaetigter Wert, sonst der aktuelle Stand
function lastLevel() {
  const saved = parseFloat(lsGet(LS_KEY));
  return Number.isFinite(saved) ? clampLevel(saved) : floorGuard.levelMm;
}

function fieldLevel() {
  const mm = parseFloat(inputEl()?.value);
  return Number.isFinite(mm) ? mm : lastLevel();
}

function renderField(mm) {
  const input = inputEl();
  if (input) input.value = String(Math.round(mm));
}

export function setGroundCollPopupState(state) {
  const badge = document.getElementById('gc-state');
  const popup = popupEl();
  if (!badge || !popup) return;
  badge.textContent = state === null ? 'NODE OFF' : state ? 'ON' : 'OFF';
  popup.dataset.state = state === null ? 'unknown' : state ? 'on' : 'off';
  // Popup gehoert nur zur eingeschalteten Bodenkollision
  if (state !== true) hideGroundCollPopup();
}

function armAutoHide() {
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    const popup = popupEl();
    // Nicht mitten in der Bedienung oder mit offener Aenderung schliessen
    if (popup && (dirty || popup.matches(':hover') || popup.contains(document.activeElement))) {
      armAutoHide();
      return;
    }
    hideGroundCollPopup();
  }, AUTO_HIDE_MS);
}

export function showGroundCollPopup() {
  const popup = popupEl();
  if (!popup) return;
  setGroundCollPopupState(true);
  renderField(lastLevel());
  dirty = false;
  popup.classList.remove('is-hiding');
  if (popup.hidden) {
    popup.hidden = false;
    if (typeof twin.refitDigitalTwinHud === 'function') twin.refitDigitalTwinHud();
  }
  armAutoHide();
}

export function hideGroundCollPopup() {
  const popup = popupEl();
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  dirty = false;
  if (!popup || popup.hidden) return;
  popup.classList.add('is-hiding');
  setTimeout(() => {
    if (!popup.classList.contains('is-hiding')) return;
    popup.hidden = true;
    popup.classList.remove('is-hiding');
    if (typeof twin.refitDigitalTwinHud === 'function') twin.refitDigitalTwinHud();
  }, 150);   // = Dauer von gc-fade-out
}

export function stepGroundLevel(deltaMm) {
  renderField(clampLevel(Math.round(fieldLevel()) + Number(deltaMm)));
  dirty = true;
  armAutoHide();
}

// data-input: nur merken, uebernommen wird erst mit OK
export function inputGroundLevel() {
  dirty = true;
  armAutoHide();
}

// OK / Enter: Wert uebernehmen, senden, merken und schliessen
export function confirmGroundLevel() {
  const v = clampLevel(Math.round(fieldLevel()));
  renderField(v);
  floorGuard.levelMm = v;   // UI-Sperre sofort, auch ohne laufenden Node
  lsSet(LS_KEY, String(v));
  levelSetPub.publish(new ROSLIB.Message({ data: v }));
  logMsg('SAFETY', `Z Collision Level set to ${v} mm`, 'info');
  hideGroundCollPopup();
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || e.target !== inputEl()) return;
  e.preventDefault();
  confirmGroundLevel();
});
