import { TOPICS } from './config.js';
import { logMsg } from './log.js';
import { estopLatched, estopPressedAt, ros, rosHooks } from './ros.js';
import { lsGet, lsSet, visibleInterval } from './util.js';

export let uiClickSound = null;
export let scanPosSound = null;
export let collisionEnabledSound = null;
export let collisionDisabledSound = null;
export let errorSound = null;
export let outOfReachSound = null;
export let poseOutOfReachSound = null;
export let movesToSelectedObjectSound = null;
export let initialPoseSound = null;
export let absolutePoseSound = null;
export let objectSelectSound = null;
export let robotMovesSound = null;
try {
  uiClickSound = new Audio('sounds/ui_mouse_click.mp3');
  scanPosSound = new Audio('sounds/_voice_robot_moves_to_scan_pos.mp3');
  collisionEnabledSound = new Audio('sounds/_voice_collision_detection_enabled.mp3');
  collisionDisabledSound = new Audio('sounds/_voice_collision_detection_disabled.mp3');
  errorSound = new Audio('sounds/error_sound.mp3');
  outOfReachSound = new Audio('sounds/_voice_object_out_of_reach.mp3');
  poseOutOfReachSound = new Audio('sounds/_voice_pose_out_of_reach.mp3');
  movesToSelectedObjectSound = new Audio('sounds/_voice_robot_moves_to_selected_object.mp3');
  initialPoseSound = new Audio('sounds/_voice_robot_moves_to_initial_pose.mp3');
  absolutePoseSound = new Audio('sounds/_voice_robot_moves_to_absolute_pose.mp3');
  objectSelectSound = new Audio('sounds/object_select_click_sound.mp3');
  robotMovesSound = new Audio('sounds/robot_moves_sound.mp3');
  robotMovesSound.loop = true;
} catch (e) {}

// ── Web Audio UI Click Sound Effect & Sound Toggle ───────────────────────
export let soundEnabled = lsGet('robot_control_sound_enabled') !== 'false';

// ROS Publisher for Sound State (Synchronizes sound toggle with backend robot motion nodes)
export const soundStatePub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.soundEnabled,
  messageType: 'std_msgs/Bool'
});

export function publishSoundState() {
  if (ros && ros.isConnected) {
    soundStatePub.publish(new ROSLIB.Message({ data: Boolean(soundEnabled) }));
  }
}
visibleInterval(publishSoundState, 2000);

export function syncAudioElements() {
  const all = [uiClickSound, scanPosSound, collisionEnabledSound, collisionDisabledSound,
    errorSound, outOfReachSound, poseOutOfReachSound, movesToSelectedObjectSound,
    initialPoseSound, absolutePoseSound, objectSelectSound, robotMovesSound];
  for (const audio of all) {
    if (!audio) continue;
    audio.muted = !soundEnabled;
    audio.volume = soundEnabled ? 1.0 : 0.0;
    if (!soundEnabled) {
      audio.pause();
      audio.currentTime = 0;
    }
  }
}

export function updateSoundUI() {
  const btn = document.getElementById('btn-sound-toggle');
  const icon = document.getElementById('sound-toggle-icon');
  syncAudioElements();
  if (!btn || !icon) return;

  btn.classList.toggle('active', soundEnabled);
  if (soundEnabled) {
    btn.style.color = 'var(--cyan)';
    btn.style.opacity = '1';
    btn.title = "Sound Effects: Enabled (Click to mute)";
    icon.className = "fa-solid fa-volume-high";
  } else {
    btn.style.color = 'var(--mut)';
    btn.style.opacity = '0.5';
    btn.title = "Sound Effects: Muted (Click to enable)";
    icon.className = "fa-solid fa-volume-xmark";
  }
}

export function toggleSound() {
  soundEnabled = !soundEnabled;
  lsSet('robot_control_sound_enabled', soundEnabled ? 'true' : 'false');
  updateSoundUI();
  publishSoundState();
  if (soundEnabled) {
    playUiClickSound();
  }
  logMsg('AUDIO', soundEnabled ? '🔊 Sound effects enabled (web & robot audio ON)' : '🔇 Sound effects muted (web & robot audio OFF)', 'info');
}




export let audioCtx = null;
export function playUiClickSound() {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // Crisp tactile mechanical click
    osc.type = 'sine';
    const now = audioCtx.currentTime;
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.035);
    
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + 0.04);
  } catch (err) {
    // Graceful fallback
  }
}


// Initialize sound button UI on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateSoundUI);
} else {
  updateSoundUI();
}


// Spielt den Klick-Sound und sagt im Log, warum nicht, falls er ausbleibt.
// Ohne diese Rueckmeldung laesst sich "es klickt nicht" nicht von
// "der Browser hat play() abgelehnt" unterscheiden.
export let lastClickSoundProblem = '';
export function playButtonClick(btn) {
  if (!soundEnabled) return;

  const where = (btn && (btn.id || btn.title || btn.textContent.trim().slice(0, 24))) || 'button';

  if (!uiClickSound) {
    reportClickSoundProblem(`Audio object missing (sounds/ui_mouse_click.mp3 could not be loaded) - ${where}`);
    return;
  }
  if (uiClickSound.muted || uiClickSound.volume === 0) {
    reportClickSoundProblem(`Audio ist stummgeschaltet (muted=${uiClickSound.muted}, volume=${uiClickSound.volume})`);
    return;
  }

  try {
    uiClickSound.currentTime = 0;
    const pr = uiClickSound.play();
    if (pr && typeof pr.catch === 'function') {
      pr.catch(err => reportClickSoundProblem(`${err && err.name ? err.name : 'Error'} during play() - ${where}`));
    }
  } catch (err) {
    reportClickSoundProblem(`${err && err.name ? err.name : 'Error'} while playing - ${where}`);
  }
}

// Alle Sprachansagen der Robot Control UI laufen hier im Browser (auch
// Initial Pose / Absolute Pose), damit sie auf jedem PC mit offener UI zu hoeren
// sind. Es spricht immer nur eine Stimme: eine neue Ansage beendet die
// laufende, statt sich mit ihr zu ueberlagern.
let currentVoice = null;
export function playVoice(audio, what) {
  if (!soundEnabled) return;
  if (!audio) {
    reportClickSoundProblem(`Sprachdatei fehlt (${what})`);
    return;
  }
  try {
    if (currentVoice && currentVoice !== audio && !currentVoice.paused) {
      currentVoice.pause();
      currentVoice.currentTime = 0;
    }
    currentVoice = audio;
    audio.currentTime = 0;
    const pr = audio.play();
    if (pr && typeof pr.catch === 'function') {
      pr.catch(err => reportClickSoundProblem(`${err && err.name ? err.name : 'Error'} during play() - ${what}`));
    }
  } catch (err) {
    reportClickSoundProblem(`${err && err.name ? err.name : 'Error'} while playing - ${what}`);
  }
}

// Klick auf ein erkanntes Objekt (Eintrag in "Detected Objects" oder
// Greifpunkt im Viewport). Laeuft neben einer Sprachansage her, nicht
// ueber playVoice, damit der Klick keine laufende Ansage abwuergt.
export function playObjectSelectSound() {
  if (!soundEnabled) return;
  if (!objectSelectSound) {
    reportClickSoundProblem('Sounddatei fehlt (object select)');
    return;
  }
  try {
    objectSelectSound.currentTime = 0;
    const pr = objectSelectSound.play();
    if (pr && typeof pr.catch === 'function') {
      pr.catch(err => reportClickSoundProblem(`${err && err.name ? err.name : 'Error'} during play() - object select`));
    }
  } catch (err) {
    reportClickSoundProblem(`${err && err.name ? err.name : 'Error'} while playing - object select`);
  }
}

// Bewegungsgeraeusch in Schleife, solange sich der Roboter bewegt. Wird bei
// jedem Bewegungs-Sample mit true aufgerufen (startet nur, wenn es steht).
// Das Stoppen ist verzoegert, damit kurze Pausen zwischen zwei
// Bahnsegmenten den Loop nicht zerhacken.
const ROBOT_MOVES_STOP_DELAY_MS = 350;
let robotMovesStopTimer = null;
export function setRobotMovesSound(moving) {
  if (!robotMovesSound) return;
  if (moving) {
    if (robotMovesStopTimer) {
      clearTimeout(robotMovesStopTimer);
      robotMovesStopTimer = null;
    }
    if (!soundEnabled || !robotMovesSound.paused) return;
    try {
      const pr = robotMovesSound.play();
      if (pr && typeof pr.catch === 'function') {
        pr.catch(err => reportClickSoundProblem(`${err && err.name ? err.name : 'Error'} during play() - robot moves`));
      }
    } catch (err) {
      reportClickSoundProblem(`${err && err.name ? err.name : 'Error'} while playing - robot moves`);
    }
    return;
  }
  if (robotMovesStopTimer || robotMovesSound.paused) return;
  robotMovesStopTimer = setTimeout(() => {
    robotMovesStopTimer = null;
    robotMovesSound.pause();
    robotMovesSound.currentTime = 0;
  }, ROBOT_MOVES_STOP_DELAY_MS);
}

// Gemeinsamer Cooldown fuer beide Out-of-Reach-Stimmen, damit sich
// Service-Antwort und nachfolgende Status-Meldung nicht doppeln.
let lastOutOfReachTs = 0;
function outOfReachCooldown() {
  const now = Date.now();
  if (now - lastOutOfReachTs < 1500) return true; // Cooldown um Audio-Überlappung zu vermeiden
  lastOutOfReachTs = now;
  return false;
}

// Objekt-Kontext: Anfahrt einer roten Kugel / eines Detected-Object-Eintrags.
// Nach dem Ende der Anfahrt noch kurz gueltig, weil die Fehlermeldungen
// von MoveIt etwas spaeter eintreffen koennen.
let objectReachContextUntil = 0;
export function setObjectReachContext(active, graceMs = 3000) {
  objectReachContextUntil = active ? Infinity : (graceMs > 0 ? Date.now() + graceMs : 0);
}

// Nach einem Not-Aus scheitern laufende Fahrten zwangslaeufig - das ist kein
// Reichweitenproblem, also keine "out of reach"-Ansage.
const ESTOP_QUIET_MS = 5000;
function estopQuiet() {
  return estopLatched || Date.now() - estopPressedAt < ESTOP_QUIET_MS;
}

// Objekt nicht erreichbar (rote Kugel / Detected Objects).
export function playOutOfReachSound() {
  if (estopQuiet()) return;
  if (outOfReachCooldown()) return;
  playVoice(outOfReachSound, 'object out of reach');
}

// Gizmo- bzw. Pose-Ziel nicht erreichbar (Singularitaet, Kollision, IK).
export function playPoseOutOfReachSound() {
  if (estopQuiet()) return;
  if (outOfReachCooldown()) return;
  playVoice(poseOutOfReachSound, 'pose out of reach');
}

// Fuer allgemeine Fehlermeldungen (Motion-/Grasp-Status): waehlt die Stimme
// danach, ob gerade ein Objekt angefahren wird.
export function playReachFailureSound() {
  if (Date.now() < objectReachContextUntil) playOutOfReachSound();
  else playPoseOutOfReachSound();
}

let lastMovesToSelectedObjectTs = 0;
export function playMovesToSelectedObjectSound() {
  const now = Date.now();
  if (now - lastMovesToSelectedObjectTs < 8000) return; // Cooldown um Audio-Überlappung zu vermeiden
  lastMovesToSelectedObjectTs = now;
  playVoice(movesToSelectedObjectSound, 'moves to selected object');
}

// Dieselbe Ursache nicht bei jedem Klick wiederholen.
export function reportClickSoundProblem(msg) {
  if (msg === lastClickSoundProblem) return;
  lastClickSoundProblem = msg;
  if (typeof logMsg === 'function') logMsg('AUDIO', `🔇 Click sound not played: ${msg}`, 'warn');
  else console.warn('[AUDIO]', msg);
}

// Nach jedem (Re-)Connect den Sound-Zustand sofort an die Nodes melden.
rosHooks.onConnect.push(publishSoundState);
