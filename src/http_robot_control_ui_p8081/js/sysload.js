import { visibleInterval } from './util.js';

// ── SYSTEM-Tab: CPU- und GPU-Last ───────────────────────────────────────
// Werte kommen von /api/sys_load (server.py misst per /proc/stat und
// nvidia-smi). Same-Origin - klappt auch aus der HTTPS-Seite (8443, Quest).
// Pro Zeile ein Mini-Verlauf wie der Traffic-Graph im Header der Nexus
// Webapp, hier aber mit fester Skala 0-100 %.
const SYS_LOAD_URL = '/api/sys_load';
const POLL_MS = 1000;
const HISTORY_LEN = 60;
const HIGH_PCT = 90;
const W = 120;
const H = 22;

const history = { cpu: [], gpu: [] };

function renderSpark(kind) {
  const svg = document.getElementById(`sysload-${kind}-spark`);
  const hist = history[kind];
  if (!svg) return;
  if (hist.length < 2) { svg.replaceChildren(); return; }
  // Rechtsbuendig: der neueste Wert steht immer am rechten Rand, der Graph
  // waechst beim Start von rechts nach links.
  const step = W / (HISTORY_LEN - 1);
  const x0 = W - (hist.length - 1) * step;
  const pts = hist.map((v, i) => {
    const y = H - 1 - (Math.min(Math.max(v, 0), 100) / 100) * (H - 3);
    return `${(x0 + i * step).toFixed(1)} ${y.toFixed(1)}`;
  });
  const line = 'M' + pts.join(' L');
  svg.innerHTML = `<path class="sl-area" d="${line} L${W} ${H} L${x0.toFixed(1)} ${H} Z"></path>`
    + `<path class="sl-line" d="${line}"></path>`;
}

function setRow(kind, pct, title) {
  const row = document.getElementById(`sysload-${kind}`);
  const val = document.getElementById(`sysload-${kind}-val`);
  if (!row || !val) return;
  if (pct == null) {
    val.textContent = 'n/a';
    row.dataset.state = 'na';
  } else {
    val.textContent = `${Math.round(pct)}%`;
    row.dataset.state = pct >= HIGH_PCT ? 'high' : 'ok';
    history[kind].push(pct);
    if (history[kind].length > HISTORY_LEN) history[kind].shift();
  }
  if (title) row.title = title;
  renderSpark(kind);
}

function pollSysLoad() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  fetch(SYS_LOAD_URL, { cache: 'no-store', signal: controller.signal })
    .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
    .then((d) => {
      // Die erste Antwort nach dem Start hat noch keinen Messwert.
      if (d.ts == null) return;
      setRow('cpu', d.cpu,
        `CPU load of this PC: ${d.cpu != null ? d.cpu.toFixed(1) + ' %' : 'n/a'}` +
        (d.cores ? ` · ${d.cores} threads` : '') + ' · last 60 s');
      const g = d.gpu;
      setRow('gpu', g ? g.util : null, g
        ? `${g.name}: ${g.util.toFixed(0)} % · VRAM ${(g.mem_used / 1024).toFixed(1)} / ${(g.mem_total / 1024).toFixed(1)} GB · ${g.temp.toFixed(0)} °C · last 60 s`
        : 'GPU load not available (nvidia-smi missing)');
    })
    .catch(() => {
      ['cpu', 'gpu'].forEach((k) => {
        const val = document.getElementById(`sysload-${k}-val`);
        const row = document.getElementById(`sysload-${k}`);
        if (val) val.textContent = '–';
        if (row) row.dataset.state = 'na';
      });
    })
    .finally(() => clearTimeout(timer));
}

function initSysLoad() {
  if (!document.getElementById('hud-tab-sysload')) return;
  pollSysLoad();
  visibleInterval(pollSysLoad, POLL_MS);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSysLoad);
else initSysLoad();
