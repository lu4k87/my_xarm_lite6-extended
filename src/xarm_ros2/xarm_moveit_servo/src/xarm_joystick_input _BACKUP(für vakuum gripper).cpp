/* Copyright 2021 UFACTORY Inc. All Rights Reserved.
 *
 * Software License Agreement (BSD License)
 *
 * Author: Vinman <vinman.cub@gmail.com>
 ============================================================================*/

#include "xarm_moveit_servo/xarm_joystick_input.h" // Enthält die Klasse JoyToServoPub

#include "rclcpp_action/rclcpp_action.hpp"
#include "whisper_idl/action/inference.hpp"
#include "action_msgs/srv/cancel_goal.hpp"
#include "std_msgs/msg/string.hpp"

// Zusätzliche Includes für die Funktionen, die im Body verwendet werden
#include <geometry_msgs/msg/twist_stamped.hpp>
#include <control_msgs/msg/joint_jog.hpp>
#include <sensor_msgs/msg/joy.hpp>
#include <std_srvs/srv/trigger.hpp>
#include <std_msgs/msg/float32.hpp>
#include <xarm_msgs/srv/call.hpp>
#include <xarm_msgs/srv/get_float32_list.hpp>
#include <algorithm> // Für std::clamp
#include <sstream>
#include <iomanip>

namespace xarm_moveit_servo
{
    using Inference = whisper_idl::action::Inference;
    using GoalHandleInference = rclcpp_action::ClientGoalHandle<Inference>;

    // Enum-Definitionen (Xbox-Controller)
    enum JOYSTICK_TYPE { JOYSTICK_xbox = 1 };
    enum xbox_CONTROLLER_AXIS { xbox_LEFT_STICK_LR = 0, xbox_LEFT_STICK_FB = 1, xbox_LEFT_TRIGGER = 2, xbox_RIGHT_STICK_LR = 3, xbox_RIGHT_STICK_FB = 4, xbox_RIGHT_TRIGGER = 5, xbox_CROSS_KEY_LR = 6, xbox_CROSS_KEY_FB = 7 };
    enum xbox_CONTROLLER_BUTTON { xbox_BTN_A = 0, xbox_BTN_B = 1, xbox_BTN_X = 2, xbox_BTN_Y = 3, xbox_BTN_LB = 4, xbox_BTN_RB = 5, xbox_BTN_BACK = 6, xbox_BTN_START = 7, xbox_BTN_POWER = 8, xbox_BTN_STICK_LEFT = 9, xbox_BTN_STICK_RIGHT = 10 };

    JoyToServoPub::JoyToServoPub(const rclcpp::NodeOptions &options)
        : Node("joy_to_twist_publisher", options),
          
          // Initialisierung der Member-Variablen (Reihenfolge ist nun wie im Header)
          vacuum_gripper_state_(false),
          is_whisper_listening_(false),          
          current_z_(0.0f), 
          is_transitioning_(false),
          smoothed_twist_({}), 
          smoothing_factor_(0.5),
          dof_(7),
          ros_queue_size_(10),
          joystick_type_(JOYSTICK_xbox),
          initialized_status_(10),
          joy_topic_("/joy_check"),
          cartesian_command_in_topic_("/servo_server/delta_twist_cmds"),
          joint_command_in_topic_("/servo_server/delta_joint_cmds"),
          robot_link_command_frame_("link_base"),
          ee_frame_name_("link_eef"),
          planning_frame_("link_base"),
          current_speed_index_(2),
          prev_cross_key_fb_state_(0.0f)

    { 
        speed_levels_ = {0.125, 0.25, 0.5, 0.75, 1.0};
        linear_speed_scale_ = speed_levels_[current_speed_index_];

        _declare_or_get_param<int>(dof_, "dof", dof_);
        _declare_or_get_param<int>(ros_queue_size_, "ros_queue_size", ros_queue_size_);
        _declare_or_get_param<int>(joystick_type_, "joystick_type", joystick_type_);
        _declare_or_get_param<std::string>(joy_topic_, "joy_topic", joy_topic_);
        _declare_or_get_param<std::string>(cartesian_command_in_topic_, "moveit_servo.cartesian_command_in_topic", cartesian_command_in_topic_);
        _declare_or_get_param<std::string>(joint_command_in_topic_, "moveit_servo.joint_command_in_topic", joint_command_in_topic_);
        _declare_or_get_param<std::string>(robot_link_command_frame_, "moveit_servo.robot_link_command_frame", robot_link_command_frame_);
        _declare_or_get_param<std::string>(ee_frame_name_, "moveit_servo.ee_frame_name", ee_frame_name_);
        _declare_or_get_param<std::string>(planning_frame_, "moveit_servo.planning_frame", planning_frame_);

        if (cartesian_command_in_topic_.rfind("~/", 0) == 0) { cartesian_command_in_topic_ = "/servo_server/" + cartesian_command_in_topic_.substr(2); }
        if (joint_command_in_topic_.rfind("~/", 0) == 0) { joint_command_in_topic_ = "/servo_server/" + joint_command_in_topic_.substr(2); }

        joy_sub_ = this->create_subscription<sensor_msgs::msg::Joy>(joy_topic_, ros_queue_size_, std::bind(&JoyToServoPub::_joy_callback, this, std::placeholders::_1));
        twist_pub_ = this->create_publisher<geometry_msgs::msg::TwistStamped>(cartesian_command_in_topic_, ros_queue_size_);
        joint_pub_ = this->create_publisher<control_msgs::msg::JointJog>(joint_command_in_topic_, ros_queue_size_);
	speed_pub_ = this->create_publisher<std_msgs::msg::Float32>("/ui/robot_control/current_speed", rclcpp::QoS(1).transient_local()); 
        button_press_pub_ = this->create_publisher<std_msgs::msg::String>("/ui/joy_button_presses", 10);

        servo_start_client_ = this->create_client<std_srvs::srv::Trigger>("/servo_server/start_servo");
        servo_start_client_->wait_for_service(std::chrono::seconds(1));
        servo_start_client_->async_send_request(std::make_shared<std_srvs::srv::Trigger::Request>());
        servo_stop_client_ = this->create_client<std_srvs::srv::Trigger>("/servo_server/stop_servo");
        _open_gripper_client_ = this->create_client<xarm_msgs::srv::Call>("/ufactory/open_lite6_gripper");
        _close_gripper_client_ = this->create_client<xarm_msgs::srv::Call>("/ufactory/close_lite6_gripper");
        _get_position_client_ = this->create_client<xarm_msgs::srv::GetFloat32List>("/ufactory/get_position");
        execute_sequence_y_client_ = this->create_client<std_srvs::srv::Trigger>("/execute_motion_sequence_Y");
        execute_sequence_y_client_->wait_for_service(std::chrono::seconds(1));
        execute_sequence_b_client_ = this->create_client<std_srvs::srv::Trigger>("/execute_motion_sequence_B");
        execute_sequence_b_client_->wait_for_service(std::chrono::seconds(1));
        execute_sequence_x_client_ = this->create_client<std_srvs::srv::Trigger>("/execute_motion_sequence_X");
        execute_sequence_x_client_->wait_for_service(std::chrono::seconds(1));

        this->whisper_action_client_ = rclcpp_action::create_client<Inference>(this, "/whisper/inference");
        if (!this->whisper_action_client_->wait_for_action_server(std::chrono::seconds(5))) {
            RCLCPP_ERROR(this->get_logger(), "Whisper Action Server ist nach 5s nicht erreichbar. X-Taste hat keine Funktion.");
        } else {
            RCLCPP_INFO(this->get_logger(), "Whisper Action Server gefunden. X-Taste ist bereit.");
        }

        prev_buttons_.resize(11, 0);

        auto speed_msg = std::make_unique<std_msgs::msg::Float32>();
        speed_msg->data = linear_speed_scale_;
        speed_pub_->publish(std::move(speed_msg));
        
        // Timer für das Timeout-Handling (wird beim Start der Aufnahme erstellt und gestartet/gestoppt)
        // Erstellen des Timers, aber noch nicht starten (Periode 5s)
        timeout_timer_ = this->create_wall_timer(
            std::chrono::seconds(5),
            std::bind(&JoyToServoPub::_timeout_timer_callback, this)
        );
        timeout_timer_->cancel(); // Timer ist initial gestoppt
    }
    
    // NEUER CALLBACK FÜR DEN TIMER
    void JoyToServoPub::_timeout_timer_callback()
    {
        // Dieser Callback wird nur ausgelöst, wenn der Action Server NICHT rechtzeitig mit einem Result geantwortet hat.
        // Wenn die Action noch läuft (is_whisper_listening_), dann ist dies der echte Timeout.
        if (this->is_whisper_listening_) {
            RCLCPP_INFO(this->get_logger(), "Timer: Whisper Aufnahme hat Timeout erreicht. Sende Abbruch-Request.");
            
            // Logische Deaktivierung des Zuhör-Status
            this->is_whisper_listening_ = false;
            this->is_transitioning_ = true; // Setzen auf true, um doppelte Joystickeingaben zu blocken

            // Sende die Timeout-Meldung, da dies der ECHTE Timeout ist
            auto btn_msg = std::make_unique<std_msgs::msg::String>();
            btn_msg->data = "Mikrofon - [Status]: ❌ AUS (Timeout)";
            button_press_pub_->publish(std::move(btn_msg));

            // Versuche, das Ziel beim Action Server abzubrechen, um Ressourcen freizugeben.
            // Das Result des Cancel-Requests wird IGNORIERT, da die Meldung bereits gesendet wurde.
            this->whisper_action_client_->async_cancel_goal(
                this->current_whisper_goal_handle_
            );
        }
        
        // Timer abbrechen, da seine Aufgabe erledigt ist
        timeout_timer_->cancel();
    }


    void JoyToServoPub::_toggle_whisper_listening()
    {
        if (!this->whisper_action_client_->action_server_is_ready()) {
            RCLCPP_ERROR(this->get_logger(), "Whisper Action Server ist nicht bereit.");
            is_transitioning_ = false;
            // Sende Deaktivierungs-Nachricht bei Fehler
            auto btn_msg = std::make_unique<std_msgs::msg::String>();
            btn_msg->data = "Mikrofon - [Status]: ❌ AUS (Serverfehler)";
            button_press_pub_->publish(std::move(btn_msg));
            return;
        }

        if (this->is_whisper_listening_)
        {
            RCLCPP_INFO(this->get_logger(), "X-Taste: Stoppe Whisper-Aufnahme (Cancel Goal)...");
            
            // Sende Deaktivierungs-Nachricht sofort bei manuellem Stopp (X-Taste zum zweiten Mal gedrückt)
            auto btn_msg = std::make_unique<std_msgs::msg::String>();
            btn_msg->data = "Mikrofon - [Status]: ❌ AUS";
            button_press_pub_->publish(std::move(btn_msg));
            
            // Beim manuellen Stop den Timeout-Timer stoppen!
            timeout_timer_->cancel(); 
            
            // Sende den Cancel-Request
            this->whisper_action_client_->async_cancel_goal(
                this->current_whisper_goal_handle_,
                std::bind(&JoyToServoPub::_cancel_response_callback, this, std::placeholders::_1));
        }
        else
        {
            RCLCPP_INFO(this->get_logger(), "X-Taste: Starte Whisper-Aufnahme (Send Goal)...");

            auto goal_msg = Inference::Goal();
            // Die Timeout-Dauer bleibt 5s, um den Action Server zum Beenden zu zwingen.
            goal_msg.max_duration.sec = 5; 

            auto send_goal_options = rclcpp_action::Client<Inference>::SendGoalOptions();
            send_goal_options.goal_response_callback = std::bind(&JoyToServoPub::_goal_response_callback, this, std::placeholders::_1);
            send_goal_options.feedback_callback = std::bind(&JoyToServoPub::_feedback_callback, this, std::placeholders::_1, std::placeholders::_2);
            send_goal_options.result_callback = std::bind(&JoyToServoPub::_result_callback, this, std::placeholders::_1);

            this->whisper_action_client_->async_send_goal(goal_msg, send_goal_options);
        }
    }

    void JoyToServoPub::_goal_response_callback(const GoalHandleInference::SharedPtr & goal_handle)
    {
        is_transitioning_ = false;
        auto btn_msg = std::make_unique<std_msgs::msg::String>();

        if (!goal_handle) {
            RCLCPP_ERROR(this->get_logger(), "Whisper-Goal wurde vom Server abgelehnt.");
            is_whisper_listening_ = false;
            // Meldung: Fehler beim Start
            btn_msg->data = "Mikrofon - [Status]: ❌ AUS (Fehler beim Start)";
        } else {
            RCLCPP_INFO(this->get_logger(), "Whisper-Goal akzeptiert. Lausche... (X-Taste zum Stoppen)");
            current_whisper_goal_handle_ = goal_handle;
            is_whisper_listening_ = true;
            // Meldung: Aktiviert und lauscht
            btn_msg->data = "Mikrofon - [Status]: ✅ EIN - lauscht (5sek)";
            
            // WICHTIG: Timer starten, um den manuellen Timeout zu steuern
            timeout_timer_->reset();
        }
        button_press_pub_->publish(std::move(btn_msg));
    }

    void JoyToServoPub::_feedback_callback(GoalHandleInference::SharedPtr, const std::shared_ptr<const Inference::Feedback> /*feedback*/)
    {
    }

    void JoyToServoPub::_result_callback(const GoalHandleInference::WrappedResult & result)
    {
        // Der Action Server hat geantwortet. Wir stoppen JEDEN möglichen Timer und setzen den Zustand zurück.
        timeout_timer_->cancel(); 
        
        is_transitioning_ = false;
        is_whisper_listening_ = false; // Wird hier IMMER auf false gesetzt, da die Action beendet ist
        current_whisper_goal_handle_ = nullptr;

        auto btn_msg = std::make_unique<std_msgs::msg::String>();

        switch (result.code) {
            case rclcpp_action::ResultCode::SUCCEEDED:
                RCLCPP_INFO(this->get_logger(), "Whisper Aufnahme beendet (SUCCEEDED).");
                // KEINE NACHRICHT SENDEN! Der Timer hat dies übernommen, ODER es war ein Result ohne Timeout.
                // Wenn es ein Result ohne Timeout war, brauchen wir keine Statusmeldung, da die Transkription folgt.
                break;
            case rclcpp_action::ResultCode::ABORTED:
                RCLCPP_ERROR(this->get_logger(), "Whisper-Goal wurde abgebrochen.");
                // Meldung: Deaktiviert nach Fehler
                btn_msg->data = "Mikrofon - [Status]: ❌ AUS (Fehler)";
                button_press_pub_->publish(std::move(btn_msg));
                break;
            case rclcpp_action::ResultCode::CANCELED:
                RCLCPP_INFO(this->get_logger(), "Whisper-Goal wurde erfolgreich gestoppt.");
                // KEINE NACHRICHT SENDEN! (Die Meldung wurde bereits in _toggle_whisper_listening gesendet)
                break;
            default:
                RCLCPP_ERROR(this->get_logger(), "Unbekannter Result-Code für Whisper-Goal.");
                btn_msg->data = "Mikrofon - [Status]: ❌ AUS";
                button_press_pub_->publish(std::move(btn_msg));
                break;
        }
    }

    void JoyToServoPub::_cancel_response_callback(rclcpp_action::Client<Inference>::CancelResponse::SharedPtr result)
    {
        if(result->return_code == action_msgs::srv::CancelGoal::Response::ERROR_NONE) {
            RCLCPP_INFO(this->get_logger(), "Stop-Anfrage vom Whisper-Server erfolgreich verarbeitet.");
        } else {
            RCLCPP_ERROR(this->get_logger(), "Stop-Anfrage vom Whisper-Server konnte nicht verarbeitet werden.");
            is_transitioning_ = false;
        }
    }

    void JoyToServoPub::_filter_twist_msg(std::unique_ptr<geometry_msgs::msg::TwistStamped> &twist, double val)
    {
        if (abs(twist->twist.linear.x) < val) twist->twist.linear.x = 0;
        if (abs(twist->twist.linear.y) < val) twist->twist.linear.y = 0;
        if (abs(twist->twist.linear.z) < val) twist->twist.linear.z = 0;
        if (abs(twist->twist.angular.x) < val) twist->twist.angular.x = 0;
        if (abs(twist->twist.angular.y) < val) twist->twist.angular.y = 0;
        if (abs(twist->twist.angular.z) < val) twist->twist.angular.z = 0;
    }

    template <typename T>
    void JoyToServoPub::_declare_or_get_param(T &output_value, const std::string &param_name, const T default_value)
    {
        try {
            if (this->has_parameter(param_name)) {
                this->get_parameter<T>(param_name, output_value);
            } else {
                output_value = this->declare_parameter<T>(param_name, default_value);
            }
        } catch (const rclcpp::exceptions::InvalidParameterTypeException &e) {
            RCLCPP_WARN_STREAM(this->get_logger(), "InvalidParameterTypeException(" << param_name << "): " << e.what());
            RCLCPP_ERROR_STREAM(this->get_logger(), "Error: beim Abrufen von '" << param_name << "', Typ in YAML-Datei checken");
            throw e;
        }
        RCLCPP_INFO_STREAM(this->get_logger(), "Parameter found - " << param_name << ": " << output_value);
    }

    bool JoyToServoPub::_convert_gamepad_joy_to_cmd(
        const std::vector<float> &axes,
        const std::vector<int> &buttons,
        std::unique_ptr<geometry_msgs::msg::TwistStamped> &twist,
        std::unique_ptr<control_msgs::msg::JointJog> &joint
    )
    {
        float current_cross_key_fb = axes[xbox_CROSS_KEY_FB];
        bool speed_changed = false;

        if (current_cross_key_fb > 0.5 && prev_cross_key_fb_state_ < 0.5) {
            if (current_speed_index_ < static_cast<int>(speed_levels_.size() - 1)) {
                current_speed_index_++;
                speed_changed = true;
            }
        }
        else if (current_cross_key_fb < -0.5 && prev_cross_key_fb_state_ > -0.5) {
            if (current_speed_index_ > 0) {
                current_speed_index_--;
                speed_changed = true;
            }
        }

        if (speed_changed) {
            // Änderung vorgenommen: Neuen Wert setzen und zuerst auf /ui/robot_control/current_speed publizieren.
            linear_speed_scale_ = speed_levels_[current_speed_index_];
            
            // Veröffentlichung des NEUEN Geschwindigkeitswerts (wie gewünscht vor der Log-Nachricht)
            auto speed_msg = std::make_unique<std_msgs::msg::Float32>();
            speed_msg->data = linear_speed_scale_;
            speed_pub_->publish(std::move(speed_msg));
            
            // Log-Nachricht für die UI
            auto speed_log_msg = std::make_unique<std_msgs::msg::String>();
            std::stringstream ss;
            ss << "Geschwindgkeit auf Stufe: " << current_speed_index_ + 1;
            speed_log_msg->data = ss.str();
            button_press_pub_->publish(std::move(speed_log_msg));

            RCLCPP_INFO(this->get_logger(), "Geschwindigkeit gesetzt auf Stufe %d: %.3f", current_speed_index_ + 1, linear_speed_scale_);
        }
        prev_cross_key_fb_state_ = current_cross_key_fb;

        if (buttons[xbox_BTN_BACK] == 1 && prev_buttons_[xbox_BTN_BACK] == 0 && planning_frame_ == ee_frame_name_) {
            planning_frame_ = robot_link_command_frame_;
            RCLCPP_INFO(this->get_logger(), "Referenzrahmen: link_base");
        }
        else if (buttons[xbox_BTN_START] == 1 && prev_buttons_[xbox_BTN_START] == 0 && planning_frame_ == robot_link_command_frame_) {
            planning_frame_ = ee_frame_name_;
            RCLCPP_INFO(this->get_logger(), "Referenzrahmen: link_eef");
        }
	// wird in dieser Arbeit auf 0 gesetzt, da der User nicht den Joint bewegen soll!
        if (axes[xbox_CROSS_KEY_LR]) {
            joint->joint_names.push_back("joint1");
            joint->velocities.push_back(axes[xbox_CROSS_KEY_LR] * 0.0);
            return false;
        }

        const double JOYSTICK_DEADZONE = 0.1;

        geometry_msgs::msg::Twist target_twist;
        target_twist.linear.x = axes[xbox_LEFT_STICK_FB] * linear_speed_scale_;
        target_twist.linear.y = axes[xbox_LEFT_STICK_LR] * linear_speed_scale_;
        float zAchse = (axes[xbox_LEFT_TRIGGER] - axes[xbox_RIGHT_TRIGGER]);
        target_twist.linear.z = std::clamp(zAchse, -1.0f, 1.0f) * -linear_speed_scale_;
        target_twist.angular.z = static_cast<double>(buttons[xbox_BTN_LB] - buttons[xbox_BTN_RB]);

        if (std::abs(axes[xbox_LEFT_STICK_FB]) > JOYSTICK_DEADZONE) {
            smoothed_twist_.linear.x += (target_twist.linear.x - smoothed_twist_.linear.x) * smoothing_factor_;
        } else {
            smoothed_twist_.linear.x = 0.0;
        }
        if (std::abs(axes[xbox_LEFT_STICK_LR]) > JOYSTICK_DEADZONE) {
            smoothed_twist_.linear.y += (target_twist.linear.y - smoothed_twist_.linear.y) * smoothing_factor_;
        } else {
            smoothed_twist_.linear.y = 0.0;
        }
        if (std::abs(zAchse) > JOYSTICK_DEADZONE) {
             smoothed_twist_.linear.z += (target_twist.linear.z - smoothed_twist_.linear.z) * smoothing_factor_;
        } else {
            smoothed_twist_.linear.z = 0.0;
        }
        if (buttons[xbox_BTN_LB] || buttons[xbox_BTN_RB]) {
             smoothed_twist_.angular.z += (target_twist.angular.z - smoothed_twist_.angular.z) * smoothing_factor_;
        } else {
            smoothed_twist_.angular.z = 0.0;
        }

        smoothed_twist_.angular.x = 0;
        smoothed_twist_.angular.y = 0;

        twist->twist = smoothed_twist_;

        return true;
    }

    void JoyToServoPub::_joy_callback(const sensor_msgs::msg::Joy::SharedPtr msg)
    {
        auto twist_msg = std::make_unique<geometry_msgs::msg::TwistStamped>();
        auto joint_msg = std::make_unique<control_msgs::msg::JointJog>();

        if (dof_ == 7 && initialized_status_) {
            initialized_status_ -= 1;
            joint_msg->joint_names.push_back("joint1");
            joint_msg->velocities.push_back(initialized_status_ > 0 ? 0.01 : 0);
            joint_msg->header.stamp = this->now();
            joint_msg->header.frame_id = "joint1";
            joint_pub_->publish(std::move(joint_msg));
            for (size_t i = 0; i < msg->buttons.size(); ++i) {
                if (i < prev_buttons_.size()) {
                    prev_buttons_[i] = msg->buttons[i];
                }
            }
            return;
        }

        bool pub_twist = false;
        if (msg->axes.size() >= 8 && msg->buttons.size() >= 11) {
            pub_twist = _convert_gamepad_joy_to_cmd(msg->axes, msg->buttons, twist_msg, joint_msg);
        } else {
            for (size_t i = 0; i < msg->buttons.size(); ++i) {
                if (i < prev_buttons_.size()) {
                    prev_buttons_[i] = msg->buttons[i];
                }
            }
            return;
        }

        if (msg->buttons[xbox_BTN_A] == 1 && prev_buttons_[xbox_BTN_A] == 0) {
            if (vacuum_gripper_state_) {
                _close_gripper_client_->async_send_request(std::make_shared<xarm_msgs::srv::Call::Request>());
                RCLCPP_INFO(this->get_logger(), "[Service Call: close_gripper (Vakuum aus)!]");
                vacuum_gripper_state_ = false;
            } else {
                _open_gripper_client_->async_send_request(std::make_shared<xarm_msgs::srv::Call::Request>());
                RCLCPP_INFO(this->get_logger(), "[Service Call: open_gripper (Vakuum an)!]");
                vacuum_gripper_state_ = true;
            }
            auto btn_msg = std::make_unique<std_msgs::msg::String>();
            btn_msg->data = "Greifer  - [Status]: " + std::string(vacuum_gripper_state_ ? "✅ EIN" : "❌ AUS");
            button_press_pub_->publish(std::move(btn_msg));
        }

        if (msg->buttons[xbox_BTN_Y] == 1 && prev_buttons_[xbox_BTN_Y] == 0) {
            RCLCPP_INFO(this->get_logger(), "[Y]: call '/execute_motion_sequence_Y' service...");
            execute_sequence_y_client_->async_send_request(std::make_shared<std_srvs::srv::Trigger::Request>());

            auto btn_msg = std::make_unique<std_msgs::msg::String>();
            btn_msg->data = "Roboter bewegt sich zur Initialposition 🏠";
            button_press_pub_->publish(std::move(btn_msg));
        }

        if (msg->buttons[xbox_BTN_X] == 1 && prev_buttons_[xbox_BTN_X] == 0)
        {
            auto btn_msg = std::make_unique<std_msgs::msg::String>();

            if (is_transitioning_)
            {
                // Unverändertes Verhalten bei Busy-Zustand
                btn_msg->data = "BEFEHL IGNORIERT (System beschäftigt)";
                RCLCPP_WARN(this->get_logger(), "Whisper-Status wechselt gerade, Befehl ignoriert.");
                button_press_pub_->publish(std::move(btn_msg));
            }
            else
            {
                is_transitioning_ = true;
                _toggle_whisper_listening();
            }
        }

        if (pub_twist) {
            _filter_twist_msg(twist_msg, 0.001);
            twist_msg->header.frame_id = planning_frame_;
            twist_msg->header.stamp = this->now();
            twist_pub_->publish(std::move(twist_msg));
        } else {
            joint_msg->header.stamp = this->now();
            joint_msg->header.frame_id = "joint";
            joint_pub_->publish(std::move(joint_msg));
        }

        for (size_t i = 0; i < msg->buttons.size(); ++i) {
            if (i < prev_buttons_.size()) {
                prev_buttons_[i] = msg->buttons[i];
            }
        }
    }
} // namespace xarm_moveit_servo

#include <rclcpp_components/register_node_macro.hpp>
RCLCPP_COMPONENTS_REGISTER_NODE(xarm_moveit_servo::JoyToServoPub)
