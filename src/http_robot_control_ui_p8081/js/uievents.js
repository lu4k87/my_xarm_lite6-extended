import { playButtonClick } from './audio.js';

// ── Global Button Debounce (Anti-Double-Click) ──────────────────────────
document.addEventListener('click', function(e) {
  const btn = e.target.closest('button');
  if (!btn) return;
  
  // Skip debounce for sound toggle button
  if (btn.id === 'btn-sound-toggle') return;
  // Der Not-Aus muss jederzeit und beliebig oft ausloesbar sein.
  if (btn.id === 'btn-estop-header' || btn.id === 'btn-emergency-stop') return;
  // Layout-Schalter (Spalten ein-/ausklappen) duerfen sofort wieder klicken.
  if (btn.classList.contains('col-splitter-btn')) return;

  // Check if button is disabled by motion lock or already clicked
  if (btn.disabled || btn.dataset.clicked || btn.style.pointerEvents === 'none') {
    e.stopPropagation();
    e.preventDefault();
    return;
  }
  
  // Klick-Sound. Frueher ungeschuetzt: waere uiClickSound null gewesen,
  // haette die Zuweisung den Handler abgebrochen - der Button haette dann
  // funktioniert, aber weder Sound noch Debounce bekommen.
  playButtonClick(btn);

  // Allow continuous jogging buttons to be pressed rapidly or held without getting visually disabled by the debounce
  if (btn.classList.contains('btn-z') || btn.classList.contains('btn-rot')) return;
  
  // Mark as clicked and visually disable
  btn.dataset.clicked = "true";
  const oldPointerEvents = btn.style.pointerEvents;
  const oldOpacity = btn.style.opacity;
  
  btn.style.pointerEvents = 'none';
  btn.style.opacity = '0.6';
  
  // Re-enable after 1.5 seconds
  setTimeout(() => {
    delete btn.dataset.clicked;
    btn.style.pointerEvents = oldPointerEvents;
    btn.style.opacity = oldOpacity;
  }, 1500);
}, true);
