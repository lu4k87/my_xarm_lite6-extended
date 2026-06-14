cmake_minimum_required(VERSION 3.8)
project(my_3d_vision_bringup)

find_package(ament_cmake REQUIRED)
find_package(rosidl_default_generators REQUIRED)

rosidl_generate_interfaces(${PROJECT_NAME}
  "action/GraspObject.action"
)

# Install launch files, meshes, and config
install(DIRECTORY launch meshes config
  DESTINATION share/${PROJECT_NAME}
)

install(PROGRAMS scripts/zed_stand_publisher.py scripts/zed_yolo_3d_bbox.py scripts/pointcloud_optimizer.py scripts/yolo_moveit_collision.py scripts/yolo_grasp_executor.py scripts/yolo_planned_grasp_executor.py scripts/grasp_action_bridge.py
  DESTINATION lib/${PROJECT_NAME}
)

ament_package()
