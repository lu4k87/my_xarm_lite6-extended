#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
import tf2_ros
from xarm_msgs.srv import SetDigitalIO

class LaserPointerNode(Node):
    def __init__(self):
        super().__init__('laser_pointer_node')
        
        self.tf_buffer = tf2_ros.Buffer()
        self.tf_listener = tf2_ros.TransformListener(self.tf_buffer, self)
        
        # Client to turn on/off the digital output on the gripper (TGPIO)
        self.io_client = self.create_client(SetDigitalIO, '/xarm/set_tgpio_digital')
        
        # State tracking to avoid spamming the service
        self.laser_on = False
        self.current_state = None  # None means unknown

        # Wait for the service to be available
        while not self.io_client.wait_for_service(timeout_sec=1.0):
            self.get_logger().info('Warte auf Service /xarm/set_tgpio_digital...')
            
        self.get_logger().info('Laser Pointer Node gestartet. Überwache TCP Z-Höhe...')
        
        # Timer to check TCP position at 10 Hz
        self.timer = self.create_timer(0.1, self.timer_callback)

    def set_laser(self, turn_on: bool):
        if self.current_state == turn_on:
            return  # State hasn't changed
            
        req = SetDigitalIO.Request()
        req.ionum = 0  # Tool Output 0
        req.value = 1 if turn_on else 0
        
        self.get_logger().info(f"Schalte Laser {'EIN' if turn_on else 'AUS'}")
        
        # Call asynchronously
        self.io_client.call_async(req)
        self.current_state = turn_on

    def timer_callback(self):
        try:
            # Look up transform from base to TCP
            # Using standard xArm TF names: 'link_base' and 'link_tcp'
            trans = self.tf_buffer.lookup_transform('link_base', 'link_tcp', rclpy.time.Time())
            
            z = trans.transform.translation.z
            x = trans.transform.translation.x
            y = trans.transform.translation.y
            
            # Print x and y to terminal as requested by the user
            self.get_logger().debug(f"TCP Position - X: {x:.3f}m, Y: {y:.3f}m, Z: {z:.3f}m")
            
            # Condition: Z <= 50 mm (0.05 meters)
            if z <= 0.05:
                self.set_laser(True)
            else:
                self.set_laser(False)
                
        except tf2_ros.LookupException as e:
            self.get_logger().debug(f"TF Lookup Exception: {e}")
        except tf2_ros.ExtrapolationException as e:
            self.get_logger().debug(f"TF Extrapolation Exception: {e}")
        except Exception as e:
            self.get_logger().error(f"Error checking TCP position: {e}")

def main(args=None):
    rclpy.init(args=args)
    node = LaserPointerNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        # Turn off laser before exiting
        if rclpy.ok():
            node.set_laser(False)
            node.destroy_node()
            rclpy.shutdown()

if __name__ == '__main__':
    main()
