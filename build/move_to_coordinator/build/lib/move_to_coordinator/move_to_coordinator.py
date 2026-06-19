#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import time
import threading
from time import monotonic
from typing import Dict, Optional

import rclpy
from rclpy.node import Node

from std_msgs.msg import String
from geometry_msgs.msg import PoseArray, Pose
from std_srvs.srv import Trigger
from xarm_msgs.srv import MoveCartesian

# =========================
# Services (deine API)
# =========================
SAFE_POSE_SERVICE = '/execute_motion_sequence_scan_object_positions_pos'
MOVE_POSE_SERVICE = '/execute_motion_to_pose'
BUSY_SERVICE      = '/get_motion_busy'

# =========================
# Topics (deine funktionierende Topics)
# =========================
CLASS_TO_TOPIC = {
    "red rectangle":  "/objects/red_rectangle/world_poses",
    "blue cube":      "/objects/blue_cube/world_poses",
    "green cylinder": "/objects/green_cylinder/world_poses",
}

# =========================
# Voice -> Intent Mapping
# =========================
VOICE_TO_KEY = {
    "move to red":   "red",
    "move to blue":  "blue",
    "move to green": "green",
}

KEY_TO_LABEL = {
    "red":   "red rectangle",
    "blue":  "blue cube",
    "green": "green cylinder",
}

# =========================
# Bewegungs-/Ablauf-Parameter
# =========================
TARGET_Z_MM = 123.0
ROLL = 3.14; PITCH = 0.0; YAW = 0.0
SPEED = 100.0; ACC = 250.0; MVTIME = 0.0

POSE_TIMEOUT_SEC = 15.0
VISION_STABILIZE_SEC = 2.0

# =========================
# Anti-Duplicate-Parameter
# =========================
GLOBAL_COOLDOWN_SEC = 1.0       # globaler Mindestabstand zwischen zwei Kommandos (egal welche Farbe)
REFRACTORY_PER_COLOR_SEC = 3.0  # Mindestabstand für dieselbe Farbe
RECENT_WINDOW_SIZE = 6          # kleine FIFO gegen schnelle Doppeltrigger
# =========================


def _norm_text(t: str) -> str:
    t = (t or "").strip().lower()
    # Minimal normalisieren (Punkte etc. entfernen)
    for ch in ".!?,;:":
        t = t.replace(ch, "")
    return " ".join(t.split())


class MoveToCoordinator(Node):
    def __init__(self):
        super().__init__('move_to_coordinator')

        # Voice-Cmd
        self.create_subscription(String, '/voice_cmd', self.on_cmd, 10)

        # Posen pro Key (red/green/blue)
        self.latest_pose: Dict[str, Pose] = {}
        self.pose_stamp: Dict[str, float] = {}

        # --- Feste Subscriptions auf deine funktionierenden Topics ---
        self.create_subscription(
            PoseArray, CLASS_TO_TOPIC["red rectangle"],
            lambda m: self.on_pose(m, 'red'), 10
        )
        self.create_subscription(
            PoseArray, CLASS_TO_TOPIC["green cylinder"],
            lambda m: self.on_pose(m, 'green'), 10
        )
        self.create_subscription(
            PoseArray, CLASS_TO_TOPIC["blue cube"],
            lambda m: self.on_pose(m, 'blue'), 10
        )

        # Services
        self.safe_cli = self.create_client(Trigger, SAFE_POSE_SERVICE)
        self.move_cli = self.create_client(MoveCartesian, MOVE_POSE_SERVICE)
        self.busy_cli = self.create_client(Trigger, BUSY_SERVICE)

        # Queue & Laufzustand
        self.queue = []
        self.running = False

        # Anti-Duplicate-Zustände
        self.last_any_time = 0.0            # Zeitpunkt des letzten akzeptierten Kommandos (egal welche Farbe)
        self.last_intent_time: Dict[str, float] = {"red": 0.0, "green": 0.0, "blue": 0.0}
        self.recent_keys = []               # FIFO zuletzt akzeptierter Farben (kleines Fenster)
        self.recent_max = RECENT_WINDOW_SIZE

        # Verfügbarkeit loggen (informativ)
        for (name, cli) in [
            (SAFE_POSE_SERVICE, self.safe_cli),
            (MOVE_POSE_SERVICE, self.move_cli),
            (BUSY_SERVICE, self.busy_cli),
        ]:
            cli.wait_for_service(timeout_sec=2.0)
            self.get_logger().info(f"Service {name}: {'AVAILABLE' if cli.service_is_ready() else 'NOT AVAILABLE'}")

        self.get_logger().info(
            f"MoveToCoordinator ready. (anti-duplicate: global={GLOBAL_COOLDOWN_SEC:.1f}s, per_color={REFRACTORY_PER_COLOR_SEC:.1f}s)"
        )

    # ------------ Callbacks ------------
    def on_cmd(self, msg: String):
        raw = msg.data or ''
        text = _norm_text(raw)

        # 1) exakte Phrasen
        key: Optional[str] = VOICE_TO_KEY.get(text)

        # 2) robuste Fallbacks (wie bei dir)
        if key is None and text.startswith("move to "):
            if "red rectangle" in text:
                key = "red"
            elif "blue cube" in text:
                key = "blue"
            elif "green cylinder" in text or "grren" in text:
                key = "green"
            elif text.endswith(" red") or " red" in text:
                key = "red"
            elif text.endswith(" blue") or " blue" in text:
                key = "blue"
            elif text.endswith(" green") or " green" in text:
                key = "green"

        if key not in ("red", "green", "blue"):
            self.get_logger().info(f"Ignored voice cmd: '{raw}'")
            return

        now = monotonic()

        # --- Anti-Duplicate Gates ---

        # A) Globaler Cooldown (schützt vor schnell nacheinander gesendeten Duplikaten insgesamt)
        if (now - self.last_any_time) < GLOBAL_COOLDOWN_SEC:
            self.get_logger().debug(f"Drop '{key}' (global cooldown {GLOBAL_COOLDOWN_SEC*1000:.0f}ms).")
            return

        # B) Refractory je Farbe
        if (now - self.last_intent_time[key]) < REFRACTORY_PER_COLOR_SEC:
            self.get_logger().debug(f"Drop '{key}' (per-color refractory {REFRACTORY_PER_COLOR_SEC:.1f}s).")
            return

        # C) Nicht doppelt in die Queue legen
        if key in self.queue:
            self.get_logger().debug(f"Drop '{key}' (already queued).")
            # aktualisiere trotzdem per-color Zeit, damit Spam abflaut
            self.last_intent_time[key] = now
            self.last_any_time = now
            return

        # D) „Recent“-Sperre gegen unmittelbare Wiederholungen (z. B. ASR Doppel-Finals)
        if key in self.recent_keys:
            self.get_logger().debug(f"Drop '{key}' (recent seen).")
            self.last_intent_time[key] = now
            self.last_any_time = now
            return

        # --- akzeptieren & einreihen ---
        self.recent_keys.append(key)
        if len(self.recent_keys) > self.recent_max:
            self.recent_keys.pop(0)

        self.queue.append(key)
        self.last_intent_time[key] = now
        self.last_any_time = now

        label = KEY_TO_LABEL[key]
        self.get_logger().info(f"Queued command: move to {key} ({label}) (queue size: {len(self.queue)})")

        if not self.running:
            # In eigenem Thread ausführen, damit der Executor weiter spint
            threading.Thread(target=self._run_queue, daemon=True).start()

    def on_pose(self, msg: PoseArray, key: str):
        if msg.poses:
            self.latest_pose[key] = msg.poses[0]
            self.pose_stamp[key] = time.time()
            # Debug-Log zeigt, dass Vision lebt
            self.get_logger().debug(f"[pose] {key} updated.")

    # ------------ Haupt-Queue ------------
    def _run_queue(self):
        if self.running:
            return
        self.running = True
        try:
            while self.queue:
                key = self.queue.pop(0)
                label = KEY_TO_LABEL.get(key, key)
                self.get_logger().info(f"→ Start sequence: move to {key} ({label})")

                # 1) Safe-Pose
                if not self._call_trigger(self.safe_cli, SAFE_POSE_SERVICE, timeout=20.0):
                    self.get_logger().error("Safe-Pose call failed.")
                    continue

                # 2) Warten bis IDLE
                if not self._wait_idle(timeout_sec=30.0, phase='after safe-pose'):
                    self.get_logger().error("Motion-Node stayed BUSY after safe-pose.")
                    continue

                # 3) Vision stabilisieren
                time.sleep(VISION_STABILIZE_SEC)

                # 4) Auf FRISCHE Pose warten (neuer Timestamp als zuletzt gesehen)
                pose = self._wait_for_pose(key, POSE_TIMEOUT_SEC)
                if pose is None:
                    self.get_logger().error(f"No {key} ({label}) pose received within {POSE_TIMEOUT_SEC}s.")
                    continue

                # 5) Pose -> Zielvektor (API-konform: [x,y,z,rx,ry,rz] + speed/acc/mvtime)
                x_mm = float(pose.position.x) * 1000.0
                y_mm = float(pose.position.y) * 1000.0
                target = [x_mm, y_mm, TARGET_Z_MM, ROLL, PITCH, YAW]
                self.get_logger().info(f"→ Final move to {key} ({label}): {target}")

                req = MoveCartesian.Request()
                req.pose = target
                req.speed = SPEED
                req.acc = ACC
                req.mvtime = MVTIME

                if not self._call_move(self.move_cli, req, MOVE_POSE_SERVICE, timeout=25.0):
                    self.get_logger().error("Move-to-pose call failed.")
                    continue

                # 6) Warten bis IDLE
                if not self._wait_idle(timeout_sec=40.0, phase='after final move'):
                    self.get_logger().error("Motion-Node stayed BUSY after final move.")
                    continue

                self.get_logger().info("✓ Sequence finished.")
        finally:
            self.running = False

    # ------------ Hilfen ------------
    def _wait_for_pose(self, key: str, timeout_sec: float) -> Optional[Pose]:
        """Wartet auf eine FRISCHE Pose für den Key 'red|green|blue'."""
        t_end = time.time() + timeout_sec
        last_seen = self.pose_stamp.get(key, 0.0)
        while time.time() < t_end:
            ts = self.pose_stamp.get(key, 0.0)
            if ts > last_seen:
                return self.latest_pose.get(key)
            time.sleep(0.05)
        return None

    def _call_trigger(self, cli, name, timeout=10.0):
        self.get_logger().info(f"[CALL] {name} …")
        if not cli.wait_for_service(timeout_sec=timeout):
            self.get_logger().error(f"{name}: service not available.")
            return False

        fut = cli.call_async(Trigger.Request())
        end = time.time() + timeout
        while not fut.done() and time.time() < end:
            rclpy.spin_once(self, timeout_sec=0.1)

        if not fut.done():
            self.get_logger().error(f"{name}: call timed out.")
            return False

        resp = fut.result()
        if resp is None:
            self.get_logger().error(f"{name}: no response.")
            return False

        self.get_logger().info(f"[RESP] {name}: success={resp.success}, message='{resp.message}'")
        return bool(resp.success)

    def _call_move(self, cli, req: MoveCartesian.Request, name, timeout=25.0):
        self.get_logger().info(f"[CALL] {name} … pose={list(req.pose)} speed={req.speed} acc={req.acc}")
        if not cli.wait_for_service(timeout_sec=timeout):
            self.get_logger().error(f"{name}: service not available within {timeout}s.")
            return False

        fut = cli.call_async(req)
        end = time.time() + timeout
        while not fut.done() and time.time() < end:
            rclpy.spin_once(self, timeout_sec=0.1)

        if not fut.done():
            self.get_logger().error(f"{name}: call timed out.")
            return False

        resp = fut.result()
        ok = bool(resp and getattr(resp, 'ret', 0) == 0)
        ret_val = getattr(resp, 'ret', '?')
        status_msg = "OK" if ok else f"FAIL (ret={ret_val})"
        self.get_logger().info(f"[RESP] {name}: {status_msg}")
        return ok

    def _wait_idle(self, timeout_sec=20.0, phase=''):
        t0 = time.time()
        while (time.time() - t0) < timeout_sec:
            if not self.busy_cli.wait_for_service(timeout_sec=2.0):
                time.sleep(0.2)
                continue
            fut = self.busy_cli.call_async(Trigger.Request())
            end = time.time() + 2.0
            while not fut.done() and time.time() < end:
                rclpy.spin_once(self, timeout_sec=0.1)
            if fut.done():
                resp = fut.result()
                if resp and getattr(resp, 'success', False):
                    self.get_logger().info(f"✓ Motion-Node is IDLE {('(' + phase + ')') if phase else ''}.")
                    return True
            time.sleep(0.2)
        self.get_logger().error(f"Timeout waiting for IDLE {('(' + phase + ')') if phase else ''}.")
        return False


def main():
    rclpy.init()
    node = MoveToCoordinator()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()

