import { SERVICES } from './config.js';
import * as twin from './twin/digital_twin.js';
import { playPoseOutOfReachSound, toggleSound } from './audio.js';
import { logMsg } from './log.js';
import { setButtonsLocked } from './motion.js';
import { createSrv, motionAllowed } from './ros.js';
import { unreachableClearance, unreachableRadiusAt } from './robot_limits.js';
import { LIM, floorGuard, readPoseInputs, setIconLabel, validatePose } from './util.js';

// ── Interactive 3D TCP Gizmo Execution ───────────────────────────────────────
export let isExecutingGizmoMove = false;

// confirm: sofort IK + Planung, gefahren wird erst nach Execute im MoveIt-Popup
// (Gizmo losgelassen, Auto-Move aus, Ghost aus).
export function executeMoveToPoseFromGizmo(opts) {
  const confirm = Boolean(opts && opts.confirm);
  if (isExecutingGizmoMove) {
    console.warn('[Gizmo] Motion execution already in progress.');
    return;
  }

  // Retrieve pose from 3D Gizmo or fallback to numeric inputs
  let poseData = null;
  if (typeof twin.getTCPGizmoPose === 'function') {
    poseData = twin.getTCPGizmoPose();
  }

  // Gizmo liefert rad, die Felder Grad - readPoseInputs() rechnet um.
  const [x, y, z, r, p, yw] = poseData
    ? [poseData.x, poseData.y, poseData.z, poseData.roll, poseData.pitch, poseData.yaw]
    : readPoseInputs();

  // Prueft jetzt alle sechs Werte, nicht nur X/Y/Z.
  const bad = validatePose([x, y, z, r, p, yw]);
  if (bad) {
    logMsg('GIZMO', `❌ Invalid gizmo target: ${bad}`, 'err');
    playPoseOutOfReachSound();
    return;
  }

  // Nahe der Roboterachse nur warnen - ob das Ziel erreichbar ist,
  // entscheidet MoveIt (IK + Planung mit Eigenkollision).
  const zoneR = unreachableRadiusAt(z);
  if (unreachableClearance(x, y, z) < 0) {
    logMsg('GIZMO', `⚠ Target lies inside the measured unreachable zone around the robot axis (r=${Math.hypot(x, y).toFixed(0)} mm < ${zoneR.toFixed(0)} mm at Z=${z.toFixed(0)} mm) - MoveIt will most likely reject it.`, 'warn');
  }
  if (floorGuard.enabled && z <= floorGuard.levelMm) {
    logMsg('GIZMO', `❌ MOVE BLOCKED: Target lies inside the table surface (Z=${z.toFixed(0)} mm ≤ ${floorGuard.levelMm} mm).`, 'err');
    playPoseOutOfReachSound();
    return;
  }

  if (!motionAllowed('Gizmo move')) return;
  isExecutingGizmoMove = true;
  setButtonsLocked(true);

  // Update floating HUD button in 3D viewport
  const btnGo = document.getElementById('btn-gizmo-execute');
  if (btnGo) {
    setIconLabel(btnGo, 'fa-solid fa-circle-notch fa-spin', 'Moving...');
    btnGo.style.opacity = '0.7';
    btnGo.disabled = true;
  }

  // Silent variant: no "robot moves to absolute pose" voice for gizmo moves.
  const srv = createSrv(confirm ? SERVICES.planMoveToPoseConfirm : SERVICES.executeMoveToPoseSilent,
                        'xarm_msgs/MoveCartesian');
  const req = new ROSLIB.ServiceRequest({
    pose: [x, y, z, r, p, yw],
    speed: 100.0,
    acc: 1000.0,
    mvtime: 0.0
  });

  logMsg('GIZMO', `🎯 TCP gizmo ${confirm ? 'target (plan, then Execute)' : 'move'}: X=${x} Y=${y} Z=${z} mm (R=${r} P=${p} Yw=${yw})`, 'action');

  srv.callService(req, (res) => {
    isExecutingGizmoMove = false;
    setButtonsLocked(false);
    if (btnGo) {
      setIconLabel(btnGo, 'fa-solid fa-play', 'Execute');
      btnGo.style.opacity = '1.0';
      btnGo.disabled = false;
    }

    if (res.ret === 0) {
      logMsg('GIZMO', confirm ? 'Gizmo target accepted - MoveIt is planning, then waits for Execute.'
                              : 'Gizmo move accepted - MoveIt is planning the path.', 'info');
      const isPreview = typeof twin.twinHooks.isPathPreviewOn === 'function' && twin.twinHooks.isPathPreviewOn();
      // Gizmo bleibt am Ziel stehen, solange der Pfad auf Execute wartet.
      if (!isPreview && !confirm && typeof twin.syncTCPGizmoToRobot === 'function') {
        twin.syncTCPGizmoToRobot();
      }
    } else {
      logMsg('GIZMO', `❌ Gizmo move rejected (ret=${res.ret}): ${res.message || 'Target unreachable or in collision'}`, 'err');
      playPoseOutOfReachSound();
    }
  }, (err) => {
    isExecutingGizmoMove = false;
    setButtonsLocked(false);
    if (btnGo) {
      setIconLabel(btnGo, 'fa-solid fa-play', 'Execute');
      btnGo.style.opacity = '1.0';
      btnGo.disabled = false;
    }
    logMsg('GIZMO', `❌ Service error during gizmo move: ${err}`, 'err');
    playPoseOutOfReachSound();
  });
}

// ── Keyboard Shortcuts for 3D TCP Gizmo ──────────────────────────────────────
document.addEventListener('keydown', (e) => {
  // Ignore keystrokes when typing in an input field or text area
  const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable)) {
    return;
  }

  const key = e.key ? e.key.toLowerCase() : '';
  if (key === 't') {
    if (typeof twin.setTCPGizmoMode === 'function') {
      twin.setTCPGizmoMode('translate');
      logMsg('GIZMO', '⌨️ Mode: Translation (arrows) active [Key: T]', 'info');
    }
  } else if (key === 'r') {
    if (typeof twin.setTCPGizmoMode === 'function') {
      twin.setTCPGizmoMode('rotate');
      logMsg('GIZMO', '⌨️ Mode: Rotation (rings) active [Key: R]', 'info');
    }
  } else if (key === 'g') {
    if (typeof twin.toggleTCPGizmo === 'function') {
      twin.toggleTCPGizmo();
      logMsg('GIZMO', '⌨️ 3D TCP gizmo toggled [Key: G]', 'info');
    }
  } else if (e.key === 'Escape') {
    if (typeof twin.syncTCPGizmoToRobot === 'function') {
      twin.syncTCPGizmoToRobot();
      logMsg('GIZMO', '⌨️ Gizmo reset to current robot TCP [Key: Esc]', 'info');
    }
  } else if (key === 'm') {
    if (typeof toggleSound === 'function') {
      toggleSound();
    }
  }
});

// Auto-Move nach dem Loslassen des TCP-Gizmos im Viewport.
twin.twinHooks.executeMoveToPoseFromGizmo = executeMoveToPoseFromGizmo;

