# xArm ROS 2 Extended Workspace (ROS2 Humble) **[IN DEV]**

Dieses Repository ist eine sich kontinuierlich weiterentwickelnde Forschungs- und Evaluationsplattform für multimodale Teleoperation und Mensch-Computer-Interaktion (HCI). <br>
Es baut auf dem offiziellen xarm_ros2 Repository auf: https://github.com/xArm-Developer/xarm_ros2/tree/humble (Branch: humble).

## Inhaltsverzeichnis
1. [📋 Projektübersicht](#1--projektübersicht)
2. [🔬 Architektur & Leitprinzipien](#2--architektur--leitprinzipien)
3. [🚀 Quick Start: ROS 2 Nexus (Das zentrale Launch-Tool)](#3--quick-start-ros-2-nexus-das-zentrale-launch-tool)
4. [📊 Monitoring: Dashboard & Workspace Analyzer](#4--monitoring-dashboard--workspace-analyzer)
5. [🕹️ Multimodale Technologien & Interaktionskonzepte](#5-️-multimodale-technologien--interaktionskonzepte)
6. [⚙️ Core Features & ROS 2 Nodes (Deep Dive)](#6-️-core-features--ros-2-nodes-deep-dive)

---

## 1. 📋 Projektübersicht

**`Konzept:`**
* Eine modulare Plattform zur Steuerung des xArm Lite 6 Roboters durch multimodale Eingabemethoden mit Fokus auf maximale Usability.

**`Motivation (Assistenz und Teilhabe):`**
* Klassische Teleoperation erfordert kognitiv stark beanspruchende Feinsteuerung und schafft hohe technische Barrieren. 
* Dieses Projekt zielt darauf ab, im Sinne von Industrie 5.0 Barrieren abzubauen und Menschen mit unterschiedlichen physischen Voraussetzungen die produktive Teilhabe am Arbeitsplatz zu ermöglichen.

**`Funktionsprinzip:`**
* Das System nutzt einen Shared-Control-Ansatz ("Human-in-the-Loop"). 
* Der Nutzer wechselt nahtlos zwischen intuitiven Befehlen (z. B. Sprache/Blicksteuerung) und präzisen manuellen Korrekturen (Gamepad).

**`Zielsetzung:`**
* Als reproduzierbarer, kosteneffizienter Proof-of-Concept für Forschungs- und Inklusionsprojekte, um assistive Robotiksysteme zu entwickeln und empirisch zu evaluieren.

**`Evaluationslogik & Guidelines:`**
* Entwicklung einer Evaluationslogik für die Interaktionsqualität. 
* Daraus abgeleitete Guidelines sollen Unternehmen (z. B. bei der geplanten Einführung von Robotern) als Leitfaden dienen und die Frage beantworten: "Wie gehen wir vor, um den Anforderungen der Industrie 5.0 gerecht zu werden?". 
* Diese Guidelines können potenziell auch als monetarisierbare Dienstleistung für die Industrie bereitgestellt werden.

---

## 2. 🔬 Architektur & Leitprinzipien

### Die Systemidee: Eine integrierte Entwicklungs-, Evaluierungs- und Validierungsplattform

Das Kernziel des Projekts ist die Realisierung einer modularen, plattformbasierten Softwarearchitektur für die multimodale Teleoperation und KI-gestützte Assistenzrobotik. Das System fungiert als zentraler, softwareseitiger Integrationsknoten (Middleware-Ebene), der heterogene Teilsysteme in einer einheitlichen Laufzeitumgebung zusammenführt. Durch ein verteiltes Server-Client-Netzwerk (Multi-PC-Setup) und die softwareseitige Kopplung an einen echtzeitfähigen Digitalen Zwilling (NVIDIA Isaac Sim) dient die Plattform sowohl als flexible Entwicklungsumgebung als auch als standardisierte und replizierbare Testumgebung.

Das Projekt ist explizit als geschlossener Kreislauf aus Entwicklung und empirischer Validierung konzipiert. Die Plattform verfügt über eine integrierte Logging- und Datenakquisitions-Infrastruktur, um während der Systemnutzung sowohl technische Leistungsparameter als auch menschliche Interaktionsdaten zeitsynchron aufzuzeichnen. Die Architektur ist inhärent darauf ausgelegt, ein breites Spektrum an Modalitäten flexibel zu orchestrieren und messtechnisch zu erfassen:

* **Sensorik & Perzeption:** Integration von Tiefenkameras (z. B. Objekterkennung via YOLO, Marker-Tracking) und taktilen oder physiologischen Sensoren zur Zustandserfassung.
* **Multimodale Steuerung:** Parallele Einbindung diverser Eingabekanäle wie Eye-Tracking-Systeme zur Blickzielerfassung, Sprachsteuerung (z. B. via OpenAI Whisper) sowie klassische Hardware-Controller (Gamepads, 3D-Mäuse).
* **Kognitive Robotik:** Einbindung moderner Vision-Language-Action-Modelle (VLA), um hochgradig abstrakte, sprachliche und visuelle Befehle direkt in robotische Handlungssequenzen zu übersetzen.

### Human-Centered Automation

Die Systemarchitektur stellt den menschlichen Operator ins Zentrum des Interaktionsdesigns. Das System wird so konzipiert, dass Nutzer den aktuellen Automatisierungszustand – insbesondere bei der parallelen Verarbeitung von Blickbewegungen (Eye-Tracking) und sensorischen Rückmeldungen – durchgängig kognitiv erfassen und nachfolgende Systemaktionen antizipieren können. Diese Transparenz bricht algorithmische Black-Box-Strukturen auf. Sie befähigt den Operator zu fundierten Interventionen in kritischen Situationen und bildet die Basis für den Aufbau eines kalibrierten Systemvertrauens (*Trust in Automation*), welches im Rahmen von Nutzerstudien quantitativ und qualitativ evaluiert wird.

### Shared Control & Kognitive Entlastung

Ein Kernmerkmal der Softwarearchitektur ist die Implementierung von *Shared-Control*-Paradigmen zur kooperativen Aufgabenbewältigung. Die Plattform ermöglicht einen nahtlosen, latenzarmen Wechsel der Kontrollhoheit zwischen manueller Führung (z. B. via MoveIt Servo / Gamepad), blickgesteuerten Interaktionen (Eye-Tracking-Targeting) und KI-gestützten, teilautomatisierten Assistenzfunktionen. Durch diese kontextabhängige Aufteilung der Kontrollanteile wird die mentale Arbeitsbelastung (*Mental Workload*) des Nutzers minimiert. Das System kompensiert fehleranfällige Low-Level-Korrekturen autonom, wodurch kognitive Ressourcen für die übergeordnete Prozessüberwachung freigesetzt werden. Die Effektivität dieser Entlastung wird im Projektverlauf über standardisierte psychometrische Verfahren empirisch validiert.

### HCI & Usability Fokus & Empirische Evaluation

Die Gestaltung der zentralen Steuerungsschnittstelle (GUI) folgt etablierten Prinzipien der Mensch-Computer-Interaktion (HCI). Die Interaktionsmuster verschieben sich von der komplexen Koordination einzelner Freiheitsgrade oder dem manuellen Aufrufen verteilter Terminal-Prozesse hin zu einer intentionsbasierten Aufgabenbewältigung. Der Operator kommuniziert abstrakte Handlungsabsichten – sei es per Sprache, Blickziel oder High-Level-Controller –, welche die Plattform oder integrierte VLA-Modelle autonom in kinematische Trajektorien übersetzt.

Ein integraler Bestandteil des Projekts ist die Durchführung systematischer Benutzerstudien zur Evaluierung dieser multimodalen Schnittstellen. Hierbei werden standardisierte Usability-Metriken (wie die *System Usability Scale*, SUS) und objektive Leistungsdaten (z. B. Task Completion Time, Fehlerraten, Blickbewegungspfade) erhoben, um die Gebrauchstauglichkeit und die kognitive Beanspruchung (z. B. via *NASA-TLX*) empirisch abzusichern und das System iterativ zu optimieren.

### Reproduzierbar & Open Source

Zur Gewährleistung wissenschaftlicher Validität ist das Projekt als Open-Source-Architektur angelegt. Die Offenlegung der vollständigen Codebasis sichert die methodische Transparenz aller Algorithmen, Konfigurationen (URDFs, MoveIt-Konfigurationen) und Datenflüsse. Dies ermöglicht unabhängigen Forschungsgruppen eine exakte Replikation der Experimente inklusive der Validierung komplexer Sensordatenströme und Steuerungseingaben. Es sichert die statistische Verifizierbarkeit der Evaluationsergebnisse und etabliert die Plattform als standardisierte Benchmark für komparative Studien im Bereich der Assistenz- und Inklusionsrobotik.

### Kosteneffiziente Hardware

Die Systemkonfiguration basiert primär auf ökonomisch erschwinglichen, kommerziell verfügbaren Komponenten (COTS) – wie dem UFactory xArm Lite 6, Standard-Tiefenkameras und gängigen Consumer-Controllern –, ohne die erforderliche Präzision und funktionale Zuverlässigkeit zu kompromittieren. Durch die Reduktion investiver Barrieren wird der Zugang zu moderner, multimodal gesteuerter Robotiktechnologie demokratisiert. Im Rahmen des Projekts wird gezielt evaluiert, inwieweit diese kosteneffiziente Hardware im Vergleich zu hochpreisigen Industriesystemen eine valide und verlässliche Forschungs- und Einsatzplattform für inklusive Projekte und Bildungseinrichtungen darstellt.

### Modular & Industrie-Standard

Die softwareseitige Infrastruktur ist modular gekapselt und vollständig in das Middleware-Framework ROS 2 Humble integriert. Die native Nutzung standardisierter Kommunikationsprimitive (Nodes, Topics, Services, Actions) sichert die Interoperabilität mit industriellen Ökosystemen wie MoveIt 2 sowie modernen Sensor- und Tracking-SDKs. Diese modulare Entkopplung gewährleistet, dass einzelne Subsysteme – wie VLA-Pipelines zur Intentionserkennung, spezifische Eye-Tracking-Treiber, neue Eingabegeräte oder die Simulationsbrücke zum Digitalen Zwilling – als eigenständige Module ausgetauscht, erweitert oder isoliert evaluiert werden können, ohne das Gesamtsystem modifizieren zu müssen.

---

## 3. 🚀 Quick Start: ROS 2 Nexus (Das zentrale Launch-Tool)

**ROS 2 Nexus** ist das primäre, zentrale Werkzeug dieses Repositories. Es handelt sich um eine webbasierte GUI, die als Hauptzentrale dient, um alle Nodes, Sensoren, Algorithmen und Workspace-Scripte mit nur einem Klick zu starten. Anstatt sich lange CLI-Befehle zu merken und einzutippen, steuerst du das gesamte Robotersystem direkt aus deinem Browser.

### 3.1 Startbefehle & Ubuntu App Integration

**Start über Terminal:**
```bash
cd ~/dev_ws
python3 _exec/ros2_nexus_web.py
# → Öffnet sich unter http://localhost:5000 (auch im LAN erreichbar, z.B. http://192.168.x.x:5000)
```

**Quick Launch (Backend automatisch starten + Browser öffnen):**
```bash
./_exec/ros2_nexus_web_start.sh
```

> **Ubuntu App Integration:** ROS 2 Nexus ist als native Ubuntu-Anwendung über einen `.desktop`-Eintrag registriert. Du kannst einfach im Ubuntu-Aktivitäten-Menü nach **„ROS 2 Nexus"** suchen, um die App direkt über ihr Icon zu starten.

<p align="center">
  <img src="_imgs/ros2_nexus_web.png" width="90%" alt="ROS 2 Nexus — Web Edition">
</p>

### 3.2 Netzwerk- & Port-Architektur

Um das komplette System mit beiden Web-Oberflächen (Nexus und Dashboard) zu nutzen, laufen im Hintergrund drei verschiedene Server auf drei separaten Ports:

| Port | Service | Typ | Beschreibung |
|------|---------|-----|--------------|
| **`5000`** | **ROS 2 Nexus Web** | Flask Backend | Stellt die grafische Nexus-Oberfläche bereit. Empfängt Klicks aus dem Browser und führt ROS-Shell-Befehle als Unterprozesse auf dem Host-PC aus. |
| **`8080`** | **Dashboard Frontend** | HTTP Server | Hostet die statischen HTML/CSS/JS-Dateien für das ROS2 Core Dashboard. |
| **`9090`** | **ROS Bridge** | WebSocket | Die Brücke zwischen ROS 2 und dem Browser. Erlaubt dem Dashboard (Port 8080), sich über `roslib.js` direkt mit dem ROS-Netzwerk zu verbinden, um Echtzeit-Telemetrie auszulesen und Services aufzurufen. |

---

## 4. 📊 Monitoring: Dashboard & Workspace Analyzer

Sobald du deine Nodes über ROS 2 Nexus gestartet hast, kannst du den Live-Zustand deines Systems über das **ROS2 Core Dashboard** überwachen. Dies ist eine webbasierte Echtzeit-UI, die statische Quellcode-Analysen mit Live-Telemetriedaten des ROS 2 Netzwerks zu einer einheitlichen Monitoring-Oberfläche zusammenführt.

### 4.1 Backend (`workspace_analyzer.py`)
Ein ROS 2 Node, der eine ausführungsfreie, regex-basierte statische Code-Analyse des gesamten `src/`-Verzeichnisses durchführt. Dabei werden Node-Namen, Publisher, Subscriber, Services, Actions und Paketabhängigkeiten extrahiert. Diese strukturierten JSON-Metadaten werden kontinuierlich an `/dashboard/workspace_metadata` publiziert (im 10-Sekunden-Timer-Zyklus). Zusätzlich werden Umgebungsvariablen (ROS Distro, Domain ID, DDS-Middleware, Localhost-Modus) aus `~/.bashrc` ausgelesen und als Live-Status-Badges bereitgestellt.

> **Hinweis zu `workspace_analyzer.py`:** Dies ist **kein** Netzwerk-Server, sondern ein normaler ROS 2 Node. Das Dashboard greift über die ROS Bridge (Port 9090) auf dessen publizierte Topics zu.

### 4.2 Frontend (`dashboard_index.html`)
Verbindet sich über WebSocket (`rosbridge_server` auf Port 9090) mit dem ROS-Netzwerk. Es gleicht statisch analysierte Nodes visuell mit den aktuell laufenden Nodes ab, zeigt Echtzeit-Topic-Frequenzen (Hz) an und ermöglicht die direkte Ausführung von System-Skripten aus der Browser-Oberfläche. Die Sidebar liefert auf einen Blick Statusinformationen wie Verbindungsgesundheit, Roboter-Verfügbarkeit und die aktive ROS 2 Umgebungskonfiguration.

![ROS2 Core - Dashboard](_imgs/dashboard_nodes.png)

### 4.3 Startbefehle der UI-Komponenten
*Starte diese Komponenten über ROS 2 Nexus oder manuell über das Terminal:*
* **Backend:** `python3 src/websocket/workspace_analyzer.py`
* **Webserver:** `python3 -m http.server 8080 -d src/websocket`
* *(Dashboard erreichbar unter: `http://localhost:8080/dashboard_index.html`)*

---

## 5. 🕹️ Multimodale Technologien & Interaktionskonzepte

### 5.1 Roboter-Steuerungsarten (Inputs)
**Gamepad Teleoperation:** <br> 
* Latenzarme, kontinuierliche Feinsteuerung per Xbox One Elite Series 2 Controller (inkl. haptischem Feedback - Vibration bei Kollisionsgefahr).

**Sprachsteuerung:** <br> 
* Lokale Sprachverarbeitung (Whisper AI) für semantische, intentionsbasierte Steuerung via Mikrofon.

**Eye-Tracking** (in Bearbeitung...): <br> 
* Robotersteuerung und UI-Interaktion (Blickerfassung) über Tobii Pro Glasses 3.

**Gestensteuerung** (in Bearbeitung...): <br> 
* Berührungslose, intuitive Hand- und Fingererkennung zur direkten räumlichen Manipulation und Gestensteuerung über Leap Motion.

**VR-Controller Steuerung** (in Bearbeitung...): <br>
* Immersive, räumliche Teleoperation durch präzises 6DoF-Tracking (Six Degrees of Freedom) und haptisches Feedback mittels Virtual Reality Controllern.

### 5.2 Sensorik & Assistenz (Perception)
**Computer Vision:** <br> 
* Räumliche 2D-Objekterkennung und Lokalisierung mittels *YOLO* (aktuell über PiCameras).
**Stereo Vision (Geplant):** <br>
* Integration echter 3D-Tiefendaten durch eine *ZED Mini (Stereolabs)* Kamera.
**VLA & Video Action Models (Geplant):** <br>
* KI-gestützte Handlungsplanung durch *Vision-Language-Action* Modelle.

### 5.3 Koordinatentransformation & Kalibrierung
**ArUco Marker System:** <br> 
* Im Arbeitsbereich des Roboters platzierte Marker dienen als Referenz für Homographie-Matrizen.
* Ableitung von 3D-Weltkoordinaten für Objekte auf der Arbeitsfläche (Z = 90 mm).
* Präzise Projektion von Eye-Tracking Blickkoordinaten auf die Steuerungs-**UI**, um den Blick in Roboterbefehle zu übersetzen.

### 5.4 User Interfaces (UI/GUI)
Für eine kognitiv entlastende Teleoperation steht dem Nutzer ein zentrales, immersives User Interface zur Verfügung, das alle Systemzustände bündelt.

**Telemetrie & Status:** <br> 
* Kontinuierliche Anzeige von Echtzeit-Telemetriedaten des Roboterarms.
  
**System Feedback & Intent Recognition:** <br>
* Direktes visuelles und akustisches Feedback für manuelle Steuereingaben sowie erfolgreich geparste Sprachbefehle.
  
**Präventive Kollisionswarnungen:** <br> 
* Dynamische Warnungen beim Eingreifen softwareseitiger Kollisionsschutzmaßnahmen (z.B. Unterschreiten des Z-Limits).
  
**Visuelles Monitoring & Objekterkennung:** <br>
* Nahtlose Integration von Video-Livestreams mit Live-Overlays erkannter Zielobjekte (YOLO Bounding Boxes) sowie einer synchronisierten 3D-Visualisierung (Digitaler Zwilling) der Arbeitsumgebung.

**Umsetzung via OBS Studio:**<br>
* In *OBS Studio* werden alle Komponenten gebündelt und dem Nutzer als zentrale GUI für die Roboter-Teleoperation bereitgestellt.*


**Gaze Control User Interface**<br>

![Gaze Control UI](_imgs/gaze_control_interface.png)

---

## 6. ⚙️ Core Features & ROS 2 Nodes (Deep Dive)

### 6.1 👁️ Computer Vision & Perception

* **`yolo_object_detector`**
    * **Zweck:** Objekterkennung und räumliche Lokalisierung (Würfel, Rechteck, Zylinder).
    * **Aufgabe:** Findet trainierte Objekte und ArUco-Marker im 2D-Bildstream; projiziert diese in 3D.
    * **Funktionsweise:** Liest RTSP/HTTP-Streams im Background-Thread. Transformiert YOLO Bounding Boxes via `cv2.findHomography` und ArUco-Markern in den 3D-Raum (Z=90 mm). Publiziert `PoseArray`-Nachrichten unter `/objects/<color>_<shape>/world_poses`.

### 6.2 🗣️ Sprachsteuerung & Interaktion

* **`ros2_whisper`**
    * **Zweck:** Lokale Speech-to-Text Erkennung.
    * **Aufgabe:** Wandelt gesprochene Nutzerbefehle in Text um.
    * **Funktionsweise:** Führt das Whisper-KI-Modell kontinuierlich auf dem Mikrofon-Stream aus und publiziert das reine Transkript als String.
* **`voice_command_listener`**
    * **Zweck:** Interpretation und Filterung des Sprachtextes.
    * **Aufgabe:** Extrahiert Intents (z.B. "fahre zu rot"), blockiert Spam und gibt visuelles Dashboard-Feedback.
    * **Funktionsweise:** Abonniert `/whisper/text`, nutzt Regex-Filter und einen Debounce-Mechanismus (5 Sek. Cooldown im `action_cooldown` Dictionary), um redundante Befehle abzublocken. Publiziert an `/voice_cmd` und `/ui/voice_feedback`.
* **`eye_control`**
    * **Zweck:** Robotersteuerung durch Blickerfassung (**UI** Interaktion).
    * **Aufgabe:** "God-Mode" PyQt5 Benutzeroberfläche für reine Blickeingabe.
    * **Funktionsweise:** Extrahiert JSON Gaze2D-Daten aus dem RTSP Stream. Nutzt ArUco-Marker zur Bildschirm-Erkennung und transformiert Blickkoordinaten in die **UI**. Bei 0,5 Sek. Verweildauer (Dwell-Time) auf einem Button wird ein `TwistStamped`-Befehl publiziert.

### 6.3 🧠 Logik & Koordination

* **`move_to_coordinator`**
    * **Zweck:** Zentrales "Gehirn" für task-basierte Bewegungen im **Shared Control**.
    * **Aufgabe:** Führt Sprach-/Blickbefehle mit Kameradaten zusammen und koordiniert Fahrbefehle.
    * **Funktionsweise:** State-Machine basiert. Queued Intents, sendet den Roboter auf eine Scan-Pose (`WAITING_FOR_ROBOT_IDLE`), blockiert 2,0 Sek. zur Bildstabilisierung, prüft die Aktualität des `PoseArray` und führt den kartesischen Service Call aus.

### 6.4 🦾 Bewegung & Sicherheit

* **`motion_sequence`**
    * **Zweck:** Zustandsverwaltung und sichere Ausführung von kartesischen Bewegungen.
    * **Aufgabe:** Physische Steuerung und Umschalten von Hardware-Modi.
    * **Funktionsweise:** Stellt Action-Services (z.B. `execute_motion_to_pose`) bereit. Schaltet auf Hardware-Ebene zwischen Servo- und Pose-Mode um. Bei Endeffektor-Höhe < 95 mm wird der Arm vor der Fahrt präventiv auf Z=150 mm angehoben (Kollisionsschutz).
* **`collision_check`**
    * **Zweck:** Hardwareschutz (Verhinderung von Tischkollisionen).
    * **Aufgabe:** Prädiktives Eingreifen vor Kollisionen bei manueller Gamepad-Steuerung.
    * **Funktionsweise:** Filtert `/joy` und `/ufactory/get_position`. Berechnet zukünftige Z-Höhe voraus (`Z_new = Z_current + V_z * 0.1s`). Unter 96,5 mm wird die Joy-Achse auf `0.0` genullt, der Nutzer über die **UI** gewarnt und ein Gamepad-Rumble ausgelöst.
* **`xarm_joystick_input`** *(Teil von `xarm_moveit_servo`)*
    * **Zweck:** Gamepad-Steuerung & Button-Mapping.
    * **Aufgabe:** C++ Node für gefilterte Joy-Signale und ROS Service Calls.
    * **Funktionsweise:** Abonniert das gefilterte `/joy_check`. Glättet Signale exponentiell (`factor = 0.5`). Mappings:
        * **D-Pad:** Geschwindigkeitsstufen (12.5% - 100%).
        * **Start/Back:** Referenzsystem-Umschaltung (Base vs. Endeffektor).
        * **A/B:** Vakuumgreifer-Steuerung.
        * **X:** Asynchroner Whisper AI Trigger.
        * **Y:** Service Call für initiale Pose.

### 6.5 🖥️ Monitoring(Dashboard),UI & Visualisierung

* **`rviz_marker`**
    * **Zweck:** Visuelles Live-Feedback in RViz2.
    * **Aufgabe:** Optische Aufwertung der 3D-Simulation.
    * **Funktionsweise:** Trackt `link_eef` via TF2. Publiziert `MarkerArray` mit Pick-and-Place-Zielen (Würfel, Zylinder) und statische 3D-Meshes (z.B. ZED Kamera) zur Simulation ohne Live-YOLO-Daten.
* **`websocket`** *(Workspace Analyzer Backend)*
    * **Zweck:** Datenquelle für das Web-Dashboard.
    * **Aufgabe:** Überwacht das ROS-Netzwerk und den Quellcode.
    * **Funktionsweise:** `workspace_analyzer.py` nutzt Regex für ausführungsfreie Code-Analyse (`src/`). Überwacht Dateiänderungen und publiziert JSON-Metadaten auf ROS-Topics (z.B. `/dashboard/workspace_metadata`).
* **`rosbridge_server`**
    * **Zweck:** WebSocket Bridge für Web-Browser.
    * **Aufgabe:** Native Kommunikation zwischen Dashboard und Roboter.
    * **Funktionsweise:** Standard-Paket für WebSockets (Port 9090). Erlaubt Webanwendungen, via `roslib.js` direkt mit dem ROS-Netzwerk zu interagieren.
* **`zed_wrapper`**
    * **Zweck:** Hardware-Treiber für Stereolabs ZEDm.
    * **Aufgabe:** Direktes Streaming an RViz2 und Logik-Nodes ohne Drittsoftware.
    * **Funktionsweise:** Nativer C++ Node, der den generischen USB-Cam Node ersetzt. Publiziert `Image` und `CameraInfo` unter `/zed/zed_node/...`.

---
