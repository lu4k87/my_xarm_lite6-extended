import tkinter as tk
from tkinter import ttk
import subprocess
import sys
import os
import shlex

# ==========================================
# BACKEND FUNKTIONEN
# ==========================================
def run_cmd(command, title="ROS 2 Terminal", ws_path="~/dev_ws"):
    """Führt einen ROS-Befehl aus und zeigt den vollständigen Ablauf im Terminal."""
    
    # ROS 2 Basis-Setup entfernt, da es bereits über die ~/.bashrc geladen wird.
    display_cmd = f"cd {ws_path} && source install/setup.bash && {command}"
    
    # FIX: Verhindert, dass Anführungszeichen/Sonderzeichen im Befehl den Bash-Echo-Befehl zerstören
    safe_display = display_cmd.replace('\\', '\\\\').replace('"', '\\"')
    
    script_content = f"""source {ws_path}/install/setup.bash 2>/dev/null || true
cd {ws_path} 2>/dev/null || true

clear
echo -e "\\033[36m[Script laeuft im Terminal: $(tty), PID: $$]\\033[0m"
echo -e "\\033[1;33m========================================================================\\033[0m"
echo -e "\\033[1;32m[VOLLSTAENDIGER BEFEHL]:\\033[0m"
echo -e "\\033[1;37m{safe_display}\\033[0m"
echo -e "\\033[1;33m========================================================================\\033[0m\\n"

{command}
"""
    safe_script = shlex.quote(script_content)
    terminal_cmd = f"gnome-terminal --title=\"{title}\" -- bash -c 'eval \"$1\"; exec bash' _ {safe_script}"
    subprocess.Popen(terminal_cmd, shell=True)

def run_interactive_cmd(command, title="System Tool"):
    """Führt System-/Interaktive Befehle aus und zeigt sie lückenlos an."""
    
    # FIX: Maskierung für die korrekte Anzeige im Terminal
    safe_display = command.replace('\\', '\\\\').replace('"', '\\"')
    
    script_content = f"""clear
echo -e "\\033[36m[Script laeuft im Terminal: $(tty), PID: $$]\\033[0m"
echo "---------------------------------------------------------"
echo -e "\\033[1;33m========================================================================\\033[0m"
echo -e "\\033[1;32m[VOLLSTAENDIGER BEFEHL]:\\033[0m"
echo -e "\\033[1;37m{safe_display}\\033[0m"
echo -e "\\033[1;33m========================================================================\\033[0m\\n"

{command}
"""
    safe_script = shlex.quote(script_content)
    terminal_cmd = f"gnome-terminal --title=\"{title}\" -- bash -c 'eval \"$1\"; exec bash' _ {safe_script}"
    subprocess.Popen(terminal_cmd, shell=True)

def run_bg_cmd(command):
    subprocess.Popen(command, shell=True)

def open_editor():
    run_interactive_cmd("nano ~/dev_ws/ros2_gui_cmds.py", "[EDIT] GUI Code")

def reload_app():
    python = sys.executable
    os.execl(python, python, *sys.argv)

# ==========================================
# HAUPTFENSTER & THEME (Dracula Dark)
# ==========================================
root = tk.Tk()
root.title("ROS 2 Master Control")
root.geometry("650x900")

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
style.configure(".", background=bg_main, foreground=fg_text, font=("Helvetica", 10))

# Tabs
style.configure("TNotebook", background=bg_main, borderwidth=0)
style.configure("TNotebook.Tab", font=("Helvetica", 10, "bold"), padding=[15, 10], background=bg_surface, foreground=fg_text, borderwidth=0)
style.map("TNotebook.Tab", background=[("selected", bg_main)], foreground=[("selected", accent_cyan)], expand=[("selected", [0, 0, 0, 0])])

# Buttons
style.configure("TButton", font=("Helvetica", 10, "bold"), background=bg_surface, foreground=fg_text, borderwidth=1, bordercolor=border_col, padding=8, focuscolor=bg_main)
style.map("TButton", background=[("active", "#6272A4")], foreground=[("active", "#FFFFFF")])

style.configure("Action.TButton", foreground=accent_pink)
style.map("Action.TButton", background=[("active", accent_pink)], foreground=[("active", bg_main)])

style.configure("Start.TButton", foreground=accent_green)
style.map("Start.TButton", background=[("active", accent_green)], foreground=[("active", bg_main)])

# Text-Labels
style.configure("Header.TLabel", font=("Helvetica", 12, "bold"), foreground=accent_cyan, background=bg_main, padding=(0, 15, 0, 5))
style.configure("Sub.TLabel", font=("Courier", 9), foreground=fg_muted, background=bg_main)

# ==========================================
# FOOTER
# ==========================================
footer_frame = ttk.Frame(root)
footer_frame.pack(side="bottom", fill="x", pady=15, padx=20)

ttk.Separator(footer_frame, orient="horizontal").pack(fill="x", pady=(0, 5))

btn_frame = ttk.Frame(footer_frame)
btn_frame.pack(pady=10)

ttk.Button(btn_frame, text="~/.bashrc bearbeiten (nano)", command=lambda: run_interactive_cmd("nano ~/.bashrc", "Bashrc Editor")).pack(side="left", padx=5)
ttk.Button(btn_frame, text="Code anpassen", command=open_editor).pack(side="left", padx=5)
ttk.Button(btn_frame, text="App neu laden", command=reload_app, style="Action.TButton").pack(side="left", padx=5)

# ==========================================
# NOTEBOOK (Tabs) 
# ==========================================
notebook = ttk.Notebook(root)
notebook.pack(expand=True, fill="both", side="top", padx=15, pady=10)

def create_tab(name):
    frame = ttk.Frame(notebook, padding=15)
    notebook.add(frame, text=name)
    return frame

# --- TAB 1: Daily Tools ---
tab_daily = create_tab("Daily Tools")

ttk.Label(tab_daily, text="System & Netzwerk", style="Header.TLabel").pack(anchor="w")
ttk.Button(tab_daily, text="Eigene IP-Adresse anzeigen", command=lambda: run_interactive_cmd("echo -e '\\033[1;32mNetzwerk-Schnittstellen:\\033[0m'; ip -brief address show; echo ''; echo 'Druecke Enter zum Schliessen.'; read", "IP Adresse")).pack(fill="x", pady=5)
cmd_find = 'read -p "Welcher Dateiname (oder Teil davon) wird gesucht?: " st; echo -e "\\n\\033[1;36mSuche im gesamten System nach: *${st}* ... (Das kann dauern!)\\033[0m\\n"; find / -iname "*${st}*" 2>/dev/null'
ttk.Button(tab_daily, text="Datei im System suchen (find)", command=lambda: run_interactive_cmd(cmd_find, "System Suche")).pack(fill="x", pady=5)

ttk.Label(tab_daily, text="Umgebung (.bashrc)", style="Header.TLabel").pack(anchor="w", pady=(10,0))
ttk.Button(tab_daily, text="~/.bashrc neu laden (source)", command=lambda: run_interactive_cmd("source ~/.bashrc && echo -e '\\033[1;32m.bashrc erfolgreich neu geladen!\\033[0m'; sleep 2", "Source Bashrc")).pack(fill="x", pady=5)

# --- TAB 2: ROS Info ---
tab_sys = create_tab("ROS Info")

sys_canvas = tk.Canvas(tab_sys, bg=bg_main, highlightthickness=0)
sys_scrollbar = ttk.Scrollbar(tab_sys, orient="vertical", command=sys_canvas.yview)
sys_scroll_frame = ttk.Frame(sys_canvas)

sys_scroll_frame.bind("<Configure>", lambda e: sys_canvas.configure(scrollregion=sys_canvas.bbox("all")))
sys_canvas.create_window((0, 0), window=sys_scroll_frame, anchor="nw", width=580)
sys_canvas.configure(yscrollcommand=sys_scrollbar.set)
sys_canvas.pack(side="left", fill="both", expand=True)
sys_scrollbar.pack(side="right", fill="y")

def _bind_sys_mouse(event=None):
    sys_canvas.bind_all("<Button-4>", lambda e: sys_canvas.yview_scroll(-1, "units"))
    sys_canvas.bind_all("<Button-5>", lambda e: sys_canvas.yview_scroll(1, "units"))
def _unbind_sys_mouse(event=None):
    sys_canvas.unbind_all("<Button-4>")
    sys_canvas.unbind_all("<Button-5>")

sys_canvas.bind('<Enter>', _bind_sys_mouse)
sys_canvas.bind('<Leave>', _unbind_sys_mouse)

ttk.Label(sys_scroll_frame, text="Listen & Status", style="Header.TLabel").pack(anchor="w")
ttk.Button(sys_scroll_frame, text="Aktive Nodes (node list)", command=lambda: run_cmd("ros2 node list", "Nodes")).pack(fill="x", pady=3)
ttk.Button(sys_scroll_frame, text="Aktive Topics (topic list -t)", command=lambda: run_cmd("ros2 topic list -t", "Topics")).pack(fill="x", pady=3)
ttk.Button(sys_scroll_frame, text="Aktive Services (service list)", command=lambda: run_cmd("ros2 service list", "Services")).pack(fill="x", pady=3)
ttk.Button(sys_scroll_frame, text="Globale Parameter (param list)", command=lambda: run_cmd("ros2 param list", "Parameter")).pack(fill="x", pady=3)
ttk.Button(sys_scroll_frame, text="Alle ROS 2 Pakete auflisten (pkg list)", command=lambda: run_cmd("ros2 pkg list", "Packages")).pack(fill="x", pady=3)

ttk.Label(sys_scroll_frame, text="Visualisierung", style="Header.TLabel").pack(anchor="w", pady=(10,0))
ttk.Button(sys_scroll_frame, text="RViz2 starten", command=lambda: run_cmd("rviz2", "RViz2"), style="Start.TButton").pack(fill="x", pady=3)
ttk.Button(sys_scroll_frame, text="RQT Graph (Node-Netzwerk)", command=lambda: run_cmd("rqt_graph", "RQT Graph")).pack(fill="x", pady=3)
ttk.Button(sys_scroll_frame, text="RQT (Generelle GUI)", command=lambda: run_cmd("rqt", "RQT")).pack(fill="x", pady=3)

ttk.Label(sys_scroll_frame, text="Live-Debugging (Interaktiv)", style="Header.TLabel").pack(anchor="w", pady=(10,0))
cmd_echo = 'read -p "Welches Topic willst du abhoeren?: " tp; echo -e "\\n\\033[1;36mHoere $tp ab...\\033[0m\\n"; ros2 topic echo $tp'
ttk.Button(sys_scroll_frame, text="Topic Echo (Live-Daten lesen)", command=lambda: run_interactive_cmd(cmd_echo, "Topic Echo")).pack(fill="x", pady=3)

cmd_hz = 'read -p "Topic fuer Frequenzmessung eingeben: " tp; echo -e "\\n\\033[1;36mRate von $tp...\\033[0m\\n"; ros2 topic hz $tp'
ttk.Button(sys_scroll_frame, text="Topic Hz (Publish-Rate messen)", command=lambda: run_interactive_cmd(cmd_hz, "Topic Hz")).pack(fill="x", pady=3)

cmd_msg = 'read -p "Message-Typ (z.B. sensor_msgs/msg/Joy): " msg; echo -e "\\n\\033[1;36mStruktur:\\033[0m\\n"; ros2 interface show $msg; echo ""; read -p "Druecke Enter zum Schliessen."'
ttk.Button(sys_scroll_frame, text="Interface/Message Aufbau anzeigen", command=lambda: run_interactive_cmd(cmd_msg, "Interface Info")).pack(fill="x", pady=3)

ttk.Label(sys_scroll_frame, text="Diagnose Tools", style="Header.TLabel").pack(anchor="w", pady=(10,0))
ttk.Button(sys_scroll_frame, text="System Check (ros2 doctor)", command=lambda: run_cmd("ros2 doctor", "ROS Doctor")).pack(fill="x", pady=3)

# --- TAB 3: Build & Clean ---
tab_build = create_tab("Build")
ttk.Label(tab_build, text="Workspace: ~/dev_ws", style="Header.TLabel").pack(anchor="w")
ttk.Button(tab_build, text="Colcon Build (--symlink-install)", command=lambda: run_cmd("colcon build --symlink-install", "Colcon Build", "~/dev_ws"), style="Start.TButton").pack(fill="x", pady=5)

ttk.Label(tab_build, text="Wartung & Reset", style="Header.TLabel").pack(anchor="w", pady=(15,0))
ttk.Button(tab_build, text="ALLE ROS-Prozesse beenden", command=lambda: run_bg_cmd("pkill -f 'rosbridge_server' && pkill -f 'workspace_analyzer' && pkill -f 'lite6' && pkill -f 'http.server'"), style="Action.TButton").pack(fill="x", pady=5)

# --- TAB 4: Nodes (MIT SCROLLBAR) ---
tab_robot = create_tab("Nodes")

canvas = tk.Canvas(tab_robot, bg=bg_main, highlightthickness=0)
scrollbar = ttk.Scrollbar(tab_robot, orient="vertical", command=canvas.yview)
scrollable_frame = ttk.Frame(canvas)

scrollable_frame.bind("<Configure>", lambda e: canvas.configure(scrollregion=canvas.bbox("all")))
canvas.create_window((0, 0), window=scrollable_frame, anchor="nw", width=580)
canvas.configure(yscrollcommand=scrollbar.set)

def _bind_mouse(event=None):
    canvas.bind_all("<Button-4>", lambda e: canvas.yview_scroll(-1, "units"))
    canvas.bind_all("<Button-5>", lambda e: canvas.yview_scroll(1, "units"))
def _unbind_mouse(event=None):
    canvas.unbind_all("<Button-4>")
    canvas.unbind_all("<Button-5>")

canvas.bind('<Enter>', _bind_mouse)
canvas.bind('<Leave>', _unbind_mouse)

canvas.pack(side="left", fill="both", expand=True)
scrollbar.pack(side="right", fill="y")

# --- Inhalt des Scroll-Frames ---
ttk.Label(scrollable_frame, text="Controller (Joy)", style="Header.TLabel").pack(anchor="w")

joy_payload = '"{header: {stamp: {sec: 0, nanosec: 0}, frame_id: \'base_link\'}, axes: [0.0, 1.0, 0.0, 0.0], buttons: [0, 0, 0, 0]}"'

ttk.Button(scrollable_frame, text="Pub /joy (Rate 10)", command=lambda: run_cmd(f"ros2 topic pub --rate 10 /joy sensor_msgs/msg/Joy {joy_payload}", "Joy Pub", "~/dev_ws"), style="Start.TButton").pack(fill="x", pady=3)
ttk.Button(scrollable_frame, text="Pub /joy_check (Rate 10)", command=lambda: run_cmd(f"ros2 topic pub --rate 10 /joy_check sensor_msgs/msg/Joy {joy_payload}", "Joy Check Pub", "~/dev_ws")).pack(fill="x", pady=3)

ttk.Label(scrollable_frame, text="Robotik & MoveIt", style="Header.TLabel").pack(anchor="w", pady=(10,0))
ttk.Button(scrollable_frame, text="Real Move Launch (X-Arm Servo)", command=lambda: run_cmd("ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_gripper:=true report_type:=dev", "Real Move", "~/dev_ws"), style="Start.TButton").pack(fill="x", pady=3)
ttk.Button(scrollable_frame, text="Fake Move Launch (Simulation)", command=lambda: run_cmd("ros2 launch xarm_moveit_servo lite6_moveit_servo_fake.launch.py", "Fake Move", "~/dev_ws")).pack(fill="x", pady=3)
ttk.Button(scrollable_frame, text="Keyboard Input Node", command=lambda: run_cmd("ros2 run xarm_moveit_servo xarm_keyboard_input", "Keyboard Input", "~/dev_ws")).pack(fill="x", pady=3)

ttk.Label(scrollable_frame, text="Planung & Logik", style="Header.TLabel").pack(anchor="w", pady=(10,0))
ttk.Button(scrollable_frame, text="Move To Coordinator Node", command=lambda: run_cmd("ros2 run move_to_coordinator move_to_coordinator", "Coordinator", "~/dev_ws")).pack(fill="x", pady=3)
ttk.Button(scrollable_frame, text="Motion Sequence Launch", command=lambda: run_cmd("ros2 launch motion_sequence motion_sequence_launch.py", "Motion Sequence", "~/dev_ws")).pack(fill="x", pady=3)
ttk.Button(scrollable_frame, text="Collision Check Node", command=lambda: run_cmd("ros2 run collision_check checker", "Collision Check", "~/dev_ws")).pack(fill="x", pady=3)

ttk.Label(scrollable_frame, text="Vision & Voice", style="Header.TLabel").pack(anchor="w", pady=(10,0))
ttk.Button(scrollable_frame, text="YOLO Homographie Node", command=lambda: run_cmd("ros2 run yolo_object_detector yolo_homography_node", "YOLO", "~/dev_ws")).pack(fill="x", pady=3)
ttk.Button(scrollable_frame, text="RViz Marker Publisher Node", command=lambda: run_cmd("ros2 run rviz_marker marker_publisher", "RViz Marker", "~/dev_ws")).pack(fill="x", pady=3)
ttk.Button(scrollable_frame, text="Whisper Bringup Launch", command=lambda: run_cmd("ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=True", "Whisper Bringup", "~/dev_ws")).pack(fill="x", pady=3)
ttk.Button(scrollable_frame, text="Whisper Stream Demo Node", command=lambda: run_cmd("ros2 run whisper_demos whisper_on_key", "Whisper Demo", "~/dev_ws")).pack(fill="x", pady=3)
ttk.Button(scrollable_frame, text="Voice Command Listener Node", command=lambda: run_cmd("ros2 run voice_command_listener listener", "Voice Listener", "~/dev_ws")).pack(fill="x", pady=3)

# --- TAB 5: Web ---
tab_web = create_tab("Web")
ttk.Label(tab_web, text="Backend & Server", style="Header.TLabel").pack(anchor="w")
ttk.Button(tab_web, text="ROS Bridge Launch (Websocket)", command=lambda: run_cmd("ros2 launch rosbridge_server rosbridge_websocket_launch.xml", "ROS Bridge", "~/dev_ws")).pack(fill="x", pady=4)
ttk.Button(tab_web, text="Workspace Analyzer Script", command=lambda: run_cmd("python3 src/websocket/workspace_analyzer.py", "Workspace Analyzer", "~/dev_ws")).pack(fill="x", pady=4)
ttk.Button(tab_web, text="Webserver starten (Port 8080)", command=lambda: run_cmd("python3 -m http.server 8080 -d src/websocket", "Webserver", "~/dev_ws")).pack(fill="x", pady=4)

ttk.Label(tab_web, text="Frontend", style="Header.TLabel").pack(anchor="w", pady=(10,0))
ttk.Button(tab_web, text="Dashboard im Browser oeffnen", command=lambda: run_bg_cmd("xdg-open http://localhost:8080/dashboard_index.html"), style="Start.TButton").pack(fill="x", pady=10)
ttk.Button(tab_web, text="OBS Studio", command=lambda: run_cmd("obs", "OBS Studio")).pack(fill="x", pady=4)

root.mainloop()
