import rclpy
from rclpy.node import Node
from trajectory_msgs.msg import JointTrajectory, JointTrajectoryPoint
import math
import time

class CircleDanceNode(Node):
    def __init__(self):
        super().__init__('lite6_circle_dance')
        # Publisher für das exakt gleiche Topic, das du in der Konsole genutzt hast
        self.publisher = self.create_publisher(
            JointTrajectory, 
            '/lite6_traj_controller/joint_trajectory', 
            10
        )
        self.joint_names = ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6']
        self.duration_sec = 10.0  # Dauer für einen vollen Kreisdurchlauf
        self.steps = 50           # Anzahl der Wegpunkte pro Durchlauf (Auflösung)

    def publish_trajectory(self):
        msg = JointTrajectory()
        msg.joint_names = self.joint_names
        points = []

        for i in range(self.steps + 1):
            # Berechne die aktuelle Zeit t innerhalb des Durchlaufs
            t = (i / self.steps) * self.duration_sec
            point = JointTrajectoryPoint()

            # Sinus und Kosinus für flüssige Kreisbewegung
            # joint1 schwingt sanft nach links und rechts (Amplitude: 0.5 rad)
            j1 = 0.5 * math.sin(t * (2 * math.pi / self.duration_sec))
            
            # joint2 schwingt leicht versetzt (Kosinus), Basisposition bei -0.2 rad
            j2 = -0.2 + 0.3 * math.cos(t * (2 * math.pi / self.duration_sec))
            
            # joint3 bleibt als Puffer starr auf 0.5 rad (leicht angewinkelt)
            j3 = 0.5
            
            point.positions = [j1, j2, j3, 0.0, 0.0, 0.0]
            
            # Exakten Zeitstempel für diesen Wegpunkt berechnen
            sec = int(t)
            nanosec = int((t - sec) * 1e9)
            point.time_from_start.sec = sec
            point.time_from_start.nanosec = nanosec
            
            points.append(point)

        msg.points = points
        self.get_logger().info('Sende nächste Kreis-Trajektorie (10 Sekunden)...')
        self.publisher.publish(msg)

def main(args=None):
    rclpy.init(args=args)
    node = CircleDanceNode()

    try:
        while rclpy.ok():
            node.publish_trajectory()
            # Wir lassen das Skript fast die vollen 10 Sekunden warten, 
            # bevor der nächste "Kreis" gesendet wird, damit die Bewegung nahtlos bleibt.
            time.sleep(node.duration_sec)
            
    except KeyboardInterrupt:
        node.get_logger().info('Bewegung durch Benutzer gestoppt.')
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
