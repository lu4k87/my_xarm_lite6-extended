#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import time
import math
import rclpy
from rclpy.node import Node
from std_msgs.msg import String
from visualization_msgs.msg import MarkerArray, Marker
from xarm_msgs.srv import MoveCartesian
from rclpy.callback_groups import ReentrantCallbackGroup
from rclpy.executors import MultiThreadedExecutor

class YoloGraspExecutor(Node):
    def __init__(self):
        super().__init__('yolo_grasp_executor')

        self.cb_group = ReentrantCallbackGroup()

        # Target object state
        self.target_object_name = ""
        self.latest_markers = []
        self.is_executing = False

        # Subscribers
        self.create_subscription(
            String, 
            '/ui/grasp_object_cmd', 
            self.grasp_cmd_callback, 
            10,
            callback_group=self.cb_group
        )
        self.create_subscription(
            MarkerArray, 
            '/zed/bboxes_3d', 
            self.marker_callback, 
            10,
            callback_group=self.cb_group
        )

        # Service Client for executing move
        self.move_client = self.create_client(
            MoveCartesian, 
            '/ui/execute_move_to_pose', 
            callback_group=self.cb_group
        )
        
        self.status_pub = self.create_publisher(String, '/ui/grasp_status', 10)

        self.get_logger().info("YOLO Grasp Executor ready. Listening on /ui/grasp_object_cmd")
        
    def publish_status(self, msg_str: str):
        self.get_logger().info(msg_str)
        self.status_pub.publish(String(data=msg_str))

    def marker_callback(self, msg: MarkerArray):
        # Keep the latest markers
        self.latest_markers = msg.markers

    def grasp_cmd_callback(self, msg: String):
        if self.is_executing:
            self.get_logger().warn("Already executing a grasp sequence. Ignoring command.")
            return

        self.target_object_name = msg.data.strip().lower()
        if not self.target_object_name:
            return

        self.publish_status(f"➤ Start Grasping: '{self.target_object_name}'")
        
        # Start execution in a new thread so we don't block the callback
        self.is_executing = True
        import threading
        threading.Thread(target=self.execute_grasp_sequence).start()

    def execute_grasp_sequence(self):
        try:
            # 1. Find the object in the latest markers
            target_id = None
            
            # Find the text marker matching the class name
            for marker in self.latest_markers:
                if marker.ns.startswith('yolo_labels_') and marker.type == Marker.TEXT_VIEW_FACING:
                    # The text might contain newlines or prefixes, but usually the class name is the first line or exact match
                    # Wait, in zed_yolo_3d_bbox.py, we have `tm.text = class_name` for the first label (yolo_labels_class)
                    if marker.text.strip().lower() == self.target_object_name:
                        target_id = marker.id
                        break
            
            if target_id is None:
                self.publish_status(f"❌ Error: Object '{self.target_object_name}' not found in current RViz markers.")
                return

            # Find the sphere marker with the same ID
            grasp_x, grasp_y, grasp_z = None, None, None
            for marker in self.latest_markers:
                if marker.id == target_id and marker.ns == 'yolo_object_grasp_center_point':
                    grasp_x = marker.pose.position.x
                    grasp_y = marker.pose.position.y
                    grasp_z = marker.pose.position.z
                    break

            if grasp_x is None:
                self.publish_status(f"❌ Error: Grasp center point for object '{self.target_object_name}' not found.")
                return

            self.publish_status(f"✓ Found '{self.target_object_name}' at X={grasp_x*1000.0:.1f}mm, Y={grasp_y*1000.0:.1f}mm, Z={grasp_z*1000.0:.1f}mm")

            # Wait for Move Service
            if not self.move_client.wait_for_service(timeout_sec=5.0):
                self.publish_status("❌ Error: Service /ui/execute_move_to_pose not available!")
                return

            # Roll, Pitch, Yaw for grasping from above (TCP facing downwards)
            # Typically Roll=3.14, Pitch=0.0, Yaw=0.0 or current orientation.
            # We will use 3.14, 0.0, 0.0 as standard top-down grasp.
            grasp_roll = 3.14159
            grasp_pitch = 0.0
            grasp_yaw = 0.0

            # Convert meters to mm for MoveCartesian
            target_x_mm = grasp_x * 1000.0
            target_y_mm = grasp_y * 1000.0
            # Add 2 cm (20 mm) to Z so the TCP stops above the object
            target_z_mm = (grasp_z * 1000.0) + 20.0

            safe_z_mm = 300.0

            # Step 1: Get current X, Y to move Z to 300 first
            # Wait, /ui/execute_move_to_pose takes absolute coordinates.
            # We can just ask TF for current position, or we can just send [0, 0, 0] and wait?
            # No, if we send [target_x_mm, target_y_mm, safe_z_mm], it moves diagonally.
            # The user explicitly requested: "da wo er ist, erstmal hoch und dann zum objekt"
            # So we need current X, Y.
            import tf2_ros
            tf_buffer = tf2_ros.Buffer()
            tf_listener = tf2_ros.TransformListener(tf_buffer, self)
            
            # Allow some time for TF buffer to fill
            time.sleep(1.0)
            try:
                trans = tf_buffer.lookup_transform('link_base', 'link_tcp', rclpy.time.Time())
                current_x_mm = trans.transform.translation.x * 1000.0
                current_y_mm = trans.transform.translation.y * 1000.0
            except Exception as e:
                self.publish_status(f"❌ Error: Failed to get current TCP position: {e}")
                return

            self.publish_status("➤ Phase 1: Lifting to Safe Z (300mm)")
            success = self._call_move_service(current_x_mm, current_y_mm, safe_z_mm, grasp_roll, grasp_pitch, grasp_yaw)
            if not success: 
                self.publish_status("❌ Error: Phase 1 failed.")
                return
            
            # Short pause to stabilize
            time.sleep(0.1)

            self.publish_status(f"➤ Phase 2: Moving directly to object (X={target_x_mm:.1f}, Y={target_y_mm:.1f}, Z={target_z_mm:.1f})")
            success = self._call_move_service(target_x_mm, target_y_mm, target_z_mm, grasp_roll, grasp_pitch, grasp_yaw)
            if not success: 
                self.publish_status("❌ Error: Phase 2 failed.")
                return

            self.publish_status("✓ Grasp Sequence Completed Successfully!")

        except Exception as e:
            self.publish_status(f"❌ Error executing grasp sequence: {e}")
        finally:
            self.is_executing = False

    def _call_move_service(self, x, y, z, roll, pitch, yaw) -> bool:
        req = MoveCartesian.Request()
        req.pose = [float(x), float(y), float(z), float(roll), float(pitch), float(yaw)]
        req.speed = 0.0 # Handled by the service
        req.acc = 0.0
        req.mvtime = 0.0
        
        future = self.move_client.call_async(req)
        
        # Block until the service call completes
        while rclpy.ok() and not future.done():
            time.sleep(0.1)
            
        if not future.done():
            self.get_logger().error("Move service call timed out.")
            return False
            
        res = future.result()
        if res.ret != 0:
            self.get_logger().error(f"Move failed with ret={res.ret}, message: {res.message}")
            return False
            
        return True


def main(args=None):
    rclpy.init(args=args)
    node = YoloGraspExecutor()
    executor = MultiThreadedExecutor()
    executor.add_node(node)
    try:
        executor.spin()
    except KeyboardInterrupt:
        pass
    finally:
        executor.shutdown()
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
