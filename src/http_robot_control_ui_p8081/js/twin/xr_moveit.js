// ── MoveIt-Popup in der Brille (HUD-Flaeche "moveit") ───────────────────────
//
// Zeichnet #moveit-popup so, wie es am Desktop aussieht (style.css,
// .moveit-popup / .mp-*): Kopfzeile mit Phase, TARGET und Timer, Zielzeile
// mit X/Y/Z in Achsenfarben, Delta, Ghost-, Distanzlinien- und Auto-Move-
// Schalter, die Schritte IK / PLAN / EXECUTE, Balken, Hinweistext und die
// Buttons Execute / Discard. Alle Masse sind die Desktop-Pixel, skaliert auf
// die Breite der Flaeche (740 px Desktop-Breite).
//
// Zustand, Farben und Klicks kommen aus dem DOM - dieselben Elemente wie am
// Desktop, nichts wird doppelt implementiert. Pulsieren (Bestaetigen, Fahrt,
// aktiver Schritt) und der laufende Balken werden beim Neuzeichnen aus der
// Uhrzeit berechnet; model.anim sorgt dafuer, dass der HUD dafuer neu zeichnet.

import { FA_FONT, glyphFor, glyphOfEl, moveitActionsVisible, q, qa, txt, fitText, roundRect, rgba } from './xr_ui.js';

const MONO = '"JetBrains Mono", monospace';
const DESKTOP_W = 740;                // .moveit-popup { width: 740px }
const EDGE = 26;                      // Platz fuer den Glow um das Popup [Canvas-px]
const STEP_STATES = ['done', 'active', 'waiting', 'failed'];

// Farben wie im Stylesheet
const C = {
  txt: '#f8fafc', stepTxt: '#aab4c3', done: '#cbd5e1', failed: '#fecaca',
  cyan: '#38bdf8', green: '#10b981', red: '#ef4444', dim: '#1e293b', mut: '#94a3b8',
  axX: '#ef4444', axY: '#10b981', axZ: '#38bdf8', exec: '#22d3ee',
};

// Canvas-Schriften brauchen die geladene Webfont, sonst faellt die erste
// Zeichnung auf die Ersatzschrift zurueck.
if (document.fonts && document.fonts.load) {
  ['700 16px "JetBrains Mono"', '800 16px "JetBrains Mono"'].forEach(f => document.fonts.load(f).catch(() => {}));
}

// ── Zustand aus dem DOM ─────────────────────────────────────────────────────
export function moveitPopupModel(banner) {
  const mp = q('#moveit-popup');
  if (!mp || mp.classList.contains('mp-hidden')) return null;
  const cs = getComputedStyle(mp);
  const accent = cs.getPropertyValue('--mp-accent').trim() || '#f59e0b';
  const phaseCls = (Array.from(mp.classList).find(c => c.startsWith('mp-phase-')) || '').slice(9);
  const active = mp.classList.contains('mp-active');

  const coords = q('#gizmo-hud-coords');
  const alert = !!coords && coords.classList.contains('coords-alert');
  const ghostEl = q('#mp-btn-path-preview');
  const distEl = q('#mp-btn-distance-line');
  const autoEl = /** @type {HTMLInputElement|null} */ (q('#chk-gizmo-auto-drop'));
  const autoLabel = autoEl ? autoEl.closest('.gizmo-auto-toggle') : null;
  const autoShown = !!autoLabel && getComputedStyle(autoLabel).display !== 'none';

  const fill = q('#mp-bar-fill');
  const bar = fill ? fill.parentElement : null;
  const running = !!bar && bar.classList.contains('mp-bar-indeterminate');
  const detailEl = q('#mp-detail');
  const execEl = q('#moveit-popup .mp-btn-exec');
  const pulsing = active || phaseCls === 'confirm';

  return {
    moveitPopup: true,
    banner,
    accent, phase: phaseCls, active,
    phaseText: txt('#mp-phase'),
    timer: txt('#mp-timer'),
    obj: q('#mp-object-badge') && q('#mp-object-badge').style.display !== 'none' ? txt('#mp-object-name') : '',
    target: {
      x: txt('#gizmo-hud-x'), y: txt('#gizmo-hud-y'), z: txt('#gizmo-hud-z'),
      delta: txt('#gizmo-hud-delta'),
      alertColor: alert ? getComputedStyle(coords).color : '',
    },
    ghost: ghostEl ? (ghostEl.classList.contains('unavailable') ? 'unavailable' : ghostEl.classList.contains('active') ? 'active' : 'off') : null,
    dist: distEl ? distEl.classList.contains('active') : null,
    auto: autoShown ? autoEl.checked : null,
    steps: qa('#moveit-popup .mp-step').map((el) => {
      const part = (sel) => { const n = el.querySelector(sel); return n ? n.textContent.trim() : ''; };
      return {
        label: part('.mp-step-label'), time: part('.mp-step-time'),
        state: STEP_STATES.find(s => el.classList.contains(`mp-step-${s}`)) || '',
      };
    }),
    bar: { pct: fill ? parseFloat(fill.style.width) || 0 : 0, running },
    detail: detailEl ? detailEl.textContent.replace(/\s+/g, ' ').trim() : '',
    detailColor: detailEl ? getComputedStyle(detailEl).color : C.done,
    actions: moveitActionsVisible(),
    execGlyph: execEl ? glyphOfEl(execEl.querySelector('i')) : '',
    // 10 Hz Takt, solange etwas pulsiert oder laeuft - loest das Neuzeichnen aus.
    anim: pulsing || running ? Math.floor(performance.now() / 100) : 0,
    // Elemente fuer die Klicks (gehen nicht in die Signatur des HUD ein).
    els: { close: q('#moveit-popup .mp-close'), ghost: ghostEl, dist: distEl, auto: autoEl, exec: execEl,
           discard: q('#moveit-popup .mp-btn-discard') },
  };
}

// ── Zeichnen ────────────────────────────────────────────────────────────────
// 0..1..0 im Takt von CSS "animation: ... infinite alternate" (halbe Periode).
const pulse = (halfMs) => {
  const t = (performance.now() % (2 * halfMs)) / halfMs;
  return t <= 1 ? t : 2 - t;
};
const mono = (weight, px) => `${weight} ${px}px ${MONO}`;
const fa = (px) => `900 ${px}px ${FA_FONT}`;
const lerp = (a, b, t) => a + (b - a) * t;

function spacing(ctx, px) {
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px`;
}

function textW(ctx, font, text, ls = 0) {
  ctx.font = font;
  spacing(ctx, ls);
  const w = ctx.measureText(text).width;
  spacing(ctx, 0);
  return w;
}

// Badge mit Rand (Phase, Objekt, Delta): gibt die Breite zurueck.
function badge(ctx, x, cy, text, { font, color, bg, border, padX, h, r, ls = 0, glyph = '', glyphPx = 0, gap = 0 }) {
  const gw = glyph ? textW(ctx, fa(glyphPx), glyph) + gap : 0;
  const tw = textW(ctx, font, text, ls);
  const w = padX * 2 + gw + tw;
  roundRect(ctx, x, cy - h / 2, w, h, r);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = Math.max(1, h / 22);
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.fillStyle = color;
  if (glyph) {
    ctx.font = fa(glyphPx);
    ctx.fillText(glyph, x + padX, cy);
  }
  ctx.font = font;
  spacing(ctx, ls);
  ctx.fillText(text, x + padX + gw, cy + 1);
  spacing(ctx, 0);
  return w;
}

// Hoehe des Popups in Desktop-Pixeln (ohne Banner).
function naturalHeight(m, detailLines) {
  let h = 16 + 30;                                  // Rand oben + Kopfzeile
  h += 12 + 50;                                     // Zielzeile
  if (m.steps.length) h += 12 + 34;                 // Schritte
  h += 12 + 6;                                      // Balken
  if (m.detail) h += 12 + detailLines * 23.2;       // 16 px * 1.45
  if (m.actions) h += 12 + 42;                      // Execute / Discard
  return h + 16;
}

// Zeichnet das Popup in die Flaeche s (anchor unten, waechst nach oben).
// addHit(rect, key, onClick, extra) traegt Klickflaechen ein.
export function drawMoveitPopup(s, m, hov, addHit) {
  const ctx = s.ctx;
  const key = (k) => `hud:${s.id}:${k}`;
  const isHov = (k) => hov === key(k);

  // Massstab: Desktop-Breite auf die Flaeche. Passt die Hoehe nicht, kleiner.
  let k = (s.cw - 2 * EDGE) / DESKTOP_W;
  ctx.font = mono(400, 16 * k);
  let lines = wrapLines(ctx, m.detail, (DESKTOP_W - 36) * k, 3);
  const bannerH = m.banner ? 40 : 0;
  const needH = (naturalHeight(m, lines.length) + (bannerH ? bannerH + 10 : 0)) * k + 2 * EDGE;
  if (needH > s.ch) {
    k *= s.ch / needH;
    ctx.font = mono(400, 16 * k);
    lines = wrapLines(ctx, m.detail, (DESKTOP_W - 36) * k, 3);
  }
  const W = DESKTOP_W * k;
  const H = naturalHeight(m, lines.length) * k;
  const x0 = (s.cw - W) / 2;
  const y0 = s.ch - EDGE - H;
  const px = (v) => v * k;
  ctx.textBaseline = 'middle';

  // Warnbanner (Kollision/Singularitaet) direkt ueber dem Popup
  let top = y0;
  if (m.banner) {
    const bh = px(bannerH), by = y0 - px(10) - bh;
    roundRect(ctx, x0, by, W, bh, px(8));
    ctx.fillStyle = rgba(m.banner.color, 0.22);
    ctx.fill();
    ctx.strokeStyle = rgba(m.banner.color, 0.85);
    ctx.lineWidth = px(1.5);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = mono(700, px(15));
    ctx.fillStyle = m.banner.color;
    ctx.fillText(fitText(ctx, m.banner.text, W - px(24)), x0 + W / 2, by + bh / 2);
    top = by;
  }

  // Rahmen + Glow: Bestaetigen pulsiert kraeftig, Fahrt ruhiger (mp-glow-*)
  const acc = m.accent;
  let glow = 20, glowA = 0.22, borderA = 0.75, ring = 0;
  if (m.phase === 'confirm') {
    const t = pulse(800);
    glow = lerp(10, 34, t); glowA = lerp(0.3, 0.85, t); borderA = lerp(0.55, 1, t); ring = t;
  } else if (m.phase === 'executing') {
    const t = pulse(1200);
    glow = lerp(8, 26, t); glowA = lerp(0.25, 0.7, t); borderA = lerp(0.5, 1, t);
  }
  ctx.save();
  roundRect(ctx, x0, y0, W, H, px(12));
  ctx.shadowColor = rgba(acc, glowA);
  ctx.shadowBlur = px(glow);
  // Desktop: 40 % Deckkraft + 14 px Blur. Ohne Blur in der Brille deckender,
  // damit der Text vor der Szene lesbar bleibt.
  ctx.fillStyle = 'rgba(10, 14, 23, 0.78)';
  ctx.fill();
  ctx.restore();
  if (ring > 0) {
    roundRect(ctx, x0 - px(2), y0 - px(2), W + px(4), H + px(4), px(14));
    ctx.strokeStyle = rgba(acc, 0.45 * ring);
    ctx.lineWidth = px(2);
    ctx.stroke();
  }
  roundRect(ctx, x0, y0, W, H, px(12));
  ctx.strokeStyle = rgba(acc, borderA);
  ctx.lineWidth = px(1.5);
  ctx.stroke();
  s.drawn = { x: x0 - EDGE / 2, y: top - EDGE / 2, w: W + EDGE, h: y0 + H - top + EDGE };

  const L = x0 + px(18), R = x0 + W - px(18);
  let y = y0 + px(16);

  // ── Kopfzeile ──
  let cy = y + px(15);
  let x = L;
  ctx.textAlign = 'left';
  ctx.globalAlpha = m.active ? lerp(0.45, 1, pulse(1000)) : 1;
  ctx.font = fa(px(18));
  ctx.fillStyle = acc;
  ctx.fillText(glyphFor('fa-route'), x, cy);
  x += textW(ctx, fa(px(18)), glyphFor('fa-route')) + px(10);
  ctx.globalAlpha = 1;
  ctx.font = mono(800, px(14));
  ctx.fillStyle = C.txt;
  spacing(ctx, px(1));
  ctx.fillText('MOVEIT', x, cy + 1);
  x += ctx.measureText('MOVEIT').width + px(10);
  spacing(ctx, 0);

  // rechts: Schliessen, davor der Timer
  const cr = { x: R - px(28), y: cy - px(14), w: px(28), h: px(28) };
  if (isHov('close')) {
    roundRect(ctx, cr.x, cr.y, cr.w, cr.h, px(6));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
  }
  ctx.textAlign = 'center';
  ctx.font = fa(px(15));
  ctx.fillStyle = C.txt;
  ctx.fillText(glyphFor('fa-xmark'), cr.x + cr.w / 2, cy);
  if (m.els.close) addHit(cr, 'close', () => m.els.close.click());
  ctx.textAlign = 'right';
  ctx.font = mono(700, px(18));
  ctx.fillText(m.timer, cr.x - px(8), cy + 1);
  const leftLimit = cr.x - px(8) - ctx.measureText(m.timer).width - px(10);

  // Phase, "TARGET:", Objekt - so viel, wie bis zum Timer passt
  ctx.font = mono(700, px(13));
  const phaseText = fitText(ctx, m.phaseText, Math.max(px(40), leftLimit - x - px(22)));
  const phaseW = badge(ctx, x, cy, phaseText, {
    font: mono(700, px(13)), color: acc, bg: rgba(acc, 0.22), border: rgba(acc, 0.45),
    padX: px(11), h: px(22), r: px(10), ls: px(0.6),
  });
  x += phaseW + px(10);
  const tgtGlyph = glyphFor('fa-crosshairs');
  const tgtGlyphW = textW(ctx, fa(px(13.5)), tgtGlyph);
  const tgtW = tgtGlyphW + px(5) + textW(ctx, mono(800, px(13.5)), 'TARGET:', px(0.6));
  if (x + tgtW <= leftLimit) {
    ctx.textAlign = 'left';
    ctx.fillStyle = C.cyan;
    ctx.font = fa(px(13.5));
    ctx.fillText(tgtGlyph, x, cy);
    ctx.font = mono(800, px(13.5));
    spacing(ctx, px(0.6));
    ctx.fillText('TARGET:', x + tgtGlyphW + px(5), cy + 1);
    spacing(ctx, 0);
    x += tgtW + px(6);
    if (m.obj) {
      ctx.font = mono(700, px(13));
      const room = leftLimit - x - px(22) - px(18);
      const name = fitText(ctx, m.obj.toUpperCase(), room);
      if (room > px(30) && name) {
        badge(ctx, x, cy, name, {
          font: mono(700, px(13)), color: C.cyan, bg: 'rgba(56, 189, 248, 0.16)', border: 'rgba(56, 189, 248, 0.45)',
          padX: px(11), h: px(22), r: px(10), ls: px(0.6), glyph: glyphFor('fa-cube'), glyphPx: px(12), gap: px(6),
        });
      }
    }
  }
  // Kopfzeile zum Verschieben (nach dem Schliessen-Button - der hat Vorrang)
  addHit({ x: x0, y: y0, w: W, h: px(16 + 30) }, 'head', null, { drag: true });
  y += px(30);

  // ── Zielzeile ──
  y += px(12);
  const rowH = px(50);
  roundRect(ctx, x0 + px(18), y, W - px(36), rowH, px(7));
  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = px(1);
  ctx.stroke();
  cy = y + rowH / 2;
  x = L + px(12);
  const t = m.target;
  ctx.textAlign = 'left';
  ctx.font = mono(800, px(16.5));
  spacing(ctx, px(0.4));
  [['X:', t.x, C.axX], ['Y:', t.y, C.axY], ['Z:', t.z, C.axZ]].forEach(([lab, v, col], i) => {
    ctx.fillStyle = t.alertColor || col;
    ctx.fillText(lab, x, cy + 1);
    x += ctx.measureText(lab + ' ').width;
    ctx.fillStyle = t.alertColor || '#ffffff';
    ctx.fillText(v, x, cy + 1);
    x += ctx.measureText(v + (i < 2 ? ' ' : '')).width;
  });
  spacing(ctx, 0);
  x += px(10 + 8);
  x += badge(ctx, x, cy, t.delta, {
    font: mono(800, px(14)), color: C.cyan, bg: 'rgba(56, 189, 248, 0.18)', border: 'rgba(56, 189, 248, 0.4)',
    padX: px(10), h: px(26), r: px(5),
  }) + px(10);
  if (m.ghost) {
    const r = { x, y: cy - px(15), w: px(30), h: px(30) };
    toggleBtn(ctx, r, 'fa-ghost', m.ghost, isHov('ghost'), px);
    addHit(r, 'ghost', () => m.els.ghost.click());
    x += r.w + px(10);
  }
  if (m.dist !== null) {
    const r = { x, y: cy - px(15), w: px(30), h: px(30) };
    toggleBtn(ctx, r, 'fa-ruler-horizontal', m.dist ? 'active' : 'off', isHov('dist'), px);
    addHit(r, 'dist', () => m.els.dist.click());
    x += r.w + px(10);
  }
  if (m.auto !== null) {
    const lw = textW(ctx, mono(600, px(14.5)), 'Auto-Move');
    const bw = px(19) + px(7) + lw;
    const bx = R - px(12) - bw;
    const box = { x: bx, y: cy - px(9.5), w: px(19), h: px(19) };
    roundRect(ctx, box.x, box.y, box.w, box.h, px(3));
    ctx.fillStyle = m.auto ? C.cyan : (isHov('auto') ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.92)');
    ctx.fill();
    if (!m.auto) {
      ctx.strokeStyle = '#767676';
      ctx.lineWidth = px(1);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#0a0e17';
      ctx.lineWidth = px(2.4);
      ctx.beginPath();
      ctx.moveTo(box.x + px(4.5), box.y + px(10));
      ctx.lineTo(box.x + px(8), box.y + px(13.5));
      ctx.lineTo(box.x + px(14.5), box.y + px(5.5));
      ctx.stroke();
    }
    ctx.textAlign = 'left';
    ctx.font = mono(600, px(14.5));
    ctx.fillStyle = C.txt;
    ctx.fillText('Auto-Move', box.x + px(19 + 7), cy + 1);
    addHit({ x: bx - px(6), y: cy - px(15), w: bw + px(12), h: px(30) }, 'auto', () => m.els.auto.click());
  }
  y += rowH;

  // ── Schritte ──
  if (m.steps.length) {
    y += px(12);
    const n = m.steps.length, gap = px(8);
    const sw = (W - px(36) - (n - 1) * gap) / n, sh = px(34);
    m.steps.forEach((st, i) => {
      const r = { x: L + i * (sw + gap), y, w: sw, h: sh };
      drawStep(ctx, r, st, acc, px);
    });
    y += px(34);
  }

  // ── Balken ──
  y += px(12);
  const bw = W - px(36), bh = px(6);
  roundRect(ctx, L, y, bw, bh, px(3));
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fill();
  ctx.save();
  roundRect(ctx, L, y, bw, bh, px(3));
  ctx.clip();
  ctx.fillStyle = acc;
  if (m.bar.running) {
    // mp-indeterminate: 35 % breiter Streifen, laeuft von -100 % nach 290 %
    const p = (performance.now() % 1100) / 1100;
    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;   // ease-in-out
    const fw = bw * 0.35;
    roundRect(ctx, L + fw * lerp(-1, 2.9, e), y, fw, bh, px(2));
    ctx.fill();
  } else if (m.bar.pct > 0) {
    roundRect(ctx, L, y, bw * Math.min(100, m.bar.pct) / 100, bh, px(2));
    ctx.fill();
  }
  ctx.restore();
  y += bh;

  // ── Hinweistext ──
  if (m.detail) {
    y += px(12);
    ctx.textAlign = 'center';
    ctx.font = mono(400, px(16));
    ctx.fillStyle = m.detailColor;
    lines.forEach((ln, i) => ctx.fillText(ln, x0 + W / 2, y + px(23.2) * (i + 0.5)));
    y += px(23.2) * lines.length;
  }

  // ── Execute / Discard ──
  if (m.actions) {
    y += px(12);
    const bwid = px(88), bht = px(42), g = px(16);
    const ex = { x: x0 + W / 2 - bwid - g / 2, y, w: bwid, h: bht };
    const di = { x: x0 + W / 2 + g / 2, y, w: bwid, h: bht };
    // Execute: cyan, pulsiert beim Warten (mp-exec-btn-pulse)
    ctx.save();
    if (m.phase === 'confirm') {
      ctx.shadowColor = rgba(C.exec, 0.75 * pulse(800));
      ctx.shadowBlur = px(16);
    }
    roundRect(ctx, ex.x, ex.y, ex.w, ex.h, px(8));
    ctx.fillStyle = isHov('exec') ? 'rgba(34, 211, 238, 0.42)' : 'rgba(34, 211, 238, 0.28)';
    ctx.fill();
    ctx.restore();
    roundRect(ctx, ex.x, ex.y, ex.w, ex.h, px(8));
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.85)';
    ctx.lineWidth = px(1);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = fa(px(17));
    ctx.fillStyle = '#ecfeff';
    ctx.fillText(m.execGlyph || glyphFor('fa-play'), ex.x + ex.w / 2, ex.y + ex.h / 2);
    if (m.els.exec) addHit(ex, 'exec', () => m.els.exec.click());

    roundRect(ctx, di.x, di.y, di.w, di.h, px(8));
    ctx.fillStyle = isHov('discard') ? 'rgba(255, 255, 255, 0.14)' : 'rgba(255, 255, 255, 0.06)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.stroke();
    ctx.fillStyle = C.txt;
    ctx.fillText(glyphFor('fa-xmark'), di.x + di.w / 2, di.y + di.h / 2);
    if (m.els.discard) addHit(di, 'discard', () => m.els.discard.click());
  }
}

// .mp-ghost-toggle (auch fuer die Distanzlinie): state 'active' | 'off' | 'unavailable'
function toggleBtn(ctx, r, faName, state, hovered, px) {
  const on = state === 'active', na = state === 'unavailable';
  ctx.globalAlpha = on || hovered ? 1 : na ? 0.45 : 0.7;
  roundRect(ctx, r.x, r.y, r.w, r.h, px(6));
  ctx.fillStyle = on ? 'rgba(56, 189, 248, 0.16)' : hovered ? 'rgba(56, 189, 248, 0.14)' : 'rgba(255, 255, 255, 0.05)';
  ctx.fill();
  ctx.strokeStyle = on ? 'rgba(56, 189, 248, 0.6)' : hovered ? 'rgba(56, 189, 248, 0.45)' : 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = px(1);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.font = fa(px(16));
  ctx.fillStyle = on ? C.cyan : na ? C.dim : C.mut;
  ctx.fillText(glyphFor(faName), r.x + r.w / 2, r.y + r.h / 2);
  ctx.globalAlpha = 1;
}

// .mp-step mit Punkt, Label und Zeit rechts
function drawStep(ctx, r, st, acc, px) {
  let color = C.stepTxt, border = 'rgba(255, 255, 255, 0.14)', bg = 'rgba(255, 255, 255, 0.03)', dot = 'rgba(255, 255, 255, 0.18)';
  let dash = false, dotA = 1;
  if (st.state === 'active') {
    color = C.txt; border = rgba(acc, 0.6); bg = rgba(acc, 0.1); dot = acc; dotA = lerp(0.45, 1, pulse(700));
  } else if (st.state === 'done') {
    color = C.done; dot = C.green;
  } else if (st.state === 'failed') {
    color = C.failed; border = 'rgba(239, 68, 68, 0.6)'; dot = C.red;
  } else if (st.state === 'waiting') {
    color = C.txt; border = rgba(acc, 0.7); dot = acc; dash = true; dotA = lerp(0.45, 1, pulse(500));
  }
  roundRect(ctx, r.x, r.y, r.w, r.h, px(6));
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = px(1);
  if (dash) ctx.setLineDash([px(4), px(3)]);
  ctx.stroke();
  ctx.setLineDash([]);
  const cy = r.y + r.h / 2;
  ctx.globalAlpha = dotA;
  ctx.beginPath();
  ctx.arc(r.x + px(8) + px(4.5), cy, px(4.5), 0, Math.PI * 2);
  ctx.fillStyle = dot;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
  ctx.font = mono(700, px(14));
  ctx.fillStyle = color;
  spacing(ctx, px(0.2));
  ctx.fillText(st.label, r.x + px(8 + 9 + 5), cy + 1);
  const lw = ctx.measureText(st.label).width;
  spacing(ctx, 0);
  ctx.textAlign = 'right';
  ctx.font = mono(400, px(14));
  ctx.fillText(fitText(ctx, st.time, r.w - px(8 + 9 + 5 + 8 + 5) - lw), r.x + r.w - px(8), cy + 1);
}

// Zeilenumbruch fuer den Hinweistext (wie overflow-wrap am Desktop)
function wrapLines(ctx, text, maxW, maxLines) {
  if (!text) return [];
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width <= maxW || !cur) cur = next;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = fitText(ctx, lines[maxLines - 1] + ' …', maxW);
  }
  return lines.map(l => fitText(ctx, l, maxW));
}
