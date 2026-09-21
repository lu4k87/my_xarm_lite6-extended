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
from launch_ros.actions import Node
from launch_ros.substitutions import FindPackageShare


def generate_launch_description():
    prefix = LaunchConfiguration('prefix', default='')
    hw_ns = LaunchConfiguration('hw_ns', default='ufactory')
    limited = LaunchConfiguration('limited', default=True)
    effort_control = LaunchConfiguration('effort_control', default=False)
    velocity_control = LaunchConfiguration('velocity_control', default=False)
    add_gripper = LaunchConfiguration('add_gripper', default=False)
    add_vacuum_gripper = LaunchConfiguration('add_vacuum_gripper', default=False)
    attach_to = LaunchConfiguration('attach_to', default='world')
    static_objects = LaunchConfiguration('static_objects', default='false')
    static_onjects = LaunchConfiguration('static_onjects', default='false')

    # robot moveit servo launch
    # xarm_moveit_servo/launch/_robot_moveit_servo.launch.py
    robot_moveit_servo_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(PathJoinSubstitution([FindPackageShare('xarm_moveit_servo'), 'launch', '_robot_moveit_servo_fake.launch.py'])),
        launch_arguments={
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
        }.items(),
    )
    
    # standalone move_group launch (MoveIt Planning Server)
    standalone_move_group_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(PathJoinSubstitution([FindPackageShare('robot_motion_handler_movegroup'), 'launch', 'standalone_move_group.launch.py'])),
        launch_arguments={
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

    # Fake linear axis node (broadcasts world -> linear_axis_link TF and rail markers when attach_to:=linear_axis_link)
    linear_axis_condition = IfCondition(
        PythonExpression(["'", attach_to, "' == 'linear_axis_link'"])
    )
    linear_axis_node = Node(
        package='fake_linear_axis',
        executable='fake_linear_axis',
        name='fake_linear_axis',
        output='screen',
        condition=linear_axis_condition,
    )

    return LaunchDescription([
        DeclareLaunchArgument('add_gripper', default_value='false', description='Whether to add xArm gripper'),
        DeclareLaunchArgument('add_vacuum_gripper', default_value='false', description='Whether to add vacuum gripper'),
        DeclareLaunchArgument('attach_to', default_value='world', description='Root link to attach robot to (e.g. world or linear_axis_link)'),
        DeclareLaunchArgument('static_objects', default_value='false', description='Whether to launch rviz_marker_3d_scene_objects (3D scene calibration objects)'),
        DeclareLaunchArgument('static_onjects', default_value='false', description='Alias for static_objects'),
        robot_moveit_servo_launch,
        standalone_move_group_launch,
        rviz_marker_launch,
        linear_axis_node,
    ])