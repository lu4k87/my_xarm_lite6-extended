#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};



#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__srv__SetPose_Request() -> *const std::ffi::c_void;
}

#[link(name = "zed_interfaces__rosidl_generator_c")]
extern "C" {
    fn zed_interfaces__srv__SetPose_Request__init(msg: *mut SetPose_Request) -> bool;
    fn zed_interfaces__srv__SetPose_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetPose_Request>, size: usize) -> bool;
    fn zed_interfaces__srv__SetPose_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetPose_Request>);
    fn zed_interfaces__srv__SetPose_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetPose_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<SetPose_Request>) -> bool;
}

// Corresponds to zed_interfaces__srv__SetPose_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetPose_Request {
    /// Translation XYZ
    pub pos: [f32; 3],

    /// Orientation RPY
    pub orient: [f32; 3],

}



impl Default for SetPose_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !zed_interfaces__srv__SetPose_Request__init(&mut msg as *mut _) {
        panic!("Call to zed_interfaces__srv__SetPose_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetPose_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__srv__SetPose_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__srv__SetPose_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__srv__SetPose_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetPose_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetPose_Request where Self: Sized {
  const TYPE_NAME: &'static str = "zed_interfaces/srv/SetPose_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__srv__SetPose_Request() }
  }
}


#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__srv__SetPose_Response() -> *const std::ffi::c_void;
}

#[link(name = "zed_interfaces__rosidl_generator_c")]
extern "C" {
    fn zed_interfaces__srv__SetPose_Response__init(msg: *mut SetPose_Response) -> bool;
    fn zed_interfaces__srv__SetPose_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetPose_Response>, size: usize) -> bool;
    fn zed_interfaces__srv__SetPose_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetPose_Response>);
    fn zed_interfaces__srv__SetPose_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetPose_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<SetPose_Response>) -> bool;
}

// Corresponds to zed_interfaces__srv__SetPose_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetPose_Response {
    /// indicate successful run of service
    pub success: bool,

    /// informational, e.g. for error messages
    pub message: rosidl_runtime_rs::String,

}



impl Default for SetPose_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !zed_interfaces__srv__SetPose_Response__init(&mut msg as *mut _) {
        panic!("Call to zed_interfaces__srv__SetPose_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetPose_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__srv__SetPose_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__srv__SetPose_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__srv__SetPose_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetPose_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetPose_Response where Self: Sized {
  const TYPE_NAME: &'static str = "zed_interfaces/srv/SetPose_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__srv__SetPose_Response() }
  }
}


#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__srv__StartSvoRec_Request() -> *const std::ffi::c_void;
}

#[link(name = "zed_interfaces__rosidl_generator_c")]
extern "C" {
    fn zed_interfaces__srv__StartSvoRec_Request__init(msg: *mut StartSvoRec_Request) -> bool;
    fn zed_interfaces__srv__StartSvoRec_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<StartSvoRec_Request>, size: usize) -> bool;
    fn zed_interfaces__srv__StartSvoRec_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<StartSvoRec_Request>);
    fn zed_interfaces__srv__StartSvoRec_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<StartSvoRec_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<StartSvoRec_Request>) -> bool;
}

// Corresponds to zed_interfaces__srv__StartSvoRec_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct StartSvoRec_Request {
    /// Bitrate - 0 or [1000,60000]
    pub bitrate: u32,

    /// Compression Mode - [0,2]
    pub compression_mode: u8,

    /// Target Framerate
    /// Allowed framerates are 0,15,30, 60 or 100.
    /// Any other values will be discarded and camera FPS will be taken.
    pub target_framerate: u32,

    /// Input Transcode
    pub input_transcode: bool,

    /// Filename
    pub svo_filename: rosidl_runtime_rs::String,

}



impl Default for StartSvoRec_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !zed_interfaces__srv__StartSvoRec_Request__init(&mut msg as *mut _) {
        panic!("Call to zed_interfaces__srv__StartSvoRec_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for StartSvoRec_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__srv__StartSvoRec_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__srv__StartSvoRec_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__srv__StartSvoRec_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for StartSvoRec_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for StartSvoRec_Request where Self: Sized {
  const TYPE_NAME: &'static str = "zed_interfaces/srv/StartSvoRec_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__srv__StartSvoRec_Request() }
  }
}


#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__srv__StartSvoRec_Response() -> *const std::ffi::c_void;
}

#[link(name = "zed_interfaces__rosidl_generator_c")]
extern "C" {
    fn zed_interfaces__srv__StartSvoRec_Response__init(msg: *mut StartSvoRec_Response) -> bool;
    fn zed_interfaces__srv__StartSvoRec_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<StartSvoRec_Response>, size: usize) -> bool;
    fn zed_interfaces__srv__StartSvoRec_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<StartSvoRec_Response>);
    fn zed_interfaces__srv__StartSvoRec_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<StartSvoRec_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<StartSvoRec_Response>) -> bool;
}

// Corresponds to zed_interfaces__srv__StartSvoRec_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct StartSvoRec_Response {
    /// indicate successful run of service
    pub success: bool,

    /// informational, e.g. for error messages
    pub message: rosidl_runtime_rs::String,

}



impl Default for StartSvoRec_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !zed_interfaces__srv__StartSvoRec_Response__init(&mut msg as *mut _) {
        panic!("Call to zed_interfaces__srv__StartSvoRec_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for StartSvoRec_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__srv__StartSvoRec_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__srv__StartSvoRec_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__srv__StartSvoRec_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for StartSvoRec_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for StartSvoRec_Response where Self: Sized {
  const TYPE_NAME: &'static str = "zed_interfaces/srv/StartSvoRec_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__srv__StartSvoRec_Response() }
  }
}


#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__srv__SetROI_Request() -> *const std::ffi::c_void;
}

#[link(name = "zed_interfaces__rosidl_generator_c")]
extern "C" {
    fn zed_interfaces__srv__SetROI_Request__init(msg: *mut SetROI_Request) -> bool;
    fn zed_interfaces__srv__SetROI_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetROI_Request>, size: usize) -> bool;
    fn zed_interfaces__srv__SetROI_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetROI_Request>);
    fn zed_interfaces__srv__SetROI_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetROI_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<SetROI_Request>) -> bool;
}

// Corresponds to zed_interfaces__srv__SetROI_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetROI_Request {
    /// Region of interest polygon as an array of normalized vertices. e.g. "[[0.5,0.25],[0.75,0.5],[0.5,0.75],[0.25,0.5]]"
    /// You can use
    pub roi: rosidl_runtime_rs::String,

}



impl Default for SetROI_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !zed_interfaces__srv__SetROI_Request__init(&mut msg as *mut _) {
        panic!("Call to zed_interfaces__srv__SetROI_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetROI_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__srv__SetROI_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__srv__SetROI_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__srv__SetROI_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetROI_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetROI_Request where Self: Sized {
  const TYPE_NAME: &'static str = "zed_interfaces/srv/SetROI_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__srv__SetROI_Request() }
  }
}


#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__srv__SetROI_Response() -> *const std::ffi::c_void;
}

#[link(name = "zed_interfaces__rosidl_generator_c")]
extern "C" {
    fn zed_interfaces__srv__SetROI_Response__init(msg: *mut SetROI_Response) -> bool;
    fn zed_interfaces__srv__SetROI_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetROI_Response>, size: usize) -> bool;
    fn zed_interfaces__srv__SetROI_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetROI_Response>);
    fn zed_interfaces__srv__SetROI_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetROI_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<SetROI_Response>) -> bool;
}

// Corresponds to zed_interfaces__srv__SetROI_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetROI_Response {
    /// indicate successful run of service
    pub success: bool,

    /// informational, e.g. for error messages
    pub message: rosidl_runtime_rs::String,

}



impl Default for SetROI_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !zed_interfaces__srv__SetROI_Response__init(&mut msg as *mut _) {
        panic!("Call to zed_interfaces__srv__SetROI_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetROI_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__srv__SetROI_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__srv__SetROI_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__srv__SetROI_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetROI_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetROI_Response where Self: Sized {
  const TYPE_NAME: &'static str = "zed_interfaces/srv/SetROI_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__srv__SetROI_Response() }
  }
}






#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__zed_interfaces__srv__SetPose() -> *const std::ffi::c_void;
}

// Corresponds to zed_interfaces__srv__SetPose
#[allow(missing_docs, non_camel_case_types)]
pub struct SetPose;

impl rosidl_runtime_rs::Service for SetPose {
    type Request = SetPose_Request;
    type Response = SetPose_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__zed_interfaces__srv__SetPose() }
    }
}




#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__zed_interfaces__srv__StartSvoRec() -> *const std::ffi::c_void;
}

// Corresponds to zed_interfaces__srv__StartSvoRec
#[allow(missing_docs, non_camel_case_types)]
pub struct StartSvoRec;

impl rosidl_runtime_rs::Service for StartSvoRec {
    type Request = StartSvoRec_Request;
    type Response = StartSvoRec_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__zed_interfaces__srv__StartSvoRec() }
    }
}




#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__zed_interfaces__srv__SetROI() -> *const std::ffi::c_void;
}

// Corresponds to zed_interfaces__srv__SetROI
#[allow(missing_docs, non_camel_case_types)]
pub struct SetROI;

impl rosidl_runtime_rs::Service for SetROI {
    type Request = SetROI_Request;
    type Response = SetROI_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__zed_interfaces__srv__SetROI() }
    }
}


