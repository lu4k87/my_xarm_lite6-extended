# xArm ROS 2 Extended Workspace (ROS2 Humble) **[IN DEV]**

Dieses Repository ist eine kontinuierlich weiterentwickelte **Forschungs- und Evaluierungsplattform** für die multimodale Teleoperation und **Mensch-Computer-Interaktion (HCI)**. Es baut auf dem offiziellen [xarm_ros2 Repository](https://github.com/xArm-Developer/xarm_ros2/tree/humble) (Branch: `humble`) auf.

---

## 📋 Projektüberblick

**Konzept:** 
* Eine modulare Plattform zur Steuerung des xArm Lite 6 Roboters durch multimodale Eingabemethoden mit Fokus auf höchste **Usability**. <br><br>
**Motivation (Assistenz und Teilhabe):** <br>
* Klassische Teleoperation erfordert kognitiv anstrengende Feinsteuerung und bildet hohe technische Barrieren. Dieses Projekt zielt auf den Barriereabbau im Sinne der Industrie 5.0 ab, um Menschen mit unterschiedlichen physischen Voraussetzungen die produktive Teilhabe am Arbeitsplatz zu ermöglichen. <br><br>
**Funktionsprinzip:** <br>
* Das System nutzt einen **Shared-Control-Ansatz** ("Human-in-the-Loop"). Nutzer wechseln nahtlos zwischen intuitiven  Befehlen (z. B. Sprache/Blick) und präzisen manuellen Korrekturen (Gamepad). <br><br>
**Zielsetzung:** <br>
* Als reproduzierbarer, kosteneffizienter Proof-of-Concept für Forschung und Inklusionsprojekte zur Entwicklung und empirischen Evaluierung assistiver Robotiksysteme. <br>

---

## 🔬 Architektur & Leitprinzipien

* **Shared Control & Kognitive Entlastung:** 
Fließender Wechsel zwischen manueller und KI-gestützter Steuerung minimiert die mentale Beanspruchung.
* **HCI & Usability-Fokus:** 
Interaktionen verschieben sich von komplexen Low-Level-Steuerungen hin zur intentionsbasierten Aufgabenbewältigung.
* **Reproduzierbar & Open Source:** 
Transparente Codebasis für standardisierte wissenschaftliche Experimente.
* **Kosteneffiziente Hardware:** 
Erschwingliche Komponenten verbessern die Zugänglichkeit für Inklusions- und Forschungsprojekte.
* **Modular & Industriestandard:** 
Volle Integration in ROS 2 Humble für Kompatibilität mit etablierten Frameworks.

---

## 🚀 Multimodale Technologien & Interaktionskonzepte

### Steuerungsmethoden (Inputs)
* **Gamepad-Teleoperation:** <br> Latenzarme, kontinuierliche Feinsteuerung mittels Xbox One Elite Series 2 Controller.

* **Voice Control:** <br> Lokale Sprachverarbeitung (Whisper AI) zur semantischen, intentionsbasierten Steuerung über Mikrofon.

* **Eye-Tracking** (in Bearbeitung...): <br> Robotersteuerung und UI-Interaktion (Gaze-Tracking) über Tobii Pro Glasses 3.

* **Gestensteuerung** (in Bearbeitung...): <br> Berührungslose, intuitive Hand- und Fingererkennung zur direkten räumlichen Manipulation und Posensteuerung mittels Leap Motion Controller.

* **VR Controller Steuerung** (in Bearbeitung...): <br> Immersive, räumliche Teleoperation durch präzises 6DoF-Tracking (Six Degrees of Freedom) und haptisches Feedback mittels Virtual Reality Controllern.

### Wahrnehmung & Assistenz (Perception)
* **Computer Vision:** <br> Räumliche 2D-Objekterkennung und Lokalisierung mittels *YOLO* (aktuell über PiCameras).
* **Stereo Vision (Geplant):** <br> Integration von echten 3D-Tiefendaten über eine *ZED Mini (Stereolabs)* Kamera.
* **VLA & Video Action Models (Geplant):** <br> KI-gestützte Handlungsplanung durch *Vision-Language-Action* Modelle.

### Koordinatentransformation & Kalibrierung
* **ArUco-Marker-System:** <br> Im Operationsbereich des Roboters platzierte Marker dienen als Referenz für Homographie-Matrizen.
    * Ableitung von 3D-Weltkoordinaten für Objekte auf der Arbeitsplatte (Z = 90 mm).
    * Exakte Projektion der Eye-Tracking-Blickkoordinaten auf die Steuerungs-**UI**, um Blicke in Roboterbefehle zu übersetzen.

### Benutzeroberflächen (UI / GUI)
Für eine kognitiv entlastende Teleoperation wird dem Anwender ein zentrales, immersives User Interface bereitgestellt, das alle Systemzustände bündelt.
* **Umsetzung via OBS Studio:**<br>In *OBS Studio* werden alle Komponenten gebündelt und dem Nutzer als zentrale GUI für die Teleoperation des Roboters bereitgestellt.* **Telemetrie & Status:** <br> Fortlaufende Anzeige von Echtzeit-Telemetriedaten des Roboterarms.
* **System-Feedback & Intent-Erkennung:** <br> Direkte visuelle und akustische Rückmeldung bei manuellen Steuerungseingaben sowie bei erfolgreich geparsten Sprachbefehlen.
* **Präventive Kollisionswarnungen:** <br> Dynamische Warnhinweise bei Auslösung der softwareseitigen Kollisionsschutz-Maßnahmen (z.B. Unterschreiten des Z-Limits).
* **Visuelles Monitoring & Object Detection:** <br> Nahtlose Integration von Video-Livestreams mit Live-Overlays der erkannten Zielobjekte (YOLO-Bounding-Boxes) sowie einer synchronisierten 3D-Visualisierung (Digital Twin) der Arbeitsumgebung.

---

## 🖥️ Zentrale Steuerungselemente (GUI & UI)

* [**ROS 2 Nexus (GUI)**](#-ros-2-nexus-ros2_nexuspy) - Moderne Desktop-Oberfläche zum schnellen Starten von Nodes und Workspace-Skripten.
* [**Dashboard UI & Workspace Analyzer**](#-funktionsweise-dashboard--workspace-analyzer) - Webbasierte Echtzeit-Überwachung und Analyse des ROS-Netzwerks.

---

## ⚙️ Kernfunktionen & ROS 2 Nodes

### 👁️ Computer Vision & Wahrnehmung

* **`yolo_object_detector`**
    * **Zweck:** Objekterkennung und räumliche Lokalisierung (Würfel, Rechteck, Zylinder).
    * **Aufgabe:** Findet trainierte Objekte und ArUco-Marker im 2D-Bildstream; projiziert diese in 3D.
    * **Funktionsweise:** Liest RTSP/HTTP-Streams in einem Background-Thread. Transformiert YOLO-Bounding-Boxes via `cv2.findHomography` und ArUco-Markern in den 3D-Raum (Z=90 mm). Publiziert `PoseArray`-Nachrichten unter `/objects/<color>_<shape>/world_poses`.

### 🗣️ Sprachsteuerung & Interaktion

* **`ros2_whisper`**
    * **Zweck:** Lokale Speech-to-Text Erkennung.
    * **Aufgabe:** Wandelt gesprochene Nutzerbefehle in Text um.
    * **Funktionsweise:** Führt das Whisper-KI-Modell kontinuierlich auf dem Mikrofon-Stream aus und publiziert das Rohtranskript als String.
* **`voice_command_listener`**
    * **Zweck:** Interpretation und Filterung der Sprachtexte.
    * **Aufgabe:** Extrahiert Intents (z. B. "move to red"), blockiert Spam und gibt visuelles Dashboard-Feedback.
    * **Funktionsweise:** Abonniert `/whisper/text`, nutzt Regex-Filter und einen Entprell-Mechanismus (5 Sek. Cooldown im `action_cooldown` Dictionary), um redundante Befehle zu blockieren. Publiziert an `/voice_cmd` und `/ui/voice_feedback`.
* **`eye_control`**
    * **Zweck:** Robotersteuerung über Blickerfassung (**UI**-Interaktion).
    * **Aufgabe:** "God-Mode" PyQt5-Benutzeroberfläche zur reinen Blickeingabe.
    * **Funktionsweise:** Extrahiert JSON-Gaze2D-Daten aus dem RTSP-Stream. Nutzt ArUco-Marker zur Bildschirmerkennung und transformiert Blickkoordinaten in die **UI**. Bei 0,5 Sek. Dwell-Time auf einem Button wird ein `TwistStamped`-Befehl publiziert.

### 🧠 Logik & Koordination

* **`move_to_coordinator`**
    * **Zweck:** Zentrales "Gehirn" für aufgabenbasierte Bewegungen im **Shared Control**.
    * **Aufgabe:** Führt Sprach-/Blickbefehle mit Kameradaten zusammen und koordiniert Fahrkommandos.
    * **Funktionsweise:** State-Machine basierend. Reiht Intents ein, schickt den Roboter in eine Scan-Pose (`WAITING_FOR_ROBOT_IDLE`), blockiert 2,0 Sek. zur Bildstabilisierung, prüft die Frische der `PoseArray` und führt den kartesischen Service-Call aus.

### 🦾 Bewegung & Sicherheit

* **`motion_sequence`**
    * **Zweck:** Zustandsmanagement und ausfallsichere Ausführung von Bewegungen.
    * **Aufgabe:** Physische Steuerung und Umschalten der Hardware-Modi.
    * **Funktionsweise:** Bietet Action-Services (z. B. `execute_motion_to_pose`). Schaltet hardwarenah zwischen Servo- und Pose-Modus um. Bei Endeffektor-Höhe < 95 mm wird der Arm vor der Bewegung präventiv auf Z=150 mm angehoben (Kollisionsschutz).
* **`collision_check`**
    * **Zweck:** Hardware-Schutz (Unfallprävention Tischplatte).
    * **Aufgabe:** Prädiktiver Eingriff vor Kollisionen bei manueller Gamepad-Steuerung.
    * **Funktionsweise:** Filtert `/joy` und `/ufactory/get_position`. Berechnet zukünftige Z-Höhe voraus (`Z_neu = Z_aktuell + V_z * 0.1s`). Bei < 96,5 mm wird die Joy-Achse auf `0.0` genullt, der Nutzer über die **UI** gewarnt und ein Gamepad-Rumble ausgelöst.
* **`xarm_joystick_input`** *(Teil von `xarm_moveit_servo`)*
    * **Zweck:** Gamepad-Steuerung & Tasten-Mapping.
    * **Aufgabe:** C++ Node für gefilterte Joy-Signale und ROS-Service-Calls.
    * **Funktionsweise:** Abonniert den gefilterten `/joy_check`. Glättet Signale exponentiell (`factor = 0.5`). Mappings:
        * **D-Pad:** Geschwindigkeitsstufen (12,5% - 100%).
        * **Start/Back:** Referenzrahmen-Wechsel (Basis vs. Endeffektor).
        * **A/B:** Vakuum-Greifer-Steuerung.
        * **X:** Asynchroner Whisper-KI Trigger.
        * **Y:** Service-Call für Initial-Pose.

### 🖥️ UI & Visualisierung

* **`rviz_marker`**
    * **Zweck:** Optische Echtzeit-Rückmeldung im Rviz2.
    * **Aufgabe:** Visuelle Erweiterung der 3D-Simulation.
    * **Funktionsweise:** Verfolgt `link_eef` via TF2. Publiziert `MarkerArray` mit Pick-and-Place-Zielen (Würfel, Zylinder) und statischen 3D-Meshes (z. B. ZED-Kamera) zur Simulation ohne Live-YOLO-Daten.
* **`websocket`** *(Workspace Analyzer Backend)*
    * **Zweck:** Datenquelle für das Web-Dashboard.
    * **Aufgabe:** Überwacht das ROS-Netzwerk und den Quellcode.
    * **Funktionsweise:** `workspace_analyzer.py` nutzt AST zur ausführungsfreien Code-Analyse (`src/`). Überwacht Dateiänderungen (Watchdog) und publiziert JSON-Metadaten an ROS-Topics (z.B. `/dashboard/workspace_metadata`).
* **`rosbridge_server`**
    * **Zweck:** Websocket-Brücke für Webbrowser.
    * **Aufgabe:** Native Kommunikation zwischen Dashboard und Roboter.
    * **Funktionsweise:** Standardpaket für Websockets (Port 9090). Erlaubt es Webanwendungen, via `roslib.js` direkt mit dem ROS-Netzwerk zu interagieren.
* **`zed_wrapper`**
    * **Zweck:** Hardware-Treiber für Stereolabs ZEDm.
    * **Aufgabe:** Bereitstellung von 3D-Tiefendaten und PointClouds für Environment-Kartierung und Erkennung.

---


## 🛠️ Voraussetzungen

* **Das offizielle Repository:** [xarm_ros2 (Official)](https://github.com/xArm-Developer/xarm_ros2/tree/humble) (Branch: `humble`)
* **OS:** Ubuntu 22.04.5 (Jammy Jellyfish)
* **ROS:** ROS 2 Humble
* **Python:** Python 3.10+
* **System-Abhängigkeiten:** `portaudio19-dev` (für Audio-Input)
* **Zusätzliche Bibliotheken:**
* `pyaudio` (Spracherfassung)
* `ultralytics` (YOLO Object Detection)
* `opencv-python` (Bildverarbeitung)
* `rosbridge_suite` (Websocket-Kommunikation)
* `ros2 whisper` (Sprachkommandos)



---

## ⚙️ Installation & Setup

1. Kopiere das Repository:
```bash
git clone [https://github.com/lu4k87/my_xarm_lite6-extended.git](https://github.com/lu4k87/my_xarm_lite6-extended.git) dev_ws
cd dev_ws

```


2. Installiere alle ROS 2 Abhängigkeiten mit `rosdep`:
```bash
rosdep update
rosdep install --from-paths src --ignore-src -r -y

```


3. Baue den Workspace:
```bash
colcon build --symlink-install


```



```
4. Source den Ros2 + Workspace:
   ```bash
   source /opt/ros/humble/setup.bash
   source install/setup.bash
   

```

---

## 🎮 Nutzung & Launch

Der Start erfolgt bevorzugt über Skripte zur automatischen Initialisierung von Nodes und Websockets:

* **Gesamtes System starten (Simulation/Fake):**
```bash
./start.sh


```



```
  *(Startet Webserver, rosbridge_server, Analyzer & MoveIt Servo in Mock-Umgebung).*

* **Echten Lite6 Roboter starten:**
  ```bash
  ./lite6.sh
  

```

* **Manueller Einzelstart (Beispiele):**
* Objekterkennung: `ros2 run yolo_object_detector yolo_tracker_node`
* ROS Bridge: `ros2 launch rosbridge_server rosbridge_websocket_launch.xml`



---

## 🖥️ ROS 2 Nexus (`ros2_nexus.py`)

* **Konzept:** Eine zentrale **grafische Benutzeroberfläche (GUI)** für den gesamten Workspace. Ersetzt komplizierte CLI-Befehle durch direkte **Usability**.
* **Funktion:** Startet ROS 2 Befehle, Launch-Files und Bash-Skripte über Desktop-Buttons.
* **Technischer Ablauf:** Nutzt `customtkinter` für Tab-basierte Navigation. Befehle laufen als isolierte `subprocess`-Aufrufe in dedizierten `gnome-terminal`-Fenstern für besseres Debugging.

**Startbefehl:**

```bash
cd ~/dev_ws
python3 ros2_nexus.py

```

---

## 📊 Funktionsweise: Dashboard & Workspace Analyzer

Eine webbasierte **User Interface (UI)**, die statische Code-Analysen mit Live-Telemetriedaten des ROS 2 Netzwerks verknüpft.

### 1. Workspace Analyzer (Backend)

* Führt eine ausführungsfreie AST-Analyse (Abstract Syntax Trees) in `src/` nach ROS-Mustern durch.
* Extrahiert Node-Namen, Publisher, Subscriber, Services, Actions und Paketabhängigkeiten.
* Publiziert diese strukturierten JSON-Metadaten kontinuierlich an `/dashboard/workspace_metadata` (mit Watchdog für Live-Updates bei Code-Änderungen).

### 2. Dashboard (Frontend)

* Verbindet sich via Websocket (`rosbridge_server` on Port 9090).
* Gleicht statische Nodes visuell mit aktiven Nodes ab.
* Liest Topics via `roslib.js` in Echtzeit aus, berechnet Hz-Frequenzen und erlaubt die direkte Ausführung von Systemskripten (`start.sh`, `lite6.sh`) aus der Browser-**UI**.

### 3. Startbefehle der UI-Komponenten

* **Backend:** `python3 src/websocket/workspace_analyzer.py`
* **Webserver:** `python3 -m http.server 8080 -d src/websocket`
*(Dashboard erreichbar unter: `http://localhost:8080/dashboard_index.html`)*

```


```
