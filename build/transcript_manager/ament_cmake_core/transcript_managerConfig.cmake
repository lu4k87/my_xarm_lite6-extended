# generated from ament/cmake/core/templates/nameConfig.cmake.in

# prevent multiple inclusion
if(_transcript_manager_CONFIG_INCLUDED)
  # ensure to keep the found flag the same
  if(NOT DEFINED transcript_manager_FOUND)
    # explicitly set it to FALSE, otherwise CMake will set it to TRUE
    set(transcript_manager_FOUND FALSE)
  elseif(NOT transcript_manager_FOUND)
    # use separate condition to avoid uninitialized variable warning
    set(transcript_manager_FOUND FALSE)
  endif()
  return()
endif()
set(_transcript_manager_CONFIG_INCLUDED TRUE)

# output package information
if(NOT transcript_manager_FIND_QUIETLY)
  message(STATUS "Found transcript_manager: 1.4.0 (${transcript_manager_DIR})")
endif()

# warn when using a deprecated package
if(NOT "" STREQUAL "")
  set(_msg "Package 'transcript_manager' is deprecated")
  # append custom deprecation text if available
  if(NOT "" STREQUAL "TRUE")
    set(_msg "${_msg} ()")
  endif()
  # optionally quiet the deprecation message
  if(NOT ${transcript_manager_DEPRECATED_QUIET})
    message(DEPRECATION "${_msg}")
  endif()
endif()

# flag package as ament-based to distinguish it after being find_package()-ed
set(transcript_manager_FOUND_AMENT_PACKAGE TRUE)

# include all config extra files
set(_extras "")
foreach(_extra ${_extras})
  include("${transcript_manager_DIR}/${_extra}")
endforeach()
