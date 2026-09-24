#!/usr/bin/env python3
"""Tischebene als Kollisionsobjekt in der MoveIt-Planungsszene.

Vorher kannte MoveIt keinen Boden: Cartesian Jogging (MoveIt Servo) und
MoveTo (IK mit avoid_collisions) liessen den TCP ungebremst unter die
Tischplatte fahren - die Z Collision Level gab es nur als Warnung in der UI.

Der Node legt eine flache Box direkt unter die Basis. Sie geht als Diff auf
/planning_scene, das abonnieren move_group UND servo_server (Servo ist in
Humble eigener "primary" Planning Scene Monitor). Damit blockieren:
  - MoveIt Servo beim Jogging  -> Status HALT_FOR_COLLISION
  - /compute_ik mit avoid_collisions (MoveTo in der Robot Control UI)
  - move_group-Planung (Grasp-Ablauf)

Veroeffentlicht wird zyklisch, damit ein spaeter oder neu gestarteter
move_group/servo_server den Boden ohne Neustart dieses Nodes bekommt. Ein ADD
mit gleicher ID ersetzt das Objekt nur, die Last ist vernachlaessigbar.

Die Robot Control UI kann den Boden ueber /ui/set_moveit_collision_ground
(std_srvs/SetBool) fuer MoveIt aus- und wieder einschalten. Der Zustand geht
latched auf /ui/moveit_collision_ground_enabled. Nach einem Neustart des Nodes
ist der Boden immer wieder aktiv.

Z Collision Level (TCP-Hoehe in mm, Standard 10) ist live einstellbar:
/ui/set_ground_collision_level (std_msgs/Float64, mm), der gueltige Wert geht
latched auf /ui/ground_collision_level. Die UI sperrt Joggen/MoveTo unter dieser
Hoehe; die MoveIt-Box liegt servo_margin darunter (Servo bremst erst 1 cm vor
Kollisionsgeometrie), hoechstens aber bei floor_z - hoeher wuerde sie link_base
schneiden und jede Planung als START_STATE_IN_COLLISION abbrechen.
"""

import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, DurabilityPolicy
from geometry_msgs.msg import Pose
from moveit_msgs.msg import CollisionObject, ObjectColor, PlanningScene
from shape_msgs.msg import SolidPrimitive
from std_msgs.msg import Bool, ColorRGBA, Float64
from std_srvs.srv import SetBool


class MoveitFloorCollision(Node):
    def __init__(self):
        super().__init__('moveit_floor_collision')

        # Oberkante der Box relativ zu frame_id (m). 1 mm unter der Basis,
        # damit link_base den Boden nie beruehrt - sonst waere schon die
        # Ruhepose "in Kollision" und Servo/Planung blieben dauerhaft stehen.
        self.declare_parameter('floor_z', -0.001)
        self.declare_parameter('frame_id', 'link_base')
        self.declare_parameter('size_xy', 2.0)
        self.declare_parameter('thickness', 0.02)
        self.declare_parameter('object_id', 'floor')
        self.declare_parameter('publish_period', 2.0)
        self.declare_parameter('ground_level_mm', 10.0)
        self.declare_parameter('ground_level_min_mm', 0.0)
        self.declare_parameter('ground_level_max_mm', 200.0)
        self.declare_parameter('servo_margin', 0.011)
        self.level_mm = self._clamp_level(float(self.get_parameter('ground_level_mm').value))

        self.scene_pub = self.create_publisher(PlanningScene, '/planning_scene', 10)

        self.enabled = True
        latched_qos = QoSProfile(depth=1, durability=DurabilityPolicy.TRANSIENT_LOCAL)
        self.state_pub = self.create_publisher(
            Bool, '/ui/moveit_collision_ground_enabled', latched_qos)
        self.create_service(SetBool, '/ui/set_moveit_collision_ground', self.set_enabled_cb)
        self.state_pub.publish(Bool(data=self.enabled))

        self.level_pub = self.create_publisher(
            Float64, '/ui/ground_collision_level', latched_qos)
        self.create_subscription(
            Float64, '/ui/set_ground_collision_level', self.set_level_cb, 10)
        self.level_pub.publish(Float64(data=self.level_mm))

        period = float(self.get_parameter('publish_period').value)
        self.timer = self.create_timer(period, self.publish_floor)
        self.publish_floor()

        self.get_logger().info(
            f"Floor collision object '{self.get_parameter('object_id').value}' active "
            f"(top at z={self.floor_top():.3f} m in "
            f"{self.get_parameter('frame_id').value}, Z Collision Level {self.level_mm:.0f} mm).")

    def _clamp_level(self, mm):
        lo = float(self.get_parameter('ground_level_min_mm').value)
        hi = float(self.get_parameter('ground_level_max_mm').value)
        return min(hi, max(lo, mm))

    def floor_top(self):
        cap = float(self.get_parameter('floor_z').value)
        margin = float(self.get_parameter('servo_margin').value)
        return min(cap, self.level_mm / 1000.0 - margin)

    def set_level_cb(self, msg):
        mm = float(msg.data)
        if mm != mm:   # NaN
            self.get_logger().warn('Ignoring NaN on /ui/set_ground_collision_level')
            return
        self.level_mm = self._clamp_level(mm)
        self.level_pub.publish(Float64(data=self.level_mm))
        self.publish_floor()
        self.get_logger().info(
            f"Z Collision Level {self.level_mm:.0f} mm (MoveIt floor top z={self.floor_top():.3f} m).")

    def set_enabled_cb(self, request, response):
        self.enabled = bool(request.data)
        if self.enabled:
            self.publish_floor()
        else:
            self.remove_floor()
        self.state_pub.publish(Bool(data=self.enabled))
        response.success = True
        response.message = f"MoveIt ground collision {'enabled' if self.enabled else 'disabled'}"
        self.get_logger().warn(response.message)
        return response

    def remove_floor(self):
        obj = CollisionObject()
        obj.header.frame_id = self.get_parameter('frame_id').value
        obj.header.stamp = self.get_clock().now().to_msg()
        obj.id = self.get_parameter('object_id').value
        obj.operation = CollisionObject.REMOVE

        scene = PlanningScene()
        scene.is_diff = True
        scene.world.collision_objects = [obj]
        self.scene_pub.publish(scene)

    def publish_floor(self):
        if not self.enabled:
            # Das REMOVE ebenfalls periodisch wiederholen: /planning_scene ist
            # nicht latched - verpasst move_group oder servo_server die eine
            # Nachricht beim Umschalten, bliebe der Boden dort sonst bestehen
            # und blockierte weiter Bewegungen nach unten.
            self.remove_floor()
            return
        floor_z = self.floor_top()
        size_xy = float(self.get_parameter('size_xy').value)
        thickness = float(self.get_parameter('thickness').value)
        object_id = self.get_parameter('object_id').value

        box = SolidPrimitive()
        box.type = SolidPrimitive.BOX
        box.dimensions = [size_xy, size_xy, thickness]

        pose = Pose()
        pose.position.z = floor_z - thickness / 2.0
        pose.orientation.w = 1.0

        obj = CollisionObject()
        obj.header.frame_id = self.get_parameter('frame_id').value
        obj.header.stamp = self.get_clock().now().to_msg()
        obj.id = object_id
        obj.primitives = [box]
        obj.primitive_poses = [pose]
        obj.operation = CollisionObject.ADD

        # Dezent halbtransparent, damit der Boden in RViz die Szene nicht zudeckt.
        color = ObjectColor(id=object_id, color=ColorRGBA(r=0.55, g=0.6, b=0.65, a=0.15))

        scene = PlanningScene()
        scene.is_diff = True
        scene.world.collision_objects = [obj]
        scene.object_colors = [color]
        self.scene_pub.publish(scene)


def main(args=None):
    rclpy.init(args=args)
    node = MoveitFloorCollision()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        if rclpy.ok():
            rclpy.shutdown()


if __name__ == '__main__':
    main()
