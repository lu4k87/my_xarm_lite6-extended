"""Startet /rosapi nur, wenn im ROS-Graphen noch keiner laeuft.

rosapi bedient den ganzen Graphen, nicht nur eine rosbridge. Starten die
Robot Control UI (rosbridge 9090) und vr_quest3_teleop (rosbridge 9091) je
einen eigenen, gibt es zwei Nodes namens /rosapi - dann haengt
/rosapi/nodes (gemessen: Timeout auch per ros2 service call). Die UI
erkennt keine Nodes mehr, und ohne Service-Threads blockiert der haengende
Aufruf die ganze rosbridge (Buttons, Topics der VR-Seite).

Der Waechter prueft jede Sekunde: fehlt /rosapi, startet er einen; taucht
daneben ein zweiter auf (z. B. die UI wird spaeter gestartet), beendet er
seinen eigenen wieder.
"""
import os
import signal
import subprocess

import rclpy
from ament_index_python.packages import get_package_prefix
from rclpy.node import Node

# Direkt das Programm, nicht "ros2 run": beim Beenden bliebe sonst der
# eigentliche rosapi_node als Waise zurueck (dann wieder zwei /rosapi).
ROSAPI_CMD = [os.path.join(get_package_prefix('rosapi'), 'lib', 'rosapi', 'rosapi_node'),
              '--ros-args', '-r', '__node:=rosapi']
START_DELAY_S = 3.0   # parallel gestarteter UI-Launch soll zuerst drankommen


class RosapiGuard(Node):
    def __init__(self):
        super().__init__('vr_rosapi_guard')
        self.proc = None
        self.started_at = self.get_clock().now()
        self.create_timer(1.0, self.check)

    def rosapi_count(self):
        return sum(1 for name, ns in self.get_node_names_and_namespaces()
                   if name == 'rosapi' and ns == '/')

    def own_running(self):
        return self.proc is not None and self.proc.poll() is None

    def check(self):
        age = (self.get_clock().now() - self.started_at).nanoseconds * 1e-9
        if age < START_DELAY_S:
            return
        count = self.rosapi_count()
        if self.own_running():
            if count > 1:
                self.get_logger().info('Second /rosapi detected - stopping the one started by VR.')
                self.stop_own()
        elif count == 0:
            self.get_logger().info('No /rosapi in the graph - starting one for rosbridge 9091.')
            self.proc = subprocess.Popen(ROSAPI_CMD)

    def stop_own(self):
        if not self.own_running():
            return
        self.proc.send_signal(signal.SIGINT)
        try:
            self.proc.wait(timeout=3.0)
        except subprocess.TimeoutExpired:
            self.proc.kill()
        self.proc = None


def _raise_interrupt(signum, frame):
    raise KeyboardInterrupt


def main(args=None):
    rclpy.init(args=args)
    node = RosapiGuard()
    # ros2 launch eskaliert beim Beenden auf SIGTERM - auch dann den eigenen
    # rosapi mitnehmen, statt ihn als Waise zurueckzulassen.
    signal.signal(signal.SIGTERM, _raise_interrupt)
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.stop_own()
        node.destroy_node()
        if rclpy.ok():
            rclpy.shutdown()


if __name__ == '__main__':
    main()
