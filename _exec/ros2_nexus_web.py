#!/usr/bin/env python3
"""
ROS 2 Nexus — Web Edition
Flask-Backend: führt ROS-Befehle in gnome-terminal aus.
Usage: python3 ros2_nexus_web.py
       Browser: http://localhost:5000
"""

from flask import Flask, request, jsonify, send_from_directory
import subprocess
import os
import shlex

app     = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WS_PATH  = os.environ.get("ROS2_WS", "~/dev_ws")


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
{command}
"""


def _open_terminal(script: str, title: str):
    safe = shlex.quote(script)
    subprocess.Popen(
        f'gnome-terminal --title="{title}" -- bash -c \'eval "$1"; exec bash\' _ {safe}',
        shell=True,
    )


# ── Routes ──────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "ros2_nexus_web.html")


@app.route("/icon")
def icon():
    return send_from_directory(BASE_DIR, "ros2_nexus_icon.png")


@app.route("/api/ping")
def ping():
    return jsonify({"ok": True, "version": "Web Edition 1.0"})


@app.route("/api/run", methods=["POST"])
def api_run():
    data    = request.get_json(force=True)
    command = data.get("command", "").strip()
    title   = data.get("title", "ROS 2 Terminal")
    ws_path = data.get("ws_path", WS_PATH)
    mode    = data.get("mode", "ros")   # 'ros' | 'interactive' | 'bg'

    if not command:
        return jsonify({"ok": False, "error": "No command provided"}), 400

    try:
        if mode == "bg":
            env = os.environ.copy()
            env.setdefault("DISPLAY", ":0")
            subprocess.Popen(command, shell=True, env=env)
        elif mode == "interactive":
            _open_terminal(_build_interactive_script(command), title)
        else:
            _open_terminal(_build_ros_script(command, ws_path), title)

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
    print(f"{'═'*54}\n")
    app.run(host="0.0.0.0", port=port, debug=False)
