import tkinter as tk
from tkinter import ttk
import subprocess
import sys
import os

def run_cmd(command, title="ROS 2 Terminal", ws_path="~/dev_ws"):
    """Führt einen Befehl aus und druckt ihn vorher gut lesbar ins Terminal."""
    source_cmd = f"source /opt/ros/humble/setup.bash && source {ws_path}/install/setup.bash 2>/dev/null || true"
    display_cmd = f"echo -e '\\033[1;36m[GUI] Befehl:\\033[0m {command}\\n'"
    full_command = f"cd {ws_path} 2>/dev/null || true && {source_cmd} && {display_cmd} && {command}"
    terminal_cmd = f'gnome-terminal --title="{title}" -- bash -i -c "{full_command}; exec bash"'
    subprocess.Popen(terminal_cmd, shell=True)

def run_interactive_cmd(command, title="System Tool"):
    """Für Befehle, die interaktive Eingaben im Terminal erfordern."""
    terminal_cmd = f'gnome-terminal --title="{title}" -- bash -i -c "{command}; exec bash"'
    subprocess.Popen(terminal_cmd, shell=True)

def run_bg_cmd(command):
    """Führt Befehle im Hintergrund ohne sichtbares Terminal aus."""
    subprocess.Popen(command, shell=True)

def open_editor():
    """Öffnet dieses Skript direkt in Nano."""
    cmd = 'gnome-terminal --title="[EDIT] GUI Code" -- bash -c "nano /home/$USER/dev_ws/ros2_gui_cmds.py; exec bash"'
    subprocess.Popen(cmd, shell=True)

def reload_app():
    """Startet das Python-Skript neu."""
    python = sys.executable
    os.execl(python, python, *sys.argv)

# Hauptfenster
root = tk.Tk()
root.title("ROS 2 Master Control")
root.geometry("650x850") # Etwas höher gemacht für die neuen Buttons

# ==========================================
# MODERNES STYLING (Dracula Dark Theme)
# ==========================================
bg_main = "#282A36"
bg_surface = "#44475A"
fg_text = "#F8F8F2"
fg_muted = "#6272A4"
accent_cyan = "#8BE9FD"
accent_pink = "#FF79C6"
accent_green = "#50FA7B"
border_col = "#6272A4"

root.configure(bg=bg_main)
style = ttk.Style()
style.theme_use('clam')

# Basis-Konfiguration
style.configure(".", background=bg_main, foreground=fg_text, font=("Segoe UI", 10))

# Tabs
style.configure("TNotebook", background=bg_main, borderwidth=0)
style.configure("TNotebook.Tab", font=("Segoe UI", 10, "bold"), padding=[15, 10], background=bg_surface, foreground=fg_text, borderwidth=0)
style.map("TNotebook.Tab", background=[("selected", bg_main)], foreground=[("selected", accent_cyan)], expand=[("selected", [0, 0, 0, 0])])

# Buttons
style.configure("TButton", font=("Segoe UI", 10, "bold"), background=bg_surface, foreground=fg_text, borderwidth=1, bordercolor=border_col, padding=8, focuscolor=bg_main)
style.map("TButton", background=[("active", "#6272A4")], foreground=[("active", "#FFFFFF")])

# Spezielle Button-Styles
style.configure("Action.TButton", foreground=accent_pink)
style.map("Action.TButton", background=[("active", accent_pink)], foreground=[("active", bg_main)])

style.configure("Start.TButton", foreground=accent_green)
style.map("Start.TButton", background=[("active", accent_green)], foreground=[("active", bg_main)])

# Text-Labels
style.configure("Header.TLabel", font=("Segoe UI", 12, "bold"), foreground=accent_cyan, background=bg_main, padding=(0, 15, 0, 5))
style.configure("Sub.TLabel", font=("Consolas", 9), foreground=fg_muted, background=bg_main)

# ==========================================
# FOOTER: Skript bearbeiten & Reload
# ==========================================
footer_frame = ttk.Frame(root)
footer_frame.pack(side="bottom", fill="x", pady=15, padx=20)

ttk.Separator(footer_frame, orient="horizontal").pack(fill="x", pady=(0, 15))
ttk.Label(footer_frame, text="🛠️ Systemsteuerung", font=("Segoe UI", 11, "bold"), foreground=accent_pink).pack()
ttk.Label(footer_frame, text="~dev_ws/ros2_gui_cmds.py", style="Sub.TLabel").pack(pady=2)

btn_frame = ttk.Frame(footer_frame)
btn_frame.pack(pady=10)
ttk.Button(btn_frame, text="✏️ Code anpassen", command=open_editor).pack(side="left", padx=5)
ttk.Button(btn_frame, text="🔄 App neu laden", command=reload_app, style="Action.TButton").pack(side="left", padx=5)

# ==========================================
# NOTEBOOK (Tabs) 
# ==========================================
notebook = ttk.Notebook(root)
notebook.pack(expand=True, fill="both", side="top", padx=15, pady=10)

def create_tab(name):
    frame = ttk.Frame(notebook, padding=15)
    notebook.add(frame, text=name)
    return frame

# --- TAB 1: ⚡ Daily Tools ---
tab_daily = create_tab("⚡ Daily Tools")

ttk.Label(tab_daily, text="System & Netzwerk", style="Header.TLabel").pack(anchor="w")
ttk.Button(tab_daily, text="🌐 Eigene IP-Adresse anzeigen", command=lambda: run_interactive_cmd("echo -e '\\033[1;32mNetzwerk-Schnittstellen:\\033[0m'; ip -brief address show; echo ''; echo 'Drücke Enter zum Schließen.'; read", "IP Adresse")).pack(fill="x", pady=5)
cmd_find = "read -p 'Welche Datei suchst du? (z.B. *.py oder name.txt): ' filename; echo -e '\\033[1;36mSuche läuft...\\033[0m'; find / -type f -name \"$filename\" 2>/dev/null"
ttk.Button(tab_daily, text="🔍 Datei im System suchen (find)", command=lambda: run_interactive_cmd(cmd_find, "System Suche")).pack(fill="x", pady=5)

ttk.Label(tab_daily, text="Umgebung (.bashrc)", style="Header.TLabel").pack(anchor="w", pady=(10,0))
ttk.Button(tab_daily, text="📝 ~/.bashrc bearbeiten (nano)", command=lambda: run_interactive_cmd("nano ~/.bashrc", "Bashrc Editor")).pack(fill="x", pady=5)
ttk.Button(tab_daily, text="🔄 ~/.bashrc neu laden (source)", command=lambda: run_interactive_cmd("source ~/.bashrc && echo -e '\\033[1;32m.bashrc erfolgreich neu geladen!\\033[0m'; sleep 2", "Source Bashrc")).pack(fill="x", pady=5)


# --- TAB 2: ⚙️ ROS Info ---
tab_sys = create_tab("⚙️ ROS Info")
ttk.Label(tab_sys, text="Listen & Status", style="Header.TLabel").pack(anchor="w")
ttk.Button(tab_sys, text="Aktive Nodes (node list)", command=lambda: run_cmd("ros2 node list", "Nodes")).pack(fill="x", pady=3)
ttk.Button(tab_sys, text="Aktive Topics (topic list -t)", command=lambda: run_cmd("ros2 topic list -t", "Topics")).pack(fill="x", pady=3)
ttk.Button(tab_sys, text="Aktive Services (service list)", command=lambda: run_cmd("ros2 service list", "Services")).pack(fill="x", pady=3)
ttk.Button(tab_sys, text="Globale Parameter (param list)", command=lambda: run_cmd("ros2 param list", "Parameter")).pack(fill="x", pady=3)

ttk.Label(tab_sys, text="Diagnose Tools", style="Header.TLabel").pack(anchor="w", pady=(10,0))
ttk.Button(tab_sys, text="🩺 System Check (ros2 doctor)", command=lambda: run_cmd("ros2 doctor", "ROS Doctor")).pack(fill="x", pady=3)
ttk.Button(tab_sys, text="📈 RQT (Graphische Analyse)", command=lambda: run_cmd("rqt", "RQT"), style="Start.TButton").pack(fill="x", pady=3)


# --- TAB 3: 🛠️ Build & Clean ---
tab_build = create_tab("🛠️ Build")
ttk.Label(tab_build, text="Workspace: ~/dev_ws", style="Header.TLabel").pack(anchor="w")
ttk.Button(tab_build, text="🔨 Kompletten Build (colcon build)", command=lambda: run_cmd("colcon build", "Colcon Build", "~/dev_ws"), style="Start.TButton").pack(fill="x", pady=5)
ttk.Button(tab_build, text="🔗 Symlink Build (Für Python Updates)", command=lambda: run_cmd("colcon build --symlink-install", "Symlink", "~/dev_ws")).pack(fill="x", pady=5)

ttk.Label(tab_build, text="Wartung & Reset", style="Header.TLabel").pack(anchor="w", pady=(15,0))
ttk.Button(tab_build, text="🧹 Workspace bereinigen (rm -rf)", command=lambda: run_cmd("rm -rf build/ install/ log/ && echo 'Bereinigt.'", "Cleanup", "~/dev_ws")).pack(fill="x", pady=5)
ttk.Button(tab_build, text="🛑 ALLE ROS-Prozesse beenden", command=lambda: run_bg_cmd("pkill -f 'rosbridge_server' && pkill -f 'workspace_analyzer' && pkill -f 'lite6' && pkill -f 'http.server'"), style="Action.TButton").pack(fill="x", pady=5)


# --- TAB 4: 🤖 Projekt-Nodes ---
tab_robot = create_tab("🤖 Nodes")

ttk.Label(tab_robot, text="🎮 Controller (Joy)", style="Header.TLabel").pack(anchor="w")
# Reale Hardware auslesen:
ttk.Button(tab_robot, text="🕹️ Real Joy Node (/joy @ 100Hz)", command=lambda: run_cmd("ros2 run joy joy_node --ros-args -p autorepeat_rate:=100.0", "Joy Node", "~/dev_ws"), style="Start.TButton").pack(fill="x", pady=3)
ttk.Button(tab_robot, text="🕹️ Real Joy Node (/joy_check @ 100Hz)", command=lambda: run_cmd("ros2 run joy joy_node --ros-args -r joy:=joy_check -p autorepeat_rate:=100.0", "Joy Check", "~/dev_ws")).pack(fill="x", pady=3)
# Virtueller Datenstrom (Dummy) für Tests ohne Controller:
ttk.Button(tab_robot, text="📡 Dummy Pub (/joy @ 100Hz)", command=lambda: run_cmd("ros2 topic pub -r 100 /joy sensor_msgs/msg/Joy \"{axes: [0.0,0.0], buttons: [0,0]}\"", "Dummy Pub Joy", "~/dev_ws")).pack(fill="x", pady=3)

ttk.Label(tab_robot, text="Hardware & MoveIt", style="Header.TLabel").pack(anchor="w", pady=(10,0))
ttk.Button(tab_robot, text="▶️ Real Move (X-Arm Servo)", command=lambda: run_cmd("ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_gripper:=true report_type:=dev", "Real Move", "~/dev_ws")).pack(fill="x", pady=3)
ttk.Button(tab_robot, text="🖥️ Fake Move (Simulation)", command=lambda: run_cmd("ros2 launch xarm_moveit_servo lite6_moveit_servo_fake.launch.py", "Fake Move", "~/dev_ws")).pack(fill="x", pady=3)
ttk.Button(tab_robot, text="⌨️ Keyboard Input", command=lambda: run_cmd("ros2 run xarm_moveit_servo xarm_keyboard_input", "Keyboard Input", "~/dev_ws")).pack(fill="x", pady=3)

ttk.Label(tab_robot, text="Vision & Voice", style="Header.TLabel").pack(anchor="w", pady=(10,0))
ttk.Button(tab_robot, text="📦 YOLO Homographie", command=lambda: run_cmd("ros2 run yolo_object_detector yolo_homography_node", "YOLO", "~/dev_ws")).pack(fill="x", pady=3)
ttk.Button(tab_robot, text="🚀 Whisper Bringup", command=lambda: run_cmd("ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=True", "Whisper", "~/dev_ws")).pack(fill="x", pady=3)


# --- TAB 5: 🌐 Web ---
tab_web = create_tab("🌐 Web")
ttk.Label(tab_web, text="Backend & Server", style="Header.TLabel").pack(anchor="w")
ttk.Button(tab_web, text="🌉 ROS Bridge (Websocket)", command=lambda: run_cmd("ros2 launch rosbridge_server rosbridge_websocket_launch.xml", "ROS Bridge", "~/dev_ws")).pack(fill="x", pady=4)
ttk.Button(tab_web, text="📊 Workspace Analyzer", command=lambda: run_cmd("python3 src/websocket/workspace_analyzer.py", "Workspace Analyzer", "~/dev_ws")).pack(fill="x", pady=4)
ttk.Button(tab_web, text="🌍 Webserver starten (Port 8080)", command=lambda: run_cmd("python3 -m http.server 8080 -d src/websocket", "Webserver", "~/dev_ws")).pack(fill="x", pady=4)

ttk.Label(tab_web, text="Frontend", style="Header.TLabel").pack(anchor="w", pady=(10,0))
ttk.Button(tab_web, text="🌐 Dashboard im Browser öffnen", command=lambda: run_bg_cmd("xdg-open http://localhost:8080/dashboard_index.html"), style="Start.TButton").pack(fill="x", pady=10)
ttk.Button(tab_web, text="🎥 OBS Studio", command=lambda: run_cmd("obs", "OBS Studio")).pack(fill="x", pady=4)

root.mainloop()
