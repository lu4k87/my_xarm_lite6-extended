#!/usr/bin/env python3
"""
workspace_analyzer.py – ROS 2 Dashboard Backend
Optimierungen (2025-03):
  - Topology-Abfrage nur bei Änderung der Node-Liste (Diff)
  - exe-cache in separatem Thread (kein Blockieren des ROS-Spin)
  - Activity-Subscriptions: Diff-basiert (keine vollen Rebuilds)
  - last_messages beim untrack clearen
  - Debug-Prints → get_logger().debug()
  - /tmp-Debug-Schreiben entfernt
  - pulse_timer 2s → 3s
"""
import rclpy
from rclpy.node import Node
from std_msgs.msg import String
import json
import os
import glob
import re
import subprocess
import time
import copy
import threading
from rclpy.qos import QoSProfile, QoSHistoryPolicy, QoSReliabilityPolicy
from rosidl_runtime_py.utilities import get_message


class WorkspaceAnalyzer(Node):
    def __init__(self):
        super().__init__('workspace_analyzer')

        self.publisher_       = self.create_publisher(String, '/dashboard/workspace_metadata', 10)
        self.code_req_sub     = self.create_subscription(String, '/dashboard/request_file_content',  self.handle_code_request,     10)
        self.code_pub         = self.create_publisher  (String, '/dashboard/file_content',           10)
        self.explorer_sub     = self.create_subscription(String, '/dashboard/request_open_explorer', self.handle_open_explorer,    10)

        self.workspace_path = os.path.expanduser('~/dev_ws/src')
        self.base_ws_path   = os.path.expanduser('~/dev_ws')

        # ── Caches ────────────────────────────────────────────────────────────
        self.pkg_cache                = {}
        self.pkg_dependencies_cache   = {}
        self.source_files_cache       = []
        self.launch_files_cache       = []
        self.node_info_cache          = {}
        self.workspace_tree_cache     = {}
        self.project_files_cache      = {}
        self.launch_details_cache     = []
        self.bashrc_mtime             = 0
        self.bashrc_cache             = []
        self.startup_sh_mtime         = 0
        self.startup_sh_cache         = set()

        # ── Topic-Activity ────────────────────────────────────────────────────
        self.tracked_topics   = []
        self.subs             = {}          # topic → subscription
        self.message_counts   = {}          # topic → int
        self.last_messages    = {}          # topic → str
        self.last_publish_time = time.time()
        self.last_topology_update = 0        # Timestamp für Topology-Vollrefreh

        self.cmd_sub      = self.create_subscription(String, '/dashboard/request_topic_activity', self.handle_activity_request, 10)
        self.activity_pub = self.create_publisher  (String, '/dashboard/topic_activity',          10)
        self.activity_timer = self.create_timer(0.5, self.publish_activity)

        # ── CLI / Exe-Cache (Thread-safe) ─────────────────────────────────────
        self.cli_node_cache    = {}
        self.last_cli_update   = 0
        self.executable_pkg_map = {}
        self._exe_cache_lock   = threading.Lock()   # Schützt executable_pkg_map
        self._exe_cache_refresh_done = False

        # ── Topology-Diff: Merker für letzte bekannte Node-Menge ──────────────
        self._last_known_nodes: set = set()          # full_names
        self._topology_cache: dict  = {}             # full_name → {publishers, subscribers}

        # ── On-Demand Node-Details ────────────────────────────────────────────
        self.node_detail_sub = self.create_subscription(
            String, '/dashboard/request_node_details', self.handle_node_detail_request, 10)

        # ── Initialisierung ───────────────────────────────────────────────────
        self.index_workspace()

        # Full Metadata alle 10 s  |  Pulse alle 3 s (statt 2 s)
        self.timer       = self.create_timer(10.0, self.publish_metadata)
        self.pulse_timer = self.create_timer( 3.0, self.publish_active_nodes_pulse)

        # Exe-Cache 30 s nach Start im Hintergrund auffrischen
        self.create_timer(30.0, self._schedule_exe_cache_refresh)

    # ═══════════════════════════════════════════════════════════════════════════
    # ON-DEMAND NODE DETAILS
    # ═══════════════════════════════════════════════════════════════════════════
    def handle_node_detail_request(self, msg):
        """Wird aufgerufen wenn im Dashboard ein Node ausgewählt wird."""
        node_name = msg.data.strip()
        if not node_name:
            return

        parts = node_name.rsplit('/', 1)
        ns   = parts[0] if len(parts) > 1 else '/'
        if not ns: ns = '/'
        name = parts[1] if len(parts) > 1 else parts[0]

        self.get_logger().info(f"On-Demand Details angefordert für: {node_name}")

        try:
            pubs    = self.get_publisher_names_and_types_by_node(name, ns)
            subs    = self.get_subscriber_names_and_types_by_node(name, ns)
            srvs    = self.get_service_names_and_types_by_node(name, ns)
            clients = self.get_client_names_and_types_by_node(name, ns)

            node_data = {
                "publishers":  [{"topic": t[0], "types": t[1]} for t in pubs],
                "subscribers": [{"topic": t[0], "types": t[1]} for t in subs],
                "services":    [{"name":  t[0], "types": t[1]} for t in srvs],
                "clients":     [{"name":  t[0], "types": t[1]} for t in clients],
            }
            self.cli_node_cache[node_name] = node_data

            # Topology-Cache für diesen Node sofort aktualisieren
            self._topology_cache[node_name] = {
                "publishers":  node_data["publishers"],
                "subscribers": node_data["subscribers"],
            }

            self.publish_metadata()
        except Exception as e:
            self.get_logger().error(f"Fehler bei On-Demand Abfrage: {e}")

    # ═══════════════════════════════════════════════════════════════════════════
    # STANDARD HANDLERS
    # ═══════════════════════════════════════════════════════════════════════════
    def handle_open_explorer(self, msg):
        req_path = msg.data.strip()
        if not req_path or req_path == 'Pfad unbekannt':
            return
        full_path = req_path if os.path.isabs(req_path) else os.path.join(self.base_ws_path, req_path)
        try:
            if not os.path.exists(full_path):
                base = os.path.basename(full_path)
                for cache_file in self.source_files_cache + self.launch_files_cache:
                    if os.path.basename(cache_file) == base:
                        full_path = cache_file
                        break
            if os.path.exists(full_path):
                target_dir = os.path.dirname(full_path) if os.path.isfile(full_path) else full_path
                subprocess.Popen(['xdg-open', target_dir])
        except Exception as e:
            self.get_logger().error(f"Explorer Error: {e}")

    def handle_code_request(self, msg):
        req_path = msg.data.strip()
        full_path = req_path if os.path.isabs(req_path) else os.path.join(self.base_ws_path, req_path)
        response  = {"path": req_path, "original_request": req_path, "content": "Datei konnte nicht gelesen werden."}
        try:
            if not os.path.exists(full_path):
                base = os.path.basename(full_path)
                for cache_file in self.source_files_cache + self.launch_files_cache:
                    if os.path.basename(cache_file) == base:
                        full_path = cache_file
                        response["path"] = os.path.relpath(full_path, self.base_ws_path)
                        break
            if os.path.exists(full_path):
                with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                    response["content"] = f.read()
            else:
                response["content"] = f"Fehler: Datei nicht gefunden:\n{full_path}"
        except Exception as e:
            response["content"] = f"Fehler beim Lesen:\n{str(e)}"
        self.code_pub.publish(String(data=json.dumps(response)))

    # ═══════════════════════════════════════════════════════════════════════════
    # TOPIC ACTIVITY  (Diff-basierte Subscription-Verwaltung)
    # ═══════════════════════════════════════════════════════════════════════════
    def handle_activity_request(self, msg):
        try:
            req        = json.loads(msg.data)
            new_topics = req.get('topics', [])
            new_set    = {t['topic'] for t in new_topics}
            old_set    = set(self.subs.keys())

            # Subs entfernen die nicht mehr gebraucht werden
            to_remove = old_set - new_set
            for topic in to_remove:
                try:
                    self.destroy_subscription(self.subs.pop(topic))
                except Exception:
                    pass
                self.message_counts.pop(topic, None)
                self.last_messages.pop(topic, None)   # Speicher freigeben

            # Neue Subs nur für wirklich neue Topics anlegen
            qos = QoSProfile(
                history=QoSHistoryPolicy.KEEP_LAST,
                depth=1,
                reliability=QoSReliabilityPolicy.BEST_EFFORT,
            )
            for t_info in new_topics:
                topic_name     = t_info['topic']
                topic_type_str = t_info.get('type')

                if topic_name in self.subs:
                    # Subscription existiert bereits → nichts tun
                    continue

                if not topic_type_str or topic_type_str == "Unbekannt":
                    for t, types in self.get_topic_names_and_types():
                        if t == topic_name and types:
                            topic_type_str = types[0]
                            break

                if not topic_type_str or topic_type_str == "Unbekannt":
                    self.get_logger().debug(f"Kein Typ für Topic {topic_name} – übersprungen")
                    continue

                try:
                    msg_class = get_message(topic_type_str)
                    if msg_class:
                        self.message_counts[topic_name] = 0

                        def make_cb(t_name):
                            def cb(m):
                                self.message_counts[t_name] += 1
                                msg_str = str(m)
                                # Bandbreitenbegrenzung (Kamera, YOLO etc.)
                                if len(msg_str) > 2000:
                                    msg_str = msg_str[:2000] + "... [TRUNCATED]"
                                self.last_messages[t_name] = msg_str
                            return cb

                        self.subs[topic_name] = self.create_subscription(
                            msg_class, topic_name, make_cb(topic_name), qos)
                        self.get_logger().debug(f"Neu abonniert: {topic_name} [{topic_type_str}]")
                    else:
                        self.get_logger().debug(f"Message-Klasse nicht gefunden: {topic_type_str}")
                except Exception as e:
                    self.get_logger().debug(f"Fehler beim Abonnieren von {topic_name}: {e}")

            self.tracked_topics = new_topics

        except Exception as e:
            self.get_logger().error(f"handle_activity_request Fehler: {e}")

    def publish_activity(self):
        if not self.tracked_topics:
            return
        current_time = time.time()
        dt           = current_time - self.last_publish_time
        self.last_publish_time = current_time

        activity_data = {}
        for topic, count in self.message_counts.items():
            hz        = count / dt if dt > 0 else 0
            is_active = count > 0
            activity_data[topic] = {
                "hz":       round(hz, 1),
                "active":   is_active,
                "last_msg": self.last_messages.get(topic, ""),
            }
            self.message_counts[topic] = 0

        if activity_data:
            self.activity_pub.publish(String(data=json.dumps(activity_data)))

    # ═══════════════════════════════════════════════════════════════════════════
    # NODE PULSE  (3 s Intervall statt 2 s)
    # ═══════════════════════════════════════════════════════════════════════════
    def publish_active_nodes_pulse(self):
        """Schickt nur die Liste der aktiven Node-Namen für Sidebar-Punkte."""
        try:
            node_names_and_ns = self.get_node_names_and_namespaces()
            running_names     = {f"{ns}/{n}".replace('//', '/') for n, ns in node_names_and_ns}
            
            # Sofortiges Metadaten-Update triggern, wenn sich die Node-Liste geändert hat
            if running_names != self._last_known_nodes:
                self.get_logger().info(f"Node-Change im Pulse erkannt ({len(self._last_known_nodes)} -> {len(running_names)}). Trigger Metadata...")
                self.publish_metadata()
                return # publish_metadata schickt bereits den Pulse mit

            self.publisher_.publish(String(data=json.dumps({
                "type": "node_pulse",
                "active_nodes": list(running_names),
            })))
        except Exception:
            pass

    # ═══════════════════════════════════════════════════════════════════════════
    # WORKSPACE INDEXING
    # ═══════════════════════════════════════════════════════════════════════════
    def build_file_tree(self, path):
        tree = {"name": os.path.basename(path), "type": "folder", "children": []}
        try:
            entries = sorted(os.listdir(path))
            SKIP    = {'build', 'install', 'log', '.git', '__pycache__'}
            dirs    = [e for e in entries if os.path.isdir(os.path.join(path, e))  and e not in SKIP]
            files   = [e for e in entries if os.path.isfile(os.path.join(path, e))]
            for d in dirs:
                tree["children"].append(self.build_file_tree(os.path.join(path, d)))
            for f in files:
                if f.endswith(('.py', '.cpp', '.hpp', '.xml', '.yaml', '.txt', '.json')):
                    tree["children"].append({"name": f, "type": "file"})
        except Exception:
            pass
        return tree

    def index_workspace(self):
        if not os.path.exists(self.workspace_path):
            self.workspace_tree_cache = {"name": "dev_ws/src", "type": "folder", "children": [
                {"name": "Pfad nicht gefunden", "type": "file"}
            ]}
            return

        self.workspace_tree_cache = self.build_file_tree(self.workspace_path)

        # Package.xml parsen
        for xml_path in glob.glob(os.path.join(self.workspace_path, '**', 'package.xml'), recursive=True):
            pkg_dir  = os.path.dirname(xml_path)
            pkg_name = os.path.basename(pkg_dir)
            deps     = []
            try:
                with open(xml_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                # Robustes Parsing von Name und Dependencies (auch mit Attributen oder Zeilenumbrüchen)
                match = re.search(r'<name(?:\s+[^>]*)?>(.*?)</name>', content, re.DOTALL)
                if match:
                    pkg_name = match.group(1).strip()
                
                # Tags: depend, build_depend, etc.
                pattern = r'<(depend|build_depend|build_export_depend|exec_depend|test_depend|buildtool_depend)(?:\s+[^>]*)?>(.*?)</\1>'
                found_deps = re.findall(pattern, content, re.DOTALL)
                
                seen = set()
                for dtype, dname in found_deps:
                    dname = dname.strip()
                    if dname and dname not in seen:
                        seen.add(dname)
                        deps.append({"type": dtype, "name": dname})
            except Exception:
                pass
            self.pkg_cache[pkg_dir]             = pkg_name
            self.pkg_dependencies_cache[pkg_name] = deps

        # Source- und Launch-Dateien
        SKIP_PATHS = ['/build', '/install', '/log', '/.git']
        for root, dirs, files in os.walk(self.workspace_path):
            if any(s in root for s in SKIP_PATHS):
                continue
            for f in files:
                full_path = os.path.join(root, f)
                if f.endswith(('.py', '.cpp', '.hpp')):
                    if 'launch' in f or 'launch' in root.lower():
                        self.launch_files_cache.append(full_path)
                    else:
                        self.source_files_cache.append(full_path)
                elif f.endswith(('.launch.xml', '.launch.yaml', '.launch.py')):
                    self.launch_files_cache.append(full_path)

        # Launch-Details parsen
        self.launch_details_cache = []
        for l_file in self.launch_files_cache:
            try:
                with open(l_file, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()

                clean_args = []
                for arg_block in re.finditer(r'DeclareLaunchArgument\s*\(\s*(.*?)\)', content, re.DOTALL):
                    inner      = arg_block.group(1)
                    name_match = re.search(r'^[\'"]([^\'"]+)[\'"]', inner.strip())
                    if not name_match:
                        continue
                    arg_name  = name_match.group(1)
                    def_match = re.search(r'default_value\s*=\s*([\'"][^\'"]*[\'"]|[^,]+)', inner)
                    val       = def_match.group(1).strip().strip('\'"') if def_match else "Kein Default"
                    clean_args.append({"name": arg_name, "default": val, "description": ""})

                for xml_arg in re.finditer(r'<arg\s+([^>]+)/?\>', content):
                    inner      = xml_arg.group(1)
                    name_match = re.search(r'name\s*=\s*[\'"]([^\'"]+)[\'"]', inner)
                    if not name_match:
                        continue
                    def_match = re.search(r'default\s*=\s*[\'"]([^\'"]*)[\'"]', inner)
                    clean_args.append({
                        "name":        name_match.group(1),
                        "default":     def_match.group(1) if def_match else "Kein Default",
                        "description": "",
                    })

                nodes_list = []
                for node_match in re.finditer(r'Node\s*\((.*?)\)', content, re.DOTALL):
                    n_str  = node_match.group(1)
                    pkg    = re.search(r'package\s*=\s*[\'"]([^\'"]+)[\'"]', n_str)
                    exe    = re.search(r'executable\s*=\s*[\'"]([^\'"]+)[\'"]', n_str)
                    name_m = re.search(r'name\s*=\s*[\'"]([^\'"]+)[\'"]', n_str)
                    if pkg and exe:
                        nodes_list.append({
                            "package":    pkg.group(1),
                            "executable": exe.group(1),
                            "name":       name_m.group(1) if name_m else exe.group(1),
                        })

                for node_match in re.finditer(r'<node\s+([^>]+)>', content):
                    n_str  = node_match.group(1)
                    pkg    = re.search(r'pkg\s*=\s*[\'"]([^\'"]+)[\'"]', n_str)
                    exe    = re.search(r'exec\s*=\s*[\'"]([^\'"]+)[\'"]', n_str)
                    name_m = re.search(r'name\s*=\s*[\'"]([^\'"]+)[\'"]', n_str)
                    if pkg and exe:
                        nodes_list.append({
                            "package":    pkg.group(1),
                            "executable": exe.group(1),
                            "name":       name_m.group(1) if name_m else exe.group(1),
                        })

                all_launch_refs = set(re.findall(
                    r'([a-zA-Z0-9_\-\.]+(?:\.launch\.py|\.launch\.xml|_launch\.xml))', content))
                my_name = os.path.basename(l_file)
                all_launch_refs.discard(my_name)

                self.launch_details_cache.append({
                    "file_name":       my_name,
                    "path":            os.path.relpath(l_file, self.base_ws_path),
                    "args":            clean_args,
                    "parsed_nodes":    nodes_list,
                    "parsed_includes": list(all_launch_refs),
                })
            except Exception:
                pass

        self.update_project_files_cache()
        self._build_executable_cache_async()   # Nicht-blockierend!

    # ═══════════════════════════════════════════════════════════════════════════
    # EXECUTABLE CACHE  (Thread-sicher, nicht-blockierend)
    # ═══════════════════════════════════════════════════════════════════════════
    def _build_executable_cache_async(self):
        """Startet den exe-cache-Build in einem Hintergrund-Thread."""
        t = threading.Thread(target=self._build_executable_cache, daemon=True)
        t.start()

    def _build_executable_cache(self):
        """Baut executable→package Map. Läuft im Hintergrund-Thread."""
        source_cmd = ('source /opt/ros/humble/setup.bash && '
                      'source ~/dev_ws/install/setup.bash 2>/dev/null')
        new_map    = {}
        ws_pkg_names = list(self.pkg_cache.values())

        for pkg_name in ws_pkg_names:
            try:
                result = subprocess.run(
                    f'{source_cmd} && ros2 pkg executables {pkg_name}',
                    shell=True, executable='/bin/bash',
                    capture_output=True, text=True, timeout=10)
                for line in result.stdout.splitlines():
                    parts = line.strip().split()
                    if len(parts) == 2:
                        new_map[parts[1]] = pkg_name
            except Exception as e:
                self.get_logger().debug(f'[exe-cache] {pkg_name}: {e}')

        with self._exe_cache_lock:
            self.executable_pkg_map = new_map
        self.get_logger().info(f"[exe-cache] {len(new_map)} Executables gecacht.")

    def _schedule_exe_cache_refresh(self):
        """30-Sekunden-Timer: Cache einmalig nachaktualisieren."""
        if self._exe_cache_refresh_done:
            return
        self._exe_cache_refresh_done = True
        self._build_executable_cache_async()
        self.node_info_cache.clear()

    # ═══════════════════════════════════════════════════════════════════════════
    # PROJECT FILES CACHE
    # ═══════════════════════════════════════════════════════════════════════════
    def update_project_files_cache(self):
        target_files_set = set()
        for src in self.source_files_cache:
            if src.endswith(('.py', '.cpp')):
                try:
                    with open(src, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    if 'rclpy' in content or 'rclcpp' in content or 'Node' in content:
                        target_files_set.add(os.path.basename(src))
                except Exception:
                    pass

        for t_file in list(target_files_set):
            full_path = next(
                (src for src in self.source_files_cache + self.launch_files_cache
                 if os.path.basename(src) == t_file), "")
            info = {
                "file_name":        t_file,
                "file_path":        "Unbekannt",
                "package":          "Unbekannt",
                "publishers":       [],
                "subscribers":      [],
                "services":         [],
                "clients":          [],
                "is_workspace":     True,
                "is_active":        False,
                "active_node_name": None,
                "dependencies":     [],
            }
            if full_path:
                info["file_path"]    = os.path.relpath(full_path, self.base_ws_path)
                info["package"]      = self.get_package_for_file(full_path)
                info["dependencies"] = self.pkg_dependencies_cache.get(info["package"], [])
                self.get_logger().debug(f"Indexed: {t_file}")

            self.project_files_cache[t_file] = info

    def get_package_for_file(self, file_path):
        best_match, best_pkg = "", "Unbekannt"
        for pkg_dir, pkg_name in self.pkg_cache.items():
            if file_path.startswith(pkg_dir) and len(pkg_dir) > len(best_match):
                best_match, best_pkg = pkg_dir, pkg_name
        return best_pkg

    def classify_node_category(self, pkg_name, launched_by):
        """Gibt die Kategorie eines Nodes zurück:
          'workspace'         → Eigener Code in ~/dev_ws/src/
          'system_via_launch' → System-Paket, aber via WS-Launch-File gestartet
          'system'            → Reiner ROS 2 System-Node
        """
        if pkg_name in self.pkg_cache.values():
            return 'workspace'
        if launched_by and launched_by != 'Terminal / Sub-Prozess':
            return 'system_via_launch'
        return 'system'

    def _find_source_file(self, executable_name, pkg_name):
        """Sucht den Quellpfad (src/) für einen Node – sowohl .py als auch .cpp."""
        exts = ['.py', '.cpp']
        pkg_src_dir = os.path.join(self.workspace_path, pkg_name)

        # Direkte Kandidaten-Pfade
        candidates = []
        for ext in exts:
            candidates += [
                os.path.join(self.workspace_path, pkg_name, pkg_name, f"{executable_name}{ext}"),
                os.path.join(self.workspace_path, pkg_name, 'src', f"{executable_name}{ext}"),
                os.path.join(self.workspace_path, pkg_name, f"{executable_name}{ext}"),
            ]

        # Breite Suche im pkg-Verzeichnis (Dateiname stimmt überein)
        if os.path.isdir(pkg_src_dir):
            for root, _, files in os.walk(pkg_src_dir):
                for f in files:
                    name_no_ext = os.path.splitext(f)[0]
                    if (name_no_ext == executable_name or name_no_ext == f"{executable_name}_node") \
                            and f.endswith(tuple(exts)):
                        candidates.append(os.path.join(root, f))

        for c in candidates:
            if os.path.exists(c):
                return os.path.relpath(c, self.base_ws_path)
        return None

    # ═══════════════════════════════════════════════════════════════════════════
    # NODE INFO RESOLUTION  (3-Stufen-Kategorisierung)
    # ═══════════════════════════════════════════════════════════════════════════
    def resolve_node_info(self, raw_node_name):
        """Löst Paket, Dateipfad und Kategorie für einen Node auf.
        Kategorien: 'workspace' | 'system_via_launch' | 'system'
        """
        clean_name = raw_node_name.lstrip('/')
        if clean_name in self.node_info_cache:
            return self.node_info_cache[clean_name]

        info = {
            "package":      "ROS 2 System",
            "source_file":  "Kompilierte Binary",
            "file_path":    "/opt/ros/humble/...",
            "launched_by":  "Terminal / Sub-Prozess",
            "is_workspace": False,     # Leagcy-Kompatibilität
            "category":     "system",  # Neue eindeutige Kategorie
        }

        # ── Spezialfall: workspace_analyzer selbst ───────────────────────────
        if clean_name == "workspace_analyzer":
            info.update({
                "package":      "websocket",
                "source_file":  "workspace_analyzer.py",
                "file_path":    "src/websocket/workspace_analyzer.py",
                "is_workspace": True,
                "category":     "workspace",
            })
            self.node_info_cache[clean_name] = info
            return info

        # ── Stufe 1: Direkte Source-Datei suchen (Python) ────────────────────
        # z.B. Node-Name stimmt mit Dateiname überein: collision_check → collision_check.py
        for src in self.source_files_cache:
            try:
                base_name = os.path.splitext(os.path.basename(src))[0]
                # Exakter Match oder _node-Suffix-Match
                if clean_name == base_name or clean_name.rstrip('_node') == base_name:
                    pkg = self.get_package_for_file(src)
                    if pkg != 'Unbekannt' and pkg in self.pkg_cache.values():
                        rel = os.path.relpath(src, self.base_ws_path)
                        info.update({
                            "package":      pkg,
                            "source_file":  os.path.basename(src),
                            "file_path":    rel,
                            "is_workspace": True,
                            "category":     "workspace",
                        })
                        break
            except Exception:
                pass

        # ── Stufe 2: Launch-Datei-Zuordnung ─────────────────────────────────
        # Prüft, ob der Node in einem Workspace-Launch-File referenziert wird
        for launch in self.launch_details_cache:
            for l_node in launch.get("parsed_nodes", []):
                l_name = l_node.get("name", "")
                l_exec = l_node.get("executable", "")
                if l_name == clean_name or l_exec == clean_name:
                    l_pkg = l_node.get("package", "")
                    info["launched_by"] = launch["file_name"]
                    info["package"]    = l_pkg
                    # Ist das Paket ein Workspace-Paket?
                    if l_pkg in self.pkg_cache.values():
                        info["is_workspace"] = True
                        info["category"]     = "workspace"
                        # Source-Pfad noch nicht gesetzt → versuche Quellpfad (.py oder .cpp)
                        if not info["file_path"].startswith("src/"):
                            src_path = self._find_source_file(l_exec, l_pkg)
                            if src_path:
                                info["source_file"] = os.path.basename(src_path)
                                info["file_path"]   = src_path
                            else:
                                info["source_file"] = f"Launch: {launch['file_name']}"
                                info["file_path"]   = launch.get("path", "/opt/ros/humble/...")
                    else:
                        # System-Paket, aber via WS-Launch gestartet
                        info["category"]     = "system_via_launch"
                        info["is_workspace"] = False
                        info["source_file"]  = f"gestartet via: {launch['file_name']}"
                        info["file_path"]    = launch.get("path", "/opt/ros/humble/...")
                    break
            if info["launched_by"] != "Terminal / Sub-Prozess":
                break

        # ── Stufe 3: Executable-Cache (Thread-safe) ──────────────────────────
        # Workspace-Paket via `ros2 pkg executables`
        if info["category"] == "system":
            with self._exe_cache_lock:
                exe_map = self.executable_pkg_map
            if clean_name in exe_map:
                ws_pkg = exe_map[clean_name]
                # Nur als workspace wenn Paket wirklich in dev_ws/src liegt
                if ws_pkg in self.pkg_cache.values():
                    src_path = self._find_source_file(clean_name, ws_pkg)
                    info.update({
                        "package":      ws_pkg,
                        "source_file":  os.path.basename(src_path) if src_path else f"{clean_name} (Binary)",
                        "file_path":    src_path if src_path else f"src/{ws_pkg}/",
                        "is_workspace": True,
                        "category":     "workspace",
                    })

        # ── Stufe 4: Regex-Suche in Launch-Files ─────────────────────────────
        # Letzter Versuch: Node-Name im Quelltext der Launch-Files suchen
        if info["launched_by"] == "Terminal / Sub-Prozess":
            for launch in self.launch_details_cache:
                try:
                    full_l = os.path.join(self.base_ws_path, launch.get("path", ""))
                    with open(full_l, 'r', encoding='utf-8', errors='ignore') as f:
                        if re.search(rf'[\'"{re.escape(clean_name)}\'"]', f.read()):
                            info["launched_by"] = launch["file_name"]
                            if info["category"] == "system":
                                # Paket des Launch-Files prüfen
                                lf_pkg = self.get_package_for_file(full_l)
                                if lf_pkg in self.pkg_cache.values():
                                    info["category"] = "system_via_launch"
                                    info["source_file"] = f"gestartet via: {launch['file_name']}"
                                    info["file_path"]   = launch.get("path", "/opt/ros/humble/...")
                except Exception:
                    pass
        # Legacy-Feld synchron halten
        info["is_workspace"] = (info["category"] == "workspace")
        
        # NEU: Abhängigkeiten direkt in die Info-Daten einbetten
        if info["package"] != "Unbekannt":
            info["dependencies"] = self.pkg_dependencies_cache.get(info["package"], [])
        else:
            info["dependencies"] = []

        self.node_info_cache[clean_name] = info
        return info

    # ═══════════════════════════════════════════════════════════════════════════
    # BASHRC PARSER
    # ═══════════════════════════════════════════════════════════════════════════
    def parse_bashrc(self):
        bashrc_path = os.path.expanduser('~/.bashrc')
        if not os.path.exists(bashrc_path):
            return ["Keine .bashrc gefunden"]
        try:
            current_mtime = os.path.getmtime(bashrc_path)
            if current_mtime <= self.bashrc_mtime and self.bashrc_cache:
                return self.bashrc_cache
            self.bashrc_mtime = current_mtime
            with open(bashrc_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            lines = content.split('\n')
            self.bashrc_cache = lines[max(0, len(lines) - 20):]
            return self.bashrc_cache
        except Exception as e:
            return [f"FEHLER: {str(e)}"]

    # ═══════════════════════════════════════════════════════════════════════════
    # PUBLISH METADATA  (mit Topology-Diff)
    # ═══════════════════════════════════════════════════════════════════════════
    def publish_metadata(self):
        try:
            import traceback

            node_names_and_namespaces = self.get_node_names_and_namespaces()
            current_full_names        = {
                f"{ns}/{n}".replace('//', '/') for n, ns in node_names_and_namespaces
            }

            # ── Topology neu abfragen wenn nötig (alle 10s oder bei Node-Änderung) ──
            nodes_changed = (current_full_names != self._last_known_nodes)
            time_since_last = time.time() - self.last_topology_update
            
            if nodes_changed or time_since_last > 10.0:
                if nodes_changed:
                    self.get_logger().info(f"Node-Änderung erkannt: {len(current_full_names)} Nodes.")
                
                self._last_known_nodes = current_full_names
                self.last_topology_update = time.time()

                new_topology = {}
                for n_name, n_ns in node_names_and_namespaces:
                    full_n = f"{n_ns}/{n_name}".replace('//', '/')
                    try:
                        pubs = self.get_publisher_names_and_types_by_node(n_name, n_ns)
                        subs = self.get_subscriber_names_and_types_by_node(n_name, n_ns)
                        
                        # --- Stabilitäts-Check (Anti-Blink) ---
                        # Falls Node gerade 0 Topics meldet, aber er vorher welche hatte:
                        # Behalte die alten Daten für max. 1 Zyklus (Hysterese)
                        if not pubs and not subs and full_n in self._topology_cache:
                            old = self._topology_cache[full_n]
                            if old.get("publishers") or old.get("subscribers"):
                                self.get_logger().debug(f"Topology-Hysterese für {full_n} (0 Topics gemeldet, nutze Cache).")
                                new_topology[full_n] = old
                                continue

                        new_topology[full_n] = {
                            "publishers":  [{"topic": t, "types": types} for t, types in pubs],
                            "subscribers": [{"topic": t, "types": types} for t, types in subs],
                        }
                    except Exception as e:
                        self.get_logger().warning(f"Topology-Fehler für {full_n}: {e}")
                        if full_n in self._topology_cache:
                            new_topology[full_n] = self._topology_cache[full_n]

                self._topology_cache = new_topology

            # ── Bereinige cli_node_cache von toten Nodes ──────────────────────
            dead_nodes = set(self.cli_node_cache.keys()) - current_full_names
            for dn in dead_nodes:
                if dn != 'workspace_analyzer':
                    del self.cli_node_cache[dn]

            # ── Metadata aufbauen ─────────────────────────────────────────────
            metadata = {
                "nodes":         {},
                "project_files": copy.deepcopy(self.project_files_cache),
                "bashrc":        self.parse_bashrc(),
                "tree":          self.workspace_tree_cache,
                "launches":      [],
            }

            active_launch_files = set()

            for name, namespace in node_names_and_namespaces:
                full_name  = f"{namespace}/{name}".replace('//', '/')
                node_topo  = self._topology_cache.get(full_name, {"publishers": [], "subscribers": []})
                pubs, subs = node_topo["publishers"], node_topo["subscribers"]
                info       = self.resolve_node_info(name)

                all_pubs    = {t["topic"]: t["types"] for t in pubs}
                all_subs    = {t["topic"]: t["types"] for t in subs}
                all_srvs    = {}
                all_clients = {}

                # CLI On-Demand Daten einmischen
                if full_name in self.cli_node_cache:
                    cli = self.cli_node_cache[full_name]
                    for p  in cli.get('publishers',  []): all_pubs[p['topic']]   = p['types']
                    for s  in cli.get('subscribers', []): all_subs[s['topic']]   = s['types']
                    for sr in cli.get('services',    []): all_srvs[sr['name']]   = sr['types']
                    for c  in cli.get('clients',     []): all_clients[c['name']] = c['types']

                # Actions erkennen
                action_bases = set()
                for t in pubs + subs:
                    if "/_action/" in t["topic"]:
                        action_bases.add(t["topic"].split("/_action/")[0])

                metadata["nodes"][full_name] = {
                    "package":           info["package"],
                    "source_file":       info["source_file"],
                    "file_path":         info["file_path"],
                    "launched_by":       info["launched_by"],
                    "is_workspace":      info["is_workspace"],
                    "category":          info.get("category", "system"),  # 'workspace' | 'system_via_launch' | 'system'
                    "filtered_subs_count": 0,
                    "publishers":        [{"topic": k, "types": v} for k, v in all_pubs.items()],
                    "subscribers":       [{"topic": k, "types": v} for k, v in all_subs.items()],
                    "services":          [{"name":  k, "types": v} for k, v in all_srvs.items()],
                    "clients":           [{"name":  k, "types": v} for k, v in all_clients.items()],
                    "actions":           list(action_bases),
                    "action_count":      len(action_bases),
                    "dependencies":      self.pkg_dependencies_cache.get(info["package"], []),
                }

                # Projekt-Datei als aktiv markieren
                for p_file, p_data in metadata["project_files"].items():
                    p_file_no_ext = os.path.splitext(p_file)[0]
                    if info["source_file"] == p_file or name == p_file_no_ext:
                        p_data["is_active"]        = True
                        p_data["active_node_name"] = full_name
                        break

                if info["launched_by"] and "Terminal" not in info["launched_by"]:
                    active_launch_files.add(info["launched_by"])

            # ── start.sh parsen (mtime-gecacht) ───────────────────────────────
            start_sh_path        = os.path.join(self.base_ws_path, 'start.sh')
            relevant_launch_names = set()
            try:
                if os.path.exists(start_sh_path):
                    current_mtime = os.path.getmtime(start_sh_path)
                    if current_mtime > self.startup_sh_mtime or not self.startup_sh_cache:
                        with open(start_sh_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        matches = re.findall(
                            r'ros2\s+launch\s+\S+\s+([a-zA-Z0-9_\-\.]+(?:\.launch\.py|\.launch\.xml|_launch\.xml))',
                            content)
                        self.startup_sh_cache = set(matches)
                        self.startup_sh_mtime = current_mtime
                    relevant_launch_names = set(self.startup_sh_cache)
            except Exception:
                pass

            # Transitive Includes auflösen
            includes_map = {l["file_name"]: l.get("parsed_includes", []) for l in self.launch_details_cache}
            added_new = True
            while added_new:
                added_new = False
                for lname in list(relevant_launch_names):
                    for inc in includes_map.get(lname, []):
                        if inc not in relevant_launch_names:
                            relevant_launch_names.add(inc)
                            added_new = True

            # Launch-Daten aufbauen
            filtered_launches = []
            for l in self.launch_details_cache:
                if l["file_name"] in relevant_launch_names:
                    active_nodes = [
                        n for n, ni in metadata["nodes"].items()
                        if ni["launched_by"] == l["file_name"]
                    ]
                    l_copy = l.copy()
                    l_copy["active_nodes"] = active_nodes
                    l_copy["is_active"]    = l["file_name"] in active_launch_files
                    filtered_launches.append(l_copy)

            metadata["launches"]               = filtered_launches
            metadata["robot_hardware_connected"] = any(
                "xarm" in n.lower() or "lite6" in n.lower()
                for n in metadata["nodes"].keys()
            )

            self.publisher_.publish(String(data=json.dumps(metadata)))
            self.get_logger().info(
                f"Metadata publiziert: {len(metadata['nodes'])} Nodes "
                f"({'Topology neu' if nodes_changed else 'Topology aus Cache'})")

        except Exception:
            import traceback
            self.get_logger().error(f"publish_metadata Exception:\n{traceback.format_exc()}")


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════
def main(args=None):
    rclpy.init(args=args)
    analyzer = WorkspaceAnalyzer()
    try:
        rclpy.spin(analyzer)
    except KeyboardInterrupt:
        pass
    finally:
        analyzer.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
