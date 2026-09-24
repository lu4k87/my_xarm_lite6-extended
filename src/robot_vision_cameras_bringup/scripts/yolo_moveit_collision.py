#!/usr/bin/env python3

import json
import rclpy
import math
from rclpy.node import Node
from rclpy.qos import QoSProfile, DurabilityPolicy
from visualization_msgs.msg import MarkerArray, Marker
from moveit_msgs.msg import CollisionObject
from shape_msgs.msg import SolidPrimitive
from geometry_msgs.msg import Point, Pose
from std_msgs.msg import Bool, String
from std_srvs.srv import SetBool
from tf2_ros import Buffer, TransformListener

class YoloMoveitCollision(Node):
    def __init__(self):
        super().__init__('yolo_moveit_collision')

        # Subscriber to the YOLO 3D BBox MarkerArray
        self.sub_markers = self.create_subscription(
            MarkerArray,
            '/zed/bboxes_3d',
            self.marker_callback,
            10
        )

        # Publisher for CollisionObject (MoveIt)
        self.pub_collision_object = self.create_publisher(
            CollisionObject,
            '/collision_object',
            10
        )

        # Publisher for RViz Toggle and Visualization
        self.pub_collision_toggle = self.create_publisher(
            MarkerArray,
            '/ui/yolo_collision_toggle',
            10
        )
        self.pub_collision_markers = self.create_publisher(
            MarkerArray,
            '/zed/yolo_collision_markers',
            10
        )

        # known_objects = was aktuell als CollisionObject in MoveIt liegt
        self.known_objects = set()
        self.ignored_objects = {}
        self.object_last_seen = {}
        self.published_vis_ids = set()
        self.last_publish_time = self.get_clock().now()
        
        # TF Buffer and Listener
        self.tf_buffer = Buffer()
        self.tf_listener = TransformListener(self.tf_buffer, self)
        
        # Publisher for status messages
        self.pub_status = self.create_publisher(String, '/ui/grasp_status', 10)
        
        # Subscriber to temporarily ignore objects (e.g. during grasping)
        self.sub_ignore = self.create_subscription(
            String,
            '/ui/ignore_collision_object',
            self.ignore_callback,
            10
        )

        # Die Robot Control UI schaltet die Objekt-Kollision fuer MoveIt ueber
        # /ui/set_moveit_collision_objects ein/aus. Die RViz-Marker laufen
        # unabhaengig davon weiter; nach einem Neustart ist die Kollision AN.
        self.collision_enabled = True
        latched_qos = QoSProfile(depth=1, durability=DurabilityPolicy.TRANSIENT_LOCAL)
        self.pub_enabled = self.create_publisher(
            Bool, '/ui/moveit_collision_objects_enabled', latched_qos)
        self.create_service(
            SetBool, '/ui/set_moveit_collision_objects', self.set_enabled_callback)
        self.pub_enabled.publish(Bool(data=self.collision_enabled))

        # Kollision fuer einzelne Objekte dauerhaft aus (Kontextmenue der
        # Robot Control UI). Anders als /ui/ignore_collision_object laeuft das
        # nicht nach Abstand oder Timeout ab, sondern bis es wieder an ist.
        # Befehl: JSON {"name": "<Kollisionsname>", "enabled": true|false}
        self.disabled_objects = set()
        self.pub_disabled = self.create_publisher(
            String, '/ui/disabled_collision_objects', latched_qos)
        self.create_subscription(
            String, '/ui/set_object_collision', self.set_object_collision_callback, 10)
        self._publish_disabled_objects()

        # End effector links that are allowed to collide with the objects
        # Freie Zone unter der Objektoberkante, in der die Seitenwaende fehlen
        # (siehe open_box_walls). 1 cm: die Waende schuetzen fast die ganze
        # Objekthoehe. Kleiner als der Servo-Haltabstand von 2 cm - beim
        # Herunterjoggen direkt ueber dem Objekt kann Servo deshalb etwas
        # frueher stoppen. "Approach from above" plant ueber MoveIt und ist
        # davon nicht betroffen. Vorher 3 cm (Waende wirkten zu niedrig).
        self.top_clearance = float(
            self.declare_parameter('top_clearance', 0.01).value)

        self.eef_links = [
            'link5', 'link6', 'link_eef',
            'uflite_vacuum_gripper_link', 'uflite_gripper_link',
            'vacuum_gripper_link', 'lite_gripper_link', 'other_geometry_link'
        ]

        self.get_logger().info('YOLO MoveIt Collision Node aktiv gestartet. Publiziert CollisionObjects fuer MoveIt.')

    def ignore_callback(self, msg):
        obj_name = msg.data.strip()
        if obj_name:
            current_time = self.get_clock().now().nanoseconds / 1e9
            self.ignored_objects[obj_name] = {'state': 'WAITING', 'timestamp': current_time}
            self.get_logger().info(f'Ignoriere Collision-Objekt temporaer: {obj_name}')
            
            # Immediately remove it if it was known
            if obj_name in self.known_objects:
                co = CollisionObject()
                co.id = obj_name
                co.operation = CollisionObject.REMOVE
                self.pub_collision_object.publish(co)
                self.known_objects.remove(obj_name)

    def _publish_disabled_objects(self):
        self.pub_disabled.publish(String(data=json.dumps(sorted(self.disabled_objects))))

    def set_object_collision_callback(self, msg):
        try:
            cmd = json.loads(msg.data)
            name = str(cmd['name']).strip().replace(' ', '_')
            enabled = bool(cmd['enabled'])
        except (ValueError, KeyError, TypeError):
            self.get_logger().warn(f'Ungueltiger Befehl auf /ui/set_object_collision: {msg.data!r}')
            return
        if not name:
            return
        if enabled:
            # Beim naechsten /zed/bboxes_3d wird das Objekt wieder angelegt.
            self.disabled_objects.discard(name)
        else:
            self.disabled_objects.add(name)
            if name in self.known_objects:
                co = CollisionObject()
                co.id = name
                co.operation = CollisionObject.REMOVE
                self.pub_collision_object.publish(co)
                self.known_objects.discard(name)
        state = 'enabled' if enabled else 'DISABLED'
        self.get_logger().warn(f'Kollision fuer {name}: {state}')
        self.pub_status.publish(String(data=f"{'🟢' if enabled else '⚠️'} Collision for {name} {state}"))
        self._publish_disabled_objects()

    def set_enabled_callback(self, request, response):
        self.collision_enabled = bool(request.data)
        if not self.collision_enabled:
            self.remove_collision_objects()
        # Beim Einschalten fehlen die Objekte in known_objects und werden
        # deshalb mit dem naechsten /zed/bboxes_3d sofort wieder angelegt.
        self.pub_enabled.publish(Bool(data=self.collision_enabled))
        response.success = True
        response.message = f"MoveIt object collision {'enabled' if self.collision_enabled else 'disabled'}"
        self.get_logger().warn(response.message)
        return response

    def remove_collision_objects(self):
        for obj_name in list(self.known_objects):
            co = CollisionObject()
            co.id = obj_name
            co.operation = CollisionObject.REMOVE
            self.pub_collision_object.publish(co)
        self.known_objects.clear()

    def remove_all_objects(self):
        for obj_name in list(self.known_objects):
            co = CollisionObject()
            co.id = obj_name
            co.operation = CollisionObject.REMOVE
            self.pub_collision_object.publish(co)
        self.known_objects.clear()
        
        # Clean RViz visual markers
        if self.published_vis_ids:
            del_array = MarkerArray()
            for old_id in self.published_vis_ids:
                dm = Marker()
                dm.header.frame_id = 'world'
                dm.header.stamp = self.get_clock().now().to_msg()
                dm.ns = 'yolo_collision_vis'
                dm.id = old_id
                dm.action = Marker.DELETE
                del_array.markers.append(dm)
            self.pub_collision_toggle.publish(del_array)
            self.pub_collision_markers.publish(del_array)
            self.published_vis_ids.clear()
        self.get_logger().info('Alle YOLO Collision-Objekte aus MoveIt entfernt.')

    def wall_height(self, scale_z):
        # Mindestens 1 cm Wand, auch bei flachen Objekten.
        return max(0.01, min(scale_z, scale_z - self.top_clearance))

    def open_box_walls(self, cx, cy, cz, sx, sy, sz):
        """Boden und vier Seitenwaende als (dimensions, center) - kein Deckel."""
        t = 0.001
        bottom = cz - sz / 2.0
        h = self.wall_height(sz)
        wz = bottom + t + (h - t) / 2.0
        return [
            ((sx, sy, t), (cx, cy, bottom + t / 2.0)),
            ((t, sy, h - t), (cx - sx / 2.0 + t / 2.0, cy, wz)),
            ((t, sy, h - t), (cx + sx / 2.0 - t / 2.0, cy, wz)),
            ((sx - 2 * t, t, h - t), (cx, cy + sy / 2.0 - t / 2.0, wz)),
            ((sx - 2 * t, t, h - t), (cx, cy - sy / 2.0 + t / 2.0, wz)),
        ]

    def open_box_triangles(self, cx, cy, cz, sx, sy, sz):
        """Boden + 4 Seitenflaechen als TRIANGLE_LIST, oben offen."""
        x0, x1 = cx - sx / 2.0, cx + sx / 2.0
        y0, y1 = cy - sy / 2.0, cy + sy / 2.0
        z0 = cz - sz / 2.0
        z1 = z0 + self.wall_height(sz)
        quads = [
            ((x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0)),  # Boden
            ((x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1)),  # -Y
            ((x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)),  # +Y
            ((x0, y0, z0), (x0, y1, z0), (x0, y1, z1), (x0, y0, z1)),  # -X
            ((x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)),  # +X
        ]
        pts = []
        for a, b, c, d in quads:
            for x, y, z in (a, b, c, a, c, d):
                pts.append(Point(x=x, y=y, z=z))
        return pts

    def marker_callback(self, msg):
        current_time = self.get_clock().now().nanoseconds / 1e9
        
        # Get TCP position
        tcp_x, tcp_y, tcp_z = None, None, None
        try:
            trans = self.tf_buffer.lookup_transform('world', 'link_tcp', rclpy.time.Time())
            tcp_x = trans.transform.translation.x
            tcp_y = trans.transform.translation.y
            tcp_z = trans.transform.translation.z
        except Exception:
            pass

        # Parse MarkerArray
        objects_dict = {}
        for marker in msg.markers:
            if marker.action == Marker.DELETE or marker.action == Marker.DELETEALL:
                continue

            obj_id = marker.id
            if obj_id not in objects_dict:
                objects_dict[obj_id] = {'name': f'yolo_obj_{obj_id}', 'points': [], 'frame_id': marker.header.frame_id}

            if marker.ns == 'yolo_labels_class' and marker.type == Marker.TEXT_VIEW_FACING:
                objects_dict[obj_id]['name'] = f"{marker.text}_{obj_id}"
            elif marker.ns == 'yolo_bboxes' and marker.type == Marker.LINE_LIST:
                objects_dict[obj_id]['points'] = marker.points

        if not objects_dict:
            # Check for expired objects
            objects_to_remove = set()
            for obj_name in list(self.known_objects):
                last_seen = self.object_last_seen.get(obj_name, 0)
                if (current_time - last_seen) > 2.0:
                    objects_to_remove.add(obj_name)

            for obj_name in objects_to_remove:
                co = CollisionObject()
                co.id = obj_name
                co.operation = CollisionObject.REMOVE
                self.pub_collision_object.publish(co)
                self.known_objects.discard(obj_name)
                self.object_last_seen.pop(obj_name, None)

            if len(self.published_vis_ids) > 0 and len(self.known_objects) == 0:
                del_array = MarkerArray()
                for old_id in self.published_vis_ids:
                    dm = Marker()
                    dm.header.frame_id = 'world'
                    dm.header.stamp = self.get_clock().now().to_msg()
                    dm.ns = 'yolo_collision_vis'
                    dm.id = old_id
                    dm.action = Marker.DELETE
                    del_array.markers.append(dm)
                self.pub_collision_toggle.publish(del_array)
                self.pub_collision_markers.publish(del_array)
                self.published_vis_ids.clear()
            return

        vis_markers = MarkerArray()
        current_objects = set()
        current_vis_ids = set()

        now = self.get_clock().now()
        time_since_last_publish = (now - self.last_publish_time).nanoseconds / 1e9
        should_publish_collision = (time_since_last_publish >= 0.4)

        for obj_id, data in objects_dict.items():
            if not data['points']:
                continue
                
            pts = data['points']
            xs = [p.x for p in pts]
            ys = [p.y for p in pts]
            zs = [p.z for p in pts]
            
            min_x, max_x = min(xs), max(xs)
            min_y, max_y = min(ys), max(ys)
            min_z, max_z = min(zs), max(zs)
            
            center_x = (min_x + max_x) / 2.0
            center_y = (min_y + max_y) / 2.0
            center_z = (min_z + max_z) / 2.0
            
            scale_x = max(0.02, max_x - min_x)
            scale_y = max(0.02, max_y - min_y)
            scale_z = max(0.02, max_z - min_z)
            
            obj_name = data['name'].replace(' ', '_')
            
            top_x = center_x
            top_y = center_y
            top_z = center_z + scale_z / 2.0
            
            # State Machine for Ignored Objects
            if obj_name in self.ignored_objects:
                ign_info = self.ignored_objects[obj_name]
                if tcp_x is not None:
                    dist = math.sqrt((tcp_x - top_x)**2 + (tcp_y - top_y)**2 + (tcp_z - top_z)**2)
                    
                    if ign_info['state'] == 'WAITING':
                        if dist < 0.05:
                            self.ignored_objects[obj_name]['state'] = 'INSIDE'
                            self.get_logger().info(f"TCP nahe {obj_name} (< 5cm). Status -> INSIDE")
                        elif (current_time - ign_info['timestamp']) > 20.0:
                            msg_str = f"⚠️ Timeout: Kollision fuer {obj_name} reaktiviert"
                            self.get_logger().info(msg_str)
                            self.pub_status.publish(String(data=msg_str))
                            del self.ignored_objects[obj_name]
                            
                    elif ign_info['state'] == 'INSIDE':
                        if dist > 0.10:
                            msg_str = f"➤ TCP entfernte sich von {obj_name} (> 10cm). Kollision wieder aktiv."
                            self.get_logger().info(msg_str)
                            self.pub_status.publish(String(data=msg_str))
                            del self.ignored_objects[obj_name]
                            
                if obj_name in self.ignored_objects:
                    continue

            # Vom Nutzer dauerhaft abgeschaltet: weder Kollisionsobjekt noch
            # rote Waende - der Rahmen aus /zed/bboxes_3d bleibt sichtbar.
            if obj_name in self.disabled_objects:
                continue
            
            current_objects.add(obj_name)
            self.object_last_seen[obj_name] = current_time
            
            # --- 1. Collision Object for MoveIt ---
            # Offene Kiste aus 5 duennen Waenden (Boden + 4 Seiten), OHNE
            # Deckel. Die Seitenwaende enden top_clearance unter der
            # Objektoberkante: MoveIt Servo haelt schon 2 cm vor jeder
            # Kollisionsgeometrie an (min_allowable_collision_distance), und
            # Wandkanten genau auf Hoehe der Oberkante wirkten deshalb beim
            # Anfahren von oben wie ein Deckel. Seitlich und unten bleibt das
            # Objekt geschuetzt.
            walls = self.open_box_walls(
                center_x, center_y, center_z, scale_x, scale_y, scale_z)

            co = CollisionObject()
            co.header.frame_id = data['frame_id']
            co.id = obj_name
            co.operation = CollisionObject.ADD
            for dims, (px, py, pz) in walls:
                prim = SolidPrimitive()
                prim.type = SolidPrimitive.BOX
                prim.dimensions = list(dims)
                p = Pose()
                p.position.x = px
                p.position.y = py
                p.position.z = pz
                p.orientation.w = 1.0
                co.primitives.append(prim)
                co.primitive_poses.append(p)

            if self.collision_enabled and (
                    (obj_name not in self.known_objects) or should_publish_collision):
                self.pub_collision_object.publish(co)

            # --- 2. Waende fuer RViz und die Robot Control UI ---
            # Nur bei aktiver Kollision: rot transparent, exakt die Geometrie,
            # die MoveIt kennt. Ist die Kollision aus, fehlt der Marker - der
            # Rahmen (yolo_bboxes aus /zed/bboxes_3d) bleibt trotzdem sichtbar.
            if not self.collision_enabled:
                continue

            vm = Marker()
            vm.header.frame_id = data['frame_id']
            vm.header.stamp = now.to_msg()
            vm.ns = 'yolo_collision_vis'
            vm.id = obj_id
            vm.type = Marker.TRIANGLE_LIST
            vm.action = Marker.ADD
            vm.pose.orientation.w = 1.0
            vm.scale.x = 1.0
            vm.scale.y = 1.0
            vm.scale.z = 1.0
            vm.color.r = 1.0
            vm.color.g = 0.0
            vm.color.b = 0.0
            vm.color.a = 0.30
            vm.points = self.open_box_triangles(
                center_x, center_y, center_z, scale_x, scale_y, scale_z)
            vm.lifetime.sec = 2
            vm.lifetime.nanosec = 0
            vis_markers.markers.append(vm)
            current_vis_ids.add(obj_id)

        if should_publish_collision:
            self.last_publish_time = now

        # Remove objects that are no longer detected with 2.0s persistence
        objects_to_remove = set()
        for obj_name in list(self.known_objects):
            if obj_name not in current_objects:
                last_seen = self.object_last_seen.get(obj_name, 0)
                if current_time - last_seen > 2.0:
                    objects_to_remove.add(obj_name)

        for obj_name in objects_to_remove:
            co = CollisionObject()
            co.id = obj_name
            co.operation = CollisionObject.REMOVE
            self.pub_collision_object.publish(co)
            self.known_objects.discard(obj_name)
            self.object_last_seen.pop(obj_name, None)

        if self.collision_enabled:
            self.known_objects.update(current_objects)
        
        # Clean up disappeared visual markers
        removed_vis_ids = self.published_vis_ids - current_vis_ids
        for old_id in removed_vis_ids:
            dm = Marker()
            dm.header.frame_id = 'world'
            dm.header.stamp = now.to_msg()
            dm.ns = 'yolo_collision_vis'
            dm.id = old_id
            dm.action = Marker.DELETE
            vis_markers.markers.append(dm)
            
        self.published_vis_ids = current_vis_ids

        if vis_markers.markers:
            self.pub_collision_toggle.publish(vis_markers)
            self.pub_collision_markers.publish(vis_markers)

def main(args=None):
    rclpy.init(args=args)
    node = YoloMoveitCollision()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
