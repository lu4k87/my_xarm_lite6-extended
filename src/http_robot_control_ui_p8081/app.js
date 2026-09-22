// ── Globals & States (Strikt oben deklariert!) ──────────────────────────
let ros;
let currentFrame = 'link_base';
let speedScale = 0.3;
let lastSpeedIndex = -1;
let jogActive = false;
let joyActive = false;
let jogTimer = null;
let jogZeroCount = 0;
let targetTwist = { lx: 0, ly: 0, lz: 0, ax: 0, ay: 0, az: 0 };
let smoothedTwist = { lx: 0, ly: 0, lz: 0, ax: 0, ay: 0, az: 0 };
const SMOOTHING_FACTOR = 0.5;
const JOYSTICK_DEADZONE = 0.001;

let activeJointJog = -1;
let jointJogVelocity = 0;
let jointJogStartX = 0;
let jointJogTimer = null;

let currentServoStatus = 0;
let isRobotMoving = false;
let movingTimeout = null;

let latestJointVals = [0, 0, 0, 0, 0, 0];
let latestEEF_X = null;
let latestEEF_Y = null;
let latestEEF_Z = null;
let lastServoStatus = 0;
let activeCollisionText = '';
let collisionTextClearTimer = null;
let lastReportedSafetyState = 'normal'; // 'normal', 'singularity', 'collision'

// Grenzwerte zentral aus robot_limits.js. Fallback nur, falls die Datei fehlt.
const LIM = window.ROBOT_LIMITS || {
  SELF_COLLISION_MM: 118.0, HARD_BLOCK_MM: 125.0, SINGULARITY_MM: 138.0,
  MANIP_FADE_MM: 180.0, LOW_Z_MM: 280.0, FLOOR_CLEARANCE_MM: 15.0,
  POSE_MAX_MM: 1000.0, POSE_MAX_RAD: 2.0 * Math.PI,
};

// ── Kleine Helfer ─────────────────────────────────────────────────────────
// localStorage wirft im Inkognito-Fenster und bei blockierten Site-Daten.
// Bisher war nur ein Teil der Zugriffe abgesichert, der Rest haette die
// jeweilige Funktion mitgerissen.
function lsGet(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch (e) {
    return fallback;
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    return false;
  }
}

// Eine Posen-Eingabe lesen. Fehlt das Feld, kommt NaN zurueck - das faengt
// validatePose() ab, statt dass ein TypeError die Funktion abbricht.
function readPoseInput(id) {
  const el = document.getElementById(id);
  return el ? parseFloat(el.value) : NaN;
}

// Letzte Pruefung vor dem Roboter. Vorher ging der Wert aus dem Eingabefeld
// voellig ungeprueft in den Service-Request: ein leeres Feld ergab NaN, das
// ueber JSON als null beim Node ankam.
// Die Grenzen sind bewusst weit - der Arbeitsraum endet laengst vorher, hier
// geht es nur darum, offensichtlichen Unsinn nicht abzuschicken.
function validatePose(pose) {
  const names = ['X', 'Y', 'Z', 'Roll', 'Pitch', 'Yaw'];
  for (let i = 0; i < 6; i++) {
    const v = pose[i];
    if (!Number.isFinite(v)) {
      return `${names[i]} ist keine gueltige Zahl`;
    }
    const max = (i < 3) ? LIM.POSE_MAX_MM : LIM.POSE_MAX_RAD;
    if (Math.abs(v) > max) {
      const unit = (i < 3) ? 'mm' : 'rad';
      return `${names[i]}=${v} liegt ausserhalb von ±${max.toFixed(2)} ${unit}`;
    }
  }
  return null;
}

let uiClickSound = null;
let scanPosSound = null;
try {
  uiClickSound = new Audio('sounds/ui_mouse_click.mp3');
  scanPosSound = new Audio('sounds/_voice_robot_moves_to_scan_pos.mp3');
} catch (e) {}

// ── ROS Connection ────────────────────────────────────────────────────────
// Host und URL werden genau einmal bestimmt. Vorher stand "const host" in vier
// getrennten Scopes, und die Log-Ausgabe nannte fest "localhost", obwohl die
// UI je nach Aufruf unter 127.0.0.2 laeuft.
const ROS_HOST = window.location.hostname || 'localhost';
const ROS_URL = 'ws://' + ROS_HOST + ':9090';

try {
  ros = new ROSLIB.Ros({ url: ROS_URL });
} catch (e) {
  const statusEl = document.getElementById('connection-status');
  if (statusEl) statusEl.innerText = 'JS Error';
  console.error("Failed to init ROSLIB", e);
}

// Node-Checker und Metadaten-Abo werden GENAU EINMAL eingerichtet, nicht in
// ros.on('connection'). Dort kam bei jedem Reconnect ein weiterer Timer bzw.
// ein weiteres Topic-Objekt dazu, beides ohne Abbau - nach laengerem
// rosbridge-Ausfall lief der Poll vielfach parallel.
// Topics duerfen auf Modulebene stehen: roslibjs setzt reconnect_on_close
// per Default auf true und schickt das subscribe nach einem Reconnect
// selbsttaetig erneut.
let getNodesClient = null;
let paramClient = null;

function checkRosNodes() {
  if (!ros || !ros.isConnected) return;
  if (!getNodesClient) {
    getNodesClient = new ROSLIB.Service({
      ros: ros,
      name: '/rosapi/nodes',
      serviceType: 'rosapi/Nodes'
    });
  }

  getNodesClient.callService(new ROSLIB.ServiceRequest({}), (result) => {
    // ── 3D Scene Objects Node Detection ──
    if (typeof checkSceneObjectsNodeState === 'function') {
      checkSceneObjectsNodeState(result ? result.nodes : null);
    }

    const dot = document.getElementById('mode-dot');
    const text = document.getElementById('mode-status');
    if (!dot || !text) return;

    let driverNode = null;
    if (result && result.nodes) {
      driverNode = result.nodes.find(n => n.includes('ufactory_driver'));
    }

    if (driverNode) {
      dot.className = 'dot glow-green';

      if (!paramClient) {
        paramClient = new ROSLIB.Service({
          ros: ros,
          name: '/rosapi/get_param',
          serviceType: 'rosapi/GetParam'
        });
      }

      paramClient.callService(new ROSLIB.ServiceRequest({
        name: `${driverNode}/robot_ip`,
        default: ''
      }), (paramResult) => {
        try {
          if (paramResult && paramResult.value) {
            let ip = paramResult.value;
            // rosapi in ROS2 returns JSON encoded strings, e.g. '"192.168.1.127"'
            ip = ip.replace(/"/g, ''); 
            if (ip && ip.length > 5) {
              // Kein innerHTML: der Wert kommt aus einem ROS-Parameter und ist
              // damit Fremddaten. Aufbau ueber DOM-Knoten statt String.
              text.textContent = 'Real Arm';
              text.appendChild(document.createElement('br'));
              const ipEl = document.createElement('span');
              ipEl.style.fontSize = '0.85em';
              ipEl.style.color = '#00cec9';
              ipEl.textContent = ip;
              text.appendChild(ipEl);
            } else {
              text.innerText = `Mode: Real Arm`;
            }
          } else {
            text.innerText = `Mode: Real Arm`;
          }
        } catch (e) {
          text.innerText = `Mode: Real Arm`;
        }
      }, (err) => { 
        text.innerText = `Mode: Real Arm`;
      });
    } else {
      dot.className = 'dot glow-blue';
      text.innerText = 'Mode: Fake Arm';
    }
  }, (err) => {
    // Swallow errors silently in case /rosapi/nodes does not exist yet.
    // Prevents "polluting" the WebSocket connection.
  });
}

setInterval(checkRosNodes, 2500);

// Live ROS Environment Metadata (Topic: /dashboard/workspace_metadata)
try {
  const metaTopic = new ROSLIB.Topic({
    ros: ros,
    name: '/dashboard/workspace_metadata',
    messageType: 'std_msgs/String',
    throttle_rate: 1000,
    queue_length: 1
  });
  metaTopic.subscribe((msg) => {
    try {
      const data = JSON.parse(msg.data);
      if (data) {
        if (data.ros_domain_id) {
          const el = document.getElementById('val-domain-id');
          if (el) el.innerText = data.ros_domain_id;
        }
        if (data.rmw_impl) {
          const el = document.getElementById('val-rmw-impl');
          if (el) el.innerText = data.rmw_impl;
        }
        if (data.localhost_only !== undefined) {
          const el = document.getElementById('val-localhost-only');
          const dot = document.getElementById('dot-localhost-only');
          const isOn = data.localhost_only === '1' || data.localhost_only === 1;
          if (el) el.innerText = isOn ? 'On' : 'Off';
          if (dot) dot.className = isOn ? 'dot glow-orange' : 'dot glow-blue';
        }
      }
    } catch (err) {}
  });
} catch (e) {
  console.warn("Could not subscribe to /dashboard/workspace_metadata", e);
}

ros.on('connection', () => {
  const connStatus = document.getElementById('connection-status');
  if (connStatus) connStatus.innerText = 'ROS 2 Bridge: 9090';
  const connDot = document.getElementById('connection-dot');
  if (connDot) connDot.className = 'dot glow-green';
  logMsg('System', `Connected to rosbridge_server (${ROS_URL})`, 'info');
  if (typeof publishSoundState === 'function') publishSoundState();
  // Sofort einmal pruefen, statt bis zu 2,5 s auf den naechsten Tick zu warten.
  checkRosNodes();
});

ros.on('error', (error) => {
  const connStatus = document.getElementById('connection-status');
  if (connStatus) connStatus.innerText = 'ROS 2 Bridge: 9090';
  const connDot = document.getElementById('connection-dot');
  if (connDot) connDot.className = 'dot glow-red';
  logMsg('System', 'Error connecting to websocket server', 'err');
});

let reconnectTimer = null;

ros.on('close', () => {
  const connStatus = document.getElementById('connection-status');
  if (connStatus) connStatus.innerText = 'ROS 2 Bridge: 9090';
  const connDot = document.getElementById('connection-dot');
  if (connDot) connDot.className = 'dot glow-red';
  const modeDot = document.getElementById('mode-dot');
  if (modeDot) modeDot.className = 'dot glow-red';
  const modeStatus = document.getElementById('mode-status');
  if (modeStatus) modeStatus.innerText = 'Mode: Offline';

  if (!reconnectTimer) {
    logMsg('System', 'Connection closed. Retrying in 3s...', 'warn');
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (ros) ros.connect(ROS_URL);
    }, 3000);
  }
});

// ── Shared Messages ─────────────────────────────────────────────────────
let twistMsg = new ROSLIB.Message({
  header: { frame_id: currentFrame },
  twist: {
    linear: { x: 0, y: 0, z: 0 },
    angular: { x: 0, y: 0, z: 0 }
  }
});

let jointJogMsg = new ROSLIB.Message({
  header: { frame_id: currentFrame },
  joint_names: [],
  velocities: [],
  displacements: [],
  duration: 0.0
});

// ── ROS Topics / Services ───────────────────────────────────────────────
const twistPub = new ROSLIB.Topic({
  ros: ros,
  name: '/servo_server/delta_twist_cmds',
  messageType: 'geometry_msgs/TwistStamped'
});

const jointJogPub = new ROSLIB.Topic({
  ros: ros,
  name: '/servo_server/delta_joint_cmds',
  messageType: 'control_msgs/JointJog'
});

const logSub = new ROSLIB.Topic({
  ros: ros,
  name: '/ui/grasp_status',
  messageType: 'std_msgs/String'
});
logSub.subscribe((msg) => logMsg('ROS', msg.data, 'info'));

const motionStatusSub = new ROSLIB.Topic({
  ros: ros,
  name: '/ui/motion_status',
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
  logMsg('Motion', text, type);
});

const speedIndexPub = new ROSLIB.Topic({
  ros: ros,
  name: '/ui/robot_control/set_speed_index',
  messageType: 'std_msgs/Int32'
});

const speedSub = new ROSLIB.Topic({
  ros: ros,
  name: '/ui/robot_control/current_speed',
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

const scanSpeedPub = new ROSLIB.Topic({
  ros: ros,
  name: '/ui/scan_speed',
  messageType: 'std_msgs/Int32'
});

function updateScanSpeed() {
  const radios = document.getElementsByName('scanSpeed');
  let val = 1;
  for (let i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      val = parseInt(radios[i].value);
      break;
    }
  }
  const speedNames = ["Slow", "Normal", "Fast"];
  logMsg('UI', `Action Speed set to: ${speedNames[val]}`);
  scanSpeedPub.publish(new ROSLIB.Message({ data: val }));
}

// ── Linear Axis ─────────────────────────────────────────────────────────
const linearAxisPub = new ROSLIB.Topic({
  ros: ros,
  name: '/linear_axis_cmd',
  messageType: 'std_msgs/Float64'
});

function updateLinearAxis(val) {
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
  if (typeof window.updateDigitalTwinJoints === 'function') {
    window.updateDigitalTwinJoints(null, numVal);
  }
}

// ── YOLO 3D Overlay im Viewport ein-/ausblenden ─────────────────────────
// Zustand in localStorage, damit die Ansicht einen Reload ueberlebt.
const TWIN_DETECTIONS_LS_KEY = 'twin_detections_visible';

function applyTwinDetectionsBtn(visible) {
  const btn = document.getElementById('btn-twin-detections');
  if (!btn) return;
  btn.style.color = visible ? 'var(--accent)' : 'var(--dim)';
  btn.style.opacity = visible ? '1' : '0.5';
}

function toggleTwinDetections() {
  if (typeof window.setDigitalTwinDetectionsVisible !== 'function') return;
  const now = !window.getDigitalTwinDetectionsVisible();
  window.setDigitalTwinDetectionsVisible(now);
  applyTwinDetectionsBtn(now);
  lsSet(TWIN_DETECTIONS_LS_KEY, now ? '1' : '0');
  logMsg('UI', `YOLO 3D overlay ${now ? 'enabled' : 'disabled'}`);
}

function restoreTwinDetections() {
  let visible = true;   // Labels und Boxen sind standardmaessig an
  try {
    const saved = lsGet(TWIN_DETECTIONS_LS_KEY);
    if (saved !== null) visible = (saved === '1');
  } catch (e) {}
  if (typeof window.setDigitalTwinDetectionsVisible === 'function') {
    window.setDigitalTwinDetectionsVisible(visible);
  }
  applyTwinDetectionsBtn(visible);
}

document.addEventListener('DOMContentLoaded', () => setTimeout(restoreTwinDetections, 400));

// ── YOLO 3D Objects ─────────────────────────────────────────────────────
// Kamerarate ist fuer eine Liste und ein 3D-Overlay deutlich mehr als noetig.
const yoloSub = new ROSLIB.Topic({
  ros: ros,
  name: '/zed/bboxes_3d',
  messageType: 'visualization_msgs/MarkerArray',
  throttle_rate: 100,
  queue_length: 1
});

// Ein erkanntes Objekt anfahren. Wird sowohl von der Liste "Detected
// Objects" als auch vom Klick auf die rote Greifkugel im Viewport benutzt,
// damit beide Wege garantiert identisch reagieren.
window.graspDetectedObject = function (name, source) {
  if (!name) return;
  logMsg('UI', `Clicked on YOLO object: ${name}${source ? ' (' + source + ')' : ''}`);
  const input = document.getElementById('inp-grasp-obj');
  if (input) input.value = name;
  executeGrasp();
};

// Der Name stammt aus dem YOLO-Marker, ist also Fremddaten. Frueher ging er
// ueber ein Template direkt in innerHTML - ein Klassenname mit < haette
// Markup einschleusen koennen. Der Aufbau laeuft deshalb ueber DOM-Knoten,
// Text landet ausschliesslich in textContent.
function createYoloItem(item) {
  const el = document.createElement('div');
  el.className = 'yolo-item';
  el.dataset.id = item.name;
  el.onclick = () => window.graspDetectedObject(item.name, 'list');

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
   ['coord-z', 'Z', item.z, 'var(--rviz-z)']].forEach(([cn, ax, val, col], i) => {
    const sp = document.createElement('span');
    sp.className = cn;
    sp.style.color = col;
    if (i > 0) sp.style.marginLeft = '6px';
    sp.textContent = `${ax}:${val}`;
    coords.appendChild(sp);
  });
  const unit = document.createElement('span');
  unit.style.color = 'var(--mut)';
  unit.style.marginLeft = '6px';
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
  if (typeof window.updateDigitalTwinDetections === 'function') {
    window.updateDigitalTwinDetections((msg && msg.markers) || []);
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
      container.innerHTML = '<div class="yolo-empty">No objects detected.</div>';
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

// /joint_states laeuft je nach Treiber mit 100-250 Hz. 30 Hz reichen fuer
// Slider und Digital Twin vollauf und entlasten den WebSocket spuerbar.
const jointStateSub = new ROSLIB.Topic({
  ros: ros,
  name: '/joint_states',
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
        let pct = ((val + 3.14) / 6.28) * 100;
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
  if (typeof window.updateDigitalTwinJoints === 'function' && currentJointVals.length === 6) {
    window.updateDigitalTwinJoints(currentJointVals);
  }
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

const eefSub = new ROSLIB.Topic({
  ros: ros,
  name: '/ui/eef_position',
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
const servoStatusTopic = new ROSLIB.Topic({
  ros: ros,
  name: '/servo_server/status',
  messageType: 'std_msgs/Int8'
});

servoStatusTopic.subscribe((msg) => {
  lastServoStatus = Number(msg.data) || 0;
  evaluateRobotSafety();
});

// 2. Pre-Collision Checker Topic
const collisionMsgTopic = new ROSLIB.Topic({
  ros: ros,
  name: '/ui/collision_msg',
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

function evaluateRobotSafety() {
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
  if (latestEEF_Z !== null && !isNaN(latestEEF_Z)) {
    if (latestEEF_Z <= LIM.FLOOR_CLEARANCE_MM) {
      isCollision = true;
      collidingLinks = ['link6', 'vacuum', 'gripper'];
      message = `PLANE COLLISION (Z: ${latestEEF_Z.toFixed(1)} mm ≤ ${LIM.FLOOR_CLEARANCE_MM} mm)`;
    }
  }

  // C. Inner Workspace Boundary & Self-Collision Deadzone (r = sqrt(x^2 + y^2))
  if (latestEEF_X !== null && latestEEF_Y !== null && !isNaN(latestEEF_X) && !isNaN(latestEEF_Y)) {
    const r_xy = Math.sqrt(latestEEF_X * latestEEF_X + latestEEF_Y * latestEEF_Y);
    const isLowZ = (latestEEF_Z !== null && latestEEF_Z < LIM.LOW_Z_MM);
    if (r_xy < LIM.SELF_COLLISION_MM && isLowZ) {
      isCollision = true;
      collidingLinks = ['link6', 'link5', 'link2', 'link1'];
      message = `SELF-COLLISION / INNER CYLINDER (r: ${r_xy.toFixed(0)} mm < ${LIM.SELF_COLLISION_MM} mm)`;
    } else if (r_xy < LIM.SINGULARITY_MM && isLowZ) {
      if (!isCollision) {
        isSingularity = true;
        singularityJoints = ['link5', 'link4', 'link2'];
        message = `INNER BOUNDARY SINGULARITY (r: ${r_xy.toFixed(0)} mm < ${LIM.SINGULARITY_MM} mm)`;
      }
    }
  }

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

  // Factor in inner deadzone to manipulability indicator
  if (latestEEF_X !== null && latestEEF_Y !== null) {
    const r_xy = Math.sqrt(latestEEF_X * latestEEF_X + latestEEF_Y * latestEEF_Y);
    if (r_xy < LIM.MANIP_FADE_MM && latestEEF_Z !== null && latestEEF_Z < LIM.LOW_Z_MM) {
      // Von SELF_COLLISION_MM (0 %) linear bis MANIP_FADE_MM (100 %).
      const span = LIM.MANIP_FADE_MM - LIM.SELF_COLLISION_MM;
      const rPct = Math.min(100, Math.max(0, Math.round(((r_xy - LIM.SELF_COLLISION_MM) / span) * 100)));
      manipPct = Math.min(manipPct, rPct);
    }
  }

  // Dispatch live state to WebGL Digital Twin
  if (typeof window.updateDigitalTwinSafety === 'function') {
    window.updateDigitalTwinSafety({
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

// ── UI Actions ──────────────────────────────────────────────────────────
// ── Log Output: Escaping + Syntax-Highlighting ──────────────────────────────
// Nur &, < und > maskieren. Das " bleibt stehen, damit die String-Erkennung
// unten greift - der Text landet ausschliesslich im Elementinhalt, nie in
// einem Attribut. Vorher ging der Text ungeprueft in innerHTML.
const LOG_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
function escapeLogText(s) {
  return String(s).replace(/[&<>]/g, (c) => LOG_ESCAPES[c]);
}

// Ein einziger Durchlauf mit Alternation: was in der Reihenfolge frueher
// steht, gewinnt. So kann kein Treffer in einem bereits erzeugten <span>
// landen.
// "on"/"off" stehen bewusst NICHT in der Bool-Liste: "Publishing on /tf"
// waere sonst faelschlich eingefaerbt. Die Zahl verlangt links einen
// Nicht-Buchstaben, sonst wuerde aus "J5" ein eingefaerbtes "5".
const LOG_TOKEN_RE = new RegExp([
  /(\b[a-z][a-z0-9+.-]*:\/\/[^\s,;)]+)/.source,                          // 1 URL
  /("[^"]*"|'[^']*')/.source,                                             // 2 String
  /((?<![\w)])\/[A-Za-z_][A-Za-z0-9_]*(?:\/[A-Za-z0-9_]+)*)/.source,      // 3 Topic/Pfad
  /\b([XYZ])(?=\s*[:=])/.source,                                          // 4 Achse
  /\b(true|false|enabled|disabled|active|inactive)\b/.source,             // 5 Bool
  /\b([a-z_][a-z0-9_]*)(?=:=)/.source,                                    // 6 Parametername
  /(?<=:=)([A-Za-z_][A-Za-z0-9_.-]*)/.source,                             // 7 Wert hinter :=
  /(?<![A-Za-z_])([-+]?\d+(?:[.,]\d+)?)\s*(mm|cm|m|deg|rad|°|%|Hz|ms|s)?(?![A-Za-z])/.source, // 8 Zahl (+9 Einheit)
].join('|'), 'gi');

function highlightLog(raw) {
  const src = escapeLogText(raw);
  const span = (cls, txt) => `<span class="${cls}">${txt}</span>`;

  // Ein Wert uebernimmt die Farbe der Variablen direkt davor:
  // "X: 300" -> 300 rot wie X, "camera:=zed_m" -> zed_m blau wie camera.
  // carryClass haelt die Farbe, carryEnd die Position hinter der Variablen -
  // uebernommen wird nur, wenn dazwischen bloss ":", ":=" oder Leerzeichen
  // stehen.
  let carryClass = null;
  let carryEnd = -1;

  return src.replace(LOG_TOKEN_RE, (...args) => {
    const m = args[0];
    const [url, str, path, axis, bool, key, val, num, unit] = args.slice(1, 10);
    const offset = args[10];

    const inherited = (carryClass !== null && /^\s*:?=?\s*$/.test(src.slice(carryEnd, offset)))
      ? carryClass
      : null;
    carryClass = null;
    carryEnd = -1;

    if (url) return span('log-path', url);
    if (str) return span('log-str', str);
    if (path) return span('log-path', path);
    if (axis) {
      carryClass = 'log-ax-' + axis.toLowerCase();
      carryEnd = offset + m.length;
      return span(carryClass, axis);
    }
    if (bool) {
      const isOn = /^(true|enabled|active)$/i.test(bool);
      return span(`log-bool-${isOn ? 'on' : 'off'}`, bool);
    }
    if (key) {
      carryClass = 'log-key';
      carryEnd = offset + m.length;
      return span('log-key', key);
    }
    if (val) return span(inherited || 'log-key', val);
    if (num) {
      // rest ist " mm" o.ae. - oder nur der vom \s* geschluckte Abstand,
      // der sonst verloren ginge.
      const rest = m.slice(num.length);
      return span(inherited || 'log-num', num) +
             (unit ? span('log-unit', rest) : rest);
    }
    return m;
  });
}

const LOG_SRC_CLASSES = {
  'ROS': 'log-src-ros',
  'UI': 'log-src-ui',
  'System': 'log-src-sys',
  'Motion': 'log-src-motion',
  'GIZMO': 'log-src-gizmo',
  'VOICE': 'log-src-voice',
  'AUDIO': 'log-src-audio',
};

function logMsg(source, text, type='info') {
  const win = document.getElementById('log-window');
  if(!win) return;
  const d = new Date();
  const timeStr = d.toTimeString().split(' ')[0];
  const div = document.createElement('div');
  div.className = 'log-entry';

  let autoType = type;
  if (text.includes('✓')) autoType = 'success';
  else if (text.includes('❌')) autoType = 'err';
  else if (text.includes('➤')) autoType = 'action';
  else if (text.includes('⚠')) autoType = 'warn';

  const srcClass = LOG_SRC_CLASSES[source] || 'log-src-sys';

  // Der Zeitstempel steht nicht mehr in der Zeile - er haengt als data-time
  // am Quellen-Tag und wird per CSS beim Hover eingeblendet.
  div.innerHTML = `<span class="log-src ${srcClass}" data-time="${timeStr}">[${source}]</span> ` +
                  `<span class="log-${autoType}">${highlightLog(text)}</span>`;
  win.appendChild(div);
  win.scrollTop = win.scrollHeight;
}

function updateSpeed(val) {
  const index = parseInt(val);
  speedIndexPub.publish(new ROSLIB.Message({ data: index }));
  const slider = document.getElementById('speed-slider');
  if (slider) slider.style.backgroundSize = (index / 4 * 100) + '% 100%';
  const percentages = ["20%", "40%", "60%", "80%", "100%"];
  const displayLevel = index + 1;
  const speedValElement = document.getElementById('speed-val');
  if (speedValElement) {
    speedValElement.innerText = `${displayLevel}/5 (${percentages[index]})`;
  }
}



function setFrame(frame) {
  currentFrame = frame;
  document.querySelectorAll('.frame-btn').forEach(b => b.classList.remove('active', 'btn-primary'));
  const btn = document.getElementById(frame === 'link_tcp' ? 'btn-frame-tcp' : 'btn-frame-base');
  if(btn) btn.classList.add('active', 'btn-primary');
  
  twistMsg.header.frame_id = currentFrame;
  logMsg('UI', `Control Frame set to ${frame}`);
}

function startObjectScan() {
  setButtonsLocked(true);
  logMsg('UI', `➤ Starting Object Cross Scan...`);
  const scanClient = new ROSLIB.Service({
    ros: ros,
    name: '/ui/start_object_scan',
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

function emergencyStop() {
  logMsg('UI', `🚨 EMERGENCY STOP TRIGGERED!`, 'err');
  
  // Use a topic instead of a service to bypass rosbridge blocking when a service is already running
  const stopTopic = new ROSLIB.Topic({
    ros: ros,
    name: '/ui/emergency_stop_topic',
    messageType: 'std_msgs/Empty'
  });
  
  stopTopic.publish(new ROSLIB.Message({}));
  logMsg('System', 'STOP signal published via Topic (Bypassing Service Queue).', 'info');
}

function setGripper(state) {
  logMsg('UI', `➤ Gripper Command: ${state.toUpperCase()}`);
  
  const btnOpen = document.getElementById('btn-grip-open');
  const btnClose = document.getElementById('btn-grip-close');
  const btnOff = document.getElementById('btn-grip-off');
  
  if(!btnOpen || !btnClose || !btnOff) return;

  btnOpen.classList.remove('grip-flash-open', 'gripper-active');
  btnClose.classList.remove('grip-flash-close', 'gripper-active');
  btnOff.classList.remove('grip-off-active', 'gripper-active');

  void btnOpen.offsetWidth;
  void btnClose.offsetWidth;

  if (state === 'open') {
    btnOpen.classList.add('grip-flash-open', 'gripper-active');
  } else if (state === 'close') {
    btnClose.classList.add('grip-flash-close', 'gripper-active');
  } else if (state === 'off') {
    btnOff.classList.add('grip-off-active', 'gripper-active');
  }
}

// ── Jogging Logic ───────────────────────────────────────────────────────
function processJogTimer() {
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

  twistMsg.twist.linear.x = smoothedTwist.lx;
  twistMsg.twist.linear.y = smoothedTwist.ly;
  twistMsg.twist.linear.z = smoothedTwist.lz;
  twistMsg.twist.angular.x = smoothedTwist.ax;
  twistMsg.twist.angular.y = smoothedTwist.ay;
  twistMsg.twist.angular.z = smoothedTwist.az;

  twistMsg.header.stamp = {sec: Math.floor(Date.now()/1000), nanosec: (Date.now()%1000)*1000000};
  twistPub.publish(twistMsg);
}

function startJog(lx, ly, lz, ax, ay, az) {
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

function stopJog() {
  jogActive = false;
  targetTwist.lx = 0;
  targetTwist.ly = 0;
  targetTwist.lz = 0;
  targetTwist.ax = 0;
  targetTwist.ay = 0;
  targetTwist.az = 0;
}

// ── Live Joint Jogging ──────────────────────────────────────────────────
function startJointJog(idx, e) {
  activeJointJog = idx;
  jointJogStartX = e.clientX;
  jointJogVelocity = 0;
  
  document.addEventListener('pointermove', onJointJogMove);
  document.addEventListener('pointerup', stopJointJog);

  if(jointJogTimer) clearInterval(jointJogTimer);
  jointJogTimer = setInterval(() => {
    if(activeJointJog >= 0 && activeJointJog <= 5) {
      jointJogMsg.header.stamp = {sec: Math.floor(Date.now()/1000), nanosec: (Date.now()%1000)*1000000};
      jointJogMsg.joint_names = [`joint${activeJointJog + 1}`];
      let scaledVel = jointJogVelocity * 0.005 * speedScale;
      if(scaledVel > 1.0) scaledVel = 1.0;
      if(scaledVel < -1.0) scaledVel = -1.0;
      jointJogMsg.velocities = [scaledVel];
      jointJogPub.publish(jointJogMsg);
    }
  }, 50);
}

function onJointJogMove(e) {
  if (activeJointJog !== -1) {
    jointJogVelocity = e.clientX - jointJogStartX;
  }
}

function stopJointJog() {
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
}

// ── Web Audio UI Click Sound Effect & Sound Toggle ───────────────────────
let soundEnabled = lsGet('robot_control_sound_enabled') !== 'false';

// ROS Publisher for Sound State (Synchronizes sound toggle with backend robot motion nodes)
const soundStatePub = new ROSLIB.Topic({
  ros: ros,
  name: '/ui/sound_enabled',
  messageType: 'std_msgs/Bool'
});

function publishSoundState() {
  if (ros && ros.isConnected) {
    soundStatePub.publish(new ROSLIB.Message({ data: Boolean(soundEnabled) }));
  }
}
setInterval(publishSoundState, 2000);

function syncAudioElements() {
  if (uiClickSound) {
    uiClickSound.muted = !soundEnabled;
    uiClickSound.volume = soundEnabled ? 1.0 : 0.0;
    if (!soundEnabled) {
      uiClickSound.pause();
      uiClickSound.currentTime = 0;
    }
  }
  if (scanPosSound) {
    scanPosSound.muted = !soundEnabled;
    scanPosSound.volume = soundEnabled ? 1.0 : 0.0;
    if (!soundEnabled) {
      scanPosSound.pause();
      scanPosSound.currentTime = 0;
    }
  }
}

function updateSoundUI() {
  const btn = document.getElementById('btn-sound-toggle');
  const icon = document.getElementById('sound-toggle-icon');
  syncAudioElements();
  if (!btn || !icon) return;

  if (soundEnabled) {
    btn.style.color = 'var(--cyan)';
    btn.style.opacity = '1';
    btn.title = "Sound Effects: Enabled (Click to mute)";
    icon.className = "fa-solid fa-volume-high";
  } else {
    btn.style.color = 'var(--mut)';
    btn.style.opacity = '0.5';
    btn.title = "Sound Effects: Muted (Click to enable)";
    icon.className = "fa-solid fa-volume-xmark";
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  lsSet('robot_control_sound_enabled', soundEnabled ? 'true' : 'false');
  updateSoundUI();
  publishSoundState();
  if (soundEnabled) {
    playUiClickSound();
  }
  logMsg('AUDIO', soundEnabled ? '🔊 Sound effects enabled (web & robot audio ON)' : '🔇 Sound effects muted (web & robot audio OFF)', 'info');
}
window.toggleSound = toggleSound;
window.updateSoundUI = updateSoundUI;
window.publishSoundState = publishSoundState;

let audioCtx = null;
function playUiClickSound() {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // Crisp tactile mechanical click
    osc.type = 'sine';
    const now = audioCtx.currentTime;
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.035);
    
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.04);
  } catch (err) {
    // Graceful fallback
  }
}
window.playUiClickSound = playUiClickSound;

// Initialize sound button UI on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateSoundUI);
} else {
  updateSoundUI();
}

// ── Analog Joystick Implementation ──────────────────────────────────────
const zone = document.getElementById('joystick-zone');
const stick = document.getElementById('joystick-stick');
const joyLabelTop = document.querySelector('.joy-label.top');
const joyLabelBottom = document.querySelector('.joy-label.bottom');
const joyLabelLeft = document.querySelector('.joy-label.left');
const joyLabelRight = document.querySelector('.joy-label.right');

// ── Clickable Arrow Buttons Jogging (with sound & stick feedback) ────────
function startArrowJog(lx, ly, e) {
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
window.startArrowJog = startArrowJog;

function stopArrowJog() {
  if (stick && !joyActive) {
    stick.style.transform = 'translate(0px, 0px)';
  }
  if (joyLabelTop) joyLabelTop.classList.remove('joy-active');
  if (joyLabelBottom) joyLabelBottom.classList.remove('joy-active');
  if (joyLabelLeft) joyLabelLeft.classList.remove('joy-active');
  if (joyLabelRight) joyLabelRight.classList.remove('joy-active');
  stopJog();
}
window.stopArrowJog = stopArrowJog;

// Subscribe to hardware gamepad
const hardwareJoySub = new ROSLIB.Topic({
  ros: ros,
  name: '/joy',
  messageType: 'sensor_msgs/msg/Joy'
});

let lastHardwareXButton = 0;

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

const maxRadius = 37;
let joyCenterX = 0, joyCenterY = 0;

if(zone && stick) {
  zone.addEventListener('mousedown', initJoy);
  zone.addEventListener('touchstart', initJoy, {passive: false});
}

function initJoy(e) {
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

function moveJoy(e) {
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

function endJoy() {
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

// ── Services (MoveTo, Utils, Grasp) ─────────────────────────────────────
function createSrv(name, type) {
  return new ROSLIB.Service({ ros: ros, name: name, serviceType: type });
}

function setButtonsLocked(locked) {
  const btns = document.querySelectorAll('.motion-lockable');
  btns.forEach(btn => {
    btn.disabled = locked;
    btn.style.opacity = locked ? '0.4' : '1.0';
    btn.style.pointerEvents = locked ? 'none' : 'auto';
  });
}

function moveToPose() {
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
    return;
  }

  setButtonsLocked(true);
  const srv = createSrv('/ui/execute_move_to_pose', 'xarm_msgs/MoveCartesian');

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
    if (res.ret === 0) logMsg('ROS', '✓ MoveTo successful.', 'info');
    else logMsg('ROS', `❌ MoveTo failed (ret=${res.ret}): ${res.message || 'Error'}`, 'err');
  }, (err) => { 
    setButtonsLocked(false);
    logMsg('ROS', `❌ MoveTo Error: ${err}`, 'err'); 
  });
}

// ── Interactive 3D TCP Gizmo Execution ───────────────────────────────────────
let isExecutingGizmoMove = false;

window.executeMoveToPoseFromGizmo = function () {
  if (isExecutingGizmoMove) {
    console.warn('[Gizmo] Motion execution already in progress.');
    return;
  }

  // Retrieve pose from 3D Gizmo or fallback to numeric inputs
  let poseData = null;
  if (typeof window.getTCPGizmoPose === 'function') {
    poseData = window.getTCPGizmoPose();
  }

  const x = poseData ? poseData.x : readPoseInput('inp-x');
  const y = poseData ? poseData.y : readPoseInput('inp-y');
  const z = poseData ? poseData.z : readPoseInput('inp-z');
  const r = poseData ? poseData.roll : readPoseInput('inp-r');
  const p = poseData ? poseData.pitch : readPoseInput('inp-p');
  const yw = poseData ? poseData.yaw : readPoseInput('inp-yw');

  // Prueft jetzt alle sechs Werte, nicht nur X/Y/Z.
  const bad = validatePose([x, y, z, r, p, yw]);
  if (bad) {
    logMsg('GIZMO', `❌ Invalid gizmo target: ${bad}`, 'err');
    return;
  }

  // Safety Validation: Prevent driving into inner singularity & self-collision
  const r_xy = Math.sqrt(x * x + y * y);
  if (r_xy < LIM.HARD_BLOCK_MM && z < LIM.LOW_Z_MM) {
    logMsg('GIZMO', `❌ MOVE BLOCKED: Target lies inside the inner singularity zone (r=${r_xy.toFixed(0)} mm < ${LIM.HARD_BLOCK_MM} mm). Risk of collision with its own base!`, 'err');
    if (typeof window.updateDigitalTwinSafety === 'function') {
      window.updateDigitalTwinSafety({
        collision: true,
        message: `SELF-COLLISION ZONE (r: ${r_xy.toFixed(0)} mm < 125 mm)`,
        collidingLinks: ['link6', 'link5', 'link2', 'link1']
      });
    }
    return;
  }
  if (z <= 15.0) {
    logMsg('GIZMO', `❌ MOVE BLOCKED: Target lies inside the table surface (Z=${z.toFixed(0)} mm ≤ 15 mm).`, 'err');
    return;
  }

  isExecutingGizmoMove = true;
  setButtonsLocked(true);

  // Update floating HUD button in 3D viewport
  const btnGo = document.getElementById('btn-gizmo-execute');
  if (btnGo) {
    btnGo.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Moving...';
    btnGo.style.opacity = '0.7';
    btnGo.disabled = true;
  }

  const srv = createSrv('/ui/execute_move_to_pose', 'xarm_msgs/MoveCartesian');
  const req = new ROSLIB.ServiceRequest({
    pose: [x, y, z, r, p, yw],
    speed: 100.0,
    acc: 1000.0,
    mvtime: 0.0
  });

  logMsg('GIZMO', `🎯 TCP gizmo move: X=${x} Y=${y} Z=${z} mm (R=${r} P=${p} Yw=${yw})`, 'action');

  srv.callService(req, (res) => {
    isExecutingGizmoMove = false;
    setButtonsLocked(false);
    if (btnGo) {
      btnGo.innerHTML = '<i class="fa-solid fa-play"></i> Execute';
      btnGo.style.opacity = '1.0';
      btnGo.disabled = false;
    }

    if (res.ret === 0) {
      logMsg('GIZMO', '✓ Target pose reached successfully via IK.', 'success');
      if (typeof window.syncTCPGizmoToRobot === 'function') {
        window.syncTCPGizmoToRobot();
      }
    } else {
      logMsg('GIZMO', `❌ IK / move failed (ret=${res.ret}): ${res.message || 'Target unreachable or in collision'}`, 'err');
    }
  }, (err) => {
    isExecutingGizmoMove = false;
    setButtonsLocked(false);
    if (btnGo) {
      btnGo.innerHTML = '<i class="fa-solid fa-play"></i> Execute';
      btnGo.style.opacity = '1.0';
      btnGo.disabled = false;
    }
    logMsg('GIZMO', `❌ Service error during gizmo move: ${err}`, 'err');
  });
};

function setInitialPose() {
  setButtonsLocked(true);
  const srv = createSrv('/ui/execute_initial_pose', 'std_srvs/Trigger');
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

function showScene() {
  setButtonsLocked(true);
  if (soundEnabled) {
    scanPosSound.currentTime = 0;
    scanPosSound.play().catch(err => console.warn('Audio play failed:', err));
  }

  const srv = createSrv('/ui/execute_move_to_pose', 'xarm_msgs/MoveCartesian');
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

const graspPub = new ROSLIB.Topic({
  ros: ros,
  name: '/ui/grasp_object_cmd',
  messageType: 'std_msgs/String'
});

function executeGrasp() {
  const obj = document.getElementById('inp-grasp-obj').value;
  if(!obj) {
    logMsg('UI', '❌ Error: No object name entered for grasp.', 'err');
    return;
  }
  logMsg('UI', `➤ Triggering Grasp for object: ${obj}`);
  graspPub.publish(new ROSLIB.Message({ data: obj }));
}

// ── Voice Feedback ──────────────────────────────────────────────────────
const voiceFeedbackSub = new ROSLIB.Topic({
  ros: ros,
  name: '/ui/voice_feedback',
  messageType: 'std_msgs/String'
});

voiceFeedbackSub.subscribe((msg) => {
  logMsg('VOICE', `🗣️ Voice Command Recognized: ${msg.data}`);
  const voiceSpan = document.getElementById('voice-recognized-cmd');
  if (voiceSpan) {
    voiceSpan.innerText = msg.data;
    voiceSpan.style.textShadow = "0 0 10px var(--green)";
    voiceSpan.style.color = "var(--green)";
    setTimeout(() => {
      voiceSpan.style.textShadow = "none";
      voiceSpan.style.color = "var(--purple)";
    }, 2000);
  }
  
  // The voice command directly executes via the backend.
  // We no longer overwrite the Manual Grasp Target input field to avoid confusion.

  // Voice Command: "Move to Pose" → triggers moveToPose() with current input values
  if (msg.data === 'MoveTo: pose') {
    logMsg('VOICE', '🗣️ <span style="color: var(--accent);">Voice</span> <span style="color: var(--mut);">→</span> <span style="color: var(--orange);">Triggering:</span><br>&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: var(--mut);">→</span> <span style="color: var(--green);">Absolute Pose Move...</span>', 'info');
    moveToPose();
  }

  // Voice Command: "Move to Initial Pose" → triggers setInitialPose()
  if (msg.data === 'MoveTo: initial') {
    logMsg('VOICE', '🗣️ <span style="color: var(--accent);">Voice</span> <span style="color: var(--mut);">→</span> <span style="color: var(--orange);">Triggering:</span><br>&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: var(--mut);">→</span> <span style="color: var(--green);">Initial Pose Move...</span>', 'info');
    setInitialPose();
  }

  // Voice Command: "Faster" → Increases Action Speed
  if (msg.data === 'Speed: faster') {
    logMsg('VOICE', '🗣️ <span style="color: var(--accent);">Voice</span> <span style="color: var(--mut);">→</span> <span style="color: var(--orange);">Speed:</span> <span style="color: var(--green);">Faster</span>', 'info');
    const radios = document.getElementsByName('scanSpeed');
    let current = 1;
    for(let i=0; i<radios.length; i++) if(radios[i].checked) current = parseInt(radios[i].value);
    const next = current + 1;
    if(next <= 2) {
      for(let i=0; i<radios.length; i++) if(parseInt(radios[i].value) === next) { radios[i].checked = true; break; }
      updateScanSpeed();
    }
  }

  // Voice Command: "Slower" → Decreases Action Speed
  if (msg.data === 'Speed: slower') {
    logMsg('VOICE', '🗣️ <span style="color: var(--accent);">Voice</span> <span style="color: var(--mut);">→</span> <span style="color: var(--orange);">Speed:</span> <span style="color: var(--rviz-x);">Slower</span>', 'info');
    const radios = document.getElementsByName('scanSpeed');
    let current = 1;
    for(let i=0; i<radios.length; i++) if(radios[i].checked) current = parseInt(radios[i].value);
    const prev = current - 1;
    if(prev >= 0) {
      for(let i=0; i<radios.length; i++) if(parseInt(radios[i].value) === prev) { radios[i].checked = true; break; }
      updateScanSpeed();
    }
  }

  // Voice Command: "Scan: objects" → triggers startObjectScan()
  if (msg.data === 'Scan: objects') {
    logMsg('VOICE', '🗣️ <span style="color: var(--accent);">Voice</span> <span style="color: var(--mut);">→</span> <span style="color: var(--orange);">Triggering:</span><br>&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: var(--mut);">→</span> <span style="color: var(--green);">Object Scan...</span>', 'info');
    startObjectScan();
  }
});

// ── Gamepad API Status ──────────────────────────────────────────────────
window.addEventListener("gamepadconnected", (e) => {
  const dot = document.getElementById('gp-dot');
  const status = document.getElementById('gamepad-status');
  if(dot && status) {
    dot.className = 'dot glow-green';
    let gName = e.gamepad.id || 'Gamepad';
    if(gName.length > 20) gName = gName.substring(0, 20) + '...';
    status.innerText = gName;
    logMsg('System', `Gamepad connected: ${e.gamepad.id}`, 'info');
  }
});

window.addEventListener("gamepaddisconnected", (e) => {
  const dot = document.getElementById('gp-dot');
  const status = document.getElementById('gamepad-status');
  if(dot && status) {
    dot.className = 'dot glow-red';
    status.innerText = 'Gamepad';
    logMsg('System', 'Gamepad disconnected.', 'warn');
  }
});


// ── Global Button Debounce (Anti-Double-Click) ──────────────────────────
document.addEventListener('click', function(e) {
  const btn = e.target.closest('button');
  if (!btn) return;
  
  // Skip debounce for sound toggle button
  if (btn.id === 'btn-sound-toggle') return;

  // Check if button is disabled by motion lock or already clicked
  if (btn.disabled || btn.dataset.clicked || btn.style.pointerEvents === 'none') {
    e.stopPropagation();
    e.preventDefault();
    return;
  }
  
  // Play UI click sound
  if (soundEnabled) {
    uiClickSound.currentTime = 0;
    uiClickSound.play().catch(err => console.warn('Audio play failed:', err));
  }

  // Allow continuous jogging buttons to be pressed rapidly or held without getting visually disabled by the debounce
  if (btn.classList.contains('btn-z') || btn.classList.contains('btn-rot')) return;
  
  // Mark as clicked and visually disable
  btn.dataset.clicked = "true";
  const oldPointerEvents = btn.style.pointerEvents;
  const oldOpacity = btn.style.opacity;
  
  btn.style.pointerEvents = 'none';
  btn.style.opacity = '0.6';
  
  // Re-enable after 1.5 seconds
  setTimeout(() => {
    delete btn.dataset.clicked;
    btn.style.pointerEvents = oldPointerEvents;
    btn.style.opacity = oldOpacity;
  }, 1500);
}, true);

// ── MoveIt Servo Status ─────────────────────────────────────────────────
const servoStatusSub = new ROSLIB.Topic({
  ros: ros,
  name: '/servo_server/status',
  messageType: 'std_msgs/Int8'
});

function updateMoveItBadge() {
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

function startListening() {
  const btn = document.getElementById("btn-start-listening");
  const textSpan = document.getElementById("btn-listen-text");
  const icon = document.getElementById("btn-listen-icon");
  const resultSpan = document.getElementById("voice-recognized-cmd");

  if (!btn || !textSpan || !icon) return;

  // Prevent double-clicks while already listening
  if (btn.classList.contains("btn-listening")) {
    logMsg('UI', 'Already listening... please wait.', 'warn');
    return;
  }

  // Clear old timeouts
  clearTimeout(window.enforceTimeout);
  clearTimeout(window.safetyTimeout);

  // Set listening state (UI)
  btn.classList.add("btn-listening");
  textSpan.innerText = "Listening...";
  icon.classList.remove("fa-ear-listen");
  icon.classList.add("fa-microphone-lines", "fa-beat-fade");
  
  if (resultSpan) {
    resultSpan.innerText = "🎤 Listening for command...";
    resultSpan.style.color = "var(--purple)";
  }

  logMsg('UI', '➤ Whisper: Triggering Python Listener...');

  if (!window.whisperTriggerPub) {
    window.whisperTriggerPub = new ROSLIB.Topic({
      ros: ros,
      name: '/ui/voice_listen_trigger',
      messageType: 'std_msgs/String'
    });
  }
  
  // Subscribe exactly once
  if (!window.whisperStatusSub) {
    window.whisperStatusSub = new ROSLIB.Topic({
      ros: ros,
      name: '/ui/voice_status',
      messageType: 'std_msgs/String'
    });
    window.whisperStatusSub.subscribe((msg) => {
      const b = document.getElementById("btn-start-listening");
      const t = document.getElementById("btn-listen-text");
      const ic = document.getElementById("btn-listen-icon");
      const rs = document.getElementById("voice-recognized-cmd");

      if (msg.data.startsWith("Transcription:")) {
        const text = msg.data.replace("Transcription:", "").trim();
        resetListeningUI(b, t, ic, rs, `"${text}"`);
        logMsg('VOICE', `🗣️ Transcription: "${text}"`, 'info');
        clearTimeout(window.enforceTimeout);
        clearTimeout(window.safetyTimeout);
      } else if (msg.data.startsWith("Error:") || msg.data.includes("No speech")) {
        resetListeningUI(b, t, ic, rs, msg.data);
        logMsg('System', `Whisper: ${msg.data}`, 'err');
        clearTimeout(window.enforceTimeout);
        clearTimeout(window.safetyTimeout);
      } else {
        resultSpan.innerText = msg.data;
      }
    });
  }

  // Fallback timeouts if Python listener fails
  window.enforceTimeout = setTimeout(() => {
    logMsg('System', '5s elapsed, waiting for Whisper processing...', 'info');
  }, 5000);

  window.safetyTimeout = setTimeout(() => {
    const b = document.getElementById("btn-start-listening");
    const t = document.getElementById("btn-listen-text");
    const ic = document.getElementById("btn-listen-icon");
    const rs = document.getElementById("voice-recognized-cmd");
    resetListeningUI(b, t, ic, rs, "-- Timeout --");
    logMsg('System', 'Whisper Python Listener did not respond within 30s.', 'err');
  }, 30000);

  window.whisperTriggerPub.publish(new ROSLIB.Message({ data: 'listen' }));
}

function resetListeningUI(btn, textSpan, icon, resultSpan, errorText) {
  if (btn) btn.classList.remove("btn-listening");
  if (textSpan) textSpan.innerText = "Start Listening";
  if (icon) {
    icon.classList.add("fa-ear-listen");
    icon.classList.remove("fa-microphone-lines", "fa-beat-fade");
  }
  if (errorText && resultSpan) {
    resultSpan.innerText = errorText;
    resultSpan.style.color = "var(--mut)";
  }
}

// ── Drag & Drop Layout (SortableJS) ──────────────────────────────────────
function initDragAndDrop() {
  const colLeft = document.getElementById('col-left');
  const colMiddle = document.getElementById('col-middle');
  const colRight = document.getElementById('col-right');
  if (!colLeft || !colMiddle || !colRight || typeof Sortable === 'undefined') return;

  const layoutKey = 'robot_control_layout_v3';

  // 1. Load saved layout if available
  try {
    const saved = lsGet(layoutKey);
    if (saved) {
      const layout = JSON.parse(saved);
      // Restore left column
      if (layout.left && Array.isArray(layout.left)) {
        layout.left.forEach(id => {
          const el = document.getElementById(id);
          if (el) colLeft.appendChild(el);
        });
      }
      // Restore middle column
      if (layout.middle && Array.isArray(layout.middle)) {
        layout.middle.forEach(id => {
          const el = document.getElementById(id);
          if (el) colMiddle.appendChild(el);
        });
      }
      // Restore right column
      if (layout.right && Array.isArray(layout.right)) {
        layout.right.forEach(id => {
          const el = document.getElementById(id);
          if (el) colRight.appendChild(el);
        });
      }
    }
  } catch(e) {
    console.warn('Failed to load layout from localStorage:', e);
  }

  // 2. Save function
  function saveLayout() {
    const layout = {
      left: Array.from(colLeft.querySelectorAll('.glass-panel')).map(el => el.id).filter(id => id),
      middle: Array.from(colMiddle.querySelectorAll('.glass-panel')).map(el => el.id).filter(id => id),
      right: Array.from(colRight.querySelectorAll('.glass-panel')).map(el => el.id).filter(id => id)
    };
    lsSet(layoutKey, JSON.stringify(layout));
    logMsg('UI', '✓ Layout saved automatically', 'success');
  }

  // 3. Initialize Sortable
  const sortableOpts = {
    group: 'panels',
    animation: 200,
    handle: 'h2, .panel-drag-handle, .centerpiece-header, .panel-drag-grip',
    filter: 'button, input, select, a, .twin-toolbar, .viewport-tabs, .v-tab-btn',
    preventOnFilter: false,
    ghostClass: 'sortable-ghost',
    onEnd: () => {
      saveLayout();
      if (typeof window.resizeDigitalTwin === 'function') {
        setTimeout(window.resizeDigitalTwin, 50);
        setTimeout(window.resizeDigitalTwin, 250);
      }
    }
  };

  new Sortable(colLeft, sortableOpts);
  new Sortable(colMiddle, sortableOpts);
  new Sortable(colRight, sortableOpts);
}

// Call init once DOM is definitely ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initDragAndDrop();
    initPortMonitoring();
  });
} else {
  initDragAndDrop();
  initPortMonitoring();
}

// ── Dynamic Port & Connection Monitoring ──────────────────────────────────
function initPortMonitoring() {
  // Nutzt denselben Host wie die ROS-Verbindung, statt ihn erneut abzuleiten.
  const host = ROS_HOST;

  function checkPort8081() {
    const dot = document.getElementById('dot-port-8081');
    if (!dot) return;
    if (window.location.port === '8081') {
      dot.className = 'dot glow-green';
    } else {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      fetch('http://' + host + ':8081/index.html', { method: 'GET', mode: 'no-cors', cache: 'no-store', signal: controller.signal })
        .then(() => { clearTimeout(timer); dot.className = 'dot glow-green'; })
        .catch(() => { clearTimeout(timer); dot.className = 'dot glow-red'; });
    }
  }

  function checkPort5000() {
    const dot = document.getElementById('dot-port-5000');
    if (!dot) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    fetch('http://' + host + ':5000/api/status', { method: 'GET', cache: 'no-store', signal: controller.signal })
      .then((res) => {
        clearTimeout(timer);
        dot.className = 'dot glow-green';
        return res.json();
      })
      .then((data) => {
        if (data) {
          if (data.localhost_only !== undefined) {
            const el = document.getElementById('val-localhost-only');
            const dotLh = document.getElementById('dot-localhost-only');
            const isOn = data.localhost_only === '1' || data.localhost_only === 1;
            if (el) el.innerText = isOn ? 'On' : 'Off';
            if (dotLh) dotLh.className = isOn ? 'dot glow-orange' : 'dot glow-blue';
          }
          if (data.ros_domain_id) {
            const el = document.getElementById('val-domain-id');
            if (el) el.innerText = data.ros_domain_id;
          }
          if (data.rmw_implementation) {
            const el = document.getElementById('val-rmw-impl');
            if (el) el.innerText = data.rmw_implementation;
          }
        }
      })
      .catch(() => {
        clearTimeout(timer);
        dot.className = 'dot glow-red';
      });
  }

  function checkPort8080() {
    const dot = document.getElementById('dot-port-8080');
    if (!dot) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    fetch('http://' + host + ':8080/dashboard_index.html', { method: 'GET', mode: 'no-cors', cache: 'no-store', signal: controller.signal })
      .then(() => {
        clearTimeout(timer);
        dot.className = 'dot glow-green';
      })
      .catch(() => {
        clearTimeout(timer);
        dot.className = 'dot glow-red';
      });
  }

  function checkPort8082() {
    const dot = document.getElementById('dot-port-8082');
    if (!dot) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    fetch('http://' + host + ':8082/', { method: 'GET', mode: 'no-cors', cache: 'no-store', signal: controller.signal })
      .then(() => {
        clearTimeout(timer);
        dot.className = 'dot glow-green';
      })
      .catch(() => {
        clearTimeout(timer);
        dot.className = 'dot glow-red';
      });
  }

  function checkPort9091() {
    const dot = document.getElementById('dot-port-9091');
    if (!dot) return;
    let resolved = false;
    // Port 9091 runs with SSL (wss://) in vr_quest3_teleop.launch.py
    const proto = (window.location.protocol === 'https:') ? 'wss:' : 'ws:';
    try {
      const testWs = new WebSocket('wss://' + host + ':9091');
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          // Fallback check: probe plain ws:// if wss didn't open
          try {
            const fallbackWs = new WebSocket('ws://' + host + ':9091');
            const fbTimer = setTimeout(() => {
              dot.className = 'dot glow-red';
              try { fallbackWs.close(); } catch(e) {}
            }, 1000);
            fallbackWs.onopen = () => {
              clearTimeout(fbTimer);
              dot.className = 'dot glow-green';
              try { fallbackWs.close(); } catch(e) {}
            };
            fallbackWs.onerror = () => {
              clearTimeout(fbTimer);
              dot.className = 'dot glow-red';
            };
          } catch(e) {
            dot.className = 'dot glow-red';
          }
          try { testWs.close(); } catch(e) {}
        }
      }, 1500);

      testWs.onopen = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          dot.className = 'dot glow-green';
          try { testWs.close(); } catch(e) {}
        }
      };

      testWs.onerror = () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          // Try plain ws:// fallback
          try {
            const fallbackWs = new WebSocket('ws://' + host + ':9091');
            const fbTimer = setTimeout(() => {
              dot.className = 'dot glow-red';
              try { fallbackWs.close(); } catch(e) {}
            }, 1000);
            fallbackWs.onopen = () => {
              clearTimeout(fbTimer);
              dot.className = 'dot glow-green';
              try { fallbackWs.close(); } catch(e) {}
            };
            fallbackWs.onerror = () => {
              clearTimeout(fbTimer);
              dot.className = 'dot glow-red';
            };
          } catch(e) {
            dot.className = 'dot glow-red';
          }
        }
      };
    } catch (e) {
      dot.className = 'dot glow-red';
    }
  }

  function checkAll() {
    checkPort8081();
    checkPort5000();
    checkPort8080();
    checkPort8082();
    checkPort9091();
  }

  checkAll();
  setInterval(checkAll, 3000);
}

// ── 3D Viewport Tab Switcher (Digital Twin WebGL vs RViz Stream) ───────────
function switch3DTab(tab) {
  const btnTwin = document.getElementById('tab-twin');
  const btnRviz = document.getElementById('tab-rviz');
  const twinViewport = document.getElementById('digital-twin-viewport');
  const rvizContainer = document.getElementById('rviz-container');
  const twinToolbar = document.querySelector('.twin-toolbar');

  if (tab === 'twin') {
    if (btnTwin) btnTwin.classList.add('active');
    if (btnRviz) btnRviz.classList.remove('active');
    if (twinViewport) twinViewport.style.display = 'block';
    if (rvizContainer) rvizContainer.style.display = 'none';
    if (twinToolbar) twinToolbar.style.display = 'flex';
    if (window.resizeDigitalTwin) {
      window.resizeDigitalTwin();
    }
  } else {
    if (btnRviz) btnRviz.classList.add('active');
    if (btnTwin) btnTwin.classList.remove('active');
    if (twinViewport) twinViewport.style.display = 'none';
    if (rvizContainer) rvizContainer.style.display = 'flex';
    if (twinToolbar) twinToolbar.style.display = 'none';
  }
}
window.switch3DTab = switch3DTab;

// ── TF Control Tuner (Built-in Web Transform Broadcaster & Tuner) ────────────
const TF_TUNER_ELEMENTS = {
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

let currentTFTunerElement = 'Zed M Camera';
let isTFBroadcastActive = false; // OFF by default: only active when the node runs or it is switched on manually
let isSceneObjectsNodeRunning = false;
let lastSceneMarkerTime = 0;
let tfBroadcasterInterval = null;

// ROS Topics for TF and Safety Zone
const tfTunerPub = new ROSLIB.Topic({
  ros: ros,
  name: '/tf',
  messageType: 'tf2_msgs/TFMessage'
});

const safetyZoneParamsPub = new ROSLIB.Topic({
  ros: ros,
  name: '/ui/safety_zone_params',
  messageType: 'std_msgs/Float32MultiArray'
});

// ── ROS topics used to detect active scene object nodes ──
// Dient nur der Lebendpruefung (4,5-s-Fenster) - 2 Hz genuegen dafuer.
const sceneMarkersSub = new ROSLIB.Topic({
  ros: ros,
  name: '/visualization_marker_array',
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
const zedVisualMarkersSub = new ROSLIB.Topic({
  ros: ros,
  name: '/zed_visual_markers',
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

function checkSceneObjectsNodeState(nodesList) {
  const sceneNodes = ['rviz_marker_3d_scene_objects', 'fixed_marker_publisher', 'tf_control_tuner', 'rviz_marker_3d_scene_zedm_stand', 'rviz_marker_3d_scene_plane', 'rviz_marker_3d_scene_safety_zone'];
  const hasSceneNode = Array.isArray(nodesList) && nodesList.some(n => sceneNodes.some(sn => n.includes(sn)));
  const recentMarkers = (Date.now() - lastSceneMarkerTime < 4500);

  if (hasSceneNode || recentMarkers) {
    applySceneObjectsActiveState(true, hasSceneNode ? 'ROS-Knoten' : 'Marker-Stream');
  } else {
    applySceneObjectsActiveState(false);
  }
}
window.checkSceneObjectsNodeState = checkSceneObjectsNodeState;

let isSceneObjectsUserVisible = true;

// Per-group user-visible state (independent toggles per node)
const sceneGroupUserVisible = { objects: true, plane: true, safety: true, zedm: true };
const sceneGroupBtnIds = {
  objects: 'btn-twin-scene-objects',
  plane:   'btn-twin-scene-plane',
  safety:  'btn-twin-scene-safety',
  zedm:    'btn-twin-scene-zedm'
};
const sceneGroupLabels = {
  objects: 'Hollow bodies & workspace',
  plane:   'DIN A4 template',
  safety:  'Safety Zone',
  zedm:    'ZED-M camera stand'
};

function updateSceneNodeBtn(groupKey, isNodeRunning) {
  const btn = document.getElementById(sceneGroupBtnIds[groupKey]);
  if (!btn) return;
  const isUserVisible = sceneGroupUserVisible[groupKey];
  if (!isNodeRunning) {
    btn.classList.remove('active');
    btn.style.color = 'var(--dim)';
    btn.style.opacity = '0.45';
    btn.title = `${sceneGroupLabels[groupKey]} (node inactive)`;
  } else if (isUserVisible) {
    btn.classList.add('active');
    btn.style.color = 'var(--cyan)';
    btn.style.opacity = '1.0';
    btn.title = `Hide ${sceneGroupLabels[groupKey]} (node active)`;
  } else {
    btn.classList.remove('active');
    btn.style.color = 'var(--mut)';
    btn.style.opacity = '0.8';
    btn.title = `Show ${sceneGroupLabels[groupKey]} (node active)`;
  }
}

function updateAllSceneNodeBtns(isNodeRunning) {
  for (const key of Object.keys(sceneGroupBtnIds)) {
    updateSceneNodeBtn(key, isNodeRunning);
  }
}

function toggleSceneNode(groupKey) {
  sceneGroupUserVisible[groupKey] = !sceneGroupUserVisible[groupKey];
  const vis = sceneGroupUserVisible[groupKey];

  if (isSceneObjectsNodeRunning) {
    if (window.setSceneGroupVisibility) {
      window.setSceneGroupVisibility(groupKey, vis);
    }
    if (vis && window.updateTunerSceneObjects) {
      window.updateTunerSceneObjects(TF_TUNER_ELEMENTS);
    }
    updateSceneNodeBtn(groupKey, true);
    logMsg('WebGL 3D', `${vis ? '🟢' : '⚪'} ${sceneGroupLabels[groupKey]} ${vis ? 'shown' : 'hidden'}`, vis ? 'info' : 'warn');
  } else {
    if (window.setSceneGroupVisibility) {
      window.setSceneGroupVisibility(groupKey, false);
    }
    updateSceneNodeBtn(groupKey, false);
    logMsg('WebGL 3D', `ℹ️ ${sceneGroupLabels[groupKey]}: ${vis ? 'Queued' : 'Disabled'} (scene nodes are not running)`, 'warn');
  }

  // Update global flag
  isSceneObjectsUserVisible = Object.values(sceneGroupUserVisible).some(v => v);
}
window.toggleSceneNode = toggleSceneNode;

function applySceneObjectsActiveState(isActive, reason) {
  const wasRunning = isSceneObjectsNodeRunning;
  isSceneObjectsNodeRunning = isActive;

  if (isActive) {
    isTFBroadcastActive = true;
    // Apply per-group visibility
    for (const key of Object.keys(sceneGroupUserVisible)) {
      if (window.setSceneGroupVisibility) {
        window.setSceneGroupVisibility(key, sceneGroupUserVisible[key]);
      }
    }
    if (window.updateTunerSceneObjects) {
      window.updateTunerSceneObjects(TF_TUNER_ELEMENTS);
    }
    updateTunerUI();
    updateAllSceneNodeBtns(true);
    if (!wasRunning) {
      logMsg('TF-Tuner', `🟢 3D scene objects node active (${reason || 'node active'})`, 'info');
    }
  } else {
    isTFBroadcastActive = false;
    if (window.setTunerSceneObjectsVisibility) {
      window.setTunerSceneObjectsVisibility(false);
    }
    updateTunerUI();
    updateAllSceneNodeBtns(false);
    if (wasRunning) {
      logMsg('TF-Tuner', '⚪ 3D scene objects hidden (node inactive)', 'warn');
    }
  }
}

function eulerDegToQuat(rollDeg, pitchDeg, yawDeg) {
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

function broadcastAllTFTunerTransforms() {
  if (!isTFBroadcastActive || !ros || !ros.isConnected) return;

  const now = Date.now();
  const sec = Math.floor(now / 1000);
  const nanosec = (now % 1000) * 1000000;

  const transforms = [];

  for (const [name, data] of Object.entries(TF_TUNER_ELEMENTS)) {
    const q = eulerDegToQuat(data.roll, data.pitch, data.yaw);
    transforms.push({
      header: {
        stamp: { sec: sec, nanosec: nanosec },
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
  if (window.updateTunerSceneObjects) {
    window.updateTunerSceneObjects(TF_TUNER_ELEMENTS);
  }
}

function updateRangeProgress(slider) {
  if (!slider || slider.type !== 'range') return;
  const min = parseFloat(slider.min) !== undefined && !isNaN(parseFloat(slider.min)) ? parseFloat(slider.min) : 0;
  const max = parseFloat(slider.max) !== undefined && !isNaN(parseFloat(slider.max)) ? parseFloat(slider.max) : 100;
  const val = parseFloat(slider.value) !== undefined && !isNaN(parseFloat(slider.value)) ? parseFloat(slider.value) : 0;
  const pct = max > min ? Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100)) : 0;
  slider.style.backgroundSize = `${pct}% 100%`;
}
window.updateRangeProgress = updateRangeProgress;

// Global real-time listener: every slider track updates smoothly as user drags
document.addEventListener('input', (e) => {
  if (e.target && e.target.type === 'range') {
    updateRangeProgress(e.target);
  }
});

function updateTunerUI() {
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

function onTunerElementChange(name) {
  if (TF_TUNER_ELEMENTS[name]) {
    currentTFTunerElement = name;
    updateTunerUI();
    logMsg('TF-Tuner', `Selected element: ${name} (${TF_TUNER_ELEMENTS[name].frame_id})`, 'info');
  }
}

function onTunerSliderInput(axis, val) {
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
}

function onTunerNumChange(axis, val) {
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
}

function resetCurrentTFElement() {
  const data = TF_TUNER_ELEMENTS[currentTFTunerElement];
  if (!data || !data.default) return;

  Object.assign(data, data.default);
  updateTunerUI();
  broadcastAllTFTunerTransforms();
  logMsg('TF-Tuner', `Reset ${currentTFTunerElement} to factory defaults`, 'action');
}

function toggleTFBroadcast() {
  isTFBroadcastActive = !isTFBroadcastActive;
  const btn = document.getElementById('btn-tuner-broadcast');
  const label = document.getElementById('tuner-broadcast-label');
  const rateInfo = document.getElementById('tuner-rate-info');

  if (btn) {
    if (isTFBroadcastActive) {
      btn.className = 'btn-toggle-broadcast active';
      if (label) label.textContent = 'Live TF';
      if (rateInfo) rateInfo.textContent = isSceneObjectsNodeRunning ? '10 Hz (node active)' : '10 Hz (manual)';
      if (window.setTunerSceneObjectsVisibility) {
        window.setTunerSceneObjectsVisibility(true);
      }
      if (window.updateTunerSceneObjects) {
        window.updateTunerSceneObjects(TF_TUNER_ELEMENTS);
      }
      logMsg('TF-Tuner', 'Live TF broadcasting & scene objects enabled', 'success');
      broadcastAllTFTunerTransforms();
    } else {
      btn.className = 'btn-toggle-broadcast inactive';
      if (label) label.textContent = 'TF Inactive';
      if (rateInfo) rateInfo.textContent = 'Waiting for node...';
      if (window.setTunerSceneObjectsVisibility) {
        window.setTunerSceneObjectsVisibility(false);
      }
      logMsg('TF-Tuner', 'Live TF broadcasting & scene objects disabled', 'warn');
    }
  }
}

// Global exports
window.onTunerElementChange = onTunerElementChange;
window.onTunerSliderInput = onTunerSliderInput;
window.onTunerNumChange = onTunerNumChange;
window.resetCurrentTFElement = resetCurrentTFElement;
window.toggleTFBroadcast = toggleTFBroadcast;

// Start TF Broadcast Loop (10 Hz)
if (tfBroadcasterInterval) clearInterval(tfBroadcasterInterval);
tfBroadcasterInterval = setInterval(broadcastAllTFTunerTransforms, 100);

// Initialize Tuner UI on ready
// ── TF Tuner Collapse Toggle ──
function toggleTFTunerCollapse() {
  const body = document.getElementById('tf-tuner-body');
  const icon = document.getElementById('tf-collapse-icon');
  if (!body || !icon) return;
  const isCollapsed = body.classList.toggle('collapsed');
  icon.className = isCollapsed ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-up';
  lsSet('tf_tuner_collapsed', isCollapsed ? '1' : '0');
}

function restoreTFTunerCollapse() {
  const saved = lsGet('tf_tuner_collapsed');
  if (saved === '1') {
    const body = document.getElementById('tf-tuner-body');
    const icon = document.getElementById('tf-collapse-icon');
    if (body) body.classList.add('collapsed');
    if (icon) icon.className = 'fa-solid fa-chevron-down';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    updateTunerUI();
    updateAllSceneNodeBtns(isSceneObjectsNodeRunning);
    document.querySelectorAll('input[type="range"]').forEach(updateRangeProgress);
    restoreTFTunerCollapse();
  }, 300);
});

// ── Keyboard Shortcuts for 3D TCP Gizmo ──────────────────────────────────────
document.addEventListener('keydown', (e) => {
  // Ignore keystrokes when typing in an input field or text area
  const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
  if (tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable)) {
    return;
  }

  const key = e.key ? e.key.toLowerCase() : '';
  if (key === 't') {
    if (typeof window.setTCPGizmoMode === 'function') {
      window.setTCPGizmoMode('translate');
      logMsg('GIZMO', '⌨️ Mode: Translation (arrows) active [Key: T]', 'info');
    }
  } else if (key === 'r') {
    if (typeof window.setTCPGizmoMode === 'function') {
      window.setTCPGizmoMode('rotate');
      logMsg('GIZMO', '⌨️ Mode: Rotation (rings) active [Key: R]', 'info');
    }
  } else if (key === 'g') {
    if (typeof window.toggleTCPGizmo === 'function') {
      window.toggleTCPGizmo();
      logMsg('GIZMO', '⌨️ 3D TCP gizmo toggled [Key: G]', 'info');
    }
  } else if (e.key === 'Escape') {
    if (typeof window.syncTCPGizmoToRobot === 'function') {
      window.syncTCPGizmoToRobot();
      logMsg('GIZMO', '⌨️ Gizmo reset to current robot TCP [Key: Esc]', 'info');
    }
  } else if (key === 'm') {
    if (typeof window.toggleSound === 'function') {
      window.toggleSound();
    }
  }
});



