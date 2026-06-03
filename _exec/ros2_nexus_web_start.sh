#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# ROS 2 Nexus Web — Launcher
# Startet Flask-Backend + Terminal-Server und öffnet den Browser
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
echo "  Backend:    http://localhost:$PORT"
echo "  Terminal:   ws://localhost:8765"
echo "════════════════════════════════════════════════════════"
echo ""

# ── Python-Abhängigkeiten prüfen ──────────────────────────────
echo "🔍 Prüfe Python-Abhängigkeiten..."
MISSING_DEPS=0

for dep in flask flask_socketio websockets; do
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
    pip3 install flask flask-socketio websockets 2>&1
    echo ""
fi

# ── ROS 2 Umgebung laden ─────────────────────────────────────
echo "🔧 Lade ROS 2 Umgebung..."
source /opt/ros/humble/setup.bash 2>/dev/null && echo "  ✅ ROS 2 Humble" || echo "  ⚠️  ROS 2 Humble nicht gefunden"
if [ -f "$WS_DIR/install/setup.bash" ]; then
    source "$WS_DIR/install/setup.bash" 2>/dev/null && echo "  ✅ Workspace" || echo "  ⚠️  Workspace setup.bash fehlgeschlagen"
fi

# ── Backend prüfen / starten ──────────────────────────────────
if curl -s --max-time 1 "$URL" > /dev/null 2>&1; then
    echo ""
    echo "✅ Backend läuft bereits auf Port $PORT"
    BACKEND_PID=""
    TERM_PID=""
else
    echo ""
    echo "🚀 Starte Flask-Backend (Port $PORT)..."
    cd "$WS_DIR"
    python3 "$SCRIPT_DIR/ros2_nexus_web.py" &
    BACKEND_PID=$!
    echo "   PID: $BACKEND_PID"

    echo "🚀 Starte Terminal-Server (Port 8765)..."
    python3 "$SCRIPT_DIR/terminal_server.py" &
    TERM_PID=$!
    echo "   PID: $TERM_PID"

    # Warten bis Flask antwortet (max 8 Sekunden)
    echo ""
    echo "⏳ Warte auf Backend..."
    READY=0
    for i in {1..16}; do
        sleep 0.5
        if curl -s --max-time 1 "$URL" > /dev/null 2>&1; then
            READY=1
            break
        fi
        printf "."
    done
    echo ""

    if [ "$READY" -eq 1 ]; then
        echo "✅ Backend bereit!"
    else
        echo "❌ Backend nicht erreichbar nach 8s!"
        echo "   Prüfe ob Port $PORT belegt ist: ss -tlnp | grep $PORT"
    fi

    # Kurz warten damit terminal_server.py auch hochfährt
    sleep 0.5
fi

# ── Browser öffnen ────────────────────────────────────────────
echo ""
echo "🌐 Öffne Browser: $URL"
xdg-open "$URL" 2>/dev/null &

echo ""
echo "════════════════════════════════════════════════════════"
echo "  ✅ ROS 2 Nexus Web läuft!"
echo "  Backend PID:  ${BACKEND_PID:-bereits laufend}"
echo "  Terminal PID: ${TERM_PID:-bereits laufend}"
echo ""
echo "  Dieses Terminal offen lassen (Backend läuft hier)."
echo "  Zum Beenden: Strg+C  oder  'Alle Beenden' im Browser"
echo "════════════════════════════════════════════════════════"
echo ""

# ── Warten und Cleanup ────────────────────────────────────────
if [ -n "$BACKEND_PID" ]; then
    trap "echo ''; echo '🛑 Beende alle Prozesse...'; kill $BACKEND_PID $TERM_PID 2>/dev/null; echo '✅ Beendet.'" EXIT INT TERM
    wait $BACKEND_PID
else
    # Backend lief bereits: einfach warten bis Strg+C
    echo "(Backend lief bereits. Strg+C zum Schließen dieses Fensters)"
    wait
fi
