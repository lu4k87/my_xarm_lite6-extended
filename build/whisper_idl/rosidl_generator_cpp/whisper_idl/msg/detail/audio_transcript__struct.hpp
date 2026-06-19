// generated from rosidl_generator_cpp/resource/idl__struct.hpp.em
// with input from whisper_idl:msg/AudioTranscript.idl
// generated code does not contain a copyright notice

#ifndef WHISPER_IDL__MSG__DETAIL__AUDIO_TRANSCRIPT__STRUCT_HPP_
#define WHISPER_IDL__MSG__DETAIL__AUDIO_TRANSCRIPT__STRUCT_HPP_

#include <algorithm>
#include <array>
#include <cstdint>
#include <memory>
#include <string>
#include <vector>

#include "rosidl_runtime_cpp/bounded_vector.hpp"
#include "rosidl_runtime_cpp/message_initialization.hpp"


// Include directives for member types
// Member 'seg_start_time'
#include "builtin_interfaces/msg/detail/time__struct.hpp"

#ifndef _WIN32
# define DEPRECATED__whisper_idl__msg__AudioTranscript __attribute__((deprecated))
#else
# define DEPRECATED__whisper_idl__msg__AudioTranscript __declspec(deprecated)
#endif

namespace whisper_idl
{

namespace msg
{

// message struct
template<class ContainerAllocator>
struct AudioTranscript_
{
  using Type = AudioTranscript_<ContainerAllocator>;

  explicit AudioTranscript_(rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->active_index = 0l;
    }
  }

  explicit AudioTranscript_(const ContainerAllocator & _alloc, rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  {
    (void)_alloc;
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->active_index = 0l;
    }
  }

  // field types and members
  using _words_type =
    std::vector<std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>>>;
  _words_type words;
  using _probs_type =
    std::vector<float, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<float>>;
  _probs_type probs;
  using _occ_type =
    std::vector<int32_t, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<int32_t>>;
  _occ_type occ;
  using _seg_start_words_id_type =
    std::vector<int32_t, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<int32_t>>;
  _seg_start_words_id_type seg_start_words_id;
  using _seg_start_time_type =
    std::vector<builtin_interfaces::msg::Time_<ContainerAllocator>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<builtin_interfaces::msg::Time_<ContainerAllocator>>>;
  _seg_start_time_type seg_start_time;
  using _seg_duration_ms_type =
    std::vector<int32_t, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<int32_t>>;
  _seg_duration_ms_type seg_duration_ms;
  using _active_index_type =
    int32_t;
  _active_index_type active_index;

  // setters for named parameter idiom
  Type & set__words(
    const std::vector<std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>>> & _arg)
  {
    this->words = _arg;
    return *this;
  }
  Type & set__probs(
    const std::vector<float, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<float>> & _arg)
  {
    this->probs = _arg;
    return *this;
  }
  Type & set__occ(
    const std::vector<int32_t, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<int32_t>> & _arg)
  {
    this->occ = _arg;
    return *this;
  }
  Type & set__seg_start_words_id(
    const std::vector<int32_t, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<int32_t>> & _arg)
  {
    this->seg_start_words_id = _arg;
    return *this;
  }
  Type & set__seg_start_time(
    const std::vector<builtin_interfaces::msg::Time_<ContainerAllocator>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<builtin_interfaces::msg::Time_<ContainerAllocator>>> & _arg)
  {
    this->seg_start_time = _arg;
    return *this;
  }
  Type & set__seg_duration_ms(
    const std::vector<int32_t, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<int32_t>> & _arg)
  {
    this->seg_duration_ms = _arg;
    return *this;
  }
  Type & set__active_index(
    const int32_t & _arg)
  {
    this->active_index = _arg;
    return *this;
  }

  // constant declarations

  // pointer types
  using RawPtr =
    whisper_idl::msg::AudioTranscript_<ContainerAllocator> *;
  using ConstRawPtr =
    const whisper_idl::msg::AudioTranscript_<ContainerAllocator> *;
  using SharedPtr =
    std::shared_ptr<whisper_idl::msg::AudioTranscript_<ContainerAllocator>>;
  using ConstSharedPtr =
    std::shared_ptr<whisper_idl::msg::AudioTranscript_<ContainerAllocator> const>;

  template<typename Deleter = std::default_delete<
      whisper_idl::msg::AudioTranscript_<ContainerAllocator>>>
  using UniquePtrWithDeleter =
    std::unique_ptr<whisper_idl::msg::AudioTranscript_<ContainerAllocator>, Deleter>;

  using UniquePtr = UniquePtrWithDeleter<>;

  template<typename Deleter = std::default_delete<
      whisper_idl::msg::AudioTranscript_<ContainerAllocator>>>
  using ConstUniquePtrWithDeleter =
    std::unique_ptr<whisper_idl::msg::AudioTranscript_<ContainerAllocator> const, Deleter>;
  using ConstUniquePtr = ConstUniquePtrWithDeleter<>;

  using WeakPtr =
    std::weak_ptr<whisper_idl::msg::AudioTranscript_<ContainerAllocator>>;
  using ConstWeakPtr =
    std::weak_ptr<whisper_idl::msg::AudioTranscript_<ContainerAllocator> const>;

  // pointer types similar to ROS 1, use SharedPtr / ConstSharedPtr instead
  // NOTE: Can't use 'using' here because GNU C++ can't parse attributes properly
  typedef DEPRECATED__whisper_idl__msg__AudioTranscript
    std::shared_ptr<whisper_idl::msg::AudioTranscript_<ContainerAllocator>>
    Ptr;
  typedef DEPRECATED__whisper_idl__msg__AudioTranscript
    std::shared_ptr<whisper_idl::msg::AudioTranscript_<ContainerAllocator> const>
    ConstPtr;

  // comparison operators
  bool operator==(const AudioTranscript_ & other) const
  {
    if (this->words != other.words) {
      return false;
    }
    if (this->probs != other.probs) {
      return false;
    }
    if (this->occ != other.occ) {
      return false;
    }
    if (this->seg_start_words_id != other.seg_start_words_id) {
      return false;
    }
    if (this->seg_start_time != other.seg_start_time) {
      return false;
    }
    if (this->seg_duration_ms != other.seg_duration_ms) {
      return false;
    }
    if (this->active_index != other.active_index) {
      return false;
    }
    return true;
  }
  bool operator!=(const AudioTranscript_ & other) const
  {
    return !this->operator==(other);
  }
};  // struct AudioTranscript_

// alias to use template instance with default allocator
using AudioTranscript =
  whisper_idl::msg::AudioTranscript_<std::allocator<void>>;

// constant definitions

}  // namespace msg

}  // namespace whisper_idl

#endif  // WHISPER_IDL__MSG__DETAIL__AUDIO_TRANSCRIPT__STRUCT_HPP_
