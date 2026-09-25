// ── Gemeinsame Bausteine fuer die Flaechen in der Brille ───────────────────
//
// Handgelenk-Panel (xr.js) und HUD (xr_hud.js) zeichnen mit denselben
// Farben, Schriften und Buttons auf Canvas-Texturen. Eintraege spiegeln
// echte DOM-Buttons der Seite (domItem) - Zustand, Farbe und Klick kommen
// von dort, nichts wird doppelt implementiert.

// Glas-Look: Flaechen, Buttons und Rahmen sind halbtransparent, die Szene
// scheint durch. Text und Icons bleiben deckend (Kontrast in der Brille).
export const COL = {
  bg: '#0b1120', panel: 'rgba(15, 23, 42, 0.55)', btn: 'rgba(30, 41, 59, 0.6)', btnHover: 'rgba(51, 65, 85, 0.8)',
  border: 'rgba(148, 163, 184, 0.24)', hover: 'rgba(255, 255, 255, 0.6)',
  text: '#f1f5f9', mut: '#a3b1c6', dim: '#8391a7',
  cyan: '#38bdf8', green: '#34d399', orange: '#fbbf24', red: '#f43f5e',
};

// Deckkraft der grossen Flaechen (oben -> unten verlaufend)
export const GLASS = { panel: [0.6, 0.7], card: [0.5, 0.62], hint: [0.66, 0.76] };

// Funktionsgruppen: zusammengehoerige Funktionen tragen in Handgelenk-Panel,
// HUD und Tastenhilfe dieselbe Farbe - Tab, Sektionskopf, Akzentleiste am
// Button und Tasten-Badge. So findet man z. B. alles zum Greifen (Greifer,
// Objekte, Trigger im SERVO) ueber die Farbe, egal auf welcher Flaeche.
export const GROUP = {
  robot:  { color: '#60a5fa', label: 'Robot' },     // Servo, Posen, Speed, Linearachse
  plan:   { color: '#a78bfa', label: 'Plan' },      // MoveIt, Ghost, TCP-Gizmo, PLAN-Modus
  grip:   { color: '#fbbf24', label: 'Grasp' },     // Greifer, Objekte, Greifkugeln
  scene:  { color: '#2dd4bf', label: 'Scene' },       // Einblendungen, Kollision, Sound
  xr:     { color: '#f472b6', label: 'VR' },          // Ansicht, Standort, HUD, Panel, Gehen
  safety: { color: '#f43f5e', label: 'Safety' },  // Not-Aus
  help:   { color: '#94a3b8', label: 'Help' },
};
export const groupColor = (g) => (g && GROUP[g] ? GROUP[g].color : COL.cyan);

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const FA_FONT = '"Font Awesome 6 Free"';

// Zeichenreihenfolge in der Brille (auch im VR-Spiegel). Die Szene zeichnet
// Markierungen ohne Tiefentest - Bahnlinie der Pfad-Vorschau, TCP-Achsen,
// Labels (bis 999) und das TCP-Gizmo (1500, digital_twin.js). Alles hier
// liegt darueber, sonst schienen sie durch HUD und Panel hindurch.
export const XR_ORDER = { hud: 2000, panel: 2100, controller: 2150, hints: 2160, reticle: 2200 };

const glyphCache = new Map();
export function glyphFor(faName) {
  if (glyphCache.has(faName)) return glyphCache.get(faName);
  const i = document.createElement('i');
  i.className = `fa-solid ${faName}`;
  i.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none';
  document.body.appendChild(i);
  const g = glyphOfEl(i);
  i.remove();
  glyphCache.set(faName, g);
  return g;
}

export function glyphOfEl(iEl) {
  if (!iEl) return '';
  const c = getComputedStyle(iEl, '::before').content || '';
  if (!c || c === 'none' || c === 'normal') return '';
  return c.replace(/^["']|["']$/g, '');
}

export function shortLabel(text) {
  let t = String(text || '').replace(/\s+/g, ' ').trim();
  t = t.split(/ \(| \[| - /)[0];
  return t.length > 30 ? t.slice(0, 29) + '…' : t;
}

// Ein Eintrag, der einen echten Button der Seite spiegelt.
// Gesperrt ist er nur, wenn er es am Desktop auch ist (disabled bzw. keine
// Pointer-Events waehrend einer Bewegung). Die gedimmte Darstellung der
// Anzeige-Schalter (Opazitaet 0,5 = AUS) ist KEINE Sperre - frueher galt
// alles unter 0,5 als gesperrt, dann liessen sich ausgeschaltete Schalter
// (Punktwolke, Sound, Pfad-Vorschau ...) in der Brille nicht mehr einschalten.
// opts.group: Funktionsgruppe (Farbe), opts.toggle: Schalter mit AN/AUS-Pille,
// opts.solid: aktiv voll in der Gruppenfarbe (SERVO/PLAN), opts.repeat: Wert
// laeuft bei gehaltenem Trigger weiter (+/-).
export function domItem(el, label, opts = {}) {
  if (!el) return null;
  const cs = getComputedStyle(el);
  const isCheck = el.tagName === 'INPUT' && el.type === 'checkbox';
  const active = isCheck ? el.checked : (el.classList.contains('active') || el.getAttribute('aria-pressed') === 'true');
  const item = {
    key: el.id || `${el.dataset.action || ''}:${el.dataset.args || ''}:${label || ''}`,
    glyph: isCheck ? glyphFor(el.checked ? 'fa-square-check' : 'fa-square') : glyphOfEl(el.querySelector('i')),
    label: label || shortLabel(el.getAttribute('title') || el.textContent),
    color: isCheck ? (el.checked ? COL.cyan : COL.mut) : cs.color,
    active,
    disabled: el.disabled || cs.pointerEvents === 'none',
    onClick: () => el.click(),
  };
  return withOpts(item, opts);
}

export function ownItem(key, fa, label, onClick, opts = {}) {
  return withOpts({ key, glyph: glyphFor(fa), label, onClick, color: opts.color || COL.text, active: !!opts.active,
                    disabled: !!opts.disabled, danger: !!opts.danger }, opts);
}

// Gruppe/Schalter-Zustand anhaengen. state: eigener Pillen-Text (z. B.
// 'INAKTIV'), sonst bei toggle AN/AUS aus active.
function withOpts(item, opts) {
  if (opts.group) item.group = opts.group;
  if (opts.toggle) {
    item.toggle = true;
    if (opts.on !== undefined) item.active = !!opts.on;
    item.state = opts.state || (item.active ? 'ON' : 'OFF');
  }
  if (opts.warn) item.warn = true;
  if (opts.solid) item.solid = true;
  if (opts.repeat) item.repeat = true;
  if (opts.group && opts.color) item.iconColor = opts.color;   // z. B. Ausfuehren gruen
  return item;
}

// Kurze deutsche Namen fuer gespiegelte Buttons (Panel und HUD gleich).
export const GRIPPER_LABELS = { 'btn-grip-open': 'Open', 'btn-grip-close': 'Close', 'btn-grip-off': 'Gripper off' };
const POSE_LABELS = { 'btn-show-scene': 'Scan position', 'btn-scan-objects': 'Scan OctoMap' };
export function poseLabel(btn) {
  if (POSE_LABELS[btn.id]) return POSE_LABELS[btn.id];
  return (btn.getAttribute('title') || '').toLowerCase().includes('initial') ? 'Home pose' : undefined;
}

export const q = (sel) => document.querySelector(sel);
export const qa = (sel) => Array.from(document.querySelectorAll(sel));
export const txt = (sel) => { const el = q(sel); return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; };

export function stepSpeed(delta) {
  const s = /** @type {HTMLInputElement|null} */ (q('#speed-slider'));
  if (!s) return;
  const v = Math.max(Number(s.min), Math.min(Number(s.max), Number(s.value) + delta));
  if (String(v) === s.value) return;
  s.value = String(v);
  s.dispatchEvent(new Event('input', { bubbles: true }));
}

// ── MoveIt-Popup (#moveit-popup) fuer HUD und Handgelenk-Panel ─────────────

// Execute/Discard wie am Desktop (style.css .mp-actions): nur bei offenem
// Popup in der Phase "confirm" und nicht, solange Auto-Move ohne Rueckfrage
// laeuft. Sonst wuerde Execute das Gizmo-Ziel ohne Rueckfrage anfahren
// (confirmMoveToPreview in motion.js).
export function moveitActionsVisible() {
  const mp = q('#moveit-popup');
  return !!mp && !mp.classList.contains('mp-hidden') && mp.classList.contains('mp-phase-confirm')
    && !(mp.dataset.automove === '1' && mp.dataset.awaiting !== '1');
}

// Gizmo-Ziel mit Abstand; in der Warnfarbe des Desktops, wenn das Ziel in
// der Tischebene oder im unerreichbaren Bereich liegt.
export function moveitTargetLine() {
  const coords = q('#gizmo-hud-coords');
  const alert = !!coords && coords.classList.contains('coords-alert');
  return {
    label: 'TARGET',
    value: `X ${txt('#gizmo-hud-x')}  Y ${txt('#gizmo-hud-y')}  Z ${txt('#gizmo-hud-z')} mm   ${txt('#gizmo-hud-delta')}`,
    color: alert ? getComputedStyle(coords).color : undefined,
  };
}

const MP_STEP_STATES = ['done', 'active', 'waiting', 'failed'];
const MP_RUN_PERIOD_MS = 1100;          // wie @keyframes mp-indeterminate

// Schritte IK / PLAN / EXECUTE und Balken, so wie renderMoveitPopup
// (motion.js) sie gerade gesetzt hat. Beim Bestaetigen zeigt der Balken den
// Countdown bis zum automatischen Verwerfen, sonst den Fortschritt.
export function moveitProgressLines() {
  const fill = q('#mp-bar-fill');
  const bar = fill ? fill.parentElement : null;
  if (!bar) return [];
  const accent = getComputedStyle(fill).backgroundColor || COL.cyan;
  const steps = qa('#moveit-popup .mp-step').map((el) => {
    const part = (sel) => { const n = el.querySelector(sel); return n ? n.textContent.trim() : ''; };
    return {
      label: part('.mp-step-label'),
      time: part('.mp-step-time'),
      state: MP_STEP_STATES.find(s => el.classList.contains(`mp-step-${s}`)) || '',
    };
  });
  const running = bar.classList.contains('mp-bar-indeterminate');
  const left = bar.dataset.left;
  const pct = parseFloat(fill.style.width) || 0;
  const lines = [];
  if (steps.length) lines.push({ label: 'STEPS', steps, accent });
  lines.push({
    label: left !== undefined ? 'DISCARDS' : 'PROGRESS',
    value: left !== undefined ? `in ${left} s` : (running ? 'running' : `${Math.round(pct)} %`),
    // run: Position des laufenden Streifens (0..1), in 5-%-Schritten - so
    // zeichnet der HUD nur neu, wenn sich der Streifen sichtbar bewegt.
    bar: { pct, color: accent, run: running ? Math.round((performance.now() / MP_RUN_PERIOD_MS) % 1 * 20) / 20 : null },
  });
  return lines;
}

// Farbe (#rrggbb oder rgb(...) aus getComputedStyle) mit Deckkraft a.
export function rgba(color, a) {
  const c = String(color || '');
  let v;
  if (c[0] === '#' && c.length === 7) {
    const n = parseInt(c.slice(1), 16);
    v = [n >> 16 & 255, n >> 8 & 255, n & 255];
  } else {
    v = (c.match(/[\d.]+/g) || [148, 163, 184]).slice(0, 3);
  }
  return `rgba(${v[0]}, ${v[1]}, ${v[2]}, ${a})`;
}

export function vGrad(ctx, y, hgt, top, bottom) {
  const g = ctx.createLinearGradient(0, y, 0, y + hgt);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  return g;
}

// Glasflaeche: dunkler Verlauf (Deckkraft a[0] oben, a[1] unten), optional in
// einer Gruppenfarbe getoent, Rand in border bzw. als helle Lichtkante oben.
export function glass(ctx, x, y, w, hgt, r, { a = GLASS.card, tint = null, tintA = [0.14, 0.04], border = null, lw = 2 } = {}) {
  roundRect(ctx, x, y, w, hgt, r);
  ctx.fillStyle = vGrad(ctx, y, hgt, `rgba(15, 23, 42, ${a[0]})`, `rgba(8, 12, 24, ${a[1]})`);
  ctx.fill();
  if (tint) {
    ctx.fillStyle = vGrad(ctx, y, hgt, rgba(tint, tintA[0]), rgba(tint, tintA[1]));
    ctx.fill();
  }
  ctx.lineWidth = lw;
  ctx.strokeStyle = border || vGrad(ctx, y, hgt, 'rgba(255, 255, 255, 0.22)', 'rgba(148, 163, 184, 0.1)');
  ctx.stroke();
}

// Not-Aus-Flaeche: bleibt deckend (Sicherheit vor Optik), roter Verlauf mit
// heller Kante - auf allen Flaechen gleich.
export function estopFill(ctx, r, radius, hovered) {
  roundRect(ctx, r.x, r.y, r.w, r.h, radius);
  ctx.fillStyle = hovered ? vGrad(ctx, r.y, r.h, '#f87171', '#dc2626') : vGrad(ctx, r.y, r.h, '#ef4444', '#b91c1c');
  ctx.fill();
  ctx.strokeStyle = hovered ? '#ffffff' : '#fecaca';
  ctx.lineWidth = 4;
  ctx.stroke();
}

export function roundRect(ctx, x, y, w, hgt, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + hgt, r);
  ctx.arcTo(x + w, y + hgt, x, y + hgt, r);
  ctx.arcTo(x, y + hgt, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function fitText(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

// Zwei Zeilen, an Leerzeichen umbrochen, Rest mit Auslassungszeichen.
export function wrap2(ctx, text, maxW) {
  const words = String(text).split(' ');
  let l1 = '';
  let i = 0;
  for (; i < words.length; i++) {
    const t = l1 ? `${l1} ${words[i]}` : words[i];
    if (ctx.measureText(t).width > maxW && l1) break;
    l1 = t;
  }
  const rest = words.slice(i).join(' ');
  return rest ? [fitText(ctx, l1, maxW), fitText(ctx, rest, maxW)] : [fitText(ctx, l1, maxW)];
}

export function pill(ctx, xRight, y, text, color) {
  ctx.font = `700 24px ${FONT}`;
  const w = ctx.measureText(text).width + 28;
  const x = xRight - w;
  roundRect(ctx, x, y, w, 44, 22);
  ctx.fillStyle = rgba(color, 0.2);
  ctx.fill();
  ctx.strokeStyle = rgba(color, 0.75);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + 23);
  return x - 12;   // naechste Pille links davon, mit Abstand
}

// Icon oben, Beschriftung (max. zwei Zeilen) darunter. Die Positionen skalieren
// mit der Button-Hoehe (Referenz 132 px), damit auch flachere Buttons (HUD-
// Toolbar) sauber in ihrem Rahmen bleiben. Unter 100 px Hoehe stehen Icon und
// eine Zeile Text nebeneinander, ein Schalter zeigt rechts AN/AUS.
// item.group: Akzentleiste links und Icon in der Farbe der Funktionsgruppe;
// aktiv = Rahmen + leichte Toenung in dieser Farbe. Ein ausgeschalteter
// Schalter zeigt sein Icon grau - der Zustand steht in der Pille.
// item.solid (SERVO/PLAN): aktiv voll in der Gruppenfarbe mit dunkler Schrift,
// inaktiv grau - so unterscheidet man die Modi auf einen Blick.
export function drawButton(ctx, r, item, hovered) {
  const accent = item.group ? groupColor(item.group) : (item.color || COL.cyan);
  const on = item.active && !item.disabled;
  const solid = item.solid && on, solidOff = item.solid && !on;
  const hov = hovered && !item.disabled;
  roundRect(ctx, r.x, r.y, r.w, r.h, 16);
  if (solid) {
    ctx.fillStyle = vGrad(ctx, r.y, r.h, rgba(accent, 1), rgba(accent, 0.8));
  } else if (item.danger) {
    ctx.fillStyle = vGrad(ctx, r.y, r.h, 'rgba(220, 38, 38, 0.85)', 'rgba(127, 29, 29, 0.85)');
  } else {
    ctx.fillStyle = hov ? COL.btnHover : vGrad(ctx, r.y, r.h, 'rgba(51, 65, 85, 0.55)', 'rgba(30, 41, 59, 0.5)');
  }
  ctx.fill();
  if ((on || hov) && !solid && !item.danger) {
    // aktiv: Verlauf in der Gruppenfarbe, Hover: nur ein Hauch davon
    ctx.fillStyle = vGrad(ctx, r.y, r.h, rgba(accent, on ? 0.3 : 0.12), rgba(accent, on ? 0.1 : 0.04));
    ctx.fill();
  }
  if (item.group && !item.danger && !solid) {
    // Akzentleiste als abgerundeter Streifen links, mit Abstand zum Rahmen
    ctx.save();
    ctx.globalAlpha = item.disabled || solidOff ? 0.35 : (on || !item.toggle ? 1 : 0.55);
    roundRect(ctx, r.x + 6, r.y + 12, 5, r.h - 24, 2.5);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.restore();
  }
  roundRect(ctx, r.x, r.y, r.w, r.h, 16);
  ctx.lineWidth = on ? 3 : 2;
  ctx.strokeStyle = solid ? (hovered ? '#ffffff' : 'rgba(255, 255, 255, 0.35)')
    : on ? accent
    : hov ? (item.group ? rgba(accent, 0.85) : COL.hover)
    : vGrad(ctx, r.y, r.h, 'rgba(255, 255, 255, 0.16)', 'rgba(148, 163, 184, 0.12)');
  ctx.stroke();
  const iconColor = solid ? COL.bg : item.group
    ? ((item.toggle || solidOff) && !item.active ? COL.mut : (item.iconColor || accent))
    : (item.color || COL.text);
  const textColor = solid ? COL.bg : (solidOff ? COL.mut : COL.text);
  ctx.globalAlpha = item.disabled ? 0.35 : 1;
  ctx.textBaseline = 'middle';
  if (r.h < 100) {
    drawFlatContent(ctx, r, item, iconColor, textColor);
    ctx.globalAlpha = 1;
    return;
  }
  ctx.textAlign = 'center';
  if (item.glyph) {
    ctx.font = `900 46px ${FA_FONT}`;
    ctx.fillStyle = iconColor;
    ctx.fillText(item.glyph, r.x + r.w / 2, r.y + r.h * 0.333);
  }
  ctx.font = `${solid ? 800 : 600} 22px ${FONT}`;
  ctx.fillStyle = textColor;
  const lines = wrap2(ctx, item.label, r.w - 20);
  lines.forEach((ln, i) => ctx.fillText(ln, r.x + r.w / 2,
    r.y + (lines.length === 1 ? r.h * 0.742 : r.h * 0.667 + i * 26)));
  if (item.state) statePill(ctx, r.x + r.w - 10, r.y + 10, item, accent, 32);
  ctx.globalAlpha = 1;
}

// Kleine Zustands-Pille (AN/AUS/INAKTIV) rechtsbuendig an xRight.
function statePill(ctx, xRight, y, item, accent, hgt) {
  ctx.font = `800 ${Math.round(hgt * 0.56)}px ${FONT}`;
  const w = ctx.measureText(item.state).width + hgt * 0.7;
  const x = xRight - w;
  const c = item.warn ? COL.red : (item.active ? accent : COL.dim);
  roundRect(ctx, x, y, w, hgt, hgt / 2);
  ctx.fillStyle = item.active ? c : 'rgba(255, 255, 255, 0.05)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = item.active ? c : rgba(c, 0.6);
  ctx.stroke();
  ctx.fillStyle = item.active ? '#0b1120' : c;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(item.state, x + w / 2, y + hgt / 2 + 1);
  return w;
}

function drawFlatContent(ctx, r, item, iconColor, textColor = COL.text) {
  const inset = item.group ? 18 : 16;
  const pillW = item.state ? (ctx.font = `800 20px ${FONT}`, ctx.measureText(item.state).width + 25 + 12) : 0;
  const gap = item.glyph ? 14 : 0;
  ctx.font = `900 34px ${FA_FONT}`;
  const gw = item.glyph ? ctx.measureText(item.glyph).width : 0;
  ctx.font = `600 24px ${FONT}`;
  const label = fitText(ctx, item.label, r.w - 2 * inset - gw - gap - pillW);
  const lw = ctx.measureText(label).width;
  // Mit Pille: Icon + Text linksbuendig, Pille rechts. Sonst mittig.
  const x0 = item.state ? r.x + inset + 4 : r.x + (r.w - (gw + gap + lw)) / 2;
  const cy = r.y + r.h / 2;
  ctx.textAlign = 'left';
  if (item.glyph) {
    ctx.font = `900 34px ${FA_FONT}`;
    ctx.fillStyle = iconColor;
    ctx.fillText(item.glyph, x0, cy);
  }
  ctx.font = `600 24px ${FONT}`;
  ctx.fillStyle = textColor;
  ctx.fillText(label, x0 + gw + gap, cy);
  if (item.state) {
    const accent = item.group ? groupColor(item.group) : (item.color || COL.cyan);
    statePill(ctx, r.x + r.w - inset + 4, cy - 18, item, accent, 36);
  }
}

// ── Infozeilen (HUD-Karten und Handgelenk-Panel) ───────────────────────────
// Label links in einer Spalte der Breite labelW, rechts davon Text, ein
// Balken (line.bar) oder die MoveIt-Schritte (line.steps). Alles bleibt
// innerhalb von x..x+w und der Zeilenhoehe h.
const BAR_VALUE_W = 100, BAR_GAP = 12, STEP_GAP = 12;

export function drawInfoLine(ctx, line, x, y, w, h, labelW) {
  const cy = y + h / 2;
  const vx = x + labelW, right = x + w - 8;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `700 20px ${FONT}`;
  ctx.fillStyle = COL.dim;
  ctx.fillText(fitText(ctx, line.label, labelW - 16), x + 8, cy);
  if (line.steps) {
    drawSteps(ctx, line.steps, vx, y + 4, right - vx, h - 8, line.accent || COL.cyan);
  } else if (line.bar) {
    drawBar(ctx, line, vx, cy, right);
  } else {
    ctx.font = `500 24px ${FONT}`;
    ctx.fillStyle = line.color || COL.text;
    ctx.fillText(fitText(ctx, line.value || '–', right - vx), vx, cy);
  }
}

function drawBar(ctx, line, vx, cy, right) {
  const b = line.bar;
  const bw = right - BAR_VALUE_W - BAR_GAP - vx;
  roundRect(ctx, vx, cy - 8, bw, 16, 8);
  ctx.fillStyle = 'rgba(148, 163, 184, 0.18)';
  ctx.fill();
  let x0 = vx;
  let fw = bw * Math.max(0, Math.min(100, b.pct)) / 100;
  if (b.run !== null && b.run !== undefined) {
    // Dauer unbekannt (IK, Planung): laufender Streifen wie .mp-bar-indeterminate
    const seg = bw * 0.35;
    const s0 = vx - seg + b.run * (bw + seg);
    x0 = Math.max(vx, s0);
    fw = Math.min(vx + bw, s0 + seg) - x0;
  }
  if (fw > 1) {
    const fwDraw = Math.min(Math.max(16, fw), vx + bw - x0);
    roundRect(ctx, x0, cy - 8, fwDraw, 16, Math.min(8, fwDraw / 2));
    ctx.fillStyle = b.color || COL.green;
    ctx.fill();
  }
  ctx.textAlign = 'right';
  ctx.font = `600 24px ${FONT}`;
  ctx.fillStyle = COL.text;
  ctx.fillText(fitText(ctx, line.value || '–', BAR_VALUE_W), right, cy);
}

// Drei Chips nebeneinander wie .mp-step am Desktop: Punkt (erledigt gruen,
// aktiv/wartend Akzent, gescheitert rot), Name, Zeit rechtsbuendig.
function drawSteps(ctx, steps, x, y, w, h, accent) {
  const cw = (w - (steps.length - 1) * STEP_GAP) / steps.length;
  const cy = y + h / 2;
  steps.forEach((st, i) => {
    const cx = x + i * (cw + STEP_GAP);
    const hot = st.state === 'active' || st.state === 'waiting';
    roundRect(ctx, cx, y, cw, h, 10);
    if (hot) {
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = accent;
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    }
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.setLineDash(st.state === 'waiting' ? [8, 6] : []);
    ctx.strokeStyle = st.state === 'failed' ? 'rgba(239, 68, 68, 0.6)' : (hot ? accent : 'rgba(255, 255, 255, 0.14)');
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(cx + 20, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = st.state === 'done' ? COL.green : st.state === 'failed' ? COL.red : (hot ? accent : 'rgba(255, 255, 255, 0.18)');
    ctx.fill();

    const lx = cx + 36, rx = cx + cw - 12;
    ctx.textAlign = 'left';
    ctx.font = `700 20px ${FONT}`;
    ctx.fillStyle = st.state === 'failed' ? '#fecaca' : (hot ? COL.text : '#cbd5e1');
    const label = fitText(ctx, st.label, Math.max(0, rx - lx));
    ctx.fillText(label, lx, cy);
    const room = rx - (lx + ctx.measureText(label).width + 10);
    ctx.textAlign = 'right';
    ctx.font = `500 20px ${FONT}`;
    ctx.fillStyle = COL.mut;
    const time = room > 0 ? fitText(ctx, st.time, room) : '';
    if (time && time !== '…') ctx.fillText(time, rx, cy);
  });
}
