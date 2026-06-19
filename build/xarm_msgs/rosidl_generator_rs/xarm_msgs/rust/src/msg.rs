#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};



// Corresponds to xarm_msgs__msg__RobotMsg

// This struct is not documented.
#[allow(missing_docs)]

#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct RobotMsg {

    // This member is not documented.
    #[allow(missing_docs)]
    pub header: std_msgs::msg::Header,

    /// feedback information of the controlled robot
    /// state of robot:
    /// 1: RUNNING, executing motion command.
    /// 2: SLEEPING, not in execution, but ready to move.
    /// 3: PAUSED, paused in the middle of unfinished motion.
    /// 4: STOPPED, not ready for any motion commands.
    /// 5: CONFIG_CHANGED, system configuration or mode changed, not ready for motion commands.
    pub state: i16,

    /// mode of robot:
    /// 0 for POSITION mode.(position control by xarm controller box, execute api standard commands)
    /// 1 for SERVOJ mode. (Immediate execution towards received joint space target, like a step response)
    /// 2 for TEACHING_JOINT mode. (Gravity compensated mode, easy for teaching)
    pub mode: i16,

    /// cmdnum: number of commands waiting in the buffer.
    pub cmdnum: i16,

    /// mt_brake: if translated to binary digits, each bit represent one axis, 1 for brake enabled, 0 for brake disabled
    pub mt_brake: i16,

    /// mt_able: if translated to binary digits, each bit represent one axis, 1 for servo control enabled, 0 for servo disabled
    pub mt_able: i16,

    /// error code (if non-zero)
    pub err: i16,

    /// warning code (if non-zero)
    pub warn: i16,

    /// current joint angles expressed in radian.
    pub angle: Vec<f32>,

    /// current TCP Cartesian position expressed in mm(position), radian(orientation)
    pub pose: [f32; 6],

    /// TCP offset from center of flange, with respect to tool frame.
    pub offset: [f32; 6],

}



impl Default for RobotMsg {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::msg::rmw::RobotMsg::default())
  }
}

impl rosidl_runtime_rs::Message for RobotMsg {
  type RmwMsg = super::msg::rmw::RobotMsg;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        header: std_msgs::msg::Header::into_rmw_message(std::borrow::Cow::Owned(msg.header)).into_owned(),
        state: msg.state,
        mode: msg.mode,
        cmdnum: msg.cmdnum,
        mt_brake: msg.mt_brake,
        mt_able: msg.mt_able,
        err: msg.err,
        warn: msg.warn,
        angle: msg.angle.into(),
        pose: msg.pose,
        offset: msg.offset,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        header: std_msgs::msg::Header::into_rmw_message(std::borrow::Cow::Borrowed(&msg.header)).into_owned(),
      state: msg.state,
      mode: msg.mode,
      cmdnum: msg.cmdnum,
      mt_brake: msg.mt_brake,
      mt_able: msg.mt_able,
      err: msg.err,
      warn: msg.warn,
        angle: msg.angle.as_slice().into(),
        pose: msg.pose,
        offset: msg.offset,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      header: std_msgs::msg::Header::from_rmw_message(msg.header),
      state: msg.state,
      mode: msg.mode,
      cmdnum: msg.cmdnum,
      mt_brake: msg.mt_brake,
      mt_able: msg.mt_able,
      err: msg.err,
      warn: msg.warn,
      angle: msg.angle
          .into_iter()
          .collect(),
      pose: msg.pose,
      offset: msg.offset,
    }
  }
}


// Corresponds to xarm_msgs__msg__IOState
/// for indicating 2 digital and 2 analog Input port state

#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct IOState {

    // This member is not documented.
    #[allow(missing_docs)]
    pub digital_1: i32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub digital_2: i32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub analog_1: f32,


    // This member is not documented.
    #[allow(missing_docs)]
    pub analog_2: f32,

}



impl Default for IOState {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::msg::rmw::IOState::default())
  }
}

impl rosidl_runtime_rs::Message for IOState {
  type RmwMsg = super::msg::rmw::IOState;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        digital_1: msg.digital_1,
        digital_2: msg.digital_2,
        analog_1: msg.analog_1,
        analog_2: msg.analog_2,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      digital_1: msg.digital_1,
      digital_2: msg.digital_2,
      analog_1: msg.analog_1,
      analog_2: msg.analog_2,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      digital_1: msg.digital_1,
      digital_2: msg.digital_2,
      analog_1: msg.analog_1,
      analog_2: msg.analog_2,
    }
  }
}


// Corresponds to xarm_msgs__msg__CIOState

// This struct is not documented.
#[allow(missing_docs)]

#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct CIOState {

    // This member is not documented.
    #[allow(missing_docs)]
    pub header: std_msgs::msg::Header,

    /// contorller gpio module state
    pub state: i16,

    /// controller gpio module error code
    pub code: i16,

    /// input_digitals[0]: digital input functional gpio state
    /// input_digitals[1]: digital input configuring gpio state
    ///    CI0: (input_digitals[1] >> 0) & 0x0001
    ///    CI1: (input_digitals[1] >> 1) & 0x0001
    ///    CI7: (input_digitals[1] >> 7) & 0x0001
    ///    DI0: (input_digitals[1] >> 8) & 0x0001
    ///    DI1: (input_digitals[1] >> 9) & 0x0001
    ///    DI7: (input_digitals[1] >> 15) & 0x0001
    pub input_digitals: [u16; 2],

    /// output_digitals[0]: digital output functional gpio state
    /// output_digitals[1]: digital output configuring gpio state
    ///    CO0: (output_digitals[1] >> 0) & 0x0001
    ///    CO1: (output_digitals[1] >> 1) & 0x0001
    ///    CO7: (output_digitals[1] >> 7) & 0x0001
    ///    DO0: (output_digitals[1] >> 8) & 0x0001
    ///    DO1: (output_digitals[1] >> 9) & 0x0001
    ///    DO7: (output_digitals[1] >> 15) & 0x0001
    pub output_digitals: [u16; 2],

    /// input_analogs[0]: the value of AI0
    /// input_analogs[1]: the value of AI1
    pub input_analogs: [f32; 2],

    /// output_analogs[0]: the value of AO0
    /// output_analogs[1]: the value of AO1
    pub output_analogs: [f32; 2],

    /// digital input functional info
    pub input_conf: [u8; 16],

    /// digital output functional info
    pub output_conf: [u8; 16],

}



impl Default for CIOState {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::msg::rmw::CIOState::default())
  }
}

impl rosidl_runtime_rs::Message for CIOState {
  type RmwMsg = super::msg::rmw::CIOState;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        header: std_msgs::msg::Header::into_rmw_message(std::borrow::Cow::Owned(msg.header)).into_owned(),
        state: msg.state,
        code: msg.code,
        input_digitals: msg.input_digitals,
        output_digitals: msg.output_digitals,
        input_analogs: msg.input_analogs,
        output_analogs: msg.output_analogs,
        input_conf: msg.input_conf,
        output_conf: msg.output_conf,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        header: std_msgs::msg::Header::into_rmw_message(std::borrow::Cow::Borrowed(&msg.header)).into_owned(),
      state: msg.state,
      code: msg.code,
        input_digitals: msg.input_digitals,
        output_digitals: msg.output_digitals,
        input_analogs: msg.input_analogs,
        output_analogs: msg.output_analogs,
        input_conf: msg.input_conf,
        output_conf: msg.output_conf,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      header: std_msgs::msg::Header::from_rmw_message(msg.header),
      state: msg.state,
      code: msg.code,
      input_digitals: msg.input_digitals,
      output_digitals: msg.output_digitals,
      input_analogs: msg.input_analogs,
      output_analogs: msg.output_analogs,
      input_conf: msg.input_conf,
      output_conf: msg.output_conf,
    }
  }
}


