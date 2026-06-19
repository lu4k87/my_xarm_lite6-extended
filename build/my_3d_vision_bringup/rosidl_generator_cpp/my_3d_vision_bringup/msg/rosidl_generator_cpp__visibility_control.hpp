// generated from rosidl_generator_cpp/resource/rosidl_generator_cpp__visibility_control.hpp.in
// generated code does not contain a copyright notice

#ifndef MY_3D_VISION_BRINGUP__MSG__ROSIDL_GENERATOR_CPP__VISIBILITY_CONTROL_HPP_
#define MY_3D_VISION_BRINGUP__MSG__ROSIDL_GENERATOR_CPP__VISIBILITY_CONTROL_HPP_

#ifdef __cplusplus
extern "C"
{
#endif

// This logic was borrowed (then namespaced) from the examples on the gcc wiki:
//     https://gcc.gnu.org/wiki/Visibility

#if defined _WIN32 || defined __CYGWIN__
  #ifdef __GNUC__
    #define ROSIDL_GENERATOR_CPP_EXPORT_my_3d_vision_bringup __attribute__ ((dllexport))
    #define ROSIDL_GENERATOR_CPP_IMPORT_my_3d_vision_bringup __attribute__ ((dllimport))
  #else
    #define ROSIDL_GENERATOR_CPP_EXPORT_my_3d_vision_bringup __declspec(dllexport)
    #define ROSIDL_GENERATOR_CPP_IMPORT_my_3d_vision_bringup __declspec(dllimport)
  #endif
  #ifdef ROSIDL_GENERATOR_CPP_BUILDING_DLL_my_3d_vision_bringup
    #define ROSIDL_GENERATOR_CPP_PUBLIC_my_3d_vision_bringup ROSIDL_GENERATOR_CPP_EXPORT_my_3d_vision_bringup
  #else
    #define ROSIDL_GENERATOR_CPP_PUBLIC_my_3d_vision_bringup ROSIDL_GENERATOR_CPP_IMPORT_my_3d_vision_bringup
  #endif
#else
  #define ROSIDL_GENERATOR_CPP_EXPORT_my_3d_vision_bringup __attribute__ ((visibility("default")))
  #define ROSIDL_GENERATOR_CPP_IMPORT_my_3d_vision_bringup
  #if __GNUC__ >= 4
    #define ROSIDL_GENERATOR_CPP_PUBLIC_my_3d_vision_bringup __attribute__ ((visibility("default")))
  #else
    #define ROSIDL_GENERATOR_CPP_PUBLIC_my_3d_vision_bringup
  #endif
#endif

#ifdef __cplusplus
}
#endif

#endif  // MY_3D_VISION_BRINGUP__MSG__ROSIDL_GENERATOR_CPP__VISIBILITY_CONTROL_HPP_
