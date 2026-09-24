// ── UI Actions ──────────────────────────────────────────────────────────
// ── Log Output: Escaping + Syntax-Highlighting ──────────────────────────────
// Nur &, < und > maskieren. Das " bleibt stehen, damit die String-Erkennung
// unten greift - der Text landet ausschliesslich im Elementinhalt, nie in
// einem Attribut. Vorher ging der Text ungeprueft in innerHTML.
export const LOG_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;' };
export function escapeLogText(s) {
  return String(s).replace(/[&<>]/g, (c) => LOG_ESCAPES[c]);
}

// Ein einziger Durchlauf mit Alternation: was in der Reihenfolge frueher
// steht, gewinnt. So kann kein Treffer in einem bereits erzeugten <span>
// landen.
// "on"/"off" stehen bewusst NICHT in der Bool-Liste: "Publishing on /tf"
// waere sonst faelschlich eingefaerbt. Die Zahl verlangt links einen
// Nicht-Buchstaben, sonst wuerde aus "J5" ein eingefaerbtes "5".
export const LOG_TOKEN_RE = new RegExp([
  /(\b[a-z][a-z0-9+.-]*:\/\/[^\s,;)]+)/.source,                          // 1 URL
  /("[^"]*"|'[^']*')/.source,                                             // 2 String
  /((?<![\w)])\/[A-Za-z_][A-Za-z0-9_]*(?:\/[A-Za-z0-9_]+)*)/.source,      // 3 Topic/Pfad
  /\b([XYZ])(?=\s*[:=])/.source,                                          // 4 Achse
  /\b(true|false|enabled|disabled|active|inactive)\b/.source,             // 5 Bool
  /\b([a-z_][a-z0-9_]*)(?=:=)/.source,                                    // 6 Parametername
  /(?<=:=)([A-Za-z_][A-Za-z0-9_.-]*)/.source,                             // 7 Wert hinter :=
  /(?<![A-Za-z_])([-+]?\d+(?:[.,]\d+)?)\s*(mm|cm|m|deg|rad|°|%|Hz|ms|s)?(?![A-Za-z])/.source, // 8 Zahl (+9 Einheit)
].join('|'), 'gi');

export function highlightLog(raw) {
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

export const LOG_SRC_CLASSES = {
  'ROS': 'log-src-ros',
  'UI': 'log-src-ui',
  'System': 'log-src-sys',
  'Motion': 'log-src-motion',
  'GIZMO': 'log-src-gizmo',
  'VOICE': 'log-src-voice',
  'AUDIO': 'log-src-audio',
  'MoveIt': 'log-src-moveit',
  'SAFETY': 'log-src-safety',
};

export const LOG_MAX_ENTRIES = 500;

// ── Neueste Log-Zeile immer sichtbar ─────────────────────────────────────
// Die Section waechst nicht mit, also muss das Fenster am Ende kleben -
// auch nachdem sich seine Hoehe geaendert hat (Fenstergroesse, Layout,
// Aufklappen, spaet geladene Schrift). Frueher reichte eine solche Aenderung,
// damit es dauerhaft nicht mehr mitlief. Nur wer selbst hochscrollt, wird
// LOG_READ_HOLD_MS lang nicht zurueckgerissen.
export const LOG_READ_HOLD_MS = 15000;
let logUserScrolledAt = 0;
let logWinWired = null;

function logAtEnd(win) {
  return win.scrollHeight - win.scrollTop - win.clientHeight < 4;
}

function logUserIsReading() {
  return logUserScrolledAt > 0 && Date.now() - logUserScrolledAt < LOG_READ_HOLD_MS;
}

function scrollLogToEnd(win) {
  win.scrollTop = win.scrollHeight;
}

function wireLogWindow(win) {
  if (logWinWired === win) return;
  logWinWired = win;
  // Programmatisches Scrollen landet immer am Ende - steht die Ansicht
  // nicht am Ende, hat der Nutzer gescrollt.
  win.addEventListener('scroll', () => {
    logUserScrolledAt = logAtEnd(win) ? 0 : Date.now();
  }, { passive: true });
  if (window.ResizeObserver) {
    new ResizeObserver(() => {
      if (!logUserIsReading()) scrollLogToEnd(win);
    }).observe(win);
  }
}

export function logMsg(source, text, type='info') {
  const win = document.getElementById('log-window');
  if(!win) return;
  const d = new Date();
  const timeStr = d.toTimeString().split(' ')[0];
  let autoType = type;
  if (text.includes('✓')) autoType = 'success';
  else if (text.includes('❌')) autoType = 'err';
  else if (text.includes('➤')) autoType = 'action';
  else if (text.includes('⚠')) autoType = 'warn';

  const div = document.createElement('div');
  div.className = `log-entry log-entry-${autoType}`;

  const srcClass = LOG_SRC_CLASSES[source] || 'log-src-sys';

  // Der Zeitstempel steht nicht mehr in der Zeile - er haengt als data-time
  // am Quellen-Tag und wird per CSS beim Hover eingeblendet.
  const srcEl = document.createElement('span');
  srcEl.className = `log-src log-${autoType} ${srcClass}`;
  srcEl.dataset.time = timeStr;
  srcEl.textContent = `[${source}]`;
  const msgEl = document.createElement('span');
  msgEl.className = `log-${autoType}`;
  // highlightLog() escaped den Text zuerst und setzt danach nur eigene
  // <span class="log-..."> - das ist die einzige Stelle mit HTML-Aufbau.
  msgEl.innerHTML = highlightLog(text);
  div.append(srcEl, ' ', msgEl);
  wireLogWindow(win);
  win.appendChild(div);
  // Obergrenze: sonst waechst das DOM bei laengerem Betrieb endlos.
  while (win.childElementCount > LOG_MAX_ENTRIES) win.firstElementChild.remove();
  if (!logUserIsReading()) scrollLogToEnd(win);
}
