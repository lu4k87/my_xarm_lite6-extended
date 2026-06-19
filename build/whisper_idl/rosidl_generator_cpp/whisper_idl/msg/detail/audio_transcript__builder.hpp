// generated from rosidl_generator_cpp/resource/idl__builder.hpp.em
// with input from whisper_idl:msg/AudioTranscript.idl
// generated code does not contain a copyright notice

#ifndef WHISPER_IDL__MSG__DETAIL__AUDIO_TRANSCRIPT__BUILDER_HPP_
#define WHISPER_IDL__MSG__DETAIL__AUDIO_TRANSCRIPT__BUILDER_HPP_

#include <algorithm>
#include <utility>

#include "whisper_idl/msg/detail/audio_transcript__struct.hpp"
#include "rosidl_runtime_cpp/message_initialization.hpp"


namespace whisper_idl
{

namespace msg
{

namespace builder
{

class Init_AudioTranscript_active_index
{
public:
  explicit Init_AudioTranscript_active_index(::whisper_idl::msg::AudioTranscript & msg)
  : msg_(msg)
  {}
  ::whisper_idl::msg::AudioTranscript active_index(::whisper_idl::msg::AudioTranscript::_active_index_type arg)
  {
    msg_.active_index = std::move(arg);
    return std::move(msg_);
  }

private:
  ::whisper_idl::msg::AudioTranscript msg_;
};

class Init_AudioTranscript_seg_duration_ms
{
public:
  explicit Init_AudioTranscript_seg_duration_ms(::whisper_idl::msg::AudioTranscript & msg)
  : msg_(msg)
  {}
  Init_AudioTranscript_active_index seg_duration_ms(::whisper_idl::msg::AudioTranscript::_seg_duration_ms_type arg)
  {
    msg_.seg_duration_ms = std::move(arg);
    return Init_AudioTranscript_active_index(msg_);
  }

private:
  ::whisper_idl::msg::AudioTranscript msg_;
};

class Init_AudioTranscript_seg_start_time
{
public:
  explicit Init_AudioTranscript_seg_start_time(::whisper_idl::msg::AudioTranscript & msg)
  : msg_(msg)
  {}
  Init_AudioTranscript_seg_duration_ms seg_start_time(::whisper_idl::msg::AudioTranscript::_seg_start_time_type arg)
  {
    msg_.seg_start_time = std::move(arg);
    return Init_AudioTranscript_seg_duration_ms(msg_);
  }

private:
  ::whisper_idl::msg::AudioTranscript msg_;
};

class Init_AudioTranscript_seg_start_words_id
{
public:
  explicit Init_AudioTranscript_seg_start_words_id(::whisper_idl::msg::AudioTranscript & msg)
  : msg_(msg)
  {}
  Init_AudioTranscript_seg_start_time seg_start_words_id(::whisper_idl::msg::AudioTranscript::_seg_start_words_id_type arg)
  {
    msg_.seg_start_words_id = std::move(arg);
    return Init_AudioTranscript_seg_start_time(msg_);
  }

private:
  ::whisper_idl::msg::AudioTranscript msg_;
};

class Init_AudioTranscript_occ
{
public:
  explicit Init_AudioTranscript_occ(::whisper_idl::msg::AudioTranscript & msg)
  : msg_(msg)
  {}
  Init_AudioTranscript_seg_start_words_id occ(::whisper_idl::msg::AudioTranscript::_occ_type arg)
  {
    msg_.occ = std::move(arg);
    return Init_AudioTranscript_seg_start_words_id(msg_);
  }

private:
  ::whisper_idl::msg::AudioTranscript msg_;
};

class Init_AudioTranscript_probs
{
public:
  explicit Init_AudioTranscript_probs(::whisper_idl::msg::AudioTranscript & msg)
  : msg_(msg)
  {}
  Init_AudioTranscript_occ probs(::whisper_idl::msg::AudioTranscript::_probs_type arg)
  {
    msg_.probs = std::move(arg);
    return Init_AudioTranscript_occ(msg_);
  }

private:
  ::whisper_idl::msg::AudioTranscript msg_;
};

class Init_AudioTranscript_words
{
public:
  Init_AudioTranscript_words()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  Init_AudioTranscript_probs words(::whisper_idl::msg::AudioTranscript::_words_type arg)
  {
    msg_.words = std::move(arg);
    return Init_AudioTranscript_probs(msg_);
  }

private:
  ::whisper_idl::msg::AudioTranscript msg_;
};

}  // namespace builder

}  // namespace msg

template<typename MessageType>
auto build();

template<>
inline
auto build<::whisper_idl::msg::AudioTranscript>()
{
  return whisper_idl::msg::builder::Init_AudioTranscript_words();
}

}  // namespace whisper_idl

#endif  // WHISPER_IDL__MSG__DETAIL__AUDIO_TRANSCRIPT__BUILDER_HPP_
