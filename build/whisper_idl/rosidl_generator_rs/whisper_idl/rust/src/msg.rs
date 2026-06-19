#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};



// Corresponds to whisper_idl__msg__WhisperTokens

// This struct is not documented.
#[allow(missing_docs)]

#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct WhisperTokens {

    // This member is not documented.
    #[allow(missing_docs)]
    pub stamp: builtin_interfaces::msg::Time,

    /// Token data
    pub token_ids: Vec<i32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub token_texts: Vec<std::string::String>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub token_probs: Vec<f32>,

    /// Segment data
    pub segment_start_token_idxs: Vec<i32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub start_times: Vec<i64>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub end_times: Vec<i64>,

    /// Runtime data
    pub inference_duration: i64,

}



impl Default for WhisperTokens {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::msg::rmw::WhisperTokens::default())
  }
}

impl rosidl_runtime_rs::Message for WhisperTokens {
  type RmwMsg = super::msg::rmw::WhisperTokens;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        stamp: builtin_interfaces::msg::Time::into_rmw_message(std::borrow::Cow::Owned(msg.stamp)).into_owned(),
        token_ids: msg.token_ids.into(),
        token_texts: msg.token_texts
          .into_iter()
          .map(|elem| elem.as_str().into())
          .collect(),
        token_probs: msg.token_probs.into(),
        segment_start_token_idxs: msg.segment_start_token_idxs.into(),
        start_times: msg.start_times.into(),
        end_times: msg.end_times.into(),
        inference_duration: msg.inference_duration,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        stamp: builtin_interfaces::msg::Time::into_rmw_message(std::borrow::Cow::Borrowed(&msg.stamp)).into_owned(),
        token_ids: msg.token_ids.as_slice().into(),
        token_texts: msg.token_texts
          .iter()
          .map(|elem| elem.as_str().into())
          .collect(),
        token_probs: msg.token_probs.as_slice().into(),
        segment_start_token_idxs: msg.segment_start_token_idxs.as_slice().into(),
        start_times: msg.start_times.as_slice().into(),
        end_times: msg.end_times.as_slice().into(),
      inference_duration: msg.inference_duration,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      stamp: builtin_interfaces::msg::Time::from_rmw_message(msg.stamp),
      token_ids: msg.token_ids
          .into_iter()
          .collect(),
      token_texts: msg.token_texts
          .into_iter()
          .map(|elem| elem.to_string())
          .collect(),
      token_probs: msg.token_probs
          .into_iter()
          .collect(),
      segment_start_token_idxs: msg.segment_start_token_idxs
          .into_iter()
          .collect(),
      start_times: msg.start_times
          .into_iter()
          .collect(),
      end_times: msg.end_times
          .into_iter()
          .collect(),
      inference_duration: msg.inference_duration,
    }
  }
}


// Corresponds to whisper_idl__msg__AudioTranscript
/// File:  AudioTranscript.msg

#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct AudioTranscript {
    /// Text data
    /// The word from speech-to-text
    pub words: Vec<std::string::String>,

    /// Confidence value
    pub probs: Vec<f32>,

    /// Word occurances
    pub occ: Vec<i32>,

    /// Segment Data
    /// Location in the words array where the segment starts
    pub seg_start_words_id: Vec<i32>,

    /// Start time of the segment
    pub seg_start_time: Vec<builtin_interfaces::msg::Time>,

    /// Segment duration in ms
    pub seg_duration_ms: Vec<i32>,

    /// Meta
    /// All words past this index in the transcript may change
    pub active_index: i32,

}



impl Default for AudioTranscript {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::msg::rmw::AudioTranscript::default())
  }
}

impl rosidl_runtime_rs::Message for AudioTranscript {
  type RmwMsg = super::msg::rmw::AudioTranscript;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        words: msg.words
          .into_iter()
          .map(|elem| elem.as_str().into())
          .collect(),
        probs: msg.probs.into(),
        occ: msg.occ.into(),
        seg_start_words_id: msg.seg_start_words_id.into(),
        seg_start_time: msg.seg_start_time
          .into_iter()
          .map(|elem| builtin_interfaces::msg::Time::into_rmw_message(std::borrow::Cow::Owned(elem)).into_owned())
          .collect(),
        seg_duration_ms: msg.seg_duration_ms.into(),
        active_index: msg.active_index,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        words: msg.words
          .iter()
          .map(|elem| elem.as_str().into())
          .collect(),
        probs: msg.probs.as_slice().into(),
        occ: msg.occ.as_slice().into(),
        seg_start_words_id: msg.seg_start_words_id.as_slice().into(),
        seg_start_time: msg.seg_start_time
          .iter()
          .map(|elem| builtin_interfaces::msg::Time::into_rmw_message(std::borrow::Cow::Borrowed(elem)).into_owned())
          .collect(),
        seg_duration_ms: msg.seg_duration_ms.as_slice().into(),
      active_index: msg.active_index,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      words: msg.words
          .into_iter()
          .map(|elem| elem.to_string())
          .collect(),
      probs: msg.probs
          .into_iter()
          .collect(),
      occ: msg.occ
          .into_iter()
          .collect(),
      seg_start_words_id: msg.seg_start_words_id
          .into_iter()
          .collect(),
      seg_start_time: msg.seg_start_time
          .into_iter()
          .map(builtin_interfaces::msg::Time::from_rmw_message)
          .collect(),
      seg_duration_ms: msg.seg_duration_ms
          .into_iter()
          .collect(),
      active_index: msg.active_index,
    }
  }
}


