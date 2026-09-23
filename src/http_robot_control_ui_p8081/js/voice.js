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

// ── Sprachbefehle Info-Popup & Sprachumschaltung (DE / ENG) ───────────────
export const VOICE_COMMANDS_DATA = [
  {
    action: 'MoveTo: initial',
    icon: 'fa-house',
    accent: '#3fb950',
    titleDe: 'Startposition (Home)',
    titleEn: 'Initial Pose (Home)',
    descDe: 'Fährt den Roboterarm sicher in die Grundstellung / Home-Pose.',
    descEn: 'Plans and moves robot arm back to the initial home pose.',
    de: [
      '„Fahre zur Startposition“',
      '„Zurück zur Ausgangsposition“',
      '„Grundstellung anfahren“',
      '„Zurück zum Start“'
    ],
    en: [
      '"Move to initial pose"',
      '"Go home" / "Home pose"',
      '"Reset position"',
      '"Starting position"'
    ]
  },
  {
    action: 'MoveTo: pose',
    icon: 'fa-crosshairs',
    accent: '#38bdf8',
    titleDe: 'Absolute Zielpose',
    titleEn: 'Absolute Target Pose',
    descDe: 'Fährt auf die aktuell im Cartesian Jogging eingegebenen XYZ/RPY-Koordinaten.',
    descEn: 'Plans and executes motion to configured XYZ/RPY coordinate values.',
    de: [
      '„Fahre zur absoluten Position“',
      '„Gehe zur Zielpose“',
      '„Absolute Position anfahren“'
    ],
    en: [
      '"Move to absolute pose"',
      '"Go to pose"',
      '"Target pose"'
    ]
  },
  {
    action: 'Speed: faster',
    icon: 'fa-gauge-high',
    accent: '#f59e0b',
    titleDe: 'Geschwindigkeit erhöhen',
    titleEn: 'Increase Speed',
    descDe: 'Erhöht die globale Verfahrgeschwindigkeit um +1 Stufe (1–5).',
    descEn: 'Increases the global robot speed index by +1 level (1–5).',
    de: [
      '„Schneller“',
      '„Fahre schneller“',
      '„Erhöhe die Geschwindigkeit“'
    ],
    en: [
      '"Faster"',
      '"Speed up"',
      '"Go faster"'
    ]
  },
  {
    action: 'Speed: slower',
    icon: 'fa-gauge',
    accent: '#60a5fa',
    titleDe: 'Geschwindigkeit verringern',
    titleEn: 'Decrease Speed',
    descDe: 'Verringert die globale Verfahrgeschwindigkeit um -1 Stufe (1–5).',
    descEn: 'Decreases the global robot speed index by -1 level (1–5).',
    de: [
      '„Langsamer“',
      '„Fahre langsamer“',
      '„Verringere die Geschwindigkeit“'
    ],
    en: [
      '"Slower"',
      '"Slow down"',
      '"Go slower"'
    ]
  },
  {
    action: 'Scan: objects',
    icon: 'fa-cubes-stacked',
    accent: '#c084fc',
    titleDe: 'Objekt-Scan',
    titleEn: 'Scan Objects',
    descDe: 'Führt die autonome Scan-Trajektorie zur 3D-Objekterfassung (YOLO) aus.',
    descEn: 'Executes autonomous camera trajectory for 3D YOLO object detection.',
    de: [
      '„Scanne Objekte“',
      '„Starte Objektscan“',
      '„Objektscan ausführen“'
    ],
    en: [
      '"Scan objects"',
      '"Scan object"'
    ]
  }
];

let speechPopupTimeout = null;
let isSpeechPopupPinned = false;
let currentSpeechLang = 'de';

export function positionSpeechPopup() {
  const btn = document.getElementById('speech-info-btn');
  const popup = document.getElementById('speech-cmd-popup');
  if (!btn || !popup) return;

  const rect = btn.getBoundingClientRect();
  const popupWidth = Math.min(390, window.innerWidth - 24);
  popup.style.width = `${popupWidth}px`;

  // Horizontal positionieren
  let left = rect.left;
  if (left + popupWidth > window.innerWidth - 14) {
    left = window.innerWidth - popupWidth - 14;
  }
  if (left < 14) left = 14;

  // Vertikal positionieren: standardmäßig unter dem Button
  let top = rect.bottom + 8;
  const popupHeight = popup.offsetHeight || 380;
  if (top + popupHeight > window.innerHeight - 14) {
    const topAbove = rect.top - popupHeight - 8;
    if (topAbove >= 14) {
      top = topAbove;
    } else {
      top = Math.max(14, window.innerHeight - popupHeight - 14);
    }
  }

  popup.style.left = `${Math.round(left)}px`;
  popup.style.top = `${Math.round(top)}px`;
}

export function renderVoiceCommands(lang = 'de') {
  const body = document.getElementById('speech-popup-body');
  if (!body) return;

  body.innerHTML = '';

  VOICE_COMMANDS_DATA.forEach((cmd) => {
    const card = document.createElement('div');
    card.className = 'speech-cmd-card';

    // Kopfzeile: Icon + Titel + Action-Badge
    const head = document.createElement('div');
    head.className = 'speech-cmd-card-head';

    const titleGroup = document.createElement('div');
    titleGroup.className = 'speech-cmd-title-group';

    const icon = document.createElement('i');
    icon.className = `fa-solid ${cmd.icon}`;
    icon.style.color = cmd.accent;

    const titleSpan = document.createElement('span');
    titleSpan.className = 'speech-cmd-title';
    titleSpan.textContent = lang === 'en' ? cmd.titleEn : (lang === 'de' ? cmd.titleDe : `${cmd.titleDe} / ${cmd.titleEn}`);

    titleGroup.appendChild(icon);
    titleGroup.appendChild(titleSpan);

    const badge = document.createElement('span');
    badge.className = 'speech-cmd-badge';
    badge.textContent = cmd.action;

    head.appendChild(titleGroup);
    head.appendChild(badge);
    card.appendChild(head);

    // Beschreibung
    const desc = document.createElement('div');
    desc.className = 'speech-cmd-desc';
    desc.textContent = lang === 'en' ? cmd.descEn : (lang === 'de' ? cmd.descDe : `${cmd.descDe} (${cmd.descEn})`);
    card.appendChild(desc);

    // Phrasen
    if (lang === 'all') {
      const splitWrap = document.createElement('div');
      splitWrap.className = 'speech-cmd-phrases-split';

      // DE Block
      const deRow = document.createElement('div');
      deRow.className = 'speech-split-row';
      const dePill = document.createElement('span');
      dePill.className = 'speech-lang-pill de';
      dePill.textContent = 'DE';
      deRow.appendChild(dePill);

      const deList = document.createElement('div');
      deList.className = 'speech-phrase-sublist';
      cmd.de.forEach((phrase) => {
        const item = document.createElement('span');
        item.className = 'speech-phrase';
        item.innerHTML = `<i class="fa-regular fa-comment-dots"></i> <span>${phrase}</span>`;
        deList.appendChild(item);
      });
      deRow.appendChild(deList);
      splitWrap.appendChild(deRow);

      // EN Block
      const enRow = document.createElement('div');
      enRow.className = 'speech-split-row';
      const enPill = document.createElement('span');
      enPill.className = 'speech-lang-pill en';
      enPill.textContent = 'EN';
      enRow.appendChild(enPill);

      const enList = document.createElement('div');
      enList.className = 'speech-phrase-sublist';
      cmd.en.forEach((phrase) => {
        const item = document.createElement('span');
        item.className = 'speech-phrase';
        item.innerHTML = `<i class="fa-regular fa-comment-dots"></i> <span>${phrase}</span>`;
        enList.appendChild(item);
      });
      enRow.appendChild(enList);
      splitWrap.appendChild(enRow);

      card.appendChild(splitWrap);
    } else {
      const phrasesWrap = document.createElement('div');
      phrasesWrap.className = 'speech-cmd-phrases';
      const phraseList = lang === 'en' ? cmd.en : cmd.de;
      phraseList.forEach((phrase) => {
        const item = document.createElement('span');
        item.className = 'speech-phrase';
        item.innerHTML = `<i class="fa-regular fa-comment-dots"></i> <span>${phrase}</span>`;
        phrasesWrap.appendChild(item);
      });
      card.appendChild(phrasesWrap);
    }

    body.appendChild(card);
  });
}

export function showSpeechPopup() {
  clearTimeout(speechPopupTimeout);
  const popup = document.getElementById('speech-cmd-popup');
  const btn = document.getElementById('speech-info-btn');
  if (!popup || !btn) return;

  popup.classList.remove('is-hidden');
  popup.setAttribute('aria-hidden', 'false');
  btn.classList.add('active');

  positionSpeechPopup();
  requestAnimationFrame(positionSpeechPopup);
}

export function hideSpeechPopup(immediate = false) {
  if (isSpeechPopupPinned) return;
  clearTimeout(speechPopupTimeout);
  const popup = document.getElementById('speech-cmd-popup');
  const btn = document.getElementById('speech-info-btn');

  if (immediate) {
    if (popup) {
      popup.classList.add('is-hidden');
      popup.setAttribute('aria-hidden', 'true');
    }
    if (btn) btn.classList.remove('active');
    return;
  }

  speechPopupTimeout = setTimeout(() => {
    if (!isSpeechPopupPinned) {
      if (popup) {
        popup.classList.add('is-hidden');
        popup.setAttribute('aria-hidden', 'true');
      }
      if (btn) btn.classList.remove('active');
    }
  }, 250);
}

export function initVoiceCommandsInfo() {
  const btn = document.getElementById('speech-info-btn');
  const popup = document.getElementById('speech-cmd-popup');
  const closeBtn = document.getElementById('speech-popup-close-btn');
  if (!btn || !popup) return;

  // Gespeicherte Spracheinstellung laden
  try {
    const saved = localStorage.getItem('speech_cmd_lang');
    if (saved && ['de', 'en', 'all'].includes(saved)) {
      currentSpeechLang = saved;
    }
  } catch (e) {}

  // Language switch buttons
  const langBtns = popup.querySelectorAll('.speech-lang-btn');
  langBtns.forEach((b) => {
    if (b.dataset.lang === currentSpeechLang) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      currentSpeechLang = b.dataset.lang;
      langBtns.forEach((btnItem) => btnItem.classList.toggle('active', btnItem === b));
      try {
        localStorage.setItem('speech_cmd_lang', currentSpeechLang);
      } catch (err) {}
      renderVoiceCommands(currentSpeechLang);
      requestAnimationFrame(positionSpeechPopup);
    });
  });

  // Erstes Rendern
  renderVoiceCommands(currentSpeechLang);

  // Hover & Klick auf Info-Button
  btn.addEventListener('mouseenter', () => showSpeechPopup());
  btn.addEventListener('mouseleave', () => hideSpeechPopup(false));
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    isSpeechPopupPinned = !isSpeechPopupPinned;
    if (isSpeechPopupPinned) {
      showSpeechPopup();
    } else {
      hideSpeechPopup(true);
    }
  });

  // Hover auf Popup selbst
  popup.addEventListener('mouseenter', () => clearTimeout(speechPopupTimeout));
  popup.addEventListener('mouseleave', () => hideSpeechPopup(false));
  popup.addEventListener('click', (e) => e.stopPropagation());
  popup.addEventListener('mousedown', (e) => e.stopPropagation());
  popup.addEventListener('pointerdown', (e) => e.stopPropagation());

  // Schließen-Button im Footer
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isSpeechPopupPinned = false;
      hideSpeechPopup(true);
    });
  }

  // Global Klick außerhalb
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#speech-info-wrap') && !e.target.closest('#speech-cmd-popup')) {
      isSpeechPopupPinned = false;
      hideSpeechPopup(true);
    }
  });

  // Escape-Taste
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !popup.classList.contains('is-hidden')) {
      isSpeechPopupPinned = false;
      hideSpeechPopup(true);
    }
  });

  // Fenster-Resize und Scroll -> neu ausrichten
  window.addEventListener('resize', () => {
    if (!popup.classList.contains('is-hidden')) positionSpeechPopup();
  });
  window.addEventListener('scroll', () => {
    if (!popup.classList.contains('is-hidden')) positionSpeechPopup();
  }, true);
}

// Initialisieren, sobald DOM bereit ist
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVoiceCommandsInfo);
} else {
  initVoiceCommandsInfo();
}

