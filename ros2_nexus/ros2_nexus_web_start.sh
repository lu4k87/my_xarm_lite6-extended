#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# ROS 2 Nexus Web — Launcher
# Startet Nexus Web Backend (beinhaltet terminal_server auf Port 8765)
# und öffnet den Browser.
# ─────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WS_DIR="$(dirname "$SCRIPT_DIR")"
PORT=5000
URL="http://127.0.0.1:${PORT}"

# ANSI Colors
C_CYAN="\033[1;36m"
C_GREEN="\033[1;32m"
C_YELLOW="\033[1;33m"
C_RED="\033[1;31m"
C_BOLD="\033[1m"
C_RESET="\033[0m"

# Absolute Column Positions (forces tabular alignment regardless of emoji width)
T_ICON="\033[2G"
T_TEXT="\033[6G"
T_VAL="\033[25G"

# Icons
I_START="🚀"
I_INFO="🔍"
I_OK="✅"
I_FAIL="❌"
I_WARN="⚠️ "
I_WRENCH="🔧"
I_WAIT="⏳"
I_WEB="🌐"
I_STOP="🛑"

echo ""
echo -e "${C_CYAN}========================================================${C_RESET}"
echo -e "${T_ICON}${I_START}${T_TEXT}${C_BOLD}ROS 2 Nexus Web — Starte System...${C_RESET}"
echo -e "${C_CYAN}========================================================${C_RESET}"
echo -e "${T_TEXT}${C_BOLD}Workspace:${T_VAL}$WS_DIR${C_RESET}"
echo -e "${T_TEXT}${C_BOLD}Nexus Web Backend:${T_VAL}http://localhost:$PORT${C_RESET}"
echo -e "${C_CYAN}========================================================${C_RESET}"

echo ""
# ── Python-Abhängigkeiten prüfen ──────────────────────────────
echo -e "${T_ICON}${I_INFO}${T_TEXT}${C_BOLD}Prüfe Python-Abhängigkeiten...${C_RESET}"
MISSING_DEPS=0
for dep in flask; do
    if ! python3 -c "import $dep" 2>/dev/null; then
        echo -e "${T_ICON}${I_FAIL}${T_TEXT}${C_RED}Fehlendes Modul: $dep${C_RESET}"
        MISSING_DEPS=1
    else
        desc=""
        [ "$dep" == "flask" ] && desc=" (Stellt den Webserver für das User-Interface bereit)"
        echo -e "${T_ICON}${I_OK}${T_TEXT}${C_GREEN}$dep${C_RESET}${desc}"
    fi
done
if [ "$MISSING_DEPS" -eq 1 ]; then
    echo ""
    echo -e "${T_ICON}${I_WARN}${T_TEXT}${C_YELLOW}Fehlende Abhängigkeiten! Installiere automatisch...${C_RESET}"
    pip3 install flask 2>&1
fi

echo ""
# ── ROS 2 Umgebung laden ─────────────────────────────────────
echo -e "${T_ICON}${I_WRENCH}${T_TEXT}${C_BOLD}Lade ROS 2 Umgebung...${C_RESET}"
source /opt/ros/humble/setup.bash 2>/dev/null && echo -e "${T_ICON}${I_OK}${T_TEXT}${C_GREEN}ROS 2 Humble${C_RESET}" || echo -e "${T_ICON}${I_WARN}${T_TEXT}${C_YELLOW}ROS 2 Humble nicht gefunden${C_RESET}"
if [ -f "$WS_DIR/install/setup.bash" ]; then
    source "$WS_DIR/install/setup.bash" 2>/dev/null && echo -e "${T_ICON}${I_OK}${T_TEXT}${C_GREEN}Workspace${C_RESET}" || echo -e "${T_ICON}${I_WARN}${T_TEXT}${C_YELLOW}Workspace setup.bash fehlgeschlagen${C_RESET}"
fi

echo ""
# ── Nexus Web Backend prüfen / starten ─────────
BACKEND_PID=""

FLASK_OK=false
curl -s --max-time 1 "$URL" > /dev/null 2>&1 && FLASK_OK=true

if $FLASK_OK; then
    echo -e "${T_ICON}${I_OK}${T_TEXT}${C_GREEN}Nexus Web Backend läuft bereits (Flask Port $PORT)${C_RESET}"
fi

if ! $FLASK_OK; then
    echo -e "${T_ICON}${I_START}${T_TEXT}${C_BOLD}Starte Nexus Web Backend (Flask Port $PORT)...${C_RESET}"
    cd "$WS_DIR"
    # Führe Python Backend im Hintergrund aus, ohne den Terminal Output zu blockieren
    python3 "$SCRIPT_DIR/ros2_nexus_web.py" &
    BACKEND_PID=$!

    echo -ne "${T_ICON}${I_WAIT}${T_TEXT}Warte auf Nexus Web Backend..."
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
        echo -e "${T_ICON}${I_OK}${T_TEXT}${C_GREEN}Nexus Web Backend bereit!${C_RESET}"
    else
        echo -e "${T_ICON}${I_FAIL}${T_TEXT}${C_RED}Nexus Web Backend nicht erreichbar nach 10s!${C_RESET}"
    fi
fi

echo ""
# ── Browser öffnen ────────────────────────────────────────────
echo -e "${T_ICON}${I_WEB}${T_TEXT}${C_BOLD}Öffne Browser:${C_RESET} $URL"
if command -v google-chrome &> /dev/null; then
    google-chrome --user-data-dir="$HOME/.ros2_nexus_profile" --class="ros2-nexus" --app="$URL" --start-maximized 2>/dev/null &
elif command -v chromium-browser &> /dev/null; then
    chromium-browser --user-data-dir="$HOME/.ros2_nexus_profile" --class="ros2-nexus" --app="$URL" --start-maximized 2>/dev/null &
else
    xdg-open "$URL" 2>/dev/null &
fi

echo ""
echo -e "${C_GREEN}========================================================${C_RESET}"
echo -e "${T_ICON}${I_OK}${T_TEXT}${C_GREEN}${C_BOLD}ROS 2 Nexus Web läuft!${C_RESET}"
echo -e "${T_TEXT}${C_BOLD}PID:${T_VAL}${BACKEND_PID:-bereits laufend}${C_RESET}"
echo ""
echo -e "${T_TEXT}Dieses Terminal offen lassen."
echo -e "${T_TEXT}Zum Beenden: Strg+C  oder  'Kill all ROS2 Processes' im Browser"
echo -e "${C_GREEN}========================================================${C_RESET}"
echo ""

# ── Cleanup beim Beenden ──────────────────────────────────────
cleanup() {
    echo ""
    echo -e "${T_ICON}${I_STOP}${T_TEXT}${C_BOLD}Beende Nexus Web Backend...${C_RESET}"
    [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
    echo -e "${T_ICON}${I_OK}${T_TEXT}${C_GREEN}Beendet.${C_RESET}"
}
trap cleanup EXIT INT TERM

if [ -n "$BACKEND_PID" ]; then
    wait "$BACKEND_PID"
else
    echo "(Nexus Web Backend lief bereits. Strg+C zum Schließen dieses Fensters)"
    wait
fi
