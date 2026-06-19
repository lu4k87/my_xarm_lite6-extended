// generated from rosidl_generator_cpp/resource/idl__builder.hpp.em
// with input from whisper_idl:action/Inference.idl
// generated code does not contain a copyright notice

#ifndef WHISPER_IDL__ACTION__DETAIL__INFERENCE__BUILDER_HPP_
#define WHISPER_IDL__ACTION__DETAIL__INFERENCE__BUILDER_HPP_

#include <algorithm>
#include <utility>

#include "whisper_idl/action/detail/inference__struct.hpp"
#include "rosidl_runtime_cpp/message_initialization.hpp"


namespace whisper_idl
{

namespace action
{

namespace builder
{

class Init_Inference_Goal_max_duration
{
public:
  Init_Inference_Goal_max_duration()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  ::whisper_idl::action::Inference_Goal max_duration(::whisper_idl::action::Inference_Goal::_max_duration_type arg)
  {
    msg_.max_duration = std::move(arg);
    return std::move(msg_);
  }

private:
  ::whisper_idl::action::Inference_Goal msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::whisper_idl::action::Inference_Goal>()
{
  return whisper_idl::action::builder::Init_Inference_Goal_max_duration();
}

}  // namespace whisper_idl


namespace whisper_idl
{

namespace action
{

namespace builder
{

class Init_Inference_Result_transcriptions
{
public:
  explicit Init_Inference_Result_transcriptions(::whisper_idl::action::Inference_Result & msg)
  : msg_(msg)
  {}
  ::whisper_idl::action::Inference_Result transcriptions(::whisper_idl::action::Inference_Result::_transcriptions_type arg)
  {
    msg_.transcriptions = std::move(arg);
    return std::move(msg_);
  }

private:
  ::whisper_idl::action::Inference_Result msg_;
};

class Init_Inference_Result_info
{
public:
  Init_Inference_Result_info()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  Init_Inference_Result_transcriptions info(::whisper_idl::action::Inference_Result::_info_type arg)
  {
    msg_.info = std::move(arg);
    return Init_Inference_Result_transcriptions(msg_);
  }

private:
  ::whisper_idl::action::Inference_Result msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::whisper_idl::action::Inference_Result>()
{
  return whisper_idl::action::builder::Init_Inference_Result_info();
}

}  // namespace whisper_idl


namespace whisper_idl
{

namespace action
{

namespace builder
{

class Init_Inference_Feedback_transcription
{
public:
  explicit Init_Inference_Feedback_transcription(::whisper_idl::action::Inference_Feedback & msg)
  : msg_(msg)
  {}
  ::whisper_idl::action::Inference_Feedback transcription(::whisper_idl::action::Inference_Feedback::_transcription_type arg)
  {
    msg_.transcription = std::move(arg);
    return std::move(msg_);
  }

private:
  ::whisper_idl::action::Inference_Feedback msg_;
};

class Init_Inference_Feedback_batch_idx
{
public:
  Init_Inference_Feedback_batch_idx()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  Init_Inference_Feedback_transcription batch_idx(::whisper_idl::action::Inference_Feedback::_batch_idx_type arg)
  {
    msg_.batch_idx = std::move(arg);
    return Init_Inference_Feedback_transcription(msg_);
  }

private:
  ::whisper_idl::action::Inference_Feedback msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::whisper_idl::action::Inference_Feedback>()
{
  return whisper_idl::action::builder::Init_Inference_Feedback_batch_idx();
}

}  // namespace whisper_idl


namespace whisper_idl
{

namespace action
{

namespace builder
{

class Init_Inference_SendGoal_Request_goal
{
public:
  explicit Init_Inference_SendGoal_Request_goal(::whisper_idl::action::Inference_SendGoal_Request & msg)
  : msg_(msg)
  {}
  ::whisper_idl::action::Inference_SendGoal_Request goal(::whisper_idl::action::Inference_SendGoal_Request::_goal_type arg)
  {
    msg_.goal = std::move(arg);
    return std::move(msg_);
  }

private:
  ::whisper_idl::action::Inference_SendGoal_Request msg_;
};

class Init_Inference_SendGoal_Request_goal_id
{
public:
  Init_Inference_SendGoal_Request_goal_id()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  Init_Inference_SendGoal_Request_goal goal_id(::whisper_idl::action::Inference_SendGoal_Request::_goal_id_type arg)
  {
    msg_.goal_id = std::move(arg);
    return Init_Inference_SendGoal_Request_goal(msg_);
  }

private:
  ::whisper_idl::action::Inference_SendGoal_Request msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::whisper_idl::action::Inference_SendGoal_Request>()
{
  return whisper_idl::action::builder::Init_Inference_SendGoal_Request_goal_id();
}

}  // namespace whisper_idl


namespace whisper_idl
{

namespace action
{

namespace builder
{

class Init_Inference_SendGoal_Response_stamp
{
public:
  explicit Init_Inference_SendGoal_Response_stamp(::whisper_idl::action::Inference_SendGoal_Response & msg)
  : msg_(msg)
  {}
  ::whisper_idl::action::Inference_SendGoal_Response stamp(::whisper_idl::action::Inference_SendGoal_Response::_stamp_type arg)
  {
    msg_.stamp = std::move(arg);
    return std::move(msg_);
  }

private:
  ::whisper_idl::action::Inference_SendGoal_Response msg_;
};

class Init_Inference_SendGoal_Response_accepted
{
public:
  Init_Inference_SendGoal_Response_accepted()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  Init_Inference_SendGoal_Response_stamp accepted(::whisper_idl::action::Inference_SendGoal_Response::_accepted_type arg)
  {
    msg_.accepted = std::move(arg);
    return Init_Inference_SendGoal_Response_stamp(msg_);
  }

private:
  ::whisper_idl::action::Inference_SendGoal_Response msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::whisper_idl::action::Inference_SendGoal_Response>()
{
  return whisper_idl::action::builder::Init_Inference_SendGoal_Response_accepted();
}

}  // namespace whisper_idl


namespace whisper_idl
{

namespace action
{

namespace builder
{

class Init_Inference_GetResult_Request_goal_id
{
public:
  Init_Inference_GetResult_Request_goal_id()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  ::whisper_idl::action::Inference_GetResult_Request goal_id(::whisper_idl::action::Inference_GetResult_Request::_goal_id_type arg)
  {
    msg_.goal_id = std::move(arg);
    return std::move(msg_);
  }

private:
  ::whisper_idl::action::Inference_GetResult_Request msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::whisper_idl::action::Inference_GetResult_Request>()
{
  return whisper_idl::action::builder::Init_Inference_GetResult_Request_goal_id();
}

}  // namespace whisper_idl


namespace whisper_idl
{

namespace action
{

namespace builder
{

class Init_Inference_GetResult_Response_result
{
public:
  explicit Init_Inference_GetResult_Response_result(::whisper_idl::action::Inference_GetResult_Response & msg)
  : msg_(msg)
  {}
  ::whisper_idl::action::Inference_GetResult_Response result(::whisper_idl::action::Inference_GetResult_Response::_result_type arg)
  {
    msg_.result = std::move(arg);
    return std::move(msg_);
  }

private:
  ::whisper_idl::action::Inference_GetResult_Response msg_;
};

class Init_Inference_GetResult_Response_status
{
public:
  Init_Inference_GetResult_Response_status()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  Init_Inference_GetResult_Response_result status(::whisper_idl::action::Inference_GetResult_Response::_status_type arg)
  {
    msg_.status = std::move(arg);
    return Init_Inference_GetResult_Response_result(msg_);
  }

private:
  ::whisper_idl::action::Inference_GetResult_Response msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::whisper_idl::action::Inference_GetResult_Response>()
{
  return whisper_idl::action::builder::Init_Inference_GetResult_Response_status();
}

}  // namespace whisper_idl


namespace whisper_idl
{

namespace action
{

namespace builder
{

class Init_Inference_FeedbackMessage_feedback
{
public:
  explicit Init_Inference_FeedbackMessage_feedback(::whisper_idl::action::Inference_FeedbackMessage & msg)
  : msg_(msg)
  {}
  ::whisper_idl::action::Inference_FeedbackMessage feedback(::whisper_idl::action::Inference_FeedbackMessage::_feedback_type arg)
  {
    msg_.feedback = std::move(arg);
    return std::move(msg_);
  }

private:
  ::whisper_idl::action::Inference_FeedbackMessage msg_;
};

class Init_Inference_FeedbackMessage_goal_id
{
public:
  Init_Inference_FeedbackMessage_goal_id()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  Init_Inference_FeedbackMessage_feedback goal_id(::whisper_idl::action::Inference_FeedbackMessage::_goal_id_type arg)
  {
    msg_.goal_id = std::move(arg);
    return Init_Inference_FeedbackMessage_feedback(msg_);
  }

private:
  ::whisper_idl::action::Inference_FeedbackMessage msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::whisper_idl::action::Inference_FeedbackMessage>()
{
  return whisper_idl::action::builder::Init_Inference_FeedbackMessage_goal_id();
}

}  // namespace whisper_idl

#endif  // WHISPER_IDL__ACTION__DETAIL__INFERENCE__BUILDER_HPP_
