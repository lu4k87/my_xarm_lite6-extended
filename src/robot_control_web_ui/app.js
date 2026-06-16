// ── ROS Connection ────────────────────────────────────────────────────────
let ros;
try {
  const host = window.location.hostname || 'localhost';
  ros = new ROSLIB.Ros({
    url: 'ws://' + host + ':9090'
  });
} catch (e) {
  document.getElementById('connection-status').innerText = 'JS Error';
  console.error("Failed to init ROSLIB", e);
  alert("Fehler beim Laden von ROSLIB: " + e.message);
}

ros.on('connection', () => {
  document.getElementById('connection-status').innerText = 'WS: 9090';
  document.getElementById('connection-dot').className = 'dot glow-green';
  logMsg('System', 'Connected to rosbridge_server (ws://localhost:9090)', 'info');

  // Start checking for real/fake arm
  setInterval(() => {
    if (ros.isConnected) {
      const getNodesClient = new ROSLIB.Service({
        ros: ros,
        name: '/rosapi/nodes',
        serviceType: 'rosapi/Nodes'
      });
      getNodesClient.callService(new ROSLIB.ServiceRequest({}), (result) => {
        const dot = document.getElementById('mode-dot');
        const text = document.getElementById('mode-status');
        if (result && result.nodes && result.nodes.includes('/xarm_driver')) {
          dot.className = 'dot glow-green';
          
          // Try to get IP
          const paramClient = new ROSLIB.Service({
            ros: ros,
            name: '/rosapi/get_param',
            serviceType: 'rosapi/GetParam'
          });
          paramClient.callService(new ROSLIB.ServiceRequest({
            name: '/xarm_driver/robot_ip',
            default: '"USB"'
          }), (paramResult) => {
            try {
              let ip = paramResult.value ? JSON.parse(paramResult.value) : 'USB';
              text.innerText = `Real Arm (${ip})`;
            } catch (e) {
              text.innerText = `Mode: Real Arm`;
            }
          });
        } else {
          dot.className = 'dot glow-blue';
          text.innerText = 'Mode: Fake Arm';
        }
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

// ── Globals ─────────────────────────────────────────────────────────────
let currentFrame = 'link_base';
let speedScale = 0.5; // Start with default wait for /current_speed

let jogActive = false;
let jogTimer = null;
let twistMsg = new ROSLIB.Message({
  header: { frame_id: currentFrame },
  twist: {
    linear: { x: 0, y: 0, z: 0 },
    angular: { x: 0, y: 0, z: 0 }
  }
});

let activeJointJog = -1; // 0 to 5 for J1 to J6
let jointJogVelocity = 0;
let jointJogStartX = 0;
let jointJogTimer = null;
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
});

// ── YOLO 3D Objects ─────────────────────────────────────────────────────
const yoloSub = new ROSLIB.Topic({
  ros: ros,
  name: '/zed/bboxes_3d',
  messageType: 'visualization_msgs/MarkerArray'
});
yoloSub.subscribe((msg) => {
  const container = document.getElementById('yolo-container');
  container.innerHTML = ''; // clear current
  if(!msg.markers || msg.markers.length === 0) {
    container.innerHTML = '<div class="yolo-empty">No objects detected.</div>';
    return;
  }
  
  // Create an entry for each marker
  msg.markers.forEach(m => {
    // skip bounding box lines if they exist, look for text markers usually
    if(m.type !== 9) return; // 9 = TEXT_VIEW_FACING
    
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
      document.getElementById(`j${i+1}-val`).innerText = val.toFixed(2);
      // Update bar width (-3.14 to 3.14 -> 0 to 100%)
      let pct = ((val + 3.14) / 6.28) * 100;
      document.getElementById(`j${i+1}-fill`).style.width = `${pct}%`;
      document.getElementById(`j${i+1}-fill`).style.left = '0%';
      
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

// Subscribe directly to the Guardian Node for TCP Position
const eefSub = new ROSLIB.Topic({
  ros: ros,
  name: '/ui/eef_position',
  messageType: 'std_msgs/Float32MultiArray'
});

eefSub.subscribe((msg) => {
  if (msg.data.length >= 3) {
    document.getElementById('telem-x').innerText = msg.data[0].toFixed(1);
    document.getElementById('telem-y').innerText = msg.data[1].toFixed(1);
    document.getElementById('telem-z').innerText = msg.data[2].toFixed(1);
  }
  if (msg.data.length >= 7) {
    const qx = msg.data[3];
    const qy = msg.data[4];
    const qz = msg.data[5];
    const qw = msg.data[6];

    // Quaternion to Euler
    const sinr_cosp = 2 * (qw * qx + qy * qz);
    const cosr_cosp = 1 - 2 * (qx * qx + qy * qy);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);

    const sinp = 2 * (qw * qy - qz * qx);
    const pitch = Math.abs(sinp) >= 1 ? (Math.sign(sinp) * Math.PI / 2) : Math.asin(sinp);

    const siny_cosp = 2 * (qw * qz + qx * qy);
    const cosy_cosp = 1 - 2 * (qy * qy + qz * qz);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);

    document.getElementById('telem-r').innerText = roll.toFixed(2);
    document.getElementById('telem-p').innerText = pitch.toFixed(2);
    document.getElementById('telem-yaw').innerText = yaw.toFixed(2);
  }
});

// ── UI Actions ──────────────────────────────────────────────────────────

function logMsg(source, text, type='info') {
  const win = document.getElementById('log-window');
  const d = new Date();
  const timeStr = d.toTimeString().split(' ')[0];
  const div = document.createElement('div');
  div.className = 'log-entry';
  div.innerHTML = `<span class="log-time">[${timeStr}]</span><span class="log-${type}">[${source}] ${text}</span>`;
  win.appendChild(div);
  win.scrollTop = win.scrollHeight;
}

function updateSpeed(val) {
  speedIndexPub.publish(new ROSLIB.Message({ data: parseInt(val) }));
  const percentages = ["12.5%", "25%", "50%", "75%", "100%"];
  const displayLevel = parseInt(val) + 1;
  document.getElementById('speed-val').innerText = `${displayLevel}/5 (${percentages[parseInt(val)]})`;
  logMsg('UI', `Speed Level changed to ${displayLevel}/5 (${percentages[parseInt(val)]})`);
}

function setFrame(frame) {
  currentFrame = frame;
  document.querySelectorAll('.frame-btn').forEach(b => {
    b.classList.remove('active', 'btn-primary');
  });
  if(frame === 'link_tcp') {
    const b = document.getElementById('btn-frame-tcp');
    b.classList.add('active', 'btn-primary');
  } else {
    const b = document.getElementById('btn-frame-base');
    b.classList.add('active', 'btn-primary');
  }
  
  twistMsg.header.frame_id = currentFrame;
  logMsg('UI', `Control Frame set to ${frame}`);
}

// ── Jogging Logic ───────────────────────────────────────────────────────

function startJog(lx, ly, lz, ax, ay, az) {
  jogActive = true;
  let s = speedScale * 0.1; // Base scaling factor to match C++
  twistMsg.twist.linear.x = lx * s;
  twistMsg.twist.linear.y = ly * s;
  twistMsg.twist.linear.z = lz * s;
  twistMsg.twist.angular.x = ax * s * 2.0; // rotation is 0.2 * scale
  twistMsg.twist.angular.y = ay * s * 2.0;
  twistMsg.twist.angular.z = az * s * 2.0;
  
  if(jogTimer) clearInterval(jogTimer);
  jogTimer = setInterval(() => {
    twistMsg.header.stamp = {sec: Math.floor(Date.now()/1000), nanosec: (Date.now()%1000)*1000000};
    twistPub.publish(twistMsg);
  }, 20); // 50 Hz
}

function stopJog() {
  jogActive = false;
  if(jogTimer) clearInterval(jogTimer);
  
  // Publish zero twist to halt
  twistMsg.twist.linear.x = 0; twistMsg.twist.linear.y = 0; twistMsg.twist.linear.z = 0;
  twistMsg.twist.angular.x = 0; twistMsg.twist.angular.y = 0; twistMsg.twist.angular.z = 0;
  twistMsg.header.stamp = {sec: Math.floor(Date.now()/1000), nanosec: (Date.now()%1000)*1000000};
  twistPub.publish(twistMsg);
}

// ── Live Joint Jogging (Slider Controls) ────────────────────────────────
function startJointJog(idx, e) {
  activeJointJog = idx;
  jointJogStartX = e.clientX;
  jointJogVelocity = 0;
  
  // Set global mouse tracking for the duration of the drag
  document.addEventListener('pointermove', onJointJogMove);
  document.addEventListener('pointerup', stopJointJog);

  if(jointJogTimer) clearInterval(jointJogTimer);
  jointJogTimer = setInterval(() => {
    if(activeJointJog >= 0 && activeJointJog <= 5) {
      jointJogMsg.header.stamp = {sec: Math.floor(Date.now()/1000), nanosec: (Date.now()%1000)*1000000};
      jointJogMsg.joint_names = [`joint${activeJointJog + 1}`]; // e.g. "joint1"
      
      // Calculate velocity based on how far mouse moved from click point
      // Scale down so it moves very slowly as requested
      let scaledVel = jointJogVelocity * 0.005 * speedScale;
      
      // Cap max velocity to avoid dangerous speeds
      if(scaledVel > 1.0) scaledVel = 1.0;
      if(scaledVel < -1.0) scaledVel = -1.0;
      
      jointJogMsg.velocities = [scaledVel];
      jointJogPub.publish(jointJogMsg);
    }
  }, 50); // 20 Hz for joints
}

function onJointJogMove(e) {
  if (activeJointJog !== -1) {
    // Delta X determines direction and speed
    jointJogVelocity = e.clientX - jointJogStartX;
  }
}

function stopJointJog() {
  if(activeJointJog !== -1) {
    // Send one last zero velocity message to stop it instantly
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

// ── Analog Joystick Implementation ───────────────────────────────────────

const zone = document.getElementById('joystick-zone');
const stick = document.getElementById('joystick-stick');
let joyActive = false;
const maxRadius = 50; // Max visual displacement
let joyCenterX = 0, joyCenterY = 0;

zone.addEventListener('mousedown', initJoy);
zone.addEventListener('touchstart', initJoy, {passive: false});

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
  e.preventDefault();
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
  
  // Map to Cartesian. 
  // Stick UP (dy < 0) -> X+ (Forward)
  // Stick DOWN (dy > 0) -> X- (Backward)
  // Stick LEFT (dx < 0) -> Y+ (Left in ROS is usually positive Y)
  // Stick RIGHT (dx > 0) -> Y- (Right in ROS)
  
  const nx = -(dy / maxRadius); // Forward is +X
  const ny = -(dx / maxRadius); // Left is +Y
  
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
    if (res.ret === 0) {
      logMsg('ROS', '✓ MoveTo successful.', 'info');
    } else {
      logMsg('ROS', `❌ MoveTo failed (ret=${res.ret}): ${res.message || 'Error'}`, 'err');
    }
  });
}

function setInitialPose() {
  const srv = createSrv('/ui/execute_initial_pose', 'std_srvs/Trigger');
  const req = new ROSLIB.ServiceRequest({});
  logMsg('UI', '➤ Triggering Initial Pose...');
  srv.callService(req, (res) => {
    if (res.success) {
      logMsg('ROS', '✓ Initial Pose reached successfully.', 'info');
    } else {
      logMsg('ROS', `❌ Initial Pose failed: ${res.message}`, 'err');
    }
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

// ── MoveIt Servo Status ──────────────────────────────────────────────────
const servoStatusSub = new ROSLIB.Topic({
  ros: ros,
  name: '/servo_server/status',
  messageType: 'std_msgs/Int8'
});

let currentServoStatus = 0;
let isRobotMoving = false;
let movingTimeout = null;

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
