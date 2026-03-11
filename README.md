# xArm ROS 2 Extended Workspace (Humble)

Dieses Repository erweitert das offizielle [xarm_ros2 Repository](https://github.com/xArm-Developer/xarm_ros2/tree/humble) (Branch: `humble`) um einen eigenen Development-Workspace (`/dev_ws/`). Der Fokus liegt auf der Integration von moderner Computer Vision, Sprachsteuerung und webbasierten Teleoperations-Schnittstellen für die xArm-Roboterfamilie (insbesondere Lite6).

## 🚀 Kernfunktionen & Integrationen

| Paket / Node | Funktion |
| :--- | :--- |
| **`yolo_object_detector`** | Erkennt Objekte im Kamerabild via YOLO und publiziert transformierte 3D-Koordinaten. |
| **`collision_check`** | Erstellt programmgesteuert statische Kollisionsobjekte (z. B. Tische) im MoveIt Planning Scene. |
| **`motion_sequence`** | Reiht komplexe Bewegungsabläufe (Wegpunkte und Greifer-Aktionen) in Sequenzen aneinander. |
| **`move_to_coordinator`** | Empfängt Zielkoordinaten und plant Gelenk-Bewegungen für den Roboterarm über MoveIt 2. |
| **`ros2_whisper`** | Nimmt Audiosignale auf und übersetzt Sprache mithilfe von WhisperAI lokal in Rohtext. |
| **`voice_command_listener`** | Wertet Sprachtext aus und löst konkrete Roboter-Aktionen aus (z. B. "Gehe zur Grundposition"). |
| **`rviz_marker`** | Visualisiert erkannte Objekte und Zielpositionen als interaktive 3D-Marker in RViz2. |
| **`websocket`** | Hostet das Web-Dashboard und streamt Workspace-Metadaten via Websocket an den Browser. |
| **`rosbridge_server`** | Bindeglied (Tunnel), das die bidirektionale Kommunikation via Websocket in das ROS 2-System ermöglicht. |

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

* **Gesamtes System starten (Simulation/Fake):** 
  ```bash
  ./start.sh
  ```
  *(Startet den lokalen Webserver, die ROS Bridge, den Analyzer und den MoveIt Servo in einer Mock-Umgebung für Entwicklungs-Checks).*

* **Echten Lite6 Roboter starten:** 
  ```bash
  ./lite6.sh
  ```

Alternativ können einzelne Module wie gewohnt über ROS 2 Befehle gestartet werden:

* **Starten der Objekterkennung:** `ros2 run yolo_object_detector yolo_tracker_node`
* **Starten der ROS Bridge manuell:** `ros2 launch rosbridge_server rosbridge_websocket_launch.xml`
