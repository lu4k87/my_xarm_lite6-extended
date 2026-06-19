
#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};


#[link(name = "whisper_idl__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__whisper_idl__action__Inference_Goal() -> *const std::ffi::c_void;
}

#[link(name = "whisper_idl__rosidl_generator_c")]
extern "C" {
    fn whisper_idl__action__Inference_Goal__init(msg: *mut Inference_Goal) -> bool;
    fn whisper_idl__action__Inference_Goal__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<Inference_Goal>, size: usize) -> bool;
    fn whisper_idl__action__Inference_Goal__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<Inference_Goal>);
    fn whisper_idl__action__Inference_Goal__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<Inference_Goal>, out_seq: *mut rosidl_runtime_rs::Sequence<Inference_Goal>) -> bool;
}

// Corresponds to whisper_idl__action__Inference_Goal
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Inference_Goal {

    // This member is not documented.
    #[allow(missing_docs)]
    pub max_duration: builtin_interfaces::msg::rmw::Duration,

}



impl Default for Inference_Goal {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !whisper_idl__action__Inference_Goal__init(&mut msg as *mut _) {
        panic!("Call to whisper_idl__action__Inference_Goal__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for Inference_Goal {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_Goal__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_Goal__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_Goal__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for Inference_Goal {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for Inference_Goal where Self: Sized {
  const TYPE_NAME: &'static str = "whisper_idl/action/Inference_Goal";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__whisper_idl__action__Inference_Goal() }
  }
}


#[link(name = "whisper_idl__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__whisper_idl__action__Inference_Result() -> *const std::ffi::c_void;
}

#[link(name = "whisper_idl__rosidl_generator_c")]
extern "C" {
    fn whisper_idl__action__Inference_Result__init(msg: *mut Inference_Result) -> bool;
    fn whisper_idl__action__Inference_Result__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<Inference_Result>, size: usize) -> bool;
    fn whisper_idl__action__Inference_Result__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<Inference_Result>);
    fn whisper_idl__action__Inference_Result__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<Inference_Result>, out_seq: *mut rosidl_runtime_rs::Sequence<Inference_Result>) -> bool;
}

// Corresponds to whisper_idl__action__Inference_Result
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Inference_Result {

    // This member is not documented.
    #[allow(missing_docs)]
    pub info: rosidl_runtime_rs::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub transcriptions: rosidl_runtime_rs::Sequence<rosidl_runtime_rs::String>,

}



impl Default for Inference_Result {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !whisper_idl__action__Inference_Result__init(&mut msg as *mut _) {
        panic!("Call to whisper_idl__action__Inference_Result__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for Inference_Result {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_Result__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_Result__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_Result__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for Inference_Result {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for Inference_Result where Self: Sized {
  const TYPE_NAME: &'static str = "whisper_idl/action/Inference_Result";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__whisper_idl__action__Inference_Result() }
  }
}


#[link(name = "whisper_idl__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__whisper_idl__action__Inference_Feedback() -> *const std::ffi::c_void;
}

#[link(name = "whisper_idl__rosidl_generator_c")]
extern "C" {
    fn whisper_idl__action__Inference_Feedback__init(msg: *mut Inference_Feedback) -> bool;
    fn whisper_idl__action__Inference_Feedback__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<Inference_Feedback>, size: usize) -> bool;
    fn whisper_idl__action__Inference_Feedback__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<Inference_Feedback>);
    fn whisper_idl__action__Inference_Feedback__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<Inference_Feedback>, out_seq: *mut rosidl_runtime_rs::Sequence<Inference_Feedback>) -> bool;
}

// Corresponds to whisper_idl__action__Inference_Feedback
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Inference_Feedback {

    // This member is not documented.
    #[allow(missing_docs)]
    pub batch_idx: u16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub transcription: rosidl_runtime_rs::String,

}



impl Default for Inference_Feedback {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !whisper_idl__action__Inference_Feedback__init(&mut msg as *mut _) {
        panic!("Call to whisper_idl__action__Inference_Feedback__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for Inference_Feedback {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_Feedback__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_Feedback__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_Feedback__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for Inference_Feedback {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for Inference_Feedback where Self: Sized {
  const TYPE_NAME: &'static str = "whisper_idl/action/Inference_Feedback";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__whisper_idl__action__Inference_Feedback() }
  }
}


#[link(name = "whisper_idl__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__whisper_idl__action__Inference_FeedbackMessage() -> *const std::ffi::c_void;
}

#[link(name = "whisper_idl__rosidl_generator_c")]
extern "C" {
    fn whisper_idl__action__Inference_FeedbackMessage__init(msg: *mut Inference_FeedbackMessage) -> bool;
    fn whisper_idl__action__Inference_FeedbackMessage__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<Inference_FeedbackMessage>, size: usize) -> bool;
    fn whisper_idl__action__Inference_FeedbackMessage__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<Inference_FeedbackMessage>);
    fn whisper_idl__action__Inference_FeedbackMessage__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<Inference_FeedbackMessage>, out_seq: *mut rosidl_runtime_rs::Sequence<Inference_FeedbackMessage>) -> bool;
}

// Corresponds to whisper_idl__action__Inference_FeedbackMessage
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Inference_FeedbackMessage {

    // This member is not documented.
    #[allow(missing_docs)]
    pub goal_id: unique_identifier_msgs::msg::rmw::UUID,


    // This member is not documented.
    #[allow(missing_docs)]
    pub feedback: super::super::action::rmw::Inference_Feedback,

}



impl Default for Inference_FeedbackMessage {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !whisper_idl__action__Inference_FeedbackMessage__init(&mut msg as *mut _) {
        panic!("Call to whisper_idl__action__Inference_FeedbackMessage__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for Inference_FeedbackMessage {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_FeedbackMessage__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_FeedbackMessage__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_FeedbackMessage__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for Inference_FeedbackMessage {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for Inference_FeedbackMessage where Self: Sized {
  const TYPE_NAME: &'static str = "whisper_idl/action/Inference_FeedbackMessage";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__whisper_idl__action__Inference_FeedbackMessage() }
  }
}




#[link(name = "whisper_idl__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__whisper_idl__action__Inference_SendGoal_Request() -> *const std::ffi::c_void;
}

#[link(name = "whisper_idl__rosidl_generator_c")]
extern "C" {
    fn whisper_idl__action__Inference_SendGoal_Request__init(msg: *mut Inference_SendGoal_Request) -> bool;
    fn whisper_idl__action__Inference_SendGoal_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<Inference_SendGoal_Request>, size: usize) -> bool;
    fn whisper_idl__action__Inference_SendGoal_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<Inference_SendGoal_Request>);
    fn whisper_idl__action__Inference_SendGoal_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<Inference_SendGoal_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<Inference_SendGoal_Request>) -> bool;
}

// Corresponds to whisper_idl__action__Inference_SendGoal_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Inference_SendGoal_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub goal_id: unique_identifier_msgs::msg::rmw::UUID,


    // This member is not documented.
    #[allow(missing_docs)]
    pub goal: super::super::action::rmw::Inference_Goal,

}



impl Default for Inference_SendGoal_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !whisper_idl__action__Inference_SendGoal_Request__init(&mut msg as *mut _) {
        panic!("Call to whisper_idl__action__Inference_SendGoal_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for Inference_SendGoal_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_SendGoal_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_SendGoal_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_SendGoal_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for Inference_SendGoal_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for Inference_SendGoal_Request where Self: Sized {
  const TYPE_NAME: &'static str = "whisper_idl/action/Inference_SendGoal_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__whisper_idl__action__Inference_SendGoal_Request() }
  }
}


#[link(name = "whisper_idl__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__whisper_idl__action__Inference_SendGoal_Response() -> *const std::ffi::c_void;
}

#[link(name = "whisper_idl__rosidl_generator_c")]
extern "C" {
    fn whisper_idl__action__Inference_SendGoal_Response__init(msg: *mut Inference_SendGoal_Response) -> bool;
    fn whisper_idl__action__Inference_SendGoal_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<Inference_SendGoal_Response>, size: usize) -> bool;
    fn whisper_idl__action__Inference_SendGoal_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<Inference_SendGoal_Response>);
    fn whisper_idl__action__Inference_SendGoal_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<Inference_SendGoal_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<Inference_SendGoal_Response>) -> bool;
}

// Corresponds to whisper_idl__action__Inference_SendGoal_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Inference_SendGoal_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub accepted: bool,


    // This member is not documented.
    #[allow(missing_docs)]
    pub stamp: builtin_interfaces::msg::rmw::Time,

}



impl Default for Inference_SendGoal_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !whisper_idl__action__Inference_SendGoal_Response__init(&mut msg as *mut _) {
        panic!("Call to whisper_idl__action__Inference_SendGoal_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for Inference_SendGoal_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_SendGoal_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_SendGoal_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_SendGoal_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for Inference_SendGoal_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for Inference_SendGoal_Response where Self: Sized {
  const TYPE_NAME: &'static str = "whisper_idl/action/Inference_SendGoal_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__whisper_idl__action__Inference_SendGoal_Response() }
  }
}


#[link(name = "whisper_idl__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__whisper_idl__action__Inference_GetResult_Request() -> *const std::ffi::c_void;
}

#[link(name = "whisper_idl__rosidl_generator_c")]
extern "C" {
    fn whisper_idl__action__Inference_GetResult_Request__init(msg: *mut Inference_GetResult_Request) -> bool;
    fn whisper_idl__action__Inference_GetResult_Request__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<Inference_GetResult_Request>, size: usize) -> bool;
    fn whisper_idl__action__Inference_GetResult_Request__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<Inference_GetResult_Request>);
    fn whisper_idl__action__Inference_GetResult_Request__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<Inference_GetResult_Request>, out_seq: *mut rosidl_runtime_rs::Sequence<Inference_GetResult_Request>) -> bool;
}

// Corresponds to whisper_idl__action__Inference_GetResult_Request
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Inference_GetResult_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub goal_id: unique_identifier_msgs::msg::rmw::UUID,

}



impl Default for Inference_GetResult_Request {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !whisper_idl__action__Inference_GetResult_Request__init(&mut msg as *mut _) {
        panic!("Call to whisper_idl__action__Inference_GetResult_Request__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for Inference_GetResult_Request {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_GetResult_Request__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_GetResult_Request__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_GetResult_Request__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for Inference_GetResult_Request {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for Inference_GetResult_Request where Self: Sized {
  const TYPE_NAME: &'static str = "whisper_idl/action/Inference_GetResult_Request";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__whisper_idl__action__Inference_GetResult_Request() }
  }
}


#[link(name = "whisper_idl__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__whisper_idl__action__Inference_GetResult_Response() -> *const std::ffi::c_void;
}

#[link(name = "whisper_idl__rosidl_generator_c")]
extern "C" {
    fn whisper_idl__action__Inference_GetResult_Response__init(msg: *mut Inference_GetResult_Response) -> bool;
    fn whisper_idl__action__Inference_GetResult_Response__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<Inference_GetResult_Response>, size: usize) -> bool;
    fn whisper_idl__action__Inference_GetResult_Response__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<Inference_GetResult_Response>);
    fn whisper_idl__action__Inference_GetResult_Response__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<Inference_GetResult_Response>, out_seq: *mut rosidl_runtime_rs::Sequence<Inference_GetResult_Response>) -> bool;
}

// Corresponds to whisper_idl__action__Inference_GetResult_Response
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Inference_GetResult_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub status: i8,


    // This member is not documented.
    #[allow(missing_docs)]
    pub result: super::super::action::rmw::Inference_Result,

}



impl Default for Inference_GetResult_Response {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !whisper_idl__action__Inference_GetResult_Response__init(&mut msg as *mut _) {
        panic!("Call to whisper_idl__action__Inference_GetResult_Response__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for Inference_GetResult_Response {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_GetResult_Response__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_GetResult_Response__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__action__Inference_GetResult_Response__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for Inference_GetResult_Response {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for Inference_GetResult_Response where Self: Sized {
  const TYPE_NAME: &'static str = "whisper_idl/action/Inference_GetResult_Response";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__whisper_idl__action__Inference_GetResult_Response() }
  }
}






#[link(name = "whisper_idl__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__whisper_idl__action__Inference_SendGoal() -> *const std::ffi::c_void;
}

// Corresponds to whisper_idl__action__Inference_SendGoal
#[allow(missing_docs, non_camel_case_types)]
pub struct Inference_SendGoal;

impl rosidl_runtime_rs::Service for Inference_SendGoal {
    type Request = Inference_SendGoal_Request;
    type Response = Inference_SendGoal_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__whisper_idl__action__Inference_SendGoal() }
    }
}




#[link(name = "whisper_idl__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_service_type_support_handle__whisper_idl__action__Inference_GetResult() -> *const std::ffi::c_void;
}

// Corresponds to whisper_idl__action__Inference_GetResult
#[allow(missing_docs, non_camel_case_types)]
pub struct Inference_GetResult;

impl rosidl_runtime_rs::Service for Inference_GetResult {
    type Request = Inference_GetResult_Request;
    type Response = Inference_GetResult_Response;

    fn get_type_support() -> *const std::ffi::c_void {
        // SAFETY: No preconditions for this function.
        unsafe { rosidl_typesupport_c__get_service_type_support_handle__whisper_idl__action__Inference_GetResult() }
    }
}


