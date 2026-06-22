# xArm ROS 2 Extended Workspace (ROS2 Humble) **[IN DEV]**


Dieses Repository ist eine sich kontinuierlich weiterentwickelnde Forschungs- und Evaluationsplattform für multimodale Teleoperation und Mensch-Computer-Interaktion (HCI). <br>
> [!IMPORTANT]
> **Grundvoraussetzung:** Dieses Repository ist ein *Erweiterungs-Workspace*. Es baut vollständig auf dem offiziellen [xarm_ros2 Repository (Branch: humble)](https://github.com/xArm-Developer/xarm_ros2/tree/humble) von UFactory auf. Das offizielle Repository, dessen Struktur und all seine Systemabhängigkeiten bilden das zwingende Basis-Fundament für diese Software!

<p align="center">
 <img src="_imgs/robotsystem.jpg" width="90%" alt="xArm Extended Workspace in Aktion">
</p>

## Inhaltsverzeichnis
1. [📋 Projektübersicht](#chapter-1)
2. [🔬 Architektur & Leitprinzipien](#chapter-2)
   - [2.1 Betriebsmodi: FAKE vs. REAL (Hardware Interfaces)](#subchapter-2-1)
   - [2.2 Die Systemidee: Eine integrierte Entwicklungs-, Evaluierungs- und Validierungsplattform](#subchapter-2-2)
3. [📊 Monitoring: Dashboard & Workspace Analyzer](#chapter-3)
   - [3.1 Workspace Analyzer Backend (`workspace_analyzer.py`)](#subchapter-3-1)
   - [3.2 Frontend (`dashboard_index.html`)](#subchapter-3-2)
   - [3.3 Startbefehle der UI-Komponenten](#subchapter-3-3)
4. [🕹️ Multimodale Technologien & Interaktionskonzepte](#chapter-4)
   - [4.1 Roboter-Steuerungsarten (Inputs)](#subchapter-4-1)
   - [4.2 Sensorik & Assistenz (Perception)](#subchapter-4-2)
   - [4.3 Koordinatentransformation & Kalibrierung](#subchapter-4-3)
   - [4.4 User Interfaces (UI/GUI)](#subchapter-4-4)
5. [⚙️ Core Features & ROS 2 Nodes](#chapter-5)
   - [🎮 5.1 Funktion: Gamepad Teleoperation & Harter Kollisionsschutz](#subchapter-5-1)
   - [🟢 5.2 Funktion: Autonomes Greifen & 3D Objekterkennung (YOLO / ZED)](#subchapter-5-2)
   - [🗣️ 5.3 Funktion: Multimodale Interaktion (Sprache & Blicksteuerung)](#subchapter-5-3)
   - [🖥️ 5.4 Funktion: Grafische Steuerung & Visuelles Feedback](#subchapter-5-4)
   - [🤖 5.5 Funktion: Komplexe Trajektorien & Task-Koordination](#subchapter-5-5)
   - [⚠️ 5.6 Veraltete / Deprecated Module](#subchapter-5-6)
6. [🎮 Gamepad-Steuerung — Technische Tiefenanalyse](#chapter-6)
   - [6.1 Pipeline-Architektur](#subchapter-6-1)
   - [6.2 `checker.py` — Kollisionswächter (Python Node)](#subchapter-6-2)
   - [6.3 `xarm_joystick_input.cpp` — Motion Controller (C++ Node)](#subchapter-6-3)
7. [📦 Abhängigkeiten & Voraussetzungen](#chapter-7)
8. [🚀 Ausführung: Systemstart](#chapter-8)
   - [8.1 Schritt 1: Hardware vorbereiten](#subchapter-8-1)
   - [8.2 Schritt 2: System starten (ROS 2 Nexus)](#subchapter-8-2)
   - [8.3 Schritt 3: Module über die GUI aktivieren](#subchapter-8-3)
   - [8.4 Netzwerk- & Port-Architektur](#subchapter-8-4)
   - [8.5 Verteilte Steuerung (Remote / Operator-Station)](#subchapter-8-5)
   - [8.6 DDS Multicast Storm Prevention (Kritisch)](#subchapter-8-6)
   - [8.7 Launcher-Konfiguration (`launcher_config.json`)](#subchapter-8-7)
   - [8.8 DDS Multicast Storm & Loopback Discovery (Kritisch)](#subchapter-8-8)
   - [8.9 CycloneDDS UDP Buffer Overflows (Point Cloud Lag)](#subchapter-8-9)
9. [🗂️ Repository-Struktur](#chapter-9)

---

## <a id="chapter-1"></a> 1. 📋 Projektübersicht

### Konzept: Eine integrierte, multimodale Teleoperationsplattform
Das primäre Ziel dieses Projekts ist die Entwicklung und Implementierung einer modularen Steuerungs- und Interaktionsplattform für den Roboterarm UFactory xArm Lite 6. Das System bündelt heterogene, multimodale Eingabemethoden in einer zentralisierten Softwareumgebung und legt den Fokus konsequent auf eine maximierte Usability und intuitive Bedienbarkeit. Das System übernimmt die Berechnung der komplizierten Roboterbewegungen im Hintergrund. Dadurch entsteht eine einfache Schnittstelle, die die Wünsche des Nutzers direkt in Aktionen des Roboters übersetzt.

### Motivation: Assistenz, Inklusion und Teilhabe im Kontext der Industrie 5.0
Klassische Methoden der Teleoperation und Robotersteuerung sind in der Praxis hochgradig fehleranfällig und fordern vom Operator eine immense kognitive Feinsteuerung sowie technisches Fachwissen. Diese hohen Barrieren schließen viele Menschen von der direkten Nutzung aus. Im Sinne des Leitbildes der Industrie 5.0 – welche den Menschen, die Nachhaltigkeit und die Resilienz in den Mittelpunkt der industriellen Produktion stellt – setzt dieses Projekt genau hier an:

* **Abbau technischer Barrieren:** Reduktion der Einstiegshürden durch die Verlagerung von Low-Level-Gelenkkoordination hin zu intuitiven High-Level-Befehlen.
* **Förderung der Inklusion:** Schaffung technologischer Voraussetzungen, um auch Menschen mit unterschiedlichen physischen oder kognitiven Voraussetzungen eine produktive und gleichberechtigte Teilhabe am modernen Arbeitsplatz zu ermöglichen.
* **Mensch-Maschine-Synergie:** Etablierung des Roboters als assistierendes Werkzeug, das den Menschen entlastet, anstatt ihn zu ersetzen.

### Funktionsprinzip: Shared Control und das „Human-in-the-Loop“-Paradigma
Das technologische Fundament der Plattform basiert auf einem dynamischen *Shared-Control*-Ansatz, bei dem Mensch und Maschine kooperativ interagieren. Der Nutzer bleibt als Supervisor permanent in den Kontrollkreislauf eingebunden (*Human-in-the-Loop*), steuert das System jedoch über ein abgestuftes, komplementäres Interaktionsmuster:

* **Intuitive High-Level-Befehle:** Initiierung von globalen Aktionen oder Zielvorgaben über natürliche Modalitäten wie Blicksteuerung (Eye-Tracking) oder Sprachbefehle.
* **Präzise Low-Level-Korrekturen:** Nahtloser, latenzfreier Wechsel auf manuelle Eingabegeräte (z. B. Gamepad/MoveIt Servo) für feinfühlige Justierungen im Arbeitsraum.
* **Kontextsensitive Assistenz:** Autonome Pfadplanung und kollisionsfreie Trajektorienberechnung im Hintergrund, um den Operator während der Ausführung aktiv abzusichern.

### Zielsetzung: Ein valider, kosteneffizienter Proof-of-Concept
Das Vorhaben versteht sich als voll funktionsfähiger, reproduzierbarer und ökonomisch erschwinglicher Proof-of-Concept (PoC) für akademische Forschungslandschaften sowie praxisorientierte Inklusionsprojekte. Die offene Architektur dient als standardisierte Evaluierungsplattform, auf deren Basis neuartige assistive Robotiksysteme unter realitätsnahen Bedingungen entwickelt, getestet und empirisch validiert werden können.

### Evaluationslogik & Guidelines: Von der Forschung in die industrielle Praxis
Ein wesentlicher Kern und Innovationscharakter des Projekts liegt in der wissenschaftlichen Aufarbeitung der Interaktionsqualität. Das System dient nicht nur als technischer Demonstrator, sondern als Werkzeug zur Generierung übertragbaren Wissens:

* **Entwicklung einer Evaluationslogik:** Systematische Erfassung und Messung von Usability, kognitiver Belastung und Systemperformance zur quantitativen Bewertung der Mensch-Roboter-Schnittstelle.
* **Ableitung von Handlungsempfehlungen:** Formulierung standardisierter Guidelines, die Unternehmen als strategischer Leitfaden bei der Einführung moderner Robotersysteme dienen.
* **Beantwortung der Transformationsfrage:** Konkrete Hilfestellungen für die Praxis auf die Kernfrage: *„Wie können Prozesse und Arbeitsplätze strukturiert werden, um den menschzentrierten Anforderungen der Industrie 5.0 messbar gerecht zu werden?“*
* **Dienstleistungspotenzial:** Die resultierenden Frameworks und Guidelines besitzen das Potenzial, als validierte, monetarisierbare Consulting- und Dienstleistung für die Industrie bereitgestellt zu werden, um den digitalen und demografischen Wandel in der Produktion zu begleiten.

---

## <a id="chapter-2"></a> 2. 🔬 Architektur & Leitprinzipien

### <a id="subchapter-2-1"></a> 2.1 Betriebsmodi: FAKE vs. REAL (Hardware Interfaces)
Die Plattform unterscheidet strikt zwischen zwei Betriebsmodi für den Roboterarm. Diese Unterscheidung bezieht sich **ausschließlich auf das `ros2_control` Hardware Interface** und ist unabhängig von der Sensorik (wie Kamera oder YOLO, welche in beiden Modi live laufen können):

* **FAKE (Simulation Mode):** Der Roboter läuft über das `mock_components/GenericSystem` (bzw. FakeSystem) Hardware Interface innerhalb von `ros2_control`. Es gibt keine physische Controller-Verbindung. Befehle an den `/lite6_traj_controller` oder `/servo_server` werden rein virtuell in RViz2 gerendert, indem die Joint States gespiegelt werden. Proprietäre UFactory API-Calls (wie Mode/State-Switches) laufen in diesem Modus absichtlich ins Leere oder werden softwareseitig ge-bypassed.
* **REAL (Hardware Mode):** Das `ros2_control` Framework bindet das echte `xarm_api` Hardware Interface ein, welches via TCP/IP direkt mit dem physischen Controller des xArm Lite 6 kommuniziert. In diesem Modus greifen Hardware-Limits, physische Sicherheits-Stopps und die exklusive Umschaltung der proprietären xArm Hardware-Modi (z. B. Mode 0 für Pose-Steuerung vs. Mode 1 für Servo/Jogging) über die UFactory API.

### <a id="subchapter-2-2"></a> 2.2 Die Systemidee: Eine integrierte Entwicklungs-, Evaluierungs- und Validierungsplattform
Das Kernziel des Projekts ist die Realisierung einer modularen, plattformbasierten Softwarearchitektur für die multimodale Teleoperation und KI-gestützte Assistenzrobotik. Das System fungiert als zentraler, softwareseitiger Integrationsknoten (Middleware-Ebene), der heterogene Teilsysteme in einer einheitlichen Laufzeitumgebung zusammenführt. Durch ein verteiltes Server-Client-Netzwerk (Multi-PC-Setup) und die softwareseitige Kopplung an einen echtzeitfähigen Digitalen Zwilling (NVIDIA Isaac Sim) dient die Plattform sowohl als flexible Entwicklungsumgebung als auch als standardisierte und replizierbare Testumgebung. Das Projekt ist explizit als geschlossener Kreislauf aus Entwicklung und empirischer Validierung konzipiert:

* **Sensorik & Perzeption:** Integration von Tiefenkameras (z. B. Objekterkennung via YOLO, Marker-Tracking) sowie taktilen oder physiologischen Sensoren zur Zustandserfassung.
* **Multimodale Steuerung:** Parallele Einbindung diverser Eingabekanäle wie Eye-Tracking-Systeme zur Blickzielerfassung, Sprachsteuerung (z. B. via OpenAI Whisper) sowie klassische Hardware-Controller (Gamepads, 3D-Mäuse).
* **Kognitive Robotik:** Einbindung moderner Vision-Language-Action-Modelle (VLA), um hochgradig abstrakte, sprachliche und visuelle Befehle direkt in robotische Handlungssequenzen zu übersetzen.
* **Integrierte Datenakquisition:** Zeitsynchrone Aufzeichnung technischer Leistungsparameter und menschlicher Interaktionsdaten über eine zentrale Logging-Infrastruktur während der Systemnutzung.

### Human-Centered Automation
Die Systemarchitektur stellt den menschlichen Operator ins Zentrum des Interaktionsdesigns. Das System wird so konzipiert, dass Nutzer den aktuellen Automatisierungszustand durchgängig kognitiv erfassen und nachfolgende Systemaktionen antizipieren können. Diese Transparenz bricht algorithmische Black-Box-Strukturen auf, was für den praktischen Einsatz wesentliche Vorteile bringt:

* **Kognitive Transparenz:** Durchgängige Nachvollziehbarkeit der Systemzustände, insbesondere bei der parallelen Verarbeitung von Blickbewegungen und sensorischen Rückmeldungen.
* **Fundierte Intervention:** Befähigung des Operators zu sicheren und gezielten Eingriffen in kritischen oder unvorhergesehenen Interaktionssituationen.
* **Kalibriertes Systemvertrauen:** Schaffung einer verlässlichen technologischen Basis für den systematischen Aufbau von *Trust in Automation*, welcher im Rahmen von Nutzerstudien evaluiert wird.

### Shared Control & Kognitive Entlastung
Ein Kernmerkmal der Softwarearchitektur ist die Implementierung von *Shared-Control*-Paradigmen zur kooperativen Aufgabenbewältigung. Die Plattform ermöglicht einen nahtlosen, latenzarmen Wechsel der Kontrollhoheit zwischen manueller Führung, blickgesteuerten Interaktionen und KI-gestützten, teilautomatisierten Assistenzfunktionen. Die kontextabhängige Aufteilung der Kontrollanteile zielt auf folgende Kernaspekte:

* **Nahtlose Kontrollübergabe:** Latenzarmer Wechsel zwischen manueller Eingabe (z. B. via MoveIt Servo / Gamepad) und autonomen Systemaktionen (z. B. blickbasiertes Greifen).
* **Minimierung des Mental Workload:** Gezielte Reduktion der mentalen Arbeitsbelastung des Nutzers während komplexer oder langandauernder Manipulationsaufgaben.
* **Autonome Fehlerkompensation:** Selbstständiges Abfangen fehleranfälliger Low-Level-Korrekturen durch das System, wodurch kognitive Ressourcen für die übergeordnete Prozessüberwachung freigesetzt werden.
* **Empirische Validierung:** Laufende Überprüfung der tatsächlichen kognitiven Entlastung im Projektverlauf über standardisierte psychometrische Verfahren.

### HCI & Usability Fokus & Empirische Evaluation
Die Gestaltung der zentralen Steuerungsschnittstelle (GUI) folgt etablierten Prinzipien der Mensch-Computer-Interaktion (HCI). Die Interaktionsmuster verschieben sich von der komplexen Koordination einzelner Freiheitsgrade oder dem manuellen Aufrufen verteilter Terminal-Prozesse hin zu einer intentionsbasierten Aufgabenbewältigung. Ein integraler Bestandteil des Projekts ist die Durchführung systematischer Benutzerstudien zur Evaluierung dieser multimodalen Schnittstellen:

* **Intentionsbasierte Steuerung:** Übersetzung abstrakter Handlungsabsichten (per Sprache, Blickziel oder High-Level-Controller) in präzise kinematische Trajektorien.
* **Standardisierte Usability-Metriken:** Erhebung der subjektiven Gebrauchstauglichkeit über etablierte Fragebögen wie die *System Usability Scale* (SUS).
* **Objektive Leistungsparameter:** Messung von quantitativen Faktoren wie *Task Completion Time*, Fehlerraten und spezifischen Blickbewegungspfaden.
* **Beanspruchungsanalyse:** Empirische Absicherung der kognitiven Belastung der Probanden unter Verwendung des *NASA-TLX*-Index zur iterativen Systemoptimierung.

### Reproduzierbar & Open Source
Zur Gewährleistung wissenschaftlicher Validität ist das Projekt als Open-Source-Architektur angelegt. Die Offenlegung der vollständigen Codebasis sichert die methodische Transparenz aller Algorithmen, Konfigurationen und Datenflüsse. Für die wissenschaftliche Gemeinschaft ergeben sich daraus zentrale Mehrwerte:

* **Methodische Transparenz:** Vollständige Einsehbarkeit aller zugrundeliegenden Algorithmen, URDF-Modelle und MoveIt-Konfigurationen.
* **Exakte Replikation:** Ermöglichung unkomplizierter Zweituntersuchungen durch unabhängige Forschungsgruppen unter identischen Bedingungen.
* **Statistische Verifizierbarkeit:** Nachvollziehbarkeit und Validierung komplexer, aufgezeichneter Sensordatenströme und Steuerungseingaben.
* **Standardisierte Benchmark:** Etablierung der Plattform als verlässliche Vergleichsbasis für komparative Studien im Bereich der Assistenz- und Inklusionsrobotik.

### Kosteneffiziente Hardware
Die Systemkonfiguration basiert primär auf ökonomisch erschwinglichen, kommerziell verfügbaren Komponenten (COTS), ohne die erforderliche Präzision und funktionale Zuverlässigkeit zu kompromittieren. Dieser Ansatz verfolgt klare strategische Ziele:

* **Demokratisierung des Zugangs:** Reduktion investiver und finanzieller Barrieren beim Einstieg in moderne, multimodal gesteuerte Robotiktechnologien.
* **Zielgruppen-Transfer:** Erleichterter Technologietransfer in inklusive Projekte, Bildungseinrichtungen und kleinere Forschungseinrichtungen (z. B. über den UFactory xArm Lite 6 und Consumer-Controller).
* **Validierung der Verlässlichkeit:** Gezielte wissenschaftliche Evaluierung, inwieweit kosteneffiziente Hardware im direkten Vergleich zu hochpreisigen Industriesystemen eine valide Forschungsplattform darstellt.

### Modular & Industrie-Standard
Die softwareseitige Infrastruktur ist modular gekapselt und vollständig in das Middleware-Framework ROS 2 Humble integriert. Die native Nutzung standardisierter Kommunikationsprimitive sichert die Interoperabilität mit industriellen Ökosystemen. Das konsequente Baukastenprinzip bietet entscheidende architektonische Vorteile:

* **Native ROS 2-Kommunikation:** Volle Kompatibilität mit etablierten Ökosystemen (wie MoveIt 2) und modernen Sensor-SDKs über Nodes, Topics, Services und Actions.
* **Isolierte Subsystem-Kapselung:** Unkomplizierter Austausch oder Erweiterung einzelner Module – wie VLA-Pipelines zur Intentionserkennung oder spezifischer Eye-Tracking-Treiber.
* **Zukunftssicherheit & Portierbarkeit:** Wartungsfreundliche Softwarestruktur, die eine einfache Migration auf zukünftige ROS 2 LTS-Distributionen ohne Modifikation der Gesamtplattform erlaubt.

---

## <a id="chapter-3"></a> 3. 📊 Monitoring: Dashboard & Workspace Analyzer

Sobald die Nodes über ROS 2 Nexus gestartet wurden, lässt sich der Live-Zustand des Systems über das **ROS2 Core Dashboard** überwachen. Dies ist eine webbasierte Echtzeit-UI, die statische Quellcode-Analysen mit Live-Telemetriedaten des ROS 2 Netzwerks zu einer einheitlichen Monitoring-Oberfläche zusammenführt.

### <a id="subchapter-3-1"></a> 3.1 Workspace Analyzer Backend (`workspace_analyzer.py`)
Das Workspace Analyzer Backend ist ein ROS 2 Node, der eine ausführungsfreie, regex-basierte statische Code-Analyse durchführt. Es wurde stark modularisiert in drei Kerndateien: `workspace_analyzer.py` (behandelt ROS Pub/Sub), `workspace_parser.py` (führt die Regex-Analyse aus) und `system_utils.py` (parst Umgebungsvariablen). Dabei werden Node-Namen, Publisher, Subscriber, Services, Actions und Paketabhängigkeiten extrahiert. Diese strukturierten JSON-Metadaten werden kontinuierlich an `/dashboard/workspace_metadata` publiziert (im 10-Sekunden-Timer-Zyklus). Es publiziert außerdem Dateiinhalte über `/dashboard/file_content` und ROS Topic-Aktivitäten über `/dashboard/topic_activity`. Zusätzlich werden Umgebungsvariablen (ROS Distro, Domain ID, DDS-Middleware, Localhost-Modus) aus `~/.bashrc` ausgelesen und als Live-Status-Badges bereitgestellt.

> **Hinweis zu `workspace_analyzer.py`:** Dies ist **kein** Netzwerk-Server, sondern ein normaler ROS 2 Node. Das Dashboard greift über die ROS Bridge (Port 9090) auf dessen publizierte Topics zu.

### <a id="subchapter-3-2"></a> 3.2 Frontend (`dashboard_index.html`)
Verbindet sich über WebSocket (`rosbridge_server` auf Port 9090) mit dem ROS-Netzwerk. Die Frontend-Logik wurde für eine bessere Wartbarkeit strikt in 8 spezialisierte JavaScript-Module unterteilt (z.B. `dashboard_script_nodes.js`, `dashboard_script_graph.js`, `dashboard_script_ros.js`). Es gleicht statisch analysierte Nodes visuell mit den aktuell laufenden Nodes ab, zeigt Echtzeit-Topic-Frequenzen (Hz) an und ermöglicht die direkte Ausführung von System-Skripten aus der Browser-Oberfläche in einer übersichtlichen, einspaltigen Referenzansicht. Das UI nutzt eine moderne Glassmorphism-Designsprache und führt rekursives JSON-Parsing durch, um tief verschachtelte ROS-Nachrichtenstrukturen sauber formatiert darzustellen. Die Sidebar liefert auf einen Blick Statusinformationen wie Verbindungsgesundheit, Roboter-Verfügbarkeit und die aktive ROS 2 Umgebungskonfiguration.

![ROS2 Core - Dashboard](_imgs/dashboard_nodes.png)

### <a id="subchapter-3-3"></a> 3.3 Startbefehle der UI-Komponenten
*Starte diese Komponenten über ROS 2 Nexus oder manuell über das Terminal:*
* **Workspace Analyzer Backend:** `python3 src/dashboard_monitoring/workspace_analyzer.py`
* **Webserver:** `python3 -m http.server 8080 -d src/dashboard_monitoring`
* *(Dashboard erreichbar unter: `http://localhost:8080/dashboard_index.html`)*

---

## <a id="chapter-4"></a> 4. 🕹️ Multimodale Technologien & Interaktionskonzepte

### <a id="subchapter-4-1"></a> 4.1 Roboter-Steuerungsarten (Inputs)
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

**Robot Control UI:** <br>
* Umfassendes webbasiertes Dashboard mit virtuellem 2D-Analog-Joystick, absoluten 6-DoF-Gelenk-Slidern und Live-Telemetrie zur Remote-Teleoperation.
* Vollständig anpassbares Layout dank Drag-and-Drop Funktion für alle UI-Panels, inklusive lokalem Speichern (Persistenz) im Browser.

### <a id="subchapter-4-2"></a> 4.2 Sensorik & Assistenz (Perception)
**Computer Vision:** <br> 
* **[VERALTET]** Räumliche 2D-Objekterkennung und Lokalisierung mittels *YOLO* über PiCameras. Die Objekterkennung erfolgt vollständig in 3D durch die ZED-Kamera.
**Stereo Vision:** <br>
* Integration echter 3D-Tiefendaten durch eine *ZED Mini (Stereolabs)* Kamera.
**VLA & Video Action Models (Geplant):** <br>
* KI-gestützte Handlungsplanung durch *Vision-Language-Action* Modelle.

### <a id="subchapter-4-3"></a> 4.3 Koordinatentransformation & Kalibrierung
**ArUco Marker System [VERALTET]:** <br> 
* *[Veraltet]* Im Arbeitsbereich des Roboters platzierte Marker dienen als Referenz für Homographie-Matrizen.
* *[Veraltet]* Ableitung von 3D-Weltkoordinaten für Objekte auf der Arbeitsfläche (Z = 90 mm).
* Präzise Projektion von Eye-Tracking Blickkoordinaten auf die Steuerungs-**UI**, um den Blick in Roboterbefehle zu übersetzen.

### <a id="subchapter-4-4"></a> 4.4 User Interfaces (UI/GUI)
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

## <a id="chapter-5"></a> 5. ⚙️ Core Features & ROS 2 Nodes

Um ein klares Verständnis für die Architektur zu schaffen, sind die Software-Module nach ihren funktionalen **Features (Use-Cases)** gegliedert. Jedes Modul ist dabei explizit als ROS 2 Node, Skript oder Plugin gekennzeichnet.

### 🎮 <a id="subchapter-5-1"></a> 5.1 Funktion: Gamepad Teleoperation & Harter Kollisionsschutz
*Dieses Subsystem steuert das manuelle Jogging des Roboters per Xbox-Controller und verhindert aktiv, dass der Roboter durch Bedienfehler mit der Arbeitsfläche kollidiert.*

* **`xarm_joystick_input.cpp` [NODE]**
 * 🎯 **Zweck & Aufgabe:** Übersetzt die bereinigten Gamepad-Signale (Analog-Sticks & Trigger) in kartesische Geschwindigkeitsbefehle (`TwistStamped`) für MoveIt Servo. Wendet exponentielles Smoothing an und steuert alle Button-Mappings.
 * 🟠 📥 **Subscribes:** `/joy_check` (`sensor_msgs/Joy`). Liest die vom Wächter-Node bereinigten Controller-Inputs.
 * 🟢 📤 **Publishes:** `/servo_server/delta_twist_cmds` (`geometry_msgs/TwistStamped`), `/ui/eef_position` (`std_msgs/Float32MultiArray`). Sendet Motorströme an den Servo Server und publiziert mit 10 Hz die Live-Pose für die Web-UI.
 * 🔄 **TF2:** Hört auf die aktuelle TCP-Position (`link_base` -> `link_tcp`).
 * 🔄 **Services:** `/servo_server/start_servo`, `/servo_server/stop_servo`, `/servo_server/switch_command_type` (Clients).
* **`checker.py` (`collision_check`) [NODE]**
 * 🎯 **Zweck & Aufgabe:** Sitzt als Wächter *vor* der Bewegungsübersetzung. Berechnet prädiktiv (0,1 Sek. in die Zukunft) die Z-Koordinate. Würde der Roboter den Tisch berühren, wird der Abwärtsbefehl des Controllers hart überschrieben und blockiert. Löst das Rumble-Feedback (Vibration) des Gamepads aus.
 * 🟠 📥 **Subscribes:** `/joy` (`sensor_msgs/Joy`), `/servo_server/status` (`std_msgs/Int8`), `/ui/eef_position` (`std_msgs/Float32MultiArray`). Liest den rohen Controller-Input, Status-Codes des Servo-Servers sowie die aktuelle Z-Höhe für den Kollisions-Check.
 * 🟢 📤 **Publishes:** `/joy_check` (`sensor_msgs/Joy`), `/ui/collision_msg` (`std_msgs/String`). Leitet den (ggf. null-korrigierten) Befehl an den `joystick_input` weiter und meldet harte Stopps an die UI. Die Gamepad-Vibration wird direkt lokal über `pygame` (ohne ROS Topic) angesteuert.
 * ⚙️ **Parameter:**
 * `look_ahead_time = 0.1` – Prädiktionshorizont (Sekunden) für die Geschwindigkeits-Vorausschau.
 * `table_z_threshold = 0.0` – Die harte Tischbarriere auf der Z-Achse (World-Frame).
* **`xarm_moveit_servo` [KONFIGURATION / NODE]**
 * 🎯 **Zweck & Aufgabe:** Die Echtzeit-Bewegungs-Engine von MoveIt. Reagiert auf dynamische Hindernisse (YOLO-Boxen) über einen `threshold_distance` Parameter und stoppt den Arm, bevor er mit Objekten kollidiert.
 * 🟠 📥 **Subscribes:** `/servo_server/delta_twist_cmds` (`geometry_msgs/TwistStamped`), `/planning_scene` (`moveit_msgs/PlanningScene`).
 * 🟢 📤 **Publishes:** `/lite6_traj_controller/joint_trajectory` (`trajectory_msgs/JointTrajectory`). Sendet die fertigen Gelenkwinkel an den Roboter.
 * ⚙️ **Parameter (`xarm_moveit_servo_config.yaml`):**
 * `collision_check_type: stop_distance` – Sorgt für ein weiches, geschwindigkeitsabhängiges Abbremsen (Vorwarnung ab ca. 5cm) anstatt eines abrupten Stopps an der Grenze. Bei 2 cm Abstand greift der finale Not-Stopp (`min_allowable_collision_distance: 0.02`).
 * `collision_distance_safety_margin: 0.02` – Definiert die 2 cm breite, unsichtbare Kollisionsblase um den Roboter.

### 🟢 <a id="subchapter-5-2"></a> 5.2 Funktion: Autonomes Greifen & 3D Objekterkennung (YOLO / ZED)
*Dieses Subsystem ist dafür verantwortlich, Objekte im 3D-Raum zu lokalisieren, virtuelle Hindernisse zu generieren und den Roboter gezielt an das Objekt heranzuführen.*

* **`zed_wrapper` [NODE]**
 * 🎯 **Zweck & Aufgabe:** Der native Hardware-Treiber der Stereolabs ZED Mini Kamera. 
 * 🟢 📤 **Publishes:** `/zed/zed_node/rgb/image_rect_color` (`sensor_msgs/Image`), `/zed/zed_node/depth/depth_registered` (`sensor_msgs/Image`), `/zed/zed_node/point_cloud/cloud_registered` (`sensor_msgs/PointCloud2`). Bildet die sensorische Grundlage für das gesamte System.
 * ⚙️ **Parameter (`zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py`):**
 * `depth_mode: ULTRA` – Erzwingt die maximal dichte 3D-Punktwolke für saubere Kantenberechnung.
 * `auto_exposure: True` – Erlaubt den automatischen Helligkeitsausgleich für robuste YOLO Erkennung.
* **`zed_yolo_3d_bbox.py` [NODE]**
 * 🎯 **Zweck & Aufgabe:** Verarbeitet parallel den RGB- und Depth-Stream mit GPU-Beschleunigung und dem **YOLOv8 Large** Modell. Isoliert Objekte, filtert Tiefenrauschen und berechnet millimetergenaue, auf die Tischebene geerdete 3D-Bounding-Boxen (inklusive Greifpunkt-Marker). Nutzt einen **robusten Oberflächen-Projektionsalgorithmus** (filtert die unteren 20% der Punkte heraus, um Tisch-Rauschen zu ignorieren), um die Bounding-Boxen exakt auf das tatsächliche physikalische Volumen der Objekte zu zentrieren, unabhängig vom Kamerawinkel. Nutzt ein **Dictionary-basiertes EMA-Tracking-System** mit persistenten, globalen IDs und einem engen 10cm-Distanz-Threshold, um ID-Swapping und Boxen-Jittering zwischen nah beieinander stehenden Objekten zu verhindern. Erkennt das System mehrere Objekte derselben Klasse, werden diese zur eindeutigen Identifikation dauerhaft durchnummeriert (z.B. `cup_1`, `cup_2`).
 * 🟠 📥 **Subscribes:** `/zed/zed_node/rgb/image_rect_color` (`sensor_msgs/Image`), `/zed/zed_node/depth/depth_registered` (`sensor_msgs/Image`), `/zed/zed_node/rgb/camera_info` (`sensor_msgs/CameraInfo`).
 * 🟢 📤 **Publishes:** `/zed/bboxes_3d` (`visualization_msgs/MarkerArray`). Sendet die fertigen 3D-Boxen und Marker zur Visualisierung an RViz und an nachgelagerte Nodes.
 * ⚙️ **Parameter:**
 * `class_dimension_overrides` – Hinterlegt feste metrische Dimensionen (x,y,z) für spezifische Objekte, um sicherzustellen, dass die Box das echte physikalische Volumen umschließt und nicht nur die für die Kamera sichtbare Oberfläche.
 * `percentiles: [0.5, 99.5]` – Schneidet extreme Tiefen-Rausch-Pixel ("Flying Pixels" an Objektkanten) hart ab, während echte Kanten erhalten bleiben.
 * `ema_alpha: 0.2` – Glättungsfaktor (Exponential Moving Average), um Boxen-Jittering zwischen Frames sicher zu eliminieren.
* **`pointcloud_optimizer.py` [NODE]**
 * 🎯 **Zweck & Aufgabe:** Läuft aktiv im Hintergrund während des 3D Vision Bringups. Fängt die rohe ZED-Punktwolke ab und transformiert das Koordinatensystem vom optischen Frame (`Z=vorwärts`) in den Standard-ROS-Frame (`X=vorwärts`), wobei RGB-Daten erhalten bleiben.
* **`yolo_moveit_collision.py` [NODE]**
 * 🎯 **Zweck & Aufgabe:** Wandelt die erkannten 3D-Boxen nahtlos in dynamische MoveIt `CollisionObject`-Nachrichten um. Statt eines massiven Blocks wird eine **nach oben offene Becher-Form** (5 hauchdünne Wände à 1 mm) in den Planungsraum eingefügt. Dies erlaubt dem Greifer ein ungehindertes Eintauchen von oben (für Top-Down-Grasps), blockiert aber seitliche Kollisionen sicher.
 * 🟠 📥 **Subscribes:** `/zed/bboxes_3d` (`visualization_msgs/MarkerArray`). Liest die Bounding Boxen aus.
 * 🟢 📤 **Publishes:** `/planning_scene` (`moveit_msgs/PlanningScene`). Sendet die `CollisionObjects` direkt an die MoveIt Planning Scene, um Kollisionen beim Greifen/Fahren zu vermeiden.
* **`octomap_server` (Integration via MoveIt 2)**
 * 🎯 **Zweck & Aufgabe:** Dynamische 3D-Umgebungskartierung. Generiert in Echtzeit eine voxelbasierte Kollisionskarte (OctoMap) direkt aus der ZED-Punktwolke. Dadurch kann MoveIt arbiträre, nicht von YOLO erkannte Hindernisse (z. B. menschliche Hände, Werkzeuge) bei der Bahnplanung und im Servo-Betrieb sicher umfahren.
 * 🛠️ **Aktivierung:** Im Basis-Repository (`src/xarm_ros2/xarm_moveit_config/launch/_robot_moveit_common.launch.py`) wird die OctoMap über das Dictionary `sensor_manager_parameters` (mit Parametern wie `octomap_resolution: 0.03` und `ros.point_cloud_topic`) konfiguriert und dem `move_group_node` übergeben.
 * 🟠 📥 **Subscribes:** `/zed/zed_node/point_cloud/cloud_optimized` (`sensor_msgs/PointCloud2`).
 * 🟢 📤 **Publishes:** Nativ integriert in die MoveIt `/planning_scene`.
* **`yolo_planned_grasp_executor.py` [NODE]**
 * 🎯 **Zweck & Aufgabe:** Die zentrale Steuerungslogik der autonomen Greif-Pipeline. Liest das UI-Feld ("Grasp Object") aus, holt sich die YOLO-Koordinaten und orchestriert eine robuste **Kollisionsfreie 3-Phasen Greif-Sequenz**:
 * **Phase 1 (Retract):** Fährt den Arm von seiner aktuellen Position exakt nach oben, um eine sichere Überflughöhe zu erreichen.
 * **Phase 2 (Hover):** Bewegt sich horizontal auf der sicheren Z-Höhe (15cm) exakt über das Zielobjekt. Erzwingt dabei eine strikte Top-Down Orientierung (gerade nach unten) und nutzt sehr enge IK-Toleranzen (5mm Position, 0.001 rad Neigung) für millimetergenaue Ausrichtung.
 * **Phase 3 (Approach):** Schaltet das anvisierte Objekt kurzzeitig über `/ui/ignore_collision_object` in der globalen MoveIt Kollisionsszene ab, damit der Greifer physisch in die Bounding Box eindringen kann, ohne einen Not-Aus auszulösen, und fährt dann nach unten.
 * ⚙️ **Parameter:** Bietet einstellbare Parameter für `velocity_scaling` (Standard: 0.2) und `acceleration_scaling` (Standard: 0.1) für extrem weiche, langsame und vorhersehbare Roboterbewegungen während der Greifsequenz.
 * 🟠 📥 **Subscribes:** `/zed/bboxes_3d` (`visualization_msgs/MarkerArray`).
 * 🟢 📤 **Publishes:** `/ui/grasp_status` (`std_msgs/String`) für das RViz Console-Log, `/ui/ignore_collision_object` (`std_msgs/String`), `/planning_scene` (`moveit_msgs/PlanningScene`).
 * 🔄 **Action Server:** `/ui/grasp_object` (`my_3d_vision_msgs/action/GraspObject`).
 * 🔄 **Services:** `/compute_ik` (IK Verifizierung), `/move_action` (MoveIt OMPL Planer), `/ui/execute_move_to_pose` (Servo Fallback).
* **`grasp_action_bridge.py` [NODE]**
 * 🎯 **Zweck & Aufgabe:** Übersetzer-Node zwischen dem RViz Control Panel und dem Action Server. Nimmt den simplen String des Zielobjekts aus dem UI entgegen und wandelt ihn in ein blockierungsfreies ROS 2 Action Goal um.
 * 🟠 📥 **Subscribes:** `/ui/grasp_object_cmd` (`std_msgs/String`).
 * 🔄 **Action Client:** `/ui/grasp_object` (`my_3d_vision_msgs/action/GraspObject`).
* **`zed_stand_publisher.py` [SKRIPT]**
 * 🎯 **Zweck & Aufgabe:** Generiert mathematisch exakt das 3D-Modell des Kamerastativs (Aluminiumprofil) und publiziert dieses statisch in RViz.
 * 🟢 📤 **Publishes:** `/zed_stand_marker` (`visualization_msgs/Marker`).
* **`pointcloud_tf_tuner.py` [SKRIPT / UI]**
 * 🎯 **Zweck & Aufgabe:** Live-Tuner Interface (PyQt5) zur schnellen Justierung von Kamera-Offsets ohne Neustart.
 * 🟢 📤 **Publishes:** Aktualisiert dynamisch die TF-Broadcaster-Werte (`tf2_msgs/TFMessage` auf `/tf_static`).

### 🗣️ <a id="subchapter-5-3"></a> 5.3 Funktion: Multimodale Interaktion (Sprache & Blicksteuerung)
*Diese experimentellen Module erlauben die "Hands-Free"-Steuerung des Systems.*

* **`ros2_whisper` [NODE]**
 * 🎯 **Zweck & Aufgabe:** Lokale Speech-to-Text KI. Führt Whisper AI kontinuierlich auf dem Mikrofon-Stream aus und publiziert gesprochene Wörter als Text.
 * 🟢 📤 **Publishes:** `/whisper/text` (`std_msgs/String`).
* **`voice_command_listener.py` [NODE]**
 * 🎯 **Zweck & Aufgabe:** Analysiert den Rohtext über Regex-Muster, filtert Füllwörter heraus und extrahiert definierte Handlungs-Intents (z.B. "Greife Apfel").
 * 🟠 📥 **Subscribes:** `/whisper/transcript_stream` (`std_msgs/String`).
 * 🟢 📤 **Publishes:** `/ui/grasp_object_cmd` (`std_msgs/String`), `/ui/voice_feedback` (`std_msgs/String`). Publiziert an die Action-Bridge, um den YOLO Grasp Executor zu triggern, und sendet UI-Feedback an das Dashboard.
* **`gaze_ui_node.py` [SKRIPT / UI]**
 * 🎯 **Zweck & Aufgabe:** Eine übergeordnete Master-Control-UI (PyQt5). Setzt Eye-Tracking-Blickpunkte (über RTSP Gaze-Daten) in Button-Klicks um (z.B. bei 0,5 Sek. Fixationsdauer) und sendet direkte Bewegungs- und Greiferbefehle.
 * 🟢 📤 **Publishes:** `/servo_server/delta_twist_cmds` (`geometry_msgs/TwistStamped`). Steuert direkt die kartesische Geschwindigkeit des Roboterarms und nutzt UFactory Services zur Bedienung des Greifers.

### 🖥️ <a id="subchapter-5-4"></a> 5.4 Funktion: Grafische Steuerung & Visuelles Feedback
*Werkzeuge für den Operator zur manuellen Positionierung und für visuelles Monitoring in RViz und Web.*

* **`rviz_robot_control_panel.cpp` [C++ GUI NODE]**
 * 🎯 **Zweck & Aufgabe:** Das in C++ geschriebene, native 2D-Steuerungs-Panel für RViz. Es ist modern in einem Dark-Theme gestaltet und in 4 GroupBoxes unterteilt (Cartesian Jog, Cartesian Absolute, Joint Absolute, Utilities). Bietet D-Pad Tasten, **6-DoF Joint Control Slider**, das **"Grasp Object"** Eingabefeld und ein **farbkodiertes Live-Konsolen-Log**. Nutzt eine threadsichere `Qt::QueuedConnection` Signal/Slot Architektur, um asynchrone ROS 2 Statusmeldungen direkt in das UI zu streamen, ohne die Oberfläche einzufrieren.
 * 🟠 📥 **Subscribes:** `/ui/grasp_status` (`std_msgs/String`), `/joint_states` (`sensor_msgs/JointState`), `/ui/robot_control/current_speed` (`std_msgs/Float32`).
 * 🟢 📤 **Publishes:** `/servo_server/delta_twist_cmds` (`geometry_msgs/TwistStamped`), `/ui/grasp_object_cmd` (`std_msgs/String`), `/ui/robot_control/current_frame` (`std_msgs/String`), `/ui/robot_control/set_speed_index` (`std_msgs/Int32`).
 * 🔄 **Services:** `/ui/execute_initial_pose`, `/ui/execute_move_to_pose`, `/ui/execute_move_joint`, `/ui/execute_scan_trajectory` (Clients).
* **`robot_motion_handler_movegroup.py` [NODE]**
 * 🎯 **Zweck & Aufgabe:** Führt die Befehle des Control Panels unsichtbar im Hintergrund aus. Beinhaltet einen intelligenten Startup-Trigger und sichere Gelenk-Ausführungen (pausiert Servo, plant Trajektorie, reaktiviert Servo). Sowohl die "Execute to Pose" als auch die "Initial Pose" Bewegungen (ausgelöst über Web UI oder RViz) nutzen nun einen robusten **IK-Solver (Inverse Kinematik)**. Dieser berechnet die perfekten Gelenkwinkel für absolute Koordinaten und führt diese als sichere, kollisionsfreie Kurvenfahrten (Joint-Trajectories) aus. Dadurch werden Self-Collisions und Singularitäten, die bei sturen kartesischen Geradeausfahrten quer durch den Raum entstehen, vollständig eliminiert. Die Gelenkbewegungen reagieren dynamisch auf die globale Geschwindigkeit (`speedScale`), was für geschmeidige langsame Fahrten oder pfeilschnelle Bewegungen je nach Einstellung sorgt.
 * 🟠 📥 **Subscribes:** `/ui/robot_control/current_speed` (`std_msgs/Float64`). Skaliert die Geschwindigkeit der Joint-Bewegungen synchron zur UI.
 * 🟢 📤 **Publishes:** `/lite6_traj_controller/joint_trajectory` (`trajectory_msgs/JointTrajectory`).
 * 🔄 **Services:** Bietet `/ui/execute_initial_pose`, `/ui/execute_move_to_pose`, `/ui/execute_move_joint` und `/ui/execute_scan_trajectory` als Server an. Nutzt `/compute_ik` (MoveIt IK) als Client, um kartesische Ziele aufzulösen. Besitzt einen TF2-Listener für Echtzeit TCP-Koordinaten.
* **`rviz_overlay.py` & `servo_status_overlay.py` [NODES]**
 * 🎯 **Zweck & Aufgabe:** Projizieren farbkodierte Warnmeldungen (z.B. "COLLISION!") sowie Live-Achsen-Koordinaten als Overlay in den Video-Stream des RViz-Sichtfelds.
 * 🟠 📥 **Subscribes:** `/servo_server/status` (`std_msgs/Int8`), `/ui/collision_msg` (`std_msgs/String`), `/ui/robot_control/current_frame` (`std_msgs/String`). Hören auf kritische Warn-Flags und Frame-Updates.
 * 🟢 📤 **Publishes:** Nutzt `rviz_2d_overlay_msgs/OverlayText`.
* **`rviz_marker_static_scene_objects.py` [NODE]**
 * 🎯 **Zweck & Aufgabe:** Publiziert ROS `MarkerArray`-Nachrichten in die 3D-Szene von RViz2 (z.B. visuelle Tischkanten).
 * 🟢 📤 **Publishes:** `/scene_markers_array` (`visualization_msgs/MarkerArray`).
* **`rosbridge_server` [NODE]**
 * 🎯 **Zweck & Aufgabe:** Standard-WebSocket-Brücke auf Port 9090, die dem webbasierten Dashboard erlaubt, direkt auf das ROS-Netzwerk zuzugreifen.
* **`robot_control_web_ui` [WEB APP]**
 * 🎯 **Zweck & Aufgabe:** Eine sich nativ anfühlende, eigenständige Chrome Web App in moderner Glassmorphism-Designsprache. Fungiert als multimodales Dashboard und spiegelt das RViz Control Panel für die Remote-Bedienung. Läuft auf **Port 8081**.
 * 💡 **Native Desktop Integration:** Sowohl die *ROS 2 Nexus Web App* als auch die *Robot Control Web UI* starten nun in dedizierten, isolierten Chrome `--app` Profilen. Sie öffnen sich automatisch maximiert als eigenständige Anwendungen, völlig losgelöst von Standard-Browserfenstern, und verfügen über eigene, unverwechselbare Taskleisten-Icons für ein perfektes, natives Desktop-Erlebnis.
 * ✨ **Core Features:**
 * **Erweiterte Telemetrie:** Live-Status-Badges für Netzwerkports (UI, WS, Nexus), Gamepad-Verbindung (USB) und automatische Hardware-Modus-Erkennung (Fake Arm vs. Real Arm IP, stabil dargestellt über globale `rosapi` Endpunkte).
 * **MoveIt Servo Monitoring:** Dynamische UI-Indikatoren (Grün/Orange/Rot) mit Puls-Animationen, die MoveIt-Kollisions- und Wait-States in Echtzeit spiegeln.
 * **Virtuelle Teleoperation:** Integrierter 2D-Analogstick für kartesisches Jogging sowie 6-DoF absolute Gelenkwinkel-Slider und Geschwindigkeitsstufen. Die Geschwindigkeitsskalierung für kartesisches Jogging wurde mit dem physischen Gamepad harmonisiert. Die Geschwindigkeitsstufen nutzen nun ein optimiertes Limit von `0.1` bis `0.5` m/s, was für flüssige Bewegungen ohne Ruckeln selbst bei 100% Geschwindigkeit sorgt.
 * **Interaktives UI & Layout-Optimierung:** Die Benutzeroberfläche ist logisch strukturiert (Cartesian Jogging oben, Telemetrie darunter) und passt sich lückenlos an den Inhalt an. Sie beinhaltet dynamische, interaktive Elemente wie den Whisper AI "Start Listening"-Button, der beim Auslösen visuell reagiert und 5 Sekunden lang pulsiert.
 * **YOLO Grasp Integration:** Direkte Visualisierung der 3D-YOLO-Objektliste samt Eingabefeld zur Auslösung der autonomen Greifsequenz aus der Ferne.
 * **Farbkodiertes Konsolen-Log:** Ein live scrollbares Konsolen-Log mit detailliertem Feedback für alle Bewegungsbefehle — inklusive Koordinatenanzeige (`X`, `Y`, `Z`) bei MoveTo-Befehlen und expliziten Erfolgs- (✓) / Fehler- (❌) Statusanzeigen mit Fehlercodes.
 * 🟠 📥 **Subscribes:** `/joint_states`, `/ui/eef_position`, `/servo_server/status`, `/zed/bboxes_3d`, `/ui/voice_feedback`, `/ui/robot_control/current_speed`, `/ui/grasp_status` (via `rosbridge`).
 * 🟢 📤 **Publishes:** `/servo_server/delta_twist_cmds`, `/servo_server/delta_joint_cmds`, `/ui/robot_control/set_speed_index`, `/ui/grasp_object_cmd` (via `rosbridge`).

### 🤖 <a id="subchapter-5-5"></a> 5.5 Funktion: Komplexe Trajektorien & Task-Koordination
*Nodes, die spezifische, übergeordnete Bewegungsabläufe orchestrieren.*


* **`motion_sequence.py` [NODE]**
 * 🎯 **Zweck & Aufgabe:** Zustandsverwaltung zwischen MoveIt Servo und Hardware. Pausiert das flüssige Servo-Jogging (Gamepad), unterbricht den xArm Hardware-Controller, führt eine statische Fahrt aus und aktiviert danach Servo wieder nahtlos zurück.
 * 🔄 **Services:** `/execute_motion_to_pose` (Server). Ruft zudem Hardware-Spezifische UFactory Services ab (`set_mode`, `set_state`).
* **`move_to_coordinator.py` [NODE]**
 * 🎯 **Zweck & Aufgabe:** Orchestriert Look-At-Befehle und übergibt Parameter an andere Motion-Nodes. *(Hinweis: Obwohl der Node noch auf `/voice_cmd` lauscht, ruft die neue Sprachsteuerung nun direkt den Grasp-Executor auf. Dieser Node verbleibt als Legacy-API für die Orchestrierung farbbasierter Koordinatenfahrten).*
 * 🟠 📥 **Subscribes:** `/voice_cmd` (`std_msgs/String`), `/objects/.../world_poses` (`geometry_msgs/PoseArray`).

### ⚠️ <a id="subchapter-5-6"></a> 5.6 Veraltete / Deprecated Module
*Historische Module, die durch neuere Systeme (z.B. ZED Mini) abgelöst wurden.*

* **`yolo_object_detector` [SKRIPT / NODE]**
 * 🎯 **Zweck & Aufgabe:** *[Veraltet]* Die alte 2D-basierte Objekterkennung über Raspberry Pi Kameras. Transformierte YOLO Bounding Boxes mittels `cv2.findHomography` und flachen ArUco-Markern in den starren 3D-Raum (Z=90 mm). Vollständig durch das `my_3d_vision_bringup` (3D Vision System) ersetzt.
 * 🟢 📤 **Publishes:** `/objects/<color>_<shape>/world_poses` (`geometry_msgs/PoseArray`).

---

## <a id="chapter-6"></a> 6. 🎮 Gamepad-Steuerung — Technische Tiefenanalyse

Dieser Abschnitt liefert eine vollständige technische Referenz für die zweistufige Gamepad-Pipeline, die eine kollisionssichere Echtzeit-Teleoperation des xArm Lite 6 mit dem Xbox One Elite Series 2 Controller ermöglicht.

### <a id="subchapter-6-1"></a> 6.1 Pipeline-Architektur

Das Gamepad-Signal durchläuft zwei Stufen, bevor es den MoveIt Servo Server erreicht. Dieses Zwei-Node-Design trennt **Sicherheitsdurchsetzung** (Python) von **Bewegungsübersetzung** (C++):

```mermaid
flowchart LR
 JOY["🎮 /joy\n(Rohes Gamepad-Signal\nvom joy_node)"]
 CHECKER["🛡️ collision_check\nchecker.py\n(Python)"]
 JOY_CHECK["✅ /joy_check\n(Bereinigtes Signal)"]
 CPP["⚙️ xarm_joystick_input\n.cpp (C++)"]
 SERVO["🦾 /servo_server/\ndelta_twist_cmds"]
 POS["📡 /ufactory/get_position\n(Service — Live EEF-Pose)"]
 UI["🖥️ /ui/collision_msg\n/ui/eef_position"]

 JOY --> CHECKER
 POS --> CHECKER
 CHECKER --> JOY_CHECK
 CPP --> |"/ui/eef_position"| CHECKER
 CPP --> |"/ui/eef_position"| UI
 JOY_CHECK --> CPP
 CPP --> SERVO
 CPP --> |"/ui/joy_button_presses\n/ui/robot_control/current_speed"| UI
```

---

### <a id="subchapter-6-2"></a> 6.2 `checker.py` — Kollisionswächter (Python Node)

**Datei:** `src/collision_check/collision_check/checker.py`

Dieser Node fungiert als transparenter **Sicherheits-Proxy** zwischen dem rohen Joystick-Treiber und dem Motion-Controller. Er ist **zu 100% Hardware-unabhängig** (funktioniert identisch im REAL- und FAKE-Modus). Er abonniert kontinuierlich die Live-Z-Höhe von `/ui/eef_position` und prüft bei jedem eingehenden `/joy`-Signal prädiktiv, ob sich der Roboter dem Tisch nähert. Würde ein Limit unterschritten, wird das Signal blockiert. Er liefert zudem **haptisches Feedback** (Gamepad-Vibration), wenn sich der Roboter dem Tisch nähert oder über MoveIt Servo ein dynamisches 3D-Hindernis (YOLO Bounding Box) erkannt wird.

#### 6.2.1 Prädiktiver Kollisions-Algorithmus

```
trigger_intensity = (1.0 - axes[RT]) / 2.0 # 0.0 (los) → 1.0 (voll)
target_z_velocity = V_max × speed_factor × trigger_intensity
effective_velocity = target_z_velocity × α # α = 0.9
predicted_z = current_z − (effective_velocity × Δt)

if predicted_z < Z_LIMIT:
 axes[RT] = 1.0 # Abwärtsbefehl auf 0.0 setzen
```

| Parameter | Wert | Beschreibung |
|---|---|---|
| `Z_LIMIT` | `96,5 mm` | Absolutes Z-Limit |
| `CAUTION_ZONE_START` | `110,0 mm` | Toleranzbereich — Geschw. auf 25% begrenzt |
| `CAUTION_ZONE_SPEED` | `0,25` | Max. Faktor in der Vorsichtszone |
| `MAX_LINEAR_VELOCITY_MM_S` | `75,0 mm/s` | Angenommene max. Lineargeschwindigkeit |
| `LOOKAHEAD_TIME` | `0,1 s` | Vorhersagehorizont |
| `ACCELERATION_FACTOR` (α) | `0,9` | Dämpfungsfaktor |
| `DOWN_TRIGGER_AXIS` | `5` (RT) | Joy-Achsen-Index für Abwärts-Trigger |

#### 6.2.2 Zwei-Stufen-Sicherheitsmodell

```
Z > 110 mm → Volle Geschwindigkeit, keine Einschränkungen
110 mm ≥ Z > 96,5 mm → ⚠️ VORSICHTSZONE: Geschwindigkeit auf 25% begrenzt
Z ≤ 96,5 mm → 🛑 HARD STOP: Abwärtsachse genullt + Rumble
```

#### 6.2.3 Haptisches Feedback via Pygame

```python
if self.joystick: self.joystick.rumble(0.8, 0.8, 1000) # Intensität L/R, Dauer ms
```

Das Rumble-Signal wird aufgehoben, sobald der Arm wieder sicher ist.

#### 6.2.4 Topics & Services Referenz

| Typ | Name | Message-Typ | Beschreibung |
|-----|------|------------|-------------|
| **Subscriber** | `/joy` | `sensor_msgs/Joy` | Rohes Gamepad-Signal |
| **Subscriber** | `/ui/eef_position` | `std_msgs/Float32MultiArray` | Liest Live-Z-Position für Kollisionsprüfung |
| **Publisher** | `/joy_check` | `sensor_msgs/Joy` | Bereinigtes Ausgangssignal |
| **Publisher** | `/ui/collision_msg` | `std_msgs/String` | Kollisionswarnung für UI |
| **Subscriber** | `/ui/robot_control/current_speed` | `std_msgs/Float32` | Geschwindigkeitsfaktor vom C++ Node |
| **Service Client** | `/ufactory/get_position` | `xarm_msgs/GetFloat32List` | Echtzeit-EEF-Pose |

---

### <a id="subchapter-6-3"></a> 6.3 `xarm_joystick_input.cpp` — Motion Controller (C++ Node)

**Datei:** `src/xarm_ros2/xarm_moveit_servo/src/xarm_joystick_input.cpp` 
**Klasse:** `xarm_moveit_servo::JoyToServoPub` 
**Registriert als:** ROS 2 Component (`RCLCPP_COMPONENTS_REGISTER_NODE`)

#### 6.3.1 Vollständiges Controller Button-Mapping

| Eingabe | Funktion | ROS-Aktion | Technisches Detail |
|---------|---------|-----------|-------------------|
| **Left Stick ↑↓** | X-Achse (vor/zurück) | `TwistStamped.linear.x` | `axes[1] × speed_scale` |
| **Left Stick ←→** | Y-Achse (links/rechts) | `TwistStamped.linear.y` | `axes[0] × speed_scale` |
| **LT (Left Trigger)** | Z **aufwärts** (Z+) | `TwistStamped.linear.z` | `clamp(LT−RT, -1,1) × −speed_scale` → LT gedrückt: negativer zAchse-Wert × −scale = **positive Z** |
| **RT (Right Trigger)** | Z **abwärts** (Z−) | `TwistStamped.linear.z` | `clamp(LT−RT, -1,1) × −speed_scale` → RT gedrückt: positiver zAchse-Wert × −scale = **negative Z** |
| **LB (Left Bumper)** | Handgelenk CCW (Z-) | `TwistStamped.angular.z` | `buttons[LB] - buttons[RB]` |
| **RB (Right Bumper)** | Handgelenk CW (Z+) | `TwistStamped.angular.z` | `buttons[LB] - buttons[RB]` |
| **D-Pad ↑** | Geschwindigkeit hoch | Pub → `/ui/robot_control/current_speed` | 5 Stufen durchschalten |
| **D-Pad ↓** | Geschwindigkeit runter | Pub → `/ui/robot_control/current_speed` | 5 Stufen durchschalten |
| **Back (⊞)** | Rahmen → `link_base` | Pub → `/ui/joy_button_presses` | Weltkoordinaten-Modus |
| **Start (≡)** | Rahmen → `link_tcp` | Pub → `/ui/joy_button_presses` | EEF-relativer Modus |
| **A (grün)** | Greifer toggle | Service: `open/close_lite6_gripper` | Zustand in `vacuum_gripper_state_` |
| **B (rot)** | Greifer stopp | Service: `/ufactory/stop_lite6_gripper` | Not-Aus |
| **X (blau)** | Whisper AI toggle | Action: `/whisper/inference` (max 5 Sek.) | Toggle start/stopp |
| **Y (gelb)** | Initialposition | Service: `/ui/execute_initial_pose` | `robot_motion_handler_movegroup` |

**Geschwindigkeitsstufen (D-Pad):**

| Stufe | Faktor | Beschreibung |
|-------|--------|-------------|
| 1 | `12,5%` | Ultra-präzise — Feinpositionierung |
| 2 | `25%` | Langsam — Zielanfahrt |
| 3 | `50%` | Normal — Standard-Startstufe |
| 4 | `75%` | Schnell — Weitstreckenfahrt |
| 5 | `100%` | Maximum — volle Servo-Geschwindigkeit |

#### 6.3.2 Signal-Fluss & Exponentielle Glättung

```
// Jeder Callback-Zyklus:
smoothed_value += (target_value - smoothed_value) × 0.5

Hardware-Eingabe
 └─ /joy (rohe Achsen & Buttons)
 └─ checker.py (Sicherheitsfilter + async Positionsabfrage)
 └─ /joy_check (bereinigtes Signal)
 └─ xarm_joystick_input.cpp
 ├─ Totzone: |val| < 0,1 → 0,0
 ├─ Geschw.-Skala: val × speed_levels_[index]
 ├─ Exp. Smoothing: smoothed += (target - smoothed) × 0,5
 └─ /servo_server/delta_twist_cmds (TwistStamped)
```

#### 6.3.3 Whisper AI Integration (X-Button)

```
X drücken → async_send_goal (max_duration = 5s)
 ├─ Goal akzeptiert → is_whisper_listening_ = true
 │ → wall_timer (5s Auto-Timeout)
 │ → UI: "✅ EIN - lauscht (5sek)"
 ├─ X nochmal → async_cancel_goal() → UI: "❌ AUS"
 └─ Timeout → async_cancel_goal() → UI: "❌ AUS (Timeout)"
```

Status-Feedback an `/ui/joy_button_presses` nach jeder Zustandsänderung.

#### 6.3.4 Topics & Services Referenz

| Typ | Name | Message-Typ | Beschreibung |
|-----|------|------------|-------------|
| **Subscriber** | `/joy_check` | `sensor_msgs/Joy` | Bereinigtes Signal von `checker.py` |
| **Publisher** | `/ui/eef_position` | `std_msgs/Float32MultiArray` | 10 Hz Live-Pose (x,y,z,r,p,y) für Telemetrie |
| **Publisher** | `/servo_server/delta_twist_cmds` | `geometry_msgs/TwistStamped` | Kartesischer Geschwindigkeitsbefehl |
| **Publisher** | `/servo_server/delta_joint_cmds` | `control_msgs/JointJog` | Gelenkraum-Befehl (Initialisierung) |
| **Publisher** | `/ui/robot_control/current_speed` | `std_msgs/Float32` | Geschwindigkeitsfaktor (Latched QoS) |
| **Publisher** | `/ui/robot_control/current_frame` | `std_msgs/String` | Aktiver Referenzrahmen (`link_base` oder `link_tcp`) |
| **Publisher** | `/ui/joy_button_presses` | `std_msgs/String` | Button-Feedback für Dashboard |
| **Service Client** | `/servo_server/start_servo` | `std_srvs/Trigger` | Aktiviert MoveIt Servo |
| **Service Client** | `/ufactory/open_lite6_gripper` | `xarm_msgs/Call` | Öffnet Greifer |
| **Service Client** | `/ufactory/close_lite6_gripper` | `xarm_msgs/Call` | Schließt Greifer |
| **Service Client** | `/ufactory/stop_lite6_gripper` | `xarm_msgs/Call` | Stoppt Greifer |
| **Service Client** | `/execute_motion_sequence_Y` | `std_srvs/Trigger` | Initialpositions-Sequenz |
| **Action Client** | `/whisper/inference` | `whisper_idl/Inference` | Whisper-Sprachaufnahme |

---

## <a id="chapter-7"></a> 7. 📦 Abhängigkeiten & Voraussetzungen

### Systemanforderungen

| Komponente | Version / Details |
|------------|-----------------|
| **Betriebssystem** | Ubuntu 22.04.5 LTS (Jammy) |
| **ROS 2** | Humble Hawksbill (LTS) |
| **MoveIt 2** | v2.5.9 |
| **Python** | v3.10.12 |
| **OpenCV** | v4.9.0 |
| **YOLO / Ultralytics**| v8.4.61 |
| **ZED SDK** | v4.x (ZED M Firmware 1523) |
| **Pygame** | v2.6.1 |
| **Build-System** | `colcon` |
| **Compiler** | GCC 11+ (C++17) |

### ⚠️ Kritische Systemkonfigurationen (Troubleshooting)

> [!WARNING]
> **1. `.bashrc` Konfiguration (CUDA & ROS 2 Nexus Kompatibilität)**
> Wenn du die ZED Kamera (CUDA) über die ROS 2 Nexus WebApp startest, öffnet das Backend die Terminals als *non-interactive shell*. Das bedeutet, Ubuntu bricht das Laden der `~/.bashrc` extrem früh ab. Um zu verhindern, dass die ZED auf die CPU zurückfällt (massives Ruckeln!), **müssen** alle CUDA- und ROS-Pfade **ganz oben** in der `~/.bashrc` stehen (noch vor dem `case $- in *i*) ;; *) return;; esac` Block!). Beispiel für den korrekten Header der `.bashrc`:
> ```bash
> source /opt/ros/humble/setup.bash
> source ~/dev_ws/install/setup.bash
> export RMW_IMPLEMENTATION=rmw_cyclonedds_cpp
> export PATH=/usr/local/cuda-12.1/bin${PATH:+:${PATH}}
> export LD_LIBRARY_PATH=/usr/local/cuda-12.1/lib64${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}
> export ROS_LOCALHOST_ONLY=0 # Set to 0 for distributed network, 1 for local only
> ```
> 
> **2. Display Server: X11 vs. Wayland (RViz2 Performance)**
> Ubuntu 22.04 nutzt standardmäßig Wayland. In Kombination mit NVIDIA-Karten und RViz2 führt Wayland oft zu katastrophalen Frameraten und stark stotternden 3D-Punktwolken. 
> Prüfe dein System im Terminal: `echo $XDG_SESSION_TYPE`
> Wenn die Ausgabe `wayland` lautet, logge dich aus (Logout), klicke unten rechts auf das Zahnrad-Symbol und wähle **Ubuntu on Xorg (X11)**, bevor du dich wieder einloggst.

### Basis-System (Grundvoraussetzung)

Die absolute Grundvoraussetzung für diesen Workspace ist das offizielle UFactory ROS 2 Paket. Da dieses Repository eine Erweiterung darstellt, müssen alle Abhängigkeiten des Haupt-Repositories erfüllt sein:
* **Repository:** [UFactory xarm_ros2 (Humble)](https://github.com/xArm-Developer/xarm_ros2/tree/humble)
* Alle offiziellen UFactory Installationsschritte und Treiber (z.B. xArm-C++-API) müssen funktionsfähig im Hintergrund vorhanden sein.

### Kern-ROS-2-Pakete

```bash
# Build Tools & Audio (Zwingend für PyAudio & Whisper-Mikrofon)
sudo apt install python3-pip portaudio19-dev

# MoveIt 2 & Servo
sudo apt install ros-humble-moveit ros-humble-moveit-servo

# Joystick driver
sudo apt install ros-humble-joy ros-humble-teleop-twist-joy

# Web Dashboard bridge & CV
sudo apt install ros-humble-rosbridge-server ros-humble-rosbridge-suite ros-humble-cv-bridge

# TF2 & visualization
sudo apt install ros-humble-tf2-ros ros-humble-rviz2

# RViz 2D Overlay Plugins
sudo apt install ros-humble-rviz-2d-overlay-plugins ros-humble-rviz-2d-overlay-msgs
```

### Python-Abhängigkeiten

```bash
# Kritische Basis-Pakete
pip install "numpy==1.24.4" # KRITISCH: Muss < 2.0 sein, sonst brechen ROS 2 cv_bridge und tf2
pip install scipy==1.8.0 # Mathematik und Transformationen

# Hardware & Audio
pip install pygame==2.1.2 # Haptisches Feedback (Controller-Vibration)
pip install PyAudio==0.2.14 # Mikrofon-Stream für Whisper
pip install pynput==1.8.1 # Keyboard/Mouse Listener

# Web Backend & UI
pip install Flask==3.1.3 # ROS 2 Nexus Web Backend
pip install Flask-SocketIO==5.6.1 # WebSockets für Nexus Backend
pip install PyQt5==5.15.6 # Python UI (Gaze-Control & Pointcloud Tuner)

# Computer Vision & Perception
pip install opencv-python==4.9.0.80 # Computer Vision
pip install ultralytics==8.3.171 # YOLO 3D Objekterkennung
```

### Hardware

| Gerät | Rolle |
|-------|-------|
| UFactory xArm Lite 6 | 6-DOF Roboterarm |
| Xbox One Elite Series 2 | Primärer Teleoperation-Controller |
| NVIDIA RTX A5000 | Primäre Grafikkarte für Computer Vision / CUDA 12.1 |
| 12th Gen Intel Core i9-12900K | Primärer Workstation-Prozessor |
| Tobii Pro Glasses 3 | Eye-Tracking *(in Bearbeitung)* |
| Stereolabs ZED Mini | Stereo-Tiefenkamera |
| Raspberry Pi Kamera (×2) | **[VERALTET]** 2D-Objekterkennung via YOLO |
| Leap Motion Controller | Gesteneingabe *(geplant)* |

### ZED SDK & Kamera Setup (ZED Mini)

Die ZED Mini Kamera erfordert das offizielle ZED SDK und eine passende CUDA-Version. Für eine saubere Installation unter Ubuntu 22.04 mit ROS 2 Humble (ohne bestehende NVIDIA-Treiber zu beschädigen), folge exakt diesem Ablauf:

1. **CUDA 12.1 Toolkit installieren**: Wir empfehlen dringend CUDA 12.1, da es hochgradig stabil mit dem ZED SDK läuft. Nur das Toolkit installieren, nicht den gesamten Treiber.
2. **ZED SDK 4.1.2 installieren**: Lade das ZED SDK 4.1.x für Ubuntu 22.04 (CUDA 12.1 Variante) von Stereolabs herunter und führe den Installer aus.
 * *Wichtig:* Der Installer richtet Python-API-Pakete als Root ein. Korrigiere anschließend die Berechtigungen, damit `rosdep` fehlerfrei durchläuft:
 ```bash
 sudo chmod -R a+rX /usr/local/lib/python3.10/dist-packages/
 ```
3. **ROS Abhängigkeiten**: Installiere das benötigte Point-Cloud-Transport-Paket:
 ```bash
 sudo apt install ros-humble-point-cloud-transport
 ```
4. **ZED SDK Source Code [KRITISCH]**: Der ROS 2 Wrapper Quellcode muss exakt zur installierten SDK-Version passen, um Kompilierungsfehler zu vermeiden. In diesem Repository ist der korrekte Quellcode (`humble-v4.1.4`) bereits fest integriert. Du musst **keine** weiteren ZED-Repositories manuell clonen oder auschecken!
5. **Wrapper kompilieren**: 
 ```bash
 cd ~/dev_ws
 rm -rf build/zed_* install/zed_* # Alte Fragmente zwingend löschen!
 source /opt/ros/humble/setup.bash
 colcon build --packages-select zed_interfaces zed_components zed_wrapper my_3d_vision_bringup --symlink-install
 ```
6. **Ausführungs-Workflow & RViz Integration**:
 * Starte zunächst die Roboter-Basis (z. B. **Fake Arm** oder **Real Arm**) über die ROS 2 Nexus WebApp. Dies öffnet automatisch **RViz** mit dem vorkonfigurierten Layout (`servo.rviz`).
 * Starte im Anschluss das **3D Vision Bringup (cam, tf, yolo3d, pc_opt, grasp)** über Nexus. Dies führt das `my_3d_vision_bringup` Paket aus, welches simultan den ZED-Treiber initialisiert, die statische TF-Transformation sendet (um die Kamera relativ zum `link_base` des Roboters auszurichten) und das dynamisch generierte 3D-Stativ publiziert.
 * Die Live-Punktwolke (`PointCloud2`) sowie die Kamera-Achsen erscheinen daraufhin sofort und vollautomatisch in der bereits laufenden RViz-Instanz, ohne dass weitere manuelle Einstellungen nötig sind.

### Setup & Build

```bash
git clone <repo-url> ~/dev_ws && cd ~/dev_ws

# Installiert alle Basis-Abhängigkeiten des offiziellen xarm_ros2 Repos 
# sowie die unserer eigenen multimodalen Pakete:
rosdep install --from-paths src --ignore-src -r -y

colcon build --symlink-install
source install/setup.bash
```

---

## <a id="chapter-8"></a> 8. 🚀 Ausführung: Systemstart

Dieser Abschnitt beschreibt Schritt für Schritt den Start der Hardware und Software. **ROS 2 Nexus** dient dabei als zentrale webbasierte Oberfläche, um alle Nodes, Sensoren und Algorithmen mit nur einem Klick hochzufahren.

### <a id="subchapter-8-1"></a> 8.1 Schritt 1: Hardware vorbereiten
1. **Roboter einschalten:** Schalte den UFactory xArm Lite 6 an und stelle sicher, dass der Not-Aus-Schalter entriegelt ist.
2. **Controller verbinden:** Schalte den Xbox One Elite Series 2 Controller ein und prüfe die Verbindung (Bluetooth oder USB) mit dem Host-PC.

### <a id="subchapter-8-2"></a> 8.2 Schritt 2: System starten (ROS 2 Nexus)
Normalerweise muss in der Robotik jedes Mal eine Vielzahl langer `ros2 run`- oder `ros2 launch`-Befehle in mehreren Terminals parallel ausgeführt werden, um die einzelnen Nodes zu starten. Genau um dieses Problem zu lösen, wurde die **ROS 2 Nexus** WebApp entwickelt: Anstatt komplexe CLI-Befehle auswendig zu lernen, lassen sich alle benötigten Nodes und Launch-Files bequem per Klick direkt aus dem Browser heraus starten. Die UI ist dabei übersichtlich in zwei Hauptbereiche unterteilt: **Automated System Bringup** (für die lokale Entwicklung an einem PC) und **Remote Control System Bringup** (für verteilte Server/Client-Ausführung). Die Hintergrund-Startsequenzen wurden stark optimiert: Die Backend-Nodes und MoveIt starten nun mit einer Sekunde Verzögerung dazwischen, während die ROS Bridge und Web UI als Letztes laden. Dies beugt WebSocket-Abbrüchen vor.

**Start über Terminal:**
```bash
cd ~/dev_ws
python3 ros2_nexus/ros2_nexus_web.py
# → Öffnet sich unter http://localhost:5000 (auch im LAN erreichbar, z.B. http://192.168.x.x:5000)
```
*Hinweis: Die Nexus Web App verfügt über ein integriertes, ausklappbares Live Console Overlay. Es trackt alle gestarteten Nodes und deren PIDs zuverlässig in Echtzeit. Wird das Backend-Terminal geschlossen, beendet sich der Browser-Tab automatisch selbst.*

**Quick Launch (Nexus Web Backend automatisch starten + Browser öffnen):**
```bash
./ros2_nexus/ros2_nexus_web_start.sh
```

> **Ubuntu App Integration:** ROS 2 Nexus kann als native Ubuntu-Anwendung registriert werden. Um die App im Ubuntu-Aktivitäten-Menü zu finden, kopiere die mitgelieferte `.desktop`-Datei in das Systemverzeichnis:
> ```bash
> cp ~/dev_ws/ros2_nexus/ROS2_Nexus.desktop ~/.local/share/applications/
> update-desktop-database ~/.local/share/applications/
> ```
> Danach kann die App über das Suchfeld im Menü (nach **„ROS 2 Nexus"** suchen) direkt gestartet werden.

### <a id="subchapter-8-3"></a> 8.3 Schritt 3: Module über die GUI aktivieren
Sobald sich ROS 2 Nexus im Browser geöffnet hat:
1. Navigiere durch die verschiedenen Tabs der Oberfläche (z.B. `Nodes / Launch`, `Sensors`, `Hardware`, `Web`).
2. Klicke auf die entsprechenden Buttons, um die benötigten Module zu starten (der Treiber für die ZED-Kamera befindet sich beispielsweise im Tab **Sensors**).
3. Der Terminal-Output jedes gestarteten Nodes wird dir in Echtzeit direkt in die Web-Oberfläche gestreamt.
4. **Dynamische Tooltips:** Bewege die Maus über einen beliebigen Action-Button, um sofort eine erschöpfende, automatisch generierte Liste aller zugrundeliegenden Source-Files (z.B. `.cpp`, `.py`, `.launch.py`) und ROS 2 Argumente zu sehen. Dies ermöglicht eine sofortige Architektur-Introspektion, selbst für hochkomplexe Launch-Sequenzen.

<p align="center">
 <img src="_imgs/ros2_nexus_web.png" width="90%" alt="ROS 2 Nexus — Web Edition">
</p>

### <a id="subchapter-8-4"></a> 8.4 Netzwerk- & Port-Architektur

Um das komplette System mit beiden Web-Oberflächen (Nexus und Dashboard) zu nutzen, laufen im Hintergrund drei verschiedene Server auf drei separaten Ports:

| Port | Service | Typ | Beschreibung |
|------|---------|-----|--------------|
| **`5000`** | **ROS 2 Nexus Web** | Nexus Web Backend | Stellt die grafische Nexus-Oberfläche bereit. Empfängt Klicks aus dem Browser, führt ROS-Shell-Befehle als Unterprozesse in `gnome-terminal` auf dem Host-PC aus. |
| **`8080`** | **Dashboard Frontend** | HTTP Server | Hostet die statischen HTML/CSS/JS-Dateien für das ROS2 Core Dashboard. |
| **`8081`** | **Robot Control Web UI** | HTTP Server | Hostet die eigenständige Chrome Web App für die Remote-Robotersteuerung (Glassmorphism-Dashboard mit Joystick, Joint-Slidern, YOLO-Grasp und Konsolen-Log). |
| **`9090`** | **ROS Bridge** | WebSocket | Die Brücke zwischen ROS 2 und dem Browser. Erlaubt dem Dashboard (Port 8080) und der Robot Control Web UI (Port 8081), sich über `roslib.js` direkt mit dem ROS-Netzwerk zu verbinden, um Echtzeit-Telemetrie auszulesen und Services aufzurufen. |

> **Warum diese strikte Trennung?** Die Ports 8080 und 9090 dienen grundverschiedenen Zwecken. Port 8080 (HTTP) fungiert als Standard-Webserver, um die Oberfläche auszuliefern. Port 9090 (WebSocket via `rosbridge`) ist ein hochspezialisierter Daten-Broker, der ausschließlich Live-Telemetrie streamt und keine Webseiten bereitstellen kann. Port 5000 (Flask) verarbeitet die Logik des Nexus Web Backends völlig unabhängig von ROS.

### <a id="subchapter-8-5"></a> 8.5 Verteilte Steuerung (Remote / Operator-Station)

Wenn das System über das Netzwerk von einer Operator-Station aus gesteuert werden soll (z. B. von einem Remote-Rechner mit Gamepad), kann die ROS 2 Architektur dank DDS nahtlos aufgeteilt werden. Das verteilt die CPU-Last und minimiert Netzwerklatenzen bei der Kollisionsprüfung.

#### Vorbereitung (Auf BEIDEN Rechnern)
Der ROS 2 DDS-Traffic muss zwingend für das Netzwerk freigegeben werden. Ist in der `~/.bashrc` standardmäßig der Wert `ROS_LOCALHOST_ONLY=1` gesetzt, werden sich Host und Client **niemals** finden.
In **jedem** verwendeten Terminal muss vorab folgendes ausgeführt werden:
```bash
export ROS_DOMAIN_ID=66
export RMW_IMPLEMENTATION=rmw_cyclonedds_cpp
export ROS_LOCALHOST_ONLY=0
source ~/dev_ws/install/setup.bash
```

#### Host-PC (Das Gehirn)
Hier läuft die gesamte rechenintensive Infrastruktur. Das Gamepad wird hier **nicht** angeschlossen.
- Öffne das **ROS 2 Nexus Web Dashboard** (`./ros2_nexus_web_start.sh`).
- Starte den Button **▶ RUN SERVER (FAKE)** oder **▶ RUN SERVER (REAL)**.
- *Technischer Hintergrund:* Die Server-Nodes werden mit dem Argument `joystick_and_checker:=false` gestartet. Das stellt sicher, dass der Gamepad-Treiber (`joy_node`) und der lokale `checker`-Node auf dem Server **nicht** gestartet werden. Das hält das Netzwerk frei von Duplikaten und überlässt der Operator-Station die exklusive Kontrolle.
- Starte den **MoveGroup Server (FAKE / REAL)** (übernimmt die OMPL-Planung).
- *Optional:* Starte Vision-Module (ZED, YOLO) oder KI-Module (Whisper) über die entsprechenden Launcher in der GUI.

#### Remote-Rechner / Operator-Station
Hier laufen **ausschließlich** die Gamepad-Eingaben und die grafische Nutzeroberfläche.
- *Visual Sync:* Da ROS 2 DDS die `joint_states` und `tf` (Koordinaten) des Roboters kontinuierlich im Netzwerk überträgt, siehst du die 3D-Bewegungen absolut synchron und in Echtzeit in RViz2 auf **beiden** Rechnern gleichzeitig.
1. **Nexus WebApp auf dem Client PC starten:**
   ```bash
   cd ~/dev_ws
   python3 ros2_nexus/ros2_nexus_web.py
   ```
2. **Client Setup ausführen:** Öffne die Nexus WebApp im Browser, scrolle zur Sektion **Remote Control System Bringup** und klicke auf den Button **[RUN CLIENT]**. Dies startet automatisch den Gamepad-Treiber, den Kollisionswächter und die ROS-Bridge im Hintergrund.
3. **Robot Control Web UI:**
   ```bash
   cd ~/dev_ws/src/robot_control_web_ui && python3 -m http.server 8081
   ```
   *(Unter `http://localhost:8081` öffnen. Die UI verbindet sich so verlustfrei über den lokalen WebSocket).*

---

### <a id="subchapter-8-6"></a> 8.6 DDS Multicast Storm Prevention (Kritisch)
> [!CAUTION]
> **Internet-Abbrüche:** Standardmäßig verwenden ROS 2 DDS-Implementierungen "UDP Multicast", wodurch alle Daten in das gesamte lokale Netzwerk (LAN/WLAN) gefunkt werden. Wenn die ZED-Kamera (hochauflösende Bilder) und YOLO (dichte 3D-Punktwolken) gestartet werden, überflutet dies das Netzwerk mit Gigabit-Mengen an UDP-Paketen. **Das führt in den meisten Fällen dazu, dass der Router abstürzt oder die Internetverbindung des PCs sofort getrennt wird.**
> 
> Um das zu verhindern und die Systemleistung extrem zu steigern (sofern man **nicht** die verteilte Remote-Steuerung aus 8.5 nutzt!), **muss** der ROS 2 Datenverkehr strikt auf den eigenen PC (Localhost) beschränkt werden:
> ```bash
> echo "export ROS_LOCALHOST_ONLY=1" >> ~/.bashrc
> source ~/.bashrc
> ```

### <a id="subchapter-8-7"></a> 8.7 Launcher-Konfiguration (`launcher_config.json`)

Die Buttons, Kategorien und Befehle in der ROS 2 Nexus Web-Oberfläche sind vollständig anpassbar.

**Interaktives Drag & Drop:** Das Nexus-Interface verfügt über ein hochgradig responsives, permanentes 3-Spalten-Drag-&-Drop-System. Einzelne Aktions-Buttons können innerhalb ihrer Sektionen frei angeordnet werden. Komplette Kategorie-Sektionen (gegriffen am Titel) lassen sich nahtlos über drei vertikale Spalten verteilen. Alle im Browser vorgenommenen Layout-Änderungen werden sofort und dauerhaft im Backend gespeichert.

**Manuelle Konfiguration:** Das gesamte UI-Layout und alle Befehle werden persistent in einer externen Konfigurationsdatei unter `ros2_nexus/launcher_config.json` gespeichert. Um eigene Skripte, Debugging-Tools oder ROS 2 Nodes manuell zur Launcher-UI hinzuzufügen, muss lediglich diese JSON-Datei angepasst werden. Die WebApp lädt die Konfiguration dynamisch, sodass manuelle Änderungen nach einem simplen Neuladen der Seite im Browser sofort aktiv werden, ohne dass das Nexus Web Backend neugestartet werden muss.


### <a id="subchapter-8-8"></a> 8.8 DDS Multicast Storm & Loopback Discovery (Kritisch)
> [!CAUTION]
> **Netzwerk-Überlastung & Participant-Fehler:** Standardmäßig verwendet ROS 2 "UDP Multicast", wodurch alle Daten in das gesamte lokale Netzwerk (LAN/WLAN) gefunkt werden. Das Starten der ZED-Kamera und YOLO überflutet das Netzwerk mit Gigabit-Mengen an Daten, was oft zum sofortigen Absturz des Routers oder der Internetverbindung führt.
> 
> Das Setzen von `export ROS_LOCALHOST_ONLY=1` in der `.bashrc` löst dieses Problem, indem es den Traffic sicher auf das interne Loopback-Interface (`lo`) zwingt. **Allerdings deaktiviert Ubuntu nach jedem Neustart standardmäßig die Multicast-Fähigkeit auf diesem internen Interface**. Das führt dazu, dass CycloneDDS mit dem Fehler `Failed to find a free participant index` abstürzt, da die Nodes sich intern nicht mehr finden können und als "Zombies" im Arbeitsspeicher hängenbleiben.

Um dieses Problem dauerhaft zu beheben, muss ein Systemd-Dienst eingerichtet werden, der Multicast auf dem `lo`-Interface bei jedem Systemstart automatisch aktiviert:

```bash
# 1. Die Datei sauber anlegen
sudo bash -c 'cat > /etc/systemd/system/lo-multicast.service <<EOF
[Unit]
Description=Enable Multicast on Loopback interface for ROS 2
After=network.target

[Service]
Type=oneshot
ExecStart=/sbin/ip link set lo multicast on

[Install]
WantedBy=multi-user.target
EOF'

# 2. Dem System sagen, dass die Datei jetzt existiert
sudo systemctl daemon-reload

# 3. Den Dienst aktivieren (Autostart beim Booten)
sudo systemctl enable lo-multicast.service

# 4. Den Dienst jetzt direkt einmal starten (ohne Neustart)
sudo systemctl start lo-multicast.service
```

### <a id="subchapter-8-9"></a> 8.9 CycloneDDS UDP Buffer Overflows (Point Cloud Lag)
> [!TIP]
> **Ruckelnde Pointclouds in RViz:** ROS 2 (insbesondere CycloneDDS) versendet große Datenmengen wie Pointclouds (ZED Kamera) über viele kleine UDP-Pakete. Der Standard-Netzwerkpuffer des Linux-Kernels ist mit ca. 200 KB viel zu klein für diese Datenmengen. Wenn der Puffer überläuft, verwirft das Betriebssystem Pakete ("Receive Buffer Errors"), was zu extremen Lags in RViz führt.

Um dieses Problem zu lösen und einen flüssigen Datenstrom zu garantieren, müssen die UDP-Puffergrößen des Systems dauerhaft auf das Maximum (2 GB) erhöht werden:

```bash
# Temporäre Erhöhung (bis zum nächsten Neustart sofort aktiv):
sudo sysctl -w net.core.rmem_max=2147483647
sudo sysctl -w net.core.rmem_default=2147483647
sudo sysctl -w net.core.wmem_max=2147483647
sudo sysctl -w net.core.wmem_default=2147483647

# Dauerhafte Speicherung (überlebt Neustarts):
echo -e "net.core.rmem_max=2147483647\nnet.core.rmem_default=2147483647\nnet.core.wmem_max=2147483647\nnet.core.wmem_default=2147483647" | sudo tee /etc/sysctl.d/60-cyclonedds.conf
sudo sysctl -p /etc/sysctl.d/60-cyclonedds.conf
```

---

## <a id="chapter-9"></a> 9. 🗂️ Repository-Struktur

```
dev_ws/
├── ros2_nexus/ # Launcher-Skripte & App-Integration
│ ├── launcher_config.json # Konfigurationsdatei für Nexus-Buttons
│ ├── ros2_nexus_web.py # Nexus Web Backend — ROS 2 Nexus Web UI
│ ├── ros2_nexus_web.html # Frontend-HTML für Nexus
│ ├── ros2_nexus_styles.css # Frontend-CSS für Nexus
│ ├── ros2_nexus_script.js # Frontend-Logik für Nexus
│ ├── ros2_nexus_web_start.sh # Auto-Start-Skript
│ ├── ROS2_Nexus.desktop # Ubuntu Anwendungsverknüpfung
│ ├── lite6.sh # Hardware-Bringup-Skript
│ └── start.sh # Vollständiges System-Launch-Skript
├── _imgs/ # Dokumentationsbilder
│ ├── robotsystem.jpg
│ ├── ros2_nexus_web.png
│ ├── dashboard_nodes.png
│ ├── gaze_control_interface.png
│ └── gamepad_layout.png # Xbox Controller Button-Belegung
├── src/
│ ├── collision_check/ # 🛡️ Python: Prädiktiver Kollisionsschutz
│ │ └── collision_check/checker.py
│ ├── robot_motion_handler_movegroup/ # 🤖 Python: Setzt Fake-Arm Startpose
│ ├── gaze_control/ # 👁️ Python: PyQt5 Gaze-Control-UI
│ ├── motion_sequence/ # 🦾 Python: Kartesische Bewegungs-State-Machine
│ │ └── motion_sequence/motion_sequence.py
│ ├── move_to_coordinator/ # 🧠 Python: Shared-Control-Gehirn
│ │ └── move_to_coordinator/move_to_coordinator.py
│ ├── my_3d_vision_bringup/ # 🌟 [VISION SYSTEM] Kamera Bringup, TF, 3D BBox & Perception
│ │ ├── launch/zed_cam_rviz_pointcloud_tf_yolo_planned_grasp.launch.py # Zentraler All-In-One Launcher (ZED, TF, YOLO, Greif-Executor)
│ │ └── scripts/
│ │ ├── pointcloud_optimizer.py # 3D Tiefenrauschen reduzieren & filtern
│ │ ├── yolo_moveit_collision.py # MoveIt Kollisionsobjekte & dynamisches Ignorieren
│ │ ├── zed_stand_publisher.py # 3D-Stativ Mesh Publisher
│ │ ├── zed_yolo_3d_bbox.py # 3D Objekterkennung & Bounding-Boxen
│ │ ├── yolo_planned_grasp_executor.py # 3-Phasen Greiflogik & Planner Fallback
│ │ └── grasp_action_bridge.py # Übersetzer für RViz Grasp Action
│ ├── ros2_whisper/ # 🎙️ Whisper AI Speech-to-Text
│ ├── rviz_servo_status_overlay/ # 🖥️ Python: RViz2 2D Text Overlays
│ │ └── rviz_servo_status_overlay/
│ │ ├── rviz_servo_status_overlay.py # TCP & Frame Overlay
│ │ └── servo_status_overlay.py # Servo Warn-Overlay
│ ├── rviz_robot_control_panel/ # 🖥️ C++: RViz2 2D Control Panel Plugin
│ │ └── src/rviz_robot_control_panel.cpp
│ ├── rviz_marker_static_scene_objects/ # 📍 Python: RViz2 Marker-Publisher
│ ├── voice_command_listener/ # 🗣️ Python: Intent-Parser & Filter
│ ├── dashboard_monitoring/ # 📊 Python/JS: Workspace Analyzer & Dashboard
│ │ ├── workspace_analyzer.py # Haupt-ROS 2-Node (Pub/Sub & Topologie)
│ │ ├── workspace_parser.py # Statische Code-Analyse (Regex)
│ │ ├── system_utils.py # Umgebungsvariablen-Parsing
│ │ ├── dashboard_index.html # Haupt-UI des Dashboards
│ │ ├── dashboard_script_*.js # 8 modulare Frontend-Logik-Skripte
│ │ └── dashboard_style.css # UI Styling
│ ├── xarm_ros2/ # 🤖 Offizielle xArm ROS 2 Pakete (Submodul)
│ │ └── xarm_moveit_servo/src/
│ │ └── xarm_joystick_input.cpp # ⚙️ C++: Gamepad → Servo Bridge
│ ├── yolo_object_detector/ # ⚠️ [VERALTET] Python: 2D YOLO + ArUco Erkennung
│ ├── zed-ros2-wrapper/ # 📷 ZED-Kamera-Treiber (Submodul)
│ └── zed-ros2-examples/ # 📷 ZED-Beispiele (Submodul)
└── README.md / readme-de.md # Dokumentation (EN / DE)
```

---
