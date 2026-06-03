#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# ROS 2 Nexus — App Installer
#
# Einmalig pro PC ausführen!
# Generiert die .desktop-Datei mit dem korrekten Pfad für diesen User
# und registriert die App im Ubuntu App-Menü.
#
# Usage:
#   cd ~/dev_ws/_exec && bash install_app.sh
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

# ── Desktop-Datenbank aktualisieren ───────────────────────────
if command -v update-desktop-database &>/dev/null; then
    update-desktop-database "$DESKTOP_DIR" 2>/dev/null
fi

echo "✅ App erfolgreich installiert!"
echo ""
echo "   Die App 'ROS 2 Nexus' ist jetzt im Ubuntu App-Menü verfügbar."
echo "   Beim Starten öffnet sich ein Terminal + der Browser automatisch."
echo ""
echo "   Zum Testen direkt starten:"
echo "   bash $START_SCRIPT"
echo ""
