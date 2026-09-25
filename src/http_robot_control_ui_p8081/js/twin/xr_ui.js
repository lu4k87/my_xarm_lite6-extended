// ── Gemeinsame Bausteine fuer die Flaechen in der Brille ───────────────────
//
// Handgelenk-Panel (xr.js) und HUD (xr_hud.js) zeichnen mit denselben
// Farben, Schriften und Buttons auf Canvas-Texturen. Eintraege spiegeln
// echte DOM-Buttons der Seite (domItem) - Zustand, Farbe und Klick kommen
// von dort, nichts wird doppelt implementiert.

export const COL = {
  bg: '#0b1120', panel: '#111827', btn: '#1a2335', btnHover: '#27344d',
  border: '#2c3a52', text: '#e2e8f0', mut: '#94a3b8', dim: '#64748b',
  cyan: '#38bdf8', green: '#10b981', orange: '#f59e0b', red: '#ef4444',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const FA_FONT = '"Font Awesome 6 Free"';

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
export function domItem(el, label) {
  if (!el) return null;
  const cs = getComputedStyle(el);
  const isCheck = el.tagName === 'INPUT' && el.type === 'checkbox';
  const active = isCheck ? el.checked : (el.classList.contains('active') || el.getAttribute('aria-pressed') === 'true');
  return {
    key: el.id || `${el.dataset.action || ''}:${el.dataset.args || ''}:${label || ''}`,
    glyph: isCheck ? glyphFor(el.checked ? 'fa-square-check' : 'fa-square') : glyphOfEl(el.querySelector('i')),
    label: label || shortLabel(el.getAttribute('title') || el.textContent),
    color: isCheck ? (el.checked ? COL.cyan : COL.mut) : cs.color,
    active,
    disabled: el.disabled || parseFloat(cs.opacity) < 0.5,
    onClick: () => el.click(),
  };
}

export function ownItem(key, fa, label, onClick, opts = {}) {
  return { key, glyph: glyphFor(fa), label, onClick, color: opts.color || COL.text, active: !!opts.active,
           disabled: !!opts.disabled, danger: !!opts.danger };
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
  ctx.fillStyle = color + '33';
  ctx.fill();
  ctx.strokeStyle = color;
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
// eine Zeile Text nebeneinander.
export function drawButton(ctx, r, item, hovered) {
  roundRect(ctx, r.x, r.y, r.w, r.h, 16);
  ctx.fillStyle = item.danger ? '#7f1d1d' : (hovered && !item.disabled ? COL.btnHover : COL.btn);
  ctx.fill();
  ctx.lineWidth = item.active ? 4 : 2;
  ctx.strokeStyle = item.active ? (item.color || COL.cyan) : (hovered ? COL.cyan : COL.border);
  ctx.stroke();
  ctx.globalAlpha = item.disabled ? 0.35 : 1;
  ctx.textBaseline = 'middle';
  if (r.h < 100) {
    drawFlatContent(ctx, r, item);
    ctx.globalAlpha = 1;
    return;
  }
  ctx.textAlign = 'center';
  if (item.glyph) {
    ctx.font = `900 46px ${FA_FONT}`;
    ctx.fillStyle = item.color || COL.text;
    ctx.fillText(item.glyph, r.x + r.w / 2, r.y + r.h * 0.333);
  }
  ctx.font = `600 22px ${FONT}`;
  ctx.fillStyle = COL.text;
  const lines = wrap2(ctx, item.label, r.w - 20);
  lines.forEach((ln, i) => ctx.fillText(ln, r.x + r.w / 2,
    r.y + (lines.length === 1 ? r.h * 0.742 : r.h * 0.667 + i * 26)));
  ctx.globalAlpha = 1;
}

function drawFlatContent(ctx, r, item) {
  const gap = item.glyph ? 14 : 0;
  ctx.font = `900 34px ${FA_FONT}`;
  const gw = item.glyph ? ctx.measureText(item.glyph).width : 0;
  ctx.font = `600 24px ${FONT}`;
  const label = fitText(ctx, item.label, r.w - 32 - gw - gap);
  const lw = ctx.measureText(label).width;
  const x0 = r.x + (r.w - (gw + gap + lw)) / 2;
  const cy = r.y + r.h / 2;
  ctx.textAlign = 'left';
  if (item.glyph) {
    ctx.font = `900 34px ${FA_FONT}`;
    ctx.fillStyle = item.color || COL.text;
    ctx.fillText(item.glyph, x0, cy);
  }
  ctx.font = `600 24px ${FONT}`;
  ctx.fillStyle = COL.text;
  ctx.fillText(label, x0 + gw + gap, cy);
}
