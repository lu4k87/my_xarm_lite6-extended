// generated from rosidl_typesupport_fastrtps_cpp/resource/idl__rosidl_typesupport_fastrtps_cpp.hpp.em
// with input from whisper_idl:msg/AudioTranscript.idl
// generated code does not contain a copyright notice

#ifndef WHISPER_IDL__MSG__DETAIL__AUDIO_TRANSCRIPT__ROSIDL_TYPESUPPORT_FASTRTPS_CPP_HPP_
#define WHISPER_IDL__MSG__DETAIL__AUDIO_TRANSCRIPT__ROSIDL_TYPESUPPORT_FASTRTPS_CPP_HPP_

#include "rosidl_runtime_c/message_type_support_struct.h"
#include "rosidl_typesupport_interface/macros.h"
#include "whisper_idl/msg/rosidl_typesupport_fastrtps_cpp__visibility_control.h"
#include "whisper_idl/msg/detail/audio_transcript__struct.hpp"

#ifndef _WIN32
# pragma GCC diagnostic push
# pragma GCC diagnostic ignored "-Wunused-parameter"
# ifdef __clang__
#  pragma clang diagnostic ignored "-Wdeprecated-register"
#  pragma clang diagnostic ignored "-Wreturn-type-c-linkage"
# endif
#endif
#ifndef _WIN32
# pragma GCC diagnostic pop
#endif

#include "fastcdr/Cdr.h"

namespace whisper_idl
{

namespace msg
{

namespace typesupport_fastrtps_cpp
{

bool
ROSIDL_TYPESUPPORT_FASTRTPS_CPP_PUBLIC_whisper_idl
cdr_serialize(
  const whisper_idl::msg::AudioTranscript & ros_message,
  eprosima::fastcdr::Cdr & cdr);

bool
ROSIDL_TYPESUPPORT_FASTRTPS_CPP_PUBLIC_whisper_idl
cdr_deserialize(
  eprosima::fastcdr::Cdr & cdr,
  whisper_idl::msg::AudioTranscript & ros_message);

size_t
ROSIDL_TYPESUPPORT_FASTRTPS_CPP_PUBLIC_whisper_idl
get_serialized_size(
  const whisper_idl::msg::AudioTranscript & ros_message,
  size_t current_alignment);

size_t
ROSIDL_TYPESUPPORT_FASTRTPS_CPP_PUBLIC_whisper_idl
max_serialized_size_AudioTranscript(
  bool & full_bounded,
  bool & is_plain,
  size_t current_alignment);

}  // namespace typesupport_fastrtps_cpp

}  // namespace msg

}  // namespace whisper_idl

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_FASTRTPS_CPP_PUBLIC_whisper_idl
const rosidl_message_type_support_t *
  ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_fastrtps_cpp, whisper_idl, msg, AudioTranscript)();

#ifdef __cplusplus
}
#endif

#endif  // WHISPER_IDL__MSG__DETAIL__AUDIO_TRANSCRIPT__ROSIDL_TYPESUPPORT_FASTRTPS_CPP_HPP_
