/* Copyright 2026
 *
 * Node for Meta Quest 3 VR Controller Input handling.
 * This node subscribes to Twist and Joy commands from a VR bridge (e.g. Quest2ROS2)
 * and forwards them to the servo_server and robot gripper services.
 */

#include <rclcpp/rclcpp.hpp>
#include <geometry_msgs/msg/twist_stamped.hpp>
#include <sensor_msgs/msg/joy.hpp>
#include <std_srvs/srv/trigger.hpp>
#include <xarm_msgs/srv/call.hpp>
#include <algorithm>
#include <cmath>

namespace xarm_quest3_vr
{
    class Quest3VRToServoPub : public rclcpp::Node
    {
    public:
        explicit Quest3VRToServoPub(const rclcpp::NodeOptions &options)
            : Node("quest3_vr_to_twist_publisher", options),
              vacuum_gripper_state_(false)
        {
            RCLCPP_INFO(this->get_logger(), "Quest 3 VR Input Node initialized (6DoF Spatial Tracking Mode).");
            
            // Parameter
            this->declare_parameter<std::string>("vr_twist_topic", "/vr_teleop/right_controller/twist");
            this->declare_parameter<std::string>("vr_joy_topic", "/vr_teleop/right_controller/joy");
            this->declare_parameter<std::string>("cartesian_command_in_topic", "/servo_server/delta_twist_cmds");
            this->declare_parameter<double>("linear_speed_scale", 0.5);
            this->declare_parameter<double>("angular_speed_scale", 0.5);

            std::string vr_twist_topic, vr_joy_topic, cartesian_command_in_topic;
            this->get_parameter("vr_twist_topic", vr_twist_topic);
            this->get_parameter("vr_joy_topic", vr_joy_topic);
            this->get_parameter("cartesian_command_in_topic", cartesian_command_in_topic);
            this->get_parameter("linear_speed_scale", linear_speed_scale_);
            this->get_parameter("angular_speed_scale", angular_speed_scale_);

            // Publishers & Subscribers
            twist_pub_ = this->create_publisher<geometry_msgs::msg::TwistStamped>(cartesian_command_in_topic, 10);
            
            vr_twist_sub_ = this->create_subscription<geometry_msgs::msg::TwistStamped>(
                vr_twist_topic, 10, std::bind(&Quest3VRToServoPub::_vr_twist_callback, this, std::placeholders::_1));
            
            vr_joy_sub_ = this->create_subscription<sensor_msgs::msg::Joy>(
                vr_joy_topic, 10, std::bind(&Quest3VRToServoPub::_vr_joy_callback, this, std::placeholders::_1));

            // Clients
            _open_gripper_client_ = this->create_client<xarm_msgs::srv::Call>("/ufactory/open_lite6_gripper");
            _close_gripper_client_ = this->create_client<xarm_msgs::srv::Call>("/ufactory/close_lite6_gripper");
            
            prev_buttons_.resize(10, 0);
        }

    private:
        void _vr_twist_callback(const geometry_msgs::msg::TwistStamped::SharedPtr msg)
        {
            auto servo_twist = std::make_unique<geometry_msgs::msg::TwistStamped>();
            servo_twist->header.stamp = this->now();
            servo_twist->header.frame_id = "link_base";
            
            // Skaliere die Geschwindigkeiten
            servo_twist->twist.linear.x = msg->twist.linear.x * linear_speed_scale_;
            servo_twist->twist.linear.y = msg->twist.linear.y * linear_speed_scale_;
            servo_twist->twist.linear.z = msg->twist.linear.z * linear_speed_scale_;
            
            servo_twist->twist.angular.x = msg->twist.angular.x * angular_speed_scale_;
            servo_twist->twist.angular.y = msg->twist.angular.y * angular_speed_scale_;
            servo_twist->twist.angular.z = msg->twist.angular.z * angular_speed_scale_;
            
            // Deadzone (Rauschen filtern)
            const double deadzone = 0.005;
            if (std::abs(servo_twist->twist.linear.x) < deadzone) servo_twist->twist.linear.x = 0;
            if (std::abs(servo_twist->twist.linear.y) < deadzone) servo_twist->twist.linear.y = 0;
            if (std::abs(servo_twist->twist.linear.z) < deadzone) servo_twist->twist.linear.z = 0;
            if (std::abs(servo_twist->twist.angular.x) < deadzone) servo_twist->twist.angular.x = 0;
            if (std::abs(servo_twist->twist.angular.y) < deadzone) servo_twist->twist.angular.y = 0;
            if (std::abs(servo_twist->twist.angular.z) < deadzone) servo_twist->twist.angular.z = 0;
            
            bool is_zero = (servo_twist->twist.linear.x == 0.0 && servo_twist->twist.linear.y == 0.0 &&
                            servo_twist->twist.linear.z == 0.0 && servo_twist->twist.angular.x == 0.0 &&
                            servo_twist->twist.angular.y == 0.0 && servo_twist->twist.angular.z == 0.0);
            
            static int zero_twist_count = 0;
            if (is_zero) {
                zero_twist_count++;
                if (zero_twist_count > 5) return;
            } else {
                zero_twist_count = 0;
            }
            
            twist_pub_->publish(std::move(servo_twist));
        }

        void _vr_joy_callback(const sensor_msgs::msg::Joy::SharedPtr msg)
        {
            if (msg->buttons.empty()) return;

            const int VR_BTN_A = 0;
            
            if (msg->buttons.size() > VR_BTN_A && msg->buttons[VR_BTN_A] == 1 && prev_buttons_[VR_BTN_A] == 0) {
                auto request = std::make_shared<xarm_msgs::srv::Call::Request>();
                if (vacuum_gripper_state_) {
                    _close_gripper_client_->async_send_request(request);
                    RCLCPP_INFO(this->get_logger(), "VR Input: Schließe Greifer");
                    vacuum_gripper_state_ = false;
                } else {
                    _open_gripper_client_->async_send_request(request);
                    RCLCPP_INFO(this->get_logger(), "VR Input: Öffne Greifer");
                    vacuum_gripper_state_ = true;
                }
            }

            for (size_t i = 0; i < msg->buttons.size() && i < prev_buttons_.size(); ++i) {
                prev_buttons_[i] = msg->buttons[i];
            }
        }

        rclcpp::Publisher<geometry_msgs::msg::TwistStamped>::SharedPtr twist_pub_;
        rclcpp::Subscription<geometry_msgs::msg::TwistStamped>::SharedPtr vr_twist_sub_;
        rclcpp::Subscription<sensor_msgs::msg::Joy>::SharedPtr vr_joy_sub_;
        rclcpp::Client<xarm_msgs::srv::Call>::SharedPtr _open_gripper_client_;
        rclcpp::Client<xarm_msgs::srv::Call>::SharedPtr _close_gripper_client_;
        
        bool vacuum_gripper_state_;
        double linear_speed_scale_;
        double angular_speed_scale_;
        std::vector<int> prev_buttons_;
    };
} // namespace xarm_quest3_vr

#include <rclcpp_components/register_node_macro.hpp>
RCLCPP_COMPONENTS_REGISTER_NODE(xarm_quest3_vr::Quest3VRToServoPub)
