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
  if (moveit_executor_) {
    moveit_executor_->cancel();
  }
  if (moveit_spinner_thread_.joinable()) {
    moveit_spinner_thread_.join();
  }
}

void ControlPanel::onInitialize()
{
  node_ = getDisplayContext()->getRosNodeAbstraction().lock()->get_raw_node();
  // Using the same topic as the gaze control
  twist_pub_ = node_->create_publisher<geometry_msgs::msg::TwistStamped>("/servo_server/delta_twist_cmds", 10);
  frame_pub_ = node_->create_publisher<std_msgs::msg::String>("/ui/robot_control/current_frame", 10);
  initial_pose_client_ = node_->create_client<std_srvs::srv::Trigger>("/ui/execute_initial_pose");
  scan_client_ = node_->create_client<std_srvs::srv::Trigger>("/ui/execute_scan_trajectory");
  
  moveit_node_ = std::make_shared<rclcpp::Node>("rviz_moveit_node", rclcpp::NodeOptions().automatically_declare_parameters_from_overrides(true));
  moveit_executor_ = std::make_shared<rclcpp::executors::SingleThreadedExecutor>();
  moveit_executor_->add_node(moveit_node_);
  moveit_spinner_thread_ = std::thread([this]() { moveit_executor_->spin(); });
}

void ControlPanel::setupUI()
{
  // Global Dark Theme
  this->setStyleSheet(
    "QWidget { background-color: #2c3e50; color: #ecf0f1; font-size: 13px; font-weight: bold; }"
    "QPushButton { background-color: #34495e; border-radius: 6px; padding: 8px; border: 1px solid #1abc9c; }"
    "QPushButton:hover { background-color: #1abc9c; color: #fff; }"
    "QPushButton:pressed { background-color: #16a085; }"
    "QDoubleSpinBox { background-color: #34495e; color: #ecf0f1; border: 1px solid #7f8c8d; border-radius: 4px; padding: 2px; }"
    "QLabel { color: #ecf0f1; }"
  );

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
  btn_x_plus_ = new QPushButton("↑ Forward\n(X+)");
  btn_x_minus_ = new QPushButton("↓ Backward\n(X-)");
  btn_y_plus_ = new QPushButton("← Left\n(Y+)");
  btn_y_minus_ = new QPushButton("→ Right\n(Y-)");
  btn_z_plus_ = new QPushButton("⇈ Up\n(Z+)");
  btn_z_minus_ = new QPushButton("⇊ Down\n(Z-)");
  btn_initial_pose_ = new QPushButton("Move to\nInitial Position");
  btn_scan_ = new QPushButton("Vision\nScan");
  
  grid_layout->addWidget(btn_z_plus_, 0, 0);
  grid_layout->addWidget(btn_x_plus_, 0, 1);

  grid_layout->addWidget(btn_y_plus_, 1, 0);
  grid_layout->addWidget(btn_initial_pose_, 1, 1);
  grid_layout->addWidget(btn_y_minus_, 1, 2);

  grid_layout->addWidget(btn_z_minus_, 2, 0);
  grid_layout->addWidget(btn_x_minus_, 2, 1);
  grid_layout->addWidget(btn_scan_, 2, 2);

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
  if (moveit_running_) {
    RCLCPP_WARN(node_->get_logger(), "MoveIt is already executing a trajectory.");
    return;
  }
  
  double x = spin_x_->value() / 1000.0; // mm to m
  double y = spin_y_->value() / 1000.0;
  double z = spin_z_->value() / 1000.0;
  double roll = spin_roll_->value();
  double pitch = spin_pitch_->value();
  double yaw = spin_yaw_->value();
  
  moveit_running_ = true;
  std::thread([this, x, y, z, roll, pitch, yaw]() {
    try {
      RCLCPP_INFO(node_->get_logger(), "Starting MoveIt background thread...");
      
      // Stop servo
      auto stop_client = node_->create_client<std_srvs::srv::Trigger>("/servo_server/stop_servo");
      if (stop_client->wait_for_service(std::chrono::seconds(1))) {
        auto req = std::make_shared<std_srvs::srv::Trigger::Request>();
        stop_client->async_send_request(req);
        std::this_thread::sleep_for(std::chrono::milliseconds(500));
      }
      
      moveit::planning_interface::MoveGroupInterface move_group(moveit_node_, "lite6");
      move_group.setMaxVelocityScalingFactor(0.5);
      move_group.setMaxAccelerationScalingFactor(0.5);
      
      // 1. Sichere Z-Höhe
      auto current_pose = move_group.getCurrentPose();
      if (current_pose.pose.position.z < 0.095) {
        RCLCPP_INFO(node_->get_logger(), "Z too low, moving to safe Z=150mm first.");
        geometry_msgs::msg::Pose safe_pose = current_pose.pose;
        safe_pose.position.z = 0.150;
        move_group.setPoseTarget(safe_pose);
        if (move_group.move() != moveit::core::MoveItErrorCode::SUCCESS) {
           RCLCPP_ERROR(node_->get_logger(), "Safe Z movement failed!");
           moveit_running_ = false;
           return;
        }
      }
      
      // 2. Absolute Pose
      tf2::Quaternion q;
      q.setRPY(roll, pitch, yaw);
      
      geometry_msgs::msg::Pose target_pose;
      target_pose.position.x = x;
      target_pose.position.y = y;
      target_pose.position.z = z;
      target_pose.orientation = tf2::toMsg(q);
      
      move_group.setPoseTarget(target_pose);
      RCLCPP_INFO(node_->get_logger(), "Planning and executing absolute move...");
      auto success = move_group.move();
      
      if (success == moveit::core::MoveItErrorCode::SUCCESS) {
        RCLCPP_INFO(node_->get_logger(), "Absolute move successful!");
      } else {
        RCLCPP_ERROR(node_->get_logger(), "Absolute move failed!");
      }
      
      // Start servo
      auto start_client = node_->create_client<std_srvs::srv::Trigger>("/servo_server/start_servo");
      if (start_client->wait_for_service(std::chrono::seconds(1))) {
        auto req = std::make_shared<std_srvs::srv::Trigger::Request>();
        start_client->async_send_request(req);
      }
      
    } catch (const std::exception& e) {
      RCLCPP_ERROR(node_->get_logger(), "MoveIt Error: %s", e.what());
    }
    moveit_running_ = false;
  }).detach();
}

} // namespace rviz_robot_control_panel

#include <pluginlib/class_list_macros.hpp>
PLUGINLIB_EXPORT_CLASS(rviz_robot_control_panel::ControlPanel, rviz_common::Panel)
