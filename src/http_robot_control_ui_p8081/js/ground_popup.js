import { TOPICS } from './config.js';
import * as twin from './twin/digital_twin.js';
import { logMsg } from './log.js';
import { ros } from './ros.js';
import { LIM, floorGuard } from './util.js';

// ── Ground-Collision-Popup im Viewport ───────────────────────────────────
// Erscheint nach dem Umschalten des Boden-Kollisions-Icons (SCENE-Panel)
// unten mittig im Viewport - eigene Rasterzeile "gc" ueber dem Not-Aus, also
// ohne Ueberlappung mit POSE & Co. Zeigt Status und die Z Collision Level
// (TCP-Hoehe) und laesst sie live verstellen. Der Wert gilt sofort fuer die
// UI-Bodensperre (floorGuard.levelMm) und geht an moveit_floor_collision,
// das die MoveIt-Box nachzieht und den gueltigen Wert latched zurueckmeldet.
const AUTO_HIDE_MS = 10000;   // ohne Bedienung wieder ausblenden
const SEND_DEBOUNCE_MS = 350; // Tippen im Feld: erst senden, wenn Ruhe ist

let hideTimer = null;
let sendTimer = null;

const levelSetPub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.setGroundCollisionLevel,
  messageType: 'std_msgs/Float64'
});

// Latched vom Node: Stand nach einem Reload und nach dem Klemmen auf min/max.
new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.groundCollisionLevel,
  messageType: 'std_msgs/Float64'
}).subscribe((msg) => {
  const mm = Number(msg.data);
  if (!Number.isFinite(mm)) return;
  floorGuard.levelMm = mm;
  renderLevel(false);
});

function popupEl() {
  return document.getElementById('ground-coll-popup');
}

function clampLevel(mm) {
  return Math.min(LIM.FLOOR_LEVEL_MAX_MM, Math.max(LIM.FLOOR_LEVEL_MIN_MM, mm));
}

// force=false: waehrend der Eingabe den Feldinhalt nicht ueberschreiben
function renderLevel(force = true) {
  const input = document.getElementById('gc-level');
  if (!input) return;
  if (!force && document.activeElement === input) return;
  input.value = String(Math.round(floorGuard.levelMm));
}

export function setGroundCollPopupState(state) {
  const badge = document.getElementById('gc-state');
  const popup = popupEl();
  if (!badge || !popup) return;
  badge.textContent = state === null ? 'NODE OFF' : state ? 'ON' : 'OFF';
  popup.dataset.state = state === null ? 'unknown' : state ? 'on' : 'off';
}

function armAutoHide() {
  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    const popup = popupEl();
    // Nicht mitten in der Bedienung schliessen
    if (popup && (popup.matches(':hover') || popup.contains(document.activeElement))) {
      armAutoHide();
      return;
    }
    hideGroundCollPopup();
  }, AUTO_HIDE_MS);
}

export function showGroundCollPopup(state) {
  const popup = popupEl();
  if (!popup) return;
  setGroundCollPopupState(state);
  renderLevel(true);
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
  if (!popup || popup.hidden) return;
  popup.classList.add('is-hiding');
  setTimeout(() => {
    if (!popup.classList.contains('is-hiding')) return;
    popup.hidden = true;
    popup.classList.remove('is-hiding');
    if (typeof twin.refitDigitalTwinHud === 'function') twin.refitDigitalTwinHud();
  }, 150);   // = Dauer von gc-fade-out
}

function applyLevel(mm, immediate) {
  const v = clampLevel(Math.round(mm));
  floorGuard.levelMm = v;   // UI-Sperre sofort, auch ohne laufenden Node
  renderLevel(immediate);
  armAutoHide();
  if (sendTimer) clearTimeout(sendTimer);
  const send = () => {
    sendTimer = null;
    levelSetPub.publish(new ROSLIB.Message({ data: v }));
    logMsg('SAFETY', `Z Collision Level set to ${v} mm`, 'info');
  };
  if (immediate) send();
  else sendTimer = setTimeout(send, SEND_DEBOUNCE_MS);
}

export function stepGroundLevel(deltaMm) {
  applyLevel(floorGuard.levelMm + Number(deltaMm), true);
}

// data-input: jede Eingabe, gesendet wird nach kurzer Ruhe
export function inputGroundLevel(value) {
  const mm = parseFloat(value);
  if (!Number.isFinite(mm)) return;
  applyLevel(mm, false);
}

// Enter/Fokusverlust: Feld auf den geklemmten Wert zuruecksetzen
export function commitGroundLevel() {
  renderLevel(true);
}
