#!/bin/bash
# ─────────────────────────────────────────────────
# ROS 2 Nexus Web — Launcher
# Startet das Flask-Backend und öffnet den Browser
# ─────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WS_DIR="$(dirname "$SCRIPT_DIR")"
PORT=5000
URL="http://localhost:${PORT}"

# Prüfen ob Backend bereits läuft
if curl -s --head "$URL" > /dev/null 2>&1; then
    echo "✅ Backend läuft bereits auf Port $PORT"
else
    echo "🚀 Starte Flask-Backend..."
    cd "$WS_DIR"
    source /opt/ros/humble/setup.bash 2>/dev/null
    source "$WS_DIR/install/setup.bash" 2>/dev/null
    python3 "$SCRIPT_DIR/ros2_nexus_web.py" &
    BACKEND_PID=$!
    echo "   PID: $BACKEND_PID"

    # Warten bis der Server antwortet (max 5 Sek.)
    for i in {1..10}; do
        if curl -s --head "$URL" > /dev/null 2>&1; then
            echo "✅ Backend bereit!"
            break
        fi
        sleep 0.5
    done
fi

# Browser öffnen
echo "🌐 Öffne Browser: $URL"
xdg-open "$URL" 2>/dev/null &

# Warten auf Backend (falls gestartet)
if [ -n "$BACKEND_PID" ]; then
    wait $BACKEND_PID
fi
