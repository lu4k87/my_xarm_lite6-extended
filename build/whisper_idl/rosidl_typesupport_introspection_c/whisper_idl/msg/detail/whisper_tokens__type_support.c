// generated from rosidl_typesupport_introspection_c/resource/idl__type_support.c.em
// with input from whisper_idl:msg/WhisperTokens.idl
// generated code does not contain a copyright notice

#include <stddef.h>
#include "whisper_idl/msg/detail/whisper_tokens__rosidl_typesupport_introspection_c.h"
#include "whisper_idl/msg/rosidl_typesupport_introspection_c__visibility_control.h"
#include "rosidl_typesupport_introspection_c/field_types.h"
#include "rosidl_typesupport_introspection_c/identifier.h"
#include "rosidl_typesupport_introspection_c/message_introspection.h"
#include "whisper_idl/msg/detail/whisper_tokens__functions.h"
#include "whisper_idl/msg/detail/whisper_tokens__struct.h"


// Include directives for member types
// Member `stamp`
#include "builtin_interfaces/msg/time.h"
// Member `stamp`
#include "builtin_interfaces/msg/detail/time__rosidl_typesupport_introspection_c.h"
// Member `token_ids`
// Member `token_probs`
// Member `segment_start_token_idxs`
// Member `start_times`
// Member `end_times`
#include "rosidl_runtime_c/primitives_sequence_functions.h"
// Member `token_texts`
#include "rosidl_runtime_c/string_functions.h"

#ifdef __cplusplus
extern "C"
{
#endif

void whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__WhisperTokens_init_function(
  void * message_memory, enum rosidl_runtime_c__message_initialization _init)
{
  // TODO(karsten1987): initializers are not yet implemented for typesupport c
  // see https://github.com/ros2/ros2/issues/397
  (void) _init;
  whisper_idl__msg__WhisperTokens__init(message_memory);
}

void whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__WhisperTokens_fini_function(void * message_memory)
{
  whisper_idl__msg__WhisperTokens__fini(message_memory);
}

size_t whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__size_function__WhisperTokens__token_ids(
  const void * untyped_member)
{
  const rosidl_runtime_c__int32__Sequence * member =
    (const rosidl_runtime_c__int32__Sequence *)(untyped_member);
  return member->size;
}

const void * whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_const_function__WhisperTokens__token_ids(
  const void * untyped_member, size_t index)
{
  const rosidl_runtime_c__int32__Sequence * member =
    (const rosidl_runtime_c__int32__Sequence *)(untyped_member);
  return &member->data[index];
}

void * whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_function__WhisperTokens__token_ids(
  void * untyped_member, size_t index)
{
  rosidl_runtime_c__int32__Sequence * member =
    (rosidl_runtime_c__int32__Sequence *)(untyped_member);
  return &member->data[index];
}

void whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__fetch_function__WhisperTokens__token_ids(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const int32_t * item =
    ((const int32_t *)
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_const_function__WhisperTokens__token_ids(untyped_member, index));
  int32_t * value =
    (int32_t *)(untyped_value);
  *value = *item;
}

void whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__assign_function__WhisperTokens__token_ids(
  void * untyped_member, size_t index, const void * untyped_value)
{
  int32_t * item =
    ((int32_t *)
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_function__WhisperTokens__token_ids(untyped_member, index));
  const int32_t * value =
    (const int32_t *)(untyped_value);
  *item = *value;
}

bool whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__resize_function__WhisperTokens__token_ids(
  void * untyped_member, size_t size)
{
  rosidl_runtime_c__int32__Sequence * member =
    (rosidl_runtime_c__int32__Sequence *)(untyped_member);
  rosidl_runtime_c__int32__Sequence__fini(member);
  return rosidl_runtime_c__int32__Sequence__init(member, size);
}

size_t whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__size_function__WhisperTokens__token_texts(
  const void * untyped_member)
{
  const rosidl_runtime_c__String__Sequence * member =
    (const rosidl_runtime_c__String__Sequence *)(untyped_member);
  return member->size;
}

const void * whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_const_function__WhisperTokens__token_texts(
  const void * untyped_member, size_t index)
{
  const rosidl_runtime_c__String__Sequence * member =
    (const rosidl_runtime_c__String__Sequence *)(untyped_member);
  return &member->data[index];
}

void * whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_function__WhisperTokens__token_texts(
  void * untyped_member, size_t index)
{
  rosidl_runtime_c__String__Sequence * member =
    (rosidl_runtime_c__String__Sequence *)(untyped_member);
  return &member->data[index];
}

void whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__fetch_function__WhisperTokens__token_texts(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const rosidl_runtime_c__String * item =
    ((const rosidl_runtime_c__String *)
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_const_function__WhisperTokens__token_texts(untyped_member, index));
  rosidl_runtime_c__String * value =
    (rosidl_runtime_c__String *)(untyped_value);
  *value = *item;
}

void whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__assign_function__WhisperTokens__token_texts(
  void * untyped_member, size_t index, const void * untyped_value)
{
  rosidl_runtime_c__String * item =
    ((rosidl_runtime_c__String *)
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_function__WhisperTokens__token_texts(untyped_member, index));
  const rosidl_runtime_c__String * value =
    (const rosidl_runtime_c__String *)(untyped_value);
  *item = *value;
}

bool whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__resize_function__WhisperTokens__token_texts(
  void * untyped_member, size_t size)
{
  rosidl_runtime_c__String__Sequence * member =
    (rosidl_runtime_c__String__Sequence *)(untyped_member);
  rosidl_runtime_c__String__Sequence__fini(member);
  return rosidl_runtime_c__String__Sequence__init(member, size);
}

size_t whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__size_function__WhisperTokens__token_probs(
  const void * untyped_member)
{
  const rosidl_runtime_c__float__Sequence * member =
    (const rosidl_runtime_c__float__Sequence *)(untyped_member);
  return member->size;
}

const void * whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_const_function__WhisperTokens__token_probs(
  const void * untyped_member, size_t index)
{
  const rosidl_runtime_c__float__Sequence * member =
    (const rosidl_runtime_c__float__Sequence *)(untyped_member);
  return &member->data[index];
}

void * whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_function__WhisperTokens__token_probs(
  void * untyped_member, size_t index)
{
  rosidl_runtime_c__float__Sequence * member =
    (rosidl_runtime_c__float__Sequence *)(untyped_member);
  return &member->data[index];
}

void whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__fetch_function__WhisperTokens__token_probs(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const float * item =
    ((const float *)
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_const_function__WhisperTokens__token_probs(untyped_member, index));
  float * value =
    (float *)(untyped_value);
  *value = *item;
}

void whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__assign_function__WhisperTokens__token_probs(
  void * untyped_member, size_t index, const void * untyped_value)
{
  float * item =
    ((float *)
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_function__WhisperTokens__token_probs(untyped_member, index));
  const float * value =
    (const float *)(untyped_value);
  *item = *value;
}

bool whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__resize_function__WhisperTokens__token_probs(
  void * untyped_member, size_t size)
{
  rosidl_runtime_c__float__Sequence * member =
    (rosidl_runtime_c__float__Sequence *)(untyped_member);
  rosidl_runtime_c__float__Sequence__fini(member);
  return rosidl_runtime_c__float__Sequence__init(member, size);
}

size_t whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__size_function__WhisperTokens__segment_start_token_idxs(
  const void * untyped_member)
{
  const rosidl_runtime_c__int32__Sequence * member =
    (const rosidl_runtime_c__int32__Sequence *)(untyped_member);
  return member->size;
}

const void * whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_const_function__WhisperTokens__segment_start_token_idxs(
  const void * untyped_member, size_t index)
{
  const rosidl_runtime_c__int32__Sequence * member =
    (const rosidl_runtime_c__int32__Sequence *)(untyped_member);
  return &member->data[index];
}

void * whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_function__WhisperTokens__segment_start_token_idxs(
  void * untyped_member, size_t index)
{
  rosidl_runtime_c__int32__Sequence * member =
    (rosidl_runtime_c__int32__Sequence *)(untyped_member);
  return &member->data[index];
}

void whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__fetch_function__WhisperTokens__segment_start_token_idxs(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const int32_t * item =
    ((const int32_t *)
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_const_function__WhisperTokens__segment_start_token_idxs(untyped_member, index));
  int32_t * value =
    (int32_t *)(untyped_value);
  *value = *item;
}

void whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__assign_function__WhisperTokens__segment_start_token_idxs(
  void * untyped_member, size_t index, const void * untyped_value)
{
  int32_t * item =
    ((int32_t *)
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_function__WhisperTokens__segment_start_token_idxs(untyped_member, index));
  const int32_t * value =
    (const int32_t *)(untyped_value);
  *item = *value;
}

bool whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__resize_function__WhisperTokens__segment_start_token_idxs(
  void * untyped_member, size_t size)
{
  rosidl_runtime_c__int32__Sequence * member =
    (rosidl_runtime_c__int32__Sequence *)(untyped_member);
  rosidl_runtime_c__int32__Sequence__fini(member);
  return rosidl_runtime_c__int32__Sequence__init(member, size);
}

size_t whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__size_function__WhisperTokens__start_times(
  const void * untyped_member)
{
  const rosidl_runtime_c__int64__Sequence * member =
    (const rosidl_runtime_c__int64__Sequence *)(untyped_member);
  return member->size;
}

const void * whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_const_function__WhisperTokens__start_times(
  const void * untyped_member, size_t index)
{
  const rosidl_runtime_c__int64__Sequence * member =
    (const rosidl_runtime_c__int64__Sequence *)(untyped_member);
  return &member->data[index];
}

void * whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_function__WhisperTokens__start_times(
  void * untyped_member, size_t index)
{
  rosidl_runtime_c__int64__Sequence * member =
    (rosidl_runtime_c__int64__Sequence *)(untyped_member);
  return &member->data[index];
}

void whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__fetch_function__WhisperTokens__start_times(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const int64_t * item =
    ((const int64_t *)
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_const_function__WhisperTokens__start_times(untyped_member, index));
  int64_t * value =
    (int64_t *)(untyped_value);
  *value = *item;
}

void whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__assign_function__WhisperTokens__start_times(
  void * untyped_member, size_t index, const void * untyped_value)
{
  int64_t * item =
    ((int64_t *)
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_function__WhisperTokens__start_times(untyped_member, index));
  const int64_t * value =
    (const int64_t *)(untyped_value);
  *item = *value;
}

bool whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__resize_function__WhisperTokens__start_times(
  void * untyped_member, size_t size)
{
  rosidl_runtime_c__int64__Sequence * member =
    (rosidl_runtime_c__int64__Sequence *)(untyped_member);
  rosidl_runtime_c__int64__Sequence__fini(member);
  return rosidl_runtime_c__int64__Sequence__init(member, size);
}

size_t whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__size_function__WhisperTokens__end_times(
  const void * untyped_member)
{
  const rosidl_runtime_c__int64__Sequence * member =
    (const rosidl_runtime_c__int64__Sequence *)(untyped_member);
  return member->size;
}

const void * whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_const_function__WhisperTokens__end_times(
  const void * untyped_member, size_t index)
{
  const rosidl_runtime_c__int64__Sequence * member =
    (const rosidl_runtime_c__int64__Sequence *)(untyped_member);
  return &member->data[index];
}

void * whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_function__WhisperTokens__end_times(
  void * untyped_member, size_t index)
{
  rosidl_runtime_c__int64__Sequence * member =
    (rosidl_runtime_c__int64__Sequence *)(untyped_member);
  return &member->data[index];
}

void whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__fetch_function__WhisperTokens__end_times(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const int64_t * item =
    ((const int64_t *)
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_const_function__WhisperTokens__end_times(untyped_member, index));
  int64_t * value =
    (int64_t *)(untyped_value);
  *value = *item;
}

void whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__assign_function__WhisperTokens__end_times(
  void * untyped_member, size_t index, const void * untyped_value)
{
  int64_t * item =
    ((int64_t *)
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_function__WhisperTokens__end_times(untyped_member, index));
  const int64_t * value =
    (const int64_t *)(untyped_value);
  *item = *value;
}

bool whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__resize_function__WhisperTokens__end_times(
  void * untyped_member, size_t size)
{
  rosidl_runtime_c__int64__Sequence * member =
    (rosidl_runtime_c__int64__Sequence *)(untyped_member);
  rosidl_runtime_c__int64__Sequence__fini(member);
  return rosidl_runtime_c__int64__Sequence__init(member, size);
}

static rosidl_typesupport_introspection_c__MessageMember whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__WhisperTokens_message_member_array[8] = {
  {
    "stamp",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_MESSAGE,  // type
    0,  // upper bound of string
    NULL,  // members of sub message (initialized later)
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl__msg__WhisperTokens, stamp),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  },
  {
    "token_ids",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_INT32,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl__msg__WhisperTokens, token_ids),  // bytes offset in struct
    NULL,  // default value
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__size_function__WhisperTokens__token_ids,  // size() function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_const_function__WhisperTokens__token_ids,  // get_const(index) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_function__WhisperTokens__token_ids,  // get(index) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__fetch_function__WhisperTokens__token_ids,  // fetch(index, &value) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__assign_function__WhisperTokens__token_ids,  // assign(index, value) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__resize_function__WhisperTokens__token_ids  // resize(index) function pointer
  },
  {
    "token_texts",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_STRING,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl__msg__WhisperTokens, token_texts),  // bytes offset in struct
    NULL,  // default value
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__size_function__WhisperTokens__token_texts,  // size() function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_const_function__WhisperTokens__token_texts,  // get_const(index) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_function__WhisperTokens__token_texts,  // get(index) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__fetch_function__WhisperTokens__token_texts,  // fetch(index, &value) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__assign_function__WhisperTokens__token_texts,  // assign(index, value) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__resize_function__WhisperTokens__token_texts  // resize(index) function pointer
  },
  {
    "token_probs",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_FLOAT,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl__msg__WhisperTokens, token_probs),  // bytes offset in struct
    NULL,  // default value
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__size_function__WhisperTokens__token_probs,  // size() function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_const_function__WhisperTokens__token_probs,  // get_const(index) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_function__WhisperTokens__token_probs,  // get(index) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__fetch_function__WhisperTokens__token_probs,  // fetch(index, &value) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__assign_function__WhisperTokens__token_probs,  // assign(index, value) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__resize_function__WhisperTokens__token_probs  // resize(index) function pointer
  },
  {
    "segment_start_token_idxs",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_INT32,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl__msg__WhisperTokens, segment_start_token_idxs),  // bytes offset in struct
    NULL,  // default value
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__size_function__WhisperTokens__segment_start_token_idxs,  // size() function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_const_function__WhisperTokens__segment_start_token_idxs,  // get_const(index) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_function__WhisperTokens__segment_start_token_idxs,  // get(index) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__fetch_function__WhisperTokens__segment_start_token_idxs,  // fetch(index, &value) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__assign_function__WhisperTokens__segment_start_token_idxs,  // assign(index, value) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__resize_function__WhisperTokens__segment_start_token_idxs  // resize(index) function pointer
  },
  {
    "start_times",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_INT64,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl__msg__WhisperTokens, start_times),  // bytes offset in struct
    NULL,  // default value
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__size_function__WhisperTokens__start_times,  // size() function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_const_function__WhisperTokens__start_times,  // get_const(index) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_function__WhisperTokens__start_times,  // get(index) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__fetch_function__WhisperTokens__start_times,  // fetch(index, &value) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__assign_function__WhisperTokens__start_times,  // assign(index, value) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__resize_function__WhisperTokens__start_times  // resize(index) function pointer
  },
  {
    "end_times",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_INT64,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl__msg__WhisperTokens, end_times),  // bytes offset in struct
    NULL,  // default value
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__size_function__WhisperTokens__end_times,  // size() function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_const_function__WhisperTokens__end_times,  // get_const(index) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__get_function__WhisperTokens__end_times,  // get(index) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__fetch_function__WhisperTokens__end_times,  // fetch(index, &value) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__assign_function__WhisperTokens__end_times,  // assign(index, value) function pointer
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__resize_function__WhisperTokens__end_times  // resize(index) function pointer
  },
  {
    "inference_duration",  // name
    rosidl_typesupport_introspection_c__ROS_TYPE_INT64,  // type
    0,  // upper bound of string
    NULL,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl__msg__WhisperTokens, inference_duration),  // bytes offset in struct
    NULL,  // default value
    NULL,  // size() function pointer
    NULL,  // get_const(index) function pointer
    NULL,  // get(index) function pointer
    NULL,  // fetch(index, &value) function pointer
    NULL,  // assign(index, value) function pointer
    NULL  // resize(index) function pointer
  }
};

static const rosidl_typesupport_introspection_c__MessageMembers whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__WhisperTokens_message_members = {
  "whisper_idl__msg",  // message namespace
  "WhisperTokens",  // message name
  8,  // number of fields
  sizeof(whisper_idl__msg__WhisperTokens),
  whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__WhisperTokens_message_member_array,  // message members
  whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__WhisperTokens_init_function,  // function to initialize message memory (memory has to be allocated)
  whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__WhisperTokens_fini_function  // function to terminate message instance (will not free memory)
};

// this is not const since it must be initialized on first access
// since C does not allow non-integral compile-time constants
static rosidl_message_type_support_t whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__WhisperTokens_message_type_support_handle = {
  0,
  &whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__WhisperTokens_message_members,
  get_message_typesupport_handle_function,
};

ROSIDL_TYPESUPPORT_INTROSPECTION_C_EXPORT_whisper_idl
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, whisper_idl, msg, WhisperTokens)() {
  whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__WhisperTokens_message_member_array[0].members_ =
    ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_c, builtin_interfaces, msg, Time)();
  if (!whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__WhisperTokens_message_type_support_handle.typesupport_identifier) {
    whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__WhisperTokens_message_type_support_handle.typesupport_identifier =
      rosidl_typesupport_introspection_c__identifier;
  }
  return &whisper_idl__msg__WhisperTokens__rosidl_typesupport_introspection_c__WhisperTokens_message_type_support_handle;
}
#ifdef __cplusplus
}
#endif
