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
"""

import rclpy
from rclpy.node import Node
from geometry_msgs.msg import Pose
from moveit_msgs.msg import CollisionObject, ObjectColor, PlanningScene
from shape_msgs.msg import SolidPrimitive
from std_msgs.msg import ColorRGBA


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

        self.scene_pub = self.create_publisher(PlanningScene, '/planning_scene', 10)
        period = float(self.get_parameter('publish_period').value)
        self.timer = self.create_timer(period, self.publish_floor)
        self.publish_floor()

        self.get_logger().info(
            f"Floor collision object '{self.get_parameter('object_id').value}' active "
            f"(top at z={self.get_parameter('floor_z').value:.3f} m in "
            f"{self.get_parameter('frame_id').value}).")

    def publish_floor(self):
        floor_z = float(self.get_parameter('floor_z').value)
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
