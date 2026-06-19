#----------------------------------------------------------------
# Generated CMake target import file for configuration "Release".
#----------------------------------------------------------------

# Commands may need to know the format version.
set(CMAKE_IMPORT_FILE_VERSION 1)

# Import target "whisper_cpp_vendor::ggml" for configuration "Release"
set_property(TARGET whisper_cpp_vendor::ggml APPEND PROPERTY IMPORTED_CONFIGURATIONS RELEASE)
set_target_properties(whisper_cpp_vendor::ggml PROPERTIES
  IMPORTED_LOCATION_RELEASE "${_IMPORT_PREFIX}/lib/libggml.so"
  IMPORTED_SONAME_RELEASE "libggml.so"
  )

list(APPEND _IMPORT_CHECK_TARGETS whisper_cpp_vendor::ggml )
list(APPEND _IMPORT_CHECK_FILES_FOR_whisper_cpp_vendor::ggml "${_IMPORT_PREFIX}/lib/libggml.so" )

# Import target "whisper_cpp_vendor::whisper" for configuration "Release"
set_property(TARGET whisper_cpp_vendor::whisper APPEND PROPERTY IMPORTED_CONFIGURATIONS RELEASE)
set_target_properties(whisper_cpp_vendor::whisper PROPERTIES
  IMPORTED_LOCATION_RELEASE "${_IMPORT_PREFIX}/lib/libwhisper.so.1.7.2"
  IMPORTED_SONAME_RELEASE "libwhisper.so.1"
  )

list(APPEND _IMPORT_CHECK_TARGETS whisper_cpp_vendor::whisper )
list(APPEND _IMPORT_CHECK_FILES_FOR_whisper_cpp_vendor::whisper "${_IMPORT_PREFIX}/lib/libwhisper.so.1.7.2" )

# Commands beyond this point should not need to know the version.
set(CMAKE_IMPORT_FILE_VERSION)
