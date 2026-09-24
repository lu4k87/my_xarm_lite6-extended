// ── Gemeinsame Grenzwerte fuer Robot Control UI und Digital Twin ───────────
//
// Vorher standen dieselben physikalischen Grenzen als blosse Zahlenliterale an
// mehreren Stellen: app.js (118 / 138 / 180 / 280 / 15), digital_twin.js
// (125 / 140 / 0.138) und noch einmal als 125 mm direkt im Gizmo-Check. Beim
// Nachziehen der Safety Zone hat genau diese Streuung in die falsche Richtung
// gefuehrt, weil nicht mehr erkennbar war, welcher Wert welche Grenze meint.
//
// Die Zahlen hier sind unveraendert die bisherigen - nur benannt, erklaert und
// an einem Ort. Wer eine Grenze anpasst, muss sie ab jetzt genau einmal
// anfassen.
//
// WICHTIG: Der Roboter selbst haelt seine Grenzen in
// robot_motion_handler_movegroup.py und MoveIt. Diese Datei (ES-Modul) beschreibt,
// was die Oberflaeche anzeigt und vorab warnt - sie ersetzt keine Pruefung im Node.
const LIMITS = {
  // ── Unerreichbare Zone um die Roboterachse ──
  // Mit MoveIt vermessen (/compute_ik mit Kollisionspruefung, Greifer nach
  // unten, 10-mm-Raster): unterhalb dieses Radius kann der TCP in der
  // jeweiligen Hoehe nicht stehen - der Arm muesste durch Sockel oder Unterarm.
  // Paare [z_mm, r_mm], dazwischen linear interpoliert, ab 300 mm frei.
  // Nur Anzeige und Warnung: MoveTo/Gizmo werden NICHT mehr blockiert, das
  // entscheidet MoveIt (IK + Planung mit Eigenkollision) selbst.
  UNREACHABLE_PROFILE: Object.freeze([
    [0, 100], [60, 100], [80, 80], [240, 80], [260, 60], [280, 30], [300, 0],
  ]),
  // Warnfarbe am Gizmo bis so viel ausserhalb der Zone (mm).
  CAUTION_MARGIN_MM: 20.0,
  // Manipulierbarkeit (REACH) steigt von der Zonengrenze bis +60 mm auf 100 %.
  MANIP_FADE_MARGIN_MM: 60.0,

  // Tischebene (Z Collision Level): darunter gilt der TCP als kollidiert (mm).
  // Nur der Startwert - live einstellbar im Ground-Collision-Popup, der
  // aktuelle Wert steht in floorGuard.levelMm (util.js).
  FLOOR_CLEARANCE_MM: 10.0,
  FLOOR_LEVEL_MIN_MM: 0.0,
  FLOOR_LEVEL_MAX_MM: 200.0,
  // Warnfarbe (Gizmo, HUD) so viel oberhalb der Z Collision Level (mm).
  FLOOR_WARN_MARGIN_MM: 20.0,

  // ── Safety Zone (m) ──
  // Deckungsgleich mit safe_radius in robot_motion_handler_movegroup.py.
  SAFETY_ZONE_M: 0.138,

  // ── Plausibilitaetsgrenzen fuer manuelle Posen-Eingaben ──
  // Rein defensiv: verhindert, dass NaN oder voellig abwegige Werte
  // ueberhaupt bis zum Roboter durchgereicht werden. Der Arbeitsraum des
  // Lite 6 endet weit vorher, das hier ist nur der Notnagel.
  POSE_MAX_MM: 1000.0,
  POSE_MAX_RAD: 2.0 * Math.PI,
};

// Object.freeze, damit kein Modul die Werte zur Laufzeit still veraendert.
export const ROBOT_LIMITS = Object.freeze(LIMITS);

// Radius der unerreichbaren Zone in Hoehe z (mm); 0 = frei.
export function unreachableRadiusAt(zMm) {
  const p = LIMITS.UNREACHABLE_PROFILE;
  if (!Number.isFinite(zMm) || zMm <= p[0][0]) return p[0][1];
  for (let i = 1; i < p.length; i++) {
    const [z1, r1] = p[i];
    if (zMm <= z1) {
      const [z0, r0] = p[i - 1];
      return r0 + (r1 - r0) * (zMm - z0) / (z1 - z0);
    }
  }
  return 0;
}

// Abstand (mm) des Punkts ausserhalb der Zone; negativ = in der Zone.
export function unreachableClearance(xMm, yMm, zMm) {
  return Math.hypot(xMm, yMm) - unreachableRadiusAt(zMm);
}
