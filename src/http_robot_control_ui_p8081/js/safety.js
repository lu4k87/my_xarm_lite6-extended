import { TOPICS, SERVICES } from './config.js';
import * as twin from './twin/digital_twin.js';
import { errorSound, playUiClickSound, playVoice } from './audio.js';
import { stopAllJogging } from './jog.js';
import { logMsg } from './log.js';
import { createSrv, ros } from './ros.js';
import { unreachableClearance, unreachableRadiusAt } from './robot_limits.js';
import { LIM, floorGuard } from './util.js';

export let currentServoStatus = 0;
export let isRobotMoving = false;
export let movingTimeout = null;

export let latestJointVals = [0, 0, 0, 0, 0, 0];
export let latestEEF_X = null;
export let latestEEF_Y = null;
export let latestEEF_Z = null;
export let latestEEF_Q = null; // [x, y, z, w] von link_tcp in link_base
export let lastServoStatus = 0;
export let activeCollisionText = '';
export let collisionTextClearTimer = null;
export let lastReportedSafetyState = 'normal'; // 'normal', 'singularity', 'collision'
export let lastRobotMotionAt = 0;          // performance.now() of the last detected joint motion
export let lastSafetyErrorSoundAt = 0;
export const SAFETY_SOUND_MOTION_WINDOW_MS = 1500;
export const SAFETY_SOUND_COOLDOWN_MS = 2500;

// /joint_states laeuft je nach Treiber mit 100-250 Hz. 30 Hz reichen fuer
// Slider und Digital Twin vollauf und entlasten den WebSocket spuerbar.
export const jointStateSub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.jointStates,
  messageType: 'sensor_msgs/JointState',
  throttle_rate: 33,
  queue_length: 1
});

jointStateSub.subscribe((msg) => {
  const jointNames = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6'];
  const currentJointVals = [];
  let moving = false;
  for (let i=0; i<6; i++) {
    const idx = msg.name.indexOf(jointNames[i]);
    if (idx !== -1) {
      let val = msg.position[idx];
      currentJointVals.push(val);
      const valEl = document.getElementById(`j${i+1}-val`);
      const fillEl = document.getElementById(`j${i+1}-fill`);
      if(valEl) valEl.innerText = val.toFixed(2);
      if(fillEl) {
        // J1/J4/J6 koennen +-360 Grad (limited:=false), die uebrigen +-180.
        const range = (i === 0 || i === 3 || i === 5) ? 2 * Math.PI : Math.PI;
        const pct = Math.min(100, Math.max(0, ((val + range) / (2 * range)) * 100));
        fillEl.style.width = `${pct}%`;
        fillEl.style.left = '0%';
      }
      if (msg.velocity && msg.velocity.length > idx) {
        if (Math.abs(msg.velocity[idx]) > 0.005) {
          moving = true;
        }
      }
    }
  }

  // Update 3D WebGL Digital Twin
  if (typeof twin.updateDigitalTwinJoints === 'function' && currentJointVals.length === 6) {
    twin.updateDigitalTwinJoints(currentJointVals);
  }
  // Remember when the arm last actually moved - the safety error sound only
  // fires for a collision/singularity the robot drives into, not for a pose
  // it is already standing in when the page loads.
  if (!moving && currentJointVals.length === latestJointVals.length) {
    moving = currentJointVals.some((v, i) => Math.abs(v - latestJointVals[i]) > 0.002);
  }
  if (moving) lastRobotMotionAt = performance.now();
  latestJointVals = currentJointVals;
  evaluateRobotSafety();
  
  if (moving) {
    if (!isRobotMoving) {
      isRobotMoving = true;
      if (typeof updateMoveItBadge === 'function') updateMoveItBadge();
    }
    if (movingTimeout) clearTimeout(movingTimeout);
    movingTimeout = setTimeout(() => {
      isRobotMoving = false;
      if (typeof updateMoveItBadge === 'function') updateMoveItBadge();
    }, 250);
  }
});

export const eefSub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.eefPosition,
  messageType: 'std_msgs/Float32MultiArray',
  throttle_rate: 33,
  queue_length: 1
});

eefSub.subscribe((msg) => {
  if (msg.data.length >= 3) {
    const tx = document.getElementById('telem-x');
    const ty = document.getElementById('telem-y');
    const tz = document.getElementById('telem-z');
    if(tx) tx.innerText = msg.data[0].toFixed(1);
    if(ty) ty.innerText = msg.data[1].toFixed(1);
    if(tz) tz.innerText = msg.data[2].toFixed(1);
    latestEEF_X = msg.data[0];
    latestEEF_Y = msg.data[1];
    latestEEF_Z = msg.data[2];
    evaluateRobotSafety();
  }
  if (msg.data.length >= 7) {
    const qx = msg.data[3], qy = msg.data[4], qz = msg.data[5], qw = msg.data[6];
    latestEEF_Q = [qx, qy, qz, qw];
    const sinr_cosp = 2 * (qw * qx + qy * qz);
    const cosr_cosp = 1 - 2 * (qx * qx + qy * qy);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);

    const sinp = 2 * (qw * qy - qz * qx);
    const pitch = Math.abs(sinp) >= 1 ? (Math.sign(sinp) * Math.PI / 2) : Math.asin(sinp);

    const siny_cosp = 2 * (qw * qz + qx * qy);
    const cosy_cosp = 1 - 2 * (qy * qy + qz * qz);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);

    const tr = document.getElementById('telem-r');
    const tp = document.getElementById('telem-p');
    const tyaw = document.getElementById('telem-yaw');
    if(tr) tr.innerText = roll.toFixed(2);
    if(tp) tp.innerText = pitch.toFixed(2);
    if(tyaw) tyaw.innerText = yaw.toFixed(2);
  }
});

// ── Live MoveIt Servo & Collision Warning Integration ──────────────────────
// 1. MoveIt Servo Status Topic
export const servoStatusTopic = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.servoServerStatus,
  messageType: 'std_msgs/Int8'
});

servoStatusTopic.subscribe((msg) => {
  lastServoStatus = Number(msg.data) || 0;
  evaluateRobotSafety();
});

// 2. Pre-Collision Checker Topic
export const collisionMsgTopic = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.collisionMsg,
  messageType: 'std_msgs/String'
});

collisionMsgTopic.subscribe((msg) => {
  const text = (msg.data || '').trim();
  if (text) {
    activeCollisionText = text;
    if (collisionTextClearTimer) clearTimeout(collisionTextClearTimer);
    collisionTextClearTimer = setTimeout(() => {
      activeCollisionText = '';
      evaluateRobotSafety();
    }, 1200);
  } else {
    activeCollisionText = '';
  }
  evaluateRobotSafety();
});

export function evaluateRobotSafety() {
  let isCollision = false;
  let isSingularity = false;
  let message = '';
  let collidingLinks = [];
  let singularityJoints = [];

  // A. Check Live MoveIt Servo Status
  // 1: DECELERATING_FOR_SINGULARITY, 2: HALT_FOR_SINGULARITY
  // 3: DECELERATING_FOR_COLLISION, 4: HALT_FOR_COLLISION, 5: JOINT_BOUND
  if (lastServoStatus === 3 || lastServoStatus === 4 || activeCollisionText) {
    isCollision = true;
    collidingLinks = ['link6', 'vacuum', 'gripper'];
    if (activeCollisionText) {
      message = activeCollisionText.toUpperCase();
    } else if (lastServoStatus === 4) {
      message = 'MOVEIT COLLISION HALT';
    } else {
      message = 'APPROACHING COLLISION (MOVEIT)';
    }
  } else if (lastServoStatus === 1 || lastServoStatus === 2) {
    isSingularity = true;
    singularityJoints = ['link5', 'link4'];
    message = (lastServoStatus === 2) ? 'MOVEIT SINGULARITY HALT' : 'APPROACHING SINGULARITY (MOVEIT)';
  }

  // B. Ground / Table Plane Clearance (Z <= 15.0 mm is table limit)
  if (floorGuard.enabled && latestEEF_Z !== null && !isNaN(latestEEF_Z)) {
    if (latestEEF_Z <= LIM.FLOOR_CLEARANCE_MM) {
      isCollision = true;
      collidingLinks = ['link6', 'vacuum', 'gripper'];
      message = `PLANE COLLISION (Z: ${latestEEF_Z.toFixed(1)} mm ≤ ${LIM.FLOOR_CLEARANCE_MM} mm)`;
    }
  }

  // C. Kein geometrischer Innenzylinder mehr: ob der Arm nahe der eigenen
  //    Achse mit sich selbst kollidiert oder singulaer wird, melden MoveIt
  //    Servo (Status 1-4, siehe A.) und die MoveIt-Planung selbst.

  // D. Geometric Wrist Singularity Analysis (Joint 5 near 0°)
  let manipPct = 100;
  if (latestJointVals && latestJointVals.length >= 5) {
    const j5 = latestJointVals[4]; // Joint 5
    const j5Deg = Math.abs(j5 * 180 / Math.PI);
    manipPct = Math.min(100, Math.max(0, Math.round((j5Deg / 25.0) * 100)));

    if (!isCollision && !isSingularity) {
      if (j5Deg < 3.0) {
        isSingularity = true;
        singularityJoints = ['link5', 'link4'];
        message = `WRIST SINGULARITY (J5 = ${j5Deg.toFixed(1)}° ≈ 0°)`;
      } else if (j5Deg < 5.5) {
        isSingularity = true;
        singularityJoints = ['link5'];
        message = `NEAR WRIST SINGULARITY (J5 = ${j5Deg.toFixed(1)}°)`;
      }
    }
  }

  // REACH sinkt nahe der unerreichbaren Zone um die Achse: 0 % an der
  // gemessenen Grenze, 100 % ab MANIP_FADE_MARGIN_MM ausserhalb.
  if (latestEEF_X !== null && latestEEF_Y !== null && latestEEF_Z !== null) {
    const clearance = unreachableClearance(latestEEF_X, latestEEF_Y, latestEEF_Z);
    if (clearance < LIM.MANIP_FADE_MARGIN_MM && unreachableRadiusAt(latestEEF_Z) > 0) {
      const rPct = Math.min(100, Math.max(0, Math.round((clearance / LIM.MANIP_FADE_MARGIN_MM) * 100)));
      manipPct = Math.min(manipPct, rPct);
    }
  }

  // Dispatch live state to WebGL Digital Twin
  if (typeof twin.updateDigitalTwinSafety === 'function') {
    twin.updateDigitalTwinSafety({
      collision: isCollision,
      singularity: isSingularity,
      message: message,
      collidingLinks: collidingLinks,
      singularityJoints: singularityJoints,
      manipPct: manipPct,
      floorClearanceZ: latestEEF_Z
    });
  }

  // State Transition Logging in Log Output
  const currentState = isCollision ? 'collision' : (isSingularity ? 'singularity' : 'normal');
  if (currentState !== lastReportedSafetyState) {
    maybePlaySafetyErrorSound(currentState, lastReportedSafetyState);
    if (currentState === 'collision') {
      logMsg('Motion', `⚠ ${message}`, 'err');
    } else if (currentState === 'singularity') {
      logMsg('Motion', `⚡ ${message}`, 'warn');
    } else if (lastReportedSafetyState !== 'normal') {
      logMsg('Motion', '✓ Safety state cleared. Motion nominal.', 'success');
    }
    lastReportedSafetyState = currentState;
  }
}

// Error sound when the moving robot actually runs into a collision or
// singularity (entering it, or escalating singularity -> collision). MoveIt
// planning failures never get here - this is driven by live telemetry only.
export function maybePlaySafetyErrorSound(newState, oldState) {
  const entering = (newState === 'collision' && oldState !== 'collision') ||
                   (newState === 'singularity' && oldState === 'normal');
  if (!entering) return;
  const now = performance.now();
  // Servo status 1-4 (decelerating/halting) only happens during commanded motion.
  const servoStopped = lastServoStatus >= 1 && lastServoStatus <= 4;
  const recentlyMoved = now - lastRobotMotionAt < SAFETY_SOUND_MOTION_WINDOW_MS;
  if (!servoStopped && !recentlyMoved) return;
  if (now - lastSafetyErrorSoundAt < SAFETY_SOUND_COOLDOWN_MS) return;
  lastSafetyErrorSoundAt = now;
  playVoice(errorSound, `safety error (${newState})`);
}

// Topic statt Service, damit der Stopp nicht hinter einem laufenden
// Service-Call in der rosbridge-Warteschlange steht. Einmal angelegt statt
// bei jedem Druck neu - sonst kaeme der erste Stopp erst nach dem advertise.
export const emergencyStopPub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.emergencyStopTopic,
  messageType: 'std_msgs/Empty'
});

export function emergencyStop() {
  stopAllJogging('emergency stop');
  logMsg('UI', `🚨 EMERGENCY STOP TRIGGERED!`, 'err');
  if (!(ros && ros.isConnected)) {
    logMsg('SAFETY', '❌ No connection to rosbridge - the E-STOP could NOT be sent. Use the hardware emergency stop!', 'err');
    return;
  }
  emergencyStopPub.publish(new ROSLIB.Message({}));
  logMsg('System', 'STOP signal published via Topic (Bypassing Service Queue).', 'info');
}


// Not-Aus bleibt im robot_motion_handler_movegroup verriegelt, bis er hier
// quittiert wird. Der Knopf erscheint nur, solange der Node "aktiv" meldet -
// im Motion-HUD und im Header.
export function setEstopResetVisible(active) {
  ['btn-estop-reset', 'btn-estop-header-reset'].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.classList.toggle('estop-reset-hidden', !active);
  });
  const hdr = document.getElementById('btn-estop-header');
  if (hdr) hdr.classList.toggle('estop-latched', !!active);
}

new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.emergencyStopActive,
  messageType: 'std_msgs/Bool'
  // rosbridge uebernimmt transient_local vom Publisher -> Zustand kommt auch
  // nach einem Reload der Seite sofort an.
}).subscribe((msg) => {
  setEstopResetVisible(Boolean(msg.data));
  if (msg.data) logMsg('SAFETY', '🚨 Emergency stop is latched - motions are blocked until acknowledged (↺ button).', 'err');
});

export function resetEmergencyStop() {
  playUiClickSound();
  createSrv(SERVICES.resetEmergencyStop, 'std_srvs/Trigger').callService(
    new ROSLIB.ServiceRequest({}),
    (res) => {
      if (res.success) {
        setEstopResetVisible(false);
        logMsg('SAFETY', `✓ ${res.message}`, 'info');
      } else {
        logMsg('SAFETY', `❌ Reset failed: ${res.message}`, 'err');
      }
    },
    (err) => logMsg('SAFETY', `❌ Reset error: ${err}`, 'err')
  );
}


// ── MoveIt Servo Status ─────────────────────────────────────────────────
export const servoStatusSub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.servoServerStatus,
  messageType: 'std_msgs/Int8'
});

export function updateMoveItBadge() {
  // Gruener Puls-Rahmen am Viewport, solange sich der Roboter bewegt.
  // vignette-moving steht im Stylesheet VOR collision/singularity, damit eine
  // Warnung den gruenen Puls ueberschreibt, wenn beides zugleich anliegt.
  const twinContainer = document.getElementById('digital-twin-container');
  if (twinContainer) {
    twinContainer.classList.toggle('vignette-moving', isRobotMoving);
  }

  const badge = document.getElementById('moveit-badge');
  if(!badge) return;

  badge.className = 'moveit-status'; // Reset classes
  
  if (currentServoStatus === 0) {
    if (isRobotMoving) {
      badge.innerText = 'MoveIt: Moving';
      badge.classList.add('moving');
    } else {
      badge.innerText = 'MoveIt: Ready';
      badge.classList.add('ready');
    }
  } else if (currentServoStatus === 1 || currentServoStatus === 3 || currentServoStatus === 6) {
    badge.classList.add('warn');
    if (currentServoStatus === 1) badge.innerText = 'MoveIt: Sing. Near';
    else if (currentServoStatus === 3) badge.innerText = 'MoveIt: Coll. Near';
    else badge.innerText = 'MoveIt: Leav. Sing.';
  } else {
    badge.classList.add('error');
    if (currentServoStatus === 2) badge.innerText = 'MoveIt: Sing. Halt';
    else if (currentServoStatus === 4) badge.innerText = 'MoveIt: Coll. Halt';
    else if (currentServoStatus === 5) badge.innerText = 'MoveIt: Limit';
    else badge.innerText = 'MoveIt: Error';
  }
}

servoStatusSub.subscribe((msg) => {
  currentServoStatus = msg.data;
  updateMoveItBadge();
});

// ── Not-Aus per Leertaste ────────────────────────────────────────────────
// Capture-Phase, damit kein anderer Handler (fokussierter Button, Gizmo)
// die Taste vorher schluckt. Nur in Textfeldern bleibt die Leertaste ein
// Leerzeichen - in Zahlenfeldern, Slidern und Buttons loest sie aus.
export function isTextEntry(el) {
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = (el.tagName || '').toLowerCase();
  if (tag === 'textarea') return true;
  if (tag !== 'input') return false;
  return ['text', 'search', 'email', 'url', 'password', ''].includes((el.type || '').toLowerCase());
}

document.addEventListener('keydown', (e) => {
  if (e.code !== 'Space' && e.key !== ' ') return;
  if (isTextEntry(e.target)) return;
  e.preventDefault();
  e.stopPropagation();
  if (e.repeat) return;
  emergencyStop();
}, true);
