// generated from rosidl_generator_cpp/resource/idl__builder.hpp.em
// with input from whisper_idl:msg/WhisperTokens.idl
// generated code does not contain a copyright notice

#ifndef WHISPER_IDL__MSG__DETAIL__WHISPER_TOKENS__BUILDER_HPP_
#define WHISPER_IDL__MSG__DETAIL__WHISPER_TOKENS__BUILDER_HPP_

#include <algorithm>
#include <utility>

#include "whisper_idl/msg/detail/whisper_tokens__struct.hpp"
#include "rosidl_runtime_cpp/message_initialization.hpp"


namespace whisper_idl
{

namespace msg
{

namespace builder
{

class Init_WhisperTokens_inference_duration
{
public:
  explicit Init_WhisperTokens_inference_duration(::whisper_idl::msg::WhisperTokens & msg)
  : msg_(msg)
  {}
  ::whisper_idl::msg::WhisperTokens inference_duration(::whisper_idl::msg::WhisperTokens::_inference_duration_type arg)
  {
    msg_.inference_duration = std::move(arg);
    return std::move(msg_);
  }

private:
  ::whisper_idl::msg::WhisperTokens msg_;
};

class Init_WhisperTokens_end_times
{
public:
  explicit Init_WhisperTokens_end_times(::whisper_idl::msg::WhisperTokens & msg)
  : msg_(msg)
  {}
  Init_WhisperTokens_inference_duration end_times(::whisper_idl::msg::WhisperTokens::_end_times_type arg)
  {
    msg_.end_times = std::move(arg);
    return Init_WhisperTokens_inference_duration(msg_);
  }

private:
  ::whisper_idl::msg::WhisperTokens msg_;
};

class Init_WhisperTokens_start_times
{
public:
  explicit Init_WhisperTokens_start_times(::whisper_idl::msg::WhisperTokens & msg)
  : msg_(msg)
  {}
  Init_WhisperTokens_end_times start_times(::whisper_idl::msg::WhisperTokens::_start_times_type arg)
  {
    msg_.start_times = std::move(arg);
    return Init_WhisperTokens_end_times(msg_);
  }

private:
  ::whisper_idl::msg::WhisperTokens msg_;
};

class Init_WhisperTokens_segment_start_token_idxs
{
public:
  explicit Init_WhisperTokens_segment_start_token_idxs(::whisper_idl::msg::WhisperTokens & msg)
  : msg_(msg)
  {}
  Init_WhisperTokens_start_times segment_start_token_idxs(::whisper_idl::msg::WhisperTokens::_segment_start_token_idxs_type arg)
  {
    msg_.segment_start_token_idxs = std::move(arg);
    return Init_WhisperTokens_start_times(msg_);
  }

private:
  ::whisper_idl::msg::WhisperTokens msg_;
};

class Init_WhisperTokens_token_probs
{
public:
  explicit Init_WhisperTokens_token_probs(::whisper_idl::msg::WhisperTokens & msg)
  : msg_(msg)
  {}
  Init_WhisperTokens_segment_start_token_idxs token_probs(::whisper_idl::msg::WhisperTokens::_token_probs_type arg)
  {
    msg_.token_probs = std::move(arg);
    return Init_WhisperTokens_segment_start_token_idxs(msg_);
  }

private:
  ::whisper_idl::msg::WhisperTokens msg_;
};

class Init_WhisperTokens_token_texts
{
public:
  explicit Init_WhisperTokens_token_texts(::whisper_idl::msg::WhisperTokens & msg)
  : msg_(msg)
  {}
  Init_WhisperTokens_token_probs token_texts(::whisper_idl::msg::WhisperTokens::_token_texts_type arg)
  {
    msg_.token_texts = std::move(arg);
    return Init_WhisperTokens_token_probs(msg_);
  }

private:
  ::whisper_idl::msg::WhisperTokens msg_;
};

class Init_WhisperTokens_token_ids
{
public:
  explicit Init_WhisperTokens_token_ids(::whisper_idl::msg::WhisperTokens & msg)
  : msg_(msg)
  {}
  Init_WhisperTokens_token_texts token_ids(::whisper_idl::msg::WhisperTokens::_token_ids_type arg)
  {
    msg_.token_ids = std::move(arg);
    return Init_WhisperTokens_token_texts(msg_);
  }

private:
  ::whisper_idl::msg::WhisperTokens msg_;
};

class Init_WhisperTokens_stamp
{
public:
  Init_WhisperTokens_stamp()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  Init_WhisperTokens_token_ids stamp(::whisper_idl::msg::WhisperTokens::_stamp_type arg)
  {
    msg_.stamp = std::move(arg);
    return Init_WhisperTokens_token_ids(msg_);
  }

private:
  ::whisper_idl::msg::WhisperTokens msg_;
};

}  // namespace builder

}  // namespace msg

template<typename MessageType>
auto build();

template<>
inline
auto build<::whisper_idl::msg::WhisperTokens>()
{
  return whisper_idl::msg::builder::Init_WhisperTokens_stamp();
}

}  // namespace whisper_idl

#endif  // WHISPER_IDL__MSG__DETAIL__WHISPER_TOKENS__BUILDER_HPP_
