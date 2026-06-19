// generated from rosidl_typesupport_fastrtps_c/resource/idl__type_support_c.cpp.em
// with input from whisper_idl:msg/AudioTranscript.idl
// generated code does not contain a copyright notice
#include "whisper_idl/msg/detail/audio_transcript__rosidl_typesupport_fastrtps_c.h"


#include <cassert>
#include <limits>
#include <string>
#include "rosidl_typesupport_fastrtps_c/identifier.h"
#include "rosidl_typesupport_fastrtps_c/wstring_conversion.hpp"
#include "rosidl_typesupport_fastrtps_cpp/message_type_support.h"
#include "whisper_idl/msg/rosidl_typesupport_fastrtps_c__visibility_control.h"
#include "whisper_idl/msg/detail/audio_transcript__struct.h"
#include "whisper_idl/msg/detail/audio_transcript__functions.h"
#include "fastcdr/Cdr.h"

#ifndef _WIN32
# pragma GCC diagnostic push
# pragma GCC diagnostic ignored "-Wunused-parameter"
# ifdef __clang__
#  pragma clang diagnostic ignored "-Wdeprecated-register"
#  pragma clang diagnostic ignored "-Wreturn-type-c-linkage"
# endif
#endif
#ifndef _WIN32
# pragma GCC diagnostic pop
#endif

// includes and forward declarations of message dependencies and their conversion functions

#if defined(__cplusplus)
extern "C"
{
#endif

#include "builtin_interfaces/msg/detail/time__functions.h"  // seg_start_time
#include "rosidl_runtime_c/primitives_sequence.h"  // occ, probs, seg_duration_ms, seg_start_words_id
#include "rosidl_runtime_c/primitives_sequence_functions.h"  // occ, probs, seg_duration_ms, seg_start_words_id
#include "rosidl_runtime_c/string.h"  // words
#include "rosidl_runtime_c/string_functions.h"  // words

// forward declare type support functions
ROSIDL_TYPESUPPORT_FASTRTPS_C_IMPORT_whisper_idl
size_t get_serialized_size_builtin_interfaces__msg__Time(
  const void * untyped_ros_message,
  size_t current_alignment);

ROSIDL_TYPESUPPORT_FASTRTPS_C_IMPORT_whisper_idl
size_t max_serialized_size_builtin_interfaces__msg__Time(
  bool & full_bounded,
  bool & is_plain,
  size_t current_alignment);

ROSIDL_TYPESUPPORT_FASTRTPS_C_IMPORT_whisper_idl
const rosidl_message_type_support_t *
  ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_fastrtps_c, builtin_interfaces, msg, Time)();


using _AudioTranscript__ros_msg_type = whisper_idl__msg__AudioTranscript;

static bool _AudioTranscript__cdr_serialize(
  const void * untyped_ros_message,
  eprosima::fastcdr::Cdr & cdr)
{
  if (!untyped_ros_message) {
    fprintf(stderr, "ros message handle is null\n");
    return false;
  }
  const _AudioTranscript__ros_msg_type * ros_message = static_cast<const _AudioTranscript__ros_msg_type *>(untyped_ros_message);
  // Field name: words
  {
    size_t size = ros_message->words.size;
    auto array_ptr = ros_message->words.data;
    cdr << static_cast<uint32_t>(size);
    for (size_t i = 0; i < size; ++i) {
      const rosidl_runtime_c__String * str = &array_ptr[i];
      if (str->capacity == 0 || str->capacity <= str->size) {
        fprintf(stderr, "string capacity not greater than size\n");
        return false;
      }
      if (str->data[str->size] != '\0') {
        fprintf(stderr, "string not null-terminated\n");
        return false;
      }
      cdr << str->data;
    }
  }

  // Field name: probs
  {
    size_t size = ros_message->probs.size;
    auto array_ptr = ros_message->probs.data;
    cdr << static_cast<uint32_t>(size);
    cdr.serializeArray(array_ptr, size);
  }

  // Field name: occ
  {
    size_t size = ros_message->occ.size;
    auto array_ptr = ros_message->occ.data;
    cdr << static_cast<uint32_t>(size);
    cdr.serializeArray(array_ptr, size);
  }

  // Field name: seg_start_words_id
  {
    size_t size = ros_message->seg_start_words_id.size;
    auto array_ptr = ros_message->seg_start_words_id.data;
    cdr << static_cast<uint32_t>(size);
    cdr.serializeArray(array_ptr, size);
  }

  // Field name: seg_start_time
  {
    const message_type_support_callbacks_t * callbacks =
      static_cast<const message_type_support_callbacks_t *>(
      ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(
        rosidl_typesupport_fastrtps_c, builtin_interfaces, msg, Time
      )()->data);
    size_t size = ros_message->seg_start_time.size;
    auto array_ptr = ros_message->seg_start_time.data;
    cdr << static_cast<uint32_t>(size);
    for (size_t i = 0; i < size; ++i) {
      if (!callbacks->cdr_serialize(
          &array_ptr[i], cdr))
      {
        return false;
      }
    }
  }

  // Field name: seg_duration_ms
  {
    size_t size = ros_message->seg_duration_ms.size;
    auto array_ptr = ros_message->seg_duration_ms.data;
    cdr << static_cast<uint32_t>(size);
    cdr.serializeArray(array_ptr, size);
  }

  // Field name: active_index
  {
    cdr << ros_message->active_index;
  }

  return true;
}

static bool _AudioTranscript__cdr_deserialize(
  eprosima::fastcdr::Cdr & cdr,
  void * untyped_ros_message)
{
  if (!untyped_ros_message) {
    fprintf(stderr, "ros message handle is null\n");
    return false;
  }
  _AudioTranscript__ros_msg_type * ros_message = static_cast<_AudioTranscript__ros_msg_type *>(untyped_ros_message);
  // Field name: words
  {
    uint32_t cdrSize;
    cdr >> cdrSize;
    size_t size = static_cast<size_t>(cdrSize);

    // Check there are at least 'size' remaining bytes in the CDR stream before resizing
    auto old_state = cdr.getState();
    bool correct_size = cdr.jump(size);
    cdr.setState(old_state);
    if (!correct_size) {
      fprintf(stderr, "sequence size exceeds remaining buffer\n");
      return false;
    }

    if (ros_message->words.data) {
      rosidl_runtime_c__String__Sequence__fini(&ros_message->words);
    }
    if (!rosidl_runtime_c__String__Sequence__init(&ros_message->words, size)) {
      fprintf(stderr, "failed to create array for field 'words'");
      return false;
    }
    auto array_ptr = ros_message->words.data;
    for (size_t i = 0; i < size; ++i) {
      std::string tmp;
      cdr >> tmp;
      auto & ros_i = array_ptr[i];
      if (!ros_i.data) {
        rosidl_runtime_c__String__init(&ros_i);
      }
      bool succeeded = rosidl_runtime_c__String__assign(
        &ros_i,
        tmp.c_str());
      if (!succeeded) {
        fprintf(stderr, "failed to assign string into field 'words'\n");
        return false;
      }
    }
  }

  // Field name: probs
  {
    uint32_t cdrSize;
    cdr >> cdrSize;
    size_t size = static_cast<size_t>(cdrSize);

    // Check there are at least 'size' remaining bytes in the CDR stream before resizing
    auto old_state = cdr.getState();
    bool correct_size = cdr.jump(size);
    cdr.setState(old_state);
    if (!correct_size) {
      fprintf(stderr, "sequence size exceeds remaining buffer\n");
      return false;
    }

    if (ros_message->probs.data) {
      rosidl_runtime_c__float__Sequence__fini(&ros_message->probs);
    }
    if (!rosidl_runtime_c__float__Sequence__init(&ros_message->probs, size)) {
      fprintf(stderr, "failed to create array for field 'probs'");
      return false;
    }
    auto array_ptr = ros_message->probs.data;
    cdr.deserializeArray(array_ptr, size);
  }

  // Field name: occ
  {
    uint32_t cdrSize;
    cdr >> cdrSize;
    size_t size = static_cast<size_t>(cdrSize);

    // Check there are at least 'size' remaining bytes in the CDR stream before resizing
    auto old_state = cdr.getState();
    bool correct_size = cdr.jump(size);
    cdr.setState(old_state);
    if (!correct_size) {
      fprintf(stderr, "sequence size exceeds remaining buffer\n");
      return false;
    }

    if (ros_message->occ.data) {
      rosidl_runtime_c__int32__Sequence__fini(&ros_message->occ);
    }
    if (!rosidl_runtime_c__int32__Sequence__init(&ros_message->occ, size)) {
      fprintf(stderr, "failed to create array for field 'occ'");
      return false;
    }
    auto array_ptr = ros_message->occ.data;
    cdr.deserializeArray(array_ptr, size);
  }

  // Field name: seg_start_words_id
  {
    uint32_t cdrSize;
    cdr >> cdrSize;
    size_t size = static_cast<size_t>(cdrSize);

    // Check there are at least 'size' remaining bytes in the CDR stream before resizing
    auto old_state = cdr.getState();
    bool correct_size = cdr.jump(size);
    cdr.setState(old_state);
    if (!correct_size) {
      fprintf(stderr, "sequence size exceeds remaining buffer\n");
      return false;
    }

    if (ros_message->seg_start_words_id.data) {
      rosidl_runtime_c__int32__Sequence__fini(&ros_message->seg_start_words_id);
    }
    if (!rosidl_runtime_c__int32__Sequence__init(&ros_message->seg_start_words_id, size)) {
      fprintf(stderr, "failed to create array for field 'seg_start_words_id'");
      return false;
    }
    auto array_ptr = ros_message->seg_start_words_id.data;
    cdr.deserializeArray(array_ptr, size);
  }

  // Field name: seg_start_time
  {
    const message_type_support_callbacks_t * callbacks =
      static_cast<const message_type_support_callbacks_t *>(
      ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(
        rosidl_typesupport_fastrtps_c, builtin_interfaces, msg, Time
      )()->data);
    uint32_t cdrSize;
    cdr >> cdrSize;
    size_t size = static_cast<size_t>(cdrSize);

    // Check there are at least 'size' remaining bytes in the CDR stream before resizing
    auto old_state = cdr.getState();
    bool correct_size = cdr.jump(size);
    cdr.setState(old_state);
    if (!correct_size) {
      fprintf(stderr, "sequence size exceeds remaining buffer\n");
      return false;
    }

    if (ros_message->seg_start_time.data) {
      builtin_interfaces__msg__Time__Sequence__fini(&ros_message->seg_start_time);
    }
    if (!builtin_interfaces__msg__Time__Sequence__init(&ros_message->seg_start_time, size)) {
      fprintf(stderr, "failed to create array for field 'seg_start_time'");
      return false;
    }
    auto array_ptr = ros_message->seg_start_time.data;
    for (size_t i = 0; i < size; ++i) {
      if (!callbacks->cdr_deserialize(
          cdr, &array_ptr[i]))
      {
        return false;
      }
    }
  }

  // Field name: seg_duration_ms
  {
    uint32_t cdrSize;
    cdr >> cdrSize;
    size_t size = static_cast<size_t>(cdrSize);

    // Check there are at least 'size' remaining bytes in the CDR stream before resizing
    auto old_state = cdr.getState();
    bool correct_size = cdr.jump(size);
    cdr.setState(old_state);
    if (!correct_size) {
      fprintf(stderr, "sequence size exceeds remaining buffer\n");
      return false;
    }

    if (ros_message->seg_duration_ms.data) {
      rosidl_runtime_c__int32__Sequence__fini(&ros_message->seg_duration_ms);
    }
    if (!rosidl_runtime_c__int32__Sequence__init(&ros_message->seg_duration_ms, size)) {
      fprintf(stderr, "failed to create array for field 'seg_duration_ms'");
      return false;
    }
    auto array_ptr = ros_message->seg_duration_ms.data;
    cdr.deserializeArray(array_ptr, size);
  }

  // Field name: active_index
  {
    cdr >> ros_message->active_index;
  }

  return true;
}  // NOLINT(readability/fn_size)

ROSIDL_TYPESUPPORT_FASTRTPS_C_PUBLIC_whisper_idl
size_t get_serialized_size_whisper_idl__msg__AudioTranscript(
  const void * untyped_ros_message,
  size_t current_alignment)
{
  const _AudioTranscript__ros_msg_type * ros_message = static_cast<const _AudioTranscript__ros_msg_type *>(untyped_ros_message);
  (void)ros_message;
  size_t initial_alignment = current_alignment;

  const size_t padding = 4;
  const size_t wchar_size = 4;
  (void)padding;
  (void)wchar_size;

  // field.name words
  {
    size_t array_size = ros_message->words.size;
    auto array_ptr = ros_message->words.data;
    current_alignment += padding +
      eprosima::fastcdr::Cdr::alignment(current_alignment, padding);
    for (size_t index = 0; index < array_size; ++index) {
      current_alignment += padding +
        eprosima::fastcdr::Cdr::alignment(current_alignment, padding) +
        (array_ptr[index].size + 1);
    }
  }
  // field.name probs
  {
    size_t array_size = ros_message->probs.size;
    auto array_ptr = ros_message->probs.data;
    current_alignment += padding +
      eprosima::fastcdr::Cdr::alignment(current_alignment, padding);
    (void)array_ptr;
    size_t item_size = sizeof(array_ptr[0]);
    current_alignment += array_size * item_size +
      eprosima::fastcdr::Cdr::alignment(current_alignment, item_size);
  }
  // field.name occ
  {
    size_t array_size = ros_message->occ.size;
    auto array_ptr = ros_message->occ.data;
    current_alignment += padding +
      eprosima::fastcdr::Cdr::alignment(current_alignment, padding);
    (void)array_ptr;
    size_t item_size = sizeof(array_ptr[0]);
    current_alignment += array_size * item_size +
      eprosima::fastcdr::Cdr::alignment(current_alignment, item_size);
  }
  // field.name seg_start_words_id
  {
    size_t array_size = ros_message->seg_start_words_id.size;
    auto array_ptr = ros_message->seg_start_words_id.data;
    current_alignment += padding +
      eprosima::fastcdr::Cdr::alignment(current_alignment, padding);
    (void)array_ptr;
    size_t item_size = sizeof(array_ptr[0]);
    current_alignment += array_size * item_size +
      eprosima::fastcdr::Cdr::alignment(current_alignment, item_size);
  }
  // field.name seg_start_time
  {
    size_t array_size = ros_message->seg_start_time.size;
    auto array_ptr = ros_message->seg_start_time.data;
    current_alignment += padding +
      eprosima::fastcdr::Cdr::alignment(current_alignment, padding);

    for (size_t index = 0; index < array_size; ++index) {
      current_alignment += get_serialized_size_builtin_interfaces__msg__Time(
        &array_ptr[index], current_alignment);
    }
  }
  // field.name seg_duration_ms
  {
    size_t array_size = ros_message->seg_duration_ms.size;
    auto array_ptr = ros_message->seg_duration_ms.data;
    current_alignment += padding +
      eprosima::fastcdr::Cdr::alignment(current_alignment, padding);
    (void)array_ptr;
    size_t item_size = sizeof(array_ptr[0]);
    current_alignment += array_size * item_size +
      eprosima::fastcdr::Cdr::alignment(current_alignment, item_size);
  }
  // field.name active_index
  {
    size_t item_size = sizeof(ros_message->active_index);
    current_alignment += item_size +
      eprosima::fastcdr::Cdr::alignment(current_alignment, item_size);
  }

  return current_alignment - initial_alignment;
}

static uint32_t _AudioTranscript__get_serialized_size(const void * untyped_ros_message)
{
  return static_cast<uint32_t>(
    get_serialized_size_whisper_idl__msg__AudioTranscript(
      untyped_ros_message, 0));
}

ROSIDL_TYPESUPPORT_FASTRTPS_C_PUBLIC_whisper_idl
size_t max_serialized_size_whisper_idl__msg__AudioTranscript(
  bool & full_bounded,
  bool & is_plain,
  size_t current_alignment)
{
  size_t initial_alignment = current_alignment;

  const size_t padding = 4;
  const size_t wchar_size = 4;
  size_t last_member_size = 0;
  (void)last_member_size;
  (void)padding;
  (void)wchar_size;

  full_bounded = true;
  is_plain = true;

  // member: words
  {
    size_t array_size = 0;
    full_bounded = false;
    is_plain = false;
    current_alignment += padding +
      eprosima::fastcdr::Cdr::alignment(current_alignment, padding);

    full_bounded = false;
    is_plain = false;
    for (size_t index = 0; index < array_size; ++index) {
      current_alignment += padding +
        eprosima::fastcdr::Cdr::alignment(current_alignment, padding) +
        1;
    }
  }
  // member: probs
  {
    size_t array_size = 0;
    full_bounded = false;
    is_plain = false;
    current_alignment += padding +
      eprosima::fastcdr::Cdr::alignment(current_alignment, padding);

    last_member_size = array_size * sizeof(uint32_t);
    current_alignment += array_size * sizeof(uint32_t) +
      eprosima::fastcdr::Cdr::alignment(current_alignment, sizeof(uint32_t));
  }
  // member: occ
  {
    size_t array_size = 0;
    full_bounded = false;
    is_plain = false;
    current_alignment += padding +
      eprosima::fastcdr::Cdr::alignment(current_alignment, padding);

    last_member_size = array_size * sizeof(uint32_t);
    current_alignment += array_size * sizeof(uint32_t) +
      eprosima::fastcdr::Cdr::alignment(current_alignment, sizeof(uint32_t));
  }
  // member: seg_start_words_id
  {
    size_t array_size = 0;
    full_bounded = false;
    is_plain = false;
    current_alignment += padding +
      eprosima::fastcdr::Cdr::alignment(current_alignment, padding);

    last_member_size = array_size * sizeof(uint32_t);
    current_alignment += array_size * sizeof(uint32_t) +
      eprosima::fastcdr::Cdr::alignment(current_alignment, sizeof(uint32_t));
  }
  // member: seg_start_time
  {
    size_t array_size = 0;
    full_bounded = false;
    is_plain = false;
    current_alignment += padding +
      eprosima::fastcdr::Cdr::alignment(current_alignment, padding);


    last_member_size = 0;
    for (size_t index = 0; index < array_size; ++index) {
      bool inner_full_bounded;
      bool inner_is_plain;
      size_t inner_size;
      inner_size =
        max_serialized_size_builtin_interfaces__msg__Time(
        inner_full_bounded, inner_is_plain, current_alignment);
      last_member_size += inner_size;
      current_alignment += inner_size;
      full_bounded &= inner_full_bounded;
      is_plain &= inner_is_plain;
    }
  }
  // member: seg_duration_ms
  {
    size_t array_size = 0;
    full_bounded = false;
    is_plain = false;
    current_alignment += padding +
      eprosima::fastcdr::Cdr::alignment(current_alignment, padding);

    last_member_size = array_size * sizeof(uint32_t);
    current_alignment += array_size * sizeof(uint32_t) +
      eprosima::fastcdr::Cdr::alignment(current_alignment, sizeof(uint32_t));
  }
  // member: active_index
  {
    size_t array_size = 1;

    last_member_size = array_size * sizeof(uint32_t);
    current_alignment += array_size * sizeof(uint32_t) +
      eprosima::fastcdr::Cdr::alignment(current_alignment, sizeof(uint32_t));
  }

  size_t ret_val = current_alignment - initial_alignment;
  if (is_plain) {
    // All members are plain, and type is not empty.
    // We still need to check that the in-memory alignment
    // is the same as the CDR mandated alignment.
    using DataType = whisper_idl__msg__AudioTranscript;
    is_plain =
      (
      offsetof(DataType, active_index) +
      last_member_size
      ) == ret_val;
  }

  return ret_val;
}

static size_t _AudioTranscript__max_serialized_size(char & bounds_info)
{
  bool full_bounded;
  bool is_plain;
  size_t ret_val;

  ret_val = max_serialized_size_whisper_idl__msg__AudioTranscript(
    full_bounded, is_plain, 0);

  bounds_info =
    is_plain ? ROSIDL_TYPESUPPORT_FASTRTPS_PLAIN_TYPE :
    full_bounded ? ROSIDL_TYPESUPPORT_FASTRTPS_BOUNDED_TYPE : ROSIDL_TYPESUPPORT_FASTRTPS_UNBOUNDED_TYPE;
  return ret_val;
}


static message_type_support_callbacks_t __callbacks_AudioTranscript = {
  "whisper_idl::msg",
  "AudioTranscript",
  _AudioTranscript__cdr_serialize,
  _AudioTranscript__cdr_deserialize,
  _AudioTranscript__get_serialized_size,
  _AudioTranscript__max_serialized_size
};

static rosidl_message_type_support_t _AudioTranscript__type_support = {
  rosidl_typesupport_fastrtps_c__identifier,
  &__callbacks_AudioTranscript,
  get_message_typesupport_handle_function,
};

const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_fastrtps_c, whisper_idl, msg, AudioTranscript)() {
  return &_AudioTranscript__type_support;
}

#if defined(__cplusplus)
}
#endif
