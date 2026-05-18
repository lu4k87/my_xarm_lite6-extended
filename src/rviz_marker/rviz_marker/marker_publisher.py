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
OBJECT_LINE_Z = 0.005        # Höhe der Hohlkörper-Unterkante
LINE_THICKNESS = 0.002

# Konfiguration des Linien-Rasters (50mm Schritte)
GRID_RESOLUTION = 0.05       # 50 mm Schrittweite
GRID_SIZE_X = 0.7            
GRID_SIZE_Y = 1.0            
GRID_CENTER_X = 0.55         
GRID_CENTER_Y = 0.0
GRID_LINE_THICKNESS = 0.001  # 1 mm Linienstärke für RViz

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

# =========================================================

class DynamicSceneMarkerPublisher(Node):
    """
    Knoten für dynamische Visualisierungen:
    - Zeichnet das präzise Liniennetz direkt über die orange URDF-Arbeitsplatte.
    - Überwacht den Roboter-Endeffektor und steuert interaktive Marker-Zustände.
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
        
        self.get_logger().info('Dynamischer Marker- & Raster-Publisher erfolgreich aktiv.')

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

    def calculate_grid_lines(self):
        """Generiert exakte Stützpunkte für das Linienraster bündig auf Z=0.0005."""
        points = []
        z_lines = 0.0005 
        
        min_x = round((GRID_CENTER_X - (GRID_SIZE_X / 2.0)) / GRID_RESOLUTION) * GRID_RESOLUTION
        max_x = round((GRID_CENTER_X + (GRID_SIZE_X / 2.0)) / GRID_RESOLUTION) * GRID_RESOLUTION
        min_y = round((GRID_CENTER_Y - (GRID_SIZE_Y / 2.0)) / GRID_RESOLUTION) * GRID_RESOLUTION
        max_y = round((GRID_CENTER_Y + (GRID_SIZE_Y / 2.0)) / GRID_RESOLUTION) * GRID_RESOLUTION

        # Gitterlinien entlang der Y-Achse
        x = min_x
        while x <= max_x + 1e-5:
            points.append(Point(x=x, y=min_y, z=z_lines))
            points.append(Point(x=x, y=max_y, z=z_lines))
            x += GRID_RESOLUTION

        # Gitterlinien entlang der X-Achse
        y = min_y
        while y <= max_y + 1e-5:
            points.append(Point(x=min_x, y=y, z=z_lines))
            points.append(Point(x=max_x, y=y, z=z_lines))
            y += GRID_RESOLUTION

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

        # 2. Präzises Liniengitter hinzufügen
        grid_lines_pts = self.calculate_grid_lines()
        grid_lines_marker = self.create_marker(
            id=101, 
            marker_type=Marker.LINE_LIST, 
            position=(0.0, 0.0, 0.0), 
            scale=(GRID_LINE_THICKNESS, 0.0, 0.0), 
            color=[0.25, 0.25, 0.25, 1.0], # Schönes, dezentes Anthrazit-Gitter
            namespace="grid_system", 
            points=grid_lines_pts
        )
        marker_array.markers.append(grid_lines_marker)

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
