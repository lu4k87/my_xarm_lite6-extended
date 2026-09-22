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
import shlex
import threading
import sys
import atexit
import json

import uuid
import signal
import re

app     = Flask(__name__)

@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WS_PATH  = os.environ.get("ROS2_WS", os.path.abspath(os.path.join(BASE_DIR, "..")))

active_processes = {}
global_logs = []
log_id_counter = 1
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

def _build_ros_script(command: str, ws_path: str) -> str:
    domain_id = os.environ.get("ROS_DOMAIN_ID", "66")
    rmw_impl  = os.environ.get("RMW_IMPLEMENTATION", "rmw_cyclonedds_cpp")
    localhost_only = os.environ.get("ROS_LOCALHOST_ONLY", "0")
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
export ROS_LOCALHOST_ONLY={localhost_only}
source ~/.bashrc 2>/dev/null || true
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


def _build_interactive_script(command: str) -> str:
    domain_id = os.environ.get("ROS_DOMAIN_ID", "66")
    rmw_impl  = os.environ.get("RMW_IMPLEMENTATION", "rmw_cyclonedds_cpp")
    localhost_only = os.environ.get("ROS_LOCALHOST_ONLY", "0")
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
export ROS_LOCALHOST_ONLY={localhost_only}
source ~/.bashrc 2>/dev/null || true
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
    safe = shlex.quote(script)
    subprocess.Popen(
        f'gnome-terminal --geometry=120x30 --title="{title}" -- bash -c \'eval "$1"; exec bash\' _ {safe}',
        shell=True,
    )


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


@app.route("/api/ping")
@app.route("/api/status")
def ping():
    domain_id = os.environ.get("ROS_DOMAIN_ID", "66")
    rmw_impl  = os.environ.get("RMW_IMPLEMENTATION", "rmw_cyclonedds_cpp")
    localhost_only = os.environ.get("ROS_LOCALHOST_ONLY", "0")
    return jsonify({
        "ok": True,
        "version": "Web Edition 1.0",
        "status": "running",
        "ros_domain_id": domain_id,
        "rmw_implementation": rmw_impl,
        "localhost_only": localhost_only
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


@app.route("/api/run", methods=["POST"])
def api_run():
    data    = request.get_json(force=True)
    command = data.get("command", "").strip()
    title   = data.get("title", "ROS 2 Terminal")
    ws_path = data.get("ws_path", WS_PATH)
    mode    = data.get("mode", "ros")   # 'ros' | 'interactive' | 'bg'

    if not command:
        return jsonify({"ok": False, "error": "No command provided"}), 400

    if "linear_axis" not in command and "linear axis" in title.lower():
        title = re.sub(r'\s*\+\s*Linear\s*Axis', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\s*\(\s*\+\s*Linear\s*Axis\s*\)', '', title, flags=re.IGNORECASE)
        title = re.sub(r'\s*-\s*Linear\s*Axis', '', title, flags=re.IGNORECASE).strip()

    if "robot-control-ui" in command or "http_robot_control_ui" in command:
        ensure_desktop_integration()

    cmd_id = "cmd_" + uuid.uuid4().hex[:8]

    try:
        if mode == "bg":
            env = os.environ.copy()
            env.setdefault("DISPLAY", ":0")
            process = subprocess.Popen(command, shell=True, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT, preexec_fn=os.setsid)
            active_processes[cmd_id] = process
        elif mode == "interactive":
            _open_terminal(_build_interactive_script(command), title)
        else:
            _open_terminal(_build_ros_script(command, ws_path), title)

        return jsonify({"ok": True, "cmd_id": cmd_id})

    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/log_event", methods=["POST"])
def api_log_event():
    global log_id_counter
    try:
        data = request.get_json(force=True)
        data['id'] = log_id_counter
        data['timestamp'] = time.time()
        # strip ANSI escape sequences from command for display in web
        import re
        ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
        data['command'] = ansi_escape.sub('', data.get('command', ''))
        data['command'] = data['command'].replace('CMD: ', '').replace('\n', ' | ')
        log_id_counter += 1
        global_logs.append(data)
        if len(global_logs) > 200:
            global_logs.pop(0)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500

@app.route("/api/logs", methods=["GET"])
def api_logs():
    since = int(request.args.get("since", 0))
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
    app.run(host="0.0.0.0", port=port, debug=False)
