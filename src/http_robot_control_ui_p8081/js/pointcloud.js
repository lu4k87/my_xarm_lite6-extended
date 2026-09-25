import { TOPICS } from './config.js';
import * as twin from './twin/digital_twin.js';
import { logMsg } from './log.js';
import { ros } from './ros.js';
import { lsGet, lsSet } from './util.js';

// ── ZED-Punktwolke im Digital Twin ──────────────────────────────────────
// Standardmaessig AUS. Das Topic wird nur abonniert, solange der Schalter an
// ist - pointcloud_optimizer.py rechnet die Web-Wolke nur, wenn jemand
// zuhoert. Die Wolke kommt bereits ausgeduennt und im Frame "world".
export const TWIN_POINTCLOUD_LS_KEY = 'twin_pointcloud_visible';

let pointCloudTopic = null;
let pointCloudEnabled = false;
let positions = null;
let colors = null;
let lastWarn = '';

function warnOnce(msg) {
  if (msg === lastWarn) return;
  lastWarn = msg;
  logMsg('UI', `⚠ Point cloud: ${msg}`, 'warn');
}

// rosbridge liefert uint8[] als Base64-String.
function decodeBase64(data) {
  if (typeof data !== 'string') return new Uint8Array(data || []);
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function onPointCloud(msg) {
  if (!pointCloudEnabled) return;
  const fields = {};
  (msg.fields || []).forEach(f => { fields[f.name] = f; });
  if (!fields.x || !fields.y || !fields.z) { warnOnce('message without x/y/z fields'); return; }
  if (msg.is_bigendian) { warnOnce('big-endian clouds are not supported'); return; }

  const bytes = decodeBase64(msg.data);
  const step = msg.point_step;
  const count = step > 0 ? Math.floor(bytes.length / step) : 0;
  if (count === 0) { twin.clearDigitalTwinPointCloud(); return; }

  if (!positions || positions.length < count * 3) {
    positions = new Float32Array(count * 3);
    colors = new Float32Array(count * 3);
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ox = fields.x.offset, oy = fields.y.offset, oz = fields.z.offset;
  const orgb = fields.rgb ? fields.rgb.offset : -1;
  for (let i = 0, base = 0; i < count; i++, base += step) {
    positions[i * 3] = view.getFloat32(base + ox, true);
    positions[i * 3 + 1] = view.getFloat32(base + oy, true);
    positions[i * 3 + 2] = view.getFloat32(base + oz, true);
    if (orgb >= 0) {
      // gepackt wie PCL: 0x00RRGGBB in den Bits des float
      const c = view.getUint32(base + orgb, true);
      colors[i * 3] = ((c >> 16) & 0xff) / 255;
      colors[i * 3 + 1] = ((c >> 8) & 0xff) / 255;
      colors[i * 3 + 2] = (c & 0xff) / 255;
    } else {
      colors[i * 3] = 0.3; colors[i * 3 + 1] = 0.85; colors[i * 3 + 2] = 1.0;
    }
  }
  twin.setDigitalTwinPointCloud(positions, colors, count);
}

function subscribe() {
  if (pointCloudTopic || !ros) return;
  pointCloudTopic = new ROSLIB.Topic({
    ros: ros,
    name: TOPICS.zedPointcloudWeb,
    messageType: 'sensor_msgs/PointCloud2',
    throttle_rate: 250,
    queue_length: 1
  });
  pointCloudTopic.subscribe(onPointCloud);
}

function unsubscribe() {
  if (!pointCloudTopic) return;
  pointCloudTopic.unsubscribe();
  pointCloudTopic = null;
}

export function applyTwinPointCloudBtn(visible) {
  const btn = document.getElementById('btn-twin-pointcloud');
  if (!btn) return;
  btn.classList.toggle('active', visible);
  btn.style.color = visible ? 'var(--cyan)' : 'var(--dim)';
  btn.style.opacity = visible ? '1' : '0.5';
  btn.title = visible
    ? 'Hide ZED point cloud in 3D view (/zed/pointcloud_web)'
    : 'Show ZED point cloud in 3D view (/zed/pointcloud_web)';
}

export function setTwinPointCloud(visible) {
  pointCloudEnabled = !!visible;
  if (pointCloudEnabled) {
    lastWarn = '';
    subscribe();
  } else {
    unsubscribe();
    if (typeof twin.clearDigitalTwinPointCloud === 'function') twin.clearDigitalTwinPointCloud();
  }
  applyTwinPointCloudBtn(pointCloudEnabled);
}

export function isTwinPointCloudOn() {
  return pointCloudEnabled;
}

export function toggleTwinPointCloud() {
  const now = !pointCloudEnabled;
  setTwinPointCloud(now);
  lsSet(TWIN_POINTCLOUD_LS_KEY, now ? '1' : '0');
  logMsg('UI', `ZED point cloud ${now ? 'enabled' : 'disabled'}`);
}

export function restoreTwinPointCloud() {
  setTwinPointCloud(lsGet(TWIN_POINTCLOUD_LS_KEY) === '1');
}

document.addEventListener('DOMContentLoaded', () => setTimeout(restoreTwinPointCloud, 400));
