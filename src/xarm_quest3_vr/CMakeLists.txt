cmake_minimum_required(VERSION 3.8)
project(xarm_quest3_vr)

if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

# find dependencies
find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(geometry_msgs REQUIRED)
find_package(sensor_msgs REQUIRED)
find_package(std_srvs REQUIRED)
find_package(xarm_msgs REQUIRED)
find_package(rclcpp_components REQUIRED)

add_library(xarm_quest3_vr_input SHARED src/xarm_quest3_vr_input.cpp)
ament_target_dependencies(xarm_quest3_vr_input
  "rclcpp"
  "geometry_msgs"
  "sensor_msgs"
  "std_srvs"
  "xarm_msgs"
  "rclcpp_components"
)
rclcpp_components_register_nodes(xarm_quest3_vr_input "xarm_quest3_vr::Quest3VRToServoPub")

install(TARGETS
  xarm_quest3_vr_input
  ARCHIVE DESTINATION lib
  LIBRARY DESTINATION lib
  RUNTIME DESTINATION lib/${PROJECT_NAME}
)

if(BUILD_TESTING)
  find_package(ament_lint_auto REQUIRED)
  # the following line skips the linter which checks for copyrights
  # comment the line when a copyright and license is added to all source files
  set(ament_cmake_copyright_FOUND TRUE)
  # the following line skips cpplint (only works in a git repo)
  # comment the line when this package is in a git repo and when
  # a copyright and license is added to all source files
  set(ament_cmake_cpplint_FOUND TRUE)
  ament_lint_auto_find_test_dependencies()
endif()

ament_package()
