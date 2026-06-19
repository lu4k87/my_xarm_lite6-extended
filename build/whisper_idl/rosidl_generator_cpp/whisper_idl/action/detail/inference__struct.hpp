// generated from rosidl_generator_cpp/resource/idl__struct.hpp.em
// with input from whisper_idl:action/Inference.idl
// generated code does not contain a copyright notice

#ifndef WHISPER_IDL__ACTION__DETAIL__INFERENCE__STRUCT_HPP_
#define WHISPER_IDL__ACTION__DETAIL__INFERENCE__STRUCT_HPP_

#include <algorithm>
#include <array>
#include <cstdint>
#include <memory>
#include <string>
#include <vector>

#include "rosidl_runtime_cpp/bounded_vector.hpp"
#include "rosidl_runtime_cpp/message_initialization.hpp"


// Include directives for member types
// Member 'max_duration'
#include "builtin_interfaces/msg/detail/duration__struct.hpp"

#ifndef _WIN32
# define DEPRECATED__whisper_idl__action__Inference_Goal __attribute__((deprecated))
#else
# define DEPRECATED__whisper_idl__action__Inference_Goal __declspec(deprecated)
#endif

namespace whisper_idl
{

namespace action
{

// message struct
template<class ContainerAllocator>
struct Inference_Goal_
{
  using Type = Inference_Goal_<ContainerAllocator>;

  explicit Inference_Goal_(rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : max_duration(_init)
  {
    (void)_init;
  }

  explicit Inference_Goal_(const ContainerAllocator & _alloc, rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : max_duration(_alloc, _init)
  {
    (void)_init;
  }

  // field types and members
  using _max_duration_type =
    builtin_interfaces::msg::Duration_<ContainerAllocator>;
  _max_duration_type max_duration;

  // setters for named parameter idiom
  Type & set__max_duration(
    const builtin_interfaces::msg::Duration_<ContainerAllocator> & _arg)
  {
    this->max_duration = _arg;
    return *this;
  }

  // constant declarations

  // pointer types
  using RawPtr =
    whisper_idl::action::Inference_Goal_<ContainerAllocator> *;
  using ConstRawPtr =
    const whisper_idl::action::Inference_Goal_<ContainerAllocator> *;
  using SharedPtr =
    std::shared_ptr<whisper_idl::action::Inference_Goal_<ContainerAllocator>>;
  using ConstSharedPtr =
    std::shared_ptr<whisper_idl::action::Inference_Goal_<ContainerAllocator> const>;

  template<typename Deleter = std::default_delete<
      whisper_idl::action::Inference_Goal_<ContainerAllocator>>>
  using UniquePtrWithDeleter =
    std::unique_ptr<whisper_idl::action::Inference_Goal_<ContainerAllocator>, Deleter>;

  using UniquePtr = UniquePtrWithDeleter<>;

  template<typename Deleter = std::default_delete<
      whisper_idl::action::Inference_Goal_<ContainerAllocator>>>
  using ConstUniquePtrWithDeleter =
    std::unique_ptr<whisper_idl::action::Inference_Goal_<ContainerAllocator> const, Deleter>;
  using ConstUniquePtr = ConstUniquePtrWithDeleter<>;

  using WeakPtr =
    std::weak_ptr<whisper_idl::action::Inference_Goal_<ContainerAllocator>>;
  using ConstWeakPtr =
    std::weak_ptr<whisper_idl::action::Inference_Goal_<ContainerAllocator> const>;

  // pointer types similar to ROS 1, use SharedPtr / ConstSharedPtr instead
  // NOTE: Can't use 'using' here because GNU C++ can't parse attributes properly
  typedef DEPRECATED__whisper_idl__action__Inference_Goal
    std::shared_ptr<whisper_idl::action::Inference_Goal_<ContainerAllocator>>
    Ptr;
  typedef DEPRECATED__whisper_idl__action__Inference_Goal
    std::shared_ptr<whisper_idl::action::Inference_Goal_<ContainerAllocator> const>
    ConstPtr;

  // comparison operators
  bool operator==(const Inference_Goal_ & other) const
  {
    if (this->max_duration != other.max_duration) {
      return false;
    }
    return true;
  }
  bool operator!=(const Inference_Goal_ & other) const
  {
    return !this->operator==(other);
  }
};  // struct Inference_Goal_

// alias to use template instance with default allocator
using Inference_Goal =
  whisper_idl::action::Inference_Goal_<std::allocator<void>>;

// constant definitions

}  // namespace action

}  // namespace whisper_idl


#ifndef _WIN32
# define DEPRECATED__whisper_idl__action__Inference_Result __attribute__((deprecated))
#else
# define DEPRECATED__whisper_idl__action__Inference_Result __declspec(deprecated)
#endif

namespace whisper_idl
{

namespace action
{

// message struct
template<class ContainerAllocator>
struct Inference_Result_
{
  using Type = Inference_Result_<ContainerAllocator>;

  explicit Inference_Result_(rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->info = "";
    }
  }

  explicit Inference_Result_(const ContainerAllocator & _alloc, rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : info(_alloc)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->info = "";
    }
  }

  // field types and members
  using _info_type =
    std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>;
  _info_type info;
  using _transcriptions_type =
    std::vector<std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>>>;
  _transcriptions_type transcriptions;

  // setters for named parameter idiom
  Type & set__info(
    const std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>> & _arg)
  {
    this->info = _arg;
    return *this;
  }
  Type & set__transcriptions(
    const std::vector<std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>>> & _arg)
  {
    this->transcriptions = _arg;
    return *this;
  }

  // constant declarations

  // pointer types
  using RawPtr =
    whisper_idl::action::Inference_Result_<ContainerAllocator> *;
  using ConstRawPtr =
    const whisper_idl::action::Inference_Result_<ContainerAllocator> *;
  using SharedPtr =
    std::shared_ptr<whisper_idl::action::Inference_Result_<ContainerAllocator>>;
  using ConstSharedPtr =
    std::shared_ptr<whisper_idl::action::Inference_Result_<ContainerAllocator> const>;

  template<typename Deleter = std::default_delete<
      whisper_idl::action::Inference_Result_<ContainerAllocator>>>
  using UniquePtrWithDeleter =
    std::unique_ptr<whisper_idl::action::Inference_Result_<ContainerAllocator>, Deleter>;

  using UniquePtr = UniquePtrWithDeleter<>;

  template<typename Deleter = std::default_delete<
      whisper_idl::action::Inference_Result_<ContainerAllocator>>>
  using ConstUniquePtrWithDeleter =
    std::unique_ptr<whisper_idl::action::Inference_Result_<ContainerAllocator> const, Deleter>;
  using ConstUniquePtr = ConstUniquePtrWithDeleter<>;

  using WeakPtr =
    std::weak_ptr<whisper_idl::action::Inference_Result_<ContainerAllocator>>;
  using ConstWeakPtr =
    std::weak_ptr<whisper_idl::action::Inference_Result_<ContainerAllocator> const>;

  // pointer types similar to ROS 1, use SharedPtr / ConstSharedPtr instead
  // NOTE: Can't use 'using' here because GNU C++ can't parse attributes properly
  typedef DEPRECATED__whisper_idl__action__Inference_Result
    std::shared_ptr<whisper_idl::action::Inference_Result_<ContainerAllocator>>
    Ptr;
  typedef DEPRECATED__whisper_idl__action__Inference_Result
    std::shared_ptr<whisper_idl::action::Inference_Result_<ContainerAllocator> const>
    ConstPtr;

  // comparison operators
  bool operator==(const Inference_Result_ & other) const
  {
    if (this->info != other.info) {
      return false;
    }
    if (this->transcriptions != other.transcriptions) {
      return false;
    }
    return true;
  }
  bool operator!=(const Inference_Result_ & other) const
  {
    return !this->operator==(other);
  }
};  // struct Inference_Result_

// alias to use template instance with default allocator
using Inference_Result =
  whisper_idl::action::Inference_Result_<std::allocator<void>>;

// constant definitions

}  // namespace action

}  // namespace whisper_idl


#ifndef _WIN32
# define DEPRECATED__whisper_idl__action__Inference_Feedback __attribute__((deprecated))
#else
# define DEPRECATED__whisper_idl__action__Inference_Feedback __declspec(deprecated)
#endif

namespace whisper_idl
{

namespace action
{

// message struct
template<class ContainerAllocator>
struct Inference_Feedback_
{
  using Type = Inference_Feedback_<ContainerAllocator>;

  explicit Inference_Feedback_(rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->batch_idx = 0;
      this->transcription = "";
    }
  }

  explicit Inference_Feedback_(const ContainerAllocator & _alloc, rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : transcription(_alloc)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->batch_idx = 0;
      this->transcription = "";
    }
  }

  // field types and members
  using _batch_idx_type =
    uint16_t;
  _batch_idx_type batch_idx;
  using _transcription_type =
    std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>>;
  _transcription_type transcription;

  // setters for named parameter idiom
  Type & set__batch_idx(
    const uint16_t & _arg)
  {
    this->batch_idx = _arg;
    return *this;
  }
  Type & set__transcription(
    const std::basic_string<char, std::char_traits<char>, typename std::allocator_traits<ContainerAllocator>::template rebind_alloc<char>> & _arg)
  {
    this->transcription = _arg;
    return *this;
  }

  // constant declarations

  // pointer types
  using RawPtr =
    whisper_idl::action::Inference_Feedback_<ContainerAllocator> *;
  using ConstRawPtr =
    const whisper_idl::action::Inference_Feedback_<ContainerAllocator> *;
  using SharedPtr =
    std::shared_ptr<whisper_idl::action::Inference_Feedback_<ContainerAllocator>>;
  using ConstSharedPtr =
    std::shared_ptr<whisper_idl::action::Inference_Feedback_<ContainerAllocator> const>;

  template<typename Deleter = std::default_delete<
      whisper_idl::action::Inference_Feedback_<ContainerAllocator>>>
  using UniquePtrWithDeleter =
    std::unique_ptr<whisper_idl::action::Inference_Feedback_<ContainerAllocator>, Deleter>;

  using UniquePtr = UniquePtrWithDeleter<>;

  template<typename Deleter = std::default_delete<
      whisper_idl::action::Inference_Feedback_<ContainerAllocator>>>
  using ConstUniquePtrWithDeleter =
    std::unique_ptr<whisper_idl::action::Inference_Feedback_<ContainerAllocator> const, Deleter>;
  using ConstUniquePtr = ConstUniquePtrWithDeleter<>;

  using WeakPtr =
    std::weak_ptr<whisper_idl::action::Inference_Feedback_<ContainerAllocator>>;
  using ConstWeakPtr =
    std::weak_ptr<whisper_idl::action::Inference_Feedback_<ContainerAllocator> const>;

  // pointer types similar to ROS 1, use SharedPtr / ConstSharedPtr instead
  // NOTE: Can't use 'using' here because GNU C++ can't parse attributes properly
  typedef DEPRECATED__whisper_idl__action__Inference_Feedback
    std::shared_ptr<whisper_idl::action::Inference_Feedback_<ContainerAllocator>>
    Ptr;
  typedef DEPRECATED__whisper_idl__action__Inference_Feedback
    std::shared_ptr<whisper_idl::action::Inference_Feedback_<ContainerAllocator> const>
    ConstPtr;

  // comparison operators
  bool operator==(const Inference_Feedback_ & other) const
  {
    if (this->batch_idx != other.batch_idx) {
      return false;
    }
    if (this->transcription != other.transcription) {
      return false;
    }
    return true;
  }
  bool operator!=(const Inference_Feedback_ & other) const
  {
    return !this->operator==(other);
  }
};  // struct Inference_Feedback_

// alias to use template instance with default allocator
using Inference_Feedback =
  whisper_idl::action::Inference_Feedback_<std::allocator<void>>;

// constant definitions

}  // namespace action

}  // namespace whisper_idl


// Include directives for member types
// Member 'goal_id'
#include "unique_identifier_msgs/msg/detail/uuid__struct.hpp"
// Member 'goal'
#include "whisper_idl/action/detail/inference__struct.hpp"

#ifndef _WIN32
# define DEPRECATED__whisper_idl__action__Inference_SendGoal_Request __attribute__((deprecated))
#else
# define DEPRECATED__whisper_idl__action__Inference_SendGoal_Request __declspec(deprecated)
#endif

namespace whisper_idl
{

namespace action
{

// message struct
template<class ContainerAllocator>
struct Inference_SendGoal_Request_
{
  using Type = Inference_SendGoal_Request_<ContainerAllocator>;

  explicit Inference_SendGoal_Request_(rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : goal_id(_init),
    goal(_init)
  {
    (void)_init;
  }

  explicit Inference_SendGoal_Request_(const ContainerAllocator & _alloc, rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : goal_id(_alloc, _init),
    goal(_alloc, _init)
  {
    (void)_init;
  }

  // field types and members
  using _goal_id_type =
    unique_identifier_msgs::msg::UUID_<ContainerAllocator>;
  _goal_id_type goal_id;
  using _goal_type =
    whisper_idl::action::Inference_Goal_<ContainerAllocator>;
  _goal_type goal;

  // setters for named parameter idiom
  Type & set__goal_id(
    const unique_identifier_msgs::msg::UUID_<ContainerAllocator> & _arg)
  {
    this->goal_id = _arg;
    return *this;
  }
  Type & set__goal(
    const whisper_idl::action::Inference_Goal_<ContainerAllocator> & _arg)
  {
    this->goal = _arg;
    return *this;
  }

  // constant declarations

  // pointer types
  using RawPtr =
    whisper_idl::action::Inference_SendGoal_Request_<ContainerAllocator> *;
  using ConstRawPtr =
    const whisper_idl::action::Inference_SendGoal_Request_<ContainerAllocator> *;
  using SharedPtr =
    std::shared_ptr<whisper_idl::action::Inference_SendGoal_Request_<ContainerAllocator>>;
  using ConstSharedPtr =
    std::shared_ptr<whisper_idl::action::Inference_SendGoal_Request_<ContainerAllocator> const>;

  template<typename Deleter = std::default_delete<
      whisper_idl::action::Inference_SendGoal_Request_<ContainerAllocator>>>
  using UniquePtrWithDeleter =
    std::unique_ptr<whisper_idl::action::Inference_SendGoal_Request_<ContainerAllocator>, Deleter>;

  using UniquePtr = UniquePtrWithDeleter<>;

  template<typename Deleter = std::default_delete<
      whisper_idl::action::Inference_SendGoal_Request_<ContainerAllocator>>>
  using ConstUniquePtrWithDeleter =
    std::unique_ptr<whisper_idl::action::Inference_SendGoal_Request_<ContainerAllocator> const, Deleter>;
  using ConstUniquePtr = ConstUniquePtrWithDeleter<>;

  using WeakPtr =
    std::weak_ptr<whisper_idl::action::Inference_SendGoal_Request_<ContainerAllocator>>;
  using ConstWeakPtr =
    std::weak_ptr<whisper_idl::action::Inference_SendGoal_Request_<ContainerAllocator> const>;

  // pointer types similar to ROS 1, use SharedPtr / ConstSharedPtr instead
  // NOTE: Can't use 'using' here because GNU C++ can't parse attributes properly
  typedef DEPRECATED__whisper_idl__action__Inference_SendGoal_Request
    std::shared_ptr<whisper_idl::action::Inference_SendGoal_Request_<ContainerAllocator>>
    Ptr;
  typedef DEPRECATED__whisper_idl__action__Inference_SendGoal_Request
    std::shared_ptr<whisper_idl::action::Inference_SendGoal_Request_<ContainerAllocator> const>
    ConstPtr;

  // comparison operators
  bool operator==(const Inference_SendGoal_Request_ & other) const
  {
    if (this->goal_id != other.goal_id) {
      return false;
    }
    if (this->goal != other.goal) {
      return false;
    }
    return true;
  }
  bool operator!=(const Inference_SendGoal_Request_ & other) const
  {
    return !this->operator==(other);
  }
};  // struct Inference_SendGoal_Request_

// alias to use template instance with default allocator
using Inference_SendGoal_Request =
  whisper_idl::action::Inference_SendGoal_Request_<std::allocator<void>>;

// constant definitions

}  // namespace action

}  // namespace whisper_idl


// Include directives for member types
// Member 'stamp'
#include "builtin_interfaces/msg/detail/time__struct.hpp"

#ifndef _WIN32
# define DEPRECATED__whisper_idl__action__Inference_SendGoal_Response __attribute__((deprecated))
#else
# define DEPRECATED__whisper_idl__action__Inference_SendGoal_Response __declspec(deprecated)
#endif

namespace whisper_idl
{

namespace action
{

// message struct
template<class ContainerAllocator>
struct Inference_SendGoal_Response_
{
  using Type = Inference_SendGoal_Response_<ContainerAllocator>;

  explicit Inference_SendGoal_Response_(rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : stamp(_init)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->accepted = false;
    }
  }

  explicit Inference_SendGoal_Response_(const ContainerAllocator & _alloc, rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : stamp(_alloc, _init)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->accepted = false;
    }
  }

  // field types and members
  using _accepted_type =
    bool;
  _accepted_type accepted;
  using _stamp_type =
    builtin_interfaces::msg::Time_<ContainerAllocator>;
  _stamp_type stamp;

  // setters for named parameter idiom
  Type & set__accepted(
    const bool & _arg)
  {
    this->accepted = _arg;
    return *this;
  }
  Type & set__stamp(
    const builtin_interfaces::msg::Time_<ContainerAllocator> & _arg)
  {
    this->stamp = _arg;
    return *this;
  }

  // constant declarations

  // pointer types
  using RawPtr =
    whisper_idl::action::Inference_SendGoal_Response_<ContainerAllocator> *;
  using ConstRawPtr =
    const whisper_idl::action::Inference_SendGoal_Response_<ContainerAllocator> *;
  using SharedPtr =
    std::shared_ptr<whisper_idl::action::Inference_SendGoal_Response_<ContainerAllocator>>;
  using ConstSharedPtr =
    std::shared_ptr<whisper_idl::action::Inference_SendGoal_Response_<ContainerAllocator> const>;

  template<typename Deleter = std::default_delete<
      whisper_idl::action::Inference_SendGoal_Response_<ContainerAllocator>>>
  using UniquePtrWithDeleter =
    std::unique_ptr<whisper_idl::action::Inference_SendGoal_Response_<ContainerAllocator>, Deleter>;

  using UniquePtr = UniquePtrWithDeleter<>;

  template<typename Deleter = std::default_delete<
      whisper_idl::action::Inference_SendGoal_Response_<ContainerAllocator>>>
  using ConstUniquePtrWithDeleter =
    std::unique_ptr<whisper_idl::action::Inference_SendGoal_Response_<ContainerAllocator> const, Deleter>;
  using ConstUniquePtr = ConstUniquePtrWithDeleter<>;

  using WeakPtr =
    std::weak_ptr<whisper_idl::action::Inference_SendGoal_Response_<ContainerAllocator>>;
  using ConstWeakPtr =
    std::weak_ptr<whisper_idl::action::Inference_SendGoal_Response_<ContainerAllocator> const>;

  // pointer types similar to ROS 1, use SharedPtr / ConstSharedPtr instead
  // NOTE: Can't use 'using' here because GNU C++ can't parse attributes properly
  typedef DEPRECATED__whisper_idl__action__Inference_SendGoal_Response
    std::shared_ptr<whisper_idl::action::Inference_SendGoal_Response_<ContainerAllocator>>
    Ptr;
  typedef DEPRECATED__whisper_idl__action__Inference_SendGoal_Response
    std::shared_ptr<whisper_idl::action::Inference_SendGoal_Response_<ContainerAllocator> const>
    ConstPtr;

  // comparison operators
  bool operator==(const Inference_SendGoal_Response_ & other) const
  {
    if (this->accepted != other.accepted) {
      return false;
    }
    if (this->stamp != other.stamp) {
      return false;
    }
    return true;
  }
  bool operator!=(const Inference_SendGoal_Response_ & other) const
  {
    return !this->operator==(other);
  }
};  // struct Inference_SendGoal_Response_

// alias to use template instance with default allocator
using Inference_SendGoal_Response =
  whisper_idl::action::Inference_SendGoal_Response_<std::allocator<void>>;

// constant definitions

}  // namespace action

}  // namespace whisper_idl

namespace whisper_idl
{

namespace action
{

struct Inference_SendGoal
{
  using Request = whisper_idl::action::Inference_SendGoal_Request;
  using Response = whisper_idl::action::Inference_SendGoal_Response;
};

}  // namespace action

}  // namespace whisper_idl


// Include directives for member types
// Member 'goal_id'
// already included above
// #include "unique_identifier_msgs/msg/detail/uuid__struct.hpp"

#ifndef _WIN32
# define DEPRECATED__whisper_idl__action__Inference_GetResult_Request __attribute__((deprecated))
#else
# define DEPRECATED__whisper_idl__action__Inference_GetResult_Request __declspec(deprecated)
#endif

namespace whisper_idl
{

namespace action
{

// message struct
template<class ContainerAllocator>
struct Inference_GetResult_Request_
{
  using Type = Inference_GetResult_Request_<ContainerAllocator>;

  explicit Inference_GetResult_Request_(rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : goal_id(_init)
  {
    (void)_init;
  }

  explicit Inference_GetResult_Request_(const ContainerAllocator & _alloc, rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : goal_id(_alloc, _init)
  {
    (void)_init;
  }

  // field types and members
  using _goal_id_type =
    unique_identifier_msgs::msg::UUID_<ContainerAllocator>;
  _goal_id_type goal_id;

  // setters for named parameter idiom
  Type & set__goal_id(
    const unique_identifier_msgs::msg::UUID_<ContainerAllocator> & _arg)
  {
    this->goal_id = _arg;
    return *this;
  }

  // constant declarations

  // pointer types
  using RawPtr =
    whisper_idl::action::Inference_GetResult_Request_<ContainerAllocator> *;
  using ConstRawPtr =
    const whisper_idl::action::Inference_GetResult_Request_<ContainerAllocator> *;
  using SharedPtr =
    std::shared_ptr<whisper_idl::action::Inference_GetResult_Request_<ContainerAllocator>>;
  using ConstSharedPtr =
    std::shared_ptr<whisper_idl::action::Inference_GetResult_Request_<ContainerAllocator> const>;

  template<typename Deleter = std::default_delete<
      whisper_idl::action::Inference_GetResult_Request_<ContainerAllocator>>>
  using UniquePtrWithDeleter =
    std::unique_ptr<whisper_idl::action::Inference_GetResult_Request_<ContainerAllocator>, Deleter>;

  using UniquePtr = UniquePtrWithDeleter<>;

  template<typename Deleter = std::default_delete<
      whisper_idl::action::Inference_GetResult_Request_<ContainerAllocator>>>
  using ConstUniquePtrWithDeleter =
    std::unique_ptr<whisper_idl::action::Inference_GetResult_Request_<ContainerAllocator> const, Deleter>;
  using ConstUniquePtr = ConstUniquePtrWithDeleter<>;

  using WeakPtr =
    std::weak_ptr<whisper_idl::action::Inference_GetResult_Request_<ContainerAllocator>>;
  using ConstWeakPtr =
    std::weak_ptr<whisper_idl::action::Inference_GetResult_Request_<ContainerAllocator> const>;

  // pointer types similar to ROS 1, use SharedPtr / ConstSharedPtr instead
  // NOTE: Can't use 'using' here because GNU C++ can't parse attributes properly
  typedef DEPRECATED__whisper_idl__action__Inference_GetResult_Request
    std::shared_ptr<whisper_idl::action::Inference_GetResult_Request_<ContainerAllocator>>
    Ptr;
  typedef DEPRECATED__whisper_idl__action__Inference_GetResult_Request
    std::shared_ptr<whisper_idl::action::Inference_GetResult_Request_<ContainerAllocator> const>
    ConstPtr;

  // comparison operators
  bool operator==(const Inference_GetResult_Request_ & other) const
  {
    if (this->goal_id != other.goal_id) {
      return false;
    }
    return true;
  }
  bool operator!=(const Inference_GetResult_Request_ & other) const
  {
    return !this->operator==(other);
  }
};  // struct Inference_GetResult_Request_

// alias to use template instance with default allocator
using Inference_GetResult_Request =
  whisper_idl::action::Inference_GetResult_Request_<std::allocator<void>>;

// constant definitions

}  // namespace action

}  // namespace whisper_idl


// Include directives for member types
// Member 'result'
// already included above
// #include "whisper_idl/action/detail/inference__struct.hpp"

#ifndef _WIN32
# define DEPRECATED__whisper_idl__action__Inference_GetResult_Response __attribute__((deprecated))
#else
# define DEPRECATED__whisper_idl__action__Inference_GetResult_Response __declspec(deprecated)
#endif

namespace whisper_idl
{

namespace action
{

// message struct
template<class ContainerAllocator>
struct Inference_GetResult_Response_
{
  using Type = Inference_GetResult_Response_<ContainerAllocator>;

  explicit Inference_GetResult_Response_(rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : result(_init)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->status = 0;
    }
  }

  explicit Inference_GetResult_Response_(const ContainerAllocator & _alloc, rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : result(_alloc, _init)
  {
    if (rosidl_runtime_cpp::MessageInitialization::ALL == _init ||
      rosidl_runtime_cpp::MessageInitialization::ZERO == _init)
    {
      this->status = 0;
    }
  }

  // field types and members
  using _status_type =
    int8_t;
  _status_type status;
  using _result_type =
    whisper_idl::action::Inference_Result_<ContainerAllocator>;
  _result_type result;

  // setters for named parameter idiom
  Type & set__status(
    const int8_t & _arg)
  {
    this->status = _arg;
    return *this;
  }
  Type & set__result(
    const whisper_idl::action::Inference_Result_<ContainerAllocator> & _arg)
  {
    this->result = _arg;
    return *this;
  }

  // constant declarations

  // pointer types
  using RawPtr =
    whisper_idl::action::Inference_GetResult_Response_<ContainerAllocator> *;
  using ConstRawPtr =
    const whisper_idl::action::Inference_GetResult_Response_<ContainerAllocator> *;
  using SharedPtr =
    std::shared_ptr<whisper_idl::action::Inference_GetResult_Response_<ContainerAllocator>>;
  using ConstSharedPtr =
    std::shared_ptr<whisper_idl::action::Inference_GetResult_Response_<ContainerAllocator> const>;

  template<typename Deleter = std::default_delete<
      whisper_idl::action::Inference_GetResult_Response_<ContainerAllocator>>>
  using UniquePtrWithDeleter =
    std::unique_ptr<whisper_idl::action::Inference_GetResult_Response_<ContainerAllocator>, Deleter>;

  using UniquePtr = UniquePtrWithDeleter<>;

  template<typename Deleter = std::default_delete<
      whisper_idl::action::Inference_GetResult_Response_<ContainerAllocator>>>
  using ConstUniquePtrWithDeleter =
    std::unique_ptr<whisper_idl::action::Inference_GetResult_Response_<ContainerAllocator> const, Deleter>;
  using ConstUniquePtr = ConstUniquePtrWithDeleter<>;

  using WeakPtr =
    std::weak_ptr<whisper_idl::action::Inference_GetResult_Response_<ContainerAllocator>>;
  using ConstWeakPtr =
    std::weak_ptr<whisper_idl::action::Inference_GetResult_Response_<ContainerAllocator> const>;

  // pointer types similar to ROS 1, use SharedPtr / ConstSharedPtr instead
  // NOTE: Can't use 'using' here because GNU C++ can't parse attributes properly
  typedef DEPRECATED__whisper_idl__action__Inference_GetResult_Response
    std::shared_ptr<whisper_idl::action::Inference_GetResult_Response_<ContainerAllocator>>
    Ptr;
  typedef DEPRECATED__whisper_idl__action__Inference_GetResult_Response
    std::shared_ptr<whisper_idl::action::Inference_GetResult_Response_<ContainerAllocator> const>
    ConstPtr;

  // comparison operators
  bool operator==(const Inference_GetResult_Response_ & other) const
  {
    if (this->status != other.status) {
      return false;
    }
    if (this->result != other.result) {
      return false;
    }
    return true;
  }
  bool operator!=(const Inference_GetResult_Response_ & other) const
  {
    return !this->operator==(other);
  }
};  // struct Inference_GetResult_Response_

// alias to use template instance with default allocator
using Inference_GetResult_Response =
  whisper_idl::action::Inference_GetResult_Response_<std::allocator<void>>;

// constant definitions

}  // namespace action

}  // namespace whisper_idl

namespace whisper_idl
{

namespace action
{

struct Inference_GetResult
{
  using Request = whisper_idl::action::Inference_GetResult_Request;
  using Response = whisper_idl::action::Inference_GetResult_Response;
};

}  // namespace action

}  // namespace whisper_idl


// Include directives for member types
// Member 'goal_id'
// already included above
// #include "unique_identifier_msgs/msg/detail/uuid__struct.hpp"
// Member 'feedback'
// already included above
// #include "whisper_idl/action/detail/inference__struct.hpp"

#ifndef _WIN32
# define DEPRECATED__whisper_idl__action__Inference_FeedbackMessage __attribute__((deprecated))
#else
# define DEPRECATED__whisper_idl__action__Inference_FeedbackMessage __declspec(deprecated)
#endif

namespace whisper_idl
{

namespace action
{

// message struct
template<class ContainerAllocator>
struct Inference_FeedbackMessage_
{
  using Type = Inference_FeedbackMessage_<ContainerAllocator>;

  explicit Inference_FeedbackMessage_(rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : goal_id(_init),
    feedback(_init)
  {
    (void)_init;
  }

  explicit Inference_FeedbackMessage_(const ContainerAllocator & _alloc, rosidl_runtime_cpp::MessageInitialization _init = rosidl_runtime_cpp::MessageInitialization::ALL)
  : goal_id(_alloc, _init),
    feedback(_alloc, _init)
  {
    (void)_init;
  }

  // field types and members
  using _goal_id_type =
    unique_identifier_msgs::msg::UUID_<ContainerAllocator>;
  _goal_id_type goal_id;
  using _feedback_type =
    whisper_idl::action::Inference_Feedback_<ContainerAllocator>;
  _feedback_type feedback;

  // setters for named parameter idiom
  Type & set__goal_id(
    const unique_identifier_msgs::msg::UUID_<ContainerAllocator> & _arg)
  {
    this->goal_id = _arg;
    return *this;
  }
  Type & set__feedback(
    const whisper_idl::action::Inference_Feedback_<ContainerAllocator> & _arg)
  {
    this->feedback = _arg;
    return *this;
  }

  // constant declarations

  // pointer types
  using RawPtr =
    whisper_idl::action::Inference_FeedbackMessage_<ContainerAllocator> *;
  using ConstRawPtr =
    const whisper_idl::action::Inference_FeedbackMessage_<ContainerAllocator> *;
  using SharedPtr =
    std::shared_ptr<whisper_idl::action::Inference_FeedbackMessage_<ContainerAllocator>>;
  using ConstSharedPtr =
    std::shared_ptr<whisper_idl::action::Inference_FeedbackMessage_<ContainerAllocator> const>;

  template<typename Deleter = std::default_delete<
      whisper_idl::action::Inference_FeedbackMessage_<ContainerAllocator>>>
  using UniquePtrWithDeleter =
    std::unique_ptr<whisper_idl::action::Inference_FeedbackMessage_<ContainerAllocator>, Deleter>;

  using UniquePtr = UniquePtrWithDeleter<>;

  template<typename Deleter = std::default_delete<
      whisper_idl::action::Inference_FeedbackMessage_<ContainerAllocator>>>
  using ConstUniquePtrWithDeleter =
    std::unique_ptr<whisper_idl::action::Inference_FeedbackMessage_<ContainerAllocator> const, Deleter>;
  using ConstUniquePtr = ConstUniquePtrWithDeleter<>;

  using WeakPtr =
    std::weak_ptr<whisper_idl::action::Inference_FeedbackMessage_<ContainerAllocator>>;
  using ConstWeakPtr =
    std::weak_ptr<whisper_idl::action::Inference_FeedbackMessage_<ContainerAllocator> const>;

  // pointer types similar to ROS 1, use SharedPtr / ConstSharedPtr instead
  // NOTE: Can't use 'using' here because GNU C++ can't parse attributes properly
  typedef DEPRECATED__whisper_idl__action__Inference_FeedbackMessage
    std::shared_ptr<whisper_idl::action::Inference_FeedbackMessage_<ContainerAllocator>>
    Ptr;
  typedef DEPRECATED__whisper_idl__action__Inference_FeedbackMessage
    std::shared_ptr<whisper_idl::action::Inference_FeedbackMessage_<ContainerAllocator> const>
    ConstPtr;

  // comparison operators
  bool operator==(const Inference_FeedbackMessage_ & other) const
  {
    if (this->goal_id != other.goal_id) {
      return false;
    }
    if (this->feedback != other.feedback) {
      return false;
    }
    return true;
  }
  bool operator!=(const Inference_FeedbackMessage_ & other) const
  {
    return !this->operator==(other);
  }
};  // struct Inference_FeedbackMessage_

// alias to use template instance with default allocator
using Inference_FeedbackMessage =
  whisper_idl::action::Inference_FeedbackMessage_<std::allocator<void>>;

// constant definitions

}  // namespace action

}  // namespace whisper_idl

#include "action_msgs/srv/cancel_goal.hpp"
#include "action_msgs/msg/goal_info.hpp"
#include "action_msgs/msg/goal_status_array.hpp"

namespace whisper_idl
{

namespace action
{

struct Inference
{
  /// The goal message defined in the action definition.
  using Goal = whisper_idl::action::Inference_Goal;
  /// The result message defined in the action definition.
  using Result = whisper_idl::action::Inference_Result;
  /// The feedback message defined in the action definition.
  using Feedback = whisper_idl::action::Inference_Feedback;

  struct Impl
  {
    /// The send_goal service using a wrapped version of the goal message as a request.
    using SendGoalService = whisper_idl::action::Inference_SendGoal;
    /// The get_result service using a wrapped version of the result message as a response.
    using GetResultService = whisper_idl::action::Inference_GetResult;
    /// The feedback message with generic fields which wraps the feedback message.
    using FeedbackMessage = whisper_idl::action::Inference_FeedbackMessage;

    /// The generic service to cancel a goal.
    using CancelGoalService = action_msgs::srv::CancelGoal;
    /// The generic message for the status of a goal.
    using GoalStatusMessage = action_msgs::msg::GoalStatusArray;
  };
};

typedef struct Inference Inference;

}  // namespace action

}  // namespace whisper_idl

#endif  // WHISPER_IDL__ACTION__DETAIL__INFERENCE__STRUCT_HPP_
