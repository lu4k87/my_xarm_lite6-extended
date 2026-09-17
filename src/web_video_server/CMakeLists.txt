cmake_minimum_required(VERSION 3.8)
project(web_video_server)

find_package(ament_cmake REQUIRED)

install(DIRECTORY launch DESTINATION share/${PROJECT_NAME})

if(EXISTS "/opt/ros/humble/share/web_video_server/plugins.xml")
  install(FILES /opt/ros/humble/share/web_video_server/plugins.xml
    DESTINATION share/${PROJECT_NAME}
  )
  ament_index_register_resource("web_video_server__pluginlib__plugin"
    CONTENT "share/web_video_server/plugins.xml"
  )
endif()

if(EXISTS "/opt/ros/humble/lib/web_video_server/web_video_server")
  install(PROGRAMS /opt/ros/humble/lib/web_video_server/web_video_server
    DESTINATION lib/${PROJECT_NAME}
  )
endif()

file(GLOB SYSTEM_LIBS "/opt/ros/humble/lib/libweb_video_server*.so*")
if(SYSTEM_LIBS)
  install(FILES ${SYSTEM_LIBS}
    DESTINATION lib
  )
endif()

ament_package()

