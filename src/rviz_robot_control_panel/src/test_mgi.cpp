#include <rclcpp/rclcpp.hpp>
#include <moveit/move_group_interface/move_group_interface.h>

int main(int argc, char** argv) {
    rclcpp::init(argc, argv);
    auto node = std::make_shared<rclcpp::Node>("test_mgi", rclcpp::NodeOptions().automatically_declare_parameters_from_overrides(true));
    try {
        moveit::planning_interface::MoveGroupInterface move_group(node, "lite6");
        RCLCPP_INFO(node->get_logger(), "MoveGroupInterface initialized successfully!");
    } catch (const std::exception& e) {
        RCLCPP_ERROR(node->get_logger(), "Error: %s", e.what());
    }
    rclcpp::shutdown();
    return 0;
}
