#!/bin/bash
pkill -f "ros2 run"
pkill -f "ros2 launch"
killall -9 rviz2
pkill -f "eval.*exec bash"
# kill all child processes of gnome-terminal-server that are bash? No, the above is enough.
exit 0
