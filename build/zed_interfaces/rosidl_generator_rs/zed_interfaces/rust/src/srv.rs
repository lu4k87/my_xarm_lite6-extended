#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};




// Corresponds to zed_interfaces__srv__SetPose_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetPose_Request {
    /// Translation XYZ
    pub pos: [f32; 3],

    /// Orientation RPY
    pub orient: [f32; 3],

}



impl Default for SetPose_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetPose_Request::default())
  }
}

impl rosidl_runtime_rs::Message for SetPose_Request {
  type RmwMsg = super::srv::rmw::SetPose_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        pos: msg.pos,
        orient: msg.orient,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        pos: msg.pos,
        orient: msg.orient,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      pos: msg.pos,
      orient: msg.orient,
    }
  }
}


// Corresponds to zed_interfaces__srv__SetPose_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetPose_Response {
    /// indicate successful run of service
    pub success: bool,

    /// informational, e.g. for error messages
    pub message: std::string::String,

}



impl Default for SetPose_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetPose_Response::default())
  }
}

impl rosidl_runtime_rs::Message for SetPose_Response {
  type RmwMsg = super::srv::rmw::SetPose_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        success: msg.success,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      success: msg.success,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      success: msg.success,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to zed_interfaces__srv__StartSvoRec_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
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
    pub svo_filename: std::string::String,

}



impl Default for StartSvoRec_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::StartSvoRec_Request::default())
  }
}

impl rosidl_runtime_rs::Message for StartSvoRec_Request {
  type RmwMsg = super::srv::rmw::StartSvoRec_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        bitrate: msg.bitrate,
        compression_mode: msg.compression_mode,
        target_framerate: msg.target_framerate,
        input_transcode: msg.input_transcode,
        svo_filename: msg.svo_filename.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      bitrate: msg.bitrate,
      compression_mode: msg.compression_mode,
      target_framerate: msg.target_framerate,
      input_transcode: msg.input_transcode,
        svo_filename: msg.svo_filename.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      bitrate: msg.bitrate,
      compression_mode: msg.compression_mode,
      target_framerate: msg.target_framerate,
      input_transcode: msg.input_transcode,
      svo_filename: msg.svo_filename.to_string(),
    }
  }
}


// Corresponds to zed_interfaces__srv__StartSvoRec_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct StartSvoRec_Response {
    /// indicate successful run of service
    pub success: bool,

    /// informational, e.g. for error messages
    pub message: std::string::String,

}



impl Default for StartSvoRec_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::StartSvoRec_Response::default())
  }
}

impl rosidl_runtime_rs::Message for StartSvoRec_Response {
  type RmwMsg = super::srv::rmw::StartSvoRec_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        success: msg.success,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      success: msg.success,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      success: msg.success,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to zed_interfaces__srv__SetROI_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetROI_Request {
    /// Region of interest polygon as an array of normalized vertices. e.g. "[[0.5,0.25],[0.75,0.5],[0.5,0.75],[0.25,0.5]]"
    /// You can use
    pub roi: std::string::String,

}



impl Default for SetROI_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetROI_Request::default())
  }
}

impl rosidl_runtime_rs::Message for SetROI_Request {
  type RmwMsg = super::srv::rmw::SetROI_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        roi: msg.roi.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        roi: msg.roi.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      roi: msg.roi.to_string(),
    }
  }
}


// Corresponds to zed_interfaces__srv__SetROI_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetROI_Response {
    /// indicate successful run of service
    pub success: bool,

    /// informational, e.g. for error messages
    pub message: std::string::String,

}



impl Default for SetROI_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetROI_Response::default())
  }
}

impl rosidl_runtime_rs::Message for SetROI_Response {
  type RmwMsg = super::srv::rmw::SetROI_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        success: msg.success,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      success: msg.success,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      success: msg.success,
      message: msg.message.to_string(),
    }
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


