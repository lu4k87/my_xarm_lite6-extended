// ── Kamera- und RViz-Streams (vorher Inline-Skript in index.html) ─────────
import { SERVICES, ZED_NS } from './config.js';
import { logMsg } from './log.js';
import { ros } from './ros.js';
import { visibleInterval } from './util.js';

// ── Live Camera Update Loop ──
const camImg = document.getElementById('cam-stream');
const camErr = document.getElementById('cam-stream-err');
if (camImg) {
  function updateCam() {
    camImg.src = `http://192.168.0.124/html/cam_pic.php?time=${new Date().getTime()}&pDelay=40000`;
  }
  camImg.onload = () => {
    if (camErr) camErr.style.display = 'none';
    camImg.style.display = 'block';
    updateCam();
  };
  camImg.onerror = () => {
    if (camErr) camErr.style.display = 'flex';
    camImg.style.display = 'none';
    setTimeout(updateCam, 1000);
  };
  updateCam(); // start the loop
}

// ── Live Camera 2 Update Loop ──
const camImg2 = document.getElementById('cam-stream-2');
const camErr2 = document.getElementById('cam-stream-2-err');
if (camImg2) {
  function updateCam2() {
    camImg2.src = `http://192.168.0.123/html/cam_pic.php?time=${new Date().getTime()}&pDelay=40000`;
  }
  camImg2.onload = () => {
    if (camErr2) camErr2.style.display = 'none';
    camImg2.style.display = 'block';
    updateCam2();
  };
  camImg2.onerror = () => {
    if (camErr2) camErr2.style.display = 'flex';
    camImg2.style.display = 'none';
    setTimeout(updateCam2, 1000);
  };
  updateCam2(); // start the loop
}
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

  const zedShow = () => {
    stopZedWatch();
    if (zedErr) zedErr.style.display = 'none';
    zedImg.style.display = 'block';
  };

  function applyTopic(topic) {
    currentTopic = topic;
    try { localStorage.setItem(ZED_LS_KEY, topic); } catch (e) {}
    if (zedTopicLbl) zedTopicLbl.textContent = topic.replace(ZED_NS + '/', '');
    stopZedWatch();
    // Das Bild bleibt sichtbar. Das Overlay liegt (z-index 10) darueber und
    // verschwindet, sobald der erste Frame da ist.
    zedImg.style.display = 'block';
    if (zedErr) zedErr.style.display = 'flex';
    zedImg.src = streamUrl(topic, true);
    let waited = 0;
    zedWatch = setInterval(() => {
      if (zedImg.naturalWidth > 0) { zedShow(); return; }
      waited += 400;
      // Weder load noch error nach 15 s: Topic publiziert vermutlich nicht.
      // Neu anstossen, statt stumm haengen zu bleiben.
      if (waited >= 15000) {
        stopZedWatch();
        applyTopic(currentTopic);
      }
    }, 400);
    if (typeof logMsg === 'function') logMsg('UI', `ZED stream mode: ${topic}`);
  }

  zedImg.onload = zedShow;

  // Auto-retry - immer mit dem GERADE gewaehlten Topic, nicht mit einem
  // fest verdrahteten.
  zedImg.onerror = () => {
    stopZedWatch();
    if (zedErr) zedErr.style.display = 'flex';
    setTimeout(() => { applyTopic(currentTopic); }, 3000);
  };

  if (zedSel) zedSel.onchange = () => applyTopic(zedSel.value);

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
        if (changed) applyTopic(changed);
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
  // Pausiert bei verstecktem Tab
  visibleInterval(refreshZedTopics, 15000);
}
