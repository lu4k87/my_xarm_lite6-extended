# xArm ROS 2 Extended Workspace (ROS2 Humble) **[IN DEV]**


This repository is a continuously evolving research and evaluation platform for multimodal teleoperation and Human-Computer Interaction (HCI). <br>
It builds upon the official xarm_ros2 repository: https://github.com/xArm-Developer/xarm_ros2/tree/humble (Branch: humble).


## 📋 Project Overview
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

## 🔬 Architecture & Guiding Principles
### Human-Centered Automation:
* Users should be empowered to continuously interpret the system states of the automated system and anticipate the intention of the technical system.
* This enables them to make the right decisions and build trust in the technical system over time.

### Shared Control & Cognitive Relief: 
* Seamless switching between manual and AI-assisted control minimizes mental workload.

### HCI & Usability Focus:
* Interactions shift from complex low-level controls toward intention-based task completion.

### Reproducible & Open Source:
* Transparent codebase for standardized scientific experiments.

### Cost-Efficient Hardware: 
* Affordable components improve accessibility for inclusion and research projects.

### Modular & Industry Standard:
* Full integration into ROS 2 Humble for compatibility with established frameworks.

---

## 🚀 Multimodal Technologies & Interaction Concepts

### Robot Control Methods (Inputs)
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

### Perception & Assistance (Perception)
**Computer Vision:** <br> 
* Spatial 2D object detection and localization using *YOLO* (currently via PiCameras).
**Stereo Vision (Planned):** <br>
* Integration of true 3D depth data via a *ZED Mini (Stereolabs)* camera.
**VLA & Video Action Models (Planned):** <br>
* AI-assisted action planning through *Vision-Language-Action* models.

### Coordinate Transformation & Calibration
**ArUco Marker System:** <br> 
* Markers placed in the robot's operating area serve as reference for homography matrices.
* Derivation of 3D world coordinates for objects on the work surface (Z = 90 mm).
* Precise projection of eye-tracking gaze coordinates onto the control **UI** to translate gaze into robot commands.

### User Interfaces (UI/GUI)
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

![Gaze Control UI](_imgs/gaze control interface.png)

---

## 🖥️ System Administration, Workspace & Node Management

* [**ROS 2 Nexus (GUI)**](#-ros-2-nexus-ros2_nexuspy) - Modern desktop interface for quickly launching nodes and workspace scripts.
* [**Dashboard UI & Workspace Analyzer**](#-operating-principle-dashboard--workspace-analyzer) - Web-based real-time monitoring and analysis of the ROS network.

![Ros2 Core - Dashboard](_imgs/dashboard_nodes.png)

---

## ⚙️ Core Features & ROS 2 Nodes

### 👁️ Computer Vision & Perception

* **`yolo_object_detector`**
    * **Purpose:** Object detection and spatial localization (cube, rectangle, cylinder).
    * **Task:** Finds trained objects and ArUco markers in the 2D image stream; projects them into 3D.
    * **How it works:** Reads RTSP/HTTP streams in a background thread. Transforms YOLO bounding boxes via `cv2.findHomography` and ArUco markers into 3D space (Z=90 mm). Publishes `PoseArray` messages under `/objects/<color>_<shape>/world_poses`.

### 🗣️ Voice Control & Interaction

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

### 🧠 Logic & Coordination

* **`move_to_coordinator`**
    * **Purpose:** Central "brain" for task-based movements in **Shared Control**.
    * **Task:** Merges voice/gaze commands with camera data and coordinates movement commands.
    * **How it works:** State machine based. Queues intents, sends the robot to a scan pose (`WAITING_FOR_ROBOT_IDLE`), blocks 2.0 sec. for image stabilization, checks the freshness of the `PoseArray`, and executes the Cartesian service call.

### 🦾 Motion & Safety

* **`motion_sequence`**
    * **Purpose:** State management and failsafe execution of movements.
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

### 🖥️ UI & Visualization

* **`rviz_marker`**
    * **Purpose:** Real-time visual feedback in RViz2.
    * **Task:** Visual enhancement of the 3D simulation.
    * **How it works:** Tracks `link_eef` via TF2. Publishes `MarkerArray` with pick-and-place targets (cubes, cylinders) and static 3D meshes (e.g., ZED camera) for simulation without live YOLO data.
* **`websocket`** *(Workspace Analyzer Backend)*
    * **Purpose:** Data source for the web dashboard.
    * **Task:** Monitors the ROS network and source code.
    * **How it works:** `workspace_analyzer.py` uses AST for execution-free code analysis (`src/`). Monitors file changes (Watchdog) and publishes JSON metadata to ROS topics (e.g., `/dashboard/workspace_metadata`).
* **`rosbridge_server`**
    * **Purpose:** WebSocket bridge for web browsers.
    * **Task:** Native communication between dashboard and robot.
    * **How it works:** Standard package for WebSockets (Port 9090). Allows web applications to interact directly with the ROS network via `roslib.js`.
* **`zed_wrapper`**
    * **Purpose:** Hardware driver for Stereolabs ZEDm.
    * **Task:** Provision of 3D depth data and point clouds for environment mapping and detection.

---


## 🛠️ Prerequisites

* **The official repository:** [xarm_ros2 (Official)](https://github.com/xArm-Developer/xarm_ros2/tree/humble) (Branch: `humble`)
* **OS:** Ubuntu 22.04.5 (Jammy Jellyfish)
* **ROS:** ROS 2 Humble
* **Python:** Python 3.10+
* **System Dependencies** *(via `sudo apt install ...`)*:
  * `portaudio19-dev` (for audio input)
  * `python3-pyqt5.qtwebengine` (for embedded livestream in Eye Control UI)
  * `python3-opencv` (OpenCV system library for image processing)
  * `python3-av` (PyAV – hardware-accelerated video/audio decoding)
* **Additional Libraries** *(via `pip install ...`)*:
  * `pyaudio` (speech capture) — `ros2_whisper/audio_listener/audio_listener/audio_listener.py`
  * `ultralytics` (YOLO Object Detection) — `yolo_object_detector/yolo_object_detector/yolo_homography_node.py`
  * `opencv-python` (image processing) — `yolo_object_detector/yolo_object_detector/yolo_homography_node.py`
  * `numpy` (numerical computation / image matrices) — `yolo_homography_node.py`, `eye_ui_node.py`, `audio_listener.py`
  * `pygame` (gamepad rumble / haptic feedback) — `collision_check/collision_check/checker.py`
  * `PyQt5` (Eye Control UI) — `eye_control/eye_control/eye_ui_node.py`
  * `pyyaml` (camera calibration data) — `yolo_homography_node.py`, `calibrate_camera.py`
  * `rosbridge_suite` (WebSocket communication)
  * `ros2 whisper` (voice commands)



---

## ⚙️ Installation & Setup

1. Clone the repository:
```bash
git clone [https://github.com/lu4k87/my_xarm_lite6-extended.git](https://github.com/lu4k87/my_xarm_lite6-extended.git) dev_ws
cd dev_ws

```


2. Install all ROS 2 dependencies with `rosdep`:
```bash
rosdep update
rosdep install --from-paths src --ignore-src -r -y

```


3. Build the workspace:
```bash
colcon build --symlink-install


```



```
4. Source ROS 2 + Workspace:
   ```bash
   source /opt/ros/humble/setup.bash
   source install/setup.bash
   

```

---

## 💻 Environment Configuration (`~/.bashrc`)

To ensure that the ROS 2 workspace, CUDA tools, and necessary environment variables are automatically loaded every time a new terminal is opened, the following configuration should be added to your `~/.bashrc` file. 

You can edit the file by running:
```bash
nano ~/.bashrc
```

Add the following content at the end of the file:
```bash
# -------------------------------------------------------------------------
# --- CUDA Configuration ---
# Adds CUDA tools to the PATH
export PATH=/usr/local/cuda/bin${PATH:+:${PATH}}
# Enables the system to find CUDA libraries
export LD_LIBRARY_PATH=/usr/local/cuda/lib64${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}

# --- ROS 2 Base Configuration ---
# Sets the Domain ID for ROS network isolation
export ROS_DOMAIN_ID=66
# Defines the used distribution
export ROS_DISTRO=humble
# Forces CycloneDDS as middleware
export RMW_IMPLEMENTATION=rmw_cyclonedds_cpp
# Allows communication beyond localhost (important for the Dashboard)
export ROS_LOCALHOST_ONLY=0

# --- ROS 2 Sourcing ---
# Loads the global ROS 2 environment (default path)
if [ -f /opt/ros/humble/setup.bash ]; then
    source /opt/ros/humble/setup.bash
fi

# Loads the custom development workspace (if it exists)
if [ -f ~/dev_ws/install/setup.bash ]; then
    source ~/dev_ws/install/setup.bash
fi

# Optional: Confirmation when opening a terminal (helps with debugging)
echo -e "\e[35mProzess-ID: $$ \e[0m\e[31m(Domain ID: $ROS_DOMAIN_ID, RMW: $RMW_IMPLEMENTATION)\e[0m"
echo -e "\033[1;32msource /opt/ros/humble/setup.bash\033[0m"
echo -e "\033[1;32msource ~/dev_ws/install/setup.bash\033[0m"
echo -e "------------------------------------------------------------------------"
# -------------------------------------------------------------------------
```

### Why is this needed?
This configuration automates several critical steps:
* **CUDA Paths:** Enables the system to find GPU tools, which is essential for fast YOLO object detection.
* **Network Isolation:** `ROS_DOMAIN_ID=66` isolates your ROS 2 network so it doesn't conflict with other ROS systems on the same network.
* **Middleware & Communication:** `RMW_IMPLEMENTATION` ensures the reliable CycloneDDS is used, and `ROS_LOCALHOST_ONLY=0` allows the Dashboard UI to communicate with ROS.
* **Auto-Sourcing:** Automatically loads the base ROS 2 system and your custom `dev_ws` workspace, so you don't have to run `source` manually in every new terminal. The `echo` commands give you a helpful visual confirmation.

---

## 🎮 Usage & Launch

Launching is preferably done via scripts for automatic initialization of nodes and WebSockets:

* **Start the entire system (Simulation/Fake):**
```bash
./start.sh


```



```
  *(Starts web server, rosbridge_server, Analyzer & MoveIt Servo in mock environment).*

* **Start the real Lite6 robot:**
  ```bash
  ./lite6.sh
  

```

* **Manual individual launch (Examples):**
* Object detection: `ros2 run yolo_object_detector yolo_tracker_node`
* ROS Bridge: `ros2 launch rosbridge_server rosbridge_websocket_launch.xml`



---

## 🖥️ ROS 2 Nexus (`ros2_nexus.py`)

* **Concept:** A central **graphical user interface (GUI)** for the entire workspace. Replaces complicated CLI commands with direct **usability**.
* **Function:** Launches ROS 2 commands, launch files, and bash scripts via desktop buttons.
* **Technical Flow:** Uses `customtkinter` for tab-based navigation. Commands run as isolated `subprocess` calls in dedicated `gnome-terminal` windows for better debugging.

**Launch Command:**

```bash
cd ~/dev_ws
python3 _exec/ros2_nexus.py

```

### 🌐 ROS 2 Nexus — Web Edition (`ros2_nexus_web.py`)

An alternative version of the Nexus GUI that runs entirely in the browser — accessible from any device in the local network (phone, tablet, etc.).

* **Same functionality** as the desktop version: all 5 tabs (Daily, Nodes, Web, Info, Build) with identical buttons.
* **Why a backend?** A browser cannot execute shell commands directly (security restriction). The small Flask backend (`ros2_nexus_web.py`) acts as a bridge: it receives HTTP requests from the browser and calls `subprocess.Popen()` to open `gnome-terminal` windows on the host machine — exactly like the desktop version.
* **Dependencies:** `pip install flask`

**Launch Command:**

```bash
cd ~/dev_ws
python3 _exec/ros2_nexus_web.py
# → http://localhost:5000  (also reachable in LAN, e.g. http://192.168.x.x:5000)

```

---

## 📊 Dashboard & Workspace Analyzer

A web-based **User Interface (UI)** that combines static code analysis with live telemetry data from the ROS 2 network.

### 1. Workspace Analyzer (Backend)

* Performs execution-free AST analysis (Abstract Syntax Trees) in `src/` for ROS patterns.
* Extracts node names, publishers, subscribers, services, actions, and package dependencies.
* Continuously publishes these structured JSON metadata to `/dashboard/workspace_metadata` (with Watchdog for live updates on code changes).

### 2. Dashboard (Frontend)

* Connects via WebSocket (`rosbridge_server` on Port 9090).
* Visually matches static nodes with active nodes.
* Reads topics via `roslib.js` in real-time, calculates Hz frequencies, and allows direct execution of system scripts (`start.sh`, `lite6.sh`) from the browser **UI**.

### 3. UI Component Launch Commands

* **Backend:** `python3 src/websocket/workspace_analyzer.py`
* **Web Server:** `python3 -m http.server 8080 -d src/websocket`
*(Dashboard accessible at: `http://localhost:8080/dashboard_index.html`)*

```


```
