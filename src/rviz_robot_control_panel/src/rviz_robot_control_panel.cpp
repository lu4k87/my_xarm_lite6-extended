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
  btn_initial_pose_ = new QPushButton("Move to Initial Position");
  
  grid_layout->addWidget(btn_z_plus_, 0, 0);
  grid_layout->addWidget(btn_x_plus_, 0, 1);

  grid_layout->addWidget(btn_y_plus_, 1, 0);
  grid_layout->addWidget(btn_initial_pose_, 1, 1);
  grid_layout->addWidget(btn_y_minus_, 1, 2);

  grid_layout->addWidget(btn_z_minus_, 2, 0);
  grid_layout->addWidget(btn_x_minus_, 2, 1);

  main_layout->addLayout(grid_layout);

  // New Buttons for bottom row
  btn_frame_base_ = new QPushButton("Frame: link_base");
  btn_frame_tcp_ = new QPushButton("Frame: link_tcp");

  QHBoxLayout* bottom_layout = new QHBoxLayout();
  bottom_layout->addWidget(btn_frame_base_);
  bottom_layout->addWidget(btn_frame_tcp_);

  main_layout->addLayout(bottom_layout);

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
  connect(btn_frame_base_, &QPushButton::clicked, this, &ControlPanel::onButtonFrameBase);
  connect(btn_frame_tcp_, &QPushButton::clicked, this, &ControlPanel::onButtonFrameTCP);

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

void ControlPanel::onButtonInitialPose() {
  if (initial_pose_client_) {
    auto request = std::make_shared<std_srvs::srv::Trigger::Request>();
    initial_pose_client_->async_send_request(request);
  }
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

} // namespace rviz_robot_control_panel

#include <pluginlib/class_list_macros.hpp>
PLUGINLIB_EXPORT_CLASS(rviz_robot_control_panel::ControlPanel, rviz_common::Panel)
