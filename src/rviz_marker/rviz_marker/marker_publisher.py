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
LINE_THICKNESS = 0.002

# Frames und interaktive Schwellenwerte
EEF_FRAME = 'link_eef'      
TARGET_FRAME = 'link_base'  
POSITION_TOLERANCE = 0.01   # 10 mm Trigger-Radius für Farbumschlag

# Bunte Hohlkörper-Ziele
CONFIG = {
    "BLUE_CUBE": {"pos": (0.274, 0.082), "dims": (0.03, 0.03), "color": [0.0, 0.0, 1.0], "type": Marker.CUBE, "id": 1}, 
    "RED_RECTANGLE": {"pos": (0.319, -0.083), "dims": (0.03, 0.06), "color": [1.0, 0.0, 0.0], "type": Marker.CUBE, "id": 2}, 
    "GREEN_CYLINDER": {"pos": (0.374, 0.018), "dims": (0.03, 0.03), "color": [0.0, 1.0, 0.0], "type": Marker.CYLINDER, "id": 3}
}

# Statische Szene (aus der URDF extrahiert)
# Dimensions für Zylinder in Rviz: (Durchmesser_X, Durchmesser_Y, Höhe_Z)
SCENE_MARKERS = [
    # Arbeitsbereich als weiße Kreislinie (Radius 0.44)
    {"id": 10, "type": Marker.LINE_LIST, "radius": 0.44, "pos": (0.0, 0.0, -0.004), "dims": (0.001, 0.0, 0.0), "color": [1.0, 1.0, 1.0, 1.0]}, 
    # ZED Camera Stand (Aluminium)
    {"id": 11, "type": Marker.CUBE, "pos": (0.5, 0.5, 0.19), "dims": (0.02, 0.02, 0.38), "color": [0.7, 0.7, 0.7, 1.0]}, 
    # Template Plane (Aluminium)
    {"id": 14, "type": Marker.CUBE, "pos": (0.32, 0.0, -0.003), "dims": (0.2, 0.3, 0.001), "color": [0.7, 0.7, 0.7, 1.0]},
    # Wand Links (y = 2.0)
    {"id": 15, "type": Marker.CUBE, "pos": (0.0, 2.0, 1.0), "dims": (4.0, 0.02, 2.0), "color": [1.0, 1.0, 1.0, 1.0]},
    # Wand Rechts (y = -2.0)
    {"id": 16, "type": Marker.CUBE, "pos": (0.0, -2.0, 1.0), "dims": (4.0, 0.02, 2.0), "color": [1.0, 1.0, 1.0, 1.0]},
    # Wand Vorne (x = 2.0)
    {"id": 17, "type": Marker.CUBE, "pos": (2.0, 0.0, 1.0), "dims": (0.02, 4.0, 2.0), "color": [1.0, 1.0, 1.0, 1.0]},
    # Boden (Fläche zwischen den Wänden)
    {"id": 18, "type": Marker.CUBE, "pos": (0.0, 0.0, -0.005), "dims": (4.0, 4.0, 0.001), "color": [0.0, 0.0, 0.0, 1.0]}
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
        
        self.get_logger().info('Dynamischer Marker-Publisher erfolgreich aktiv.')

    # ---------------------------------------------------------
    # GEOMETRIE-BERECHNUNGEN (LINIENZÜGE)
    # ---------------------------------------------------------
    def create_marker(self, id, marker_type, position, scale, color, orientation=None, namespace="dynamic_overlays", points=None):
        marker = Marker()
        marker.header.frame_id = TARGET_FRAME
        marker.header.stamp = self.get_clock().now().to_msg()
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

    def calculate_box_lines(self, dim_x, dim_y):
        points = []
        hx, hy = dim_x / 2.0, dim_y / 2.0
        corners = [(hx, hy), (hx, -hy), (-hx, -hy), (-hx, hy)]
        for i in range(4):
            p1, p2 = corners[i], corners[(i + 1) % 4]
            points.append(Point(x=p1[0], y=p1[1], z=0.0))
            points.append(Point(x=p2[0], y=p2[1], z=0.0))
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
        eef_pose = None
        
        try:
            transform = self.tf_buffer.lookup_transform(TARGET_FRAME, EEF_FRAME, rclpy.time.Time())
            eef_pose = transform.transform.translation
        except TransformException: 
            pass 

        # Orientierung für das schräge rote Rechteck (-45° um Z)
        angle_rad = -math.pi / 4.0
        rot_q = Quaternion(x=0.0, y=0.0, z=math.sin(angle_rad/2.0), w=math.cos(angle_rad/2.0))

        # 1. Interaktive Hohlkörper zeichnen
        for config in CONFIG.values():
            x, y = config["pos"]
            color_rgb = config["color"]

            if config["type"] == Marker.CUBE:
                pts = self.calculate_box_lines(config["dims"][0], config["dims"][1])
                m = self.create_marker(config["id"], Marker.LINE_LIST, (x, y, OBJECT_LINE_Z), 
                                      (LINE_THICKNESS, 0.0, 0.0), color_rgb+[1.0], 
                                      rot_q if config["id"]==2 else None, namespace="hollow_objects", points=pts)
            elif config["type"] == Marker.CYLINDER:
                pts = self.calculate_cylinder_lines(config["dims"][0]/2.0)
                m = self.create_marker(config["id"], Marker.LINE_LIST, (x, y, OBJECT_LINE_Z), 
                                      (LINE_THICKNESS, 0.0, 0.0), color_rgb+[1.0], None, namespace="hollow_objects", points=pts)
            marker_array.markers.append(m)

        # 2. Statische Szene (Flächen, Ständer, Blöcke) zeichnen
        for scene_obj in SCENE_MARKERS:
            pts = None
            if scene_obj.get("type") == Marker.LINE_LIST and "radius" in scene_obj:
                pts = self.calculate_cylinder_lines(scene_obj["radius"], 60)
                
            m_scene = self.create_marker(
                scene_obj["id"], 
                scene_obj["type"], 
                scene_obj["pos"], 
                scene_obj["dims"], 
                scene_obj["color"], 
                namespace="static_scene",
                points=pts
            )
            marker_array.markers.append(m_scene)

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
