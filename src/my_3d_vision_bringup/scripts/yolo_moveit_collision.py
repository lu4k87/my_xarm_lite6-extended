#!/usr/bin/env python3

import rclpy
import math
from rclpy.node import Node
from visualization_msgs.msg import MarkerArray, Marker
from moveit_msgs.msg import CollisionObject
from shape_msgs.msg import SolidPrimitive
from geometry_msgs.msg import Pose
from std_msgs.msg import String
from tf2_ros import Buffer, TransformListener

class YoloMoveitCollision(Node):
    def __init__(self):
        super().__init__('yolo_moveit_collision')

        # Subscriber to the existing YOLO 3D BBox MarkerArray
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
        # RViz subscribes to this when the user enables the Display
        self.pub_collision_toggle = self.create_publisher(
            MarkerArray,
            '/ui/yolo_collision_toggle',
            10
        )

        self.was_active = False
        self.known_objects = set()
        self.ignored_objects = {}
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

        # End effector links that are allowed to collide with the objects
        # Dies erlaubt das Greifen von oben!
        self.eef_links = [
            'link5', 'link6', 'link_eef',
            'uflite_vacuum_gripper_link', 'uflite_gripper_link',
            'vacuum_gripper_link', 'lite_gripper_link', 'other_geometry_link'
        ]

        self.get_logger().info('YOLO MoveIt Collision Node gestartet. Warte auf RViz Toggle...')

    def ignore_callback(self, msg):
        obj_name = msg.data.strip()
        if obj_name:
            current_time = self.get_clock().now().nanoseconds / 1e9
            self.ignored_objects[obj_name] = {'state': 'WAITING', 'timestamp': current_time}
            self.get_logger().info(f'Ignoriere Kollisionsobjekt: {obj_name} (Warte auf Annäherung)')
            
            # Immediately remove it if it was known
            if obj_name in self.known_objects:
                co = CollisionObject()
                co.id = obj_name
                co.operation = CollisionObject.REMOVE
                self.pub_collision_object.publish(co)
                self.known_objects.remove(obj_name)

    def remove_all_objects(self):
        for obj_name in self.known_objects:
            co = CollisionObject()
            co.id = obj_name
            co.operation = CollisionObject.REMOVE
            self.pub_collision_object.publish(co)
            
        self.known_objects.clear()
        self.get_logger().info('Kollisions-Toggle in RViz deaktiviert. Alle YOLO-Objekte aus MoveIt entfernt.')

    def marker_callback(self, msg):
        # Check if user has enabled the toggle in RViz
        is_active = self.pub_collision_toggle.get_subscription_count() > 0

        current_time = self.get_clock().now().nanoseconds / 1e9
        
        # Get TCP position
        tcp_x, tcp_y, tcp_z = None, None, None
        try:
            trans = self.tf_buffer.lookup_transform('link_base', 'link_tcp', rclpy.time.Time())
            tcp_x = trans.transform.translation.x
            tcp_y = trans.transform.translation.y
            tcp_z = trans.transform.translation.z
        except Exception:
            pass

        if not is_active:
            if self.was_active:
                self.remove_all_objects()
                self.was_active = False
            return

        if not self.was_active:
            self.get_logger().info('Kollisions-Toggle in RViz aktiviert. Sende YOLO-Objekte an MoveIt...')
            self.was_active = True

        # Parse MarkerArray
        objects_dict = {}
        
        for marker in msg.markers:
            if marker.action == Marker.DELETEALL:
                continue

            obj_id = marker.id
            if obj_id not in objects_dict:
                objects_dict[obj_id] = {'name': f'yolo_obj_{obj_id}', 'points': [], 'frame_id': marker.header.frame_id}

            if marker.ns == 'yolo_labels_class' and marker.type == Marker.TEXT_VIEW_FACING:
                objects_dict[obj_id]['name'] = f"{marker.text}_{obj_id}"
            elif marker.ns == 'yolo_bboxes' and marker.type == Marker.LINE_LIST:
                objects_dict[obj_id]['points'] = marker.points

        if not objects_dict:
            # Wenn keine Objekte mehr da sind, aber wir noch welche kennen -> alle löschen!
            if self.known_objects:
                for obj_name in self.known_objects:
                    co = CollisionObject()
                    co.id = obj_name
                    co.operation = CollisionObject.REMOVE
                    self.pub_collision_object.publish(co)
                self.known_objects.clear()
            return

        vis_markers = MarkerArray()
        current_objects = set()

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
            
            scale_x = max(0.01, max_x - min_x)
            scale_y = max(0.01, max_y - min_y)
            scale_z = max(0.01, max_z - min_z)
            
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
                        if dist < 0.05: # TCP arrived near the object (5cm)
                            self.ignored_objects[obj_name]['state'] = 'INSIDE'
                            self.get_logger().info(f"TCP nahe an {obj_name} (< 5cm). State -> INSIDE")
                        elif (current_time - ign_info['timestamp']) > 20.0: # Timeout 20s
                            msg_str = f"⚠️ Timeout: Kollision für {obj_name} wieder aktiv"
                            self.get_logger().info(msg_str)
                            self.pub_status.publish(String(data=msg_str))
                            del self.ignored_objects[obj_name]
                            
                    elif ign_info['state'] == 'INSIDE':
                        if dist > 0.10: # TCP moved away (10cm)
                            msg_str = f"➤ TCP hat {obj_name} verlassen (> 10cm). Kollision wieder aktiv."
                            self.get_logger().info(msg_str)
                            self.pub_status.publish(String(data=msg_str))
                            del self.ignored_objects[obj_name]
                            
                # If still ignored (not deleted above), skip collision generation
                if obj_name in self.ignored_objects:
                    continue
            
            current_objects.add(obj_name)
            
            # --- 1. Collision Object for MoveIt ---
            co = CollisionObject()
            co.header.frame_id = data['frame_id']
            co.id = obj_name
            co.operation = CollisionObject.ADD
            
            box = SolidPrimitive()
            box.type = SolidPrimitive.BOX
            box.dimensions = [scale_x, scale_y, scale_z]
            
            pose = Pose()
            pose.position.x = center_x
            pose.position.y = center_y
            pose.position.z = center_z
            pose.orientation.w = 1.0
            
            co.primitives.append(box)
            co.primitive_poses.append(pose)
            
            # Throttle updates: only publish if object is new or time expired
            now = self.get_clock().now()
            time_since_last = (now - self.last_publish_time).nanoseconds / 1e9
            if (obj_name not in self.known_objects) or (time_since_last >= 0.5):
                self.pub_collision_object.publish(co)
                self.last_publish_time = now
            
            # --- 2. Visual Marker for RViz ---
            vm = Marker()
            vm.header.frame_id = data['frame_id']
            vm.header.stamp = self.get_clock().now().to_msg()
            vm.ns = 'yolo_collision_vis'
            vm.id = obj_id
            vm.type = Marker.CUBE
            vm.action = Marker.ADD
            vm.pose = pose
            vm.scale.x = scale_x
            vm.scale.y = scale_y
            vm.scale.z = scale_z
            vm.color.r = 1.0
            vm.color.g = 0.0
            vm.color.b = 0.0
            vm.color.a = 0.3 # Transparent red
            vm.lifetime.sec = 0
            vm.lifetime.nanosec = int(500 * 1e6)
            vis_markers.markers.append(vm)

        # Remove objects that are no longer detected
        objects_to_remove = self.known_objects - current_objects
        for obj_name in objects_to_remove:
            co = CollisionObject()
            co.id = obj_name
            co.operation = CollisionObject.REMOVE
            self.pub_collision_object.publish(co)
        
        self.known_objects = current_objects
        
        # Always publish an empty marker array with DELETEALL to clean up if needed
        # But here we just publish the valid markers.
        if vis_markers.markers:
            self.pub_collision_toggle.publish(vis_markers)

def main(args=None):
    rclpy.init(args=args)
    node = YoloMoveitCollision()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
