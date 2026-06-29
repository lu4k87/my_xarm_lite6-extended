import rclpy
from rclpy.node import Node
from visualization_msgs.msg import Marker, MarkerArray 
from geometry_msgs.msg import Point, Quaternion
import math
import tf2_ros 
from tf2_ros import TransformException 

# =========================================================
# GLOBALE KONSTANTEN
# =========================================================
OBJECT_LINE_Z = -0.002       # Höhe der Hohlkörper-Unterkante (unterhalb des Grids bei Z=0)
LINE_THICKNESS = 0.001

# Frames und interaktive Schwellenwerte
EEF_FRAME = 'link_eef'      
TARGET_FRAME = 'link_base'  
POSITION_TOLERANCE = 0.01   # 10 mm Trigger-Radius für Farbumschlag

# Zielpositionen für die Hohlkörper (jetzt über TF Tuner gesteuert, mit statischem Fallback)
CONFIG = {
    "TARGET_BLUE_CUBE": {"tf_frame": "target_blue_cube", "default_pos": (0.174, 0.082), "default_yaw": 0.0, "dims": (0.03, 0.03, 0.03), "color": [0.0, 0.0, 1.0], "type": Marker.CUBE, "id": 1}, 
    "TARGET_RED_RECTANGLE": {"tf_frame": "target_red_rectangle", "default_pos": (0.219, -0.083), "default_yaw": -math.pi/4.0, "dims": (0.06, 0.03, 0.03), "color": [1.0, 0.0, 0.0], "type": Marker.CUBE, "id": 2}, 
    "TARGET_GREEN_CYLINDER": {"tf_frame": "target_green_cylinder", "default_pos": (0.274, 0.018), "default_yaw": 0.0, "dims": (0.03, 0.03, 0.03), "color": [0.0, 1.0, 0.0], "type": Marker.CYLINDER, "id": 3}
}

# Statische Szene (aus der URDF extrahiert)
# Dimensions für Zylinder in Rviz: (Durchmesser_X, Durchmesser_Y, Höhe_Z)
SCENE_MARKERS = [
    # Arbeitsbereich als weiße Kreislinie (Radius 0.44)
    {"id": 10, "type": Marker.LINE_LIST, "radius": 0.44, "pos": (0.0, 0.0, -0.004), "dims": (0.001, 0.0, 0.0), "color": [1.0, 1.0, 1.0, 1.0]}, 
    # Template Plane (Weiß, gesteuert über TF Tuner, mit statischem Fallback)
    {"id": 14, "type": Marker.CUBE, "tf_frame": "target_white_plane", "default_pos": (0.22, 0.0, -0.003), "default_yaw": 0.0, "dims": (0.2, 0.3, 0.001), "color": [1.0, 1.0, 1.0, 1.0]}
]

# =========================================================

class DynamicSceneMarkerPublisher(Node):
    """
    Knoten für dynamische Visualisierungen:
    - Überwacht den Roboter-Endeffektor und steuert interaktive Marker-Zustände.
    - Rendert zudem die statischen Szenenelemente.
    """
    def __init__(self):
        super().__init__('fixed_marker_publisher')
        
        # Publisher für optische Overlays
        self.publisher_ = self.create_publisher(MarkerArray, 'visualization_marker_array', 10)
        
        # Update-Loop (2 Hz / alle 0.5 Sek)
        self.timer_ = self.create_timer(0.5, self.update_scene)
        
        # TF-Infrastruktur für Greifer-Tracking
        self.tf_buffer = tf2_ros.Buffer()
        self.tf_listener = tf2_ros.TransformListener(self.tf_buffer, self)
        
        # State für Fallbacks
        self.last_known_poses = {}
        
        from std_msgs.msg import Float32MultiArray
        self.safe_x = 0.0
        self.safe_y = 0.0
        self.safe_radius = 0.20
        self.safety_sub = self.create_subscription(
            Float32MultiArray,
            '/ui/safety_zone_params',
            self.safety_cb,
            10
        )
        
        self.get_logger().info('Dynamischer Marker-Publisher erfolgreich aktiv.')

    def safety_cb(self, msg):
        if len(msg.data) >= 3:
            self.safe_x = msg.data[0]
            self.safe_y = msg.data[1]
            self.safe_radius = msg.data[2]

    # ---------------------------------------------------------
    # GEOMETRIE-BERECHNUNGEN (LINIENZÜGE)
    # ---------------------------------------------------------
    def create_marker(self, id, marker_type, position, scale, color, orientation=None, namespace="dynamic_overlays", points=None, frame_id=TARGET_FRAME):
        marker = Marker()
        marker.header.frame_id = frame_id
        # Setze den Zeitstempel absichtlich auf 0 (Time().to_msg()), damit RViz IMMER die 
        # neueste verfügbare TF nimmt und die Marker nicht ausblendet ("flickering"), 
        # wenn der TF-Baum minimal asynchron zur Systemzeit ist.
        marker.header.stamp = rclpy.time.Time().to_msg()
        marker.ns = namespace 
        marker.id = id
        marker.type = marker_type
        marker.action = Marker.ADD
        marker.pose.position.x, marker.pose.position.y, marker.pose.position.z = position
        marker.pose.orientation = orientation if orientation else Quaternion(x=0.0, y=0.0, z=0.0, w=1.0)
        marker.scale.x, marker.scale.y, marker.scale.z = scale
        if points: 
            marker.points = points
        marker.color.r, marker.color.g, marker.color.b, marker.color.a = color
        return marker

    def calculate_3d_box_lines(self, dim_x, dim_y, dim_z):
        points = []
        hx, hy = dim_x / 2.0, dim_y / 2.0
        
        # Bottom corners
        cb = [(hx, hy, 0.0), (hx, -hy, 0.0), (-hx, -hy, 0.0), (-hx, hy, 0.0)]
        # Top corners
        ct = [(hx, hy, dim_z), (hx, -hy, dim_z), (-hx, -hy, dim_z), (-hx, hy, dim_z)]
        
        for i in range(4):
            # Bottom edges
            p1, p2 = cb[i], cb[(i + 1) % 4]
            points.append(Point(x=p1[0], y=p1[1], z=p1[2]))
            points.append(Point(x=p2[0], y=p2[1], z=p2[2]))
            # Top edges
            p1, p2 = ct[i], ct[(i + 1) % 4]
            points.append(Point(x=p1[0], y=p1[1], z=p1[2]))
            points.append(Point(x=p2[0], y=p2[1], z=p2[2]))
            # Vertical edges
            p1, p2 = cb[i], ct[i]
            points.append(Point(x=p1[0], y=p1[1], z=p1[2]))
            points.append(Point(x=p2[0], y=p2[1], z=p2[2]))
            
        return points

    def calculate_3d_cylinder_lines(self, radius, height, num_segments=20):
        points = []
        # Bottom circle
        for i in range(num_segments):
            a1, a2 = 2*math.pi*i/num_segments, 2*math.pi*(i+1)/num_segments
            points.append(Point(x=radius*math.cos(a1), y=radius*math.sin(a1), z=0.0))
            points.append(Point(x=radius*math.cos(a2), y=radius*math.sin(a2), z=0.0))
        # Top circle
        for i in range(num_segments):
            a1, a2 = 2*math.pi*i/num_segments, 2*math.pi*(i+1)/num_segments
            points.append(Point(x=radius*math.cos(a1), y=radius*math.sin(a1), z=height))
            points.append(Point(x=radius*math.cos(a2), y=radius*math.sin(a2), z=height))
        # Vertical edges
        for i in range(4):
            a = 2*math.pi*i/4
            points.append(Point(x=radius*math.cos(a), y=radius*math.sin(a), z=0.0))
            points.append(Point(x=radius*math.cos(a), y=radius*math.sin(a), z=height))
        return points

    def calculate_cylinder_lines(self, radius, num_segments=20):
        points = []
        for i in range(num_segments):
            a1, a2 = 2*math.pi*i/num_segments, 2*math.pi*(i+1)/num_segments
            points.append(Point(x=radius*math.cos(a1), y=radius*math.sin(a1), z=0.0))
            points.append(Point(x=radius*math.cos(a2), y=radius*math.sin(a2), z=0.0))
        return points

    # ---------------------------------------------------------
    # PERIODISCHER UPDATE-CYCLE
    # ---------------------------------------------------------
    def update_scene(self):
        marker_array = MarkerArray()
        
        # 1. Interaktive Hohlkörper zeichnen
        for config in CONFIG.values():
            obj_id = config["id"]
            tf_frame = config.get("tf_frame")
            color_rgb = config["color"]
            
            if obj_id not in self.last_known_poses:
                self.last_known_poses[obj_id] = {
                    'x': config["default_pos"][0],
                    'y': config["default_pos"][1],
                    'z': OBJECT_LINE_Z,
                    'yaw': config["default_yaw"]
                }
            
            if tf_frame:
                try:
                    t = self.tf_buffer.lookup_transform(TARGET_FRAME, tf_frame, rclpy.time.Time())
                    self.last_known_poses[obj_id]['x'] = t.transform.translation.x
                    self.last_known_poses[obj_id]['y'] = t.transform.translation.y
                    self.last_known_poses[obj_id]['z'] = t.transform.translation.z + OBJECT_LINE_Z
                    q = t.transform.rotation
                    self.last_known_poses[obj_id]['yaw'] = math.atan2(2.0*(q.w*q.z + q.x*q.y), 1.0 - 2.0*(q.y*q.y + q.z*q.z))
                except TransformException:
                    pass

            x = self.last_known_poses[obj_id]['x']
            y = self.last_known_poses[obj_id]['y']
            z = self.last_known_poses[obj_id]['z']
            yaw = self.last_known_poses[obj_id]['yaw']

            rot_q = Quaternion(x=0.0, y=0.0, z=math.sin(yaw/2.0), w=math.cos(yaw/2.0))

            if config["type"] == Marker.CUBE:
                pts = self.calculate_3d_box_lines(config["dims"][0], config["dims"][1], config["dims"][2])
                m = self.create_marker(obj_id, Marker.LINE_LIST, (x, y, z), 
                                      (LINE_THICKNESS, 0.0, 0.0), color_rgb+[0.3], 
                                      rot_q, namespace="hollow_objects", points=pts, frame_id=TARGET_FRAME)
                
                # Solid face marker
                z_solid = z + (config["dims"][2] / 2.0)
                m_solid = self.create_marker(obj_id + 100, Marker.CUBE, (x, y, z_solid), 
                                            config["dims"], color_rgb+[0.2], 
                                            rot_q, namespace="solid_objects", frame_id=TARGET_FRAME)
                                            
            elif config["type"] == Marker.CYLINDER:
                pts = self.calculate_3d_cylinder_lines(config["dims"][0]/2.0, config["dims"][2])
                m = self.create_marker(obj_id, Marker.LINE_LIST, (x, y, z), 
                                      (LINE_THICKNESS, 0.0, 0.0), color_rgb+[0.3], 
                                      rot_q, namespace="hollow_objects", points=pts, frame_id=TARGET_FRAME)
                
                # Solid face marker
                z_solid = z + (config["dims"][2] / 2.0)
                m_solid = self.create_marker(obj_id + 100, Marker.CYLINDER, (x, y, z_solid), 
                                            config["dims"], color_rgb+[0.2], 
                                            rot_q, namespace="solid_objects", frame_id=TARGET_FRAME)
                
            marker_array.markers.append(m)
            marker_array.markers.append(m_solid)

        # 2. Statische Szene (Flächen, Ständer, Blöcke) zeichnen
        for scene_obj in SCENE_MARKERS:
            obj_id = scene_obj["id"]
            pts = None
            if scene_obj.get("type") == Marker.LINE_LIST and "radius" in scene_obj:
                pts = self.calculate_cylinder_lines(scene_obj["radius"], 60)
                
            tf_frame = scene_obj.get("tf_frame")
            
            if obj_id not in self.last_known_poses:
                if tf_frame:
                    self.last_known_poses[obj_id] = {
                        'x': scene_obj["default_pos"][0],
                        'y': scene_obj["default_pos"][1],
                        'z': scene_obj["default_pos"][2],
                        'yaw': scene_obj.get("default_yaw", 0.0)
                    }
                else:
                    self.last_known_poses[obj_id] = {
                        'x': scene_obj["pos"][0],
                        'y': scene_obj["pos"][1],
                        'z': scene_obj["pos"][2],
                        'yaw': 0.0
                    }
            
            if tf_frame:
                try:
                    t = self.tf_buffer.lookup_transform(TARGET_FRAME, tf_frame, rclpy.time.Time())
                    self.last_known_poses[obj_id]['x'] = t.transform.translation.x
                    self.last_known_poses[obj_id]['y'] = t.transform.translation.y
                    self.last_known_poses[obj_id]['z'] = t.transform.translation.z
                    q = t.transform.rotation
                    self.last_known_poses[obj_id]['yaw'] = math.atan2(2.0*(q.w*q.z + q.x*q.y), 1.0 - 2.0*(q.y*q.y + q.z*q.z))
                except TransformException:
                    pass

            x = self.last_known_poses[obj_id]['x']
            y = self.last_known_poses[obj_id]['y']
            z = self.last_known_poses[obj_id]['z']
            yaw = self.last_known_poses[obj_id]['yaw']

            rot_q = Quaternion(x=0.0, y=0.0, z=math.sin(yaw/2.0), w=math.cos(yaw/2.0))

            m_scene = self.create_marker(
                obj_id, 
                scene_obj["type"], 
                (x, y, z), 
                scene_obj["dims"], 
                scene_obj["color"], 
                rot_q,
                namespace="static_scene",
                points=pts,
                frame_id=TARGET_FRAME
            )
            marker_array.markers.append(m_scene)

        # 3. Safety Zone Marker
        m_safe = Marker()
        m_safe.header.frame_id = TARGET_FRAME
        m_safe.header.stamp = rclpy.time.Time().to_msg()
        m_safe.ns = "safety_zone"
        m_safe.id = 0
        m_safe.type = Marker.CYLINDER
        m_safe.action = Marker.ADD
        m_safe.pose.position.x = self.safe_x
        m_safe.pose.position.y = self.safe_y
        m_safe.pose.position.z = 0.0
        m_safe.pose.orientation = Quaternion(x=0.0, y=0.0, z=0.0, w=1.0)
        m_safe.scale.x = self.safe_radius * 2.0
        m_safe.scale.y = self.safe_radius * 2.0
        m_safe.scale.z = 0.001
        m_safe.color.r = 0.0
        m_safe.color.g = 1.0
        m_safe.color.b = 0.0
        m_safe.color.a = 0.2
        marker_array.markers.append(m_safe)

        # Komplettes Paket abschicken
        self.publisher_.publish(marker_array)

def main(args=None):
    rclpy.init(args=args)
    node = DynamicSceneMarkerPublisher()
    try: 
        rclpy.spin(node)
    except KeyboardInterrupt: 
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
