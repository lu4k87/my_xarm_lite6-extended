// generated from rosidl_typesupport_introspection_c/resource/idl__type_support.c.em
// with input from whisper_idl:msg/AudioTranscript.idl
// generated code does not contain a copyright notice

#include <stddef.h>
#include "whisper_idl/msg/detail/audio_transcript__rosidl_typesupport_introspection_c.h"
#include "whisper_idl/msg/rosidl_typesupport_introspection_c__visibility_control.h"
#include "rosidl_typesupport_introspection_c/field_types.h"
#include "rosidl_typesupport_introspection_c/identifier.h"
#include "rosidl_typesupport_introspection_c/message_introspection.h"
#include "whisper_idl/msg/detail/audio_transcript__functions.h"
#include "whisper_idl/msg/detail/audio_transcript__struct.h"


// Include directives for member types
// Member `words`
#include "rosidl_runtime_c/string_functions.h"
// Member `probs`
// Member `occ`
// Member `seg_start_words_id`
// Member `seg_duration_ms`
#include "rosidl_runtime_c/primitives_sequence_functions.h"
// Member `seg_start_time`
#include "builtin_interfaces/msg/time.h"
// Member `seg_start_time`
#include "builtin_interfaces/msg/detail/time__rosidl_typesupport_introspection_c.h"

#ifdef __cplusplus
extern "C"
{
#endif

void whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__AudioTranscript_init_function(
  void * message_memory, enum rosidl_runtime_c__message_initialization _init)
{
  // TODO(karsten1987): initializers are not yet implemented for typesupport c
  // see https://github.com/ros2/ros2/issues/397
  (void) _init;
  whisper_idl__msg__AudioTranscript__init(message_memory);
}

void whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__AudioTranscript_fini_function(void * message_memory)
{
  whisper_idl__msg__AudioTranscript__fini(message_memory);
}

size_t whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__size_function__AudioTranscript__words(
  const void * untyped_member)
{
  const rosidl_runtime_c__String__Sequence * member =
    (const rosidl_runtime_c__String__Sequence *)(untyped_member);
  return member->size;
}

const void * whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_const_function__AudioTranscript__words(
  const void * untyped_member, size_t index)
{
  const rosidl_runtime_c__String__Sequence * member =
    (const rosidl_runtime_c__String__Sequence *)(untyped_member);
  return &member->data[index];
}

void * whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_function__AudioTranscript__words(
  void * untyped_member, size_t index)
{
  rosidl_runtime_c__String__Sequence * member =
    (rosidl_runtime_c__String__Sequence *)(untyped_member);
  return &member->data[index];
}

void whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__fetch_function__AudioTranscript__words(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const rosidl_runtime_c__String * item =
    ((const rosidl_runtime_c__String *)
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_const_function__AudioTranscript__words(untyped_member, index));
  rosidl_runtime_c__String * value =
    (rosidl_runtime_c__String *)(untyped_value);
  *value = *item;
}

void whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__assign_function__AudioTranscript__words(
  void * untyped_member, size_t index, const void * untyped_value)
{
  rosidl_runtime_c__String * item =
    ((rosidl_runtime_c__String *)
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_function__AudioTranscript__words(untyped_member, index));
  const rosidl_runtime_c__String * value =
    (const rosidl_runtime_c__String *)(untyped_value);
  *item = *value;
}

bool whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__resize_function__AudioTranscript__words(
  void * untyped_member, size_t size)
{
  rosidl_runtime_c__String__Sequence * member =
    (rosidl_runtime_c__String__Sequence *)(untyped_member);
  rosidl_runtime_c__String__Sequence__fini(member);
  return rosidl_runtime_c__String__Sequence__init(member, size);
}

size_t whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__size_function__AudioTranscript__probs(
  const void * untyped_member)
{
  const rosidl_runtime_c__float__Sequence * member =
    (const rosidl_runtime_c__float__Sequence *)(untyped_member);
  return member->size;
}

const void * whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_const_function__AudioTranscript__probs(
  const void * untyped_member, size_t index)
{
  const rosidl_runtime_c__float__Sequence * member =
    (const rosidl_runtime_c__float__Sequence *)(untyped_member);
  return &member->data[index];
}

void * whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_function__AudioTranscript__probs(
  void * untyped_member, size_t index)
{
  rosidl_runtime_c__float__Sequence * member =
    (rosidl_runtime_c__float__Sequence *)(untyped_member);
  return &member->data[index];
}

void whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__fetch_function__AudioTranscript__probs(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const float * item =
    ((const float *)
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_const_function__AudioTranscript__probs(untyped_member, index));
  float * value =
    (float *)(untyped_value);
  *value = *item;
}

void whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__assign_function__AudioTranscript__probs(
  void * untyped_member, size_t index, const void * untyped_value)
{
  float * item =
    ((float *)
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_function__AudioTranscript__probs(untyped_member, index));
  const float * value =
    (const float *)(untyped_value);
  *item = *value;
}

bool whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__resize_function__AudioTranscript__probs(
  void * untyped_member, size_t size)
{
  rosidl_runtime_c__float__Sequence * member =
    (rosidl_runtime_c__float__Sequence *)(untyped_member);
  rosidl_runtime_c__float__Sequence__fini(member);
  return rosidl_runtime_c__float__Sequence__init(member, size);
}

size_t whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__size_function__AudioTranscript__occ(
  const void * untyped_member)
{
  const rosidl_runtime_c__int32__Sequence * member =
    (const rosidl_runtime_c__int32__Sequence *)(untyped_member);
  return member->size;
}

const void * whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_const_function__AudioTranscript__occ(
  const void * untyped_member, size_t index)
{
  const rosidl_runtime_c__int32__Sequence * member =
    (const rosidl_runtime_c__int32__Sequence *)(untyped_member);
  return &member->data[index];
}

void * whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_function__AudioTranscript__occ(
  void * untyped_member, size_t index)
{
  rosidl_runtime_c__int32__Sequence * member =
    (rosidl_runtime_c__int32__Sequence *)(untyped_member);
  return &member->data[index];
}

void whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__fetch_function__AudioTranscript__occ(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const int32_t * item =
    ((const int32_t *)
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_const_function__AudioTranscript__occ(untyped_member, index));
  int32_t * value =
    (int32_t *)(untyped_value);
  *value = *item;
}

void whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__assign_function__AudioTranscript__occ(
  void * untyped_member, size_t index, const void * untyped_value)
{
  int32_t * item =
    ((int32_t *)
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_function__AudioTranscript__occ(untyped_member, index));
  const int32_t * value =
    (const int32_t *)(untyped_value);
  *item = *value;
}

bool whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__resize_function__AudioTranscript__occ(
  void * untyped_member, size_t size)
{
  rosidl_runtime_c__int32__Sequence * member =
    (rosidl_runtime_c__int32__Sequence *)(untyped_member);
  rosidl_runtime_c__int32__Sequence__fini(member);
  return rosidl_runtime_c__int32__Sequence__init(member, size);
}

size_t whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__size_function__AudioTranscript__seg_start_words_id(
  const void * untyped_member)
{
  const rosidl_runtime_c__int32__Sequence * member =
    (const rosidl_runtime_c__int32__Sequence *)(untyped_member);
  return member->size;
}

const void * whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_const_function__AudioTranscript__seg_start_words_id(
  const void * untyped_member, size_t index)
{
  const rosidl_runtime_c__int32__Sequence * member =
    (const rosidl_runtime_c__int32__Sequence *)(untyped_member);
  return &member->data[index];
}

void * whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_function__AudioTranscript__seg_start_words_id(
  void * untyped_member, size_t index)
{
  rosidl_runtime_c__int32__Sequence * member =
    (rosidl_runtime_c__int32__Sequence *)(untyped_member);
  return &member->data[index];
}

void whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__fetch_function__AudioTranscript__seg_start_words_id(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const int32_t * item =
    ((const int32_t *)
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_const_function__AudioTranscript__seg_start_words_id(untyped_member, index));
  int32_t * value =
    (int32_t *)(untyped_value);
  *value = *item;
}

void whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__assign_function__AudioTranscript__seg_start_words_id(
  void * untyped_member, size_t index, const void * untyped_value)
{
  int32_t * item =
    ((int32_t *)
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_function__AudioTranscript__seg_start_words_id(untyped_member, index));
  const int32_t * value =
    (const int32_t *)(untyped_value);
  *item = *value;
}

bool whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__resize_function__AudioTranscript__seg_start_words_id(
  void * untyped_member, size_t size)
{
  rosidl_runtime_c__int32__Sequence * member =
    (rosidl_runtime_c__int32__Sequence *)(untyped_member);
  rosidl_runtime_c__int32__Sequence__fini(member);
  return rosidl_runtime_c__int32__Sequence__init(member, size);
}

size_t whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__size_function__AudioTranscript__seg_start_time(
  const void * untyped_member)
{
  const builtin_interfaces__msg__Time__Sequence * member =
    (const builtin_interfaces__msg__Time__Sequence *)(untyped_member);
  return member->size;
}

const void * whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_const_function__AudioTranscript__seg_start_time(
  const void * untyped_member, size_t index)
{
  const builtin_interfaces__msg__Time__Sequence * member =
    (const builtin_interfaces__msg__Time__Sequence *)(untyped_member);
  return &member->data[index];
}

void * whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_function__AudioTranscript__seg_start_time(
  void * untyped_member, size_t index)
{
  builtin_interfaces__msg__Time__Sequence * member =
    (builtin_interfaces__msg__Time__Sequence *)(untyped_member);
  return &member->data[index];
}

void whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__fetch_function__AudioTranscript__seg_start_time(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const builtin_interfaces__msg__Time * item =
    ((const builtin_interfaces__msg__Time *)
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_const_function__AudioTranscript__seg_start_time(untyped_member, index));
  builtin_interfaces__msg__Time * value =
    (builtin_interfaces__msg__Time *)(untyped_value);
  *value = *item;
}

void whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__assign_function__AudioTranscript__seg_start_time(
  void * untyped_member, size_t index, const void * untyped_value)
{
  builtin_interfaces__msg__Time * item =
    ((builtin_interfaces__msg__Time *)
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_function__AudioTranscript__seg_start_time(untyped_member, index));
  const builtin_interfaces__msg__Time * value =
    (const builtin_interfaces__msg__Time *)(untyped_value);
  *item = *value;
}

bool whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__resize_function__AudioTranscript__seg_start_time(
  void * untyped_member, size_t size)
{
  builtin_interfaces__msg__Time__Sequence * member =
    (builtin_interfaces__msg__Time__Sequence *)(untyped_member);
  builtin_interfaces__msg__Time__Sequence__fini(member);
  return builtin_interfaces__msg__Time__Sequence__init(member, size);
}

size_t whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__size_function__AudioTranscript__seg_duration_ms(
  const void * untyped_member)
{
  const rosidl_runtime_c__int32__Sequence * member =
    (const rosidl_runtime_c__int32__Sequence *)(untyped_member);
  return member->size;
}

const void * whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_const_function__AudioTranscript__seg_duration_ms(
  const void * untyped_member, size_t index)
{
  const rosidl_runtime_c__int32__Sequence * member =
    (const rosidl_runtime_c__int32__Sequence *)(untyped_member);
  return &member->data[index];
}

void * whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_function__AudioTranscript__seg_duration_ms(
  void * untyped_member, size_t index)
{
  rosidl_runtime_c__int32__Sequence * member =
    (rosidl_runtime_c__int32__Sequence *)(untyped_member);
  return &member->data[index];
}

void whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__fetch_function__AudioTranscript__seg_duration_ms(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const int32_t * item =
    ((const int32_t *)
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_const_function__AudioTranscript__seg_duration_ms(untyped_member, index));
  int32_t * value =
    (int32_t *)(untyped_value);
  *value = *item;
}

void whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__assign_function__AudioTranscript__seg_duration_ms(
  void * untyped_member, size_t index, const void * untyped_value)
{
  int32_t * item =
    ((int32_t *)
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_function__AudioTranscript__seg_duration_ms(untyped_member, index));
  const int32_t * value =
    (const int32_t *)(untyped_value);
  *item = *value;
}

bool whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__resize_function__AudioTranscript__seg_duration_ms(
  void * untyped_member, size_t size)
{
  rosidl_runtime_c__int32__Sequence * member =
    (rosidl_runtime_c__int32__Sequence *)(untyped_member);
  rosidl_runtime_c__int32__Sequence__fini(member);
  return rosidl_runtime_c__int32__Sequence__init(member, size);
}

static rosidl_typesupport_introspection_c__MessageMember whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__AudioTranscript_message_member_array[7] = {
  {
    "words",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_STRING,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl__msg__AudioTranscript, words),  // bytes offset in struct
    NULL,  // default value
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__size_function__AudioTranscript__words,  // size() function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_const_function__AudioTranscript__words,  // get_const(index) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_function__AudioTranscript__words,  // get(index) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__fetch_function__AudioTranscript__words,  // fetch(index, &value) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__assign_function__AudioTranscript__words,  // assign(index, value) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__resize_function__AudioTranscript__words  // resize(index) function pointer
  },
  {
    "probs",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_FLOAT,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl__msg__AudioTranscript, probs),  // bytes offset in struct
    NULL,  // default value
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__size_function__AudioTranscript__probs,  // size() function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_const_function__AudioTranscript__probs,  // get_const(index) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_function__AudioTranscript__probs,  // get(index) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__fetch_function__AudioTranscript__probs,  // fetch(index, &value) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__assign_function__AudioTranscript__probs,  // assign(index, value) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__resize_function__AudioTranscript__probs  // resize(index) function pointer
  },
  {
    "occ",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_INT32,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl__msg__AudioTranscript, occ),  // bytes offset in struct
    NULL,  // default value
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__size_function__AudioTranscript__occ,  // size() function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_const_function__AudioTranscript__occ,  // get_const(index) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_function__AudioTranscript__occ,  // get(index) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__fetch_function__AudioTranscript__occ,  // fetch(index, &value) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__assign_function__AudioTranscript__occ,  // assign(index, value) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__resize_function__AudioTranscript__occ  // resize(index) function pointer
  },
  {
    "seg_start_words_id",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_INT32,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl__msg__AudioTranscript, seg_start_words_id),  // bytes offset in struct
    NULL,  // default value
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__size_function__AudioTranscript__seg_start_words_id,  // size() function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_const_function__AudioTranscript__seg_start_words_id,  // get_const(index) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_function__AudioTranscript__seg_start_words_id,  // get(index) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__fetch_function__AudioTranscript__seg_start_words_id,  // fetch(index, &value) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__assign_function__AudioTranscript__seg_start_words_id,  // assign(index, value) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__resize_function__AudioTranscript__seg_start_words_id  // resize(index) function pointer
  },
  {
    "seg_start_time",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_MESSAGE,  // type
    0,  // upper bound of string
    NULL,  // members of sub message (initialized later)
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl__msg__AudioTranscript, seg_start_time),  // bytes offset in struct
    NULL,  // default value
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__size_function__AudioTranscript__seg_start_time,  // size() function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_const_function__AudioTranscript__seg_start_time,  // get_const(index) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_function__AudioTranscript__seg_start_time,  // get(index) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__fetch_function__AudioTranscript__seg_start_time,  // fetch(index, &value) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__assign_function__AudioTranscript__seg_start_time,  // assign(index, value) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__resize_function__AudioTranscript__seg_start_time  // resize(index) function pointer
  },
  {
    "seg_duration_ms",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_INT32,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl__msg__AudioTranscript, seg_duration_ms),  // bytes offset in struct
    NULL,  // default value
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__size_function__AudioTranscript__seg_duration_ms,  // size() function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_const_function__AudioTranscript__seg_duration_ms,  // get_const(index) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__get_function__AudioTranscript__seg_duration_ms,  // get(index) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__fetch_function__AudioTranscript__seg_duration_ms,  // fetch(index, &value) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__assign_function__AudioTranscript__seg_duration_ms,  // assign(index, value) function pointer
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__resize_function__AudioTranscript__seg_duration_ms  // resize(index) function pointer
  },
  {
    "active_index",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_INT32,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl__msg__AudioTranscript, active_index),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  }
};

static const rosidl_typesupport_introspection_c__MessageMembers whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__AudioTranscript_message_members = {
  "whisper_idl__msg",  // message namespace
  "AudioTranscript",  // message name
  7,  // number of fields
  sizeof(whisper_idl__msg__AudioTranscript),
  whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__AudioTranscript_message_member_array,  // message members
  whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__AudioTranscript_init_function,  // function to initialize message memory (memory has to be allocated)
  whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__AudioTranscript_fini_function  // function to terminate message instance (will not free memory)
};

// this is not const since it must be initialized on first access
// since C does not allow non-integral compile-time constants
static rosidl_message_type_support_t whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__AudioTranscript_message_type_support_handle = {
  0,
  &whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__AudioTranscript_message_members,
  get_message_typesupport_handle_function,
};

ROSIDL_TYPESUPPORT_INTROSPECTION_C_EXPORT_whisper_idl
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, whisper_idl, msg, AudioTranscript)() {
  whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__AudioTranscript_message_member_array[4].members_ =
    ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, builtin_interfaces, msg, Time)();
  if (!whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__AudioTranscript_message_type_support_handle.typesupport_identifier) {
    whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__AudioTranscript_message_type_support_handle.typesupport_identifier =
      rosidl_typesupport_introspection_c__identifier;
  }
  return &whisper_idl__msg__AudioTranscript__rosidl_typesupport_introspection_c__AudioTranscript_message_type_support_handle;
}
#ifdef __cplusplus
}
#endif
