#include <rclcpp/rclcpp.hpp>
#include <std_srvs/srv/trigger.hpp>
#include <geometry_msgs/msg/twist_stamped.hpp>
#include <tf2_ros/transform_listener.h>
#include <tf2_ros/buffer.h>
#include <tf2/LinearMath/Quaternion.h>
#include <tf2/LinearMath/Matrix3x3.h>
#include <cmath>

class ScanTrajectoryNode : public rclcpp::Node
{
public:
  ScanTrajectoryNode(const rclcpp::NodeOptions& options = rclcpp::NodeOptions()) 
    : Node("scan_trajectory_node", options),
      tf_buffer_(this->get_clock()),
      tf_listener_(tf_buffer_)
  {
    scan_service_ = this->create_service<std_srvs::srv::Trigger>(
      "/ui/execute_scan_trajectory",
      std::bind(&ScanTrajectoryNode::handle_scan_request, this, std::placeholders::_1, std::placeholders::_2)
    );

    twist_pub_ = this->create_publisher<geometry_msgs::msg::TwistStamped>("/servo_server/delta_twist_cmds", 10);

    timer_ = this->create_wall_timer(
      std::chrono::milliseconds(20), // 50 Hz
      std::bind(&ScanTrajectoryNode::control_loop, this)
    );

    RCLCPP_INFO(this->get_logger(), "ScanTrajectoryNode (P-Controller) ready. Call /ui/execute_scan_trajectory to run Vision Scan.");
  }

private:
  void handle_scan_request(
    const std::shared_ptr<std_srvs::srv::Trigger::Request> request,
    std::shared_ptr<std_srvs::srv::Trigger::Response> response)
  {
    (void)request;
    RCLCPP_INFO(this->get_logger(), "=== Vision Scan: Starting ===");
    is_scanning_ = true;
    start_time_ = this->now();
    response->success = true;
    response->message = "Vision Scan started.";
  }

  tf2::Quaternion compute_look_at(const tf2::Vector3& from, const tf2::Vector3& to)
  {
    tf2::Vector3 z_d = (to - from).normalized();
    tf2::Vector3 world_up(0, 0, 1);
    tf2::Vector3 x_d = world_up.cross(z_d);
    if (x_d.length() < 1e-3) {
      x_d = tf2::Vector3(1, 0, 0).cross(z_d);
    }
    x_d.normalize();
    tf2::Vector3 y_d = z_d.cross(x_d).normalized();

    tf2::Matrix3x3 R_d(
      x_d.x(), y_d.x(), z_d.x(),
      x_d.y(), y_d.y(), z_d.y(),
      x_d.z(), y_d.z(), z_d.z()
    );
    tf2::Quaternion q;
    R_d.getRotation(q);
    return q;
  }

  void control_loop()
  {
    if (!is_scanning_) return;

    double t = (this->now() - start_time_).seconds();
    const double total_duration = 20.0; // 20 seconds for the scan

    if (t > total_duration) {
      is_scanning_ = false;
      RCLCPP_INFO(this->get_logger(), "=== Vision Scan: Complete ===");
      // Send a few zero twists to stop
      for(int i=0; i<5; i++) {
        geometry_msgs::msg::TwistStamped stop_twist;
        stop_twist.header.stamp = this->now();
        stop_twist.header.frame_id = "link_base";
        twist_pub_->publish(stop_twist);
      }
      return;
    }

    geometry_msgs::msg::TransformStamped tfs;
    try {
      tfs = tf_buffer_.lookupTransform("link_base", "link_tcp", tf2::TimePointZero);
    } catch (tf2::TransformException &ex) {
      return;
    }

    tf2::Vector3 current_pos(
      tfs.transform.translation.x,
      tfs.transform.translation.y,
      tfs.transform.translation.z
    );

    tf2::Quaternion current_q(
      tfs.transform.rotation.x,
      tfs.transform.rotation.y,
      tfs.transform.rotation.z,
      tfs.transform.rotation.w
    );

    // Target Path Logic
    // Radius 150, Focus (300, 0, 0), Z increasing
    double focus_x = 0.3;
    double focus_y = 0.0;
    double focus_z = 0.0;
    double radius = 0.15;
    
    double phase = t / total_duration;
    double theta = (-80.0 + 160.0 * phase) * M_PI / 180.0; // -80 to +80
    
    tf2::Vector3 target_pos(
      focus_x - radius * std::cos(theta),
      focus_y + radius * std::sin(theta),
      0.10 + 0.20 * phase // Z increases from 100mm to 300mm
    );

    tf2::Quaternion target_q = compute_look_at(target_pos, tf2::Vector3(focus_x, focus_y, focus_z));

    // P-Controller
    double Kp_pos = 1.0;
    tf2::Vector3 pos_error = target_pos - current_pos;

    // Angular error
    tf2::Quaternion q_error = target_q * current_q.inverse();
    tf2::Vector3 axis = q_error.getAxis();
    double angle = q_error.getAngle();
    
    // Ensure shortest path
    if (angle > M_PI) {
        angle -= 2.0 * M_PI;
    }

    double Kp_ang = 0.5;
    tf2::Vector3 angular_vel = axis * angle * Kp_ang;

    geometry_msgs::msg::TwistStamped twist_msg;
    twist_msg.header.stamp = this->now();
    twist_msg.header.frame_id = "link_base";
    
    twist_msg.twist.linear.x = pos_error.x() * Kp_pos;
    twist_msg.twist.linear.y = pos_error.y() * Kp_pos;
    twist_msg.twist.linear.z = pos_error.z() * Kp_pos;
    
    twist_msg.twist.angular.x = angular_vel.x();
    twist_msg.twist.angular.y = angular_vel.y();
    twist_msg.twist.angular.z = angular_vel.z();

    twist_pub_->publish(twist_msg);
  }

  rclcpp::Service<std_srvs::srv::Trigger>::SharedPtr scan_service_;
  rclcpp::Publisher<geometry_msgs::msg::TwistStamped>::SharedPtr twist_pub_;
  rclcpp::TimerBase::SharedPtr timer_;
  
  tf2_ros::Buffer tf_buffer_;
  tf2_ros::TransformListener tf_listener_;

  bool is_scanning_ = false;
  rclcpp::Time start_time_;
};

int main(int argc, char** argv)
{
  rclcpp::init(argc, argv);
  rclcpp::spin(std::make_shared<ScanTrajectoryNode>());
  rclcpp::shutdown();
  return 0;
}
