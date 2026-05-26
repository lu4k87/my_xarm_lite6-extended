import customtkinter as ctk
import subprocess
import sys
import os
import shlex
from PIL import Image, ImageTk
import tkinter as tk

class ToolTip:
    def __init__(self, widget, text):
        self.widget = widget
        self.text = text
        self.tw = None
        self.id = None
        self.widget.bind("<Enter>", self.enter, add="+")
        self.widget.bind("<Leave>", self.leave, add="+")

    def enter(self, event=None):
        self.schedule()

    def leave(self, event=None):
        self.unschedule()
        self.hide()

    def schedule(self):
        self.unschedule()
        self.id = self.widget.after(500, self.show)

    def unschedule(self):
        if self.id:
            self.widget.after_cancel(self.id)
            self.id = None

    def show(self):
        self.unschedule()
        x, y, cx, cy = self.widget.bbox("insert") or (0,0,0,0)
        x += self.widget.winfo_rootx() + 25
        y += self.widget.winfo_rooty() + 25
        self.tw = tk.Toplevel(self.widget)
        self.tw.wm_overrideredirect(True)
        self.tw.wm_geometry(f"+{x}+{y}")
        self.tw.configure(bg="#22283a")
        label = ctk.CTkLabel(self.tw, text=self.text, justify='left',
                             fg_color="#151923", text_color="#38bdf8", corner_radius=0,
                             font=("JetBrains Mono", 11), padx=8, pady=4)
        label.pack(padx=1, pady=1)

    def hide(self):
        if self.tw:
            self.tw.destroy()
            self.tw = None

ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

# ── Farbpalette (Modern, Clean, Dark) ────────────────
COLOR_BG_MAIN      = "#0a0c10"  # Sehr dunkler Hintergrund für das Fenster
COLOR_BG_SURFACE   = "#11141c"  # Minimal heller für den Header/Footer
COLOR_BG_SECTION   = "#151923"  # Leicht transparenter Look für Sections
COLOR_BORDER       = "#22283a"  # Subtile Ränder

COLOR_BTN_BG       = "#1e2638"
COLOR_BTN_HOVER    = "#29354d"
COLOR_BTN_TEXT     = "#e2e8f0"

COLOR_BADGE_NODE   = "#2563eb"  # Blau
COLOR_BADGE_LAUNCH = "#059669"  # Grün
COLOR_BADGE_SYS    = "#9333ea"  # Lila
COLOR_BADGE_KILL   = "#e11d48"  # Rot

COLOR_TEXT_MUTED   = "#8b949e"
COLOR_ACCENT       = "#38bdf8"

# ── Backend ──────────────────────────────────────────
def run_cmd(command, title="ROS 2 Terminal", ws_path="~/dev_ws"):
    domain_id = os.environ.get("ROS_DOMAIN_ID", "66")
    rmw_impl  = os.environ.get("RMW_IMPLEMENTATION", "rmw_cyclonedds_cpp")
    ros_setup = "source /opt/ros/humble/setup.bash"
    ws_setup  = f"source {ws_path}/install/setup.bash"
    display_str = f"{ros_setup} && {ws_setup} && cd {ws_path} && {command}"
    cmd_parts   = [p.strip() for p in display_str.split('&&')]
    formatted   = "\n".join([f" \033[1;36mCMD:\033[0m \033[1;37m{p}\033[0m" for p in cmd_parts])
    safe_disp   = formatted.replace('"', '\\"')
    script = f"""export ROS_DOMAIN_ID={domain_id}
export RMW_IMPLEMENTATION={rmw_impl}
export ROS_LOCALHOST_ONLY=0
source ~/.bashrc 2>/dev/null || true
{ros_setup} 2>/dev/null || true
{ws_setup} 2>/dev/null || true
cd {ws_path} 2>/dev/null || true
clear
echo -e "\033[1;35mROS 2 Humble  |  Domain: {domain_id}  |  RMW: {rmw_impl}\033[0m"
echo -e "\033[1;33m═══════════════════════════════════════════════════════════\033[0m"
echo -e "{safe_disp}"
echo -e "\033[1;33m═══════════════════════════════════════════════════════════\033[0m\n"
{command}
"""
    safe = shlex.quote(script)
    subprocess.Popen(f'gnome-terminal --title="{title}" -- bash -c \'eval "$1"; exec bash\' _ {safe}', shell=True)

def run_interactive_cmd(command, title="System Tool"):
    domain_id = os.environ.get("ROS_DOMAIN_ID", "66")
    rmw_impl  = os.environ.get("RMW_IMPLEMENTATION", "rmw_cyclonedds_cpp")
    ros_setup = "source /opt/ros/humble/setup.bash"
    cmd_parts = [p.strip() for p in command.split('&&')]
    formatted = "\n".join([f" \033[1;36mCMD:\033[0m \033[1;37m{p}\033[0m" for p in cmd_parts])
    safe_disp = formatted.replace('"', '\\"')
    script = f"""export ROS_DOMAIN_ID={domain_id}
export RMW_IMPLEMENTATION={rmw_impl}
export ROS_LOCALHOST_ONLY=0
source ~/.bashrc 2>/dev/null || true
{ros_setup} 2>/dev/null || true
clear
echo -e "\033[1;35mROS 2 Humble  |  Domain: {domain_id}  |  RMW: {rmw_impl}\033[0m"
echo -e "\033[1;33m═══════════════════════════════════════════════════════════\033[0m"
echo -e "{safe_disp}"
echo -e "\033[1;33m═══════════════════════════════════════════════════════════\033[0m\n"
{command}
"""
    safe = shlex.quote(script)
    subprocess.Popen(f'gnome-terminal --title="{title}" -- bash -c \'eval "$1"; exec bash\' _ {safe}', shell=True)

def run_bg_cmd(command):
    env = os.environ.copy()
    env.setdefault("DISPLAY", ":0")
    subprocess.Popen(command, shell=True, env=env)

def open_editor():
    run_interactive_cmd("nano ~/dev_ws/_exec/ros2_nexus.py", "[EDIT] GUI Code")

def reload_app():
    os.environ.setdefault("DISPLAY", ":0")
    os.execl(sys.executable, sys.executable, *sys.argv)


# ══════════════════════════════════════════════════════
#  MAIN APPLICATION
# ══════════════════════════════════════════════════════
class ROS2MasterControl(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("ROS 2 Nexus")
        sw = self.winfo_screenwidth()
        sh = self.winfo_screenheight()
        w  = int(sw * 0.125)
        self.geometry(f"{w}x{sh}+0+0")
        self.configure(fg_color=COLOR_BG_MAIN)

        icon_path = os.path.join(os.path.abspath("."), "ros2_nexus_icon.png")
        if os.path.exists(icon_path):
            img = ImageTk.PhotoImage(Image.open(icon_path))
            self.iconphoto(False, img)

        self._build_header()
        self.setup_tabs()
        self.setup_footer()

    # ── System-Info Helpers ──────────────────────────
    @staticmethod
    def _source_ros_env(var_name):
        """Liest eine ROS-Umgebungsvariable (auch wenn sie nur in .bashrc exportiert wird)."""
        # 1. Direkt aus dem aktuellen Environment
        val = os.environ.get(var_name, "")
        if val:
            return val
        # 2. Fallback: interaktive bash, damit ~/.bashrc komplett geladen wird
        try:
            out = subprocess.check_output(
                ["bash", "-i", "-c", f"echo ${var_name}"],
                stderr=subprocess.DEVNULL, timeout=5
            ).decode().strip()
            # Letzte Zeile nehmen, falls bash Warnungen printet
            if out:
                return out.splitlines()[-1].strip()
        except Exception:
            pass
        return ""

    @classmethod
    def _detect_ros_distro(cls):
        """ROS 2 Distribution aus dem System lesen."""
        distro = cls._source_ros_env("ROS_DISTRO")
        if distro:
            return distro.capitalize()
        # Fallback: Verzeichnisname unter /opt/ros/
        try:
            entries = os.listdir("/opt/ros")
            if entries:
                return entries[0].capitalize()
        except OSError:
            pass
        return "Unknown"

    @classmethod
    def _detect_rmw(cls):
        """RMW / DDS-Implementierung aus dem System lesen."""
        rmw = cls._source_ros_env("RMW_IMPLEMENTATION")
        if not rmw:
            return "Unknown"
        # Menschenlesbaren Namen ableiten
        rmw_lower = rmw.lower()
        if "cyclone" in rmw_lower:
            return "Cyclone DDS"
        elif "fastrtps" in rmw_lower or "fast" in rmw_lower:
            return "Fast DDS"
        elif "connext" in rmw_lower:
            return "Connext DDS"
        elif "gurumdds" in rmw_lower:
            return "GurumDDS"
        return rmw

    @staticmethod
    def _detect_sourced_ws():
        """Liest den gesourcten Workspace-Pfad aus ~/.bashrc."""
        bashrc = os.path.expanduser("~/.bashrc")
        try:
            with open(bashrc, "r") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("#"):
                        continue
                    # Suche nach 'source .../install/setup.bash'
                    if "source" in line and "install/setup.bash" in line:
                        # Pfad extrahieren (alles nach 'source ')
                        parts = line.split("source", 1)
                        if len(parts) > 1:
                            ws_path = parts[1].strip().replace("/install/setup.bash", "")
                            # ~ auflösen für Anzeige
                            return ws_path
        except OSError:
            pass
        return ""

    # ── Header ──────────────────────────────────────
    def _build_header(self):
        hdr = ctk.CTkFrame(self, fg_color=COLOR_BG_SURFACE, height=55, corner_radius=0)
        hdr.pack(fill="x")
        hdr.pack_propagate(False)
        ctk.CTkFrame(hdr, height=1, fg_color=COLOR_BORDER).pack(side="bottom", fill="x")

        # Zeile 1: Titel + System-Infos
        row1 = ctk.CTkFrame(hdr, fg_color="transparent")
        row1.pack(fill="both", expand=True, padx=20)

        ctk.CTkLabel(row1, text="ROS 2 Nexus",
                     text_color=COLOR_ACCENT,
                     font=("Helvetica", 18, "bold")).pack(side="left")

        # Container für die dynamischen System-Infos (rechtsbündig)
        info_container = ctk.CTkFrame(row1, fg_color="transparent")
        info_container.pack(side="right")

        # Werte abfragen
        domain_id = self._source_ros_env("ROS_DOMAIN_ID") or "66"
        ros_distro = self._detect_ros_distro()
        rmw_name = self._detect_rmw()
        ws_path = self._detect_sourced_ws()

        info_parts = [
            f"ROS2: {ros_distro}",
            f"RMW: {rmw_name}",
            f"Domain ID: {domain_id}"
        ]
        if ws_path:
            info_parts.append(f"WS: {ws_path}")

        # Für jede Info ein eigenes kleines Badge erzeugen
        for part in info_parts:
            badge = ctk.CTkFrame(info_container, fg_color=COLOR_BG_SECTION, corner_radius=6, border_width=1, border_color=COLOR_BORDER)
            badge.pack(side="left", padx=(8, 0))
            ctk.CTkLabel(badge, text=part, text_color="#ffffff", font=("Helvetica", 11, "bold")).pack(padx=10, pady=3)

    # ── Tabs ────────────────────────────────────────
    def setup_tabs(self):
        self.tabview = ctk.CTkTabview(
            self, fg_color="transparent",
            segmented_button_fg_color=COLOR_BG_SECTION,
            segmented_button_selected_color="#f59e0b",
            segmented_button_selected_hover_color="#d97706",
            segmented_button_unselected_color=COLOR_BG_MAIN,
            segmented_button_unselected_hover_color=COLOR_BG_SECTION,
            text_color="#e2e8f0",
            text_color_disabled=COLOR_TEXT_MUTED,
        )
        self.tabview.pack(expand=True, fill="both", padx=12, pady=(5, 0))
        self.tabview._segmented_button.configure(
            font=("Helvetica", 13, "bold"), height=44, corner_radius=10,
            border_width=1)

        self.tab_robot  = self.tabview.add("Roboter")
        self.tab_nodes  = self.tabview.add("Nodes/Launch")
        self.tab_web    = self.tabview.add("Web")
        self.tab_info   = self.tabview.add("ROS Info")
        self.tab_system = self.tabview.add("System")
        self.tabview.set("Roboter")

        self.create_robot_tab()
        self.create_nodes_tab()
        self.create_web_tab()
        self.create_info_tab()
        self.create_system_tab()

    # ── Tab: Roboter ────────────────────────────────
    def create_robot_tab(self):
        scroll = ctk.CTkScrollableFrame(self.tab_robot, fg_color="transparent")
        scroll.pack(expand=True, fill="both")

        sec = self.make_section(scroll, "Hardware")
        self.add_action(sec, "Real Move Launch", lambda: run_cmd(
            "ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_gripper:=true report_type:=dev", "Real Move"),
            "launch", "ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_gripper:=true report_type:=dev")
        self.add_action(sec, "Fake Move Launch", lambda: run_cmd(
            "ros2 launch xarm_moveit_servo lite6_moveit_servo_fake.launch.py add_gripper:=true", "Fake Move"),
            "launch", "ros2 launch xarm_moveit_servo lite6_moveit_servo_fake.launch.py add_gripper:=true")
        self.add_action(sec, "Keyboard Input", lambda: run_cmd("ros2 run xarm_moveit_servo xarm_keyboard_input", "Keyboard Input"),
            "node", "ros2 run xarm_moveit_servo xarm_keyboard_input")

    # ── Tab: Nodes/Launch ───────────────────────────
    def create_nodes_tab(self):
        scroll = ctk.CTkScrollableFrame(self.tab_nodes, fg_color="transparent")
        scroll.pack(expand=True, fill="both")

        sec1 = self.make_section(scroll, "Planung & Logik")
        self.add_action(sec1, "Move To Coordinator", lambda: run_cmd("ros2 run move_to_coordinator move_to_coordinator", "Coordinator"),
            "node", "ros2 run move_to_coordinator move_to_coordinator")
        self.add_action(sec1, "Motion Sequence Launch", lambda: run_cmd("ros2 launch motion_sequence motion_sequence_launch.py", "Motion Sequence"),
            "launch", "ros2 launch motion_sequence motion_sequence_launch.py")
        self.add_action(sec1, "Collision Check Node", lambda: run_cmd("ros2 run collision_check checker", "Collision Check"),
            "node", "ros2 run collision_check checker")

        sec2 = self.make_section(scroll, "Vision & Eye-Tracking")
        self.add_action(sec2, "Eye UI Node", lambda: run_cmd("ros2 run eye_control eye_ui", "Eye UI"),
            "node", "ros2 run eye_control eye_ui")
        self.add_action(sec2, "YOLO Homographie", lambda: run_cmd("ros2 run yolo_object_detector yolo_homography_node", "YOLO"),
            "node", "ros2 run yolo_object_detector yolo_homography_node")
        self.add_action(sec2, "RViz Marker Launch", lambda: run_cmd("ros2 launch rviz_marker rviz_marker.launch.py", "RViz Marker"),
            "launch", "ros2 launch rviz_marker rviz_marker.launch.py")

        sec3 = self.make_section(scroll, "Sprache & Audio")
        self.add_action(sec3, "Whisper Bringup", lambda: run_cmd("ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=True", "Whisper Bringup"),
            "launch", "ros2 launch whisper_bringup bringup.launch.py silero_vad_use_cuda:=True")
        self.add_action(sec3, "Whisper Stream Demo", lambda: run_cmd("ros2 run whisper_demos whisper_on_key", "Whisper Demo"),
            "node", "ros2 run whisper_demos whisper_on_key")
        self.add_action(sec3, "Voice Command Listener", lambda: run_cmd("ros2 run voice_command_listener listener", "Voice Listener"),
            "node", "ros2 run voice_command_listener listener")

    # ── Tab: Web ────────────────────────────────────
    def create_web_tab(self):
        scroll = ctk.CTkScrollableFrame(self.tab_web, fg_color="transparent")
        scroll.pack(expand=True, fill="both")

        sec1 = self.make_section(scroll, "Backend & Server")
        self.add_action(sec1, "ROS Bridge Launch", lambda: run_cmd("ros2 launch rosbridge_server rosbridge_websocket_launch.xml", "ROS Bridge"),
            "launch", "ros2 launch rosbridge_server rosbridge_websocket_launch.xml")
        self.add_action(sec1, "Webserver Port 8080", lambda: run_cmd("python3 -m http.server 8080 -d src/websocket", "Webserver"),
            "sys", "python3 -m http.server 8080 -d src/websocket")
        self.add_action(sec1, "Workspace Analyzer", lambda: run_cmd("python3 src/websocket/workspace_analyzer.py", "Workspace Analyzer"),
            "sys", "python3 src/websocket/workspace_analyzer.py")

        sec2 = self.make_section(scroll, "Frontend & Browser")
        self.add_action(sec2, "Dashboard öffnen", lambda: run_bg_cmd("xdg-open http://localhost:8080/dashboard_index.html"),
            "sys", "xdg-open http://localhost:8080/dashboard_index.html")
        self.add_action(sec2, "OBS Studio", lambda: run_cmd("obs", "OBS Studio"),
            "sys", "obs")

    # ── Tab: ROS Info ───────────────────────────────
    def create_info_tab(self):
        scroll = ctk.CTkScrollableFrame(self.tab_info, fg_color="transparent")
        scroll.pack(expand=True, fill="both")

        sec1 = self.make_section(scroll, "Listen & Status")
        self.add_action(sec1, "Aktive Nodes",  lambda: run_cmd("ros2 node list", "Nodes"), "sys", "ros2 node list")
        self.add_action(sec1, "Aktive Topics", lambda: run_cmd("ros2 topic list -t", "Topics"), "sys", "ros2 topic list -t")
        self.add_action(sec1, "Services",      lambda: run_cmd("ros2 service list", "Services"), "sys", "ros2 service list")
        self.add_action(sec1, "Parameter",     lambda: run_cmd("ros2 param list", "Parameter"), "sys", "ros2 param list")
        self.add_action(sec1, "Alle Pakete",   lambda: run_cmd("ros2 pkg list", "Packages"), "sys", "ros2 pkg list")

        sec2 = self.make_section(scroll, "Visualisierung")
        self.add_action(sec2, "RViz2",      lambda: run_cmd("rviz2", "RViz2"), "launch", "rviz2")
        self.add_action(sec2, "RQT Graph",  lambda: run_cmd("rqt_graph", "RQT Graph"), "sys", "rqt_graph")
        self.add_action(sec2, "RQT",        lambda: run_cmd("rqt", "RQT"), "sys", "rqt")

        sec3 = self.make_section(scroll, "Live-Debugging")
        self.add_action(sec3, "Topic Echo", lambda: run_interactive_cmd('read -p "Topic: " tp; ros2 topic echo $tp', "Topic Echo"),
            "sys", "ros2 topic echo <TOPIC>")
        self.add_action(sec3, "Topic Hz",   lambda: run_interactive_cmd('read -p "Topic: " tp; ros2 topic hz $tp', "Topic Hz"),
            "sys", "ros2 topic hz <TOPIC>")
        self.add_action(sec3, "Interface Aufbau", lambda: run_interactive_cmd('read -p "Message-Typ: " msg; ros2 interface show $msg; echo ""; read -p "Enter..."', "Interface Info"),
            "sys", "ros2 interface show <TYPE>")
        self.add_action(sec3, "ros2 doctor", lambda: run_cmd("ros2 doctor", "ROS Doctor"),
            "sys", "ros2 doctor")

    # ── Tab: System ─────────────────────────────────
    def create_system_tab(self):
        scroll = ctk.CTkScrollableFrame(self.tab_system, fg_color="transparent")
        scroll.pack(expand=True, fill="both")

        sec1 = self.make_section(scroll, "Controller (Joy)")
        joy = '"{header: {stamp: {sec: 0, nanosec: 0}, frame_id: \'base_link\'}, axes: [0.0, 1.0, 0.0, 0.0], buttons: [0, 0, 0, 0]}"'
        self.add_action(sec1, "Pub /joy", lambda: run_cmd(f"ros2 topic pub --rate 10 /joy sensor_msgs/msg/Joy {joy}", "Joy Pub"),
            "node", f"ros2 topic pub --rate 10 /joy sensor_msgs/msg/Joy {joy}")
        self.add_action(sec1, "Pub /joy_check", lambda: run_cmd(f"ros2 topic pub --rate 10 /joy_check sensor_msgs/msg/Joy {joy}", "Joy Check"),
            "node", f"ros2 topic pub --rate 10 /joy_check sensor_msgs/msg/Joy {joy}")

        sec2 = self.make_section(scroll, "Netzwerk & System")
        self.add_action(sec2, "Eigene IP anzeigen", lambda: run_interactive_cmd("echo -e '\033[1;32mNetzwerk:\033[0m'; ip -brief address show; echo ''; read -p 'Enter...'", "IP Adresse"),
            "sys", "ip -brief address show")
        self.add_action(sec2, "Datei suchen", lambda: run_interactive_cmd('read -p "Dateiname?: " st; find / -iname "*${st}*" 2>/dev/null', "System Suche"),
            "sys", 'find / -iname "*<NAME>*" 2>/dev/null')

        sec3 = self.make_section(scroll, "Umgebung & Build")
        self.add_action(sec3, "bashrc neu laden", lambda: run_interactive_cmd("source ~/.bashrc && echo -e '\033[1;32m.bashrc geladen!\033[0m'; sleep 2", "Source Bashrc"),
            "sys", "source ~/.bashrc")
        self.add_action(sec3, "Colcon Build", lambda: run_cmd("colcon build --symlink-install", "Colcon Build", "~/dev_ws"),
            "sys", "colcon build --symlink-install")

        sec4 = self.make_section(scroll, "Notfall")
        kill_cmd = (
            "pkill -9 -f 'rosbridge_server' && pkill -9 -f 'rosbridge_websocket' && "
            "pkill -9 -f 'rosapi_node' && pkill -9 -f 'workspace_analyzer' && "
            "pkill -9 -f 'lite6' && pkill -9 -f 'http.server'"
        )
        self.add_action(sec4, "ALLE ROS-Prozesse beenden", lambda: run_bg_cmd(kill_cmd),
            "kill", kill_cmd)

    # ── Footer ──────────────────────────────────────
    def setup_footer(self):
        footer = ctk.CTkFrame(self, fg_color=COLOR_BG_SURFACE, height=60, corner_radius=0)
        footer.pack(side="bottom", fill="x")
        footer.pack_propagate(False)
        ctk.CTkFrame(footer, height=1, fg_color=COLOR_BORDER).pack(fill="x")
        
        row = ctk.CTkFrame(footer, fg_color="transparent")
        row.pack(expand=True)
        
        for text, cmd in [("~/.bashrc", lambda: run_interactive_cmd("nano ~/.bashrc", "Bashrc Editor")), 
                          ("Code Editor", open_editor), 
                          ("App Reload", reload_app)]:
            ctk.CTkButton(row, text=text, command=cmd,
                          fg_color=COLOR_BTN_BG, text_color=COLOR_BTN_TEXT,
                          hover_color=COLOR_BTN_HOVER, height=36,
                          font=("Helvetica", 12, "bold"),
                          border_width=1, border_color=COLOR_BORDER,
                          corner_radius=8).pack(side="left", padx=8, pady=12)

    # ── Design Helpers ──────────────────────────────
    def make_section(self, master, title):
        # Transparenter, abgerundeter Bereich für eine Section
        sec = ctk.CTkFrame(master, fg_color=COLOR_BG_SECTION, corner_radius=12, 
                           border_width=1, border_color=COLOR_BORDER)
        sec.pack(fill="x", pady=(8, 12), padx=6)
        
        # Cleaner Headertext für die Section
        title_lbl = ctk.CTkLabel(sec, text=title, text_color=COLOR_TEXT_MUTED, 
                                 font=("Helvetica", 13, "bold"), anchor="w")
        title_lbl.pack(fill="x", padx=16, pady=(12, 4))
        
        # Innerer Frame für die Action-Buttons
        inner = ctk.CTkFrame(sec, fg_color="transparent")
        inner.pack(fill="x", padx=10, pady=(0, 10))
        
        return inner

    def add_action(self, master, label, cmd, btype, copy_cmd=None):
        """Fügt eine saubere Zeile mit integriertem Badge im Button hinzu."""
        row = ctk.CTkFrame(master, fg_color="transparent")
        row.pack(fill="x", pady=3)

        # Style Definitionen anhand des Typs
        badge_map = {
            "node":   ("NODE",   COLOR_BADGE_NODE),
            "launch": ("LAUNCH", COLOR_BADGE_LAUNCH),
            "kill":   ("KILL",   COLOR_BADGE_KILL),
        }
        badge_text, badge_color = badge_map.get(btype, ("CMD", COLOR_BADGE_SYS))

        # Copy-Button zuerst packen (rechts), damit der Container den Rest füllt
        copy_btn_ref = None
        if copy_cmd:
            copy_btn = ctk.CTkButton(row, text="⧉", width=36, height=38,
                                     fg_color=COLOR_BTN_BG, text_color=COLOR_TEXT_MUTED,
                                     hover_color=COLOR_BTN_HOVER,
                                     border_width=1, border_color=COLOR_BORDER,
                                     corner_radius=8, font=("Helvetica", 16),
                                     command=lambda c=copy_cmd: self._copy(c, copy_btn_ref))
            copy_btn.pack(side="right", padx=(6, 0))
            copy_btn_ref = copy_btn

        # Button-Container füllt die gesamte verbleibende Breite
        btn_container = ctk.CTkFrame(row, fg_color=COLOR_BTN_BG, corner_radius=8,
                                     border_width=1, border_color=COLOR_BORDER)
        btn_container.pack(side="left", fill="x", expand=True)

        # Hover-Effekte
        def _enter(e):
            btn_container.configure(fg_color=COLOR_BTN_HOVER, border_color=COLOR_ACCENT)
        def _leave(e):
            btn_container.configure(fg_color=COLOR_BTN_BG, border_color=COLOR_BORDER)

        btn_container.bind("<Button-1>", lambda e: cmd())
        btn_container.bind("<Enter>", _enter)
        btn_container.bind("<Leave>", _leave)

        # Badge zuerst packen (rechts im Button, fixe Breite)
        badge = ctk.CTkLabel(btn_container, text=badge_text, fg_color=badge_color,
                             text_color="#ffffff", font=("Helvetica", 10, "bold"),
                             corner_radius=5, height=24, width=62)
        badge.pack(side="right", padx=(4, 10), pady=6)
        badge.bind("<Button-1>", lambda e: cmd())
        badge.bind("<Enter>", _enter)
        badge.bind("<Leave>", _leave)

        # Label (links im Button, füllt den Rest)
        btn_label = ctk.CTkLabel(btn_container, text=label,
                                 text_color=COLOR_BTN_TEXT,
                                 font=("Helvetica", 13, "bold"),
                                 anchor="center")
        btn_label.pack(side="left", fill="x", expand=True, padx=(14, 8), pady=6)
        btn_label.bind("<Button-1>", lambda e: cmd())
        btn_label.bind("<Enter>", _enter)
        btn_label.bind("<Leave>", _leave)

        # Tooltips hinzufügen
        hover_text = copy_cmd if copy_cmd else "Klick zum Ausführen"
        ToolTip(btn_container, hover_text)
        ToolTip(btn_label, hover_text)
        ToolTip(badge, hover_text)
        if copy_cmd and copy_btn_ref:
            ToolTip(copy_btn_ref, hover_text)

    def _copy(self, text, btn):
        self.clipboard_clear()
        self.clipboard_append(text)
        orig_text  = btn.cget("text")
        orig_color = btn.cget("text_color")
        btn.configure(text="✓", text_color=COLOR_BADGE_LAUNCH)
        self.after(1200, lambda: btn.configure(text=orig_text, text_color=orig_color))

if __name__ == "__main__":
    app = ROS2MasterControl()
    app.mainloop()
