import { TOPICS } from './config.js';
import { logMsg } from './log.js';
import { ros } from './ros.js';
import { shortRmwName, visibleInterval } from './util.js';

// ── Header-Badges ────────────────────────────────────────────────────────
// Ports, Quest 3, Xbox, Tobii und die ROS-Umgebung kommen gesammelt von
// /api/header_status (server.py, geprueft auf dem PC). Same-Origin - klappt
// damit auch aus der HTTPS-Seite (8443, Quest), die keine HTTP-Ports abfragen
// darf. Browser-Signale (WebXR-Controllerdaten, Gamepad API, /joy) kommen dazu.
const HEADER_STATUS_URL = '/api/header_status';
const SIGNAL_FRESH_MS = 2500;
let hdr = null;            // letzte Antwort von /api/header_status
let hdrFailLogged = false;

function setDot(id, cls) {
  const dot = document.getElementById(id);
  if (dot) dot.className = `dot ${cls}`;
}

function setDevicePill(pillId, dotId, valId, online, text, title) {
  setDot(dotId, online ? 'glow-green' : 'glow-red');
  const val = document.getElementById(valId);
  if (val) val.textContent = text;
  const pill = document.getElementById(pillId);
  if (pill && title) pill.title = title;
}

// Meta Quest 3: online per USB (adb/sysfs), WLAN (Ping auf die per adb
// gemerkte IP) oder solange die WebXR-Seite Controllerdaten schickt.
let questLastSeen = 0;
new ROSLIB.Topic({
  ros: ros,
  name: '/vr_teleop/controller_data',
  messageType: 'std_msgs/String',
  throttle_rate: 500,
  queue_length: 1
}).subscribe(() => { questLastSeen = Date.now(); });

new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.vrTeleopMirrorPose,
  messageType: 'std_msgs/String',
  throttle_rate: 1000,
  queue_length: 1
}).subscribe(() => { questLastSeen = Date.now(); });

// Xbox: Gamepad API meldet den Controller erst nach einem Tastendruck auf der
// Seite - deshalb zusaetzlich /joy und die Erkennung auf dem PC.
let joyLastSeen = 0;
new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.joy,
  messageType: 'sensor_msgs/msg/Joy',
  throttle_rate: 1000,
  queue_length: 1
}).subscribe(() => { joyLastSeen = Date.now(); });

function browserGamepad() {
  const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
  return pads.find(p => p && p.connected) || null;
}

window.addEventListener('gamepadconnected', (e) => {
  logMsg('System', `Gamepad connected: ${e.gamepad.id}`, 'info');
  renderDevicePills();
});
window.addEventListener('gamepaddisconnected', () => {
  logMsg('System', 'Gamepad disconnected.', 'warn');
  renderDevicePills();
});

let questWasOnline = null;
let tobiiWasOnline = null;

function renderDevicePills() {
  const now = Date.now();

  const q = (hdr && hdr.quest) || {};
  const inVR = now - questLastSeen < SIGNAL_FRESH_MS;
  const links = [q.usb && 'USB', q.wlan && 'WLAN'].filter(Boolean).join('+');
  const questOnline = inVR || !!links;
  setDevicePill('quest-pill', 'quest-dot', 'quest-status', questOnline,
    inVR ? (links ? `VR · ${links}` : 'VR') : (links || 'Offline'),
    `Meta Quest 3 - USB: ${q.usb ? 'connected' : 'no'} · WLAN: ${q.wlan ? `reachable (${q.ip})` : (q.ip ? `no reply (${q.ip})` : 'IP unknown - connect once via USB')}` +
    ` · WebXR: ${inVR ? 'controller data arriving (wss 9091)' : 'no active VR session'}`);
  if (questWasOnline !== null && questOnline !== questWasOnline) {
    logMsg('System', `Meta Quest 3 ${questOnline ? `connected (${links || 'VR'})` : 'disconnected'}`, questOnline ? 'info' : 'warn');
  }
  questWasOnline = questOnline;

  const pad = browserGamepad();
  const joy = now - joyLastSeen < SIGNAL_FRESH_MS;
  const xboxPc = !!(hdr && hdr.xbox && hdr.xbox.connected);
  const xboxOnline = xboxPc || !!pad || joy;
  let xboxText = 'Offline';
  if (pad) xboxText = pad.id.length > 20 ? pad.id.substring(0, 20) + '...' : pad.id;
  else if (xboxOnline) xboxText = 'Online';
  setDevicePill('gamepad-pill', 'gp-dot', 'gamepad-status', xboxOnline, xboxText,
    `Xbox One Controller - PC: ${xboxPc ? 'connected' : 'not detected'} · /joy: ${joy ? 'data arriving' : 'silent'}` +
    ` · Browser: ${pad ? pad.id : 'not seen (press a button on the page)'}`);

  const t = (hdr && hdr.tobii) || {};
  const tobiiOnline = !!t.online;
  setDevicePill('eye-pill', 'eye-dot', 'eye-status', tobiiOnline, tobiiOnline ? 'Online' : 'Offline',
    `Tobii Pro Glasses 3 - RTSP ${t.ip || '?'}:8554 ${tobiiOnline ? 'reachable' : 'not reachable'}`);
  if (tobiiWasOnline !== null && tobiiOnline !== tobiiWasOnline) {
    logMsg('System', `Tobii Pro Glasses 3 ${tobiiOnline ? 'connected' : 'disconnected'}`, tobiiOnline ? 'info' : 'warn');
  }
  tobiiWasOnline = tobiiOnline;
}

function renderPortPills() {
  const ownPort = window.location.port;
  [8081, 5000, 8080, 8082, 9091].forEach((port) => {
    // Die Seite selbst kam gerade von diesem Port - er laeuft.
    const up = String(port) === ownPort || !!(hdr && hdr.ports && hdr.ports[port]);
    setDot(`dot-port-${port}`, up ? 'glow-green' : 'glow-red');
  });
  if (!hdr || !hdr.env) return;
  const env = hdr.env;
  const lhOn = env.localhost_only === '1';
  const lh = document.getElementById('val-localhost-only');
  if (lh) lh.textContent = lhOn ? 'On' : 'Off';
  setDot('dot-localhost-only', lhOn ? 'glow-orange' : 'glow-blue');
  const dom = document.getElementById('val-domain-id');
  if (dom) dom.textContent = env.ros_domain_id;
  const rmw = document.getElementById('val-rmw-impl');
  if (rmw) {
    // Ohne RMW_IMPLEMENTATION nimmt Humble Fast DDS.
    const impl = env.rmw_implementation || 'rmw_fastrtps_cpp';
    rmw.textContent = shortRmwName(impl);
    rmw.title = env.rmw_implementation ? impl : `${impl} (default, RMW_IMPLEMENTATION not set)`;
  }
}

function pollHeaderStatus() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  fetch(HEADER_STATUS_URL, { cache: 'no-store', signal: controller.signal })
    .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
    .then((data) => { hdr = data; hdrFailLogged = false; })
    .catch((err) => {
      hdr = null;
      if (!hdrFailLogged) {
        hdrFailLogged = true;
        logMsg('System', `Header status unavailable (${HEADER_STATUS_URL}: ${err.message || err}) - restart the UI web server.`, 'warn');
      }
    })
    .finally(() => {
      clearTimeout(timer);
      renderPortPills();
      renderDevicePills();
    });
}

export function initPortMonitoring() {
  // Ueber HTTPS laeuft die UI ueber die SSL-rosbridge (ros.js).
  if (window.location.protocol === 'https:') {
    const pill = document.getElementById('pill-port-9090');
    if (pill) {
      pill.title = 'Port 9091: ROS 2 WebSocket Interface (SSL rosbridge, used over HTTPS)';
      const val = pill.querySelector('.pill-val');
      if (val) val.textContent = '9091';
      const proto = pill.querySelector('.pill-proto');
      if (proto) proto.textContent = 'WSS';
    }
  }
  pollHeaderStatus();
  visibleInterval(pollHeaderStatus, 2000);
}
