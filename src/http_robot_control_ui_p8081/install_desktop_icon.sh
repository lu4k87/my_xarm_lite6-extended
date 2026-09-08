#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ICON_SRC="$SCRIPT_DIR/icon.png"

echo "Installing Robot Control UI icon and desktop entry..."

# Install into ~/.local/share/icons
mkdir -p ~/.local/share/icons
cp -f "$ICON_SRC" ~/.local/share/icons/robot-control-ui.png

# Generate hicolor sizes
python3 -c "
import os
from PIL import Image
im = Image.open('$ICON_SRC')
sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024]
for s in sizes:
    d = os.path.expanduser(f'~/.local/share/icons/hicolor/{s}x{s}/apps')
    os.makedirs(d, exist_ok=True)
    im.resize((s, s), Image.Resampling.LANCZOS).save(os.path.join(d, 'robot-control-ui.png'))
"
gtk-update-icon-cache -f -t ~/.local/share/icons/hicolor 2>/dev/null || true

# Desktop entry
mkdir -p ~/.local/share/applications
cat > ~/.local/share/applications/robot-control-ui.desktop << EOF2
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

chmod +x ~/.local/share/applications/robot-control-ui.desktop
update-desktop-database ~/.local/share/applications/ 2>/dev/null || true

echo "✓ Robot Control UI icon and desktop entry installed successfully!"
