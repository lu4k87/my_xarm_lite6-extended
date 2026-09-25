import { TOPICS } from './config.js';
import * as twin from './twin/digital_twin.js';
import { logMsg } from './log.js';
import { ros, rosHooks, rosNowMs, rosStampNow } from './ros.js';

// ── TF Control Tuner (Built-in Web Transform Broadcaster & Tuner) ────────────
export const TF_TUNER_ELEMENTS = {
  'Zed M Camera': {
    frame_id: 'zed_camera_link',
    x: 0.473, y: 0.0, z: 0.368,
    roll: 0.0, pitch: 57.5, yaw: 180.0,
    minX: -0.5, maxX: 1.0, minY: -0.5, maxY: 0.5, minZ: -0.5, maxZ: 1.0,
    default: { x: 0.473, y: 0.0, z: 0.368, roll: 0.0, pitch: 57.5, yaw: 180.0 }
  },
  'Blue Cube': {
    frame_id: 'target_blue_cube',
    x: 0.300, y: 0.085, z: 0.0,
    roll: 0.0, pitch: 0.0, yaw: 0.0,
    minX: -0.5, maxX: 1.0, minY: -0.5, maxY: 0.5, minZ: -0.5, maxZ: 1.0,
    default: { x: 0.300, y: 0.085, z: 0.0, roll: 0.0, pitch: 0.0, yaw: 0.0 }
  },
  'Red Rectangle': {
    frame_id: 'target_red_rectangle',
    x: 0.305, y: -0.080, z: 0.0,
    roll: 0.0, pitch: 0.0, yaw: 45.0,
    minX: -0.5, maxX: 1.0, minY: -0.5, maxY: 0.5, minZ: -0.5, maxZ: 1.0,
    default: { x: 0.305, y: -0.080, z: 0.0, roll: 0.0, pitch: 0.0, yaw: 45.0 }
  },
  'Green Cylinder': {
    frame_id: 'target_green_cylinder',
    x: 0.350, y: 0.025, z: 0.0,
    roll: 0.0, pitch: 0.0, yaw: 0.0,
    minX: -0.5, maxX: 1.0, minY: -0.5, maxY: 0.5, minZ: -0.5, maxZ: 1.0,
    default: { x: 0.350, y: 0.025, z: 0.0, roll: 0.0, pitch: 0.0, yaw: 0.0 }
  },
  'White Plane': {
    frame_id: 'target_white_plane',
    x: 0.305, y: 0.0, z: -0.003,
    roll: 0.0, pitch: 0.0, yaw: 0.0,
    minX: -0.5, maxX: 1.0, minY: -0.5, maxY: 0.5, minZ: -0.5, maxZ: 1.0,
    default: { x: 0.305, y: 0.0, z: -0.003, roll: 0.0, pitch: 0.0, yaw: 0.0 }
  },
  'Safety Zone': {
    frame_id: 'target_safety_zone',
    x: 0.0, y: 0.0, z: 0.0,
    roll: 0.0, pitch: 0.0, yaw: 0.0,
    // 138 mm = aeussere Grenze der nicht anfahrbaren Innenzone
    // ("INNER BOUNDARY SINGULARITY", siehe checkSafetyState weiter oben).
    // Dieser Wert geht per /ui/safety_zone_params an robot_motion_handler_movegroup
    // und setzt dort safe_radius, also auch den Bahnabstand der Scan-Trajektorie.
    radius: 0.138,
    minX: -0.5, maxX: 1.0, minY: -0.5, maxY: 0.5, minZ: -0.5, maxZ: 1.0,
    default: { x: 0.0, y: 0.0, z: 0.0, roll: 0.0, pitch: 0.0, yaw: 0.0, radius: 0.138 }
  }
};

export let currentTFTunerElement = 'Zed M Camera';
export let isTFBroadcastActive = false; // OFF by default: only active when the node runs or it is switched on manually
export let isSceneObjectsNodeRunning = false;
export let lastSceneMarkerTime = 0;
export let tfBroadcasterInterval = null;

// ROS Topics for TF and Safety Zone
export const tfTunerPub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.tf,
  messageType: 'tf2_msgs/TFMessage'
});

// ── Gemeinsamer Tuner-Zustand aller UI-Clients ──────────────────────────
// Jeder offene Client (Desktop, Quest 3, weiterer Tab) sendet die Tuner-Frames
// mit 10 Hz auf /tf - jeder mit seinen eigenen Werten aus dem localStorage.
// Zwei Clients kaempften so um denselben Frame, und Greifkugel, Waende und
// MoveIt-Kollision (virtual_object_detections) blieben an der alten Stelle
// stehen. Jede Aenderung geht deshalb latched auf /ui/tf_tuner_state, alle
// Clients uebernehmen sie und senden danach identische Werte.
const TUNER_CLIENT_ID = Math.random().toString(36).slice(2, 10);
const TUNER_STATE_SEND_MS = 50;
let tunerStateSendTimer = null;
// Kam der gemeinsame Zustand schon an, darf der localStorage-Stand beim
// Wiederherstellen (persist.js) ihn nicht mehr ueberschreiben.
let sharedTunerStateSeen = false;
// Beide rosbridges (9090 Desktop, 9091 Quest) halten je einen latched Stand -
// ein neu verbundener Client bekommt beide in beliebiger Reihenfolge. Es
// zaehlt nur der juengste (Zeit in ROS-Millisekunden).
let tunerStateTime = 0;

export const tfTunerStatePub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.tfTunerState,
  messageType: 'std_msgs/String',
  latch: true
});

// saved: die Werte wurden eben per "Save" festgeschrieben - die anderen
// Clients uebernehmen sie dann auch als gespeicherten Stand fuer ihr Badge.
function sendTunerState(saved = false) {
  if (tunerStateSendTimer !== null) clearTimeout(tunerStateSendTimer);
  tunerStateSendTimer = null;
  if (!ros || !ros.isConnected) return;
  tunerStateTime = rosNowMs();
  const msg = { client: TUNER_CLIENT_ID, t: tunerStateTime, values: getTunerState().values };
  if (saved) msg.saved = true;
  tfTunerStatePub.publish(new ROSLIB.Message({ data: JSON.stringify(msg) }));
}

// Nur nach einer Bedienung aufrufen, nie beim Wiederherstellen oder Uebernehmen.
function shareTunerState() {
  updateTunerSaveBadge();
  if (tunerStateSendTimer === null) tunerStateSendTimer = setTimeout(sendTunerState, TUNER_STATE_SEND_MS);
}

new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.tfTunerState,
  messageType: 'std_msgs/String'
}).subscribe((msg) => {
  let st;
  try { st = JSON.parse(msg.data); } catch (e) { return; }
  if (!st || st.client === TUNER_CLIENT_ID || !st.values) return;
  if (!(Number(st.t) > tunerStateTime)) return;
  tunerStateTime = Number(st.t);
  sharedTunerStateSeen = true;
  applyTunerValues(st.values);
  if (st.saved) savedTunerValues = st.values;
  updateTunerUI();
  updateTunerSaveBadge();
  if (twin.updateTunerSceneObjects) twin.updateTunerSceneObjects(TF_TUNER_ELEMENTS);
  broadcastAllTFTunerTransforms();
});

// ── Objekt-Frames fuer die virtuellen Objekte ───────────────────────────
// virtual_object_detections liest die Pose von Cube, Rectangle und Cylinder
// aus TF. Ohne Szenen-Node (static_objects:=false) und ohne "Live TF" kam
// dort nichts an, Greifkugel, Waende und MoveIt-Kollision blieben stehen.
// Solange die virtuellen Objekte aktiv sind, gehen deshalb diese drei Frames
// immer raus - nur sie, zed_camera_link bleibt beim statischen Kamera-TF.
const VIRTUAL_OBJECT_ELEMENTS = ['Blue Cube', 'Red Rectangle', 'Green Cylinder'];
const VIRTUAL_DETECTIONS_NODE = 'virtual_object_detections';
let virtualDetectionsEnabled = false;
let virtualDetectionsNodeRunning = false;

new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.virtualDetectionsEnabled,
  messageType: 'std_msgs/Bool'
}).subscribe((msg) => {
  virtualDetectionsEnabled = Boolean(msg.data);
  virtualDetectionsNodeRunning = true;
  broadcastAllTFTunerTransforms();
});

function virtualObjectsNeedTf() {
  return virtualDetectionsEnabled && virtualDetectionsNodeRunning;
}

// ── Werte fest speichern (Badge "Save") ─────────────────────────────────
// Die Werte liegen auf dem PC (server.py, /api/tf_tuner), nicht im
// localStorage des einzelnen Browsers. Beim Laden der Seite gewinnt dieser
// Stand ueber den localStorage - nur ein schon laufender gemeinsamer Stand
// (/ui/tf_tuner_state) ist noch aktueller.
const TUNER_API = 'api/tf_tuner';
let savedTunerValues = null;       // null = noch nie gespeichert / nicht geladen
let serverTunerValuesApplied = false;
let tunerSaveBusy = false;

function tunerValuesEqual(a, b) {
  if (!a || !b) return false;
  for (const [name, el] of Object.entries(TF_TUNER_ELEMENTS)) {
    if (!a[name] || !b[name]) return false;
    for (const f of TUNER_FIELDS) {
      if (typeof el[f] !== 'number') continue;
      if (Math.abs(Number(a[name][f]) - Number(b[name][f])) > 1e-6) return false;
    }
  }
  return true;
}

export function updateTunerSaveBadge(state) {
  const btn = document.getElementById('btn-tuner-save');
  const label = document.getElementById('tuner-save-label');
  if (!btn || !label) return;
  const clean = tunerValuesEqual(getTunerState().values, savedTunerValues);
  const mode = state || (tunerSaveBusy ? 'busy' : (clean ? 'saved' : 'dirty'));
  btn.classList.toggle('saved', mode === 'saved');
  btn.classList.toggle('dirty', mode === 'dirty');
  btn.classList.toggle('error', mode === 'error');
  btn.disabled = mode === 'busy';
  label.textContent = mode === 'saved' ? 'Saved' : mode === 'busy' ? 'Saving' : mode === 'error' ? 'Retry' : 'Save';
  btn.title = mode === 'saved'
    ? 'All TF tuner values are saved - loaded on every start (desktop and Quest 3)'
    : mode === 'error'
      ? 'Saving failed - click to try again'
      : 'Unsaved changes - click to store all TF tuner values permanently';
}

export async function saveTunerValues() {
  if (tunerSaveBusy) return;
  tunerSaveBusy = true;
  updateTunerSaveBadge();
  const values = getTunerState().values;
  try {
    const res = await fetch(TUNER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    savedTunerValues = values;
    tunerSaveBusy = false;
    updateTunerSaveBadge();
    sendTunerState(true);
    logMsg('TF-Tuner', '💾 TF tuner values saved permanently', 'success');
  } catch (e) {
    tunerSaveBusy = false;
    updateTunerSaveBadge('error');
    logMsg('TF-Tuner', `✗ Saving TF tuner values failed: ${e.message || e}`, 'err');
  }
}

async function loadSavedTunerValues() {
  try {
    const res = await fetch(TUNER_API, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (!data || !data.values) { updateTunerSaveBadge(); return; }
    savedTunerValues = data.values;
    if (!sharedTunerStateSeen) {
      serverTunerValuesApplied = true;
      applyTunerValues(data.values);
      updateTunerUI();
      if (twin.updateTunerSceneObjects) twin.updateTunerSceneObjects(TF_TUNER_ELEMENTS);
      broadcastAllTFTunerTransforms();
    }
  } catch (e) {
    // Ohne Server-API (z. B. python3 -m http.server) bleibt der localStorage-Stand.
  }
  updateTunerSaveBadge();
}

export const safetyZoneParamsPub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.safetyZoneParams,
  messageType: 'std_msgs/Float32MultiArray'
});

// ── ROS topics used to detect active scene object nodes ──
// Dient nur der Lebendpruefung (4,5-s-Fenster) - 2 Hz genuegen dafuer.
export const sceneMarkersSub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.visualizationMarkerArray,
  messageType: 'visualization_msgs/MarkerArray',
  throttle_rate: 500,
  queue_length: 1
});

sceneMarkersSub.subscribe((msg) => {
  if (msg && msg.markers && msg.markers.length > 0) {
    const hasTargetMarkers = msg.markers.some(m =>
      (m.ns && (m.ns.includes('dynamic_overlays') || m.ns.includes('static_scene') || m.ns.includes('zed_visuals'))) ||
      [1, 2, 3, 10, 14].includes(m.id)
    );
    if (hasTargetMarkers) {
      lastSceneMarkerTime = Date.now();
      applySceneObjectsActiveState(true, 'Marker-Stream');
    }
  }
});

// Ebenfalls nur Lebendpruefung.
export const zedVisualMarkersSub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.zedVisualMarkers,
  messageType: 'visualization_msgs/MarkerArray',
  throttle_rate: 500,
  queue_length: 1
});

zedVisualMarkersSub.subscribe((msg) => {
  if (msg && msg.markers && msg.markers.length > 0) {
    lastSceneMarkerTime = Date.now();
    applySceneObjectsActiveState(true, 'ZED Visual Markers');
  }
});

export function checkSceneObjectsNodeState(nodesList) {
  const sceneNodes = ['rviz_marker_3d_scene_objects', 'fixed_marker_publisher', 'tf_control_tuner', 'rviz_marker_3d_scene_zedm_stand', 'rviz_marker_3d_scene_plane', 'rviz_marker_3d_scene_safety_zone'];
  const hasSceneNode = Array.isArray(nodesList) && nodesList.some(n => sceneNodes.some(sn => n.includes(sn)));
  // Der latched Zustand bleibt nach einem Node-Ende im Topic haengen.
  if (Array.isArray(nodesList)) {
    virtualDetectionsNodeRunning = nodesList.some(n => n.includes(VIRTUAL_DETECTIONS_NODE));
  }
  const recentMarkers = (Date.now() - lastSceneMarkerTime < 4500);

  if (hasSceneNode || recentMarkers) {
    applySceneObjectsActiveState(true, hasSceneNode ? 'ROS-Knoten' : 'Marker-Stream');
  } else {
    applySceneObjectsActiveState(false);
  }
}


export let isSceneObjectsUserVisible = true;

// Per-group user-visible state (independent toggles per node)
export const sceneGroupUserVisible = { objects: true, plane: true, safety: true, zedm: true };
export const sceneGroupBtnIds = {
  objects: 'btn-twin-scene-objects',
  plane:   'btn-twin-scene-plane',
  safety:  'btn-twin-scene-safety',
  zedm:    'btn-twin-scene-zedm'
};
export const sceneGroupLabels = {
  objects: 'Interactive 3D scene objects',
  plane:   'DIN A4 template',
  safety:  'Safety Zone & Workspace Reach (r=420 mm)',
  zedm:    'ZED-M camera stand'
};

export function updateSceneNodeBtn(groupKey, isNodeRunning) {
  const btn = document.getElementById(sceneGroupBtnIds[groupKey]);
  if (!btn) return;
  const isUserVisible = !!sceneGroupUserVisible[groupKey];
  const nodeSuffix = isNodeRunning ? ' (node active)' : '';

  if (isUserVisible) {
    btn.classList.add('active');
    btn.style.color = 'var(--cyan)';
    btn.style.opacity = '1.0';
    btn.title = `Hide ${sceneGroupLabels[groupKey]}${nodeSuffix}`;
  } else {
    btn.classList.remove('active');
    btn.style.color = 'var(--mut)';
    btn.style.opacity = '0.65';
    btn.title = `Show ${sceneGroupLabels[groupKey]}${nodeSuffix}`;
  }
}

export function updateAllSceneNodeBtns(isNodeRunning) {
  for (const key of Object.keys(sceneGroupBtnIds)) {
    updateSceneNodeBtn(key, isNodeRunning);
  }
}

export function toggleSceneNode(groupKey) {
  sceneGroupUserVisible[groupKey] = !sceneGroupUserVisible[groupKey];
  const vis = sceneGroupUserVisible[groupKey];

  if (twin.setSceneGroupVisibility) {
    twin.setSceneGroupVisibility(groupKey, vis);
  }
  if (vis && twin.updateTunerSceneObjects) {
    twin.updateTunerSceneObjects(TF_TUNER_ELEMENTS);
  }
  updateSceneNodeBtn(groupKey, isSceneObjectsNodeRunning);
  logMsg('WebGL 3D', `${vis ? '🟢' : '⚪'} ${sceneGroupLabels[groupKey]} ${vis ? 'shown' : 'hidden'}`, vis ? 'info' : 'warn');

  // Update global flag
  isSceneObjectsUserVisible = Object.values(sceneGroupUserVisible).some(v => v);
}


export function applySceneObjectsActiveState(isActive, reason) {
  const wasRunning = isSceneObjectsNodeRunning;
  isSceneObjectsNodeRunning = isActive;

  // Nur bei einem echten Wechsel umschalten - die Node-Abfrage (2,5 s) und
  // der Marker-Stream melden den Zustand laufend und haben sonst ein von Hand
  // gesetztes "Live TF" sofort wieder ueberschrieben.
  if (isActive !== wasRunning) isTFBroadcastActive = isActive;

  if (isActive) {
    // Apply per-group visibility
    for (const key of Object.keys(sceneGroupUserVisible)) {
      if (twin.setSceneGroupVisibility) {
        twin.setSceneGroupVisibility(key, sceneGroupUserVisible[key]);
      }
    }
    if (twin.updateTunerSceneObjects) {
      twin.updateTunerSceneObjects(TF_TUNER_ELEMENTS);
    }
    updateTunerUI();
    updateAllSceneNodeBtns(true);
    if (!wasRunning) {
      logMsg('TF-Tuner', `🟢 3D scene objects node active (${reason || 'node active'})`, 'info');
    }
  } else {
    // Keep 3D twin objects visible in WebGL if user enabled them
    for (const key of Object.keys(sceneGroupUserVisible)) {
      if (twin.setSceneGroupVisibility) {
        twin.setSceneGroupVisibility(key, sceneGroupUserVisible[key]);
      }
    }
    updateTunerUI();
    updateAllSceneNodeBtns(false);
    if (wasRunning) {
      logMsg('TF-Tuner', '⚪ 3D scene objects node disconnected (manual 3D mode)', 'warn');
    }
  }
}

export function eulerDegToQuat(rollDeg, pitchDeg, yawDeg) {
  const rollRad = (rollDeg * Math.PI) / 180.0;
  const pitchRad = (pitchDeg * Math.PI) / 180.0;
  const yawRad = (yawDeg * Math.PI) / 180.0;

  const cy = Math.cos(yawRad * 0.5);
  const sy = Math.sin(yawRad * 0.5);
  const cp = Math.cos(pitchRad * 0.5);
  const sp = Math.sin(pitchRad * 0.5);
  const cr = Math.cos(rollRad * 0.5);
  const sr = Math.sin(rollRad * 0.5);

  return {
    w: cr * cp * cy + sr * sp * sy,
    x: sr * cp * cy - cr * sp * sy,
    y: cr * sp * cy + sr * cp * sy,
    z: cr * cp * sy - sr * sp * cy
  };
}

export function broadcastAllTFTunerTransforms() {
  const objectsOnly = !isTFBroadcastActive && virtualObjectsNeedTf();
  if ((!isTFBroadcastActive && !objectsOnly) || !ros || !ros.isConnected) return;

  const stamp = rosStampNow();
  const transforms = [];

  for (const [name, data] of Object.entries(TF_TUNER_ELEMENTS)) {
    if (objectsOnly && !VIRTUAL_OBJECT_ELEMENTS.includes(name)) continue;
    const q = eulerDegToQuat(data.roll, data.pitch, data.yaw);
    transforms.push({
      header: {
        stamp: stamp,
        frame_id: 'world'
      },
      child_frame_id: data.frame_id,
      transform: {
        translation: {
          x: Number(data.x),
          y: Number(data.y),
          z: Number(data.z)
        },
        rotation: {
          x: q.x,
          y: q.y,
          z: q.z,
          w: q.w
        }
      }
    });

    if (name === 'Safety Zone') {
      const arrMsg = new ROSLIB.Message({
        data: [Number(data.x), Number(data.y), Number(data.radius || 0.138)]
      });
      safetyZoneParamsPub.publish(arrMsg);
    }
  }

  const tfMsg = new ROSLIB.Message({
    transforms: transforms
  });
  tfTunerPub.publish(tfMsg);

  // Synchronize 3D Digital Twin Viewport meshes in real time
  if (twin.updateTunerSceneObjects) {
    twin.updateTunerSceneObjects(TF_TUNER_ELEMENTS);
  }
}

export function updateRangeProgress(slider) {
  if (!slider || slider.type !== 'range') return;
  const min = parseFloat(slider.min) !== undefined && !isNaN(parseFloat(slider.min)) ? parseFloat(slider.min) : 0;
  const max = parseFloat(slider.max) !== undefined && !isNaN(parseFloat(slider.max)) ? parseFloat(slider.max) : 100;
  const val = parseFloat(slider.value) !== undefined && !isNaN(parseFloat(slider.value)) ? parseFloat(slider.value) : 0;
  const pct = max > min ? Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100)) : 0;
  slider.style.backgroundSize = `${pct}% 100%`;
}


// Global real-time listener: every slider track updates smoothly as user drags
document.addEventListener('input', (e) => {
  if (e.target && e.target.type === 'range') {
    updateRangeProgress(e.target);
  }
});

export function updateTunerUI() {
  const data = TF_TUNER_ELEMENTS[currentTFTunerElement];
  if (!data) return;

  const sliderX = document.getElementById('tuner-slider-x');
  const numX = document.getElementById('tuner-num-x');
  const sliderY = document.getElementById('tuner-slider-y');
  const numY = document.getElementById('tuner-num-y');
  const sliderZ = document.getElementById('tuner-slider-z');
  const numZ = document.getElementById('tuner-num-z');

  const sliderRoll = document.getElementById('tuner-slider-roll');
  const numRoll = document.getElementById('tuner-num-roll');
  const sliderPitch = document.getElementById('tuner-slider-pitch');
  const numPitch = document.getElementById('tuner-num-pitch');
  const sliderYaw = document.getElementById('tuner-slider-yaw');
  const numYaw = document.getElementById('tuner-num-yaw');

  const radContainer = document.getElementById('tuner-radius-container');
  const sliderRadius = document.getElementById('tuner-slider-radius');
  const numRadius = document.getElementById('tuner-num-radius');

  const frameInfo = document.getElementById('tuner-frame-info');

  if (sliderX) { sliderX.value = data.x; updateRangeProgress(sliderX); }
  if (numX) numX.value = Number(data.x).toFixed(3);
  if (sliderY) { sliderY.value = data.y; updateRangeProgress(sliderY); }
  if (numY) numY.value = Number(data.y).toFixed(3);
  if (sliderZ) { sliderZ.value = data.z; updateRangeProgress(sliderZ); }
  if (numZ) numZ.value = Number(data.z).toFixed(3);

  if (sliderRoll) { sliderRoll.value = data.roll; updateRangeProgress(sliderRoll); }
  if (numRoll) numRoll.value = Number(data.roll).toFixed(1);
  if (sliderPitch) { sliderPitch.value = data.pitch; updateRangeProgress(sliderPitch); }
  if (numPitch) numPitch.value = Number(data.pitch).toFixed(1);
  if (sliderYaw) { sliderYaw.value = data.yaw; updateRangeProgress(sliderYaw); }
  if (numYaw) numYaw.value = Number(data.yaw).toFixed(1);

  if (radContainer) {
    radContainer.style.display = (currentTFTunerElement === 'Safety Zone') ? 'block' : 'none';
  }
  if (sliderRadius && data.radius !== undefined) {
    sliderRadius.value = data.radius;
    updateRangeProgress(sliderRadius);
  }
  if (numRadius && data.radius !== undefined) numRadius.value = Number(data.radius).toFixed(3);

  if (frameInfo) {
    frameInfo.textContent = `Frame: ${data.frame_id} → world`;
  }

  const btn = document.getElementById('btn-tuner-broadcast');
  const label = document.getElementById('tuner-broadcast-label');
  const rateInfo = document.getElementById('tuner-rate-info');
  if (btn && label && rateInfo) {
    if (isTFBroadcastActive) {
      btn.className = 'btn-toggle-broadcast active';
      label.textContent = 'Live TF';
      rateInfo.textContent = isSceneObjectsNodeRunning ? '10 Hz (node active)' : '10 Hz (manual)';
    } else {
      btn.className = 'btn-toggle-broadcast inactive';
      label.textContent = 'TF Inactive';
      rateInfo.textContent = 'Waiting for node...';
    }
  }
}

export function onTunerElementChange(name) {
  if (TF_TUNER_ELEMENTS[name]) {
    currentTFTunerElement = name;
    updateTunerUI();
    logMsg('TF-Tuner', `Selected element: ${name} (${TF_TUNER_ELEMENTS[name].frame_id})`, 'info');
  }
}

export function onTunerSliderInput(axis, val) {
  const data = TF_TUNER_ELEMENTS[currentTFTunerElement];
  if (!data) return;

  const numVal = parseFloat(val);
  data[axis] = numVal;

  const numInput = document.getElementById(`tuner-num-${axis}`);
  if (numInput) {
    numInput.value = (axis === 'roll' || axis === 'pitch' || axis === 'yaw') ? numVal.toFixed(1) : numVal.toFixed(3);
  }

  const slider = document.getElementById(`tuner-slider-${axis}`);
  if (slider) updateRangeProgress(slider);

  broadcastAllTFTunerTransforms();
  shareTunerState();
}

export function onTunerNumChange(axis, val) {
  const data = TF_TUNER_ELEMENTS[currentTFTunerElement];
  if (!data) return;

  const numVal = parseFloat(val);
  data[axis] = numVal;

  const slider = document.getElementById(`tuner-slider-${axis}`);
  if (slider) {
    slider.value = numVal;
    updateRangeProgress(slider);
  }

  broadcastAllTFTunerTransforms();
  shareTunerState();
}

export function resetCurrentTFElement() {
  const data = TF_TUNER_ELEMENTS[currentTFTunerElement];
  if (!data || !data.default) return;

  Object.assign(data, data.default);
  updateTunerUI();
  broadcastAllTFTunerTransforms();
  shareTunerState();
  logMsg('TF-Tuner', `Reset ${currentTFTunerElement} to factory defaults`, 'action');
}

export function toggleTFBroadcast() {
  isTFBroadcastActive = !isTFBroadcastActive;
  const btn = document.getElementById('btn-tuner-broadcast');
  const label = document.getElementById('tuner-broadcast-label');
  const rateInfo = document.getElementById('tuner-rate-info');

  if (btn) {
    if (isTFBroadcastActive) {
      btn.className = 'btn-toggle-broadcast active';
      if (label) label.textContent = 'Live TF';
      if (rateInfo) rateInfo.textContent = isSceneObjectsNodeRunning ? '10 Hz (node active)' : '10 Hz (manual)';
      if (twin.setTunerSceneObjectsVisibility) {
        twin.setTunerSceneObjectsVisibility(true);
      }
      if (twin.updateTunerSceneObjects) {
        twin.updateTunerSceneObjects(TF_TUNER_ELEMENTS);
      }
      logMsg('TF-Tuner', 'Live TF broadcasting & scene objects enabled', 'success');
      broadcastAllTFTunerTransforms();
    } else {
      btn.className = 'btn-toggle-broadcast inactive';
      if (label) label.textContent = 'TF Inactive';
      if (rateInfo) rateInfo.textContent = 'Waiting for node...';
      if (twin.setTunerSceneObjectsVisibility) {
        twin.setTunerSceneObjectsVisibility(false);
      }
      logMsg('TF-Tuner', 'Live TF broadcasting & scene objects disabled', 'warn');
    }
  }
}

// Global exports






// ── Zustand fuer persist.js ──────────────────────────────────────────────
const TUNER_FIELDS = ['x', 'y', 'z', 'roll', 'pitch', 'yaw', 'radius'];

export function getTunerState() {
  const values = {};
  for (const [name, el] of Object.entries(TF_TUNER_ELEMENTS)) {
    values[name] = {};
    for (const f of TUNER_FIELDS) if (typeof el[f] === 'number') values[name][f] = el[f];
  }
  return { element: currentTFTunerElement, values, scene: { ...sceneGroupUserVisible } };
}

function applyTunerValues(values) {
  for (const [name, vals] of Object.entries(values)) {
    const el = TF_TUNER_ELEMENTS[name];
    if (!el || !vals) continue;
    for (const f of TUNER_FIELDS) {
      if (typeof el[f] === 'number' && Number.isFinite(vals[f])) el[f] = vals[f];
    }
  }
}

export function applyTunerState(st) {
  if (!st) return;
  if (st.values && !sharedTunerStateSeen && !serverTunerValuesApplied) applyTunerValues(st.values);
  if (st.element && TF_TUNER_ELEMENTS[st.element]) {
    currentTFTunerElement = st.element;
    const sel = document.getElementById('tuner-element-select');
    if (sel) sel.value = st.element;
  }
  if (st.scene) {
    for (const k of Object.keys(sceneGroupUserVisible)) {
      if (typeof st.scene[k] === 'boolean') sceneGroupUserVisible[k] = st.scene[k];
    }
    isSceneObjectsUserVisible = Object.values(sceneGroupUserVisible).some(v => v);
    for (const k of Object.keys(sceneGroupUserVisible)) {
      if (twin.setSceneGroupVisibility) twin.setSceneGroupVisibility(k, sceneGroupUserVisible[k]);
    }
    updateAllSceneNodeBtns(isSceneObjectsNodeRunning);
  }
  updateTunerUI();
  if (twin.updateTunerSceneObjects) twin.updateTunerSceneObjects(TF_TUNER_ELEMENTS);
  broadcastAllTFTunerTransforms();
}

// Start TF Broadcast Loop (10 Hz)
if (tfBroadcasterInterval) clearInterval(tfBroadcasterInterval);
tfBroadcasterInterval = setInterval(broadcastAllTFTunerTransforms, 100);

rosHooks.onNodeList.push(checkSceneObjectsNodeState);

// Sync scene objects & buttons on startup
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    for (const k of Object.keys(sceneGroupUserVisible)) {
      if (twin.setSceneGroupVisibility) twin.setSceneGroupVisibility(k, sceneGroupUserVisible[k]);
    }
    if (twin.updateTunerSceneObjects) twin.updateTunerSceneObjects(TF_TUNER_ELEMENTS);
    updateAllSceneNodeBtns(isSceneObjectsNodeRunning);
  }, 400);
  loadSavedTunerValues();
});
