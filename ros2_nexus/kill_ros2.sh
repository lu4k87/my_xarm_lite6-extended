#!/bin/bash
# Beendet alle ROS 2 Prozesse sauber: erst SIGINT (wie Ctrl+C, damit Launch-
# Files ihre Nodes herunterfahren), dann SIGTERM, Reste per SIGKILL.
# Zum Schluss den ROS 2 Daemon stoppen (veraltete Graph-Infos).
PATTERNS=("ros2 run" "ros2 launch" "rviz2")

alive() {
  for p in "${PATTERNS[@]}"; do pgrep -f "$p" >/dev/null && return 0; done
  return 1
}

signal_all() {
  for p in "${PATTERNS[@]}"; do pkill "-$1" -f "$p"; done
}

for sig in INT TERM; do
  signal_all "$sig"
  for _ in $(seq 1 10); do alive || break; sleep 0.5; done
  alive || break
done
alive && signal_all KILL

# Offene Terminal-Wrapper der gestarteten Befehle schliessen
pkill -TERM -f "eval.*exec bash"; sleep 0.3; pkill -KILL -f "eval.*exec bash"

ros2 daemon stop >/dev/null 2>&1 || pkill -f "ros2-daemon"
exit 0
