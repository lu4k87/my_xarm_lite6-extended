#include "rviz_robot_control_panel/rviz_robot_control_panel.hpp"
#include <pluginlib/class_list_macros.hpp>
#include <rviz_common/display_context.hpp>
#include <cstdlib>

namespace rviz_robot_control_panel
{

ControlPanel::ControlPanel(QWidget* parent)
  : rviz_common::Panel(parent)
{
  setupUI();
  
  publish_timer_ = new QTimer(this);
  connect(publish_timer_, &QTimer::timeout, this, &ControlPanel::publishTwist);
  connect(this, &ControlPanel::sendLogMessage, this, &ControlPanel::onLogMessage, Qt::QueuedConnection);
}

ControlPanel::~ControlPanel()
{
}

void ControlPanel::onInitialize()
{
  node_ = getDisplayContext()->getRosNodeAbstraction().lock()->get_raw_node();
  // Using the same topic as the gaze control
  twist_pub_ = node_->create_publisher<geometry_msgs::msg::TwistStamped>("/servo_server/delta_twist_cmds", 10);
  frame_pub_ = node_->create_publisher<std_msgs::msg::String>("/ui/robot_control/current_frame", 10);
  grasp_object_pub_ = node_->create_publisher<std_msgs::msg::String>("/ui/grasp_object_cmd", 10);
  initial_pose_client_ = node_->create_client<std_srvs::srv::Trigger>("/ui/execute_initial_pose");
  scan_client_ = node_->create_client<std_srvs::srv::Trigger>("/ui/execute_scan_trajectory");
  
  set_speed_index_pub_ = node_->create_publisher<std_msgs::msg::Int32>("/ui/robot_control/set_speed_index", 10);
  speed_sub_ = node_->create_subscription<std_msgs::msg::Float32>(
    "/ui/robot_control/current_speed", rclcpp::QoS(1).transient_local(),
    [this](const std_msgs::msg::Float32::SharedPtr msg) {
        int idx = 2; // Default 0.5
        if (msg->data == 0.125f) idx = 0;
        else if (msg->data == 0.25f) idx = 1;
        else if (msg->data == 0.5f) idx = 2;
        else if (msg->data == 0.75f) idx = 3;
        else if (msg->data == 1.0f) idx = 4;
        
        QMetaObject::invokeMethod(this, [this, idx, val=msg->data]() {
            this->current_speed_scale_ = val;
            speed_slider_->blockSignals(true);
            speed_slider_->setValue(idx);
            speed_slider_->blockSignals(false);
            
            QString text = QString("Speed: %1").arg(val, 0, 'f', 3);
            speed_label_->setText(text);
        });
    }
  );
  
  status_sub_ = node_->create_subscription<std_msgs::msg::String>(
    "/ui/grasp_status", 10,
    [this](const std_msgs::msg::String::SharedPtr msg) {
        this->logToConsole(QString::fromStdString(msg->data));
    }
  );
  
  joint_state_sub_ = node_->create_subscription<sensor_msgs::msg::JointState>(
    "/joint_states", 10,
    [this](const sensor_msgs::msg::JointState::SharedPtr msg) {
        if (!this->initial_joint_state_received_ && msg->name.size() >= 6) {
            // Find our joints (joint1 to joint6)
            for (size_t i = 0; i < msg->name.size(); ++i) {
                if (msg->name[i].find("joint") == 0 && msg->name[i].length() == 6) {
                    int joint_idx = msg->name[i].back() - '1';
                    if (joint_idx >= 0 && joint_idx < 6) {
                        double pos_deg = msg->position[i] * 180.0 / M_PI;
                        QMetaObject::invokeMethod(this, [this, joint_idx, pos_deg]() {
                            this->slider_joints_[joint_idx]->blockSignals(true);
                            this->slider_joints_[joint_idx]->setValue(static_cast<int>(pos_deg));
                            this->lbl_joints_val_[joint_idx]->setText(QString("%1°").arg(static_cast<int>(pos_deg), 4));
                            this->slider_joints_[joint_idx]->blockSignals(false);
                        });
                    }
                }
            }
            this->initial_joint_state_received_ = true;
        }
    }
  );
}

void ControlPanel::setupUI()
{
  // Global Dark Theme
  this->setStyleSheet(
    "QGroupBox { font-weight: bold; border: 1px solid #7f8c8d; border-radius: 4px; margin-top: 2ex; color: #ecf0f1; }"
    "QGroupBox::title { subcontrol-origin: margin; subcontrol-position: top left; padding: 0 3px; }"
    "QPushButton { background-color: #7f8c8d; color: white; border-radius: 6px; padding: 8px; border: 1px solid #95a5a6; font-weight: bold; }"
    "QPushButton:hover { background-color: #95a5a6; }"
    "QPushButton:pressed { background-color: #636e72; }"
    "QDoubleSpinBox { background-color: #95a5a6; color: #2c3e50; border: 1px solid #7f8c8d; border-radius: 4px; padding: 4px; font-weight: bold; }"
    "QLabel { color: #ecf0f1; font-weight: bold; }"
  );

  QVBoxLayout* main_layout = new QVBoxLayout(this);
  
  // ==========================================
  // SECTION 1: Cartesian Jogging
  // ==========================================
  QGroupBox* group_jog = new QGroupBox("Cartesian Jogging");
  group_jog->setStyleSheet("QGroupBox { background-color: #34495e; }"); // Dark Blue-Gray
  QVBoxLayout* jog_layout = new QVBoxLayout(group_jog);
  
  QGridLayout* top_grid_layout = new QGridLayout();
  btn_rot_x_plus_ = new QPushButton("Roll +\n(Rot X)");
  btn_rot_x_minus_ = new QPushButton("Roll -\n(Rot X)");
  btn_rot_y_plus_ = new QPushButton("Pitch +\n(Rot Y)");
  btn_rot_y_minus_ = new QPushButton("Pitch -\n(Rot Y)");
  btn_rot_z_plus_ = new QPushButton("Yaw +\n(Rot Z)");
  btn_rot_z_minus_ = new QPushButton("Yaw -\n(Rot Z)");
  top_grid_layout->addWidget(btn_rot_x_plus_, 0, 0);
  top_grid_layout->addWidget(btn_rot_x_minus_, 1, 0);
  top_grid_layout->addWidget(btn_rot_y_plus_, 0, 1);
  top_grid_layout->addWidget(btn_rot_y_minus_, 1, 1);
  top_grid_layout->addWidget(btn_rot_z_plus_, 0, 2);
  top_grid_layout->addWidget(btn_rot_z_minus_, 1, 2);
  jog_layout->addLayout(top_grid_layout);

  QGridLayout* dpad_layout = new QGridLayout();
  btn_x_plus_ = new QPushButton("↑ Forward\n(X+)");
  btn_x_minus_ = new QPushButton("↓ Backward\n(X-)");
  btn_y_plus_ = new QPushButton("← Left\n(Y+)");
  btn_y_minus_ = new QPushButton("→ Right\n(Y-)");
  btn_z_plus_ = new QPushButton("⇈ Up\n(Z+)");
  btn_z_minus_ = new QPushButton("⇊ Down\n(Z-)");
  dpad_layout->addWidget(btn_z_plus_, 0, 0);
  dpad_layout->addWidget(btn_x_plus_, 0, 1);
  dpad_layout->addWidget(btn_y_plus_, 1, 0);
  dpad_layout->addWidget(btn_y_minus_, 1, 2);
  dpad_layout->addWidget(btn_z_minus_, 2, 0);
  dpad_layout->addWidget(btn_x_minus_, 2, 1);
  jog_layout->addLayout(dpad_layout);

  QHBoxLayout* speed_layout = new QHBoxLayout();
  speed_label_ = new QLabel("Speed: 0.50");
  speed_slider_ = new QSlider(Qt::Horizontal);
  speed_slider_->setRange(0, 4);
  speed_slider_->setTickPosition(QSlider::TicksBelow);
  speed_slider_->setTickInterval(1);
  speed_slider_->setValue(2);
  speed_layout->addWidget(speed_label_);
  speed_layout->addWidget(speed_slider_);
  jog_layout->addLayout(speed_layout);
  
  main_layout->addWidget(group_jog);

  // ==========================================
  // SECTION 2: Cartesian Absolute Move
  // ==========================================
  QGroupBox* group_cartesian = new QGroupBox("Cartesian Absolute Move");
  group_cartesian->setStyleSheet("QGroupBox { background-color: #2c3e50; }"); // Darker Blue-Gray
  QGridLayout* move_layout = new QGridLayout(group_cartesian);
  
  QLabel* lbl_x = new QLabel("X:");
  spin_x_ = new QDoubleSpinBox(); spin_x_->setRange(-2000.0, 2000.0); spin_x_->setValue(300.0);
  QLabel* lbl_y = new QLabel("Y:");
  spin_y_ = new QDoubleSpinBox(); spin_y_->setRange(-2000.0, 2000.0); spin_y_->setValue(0.0);
  QLabel* lbl_z = new QLabel("Z:");
  spin_z_ = new QDoubleSpinBox(); spin_z_->setRange(-2000.0, 2000.0); spin_z_->setValue(200.0);
  
  QLabel* lbl_roll = new QLabel("Roll:");
  spin_roll_ = new QDoubleSpinBox(); spin_roll_->setRange(-3.15, 3.15); spin_roll_->setSingleStep(0.1); spin_roll_->setValue(3.14159);
  QLabel* lbl_pitch = new QLabel("Pitch:");
  spin_pitch_ = new QDoubleSpinBox(); spin_pitch_->setRange(-3.15, 3.15); spin_pitch_->setSingleStep(0.1); spin_pitch_->setValue(0.0);
  QLabel* lbl_yaw = new QLabel("Yaw:");
  spin_yaw_ = new QDoubleSpinBox(); spin_yaw_->setRange(-3.15, 3.15); spin_yaw_->setSingleStep(0.1); spin_yaw_->setValue(0.0);
  
  btn_move_to_ = new QPushButton("Move To Absolute Pose");

  move_layout->addWidget(lbl_x, 0, 0); move_layout->addWidget(spin_x_, 0, 1);
  move_layout->addWidget(lbl_y, 0, 2); move_layout->addWidget(spin_y_, 0, 3);
  move_layout->addWidget(lbl_z, 0, 4); move_layout->addWidget(spin_z_, 0, 5);
  move_layout->addWidget(lbl_roll, 1, 0); move_layout->addWidget(spin_roll_, 1, 1);
  move_layout->addWidget(lbl_pitch, 1, 2); move_layout->addWidget(spin_pitch_, 1, 3);
  move_layout->addWidget(lbl_yaw, 1, 4); move_layout->addWidget(spin_yaw_, 1, 5);
  move_layout->addWidget(btn_move_to_, 2, 0, 1, 6);
  
  main_layout->addWidget(group_cartesian);

  // ==========================================
  // SECTION 3: Joint Absolute Move
  // ==========================================
  QGroupBox* group_joints = new QGroupBox("Joint Absolute Move");
  group_joints->setStyleSheet("QGroupBox { background-color: #3b4b5b; }"); // Medium Gray
  QGridLayout* joint_layout = new QGridLayout(group_joints);
  
  // Limits in degrees for xArm Lite 6
  int joint_limits[6][2] = {
    {-180, 180}, // J1
    {-150, 150}, // J2
    {-3, 179},   // J3
    {-180, 180}, // J4
    {-124, 124}, // J5
    {-180, 180}  // J6
  };
  
  for (int i = 0; i < 6; ++i) {
      QLabel* lbl = new QLabel(QString("J%1:").arg(i+1));
      slider_joints_[i] = new QSlider(Qt::Horizontal);
      slider_joints_[i]->setRange(joint_limits[i][0], joint_limits[i][1]);
      slider_joints_[i]->setValue(0);
      lbl_joints_val_[i] = new QLabel("0°");
      lbl_joints_val_[i]->setFixedWidth(40);
      
      joint_layout->addWidget(lbl, i / 2, (i % 2) * 3);
      joint_layout->addWidget(slider_joints_[i], i / 2, (i % 2) * 3 + 1);
      joint_layout->addWidget(lbl_joints_val_[i], i / 2, (i % 2) * 3 + 2);
      
      connect(slider_joints_[i], &QSlider::valueChanged, this, &ControlPanel::onJointSliderChanged);
  }
  
  btn_move_joints_ = new QPushButton("Move To Joints");
  btn_move_joints_->setStyleSheet(
    "QPushButton { background-color: #8e44ad; border-radius: 6px; padding: 8px; border: 1px solid #9b59b6; color: #fff; }"
    "QPushButton:hover { background-color: #9b59b6; }"
    "QPushButton:pressed { background-color: #732d91; }"
  );
  joint_layout->addWidget(btn_move_joints_, 3, 0, 1, 6);
  
  main_layout->addWidget(group_joints);

  // ==========================================
  // SECTION 4: Utilities & Grasping
  // ==========================================
  QGroupBox* group_utils = new QGroupBox("Utilities & Grasping");
  group_utils->setStyleSheet("QGroupBox { background-color: #273746; }"); // Very Dark
  QVBoxLayout* utils_layout = new QVBoxLayout(group_utils);

  QHBoxLayout* frame_layout = new QHBoxLayout();
  btn_frame_base_ = new QPushButton("Frame: link_base");
  btn_frame_tcp_ = new QPushButton("Frame: link_tcp");
  btn_initial_pose_ = new QPushButton("Initial Pose");
  btn_scan_ = new QPushButton("Vision Scan");
  frame_layout->addWidget(btn_frame_base_);
  frame_layout->addWidget(btn_frame_tcp_);
  frame_layout->addWidget(btn_initial_pose_);
  frame_layout->addWidget(btn_scan_);
  utils_layout->addLayout(frame_layout);

  QHBoxLayout* grasp_layout = new QHBoxLayout();
  QLabel* lbl_grasp = new QLabel("Grasp Object:");
  txt_grasp_object_ = new QLineEdit();
  txt_grasp_object_->setStyleSheet("QLineEdit { background-color: #ecf0f1; color: #2c3e50; font-weight: bold; }");
  txt_grasp_object_->setPlaceholderText("Object Name...");
  btn_grasp_ = new QPushButton("Grasp");
  grasp_layout->addWidget(lbl_grasp);
  grasp_layout->addWidget(txt_grasp_object_);
  grasp_layout->addWidget(btn_grasp_);
  utils_layout->addLayout(grasp_layout);

  main_layout->addWidget(group_utils);

  // ==========================================
  // Log Window
  // ==========================================
  txt_log_ = new QTextEdit();
  txt_log_->setReadOnly(true);
  txt_log_->setFixedHeight(100);
  txt_log_->setStyleSheet("QTextEdit { background-color: #1a252f; color: #ecf0f1; border: 1px solid #7f8c8d; border-radius: 4px; padding: 4px; font-family: monospace; font-size: 11px; }");
  txt_log_->append("System ready. Waiting for commands...");
  main_layout->addWidget(txt_log_);

  // Funktion zur Erstellung des Stylesheets mit übergebenen Farben
  auto makeStyle = [](const QString& baseColor, const QString& pressedColor) {
    return QString("QPushButton { background-color: %1; color: white; font-weight: bold; border-radius: 6px; border: 1px solid #2c3e50; padding: 10px; }"
                   "QPushButton:hover { background-color: %2; }"
                   "QPushButton:pressed { background-color: %2; }").arg(baseColor, pressedColor);
  };

  // Orientierung an den RViz Standard-Achsenfarben:
  // X-Achse (Vor/Zurück) = Rot
  QString styleX = makeStyle("#c0392b", "#e74c3c"); 
  
  // Y-Achse (Links/Rechts) = Grün
  QString styleY = makeStyle("#27ae60", "#2ecc71");
  
  // Z-Achse (Hoch/Runter) = Blau
  QString styleZ = makeStyle("#2980b9", "#3498db");
  
  btn_x_plus_->setStyleSheet(styleY);
  btn_x_minus_->setStyleSheet(styleY);
  
  btn_y_plus_->setStyleSheet(styleY);
  btn_y_minus_->setStyleSheet(styleY);
  
  btn_z_plus_->setStyleSheet(styleZ);
  btn_z_minus_->setStyleSheet(styleZ);
  
  // Rotation = Purple
  QString styleRot = makeStyle("#8e44ad", "#9b59b6");
  
  btn_rot_x_plus_->setStyleSheet(styleRot);
  btn_rot_x_minus_->setStyleSheet(styleRot);
  btn_rot_y_plus_->setStyleSheet(styleRot);
  btn_rot_y_minus_->setStyleSheet(styleRot);
  btn_rot_z_plus_->setStyleSheet(styleRot);
  btn_rot_z_minus_->setStyleSheet(styleRot);
  
  btn_move_to_->setStyleSheet(
    "QPushButton { background-color: #2980b9; border-radius: 6px; padding: 8px; border: 1px solid #3498db; color: #fff; }"
    "QPushButton:hover { background-color: #3498db; }"
    "QPushButton:pressed { background-color: #21618c; }"
  );
  
  btn_grasp_->setStyleSheet(
    "QPushButton { background-color: #e67e22; border-radius: 6px; padding: 8px; border: 1px solid #d35400; color: #fff; font-weight: bold; }"
    "QPushButton:hover { background-color: #d35400; }"
    "QPushButton:pressed { background-color: #a04000; }"
  );

  // Connect Signals
  connect(btn_x_plus_, &QPushButton::pressed, this, &ControlPanel::onButtonPressXPlus);
  connect(btn_x_minus_, &QPushButton::pressed, this, &ControlPanel::onButtonPressXMinus);
  connect(btn_y_plus_, &QPushButton::pressed, this, &ControlPanel::onButtonPressYPlus);
  connect(btn_y_minus_, &QPushButton::pressed, this, &ControlPanel::onButtonPressYMinus);
  connect(btn_z_plus_, &QPushButton::pressed, this, &ControlPanel::onButtonPressZPlus);
  connect(btn_z_minus_, &QPushButton::pressed, this, &ControlPanel::onButtonPressZMinus);
  
  connect(btn_rot_x_plus_, &QPushButton::pressed, this, &ControlPanel::onButtonPressRotXPlus);
  connect(btn_rot_x_minus_, &QPushButton::pressed, this, &ControlPanel::onButtonPressRotXMinus);
  connect(btn_rot_y_plus_, &QPushButton::pressed, this, &ControlPanel::onButtonPressRotYPlus);
  connect(btn_rot_y_minus_, &QPushButton::pressed, this, &ControlPanel::onButtonPressRotYMinus);
  connect(btn_rot_z_plus_, &QPushButton::pressed, this, &ControlPanel::onButtonPressRotZPlus);
  connect(btn_rot_z_minus_, &QPushButton::pressed, this, &ControlPanel::onButtonPressRotZMinus);

  connect(btn_initial_pose_, &QPushButton::clicked, this, &ControlPanel::onButtonInitialPose);
  connect(btn_scan_, &QPushButton::clicked, this, &ControlPanel::onButtonScanTrajectory);
  connect(btn_frame_base_, &QPushButton::clicked, this, &ControlPanel::onButtonFrameBase);
  connect(btn_frame_tcp_, &QPushButton::clicked, this, &ControlPanel::onButtonFrameTCP);
  connect(btn_move_to_, &QPushButton::clicked, this, &ControlPanel::onButtonMoveTo);
  connect(btn_move_joints_, &QPushButton::clicked, this, &ControlPanel::onButtonMoveJoints);
  connect(btn_grasp_, &QPushButton::clicked, this, &ControlPanel::onButtonGrasp);
  
  connect(speed_slider_, &QSlider::valueChanged, this, &ControlPanel::onSpeedSliderChanged);

  // All buttons release
  connect(btn_x_plus_, &QPushButton::released, this, &ControlPanel::onButtonRelease);
  connect(btn_x_minus_, &QPushButton::released, this, &ControlPanel::onButtonRelease);
  connect(btn_y_plus_, &QPushButton::released, this, &ControlPanel::onButtonRelease);
  connect(btn_y_minus_, &QPushButton::released, this, &ControlPanel::onButtonRelease);
  connect(btn_z_plus_, &QPushButton::released, this, &ControlPanel::onButtonRelease);
  connect(btn_z_minus_, &QPushButton::released, this, &ControlPanel::onButtonRelease);
  
  connect(btn_rot_x_plus_, &QPushButton::released, this, &ControlPanel::onButtonRelease);
  connect(btn_rot_x_minus_, &QPushButton::released, this, &ControlPanel::onButtonRelease);
  connect(btn_rot_y_plus_, &QPushButton::released, this, &ControlPanel::onButtonRelease);
  connect(btn_rot_y_minus_, &QPushButton::released, this, &ControlPanel::onButtonRelease);
  connect(btn_rot_z_plus_, &QPushButton::released, this, &ControlPanel::onButtonRelease);
  connect(btn_rot_z_minus_, &QPushButton::released, this, &ControlPanel::onButtonRelease);
}

void ControlPanel::updateTwist(double x, double y, double z, double rx, double ry, double rz)
{
  current_twist_.twist.linear.x = x;
  current_twist_.twist.linear.y = y;
  current_twist_.twist.linear.z = z;
  current_twist_.twist.angular.x = rx;
  current_twist_.twist.angular.y = ry;
  current_twist_.twist.angular.z = rz;
}

void ControlPanel::onButtonPressXPlus() { logToConsole("➤ Jog: Forward (X+)"); updateTwist(0.1 * current_speed_scale_, 0.0, 0.0, 0.0, 0.0, 0.0); publish_timer_->start(50); }
void ControlPanel::onButtonPressXMinus() { logToConsole("➤ Jog: Backward (X-)"); updateTwist(-0.1 * current_speed_scale_, 0.0, 0.0, 0.0, 0.0, 0.0); publish_timer_->start(50); }
void ControlPanel::onButtonPressYPlus() { logToConsole("➤ Jog: Left (Y+)"); updateTwist(0.0, 0.1 * current_speed_scale_, 0.0, 0.0, 0.0, 0.0); publish_timer_->start(50); }
void ControlPanel::onButtonPressYMinus() { logToConsole("➤ Jog: Right (Y-)"); updateTwist(0.0, -0.1 * current_speed_scale_, 0.0, 0.0, 0.0, 0.0); publish_timer_->start(50); }
void ControlPanel::onButtonPressZPlus() { logToConsole("➤ Jog: Up (Z+)"); updateTwist(0.0, 0.0, 0.1 * current_speed_scale_, 0.0, 0.0, 0.0); publish_timer_->start(50); }
void ControlPanel::onButtonPressZMinus() { logToConsole("➤ Jog: Down (Z-)"); updateTwist(0.0, 0.0, -0.1 * current_speed_scale_, 0.0, 0.0, 0.0); publish_timer_->start(50); }
void ControlPanel::onButtonPressRotXPlus() { logToConsole("➤ Jog: Roll +"); updateTwist(0.0, 0.0, 0.0, 0.2 * current_speed_scale_, 0.0, 0.0); publish_timer_->start(50); }
void ControlPanel::onButtonPressRotXMinus() { logToConsole("➤ Jog: Roll -"); updateTwist(0.0, 0.0, 0.0, -0.2 * current_speed_scale_, 0.0, 0.0); publish_timer_->start(50); }
void ControlPanel::onButtonPressRotYPlus() { logToConsole("➤ Jog: Pitch +"); updateTwist(0.0, 0.0, 0.0, 0.0, 0.2 * current_speed_scale_, 0.0); publish_timer_->start(50); }
void ControlPanel::onButtonPressRotYMinus() { logToConsole("➤ Jog: Pitch -"); updateTwist(0.0, 0.0, 0.0, 0.0, -0.2 * current_speed_scale_, 0.0); publish_timer_->start(50); }
void ControlPanel::onButtonPressRotZPlus() { logToConsole("➤ Jog: Yaw +"); updateTwist(0.0, 0.0, 0.0, 0.0, 0.0, 0.2 * current_speed_scale_); publish_timer_->start(50); }
void ControlPanel::onButtonPressRotZMinus() { logToConsole("➤ Jog: Yaw -"); updateTwist(0.0, 0.0, 0.0, 0.0, 0.0, -0.2 * current_speed_scale_); publish_timer_->start(50); }

void ControlPanel::onButtonInitialPose()
{
  RCLCPP_INFO(node_->get_logger(), "Triggering initial pose service.");
  logToConsole("➤ Triggering Initial Pose...");
  auto request = std::make_shared<std_srvs::srv::Trigger::Request>();
  
  if (!initial_pose_client_->wait_for_service(std::chrono::seconds(1))) {
    RCLCPP_ERROR(node_->get_logger(), "Service /ui/execute_initial_pose not available.");
    logToConsole("❌ Error: Initial pose service not available.");
    return;
  }
  
  initial_pose_client_->async_send_request(request, [this](rclcpp::Client<std_srvs::srv::Trigger>::SharedFuture future) {
      auto response = future.get();
      if (response->success) {
          logToConsole("✓ Initial Pose reached successfully.");
      } else {
          logToConsole("❌ Initial Pose failed: " + QString::fromStdString(response->message));
      }
  });
}

void ControlPanel::onButtonScanTrajectory()
{
  RCLCPP_INFO(node_->get_logger(), "Triggering scan trajectory service.");
  logToConsole("➤ Triggering Vision Scan Path...");
  auto request = std::make_shared<std_srvs::srv::Trigger::Request>();
  
  if (!scan_client_->wait_for_service(std::chrono::seconds(1))) {
    RCLCPP_ERROR(node_->get_logger(), "Service /ui/execute_scan_trajectory not available.");
    logToConsole("❌ Error: Scan service not available.");
    return;
  }
  
  scan_client_->async_send_request(request, [this](rclcpp::Client<std_srvs::srv::Trigger>::SharedFuture future) {
      auto response = future.get();
      if (response->success) {
          logToConsole("✓ Vision Scan completed successfully.");
      } else {
          logToConsole("❌ Vision Scan failed: " + QString::fromStdString(response->message));
      }
  });
}

void ControlPanel::onButtonFrameBase() {
  active_frame_ = "link_base";
  logToConsole("➤ Jog Frame set to: link_base");
  if (frame_pub_) {
    std_msgs::msg::String msg;
    msg.data = "link_base";
    frame_pub_->publish(msg);
  }
}

void ControlPanel::onButtonFrameTCP() {
  active_frame_ = "link_tcp";
  logToConsole("➤ Jog Frame set to: link_tcp");
  if (frame_pub_) {
    std_msgs::msg::String msg;
    msg.data = "link_tcp";
    frame_pub_->publish(msg);
  }
}

void ControlPanel::onButtonRelease()
{
  publish_timer_->stop();
  updateTwist(0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
  publishTwist(); // publish one zero twist to stop
  // Not logging stop to avoid log flooding
}

void ControlPanel::publishTwist()
{
  if (twist_pub_ && node_) {
    current_twist_.header.stamp = node_->now();
    current_twist_.header.frame_id = active_frame_; // dynamically use the selected frame
    twist_pub_->publish(current_twist_);
  }
}

void ControlPanel::onButtonMoveTo()
{
  if (moveit_running_) {
    RCLCPP_WARN(node_->get_logger(), "MoveIt is already executing a trajectory.");
    logToConsole("❌ Error: Robot is already executing a move.");
    return;
  }
  
  double x = spin_x_->value();
  double y = spin_y_->value();
  double z = spin_z_->value();
  double roll = spin_roll_->value();
  double pitch = spin_pitch_->value();
  double yaw = spin_yaw_->value();

  moveit_running_ = true;
  logToConsole(QString("➤ MoveTo Absolute Pose: X=%1 Y=%2 Z=%3").arg(x).arg(y).arg(z));

  std::thread([this, x, y, z, roll, pitch, yaw]() {
    try {
      RCLCPP_INFO(node_->get_logger(), "Calling MoveTo service...");

      auto move_client = node_->create_client<xarm_msgs::srv::MoveCartesian>("/ui/execute_move_to_pose");
      if (move_client->wait_for_service(std::chrono::seconds(3))) {
        auto req = std::make_shared<xarm_msgs::srv::MoveCartesian::Request>();
        req->pose = {static_cast<float>(x), static_cast<float>(y), static_cast<float>(z), static_cast<float>(roll), static_cast<float>(pitch), static_cast<float>(yaw)};
        
        auto res = move_client->async_send_request(req);
        if (res.wait_for(std::chrono::seconds(10)) == std::future_status::ready) {
           RCLCPP_INFO(node_->get_logger(), "MoveTo finished.");
           auto response = res.get();
           if (response->ret == 0) {
               logToConsole("✓ MoveTo successful.");
           } else {
               logToConsole(QString("❌ MoveTo failed (ret=%1): ").arg(response->ret) + QString::fromStdString(response->message));
           }
        } else {
           RCLCPP_ERROR(node_->get_logger(), "MoveTo timed out.");
           logToConsole("❌ Error: MoveTo timed out after 10s.");
        }
      } else {
        RCLCPP_ERROR(node_->get_logger(), "MoveTo service not available.");
        logToConsole("❌ Error: MoveTo service not available.");
      }
    } catch (const std::exception& e) {
      RCLCPP_ERROR(node_->get_logger(), "MoveTo Error: %s", e.what());
      logToConsole(QString("❌ MoveTo Exception: ") + e.what());
    }
    moveit_running_ = false;
  }).detach();
}

void ControlPanel::onJointSliderChanged()
{
  for (int i = 0; i < 6; ++i) {
      int val = slider_joints_[i]->value();
      lbl_joints_val_[i]->setText(QString("%1°").arg(val, 4));
  }
}

void ControlPanel::onButtonMoveJoints()
{
  if (moveit_running_) {
    RCLCPP_WARN(node_->get_logger(), "MoveIt is already executing a trajectory.");
    logToConsole("❌ Error: Robot is already executing a move.");
    return;
  }
  
  std::vector<float> target_angles(6, 0.0f);
  QString log_msg = "➤ MoveTo Joints: ";
  for (int i = 0; i < 6; ++i) {
      float rad = slider_joints_[i]->value() * M_PI / 180.0f;
      target_angles[i] = rad;
      log_msg += QString("J%1=%2° ").arg(i+1).arg(slider_joints_[i]->value());
  }

  moveit_running_ = true;
  logToConsole(log_msg);

  std::thread([this, target_angles]() {
    try {
      RCLCPP_INFO(node_->get_logger(), "Calling MoveJoint service...");

      auto move_client = node_->create_client<xarm_msgs::srv::MoveJoint>("/ui/execute_move_joint");
      if (move_client->wait_for_service(std::chrono::seconds(3))) {
        auto req = std::make_shared<xarm_msgs::srv::MoveJoint::Request>();
        req->angles = target_angles;
        
        auto res = move_client->async_send_request(req);
        if (res.wait_for(std::chrono::seconds(20)) == std::future_status::ready) {
           RCLCPP_INFO(node_->get_logger(), "MoveJoint finished.");
           auto response = res.get();
           if (response->ret == 0) {
               logToConsole("✓ MoveJoint successful.");
           } else {
               logToConsole(QString("❌ MoveJoint failed (ret=%1): ").arg(response->ret) + QString::fromStdString(response->message));
           }
        } else {
           RCLCPP_ERROR(node_->get_logger(), "MoveJoint timed out.");
           logToConsole("❌ Error: MoveJoint timed out after 20s.");
        }
      } else {
        RCLCPP_ERROR(node_->get_logger(), "MoveJoint service not available.");
        logToConsole("❌ Error: MoveJoint service not available.");
      }
    } catch (const std::exception& e) {
      RCLCPP_ERROR(node_->get_logger(), "MoveJoint Error: %s", e.what());
      logToConsole(QString("❌ MoveJoint Exception: ") + e.what());
    }
    moveit_running_ = false;
  }).detach();
}

void ControlPanel::onSpeedSliderChanged(int value)
{
  auto msg = std_msgs::msg::Int32();
  msg.data = value;
  set_speed_index_pub_->publish(msg);
}

void ControlPanel::onButtonGrasp()
{
  QString object_name = txt_grasp_object_->text().trimmed();
  if (object_name.isEmpty()) {
    RCLCPP_WARN(node_->get_logger(), "No object name entered.");
    logToConsole("❌ Error: No object name entered for grasp.");
    return;
  }
  
  if (grasp_object_pub_) {
    std_msgs::msg::String msg;
    msg.data = object_name.toStdString();
    grasp_object_pub_->publish(msg);
    RCLCPP_INFO(node_->get_logger(), "Published Grasp Object command: %s", msg.data.c_str());
    // NOTE: Grasp status is returned via /ui/grasp_status and handled automatically
  }
}

void ControlPanel::logToConsole(const QString& msg) {
    Q_EMIT sendLogMessage(msg);
}

void ControlPanel::onLogMessage(const QString& msg) {
    if(txt_log_) {
        QString colored_msg = msg.toHtmlEscaped();
        
        if (msg.contains("❌") || msg.contains("Error", Qt::CaseInsensitive) || msg.contains("Failed", Qt::CaseInsensitive)) {
            colored_msg = QString("<span style=\"color: #e74c3c; font-weight: bold;\">%1</span>").arg(colored_msg); // Red
        } else if (msg.contains("✓") || msg.contains("Success", Qt::CaseInsensitive)) {
            colored_msg = QString("<span style=\"color: #2ecc71; font-weight: bold;\">%1</span>").arg(colored_msg); // Green
        } else if (msg.contains("➤ Phase", Qt::CaseInsensitive)) {
            colored_msg = QString("<span style=\"color: #e67e22; font-weight: bold;\">%1</span>").arg(colored_msg); // Orange
        } else if (msg.contains("➤")) {
            colored_msg = QString("<span style=\"color: #3498db;\">%1</span>").arg(colored_msg); // Blue
        } else if (msg.contains("Warning", Qt::CaseInsensitive)) {
            colored_msg = QString("<span style=\"color: #f1c40f; font-weight: bold;\">%1</span>").arg(colored_msg); // Yellow
        } else {
            colored_msg = QString("<span style=\"color: #ecf0f1;\">%1</span>").arg(colored_msg); // Default Light Gray
        }
        
        txt_log_->append(colored_msg);
        QScrollBar *vScrollBar = txt_log_->verticalScrollBar();
        if (vScrollBar) {
            vScrollBar->setValue(vScrollBar->maximum());
        }
    }
}

} // namespace rviz_robot_control_panel

#include <pluginlib/class_list_macros.hpp>
PLUGINLIB_EXPORT_CLASS(rviz_robot_control_panel::ControlPanel, rviz_common::Panel)
