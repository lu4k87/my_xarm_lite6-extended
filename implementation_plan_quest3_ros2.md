# A-Z Implementierungsplan: Meta Quest 3 Controller -> Robotersteuerung

Dieses Dokument ist die vollständige, lückenlose Schritt-für-Schritt-Anleitung. Es sagt dir nicht nur *was* zu tun ist, sondern bei jedem Punkt exakt **WIE** (welcher Klick, welcher Befehl) du es machst.

---

## Phase 1: Treiber & Systemerkennung (Ubuntu <-> Quest 3)

Damit Ubuntu die Meta Quest 3 über das USB-C Kabel nicht nur lädt, sondern als autorisierte Datenquelle erkennt, müssen wir sie als Entwickler-Gerät registrieren und ihr die nötigen USB-Berechtigungen erteilen.

1. **Developer Mode auf der Quest 3 aktivieren (Die genauen Klicks auf dem Handy):**
   *Warum? Ohne diesen Schalter blockiert Meta jeglichen Datenverkehr über USB.*
   - Nimm dein Smartphone (iOS oder Android) zur Hand.
   - Öffne die App **"Meta Horizon"** (früher Oculus App).
   - Tippe unten rechts in der Leiste auf dein **Profilbild** oder auf **Menü** (die drei Striche).
   - Tippe auf den Menüpunkt **"Geräte"** (Devices).
   - Wähle deine Meta Quest 3 aus der Liste aus. Warte kurz, bis dort "Verbunden" steht.
   - Scrolle nach unten und tippe auf **"Headset-Einstellungen"** (Headset Settings).
   - Tippe auf **"Entwicklermodus"** (Developer Mode).
   - **Lege den Schalter um**, sodass er blau leuchtet (Ein).
   - *(Hinweis: Falls Meta dich hier auffordert, zuerst ein Entwicklerkonto zu erstellen: Klicke auf den angezeigten Link, logge dich im Browser ein, tippe irgendeinen Fantasienamen wie "RoboticsDev" als Organisation ein, setze den Haken bei den AGBs und klicke auf Speichern. Gehe dann zurück in die App und lege den Schalter um).*

2. **ADB (Android Debug Bridge) auf Ubuntu installieren:**
   *Warum? Dies ist unser "Treiber-Tool", um die Daten später durch das USB-C-Kabel zu tunneln.*
   - Öffne ein Terminal auf deinem Ubuntu-PC.
   - Tippe exakt diesen Befehl ein und drücke Enter:
     `sudo apt update && sudo apt install adb -y`

3. **Linux Udev-Regeln (USB-Berechtigungen) einrichten:**
   *Warum? Ubuntu blockiert aus Sicherheitsgründen den Datenzugriff auf fremde USB-Geräte. Wir müssen Meta (Hardware-ID 2833) autorisieren.*
   - Tippe diesen langen Befehl exakt so in dein Terminal ein:
     `echo 'SUBSYSTEM=="usb", ATTR{idVendor}=="2833", MODE="0666", GROUP="plugdev"' | sudo tee /etc/udev/rules.d/51-android.rules`
   - Lade die Regeln in Ubuntu neu, indem du diesen Befehl tippst:
     `sudo udevadm control --reload-rules && sudo udevadm trigger`

4. **Das erste Verbinden (USB-Debugging zulassen):**
   - Schließe die VR-Brille jetzt physisch per USB-C-Kabel an den Ubuntu-PC an.
   - Tippe im Ubuntu-Terminal: `adb devices`
   - Schau auf den Bildschirm: Dort steht vermutlich eine Nummer und das Wort `unauthorized`.
   - Setze jetzt die VR-Brille auf deinen Kopf.
   - In der VR siehst du ein Pop-up-Fenster: *"USB-Debugging zulassen?"* (oder ähnlich).
   - Nimm den VR-Controller, setze den Haken bei **"Von diesem Computer immer zulassen"**.
   - Klicke auf **"OK"**.
   - Nimm die Brille wieder ab und tippe auf dem PC nochmal `adb devices`.
   - Jetzt muss neben der Nummer das Wort `device` stehen. **Die Brille ist nun bereit!**

---

## Phase 2: Vorbereitung der Netzwerk-Umgebung (Zertifikate & Bridge)

1. **Bestehendes ROSbridge-Paket nutzen:**
   - Wir installieren nichts neu! Wir nutzen exakt den ROSbridge-Server, den du bereits in deinem Workspace für deine Web-UIs benutzt.

2. **SSL-Zertifikate generieren:**
   *Warum? Der Browser in der VR-Brille erlaubt das Auslesen der Controller-Vektoren nur bei verschlüsselten (HTTPS) Verbindungen.*
   - Erstelle einen Ordner für die Schlüssel:
     `mkdir -p ~/dev_ws/certs`
   - Wechsle in den Ordner:
     `cd ~/dev_ws/certs`
   - Generiere das Zertifikat durch Kopieren & Einfügen dieses Befehls:
     `openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -sha256 -days 365 -nodes -subj "/CN=localhost"`
   - *(Dieser Befehl erzeugt stillschweigend zwei Dateien: `key.pem` und `cert.pem`)*.

---

## Phase 3: Das ROS2-Paket "vr_quest3_teleop" anlegen

1. **Paket & Node initialisieren:**
   - Gehe in den Source-Ordner: `cd ~/dev_ws/src`
   - Lege das neue Paket an: `ros2 pkg create --build-type ament_python vr_quest3_teleop`
   - Gehe in das neue Paket: `cd vr_quest3_teleop`

2. **Ordnerstruktur aufbauen:**
   - Erstelle den Ordner für das Launch-File: `mkdir launch`
   - Erstelle den Ordner für das Treiber-Skript: `mkdir driver_script`

---

## Phase 4: Auswertung der Ports & Der Treiber-Workaround

Ich habe deinen Workspace (`dev_ws`) gescannt und analysiert, welche Ports von deinen bestehenden Skripten (wie `robot_control_web_ui` und `dashboard_monitoring`) aktuell verwendet werden. 

**Das Ergebnis der Analyse:**
- **Port 9090:** Wird von deinen bestehenden Web-UIs für die ROSbridge (`roslib.js`) genutzt. Da die ROSbridge problemlos mehrere Verbindungen gleichzeitig verarbeiten kann, **müssen wir diesen Port nicht ändern**. Wir nutzen einfach dieselbe, ohnehin laufende ROSbridge auf Port 9090 mit! 
- **Port 8443:** Dieser Port ist in deinem gesamten Workspace **komplett ungenutzt und frei**. Wir werden ihn für unseren sicheren HTTPS-Server (für das Treiber-Skript) verwenden. Es wird also keine Konflikte geben!

1. **Skript erstellen:** Wir erstellen beim Coden eine Datei `controller_reader.html` im Ordner `driver_script`.
2. **Daten tunneln:** Wenn du arbeiten willst, rufst du über den Browser der VR-Brille die Adresse `https://localhost:8443` auf. Das Skript greift unsichtbar die Hardware-Werte ab und sendet sie durch das USB-C Kabel (ADB) an die ROSbridge (Port 9090) in Ubuntu.

---

## Phase 5: Programmierung des Nodes "vr_quest3_teleop.py"

Das ist das Python-Skript, das wir programmieren werden. Hier wird aus nackten Zahlen die Roboterbewegung.

1. **Daten Empfangen:** Wir programmieren den Node so, dass er die Topics deiner ROSbridge abonniert und die ankommenden USB-Werte ausliest.
2. **Koordinaten transformieren (Mathe):** 
   - Wir schreiben Funktionen, die das VR-System ("Y-Up") in das ROS2-System ("Z-Up", Right-Handed) umrechnen (durch Matrix/Quaternionen-Drehung).
3. **Mapping auf den Roboter:**
   - Wir programmieren eine "If-Bedingung" für den **Grip-Trigger** (Mittelfinger): Nur wenn dieser Wert auf 1.0 (gedrückt) ist, sendet der Node Fahrbefehle an den Roboter. Ist der Wert 0.0 (losgelassen), sendet der Node einen Stopp-Befehl.
   - Wir wandeln die X/Y/Z Differenzen in `Twist`-Befehle um, um den Roboterarm im Raum zu bewegen.
   - Wir mappen den **Index-Trigger** auf eine Funktion, die den Greifer öffnet oder schließt.
   - Wir lesen den **Joystick** aus und schicken die Links/Rechts-Werte an die lineare Achse am Tisch.

---

## Phase 6: Alles automatisieren (Launch-File)

Wir erstellen die Datei `vr_quest3_teleop.launch.py`. Wir programmieren sie so, dass sie bei Aufruf folgende Dinge von selbst tut:
1. Sie führt `adb reverse tcp:9090 tcp:9090` und `adb reverse tcp:8443 tcp:8443` aus. Das leitet den Datenverkehr exakt auf unsere Ports (deine bestehende ROSbridge und unseren neuen HTTPS-Server) um.
2. Sie startet deinen bereits existierenden ROSbridge Server (auf Port 9090).
3. Sie startet unseren neuen HTTPS Server (auf Port 8443).
4. Sie startet unseren neuen Steuer-Node.

**Wie du das System am Ende startest (Dein täglicher Ablauf):**
1. Du steckst die Quest 3 per USB-C an den PC.
2. Du tippst im Ubuntu-Terminal: `ros2 launch vr_quest3_teleop vr_quest3_teleop.launch.py`
3. Du setzt die Brille auf und öffnest im Meta Quest Browser deine Lesezeichen-URL `https://localhost:8443`.
4. Du greifst den Controller, drückst den Totmannschalter und steuerst den Roboter!
