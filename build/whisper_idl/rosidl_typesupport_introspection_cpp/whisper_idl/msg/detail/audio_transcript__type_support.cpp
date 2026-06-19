// generated from rosidl_typesupport_introspection_cpp/resource/idl__type_support.cpp.em
// with input from whisper_idl:msg/AudioTranscript.idl
// generated code does not contain a copyright notice

#include "array"
#include "cstddef"
#include "string"
#include "vector"
#include "rosidl_runtime_c/message_type_support_struct.h"
#include "rosidl_typesupport_cpp/message_type_support.hpp"
#include "rosidl_typesupport_interface/macros.h"
#include "whisper_idl/msg/detail/audio_transcript__struct.hpp"
#include "rosidl_typesupport_introspection_cpp/field_types.hpp"
#include "rosidl_typesupport_introspection_cpp/identifier.hpp"
#include "rosidl_typesupport_introspection_cpp/message_introspection.hpp"
#include "rosidl_typesupport_introspection_cpp/message_type_support_decl.hpp"
#include "rosidl_typesupport_introspection_cpp/visibility_control.h"

namespace whisper_idl
{

namespace msg
{

namespace rosidl_typesupport_introspection_cpp
{

void AudioTranscript_init_function(
  void * message_memory, rosidl_runtime_cpp::MessageInitialization _init)
{
  new (message_memory) whisper_idl::msg::AudioTranscript(_init);
}

void AudioTranscript_fini_function(void * message_memory)
{
  auto typed_message = static_cast<whisper_idl::msg::AudioTranscript *>(message_memory);
  typed_message->~AudioTranscript();
}

size_t size_function__AudioTranscript__words(const void * untyped_member)
{
  const auto * member = reinterpret_cast<const std::vector<std::string> *>(untyped_member);
  return member->size();
}

const void * get_const_function__AudioTranscript__words(const void * untyped_member, size_t index)
{
  const auto & member =
    *reinterpret_cast<const std::vector<std::string> *>(untyped_member);
  return &member[index];
}

void * get_function__AudioTranscript__words(void * untyped_member, size_t index)
{
  auto & member =
    *reinterpret_cast<std::vector<std::string> *>(untyped_member);
  return &member[index];
}

void fetch_function__AudioTranscript__words(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const auto & item = *reinterpret_cast<const std::string *>(
    get_const_function__AudioTranscript__words(untyped_member, index));
  auto & value = *reinterpret_cast<std::string *>(untyped_value);
  value = item;
}

void assign_function__AudioTranscript__words(
  void * untyped_member, size_t index, const void * untyped_value)
{
  auto & item = *reinterpret_cast<std::string *>(
    get_function__AudioTranscript__words(untyped_member, index));
  const auto & value = *reinterpret_cast<const std::string *>(untyped_value);
  item = value;
}

void resize_function__AudioTranscript__words(void * untyped_member, size_t size)
{
  auto * member =
    reinterpret_cast<std::vector<std::string> *>(untyped_member);
  member->resize(size);
}

size_t size_function__AudioTranscript__probs(const void * untyped_member)
{
  const auto * member = reinterpret_cast<const std::vector<float> *>(untyped_member);
  return member->size();
}

const void * get_const_function__AudioTranscript__probs(const void * untyped_member, size_t index)
{
  const auto & member =
    *reinterpret_cast<const std::vector<float> *>(untyped_member);
  return &member[index];
}

void * get_function__AudioTranscript__probs(void * untyped_member, size_t index)
{
  auto & member =
    *reinterpret_cast<std::vector<float> *>(untyped_member);
  return &member[index];
}

void fetch_function__AudioTranscript__probs(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const auto & item = *reinterpret_cast<const float *>(
    get_const_function__AudioTranscript__probs(untyped_member, index));
  auto & value = *reinterpret_cast<float *>(untyped_value);
  value = item;
}

void assign_function__AudioTranscript__probs(
  void * untyped_member, size_t index, const void * untyped_value)
{
  auto & item = *reinterpret_cast<float *>(
    get_function__AudioTranscript__probs(untyped_member, index));
  const auto & value = *reinterpret_cast<const float *>(untyped_value);
  item = value;
}

void resize_function__AudioTranscript__probs(void * untyped_member, size_t size)
{
  auto * member =
    reinterpret_cast<std::vector<float> *>(untyped_member);
  member->resize(size);
}

size_t size_function__AudioTranscript__occ(const void * untyped_member)
{
  const auto * member = reinterpret_cast<const std::vector<int32_t> *>(untyped_member);
  return member->size();
}

const void * get_const_function__AudioTranscript__occ(const void * untyped_member, size_t index)
{
  const auto & member =
    *reinterpret_cast<const std::vector<int32_t> *>(untyped_member);
  return &member[index];
}

void * get_function__AudioTranscript__occ(void * untyped_member, size_t index)
{
  auto & member =
    *reinterpret_cast<std::vector<int32_t> *>(untyped_member);
  return &member[index];
}

void fetch_function__AudioTranscript__occ(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const auto & item = *reinterpret_cast<const int32_t *>(
    get_const_function__AudioTranscript__occ(untyped_member, index));
  auto & value = *reinterpret_cast<int32_t *>(untyped_value);
  value = item;
}

void assign_function__AudioTranscript__occ(
  void * untyped_member, size_t index, const void * untyped_value)
{
  auto & item = *reinterpret_cast<int32_t *>(
    get_function__AudioTranscript__occ(untyped_member, index));
  const auto & value = *reinterpret_cast<const int32_t *>(untyped_value);
  item = value;
}

void resize_function__AudioTranscript__occ(void * untyped_member, size_t size)
{
  auto * member =
    reinterpret_cast<std::vector<int32_t> *>(untyped_member);
  member->resize(size);
}

size_t size_function__AudioTranscript__seg_start_words_id(const void * untyped_member)
{
  const auto * member = reinterpret_cast<const std::vector<int32_t> *>(untyped_member);
  return member->size();
}

const void * get_const_function__AudioTranscript__seg_start_words_id(const void * untyped_member, size_t index)
{
  const auto & member =
    *reinterpret_cast<const std::vector<int32_t> *>(untyped_member);
  return &member[index];
}

void * get_function__AudioTranscript__seg_start_words_id(void * untyped_member, size_t index)
{
  auto & member =
    *reinterpret_cast<std::vector<int32_t> *>(untyped_member);
  return &member[index];
}

void fetch_function__AudioTranscript__seg_start_words_id(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const auto & item = *reinterpret_cast<const int32_t *>(
    get_const_function__AudioTranscript__seg_start_words_id(untyped_member, index));
  auto & value = *reinterpret_cast<int32_t *>(untyped_value);
  value = item;
}

void assign_function__AudioTranscript__seg_start_words_id(
  void * untyped_member, size_t index, const void * untyped_value)
{
  auto & item = *reinterpret_cast<int32_t *>(
    get_function__AudioTranscript__seg_start_words_id(untyped_member, index));
  const auto & value = *reinterpret_cast<const int32_t *>(untyped_value);
  item = value;
}

void resize_function__AudioTranscript__seg_start_words_id(void * untyped_member, size_t size)
{
  auto * member =
    reinterpret_cast<std::vector<int32_t> *>(untyped_member);
  member->resize(size);
}

size_t size_function__AudioTranscript__seg_start_time(const void * untyped_member)
{
  const auto * member = reinterpret_cast<const std::vector<builtin_interfaces::msg::Time> *>(untyped_member);
  return member->size();
}

const void * get_const_function__AudioTranscript__seg_start_time(const void * untyped_member, size_t index)
{
  const auto & member =
    *reinterpret_cast<const std::vector<builtin_interfaces::msg::Time> *>(untyped_member);
  return &member[index];
}

void * get_function__AudioTranscript__seg_start_time(void * untyped_member, size_t index)
{
  auto & member =
    *reinterpret_cast<std::vector<builtin_interfaces::msg::Time> *>(untyped_member);
  return &member[index];
}

void fetch_function__AudioTranscript__seg_start_time(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const auto & item = *reinterpret_cast<const builtin_interfaces::msg::Time *>(
    get_const_function__AudioTranscript__seg_start_time(untyped_member, index));
  auto & value = *reinterpret_cast<builtin_interfaces::msg::Time *>(untyped_value);
  value = item;
}

void assign_function__AudioTranscript__seg_start_time(
  void * untyped_member, size_t index, const void * untyped_value)
{
  auto & item = *reinterpret_cast<builtin_interfaces::msg::Time *>(
    get_function__AudioTranscript__seg_start_time(untyped_member, index));
  const auto & value = *reinterpret_cast<const builtin_interfaces::msg::Time *>(untyped_value);
  item = value;
}

void resize_function__AudioTranscript__seg_start_time(void * untyped_member, size_t size)
{
  auto * member =
    reinterpret_cast<std::vector<builtin_interfaces::msg::Time> *>(untyped_member);
  member->resize(size);
}

size_t size_function__AudioTranscript__seg_duration_ms(const void * untyped_member)
{
  const auto * member = reinterpret_cast<const std::vector<int32_t> *>(untyped_member);
  return member->size();
}

const void * get_const_function__AudioTranscript__seg_duration_ms(const void * untyped_member, size_t index)
{
  const auto & member =
    *reinterpret_cast<const std::vector<int32_t> *>(untyped_member);
  return &member[index];
}

void * get_function__AudioTranscript__seg_duration_ms(void * untyped_member, size_t index)
{
  auto & member =
    *reinterpret_cast<std::vector<int32_t> *>(untyped_member);
  return &member[index];
}

void fetch_function__AudioTranscript__seg_duration_ms(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const auto & item = *reinterpret_cast<const int32_t *>(
    get_const_function__AudioTranscript__seg_duration_ms(untyped_member, index));
  auto & value = *reinterpret_cast<int32_t *>(untyped_value);
  value = item;
}

void assign_function__AudioTranscript__seg_duration_ms(
  void * untyped_member, size_t index, const void * untyped_value)
{
  auto & item = *reinterpret_cast<int32_t *>(
    get_function__AudioTranscript__seg_duration_ms(untyped_member, index));
  const auto & value = *reinterpret_cast<const int32_t *>(untyped_value);
  item = value;
}

void resize_function__AudioTranscript__seg_duration_ms(void * untyped_member, size_t size)
{
  auto * member =
    reinterpret_cast<std::vector<int32_t> *>(untyped_member);
  member->resize(size);
}

static const ::rosidl_typesupport_introspection_cpp::MessageMember AudioTranscript_message_member_array[7] = {
  {
    "words",  // name
    ::rosidl_typesupport_introspection_cpp::ROS_TYPE_STRING,  // type
    0,  // upper bound of string
    nullptr,  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl::msg::AudioTranscript, words),  // bytes offset in struct
    nullptr,  // default value
    size_function__AudioTranscript__words,  // size() function pointer
    get_const_function__AudioTranscript__words,  // get_const(index) function pointer
    get_function__AudioTranscript__words,  // get(index) function pointer
    fetch_function__AudioTranscript__words,  // fetch(index, &value) function pointer
    assign_function__AudioTranscript__words,  // assign(index, value) function pointer
    resize_function__AudioTranscript__words  // resize(index) function pointer
  },
  {
    "probs",  // name
    ::rosidl_typesupport_introspection_cpp::ROS_TYPE_FLOAT,  // type
    0,  // upper bound of string
    nullptr,  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl::msg::AudioTranscript, probs),  // bytes offset in struct
    nullptr,  // default value
    size_function__AudioTranscript__probs,  // size() function pointer
    get_const_function__AudioTranscript__probs,  // get_const(index) function pointer
    get_function__AudioTranscript__probs,  // get(index) function pointer
    fetch_function__AudioTranscript__probs,  // fetch(index, &value) function pointer
    assign_function__AudioTranscript__probs,  // assign(index, value) function pointer
    resize_function__AudioTranscript__probs  // resize(index) function pointer
  },
  {
    "occ",  // name
    ::rosidl_typesupport_introspection_cpp::ROS_TYPE_INT32,  // type
    0,  // upper bound of string
    nullptr,  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl::msg::AudioTranscript, occ),  // bytes offset in struct
    nullptr,  // default value
    size_function__AudioTranscript__occ,  // size() function pointer
    get_const_function__AudioTranscript__occ,  // get_const(index) function pointer
    get_function__AudioTranscript__occ,  // get(index) function pointer
    fetch_function__AudioTranscript__occ,  // fetch(index, &value) function pointer
    assign_function__AudioTranscript__occ,  // assign(index, value) function pointer
    resize_function__AudioTranscript__occ  // resize(index) function pointer
  },
  {
    "seg_start_words_id",  // name
    ::rosidl_typesupport_introspection_cpp::ROS_TYPE_INT32,  // type
    0,  // upper bound of string
    nullptr,  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl::msg::AudioTranscript, seg_start_words_id),  // bytes offset in struct
    nullptr,  // default value
    size_function__AudioTranscript__seg_start_words_id,  // size() function pointer
    get_const_function__AudioTranscript__seg_start_words_id,  // get_const(index) function pointer
    get_function__AudioTranscript__seg_start_words_id,  // get(index) function pointer
    fetch_function__AudioTranscript__seg_start_words_id,  // fetch(index, &value) function pointer
    assign_function__AudioTranscript__seg_start_words_id,  // assign(index, value) function pointer
    resize_function__AudioTranscript__seg_start_words_id  // resize(index) function pointer
  },
  {
    "seg_start_time",  // name
    ::rosidl_typesupport_introspection_cpp::ROS_TYPE_MESSAGE,  // type
    0,  // upper bound of string
    ::rosidl_typesupport_introspection_cpp::get_message_type_support_handle<builtin_interfaces::msg::Time>(),  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl::msg::AudioTranscript, seg_start_time),  // bytes offset in struct
    nullptr,  // default value
    size_function__AudioTranscript__seg_start_time,  // size() function pointer
    get_const_function__AudioTranscript__seg_start_time,  // get_const(index) function pointer
    get_function__AudioTranscript__seg_start_time,  // get(index) function pointer
    fetch_function__AudioTranscript__seg_start_time,  // fetch(index, &value) function pointer
    assign_function__AudioTranscript__seg_start_time,  // assign(index, value) function pointer
    resize_function__AudioTranscript__seg_start_time  // resize(index) function pointer
  },
  {
    "seg_duration_ms",  // name
    ::rosidl_typesupport_introspection_cpp::ROS_TYPE_INT32,  // type
    0,  // upper bound of string
    nullptr,  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl::msg::AudioTranscript, seg_duration_ms),  // bytes offset in struct
    nullptr,  // default value
    size_function__AudioTranscript__seg_duration_ms,  // size() function pointer
    get_const_function__AudioTranscript__seg_duration_ms,  // get_const(index) function pointer
    get_function__AudioTranscript__seg_duration_ms,  // get(index) function pointer
    fetch_function__AudioTranscript__seg_duration_ms,  // fetch(index, &value) function pointer
    assign_function__AudioTranscript__seg_duration_ms,  // assign(index, value) function pointer
    resize_function__AudioTranscript__seg_duration_ms  // resize(index) function pointer
  },
  {
    "active_index",  // name
    ::rosidl_typesupport_introspection_cpp::ROS_TYPE_INT32,  // type
    0,  // upper bound of string
    nullptr,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl::msg::AudioTranscript, active_index),  // bytes offset in struct
    nullptr,  // default value
    nullptr,  // size() function pointer
    nullptr,  // get_const(index) function pointer
    nullptr,  // get(index) function pointer
    nullptr,  // fetch(index, &value) function pointer
    nullptr,  // assign(index, value) function pointer
    nullptr  // resize(index) function pointer
  }
};

static const ::rosidl_typesupport_introspection_cpp::MessageMembers AudioTranscript_message_members = {
  "whisper_idl::msg",  // message namespace
  "AudioTranscript",  // message name
  7,  // number of fields
  sizeof(whisper_idl::msg::AudioTranscript),
  AudioTranscript_message_member_array,  // message members
  AudioTranscript_init_function,  // function to initialize message memory (memory has to be allocated)
  AudioTranscript_fini_function  // function to terminate message instance (will not free memory)
};

static const rosidl_message_type_support_t AudioTranscript_message_type_support_handle = {
  ::rosidl_typesupport_introspection_cpp::typesupport_identifier,
  &AudioTranscript_message_members,
  get_message_typesupport_handle_function,
};

}  // namespace rosidl_typesupport_introspection_cpp

}  // namespace msg

}  // namespace whisper_idl


namespace rosidl_typesupport_introspection_cpp
{

template<>
ROSIDL_TYPESUPPORT_INTROSPECTION_CPP_PUBLIC
const rosidl_message_type_support_t *
get_message_type_support_handle<whisper_idl::msg::AudioTranscript>()
{
  return &::whisper_idl::msg::rosidl_typesupport_introspection_cpp::AudioTranscript_message_type_support_handle;
}

}  // namespace rosidl_typesupport_introspection_cpp

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_INTROSPECTION_CPP_PUBLIC
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_cpp, whisper_idl, msg, AudioTranscript)() {
  return &::whisper_idl::msg::rosidl_typesupport_introspection_cpp::AudioTranscript_message_type_support_handle;
}

#ifdef __cplusplus
}
#endif
