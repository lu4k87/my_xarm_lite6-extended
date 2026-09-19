cmake_minimum_required(VERSION 3.8)
project(rviz_object_distance_visualizer)

if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

find_package(ament_cmake REQUIRED)

# Install Python scripts
install(PROGRAMS
  scripts/rviz_object_distance_visualizer.py
  DESTINATION lib/${PROJECT_NAME}
)

# Also install without .py so both invocations work
install(PROGRAMS
  scripts/rviz_object_distance_visualizer.py
  DESTINATION lib/${PROJECT_NAME}
  RENAME rviz_object_distance_visualizer
)

ament_package()

