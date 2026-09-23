import { TOPICS, SERVICES } from './config.js';
import { logMsg } from './log.js';
import { visibleInterval } from './util.js';

// ── ROS-Anbindung ───────────────────────────────────────────────────────
// Basismodul: rosbridge-Verbindung, Offline-Overlay, Bewegungssperre und
// Service-Helfer. Importiert bewusst KEINE Feature-Module - wer auf Verbindung,
// Verbindungsverlust oder die Node-Liste reagieren will, haengt sich in
// rosHooks ein. So entstehen keine Importzyklen mit dem Basismodul.
export const rosHooks = {
  onConnect: [],          // () => void
  onConnectionLost: [],   // () => void
  onNodeList: [],         // (nodes: string[] | null) => void
};

export let ros;

// ── ROS Connection ────────────────────────────────────────────────────────
// Host und URL werden genau einmal bestimmt. Vorher stand "const host" in vier
// getrennten Scopes, und die Log-Ausgabe nannte fest "localhost", obwohl die
// UI je nach Aufruf unter 127.0.0.2 laeuft.
export const ROS_HOST = window.location.hostname || 'localhost';
export const ROS_URL = 'ws://' + ROS_HOST + ':9090';

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
export let getNodesClient = null;
export let paramClient = null;

export function checkRosNodes() {
  if (!ros || !ros.isConnected) return;
  if (!getNodesClient) {
    getNodesClient = new ROSLIB.Service({
      ros: ros,
      name: SERVICES.rosapiNodes,
      serviceType: 'rosapi/Nodes'
    });
  }

  getNodesClient.callService(new ROSLIB.ServiceRequest({}), (result) => {
    // ── 3D Scene Objects Node Detection ──
    rosHooks.onNodeList.forEach(fn => fn(result ? result.nodes : null));

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
          name: SERVICES.rosapiGetParam,
          serviceType: 'rosapi/GetParam'
        });
      }

      paramClient.callService(new ROSLIB.ServiceRequest({
        // rosapi (ROS 2) erwartet "<node>:<parameter>" und das Feld
        // default_value - mit "/robot_ip" kam die IP nie an.
        name: `${driverNode}:robot_ip`,
        default_value: ''
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
              text.innerText = 'Real Arm';
            }
          } else {
            text.innerText = 'Real Arm';
          }
        } catch (e) {
          text.innerText = 'Real Arm';
        }
      }, (err) => { 
        text.innerText = 'Real Arm';
      });
    } else {
      dot.className = 'dot glow-blue';
      text.innerText = 'Fake Arm';
    }
  }, (err) => {
    // Swallow errors silently in case /rosapi/nodes does not exist yet.
    // Prevents "polluting" the WebSocket connection.
  });
}

visibleInterval(checkRosNodes, 2500);

// Live ROS Environment Metadata (Topic: /dashboard/workspace_metadata)
try {
  const metaTopic = new ROSLIB.Topic({
    ros: ros,
    name: TOPICS.dashboardWorkspaceMetadata,
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

// ── Verbindungsabbruch: Overlay + Bewegungssperre ────────────────────────
// Solange rosbridge fehlt, liegt ein Overlay ueber der ganzen Bedienflaeche
// (nur der Header mit Not-Aus und Status bleibt frei) und jede Bewegungs-
// funktion bricht per motionAllowed() ab.
export let rosOfflineSince = null;
export let rosReconnectAttempts = 0;
export let rosOfflineTicker = null;
export let rosEverConnected = false;

export function renderRosOfflineOverlay() {
  const meta = document.getElementById('ros-offline-meta');
  if (!meta || rosOfflineSince === null) return;
  const sec = Math.round((Date.now() - rosOfflineSince) / 1000);
  meta.textContent = `${ROS_URL} · offline for ${sec} s · reconnect attempts: ${rosReconnectAttempts}`;
}

export function setRosOnline(online) {
  const overlay = document.getElementById('ros-offline-overlay');
  document.body.classList.toggle('ros-offline', !online);
  if (online) {
    rosEverConnected = true;
    rosOfflineSince = null;
    rosReconnectAttempts = 0;
    if (rosOfflineTicker) { clearInterval(rosOfflineTicker); rosOfflineTicker = null; }
    if (overlay) overlay.classList.add('is-hidden');
    return;
  }
  rosHooks.onConnectionLost.forEach(fn => fn());
  if (rosOfflineSince === null) rosOfflineSince = Date.now();
  if (overlay) {
    overlay.classList.remove('is-hidden');
    overlay.classList.toggle('is-connecting', !rosEverConnected);
    const title = document.getElementById('ros-offline-title');
    const text = document.getElementById('ros-offline-text');
    if (title) title.textContent = rosEverConnected
      ? 'Connection to ROS 2 Bridge lost'
      : 'Connecting to ROS 2 Bridge...';
    if (text) text.textContent = rosEverConnected
      ? 'All motion controls are locked. Commands from this page no longer reach the robot - use the hardware emergency stop if the arm is still moving.'
      : 'Motion controls are locked until the connection is established.';
  }
  renderRosOfflineOverlay();
  if (!rosOfflineTicker) rosOfflineTicker = setInterval(renderRosOfflineOverlay, 1000);
}

// Letzte Pruefung vor jedem Bewegungsbefehl. silent: fuer Aufrufe mit
// Eingaberate (Joystick), die sonst das Log fluten wuerden.
export function motionAllowed(what, silent = false) {
  if (ros && ros.isConnected) return true;
  if (!silent) logMsg('SAFETY', `⛔ ${what} blocked - no connection to rosbridge.`, 'err');
  return false;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!(ros && ros.isConnected)) setRosOnline(false);
});

ros.on('connection', () => {
  setRosOnline(true);
  const connStatus = document.getElementById('connection-status');
  if (connStatus) connStatus.innerText = 'ROS 2 Bridge';
  const connDot = document.getElementById('connection-dot');
  if (connDot) connDot.className = 'dot glow-green';
  logMsg('System', `Connected to rosbridge_server (${ROS_URL})`, 'info');
  rosHooks.onConnect.forEach(fn => fn());
  // Sofort einmal pruefen, statt bis zu 2,5 s auf den naechsten Tick zu warten.
  checkRosNodes();
});

ros.on('error', (error) => {
  const connStatus = document.getElementById('connection-status');
  if (connStatus) connStatus.innerText = 'ROS 2 Bridge';
  const connDot = document.getElementById('connection-dot');
  if (connDot) connDot.className = 'dot glow-red';
  logMsg('System', 'Error connecting to websocket server', 'err');
});

export let reconnectTimer = null;

ros.on('close', () => {
  setRosOnline(false);
  const connStatus = document.getElementById('connection-status');
  if (connStatus) connStatus.innerText = 'ROS 2 Bridge';
  const connDot = document.getElementById('connection-dot');
  if (connDot) connDot.className = 'dot glow-red';
  const modeDot = document.getElementById('mode-dot');
  if (modeDot) modeDot.className = 'dot glow-red';
  const modeStatus = document.getElementById('mode-status');
  if (modeStatus) modeStatus.innerText = 'Offline';

  if (!reconnectTimer) {
    logMsg('System', 'Connection closed. Retrying in 3s...', 'warn');
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      rosReconnectAttempts++;
      renderRosOfflineOverlay();
      if (ros) ros.connect(ROS_URL);
    }, 3000);
  }
});

// ── Services (MoveTo, Utils, Grasp) ─────────────────────────────────────
export function createSrv(name, type) {
  return new ROSLIB.Service({ ros: ros, name: name, serviceType: type });
}
