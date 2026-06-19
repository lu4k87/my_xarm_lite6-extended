// generated from rosidl_generator_c/resource/idl__functions.h.em
// with input from whisper_idl:msg/WhisperTokens.idl
// generated code does not contain a copyright notice

#ifndef WHISPER_IDL__MSG__DETAIL__WHISPER_TOKENS__FUNCTIONS_H_
#define WHISPER_IDL__MSG__DETAIL__WHISPER_TOKENS__FUNCTIONS_H_

#ifdef __cplusplus
extern "C"
{
#endif

#include <stdbool.h>
#include <stdlib.h>

#include "rosidl_runtime_c/visibility_control.h"
#include "whisper_idl/msg/rosidl_generator_c__visibility_control.h"

#include "whisper_idl/msg/detail/whisper_tokens__struct.h"

/// Initialize msg/WhisperTokens message.
/**
 * If the init function is called twice for the same message without
 * calling fini inbetween previously allocated memory will be leaked.
 * \param[in,out] msg The previously allocated message pointer.
 * Fields without a default value will not be initialized by this function.
 * You might want to call memset(msg, 0, sizeof(
 * whisper_idl__msg__WhisperTokens
 * )) before or use
 * whisper_idl__msg__WhisperTokens__create()
 * to allocate and initialize the message.
 * \return true if initialization was successful, otherwise false
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__msg__WhisperTokens__init(whisper_idl__msg__WhisperTokens * msg);

/// Finalize msg/WhisperTokens message.
/**
 * \param[in,out] msg The allocated message pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__msg__WhisperTokens__fini(whisper_idl__msg__WhisperTokens * msg);

/// Create msg/WhisperTokens message.
/**
 * It allocates the memory for the message, sets the memory to zero, and
 * calls
 * whisper_idl__msg__WhisperTokens__init().
 * \return The pointer to the initialized message if successful,
 * otherwise NULL
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
whisper_idl__msg__WhisperTokens *
whisper_idl__msg__WhisperTokens__create();

/// Destroy msg/WhisperTokens message.
/**
 * It calls
 * whisper_idl__msg__WhisperTokens__fini()
 * and frees the memory of the message.
 * \param[in,out] msg The allocated message pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__msg__WhisperTokens__destroy(whisper_idl__msg__WhisperTokens * msg);

/// Check for msg/WhisperTokens message equality.
/**
 * \param[in] lhs The message on the left hand size of the equality operator.
 * \param[in] rhs The message on the right hand size of the equality operator.
 * \return true if messages are equal, otherwise false.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__msg__WhisperTokens__are_equal(const whisper_idl__msg__WhisperTokens * lhs, const whisper_idl__msg__WhisperTokens * rhs);

/// Copy a msg/WhisperTokens message.
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
whisper_idl__msg__WhisperTokens__copy(
  const whisper_idl__msg__WhisperTokens * input,
  whisper_idl__msg__WhisperTokens * output);

/// Initialize array of msg/WhisperTokens messages.
/**
 * It allocates the memory for the number of elements and calls
 * whisper_idl__msg__WhisperTokens__init()
 * for each element of the array.
 * \param[in,out] array The allocated array pointer.
 * \param[in] size The size / capacity of the array.
 * \return true if initialization was successful, otherwise false
 * If the array pointer is valid and the size is zero it is guaranteed
 # to return true.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__msg__WhisperTokens__Sequence__init(whisper_idl__msg__WhisperTokens__Sequence * array, size_t size);

/// Finalize array of msg/WhisperTokens messages.
/**
 * It calls
 * whisper_idl__msg__WhisperTokens__fini()
 * for each element of the array and frees the memory for the number of
 * elements.
 * \param[in,out] array The initialized array pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__msg__WhisperTokens__Sequence__fini(whisper_idl__msg__WhisperTokens__Sequence * array);

/// Create array of msg/WhisperTokens messages.
/**
 * It allocates the memory for the array and calls
 * whisper_idl__msg__WhisperTokens__Sequence__init().
 * \param[in] size The size / capacity of the array.
 * \return The pointer to the initialized array if successful, otherwise NULL
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
whisper_idl__msg__WhisperTokens__Sequence *
whisper_idl__msg__WhisperTokens__Sequence__create(size_t size);

/// Destroy array of msg/WhisperTokens messages.
/**
 * It calls
 * whisper_idl__msg__WhisperTokens__Sequence__fini()
 * on the array,
 * and frees the memory of the array.
 * \param[in,out] array The initialized array pointer.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
void
whisper_idl__msg__WhisperTokens__Sequence__destroy(whisper_idl__msg__WhisperTokens__Sequence * array);

/// Check for msg/WhisperTokens message array equality.
/**
 * \param[in] lhs The message array on the left hand size of the equality operator.
 * \param[in] rhs The message array on the right hand size of the equality operator.
 * \return true if message arrays are equal in size and content, otherwise false.
 */
ROSIDL_GENERATOR_C_PUBLIC_whisper_idl
bool
whisper_idl__msg__WhisperTokens__Sequence__are_equal(const whisper_idl__msg__WhisperTokens__Sequence * lhs, const whisper_idl__msg__WhisperTokens__Sequence * rhs);

/// Copy an array of msg/WhisperTokens messages.
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
whisper_idl__msg__WhisperTokens__Sequence__copy(
  const whisper_idl__msg__WhisperTokens__Sequence * input,
  whisper_idl__msg__WhisperTokens__Sequence * output);

#ifdef __cplusplus
}
#endif

#endif  // WHISPER_IDL__MSG__DETAIL__WHISPER_TOKENS__FUNCTIONS_H_
