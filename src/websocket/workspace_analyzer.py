#!/usr/bin/env python3
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
from rclpy.qos import QoSProfile, QoSHistoryPolicy, QoSReliabilityPolicy
from rosidl_runtime_py.utilities import get_message

class WorkspaceAnalyzer(Node):
    def __init__(self):
        super().__init__('workspace_analyzer')
        
        self.publisher_ = self.create_publisher(String, '/dashboard/workspace_metadata', 10)
        self.code_req_sub = self.create_subscription(String, '/dashboard/request_file_content', self.handle_code_request, 10)
        self.code_pub = self.create_publisher(String, '/dashboard/file_content', 10)
        self.explorer_sub = self.create_subscription(String, '/dashboard/request_open_explorer', self.handle_open_explorer, 10)
        
        self.workspace_path = os.path.expanduser('~/dev_ws/src')
        self.base_ws_path = os.path.expanduser('~/dev_ws')
        
        self.pkg_cache = {}
        self.pkg_dependencies_cache = {}
        self.source_files_cache = []
        self.launch_files_cache = []
        self.node_info_cache = {}
        
        self.workspace_tree_cache = {}
        self.project_files_cache = {}
        self.launch_details_cache = []
        self.tracked_topics = []
        self.subs = {}
        self.message_counts = {}
        self.last_messages = {}
        self.last_publish_time = time.time()
        
        # CLI-Daten Cache
        self.cli_node_cache = {}
        self.last_cli_update = 0
        
        # Topic Activity
        self.cmd_sub = self.create_subscription(String, '/dashboard/request_topic_activity', self.handle_activity_request, 10)
        self.activity_pub = self.create_publisher(String, '/dashboard/topic_activity', 10)
        self.activity_timer = self.create_timer(0.5, self.publish_activity)

        self.bashrc_mtime = 0
        self.bashrc_cache = []
        self.startup_sh_mtime = 0
        self.startup_sh_cache = set()

        self.index_workspace()
        
        # Regelmäßige Updates
        self.timer = self.create_timer(10.0, self.publish_metadata) # Full Metadata alle 10s
        self.pulse_timer = self.create_timer(2.0, self.publish_active_nodes_pulse) # Live-Status alle 2s
        
        # On-Demand Detail Abfrage für selektierten Node
        self.node_detail_sub = self.create_subscription(String, '/ui/request_node_details', self.handle_node_detail_request, 10)
        
        self._exe_cache_refresh_done = False
        self.create_timer(30.0, self._delayed_exe_cache_refresh)

    def handle_node_detail_request(self, msg):
        """Wird aufgerufen, wenn im Dashboard ein Node ausgewählt wird."""
        node_name = msg.data.strip()
        if not node_name: return
        
        # Extrahiere Namespace und Name
        parts = node_name.rsplit('/', 1)
        ns = parts[0] if len(parts) > 1 else '/'
        if not ns: ns = '/'
        name = parts[1] if len(parts) > 1 else parts[0]

        self.get_logger().info(f"On-Demand Details angefordert für: {node_name}")
        
        # Hole exakte Live-Daten über rclpy
        try:
            pubs = self.get_publisher_names_and_types_by_node(name, ns)
            subs = self.get_subscriber_names_and_types_by_node(name, ns)
            srvs = self.get_service_names_and_types_by_node(name, ns)
            clients = self.get_client_names_and_types_by_node(name, ns)
            
            # Formatiere für Cache
            node_data = {
                "publishers": [{"topic": t[0], "types": t[1]} for t in pubs],
                "subscribers": [{"topic": t[0], "types": t[1]} for t in subs],
                "services": [{"name": t[0], "types": t[1]} for t in srvs],
                "clients": [{"name": t[0], "types": t[1]} for t in clients]
            }
            
            self.cli_node_cache[node_name] = node_data
            # Sofortiges Metadata-Update triggern
            self.publish_metadata()
        except Exception as e:
            self.get_logger().error(f"Fehler bei On-Demand Abfrage: {e}")

    # --- Standard Handlers & Helper Methods ---
    def handle_open_explorer(self, msg):
        req_path = msg.data.strip()
        if not req_path or req_path == 'Pfad unbekannt': return
        if os.path.isabs(req_path): full_path = req_path
        else: full_path = os.path.join(self.base_ws_path, req_path)
        try:
            if not os.path.exists(full_path):
                base = os.path.basename(full_path)
                for cache_file in self.source_files_cache + self.launch_files_cache:
                    if os.path.basename(cache_file) == base:
                        full_path = cache_file; break
            if os.path.exists(full_path):
                target_dir = os.path.dirname(full_path) if os.path.isfile(full_path) else full_path
                subprocess.Popen(['xdg-open', target_dir])
        except Exception as e: self.get_logger().error(f"Explorer Error: {e}")

    def handle_code_request(self, msg):
        req_path = msg.data.strip()
        if os.path.isabs(req_path): full_path = req_path
        else: full_path = os.path.join(self.base_ws_path, req_path)
        response = {"path": req_path, "original_request": req_path, "content": "Datei konnte nicht gelesen werden."}
        try:
            if not os.path.exists(full_path):
                base = os.path.basename(full_path)
                for cache_file in self.source_files_cache + self.launch_files_cache:
                    if os.path.basename(cache_file) == base:
                        full_path = cache_file
                        response["path"] = os.path.relpath(full_path, self.base_ws_path); break
            if os.path.exists(full_path):
                with open(full_path, 'r', encoding='utf-8', errors='ignore') as f: response["content"] = f.read()
            else: response["content"] = f"Fehler: Datei nicht gefunden:\n{full_path}"
        except Exception as e: response["content"] = f"Fehler beim Lesen:\n{str(e)}"
        self.code_pub.publish(String(data=json.dumps(response)))

    def handle_activity_request(self, msg):
        try:
            req = json.loads(msg.data)
            new_topics = req.get('topics', [])
            for topic, sub in self.subs.items(): self.destroy_subscription(sub)
            self.subs.clear(); self.message_counts.clear(); self.last_messages.clear()
            self.tracked_topics = new_topics
            qos = QoSProfile(history=QoSHistoryPolicy.KEEP_LAST, depth=1, reliability=QoSReliabilityPolicy.BEST_EFFORT)
            
            for t_info in self.tracked_topics:
                topic_name = t_info['topic']
                topic_type_str = t_info.get('type')
                if not topic_type_str or topic_type_str == "Unbekannt":
                    topic_types = self.get_topic_names_and_types()
                    for t, types in topic_types:
                        if t == topic_name and types:
                            topic_type_str = types[0]; break
                if not topic_type_str or topic_type_str == "Unbekannt": continue
                try:
                    msg_class = get_message(topic_type_str)
                    if msg_class:
                        self.message_counts[topic_name] = 0
                        def make_cb(t_name):
                            def cb(msg):
                                self.message_counts[t_name] += 1
                                self.last_messages[t_name] = str(msg)
                            return cb
                        self.subs[topic_name] = self.create_subscription(msg_class, topic_name, make_cb(topic_name), qos)
                except Exception: pass
        except Exception: pass

    @staticmethod
    def _strip_comments(content):
        content = re.sub(r'^\s*//.*$', '', content, flags=re.MULTILINE)
        content = re.sub(r'^\s*#.*$', '', content, flags=re.MULTILINE)
        content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
        content = re.sub(r'\"\"\".*?\"\"\"', '', content, flags=re.DOTALL)
        content = re.sub(r'\'\'\'.*?\'\'\'', '', content, flags=re.DOTALL)
        return content

    def publish_activity(self):
        current_time = time.time()
        dt = current_time - self.last_publish_time
        self.last_publish_time = current_time
        if not self.tracked_topics: return
        activity_data = {}
        found_active_in_msg = False
        for topic, count in self.message_counts.items():
            hz = count / dt if dt > 0 else 0
            is_active = count > 0
            if is_active: found_active_in_msg = True
            activity_data[topic] = {"hz": round(hz, 1), "active": is_active, "last_msg": self.last_messages.get(topic, "")}
            self.message_counts[topic] = 0
        
        # Nur publishen wenn wir getrackte Topics haben oder sich was geändert hat
        # (Um Bandbreite zu sparen wenn das Node-Panel geschlossen ist)
        if activity_data:
            self.activity_pub.publish(String(data=json.dumps(activity_data)))

    def publish_active_nodes_pulse(self):
        """Schickt nur die Liste der aktiven Node-Namen für Sidebar-Punkte (leichtgewicht)."""
        try:
            node_names_and_ns = self.get_node_names_and_namespaces()
            running_names = [f"{ns}/{n}".replace('//', '/') for n, ns in node_names_and_ns]
            pulse_data = {"type": "node_pulse", "active_nodes": running_names}
            self.publisher_.publish(String(data=json.dumps(pulse_data)))
        except Exception: pass

    def build_file_tree(self, path):
        tree = {"name": os.path.basename(path), "type": "folder", "children": []}
        try:
            entries = sorted(os.listdir(path))
            dirs = [e for e in entries if os.path.isdir(os.path.join(path, e)) and e not in ['build', 'install', 'log', '.git', '__pycache__']]
            files = [e for e in entries if os.path.isfile(os.path.join(path, e))]
            for d in dirs: tree["children"].append(self.build_file_tree(os.path.join(path, d)))
            for f in files:
                if f.endswith(('.py', '.cpp', '.hpp', '.xml', '.yaml', '.txt', '.json')):
                    tree["children"].append({"name": f, "type": "file"})
        except Exception: pass
        return tree

    def index_workspace(self):
        if not os.path.exists(self.workspace_path):
            self.workspace_tree_cache = {"name": "dev_ws/src", "type": "folder", "children": [{"name": "Pfad nicht gefunden", "type": "file"}]}
            return

        self.workspace_tree_cache = self.build_file_tree(self.workspace_path)

        for xml_path in glob.glob(os.path.join(self.workspace_path, '**', 'package.xml'), recursive=True):
            pkg_dir = os.path.dirname(xml_path)
            pkg_name = os.path.basename(pkg_dir)
            deps = []
            try:
                with open(xml_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    match = re.search(r'<name>(.*?)</name>', content)
                    if match: pkg_name = match.group(1)
                    found_deps = re.findall(r'<(depend|build_depend|build_export_depend|exec_depend|test_depend|buildtool_depend)>(.*?)</\1>', content)
                    seen = set()
                    for dtype, dname in found_deps:
                        dname = dname.strip()
                        if dname and dname not in seen:
                            seen.add(dname); deps.append({"type": dtype, "name": dname})
            except Exception: pass
            self.pkg_cache[pkg_dir] = pkg_name
            self.pkg_dependencies_cache[pkg_name] = deps

        for root, dirs, files in os.walk(self.workspace_path):
            if any(ignored in root for ignored in ['/build', '/install', '/log', '/.git']): continue
            for f in files:
                full_path = os.path.join(root, f)
                if f.endswith(('.py', '.cpp', '.hpp')):
                    if 'launch' in f or 'launch' in root.lower(): self.launch_files_cache.append(full_path)
                    else: self.source_files_cache.append(full_path)
                elif f.endswith(('.launch.xml', '.launch.yaml', '.launch.py')):
                    self.launch_files_cache.append(full_path)

        self.launch_details_cache = []
        for l_file in self.launch_files_cache:
            try:
                with open(l_file, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    clean_args = []
                    for arg_block in re.finditer(r'DeclareLaunchArgument\s*\(\s*(.*?)\)', content, re.DOTALL):
                        inner = arg_block.group(1)
                        name_match = re.search(r'^[\'"]([^\'"]+)[\'"]', inner.strip())
                        if not name_match: continue
                        arg_name = name_match.group(1)
                        def_match = re.search(r'default_value\s*=\s*([\'"][^\'"]*[\'"]|[^,]+)', inner)
                        val = def_match.group(1).strip().strip('\'"') if def_match else "Kein Default"
                        clean_args.append({"name": arg_name, "default": val, "description": ""})
                        
                    for xml_arg in re.finditer(r'<arg\s+([^>]+)/?>', content):
                        inner = xml_arg.group(1)
                        name_match = re.search(r'name\s*=\s*[\'"]([^\'"]+)[\'"]', inner)
                        if not name_match: continue
                        def_match = re.search(r'default\s*=\s*[\'"]([^\'"]*)[\'"]', inner)
                        clean_args.append({
                            "name": name_match.group(1),
                            "default": def_match.group(1) if def_match else "Kein Default",
                            "description": ""
                        })

                    nodes_list = []
                    for node_match in re.finditer(r'Node\s*\((.*?)\)', content, re.DOTALL):
                        n_str = node_match.group(1)
                        pkg = re.search(r'package\s*=\s*[\'"]([^\'"]+)[\'"]', n_str)
                        exe = re.search(r'executable\s*=\s*[\'"]([^\'"]+)[\'"]', n_str)
                        name_m = re.search(r'name\s*=\s*[\'"]([^\'"]+)[\'"]', n_str)
                        if pkg and exe: 
                            nodes_list.append({"package": pkg.group(1), "executable": exe.group(1), "name": name_m.group(1) if name_m else exe.group(1)})
                    
                    for node_match in re.finditer(r'<node\s+([^>]+)>', content):
                        n_str = node_match.group(1)
                        pkg = re.search(r'pkg\s*=\s*[\'"]([^\'"]+)[\'"]', n_str)
                        exe = re.search(r'exec\s*=\s*[\'"]([^\'"]+)[\'"]', n_str)
                        name_m = re.search(r'name\s*=\s*[\'"]([^\'"]+)[\'"]', n_str)
                        if pkg and exe: 
                            nodes_list.append({"package": pkg.group(1), "executable": exe.group(1), "name": name_m.group(1) if name_m else exe.group(1)})
                            
                    all_launch_refs = set(re.findall(r'([a-zA-Z0-9_\-\.]+(?:\.launch\.py|\.launch\.xml|_launch\.xml))', content))
                    my_name = os.path.basename(l_file)
                    if my_name in all_launch_refs: all_launch_refs.remove(my_name)

                    self.launch_details_cache.append({
                        "file_name": my_name,
                        "path": os.path.relpath(l_file, self.base_ws_path),
                        "args": clean_args,
                        "parsed_nodes": nodes_list,
                        "parsed_includes": list(all_launch_refs)
                    })
            except Exception: pass
        self.update_project_files_cache()
        self._build_executable_cache()

    def _build_executable_cache(self):
        self.executable_pkg_map = {}
        ws_pkg_names = list(self.pkg_cache.values())
        source_cmd = 'source /opt/ros/humble/setup.bash && source ~/dev_ws/install/setup.bash 2>/dev/null'
        count = 0
        for pkg_name in ws_pkg_names:
            try:
                result = subprocess.run(f'{source_cmd} && ros2 pkg executables {pkg_name}', shell=True, executable='/bin/bash', capture_output=True, text=True, timeout=8)
                for line in result.stdout.splitlines():
                    parts = line.strip().split()
                    if len(parts) == 2:
                        self.executable_pkg_map[parts[1]] = pkg_name
                        count += 1
            except Exception as e: self.get_logger().debug(f'[exe-cache] Failed: {e}')

    def _delayed_exe_cache_refresh(self):
        if self._exe_cache_refresh_done: return
        self._exe_cache_refresh_done = True
        self._build_executable_cache()
        self.node_info_cache.clear()

    def update_project_files_cache(self):
        target_files_set = set()
        for src in self.source_files_cache:
            if src.endswith(('.py', '.cpp')):
                try:
                    with open(src, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                        if 'rclpy' in content or 'rclcpp' in content or 'Node' in content:
                            target_files_set.add(os.path.basename(src))
                except Exception: pass
                
        for t_file in list(target_files_set):
            full_path = next((src for src in self.source_files_cache + self.launch_files_cache if os.path.basename(src) == t_file), "")
            info = {"file_name": t_file, "file_path": "Unbekannt", "package": "Unbekannt", "publishers": [], "subscribers": [], "services": [], "clients": [], "is_workspace": True, "is_active": False, "active_node_name": None, "dependencies": []}
            
            if full_path:
                info["file_path"] = os.path.relpath(full_path, self.base_ws_path)
                info["package"] = self.get_package_for_file(full_path)
                info["dependencies"] = self.pkg_dependencies_cache.get(info["package"], [])
                
                if full_path.endswith(('.py', '.cpp')):
                    try:
                        with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = self._strip_comments(f.read())
                            # Static analysis is intentionally deleted here in favor of dynamic ROS graph checks.
                            # The following lines were removed:
                            # s_pubs = re.findall(r'create_publisher\s*\(\s*([A-Za-z0-9_.]+)\s*,\s*([^\s,\)]+)', content)
                            # s_pubs += [(t[0].replace('::', '/'), t[1]) for t in re.findall(r'create_publisher\s*<\s*([A-Za-z0-9_:]+)\s*>\s*\(\s*([^\s,\)]+)', content)]
                            # info["publishers"] = [{"topic": self._resolve_static_topic(t[1], content), "types": [t[0]]} for t in s_pubs]
                            # s_subs = re.findall(r'create_subscription\s*\(\s*([A-Za-z0-9_.]+)\s*,\s*([^\s,\)]+)', content)
                            # s_subs += [(t[0].replace('::', '/'), t[1]) for t in re.findall(r'create_subscription\s*<\s*([A-Za-z0-9_:]+)\s*>\s*\(\s*([^\s,\)]+)', content)]
                            # info["subscribers"] = [{"topic": self._resolve_static_topic(t[1], content), "types": [t[0]]} for t in s_subs]
                            # Services und Clients ebenfalls regexen (wie bisher)
                            print(f"[✅] Indexed Workspace File {t_file:<30}")
                    except Exception: 
                        print(f"[❌] Error parsing {t_file}", flush=True)
            self.project_files_cache[t_file] = info

    def get_package_for_file(self, file_path):
        best_match, best_pkg = "", "Unbekannt"
        for pkg_dir, pkg_name in self.pkg_cache.items():
            if file_path.startswith(pkg_dir) and len(pkg_dir) > len(best_match):
                best_match, best_pkg = pkg_dir, pkg_name
        return best_pkg

    def resolve_node_info(self, raw_node_name):
        clean_name = raw_node_name.lstrip('/')
        if clean_name in self.node_info_cache: return self.node_info_cache[clean_name]

        info = {
            "package": "ROS 2 System",
            "source_file": "Kompilierte Binary / System",
            "file_path": "System-Pfad (/opt/ros/humble)",
            "launched_by": "Terminal / Sub-Prozess",
            "is_workspace": False
        }

        if clean_name == "workspace_analyzer":
            info["package"] = "websocket"
            info["source_file"] = "workspace_analyzer.py"
            info["file_path"] = "src/websocket/workspace_analyzer.py"
            info["is_workspace"] = True

        for launch in self.launch_details_cache:
            for l_node in launch.get("parsed_nodes", []):
                if l_node.get("name") == clean_name:
                    info["package"] = l_node.get("package")
                    info["source_file"] = f"Launch: {launch['file_name']}"
                    info["file_path"] = launch.get("path", "Unbekannt")
                    info["launched_by"] = launch["file_name"]
                    if info["package"] in self.pkg_cache.values():
                        info["is_workspace"] = True
                    break

        if not info["is_workspace"]:
            for src in self.source_files_cache:
                try:
                    base_name = os.path.splitext(os.path.basename(src))[0]
                    if clean_name == base_name or clean_name.replace('_node', '') == base_name:
                        info["source_file"] = os.path.basename(src)
                        info["file_path"] = os.path.relpath(src, self.base_ws_path)
                        info["package"] = self.get_package_for_file(src)
                        info["is_workspace"] = True
                        break
                except Exception: pass

        if not info["is_workspace"] and hasattr(self, 'executable_pkg_map'):
            if clean_name in self.executable_pkg_map:
                info["is_workspace"] = True
                info["package"] = self.executable_pkg_map[clean_name]
                info["source_file"] = "C++ Binary (ROS 2)"
                info["file_path"] = f"install/{info['package']}/lib/{info['package']}/{clean_name}"

        if not info["is_workspace"]:
            # Fallback: Node Name contains package name directly (usually for ros2 run or dynamically built node names)
            sorted_pkgs = sorted(list(set(self.pkg_cache.values())), key=len, reverse=True)
            for pkg in sorted_pkgs:
                if clean_name.startswith(pkg) or clean_name.replace('_node', '').startswith(pkg.replace('_node', '')):
                    info["is_workspace"] = True
                    info["package"] = pkg
                    info["source_file"] = "Dynamischer Node (C++/Python)"
                    info["file_path"] = f"install/{pkg}/"
                    break

        # Falls launch file nicht über parsed_nodes gefunden wurde, Regex fallback für launched_by
        if info["launched_by"] == "Terminal / Sub-Prozess":
            for launch in self.launch_files_cache:
                try:
                    with open(launch, 'r', encoding='utf-8', errors='ignore') as f:
                        if re.search(rf'[\'"]{re.escape(clean_name)}[\'"]', f.read()):
                            info["launched_by"] = os.path.basename(launch)
                            info["is_workspace"] = True
                            if info["package"] == "ROS 2 System":
                                info["package"] = self.get_package_for_file(launch)
                            break
                except Exception: pass

        self.node_info_cache[clean_name] = info
        return info

    def parse_bashrc(self):
        bashrc_path = os.path.expanduser('~/.bashrc')
        if not os.path.exists(bashrc_path): return ["Keine .bashrc gefunden"]
        try:
            current_mtime = os.path.getmtime(bashrc_path)
            if current_mtime <= self.bashrc_mtime and self.bashrc_cache: return self.bashrc_cache
            self.bashrc_mtime = current_mtime
            with open(bashrc_path, 'r', encoding='utf-8', errors='ignore') as f: content = f.read()
            lines = content.split('\n')
            extracted_lines = lines[max(0, len(lines) - 20):]
            self.bashrc_cache = extracted_lines
            return extracted_lines
        except Exception as e: return [f"FEHLER beim Auslesen der Bashrc: {str(e)}"]

    def publish_metadata(self):
        try:
            import copy
            import traceback
            metadata = {"nodes": {}, "project_files": copy.deepcopy(self.project_files_cache), "bashrc": self.parse_bashrc(), "tree": self.workspace_tree_cache, "launches": []}
            
            node_names_and_namespaces = self.get_node_names_and_namespaces()
            active_launch_files = set()
            
            # Bereinige Cache von toten Nodes
            current_running_full_names = set(f"{namespace}/{name}".replace('//', '/') for name, namespace in node_names_and_namespaces)
            dead_nodes = set(self.cli_node_cache.keys()) - current_running_full_names
            for dn in dead_nodes: 
                if dn != 'workspace_analyzer': del self.cli_node_cache[dn]

            # Hole komplette Topologie in einem Rutsch (via Topic-Lookup)
            # Das ist effizienter als für jeden Node einzeln info() aufzurufen
            topology = {}
            try:
                topic_names_and_types = self.get_topic_names_and_types()
                for t_name, t_types in topic_names_and_types:
                    pub_info = self.get_publishers_info_by_topic(t_name)
                    sub_info = self.get_subscriptions_info_by_topic(t_name)
                    
                    for p in pub_info:
                        n_full = f"{p.node_namespace}/{p.node_name}".replace('//', '/')
                        if n_full not in topology: topology[n_full] = {"publishers": [], "subscribers": []}
                        topology[n_full]["publishers"].append({"topic": t_name, "types": t_types})
                        
                    for s in sub_info:
                        n_full = f"{s.node_namespace}/{s.node_name}".replace('//', '/')
                        if n_full not in topology: topology[n_full] = {"publishers": [], "subscribers": []}
                        topology[n_full]["subscribers"].append({"topic": t_name, "types": t_types})
            except Exception: pass

            for name, namespace in node_names_and_namespaces:
                full_name = f"{namespace}/{name}".replace('//', '/')
                
                # Nutze cached topology (Topics)
                node_topo = topology.get(full_name, {"publishers": [], "subscribers": []})
                pubs, subs = node_topo["publishers"], node_topo["subscribers"]
                
                # Services/Clients nur aus Cache (On-Demand gefüllt)
                srvs, clients = [], []
                
                info = self.resolve_node_info(name)
                
                all_pubs = {t["topic"]: t["types"] for t in pubs}
                all_subs = {t["topic"]: t["types"] for t in subs}
                all_srvs = {}
                all_clients = {}

                # Nutze präzise CLI Daten falls vorhanden
                if full_name in self.cli_node_cache:
                    cli_data = self.cli_node_cache[full_name]
                    for p in cli_data.get('publishers', []): all_pubs[p['topic']] = p['types']
                    for s in cli_data.get('subscribers', []): all_subs[s['topic']] = s['types']
                    for sr in cli_data.get('services', []): all_srvs[sr['name']] = sr['types']
                    for c in cli_data.get('clients', []): all_clients[c['name']] = c['types']
                
                metadata["nodes"][full_name] = {
                    "package": info["package"],
                    "source_file": info["source_file"],
                    "file_path": info["file_path"],
                    "launched_by": info["launched_by"],
                    "is_workspace": info["is_workspace"],
                    "filtered_subs_count": 0,
                    "publishers": [{"topic": k, "types": v} for k, v in all_pubs.items()],
                    "subscribers": [{"topic": k, "types": v} for k, v in all_subs.items()],
                    "services": [{"name": k, "types": v} for k, v in all_srvs.items()],
                    "clients": [{"name": k, "types": v} for k, v in all_clients.items()],
                    "dependencies": self.pkg_dependencies_cache.get(info["package"], [])
                }

                matched_project_file = None
                for p_file, p_data in metadata["project_files"].items():
                    p_file_no_ext = os.path.splitext(p_file)[0]
                    if info["source_file"] == p_file or name == p_file_no_ext:
                        matched_project_file = p_file; break
                
                if matched_project_file:
                    metadata["project_files"][matched_project_file]["is_active"] = True
                    metadata["project_files"][matched_project_file]["active_node_name"] = full_name
                    
                if info["launched_by"] and "Terminal" not in info["launched_by"]:
                    active_launch_files.add(info["launched_by"])

            # SUCHT NUR NOCH IN start.sh
            start_sh_path = os.path.join(self.base_ws_path, 'start.sh')
            relevant_launch_names = set()
            
            try:
                if os.path.exists(start_sh_path):
                    current_mtime = os.path.getmtime(start_sh_path)
                    if current_mtime > self.startup_sh_mtime or not self.startup_sh_cache:
                        with open(start_sh_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            matches = re.findall(r'ros2\s+launch\s+\S+\s+([a-zA-Z0-9_\-\.]+(?:\.launch\.py|\.launch\.xml|_launch\.xml))', content)
                            self.startup_sh_cache = set(matches)
                            self.startup_sh_mtime = current_mtime
                    relevant_launch_names = set(self.startup_sh_cache)
            except Exception as e:
                pass
                
            includes_map = {l["file_name"]: l.get("parsed_includes", []) for l in self.launch_details_cache}
            added_new = True
            while added_new:
                added_new = False
                current = list(relevant_launch_names)
                for name in current:
                    for inc in includes_map.get(name, []):
                        if inc not in relevant_launch_names:
                            relevant_launch_names.add(inc); added_new = True

            # Erzwinge is_workspace = True für alle Nodes, die direkt aus start.sh oder dessen Kind-Launches stammen
            for full_name, n_info in metadata["nodes"].items():
                if n_info["launched_by"] in relevant_launch_names:
                    n_info["is_workspace"] = True

            filtered_launches = []
            for l in self.launch_details_cache:
                if l["file_name"] in relevant_launch_names:
                    active_nodes_for_this_launch = [n_full for n_full, n_info in metadata["nodes"].items() if n_info["launched_by"] == l["file_name"]]
                    l_copy = l.copy()
                    l_copy["active_nodes"] = active_nodes_for_this_launch
                    l_copy["is_active"] = (l["file_name"] in active_launch_files)
                    filtered_launches.append(l_copy)

            metadata["launches"] = filtered_launches
            metadata["robot_hardware_connected"] = any("xarm" in n.lower() or "lite6" in n.lower() for n in metadata["nodes"].keys())
            
            try:
                with open('/tmp/wa_out_debug.json', 'w') as f: json.dump(metadata, f)
            except Exception: pass
            
            self.publisher_.publish(String(data=json.dumps(metadata)))
            print(f"[✅] Metadata published successfully: {len(metadata['nodes'])} nodes", flush=True)
        except Exception as e:
            print(f"[❌] Exception in publish_metadata: {traceback.format_exc()}", flush=True)

def main(args=None):
    rclpy.init(args=args)
    analyzer = WorkspaceAnalyzer()
    try: rclpy.spin(analyzer)
    except KeyboardInterrupt: pass
    finally:
        analyzer.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__': main()