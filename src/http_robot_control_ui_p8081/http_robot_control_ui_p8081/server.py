#!/usr/bin/env python3
"""Webserver der Robot Control UI (Port 8081) mit automatischem Cache-Busting.

Ersetzt `python3 -m http.server`. Zwei Dinge sind anders:

1. JS, CSS, JSON und URDF gehen mit `Cache-Control: no-cache` und einem ETag
   (Aenderungszeit in ns + Groesse) raus. Der Browser behaelt die Dateien,
   fragt aber bei jedem Laden per If-None-Match nach - unveraendert kommt ein
   304 ohne Inhalt, geaendert sofort die neue Fassung. Das gilt auch fuer
   Dateien, die per ES-Modul-`import` nachgeladen werden und deshalb keinen
   ?v=-Parameter bekommen koennen. (Bis hierhin stand dort zusaetzlich
   `no-store` - damit lud jeder Reload alles neu, u.a. 2 MB three.js.)
   HTML bleibt bei `no-store`.
2. In index.html (und vr_mirror.html) bekommt jedes lokale <script src> und <link href> auf eine
   .js/.css-Datei ein `?v=<Aenderungszeit>`. Das manuelle Hochzaehlen von
   ?v=28 usw. entfaellt.
3. `/api/header_status` liefert den Zustand fuer die Header-Badges (Ports,
   Quest 3, Xbox, Tobii, ROS-Umgebung). Geprueft wird hier auf dem PC: der
   Browser selbst darf aus der HTTPS-Seite (8443, Quest) keine HTTP-Ports
   abfragen und sieht keine USB-Geraete.
4. `/api/sys_load` liefert CPU- und GPU-Last fuer den SYSTEM-Tab im Viewport
   (/proc/stat bzw. nvidia-smi, gemessen nur solange die UI fragt).
5. `/api/tf_tuner` (GET/POST) haelt die per "Save" fest gespeicherten
   TF-Tuner-Werte. Liegen auf dem PC statt im localStorage, damit Desktop
   und Quest 3 (8443 nutzt diesen Handler mit) beim Start denselben Stand laden.
6. `/api/settings` (GET/POST) haelt die per "Save" gespeicherten Einstellungen
   der Settings-Section (z. B. Aussehen des TCP-Gizmos), aus demselben Grund.

Aufruf: server.py [PORT] [VERZEICHNIS]
"""

import functools
import http.server
import json
import os
import posixpath
import re
import socket
import subprocess
import sys
import threading
import time

NO_STORE_EXT = ('.html',)
REVALIDATE_EXT = ('.js', '.mjs', '.css', '.json', '.urdf')
ASSET_RE = re.compile(r'''(\s(?:src|href)=")([^"#?:]+\.(?:js|mjs|css))(?:\?v=[^"]*)?(")''')
# Seiten, deren <script src>/<link href> automatisch ?v=<mtime> bekommen.
VERSIONED_PAGES = {'/': 'index.html', '/index.html': 'index.html', '/vr_mirror.html': 'vr_mirror.html'}


# ── Header-Status ────────────────────────────────────────────────────────────
HEADER_PORTS = (8081, 5000, 8080, 8082, 9090, 9091)
QUEST_USB_VENDOR = '2833'           # Oculus VR / Meta
QUEST_IP_CACHE = os.path.expanduser('~/.cache/robot_control_ui/quest_ip')
TOBII_IP = os.environ.get('TOBII_IP', '192.168.75.51')   # Tobii Pro Glasses 3 (wie gaze_ui_node)
TOBII_RTSP_PORT = 8554
XBOX_NAME_RE = re.compile(r'x-?box', re.I)
STATUS_POLL_S = 2.0
STATUS_IDLE_S = 30.0                # ohne Abfrage keine adb-/ping-Aufrufe mehr


def _tcp_open(host, port, timeout):
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def _quest_on_usb():
    root = '/sys/bus/usb/devices'
    try:
        for d in os.listdir(root):
            try:
                with open(os.path.join(root, d, 'idVendor')) as f:
                    if f.read().strip() == QUEST_USB_VENDOR:
                        return True
            except OSError:
                continue
    except OSError:
        pass
    return False


def _xbox_connected():
    """USB oder Bluetooth - beide tauchen als Eingabegeraet auf."""
    try:
        with open('/proc/bus/input/devices') as f:
            return any(line.startswith('N: Name=') and XBOX_NAME_RE.search(line) for line in f)
    except OSError:
        return False


def _adb_quest_ip():
    """WLAN-IP der per USB verbundenen Quest (None ohne adb/Freigabe)."""
    try:
        out = subprocess.run(['adb', 'shell', 'ip', '-4', 'addr', 'show', 'wlan0'],
                             capture_output=True, text=True, timeout=3).stdout
    except (OSError, subprocess.SubprocessError):
        return None
    m = re.search(r'inet (\d+\.\d+\.\d+\.\d+)', out)
    return m.group(1) if m else None


def _ping(ip):
    try:
        return subprocess.run(['ping', '-c', '1', '-W', '1', ip], stdout=subprocess.DEVNULL,
                              stderr=subprocess.DEVNULL, timeout=3).returncode == 0
    except (OSError, subprocess.SubprocessError):
        return False


class HeaderStatus:
    """Prueft im Hintergrund, solange die UI fragt; Anfragen bekommen den letzten Stand."""

    def __init__(self):
        self._lock = threading.Lock()
        self._state = None
        self._last_request = 0.0
        self._thread = None
        self._quest_ip = os.environ.get('QUEST_IP') or self._load_quest_ip()
        self._quest_ip_checked = 0.0

    @staticmethod
    def _load_quest_ip():
        try:
            with open(QUEST_IP_CACHE) as f:
                return f.read().strip() or None
        except OSError:
            return None

    def _remember_quest_ip(self, ip):
        if ip == self._quest_ip:
            return
        self._quest_ip = ip
        try:
            os.makedirs(os.path.dirname(QUEST_IP_CACHE), exist_ok=True)
            with open(QUEST_IP_CACHE, 'w') as f:
                f.write(ip)
        except OSError:
            pass

    def get(self):
        with self._lock:
            self._last_request = time.time()
            if self._thread is None or not self._thread.is_alive():
                self._thread = threading.Thread(target=self._run, daemon=True)
                self._thread.start()
            state = self._state
        return state if state is not None else self._collect()

    def _run(self):
        while time.time() - self._last_request < STATUS_IDLE_S:
            state = self._collect()
            with self._lock:
                self._state = state
            time.sleep(STATUS_POLL_S)
        with self._lock:
            self._state = None

    def _collect(self):
        quest_usb = _quest_on_usb()
        # IP ueber USB nachlesen (bei Aenderung gemerkt) - danach klappt die
        # WLAN-Erkennung auch ohne Kabel.
        if quest_usb and time.time() - self._quest_ip_checked > 30.0:
            self._quest_ip_checked = time.time()
            ip = _adb_quest_ip()
            if ip:
                self._remember_quest_ip(ip)
        quest_ip = self._quest_ip
        return {
            'ports': {str(p): _tcp_open('127.0.0.1', p, 0.3) for p in HEADER_PORTS},
            'env': {
                'ros_domain_id': os.environ.get('ROS_DOMAIN_ID', '0'),
                'rmw_implementation': os.environ.get('RMW_IMPLEMENTATION', ''),
                'localhost_only': os.environ.get('ROS_LOCALHOST_ONLY', '0'),
            },
            'quest': {'usb': quest_usb, 'wlan': bool(quest_ip) and _ping(quest_ip), 'ip': quest_ip},
            'xbox': {'connected': _xbox_connected()},
            'tobii': {'online': _tcp_open(TOBII_IP, TOBII_RTSP_PORT, 0.5), 'ip': TOBII_IP},
        }


HEADER_STATUS = HeaderStatus()


# ── CPU-/GPU-Last (SYSTEM-Tab im Viewport) ──────────────────────────────────
LOAD_POLL_S = 1.0
LOAD_IDLE_S = 10.0                  # ohne Abfrage kein nvidia-smi mehr


def _cpu_times():
    """(busy, total) aus der Sammelzeile von /proc/stat."""
    try:
        with open('/proc/stat') as f:
            vals = [int(v) for v in f.readline().split()[1:]]
    except (OSError, ValueError):
        return None
    idle = vals[3] + (vals[4] if len(vals) > 4 else 0)   # idle + iowait
    total = sum(vals[:8])                                # ohne guest (steckt in user)
    return total - idle, total


def _gpu_sample():
    """Auslastung der ersten NVIDIA-GPU (None ohne nvidia-smi)."""
    try:
        out = subprocess.run(
            ['nvidia-smi', '--query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu,name',
             '--format=csv,noheader,nounits', '-i', '0'],
            capture_output=True, text=True, timeout=2).stdout
        util, mem_used, mem_total, temp, name = [v.strip() for v in out.strip().split(',', 4)]
        return {'util': float(util), 'mem_used': float(mem_used), 'mem_total': float(mem_total),
                'temp': float(temp), 'name': name}
    except (OSError, subprocess.SubprocessError, ValueError):
        return None


class SysLoad:
    """Misst im Hintergrund, solange die UI fragt; Anfragen bekommen den letzten Stand."""

    def __init__(self):
        self._lock = threading.Lock()
        self._state = {'cpu': None, 'gpu': None}
        self._last_request = 0.0
        self._thread = None

    def get(self):
        with self._lock:
            self._last_request = time.time()
            if self._thread is None or not self._thread.is_alive():
                self._thread = threading.Thread(target=self._run, daemon=True)
                self._thread.start()
            return dict(self._state)

    def _run(self):
        prev = _cpu_times()
        while time.time() - self._last_request < LOAD_IDLE_S:
            time.sleep(LOAD_POLL_S)
            cur = _cpu_times()
            cpu = None
            if prev and cur and cur[1] > prev[1]:
                cpu = round(100.0 * (cur[0] - prev[0]) / (cur[1] - prev[1]), 1)
            prev = cur
            state = {'cpu': cpu, 'cores': os.cpu_count(), 'gpu': _gpu_sample(), 'ts': time.time()}
            with self._lock:
                self._state = state
        with self._lock:
            self._state = {'cpu': None, 'gpu': None}


SYS_LOAD = SysLoad()


# ── Fest gespeicherte TF-Tuner-Werte ─────────────────────────────────────────
TF_TUNER_FILE = os.path.expanduser('~/.config/robot_control_ui/tf_tuner.json')
TF_TUNER_FIELDS = ('x', 'y', 'z', 'roll', 'pitch', 'yaw', 'radius')
TF_TUNER_MAX_BODY = 64 * 1024        # gilt fuer alle POST-Endpunkte
TF_TUNER_LOCK = threading.Lock()


def load_tf_tuner():
    try:
        with open(TF_TUNER_FILE, encoding='utf-8') as f:
            data = json.load(f)
    except (OSError, ValueError):
        return {}
    if not isinstance(data, dict):
        return {}
    # Aelteres Format: {"rev", "client", "elements": {...}}
    values = clean_tf_tuner_values(data.get('values', data.get('elements')))
    return {'values': values, 'saved_at': data.get('saved_at', data.get('rev'))} if values else {}


def clean_tf_tuner_values(values):
    """Nur Elementname -> {Feld: endliche Zahl}; alles andere faellt weg."""
    if not isinstance(values, dict):
        return None
    out = {}
    for name, vals in values.items():
        if not isinstance(name, str) or len(name) > 64 or not isinstance(vals, dict):
            continue
        clean = {f: float(vals[f]) for f in TF_TUNER_FIELDS
                 if isinstance(vals.get(f), (int, float)) and not isinstance(vals.get(f), bool)
                 and abs(float(vals[f])) < 1e6}
        if clean:
            out[name] = clean
    return out or None


def save_tf_tuner(values):
    data = {'values': values, 'saved_at': time.time()}
    os.makedirs(os.path.dirname(TF_TUNER_FILE), exist_ok=True)
    tmp = TF_TUNER_FILE + '.tmp'
    with TF_TUNER_LOCK:
        with open(tmp, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        os.replace(tmp, TF_TUNER_FILE)
    return data


# ── Fest gespeicherte UI-Einstellungen (Settings-Section) ─────────────────────
# Nur bekannte Gruppen/Felder - alles andere faellt weg. Feldtypen:
#   (min, max)  Zahl, auf den Bereich begrenzt
#   bool        True/False
#   FRAMES      Liste von Frame-Namen (TF/URDF), hoechstens 64
#   ORDER       Reihenfolge der Gruppen in der Section (ids aus SETTINGS_GROUP_IDS)
# Neue Einstellungen hier und in js/settings.js eintragen.
SETTINGS_FILE = os.path.expanduser('~/.config/robot_control_ui/settings.json')
FRAMES = 'frames'
ORDER = 'order'
SETTINGS_GROUP_IDS = ('tf', 'gizmo', 'axes')
FRAME_NAME_RE = re.compile(r'^[A-Za-z0-9_./-]{1,64}$')
SETTINGS_SCHEMA = {
    'gizmo': {'length': (0.5, 2.5), 'thickness': (1.0, 10.0), 'opacity': (0.1, 1.0)},
    'axes': {'enabled': bool, 'labels': bool, 'on_top': bool,
             'length': (0.01, 0.3), 'thickness': (0.0, 10.0), 'opacity': (0.1, 1.0),
             'frames': FRAMES},
    'layout': {'order': ORDER},
}
SETTINGS_LOCK = threading.Lock()


def _clean_field(kind, v):
    """Bereinigter Wert oder None, wenn er nicht zum Feldtyp passt."""
    if kind is bool:
        return v if isinstance(v, bool) else None
    if kind == FRAMES:
        if not isinstance(v, list):
            return None
        names = [n for n in v if isinstance(n, str) and FRAME_NAME_RE.match(n)]
        return list(dict.fromkeys(names))[:64]
    if kind == ORDER:
        if not isinstance(v, list):
            return None
        ids = [g for g in v if isinstance(g, str) and g in SETTINGS_GROUP_IDS]
        return list(dict.fromkeys(ids)) or None
    lo, hi = kind
    if isinstance(v, (int, float)) and not isinstance(v, bool) and abs(float(v)) < 1e6:
        return min(hi, max(lo, float(v)))
    return None


def clean_settings(data):
    if not isinstance(data, dict):
        return None
    out = {}
    for group, fields in SETTINGS_SCHEMA.items():
        vals = data.get(group)
        if not isinstance(vals, dict):
            continue
        clean = {}
        for f, kind in fields.items():
            v = _clean_field(kind, vals.get(f))
            if v is not None:
                clean[f] = v
        if clean:
            out[group] = clean
    return out or None


def load_settings():
    try:
        with open(SETTINGS_FILE, encoding='utf-8') as f:
            data = json.load(f)
    except (OSError, ValueError):
        return {}
    settings = clean_settings(data.get('settings') if isinstance(data, dict) else None)
    return {'settings': settings, 'saved_at': data.get('saved_at')} if settings else {}


def save_settings(settings):
    # Gruppen, die der Client nicht mitschickt, bleiben wie gespeichert.
    merged = dict(load_settings().get('settings') or {})
    merged.update(settings)
    data = {'settings': merged, 'saved_at': time.time()}
    os.makedirs(os.path.dirname(SETTINGS_FILE), exist_ok=True)
    tmp = SETTINGS_FILE + '.tmp'
    with SETTINGS_LOCK:
        with open(tmp, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        os.replace(tmp, SETTINGS_FILE)
    return data


# POST-Endpunkte: Pfad -> (JSON-Schluessel, Bereinigen, Speichern)
POST_APIS = {
    '/api/tf_tuner': ('values', clean_tf_tuner_values, save_tf_tuner),
    '/api/settings': ('settings', clean_settings, save_settings),
}


class UIRequestHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript',
        '.mjs': 'text/javascript',
    }

    def translate_path(self, path):
        clean_path = path.split('?', 1)[0].split('#', 1)[0]
        norm = posixpath.normpath(clean_path).lstrip('/')
        if norm == 'sounds' or norm.startswith('sounds/'):
            candidates = [
                os.path.abspath(os.path.join(self.directory, '..', '..', 'sounds')),
                os.path.join(os.environ.get('ROS2_WS', os.path.expanduser('~/dev_ws')), 'sounds'),
                os.path.expanduser('~/dev_ws/sounds'),
                '/home/mk/dev_ws/sounds',
            ]
            sounds_dir = next((d for d in candidates if os.path.isdir(d)), candidates[0])
            rel = norm[len('sounds'):].lstrip('/')
            return os.path.join(sounds_dir, rel)
        return super().translate_path(path)

    def end_headers(self):
        path = self.path.split('?', 1)[0]
        if path.endswith('/') or path.endswith(NO_STORE_EXT):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        elif path.endswith(REVALIDATE_EXT):
            self.send_header('Cache-Control', 'no-cache')
            etag = getattr(self, '_etag', None)
            if etag:
                self.send_header('ETag', etag)
        super().end_headers()

    @staticmethod
    def _file_etag(fs_path):
        # Nanosekunden statt der sekundengenauen Last-Modified-Zeit: zwei
        # Speicherungen in derselben Sekunde ergaeben sonst ein falsches 304.
        try:
            st = os.stat(fs_path)
        except OSError:
            return None
        if not os.path.isfile(fs_path):
            return None
        return f'"{st.st_mtime_ns:x}-{st.st_size:x}"'

    def _asset_version(self, rel):
        full = os.path.join(self.directory, rel.lstrip('/'))
        try:
            return str(int(os.path.getmtime(full)))
        except OSError:
            return None

    def _versioned_html(self, text):
        def repl(m):
            ver = self._asset_version(m.group(2))
            if ver is None:
                return m.group(0)
            return f'{m.group(1)}{m.group(2)}?v={ver}{m.group(3)}'
        return ASSET_RE.sub(repl, text)

    def _send_json(self, data, status=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        import io
        return io.BytesIO(body)

    def do_POST(self):
        api = POST_APIS.get(self.path.split('?', 1)[0])
        if not api:
            self.send_error(404)
            return
        key, clean, save = api
        try:
            length = int(self.headers.get('Content-Length') or 0)
        except ValueError:
            length = 0
        if length <= 0 or length > TF_TUNER_MAX_BODY:
            self.send_error(413 if length > TF_TUNER_MAX_BODY else 400)
            return
        try:
            values = clean(json.loads(self.rfile.read(length)).get(key))
        except (ValueError, AttributeError):
            values = None
        if values is None:
            self.send_error(400, f'invalid {key}')
            return
        try:
            data = save(values)
        except OSError as e:
            self.send_error(500, f'save failed: {e}')
            return
        f = self._send_json(data)
        self.wfile.write(f.read())

    def send_head(self):
        path = self.path.split('?', 1)[0]
        if path in ('/api/header_status', '/api/sys_load'):
            return self._send_json(HEADER_STATUS.get() if path == '/api/header_status' else SYS_LOAD.get())
        if path == '/api/tf_tuner':
            return self._send_json(load_tf_tuner())
        if path == '/api/settings':
            return self._send_json(load_settings())
        page = VERSIONED_PAGES.get(path)
        if page:
            full = os.path.join(self.directory, page)
            try:
                with open(full, encoding='utf-8') as f:
                    body = self._versioned_html(f.read()).encode('utf-8')
            except OSError:
                return super().send_head()
            # Die Seite selbst wird immer neu ausgeliefert (kein 304), damit die
            # eingesetzten Versionen stimmen. Sie ist klein.
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            import io
            return io.BytesIO(body)
        self._etag = None
        if path.endswith(REVALIDATE_EXT):
            self._etag = self._file_etag(self.translate_path(self.path))
            inm = self.headers.get('If-None-Match')
            if self._etag and inm:
                tags = [t.strip() for t in inm.split(',')]
                if self._etag in tags or 'W/' + self._etag in tags:
                    self.send_response(304)
                    self.end_headers()
                    return None
        return super().send_head()

    def log_message(self, fmt, *args):
        # Nur Fehler loggen - sonst flutet jeder 304 die Launch-Konsole.
        if args and isinstance(args[1] if len(args) > 1 else None, str) and args[1].startswith(('4', '5')):
            super().log_message(fmt, *args)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8081
    directory = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    handler = functools.partial(UIRequestHandler, directory=directory)
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    with http.server.ThreadingHTTPServer(('', port), handler) as httpd:
        print(f'Robot Control UI: serving {directory} on port {port} (no-cache + auto ?v=)', flush=True)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == '__main__':
    main()
