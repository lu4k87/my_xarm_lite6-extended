// generated from rosidl_generator_c/resource/idl__functions.h.em
// with input from whisper_idl:action/Inference.idl
// generated code does not contain a copyright notice

#ifndef WHISPER_IDL__ACTION__DETAIL__INFERENCE__FUNCTIONS_H_
#define WHISPER_IDL__ACTION__DETAIL__INFERENCE__FUNCTIONS_H_

#ifdef __cplusplus
extern "C"
{
#endif

#include <stdbool.h>
#include <stdlib.h>

#include "rosidl_runtime_c/visibility_control.h"
#include "whisper_idl/msg/rosidl_generator_c__visibility_control.h"

#include "whisper_idl/action/detail/inference__struct.h"

/// Initialize action/Inference message.
/**
 * If the init function is called twice for the same message without
 * calling fini inbetween previously allocated memory will be leaked.
 * \param[in,out] msg The previously allocated message pointer.
 * Fields without a default value will not be initialized by this function.
 * You might want to call memset(msg, 0, sizeof(
 * whisper_idl__action__Inference_Goal
 * )) before or use
 * whisper_idl__action__Inference_Goal__create()
 * to allocate and initialize the message.
 * \return true if initialization was successful, otherwise false
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_Goal__init(whisper_idl__action__Inference_Goal * msg);

/// Finalize action/Inference message.
/**
 * \param[in,out] msg The allocated message pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_Goal__fini(whisper_idl__action__Inference_Goal * msg);

/// Create action/Inference message.
/**
 * It allocates the memory for the message, sets the memory to zero, and
 * calls
 * whisper_idl__action__Inference_Goal__init().
 * \return The pointer to the initialized message if successful,
 * otherwise NULL
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
whisper_idl__action__Inference_Goal *
whisper_idl__action__Inference_Goal__create();

/// Destroy action/Inference message.
/**
 * It calls
 * whisper_idl__action__Inference_Goal__fini()
 * and frees the memory of the message.
 * \param[in,out] msg The allocated message pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_Goal__destroy(whisper_idl__action__Inference_Goal * msg);

/// Check for action/Inference message equality.
/**
 * \param[in] lhs The message on the left hand size of the equality operator.
 * \param[in] rhs The message on the right hand size of the equality operator.
 * \return true if messages are equal, otherwise false.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_Goal__are_equal(const whisper_idl__action__Inference_Goal * lhs, const whisper_idl__action__Inference_Goal * rhs);

/// Copy a action/Inference message.
/**
 * This functions performs a deep copy, as opposed to the shallow copy that
 * plain assignment yields.
 *
 * \param[in] input The source message pointer.
 * \param[out] output The target message pointer, which must
 *   have been initialized before calling this function.
 * \return true if successful, or false if either pointer is null
 *   or memory allocation fails.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_Goal__copy(
  const whisper_idl__action__Inference_Goal * input,
  whisper_idl__action__Inference_Goal * output);

/// Initialize array of action/Inference messages.
/**
 * It allocates the memory for the number of elements and calls
 * whisper_idl__action__Inference_Goal__init()
 * for each element of the array.
 * \param[in,out] array The allocated array pointer.
 * \param[in] size The size / capacity of the array.
 * \return true if initialization was successful, otherwise false
 * If the array pointer is valid and the size is zero it is guaranteed
 # to return true.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_Goal__Sequence__init(whisper_idl__action__Inference_Goal__Sequence * array, size_t size);

/// Finalize array of action/Inference messages.
/**
 * It calls
 * whisper_idl__action__Inference_Goal__fini()
 * for each element of the array and frees the memory for the number of
 * elements.
 * \param[in,out] array The initialized array pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_Goal__Sequence__fini(whisper_idl__action__Inference_Goal__Sequence * array);

/// Create array of action/Inference messages.
/**
 * It allocates the memory for the array and calls
 * whisper_idl__action__Inference_Goal__Sequence__init().
 * \param[in] size The size / capacity of the array.
 * \return The pointer to the initialized array if successful, otherwise NULL
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
whisper_idl__action__Inference_Goal__Sequence *
whisper_idl__action__Inference_Goal__Sequence__create(size_t size);

/// Destroy array of action/Inference messages.
/**
 * It calls
 * whisper_idl__action__Inference_Goal__Sequence__fini()
 * on the array,
 * and frees the memory of the array.
 * \param[in,out] array The initialized array pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_Goal__Sequence__destroy(whisper_idl__action__Inference_Goal__Sequence * array);

/// Check for action/Inference message array equality.
/**
 * \param[in] lhs The message array on the left hand size of the equality operator.
 * \param[in] rhs The message array on the right hand size of the equality operator.
 * \return true if message arrays are equal in size and content, otherwise false.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_Goal__Sequence__are_equal(const whisper_idl__action__Inference_Goal__Sequence * lhs, const whisper_idl__action__Inference_Goal__Sequence * rhs);

/// Copy an array of action/Inference messages.
/**
 * This functions performs a deep copy, as opposed to the shallow copy that
 * plain assignment yields.
 *
 * \param[in] input The source array pointer.
 * \param[out] output The target array pointer, which must
 *   have been initialized before calling this function.
 * \return true if successful, or false if either pointer
 *   is null or memory allocation fails.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_Goal__Sequence__copy(
  const whisper_idl__action__Inference_Goal__Sequence * input,
  whisper_idl__action__Inference_Goal__Sequence * output);

/// Initialize action/Inference message.
/**
 * If the init function is called twice for the same message without
 * calling fini inbetween previously allocated memory will be leaked.
 * \param[in,out] msg The previously allocated message pointer.
 * Fields without a default value will not be initialized by this function.
 * You might want to call memset(msg, 0, sizeof(
 * whisper_idl__action__Inference_Result
 * )) before or use
 * whisper_idl__action__Inference_Result__create()
 * to allocate and initialize the message.
 * \return true if initialization was successful, otherwise false
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_Result__init(whisper_idl__action__Inference_Result * msg);

/// Finalize action/Inference message.
/**
 * \param[in,out] msg The allocated message pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_Result__fini(whisper_idl__action__Inference_Result * msg);

/// Create action/Inference message.
/**
 * It allocates the memory for the message, sets the memory to zero, and
 * calls
 * whisper_idl__action__Inference_Result__init().
 * \return The pointer to the initialized message if successful,
 * otherwise NULL
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
whisper_idl__action__Inference_Result *
whisper_idl__action__Inference_Result__create();

/// Destroy action/Inference message.
/**
 * It calls
 * whisper_idl__action__Inference_Result__fini()
 * and frees the memory of the message.
 * \param[in,out] msg The allocated message pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_Result__destroy(whisper_idl__action__Inference_Result * msg);

/// Check for action/Inference message equality.
/**
 * \param[in] lhs The message on the left hand size of the equality operator.
 * \param[in] rhs The message on the right hand size of the equality operator.
 * \return true if messages are equal, otherwise false.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_Result__are_equal(const whisper_idl__action__Inference_Result * lhs, const whisper_idl__action__Inference_Result * rhs);

/// Copy a action/Inference message.
/**
 * This functions performs a deep copy, as opposed to the shallow copy that
 * plain assignment yields.
 *
 * \param[in] input The source message pointer.
 * \param[out] output The target message pointer, which must
 *   have been initialized before calling this function.
 * \return true if successful, or false if either pointer is null
 *   or memory allocation fails.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_Result__copy(
  const whisper_idl__action__Inference_Result * input,
  whisper_idl__action__Inference_Result * output);

/// Initialize array of action/Inference messages.
/**
 * It allocates the memory for the number of elements and calls
 * whisper_idl__action__Inference_Result__init()
 * for each element of the array.
 * \param[in,out] array The allocated array pointer.
 * \param[in] size The size / capacity of the array.
 * \return true if initialization was successful, otherwise false
 * If the array pointer is valid and the size is zero it is guaranteed
 # to return true.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_Result__Sequence__init(whisper_idl__action__Inference_Result__Sequence * array, size_t size);

/// Finalize array of action/Inference messages.
/**
 * It calls
 * whisper_idl__action__Inference_Result__fini()
 * for each element of the array and frees the memory for the number of
 * elements.
 * \param[in,out] array The initialized array pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_Result__Sequence__fini(whisper_idl__action__Inference_Result__Sequence * array);

/// Create array of action/Inference messages.
/**
 * It allocates the memory for the array and calls
 * whisper_idl__action__Inference_Result__Sequence__init().
 * \param[in] size The size / capacity of the array.
 * \return The pointer to the initialized array if successful, otherwise NULL
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
whisper_idl__action__Inference_Result__Sequence *
whisper_idl__action__Inference_Result__Sequence__create(size_t size);

/// Destroy array of action/Inference messages.
/**
 * It calls
 * whisper_idl__action__Inference_Result__Sequence__fini()
 * on the array,
 * and frees the memory of the array.
 * \param[in,out] array The initialized array pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_Result__Sequence__destroy(whisper_idl__action__Inference_Result__Sequence * array);

/// Check for action/Inference message array equality.
/**
 * \param[in] lhs The message array on the left hand size of the equality operator.
 * \param[in] rhs The message array on the right hand size of the equality operator.
 * \return true if message arrays are equal in size and content, otherwise false.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_Result__Sequence__are_equal(const whisper_idl__action__Inference_Result__Sequence * lhs, const whisper_idl__action__Inference_Result__Sequence * rhs);

/// Copy an array of action/Inference messages.
/**
 * This functions performs a deep copy, as opposed to the shallow copy that
 * plain assignment yields.
 *
 * \param[in] input The source array pointer.
 * \param[out] output The target array pointer, which must
 *   have been initialized before calling this function.
 * \return true if successful, or false if either pointer
 *   is null or memory allocation fails.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_Result__Sequence__copy(
  const whisper_idl__action__Inference_Result__Sequence * input,
  whisper_idl__action__Inference_Result__Sequence * output);

/// Initialize action/Inference message.
/**
 * If the init function is called twice for the same message without
 * calling fini inbetween previously allocated memory will be leaked.
 * \param[in,out] msg The previously allocated message pointer.
 * Fields without a default value will not be initialized by this function.
 * You might want to call memset(msg, 0, sizeof(
 * whisper_idl__action__Inference_Feedback
 * )) before or use
 * whisper_idl__action__Inference_Feedback__create()
 * to allocate and initialize the message.
 * \return true if initialization was successful, otherwise false
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_Feedback__init(whisper_idl__action__Inference_Feedback * msg);

/// Finalize action/Inference message.
/**
 * \param[in,out] msg The allocated message pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_Feedback__fini(whisper_idl__action__Inference_Feedback * msg);

/// Create action/Inference message.
/**
 * It allocates the memory for the message, sets the memory to zero, and
 * calls
 * whisper_idl__action__Inference_Feedback__init().
 * \return The pointer to the initialized message if successful,
 * otherwise NULL
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
whisper_idl__action__Inference_Feedback *
whisper_idl__action__Inference_Feedback__create();

/// Destroy action/Inference message.
/**
 * It calls
 * whisper_idl__action__Inference_Feedback__fini()
 * and frees the memory of the message.
 * \param[in,out] msg The allocated message pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_Feedback__destroy(whisper_idl__action__Inference_Feedback * msg);

/// Check for action/Inference message equality.
/**
 * \param[in] lhs The message on the left hand size of the equality operator.
 * \param[in] rhs The message on the right hand size of the equality operator.
 * \return true if messages are equal, otherwise false.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_Feedback__are_equal(const whisper_idl__action__Inference_Feedback * lhs, const whisper_idl__action__Inference_Feedback * rhs);

/// Copy a action/Inference message.
/**
 * This functions performs a deep copy, as opposed to the shallow copy that
 * plain assignment yields.
 *
 * \param[in] input The source message pointer.
 * \param[out] output The target message pointer, which must
 *   have been initialized before calling this function.
 * \return true if successful, or false if either pointer is null
 *   or memory allocation fails.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_Feedback__copy(
  const whisper_idl__action__Inference_Feedback * input,
  whisper_idl__action__Inference_Feedback * output);

/// Initialize array of action/Inference messages.
/**
 * It allocates the memory for the number of elements and calls
 * whisper_idl__action__Inference_Feedback__init()
 * for each element of the array.
 * \param[in,out] array The allocated array pointer.
 * \param[in] size The size / capacity of the array.
 * \return true if initialization was successful, otherwise false
 * If the array pointer is valid and the size is zero it is guaranteed
 # to return true.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_Feedback__Sequence__init(whisper_idl__action__Inference_Feedback__Sequence * array, size_t size);

/// Finalize array of action/Inference messages.
/**
 * It calls
 * whisper_idl__action__Inference_Feedback__fini()
 * for each element of the array and frees the memory for the number of
 * elements.
 * \param[in,out] array The initialized array pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_Feedback__Sequence__fini(whisper_idl__action__Inference_Feedback__Sequence * array);

/// Create array of action/Inference messages.
/**
 * It allocates the memory for the array and calls
 * whisper_idl__action__Inference_Feedback__Sequence__init().
 * \param[in] size The size / capacity of the array.
 * \return The pointer to the initialized array if successful, otherwise NULL
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
whisper_idl__action__Inference_Feedback__Sequence *
whisper_idl__action__Inference_Feedback__Sequence__create(size_t size);

/// Destroy array of action/Inference messages.
/**
 * It calls
 * whisper_idl__action__Inference_Feedback__Sequence__fini()
 * on the array,
 * and frees the memory of the array.
 * \param[in,out] array The initialized array pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_Feedback__Sequence__destroy(whisper_idl__action__Inference_Feedback__Sequence * array);

/// Check for action/Inference message array equality.
/**
 * \param[in] lhs The message array on the left hand size of the equality operator.
 * \param[in] rhs The message array on the right hand size of the equality operator.
 * \return true if message arrays are equal in size and content, otherwise false.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_Feedback__Sequence__are_equal(const whisper_idl__action__Inference_Feedback__Sequence * lhs, const whisper_idl__action__Inference_Feedback__Sequence * rhs);

/// Copy an array of action/Inference messages.
/**
 * This functions performs a deep copy, as opposed to the shallow copy that
 * plain assignment yields.
 *
 * \param[in] input The source array pointer.
 * \param[out] output The target array pointer, which must
 *   have been initialized before calling this function.
 * \return true if successful, or false if either pointer
 *   is null or memory allocation fails.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_Feedback__Sequence__copy(
  const whisper_idl__action__Inference_Feedback__Sequence * input,
  whisper_idl__action__Inference_Feedback__Sequence * output);

/// Initialize action/Inference message.
/**
 * If the init function is called twice for the same message without
 * calling fini inbetween previously allocated memory will be leaked.
 * \param[in,out] msg The previously allocated message pointer.
 * Fields without a default value will not be initialized by this function.
 * You might want to call memset(msg, 0, sizeof(
 * whisper_idl__action__Inference_SendGoal_Request
 * )) before or use
 * whisper_idl__action__Inference_SendGoal_Request__create()
 * to allocate and initialize the message.
 * \return true if initialization was successful, otherwise false
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_SendGoal_Request__init(whisper_idl__action__Inference_SendGoal_Request * msg);

/// Finalize action/Inference message.
/**
 * \param[in,out] msg The allocated message pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_SendGoal_Request__fini(whisper_idl__action__Inference_SendGoal_Request * msg);

/// Create action/Inference message.
/**
 * It allocates the memory for the message, sets the memory to zero, and
 * calls
 * whisper_idl__action__Inference_SendGoal_Request__init().
 * \return The pointer to the initialized message if successful,
 * otherwise NULL
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
whisper_idl__action__Inference_SendGoal_Request *
whisper_idl__action__Inference_SendGoal_Request__create();

/// Destroy action/Inference message.
/**
 * It calls
 * whisper_idl__action__Inference_SendGoal_Request__fini()
 * and frees the memory of the message.
 * \param[in,out] msg The allocated message pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_SendGoal_Request__destroy(whisper_idl__action__Inference_SendGoal_Request * msg);

/// Check for action/Inference message equality.
/**
 * \param[in] lhs The message on the left hand size of the equality operator.
 * \param[in] rhs The message on the right hand size of the equality operator.
 * \return true if messages are equal, otherwise false.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_SendGoal_Request__are_equal(const whisper_idl__action__Inference_SendGoal_Request * lhs, const whisper_idl__action__Inference_SendGoal_Request * rhs);

/// Copy a action/Inference message.
/**
 * This functions performs a deep copy, as opposed to the shallow copy that
 * plain assignment yields.
 *
 * \param[in] input The source message pointer.
 * \param[out] output The target message pointer, which must
 *   have been initialized before calling this function.
 * \return true if successful, or false if either pointer is null
 *   or memory allocation fails.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_SendGoal_Request__copy(
  const whisper_idl__action__Inference_SendGoal_Request * input,
  whisper_idl__action__Inference_SendGoal_Request * output);

/// Initialize array of action/Inference messages.
/**
 * It allocates the memory for the number of elements and calls
 * whisper_idl__action__Inference_SendGoal_Request__init()
 * for each element of the array.
 * \param[in,out] array The allocated array pointer.
 * \param[in] size The size / capacity of the array.
 * \return true if initialization was successful, otherwise false
 * If the array pointer is valid and the size is zero it is guaranteed
 # to return true.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_SendGoal_Request__Sequence__init(whisper_idl__action__Inference_SendGoal_Request__Sequence * array, size_t size);

/// Finalize array of action/Inference messages.
/**
 * It calls
 * whisper_idl__action__Inference_SendGoal_Request__fini()
 * for each element of the array and frees the memory for the number of
 * elements.
 * \param[in,out] array The initialized array pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_SendGoal_Request__Sequence__fini(whisper_idl__action__Inference_SendGoal_Request__Sequence * array);

/// Create array of action/Inference messages.
/**
 * It allocates the memory for the array and calls
 * whisper_idl__action__Inference_SendGoal_Request__Sequence__init().
 * \param[in] size The size / capacity of the array.
 * \return The pointer to the initialized array if successful, otherwise NULL
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
whisper_idl__action__Inference_SendGoal_Request__Sequence *
whisper_idl__action__Inference_SendGoal_Request__Sequence__create(size_t size);

/// Destroy array of action/Inference messages.
/**
 * It calls
 * whisper_idl__action__Inference_SendGoal_Request__Sequence__fini()
 * on the array,
 * and frees the memory of the array.
 * \param[in,out] array The initialized array pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_SendGoal_Request__Sequence__destroy(whisper_idl__action__Inference_SendGoal_Request__Sequence * array);

/// Check for action/Inference message array equality.
/**
 * \param[in] lhs The message array on the left hand size of the equality operator.
 * \param[in] rhs The message array on the right hand size of the equality operator.
 * \return true if message arrays are equal in size and content, otherwise false.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_SendGoal_Request__Sequence__are_equal(const whisper_idl__action__Inference_SendGoal_Request__Sequence * lhs, const whisper_idl__action__Inference_SendGoal_Request__Sequence * rhs);

/// Copy an array of action/Inference messages.
/**
 * This functions performs a deep copy, as opposed to the shallow copy that
 * plain assignment yields.
 *
 * \param[in] input The source array pointer.
 * \param[out] output The target array pointer, which must
 *   have been initialized before calling this function.
 * \return true if successful, or false if either pointer
 *   is null or memory allocation fails.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_SendGoal_Request__Sequence__copy(
  const whisper_idl__action__Inference_SendGoal_Request__Sequence * input,
  whisper_idl__action__Inference_SendGoal_Request__Sequence * output);

/// Initialize action/Inference message.
/**
 * If the init function is called twice for the same message without
 * calling fini inbetween previously allocated memory will be leaked.
 * \param[in,out] msg The previously allocated message pointer.
 * Fields without a default value will not be initialized by this function.
 * You might want to call memset(msg, 0, sizeof(
 * whisper_idl__action__Inference_SendGoal_Response
 * )) before or use
 * whisper_idl__action__Inference_SendGoal_Response__create()
 * to allocate and initialize the message.
 * \return true if initialization was successful, otherwise false
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_SendGoal_Response__init(whisper_idl__action__Inference_SendGoal_Response * msg);

/// Finalize action/Inference message.
/**
 * \param[in,out] msg The allocated message pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_SendGoal_Response__fini(whisper_idl__action__Inference_SendGoal_Response * msg);

/// Create action/Inference message.
/**
 * It allocates the memory for the message, sets the memory to zero, and
 * calls
 * whisper_idl__action__Inference_SendGoal_Response__init().
 * \return The pointer to the initialized message if successful,
 * otherwise NULL
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
whisper_idl__action__Inference_SendGoal_Response *
whisper_idl__action__Inference_SendGoal_Response__create();

/// Destroy action/Inference message.
/**
 * It calls
 * whisper_idl__action__Inference_SendGoal_Response__fini()
 * and frees the memory of the message.
 * \param[in,out] msg The allocated message pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_SendGoal_Response__destroy(whisper_idl__action__Inference_SendGoal_Response * msg);

/// Check for action/Inference message equality.
/**
 * \param[in] lhs The message on the left hand size of the equality operator.
 * \param[in] rhs The message on the right hand size of the equality operator.
 * \return true if messages are equal, otherwise false.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_SendGoal_Response__are_equal(const whisper_idl__action__Inference_SendGoal_Response * lhs, const whisper_idl__action__Inference_SendGoal_Response * rhs);

/// Copy a action/Inference message.
/**
 * This functions performs a deep copy, as opposed to the shallow copy that
 * plain assignment yields.
 *
 * \param[in] input The source message pointer.
 * \param[out] output The target message pointer, which must
 *   have been initialized before calling this function.
 * \return true if successful, or false if either pointer is null
 *   or memory allocation fails.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_SendGoal_Response__copy(
  const whisper_idl__action__Inference_SendGoal_Response * input,
  whisper_idl__action__Inference_SendGoal_Response * output);

/// Initialize array of action/Inference messages.
/**
 * It allocates the memory for the number of elements and calls
 * whisper_idl__action__Inference_SendGoal_Response__init()
 * for each element of the array.
 * \param[in,out] array The allocated array pointer.
 * \param[in] size The size / capacity of the array.
 * \return true if initialization was successful, otherwise false
 * If the array pointer is valid and the size is zero it is guaranteed
 # to return true.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_SendGoal_Response__Sequence__init(whisper_idl__action__Inference_SendGoal_Response__Sequence * array, size_t size);

/// Finalize array of action/Inference messages.
/**
 * It calls
 * whisper_idl__action__Inference_SendGoal_Response__fini()
 * for each element of the array and frees the memory for the number of
 * elements.
 * \param[in,out] array The initialized array pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_SendGoal_Response__Sequence__fini(whisper_idl__action__Inference_SendGoal_Response__Sequence * array);

/// Create array of action/Inference messages.
/**
 * It allocates the memory for the array and calls
 * whisper_idl__action__Inference_SendGoal_Response__Sequence__init().
 * \param[in] size The size / capacity of the array.
 * \return The pointer to the initialized array if successful, otherwise NULL
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
whisper_idl__action__Inference_SendGoal_Response__Sequence *
whisper_idl__action__Inference_SendGoal_Response__Sequence__create(size_t size);

/// Destroy array of action/Inference messages.
/**
 * It calls
 * whisper_idl__action__Inference_SendGoal_Response__Sequence__fini()
 * on the array,
 * and frees the memory of the array.
 * \param[in,out] array The initialized array pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_SendGoal_Response__Sequence__destroy(whisper_idl__action__Inference_SendGoal_Response__Sequence * array);

/// Check for action/Inference message array equality.
/**
 * \param[in] lhs The message array on the left hand size of the equality operator.
 * \param[in] rhs The message array on the right hand size of the equality operator.
 * \return true if message arrays are equal in size and content, otherwise false.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_SendGoal_Response__Sequence__are_equal(const whisper_idl__action__Inference_SendGoal_Response__Sequence * lhs, const whisper_idl__action__Inference_SendGoal_Response__Sequence * rhs);

/// Copy an array of action/Inference messages.
/**
 * This functions performs a deep copy, as opposed to the shallow copy that
 * plain assignment yields.
 *
 * \param[in] input The source array pointer.
 * \param[out] output The target array pointer, which must
 *   have been initialized before calling this function.
 * \return true if successful, or false if either pointer
 *   is null or memory allocation fails.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_SendGoal_Response__Sequence__copy(
  const whisper_idl__action__Inference_SendGoal_Response__Sequence * input,
  whisper_idl__action__Inference_SendGoal_Response__Sequence * output);

/// Initialize action/Inference message.
/**
 * If the init function is called twice for the same message without
 * calling fini inbetween previously allocated memory will be leaked.
 * \param[in,out] msg The previously allocated message pointer.
 * Fields without a default value will not be initialized by this function.
 * You might want to call memset(msg, 0, sizeof(
 * whisper_idl__action__Inference_GetResult_Request
 * )) before or use
 * whisper_idl__action__Inference_GetResult_Request__create()
 * to allocate and initialize the message.
 * \return true if initialization was successful, otherwise false
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_GetResult_Request__init(whisper_idl__action__Inference_GetResult_Request * msg);

/// Finalize action/Inference message.
/**
 * \param[in,out] msg The allocated message pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_GetResult_Request__fini(whisper_idl__action__Inference_GetResult_Request * msg);

/// Create action/Inference message.
/**
 * It allocates the memory for the message, sets the memory to zero, and
 * calls
 * whisper_idl__action__Inference_GetResult_Request__init().
 * \return The pointer to the initialized message if successful,
 * otherwise NULL
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
whisper_idl__action__Inference_GetResult_Request *
whisper_idl__action__Inference_GetResult_Request__create();

/// Destroy action/Inference message.
/**
 * It calls
 * whisper_idl__action__Inference_GetResult_Request__fini()
 * and frees the memory of the message.
 * \param[in,out] msg The allocated message pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_GetResult_Request__destroy(whisper_idl__action__Inference_GetResult_Request * msg);

/// Check for action/Inference message equality.
/**
 * \param[in] lhs The message on the left hand size of the equality operator.
 * \param[in] rhs The message on the right hand size of the equality operator.
 * \return true if messages are equal, otherwise false.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_GetResult_Request__are_equal(const whisper_idl__action__Inference_GetResult_Request * lhs, const whisper_idl__action__Inference_GetResult_Request * rhs);

/// Copy a action/Inference message.
/**
 * This functions performs a deep copy, as opposed to the shallow copy that
 * plain assignment yields.
 *
 * \param[in] input The source message pointer.
 * \param[out] output The target message pointer, which must
 *   have been initialized before calling this function.
 * \return true if successful, or false if either pointer is null
 *   or memory allocation fails.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_GetResult_Request__copy(
  const whisper_idl__action__Inference_GetResult_Request * input,
  whisper_idl__action__Inference_GetResult_Request * output);

/// Initialize array of action/Inference messages.
/**
 * It allocates the memory for the number of elements and calls
 * whisper_idl__action__Inference_GetResult_Request__init()
 * for each element of the array.
 * \param[in,out] array The allocated array pointer.
 * \param[in] size The size / capacity of the array.
 * \return true if initialization was successful, otherwise false
 * If the array pointer is valid and the size is zero it is guaranteed
 # to return true.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_GetResult_Request__Sequence__init(whisper_idl__action__Inference_GetResult_Request__Sequence * array, size_t size);

/// Finalize array of action/Inference messages.
/**
 * It calls
 * whisper_idl__action__Inference_GetResult_Request__fini()
 * for each element of the array and frees the memory for the number of
 * elements.
 * \param[in,out] array The initialized array pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_GetResult_Request__Sequence__fini(whisper_idl__action__Inference_GetResult_Request__Sequence * array);

/// Create array of action/Inference messages.
/**
 * It allocates the memory for the array and calls
 * whisper_idl__action__Inference_GetResult_Request__Sequence__init().
 * \param[in] size The size / capacity of the array.
 * \return The pointer to the initialized array if successful, otherwise NULL
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
whisper_idl__action__Inference_GetResult_Request__Sequence *
whisper_idl__action__Inference_GetResult_Request__Sequence__create(size_t size);

/// Destroy array of action/Inference messages.
/**
 * It calls
 * whisper_idl__action__Inference_GetResult_Request__Sequence__fini()
 * on the array,
 * and frees the memory of the array.
 * \param[in,out] array The initialized array pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_GetResult_Request__Sequence__destroy(whisper_idl__action__Inference_GetResult_Request__Sequence * array);

/// Check for action/Inference message array equality.
/**
 * \param[in] lhs The message array on the left hand size of the equality operator.
 * \param[in] rhs The message array on the right hand size of the equality operator.
 * \return true if message arrays are equal in size and content, otherwise false.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_GetResult_Request__Sequence__are_equal(const whisper_idl__action__Inference_GetResult_Request__Sequence * lhs, const whisper_idl__action__Inference_GetResult_Request__Sequence * rhs);

/// Copy an array of action/Inference messages.
/**
 * This functions performs a deep copy, as opposed to the shallow copy that
 * plain assignment yields.
 *
 * \param[in] input The source array pointer.
 * \param[out] output The target array pointer, which must
 *   have been initialized before calling this function.
 * \return true if successful, or false if either pointer
 *   is null or memory allocation fails.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_GetResult_Request__Sequence__copy(
  const whisper_idl__action__Inference_GetResult_Request__Sequence * input,
  whisper_idl__action__Inference_GetResult_Request__Sequence * output);

/// Initialize action/Inference message.
/**
 * If the init function is called twice for the same message without
 * calling fini inbetween previously allocated memory will be leaked.
 * \param[in,out] msg The previously allocated message pointer.
 * Fields without a default value will not be initialized by this function.
 * You might want to call memset(msg, 0, sizeof(
 * whisper_idl__action__Inference_GetResult_Response
 * )) before or use
 * whisper_idl__action__Inference_GetResult_Response__create()
 * to allocate and initialize the message.
 * \return true if initialization was successful, otherwise false
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_GetResult_Response__init(whisper_idl__action__Inference_GetResult_Response * msg);

/// Finalize action/Inference message.
/**
 * \param[in,out] msg The allocated message pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_GetResult_Response__fini(whisper_idl__action__Inference_GetResult_Response * msg);

/// Create action/Inference message.
/**
 * It allocates the memory for the message, sets the memory to zero, and
 * calls
 * whisper_idl__action__Inference_GetResult_Response__init().
 * \return The pointer to the initialized message if successful,
 * otherwise NULL
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
whisper_idl__action__Inference_GetResult_Response *
whisper_idl__action__Inference_GetResult_Response__create();

/// Destroy action/Inference message.
/**
 * It calls
 * whisper_idl__action__Inference_GetResult_Response__fini()
 * and frees the memory of the message.
 * \param[in,out] msg The allocated message pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_GetResult_Response__destroy(whisper_idl__action__Inference_GetResult_Response * msg);

/// Check for action/Inference message equality.
/**
 * \param[in] lhs The message on the left hand size of the equality operator.
 * \param[in] rhs The message on the right hand size of the equality operator.
 * \return true if messages are equal, otherwise false.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_GetResult_Response__are_equal(const whisper_idl__action__Inference_GetResult_Response * lhs, const whisper_idl__action__Inference_GetResult_Response * rhs);

/// Copy a action/Inference message.
/**
 * This functions performs a deep copy, as opposed to the shallow copy that
 * plain assignment yields.
 *
 * \param[in] input The source message pointer.
 * \param[out] output The target message pointer, which must
 *   have been initialized before calling this function.
 * \return true if successful, or false if either pointer is null
 *   or memory allocation fails.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_GetResult_Response__copy(
  const whisper_idl__action__Inference_GetResult_Response * input,
  whisper_idl__action__Inference_GetResult_Response * output);

/// Initialize array of action/Inference messages.
/**
 * It allocates the memory for the number of elements and calls
 * whisper_idl__action__Inference_GetResult_Response__init()
 * for each element of the array.
 * \param[in,out] array The allocated array pointer.
 * \param[in] size The size / capacity of the array.
 * \return true if initialization was successful, otherwise false
 * If the array pointer is valid and the size is zero it is guaranteed
 # to return true.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_GetResult_Response__Sequence__init(whisper_idl__action__Inference_GetResult_Response__Sequence * array, size_t size);

/// Finalize array of action/Inference messages.
/**
 * It calls
 * whisper_idl__action__Inference_GetResult_Response__fini()
 * for each element of the array and frees the memory for the number of
 * elements.
 * \param[in,out] array The initialized array pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_GetResult_Response__Sequence__fini(whisper_idl__action__Inference_GetResult_Response__Sequence * array);

/// Create array of action/Inference messages.
/**
 * It allocates the memory for the array and calls
 * whisper_idl__action__Inference_GetResult_Response__Sequence__init().
 * \param[in] size The size / capacity of the array.
 * \return The pointer to the initialized array if successful, otherwise NULL
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
whisper_idl__action__Inference_GetResult_Response__Sequence *
whisper_idl__action__Inference_GetResult_Response__Sequence__create(size_t size);

/// Destroy array of action/Inference messages.
/**
 * It calls
 * whisper_idl__action__Inference_GetResult_Response__Sequence__fini()
 * on the array,
 * and frees the memory of the array.
 * \param[in,out] array The initialized array pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_GetResult_Response__Sequence__destroy(whisper_idl__action__Inference_GetResult_Response__Sequence * array);

/// Check for action/Inference message array equality.
/**
 * \param[in] lhs The message array on the left hand size of the equality operator.
 * \param[in] rhs The message array on the right hand size of the equality operator.
 * \return true if message arrays are equal in size and content, otherwise false.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_GetResult_Response__Sequence__are_equal(const whisper_idl__action__Inference_GetResult_Response__Sequence * lhs, const whisper_idl__action__Inference_GetResult_Response__Sequence * rhs);

/// Copy an array of action/Inference messages.
/**
 * This functions performs a deep copy, as opposed to the shallow copy that
 * plain assignment yields.
 *
 * \param[in] input The source array pointer.
 * \param[out] output The target array pointer, which must
 *   have been initialized before calling this function.
 * \return true if successful, or false if either pointer
 *   is null or memory allocation fails.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_GetResult_Response__Sequence__copy(
  const whisper_idl__action__Inference_GetResult_Response__Sequence * input,
  whisper_idl__action__Inference_GetResult_Response__Sequence * output);

/// Initialize action/Inference message.
/**
 * If the init function is called twice for the same message without
 * calling fini inbetween previously allocated memory will be leaked.
 * \param[in,out] msg The previously allocated message pointer.
 * Fields without a default value will not be initialized by this function.
 * You might want to call memset(msg, 0, sizeof(
 * whisper_idl__action__Inference_FeedbackMessage
 * )) before or use
 * whisper_idl__action__Inference_FeedbackMessage__create()
 * to allocate and initialize the message.
 * \return true if initialization was successful, otherwise false
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_FeedbackMessage__init(whisper_idl__action__Inference_FeedbackMessage * msg);

/// Finalize action/Inference message.
/**
 * \param[in,out] msg The allocated message pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_FeedbackMessage__fini(whisper_idl__action__Inference_FeedbackMessage * msg);

/// Create action/Inference message.
/**
 * It allocates the memory for the message, sets the memory to zero, and
 * calls
 * whisper_idl__action__Inference_FeedbackMessage__init().
 * \return The pointer to the initialized message if successful,
 * otherwise NULL
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
whisper_idl__action__Inference_FeedbackMessage *
whisper_idl__action__Inference_FeedbackMessage__create();

/// Destroy action/Inference message.
/**
 * It calls
 * whisper_idl__action__Inference_FeedbackMessage__fini()
 * and frees the memory of the message.
 * \param[in,out] msg The allocated message pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_FeedbackMessage__destroy(whisper_idl__action__Inference_FeedbackMessage * msg);

/// Check for action/Inference message equality.
/**
 * \param[in] lhs The message on the left hand size of the equality operator.
 * \param[in] rhs The message on the right hand size of the equality operator.
 * \return true if messages are equal, otherwise false.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_FeedbackMessage__are_equal(const whisper_idl__action__Inference_FeedbackMessage * lhs, const whisper_idl__action__Inference_FeedbackMessage * rhs);

/// Copy a action/Inference message.
/**
 * This functions performs a deep copy, as opposed to the shallow copy that
 * plain assignment yields.
 *
 * \param[in] input The source message pointer.
 * \param[out] output The target message pointer, which must
 *   have been initialized before calling this function.
 * \return true if successful, or false if either pointer is null
 *   or memory allocation fails.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_FeedbackMessage__copy(
  const whisper_idl__action__Inference_FeedbackMessage * input,
  whisper_idl__action__Inference_FeedbackMessage * output);

/// Initialize array of action/Inference messages.
/**
 * It allocates the memory for the number of elements and calls
 * whisper_idl__action__Inference_FeedbackMessage__init()
 * for each element of the array.
 * \param[in,out] array The allocated array pointer.
 * \param[in] size The size / capacity of the array.
 * \return true if initialization was successful, otherwise false
 * If the array pointer is valid and the size is zero it is guaranteed
 # to return true.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_FeedbackMessage__Sequence__init(whisper_idl__action__Inference_FeedbackMessage__Sequence * array, size_t size);

/// Finalize array of action/Inference messages.
/**
 * It calls
 * whisper_idl__action__Inference_FeedbackMessage__fini()
 * for each element of the array and frees the memory for the number of
 * elements.
 * \param[in,out] array The initialized array pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_FeedbackMessage__Sequence__fini(whisper_idl__action__Inference_FeedbackMessage__Sequence * array);

/// Create array of action/Inference messages.
/**
 * It allocates the memory for the array and calls
 * whisper_idl__action__Inference_FeedbackMessage__Sequence__init().
 * \param[in] size The size / capacity of the array.
 * \return The pointer to the initialized array if successful, otherwise NULL
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
whisper_idl__action__Inference_FeedbackMessage__Sequence *
whisper_idl__action__Inference_FeedbackMessage__Sequence__create(size_t size);

/// Destroy array of action/Inference messages.
/**
 * It calls
 * whisper_idl__action__Inference_FeedbackMessage__Sequence__fini()
 * on the array,
 * and frees the memory of the array.
 * \param[in,out] array The initialized array pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__action__Inference_FeedbackMessage__Sequence__destroy(whisper_idl__action__Inference_FeedbackMessage__Sequence * array);

/// Check for action/Inference message array equality.
/**
 * \param[in] lhs The message array on the left hand size of the equality operator.
 * \param[in] rhs The message array on the right hand size of the equality operator.
 * \return true if message arrays are equal in size and content, otherwise false.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_FeedbackMessage__Sequence__are_equal(const whisper_idl__action__Inference_FeedbackMessage__Sequence * lhs, const whisper_idl__action__Inference_FeedbackMessage__Sequence * rhs);

/// Copy an array of action/Inference messages.
/**
 * This functions performs a deep copy, as opposed to the shallow copy that
 * plain assignment yields.
 *
 * \param[in] input The source array pointer.
 * \param[out] output The target array pointer, which must
 *   have been initialized before calling this function.
 * \return true if successful, or false if either pointer
 *   is null or memory allocation fails.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__action__Inference_FeedbackMessage__Sequence__copy(
  const whisper_idl__action__Inference_FeedbackMessage__Sequence * input,
  whisper_idl__action__Inference_FeedbackMessage__Sequence * output);

#ifdef __cplusplus
}
#endif

#endif  // WHISPER_IDL__ACTION__DETAIL__INFERENCE__FUNCTIONS_H_
