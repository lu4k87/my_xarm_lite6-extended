# xArm ROS 2 Extended Workspace (ROS2 Humble) *IN DEV*

Dieses Repository ist eine kontinuierlich weiterentwickelte **Forschungs- und Evaluierungsplattform** für die multimodale Teleoperation und Mensch-Roboter-Interaktion (HCI), aufbauend auf dem offiziellen [xarm_ros2 Repository](https://github.com/xArm-Developer/xarm_ros2/tree/humble) (Branch: `humble`). 

Klassische Teleoperation erfordert häufig eine kontinuierliche, kognitiv stark beanspruchende Mikromanipulation, welche hohe technische Eintrittsbarrieren für Anwender darstellt. Um diese Hürden im Kontext inklusiver Arbeitsumgebungen und der Industrie 5.0 abzubauen, implementiert dieses System einen **Shared-Control-Ansatz** unter dem Paradigma des **"Human-in-the-Loop"**. 

Durch die Kombination von latenzarmer Gamepad-Steuerung (MoveIt Servo) mit KI-gestützter Assistenz – visueller Szenenwahrnehmung (YOLOv8) und semantischer Sprachverarbeitung (OpenAI Whisper) – verschiebt das System die Interaktion von einer reinen Low-Level-Steuerung hin zu einer intentionsbasierten, geführten Aufgabenbewältigung. Nutzer können nahtlos zwischen abstrakten Sprachkommandos und präzisen manuellen Korrekturen wechseln. Die Plattform wird zudem stetig um moderne Paradigmen wie robotergestütztes Eye-Tracking und geplante Integrationen von Vision-Language-Action (VLA) Modellen erweitert.

Das Gesamtsystem dient als reproduzierbarer, kosteneffizienter Proof-of-Concept, um multimodale Assistenzsysteme zur Förderung der Arbeitsplatzinklusion für Menschen mit unterschiedlichen physischen Voraussetzungen zu entwickeln und empirisch zu evaluieren.

### 🔬 Architektur & Leitprinzipien

*   **Shared Control & Kognitive Entlastung:** Reduktion der mentalen Beanspruchung durch den fließenden Wechsel zwischen manueller und KI-gestützter Steuerung.
*   **Reproduzierbar & Open Source:** Transparente Codebasis zur Sicherstellung nachvollziehbarer und standardisierter wissenschaftlicher Experimente.
*   **Kosteneffiziente Hardware:** Einsatz erschwinglicher Komponenten zur besseren Zugänglichkeit für Inklusions- und Forschungsprojekte.
*   **Modular & Industriestandard:** Durchgehende Nutzung von ROS 2 Humble für die Kompatibilität mit etablierten Robotik-Frameworks.

### 🚀 Multimodale Technologien & Interaktionskonzepte

Das System bündelt verschiedene Eingabemethoden (Multimodalität) für die Teleoperation, basierend auf dem offiziellen xarm_ros2 Repository.

**Steuerungsmethoden:**
*   **Gamepad-Teleoperation:** Latenzarme, kontinuierliche 3D-Steuerung mittels Xbox One Elite Series 2 Controller.
*   **Voice Control:** Lokale Sprachverarbeitung (Whisper AI) zur semantischen, intentionsbasierten Steuerung über ein Mikrofon.
*   **Eye-Tracking (Tobii Pro Glasses 3):** Robotersteuerung und UI-Interaktion über Blickerfassung (Gaze-Tracking).

**Wahrnehmung & Assistenz:**
*   **Computer Vision:** Räumliche Lokalisierung von Objekten über 2D-Objekterkennung mittels YOLO (aktuell über PiCameras).
*   **Stereo Vision (Geplant):** Zukünftige Integration von echten 3D-Tiefendaten über eine ZED Mini (Stereolabs) Kamera.
*   **VLA & Video Action Models (Geplant):** Integration von Vision-Language-Action Modellen zur KI-gestützten Handlungsplanung.

**Koordinatentransformation & Kalibrierung:**
*   **ArUco-Marker-System:** Das System nutzt ArUco-Marker als zentrale Referenzpunkte zur Berechnung von Homographie-Matrizen. Hierüber werden einerseits die 3D-Weltkoordinaten von Objekten auf der Arbeitsplatte (90 mm Höhe) des Roboters abgeleitet. Andererseits werden die Marker genutzt, um die Blickkoordinaten der Eye-Tracking-Brille exakt auf die Steuerungs-UI zu projizieren, sodass Blicke auf Bildschirmelemente in Roboterbefehle umgesetzt werden können.  

---

### Zentrale Steuerungselemente:
- [**ROS 2 Nexus**](#-ros-2-nexus) - Moderne Desktop-Oberfläche zum schnellen Starten von Nodes und Workspace-Skripten.
- [**Dashboard UI & Workspace Analyzer**](#-dashboard-ui--workspace-analyzer) - Webbasierte Echtzeit-Überwachung und Analyse des ROS-Netzwerks.

## 🚀 Kernfunktionen & ROS 2 Nodes

Hier ist eine detaillierte Übersicht aller wesentlichen Pakete und Nodes in diesem Workspace. Jedes Modul ist nach seinem Zweck, seiner Aufgabe und seiner Funktionsweise strukturiert.

### 👁️ Computer Vision & Wahrnehmung

#### `yolo_object_detector`
*   **Wozu dient er?** Objekterkennung und räumliche Lokalisierung von Zielobjekten (Pick-and-Place Aufgabe: Würfel, Rechteck, Zylinder) im Kamerabild.
*   **Was macht er?** Findet trainierte Objekte sowie ArUco-Marker im 2D-Bildstream und projiziert diese in den 3D-Raum des Roboters.
*   **Wie funktioniert er?** Die Node liest Bilder über einen blockierungsfreien Background-Thread (HTTP/RTSP-Stream) ein. Die 2D-Pixelkoordinaten der erkannten YOLO-Bounding-Boxes werden mithilfe von `cv2.findHomography` und acht auf dem Tisch platzierten ArUco-Markern in den 3D-Raum (Z=90 mm) transformiert. Die Zielkoordinaten werden anschließend als `geometry_msgs/msg/PoseArray` klassenspezifisch unter Topics wie `/objects/<color>_<shape>/world_poses` publiziert.

### 🗣️ Sprachsteuerung & Interaktion

#### `ros2_whisper`
*   **Wozu dient er?** Lokale Spracherkennung (Speech-to-Text).
*   **Was macht er?** Nimmt gesprochene Worte des Nutzers auf und wandelt sie in digitalen Text um.
*   **Wie funktioniert er?** Greift auf den Audio-Stream des Mikrofons zu und führt kontinuierlich ein lokales Whisper-KI-Modell aus. Das resultierende rohe Text-Transkript wird in Echtzeit als String im ROS-Netzwerk veröffentlicht.

#### `voice_command_listener`
*   **Wozu dient er?** Interpretation und Filterung der rohen Sprachtexte.
*   **Was macht er?** Extrahiert handlungsrelevante Befehle aus den Sätzen (z.B. "move to red") und blockiert Spam/Fehlerkennungen. Gibt dem Nutzer visuelles Feedback über das Web-Dashboard.
*   **Wie funktioniert er?** Die Node abonniert `/whisper/text` (`std_msgs/String`) und wendet Regex-Muster auf den Textstrom an. Zur Fehlervermeidung kommt ein Entprell-Mechanismus zum Einsatz: Ein Dictionary (`action_cooldown`) speichert den letzten Ausführungszeitpunkt pro Farbkategorie und blockiert redundante Befehle für standardmäßig 5,0 Sekunden. Valide Intents werden an `/voice_cmd` und User-Feedback-Strings an `/ui/voice_feedback` publiziert.

#### `eye_control`
*   **Wozu dient er?** Robotersteuerung über Blickerfassung (Eye-Tracking) mittels UI-Interaktion.
*   **Was macht er?** Ermöglicht die Steuerung durch reine Blickeingabe als "God-Mode" PyQt5-Benutzeroberfläche.
*   **Wie funktioniert er?** Die Node parst einen eingehenden RTSP-Stream und extrahiert JSON-Gaze2D-Daten. Sie nutzt `cv2.aruco.detectMarkers`, um die physischen Ecken des Bildschirms zu identifizieren, und transformiert die Blickkoordinaten per Homographie in die UI-Fensterkoordinaten. Bei einer erfolgreichen Fixierung (Dwell-Time von 0,5 Sekunden) auf einem Steuerungs-Button publiziert die Node eine `geometry_msgs/msg/TwistStamped` Nachricht an `/servo_server/delta_twist_cmds`.

### 🧠 Logik & Koordination

#### `move_to_coordinator`
*   **Wozu dient er?** Das zentrale "Gehirn" für aufgabenbasierte Bewegungen.
*   **Was macht er?** Führt die Befehle des Nutzers mit den Zieldaten der Kamera zusammen und gibt die endgültigen Fahrkommandos koordiniert aus.
*   **Wie funktioniert er?** Die auf einer State-Machine basierende Node empfängt Intents von `/voice_cmd` und reiht diese in eine Queue ein. Pro Befehl triggert sie zunächst den Wechsel in den Status `WAITING_FOR_ROBOT_IDLE`, um den Roboter via `motion_sequence` in eine Scan-Pose zu befördern. Ein Timer blockiert die weitere Ausführung für 2,0 Sekunden zur Bildstabilisierung. Anschließend wird die eingehende `PoseArray` auf Frische geprüft (Timestamp-Abgleich mit dem Timer-Ablauf), bevor der finale Service-Call für die kartesische Zielbewegung ausgeführt wird.

### 🦾 Bewegung & Sicherheit

#### `motion_sequence`
*   **Wozu dient er?** Robuste Ausführung von Bewegungsabläufen und Zustandsmanagement des Roboter-Controllers.
*   **Was macht er?** Steuert den Roboterarm physisch und extrem ausfallsicher an vorgegebene Posen und sorgt für das korrekte Umschalten der hardwarenahen Steuerungs-Modi.
*   **Wie funktioniert er?** Bietet Action-Services wie `execute_motion_to_pose` an. Intern greift die Node auf die Hardware-Schnittstellen zurück (`/ufactory/set_mode` und `/ufactory/set_state`), um den Controller bei Triggerung von Servo- in den Pose-Modus (und zurück) zu schalten. Unterschreitet die aktuelle Endeffektor-Höhe 95 mm, wird vor der eigentlichen Bewegung ein proaktiver Call an `xarm_msgs/srv/MoveCartesian` gesendet, um den Arm sicher auf Z=150 mm anzuheben und seitliche Kollisionen mit Objekten zu verhindern.

#### `collision_check`
*   **Wozu dient er?** Aktive Unfallprävention und Schutz der Hardware (insbesondere der Tischplatte).
*   **Was macht er?** Greift schützend ein, bevor der Roboter bei der Gamepad-Steuerung mit dem Tisch kollidiert, und warnt den Benutzer.
*   **Wie funktioniert er?** Die Node fungiert als Filter: Sie subscribt die rohen Controller-Daten (`/joy`) sowie die Positionsdaten des Endeffektors (`/ufactory/get_position`). Anhand der eingehenden Z-Achsen-Geschwindigkeit berechnet sie prädiktiv die zukünftige Höhe (`Z_neu = Z_aktuell + V_z * 0.1s`). Unterschreitet dieser Wert das Limit von 96,5 mm, wird die betroffene Joystick-Achse auf `0.0` genullt. Diese (bei Bedarf manipulierte) Eingabe wird dann auf dem Topic `/joy_check` weitergeleitet. Zudem warnt die Node den Nutzer via `/ui/collision_msg` und löst ein physisches Gamepad-Rumble über die `pygame.joystick` Bibliothek aus.

#### `xarm_joystick_input` (Teil von `xarm_moveit_servo`)
*   **Wozu dient er?** Latenzarme Gamepad-Steuerung und Tasten-Mapping für den Roboter und Systemdienste.
*   **Was macht er?** Eine in C++ geschriebene Node (`xarm_joystick_input.cpp`), die gefilterte Joy-Signale auswertet, glättet und in ROS-Befehle oder Service-Calls übersetzt.
*   **Wie funktioniert er?** Die Node abonniert das Topic `/joy_check` (das gefilterte Signal des Collision-Checkers) und liest die Analog-Sticks und Trigger für kartesische Bewegungen (`TwistStamped`) aus. Sie wendet einen exponentiellen Glättungsfilter (`smoothing_factor_ = 0.5`) an, um ruckartige Eingaben weich an MoveIt Servo weiterzugeben. Sie beinhaltet umfangreiche Button-Logiken:
    * **Steuerkreuz (D-Pad Up/Down):** Schaltet dynamisch zwischen 5 Geschwindigkeitsstufen (12,5% bis 100%) um.
    * **Start / Back:** Wechselt den kartesischen Referenzrahmen "on the fly" zwischen Roboterbasis (`link_base`) und Endeffektor (`link_eef`).
    * **A / B Tasten:** Steuert den Vakuum-Greifer über Hardware-Services (`/ufactory/open_lite6_gripper` etc.).
    * **X Taste:** Triggert den Whisper-KI-Sprachassistenten asynchron über einen ROS Action Client (`whisper_idl::action::Inference`).
    * **Y Taste:** Ruft die Service-Routine für die Initial-Pose auf (`/execute_motion_sequence_Y`).

### 🖥️ UI & Visualisierung

#### `rviz_marker`
*   **Wozu dient er?** Optische Echtzeit-Rückmeldung im 3D-Simulator (Rviz2).
*   **Was macht er?** Erweitert die 3D-Simulationsoberfläche im RViz2 um visuelle Hilfsmittel und statische Umgebungsobjekte.
*   **Wie funktioniert er?** Verfolgt den Endeffektor (`link_eef`) via `tf2_ros.Buffer.lookup_transform` zur Berechnung dynamischer Overlays. Publiziert kontinuierlich eine `visualization_msgs/msg/MarkerArray` an das Topic `/visualization_marker_array`. Diese beinhaltet statische Zielschablonen für Pick-and-Place Aufgaben (parametrisiert als `CUBE` oder `CYLINDER`) sowie 3D-Geometrien (`MESH_RESOURCE` wie z.B. die ZED-Kamera), um den Workspace in der Simulation ohne Live-YOLO-Daten visuell vollständig nachzubilden.

#### `websocket` (Workspace Analyzer Backend)
*   **Wozu dient er?** Datenquelle für das Web-Dashboard.
*   **Was macht er?** Überwacht den Zustand des ROS-Netzwerks und analysiert dynamisch den Quellcode des Workspaces.
*   **Wie funktioniert er?** Das Skript `workspace_analyzer.py` nutzt das Python-Modul `ast` (Abstract Syntax Tree), um den Quellcode im `src/`-Ordner ausführungsfrei nach Mustern wie `create_publisher` oder `create_subscription` zu durchsuchen. Es überwacht Dateisystemänderungen über `watchdog.observers.Observer` und triggert bei Bedarf automatisch Re-Analysen. Die extrahierten Metadaten werden als JSON an Standard-ROS-2-Topics (wie `/dashboard/workspace_metadata`) publiziert, woraufhin der separate `rosbridge_server` diese als Websocket für das Frontend bereitstellt.

#### `rosbridge_server`
*   **Wozu dient er?** Die Brücke zwischen der ROS 2 Welt und dem Web-Browser.
*   **Was macht er?** Ermöglicht dem Web-Dashboard, nativ mit dem Roboter zu kommunizieren (Lesen und Schreiben).
*   **Wie funktioniert er?** Ein ROS-Standard-Paket, das einen Websocket-Kanal (Standard: Port 9090) öffnet. Webanwendungen können über die `roslib.js` Bibliothek direkt ROS-Topics abonnieren, Nachrichten publizieren oder ROS-Services aufrufen, als wären sie ein nativer Teil des C++/Python ROS-Netzwerks.

#### `zed_wrapper`
*   **Wozu dient er?** Offizielle Hardware-Schnittstelle zur Stereolabs ZEDm-Kamera.
*   **Was macht er?** Erfasst die Umgebung in 3D und stellt visuelle Daten sowie Tiefeninformationen bereit.
*   **Wie funktioniert er?** Nutzt das ZED SDK, um hochauflösende Stereobilder und dichte 3D-Punktwolken (PointClouds) zu generieren. Diese Daten bilden das Fundament für die Environment-Kartierung (z.B. via OctoMap) und die 2D-Objekterkennung.

## 📂 Repository-Struktur

Das Projekt ist in das offizielle xArm-Repository und die eigenen Erweiterungen unterteilt:

```text
~/dev_ws/
    ├── start.sh                     # Start-Skripte für Simulation und echten Roboter

    └── src/                         # ROS 2 Workspace (Eigene und offizielle Pakete)
        ├── collision_check/         # Aktive Kollisionsvermeidung für den Roboterarm
        ├── eye_control/             # Visuelles Feedback-Display (Animierte Augen)
        ├── motion_sequence/         # Sichere Ausführung von Bewegungsabläufen
        ├── move_to_coordinator/     # Zentrale Logik (Verbindet Sprache & Vision mit Bewegung)
        ├── ros2_whisper/            # Lokale Speech-to-Text Erkennung (Whisper AI)
        ├── rviz_marker/             # 3D-Visualisierung (Rviz2) von Zielen und Hardware
        ├── voice_command_listener/  # Filterung und Intent-Erkennung von Sprachbefehlen
        ├── websocket/               # Web-Dashboard Backend und statische Code-Analyse
        ├── xarm_ros2/               # Offizieller xArm Treiber und MoveIt-Konfigurationen
        ├── yolo_object_detector/    # 2D-Objekterkennung und 3D-Lokalisierung (YOLO)
        ├── zed-ros2-examples/       # Offizielle ZED Anwendungsbeispiele
        └── zed-ros2-wrapper/        # Offizieller Hardware-Treiber für die Stereolabs ZEDm
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

4.  Source den Ros2 + Workspace:
    ```bash
    source /opt/ros/humble/setup.bash
    source install/setup.bash
    ```

## 🎮 Nutzung & Launch

Der Workspace wird bevorzugt über die Shell-Skripte im Hauptverzeichnis gestartet. Diese Skripte initialisieren die benötigten ROS 2 Nodes sowie die Websocket-Kommunikation.

* **Gesamtes System starten (Simulation/Fake):** 
  ```bash
  ./start.sh
  ```
  *(Startet den lokalen Webserver, den rosbridge_server, den Analyzer und den MoveIt Servo in einer Mock-Umgebung).*

* **Echten Lite6 Roboter starten:** 
  ```bash
  ./lite6.sh
  ```

Alternativ können einzelne Module wie gewohnt über ROS 2 Befehle gestartet werden:

* **Starten der Objekterkennung:** `ros2 run yolo_object_detector yolo_tracker_node`
* **Starten der ROS Bridge manuell:** `ros2 launch rosbridge_server rosbridge_websocket_launch.xml`

## 🖥️ ROS 2 Nexus (`ros2_nexus.py`)

*   **Wozu dient er?** Als zentrales, grafisches Control-Panel für den gesamten Workspace.
*   **Was macht er?** Desktop-Applikation zum Ausführen von ROS 2 Befehlen, Launch-Files und Bash-Skripten.
*   **Wie funktioniert er?** Nutzt `customtkinter` für eine Tab-basierte Navigation (Nodes, Web-Services, Daily Tools). Befehle werden als isolierte `subprocess`-Aufrufe in separaten, benannten `gnome-terminal`-Fenstern ausgeführt, was das Prozessmanagement und Debugging vereinfacht.

**Starten des Scripts:**
```bash
cd ~/dev_ws
python3 ros2_nexus.py
```

## 📊 Funktionsweise: Dashboard & Workspace Analyzer

Das System verknüpft die statische Code-Analyse mit den Live-Telemetriedaten des ROS 2 Netzwerks.

### 1. Der Workspace Analyzer (Backend)
Das Skript `workspace_analyzer.py` führt die statische Code-Analyse durch.
- **Code-Parsing:** Es durchsucht den gesamten `src/`-Ordner nach `.py`, `.cpp`, `.launch.py` und XML-Dateien. Die Analyse erfolgt ausführungsfrei über Abstract Syntax Trees (AST) und Regex.
- **Datenextraktion:** Es extrahiert ROS 2 Node-Namen, definierte Publisher, Subscriber, Services, Actions sowie Abhängigkeiten aus der `package.xml` und Einstiegspunkte aus `setup.py` oder `CMakeLists.txt`.
- **Kommunikation:** Das Skript bereitet die gesammelten Daten als strukturiertes JSON auf und publiziert diese fortlaufend über Standard-ROS-2-Topics (z.B. `/dashboard/workspace_metadata`). Bei Festplatten-Änderungen im Code aktualisiert der Analyzer diese Topics automatisch.

### 2. Das Dashboard (Frontend)
Das webbasierte Frontend (`dashboard_index.html` & `dashboard_script.js`) fungiert als zentraler Hub für die bereitgestellten Daten.
- **Websocket-Verbindung:** Das Frontend verbindet sich per Websocket ausschließlich mit dem `rosbridge_server` (Port 9090). Darüber liest es sowohl die statischen Metadaten des Analyzers als auch die laufenden ROS-Systemdaten in Echtzeit aus.
- **Daten-Fusion:** Das Dashboard gleicht die statisch analysierten Nodes mit den aktiven Nodes ab, um den Zustand (offline/aktiv) visuell darzustellen.
- **Echtzeit-Interaktion:** Über die `roslib.js` Bibliothek abonniert das Dashboard aktive Topics, liest Nachrichten in Echtzeit aus, berechnet Frequenzen (Hz) und ermöglicht es sogar, Launch-Files (`start.sh`, `lite6.sh`) direkt aus dem Browserfenster heraus als Systembefehle auszuführen.

### 3. Starten der Komponenten
- Websocket-Backend: `python3 src/websocket/workspace_analyzer.py`
- Webserver: `python3 -m http.server 8080 -d src/websocket`

Das Dashboard ist nach dem Start unter `http://localhost:8080/dashboard_index.html` erreichbar.
