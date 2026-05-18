# xArm ROS 2 Extended Workspace (Humble)

Dieses Repository ist eine modular aufgebaute **Forschungs- und Evaluierungsplattform** für die Teleoperation und Mensch-Roboter-Interaktion (HCI), aufbauend auf dem offiziellen [xarm_ros2 Repository](https://github.com/xArm-Developer/xarm_ros2/tree/humble) (Branch: `humble`). 

Das Gesamtsystem (Hardware & Software) zielt darauf ab, optimale Rahmenbedingungen ("Human-in-the-Loop") für die robotergestützte Forschung zu schaffen. Es bietet ein Fundament, um neue Steuerungskonzepte, UI/GUI-Usability und multimodale Eingabemethoden für den xArm Lite6 zu entwickeln, zu testen und wissenschaftlich zu evaluieren.

### 🔬 Architektur & Prinzipien

Die Infrastruktur ist nach folgenden Kernkriterien konzipiert:
*   **Reproduzierbar & Open Source:** Transparente Codebasis für verlässliche wissenschaftliche Arbeit.
*   **Low-Cost:** Fokus auf erschwingliche Komponenten, um Forschungsprojekte zugänglich zu halten.
*   **Modular & Industriestandard:** Basiert durchgehend auf ROS 2 (Humble), was die nahtlose Integration bestehender und moderner Robotik-Frameworks garantiert.

### 🚀 Interaktionskonzepte & Roadmap

Die Plattform bündelt verschiedene Eingabemethoden und wird kontinuierlich weiterentwickelt:
*   **Computer Vision:** 2D/3D-Objekterkennung (YOLO) und räumliche Lokalisierung.
*   **Voice Control:** Lokale Sprachverarbeitung (Whisper AI) zur semantischen Steuerung.
*   **Teleoperation & UI:** Echtzeit-Überwachung und Steuerung über Web-Dashboards und Custom-GUIs.
*   **Eye-Tracking (In Entwicklung):** Robotersteuerung und UI-Interaktion über Blickerfassung.
*   **VLA & Video Action Models (Geplant):** Integration von Vision-Language-Action Modellen zur KI-gestützten Handlungsplanung.

---

### Zentrale Steuerungselemente:
- [**ROS 2 GUI Control Script**](#-ros-2-gui-control) - Moderne Desktop-Oberfläche zum schnellen Starten von Nodes und Workspace-Skripten.
- [**Dashboard UI & Workspace Analyzer**](#-dashboard-ui--workspace-analyzer) - Webbasierte Echtzeit-Überwachung und Analyse des ROS-Netzwerks.

## 🚀 Kernfunktionen & ROS 2 Nodes

Hier ist eine detaillierte Übersicht aller wesentlichen Pakete und Nodes in diesem Workspace. Jedes Modul ist nach seinem Zweck, seiner Aufgabe und seiner Funktionsweise strukturiert.

### 👁️ Computer Vision & Wahrnehmung

#### `yolo_object_detector`
*   **Wozu dient er?** Objekterkennung und räumliche Lokalisierung von Zielobjekten (z.B. farbige Blöcke) im Kamerabild.
*   **Was macht er?** Findet trainierte Objekte sowie ArUco-Marker im 2D-Bildstream und projiziert diese in den 3D-Raum des Roboters.
*   **Wie funktioniert er?** Nutzt ein YOLO-Modell auf dem 2D-RGB-Stream der ZED-Kamera. Die erkannten 2D-Pixelkoordinaten werden über eine berechnete Homographie-Matrix auf die Z=0 Ebene (Tischplatte) transformiert und als 3D-Posen (`PoseArray`) im ROS-Netzwerk publiziert.

### 🗣️ Sprachsteuerung & Interaktion

#### `ros2_whisper`
*   **Wozu dient er?** Lokale Spracherkennung (Speech-to-Text).
*   **Was macht er?** Nimmt gesprochene Worte des Nutzers auf und wandelt sie in digitalen Text um.
*   **Wie funktioniert er?** Greift auf den Audio-Stream des Mikrofons zu und führt kontinuierlich ein lokales Whisper-KI-Modell aus. Das resultierende rohe Text-Transkript wird in Echtzeit als String im ROS-Netzwerk veröffentlicht.

#### `voice_command_listener`
*   **Wozu dient er?** Interpretation und Filterung der rohen Sprachtexte.
*   **Was macht er?** Extrahiert handlungsrelevante Befehle aus den Sätzen (z.B. "Greife den roten Block") und blockiert Spam/Fehlerkennungen.
*   **Wie funktioniert er?** Subscribt die Texte von `ros2_whisper`, wendet Regex-Muster an, um Kommandos zu identifizieren (Intent Detection). Ein Entprell-Mechanismus (Refractory/Cooldown) sorgt dafür, dass derselbe Befehl nicht mehrfach kurz hintereinander feuert. Saubere Befehle werden an den Coordinator weitergeleitet.

#### `eye_control`
*   **Wozu dient er?** Visuelles Feedback und Roboterausdruck (Robot Expressions).
*   **Was macht er?** Zeigt animierte "Augen" auf einem angeschlossenen Display, um den Zustand des Roboters menschlicher zu kommunizieren.
*   **Wie funktioniert er?** Ist eine UI-Komponente, die auf bestimmte ROS-Nachrichten oder Systemzustände lauscht und daraufhin grafische Animationen (z.B. Blinzeln, Fokussieren, "Schlafen") auf einem lokalen Bildschirm rendert.

### 🧠 Logik & Koordination

#### `move_to_coordinator`
*   **Wozu dient er?** Das zentrale "Gehirn" für aufgabenbasierte Bewegungen.
*   **Was macht er?** Führt die Befehle des Nutzers mit den Zieldaten der Kamera zusammen und gibt die endgültigen Fahrkommandos.
*   **Wie funktioniert er?** Empfängt als zentraler Logik-Knoten die gefilterten Intents vom `voice_command_listener` (z.B. "move_to_red") und gleicht diese mit den aktuellen 3D-Koordinaten aus dem `yolo_object_detector` ab. Er verwaltet Warteschlangen (Queues) sowie Timeouts und triggert schließlich die Ausführung bei der `motion_sequence`.

### 🦾 Bewegung & Sicherheit

#### `motion_sequence`
*   **Wozu dient er?** Robuste Ausführung von Bewegungsabläufen und Zustandsmanagement des Roboter-Controllers.
*   **Was macht er?** Steuert den Roboterarm physisch an vorgegebene Posen und sorgt für das richtige Umschalten der Steuerungs-Modi.
*   **Wie funktioniert er?** Bietet ROS-Services (wie z.B. fahre zur Scan-Pose) an. Sobald getriggert, stoppt er ggf. laufende Servo-Kommandos, schaltet den xArm-Controller sicher in den POSE-Modus (Koordinatenansteuerung), führt asynchrone Bewegungen über MoveIt aus und wechselt bei Bedarf wieder in den Servo-Modus zurück.

#### `collision_check`
*   **Wozu dient er?** Aktive Unfallprävention und Schutz der Hardware (insbesondere der Tischplatte).
*   **Was macht er?** Greift ein, bevor der Roboter mit dem Tisch oder sich selbst kollidiert, wenn er manuell per Gamepad gesteuert wird.
*   **Wie funktioniert er?** Überwacht kontinuierlich die Z-Position des Endeffektors (via TF/Kinematik) in Relation zu den eingehenden Gamepad-Geschwindigkeitsbefehlen. Berechnet vorausschauend, ob der nächste Schritt das Z-Limit (z.B. 96.5mm) unterschreitet. Falls ja, werden die Abwärtsgeschwindigkeiten auf null genullt, bevor sie an den Controller geschickt werden.

#### `xarm_moveit_servo` (aus xarm_ros2)
*   **Wozu dient er?** Reibungslose Echtzeit-Teleoperation.
*   **Was macht er?** Übersetzt kontinuierliche Eingaben (z.B. Joystick-Achsen) in weiche Roboterbewegungen.
*   **Wie funktioniert er?** Empfängt Ziel-Geschwindigkeiten im Raum oder für einzelne Gelenke, berechnet über MoveIt Servo invers-kinematisch die benötigten Gelenkstellungen unter Berücksichtigung von Singularitäten und streamt diese hochfrequent (latenzarm) an den Hardware-Controller.

### 🖥️ UI & Visualisierung

#### `rviz_marker`
*   **Wozu dient er?** Optische Echtzeit-Rückmeldung im 3D-Simulator (Rviz2).
*   **Was macht er?** Macht die unsichtbaren Daten (wie berechnete Kamera-Ziele) in der Simulation für den Entwickler sichtbar.
*   **Wie funktioniert er?** Liest die 3D-Koordinaten der erkannten Objekte (`PoseArray`) und generiert daraus farbige, interaktive Rviz2-Marker (z.B. schwebende Würfel oder Zylinder). Zudem publiziert er statische Kollisionsobjekte und STL-Meshes (ZEDm-Kamera, Halterungen), um die URDF des Roboters in der Szene visuell zu vervollständigen.

#### `websocket` (Workspace Analyzer Backend)
*   **Wozu dient er?** Datenquelle für das Web-Dashboard.
*   **Was macht er?** Überwacht den Zustand des ROS-Netzwerks und analysiert den Quellcode des Workspaces.
*   **Wie funktioniert er?** Startet einen statischen Webserver auf Port 8080 für das Frontend. Parallel analysiert ein Python-Skript per Abstract Syntax Tree (AST) den Code im `src/`-Ordner nach Nodes, Topics und Services. Diese Meta-Daten werden über einen Websocket auf Port 8765 kontinuierlich als JSON an das Dashboard gestreamt.

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
    ├── octomap_anleitung.md         # Anleitung für 3D-Mapping mit der ZED-Kamera
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

## 🖥️ ROS 2 GUI Control (`ros2_gui_cmds.py`)

*   **Wozu dient er?** Als zentrales, grafisches Control-Panel (Fernbedienung) für den gesamten Workspace.
*   **Was macht er?** Bietet eine moderne Desktop-Oberfläche, um komplexe ROS 2 Befehle, Launch-Files und Bash-Skripte mit nur einem Klick zu starten, ohne tiefere Terminal-Kenntnisse vorauszusetzen.
*   **Wie funktioniert er?** Basierend auf der Python-Bibliothek `customtkinter` rendert das Skript ein dunkles "Midnight"-Theme mit Tabs für verschiedene Aufgabengebiete (Nodes, Web-Services, Daily Tools). Ein Klick auf einen Button führt im Hintergrund Systemaufrufe (`subprocess`) aus und öffnet für jeden Node ein dediziertes, benanntes `gnome-terminal`. Dies hält die Prozesse sauber getrennt und erleichtert das Debugging.

**Starten des Scripts:**
```bash
cd ~/dev_ws
python3 ros2_gui_cmds.py
```

## 📊 Funktionsweise: Dashboard & Workspace Analyzer

Das Monitoring-System besteht aus zwei eng verzahnten Hauptkomponenten, die statische Code-Analyse mit Live-Telemetrie aus dem laufenden ROS 2 System kombinieren.

### 1. Der Workspace Analyzer (Backend)
Das Python-Skript (`src/websocket/workspace_analyzer.py`) ist das Herzstück der statischen Analyse. 
- **Code-Parsing:** Es durchsucht den gesamten `src/`-Ordner nach `.py`, `.cpp`, `.launch.py` und XML-Dateien. Mithilfe von Python's `ast` (Abstract Syntax Tree) und Regex-Mustern analysiert es den Code tiefgreifend, *ohne* ihn ausführen zu müssen.
- **Datenextraktion:** Es extrahiert automatisch ROS 2 Node-Namen, definierte Publisher, Subscriber, Services, Actions sowie Abhängigkeiten aus `package.xml` und Einstiegspunkte aus `setup.py` oder `CMakeLists.txt`.
- **Kommunikation:** Die gesammelten Daten werden in einem strukturierten JSON-Format aufbereitet und über einen **Websocket-Server (Port 8765)** kontinuierlich an verbundene Clients gestreamt. Bei Code-Änderungen auf der Festplatte aktualisiert der Analyzer die Daten automatisch.

### 2. Das Dashboard (Frontend)
Das webbasierte Frontend (`dashboard_index.html` & `dashboard_script.js`) fungiert als zentraler Hub, der statische und dynamische Informationen zusammenführt.
- **Duale Verbindung:** Das Frontend baut gleichzeitig zwei Websocket-Verbindungen auf:
  1. Zum Workspace Analyzer (Port 8765), um die statische Projektstruktur und Launch-Files zu laden.
  2. Zum `rosbridge_server` (Port 9090), um sich live in das laufende ROS 2 Netzwerk einzuklinken.
- **Daten-Fusion:** Das Dashboard gleicht die statisch gefundenen Nodes (aus dem Code) mit den live laufenden Nodes (aus ROS) ab. Dadurch kann es anzeigen, welche programmierten Nodes gerade offline oder aktiv sind.
- **Echtzeit-Interaktion:** Über die `roslib.js` Bibliothek abonniert das Dashboard aktive Topics, liest Nachrichten in Echtzeit aus, berechnet Frequenzen (Hz) und ermöglicht es sogar, Launch-Files (`start.sh`, `lite6.sh`) direkt aus dem Browserfenster heraus als Systembefehle auszuführen.

### 3. Starten der Komponenten
- Websocket-Backend: `python3 src/websocket/workspace_analyzer.py`
- Webserver: `python3 -m http.server 8080 -d src/websocket`

Das Dashboard ist nach dem Start unter `http://localhost:8080/dashboard_index.html` erreichbar.
