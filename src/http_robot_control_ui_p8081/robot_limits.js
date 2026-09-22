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
// robot_motion_handler_movegroup.py. Diese Datei beschreibt, was die Oberflaeche
// anzeigt und vorab blockiert - sie ersetzt die Pruefung im Node nicht.
(function () {
  'use strict';

  const LIMITS = {
    // ── Radien um die Base (mm), von innen nach aussen ──
    // Alle drei gelten nur unterhalb von LOW_Z_MM; darueber ist der
    // Sockelbereich frei.
    SELF_COLLISION_MM: 118.0,  // app.js: "SELF-COLLISION / INNER CYLINDER"
    HARD_BLOCK_MM: 125.0,      // robot_motion_handler_movegroup.py:1041 lehnt
                               // MoveTo hier ab -> das Gizmo blockiert vorher
    SINGULARITY_MM: 138.0,     // app.js: "INNER BOUNDARY SINGULARITY"
    CAUTION_MM: 140.0,         // digital_twin.js: Warnfarbe am TCP-Gizmo
    MANIP_FADE_MM: 180.0,      // ab hier faellt nur die Manipulierbarkeit

    // Hoehe, unterhalb derer die Radien ueberhaupt greifen (mm).
    LOW_Z_MM: 280.0,
    // Tischebene: darunter gilt der TCP als kollidiert (mm).
    FLOOR_CLEARANCE_MM: 15.0,
    // Zusaetzlicher Puffer fuer die Gizmo-Anzeige (mm).
    FLOOR_WARN_MM: 35.0,

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
  window.ROBOT_LIMITS = Object.freeze(LIMITS);
})();
