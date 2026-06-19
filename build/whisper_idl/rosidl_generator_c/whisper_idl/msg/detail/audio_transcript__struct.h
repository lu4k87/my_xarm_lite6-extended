// generated from rosidl_generator_c/resource/idl__struct.h.em
// with input from whisper_idl:msg/AudioTranscript.idl
// generated code does not contain a copyright notice

#ifndef WHISPER_IDL__MSG__DETAIL__AUDIO_TRANSCRIPT__STRUCT_H_
#define WHISPER_IDL__MSG__DETAIL__AUDIO_TRANSCRIPT__STRUCT_H_

#ifdef __cplusplus
extern "C"
{
#endif

#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>


// Constants defined in the message

// Include directives for member types
// Member 'words'
#include "rosidl_runtime_c/string.h"
// Member 'probs'
// Member 'occ'
// Member 'seg_start_words_id'
// Member 'seg_duration_ms'
#include "rosidl_runtime_c/primitives_sequence.h"
// Member 'seg_start_time'
#include "builtin_interfaces/msg/detail/time__struct.h"

/// Struct defined in msg/AudioTranscript in the package whisper_idl.
/**
  * File:  AudioTranscript.msg
 */
typedef struct whisper_idl__msg__AudioTranscript
{
  /// Text data
  /// The word from speech-to-text
  rosidl_runtime_c__String__Sequence words;
  /// Confidence value
  rosidl_runtime_c__float__Sequence probs;
  /// Word occurances
  rosidl_runtime_c__int32__Sequence occ;
  /// Segment Data
  /// Location in the words array where the segment starts
  rosidl_runtime_c__int32__Sequence seg_start_words_id;
  /// Start time of the segment
  builtin_interfaces__msg__Time__Sequence seg_start_time;
  /// Segment duration in ms
  rosidl_runtime_c__int32__Sequence seg_duration_ms;
  /// Meta
  /// All words past this index in the transcript may change
  int32_t active_index;
} whisper_idl__msg__AudioTranscript;

// Struct for a sequence of whisper_idl__msg__AudioTranscript.
typedef struct whisper_idl__msg__AudioTranscript__Sequence
{
  whisper_idl__msg__AudioTranscript * data;
  /// The number of valid items in data
  size_t size;
  /// The number of allocated items in data
  size_t capacity;
} whisper_idl__msg__AudioTranscript__Sequence;

#ifdef __cplusplus
}
#endif

#endif  // WHISPER_IDL__MSG__DETAIL__AUDIO_TRANSCRIPT__STRUCT_H_
