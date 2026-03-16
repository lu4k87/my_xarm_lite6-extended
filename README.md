# xArm ROS 2 Extended Workspace (Humble)

Dieses Repository erweitert das offizielle [xarm_ros2 Repository](https://github.com/xArm-Developer/xarm_ros2/tree/humble) (Branch: `humble`) um einen eigenen Development-Workspace (`/dev_ws/`). Der Fokus liegt auf der Integration von Computer Vision zur Object Detection und Lokalisierung, Sprachsteuerung um Sprachbefehle an den Roboter zu senden und webbasierten Teleoperations-Schnittstellen für die xArm-Roboter (insbesondere Lite6). Zur einfachen Steuerung dient das **`ROS 2 GUI Control Script`**).

## 🚀 Kernfunktionen & Integrationen

| Paket / Node | Funktion |
| :--- | :--- |
| **`yolo_object_detector`** | Erkennt trainierte Objekte und ArUco-Marker im Kamerastream (YOLO), berechnet deren 3D-Bodenkoordinaten über eine Homographie-Matrix und publiziert diese als `PoseArray`. |
| **`collision_check`** | Überwacht die Z-Position des Endeffektors und Gamepad-Eingaben. Berechnet vorausschauend die Trajektorie und blockiert Abwärtsbewegungen (Trigger) vor Erreichen des Tisches (Z-Limit: 96.5mm). |
| **`motion_sequence`** | Führt asynchrone Bewegungsabläufe aus. Übernimmt das sichere Umschalten der xArm-Controller-Zustände (Servo, POSE-Mode) für saubere Transitionen bei direkter Koordinatenansteuerung. |
| **`move_to_coordinator`** | Zentraler Logik-Knotenpunkt: Verbindet Sprachbefehle mit den 3D-Koordinaten aus dem Vision-System, managt Queues/Timeouts und sendet die finalen Fahrbefehle an die `motion_sequence`. |
| **`ros2_whisper`** | Lokale Speech-to-Text Engine. Nimmt den Audio-Stream des Mikrofons auf und streamt in Echtzeit unformatierte Text-Transkripte in das ROS-Netzwerk. |
| **`voice_command_listener`** | Subscribt die Rohtexte, wendet Regex-Muster an (z. B. "move to red"), übernimmt das Entprellen (Refractory/Cooldown) und leitet saubere Action-Intents an den Coordinator und das UI weiter. |
| **`rviz_marker`** | Konvertiert die vom Vision-System erkannten 3D-Koordinaten aus den `PoseArray`-Topics in interaktive Rviz2 Marker zur Live-Visualisierung im 3D-Raum. |
| **`xarm_moveit_servo`** | (xarm_ros2) Echtzeit-Steuerungskomponente. Verarbeitet kontinuierliche Raum- oder Gelenkgeschwindigkeiten (z.B. vom Gamepad) und streamt diese latenzarm an den Hardware-Controller. |
| **`websocket`** | Python-Backend des Dashboards. Bietet den `workspace_analyzer`, publiziert Metadaten der aktiven Nodes an JS-Clients und serviert die statischen Webdateien auf Port 8080. |
| **`rosbridge_server`** | (ROS-Standard) Öffnet einen direkten Websocket-Kanal (Port 9090), über den das JavaScript-Frontend nativ auf ROS 2 Topics und Services zugreifen kann. |

## 📂 Repository-Struktur

Das Projekt ist grob in das offizielle xArm-Repository und die eigenen Erweiterungen unterteilt:

```text
/dev_ws/
    ├── start.sh                     # Globale Workspace-Launcher (z. B. start.sh, lite6.sh)
    └── src/                         # Quellcode aller Pakete
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

* **Das offizielle Repository:** [xarm_ros2 (Official)](https://github.com/xArm-Developer/xarm_ros2/tree/humble) (Branch: `humble`)
* **OS:** Ubuntu 22.04.5 (Jammy Jellyfish)
* **ROS:** ROS 2 Humble
* **Python:** Python 3.10+
* **System-Abhängigkeiten:** `portaudio19-dev` (für Audio-Input)??[to proof]
* **Zusätzliche Bibliotheken:**
    * `pyaudio` (Spracherfassung)
    * `ultralytics` (YOLO Object Detection) x.x
    * `opencv-python` (Bildverarbeitung)
    * `rosbridge_suite` (Websocket-Kommunikation)
    * `ros2 whisper` (Sprachkommandos)(https://github.com/ros-ai/ros2_whisper)

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

- (.sh) hier werdern die Ros2 Nodes gestartet und die Websocket-Kommunikation aufgebaut

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

## 🖥️ ROS 2 GUI Control

Das Script `ros2_gui_cmds.py` bietet eine moderne, benutzerfreundliche Oberfläche (basierend auf `customtkinter`), um die wichtigsten ROS 2 Befehle und Workspace-Skripte mit einem Klick auszuführen.

### Funktionen:
- **Zentraler Launcher**: Startet `start.sh`, `lite6.sh` und andere Workspace-Skripte in separaten Terminals.
- **Node-Management**: Schneller Zugriff auf häufig genutzte ROS 2 `run` und `launch` Befehle.
- **Modernes Design**: Dunkles "Midnight"-Theme mit intuitiver Tab-Navigation.
- **System-Status**: Überblick über laufende Prozesse und einfache Bedienung ohne tiefere Terminal-Kenntnisse.

Starten des Scripts:
```bash
python3 ros2_gui_cmds.py
```
