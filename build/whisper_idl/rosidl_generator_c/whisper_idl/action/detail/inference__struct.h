// generated from rosidl_generator_c/resource/idl__struct.h.em
// with input from whisper_idl:action/Inference.idl
// generated code does not contain a copyright notice

#ifndef WHISPER_IDL__ACTION__DETAIL__INFERENCE__STRUCT_H_
#define WHISPER_IDL__ACTION__DETAIL__INFERENCE__STRUCT_H_

#ifdef __cplusplus
extern "C"
{
#endif

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>


// Constants defined in the message

// Include directives for member types
// Member 'max_duration'
#include "builtin_interfaces/msg/detail/duration__struct.h"

/// Struct defined in action/Inference in the package whisper_idl.
typedef struct whisper_idl__action__Inference_Goal
{
  builtin_interfaces__msg__Duration max_duration;
} whisper_idl__action__Inference_Goal;

// Struct for a sequence of whisper_idl__action__Inference_Goal.
typedef struct whisper_idl__action__Inference_Goal__Sequence
{
  whisper_idl__action__Inference_Goal * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} whisper_idl__action__Inference_Goal__Sequence;


// Constants defined in the message

// Include directives for member types
// Member 'info'
// Member 'transcriptions'
#include "rosidl_runtime_c/string.h"

/// Struct defined in action/Inference in the package whisper_idl.
typedef struct whisper_idl__action__Inference_Result
{
  rosidl_runtime_c__String info;
  rosidl_runtime_c__String__Sequence transcriptions;
} whisper_idl__action__Inference_Result;

// Struct for a sequence of whisper_idl__action__Inference_Result.
typedef struct whisper_idl__action__Inference_Result__Sequence
{
  whisper_idl__action__Inference_Result * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} whisper_idl__action__Inference_Result__Sequence;


// Constants defined in the message

// Include directives for member types
// Member 'transcription'
// already included above
// #include "rosidl_runtime_c/string.h"

/// Struct defined in action/Inference in the package whisper_idl.
typedef struct whisper_idl__action__Inference_Feedback
{
  uint16_t batch_idx;
  rosidl_runtime_c__String transcription;
} whisper_idl__action__Inference_Feedback;

// Struct for a sequence of whisper_idl__action__Inference_Feedback.
typedef struct whisper_idl__action__Inference_Feedback__Sequence
{
  whisper_idl__action__Inference_Feedback * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} whisper_idl__action__Inference_Feedback__Sequence;


// Constants defined in the message

// Include directives for member types
// Member 'goal_id'
#include "unique_identifier_msgs/msg/detail/uuid__struct.h"
// Member 'goal'
#include "whisper_idl/action/detail/inference__struct.h"

/// Struct defined in action/Inference in the package whisper_idl.
typedef struct whisper_idl__action__Inference_SendGoal_Request
{
  unique_identifier_msgs__msg__UUID goal_id;
  whisper_idl__action__Inference_Goal goal;
} whisper_idl__action__Inference_SendGoal_Request;

// Struct for a sequence of whisper_idl__action__Inference_SendGoal_Request.
typedef struct whisper_idl__action__Inference_SendGoal_Request__Sequence
{
  whisper_idl__action__Inference_SendGoal_Request * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} whisper_idl__action__Inference_SendGoal_Request__Sequence;


// Constants defined in the message

// Include directives for member types
// Member 'stamp'
#include "builtin_interfaces/msg/detail/time__struct.h"

/// Struct defined in action/Inference in the package whisper_idl.
typedef struct whisper_idl__action__Inference_SendGoal_Response
{
  bool accepted;
  builtin_interfaces__msg__Time stamp;
} whisper_idl__action__Inference_SendGoal_Response;

// Struct for a sequence of whisper_idl__action__Inference_SendGoal_Response.
typedef struct whisper_idl__action__Inference_SendGoal_Response__Sequence
{
  whisper_idl__action__Inference_SendGoal_Response * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} whisper_idl__action__Inference_SendGoal_Response__Sequence;


// Constants defined in the message

// Include directives for member types
// Member 'goal_id'
// already included above
// #include "unique_identifier_msgs/msg/detail/uuid__struct.h"

/// Struct defined in action/Inference in the package whisper_idl.
typedef struct whisper_idl__action__Inference_GetResult_Request
{
  unique_identifier_msgs__msg__UUID goal_id;
} whisper_idl__action__Inference_GetResult_Request;

// Struct for a sequence of whisper_idl__action__Inference_GetResult_Request.
typedef struct whisper_idl__action__Inference_GetResult_Request__Sequence
{
  whisper_idl__action__Inference_GetResult_Request * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} whisper_idl__action__Inference_GetResult_Request__Sequence;


// Constants defined in the message

// Include directives for member types
// Member 'result'
// already included above
// #include "whisper_idl/action/detail/inference__struct.h"

/// Struct defined in action/Inference in the package whisper_idl.
typedef struct whisper_idl__action__Inference_GetResult_Response
{
  int8_t status;
  whisper_idl__action__Inference_Result result;
} whisper_idl__action__Inference_GetResult_Response;

// Struct for a sequence of whisper_idl__action__Inference_GetResult_Response.
typedef struct whisper_idl__action__Inference_GetResult_Response__Sequence
{
  whisper_idl__action__Inference_GetResult_Response * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} whisper_idl__action__Inference_GetResult_Response__Sequence;


// Constants defined in the message

// Include directives for member types
// Member 'goal_id'
// already included above
// #include "unique_identifier_msgs/msg/detail/uuid__struct.h"
// Member 'feedback'
// already included above
// #include "whisper_idl/action/detail/inference__struct.h"

/// Struct defined in action/Inference in the package whisper_idl.
typedef struct whisper_idl__action__Inference_FeedbackMessage
{
  unique_identifier_msgs__msg__UUID goal_id;
  whisper_idl__action__Inference_Feedback feedback;
} whisper_idl__action__Inference_FeedbackMessage;

// Struct for a sequence of whisper_idl__action__Inference_FeedbackMessage.
typedef struct whisper_idl__action__Inference_FeedbackMessage__Sequence
{
  whisper_idl__action__Inference_FeedbackMessage * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} whisper_idl__action__Inference_FeedbackMessage__Sequence;

#ifdef __cplusplus
}
#endif

#endif  // WHISPER_IDL__ACTION__DETAIL__INFERENCE__STRUCT_H_
