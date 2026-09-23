import { TOPICS } from './config.js';
import { logMsg } from './log.js';
import { ros, rosHooks } from './ros.js';
import { lsGet, lsSet, visibleInterval } from './util.js';

export let uiClickSound = null;
export let scanPosSound = null;
export let collisionEnabledSound = null;
export let collisionDisabledSound = null;
export let errorSound = null;
export let outOfReachSound = null;
export let movesToSelectedObjectSound = null;
try {
  uiClickSound = new Audio('sounds/ui_mouse_click.mp3');
  scanPosSound = new Audio('sounds/_voice_robot_moves_to_scan_pos.mp3');
  collisionEnabledSound = new Audio('sounds/_voice_collision_detection_enabled.mp3');
  collisionDisabledSound = new Audio('sounds/_voice_collision_detection_disabled.mp3');
  errorSound = new Audio('sounds/error_sound.mp3');
  outOfReachSound = new Audio('sounds/_voice_object_out_of_reach.mp3');
  movesToSelectedObjectSound = new Audio('sounds/_voice_robot_moves_to_selected_object.mp3');
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
  if (uiClickSound) {
    uiClickSound.muted = !soundEnabled;
    uiClickSound.volume = soundEnabled ? 1.0 : 0.0;
    if (!soundEnabled) {
      uiClickSound.pause();
      uiClickSound.currentTime = 0;
    }
  }
  if (scanPosSound) {
    scanPosSound.muted = !soundEnabled;
    scanPosSound.volume = soundEnabled ? 1.0 : 0.0;
    if (!soundEnabled) {
      scanPosSound.pause();
      scanPosSound.currentTime = 0;
    }
  }
  if (outOfReachSound) {
    outOfReachSound.muted = !soundEnabled;
    outOfReachSound.volume = soundEnabled ? 1.0 : 0.0;
    if (!soundEnabled) {
      outOfReachSound.pause();
      outOfReachSound.currentTime = 0;
    }
  }
  if (movesToSelectedObjectSound) {
    movesToSelectedObjectSound.muted = !soundEnabled;
    movesToSelectedObjectSound.volume = soundEnabled ? 1.0 : 0.0;
    if (!soundEnabled) {
      movesToSelectedObjectSound.pause();
      movesToSelectedObjectSound.currentTime = 0;
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
    reportClickSoundProblem(`Audio-Objekt fehlt (sounds/ui_mouse_click.mp3 nicht ladbar) - ${where}`);
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
      pr.catch(err => reportClickSoundProblem(`${err && err.name ? err.name : 'Fehler'} bei play() - ${where}`));
    }
  } catch (err) {
    reportClickSoundProblem(`${err && err.name ? err.name : 'Fehler'} beim Abspielen - ${where}`);
  }
}

// UI audio: scan position voice, MoveIt collision toggle voices and the safety
// error sound (the other voices are played by robot_motion_handler_movegroup via pygame).
export function playVoice(audio, what) {
  if (!soundEnabled) return;
  if (!audio) {
    reportClickSoundProblem(`Sprachdatei fehlt (${what})`);
    return;
  }
  try {
    audio.currentTime = 0;
    const pr = audio.play();
    if (pr && typeof pr.catch === 'function') {
      pr.catch(err => reportClickSoundProblem(`${err && err.name ? err.name : 'Fehler'} bei play() - ${what}`));
    }
  } catch (err) {
    reportClickSoundProblem(`${err && err.name ? err.name : 'Fehler'} beim Abspielen - ${what}`);
  }
}

let lastOutOfReachTs = 0;
export function playOutOfReachSound() {
  const now = Date.now();
  if (now - lastOutOfReachTs < 1500) return; // Cooldown um Audio-Überlappung zu vermeiden
  lastOutOfReachTs = now;
  playVoice(outOfReachSound, 'object out of reach');
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
  if (typeof logMsg === 'function') logMsg('AUDIO', `🔇 Klick-Sound nicht abgespielt: ${msg}`, 'warn');
  else console.warn('[AUDIO]', msg);
}

// Nach jedem (Re-)Connect den Sound-Zustand sofort an die Nodes melden.
rosHooks.onConnect.push(publishSoundState);
