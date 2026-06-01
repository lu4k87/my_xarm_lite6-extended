import os
import glob
import re
import subprocess
import threading

class WorkspaceParser:
    def __init__(self, workspace_path, base_ws_path, logger):
        self.workspace_path = workspace_path
        self.base_ws_path = base_ws_path
        self.logger = logger

        # ── Caches ────────────────────────────────────────────────────────────
        self.pkg_cache = {}
        self.pkg_dependencies_cache = {}
        self.source_files_cache = []
        self.launch_files_cache = []
        self.node_info_cache = {}
        self.workspace_tree_cache = {}
        self.project_files_cache = {}
        self.launch_details_cache = []

        self.executable_pkg_map = {}
        self._exe_cache_lock = threading.Lock()
        self._exe_cache_refresh_done = False

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
                # Robustes Parsing von Name und Dependencies
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

                clean_content = re.sub(r'#.*', '', content)
                
                nodes_list = []
                matches = list(re.finditer(r'\b(Node|ComposableNodeContainer|ComposableNode)\s*\(', clean_content))
                
                for i, match in enumerate(matches):
                    node_type = match.group(1)
                    start_idx = match.end()
                    end_idx = matches[i+1].start() if i + 1 < len(matches) else len(clean_content)
                    
                    n_str = clean_content[start_idx:end_idx]
                    
                    pkg    = re.search(r'package\s*=\s*[\'"]([^\'"]+)[\'"]', n_str)
                    exe    = re.search(r'executable\s*=\s*[\'"]([^\'"]+)[\'"]', n_str)
                    plugin = re.search(r'plugin\s*=\s*[\'"]([^\'"]+)[\'"]', n_str)
                    name_m = re.search(r'name\s*=\s*[\'"]([^\'"]+)[\'"]', n_str)
                    
                    if node_type == 'ComposableNode':
                        exe_val = plugin.group(1).split('::')[-1] if plugin else "component"
                        is_cont = False
                        is_comp = True
                    elif node_type == 'ComposableNodeContainer':
                        exe_val = exe.group(1) if exe else "component_container"
                        is_cont = True
                        is_comp = False
                    else:
                        exe_val = exe.group(1) if exe else "unknown"
                        is_cont = False
                        is_comp = False
                    
                    if pkg and exe_val != "unknown":
                        nodes_list.append({
                            "package":      pkg.group(1),
                            "executable":   exe_val,
                            "name":         name_m.group(1) if name_m else exe_val,
                            "is_container": is_cont,
                            "is_component": is_comp
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
        self.build_executable_cache_async()

    def build_executable_cache_async(self):
        t = threading.Thread(target=self._build_executable_cache, daemon=True)
        t.start()

    def _build_executable_cache(self):
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
                self.logger.debug(f'[exe-cache] {pkg_name}: {e}')

        with self._exe_cache_lock:
            self.executable_pkg_map = new_map
        self.logger.info(f"[exe-cache] {len(new_map)} Executables gecacht.")

    def schedule_exe_cache_refresh(self):
        if self._exe_cache_refresh_done:
            return
        self._exe_cache_refresh_done = True
        self.build_executable_cache_async()
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
                self.logger.debug(f"Indexed: {t_file}")

            self.project_files_cache[t_file] = info

    def get_package_for_file(self, file_path):
        best_match, best_pkg = "", "Unbekannt"
        for pkg_dir, pkg_name in self.pkg_cache.items():
            if file_path.startswith(pkg_dir) and len(pkg_dir) > len(best_match):
                best_match, best_pkg = pkg_dir, pkg_name
        return best_pkg

    def classify_node_category(self, pkg_name, launched_by):
        if pkg_name in self.pkg_cache.values():
            return 'workspace'
        if launched_by and launched_by != 'Terminal / Sub-Prozess':
            return 'system_via_launch'
        return 'system'

    def _find_source_file(self, executable_name, pkg_name):
        exts = ['.py', '.cpp']
        pkg_src_dir = os.path.join(self.workspace_path, pkg_name)

        candidates = []
        for ext in exts:
            candidates += [
                os.path.join(self.workspace_path, pkg_name, pkg_name, f"{executable_name}{ext}"),
                os.path.join(self.workspace_path, pkg_name, 'src', f"{executable_name}{ext}"),
                os.path.join(self.workspace_path, pkg_name, f"{executable_name}{ext}"),
            ]

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

    def resolve_node_info(self, raw_node_name):
        clean_name = raw_node_name.lstrip('/')
        if clean_name in self.node_info_cache:
            return self.node_info_cache[clean_name]

        info = {
            "package":      "ROS 2 System",
            "source_file":  "Kompilierte Binary",
            "file_path":    "/opt/ros/humble/...",
            "launched_by":  "Terminal / Sub-Prozess",
            "is_workspace": False,
            "category":     "system",
        }

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

        for src in self.source_files_cache:
            try:
                base_name = os.path.splitext(os.path.basename(src))[0]
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

        for launch in self.launch_details_cache:
            for l_node in launch.get("parsed_nodes", []):
                l_name = l_node.get("name", "")
                l_exec = l_node.get("executable", "")
                if l_name == clean_name or l_exec == clean_name:
                    l_pkg = l_node.get("package", "")
                    info["launched_by"] = launch["file_name"]
                    info["package"]    = l_pkg
                    if l_pkg in self.pkg_cache.values():
                        info["is_workspace"] = True
                        info["category"]     = "workspace"
                        if not info["file_path"].startswith("src/"):
                            src_path = self._find_source_file(l_exec, l_pkg)
                            if src_path:
                                info["source_file"] = os.path.basename(src_path)
                                info["file_path"]   = src_path
                            else:
                                info["source_file"] = f"Launch: {launch['file_name']}"
                                info["file_path"]   = launch.get("path", "/opt/ros/humble/...")
                    else:
                        info["category"]     = "system_via_launch"
                        info["is_workspace"] = False
                        info["source_file"]  = f"gestartet via: {launch['file_name']}"
                        info["file_path"]    = launch.get("path", "/opt/ros/humble/...")
                    break
            if info["launched_by"] != "Terminal / Sub-Prozess":
                break

        if info["category"] == "system":
            with self._exe_cache_lock:
                exe_map = self.executable_pkg_map
            if clean_name in exe_map:
                ws_pkg = exe_map[clean_name]
                if ws_pkg in self.pkg_cache.values():
                    src_path = self._find_source_file(clean_name, ws_pkg)
                    info.update({
                        "package":      ws_pkg,
                        "source_file":  os.path.basename(src_path) if src_path else f"{clean_name} (Binary)",
                        "file_path":    src_path if src_path else f"src/{ws_pkg}/",
                        "is_workspace": True,
                        "category":     "workspace",
                    })

        if info["category"] == "system":
            info["source_file"] = "Kompilierte Binary"
            info["file_path"]   = "/opt/ros/humble/..."
            info["is_workspace"] = False
            
        info["is_workspace"] = (info["category"] == "workspace")
        
        if info["package"] != "Unbekannt":
            info["dependencies"] = self.pkg_dependencies_cache.get(info["package"], [])
        else:
            info["dependencies"] = []

        self.node_info_cache[clean_name] = info
        return info
