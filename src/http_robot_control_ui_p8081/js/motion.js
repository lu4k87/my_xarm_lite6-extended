import { TOPICS, SERVICES } from './config.js';
import * as twin from './twin/digital_twin.js';
import {
  absolutePoseSound, collisionDisabledSound, collisionEnabledSound, initialPoseSound,
  playPoseOutOfReachSound, playReachFailureSound, playVoice, scanPosSound,
} from './audio.js';
import { logMsg } from './log.js';
import { createSrv, estopLatched, motionAllowed, ros, rosHooks } from './ros.js';
import { floorGuard, readPoseInput, validatePose } from './util.js';

export let speedScale = 0.3;
export let lastSpeedIndex = -1;

const REACH_FAILURE_RE = /\b(?:reach|reachable|unreachable|ik|failed|nicht erreichbar)\b/i;

export const logSub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.graspStatus,
  messageType: 'std_msgs/String'
});
logSub.subscribe((msg) => {
  const txt = msg.data || '';
  const isErr = txt.includes('FAILED') || txt.includes('Error') || txt.includes('not reachable') || txt.includes('unreachable') || txt.includes('out of reach') || txt.includes('nicht erreichbar') || txt.includes('❌');
  logMsg('ROS', txt, isErr ? 'err' : 'info');
  // Grasp-Nodes melden nur Text - hier ganze Woerter pruefen, nicht Teilstrings wie "ik".
  if (isErr && REACH_FAILURE_RE.test(txt)) {
    playReachFailureSound();
  }
});

export const motionStatusSub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.motionStatus,
  messageType: 'std_msgs/String'
});
motionStatusSub.subscribe((msg) => {
  let text = msg.data;
  let type = 'info';
  if (text.startsWith("INFO:")) { type = 'info'; text = text.substring(5).trim(); }
  else if (text.startsWith("WARN:")) { type = 'warn'; text = text.substring(5).trim(); }
  else if (text.startsWith("ERR:")) { type = 'err'; text = text.substring(4).trim(); }
  else if (text.startsWith("SUCCESS:")) { type = 'success'; text = text.substring(8).trim(); }
  else if (text.startsWith("ACTION:")) { type = 'action'; text = text.substring(7).trim(); }
  // MoveTo / MoveIt progress gets its own log source so the planning steps stand out.
  const source = (text.startsWith('MoveIt') || text.startsWith('MoveTo')) ? 'MoveIt' : 'Motion';
  logMsg(source, text, type);
  // Der Out-of-Reach-Sound kommt aus /ui/moveit_motion_state (phase "failed"),
  // nicht mehr aus dem Wortlaut dieser Log-Zeilen.
});

export const speedIndexPub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.robotControlSetSpeedIndex,
  messageType: 'std_msgs/Int32'
});

export const speedSub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.robotControlCurrentSpeed,
  messageType: 'std_msgs/Float32'
});

speedSub.subscribe((msg) => {
  speedScale = msg.data;
  let index = 2;
  if (Math.abs(speedScale - 0.1) < 0.01) index = 0;
  else if (Math.abs(speedScale - 0.2) < 0.01) index = 1;
  else if (Math.abs(speedScale - 0.3) < 0.01) index = 2;
  else if (Math.abs(speedScale - 0.4) < 0.01) index = 3;
  else if (Math.abs(speedScale - 0.5) < 0.01) index = 4;
  
  const slider = document.getElementById('speed-slider');
  if (slider) {
    if (slider.value != index) {
      slider.value = index;
    }
    slider.style.backgroundSize = (index / 4 * 100) + '% 100%';
  }
  
  const percentages = ["20%", "40%", "60%", "80%", "100%"];
  const displayLevel = index + 1;
  const speedValElement = document.getElementById('speed-val');
  if (speedValElement) {
    speedValElement.innerText = `${displayLevel}/5 (${percentages[index]})`;
  }
  
  if (lastSpeedIndex !== index) {
    if (lastSpeedIndex !== -1) {
      logMsg('System', `Speed synchronized to ${displayLevel}/5 (${percentages[index]})`, 'info');
    }
    lastSpeedIndex = index;
  }
});

export const scanSpeedPub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.scanSpeed,
  messageType: 'std_msgs/Int32'
});

export function updateScanSpeed() {
  const slider = document.getElementById('speed-slider');
  if (slider) {
    updateSpeed(slider.value);
  }
}

export function updateSpeed(val) {
  const index = Math.max(0, Math.min(4, parseInt(val)));
  const scales = [0.1, 0.2, 0.3, 0.4, 0.5];
  speedScale = scales[index];
  lastSpeedIndex = index;

  // 1. MoveIt Servo / Joystick / Cartesian Jogging Speed
  speedIndexPub.publish(new ROSLIB.Message({ data: index }));

  // 2. Trajektorien / Scan Speed synchronisieren (0: Slow, 1: Normal, 2: Fast)
  const scanVal = index <= 1 ? 0 : (index === 2 ? 1 : 2);
  scanSpeedPub.publish(new ROSLIB.Message({ data: scanVal }));

  // 3. UI Slider & Badge aktualisieren
  const slider = document.getElementById('speed-slider');
  if (slider) {
    if (slider.value != index) slider.value = index;
    slider.style.backgroundSize = (index / 4 * 100) + '% 100%';
  }
  const percentages = ["20%", "40%", "60%", "80%", "100%"];
  const displayLevel = index + 1;
  const speedValElement = document.getElementById('speed-val');
  if (speedValElement) {
    speedValElement.innerText = `${displayLevel}/5 (${percentages[index]})`;
  }
}

// Initialisiere Geschwindigkeitsanzeige beim Laden
document.addEventListener('DOMContentLoaded', () => {
  const slider = document.getElementById('speed-slider');
  if (slider) {
    const val = parseInt(slider.value !== undefined ? slider.value : 2);
    const percentages = ["20%", "40%", "60%", "80%", "100%"];
    const speedValElement = document.getElementById('speed-val');
    if (speedValElement) {
      speedValElement.innerText = `${val + 1}/5 (${percentages[val]})`;
    }
    slider.style.backgroundSize = (val / 4 * 100) + '% 100%';
  }
});

export function startObjectScan() {
  if (!motionAllowed('Object scan')) return;
  setButtonsLocked(true);
  logMsg('UI', `➤ Starting Object Cross Scan...`);
  const scanClient = new ROSLIB.Service({
    ros: ros,
    name: SERVICES.startObjectScan,
    serviceType: 'std_srvs/Trigger'
  });
  
  scanClient.callService(new ROSLIB.ServiceRequest({}), (result) => {
    setButtonsLocked(false);
    if (result.success) {
      logMsg('System', '✓ Object Scan initiated successfully.', 'success');
    } else {
      logMsg('System', 'Object Scan failed: ' + result.message, 'err');
    }
  }, (error) => {
    setButtonsLocked(false);
    logMsg('System', 'Failed to call Object Scan service: ' + error, 'err');
  });
}

// Zwei getrennte Sperren: "Fahrt laeuft" (kurz, per Service-Antwort wieder
// frei) und der verriegelte Not-Aus. Sonst wuerde das Ende einer Fahrt die
// Not-Aus-Sperre aufheben.
let motionBusy = false;

export function setButtonsLocked(locked) {
  motionBusy = !!locked;
  applyMotionLock();
}

function applyMotionLock() {
  document.querySelectorAll('.motion-lockable').forEach(btn => {
    // Deaktivierte Buttons loesen kein click aus - damit auch keinen Klick-Sound.
    btn.disabled = motionBusy || estopLatched;
    btn.classList.toggle('estop-locked', estopLatched);
    if (btn.dataset.titleFree === undefined) btn.dataset.titleFree = btn.title || '';
    btn.title = estopLatched
      ? `${btn.dataset.titleFree} - blocked: emergency stop is latched (acknowledge with ↺)`
      : btn.dataset.titleFree;
    // Im Not-Aus bleibt der Hover fuer den Tooltip erhalten, geklickt werden
    // kann wegen disabled trotzdem nicht.
    btn.style.opacity = motionBusy && !estopLatched ? '0.4' : '';
    btn.style.pointerEvents = motionBusy && !estopLatched ? 'none' : '';
  });
}
rosHooks.onEstop.push(applyMotionLock);

export function moveToPose() {
  const x = readPoseInput('inp-x');
  const y = readPoseInput('inp-y');
  const z = readPoseInput('inp-z');
  const r = readPoseInput('inp-r');
  const p = readPoseInput('inp-p');
  const yw = readPoseInput('inp-yw');

  // Erst pruefen, dann sperren - sonst blieben die Buttons bei einer
  // abgelehnten Eingabe gesperrt zurueck.
  const bad = validatePose([x, y, z, r, p, yw]);
  if (bad) {
    logMsg('UI', `❌ MoveTo abgebrochen: ${bad}`, 'err');
    playPoseOutOfReachSound();
    return;
  }

  if (!motionAllowed('MoveTo')) return;
  setButtonsLocked(true);
  playVoice(absolutePoseSound, 'absolute pose');
  const srv = createSrv(SERVICES.executeMoveToPose, 'xarm_msgs/MoveCartesian');

  // speed und acc gehoeren zur srv-Definition, werden vom Handler aber nicht
  // ausgewertet - die Geschwindigkeit kommt ueber /ui/robot_control/set_speed_index.
  const req = new ROSLIB.ServiceRequest({
    pose: [x, y, z, r, p, yw],
    speed: 100.0,
    acc: 1000.0,
    mvtime: 0.0
  });
  logMsg('UI', `➤ MoveTo Absolute Pose: X=${x} Y=${y} Z=${z}`);
  srv.callService(req, (res) => {
    setButtonsLocked(false);
    // The service only starts the motion - progress and the result follow in
    // the MoveIt popup and as [MoveIt] log lines.
    if (res.ret === 0) logMsg('ROS', 'MoveTo accepted - MoveIt is planning the path.', 'info');
    else {
      logMsg('ROS', `❌ MoveTo rejected (ret=${res.ret}): ${res.message || 'Error'}`, 'err');
      playPoseOutOfReachSound();
    }
  }, (err) => { 
    setButtonsLocked(false);
    logMsg('ROS', `❌ MoveTo Error: ${err}`, 'err'); 
    playPoseOutOfReachSound();
  });
}

export function setInitialPose() {
  if (!motionAllowed('Initial pose')) return;
  setButtonsLocked(true);
  // Steht der Arm schon dort, waere "robot moves to initial pose" falsch -
  // ebenso im Ghost-Modus, wo dieser Klick den Pfad nur plant.
  if (!isAtInitialPose() && movetoPreviewState !== true) playVoice(initialPoseSound, 'initial pose');
  const srv = createSrv(SERVICES.executeInitialPose, 'std_srvs/Trigger');
  logMsg('UI', '➤ Triggering Initial Pose...');
  srv.callService(new ROSLIB.ServiceRequest({}), (res) => {
    setButtonsLocked(false);
    if (res.success) logMsg('ROS', '✓ Initial Pose reached successfully.', 'info');
    else logMsg('ROS', `❌ Initial Pose failed: ${res.message}`, 'err');
  }, (err) => { 
    setButtonsLocked(false);
    logMsg('ROS', `❌ Trigger Error: ${err}`, 'err'); 
  });
}

// ── Steht der Arm schon am Ziel? Dann keine Sprachansage ─────────────────
// Initialpose wie in robot_motion_handler_movegroup (_go_to_joints).
const INITIAL_JOINTS = [0.0, 0.4244, 0.5627, 0.0, 0.1383, 0.0];
const INITIAL_TOL_RAD = 0.02;
const SCAN_POS_MM = [300.0, 0.0, 400.0];
const SCAN_TOL_MM = 3.0;

// Dieselbe TCP-Position wie die EEF-Telemetrie (link_base, mm).
let lastEefMm = null;
new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.eefPosition,
  messageType: 'std_msgs/Float32MultiArray',
  throttle_rate: 200,
  queue_length: 1
}).subscribe((msg) => {
  if (msg.data && msg.data.length >= 3) lastEefMm = [msg.data[0], msg.data[1], msg.data[2]];
});

function isAtInitialPose() {
  if (typeof twin.getDigitalTwinJoints !== 'function') return false;
  const j = twin.getDigitalTwinJoints();
  return INITIAL_JOINTS.every((v, i) => Math.abs((j[i] || 0) - v) <= INITIAL_TOL_RAD);
}

function isAtScanPosition() {
  if (!lastEefMm) return false;
  return Math.hypot(lastEefMm[0] - SCAN_POS_MM[0], lastEefMm[1] - SCAN_POS_MM[1],
                    lastEefMm[2] - SCAN_POS_MM[2]) <= SCAN_TOL_MM;
}

export function showScene() {
  if (!motionAllowed('Scan position move')) return;
  setButtonsLocked(true);
  // Gleiche Absicherung wie beim Klick-Sound: ungeschuetzt haette ein
  // fehlendes Audio-Objekt die Funktion hier abgebrochen - der Roboter
  // waere dann gar nicht losgefahren.
  if (!isAtScanPosition() && movetoPreviewState !== true) playVoice(scanPosSound, 'scan position');

  const srv = createSrv(SERVICES.executeMoveToPose, 'xarm_msgs/MoveCartesian');
  const x = 300.0;
  const y = 0.0;
  const z = 400.0;
  const r = parseFloat(document.getElementById('inp-r').value) || 3.14;
  const p = parseFloat(document.getElementById('inp-p').value) || 0.0;
  const yw = parseFloat(document.getElementById('inp-yw').value) || 0.0;

  const req = new ROSLIB.ServiceRequest({
    pose: [x, y, z, r, p, yw],
    speed: 100.0,
    acc: 1000.0,
    mvtime: 0.0
  });
  logMsg('UI', `➤ MoveTo Show Scene: X=${x} Y=${y} Z=${z}`);
  srv.callService(req, (res) => {
    setButtonsLocked(false);
    if (res.ret === 0) logMsg('ROS', '✓ Show Scene successful.', 'info');
    else logMsg('ROS', `❌ Show Scene failed (ret=${res.ret}): ${res.message || 'Error'}`, 'err');
  }, (err) => { 
    setButtonsLocked(false);
    logMsg('ROS', `❌ Show Scene Error: ${err}`, 'err'); 
  });
}

// ── MoveIt-Kollision ein/aus (Objekte / Boden) ──────────────────────────
// Schaltet nur, was MoveIt (Planung, IK, Servo) als Hindernis kennt. Die
// Anzeige der erkannten Objekte im Viewport bleibt davon unberuehrt.
// Zustand kommt latched von den Nodes; null = Node laeuft nicht.
export const moveitCollState = { objects: null, ground: null };
export const moveitCollCfg = {
  objects: {
    btnId: 'btn-moveit-coll-objects',
    label: 'MoveIt collision of detected objects',
    stateTopic: TOPICS.moveitCollisionObjectsEnabled,
    srv: SERVICES.setMoveitCollisionObjects,
    node: 'yolo_moveit_collision'
  },
  ground: {
    btnId: 'btn-moveit-coll-ground',
    label: 'MoveIt ground collision',
    stateTopic: TOPICS.moveitCollisionGroundEnabled,
    srv: SERVICES.setMoveitCollisionGround,
    node: 'moveit_floor_collision'
  }
};

export function applyMoveitCollBtn(key) {
  if (key === 'ground') {
    // UI-Bodensperre folgt dem Schalter; unbekannt (null) = Sperre bleibt an.
    const was = floorGuard.enabled;
    floorGuard.enabled = moveitCollState.ground !== false;
    if (was !== floorGuard.enabled) {
      logMsg('SAFETY', floorGuard.enabled
        ? '🟢 Z Collision Level active again (ground collision ON).'
        : '⚠ Z Collision Level disabled - jog, MoveTo and gizmo may go below the table surface!', floorGuard.enabled ? 'info' : 'warn');
    }
  }
  const cfg = moveitCollCfg[key];
  const btn = document.getElementById(cfg.btnId);
  if (!btn) return;
  const state = moveitCollState[key];
  // Sicherheitsschalter: gruen = Kollision aktiv, rot = MoveIt ignoriert
  // sie. Bewusst ohne .active, das waere das neutrale Blau der Anzeige-Toggles.
  btn.classList.toggle('coll-on', state === true);
  btn.classList.toggle('coll-off', state === false);
  if (state === null) {
    btn.style.color = 'var(--dim)';
    btn.style.opacity = '0.45';
    btn.title = `${cfg.label} (node ${cfg.node} inactive)`;
  } else if (state) {
    btn.style.color = 'var(--green)';
    btn.style.opacity = '1.0';
    btn.title = `${cfg.label}: ON - click to disable`;
  } else {
    btn.style.color = 'var(--red)';
    btn.style.opacity = '1.0';
    btn.title = `${cfg.label}: OFF - MoveIt ignores it! Click to enable`;
  }
}

export function toggleMoveitCollision(key) {
  const cfg = moveitCollCfg[key];
  if (moveitCollState[key] === null) {
    logMsg('MoveIt', `ℹ️ ${cfg.label}: node ${cfg.node} is not running`, 'warn');
    return;
  }
  const enable = !moveitCollState[key];
  createSrv(cfg.srv, 'std_srvs/SetBool').callService(
    new ROSLIB.ServiceRequest({ data: enable }),
    (res) => {
      if (!res.success) {
        logMsg('MoveIt', `✗ ${cfg.label}: ${res.message}`, 'err');
        return;
      }
      moveitCollState[key] = enable;
      applyMoveitCollBtn(key);
      // Erst nach bestaetigtem Umschalten ansagen - sonst hiesse es
      // "enabled", obwohl der Node den Befehl abgelehnt hat.
      playVoice(enable ? collisionEnabledSound : collisionDisabledSound,
                `collision detection ${enable ? 'enabled' : 'disabled'}`);
      logMsg('MoveIt', enable ? `🟢 ${cfg.label} ON` : `⚠ ${cfg.label} OFF - robot may collide!`, enable ? 'info' : 'err');
    },
    (err) => logMsg('MoveIt', `✗ ${cfg.label}: service call failed: ${err}`, 'err')
  );
}


// ── MoveTo Pfad-Vorschau (Geisterroboter) ───────────────────────────────
// Icon in der Viewport-Tableiste. An: MoveTo plant nur, der Pfad laeuft als
// Geist im Digital Twin, ausgefuehrt wird erst nach "Execute path" im
// MoveIt-Popup. null = robot_motion_handler_movegroup laeuft nicht.
export const MOVETO_PREVIEW_NODE = 'robot_motion_handler_movegroup';
export let movetoPreviewState = null;

export function applyMoveToPreviewBtn() {
  applyPreviewPopupMode();
  const btn = document.getElementById('btn-twin-path-preview');
  if (!btn) return;
  const st = movetoPreviewState;
  btn.classList.toggle('active', st === true);
  if (st === null) {
    btn.style.color = 'var(--dim)';
    btn.style.opacity = '0.45';
    btn.title = `MoveTo path preview (node ${MOVETO_PREVIEW_NODE} inactive)`;
  } else if (st) {
    btn.style.color = 'var(--accent)';
    btn.style.opacity = '1';
    btn.title = 'MoveTo path preview: ON - paths are shown as a ghost and executed only after confirmation. Click to disable';
  } else {
    btn.style.color = 'var(--mut)';
    btn.style.opacity = '0.6';
    btn.title = 'MoveTo path preview: OFF - planned paths are executed immediately. Click to enable';
  }
}

// Execute-Button im MoveIt-Popup: bei aktiver Pfad-Vorschau das Ghost-Icon
// statt Play - sonst unveraendert. Gleiches <i> im selben Button, damit die
// Groesse identisch bleibt.
// Ghost-Modus: kein Auto-Move-Schalter im Popup - Gizmo und MOTION-Buttons
// planen sofort, der Geist erscheint und Execute bestaetigt die Fahrt.
function applyPreviewPopupMode() {
  const popup = document.getElementById('moveit-popup');
  if (!popup) return;
  if (movetoPreviewState === true) popup.dataset.preview = '1';
  else delete popup.dataset.preview;
}

export function toggleMoveToPreview() {
  if (movetoPreviewState === null) {
    logMsg('MoveIt', `ℹ️ Path preview: node ${MOVETO_PREVIEW_NODE} is not running`, 'warn');
    return;
  }
  const enable = !movetoPreviewState;
  createSrv(SERVICES.setMovetoPreview, 'std_srvs/SetBool').callService(
    new ROSLIB.ServiceRequest({ data: enable }),
    (res) => {
      if (!res.success) {
        logMsg('MoveIt', `✗ Path preview: ${res.message}`, 'err');
        return;
      }
      movetoPreviewState = enable;
      applyMoveToPreviewBtn();
      logMsg('MoveIt', enable
        ? '👻 Path preview ON - MoveTo waits for confirmation before moving'
        : 'Path preview OFF - MoveTo executes planned paths immediately', 'info');
    },
    (err) => logMsg('MoveIt', `✗ Path preview: service call failed: ${err}`, 'err')
  );
}


export function confirmMoveToPreview(execute) {
  const popup = document.getElementById('moveit-popup');
  if (popup && popup.dataset.pending === 'motion' && pendingMotion) {
    const req = pendingMotion;
    if (!execute) {
      clearPendingMotion();
      hideMoveitPopup();
      logMsg('UI', `✗ ${req.label}: discarded - the robot does not move`, 'info');
      return;
    }
    if (!motionAllowed(req.label)) return;
    clearPendingMotion();
    // Folgt eine MoveIt-Fahrt, oeffnet ihr Status das Popup wieder.
    hideMoveitPopup();
    req.run();
    return;
  }
  if (execute && !motionAllowed('Path execution')) return;
  if (!execute && (!mpState || mpState.phase !== 'confirm')) {
    hideMoveitPopup();
    return;
  }
  if (execute && (!mpState || mpState.phase !== 'confirm')) {
    if (typeof twin.twinHooks.executeMoveToPoseFromGizmo === 'function') {
      twin.twinHooks.executeMoveToPoseFromGizmo();
    }
    return;
  }
  if (execute) {
    if (typeof twin.twinHooks.triggerApproachVoice === 'function') {
      twin.twinHooks.triggerApproachVoice();
    }
  }
  createSrv(SERVICES.confirmMovetoPreview, 'std_srvs/SetBool').callService(
    new ROSLIB.ServiceRequest({ data: !!execute }),
    (res) => logMsg('MoveIt', res.success ? `${execute ? '▶' : '✗'} ${res.message}` : `ℹ️ ${res.message}`,
                    res.success ? 'info' : 'warn'),
    (err) => logMsg('MoveIt', `✗ Path confirmation failed: ${err}`, 'err')
  );
}


new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.movetoPreviewEnabled,
  messageType: 'std_msgs/Bool'
}).subscribe((msg) => {
  movetoPreviewState = Boolean(msg.data);
  applyMoveToPreviewBtn();
});

// Latched: ein wartender Pfad erscheint auch nach einem Reload wieder.
new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.movetoPreviewPath,
  messageType: 'std_msgs/String'
}).subscribe((msg) => {
  let data;
  try { data = JSON.parse(msg.data); } catch (e) { return; }
  if (!data || data.clear) {
    if (typeof twin.clearDigitalTwinPathPreview === 'function') twin.clearDigitalTwinPathPreview();
  } else if (typeof twin.showDigitalTwinPathPreview === 'function') {
    twin.showDigitalTwinPathPreview(data);
  }
});

export function checkMoveToPreviewNode(nodesList) {
  if (!Array.isArray(nodesList)) return;
  const running = nodesList.some(n => n.includes(MOVETO_PREVIEW_NODE));
  if (!running && movetoPreviewState !== null) {
    movetoPreviewState = null;
    applyMoveToPreviewBtn();
  }
}

// ── MoveIt progress popup ───────────────────────────────────────────────
// Driven by /ui/moveit_motion_state (JSON from robot_motion_handler_movegroup).
// Timers run locally between messages, anchored to the server-side elapsed
// times, so they tick smoothly without flooding rosbridge.
export const MP_PHASE_LABELS = {
  ik: 'SOLVING IK',
  preparing: 'PAUSING SERVO',
  planning: 'PLANNING',
  executing: 'EXECUTING',
  confirm: 'CONFIRM PATH',
  succeeded: 'DONE',
  failed: 'FAILED',
  aborted: 'ABORTED',
  discarded: 'DISCARDED'
};
export const MP_ACTIVE_PHASES = ['ik', 'preparing', 'planning', 'confirm', 'executing'];
export const MP_HIDE_AFTER_MS = { succeeded: 5000, failed: 12000, aborted: 12000, discarded: 5000 };
export let mpState = null;        // last message
export let mpReceivedAt = 0;      // performance.now() when it arrived
export let mpTicker = null;
export let mpHideTimer = null;

export function mpFmt(sec) {
  if (sec === undefined || sec === null || isNaN(sec)) return '–';
  return sec < 10 ? `${sec.toFixed(2)} s` : `${sec.toFixed(1)} s`;
}

export function mpLive() {
  // Seconds since the last message; only meaningful while a phase is running.
  return mpState && MP_ACTIVE_PHASES.includes(mpState.phase)
    ? (performance.now() - mpReceivedAt) / 1000 : 0;
}

export function hideMoveitPopup() {
  const el = document.getElementById('moveit-popup');
  if (el) el.classList.add('mp-hidden');
  clearPendingMotion();
  if (mpTicker) { clearInterval(mpTicker); mpTicker = null; }
  if (mpHideTimer) { clearTimeout(mpHideTimer); mpHideTimer = null; }
}


export function renderMoveitPopup() {
  const el = document.getElementById('moveit-popup');
  if (!el || !mpState) return;
  const st = mpState;
  const live = mpLive();
  const phase = st.phase;
  const failedAt = st.failed_phase;

  el.className = `moveit-popup mp-phase-${phase}` + (MP_ACTIVE_PHASES.includes(phase) ? ' mp-active' : '');
  // Wartet ein Vorschau-Pfad auf Bestaetigung, bleiben Execute/Discard auch
  // bei aktivem Auto-Move sichtbar (siehe syncAutoMoveActions).
  if (phase === 'confirm') el.dataset.awaiting = '1';
  else delete el.dataset.awaiting;

  document.getElementById('mp-phase').textContent = MP_PHASE_LABELS[phase] || phase.toUpperCase();
  document.getElementById('mp-timer').textContent = mpFmt((st.elapsed || 0) + live);

  // Steps: IK (incl. servo pause), PLAN, EXECUTE
  const phaseElapsed = (st.phase_elapsed || 0) + live;
  const stepOf = { ik: 'ik', preparing: 'ik', planning: 'plan', confirm: 'exec', executing: 'exec' };
  const order = ['ik', 'plan', 'exec'];
  const current = stepOf[phase] || stepOf[failedAt] || null;
  const doneUpTo = phase === 'succeeded' ? 3 : (current ? order.indexOf(current) : 0);
  const times = {
    ik: st.t_ik,
    plan: st.t_plan,
    exec: st.t_exec !== undefined ? st.t_exec : undefined
  };
  if (phase === 'succeeded' && st.t_plan_exec !== undefined) times.plan = st.t_plan_exec;
  order.forEach((key, i) => {
    const step = el.querySelector(`.mp-step[data-step="${key}"]`);
    step.classList.remove('mp-step-active', 'mp-step-done', 'mp-step-failed', 'mp-step-waiting');
    let t = times[key];
    if (i < doneUpTo) {
      step.classList.add('mp-step-done');
    } else if (key === current && phase === 'confirm') {
      // Pfad steht, Ausfuehrung wartet auf den Nutzer.
      step.classList.add('mp-step-waiting');
      t = undefined;
    } else if (key === current && MP_ACTIVE_PHASES.includes(phase)) {
      step.classList.add('mp-step-active');
      if (phase !== 'preparing' || key !== 'ik') t = phaseElapsed;
    } else if (key === current && (phase === 'failed' || phase === 'aborted' || phase === 'discarded')) {
      step.classList.add('mp-step-failed');
    }
    document.getElementById(`mp-t-${key}`).textContent = mpFmt(t);
  });

  // Progress bar
  const bar = el.querySelector('.mp-bar');
  const fill = document.getElementById('mp-bar-fill');
  bar.classList.toggle('mp-bar-indeterminate', ['ik', 'preparing', 'planning'].includes(phase));
  if (phase === 'executing' && st.exec_expected > 0) {
    fill.style.width = `${Math.min(99, (phaseElapsed / st.exec_expected) * 100).toFixed(1)}%`;
  } else if (phase === 'confirm' && st.confirm_timeout > 0) {
    // Countdown bis zum automatischen Verwerfen
    fill.style.width = `${Math.max(0, 100 - (phaseElapsed / st.confirm_timeout) * 100).toFixed(1)}%`;
  } else if (['succeeded', 'failed', 'aborted', 'discarded'].includes(phase)) {
    fill.style.width = '100%';
  } else {
    fill.style.width = '0%';
  }

  // Detail line
  const tgt = Array.isArray(st.target) ? `X ${st.target[0].toFixed(0)} · Y ${st.target[1].toFixed(0)} · Z ${st.target[2].toFixed(0)} mm` : '';
  let detail = '';
  switch (phase) {
    case 'ik':
      detail = `Solving IK for a collision-free goal · ${tgt}`; break;
    case 'preparing':
      detail = 'Pausing MoveIt Servo before the planned motion...'; break;
    case 'planning':
      detail = `Searching a collision-free path · budget ${mpFmt(st.planning_budget)}` +
               (st.attempt > 0 ? ` · candidate ${st.attempt}` : '') +
               (st.speed ? ` · ${st.speed} ×${Number(st.velocity_scaling).toFixed(2)}` : '');
      break;
    case 'executing':
      detail = (st.waypoints ? `${st.waypoints} waypoints · est. ${mpFmt(st.exec_expected)}` : 'Executing the planned path') +
               (st.replans > 0 ? ` · replanned ${st.replans}×` : '') +
               ` · ${tgt}`;
      break;
    case 'confirm': {
      const left = Math.max(0, (st.confirm_timeout || 0) - phaseElapsed);
      detail = `Path ready (ghost in viewport) · ${st.waypoints || '?'} waypoints · est. ${mpFmt(st.exec_expected)}` +
               ` · auto-discard in ${left.toFixed(0)} s`;
      break;
    }
    case 'discarded':
      detail = `Not executed: ${st.message || 'path discarded'}`; break;
    case 'succeeded':
      detail = `Target reached · ${tgt}`; break;
    case 'aborted':
      detail = `Aborted${failedAt ? ` during ${MP_PHASE_LABELS[failedAt] || failedAt}` : ''}: ${st.message || 'emergency stop'}`; break;
    case 'failed':
      detail = `Failed${failedAt ? ` during ${MP_PHASE_LABELS[failedAt] || failedAt}` : ''}: ${st.message || 'unknown error'}`; break;
  }
  document.getElementById('mp-detail').textContent = detail;
}

new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.moveitMotionState,
  messageType: 'std_msgs/String'
}).subscribe((msg) => {
  let st;
  try { st = JSON.parse(msg.data); } catch (e) { return; }
  if (!st || !st.phase) return;
  mpState = st;
  mpReceivedAt = performance.now();
  clearPendingMotion();
  // IK, Planung (Kollision/Singularitaet) oder Ausfuehrung gescheitert.
  // "aborted" (Not-Aus) und "discarded" (verworfen) sind kein Reichweitenproblem.
  if (st.phase === 'failed') playReachFailureSound();

  const el = document.getElementById('moveit-popup');
  if (el) el.classList.remove('mp-hidden');
  if (mpHideTimer) { clearTimeout(mpHideTimer); mpHideTimer = null; }

  if (MP_ACTIVE_PHASES.includes(st.phase)) {
    if (!mpTicker) mpTicker = setInterval(renderMoveitPopup, 100);
  } else {
    if (mpTicker) { clearInterval(mpTicker); mpTicker = null; }
    mpHideTimer = setTimeout(hideMoveitPopup, MP_HIDE_AFTER_MS[st.phase] || 8000);
  }
  renderMoveitPopup();
});

Object.keys(moveitCollCfg).forEach((key) => {
  // rosbridge uebernimmt transient_local vom Publisher -> Zustand kommt auch
  // nach einem Reload der Seite sofort an.
  new ROSLIB.Topic({
    ros: ros,
    name: moveitCollCfg[key].stateTopic,
    messageType: 'std_msgs/Bool'
  }).subscribe((msg) => {
    moveitCollState[key] = Boolean(msg.data);
    applyMoveitCollBtn(key);
  });
});

// Der latched Zustand bleibt nach einem Node-Absturz im Topic haengen -
// deshalb an der Node-Liste pruefen, ob der Schalter ueberhaupt wirkt.
export function checkMoveitCollNodes(nodesList) {
  if (!Array.isArray(nodesList)) return;
  Object.keys(moveitCollCfg).forEach((key) => {
    const running = nodesList.some(n => n.includes(moveitCollCfg[key].node));
    if (!running && moveitCollState[key] !== null) {
      moveitCollState[key] = null;
      applyMoveitCollBtn(key);
    }
  });
}

rosHooks.onNodeList.push(checkMoveitCollNodes, checkMoveToPreviewNode);

// ── MOTION-Buttons mit Bestaetigung (wie der Viewport-Gizmo) ────────────
// Auto-Move an: sofort fahren. Aus: Confirm-Popup, gefahren wird erst nach
// Execute (X verwirft). Sprachbefehle rufen setInitialPose & Co. direkt auf.
const MOTION_REQUESTS = {
  initial: { label: 'INITIAL POSE', what: 'Initial pose selected', run: () => setInitialPose() },
  scene:   { label: 'SCAN POSITION', what: 'Scan position selected', run: () => showScene() },
  scan:    { label: 'OBJECT SCAN', what: 'Object scan selected', run: () => startObjectScan() },
  // "Go" im POSE-Panel: Zielwerte gleich im Popup zeigen.
  pose:    { label: 'ABSOLUTE POSE',
             what: () => `Target X ${readPoseInput('inp-x')} · Y ${readPoseInput('inp-y')} · Z ${readPoseInput('inp-z')} mm`,
             // Ungueltige Eingabe: gar nicht erst bestaetigen lassen - moveToPose
             // meldet den Fehler selbst.
             invalid: () => !!validatePose(['inp-x', 'inp-y', 'inp-z', 'inp-r', 'inp-p', 'inp-yw'].map(readPoseInput)),
             run: () => moveToPose() },
};
let pendingMotion = null;

function clearPendingMotion() {
  pendingMotion = null;
  const el = document.getElementById('moveit-popup');
  if (el && el.dataset.pending === 'motion') delete el.dataset.pending;
}

export function requestMotion(kind) {
  const req = MOTION_REQUESTS[kind];
  if (!req) return;
  const auto = document.getElementById('chk-gizmo-auto-drop');
  // Im Ghost-Modus sofort planen - die Bestaetigung ist der Geist-Pfad selbst.
  if (movetoPreviewState === true || !auto || auto.checked || (req.invalid && req.invalid())) { req.run(); return; }
  if (!motionAllowed(req.label)) return;
  const mp = document.getElementById('moveit-popup');
  if (!mp) { req.run(); return; }
  if (mpTicker) { clearInterval(mpTicker); mpTicker = null; }
  if (mpHideTimer) { clearTimeout(mpHideTimer); mpHideTimer = null; }
  pendingMotion = req;
  mp.dataset.pending = 'motion';
  mp.classList.remove('mp-hidden');
  mp.classList.add('mp-phase-confirm');
  document.getElementById('mp-phase').textContent = req.label;
  const what = typeof req.what === 'function' ? req.what() : req.what;
  document.getElementById('mp-detail').textContent = `${what}. Click ▶ (Execute path) to move.`;
  logMsg('UI', `${req.label}: waiting for confirmation (Auto-Move off)`, 'info');
}

// ── Auto-Move: Execute/Discard im Popup ausblenden ────────────────────────
// Faehrt der Roboter nach dem Loslassen des Gizmos ohnehin selbst los, sind
// die Buttons ueberfluessig. Als data-Attribut, weil renderMoveitPopup die
// Klassen des Popups komplett neu setzt.
twin.twinHooks.isPathPreviewOn = () => movetoPreviewState === true;

export function syncAutoMoveActions() {
  const el = document.getElementById('moveit-popup');
  const chk = document.getElementById('chk-gizmo-auto-drop');
  if (!el || !chk) return;
  if (chk.checked) el.dataset.automove = '1';
  else delete el.dataset.automove;
}

document.addEventListener('change', (e) => {
  if (e.target && e.target.id === 'chk-gizmo-auto-drop') syncAutoMoveActions();
});
syncAutoMoveActions();

