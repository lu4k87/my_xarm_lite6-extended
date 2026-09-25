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

Aufruf: server.py [PORT] [VERZEICHNIS]
"""

import functools
import http.server
import os
import posixpath
import re
import sys

NO_CACHE_EXT = ('.html', '.js', '.mjs', '.css', '.json', '.urdf')
ASSET_RE = re.compile(r'''(\s(?:src|href)=")([^"#?:]+\.(?:js|mjs|css))(?:\?v=[^"]*)?(")''')
# Seiten, deren <script src>/<link href> automatisch ?v=<mtime> bekommen.
VERSIONED_PAGES = {'/': 'index.html', '/index.html': 'index.html', '/vr_mirror.html': 'vr_mirror.html'}


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
