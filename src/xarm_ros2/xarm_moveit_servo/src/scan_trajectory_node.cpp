#include <rclcpp/rclcpp.hpp>
#include <std_srvs/srv/trigger.hpp>
#include <moveit/move_group_interface/move_group_interface.h>
#include <geometry_msgs/msg/pose.hpp>
#include <tf2/LinearMath/Quaternion.h>
#include <tf2/LinearMath/Matrix3x3.h>
#include <cmath>

class ScanTrajectoryNode : public rclcpp::Node
{
public:
  ScanTrajectoryNode(const rclcpp::NodeOptions& options = rclcpp::NodeOptions()) 
    : Node("scan_trajectory_node", options)
  {
    // Service endpoint — triggered by the "Vision Scan" button in the RViz Control Panel
    scan_service_ = this->create_service<std_srvs::srv::Trigger>(
      "/ui/execute_scan_trajectory",
      std::bind(&ScanTrajectoryNode::handle_scan_request, this, std::placeholders::_1, std::placeholders::_2)
    );

    // Separate node for service client calls (stop/start servo)
    client_node_ = std::make_shared<rclcpp::Node>("scan_traj_client_node");
    stop_servo_cli_ = client_node_->create_client<std_srvs::srv::Trigger>("/servo_server/stop_servo");
    start_servo_cli_ = client_node_->create_client<std_srvs::srv::Trigger>("/servo_server/start_servo");

    // Separate node for MoveGroupInterface (needs its own spinning context)
    move_group_node_ = std::make_shared<rclcpp::Node>("scan_traj_moveit_node", options);
    move_group_spin_thread_ = std::thread([this]() {
      rclcpp::spin(move_group_node_);
    });

    // Initialize MoveGroupInterface — requires the move_group action server to be running
    RCLCPP_INFO(this->get_logger(), "Waiting for move_group action server...");
    move_group_ = std::make_shared<moveit::planning_interface::MoveGroupInterface>(move_group_node_, "lite6");
    move_group_->setPlanningTime(10.0);
    move_group_->setMaxVelocityScalingFactor(0.3);
    move_group_->setMaxAccelerationScalingFactor(0.3);
    move_group_->setPoseReferenceFrame("link_base");
    move_group_->setEndEffectorLink("link_tcp");

    RCLCPP_INFO(this->get_logger(), "ScanTrajectoryNode ready. Call /ui/execute_scan_trajectory to run Vision Scan.");
  }

  ~ScanTrajectoryNode() {
    if (move_group_spin_thread_.joinable()) {
      rclcpp::shutdown();
      move_group_spin_thread_.join();
    }
  }

private:
  // ═══════════════════════════════════════════════════════════
  // Look-At Orientation: TCP Z-axis points from 'from' towards 'to'
  // ═══════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════
  // Service Handler
  // ═══════════════════════════════════════════════════════════
  void handle_scan_request(
    const std::shared_ptr<std_srvs::srv::Trigger::Request> request,
    std::shared_ptr<std_srvs::srv::Trigger::Response> response)
  {
    (void)request;
    RCLCPP_INFO(this->get_logger(), "=== Vision Scan: Starting ===");

    // Step 1: Stop MoveIt Servo to prevent command conflicts
    if (!call_trigger_service(stop_servo_cli_, "stop_servo")) {
      RCLCPP_ERROR(this->get_logger(), "Failed to stop servo. Aborting scan.");
      response->success = false;
      response->message = "Failed to stop servo.";
      return;
    }
    RCLCPP_INFO(this->get_logger(), "Servo stopped.");

    // ═══════════════════════════════════════════════════════════
    // Step 2: Generate Cartesian waypoints for the scan path
    // 
    // Trajectory: Half-circle arc around focus point (300, 0, 0)
    //   - Radius: 150mm
    //   - Theta sweeps from -80° to +80° (stays in reachable workspace)
    //   - Z increases from 100mm to 300mm during the sweep
    //   - TCP Z-axis always points at the focus point (look-at)
    // ═══════════════════════════════════════════════════════════
    std::vector<geometry_msgs::msg::Pose> waypoints;
    
    double focus_x = 0.3;
    double focus_y = 0.0;
    double focus_z = 0.0;
    double radius = 0.15;
    int num_waypoints = 40;

    for (int i = 0; i <= num_waypoints; ++i) {
      double phase = static_cast<double>(i) / num_waypoints;
      
      // Z increases linearly
      double z = 0.10 + 0.20 * phase;
      
      // Theta sweeps from -80° to +80°
      double theta = (-80.0 + 160.0 * phase) * M_PI / 180.0;
      
      double x = focus_x - radius * std::cos(theta);
      double y = focus_y + radius * std::sin(theta);
      
      // Compute look-at orientation
      tf2::Quaternion q = compute_look_at(tf2::Vector3(x, y, z), tf2::Vector3(focus_x, focus_y, focus_z));
      
      geometry_msgs::msg::Pose p;
      p.position.x = x;
      p.position.y = y;
      p.position.z = z;
      p.orientation.x = q.x();
      p.orientation.y = q.y();
      p.orientation.z = q.z();
      p.orientation.w = q.w();
      waypoints.push_back(p);
    }

    RCLCPP_INFO(this->get_logger(), "Generated %zu waypoints.", waypoints.size());

    // ═══════════════════════════════════════════════════════════
    // Step 3: Move to the first waypoint (free-space planning)
    // ═══════════════════════════════════════════════════════════
    RCLCPP_INFO(this->get_logger(), "Planning move to scan start pose...");
    move_group_->setPoseTarget(waypoints.front());
    moveit::planning_interface::MoveGroupInterface::Plan plan_to_start;
    if (move_group_->plan(plan_to_start) != moveit::core::MoveItErrorCode::SUCCESS) {
      RCLCPP_ERROR(this->get_logger(), "Failed to plan path to scan start pose.");
      call_trigger_service(start_servo_cli_, "start_servo");
      response->success = false;
      response->message = "Planning to start pose failed.";
      return;
    }
    RCLCPP_INFO(this->get_logger(), "Executing move to start pose...");
    move_group_->execute(plan_to_start);

    // ═══════════════════════════════════════════════════════════
    // Step 4: Execute Cartesian path (smooth, continuous motion)
    // ═══════════════════════════════════════════════════════════
    RCLCPP_INFO(this->get_logger(), "Computing Cartesian path...");
    moveit_msgs::msg::RobotTrajectory trajectory;
    const double jump_threshold = 0.0;  // Disable jump detection
    const double eef_step = 0.01;       // 1cm interpolation resolution
    double fraction = move_group_->computeCartesianPath(waypoints, eef_step, jump_threshold, trajectory);

    if (fraction > 0.9) {
      RCLCPP_INFO(this->get_logger(), "Cartesian path %.1f%% achieved. Executing...", fraction * 100.0);
      move_group_->execute(trajectory);
      RCLCPP_INFO(this->get_logger(), "=== Vision Scan: Complete ===");
      response->success = true;
      response->message = "Vision Scan trajectory finished.";
    } else {
      RCLCPP_WARN(this->get_logger(), "Cartesian path only %.1f%% achievable. Aborting.", fraction * 100.0);
      response->success = false;
      response->message = "Cartesian path planning insufficient.";
    }

    // Step 5: Re-enable MoveIt Servo for manual control
    call_trigger_service(start_servo_cli_, "start_servo");
    RCLCPP_INFO(this->get_logger(), "Servo re-enabled.");
  }

  // ═══════════════════════════════════════════════════════════
  // Helper: Call a Trigger service (stop_servo / start_servo)
  // ═══════════════════════════════════════════════════════════
  bool call_trigger_service(rclcpp::Client<std_srvs::srv::Trigger>::SharedPtr client, const std::string& name)
  {
    if (!client->wait_for_service(std::chrono::seconds(3))) {
      RCLCPP_ERROR(this->get_logger(), "Service %s not available.", name.c_str());
      return false;
    }
    auto req = std::make_shared<std_srvs::srv::Trigger::Request>();
    auto future = client->async_send_request(req);
    if (rclcpp::spin_until_future_complete(client_node_, future, std::chrono::seconds(5)) ==
        rclcpp::FutureReturnCode::SUCCESS)
    {
      return future.get()->success;
    }
    RCLCPP_ERROR(this->get_logger(), "Failed to call service %s.", name.c_str());
    return false;
  }

  // Members
  rclcpp::Service<std_srvs::srv::Trigger>::SharedPtr scan_service_;
  std::shared_ptr<rclcpp::Node> client_node_;
  rclcpp::Client<std_srvs::srv::Trigger>::SharedPtr stop_servo_cli_;
  rclcpp::Client<std_srvs::srv::Trigger>::SharedPtr start_servo_cli_;

  std::shared_ptr<rclcpp::Node> move_group_node_;
  std::shared_ptr<moveit::planning_interface::MoveGroupInterface> move_group_;
  std::thread move_group_spin_thread_;
};

int main(int argc, char** argv)
{
  rclcpp::init(argc, argv);
  rclcpp::NodeOptions node_options;
  node_options.automatically_declare_parameters_from_overrides(true);
  auto node = std::make_shared<ScanTrajectoryNode>(node_options);
  rclcpp::executors::MultiThreadedExecutor executor;
  executor.add_node(node);
  executor.spin();
  rclcpp::shutdown();
  return 0;
}
