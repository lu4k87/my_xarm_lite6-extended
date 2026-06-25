#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re
import time
import unicodedata
from collections import deque
import functools

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
        self.patterns = {
            "MoveTo: pose": re.compile(r"\bmove to (?:absolute )?(?:pose|pause|power|post|posts|pass|poza|posa)\b", re.IGNORECASE),
            "MoveTo: initial": re.compile(r"\b(?:move to )?initial (?:pose|pause|power|post|posts|pass|poza|posa)\b", re.IGNORECASE),
            "Speed: faster": re.compile(r"\b(?:go |move )?faster\b", re.IGNORECASE),
            "Speed: slower": re.compile(r"\b(?:go |move )?slower\b", re.IGNORECASE)
        }
        
        self._last_cmd_text = ""

        # ---- Robust State Machine ----
        self._is_canceling = False
        self._command_executed_for_current_goal = False
        self._last_processed_feedback_text = ""
        self._last_executed_cmd = ""
        self._last_executed_cmd_ts = 0.0
        self._goal_start_ts = 0.0
        self._suppressed_end_pos = -1
        self._goal_generation = 0
        self.goal_handle = None
        self._get_result_future = None
        self._queue_new_goal = False

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
            
        # If a goal is active, cancel it and queue the new one to prevent C++ Action Server segfaults
        if self._get_result_future is not None and not self._get_result_future.done():
            self.get_logger().info('Active goal found. Canceling and queuing new goal...')
            self._queue_new_goal = True
            if self.goal_handle is not None:
                self.goal_handle.cancel_goal_async()
            return
            
        self._start_new_goal()

    def _start_new_goal(self):
        # Reset ALL state for the new goal
        self._is_canceling = False
        self._command_executed_for_current_goal = False
        self._last_processed_feedback_text = ""
        self._goal_start_ts = time.time()
        self._suppressed_end_pos = -1
        self.goal_handle = None
        self._goal_generation += 1
        current_gen = self._goal_generation
        
        goal_msg = Inference.Goal()
        goal_msg.max_duration.sec = 5
        self.ui_status_pub.publish(StringMsg(data="Listening..."))
        
        send_goal_future = self._action_client.send_goal_async(
            goal_msg, 
            feedback_callback=functools.partial(self.feedback_callback, gen=current_gen)
        )
        send_goal_future.add_done_callback(functools.partial(self.goal_response_callback, gen=current_gen))

    def goal_response_callback(self, future, gen):
        if gen != self._goal_generation:
            return
            
        goal_handle = future.result()
        if not goal_handle.accepted:
            self.ui_status_pub.publish(StringMsg(data="Error: Goal rejected"))
            return
            
        self.goal_handle = goal_handle
        self.get_logger().info('Whisper goal accepted, waiting for result...')
        self._get_result_future = goal_handle.get_result_async()
        self._get_result_future.add_done_callback(functools.partial(self.get_result_callback, gen=gen))

    def feedback_callback(self, feedback_msg, gen):
        if gen != self._goal_generation:
            return
            
        # ── Guard 1: Already canceling → ignore all further feedback
        if self._is_canceling:
            return
        
        feedback = feedback_msg.feedback
        text = feedback.transcription
        if not text:
            return
            
        # Strip Whisper bracket tags like [BLANK_AUDIO]
        text = re.sub(r'\[.*?\]', '', text).strip()
        if not text:
            return
        
        # ── Guard 2: Identical text as last feedback → skip (dedup)
        #    The C++ server sends feedback every 250ms with the SAME cumulative text.
        if text == self._last_processed_feedback_text:
            return
        self._last_processed_feedback_text = text
        
        # ── Guard 3: Execute the LATEST recognized command
        cmd, match_end_pos = self._find_latest_command(text)
        if cmd:
            # If this match was already suppressed (or is part of it), ignore it
            # The C++ transcript_manager now clears its queue on goal start, 
            # so any command arriving here is genuinely from the current recording session!
            
            # ── Execute the command
            self._execute_command(cmd, text)
            self._is_canceling = True
            self._command_executed_for_current_goal = True
            
            # Reset UI and cancel to end recording
            self.ui_status_pub.publish(StringMsg(data=f"Transcription: {text}"))
            if self.goal_handle is not None:
                self.get_logger().info(f'Command "{cmd}" recognized early! Cancelling recording...')
                self.goal_handle.cancel_goal_async()

    def get_result_callback(self, future, gen):
        if gen != self._goal_generation:
            return
            
        # If we already executed a command via feedback, just reset and return
        if self._command_executed_for_current_goal:
            return
        
        # If we suppressed residual audio, also return (UI was already reset)
        if self._is_canceling:
            return
        
        result = future.result().result
        if result and result.transcriptions and len(result.transcriptions) > 0:
            final_text = " ".join(result.transcriptions)
            # Remove Whisper bracket tags like [BLANK_AUDIO]
            final_text = re.sub(r'\[.*?\]', '', final_text).strip()
            
            if final_text:
                self.get_logger().info(f'Transcription: {final_text}')
                self.ui_status_pub.publish(StringMsg(data=f'Transcription: {final_text}'))
                
                # Check for late command in final transcript
                cmd, match_end_pos = self._find_latest_command(final_text)
                if cmd:
                    self._execute_command(cmd, final_text)
            else:
                self.ui_status_pub.publish(StringMsg(data="-- No speech detected --"))
        else:
            self.ui_status_pub.publish(StringMsg(data="-- No speech detected --"))
            
        self._check_queue()

    def _check_queue(self):
        if self._queue_new_goal:
            self._queue_new_goal = False
            self.get_logger().info('Starting queued goal...')
            self._start_new_goal()

    # -------------------------------------------------------------------------
    # Command Identification (pure logic, no side effects)
    # -------------------------------------------------------------------------
    def _find_latest_command(self, text):
        best_cmd = None
        best_pos = -1
        
        for cmd_name, pattern in self.patterns.items():
            matches = list(pattern.finditer(text))
            if matches:
                last_match = matches[-1]
                if last_match.end() > best_pos:
                    best_pos = last_match.end()
                    best_cmd = cmd_name
                    
        return best_cmd, best_pos

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
