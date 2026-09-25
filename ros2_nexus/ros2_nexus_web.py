#!/usr/bin/env python3
"""
ROS 2 Nexus — Web Edition
Nexus Web Backend: führt ROS-Befehle in gnome-terminal aus.
Usage: python3 ros2_nexus_web.py
       Browser: http://localhost:5000
"""

from flask import Flask, request, jsonify, send_from_directory
import subprocess
import os
import threading
import json

import uuid
import signal
import re

app     = Flask(__name__)

# ── Zugriffsschutz ──────────────────────────────────────────────────────────
# /api/run fuehrt beliebige Shell-Befehle aus. Vorher durfte das jeder im
# Netzwerk (Bind auf 0.0.0.0) und dank "Access-Control-Allow-Origin: *" plus
# get_json(force=True) sogar jede fremde Webseite im Browser dieses Rechners.
# Jetzt gilt: lesen (GET) weiterhin von ueberall, veraendern (POST) nur vom
# eigenen Rechner und nur von der Nexus Webapp selbst. curl aus den
# Nexus-Terminals schickt keinen Origin-Header und bleibt erlaubt.
def _is_loopback(addr):
    return bool(addr) and (addr.startswith("127.") or addr == "::1" or addr == "::ffff:127.0.0.1")


def _is_own_origin(origin):
    m = re.match(r"^https?://([^/:]+)(?::(\d+))?$", origin or "")
    if not m:
        return False
    host, port = m.group(1), m.group(2)
    return (host == "localhost" or host.startswith("127.")) and port == str(app.config.get("NEXUS_PORT", 5000))


@app.before_request
def restrict_mutating_requests():
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return None
    origin = request.headers.get("Origin")
    if not _is_loopback(request.remote_addr) or (origin and not _is_own_origin(origin)):
        return jsonify({"ok": False, "error": "Forbidden: nur lokal aus der Nexus Webapp erlaubt"}), 403
    return None


@app.after_request
def add_cors_headers(response):
    # Nur lesend: die Robot Control UI (Port 8081) fragt /api/status ab.
    if request.method in ("GET", "HEAD"):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET"
    return response

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WS_PATH  = os.environ.get("ROS2_WS", os.path.abspath(os.path.join(BASE_DIR, "..")))

active_processes = {}
global_logs = []
log_id_counter = 1
_log_lock = threading.Lock()
import time

def ensure_desktop_integration():
    """Automatische, benutzernamen-unabhängige Registrierung von Desktop-Dateien und Icons."""
    try:
        home_dir = os.path.expanduser("~")
        ws_dir = os.path.abspath(os.path.join(BASE_DIR, ".."))
        robot_icon_src = os.path.join(ws_dir, "src", "http_robot_control_ui_p8081", "icon.png")
        desktop_dir = os.path.join(home_dir, ".local", "share", "applications")
        icons_dir = os.path.join(home_dir, ".local", "share", "icons")

        os.makedirs(desktop_dir, exist_ok=True)
        os.makedirs(icons_dir, exist_ok=True)

        if os.path.isfile(robot_icon_src):
            robot_desktop_file = os.path.join(desktop_dir, "robot-control-ui.desktop")
            robot_icon_dest = os.path.join(icons_dir, "robot-control-ui.png")
            hicolor_48 = os.path.join(icons_dir, "hicolor", "48x48", "apps", "robot-control-ui.png")

            needs_update = (
                not os.path.isfile(robot_desktop_file)
                or not os.path.isfile(robot_icon_dest)
                or not os.path.isfile(hicolor_48)
                or os.path.getmtime(robot_icon_src) > os.path.getmtime(robot_desktop_file)
            )

            if not needs_update:
                try:
                    with open(robot_desktop_file, "r") as f:
                        if "sh -c" not in f.read():
                            needs_update = True
                except Exception:
                    needs_update = True

            if needs_update:
                import shutil
                from PIL import Image

                shutil.copy2(robot_icon_src, robot_icon_dest)
                im = Image.open(robot_icon_src)
                for s in [16, 24, 32, 48, 64, 128, 256, 512, 1024]:
                    hicolor_dir = os.path.join(icons_dir, "hicolor", f"{s}x{s}", "apps")
                    os.makedirs(hicolor_dir, exist_ok=True)
                    im.resize((s, s), Image.Resampling.LANCZOS).save(
                        os.path.join(hicolor_dir, "robot-control-ui.png"), format="PNG"
                    )

                robot_desktop_content = f"""[Desktop Entry]
Version=1.0
Name=Robot Control UI
GenericName=Robot Control Interface
Comment=xArm Lite6 Web Control Interface
Exec=sh -c 'google-chrome --user-data-dir="{home_dir}/.robot_control_profile" --class="robot-control-ui" --start-maximized --app=http://127.0.0.2:8081/index.html || chromium-browser --user-data-dir="{home_dir}/.robot_control_profile" --class="robot-control-ui" --start-maximized --app=http://127.0.0.2:8081/index.html || xdg-open http://127.0.0.2:8081/index.html'
Icon=robot-control-ui
Terminal=false
Type=Application
Categories=Development;
StartupNotify=true
StartupWMClass=robot-control-ui
"""
                with open(robot_desktop_file, "w") as f:
                    f.write(robot_desktop_content)
                os.chmod(robot_desktop_file, 0o755)

                subprocess.Popen("update-desktop-database ~/.local/share/applications 2>/dev/null || true", shell=True)
                subprocess.Popen("gtk-update-icon-cache -f -t ~/.local/share/icons/hicolor 2>/dev/null || true", shell=True)
    except Exception as e:
        print(f"[Desktop Integration] Notice: {e}")

# Einmalig im Hintergrund beim Start prüfen und sicherstellen
threading.Thread(target=ensure_desktop_integration, daemon=True).start()

def _localhost_only_value(override) -> str:
    # override kommt aus der Popup-Checkbox "Nur localhost (DDS)".
    # None = nicht gesetzt -> Wert aus der Umgebung der Nexus Webapp.
    if override is None:
        return os.environ.get("ROS_LOCALHOST_ONLY", "0")
    return "1" if override else "0"


def _cyclonedds_uri() -> str:
    # Die generierten Skripte sourcen zwar ~/.bashrc, die kehrt in nicht-
    # interaktiven Shells aber sofort zurueck. Ohne diese Config limitiert
    # Cyclone auf lo (kein MULTICAST-Flag) auf ~8 Nodes pro Domain.
    uri = os.environ.get("CYCLONEDDS_URI", "").strip()
    if uri:
        return uri
    default_cfg = os.path.join(BASE_DIR, "cyclonedds.xml")
    return f"file://{default_cfg}" if os.path.isfile(default_cfg) else ""


def _cyclonedds_export_line() -> str:
    uri = _cyclonedds_uri()
    if not uri:
        return ""
    return (
        "# Nicht-interaktive Shells brechen ~/.bashrc frueh ab -> hier explizit setzen\n"
        f'export CYCLONEDDS_URI="{uri}"\n'
    )


def _build_ros_script(command: str, ws_path: str, localhost_only_override=None) -> str:
    domain_id = os.environ.get("ROS_DOMAIN_ID", "66")
    rmw_impl  = os.environ.get("RMW_IMPLEMENTATION", "rmw_cyclonedds_cpp")
    cyclone_export = _cyclonedds_export_line()
    localhost_only = _localhost_only_value(localhost_only_override)
    ros_setup = "source /opt/ros/humble/setup.bash"
    ws_setup  = f"source {ws_path}/install/setup.bash"

    # Identisch mit ros2_nexus.py: alle 4 Teile anzeigen
    display_str = f"{ros_setup} && {ws_setup} && cd {ws_path} && {command}"
    cmd_parts   = [p.strip() for p in display_str.split("&&")]
    formatted_disp = "\n".join(
        f" \033[1;36mCMD:\033[0m \033[1;37m{part}\033[0m" for part in cmd_parts
    )
    safe_disp = formatted_disp.replace('"', '\\"')
    escaped_command_json = json.dumps(command)
    payload_template = '{"event": "$1", "pid": $TERMINAL_PID, "command": ' + escaped_command_json + '}'

    return f"""export ROS_DOMAIN_ID={domain_id}
export RMW_IMPLEMENTATION={rmw_impl}
source ~/.bashrc 2>/dev/null || true
{cyclone_export}# Nach der .bashrc exportieren, sonst setzt deren ROS_LOCALHOST_ONLY=0 den Wert zurueck
export ROS_LOCALHOST_ONLY={localhost_only}
{ros_setup} 2>/dev/null || true
{ws_setup} 2>/dev/null || true
cd {ws_path} 2>/dev/null || true
clear
echo -e "\033[1;35mROS 2 Humble aktiv (Domain: {domain_id}, RMW: {rmw_impl}, Localhost: {localhost_only})\033[0m"
echo -e "\033[36m[Terminal: $(tty) PID: $$]\033[0m"
echo -e "\033[1;33m═══════════════════════════════════════════════════════════\033[0m"
echo -e "{safe_disp}"
echo -e "\033[1;33m═══════════════════════════════════════════════════════════\033[0m\n"
export TERMINAL_PID=$$
send_log() {{
  read -r -d '' PAYLOAD << EOM
{payload_template}
EOM
  curl -s -X POST http://localhost:5000/api/log_event -H "Content-Type: application/json" -d "$PAYLOAD" > /dev/null 2>&1
}}
send_log "start" &
trap 'send_log "stop" &' EXIT
{command}
"""


def _build_interactive_script(command: str, localhost_only_override=None) -> str:
    domain_id = os.environ.get("ROS_DOMAIN_ID", "66")
    rmw_impl  = os.environ.get("RMW_IMPLEMENTATION", "rmw_cyclonedds_cpp")
    cyclone_export = _cyclonedds_export_line()
    localhost_only = _localhost_only_value(localhost_only_override)
    ros_setup = "source /opt/ros/humble/setup.bash"

    # Identisch mit run_interactive_cmd: CMD-Teile anzeigen
    cmd_parts = [p.strip() for p in command.split("&&")]
    formatted_disp = "\n".join(
        f" \033[1;36mCMD:\033[0m \033[1;37m{part}\033[0m" for part in cmd_parts
    )
    safe_disp = formatted_disp.replace('"', '\\"')
    escaped_command_json = json.dumps(command)
    payload_template = '{"event": "$1", "pid": $TERMINAL_PID, "command": ' + escaped_command_json + '}'

    return f"""export ROS_DOMAIN_ID={domain_id}
export RMW_IMPLEMENTATION={rmw_impl}
source ~/.bashrc 2>/dev/null || true
{cyclone_export}# Nach der .bashrc exportieren, sonst setzt deren ROS_LOCALHOST_ONLY=0 den Wert zurueck
export ROS_LOCALHOST_ONLY={localhost_only}
{ros_setup} 2>/dev/null || true
clear
echo -e "\033[1;35mROS 2 Humble aktiv (Domain: {domain_id}, RMW: {rmw_impl}, Localhost: {localhost_only})\033[0m"
echo -e "\033[36m[Terminal: $(tty)  PID: $$]\033[0m"
echo -e "\033[1;33m═══════════════════════════════════════════════════════════\033[0m"
echo -e "{safe_disp}"
echo -e "\033[1;33m═══════════════════════════════════════════════════════════\033[0m\n"
export TERMINAL_PID=$$
send_log() {{
  read -r -d '' PAYLOAD << EOM
{payload_template}
EOM
  curl -s -X POST http://localhost:5000/api/log_event -H "Content-Type: application/json" -d "$PAYLOAD" > /dev/null 2>&1
}}
send_log "start" &
trap 'send_log "stop" &' EXIT
{command}
"""


def _open_terminal(script: str, title: str):
    # Als Argumentliste statt Shell-String: der Titel kommt aus dem Request
    # und landete vorher ungequotet in einer Shell-Zeile.
    subprocess.Popen([
        "gnome-terminal", "--geometry=120x30", f"--title={title}", "--",
        "bash", "-c", 'eval "$1"; exec bash', "_", script,
    ])


# ── Routes ──────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "ros2_nexus_web.html")

@app.route("/ros2_nexus_styles.css")
def styles():
    return send_from_directory(BASE_DIR, "ros2_nexus_styles.css")

@app.route("/ros2_nexus_script.js")
def script():
    return send_from_directory(BASE_DIR, "ros2_nexus_script.js")

@app.route("/ros2_nexus_ui.js")
def ui_script():
    return send_from_directory(BASE_DIR, "ros2_nexus_ui.js")

@app.route("/icon")
def icon():
    return send_from_directory(BASE_DIR, "ros2_nexus_icon.png")

@app.route("/ui_mouse_click.mp3")
def click_sound():
    sounds_dir = os.path.join(WS_PATH, "sounds")
    return send_from_directory(sounds_dir, "ui_mouse_click.mp3")


@app.route("/sounds/<path:filename>")
def serve_sounds(filename):
    sounds_dir = os.path.join(WS_PATH, "sounds")
    return send_from_directory(sounds_dir, filename)


@app.route("/_imgs/<path:filename>")
@app.route("/imgs/<path:filename>")
def serve_imgs(filename):
    imgs_dir = os.path.join(WS_PATH, "_imgs")
    return send_from_directory(imgs_dir, filename)


@app.route("/icons/<path:filename>")
def serve_icons(filename):
    icons_dir = os.path.join(WS_PATH, "_imgs", "icons")
    return send_from_directory(icons_dir, filename)


_net_cache = {"ts": 0.0, "iface": None, "ip": None}


def _default_iface_info():
    # Interface der Default-Route + IPv4. Kurz gecacht, weil /api/status oft
    # gepollt wird und sich das praktisch nie aendert.
    now = time.time()
    if now - _net_cache["ts"] < 10:
        return _net_cache["iface"], _net_cache["ip"]
    iface, ip = None, None
    try:
        with open("/proc/net/route") as f:
            for line in f.readlines()[1:]:
                cols = line.split()
                if len(cols) > 2 and cols[1] == "00000000":
                    iface = cols[0]
                    break
        if iface:
            out = subprocess.run(["ip", "-4", "-o", "addr", "show", iface],
                                 capture_output=True, text=True, timeout=2).stdout
            m = re.search(r"inet (\d+\.\d+\.\d+\.\d+)", out)
            ip = m.group(1) if m else None
    except Exception:
        pass
    _net_cache.update(ts=now, iface=iface, ip=ip)
    return iface, ip


def _iface_bytes(iface):
    try:
        base = f"/sys/class/net/{iface}/statistics"
        with open(f"{base}/tx_bytes") as f_tx, open(f"{base}/rx_bytes") as f_rx:
            return int(f_tx.read()), int(f_rx.read())
    except Exception:
        return None, None


@app.route("/api/ping")
@app.route("/api/status")
def ping():
    domain_id = os.environ.get("ROS_DOMAIN_ID", "66")
    rmw_impl  = os.environ.get("RMW_IMPLEMENTATION", "rmw_cyclonedds_cpp")
    localhost_only = os.environ.get("ROS_LOCALHOST_ONLY", "0")
    iface, ip = _default_iface_info()
    tx_bytes, rx_bytes = _iface_bytes(iface) if iface else (None, None)
    return jsonify({
        "ok": True,
        "version": "Web Edition 1.0",
        "status": "running",
        "ros_domain_id": domain_id,
        "rmw_implementation": rmw_impl,
        "localhost_only": localhost_only,
        "cyclonedds_uri": os.environ.get("CYCLONEDDS_URI", ""),
        "net_iface": iface,
        "net_ip": ip,
        "tx_bytes": tx_bytes,
        "rx_bytes": rx_bytes,
        "ts": time.time()
    })


# ── Normalisierung beim Speichern ───────────────────────────────────────────
# Die Webapp postet bei jedem Popup-Schliessen ihren kompletten Zustand hierher.
# Boolesche Parameterwerte werden dabei einheitlich klein geschrieben
# ("use_gpu:=True" -> "use_gpu:=true"), damit sie nicht je nach Herkunft mal so
# und mal so in der Config landen. ROS 2 akzeptiert beide Schreibweisen, aber
# gemischt ist es in den Action Cards unleserlich.
_BOOL_ARG_RE = re.compile(r"\b([A-Za-z_][A-Za-z0-9_]*:=)(True|False)\b")

# Paket-Umbenennungen. Ein alter Browser-Tab postet seinen kompletten
# window.TABS-Stand zurueck und wuerde laengst korrigierte Namen sonst wieder
# einschleppen. Nur Pakete eintragen, die es nachweislich nicht mehr gibt -
# sonst kaempft die Migration gegen den Nutzer.
#   my_3d_vision_bringup -> robot_vision_cameras_bringup  (Commit 0cf4268b)
_PACKAGE_RENAMES = {
    "my_3d_vision_bringup": "robot_vision_cameras_bringup",
}


def _normalize_cmd(s):
    # Kein "ros2 "-Filter: die gemerkten Checkbox-Zustaende stehen unter
    # Schluesseln wie "use_gpu:=True" ohne Kommando drumherum. Bleiben die
    # gross, findet getSavedArgState() sie nach der Normalisierung des
    # Kommandos nicht mehr wieder und der Zustand geht verloren.
    # Das Muster "name:=True" ist eng genug, um Titel/Beschreibungen nicht
    # zu treffen.
    if not isinstance(s, str):
        return s
    out = _BOOL_ARG_RE.sub(lambda m: m.group(1) + m.group(2).lower(), s)
    for old_pkg, new_pkg in _PACKAGE_RENAMES.items():
        if old_pkg in out:
            out = out.replace(old_pkg, new_pkg)
    return out


def _normalize_config(node):
    if isinstance(node, dict):
        return {_normalize_cmd(k): _normalize_config(v) for k, v in node.items()}
    if isinstance(node, list):
        return [_normalize_config(v) for v in node]
    return _normalize_cmd(node)


@app.route("/api/config", methods=["GET", "POST"])
def api_config():
    import json
    config_path = os.path.join(BASE_DIR, "launcher_config.json")
    if request.method == "POST":
        try:
            new_config = _normalize_config(request.get_json(force=True))
            with open(config_path, "w", encoding="utf-8") as f:
                json.dump(new_config, f, indent=2, ensure_ascii=False)
            return jsonify({"ok": True})
        except Exception as e:
            return jsonify({"ok": False, "error": str(e)}), 500
    else:
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                return jsonify(json.load(f))
        except Exception as e:
            return jsonify({"error": str(e)}), 500


# ── Launch-Argumente der Pakete (fuer die Parameter-Einfaerbung in den
#    Action Cards) ────────────────────────────────────────────────────────────
# Die Launch-Dateien werden statisch geparst statt "ros2 launch --show-args"
# aufzurufen: das waere ein Subprozess pro Datei und braucht ein gesourctes
# Environment. Gesucht wird nach DeclareLaunchArgument / LaunchConfiguration,
# inklusive der transitiv eingebundenen Launch-Dateien.
_LAUNCH_ARGS_CACHE = {"mtime": None, "data": None}

_DECL_RE = re.compile(
    r"(?:DeclareLaunchArgument|LaunchConfiguration|LaunchConfigurationEquals)"
    r"\s*\(\s*['\"]([A-Za-z_][A-Za-z0-9_]*)['\"]",
    re.S,
)
_INCL_RE = re.compile(r"['\"]([a-z0-9_]+\.launch\.py)['\"]")


def _scan_launch_args(ws_path: str):
    """{ "paket/datei.launch.py": [deklarierte Argumente] } fuer den ganzen Workspace."""
    src = os.path.join(ws_path, "src")
    by_name = {}   # dateiname -> [pfade]
    by_pkg = {}    # paket/dateiname -> pfad

    for root, dirs, files in os.walk(src):
        dirs[:] = [d for d in dirs if d not in ("__pycache__", ".git", "build", "install")]
        for fn in files:
            if not fn.endswith(".launch.py"):
                continue
            full = os.path.join(root, fn)
            by_name.setdefault(fn, []).append(full)
            # Paketname = Verzeichnis, das package.xml enthaelt
            d = root
            while d.startswith(src) and not os.path.exists(os.path.join(d, "package.xml")):
                d = os.path.dirname(d)
            if os.path.exists(os.path.join(d, "package.xml")):
                by_pkg[f"{os.path.basename(d)}/{fn}"] = full

    text_cache = {}

    def read(path):
        if path not in text_cache:
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    text_cache[path] = f.read()
            except OSError:
                text_cache[path] = ""
        return text_cache[path]

    def args_of(fn, seen):
        if fn in seen or fn not in by_name:
            return set()
        seen.add(fn)
        out = set()
        for path in by_name[fn]:
            txt = read(path)
            out |= set(_DECL_RE.findall(txt))
            for inc in set(_INCL_RE.findall(txt)):
                if inc != fn:
                    out |= args_of(inc, seen)
        return out

    return {key: sorted(args_of(os.path.basename(key), set())) for key in by_pkg}


@app.route("/api/launch_args", methods=["GET"])
def api_launch_args():
    """Deklarierte Launch-Argumente je Paket/Launch-Datei.

    Das Frontend faerbt damit die Parameter-Chips: bekannt -> wirksam,
    unbekannt -> laeuft ins Leere, Datei nicht gelistet -> Paket/Datei fehlt.
    """
    try:
        src = os.path.join(WS_PATH, "src")
        mtime = os.path.getmtime(src) if os.path.exists(src) else 0
        if _LAUNCH_ARGS_CACHE["mtime"] != mtime or _LAUNCH_ARGS_CACHE["data"] is None:
            _LAUNCH_ARGS_CACHE["data"] = _scan_launch_args(WS_PATH)
            _LAUNCH_ARGS_CACHE["mtime"] = mtime
        return jsonify({"ok": True, "launch_files": _LAUNCH_ARGS_CACHE["data"]})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


# ── Launch-Details fuer die Popups: Standardwerte der Launch-Argumente und
#    die YAML-Configs, die eine Launch-Datei laedt ─────────────────────────────
# Die Argumente werden per ast gelesen (DeclareLaunchArgument und
# LaunchConfiguration(..., default=...)), transitiv ueber eingebundene
# Launch-Dateien - der erste Fund gewinnt, also zaehlt die aeussere Datei.
#
# Welche YAML zu welcher Launch-Datei gehoert und welche Werte daraus fuer
# den Nutzer wichtig sind, steht in _LAUNCH_CONFIGS. "arg" markiert Werte, die
# ein Launch-Argument beim Start ueberschreibt; "when" nennt die Bedingung,
# unter der die Datei ueberhaupt geladen wird.
_SERVO_CONFIG = {
    "pkg": "xarm_moveit_servo", "file": "config/xarm_moveit_servo_config.yaml",
    "title": "MoveIt Servo",
    "keys": [
        {"key": "scale.linear", "label": "Max. Lineargeschw.", "unit": "m/s"},
        {"key": "scale.rotational", "label": "Max. Drehgeschw.", "unit": "rad/s"},
        {"key": "scale.joint", "label": "Joint-Skalierung"},
        {"key": "publish_period", "label": "Publish-Periode", "unit": "s", "hz": True},
        {"key": "incoming_command_timeout", "label": "Befehls-Timeout", "unit": "s"},
        {"key": "low_pass_filter_coeff", "label": "Tiefpass-Koeffizient"},
        {"key": "check_collisions", "label": "Kollisionsprüfung"},
        {"key": "collision_check_rate", "label": "Kollisions-Rate", "unit": "Hz"},
        {"key": "scene_collision_proximity_threshold", "label": "Mindestabstand Szene", "unit": "m"},
        {"key": "self_collision_proximity_threshold", "label": "Mindestabstand Eigenkollision", "unit": "m"},
        {"key": "lower_singularity_threshold", "label": "Singularität: bremsen"},
        {"key": "hard_stop_singularity_threshold", "label": "Singularität: Stopp"},
    ],
    "overridden": {
        "move_group_name": "setzt der Launch auf die Lite-6-Gruppe",
        "command_out_topic": "setzt der Launch auf den Lite-6-Trajectory-Controller",
    },
}

_WHISPER_CONFIGS = [
    {
        "pkg": "whisper_server", "file": "config/whisper.yaml", "title": "Whisper",
        "keys": [
            {"key": "whisper.inference.ros__parameters.model_name", "label": "Modell", "arg": "model_name"},
            {"key": "whisper.inference.ros__parameters.wparams.language", "label": "Sprache", "arg": "language"},
            {"key": "whisper.inference.ros__parameters.wparams.n_threads", "label": "Threads"},
            {"key": "whisper.inference.ros__parameters.wparams.beam_size", "label": "Beam Size"},
            {"key": "whisper.inference.ros__parameters.callback_ms", "label": "Inferenz-Takt", "unit": "ms"},
            {"key": "whisper.inference.ros__parameters.buffer_capacity", "label": "Audio-Puffer", "unit": "s"},
            {"key": "whisper.inference.ros__parameters.listen_window_ms", "label": "Hörfenster", "unit": "ms"},
            {"key": "whisper.inference.ros__parameters.cparams.use_gpu", "label": "GPU", "arg": "use_gpu"},
        ],
    },
    {
        "pkg": "whisper_server", "file": "config/whisper_cpu.yaml", "title": "Whisper CPU-Profil",
        "when": {"arg": "use_gpu", "equals": "false"},
        "keys": [
            {"key": "whisper.inference.ros__parameters.model_name", "label": "Modell", "arg": "model_name"},
            {"key": "whisper.inference.ros__parameters.wparams.n_threads", "label": "Threads"},
            {"key": "whisper.inference.ros__parameters.wparams.audio_ctx", "label": "Audio-Kontext"},
        ],
    },
]

_LAUNCH_CONFIGS = {
    "xarm_moveit_servo/lite6_moveit_servo_realmove.launch.py": [_SERVO_CONFIG],
    "xarm_moveit_servo/lite6_moveit_servo_fake.launch.py": [_SERVO_CONFIG],
    "robot_vision_cameras_bringup/robot_vision_cameras_bringup.launch.py": [
        {
            "pkg": "robot_vision_cameras_bringup", "file": "config/perception_params.yaml",
            "title": "YOLO-Erkennung (ZED)", "when": {"arg": "camera", "equals": "zed_m"},
            "keys": [
                {"key": "yolo_3d_bbox_for_zed_m.ros__parameters.model_path", "label": "Modell", "arg": "yolo_model"},
                {"key": "yolo_3d_bbox_for_zed_m.ros__parameters.confidence_threshold", "label": "Konfidenz-Schwelle", "arg": "confidence_threshold"},
                {"key": "yolo_3d_bbox_for_zed_m.ros__parameters.ema_alpha", "label": "Glättung (EMA)", "arg": "ema_alpha"},
            ],
        },
        {
            "pkg": "robot_vision_cameras_bringup", "file": "config/grasping_params.yaml",
            "title": "Greifen",
            "keys": [
                {"key": "yolo_planned_grasp_executor.ros__parameters.safe_z_hover_height", "label": "Hover-Höhe", "unit": "m", "arg": "safe_z_hover_height"},
                {"key": "yolo_planned_grasp_executor.ros__parameters.grasp_z_offset", "label": "Greif-Offset Z", "unit": "m", "arg": "grasp_z_offset"},
                {"key": "yolo_planned_grasp_executor.ros__parameters.velocity_scaling", "label": "Geschw.-Skalierung", "arg": "velocity_scaling"},
                {"key": "yolo_planned_grasp_executor.ros__parameters.acceleration_scaling", "label": "Beschl.-Skalierung", "arg": "acceleration_scaling"},
                {"key": "yolo_planned_grasp_executor.ros__parameters.target_roll", "label": "Ziel-Roll", "unit": "rad"},
                {"key": "yolo_planned_grasp_executor.ros__parameters.target_pitch", "label": "Ziel-Pitch", "unit": "rad"},
                {"key": "yolo_planned_grasp_executor.ros__parameters.target_yaw", "label": "Ziel-Yaw", "unit": "rad"},
                {"key": "yolo_planned_grasp_executor.ros__parameters.ik_tolerance_position", "label": "IK-Toleranz Position", "unit": "m"},
            ],
        },
        {
            "pkg": "robot_vision_cameras_bringup", "file": "config/zed_override.yaml",
            "title": "ZED-Kamera", "when": {"arg": "camera", "equals": "zed_m"},
            "keys": [
                {"key": "/**.ros__parameters.general.grab_resolution", "label": "Auflösung"},
                {"key": "/**.ros__parameters.depth.depth_mode", "label": "Tiefenmodus"},
                {"key": "/**.ros__parameters.depth.depth_confidence", "label": "Tiefen-Konfidenz"},
                {"key": "/**.ros__parameters.depth.min_depth", "label": "Min. Tiefe", "unit": "m"},
                {"key": "/**.ros__parameters.depth.max_depth", "label": "Max. Tiefe", "unit": "m"},
            ],
        },
    ],
    "voice_command_listener/voice_listener.launch.py": _WHISPER_CONFIGS,
    "whisper_bringup/bringup.launch.py": _WHISPER_CONFIGS,
}

def _package_dirs(src):
    """{ paketname: verzeichnis } fuer alle Pakete unter src/."""
    out = {}
    for root, dirs, files in os.walk(src):
        dirs[:] = [d for d in dirs if d not in ("__pycache__", ".git", "build", "install")]
        if "package.xml" in files:
            out.setdefault(os.path.basename(root), root)
    return out


def _literal(node):
    import ast
    try:
        return ast.literal_eval(node)
    except Exception:
        return None


def _parse_launch_file_args(path):
    """{ name: {default, description, choices} } einer Launch-Datei (ast)."""
    import ast
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            tree = ast.parse(f.read())
    except (OSError, SyntaxError, ValueError):
        return {}
    out = {}
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        fn = node.func.id if isinstance(node.func, ast.Name) else getattr(node.func, "attr", "")
        if fn not in ("DeclareLaunchArgument", "LaunchConfiguration") or not node.args:
            continue
        name = _literal(node.args[0])
        if not isinstance(name, str):
            continue
        kw = {k.arg: k.value for k in node.keywords if k.arg}
        entry = out.setdefault(name, {})
        if fn == "DeclareLaunchArgument":
            default = _literal(kw["default_value"]) if "default_value" in kw else None
            if default is not None:
                entry["default"] = str(default)
            desc = _literal(kw["description"]) if "description" in kw else None
            if isinstance(desc, str):
                entry["description"] = desc
            choices = _literal(kw["choices"]) if "choices" in kw else None
            if isinstance(choices, (list, tuple)):
                entry["choices"] = [str(c) for c in choices]
        elif "default" in kw and "default" not in entry:
            default = _literal(kw["default"])
            if default is not None:
                entry["default"] = str(default).lower() if isinstance(default, bool) else str(default)
    return out


def _flatten_yaml(node, prefix=""):
    """Verschachteltes YAML -> [(schluessel.pfad, wert)] (Listen als Ganzes)."""
    if isinstance(node, dict):
        out = []
        for k, v in node.items():
            out += _flatten_yaml(v, f"{prefix}.{k}" if prefix else str(k))
        return out
    return [(prefix, node)]


def _config_status(src_path, pkg, rel):
    """Liegt die Datei in install/ als Symlink auf src (sofort wirksam) oder
    als Kopie (wirkt erst nach colcon build)?"""
    inst = os.path.join(WS_PATH, "install", pkg, "share", pkg, rel)
    if not os.path.lexists(inst):
        return "missing"
    if os.path.islink(inst):
        return "linked" if os.path.realpath(inst) == os.path.realpath(src_path) else "copy"
    try:
        with open(inst, "rb") as a, open(src_path, "rb") as b:
            return "copy" if a.read() == b.read() else "stale"
    except OSError:
        return "copy"


def _read_config(spec, pkg_dirs):
    import yaml
    pkg_dir = pkg_dirs.get(spec["pkg"])
    path = os.path.join(pkg_dir, spec["file"]) if pkg_dir else None
    res = {
        "pkg": spec["pkg"], "file": spec["file"], "title": spec.get("title", ""),
        "when": spec.get("when"), "path": path, "values": [], "all": [],
    }
    if not path or not os.path.isfile(path):
        res["error"] = "Datei nicht gefunden"
        return res
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
    except (OSError, yaml.YAMLError) as e:
        res["error"] = f"YAML nicht lesbar: {e}"
        return res
    flat = dict(_flatten_yaml(data))
    for k in spec.get("keys", []):
        if k["key"] in flat:
            res["values"].append(dict(k, value=flat[k["key"]]))
    overridden = spec.get("overridden", {})
    res["all"] = [
        {"key": k, "value": v, **({"note": overridden[k]} if k in overridden else {})}
        for k, v in flat.items()
    ]
    res["status"] = _config_status(path, spec["pkg"], spec["file"])
    res["mtime"] = os.path.getmtime(path)
    return res


def _launch_details(ws_path):
    src = os.path.join(ws_path, "src")
    pkg_dirs = _package_dirs(src)
    # Launch-Dateien nach Dateiname (fuer eingebundene Launches ohne Paketangabe)
    by_name, by_key = {}, {}
    for pkg, d in pkg_dirs.items():
        for root, dirs, files in os.walk(d):
            dirs[:] = [x for x in dirs if x not in ("__pycache__", ".git", "build", "install")]
            for fn in files:
                if fn.endswith(".launch.py"):
                    full = os.path.join(root, fn)
                    by_name.setdefault(fn, []).append(full)
                    by_key.setdefault(f"{pkg}/{fn}", full)

    parsed = {}

    def args_of(path):
        if path not in parsed:
            parsed[path] = _parse_launch_file_args(path)
        return parsed[path]

    def collect(path, seen):
        if path in seen:
            return {}
        seen.add(path)
        out = dict(args_of(path))
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                includes = set(_INCL_RE.findall(f.read()))
        except OSError:
            includes = set()
        for inc in includes:
            for inc_path in by_name.get(inc, []):
                for name, info in collect(inc_path, seen).items():
                    merged = out.setdefault(name, {})
                    for field, val in info.items():
                        merged.setdefault(field, val)
        return out

    launch = {}
    for key in set(_LAUNCH_CONFIGS) | set(by_key):
        path = by_key.get(key)
        if not path:
            continue
        entry = {"args": collect(path, set())}
        if key in _LAUNCH_CONFIGS:
            entry["configs"] = [_read_config(spec, pkg_dirs) for spec in _LAUNCH_CONFIGS[key]]
        launch[key] = entry
    return launch


@app.route("/api/launch_details", methods=["GET"])
def api_launch_details():
    """Launch-Argumente (Standard, Beschreibung, Auswahl) und YAML-Configs
    der Popup-Launches. Frisch gelesen, damit Aenderungen an einer YAML
    beim naechsten Oeffnen des Popups sichtbar sind."""
    try:
        return jsonify({"ok": True, "launch": _launch_details(WS_PATH)})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


def _reap_finished_processes():
    # Beendete Hintergrundprozesse einsammeln - sonst bleiben sie als Zombies
    # stehen und active_processes waechst mit jedem Start weiter.
    for cid, proc in list(active_processes.items()):
        if proc.poll() is not None:
            active_processes.pop(cid, None)


@app.route("/api/run", methods=["POST"])
def api_run():
    data    = request.get_json(force=True)
    command = data.get("command", "").strip()
    title   = data.get("title", "ROS 2 Terminal")
    ws_path = data.get("ws_path", WS_PATH)
    mode    = data.get("mode", "ros")   # 'ros' | 'interactive' | 'bg'
    localhost_only = data.get("localhost_only")   # None | bool (Popup-Checkbox)

    if not command:
        return jsonify({"ok": False, "error": "No command provided"}), 400

    if "linear_axis" not in command and "linear axis" in title.lower():
        title = re.sub(r'\s*\+\s*Linear\s*Axis', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\s*\(\s*\+\s*Linear\s*Axis\s*\)', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\s*-\s*Linear\s*Axis', '', title, flags=re.IGNORECASE).strip()

    if "robot-control-ui" in command or "http_robot_control_ui" in command:
        ensure_desktop_integration()

    cmd_id = "cmd_" + uuid.uuid4().hex[:8]
    _reap_finished_processes()

    try:
        if mode == "bg":
            env = os.environ.copy()
            env.setdefault("DISPLAY", ":0")
            if localhost_only is not None:
                env["ROS_LOCALHOST_ONLY"] = "1" if localhost_only else "0"
            process = subprocess.Popen(command, shell=True, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT, preexec_fn=os.setsid)
            active_processes[cmd_id] = process
        elif mode == "interactive":
            _open_terminal(_build_interactive_script(command, localhost_only), title)
        else:
            _open_terminal(_build_ros_script(command, ws_path, localhost_only), title)

        return jsonify({"ok": True, "cmd_id": cmd_id})

    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/log_event", methods=["POST"])
def api_log_event():
    global log_id_counter
    try:
        data = request.get_json(force=True)
        # strip ANSI escape sequences from command for display in web
        ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
        data['command'] = ansi_escape.sub('', data.get('command', ''))
        data['command'] = data['command'].replace('CMD: ', '').replace('\n', ' | ')
        # Flask bedient Requests in Threads: Zaehler und Liste nur unter Lock
        # anfassen, sonst koennen zwei Eintraege dieselbe ID bekommen.
        with _log_lock:
            data['id'] = log_id_counter
            data['timestamp'] = time.time()
            log_id_counter += 1
            global_logs.append(data)
            if len(global_logs) > 200:
                global_logs.pop(0)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@app.route("/api/logs", methods=["GET"])
def api_logs():
    try:
        since = int(request.args.get("since", 0))
    except (TypeError, ValueError):
        since = 0
    with _log_lock:
        new_logs = [l for l in global_logs if l['id'] > since]
    return jsonify({"ok": True, "logs": new_logs})

@app.route("/api/kill", methods=["POST"])
def api_kill():
    data = request.get_json(force=True)
    cmd_id = data.get("cmd_id")
    if cmd_id in active_processes:
        proc = active_processes[cmd_id]
        try:
            pgid = os.getpgid(proc.pid)
            os.killpg(pgid, signal.SIGKILL)
        except Exception:
            proc.kill()
        active_processes.pop(cmd_id, None)
        return jsonify({"ok": True})
    return jsonify({"ok": False, "error": "Process not found"})

@app.route("/api/kill_all", methods=["POST"])
def api_kill_all():
    # Kill all running Nexus Web Backends in 1 second
    subprocess.Popen("sleep 1 && pkill -f 'ros2_nexus_web.py'", shell=True)
    return jsonify({"ok": True, "msg": "Alle Prozesse werden beendet."})

@app.route("/api/kill_all_ros2", methods=["POST"])
def api_kill_all_ros2():
    try:
        # Robustly kill all ROS2-related commands and terminal wrappers using dedicated script
        script_path = os.path.join(BASE_DIR, "kill_ros2.sh")
        os.system(f"bash {script_path}")
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("NEXUS_PORT", 5000))
    app.config["NEXUS_PORT"] = port
    app.run(host="0.0.0.0", port=port, debug=False)
