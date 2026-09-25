#!/usr/bin/env python3
"""Virtuelle Objekt-Erkennung fuer die drei Szenenobjekte.

Blue Cube, Red Rectangle und Green Cylinder (TF-Tuner-Frames target_*) werden
so auf /zed/bboxes_3d publiziert, als haette YOLO sie erkannt: Bounding Box,
rote Greifkugel und Labels im exakt gleichen Marker-Format. Alles, was an
/zed/bboxes_3d haengt, behandelt sie damit wie echte Detektionen:
  - yolo_moveit_collision   -> MoveIt-Kollisionsobjekt + rote Waende
  - Robot Control UI        -> Viewport, Liste "Detected Objects", Kontextmenue,
                               VR (zusaetzlich ueber /ui/virtual_bboxes_3d)
  - robot_motion_handler    -> Approach from above, Objekt-Scan

Die Objekte sind nur virtuell - der Name bekommt deshalb " (virtual)" angehaengt.
Marker-IDs ab 901, damit sie nie mit den YOLO-IDs (0, 1, 2, ...) kollidieren.

Schalter: /ui/set_virtual_detections (std_srvs/SetBool), Zustand latched auf
/ui/virtual_detections_enabled. Standard AUS - virtuelle Kollisionsobjekte
sollen nie unbemerkt in MoveIt landen.
"""

import math

import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, DurabilityPolicy
from geometry_msgs.msg import Point
from std_msgs.msg import Bool
from std_srvs.srv import SetBool
from tf2_ros import Buffer, TransformListener, TransformException
from visualization_msgs.msg import Marker, MarkerArray

WORLD = 'world'

# Masse und Standardposen wie im TF Tuner der Robot Control UI (tf_tuner.js)
# und in rviz_marker_3d_scene_objects. Die TF-z ist die UNTERKANTE des Objekts.
OBJECTS = [
    {'id': 901, 'label': 'Cube (virtual)', 'frame': 'target_blue_cube',
     'shape': 'box', 'dims': (0.03, 0.03, 0.03), 'color': (0.15, 0.39, 0.92),
     'default': (0.300, 0.085, 0.0, 0.0)},
    {'id': 902, 'label': 'Rectangle (virtual)', 'frame': 'target_red_rectangle',
     'shape': 'box', 'dims': (0.06, 0.03, 0.03), 'color': (0.86, 0.15, 0.15),
     'default': (0.305, -0.080, 0.0, math.pi / 4.0)},
    {'id': 903, 'label': 'Cylinder (virtual)', 'frame': 'target_green_cylinder',
     'shape': 'cylinder', 'dims': (0.03, 0.03, 0.03), 'color': (0.09, 0.64, 0.29),
     'default': (0.350, 0.025, 0.0, 0.0)},
]

# Namespaces wie yolo_3d_bbox_for_zed_m.py
MARKER_NAMESPACES = ['yolo_bboxes', 'yolo_object_grasp_center_point',
                     'yolo_labels_class', 'yolo_labels_coords']


def quat_to_matrix(x, y, z, w):
    return (
        (1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)),
        (2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)),
        (2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)),
    )


def yaw_quat(yaw):
    return (0.0, 0.0, math.sin(yaw / 2.0), math.cos(yaw / 2.0))


def aabb_half_extents(obj, rot):
    """Halbe Kantenlaengen der achsparallelen Huelle des gedrehten Objekts.

    YOLO liefert immer achsparallele Boxen, und yolo_moveit_collision baut die
    Waende daraus - ein gedrehtes Rechteck bekommt also (wie bei einer echten
    Erkennung) die etwas groessere, achsparallele Huelle.
    """
    dx, dy, dz = obj['dims']
    if obj['shape'] == 'cylinder':
        # Exakte Huelle eines Zylinders mit Achse a = R * z
        r, hh = dx / 2.0, dz / 2.0
        return tuple(r * math.sqrt(max(0.0, 1.0 - rot[i][2] ** 2)) + hh * abs(rot[i][2])
                     for i in range(3))
    h = (dx / 2.0, dy / 2.0, dz / 2.0)
    return tuple(sum(abs(rot[i][j]) * h[j] for j in range(3)) for i in range(3))


class VirtualObjectDetections(Node):
    def __init__(self):
        super().__init__('virtual_object_detections')

        self.enabled = bool(self.declare_parameter('enabled', False).value)
        rate = float(self.declare_parameter('rate_hz', 5.0).value)

        self.pub_markers = self.create_publisher(MarkerArray, '/zed/bboxes_3d', 10)
        # Dieselben Marker noch einmal exklusiv fuer die Robot Control UI
        # (Desktop, VR, VR-Spiegel). Sie abonniert /zed/bboxes_3d gedrosselt
        # mit Queue 1 - bei YOLO mit Kamerarate wuerden die virtuellen
        # Nachrichten dort meist verdraengt und die Objekte flackern.
        self.pub_ui_markers = self.create_publisher(MarkerArray, '/ui/virtual_bboxes_3d', 10)

        latched_qos = QoSProfile(depth=1, durability=DurabilityPolicy.TRANSIENT_LOCAL)
        self.pub_enabled = self.create_publisher(Bool, '/ui/virtual_detections_enabled', latched_qos)
        self.create_service(SetBool, '/ui/set_virtual_detections', self.set_enabled_callback)
        self.pub_enabled.publish(Bool(data=self.enabled))

        self.tf_buffer = Buffer()
        self.tf_listener = TransformListener(self.tf_buffer, self)

        # Letzte bekannte Pose je Objekt: TF-Frame fehlt (TF Tuner aus) ->
        # Standardpose bzw. zuletzt gesehene Pose bleibt stehen.
        self.poses = {}
        for obj in OBJECTS:
            x, y, z, yaw = obj['default']
            self.poses[obj['id']] = ((x, y, z), yaw_quat(yaw))

        self.create_timer(1.0 / max(rate, 0.5), self.publish_detections)
        self.get_logger().info(
            f"Virtuelle Objekt-Erkennung bereit ({'AN' if self.enabled else 'AUS'}) - "
            'Umschalten ueber /ui/set_virtual_detections')

    def set_enabled_callback(self, request, response):
        self.enabled = bool(request.data)
        if not self.enabled:
            self.delete_markers()
        else:
            self.publish_detections()
        self.pub_enabled.publish(Bool(data=self.enabled))
        response.success = True
        response.message = f"Virtual object detections {'enabled' if self.enabled else 'disabled'}"
        self.get_logger().info(response.message)
        return response

    def delete_markers(self):
        # Kollisionsobjekt und Waende entfernt yolo_moveit_collision selbst,
        # sobald die Objekte 2 s lang nicht mehr gemeldet werden.
        arr = MarkerArray()
        stamp = self.get_clock().now().to_msg()
        for obj in OBJECTS:
            for ns in MARKER_NAMESPACES:
                m = Marker()
                m.header.frame_id = WORLD
                m.header.stamp = stamp
                m.ns = ns
                m.id = obj['id']
                m.action = Marker.DELETE
                arr.markers.append(m)
        self.publish(arr)

    def publish(self, arr):
        self.pub_markers.publish(arr)
        self.pub_ui_markers.publish(arr)

    def update_pose(self, obj):
        try:
            t = self.tf_buffer.lookup_transform(WORLD, obj['frame'], rclpy.time.Time())
        except TransformException:
            return self.poses[obj['id']]
        tr, q = t.transform.translation, t.transform.rotation
        self.poses[obj['id']] = ((tr.x, tr.y, tr.z), (q.x, q.y, q.z, q.w))
        return self.poses[obj['id']]

    def publish_detections(self):
        if not self.enabled:
            return
        stamp = self.get_clock().now().to_msg()
        arr = MarkerArray()

        for obj in OBJECTS:
            (px, py, pz), q = self.update_pose(obj)
            rot = quat_to_matrix(*q)
            hx, hy, hz = aabb_half_extents(obj, rot)
            # Unterkante = TF-z, gedreht wird um den Objektmittelpunkt
            # (wie im Viewport und in RViz).
            cx, cy, cz = px, py, pz + obj['dims'][2] / 2.0
            top_z = cz + hz
            arr.markers.extend(self.object_markers(obj, stamp, (cx, cy, cz), (hx, hy, hz), top_z))

        self.publish(arr)

    def object_markers(self, obj, stamp, center, half, top_z):
        cx, cy, cz = center
        hx, hy, hz = half
        oid = obj['id']
        out = []

        def base(ns, mtype):
            m = Marker()
            m.header.frame_id = WORLD
            m.header.stamp = stamp
            m.ns = ns
            m.id = oid
            m.type = mtype
            m.action = Marker.ADD
            m.pose.orientation.w = 1.0
            m.lifetime.sec = 2
            return m

        # 1. Bounding Box (LINE_LIST, absolute Punkte wie bei YOLO)
        box = base('yolo_bboxes', Marker.LINE_LIST)
        box.scale.x = 0.001
        x0, x1, y0, y1, z0, z1 = cx - hx, cx + hx, cy - hy, cy + hy, cz - hz, cz + hz
        c = [Point(x=x0, y=y0, z=z0), Point(x=x1, y=y0, z=z0), Point(x=x1, y=y1, z=z0), Point(x=x0, y=y1, z=z0),
             Point(x=x0, y=y0, z=z1), Point(x=x1, y=y0, z=z1), Point(x=x1, y=y1, z=z1), Point(x=x0, y=y1, z=z1)]
        box.points = [c[0], c[1], c[1], c[2], c[2], c[3], c[3], c[0],
                      c[4], c[5], c[5], c[6], c[6], c[7], c[7], c[4],
                      c[0], c[4], c[1], c[5], c[2], c[6], c[3], c[7]]
        box.color.r, box.color.g, box.color.b = obj['color']
        box.color.a = 0.90
        out.append(box)

        # 2. Rote Greifkugel mittig auf der Oberseite
        sphere = base('yolo_object_grasp_center_point', Marker.SPHERE)
        sphere.pose.position.x, sphere.pose.position.y, sphere.pose.position.z = cx, cy, top_z
        sphere.scale.x = sphere.scale.y = sphere.scale.z = 0.0125
        sphere.color.r, sphere.color.a = 1.0, 1.0
        out.append(sphere)

        # 3. Labels: Klassenname + Koordinatenzeile
        def text(ns, txt, z_offset):
            tm = base(ns, Marker.TEXT_VIEW_FACING)
            tm.pose.position.x, tm.pose.position.y = cx, cy
            tm.pose.position.z = top_z + 0.015 + z_offset
            tm.scale.z = 0.012
            tm.color.r = tm.color.g = tm.color.b = tm.color.a = 1.0
            tm.text = txt
            return tm

        out.append(text('yolo_labels_class', obj['label'], 0.013))
        out.append(text('yolo_labels_coords',
                        f'X:_{int(cx * 1000)}_mm   Y:_{int(cy * 1000)}_mm   Z:_{int(top_z * 1000)}_mm', 0.0))
        return out


def main(args=None):
    rclpy.init(args=args)
    node = VirtualObjectDetections()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        if rclpy.ok():
            node.delete_markers()
        node.destroy_node()
        rclpy.try_shutdown()


if __name__ == '__main__':
    main()
