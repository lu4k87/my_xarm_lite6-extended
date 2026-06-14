#ifndef RVIZ_CONTROL_ROBOT_PANEL_HPP
#define RVIZ_CONTROL_ROBOT_PANEL_HPP

#include <rviz_common/panel.hpp>
#include <rclcpp/rclcpp.hpp>
#include <geometry_msgs/msg/twist_stamped.hpp>
#include <std_msgs/msg/string.hpp>
#include <std_srvs/srv/trigger.hpp>
#include <xarm_msgs/srv/move_cartesian.hpp>
#include <xarm_msgs/srv/move_joint.hpp>
#include <sensor_msgs/msg/joint_state.hpp>
#include <QPushButton>
#include <QTimer>
#include <QGridLayout>
#include <QVBoxLayout>
#include <QHBoxLayout>
#include <QDoubleSpinBox>
#include <QLabel>
#include <QLineEdit>
#include <QTextEdit>
#include <QScrollBar>
#include <QGroupBox>
#include <thread>
#include <atomic>
#include <moveit/move_group_interface/move_group_interface.h>
#include <tf2_geometry_msgs/tf2_geometry_msgs.hpp>
#include <tf2/LinearMath/Quaternion.h>
#include <QSlider>
#include <std_msgs/msg/int32.hpp>
#include <std_msgs/msg/float32.hpp>

namespace rviz_robot_control_panel
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
  void onButtonPressRotXPlus();
  void onButtonPressRotXMinus();
  void onButtonPressRotYPlus();
  void onButtonPressRotYMinus();
  
  void onButtonRelease();
  
  void onButtonInitialPose();
  void onButtonScanTrajectory();
  void onButtonFrameBase();
  void onButtonFrameTCP();

  // Timer slot for continuous publishing
  void publishTwist();
  
  // Slot for absolute move
  void onButtonMoveTo();
  
  // Slot for joint move
  void onButtonMoveJoints();
  
  // Slot for joint slider changes
  void onJointSliderChanged();
  
  // Slot for grasp object
  void onButtonGrasp();
  
  // Slot for speed slider
  void onSpeedSliderChanged(int value);

private Q_SLOTS:
  void onLogMessage(const QString& msg);

Q_SIGNALS:
  void sendLogMessage(const QString& msg);

protected:
  // ROS Node
  rclcpp::Node::SharedPtr node_;
  rclcpp::Publisher<geometry_msgs::msg::TwistStamped>::SharedPtr twist_pub_;
  rclcpp::Publisher<std_msgs::msg::String>::SharedPtr frame_pub_;
  rclcpp::Publisher<std_msgs::msg::String>::SharedPtr grasp_object_pub_;
  rclcpp::Publisher<std_msgs::msg::Int32>::SharedPtr set_speed_index_pub_;
  rclcpp::Subscription<std_msgs::msg::Float32>::SharedPtr speed_sub_;
  rclcpp::Subscription<std_msgs::msg::String>::SharedPtr status_sub_;
  rclcpp::Subscription<sensor_msgs::msg::JointState>::SharedPtr joint_state_sub_;

  // Qt UI Elements
  QPushButton* btn_x_plus_;
  QPushButton* btn_x_minus_;
  QPushButton* btn_y_plus_;
  QPushButton* btn_y_minus_;
  QPushButton* btn_z_plus_;
  QPushButton* btn_z_minus_;
  QPushButton* btn_rot_z_plus_;
  QPushButton* btn_rot_z_minus_;
  QPushButton* btn_rot_x_plus_;
  QPushButton* btn_rot_x_minus_;
  QPushButton* btn_rot_y_plus_;
  QPushButton* btn_rot_y_minus_;
  
  QPushButton* btn_initial_pose_;
  QPushButton* btn_scan_;
  QPushButton* btn_frame_base_;
  QPushButton* btn_frame_tcp_;
  
  QSlider* speed_slider_;
  QLabel* speed_label_;
  
  // Absolute Move Elements
  QDoubleSpinBox* spin_x_;
  QDoubleSpinBox* spin_y_;
  QDoubleSpinBox* spin_z_;
  QDoubleSpinBox* spin_roll_;
  QDoubleSpinBox* spin_pitch_;
  QDoubleSpinBox* spin_yaw_;
  QPushButton* btn_move_to_;

  // Joint Move Elements
  QSlider* slider_joints_[6];
  QLabel* lbl_joints_val_[6];
  QPushButton* btn_move_joints_;

  // Grasp Object Elements
  QLineEdit* txt_grasp_object_;
  QPushButton* btn_grasp_;
  QTextEdit* txt_log_;

  // State
  QTimer* publish_timer_;
  geometry_msgs::msg::TwistStamped current_twist_;
  std::string active_frame_ = "link_base";
  
  rclcpp::Client<std_srvs::srv::Trigger>::SharedPtr initial_pose_client_;
  rclcpp::Client<std_srvs::srv::Trigger>::SharedPtr scan_client_;
  
  std::atomic<bool> moveit_running_{false};
  float current_speed_scale_ = 0.5f;
  bool initial_joint_state_received_ = false;
  
  void setupUI();
  void updateTwist(double x, double y, double z, double rx, double ry, double rz);
  void logToConsole(const QString& msg);
};

} // namespace rviz_robot_control_panel

#endif // RVIZ_CONTROL_ROBOT_PANEL_HPP
