cmake_minimum_required(VERSION 3.5)
project(xarm_moveit_servo)

# Default to C99
if(NOT CMAKE_C_STANDARD)
  set(CMAKE_C_STANDARD 99)
endif()

# Default to C++14
if(NOT CMAKE_CXX_STANDARD)
  set(CMAKE_CXX_STANDARD 14)
endif()

if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

# find dependencies
find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(rclcpp_components REQUIRED)
find_package(std_msgs REQUIRED)
find_package(std_srvs REQUIRED)
find_package(sensor_msgs REQUIRED)
find_package(control_msgs REQUIRED)
find_package(moveit_msgs REQUIRED)
find_package(geometry_msgs REQUIRED)
find_package(moveit_ros_planning REQUIRED)
find_package(xarm_msgs REQUIRED)
# NEU: Füge die Pakete für Action Client und die Whisper Action Definition hinzu
find_package(rclcpp_action REQUIRED)
find_package(whisper_idl REQUIRED)


if(BUILD_TESTING)
  find_package(ament_lint_auto REQUIRED)
  ament_lint_auto_find_test_dependencies()
endif()

set(THIS_PACKAGE_INCLUDE_DEPENDS
  rclcpp
  rclcpp_components
  std_msgs
  std_srvs
  sensor_msgs
  control_msgs
  moveit_msgs
  geometry_msgs
  moveit_ros_planning
  xarm_msgs
)

include_directories(
  include
  ${ament_INCLUDE_DIRS}
)

add_library(xarm_joystick_input SHARED src/xarm_joystick_input.cpp)
# NEU: Füge die Abhängigkeiten direkt zum Target hinzu
ament_target_dependencies(xarm_joystick_input
  ${THIS_PACKAGE_INCLUDE_DEPENDS}
  "rclcpp_action"
  "whisper_idl"
)
rclcpp_components_register_nodes(xarm_joystick_input "xarm_moveit_servo::JoyToServoPub")

add_executable(xarm_keyboard_input
  src/xarm_keyboard_input.cpp
)
ament_target_dependencies(xarm_keyboard_input ${THIS_PACKAGE_INCLUDE_DEPENDS})

install(TARGETS
  xarm_joystick_input
  xarm_keyboard_input
  EXPORT export_${PROJECT_NAME}
  LIBRARY DESTINATION lib
  ARCHIVE DESTINATION lib
  RUNTIME DESTINATION lib/${PROJECT_NAME}
  INCLUDES DESTINATION include
)

install(DIRECTORY
  config
  launch
  rviz
  DESTINATION share/${PROJECT_NAME}/
)

ament_package()
