// generated from rosidl_generator_c/resource/idl__functions.c.em
// with input from whisper_idl:action/Inference.idl
// generated code does not contain a copyright notice
#include "whisper_idl/action/detail/inference__functions.h"

#include <assert.h>
#include <stdbool.h>
#include <stdlib.h>
#include <string.h>

#include "rcutils/allocator.h"


// Include directives for member types
// Member `max_duration`
#include "builtin_interfaces/msg/detail/duration__functions.h"

bool
whisper_idl__action__Inference_Goal__init(whisper_idl__action__Inference_Goal * msg)
{
  if (!msg) {
    return false;
  }
  // max_duration
  if (!builtin_interfaces__msg__Duration__init(&msg->max_duration)) {
    whisper_idl__action__Inference_Goal__fini(msg);
    return false;
  }
  return true;
}

void
whisper_idl__action__Inference_Goal__fini(whisper_idl__action__Inference_Goal * msg)
{
  if (!msg) {
    return;
  }
  // max_duration
  builtin_interfaces__msg__Duration__fini(&msg->max_duration);
}

bool
whisper_idl__action__Inference_Goal__are_equal(const whisper_idl__action__Inference_Goal * lhs, const whisper_idl__action__Inference_Goal * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  // max_duration
  if (!builtin_interfaces__msg__Duration__are_equal(
      &(lhs->max_duration), &(rhs->max_duration)))
  {
    return false;
  }
  return true;
}

bool
whisper_idl__action__Inference_Goal__copy(
  const whisper_idl__action__Inference_Goal * input,
  whisper_idl__action__Inference_Goal * output)
{
  if (!input || !output) {
    return false;
  }
  // max_duration
  if (!builtin_interfaces__msg__Duration__copy(
      &(input->max_duration), &(output->max_duration)))
  {
    return false;
  }
  return true;
}

whisper_idl__action__Inference_Goal *
whisper_idl__action__Inference_Goal__create()
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_Goal * msg = (whisper_idl__action__Inference_Goal *)allocator.allocate(sizeof(whisper_idl__action__Inference_Goal), allocator.state);
  if (!msg) {
    return NULL;
  }
  memset(msg, 0, sizeof(whisper_idl__action__Inference_Goal));
  bool success = whisper_idl__action__Inference_Goal__init(msg);
  if (!success) {
    allocator.deallocate(msg, allocator.state);
    return NULL;
  }
  return msg;
}

void
whisper_idl__action__Inference_Goal__destroy(whisper_idl__action__Inference_Goal * msg)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (msg) {
    whisper_idl__action__Inference_Goal__fini(msg);
  }
  allocator.deallocate(msg, allocator.state);
}


bool
whisper_idl__action__Inference_Goal__Sequence__init(whisper_idl__action__Inference_Goal__Sequence * array, size_t size)
{
  if (!array) {
    return false;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_Goal * data = NULL;

  if (size) {
    data = (whisper_idl__action__Inference_Goal *)allocator.zero_allocate(size, sizeof(whisper_idl__action__Inference_Goal), allocator.state);
    if (!data) {
      return false;
    }
    // initialize all array elements
    size_t i;
    for (i = 0; i < size; ++i) {
      bool success = whisper_idl__action__Inference_Goal__init(&data[i]);
      if (!success) {
        break;
      }
    }
    if (i < size) {
      // if initialization failed finalize the already initialized array elements
      for (; i > 0; --i) {
        whisper_idl__action__Inference_Goal__fini(&data[i - 1]);
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
whisper_idl__action__Inference_Goal__Sequence__fini(whisper_idl__action__Inference_Goal__Sequence * array)
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
      whisper_idl__action__Inference_Goal__fini(&array->data[i]);
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

whisper_idl__action__Inference_Goal__Sequence *
whisper_idl__action__Inference_Goal__Sequence__create(size_t size)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_Goal__Sequence * array = (whisper_idl__action__Inference_Goal__Sequence *)allocator.allocate(sizeof(whisper_idl__action__Inference_Goal__Sequence), allocator.state);
  if (!array) {
    return NULL;
  }
  bool success = whisper_idl__action__Inference_Goal__Sequence__init(array, size);
  if (!success) {
    allocator.deallocate(array, allocator.state);
    return NULL;
  }
  return array;
}

void
whisper_idl__action__Inference_Goal__Sequence__destroy(whisper_idl__action__Inference_Goal__Sequence * array)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (array) {
    whisper_idl__action__Inference_Goal__Sequence__fini(array);
  }
  allocator.deallocate(array, allocator.state);
}

bool
whisper_idl__action__Inference_Goal__Sequence__are_equal(const whisper_idl__action__Inference_Goal__Sequence * lhs, const whisper_idl__action__Inference_Goal__Sequence * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  if (lhs->size != rhs->size) {
    return false;
  }
  for (size_t i = 0; i < lhs->size; ++i) {
    if (!whisper_idl__action__Inference_Goal__are_equal(&(lhs->data[i]), &(rhs->data[i]))) {
      return false;
    }
  }
  return true;
}

bool
whisper_idl__action__Inference_Goal__Sequence__copy(
  const whisper_idl__action__Inference_Goal__Sequence * input,
  whisper_idl__action__Inference_Goal__Sequence * output)
{
  if (!input || !output) {
    return false;
  }
  if (output->capacity < input->size) {
    const size_t allocation_size =
      input->size * sizeof(whisper_idl__action__Inference_Goal);
    rcutils_allocator_t allocator = rcutils_get_default_allocator();
    whisper_idl__action__Inference_Goal * data =
      (whisper_idl__action__Inference_Goal *)allocator.reallocate(
      output->data, allocation_size, allocator.state);
    if (!data) {
      return false;
    }
    // If reallocation succeeded, memory may or may not have been moved
    // to fulfill the allocation request, invalidating output->data.
    output->data = data;
    for (size_t i = output->capacity; i < input->size; ++i) {
      if (!whisper_idl__action__Inference_Goal__init(&output->data[i])) {
        // If initialization of any new item fails, roll back
        // all previously initialized items. Existing items
        // in output are to be left unmodified.
        for (; i-- > output->capacity; ) {
          whisper_idl__action__Inference_Goal__fini(&output->data[i]);
        }
        return false;
      }
    }
    output->capacity = input->size;
  }
  output->size = input->size;
  for (size_t i = 0; i < input->size; ++i) {
    if (!whisper_idl__action__Inference_Goal__copy(
        &(input->data[i]), &(output->data[i])))
    {
      return false;
    }
  }
  return true;
}


// Include directives for member types
// Member `info`
// Member `transcriptions`
#include "rosidl_runtime_c/string_functions.h"

bool
whisper_idl__action__Inference_Result__init(whisper_idl__action__Inference_Result * msg)
{
  if (!msg) {
    return false;
  }
  // info
  if (!rosidl_runtime_c__String__init(&msg->info)) {
    whisper_idl__action__Inference_Result__fini(msg);
    return false;
  }
  // transcriptions
  if (!rosidl_runtime_c__String__Sequence__init(&msg->transcriptions, 0)) {
    whisper_idl__action__Inference_Result__fini(msg);
    return false;
  }
  return true;
}

void
whisper_idl__action__Inference_Result__fini(whisper_idl__action__Inference_Result * msg)
{
  if (!msg) {
    return;
  }
  // info
  rosidl_runtime_c__String__fini(&msg->info);
  // transcriptions
  rosidl_runtime_c__String__Sequence__fini(&msg->transcriptions);
}

bool
whisper_idl__action__Inference_Result__are_equal(const whisper_idl__action__Inference_Result * lhs, const whisper_idl__action__Inference_Result * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  // info
  if (!rosidl_runtime_c__String__are_equal(
      &(lhs->info), &(rhs->info)))
  {
    return false;
  }
  // transcriptions
  if (!rosidl_runtime_c__String__Sequence__are_equal(
      &(lhs->transcriptions), &(rhs->transcriptions)))
  {
    return false;
  }
  return true;
}

bool
whisper_idl__action__Inference_Result__copy(
  const whisper_idl__action__Inference_Result * input,
  whisper_idl__action__Inference_Result * output)
{
  if (!input || !output) {
    return false;
  }
  // info
  if (!rosidl_runtime_c__String__copy(
      &(input->info), &(output->info)))
  {
    return false;
  }
  // transcriptions
  if (!rosidl_runtime_c__String__Sequence__copy(
      &(input->transcriptions), &(output->transcriptions)))
  {
    return false;
  }
  return true;
}

whisper_idl__action__Inference_Result *
whisper_idl__action__Inference_Result__create()
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_Result * msg = (whisper_idl__action__Inference_Result *)allocator.allocate(sizeof(whisper_idl__action__Inference_Result), allocator.state);
  if (!msg) {
    return NULL;
  }
  memset(msg, 0, sizeof(whisper_idl__action__Inference_Result));
  bool success = whisper_idl__action__Inference_Result__init(msg);
  if (!success) {
    allocator.deallocate(msg, allocator.state);
    return NULL;
  }
  return msg;
}

void
whisper_idl__action__Inference_Result__destroy(whisper_idl__action__Inference_Result * msg)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (msg) {
    whisper_idl__action__Inference_Result__fini(msg);
  }
  allocator.deallocate(msg, allocator.state);
}


bool
whisper_idl__action__Inference_Result__Sequence__init(whisper_idl__action__Inference_Result__Sequence * array, size_t size)
{
  if (!array) {
    return false;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_Result * data = NULL;

  if (size) {
    data = (whisper_idl__action__Inference_Result *)allocator.zero_allocate(size, sizeof(whisper_idl__action__Inference_Result), allocator.state);
    if (!data) {
      return false;
    }
    // initialize all array elements
    size_t i;
    for (i = 0; i < size; ++i) {
      bool success = whisper_idl__action__Inference_Result__init(&data[i]);
      if (!success) {
        break;
      }
    }
    if (i < size) {
      // if initialization failed finalize the already initialized array elements
      for (; i > 0; --i) {
        whisper_idl__action__Inference_Result__fini(&data[i - 1]);
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
whisper_idl__action__Inference_Result__Sequence__fini(whisper_idl__action__Inference_Result__Sequence * array)
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
      whisper_idl__action__Inference_Result__fini(&array->data[i]);
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

whisper_idl__action__Inference_Result__Sequence *
whisper_idl__action__Inference_Result__Sequence__create(size_t size)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_Result__Sequence * array = (whisper_idl__action__Inference_Result__Sequence *)allocator.allocate(sizeof(whisper_idl__action__Inference_Result__Sequence), allocator.state);
  if (!array) {
    return NULL;
  }
  bool success = whisper_idl__action__Inference_Result__Sequence__init(array, size);
  if (!success) {
    allocator.deallocate(array, allocator.state);
    return NULL;
  }
  return array;
}

void
whisper_idl__action__Inference_Result__Sequence__destroy(whisper_idl__action__Inference_Result__Sequence * array)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (array) {
    whisper_idl__action__Inference_Result__Sequence__fini(array);
  }
  allocator.deallocate(array, allocator.state);
}

bool
whisper_idl__action__Inference_Result__Sequence__are_equal(const whisper_idl__action__Inference_Result__Sequence * lhs, const whisper_idl__action__Inference_Result__Sequence * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  if (lhs->size != rhs->size) {
    return false;
  }
  for (size_t i = 0; i < lhs->size; ++i) {
    if (!whisper_idl__action__Inference_Result__are_equal(&(lhs->data[i]), &(rhs->data[i]))) {
      return false;
    }
  }
  return true;
}

bool
whisper_idl__action__Inference_Result__Sequence__copy(
  const whisper_idl__action__Inference_Result__Sequence * input,
  whisper_idl__action__Inference_Result__Sequence * output)
{
  if (!input || !output) {
    return false;
  }
  if (output->capacity < input->size) {
    const size_t allocation_size =
      input->size * sizeof(whisper_idl__action__Inference_Result);
    rcutils_allocator_t allocator = rcutils_get_default_allocator();
    whisper_idl__action__Inference_Result * data =
      (whisper_idl__action__Inference_Result *)allocator.reallocate(
      output->data, allocation_size, allocator.state);
    if (!data) {
      return false;
    }
    // If reallocation succeeded, memory may or may not have been moved
    // to fulfill the allocation request, invalidating output->data.
    output->data = data;
    for (size_t i = output->capacity; i < input->size; ++i) {
      if (!whisper_idl__action__Inference_Result__init(&output->data[i])) {
        // If initialization of any new item fails, roll back
        // all previously initialized items. Existing items
        // in output are to be left unmodified.
        for (; i-- > output->capacity; ) {
          whisper_idl__action__Inference_Result__fini(&output->data[i]);
        }
        return false;
      }
    }
    output->capacity = input->size;
  }
  output->size = input->size;
  for (size_t i = 0; i < input->size; ++i) {
    if (!whisper_idl__action__Inference_Result__copy(
        &(input->data[i]), &(output->data[i])))
    {
      return false;
    }
  }
  return true;
}


// Include directives for member types
// Member `transcription`
// already included above
// #include "rosidl_runtime_c/string_functions.h"

bool
whisper_idl__action__Inference_Feedback__init(whisper_idl__action__Inference_Feedback * msg)
{
  if (!msg) {
    return false;
  }
  // batch_idx
  // transcription
  if (!rosidl_runtime_c__String__init(&msg->transcription)) {
    whisper_idl__action__Inference_Feedback__fini(msg);
    return false;
  }
  return true;
}

void
whisper_idl__action__Inference_Feedback__fini(whisper_idl__action__Inference_Feedback * msg)
{
  if (!msg) {
    return;
  }
  // batch_idx
  // transcription
  rosidl_runtime_c__String__fini(&msg->transcription);
}

bool
whisper_idl__action__Inference_Feedback__are_equal(const whisper_idl__action__Inference_Feedback * lhs, const whisper_idl__action__Inference_Feedback * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  // batch_idx
  if (lhs->batch_idx != rhs->batch_idx) {
    return false;
  }
  // transcription
  if (!rosidl_runtime_c__String__are_equal(
      &(lhs->transcription), &(rhs->transcription)))
  {
    return false;
  }
  return true;
}

bool
whisper_idl__action__Inference_Feedback__copy(
  const whisper_idl__action__Inference_Feedback * input,
  whisper_idl__action__Inference_Feedback * output)
{
  if (!input || !output) {
    return false;
  }
  // batch_idx
  output->batch_idx = input->batch_idx;
  // transcription
  if (!rosidl_runtime_c__String__copy(
      &(input->transcription), &(output->transcription)))
  {
    return false;
  }
  return true;
}

whisper_idl__action__Inference_Feedback *
whisper_idl__action__Inference_Feedback__create()
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_Feedback * msg = (whisper_idl__action__Inference_Feedback *)allocator.allocate(sizeof(whisper_idl__action__Inference_Feedback), allocator.state);
  if (!msg) {
    return NULL;
  }
  memset(msg, 0, sizeof(whisper_idl__action__Inference_Feedback));
  bool success = whisper_idl__action__Inference_Feedback__init(msg);
  if (!success) {
    allocator.deallocate(msg, allocator.state);
    return NULL;
  }
  return msg;
}

void
whisper_idl__action__Inference_Feedback__destroy(whisper_idl__action__Inference_Feedback * msg)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (msg) {
    whisper_idl__action__Inference_Feedback__fini(msg);
  }
  allocator.deallocate(msg, allocator.state);
}


bool
whisper_idl__action__Inference_Feedback__Sequence__init(whisper_idl__action__Inference_Feedback__Sequence * array, size_t size)
{
  if (!array) {
    return false;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_Feedback * data = NULL;

  if (size) {
    data = (whisper_idl__action__Inference_Feedback *)allocator.zero_allocate(size, sizeof(whisper_idl__action__Inference_Feedback), allocator.state);
    if (!data) {
      return false;
    }
    // initialize all array elements
    size_t i;
    for (i = 0; i < size; ++i) {
      bool success = whisper_idl__action__Inference_Feedback__init(&data[i]);
      if (!success) {
        break;
      }
    }
    if (i < size) {
      // if initialization failed finalize the already initialized array elements
      for (; i > 0; --i) {
        whisper_idl__action__Inference_Feedback__fini(&data[i - 1]);
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
whisper_idl__action__Inference_Feedback__Sequence__fini(whisper_idl__action__Inference_Feedback__Sequence * array)
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
      whisper_idl__action__Inference_Feedback__fini(&array->data[i]);
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

whisper_idl__action__Inference_Feedback__Sequence *
whisper_idl__action__Inference_Feedback__Sequence__create(size_t size)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_Feedback__Sequence * array = (whisper_idl__action__Inference_Feedback__Sequence *)allocator.allocate(sizeof(whisper_idl__action__Inference_Feedback__Sequence), allocator.state);
  if (!array) {
    return NULL;
  }
  bool success = whisper_idl__action__Inference_Feedback__Sequence__init(array, size);
  if (!success) {
    allocator.deallocate(array, allocator.state);
    return NULL;
  }
  return array;
}

void
whisper_idl__action__Inference_Feedback__Sequence__destroy(whisper_idl__action__Inference_Feedback__Sequence * array)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (array) {
    whisper_idl__action__Inference_Feedback__Sequence__fini(array);
  }
  allocator.deallocate(array, allocator.state);
}

bool
whisper_idl__action__Inference_Feedback__Sequence__are_equal(const whisper_idl__action__Inference_Feedback__Sequence * lhs, const whisper_idl__action__Inference_Feedback__Sequence * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  if (lhs->size != rhs->size) {
    return false;
  }
  for (size_t i = 0; i < lhs->size; ++i) {
    if (!whisper_idl__action__Inference_Feedback__are_equal(&(lhs->data[i]), &(rhs->data[i]))) {
      return false;
    }
  }
  return true;
}

bool
whisper_idl__action__Inference_Feedback__Sequence__copy(
  const whisper_idl__action__Inference_Feedback__Sequence * input,
  whisper_idl__action__Inference_Feedback__Sequence * output)
{
  if (!input || !output) {
    return false;
  }
  if (output->capacity < input->size) {
    const size_t allocation_size =
      input->size * sizeof(whisper_idl__action__Inference_Feedback);
    rcutils_allocator_t allocator = rcutils_get_default_allocator();
    whisper_idl__action__Inference_Feedback * data =
      (whisper_idl__action__Inference_Feedback *)allocator.reallocate(
      output->data, allocation_size, allocator.state);
    if (!data) {
      return false;
    }
    // If reallocation succeeded, memory may or may not have been moved
    // to fulfill the allocation request, invalidating output->data.
    output->data = data;
    for (size_t i = output->capacity; i < input->size; ++i) {
      if (!whisper_idl__action__Inference_Feedback__init(&output->data[i])) {
        // If initialization of any new item fails, roll back
        // all previously initialized items. Existing items
        // in output are to be left unmodified.
        for (; i-- > output->capacity; ) {
          whisper_idl__action__Inference_Feedback__fini(&output->data[i]);
        }
        return false;
      }
    }
    output->capacity = input->size;
  }
  output->size = input->size;
  for (size_t i = 0; i < input->size; ++i) {
    if (!whisper_idl__action__Inference_Feedback__copy(
        &(input->data[i]), &(output->data[i])))
    {
      return false;
    }
  }
  return true;
}


// Include directives for member types
// Member `goal_id`
#include "unique_identifier_msgs/msg/detail/uuid__functions.h"
// Member `goal`
// already included above
// #include "whisper_idl/action/detail/inference__functions.h"

bool
whisper_idl__action__Inference_SendGoal_Request__init(whisper_idl__action__Inference_SendGoal_Request * msg)
{
  if (!msg) {
    return false;
  }
  // goal_id
  if (!unique_identifier_msgs__msg__UUID__init(&msg->goal_id)) {
    whisper_idl__action__Inference_SendGoal_Request__fini(msg);
    return false;
  }
  // goal
  if (!whisper_idl__action__Inference_Goal__init(&msg->goal)) {
    whisper_idl__action__Inference_SendGoal_Request__fini(msg);
    return false;
  }
  return true;
}

void
whisper_idl__action__Inference_SendGoal_Request__fini(whisper_idl__action__Inference_SendGoal_Request * msg)
{
  if (!msg) {
    return;
  }
  // goal_id
  unique_identifier_msgs__msg__UUID__fini(&msg->goal_id);
  // goal
  whisper_idl__action__Inference_Goal__fini(&msg->goal);
}

bool
whisper_idl__action__Inference_SendGoal_Request__are_equal(const whisper_idl__action__Inference_SendGoal_Request * lhs, const whisper_idl__action__Inference_SendGoal_Request * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  // goal_id
  if (!unique_identifier_msgs__msg__UUID__are_equal(
      &(lhs->goal_id), &(rhs->goal_id)))
  {
    return false;
  }
  // goal
  if (!whisper_idl__action__Inference_Goal__are_equal(
      &(lhs->goal), &(rhs->goal)))
  {
    return false;
  }
  return true;
}

bool
whisper_idl__action__Inference_SendGoal_Request__copy(
  const whisper_idl__action__Inference_SendGoal_Request * input,
  whisper_idl__action__Inference_SendGoal_Request * output)
{
  if (!input || !output) {
    return false;
  }
  // goal_id
  if (!unique_identifier_msgs__msg__UUID__copy(
      &(input->goal_id), &(output->goal_id)))
  {
    return false;
  }
  // goal
  if (!whisper_idl__action__Inference_Goal__copy(
      &(input->goal), &(output->goal)))
  {
    return false;
  }
  return true;
}

whisper_idl__action__Inference_SendGoal_Request *
whisper_idl__action__Inference_SendGoal_Request__create()
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_SendGoal_Request * msg = (whisper_idl__action__Inference_SendGoal_Request *)allocator.allocate(sizeof(whisper_idl__action__Inference_SendGoal_Request), allocator.state);
  if (!msg) {
    return NULL;
  }
  memset(msg, 0, sizeof(whisper_idl__action__Inference_SendGoal_Request));
  bool success = whisper_idl__action__Inference_SendGoal_Request__init(msg);
  if (!success) {
    allocator.deallocate(msg, allocator.state);
    return NULL;
  }
  return msg;
}

void
whisper_idl__action__Inference_SendGoal_Request__destroy(whisper_idl__action__Inference_SendGoal_Request * msg)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (msg) {
    whisper_idl__action__Inference_SendGoal_Request__fini(msg);
  }
  allocator.deallocate(msg, allocator.state);
}


bool
whisper_idl__action__Inference_SendGoal_Request__Sequence__init(whisper_idl__action__Inference_SendGoal_Request__Sequence * array, size_t size)
{
  if (!array) {
    return false;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_SendGoal_Request * data = NULL;

  if (size) {
    data = (whisper_idl__action__Inference_SendGoal_Request *)allocator.zero_allocate(size, sizeof(whisper_idl__action__Inference_SendGoal_Request), allocator.state);
    if (!data) {
      return false;
    }
    // initialize all array elements
    size_t i;
    for (i = 0; i < size; ++i) {
      bool success = whisper_idl__action__Inference_SendGoal_Request__init(&data[i]);
      if (!success) {
        break;
      }
    }
    if (i < size) {
      // if initialization failed finalize the already initialized array elements
      for (; i > 0; --i) {
        whisper_idl__action__Inference_SendGoal_Request__fini(&data[i - 1]);
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
whisper_idl__action__Inference_SendGoal_Request__Sequence__fini(whisper_idl__action__Inference_SendGoal_Request__Sequence * array)
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
      whisper_idl__action__Inference_SendGoal_Request__fini(&array->data[i]);
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

whisper_idl__action__Inference_SendGoal_Request__Sequence *
whisper_idl__action__Inference_SendGoal_Request__Sequence__create(size_t size)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_SendGoal_Request__Sequence * array = (whisper_idl__action__Inference_SendGoal_Request__Sequence *)allocator.allocate(sizeof(whisper_idl__action__Inference_SendGoal_Request__Sequence), allocator.state);
  if (!array) {
    return NULL;
  }
  bool success = whisper_idl__action__Inference_SendGoal_Request__Sequence__init(array, size);
  if (!success) {
    allocator.deallocate(array, allocator.state);
    return NULL;
  }
  return array;
}

void
whisper_idl__action__Inference_SendGoal_Request__Sequence__destroy(whisper_idl__action__Inference_SendGoal_Request__Sequence * array)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (array) {
    whisper_idl__action__Inference_SendGoal_Request__Sequence__fini(array);
  }
  allocator.deallocate(array, allocator.state);
}

bool
whisper_idl__action__Inference_SendGoal_Request__Sequence__are_equal(const whisper_idl__action__Inference_SendGoal_Request__Sequence * lhs, const whisper_idl__action__Inference_SendGoal_Request__Sequence * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  if (lhs->size != rhs->size) {
    return false;
  }
  for (size_t i = 0; i < lhs->size; ++i) {
    if (!whisper_idl__action__Inference_SendGoal_Request__are_equal(&(lhs->data[i]), &(rhs->data[i]))) {
      return false;
    }
  }
  return true;
}

bool
whisper_idl__action__Inference_SendGoal_Request__Sequence__copy(
  const whisper_idl__action__Inference_SendGoal_Request__Sequence * input,
  whisper_idl__action__Inference_SendGoal_Request__Sequence * output)
{
  if (!input || !output) {
    return false;
  }
  if (output->capacity < input->size) {
    const size_t allocation_size =
      input->size * sizeof(whisper_idl__action__Inference_SendGoal_Request);
    rcutils_allocator_t allocator = rcutils_get_default_allocator();
    whisper_idl__action__Inference_SendGoal_Request * data =
      (whisper_idl__action__Inference_SendGoal_Request *)allocator.reallocate(
      output->data, allocation_size, allocator.state);
    if (!data) {
      return false;
    }
    // If reallocation succeeded, memory may or may not have been moved
    // to fulfill the allocation request, invalidating output->data.
    output->data = data;
    for (size_t i = output->capacity; i < input->size; ++i) {
      if (!whisper_idl__action__Inference_SendGoal_Request__init(&output->data[i])) {
        // If initialization of any new item fails, roll back
        // all previously initialized items. Existing items
        // in output are to be left unmodified.
        for (; i-- > output->capacity; ) {
          whisper_idl__action__Inference_SendGoal_Request__fini(&output->data[i]);
        }
        return false;
      }
    }
    output->capacity = input->size;
  }
  output->size = input->size;
  for (size_t i = 0; i < input->size; ++i) {
    if (!whisper_idl__action__Inference_SendGoal_Request__copy(
        &(input->data[i]), &(output->data[i])))
    {
      return false;
    }
  }
  return true;
}


// Include directives for member types
// Member `stamp`
#include "builtin_interfaces/msg/detail/time__functions.h"

bool
whisper_idl__action__Inference_SendGoal_Response__init(whisper_idl__action__Inference_SendGoal_Response * msg)
{
  if (!msg) {
    return false;
  }
  // accepted
  // stamp
  if (!builtin_interfaces__msg__Time__init(&msg->stamp)) {
    whisper_idl__action__Inference_SendGoal_Response__fini(msg);
    return false;
  }
  return true;
}

void
whisper_idl__action__Inference_SendGoal_Response__fini(whisper_idl__action__Inference_SendGoal_Response * msg)
{
  if (!msg) {
    return;
  }
  // accepted
  // stamp
  builtin_interfaces__msg__Time__fini(&msg->stamp);
}

bool
whisper_idl__action__Inference_SendGoal_Response__are_equal(const whisper_idl__action__Inference_SendGoal_Response * lhs, const whisper_idl__action__Inference_SendGoal_Response * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  // accepted
  if (lhs->accepted != rhs->accepted) {
    return false;
  }
  // stamp
  if (!builtin_interfaces__msg__Time__are_equal(
      &(lhs->stamp), &(rhs->stamp)))
  {
    return false;
  }
  return true;
}

bool
whisper_idl__action__Inference_SendGoal_Response__copy(
  const whisper_idl__action__Inference_SendGoal_Response * input,
  whisper_idl__action__Inference_SendGoal_Response * output)
{
  if (!input || !output) {
    return false;
  }
  // accepted
  output->accepted = input->accepted;
  // stamp
  if (!builtin_interfaces__msg__Time__copy(
      &(input->stamp), &(output->stamp)))
  {
    return false;
  }
  return true;
}

whisper_idl__action__Inference_SendGoal_Response *
whisper_idl__action__Inference_SendGoal_Response__create()
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_SendGoal_Response * msg = (whisper_idl__action__Inference_SendGoal_Response *)allocator.allocate(sizeof(whisper_idl__action__Inference_SendGoal_Response), allocator.state);
  if (!msg) {
    return NULL;
  }
  memset(msg, 0, sizeof(whisper_idl__action__Inference_SendGoal_Response));
  bool success = whisper_idl__action__Inference_SendGoal_Response__init(msg);
  if (!success) {
    allocator.deallocate(msg, allocator.state);
    return NULL;
  }
  return msg;
}

void
whisper_idl__action__Inference_SendGoal_Response__destroy(whisper_idl__action__Inference_SendGoal_Response * msg)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (msg) {
    whisper_idl__action__Inference_SendGoal_Response__fini(msg);
  }
  allocator.deallocate(msg, allocator.state);
}


bool
whisper_idl__action__Inference_SendGoal_Response__Sequence__init(whisper_idl__action__Inference_SendGoal_Response__Sequence * array, size_t size)
{
  if (!array) {
    return false;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_SendGoal_Response * data = NULL;

  if (size) {
    data = (whisper_idl__action__Inference_SendGoal_Response *)allocator.zero_allocate(size, sizeof(whisper_idl__action__Inference_SendGoal_Response), allocator.state);
    if (!data) {
      return false;
    }
    // initialize all array elements
    size_t i;
    for (i = 0; i < size; ++i) {
      bool success = whisper_idl__action__Inference_SendGoal_Response__init(&data[i]);
      if (!success) {
        break;
      }
    }
    if (i < size) {
      // if initialization failed finalize the already initialized array elements
      for (; i > 0; --i) {
        whisper_idl__action__Inference_SendGoal_Response__fini(&data[i - 1]);
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
whisper_idl__action__Inference_SendGoal_Response__Sequence__fini(whisper_idl__action__Inference_SendGoal_Response__Sequence * array)
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
      whisper_idl__action__Inference_SendGoal_Response__fini(&array->data[i]);
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

whisper_idl__action__Inference_SendGoal_Response__Sequence *
whisper_idl__action__Inference_SendGoal_Response__Sequence__create(size_t size)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_SendGoal_Response__Sequence * array = (whisper_idl__action__Inference_SendGoal_Response__Sequence *)allocator.allocate(sizeof(whisper_idl__action__Inference_SendGoal_Response__Sequence), allocator.state);
  if (!array) {
    return NULL;
  }
  bool success = whisper_idl__action__Inference_SendGoal_Response__Sequence__init(array, size);
  if (!success) {
    allocator.deallocate(array, allocator.state);
    return NULL;
  }
  return array;
}

void
whisper_idl__action__Inference_SendGoal_Response__Sequence__destroy(whisper_idl__action__Inference_SendGoal_Response__Sequence * array)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (array) {
    whisper_idl__action__Inference_SendGoal_Response__Sequence__fini(array);
  }
  allocator.deallocate(array, allocator.state);
}

bool
whisper_idl__action__Inference_SendGoal_Response__Sequence__are_equal(const whisper_idl__action__Inference_SendGoal_Response__Sequence * lhs, const whisper_idl__action__Inference_SendGoal_Response__Sequence * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  if (lhs->size != rhs->size) {
    return false;
  }
  for (size_t i = 0; i < lhs->size; ++i) {
    if (!whisper_idl__action__Inference_SendGoal_Response__are_equal(&(lhs->data[i]), &(rhs->data[i]))) {
      return false;
    }
  }
  return true;
}

bool
whisper_idl__action__Inference_SendGoal_Response__Sequence__copy(
  const whisper_idl__action__Inference_SendGoal_Response__Sequence * input,
  whisper_idl__action__Inference_SendGoal_Response__Sequence * output)
{
  if (!input || !output) {
    return false;
  }
  if (output->capacity < input->size) {
    const size_t allocation_size =
      input->size * sizeof(whisper_idl__action__Inference_SendGoal_Response);
    rcutils_allocator_t allocator = rcutils_get_default_allocator();
    whisper_idl__action__Inference_SendGoal_Response * data =
      (whisper_idl__action__Inference_SendGoal_Response *)allocator.reallocate(
      output->data, allocation_size, allocator.state);
    if (!data) {
      return false;
    }
    // If reallocation succeeded, memory may or may not have been moved
    // to fulfill the allocation request, invalidating output->data.
    output->data = data;
    for (size_t i = output->capacity; i < input->size; ++i) {
      if (!whisper_idl__action__Inference_SendGoal_Response__init(&output->data[i])) {
        // If initialization of any new item fails, roll back
        // all previously initialized items. Existing items
        // in output are to be left unmodified.
        for (; i-- > output->capacity; ) {
          whisper_idl__action__Inference_SendGoal_Response__fini(&output->data[i]);
        }
        return false;
      }
    }
    output->capacity = input->size;
  }
  output->size = input->size;
  for (size_t i = 0; i < input->size; ++i) {
    if (!whisper_idl__action__Inference_SendGoal_Response__copy(
        &(input->data[i]), &(output->data[i])))
    {
      return false;
    }
  }
  return true;
}


// Include directives for member types
// Member `goal_id`
// already included above
// #include "unique_identifier_msgs/msg/detail/uuid__functions.h"

bool
whisper_idl__action__Inference_GetResult_Request__init(whisper_idl__action__Inference_GetResult_Request * msg)
{
  if (!msg) {
    return false;
  }
  // goal_id
  if (!unique_identifier_msgs__msg__UUID__init(&msg->goal_id)) {
    whisper_idl__action__Inference_GetResult_Request__fini(msg);
    return false;
  }
  return true;
}

void
whisper_idl__action__Inference_GetResult_Request__fini(whisper_idl__action__Inference_GetResult_Request * msg)
{
  if (!msg) {
    return;
  }
  // goal_id
  unique_identifier_msgs__msg__UUID__fini(&msg->goal_id);
}

bool
whisper_idl__action__Inference_GetResult_Request__are_equal(const whisper_idl__action__Inference_GetResult_Request * lhs, const whisper_idl__action__Inference_GetResult_Request * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  // goal_id
  if (!unique_identifier_msgs__msg__UUID__are_equal(
      &(lhs->goal_id), &(rhs->goal_id)))
  {
    return false;
  }
  return true;
}

bool
whisper_idl__action__Inference_GetResult_Request__copy(
  const whisper_idl__action__Inference_GetResult_Request * input,
  whisper_idl__action__Inference_GetResult_Request * output)
{
  if (!input || !output) {
    return false;
  }
  // goal_id
  if (!unique_identifier_msgs__msg__UUID__copy(
      &(input->goal_id), &(output->goal_id)))
  {
    return false;
  }
  return true;
}

whisper_idl__action__Inference_GetResult_Request *
whisper_idl__action__Inference_GetResult_Request__create()
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_GetResult_Request * msg = (whisper_idl__action__Inference_GetResult_Request *)allocator.allocate(sizeof(whisper_idl__action__Inference_GetResult_Request), allocator.state);
  if (!msg) {
    return NULL;
  }
  memset(msg, 0, sizeof(whisper_idl__action__Inference_GetResult_Request));
  bool success = whisper_idl__action__Inference_GetResult_Request__init(msg);
  if (!success) {
    allocator.deallocate(msg, allocator.state);
    return NULL;
  }
  return msg;
}

void
whisper_idl__action__Inference_GetResult_Request__destroy(whisper_idl__action__Inference_GetResult_Request * msg)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (msg) {
    whisper_idl__action__Inference_GetResult_Request__fini(msg);
  }
  allocator.deallocate(msg, allocator.state);
}


bool
whisper_idl__action__Inference_GetResult_Request__Sequence__init(whisper_idl__action__Inference_GetResult_Request__Sequence * array, size_t size)
{
  if (!array) {
    return false;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_GetResult_Request * data = NULL;

  if (size) {
    data = (whisper_idl__action__Inference_GetResult_Request *)allocator.zero_allocate(size, sizeof(whisper_idl__action__Inference_GetResult_Request), allocator.state);
    if (!data) {
      return false;
    }
    // initialize all array elements
    size_t i;
    for (i = 0; i < size; ++i) {
      bool success = whisper_idl__action__Inference_GetResult_Request__init(&data[i]);
      if (!success) {
        break;
      }
    }
    if (i < size) {
      // if initialization failed finalize the already initialized array elements
      for (; i > 0; --i) {
        whisper_idl__action__Inference_GetResult_Request__fini(&data[i - 1]);
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
whisper_idl__action__Inference_GetResult_Request__Sequence__fini(whisper_idl__action__Inference_GetResult_Request__Sequence * array)
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
      whisper_idl__action__Inference_GetResult_Request__fini(&array->data[i]);
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

whisper_idl__action__Inference_GetResult_Request__Sequence *
whisper_idl__action__Inference_GetResult_Request__Sequence__create(size_t size)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_GetResult_Request__Sequence * array = (whisper_idl__action__Inference_GetResult_Request__Sequence *)allocator.allocate(sizeof(whisper_idl__action__Inference_GetResult_Request__Sequence), allocator.state);
  if (!array) {
    return NULL;
  }
  bool success = whisper_idl__action__Inference_GetResult_Request__Sequence__init(array, size);
  if (!success) {
    allocator.deallocate(array, allocator.state);
    return NULL;
  }
  return array;
}

void
whisper_idl__action__Inference_GetResult_Request__Sequence__destroy(whisper_idl__action__Inference_GetResult_Request__Sequence * array)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (array) {
    whisper_idl__action__Inference_GetResult_Request__Sequence__fini(array);
  }
  allocator.deallocate(array, allocator.state);
}

bool
whisper_idl__action__Inference_GetResult_Request__Sequence__are_equal(const whisper_idl__action__Inference_GetResult_Request__Sequence * lhs, const whisper_idl__action__Inference_GetResult_Request__Sequence * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  if (lhs->size != rhs->size) {
    return false;
  }
  for (size_t i = 0; i < lhs->size; ++i) {
    if (!whisper_idl__action__Inference_GetResult_Request__are_equal(&(lhs->data[i]), &(rhs->data[i]))) {
      return false;
    }
  }
  return true;
}

bool
whisper_idl__action__Inference_GetResult_Request__Sequence__copy(
  const whisper_idl__action__Inference_GetResult_Request__Sequence * input,
  whisper_idl__action__Inference_GetResult_Request__Sequence * output)
{
  if (!input || !output) {
    return false;
  }
  if (output->capacity < input->size) {
    const size_t allocation_size =
      input->size * sizeof(whisper_idl__action__Inference_GetResult_Request);
    rcutils_allocator_t allocator = rcutils_get_default_allocator();
    whisper_idl__action__Inference_GetResult_Request * data =
      (whisper_idl__action__Inference_GetResult_Request *)allocator.reallocate(
      output->data, allocation_size, allocator.state);
    if (!data) {
      return false;
    }
    // If reallocation succeeded, memory may or may not have been moved
    // to fulfill the allocation request, invalidating output->data.
    output->data = data;
    for (size_t i = output->capacity; i < input->size; ++i) {
      if (!whisper_idl__action__Inference_GetResult_Request__init(&output->data[i])) {
        // If initialization of any new item fails, roll back
        // all previously initialized items. Existing items
        // in output are to be left unmodified.
        for (; i-- > output->capacity; ) {
          whisper_idl__action__Inference_GetResult_Request__fini(&output->data[i]);
        }
        return false;
      }
    }
    output->capacity = input->size;
  }
  output->size = input->size;
  for (size_t i = 0; i < input->size; ++i) {
    if (!whisper_idl__action__Inference_GetResult_Request__copy(
        &(input->data[i]), &(output->data[i])))
    {
      return false;
    }
  }
  return true;
}


// Include directives for member types
// Member `result`
// already included above
// #include "whisper_idl/action/detail/inference__functions.h"

bool
whisper_idl__action__Inference_GetResult_Response__init(whisper_idl__action__Inference_GetResult_Response * msg)
{
  if (!msg) {
    return false;
  }
  // status
  // result
  if (!whisper_idl__action__Inference_Result__init(&msg->result)) {
    whisper_idl__action__Inference_GetResult_Response__fini(msg);
    return false;
  }
  return true;
}

void
whisper_idl__action__Inference_GetResult_Response__fini(whisper_idl__action__Inference_GetResult_Response * msg)
{
  if (!msg) {
    return;
  }
  // status
  // result
  whisper_idl__action__Inference_Result__fini(&msg->result);
}

bool
whisper_idl__action__Inference_GetResult_Response__are_equal(const whisper_idl__action__Inference_GetResult_Response * lhs, const whisper_idl__action__Inference_GetResult_Response * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  // status
  if (lhs->status != rhs->status) {
    return false;
  }
  // result
  if (!whisper_idl__action__Inference_Result__are_equal(
      &(lhs->result), &(rhs->result)))
  {
    return false;
  }
  return true;
}

bool
whisper_idl__action__Inference_GetResult_Response__copy(
  const whisper_idl__action__Inference_GetResult_Response * input,
  whisper_idl__action__Inference_GetResult_Response * output)
{
  if (!input || !output) {
    return false;
  }
  // status
  output->status = input->status;
  // result
  if (!whisper_idl__action__Inference_Result__copy(
      &(input->result), &(output->result)))
  {
    return false;
  }
  return true;
}

whisper_idl__action__Inference_GetResult_Response *
whisper_idl__action__Inference_GetResult_Response__create()
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_GetResult_Response * msg = (whisper_idl__action__Inference_GetResult_Response *)allocator.allocate(sizeof(whisper_idl__action__Inference_GetResult_Response), allocator.state);
  if (!msg) {
    return NULL;
  }
  memset(msg, 0, sizeof(whisper_idl__action__Inference_GetResult_Response));
  bool success = whisper_idl__action__Inference_GetResult_Response__init(msg);
  if (!success) {
    allocator.deallocate(msg, allocator.state);
    return NULL;
  }
  return msg;
}

void
whisper_idl__action__Inference_GetResult_Response__destroy(whisper_idl__action__Inference_GetResult_Response * msg)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (msg) {
    whisper_idl__action__Inference_GetResult_Response__fini(msg);
  }
  allocator.deallocate(msg, allocator.state);
}


bool
whisper_idl__action__Inference_GetResult_Response__Sequence__init(whisper_idl__action__Inference_GetResult_Response__Sequence * array, size_t size)
{
  if (!array) {
    return false;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_GetResult_Response * data = NULL;

  if (size) {
    data = (whisper_idl__action__Inference_GetResult_Response *)allocator.zero_allocate(size, sizeof(whisper_idl__action__Inference_GetResult_Response), allocator.state);
    if (!data) {
      return false;
    }
    // initialize all array elements
    size_t i;
    for (i = 0; i < size; ++i) {
      bool success = whisper_idl__action__Inference_GetResult_Response__init(&data[i]);
      if (!success) {
        break;
      }
    }
    if (i < size) {
      // if initialization failed finalize the already initialized array elements
      for (; i > 0; --i) {
        whisper_idl__action__Inference_GetResult_Response__fini(&data[i - 1]);
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
whisper_idl__action__Inference_GetResult_Response__Sequence__fini(whisper_idl__action__Inference_GetResult_Response__Sequence * array)
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
      whisper_idl__action__Inference_GetResult_Response__fini(&array->data[i]);
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

whisper_idl__action__Inference_GetResult_Response__Sequence *
whisper_idl__action__Inference_GetResult_Response__Sequence__create(size_t size)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_GetResult_Response__Sequence * array = (whisper_idl__action__Inference_GetResult_Response__Sequence *)allocator.allocate(sizeof(whisper_idl__action__Inference_GetResult_Response__Sequence), allocator.state);
  if (!array) {
    return NULL;
  }
  bool success = whisper_idl__action__Inference_GetResult_Response__Sequence__init(array, size);
  if (!success) {
    allocator.deallocate(array, allocator.state);
    return NULL;
  }
  return array;
}

void
whisper_idl__action__Inference_GetResult_Response__Sequence__destroy(whisper_idl__action__Inference_GetResult_Response__Sequence * array)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (array) {
    whisper_idl__action__Inference_GetResult_Response__Sequence__fini(array);
  }
  allocator.deallocate(array, allocator.state);
}

bool
whisper_idl__action__Inference_GetResult_Response__Sequence__are_equal(const whisper_idl__action__Inference_GetResult_Response__Sequence * lhs, const whisper_idl__action__Inference_GetResult_Response__Sequence * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  if (lhs->size != rhs->size) {
    return false;
  }
  for (size_t i = 0; i < lhs->size; ++i) {
    if (!whisper_idl__action__Inference_GetResult_Response__are_equal(&(lhs->data[i]), &(rhs->data[i]))) {
      return false;
    }
  }
  return true;
}

bool
whisper_idl__action__Inference_GetResult_Response__Sequence__copy(
  const whisper_idl__action__Inference_GetResult_Response__Sequence * input,
  whisper_idl__action__Inference_GetResult_Response__Sequence * output)
{
  if (!input || !output) {
    return false;
  }
  if (output->capacity < input->size) {
    const size_t allocation_size =
      input->size * sizeof(whisper_idl__action__Inference_GetResult_Response);
    rcutils_allocator_t allocator = rcutils_get_default_allocator();
    whisper_idl__action__Inference_GetResult_Response * data =
      (whisper_idl__action__Inference_GetResult_Response *)allocator.reallocate(
      output->data, allocation_size, allocator.state);
    if (!data) {
      return false;
    }
    // If reallocation succeeded, memory may or may not have been moved
    // to fulfill the allocation request, invalidating output->data.
    output->data = data;
    for (size_t i = output->capacity; i < input->size; ++i) {
      if (!whisper_idl__action__Inference_GetResult_Response__init(&output->data[i])) {
        // If initialization of any new item fails, roll back
        // all previously initialized items. Existing items
        // in output are to be left unmodified.
        for (; i-- > output->capacity; ) {
          whisper_idl__action__Inference_GetResult_Response__fini(&output->data[i]);
        }
        return false;
      }
    }
    output->capacity = input->size;
  }
  output->size = input->size;
  for (size_t i = 0; i < input->size; ++i) {
    if (!whisper_idl__action__Inference_GetResult_Response__copy(
        &(input->data[i]), &(output->data[i])))
    {
      return false;
    }
  }
  return true;
}


// Include directives for member types
// Member `goal_id`
// already included above
// #include "unique_identifier_msgs/msg/detail/uuid__functions.h"
// Member `feedback`
// already included above
// #include "whisper_idl/action/detail/inference__functions.h"

bool
whisper_idl__action__Inference_FeedbackMessage__init(whisper_idl__action__Inference_FeedbackMessage * msg)
{
  if (!msg) {
    return false;
  }
  // goal_id
  if (!unique_identifier_msgs__msg__UUID__init(&msg->goal_id)) {
    whisper_idl__action__Inference_FeedbackMessage__fini(msg);
    return false;
  }
  // feedback
  if (!whisper_idl__action__Inference_Feedback__init(&msg->feedback)) {
    whisper_idl__action__Inference_FeedbackMessage__fini(msg);
    return false;
  }
  return true;
}

void
whisper_idl__action__Inference_FeedbackMessage__fini(whisper_idl__action__Inference_FeedbackMessage * msg)
{
  if (!msg) {
    return;
  }
  // goal_id
  unique_identifier_msgs__msg__UUID__fini(&msg->goal_id);
  // feedback
  whisper_idl__action__Inference_Feedback__fini(&msg->feedback);
}

bool
whisper_idl__action__Inference_FeedbackMessage__are_equal(const whisper_idl__action__Inference_FeedbackMessage * lhs, const whisper_idl__action__Inference_FeedbackMessage * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  // goal_id
  if (!unique_identifier_msgs__msg__UUID__are_equal(
      &(lhs->goal_id), &(rhs->goal_id)))
  {
    return false;
  }
  // feedback
  if (!whisper_idl__action__Inference_Feedback__are_equal(
      &(lhs->feedback), &(rhs->feedback)))
  {
    return false;
  }
  return true;
}

bool
whisper_idl__action__Inference_FeedbackMessage__copy(
  const whisper_idl__action__Inference_FeedbackMessage * input,
  whisper_idl__action__Inference_FeedbackMessage * output)
{
  if (!input || !output) {
    return false;
  }
  // goal_id
  if (!unique_identifier_msgs__msg__UUID__copy(
      &(input->goal_id), &(output->goal_id)))
  {
    return false;
  }
  // feedback
  if (!whisper_idl__action__Inference_Feedback__copy(
      &(input->feedback), &(output->feedback)))
  {
    return false;
  }
  return true;
}

whisper_idl__action__Inference_FeedbackMessage *
whisper_idl__action__Inference_FeedbackMessage__create()
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_FeedbackMessage * msg = (whisper_idl__action__Inference_FeedbackMessage *)allocator.allocate(sizeof(whisper_idl__action__Inference_FeedbackMessage), allocator.state);
  if (!msg) {
    return NULL;
  }
  memset(msg, 0, sizeof(whisper_idl__action__Inference_FeedbackMessage));
  bool success = whisper_idl__action__Inference_FeedbackMessage__init(msg);
  if (!success) {
    allocator.deallocate(msg, allocator.state);
    return NULL;
  }
  return msg;
}

void
whisper_idl__action__Inference_FeedbackMessage__destroy(whisper_idl__action__Inference_FeedbackMessage * msg)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (msg) {
    whisper_idl__action__Inference_FeedbackMessage__fini(msg);
  }
  allocator.deallocate(msg, allocator.state);
}


bool
whisper_idl__action__Inference_FeedbackMessage__Sequence__init(whisper_idl__action__Inference_FeedbackMessage__Sequence * array, size_t size)
{
  if (!array) {
    return false;
  }
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_FeedbackMessage * data = NULL;

  if (size) {
    data = (whisper_idl__action__Inference_FeedbackMessage *)allocator.zero_allocate(size, sizeof(whisper_idl__action__Inference_FeedbackMessage), allocator.state);
    if (!data) {
      return false;
    }
    // initialize all array elements
    size_t i;
    for (i = 0; i < size; ++i) {
      bool success = whisper_idl__action__Inference_FeedbackMessage__init(&data[i]);
      if (!success) {
        break;
      }
    }
    if (i < size) {
      // if initialization failed finalize the already initialized array elements
      for (; i > 0; --i) {
        whisper_idl__action__Inference_FeedbackMessage__fini(&data[i - 1]);
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
whisper_idl__action__Inference_FeedbackMessage__Sequence__fini(whisper_idl__action__Inference_FeedbackMessage__Sequence * array)
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
      whisper_idl__action__Inference_FeedbackMessage__fini(&array->data[i]);
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

whisper_idl__action__Inference_FeedbackMessage__Sequence *
whisper_idl__action__Inference_FeedbackMessage__Sequence__create(size_t size)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  whisper_idl__action__Inference_FeedbackMessage__Sequence * array = (whisper_idl__action__Inference_FeedbackMessage__Sequence *)allocator.allocate(sizeof(whisper_idl__action__Inference_FeedbackMessage__Sequence), allocator.state);
  if (!array) {
    return NULL;
  }
  bool success = whisper_idl__action__Inference_FeedbackMessage__Sequence__init(array, size);
  if (!success) {
    allocator.deallocate(array, allocator.state);
    return NULL;
  }
  return array;
}

void
whisper_idl__action__Inference_FeedbackMessage__Sequence__destroy(whisper_idl__action__Inference_FeedbackMessage__Sequence * array)
{
  rcutils_allocator_t allocator = rcutils_get_default_allocator();
  if (array) {
    whisper_idl__action__Inference_FeedbackMessage__Sequence__fini(array);
  }
  allocator.deallocate(array, allocator.state);
}

bool
whisper_idl__action__Inference_FeedbackMessage__Sequence__are_equal(const whisper_idl__action__Inference_FeedbackMessage__Sequence * lhs, const whisper_idl__action__Inference_FeedbackMessage__Sequence * rhs)
{
  if (!lhs || !rhs) {
    return false;
  }
  if (lhs->size != rhs->size) {
    return false;
  }
  for (size_t i = 0; i < lhs->size; ++i) {
    if (!whisper_idl__action__Inference_FeedbackMessage__are_equal(&(lhs->data[i]), &(rhs->data[i]))) {
      return false;
    }
  }
  return true;
}

bool
whisper_idl__action__Inference_FeedbackMessage__Sequence__copy(
  const whisper_idl__action__Inference_FeedbackMessage__Sequence * input,
  whisper_idl__action__Inference_FeedbackMessage__Sequence * output)
{
  if (!input || !output) {
    return false;
  }
  if (output->capacity < input->size) {
    const size_t allocation_size =
      input->size * sizeof(whisper_idl__action__Inference_FeedbackMessage);
    rcutils_allocator_t allocator = rcutils_get_default_allocator();
    whisper_idl__action__Inference_FeedbackMessage * data =
      (whisper_idl__action__Inference_FeedbackMessage *)allocator.reallocate(
      output->data, allocation_size, allocator.state);
    if (!data) {
      return false;
    }
    // If reallocation succeeded, memory may or may not have been moved
    // to fulfill the allocation request, invalidating output->data.
    output->data = data;
    for (size_t i = output->capacity; i < input->size; ++i) {
      if (!whisper_idl__action__Inference_FeedbackMessage__init(&output->data[i])) {
        // If initialization of any new item fails, roll back
        // all previously initialized items. Existing items
        // in output are to be left unmodified.
        for (; i-- > output->capacity; ) {
          whisper_idl__action__Inference_FeedbackMessage__fini(&output->data[i]);
        }
        return false;
      }
    }
    output->capacity = input->size;
  }
  output->size = input->size;
  for (size_t i = 0; i < input->size; ++i) {
    if (!whisper_idl__action__Inference_FeedbackMessage__copy(
        &(input->data[i]), &(output->data[i])))
    {
      return false;
    }
  }
  return true;
}
