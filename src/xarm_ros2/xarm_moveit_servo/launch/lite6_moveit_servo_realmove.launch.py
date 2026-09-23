#!/usr/bin/env python3
# Software License Agreement (BSD License)
#
# Copyright (c) 2021, UFACTORY, Inc.
# All rights reserved.
#
# Author: Vinman <vinman.wen@ufactory.cc> <vinman.cub@gmail.com>

from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription, DeclareLaunchArgument
from launch.conditions import IfCondition
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution, PythonExpression
from launch_ros.substitutions import FindPackageShare


def generate_launch_description():
    robot_ip = LaunchConfiguration('robot_ip', default='192.168.1.175')
    report_type = LaunchConfiguration('report_type', default='dev')
    prefix = LaunchConfiguration('prefix', default='')
    hw_ns = LaunchConfiguration('hw_ns', default='ufactory')
    # limited:=true schraenkt J1/J4/J6 im URDF auf +-0.99*pi (+-178.2 Grad) ein.
    # Dann ist der Keil direkt hinter dem Roboter (z.B. X=-300, Y=0) per IK
    # unerreichbar, obwohl die Hardware J1/J4/J6 +-360 Grad kann. Deshalb
    # Standard false = echte Lite-6-Bereiche. Servo und move_group muessen
    # dieselben Grenzen haben, sonst blockiert Servo eine geplante Pose.
    limited = LaunchConfiguration('limited', default=False)
    effort_control = LaunchConfiguration('effort_control', default=False)
    velocity_control = LaunchConfiguration('velocity_control', default=False)
    add_gripper = LaunchConfiguration('add_gripper', default=False)
    add_vacuum_gripper = LaunchConfiguration('add_vacuum_gripper', default=False)
    attach_to = LaunchConfiguration('attach_to', default='world')
    baud_checkset = LaunchConfiguration('baud_checkset', default=True)
    default_gripper_baud = LaunchConfiguration('default_gripper_baud', default=2000000)
    static_objects = LaunchConfiguration('static_objects', default='false')
    rviz = LaunchConfiguration('rviz', default='true')
    static_onjects = LaunchConfiguration('static_onjects', default='false')

    # robot moveit servo launch
    # xarm_moveit_servo/launch/_robot_moveit_servo.launch.py
    robot_moveit_servo_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(PathJoinSubstitution([FindPackageShare('xarm_moveit_servo'), 'launch', '_robot_moveit_servo_realmove.launch.py'])),
        launch_arguments={
            'robot_ip': robot_ip,
            'report_type': report_type,
            'baud_checkset': baud_checkset,
            'default_gripper_baud': default_gripper_baud,
            'dof': '6',
            'prefix': prefix,
            'hw_ns': hw_ns,
            'limited': limited,
            'effort_control': effort_control,
            'velocity_control': velocity_control,
            'add_gripper': add_gripper,
            'add_vacuum_gripper': add_vacuum_gripper,
            'robot_type': 'lite',
            'attach_to': attach_to,
            'ros2_control_plugin': 'uf_robot_hardware/UFRobotSystemHardware',
            'rviz': rviz,
        }.items(),
    )

    # standalone move_group launch (MoveIt Planning Server)
    standalone_move_group_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(PathJoinSubstitution([FindPackageShare('robot_motion_handler_movegroup'), 'launch', 'standalone_move_group.launch.py'])),
        launch_arguments={
            'robot_ip': robot_ip,
            'report_type': report_type,
            'baud_checkset': baud_checkset,
            'default_gripper_baud': default_gripper_baud,
            'dof': '6',
            'robot_type': 'lite',
            'prefix': prefix,
            'hw_ns': hw_ns,
            'limited': limited,
            'effort_control': effort_control,
            'velocity_control': velocity_control,
            'add_gripper': add_gripper,
            'add_vacuum_gripper': add_vacuum_gripper,
            'attach_to': attach_to,
        }.items(),
    )

    # 3D Scene Marker Objects Launch (rviz_marker_3d_scene_objects)
    static_objects_condition = IfCondition(
        PythonExpression(["'", static_objects, "' == 'true' or '", static_onjects, "' == 'true'"])
    )
    rviz_marker_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(PathJoinSubstitution([FindPackageShare('rviz_marker_3d_scene_objects'), 'launch', 'rviz_marker_3d_scene_objects.launch.py'])),
        condition=static_objects_condition
    )

    return LaunchDescription([
        DeclareLaunchArgument('robot_ip', default_value='192.168.1.175', description='IP address of the real xArm Lite 6 robot'),
        DeclareLaunchArgument('report_type', default_value='dev', description='Report type (dev, normal, rich)'),
        DeclareLaunchArgument('add_gripper', default_value='false', description='Whether to add xArm gripper'),
        DeclareLaunchArgument('add_vacuum_gripper', default_value='false', description='Whether to add vacuum gripper'),
        DeclareLaunchArgument('rviz', default_value='true', description='Start RViz2 together with MoveIt Servo'),
        DeclareLaunchArgument('static_objects', default_value='false', description='Whether to launch rviz_marker_3d_scene_objects (3D scene calibration objects)'),
        DeclareLaunchArgument('static_onjects', default_value='false', description='Alias for static_objects'),
        robot_moveit_servo_launch,
        standalone_move_group_launch,
        rviz_marker_launch,
        # robot_driver_launch,
    ])