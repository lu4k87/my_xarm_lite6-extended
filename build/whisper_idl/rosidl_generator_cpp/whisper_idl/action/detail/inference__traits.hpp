// generated from rosidl_generator_cpp/resource/idl__traits.hpp.em
// with input from whisper_idl:action/Inference.idl
// generated code does not contain a copyright notice

#ifndef WHISPER_IDL__ACTION__DETAIL__INFERENCE__TRAITS_HPP_
#define WHISPER_IDL__ACTION__DETAIL__INFERENCE__TRAITS_HPP_

#include <stdint.h>

#include <sstream>
#include <string>
#include <type_traits>

#include "whisper_idl/action/detail/inference__struct.hpp"
#include "rosidl_runtime_cpp/traits.hpp"

// Include directives for member types
// Member 'max_duration'
#include "builtin_interfaces/msg/detail/duration__traits.hpp"

namespace whisper_idl
{

namespace action
{

inline void to_flow_style_yaml(
  const Inference_Goal & msg,
  std::ostream & out)
{
  out << "{";
  // member: max_duration
  {
    out << "max_duration: ";
    to_flow_style_yaml(msg.max_duration, out);
  }
  out << "}";
}  // NOLINT(readability/fn_size)

inline void to_block_style_yaml(
  const Inference_Goal & msg,
  std::ostream & out, size_t indentation = 0)
{
  // member: max_duration
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "max_duration:\n";
    to_block_style_yaml(msg.max_duration, out, indentation + 2);
  }
}  // NOLINT(readability/fn_size)

inline std::string to_yaml(const Inference_Goal & msg, bool use_flow_style = false)
{
  std::ostringstream out;
  if (use_flow_style) {
    to_flow_style_yaml(msg, out);
  } else {
    to_block_style_yaml(msg, out);
  }
  return out.str();
}

}  // namespace action

}  // namespace whisper_idl

namespace rosidl_generator_traits
{

[[deprecated("use whisper_idl::action::to_block_style_yaml() instead")]]
inline void to_yaml(
  const whisper_idl::action::Inference_Goal & msg,
  std::ostream & out, size_t indentation = 0)
{
  whisper_idl::action::to_block_style_yaml(msg, out, indentation);
}

[[deprecated("use whisper_idl::action::to_yaml() instead")]]
inline std::string to_yaml(const whisper_idl::action::Inference_Goal & msg)
{
  return whisper_idl::action::to_yaml(msg);
}

template<>
inline const char * data_type<whisper_idl::action::Inference_Goal>()
{
  return "whisper_idl::action::Inference_Goal";
}

template<>
inline const char * name<whisper_idl::action::Inference_Goal>()
{
  return "whisper_idl/action/Inference_Goal";
}

template<>
struct has_fixed_size<whisper_idl::action::Inference_Goal>
  : std::integral_constant<bool, has_fixed_size<builtin_interfaces::msg::Duration>::value> {};

template<>
struct has_bounded_size<whisper_idl::action::Inference_Goal>
  : std::integral_constant<bool, has_bounded_size<builtin_interfaces::msg::Duration>::value> {};

template<>
struct is_message<whisper_idl::action::Inference_Goal>
  : std::true_type {};

}  // namespace rosidl_generator_traits

namespace whisper_idl
{

namespace action
{

inline void to_flow_style_yaml(
  const Inference_Result & msg,
  std::ostream & out)
{
  out << "{";
  // member: info
  {
    out << "info: ";
    rosidl_generator_traits::value_to_yaml(msg.info, out);
    out << ", ";
  }

  // member: transcriptions
  {
    if (msg.transcriptions.size() == 0) {
      out << "transcriptions: []";
    } else {
      out << "transcriptions: [";
      size_t pending_items = msg.transcriptions.size();
      for (auto item : msg.transcriptions) {
        rosidl_generator_traits::value_to_yaml(item, out);
        if (--pending_items > 0) {
          out << ", ";
        }
      }
      out << "]";
    }
  }
  out << "}";
}  // NOLINT(readability/fn_size)

inline void to_block_style_yaml(
  const Inference_Result & msg,
  std::ostream & out, size_t indentation = 0)
{
  // member: info
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "info: ";
    rosidl_generator_traits::value_to_yaml(msg.info, out);
    out << "\n";
  }

  // member: transcriptions
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    if (msg.transcriptions.size() == 0) {
      out << "transcriptions: []\n";
    } else {
      out << "transcriptions:\n";
      for (auto item : msg.transcriptions) {
        if (indentation > 0) {
          out << std::string(indentation, ' ');
        }
        out << "- ";
        rosidl_generator_traits::value_to_yaml(item, out);
        out << "\n";
      }
    }
  }
}  // NOLINT(readability/fn_size)

inline std::string to_yaml(const Inference_Result & msg, bool use_flow_style = false)
{
  std::ostringstream out;
  if (use_flow_style) {
    to_flow_style_yaml(msg, out);
  } else {
    to_block_style_yaml(msg, out);
  }
  return out.str();
}

}  // namespace action

}  // namespace whisper_idl

namespace rosidl_generator_traits
{

[[deprecated("use whisper_idl::action::to_block_style_yaml() instead")]]
inline void to_yaml(
  const whisper_idl::action::Inference_Result & msg,
  std::ostream & out, size_t indentation = 0)
{
  whisper_idl::action::to_block_style_yaml(msg, out, indentation);
}

[[deprecated("use whisper_idl::action::to_yaml() instead")]]
inline std::string to_yaml(const whisper_idl::action::Inference_Result & msg)
{
  return whisper_idl::action::to_yaml(msg);
}

template<>
inline const char * data_type<whisper_idl::action::Inference_Result>()
{
  return "whisper_idl::action::Inference_Result";
}

template<>
inline const char * name<whisper_idl::action::Inference_Result>()
{
  return "whisper_idl/action/Inference_Result";
}

template<>
struct has_fixed_size<whisper_idl::action::Inference_Result>
  : std::integral_constant<bool, false> {};

template<>
struct has_bounded_size<whisper_idl::action::Inference_Result>
  : std::integral_constant<bool, false> {};

template<>
struct is_message<whisper_idl::action::Inference_Result>
  : std::true_type {};

}  // namespace rosidl_generator_traits

namespace whisper_idl
{

namespace action
{

inline void to_flow_style_yaml(
  const Inference_Feedback & msg,
  std::ostream & out)
{
  out << "{";
  // member: batch_idx
  {
    out << "batch_idx: ";
    rosidl_generator_traits::value_to_yaml(msg.batch_idx, out);
    out << ", ";
  }

  // member: transcription
  {
    out << "transcription: ";
    rosidl_generator_traits::value_to_yaml(msg.transcription, out);
  }
  out << "}";
}  // NOLINT(readability/fn_size)

inline void to_block_style_yaml(
  const Inference_Feedback & msg,
  std::ostream & out, size_t indentation = 0)
{
  // member: batch_idx
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "batch_idx: ";
    rosidl_generator_traits::value_to_yaml(msg.batch_idx, out);
    out << "\n";
  }

  // member: transcription
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "transcription: ";
    rosidl_generator_traits::value_to_yaml(msg.transcription, out);
    out << "\n";
  }
}  // NOLINT(readability/fn_size)

inline std::string to_yaml(const Inference_Feedback & msg, bool use_flow_style = false)
{
  std::ostringstream out;
  if (use_flow_style) {
    to_flow_style_yaml(msg, out);
  } else {
    to_block_style_yaml(msg, out);
  }
  return out.str();
}

}  // namespace action

}  // namespace whisper_idl

namespace rosidl_generator_traits
{

[[deprecated("use whisper_idl::action::to_block_style_yaml() instead")]]
inline void to_yaml(
  const whisper_idl::action::Inference_Feedback & msg,
  std::ostream & out, size_t indentation = 0)
{
  whisper_idl::action::to_block_style_yaml(msg, out, indentation);
}

[[deprecated("use whisper_idl::action::to_yaml() instead")]]
inline std::string to_yaml(const whisper_idl::action::Inference_Feedback & msg)
{
  return whisper_idl::action::to_yaml(msg);
}

template<>
inline const char * data_type<whisper_idl::action::Inference_Feedback>()
{
  return "whisper_idl::action::Inference_Feedback";
}

template<>
inline const char * name<whisper_idl::action::Inference_Feedback>()
{
  return "whisper_idl/action/Inference_Feedback";
}

template<>
struct has_fixed_size<whisper_idl::action::Inference_Feedback>
  : std::integral_constant<bool, false> {};

template<>
struct has_bounded_size<whisper_idl::action::Inference_Feedback>
  : std::integral_constant<bool, false> {};

template<>
struct is_message<whisper_idl::action::Inference_Feedback>
  : std::true_type {};

}  // namespace rosidl_generator_traits

// Include directives for member types
// Member 'goal_id'
#include "unique_identifier_msgs/msg/detail/uuid__traits.hpp"
// Member 'goal'
#include "whisper_idl/action/detail/inference__traits.hpp"

namespace whisper_idl
{

namespace action
{

inline void to_flow_style_yaml(
  const Inference_SendGoal_Request & msg,
  std::ostream & out)
{
  out << "{";
  // member: goal_id
  {
    out << "goal_id: ";
    to_flow_style_yaml(msg.goal_id, out);
    out << ", ";
  }

  // member: goal
  {
    out << "goal: ";
    to_flow_style_yaml(msg.goal, out);
  }
  out << "}";
}  // NOLINT(readability/fn_size)

inline void to_block_style_yaml(
  const Inference_SendGoal_Request & msg,
  std::ostream & out, size_t indentation = 0)
{
  // member: goal_id
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "goal_id:\n";
    to_block_style_yaml(msg.goal_id, out, indentation + 2);
  }

  // member: goal
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "goal:\n";
    to_block_style_yaml(msg.goal, out, indentation + 2);
  }
}  // NOLINT(readability/fn_size)

inline std::string to_yaml(const Inference_SendGoal_Request & msg, bool use_flow_style = false)
{
  std::ostringstream out;
  if (use_flow_style) {
    to_flow_style_yaml(msg, out);
  } else {
    to_block_style_yaml(msg, out);
  }
  return out.str();
}

}  // namespace action

}  // namespace whisper_idl

namespace rosidl_generator_traits
{

[[deprecated("use whisper_idl::action::to_block_style_yaml() instead")]]
inline void to_yaml(
  const whisper_idl::action::Inference_SendGoal_Request & msg,
  std::ostream & out, size_t indentation = 0)
{
  whisper_idl::action::to_block_style_yaml(msg, out, indentation);
}

[[deprecated("use whisper_idl::action::to_yaml() instead")]]
inline std::string to_yaml(const whisper_idl::action::Inference_SendGoal_Request & msg)
{
  return whisper_idl::action::to_yaml(msg);
}

template<>
inline const char * data_type<whisper_idl::action::Inference_SendGoal_Request>()
{
  return "whisper_idl::action::Inference_SendGoal_Request";
}

template<>
inline const char * name<whisper_idl::action::Inference_SendGoal_Request>()
{
  return "whisper_idl/action/Inference_SendGoal_Request";
}

template<>
struct has_fixed_size<whisper_idl::action::Inference_SendGoal_Request>
  : std::integral_constant<bool, has_fixed_size<unique_identifier_msgs::msg::UUID>::value && has_fixed_size<whisper_idl::action::Inference_Goal>::value> {};

template<>
struct has_bounded_size<whisper_idl::action::Inference_SendGoal_Request>
  : std::integral_constant<bool, has_bounded_size<unique_identifier_msgs::msg::UUID>::value && has_bounded_size<whisper_idl::action::Inference_Goal>::value> {};

template<>
struct is_message<whisper_idl::action::Inference_SendGoal_Request>
  : std::true_type {};

}  // namespace rosidl_generator_traits

// Include directives for member types
// Member 'stamp'
#include "builtin_interfaces/msg/detail/time__traits.hpp"

namespace whisper_idl
{

namespace action
{

inline void to_flow_style_yaml(
  const Inference_SendGoal_Response & msg,
  std::ostream & out)
{
  out << "{";
  // member: accepted
  {
    out << "accepted: ";
    rosidl_generator_traits::value_to_yaml(msg.accepted, out);
    out << ", ";
  }

  // member: stamp
  {
    out << "stamp: ";
    to_flow_style_yaml(msg.stamp, out);
  }
  out << "}";
}  // NOLINT(readability/fn_size)

inline void to_block_style_yaml(
  const Inference_SendGoal_Response & msg,
  std::ostream & out, size_t indentation = 0)
{
  // member: accepted
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "accepted: ";
    rosidl_generator_traits::value_to_yaml(msg.accepted, out);
    out << "\n";
  }

  // member: stamp
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "stamp:\n";
    to_block_style_yaml(msg.stamp, out, indentation + 2);
  }
}  // NOLINT(readability/fn_size)

inline std::string to_yaml(const Inference_SendGoal_Response & msg, bool use_flow_style = false)
{
  std::ostringstream out;
  if (use_flow_style) {
    to_flow_style_yaml(msg, out);
  } else {
    to_block_style_yaml(msg, out);
  }
  return out.str();
}

}  // namespace action

}  // namespace whisper_idl

namespace rosidl_generator_traits
{

[[deprecated("use whisper_idl::action::to_block_style_yaml() instead")]]
inline void to_yaml(
  const whisper_idl::action::Inference_SendGoal_Response & msg,
  std::ostream & out, size_t indentation = 0)
{
  whisper_idl::action::to_block_style_yaml(msg, out, indentation);
}

[[deprecated("use whisper_idl::action::to_yaml() instead")]]
inline std::string to_yaml(const whisper_idl::action::Inference_SendGoal_Response & msg)
{
  return whisper_idl::action::to_yaml(msg);
}

template<>
inline const char * data_type<whisper_idl::action::Inference_SendGoal_Response>()
{
  return "whisper_idl::action::Inference_SendGoal_Response";
}

template<>
inline const char * name<whisper_idl::action::Inference_SendGoal_Response>()
{
  return "whisper_idl/action/Inference_SendGoal_Response";
}

template<>
struct has_fixed_size<whisper_idl::action::Inference_SendGoal_Response>
  : std::integral_constant<bool, has_fixed_size<builtin_interfaces::msg::Time>::value> {};

template<>
struct has_bounded_size<whisper_idl::action::Inference_SendGoal_Response>
  : std::integral_constant<bool, has_bounded_size<builtin_interfaces::msg::Time>::value> {};

template<>
struct is_message<whisper_idl::action::Inference_SendGoal_Response>
  : std::true_type {};

}  // namespace rosidl_generator_traits

namespace rosidl_generator_traits
{

template<>
inline const char * data_type<whisper_idl::action::Inference_SendGoal>()
{
  return "whisper_idl::action::Inference_SendGoal";
}

template<>
inline const char * name<whisper_idl::action::Inference_SendGoal>()
{
  return "whisper_idl/action/Inference_SendGoal";
}

template<>
struct has_fixed_size<whisper_idl::action::Inference_SendGoal>
  : std::integral_constant<
    bool,
    has_fixed_size<whisper_idl::action::Inference_SendGoal_Request>::value &&
    has_fixed_size<whisper_idl::action::Inference_SendGoal_Response>::value
  >
{
};

template<>
struct has_bounded_size<whisper_idl::action::Inference_SendGoal>
  : std::integral_constant<
    bool,
    has_bounded_size<whisper_idl::action::Inference_SendGoal_Request>::value &&
    has_bounded_size<whisper_idl::action::Inference_SendGoal_Response>::value
  >
{
};

template<>
struct is_service<whisper_idl::action::Inference_SendGoal>
  : std::true_type
{
};

template<>
struct is_service_request<whisper_idl::action::Inference_SendGoal_Request>
  : std::true_type
{
};

template<>
struct is_service_response<whisper_idl::action::Inference_SendGoal_Response>
  : std::true_type
{
};

}  // namespace rosidl_generator_traits

// Include directives for member types
// Member 'goal_id'
// already included above
// #include "unique_identifier_msgs/msg/detail/uuid__traits.hpp"

namespace whisper_idl
{

namespace action
{

inline void to_flow_style_yaml(
  const Inference_GetResult_Request & msg,
  std::ostream & out)
{
  out << "{";
  // member: goal_id
  {
    out << "goal_id: ";
    to_flow_style_yaml(msg.goal_id, out);
  }
  out << "}";
}  // NOLINT(readability/fn_size)

inline void to_block_style_yaml(
  const Inference_GetResult_Request & msg,
  std::ostream & out, size_t indentation = 0)
{
  // member: goal_id
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "goal_id:\n";
    to_block_style_yaml(msg.goal_id, out, indentation + 2);
  }
}  // NOLINT(readability/fn_size)

inline std::string to_yaml(const Inference_GetResult_Request & msg, bool use_flow_style = false)
{
  std::ostringstream out;
  if (use_flow_style) {
    to_flow_style_yaml(msg, out);
  } else {
    to_block_style_yaml(msg, out);
  }
  return out.str();
}

}  // namespace action

}  // namespace whisper_idl

namespace rosidl_generator_traits
{

[[deprecated("use whisper_idl::action::to_block_style_yaml() instead")]]
inline void to_yaml(
  const whisper_idl::action::Inference_GetResult_Request & msg,
  std::ostream & out, size_t indentation = 0)
{
  whisper_idl::action::to_block_style_yaml(msg, out, indentation);
}

[[deprecated("use whisper_idl::action::to_yaml() instead")]]
inline std::string to_yaml(const whisper_idl::action::Inference_GetResult_Request & msg)
{
  return whisper_idl::action::to_yaml(msg);
}

template<>
inline const char * data_type<whisper_idl::action::Inference_GetResult_Request>()
{
  return "whisper_idl::action::Inference_GetResult_Request";
}

template<>
inline const char * name<whisper_idl::action::Inference_GetResult_Request>()
{
  return "whisper_idl/action/Inference_GetResult_Request";
}

template<>
struct has_fixed_size<whisper_idl::action::Inference_GetResult_Request>
  : std::integral_constant<bool, has_fixed_size<unique_identifier_msgs::msg::UUID>::value> {};

template<>
struct has_bounded_size<whisper_idl::action::Inference_GetResult_Request>
  : std::integral_constant<bool, has_bounded_size<unique_identifier_msgs::msg::UUID>::value> {};

template<>
struct is_message<whisper_idl::action::Inference_GetResult_Request>
  : std::true_type {};

}  // namespace rosidl_generator_traits

// Include directives for member types
// Member 'result'
// already included above
// #include "whisper_idl/action/detail/inference__traits.hpp"

namespace whisper_idl
{

namespace action
{

inline void to_flow_style_yaml(
  const Inference_GetResult_Response & msg,
  std::ostream & out)
{
  out << "{";
  // member: status
  {
    out << "status: ";
    rosidl_generator_traits::value_to_yaml(msg.status, out);
    out << ", ";
  }

  // member: result
  {
    out << "result: ";
    to_flow_style_yaml(msg.result, out);
  }
  out << "}";
}  // NOLINT(readability/fn_size)

inline void to_block_style_yaml(
  const Inference_GetResult_Response & msg,
  std::ostream & out, size_t indentation = 0)
{
  // member: status
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "status: ";
    rosidl_generator_traits::value_to_yaml(msg.status, out);
    out << "\n";
  }

  // member: result
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "result:\n";
    to_block_style_yaml(msg.result, out, indentation + 2);
  }
}  // NOLINT(readability/fn_size)

inline std::string to_yaml(const Inference_GetResult_Response & msg, bool use_flow_style = false)
{
  std::ostringstream out;
  if (use_flow_style) {
    to_flow_style_yaml(msg, out);
  } else {
    to_block_style_yaml(msg, out);
  }
  return out.str();
}

}  // namespace action

}  // namespace whisper_idl

namespace rosidl_generator_traits
{

[[deprecated("use whisper_idl::action::to_block_style_yaml() instead")]]
inline void to_yaml(
  const whisper_idl::action::Inference_GetResult_Response & msg,
  std::ostream & out, size_t indentation = 0)
{
  whisper_idl::action::to_block_style_yaml(msg, out, indentation);
}

[[deprecated("use whisper_idl::action::to_yaml() instead")]]
inline std::string to_yaml(const whisper_idl::action::Inference_GetResult_Response & msg)
{
  return whisper_idl::action::to_yaml(msg);
}

template<>
inline const char * data_type<whisper_idl::action::Inference_GetResult_Response>()
{
  return "whisper_idl::action::Inference_GetResult_Response";
}

template<>
inline const char * name<whisper_idl::action::Inference_GetResult_Response>()
{
  return "whisper_idl/action/Inference_GetResult_Response";
}

template<>
struct has_fixed_size<whisper_idl::action::Inference_GetResult_Response>
  : std::integral_constant<bool, has_fixed_size<whisper_idl::action::Inference_Result>::value> {};

template<>
struct has_bounded_size<whisper_idl::action::Inference_GetResult_Response>
  : std::integral_constant<bool, has_bounded_size<whisper_idl::action::Inference_Result>::value> {};

template<>
struct is_message<whisper_idl::action::Inference_GetResult_Response>
  : std::true_type {};

}  // namespace rosidl_generator_traits

namespace rosidl_generator_traits
{

template<>
inline const char * data_type<whisper_idl::action::Inference_GetResult>()
{
  return "whisper_idl::action::Inference_GetResult";
}

template<>
inline const char * name<whisper_idl::action::Inference_GetResult>()
{
  return "whisper_idl/action/Inference_GetResult";
}

template<>
struct has_fixed_size<whisper_idl::action::Inference_GetResult>
  : std::integral_constant<
    bool,
    has_fixed_size<whisper_idl::action::Inference_GetResult_Request>::value &&
    has_fixed_size<whisper_idl::action::Inference_GetResult_Response>::value
  >
{
};

template<>
struct has_bounded_size<whisper_idl::action::Inference_GetResult>
  : std::integral_constant<
    bool,
    has_bounded_size<whisper_idl::action::Inference_GetResult_Request>::value &&
    has_bounded_size<whisper_idl::action::Inference_GetResult_Response>::value
  >
{
};

template<>
struct is_service<whisper_idl::action::Inference_GetResult>
  : std::true_type
{
};

template<>
struct is_service_request<whisper_idl::action::Inference_GetResult_Request>
  : std::true_type
{
};

template<>
struct is_service_response<whisper_idl::action::Inference_GetResult_Response>
  : std::true_type
{
};

}  // namespace rosidl_generator_traits

// Include directives for member types
// Member 'goal_id'
// already included above
// #include "unique_identifier_msgs/msg/detail/uuid__traits.hpp"
// Member 'feedback'
// already included above
// #include "whisper_idl/action/detail/inference__traits.hpp"

namespace whisper_idl
{

namespace action
{

inline void to_flow_style_yaml(
  const Inference_FeedbackMessage & msg,
  std::ostream & out)
{
  out << "{";
  // member: goal_id
  {
    out << "goal_id: ";
    to_flow_style_yaml(msg.goal_id, out);
    out << ", ";
  }

  // member: feedback
  {
    out << "feedback: ";
    to_flow_style_yaml(msg.feedback, out);
  }
  out << "}";
}  // NOLINT(readability/fn_size)

inline void to_block_style_yaml(
  const Inference_FeedbackMessage & msg,
  std::ostream & out, size_t indentation = 0)
{
  // member: goal_id
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "goal_id:\n";
    to_block_style_yaml(msg.goal_id, out, indentation + 2);
  }

  // member: feedback
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "feedback:\n";
    to_block_style_yaml(msg.feedback, out, indentation + 2);
  }
}  // NOLINT(readability/fn_size)

inline std::string to_yaml(const Inference_FeedbackMessage & msg, bool use_flow_style = false)
{
  std::ostringstream out;
  if (use_flow_style) {
    to_flow_style_yaml(msg, out);
  } else {
    to_block_style_yaml(msg, out);
  }
  return out.str();
}

}  // namespace action

}  // namespace whisper_idl

namespace rosidl_generator_traits
{

[[deprecated("use whisper_idl::action::to_block_style_yaml() instead")]]
inline void to_yaml(
  const whisper_idl::action::Inference_FeedbackMessage & msg,
  std::ostream & out, size_t indentation = 0)
{
  whisper_idl::action::to_block_style_yaml(msg, out, indentation);
}

[[deprecated("use whisper_idl::action::to_yaml() instead")]]
inline std::string to_yaml(const whisper_idl::action::Inference_FeedbackMessage & msg)
{
  return whisper_idl::action::to_yaml(msg);
}

template<>
inline const char * data_type<whisper_idl::action::Inference_FeedbackMessage>()
{
  return "whisper_idl::action::Inference_FeedbackMessage";
}

template<>
inline const char * name<whisper_idl::action::Inference_FeedbackMessage>()
{
  return "whisper_idl/action/Inference_FeedbackMessage";
}

template<>
struct has_fixed_size<whisper_idl::action::Inference_FeedbackMessage>
  : std::integral_constant<bool, has_fixed_size<unique_identifier_msgs::msg::UUID>::value && has_fixed_size<whisper_idl::action::Inference_Feedback>::value> {};

template<>
struct has_bounded_size<whisper_idl::action::Inference_FeedbackMessage>
  : std::integral_constant<bool, has_bounded_size<unique_identifier_msgs::msg::UUID>::value && has_bounded_size<whisper_idl::action::Inference_Feedback>::value> {};

template<>
struct is_message<whisper_idl::action::Inference_FeedbackMessage>
  : std::true_type {};

}  // namespace rosidl_generator_traits


namespace rosidl_generator_traits
{

template<>
struct is_action<whisper_idl::action::Inference>
  : std::true_type
{
};

template<>
struct is_action_goal<whisper_idl::action::Inference_Goal>
  : std::true_type
{
};

template<>
struct is_action_result<whisper_idl::action::Inference_Result>
  : std::true_type
{
};

template<>
struct is_action_feedback<whisper_idl::action::Inference_Feedback>
  : std::true_type
{
};

}  // namespace rosidl_generator_traits


#endif  // WHISPER_IDL__ACTION__DETAIL__INFERENCE__TRAITS_HPP_
