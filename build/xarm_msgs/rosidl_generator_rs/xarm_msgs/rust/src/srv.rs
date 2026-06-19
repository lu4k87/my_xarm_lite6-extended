#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};




// Corresponds to xarm_msgs__srv__BioGripperCtrl_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
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
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::BioGripperCtrl_Request::default())
  }
}

impl rosidl_runtime_rs::Message for BioGripperCtrl_Request {
  type RmwMsg = super::srv::rmw::BioGripperCtrl_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        speed: msg.speed,
        wait: msg.wait,
        timeout: msg.timeout,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      speed: msg.speed,
      wait: msg.wait,
      timeout: msg.timeout,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      speed: msg.speed,
      wait: msg.wait,
      timeout: msg.timeout,
    }
  }
}


// Corresponds to xarm_msgs__srv__BioGripperCtrl_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct BioGripperCtrl_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for BioGripperCtrl_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::BioGripperCtrl_Response::default())
  }
}

impl rosidl_runtime_rs::Message for BioGripperCtrl_Response {
  type RmwMsg = super::srv::rmw::BioGripperCtrl_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__BioGripperEnable_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
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
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::BioGripperEnable_Request::default())
  }
}

impl rosidl_runtime_rs::Message for BioGripperEnable_Request {
  type RmwMsg = super::srv::rmw::BioGripperEnable_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        enable: msg.enable,
        wait: msg.wait,
        timeout: msg.timeout,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      enable: msg.enable,
      wait: msg.wait,
      timeout: msg.timeout,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      enable: msg.enable,
      wait: msg.wait,
      timeout: msg.timeout,
    }
  }
}


// Corresponds to xarm_msgs__srv__BioGripperEnable_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct BioGripperEnable_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for BioGripperEnable_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::BioGripperEnable_Response::default())
  }
}

impl rosidl_runtime_rs::Message for BioGripperEnable_Response {
  type RmwMsg = super::srv::rmw::BioGripperEnable_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__Call_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Call_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub structure_needs_at_least_one_member: u8,

}



impl Default for Call_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::Call_Request::default())
  }
}

impl rosidl_runtime_rs::Message for Call_Request {
  type RmwMsg = super::srv::rmw::Call_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
    }
  }
}


// Corresponds to xarm_msgs__srv__Call_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Call_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for Call_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::Call_Response::default())
  }
}

impl rosidl_runtime_rs::Message for Call_Response {
  type RmwMsg = super::srv::rmw::Call_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__GetAnalogIO_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetAnalogIO_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ionum: i16,

}



impl Default for GetAnalogIO_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::GetAnalogIO_Request::default())
  }
}

impl rosidl_runtime_rs::Message for GetAnalogIO_Request {
  type RmwMsg = super::srv::rmw::GetAnalogIO_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ionum: msg.ionum,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ionum: msg.ionum,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ionum: msg.ionum,
    }
  }
}


// Corresponds to xarm_msgs__srv__GetAnalogIO_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetAnalogIO_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub data: f32,

}



impl Default for GetAnalogIO_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::GetAnalogIO_Response::default())
  }
}

impl rosidl_runtime_rs::Message for GetAnalogIO_Response {
  type RmwMsg = super::srv::rmw::GetAnalogIO_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
        data: msg.data,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      data: msg.data,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
      data: msg.data,
    }
  }
}


// Corresponds to xarm_msgs__srv__GetDigitalIO_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetDigitalIO_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub structure_needs_at_least_one_member: u8,

}



impl Default for GetDigitalIO_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::GetDigitalIO_Request::default())
  }
}

impl rosidl_runtime_rs::Message for GetDigitalIO_Request {
  type RmwMsg = super::srv::rmw::GetDigitalIO_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
    }
  }
}


// Corresponds to xarm_msgs__srv__GetDigitalIO_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetDigitalIO_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub digitals: Vec<i16>,

}



impl Default for GetDigitalIO_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::GetDigitalIO_Response::default())
  }
}

impl rosidl_runtime_rs::Message for GetDigitalIO_Response {
  type RmwMsg = super::srv::rmw::GetDigitalIO_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
        digitals: msg.digitals.into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
        digitals: msg.digitals.as_slice().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
      digitals: msg.digitals
          .into_iter()
          .collect(),
    }
  }
}


// Corresponds to xarm_msgs__srv__GetFloat32_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetFloat32_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub structure_needs_at_least_one_member: u8,

}



impl Default for GetFloat32_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::GetFloat32_Request::default())
  }
}

impl rosidl_runtime_rs::Message for GetFloat32_Request {
  type RmwMsg = super::srv::rmw::GetFloat32_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
    }
  }
}


// Corresponds to xarm_msgs__srv__GetFloat32_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetFloat32_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub data: f32,

}



impl Default for GetFloat32_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::GetFloat32_Response::default())
  }
}

impl rosidl_runtime_rs::Message for GetFloat32_Response {
  type RmwMsg = super::srv::rmw::GetFloat32_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
        data: msg.data,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      data: msg.data,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
      data: msg.data,
    }
  }
}


// Corresponds to xarm_msgs__srv__GetFloat32List_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetFloat32List_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub structure_needs_at_least_one_member: u8,

}



impl Default for GetFloat32List_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::GetFloat32List_Request::default())
  }
}

impl rosidl_runtime_rs::Message for GetFloat32List_Request {
  type RmwMsg = super::srv::rmw::GetFloat32List_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
    }
  }
}


// Corresponds to xarm_msgs__srv__GetFloat32List_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetFloat32List_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub datas: Vec<f32>,

}



impl Default for GetFloat32List_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::GetFloat32List_Response::default())
  }
}

impl rosidl_runtime_rs::Message for GetFloat32List_Response {
  type RmwMsg = super::srv::rmw::GetFloat32List_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
        datas: msg.datas.into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
        datas: msg.datas.as_slice().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
      datas: msg.datas
          .into_iter()
          .collect(),
    }
  }
}


// Corresponds to xarm_msgs__srv__GetInt16_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetInt16_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub structure_needs_at_least_one_member: u8,

}



impl Default for GetInt16_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::GetInt16_Request::default())
  }
}

impl rosidl_runtime_rs::Message for GetInt16_Request {
  type RmwMsg = super::srv::rmw::GetInt16_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
    }
  }
}


// Corresponds to xarm_msgs__srv__GetInt16_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetInt16_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub data: i16,

}



impl Default for GetInt16_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::GetInt16_Response::default())
  }
}

impl rosidl_runtime_rs::Message for GetInt16_Response {
  type RmwMsg = super::srv::rmw::GetInt16_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
        data: msg.data,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      data: msg.data,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
      data: msg.data,
    }
  }
}


// Corresponds to xarm_msgs__srv__GetInt16List_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetInt16List_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub structure_needs_at_least_one_member: u8,

}



impl Default for GetInt16List_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::GetInt16List_Request::default())
  }
}

impl rosidl_runtime_rs::Message for GetInt16List_Request {
  type RmwMsg = super::srv::rmw::GetInt16List_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
    }
  }
}


// Corresponds to xarm_msgs__srv__GetInt16List_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetInt16List_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub datas: Vec<i16>,

}



impl Default for GetInt16List_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::GetInt16List_Response::default())
  }
}

impl rosidl_runtime_rs::Message for GetInt16List_Response {
  type RmwMsg = super::srv::rmw::GetInt16List_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
        datas: msg.datas.into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
        datas: msg.datas.as_slice().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
      datas: msg.datas
          .into_iter()
          .collect(),
    }
  }
}


// Corresponds to xarm_msgs__srv__GetInt32_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetInt32_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub structure_needs_at_least_one_member: u8,

}



impl Default for GetInt32_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::GetInt32_Request::default())
  }
}

impl rosidl_runtime_rs::Message for GetInt32_Request {
  type RmwMsg = super::srv::rmw::GetInt32_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
    }
  }
}


// Corresponds to xarm_msgs__srv__GetInt32_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetInt32_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub data: i32,

}



impl Default for GetInt32_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::GetInt32_Response::default())
  }
}

impl rosidl_runtime_rs::Message for GetInt32_Response {
  type RmwMsg = super::srv::rmw::GetInt32_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
        data: msg.data,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      data: msg.data,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
      data: msg.data,
    }
  }
}


// Corresponds to xarm_msgs__srv__GetInt32ByType_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetInt32ByType_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub type_: i16,

}



impl Default for GetInt32ByType_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::GetInt32ByType_Request::default())
  }
}

impl rosidl_runtime_rs::Message for GetInt32ByType_Request {
  type RmwMsg = super::srv::rmw::GetInt32ByType_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        type_: msg.type_,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      type_: msg.type_,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      type_: msg.type_,
    }
  }
}


// Corresponds to xarm_msgs__srv__GetInt32ByType_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetInt32ByType_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub data: i32,

}



impl Default for GetInt32ByType_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::GetInt32ByType_Response::default())
  }
}

impl rosidl_runtime_rs::Message for GetInt32ByType_Response {
  type RmwMsg = super::srv::rmw::GetInt32ByType_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
        data: msg.data,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      data: msg.data,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
      data: msg.data,
    }
  }
}


// Corresponds to xarm_msgs__srv__GetSetModbusData_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetSetModbusData_Request {
    /// modbus data to send
    pub modbus_data: Vec<u8>,

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
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::GetSetModbusData_Request::default())
  }
}

impl rosidl_runtime_rs::Message for GetSetModbusData_Request {
  type RmwMsg = super::srv::rmw::GetSetModbusData_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        modbus_data: msg.modbus_data.into(),
        modbus_length: msg.modbus_length,
        ret_length: msg.ret_length,
        host_id: msg.host_id,
        is_transparent_transmission: msg.is_transparent_transmission,
        use_503_port: msg.use_503_port,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        modbus_data: msg.modbus_data.as_slice().into(),
      modbus_length: msg.modbus_length,
      ret_length: msg.ret_length,
      host_id: msg.host_id,
      is_transparent_transmission: msg.is_transparent_transmission,
      use_503_port: msg.use_503_port,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      modbus_data: msg.modbus_data
          .into_iter()
          .collect(),
      modbus_length: msg.modbus_length,
      ret_length: msg.ret_length,
      host_id: msg.host_id,
      is_transparent_transmission: msg.is_transparent_transmission,
      use_503_port: msg.use_503_port,
    }
  }
}


// Corresponds to xarm_msgs__srv__GetSetModbusData_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GetSetModbusData_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub ret_data: Vec<u8>,

}



impl Default for GetSetModbusData_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::GetSetModbusData_Response::default())
  }
}

impl rosidl_runtime_rs::Message for GetSetModbusData_Response {
  type RmwMsg = super::srv::rmw::GetSetModbusData_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
        ret_data: msg.ret_data.into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
        ret_data: msg.ret_data.as_slice().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
      ret_data: msg.ret_data
          .into_iter()
          .collect(),
    }
  }
}


// Corresponds to xarm_msgs__srv__GripperMove_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
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
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::GripperMove_Request::default())
  }
}

impl rosidl_runtime_rs::Message for GripperMove_Request {
  type RmwMsg = super::srv::rmw::GripperMove_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        pos: msg.pos,
        wait: msg.wait,
        timeout: msg.timeout,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      pos: msg.pos,
      wait: msg.wait,
      timeout: msg.timeout,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      pos: msg.pos,
      wait: msg.wait,
      timeout: msg.timeout,
    }
  }
}


// Corresponds to xarm_msgs__srv__GripperMove_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GripperMove_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for GripperMove_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::GripperMove_Response::default())
  }
}

impl rosidl_runtime_rs::Message for GripperMove_Response {
  type RmwMsg = super::srv::rmw::GripperMove_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__MoveCartesian_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct MoveCartesian_Request {
    /// set_position/set_tool_position/set_position_aa/set_servo_cartesian/set_servo_cartesian_aa
    pub pose: Vec<f32>,


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
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::MoveCartesian_Request::default())
  }
}

impl rosidl_runtime_rs::Message for MoveCartesian_Request {
  type RmwMsg = super::srv::rmw::MoveCartesian_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        pose: msg.pose.into(),
        speed: msg.speed,
        acc: msg.acc,
        mvtime: msg.mvtime,
        wait: msg.wait,
        timeout: msg.timeout,
        radius: msg.radius,
        is_tool_coord: msg.is_tool_coord,
        relative: msg.relative,
        motion_type: msg.motion_type,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        pose: msg.pose.as_slice().into(),
      speed: msg.speed,
      acc: msg.acc,
      mvtime: msg.mvtime,
      wait: msg.wait,
      timeout: msg.timeout,
      radius: msg.radius,
      is_tool_coord: msg.is_tool_coord,
      relative: msg.relative,
      motion_type: msg.motion_type,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      pose: msg.pose
          .into_iter()
          .collect(),
      speed: msg.speed,
      acc: msg.acc,
      mvtime: msg.mvtime,
      wait: msg.wait,
      timeout: msg.timeout,
      radius: msg.radius,
      is_tool_coord: msg.is_tool_coord,
      relative: msg.relative,
      motion_type: msg.motion_type,
    }
  }
}


// Corresponds to xarm_msgs__srv__MoveCartesian_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct MoveCartesian_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for MoveCartesian_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::MoveCartesian_Response::default())
  }
}

impl rosidl_runtime_rs::Message for MoveCartesian_Response {
  type RmwMsg = super::srv::rmw::MoveCartesian_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__MoveCircle_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct MoveCircle_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub pose1: Vec<f32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub pose2: Vec<f32>,


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
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::MoveCircle_Request::default())
  }
}

impl rosidl_runtime_rs::Message for MoveCircle_Request {
  type RmwMsg = super::srv::rmw::MoveCircle_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        pose1: msg.pose1.into(),
        pose2: msg.pose2.into(),
        percent: msg.percent,
        speed: msg.speed,
        acc: msg.acc,
        mvtime: msg.mvtime,
        wait: msg.wait,
        timeout: msg.timeout,
        is_tool_coord: msg.is_tool_coord,
        is_axis_angle: msg.is_axis_angle,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        pose1: msg.pose1.as_slice().into(),
        pose2: msg.pose2.as_slice().into(),
      percent: msg.percent,
      speed: msg.speed,
      acc: msg.acc,
      mvtime: msg.mvtime,
      wait: msg.wait,
      timeout: msg.timeout,
      is_tool_coord: msg.is_tool_coord,
      is_axis_angle: msg.is_axis_angle,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      pose1: msg.pose1
          .into_iter()
          .collect(),
      pose2: msg.pose2
          .into_iter()
          .collect(),
      percent: msg.percent,
      speed: msg.speed,
      acc: msg.acc,
      mvtime: msg.mvtime,
      wait: msg.wait,
      timeout: msg.timeout,
      is_tool_coord: msg.is_tool_coord,
      is_axis_angle: msg.is_axis_angle,
    }
  }
}


// Corresponds to xarm_msgs__srv__MoveCircle_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct MoveCircle_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for MoveCircle_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::MoveCircle_Response::default())
  }
}

impl rosidl_runtime_rs::Message for MoveCircle_Response {
  type RmwMsg = super::srv::rmw::MoveCircle_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__MoveHome_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
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
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::MoveHome_Request::default())
  }
}

impl rosidl_runtime_rs::Message for MoveHome_Request {
  type RmwMsg = super::srv::rmw::MoveHome_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        speed: msg.speed,
        acc: msg.acc,
        mvtime: msg.mvtime,
        wait: msg.wait,
        timeout: msg.timeout,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      speed: msg.speed,
      acc: msg.acc,
      mvtime: msg.mvtime,
      wait: msg.wait,
      timeout: msg.timeout,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      speed: msg.speed,
      acc: msg.acc,
      mvtime: msg.mvtime,
      wait: msg.wait,
      timeout: msg.timeout,
    }
  }
}


// Corresponds to xarm_msgs__srv__MoveHome_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct MoveHome_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for MoveHome_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::MoveHome_Response::default())
  }
}

impl rosidl_runtime_rs::Message for MoveHome_Response {
  type RmwMsg = super::srv::rmw::MoveHome_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__MoveJoint_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct MoveJoint_Request {
    /// set_servo_angle/set_servo_angle_j
    pub angles: Vec<f32>,


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
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::MoveJoint_Request::default())
  }
}

impl rosidl_runtime_rs::Message for MoveJoint_Request {
  type RmwMsg = super::srv::rmw::MoveJoint_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        angles: msg.angles.into(),
        speed: msg.speed,
        acc: msg.acc,
        mvtime: msg.mvtime,
        wait: msg.wait,
        timeout: msg.timeout,
        radius: msg.radius,
        relative: msg.relative,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        angles: msg.angles.as_slice().into(),
      speed: msg.speed,
      acc: msg.acc,
      mvtime: msg.mvtime,
      wait: msg.wait,
      timeout: msg.timeout,
      radius: msg.radius,
      relative: msg.relative,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      angles: msg.angles
          .into_iter()
          .collect(),
      speed: msg.speed,
      acc: msg.acc,
      mvtime: msg.mvtime,
      wait: msg.wait,
      timeout: msg.timeout,
      radius: msg.radius,
      relative: msg.relative,
    }
  }
}


// Corresponds to xarm_msgs__srv__MoveJoint_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct MoveJoint_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for MoveJoint_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::MoveJoint_Response::default())
  }
}

impl rosidl_runtime_rs::Message for MoveJoint_Response {
  type RmwMsg = super::srv::rmw::MoveJoint_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__MoveVelocity_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct MoveVelocity_Request {
    /// vc_set_joint_velocity/vc_set_cartesian_velocity
    pub speeds: Vec<f32>,

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
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::MoveVelocity_Request::default())
  }
}

impl rosidl_runtime_rs::Message for MoveVelocity_Request {
  type RmwMsg = super::srv::rmw::MoveVelocity_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        speeds: msg.speeds.into(),
        is_sync: msg.is_sync,
        is_tool_coord: msg.is_tool_coord,
        duration: msg.duration,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        speeds: msg.speeds.as_slice().into(),
      is_sync: msg.is_sync,
      is_tool_coord: msg.is_tool_coord,
      duration: msg.duration,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      speeds: msg.speeds
          .into_iter()
          .collect(),
      is_sync: msg.is_sync,
      is_tool_coord: msg.is_tool_coord,
      duration: msg.duration,
    }
  }
}


// Corresponds to xarm_msgs__srv__MoveVelocity_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct MoveVelocity_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for MoveVelocity_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::MoveVelocity_Response::default())
  }
}

impl rosidl_runtime_rs::Message for MoveVelocity_Response {
  type RmwMsg = super::srv::rmw::MoveVelocity_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__RobotiqActivate_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
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
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::RobotiqActivate_Request::default())
  }
}

impl rosidl_runtime_rs::Message for RobotiqActivate_Request {
  type RmwMsg = super::srv::rmw::RobotiqActivate_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        wait: msg.wait,
        timeout: msg.timeout,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      wait: msg.wait,
      timeout: msg.timeout,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      wait: msg.wait,
      timeout: msg.timeout,
    }
  }
}


// Corresponds to xarm_msgs__srv__RobotiqActivate_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct RobotiqActivate_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub ret_data: Vec<u8>,

}



impl Default for RobotiqActivate_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::RobotiqActivate_Response::default())
  }
}

impl rosidl_runtime_rs::Message for RobotiqActivate_Response {
  type RmwMsg = super::srv::rmw::RobotiqActivate_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
        ret_data: msg.ret_data.into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
        ret_data: msg.ret_data.as_slice().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
      ret_data: msg.ret_data
          .into_iter()
          .collect(),
    }
  }
}


// Corresponds to xarm_msgs__srv__RobotiqGetStatus_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct RobotiqGetStatus_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub number_of_registers: u8,

}



impl Default for RobotiqGetStatus_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::RobotiqGetStatus_Request::default())
  }
}

impl rosidl_runtime_rs::Message for RobotiqGetStatus_Request {
  type RmwMsg = super::srv::rmw::RobotiqGetStatus_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        number_of_registers: msg.number_of_registers,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      number_of_registers: msg.number_of_registers,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      number_of_registers: msg.number_of_registers,
    }
  }
}


// Corresponds to xarm_msgs__srv__RobotiqGetStatus_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct RobotiqGetStatus_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub ret_data: Vec<u8>,

}



impl Default for RobotiqGetStatus_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::RobotiqGetStatus_Response::default())
  }
}

impl rosidl_runtime_rs::Message for RobotiqGetStatus_Response {
  type RmwMsg = super::srv::rmw::RobotiqGetStatus_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
        ret_data: msg.ret_data.into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
        ret_data: msg.ret_data.as_slice().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
      ret_data: msg.ret_data
          .into_iter()
          .collect(),
    }
  }
}


// Corresponds to xarm_msgs__srv__RobotiqMove_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
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
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::RobotiqMove_Request::default())
  }
}

impl rosidl_runtime_rs::Message for RobotiqMove_Request {
  type RmwMsg = super::srv::rmw::RobotiqMove_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        pos: msg.pos,
        speed: msg.speed,
        force: msg.force,
        wait: msg.wait,
        timeout: msg.timeout,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      pos: msg.pos,
      speed: msg.speed,
      force: msg.force,
      wait: msg.wait,
      timeout: msg.timeout,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      pos: msg.pos,
      speed: msg.speed,
      force: msg.force,
      wait: msg.wait,
      timeout: msg.timeout,
    }
  }
}


// Corresponds to xarm_msgs__srv__RobotiqMove_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct RobotiqMove_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub ret_data: Vec<u8>,

}



impl Default for RobotiqMove_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::RobotiqMove_Response::default())
  }
}

impl rosidl_runtime_rs::Message for RobotiqMove_Response {
  type RmwMsg = super::srv::rmw::RobotiqMove_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
        ret_data: msg.ret_data.into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
        ret_data: msg.ret_data.as_slice().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
      ret_data: msg.ret_data
          .into_iter()
          .collect(),
    }
  }
}


// Corresponds to xarm_msgs__srv__RobotiqReset_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct RobotiqReset_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub structure_needs_at_least_one_member: u8,

}



impl Default for RobotiqReset_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::RobotiqReset_Request::default())
  }
}

impl rosidl_runtime_rs::Message for RobotiqReset_Request {
  type RmwMsg = super::srv::rmw::RobotiqReset_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      structure_needs_at_least_one_member: msg.structure_needs_at_least_one_member,
    }
  }
}


// Corresponds to xarm_msgs__srv__RobotiqReset_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct RobotiqReset_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub ret_data: Vec<u8>,

}



impl Default for RobotiqReset_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::RobotiqReset_Response::default())
  }
}

impl rosidl_runtime_rs::Message for RobotiqReset_Response {
  type RmwMsg = super::srv::rmw::RobotiqReset_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
        ret_data: msg.ret_data.into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
        ret_data: msg.ret_data.as_slice().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
      ret_data: msg.ret_data
          .into_iter()
          .collect(),
    }
  }
}


// Corresponds to xarm_msgs__srv__SetAnalogIO_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetAnalogIO_Request {
    /// set_cgpio_analog/set_cgpio_analog_with_xyz
    pub ionum: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub value: f32,

    /// set_cgpio_analog_with_xyz
    pub xyz: Vec<f32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub tol_r: f32,

}



impl Default for SetAnalogIO_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetAnalogIO_Request::default())
  }
}

impl rosidl_runtime_rs::Message for SetAnalogIO_Request {
  type RmwMsg = super::srv::rmw::SetAnalogIO_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ionum: msg.ionum,
        value: msg.value,
        xyz: msg.xyz.into(),
        tol_r: msg.tol_r,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ionum: msg.ionum,
      value: msg.value,
        xyz: msg.xyz.as_slice().into(),
      tol_r: msg.tol_r,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ionum: msg.ionum,
      value: msg.value,
      xyz: msg.xyz
          .into_iter()
          .collect(),
      tol_r: msg.tol_r,
    }
  }
}


// Corresponds to xarm_msgs__srv__SetAnalogIO_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetAnalogIO_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for SetAnalogIO_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetAnalogIO_Response::default())
  }
}

impl rosidl_runtime_rs::Message for SetAnalogIO_Response {
  type RmwMsg = super::srv::rmw::SetAnalogIO_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__SetDigitalIO_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
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
    pub xyz: Vec<f32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub tol_r: f32,

}



impl Default for SetDigitalIO_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetDigitalIO_Request::default())
  }
}

impl rosidl_runtime_rs::Message for SetDigitalIO_Request {
  type RmwMsg = super::srv::rmw::SetDigitalIO_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ionum: msg.ionum,
        value: msg.value,
        delay_sec: msg.delay_sec,
        xyz: msg.xyz.into(),
        tol_r: msg.tol_r,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ionum: msg.ionum,
      value: msg.value,
      delay_sec: msg.delay_sec,
        xyz: msg.xyz.as_slice().into(),
      tol_r: msg.tol_r,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ionum: msg.ionum,
      value: msg.value,
      delay_sec: msg.delay_sec,
      xyz: msg.xyz
          .into_iter()
          .collect(),
      tol_r: msg.tol_r,
    }
  }
}


// Corresponds to xarm_msgs__srv__SetDigitalIO_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetDigitalIO_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for SetDigitalIO_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetDigitalIO_Response::default())
  }
}

impl rosidl_runtime_rs::Message for SetDigitalIO_Response {
  type RmwMsg = super::srv::rmw::SetDigitalIO_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__SetFloat32_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetFloat32_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub data: f32,

}



impl Default for SetFloat32_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetFloat32_Request::default())
  }
}

impl rosidl_runtime_rs::Message for SetFloat32_Request {
  type RmwMsg = super::srv::rmw::SetFloat32_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        data: msg.data,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      data: msg.data,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      data: msg.data,
    }
  }
}


// Corresponds to xarm_msgs__srv__SetFloat32_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetFloat32_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for SetFloat32_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetFloat32_Response::default())
  }
}

impl rosidl_runtime_rs::Message for SetFloat32_Response {
  type RmwMsg = super::srv::rmw::SetFloat32_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__SetFloat32List_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetFloat32List_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub datas: Vec<f32>,

}



impl Default for SetFloat32List_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetFloat32List_Request::default())
  }
}

impl rosidl_runtime_rs::Message for SetFloat32List_Request {
  type RmwMsg = super::srv::rmw::SetFloat32List_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        datas: msg.datas.into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        datas: msg.datas.as_slice().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      datas: msg.datas
          .into_iter()
          .collect(),
    }
  }
}


// Corresponds to xarm_msgs__srv__SetFloat32List_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetFloat32List_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for SetFloat32List_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetFloat32List_Response::default())
  }
}

impl rosidl_runtime_rs::Message for SetFloat32List_Response {
  type RmwMsg = super::srv::rmw::SetFloat32List_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__SetInt16_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetInt16_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub data: i16,

}



impl Default for SetInt16_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetInt16_Request::default())
  }
}

impl rosidl_runtime_rs::Message for SetInt16_Request {
  type RmwMsg = super::srv::rmw::SetInt16_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        data: msg.data,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      data: msg.data,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      data: msg.data,
    }
  }
}


// Corresponds to xarm_msgs__srv__SetInt16_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetInt16_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for SetInt16_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetInt16_Response::default())
  }
}

impl rosidl_runtime_rs::Message for SetInt16_Response {
  type RmwMsg = super::srv::rmw::SetInt16_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__SetInt16ById_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
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
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetInt16ById_Request::default())
  }
}

impl rosidl_runtime_rs::Message for SetInt16ById_Request {
  type RmwMsg = super::srv::rmw::SetInt16ById_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        id: msg.id,
        data: msg.data,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      id: msg.id,
      data: msg.data,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      id: msg.id,
      data: msg.data,
    }
  }
}


// Corresponds to xarm_msgs__srv__SetInt16ById_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetInt16ById_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for SetInt16ById_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetInt16ById_Response::default())
  }
}

impl rosidl_runtime_rs::Message for SetInt16ById_Response {
  type RmwMsg = super::srv::rmw::SetInt16ById_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__SetInt16List_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetInt16List_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub datas: Vec<i16>,

}



impl Default for SetInt16List_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetInt16List_Request::default())
  }
}

impl rosidl_runtime_rs::Message for SetInt16List_Request {
  type RmwMsg = super::srv::rmw::SetInt16List_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        datas: msg.datas.into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        datas: msg.datas.as_slice().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      datas: msg.datas
          .into_iter()
          .collect(),
    }
  }
}


// Corresponds to xarm_msgs__srv__SetInt16List_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetInt16List_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for SetInt16List_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetInt16List_Response::default())
  }
}

impl rosidl_runtime_rs::Message for SetInt16List_Response {
  type RmwMsg = super::srv::rmw::SetInt16List_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__SetInt32_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetInt32_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub data: i32,

}



impl Default for SetInt32_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetInt32_Request::default())
  }
}

impl rosidl_runtime_rs::Message for SetInt32_Request {
  type RmwMsg = super::srv::rmw::SetInt32_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        data: msg.data,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      data: msg.data,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      data: msg.data,
    }
  }
}


// Corresponds to xarm_msgs__srv__SetInt32_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetInt32_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for SetInt32_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetInt32_Response::default())
  }
}

impl rosidl_runtime_rs::Message for SetInt32_Response {
  type RmwMsg = super::srv::rmw::SetInt32_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__SetInt32ByType_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
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
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetInt32ByType_Request::default())
  }
}

impl rosidl_runtime_rs::Message for SetInt32ByType_Request {
  type RmwMsg = super::srv::rmw::SetInt32ByType_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        type_: msg.type_,
        data: msg.data,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      type_: msg.type_,
      data: msg.data,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      type_: msg.type_,
      data: msg.data,
    }
  }
}


// Corresponds to xarm_msgs__srv__SetInt32ByType_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetInt32ByType_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for SetInt32ByType_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetInt32ByType_Response::default())
  }
}

impl rosidl_runtime_rs::Message for SetInt32ByType_Response {
  type RmwMsg = super::srv::rmw::SetInt32ByType_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__TrajCtrl_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct TrajCtrl_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub filename: std::string::String,


    // This member is not documented.
    #[allow(missing_docs)]
    pub timeout: f32,

}



impl Default for TrajCtrl_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::TrajCtrl_Request::default())
  }
}

impl rosidl_runtime_rs::Message for TrajCtrl_Request {
  type RmwMsg = super::srv::rmw::TrajCtrl_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        filename: msg.filename.as_str().into(),
        timeout: msg.timeout,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        filename: msg.filename.as_str().into(),
      timeout: msg.timeout,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      filename: msg.filename.to_string(),
      timeout: msg.timeout,
    }
  }
}


// Corresponds to xarm_msgs__srv__TrajCtrl_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct TrajCtrl_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for TrajCtrl_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::TrajCtrl_Response::default())
  }
}

impl rosidl_runtime_rs::Message for TrajCtrl_Response {
  type RmwMsg = super::srv::rmw::TrajCtrl_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__TrajPlay_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct TrajPlay_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub filename: std::string::String,


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
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::TrajPlay_Request::default())
  }
}

impl rosidl_runtime_rs::Message for TrajPlay_Request {
  type RmwMsg = super::srv::rmw::TrajPlay_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        filename: msg.filename.as_str().into(),
        times: msg.times,
        double_speed: msg.double_speed,
        wait: msg.wait,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        filename: msg.filename.as_str().into(),
      times: msg.times,
      double_speed: msg.double_speed,
      wait: msg.wait,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      filename: msg.filename.to_string(),
      times: msg.times,
      double_speed: msg.double_speed,
      wait: msg.wait,
    }
  }
}


// Corresponds to xarm_msgs__srv__TrajPlay_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct TrajPlay_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for TrajPlay_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::TrajPlay_Response::default())
  }
}

impl rosidl_runtime_rs::Message for TrajPlay_Response {
  type RmwMsg = super::srv::rmw::TrajPlay_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__VacuumGripperCtrl_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
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
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::VacuumGripperCtrl_Request::default())
  }
}

impl rosidl_runtime_rs::Message for VacuumGripperCtrl_Request {
  type RmwMsg = super::srv::rmw::VacuumGripperCtrl_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        on: msg.on,
        wait: msg.wait,
        timeout: msg.timeout,
        delay_sec: msg.delay_sec,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      on: msg.on,
      wait: msg.wait,
      timeout: msg.timeout,
      delay_sec: msg.delay_sec,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      on: msg.on,
      wait: msg.wait,
      timeout: msg.timeout,
      delay_sec: msg.delay_sec,
    }
  }
}


// Corresponds to xarm_msgs__srv__VacuumGripperCtrl_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct VacuumGripperCtrl_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for VacuumGripperCtrl_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::VacuumGripperCtrl_Response::default())
  }
}

impl rosidl_runtime_rs::Message for VacuumGripperCtrl_Response {
  type RmwMsg = super::srv::rmw::VacuumGripperCtrl_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__SetTcpLoad_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetTcpLoad_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub weight: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub center_of_gravity: Vec<f32>,

}



impl Default for SetTcpLoad_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetTcpLoad_Request::default())
  }
}

impl rosidl_runtime_rs::Message for SetTcpLoad_Request {
  type RmwMsg = super::srv::rmw::SetTcpLoad_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        weight: msg.weight,
        center_of_gravity: msg.center_of_gravity.into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      weight: msg.weight,
        center_of_gravity: msg.center_of_gravity.as_slice().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      weight: msg.weight,
      center_of_gravity: msg.center_of_gravity
          .into_iter()
          .collect(),
    }
  }
}


// Corresponds to xarm_msgs__srv__SetTcpLoad_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetTcpLoad_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for SetTcpLoad_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetTcpLoad_Response::default())
  }
}

impl rosidl_runtime_rs::Message for SetTcpLoad_Response {
  type RmwMsg = super::srv::rmw::SetTcpLoad_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__SetModbusTimeout_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetModbusTimeout_Request {
    /// set the timeout parameter in modbus communication, in milliseconds
    pub timeout: i32,

    /// whether the set timeout is the timeout of transparent transmission
    pub is_transparent_transmission: bool,

}



impl Default for SetModbusTimeout_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetModbusTimeout_Request::default())
  }
}

impl rosidl_runtime_rs::Message for SetModbusTimeout_Request {
  type RmwMsg = super::srv::rmw::SetModbusTimeout_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        timeout: msg.timeout,
        is_transparent_transmission: msg.is_transparent_transmission,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      timeout: msg.timeout,
      is_transparent_transmission: msg.is_transparent_transmission,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      timeout: msg.timeout,
      is_transparent_transmission: msg.is_transparent_transmission,
    }
  }
}


// Corresponds to xarm_msgs__srv__SetModbusTimeout_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct SetModbusTimeout_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for SetModbusTimeout_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::SetModbusTimeout_Response::default())
  }
}

impl rosidl_runtime_rs::Message for SetModbusTimeout_Response {
  type RmwMsg = super::srv::rmw::SetModbusTimeout_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__IdenLoad_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct IdenLoad_Request {
    /// estimated mass(kg), only required for Lite6 models via the `iden_tcp_load` service
    pub estimated_mass: f32,

}



impl Default for IdenLoad_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::IdenLoad_Request::default())
  }
}

impl rosidl_runtime_rs::Message for IdenLoad_Request {
  type RmwMsg = super::srv::rmw::IdenLoad_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        estimated_mass: msg.estimated_mass,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      estimated_mass: msg.estimated_mass,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      estimated_mass: msg.estimated_mass,
    }
  }
}


// Corresponds to xarm_msgs__srv__IdenLoad_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct IdenLoad_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

    /// the result of identification
    ///   iden_tcp_load: [mass(kg)，x_centroid(mm)，y_centroid(mm)，z_centroid(mm)]
    ///   ft_sensor_iden_load: [mass(kg)，x_centroid(mm)，y_centroid(mm)，z_centroid(mm)，Fx_offset，Fy_offset，Fz_offset，Tx_offset，Ty_offset，Tz_ffset]
    pub datas: Vec<f32>,

}



impl Default for IdenLoad_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::IdenLoad_Response::default())
  }
}

impl rosidl_runtime_rs::Message for IdenLoad_Response {
  type RmwMsg = super::srv::rmw::IdenLoad_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
        datas: msg.datas.into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
        datas: msg.datas.as_slice().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
      datas: msg.datas
          .into_iter()
          .collect(),
    }
  }
}


// Corresponds to xarm_msgs__srv__FtCaliLoad_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct FtCaliLoad_Request {
    /// iden result()
    pub datas: Vec<f32>,

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
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::FtCaliLoad_Request::default())
  }
}

impl rosidl_runtime_rs::Message for FtCaliLoad_Request {
  type RmwMsg = super::srv::rmw::FtCaliLoad_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        datas: msg.datas.into(),
        association_setting_tcp_load: msg.association_setting_tcp_load,
        m: msg.m,
        x: msg.x,
        y: msg.y,
        z: msg.z,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        datas: msg.datas.as_slice().into(),
      association_setting_tcp_load: msg.association_setting_tcp_load,
      m: msg.m,
      x: msg.x,
      y: msg.y,
      z: msg.z,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      datas: msg.datas
          .into_iter()
          .collect(),
      association_setting_tcp_load: msg.association_setting_tcp_load,
      m: msg.m,
      x: msg.x,
      y: msg.y,
      z: msg.z,
    }
  }
}


// Corresponds to xarm_msgs__srv__FtCaliLoad_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct FtCaliLoad_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for FtCaliLoad_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::FtCaliLoad_Response::default())
  }
}

impl rosidl_runtime_rs::Message for FtCaliLoad_Response {
  type RmwMsg = super::srv::rmw::FtCaliLoad_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__FtForceConfig_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct FtForceConfig_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub coord: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub c_axis: Vec<i16>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub ref_: Vec<f32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub limits: Vec<f32>,

}



impl Default for FtForceConfig_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::FtForceConfig_Request::default())
  }
}

impl rosidl_runtime_rs::Message for FtForceConfig_Request {
  type RmwMsg = super::srv::rmw::FtForceConfig_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        coord: msg.coord,
        c_axis: msg.c_axis.into(),
        ref_: msg.ref_.into(),
        limits: msg.limits.into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      coord: msg.coord,
        c_axis: msg.c_axis.as_slice().into(),
        ref_: msg.ref_.as_slice().into(),
        limits: msg.limits.as_slice().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      coord: msg.coord,
      c_axis: msg.c_axis
          .into_iter()
          .collect(),
      ref_: msg.ref_
          .into_iter()
          .collect(),
      limits: msg.limits
          .into_iter()
          .collect(),
    }
  }
}


// Corresponds to xarm_msgs__srv__FtForceConfig_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct FtForceConfig_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for FtForceConfig_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::FtForceConfig_Response::default())
  }
}

impl rosidl_runtime_rs::Message for FtForceConfig_Response {
  type RmwMsg = super::srv::rmw::FtForceConfig_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__FtForcePid_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct FtForcePid_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub kp: Vec<f32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub ki: Vec<f32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub kd: Vec<f32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub xe_limit: Vec<f32>,

}



impl Default for FtForcePid_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::FtForcePid_Request::default())
  }
}

impl rosidl_runtime_rs::Message for FtForcePid_Request {
  type RmwMsg = super::srv::rmw::FtForcePid_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        kp: msg.kp.into(),
        ki: msg.ki.into(),
        kd: msg.kd.into(),
        xe_limit: msg.xe_limit.into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        kp: msg.kp.as_slice().into(),
        ki: msg.ki.as_slice().into(),
        kd: msg.kd.as_slice().into(),
        xe_limit: msg.xe_limit.as_slice().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      kp: msg.kp
          .into_iter()
          .collect(),
      ki: msg.ki
          .into_iter()
          .collect(),
      kd: msg.kd
          .into_iter()
          .collect(),
      xe_limit: msg.xe_limit
          .into_iter()
          .collect(),
    }
  }
}


// Corresponds to xarm_msgs__srv__FtForcePid_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct FtForcePid_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for FtForcePid_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::FtForcePid_Response::default())
  }
}

impl rosidl_runtime_rs::Message for FtForcePid_Response {
  type RmwMsg = super::srv::rmw::FtForcePid_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__FtImpedance_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct FtImpedance_Request {
    /// - set_impedance
    /// - set_impedance_config
    pub coord: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub c_axis: Vec<i16>,

    /// - set_impedance
    /// - set_impedance_mbk
    pub m: Vec<f32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub k: Vec<f32>,


    // This member is not documented.
    #[allow(missing_docs)]
    pub b: Vec<f32>,

}



impl Default for FtImpedance_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::FtImpedance_Request::default())
  }
}

impl rosidl_runtime_rs::Message for FtImpedance_Request {
  type RmwMsg = super::srv::rmw::FtImpedance_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        coord: msg.coord,
        c_axis: msg.c_axis.into(),
        m: msg.m.into(),
        k: msg.k.into(),
        b: msg.b.into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      coord: msg.coord,
        c_axis: msg.c_axis.as_slice().into(),
        m: msg.m.as_slice().into(),
        k: msg.k.as_slice().into(),
        b: msg.b.as_slice().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      coord: msg.coord,
      c_axis: msg.c_axis
          .into_iter()
          .collect(),
      m: msg.m
          .into_iter()
          .collect(),
      k: msg.k
          .into_iter()
          .collect(),
      b: msg.b
          .into_iter()
          .collect(),
    }
  }
}


// Corresponds to xarm_msgs__srv__FtImpedance_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct FtImpedance_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for FtImpedance_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::FtImpedance_Response::default())
  }
}

impl rosidl_runtime_rs::Message for FtImpedance_Response {
  type RmwMsg = super::srv::rmw::FtImpedance_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__LinearTrackBackOrigin_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
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
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::LinearTrackBackOrigin_Request::default())
  }
}

impl rosidl_runtime_rs::Message for LinearTrackBackOrigin_Request {
  type RmwMsg = super::srv::rmw::LinearTrackBackOrigin_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        wait: msg.wait,
        auto_enable: msg.auto_enable,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      wait: msg.wait,
      auto_enable: msg.auto_enable,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      wait: msg.wait,
      auto_enable: msg.auto_enable,
    }
  }
}


// Corresponds to xarm_msgs__srv__LinearTrackBackOrigin_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct LinearTrackBackOrigin_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for LinearTrackBackOrigin_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::LinearTrackBackOrigin_Response::default())
  }
}

impl rosidl_runtime_rs::Message for LinearTrackBackOrigin_Response {
  type RmwMsg = super::srv::rmw::LinearTrackBackOrigin_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__LinearTrackSetPos_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
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
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::LinearTrackSetPos_Request::default())
  }
}

impl rosidl_runtime_rs::Message for LinearTrackSetPos_Request {
  type RmwMsg = super::srv::rmw::LinearTrackSetPos_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        pos: msg.pos,
        speed: msg.speed,
        wait: msg.wait,
        timeout: msg.timeout,
        auto_enable: msg.auto_enable,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      pos: msg.pos,
      speed: msg.speed,
      wait: msg.wait,
      timeout: msg.timeout,
      auto_enable: msg.auto_enable,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      pos: msg.pos,
      speed: msg.speed,
      wait: msg.wait,
      timeout: msg.timeout,
      auto_enable: msg.auto_enable,
    }
  }
}


// Corresponds to xarm_msgs__srv__LinearTrackSetPos_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct LinearTrackSetPos_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub ret: i16,


    // This member is not documented.
    #[allow(missing_docs)]
    pub message: std::string::String,

}



impl Default for LinearTrackSetPos_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::LinearTrackSetPos_Response::default())
  }
}

impl rosidl_runtime_rs::Message for LinearTrackSetPos_Response {
  type RmwMsg = super::srv::rmw::LinearTrackSetPos_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        ret: msg.ret,
        message: msg.message.as_str().into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      ret: msg.ret,
        message: msg.message.as_str().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      ret: msg.ret,
      message: msg.message.to_string(),
    }
  }
}


// Corresponds to xarm_msgs__srv__PlanExec_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct PlanExec_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub wait: bool,

}



impl Default for PlanExec_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::PlanExec_Request::default())
  }
}

impl rosidl_runtime_rs::Message for PlanExec_Request {
  type RmwMsg = super::srv::rmw::PlanExec_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        wait: msg.wait,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      wait: msg.wait,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      wait: msg.wait,
    }
  }
}


// Corresponds to xarm_msgs__srv__PlanExec_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct PlanExec_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub success: bool,

}



impl Default for PlanExec_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::PlanExec_Response::default())
  }
}

impl rosidl_runtime_rs::Message for PlanExec_Response {
  type RmwMsg = super::srv::rmw::PlanExec_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        success: msg.success,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      success: msg.success,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      success: msg.success,
    }
  }
}


// Corresponds to xarm_msgs__srv__PlanJoint_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct PlanJoint_Request {
    /// list of target joint positions in radian.
    pub target: Vec<f64>,

}



impl Default for PlanJoint_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::PlanJoint_Request::default())
  }
}

impl rosidl_runtime_rs::Message for PlanJoint_Request {
  type RmwMsg = super::srv::rmw::PlanJoint_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        target: msg.target.into(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        target: msg.target.as_slice().into(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      target: msg.target
          .into_iter()
          .collect(),
    }
  }
}


// Corresponds to xarm_msgs__srv__PlanJoint_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct PlanJoint_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub success: bool,

}



impl Default for PlanJoint_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::PlanJoint_Response::default())
  }
}

impl rosidl_runtime_rs::Message for PlanJoint_Response {
  type RmwMsg = super::srv::rmw::PlanJoint_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        success: msg.success,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      success: msg.success,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      success: msg.success,
    }
  }
}


// Corresponds to xarm_msgs__srv__PlanPose_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct PlanPose_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub target: geometry_msgs::msg::Pose,

}



impl Default for PlanPose_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::PlanPose_Request::default())
  }
}

impl rosidl_runtime_rs::Message for PlanPose_Request {
  type RmwMsg = super::srv::rmw::PlanPose_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        target: geometry_msgs::msg::Pose::into_rmw_message(std::borrow::Cow::Owned(msg.target)).into_owned(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        target: geometry_msgs::msg::Pose::into_rmw_message(std::borrow::Cow::Borrowed(&msg.target)).into_owned(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      target: geometry_msgs::msg::Pose::from_rmw_message(msg.target),
    }
  }
}


// Corresponds to xarm_msgs__srv__PlanPose_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct PlanPose_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub success: bool,

}



impl Default for PlanPose_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::PlanPose_Response::default())
  }
}

impl rosidl_runtime_rs::Message for PlanPose_Response {
  type RmwMsg = super::srv::rmw::PlanPose_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        success: msg.success,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      success: msg.success,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      success: msg.success,
    }
  }
}


// Corresponds to xarm_msgs__srv__PlanSingleStraight_Request

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct PlanSingleStraight_Request {

    // This member is not documented.
    #[allow(missing_docs)]
    pub target: geometry_msgs::msg::Pose,

}



impl Default for PlanSingleStraight_Request {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::PlanSingleStraight_Request::default())
  }
}

impl rosidl_runtime_rs::Message for PlanSingleStraight_Request {
  type RmwMsg = super::srv::rmw::PlanSingleStraight_Request;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        target: geometry_msgs::msg::Pose::into_rmw_message(std::borrow::Cow::Owned(msg.target)).into_owned(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        target: geometry_msgs::msg::Pose::into_rmw_message(std::borrow::Cow::Borrowed(&msg.target)).into_owned(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      target: geometry_msgs::msg::Pose::from_rmw_message(msg.target),
    }
  }
}


// Corresponds to xarm_msgs__srv__PlanSingleStraight_Response

// This struct is not documented.
#[allow(missing_docs)]

#[allow(non_camel_case_types)]
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct PlanSingleStraight_Response {

    // This member is not documented.
    #[allow(missing_docs)]
    pub success: bool,

}



impl Default for PlanSingleStraight_Response {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::srv::rmw::PlanSingleStraight_Response::default())
  }
}

impl rosidl_runtime_rs::Message for PlanSingleStraight_Response {
  type RmwMsg = super::srv::rmw::PlanSingleStraight_Response;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        success: msg.success,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      success: msg.success,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      success: msg.success,
    }
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


