// ── VR-Spiegel: Bild einer UI-Flaeche kodieren (Web Worker) ────────────────
//
// xr_mirror_send.js schickt ein ImageBitmap (Panel- oder HUD-Canvas, schon
// verkleinert) und bekommt eine WebP-Data-URL zurueck. Auslesen und Kodieren
// laufen hier statt im XR-Frame - die Brille darf dafuer kein Bild verlieren.

self.onmessage = async (e) => {
  const { id, bmp, quality } = e.data || {};
  try {
    const canvas = new OffscreenCanvas(bmp.width, bmp.height);
    canvas.getContext('2d').drawImage(bmp, 0, 0);
    bmp.close();
    const blob = await canvas.convertToBlob({ type: 'image/webp', quality });
    self.postMessage({ id, url: new FileReaderSync().readAsDataURL(blob) });
  } catch (err) {
    self.postMessage({ id, url: null, error: String(err && err.message ? err.message : err) });
  }
};
