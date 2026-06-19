#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};



#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__BioGripperCtrl_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__BioGripperCtrl_Request__init(msg: *mut BioGripperCtrl_Request) -> bool;
    fn xarm_msgs__srv__BioGripperCtrl_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<BioGripperCtrl_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__BioGripperCtrl_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<BioGripperCtrl_Request>);
    fn xarm_msgs__srv__BioGripperCtrl_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<BioGripperCtrl_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<BioGripperCtrl_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__BioGripperCtrl_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct BioGripperCtrl_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub speed: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub wait: bool,


    // This member is not documented.
    #[allow(missing_docs)]
    pub timeout: f32,

}



impl Default for BioGripperCtrl_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__BioGripperCtrl_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__BioGripperCtrl_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for BioGripperCtrl_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__BioGripperCtrl_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__BioGripperCtrl_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__BioGripperCtrl_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for BioGripperCtrl_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for BioGripperCtrl_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/BioGripperCtrl_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__BioGripperCtrl_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__BioGripperCtrl_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__BioGripperCtrl_Response__init(msg: *mut BioGripperCtrl_Response) -> bool;
    fn xarm_msgs__srv__BioGripperCtrl_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<BioGripperCtrl_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__BioGripperCtrl_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<BioGripperCtrl_Response>);
    fn xarm_msgs__srv__BioGripperCtrl_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<BioGripperCtrl_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<BioGripperCtrl_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__BioGripperCtrl_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct BioGripperCtrl_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for BioGripperCtrl_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__BioGripperCtrl_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__BioGripperCtrl_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for BioGripperCtrl_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__BioGripperCtrl_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__BioGripperCtrl_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__BioGripperCtrl_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for BioGripperCtrl_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for BioGripperCtrl_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/BioGripperCtrl_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__BioGripperCtrl_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__BioGripperEnable_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__BioGripperEnable_Request__init(msg: *mut BioGripperEnable_Request) -> bool;
    fn xarm_msgs__srv__BioGripperEnable_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<BioGripperEnable_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__BioGripperEnable_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<BioGripperEnable_Request>);
    fn xarm_msgs__srv__BioGripperEnable_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<BioGripperEnable_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<BioGripperEnable_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__BioGripperEnable_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct BioGripperEnable_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub enable: bool,


    // This member is not documented.
    #[allow(missing_docs)]
    pub wait: bool,


    // This member is not documented.
    #[allow(missing_docs)]
    pub timeout: f32,

}



impl Default for BioGripperEnable_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__BioGripperEnable_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__BioGripperEnable_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for BioGripperEnable_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__BioGripperEnable_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__BioGripperEnable_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__BioGripperEnable_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for BioGripperEnable_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for BioGripperEnable_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/BioGripperEnable_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__BioGripperEnable_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__BioGripperEnable_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__BioGripperEnable_Response__init(msg: *mut BioGripperEnable_Response) -> bool;
    fn xarm_msgs__srv__BioGripperEnable_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<BioGripperEnable_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__BioGripperEnable_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<BioGripperEnable_Response>);
    fn xarm_msgs__srv__BioGripperEnable_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<BioGripperEnable_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<BioGripperEnable_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__BioGripperEnable_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct BioGripperEnable_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for BioGripperEnable_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__BioGripperEnable_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__BioGripperEnable_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for BioGripperEnable_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__BioGripperEnable_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__BioGripperEnable_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__BioGripperEnable_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for BioGripperEnable_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for BioGripperEnable_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/BioGripperEnable_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__BioGripperEnable_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__Call_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__Call_Request__init(msg: *mut Call_Request) -> bool;
    fn xarm_msgs__srv__Call_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<Call_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__Call_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<Call_Request>);
    fn xarm_msgs__srv__Call_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<Call_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<Call_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__Call_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Call_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub structure_needs_at_least_one_member: u8,

}



impl Default for Call_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__Call_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__Call_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for Call_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__Call_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__Call_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__Call_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for Call_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for Call_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/Call_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__Call_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__Call_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__Call_Response__init(msg: *mut Call_Response) -> bool;
    fn xarm_msgs__srv__Call_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<Call_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__Call_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<Call_Response>);
    fn xarm_msgs__srv__Call_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<Call_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<Call_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__Call_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Call_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for Call_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__Call_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__Call_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for Call_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__Call_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__Call_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__Call_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for Call_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for Call_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/Call_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__Call_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetAnalogIO_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__GetAnalogIO_Request__init(msg: *mut GetAnalogIO_Request) -> bool;
    fn xarm_msgs__srv__GetAnalogIO_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<GetAnalogIO_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__GetAnalogIO_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<GetAnalogIO_Request>);
    fn xarm_msgs__srv__GetAnalogIO_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<GetAnalogIO_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<GetAnalogIO_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__GetAnalogIO_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetAnalogIO_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ionum: i16,

}



impl Default for GetAnalogIO_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__GetAnalogIO_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__GetAnalogIO_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for GetAnalogIO_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetAnalogIO_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetAnalogIO_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetAnalogIO_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for GetAnalogIO_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for GetAnalogIO_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/GetAnalogIO_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetAnalogIO_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetAnalogIO_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__GetAnalogIO_Response__init(msg: *mut GetAnalogIO_Response) -> bool;
    fn xarm_msgs__srv__GetAnalogIO_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<GetAnalogIO_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__GetAnalogIO_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<GetAnalogIO_Response>);
    fn xarm_msgs__srv__GetAnalogIO_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<GetAnalogIO_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<GetAnalogIO_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__GetAnalogIO_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetAnalogIO_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub data: f32,

}



impl Default for GetAnalogIO_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__GetAnalogIO_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__GetAnalogIO_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for GetAnalogIO_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetAnalogIO_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetAnalogIO_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetAnalogIO_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for GetAnalogIO_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for GetAnalogIO_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/GetAnalogIO_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetAnalogIO_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetDigitalIO_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__GetDigitalIO_Request__init(msg: *mut GetDigitalIO_Request) -> bool;
    fn xarm_msgs__srv__GetDigitalIO_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<GetDigitalIO_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__GetDigitalIO_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<GetDigitalIO_Request>);
    fn xarm_msgs__srv__GetDigitalIO_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<GetDigitalIO_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<GetDigitalIO_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__GetDigitalIO_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetDigitalIO_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub structure_needs_at_least_one_member: u8,

}



impl Default for GetDigitalIO_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__GetDigitalIO_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__GetDigitalIO_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for GetDigitalIO_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetDigitalIO_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetDigitalIO_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetDigitalIO_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for GetDigitalIO_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for GetDigitalIO_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/GetDigitalIO_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetDigitalIO_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetDigitalIO_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__GetDigitalIO_Response__init(msg: *mut GetDigitalIO_Response) -> bool;
    fn xarm_msgs__srv__GetDigitalIO_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<GetDigitalIO_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__GetDigitalIO_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<GetDigitalIO_Response>);
    fn xarm_msgs__srv__GetDigitalIO_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<GetDigitalIO_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<GetDigitalIO_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__GetDigitalIO_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetDigitalIO_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub digitals: rosidl_runtime_rs::Sequence<i16>,

}



impl Default for GetDigitalIO_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__GetDigitalIO_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__GetDigitalIO_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for GetDigitalIO_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetDigitalIO_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetDigitalIO_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetDigitalIO_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for GetDigitalIO_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for GetDigitalIO_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/GetDigitalIO_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetDigitalIO_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetFloat32_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__GetFloat32_Request__init(msg: *mut GetFloat32_Request) -> bool;
    fn xarm_msgs__srv__GetFloat32_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<GetFloat32_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__GetFloat32_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<GetFloat32_Request>);
    fn xarm_msgs__srv__GetFloat32_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<GetFloat32_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<GetFloat32_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__GetFloat32_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetFloat32_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub structure_needs_at_least_one_member: u8,

}



impl Default for GetFloat32_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__GetFloat32_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__GetFloat32_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for GetFloat32_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetFloat32_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetFloat32_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetFloat32_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for GetFloat32_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for GetFloat32_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/GetFloat32_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetFloat32_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetFloat32_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__GetFloat32_Response__init(msg: *mut GetFloat32_Response) -> bool;
    fn xarm_msgs__srv__GetFloat32_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<GetFloat32_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__GetFloat32_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<GetFloat32_Response>);
    fn xarm_msgs__srv__GetFloat32_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<GetFloat32_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<GetFloat32_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__GetFloat32_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetFloat32_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub data: f32,

}



impl Default for GetFloat32_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__GetFloat32_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__GetFloat32_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for GetFloat32_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetFloat32_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetFloat32_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetFloat32_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for GetFloat32_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for GetFloat32_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/GetFloat32_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetFloat32_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetFloat32List_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__GetFloat32List_Request__init(msg: *mut GetFloat32List_Request) -> bool;
    fn xarm_msgs__srv__GetFloat32List_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<GetFloat32List_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__GetFloat32List_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<GetFloat32List_Request>);
    fn xarm_msgs__srv__GetFloat32List_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<GetFloat32List_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<GetFloat32List_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__GetFloat32List_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetFloat32List_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub structure_needs_at_least_one_member: u8,

}



impl Default for GetFloat32List_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__GetFloat32List_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__GetFloat32List_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for GetFloat32List_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetFloat32List_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetFloat32List_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetFloat32List_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for GetFloat32List_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for GetFloat32List_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/GetFloat32List_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetFloat32List_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetFloat32List_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__GetFloat32List_Response__init(msg: *mut GetFloat32List_Response) -> bool;
    fn xarm_msgs__srv__GetFloat32List_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<GetFloat32List_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__GetFloat32List_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<GetFloat32List_Response>);
    fn xarm_msgs__srv__GetFloat32List_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<GetFloat32List_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<GetFloat32List_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__GetFloat32List_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetFloat32List_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub datas: rosidl_runtime_rs::Sequence<f32>,

}



impl Default for GetFloat32List_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__GetFloat32List_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__GetFloat32List_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for GetFloat32List_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetFloat32List_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetFloat32List_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetFloat32List_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for GetFloat32List_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for GetFloat32List_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/GetFloat32List_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetFloat32List_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetInt16_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__GetInt16_Request__init(msg: *mut GetInt16_Request) -> bool;
    fn xarm_msgs__srv__GetInt16_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<GetInt16_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__GetInt16_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<GetInt16_Request>);
    fn xarm_msgs__srv__GetInt16_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<GetInt16_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<GetInt16_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__GetInt16_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetInt16_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub structure_needs_at_least_one_member: u8,

}



impl Default for GetInt16_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__GetInt16_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__GetInt16_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for GetInt16_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt16_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt16_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt16_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for GetInt16_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for GetInt16_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/GetInt16_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetInt16_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetInt16_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__GetInt16_Response__init(msg: *mut GetInt16_Response) -> bool;
    fn xarm_msgs__srv__GetInt16_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<GetInt16_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__GetInt16_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<GetInt16_Response>);
    fn xarm_msgs__srv__GetInt16_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<GetInt16_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<GetInt16_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__GetInt16_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetInt16_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub data: i16,

}



impl Default for GetInt16_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__GetInt16_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__GetInt16_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for GetInt16_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt16_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt16_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt16_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for GetInt16_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for GetInt16_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/GetInt16_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetInt16_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetInt16List_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__GetInt16List_Request__init(msg: *mut GetInt16List_Request) -> bool;
    fn xarm_msgs__srv__GetInt16List_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<GetInt16List_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__GetInt16List_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<GetInt16List_Request>);
    fn xarm_msgs__srv__GetInt16List_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<GetInt16List_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<GetInt16List_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__GetInt16List_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetInt16List_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub structure_needs_at_least_one_member: u8,

}



impl Default for GetInt16List_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__GetInt16List_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__GetInt16List_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for GetInt16List_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt16List_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt16List_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt16List_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for GetInt16List_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for GetInt16List_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/GetInt16List_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetInt16List_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetInt16List_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__GetInt16List_Response__init(msg: *mut GetInt16List_Response) -> bool;
    fn xarm_msgs__srv__GetInt16List_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<GetInt16List_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__GetInt16List_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<GetInt16List_Response>);
    fn xarm_msgs__srv__GetInt16List_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<GetInt16List_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<GetInt16List_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__GetInt16List_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetInt16List_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub datas: rosidl_runtime_rs::Sequence<i16>,

}



impl Default for GetInt16List_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__GetInt16List_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__GetInt16List_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for GetInt16List_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt16List_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt16List_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt16List_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for GetInt16List_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for GetInt16List_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/GetInt16List_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetInt16List_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetInt32_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__GetInt32_Request__init(msg: *mut GetInt32_Request) -> bool;
    fn xarm_msgs__srv__GetInt32_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<GetInt32_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__GetInt32_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<GetInt32_Request>);
    fn xarm_msgs__srv__GetInt32_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<GetInt32_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<GetInt32_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__GetInt32_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetInt32_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub structure_needs_at_least_one_member: u8,

}



impl Default for GetInt32_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__GetInt32_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__GetInt32_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for GetInt32_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt32_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt32_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt32_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for GetInt32_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for GetInt32_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/GetInt32_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetInt32_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetInt32_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__GetInt32_Response__init(msg: *mut GetInt32_Response) -> bool;
    fn xarm_msgs__srv__GetInt32_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<GetInt32_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__GetInt32_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<GetInt32_Response>);
    fn xarm_msgs__srv__GetInt32_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<GetInt32_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<GetInt32_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__GetInt32_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetInt32_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub data: i32,

}



impl Default for GetInt32_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__GetInt32_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__GetInt32_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for GetInt32_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt32_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt32_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt32_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for GetInt32_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for GetInt32_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/GetInt32_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetInt32_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetInt32ByType_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__GetInt32ByType_Request__init(msg: *mut GetInt32ByType_Request) -> bool;
    fn xarm_msgs__srv__GetInt32ByType_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<GetInt32ByType_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__GetInt32ByType_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<GetInt32ByType_Request>);
    fn xarm_msgs__srv__GetInt32ByType_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<GetInt32ByType_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<GetInt32ByType_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__GetInt32ByType_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetInt32ByType_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub type_: i16,

}



impl Default for GetInt32ByType_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__GetInt32ByType_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__GetInt32ByType_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for GetInt32ByType_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt32ByType_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt32ByType_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt32ByType_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for GetInt32ByType_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for GetInt32ByType_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/GetInt32ByType_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetInt32ByType_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetInt32ByType_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__GetInt32ByType_Response__init(msg: *mut GetInt32ByType_Response) -> bool;
    fn xarm_msgs__srv__GetInt32ByType_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<GetInt32ByType_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__GetInt32ByType_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<GetInt32ByType_Response>);
    fn xarm_msgs__srv__GetInt32ByType_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<GetInt32ByType_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<GetInt32ByType_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__GetInt32ByType_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetInt32ByType_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub data: i32,

}



impl Default for GetInt32ByType_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__GetInt32ByType_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__GetInt32ByType_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for GetInt32ByType_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt32ByType_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt32ByType_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetInt32ByType_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for GetInt32ByType_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for GetInt32ByType_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/GetInt32ByType_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetInt32ByType_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetSetModbusData_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__GetSetModbusData_Request__init(msg: *mut GetSetModbusData_Request) -> bool;
    fn xarm_msgs__srv__GetSetModbusData_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<GetSetModbusData_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__GetSetModbusData_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<GetSetModbusData_Request>);
    fn xarm_msgs__srv__GetSetModbusData_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<GetSetModbusData_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<GetSetModbusData_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__GetSetModbusData_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetSetModbusData_Request {
    /// modbus data to send
    pub modbus_data: rosidl_runtime_rs::Sequence<u8>,

    /// Specify the length of modbus data bytes to be sent, the default(less than or equal to 0) is the size of modbus_data
    pub modbus_length: i16,

    /// Specify the anticipated maximum respond data length in bytes
    pub ret_length: i16,

    /// host id, 9: END RS485, 10: Controller RS485
    pub host_id: u8,

    /// whether to choose transparent transmission
    pub is_transparent_transmission: bool,

    /// whether to use port 503 for communication
    /// if it is true, it will connect to 503 port for communication when it is used for the first time, which is generally only useful for transparent transmission
    pub use_503_port: bool,

}



impl Default for GetSetModbusData_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__GetSetModbusData_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__GetSetModbusData_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for GetSetModbusData_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetSetModbusData_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetSetModbusData_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetSetModbusData_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for GetSetModbusData_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for GetSetModbusData_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/GetSetModbusData_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetSetModbusData_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetSetModbusData_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__GetSetModbusData_Response__init(msg: *mut GetSetModbusData_Response) -> bool;
    fn xarm_msgs__srv__GetSetModbusData_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<GetSetModbusData_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__GetSetModbusData_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<GetSetModbusData_Response>);
    fn xarm_msgs__srv__GetSetModbusData_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<GetSetModbusData_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<GetSetModbusData_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__GetSetModbusData_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetSetModbusData_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub ret_data: rosidl_runtime_rs::Sequence<u8>,

}



impl Default for GetSetModbusData_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__GetSetModbusData_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__GetSetModbusData_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for GetSetModbusData_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetSetModbusData_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetSetModbusData_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GetSetModbusData_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for GetSetModbusData_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for GetSetModbusData_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/GetSetModbusData_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GetSetModbusData_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GripperMove_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__GripperMove_Request__init(msg: *mut GripperMove_Request) -> bool;
    fn xarm_msgs__srv__GripperMove_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<GripperMove_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__GripperMove_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<GripperMove_Request>);
    fn xarm_msgs__srv__GripperMove_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<GripperMove_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<GripperMove_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__GripperMove_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GripperMove_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub pos: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub wait: bool,


    // This member is not documented.
    #[allow(missing_docs)]
    pub timeout: f32,

}



impl Default for GripperMove_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__GripperMove_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__GripperMove_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for GripperMove_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GripperMove_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GripperMove_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GripperMove_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for GripperMove_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for GripperMove_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/GripperMove_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GripperMove_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GripperMove_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__GripperMove_Response__init(msg: *mut GripperMove_Response) -> bool;
    fn xarm_msgs__srv__GripperMove_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<GripperMove_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__GripperMove_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<GripperMove_Response>);
    fn xarm_msgs__srv__GripperMove_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<GripperMove_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<GripperMove_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__GripperMove_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GripperMove_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for GripperMove_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__GripperMove_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__GripperMove_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for GripperMove_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GripperMove_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GripperMove_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__GripperMove_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for GripperMove_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for GripperMove_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/GripperMove_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__GripperMove_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__MoveCartesian_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__MoveCartesian_Request__init(msg: *mut MoveCartesian_Request) -> bool;
    fn xarm_msgs__srv__MoveCartesian_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<MoveCartesian_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__MoveCartesian_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<MoveCartesian_Request>);
    fn xarm_msgs__srv__MoveCartesian_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<MoveCartesian_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<MoveCartesian_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__MoveCartesian_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct MoveCartesian_Request {
    /// set_position/set_tool_position/set_position_aa/set_servo_cartesian/set_servo_cartesian_aa
    pub pose: rosidl_runtime_rs::Sequence<f32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub speed: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub acc: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub mvtime: f32,

    /// set_position/set_position_aa/set_tool_position
    pub wait: bool,


    // This member is not documented.
    #[allow(missing_docs)]
    pub timeout: f32,

    /// set_position/set_tool_position/set_position_aa
    pub radius: f32,

    /// set_position_aa/set_servo_cartesian/set_servo_cartesian_aa
    pub is_tool_coord: bool,

    /// set_position_aa/set_servo_cartesian_aa
    pub relative: bool,

    /// set_position/set_tool_position/set_position_aa
    ///   motion_type == 0: default, linear planning
    ///   motion_type == 1: prioritize linear planning, and turn to IK for joint planning when linear planning is not possible
    ///   motion_type == 2: direct transfer to IK using joint planning
    ///   Note:
    ///       1. only available if firmware_version >= 1.11.100
    ///       2. when motion_type is 1 or 2, linear motion cannot be guaranteed
    ///       3. once IK is transferred to joint planning, the given Cartesian velocity and acceleration are converted into joint velocity and acceleration according to the percentage
    ///           speed = speed / max_tcp_speed * max_joint_speed
    ///           acc = acc / max_tcp_acc * max_joint_acc
    ///       4. if there is no suitable IK, a C40 error will be triggered
    pub motion_type: u8,

}



impl Default for MoveCartesian_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__MoveCartesian_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__MoveCartesian_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for MoveCartesian_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveCartesian_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveCartesian_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveCartesian_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for MoveCartesian_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for MoveCartesian_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/MoveCartesian_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__MoveCartesian_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__MoveCartesian_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__MoveCartesian_Response__init(msg: *mut MoveCartesian_Response) -> bool;
    fn xarm_msgs__srv__MoveCartesian_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<MoveCartesian_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__MoveCartesian_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<MoveCartesian_Response>);
    fn xarm_msgs__srv__MoveCartesian_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<MoveCartesian_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<MoveCartesian_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__MoveCartesian_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct MoveCartesian_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for MoveCartesian_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__MoveCartesian_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__MoveCartesian_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for MoveCartesian_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveCartesian_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveCartesian_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveCartesian_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for MoveCartesian_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for MoveCartesian_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/MoveCartesian_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__MoveCartesian_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__MoveCircle_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__MoveCircle_Request__init(msg: *mut MoveCircle_Request) -> bool;
    fn xarm_msgs__srv__MoveCircle_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<MoveCircle_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__MoveCircle_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<MoveCircle_Request>);
    fn xarm_msgs__srv__MoveCircle_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<MoveCircle_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<MoveCircle_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__MoveCircle_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct MoveCircle_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub pose1: rosidl_runtime_rs::Sequence<f32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub pose2: rosidl_runtime_rs::Sequence<f32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub percent: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub speed: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub acc: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub mvtime: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub wait: bool,


    // This member is not documented.
    #[allow(missing_docs)]
    pub timeout: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub is_tool_coord: bool,


    // This member is not documented.
    #[allow(missing_docs)]
    pub is_axis_angle: bool,

}



impl Default for MoveCircle_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__MoveCircle_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__MoveCircle_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for MoveCircle_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveCircle_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveCircle_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveCircle_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for MoveCircle_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for MoveCircle_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/MoveCircle_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__MoveCircle_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__MoveCircle_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__MoveCircle_Response__init(msg: *mut MoveCircle_Response) -> bool;
    fn xarm_msgs__srv__MoveCircle_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<MoveCircle_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__MoveCircle_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<MoveCircle_Response>);
    fn xarm_msgs__srv__MoveCircle_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<MoveCircle_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<MoveCircle_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__MoveCircle_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct MoveCircle_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for MoveCircle_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__MoveCircle_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__MoveCircle_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for MoveCircle_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveCircle_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveCircle_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveCircle_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for MoveCircle_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for MoveCircle_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/MoveCircle_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__MoveCircle_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__MoveHome_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__MoveHome_Request__init(msg: *mut MoveHome_Request) -> bool;
    fn xarm_msgs__srv__MoveHome_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<MoveHome_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__MoveHome_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<MoveHome_Request>);
    fn xarm_msgs__srv__MoveHome_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<MoveHome_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<MoveHome_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__MoveHome_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct MoveHome_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub speed: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub acc: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub mvtime: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub wait: bool,


    // This member is not documented.
    #[allow(missing_docs)]
    pub timeout: f32,

}



impl Default for MoveHome_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__MoveHome_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__MoveHome_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for MoveHome_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveHome_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveHome_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveHome_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for MoveHome_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for MoveHome_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/MoveHome_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__MoveHome_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__MoveHome_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__MoveHome_Response__init(msg: *mut MoveHome_Response) -> bool;
    fn xarm_msgs__srv__MoveHome_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<MoveHome_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__MoveHome_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<MoveHome_Response>);
    fn xarm_msgs__srv__MoveHome_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<MoveHome_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<MoveHome_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__MoveHome_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct MoveHome_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for MoveHome_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__MoveHome_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__MoveHome_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for MoveHome_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveHome_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveHome_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveHome_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for MoveHome_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for MoveHome_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/MoveHome_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__MoveHome_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__MoveJoint_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__MoveJoint_Request__init(msg: *mut MoveJoint_Request) -> bool;
    fn xarm_msgs__srv__MoveJoint_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<MoveJoint_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__MoveJoint_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<MoveJoint_Request>);
    fn xarm_msgs__srv__MoveJoint_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<MoveJoint_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<MoveJoint_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__MoveJoint_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct MoveJoint_Request {
    /// set_servo_angle/set_servo_angle_j
    pub angles: rosidl_runtime_rs::Sequence<f32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub speed: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub acc: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub mvtime: f32,

    /// set_servo_angle
    pub wait: bool,


    // This member is not documented.
    #[allow(missing_docs)]
    pub timeout: f32,

    /// set_servo_angle
    pub radius: f32,

    /// set_servo_angle
    pub relative: bool,

}



impl Default for MoveJoint_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__MoveJoint_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__MoveJoint_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for MoveJoint_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveJoint_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveJoint_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveJoint_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for MoveJoint_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for MoveJoint_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/MoveJoint_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__MoveJoint_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__MoveJoint_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__MoveJoint_Response__init(msg: *mut MoveJoint_Response) -> bool;
    fn xarm_msgs__srv__MoveJoint_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<MoveJoint_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__MoveJoint_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<MoveJoint_Response>);
    fn xarm_msgs__srv__MoveJoint_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<MoveJoint_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<MoveJoint_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__MoveJoint_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct MoveJoint_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for MoveJoint_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__MoveJoint_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__MoveJoint_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for MoveJoint_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveJoint_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveJoint_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveJoint_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for MoveJoint_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for MoveJoint_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/MoveJoint_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__MoveJoint_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__MoveVelocity_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__MoveVelocity_Request__init(msg: *mut MoveVelocity_Request) -> bool;
    fn xarm_msgs__srv__MoveVelocity_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<MoveVelocity_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__MoveVelocity_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<MoveVelocity_Request>);
    fn xarm_msgs__srv__MoveVelocity_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<MoveVelocity_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<MoveVelocity_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__MoveVelocity_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct MoveVelocity_Request {
    /// vc_set_joint_velocity/vc_set_cartesian_velocity
    pub speeds: rosidl_runtime_rs::Sequence<f32>,

    /// vc_set_joint_velocity
    pub is_sync: bool,

    /// vc_set_cartesian_velocity
    pub is_tool_coord: bool,

    /// the maximum duration of the spedd, over this time will automatically set the speed to 0
    ///   duration > 0: seconds, indicates the maximum number of seconds that this speed can be maintained
    ///   duration == 0: always effective, will not stop automativally
    ///   duration < 0: default value, only used to be compatible with the old protocol, equivalent to 0
    /// avaiable for firmware_version >= 1.8.0
    pub duration: f32,

}



impl Default for MoveVelocity_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__MoveVelocity_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__MoveVelocity_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for MoveVelocity_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveVelocity_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveVelocity_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveVelocity_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for MoveVelocity_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for MoveVelocity_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/MoveVelocity_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__MoveVelocity_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__MoveVelocity_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__MoveVelocity_Response__init(msg: *mut MoveVelocity_Response) -> bool;
    fn xarm_msgs__srv__MoveVelocity_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<MoveVelocity_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__MoveVelocity_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<MoveVelocity_Response>);
    fn xarm_msgs__srv__MoveVelocity_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<MoveVelocity_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<MoveVelocity_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__MoveVelocity_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct MoveVelocity_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for MoveVelocity_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__MoveVelocity_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__MoveVelocity_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for MoveVelocity_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveVelocity_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveVelocity_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__MoveVelocity_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for MoveVelocity_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for MoveVelocity_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/MoveVelocity_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__MoveVelocity_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__RobotiqActivate_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__RobotiqActivate_Request__init(msg: *mut RobotiqActivate_Request) -> bool;
    fn xarm_msgs__srv__RobotiqActivate_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<RobotiqActivate_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__RobotiqActivate_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<RobotiqActivate_Request>);
    fn xarm_msgs__srv__RobotiqActivate_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<RobotiqActivate_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<RobotiqActivate_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__RobotiqActivate_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct RobotiqActivate_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub wait: bool,


    // This member is not documented.
    #[allow(missing_docs)]
    pub timeout: f32,

}



impl Default for RobotiqActivate_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__RobotiqActivate_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__RobotiqActivate_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for RobotiqActivate_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqActivate_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqActivate_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqActivate_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for RobotiqActivate_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for RobotiqActivate_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/RobotiqActivate_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__RobotiqActivate_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__RobotiqActivate_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__RobotiqActivate_Response__init(msg: *mut RobotiqActivate_Response) -> bool;
    fn xarm_msgs__srv__RobotiqActivate_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<RobotiqActivate_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__RobotiqActivate_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<RobotiqActivate_Response>);
    fn xarm_msgs__srv__RobotiqActivate_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<RobotiqActivate_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<RobotiqActivate_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__RobotiqActivate_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct RobotiqActivate_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub ret_data: rosidl_runtime_rs::Sequence<u8>,

}



impl Default for RobotiqActivate_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__RobotiqActivate_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__RobotiqActivate_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for RobotiqActivate_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqActivate_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqActivate_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqActivate_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for RobotiqActivate_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for RobotiqActivate_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/RobotiqActivate_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__RobotiqActivate_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__RobotiqGetStatus_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__RobotiqGetStatus_Request__init(msg: *mut RobotiqGetStatus_Request) -> bool;
    fn xarm_msgs__srv__RobotiqGetStatus_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<RobotiqGetStatus_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__RobotiqGetStatus_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<RobotiqGetStatus_Request>);
    fn xarm_msgs__srv__RobotiqGetStatus_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<RobotiqGetStatus_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<RobotiqGetStatus_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__RobotiqGetStatus_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct RobotiqGetStatus_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub number_of_registers: u8,

}



impl Default for RobotiqGetStatus_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__RobotiqGetStatus_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__RobotiqGetStatus_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for RobotiqGetStatus_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqGetStatus_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqGetStatus_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqGetStatus_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for RobotiqGetStatus_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for RobotiqGetStatus_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/RobotiqGetStatus_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__RobotiqGetStatus_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__RobotiqGetStatus_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__RobotiqGetStatus_Response__init(msg: *mut RobotiqGetStatus_Response) -> bool;
    fn xarm_msgs__srv__RobotiqGetStatus_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<RobotiqGetStatus_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__RobotiqGetStatus_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<RobotiqGetStatus_Response>);
    fn xarm_msgs__srv__RobotiqGetStatus_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<RobotiqGetStatus_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<RobotiqGetStatus_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__RobotiqGetStatus_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct RobotiqGetStatus_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub ret_data: rosidl_runtime_rs::Sequence<u8>,

}



impl Default for RobotiqGetStatus_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__RobotiqGetStatus_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__RobotiqGetStatus_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for RobotiqGetStatus_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqGetStatus_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqGetStatus_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqGetStatus_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for RobotiqGetStatus_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for RobotiqGetStatus_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/RobotiqGetStatus_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__RobotiqGetStatus_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__RobotiqMove_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__RobotiqMove_Request__init(msg: *mut RobotiqMove_Request) -> bool;
    fn xarm_msgs__srv__RobotiqMove_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<RobotiqMove_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__RobotiqMove_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<RobotiqMove_Request>);
    fn xarm_msgs__srv__RobotiqMove_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<RobotiqMove_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<RobotiqMove_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__RobotiqMove_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct RobotiqMove_Request {
    /// robotiq_set_position
    pub pos: u8,

    /// robotiq_set_position/robotiq_open/robotiq_close
    pub speed: u8,


    // This member is not documented.
    #[allow(missing_docs)]
    pub force: u8,


    // This member is not documented.
    #[allow(missing_docs)]
    pub wait: bool,


    // This member is not documented.
    #[allow(missing_docs)]
    pub timeout: f32,

}



impl Default for RobotiqMove_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__RobotiqMove_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__RobotiqMove_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for RobotiqMove_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqMove_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqMove_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqMove_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for RobotiqMove_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for RobotiqMove_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/RobotiqMove_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__RobotiqMove_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__RobotiqMove_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__RobotiqMove_Response__init(msg: *mut RobotiqMove_Response) -> bool;
    fn xarm_msgs__srv__RobotiqMove_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<RobotiqMove_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__RobotiqMove_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<RobotiqMove_Response>);
    fn xarm_msgs__srv__RobotiqMove_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<RobotiqMove_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<RobotiqMove_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__RobotiqMove_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct RobotiqMove_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub ret_data: rosidl_runtime_rs::Sequence<u8>,

}



impl Default for RobotiqMove_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__RobotiqMove_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__RobotiqMove_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for RobotiqMove_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqMove_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqMove_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqMove_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for RobotiqMove_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for RobotiqMove_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/RobotiqMove_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__RobotiqMove_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__RobotiqReset_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__RobotiqReset_Request__init(msg: *mut RobotiqReset_Request) -> bool;
    fn xarm_msgs__srv__RobotiqReset_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<RobotiqReset_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__RobotiqReset_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<RobotiqReset_Request>);
    fn xarm_msgs__srv__RobotiqReset_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<RobotiqReset_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<RobotiqReset_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__RobotiqReset_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct RobotiqReset_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub structure_needs_at_least_one_member: u8,

}



impl Default for RobotiqReset_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__RobotiqReset_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__RobotiqReset_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for RobotiqReset_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqReset_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqReset_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqReset_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for RobotiqReset_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for RobotiqReset_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/RobotiqReset_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__RobotiqReset_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__RobotiqReset_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__RobotiqReset_Response__init(msg: *mut RobotiqReset_Response) -> bool;
    fn xarm_msgs__srv__RobotiqReset_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<RobotiqReset_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__RobotiqReset_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<RobotiqReset_Response>);
    fn xarm_msgs__srv__RobotiqReset_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<RobotiqReset_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<RobotiqReset_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__RobotiqReset_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct RobotiqReset_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub ret_data: rosidl_runtime_rs::Sequence<u8>,

}



impl Default for RobotiqReset_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__RobotiqReset_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__RobotiqReset_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for RobotiqReset_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqReset_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqReset_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__RobotiqReset_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for RobotiqReset_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for RobotiqReset_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/RobotiqReset_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__RobotiqReset_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetAnalogIO_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__SetAnalogIO_Request__init(msg: *mut SetAnalogIO_Request) -> bool;
    fn xarm_msgs__srv__SetAnalogIO_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetAnalogIO_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__SetAnalogIO_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetAnalogIO_Request>);
    fn xarm_msgs__srv__SetAnalogIO_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetAnalogIO_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<SetAnalogIO_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__SetAnalogIO_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetAnalogIO_Request {
    /// set_cgpio_analog/set_cgpio_analog_with_xyz
    pub ionum: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub value: f32,

    /// set_cgpio_analog_with_xyz
    pub xyz: rosidl_runtime_rs::Sequence<f32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub tol_r: f32,

}



impl Default for SetAnalogIO_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__SetAnalogIO_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__SetAnalogIO_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetAnalogIO_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetAnalogIO_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetAnalogIO_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetAnalogIO_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetAnalogIO_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetAnalogIO_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/SetAnalogIO_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetAnalogIO_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetAnalogIO_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__SetAnalogIO_Response__init(msg: *mut SetAnalogIO_Response) -> bool;
    fn xarm_msgs__srv__SetAnalogIO_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetAnalogIO_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__SetAnalogIO_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetAnalogIO_Response>);
    fn xarm_msgs__srv__SetAnalogIO_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetAnalogIO_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<SetAnalogIO_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__SetAnalogIO_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetAnalogIO_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for SetAnalogIO_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__SetAnalogIO_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__SetAnalogIO_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetAnalogIO_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetAnalogIO_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetAnalogIO_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetAnalogIO_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetAnalogIO_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetAnalogIO_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/SetAnalogIO_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetAnalogIO_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetDigitalIO_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__SetDigitalIO_Request__init(msg: *mut SetDigitalIO_Request) -> bool;
    fn xarm_msgs__srv__SetDigitalIO_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetDigitalIO_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__SetDigitalIO_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetDigitalIO_Request>);
    fn xarm_msgs__srv__SetDigitalIO_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetDigitalIO_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<SetDigitalIO_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__SetDigitalIO_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetDigitalIO_Request {
    /// set_tgpio_digital/set_cgpio_digital/set_tgpio_digital_with_xyz/set_cgpio_digital_with_xyz
    pub ionum: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub value: i16,

    /// set_tgpio_digital/set_cgpio_digital
    pub delay_sec: f32,

    /// set_tgpio_digital_with_xyz/set_cgpio_digital_with_xyz
    pub xyz: rosidl_runtime_rs::Sequence<f32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub tol_r: f32,

}



impl Default for SetDigitalIO_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__SetDigitalIO_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__SetDigitalIO_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetDigitalIO_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetDigitalIO_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetDigitalIO_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetDigitalIO_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetDigitalIO_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetDigitalIO_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/SetDigitalIO_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetDigitalIO_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetDigitalIO_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__SetDigitalIO_Response__init(msg: *mut SetDigitalIO_Response) -> bool;
    fn xarm_msgs__srv__SetDigitalIO_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetDigitalIO_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__SetDigitalIO_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetDigitalIO_Response>);
    fn xarm_msgs__srv__SetDigitalIO_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetDigitalIO_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<SetDigitalIO_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__SetDigitalIO_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetDigitalIO_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for SetDigitalIO_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__SetDigitalIO_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__SetDigitalIO_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetDigitalIO_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetDigitalIO_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetDigitalIO_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetDigitalIO_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetDigitalIO_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetDigitalIO_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/SetDigitalIO_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetDigitalIO_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetFloat32_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__SetFloat32_Request__init(msg: *mut SetFloat32_Request) -> bool;
    fn xarm_msgs__srv__SetFloat32_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetFloat32_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__SetFloat32_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetFloat32_Request>);
    fn xarm_msgs__srv__SetFloat32_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetFloat32_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<SetFloat32_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__SetFloat32_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetFloat32_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub data: f32,

}



impl Default for SetFloat32_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__SetFloat32_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__SetFloat32_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetFloat32_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetFloat32_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetFloat32_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetFloat32_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetFloat32_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetFloat32_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/SetFloat32_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetFloat32_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetFloat32_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__SetFloat32_Response__init(msg: *mut SetFloat32_Response) -> bool;
    fn xarm_msgs__srv__SetFloat32_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetFloat32_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__SetFloat32_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetFloat32_Response>);
    fn xarm_msgs__srv__SetFloat32_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetFloat32_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<SetFloat32_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__SetFloat32_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetFloat32_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for SetFloat32_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__SetFloat32_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__SetFloat32_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetFloat32_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetFloat32_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetFloat32_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetFloat32_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetFloat32_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetFloat32_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/SetFloat32_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetFloat32_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetFloat32List_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__SetFloat32List_Request__init(msg: *mut SetFloat32List_Request) -> bool;
    fn xarm_msgs__srv__SetFloat32List_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetFloat32List_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__SetFloat32List_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetFloat32List_Request>);
    fn xarm_msgs__srv__SetFloat32List_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetFloat32List_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<SetFloat32List_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__SetFloat32List_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetFloat32List_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub datas: rosidl_runtime_rs::Sequence<f32>,

}



impl Default for SetFloat32List_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__SetFloat32List_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__SetFloat32List_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetFloat32List_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetFloat32List_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetFloat32List_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetFloat32List_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetFloat32List_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetFloat32List_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/SetFloat32List_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetFloat32List_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetFloat32List_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__SetFloat32List_Response__init(msg: *mut SetFloat32List_Response) -> bool;
    fn xarm_msgs__srv__SetFloat32List_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetFloat32List_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__SetFloat32List_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetFloat32List_Response>);
    fn xarm_msgs__srv__SetFloat32List_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetFloat32List_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<SetFloat32List_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__SetFloat32List_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetFloat32List_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for SetFloat32List_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__SetFloat32List_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__SetFloat32List_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetFloat32List_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetFloat32List_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetFloat32List_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetFloat32List_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetFloat32List_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetFloat32List_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/SetFloat32List_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetFloat32List_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetInt16_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__SetInt16_Request__init(msg: *mut SetInt16_Request) -> bool;
    fn xarm_msgs__srv__SetInt16_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetInt16_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__SetInt16_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetInt16_Request>);
    fn xarm_msgs__srv__SetInt16_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetInt16_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<SetInt16_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__SetInt16_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetInt16_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub data: i16,

}



impl Default for SetInt16_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__SetInt16_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__SetInt16_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetInt16_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt16_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt16_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt16_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetInt16_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetInt16_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/SetInt16_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetInt16_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetInt16_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__SetInt16_Response__init(msg: *mut SetInt16_Response) -> bool;
    fn xarm_msgs__srv__SetInt16_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetInt16_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__SetInt16_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetInt16_Response>);
    fn xarm_msgs__srv__SetInt16_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetInt16_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<SetInt16_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__SetInt16_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetInt16_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for SetInt16_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__SetInt16_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__SetInt16_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetInt16_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt16_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt16_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt16_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetInt16_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetInt16_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/SetInt16_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetInt16_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetInt16ById_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__SetInt16ById_Request__init(msg: *mut SetInt16ById_Request) -> bool;
    fn xarm_msgs__srv__SetInt16ById_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetInt16ById_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__SetInt16ById_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetInt16ById_Request>);
    fn xarm_msgs__srv__SetInt16ById_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetInt16ById_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<SetInt16ById_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__SetInt16ById_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetInt16ById_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub id: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub data: i16,

}



impl Default for SetInt16ById_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__SetInt16ById_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__SetInt16ById_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetInt16ById_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt16ById_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt16ById_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt16ById_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetInt16ById_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetInt16ById_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/SetInt16ById_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetInt16ById_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetInt16ById_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__SetInt16ById_Response__init(msg: *mut SetInt16ById_Response) -> bool;
    fn xarm_msgs__srv__SetInt16ById_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetInt16ById_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__SetInt16ById_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetInt16ById_Response>);
    fn xarm_msgs__srv__SetInt16ById_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetInt16ById_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<SetInt16ById_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__SetInt16ById_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetInt16ById_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for SetInt16ById_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__SetInt16ById_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__SetInt16ById_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetInt16ById_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt16ById_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt16ById_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt16ById_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetInt16ById_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetInt16ById_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/SetInt16ById_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetInt16ById_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetInt16List_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__SetInt16List_Request__init(msg: *mut SetInt16List_Request) -> bool;
    fn xarm_msgs__srv__SetInt16List_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetInt16List_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__SetInt16List_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetInt16List_Request>);
    fn xarm_msgs__srv__SetInt16List_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetInt16List_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<SetInt16List_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__SetInt16List_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetInt16List_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub datas: rosidl_runtime_rs::Sequence<i16>,

}



impl Default for SetInt16List_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__SetInt16List_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__SetInt16List_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetInt16List_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt16List_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt16List_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt16List_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetInt16List_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetInt16List_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/SetInt16List_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetInt16List_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetInt16List_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__SetInt16List_Response__init(msg: *mut SetInt16List_Response) -> bool;
    fn xarm_msgs__srv__SetInt16List_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetInt16List_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__SetInt16List_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetInt16List_Response>);
    fn xarm_msgs__srv__SetInt16List_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetInt16List_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<SetInt16List_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__SetInt16List_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetInt16List_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for SetInt16List_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__SetInt16List_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__SetInt16List_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetInt16List_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt16List_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt16List_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt16List_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetInt16List_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetInt16List_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/SetInt16List_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetInt16List_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetInt32_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__SetInt32_Request__init(msg: *mut SetInt32_Request) -> bool;
    fn xarm_msgs__srv__SetInt32_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetInt32_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__SetInt32_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetInt32_Request>);
    fn xarm_msgs__srv__SetInt32_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetInt32_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<SetInt32_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__SetInt32_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetInt32_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub data: i32,

}



impl Default for SetInt32_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__SetInt32_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__SetInt32_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetInt32_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt32_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt32_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt32_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetInt32_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetInt32_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/SetInt32_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetInt32_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetInt32_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__SetInt32_Response__init(msg: *mut SetInt32_Response) -> bool;
    fn xarm_msgs__srv__SetInt32_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetInt32_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__SetInt32_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetInt32_Response>);
    fn xarm_msgs__srv__SetInt32_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetInt32_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<SetInt32_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__SetInt32_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetInt32_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for SetInt32_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__SetInt32_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__SetInt32_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetInt32_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt32_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt32_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt32_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetInt32_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetInt32_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/SetInt32_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetInt32_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetInt32ByType_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__SetInt32ByType_Request__init(msg: *mut SetInt32ByType_Request) -> bool;
    fn xarm_msgs__srv__SetInt32ByType_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetInt32ByType_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__SetInt32ByType_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetInt32ByType_Request>);
    fn xarm_msgs__srv__SetInt32ByType_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetInt32ByType_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<SetInt32ByType_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__SetInt32ByType_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetInt32ByType_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub type_: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub data: i32,

}



impl Default for SetInt32ByType_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__SetInt32ByType_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__SetInt32ByType_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetInt32ByType_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt32ByType_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt32ByType_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt32ByType_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetInt32ByType_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetInt32ByType_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/SetInt32ByType_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetInt32ByType_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetInt32ByType_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__SetInt32ByType_Response__init(msg: *mut SetInt32ByType_Response) -> bool;
    fn xarm_msgs__srv__SetInt32ByType_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetInt32ByType_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__SetInt32ByType_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetInt32ByType_Response>);
    fn xarm_msgs__srv__SetInt32ByType_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetInt32ByType_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<SetInt32ByType_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__SetInt32ByType_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetInt32ByType_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for SetInt32ByType_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__SetInt32ByType_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__SetInt32ByType_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetInt32ByType_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt32ByType_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt32ByType_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetInt32ByType_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetInt32ByType_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetInt32ByType_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/SetInt32ByType_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetInt32ByType_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__TrajCtrl_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__TrajCtrl_Request__init(msg: *mut TrajCtrl_Request) -> bool;
    fn xarm_msgs__srv__TrajCtrl_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<TrajCtrl_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__TrajCtrl_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<TrajCtrl_Request>);
    fn xarm_msgs__srv__TrajCtrl_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<TrajCtrl_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<TrajCtrl_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__TrajCtrl_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct TrajCtrl_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub filename: rosidl_runtime_rs::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub timeout: f32,

}



impl Default for TrajCtrl_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__TrajCtrl_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__TrajCtrl_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for TrajCtrl_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__TrajCtrl_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__TrajCtrl_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__TrajCtrl_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for TrajCtrl_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for TrajCtrl_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/TrajCtrl_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__TrajCtrl_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__TrajCtrl_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__TrajCtrl_Response__init(msg: *mut TrajCtrl_Response) -> bool;
    fn xarm_msgs__srv__TrajCtrl_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<TrajCtrl_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__TrajCtrl_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<TrajCtrl_Response>);
    fn xarm_msgs__srv__TrajCtrl_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<TrajCtrl_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<TrajCtrl_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__TrajCtrl_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct TrajCtrl_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for TrajCtrl_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__TrajCtrl_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__TrajCtrl_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for TrajCtrl_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__TrajCtrl_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__TrajCtrl_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__TrajCtrl_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for TrajCtrl_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for TrajCtrl_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/TrajCtrl_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__TrajCtrl_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__TrajPlay_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__TrajPlay_Request__init(msg: *mut TrajPlay_Request) -> bool;
    fn xarm_msgs__srv__TrajPlay_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<TrajPlay_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__TrajPlay_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<TrajPlay_Request>);
    fn xarm_msgs__srv__TrajPlay_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<TrajPlay_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<TrajPlay_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__TrajPlay_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct TrajPlay_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub filename: rosidl_runtime_rs::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub times: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub double_speed: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub wait: bool,

}



impl Default for TrajPlay_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__TrajPlay_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__TrajPlay_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for TrajPlay_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__TrajPlay_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__TrajPlay_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__TrajPlay_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for TrajPlay_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for TrajPlay_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/TrajPlay_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__TrajPlay_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__TrajPlay_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__TrajPlay_Response__init(msg: *mut TrajPlay_Response) -> bool;
    fn xarm_msgs__srv__TrajPlay_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<TrajPlay_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__TrajPlay_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<TrajPlay_Response>);
    fn xarm_msgs__srv__TrajPlay_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<TrajPlay_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<TrajPlay_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__TrajPlay_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct TrajPlay_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for TrajPlay_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__TrajPlay_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__TrajPlay_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for TrajPlay_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__TrajPlay_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__TrajPlay_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__TrajPlay_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for TrajPlay_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for TrajPlay_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/TrajPlay_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__TrajPlay_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__VacuumGripperCtrl_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__VacuumGripperCtrl_Request__init(msg: *mut VacuumGripperCtrl_Request) -> bool;
    fn xarm_msgs__srv__VacuumGripperCtrl_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<VacuumGripperCtrl_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__VacuumGripperCtrl_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<VacuumGripperCtrl_Request>);
    fn xarm_msgs__srv__VacuumGripperCtrl_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<VacuumGripperCtrl_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<VacuumGripperCtrl_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__VacuumGripperCtrl_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct VacuumGripperCtrl_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub on: bool,


    // This member is not documented.
    #[allow(missing_docs)]
    pub wait: bool,


    // This member is not documented.
    #[allow(missing_docs)]
    pub timeout: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub delay_sec: f32,

}



impl Default for VacuumGripperCtrl_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__VacuumGripperCtrl_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__VacuumGripperCtrl_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for VacuumGripperCtrl_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__VacuumGripperCtrl_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__VacuumGripperCtrl_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__VacuumGripperCtrl_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for VacuumGripperCtrl_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for VacuumGripperCtrl_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/VacuumGripperCtrl_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__VacuumGripperCtrl_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__VacuumGripperCtrl_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__VacuumGripperCtrl_Response__init(msg: *mut VacuumGripperCtrl_Response) -> bool;
    fn xarm_msgs__srv__VacuumGripperCtrl_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<VacuumGripperCtrl_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__VacuumGripperCtrl_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<VacuumGripperCtrl_Response>);
    fn xarm_msgs__srv__VacuumGripperCtrl_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<VacuumGripperCtrl_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<VacuumGripperCtrl_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__VacuumGripperCtrl_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct VacuumGripperCtrl_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for VacuumGripperCtrl_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__VacuumGripperCtrl_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__VacuumGripperCtrl_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for VacuumGripperCtrl_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__VacuumGripperCtrl_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__VacuumGripperCtrl_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__VacuumGripperCtrl_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for VacuumGripperCtrl_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for VacuumGripperCtrl_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/VacuumGripperCtrl_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__VacuumGripperCtrl_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetTcpLoad_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__SetTcpLoad_Request__init(msg: *mut SetTcpLoad_Request) -> bool;
    fn xarm_msgs__srv__SetTcpLoad_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetTcpLoad_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__SetTcpLoad_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetTcpLoad_Request>);
    fn xarm_msgs__srv__SetTcpLoad_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetTcpLoad_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<SetTcpLoad_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__SetTcpLoad_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetTcpLoad_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub weight: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub center_of_gravity: rosidl_runtime_rs::Sequence<f32>,

}



impl Default for SetTcpLoad_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__SetTcpLoad_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__SetTcpLoad_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetTcpLoad_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetTcpLoad_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetTcpLoad_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetTcpLoad_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetTcpLoad_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetTcpLoad_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/SetTcpLoad_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetTcpLoad_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetTcpLoad_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__SetTcpLoad_Response__init(msg: *mut SetTcpLoad_Response) -> bool;
    fn xarm_msgs__srv__SetTcpLoad_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetTcpLoad_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__SetTcpLoad_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetTcpLoad_Response>);
    fn xarm_msgs__srv__SetTcpLoad_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetTcpLoad_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<SetTcpLoad_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__SetTcpLoad_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetTcpLoad_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for SetTcpLoad_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__SetTcpLoad_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__SetTcpLoad_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetTcpLoad_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetTcpLoad_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetTcpLoad_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetTcpLoad_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetTcpLoad_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetTcpLoad_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/SetTcpLoad_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetTcpLoad_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetModbusTimeout_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__SetModbusTimeout_Request__init(msg: *mut SetModbusTimeout_Request) -> bool;
    fn xarm_msgs__srv__SetModbusTimeout_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetModbusTimeout_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__SetModbusTimeout_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetModbusTimeout_Request>);
    fn xarm_msgs__srv__SetModbusTimeout_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetModbusTimeout_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<SetModbusTimeout_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__SetModbusTimeout_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetModbusTimeout_Request {
    /// set the timeout parameter in modbus communication, in milliseconds
    pub timeout: i32,

    /// whether the set timeout is the timeout of transparent transmission
    pub is_transparent_transmission: bool,

}



impl Default for SetModbusTimeout_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__SetModbusTimeout_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__SetModbusTimeout_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetModbusTimeout_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetModbusTimeout_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetModbusTimeout_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetModbusTimeout_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetModbusTimeout_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetModbusTimeout_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/SetModbusTimeout_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetModbusTimeout_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetModbusTimeout_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__SetModbusTimeout_Response__init(msg: *mut SetModbusTimeout_Response) -> bool;
    fn xarm_msgs__srv__SetModbusTimeout_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<SetModbusTimeout_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__SetModbusTimeout_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<SetModbusTimeout_Response>);
    fn xarm_msgs__srv__SetModbusTimeout_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<SetModbusTimeout_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<SetModbusTimeout_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__SetModbusTimeout_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetModbusTimeout_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for SetModbusTimeout_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__SetModbusTimeout_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__SetModbusTimeout_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for SetModbusTimeout_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetModbusTimeout_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetModbusTimeout_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__SetModbusTimeout_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for SetModbusTimeout_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for SetModbusTimeout_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/SetModbusTimeout_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__SetModbusTimeout_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__IdenLoad_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__IdenLoad_Request__init(msg: *mut IdenLoad_Request) -> bool;
    fn xarm_msgs__srv__IdenLoad_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<IdenLoad_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__IdenLoad_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<IdenLoad_Request>);
    fn xarm_msgs__srv__IdenLoad_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<IdenLoad_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<IdenLoad_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__IdenLoad_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct IdenLoad_Request {
    /// estimated mass(kg), only required for Lite6 models via the `iden_tcp_load` service
    pub estimated_mass: f32,

}



impl Default for IdenLoad_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__IdenLoad_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__IdenLoad_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for IdenLoad_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__IdenLoad_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__IdenLoad_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__IdenLoad_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for IdenLoad_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for IdenLoad_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/IdenLoad_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__IdenLoad_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__IdenLoad_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__IdenLoad_Response__init(msg: *mut IdenLoad_Response) -> bool;
    fn xarm_msgs__srv__IdenLoad_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<IdenLoad_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__IdenLoad_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<IdenLoad_Response>);
    fn xarm_msgs__srv__IdenLoad_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<IdenLoad_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<IdenLoad_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__IdenLoad_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct IdenLoad_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

    /// the result of identification
    ///   iden_tcp_load: [mass(kg)，x_centroid(mm)，y_centroid(mm)，z_centroid(mm)]
    ///   ft_sensor_iden_load: [mass(kg)，x_centroid(mm)，y_centroid(mm)，z_centroid(mm)，Fx_offset，Fy_offset，Fz_offset，Tx_offset，Ty_offset，Tz_ffset]
    pub datas: rosidl_runtime_rs::Sequence<f32>,

}



impl Default for IdenLoad_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__IdenLoad_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__IdenLoad_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for IdenLoad_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__IdenLoad_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__IdenLoad_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__IdenLoad_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for IdenLoad_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for IdenLoad_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/IdenLoad_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__IdenLoad_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__FtCaliLoad_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__FtCaliLoad_Request__init(msg: *mut FtCaliLoad_Request) -> bool;
    fn xarm_msgs__srv__FtCaliLoad_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<FtCaliLoad_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__FtCaliLoad_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<FtCaliLoad_Request>);
    fn xarm_msgs__srv__FtCaliLoad_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<FtCaliLoad_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<FtCaliLoad_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__FtCaliLoad_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct FtCaliLoad_Request {
    /// iden result()
    pub datas: rosidl_runtime_rs::Sequence<f32>,

    /// whether to convert the paramster to the corresponding tcp load and set, default is false
    pub association_setting_tcp_load: bool,


    // This member is not documented.
    #[allow(missing_docs)]
    pub m: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub x: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub y: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub z: f32,

}



impl Default for FtCaliLoad_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__FtCaliLoad_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__FtCaliLoad_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for FtCaliLoad_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtCaliLoad_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtCaliLoad_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtCaliLoad_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for FtCaliLoad_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for FtCaliLoad_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/FtCaliLoad_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__FtCaliLoad_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__FtCaliLoad_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__FtCaliLoad_Response__init(msg: *mut FtCaliLoad_Response) -> bool;
    fn xarm_msgs__srv__FtCaliLoad_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<FtCaliLoad_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__FtCaliLoad_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<FtCaliLoad_Response>);
    fn xarm_msgs__srv__FtCaliLoad_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<FtCaliLoad_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<FtCaliLoad_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__FtCaliLoad_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct FtCaliLoad_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for FtCaliLoad_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__FtCaliLoad_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__FtCaliLoad_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for FtCaliLoad_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtCaliLoad_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtCaliLoad_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtCaliLoad_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for FtCaliLoad_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for FtCaliLoad_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/FtCaliLoad_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__FtCaliLoad_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__FtForceConfig_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__FtForceConfig_Request__init(msg: *mut FtForceConfig_Request) -> bool;
    fn xarm_msgs__srv__FtForceConfig_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<FtForceConfig_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__FtForceConfig_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<FtForceConfig_Request>);
    fn xarm_msgs__srv__FtForceConfig_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<FtForceConfig_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<FtForceConfig_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__FtForceConfig_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct FtForceConfig_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub coord: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub c_axis: rosidl_runtime_rs::Sequence<i16>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub ref_: rosidl_runtime_rs::Sequence<f32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub limits: rosidl_runtime_rs::Sequence<f32>,

}



impl Default for FtForceConfig_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__FtForceConfig_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__FtForceConfig_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for FtForceConfig_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtForceConfig_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtForceConfig_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtForceConfig_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for FtForceConfig_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for FtForceConfig_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/FtForceConfig_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__FtForceConfig_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__FtForceConfig_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__FtForceConfig_Response__init(msg: *mut FtForceConfig_Response) -> bool;
    fn xarm_msgs__srv__FtForceConfig_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<FtForceConfig_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__FtForceConfig_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<FtForceConfig_Response>);
    fn xarm_msgs__srv__FtForceConfig_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<FtForceConfig_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<FtForceConfig_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__FtForceConfig_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct FtForceConfig_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for FtForceConfig_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__FtForceConfig_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__FtForceConfig_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for FtForceConfig_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtForceConfig_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtForceConfig_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtForceConfig_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for FtForceConfig_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for FtForceConfig_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/FtForceConfig_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__FtForceConfig_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__FtForcePid_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__FtForcePid_Request__init(msg: *mut FtForcePid_Request) -> bool;
    fn xarm_msgs__srv__FtForcePid_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<FtForcePid_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__FtForcePid_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<FtForcePid_Request>);
    fn xarm_msgs__srv__FtForcePid_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<FtForcePid_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<FtForcePid_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__FtForcePid_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct FtForcePid_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub kp: rosidl_runtime_rs::Sequence<f32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub ki: rosidl_runtime_rs::Sequence<f32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub kd: rosidl_runtime_rs::Sequence<f32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub xe_limit: rosidl_runtime_rs::Sequence<f32>,

}



impl Default for FtForcePid_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__FtForcePid_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__FtForcePid_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for FtForcePid_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtForcePid_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtForcePid_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtForcePid_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for FtForcePid_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for FtForcePid_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/FtForcePid_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__FtForcePid_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__FtForcePid_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__FtForcePid_Response__init(msg: *mut FtForcePid_Response) -> bool;
    fn xarm_msgs__srv__FtForcePid_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<FtForcePid_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__FtForcePid_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<FtForcePid_Response>);
    fn xarm_msgs__srv__FtForcePid_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<FtForcePid_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<FtForcePid_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__FtForcePid_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct FtForcePid_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for FtForcePid_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__FtForcePid_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__FtForcePid_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for FtForcePid_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtForcePid_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtForcePid_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtForcePid_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for FtForcePid_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for FtForcePid_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/FtForcePid_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__FtForcePid_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__FtImpedance_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__FtImpedance_Request__init(msg: *mut FtImpedance_Request) -> bool;
    fn xarm_msgs__srv__FtImpedance_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<FtImpedance_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__FtImpedance_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<FtImpedance_Request>);
    fn xarm_msgs__srv__FtImpedance_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<FtImpedance_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<FtImpedance_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__FtImpedance_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct FtImpedance_Request {
    /// - set_impedance
    /// - set_impedance_config
    pub coord: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub c_axis: rosidl_runtime_rs::Sequence<i16>,

    /// - set_impedance
    /// - set_impedance_mbk
    pub m: rosidl_runtime_rs::Sequence<f32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub k: rosidl_runtime_rs::Sequence<f32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub b: rosidl_runtime_rs::Sequence<f32>,

}



impl Default for FtImpedance_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__FtImpedance_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__FtImpedance_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for FtImpedance_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtImpedance_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtImpedance_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtImpedance_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for FtImpedance_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for FtImpedance_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/FtImpedance_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__FtImpedance_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__FtImpedance_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__FtImpedance_Response__init(msg: *mut FtImpedance_Response) -> bool;
    fn xarm_msgs__srv__FtImpedance_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<FtImpedance_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__FtImpedance_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<FtImpedance_Response>);
    fn xarm_msgs__srv__FtImpedance_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<FtImpedance_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<FtImpedance_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__FtImpedance_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct FtImpedance_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for FtImpedance_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__FtImpedance_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__FtImpedance_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for FtImpedance_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtImpedance_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtImpedance_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__FtImpedance_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for FtImpedance_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for FtImpedance_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/FtImpedance_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__FtImpedance_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__LinearTrackBackOrigin_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__LinearTrackBackOrigin_Request__init(msg: *mut LinearTrackBackOrigin_Request) -> bool;
    fn xarm_msgs__srv__LinearTrackBackOrigin_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<LinearTrackBackOrigin_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__LinearTrackBackOrigin_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<LinearTrackBackOrigin_Request>);
    fn xarm_msgs__srv__LinearTrackBackOrigin_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<LinearTrackBackOrigin_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<LinearTrackBackOrigin_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__LinearTrackBackOrigin_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct LinearTrackBackOrigin_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub wait: bool,


    // This member is not documented.
    #[allow(missing_docs)]
    pub auto_enable: bool,

}



impl Default for LinearTrackBackOrigin_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__LinearTrackBackOrigin_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__LinearTrackBackOrigin_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for LinearTrackBackOrigin_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__LinearTrackBackOrigin_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__LinearTrackBackOrigin_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__LinearTrackBackOrigin_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for LinearTrackBackOrigin_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for LinearTrackBackOrigin_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/LinearTrackBackOrigin_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__LinearTrackBackOrigin_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__LinearTrackBackOrigin_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__LinearTrackBackOrigin_Response__init(msg: *mut LinearTrackBackOrigin_Response) -> bool;
    fn xarm_msgs__srv__LinearTrackBackOrigin_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<LinearTrackBackOrigin_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__LinearTrackBackOrigin_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<LinearTrackBackOrigin_Response>);
    fn xarm_msgs__srv__LinearTrackBackOrigin_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<LinearTrackBackOrigin_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<LinearTrackBackOrigin_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__LinearTrackBackOrigin_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct LinearTrackBackOrigin_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for LinearTrackBackOrigin_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__LinearTrackBackOrigin_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__LinearTrackBackOrigin_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for LinearTrackBackOrigin_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__LinearTrackBackOrigin_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__LinearTrackBackOrigin_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__LinearTrackBackOrigin_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for LinearTrackBackOrigin_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for LinearTrackBackOrigin_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/LinearTrackBackOrigin_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__LinearTrackBackOrigin_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__LinearTrackSetPos_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__LinearTrackSetPos_Request__init(msg: *mut LinearTrackSetPos_Request) -> bool;
    fn xarm_msgs__srv__LinearTrackSetPos_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<LinearTrackSetPos_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__LinearTrackSetPos_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<LinearTrackSetPos_Request>);
    fn xarm_msgs__srv__LinearTrackSetPos_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<LinearTrackSetPos_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<LinearTrackSetPos_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__LinearTrackSetPos_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct LinearTrackSetPos_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub pos: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub speed: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub wait: bool,


    // This member is not documented.
    #[allow(missing_docs)]
    pub timeout: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub auto_enable: bool,

}



impl Default for LinearTrackSetPos_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__LinearTrackSetPos_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__LinearTrackSetPos_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for LinearTrackSetPos_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__LinearTrackSetPos_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__LinearTrackSetPos_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__LinearTrackSetPos_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for LinearTrackSetPos_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for LinearTrackSetPos_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/LinearTrackSetPos_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__LinearTrackSetPos_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__LinearTrackSetPos_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__LinearTrackSetPos_Response__init(msg: *mut LinearTrackSetPos_Response) -> bool;
    fn xarm_msgs__srv__LinearTrackSetPos_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<LinearTrackSetPos_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__LinearTrackSetPos_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<LinearTrackSetPos_Response>);
    fn xarm_msgs__srv__LinearTrackSetPos_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<LinearTrackSetPos_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<LinearTrackSetPos_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__LinearTrackSetPos_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct LinearTrackSetPos_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: rosidl_runtime_rs::String,

}



impl Default for LinearTrackSetPos_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__LinearTrackSetPos_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__LinearTrackSetPos_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for LinearTrackSetPos_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__LinearTrackSetPos_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__LinearTrackSetPos_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__LinearTrackSetPos_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for LinearTrackSetPos_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for LinearTrackSetPos_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/LinearTrackSetPos_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__LinearTrackSetPos_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__PlanExec_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__PlanExec_Request__init(msg: *mut PlanExec_Request) -> bool;
    fn xarm_msgs__srv__PlanExec_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<PlanExec_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__PlanExec_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<PlanExec_Request>);
    fn xarm_msgs__srv__PlanExec_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<PlanExec_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<PlanExec_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__PlanExec_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct PlanExec_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub wait: bool,

}



impl Default for PlanExec_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__PlanExec_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__PlanExec_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for PlanExec_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanExec_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanExec_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanExec_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for PlanExec_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for PlanExec_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/PlanExec_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__PlanExec_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__PlanExec_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__PlanExec_Response__init(msg: *mut PlanExec_Response) -> bool;
    fn xarm_msgs__srv__PlanExec_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<PlanExec_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__PlanExec_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<PlanExec_Response>);
    fn xarm_msgs__srv__PlanExec_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<PlanExec_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<PlanExec_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__PlanExec_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct PlanExec_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub success: bool,

}



impl Default for PlanExec_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__PlanExec_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__PlanExec_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for PlanExec_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanExec_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanExec_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanExec_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for PlanExec_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for PlanExec_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/PlanExec_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__PlanExec_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__PlanJoint_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__PlanJoint_Request__init(msg: *mut PlanJoint_Request) -> bool;
    fn xarm_msgs__srv__PlanJoint_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<PlanJoint_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__PlanJoint_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<PlanJoint_Request>);
    fn xarm_msgs__srv__PlanJoint_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<PlanJoint_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<PlanJoint_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__PlanJoint_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct PlanJoint_Request {
    /// list of target joint positions in radian.
    pub target: rosidl_runtime_rs::Sequence<f64>,

}



impl Default for PlanJoint_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__PlanJoint_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__PlanJoint_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for PlanJoint_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanJoint_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanJoint_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanJoint_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for PlanJoint_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for PlanJoint_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/PlanJoint_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__PlanJoint_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__PlanJoint_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__PlanJoint_Response__init(msg: *mut PlanJoint_Response) -> bool;
    fn xarm_msgs__srv__PlanJoint_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<PlanJoint_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__PlanJoint_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<PlanJoint_Response>);
    fn xarm_msgs__srv__PlanJoint_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<PlanJoint_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<PlanJoint_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__PlanJoint_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct PlanJoint_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub success: bool,

}



impl Default for PlanJoint_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__PlanJoint_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__PlanJoint_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for PlanJoint_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanJoint_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanJoint_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanJoint_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for PlanJoint_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for PlanJoint_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/PlanJoint_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__PlanJoint_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__PlanPose_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__PlanPose_Request__init(msg: *mut PlanPose_Request) -> bool;
    fn xarm_msgs__srv__PlanPose_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<PlanPose_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__PlanPose_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<PlanPose_Request>);
    fn xarm_msgs__srv__PlanPose_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<PlanPose_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<PlanPose_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__PlanPose_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct PlanPose_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub target: geometry_msgs::msg::rmw::Pose,

}



impl Default for PlanPose_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__PlanPose_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__PlanPose_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for PlanPose_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanPose_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanPose_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanPose_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for PlanPose_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for PlanPose_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/PlanPose_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__PlanPose_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__PlanPose_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__PlanPose_Response__init(msg: *mut PlanPose_Response) -> bool;
    fn xarm_msgs__srv__PlanPose_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<PlanPose_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__PlanPose_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<PlanPose_Response>);
    fn xarm_msgs__srv__PlanPose_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<PlanPose_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<PlanPose_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__PlanPose_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct PlanPose_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub success: bool,

}



impl Default for PlanPose_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__PlanPose_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__PlanPose_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for PlanPose_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanPose_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanPose_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanPose_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for PlanPose_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for PlanPose_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/PlanPose_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__PlanPose_Response() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__PlanSingleStraight_Request() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__PlanSingleStraight_Request__init(msg: *mut PlanSingleStraight_Request) -> bool;
    fn xarm_msgs__srv__PlanSingleStraight_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<PlanSingleStraight_Request>, size: usize) -> bool;
    fn xarm_msgs__srv__PlanSingleStraight_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<PlanSingleStraight_Request>);
    fn xarm_msgs__srv__PlanSingleStraight_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<PlanSingleStraight_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<PlanSingleStraight_Request>) -> bool;
}

// Corresponds to xarm_msgs__srv__PlanSingleStraight_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct PlanSingleStraight_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub target: geometry_msgs::msg::rmw::Pose,

}



impl Default for PlanSingleStraight_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__PlanSingleStraight_Request__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__PlanSingleStraight_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for PlanSingleStraight_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanSingleStraight_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanSingleStraight_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanSingleStraight_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for PlanSingleStraight_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for PlanSingleStraight_Request where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/PlanSingleStraight_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__PlanSingleStraight_Request() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__PlanSingleStraight_Response() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__srv__PlanSingleStraight_Response__init(msg: *mut PlanSingleStraight_Response) -> bool;
    fn xarm_msgs__srv__PlanSingleStraight_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<PlanSingleStraight_Response>, size: usize) -> bool;
    fn xarm_msgs__srv__PlanSingleStraight_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<PlanSingleStraight_Response>);
    fn xarm_msgs__srv__PlanSingleStraight_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<PlanSingleStraight_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<PlanSingleStraight_Response>) -> bool;
}

// Corresponds to xarm_msgs__srv__PlanSingleStraight_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct PlanSingleStraight_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub success: bool,

}



impl Default for PlanSingleStraight_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__srv__PlanSingleStraight_Response__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__srv__PlanSingleStraight_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for PlanSingleStraight_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanSingleStraight_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanSingleStraight_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__srv__PlanSingleStraight_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for PlanSingleStraight_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for PlanSingleStraight_Response where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/srv/PlanSingleStraight_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__srv__PlanSingleStraight_Response() }
  }
}






#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__BioGripperCtrl() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__BioGripperCtrl
#[allow(missing_docs, non_camel_case_types)]
pub struct BioGripperCtrl;

impl rosidl_runtime_rs::Service for BioGripperCtrl {
    type Request = BioGripperCtrl_Request;
    type Response = BioGripperCtrl_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__BioGripperCtrl() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__BioGripperEnable() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__BioGripperEnable
#[allow(missing_docs, non_camel_case_types)]
pub struct BioGripperEnable;

impl rosidl_runtime_rs::Service for BioGripperEnable {
    type Request = BioGripperEnable_Request;
    type Response = BioGripperEnable_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__BioGripperEnable() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__Call() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__Call
#[allow(missing_docs, non_camel_case_types)]
pub struct Call;

impl rosidl_runtime_rs::Service for Call {
    type Request = Call_Request;
    type Response = Call_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__Call() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__GetAnalogIO() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__GetAnalogIO
#[allow(missing_docs, non_camel_case_types)]
pub struct GetAnalogIO;

impl rosidl_runtime_rs::Service for GetAnalogIO {
    type Request = GetAnalogIO_Request;
    type Response = GetAnalogIO_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__GetAnalogIO() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__GetDigitalIO() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__GetDigitalIO
#[allow(missing_docs, non_camel_case_types)]
pub struct GetDigitalIO;

impl rosidl_runtime_rs::Service for GetDigitalIO {
    type Request = GetDigitalIO_Request;
    type Response = GetDigitalIO_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__GetDigitalIO() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__GetFloat32() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__GetFloat32
#[allow(missing_docs, non_camel_case_types)]
pub struct GetFloat32;

impl rosidl_runtime_rs::Service for GetFloat32 {
    type Request = GetFloat32_Request;
    type Response = GetFloat32_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__GetFloat32() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__GetFloat32List() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__GetFloat32List
#[allow(missing_docs, non_camel_case_types)]
pub struct GetFloat32List;

impl rosidl_runtime_rs::Service for GetFloat32List {
    type Request = GetFloat32List_Request;
    type Response = GetFloat32List_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__GetFloat32List() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__GetInt16() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__GetInt16
#[allow(missing_docs, non_camel_case_types)]
pub struct GetInt16;

impl rosidl_runtime_rs::Service for GetInt16 {
    type Request = GetInt16_Request;
    type Response = GetInt16_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__GetInt16() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__GetInt16List() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__GetInt16List
#[allow(missing_docs, non_camel_case_types)]
pub struct GetInt16List;

impl rosidl_runtime_rs::Service for GetInt16List {
    type Request = GetInt16List_Request;
    type Response = GetInt16List_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__GetInt16List() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__GetInt32() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__GetInt32
#[allow(missing_docs, non_camel_case_types)]
pub struct GetInt32;

impl rosidl_runtime_rs::Service for GetInt32 {
    type Request = GetInt32_Request;
    type Response = GetInt32_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__GetInt32() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__GetInt32ByType() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__GetInt32ByType
#[allow(missing_docs, non_camel_case_types)]
pub struct GetInt32ByType;

impl rosidl_runtime_rs::Service for GetInt32ByType {
    type Request = GetInt32ByType_Request;
    type Response = GetInt32ByType_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__GetInt32ByType() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__GetSetModbusData() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__GetSetModbusData
#[allow(missing_docs, non_camel_case_types)]
pub struct GetSetModbusData;

impl rosidl_runtime_rs::Service for GetSetModbusData {
    type Request = GetSetModbusData_Request;
    type Response = GetSetModbusData_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__GetSetModbusData() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__GripperMove() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__GripperMove
#[allow(missing_docs, non_camel_case_types)]
pub struct GripperMove;

impl rosidl_runtime_rs::Service for GripperMove {
    type Request = GripperMove_Request;
    type Response = GripperMove_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__GripperMove() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__MoveCartesian() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__MoveCartesian
#[allow(missing_docs, non_camel_case_types)]
pub struct MoveCartesian;

impl rosidl_runtime_rs::Service for MoveCartesian {
    type Request = MoveCartesian_Request;
    type Response = MoveCartesian_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__MoveCartesian() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__MoveCircle() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__MoveCircle
#[allow(missing_docs, non_camel_case_types)]
pub struct MoveCircle;

impl rosidl_runtime_rs::Service for MoveCircle {
    type Request = MoveCircle_Request;
    type Response = MoveCircle_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__MoveCircle() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__MoveHome() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__MoveHome
#[allow(missing_docs, non_camel_case_types)]
pub struct MoveHome;

impl rosidl_runtime_rs::Service for MoveHome {
    type Request = MoveHome_Request;
    type Response = MoveHome_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__MoveHome() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__MoveJoint() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__MoveJoint
#[allow(missing_docs, non_camel_case_types)]
pub struct MoveJoint;

impl rosidl_runtime_rs::Service for MoveJoint {
    type Request = MoveJoint_Request;
    type Response = MoveJoint_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__MoveJoint() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__MoveVelocity() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__MoveVelocity
#[allow(missing_docs, non_camel_case_types)]
pub struct MoveVelocity;

impl rosidl_runtime_rs::Service for MoveVelocity {
    type Request = MoveVelocity_Request;
    type Response = MoveVelocity_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__MoveVelocity() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__RobotiqActivate() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__RobotiqActivate
#[allow(missing_docs, non_camel_case_types)]
pub struct RobotiqActivate;

impl rosidl_runtime_rs::Service for RobotiqActivate {
    type Request = RobotiqActivate_Request;
    type Response = RobotiqActivate_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__RobotiqActivate() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__RobotiqGetStatus() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__RobotiqGetStatus
#[allow(missing_docs, non_camel_case_types)]
pub struct RobotiqGetStatus;

impl rosidl_runtime_rs::Service for RobotiqGetStatus {
    type Request = RobotiqGetStatus_Request;
    type Response = RobotiqGetStatus_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__RobotiqGetStatus() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__RobotiqMove() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__RobotiqMove
#[allow(missing_docs, non_camel_case_types)]
pub struct RobotiqMove;

impl rosidl_runtime_rs::Service for RobotiqMove {
    type Request = RobotiqMove_Request;
    type Response = RobotiqMove_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__RobotiqMove() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__RobotiqReset() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__RobotiqReset
#[allow(missing_docs, non_camel_case_types)]
pub struct RobotiqReset;

impl rosidl_runtime_rs::Service for RobotiqReset {
    type Request = RobotiqReset_Request;
    type Response = RobotiqReset_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__RobotiqReset() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__SetAnalogIO() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__SetAnalogIO
#[allow(missing_docs, non_camel_case_types)]
pub struct SetAnalogIO;

impl rosidl_runtime_rs::Service for SetAnalogIO {
    type Request = SetAnalogIO_Request;
    type Response = SetAnalogIO_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__SetAnalogIO() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__SetDigitalIO() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__SetDigitalIO
#[allow(missing_docs, non_camel_case_types)]
pub struct SetDigitalIO;

impl rosidl_runtime_rs::Service for SetDigitalIO {
    type Request = SetDigitalIO_Request;
    type Response = SetDigitalIO_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__SetDigitalIO() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__SetFloat32() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__SetFloat32
#[allow(missing_docs, non_camel_case_types)]
pub struct SetFloat32;

impl rosidl_runtime_rs::Service for SetFloat32 {
    type Request = SetFloat32_Request;
    type Response = SetFloat32_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__SetFloat32() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__SetFloat32List() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__SetFloat32List
#[allow(missing_docs, non_camel_case_types)]
pub struct SetFloat32List;

impl rosidl_runtime_rs::Service for SetFloat32List {
    type Request = SetFloat32List_Request;
    type Response = SetFloat32List_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__SetFloat32List() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__SetInt16() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__SetInt16
#[allow(missing_docs, non_camel_case_types)]
pub struct SetInt16;

impl rosidl_runtime_rs::Service for SetInt16 {
    type Request = SetInt16_Request;
    type Response = SetInt16_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__SetInt16() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__SetInt16ById() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__SetInt16ById
#[allow(missing_docs, non_camel_case_types)]
pub struct SetInt16ById;

impl rosidl_runtime_rs::Service for SetInt16ById {
    type Request = SetInt16ById_Request;
    type Response = SetInt16ById_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__SetInt16ById() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__SetInt16List() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__SetInt16List
#[allow(missing_docs, non_camel_case_types)]
pub struct SetInt16List;

impl rosidl_runtime_rs::Service for SetInt16List {
    type Request = SetInt16List_Request;
    type Response = SetInt16List_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__SetInt16List() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__SetInt32() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__SetInt32
#[allow(missing_docs, non_camel_case_types)]
pub struct SetInt32;

impl rosidl_runtime_rs::Service for SetInt32 {
    type Request = SetInt32_Request;
    type Response = SetInt32_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__SetInt32() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__SetInt32ByType() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__SetInt32ByType
#[allow(missing_docs, non_camel_case_types)]
pub struct SetInt32ByType;

impl rosidl_runtime_rs::Service for SetInt32ByType {
    type Request = SetInt32ByType_Request;
    type Response = SetInt32ByType_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__SetInt32ByType() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__TrajCtrl() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__TrajCtrl
#[allow(missing_docs, non_camel_case_types)]
pub struct TrajCtrl;

impl rosidl_runtime_rs::Service for TrajCtrl {
    type Request = TrajCtrl_Request;
    type Response = TrajCtrl_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__TrajCtrl() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__TrajPlay() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__TrajPlay
#[allow(missing_docs, non_camel_case_types)]
pub struct TrajPlay;

impl rosidl_runtime_rs::Service for TrajPlay {
    type Request = TrajPlay_Request;
    type Response = TrajPlay_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__TrajPlay() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__VacuumGripperCtrl() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__VacuumGripperCtrl
#[allow(missing_docs, non_camel_case_types)]
pub struct VacuumGripperCtrl;

impl rosidl_runtime_rs::Service for VacuumGripperCtrl {
    type Request = VacuumGripperCtrl_Request;
    type Response = VacuumGripperCtrl_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__VacuumGripperCtrl() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__SetTcpLoad() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__SetTcpLoad
#[allow(missing_docs, non_camel_case_types)]
pub struct SetTcpLoad;

impl rosidl_runtime_rs::Service for SetTcpLoad {
    type Request = SetTcpLoad_Request;
    type Response = SetTcpLoad_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__SetTcpLoad() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__SetModbusTimeout() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__SetModbusTimeout
#[allow(missing_docs, non_camel_case_types)]
pub struct SetModbusTimeout;

impl rosidl_runtime_rs::Service for SetModbusTimeout {
    type Request = SetModbusTimeout_Request;
    type Response = SetModbusTimeout_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__SetModbusTimeout() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__IdenLoad() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__IdenLoad
#[allow(missing_docs, non_camel_case_types)]
pub struct IdenLoad;

impl rosidl_runtime_rs::Service for IdenLoad {
    type Request = IdenLoad_Request;
    type Response = IdenLoad_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__IdenLoad() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__FtCaliLoad() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__FtCaliLoad
#[allow(missing_docs, non_camel_case_types)]
pub struct FtCaliLoad;

impl rosidl_runtime_rs::Service for FtCaliLoad {
    type Request = FtCaliLoad_Request;
    type Response = FtCaliLoad_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__FtCaliLoad() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__FtForceConfig() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__FtForceConfig
#[allow(missing_docs, non_camel_case_types)]
pub struct FtForceConfig;

impl rosidl_runtime_rs::Service for FtForceConfig {
    type Request = FtForceConfig_Request;
    type Response = FtForceConfig_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__FtForceConfig() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__FtForcePid() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__FtForcePid
#[allow(missing_docs, non_camel_case_types)]
pub struct FtForcePid;

impl rosidl_runtime_rs::Service for FtForcePid {
    type Request = FtForcePid_Request;
    type Response = FtForcePid_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__FtForcePid() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__FtImpedance() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__FtImpedance
#[allow(missing_docs, non_camel_case_types)]
pub struct FtImpedance;

impl rosidl_runtime_rs::Service for FtImpedance {
    type Request = FtImpedance_Request;
    type Response = FtImpedance_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__FtImpedance() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__LinearTrackBackOrigin() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__LinearTrackBackOrigin
#[allow(missing_docs, non_camel_case_types)]
pub struct LinearTrackBackOrigin;

impl rosidl_runtime_rs::Service for LinearTrackBackOrigin {
    type Request = LinearTrackBackOrigin_Request;
    type Response = LinearTrackBackOrigin_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__LinearTrackBackOrigin() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__LinearTrackSetPos() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__LinearTrackSetPos
#[allow(missing_docs, non_camel_case_types)]
pub struct LinearTrackSetPos;

impl rosidl_runtime_rs::Service for LinearTrackSetPos {
    type Request = LinearTrackSetPos_Request;
    type Response = LinearTrackSetPos_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__LinearTrackSetPos() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__PlanExec() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__PlanExec
#[allow(missing_docs, non_camel_case_types)]
pub struct PlanExec;

impl rosidl_runtime_rs::Service for PlanExec {
    type Request = PlanExec_Request;
    type Response = PlanExec_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__PlanExec() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__PlanJoint() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__PlanJoint
#[allow(missing_docs, non_camel_case_types)]
pub struct PlanJoint;

impl rosidl_runtime_rs::Service for PlanJoint {
    type Request = PlanJoint_Request;
    type Response = PlanJoint_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__PlanJoint() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__PlanPose() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__PlanPose
#[allow(missing_docs, non_camel_case_types)]
pub struct PlanPose;

impl rosidl_runtime_rs::Service for PlanPose {
    type Request = PlanPose_Request;
    type Response = PlanPose_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__PlanPose() }
    }
}




#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__PlanSingleStraight() -> *const std::ffi::c_void;
}

// Corresponds to xarm_msgs__srv__PlanSingleStraight
#[allow(missing_docs, non_camel_case_types)]
pub struct PlanSingleStraight;

impl rosidl_runtime_rs::Service for PlanSingleStraight {
    type Request = PlanSingleStraight_Request;
    type Response = PlanSingleStraight_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__xarm_msgs__srv__PlanSingleStraight() }
    }
}


