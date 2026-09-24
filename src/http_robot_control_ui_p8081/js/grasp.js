import { TOPICS, SERVICES } from './config.js';
import * as twin from './twin/digital_twin.js';
import { playOutOfReachSound, playMovesToSelectedObjectSound, setObjectReachContext } from './audio.js';
import { logMsg } from './log.js';
import { setButtonsLocked } from './motion.js';
import { createSrv, motionAllowed, ros } from './ros.js';
import { showCenterNotice, validatePose } from './util.js';

// ── YOLO 3D Objects ─────────────────────────────────────────────────────
// Kamerarate ist fuer eine Liste und ein 3D-Overlay deutlich mehr als noetig.
export const yoloSub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.zedBboxes3d,
  messageType: 'visualization_msgs/MarkerArray',
  throttle_rate: 100,
  queue_length: 1
});

// Kollisionswaende der erkannten Objekte (rot transparent, oben offen).
// yolo_moveit_collision.py publiziert sie nur, solange die MoveIt-Kollision
// fuer Objekte aktiv ist - sonst bleibt im Viewport nur der Rahmen.
export const yoloCollisionSub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.zedYoloCollisionMarkers,
  messageType: 'visualization_msgs/MarkerArray',
  throttle_rate: 100,
  queue_length: 1
});
yoloCollisionSub.subscribe((msg) => {
  if (typeof twin.updateDigitalTwinDetections === 'function') {
    twin.updateDigitalTwinDetections((msg && msg.markers) || []);
  }
});

// Ein erkanntes Objekt anfahren. Wird sowohl von der Liste "Detected
// Objects" als auch vom Klick auf die rote Greifkugel im Viewport benutzt,
// damit beide Wege garantiert identisch reagieren.
export function graspDetectedObject(name, source) {
  if (!name) return;
  logMsg('UI', `Clicked on YOLO object: ${name}${source ? ' (' + source + ')' : ''}`);
  const input = document.getElementById('inp-grasp-obj');
  if (input) input.value = name;
  // Die Greifkugel des gewaehlten Objekts pulsiert und glimmt, bis der
  // echte TCP sie erreicht hat - der Twin loest die Markierung selbst wieder
  // auf (Abstand zum TCP), hier wird sie nur gesetzt.
  if (typeof twin.setDigitalTwinSelectedGrasp === 'function') {
    twin.setDigitalTwinSelectedGrasp(name);
  }
  executeGrasp();
}

// ── Kontextmenue fuer erkannte Objekte ───────────────────────────────────
// Klick auf die Greifkugel im Viewport oder auf einen Listeneintrag oeffnet
// ein kleines Menue statt sofort zu greifen:
//   Approach from above  - MoveTo ueber den Greifpunkt, Greifer nach unten
//   Grasp                - bisherige Greif-Routine
//   Disable / Enable collision for this object
// Alle Texte kommen per textContent ins DOM - der Name ist Fremddaten.
// Die Kugel sitzt mittig auf der Oberseite der Objekt-Box (Radius 6,25 mm).
// 10 mm = TCP knapp ueber der Kugel. Das Backend (/ui/approach_from_above)
// faehrt erst kollisionsfrei auf eine Vorposition 70 mm darueber und senkt
// dann geradlinig und kollisionsgeprueft ab.
export const APPROACH_ABOVE_MM = 10;           // Hoehe ueber dem Greifpunkt
export const APPROACH_ORIENTATION = [Math.PI, 0, 0];   // Greifer zeigt nach unten
export let disabledCollisionObjects = new Set();
export let objMenuEl = null;

export const objectCollisionPub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.setObjectCollision,
  messageType: 'std_msgs/String'
});

new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.disabledCollisionObjects,
  messageType: 'std_msgs/String'
}).subscribe((msg) => {
  try {
    const list = JSON.parse(msg.data);
    disabledCollisionObjects = new Set(Array.isArray(list) ? list : []);
  } catch (e) {}
});

export function closeObjectMenu() {
  if (objMenuEl) objMenuEl.classList.add('is-hidden');
}

export function objMenuItem(icon, label, hint, onClick, opts = {}) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'obj-menu-item' + (opts.danger ? ' is-danger' : '');
  btn.disabled = !!opts.disabled;
  if (opts.title) btn.title = opts.title;
  const i = document.createElement('i');
  i.className = `fa-solid ${icon}`;
  const txt = document.createElement('span');
  txt.className = 'obj-menu-label';
  txt.textContent = label;
  btn.appendChild(i);
  btn.appendChild(txt);
  if (hint) {
    const h = document.createElement('span');
    h.className = 'obj-menu-hint';
    h.textContent = hint;
    btn.appendChild(h);
  }
  btn.addEventListener('click', () => {
    closeObjectMenu();
    onClick();
  });
  return btn;
}

// Laufende Anfahrt aus dem Viewport/Menue: Ziel [x, y, z] in mm. Endet die
// MoveIt-Fahrt ohne Erfolg, wird die Markierung der Kugel wieder geloest -
// sonst pulste sie bis zum Timeout weiter.
let approachTarget = null;
let approachVoicePlayed = false;

export function isApproachingObject() {
  return !!approachTarget;
}

export function triggerApproachVoice() {
  if (!approachTarget || approachVoicePlayed) return;
  approachVoicePlayed = true;
  playMovesToSelectedObjectSound();
}

function endApproach(reason) {
  if (!approachTarget) return;
  approachTarget = null;
  approachVoicePlayed = false;
  setObjectReachContext(false, reason ? 3000 : 0);
  if (reason && typeof twin.clearDigitalTwinSelectedGrasp === 'function') {
    twin.clearDigitalTwinSelectedGrasp();
    logMsg('UI', `Approach ended: ${reason}`, 'warn');
    // Verworfen, abgebrochen oder Not-Aus: kein Reichweitenproblem.
    if (!/discard|cancel|abort|emergency|e-stop|estop/i.test(reason)) {
      playOutOfReachSound();
    }
  }
}

new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.moveitMotionState,
  messageType: 'std_msgs/String'
}).subscribe((msg) => {
  if (!approachTarget) return;
  let st;
  try { st = JSON.parse(msg.data); } catch (e) { return; }
  if (!st || !Array.isArray(st.target)) return;
  // Nur auf die eigene Fahrt reagieren (Ziel auf 1 mm genau).
  if (st.target.some((v, i) => Math.abs(v - approachTarget[i]) > 1)) return;
  if (st.phase === 'executing') {
    triggerApproachVoice();
  }
  if (st.phase === 'succeeded') {
    // Fahrt beendet: Markierung wird gruen, kurz groesser und blendet aus.
    if (typeof twin.completeDigitalTwinSelectedGrasp === 'function') twin.completeDigitalTwinSelectedGrasp();
    endApproach(null);
  }
  else if (['failed', 'aborted', 'discarded'].includes(st.phase)) endApproach(st.message || st.phase);
});

export function approachObjectFromAbove(info) {
  if (!info || !info.grasp) {
    playOutOfReachSound();
    return;
  }
  const pose = [info.grasp.x, info.grasp.y, info.grasp.z + APPROACH_ABOVE_MM, ...APPROACH_ORIENTATION];
  const bad = validatePose(pose);
  if (bad) {
    logMsg('UI', `❌ Approach ${info.name} rejected: ${bad}`, 'err');
    playOutOfReachSound();
    return;
  }
  if (!motionAllowed('Approach from above')) return;
  if (typeof twin.setDigitalTwinSelectedGrasp === 'function') {
    twin.setDigitalTwinSelectedGrasp(info.name, APPROACH_ABOVE_MM / 1000);
  }
  approachTarget = pose.slice(0, 3);
  approachVoicePlayed = false;
  setObjectReachContext(true);
  setButtonsLocked(true);
  logMsg('UI', `➤ Approach ${info.name} from above: X=${pose[0]} Y=${pose[1]} Z=${pose[2]} mm (${APPROACH_ABOVE_MM} mm above grasp point)`, 'action');
  createSrv(SERVICES.approachFromAbove, 'xarm_msgs/MoveCartesian').callService(
    new ROSLIB.ServiceRequest({ pose, speed: 100.0, acc: 1000.0, mvtime: 0.0 }),
    (res) => {
      setButtonsLocked(false);
      if (res.ret === 0) logMsg('ROS', 'Approach accepted - collision-free path to the pre-position, then straight down.', 'info');
      else {
        logMsg('ROS', `❌ Approach rejected (ret=${res.ret}): ${res.message || 'Error'}`, 'err');
        endApproach(res.message || 'rejected');
        playOutOfReachSound();
      }
    },
    (err) => {
      setButtonsLocked(false);
      logMsg('ROS', `❌ Approach error: ${err}`, 'err');
      endApproach(String(err));
      playOutOfReachSound();
    }
  );
}

export function setObjectCollision(info, enabled) {
  if (!info || !info.collisionName) return;
  if (!motionAllowed('Collision change')) return;
  objectCollisionPub.publish(new ROSLIB.Message({
    data: JSON.stringify({ name: info.collisionName, enabled })
  }));
  logMsg('MoveIt', enabled
    ? `🟢 Collision for ${info.collisionName} enabled`
    : `⚠ Collision for ${info.collisionName} disabled - MoveIt ignores this object!`, enabled ? 'info' : 'warn');
}

export function openDetectedObjectMenu(info, clientX, clientY) {
  if (!info || !info.name) return;
  if (!objMenuEl) {
    objMenuEl = document.createElement('div');
    objMenuEl.className = 'obj-menu is-hidden';
    objMenuEl.setAttribute('role', 'menu');
    document.body.appendChild(objMenuEl);
    // Schliessen bei Klick daneben, Esc, Scrollen und Groessenaenderung
    document.addEventListener('pointerdown', (e) => {
      if (objMenuEl && !objMenuEl.contains(e.target)) closeObjectMenu();
    }, true);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeObjectMenu(); });
    window.addEventListener('resize', closeObjectMenu);
    document.addEventListener('scroll', closeObjectMenu, true);
  }
  objMenuEl.replaceChildren();

  const head = document.createElement('div');
  head.className = 'obj-menu-head';
  const title = document.createElement('span');
  title.className = 'obj-menu-title';
  title.textContent = info.name.replace(/_/g, ' ');
  head.appendChild(title);
  if (info.grasp) {
    const coords = document.createElement('span');
    coords.className = 'obj-menu-coords';
    // Achse, Wert und Einheit in der Achsenfarbe (wie EEF-Telemetrie), Trenner grau.
    ['x', 'y', 'z'].forEach((ax, i) => {
      if (i > 0) coords.appendChild(document.createTextNode(' · '));
      const part = document.createElement('span');
      part.className = `obj-menu-ax obj-menu-ax-${ax}`;
      part.textContent = `${ax.toUpperCase()} ${info.grasp[ax]} mm`;
      coords.appendChild(part);
    });
    head.appendChild(coords);
  }
  objMenuEl.appendChild(head);

  objMenuEl.appendChild(objMenuItem('fa-arrow-down', 'Approach from above', `+${APPROACH_ABOVE_MM} mm`,
    () => approachObjectFromAbove(info),
    { disabled: !info.grasp, title: info.grasp ? 'Move the TCP above the grasp point, gripper pointing down' : 'Grasp point unknown' }));
  objMenuEl.appendChild(objMenuItem('fa-hand-holding', 'Grasp', 'Not implemented',
    () => {
      logMsg('UI', 'ℹ️ Grasp function is not yet implemented.', 'info');
      showGraspNotImplemented();
    },
    { title: 'Grasp function is not yet implemented' }));

  const off = info.collisionName && disabledCollisionObjects.has(info.collisionName);
  objMenuEl.appendChild(objMenuItem(off ? 'fa-shield-halved' : 'fa-shield',
    off ? 'Enable collision for this object' : 'Disable collision for this object',
    info.collisionName || null,
    () => setObjectCollision(info, !!off),
    { danger: !off, disabled: !info.collisionName,
      title: off ? 'MoveIt avoids this object again' : 'MoveIt ignores this object until re-enabled' }));

  // Erst anzeigen, dann messen und in den sichtbaren Bereich schieben.
  objMenuEl.classList.remove('is-hidden');
  const r = objMenuEl.getBoundingClientRect();
  const m = 8;
  const x = Math.min(Math.max(m, clientX), window.innerWidth - r.width - m);
  const y = Math.min(Math.max(m, clientY), window.innerHeight - r.height - m);
  objMenuEl.style.left = `${x}px`;
  objMenuEl.style.top = `${y}px`;
}

// Der Name stammt aus dem YOLO-Marker, ist also Fremddaten. Frueher ging er
// ueber ein Template direkt in innerHTML - ein Klassenname mit < haette
// Markup einschleusen koennen. Der Aufbau laeuft deshalb ueber DOM-Knoten,
// Text landet ausschliesslich in textContent.
export function createYoloItem(item) {
  const el = document.createElement('div');
  el.className = 'yolo-item';
  el.dataset.id = item.name;
  el.onclick = (ev) => {
    const info = (typeof twin.getDetectedObjectInfo === 'function' && twin.getDetectedObjectInfo(item.name)) ||
                 { name: item.name, collisionName: null, grasp: null };
    openDetectedObjectMenu(info, ev.clientX, ev.clientY);
  };

  const icon = document.createElement('i');
  icon.className = 'fa-solid fa-cube';
  icon.style.color = 'var(--accent)';
  icon.style.fontSize = '16px';

  const details = document.createElement('div');
  details.className = 'yolo-details';

  const cls = document.createElement('span');
  cls.className = 'yolo-class';
  cls.textContent = item.name;

  const coords = document.createElement('span');
  coords.className = 'yolo-coords';
  [['coord-x', 'X', item.x, 'var(--rviz-x)'],
   ['coord-y', 'Y', item.y, 'var(--rviz-y)'],
   ['coord-z', 'Z', item.z, 'var(--rviz-z)']].forEach(([cn, ax, val, col]) => {
    const sp = document.createElement('span');
    sp.className = cn;
    sp.style.color = col;
    sp.textContent = `${ax}:${val}`;
    coords.appendChild(sp);
  });
  const unit = document.createElement('span');
  unit.style.color = 'var(--mut)';
  unit.textContent = '[mm]';
  coords.appendChild(unit);

  details.appendChild(cls);
  details.appendChild(coords);
  el.appendChild(icon);
  el.appendChild(details);
  return el;
}

yoloSub.subscribe((msg) => {
  // 3D-Overlay im WebGL-Viewport zuerst bedienen - und bewusst VOR dem
  // yolo-container-Guard: fehlt die Liste im DOM, soll das Overlay trotzdem
  // laufen. Der Twin bekommt das komplette MarkerArray (Box, Greifpunkt,
  // Labels), die Liste unten filtert weiterhin nur die Text-Marker heraus.
  if (typeof twin.updateDigitalTwinDetections === 'function') {
    twin.updateDigitalTwinDetections((msg && msg.markers) || []);
  }

  const container = document.getElementById('yolo-container');
  if (!container) return;
  
  const detected = [];
  if (msg.markers && msg.markers.length > 0) {
    msg.markers.forEach(m => {
      if (m.type !== 9) return;
      
      const objName = m.text || 'Unknown';
      if (objName.startsWith('X:') || objName.startsWith('Y:') || objName.startsWith('Z:')) return;
      
      detected.push({
        name: objName,
        x: (m.pose.position.x * 1000).toFixed(0),
        y: (m.pose.position.y * 1000).toFixed(0),
        z: (m.pose.position.z * 1000).toFixed(0)
      });
    });
  }

  // Deterministic stable sort (alphabetical & numerical, e.g. sports_ball_1 before sports_ball_2)
  detected.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  if (detected.length === 0) {
    if (!container.querySelector('.yolo-empty')) {
      const empty = document.createElement('div');
      empty.className = 'yolo-empty';
      empty.textContent = 'No objects detected.';
      container.replaceChildren(empty);
    }
    return;
  }

  // Remove "No objects detected" placeholder if present
  const emptyEl = container.querySelector('.yolo-empty');
  if (emptyEl) emptyEl.remove();

  // Remove objects that no longer exist
  const detectedNames = new Set(detected.map(d => d.name));
  container.querySelectorAll('.yolo-item').forEach(el => {
    if (!detectedNames.has(el.getAttribute('data-id'))) {
      el.remove();
    }
  });

  // In-Place Update & geordnete DOM-Platzierung ohne Springen.
  // Die vorhandenen Eintraege werden einmal in eine Map gelegt, statt je
  // Objekt einen CSS-Selektor aus dem Namen zusammenzubauen - ein
  // Anfuehrungszeichen darin haette querySelector einen SyntaxError werfen
  // lassen und den ganzen Callback abgebrochen.
  const existing = new Map();
  container.querySelectorAll('.yolo-item').forEach(el => {
    existing.set(el.dataset.id, el);
  });

  detected.forEach((item, index) => {
    let el = existing.get(item.name);
    if (el) {
      const xSpan = el.querySelector('.coord-x');
      const ySpan = el.querySelector('.coord-y');
      const zSpan = el.querySelector('.coord-z');
      if (xSpan && xSpan.textContent !== `X:${item.x}`) xSpan.textContent = `X:${item.x}`;
      if (ySpan && ySpan.textContent !== `Y:${item.y}`) ySpan.textContent = `Y:${item.y}`;
      if (zSpan && zSpan.textContent !== `Z:${item.z}`) zSpan.textContent = `Z:${item.z}`;
    } else {
      el = createYoloItem(item);
    }

    if (container.children[index] !== el) {
      container.insertBefore(el, container.children[index] || null);
    }
  });
});

// ── Greifer ─────────────────────────────────────────────────────────────
// Die Buttons steuern den Greifer jetzt wirklich: der Befehl geht an
// joy_to_servo_node (/ui/gripper_cmd), der auch die Gamepad-Tasten A/B
// bedient und damit der einzige Besitzer des Greiferzustands ist. Die
// Anzeige folgt ausschliesslich dem gemeldeten Zustand (/ui/gripper_state).
export const gripperCmdPub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.gripperCmd,
  messageType: 'std_msgs/String'
});
export let gripperType = null;     // 'vacuum' | 'gripper' | 'none' | null (unbekannt)
export let gripperState = null;    // 'open' | 'closed' | 'off' | 'unknown'

export function setGripper(state) {
  if (!motionAllowed('Gripper command')) return;
  if (gripperType === 'none') {
    logMsg('UI', '❌ No gripper configured (launch without add_gripper / add_vacuum_gripper).', 'err');
    return;
  }
  logMsg('UI', `➤ Gripper Command: ${state.toUpperCase()}`);
  gripperCmdPub.publish(new ROSLIB.Message({ data: state }));
}

export function applyGripperState(state, flash) {
  const btns = {
    open: document.getElementById('btn-grip-open'),
    closed: document.getElementById('btn-grip-close'),
    off: document.getElementById('btn-grip-off'),
  };
  if (!btns.open || !btns.closed || !btns.off) return;
  const cls = { open: 'grip-flash-open', closed: 'grip-flash-close', off: 'grip-off-active' };
  Object.keys(btns).forEach((k) => btns[k].classList.remove(cls[k], 'gripper-active'));
  const btn = btns[state];
  if (!btn) return;
  if (flash) void btn.offsetWidth;   // Animation neu starten
  btn.classList.add(cls[state], 'gripper-active');
}

export function applyGripperType(type) {
  // Vakuumgreifer: Close = Saugen an (haelt), Open / Off = Saugen aus.
  // Zwei-Finger-Greifer: auf / zu / aus (Haltekraft loesen).
  const vacuum = type === 'vacuum';
  const cfg = {
    'btn-grip-open':  vacuum ? ['Release', 'Vacuum gripper: suction off (release)'] : ['Open', 'Gripper: open'],
    'btn-grip-close': vacuum ? ['Suction', 'Vacuum gripper: suction on (grip)'] : ['Close', 'Gripper: close'],
    'btn-grip-off':   vacuum ? ['Off', 'Vacuum gripper: off'] : ['Off', 'Gripper: off (release holding force)'],
  };
  const none = type === 'none';
  const pad = vacuum ? 'A = suction on/off' : 'A = open/close';
  Object.keys(cfg).forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    const [label, title] = cfg[id];
    const span = btn.querySelector('span');
    if (span) span.textContent = label;
    btn.disabled = none;
    btn.style.opacity = none ? '0.4' : '';
    btn.title = none
      ? 'No gripper configured (launch argument add_gripper / add_vacuum_gripper)'
      : `${title} (Gamepad: ${pad}, B = off)`;
  });
}

new ROSLIB.Topic({ ros: ros, name: TOPICS.gripperType, messageType: 'std_msgs/String' })
  .subscribe((msg) => {
    if (gripperType !== msg.data) {
      gripperType = msg.data;
      logMsg('System', `Gripper type: ${gripperType}`, 'info');
    }
    applyGripperType(gripperType);
  });

new ROSLIB.Topic({ ros: ros, name: TOPICS.gripperState, messageType: 'std_msgs/String' })
  .subscribe((msg) => {
    const changed = gripperState !== msg.data;
    gripperState = msg.data;
    applyGripperState(gripperState, changed);
  });

// Rueckmeldungen des Gamepad-Nodes (Greifer, Initialpose, Whisper)
new ROSLIB.Topic({ ros: ros, name: TOPICS.joyButtonPresses, messageType: 'std_msgs/String' })
  .subscribe((msg) => {
    if (msg.data && msg.data.startsWith('Greifer')) logMsg('ROS', msg.data, msg.data.includes('Fehler') || msg.data.includes('nicht') ? 'warn' : 'info');
  });

export const graspPub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.graspObjectCmd,
  messageType: 'std_msgs/String'
});

function showGraspNotImplemented() {
  showCenterNotice('Grasp not available yet',
    'The grasp function is not implemented yet. Use "Approach from above" to move the gripper over the object.',
    'fa-hand-holding');
}

export function executeGrasp() {
  logMsg('UI', 'ℹ️ Grasp function is not yet implemented.', 'info');
  showGraspNotImplemented();
}

// Viewport: Linksklick auf die Greifkugel faehrt darueber, Rechtsklick oeffnet das Menue.
twin.twinHooks.openDetectedObjectMenu = openDetectedObjectMenu;
twin.twinHooks.graspDetectedObject = graspDetectedObject;
twin.twinHooks.approachDetectedObject = approachObjectFromAbove;
twin.twinHooks.isApproachingObject = isApproachingObject;
twin.twinHooks.triggerApproachVoice = triggerApproachVoice;

