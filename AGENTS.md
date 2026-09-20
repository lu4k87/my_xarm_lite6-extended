# Workspace Guidelines & Terminology

## 1. Benennung der Web-Anwendungen (STRIKT BEACHTEN!)
- **Nexus Webapp** (Port 5000 / `ros2_nexus`):
  - **Niemals als „Nexus Dashboard“ bezeichnen!**
  - Es heißt offiziell und endgültig: **Nexus Webapp** (bzw. **ROS 2 Nexus Webapp**).
- **Dashboard Monitoring UI** (Port 8080 / `http_dashboard_monitoring_p8080`):
  - Das ist das System- und Node-Monitoring Dashboard.
- **Robot Control UI** (Port 8081 / `http_robot_control_ui_p8081`):
  - Das ist das Web-Interface zur direkten Roboter-Steuerung (xArm Lite 6).

## 2. Sprache
- Immer auf **Deutsch** antworten („alter DEUTSCH!“).

## 3. UI Design, Layout & Spacing (STRIKT BEACHTEN!)
- **Keine Überlappungen (Zero Overlap Policy):**
  - Alle UI-Elemente (Buttons, Sliders, Badges, Labels, Controls, Cards) müssen **immer sauber mit Margin, Padding und Gap angeordnet** sein.
  - Überlappungen von Elementen, Texten oder Containern sind **strikt verboten**. Bevorzuge stets stabile Flow-Layouts (Flexbox mit `gap`, CSS Grid) statt fragiler absoluter Positionierungen (`position: absolute; calc(...)`).
- **Responsivität & Drag-and-Drop Fähigkeit:**
  - Alle Sektionen, Panels und Action Cards müssen vollständig responsive sein und sich dynamisch an unterschiedliche Höhen/Breiten anpassen.
  - Das gesamte Drag-and-Drop Layout (SortableJS) muss stabil bleiben: Egal in welche Spalte (`col-left`, `col-middle`, `col-right`) eine Sektion oder Action Card gezogen wird, dürfen keine Elemente zerquetscht werden, überlappen oder aus dem Sichtbereich fallen.


