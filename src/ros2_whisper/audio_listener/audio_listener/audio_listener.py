import atexit

import numpy as np
import pyaudio
import rclpy
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from std_msgs.msg import Int16MultiArray, MultiArrayDimension


class AudioListenerNode(Node):
    def __init__(self, node_name: str) -> None:
        super().__init__(node_name)

        self.declare_parameters(
            namespace="",
            parameters=[
                ("channels", 1),
                ("frames_per_buffer", 1000),
                ("rate", 16000),
                ("device_index", -1),
            ],
        )

        self.channels_ = (
            self.get_parameter("channels").get_parameter_value().integer_value
        )
        self.frames_per_buffer_ = (
            self.get_parameter("frames_per_buffer").get_parameter_value().integer_value
        )
        self.rate_ = self.get_parameter("rate").get_parameter_value().integer_value
        self.device_index_ = self.get_parameter("device_index").get_parameter_value().integer_value

        self.pyaudio_ = pyaudio.PyAudio()

        # Liste alle verfuegbaren Mikrofone auf
        info = self.pyaudio_.get_host_api_info_by_index(0)
        numdevices = info.get('deviceCount')
        self.get_logger().info("=== Verfuegbare PyAudio Input-Geraete ===")
        for i in range(0, numdevices):
            if (self.pyaudio_.get_device_info_by_host_api_device_index(0, i).get('maxInputChannels')) > 0:
                name = self.pyaudio_.get_device_info_by_host_api_device_index(0, i).get('name')
                self.get_logger().info(f"Input Device ID {i} - {name}")
        self.get_logger().info("=========================================")

        stream_kwargs = {
            "channels": self.channels_,
            "format": pyaudio.paInt16,
            "input": True,
            "frames_per_buffer": self.frames_per_buffer_,
            "rate": self.rate_
        }
        
        if self.device_index_ >= 0:
            self.get_logger().info(f"Benutze EXPLIZIT Device Index: {self.device_index_}")
            stream_kwargs["input_device_index"] = self.device_index_
        else:
            # Versuche automatisch 'pulse' oder 'default' zu finden, was dem System-Standard entspricht
            pulse_index = -1
            numdevices = self.pyaudio_.get_device_count()
            for i in range(numdevices):
                device_info = self.pyaudio_.get_device_info_by_index(i)
                if device_info.get('maxInputChannels') > 0:
                    name = device_info.get('name').lower()
                    if 'pulse' in name or 'default' in name:
                        pulse_index = device_info['index']
                        if 'pulse' in name:  # Priorisiere 'pulse'
                            break
            
            if pulse_index >= 0:
                self.get_logger().info(f"Automatische Auswahl: Benutze 'pulse/default' Device (Global Index {pulse_index}) als System-Standard!")
                stream_kwargs["input_device_index"] = pulse_index
            else:
                self.get_logger().info("Benutze PyAudio DEFAULT Device (Gefahr: koennte das falsche Mikrofon sein!)")

        try:
            self.stream_ = self.pyaudio_.open(**stream_kwargs)
        except Exception as e:
            self.get_logger().error(f"Fehler beim Oeffnen des Mikrofons: {e}")
            raise e

        self.audio_publisher_ = self.create_publisher(
            Int16MultiArray, "~/audio", qos_profile=qos_profile_sensor_data
        )

        self.audio_publisher_timer_ = self.create_timer(
            float(self.frames_per_buffer_) / float(self.rate_),
            self.audio_publisher_timer_callback_,
        )

        atexit.register(self.cleanup_)

    def audio_publisher_timer_callback_(self) -> None:
        try:
            audio = self.stream_.read(self.frames_per_buffer_, exception_on_overflow=False)
        except Exception as e:
            self.get_logger().error(f"Error reading audio stream: {e}")
            return
        audio = np.frombuffer(audio, dtype=np.int16)
        audio_msg = Int16MultiArray()
        audio_msg.data = audio.tolist()
        audio_msg.layout.data_offset = 0
        audio_msg.layout.dim.append(
            MultiArrayDimension(label="audio", size=self.frames_per_buffer_, stride=1)
        )
        self.audio_publisher_.publish(audio_msg)

    def cleanup_(self):
        self.stream_.close()
        self.pyaudio_.terminate()


def main(args=None):
    rclpy.init(args=args)
    audio_listener = AudioListenerNode("audio_listener")
    rclpy.spin(audio_listener)
    rclpy.shutdown()


if __name__ == "__main__":
    main()
