#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Point
import ctypes
import os
import threading
import time

# --- Tobii Stream Engine C-Types Wrapper ---
class tobii_gaze_point_t(ctypes.Structure):
    _fields_ = [
        ("timestamp_us", ctypes.c_int64),
        ("validity", ctypes.c_int),
        ("position_xy", ctypes.c_float * 2)
    ]

# Callback signature
GAZE_POINT_CALLBACK = ctypes.CFUNCTYPE(None, ctypes.POINTER(tobii_gaze_point_t), ctypes.c_void_p)
URL_RECEIVER_CALLBACK = ctypes.CFUNCTYPE(None, ctypes.c_char_p, ctypes.c_void_p)

class Tobii4CPublisher(Node):
    def __init__(self):
        super().__init__('tobii_4c_publisher_node')
        self.publisher_ = self.create_publisher(Point, '/tobii/gaze', 10)
        self.get_logger().info('Tobii 4C Publisher Node gestartet.')
        
        self.tobii_lib = None
        self.api = ctypes.c_void_p()
        self.device = ctypes.c_void_p()
        
        self.is_running = True
        
        # Load Library
        lib_path = "/usr/lib/tobii/libtobii_stream_engine.so"
        if not os.path.exists(lib_path):
            self.get_logger().error(f"Bibliothek nicht gefunden: {lib_path}. Ist Tobii Stream Engine installiert?")
            return
            
        try:
            self.tobii_lib = ctypes.CDLL(lib_path)
            self._setup_tobii()
            
            # Start background thread for processing callbacks
            self.thread = threading.Thread(target=self._process_loop)
            self.thread.start()
            
        except Exception as e:
            self.get_logger().error(f"Fehler beim Initialisieren von Tobii: {e}")

    def _setup_tobii(self):
        # 1. Create API
        error = self.tobii_lib.tobii_api_create(ctypes.byref(self.api), None, None)
        if error != 0:
            raise RuntimeError(f"tobii_api_create fehlgeschlagen mit Fehlercode: {error}")
            
        # 2. Find Device URL
        self.found_url = ""
        def url_receiver(url, user_data):
            if not self.found_url:
                self.found_url = url.decode('utf-8')
        
        c_url_receiver = URL_RECEIVER_CALLBACK(url_receiver)
        error = self.tobii_lib.tobii_enumerate_local_device_urls(self.api, c_url_receiver, None)
        if error != 0 or not self.found_url:
            raise RuntimeError("Kein Tobii Eye Tracker gefunden. Ist der tobiiusbservice gestartet?")
            
        self.get_logger().info(f"Tobii Tracker gefunden unter: {self.found_url}")
        
        # 3. Create Device
        error = self.tobii_lib.tobii_device_create(self.api, self.found_url.encode('utf-8'), ctypes.byref(self.device))
        if error != 0:
            raise RuntimeError(f"tobii_device_create fehlgeschlagen mit Code: {error}")
            
        # 4. Subscribe to Gaze Point
        self.msg_count = 0
        self.last_validity = -1
        def gaze_point_callback(gaze_point_ptr, user_data):
            gaze_point = gaze_point_ptr.contents
            self.msg_count += 1
            
            # Nur loggen, wenn sich der Status ändert, oder alle ~3 Sekunden als Lebenszeichen
            if gaze_point.validity != self.last_validity or self.msg_count % 250 == 0:
                state_str = "VALID (Augen erkannt)" if gaze_point.validity == 1 else "INVALID (Augen NICHT erkannt!)"
                self.get_logger().info(f"Tracker Status: {state_str} | x: {gaze_point.position_xy[0]:.2f}, y: {gaze_point.position_xy[1]:.2f}")
                self.last_validity = gaze_point.validity
                
            msg = Point()
            if gaze_point.validity == 1: # TOBII_VALIDITY_VALID
                msg.x = float(gaze_point.position_xy[0])
                msg.y = float(gaze_point.position_xy[1])
                msg.z = 1.0
            else:
                msg.x = -1.0
                msg.y = -1.0
                msg.z = 0.0
                
            self.publisher_.publish(msg)
                
        self.c_gaze_point_callback = GAZE_POINT_CALLBACK(gaze_point_callback)
        error = self.tobii_lib.tobii_gaze_point_subscribe(self.device, self.c_gaze_point_callback, None)
        if error != 0:
            raise RuntimeError(f"tobii_gaze_point_subscribe fehlgeschlagen mit Code: {error}")
            
        self.get_logger().info("Gaze-Stream erfolgreich abonniert!")

    def _process_loop(self):
        while self.is_running and rclpy.ok():
            # Wait for callbacks (timeout slightly to allow thread to exit smoothly)
            self.tobii_lib.tobii_wait_for_callbacks(1, ctypes.byref(self.device))
            self.tobii_lib.tobii_device_process_callbacks(self.device)
            time.sleep(0.001)

    def destroy_node(self):
        self.is_running = False
        if hasattr(self, 'thread'):
            self.thread.join(timeout=1.0)
            
        if self.device:
            self.tobii_lib.tobii_gaze_point_unsubscribe(self.device)
            self.tobii_lib.tobii_device_destroy(self.device)
            
        if self.api:
            self.tobii_lib.tobii_api_destroy(self.api)
            
        super().destroy_node()

def main(args=None):
    rclpy.init(args=args)
    node = Tobii4CPublisher()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
