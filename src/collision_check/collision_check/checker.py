import os
os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = "1"

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Joy
import tf2_ros
import pygame
from std_msgs.msg import Float32, Float32MultiArray, String, Int8
import sys

# ANSI-Escape-Codes als globale Konstanten
HIDE_CURSOR = "\033[?25l"
SHOW_CURSOR = "\033[?25h"

class Checker(Node):
    def __init__(self):
        super().__init__("checker")

        # === GRUNDEINSTELLLUNGEN ===
        self.Z_LIMIT = 91.0 # Minimale Z-Position (mm)
        self.CAUTION_ZONE_START = 110.0 # Z-Position, ab der die Geschwindigkeit begrenzt wird (mm)
        self.CAUTION_ZONE_SPEED = 0.25 # Maximaler Geschwindigkeitsfaktor in der Caution Zone
        self.DOWN_TRIGGER_AXIS = 5 # Index des rechten Triggers (R2/RT)
        
        # === TUNING-PARAMETER ===
        self.MAX_LINEAR_VELOCITY_MM_S = 75.0 # Maximale Lineargeschw. des Roboters (Basis für Berechnung)
        self.LOOKAHEAD_TIME = 0.1 # Vorausschau-Zeit für Kollisionsprüfung (Sekunden)
        self.ACCELERATION_FACTOR = 0.9 # Abschwächungsfaktor für die voraussichtliche Geschwindigkeit

        # --- ROS2-Setup ---
        self.__sub = self.create_subscription(Joy, "/joy", self.pre_joy_callback, 10)
        
        # TF2 Setup für hardware-unabhängige Positionserfassung
        self.tf_buffer = tf2_ros.Buffer()
        self.tf_listener = tf2_ros.TransformListener(self.tf_buffer, self)
        
        self.__pub = self.create_publisher(Joy, "/joy_check", 10)
        # FINAL: Publisher für EEF-Position auf /ui/eef_position
        self.eef_pos_pub = self.create_publisher(Float32MultiArray, "/ui/eef_position", 10) 
        self.speed_sub = self.create_subscription(Float32, '/ui/robot_control/current_speed', self.speed_callback, 10)
        
        # Publisher für Kollisionsmeldung
        self.collision_pub = self.create_publisher(String, "/ui/collision_msg", 10)
        
        # Subscriber für MoveIt Servo Warnungen (3D Kollisionen)
        self.servo_status_sub = self.create_subscription(Int8, "/servo_server/status", self.servo_status_callback, 10)
        
        self.joy_cmd = Joy()
        self.current_z = 0.0
        self.current_speed_factor_from_joy = 0.5 # Startwert
        self.is_blocked_state = False 
        
        pygame.init()
        pygame.joystick.init()
        if pygame.joystick.get_count() == 0:
            self.get_logger().warn("Kein Joystick gefunden. Vibrations-Feedback ist deaktiviert.")
            self.joystick = None
        else:
            self.joystick = pygame.joystick.Joystick(0)
            self.joystick.init()
            self.get_logger().info(f"Joystick '{self.joystick.get_name()}' gefunden.")
            
        self.collision_message = "Plane Collision!"
        self.collision_cleared_message = ""

    def speed_callback(self, msg):
        """Speichert den aktuellen Geschwindigkeitsfaktor vom Joystick-Node."""
        self.current_speed_factor_from_joy = msg.data

    def servo_status_callback(self, msg):
        """Reagiert auf dynamische 3D-Kollisionswarnungen von MoveIt Servo."""
        # 3: APPROACHING COLLISION, 4: HALT: COLLISION, 5: HALT: JOINT BOUND
        if msg.data in [3, 4, 5]:
            if self.joystick:
                # Vibriere intensiv für 500ms
                self.joystick.rumble(1.0, 1.0, 500)
                self.servo_rumble_active = True
        # 0: NO_WARNING (Kollision verlassen)
        elif msg.data == 0:
            if self.joystick and getattr(self, 'servo_rumble_active', False):
                self.joystick.rumble(0.0, 0.0, 0)
                self.servo_rumble_active = False

    def check_position(self):
        """Synchrone TF2-Abfrage und Kollisionsprüfung."""
        try:
            # Hole die Transformation von link_base zu link_tcp
            trans = self.tf_buffer.lookup_transform('link_base', 'link_tcp', rclpy.time.Time())
            # TF2 liefert Meter, wir rechnen in Millimeter um
            x = trans.transform.translation.x * 1000.0
            y = trans.transform.translation.y * 1000.0
            z = trans.transform.translation.z * 1000.0
        except Exception as e:
            if self.joy_cmd: 
                self.__pub.publish(self.joy_cmd)
            # Nicht spammen, wenn TF noch nicht da ist
            # self.get_logger().warn(f"TF Fehler: {e}. Sende unveränderten Joy-Befehl.")
            return
        
        # FINAL: Veröffentlichung der EEF-Position (x, y, z)
        eef_data = Float32MultiArray()
        eef_data.data = [x, y, z] 
        self.eef_pos_pub.publish(eef_data)
        
        # --- Kollisionsprüfung ---
        
        self.current_z = z
        
        # Geschwindigkeitsbegrenzung in der Nähe des Bodens
        effective_speed_factor = self.current_speed_factor_from_joy
        if self.current_z < self.CAUTION_ZONE_START:
            effective_speed_factor = min(self.current_speed_factor_from_joy, self.CAUTION_ZONE_SPEED)

        # Der rechte Trigger (DOWN_TRIGGER_AXIS = 5) hat einen Wert von 1.0 (unbetätigt) bis -1.0 (voll betätigt).
        down_trigger_value = self.joy_cmd.axes[self.DOWN_TRIGGER_AXIS]
        is_moving_down = down_trigger_value < 1.0 
        
        block_downward_movement = False
        if is_moving_down:
            if self.current_z <= self.Z_LIMIT:
                # 1. Sofortige Kollision (bereits unter oder auf dem Limit)
                block_downward_movement = True
            else:
                # 2. Vorausschauende Kollisionsprüfung
                down_intensity = (1.0 - down_trigger_value) / 2.0 
                
                # Berechnung der Ziel-Geschwindigkeit
                target_z_velocity = self.MAX_LINEAR_VELOCITY_MM_S * effective_speed_factor * down_intensity
                effective_z_velocity = target_z_velocity * self.ACCELERATION_FACTOR
                
                # Vorausschau: Wo wäre der Endeffektor in LOOKAHEAD_TIME Sekunden?
                predicted_z = self.current_z - (effective_z_velocity * self.LOOKAHEAD_TIME)
                if predicted_z < self.Z_LIMIT:
                    block_downward_movement = True

        # Fall 1: Kollision tritt ein -> Nachricht senden UND drucken
        if block_downward_movement and not self.is_blocked_state:
            # Sende Kollisionsnachricht über ROS 2 Topic
            msg = String()
            msg.data = self.collision_message
            self.collision_pub.publish(msg)
            
            # KONSOLEN-AUSGABE 
            print(self.collision_message, end='', flush=True) 
            
            if self.joystick: self.joystick.rumble(1.0, 1.0, 1000)
            self.is_blocked_state = True

        # Fall 2: Kollision wird aufgehoben -> Freigabe-Nachricht senden UND Konsole löschen
        elif not block_downward_movement and self.is_blocked_state:
            # Sende Freigabe-Nachricht, um den Log-Eintrag zu erstellen
            msg = String()
            msg.data = self.collision_cleared_message
            self.collision_pub.publish(msg)
            
            # KONSOLEN-LÖSCHEN 
            clear_line = ' ' * (len(self.collision_message) + 5)
            print(f"\r{clear_line}\r", end='', flush=True)
            
            if self.joystick: self.joystick.rumble(0, 0, 0)
            self.is_blocked_state = False
        
        # Abschneiden des Down-Befehls, falls blockiert
        if self.is_blocked_state:
            self.joy_cmd.axes[self.DOWN_TRIGGER_AXIS] = 1.0 

        # Sende den (eventuell modifizierten) Joystick-Befehl
        self.__pub.publish(self.joy_cmd)

    def pre_joy_callback(self, msg):
        """Erster Callback, wenn ein neuer Joystick-Befehl (von /joy) eintrifft."""
        self.joy_cmd = msg
        self.check_position()

def main(args=None) -> None:
    rclpy.init(args=args)
    checker_node = Checker()
    
    # CURSOR-VERSTECKEN
    print(HIDE_CURSOR, end='', flush=True) 
    
    try:
        rclpy.spin(checker_node)
    except KeyboardInterrupt:
        pass
    finally:
        # CURSOR-ANZEIGEN
        print(SHOW_CURSOR, end='', flush=True) 
        checker_node.destroy_node()
        if pygame.joystick.get_count() > 0:
            try:
                if checker_node.joystick:
                    checker_node.joystick.quit()
            except pygame.error:
                pass 
        pygame.quit()
        rclpy.shutdown()

if __name__ == "__main__":
    main()
