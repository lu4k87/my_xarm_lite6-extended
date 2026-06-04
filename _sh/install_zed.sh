#!/bin/bash
set -e

echo "==========================================================="
echo " ZED M Stereolabs Installation Script for Ubuntu 22.04 "
echo "==========================================================="

echo ""
echo "[1/3] Setting up CUDA 12.1 Toolkit..."
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-ubuntu2204.pin
sudo mv cuda-ubuntu2204.pin /etc/apt/preferences.d/cuda-repository-pin-600
sudo apt-key adv --fetch-keys https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/3bf863cc.pub
sudo add-apt-repository "deb https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/ /" -y
sudo apt update
sudo apt install cuda-toolkit-12-1 -y

echo "Adding CUDA to PATH in ~/.bashrc..."
if ! grep -q "cuda-12.1" ~/.bashrc; then
    echo 'export PATH=/usr/local/cuda-12.1/bin${PATH:+:${PATH}}' >> ~/.bashrc
    echo 'export LD_LIBRARY_PATH=/usr/local/cuda-12.1/lib64${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}' >> ~/.bashrc
fi
export PATH=/usr/local/cuda-12.1/bin${PATH:+:${PATH}}
export LD_LIBRARY_PATH=/usr/local/cuda-12.1/lib64${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}

echo ""
echo "[2/3] Downloading and Installing ZED SDK 4.1..."
cd /tmp
wget -O ZED_SDK_Ubuntu22.run https://stereolabs.sfo2.cdn.digitaloceanspaces.com/zedsdk/4.1/ZED_SDK_Ubuntu22_cuda12.1_v4.1.2.zstd.run
chmod +x ZED_SDK_Ubuntu22.run
echo "Running ZED SDK Installer..."
sudo ./ZED_SDK_Ubuntu22.run silent

echo ""
echo "[3/3] Setting up ZED ROS 2 Wrapper..."
mkdir -p ~/dev_ws/src
cd ~/dev_ws/src
if [ ! -d "zed-ros2-interfaces" ]; then
    git clone https://github.com/stereolabs/zed-ros2-interfaces.git
fi
if [ ! -d "zed-ros2-wrapper" ]; then
    git clone --recursive https://github.com/stereolabs/zed-ros2-wrapper.git
fi

cd ~/dev_ws
echo "Installing ROS 2 dependencies (requires rosdep initialization if not done yet)..."
sudo rosdep init || true
rosdep update
rosdep install --from-paths src --ignore-src -r -y

echo "Building the ROS 2 workspace..."
source /opt/ros/humble/setup.bash
colcon build --symlink-install --cmake-args=-DCMAKE_BUILD_TYPE=Release

echo "==========================================================="
echo " Installation Complete! "
echo " Please close this terminal and open a new one to apply the ~/.bashrc changes."
echo " To run the ZED wrapper: ros2 launch zed_wrapper zed_camera.launch.py camera_model:=zedm"
echo "==========================================================="
