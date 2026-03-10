#ifndef __XARM_JOY_STICK_INPUT_H__
#define __XARM_JOY_STICK_INPUT_H__

// ***************************************************************
// ROS 2 Header
// ***************************************************************
#include <rclcpp/rclcpp.hpp>
#include <sensor_msgs/msg/joy.hpp>
#include <geometry_msgs/msg/twist_stamped.hpp>
#include <geometry_msgs/msg/twist.hpp>
#include <control_msgs/msg/joint_jog.hpp>
#include <std_srvs/srv/trigger.hpp>
#include <moveit_msgs/msg/planning_scene.hpp>
#include <std_srvs/srv/set_bool.hpp>
#include "std_msgs/msg/float32.hpp" // Für die Geschwindigkeitsanzeige
#include "std_msgs/msg/string.hpp"   // Für Statusmeldungen
#include <vector>

// ***************************************************************
// XARM Spezifische Header
// ***************************************************************
#include <xarm_msgs/srv/call.hpp>
#include <xarm_msgs/srv/get_float32_list.hpp>
// Hinweis: move_cartesian und set_int16 werden in der CPP nicht verwendet, 
// aber wir lassen sie aus Konsistenz im Header.
#include <xarm_msgs/srv/move_cartesian.hpp>
#include <xarm_msgs/srv/set_int16.hpp>
#include <xarm_msgs/srv/set_int16_by_id.hpp>

// ***************************************************************
// Action Header (Whisper Sprachsteuerung)
// ***************************************************************
#include "rclcpp_action/rclcpp_action.hpp"
#include "whisper_idl/action/inference.hpp"


namespace xarm_moveit_servo
{
// Alias für die Action, um den Code kurz zu halten
using Inference = whisper_idl::action::Inference;

// Struktur zur Speicherung des vorherigen Zustands eines Sticks (für Glättung/Toten Zone)
struct LeftStickState
{
    float fb; // Vor/Zurück Zustand (float)
    float lr; // Links/Rechts Zustand (float)
};


class JoyToServoPub : public rclcpp::Node
{
public:
    /**
     * Konstruktor des JoyToServoPub Nodes.
     */
    JoyToServoPub(const rclcpp::NodeOptions& options);

private:
    // ***************************************************************
    // PRIVATE METHODEN
    // ***************************************************************

    /**
     * Ruft einen Parameter ab oder deklariert ihn mit einem Standardwert.
     */
    template <typename T>
    void _declare_or_get_param(T& output_value, const std::string& param_name, const T default_value);

    /**
     * Wandelt Joystick-Input in Twist- oder JointJog-Befehle um.
     */
    bool _convert_gamepad_joy_to_cmd(
        const std::vector<float>& axes,
        const std::vector<int>& buttons,
        std::unique_ptr<geometry_msgs::msg::TwistStamped>& twist,
        std::unique_ptr<control_msgs::msg::JointJog>& joint
    );

    /**
     * Filtert Twist-Werte unterhalb des Deadbands.
     */
    void _filter_twist_msg(std::unique_ptr<geometry_msgs::msg::TwistStamped>& twist, double val);
    
    /**
     * Callback-Funktion für eingehende Joystick-Nachrichten.
     */
    void _joy_callback(const sensor_msgs::msg::Joy::SharedPtr msg);

    // --- Whisper Action-Handler ---
    void _toggle_whisper_listening();
    void _goal_response_callback(const rclcpp_action::ClientGoalHandle<Inference>::SharedPtr & goal_handle);
    void _feedback_callback(
        rclcpp_action::ClientGoalHandle<Inference>::SharedPtr,
        const std::shared_ptr<const Inference::Feedback> feedback);
    void _result_callback(const rclcpp_action::ClientGoalHandle<Inference>::WrappedResult & result);
    void _cancel_response_callback(rclcpp_action::Client<Inference>::CancelResponse::SharedPtr result);
    
    // --- NEUE Timer-Methode für das Timeout-Handling ---
    void _timeout_timer_callback();


    // ***************************************************************
    // 1. ROS 2 Publisher und Subscriber
    // ***************************************************************
    rclcpp::Subscription<sensor_msgs::msg::Joy>::SharedPtr joy_sub_;
    rclcpp::Publisher<geometry_msgs::msg::TwistStamped>::SharedPtr twist_pub_;
    rclcpp::Publisher<control_msgs::msg::JointJog>::SharedPtr joint_pub_;
    rclcpp::Publisher<std_msgs::msg::Float32>::SharedPtr speed_pub_;            
    rclcpp::Publisher<std_msgs::msg::String>::SharedPtr button_press_pub_;      

    // ***************************************************************
    // 2. ROS 2 Service Clients
    // ***************************************************************
    rclcpp::Client<std_srvs::srv::Trigger>::SharedPtr servo_start_client_;
    rclcpp::Client<std_srvs::srv::Trigger>::SharedPtr servo_stop_client_;
    rclcpp::Client<xarm_msgs::srv::GetFloat32List>::SharedPtr _get_position_client_;
    rclcpp::Client<xarm_msgs::srv::Call>::SharedPtr _open_gripper_client_;
    rclcpp::Client<xarm_msgs::srv::Call>::SharedPtr _close_gripper_client_;
    rclcpp::Client<xarm_msgs::srv::Call>::SharedPtr _stop_gripper_client_; // NEU
    rclcpp::Client<std_srvs::srv::Trigger>::SharedPtr execute_sequence_y_client_;
    rclcpp::Client<std_srvs::srv::Trigger>::SharedPtr execute_sequence_b_client_;
    rclcpp::Client<std_srvs::srv::Trigger>::SharedPtr execute_sequence_x_client_;

    // ***************************************************************
    // 3. ROS 2 Action Client Variablen (Whisper)
    // ***************************************************************
    rclcpp_action::Client<Inference>::SharedPtr whisper_action_client_;
    // Verwendung des Alias aus dem Namensraum:
    rclcpp_action::ClientGoalHandle<Inference>::SharedPtr current_whisper_goal_handle_; 

    // ***************************************************************
    // 4. Status- und Zustandsvariablen (Booleans und Floats)
    // ***************************************************************
    bool vacuum_gripper_state_;   
    bool is_whisper_listening_;            
    float current_z_;              
    
    bool is_transitioning_;
    // bool manual_stop_requested_; // <-- Flag wird nicht mehr benötigt, da Timer die Timeout-Steuerung übernimmt
    
    geometry_msgs::msg::Twist smoothed_twist_; 
    double smoothing_factor_;                  

    // ***************************************************************
    // 5. Parameter und Konfigurations-Variablen (Integer und Strings)
    // ***************************************************************
    int dof_;
    int ros_queue_size_;
    int joystick_type_;
    int initialized_status_;           
    std::string joy_topic_;
    std::string cartesian_command_in_topic_;
    std::string joint_command_in_topic_;
    std::string robot_link_command_frame_;
    std::string ee_frame_name_;
    std::string planning_frame_;       

    // ***************************************************************
    // 6. Steuerungs- und Hilfsvariablen
    // ***************************************************************
    std::vector<int> prev_buttons_;             
    std::vector<double> speed_levels_;          
    int current_speed_index_;                   
    double linear_speed_scale_;                 
    float prev_cross_key_fb_state_;
    
    // --- NEUE Timer-Variablen ---
    rclcpp::TimerBase::SharedPtr timeout_timer_; 
    
        
};

} // namespace xarm_moveit_servo

#endif // __XARM_JOY_STICK_INPUT_H__
