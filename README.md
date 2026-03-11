# xArm ROS 2 Extended Workspace (Humble)

Dieses Repository erweitert das offizielle [xarm_ros2 Repository](https://github.com/xArm-Developer/xarm_ros2/tree/humble) (Branch: `humble`) um einen eigenen Development-Workspace (`/dev_ws/`). Der Fokus liegt auf der Integration von moderner Computer Vision, Sprachsteuerung und webbasierten Teleoperations-Schnittstellen für die xArm-Roboterfamilie (insbesondere Lite6).

## 🚀 Kernfunktionen & Integrationen

| Modul | Beschreibung | Technologie |
| :--- | :--- | :--- |
| **Vision & Objekterkennung** | Erkennung von spezifischen Objekten im Sichtfeld der Kamera mittels eines eigenen `custom_model`. | YOLO (`yolo_object_detector`) |
| **Roboterbewegung & Kollision** | Koordinierung komplexer Bewegungsabläufe und Kollisionsvermeidung in Rviz2. | MoveIt 2 (`collision_check`, `move_to_coordinator`) |
| **Sprachsteuerung** | Intuitive Interaktion und Befehlseingabe über natürliche Sprache. | WhisperAI (`ros2_whisper`, `voice_command_listener`) |
| **Web-Integration** | Bidirektionale Websocket-Kommunikation zwischen dem ROS 2-System und externen Web-Clients. | ROS Bridge (`rosbridge_server`) |
| **Dashboard & UI** | Ein benutzerfreundliches Web-Interface zur Systemüberwachung sowie ein Knoten-Explorer und Teleoperations-System. | HTML/JS / Python (`websocket`) |

## 📂 Repository-Struktur

Das Projekt ist grob in das offizielle xArm-Repository und die eigenen Erweiterungen unterteilt:

```text
my_xarm_lite6-extended/
├── ./                  # Globale Workspace-Launcher (z. B. start.sh, lite6.sh)
└── src/                # Quellcode aller Pakete
    ├── collision_check/         # Kollisionsberechnungen und Environment-Setup
    ├── motion_sequence/         # Definition komplexer Roboter-Pfade
    ├── move_to_coordinator/     # Zielkoordinierung für MoveIt 2
    ├── ros2_whisper/            # Sprachmodelle und Erkennung (Whisper)
    ├── rviz_marker/             # Rviz2 Visualisierungs-Tools
    ├── voice_command_listener/  # Verarbeitung der erkannten Voice-Commands
    ├── websocket/               # Dashboard UI System & Workspace Analyzer
    ├── xarm_ros2/               # Offizielle Pakete der xArm-Developer
    └── yolo_object_detector/    # YOLO Integration & Computer Vision
```

## 🛠️ Voraussetzungen

Stelle sicher, dass die folgenden Kernkomponenten auf deinem System installiert sind:

* **OS:** Ubuntu 22.04
* **ROS:** ROS 2 Humble
* **Python:** Python 3.10+
* **Zusätzliche Bibliotheken:**
    * `ultralytics` (für YOLO)
    * `opencv-python` (für die Bildverarbeitung)
    * `openai-whisper` (für die Spracherkennung)
    * `rosbridge_suite` (für die Websocket-Kommunikation)

## ⚙️ Installation & Setup

1.  Kopiere das Repository:
    ```bash
    git clone https://github.com/lu4k87/my_xarm_lite6-extended.git dev_ws
    cd dev_ws
    ```

2.  Installiere alle ROS 2 Abhängigkeiten mit `rosdep`:
    ```bash
    rosdep update
    rosdep install --from-paths src --ignore-src -r -y
    ```

3.  Baue den Workspace:
    ```bash
    colcon build --symlink-install
    ```

4.  Source den Workspace:
    ```bash
    source install/setup.bash
    ```

## 🎮 Nutzung & Launch

Der Workspace wird bevorzugt über die globalen Shell-Skripte im Hauptverzeichnis gestartet, die das Dashboard hochziehen und die ROS-Umgebung vorbereiten.

* **Gesamtes System & UI starten (Simulation/Fake):** 
  ```bash
  ./start_test.sh
  ```
  *(Startet den lokalen Webserver, die ROS Bridge, den Analyzer und den MoveIt Servo in einer Mock-Umgebung für Entwicklungs-Checks).*

* **Echten Lite6 Roboter & UI starten:** 
  ```bash
  ./lite6.sh
  ```

Alternativ können einzelne Module wie gewohnt über ROS 2 Befehle gestartet werden:

* **Starten der Objekterkennung:** `ros2 run yolo_object_detector yolo_tracker_node`
* **Starten der ROS Bridge manuell:** `ros2 launch rosbridge_server rosbridge_websocket_launch.xml`
