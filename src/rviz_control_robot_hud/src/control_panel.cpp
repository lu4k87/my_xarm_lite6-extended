#include "rviz_control_robot_hud/control_panel.hpp"
#include <pluginlib/class_list_macros.hpp>
#include <rviz_common/display_context.hpp>

namespace rviz_control_robot_hud
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
}

void ControlPanel::setupUI()
{
  QVBoxLayout* main_layout = new QVBoxLayout(this);
  QGridLayout* grid_layout = new QGridLayout();

  // Create Buttons
  btn_x_plus_ = new QPushButton("Forward\n(X+)");
  btn_x_minus_ = new QPushButton("Backward\n(X-)");
  btn_y_plus_ = new QPushButton("Left\n(Y+)");
  btn_y_minus_ = new QPushButton("Right\n(Y-)");
  btn_z_plus_ = new QPushButton("Up\n(Z+)");
  btn_z_minus_ = new QPushButton("Down\n(Z-)");
  btn_rot_z_plus_ = new QPushButton("Rot Left\n(Z+)");
  btn_rot_z_minus_ = new QPushButton("Rot Right\n(Z-)");

  // Layout Option 1 (D-Pad):
  // [ Up ]   [ Fwd ] [ Rot L ]
  // [ Left ] [     ] [ Right ]
  // [ Down ] [ Bck ] [ Rot R ]
  
  grid_layout->addWidget(btn_z_plus_, 0, 0);
  grid_layout->addWidget(btn_x_plus_, 0, 1);
  grid_layout->addWidget(btn_rot_z_plus_, 0, 2);

  grid_layout->addWidget(btn_y_plus_, 1, 0);
  // (1,1) bleibt leer
  grid_layout->addWidget(btn_y_minus_, 1, 2);

  grid_layout->addWidget(btn_z_minus_, 2, 0);
  grid_layout->addWidget(btn_x_minus_, 2, 1);
  grid_layout->addWidget(btn_rot_z_minus_, 2, 2);

  main_layout->addLayout(grid_layout);

  // Styling buttons to look nice
  QString btnStyle = "QPushButton {"
                     "background-color: #34495e;"
                     "color: white;"
                     "border-radius: 5px;"
                     "padding: 10px;"
                     "font-weight: bold;"
                     "}"
                     "QPushButton:pressed {"
                     "background-color: #2ecc71;"
                     "}";

  btn_x_plus_->setStyleSheet(btnStyle);
  btn_x_minus_->setStyleSheet(btnStyle);
  btn_y_plus_->setStyleSheet(btnStyle);
  btn_y_minus_->setStyleSheet(btnStyle);
  btn_z_plus_->setStyleSheet(btnStyle);
  btn_z_minus_->setStyleSheet(btnStyle);
  btn_rot_z_plus_->setStyleSheet(btnStyle);
  btn_rot_z_minus_->setStyleSheet(btnStyle);

  // Connect Signals
  connect(btn_x_plus_, &QPushButton::pressed, this, &ControlPanel::onButtonPressXPlus);
  connect(btn_x_minus_, &QPushButton::pressed, this, &ControlPanel::onButtonPressXMinus);
  connect(btn_y_plus_, &QPushButton::pressed, this, &ControlPanel::onButtonPressYPlus);
  connect(btn_y_minus_, &QPushButton::pressed, this, &ControlPanel::onButtonPressYMinus);
  connect(btn_z_plus_, &QPushButton::pressed, this, &ControlPanel::onButtonPressZPlus);
  connect(btn_z_minus_, &QPushButton::pressed, this, &ControlPanel::onButtonPressZMinus);
  connect(btn_rot_z_plus_, &QPushButton::pressed, this, &ControlPanel::onButtonPressRotZPlus);
  connect(btn_rot_z_minus_, &QPushButton::pressed, this, &ControlPanel::onButtonPressRotZMinus);

  // All buttons release
  connect(btn_x_plus_, &QPushButton::released, this, &ControlPanel::onButtonRelease);
  connect(btn_x_minus_, &QPushButton::released, this, &ControlPanel::onButtonRelease);
  connect(btn_y_plus_, &QPushButton::released, this, &ControlPanel::onButtonRelease);
  connect(btn_y_minus_, &QPushButton::released, this, &ControlPanel::onButtonRelease);
  connect(btn_z_plus_, &QPushButton::released, this, &ControlPanel::onButtonRelease);
  connect(btn_z_minus_, &QPushButton::released, this, &ControlPanel::onButtonRelease);
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
void ControlPanel::onButtonPressRotZPlus() { updateTwist(0.0, 0.0, 0.0, 0.0, 0.0, 0.1); publish_timer_->start(50); }
void ControlPanel::onButtonPressRotZMinus() { updateTwist(0.0, 0.0, 0.0, 0.0, 0.0, -0.1); publish_timer_->start(50); }

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
    current_twist_.header.frame_id = "link_base"; // matching the gaze ui node
    twist_pub_->publish(current_twist_);
  }
}

} // namespace rviz_control_robot_hud

#include <pluginlib/class_list_macros.hpp>
PLUGINLIB_EXPORT_CLASS(rviz_control_robot_hud::ControlPanel, rviz_common::Panel)
