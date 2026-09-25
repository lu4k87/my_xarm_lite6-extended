// ── Topic- und Service-Namen der Robot Control UI ──────────────────────────
// Einzige Stelle mit ROS-Namen im Frontend. Wer ein Topic umbenennt, aendert
// es hier - die Module verwenden nur die Schluessel.
// Schluessel = Pfad ohne fuehrendes /ui, in camelCase
// ('/ui/gripper_cmd' -> gripperCmd, '/servo_server/status' -> servoServerStatus).

export const TOPICS = Object.freeze({
  dashboardWorkspaceMetadata: '/dashboard/workspace_metadata',
  jointStates: '/joint_states',
  joy: '/joy',
  linearAxisCmd: '/linear_axis_cmd',
  servoServerDeltaJointCmds: '/servo_server/delta_joint_cmds',
  servoServerDeltaTwistCmds: '/servo_server/delta_twist_cmds',
  servoServerStatus: '/servo_server/status',
  tf: '/tf',
  collisionMsg: '/ui/collision_msg',
  disabledCollisionObjects: '/ui/disabled_collision_objects',
  eefPosition: '/ui/eef_position',
  emergencyStopActive: '/ui/emergency_stop_active',
  emergencyStopTopic: '/ui/emergency_stop_topic',
  graspObjectCmd: '/ui/grasp_object_cmd',
  graspStatus: '/ui/grasp_status',
  gripperCmd: '/ui/gripper_cmd',
  gripperState: '/ui/gripper_state',
  gripperType: '/ui/gripper_type',
  groundCollisionLevel: '/ui/ground_collision_level',
  joyButtonPresses: '/ui/joy_button_presses',
  motionStatus: '/ui/motion_status',
  moveitCollisionGroundEnabled: '/ui/moveit_collision_ground_enabled',
  moveitCollisionObjectsEnabled: '/ui/moveit_collision_objects_enabled',
  moveitMotionState: '/ui/moveit_motion_state',
  movetoPreviewEnabled: '/ui/moveto_preview_enabled',
  movetoPreviewPath: '/ui/moveto_preview_path',
  robotControlCurrentSpeed: '/ui/robot_control/current_speed',
  robotControlSetSpeedIndex: '/ui/robot_control/set_speed_index',
  safetyZoneParams: '/ui/safety_zone_params',
  scanSpeed: '/ui/scan_speed',
  setGroundCollisionLevel: '/ui/set_ground_collision_level',
  setObjectCollision: '/ui/set_object_collision',
  soundEnabled: '/ui/sound_enabled',
  voiceFeedback: '/ui/voice_feedback',
  voiceListenTrigger: '/ui/voice_listen_trigger',
  voiceStatus: '/ui/voice_status',
  // SERVO/PLAN der Brille (JSON {mode, from}) - Ansage auch am Desktop
  vrCtrlMode: '/ui/vr_ctrl_mode',
  visualizationMarkerArray: '/visualization_marker_array',
  // VR-Spiegel: Quest -> PC-Fenster (vr_mirror.html), PC -> Quest (Nachsenden)
  vrTeleopMirrorPose: '/vr_teleop/mirror_pose',
  vrTeleopMirrorState: '/vr_teleop/mirror_state',
  vrTeleopMirrorUi: '/vr_teleop/mirror_ui',
  vrTeleopMirrorRequest: '/vr_teleop/mirror_request',
  zedBboxes3d: '/zed/bboxes_3d',
  zedPointcloudWeb: '/zed/pointcloud_web',
  zedYoloCollisionMarkers: '/zed/yolo_collision_markers',
  zedVisualMarkers: '/zed_visual_markers',
});

export const SERVICES = Object.freeze({
  rosapiGetParam: '/rosapi/get_param',
  rosapiNodes: '/rosapi/nodes',
  rosapiTopicsForType: '/rosapi/topics_for_type',
  confirmMovetoPreview: '/ui/confirm_moveto_preview',
  executeInitialPose: '/ui/execute_initial_pose',
  executeMoveToPose: '/ui/execute_move_to_pose',
  executeMoveToPoseSilent: '/ui/execute_move_to_pose_silent',
  approachFromAbove: '/ui/approach_from_above',
  resetEmergencyStop: '/ui/reset_emergency_stop',
  setMoveitCollisionGround: '/ui/set_moveit_collision_ground',
  setMoveitCollisionObjects: '/ui/set_moveit_collision_objects',
  setMovetoPreview: '/ui/set_moveto_preview',
  startObjectScan: '/ui/start_object_scan',
});

// Namespace der ZED-Kamera (Bildtopics fuer den Web Video Server).
export const ZED_NS = '/zed/zed_node';

