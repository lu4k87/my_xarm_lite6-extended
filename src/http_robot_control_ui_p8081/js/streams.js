// ── Kamera- und RViz-Streams (vorher Inline-Skript in index.html) ─────────
import { SERVICES, ZED_NS } from './config.js';
import { logMsg } from './log.js';
import { ros } from './ros.js';
import { visibleInterval } from './util.js';

// ── Live Camera 1 / 2 (Raspberry-Pi-Kameras, RPi Cam Web Interface) ──
// cam_pic.php liefert je Anfrage ein einzelnes JPEG; das naechste wird
// angefordert, sobald das vorige da ist. Die Bildrate ist also direkt
// messbar: Anzahl geladener Bilder im gleitenden Fenster.
const CAM_FPS_WINDOW_MS = 2000;

function setupPolledCam(imgId, errId, metaId, camHost) {
  const img = document.getElementById(imgId);
  const err = document.getElementById(errId);
  const meta = document.getElementById(metaId);
  if (!img) return;

  const loads = [];       // Zeitstempel der letzten geladenen Bilder
  let online = false;
  // Beim Setzen der naechsten src faellt naturalWidth sofort auf 0 zurueck -
  // die Groesse deshalb beim Laden festhalten.
  let frameW = 0, frameH = 0;

  const url = () => `http://${camHost}/html/cam_pic.php?time=${Date.now()}&pDelay=40000`;

  function renderMeta() {
    if (!meta) return;
    const now = performance.now();
    while (loads.length && now - loads[0] > CAM_FPS_WINDOW_MS) loads.shift();
    const fps = loads.length > 1 ? (loads.length - 1) / ((loads[loads.length - 1] - loads[0]) / 1000) : 0;
    const w = frameW, h = frameH;
    const text = online && w > 0
      ? `${w}×${h} · JPEG · ${fps.toFixed(1)} fps · ${camHost}`
      : `offline · ${camHost}`;
    if (meta.textContent !== text) meta.textContent = text;
    meta.title = online
      ? `Stream: ${w}×${h} px, single JPEG frames polled from ${url().split('?')[0]} (RPi Cam Web Interface), measured ${fps.toFixed(1)} fps`
      : `No frame from ${camHost} - camera not reachable`;
  }

  img.onload = () => {
    online = true;
    frameW = img.naturalWidth;
    frameH = img.naturalHeight;
    loads.push(performance.now());
    if (err) err.style.display = 'none';
    img.style.display = 'block';
    img.src = url();
  };
  img.onerror = () => {
    online = false;
    loads.length = 0;
    if (err) err.style.display = 'flex';
    img.style.display = 'none';
    setTimeout(() => { img.src = url(); }, 1000);
  };
  img.src = url();
  renderMeta();
  visibleInterval(renderMeta, 1000);
}

setupPolledCam('cam-stream', 'cam-stream-err', 'cam-stream-meta', '192.168.0.124');
setupPolledCam('cam-stream-2', 'cam-stream-2-err', 'cam-stream-2-meta', '192.168.0.123');

// ── RViz Fenster-Stream ──
// Hatte dieselben zwei Fehler wie der ZED-Stream: die Einblendung haengte
// allein am load-Event (das bei MJPEG ausbleibt) und es fehlte
// qos_profile=sensor_data. Dazu stand der Host fest auf 127.0.0.1.
(function () {
  const rvizImg = document.getElementById('rviz-stream');
  const rvizErr = document.getElementById('rviz-stream-err');
  if (!rvizImg) return;

  const rvizHost = window.location.hostname || 'localhost';
  // Ebenfalls ungekodiert - siehe Begruendung bei streamUrl() weiter unten.
  const rvizUrl = () =>
    `http://${rvizHost}:8082/stream?topic=/rviz_video/image_raw` +
    `&type=mjpeg&qos_profile=sensor_data&width=800&height=450&_t=${Date.now()}`;

  let watch = null;
  const stop = () => { if (watch) { clearInterval(watch); watch = null; } };
  const show = () => {
    stop();
    if (rvizErr) rvizErr.style.display = 'none';
    rvizImg.style.display = 'block';
  };

  function start() {
    stop();
    rvizImg.style.display = 'block';
    if (rvizErr) rvizErr.style.display = 'flex';
    rvizImg.src = rvizUrl();
    let waited = 0;
    watch = setInterval(() => {
      if (rvizImg.naturalWidth > 0) { show(); return; }
      waited += 400;
      if (waited >= 15000) { stop(); start(); }
    }, 400);
  }

  rvizImg.onload = show;
  rvizImg.onerror = () => {
    stop();
    if (rvizErr) rvizErr.style.display = 'flex';
    setTimeout(start, 3000);
  };
  start();
})();

// ── ZED M Camera Stream mit Modus-Auswahl ──
const zedImg = document.getElementById('zed-cam-stream');
const zedErr = document.getElementById('zed-cam-stream-err');
const zedSel = document.getElementById('zed-stream-mode');
const zedTopicLbl = document.getElementById('zed-stream-topic');

if (zedImg) {
  const host = window.location.hostname || 'localhost';
  const ZED_LS_KEY = 'zed_stream_topic';

  // Kuratierte Liste: Reihenfolge und Namen fuer die Anzeige. Welche davon
  // wirklich existieren, haengt von der ZED-Konfiguration ab - das wird
  // unten per rosapi abgeglichen. "float: true" markiert 32FC1-Bilder;
  // web_video_server skaliert die automatisch, wenn min == max.
  const ZED_MODES = [
    { topic: `${ZED_NS}/rgb/image_rect_color`,       label: 'RGB (rektifiziert)' },
    { topic: `${ZED_NS}/rgb_raw/image_raw_color`,    label: 'RGB (raw)' },
    { topic: `${ZED_NS}/left/image_rect_color`,      label: 'Links (rektifiziert)' },
    { topic: `${ZED_NS}/left_raw/image_raw_color`,   label: 'Links (raw)' },
    { topic: `${ZED_NS}/right/image_rect_color`,     label: 'Rechts (rektifiziert)' },
    { topic: `${ZED_NS}/right_raw/image_raw_color`,  label: 'Rechts (raw)' },
    { topic: `${ZED_NS}/stereo/image_rect_color`,    label: 'Stereo (nebeneinander)' },
    { topic: `${ZED_NS}/rgb_gray/image_rect_gray`,   label: 'Graustufen (rektifiziert)' },
    { topic: `${ZED_NS}/depth/depth_registered`,     label: 'Tiefe', float: true },
    { topic: `${ZED_NS}/confidence/confidence_map`,  label: 'Konfidenz', float: true },
  ];

  const modeFor = (t) => ZED_MODES.find(m => m.topic === t) || null;

  // ── Stream-Details neben der Ueberschrift ──
  // Aufloesung = was tatsaechlich ankommt (naturalWidth/Height des MJPEG-
  // Bildes), dazu Transport, Quellformat des Topics und die Kamera-
  // Einstellung (grab_resolution / grab_frame_rate des ZED-Nodes).
  const zedMeta = document.getElementById('zed-stream-meta');
  const ZED_NODE = '/zed/zed_node';
  let zedCam = { res: null, fps: null };

  function sourceEncoding(topic) {
    const m = modeFor(topic);
    if (m && m.float) return '32FC1';
    if (/gray/.test(topic)) return 'MONO8';
    if (/depth|confidence|disparity/.test(topic)) return '32FC1';
    return 'BGRA8';
  }

  function renderZedMeta() {
    if (!zedMeta) return;
    const parts = [];
    const w = zedImg.naturalWidth, h = zedImg.naturalHeight;
    parts.push(w > 0 ? `${w}×${h}` : '–×–');
    parts.push('MJPEG');
    parts.push(sourceEncoding(currentTopic));
    if (zedCam.res || zedCam.fps) {
      parts.push(`Cam ${zedCam.res || '?'}${zedCam.fps ? ` @ ${zedCam.fps} fps` : ''}`);
    }
    const text = parts.join(' · ');
    if (zedMeta.textContent !== text) zedMeta.textContent = text;
    zedMeta.title = `Stream: ${w > 0 ? `${w}×${h} px` : 'no frame yet'}, transport MJPEG via web_video_server (port 8082), ` +
      `source ${sourceEncoding(currentTopic)} (${currentTopic})` +
      (zedCam.res ? `, camera grab_resolution ${zedCam.res}` : '') + (zedCam.fps ? `, grab_frame_rate ${zedCam.fps} fps` : '');
  }

  // rosapi erwartet "<node>:<parameter>" und liefert JSON-kodierte Werte.
  function readZedParam(name, cb) {
    if (!ros || !ros.isConnected) return;
    new ROSLIB.Service({ ros, name: SERVICES.rosapiGetParam, serviceType: 'rosapi/GetParam' })
      .callService(new ROSLIB.ServiceRequest({ name: `${ZED_NODE}:${name}`, default_value: '' }),
        (res) => {
          let v = res && res.value;
          try { v = JSON.parse(v); } catch (e) { /* roher String */ }
          cb(v === '' || v === null || v === undefined ? null : v);
        }, () => cb(null));
  }

  function refreshZedCamParams() {
    readZedParam('general.grab_resolution', (v) => { zedCam.res = v ? String(v) : null; renderZedMeta(); });
    readZedParam('general.grab_frame_rate', (v) => { zedCam.fps = Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null; renderZedMeta(); });
  }

  function streamUrl(topic, bust) {
    const m = modeFor(topic);
    // Float-Bilder (Tiefe, Konfidenz) brauchen eine Skalierung. min == max
    // laesst web_video_server je Frame automatisch normalisieren - ohne das
    // bliebe das Bild schwarz.
    const extra = (m && m.float) ? '&min=0&max=0' : '';
    const t = bust ? `&_t=${Date.now()}` : '';
    // qos_profile=sensor_data ist PFLICHT: der ZED-Wrapper publiziert seine
    // Bilder mit BEST_EFFORT. web_video_server abonniert ohne diesen
    // Parameter mit RELIABLE - und ein RELIABLE-Subscriber matcht einen
    // BEST_EFFORT-Publisher nie. Die HTTP-Verbindung kommt dann zwar
    // zustande (Port 8082 meldet gruen), es trifft aber nie ein Frame ein:
    // kein Bild, kein Fehler, nur schwarz. In RViz faellt das nicht auf,
    // weil man die Reliability dort pro Display auf Best Effort stellt.
    // BEST_EFFORT-Subscriber matchen auch RELIABLE-Publisher, der Wert ist
    // also fuer alle Topics sicher.
    // Der Topic-Name wird NICHT kodiert. web_video_server dekodiert den
    // Query-Parameter nicht und bekommt sonst "%2Fzed%2F..." zu sehen;
    // es lehnt das ab ("Invalid topic name: must not contain characters
    // other than alphanumerics, '_', '~', '{', or '}'") und liefert eine
    // leere Multipart-Antwort - Verbindung steht, Bild kommt nie.
    // Die Index-Seite des Servers verlinkt die Streams selbst ungekodiert.
    // Gueltige ROS-Topicnamen enthalten ohnehin nur [A-Za-z0-9_~{}/].
    return `http://${host}:8082/stream?topic=${topic}&type=mjpeg&qos_profile=sensor_data${extra}${t}`;
  }

  let savedTopic = null;
  try { savedTopic = localStorage.getItem(ZED_LS_KEY); } catch (e) {}
  let currentTopic = savedTopic || ZED_MODES[0].topic;

  function renderOptions(available) {
    if (!zedSel) return null;
    const before = currentTopic;
    zedSel.replaceChildren();
    // Bekannte Modi zuerst, in kuratierter Reihenfolge
    const known = new Set();
    ZED_MODES.forEach(m => {
      if (available && !available.has(m.topic)) return;
      known.add(m.topic);
      const o = document.createElement('option');
      o.value = m.topic;
      o.textContent = m.label;
      zedSel.appendChild(o);
    });
    // Alles Weitere, was die Kamera sonst noch anbietet
    if (available) {
      Array.from(available).sort().forEach(t => {
        if (known.has(t)) return;
        const o = document.createElement('option');
        o.value = t;
        o.textContent = t.replace(ZED_NS + '/', '');
        zedSel.appendChild(o);
      });
    }
    if (zedSel.options.length === 0) {
      const o = document.createElement('option');
      o.value = currentTopic;
      o.textContent = 'Keine ZED-Bildtopics gefunden';
      zedSel.appendChild(o);
    }
    // Auswahl halten. Der gespeicherte Wunsch-Topic wird bevorzugt, falls
    // er erst jetzt - nach dem rosapi-Abgleich - in der Liste auftaucht;
    // sonst wuerde eine Auswahl ausserhalb der kuratierten Modi bei jedem
    // Neuladen verloren gehen.
    const values = Array.from(zedSel.options).map(o => o.value);
    if (savedTopic && values.includes(savedTopic)) currentTopic = savedTopic;
    else if (!values.includes(currentTopic)) currentTopic = values[0];
    zedSel.value = currentTopic;
    // Meldet zurueck, ob sich die Auswahl geaendert hat. Ohne das bliebe
    // der Stream auf dem alten Topic stehen, waehrend das Dropdown schon
    // ein anderes anzeigt.
    return currentTopic !== before ? currentTopic : null;
  }

  // Ein MJPEG-Stream ist eine multipart/x-mixed-replace-Antwort, die NIE
  // endet. Chrome feuert darauf kein zuverlaessiges load-Event. Wer das
  // Bild also nur in onload einblendet, sieht nie eines - auch wenn der
  // Stream einwandfrei laeuft. naturalWidth wird dagegen gesetzt, sobald
  // der erste Frame dekodiert ist; das ist das belastbare Signal.
  let zedWatch = null;
  const stopZedWatch = () => { if (zedWatch) { clearInterval(zedWatch); zedWatch = null; } };

  // Ohne Kamera lief der Retry frueher endlos: onerror startete alle 3 s neu,
  // der Watchdog alle 15 s, und jeder Versuch schrieb eine Logzeile. Jetzt
  // wird mit wachsendem Abstand begrenzt oft probiert und danach aufgegeben.
  const ZED_MAX_TRIES = 5;
  const ZED_BACKOFF_MS = [3000, 6000, 12000, 24000, 24000];
  const zedErrText  = document.getElementById('zed-cam-stream-err-text');
  const zedErrIcon  = document.getElementById('zed-cam-stream-err-icon');
  const zedRetryBtn = document.getElementById('zed-cam-stream-retry');
  let zedTries = 0;
  let zedGaveUp = false;
  let zedRetryTimer = null;
  let zedLoggedTopic = null;

  const stopZedRetry = () => { if (zedRetryTimer) { clearTimeout(zedRetryTimer); zedRetryTimer = null; } };

  function setZedOverlay(text, showRetry) {
    if (zedErr) zedErr.style.display = 'flex';
    if (zedErrText) zedErrText.textContent = text;
    if (zedErrIcon) zedErrIcon.className = showRetry ? 'fa-solid fa-plug-circle-xmark' : 'fa-solid fa-video-slash';
    if (zedRetryBtn) zedRetryBtn.style.display = showRetry ? 'inline-flex' : 'none';
  }

  const zedShow = () => {
    stopZedWatch();
    stopZedRetry();
    zedTries = 0;
    zedGaveUp = false;
    if (zedRetryBtn) zedRetryBtn.style.display = 'none';
    if (zedErr) zedErr.style.display = 'none';
    zedImg.style.display = 'block';
  };

  // Aufgeben statt weiter zu pollen. refreshZedTopics() sieht ueber rosbridge,
  // wenn das Topic zurueckkommt, und schaltet den Versuch wieder scharf.
  function zedGiveUp() {
    stopZedWatch();
    stopZedRetry();
    zedGaveUp = true;
    zedImg.removeAttribute('src');
    setZedOverlay('Keine Kamera', true);
    if (typeof logMsg === 'function') {
      logMsg('UI', `ZED stream unavailable after ${ZED_MAX_TRIES} attempts: ${currentTopic} - retries stopped`);
    }
  }

  function zedFailed() {
    stopZedWatch();
    stopZedRetry();
    if (zedGaveUp) return;
    zedTries += 1;
    if (zedTries >= ZED_MAX_TRIES) { zedGiveUp(); return; }
    const wait = ZED_BACKOFF_MS[Math.min(zedTries - 1, ZED_BACKOFF_MS.length - 1)];
    setZedOverlay(`Stream Disconnected (${zedTries}/${ZED_MAX_TRIES})`, false);
    zedRetryTimer = setTimeout(() => { zedRetryTimer = null; applyTopic(currentTopic); }, wait);
  }

  // Nach Nutzeraktion oder wiederaufgetauchtem Topic wieder von vorn.
  function zedRearm(topic) {
    stopZedRetry();
    zedTries = 0;
    zedGaveUp = false;
    applyTopic(topic || currentTopic);
  }

  function applyTopic(topic) {
    const topicChanged = topic !== currentTopic;
    currentTopic = topic;
    try { localStorage.setItem(ZED_LS_KEY, topic); } catch (e) {}
    if (zedTopicLbl) zedTopicLbl.textContent = topic.replace(ZED_NS + '/', '');
    renderZedMeta();
    stopZedWatch();
    if (topicChanged) { zedTries = 0; zedGaveUp = false; }
    // Das Bild bleibt sichtbar. Das Overlay liegt (z-index 10) darueber und
    // verschwindet, sobald der erste Frame da ist.
    zedImg.style.display = 'block';
    setZedOverlay(zedTries > 0 ? `Stream Disconnected (${zedTries}/${ZED_MAX_TRIES})` : 'Stream Disconnected', false);
    zedImg.src = streamUrl(topic, true);
    let waited = 0;
    zedWatch = setInterval(() => {
      if (zedImg.naturalWidth > 0) { zedShow(); return; }
      waited += 400;
      // Weder load noch error nach 15 s: Topic publiziert vermutlich nicht.
      if (waited >= 15000) zedFailed();
    }, 400);
    // Nur bei echtem Moduswechsel loggen - sonst flutete jeder Retry das Log.
    if (topic !== zedLoggedTopic && typeof logMsg === 'function') {
      zedLoggedTopic = topic;
      logMsg('UI', `ZED stream mode: ${topic}`);
    }
  }

  zedImg.onload = zedShow;

  // Auto-retry - immer mit dem GERADE gewaehlten Topic, nicht mit einem
  // fest verdrahteten.
  zedImg.onerror = () => { zedFailed(); };

  if (zedRetryBtn) zedRetryBtn.onclick = () => zedRearm(currentTopic);
  if (zedSel) zedSel.onchange = () => zedRearm(zedSel.value);

  renderOptions(null);          // sofort bedienbar, auch ohne rosbridge
  applyTopic(currentTopic);

  // Tatsaechlich vorhandene Bildtopics nachladen, sobald rosbridge steht.
  function refreshZedTopics() {
    if (typeof ros === 'undefined' || !ros || !ros.isConnected) return;
    try {
      const client = new ROSLIB.Service({
        ros: ros,
        name: SERVICES.rosapiTopicsForType,
        serviceType: 'rosapi/TopicsForType'
      });

      // Beide Schreibweisen abfragen: ROS 2 meldet "sensor_msgs/msg/Image",
      // aeltere rosapi-Staende vergleichen gegen "sensor_msgs/Image".
      // Was nicht passt, liefert einfach eine leere Liste.
      const found = new Set();
      let pending = 2;

      const done = () => {
        if (--pending > 0) return;
        const zed = Array.from(found).filter(t => t.startsWith(ZED_NS + '/'));
        if (zed.length === 0) return;   // Kamera laeuft nicht - Liste behalten
        const changed = renderOptions(new Set(zed));
        if (changed) { zedRearm(changed); return; }
        // Topic ist wieder da, nachdem wir aufgegeben hatten: erneut versuchen.
        if (zedGaveUp && zed.includes(currentTopic)) zedRearm(currentTopic);
      };

      ['sensor_msgs/msg/Image', 'sensor_msgs/Image'].forEach(typeName => {
        client.callService(
          new ROSLIB.ServiceRequest({ type: typeName }),
          (res) => { ((res && res.topics) || []).forEach(t => found.add(t)); done(); },
          () => done()
        );
      });
    } catch (e) { /* ignorieren - kuratierte Liste bleibt bedienbar */ }
  }

  setTimeout(refreshZedTopics, 1500);
  setTimeout(refreshZedCamParams, 1500);
  visibleInterval(refreshZedCamParams, 15000);
  // Aufloesung kann sich mit dem Modus aendern (z. B. Stereo = doppelte Breite).
  visibleInterval(renderZedMeta, 1000);
  // Pausiert bei verstecktem Tab
  visibleInterval(refreshZedTopics, 15000);
}
