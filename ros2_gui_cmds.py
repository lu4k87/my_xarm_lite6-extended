import customtkinter as ctk
import subprocess
import sys
import os
import shlex

# ══════════════════════════════════════════════════════
#  APPEARANCE & THEME  —  "Deep Space"
# ══════════════════════════════════════════════════════
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

# ─── Farb-Palette ──────────────────────────────────────
# ─── Farb-Palette 2.0 (Deep Space) ──────────────────────
COLOR_BG_MAIN     = "#02040a"   # Ultramarin-Schwarz
COLOR_BG_SURFACE  = "#080c16"   # Tiefer Untergrund
COLOR_BG_CARD     = "#0c1425"   # Navy-Card
COLOR_BG_BTN      = "#121d33"   # Button-Depth
COLOR_BORDER      = "#1a2c4e"   # Subtile Struktur
COLOR_HOVER       = "#1e3a5f"   # Leuchtender Hover

COLOR_FG_TEXT     = "#e2e8f0"   # Kristall-Weiß
COLOR_FG_MUTED    = "#64748b"   # Slate-Gedämpft
COLOR_FG_HEADER   = "#94a3b8"   # Header-Slate

COLOR_ACCENT      = "#22d3ee"   # Cyber-Cyan
COLOR_ACCENT_AMBER= "#fbbf24"   # Electric-Amber
COLOR_ACCENT_GREEN= "#4ade80"   # Neon-Green

# ══════════════════════════════════════════════════════
#  BACKEND-FUNKTIONEN
# ══════════════════════════════════════════════════════
def run_cmd(command, title="ROS 2 Terminal", ws_path="~/dev_ws"):
    """Öffnet ein Terminal und führt einen ROS-Befehl aus."""
    ros_setup = "source /opt/ros/humble/setup.bash"
    ws_setup  = f"source {ws_path}/install/setup.bash"
    display   = f"{ros_setup} && {ws_setup} && cd {ws_path} && {command}"
    safe_disp = display.replace('\\', '\\\\').replace('"', '\\"')

    script = f"""source ~/.bashrc 2>/dev/null || true
{ros_setup} 2>/dev/null || true
{ws_setup} 2>/dev/null || true
cd {ws_path} 2>/dev/null || true
clear
echo -e "\\033[36m[Terminal: $(tty)  PID: $$]\\033[0m"
echo -e "\\033[1;33m═══════════════════════════════════════════════════════════\\033[0m"
echo -e "\\033[1;32m CMD:\\033[0m"
echo -e "\\033[1;37m {safe_disp}\\033[0m"
echo -e "\\033[1;33m═══════════════════════════════════════════════════════════\\033[0m\\n"
{command}
"""
    safe = shlex.quote(script)
    subprocess.Popen(f'gnome-terminal --title="{title}" -- bash -c \'eval "$1"; exec bash\' _ {safe}', shell=True)


def run_interactive_cmd(command, title="System Tool"):
    """Öffnet ein interaktives Terminal."""
    ros_setup = "source /opt/ros/humble/setup.bash"
    safe_disp = command.replace('\\', '\\\\').replace('"', '\\"')

    script = f"""source ~/.bashrc 2>/dev/null || true
{ros_setup} 2>/dev/null || true
clear
echo -e "\\033[36m[Terminal: $(tty)  PID: $$]\\033[0m"
echo -e "\\033[1;33m═══════════════════════════════════════════════════════════\\033[0m"
echo -e "\\033[1;32m CMD:\\033[0m"
echo -e "\\033[1;37m {safe_disp}\\033[0m"
echo -e "\\033[1;33m═══════════════════════════════════════════════════════════\\033[0m\\n"
{command}
"""
    safe = shlex.quote(script)
    subprocess.Popen(f'gnome-terminal --title="{title}" -- bash -c \'eval "$1"; exec bash\' _ {safe}', shell=True)


def run_bg_cmd(command):
    env = os.environ.copy()
    env.setdefault("DISPLAY", ":0")
    subprocess.Popen(command, shell=True, env=env)

def open_editor():
    run_interactive_cmd("nano ~/dev_ws/ros2_gui_cmds.py", "[EDIT] GUI Code")

def reload_app():
    os.environ.setdefault("DISPLAY", ":0")
    python = sys.executable
    os.execl(python, python, *sys.argv)


# ══════════════════════════════════════════════════════
#  MAIN APPLICATION
# ══════════════════════════════════════════════════════
class ROS2MasterControl(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("ROS 2 Master Control")
        # Exakt 30% Breite (in Pixeln berechnet)
        sw = self.winfo_screenwidth()
        sh = self.winfo_screenheight()
        width = int(sw * 0.3)
        self.geometry(f"{width}x{sh}+0+0") # +0+0 erzwingt linke Seite
        self.configure(fg_color=COLOR_BG_MAIN)
        self.setup_tabs()
        self.setup_footer()

    # ── Tabs ────────────────────────────────────────
    def setup_tabs(self):
        self.tabview = ctk.CTkTabview(
            self,
            fg_color="transparent",
            segmented_button_fg_color="#0c1425",
            segmented_button_selected_color=COLOR_ACCENT_AMBER,
            segmented_button_selected_hover_color="#d97706",
            segmented_button_unselected_color="#111b2e",
            segmented_button_unselected_hover_color="#1a2c4e",
            text_color=COLOR_FG_TEXT,
        )
        self.tabview.pack(expand=True, fill="both", padx=18, pady=(14, 0))

        self.tabview._segmented_button.configure(
            font=("Helvetica", 20, "bold"),
            height=250,
            corner_radius=6,
            border_width=1,
        )

        # Erhöhtes Spacing durch Padding-Leerzeichen (Zentrierung gewahrt)
        self.tab_daily = self.tabview.add("    Daily    ")
        self.tab_nodes = self.tabview.add("    Nodes    ")
        self.tab_web   = self.tabview.add("     Web     ")
        self.tab_info  = self.tabview.add("     Info    ")
        self.tab_build = self.tabview.add("    Build    ")
        self.tabview.set("    Nodes    ")

        # Oberer Innenabstand je Tab
        for tab in [self.tab_daily, self.tab_nodes, self.tab_web, self.tab_info, self.tab_build]:
            ctk.CTkLabel(tab, text="", height=8, fg_color="transparent").pack()

        self.create_daily_tab()
        self.create_nodes_tab()
        self.create_web_tab()
        self.create_info_tab()
        self.create_build_tab()

    # ── Tab: Daily Tools ────────────────────────────
    def create_daily_tab(self):
        f = self.tab_daily

        card = self.make_card(f, "Netzwerk & System", ">")
        self.add_button(card, "Eigene IP-Adresse anzeigen",
            lambda: run_interactive_cmd(
                "echo -e '\\033[1;32mNetzwerk-Schnittstellen:\\033[0m'; ip -brief address show; echo ''; read -p 'Enter zum Schliessen...'",
                "IP Adresse"),
            copy_cmd="ip -brief address show")
        cmd_find = 'read -p "Welcher Dateiname?: " st; find / -iname "*${st}*" 2>/dev/null'
        self.add_button(card, "Datei im System suchen",
            lambda: run_interactive_cmd(cmd_find, "System Suche"),
            copy_cmd='find / -iname "*<NAME>*" 2>/dev/null')

        card2 = self.make_card(f, "Umgebung (.bashrc)", ">")
        self.add_button(card2, "~/.bashrc neu laden (source)",
            lambda: run_interactive_cmd(
                "source ~/.bashrc && echo -e '\\033[1;32m.bashrc geladen!\\033[0m'; sleep 2",
                "Source Bashrc"),
            copy_cmd="source ~/.bashrc")

    # ── Tab: ROS-Info ───────────────────────────────
    def create_info_tab(self):
        scroll = ctk.CTkScrollableFrame(self.tab_info, fg_color="transparent")
        scroll.pack(expand=True, fill="both")

        card = self.make_card(scroll, "Listen & Status", ">")
        for text, cmd, title in [
            ("Aktive Nodes",          "ros2 node list",     "Nodes"),
            ("Aktive Topics",         "ros2 topic list -t", "Topics"),
            ("Aktive Services",       "ros2 service list",  "Services"),
            ("Globale Parameter",     "ros2 param list",    "Parameter"),
            ("Alle ROS 2 Pakete",     "ros2 pkg list",      "Packages"),
        ]:
            self.add_button(card, text, lambda c=cmd, t=title: run_cmd(c, t), copy_cmd=cmd)

        card2 = self.make_card(scroll, "Visualisierung", ">")
        self.add_button(card2, "RViz2 starten",             lambda: run_cmd("rviz2",      "RViz2"),     copy_cmd="rviz2")
        self.add_button(card2, "RQT Graph (Node-Netzwerk)", lambda: run_cmd("rqt_graph",  "RQT Graph"), copy_cmd="rqt_graph")
        self.add_button(card2, "RQT (Generelle GUI)",       lambda: run_cmd("rqt",        "RQT"),       copy_cmd="rqt")

        card3 = self.make_card(scroll, "Live-Debugging", ">")
        cmd_echo = 'read -p "Topic: " tp; ros2 topic echo $tp'
        self.add_button(card3, "Topic Echo (Live-Daten)",
            lambda: run_interactive_cmd(cmd_echo, "Topic Echo"),
            copy_cmd="ros2 topic echo <TOPIC>")
        cmd_hz = 'read -p "Topic: " tp; ros2 topic hz $tp'
        self.add_button(card3, "Topic Hz (Publish-Rate)",
            lambda: run_interactive_cmd(cmd_hz, "Topic Hz"),
            copy_cmd="ros2 topic hz <TOPIC>")
        cmd_msg = 'read -p "Message-Typ: " msg; ros2 interface show $msg; echo ""; read -p "Enter..."'
        self.add_button(card3, "Interface / Message Aufbau",
            lambda: run_interactive_cmd(cmd_msg, "Interface Info"),
            copy_cmd="ros2 interface show <TYPE>")
        self.add_button(card3, "System Check  (ros2 doctor)",
            lambda: run_cmd("ros2 doctor", "ROS Doctor"),
            copy_cmd="ros2 doctor")

    # -- Tab: Build --
    def create_build_tab(self):
        f = self.tab_build

        card = self.make_card(f, "Build & Workspace", ">")
        self.add_button(card, "Colcon Build  (--symlink-install)",
            lambda: run_cmd("colcon build --symlink-install", "Colcon Build", "~/dev_ws"),
            fg_color=COLOR_ACCENT_GREEN, text_color="#022c1a",
            copy_cmd="colcon build --symlink-install")

        card2 = self.make_card(f, "Wartung & Reset", "!")
        kill_cmd = ("pkill -9 -f 'rosbridge_server' && pkill -9 -f 'rosbridge_websocket' && "
                    "pkill -9 -f 'rosapi_node' && pkill -9 -f 'workspace_analyzer' && "
                    "pkill -9 -f 'lite6' && pkill -9 -f 'http.server'")
        self.add_button(card2, "ALLE ROS-Prozesse beenden",
            lambda: run_bg_cmd(kill_cmd),
            fg_color=COLOR_ACCENT_AMBER, text_color="#1a0e00",
            copy_cmd=kill_cmd)

    # ── Tab: Nodes ──────────────────────────────────
    def create_nodes_tab(self):
        scroll = ctk.CTkScrollableFrame(self.tab_nodes, fg_color="transparent")
        scroll.pack(expand=True, fill="both")

        card = self.make_card(scroll, "Controller (Joy)", ">")
        joy = '"{header: {stamp: {sec: 0, nanosec: 0}, frame_id: \'base_link\'}, axes: [0.0, 1.0, 0.0, 0.0], buttons: [0, 0, 0, 0]}"'
        self.add_button(card, "Pub  /joy  (Rate 10)",
            lambda: run_cmd(f"ros2 topic pub --rate 10 /joy sensor_msgs/msg/Joy {joy}", "Joy Pub"),
            copy_cmd=f"ros2 topic pub --rate 10 /joy sensor_msgs/msg/Joy {joy}")
        self.add_button(card, "Pub  /joy_check  (Rate 10)",
            lambda: run_cmd(f"ros2 topic pub --rate 10 /joy_check sensor_msgs/msg/Joy {joy}", "Joy Check Pub"),
            copy_cmd=f"ros2 topic pub --rate 10 /joy_check sensor_msgs/msg/Joy {joy}")

        card2 = self.make_card(scroll, "Robotik & MoveIt", ">")
        self.add_button(card2, "Real Move Launch  (X-Arm Servo)",
            lambda: run_cmd("ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_gripper:=true report_type:=dev", "Real Move"),
            copy_cmd="ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_gripper:=true report_type:=dev")
        self.add_button(card2, "Fake Move Launch  (Simulation)",
            lambda: run_cmd("ros2 launch xarm_moveit_servo lite6_moveit_servo_fake.launch.py", "Fake Move"),
            copy_cmd="ros2 launch xarm_moveit_servo lite6_moveit_servo_fake.launch.py")
        self.add_button(card2, "Keyboard Input Node",
            lambda: run_cmd("ros2 run xarm_moveit_servo xarm_keyboard_input", "Keyboard Input"),
            copy_cmd="ros2 run xarm_moveit_servo xarm_keyboard_input")

        card3 = self.make_card(scroll, "Planung & Logik", ">")
        self.add_button(card3, "Move To Coordinator Node",
            lambda: run_cmd("ros2 run move_to_coordinator move_to_coordinator", "Coordinator"),
            copy_cmd="ros2 run move_to_coordinator move_to_coordinator")
        self.add_button(card3, "Motion Sequence Launch",
            lambda: run_cmd("ros2 launch motion_sequence motion_sequence_launch.py", "Motion Sequence"),
            copy_cmd="ros2 launch motion_sequence motion_sequence_launch.py")
        self.add_button(card3, "Collision Check Node",
            lambda: run_cmd("ros2 run collision_check checker", "Collision Check"),
            copy_cmd="ros2 run collision_check checker")

        card4 = self.make_card(scroll, "Vision & Voice", ">")
        self.add_button(card4, "YOLO Homographie Node",
            lambda: run_cmd("ros2 run yolo_object_detector yolo_homography_node", "YOLO"),
            copy_cmd="ros2 run yolo_object_detector yolo_homography_node")
        self.add_button(card4, "RViz Marker Publisher Node",
            lambda: run_cmd("ros2 run rviz_marker marker_publisher", "RViz Marker"),
            copy_cmd="ros2 run rviz_marker marker_publisher")
        self.add_button(card4, "Whisper Bringup Launch",
            lambda: run_cmd("ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=True", "Whisper Bringup"),
            copy_cmd="ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=True")
        self.add_button(card4, "Whisper Stream Demo Node",
            lambda: run_cmd("ros2 run whisper_demos whisper_on_key", "Whisper Demo"),
            copy_cmd="ros2 run whisper_demos whisper_on_key")
        self.add_button(card4, "Voice Command Listener Node",
            lambda: run_cmd("ros2 run voice_command_listener listener", "Voice Listener"),
            copy_cmd="ros2 run voice_command_listener listener")

    # ── Tab: Web Service ────────────────────────────
    def create_web_tab(self):
        f = self.tab_web

        card = self.make_card(f, "Backend & Server", ">")
        self.add_button(card, "ROS Bridge Launch  (Websocket)",
            lambda: run_cmd("ros2 launch rosbridge_server rosbridge_websocket_launch.xml", "ROS Bridge"),
            copy_cmd="ros2 launch rosbridge_server rosbridge_websocket_launch.xml")
        self.add_button(card, "Webserver starten  (Port 8080)",
            lambda: run_cmd("python3 -m http.server 8080 -d src/websocket", "Webserver"),
            copy_cmd="python3 -m http.server 8080 -d src/websocket")
        self.add_button(card, "Workspace Analyzer Script",
            lambda: run_cmd("python3 src/websocket/workspace_analyzer.py", "Workspace Analyzer"),
            copy_cmd="python3 src/websocket/workspace_analyzer.py")

        # Weiße Trennlinie mit Abstand über dem Text "Frontend"
        ctk.CTkFrame(f, height=1, fg_color=COLOR_FG_TEXT).pack(fill="x", pady=(80, 10), padx=30)

        card2 = self.make_card(f, "Frontend", ">")
        self.add_button(card2, "Dashboard im Browser öffnen",
            lambda: run_bg_cmd("xdg-open http://localhost:8080/dashboard_index.html"),
            fg_color=COLOR_ACCENT_GREEN, text_color="#022c1a",
            copy_cmd="xdg-open http://localhost:8080/dashboard_index.html")
        self.add_button(card2, "OBS Studio",
            lambda: run_cmd("obs", "OBS Studio"),
            copy_cmd="obs")

    # ── Footer ──────────────────────────────────────
    def setup_footer(self):
        footer = ctk.CTkFrame(self, fg_color=COLOR_BG_SURFACE, height=70, corner_radius=0)
        footer.pack(side="bottom", fill="x")
        footer.pack_propagate(False)

        # Dezente Trennlinie
        ctk.CTkFrame(footer, height=1, fg_color=COLOR_BORDER).pack(fill="x")

        btn_frame = ctk.CTkFrame(footer, fg_color="transparent")
        btn_frame.pack(expand=True)

        self._footer_btn(btn_frame, "✎  bashrc",   lambda: run_interactive_cmd("nano ~/.bashrc", "Bashrc Editor"))
        self._footer_btn(btn_frame, "⌨  Code",     open_editor)
        self._footer_btn(btn_frame, "↻  Neu laden", reload_app, fg_color=COLOR_ACCENT_AMBER, text_color="#1a0e00")

    # ── Widget-Helpers ──────────────────────────────
    def make_card(self, master, title, icon="▸"):
        """Erstellt eine visuell abgegrenzte Section-Card."""
        outer = ctk.CTkFrame(master, fg_color="transparent")
        outer.pack(fill="x", pady=(14, 0), padx=4)

        # Header: zentriert, große Schrift
        ctk.CTkLabel(outer, text=title,
                     text_color=COLOR_ACCENT, # Helleres Cyber-Cyan (#22d3ee)
                     font=("Helvetica", 22, "bold")).pack(pady=(0, 8))

        # Card-Body mit Border
        card_body = ctk.CTkFrame(outer, fg_color=COLOR_BG_CARD,
                                 corner_radius=14, border_width=1, border_color=COLOR_BORDER)
        card_body.pack(fill="x")
        inner = ctk.CTkFrame(card_body, fg_color="transparent")
        inner.pack(fill="x", padx=12, pady=10)
        return inner

    def add_button(self, master, text, command,
                   fg_color=COLOR_BG_BTN, text_color=COLOR_FG_TEXT, copy_cmd=None):
        if copy_cmd is not None:
            row = ctk.CTkFrame(master, fg_color="transparent")
            row.pack(fill="x", pady=3)

            btn = ctk.CTkButton(
                row, text=text, command=command,
                fg_color=fg_color, text_color=text_color,
                hover_color=COLOR_HOVER, height=48,
                font=("Helvetica", 15, "bold"),
                border_width=1, border_color=COLOR_BORDER,
                corner_radius=10,
            )
            btn.pack(side="left", fill="x", expand=True)

            copy_btn = ctk.CTkButton(
                row, text="⧉", width=44, height=48,
                fg_color=COLOR_BG_CARD, text_color=COLOR_FG_MUTED,
                hover_color=COLOR_HOVER,
                border_width=1, border_color=COLOR_BORDER,
                corner_radius=10, font=("Helvetica", 17),
                command=lambda c=copy_cmd, b=None: self._copy_to_clipboard(c, copy_btn_ref),
            )
            copy_btn.pack(side="left", padx=(4, 0))
            copy_btn_ref = copy_btn
        else:
            ctk.CTkButton(
                master, text=text, command=command,
                fg_color=fg_color, text_color=text_color,
                hover_color=COLOR_HOVER, height=48,
                font=("Helvetica", 15, "bold"),
                border_width=1, border_color=COLOR_BORDER,
                corner_radius=10,
            ).pack(fill="x", pady=3)

    def _copy_to_clipboard(self, text, btn):
        self.clipboard_clear()
        self.clipboard_append(text)
        orig_text  = btn.cget("text")
        orig_color = btn.cget("text_color")
        btn.configure(text="✓", text_color=COLOR_ACCENT_GREEN)
        self.after(1300, lambda: btn.configure(text=orig_text, text_color=orig_color))

    def _footer_btn(self, master, text, command, fg_color=COLOR_BG_CARD, text_color=COLOR_FG_TEXT):
        ctk.CTkButton(
            master, text=text, command=command,
            fg_color=fg_color, text_color=text_color,
            hover_color=COLOR_HOVER, height=40,
            font=("Helvetica", 12, "bold"),
            border_width=1, border_color=COLOR_BORDER,
            corner_radius=9,
        ).pack(side="left", padx=8, pady=15)


if __name__ == "__main__":
    app = ROS2MasterControl()
    app.mainloop()