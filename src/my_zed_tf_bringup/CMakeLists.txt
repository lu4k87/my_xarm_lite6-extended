cmake_minimum_required(VERSION 3.8)
project(my_zed_tf_bringup)

find_package(ament_cmake REQUIRED)

# Install launch files and meshes
install(DIRECTORY launch meshes
  DESTINATION share/${PROJECT_NAME}
)

install(PROGRAMS scripts/zed_stand_publisher.py scripts/pointcloud_optimizer.py
  DESTINATION lib/${PROJECT_NAME}
)

ament_package()
