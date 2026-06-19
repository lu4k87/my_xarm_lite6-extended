// generated from rosidl_typesupport_cpp/resource/idl__type_support.cpp.em
// with input from my_3d_vision_bringup:action/GraspObject.idl
// generated code does not contain a copyright notice

#include "cstddef"
#include "rosidl_runtime_c/message_type_support_struct.h"
#include "my_3d_vision_bringup/action/detail/grasp_object__struct.hpp"
#include "rosidl_typesupport_cpp/identifier.hpp"
#include "rosidl_typesupport_cpp/message_type_support.hpp"
#include "rosidl_typesupport_c/type_support_map.h"
#include "rosidl_typesupport_cpp/message_type_support_dispatch.hpp"
#include "rosidl_typesupport_cpp/visibility_control.h"
#include "rosidl_typesupport_interface/macros.h"

namespace my_3d_vision_bringup
{

namespace action
{

namespace rosidl_typesupport_cpp
{

typedef struct _GraspObject_Goal_type_support_ids_t
{
  const char * typesupport_identifier[2];
} _GraspObject_Goal_type_support_ids_t;

static const _GraspObject_Goal_type_support_ids_t _GraspObject_Goal_message_typesupport_ids = {
  {
    "rosidl_typesupport_fastrtps_cpp",  // ::rosidl_typesupport_fastrtps_cpp::typesupport_identifier,
    "rosidl_typesupport_introspection_cpp",  // ::rosidl_typesupport_introspection_cpp::typesupport_identifier,
  }
};

typedef struct _GraspObject_Goal_type_support_symbol_names_t
{
  const char * symbol_name[2];
} _GraspObject_Goal_type_support_symbol_names_t;

#define STRINGIFY_(s) #s
#define STRINGIFY(s) STRINGIFY_(s)

static const _GraspObject_Goal_type_support_symbol_names_t _GraspObject_Goal_message_typesupport_symbol_names = {
  {
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_fastrtps_cpp, my_3d_vision_bringup, action, GraspObject_Goal)),
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_cpp, my_3d_vision_bringup, action, GraspObject_Goal)),
  }
};

typedef struct _GraspObject_Goal_type_support_data_t
{
  void * data[2];
} _GraspObject_Goal_type_support_data_t;

static _GraspObject_Goal_type_support_data_t _GraspObject_Goal_message_typesupport_data = {
  {
    0,  // will store the shared library later
    0,  // will store the shared library later
  }
};

static const type_support_map_t _GraspObject_Goal_message_typesupport_map = {
  2,
  "my_3d_vision_bringup",
  &_GraspObject_Goal_message_typesupport_ids.typesupport_identifier[0],
  &_GraspObject_Goal_message_typesupport_symbol_names.symbol_name[0],
  &_GraspObject_Goal_message_typesupport_data.data[0],
};

static const rosidl_message_type_support_t GraspObject_Goal_message_type_support_handle = {
  ::rosidl_typesupport_cpp::typesupport_identifier,
  reinterpret_cast<const type_support_map_t *>(&_GraspObject_Goal_message_typesupport_map),
  ::rosidl_typesupport_cpp::get_message_typesupport_handle_function,
};

}  // namespace rosidl_typesupport_cpp

}  // namespace action

}  // namespace my_3d_vision_bringup

namespace rosidl_typesupport_cpp
{

template<>
ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
get_message_type_support_handle<my_3d_vision_bringup::action::GraspObject_Goal>()
{
  return &::my_3d_vision_bringup::action::rosidl_typesupport_cpp::GraspObject_Goal_message_type_support_handle;
}

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_cpp, my_3d_vision_bringup, action, GraspObject_Goal)() {
  return get_message_type_support_handle<my_3d_vision_bringup::action::GraspObject_Goal>();
}

#ifdef __cplusplus
}
#endif
}  // namespace rosidl_typesupport_cpp

// already included above
// #include "cstddef"
// already included above
// #include "rosidl_runtime_c/message_type_support_struct.h"
// already included above
// #include "my_3d_vision_bringup/action/detail/grasp_object__struct.hpp"
// already included above
// #include "rosidl_typesupport_cpp/identifier.hpp"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support.hpp"
// already included above
// #include "rosidl_typesupport_c/type_support_map.h"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support_dispatch.hpp"
// already included above
// #include "rosidl_typesupport_cpp/visibility_control.h"
// already included above
// #include "rosidl_typesupport_interface/macros.h"

namespace my_3d_vision_bringup
{

namespace action
{

namespace rosidl_typesupport_cpp
{

typedef struct _GraspObject_Result_type_support_ids_t
{
  const char * typesupport_identifier[2];
} _GraspObject_Result_type_support_ids_t;

static const _GraspObject_Result_type_support_ids_t _GraspObject_Result_message_typesupport_ids = {
  {
    "rosidl_typesupport_fastrtps_cpp",  // ::rosidl_typesupport_fastrtps_cpp::typesupport_identifier,
    "rosidl_typesupport_introspection_cpp",  // ::rosidl_typesupport_introspection_cpp::typesupport_identifier,
  }
};

typedef struct _GraspObject_Result_type_support_symbol_names_t
{
  const char * symbol_name[2];
} _GraspObject_Result_type_support_symbol_names_t;

#define STRINGIFY_(s) #s
#define STRINGIFY(s) STRINGIFY_(s)

static const _GraspObject_Result_type_support_symbol_names_t _GraspObject_Result_message_typesupport_symbol_names = {
  {
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_fastrtps_cpp, my_3d_vision_bringup, action, GraspObject_Result)),
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_cpp, my_3d_vision_bringup, action, GraspObject_Result)),
  }
};

typedef struct _GraspObject_Result_type_support_data_t
{
  void * data[2];
} _GraspObject_Result_type_support_data_t;

static _GraspObject_Result_type_support_data_t _GraspObject_Result_message_typesupport_data = {
  {
    0,  // will store the shared library later
    0,  // will store the shared library later
  }
};

static const type_support_map_t _GraspObject_Result_message_typesupport_map = {
  2,
  "my_3d_vision_bringup",
  &_GraspObject_Result_message_typesupport_ids.typesupport_identifier[0],
  &_GraspObject_Result_message_typesupport_symbol_names.symbol_name[0],
  &_GraspObject_Result_message_typesupport_data.data[0],
};

static const rosidl_message_type_support_t GraspObject_Result_message_type_support_handle = {
  ::rosidl_typesupport_cpp::typesupport_identifier,
  reinterpret_cast<const type_support_map_t *>(&_GraspObject_Result_message_typesupport_map),
  ::rosidl_typesupport_cpp::get_message_typesupport_handle_function,
};

}  // namespace rosidl_typesupport_cpp

}  // namespace action

}  // namespace my_3d_vision_bringup

namespace rosidl_typesupport_cpp
{

template<>
ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
get_message_type_support_handle<my_3d_vision_bringup::action::GraspObject_Result>()
{
  return &::my_3d_vision_bringup::action::rosidl_typesupport_cpp::GraspObject_Result_message_type_support_handle;
}

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_cpp, my_3d_vision_bringup, action, GraspObject_Result)() {
  return get_message_type_support_handle<my_3d_vision_bringup::action::GraspObject_Result>();
}

#ifdef __cplusplus
}
#endif
}  // namespace rosidl_typesupport_cpp

// already included above
// #include "cstddef"
// already included above
// #include "rosidl_runtime_c/message_type_support_struct.h"
// already included above
// #include "my_3d_vision_bringup/action/detail/grasp_object__struct.hpp"
// already included above
// #include "rosidl_typesupport_cpp/identifier.hpp"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support.hpp"
// already included above
// #include "rosidl_typesupport_c/type_support_map.h"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support_dispatch.hpp"
// already included above
// #include "rosidl_typesupport_cpp/visibility_control.h"
// already included above
// #include "rosidl_typesupport_interface/macros.h"

namespace my_3d_vision_bringup
{

namespace action
{

namespace rosidl_typesupport_cpp
{

typedef struct _GraspObject_Feedback_type_support_ids_t
{
  const char * typesupport_identifier[2];
} _GraspObject_Feedback_type_support_ids_t;

static const _GraspObject_Feedback_type_support_ids_t _GraspObject_Feedback_message_typesupport_ids = {
  {
    "rosidl_typesupport_fastrtps_cpp",  // ::rosidl_typesupport_fastrtps_cpp::typesupport_identifier,
    "rosidl_typesupport_introspection_cpp",  // ::rosidl_typesupport_introspection_cpp::typesupport_identifier,
  }
};

typedef struct _GraspObject_Feedback_type_support_symbol_names_t
{
  const char * symbol_name[2];
} _GraspObject_Feedback_type_support_symbol_names_t;

#define STRINGIFY_(s) #s
#define STRINGIFY(s) STRINGIFY_(s)

static const _GraspObject_Feedback_type_support_symbol_names_t _GraspObject_Feedback_message_typesupport_symbol_names = {
  {
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_fastrtps_cpp, my_3d_vision_bringup, action, GraspObject_Feedback)),
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_cpp, my_3d_vision_bringup, action, GraspObject_Feedback)),
  }
};

typedef struct _GraspObject_Feedback_type_support_data_t
{
  void * data[2];
} _GraspObject_Feedback_type_support_data_t;

static _GraspObject_Feedback_type_support_data_t _GraspObject_Feedback_message_typesupport_data = {
  {
    0,  // will store the shared library later
    0,  // will store the shared library later
  }
};

static const type_support_map_t _GraspObject_Feedback_message_typesupport_map = {
  2,
  "my_3d_vision_bringup",
  &_GraspObject_Feedback_message_typesupport_ids.typesupport_identifier[0],
  &_GraspObject_Feedback_message_typesupport_symbol_names.symbol_name[0],
  &_GraspObject_Feedback_message_typesupport_data.data[0],
};

static const rosidl_message_type_support_t GraspObject_Feedback_message_type_support_handle = {
  ::rosidl_typesupport_cpp::typesupport_identifier,
  reinterpret_cast<const type_support_map_t *>(&_GraspObject_Feedback_message_typesupport_map),
  ::rosidl_typesupport_cpp::get_message_typesupport_handle_function,
};

}  // namespace rosidl_typesupport_cpp

}  // namespace action

}  // namespace my_3d_vision_bringup

namespace rosidl_typesupport_cpp
{

template<>
ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
get_message_type_support_handle<my_3d_vision_bringup::action::GraspObject_Feedback>()
{
  return &::my_3d_vision_bringup::action::rosidl_typesupport_cpp::GraspObject_Feedback_message_type_support_handle;
}

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_cpp, my_3d_vision_bringup, action, GraspObject_Feedback)() {
  return get_message_type_support_handle<my_3d_vision_bringup::action::GraspObject_Feedback>();
}

#ifdef __cplusplus
}
#endif
}  // namespace rosidl_typesupport_cpp

// already included above
// #include "cstddef"
// already included above
// #include "rosidl_runtime_c/message_type_support_struct.h"
// already included above
// #include "my_3d_vision_bringup/action/detail/grasp_object__struct.hpp"
// already included above
// #include "rosidl_typesupport_cpp/identifier.hpp"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support.hpp"
// already included above
// #include "rosidl_typesupport_c/type_support_map.h"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support_dispatch.hpp"
// already included above
// #include "rosidl_typesupport_cpp/visibility_control.h"
// already included above
// #include "rosidl_typesupport_interface/macros.h"

namespace my_3d_vision_bringup
{

namespace action
{

namespace rosidl_typesupport_cpp
{

typedef struct _GraspObject_SendGoal_Request_type_support_ids_t
{
  const char * typesupport_identifier[2];
} _GraspObject_SendGoal_Request_type_support_ids_t;

static const _GraspObject_SendGoal_Request_type_support_ids_t _GraspObject_SendGoal_Request_message_typesupport_ids = {
  {
    "rosidl_typesupport_fastrtps_cpp",  // ::rosidl_typesupport_fastrtps_cpp::typesupport_identifier,
    "rosidl_typesupport_introspection_cpp",  // ::rosidl_typesupport_introspection_cpp::typesupport_identifier,
  }
};

typedef struct _GraspObject_SendGoal_Request_type_support_symbol_names_t
{
  const char * symbol_name[2];
} _GraspObject_SendGoal_Request_type_support_symbol_names_t;

#define STRINGIFY_(s) #s
#define STRINGIFY(s) STRINGIFY_(s)

static const _GraspObject_SendGoal_Request_type_support_symbol_names_t _GraspObject_SendGoal_Request_message_typesupport_symbol_names = {
  {
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_fastrtps_cpp, my_3d_vision_bringup, action, GraspObject_SendGoal_Request)),
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_cpp, my_3d_vision_bringup, action, GraspObject_SendGoal_Request)),
  }
};

typedef struct _GraspObject_SendGoal_Request_type_support_data_t
{
  void * data[2];
} _GraspObject_SendGoal_Request_type_support_data_t;

static _GraspObject_SendGoal_Request_type_support_data_t _GraspObject_SendGoal_Request_message_typesupport_data = {
  {
    0,  // will store the shared library later
    0,  // will store the shared library later
  }
};

static const type_support_map_t _GraspObject_SendGoal_Request_message_typesupport_map = {
  2,
  "my_3d_vision_bringup",
  &_GraspObject_SendGoal_Request_message_typesupport_ids.typesupport_identifier[0],
  &_GraspObject_SendGoal_Request_message_typesupport_symbol_names.symbol_name[0],
  &_GraspObject_SendGoal_Request_message_typesupport_data.data[0],
};

static const rosidl_message_type_support_t GraspObject_SendGoal_Request_message_type_support_handle = {
  ::rosidl_typesupport_cpp::typesupport_identifier,
  reinterpret_cast<const type_support_map_t *>(&_GraspObject_SendGoal_Request_message_typesupport_map),
  ::rosidl_typesupport_cpp::get_message_typesupport_handle_function,
};

}  // namespace rosidl_typesupport_cpp

}  // namespace action

}  // namespace my_3d_vision_bringup

namespace rosidl_typesupport_cpp
{

template<>
ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
get_message_type_support_handle<my_3d_vision_bringup::action::GraspObject_SendGoal_Request>()
{
  return &::my_3d_vision_bringup::action::rosidl_typesupport_cpp::GraspObject_SendGoal_Request_message_type_support_handle;
}

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_cpp, my_3d_vision_bringup, action, GraspObject_SendGoal_Request)() {
  return get_message_type_support_handle<my_3d_vision_bringup::action::GraspObject_SendGoal_Request>();
}

#ifdef __cplusplus
}
#endif
}  // namespace rosidl_typesupport_cpp

// already included above
// #include "cstddef"
// already included above
// #include "rosidl_runtime_c/message_type_support_struct.h"
// already included above
// #include "my_3d_vision_bringup/action/detail/grasp_object__struct.hpp"
// already included above
// #include "rosidl_typesupport_cpp/identifier.hpp"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support.hpp"
// already included above
// #include "rosidl_typesupport_c/type_support_map.h"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support_dispatch.hpp"
// already included above
// #include "rosidl_typesupport_cpp/visibility_control.h"
// already included above
// #include "rosidl_typesupport_interface/macros.h"

namespace my_3d_vision_bringup
{

namespace action
{

namespace rosidl_typesupport_cpp
{

typedef struct _GraspObject_SendGoal_Response_type_support_ids_t
{
  const char * typesupport_identifier[2];
} _GraspObject_SendGoal_Response_type_support_ids_t;

static const _GraspObject_SendGoal_Response_type_support_ids_t _GraspObject_SendGoal_Response_message_typesupport_ids = {
  {
    "rosidl_typesupport_fastrtps_cpp",  // ::rosidl_typesupport_fastrtps_cpp::typesupport_identifier,
    "rosidl_typesupport_introspection_cpp",  // ::rosidl_typesupport_introspection_cpp::typesupport_identifier,
  }
};

typedef struct _GraspObject_SendGoal_Response_type_support_symbol_names_t
{
  const char * symbol_name[2];
} _GraspObject_SendGoal_Response_type_support_symbol_names_t;

#define STRINGIFY_(s) #s
#define STRINGIFY(s) STRINGIFY_(s)

static const _GraspObject_SendGoal_Response_type_support_symbol_names_t _GraspObject_SendGoal_Response_message_typesupport_symbol_names = {
  {
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_fastrtps_cpp, my_3d_vision_bringup, action, GraspObject_SendGoal_Response)),
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_cpp, my_3d_vision_bringup, action, GraspObject_SendGoal_Response)),
  }
};

typedef struct _GraspObject_SendGoal_Response_type_support_data_t
{
  void * data[2];
} _GraspObject_SendGoal_Response_type_support_data_t;

static _GraspObject_SendGoal_Response_type_support_data_t _GraspObject_SendGoal_Response_message_typesupport_data = {
  {
    0,  // will store the shared library later
    0,  // will store the shared library later
  }
};

static const type_support_map_t _GraspObject_SendGoal_Response_message_typesupport_map = {
  2,
  "my_3d_vision_bringup",
  &_GraspObject_SendGoal_Response_message_typesupport_ids.typesupport_identifier[0],
  &_GraspObject_SendGoal_Response_message_typesupport_symbol_names.symbol_name[0],
  &_GraspObject_SendGoal_Response_message_typesupport_data.data[0],
};

static const rosidl_message_type_support_t GraspObject_SendGoal_Response_message_type_support_handle = {
  ::rosidl_typesupport_cpp::typesupport_identifier,
  reinterpret_cast<const type_support_map_t *>(&_GraspObject_SendGoal_Response_message_typesupport_map),
  ::rosidl_typesupport_cpp::get_message_typesupport_handle_function,
};

}  // namespace rosidl_typesupport_cpp

}  // namespace action

}  // namespace my_3d_vision_bringup

namespace rosidl_typesupport_cpp
{

template<>
ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
get_message_type_support_handle<my_3d_vision_bringup::action::GraspObject_SendGoal_Response>()
{
  return &::my_3d_vision_bringup::action::rosidl_typesupport_cpp::GraspObject_SendGoal_Response_message_type_support_handle;
}

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_cpp, my_3d_vision_bringup, action, GraspObject_SendGoal_Response)() {
  return get_message_type_support_handle<my_3d_vision_bringup::action::GraspObject_SendGoal_Response>();
}

#ifdef __cplusplus
}
#endif
}  // namespace rosidl_typesupport_cpp

// already included above
// #include "cstddef"
#include "rosidl_runtime_c/service_type_support_struct.h"
// already included above
// #include "my_3d_vision_bringup/action/detail/grasp_object__struct.hpp"
// already included above
// #include "rosidl_typesupport_cpp/identifier.hpp"
#include "rosidl_typesupport_cpp/service_type_support.hpp"
// already included above
// #include "rosidl_typesupport_c/type_support_map.h"
#include "rosidl_typesupport_cpp/service_type_support_dispatch.hpp"
// already included above
// #include "rosidl_typesupport_cpp/visibility_control.h"
// already included above
// #include "rosidl_typesupport_interface/macros.h"

namespace my_3d_vision_bringup
{

namespace action
{

namespace rosidl_typesupport_cpp
{

typedef struct _GraspObject_SendGoal_type_support_ids_t
{
  const char * typesupport_identifier[2];
} _GraspObject_SendGoal_type_support_ids_t;

static const _GraspObject_SendGoal_type_support_ids_t _GraspObject_SendGoal_service_typesupport_ids = {
  {
    "rosidl_typesupport_fastrtps_cpp",  // ::rosidl_typesupport_fastrtps_cpp::typesupport_identifier,
    "rosidl_typesupport_introspection_cpp",  // ::rosidl_typesupport_introspection_cpp::typesupport_identifier,
  }
};

typedef struct _GraspObject_SendGoal_type_support_symbol_names_t
{
  const char * symbol_name[2];
} _GraspObject_SendGoal_type_support_symbol_names_t;

#define STRINGIFY_(s) #s
#define STRINGIFY(s) STRINGIFY_(s)

static const _GraspObject_SendGoal_type_support_symbol_names_t _GraspObject_SendGoal_service_typesupport_symbol_names = {
  {
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__SERVICE_SYMBOL_NAME(rosidl_typesupport_fastrtps_cpp, my_3d_vision_bringup, action, GraspObject_SendGoal)),
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__SERVICE_SYMBOL_NAME(rosidl_typesupport_introspection_cpp, my_3d_vision_bringup, action, GraspObject_SendGoal)),
  }
};

typedef struct _GraspObject_SendGoal_type_support_data_t
{
  void * data[2];
} _GraspObject_SendGoal_type_support_data_t;

static _GraspObject_SendGoal_type_support_data_t _GraspObject_SendGoal_service_typesupport_data = {
  {
    0,  // will store the shared library later
    0,  // will store the shared library later
  }
};

static const type_support_map_t _GraspObject_SendGoal_service_typesupport_map = {
  2,
  "my_3d_vision_bringup",
  &_GraspObject_SendGoal_service_typesupport_ids.typesupport_identifier[0],
  &_GraspObject_SendGoal_service_typesupport_symbol_names.symbol_name[0],
  &_GraspObject_SendGoal_service_typesupport_data.data[0],
};

static const rosidl_service_type_support_t GraspObject_SendGoal_service_type_support_handle = {
  ::rosidl_typesupport_cpp::typesupport_identifier,
  reinterpret_cast<const type_support_map_t *>(&_GraspObject_SendGoal_service_typesupport_map),
  ::rosidl_typesupport_cpp::get_service_typesupport_handle_function,
};

}  // namespace rosidl_typesupport_cpp

}  // namespace action

}  // namespace my_3d_vision_bringup

namespace rosidl_typesupport_cpp
{

template<>
ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_service_type_support_t *
get_service_type_support_handle<my_3d_vision_bringup::action::GraspObject_SendGoal>()
{
  return &::my_3d_vision_bringup::action::rosidl_typesupport_cpp::GraspObject_SendGoal_service_type_support_handle;
}

}  // namespace rosidl_typesupport_cpp

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_service_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__SERVICE_SYMBOL_NAME(rosidl_typesupport_cpp, my_3d_vision_bringup, action, GraspObject_SendGoal)() {
  return ::rosidl_typesupport_cpp::get_service_type_support_handle<my_3d_vision_bringup::action::GraspObject_SendGoal>();
}

#ifdef __cplusplus
}
#endif

// already included above
// #include "cstddef"
// already included above
// #include "rosidl_runtime_c/message_type_support_struct.h"
// already included above
// #include "my_3d_vision_bringup/action/detail/grasp_object__struct.hpp"
// already included above
// #include "rosidl_typesupport_cpp/identifier.hpp"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support.hpp"
// already included above
// #include "rosidl_typesupport_c/type_support_map.h"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support_dispatch.hpp"
// already included above
// #include "rosidl_typesupport_cpp/visibility_control.h"
// already included above
// #include "rosidl_typesupport_interface/macros.h"

namespace my_3d_vision_bringup
{

namespace action
{

namespace rosidl_typesupport_cpp
{

typedef struct _GraspObject_GetResult_Request_type_support_ids_t
{
  const char * typesupport_identifier[2];
} _GraspObject_GetResult_Request_type_support_ids_t;

static const _GraspObject_GetResult_Request_type_support_ids_t _GraspObject_GetResult_Request_message_typesupport_ids = {
  {
    "rosidl_typesupport_fastrtps_cpp",  // ::rosidl_typesupport_fastrtps_cpp::typesupport_identifier,
    "rosidl_typesupport_introspection_cpp",  // ::rosidl_typesupport_introspection_cpp::typesupport_identifier,
  }
};

typedef struct _GraspObject_GetResult_Request_type_support_symbol_names_t
{
  const char * symbol_name[2];
} _GraspObject_GetResult_Request_type_support_symbol_names_t;

#define STRINGIFY_(s) #s
#define STRINGIFY(s) STRINGIFY_(s)

static const _GraspObject_GetResult_Request_type_support_symbol_names_t _GraspObject_GetResult_Request_message_typesupport_symbol_names = {
  {
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_fastrtps_cpp, my_3d_vision_bringup, action, GraspObject_GetResult_Request)),
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_cpp, my_3d_vision_bringup, action, GraspObject_GetResult_Request)),
  }
};

typedef struct _GraspObject_GetResult_Request_type_support_data_t
{
  void * data[2];
} _GraspObject_GetResult_Request_type_support_data_t;

static _GraspObject_GetResult_Request_type_support_data_t _GraspObject_GetResult_Request_message_typesupport_data = {
  {
    0,  // will store the shared library later
    0,  // will store the shared library later
  }
};

static const type_support_map_t _GraspObject_GetResult_Request_message_typesupport_map = {
  2,
  "my_3d_vision_bringup",
  &_GraspObject_GetResult_Request_message_typesupport_ids.typesupport_identifier[0],
  &_GraspObject_GetResult_Request_message_typesupport_symbol_names.symbol_name[0],
  &_GraspObject_GetResult_Request_message_typesupport_data.data[0],
};

static const rosidl_message_type_support_t GraspObject_GetResult_Request_message_type_support_handle = {
  ::rosidl_typesupport_cpp::typesupport_identifier,
  reinterpret_cast<const type_support_map_t *>(&_GraspObject_GetResult_Request_message_typesupport_map),
  ::rosidl_typesupport_cpp::get_message_typesupport_handle_function,
};

}  // namespace rosidl_typesupport_cpp

}  // namespace action

}  // namespace my_3d_vision_bringup

namespace rosidl_typesupport_cpp
{

template<>
ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
get_message_type_support_handle<my_3d_vision_bringup::action::GraspObject_GetResult_Request>()
{
  return &::my_3d_vision_bringup::action::rosidl_typesupport_cpp::GraspObject_GetResult_Request_message_type_support_handle;
}

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_cpp, my_3d_vision_bringup, action, GraspObject_GetResult_Request)() {
  return get_message_type_support_handle<my_3d_vision_bringup::action::GraspObject_GetResult_Request>();
}

#ifdef __cplusplus
}
#endif
}  // namespace rosidl_typesupport_cpp

// already included above
// #include "cstddef"
// already included above
// #include "rosidl_runtime_c/message_type_support_struct.h"
// already included above
// #include "my_3d_vision_bringup/action/detail/grasp_object__struct.hpp"
// already included above
// #include "rosidl_typesupport_cpp/identifier.hpp"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support.hpp"
// already included above
// #include "rosidl_typesupport_c/type_support_map.h"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support_dispatch.hpp"
// already included above
// #include "rosidl_typesupport_cpp/visibility_control.h"
// already included above
// #include "rosidl_typesupport_interface/macros.h"

namespace my_3d_vision_bringup
{

namespace action
{

namespace rosidl_typesupport_cpp
{

typedef struct _GraspObject_GetResult_Response_type_support_ids_t
{
  const char * typesupport_identifier[2];
} _GraspObject_GetResult_Response_type_support_ids_t;

static const _GraspObject_GetResult_Response_type_support_ids_t _GraspObject_GetResult_Response_message_typesupport_ids = {
  {
    "rosidl_typesupport_fastrtps_cpp",  // ::rosidl_typesupport_fastrtps_cpp::typesupport_identifier,
    "rosidl_typesupport_introspection_cpp",  // ::rosidl_typesupport_introspection_cpp::typesupport_identifier,
  }
};

typedef struct _GraspObject_GetResult_Response_type_support_symbol_names_t
{
  const char * symbol_name[2];
} _GraspObject_GetResult_Response_type_support_symbol_names_t;

#define STRINGIFY_(s) #s
#define STRINGIFY(s) STRINGIFY_(s)

static const _GraspObject_GetResult_Response_type_support_symbol_names_t _GraspObject_GetResult_Response_message_typesupport_symbol_names = {
  {
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_fastrtps_cpp, my_3d_vision_bringup, action, GraspObject_GetResult_Response)),
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_cpp, my_3d_vision_bringup, action, GraspObject_GetResult_Response)),
  }
};

typedef struct _GraspObject_GetResult_Response_type_support_data_t
{
  void * data[2];
} _GraspObject_GetResult_Response_type_support_data_t;

static _GraspObject_GetResult_Response_type_support_data_t _GraspObject_GetResult_Response_message_typesupport_data = {
  {
    0,  // will store the shared library later
    0,  // will store the shared library later
  }
};

static const type_support_map_t _GraspObject_GetResult_Response_message_typesupport_map = {
  2,
  "my_3d_vision_bringup",
  &_GraspObject_GetResult_Response_message_typesupport_ids.typesupport_identifier[0],
  &_GraspObject_GetResult_Response_message_typesupport_symbol_names.symbol_name[0],
  &_GraspObject_GetResult_Response_message_typesupport_data.data[0],
};

static const rosidl_message_type_support_t GraspObject_GetResult_Response_message_type_support_handle = {
  ::rosidl_typesupport_cpp::typesupport_identifier,
  reinterpret_cast<const type_support_map_t *>(&_GraspObject_GetResult_Response_message_typesupport_map),
  ::rosidl_typesupport_cpp::get_message_typesupport_handle_function,
};

}  // namespace rosidl_typesupport_cpp

}  // namespace action

}  // namespace my_3d_vision_bringup

namespace rosidl_typesupport_cpp
{

template<>
ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
get_message_type_support_handle<my_3d_vision_bringup::action::GraspObject_GetResult_Response>()
{
  return &::my_3d_vision_bringup::action::rosidl_typesupport_cpp::GraspObject_GetResult_Response_message_type_support_handle;
}

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_cpp, my_3d_vision_bringup, action, GraspObject_GetResult_Response)() {
  return get_message_type_support_handle<my_3d_vision_bringup::action::GraspObject_GetResult_Response>();
}

#ifdef __cplusplus
}
#endif
}  // namespace rosidl_typesupport_cpp

// already included above
// #include "cstddef"
// already included above
// #include "rosidl_runtime_c/service_type_support_struct.h"
// already included above
// #include "my_3d_vision_bringup/action/detail/grasp_object__struct.hpp"
// already included above
// #include "rosidl_typesupport_cpp/identifier.hpp"
// already included above
// #include "rosidl_typesupport_cpp/service_type_support.hpp"
// already included above
// #include "rosidl_typesupport_c/type_support_map.h"
// already included above
// #include "rosidl_typesupport_cpp/service_type_support_dispatch.hpp"
// already included above
// #include "rosidl_typesupport_cpp/visibility_control.h"
// already included above
// #include "rosidl_typesupport_interface/macros.h"

namespace my_3d_vision_bringup
{

namespace action
{

namespace rosidl_typesupport_cpp
{

typedef struct _GraspObject_GetResult_type_support_ids_t
{
  const char * typesupport_identifier[2];
} _GraspObject_GetResult_type_support_ids_t;

static const _GraspObject_GetResult_type_support_ids_t _GraspObject_GetResult_service_typesupport_ids = {
  {
    "rosidl_typesupport_fastrtps_cpp",  // ::rosidl_typesupport_fastrtps_cpp::typesupport_identifier,
    "rosidl_typesupport_introspection_cpp",  // ::rosidl_typesupport_introspection_cpp::typesupport_identifier,
  }
};

typedef struct _GraspObject_GetResult_type_support_symbol_names_t
{
  const char * symbol_name[2];
} _GraspObject_GetResult_type_support_symbol_names_t;

#define STRINGIFY_(s) #s
#define STRINGIFY(s) STRINGIFY_(s)

static const _GraspObject_GetResult_type_support_symbol_names_t _GraspObject_GetResult_service_typesupport_symbol_names = {
  {
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__SERVICE_SYMBOL_NAME(rosidl_typesupport_fastrtps_cpp, my_3d_vision_bringup, action, GraspObject_GetResult)),
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__SERVICE_SYMBOL_NAME(rosidl_typesupport_introspection_cpp, my_3d_vision_bringup, action, GraspObject_GetResult)),
  }
};

typedef struct _GraspObject_GetResult_type_support_data_t
{
  void * data[2];
} _GraspObject_GetResult_type_support_data_t;

static _GraspObject_GetResult_type_support_data_t _GraspObject_GetResult_service_typesupport_data = {
  {
    0,  // will store the shared library later
    0,  // will store the shared library later
  }
};

static const type_support_map_t _GraspObject_GetResult_service_typesupport_map = {
  2,
  "my_3d_vision_bringup",
  &_GraspObject_GetResult_service_typesupport_ids.typesupport_identifier[0],
  &_GraspObject_GetResult_service_typesupport_symbol_names.symbol_name[0],
  &_GraspObject_GetResult_service_typesupport_data.data[0],
};

static const rosidl_service_type_support_t GraspObject_GetResult_service_type_support_handle = {
  ::rosidl_typesupport_cpp::typesupport_identifier,
  reinterpret_cast<const type_support_map_t *>(&_GraspObject_GetResult_service_typesupport_map),
  ::rosidl_typesupport_cpp::get_service_typesupport_handle_function,
};

}  // namespace rosidl_typesupport_cpp

}  // namespace action

}  // namespace my_3d_vision_bringup

namespace rosidl_typesupport_cpp
{

template<>
ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_service_type_support_t *
get_service_type_support_handle<my_3d_vision_bringup::action::GraspObject_GetResult>()
{
  return &::my_3d_vision_bringup::action::rosidl_typesupport_cpp::GraspObject_GetResult_service_type_support_handle;
}

}  // namespace rosidl_typesupport_cpp

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_service_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__SERVICE_SYMBOL_NAME(rosidl_typesupport_cpp, my_3d_vision_bringup, action, GraspObject_GetResult)() {
  return ::rosidl_typesupport_cpp::get_service_type_support_handle<my_3d_vision_bringup::action::GraspObject_GetResult>();
}

#ifdef __cplusplus
}
#endif

// already included above
// #include "cstddef"
// already included above
// #include "rosidl_runtime_c/message_type_support_struct.h"
// already included above
// #include "my_3d_vision_bringup/action/detail/grasp_object__struct.hpp"
// already included above
// #include "rosidl_typesupport_cpp/identifier.hpp"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support.hpp"
// already included above
// #include "rosidl_typesupport_c/type_support_map.h"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support_dispatch.hpp"
// already included above
// #include "rosidl_typesupport_cpp/visibility_control.h"
// already included above
// #include "rosidl_typesupport_interface/macros.h"

namespace my_3d_vision_bringup
{

namespace action
{

namespace rosidl_typesupport_cpp
{

typedef struct _GraspObject_FeedbackMessage_type_support_ids_t
{
  const char * typesupport_identifier[2];
} _GraspObject_FeedbackMessage_type_support_ids_t;

static const _GraspObject_FeedbackMessage_type_support_ids_t _GraspObject_FeedbackMessage_message_typesupport_ids = {
  {
    "rosidl_typesupport_fastrtps_cpp",  // ::rosidl_typesupport_fastrtps_cpp::typesupport_identifier,
    "rosidl_typesupport_introspection_cpp",  // ::rosidl_typesupport_introspection_cpp::typesupport_identifier,
  }
};

typedef struct _GraspObject_FeedbackMessage_type_support_symbol_names_t
{
  const char * symbol_name[2];
} _GraspObject_FeedbackMessage_type_support_symbol_names_t;

#define STRINGIFY_(s) #s
#define STRINGIFY(s) STRINGIFY_(s)

static const _GraspObject_FeedbackMessage_type_support_symbol_names_t _GraspObject_FeedbackMessage_message_typesupport_symbol_names = {
  {
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_fastrtps_cpp, my_3d_vision_bringup, action, GraspObject_FeedbackMessage)),
    STRINGIFY(ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_introspection_cpp, my_3d_vision_bringup, action, GraspObject_FeedbackMessage)),
  }
};

typedef struct _GraspObject_FeedbackMessage_type_support_data_t
{
  void * data[2];
} _GraspObject_FeedbackMessage_type_support_data_t;

static _GraspObject_FeedbackMessage_type_support_data_t _GraspObject_FeedbackMessage_message_typesupport_data = {
  {
    0,  // will store the shared library later
    0,  // will store the shared library later
  }
};

static const type_support_map_t _GraspObject_FeedbackMessage_message_typesupport_map = {
  2,
  "my_3d_vision_bringup",
  &_GraspObject_FeedbackMessage_message_typesupport_ids.typesupport_identifier[0],
  &_GraspObject_FeedbackMessage_message_typesupport_symbol_names.symbol_name[0],
  &_GraspObject_FeedbackMessage_message_typesupport_data.data[0],
};

static const rosidl_message_type_support_t GraspObject_FeedbackMessage_message_type_support_handle = {
  ::rosidl_typesupport_cpp::typesupport_identifier,
  reinterpret_cast<const type_support_map_t *>(&_GraspObject_FeedbackMessage_message_typesupport_map),
  ::rosidl_typesupport_cpp::get_message_typesupport_handle_function,
};

}  // namespace rosidl_typesupport_cpp

}  // namespace action

}  // namespace my_3d_vision_bringup

namespace rosidl_typesupport_cpp
{

template<>
ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
get_message_type_support_handle<my_3d_vision_bringup::action::GraspObject_FeedbackMessage>()
{
  return &::my_3d_vision_bringup::action::rosidl_typesupport_cpp::GraspObject_FeedbackMessage_message_type_support_handle;
}

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_message_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__MESSAGE_SYMBOL_NAME(rosidl_typesupport_cpp, my_3d_vision_bringup, action, GraspObject_FeedbackMessage)() {
  return get_message_type_support_handle<my_3d_vision_bringup::action::GraspObject_FeedbackMessage>();
}

#ifdef __cplusplus
}
#endif
}  // namespace rosidl_typesupport_cpp

#include "action_msgs/msg/goal_status_array.hpp"
#include "action_msgs/srv/cancel_goal.hpp"
// already included above
// #include "my_3d_vision_bringup/action/detail/grasp_object__struct.hpp"
// already included above
// #include "rosidl_typesupport_cpp/visibility_control.h"
#include "rosidl_runtime_c/action_type_support_struct.h"
#include "rosidl_typesupport_cpp/action_type_support.hpp"
// already included above
// #include "rosidl_typesupport_cpp/message_type_support.hpp"
// already included above
// #include "rosidl_typesupport_cpp/service_type_support.hpp"

namespace my_3d_vision_bringup
{

namespace action
{

namespace rosidl_typesupport_cpp
{

static rosidl_action_type_support_t GraspObject_action_type_support_handle = {
  NULL, NULL, NULL, NULL, NULL};

}  // namespace rosidl_typesupport_cpp

}  // namespace action

}  // namespace my_3d_vision_bringup

namespace rosidl_typesupport_cpp
{

template<>
ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_action_type_support_t *
get_action_type_support_handle<my_3d_vision_bringup::action::GraspObject>()
{
  using ::my_3d_vision_bringup::action::rosidl_typesupport_cpp::GraspObject_action_type_support_handle;
  // Thread-safe by always writing the same values to the static struct
  GraspObject_action_type_support_handle.goal_service_type_support = get_service_type_support_handle<::my_3d_vision_bringup::action::GraspObject::Impl::SendGoalService>();
  GraspObject_action_type_support_handle.result_service_type_support = get_service_type_support_handle<::my_3d_vision_bringup::action::GraspObject::Impl::GetResultService>();
  GraspObject_action_type_support_handle.cancel_service_type_support = get_service_type_support_handle<::my_3d_vision_bringup::action::GraspObject::Impl::CancelGoalService>();
  GraspObject_action_type_support_handle.feedback_message_type_support = get_message_type_support_handle<::my_3d_vision_bringup::action::GraspObject::Impl::FeedbackMessage>();
  GraspObject_action_type_support_handle.status_message_type_support = get_message_type_support_handle<::my_3d_vision_bringup::action::GraspObject::Impl::GoalStatusMessage>();
  return &GraspObject_action_type_support_handle;
}

}  // namespace rosidl_typesupport_cpp

#ifdef __cplusplus
extern "C"
{
#endif

ROSIDL_TYPESUPPORT_CPP_PUBLIC
const rosidl_action_type_support_t *
ROSIDL_TYPESUPPORT_INTERFACE__ACTION_SYMBOL_NAME(rosidl_typesupport_cpp, my_3d_vision_bringup, action, GraspObject)() {
  return ::rosidl_typesupport_cpp::get_action_type_support_handle<my_3d_vision_bringup::action::GraspObject>();
}

#ifdef __cplusplus
}
#endif
