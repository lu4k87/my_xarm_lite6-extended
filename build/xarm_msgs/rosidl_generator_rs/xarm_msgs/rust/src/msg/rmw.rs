#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__msg__RobotMsg() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__msg__RobotMsg__init(msg: *mut RobotMsg) -> bool;
    fn xarm_msgs__msg__RobotMsg__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<RobotMsg>, size: usize) -> bool;
    fn xarm_msgs__msg__RobotMsg__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<RobotMsg>);
    fn xarm_msgs__msg__RobotMsg__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<RobotMsg>, out_seq: *mut rosidl_runtime_rs::Sequence<RobotMsg>) -> bool;
}

// Corresponds to xarm_msgs__msg__RobotMsg
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct RobotMsg {

    // This member is not documented.
    #[allow(missing_docs)]
    pub header: std_msgs::msg::rmw::Header,

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
    pub angle: rosidl_runtime_rs::Sequence<f32>,

    /// current TCP Cartesian position expressed in mm(position), radian(orientation)
    pub pose: [f32; 6],

    /// TCP offset from center of flange, with respect to tool frame.
    pub offset: [f32; 6],

}



impl Default for RobotMsg {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__msg__RobotMsg__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__msg__RobotMsg__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for RobotMsg {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__msg__RobotMsg__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__msg__RobotMsg__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__msg__RobotMsg__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for RobotMsg {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for RobotMsg where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/msg/RobotMsg";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__msg__RobotMsg() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__msg__IOState() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__msg__IOState__init(msg: *mut IOState) -> bool;
    fn xarm_msgs__msg__IOState__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<IOState>, size: usize) -> bool;
    fn xarm_msgs__msg__IOState__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<IOState>);
    fn xarm_msgs__msg__IOState__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<IOState>, out_seq: *mut rosidl_runtime_rs::Sequence<IOState>) -> bool;
}

// Corresponds to xarm_msgs__msg__IOState
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]

/// for indicating 2 digital and 2 analog Input port state

#[repr(C)]
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
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__msg__IOState__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__msg__IOState__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for IOState {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__msg__IOState__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__msg__IOState__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__msg__IOState__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for IOState {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for IOState where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/msg/IOState";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__msg__IOState() }
  }
}


#[link(name = "xarm_msgs__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__msg__CIOState() -> *const std::ffi::c_void;
}

#[link(name = "xarm_msgs__rosidl_generator_c")]
extern "C" {
    fn xarm_msgs__msg__CIOState__init(msg: *mut CIOState) -> bool;
    fn xarm_msgs__msg__CIOState__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<CIOState>, size: usize) -> bool;
    fn xarm_msgs__msg__CIOState__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<CIOState>);
    fn xarm_msgs__msg__CIOState__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<CIOState>, out_seq: *mut rosidl_runtime_rs::Sequence<CIOState>) -> bool;
}

// Corresponds to xarm_msgs__msg__CIOState
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct CIOState {

    // This member is not documented.
    #[allow(missing_docs)]
    pub header: std_msgs::msg::rmw::Header,

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
    unsafe {
      let mut msg = std::mem::zeroed();
      if !xarm_msgs__msg__CIOState__init(&mut msg as *mut _) {
        panic!("Call to xarm_msgs__msg__CIOState__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for CIOState {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__msg__CIOState__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__msg__CIOState__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { xarm_msgs__msg__CIOState__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for CIOState {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for CIOState where Self: Sized {
  const TYPE_NAME: &'static str = "xarm_msgs/msg/CIOState";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__xarm_msgs__msg__CIOState() }
  }
}


