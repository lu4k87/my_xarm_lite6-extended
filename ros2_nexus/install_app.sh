#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# ROS 2 Nexus — App Installer
#
# Einmalig pro PC ausführen!
# Generiert die .desktop-Datei mit dem korrekten Pfad für diesen User
# und registriert die App im Ubuntu App-Menü.
#
# Usage:
#   cd ~/dev_ws/ros2_nexus && bash install_app.sh
# ─────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DESKTOP_DIR="$HOME/.local/share/applications"
DESKTOP_FILE="$DESKTOP_DIR/ros2-nexus.desktop"
START_SCRIPT="$SCRIPT_DIR/ros2_nexus_web_start.sh"
ICON_FILE="$SCRIPT_DIR/ros2_nexus_icon.png"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  ROS 2 Nexus — App Installation"
echo "════════════════════════════════════════════════════════"
echo "  User:       $USER"
echo "  Home:       $HOME"
echo "  Skript:     $START_SCRIPT"
echo "  Icon:       $ICON_FILE"
echo "  Desktop:    $DESKTOP_FILE"
echo "════════════════════════════════════════════════════════"
echo ""

# ── Prüfungen ─────────────────────────────────────────────────
if [ ! -f "$START_SCRIPT" ]; then
    echo "❌ Startskript nicht gefunden: $START_SCRIPT"
    echo "   Bitte aus dem richtigen Verzeichnis ausführen!"
    exit 1
fi

if [ ! -f "$ICON_FILE" ]; then
    echo "⚠️  Icon nicht gefunden: $ICON_FILE"
    echo "   Fortfahren ohne Icon..."
    ICON_FILE="utilities-terminal"  # Ubuntu Fallback-Icon
fi

# ── .desktop generieren ───────────────────────────────────────
mkdir -p "$DESKTOP_DIR"
chmod +x "$START_SCRIPT"

cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Name=ROS 2 Nexus
Comment=ROS 2 Workspace Manager — Web Edition
Exec=gnome-terminal --title="ROS 2 Nexus — Nexus Web Backend" -- bash -c "${START_SCRIPT}; exec bash"
Icon=${ICON_FILE}
Terminal=false
Type=Application
Categories=Development;Science;
StartupNotify=true
StartupWMClass=ros2-nexus
EOF

chmod +x "$DESKTOP_FILE"

# ── Robot Control UI Desktop Entry & Icons ───────────────────────
ROBOT_ICON_SRC="$SCRIPT_DIR/../src/http_robot_control_ui_p8081/icon.png"
if [ -f "$ROBOT_ICON_SRC" ]; then
    echo "  Installiere Robot Control UI Icons & Starter..."
    mkdir -p "$HOME/.local/share/icons"
    cp -f "$ROBOT_ICON_SRC" "$HOME/.local/share/icons/robot-control-ui.png"
    python3 -c "
import os
from PIL import Image
im = Image.open('$ROBOT_ICON_SRC')
for s in [16, 24, 32, 48, 64, 128, 256, 512, 1024]:
    d = os.path.expanduser(f'~/.local/share/icons/hicolor/{s}x{s}/apps')
    os.makedirs(d, exist_ok=True)
    im.resize((s, s), Image.Resampling.LANCZOS).save(os.path.join(d, 'robot-control-ui.png'), format='PNG')
" 2>/dev/null || true
    
    cat > "$DESKTOP_DIR/robot-control-ui.desktop" << 'EOF2'
[Desktop Entry]
Version=1.0
Name=Robot Control UI
GenericName=Robot Control Interface
Comment=xArm Lite6 Web Control Interface
Exec=sh -c 'google-chrome --user-data-dir="$HOME/.robot_control_profile" --class="robot-control-ui" --start-maximized --app=http://127.0.0.2:8081/index.html || chromium-browser --user-data-dir="$HOME/.robot_control_profile" --class="robot-control-ui" --start-maximized --app=http://127.0.0.2:8081/index.html || xdg-open http://127.0.0.2:8081/index.html'
Icon=robot-control-ui
Terminal=false
Type=Application
Categories=Development;
StartupNotify=true
StartupWMClass=robot-control-ui
EOF2
    chmod +x "$DESKTOP_DIR/robot-control-ui.desktop"
    if command -v gtk-update-icon-cache &>/dev/null; then
        gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true
    fi
fi

# ── Desktop-Datenbank aktualisieren ───────────────────────────
if command -v update-desktop-database &>/dev/null; then
    update-desktop-database "$DESKTOP_DIR" 2>/dev/null
fi

echo "✅ Apps erfolgreich installiert!"
echo ""
echo "   Die Apps 'ROS 2 Nexus' und 'Robot Control UI' sind jetzt im Ubuntu App-Menü verfügbar."
echo "   Beim Starten öffnet sich ein Terminal + der Browser automatisch."
echo ""
echo "   Zum Testen direkt starten:"
echo "   bash $START_SCRIPT"
echo ""
