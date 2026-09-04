cmake_minimum_required(VERSION 3.8)
project(my_3d_vision_bringup)

# ==========================================
# 1. Abhängigkeiten finden
# ==========================================
find_package(ament_cmake REQUIRED)
find_package(rosidl_default_generators REQUIRED)

# ==========================================
# 2. Interfaces (Actions/Messages/Services)
# ==========================================
rosidl_generate_interfaces(${PROJECT_NAME}
  "action/GraspObject.action"
  # Falls deine Action z. B. geometry_msgs nutzt, müsstest du diese so hinzufügen:
  # DEPENDENCIES geometry_msgs
)

# ==========================================
# 3. Verzeichnisse installieren
# ==========================================
install(DIRECTORY 
  launch 
  config
  DESTINATION share/${PROJECT_NAME}
)

# ==========================================
# 4. Python-Skripte installieren (Executables)
# ==========================================
# WICHTIG: Die Skripte müssen zwingend ausführbar sein (chmod +x)
install(PROGRAMS 
  scripts/yolo_3d_bbox_for_zed_m.py 
  scripts/yolo_3d_bbox_ip_cam.py
  scripts/pointcloud_optimizer.py 
  scripts/yolo_moveit_collision.py 
  scripts/yolo_grasp_executor.py 
  scripts/yolo_planned_grasp_executor.py 
  scripts/grasp_action_bridge.py 
  DESTINATION lib/${PROJECT_NAME}
)

# ==========================================
# 5. Tests konfigurieren (aus deiner package.xml)
# ==========================================
if(BUILD_TESTING)
  find_package(ament_lint_auto REQUIRED)
  set(ament_cmake_copyright_FOUND TRUE)
  set(ament_cmake_cpplint_FOUND TRUE)
  ament_lint_auto_find_test_dependencies()
endif()

# ==========================================
# 6. Paket abschließen
# ==========================================
ament_package()
