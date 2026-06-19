// generated from rosidl_generator_c/resource/idl__struct.h.em
// with input from my_3d_vision_bringup:action/GraspObject.idl
// generated code does not contain a copyright notice

#ifndef MY_3D_VISION_BRINGUP__ACTION__DETAIL__GRASP_OBJECT__STRUCT_H_
#define MY_3D_VISION_BRINGUP__ACTION__DETAIL__GRASP_OBJECT__STRUCT_H_

#ifdef __cplusplus
extern "C"
{
#endif

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>


// Constants defined in the message

// Include directives for member types
// Member 'object_name'
#include "rosidl_runtime_c/string.h"

/// Struct defined in action/GraspObject in the package my_3d_vision_bringup.
typedef struct my_3d_vision_bringup__action__GraspObject_Goal
{
  rosidl_runtime_c__String object_name;
} my_3d_vision_bringup__action__GraspObject_Goal;

// Struct for a sequence of my_3d_vision_bringup__action__GraspObject_Goal.
typedef struct my_3d_vision_bringup__action__GraspObject_Goal__Sequence
{
  my_3d_vision_bringup__action__GraspObject_Goal * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} my_3d_vision_bringup__action__GraspObject_Goal__Sequence;


// Constants defined in the message

// Include directives for member types
// Member 'message'
// already included above
// #include "rosidl_runtime_c/string.h"

/// Struct defined in action/GraspObject in the package my_3d_vision_bringup.
typedef struct my_3d_vision_bringup__action__GraspObject_Result
{
  bool success;
  rosidl_runtime_c__String message;
} my_3d_vision_bringup__action__GraspObject_Result;

// Struct for a sequence of my_3d_vision_bringup__action__GraspObject_Result.
typedef struct my_3d_vision_bringup__action__GraspObject_Result__Sequence
{
  my_3d_vision_bringup__action__GraspObject_Result * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} my_3d_vision_bringup__action__GraspObject_Result__Sequence;


// Constants defined in the message

// Include directives for member types
// Member 'current_phase'
// Member 'status_message'
// already included above
// #include "rosidl_runtime_c/string.h"

/// Struct defined in action/GraspObject in the package my_3d_vision_bringup.
typedef struct my_3d_vision_bringup__action__GraspObject_Feedback
{
  rosidl_runtime_c__String current_phase;
  rosidl_runtime_c__String status_message;
} my_3d_vision_bringup__action__GraspObject_Feedback;

// Struct for a sequence of my_3d_vision_bringup__action__GraspObject_Feedback.
typedef struct my_3d_vision_bringup__action__GraspObject_Feedback__Sequence
{
  my_3d_vision_bringup__action__GraspObject_Feedback * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} my_3d_vision_bringup__action__GraspObject_Feedback__Sequence;


// Constants defined in the message

// Include directives for member types
// Member 'goal_id'
#include "unique_identifier_msgs/msg/detail/uuid__struct.h"
// Member 'goal'
#include "my_3d_vision_bringup/action/detail/grasp_object__struct.h"

/// Struct defined in action/GraspObject in the package my_3d_vision_bringup.
typedef struct my_3d_vision_bringup__action__GraspObject_SendGoal_Request
{
  unique_identifier_msgs__msg__UUID goal_id;
  my_3d_vision_bringup__action__GraspObject_Goal goal;
} my_3d_vision_bringup__action__GraspObject_SendGoal_Request;

// Struct for a sequence of my_3d_vision_bringup__action__GraspObject_SendGoal_Request.
typedef struct my_3d_vision_bringup__action__GraspObject_SendGoal_Request__Sequence
{
  my_3d_vision_bringup__action__GraspObject_SendGoal_Request * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} my_3d_vision_bringup__action__GraspObject_SendGoal_Request__Sequence;


// Constants defined in the message

// Include directives for member types
// Member 'stamp'
#include "builtin_interfaces/msg/detail/time__struct.h"

/// Struct defined in action/GraspObject in the package my_3d_vision_bringup.
typedef struct my_3d_vision_bringup__action__GraspObject_SendGoal_Response
{
  bool accepted;
  builtin_interfaces__msg__Time stamp;
} my_3d_vision_bringup__action__GraspObject_SendGoal_Response;

// Struct for a sequence of my_3d_vision_bringup__action__GraspObject_SendGoal_Response.
typedef struct my_3d_vision_bringup__action__GraspObject_SendGoal_Response__Sequence
{
  my_3d_vision_bringup__action__GraspObject_SendGoal_Response * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} my_3d_vision_bringup__action__GraspObject_SendGoal_Response__Sequence;


// Constants defined in the message

// Include directives for member types
// Member 'goal_id'
// already included above
// #include "unique_identifier_msgs/msg/detail/uuid__struct.h"

/// Struct defined in action/GraspObject in the package my_3d_vision_bringup.
typedef struct my_3d_vision_bringup__action__GraspObject_GetResult_Request
{
  unique_identifier_msgs__msg__UUID goal_id;
} my_3d_vision_bringup__action__GraspObject_GetResult_Request;

// Struct for a sequence of my_3d_vision_bringup__action__GraspObject_GetResult_Request.
typedef struct my_3d_vision_bringup__action__GraspObject_GetResult_Request__Sequence
{
  my_3d_vision_bringup__action__GraspObject_GetResult_Request * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} my_3d_vision_bringup__action__GraspObject_GetResult_Request__Sequence;


// Constants defined in the message

// Include directives for member types
// Member 'result'
// already included above
// #include "my_3d_vision_bringup/action/detail/grasp_object__struct.h"

/// Struct defined in action/GraspObject in the package my_3d_vision_bringup.
typedef struct my_3d_vision_bringup__action__GraspObject_GetResult_Response
{
  int8_t status;
  my_3d_vision_bringup__action__GraspObject_Result result;
} my_3d_vision_bringup__action__GraspObject_GetResult_Response;

// Struct for a sequence of my_3d_vision_bringup__action__GraspObject_GetResult_Response.
typedef struct my_3d_vision_bringup__action__GraspObject_GetResult_Response__Sequence
{
  my_3d_vision_bringup__action__GraspObject_GetResult_Response * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} my_3d_vision_bringup__action__GraspObject_GetResult_Response__Sequence;


// Constants defined in the message

// Include directives for member types
// Member 'goal_id'
// already included above
// #include "unique_identifier_msgs/msg/detail/uuid__struct.h"
// Member 'feedback'
// already included above
// #include "my_3d_vision_bringup/action/detail/grasp_object__struct.h"

/// Struct defined in action/GraspObject in the package my_3d_vision_bringup.
typedef struct my_3d_vision_bringup__action__GraspObject_FeedbackMessage
{
  unique_identifier_msgs__msg__UUID goal_id;
  my_3d_vision_bringup__action__GraspObject_Feedback feedback;
} my_3d_vision_bringup__action__GraspObject_FeedbackMessage;

// Struct for a sequence of my_3d_vision_bringup__action__GraspObject_FeedbackMessage.
typedef struct my_3d_vision_bringup__action__GraspObject_FeedbackMessage__Sequence
{
  my_3d_vision_bringup__action__GraspObject_FeedbackMessage * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} my_3d_vision_bringup__action__GraspObject_FeedbackMessage__Sequence;

#ifdef __cplusplus
}
#endif

#endif  // MY_3D_VISION_BRINGUP__ACTION__DETAIL__GRASP_OBJECT__STRUCT_H_
