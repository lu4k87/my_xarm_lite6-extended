// generated from rosidl_generator_cpp/resource/idl__builder.hpp.em
// with input from my_3d_vision_bringup:action/GraspObject.idl
// generated code does not contain a copyright notice

#ifndef MY_3D_VISION_BRINGUP__ACTION__DETAIL__GRASP_OBJECT__BUILDER_HPP_
#define MY_3D_VISION_BRINGUP__ACTION__DETAIL__GRASP_OBJECT__BUILDER_HPP_

#include <algorithm>
#include <utility>

#include "my_3d_vision_bringup/action/detail/grasp_object__struct.hpp"
#include "rosidl_runtime_cpp/message_initialization.hpp"


namespace my_3d_vision_bringup
{

namespace action
{

namespace builder
{

class Init_GraspObject_Goal_object_name
{
public:
  Init_GraspObject_Goal_object_name()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  ::my_3d_vision_bringup::action::GraspObject_Goal object_name(::my_3d_vision_bringup::action::GraspObject_Goal::_object_name_type arg)
  {
    msg_.object_name = std::move(arg);
    return std::move(msg_);
  }

private:
  ::my_3d_vision_bringup::action::GraspObject_Goal msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::my_3d_vision_bringup::action::GraspObject_Goal>()
{
  return my_3d_vision_bringup::action::builder::Init_GraspObject_Goal_object_name();
}

}  // namespace my_3d_vision_bringup


namespace my_3d_vision_bringup
{

namespace action
{

namespace builder
{

class Init_GraspObject_Result_message
{
public:
  explicit Init_GraspObject_Result_message(::my_3d_vision_bringup::action::GraspObject_Result & msg)
  : msg_(msg)
  {}
  ::my_3d_vision_bringup::action::GraspObject_Result message(::my_3d_vision_bringup::action::GraspObject_Result::_message_type arg)
  {
    msg_.message = std::move(arg);
    return std::move(msg_);
  }

private:
  ::my_3d_vision_bringup::action::GraspObject_Result msg_;
};

class Init_GraspObject_Result_success
{
public:
  Init_GraspObject_Result_success()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  Init_GraspObject_Result_message success(::my_3d_vision_bringup::action::GraspObject_Result::_success_type arg)
  {
    msg_.success = std::move(arg);
    return Init_GraspObject_Result_message(msg_);
  }

private:
  ::my_3d_vision_bringup::action::GraspObject_Result msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::my_3d_vision_bringup::action::GraspObject_Result>()
{
  return my_3d_vision_bringup::action::builder::Init_GraspObject_Result_success();
}

}  // namespace my_3d_vision_bringup


namespace my_3d_vision_bringup
{

namespace action
{

namespace builder
{

class Init_GraspObject_Feedback_status_message
{
public:
  explicit Init_GraspObject_Feedback_status_message(::my_3d_vision_bringup::action::GraspObject_Feedback & msg)
  : msg_(msg)
  {}
  ::my_3d_vision_bringup::action::GraspObject_Feedback status_message(::my_3d_vision_bringup::action::GraspObject_Feedback::_status_message_type arg)
  {
    msg_.status_message = std::move(arg);
    return std::move(msg_);
  }

private:
  ::my_3d_vision_bringup::action::GraspObject_Feedback msg_;
};

class Init_GraspObject_Feedback_current_phase
{
public:
  Init_GraspObject_Feedback_current_phase()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  Init_GraspObject_Feedback_status_message current_phase(::my_3d_vision_bringup::action::GraspObject_Feedback::_current_phase_type arg)
  {
    msg_.current_phase = std::move(arg);
    return Init_GraspObject_Feedback_status_message(msg_);
  }

private:
  ::my_3d_vision_bringup::action::GraspObject_Feedback msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::my_3d_vision_bringup::action::GraspObject_Feedback>()
{
  return my_3d_vision_bringup::action::builder::Init_GraspObject_Feedback_current_phase();
}

}  // namespace my_3d_vision_bringup


namespace my_3d_vision_bringup
{

namespace action
{

namespace builder
{

class Init_GraspObject_SendGoal_Request_goal
{
public:
  explicit Init_GraspObject_SendGoal_Request_goal(::my_3d_vision_bringup::action::GraspObject_SendGoal_Request & msg)
  : msg_(msg)
  {}
  ::my_3d_vision_bringup::action::GraspObject_SendGoal_Request goal(::my_3d_vision_bringup::action::GraspObject_SendGoal_Request::_goal_type arg)
  {
    msg_.goal = std::move(arg);
    return std::move(msg_);
  }

private:
  ::my_3d_vision_bringup::action::GraspObject_SendGoal_Request msg_;
};

class Init_GraspObject_SendGoal_Request_goal_id
{
public:
  Init_GraspObject_SendGoal_Request_goal_id()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  Init_GraspObject_SendGoal_Request_goal goal_id(::my_3d_vision_bringup::action::GraspObject_SendGoal_Request::_goal_id_type arg)
  {
    msg_.goal_id = std::move(arg);
    return Init_GraspObject_SendGoal_Request_goal(msg_);
  }

private:
  ::my_3d_vision_bringup::action::GraspObject_SendGoal_Request msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::my_3d_vision_bringup::action::GraspObject_SendGoal_Request>()
{
  return my_3d_vision_bringup::action::builder::Init_GraspObject_SendGoal_Request_goal_id();
}

}  // namespace my_3d_vision_bringup


namespace my_3d_vision_bringup
{

namespace action
{

namespace builder
{

class Init_GraspObject_SendGoal_Response_stamp
{
public:
  explicit Init_GraspObject_SendGoal_Response_stamp(::my_3d_vision_bringup::action::GraspObject_SendGoal_Response & msg)
  : msg_(msg)
  {}
  ::my_3d_vision_bringup::action::GraspObject_SendGoal_Response stamp(::my_3d_vision_bringup::action::GraspObject_SendGoal_Response::_stamp_type arg)
  {
    msg_.stamp = std::move(arg);
    return std::move(msg_);
  }

private:
  ::my_3d_vision_bringup::action::GraspObject_SendGoal_Response msg_;
};

class Init_GraspObject_SendGoal_Response_accepted
{
public:
  Init_GraspObject_SendGoal_Response_accepted()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  Init_GraspObject_SendGoal_Response_stamp accepted(::my_3d_vision_bringup::action::GraspObject_SendGoal_Response::_accepted_type arg)
  {
    msg_.accepted = std::move(arg);
    return Init_GraspObject_SendGoal_Response_stamp(msg_);
  }

private:
  ::my_3d_vision_bringup::action::GraspObject_SendGoal_Response msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::my_3d_vision_bringup::action::GraspObject_SendGoal_Response>()
{
  return my_3d_vision_bringup::action::builder::Init_GraspObject_SendGoal_Response_accepted();
}

}  // namespace my_3d_vision_bringup


namespace my_3d_vision_bringup
{

namespace action
{

namespace builder
{

class Init_GraspObject_GetResult_Request_goal_id
{
public:
  Init_GraspObject_GetResult_Request_goal_id()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  ::my_3d_vision_bringup::action::GraspObject_GetResult_Request goal_id(::my_3d_vision_bringup::action::GraspObject_GetResult_Request::_goal_id_type arg)
  {
    msg_.goal_id = std::move(arg);
    return std::move(msg_);
  }

private:
  ::my_3d_vision_bringup::action::GraspObject_GetResult_Request msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::my_3d_vision_bringup::action::GraspObject_GetResult_Request>()
{
  return my_3d_vision_bringup::action::builder::Init_GraspObject_GetResult_Request_goal_id();
}

}  // namespace my_3d_vision_bringup


namespace my_3d_vision_bringup
{

namespace action
{

namespace builder
{

class Init_GraspObject_GetResult_Response_result
{
public:
  explicit Init_GraspObject_GetResult_Response_result(::my_3d_vision_bringup::action::GraspObject_GetResult_Response & msg)
  : msg_(msg)
  {}
  ::my_3d_vision_bringup::action::GraspObject_GetResult_Response result(::my_3d_vision_bringup::action::GraspObject_GetResult_Response::_result_type arg)
  {
    msg_.result = std::move(arg);
    return std::move(msg_);
  }

private:
  ::my_3d_vision_bringup::action::GraspObject_GetResult_Response msg_;
};

class Init_GraspObject_GetResult_Response_status
{
public:
  Init_GraspObject_GetResult_Response_status()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  Init_GraspObject_GetResult_Response_result status(::my_3d_vision_bringup::action::GraspObject_GetResult_Response::_status_type arg)
  {
    msg_.status = std::move(arg);
    return Init_GraspObject_GetResult_Response_result(msg_);
  }

private:
  ::my_3d_vision_bringup::action::GraspObject_GetResult_Response msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::my_3d_vision_bringup::action::GraspObject_GetResult_Response>()
{
  return my_3d_vision_bringup::action::builder::Init_GraspObject_GetResult_Response_status();
}

}  // namespace my_3d_vision_bringup


namespace my_3d_vision_bringup
{

namespace action
{

namespace builder
{

class Init_GraspObject_FeedbackMessage_feedback
{
public:
  explicit Init_GraspObject_FeedbackMessage_feedback(::my_3d_vision_bringup::action::GraspObject_FeedbackMessage & msg)
  : msg_(msg)
  {}
  ::my_3d_vision_bringup::action::GraspObject_FeedbackMessage feedback(::my_3d_vision_bringup::action::GraspObject_FeedbackMessage::_feedback_type arg)
  {
    msg_.feedback = std::move(arg);
    return std::move(msg_);
  }

private:
  ::my_3d_vision_bringup::action::GraspObject_FeedbackMessage msg_;
};

class Init_GraspObject_FeedbackMessage_goal_id
{
public:
  Init_GraspObject_FeedbackMessage_goal_id()
  : msg_(::rosidl_runtime_cpp::MessageInitialization::SKIP)
  {}
  Init_GraspObject_FeedbackMessage_feedback goal_id(::my_3d_vision_bringup::action::GraspObject_FeedbackMessage::_goal_id_type arg)
  {
    msg_.goal_id = std::move(arg);
    return Init_GraspObject_FeedbackMessage_feedback(msg_);
  }

private:
  ::my_3d_vision_bringup::action::GraspObject_FeedbackMessage msg_;
};

}  // namespace builder

}  // namespace action

template<typename MessageType>
auto build();

template<>
inline
auto build<::my_3d_vision_bringup::action::GraspObject_FeedbackMessage>()
{
  return my_3d_vision_bringup::action::builder::Init_GraspObject_FeedbackMessage_goal_id();
}

}  // namespace my_3d_vision_bringup

#endif  // MY_3D_VISION_BRINGUP__ACTION__DETAIL__GRASP_OBJECT__BUILDER_HPP_
