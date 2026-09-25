// ── Einstieg der Robot Control UI (ES-Module) ──────────────────────────────
//
// Ersetzt das fruehere app.js (ein Skript, alles global). Die Module:
//   util.js      Helfer, Posen-Pruefung, Grenzwerte     (Basis, keine Abhaengigkeiten)
//   log.js       Log-Panel                              (Basis)
//   config.js    Topic-/Service-Namen                   (Basis)
//   ros.js       rosbridge, Offline-Overlay, Sperre     (Basis, Hooks statt Imports)
//   audio.js     Klick-Sound, Sprachausgabe, Sound-Schalter
//   jog.js       Kartesisch/Gelenk-Jog, Joystick, Floor Guard, Totmann
//   safety.js    Telemetrie, Sicherheitsbewertung, Not-Aus
//   motion.js    MoveTo, Initialpose, Scan, Speed, MoveIt-Popup, Pfad-Vorschau, Kollisionsschalter
//   gizmo.js     TCP-Gizmo-Ausfuehrung, Tastaturkuerzel
//   grasp.js     YOLO-Liste, Objekt-Kontextmenue, Greifen, Greifer
//   voice.js     Whisper
//   layout.js    Drag-and-Drop, HUD-Tabs, einklappbare Panels, Twin-Schalter
//   status.js    Port-Status, Gamepad-API
//   tf_tuner.js  TF Control Tuner, Szenen-Nodes
//   uievents.js  Globaler Klick-Debounce
//   streams.js   Kamera- und RViz-Streams
//   persist.js   Letzten UI-Zustand speichern / wiederherstellen
//   columns.js   Aussenspalten: Breite ziehen, ein-/ausklappen
//   twin/        Digital Twin (three.js), xr.js = VR-Viewport Quest 3 (WebXR)
//
// Statt globaler window.*-Funktionen fuer Inline-Handler tragen die Elemente
// data-Attribute; die Zuordnung zur Funktion steht unten in ACTIONS.
//   data-action="fn" [data-args='[..]'] [data-click-sound]   Klick
//   data-input="fn" / data-change="fn" [data-args='[..]']     fn(...args, value)
//   data-open-port="8080" [data-open-path="/x.html"]           Link auf andere Dienste

import './util.js';
import './log.js';
import './ros.js';
import { playUiClickSound, toggleSound } from './audio.js';
import { setFrame, updateLinearAxis } from './jog.js';
import { emergencyStop, resetEmergencyStop } from './safety.js';
import {
  confirmMoveToPreview, hideMoveitPopup, moveToPose, setInitialPose, showScene,
  requestMotion, startObjectScan, toggleMoveToPreview, toggleMoveitCollision, updateScanSpeed, updateSpeed,
} from './motion.js';
import { executeMoveToPoseFromGizmo } from './gizmo.js';
import { executeGrasp, setGripper } from './grasp.js';
import { startListening } from './voice.js';
import { toggleTwinPointCloud } from './pointcloud.js';
import { commitGroundLevel, hideGroundCollPopup, inputGroundLevel, stepGroundLevel } from './ground_popup.js';
import {
  toggleAllHudTabs, toggleHeaderCollapsed, toggleHudTab, toggleTFTunerCollapse, toggleTwinDetections, toggleTwinDistanceLine,
} from './layout.js';
import './status.js';
import {
  onTunerElementChange, onTunerNumChange, onTunerSliderInput, resetCurrentTFElement,
  toggleSceneNode, toggleTFBroadcast,
} from './tf_tuner.js';
import './uievents.js';
import './streams.js';
import './persist.js';
import './columns.js';
import './panel_snap.js';
import {
  cycleTCPGizmoMode, resetDigitalTwinView, setDigitalTwinDetectionFlip, setDigitalTwinLabelScale,
  setDigitalTwinTopView, syncTCPGizmoToRobot, testDigitalTwinSafetyCycle, toggleDigitalTwinEdges,
  toggleDigitalTwinGrid, toggleTCPGizmo,
} from './twin/digital_twin.js';
import { enterTwinXR } from './twin/xr.js';

const ACTIONS = {
  // Sicherheit
  emergencyStop, resetEmergencyStop,
  // Bewegung
  moveToPose, requestMotion, setInitialPose, showScene, startObjectScan, executeMoveToPoseFromGizmo,
  confirmMoveToPreview, hideMoveitPopup, toggleMoveToPreview, toggleMoveitCollision,
  commitGroundLevel, hideGroundCollPopup, inputGroundLevel, stepGroundLevel,
  updateSpeed, updateScanSpeed, setFrame, updateLinearAxis,
  // Greifen
  executeGrasp, setGripper,
  // Digital Twin
  cycleTCPGizmoMode, resetDigitalTwinView, setDigitalTwinTopView, syncTCPGizmoToRobot,
  testDigitalTwinSafetyCycle, toggleDigitalTwinEdges, toggleDigitalTwinGrid, toggleTCPGizmo,
  toggleTwinDetections, toggleTwinDistanceLine, toggleTwinPointCloud, enterTwinXR,
  // Layout
  toggleAllHudTabs, toggleHeaderCollapsed, toggleHudTab, toggleTFTunerCollapse,
  // TF Tuner
  onTunerElementChange, onTunerNumChange, onTunerSliderInput, resetCurrentTFElement,
  toggleSceneNode, toggleTFBroadcast,
  // Sonstiges
  startListening, toggleSound,
  reloadPage: () => location.reload(),
  // VR-Spiegel: zeigt in einem eigenen Fenster, was die Quest 3 sieht.
  // Fester Fenstername - ein zweiter Klick holt dasselbe Fenster nach vorn.
  // Etwa das Seitenverhaeltnis der Brille - so bleibt kaum Rand.
  openVRMirror: () => window.open('vr_mirror.html', 'vr_mirror', 'popup,width=1120,height=900'),
};

function argsOf(el) {
  if (!el.dataset.args) return [];
  try {
    const a = JSON.parse(el.dataset.args);
    return Array.isArray(a) ? a : [a];
  } catch (e) {
    console.error('[main] invalid data-args', el, e);
    return [];
  }
}

function run(name, el, args) {
  const fn = ACTIONS[name];
  if (typeof fn !== 'function') {
    console.error(`[main] unknown action "${name}"`, el);
    return;
  }
  fn(...args);
}

// Bubble-Phase: der Debounce in uievents.js laeuft in der Capture-Phase und
// stoppt gesperrte oder gerade geklickte Buttons vorher.
document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-open-port]');
  if (link) {
    const host = window.location.hostname || 'localhost';
    window.open(`http://${host}:${link.dataset.openPort}${link.dataset.openPath || ''}`, '_blank');
    return;
  }
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  if ('clickSound' in el.dataset) playUiClickSound();
  run(el.dataset.action, el, argsOf(el));
});

['input', 'change'].forEach((type) => {
  document.addEventListener(type, (e) => {
    const el = e.target.closest(`[data-${type}]`);
    if (!el) return;
    run(el.dataset[type], el, [...argsOf(el), el.value]);
  });
});

// Feinjustage der YOLO-Darstellung von der Browser-Konsole aus - bewusst
// als einziges, benanntes Objekt statt einzelner window.*-Funktionen:
//   twinDebug.setDetectionFlip('y'), twinDebug.setLabelScale(0.45)
window.twinDebug = Object.freeze({
  setDetectionFlip: setDigitalTwinDetectionFlip,
  setLabelScale: setDigitalTwinLabelScale,
});
