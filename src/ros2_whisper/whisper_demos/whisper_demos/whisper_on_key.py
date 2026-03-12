import sys
import tty
import termios
import threading

import rclpy
from builtin_interfaces.msg import Duration
from rclpy.action import ActionClient
from rclpy.node import Node
from rclpy.task import Future
from whisper_idl.action._inference import Inference_FeedbackMessage

from whisper_idl.action import Inference


def read_key():
    """Read a single keypress from the terminal (works under Wayland and X11)."""
    fd = sys.stdin.fileno()
    old_settings = termios.tcgetattr(fd)
    try:
        tty.setraw(fd)
        ch = sys.stdin.read(1)
    finally:
        termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
    return ch


class WhisperOnKey(Node):
    def __init__(self, node_name: str) -> None:
        super().__init__(node_name=node_name)

        # whisper
        self.batch_idx = -1
        self.whisper_client = ActionClient(self, Inference, "/whisper/inference")

        while not self.whisper_client.wait_for_server(1):
            self.get_logger().warn(
                f"Waiting for {self.whisper_client._action_name} action server.."
            )
        self.get_logger().info(
            f"Action server {self.whisper_client._action_name} found."
        )

        self.get_logger().info(self.info_string())

        # Start keyboard listener in a separate thread
        self._key_thread = threading.Thread(target=self._key_loop, daemon=True)
        self._key_thread.start()

    def _key_loop(self) -> None:
        """Listen for keypresses in a background thread."""
        while rclpy.ok():
            key = read_key()
            if key == ' ':
                self.on_space()
            elif key == '\x1b':  # ESC key
                self.get_logger().info("ESC pressed, shutting down...")
                rclpy.shutdown()
                break

    def on_space(self) -> None:
        goal_msg = Inference.Goal()
        goal_msg.max_duration = Duration(sec=20, nanosec=0)
        self.get_logger().info(
            f"Requesting inference for {goal_msg.max_duration.sec} seconds..."
        )
        future = self.whisper_client.send_goal_async(
            goal_msg, feedback_callback=self.on_feedback
        )
        future.add_done_callback(self.on_goal_accepted)

    def on_goal_accepted(self, future: Future) -> None:
        goal_handle = future.result()
        if not goal_handle.accepted:
            self.get_logger().error("Goal rejected.")
            return

        self.get_logger().info("Goal accepted.")

        future = goal_handle.get_result_async()
        future.add_done_callback(self.on_done)

    def on_done(self, future: Future) -> None:
        result: Inference.Result = future.result().result
        self.get_logger().info(f"Result: {result.transcriptions}")

    def on_feedback(self, feedback_msg: Inference_FeedbackMessage) -> None:
        if self.batch_idx != feedback_msg.feedback.batch_idx:
            print("")
            self.batch_idx = feedback_msg.feedback.batch_idx
        sys.stdout.write("\033[K")
        print(f"{feedback_msg.feedback.transcription}")
        sys.stdout.write("\033[F")

    def info_string(self) -> str:
        return (
            "\n\n"
            "\tStarting demo.\n"
            "\tPress ESC to exit.\n"
            "\tPress SPACE to start listening.\n"
            "\tPress SPACE again to stop listening.\n"
        )


def main(args=None):
    rclpy.init(args=args)
    whisper_on_key = WhisperOnKey(node_name="whisper_on_key")
    rclpy.spin(whisper_on_key)
