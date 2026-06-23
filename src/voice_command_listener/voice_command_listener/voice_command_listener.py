#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import time
import unicodedata
from collections import deque

import rclpy
from rclpy.node import Node
from rclpy.qos import QoSProfile, ReliabilityPolicy, HistoryPolicy, DurabilityPolicy

# Optional: Whisper-IDL
# Versucht, die spezifischen Nachrichten-Typen fuer Whisper zu laden.
# Falls nicht vorhanden, wird auf Standard-Strings zurueckgegriffen.
try:
    from whisper_idl.msg import AudioTranscript
    from whisper_idl.action import Inference
    HAS_WHISPER_IDL = True
except Exception:
    HAS_WHISPER_IDL = False

from std_msgs.msg import String as StringMsg
from std_srvs.srv import Trigger
from rclpy.action import ActionClient

# ============================================================================
# MODIFIED BY: [Kaul,Marius], [22.12.2025]
# CHANGE: Implementierung des Voice-Command-Listeners mit UI-Feedback
# BESCHREIBUNG: Dieser Node empfaengt Transkripte von OpenAI Whisper,
# analysiert diese auf vordefinierte Befehle (Regex) und sendet Steuerbefehle
# an den Roboter sowie Feedback-Nachrichten an das User Interface.
# ============================================================================

# ANSI-Codes fuer Terminal-Formatierung
CLEAR_SCREEN = "\033[2J\033[H"
HIDE_CURSOR = "\033[?25l"
SHOW_CURSOR = "\033[?25h"

# <<< NEU: Topic fuer UI-Feedback >>>
UI_VOICE_FEEDBACK_TOPIC = "/ui/voice_feedback"

# -------------------------------------------------------------------------
# Hilfsfunktion: Text-Normalisierung
# -------------------------------------------------------------------------
def normalize(text: str) -> str:
    t = text.lower()
    t = unicodedata.normalize("NFKC", t)
    t = (
        t.replace("ü", "ue")
         .replace("ä", "ae")
         .replace("ö", "oe")
         .replace("ß", "ss")
    )
    # Entfernt alles außer Buchstaben, Zahlen und Leerzeichen
    t = re.sub(r"[^a-z0-9\s]", " ", t)
    # Reduziert mehrfache Leerzeichen auf ein einzelnes
    t = re.sub(r"\s+", " ", t).strip()
    return t

# -------------------------------------------------------------------------
# Hilfsfunktion: Text-Rekonstruktion
# -------------------------------------------------------------------------
def reconstruct_text_from_words(words):
    if not words:
        return ""
    out = []
    for w in words:
        if not isinstance(w, str): continue
        w = w.strip()
        if not w: continue
        # Filtert Metadaten und Stille-Token von Whisper heraus
        if w.startswith("[") and w.endswith("]"): continue
        if w in {"[BLANK_AUDIO]", "[ Silence ]", "[ Inaudible ]", "[INAUDIBLE]", "[ Pause ]"}: continue
        
        # Satzzeichen direkt an das vorherige Wort anhaengen
        if w in {".", ",", "!", "?", ":", ";", "...", "…"}:
            if out: out[-1] = out[-1] + w
            else: out.append(w)
        else:
            out.append(w)
    text = " ".join(out)
    # Korrigiert Leerzeichen vor Satzzeichen (Regex)
    text = re.sub(r"\s+([.,!?;:…])", r"\1", text)
    return text.strip()

# -------------------------------------------------------------------------
# Hauptklasse: VoiceCommandListener Node
# -------------------------------------------------------------------------
class VoiceCommandListener(Node):
    def __init__(self):
        super().__init__("voice_command_listener")

        # ---- Parameter Initialisierung ----
        self.declare_parameter("cooldown_sec", 3.0)
        self.declare_parameter("whisper_topic", "/whisper/transcript_stream")
        
        self.cooldown_sec = float(self.get_parameter("cooldown_sec").value)
        self.whisper_topic = str(self.get_parameter("whisper_topic").value)

        # Startmeldung im Terminal
        print(CLEAR_SCREEN + HIDE_CURSOR, end='')
        print("✅ Voice Command Listener ist bereit.")
        print("   Warte auf Sprachbefehle ('Move to Absolute Pose', 'Move to Initial Pose')...")

        # <<< Publisher fuer UI-Feedback >>>
        self.feedback_pub = self.create_publisher(StringMsg, UI_VOICE_FEEDBACK_TOPIC, 10)

        # ---- State-Variablen fuer Entprellung und Matching ----
        self.word_buffer = deque(maxlen=50)                     
        self.last_trigger_ts = 0.0                          
        
        # Regex-Pattern fuer die Befehlserkennung (Ausschliesslich Englisch)
        
        # 1. Move to Absolute Pose Commands
        self.pose_pattern = re.compile(r"\bmove to (?:absolute )?(?:pose|pause|power|post|posts|pass|poza|posa)\b", re.IGNORECASE)
        
        # 2. Move to Initial Pose Commands
        self.initial_pose_pattern = re.compile(r"\b(?:move to )?initial (?:pose|pause|power|post|posts|pass|poza|posa)\b", re.IGNORECASE)
        
        # 3. Faster / Slower Speed Commands
        self.faster_pattern = re.compile(r"\b(?:go |move )?faster\b", re.IGNORECASE)
        self.slower_pattern = re.compile(r"\b(?:go |move )?slower\b", re.IGNORECASE)
        
        self._last_cmd_text = ""

        # ---- Robust State Machine ----
        # Tracks whether we are currently in a cancellation sequence
        self._is_canceling = False
        # Tracks whether a command was EXECUTED (not just matched) for the current goal
        self._command_executed_for_current_goal = False
        # The last feedback text we processed — to ignore duplicate feedback packets
        self._last_processed_feedback_text = ""
        # The last command that was EXECUTED and when — to detect residual audio
        self._last_executed_cmd = ""
        self._last_executed_cmd_ts = 0.0
        # Active goal handle
        self.goal_handle = None

        # ---- Subscriptions ----
        # Trigger for Whisper Action (from Web UI button)
        self.create_subscription(StringMsg, "/ui/voice_listen_trigger", self.on_trigger_whisper, 10)
        self.ui_status_pub = self.create_publisher(StringMsg, "/ui/voice_status", 10)
        
        if HAS_WHISPER_IDL:
            self._action_client = ActionClient(self, Inference, '/whisper/inference')
        else:
            self.get_logger().error("whisper_idl not found! Whisper Actions will not work.")

        # ---- Services ----
        self.create_service(Trigger, "/voice_cmd/last", self._on_last_command)

    # -------------------------------------------------------------------------
    # Whisper Action Client Integration
    # -------------------------------------------------------------------------
    def on_trigger_whisper(self, msg):
        self.get_logger().info('Voice listen triggered by UI')
        
        if not HAS_WHISPER_IDL:
            self.ui_status_pub.publish(StringMsg(data="Error: whisper_idl missing"))
            return
            
        if not self._action_client.wait_for_server(timeout_sec=1.0):
            self.ui_status_pub.publish(StringMsg(data="Error: Whisper Server offline"))
            return
        
        # Reset ALL state for the new goal
        self._is_canceling = False
        self._command_executed_for_current_goal = False
        self._last_processed_feedback_text = ""
        self.goal_handle = None
        
        goal_msg = Inference.Goal()
        goal_msg.max_duration.sec = 5
        self.ui_status_pub.publish(StringMsg(data="Listening..."))
        send_goal_future = self._action_client.send_goal_async(goal_msg, feedback_callback=self.feedback_callback)
        send_goal_future.add_done_callback(self.goal_response_callback)

    def goal_response_callback(self, future):
        goal_handle = future.result()
        if not goal_handle.accepted:
            self.ui_status_pub.publish(StringMsg(data="Error: Goal rejected"))
            return
            
        self.goal_handle = goal_handle
        self.get_logger().info('Whisper goal accepted, waiting for result...')
        self._get_result_future = goal_handle.get_result_async()
        self._get_result_future.add_done_callback(self.get_result_callback)

    def feedback_callback(self, feedback_msg):
        # ── Guard 1: Already canceling → ignore all further feedback
        if self._is_canceling:
            return
        
        feedback = feedback_msg.feedback
        text = feedback.transcription
        if not text or not text.strip():
            return
        
        text = text.strip()
        
        # ── Guard 2: Identical text as last feedback → skip (dedup)
        #    The C++ server sends feedback every 250ms with the SAME cumulative text.
        if text == self._last_processed_feedback_text:
            return
        self._last_processed_feedback_text = text
        
        # ── Guard 3: Residual audio detection
        #    If the recognized text matches what we JUST executed in a previous goal,
        #    it's the microphone buffer residue — not a new spoken command.
        cmd = self._identify_command(text)
        if cmd:
            time_since_last_exec = time.time() - self._last_executed_cmd_ts
            if cmd == self._last_executed_cmd and time_since_last_exec < 5.0:
                self.get_logger().warn(
                    f'Residual audio suppressed: "{cmd}" was executed {time_since_last_exec:.1f}s ago')
                # Cancel goal to reset UI, but do NOT execute
                self._is_canceling = True
                self._command_executed_for_current_goal = False
                if self.goal_handle is not None:
                    self.ui_status_pub.publish(StringMsg(data=f"Transcription: {text}"))
                    self.goal_handle.cancel_goal_async()
                return
            
            # ── Execute the command
            self._execute_command(cmd, text)
            self._is_canceling = True
            self._command_executed_for_current_goal = True
            
            if self.goal_handle is not None:
                self.get_logger().info(f'Command "{cmd}" recognized early! Cancelling recording...')
                self.ui_status_pub.publish(StringMsg(data=f"Transcription: {text}"))
                self.goal_handle.cancel_goal_async()

    def get_result_callback(self, future):
        # If we already executed a command via feedback, just reset and return
        if self._command_executed_for_current_goal:
            return
        
        # If we suppressed residual audio, also return (UI was already reset)
        if self._is_canceling:
            return
        
        result = future.result().result
        if result and result.transcriptions and len(result.transcriptions) > 0:
            final_text = " ".join(result.transcriptions).strip()
            if final_text:
                self.get_logger().info(f'Transcription: {final_text}')
                self.ui_status_pub.publish(StringMsg(data=f'Transcription: {final_text}'))
                
                # Try to execute a command from the final result
                cmd = self._identify_command(final_text)
                if cmd:
                    # Check residual audio even for final results
                    time_since_last_exec = time.time() - self._last_executed_cmd_ts
                    if cmd == self._last_executed_cmd and time_since_last_exec < 5.0:
                        self.get_logger().warn(f'Residual audio in final result suppressed: "{cmd}"')
                    else:
                        self._execute_command(cmd, final_text)
                else:
                    print(f"❌ Sprachbefehl NICHT erkannt: '{final_text}'")
                    self.get_logger().warning(f"Unrecognized command: '{final_text}'")
            else:
                self.ui_status_pub.publish(StringMsg(data="-- No speech detected --"))
        else:
            self.ui_status_pub.publish(StringMsg(data="-- No speech detected --"))

    # -------------------------------------------------------------------------
    # Command Identification (pure logic, no side effects)
    # -------------------------------------------------------------------------
    def _identify_command(self, text_raw: str) -> str:
        """Returns the command string if a pattern matches, or empty string."""
        norm = normalize(text_raw)
        if not norm or not norm.strip():
            return ""
        
        if self.pose_pattern.search(norm):
            return "MoveTo: pose"
        if self.initial_pose_pattern.search(norm):
            return "MoveTo: initial"
        if self.faster_pattern.search(norm):
            return "Speed: faster"
        if self.slower_pattern.search(norm):
            return "Speed: slower"
        return ""

    # -------------------------------------------------------------------------
    # Command Execution (side effects: publishes to /ui/voice_feedback)
    # -------------------------------------------------------------------------
    def _execute_command(self, cmd: str, original: str):
        """Executes a command exactly once and records it for dedup."""
        now = time.time()
        
        # Global cooldown — prevents any double-fire regardless of source
        if (now - self.last_trigger_ts) < self.cooldown_sec:
            self.get_logger().warn(f'Cooldown active: "{cmd}" suppressed ({self.cooldown_sec - (now - self.last_trigger_ts):.1f}s remaining)')
            return
        
        self.last_trigger_ts = now
        self._last_executed_cmd = cmd
        self._last_executed_cmd_ts = now
        self._last_cmd_text = cmd
        
        print(CLEAR_SCREEN, end='')
        print(f"✅ Sprachbefehl erkannt: {cmd}")
        self.get_logger().info(f'Executing voice command: "{cmd}" (raw: "{original}")')
        
        try:
            self.feedback_pub.publish(StringMsg(data=cmd))
        except Exception as e:
            self.get_logger().error(f"Error publishing voice feedback: {e}")

    # -------------------------------------------------------------------------
    # Service Callback
    # -------------------------------------------------------------------------
    def _on_last_command(self, req, resp):
        resp.success = True
        resp.message = self._last_cmd_text or ""
        return resp

# -------------------------------------------------------------------------
# Main Funktion
# -------------------------------------------------------------------------
def main():
    import os
    import fcntl
    import sys
    
    LOCK_FILE = '/tmp/voice_command_listener.lock'
    lock_fd = os.open(LOCK_FILE, os.O_CREAT | os.O_RDWR)
    try:
        fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        print("\n\033[91m❌ KRITISCHER FEHLER: voice_command_listener laeuft bereits!\033[0m")
        print("Mehrere Instanzen dieses Nodes wuerden Sprachbefehle doppelt ausfuehren.")
        print("Beende diesen redundanten Start-Versuch. Bitte schliesse das alte Terminal!\n")
        sys.exit(1)

    rclpy.init()
    node = VoiceCommandListener()
    try:
        rclpy.spin(node)
    finally:
        print(SHOW_CURSOR, end='') # Cursor wieder anzeigen
        node.destroy_node()
        rclpy.shutdown()

if __name__ == "__main__":
    main()
