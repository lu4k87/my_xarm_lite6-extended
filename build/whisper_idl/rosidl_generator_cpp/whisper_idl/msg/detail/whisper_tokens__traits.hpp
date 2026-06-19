// generated from rosidl_generator_cpp/resource/idl__traits.hpp.em
// with input from whisper_idl:msg/WhisperTokens.idl
// generated code does not contain a copyright notice

#ifndef WHISPER_IDL__MSG__DETAIL__WHISPER_TOKENS__TRAITS_HPP_
#define WHISPER_IDL__MSG__DETAIL__WHISPER_TOKENS__TRAITS_HPP_

#include <stdint.h>

#include <sstream>
#include <string>
#include <type_traits>

#include "whisper_idl/msg/detail/whisper_tokens__struct.hpp"
#include "rosidl_runtime_cpp/traits.hpp"

// Include directives for member types
// Member 'stamp'
#include "builtin_interfaces/msg/detail/time__traits.hpp"

namespace whisper_idl
{

namespace msg
{

inline void to_flow_style_yaml(
  const WhisperTokens & msg,
  std::ostream & out)
{
  out << "{";
  // member: stamp
  {
    out << "stamp: ";
    to_flow_style_yaml(msg.stamp, out);
    out << ", ";
  }

  // member: token_ids
  {
    if (msg.token_ids.size() == 0) {
      out << "token_ids: []";
    } else {
      out << "token_ids: [";
      size_t pending_items = msg.token_ids.size();
      for (auto item : msg.token_ids) {
        rosidl_generator_traits::value_to_yaml(item, out);
        if (--pending_items > 0) {
          out << ", ";
        }
      }
      out << "]";
    }
    out << ", ";
  }

  // member: token_texts
  {
    if (msg.token_texts.size() == 0) {
      out << "token_texts: []";
    } else {
      out << "token_texts: [";
      size_t pending_items = msg.token_texts.size();
      for (auto item : msg.token_texts) {
        rosidl_generator_traits::value_to_yaml(item, out);
        if (--pending_items > 0) {
          out << ", ";
        }
      }
      out << "]";
    }
    out << ", ";
  }

  // member: token_probs
  {
    if (msg.token_probs.size() == 0) {
      out << "token_probs: []";
    } else {
      out << "token_probs: [";
      size_t pending_items = msg.token_probs.size();
      for (auto item : msg.token_probs) {
        rosidl_generator_traits::value_to_yaml(item, out);
        if (--pending_items > 0) {
          out << ", ";
        }
      }
      out << "]";
    }
    out << ", ";
  }

  // member: segment_start_token_idxs
  {
    if (msg.segment_start_token_idxs.size() == 0) {
      out << "segment_start_token_idxs: []";
    } else {
      out << "segment_start_token_idxs: [";
      size_t pending_items = msg.segment_start_token_idxs.size();
      for (auto item : msg.segment_start_token_idxs) {
        rosidl_generator_traits::value_to_yaml(item, out);
        if (--pending_items > 0) {
          out << ", ";
        }
      }
      out << "]";
    }
    out << ", ";
  }

  // member: start_times
  {
    if (msg.start_times.size() == 0) {
      out << "start_times: []";
    } else {
      out << "start_times: [";
      size_t pending_items = msg.start_times.size();
      for (auto item : msg.start_times) {
        rosidl_generator_traits::value_to_yaml(item, out);
        if (--pending_items > 0) {
          out << ", ";
        }
      }
      out << "]";
    }
    out << ", ";
  }

  // member: end_times
  {
    if (msg.end_times.size() == 0) {
      out << "end_times: []";
    } else {
      out << "end_times: [";
      size_t pending_items = msg.end_times.size();
      for (auto item : msg.end_times) {
        rosidl_generator_traits::value_to_yaml(item, out);
        if (--pending_items > 0) {
          out << ", ";
        }
      }
      out << "]";
    }
    out << ", ";
  }

  // member: inference_duration
  {
    out << "inference_duration: ";
    rosidl_generator_traits::value_to_yaml(msg.inference_duration, out);
  }
  out << "}";
}  // NOLINT(readability/fn_size)

inline void to_block_style_yaml(
  const WhisperTokens & msg,
  std::ostream & out, size_t indentation = 0)
{
  // member: stamp
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "stamp:\n";
    to_block_style_yaml(msg.stamp, out, indentation + 2);
  }

  // member: token_ids
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    if (msg.token_ids.size() == 0) {
      out << "token_ids: []\n";
    } else {
      out << "token_ids:\n";
      for (auto item : msg.token_ids) {
        if (indentation > 0) {
          out << std::string(indentation, ' ');
        }
        out << "- ";
        rosidl_generator_traits::value_to_yaml(item, out);
        out << "\n";
      }
    }
  }

  // member: token_texts
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    if (msg.token_texts.size() == 0) {
      out << "token_texts: []\n";
    } else {
      out << "token_texts:\n";
      for (auto item : msg.token_texts) {
        if (indentation > 0) {
          out << std::string(indentation, ' ');
        }
        out << "- ";
        rosidl_generator_traits::value_to_yaml(item, out);
        out << "\n";
      }
    }
  }

  // member: token_probs
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    if (msg.token_probs.size() == 0) {
      out << "token_probs: []\n";
    } else {
      out << "token_probs:\n";
      for (auto item : msg.token_probs) {
        if (indentation > 0) {
          out << std::string(indentation, ' ');
        }
        out << "- ";
        rosidl_generator_traits::value_to_yaml(item, out);
        out << "\n";
      }
    }
  }

  // member: segment_start_token_idxs
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    if (msg.segment_start_token_idxs.size() == 0) {
      out << "segment_start_token_idxs: []\n";
    } else {
      out << "segment_start_token_idxs:\n";
      for (auto item : msg.segment_start_token_idxs) {
        if (indentation > 0) {
          out << std::string(indentation, ' ');
        }
        out << "- ";
        rosidl_generator_traits::value_to_yaml(item, out);
        out << "\n";
      }
    }
  }

  // member: start_times
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    if (msg.start_times.size() == 0) {
      out << "start_times: []\n";
    } else {
      out << "start_times:\n";
      for (auto item : msg.start_times) {
        if (indentation > 0) {
          out << std::string(indentation, ' ');
        }
        out << "- ";
        rosidl_generator_traits::value_to_yaml(item, out);
        out << "\n";
      }
    }
  }

  // member: end_times
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    if (msg.end_times.size() == 0) {
      out << "end_times: []\n";
    } else {
      out << "end_times:\n";
      for (auto item : msg.end_times) {
        if (indentation > 0) {
          out << std::string(indentation, ' ');
        }
        out << "- ";
        rosidl_generator_traits::value_to_yaml(item, out);
        out << "\n";
      }
    }
  }

  // member: inference_duration
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "inference_duration: ";
    rosidl_generator_traits::value_to_yaml(msg.inference_duration, out);
    out << "\n";
  }
}  // NOLINT(readability/fn_size)

inline std::string to_yaml(const WhisperTokens & msg, bool use_flow_style = false)
{
  std::ostringstream out;
  if (use_flow_style) {
    to_flow_style_yaml(msg, out);
  } else {
    to_block_style_yaml(msg, out);
  }
  return out.str();
}

}  // namespace msg

}  // namespace whisper_idl

namespace rosidl_generator_traits
{

[[deprecated("use whisper_idl::msg::to_block_style_yaml() instead")]]
inline void to_yaml(
  const whisper_idl::msg::WhisperTokens & msg,
  std::ostream & out, size_t indentation = 0)
{
  whisper_idl::msg::to_block_style_yaml(msg, out, indentation);
}

[[deprecated("use whisper_idl::msg::to_yaml() instead")]]
inline std::string to_yaml(const whisper_idl::msg::WhisperTokens & msg)
{
  return whisper_idl::msg::to_yaml(msg);
}

template<>
inline const char * data_type<whisper_idl::msg::WhisperTokens>()
{
  return "whisper_idl::msg::WhisperTokens";
}

template<>
inline const char * name<whisper_idl::msg::WhisperTokens>()
{
  return "whisper_idl/msg/WhisperTokens";
}

template<>
struct has_fixed_size<whisper_idl::msg::WhisperTokens>
  : std::integral_constant<bool, false> {};

template<>
struct has_bounded_size<whisper_idl::msg::WhisperTokens>
  : std::integral_constant<bool, false> {};

template<>
struct is_message<whisper_idl::msg::WhisperTokens>
  : std::true_type {};

}  // namespace rosidl_generator_traits

#endif  // WHISPER_IDL__MSG__DETAIL__WHISPER_TOKENS__TRAITS_HPP_
