// ── Globals & States (Strikt oben deklariert!) ──────────────────────────
let ros;
let currentFrame = 'link_base';
let speedScale = 0.5;
let lastSpeedIndex = -1;

let jogActive = false;
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

// ── ROS Connection ────────────────────────────────────────────────────────
try {
  const host = window.location.hostname || 'localhost';
  ros = new ROSLIB.Ros({
    url: 'ws://' + host + ':9090'
  });
} catch (e) {
  const statusEl = document.getElementById('connection-status');
  if (statusEl) statusEl.innerText = 'JS Error';
  console.error("Failed to init ROSLIB", e);
}

ros.on('connection', () => {
  document.getElementById('connection-status').innerText = 'WS: 9090';
  document.getElementById('connection-dot').className = 'dot glow-green';
  logMsg('System', 'Connected to rosbridge_server (ws://localhost:9090)', 'info');

  // Node Checker (mit Error-Handling, um Websocket-Crashes zu vermeiden)
  setInterval(() => {
    if (ros && ros.isConnected) {
      const getNodesClient = new ROSLIB.Service({
        ros: ros,
        name: '/rosapi/nodes',
        serviceType: 'rosapi/Nodes'
      });
      
      getNodesClient.callService(new ROSLIB.ServiceRequest({}), (result) => {
        const dot = document.getElementById('mode-dot');
        const text = document.getElementById('mode-status');
        if (!dot || !text) return;

        let driverNode = null;
        if (result && result.nodes) {
          driverNode = result.nodes.find(n => n.includes('ufactory_driver'));
        }

        if (driverNode) {
          dot.className = 'dot glow-green';
          
          const paramClient = new ROSLIB.Service({
            ros: ros,
            name: '/rosapi/get_param',
            serviceType: 'rosapi/GetParam'
          });
          
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
                  text.innerHTML = `Real Arm<br><span style="font-size:0.85em; color:#00cec9;">${ip}</span>`;
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
        // Fehler stumm abfangen, falls /rosapi/nodes noch nicht existiert.
        // Verhindert das "Verschmutzen" der WebSocket-Verbindung.
      });
    }
  }, 5000);
});

ros.on('error', (error) => {
  document.getElementById('connection-status').innerText = 'WS Error';
  document.getElementById('connection-dot').className = 'dot glow-red';
  logMsg('System', 'Error connecting to websocket server', 'err');
});

ros.on('close', () => {
  document.getElementById('connection-status').innerText = 'WS Closed';
  document.getElementById('connection-dot').className = 'dot glow-red';
  document.getElementById('mode-dot').className = 'dot glow-red';
  document.getElementById('mode-status').innerText = 'Mode: Offline';
  logMsg('System', 'Connection to websocket server closed', 'warn');
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
  if (Math.abs(speedScale - 0.25) < 0.01) index = 0;
  else if (Math.abs(speedScale - 0.5) < 0.01) index = 1;
  else if (Math.abs(speedScale - 1.0) < 0.01) index = 2;
  else if (Math.abs(speedScale - 1.5) < 0.01) index = 3;
  else if (Math.abs(speedScale - 2.0) < 0.01) index = 4;
  
  const slider = document.getElementById('speed-slider');
  if (slider) {
    if (slider.value != index) {
      slider.value = index;
    }
    slider.style.backgroundSize = (index / 4 * 100) + '% 100%';
  }
  
  const percentages = ["12.5%", "25%", "50%", "75%", "100%"];
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

// ── YOLO 3D Objects ─────────────────────────────────────────────────────
const yoloSub = new ROSLIB.Topic({
  ros: ros,
  name: '/zed/bboxes_3d',
  messageType: 'visualization_msgs/MarkerArray'
});

yoloSub.subscribe((msg) => {
  const container = document.getElementById('yolo-container');
  if (!container) return;
  
  container.innerHTML = '';
  if(!msg.markers || msg.markers.length === 0) {
    container.innerHTML = '<div class="yolo-empty">No objects detected.</div>';
    return;
  }
  
  msg.markers.forEach(m => {
    if(m.type !== 9) return;
    
    const objName = m.text || 'Unknown';
    if(objName.startsWith('X:') || objName.startsWith('Y:') || objName.startsWith('Z:')) return;
    
    const x = (m.pose.position.x * 1000).toFixed(1);
    const y = (m.pose.position.y * 1000).toFixed(1);
    const z = (m.pose.position.z * 1000).toFixed(1);
    
    const item = document.createElement('div');
    item.className = 'yolo-item';
    item.onclick = () => {
      logMsg('UI', `Clicked on YOLO object: ${objName}`);
      document.getElementById('inp-grasp-obj').value = objName;
      executeGrasp();
    };
    item.innerHTML = `
      <i class="fa-solid fa-cube" style="color: var(--accent); font-size: 16px;"></i>
      <div class="yolo-details">
        <span class="yolo-class">${objName}</span>
        <span class="yolo-coords">
          <span style="color: var(--rviz-x);">X:${x}</span>
          <span style="color: var(--rviz-y); margin-left:6px;">Y:${y}</span>
          <span style="color: var(--rviz-z); margin-left:6px;">Z:${z}</span>
          <span style="color: var(--mut); margin-left:6px;">[mm]</span>
        </span>
      </div>
    `;
    container.appendChild(item);
  });
});

const jointStateSub = new ROSLIB.Topic({
  ros: ros,
  name: '/joint_states',
  messageType: 'sensor_msgs/JointState'
});

jointStateSub.subscribe((msg) => {
  const jointNames = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6'];
  let moving = false;
  for (let i=0; i<6; i++) {
    const idx = msg.name.indexOf(jointNames[i]);
    if (idx !== -1) {
      let val = msg.position[idx];
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
  messageType: 'std_msgs/Float32MultiArray'
});

eefSub.subscribe((msg) => {
  if (msg.data.length >= 3) {
    const tx = document.getElementById('telem-x');
    const ty = document.getElementById('telem-y');
    const tz = document.getElementById('telem-z');
    if(tx) tx.innerText = msg.data[0].toFixed(1);
    if(ty) ty.innerText = msg.data[1].toFixed(1);
    if(tz) tz.innerText = msg.data[2].toFixed(1);
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

// ── UI Actions ──────────────────────────────────────────────────────────
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

  const srcColors = { 'ROS': 'log-src-ros', 'UI': 'log-src-ui', 'System': 'log-src-sys' };
  const srcClass = srcColors[source] || 'log-src-sys';

  div.innerHTML = `<span class="log-time">[${timeStr}]</span><span class="log-src ${srcClass}">[${source}]</span> <span class="log-${autoType}">${text}</span>`;
  win.appendChild(div);
  win.scrollTop = win.scrollHeight;
}

function updateSpeed(val) {
  speedIndexPub.publish(new ROSLIB.Message({ data: parseInt(val) }));
  const slider = document.getElementById('speed-slider');
  if (slider) slider.style.backgroundSize = (val / 4 * 100) + '% 100%';
}

function setFrame(frame) {
  currentFrame = frame;
  document.querySelectorAll('.frame-btn').forEach(b => b.classList.remove('active', 'btn-primary'));
  const btn = document.getElementById(frame === 'link_tcp' ? 'btn-frame-tcp' : 'btn-frame-base');
  if(btn) btn.classList.add('active', 'btn-primary');
  
  twistMsg.header.frame_id = currentFrame;
  logMsg('UI', `Control Frame set to ${frame}`);
}

function startOctomapScan() {
  logMsg('UI', `➤ Starting Octomap Scan Path...`);
  const scanClient = new ROSLIB.Service({
    ros: ros,
    name: '/ui/start_octomap_scan',
    serviceType: 'std_srvs/Trigger'
  });
  
  scanClient.callService(new ROSLIB.ServiceRequest({}), (result) => {
    if (result.success) {
      logMsg('System', 'Octomap Scan completed successfully.', 'info');
    } else {
      logMsg('System', 'Octomap Scan failed: ' + result.message, 'err');
    }
  }, (error) => {
    logMsg('System', 'Failed to call Octomap Scan service: ' + error, 'err');
  });
}

function setGripper(state) {
  logMsg('UI', `➤ Gripper Command: ${state.toUpperCase()}`);
  
  const btnOpen = document.getElementById('btn-grip-open');
  const btnClose = document.getElementById('btn-grip-close');
  const btnOff = document.getElementById('btn-grip-off');
  
  if(!btnOpen || !btnClose || !btnOff) return;

  btnOpen.classList.remove('grip-flash-open');
  btnClose.classList.remove('grip-flash-close');
  btnOff.classList.remove('grip-off-active');

  void btnOpen.offsetWidth;
  void btnClose.offsetWidth;

  if (state === 'open') {
    btnOpen.classList.add('grip-flash-open');
  } else if (state === 'close') {
    btnClose.classList.add('grip-flash-close');
  } else if (state === 'off') {
    btnOff.classList.add('grip-off-active');
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

// ── Analog Joystick Implementation ──────────────────────────────────────
const zone = document.getElementById('joystick-zone');
const stick = document.getElementById('joystick-stick');
let joyActive = false;
const maxRadius = 50;
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
  startJog(nx, ny, 0, 0, 0, 0);
}

function endJoy() {
  joyActive = false;
  stick.style.transform = `translate(0px, 0px)`;
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

function moveToPose() {
  const srv = createSrv('/ui/execute_move_to_pose', 'xarm_msgs/MoveCartesian');
  const x = parseFloat(document.getElementById('inp-x').value);
  const y = parseFloat(document.getElementById('inp-y').value);
  const z = parseFloat(document.getElementById('inp-z').value);
  const r = parseFloat(document.getElementById('inp-r').value);
  const p = parseFloat(document.getElementById('inp-p').value);
  const yw = parseFloat(document.getElementById('inp-yw').value);

  const req = new ROSLIB.ServiceRequest({
    pose: [x, y, z, r, p, yw],
    speed: 100.0,
    acc: 1000.0,
    mvtime: 0.0
  });
  logMsg('UI', `➤ MoveTo Absolute Pose: X=${x} Y=${y} Z=${z}`);
  srv.callService(req, (res) => {
    if (res.ret === 0) logMsg('ROS', '✓ MoveTo successful.', 'info');
    else logMsg('ROS', `❌ MoveTo failed (ret=${res.ret}): ${res.message || 'Error'}`, 'err');
  }, (err) => { logMsg('ROS', `❌ MoveTo Error: ${err}`, 'err'); });
}

function setInitialPose() {
  const srv = createSrv('/ui/execute_initial_pose', 'std_srvs/Trigger');
  logMsg('UI', '➤ Triggering Initial Pose...');
  srv.callService(new ROSLIB.ServiceRequest({}), (res) => {
    if (res.success) logMsg('ROS', '✓ Initial Pose reached successfully.', 'info');
    else logMsg('ROS', `❌ Initial Pose failed: ${res.message}`, 'err');
  }, (err) => { logMsg('ROS', `❌ Trigger Error: ${err}`, 'err'); });
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
  
  if (msg.data.startsWith('Grasp: ')) {
    const objName = msg.data.split('Grasp: ')[1];
    const graspInput = document.getElementById('inp-grasp-obj');
    if (graspInput) {
      graspInput.value = objName;
      graspInput.style.boxShadow = "0 0 15px var(--green)";
      graspInput.style.borderColor = "var(--green)";
      setTimeout(() => {
        graspInput.style.boxShadow = "none";
        graspInput.style.borderColor = "";
      }, 2000);
    }
  }

  // Voice Command: "Move to Pose" → triggers moveToPose() with current input values
  if (msg.data === 'MoveTo: pose') {
    logMsg('VOICE', '🗣️ Voice → Triggering Absolute Pose Move...', 'info');
    moveToPose();
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

// ── MoveIt Servo Status ─────────────────────────────────────────────────
const servoStatusSub = new ROSLIB.Topic({
  ros: ros,
  name: '/servo_server/status',
  messageType: 'std_msgs/Int8'
});

function updateMoveItBadge() {
  const dot = document.getElementById('moveit-dot');
  const text = document.getElementById('moveit-status');
  if(!dot || !text) return;
  const pill = dot.parentElement;
  pill.classList.remove('pill-pulse-green', 'pill-pulse-red', 'pill-pulse-orange');
  
  if (currentServoStatus === 0) {
    dot.className = 'dot glow-green';
    text.innerText = isRobotMoving ? 'MoveIt: Moving' : 'MoveIt: Ready';
    pill.classList.add('pill-pulse-green');
  } else if (currentServoStatus === 1 || currentServoStatus === 3 || currentServoStatus === 6) {
    dot.className = 'dot glow-orange';
    if (currentServoStatus === 1) text.innerText = 'MoveIt: Sing. Near';
    else if (currentServoStatus === 3) text.innerText = 'MoveIt: Coll. Near';
    else text.innerText = 'MoveIt: Leav. Sing.';
    pill.classList.add('pill-pulse-orange');
  } else {
    dot.className = 'dot glow-red';
    if (currentServoStatus === 2) text.innerText = 'MoveIt: Sing. Halt';
    else if (currentServoStatus === 4) text.innerText = 'MoveIt: Coll. Halt';
    else if (currentServoStatus === 5) text.innerText = 'MoveIt: Limit';
    else text.innerText = 'MoveIt: Error';
    pill.classList.add('pill-pulse-red');
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

  // Set listening state (UI)
  btn.classList.add("btn-listening");
  textSpan.innerText = "Listening...";
  icon.classList.remove("fa-ear-listen");
  icon.classList.add("fa-microphone-lines", "fa-beat-fade");
  
  if (resultSpan) {
    resultSpan.innerText = "🎤 Listening for command...";
    resultSpan.style.color = "var(--purple)";
  }

  logMsg('UI', '➤ Whisper: Sending inference goal (5s recording)...');

  // Call Whisper Action Server (/whisper/inference)
  const whisperActionClient = new ROSLIB.ActionClient({
    ros: ros,
    serverName: '/whisper/inference',
    actionName: 'whisper_idl/action/Inference'
  });

  const goal = new ROSLIB.Goal({
    actionClient: whisperActionClient,
    goalMessage: {
      max_duration: { sec: 5, nanosec: 0 }
    }
  });

  // Safety timeout (falls der Server nicht antwortet)
  const safetyTimeout = setTimeout(() => {
    resetListeningUI(btn, textSpan, icon, resultSpan, "-- Server Timeout --");
    logMsg('System', 'Whisper Action Server did not respond within 8s.', 'err');
  }, 8000);

  goal.on('result', (result) => {
    clearTimeout(safetyTimeout);
    resetListeningUI(btn, textSpan, icon, resultSpan, null);
    logMsg('System', 'Whisper recording completed.', 'info');
  });

  goal.on('feedback', (feedback) => {
    // Feedback from Whisper (optional)
  });

  goal.on('status', (status) => {
    // status.status: 1=ACTIVE, 2=PREEMPTED, 3=SUCCEEDED, 4=ABORTED, 5=REJECTED
    if (status.status === 4 || status.status === 5) {
      clearTimeout(safetyTimeout);
      resetListeningUI(btn, textSpan, icon, resultSpan, "-- Error --");
      logMsg('System', 'Whisper goal was aborted/rejected.', 'err');
    }
  });

  goal.send();
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
  const colRight = document.getElementById('col-right');
  if (!colLeft || !colRight || typeof Sortable === 'undefined') return;

  const layoutKey = 'robot_control_layout';

  // 1. Load saved layout if available
  try {
    const saved = localStorage.getItem(layoutKey);
    if (saved) {
      const layout = JSON.parse(saved);
      // Restore left column
      if (layout.left && Array.isArray(layout.left)) {
        layout.left.forEach(id => {
          const el = document.getElementById(id);
          if (el) colLeft.appendChild(el);
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
      right: Array.from(colRight.querySelectorAll('.glass-panel')).map(el => el.id).filter(id => id)
    };
    localStorage.setItem(layoutKey, JSON.stringify(layout));
    logMsg('UI', '✓ Layout saved automatically', 'success');
  }

  // 3. Initialize Sortable
  const sortableOpts = {
    group: 'panels',
    animation: 200,
    handle: 'h2', // Only drag by the header
    ghostClass: 'sortable-ghost',
    onEnd: saveLayout
  };

  new Sortable(colLeft, sortableOpts);
  new Sortable(colRight, sortableOpts);
}

// Call init once DOM is definitely ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDragAndDrop);
} else {
  initDragAndDrop();
}

