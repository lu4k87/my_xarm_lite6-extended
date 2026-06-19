#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};


#[link(name = "whisper_idl__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__whisper_idl__msg__WhisperTokens() -> *const std::ffi::c_void;
}

#[link(name = "whisper_idl__rosidl_generator_c")]
extern "C" {
    fn whisper_idl__msg__WhisperTokens__init(msg: *mut WhisperTokens) -> bool;
    fn whisper_idl__msg__WhisperTokens__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<WhisperTokens>, size: usize) -> bool;
    fn whisper_idl__msg__WhisperTokens__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<WhisperTokens>);
    fn whisper_idl__msg__WhisperTokens__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<WhisperTokens>, out_seq: *mut rosidl_runtime_rs::Sequence<WhisperTokens>) -> bool;
}

// Corresponds to whisper_idl__msg__WhisperTokens
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct WhisperTokens {

    // This member is not documented.
    #[allow(missing_docs)]
    pub stamp: builtin_interfaces::msg::rmw::Time,

    /// Token data
    pub token_ids: rosidl_runtime_rs::Sequence<i32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub token_texts: rosidl_runtime_rs::Sequence<rosidl_runtime_rs::String>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub token_probs: rosidl_runtime_rs::Sequence<f32>,

    /// Segment data
    pub segment_start_token_idxs: rosidl_runtime_rs::Sequence<i32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub start_times: rosidl_runtime_rs::Sequence<i64>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub end_times: rosidl_runtime_rs::Sequence<i64>,

    /// Runtime data
    pub inference_duration: i64,

}



impl Default for WhisperTokens {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !whisper_idl__msg__WhisperTokens__init(&mut msg as *mut _) {
        panic!("Call to whisper_idl__msg__WhisperTokens__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for WhisperTokens {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__msg__WhisperTokens__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__msg__WhisperTokens__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__msg__WhisperTokens__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for WhisperTokens {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for WhisperTokens where Self: Sized {
  const TYPE_NAME: &'static str = "whisper_idl/msg/WhisperTokens";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__whisper_idl__msg__WhisperTokens() }
  }
}


#[link(name = "whisper_idl__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__whisper_idl__msg__AudioTranscript() -> *const std::ffi::c_void;
}

#[link(name = "whisper_idl__rosidl_generator_c")]
extern "C" {
    fn whisper_idl__msg__AudioTranscript__init(msg: *mut AudioTranscript) -> bool;
    fn whisper_idl__msg__AudioTranscript__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<AudioTranscript>, size: usize) -> bool;
    fn whisper_idl__msg__AudioTranscript__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<AudioTranscript>);
    fn whisper_idl__msg__AudioTranscript__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<AudioTranscript>, out_seq: *mut rosidl_runtime_rs::Sequence<AudioTranscript>) -> bool;
}

// Corresponds to whisper_idl__msg__AudioTranscript
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]

/// File:  AudioTranscript.msg

#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct AudioTranscript {
    /// Text data
    /// The word from speech-to-text
    pub words: rosidl_runtime_rs::Sequence<rosidl_runtime_rs::String>,

    /// Confidence value
    pub probs: rosidl_runtime_rs::Sequence<f32>,

    /// Word occurances
    pub occ: rosidl_runtime_rs::Sequence<i32>,

    /// Segment Data
    /// Location in the words array where the segment starts
    pub seg_start_words_id: rosidl_runtime_rs::Sequence<i32>,

    /// Start time of the segment
    pub seg_start_time: rosidl_runtime_rs::Sequence<builtin_interfaces::msg::rmw::Time>,

    /// Segment duration in ms
    pub seg_duration_ms: rosidl_runtime_rs::Sequence<i32>,

    /// Meta
    /// All words past this index in the transcript may change
    pub active_index: i32,

}



impl Default for AudioTranscript {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !whisper_idl__msg__AudioTranscript__init(&mut msg as *mut _) {
        panic!("Call to whisper_idl__msg__AudioTranscript__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for AudioTranscript {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__msg__AudioTranscript__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__msg__AudioTranscript__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { whisper_idl__msg__AudioTranscript__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for AudioTranscript {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for AudioTranscript where Self: Sized {
  const TYPE_NAME: &'static str = "whisper_idl/msg/AudioTranscript";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__whisper_idl__msg__AudioTranscript() }
  }
}


