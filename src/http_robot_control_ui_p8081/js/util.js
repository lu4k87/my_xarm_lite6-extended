import { ROBOT_LIMITS } from './robot_limits.js';

// ── Kleine Helfer (Basismodul, ohne Abhaengigkeiten zur UI) ──────────────
// Grenzwerte zentral aus robot_limits.js.
export const LIM = ROBOT_LIMITS;

// Boden-Sperre der UI (Z Collision Level): folgt dem MoveIt-Bodenschalter im
// SCENE-Panel (/ui/moveit_collision_ground_enabled, gesetzt in motion.js).
// Ist die Bodenkollision bewusst AUS, blockiert auch die UI nicht mehr nach
// unten. Laeuft moveit_floor_collision nicht (Zustand unbekannt), bleibt die
// Sperre als Rueckfallebene aktiv.
export const floorGuard = { enabled: true };

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

// Letzte Pruefung vor dem Roboter. Vorher ging der Wert aus dem Eingabefeld
// voellig ungeprueft in den Service-Request: ein leeres Feld ergab NaN, das
// ueber JSON als null beim Node ankam.
// Die Grenzen sind bewusst weit - der Arbeitsraum endet laengst vorher, hier
// geht es nur darum, offensichtlichen Unsinn nicht abzuschicken.
export function validatePose(pose) {
  const names = ['X', 'Y', 'Z', 'Roll', 'Pitch', 'Yaw'];
  for (let i = 0; i < 6; i++) {
    const v = pose[i];
    if (!Number.isFinite(v)) {
      return `${names[i]} ist keine gueltige Zahl`;
    }
    const max = (i < 3) ? LIM.POSE_MAX_MM : LIM.POSE_MAX_RAD;
    if (Math.abs(v) > max) {
      const unit = (i < 3) ? 'mm' : 'rad';
      return `${names[i]}=${v} liegt ausserhalb von ±${max.toFixed(2)} ${unit}`;
    }
  }
  // Unterhalb der Z Collision Level bremst MoveIt Servo den Arm danach fast
  // auf null - ein manuelles Ziel dort ist fast immer ein Tippfehler.
  if (floorGuard.enabled && pose[2] < LIM.FLOOR_CLEARANCE_MM) {
    return `Z=${pose[2]} mm liegt unter der Z Collision Level (${LIM.FLOOR_CLEARANCE_MM} mm)`;
  }
  return null;
}
