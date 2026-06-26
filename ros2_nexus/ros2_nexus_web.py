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

import uuid
import signal

app     = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WS_PATH  = os.environ.get("ROS2_WS", "~/dev_ws")

active_processes = {}
global_logs = []
log_id_counter = 1
import time

def _build_ros_script(command: str, ws_path: str) -> str:
    domain_id = os.environ.get("ROS_DOMAIN_ID", "66")
    rmw_impl  = os.environ.get("RMW_IMPLEMENTATION", "rmw_cyclonedds_cpp")
    ros_setup = "source /opt/ros/humble/setup.bash"
    ws_setup  = f"source {ws_path}/install/setup.bash"

    # Identisch mit ros2_nexus.py: alle 4 Teile anzeigen
    display_str = f"{ros_setup} && {ws_setup} && cd {ws_path} && {command}"
    cmd_parts   = [p.strip() for p in display_str.split("&&")]
    formatted_disp = "\n".join(
        f" \033[1;36mCMD:\033[0m \033[1;37m{part}\033[0m" for part in cmd_parts
    )
    safe_disp = formatted_disp.replace('"', '\\"')
    safe_curl_cmd = command.replace('"', '\\"')
    payload_template = '{"event": "$1", "pid": $TERMINAL_PID, "command": "' + safe_curl_cmd + '"}'

    return f"""export ROS_DOMAIN_ID={domain_id}
export RMW_IMPLEMENTATION={rmw_impl}
export ROS_LOCALHOST_ONLY=0
source ~/.bashrc 2>/dev/null || true
{ros_setup} 2>/dev/null || true
{ws_setup} 2>/dev/null || true
cd {ws_path} 2>/dev/null || true
clear
echo -e "\033[1;35mROS 2 Humble aktiv (Domain: {domain_id}, RMW: {rmw_impl})\033[0m"
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


def _build_interactive_script(command: str) -> str:
    domain_id = os.environ.get("ROS_DOMAIN_ID", "66")
    rmw_impl  = os.environ.get("RMW_IMPLEMENTATION", "rmw_cyclonedds_cpp")
    ros_setup = "source /opt/ros/humble/setup.bash"

    # Identisch mit run_interactive_cmd: CMD-Teile anzeigen
    cmd_parts = [p.strip() for p in command.split("&&")]
    formatted_disp = "\n".join(
        f" \033[1;36mCMD:\033[0m \033[1;37m{part}\033[0m" for part in cmd_parts
    )
    safe_disp = formatted_disp.replace('"', '\\"')
    safe_curl_cmd = command.replace('"', '\\"')
    payload_template = '{"event": "$1", "pid": $TERMINAL_PID, "command": "' + safe_curl_cmd + '"}'

    return f"""export ROS_DOMAIN_ID={domain_id}
export RMW_IMPLEMENTATION={rmw_impl}
export ROS_LOCALHOST_ONLY=0
source ~/.bashrc 2>/dev/null || true
{ros_setup} 2>/dev/null || true
clear
echo -e "\033[1;35mROS 2 Humble aktiv (Domain: {domain_id}, RMW: {rmw_impl})\033[0m"
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

@app.route("/icon")
def icon():
    return send_from_directory(BASE_DIR, "ros2_nexus_icon.png")


@app.route("/api/ping")
def ping():
    return jsonify({"ok": True, "version": "Web Edition 1.0"})


@app.route("/api/config", methods=["GET", "POST"])
def api_config():
    import json
    config_path = os.path.join(BASE_DIR, "launcher_config.json")
    if request.method == "POST":
        try:
            new_config = request.get_json(force=True)
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


@app.route("/api/run", methods=["POST"])
def api_run():
    data    = request.get_json(force=True)
    command = data.get("command", "").strip()
    title   = data.get("title", "ROS 2 Terminal")
    ws_path = data.get("ws_path", WS_PATH)
    mode    = data.get("mode", "ros")   # 'ros' | 'interactive' | 'bg'

    if not command:
        return jsonify({"ok": False, "error": "No command provided"}), 400

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
        # Robustly kill all ROS2-related commands and terminal wrappers
        cmd = "pkill -f 'ros2 run'; pkill -f 'ros2 launch'; pkill -f rviz2; pkill -f 'eval.*exec bash'"
        subprocess.Popen(cmd, shell=True)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("NEXUS_PORT", 5000))
    print(f"\n{'═'*54}")
    print(f"  🚀  ROS 2 Nexus  —  Web Edition")
    print(f"{'═'*54}")
    print(f"  Browser:    http://localhost:{port}")
    print(f"  Workspace:  {WS_PATH}")
    print(f"  Terminal:   gnome-terminal (Desktop)")
    print(f"{'═'*54}\n")

    app.run(host="0.0.0.0", port=port, debug=False)
