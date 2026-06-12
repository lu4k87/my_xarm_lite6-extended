#include <rclcpp/rclcpp.hpp>
#include <moveit/move_group_interface/move_group_interface.h>

int main(int argc, char** argv) {
    rclcpp::init(argc, argv);
    auto node = std::make_shared<rclcpp::Node>("test_mgi", rclcpp::NodeOptions().automatically_declare_parameters_from_overrides(true));
    try {
        moveit::planning_interface::MoveGroupInterface move_group(node, "lite6");
        RCLCPP_INFO(node->get_logger(), "MoveGroupInterface initialized successfully!");
        move_group.setEndEffectorLink("link_tcp");
        
        geometry_msgs::msg::Pose target_pose;
        target_pose.position.x = 0.3; target_pose.position.y = 0.0; target_pose.position.z = 0.2;
        target_pose.orientation.x = 1.0; target_pose.orientation.y = 0.0; target_pose.orientation.z = 0.0; target_pose.orientation.w = 0.0;
        move_group.setPoseTarget(target_pose);
        
        auto success = move_group.move();
        if (success == moveit::core::MoveItErrorCode::SUCCESS) {
            RCLCPP_INFO(node->get_logger(), "Move SUCCESS");
        } else {
            RCLCPP_ERROR(node->get_logger(), "Move FAILED");
        }
    } catch (const std::exception& e) {
        RCLCPP_ERROR(node->get_logger(), "Error: %s", e.what());
    }
    rclcpp::shutdown();
    return 0;
}
