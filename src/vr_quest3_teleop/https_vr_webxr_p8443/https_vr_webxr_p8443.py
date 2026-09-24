#!/usr/bin/env python3
"""HTTPS-Server fuer die Meta Quest 3 (Port 8443).

WebXR laeuft im Quest-Browser nur in einem sicheren Kontext (HTTPS). Der
Server liefert deshalb:

* ``/`` bzw. ``/index.html`` und alle Assets: die Robot Control UI
  (src/http_robot_control_ui_p8081) - dieselben Dateien wie auf Port 8081,
  inklusive VR-Viewport (js/twin/xr.js). Ueber HTTPS verbindet sich die UI
  selbst mit der SSL-rosbridge auf 9091.
* ``/controller_reader.html``: die alte reine Controller-Seite (Diagnose).

Fuer die UI wird der Request-Handler aus deren server.py wiederverwendet
(no-cache-Header, automatische ?v=-Versionen, /sounds).
"""
import functools
import http.server
import importlib.util
import os
import posixpath
import ssl
import sys
import time

PORT = 8443
HERE = os.path.dirname(os.path.abspath(__file__))
LOCAL_FILES = ('controller_reader.html',)


def find_ui_dir():
    ws_root = os.environ.get('ROS2_WS', os.path.expanduser('~/dev_ws'))
    for d in (os.path.join(ws_root, 'src', 'http_robot_control_ui_p8081'),
              os.path.expanduser('~/dev_ws/src/http_robot_control_ui_p8081')):
        if os.path.isfile(os.path.join(d, 'index.html')):
            return d
    return None


def load_ui_handler(ui_dir):
    """UIRequestHandler aus der server.py der Robot Control UI laden."""
    path = os.path.join(ui_dir, 'http_robot_control_ui_p8081', 'server.py')
    spec = importlib.util.spec_from_file_location('robot_control_ui_server', path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.UIRequestHandler


def make_handler(ui_dir):
    if ui_dir is None:
        print('WARNING: Robot Control UI nicht gefunden - nur controller_reader.html verfuegbar.')

        class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
            def end_headers(self):
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                super().end_headers()
        return functools.partial(NoCacheHandler, directory=HERE)

    base = load_ui_handler(ui_dir)

    class VRRequestHandler(base):
        def translate_path(self, path):
            clean = posixpath.normpath(path.split('?', 1)[0].split('#', 1)[0]).lstrip('/')
            if clean in LOCAL_FILES:
                return os.path.join(HERE, clean)
            return super().translate_path(path)

    return functools.partial(VRRequestHandler, directory=ui_dir)


def main():
    ui_dir = find_ui_dir()
    handler = make_handler(ui_dir)

    http.server.ThreadingHTTPServer.allow_reuse_address = True
    httpd = None
    for attempt in range(5):
        try:
            httpd = http.server.ThreadingHTTPServer(('0.0.0.0', PORT), handler)
            break
        except OSError:
            print(f'Port {PORT} in use (attempt {attempt + 1}/5). Retrying in 1s...')
            time.sleep(1)

    if not httpd:
        print(f'ERROR: Could not bind HTTPServer to port {PORT} after 5 attempts.')
        sys.exit(1)

    ws_root = os.environ.get('ROS2_WS', os.path.expanduser('~/dev_ws'))
    cert_path = os.path.join(ws_root, 'certs', 'cert.pem')
    key_path = os.path.join(ws_root, 'certs', 'key.pem')
    if not os.path.exists(cert_path):
        cert_path = os.path.expanduser('~/dev_ws/certs/cert.pem')
        key_path = os.path.expanduser('~/dev_ws/certs/key.pem')

    if os.path.exists(cert_path) and os.path.exists(key_path):
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(certfile=cert_path, keyfile=key_path)
        httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
        print(f'Serving HTTPS on https://0.0.0.0:{PORT}/ (Robot Control UI + VR)')
        print(f'                 https://0.0.0.0:{PORT}/controller_reader.html')
    else:
        print(f'WARNING: cert.pem or key.pem not found at {cert_path}. Serving plain HTTP on port {PORT} (kein WebXR!).')

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()


if __name__ == '__main__':
    main()
