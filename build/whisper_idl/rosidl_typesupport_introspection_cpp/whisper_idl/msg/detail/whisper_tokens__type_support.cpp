// generated from rosidl_typesupport_introspection_cpp/resource/idl__type_support.cpp.em
// with input from whisper_idl:msg/WhisperTokens.idl
// generated code does not contain a copyright notice

#include "array"
#include "cstddef"
#include "string"
#include "vector"
#include "rosidl_runtime_c/message_type_support_struct.h"
#include "rosidl_typesupport_cpp/message_type_support.hpp"
#include "rosidl_typesupport_interface/macros.h"
#include "whisper_idl/msg/detail/whisper_tokens__struct.hpp"
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

void WhisperTokens_init_function(
  void * message_memory, rosidl_runtime_cpp::MessageInitialization _init)
{
  new (message_memory) whisper_idl::msg::WhisperTokens(_init);
}

void WhisperTokens_fini_function(void * message_memory)
{
  auto typed_message = static_cast<whisper_idl::msg::WhisperTokens *>(message_memory);
  typed_message->~WhisperTokens();
}

size_t size_function__WhisperTokens__token_ids(const void * untyped_member)
{
  const auto * member = reinterpret_cast<const std::vector<int32_t> *>(untyped_member);
  return member->size();
}

const void * get_const_function__WhisperTokens__token_ids(const void * untyped_member, size_t index)
{
  const auto & member =
    *reinterpret_cast<const std::vector<int32_t> *>(untyped_member);
  return &member[index];
}

void * get_function__WhisperTokens__token_ids(void * untyped_member, size_t index)
{
  auto & member =
    *reinterpret_cast<std::vector<int32_t> *>(untyped_member);
  return &member[index];
}

void fetch_function__WhisperTokens__token_ids(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const auto & item = *reinterpret_cast<const int32_t *>(
    get_const_function__WhisperTokens__token_ids(untyped_member, index));
  auto & value = *reinterpret_cast<int32_t *>(untyped_value);
  value = item;
}

void assign_function__WhisperTokens__token_ids(
  void * untyped_member, size_t index, const void * untyped_value)
{
  auto & item = *reinterpret_cast<int32_t *>(
    get_function__WhisperTokens__token_ids(untyped_member, index));
  const auto & value = *reinterpret_cast<const int32_t *>(untyped_value);
  item = value;
}

void resize_function__WhisperTokens__token_ids(void * untyped_member, size_t size)
{
  auto * member =
    reinterpret_cast<std::vector<int32_t> *>(untyped_member);
  member->resize(size);
}

size_t size_function__WhisperTokens__token_texts(const void * untyped_member)
{
  const auto * member = reinterpret_cast<const std::vector<std::string> *>(untyped_member);
  return member->size();
}

const void * get_const_function__WhisperTokens__token_texts(const void * untyped_member, size_t index)
{
  const auto & member =
    *reinterpret_cast<const std::vector<std::string> *>(untyped_member);
  return &member[index];
}

void * get_function__WhisperTokens__token_texts(void * untyped_member, size_t index)
{
  auto & member =
    *reinterpret_cast<std::vector<std::string> *>(untyped_member);
  return &member[index];
}

void fetch_function__WhisperTokens__token_texts(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const auto & item = *reinterpret_cast<const std::string *>(
    get_const_function__WhisperTokens__token_texts(untyped_member, index));
  auto & value = *reinterpret_cast<std::string *>(untyped_value);
  value = item;
}

void assign_function__WhisperTokens__token_texts(
  void * untyped_member, size_t index, const void * untyped_value)
{
  auto & item = *reinterpret_cast<std::string *>(
    get_function__WhisperTokens__token_texts(untyped_member, index));
  const auto & value = *reinterpret_cast<const std::string *>(untyped_value);
  item = value;
}

void resize_function__WhisperTokens__token_texts(void * untyped_member, size_t size)
{
  auto * member =
    reinterpret_cast<std::vector<std::string> *>(untyped_member);
  member->resize(size);
}

size_t size_function__WhisperTokens__token_probs(const void * untyped_member)
{
  const auto * member = reinterpret_cast<const std::vector<float> *>(untyped_member);
  return member->size();
}

const void * get_const_function__WhisperTokens__token_probs(const void * untyped_member, size_t index)
{
  const auto & member =
    *reinterpret_cast<const std::vector<float> *>(untyped_member);
  return &member[index];
}

void * get_function__WhisperTokens__token_probs(void * untyped_member, size_t index)
{
  auto & member =
    *reinterpret_cast<std::vector<float> *>(untyped_member);
  return &member[index];
}

void fetch_function__WhisperTokens__token_probs(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const auto & item = *reinterpret_cast<const float *>(
    get_const_function__WhisperTokens__token_probs(untyped_member, index));
  auto & value = *reinterpret_cast<float *>(untyped_value);
  value = item;
}

void assign_function__WhisperTokens__token_probs(
  void * untyped_member, size_t index, const void * untyped_value)
{
  auto & item = *reinterpret_cast<float *>(
    get_function__WhisperTokens__token_probs(untyped_member, index));
  const auto & value = *reinterpret_cast<const float *>(untyped_value);
  item = value;
}

void resize_function__WhisperTokens__token_probs(void * untyped_member, size_t size)
{
  auto * member =
    reinterpret_cast<std::vector<float> *>(untyped_member);
  member->resize(size);
}

size_t size_function__WhisperTokens__segment_start_token_idxs(const void * untyped_member)
{
  const auto * member = reinterpret_cast<const std::vector<int32_t> *>(untyped_member);
  return member->size();
}

const void * get_const_function__WhisperTokens__segment_start_token_idxs(const void * untyped_member, size_t index)
{
  const auto & member =
    *reinterpret_cast<const std::vector<int32_t> *>(untyped_member);
  return &member[index];
}

void * get_function__WhisperTokens__segment_start_token_idxs(void * untyped_member, size_t index)
{
  auto & member =
    *reinterpret_cast<std::vector<int32_t> *>(untyped_member);
  return &member[index];
}

void fetch_function__WhisperTokens__segment_start_token_idxs(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const auto & item = *reinterpret_cast<const int32_t *>(
    get_const_function__WhisperTokens__segment_start_token_idxs(untyped_member, index));
  auto & value = *reinterpret_cast<int32_t *>(untyped_value);
  value = item;
}

void assign_function__WhisperTokens__segment_start_token_idxs(
  void * untyped_member, size_t index, const void * untyped_value)
{
  auto & item = *reinterpret_cast<int32_t *>(
    get_function__WhisperTokens__segment_start_token_idxs(untyped_member, index));
  const auto & value = *reinterpret_cast<const int32_t *>(untyped_value);
  item = value;
}

void resize_function__WhisperTokens__segment_start_token_idxs(void * untyped_member, size_t size)
{
  auto * member =
    reinterpret_cast<std::vector<int32_t> *>(untyped_member);
  member->resize(size);
}

size_t size_function__WhisperTokens__start_times(const void * untyped_member)
{
  const auto * member = reinterpret_cast<const std::vector<int64_t> *>(untyped_member);
  return member->size();
}

const void * get_const_function__WhisperTokens__start_times(const void * untyped_member, size_t index)
{
  const auto & member =
    *reinterpret_cast<const std::vector<int64_t> *>(untyped_member);
  return &member[index];
}

void * get_function__WhisperTokens__start_times(void * untyped_member, size_t index)
{
  auto & member =
    *reinterpret_cast<std::vector<int64_t> *>(untyped_member);
  return &member[index];
}

void fetch_function__WhisperTokens__start_times(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const auto & item = *reinterpret_cast<const int64_t *>(
    get_const_function__WhisperTokens__start_times(untyped_member, index));
  auto & value = *reinterpret_cast<int64_t *>(untyped_value);
  value = item;
}

void assign_function__WhisperTokens__start_times(
  void * untyped_member, size_t index, const void * untyped_value)
{
  auto & item = *reinterpret_cast<int64_t *>(
    get_function__WhisperTokens__start_times(untyped_member, index));
  const auto & value = *reinterpret_cast<const int64_t *>(untyped_value);
  item = value;
}

void resize_function__WhisperTokens__start_times(void * untyped_member, size_t size)
{
  auto * member =
    reinterpret_cast<std::vector<int64_t> *>(untyped_member);
  member->resize(size);
}

size_t size_function__WhisperTokens__end_times(const void * untyped_member)
{
  const auto * member = reinterpret_cast<const std::vector<int64_t> *>(untyped_member);
  return member->size();
}

const void * get_const_function__WhisperTokens__end_times(const void * untyped_member, size_t index)
{
  const auto & member =
    *reinterpret_cast<const std::vector<int64_t> *>(untyped_member);
  return &member[index];
}

void * get_function__WhisperTokens__end_times(void * untyped_member, size_t index)
{
  auto & member =
    *reinterpret_cast<std::vector<int64_t> *>(untyped_member);
  return &member[index];
}

void fetch_function__WhisperTokens__end_times(
  const void * untyped_member, size_t index, void * untyped_value)
{
  const auto & item = *reinterpret_cast<const int64_t *>(
    get_const_function__WhisperTokens__end_times(untyped_member, index));
  auto & value = *reinterpret_cast<int64_t *>(untyped_value);
  value = item;
}

void assign_function__WhisperTokens__end_times(
  void * untyped_member, size_t index, const void * untyped_value)
{
  auto & item = *reinterpret_cast<int64_t *>(
    get_function__WhisperTokens__end_times(untyped_member, index));
  const auto & value = *reinterpret_cast<const int64_t *>(untyped_value);
  item = value;
}

void resize_function__WhisperTokens__end_times(void * untyped_member, size_t size)
{
  auto * member =
    reinterpret_cast<std::vector<int64_t> *>(untyped_member);
  member->resize(size);
}

static const ::rosidl_typesupport_introspection_cpp::MessageMember WhisperTokens_message_member_array[8] = {
  {
    "stamp",  // name
    ::rosidl_typesupport_introspection_cpp::ROS_TYPE_MESSAGE,  // type
    0,  // upper bound of string
    ::rosidl_typesupport_introspection_cpp::get_message_type_support_handle<builtin_interfaces::msg::Time>(),  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl::msg::WhisperTokens, stamp),  // bytes offset in struct
    nullptr,  // default value
    nullptr,  // size() function pointer
    nullptr,  // get_const(index) function pointer
    nullptr,  // get(index) function pointer
    nullptr,  // fetch(index, &value) function pointer
    nullptr,  // assign(index, value) function pointer
    nullptr  // resize(index) function pointer
  },
  {
    "token_ids",  // name
    ::rosidl_typesupport_introspection_cpp::ROS_TYPE_INT32,  // type
    0,  // upper bound of string
    nullptr,  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl::msg::WhisperTokens, token_ids),  // bytes offset in struct
    nullptr,  // default value
    size_function__WhisperTokens__token_ids,  // size() function pointer
    get_const_function__WhisperTokens__token_ids,  // get_const(index) function pointer
    get_function__WhisperTokens__token_ids,  // get(index) function pointer
    fetch_function__WhisperTokens__token_ids,  // fetch(index, &value) function pointer
    assign_function__WhisperTokens__token_ids,  // assign(index, value) function pointer
    resize_function__WhisperTokens__token_ids  // resize(index) function pointer
  },
  {
    "token_texts",  // name
    ::rosidl_typesupport_introspection_cpp::ROS_TYPE_STRING,  // type
    0,  // upper bound of string
    nullptr,  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl::msg::WhisperTokens, token_texts),  // bytes offset in struct
    nullptr,  // default value
    size_function__WhisperTokens__token_texts,  // size() function pointer
    get_const_function__WhisperTokens__token_texts,  // get_const(index) function pointer
    get_function__WhisperTokens__token_texts,  // get(index) function pointer
    fetch_function__WhisperTokens__token_texts,  // fetch(index, &value) function pointer
    assign_function__WhisperTokens__token_texts,  // assign(index, value) function pointer
    resize_function__WhisperTokens__token_texts  // resize(index) function pointer
  },
  {
    "token_probs",  // name
    ::rosidl_typesupport_introspection_cpp::ROS_TYPE_FLOAT,  // type
    0,  // upper bound of string
    nullptr,  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl::msg::WhisperTokens, token_probs),  // bytes offset in struct
    nullptr,  // default value
    size_function__WhisperTokens__token_probs,  // size() function pointer
    get_const_function__WhisperTokens__token_probs,  // get_const(index) function pointer
    get_function__WhisperTokens__token_probs,  // get(index) function pointer
    fetch_function__WhisperTokens__token_probs,  // fetch(index, &value) function pointer
    assign_function__WhisperTokens__token_probs,  // assign(index, value) function pointer
    resize_function__WhisperTokens__token_probs  // resize(index) function pointer
  },
  {
    "segment_start_token_idxs",  // name
    ::rosidl_typesupport_introspection_cpp::ROS_TYPE_INT32,  // type
    0,  // upper bound of string
    nullptr,  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl::msg::WhisperTokens, segment_start_token_idxs),  // bytes offset in struct
    nullptr,  // default value
    size_function__WhisperTokens__segment_start_token_idxs,  // size() function pointer
    get_const_function__WhisperTokens__segment_start_token_idxs,  // get_const(index) function pointer
    get_function__WhisperTokens__segment_start_token_idxs,  // get(index) function pointer
    fetch_function__WhisperTokens__segment_start_token_idxs,  // fetch(index, &value) function pointer
    assign_function__WhisperTokens__segment_start_token_idxs,  // assign(index, value) function pointer
    resize_function__WhisperTokens__segment_start_token_idxs  // resize(index) function pointer
  },
  {
    "start_times",  // name
    ::rosidl_typesupport_introspection_cpp::ROS_TYPE_INT64,  // type
    0,  // upper bound of string
    nullptr,  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl::msg::WhisperTokens, start_times),  // bytes offset in struct
    nullptr,  // default value
    size_function__WhisperTokens__start_times,  // size() function pointer
    get_const_function__WhisperTokens__start_times,  // get_const(index) function pointer
    get_function__WhisperTokens__start_times,  // get(index) function pointer
    fetch_function__WhisperTokens__start_times,  // fetch(index, &value) function pointer
    assign_function__WhisperTokens__start_times,  // assign(index, value) function pointer
    resize_function__WhisperTokens__start_times  // resize(index) function pointer
  },
  {
    "end_times",  // name
    ::rosidl_typesupport_introspection_cpp::ROS_TYPE_INT64,  // type
    0,  // upper bound of string
    nullptr,  // members of sub message
    true,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl::msg::WhisperTokens, end_times),  // bytes offset in struct
    nullptr,  // default value
    size_function__WhisperTokens__end_times,  // size() function pointer
    get_const_function__WhisperTokens__end_times,  // get_const(index) function pointer
    get_function__WhisperTokens__end_times,  // get(index) function pointer
    fetch_function__WhisperTokens__end_times,  // fetch(index, &value) function pointer
    assign_function__WhisperTokens__end_times,  // assign(index, value) function pointer
    resize_function__WhisperTokens__end_times  // resize(index) function pointer
  },
  {
    "inference_duration",  // name
    ::rosidl_typesupport_introspection_cpp::ROS_TYPE_INT64,  // type
    0,  // upper bound of string
    nullptr,  // members of sub message
    false,  // is array
    0,  // array size
    false,  // is upper bound
    offsetof(whisper_idl::msg::WhisperTokens, inference_duration),  // bytes offset in struct
    nullptr,  // default value
    nullptr,  // size() function pointer
    nullptr,  // get_const(index) function pointer
    nullptr,  // get(index) function pointer
    nullptr,  // fetch(index, &value) function pointer
    nullptr,  // assign(index, value) function pointer
    nullptr  // resize(index) function pointer
  }
};

static const ::rosidl_typesupport_introspection_cpp::MessageMembers WhisperTokens_message_members = {
  "whisper_idl::msg",  // message namespace
  "WhisperTokens",  // message name
  8,  // number of fields
  sizeof(whisper_idl::msg::WhisperTokens),
  WhisperTokens_message_member_array,  // message members
  WhisperTokens_init_function,  // function to initialize message memory (memory has to be allocated)
  WhisperTokens_fini_function  // function to terminate message instance (will not free memory)
};

static const rosidl_message_type_support_t WhisperTokens_message_type_support_handle = {
  ::rosidl_typesupport_introspection_cpp::typesupport_identifier,
  &WhisperTokens_message_members,
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
get_message_type_support_handle<whisper_idl::msg::WhisperTokens>()
{
  return &::whisper_idl::msg::rosidl_typesupport_introspection_cpp::WhisperTokens_message_type_support_handle;
}

}  // namespace rosidl_typesupport_introspection_cpp

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_INTROSPECTION_CPP_PUBLIC
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_cpp, whisper_idl, msg, WhisperTokens)() {
  return &::whisper_idl::msg::rosidl_typesupport_introspection_cpp::WhisperTokens_message_type_support_handle;
}

#ifdef __cplusplus
}
#endif
