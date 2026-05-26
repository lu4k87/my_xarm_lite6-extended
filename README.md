# xArm ROS 2 Extended Workspace (ROS2 Humble) **[IN DEV]**

This repository is a continuously evolving research and evaluation platform for multimodal teleoperation and Human-Computer Interaction (HCI). <br>
It builds upon the official xarm_ros2 repository: https://github.com/xArm-Developer/xarm_ros2/tree/humble (Branch: humble).

## Table of Contents
1. [📋 Project Overview](#1--project-overview)
2. [🔬 Architecture & Guiding Principles](#2--architecture--guiding-principles)
3. [🚀 Quick Start: ROS 2 Nexus (The Central Launcher)](#3--quick-start-ros-2-nexus-the-central-launcher)
4. [📊 Monitoring: Dashboard & Workspace Analyzer](#4--monitoring-dashboard--workspace-analyzer)
5. [🕹️ Multimodal Technologies & Interaction Concepts](#5-️-multimodal-technologies--interaction-concepts)
6. [⚙️ Core Features & ROS 2 Nodes (Deep Dive)](#6-️-core-features--ros-2-nodes-deep-dive)

---

## 1. 📋 Project Overview

**`Concept:`**
* A modular platform for controlling the xArm Lite 6 robot through multimodal input methods with a focus on maximum usability.

**`Motivation (Assistance and Participation):`**
* Classical teleoperation requires cognitively demanding fine control and creates high technical barriers. 
* This project aims to reduce barriers in the spirit of Industry 5.0, enabling people with different physical abilities to participate productively in the workplace.

**`Operating Principle:`**
* The system uses a Shared-Control approach ("Human-in-the-Loop"). 
* Users seamlessly switch between intuitive commands (e.g., voice/gaze) and precise manual corrections (gamepad).

**`Objective:`**
* As a reproducible, cost-efficient Proof-of-Concept for research and inclusion projects to develop and empirically evaluate assistive robotics systems.

**`Evaluation Logic & Guidelines:`**
* Development of an evaluation logic for interaction quality. 
* Guidelines derived from this are intended to serve companies (e.g., when planning to introduce robots) as a guide and answer the question: "How do we proceed in accordance with Industry 5.0 requirements?". 
* These guidelines can also potentially be made available as a monetizable service for industry.

---

## 2. 🔬 Architecture & Guiding Principles

### The System Idea: An Integrated Development, Evaluation, and Validation Platform

The core objective of the project is to realize a modular, platform-based software architecture for multimodal teleoperation and AI-assisted assistive robotics. The system functions as a central, software-side integration node (middleware level) that merges heterogeneous subsystems into a unified runtime environment. Through a distributed server-client network (multi-PC setup) and software coupling to a real-time digital twin (NVIDIA Isaac Sim), the platform serves as both a flexible development environment and a standardized, replicable testbed.

The project is explicitly designed as a closed loop of development and empirical validation. The platform features an integrated logging and data acquisition infrastructure to record both technical performance parameters and human interaction data in a time-synchronized manner during system use. The architecture is inherently designed to flexibly orchestrate and measure a wide range of modalities:

* **Sensors & Perception:** Integration of depth cameras (e.g., object detection via YOLO, marker tracking) and tactile or physiological sensors for state estimation.
* **Multimodal Control:** Parallel integration of various input channels such as eye-tracking systems for gaze target acquisition, voice control (e.g., via OpenAI Whisper), and classic hardware controllers (gamepads, 3D mice).
* **Cognitive Robotics:** Integration of modern Vision-Language-Action (VLA) models to translate highly abstract textual and visual commands directly into robotic action sequences.

### Human-Centered Automation

The system architecture places the human operator at the center of the interaction design. The system is designed to allow users to cognitively grasp the current state of automation throughout operation—especially during the parallel processing of gaze patterns (eye tracking) and sensory feedback—and to anticipate subsequent system actions. This transparency dismantles algorithmic black-box structures. It empowers the operator to make informed interventions in critical situations and forms the basis for establishing calibrated trust in the system (*Trust in Automation*), which is evaluated quantitatively and qualitatively through user studies.

### Shared Control & Cognitive Relief

A key feature of the software architecture is the implementation of *shared control* paradigms for cooperative task execution. The platform enables a seamless, low-latency transfer of control authority between manual guidance (e.g., via MoveIt Servo / gamepad), gaze-controlled interactions (gaze target acquisition), and AI-assisted, semi-automated assistance functions. Through this context-dependent distribution of control shares, the user's mental workload is minimized. The system autonomously compensates for error-prone low-level corrections, thereby freeing up cognitive resources for high-level process monitoring. The effectiveness of this relief will be empirically validated in the course of the project using standardized psychometric methods.

### HCI & Usability Focus & Empirical Evaluation

The design of the central control interface (GUI) follows established principles of Human-Computer Interaction (HCI). Interaction patterns shift from the complex coordination of individual degrees of freedom or manually invoking distributed terminal processes toward intention-based task completion. The operator communicates abstract action intents—be it via voice, gaze target, or high-level controller—which the platform or integrated VLA models autonomously translate into kinematic trajectories.

An integral part of the project is conducting systematic user studies to evaluate these multimodal interfaces. Standardized usability metrics (such as the *System Usability Scale*, SUS) and objective performance data (e.g., task completion time, error rates, gaze paths) are collected to empirically verify usability and cognitive load (e.g., via *NASA-TLX*) and to iteratively optimize the system.

### Reproducible & Open Source

To ensure scientific validity, the project is designed as an open-source architecture. Disclosing the complete codebase ensures the methodological transparency of all algorithms, configurations (URDFs, MoveIt configurations), and data flows. This allows independent research groups to exact-replicate experiments, including the validation of complex sensor data streams and control inputs. It secures the statistical verifiability of evaluation results and establishes the platform as a standardized benchmark for comparative studies in the field of assistive and inclusive robotics.

### Cost-Effective Hardware

The system configuration is primarily based on economically affordable, commercially available off-the-shelf components (COTS)—such as the UFactory xArm Lite 6, standard depth cameras, and common consumer controllers—without compromising the required precision and functional reliability. By reducing investment barriers, access to modern, multimodally controlled robotics technology is democratized. The project specifically evaluates the extent to which this cost-effective hardware, compared to high-priced industrial systems, represents a valid and reliable research and deployment platform for inclusive projects and educational institutions.

### Modular & Industry Standard

The software-side infrastructure is modularly encapsulated and fully integrated into the ROS 2 Humble middleware framework. The native use of standardized communication primitives (nodes, topics, services, actions) ensures interoperability with industrial ecosystems such as MoveIt 2 as well as modern sensor and tracking SDKs. This modular decoupling ensures that individual subsystems—such as VLA pipelines for intent recognition, specific eye-tracking drivers, new input devices, or the simulation bridge to the digital twin—can be exchanged, extended, or evaluated in isolation as independent modules without having to modify the overall system.

---

## 3. 🚀 Quick Start: ROS 2 Nexus (The Central Launcher)

**ROS 2 Nexus** is the primary, central tool of this repository. It is a web-based GUI that serves as the main hub to launch all nodes, sensors, algorithms, and workspace scripts with a single click. Instead of memorizing and typing long CLI commands, you manage the entire robot system directly from your browser.

### 3.1 Start Commands & Ubuntu App Integration

**Launch via Terminal:**
```bash
cd ~/dev_ws
python3 _exec/ros2_nexus_web.py
# → Opens at http://localhost:5000 (accessible in LAN, e.g., http://192.168.x.x:5000)
```

**Quick Launch (auto-start backend + open browser):**
```bash
./_exec/ros2_nexus_web_start.sh
```

> **Ubuntu App Integration:** ROS 2 Nexus is registered as a native Ubuntu application via a `.desktop` entry. You can simply search for **"ROS 2 Nexus"** in your Ubuntu Activities menu to launch the app directly via its icon.

<p align="center">
  <img src="_imgs/ros2_nexus_web.png" width="90%" alt="ROS 2 Nexus — Web Edition">
</p>

### 3.2 Network & Port Architecture

To run the complete system with both web interfaces (Nexus and Dashboard), three different servers operate on separate ports:

| Port | Service | Type | Description |
|------|---------|------|-------------|
| **`5000`** | **ROS 2 Nexus Web** | Flask Backend | Provides the graphical Nexus UI. Receives button clicks from the browser and executes ROS shell commands as subprocesses on the host PC. |
| **`8080`** | **Dashboard Frontend** | HTTP Server | Hosts the static HTML/CSS/JS files for the ROS2 Core Dashboard. |
| **`9090`** | **ROS Bridge** | WebSocket | The bridge between ROS 2 and the browser. Allows the Dashboard (Port 8080) to connect directly to the ROS network via `roslib.js` to read real-time telemetry and call services. |

---

## 4. 📊 Monitoring: Dashboard & Workspace Analyzer

Once you have launched your nodes via ROS 2 Nexus, you can monitor the live state of your system using the **ROS2 Core Dashboard**. This is a web-based real-time UI that fuses static source code analysis with live ROS 2 network telemetry into a unified monitoring interface.

### 4.1 Backend (`workspace_analyzer.py`)
A ROS 2 node that performs execution-free, regex-based static code analysis of the entire `src/` directory. It extracts node names, publishers, subscribers, services, actions, and package dependencies. These structured JSON metadata are continuously published to `/dashboard/workspace_metadata` via a 10-second timer cycle. Additionally, it reads environment variables (ROS Distro, Domain ID, DDS middleware, Localhost mode) from `~/.bashrc` and provides them as live status badges.

> **Note on `workspace_analyzer.py`:** This is **not** a network server, but a standard ROS 2 node. The Dashboard accesses its published topics via the ROS Bridge (Port 9090).

### 4.2 Frontend (`dashboard_index.html`)
Connects to the ROS network via WebSocket (`rosbridge_server` on port 9090). It visually matches statically analyzed nodes against the currently running nodes, displays real-time topic frequencies (Hz), and enables direct execution of system scripts from the browser. The sidebar provides at-a-glance status information including connection health, robot availability, and the active ROS 2 environment configuration.

![ROS2 Core - Dashboard](_imgs/dashboard_nodes.png)

### 4.3 Launch Commands for UI Components
*Launch these components via ROS 2 Nexus, or manually via terminal:*
* **Backend:** `python3 src/websocket/workspace_analyzer.py`
* **Web Server:** `python3 -m http.server 8080 -d src/websocket`
* *(Dashboard accessible at: `http://localhost:8080/dashboard_index.html`)*

---

## 5. 🕹️ Multimodal Technologies & Interaction Concepts

### 5.1 Robot Control Methods (Inputs)
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

### 5.2 Perception & Assistance
**Computer Vision:** <br> 
* Spatial 2D object detection and localization using *YOLO* (currently via PiCameras).
**Stereo Vision (Planned):** <br>
* Integration of true 3D depth data via a *ZED Mini (Stereolabs)* camera.
**VLA & Video Action Models (Planned):** <br>
* AI-assisted action planning through *Vision-Language-Action* models.

### 5.3 Coordinate Transformation & Calibration
**ArUco Marker System:** <br> 
* Markers placed in the robot's operating area serve as reference for homography matrices.
* Derivation of 3D world coordinates for objects on the work surface (Z = 90 mm).
* Precise projection of eye-tracking gaze coordinates onto the control **UI** to translate gaze into robot commands.

### 5.4 User Interfaces (UI/GUI)
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

## 6. ⚙️ Core Features & ROS 2 Nodes (Deep Dive)

### 6.1 👁️ Computer Vision & Perception

* **`yolo_object_detector`**
    * **Purpose:** Object detection and spatial localization (cube, rectangle, cylinder).
    * **Task:** Finds trained objects and ArUco markers in the 2D image stream; projects them into 3D.
    * **How it works:** Reads RTSP/HTTP streams in a background thread. Transforms YOLO bounding boxes via `cv2.findHomography` and ArUco markers into 3D space (Z=90 mm). Publishes `PoseArray` messages under `/objects/<color>_<shape>/world_poses`.

### 6.2 🗣️ Voice Control & Interaction

* **`ros2_whisper`**
    * **Purpose:** Local Speech-to-Text recognition.
    * **Task:** Converts spoken user commands into text.
    * **How it works:** Runs the Whisper AI model continuously on the microphone stream and publishes the raw transcript as a String.
* **`voice_command_listener`**
    * **Purpose:** Interpretation and filtering of speech text.
    * **Task:** Extracts intents (e.g., "move to red"), blocks spam, and provides visual dashboard feedback.
    * **How it works:** Subscribes to `/whisper/text`, uses regex filters and a debounce mechanism (5 sec. cooldown in the `action_cooldown` dictionary) to block redundant commands. Publishes to `/voice_cmd` and `/ui/voice_feedback`.
* **`eye_control`**
    * **Purpose:** Robot control via gaze detection (**UI** interaction).
    * **Task:** "God-Mode" PyQt5 user interface for pure gaze input.
    * **How it works:** Extracts JSON Gaze2D data from the RTSP stream. Uses ArUco markers for screen detection and transforms gaze coordinates into the **UI**. With a 0.5 sec. dwell time on a button, a `TwistStamped` command is published.

### 6.3 🧠 Logic & Coordination

* **`move_to_coordinator`**
    * **Purpose:** Central "brain" for task-based movements in **Shared Control**.
    * **Task:** Merges voice/gaze commands with camera data and coordinates movement commands.
    * **How it works:** State machine based. Queues intents, sends the robot to a scan pose (`WAITING_FOR_ROBOT_IDLE`), blocks 2.0 sec. for image stabilization, checks the freshness of the `PoseArray`, and executes the Cartesian service call.

### 6.4 🦾 Motion & Safety

* **`motion_sequence`**
    * **Purpose:** State management and safe execution of Cartesian movements.
    * **Task:** Physical control and switching of hardware modes.
    * **How it works:** Provides action services (e.g., `execute_motion_to_pose`). Switches between servo and pose mode at the hardware level. When end-effector height < 95 mm, the arm is preventively raised to Z=150 mm before movement (collision protection).
* **`collision_check`**
    * **Purpose:** Hardware protection (table surface collision prevention).
    * **Task:** Predictive intervention before collisions during manual gamepad control.
    * **How it works:** Filters `/joy` and `/ufactory/get_position`. Calculates future Z-height in advance (`Z_new = Z_current + V_z * 0.1s`). Below 96.5 mm, the joy axis is zeroed to `0.0`, the user is warned via the **UI**, and a gamepad rumble is triggered.
* **`xarm_joystick_input`** *(Part of `xarm_moveit_servo`)*
    * **Purpose:** Gamepad control & button mapping.
    * **Task:** C++ node for filtered joy signals and ROS service calls.
    * **How it works:** Subscribes to the filtered `/joy_check`. Smooths signals exponentially (`factor = 0.5`). Mappings:
        * **D-Pad:** Speed levels (12.5% - 100%).
        * **Start/Back:** Reference frame switching (base vs. end-effector).
        * **A/B:** Vacuum gripper control.
        * **X:** Asynchronous Whisper AI trigger.
        * **Y:** Service call for initial pose.

### 6.5 🖥️ Monitoring (Dashboard), UI & Visualization

* **`rviz_marker`**
    * **Purpose:** Real-time visual feedback in RViz2.
    * **Task:** Visual enhancement of the 3D simulation.
    * **How it works:** Tracks `link_eef` via TF2. Publishes `MarkerArray` with pick-and-place targets (cubes, cylinders) and static 3D meshes (e.g., ZED camera) for simulation without live YOLO data.
* **`websocket`** *(Workspace Analyzer Backend)*
    * **Purpose:** Data source for the web dashboard.
    * **Task:** Monitors the ROS network and source code.
    * **How it works:** `workspace_analyzer.py` uses regex for execution-free code analysis (`src/`). Monitors file changes and publishes JSON metadata to ROS topics (e.g., `/dashboard/workspace_metadata`).
* **`rosbridge_server`**
    * **Purpose:** WebSocket bridge for web browsers.
    * **Task:** Native communication between dashboard and robot.
    * **How it works:** Standard package for WebSockets (Port 9090). Allows web applications to interact directly with the ROS network via `roslib.js`.
* **`zed_wrapper`**
    * **Purpose:** Hardware driver for Stereolabs ZEDm.
    * **Task:** Direct streaming to RViz2 and logic nodes without external software.
    * **How it works:** Native C++ node replacing the generic USB-cam node. Publishes `Image` and `CameraInfo` under `/zed/zed_node/...`.

---
