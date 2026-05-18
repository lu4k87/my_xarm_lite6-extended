# OctoMap mit ZEDm in RViz2

## Voraussetzungen
- `ros-humble-octomap-server` installiert

```bash
sudo apt install ros-humble-octomap-server
```

---

## Schritte

**Terminal 1 – ZED Kamera**
```bash
ros2 launch zed_wrapper zed_camera.launch.py camera_model:=zedm
```

**Terminal 2 – OctoMap Server**
```bash
ros2 run octomap_server octomap_server_node --ros-args \
  -p resolution:=0.05 \
  -p frame_id:=zed_left_camera_frame \
  -r cloud_in:=/zed/zed_node/point_cloud/cloud_registered
```
- Startup-Warnungen (*"Nothing to publish"*, *"Could not open file"*) → ignorieren, normal

**Terminal 3 – RViz2**
```bash
rviz2 -d ~/dev_ws/src/zed-ros2-wrapper/zed_wrapper/config/rviz2/zedm.rviz
```

---

## RViz2 Konfiguration

- **Global Options → Fixed Frame** → `zed_left_camera_frame`
- **Add → By Topic** → `/octomap_point_cloud_centers` → `PointCloud2`
- Optional: **Add → By Topic** → `/occupied_cells_vis_array` → `MarkerArray` (3D-Voxel)

---

## Verifizieren

```bash
ros2 topic hz /octomap_point_cloud_centers
# Erwartet: ~1 Hz
```
