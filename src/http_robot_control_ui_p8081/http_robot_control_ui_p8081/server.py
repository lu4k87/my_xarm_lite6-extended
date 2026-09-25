#!/usr/bin/env python3
"""Webserver der Robot Control UI (Port 8081) mit automatischem Cache-Busting.

Ersetzt `python3 -m http.server`. Zwei Dinge sind anders:

1. HTML, JS, CSS und JSON gehen mit `Cache-Control: no-cache` raus. Der Browser
   behaelt die Dateien, fragt aber bei jedem Laden per If-Modified-Since nach -
   unveraendert kommt ein 304 ohne Inhalt, geaendert sofort die neue Fassung.
   Das gilt auch fuer Dateien, die per ES-Modul-`import` nachgeladen werden und
   deshalb keinen ?v=-Parameter bekommen koennen.
2. In index.html (und vr_mirror.html) bekommt jedes lokale <script src> und <link href> auf eine
   .js/.css-Datei ein `?v=<Aenderungszeit>`. Das manuelle Hochzaehlen von
   ?v=28 usw. entfaellt.
3. `/api/header_status` liefert den Zustand fuer die Header-Badges (Ports,
   Quest 3, Xbox, Tobii, ROS-Umgebung). Geprueft wird hier auf dem PC: der
   Browser selbst darf aus der HTTPS-Seite (8443, Quest) keine HTTP-Ports
   abfragen und sieht keine USB-Geraete.

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

NO_CACHE_EXT = ('.html', '.js', '.mjs', '.css', '.json', '.urdf')
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
        if path.endswith('/') or path.endswith(NO_CACHE_EXT):
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
        super().end_headers()

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

    def send_head(self):
        path = self.path.split('?', 1)[0]
        if path == '/api/header_status':
            body = json.dumps(HEADER_STATUS.get()).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            import io
            return io.BytesIO(body)
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
