# xArm ROS 2 Extended Workspace (Humble)
[INHALT MUSS NOCH GEPÜFT WERDEN!]

Dieses Repository erweitert das offizielle [xarm_ros2 Repository](https://github.com/xArm-Developer/xarm_ros2/tree/humble) (Branch: `humble`) um einen eigenen Development-Workspace (`/dev_ws/`). Der Fokus liegt auf der Integration von moderner Computer Vision, Sprachsteuerung und webbasierten Teleoperations-Schnittstellen für die xArm-Roboterfamilie.

## 🚀 Kernfunktionen & Integrationen

| Modul | Beschreibung | Technologie |
| :--- | :--- | :--- |
| **Vision & Objekterkennung** | Erkennung von spezifischen Objekten im Sichtfeld der Kamera mittels eines eigenen `custom_model`. | YOLO |
| **Koordinatentransformation** | Umrechnung von 2D-Bildpixeln in 3D-Weltkoordinaten zur präzisen Greif- und Pfadplanung. | OpenCV (Homography) |
| **Sprachsteuerung** | Intuitive Interaktion und Befehlseingabe über natürliche Sprache. | WhisperAI |
| **Web-Integration** | Bidirektionale Websocket-Kommunikation zwischen dem ROS 2-System und externen Web-Clients. | ROS2Bridge |
| **Dashboard & UI** | Ein benutzerfreundliches Web-Interface zur Systemüberwachung sowie ein Teleoperations-System für die Steuerung via Gamepad. | HTML/JS / Gamepad API |

## 📂 Repository-Struktur

Das Projekt ist grob in das offizielle xArm-Repository und die eigenen Erweiterungen unterteilt:

```text
├── xarm_ros2/          # Offizielle Pakete der xArm-Developer (ROS 2 Humble)
└── dev_ws/             # Eigener ROS 2 Workspace
    ├── src/
    │   ├── custom_vision/    # YOLO Integration & OpenCV Homography
    │   ├── speech_control/   # WhisperAI Node
    │   ├── web_interface/    # Dashboard UI & Gamepad Teleop
    │   └── ...
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

1.  Kopiere das Repository und initialisiere den Workspace:
    ```bash
    git clone <deine-repo-url>
    cd <dein-repo-ordner>/dev_ws
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

*(Hier kannst du später die spezifischen `ros2 launch`-Befehle für deine einzelnen Module dokumentieren, zum Beispiel:)*

* **Starten der Objekterkennung:** `ros2 launch custom_vision yolo_tracker.launch.py`
* **Starten der ROS2Bridge & Web-UI:** `ros2 launch web_interface dashboard.launch.py`
* **Starten der Sprachsteuerung:** `ros2 run speech_control whisper_node`
