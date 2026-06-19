#[cfg(feature = "serde")]
use serde::{Deserialize, Serialize};



// Corresponds to zed_interfaces__msg__Object
/// Object label

#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Object {

    // This member is not documented.
    #[allow(missing_docs)]
    pub label: std::string::String,

    /// Object label ID
    pub label_id: i16,

    /// Object sub
    pub sublabel: std::string::String,

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
    pub bounding_box_2d: super::msg::BoundingBox2Di,

    /// 3D Bounding box in world frame
    pub bounding_box_3d: super::msg::BoundingBox3D,

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
    pub head_bounding_box_2d: super::msg::BoundingBox2Df,

    /// 3D Bounding box in world frame of the person head
    pub head_bounding_box_3d: super::msg::BoundingBox3D,

    /// 3D position of the centroid of the person head
    pub head_position: [f32; 3],

    /// 2D Person skeleton projected to Camera image
    pub skeleton_2d: super::msg::Skeleton2D,

    /// 3D Person skeleton in world frame
    pub skeleton_3d: super::msg::Skeleton3D,

}



impl Default for Object {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::msg::rmw::Object::default())
  }
}

impl rosidl_runtime_rs::Message for Object {
  type RmwMsg = super::msg::rmw::Object;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        label: msg.label.as_str().into(),
        label_id: msg.label_id,
        sublabel: msg.sublabel.as_str().into(),
        confidence: msg.confidence,
        position: msg.position,
        position_covariance: msg.position_covariance,
        velocity: msg.velocity,
        tracking_available: msg.tracking_available,
        tracking_state: msg.tracking_state,
        action_state: msg.action_state,
        bounding_box_2d: super::msg::BoundingBox2Di::into_rmw_message(std::borrow::Cow::Owned(msg.bounding_box_2d)).into_owned(),
        bounding_box_3d: super::msg::BoundingBox3D::into_rmw_message(std::borrow::Cow::Owned(msg.bounding_box_3d)).into_owned(),
        dimensions_3d: msg.dimensions_3d,
        skeleton_available: msg.skeleton_available,
        body_format: msg.body_format,
        head_bounding_box_2d: super::msg::BoundingBox2Df::into_rmw_message(std::borrow::Cow::Owned(msg.head_bounding_box_2d)).into_owned(),
        head_bounding_box_3d: super::msg::BoundingBox3D::into_rmw_message(std::borrow::Cow::Owned(msg.head_bounding_box_3d)).into_owned(),
        head_position: msg.head_position,
        skeleton_2d: super::msg::Skeleton2D::into_rmw_message(std::borrow::Cow::Owned(msg.skeleton_2d)).into_owned(),
        skeleton_3d: super::msg::Skeleton3D::into_rmw_message(std::borrow::Cow::Owned(msg.skeleton_3d)).into_owned(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        label: msg.label.as_str().into(),
      label_id: msg.label_id,
        sublabel: msg.sublabel.as_str().into(),
      confidence: msg.confidence,
        position: msg.position,
        position_covariance: msg.position_covariance,
        velocity: msg.velocity,
      tracking_available: msg.tracking_available,
      tracking_state: msg.tracking_state,
      action_state: msg.action_state,
        bounding_box_2d: super::msg::BoundingBox2Di::into_rmw_message(std::borrow::Cow::Borrowed(&msg.bounding_box_2d)).into_owned(),
        bounding_box_3d: super::msg::BoundingBox3D::into_rmw_message(std::borrow::Cow::Borrowed(&msg.bounding_box_3d)).into_owned(),
        dimensions_3d: msg.dimensions_3d,
      skeleton_available: msg.skeleton_available,
      body_format: msg.body_format,
        head_bounding_box_2d: super::msg::BoundingBox2Df::into_rmw_message(std::borrow::Cow::Borrowed(&msg.head_bounding_box_2d)).into_owned(),
        head_bounding_box_3d: super::msg::BoundingBox3D::into_rmw_message(std::borrow::Cow::Borrowed(&msg.head_bounding_box_3d)).into_owned(),
        head_position: msg.head_position,
        skeleton_2d: super::msg::Skeleton2D::into_rmw_message(std::borrow::Cow::Borrowed(&msg.skeleton_2d)).into_owned(),
        skeleton_3d: super::msg::Skeleton3D::into_rmw_message(std::borrow::Cow::Borrowed(&msg.skeleton_3d)).into_owned(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      label: msg.label.to_string(),
      label_id: msg.label_id,
      sublabel: msg.sublabel.to_string(),
      confidence: msg.confidence,
      position: msg.position,
      position_covariance: msg.position_covariance,
      velocity: msg.velocity,
      tracking_available: msg.tracking_available,
      tracking_state: msg.tracking_state,
      action_state: msg.action_state,
      bounding_box_2d: super::msg::BoundingBox2Di::from_rmw_message(msg.bounding_box_2d),
      bounding_box_3d: super::msg::BoundingBox3D::from_rmw_message(msg.bounding_box_3d),
      dimensions_3d: msg.dimensions_3d,
      skeleton_available: msg.skeleton_available,
      body_format: msg.body_format,
      head_bounding_box_2d: super::msg::BoundingBox2Df::from_rmw_message(msg.head_bounding_box_2d),
      head_bounding_box_3d: super::msg::BoundingBox3D::from_rmw_message(msg.head_bounding_box_3d),
      head_position: msg.head_position,
      skeleton_2d: super::msg::Skeleton2D::from_rmw_message(msg.skeleton_2d),
      skeleton_3d: super::msg::Skeleton3D::from_rmw_message(msg.skeleton_3d),
    }
  }
}


// Corresponds to zed_interfaces__msg__ObjectsStamped
/// Standard Header

#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct ObjectsStamped {

    // This member is not documented.
    #[allow(missing_docs)]
    pub header: std_msgs::msg::Header,

    /// Array of `object_stamped` topics
    pub objects: Vec<super::msg::Object>,

}



impl Default for ObjectsStamped {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::msg::rmw::ObjectsStamped::default())
  }
}

impl rosidl_runtime_rs::Message for ObjectsStamped {
  type RmwMsg = super::msg::rmw::ObjectsStamped;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        header: std_msgs::msg::Header::into_rmw_message(std::borrow::Cow::Owned(msg.header)).into_owned(),
        objects: msg.objects
          .into_iter()
          .map(|elem| super::msg::Object::into_rmw_message(std::borrow::Cow::Owned(elem)).into_owned())
          .collect(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        header: std_msgs::msg::Header::into_rmw_message(std::borrow::Cow::Borrowed(&msg.header)).into_owned(),
        objects: msg.objects
          .iter()
          .map(|elem| super::msg::Object::into_rmw_message(std::borrow::Cow::Borrowed(elem)).into_owned())
          .collect(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      header: std_msgs::msg::Header::from_rmw_message(msg.header),
      objects: msg.objects
          .into_iter()
          .map(super::msg::Object::from_rmw_message)
          .collect(),
    }
  }
}


// Corresponds to zed_interfaces__msg__Keypoint2Di

// This struct is not documented.
#[allow(missing_docs)]

#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Keypoint2Di {

    // This member is not documented.
    #[allow(missing_docs)]
    pub kp: [u32; 2],

}



impl Default for Keypoint2Di {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::msg::rmw::Keypoint2Di::default())
  }
}

impl rosidl_runtime_rs::Message for Keypoint2Di {
  type RmwMsg = super::msg::rmw::Keypoint2Di;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        kp: msg.kp,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        kp: msg.kp,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      kp: msg.kp,
    }
  }
}


// Corresponds to zed_interfaces__msg__Keypoint2Df

// This struct is not documented.
#[allow(missing_docs)]

#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Keypoint2Df {

    // This member is not documented.
    #[allow(missing_docs)]
    pub kp: [f32; 2],

}



impl Default for Keypoint2Df {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::msg::rmw::Keypoint2Df::default())
  }
}

impl rosidl_runtime_rs::Message for Keypoint2Df {
  type RmwMsg = super::msg::rmw::Keypoint2Df;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        kp: msg.kp,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        kp: msg.kp,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      kp: msg.kp,
    }
  }
}


// Corresponds to zed_interfaces__msg__Keypoint3D

// This struct is not documented.
#[allow(missing_docs)]

#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Keypoint3D {

    // This member is not documented.
    #[allow(missing_docs)]
    pub kp: [f32; 3],

}



impl Default for Keypoint3D {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::msg::rmw::Keypoint3D::default())
  }
}

impl rosidl_runtime_rs::Message for Keypoint3D {
  type RmwMsg = super::msg::rmw::Keypoint3D;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        kp: msg.kp,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        kp: msg.kp,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      kp: msg.kp,
    }
  }
}


// Corresponds to zed_interfaces__msg__BoundingBox2Di
/// 0 ------- 1
/// |         |
/// |         |
/// |         |
/// 3 ------- 2

#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct BoundingBox2Di {

    // This member is not documented.
    #[allow(missing_docs)]
    pub corners: [super::msg::Keypoint2Di; 4],

}



impl Default for BoundingBox2Di {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::msg::rmw::BoundingBox2Di::default())
  }
}

impl rosidl_runtime_rs::Message for BoundingBox2Di {
  type RmwMsg = super::msg::rmw::BoundingBox2Di;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        corners: msg.corners
          .map(|elem| super::msg::Keypoint2Di::into_rmw_message(std::borrow::Cow::Owned(elem)).into_owned()),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        corners: msg.corners
          .iter()
          .map(|elem| super::msg::Keypoint2Di::into_rmw_message(std::borrow::Cow::Borrowed(elem)).into_owned())
          .collect::<Vec<_>>()
          .try_into()
          .unwrap(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      corners: msg.corners
        .map(super::msg::Keypoint2Di::from_rmw_message),
    }
  }
}


// Corresponds to zed_interfaces__msg__BoundingBox2Df
/// 0 ------- 1
/// |         |
/// |         |
/// |         |
/// 3 ------- 2

#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct BoundingBox2Df {

    // This member is not documented.
    #[allow(missing_docs)]
    pub corners: [super::msg::Keypoint2Df; 4],

}



impl Default for BoundingBox2Df {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::msg::rmw::BoundingBox2Df::default())
  }
}

impl rosidl_runtime_rs::Message for BoundingBox2Df {
  type RmwMsg = super::msg::rmw::BoundingBox2Df;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        corners: msg.corners
          .map(|elem| super::msg::Keypoint2Df::into_rmw_message(std::borrow::Cow::Owned(elem)).into_owned()),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        corners: msg.corners
          .iter()
          .map(|elem| super::msg::Keypoint2Df::into_rmw_message(std::borrow::Cow::Borrowed(elem)).into_owned())
          .collect::<Vec<_>>()
          .try_into()
          .unwrap(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      corners: msg.corners
        .map(super::msg::Keypoint2Df::from_rmw_message),
    }
  }
}


// Corresponds to zed_interfaces__msg__BoundingBox3D
///   1 ------- 2
///  /.        /|
/// 0 ------- 3 |
/// | .       | |
/// | 5.......| 6
/// |.        |/
/// 4 ------- 7

#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct BoundingBox3D {

    // This member is not documented.
    #[allow(missing_docs)]
    pub corners: [super::msg::Keypoint3D; 8],

}



impl Default for BoundingBox3D {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::msg::rmw::BoundingBox3D::default())
  }
}

impl rosidl_runtime_rs::Message for BoundingBox3D {
  type RmwMsg = super::msg::rmw::BoundingBox3D;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        corners: msg.corners
          .map(|elem| super::msg::Keypoint3D::into_rmw_message(std::borrow::Cow::Owned(elem)).into_owned()),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        corners: msg.corners
          .iter()
          .map(|elem| super::msg::Keypoint3D::into_rmw_message(std::borrow::Cow::Borrowed(elem)).into_owned())
          .collect::<Vec<_>>()
          .try_into()
          .unwrap(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      corners: msg.corners
        .map(super::msg::Keypoint3D::from_rmw_message),
    }
  }
}


// Corresponds to zed_interfaces__msg__Skeleton2D
/// Skeleton joints

#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Skeleton2D {

    // This member is not documented.
    #[allow(missing_docs)]
    #[cfg_attr(feature = "serde", serde(with = "serde_big_array::BigArray"))]
    pub keypoints: [super::msg::Keypoint2Df; 70],

}



impl Default for Skeleton2D {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::msg::rmw::Skeleton2D::default())
  }
}

impl rosidl_runtime_rs::Message for Skeleton2D {
  type RmwMsg = super::msg::rmw::Skeleton2D;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        keypoints: msg.keypoints
          .map(|elem| super::msg::Keypoint2Df::into_rmw_message(std::borrow::Cow::Owned(elem)).into_owned()),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        keypoints: msg.keypoints
          .iter()
          .map(|elem| super::msg::Keypoint2Df::into_rmw_message(std::borrow::Cow::Borrowed(elem)).into_owned())
          .collect::<Vec<_>>()
          .try_into()
          .unwrap(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      keypoints: msg.keypoints
        .map(super::msg::Keypoint2Df::from_rmw_message),
    }
  }
}


// Corresponds to zed_interfaces__msg__Skeleton3D
/// Skeleton joints

#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Skeleton3D {

    // This member is not documented.
    #[allow(missing_docs)]
    #[cfg_attr(feature = "serde", serde(with = "serde_big_array::BigArray"))]
    pub keypoints: [super::msg::Keypoint3D; 70],

}



impl Default for Skeleton3D {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::msg::rmw::Skeleton3D::default())
  }
}

impl rosidl_runtime_rs::Message for Skeleton3D {
  type RmwMsg = super::msg::rmw::Skeleton3D;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        keypoints: msg.keypoints
          .map(|elem| super::msg::Keypoint3D::into_rmw_message(std::borrow::Cow::Owned(elem)).into_owned()),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        keypoints: msg.keypoints
          .iter()
          .map(|elem| super::msg::Keypoint3D::into_rmw_message(std::borrow::Cow::Borrowed(elem)).into_owned())
          .collect::<Vec<_>>()
          .try_into()
          .unwrap(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      keypoints: msg.keypoints
        .map(super::msg::Keypoint3D::from_rmw_message),
    }
  }
}


// Corresponds to zed_interfaces__msg__DepthInfoStamped
/// Standard Header

#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct DepthInfoStamped {

    // This member is not documented.
    #[allow(missing_docs)]
    pub header: std_msgs::msg::Header,

    /// Miminum measured depth
    pub min_depth: f32,

    /// Maximum measured depth
    pub max_depth: f32,

}



impl Default for DepthInfoStamped {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::msg::rmw::DepthInfoStamped::default())
  }
}

impl rosidl_runtime_rs::Message for DepthInfoStamped {
  type RmwMsg = super::msg::rmw::DepthInfoStamped;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        header: std_msgs::msg::Header::into_rmw_message(std::borrow::Cow::Owned(msg.header)).into_owned(),
        min_depth: msg.min_depth,
        max_depth: msg.max_depth,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        header: std_msgs::msg::Header::into_rmw_message(std::borrow::Cow::Borrowed(&msg.header)).into_owned(),
      min_depth: msg.min_depth,
      max_depth: msg.max_depth,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      header: std_msgs::msg::Header::from_rmw_message(msg.header),
      min_depth: msg.min_depth,
      max_depth: msg.max_depth,
    }
  }
}


// Corresponds to zed_interfaces__msg__PlaneStamped
/// Standard Header

#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct PlaneStamped {

    // This member is not documented.
    #[allow(missing_docs)]
    pub header: std_msgs::msg::Header,

    /// Mesh of the place
    pub mesh: shape_msgs::msg::Mesh,

    /// Representation of a plane, using the plane equation ax + by + cz + d = 0
    pub coefficients: shape_msgs::msg::Plane,

    /// Normal vector
    pub normal: geometry_msgs::msg::Point32,

    /// Center point
    pub center: geometry_msgs::msg::Point32,

    /// Plane pose relative to the global reference frame
    pub pose: geometry_msgs::msg::Transform,

    /// Width and height of the bounding rectangle around the plane contours
    pub extents: [f32; 2],

    /// The polygon bounds of the plane
    pub bounds: geometry_msgs::msg::Polygon,

}



impl Default for PlaneStamped {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::msg::rmw::PlaneStamped::default())
  }
}

impl rosidl_runtime_rs::Message for PlaneStamped {
  type RmwMsg = super::msg::rmw::PlaneStamped;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        header: std_msgs::msg::Header::into_rmw_message(std::borrow::Cow::Owned(msg.header)).into_owned(),
        mesh: shape_msgs::msg::Mesh::into_rmw_message(std::borrow::Cow::Owned(msg.mesh)).into_owned(),
        coefficients: shape_msgs::msg::Plane::into_rmw_message(std::borrow::Cow::Owned(msg.coefficients)).into_owned(),
        normal: geometry_msgs::msg::Point32::into_rmw_message(std::borrow::Cow::Owned(msg.normal)).into_owned(),
        center: geometry_msgs::msg::Point32::into_rmw_message(std::borrow::Cow::Owned(msg.center)).into_owned(),
        pose: geometry_msgs::msg::Transform::into_rmw_message(std::borrow::Cow::Owned(msg.pose)).into_owned(),
        extents: msg.extents,
        bounds: geometry_msgs::msg::Polygon::into_rmw_message(std::borrow::Cow::Owned(msg.bounds)).into_owned(),
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        header: std_msgs::msg::Header::into_rmw_message(std::borrow::Cow::Borrowed(&msg.header)).into_owned(),
        mesh: shape_msgs::msg::Mesh::into_rmw_message(std::borrow::Cow::Borrowed(&msg.mesh)).into_owned(),
        coefficients: shape_msgs::msg::Plane::into_rmw_message(std::borrow::Cow::Borrowed(&msg.coefficients)).into_owned(),
        normal: geometry_msgs::msg::Point32::into_rmw_message(std::borrow::Cow::Borrowed(&msg.normal)).into_owned(),
        center: geometry_msgs::msg::Point32::into_rmw_message(std::borrow::Cow::Borrowed(&msg.center)).into_owned(),
        pose: geometry_msgs::msg::Transform::into_rmw_message(std::borrow::Cow::Borrowed(&msg.pose)).into_owned(),
        extents: msg.extents,
        bounds: geometry_msgs::msg::Polygon::into_rmw_message(std::borrow::Cow::Borrowed(&msg.bounds)).into_owned(),
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      header: std_msgs::msg::Header::from_rmw_message(msg.header),
      mesh: shape_msgs::msg::Mesh::from_rmw_message(msg.mesh),
      coefficients: shape_msgs::msg::Plane::from_rmw_message(msg.coefficients),
      normal: geometry_msgs::msg::Point32::from_rmw_message(msg.normal),
      center: geometry_msgs::msg::Point32::from_rmw_message(msg.center),
      pose: geometry_msgs::msg::Transform::from_rmw_message(msg.pose),
      extents: msg.extents,
      bounds: geometry_msgs::msg::Polygon::from_rmw_message(msg.bounds),
    }
  }
}


// Corresponds to zed_interfaces__msg__PosTrackStatus
/// CONSTANTS

#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
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
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::msg::rmw::PosTrackStatus::default())
  }
}

impl rosidl_runtime_rs::Message for PosTrackStatus {
  type RmwMsg = super::msg::rmw::PosTrackStatus;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        odometry_status: msg.odometry_status,
        spatial_memory_status: msg.spatial_memory_status,
        status: msg.status,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      odometry_status: msg.odometry_status,
      spatial_memory_status: msg.spatial_memory_status,
      status: msg.status,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      odometry_status: msg.odometry_status,
      spatial_memory_status: msg.spatial_memory_status,
      status: msg.status,
    }
  }
}


// Corresponds to zed_interfaces__msg__GnssFusionStatus
/// GNSS_FUSION_STATUS
/// Represents the current state of GNSS fusion for global localization.
/// OK - The GNSS fusion module is calibrated and working successfully.
/// OFF - The GNSS fusion module is not enabled.
/// CALIBRATION_IN_PROGRESS - Calibration of the GNSS/VIO fusion module is in progress.
/// RECALIBRATION_IN_PROGRESS- Re-alignment of GNSS/VIO data is in progress, leading to potentially inaccurate global position.

#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
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
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::msg::rmw::GnssFusionStatus::default())
  }
}

impl rosidl_runtime_rs::Message for GnssFusionStatus {
  type RmwMsg = super::msg::rmw::GnssFusionStatus;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        gnss_fusion_status: msg.gnss_fusion_status,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      gnss_fusion_status: msg.gnss_fusion_status,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      gnss_fusion_status: msg.gnss_fusion_status,
    }
  }
}


// Corresponds to zed_interfaces__msg__Heartbeat
/// Message to notify that the node is alive to other nodes

#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
#[derive(Clone, Debug, PartialEq, PartialOrd)]
pub struct Heartbeat {
    /// idx of the message
    pub beat_count: u64,

    /// namespace of the node
    pub node_ns: std::string::String,

    /// name of the node
    pub node_name: std::string::String,

    /// full node name
    pub full_name: std::string::String,

    /// serial number of the input camera
    pub camera_sn: u32,

    /// data from an svo?
    pub svo_mode: bool,

    /// data from simulation?
    pub simul_mode: bool,

}



impl Default for Heartbeat {
  fn default() -> Self {
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::msg::rmw::Heartbeat::default())
  }
}

impl rosidl_runtime_rs::Message for Heartbeat {
  type RmwMsg = super::msg::rmw::Heartbeat;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        beat_count: msg.beat_count,
        node_ns: msg.node_ns.as_str().into(),
        node_name: msg.node_name.as_str().into(),
        full_name: msg.full_name.as_str().into(),
        camera_sn: msg.camera_sn,
        svo_mode: msg.svo_mode,
        simul_mode: msg.simul_mode,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      beat_count: msg.beat_count,
        node_ns: msg.node_ns.as_str().into(),
        node_name: msg.node_name.as_str().into(),
        full_name: msg.full_name.as_str().into(),
      camera_sn: msg.camera_sn,
      svo_mode: msg.svo_mode,
      simul_mode: msg.simul_mode,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      beat_count: msg.beat_count,
      node_ns: msg.node_ns.to_string(),
      node_name: msg.node_name.to_string(),
      full_name: msg.full_name.to_string(),
      camera_sn: msg.camera_sn,
      svo_mode: msg.svo_mode,
      simul_mode: msg.simul_mode,
    }
  }
}


// Corresponds to zed_interfaces__msg__MagHeadingStatus
/// Status constants
///  GOOD               The heading is reliable and not affected by iron interferences.
///  OK                 The heading is reliable, but affected by slight iron interferences.
///  NOT_GOOD           The heading is not reliable because affected by strong iron interferences.
///  NOT_CALIBRATED     The magnetometer has not been calibrated.
///  MAG_NOT_AVAILABLE  The magnetometer sensor is not available.

#[cfg_attr(feature = "serde", derive(Deserialize, Serialize))]
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
    <Self as rosidl_runtime_rs::Message>::from_rmw_message(super::msg::rmw::MagHeadingStatus::default())
  }
}

impl rosidl_runtime_rs::Message for MagHeadingStatus {
  type RmwMsg = super::msg::rmw::MagHeadingStatus;

  fn into_rmw_message(msg_cow: std::borrow::Cow<'_, Self>) -> std::borrow::Cow<'_, Self::RmwMsg> {
    match msg_cow {
      std::borrow::Cow::Owned(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
        status: msg.status,
      }),
      std::borrow::Cow::Borrowed(msg) => std::borrow::Cow::Owned(Self::RmwMsg {
      status: msg.status,
      })
    }
  }

  fn from_rmw_message(msg: Self::RmwMsg) -> Self {
    Self {
      status: msg.status,
    }
  }
}


