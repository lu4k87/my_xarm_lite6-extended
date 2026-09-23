import { TOPICS } from './config.js';
import { logMsg } from './log.js';
import { moveToPose, setInitialPose, startObjectScan, updateSpeed } from './motion.js';
import { ros } from './ros.js';

// Zustand des Whisper-Listeners (vorher als window.* abgelegt)
export let whisperTriggerPub = null;
export let whisperStatusSub = null;
export let enforceTimeout = null;
export let safetyTimeout = null;


// ── Voice Feedback ──────────────────────────────────────────────────────
export const voiceFeedbackSub = new ROSLIB.Topic({
  ros: ros,
  name: TOPICS.voiceFeedback,
  messageType: 'std_msgs/String'
});

voiceFeedbackSub.subscribe((msg) => {
  logMsg('VOICE', `🗣️ Voice Command Recognized: ${msg.data}`);
  const voiceSpan = document.getElementById('voice-recognized-cmd');
  if (voiceSpan) {
    voiceSpan.innerText = msg.data;
    voiceSpan.style.textShadow = "0 0 10px var(--green)";
    voiceSpan.style.color = "var(--green)";
    setTimeout(() => {
      voiceSpan.style.textShadow = "none";
      voiceSpan.style.color = "var(--purple)";
    }, 2000);
  }
  
  // The voice command directly executes via the backend.
  // We no longer overwrite the Manual Grasp Target input field to avoid confusion.

  // Voice Command: "Move to Pose" → triggers moveToPose() with current input values
  if (msg.data === 'MoveTo: pose') {
    logMsg('VOICE', '🗣️ Voice → Triggering: Absolute Pose Move...', 'info');
    moveToPose();
  }

  // Voice Command: "Move to Initial Pose" → triggers setInitialPose()
  if (msg.data === 'MoveTo: initial') {
    logMsg('VOICE', '🗣️ Voice → Triggering: Initial Pose Move...', 'info');
    setInitialPose();
  }

  // Voice Command: "Faster" → Increases Global Speed (0-4)
  if (msg.data === 'Speed: faster') {
    logMsg('VOICE', '🗣️ Voice → Speed: Faster', 'info');
    const slider = document.getElementById('speed-slider');
    const current = slider ? parseInt(slider.value || 2) : 2;
    const next = Math.min(4, current + 1);
    if (slider) slider.value = next;
    updateSpeed(next);
  }

  // Voice Command: "Slower" → Decreases Global Speed (0-4)
  if (msg.data === 'Speed: slower') {
    logMsg('VOICE', '🗣️ Voice → Speed: Slower', 'info');
    const slider = document.getElementById('speed-slider');
    const current = slider ? parseInt(slider.value || 2) : 2;
    const prev = Math.max(0, current - 1);
    if (slider) slider.value = prev;
    updateSpeed(prev);
  }

  // Voice Command: "Scan: objects" → triggers startObjectScan()
  if (msg.data === 'Scan: objects') {
    logMsg('VOICE', '🗣️ Voice → Triggering: Object Scan...', 'info');
    startObjectScan();
  }
});

export function startListening() {
  const btn = document.getElementById("btn-start-listening");
  const textSpan = document.getElementById("btn-listen-text");
  const icon = document.getElementById("btn-listen-icon");
  const resultSpan = document.getElementById("voice-recognized-cmd");

  if (!btn || !textSpan || !icon) return;

  // Prevent double-clicks while already listening
  if (btn.classList.contains("btn-listening")) {
    logMsg('UI', 'Already listening... please wait.', 'warn');
    return;
  }

  // Clear old timeouts
  clearTimeout(enforceTimeout);
  clearTimeout(safetyTimeout);

  // Set listening state (UI)
  btn.classList.add("btn-listening");
  textSpan.innerText = "Listening...";
  icon.classList.remove("fa-ear-listen");
  icon.classList.add("fa-microphone-lines", "fa-beat-fade");
  
  if (resultSpan) {
    resultSpan.innerText = "🎤 Listening for command...";
    resultSpan.style.color = "var(--purple)";
  }

  logMsg('UI', '➤ Whisper: Triggering Python Listener...');

  if (!whisperTriggerPub) {
    whisperTriggerPub = new ROSLIB.Topic({
      ros: ros,
      name: TOPICS.voiceListenTrigger,
      messageType: 'std_msgs/String'
    });
  }
  
  // Subscribe exactly once
  if (!whisperStatusSub) {
    whisperStatusSub = new ROSLIB.Topic({
      ros: ros,
      name: TOPICS.voiceStatus,
      messageType: 'std_msgs/String'
    });
    whisperStatusSub.subscribe((msg) => {
      const b = document.getElementById("btn-start-listening");
      const t = document.getElementById("btn-listen-text");
      const ic = document.getElementById("btn-listen-icon");
      const rs = document.getElementById("voice-recognized-cmd");

      if (msg.data.startsWith("Transcription:")) {
        const text = msg.data.replace("Transcription:", "").trim();
        resetListeningUI(b, t, ic, rs, `"${text}"`);
        logMsg('VOICE', `🗣️ Transcription: "${text}"`, 'info');
        clearTimeout(enforceTimeout);
        clearTimeout(safetyTimeout);
      } else if (msg.data.startsWith("Error:") || msg.data.includes("No speech")) {
        resetListeningUI(b, t, ic, rs, msg.data);
        logMsg('System', `Whisper: ${msg.data}`, 'err');
        clearTimeout(enforceTimeout);
        clearTimeout(safetyTimeout);
      } else {
        resultSpan.innerText = msg.data;
      }
    });
  }

  // Fallback timeouts if Python listener fails
  enforceTimeout = setTimeout(() => {
    logMsg('System', '5s elapsed, waiting for Whisper processing...', 'info');
  }, 5000);

  safetyTimeout = setTimeout(() => {
    const b = document.getElementById("btn-start-listening");
    const t = document.getElementById("btn-listen-text");
    const ic = document.getElementById("btn-listen-icon");
    const rs = document.getElementById("voice-recognized-cmd");
    resetListeningUI(b, t, ic, rs, "-- Timeout --");
    logMsg('System', 'Whisper Python Listener did not respond within 30s.', 'err');
  }, 30000);

  whisperTriggerPub.publish(new ROSLIB.Message({ data: 'listen' }));
}

export function resetListeningUI(btn, textSpan, icon, resultSpan, errorText) {
  if (btn) btn.classList.remove("btn-listening");
  if (textSpan) textSpan.innerText = "Start Listening";
  if (icon) {
    icon.classList.add("fa-ear-listen");
    icon.classList.remove("fa-microphone-lines", "fa-beat-fade");
  }
  if (errorText && resultSpan) {
    resultSpan.innerText = errorText;
    resultSpan.style.color = "var(--mut)";
  }
}
