# xArm ROS 2 Extended Workspace (ROS2 Humble) **[IN DEV]**

This repository is a continuously evolving research and evaluation platform for multimodal teleoperation and Human-Computer Interaction (HCI). <br>
> [!IMPORTANT]
> **Core Prerequisite:** This repository is an *extension workspace*. It is built entirely on top of the official [xarm_ros2 repository (Branch: humble)](https://github.com/xArm-Developer/xarm_ros2/tree/humble) from UFactory. The official repository, its structure, and all of its system dependencies form the mandatory foundational baseline for this software!

<p align="center">
 <img src="_imgs/robotsystem.jpg" width="90%" alt="xArm Extended Workspace in Action">
</p>

## Table of Contents
1. [📋 Project Overview](#chapter-1)
2. [🔬 Architecture & Guiding Principles](#chapter-2)
   - [2.1 Operating Modes: FAKE vs. REAL (Hardware Interfaces)](#subchapter-2-1)
   - [2.2 The System Concept: An Integrated Development, Evaluation, and Validation Platform](#subchapter-2-2)
3. [📊 Monitoring: Dashboard & Workspace Analyzer](#chapter-3)
   - [3.1 Workspace Analyzer Backend (`workspace_analyzer.py`)](#subchapter-3-1)
   - [3.2 Frontend (`dashboard_index.html`)](#subchapter-3-2)
   - [3.3 Launch Commands for UI Components](#subchapter-3-3)
4. [🕹️ Multimodal Technologies & Interaction Concepts](#chapter-4)
   - [4.1 Robot Control Methods (Inputs)](#subchapter-4-1)
   - [4.2 Perception & Assistance](#subchapter-4-2)
   - [4.3 Coordinate Transformation & Calibration](#subchapter-4-3)
   - [4.4 User Interfaces (UI/GUI)](#subchapter-4-4)
5. [⚙️ Core Features & ROS 2 Nodes](#chapter-5)
   - [🎮 5.1 Feature: Gamepad Teleoperation & Hard Collision Protection](#subchapter-5-1)
   - [🟢 5.2 Feature: Autonomous Grasping & 3D Object Detection (YOLO / ZED)](#subchapter-5-2)
   - [🗣️ 5.3 Feature: Multimodal Interaction (Voice & Gaze Control)](#subchapter-5-3)
   - [🖥️ 5.4 Feature: Graphical Control & Visual Feedback](#subchapter-5-4)
   - [🤖 5.5 Feature: Complex Trajectories & Task Coordination](#subchapter-5-5)
   - [⚠️ 5.6 Deprecated Modules](#subchapter-5-6)
6. [🎮 Gamepad Control — Deep Dive](#chapter-6)
   - [6.1 Pipeline Architecture](#subchapter-6-1)
   - [6.2 `checker.py` — Collision Guard (Python Node)](#subchapter-6-2)
   - [6.3 `xarm_joystick_input.cpp` — Motion Controller (C++ Node)](#subchapter-6-3)
7. [📦 Dependencies & Requirements](#chapter-7)
8. [🚀 Execution: How to Run the System](#chapter-8)
   - [8.1 Step 1: Hardware Preparation](#subchapter-8-1)
   - [8.2 Step 2: Launch the System (ROS 2 Nexus)](#subchapter-8-2)
   - [8.3 Step 3: Start Nodes via GUI](#subchapter-8-3)
   - [8.4 Network & Port Architecture](#subchapter-8-4)
   - [8.5 Distributed Control (Remote / Operator Station)](#subchapter-8-5)
   - [8.6 DDS Multicast Storm Prevention (Critical)](#subchapter-8-6)
   - [8.7 Launcher Configuration (`launcher_config.json`)](#subchapter-8-7)
   - [8.8 DDS Multicast Storm & Loopback Discovery (Critical)](#subchapter-8-8)
   - [8.9 CycloneDDS UDP Buffer Overflows (Point Cloud Lag)](#subchapter-8-9)
9. [🗂️ Repository Structure](#chapter-9)

---

## <a id="chapter-1"></a> 1. 📋 Project Overview

### Concept: An Integrated, Multimodal Teleoperation Platform
The primary goal of this project is the development and implementation of a modular control and interaction platform for the UFactory xArm Lite 6 robot arm. The system consolidates heterogeneous, multimodal input methods into a centralized software environment and places a consistent focus on maximized usability and intuitive operation. The system handles the calculation of complex robot movements in the background. This creates a simple interface that directly translates the user's intentions into robotic actions.

### Motivation: Assistance, Inclusion, and Participation in the Context of Industry 5.0
In practice, classical methods of teleoperation and robot control are highly error-prone and demand immense cognitive fine control and technical expertise from the operator. These high barriers exclude many people from direct usage. In the spirit of the Industry 5.0 guiding principles—which place the human, sustainability, and resilience at the center of industrial production—this project starts exactly here:

* **Lowering Technical Barriers:** Reducing entry thresholds by shifting from low-level joint coordination toward intuitive high-level commands.
* **Promoting Inclusion:** Creating technological conditions to enable productive and equal participation in the modern workplace, even for people with different physical or cognitive capabilities.
* **Human-Machine Synergy:** Establishing the robot as an assistive tool that relieves the human instead of replacing them.

### Operating Principle: Shared Control and the "Human-in-the-Loop" Paradigm
The technological foundation of the platform is based on a dynamic *shared control* approach, where human and machine interact cooperatively. The user remains permanently integrated into the control loop as a supervisor (*Human-in-the-Loop*), but controls the system through a tiered, complementary interaction pattern:

* **Intuitive High-Level Commands:** Initiating global actions or target specifications via natural modalities such as gaze control (eye tracking) or voice commands.
* **Precise Low-Level Corrections:** Seamless, low-latency switching to manual input devices (e.g., gamepad/MoveIt Servo) for sensitive adjustments in the workspace.
* **Context-Sensitive Assistance:** Autonomous path planning and collision-free trajectory calculation in the background to actively safeguard the operator during execution.

### Objective: A Valid, Cost-Effective Proof-of-Concept
The project presents itself as a fully functional, reproducible, and economically affordable Proof-of-Concept (PoC) for academic research landscapes and practice-oriented inclusion projects. The open architecture serves as a standardized evaluation platform on which novel assistive robotics systems can be developed, tested, and empirically validated under realistic conditions.

### Evaluation Logic & Guidelines: From Research to Industrial Practice
A key core and innovative character of the project lies in the scientific analysis of interaction quality. The system serves not only as a technical demonstrator, but as a tool to generate transferable knowledge:

* **Development of an Evaluation Logic:** Systematic capture and measurement of usability, cognitive load, and system performance for quantitative assessment of the human-robot interface.
* **Derivation of Action Recommendations:** Formulation of standardized guidelines that serve companies as a strategic guide during the introduction of modern robot systems.
* **Answering the Transformation Question:** Concrete practical assistance on the core question: *“How can processes and workplaces be structured to measurably meet the human-centered requirements of Industry 5.0?”*
* **Service Potential:** The resulting frameworks and guidelines have the potential to be provided as a validated, monetizable consulting and service offering for industry, accompanying digital and demographic changes in production.

## <a id="chapter-2"></a> 2. 🔬 Architecture & Guiding Principles

### <a id="subchapter-2-1"></a> 2.1 Operating Modes: FAKE vs. REAL (Hardware Interfaces)
The platform strictly distinguishes between two operating modes for the robot arm. This distinction refers **exclusively to the `ros2_control` hardware interface** and is independent of sensors (like the camera or YOLO, which can run live in both modes):

* **FAKE (Simulation Mode):** The robot runs via the `mock_components/GenericSystem` (or FakeSystem) hardware interface within `ros2_control`. There is no physical controller connection. Commands to the `/lite6_traj_controller` or `/servo_server` are purely virtually rendered in RViz2 by mirroring the joint states. Proprietary UFactory API calls (like Mode/State switches) intentionally lead nowhere in this mode or are bypassed in software.
* **REAL (Hardware Mode):** The `ros2_control` framework integrates the real `xarm_api` hardware interface, which communicates directly via TCP/IP with the physical controller of the xArm Lite 6. In this mode, hardware limits, physical safety stops, and the exclusive switching of proprietary xArm hardware modes (e.g., Mode 0 for pose control vs. Mode 1 for Servo/jogging) take effect via the UFactory API.

### <a id="subchapter-2-2"></a> 2.2 The System Concept: An Integrated Development, Evaluation, and Validation Platform
The core objective of the project is the realization of a modular, platform-based software architecture for multimodal teleoperation and AI-supported assistive robotics. The system acts as a central, software-side integration node (middleware level) that unifies heterogeneous subsystems into a consistent runtime environment. Through a distributed server-client network (multi-PC setup) and the software-side coupling to a real-time capable Digital Twin (NVIDIA Isaac Sim), the platform serves as both a flexible development environment and a standardized, replicable test environment. The project is explicitly designed as a closed loop of development and empirical validation:

* **Sensors & Perception:** Integration of depth cameras (e.g., object detection via YOLO, marker tracking) and tactile or physiological sensors for state estimation.
* **Multimodal Control:** Parallel integration of various input channels such as eye-tracking systems for gaze target acquisition, voice control (e.g., via OpenAI Whisper), and classic hardware controllers (gamepads, 3D mice).
* **Cognitive Robotics:** Integration of modern Vision-Language-Action (VLA) models to translate highly abstract textual and visual commands directly into robotic action sequences.
* **Integrated Data Acquisition:** Time-synchronized recording of technical performance parameters and human interaction data via a central logging infrastructure during system use.

### Human-Centered Automation
The system architecture places the human operator at the center of the interaction design. The system is designed to allow users to cognitively grasp the current state of automation throughout operation and to anticipate subsequent system actions. This transparency dismantles algorithmic black-box structures, bringing significant advantages for practical application:

* **Cognitive Transparency:** Consistent comprehensibility of system states, especially during the parallel processing of gaze patterns and sensory feedback.
* **Informed Intervention:** Empowering the operator to make safe and targeted interventions in critical or unforeseen interaction situations.
* **Calibrated Trust in Automation:** Creating a reliable technological basis for systematically building *trust in automation*, which is evaluated through user studies.

### Shared Control & Cognitive Relief
A key feature of the software architecture is the implementation of *shared control* paradigms for cooperative task execution. The platform enables a seamless, low-latency transfer of control authority between manual guidance, gaze-controlled interactions, and AI-assisted, semi-automated assistance functions. The context-dependent distribution of control shares targets the following core aspects:

* **Seamless Control Handover:** Low-latency switching between manual input (e.g., via MoveIt Servo / gamepad) and autonomous system actions (e.g., gaze-based grasping).
* **Minimizing Mental Workload:** Targeted reduction of the user's mental workload during complex or long-lasting manipulation tasks.
* **Autonomous Error Compensation:** Independent mitigation of error-prone low-level corrections by the system, thereby freeing up cognitive resources for high-level process monitoring.
* **Empirical Validation:** Ongoing verification of actual cognitive relief throughout the project using standardized psychometric methods.

### HCI & Usability Focus & Empirical Evaluation
The design of the central control interface (GUI) follows established principles of Human-Computer Interaction (HCI). Interaction patterns shift from the complex coordination of individual degrees of freedom or manually invoking distributed terminal processes toward intention-based task completion. An integral part of the project is conducting systematic user studies to evaluate these multimodal interfaces:

* **Intention-Based Control:** Translating abstract action intents (via voice, gaze target, or high-level controller) into precise kinematic trajectories.
* **Standardized Usability Metrics:** Collection of subjective usability via established questionnaires such as the *System Usability Scale* (SUS).
* **Objective Performance Parameters:** Measuring quantitative factors such as *task completion time*, error rates, and specific gaze paths.
* **Load Analysis:** Empirical verification of the participants' cognitive load using the *NASA-TLX* index for iterative system optimization.

### Reproducible & Open Source
To ensure scientific validity, the project is designed as an open-source architecture. Disclosing the complete codebase ensures the methodological transparency of all algorithms, configurations, and data flows. For the scientific community, this yields key added value:

* **Methodological Transparency:** Full visibility of all underlying algorithms, URDF models, and MoveIt configurations.
* **Exact Replication:** Enabling straightforward secondary investigations by independent research groups under identical conditions.
* **Statistical Verifiability:** Traceability and validation of complex, recorded sensor data streams and control inputs.
* **Standardized Benchmark:** Establishing the platform as a reliable baseline for comparative studies in the field of assistive and inclusive robotics.

### Cost-Effective Hardware
The system configuration is primarily based on economically affordable, commercially available off-the-shelf components (COTS), without compromising the required precision and functional reliability. This approach pursues clear strategic goals:

* **Democratizing Access:** Reducing investment and financial barriers when entering modern, multimodally controlled robotics technologies.
* **Target Audience Transfer:** Facilitating technology transfer into inclusive projects, educational institutions, and smaller research facilities (e.g., via the UFactory xArm Lite 6 and consumer controllers).
* **Validating Reliability:** Targeted scientific evaluation of the extent to which cost-effective hardware represents a valid research platform in direct comparison to high-priced industrial systems.

### Modular & Industry Standard
The software-side infrastructure is modularly encapsulated and fully integrated into the ROS 2 Humble middleware framework. The native use of standardized communication primitives ensures interoperability with industrial ecosystems. The consistent modular principle offers crucial architectural advantages:

* **Native ROS 2 Communication:** Full compatibility with established ecosystems (like MoveIt 2) and modern sensor SDKs via nodes, topics, services, and actions.
* **Isolated Subsystem Encapsulation:** Straightforward replacement or extension of individual modules—such as VLA pipelines for intent recognition or specific eye-tracking drivers.
* **Future-Proofing & Portability:** Low-maintenance software structure allowing easy migration to future ROS 2 LTS distributions without modifying the overall platform.

---

## <a id="chapter-3"></a> 3. 📊 Monitoring: Dashboard & Workspace Analyzer

Once the nodes are launched via ROS 2 Nexus, the live state of the system can be monitored using the **ROS2 Core Dashboard**. This is a web-based real-time UI, which fuses static source code analysis with live ROS 2 network telemetry into a unified monitoring interface.

### <a id="subchapter-3-1"></a> 3.1 Workspace Analyzer Backend (`workspace_analyzer.py`)
The Workspace Analyzer Backend is a ROS 2 node that performs execution-free, regex-based static code analysis. It has been highly modularized into three core files: `workspace_analyzer.py` (handles ROS Pub/Sub), `workspace_parser.py` (executes the regex analysis), and `system_utils.py` (parses environment variables). It extracts node names, publishers, subscribers, services, actions, and package dependencies. These structured JSON metadata are continuously published to `/dashboard/workspace_metadata` via a 10-second timer cycle. It also publishes file contents via `/dashboard/file_content` and ROS topic activity via `/dashboard/topic_activity`. Additionally, it reads environment variables (ROS Distro, Domain ID, DDS middleware, Localhost mode) from `~/.bashrc` and provides them as live status badges.

> **Note on `workspace_analyzer.py`:** This is **not** a network server, but a standard ROS 2 node. The Dashboard accesses its published topics via the ROS Bridge (Port 9090).

### <a id="subchapter-3-2"></a> 3.2 Frontend (`dashboard_index.html`)
Connects to the ROS network via WebSocket (`rosbridge_server` on port 9090). The frontend logic has been strictly modularized into 8 specialized JavaScript files (e.g., `dashboard_script_nodes.js`, `dashboard_script_graph.js`, `dashboard_script_ros.js`) for maintainability. It visually matches statically analyzed nodes against the currently running nodes, displays real-time topic frequencies (Hz), and enables direct execution of system scripts from the browser in a clean, single-column reference view. The UI employs a modern Glassmorphism design aesthetic and performs recursive JSON parsing to cleanly format nested ROS message payloads. The sidebar provides at-a-glance status information including connection health, robot availability, and the active ROS 2 environment configuration.

![ROS2 Core - Dashboard](_imgs/dashboard_nodes.png)

### <a id="subchapter-3-3"></a> 3.3 Launch Commands for UI Components
*Launch these components via ROS 2 Nexus, or manually via terminal:*
* **Workspace Analyzer Backend:** `python3 src/dashboard_monitoring/workspace_analyzer.py`
* **Web Server:** `python3 -m http.server 8080 -d src/dashboard_monitoring`
* *(Dashboard accessible at: `http://localhost:8080/dashboard_index.html`)*

---

## <a id="chapter-4"></a> 4. 🕹️ Multimodal Technologies & Interaction Concepts

### <a id="subchapter-4-1"></a> 4.1 Robot Control Methods (Inputs)
**Gamepad Teleoperation:** <br> 
* Low-latency, continuous fine control using Xbox One Elite Series 2 Controller (incl. haptic feedback - vibration on collision risk).

**Voice Control:** <br> 
* Local speech processing (Whisper AI) for semantic, intention-based control via microphone.

**Eye-Tracking** (in progress...): <br> 
* Robot control and UI interaction (gaze tracking) via Tobii Pro Glasses 3.

**Gesture Control** (in progress...): <br> 
* Touchless, intuitive hand and finger recognition for direct spatial manipulation and gesture control using Leap Motion.

**VR Controller Control** (in progress...): <br>
* Immersive, spatial teleoperation through precise 6DoF tracking (Six Degrees of Freedom) and haptic feedback using Virtual Reality controllers.

**Robot Control UI:** <br>
* Comprehensive web-based dashboard featuring a virtual 2D analog joystick, 6-DoF absolute joint sliders, and live telemetry for remote teleoperation.
* Fully customizable layout with drag-and-drop capability for all panels. The layout is persistent and saved directly in the browser.

### <a id="subchapter-4-2"></a> 4.2 Perception & Assistance
**Computer Vision:** <br> 
* **[DEPRECATED]** Spatial 2D object detection and localization using *YOLO* via PiCameras. The ZED Mini camera natively handles this in 3D.
**Stereo Vision:** <br>
* Integration of true 3D depth data using a *ZED Mini (Stereolabs)* camera.
* The camera can be mounted either **stationary** (on a tripod) or **on the end-effector (EEF)**.
* **Octomap 3D Mapping:** In EEF mode, the robot can execute a programmed scan path to automatically generate a voxel-based 3D environment map (Octomap).
**VLA & Video Action Models (Planned):** <br>
* AI-assisted action planning through *Vision-Language-Action* models.

### <a id="subchapter-4-3"></a> 4.3 Coordinate Transformation & Calibration
**ArUco Marker System [DEPRECATED]:** <br> 
* *[Deprecated]* Markers placed in the robot's operating area serve as reference for homography matrices.
* *[Deprecated]* Derivation of 3D world coordinates for objects on the work surface (Z = 90 mm).
* Precise projection of eye-tracking gaze coordinates onto the control **UI** to translate gaze into robot commands.

### <a id="subchapter-4-4"></a> 4.4 User Interfaces (UI/GUI)
For cognitively relieving teleoperation, the user is provided with a central, immersive user interface that consolidates all system states.

**Telemetry & Status:** <br> 
* Continuous display of real-time telemetry data from the robot arm.
 
**System Feedback & Intent Recognition:** <br>
* Direct visual and acoustic feedback for manual control inputs as well as successfully parsed voice commands.
 
**Preventive Collision Warnings:** <br> 
* Dynamic warnings when software-based collision protection measures are triggered (e.g., falling below the Z-limit).
 
**Visual Monitoring & Object Detection:** <br>
* Seamless integration of video livestreams with live overlays of detected target objects (YOLO bounding boxes) as well as a synchronized 3D visualization (Digital Twin) of the work environment.

**Implementation via OBS Studio:**<br>
* In *OBS Studio*, all components are consolidated and provided to the user as a central GUI for robot teleoperation.*


**Gaze Control User Interface**<br>

![Gaze Control UI](_imgs/gaze_control_interface.png)

---

## <a id="chapter-5"></a> 5. ⚙️ Core Features & ROS 2 Nodes

To provide a clear understanding of the architecture, the software modules are categorized by their functional **Features (Use-Cases)**. Each module is explicitly labeled as a ROS 2 Node, Script, or Plugin.

### 🎮 <a id="subchapter-5-1"></a> 5.1 Feature: Gamepad Teleoperation & Hard Collision Protection
*This subsystem manages the manual jogging of the robot via the Xbox controller and actively prevents the robot from colliding with the workspace surface due to operator error.*

#### `xarm_joystick_input.cpp` <kbd>NODE</kbd>

> **Purpose & Task:** Translates the sanitized gamepad signals (analog sticks & triggers) into Cartesian velocity commands (`TwistStamped`) for MoveIt Servo. Applies exponential smoothing and handles all button mappings.
- 📥 **Subscribes:** `/joy_check` (`sensor_msgs/Joy`). Reads the sanitized controller inputs from the guardian node.
- 📤 **Publishes:** `/servo_server/delta_twist_cmds` (`geometry_msgs/TwistStamped`), `/ui/eef_position` (`std_msgs/Float32MultiArray`). Sends motor currents to the Servo Server and publishes the live 10 Hz pose for the Web UI.
- 🔄 **TF2:** Listens to the current TCP position (`link_base` -> `link_tcp`).
- 🛠️ **Services:** `/servo_server/start_servo`, `/servo_server/stop_servo`, `/servo_server/switch_command_type` (Clients).

#### `checker.py` (`collision_check`) <kbd>NODE</kbd>

> **Purpose & Task:** Acts as a guardian *before* the movement translation. Predictively computes the Z-coordinate (0.1 sec into the future). If the robot were to touch the table, the controller's downward command is hard-overridden and blocked. Triggers gamepad rumble feedback (vibration).
- 📥 **Subscribes:** `/joy` (`sensor_msgs/Joy`), `/servo_server/status` (`std_msgs/Int8`), `/ui/eef_position` (`std_msgs/Float32MultiArray`). Reads the raw controller input, status codes of the Servo Server, and the current Z height for the collision check.
- 📤 **Publishes:** `/joy_check` (`sensor_msgs/Joy`), `/ui/collision_msg` (`std_msgs/String`). Forwards the (potentially zero-corrected) command to the `joystick_input` and reports hard stops to the UI. Gamepad rumble feedback is triggered directly via `pygame` (without a ROS topic).
- ⚙️ **Parameters:**
 * `look_ahead_time = 0.1` – Prediction horizon (seconds) for the velocity look-ahead.
 * `table_z_threshold = 0.0` – The hard table barrier on the Z-axis (World-Frame).

#### `xarm_moveit_servo` <kbd>CONFIGURATION / NODE</kbd>

> **Purpose & Task:** The real-time motion engine from MoveIt. Reacts to dynamic obstacles (YOLO boxes) via a `threshold_distance` parameter and halts the arm before it collides with objects.
- 📥 **Subscribes:** `/servo_server/delta_twist_cmds` (`geometry_msgs/TwistStamped`), `/planning_scene` (`moveit_msgs/PlanningScene`).
- 📤 **Publishes:** `/lite6_traj_controller/joint_trajectory` (`trajectory_msgs/JointTrajectory`). Sends the final joint angles to the robot.
- ⚙️ **Parameters (`xarm_moveit_servo_config.yaml`):**
 * `collision_check_type: stop_distance` – Enables soft, velocity-dependent deceleration (pre-warning starts around 5cm) instead of a hard block at the boundary. A hard emergency stop engages at exactly 2cm (`min_allowable_collision_distance: 0.02`).
 * `collision_distance_safety_margin: 0.02` – Defines the 2 cm wide, invisible collision bubble around the robot.

### 🟢 <a id="subchapter-5-2"></a> 5.2 Feature: Autonomous Grasping & 3D Object Detection (YOLO / ZED)
*This subsystem is responsible for locating objects in 3D space, generating virtual obstacles, and navigating the robot precisely to the target.*

#### `zed_wrapper` <kbd>NODE</kbd>

> **Purpose & Task:** The native hardware driver for the Stereolabs ZED Mini Camera. 
- 📤 **Publishes:** `/zed/zed_node/rgb/image_rect_color` (`sensor_msgs/Image`), `/zed/zed_node/depth/depth_registered` (`sensor_msgs/Image`), `/zed/zed_node/point_cloud/cloud_registered` (`sensor_msgs/PointCloud2`). Provides the sensory foundation for the entire system.
- ⚙️ **Parameters (`zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py`):**
 * `depth_mode: ULTRA` – Forces the most dense 3D point cloud for clean edge calculation.
 * `auto_exposure: True` – Allows automatic brightness compensation for robust YOLO detection.

#### `zed_yolo_3d_bbox.py` <kbd>NODE</kbd>

> **Purpose & Task:** Processes the RGB and Depth streams in parallel using GPU acceleration and the **YOLOv8 Large** model. Isolates objects, filters depth noise, and computes millimeter-accurate 3D bounding boxes grounded to the table plane (including a grasp point marker). Uses a **robust closest-surface projection** algorithm (filtering out the bottom 20% of points to avoid table noise) to perfectly center bounding boxes on the true physical volume of objects, regardless of camera angles. Features a **dictionary-based EMA tracking system** with persistent global IDs and a tight 10cm distance threshold to prevent ID-swapping and bounding box jitter. Multiple objects of the same class are permanently numbered for unambiguous targeting (e.g., `cup_1`, `cup_2`).
- 📥 **Subscribes:** `/zed/zed_node/rgb/image_rect_color` (`sensor_msgs/Image`), `/zed/zed_node/depth/depth_registered` (`sensor_msgs/Image`), `/zed/zed_node/rgb/camera_info` (`sensor_msgs/CameraInfo`).
- 📤 **Publishes:** `/zed/bboxes_3d` (`visualization_msgs/MarkerArray`). Sends the finalized 3D boxes and markers to RViz for visualization and to downstream nodes.
- ⚙️ **Parameters:**
 * `class_dimension_overrides` – Hardcodes expected metric dimensions (x,y,z) for specific objects to ensure the bounding box perfectly encloses the physical volume, not just the visible point cloud surface.
 * `percentiles: [0.5, 99.5]` – Hard-clips extreme depth noise pixels ("flying pixels" at object edges) while preserving true boundaries.
 * `ema_alpha: 0.2` – Smoothing factor (Exponential Moving Average) to safely eliminate box jittering between frames.

#### `pointcloud_optimizer.py` <kbd>NODE</kbd>

> **Purpose & Task:** Actively runs in the background during the 3D Vision Bringup. It intercepts the raw ZED point cloud and transforms the coordinate system from the optical frame (`Z=forward`) to the standard ROS frame (`X=forward`) while preserving RGB data.

#### `yolo_moveit_collision.py` <kbd>NODE</kbd>

> **Purpose & Task:** Seamlessly converts the detected 3D boxes into dynamic MoveIt `CollisionObject` messages. Instead of a solid block, it generates an **open-top cup shape** (5 ultra-thin 1mm walls). This allows the gripper to safely penetrate the bounding box from above for top-down grasps, while securely blocking lateral collisions.
- 📥 **Subscribes:** `/zed/bboxes_3d` (`visualization_msgs/MarkerArray`). Reads the bounding boxes.
- 📤 **Publishes:** `/planning_scene` (`moveit_msgs/PlanningScene`). Sends the `CollisionObjects` directly to the MoveIt Planning Scene to avoid collisions during grasping/driving.

#### `octomap_server` <kbd>Integration via MoveIt 2</kbd>

> **Purpose & Task:** Dynamic 3D environment mapping. Generates a real-time voxel-based collision map (OctoMap) directly from the ZED point cloud, enabling MoveIt to avoid arbitrary, unrecognized obstacles (e.g., human hands, tools) during trajectory planning and servoing.
 * 🛠️ **Activation:** In the base repository (`src/xarm_ros2/xarm_moveit_config/launch/_robot_moveit_common.launch.py`), the OctoMap is configured via the `sensor_manager_parameters` dictionary (setting parameters like `octomap_resolution: 0.03` and `ros.point_cloud_topic`) and injected directly into the `move_group_node`.
- 📥 **Subscribes:** `/zed/zed_node/point_cloud/cloud_optimized` (`sensor_msgs/PointCloud2`).
- 📤 **Publishes:** Integrated natively into the MoveIt `/planning_scene`.

#### `yolo_planned_grasp_executor.py` <kbd>NODE</kbd>

> **Purpose & Task:** The central control logic of the autonomous grasping pipeline. Reads the UI input field ("Grasp Object"), retrieves the YOLO coordinates, and coordinates a robust **3-Phase Collision-Free Grasping Sequence**:
  - **Phase 1 (Retract):** Safely moves the arm strictly upwards from its current position to clear the table.
  - **Phase 2 (Hover):** Translates horizontally to a safe height (15cm) exactly above the target object. Forces a strict top-down orientation and uses tight IK tolerances (5mm positional, 0.001 rad tilt) to guarantee millimeter-accurate vertical alignment.
  - **Phase 3 (Approach):** Temporarily removes the target object from the MoveIt global collision scene via `/ui/ignore_collision_object` to allow the TCP to physically reach into the object's bounding box without triggering emergency stops, then moves down.
- ⚙️ **Parameters:** Features tunable `velocity_scaling` (default: 0.2) and `acceleration_scaling` (default: 0.1) for extremely smooth, slow, and predictable robotic interactions during the grasp sequence.
- 📥 **Subscribes:** `/zed/bboxes_3d` (`visualization_msgs/MarkerArray`).
- 📤 **Publishes:** `/ui/grasp_status` (`std_msgs/String`) for the RViz console, `/ui/ignore_collision_object` (`std_msgs/String`), `/planning_scene` (`moveit_msgs/PlanningScene`).
- 🔄 **Action Server:** `/ui/grasp_object` (`my_3d_vision_msgs/action/GraspObject`).
- 🛠️ **Services:** `/compute_ik` (IK verification), `/move_action` (MoveIt OMPL Planner), `/ui/execute_move_to_pose` (Servo Fallback).

#### `grasp_action_bridge.py` <kbd>NODE</kbd>

> **Purpose & Task:** Acts as a translator node between the RViz Control Panel and the Action Server. Receives the simple target object string from the UI and converts it into a non-blocking ROS 2 Action Goal.
- 📥 **Subscribes:** `/ui/grasp_object_cmd` (`std_msgs/String`).
- 🔄 **Action Client:** `/ui/grasp_object` (`my_3d_vision_msgs/action/GraspObject`).

#### `zed_stand_publisher.py` <kbd>SCRIPT</kbd>

> **Purpose & Task:** Mathematically generates the exact 3D mesh model of the camera tripod (aluminum profile) and publishes it statically in RViz.
- 📤 **Publishes:** `/zed_stand_marker` (`visualization_msgs/Marker`).

#### `pointcloud_tf_tuner.py` <kbd>SCRIPT / UI</kbd>

> **Purpose & Task:** A live tuner interface (PyQt5) to quickly adjust camera offsets without restarting nodes.
- 📤 **Publishes:** Dynamically updates the TF broadcaster values (`tf2_msgs/TFMessage` on `/tf_static`).

### 🗣️ <a id="subchapter-5-3"></a> 5.3 Feature: Multimodal Interaction (Voice & Gaze Control)
*These experimental modules allow for "hands-free" control of the system.*

#### `ros2_whisper` <kbd>NODE</kbd>

> **Purpose & Task:** Local Speech-to-Text AI. Runs Whisper AI continuously on the microphone stream and publishes spoken words as text.
- 📤 **Publishes:** `/whisper/text` (`std_msgs/String`).

#### `voice_command_listener.py` <kbd>NODE</kbd>

> **Purpose & Task:** Analyzes the raw text using regex patterns and delta-processing (to prevent endless command loops), filters out filler words, and extracts defined action intents (e.g., "Grasp cup", "Move to pose").
- 📥 **Subscribes:** `/whisper/transcript_stream` (`std_msgs/String`), `/whisper/inference` (`std_msgs/String`).
- 📤 **Publishes:** `/ui/grasp_object_cmd` (`std_msgs/String`), `/ui/voice_feedback` (`std_msgs/String`). Publishes to the Action-Bridge to trigger the YOLO Grasp Executor, or directly triggers absolute coordinate movements ("MoveTo: pose") via the dashboard UI feedback.

#### `gaze_ui_node.py` <kbd>SCRIPT / UI</kbd>

> **Purpose & Task:** A master control user interface (PyQt5). Maps eye-tracking gaze points (via RTSP gaze data) to button clicks (e.g., at 0.5 sec fixation time) and sends direct movement and gripper commands.
- 📤 **Publishes:** `/servo_server/delta_twist_cmds` (`geometry_msgs/TwistStamped`). Directly controls the Cartesian velocity of the robot arm and uses UFactory services to operate the gripper.

### 🖥️ <a id="subchapter-5-4"></a> 5.4 Feature: Graphical Control & Visual Feedback
*Tools for the operator for manual positioning and visual monitoring in RViz and the Web.*

#### `rviz_robot_control_panel.cpp` <kbd>C++ GUI NODE</kbd>

> **Purpose & Task:** The native 2D control panel written in C++ for RViz. It is structured into a modern dark-theme UI with 4 distinct GroupBoxes (Cartesian Jog, Cartesian Absolute, Joint Absolute, Utilities). Provides D-Pad buttons, **6-DoF Joint Control Sliders**, the **"Grasp Object"** input field, and a **Color-Coded Live Console Log**. Employs a thread-safe `Qt::QueuedConnection` Signal/Slot architecture to pipe asynchronous ROS 2 node status messages directly into the UI without freezing.
- 📥 **Subscribes:** `/ui/grasp_status` (`std_msgs/String`), `/joint_states` (`sensor_msgs/JointState`), `/ui/robot_control/current_speed` (`std_msgs/Float32`).
- 📤 **Publishes:** `/servo_server/delta_twist_cmds` (`geometry_msgs/TwistStamped`), `/ui/grasp_object_cmd` (`std_msgs/String`), `/ui/robot_control/current_frame` (`std_msgs/String`), `/ui/robot_control/set_speed_index` (`std_msgs/Int32`).
- 🛠️ **Services:** `/ui/execute_initial_pose`, `/ui/execute_move_to_pose`, `/ui/execute_move_joint` (Clients).

#### `robot_motion_handler_movegroup.py` <kbd>NODE</kbd>

> **Purpose & Task:** Executes the commands from the Control Panel invisibly in the background. Features an intelligent startup trigger and safe joint execution (pauses Servo, moves via Trajectory Controller, and resumes Servo). Both "Execute to Pose" and "Initial Pose" movements (triggered via Web UI or RViz) now utilize a robust **IK-Solver (Inverse Kinematics)** to calculate target joint angles for absolute coordinates and execute them as safe, collision-free joint-space trajectories. This completely eliminates self-collision halts and singularities that occur with straight-line Cartesian motions across the workspace. The joint movements perfectly respect the global `speedScale`, scaling dynamically from butter-smooth slow movements to lightning-fast execution.
- 📥 **Subscribes:** `/ui/robot_control/current_speed` (`std_msgs/Float64`). Scales the velocity of the Joint movements synchronously with the UI.
- 📤 **Publishes:** `/lite6_traj_controller/joint_trajectory` (`trajectory_msgs/JointTrajectory`).
- 🛠️ **Services:** Provides `/ui/execute_initial_pose`, `/ui/execute_move_to_pose`, and `/ui/execute_move_joint` as Server. Uses `/compute_ik` (MoveIt IK) as a Client to resolve Cartesian targets. Has a TF2 listener for real-time TCP coordinates.

#### `rviz_overlay.py` & `servo_status_overlay.py` <kbd>NODES</kbd>

> **Purpose & Task:** Project color-coded warning messages (e.g., "COLLISION!") and live axis coordinates directly into the video stream of the RViz viewport.
- 📥 **Subscribes:** `/servo_server/status` (`std_msgs/Int8`), `/ui/collision_msg` (`std_msgs/String`), `/ui/robot_control/current_frame` (`std_msgs/String`). Listens for critical warning flags and frame updates.
- 📤 **Publishes:** Uses `rviz_2d_overlay_msgs/OverlayText`.

#### `rviz_marker_static_scene_objects.py` <kbd>NODE</kbd>

> **Purpose & Task:** Publishes ROS `MarkerArray` messages into the 3D scene of RViz2 (e.g., visual table edges).
- 📤 **Publishes:** `/scene_markers_array` (`visualization_msgs/MarkerArray`).

#### `rosbridge_server` <kbd>NODE</kbd>

> **Purpose & Task:** Standard WebSocket bridge on Port 9090, allowing the web-based dashboard to access the ROS network directly.

#### `robot_control_web_ui` <kbd>WEB APP</kbd>

> **Purpose & Task:** A native-feeling, standalone Chrome Web App designed with a modern Glassmorphism aesthetic. It acts as a comprehensive multimodal dashboard directly replicating the RViz control panel features for remote operation. Operates on **Port 8081**.
> 💡 **Native Desktop Integration:** Both the *ROS 2 Nexus Web App* and the *Robot Control Web UI* now launch in dedicated, isolated Chrome `--app` profiles. They start perfectly maximized as standalone applications, completely detached from standard browser windows, and feature their own distinct taskbar icons for a seamless, native OS experience.
- ✨ **Core Features:**
  - **Advanced Telemetry:** Live system status pills for network ports (UI, WS, Nexus), active Gamepad connection (USB), and automatic Hardware Mode detection (Fake Arm vs. Real Arm IP, reliably sourced via global `rosapi` endpoints).
  - **MoveIt Servo Monitoring:** Dynamic UI indicators (Green/Orange/Red) with pulsing animations that mirror MoveIt collision/wait states in real-time.
  - **Virtual Teleoperation:** An integrated 2D virtual analog joystick for cartesian jogging, alongside a 6-DoF absolute joint state slider system and speed level adjustments. Movement speed and Cartesian jogging have been perfectly synchronized with the physical Gamepad controllers, utilizing a `0.1` to `0.5` m/s range and dynamic trajectory recalculations to ensure 100% stutter-free and fast robotic movement at any speed.
  - **Interactive UI & Layout Optimization:** The layout is intelligently structured (Cartesian Jogging top, Telemetry below) with zero wasted whitespace. Features dynamic, pulsing UI elements like the "Start Listening" Whisper AI button which now fully integrates with the backend, triggering a 5-second real-time speech recording via an Action Client upon activation. The final recognized transcription is published back to the ROS backend to be processed by the voice listener, replacing the need for standalone Whisper debug scripts.
  - **YOLO Grasp Integration:** Direct visualization of the 3D YOLO object list alongside an input field to trigger the grasp execution sequence remotely.
  - **Color-Coded Console Log:** A live, scrollable console log with detailed feedback for all motion commands — including coordinate display (`X`, `Y`, `Z`) for MoveTo commands and explicit success (✓) / failure (❌) status indicators with error codes.
- 📥 **Subscribes:** `/joint_states`, `/ui/eef_position`, `/servo_server/status`, `/zed/bboxes_3d`, `/ui/voice_feedback`, `/ui/robot_control/current_speed`, `/ui/grasp_status` (via `rosbridge`).
- 📤 **Publishes:** `/servo_server/delta_twist_cmds`, `/servo_server/delta_joint_cmds`, `/ui/robot_control/set_speed_index`, `/ui/grasp_object_cmd`, `/whisper/inference` (via `rosbridge`).

### 🤖 <a id="subchapter-5-5"></a> 5.5 Feature: Complex Trajectories & Task Coordination
*Nodes that orchestrate specific, higher-level movement sequences.*

#### `motion_sequence.py` <kbd>NODE</kbd>

> **Purpose & Task:** State management between MoveIt Servo and Hardware. Pauses the fluid Servo jogging (gamepad), interrupts the xArm hardware controller, executes a static movement, and seamlessly reactivates Servo afterward.
- 🛠️ **Services:** `/execute_motion_to_pose` (Server). Also calls hardware-specific UFactory services (`set_mode`, `set_state`).

#### `move_to_coordinator.py` <kbd>NODE</kbd>

> **Purpose & Task:** Orchestrates look-at commands and passes parameters to other motion nodes. *(Note: While it still subscribes to `/voice_cmd`, the voice pipeline now triggers the grasp executor directly. This node remains as a legacy API for orchestrating color-based coordinate movements).*
- 📥 **Subscribes:** `/voice_cmd` (`std_msgs/String`), `/objects/.../world_poses` (`geometry_msgs/PoseArray`).

### ⚠️ <a id="subchapter-5-6"></a> 5.6 Deprecated Modules
*Historical modules that have been replaced by newer systems (e.g., ZED Mini).*

#### `yolo_object_detector` <kbd>SCRIPT / NODE</kbd>

> **Purpose & Task:** *[Deprecated]* The old 2D-based object detection using Raspberry Pi cameras. Transformed YOLO bounding boxes via `cv2.findHomography` and flat ArUco markers into rigid 3D space (Z=90 mm). Fully replaced by the `my_3d_vision_bringup` (3D Vision System).
- 📤 **Publishes:** `/objects/<color>_<shape>/world_poses` (`geometry_msgs/PoseArray`).

---

## <a id="chapter-6"></a> 6. 🎮 Gamepad Control — Deep Dive