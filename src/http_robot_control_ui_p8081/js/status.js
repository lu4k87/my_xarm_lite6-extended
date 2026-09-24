import { logMsg } from './log.js';
import { ROS_HOST, ros } from './ros.js';
import { shortRmwName, visibleInterval } from './util.js';

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
    status.innerText = 'Offline';
    logMsg('System', 'Gamepad disconnected.', 'warn');
  }
});

// ── Meta Quest 3 ─────────────────────────────────────────────────────────
// Online, solange die WebXR-Seite Controllerdaten schickt (ueber die zweite
// rosbridge auf 9091, dasselbe ROS-Netz). Gedrosselt - es zaehlt nur, ob
// ueberhaupt etwas ankommt.
const QUEST_ONLINE_MS = 2500;
let questLastSeen = 0;
new ROSLIB.Topic({
  ros: ros,
  name: '/vr_teleop/controller_data',
  messageType: 'std_msgs/String',
  throttle_rate: 500,
  queue_length: 1
}).subscribe(() => { questLastSeen = Date.now(); });

let questWasOnline = null;
visibleInterval(() => {
  const online = Date.now() - questLastSeen < QUEST_ONLINE_MS;
  if (online === questWasOnline) return;
  questWasOnline = online;
  const dot = document.getElementById('quest-dot');
  const val = document.getElementById('quest-status');
  if (dot) dot.className = online ? 'dot glow-green' : 'dot glow-red';
  if (val) val.textContent = online ? 'Online' : 'Offline';
  if (questLastSeen) logMsg('System', `Meta Quest 3 ${online ? 'connected' : 'disconnected'}`, online ? 'info' : 'warn');
}, 1000);

// ── Dynamic Port & Connection Monitoring ──────────────────────────────────
export function initPortMonitoring() {
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
            if (el) { el.innerText = shortRmwName(data.rmw_implementation); el.title = data.rmw_implementation; }
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
  visibleInterval(checkAll, 3000);
}
