#ifndef RVIZ_CONTROL_ROBOT_PANEL_HPP
#define RVIZ_CONTROL_ROBOT_PANEL_HPP

#include <rviz_common/panel.hpp>
#include <rclcpp/rclcpp.hpp>
#include <geometry_msgs/msg/twist_stamped.hpp>
#include <std_msgs/msg/string.hpp>
#include <QPushButton>
#include <QTimer>
#include <QGridLayout>
#include <QVBoxLayout>

namespace rviz_control_robot_panel
{

class ControlPanel : public rviz_common::Panel
{
  Q_OBJECT
public:
  explicit ControlPanel(QWidget* parent = nullptr);
  virtual ~ControlPanel();

  void onInitialize() override;

protected Q_SLOTS:
  // Slots for button press/release
  void onButtonPressXPlus();
  void onButtonPressXMinus();
  void onButtonPressYPlus();
  void onButtonPressYMinus();
  void onButtonPressZPlus();
  void onButtonPressZMinus();
  void onButtonPressRotZPlus();
  void onButtonPressRotZMinus();
  
  void onButtonRelease();
  
  void onButtonInitialPose();
  void onButtonFrameBase();
  void onButtonFrameTCP();

  // Timer slot for continuous publishing
  void publishTwist();

protected:
  // ROS Node
  rclcpp::Node::SharedPtr node_;
  rclcpp::Publisher<geometry_msgs::msg::TwistStamped>::SharedPtr twist_pub_;
  rclcpp::Publisher<std_msgs::msg::String>::SharedPtr frame_pub_;

  // Qt UI Elements
  QPushButton* btn_x_plus_;
  QPushButton* btn_x_minus_;
  QPushButton* btn_y_plus_;
  QPushButton* btn_y_minus_;
  QPushButton* btn_z_plus_;
  QPushButton* btn_z_minus_;
  QPushButton* btn_rot_z_plus_;
  QPushButton* btn_rot_z_minus_;
  
  QPushButton* btn_initial_pose_;
  QPushButton* btn_frame_base_;
  QPushButton* btn_frame_tcp_;

  // State
  QTimer* publish_timer_;
  geometry_msgs::msg::TwistStamped current_twist_;
  
  void setupUI();
  void updateTwist(double x, double y, double z, double rx, double ry, double rz);
};

} // namespace rviz_control_robot_panel

#endif // RVIZ_CONTROL_ROBOT_PANEL_HPP
