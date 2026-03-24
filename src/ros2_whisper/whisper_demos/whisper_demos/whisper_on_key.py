#!/usr/bin/env python3
"""
Whisper On Key (ROS 2 Humble)
- SPACE: Start/Stop (Stop via cancel_goal)
- ESC: Beenden
"""

import sys
import time
from typing import Optional, Any

import rclpy
from rclpy.node import Node
from rclpy.action import ActionClient
from rclpy.task import Future
from builtin_interfaces.msg import Duration
from pynput.keyboard import Key, Listener

# >>> KORREKTER ACTION-IMPORT FÜR DEIN SETUP <<<
from whisper_idl.action import Inference


class WhisperOnKey(Node):
    def __init__(self,
                 node_name: str = "whisper_on_key",
                 action_name: str = "/whisper/inference",
                 max_duration_sec: int = 20,
                 debounce_s: float = 0.20):
        super().__init__(node_name=node_name)

        self._action_name = action_name
        self._max_duration_sec = int(max_duration_sec)
        self._debounce_s = float(debounce_s)

        # Zustände
        self.is_listening: bool = False
        self.current_goal_handle: Optional[Any] = None
        self._last_space_ts = 0.0

        # Action Client
        self.whisper_client = ActionClient(self, Inference, self._action_name)

        self.get_logger().info(f"Verbinde zu Action Server '{self._action_name}' ...")
        while not self.whisper_client.wait_for_server(timeout_sec=1.0):
            self.get_logger().warn(f"Warte auf Action Server '{self._action_name}' ...")
        self.get_logger().info(f"Action Server '{self._action_name}' gefunden.")

        # Keyboard Listener
        self.key_listener = Listener(on_press=self.on_key)
        self.key_listener.start()

        self.get_logger().info("Bereit. SPACE: Start/Stop, ESC: Beenden")

    # -------------------------
    # Keyboard Handling
    # -------------------------
    def on_key(self, key: Key) -> None:
        try:
            if key == Key.esc:
                self.get_logger().info("ESC gedrückt – beende.")
                self._shutdown()
                return

            if key == Key.space:
                now = time.time()
                if now - self._last_space_ts < self._debounce_s:  # Debounce gegen Auto-Repeat
                    return
                self._last_space_ts = now
                self.on_space()
        except Exception as e:
            self.get_logger().error(f"Fehler im Key-Handler: {e}")

    def on_space(self) -> None:
        """Toggle: Startet neues Goal oder cancelt das laufende Goal."""
        if self.is_listening and self.current_goal_handle is not None:
            self.get_logger().info("SPACE: Stoppe Inference (Cancel Goal) ...")
            future = self.current_goal_handle.cancel_goal_async()
            future.add_done_callback(self._on_cancel_done)
            return

        # Neues Goal
        goal_msg = Inference.Goal()
        # Häufiges Feld: max_duration (Duration). Falls dein Interface anders heißt, hier anpassen.
        goal_msg.max_duration = Duration(sec=self._max_duration_sec, nanosec=0)

        self.get_logger().info(f"SPACE: Starte Inference für {self._max_duration_sec} s ...")
        future = self.whisper_client.send_goal_async(goal_msg, feedback_callback=self.on_feedback)
        future.add_done_callback(self.on_goal_accepted)

    # -------------------------
    # Action Callbacks
    # -------------------------
    def on_goal_accepted(self, future: Future) -> None:
        try:
            goal_handle = future.result()
        except Exception as e:
            self.get_logger().error(f"Goal-Akzeptanz fehlgeschlagen: {e}")
            return

        if not goal_handle or not goal_handle.accepted:
            self.get_logger().error("Goal wurde vom Server abgelehnt.")
            return

        self.current_goal_handle = goal_handle
        self.is_listening = True
        self.get_logger().info("Goal akzeptiert. Lausche ... (erneut SPACE: Stop)")

        result_future = goal_handle.get_result_async()
        result_future.add_done_callback(self.on_done)

    def _on_cancel_done(self, future: Future) -> None:
        try:
            cancel_response = future.result()
            if getattr(cancel_response, "goals_canceling", []):
                self.get_logger().info("Inference gestoppt (Cancel bestätigt).")
            else:
                self.get_logger().warn("Cancel ohne laufende Goals bestätigt (war evtl. schon fertig).")
        except Exception as e:
            self.get_logger().warn(f"Cancel-Callback-Fehler: {e}")
        finally:
            self.is_listening = False
            self.current_goal_handle = None

    def on_feedback(self, feedback_msg) -> None:
        # Optional: Feedback-Felder deines Inference.Feedback hier loggen
        # z.B.: self.get_logger().debug(f"Feedback: {feedback_msg.feedback.snr_db:.1f} dB")
        pass

    def on_done(self, future: Future) -> None:
        try:
            result_wrapper = future.result()
            result = getattr(result_wrapper, "result", result_wrapper)
            # Häufiges Feld: transcriptions (Liste/String). Ggf. anpassen.
            trans = getattr(result, "transcriptions", None)
            if trans is not None:
                self.get_logger().info(f"Result: {trans}")
            else:
                self.get_logger().info("Result empfangen (Felder ggf. anpassen).")
        except Exception as e:
            self.get_logger().error(f"Fehler im Result-Callback: {e}")
        finally:
            self.is_listening = False
            self.current_goal_handle = None

    # -------------------------
    # Shutdown
    # -------------------------
    def _shutdown(self):
        try:
            if self.key_listener and self.key_listener.running:
                self.key_listener.stop()
        except Exception:
            pass
        try:
            rclpy.shutdown()
        except Exception:
            pass


def main(argv=None):
    rclpy.init(args=argv)
    node = WhisperOnKey(
        node_name="whisper_on_key",
        action_name="/whisper/inference",
        max_duration_sec=20,
        debounce_s=0.20,
    )
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        node.get_logger().info("KeyboardInterrupt – beende.")
    finally:
        node._shutdown()


if __name__ == "__main__":
    main()

