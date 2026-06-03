#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# ROS 2 Nexus Web — Launcher
# Startet Flask-Backend + Terminal-Server und öffnet den Browser
# ─────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WS_DIR="$(dirname "$SCRIPT_DIR")"
PORT=5000
TERM_PORT=8765
URL="http://localhost:${PORT}"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  🚀  ROS 2 Nexus Web — Starte System..."
echo "════════════════════════════════════════════════════════"
echo "  Workspace:  $WS_DIR"
echo "  Backend:    http://localhost:$PORT"
echo "  Terminal:   ws://localhost:$TERM_PORT"
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

# ── Flask-Backend prüfen / starten ────────────────────────────
# WICHTIG: Beide Server UNABHÄNGIG voneinander prüfen!
echo ""
BACKEND_PID=""
if curl -s --max-time 1 "$URL" > /dev/null 2>&1; then
    echo "✅ Flask-Backend läuft bereits auf Port $PORT"
else
    echo "🚀 Starte Flask-Backend (Port $PORT)..."
    cd "$WS_DIR"
    python3 "$SCRIPT_DIR/ros2_nexus_web.py" &
    BACKEND_PID=$!
    echo "   PID: $BACKEND_PID"

    # Warten bis Flask antwortet (max 8 Sekunden)
    echo "⏳ Warte auf Flask-Backend..."
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
        echo "✅ Flask-Backend bereit!"
    else
        echo "❌ Flask-Backend nicht erreichbar nach 8s! (Port $PORT belegt?)"
    fi
fi

# ── Terminal-Server prüfen / starten ──────────────────────────
# UNABHÄNGIG von Flask! Auch wenn Flask bereits lief, muss der
# terminal_server separat geprüft werden (Port 8765).
TERM_PID=""
if ss -tlnp 2>/dev/null | grep -q ":${TERM_PORT}"; then
    echo "✅ Terminal-Server läuft bereits auf Port $TERM_PORT"
else
    echo "🚀 Starte Terminal-Server (Port $TERM_PORT)..."
    python3 "$SCRIPT_DIR/terminal_server.py" &
    TERM_PID=$!
    echo "   PID: $TERM_PID"
    # Kurz warten bis terminal_server hochfährt
    sleep 1
    if ss -tlnp 2>/dev/null | grep -q ":${TERM_PORT}"; then
        echo "✅ Terminal-Server bereit!"
    else
        echo "❌ Terminal-Server konnte nicht starten!"
        echo "   Test: python3 $SCRIPT_DIR/terminal_server.py"
    fi
fi

# ── Browser öffnen ────────────────────────────────────────────
echo ""
echo "🌐 Öffne Browser: $URL"
xdg-open "$URL" 2>/dev/null &

echo ""
echo "════════════════════════════════════════════════════════"
echo "  ✅ ROS 2 Nexus Web läuft!"
echo "  Flask PID:    ${BACKEND_PID:-bereits laufend}"
echo "  Terminal PID: ${TERM_PID:-bereits laufend}"
echo ""
echo "  Dieses Terminal offen lassen (Backend läuft hier)."
echo "  Zum Beenden: Strg+C  oder  'Alle Beenden' im Browser"
echo "════════════════════════════════════════════════════════"
echo ""

# ── Warten und Cleanup ────────────────────────────────────────
# Beide PIDs sauber beenden wenn dieses Terminal geschlossen wird
cleanup() {
    echo ""
    echo "🛑 Beende alle Prozesse..."
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
    [ -n "$TERM_PID" ]    && kill "$TERM_PID"    2>/dev/null
    echo "✅ Beendet."
}
trap cleanup EXIT INT TERM

if [ -n "$BACKEND_PID" ]; then
    wait "$BACKEND_PID"
else
    # Backend lief bereits: auf terminal_server warten (falls neu gestartet)
    # oder einfach offen halten bis Strg+C
    if [ -n "$TERM_PID" ]; then
        wait "$TERM_PID"
    else
        echo "(Beide Dienste liefen bereits. Strg+C zum Schließen dieses Fensters)"
        wait
    fi
fi
