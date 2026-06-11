#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# ROS 2 Nexus Web — Launcher
# Startet Nexus Web Backend (beinhaltet terminal_server auf Port 8765)
# und öffnet den Browser.
# ─────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WS_DIR="$(dirname "$SCRIPT_DIR")"
PORT=5000
URL="http://localhost:${PORT}"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  🚀  ROS 2 Nexus Web — Starte System..."
echo "════════════════════════════════════════════════════════"
echo "  Workspace:  $WS_DIR"
echo "  Nexus Web Backend: http://localhost:$PORT"
echo "════════════════════════════════════════════════════════"
echo ""

# ── Python-Abhängigkeiten prüfen ──────────────────────────────
echo "🔍 Prüfe Python-Abhängigkeiten..."
MISSING_DEPS=0
for dep in flask; do
    if ! python3 -c "import $dep" 2>/dev/null; then
        echo "  ❌ Fehlendes Modul: $dep"
        MISSING_DEPS=1
    else
        echo "  ✅ $dep"
    fi
done
if [ "$MISSING_DEPS" -eq 1 ]; then
    echo ""
    echo "⚠️  Fehlende Abhängigkeiten! Installiere automatisch..."
    pip3 install flask 2>&1
    echo ""
fi

# ── ROS 2 Umgebung laden ─────────────────────────────────────
echo "🔧 Lade ROS 2 Umgebung..."
source /opt/ros/humble/setup.bash 2>/dev/null && echo "  ✅ ROS 2 Humble" || echo "  ⚠️  ROS 2 Humble nicht gefunden"
if [ -f "$WS_DIR/install/setup.bash" ]; then
    source "$WS_DIR/install/setup.bash" 2>/dev/null && echo "  ✅ Workspace" || echo "  ⚠️  Workspace setup.bash fehlgeschlagen"
fi

# ── Nexus Web Backend prüfen / starten ─────────
echo ""
BACKEND_PID=""

FLASK_OK=false
curl -s --max-time 1 "$URL" > /dev/null 2>&1 && FLASK_OK=true

if $FLASK_OK; then
    echo "✅ Nexus Web Backend läuft bereits (Flask Port $PORT)"
fi

if ! $FLASK_OK; then
    echo "🚀 Starte Nexus Web Backend (Flask Port $PORT)..."
    cd "$WS_DIR"
    python3 "$SCRIPT_DIR/ros2_nexus_web.py" &
    BACKEND_PID=$!
    echo "   PID: $BACKEND_PID"

    echo "⏳ Warte auf Nexus Web Backend..."
    READY=0
    for i in {1..20}; do
        sleep 0.5
        if curl -s --max-time 1 "$URL" > /dev/null 2>&1; then
            READY=1
            break
        fi
        printf "."
    done
    echo ""
    if [ "$READY" -eq 1 ]; then
        echo "✅ Nexus Web Backend bereit!"
    else
        echo "❌ Nexus Web Backend nicht erreichbar nach 10s!"
    fi
fi

# ── Browser öffnen ────────────────────────────────────────────
echo ""
echo "🌐 Öffne Browser: $URL"
xdg-open "$URL" 2>/dev/null &

echo ""
echo "════════════════════════════════════════════════════════"
echo "  ✅ ROS 2 Nexus Web läuft!"
echo "  PID: ${BACKEND_PID:-bereits laufend}"
echo ""
echo "  Dieses Terminal offen lassen."
echo "  Zum Beenden: Strg+C  oder  'Kill all ROS2 Processes' im Browser"
echo "════════════════════════════════════════════════════════"
echo ""

# ── Cleanup beim Beenden ──────────────────────────────────────
cleanup() {
    echo ""
    echo "🛑 Beende Nexus Web Backend..."
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
    echo "✅ Beendet."
}
trap cleanup EXIT INT TERM

if [ -n "$BACKEND_PID" ]; then
    wait "$BACKEND_PID"
else
    echo "(Nexus Web Backend lief bereits. Strg+C zum Schließen dieses Fensters)"
    wait
fi
