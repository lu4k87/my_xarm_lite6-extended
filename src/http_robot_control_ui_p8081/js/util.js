import { ROBOT_LIMITS } from './robot_limits.js';

// ── Kleine Helfer (Basismodul, ohne Abhaengigkeiten zur UI) ──────────────
// Grenzwerte zentral aus robot_limits.js.
export const LIM = ROBOT_LIMITS;

// Boden-Sperre der UI (Z Collision Level): folgt dem MoveIt-Bodenschalter im
// SCENE-Panel (/ui/moveit_collision_ground_enabled, gesetzt in motion.js).
// Ist die Bodenkollision bewusst AUS, blockiert auch die UI nicht mehr nach
// unten. Laeuft moveit_floor_collision nicht (Zustand unbekannt), bleibt die
// Sperre als Rueckfallebene aktiv.
// levelMm = aktuelle Z Collision Level (TCP-Hoehe in mm). Kommt latched von
// moveit_floor_collision (/ui/ground_collision_level) und laesst sich im
// Ground-Collision-Popup im Viewport live verstellen.
export const floorGuard = { enabled: true, levelMm: LIM.FLOOR_CLEARANCE_MM };

// ── Kleine Helfer ─────────────────────────────────────────────────────────
// localStorage wirft im Inkognito-Fenster und bei blockierten Site-Daten.
// Bisher war nur ein Teil der Zugriffe abgesichert, der Rest haette die
// jeweilige Funktion mitgerissen.
export function lsGet(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch (e) {
    return fallback;
  }
}

export function lsSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    return false;
  }
}

// Seitenzoom (CSS zoom auf <html>, gesetzt in index.html, im Quest-Browser
// 0,5). getBoundingClientRect() und clientX/Y liefern sichtbare Pixel,
// style.left/width usw. gelten in Seitenpixeln - also durch uiZoom() teilen.
export function uiZoom() {
  return parseFloat(document.documentElement.dataset.uiZoom) || 1;
}

// Periodische Abfrage, die bei verstecktem Tab pausiert. Beim Zurueckkehren
// laeuft sie sofort einmal, statt bis zum naechsten Takt zu warten.
// NICHT fuer Dinge verwenden, die der Roboter braucht (TF-Broadcast,
// Jog-Befehle) - nur fuer Anzeige und Polling.
export function visibleInterval(fn, ms) {
  let id = null;
  const start = () => { if (id === null) id = setInterval(fn, ms); };
  const stop = () => { if (id !== null) { clearInterval(id); id = null; } };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
    } else {
      fn();
      start();
    }
  });
  if (!document.hidden) start();
  return { start, stop };
}

// innerText nur setzen, wenn sich der Text geaendert hat. Fuer Anzeigen, die
// mit /joint_states bzw. der EEF-Pose (~30 Hz) auch bei stehendem Arm neu
// beschrieben werden: ein gleicher Text ersetzt sonst trotzdem den Textknoten
// und loest Layout aus. Nur fuer Elemente, in die sonst niemand schreibt.
const lastInnerText = new WeakMap();
export function setTextIfChanged(el, text) {
  if (!el || lastInnerText.get(el) === text) return;
  el.innerText = text;
  lastInnerText.set(el, text);
}

// Icon + Text in ein Element setzen, ohne innerHTML.
export function setIconLabel(el, iconClass, text) {
  if (!el) return;
  const i = document.createElement('i');
  i.className = iconClass;
  el.replaceChildren(i);
  if (text) el.append(' ' + text);
}

// Eine Posen-Eingabe lesen. Fehlt das Feld, kommt NaN zurueck - das faengt
// validatePose() ab, statt dass ein TypeError die Funktion abbricht.
export function readPoseInput(id) {
  const el = document.getElementById(id);
  return el ? parseFloat(el.value) : NaN;
}

// Rotation: in der UI (POSE-Felder, Telemetrie, Gelenke) Grad, in den
// Services und im Twin rad.
export const RAD2DEG = 180 / Math.PI;
export const DEG2RAD = Math.PI / 180;
// Radiant als Grad mit einer Nachkommastelle, ohne "-0.0".
export const fmtDeg = (rad) => { const d = +(rad * RAD2DEG).toFixed(1); return (d || 0).toFixed(1); };

// Alle sechs POSE-Felder als [x, y, z] in mm und [roll, pitch, yaw] in rad.
export function readPoseInputs() {
  return [
    readPoseInput('inp-x'), readPoseInput('inp-y'), readPoseInput('inp-z'),
    readPoseInput('inp-r') * DEG2RAD, readPoseInput('inp-p') * DEG2RAD, readPoseInput('inp-yw') * DEG2RAD,
  ];
}

// Letzte Pruefung vor dem Roboter. Vorher ging der Wert aus dem Eingabefeld
// voellig ungeprueft in den Service-Request: ein leeres Feld ergab NaN, das
// ueber JSON als null beim Node ankam.
// Die Grenzen sind bewusst weit - der Arbeitsraum endet laengst vorher, hier
// geht es nur darum, offensichtlichen Unsinn nicht abzuschicken.
// Erwartet die Rotation in rad, meldet sie aber in Grad wie in der UI.
export function validatePose(pose) {
  const names = ['X', 'Y', 'Z', 'Roll', 'Pitch', 'Yaw'];
  for (let i = 0; i < 6; i++) {
    const v = pose[i];
    if (!Number.isFinite(v)) {
      return `${names[i]} is not a valid number`;
    }
    const max = (i < 3) ? LIM.POSE_MAX_MM : LIM.POSE_MAX_RAD;
    if (Math.abs(v) > max) {
      return (i < 3)
        ? `${names[i]}=${v} mm is outside ±${max.toFixed(0)} mm`
        : `${names[i]}=${(v * RAD2DEG).toFixed(1)}° is outside ±${(max * RAD2DEG).toFixed(0)}°`;
    }
  }
  // Unterhalb der Z Collision Level bremst MoveIt Servo den Arm danach fast
  // auf null - ein manuelles Ziel dort ist fast immer ein Tippfehler.
  if (floorGuard.enabled && pose[2] < floorGuard.levelMm) {
    return `Z=${pose[2]} mm is below the Z Collision Level (${floorGuard.levelMm} mm)`;
  }
  return null;
}


// ── Hinweis-Popup mittig im Bildschirm ──────────────────────────────────
// Die ganze UI verschwimmt NOTICE_BLUR_MS lang, der Hinweis selbst bleibt
// NOTICE_SHOW_MS stehen oder bis er angeklickt wird. Die Unschaerfe ist rein
// optisch (pointer-events: none) - der Not-Aus bleibt jederzeit klickbar.
// "rmw_cyclonedds_cpp" -> "cyclonedds" (Header-Pill; voller Name im title).
export function shortRmwName(rmw) {
  return String(rmw || '').replace(/^rmw_/, '').replace(/_cpp$/, '');
}

export const NOTICE_BLUR_MS = 3000;
export const NOTICE_SHOW_MS = 5000;
let noticeEls = null;
let noticeTimers = [];

export function closeCenterNotice() {
  noticeTimers.forEach(clearTimeout);
  noticeTimers = [];
  if (!noticeEls) return;
  const { backdrop, box } = noticeEls;
  noticeEls = null;
  backdrop.classList.remove('is-on');
  box.classList.remove('is-on');
  setTimeout(() => { backdrop.remove(); box.remove(); }, 300);
}

export function showCenterNotice(title, text, icon = 'fa-circle-info') {
  closeCenterNotice();
  const backdrop = document.createElement('div');
  backdrop.className = 'ui-notice-backdrop';
  const box = document.createElement('div');
  box.className = 'ui-notice';
  box.setAttribute('role', 'alertdialog');
  box.setAttribute('aria-live', 'assertive');
  const i = document.createElement('i');
  i.className = `fa-solid ${icon} ui-notice-icon`;
  const t = document.createElement('div');
  t.className = 'ui-notice-title';
  t.textContent = title;
  const p = document.createElement('div');
  p.className = 'ui-notice-text';
  p.textContent = text;
  const hint = document.createElement('div');
  hint.className = 'ui-notice-hint';
  hint.textContent = 'Click to close';
  box.append(i, t, p, hint);
  box.addEventListener('click', closeCenterNotice);
  document.body.append(backdrop, box);
  noticeEls = { backdrop, box };
  // Einen Frame spaeter einschalten, damit die Einblendung animiert.
  requestAnimationFrame(() => { backdrop.classList.add('is-on'); box.classList.add('is-on'); });
  noticeTimers.push(setTimeout(() => backdrop.classList.remove('is-on'), NOTICE_BLUR_MS));
  noticeTimers.push(setTimeout(closeCenterNotice, NOTICE_SHOW_MS));
}
