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
  initial_pose_client_ = node_->create_client<std_srvs::srv::Trigger>("/ui/execute_initial_pose");
  scan_client_ = node_->create_client<std_srvs::srv::Trigger>("/ui/execute_scan_trajectory");
  move_cartesian_client_ = node_->create_client<xarm_msgs::srv::MoveCartesian>("/execute_motion_to_pose");
}

void ControlPanel::setupUI()
{
  QVBoxLayout* main_layout = new QVBoxLayout(this);
  
  QGridLayout* top_grid_layout = new QGridLayout();
  QGridLayout* grid_layout = new QGridLayout();

  // Create Rotation Buttons (Top)
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

  main_layout->addLayout(top_grid_layout);

  // Create Translation Buttons (D-Pad)
  btn_x_plus_ = new QPushButton("Forward\n(X+)");
  btn_x_minus_ = new QPushButton("Backward\n(X-)");
  btn_y_plus_ = new QPushButton("Left\n(Y+)");
  btn_y_minus_ = new QPushButton("Right\n(Y-)");
  btn_z_plus_ = new QPushButton("Up\n(Z+)");
  btn_z_minus_ = new QPushButton("Down\n(Z-)");
  btn_z_minus_ = new QPushButton("Down\n(Z-)");
  btn_initial_pose_ = new QPushButton("Move to Initial Position");
  btn_scan_ = new QPushButton("Vision Scan");
  
  grid_layout->addWidget(btn_z_plus_, 0, 0);
  grid_layout->addWidget(btn_x_plus_, 0, 1);

  grid_layout->addWidget(btn_y_plus_, 1, 0);
  grid_layout->addWidget(btn_initial_pose_, 1, 1);
  grid_layout->addWidget(btn_y_minus_, 1, 2);

  grid_layout->addWidget(btn_z_minus_, 2, 0);
  grid_layout->addWidget(btn_scan_, 2, 1);
  grid_layout->addWidget(btn_x_minus_, 2, 2);

  main_layout->addLayout(grid_layout);

  // New Buttons for bottom row
  btn_frame_base_ = new QPushButton("Frame: link_base");
  btn_frame_tcp_ = new QPushButton("Frame: link_tcp");

  QHBoxLayout* bottom_layout = new QHBoxLayout();
  bottom_layout->addWidget(btn_frame_base_);
  bottom_layout->addWidget(btn_frame_tcp_);

  main_layout->addLayout(bottom_layout);
  
  // Absolute Move Row
  QGridLayout* move_layout = new QGridLayout();
  
  QLabel* lbl_x = new QLabel("X:");
  spin_x_ = new QDoubleSpinBox(); spin_x_->setRange(-2000.0, 2000.0); spin_x_->setValue(300.0);
  QLabel* lbl_y = new QLabel("Y:");
  spin_y_ = new QDoubleSpinBox(); spin_y_->setRange(-2000.0, 2000.0); spin_y_->setValue(0.0);
  QLabel* lbl_z = new QLabel("Z:");
  spin_z_ = new QDoubleSpinBox(); spin_z_->setRange(-2000.0, 2000.0); spin_z_->setValue(200.0);
  
  QLabel* lbl_roll = new QLabel("R:");
  spin_roll_ = new QDoubleSpinBox(); spin_roll_->setRange(-3.15, 3.15); spin_roll_->setSingleStep(0.1); spin_roll_->setValue(3.14159);
  QLabel* lbl_pitch = new QLabel("P:");
  spin_pitch_ = new QDoubleSpinBox(); spin_pitch_->setRange(-3.15, 3.15); spin_pitch_->setSingleStep(0.1); spin_pitch_->setValue(0.0);
  QLabel* lbl_yaw = new QLabel("Yw:");
  spin_yaw_ = new QDoubleSpinBox(); spin_yaw_->setRange(-3.15, 3.15); spin_yaw_->setSingleStep(0.1); spin_yaw_->setValue(0.0);
  
  btn_move_to_ = new QPushButton("Move To Absolute Pose");
  
  move_layout->addWidget(lbl_x, 0, 0); move_layout->addWidget(spin_x_, 0, 1);
  move_layout->addWidget(lbl_y, 0, 2); move_layout->addWidget(spin_y_, 0, 3);
  move_layout->addWidget(lbl_z, 0, 4); move_layout->addWidget(spin_z_, 0, 5);
  move_layout->addWidget(lbl_roll, 1, 0); move_layout->addWidget(spin_roll_, 1, 1);
  move_layout->addWidget(lbl_pitch, 1, 2); move_layout->addWidget(spin_pitch_, 1, 3);
  move_layout->addWidget(lbl_yaw, 1, 4); move_layout->addWidget(spin_yaw_, 1, 5);
  move_layout->addWidget(btn_move_to_, 2, 0, 1, 6);
  
  main_layout->addLayout(move_layout);

  // Funktion zur Erstellung des Stylesheets mit übergebenen Farben
  auto makeStyle = [](const QString& baseColor, const QString& pressedColor) {
      return "QPushButton { background-color: " + baseColor + "; color: white; border-radius: 5px; padding: 10px; font-weight: bold; } "
             "QPushButton:pressed { background-color: " + pressedColor + "; }";
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
  
  QString styleMisc = makeStyle("#7f8c8d", "#95a5a6"); // Gray style
  btn_initial_pose_->setStyleSheet(styleMisc);
  btn_frame_base_->setStyleSheet(styleMisc);
  btn_frame_tcp_->setStyleSheet(styleMisc);
  
  btn_move_to_->setStyleSheet(makeStyle("#d35400", "#e67e22")); // Orange style for MoveTo

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

void ControlPanel::onButtonPressXPlus() { updateTwist(0.1, 0.0, 0.0, 0.0, 0.0, 0.0); publish_timer_->start(50); }
void ControlPanel::onButtonPressXMinus() { updateTwist(-0.1, 0.0, 0.0, 0.0, 0.0, 0.0); publish_timer_->start(50); }
void ControlPanel::onButtonPressYPlus() { updateTwist(0.0, 0.1, 0.0, 0.0, 0.0, 0.0); publish_timer_->start(50); }
void ControlPanel::onButtonPressYMinus() { updateTwist(0.0, -0.1, 0.0, 0.0, 0.0, 0.0); publish_timer_->start(50); }
void ControlPanel::onButtonPressZPlus() { updateTwist(0.0, 0.0, 0.1, 0.0, 0.0, 0.0); publish_timer_->start(50); }
void ControlPanel::onButtonPressZMinus() { updateTwist(0.0, 0.0, -0.1, 0.0, 0.0, 0.0); publish_timer_->start(50); }
void ControlPanel::onButtonPressRotXPlus() { updateTwist(0.0, 0.0, 0.0, 0.2, 0.0, 0.0); publish_timer_->start(50); }
void ControlPanel::onButtonPressRotXMinus() { updateTwist(0.0, 0.0, 0.0, -0.2, 0.0, 0.0); publish_timer_->start(50); }
void ControlPanel::onButtonPressRotYPlus() { updateTwist(0.0, 0.0, 0.0, 0.0, 0.2, 0.0); publish_timer_->start(50); }
void ControlPanel::onButtonPressRotYMinus() { updateTwist(0.0, 0.0, 0.0, 0.0, -0.2, 0.0); publish_timer_->start(50); }
void ControlPanel::onButtonPressRotZPlus() { updateTwist(0.0, 0.0, 0.0, 0.0, 0.0, 0.2); publish_timer_->start(50); }
void ControlPanel::onButtonPressRotZMinus() { updateTwist(0.0, 0.0, 0.0, 0.0, 0.0, -0.2); publish_timer_->start(50); }

void ControlPanel::onButtonInitialPose()
{
  RCLCPP_INFO(node_->get_logger(), "Triggering initial pose service.");
  auto request = std::make_shared<std_srvs::srv::Trigger::Request>();
  
  if (!initial_pose_client_->wait_for_service(std::chrono::seconds(1))) {
    RCLCPP_ERROR(node_->get_logger(), "Service /ui/execute_initial_pose not available.");
    return;
  }
  
  initial_pose_client_->async_send_request(request);
}

void ControlPanel::onButtonScanTrajectory()
{
  RCLCPP_INFO(node_->get_logger(), "Triggering scan trajectory service.");
  auto request = std::make_shared<std_srvs::srv::Trigger::Request>();
  
  if (!scan_client_->wait_for_service(std::chrono::seconds(1))) {
    RCLCPP_ERROR(node_->get_logger(), "Service /ui/execute_scan_trajectory not available.");
    return;
  }
  
  scan_client_->async_send_request(request);
}

void ControlPanel::onButtonFrameBase() {
  active_frame_ = "link_base";
  if (frame_pub_) {
    std_msgs::msg::String msg;
    msg.data = "link_base";
    frame_pub_->publish(msg);
  }
}

void ControlPanel::onButtonFrameTCP() {
  active_frame_ = "link_tcp";
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
  RCLCPP_INFO(node_->get_logger(), "Triggering absolute move to pose.");
  auto request = std::make_shared<xarm_msgs::srv::MoveCartesian::Request>();
  
  request->pose = {
    static_cast<float>(spin_x_->value()),
    static_cast<float>(spin_y_->value()),
    static_cast<float>(spin_z_->value()),
    static_cast<float>(spin_roll_->value()),
    static_cast<float>(spin_pitch_->value()),
    static_cast<float>(spin_yaw_->value())
  };
  
  request->speed = 200.0;
  request->acc = 1000.0;
  request->mvtime = 0.0;
  
  if (!move_cartesian_client_->wait_for_service(std::chrono::seconds(1))) {
    RCLCPP_ERROR(node_->get_logger(), "Service /execute_motion_to_pose not available.");
    return;
  }
  
  move_cartesian_client_->async_send_request(request);
}

} // namespace rviz_robot_control_panel

#include <pluginlib/class_list_macros.hpp>
PLUGINLIB_EXPORT_CLASS(rviz_robot_control_panel::ControlPanel, rviz_common::Panel)
