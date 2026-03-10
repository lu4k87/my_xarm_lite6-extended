import rclpy
from rclpy.node import Node
from visualization_msgs.msg import Marker, MarkerArray 
from geometry_msgs.msg import Point, Quaternion, Pose
import math
import tf2_ros 
from tf2_ros import TransformException 

# MoveIt-Bibliotheken für physische Hindernisse
from moveit_msgs.msg import CollisionObject
from shape_msgs.msg import SolidPrimitive

# =========================================================
# GLOBALE KONSTANTEN
# =========================================================
# Maße für die Bodenplatte und Linien
PLANE_THICKNESS = 0.005
HALF_PLANE_THICKNESS = PLANE_THICKNESS / 2.0 
PLANE_Z_CENTER = HALF_PLANE_THICKNESS 
OBJECT_LINE_Z = PLANE_THICKNESS
LINE_THICKNESS = 0.002

# Größe und Position der Schablonen-Bodenplatte
PLANE_SIZE_X = 0.2                          
PLANE_SIZE_Y = 0.3                          
PLANE_START_X = 0.22                         
PLANE_POS_X = PLANE_START_X + (PLANE_SIZE_X / 2.0) 

# Rasterplatte (50mm Raster)
GRID_RESOLUTION = 0.05       # 50 mm
GRID_SIZE_X = 0.7            # 300 mm kürzer in X-Richtung (vorher 1.0)
GRID_SIZE_Y = 1.0            # 1 Meter breit
GRID_CENTER_X = 0.55         # Um 300 mm nach vorne verschoben (vorher 0.25)
GRID_CENTER_Y = 0.0
GRID_PLATE_THICKNESS = 0.01
GRID_Z_LEVEL = -(GRID_PLATE_THICKNESS / 2.0) # Top-Oberfläche liegt bündig auf Z=0
GRID_LINE_THICKNESS = 0.001  # Halb so dick (1 mm)

# Roboter-Frames und Toleranzen
EEF_FRAME = 'link_eef'      # Greifer/Endeffektor
TARGET_FRAME = 'link_base'  # Ursprung/Basis des Roboters
POSITION_TOLERANCE = 0.01   # Toleranz für Farbumschlag
PLANE_COLOR_RGB_DEFAULT = [0.7, 0.7, 0.7]

# Definition der bunten Ziel-Objekte (Hohlkörper)
CONFIG = {
    "BLUE_CUBE": {"pos": (0.274, 0.082), "dims": (0.03, 0.03), "color": [0.0, 0.0, 1.0], "type": Marker.CUBE, "id": 1}, 
    "RED_RECTANGLE": {"pos": (0.319, -0.083), "dims": (0.03, 0.06), "color": [1.0, 0.0, 0.0], "type": Marker.CUBE, "id": 2}, 
    "GREEN_CYLINDER": {"pos": (0.374, 0.018), "dims": (0.03, 0.03), "color": [0.0, 1.0, 0.0], "type": Marker.CYLINDER, "id": 3}
}

# =========================================================

class FixedMarkerAndCollisionPublisher(Node):
    """
    Hauptknoten:
    - Sendet optische Marker an RViz (inkl. exaktem Raster).
    - Sendet physische Hindernisse an MoveIt.
    """
    def __init__(self):
        super().__init__('fixed_marker_publisher')
        
        # Publisher einrichten
        self.publisher_ = self.create_publisher(MarkerArray, 'visualization_marker_array', 10)
        self.collision_pub = self.create_publisher(CollisionObject, '/collision_object', 10)
        
        # Endlosschleife: Alle 0,5 Sekunden die Szene aktualisieren
        self.timer_ = self.create_timer(0.5, self.update_scene)
        
        # TF-Listener zum Auslesen der Roboterposition
        self.tf_buffer = tf2_ros.Buffer()
        self.tf_listener = tf2_ros.TransformListener(self.tf_buffer, self)
        
        self.get_logger().info('Marker, Raster & Kollisionsobjekt gestartet.')

    def publish_collision_block(self):
        """MoveIt-Kollisionsobjekt senden."""
        obj = CollisionObject()
        obj.header.frame_id = TARGET_FRAME
        obj.header.stamp = self.get_clock().now().to_msg()
        obj.id = "extra_kollisions_block"
        
        primitive = SolidPrimitive()
        primitive.type = SolidPrimitive.BOX
        primitive.dimensions = [0.01, 0.01, 0.1]
        
        pose = Pose()
        pose.position.x = 0.35
        pose.position.y = 0.0
        pose.position.z = 0.05 + PLANE_THICKNESS
        
        obj.primitives.append(primitive)
        obj.primitive_poses.append(pose)
        obj.operation = CollisionObject.ADD
        
        self.collision_pub.publish(obj)

    # ---------------------------------------------------------
    # HILFSFUNKTIONEN FÜR OPTISCHE MARKER
    # ---------------------------------------------------------
    def create_marker(self, id, marker_type, position, scale, color, orientation=None, frame_id=TARGET_FRAME, namespace="plane_markers", points=None):
        marker = Marker()
        marker.header.frame_id = frame_id
        marker.header.stamp = self.get_clock().now().to_msg()
        marker.ns = namespace 
        marker.id = id
        marker.type = marker_type
        marker.action = Marker.ADD
        marker.pose.position.x, marker.pose.position.y, marker.pose.position.z = position
        marker.pose.orientation = orientation if orientation else Quaternion(x=0.0, y=0.0, z=0.0, w=1.0)
        marker.scale.x, marker.scale.y, marker.scale.z = scale
        if points: marker.points = points
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
        """Berechnet exakte Punkte für ein 50mm-Raster relativ zum Roboter-Ursprung (0,0)."""
        points = []
        z_lines = 0.0005 
        
        # Auf exakte Vielfache der Resolution runden, damit Linien streng auf Vielfachen von 0.05 liegen
        min_x = round((GRID_CENTER_X - (GRID_SIZE_X / 2.0)) / GRID_RESOLUTION) * GRID_RESOLUTION
        max_x = round((GRID_CENTER_X + (GRID_SIZE_X / 2.0)) / GRID_RESOLUTION) * GRID_RESOLUTION
        min_y = round((GRID_CENTER_Y - (GRID_SIZE_Y / 2.0)) / GRID_RESOLUTION) * GRID_RESOLUTION
        max_y = round((GRID_CENTER_Y + (GRID_SIZE_Y / 2.0)) / GRID_RESOLUTION) * GRID_RESOLUTION

        # Vertikale Linien
        x = min_x
        while x <= max_x + 1e-5: # 1e-5 Toleranz für Fließkomma-Fehler
            points.append(Point(x=x, y=min_y, z=z_lines))
            points.append(Point(x=x, y=max_y, z=z_lines))
            x += GRID_RESOLUTION

        # Horizontale Linien
        y = min_y
        while y <= max_y + 1e-5:
            points.append(Point(x=min_x, y=y, z=z_lines))
            points.append(Point(x=max_x, y=y, z=z_lines))
            y += GRID_RESOLUTION

        return points

    # ---------------------------------------------------------
    # HAUPTSCHLEIFE
    # ---------------------------------------------------------
    def update_scene(self):
        self.publish_collision_block()
        
        marker_array = MarkerArray()
        eef_pose = None
        
        try:
            transform = self.tf_buffer.lookup_transform(TARGET_FRAME, EEF_FRAME, rclpy.time.Time())
            eef_pose = transform.transform.translation
        except TransformException: pass 

        current_plane_color = PLANE_COLOR_RGB_DEFAULT 
        angle_rad = -math.pi / 4.0
        rot_q = Quaternion(x=0.0, y=0.0, z=math.sin(angle_rad/2.0), w=math.cos(angle_rad/2.0))

        for config in CONFIG.values():
            x, y = config["pos"]
            
            if eef_pose and current_plane_color == PLANE_COLOR_RGB_DEFAULT:
                if math.sqrt((eef_pose.x - x)**2 + (eef_pose.y - y)**2) <= POSITION_TOLERANCE:
                    current_plane_color = config["color"]

            if config["type"] == Marker.CUBE:
                pts = self.calculate_box_lines(config["dims"][0], config["dims"][1])
                m = self.create_marker(config["id"], Marker.LINE_LIST, (x, y, OBJECT_LINE_Z), 
                                      (LINE_THICKNESS, 0.0, 0.0), config["color"]+[1.0], 
                                      rot_q if config["id"]==2 else None, namespace="hollow_objects", points=pts)
            elif config["type"] == Marker.CYLINDER:
                pts = self.calculate_cylinder_lines(config["dims"][0]/2.0)
                m = self.create_marker(config["id"], Marker.LINE_LIST, (x, y, OBJECT_LINE_Z), 
                                      (LINE_THICKNESS, 0.0, 0.0), config["color"]+[1.0], None, namespace="hollow_objects", points=pts)
            marker_array.markers.append(m)

        plane = self.create_marker(0, Marker.CUBE, (PLANE_POS_X, 0.0, PLANE_Z_CENTER), 
                                  (PLANE_SIZE_X, PLANE_SIZE_Y, PLANE_THICKNESS), current_plane_color+[0.9], namespace="floor_plane")
        marker_array.markers.append(plane)
        
        visual_collision_block = self.create_marker(
            id=99, 
            marker_type=Marker.CUBE, 
            position=(0.35, 0.0, 0.05 + PLANE_THICKNESS), 
            scale=(0.01, 0.01, 0.1),                        
            color=[0.4, 0.4, 0.4, 0.8],                   
            namespace="collision_visual"
        )
        marker_array.markers.append(visual_collision_block)

        # 5. Weiße Raster-Bodenplatte
        grid_plate = self.create_marker(
            id=100, 
            marker_type=Marker.CUBE, 
            position=(GRID_CENTER_X, GRID_CENTER_Y, GRID_Z_LEVEL), 
            scale=(GRID_SIZE_X, GRID_SIZE_Y, GRID_PLATE_THICKNESS), 
            color=[1.0, 1.0, 1.0, 1.0], 
            namespace="grid_system"
        )
        marker_array.markers.append(grid_plate)

        # 6. Exakte Rasterlinien
        grid_lines_pts = self.calculate_grid_lines()
        grid_lines_marker = self.create_marker(
            id=101, 
            marker_type=Marker.LINE_LIST, 
            position=(0.0, 0.0, 0.0), 
            scale=(GRID_LINE_THICKNESS, 0.0, 0.0), 
            color=[0.3, 0.3, 0.3, 1.0], 
            namespace="grid_system", 
            points=grid_lines_pts
        )
        marker_array.markers.append(grid_lines_marker)

        self.publisher_.publish(marker_array)

def main(args=None):
    rclpy.init(args=args)
    node = FixedMarkerAndCollisionPublisher()
    try: rclpy.spin(node)
    except KeyboardInterrupt: pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
