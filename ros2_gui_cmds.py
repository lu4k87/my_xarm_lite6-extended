import customtkinter as ctk
import subprocess
import sys
import os
import shlex

# ==========================================
# APPEARANCE & THEME (Premium Midnight)
# ==========================================
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

# Midnight Theme Palette
COLOR_BG_MAIN = "#0f172a"      # Deep Navy/Slate
COLOR_BG_SURFACE = "#1e293b"   # Slate Blue Surface
COLOR_FG_TEXT = "#f8fafc"      # Near White
COLOR_FG_MUTED = "#64748b"     # Muted Slate
COLOR_ACCENT_BLUE = "#3b82f6"  # Vibrant Primary Blue
COLOR_ACCENT_ORANGE = "#f59e0b" # Modern Orange instead of Pink
COLOR_ACCENT_GREEN = "#10b981" # Success Green

# ==========================================
# BACKEND FUNKTIONEN
# ==========================================
def run_cmd(command, title="ROS 2 Terminal", ws_path="~/dev_ws"):
    """Führt einen ROS-Befehl aus und zeigt den vollständigen Ablauf im Terminal."""
    ros_setup = "source /opt/ros/humble/setup.bash"
    ws_setup = f"source {ws_path}/install/setup.bash"
    display_cmd = f"{ros_setup} && {ws_setup} && cd {ws_path} && {command}"
    safe_display = display_cmd.replace('\\', '\\\\').replace('"', '\\"')
    
    script_content = f"""{ros_setup} 2>/dev/null || true
{ws_setup} 2>/dev/null || true
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
    ros_setup = "source /opt/ros/humble/setup.bash"
    safe_display = command.replace('\\', '\\\\').replace('"', '\\"')
    
    script_content = f"""{ros_setup} 2>/dev/null || true
clear
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
# MAIN APPLICATION CLASS
# ==========================================
class ROS2MasterControl(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("ROS 2 Master Control")
        self.geometry("600x1000") # Breite um 10% reduziert (von 665 auf 600)
        self.configure(fg_color=COLOR_BG_MAIN)

        # UI LAYOUT
        self.setup_tabs()
        self.setup_footer()

    def setup_tabs(self):
        self.tabview = ctk.CTkTabview(self, 
                                     fg_color="transparent",
                                     segmented_button_fg_color=COLOR_BG_SURFACE,
                                     segmented_button_selected_color=COLOR_ACCENT_BLUE,
                                     segmented_button_selected_hover_color="#60a5fa",
                                     segmented_button_unselected_color=COLOR_BG_SURFACE,
                                     segmented_button_unselected_hover_color="#334155",
                                     text_color=COLOR_FG_TEXT)
        self.tabview.pack(expand=True, fill="both", padx=20, pady=(10, 20))

        # FORCE WIDER TABS: Wir nutzen das interne SegmentedButton Widget
        self.tabview._segmented_button.configure(
            font=("Helvetica", 15, "bold"),
            height=45,
            corner_radius=8
        )
        
        # Tabs hinzufügen mit extra Padding im Namen für Breite
        self.tab_daily = self.tabview.add("   Daily Tools   ")
        self.tab_nodes = self.tabview.add("   Nodes   ")
        self.tab_web = self.tabview.add("   Web Service   ")
        self.tab_info = self.tabview.add("   ROS - Info   ")
        self.tab_build = self.tabview.add("   Build & Source   ")

        self.tabview.set("   Daily Tools   ")

        self.create_daily_tab()
        self.create_nodes_tab()
        self.create_web_tab()
        self.create_info_tab()
        self.create_build_tab()

    def create_daily_tab(self):
        frame = self.tab_daily
        self.add_header(frame, "System & Netzwerk")
        self.add_button(frame, "Eigene IP-Adresse anzeigen", 
                        lambda: run_interactive_cmd("echo -e '\\033[1;32mNetzwerk-Schnittstellen:\\033[0m'; ip -brief address show; echo ''; echo 'Druecke Enter zum Schliessen.'; read", "IP Adresse"))
        
        cmd_find = 'read -p "Welcher Dateiname (oder Teil davon) wird gesucht?: " st; echo -e "\\n\\033[1;36mSuche im gesamten System nach: *${st}* ... (Das kann dauern!)\\033[0m\\n"; find / -iname "*${st}*" 2>/dev/null'
        self.add_button(frame, "Datei im System suchen (find)", lambda: run_interactive_cmd(cmd_find, "System Suche"))

        self.add_header(frame, "Umgebung (.bashrc)", pady=(20, 0))
        self.add_button(frame, "~/.bashrc neu laden (source)", 
                        lambda: run_interactive_cmd("source ~/.bashrc && echo -e '\\033[1;32m.bashrc erfolgreich neu geladen!\\033[0m'; sleep 2", "Source Bashrc"))

    def create_info_tab(self):
        scroll_frame = ctk.CTkScrollableFrame(self.tab_info, fg_color="transparent")
        scroll_frame.pack(expand=True, fill="both")

        self.add_header(scroll_frame, "Listen & Status")
        items = [
            ("Aktive Nodes (node list)", "ros2 node list", "Nodes"),
            ("Aktive Topics (topic list -t)", "ros2 topic list -t", "Topics"),
            ("Aktive Services (service list)", "ros2 service list", "Services"),
            ("Globale Parameter (param list)", "ros2 param list", "Parameter"),
            ("Alle ROS 2 Pakete auflisten (pkg list)", "ros2 pkg list", "Packages"),
        ]
        for text, cmd, title in items:
            self.add_button(scroll_frame, text, lambda c=cmd, t=title: run_cmd(c, t), pady=4)

        self.add_header(scroll_frame, "Visualisierung", pady=(20, 0))
        # HIER WURDE DIE FARBE ENTFERNT
        self.add_button(scroll_frame, "RViz2 starten", lambda: run_cmd("rviz2", "RViz2"), pady=4)
        self.add_button(scroll_frame, "RQT Graph (Node-Netzwerk)", lambda: run_cmd("rqt_graph", "RQT Graph"), pady=4)
        self.add_button(scroll_frame, "RQT (Generelle GUI)", lambda: run_cmd("rqt", "RQT"), pady=4)

        self.add_header(scroll_frame, "Live-Debugging (Interaktiv)", pady=(20, 0))
        cmd_echo = 'read -p "Welches Topic willst du abhoeren?: " tp; echo -e "\\n\\033[1;36mHoere $tp ab...\\033[0m\\n"; ros2 topic echo $tp'
        self.add_button(scroll_frame, "Topic Echo (Live-Daten lesen)", lambda: run_interactive_cmd(cmd_echo, "Topic Echo"), pady=4)

        cmd_hz = 'read -p "Topic fuer Frequenzmessung eingeben: " tp; echo -e "\\n\\033[1;36mRate von $tp...\\033[0m\\n"; ros2 topic hz $tp'
        self.add_button(scroll_frame, "Topic Hz (Publish-Rate messen)", lambda: run_interactive_cmd(cmd_hz, "Topic Hz"), pady=4)

        cmd_msg = 'read -p "Message-Typ (z.B. sensor_msgs/msg/Joy): " msg; echo -e "\\n\\033[1;36mStruktur:\\033[0m\\n"; ros2 interface show $msg; echo ""; read -p "Druecke Enter zum Schliessen."'
        self.add_button(scroll_frame, "Interface/Message Aufbau anzeigen", lambda: run_interactive_cmd(cmd_msg, "Interface Info"), pady=4)

        self.add_header(scroll_frame, "Diagnose Tools", pady=(20, 0))
        self.add_button(scroll_frame, "System Check (ros2 doctor)", lambda: run_cmd("ros2 doctor", "ROS Doctor"), pady=4)

    def create_build_tab(self):
        frame = self.tab_build
        self.add_header(frame, "Build & Workspace (dev_ws)")
        self.add_button(frame, "Colcon Build (--symlink-install)", 
                        lambda: run_cmd("colcon build --symlink-install", "Colcon Build", "~/dev_ws"), 
                        fg_color=COLOR_ACCENT_GREEN, text_color=COLOR_BG_MAIN)

        self.add_header(frame, "Wartung & Reset", pady=(30, 0))
        kill_cmd = "pkill -9 -f 'rosbridge_server' && pkill -9 -f 'rosbridge_websocket' && pkill -9 -f 'rosapi_node' && pkill -9 -f 'workspace_analyzer' && pkill -9 -f 'lite6' && pkill -9 -f 'http.server'"
        self.add_button(frame, "ALLE ROS-Prozesse beenden", lambda: run_bg_cmd(kill_cmd), fg_color=COLOR_ACCENT_ORANGE, text_color=COLOR_BG_MAIN)

    def create_nodes_tab(self):
        scroll_frame = ctk.CTkScrollableFrame(self.tab_nodes, fg_color="transparent")
        scroll_frame.pack(expand=True, fill="both")

        self.add_header(scroll_frame, "Controller (Joy)")
        joy_payload = '"{header: {stamp: {sec: 0, nanosec: 0}, frame_id: \'base_link\'}, axes: [0.0, 1.0, 0.0, 0.0], buttons: [0, 0, 0, 0]}"'
        
        self.add_button(scroll_frame, "Pub /joy (Rate 10)", 
                        lambda: run_cmd(f"ros2 topic pub --rate 10 /joy sensor_msgs/msg/Joy {joy_payload}", "Joy Pub"), 
                        pady=4)
                        
        self.add_button(scroll_frame, "Pub /joy_check (Rate 10)", 
                        lambda: run_cmd(f"ros2 topic pub --rate 10 /joy_check sensor_msgs/msg/Joy {joy_payload}", "Joy Check Pub"), pady=4)

        self.add_header(scroll_frame, "Robotik & MoveIt", pady=(20, 0))
        
        self.add_button(scroll_frame, "Real Move Launch (X-Arm Servo)", 
                        lambda: run_cmd("ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_gripper:=true report_type:=dev", "Real Move"), 
                        pady=4)
                        
        self.add_button(scroll_frame, "Fake Move Launch (Simulation)", 
                        lambda: run_cmd("ros2 launch xarm_moveit_servo lite6_moveit_servo_fake.launch.py", "Fake Move"), pady=4)
        self.add_button(scroll_frame, "Keyboard Input Node", 
                        lambda: run_cmd("ros2 run xarm_moveit_servo xarm_keyboard_input", "Keyboard Input"), pady=4)

        self.add_header(scroll_frame, "Planung & Logik", pady=(20, 0))
        self.add_button(scroll_frame, "Move To Coordinator Node", 
                        lambda: run_cmd("ros2 run move_to_coordinator move_to_coordinator", "Coordinator"), pady=4)
        self.add_button(scroll_frame, "Motion Sequence Launch", 
                        lambda: run_cmd("ros2 launch motion_sequence motion_sequence_launch.py", "Motion Sequence"), pady=4)
        self.add_button(scroll_frame, "Collision Check Node", 
                        lambda: run_cmd("ros2 run collision_check checker", "Collision Check"), pady=4)

        self.add_header(scroll_frame, "Vision & Voice", pady=(20, 0))
        self.add_button(scroll_frame, "YOLO Homographie Node", lambda: run_cmd("ros2 run yolo_object_detector yolo_homography_node", "YOLO"), pady=4)
        self.add_button(scroll_frame, "RViz Marker Publisher Node", lambda: run_cmd("ros2 run rviz_marker marker_publisher", "RViz Marker"), pady=4)
        self.add_button(scroll_frame, "Whisper Bringup Launch", lambda: run_cmd("ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=True", "Whisper Bringup"), pady=4)
        self.add_button(scroll_frame, "Whisper Stream Demo Node", lambda: run_cmd("ros2 run whisper_demos whisper_on_key", "Whisper Demo"), pady=4)
        self.add_button(scroll_frame, "Voice Command Listener Node", lambda: run_cmd("ros2 run voice_command_listener listener", "Voice Listener"), pady=4)

    def create_web_tab(self):
        frame = self.tab_web
        self.add_header(frame, "Backend & Server")
        self.add_button(frame, "ROS Bridge Launch (Websocket)", lambda: run_cmd("ros2 launch rosbridge_server rosbridge_websocket_launch.xml", "ROS Bridge"), pady=5)
        self.add_button(frame, "Webserver starten (Port 8080)", lambda: run_cmd("python3 -m http.server 8080 -d src/websocket", "Webserver"), pady=5)
        self.add_button(frame, "Workspace Analyzer Script", lambda: run_cmd("python3 src/websocket/workspace_analyzer.py", "Workspace Analyzer"), pady=5)

        self.add_header(frame, "Frontend", pady=(20, 0))
        self.add_button(frame, "Dashboard im Browser oeffnen", 
                        lambda: run_bg_cmd("xdg-open http://localhost:8080/dashboard_index.html"), 
                        fg_color=COLOR_ACCENT_GREEN, text_color=COLOR_BG_MAIN, pady=12)
        self.add_button(frame, "OBS Studio", lambda: run_cmd("obs", "OBS Studio"), pady=5)

    def setup_footer(self):
        footer = ctk.CTkFrame(self, fg_color="transparent")
        footer.pack(side="bottom", fill="x", padx=20, pady=25)

        ctk.CTkLabel(footer, text="", height=2, fg_color=COLOR_FG_MUTED).pack(fill="x", pady=(0, 20))

        btn_frame = ctk.CTkFrame(footer, fg_color="transparent")
        btn_frame.pack()

        self.add_footer_button(btn_frame, "~/.bashrc bearbeiten", lambda: run_interactive_cmd("nano ~/.bashrc", "Bashrc Editor"))
        self.add_footer_button(btn_frame, "Code anpassen", open_editor)
        self.add_footer_button(btn_frame, "App neu laden", reload_app, fg_color=COLOR_ACCENT_ORANGE)

    def add_header(self, master, text, pady=(0, 10)):
        label = ctk.CTkLabel(master, text=text, font=("Helvetica", 20, "bold"), text_color=COLOR_ACCENT_BLUE)
        label.pack(anchor="w", pady=pady)

    def add_button(self, master, text, command, fg_color=COLOR_BG_SURFACE, text_color=COLOR_FG_TEXT, pady=6):
        btn = ctk.CTkButton(master, text=text, command=command, 
                            fg_color=fg_color, text_color=text_color,
                            hover_color="#334155", height=48, font=("Helvetica", 14, "bold"),
                            width=280, # Ca. 50% der Fensterbreite
                            corner_radius=10)
        btn.pack(pady=pady)

    def add_footer_button(self, master, text, command, fg_color=COLOR_BG_SURFACE):
        btn = ctk.CTkButton(master, text=text, command=command,
                            fg_color=fg_color, text_color=COLOR_FG_TEXT,
                            hover_color="#334155", height=42, font=("Helvetica", 13, "bold"),
                            corner_radius=8)
        btn.pack(side="left", padx=10)

if __name__ == "__main__":
    app = ROS2MasterControl()
    app.mainloop()