// generated from rosidl_generator_cpp/resource/idl__struct.hpp.em
// with input from whisper_idl:msg/WhisperTokens.idl
// generated code does not contain a copyright notice

#ifndef WHISPER_IDL__MSG__DETAIL__WHISPER_TOKENS__STRUCT_HPP_
#define WHISPER_IDL__MSG__DETAIL__WHISPER_TOKENS__STRUCT_HPP_

#include <algorithm>
#include <array>
#include <cstdint>
#include <memory>
#include <string>
#include <vector>

#include "rosidl_runtime_cpp/bounded_vector.hpp"
#include "rosidl_runtime_cpp/message_initialization.hpp"


// Include directives for member types
// Member 'stamp'
#include "builtin_interfaces/msg/detail/time__struct.hpp"

#ifndef _WIN32
# define DEPRECATED__whisper_idl__msg__WhisperTokens __attribute__((deprecated))
#else
# define DEPRECATED__whisper_idl__msg__WhisperTokens __declspec(deprecated)
#endif

namespace whisper_idl
{

namespace msg
{

// message struct
template<class ContainerAllocator>
struct WhisperTokens_
{
  using Type = WhisperTokens_<ContainerAllocator>;

  explicit WhisperTokens_(rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : stamp(_init)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->inference_duration = 0ll;
    }
  }

  explicit WhisperTokens_(const ContainerAllocator & _alloc, rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : stamp(_alloc, _init)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->inference_duration = 0ll;
    }
  }

  // field types and members
  using _stamp_type =
    builtin_interfaces::msg::Time_<ContainerAllocator>;
  _stamp_type stamp;
  using _token_ids_type =
    std::vector<int32_t, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<int32_t>>;
  _token_ids_type token_ids;
  using _token_texts_type =
    std::vector<std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>>>;
  _token_texts_type token_texts;
  using _token_probs_type =
    std::vector<float, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<float>>;
  _token_probs_type token_probs;
  using _segment_start_token_idxs_type =
    std::vector<int32_t, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<int32_t>>;
  _segment_start_token_idxs_type segment_start_token_idxs;
  using _start_times_type =
    std::vector<int64_t, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<int64_t>>;
  _start_times_type start_times;
  using _end_times_type =
    std::vector<int64_t, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<int64_t>>;
  _end_times_type end_times;
  using _inference_duration_type =
    int64_t;
  _inference_duration_type inference_duration;

  // setters for named parameter idiom
  Type & set__stamp(
    const builtin_interfaces::msg::Time_<ContainerAllocator> & _arg)
  {
    this->stamp = _arg;
    return *this;
  }
  Type & set__token_ids(
    const std::vector<int32_t, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<int32_t>> & _arg)
  {
    this->token_ids = _arg;
    return *this;
  }
  Type & set__token_texts(
    const std::vector<std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>>> & _arg)
  {
    this->token_texts = _arg;
    return *this;
  }
  Type & set__token_probs(
    const std::vector<float, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<float>> & _arg)
  {
    this->token_probs = _arg;
    return *this;
  }
  Type & set__segment_start_token_idxs(
    const std::vector<int32_t, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<int32_t>> & _arg)
  {
    this->segment_start_token_idxs = _arg;
    return *this;
  }
  Type & set__start_times(
    const std::vector<int64_t, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<int64_t>> & _arg)
  {
    this->start_times = _arg;
    return *this;
  }
  Type & set__end_times(
    const std::vector<int64_t, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<int64_t>> & _arg)
  {
    this->end_times = _arg;
    return *this;
  }
  Type & set__inference_duration(
    const int64_t & _arg)
  {
    this->inference_duration = _arg;
    return *this;
  }

  // constant declarations

  // pointer types
  using RawPtr =
    whisper_idl::msg::WhisperTokens_<ContainerAllocator> *;
  using ConstRawPtr =
    const whisper_idl::msg::WhisperTokens_<ContainerAllocator> *;
  using SharedPtr =
    std::shared_ptr<whisper_idl::msg::WhisperTokens_<ContainerAllocator>>;
  using ConstSharedPtr =
    std::shared_ptr<whisper_idl::msg::WhisperTokens_<ContainerAllocator> const>;

  template<typename Deleter = std::default_delete<
      whisper_idl::msg::WhisperTokens_<ContainerAllocator>>>
  using UniquePtrWithDeleter =
    std::unique_ptr<whisper_idl::msg::WhisperTokens_<ContainerAllocator>, Deleter>;

  using UniquePtr = UniquePtrWithDeleter<>;

  template<typename Deleter = std::default_delete<
      whisper_idl::msg::WhisperTokens_<ContainerAllocator>>>
  using ConstUniquePtrWithDeleter =
    std::unique_ptr<whisper_idl::msg::WhisperTokens_<ContainerAllocator> const, Deleter>;
  using ConstUniquePtr = ConstUniquePtrWithDeleter<>;

  using WeakPtr =
    std::weak_ptr<whisper_idl::msg::WhisperTokens_<ContainerAllocator>>;
  using ConstWeakPtr =
    std::weak_ptr<whisper_idl::msg::WhisperTokens_<ContainerAllocator> const>;

  // pointer types similar to ROS 1, use SharedPtr / ConstSharedPtr instead
  // NOTE: Can't use 'using' here because GNU C++ can't parse attributes properly
  typedef DEPRECATED__whisper_idl__msg__WhisperTokens
    std::shared_ptr<whisper_idl::msg::WhisperTokens_<ContainerAllocator>>
    Ptr;
  typedef DEPRECATED__whisper_idl__msg__WhisperTokens
    std::shared_ptr<whisper_idl::msg::WhisperTokens_<ContainerAllocator> const>
    ConstPtr;

  // comparison operators
  bool operator==(const WhisperTokens_ & other) const
  {
    if (this->stamp != other.stamp) {
      return false;
    }
    if (this->token_ids != other.token_ids) {
      return false;
    }
    if (this->token_texts != other.token_texts) {
      return false;
    }
    if (this->token_probs != other.token_probs) {
      return false;
    }
    if (this->segment_start_token_idxs != other.segment_start_token_idxs) {
      return false;
    }
    if (this->start_times != other.start_times) {
      return false;
    }
    if (this->end_times != other.end_times) {
      return false;
    }
    if (this->inference_duration != other.inference_duration) {
      return false;
    }
    return true;
  }
  bool operator!=(const WhisperTokens_ & other) const
  {
    return !this->operator==(other);
  }
};  // struct WhisperTokens_

// alias to use template instance with default allocator
using WhisperTokens =
  whisper_idl::msg::WhisperTokens_<std::allocator<void>>;

// constant definitions

}  // namespace msg

}  // namespace whisper_idl

#endif  // WHISPER_IDL__MSG__DETAIL__WHISPER_TOKENS__STRUCT_HPP_
