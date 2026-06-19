// generated from rosidl_generator_c/resource/idl__functions.c.em
// with input from whisper_idl:msg/AudioTranscript.idl
// generated code does not contain a copyright notice
#include "whisper_idl/msg/detail/audio_transcript__functions.h"

#include <assert.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>

#include "rcutils/allocator.h"


// Include directives for member types
// Member `words`
#include "rosidl_runtime_c/string_functions.h"
// Member `probs`
// Member `occ`
// Member `seg_start_words_id`
// Member `seg_duration_ms`
#include "rosidl_runtime_c/primitives_sequence_functions.h"
// Member `seg_start_time`
#include "builtin_interfaces/msg/detail/time__functions.h"

bool
whisper_idl__msg__AudioTranscript__init(whisper_idl__msg__AudioTranscript * msg)
{
  if (!msg) {
    return false;
  }
  // words
  if (!rosidl_runtime_c__String__Sequence__init(&msg->words, 0)) {
    whisper_idl__msg__AudioTranscript__fini(msg);
    return false;
  }
  // probs
  if (!rosidl_runtime_c__float__Sequence__init(&msg->probs, 0)) {
    whisper_idl__msg__AudioTranscript__fini(msg);
    return false;
  }
  // occ
  if (!rosidl_runtime_c__int32__Sequence__init(&msg->occ, 0)) {
    whisper_idl__msg__AudioTranscript__fini(msg);
    return false;
  }
  // seg_start_words_id
  if (!rosidl_runtime_c__int32__Sequence__init(&msg->seg_start_words_id, 0)) {
    whisper_idl__msg__AudioTranscript__fini(msg);
    return false;
  }
  // seg_start_time
  if (!builtin_interfaces__msg__Time__Sequence__init(&msg->seg_start_time, 0)) {
    whisper_idl__msg__AudioTranscript__fini(msg);
    return false;
  }
  // seg_duration_ms
  if (!rosidl_runtime_c__int32__Sequence__init(&msg->seg_duration_ms, 0)) {
    whisper_idl__msg__AudioTranscript__fini(msg);
    return false;
  }
  // active_index
  return true;
}

void
whisper_idl__msg__AudioTranscript__fini(whisper_idl__msg__AudioTranscript * msg)
{
  if (!msg) {
    return;
  }
  // words
  rosidl_runtime_c__String__Sequence__fini(&msg->words);
  // probs
  rosidl_runtime_c__float__Sequence__fini(&msg->probs);
  // occ
  rosidl_runtime_c__int32__Sequence__fini(&msg->occ);
  // seg_start_words_id
  rosidl_runtime_c__int32__Sequence__fini(&msg->seg_start_words_id);
  // seg_start_time
  builtin_interfaces__msg__Time__Sequence__fini(&msg->seg_start_time);
  // seg_duration_ms
  rosidl_runtime_c__int32__Sequence__fini(&msg->seg_duration_ms);
  // active_index
}

bool
whisper_idl__msg__AudioTranscript__are_equal(const whisper_idl__msg__AudioTranscript * lhs, const whisper_idl__msg__AudioTranscript * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  // words
  if (!rosidl_runtime_c__String__Sequence__are_equal(
      &(lhs->words), &(rhs->words)))
  {
    return false;
  }
  // probs
  if (!rosidl_runtime_c__float__Sequence__are_equal(
      &(lhs->probs), &(rhs->probs)))
  {
    return false;
  }
  // occ
  if (!rosidl_runtime_c__int32__Sequence__are_equal(
      &(lhs->occ), &(rhs->occ)))
  {
    return false;
  }
  // seg_start_words_id
  if (!rosidl_runtime_c__int32__Sequence__are_equal(
      &(lhs->seg_start_words_id), &(rhs->seg_start_words_id)))
  {
    return false;
  }
  // seg_start_time
  if (!builtin_interfaces__msg__Time__Sequence__are_equal(
      &(lhs->seg_start_time), &(rhs->seg_start_time)))
  {
    return false;
  }
  // seg_duration_ms
  if (!rosidl_runtime_c__int32__Sequence__are_equal(
      &(lhs->seg_duration_ms), &(rhs->seg_duration_ms)))
  {
    return false;
  }
  // active_index
  if (lhs->active_index != rhs->active_index) {
    return false;
  }
  return true;
}

bool
whisper_idl__msg__AudioTranscript__copy(
  const whisper_idl__msg__AudioTranscript * input,
  whisper_idl__msg__AudioTranscript * output)
{
  if (!input || !output) {
    return false;
  }
  // words
  if (!rosidl_runtime_c__String__Sequence__copy(
      &(input->words), &(output->words)))
  {
    return false;
  }
  // probs
  if (!rosidl_runtime_c__float__Sequence__copy(
      &(input->probs), &(output->probs)))
  {
    return false;
  }
  // occ
  if (!rosidl_runtime_c__int32__Sequence__copy(
      &(input->occ), &(output->occ)))
  {
    return false;
  }
  // seg_start_words_id
  if (!rosidl_runtime_c__int32__Sequence__copy(
      &(input->seg_start_words_id), &(output->seg_start_words_id)))
  {
    return false;
  }
  // seg_start_time
  if (!builtin_interfaces__msg__Time__Sequence__copy(
      &(input->seg_start_time), &(output->seg_start_time)))
  {
    return false;
  }
  // seg_duration_ms
  if (!rosidl_runtime_c__int32__Sequence__copy(
      &(input->seg_duration_ms), &(output->seg_duration_ms)))
  {
    return false;
  }
  // active_index
  output->active_index = input->active_index;
  return true;
}

whisper_idl__msg__AudioTranscript *
whisper_idl__msg__AudioTranscript__create()
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__msg__AudioTranscript * msg = (whisper_idl__msg__AudioTranscript *)allocator.allocate(sizeof(whisper_idl__msg__AudioTranscript), allocator.state);
  if (!msg) {
    return NULL;
  }
  memset(msg, 0, sizeof(whisper_idl__msg__AudioTranscript));
  bool success = whisper_idl__msg__AudioTranscript__init(msg);
  if (!success) {
    allocator.deallocate(msg, allocator.state);
    return NULL;
  }
  return msg;
}

void
whisper_idl__msg__AudioTranscript__destroy(whisper_idl__msg__AudioTranscript * msg)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (msg) {
    whisper_idl__msg__AudioTranscript__fini(msg);
  }
  allocator.deallocate(msg, allocator.state);
}


bool
whisper_idl__msg__AudioTranscript__Sequence__init(whisper_idl__msg__AudioTranscript__Sequence * array, size_t size)
{
  if (!array) {
    return false;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__msg__AudioTranscript * data = NULL;

  if (size) {
    data = (whisper_idl__msg__AudioTranscript *)allocator.zero_allocate(size, sizeof(whisper_idl__msg__AudioTranscript), allocator.state);
    if (!data) {
      return false;
    }
    // initialize all array elements
    size_t i;
    for (i = 0; i < size; ++i) {
      bool success = whisper_idl__msg__AudioTranscript__init(&data[i]);
      if (!success) {
        break;
      }
    }
    if (i < size) {
      // if initialization failed finalize the already initialized array elements
      for (; i > 0; --i) {
        whisper_idl__msg__AudioTranscript__fini(&data[i - 1]);
      }
      allocator.deallocate(data, allocator.state);
      return false;
    }
  }
  array->data = data;
  array->size = size;
  array->capacity = size;
  return true;
}

void
whisper_idl__msg__AudioTranscript__Sequence__fini(whisper_idl__msg__AudioTranscript__Sequence * array)
{
  if (!array) {
    return;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();

  if (array->data) {
    // ensure that data and capacity values are consistent
    assert(array->capacity > 0);
    // finalize all array elements
    for (size_t i = 0; i < array->capacity; ++i) {
      whisper_idl__msg__AudioTranscript__fini(&array->data[i]);
    }
    allocator.deallocate(array->data, allocator.state);
    array->data = NULL;
    array->size = 0;
    array->capacity = 0;
  } else {
    // ensure that data, size, and capacity values are consistent
    assert(0 == array->size);
    assert(0 == array->capacity);
  }
}

whisper_idl__msg__AudioTranscript__Sequence *
whisper_idl__msg__AudioTranscript__Sequence__create(size_t size)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__msg__AudioTranscript__Sequence * array = (whisper_idl__msg__AudioTranscript__Sequence *)allocator.allocate(sizeof(whisper_idl__msg__AudioTranscript__Sequence), allocator.state);
  if (!array) {
    return NULL;
  }
  bool success = whisper_idl__msg__AudioTranscript__Sequence__init(array, size);
  if (!success) {
    allocator.deallocate(array, allocator.state);
    return NULL;
  }
  return array;
}

void
whisper_idl__msg__AudioTranscript__Sequence__destroy(whisper_idl__msg__AudioTranscript__Sequence * array)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (array) {
    whisper_idl__msg__AudioTranscript__Sequence__fini(array);
  }
  allocator.deallocate(array, allocator.state);
}

bool
whisper_idl__msg__AudioTranscript__Sequence__are_equal(const whisper_idl__msg__AudioTranscript__Sequence * lhs, const whisper_idl__msg__AudioTranscript__Sequence * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  if (lhs->size != rhs->size) {
    return false;
  }
  for (size_t i = 0; i < lhs->size; ++i) {
    if (!whisper_idl__msg__AudioTranscript__are_equal(&(lhs->data[i]), &(rhs->data[i]))) {
      return false;
    }
  }
  return true;
}

bool
whisper_idl__msg__AudioTranscript__Sequence__copy(
  const whisper_idl__msg__AudioTranscript__Sequence * input,
  whisper_idl__msg__AudioTranscript__Sequence * output)
{
  if (!input || !output) {
    return false;
  }
  if (output->capacity < input->size) {
    const size_t allocation_size =
      input->size * sizeof(whisper_idl__msg__AudioTranscript);
    rcutils_allocator_t allocator = rcutils_get_default_allocator();
    whisper_idl__msg__AudioTranscript * data =
      (whisper_idl__msg__AudioTranscript *)allocator.reallocate(
      output->data, allocation_size, allocator.state);
    if (!data) {
      return false;
    }
    // If reallocation succeeded, memory may or may not have been moved
    // to fulfill the allocation request, invalidating output->data.
    output->data = data;
    for (size_t i = output->capacity; i < input->size; ++i) {
      if (!whisper_idl__msg__AudioTranscript__init(&output->data[i])) {
        // If initialization of any new item fails, roll back
        // all previously initialized items. Existing items
        // in output are to be left unmodified.
        for (; i-- > output->capacity; ) {
          whisper_idl__msg__AudioTranscript__fini(&output->data[i]);
        }
        return false;
      }
    }
    output->capacity = input->size;
  }
  output->size = input->size;
  for (size_t i = 0; i < input->size; ++i) {
    if (!whisper_idl__msg__AudioTranscript__copy(
        &(input->data[i]), &(output->data[i])))
    {
      return false;
    }
  }
  return true;
}
