#!/usr/bin/env bash
# Increases Linux network buffer sizes for high-bandwidth ROS 2 CycloneDDS topics (ZED PointCloud2, WebRTC)
set -e

echo "Optimizing Linux network buffers for high-bandwidth ROS 2 DDS streaming..."
sudo sysctl -w net.core.rmem_max=26214400
sudo sysctl -w net.core.rmem_default=26214400
sudo sysctl -w net.core.wmem_max=26214400
sudo sysctl -w net.core.wmem_default=26214400

echo "Network buffers successfully increased to 25MB."
