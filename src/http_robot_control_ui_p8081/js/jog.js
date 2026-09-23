import { TOPICS } from './config.js';
import * as twin from './twin/digital_twin.js';
import { playUiClickSound } from './audio.js';
import { logMsg } from './log.js';
import { speedScale } from './motion.js';
import { motionAllowed, ros, rosHooks } from './ros.js';
import { latestEEF_Q, latestEEF_Z } from './safety.js';
import { LIM, floorGuard } from './util.js';
import { startListening } from './voice.js';

export let currentFrame = 'link_base';
export let jogActive = false;
export let joyActive = false;
export let jogTimer = null;
export let jogZeroCount = 0;
export let targetTwist = { lx: 0, ly: 0, lz: 0, ax: 0, ay: 0, az: 0 };
export let smoothedTwist = { lx: 0, ly: 0, lz: 0, ax: 0, ay: 0, az: 0 };
export const SMOOTHING_FACTOR = 0.5;
export const JOYSTICK_DEADZONE = 0.001;

export let activeJointJog = -1;
export let jointJogVelocity = 0;
export let jointJogStartX = 0;
export let jointJogTimer = null;

// ── Shared Messages ─────────────────────────────────────────────────────
export let twistMsg = new ROSLIB.Message({
  header: { frame_id: currentFrame },
  twist: {
    linear: { x: 0, y: 0, z: 0 },
    angular: { x: 0, y: 0, z: 0 }
  }
});

export let jointJogMsg = new ROSLIB.Message({
  header: { frame_id: currentFrame },
  joint_names: [],
  velocities: [],
  displacements: [],
  duration: 0.0
});

// ── ROS Topics / Services ───────────────────────────────────────────────
export const twistPub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.servoServerDeltaTwistCmds,
  messageType: 'geometry_msgs/TwistStamped'
});

export const jointJogPub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.servoServerDeltaJointCmds,
  messageType: 'control_msgs/JointJog'
});

// ── Linear Axis ─────────────────────────────────────────────────────────
export const linearAxisPub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.linearAxisCmd,
  messageType: 'std_msgs/Float64'
});

export function updateLinearAxis(val) {
  const numVal = parseFloat(val);
  const label = document.getElementById('linear-axis-val');
  if(label) label.innerText = numVal.toFixed(2) + " m";
  
  // Update slider visual track fill
  const slider = document.getElementById('linear-axis-slider');
  if(slider) {
    const min = parseFloat(slider.min) || -0.5;
    const max = parseFloat(slider.max) || 0.5;
    const percentage = ((numVal - min) / (max - min)) * 100;
    slider.style.backgroundSize = percentage + '% 100%';
  }
  
  // Publish to ROS 2
  linearAxisPub.publish(new ROSLIB.Message({ data: numVal }));

  // Update 3D Digital Twin
  if (typeof twin.updateDigitalTwinJoints === 'function') {
    twin.updateDigitalTwinJoints(null, numVal);
  }
}



export function setFrame(frame) {
  currentFrame = frame;
  document.querySelectorAll('.frame-btn').forEach(b => b.classList.remove('active', 'btn-primary'));
  const btn = document.getElementById(frame === 'link_tcp' ? 'btn-frame-tcp' : 'btn-frame-base');
  if(btn) btn.classList.add('active', 'btn-primary');
  
  twistMsg.header.frame_id = currentFrame;
  logMsg('UI', `Control Frame set to ${frame}`);
}

// ── Floor Guard (Z Collision Level) ─────────────────────────────────────
// MoveIt kennt die Tischebene als Kollisionsobjekt (moveit_floor_collision)
// und haelt Servo dort an. Nur: MoveIt Servo in Humble skaliert bei einer
// Kollision ALLE Richtungen auf null - der Arm kaeme danach auch nach oben
// nicht mehr weg. Deshalb nimmt die UI den Anteil nach unten schon an der
// Z Collision Level heraus, bevor MoveIt eingreifen muss. Seitwaerts, nach
// oben und Rotationen bleiben frei. MoveIt ist die harte Grenze dahinter.
export const SERVO_MAX_LINEAR_MM_S = 400.0;  // scale.linear in xarm_moveit_servo_config.yaml
// Bremsweg-Zeitkonstante: die erlaubte Geschwindigkeit nach unten ist
// Restabstand / FLOOR_BRAKE_TIME_S. Der TCP naehert sich der Grenze dadurch
// exponentiell und kommt bei jeder Jog-Geschwindigkeit bis knapp an 15 mm
// heran. Muss deutlich groesser sein als die Latenz rosbridge + Servo (~0.08 s).
export const FLOOR_BRAKE_TIME_S = 0.25;
export let floorGuardActive = false;

export function rotateByQuat(q, v, inverse) {
  // q = [x, y, z, w]; inverse -> Drehung mit dem konjugierten Quaternion
  const qx = inverse ? -q[0] : q[0], qy = inverse ? -q[1] : q[1], qz = inverse ? -q[2] : q[2], qw = q[3];
  const tx = 2 * (qy * v.z - qz * v.y);
  const ty = 2 * (qz * v.x - qx * v.z);
  const tz = 2 * (qx * v.y - qy * v.x);
  return {
    x: v.x + qw * tx + (qy * tz - qz * ty),
    y: v.y + qw * ty + (qz * tx - qx * tz),
    z: v.z + qw * tz + (qx * ty - qy * tx),
  };
}

export function applyFloorGuard(lx, ly, lz) {
  const cmd = { x: lx, y: ly, z: lz };
  if (!floorGuard.enabled) {        // Bodenkollision im SCENE-Panel aus
    floorGuardActive = false;
    return cmd;
  }
  if (latestEEF_Z === null) return cmd;

  const useTcp = currentFrame === 'link_tcp' && latestEEF_Q;
  const base = useTcp ? rotateByQuat(latestEEF_Q, cmd, false) : { ...cmd };
  if (base.z >= 0) {
    floorGuardActive = false;
    return cmd;
  }

  // Erlaubte Abwaertsgeschwindigkeit (unitless) aus dem Restabstand.
  const clearanceMm = Math.max(0, latestEEF_Z - LIM.FLOOR_CLEARANCE_MM);
  const maxDown = clearanceMm / (SERVO_MAX_LINEAR_MM_S * FLOOR_BRAKE_TIME_S);
  if (-base.z <= maxDown) {
    floorGuardActive = false;
    return cmd;
  }

  const reached = clearanceMm < 0.5;
  if (reached && !floorGuardActive) {
    logMsg('SAFETY', `⛔ Z Collision Level erreicht (${latestEEF_Z.toFixed(1)} mm ≤ ${LIM.FLOOR_CLEARANCE_MM} mm) - Bewegung nach unten gesperrt.`, 'warn');
  }
  floorGuardActive = reached;

  base.z = -maxDown;
  return useTcp ? rotateByQuat(latestEEF_Q, base, true) : base;
}

// ── Jogging Logic ───────────────────────────────────────────────────────
export function processJogTimer() {
  if (Math.abs(targetTwist.lx) > JOYSTICK_DEADZONE) {
    smoothedTwist.lx += (targetTwist.lx - smoothedTwist.lx) * SMOOTHING_FACTOR;
  } else {
    smoothedTwist.lx = 0.0;
  }
  if (Math.abs(targetTwist.ly) > JOYSTICK_DEADZONE) {
    smoothedTwist.ly += (targetTwist.ly - smoothedTwist.ly) * SMOOTHING_FACTOR;
  } else {
    smoothedTwist.ly = 0.0;
  }
  if (Math.abs(targetTwist.lz) > JOYSTICK_DEADZONE) {
    smoothedTwist.lz += (targetTwist.lz - smoothedTwist.lz) * SMOOTHING_FACTOR;
  } else {
    smoothedTwist.lz = 0.0;
  }
  
  if (Math.abs(targetTwist.ax) > JOYSTICK_DEADZONE) {
    smoothedTwist.ax += (targetTwist.ax - smoothedTwist.ax) * SMOOTHING_FACTOR;
  } else {
    smoothedTwist.ax = 0.0;
  }
  if (Math.abs(targetTwist.ay) > JOYSTICK_DEADZONE) {
    smoothedTwist.ay += (targetTwist.ay - smoothedTwist.ay) * SMOOTHING_FACTOR;
  } else {
    smoothedTwist.ay = 0.0;
  }
  if (Math.abs(targetTwist.az) > JOYSTICK_DEADZONE) {
    smoothedTwist.az += (targetTwist.az - smoothedTwist.az) * SMOOTHING_FACTOR;
  } else {
    smoothedTwist.az = 0.0;
  }

  let isZero = (smoothedTwist.lx === 0 && smoothedTwist.ly === 0 && smoothedTwist.lz === 0 &&
                smoothedTwist.ax === 0 && smoothedTwist.ay === 0 && smoothedTwist.az === 0);

  if (isZero && !jogActive) {
    jogZeroCount++;
    if (jogZeroCount > 5) {
      clearInterval(jogTimer);
      jogTimer = null;
      return; 
    }
  } else {
    jogZeroCount = 0;
  }

  const lin = applyFloorGuard(smoothedTwist.lx, smoothedTwist.ly, smoothedTwist.lz);
  twistMsg.twist.linear.x = lin.x;
  twistMsg.twist.linear.y = lin.y;
  twistMsg.twist.linear.z = lin.z;
  twistMsg.twist.angular.x = smoothedTwist.ax;
  twistMsg.twist.angular.y = smoothedTwist.ay;
  twistMsg.twist.angular.z = smoothedTwist.az;

  twistMsg.header.stamp = {sec: Math.floor(Date.now()/1000), nanosec: (Date.now()%1000)*1000000};
  twistPub.publish(twistMsg);
}

export function startJog(lx, ly, lz, ax, ay, az) {
  if (!motionAllowed('Jog', true)) return;
  jogActive = true;
  jogZeroCount = 0;
  
  targetTwist.lx = lx * speedScale;
  targetTwist.ly = ly * speedScale;
  targetTwist.lz = lz * speedScale;
  targetTwist.ax = ax; 
  targetTwist.ay = ay; 
  targetTwist.az = az;

  if (!jogTimer) {
    jogTimer = setInterval(processJogTimer, 20);
  }
}

export function stopJog() {
  jogActive = false;
  targetTwist.lx = 0;
  targetTwist.ly = 0;
  targetTwist.lz = 0;
  targetTwist.ax = 0;
  targetTwist.ay = 0;
  targetTwist.az = 0;
}

// ── Live Joint Jogging ──────────────────────────────────────────────────
// Floor Guard fuer Gelenke: welche Gelenkrichtung den TCP nach unten
// bringt, haengt von der ganzen Pose ab. Deshalb wird beobachtet: sinkt der
// TCP an der Z Collision Level weiter, ist genau diese Drehrichtung gesperrt,
// die Gegenrichtung (weg vom Tisch) bleibt frei.
export let jointJogPrevZ = null;
export let jointJogBlockedSign = 0;

export function guardJointJogVelocity(vel) {
  if (!floorGuard.enabled || latestEEF_Z === null || latestEEF_Z > LIM.FLOOR_CLEARANCE_MM) {
    jointJogBlockedSign = 0;
    jointJogPrevZ = latestEEF_Z;
    return vel;
  }
  if (jointJogPrevZ !== null && vel !== 0 && latestEEF_Z < jointJogPrevZ - 0.05) {
    if (jointJogBlockedSign === 0) {
      logMsg('SAFETY', `⛔ Z Collision Level erreicht (${latestEEF_Z.toFixed(1)} mm) - Gelenkrichtung zum Tisch gesperrt.`, 'warn');
    }
    jointJogBlockedSign = Math.sign(vel);
  }
  jointJogPrevZ = latestEEF_Z;
  return (jointJogBlockedSign !== 0 && Math.sign(vel) === jointJogBlockedSign) ? 0.0 : vel;
}

export function startJointJog(idx, e) {
  if (!motionAllowed('Joint jog')) return;
  activeJointJog = idx;
  jointJogStartX = e.clientX;
  jointJogVelocity = 0;
  jointJogPrevZ = latestEEF_Z;
  jointJogBlockedSign = 0;

  document.addEventListener('pointermove', onJointJogMove);
  document.addEventListener('pointerup', stopJointJog);
  document.addEventListener('pointercancel', stopJointJog);

  if(jointJogTimer) clearInterval(jointJogTimer);
  jointJogTimer = setInterval(() => {
    if(activeJointJog >= 0 && activeJointJog <= 5) {
      jointJogMsg.header.stamp = {sec: Math.floor(Date.now()/1000), nanosec: (Date.now()%1000)*1000000};
      jointJogMsg.joint_names = [`joint${activeJointJog + 1}`];
      let scaledVel = jointJogVelocity * 0.005 * speedScale;
      if(scaledVel > 1.0) scaledVel = 1.0;
      if(scaledVel < -1.0) scaledVel = -1.0;
      scaledVel = guardJointJogVelocity(scaledVel);
      jointJogMsg.velocities = [scaledVel];
      jointJogPub.publish(jointJogMsg);
    }
  }, 50);
}

export function onJointJogMove(e) {
  if (activeJointJog !== -1) {
    jointJogVelocity = e.clientX - jointJogStartX;
  }
}

export function stopJointJog() {
  if(activeJointJog !== -1) {
    jointJogMsg.header.stamp = {sec: Math.floor(Date.now()/1000), nanosec: (Date.now()%1000)*1000000};
    jointJogMsg.joint_names = [`joint${activeJointJog + 1}`];
    jointJogMsg.velocities = [0.0];
    jointJogPub.publish(jointJogMsg);

    activeJointJog = -1;
    jointJogVelocity = 0;
    if(jointJogTimer) clearInterval(jointJogTimer);
    jointJogTimer = null;
  }
  document.removeEventListener('pointermove', onJointJogMove);
  document.removeEventListener('pointerup', stopJointJog);
  document.removeEventListener('pointercancel', stopJointJog);
}

// Totmann-Verhalten: verliert das Fenster den Fokus, wird der Tab verdeckt
// oder bricht rosbridge weg, kommt kein pointerup/mouseup mehr an. Ohne das
// hier liefe ein gerade aktiver Jog-Befehl einfach weiter.
export function anyJogActive() {
  return jogActive || activeJointJog !== -1 || joyActive;
}

export function stopAllJogging(reason) {
  const wasActive = anyJogActive();
  if (jogActive || jogTimer) stopJog();
  if (activeJointJog !== -1) stopJointJog();
  if (joyActive) endJoy();
  if (typeof stopArrowJog === 'function') stopArrowJog();
  if (wasActive && typeof reason === 'string') {
    logMsg('SAFETY', `✋ Deadman: jog stopped (${reason}).`, 'warn');
  }
}
window.addEventListener('blur', () => stopAllJogging('window lost focus'));
window.addEventListener('pagehide', () => stopAllJogging('page closed'));
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopAllJogging('tab hidden');
});
// Totmann-Netz: Bewegung nur, solange wirklich gedrueckt wird. Loslassen
// irgendwo auf der Seite beendet jeden Jog - auch wenn das pointerup nicht
// beim Button ankommt (z. B. ausserhalb losgelassen).
document.addEventListener('pointerup', () => {
  if (anyJogActive()) stopAllJogging();
}, true);
document.addEventListener('pointercancel', () => {
  if (anyJogActive()) stopAllJogging('input cancelled');
}, true);
// Maus ohne gedrueckte Taste, aber Jog laeuft noch -> verpasstes Loslassen.
document.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'mouse' && e.buttons === 0 && anyJogActive()) {
    stopAllJogging('button no longer held');
  }
}, true);
// Langes Druecken auf Touch oeffnet sonst das Kontextmenue, und das
// pointerup kommt nie an.
document.addEventListener('contextmenu', (e) => {
  if (anyJogActive() || (e.target && e.target.closest && e.target.closest('#panel-jogging, .j-bar'))) {
    e.preventDefault();
    stopAllJogging('context menu');
  }
}, true);

// ── Analog Joystick Implementation ──────────────────────────────────────
export const zone = document.getElementById('joystick-zone');
export const stick = document.getElementById('joystick-stick');
export const joyLabelTop = document.querySelector('.joy-label.top');
export const joyLabelBottom = document.querySelector('.joy-label.bottom');
export const joyLabelLeft = document.querySelector('.joy-label.left');
export const joyLabelRight = document.querySelector('.joy-label.right');

// ── Clickable Arrow Buttons Jogging (with sound & stick feedback) ────────
export function startArrowJog(lx, ly, e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  playUiClickSound();

  // Deflect stick knob slightly towards pressed direction for tactile visual feedback
  if (stick) {
    const deflectX = -ly * 24;
    const deflectY = -lx * 24;
    stick.style.transform = `translate(${deflectX}px, ${deflectY}px)`;
  }

  // Highlight active direction
  if (joyLabelTop) joyLabelTop.classList.toggle('joy-active', lx > 0.2);
  if (joyLabelBottom) joyLabelBottom.classList.toggle('joy-active', lx < -0.2);
  if (joyLabelLeft) joyLabelLeft.classList.toggle('joy-active', ly > 0.2);
  if (joyLabelRight) joyLabelRight.classList.toggle('joy-active', ly < -0.2);

  startJog(lx, ly, 0, 0, 0, 0);
}


export function stopArrowJog() {
  if (stick && !joyActive) {
    stick.style.transform = 'translate(0px, 0px)';
  }
  if (joyLabelTop) joyLabelTop.classList.remove('joy-active');
  if (joyLabelBottom) joyLabelBottom.classList.remove('joy-active');
  if (joyLabelLeft) joyLabelLeft.classList.remove('joy-active');
  if (joyLabelRight) joyLabelRight.classList.remove('joy-active');
  stopJog();
}


// Subscribe to hardware gamepad
export const hardwareJoySub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.joy,
  messageType: 'sensor_msgs/msg/Joy'
});

export let lastHardwareXButton = 0;

hardwareJoySub.subscribe(function(msg) {
  if (!msg.axes || msg.axes.length < 2) return;
  
  const nx = msg.axes[1]; // Left Stick Y
  const ny = msg.axes[0]; // Left Stick X
  const threshold = 0.2;
  
  if (!joyActive) {
    if(joyLabelTop) joyLabelTop.classList.toggle('joy-active', nx > threshold);
    if(joyLabelBottom) joyLabelBottom.classList.toggle('joy-active', nx < -threshold);
    if(joyLabelLeft) joyLabelLeft.classList.toggle('joy-active', ny > threshold);
    if(joyLabelRight) joyLabelRight.classList.toggle('joy-active', ny < -threshold);
  }

  // Handle Gamepad Buttons
  if (msg.buttons && msg.buttons.length > 2) {
    const currentXButton = msg.buttons[2]; // standard mapping: 2 is the 'X' button
    if (currentXButton === 1 && lastHardwareXButton === 0) {
      // Rising edge detected on X button
      if (typeof startListening === 'function') {
        startListening();
      }
    }
    lastHardwareXButton = currentXButton;
  }
});

export const maxRadius = 37;
export let joyCenterX = 0, joyCenterY = 0;

if(zone && stick) {
  zone.addEventListener('mousedown', initJoy);
  zone.addEventListener('touchstart', initJoy, {passive: false});
}

export function initJoy(e) {
  joyActive = true;
  const rect = zone.getBoundingClientRect();
  joyCenterX = rect.left + rect.width / 2;
  joyCenterY = rect.top + rect.height / 2;
  
  document.addEventListener('mousemove', moveJoy);
  document.addEventListener('mouseup', endJoy);
  document.addEventListener('touchmove', moveJoy, {passive: false});
  document.addEventListener('touchend', endJoy);
  moveJoy(e);
  if(e.cancelable) e.preventDefault();
}

export function moveJoy(e) {
  if(!joyActive) return;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  
  let dx = clientX - joyCenterX;
  let dy = clientY - joyCenterY;
  const dist = Math.sqrt(dx*dx + dy*dy);
  
  if (dist > maxRadius) {
    dx = (dx / dist) * maxRadius;
    dy = (dy / dist) * maxRadius;
  }
  
  stick.style.transform = `translate(${dx}px, ${dy}px)`;
  
  const nx = -(dy / maxRadius);
  const ny = -(dx / maxRadius);
  
  const threshold = 0.2;
  if(joyLabelTop) joyLabelTop.classList.toggle('joy-active', nx > threshold);
  if(joyLabelBottom) joyLabelBottom.classList.toggle('joy-active', nx < -threshold);
  if(joyLabelLeft) joyLabelLeft.classList.toggle('joy-active', ny > threshold);
  if(joyLabelRight) joyLabelRight.classList.toggle('joy-active', ny < -threshold);
  
  startJog(nx, ny, 0, 0, 0, 0);
}

export function endJoy() {
  joyActive = false;
  stick.style.transform = `translate(0px, 0px)`;
  
  if(joyLabelTop) joyLabelTop.classList.remove('joy-active');
  if(joyLabelBottom) joyLabelBottom.classList.remove('joy-active');
  if(joyLabelLeft) joyLabelLeft.classList.remove('joy-active');
  if(joyLabelRight) joyLabelRight.classList.remove('joy-active');
  
  stopJog();
  document.removeEventListener('mousemove', moveJoy);
  document.removeEventListener('mouseup', endJoy);
  document.removeEventListener('touchmove', moveJoy);
  document.removeEventListener('touchend', endJoy);
}

// Totmann: bricht rosbridge weg, kommt kein Loslassen mehr an.
rosHooks.onConnectionLost.push(() => stopAllJogging('connection lost'));

// ── Jog-Buttons verdrahten (vorher Inline-Handler in index.html) ─────────
//   data-jog="lx,ly,lz,ax,ay,az"  Z- und Rotations-Buttons
//   data-arrow-jog="lx,ly"        Pfeiltasten um den Joystick
//   data-joint-jog="idx"          Gelenkbalken (horizontal ziehen)
// Totmann: jeder Button faehrt nur, solange er gedrueckt ist.
function parseNums(str) {
  return str.split(',').map(Number);
}

document.querySelectorAll('[data-jog]').forEach((btn) => {
  const v = parseNums(btn.dataset.jog);
  btn.addEventListener('pointerdown', () => {
    playUiClickSound();
    startJog(...v);
  });
  btn.addEventListener('pointerup', stopJog);
  btn.addEventListener('pointerleave', (e) => { if (e.buttons) stopJog(); });
  btn.addEventListener('pointercancel', stopJog);
});

document.querySelectorAll('[data-arrow-jog]').forEach((btn) => {
  const [lx, ly] = parseNums(btn.dataset.arrowJog);
  btn.addEventListener('pointerdown', (e) => startArrowJog(lx, ly, e));
  btn.addEventListener('pointerup', stopArrowJog);
  btn.addEventListener('pointerleave', stopArrowJog);
  btn.addEventListener('pointercancel', stopArrowJog);
});

document.querySelectorAll('[data-joint-jog]').forEach((bar) => {
  const idx = Number(bar.dataset.jointJog);
  bar.addEventListener('pointerdown', (e) => startJointJog(idx, e));
});

