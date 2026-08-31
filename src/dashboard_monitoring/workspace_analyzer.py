#!/usr/bin/env python3
"""
workspace_analyzer.py – Workspace Analyzer Backend
Optimierungen (2025-03):
  - Topology-Abfrage nur bei Änderung der Node-Liste (Diff)
  - exe-cache in separatem Thread (kein Blockieren des ROS-Spin)
  - Activity-Subscriptions: Diff-basiert (keine vollen Rebuilds)
  - last_messages beim untrack clearen
  - Debug-Prints → get_logger().debug()
  - /tmp-Debug-Schreiben entfernt
  - pulse_timer 2s → 3s
  - Modularized: parser logic moved to workspace_parser.py, bashrc to system_utils.py
"""
import rclpy
from rclpy.node import Node
from std_msgs.msg import String
import json
import os
import subprocess
import time
import copy
import re
from rclpy.qos import QoSProfile, QoSHistoryPolicy, QoSReliabilityPolicy
from rosidl_runtime_py.utilities import get_message

from system_utils import parse_bashrc, parse_bashrc_env_vars
from workspace_parser import WorkspaceParser


class WorkspaceAnalyzer(Node):
    def __init__(self):
        super().__init__('workspace_analyzer')

        self.publisher_       = self.create_publisher(String, '/dashboard/workspace_metadata', 10)
        self.code_req_sub     = self.create_subscription(String, '/dashboard/request_file_content',  self.handle_code_request,     10)
        self.code_pub         = self.create_publisher  (String, '/dashboard/file_content',           10)
        self.explorer_sub     = self.create_subscription(String, '/dashboard/request_open_explorer', self.handle_open_explorer,    10)

        self.workspace_path = os.path.expanduser('~/dev_ws/src')
        self.base_ws_path   = os.path.expanduser('~/dev_ws')

        # Instantiate Parser
        self.parser = WorkspaceParser(self.workspace_path, self.base_ws_path, self.get_logger())

        # Additional Caches
        self.startup_sh_mtime         = 0
        self.startup_sh_cache         = set()

        # ── Topic-Activity ────────────────────────────────────────────────────
        self.tracked_topics   = []
        self.subs             = {}          # topic → subscription
        self.message_counts   = {}          # topic → int
        self.last_messages    = {}          # topic → str
        self.last_publish_time = time.time()
        self.last_topology_update = 0        # Timestamp für Topology-Vollrefresh

        self.cmd_sub      = self.create_subscription(String, '/dashboard/request_topic_activity', self.handle_activity_request, 10)
        self.activity_pub = self.create_publisher  (String, '/dashboard/topic_activity',          10)
        self.activity_timer = self.create_timer(0.5, self.publish_activity)

        # ── Topology-Diff: Merker für letzte bekannte Node-Menge ──────────────
        self.cli_node_cache    = {}
        self._last_known_nodes: set = set()          # full_names
        self._topology_cache: dict  = {}             # full_name → {publishers, subscribers}

        # ── On-Demand Node-Details ────────────────────────────────────────────
        self.node_detail_sub = self.create_subscription(
            String, '/dashboard/request_node_details', self.handle_node_detail_request, 10)

        # ── Initialisierung ───────────────────────────────────────────────────
        self.parser.index_workspace()

        # Full Metadata alle 10 s  |  Pulse alle 3 s (statt 2 s)
        self.timer       = self.create_timer(10.0, self.publish_metadata)
        self.pulse_timer = self.create_timer( 3.0, self.publish_active_nodes_pulse)

        # Exe-Cache 30 s nach Start im Hintergrund auffrischen
        self.create_timer(30.0, self.parser.schedule_exe_cache_refresh)

    def handle_node_detail_request(self, msg):
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

            self._topology_cache[node_name] = {
                "publishers":  node_data["publishers"],
                "subscribers": node_data["subscribers"],
            }

            self.publish_metadata()
        except Exception as e:
            self.get_logger().error(f"Fehler bei On-Demand Abfrage: {e}")

    def handle_open_explorer(self, msg):
        req_path = msg.data.strip()
        if not req_path or req_path == 'Pfad unbekannt':
            return
        full_path = req_path if os.path.isabs(req_path) else os.path.join(self.base_ws_path, req_path)
        try:
            if not os.path.exists(full_path):
                base = os.path.basename(full_path)
                for cache_file in self.parser.source_files_cache + self.parser.launch_files_cache:
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
                for cache_file in self.parser.source_files_cache + self.parser.launch_files_cache:
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

    def handle_activity_request(self, msg):
        try:
            req        = json.loads(msg.data)
            new_topics = req.get('topics', [])
            new_set    = {t['topic'] for t in new_topics}
            old_set    = set(self.subs.keys())

            to_remove = old_set - new_set
            for topic in to_remove:
                try:
                    self.destroy_subscription(self.subs.pop(topic))
                except Exception:
                    pass
                self.message_counts.pop(topic, None)
                self.last_messages.pop(topic, None)

            qos = QoSProfile(
                history=QoSHistoryPolicy.KEEP_LAST,
                depth=1,
                reliability=QoSReliabilityPolicy.BEST_EFFORT,
            )
            for t_info in new_topics:
                topic_name     = t_info['topic']
                topic_type_str = t_info.get('type')

                if topic_name in self.subs:
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
                                try:
                                    from rosidl_runtime_py import message_to_ordereddict
                                    msg_dict = message_to_ordereddict(m)
                                    msg_str = json.dumps(msg_dict)
                                except Exception:
                                    msg_str = str(m)
                                if len(msg_str) > 2000:
                                    msg_str = msg_str[:2000] + "... [TRUNCATED]"
                                
                                if t_name not in ["/dashboard/topic_activity", "/dashboard/workspace_metadata"]:
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
            self.get_logger().error(f"Fehler in handle_activity_request: {e}")

    def publish_activity(self):
        if not self.tracked_topics:
            return
        now = time.time()
        elapsed = now - self.last_publish_time
        if elapsed <= 0: elapsed = 0.001
        self.last_publish_time = now

        activity_data = []
        for t_info in self.tracked_topics:
            topic_name = t_info['topic']
            count = self.message_counts.get(topic_name, 0)
            self.message_counts[topic_name] = 0
            hz = count / elapsed
            lmsg = self.last_messages.get(topic_name, "Warte auf Daten...")

            activity_data.append({
                "topic": topic_name,
                "hz": round(hz, 2),
                "last_message": lmsg
            })

        self.activity_pub.publish(String(data=json.dumps({"activities": activity_data})))

    def publish_active_nodes_pulse(self):
        try:
            node_names_and_namespaces = self.get_node_names_and_namespaces()
            active_node_names = [n for n, _ in node_names_and_namespaces]
            pulse_data = {
                "type": "node_pulse",
                "active_nodes": active_node_names
            }
            self.publisher_.publish(String(data=json.dumps(pulse_data)))
        except Exception:
            pass

    def publish_metadata(self):
        try:
            import traceback

            node_names_and_namespaces = self.get_node_names_and_namespaces()
            current_full_names        = {
                f"{ns}/{n}".replace('//', '/') for n, ns in node_names_and_namespaces
            }

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

            dead_nodes = set(self.cli_node_cache.keys()) - current_full_names
            for dn in dead_nodes:
                if dn != 'workspace_analyzer':
                    del self.cli_node_cache[dn]

            bashrc_env = parse_bashrc_env_vars()

            def env_get(key, default=''):
                return os.environ.get(key) or bashrc_env.get(key, default)

            metadata = {
                "nodes":         {},
                "project_files": copy.deepcopy(self.parser.project_files_cache),
                "bashrc":        parse_bashrc(),
                "tree":          self.parser.workspace_tree_cache,
                "launches":      [],
                "all_launches":  self.parser.launch_details_cache,
                "ros_domain_id": env_get("ROS_DOMAIN_ID", "0"),
                "ros_distro":    env_get("ROS_DISTRO", "humble"),
                "rmw_impl":      env_get("RMW_IMPLEMENTATION", "fastrtps"),
                "localhost_only": env_get("ROS_LOCALHOST_ONLY", "0"),
            }

            active_launch_files = set()

            for name, namespace in node_names_and_namespaces:
                full_name  = f"{namespace}/{name}".replace('//', '/')
                node_topo  = self._topology_cache.get(full_name, {"publishers": [], "subscribers": []})
                pubs, subs = node_topo["publishers"], node_topo["subscribers"]
                info       = self.parser.resolve_node_info(name)

                all_pubs    = {t["topic"]: t["types"] for t in pubs}
                all_subs    = {t["topic"]: t["types"] for t in subs}
                all_srvs    = {}
                all_clients = {}

                if full_name in self.cli_node_cache:
                    cli = self.cli_node_cache[full_name]
                    for p  in cli.get('publishers',  []): all_pubs[p['topic']]   = p['types']
                    for s  in cli.get('subscribers', []): all_subs[s['topic']]   = s['types']
                    for sr in cli.get('services',    []): all_srvs[sr['name']]   = sr['types']
                    for c  in cli.get('clients',     []): all_clients[c['name']] = c['types']

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
                    "category":          info.get("category", "system"),
                    "filtered_subs_count": 0,
                    "publishers":        [{"topic": k, "types": v} for k, v in all_pubs.items()],
                    "subscribers":       [{"topic": k, "types": v} for k, v in all_subs.items()],
                    "services":          [{"name":  k, "types": v} for k, v in all_srvs.items()],
                    "clients":           [{"name":  k, "types": v} for k, v in all_clients.items()],
                    "actions":           list(action_bases),
                    "action_count":      len(action_bases),
                    "dependencies":      self.parser.pkg_dependencies_cache.get(info["package"], []),
                }

                for p_file, p_data in metadata["project_files"].items():
                    p_file_no_ext = os.path.splitext(p_file)[0]
                    if info["source_file"] == p_file or name == p_file_no_ext:
                        p_data["is_active"]        = True
                        p_data["active_node_name"] = full_name
                        break

                if info["launched_by"] and "Terminal" not in info["launched_by"]:
                    active_launch_files.add(info["launched_by"])

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

            includes_map = {l["file_name"]: l.get("parsed_includes", []) for l in self.parser.launch_details_cache}
            added_new = True
            while added_new:
                added_new = False
                for lname in list(relevant_launch_names):
                    for inc in includes_map.get(lname, []):
                        if inc not in relevant_launch_names:
                            relevant_launch_names.add(inc)
                            added_new = True

            filtered_launches = []
            for l in self.parser.launch_details_cache:
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
