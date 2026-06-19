// generated from rosidl_generator_cpp/resource/idl__traits.hpp.em
// with input from whisper_idl:msg/AudioTranscript.idl
// generated code does not contain a copyright notice

#ifndef WHISPER_IDL__MSG__DETAIL__AUDIO_TRANSCRIPT__TRAITS_HPP_
#define WHISPER_IDL__MSG__DETAIL__AUDIO_TRANSCRIPT__TRAITS_HPP_

#include <stdint.h>

#include <sstream>
#include <string>
#include <type_traits>

#include "whisper_idl/msg/detail/audio_transcript__struct.hpp"
#include "rosidl_runtime_cpp/traits.hpp"

// Include directives for member types
// Member 'seg_start_time'
#include "builtin_interfaces/msg/detail/time__traits.hpp"

namespace whisper_idl
{

namespace msg
{

inline void to_flow_style_yaml(
  const AudioTranscript & msg,
  std::ostream & out)
{
  out << "{";
  // member: words
  {
    if (msg.words.size() == 0) {
      out << "words: []";
    } else {
      out << "words: [";
      size_t pending_items = msg.words.size();
      for (auto item : msg.words) {
        rosidl_generator_traits::value_to_yaml(item, out);
        if (--pending_items > 0) {
          out << ", ";
        }
      }
      out << "]";
    }
    out << ", ";
  }

  // member: probs
  {
    if (msg.probs.size() == 0) {
      out << "probs: []";
    } else {
      out << "probs: [";
      size_t pending_items = msg.probs.size();
      for (auto item : msg.probs) {
        rosidl_generator_traits::value_to_yaml(item, out);
        if (--pending_items > 0) {
          out << ", ";
        }
      }
      out << "]";
    }
    out << ", ";
  }

  // member: occ
  {
    if (msg.occ.size() == 0) {
      out << "occ: []";
    } else {
      out << "occ: [";
      size_t pending_items = msg.occ.size();
      for (auto item : msg.occ) {
        rosidl_generator_traits::value_to_yaml(item, out);
        if (--pending_items > 0) {
          out << ", ";
        }
      }
      out << "]";
    }
    out << ", ";
  }

  // member: seg_start_words_id
  {
    if (msg.seg_start_words_id.size() == 0) {
      out << "seg_start_words_id: []";
    } else {
      out << "seg_start_words_id: [";
      size_t pending_items = msg.seg_start_words_id.size();
      for (auto item : msg.seg_start_words_id) {
        rosidl_generator_traits::value_to_yaml(item, out);
        if (--pending_items > 0) {
          out << ", ";
        }
      }
      out << "]";
    }
    out << ", ";
  }

  // member: seg_start_time
  {
    if (msg.seg_start_time.size() == 0) {
      out << "seg_start_time: []";
    } else {
      out << "seg_start_time: [";
      size_t pending_items = msg.seg_start_time.size();
      for (auto item : msg.seg_start_time) {
        to_flow_style_yaml(item, out);
        if (--pending_items > 0) {
          out << ", ";
        }
      }
      out << "]";
    }
    out << ", ";
  }

  // member: seg_duration_ms
  {
    if (msg.seg_duration_ms.size() == 0) {
      out << "seg_duration_ms: []";
    } else {
      out << "seg_duration_ms: [";
      size_t pending_items = msg.seg_duration_ms.size();
      for (auto item : msg.seg_duration_ms) {
        rosidl_generator_traits::value_to_yaml(item, out);
        if (--pending_items > 0) {
          out << ", ";
        }
      }
      out << "]";
    }
    out << ", ";
  }

  // member: active_index
  {
    out << "active_index: ";
    rosidl_generator_traits::value_to_yaml(msg.active_index, out);
  }
  out << "}";
}  // NOLINT(readability/fn_size)

inline void to_block_style_yaml(
  const AudioTranscript & msg,
  std::ostream & out, size_t indentation = 0)
{
  // member: words
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    if (msg.words.size() == 0) {
      out << "words: []\n";
    } else {
      out << "words:\n";
      for (auto item : msg.words) {
        if (indentation > 0) {
          out << std::string(indentation, ' ');
        }
        out << "- ";
        rosidl_generator_traits::value_to_yaml(item, out);
        out << "\n";
      }
    }
  }

  // member: probs
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    if (msg.probs.size() == 0) {
      out << "probs: []\n";
    } else {
      out << "probs:\n";
      for (auto item : msg.probs) {
        if (indentation > 0) {
          out << std::string(indentation, ' ');
        }
        out << "- ";
        rosidl_generator_traits::value_to_yaml(item, out);
        out << "\n";
      }
    }
  }

  // member: occ
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    if (msg.occ.size() == 0) {
      out << "occ: []\n";
    } else {
      out << "occ:\n";
      for (auto item : msg.occ) {
        if (indentation > 0) {
          out << std::string(indentation, ' ');
        }
        out << "- ";
        rosidl_generator_traits::value_to_yaml(item, out);
        out << "\n";
      }
    }
  }

  // member: seg_start_words_id
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    if (msg.seg_start_words_id.size() == 0) {
      out << "seg_start_words_id: []\n";
    } else {
      out << "seg_start_words_id:\n";
      for (auto item : msg.seg_start_words_id) {
        if (indentation > 0) {
          out << std::string(indentation, ' ');
        }
        out << "- ";
        rosidl_generator_traits::value_to_yaml(item, out);
        out << "\n";
      }
    }
  }

  // member: seg_start_time
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    if (msg.seg_start_time.size() == 0) {
      out << "seg_start_time: []\n";
    } else {
      out << "seg_start_time:\n";
      for (auto item : msg.seg_start_time) {
        if (indentation > 0) {
          out << std::string(indentation, ' ');
        }
        out << "-\n";
        to_block_style_yaml(item, out, indentation + 2);
      }
    }
  }

  // member: seg_duration_ms
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    if (msg.seg_duration_ms.size() == 0) {
      out << "seg_duration_ms: []\n";
    } else {
      out << "seg_duration_ms:\n";
      for (auto item : msg.seg_duration_ms) {
        if (indentation > 0) {
          out << std::string(indentation, ' ');
        }
        out << "- ";
        rosidl_generator_traits::value_to_yaml(item, out);
        out << "\n";
      }
    }
  }

  // member: active_index
  {
    if (indentation > 0) {
      out << std::string(indentation, ' ');
    }
    out << "active_index: ";
    rosidl_generator_traits::value_to_yaml(msg.active_index, out);
    out << "\n";
  }
}  // NOLINT(readability/fn_size)

inline std::string to_yaml(const AudioTranscript & msg, bool use_flow_style = false)
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
  const whisper_idl::msg::AudioTranscript & msg,
  std::ostream & out, size_t indentation = 0)
{
  whisper_idl::msg::to_block_style_yaml(msg, out, indentation);
}

[[deprecated("use whisper_idl::msg::to_yaml() instead")]]
inline std::string to_yaml(const whisper_idl::msg::AudioTranscript & msg)
{
  return whisper_idl::msg::to_yaml(msg);
}

template<>
inline const char * data_type<whisper_idl::msg::AudioTranscript>()
{
  return "whisper_idl::msg::AudioTranscript";
}

template<>
inline const char * name<whisper_idl::msg::AudioTranscript>()
{
  return "whisper_idl/msg/AudioTranscript";
}

template<>
struct has_fixed_size<whisper_idl::msg::AudioTranscript>
  : std::integral_constant<bool, false> {};

template<>
struct has_bounded_size<whisper_idl::msg::AudioTranscript>
  : std::integral_constant<bool, false> {};

template<>
struct is_message<whisper_idl::msg::AudioTranscript>
  : std::true_type {};

}  // namespace rosidl_generator_traits

#endif  // WHISPER_IDL__MSG__DETAIL__AUDIO_TRANSCRIPT__TRAITS_HPP_
