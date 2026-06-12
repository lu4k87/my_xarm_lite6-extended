cmake_minimum_required(VERSION 3.8)
project(my_zed_tf_bringup)

find_package(ament_cmake REQUIRED)

# Install launch files, meshes, and config
install(DIRECTORY launch meshes config
  DESTINATION share/${PROJECT_NAME}
)

install(PROGRAMS scripts/zed_stand_publisher.py scripts/zed_yolo_3d_bbox.py scripts/pointcloud_optimizer.py scripts/yolo_moveit_collision.py
  DESTINATION lib/${PROJECT_NAME}
)

ament_package()
