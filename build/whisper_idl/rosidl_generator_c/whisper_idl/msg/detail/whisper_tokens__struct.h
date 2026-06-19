// generated from rosidl_generator_c/resource/idl__struct.h.em
// with input from whisper_idl:msg/WhisperTokens.idl
// generated code does not contain a copyright notice

#ifndef WHISPER_IDL__MSG__DETAIL__WHISPER_TOKENS__STRUCT_H_
#define WHISPER_IDL__MSG__DETAIL__WHISPER_TOKENS__STRUCT_H_

#ifdef __cplusplus
extern "C"
{
#endif

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>


// Constants defined in the message

// Include directives for member types
// Member 'stamp'
#include "builtin_interfaces/msg/detail/time__struct.h"
// Member 'token_ids'
// Member 'token_probs'
// Member 'segment_start_token_idxs'
// Member 'start_times'
// Member 'end_times'
#include "rosidl_runtime_c/primitives_sequence.h"
// Member 'token_texts'
#include "rosidl_runtime_c/string.h"

/// Struct defined in msg/WhisperTokens in the package whisper_idl.
typedef struct whisper_idl__msg__WhisperTokens
{
  builtin_interfaces__msg__Time stamp;
  /// Token data
  rosidl_runtime_c__int32__Sequence token_ids;
  rosidl_runtime_c__String__Sequence token_texts;
  rosidl_runtime_c__float__Sequence token_probs;
  /// Segment data
  rosidl_runtime_c__int32__Sequence segment_start_token_idxs;
  rosidl_runtime_c__int64__Sequence start_times;
  rosidl_runtime_c__int64__Sequence end_times;
  /// Runtime data
  int64_t inference_duration;
} whisper_idl__msg__WhisperTokens;

// Struct for a sequence of whisper_idl__msg__WhisperTokens.
typedef struct whisper_idl__msg__WhisperTokens__Sequence
{
  whisper_idl__msg__WhisperTokens * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} whisper_idl__msg__WhisperTokens__Sequence;

#ifdef __cplusplus
}
#endif

#endif  // WHISPER_IDL__MSG__DETAIL__WHISPER_TOKENS__STRUCT_H_
