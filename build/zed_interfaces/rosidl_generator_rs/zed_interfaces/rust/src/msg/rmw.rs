#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};


#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__Object() -> *const std::ffi::c_void;
}

#[link(name = "zed_interfaces__rosidl_generator_c")]
extern "C" {
    fn zed_interfaces__msg__Object__init(msg: *mut Object) -> bool;
    fn zed_interfaces__msg__Object__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<Object>, size: usize) -> bool;
    fn zed_interfaces__msg__Object__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<Object>);
    fn zed_interfaces__msg__Object__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<Object>, out_seq: *mut rosidl_runtime_rs::Sequence<Object>) -> bool;
}

// Corresponds to zed_interfaces__msg__Object
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]

/// Object label

#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Object {

    // This member is not documented.
    #[allow(missing_docs)]
    pub label: rosidl_runtime_rs::String,

    /// Object label ID
    pub label_id: i16,

    /// Object sub
    pub sublabel: rosidl_runtime_rs::String,

    /// Object confidence level (1-99)
    pub confidence: f32,

    /// Object centroid position
    pub position: [f32; 3],

    /// Position covariance
    pub position_covariance: [f32; 6],

    /// Object velocity
    pub velocity: [f32; 3],


    // This member is not documented.
    #[allow(missing_docs)]
    pub tracking_available: bool,

    /// Tracking available
    /// Tracking state
    /// 0 -> OFF (object not valid)
    /// 1 -> OK
    /// 2 -> SEARCHING (occlusion occurred, trajectory is estimated)
    pub tracking_state: i8,

    /// Action state
    /// 0 -> IDLE
    /// 2 -> MOVING
    pub action_state: i8,

    /// 2D Bounding box projected to Camera image
    pub bounding_box_2d: super::super::msg::rmw::BoundingBox2Di,

    /// 3D Bounding box in world frame
    pub bounding_box_3d: super::super::msg::rmw::BoundingBox3D,

    /// 3D dimensions (width, height, lenght)
    pub dimensions_3d: [f32; 3],

    /// Is skeleton available?
    pub skeleton_available: bool,

    /// Skeleton format
    /// 0 -> POSE_18
    /// 1 -> POSE_34
    /// 2 -> POSE_38
    /// 3 -> POSE_70
    pub body_format: i8,

    /// 2D Bounding box projected to Camera image of the person head
    pub head_bounding_box_2d: super::super::msg::rmw::BoundingBox2Df,

    /// 3D Bounding box in world frame of the person head
    pub head_bounding_box_3d: super::super::msg::rmw::BoundingBox3D,

    /// 3D position of the centroid of the person head
    pub head_position: [f32; 3],

    /// 2D Person skeleton projected to Camera image
    pub skeleton_2d: super::super::msg::rmw::Skeleton2D,

    /// 3D Person skeleton in world frame
    pub skeleton_3d: super::super::msg::rmw::Skeleton3D,

}



impl Default for Object {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !zed_interfaces__msg__Object__init(&mut msg as *mut _) {
        panic!("Call to zed_interfaces__msg__Object__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for Object {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__Object__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__Object__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__Object__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for Object {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for Object where Self: Sized {
  const TYPE_NAME: &'static str = "zed_interfaces/msg/Object";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__Object() }
  }
}


#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__ObjectsStamped() -> *const std::ffi::c_void;
}

#[link(name = "zed_interfaces__rosidl_generator_c")]
extern "C" {
    fn zed_interfaces__msg__ObjectsStamped__init(msg: *mut ObjectsStamped) -> bool;
    fn zed_interfaces__msg__ObjectsStamped__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<ObjectsStamped>, size: usize) -> bool;
    fn zed_interfaces__msg__ObjectsStamped__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<ObjectsStamped>);
    fn zed_interfaces__msg__ObjectsStamped__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<ObjectsStamped>, out_seq: *mut rosidl_runtime_rs::Sequence<ObjectsStamped>) -> bool;
}

// Corresponds to zed_interfaces__msg__ObjectsStamped
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]

/// Standard Header

#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct ObjectsStamped {

    // This member is not documented.
    #[allow(missing_docs)]
    pub header: std_msgs::msg::rmw::Header,

    /// Array of `object_stamped` topics
    pub objects: rosidl_runtime_rs::Sequence<super::super::msg::rmw::Object>,

}



impl Default for ObjectsStamped {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !zed_interfaces__msg__ObjectsStamped__init(&mut msg as *mut _) {
        panic!("Call to zed_interfaces__msg__ObjectsStamped__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for ObjectsStamped {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__ObjectsStamped__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__ObjectsStamped__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__ObjectsStamped__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for ObjectsStamped {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for ObjectsStamped where Self: Sized {
  const TYPE_NAME: &'static str = "zed_interfaces/msg/ObjectsStamped";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__ObjectsStamped() }
  }
}


#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__Keypoint2Di() -> *const std::ffi::c_void;
}

#[link(name = "zed_interfaces__rosidl_generator_c")]
extern "C" {
    fn zed_interfaces__msg__Keypoint2Di__init(msg: *mut Keypoint2Di) -> bool;
    fn zed_interfaces__msg__Keypoint2Di__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<Keypoint2Di>, size: usize) -> bool;
    fn zed_interfaces__msg__Keypoint2Di__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<Keypoint2Di>);
    fn zed_interfaces__msg__Keypoint2Di__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<Keypoint2Di>, out_seq: *mut rosidl_runtime_rs::Sequence<Keypoint2Di>) -> bool;
}

// Corresponds to zed_interfaces__msg__Keypoint2Di
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Keypoint2Di {

    // This member is not documented.
    #[allow(missing_docs)]
    pub kp: [u32; 2],

}



impl Default for Keypoint2Di {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !zed_interfaces__msg__Keypoint2Di__init(&mut msg as *mut _) {
        panic!("Call to zed_interfaces__msg__Keypoint2Di__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for Keypoint2Di {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__Keypoint2Di__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__Keypoint2Di__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__Keypoint2Di__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for Keypoint2Di {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for Keypoint2Di where Self: Sized {
  const TYPE_NAME: &'static str = "zed_interfaces/msg/Keypoint2Di";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__Keypoint2Di() }
  }
}


#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__Keypoint2Df() -> *const std::ffi::c_void;
}

#[link(name = "zed_interfaces__rosidl_generator_c")]
extern "C" {
    fn zed_interfaces__msg__Keypoint2Df__init(msg: *mut Keypoint2Df) -> bool;
    fn zed_interfaces__msg__Keypoint2Df__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<Keypoint2Df>, size: usize) -> bool;
    fn zed_interfaces__msg__Keypoint2Df__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<Keypoint2Df>);
    fn zed_interfaces__msg__Keypoint2Df__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<Keypoint2Df>, out_seq: *mut rosidl_runtime_rs::Sequence<Keypoint2Df>) -> bool;
}

// Corresponds to zed_interfaces__msg__Keypoint2Df
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Keypoint2Df {

    // This member is not documented.
    #[allow(missing_docs)]
    pub kp: [f32; 2],

}



impl Default for Keypoint2Df {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !zed_interfaces__msg__Keypoint2Df__init(&mut msg as *mut _) {
        panic!("Call to zed_interfaces__msg__Keypoint2Df__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for Keypoint2Df {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__Keypoint2Df__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__Keypoint2Df__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__Keypoint2Df__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for Keypoint2Df {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for Keypoint2Df where Self: Sized {
  const TYPE_NAME: &'static str = "zed_interfaces/msg/Keypoint2Df";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__Keypoint2Df() }
  }
}


#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__Keypoint3D() -> *const std::ffi::c_void;
}

#[link(name = "zed_interfaces__rosidl_generator_c")]
extern "C" {
    fn zed_interfaces__msg__Keypoint3D__init(msg: *mut Keypoint3D) -> bool;
    fn zed_interfaces__msg__Keypoint3D__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<Keypoint3D>, size: usize) -> bool;
    fn zed_interfaces__msg__Keypoint3D__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<Keypoint3D>);
    fn zed_interfaces__msg__Keypoint3D__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<Keypoint3D>, out_seq: *mut rosidl_runtime_rs::Sequence<Keypoint3D>) -> bool;
}

// Corresponds to zed_interfaces__msg__Keypoint3D
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]


// This struct is not documented.
#[allow(missing_docs)]

#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Keypoint3D {

    // This member is not documented.
    #[allow(missing_docs)]
    pub kp: [f32; 3],

}



impl Default for Keypoint3D {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !zed_interfaces__msg__Keypoint3D__init(&mut msg as *mut _) {
        panic!("Call to zed_interfaces__msg__Keypoint3D__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for Keypoint3D {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__Keypoint3D__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__Keypoint3D__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__Keypoint3D__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for Keypoint3D {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for Keypoint3D where Self: Sized {
  const TYPE_NAME: &'static str = "zed_interfaces/msg/Keypoint3D";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__Keypoint3D() }
  }
}


#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__BoundingBox2Di() -> *const std::ffi::c_void;
}

#[link(name = "zed_interfaces__rosidl_generator_c")]
extern "C" {
    fn zed_interfaces__msg__BoundingBox2Di__init(msg: *mut BoundingBox2Di) -> bool;
    fn zed_interfaces__msg__BoundingBox2Di__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<BoundingBox2Di>, size: usize) -> bool;
    fn zed_interfaces__msg__BoundingBox2Di__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<BoundingBox2Di>);
    fn zed_interfaces__msg__BoundingBox2Di__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<BoundingBox2Di>, out_seq: *mut rosidl_runtime_rs::Sequence<BoundingBox2Di>) -> bool;
}

// Corresponds to zed_interfaces__msg__BoundingBox2Di
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]

/// 0 ------- 1
/// |         |
/// |         |
/// |         |
/// 3 ------- 2

#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct BoundingBox2Di {

    // This member is not documented.
    #[allow(missing_docs)]
    pub corners: [super::super::msg::rmw::Keypoint2Di; 4],

}



impl Default for BoundingBox2Di {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !zed_interfaces__msg__BoundingBox2Di__init(&mut msg as *mut _) {
        panic!("Call to zed_interfaces__msg__BoundingBox2Di__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for BoundingBox2Di {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__BoundingBox2Di__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__BoundingBox2Di__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__BoundingBox2Di__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for BoundingBox2Di {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for BoundingBox2Di where Self: Sized {
  const TYPE_NAME: &'static str = "zed_interfaces/msg/BoundingBox2Di";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__BoundingBox2Di() }
  }
}


#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__BoundingBox2Df() -> *const std::ffi::c_void;
}

#[link(name = "zed_interfaces__rosidl_generator_c")]
extern "C" {
    fn zed_interfaces__msg__BoundingBox2Df__init(msg: *mut BoundingBox2Df) -> bool;
    fn zed_interfaces__msg__BoundingBox2Df__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<BoundingBox2Df>, size: usize) -> bool;
    fn zed_interfaces__msg__BoundingBox2Df__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<BoundingBox2Df>);
    fn zed_interfaces__msg__BoundingBox2Df__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<BoundingBox2Df>, out_seq: *mut rosidl_runtime_rs::Sequence<BoundingBox2Df>) -> bool;
}

// Corresponds to zed_interfaces__msg__BoundingBox2Df
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]

/// 0 ------- 1
/// |         |
/// |         |
/// |         |
/// 3 ------- 2

#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct BoundingBox2Df {

    // This member is not documented.
    #[allow(missing_docs)]
    pub corners: [super::super::msg::rmw::Keypoint2Df; 4],

}



impl Default for BoundingBox2Df {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !zed_interfaces__msg__BoundingBox2Df__init(&mut msg as *mut _) {
        panic!("Call to zed_interfaces__msg__BoundingBox2Df__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for BoundingBox2Df {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__BoundingBox2Df__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__BoundingBox2Df__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__BoundingBox2Df__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for BoundingBox2Df {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for BoundingBox2Df where Self: Sized {
  const TYPE_NAME: &'static str = "zed_interfaces/msg/BoundingBox2Df";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__BoundingBox2Df() }
  }
}


#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__BoundingBox3D() -> *const std::ffi::c_void;
}

#[link(name = "zed_interfaces__rosidl_generator_c")]
extern "C" {
    fn zed_interfaces__msg__BoundingBox3D__init(msg: *mut BoundingBox3D) -> bool;
    fn zed_interfaces__msg__BoundingBox3D__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<BoundingBox3D>, size: usize) -> bool;
    fn zed_interfaces__msg__BoundingBox3D__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<BoundingBox3D>);
    fn zed_interfaces__msg__BoundingBox3D__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<BoundingBox3D>, out_seq: *mut rosidl_runtime_rs::Sequence<BoundingBox3D>) -> bool;
}

// Corresponds to zed_interfaces__msg__BoundingBox3D
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]

///   1 ------- 2
///  /.        /|
/// 0 ------- 3 |
/// | .       | |
/// | 5.......| 6
/// |.        |/
/// 4 ------- 7

#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct BoundingBox3D {

    // This member is not documented.
    #[allow(missing_docs)]
    pub corners: [super::super::msg::rmw::Keypoint3D; 8],

}



impl Default for BoundingBox3D {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !zed_interfaces__msg__BoundingBox3D__init(&mut msg as *mut _) {
        panic!("Call to zed_interfaces__msg__BoundingBox3D__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for BoundingBox3D {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__BoundingBox3D__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__BoundingBox3D__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__BoundingBox3D__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for BoundingBox3D {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for BoundingBox3D where Self: Sized {
  const TYPE_NAME: &'static str = "zed_interfaces/msg/BoundingBox3D";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__BoundingBox3D() }
  }
}


#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__Skeleton2D() -> *const std::ffi::c_void;
}

#[link(name = "zed_interfaces__rosidl_generator_c")]
extern "C" {
    fn zed_interfaces__msg__Skeleton2D__init(msg: *mut Skeleton2D) -> bool;
    fn zed_interfaces__msg__Skeleton2D__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<Skeleton2D>, size: usize) -> bool;
    fn zed_interfaces__msg__Skeleton2D__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<Skeleton2D>);
    fn zed_interfaces__msg__Skeleton2D__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<Skeleton2D>, out_seq: *mut rosidl_runtime_rs::Sequence<Skeleton2D>) -> bool;
}

// Corresponds to zed_interfaces__msg__Skeleton2D
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]

/// Skeleton joints

#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Skeleton2D {

    // This member is not documented.
    #[allow(missing_docs)]
    #[cfg_attr(feature = "serde", serde(with = "serde_big_array::BigArray"))]
    pub keypoints: [super::super::msg::rmw::Keypoint2Df; 70],

}



impl Default for Skeleton2D {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !zed_interfaces__msg__Skeleton2D__init(&mut msg as *mut _) {
        panic!("Call to zed_interfaces__msg__Skeleton2D__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for Skeleton2D {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__Skeleton2D__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__Skeleton2D__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__Skeleton2D__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for Skeleton2D {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for Skeleton2D where Self: Sized {
  const TYPE_NAME: &'static str = "zed_interfaces/msg/Skeleton2D";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__Skeleton2D() }
  }
}


#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__Skeleton3D() -> *const std::ffi::c_void;
}

#[link(name = "zed_interfaces__rosidl_generator_c")]
extern "C" {
    fn zed_interfaces__msg__Skeleton3D__init(msg: *mut Skeleton3D) -> bool;
    fn zed_interfaces__msg__Skeleton3D__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<Skeleton3D>, size: usize) -> bool;
    fn zed_interfaces__msg__Skeleton3D__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<Skeleton3D>);
    fn zed_interfaces__msg__Skeleton3D__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<Skeleton3D>, out_seq: *mut rosidl_runtime_rs::Sequence<Skeleton3D>) -> bool;
}

// Corresponds to zed_interfaces__msg__Skeleton3D
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]

/// Skeleton joints

#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Skeleton3D {

    // This member is not documented.
    #[allow(missing_docs)]
    #[cfg_attr(feature = "serde", serde(with = "serde_big_array::BigArray"))]
    pub keypoints: [super::super::msg::rmw::Keypoint3D; 70],

}



impl Default for Skeleton3D {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !zed_interfaces__msg__Skeleton3D__init(&mut msg as *mut _) {
        panic!("Call to zed_interfaces__msg__Skeleton3D__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for Skeleton3D {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__Skeleton3D__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__Skeleton3D__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__Skeleton3D__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for Skeleton3D {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for Skeleton3D where Self: Sized {
  const TYPE_NAME: &'static str = "zed_interfaces/msg/Skeleton3D";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__Skeleton3D() }
  }
}


#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__DepthInfoStamped() -> *const std::ffi::c_void;
}

#[link(name = "zed_interfaces__rosidl_generator_c")]
extern "C" {
    fn zed_interfaces__msg__DepthInfoStamped__init(msg: *mut DepthInfoStamped) -> bool;
    fn zed_interfaces__msg__DepthInfoStamped__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<DepthInfoStamped>, size: usize) -> bool;
    fn zed_interfaces__msg__DepthInfoStamped__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<DepthInfoStamped>);
    fn zed_interfaces__msg__DepthInfoStamped__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<DepthInfoStamped>, out_seq: *mut rosidl_runtime_rs::Sequence<DepthInfoStamped>) -> bool;
}

// Corresponds to zed_interfaces__msg__DepthInfoStamped
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]

/// Standard Header

#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct DepthInfoStamped {

    // This member is not documented.
    #[allow(missing_docs)]
    pub header: std_msgs::msg::rmw::Header,

    /// Miminum measured depth
    pub min_depth: f32,

    /// Maximum measured depth
    pub max_depth: f32,

}



impl Default for DepthInfoStamped {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !zed_interfaces__msg__DepthInfoStamped__init(&mut msg as *mut _) {
        panic!("Call to zed_interfaces__msg__DepthInfoStamped__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for DepthInfoStamped {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__DepthInfoStamped__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__DepthInfoStamped__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__DepthInfoStamped__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for DepthInfoStamped {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for DepthInfoStamped where Self: Sized {
  const TYPE_NAME: &'static str = "zed_interfaces/msg/DepthInfoStamped";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__DepthInfoStamped() }
  }
}


#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__PlaneStamped() -> *const std::ffi::c_void;
}

#[link(name = "zed_interfaces__rosidl_generator_c")]
extern "C" {
    fn zed_interfaces__msg__PlaneStamped__init(msg: *mut PlaneStamped) -> bool;
    fn zed_interfaces__msg__PlaneStamped__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<PlaneStamped>, size: usize) -> bool;
    fn zed_interfaces__msg__PlaneStamped__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<PlaneStamped>);
    fn zed_interfaces__msg__PlaneStamped__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<PlaneStamped>, out_seq: *mut rosidl_runtime_rs::Sequence<PlaneStamped>) -> bool;
}

// Corresponds to zed_interfaces__msg__PlaneStamped
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]

/// Standard Header

#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct PlaneStamped {

    // This member is not documented.
    #[allow(missing_docs)]
    pub header: std_msgs::msg::rmw::Header,

    /// Mesh of the place
    pub mesh: shape_msgs::msg::rmw::Mesh,

    /// Representation of a plane, using the plane equation ax + by + cz + d = 0
    pub coefficients: shape_msgs::msg::rmw::Plane,

    /// Normal vector
    pub normal: geometry_msgs::msg::rmw::Point32,

    /// Center point
    pub center: geometry_msgs::msg::rmw::Point32,

    /// Plane pose relative to the global reference frame
    pub pose: geometry_msgs::msg::rmw::Transform,

    /// Width and height of the bounding rectangle around the plane contours
    pub extents: [f32; 2],

    /// The polygon bounds of the plane
    pub bounds: geometry_msgs::msg::rmw::Polygon,

}



impl Default for PlaneStamped {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !zed_interfaces__msg__PlaneStamped__init(&mut msg as *mut _) {
        panic!("Call to zed_interfaces__msg__PlaneStamped__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for PlaneStamped {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__PlaneStamped__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__PlaneStamped__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__PlaneStamped__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for PlaneStamped {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for PlaneStamped where Self: Sized {
  const TYPE_NAME: &'static str = "zed_interfaces/msg/PlaneStamped";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__PlaneStamped() }
  }
}


#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__PosTrackStatus() -> *const std::ffi::c_void;
}

#[link(name = "zed_interfaces__rosidl_generator_c")]
extern "C" {
    fn zed_interfaces__msg__PosTrackStatus__init(msg: *mut PosTrackStatus) -> bool;
    fn zed_interfaces__msg__PosTrackStatus__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<PosTrackStatus>, size: usize) -> bool;
    fn zed_interfaces__msg__PosTrackStatus__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<PosTrackStatus>);
    fn zed_interfaces__msg__PosTrackStatus__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<PosTrackStatus>, out_seq: *mut rosidl_runtime_rs::Sequence<PosTrackStatus>) -> bool;
}

// Corresponds to zed_interfaces__msg__PosTrackStatus
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]

/// CONSTANTS

#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct PosTrackStatus {
    /// VISUAL_STATUS
    /// Represents the current state of Visual-Inertial Odometry (VIO) tracking between the previous frame and the current frame.
    /// OK  - The positional tracking module successfully tracked from the previous frame to the current frame.
    /// NOT_OK - The positional tracking module failed to track from the previous frame to the current frame.
    pub odometry_status: u8,

    /// SPATIAL_MEMORY_STATUS
    /// Represents the current state of camera tracking in the global map.
    /// OK - The positional tracking module is operating normally.
    /// LOOP_CLOSED - The positional tracking module detected a loop and corrected its position.
    /// SEARCHING - The positional tracking module is searching for recognizable areas in the global map to relocate.
    /// OFF - Spatial memory is disabled
    pub spatial_memory_status: u8,

    /// Deprecated
    pub status: u8,

}

impl PosTrackStatus {

    // This constant is not documented.
    #[allow(missing_docs)]
    pub const OK: u8 = 0;


    // This constant is not documented.
    #[allow(missing_docs)]
    pub const UNAVAILABLE: u8 = 1;


    // This constant is not documented.
    #[allow(missing_docs)]
    pub const LOOP_CLOSED: u8 = 1;


    // This constant is not documented.
    #[allow(missing_docs)]
    pub const SEARCHING: u8 = 2;


    // This constant is not documented.
    #[allow(missing_docs)]
    pub const OFF: u8 = 3;

}


impl Default for PosTrackStatus {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !zed_interfaces__msg__PosTrackStatus__init(&mut msg as *mut _) {
        panic!("Call to zed_interfaces__msg__PosTrackStatus__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for PosTrackStatus {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__PosTrackStatus__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__PosTrackStatus__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__PosTrackStatus__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for PosTrackStatus {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for PosTrackStatus where Self: Sized {
  const TYPE_NAME: &'static str = "zed_interfaces/msg/PosTrackStatus";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__PosTrackStatus() }
  }
}


#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__GnssFusionStatus() -> *const std::ffi::c_void;
}

#[link(name = "zed_interfaces__rosidl_generator_c")]
extern "C" {
    fn zed_interfaces__msg__GnssFusionStatus__init(msg: *mut GnssFusionStatus) -> bool;
    fn zed_interfaces__msg__GnssFusionStatus__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<GnssFusionStatus>, size: usize) -> bool;
    fn zed_interfaces__msg__GnssFusionStatus__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<GnssFusionStatus>);
    fn zed_interfaces__msg__GnssFusionStatus__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<GnssFusionStatus>, out_seq: *mut rosidl_runtime_rs::Sequence<GnssFusionStatus>) -> bool;
}

// Corresponds to zed_interfaces__msg__GnssFusionStatus
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]

/// GNSS_FUSION_STATUS
/// Represents the current state of GNSS fusion for global localization.
/// OK - The GNSS fusion module is calibrated and working successfully.
/// OFF - The GNSS fusion module is not enabled.
/// CALIBRATION_IN_PROGRESS - Calibration of the GNSS/VIO fusion module is in progress.
/// RECALIBRATION_IN_PROGRESS- Re-alignment of GNSS/VIO data is in progress, leading to potentially inaccurate global position.

#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct GnssFusionStatus {

    // This member is not documented.
    #[allow(missing_docs)]
    pub gnss_fusion_status: u8,

}

impl GnssFusionStatus {

    // This constant is not documented.
    #[allow(missing_docs)]
    pub const OK: u8 = 0;


    // This constant is not documented.
    #[allow(missing_docs)]
    pub const OFF: u8 = 1;


    // This constant is not documented.
    #[allow(missing_docs)]
    pub const CALIBRATION_IN_PROGRESS: u8 = 2;


    // This constant is not documented.
    #[allow(missing_docs)]
    pub const RECALIBRATION_IN_PROGRESS: u8 = 3;

}


impl Default for GnssFusionStatus {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !zed_interfaces__msg__GnssFusionStatus__init(&mut msg as *mut _) {
        panic!("Call to zed_interfaces__msg__GnssFusionStatus__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for GnssFusionStatus {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__GnssFusionStatus__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__GnssFusionStatus__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__GnssFusionStatus__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for GnssFusionStatus {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for GnssFusionStatus where Self: Sized {
  const TYPE_NAME: &'static str = "zed_interfaces/msg/GnssFusionStatus";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__GnssFusionStatus() }
  }
}


#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__Heartbeat() -> *const std::ffi::c_void;
}

#[link(name = "zed_interfaces__rosidl_generator_c")]
extern "C" {
    fn zed_interfaces__msg__Heartbeat__init(msg: *mut Heartbeat) -> bool;
    fn zed_interfaces__msg__Heartbeat__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<Heartbeat>, size: usize) -> bool;
    fn zed_interfaces__msg__Heartbeat__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<Heartbeat>);
    fn zed_interfaces__msg__Heartbeat__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<Heartbeat>, out_seq: *mut rosidl_runtime_rs::Sequence<Heartbeat>) -> bool;
}

// Corresponds to zed_interfaces__msg__Heartbeat
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]

/// Message to notify that the node is alive to other nodes

#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Heartbeat {
    /// idx of the message
    pub beat_count: u64,

    /// namespace of the node
    pub node_ns: rosidl_runtime_rs::String,

    /// name of the node
    pub node_name: rosidl_runtime_rs::String,

    /// full node name
    pub full_name: rosidl_runtime_rs::String,

    /// serial number of the input camera
    pub camera_sn: u32,

    /// data from an svo?
    pub svo_mode: bool,

    /// data from simulation?
    pub simul_mode: bool,

}



impl Default for Heartbeat {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !zed_interfaces__msg__Heartbeat__init(&mut msg as *mut _) {
        panic!("Call to zed_interfaces__msg__Heartbeat__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for Heartbeat {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__Heartbeat__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__Heartbeat__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__Heartbeat__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for Heartbeat {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for Heartbeat where Self: Sized {
  const TYPE_NAME: &'static str = "zed_interfaces/msg/Heartbeat";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__Heartbeat() }
  }
}


#[link(name = "zed_interfaces__rosidl_typesupport_c")]
extern "C" {
    fn rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__MagHeadingStatus() -> *const std::ffi::c_void;
}

#[link(name = "zed_interfaces__rosidl_generator_c")]
extern "C" {
    fn zed_interfaces__msg__MagHeadingStatus__init(msg: *mut MagHeadingStatus) -> bool;
    fn zed_interfaces__msg__MagHeadingStatus__Sequence__init(seq: *mut rosidl_runtime_rs::Sequence<MagHeadingStatus>, size: usize) -> bool;
    fn zed_interfaces__msg__MagHeadingStatus__Sequence__fini(seq: *mut rosidl_runtime_rs::Sequence<MagHeadingStatus>);
    fn zed_interfaces__msg__MagHeadingStatus__Sequence__copy(in_seq: &rosidl_runtime_rs::Sequence<MagHeadingStatus>, out_seq: *mut rosidl_runtime_rs::Sequence<MagHeadingStatus>) -> bool;
}

// Corresponds to zed_interfaces__msg__MagHeadingStatus
#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]

/// Status constants
///  GOOD               The heading is reliable and not affected by iron interferences.
///  OK                 The heading is reliable, but affected by slight iron interferences.
///  NOT_GOOD           The heading is not reliable because affected by strong iron interferences.
///  NOT_CALIBRATED     The magnetometer has not been calibrated.
///  MAG_NOT_AVAILABLE  The magnetometer sensor is not available.

#[repr(C)]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct MagHeadingStatus {
    /// Status
    pub status: u8,

}

impl MagHeadingStatus {

    // This constant is not documented.
    #[allow(missing_docs)]
    pub const GOOD: u8 = 0;


    // This constant is not documented.
    #[allow(missing_docs)]
    pub const OK: u8 = 1;


    // This constant is not documented.
    #[allow(missing_docs)]
    pub const NOT_GOOD: u8 = 2;


    // This constant is not documented.
    #[allow(missing_docs)]
    pub const NOT_CALIBRATED: u8 = 3;


    // This constant is not documented.
    #[allow(missing_docs)]
    pub const MAG_NOT_AVAILABLE: u8 = 4;

}


impl Default for MagHeadingStatus {
  fn default() -> Self {
    unsafe {
      let mut msg = std::mem::zeroed();
      if !zed_interfaces__msg__MagHeadingStatus__init(&mut msg as *mut _) {
        panic!("Call to zed_interfaces__msg__MagHeadingStatus__init() failed");
      }
      msg
    }
  }
}

impl rosidl_runtime_rs::SequenceAlloc for MagHeadingStatus {
  fn sequence_init(seq: &mut rosidl_runtime_rs::Sequence<Self>, size: usize) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__MagHeadingStatus__Sequence__init(seq as *mut _, size) }
  }
  fn sequence_fini(seq: &mut rosidl_runtime_rs::Sequence<Self>) {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__MagHeadingStatus__Sequence__fini(seq as *mut _) }
  }
  fn sequence_copy(in_seq: &rosidl_runtime_rs::Sequence<Self>, out_seq: &mut rosidl_runtime_rs::Sequence<Self>) -> bool {
    // SAFETY: This is safe since the pointer is guaranteed to be valid/initialized.
    unsafe { zed_interfaces__msg__MagHeadingStatus__Sequence__copy(in_seq, out_seq as *mut _) }
  }
}

impl rosidl_runtime_rs::Message for MagHeadingStatus {
  type RmwMsg = Self;
  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> { msg_cow }
  fn from_rmw_message(msg: Self::RmwMsg) -> Self { msg }
}

impl rosidl_runtime_rs::RmwMessage for MagHeadingStatus where Self: Sized {
  const TYPE_NAME: &'static str = "zed_interfaces/msg/MagHeadingStatus";
  fn get_type_support() -> *const std::ffi::c_void {
    // SAFETY: No preconditions for this function.
    unsafe { rosidl_typesupport_c__get_message_type_support_handle__zed_interfaces__msg__MagHeadingStatus() }
  }
}


