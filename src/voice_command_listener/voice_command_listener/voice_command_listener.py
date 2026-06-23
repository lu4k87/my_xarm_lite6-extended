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
        self.declare_parameter("cooldown_sec", 1.0)
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

        # ---- Subscriptions ----
        # Nur auf Text-Kommandos aus dem Web UI (Action Server Result) hoeren,
        # um Endlosschleifen durch continuous streams zu vermeiden.
        self.create_subscription(StringMsg, "/ui/voice_command_text", self.on_transcript_string, 10)

        # Trigger for Whisper Action
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
            
        self._is_canceling = False
        self._command_triggered_for_current_goal = False
        
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
        if getattr(self, '_is_canceling', False):
            return
            
        feedback = feedback_msg.feedback
        text = feedback.transcription
        if text:
            # We process the intermediate text
            if self.handle_text(text, is_intermediate=True):
                self._is_canceling = True
                self._command_triggered_for_current_goal = True
                
                # If a command was successfully matched, we can cancel the goal early!
                if hasattr(self, 'goal_handle') and self.goal_handle is not None:
                    self.get_logger().info('Command recognized early! Cancelling Whisper recording goal...')
                    self.ui_status_pub.publish(StringMsg(data=f"Transcription: {text.strip()}"))
                    self.goal_handle.cancel_goal_async()

    def get_result_callback(self, future):
        self._is_canceling = False # Reset flag
        result = future.result().result
        
        if getattr(self, '_command_triggered_for_current_goal', False):
            return # We already executed and published a command for this recording.
            
        if result and result.transcriptions and len(result.transcriptions) > 0:
            final_text = " ".join(result.transcriptions).strip()
            if final_text:
                self.get_logger().info(f'Transcription: {final_text}')
                self.ui_status_pub.publish(StringMsg(data=f'Transcription: {final_text}'))
                # Verarbeite den Text direkt hier!
                self.handle_text(final_text)
            else:
                self.ui_status_pub.publish(StringMsg(data="-- No speech detected --"))
        else:
            self.ui_status_pub.publish(StringMsg(data="-- No speech detected --"))

    # -------------------------------------------------------------------------
    # Service Callback
    # -------------------------------------------------------------------------
    def _on_last_command(self, req, resp):
        resp.success = True
        resp.message = self._last_cmd_text or ""
        return resp

    # -------------------------------------------------------------------------
    # Input Callbacks (Datenempfang)
    # -------------------------------------------------------------------------
    def on_transcript_msg(self, msg):
        for field in ("text", "transcript", "full", "full_text"):
            if hasattr(msg, field):
                val = getattr(msg, field)
                if isinstance(val, str) and val:
                    self.handle_text(val)
                    return
        words = getattr(msg, "words", [])
        if words:
            clean_words = []
            for w in words:
                if isinstance(w, str):
                    w = w.strip()
                    if w and not (w.startswith("[") and w.endswith("]")):
                        clean_words.append(w)
            text = " ".join(clean_words)
            if text:
                self.handle_text(text)

    def on_transcript_string(self, msg: StringMsg):
        if msg.data:
            self.handle_text(msg.data)

    # -------------------------------------------------------------------------
    # Kernlogik: Textverarbeitung und Matching
    # -------------------------------------------------------------------------
    def handle_text(self, text_raw: str, is_intermediate: bool = False) -> bool:
        norm = normalize(text_raw)
        if not norm: return False

        search_text = norm
        
        if not search_text.strip(): return False
        
        now = time.time()
        
        # Pruefen auf "Move to Pose" Befehl (hat Prioritaet)
        match_pose = self.pose_pattern.search(search_text)
        if match_pose:
            if (now - self.last_trigger_ts) >= self.cooldown_sec:
                self.emit_pose_command(text_raw)
                self.last_trigger_ts = now
            self.word_buffer.clear()
            return True
        
        # Pruefen auf "Move to Initial Pose" Befehl
        match_initial = self.initial_pose_pattern.search(search_text)
        if match_initial:
            if (now - self.last_trigger_ts) >= self.cooldown_sec:
                self.emit_initial_pose_command(text_raw)
                self.last_trigger_ts = now
            self.word_buffer.clear()
            return True
            
        # Pruefen auf "Faster" Befehl
        match_faster = self.faster_pattern.search(search_text)
        if match_faster:
            if (now - self.last_trigger_ts) >= self.cooldown_sec:
                self.emit_speed_command("faster", text_raw)
                self.last_trigger_ts = now
            self.word_buffer.clear()
            return True
            
        # Pruefen auf "Slower" Befehl
        match_slower = self.slower_pattern.search(search_text)
        if match_slower:
            if (now - self.last_trigger_ts) >= self.cooldown_sec:
                self.emit_speed_command("slower", text_raw)
                self.last_trigger_ts = now
            self.word_buffer.clear()
            return True
            
        # Fallback: Kein Befehl erkannt
        if not is_intermediate:
            print(f"❌ Sprachbefehl NICHT erkannt: '{text_raw}'")
            self.get_logger().warning(f"Unrecognized command: '{text_raw}' (normalized: '{search_text}')")
            self.word_buffer.clear()
            
        return False

    # -------------------------------------------------------------------------
    # Output: Befehl senden und UI informieren
    # -------------------------------------------------------------------------
    def emit_pose_command(self, original: str):
        """Sendet den 'MoveTo: pose' Befehl an die Web UI."""
        print(CLEAR_SCREEN, end='')
        print(f"\u2705 Sprachbefehl erkannt: Move to Absolute Pose")
        self.get_logger().debug(f'(Originales Transkript: \"{original}\")')

        cmd_feedback = "MoveTo: pose"
        self._last_cmd_text = cmd_feedback

        try:
            feedback_msg = StringMsg()
            feedback_msg.data = cmd_feedback
            self.feedback_pub.publish(feedback_msg)
        except Exception as e:
            self.get_logger().error(f"Error publishing voice feedback: {e}")

    def emit_initial_pose_command(self, original: str):
        """Sendet den 'MoveTo: initial' Befehl an die Web UI."""
        print(CLEAR_SCREEN, end='')
        print(f"\u2705 Sprachbefehl erkannt: Move to Initial Pose")
        self.get_logger().debug(f'(Originales Transkript: \"{original}\")')

        cmd_feedback = "MoveTo: initial"
        self._last_cmd_text = cmd_feedback

        try:
            feedback_msg = StringMsg()
            feedback_msg.data = cmd_feedback
            self.feedback_pub.publish(feedback_msg)
        except Exception as e:
            self.get_logger().error(f"Error publishing voice feedback: {e}")

    def emit_speed_command(self, direction: str, original: str):
        """Sendet den 'Speed: faster' oder 'Speed: slower' Befehl an die Web UI."""
        print(CLEAR_SCREEN, end='')
        print(f"\u2705 Sprachbefehl erkannt: Speed {direction.capitalize()}")
        self.get_logger().debug(f'(Originales Transkript: \"{original}\")')

        cmd_feedback = f"Speed: {direction}"
        self._last_cmd_text = cmd_feedback

        try:
            feedback_msg = StringMsg()
            feedback_msg.data = cmd_feedback
            self.feedback_pub.publish(feedback_msg)
        except Exception as e:
            self.get_logger().error(f"Error publishing voice feedback: {e}")

# -------------------------------------------------------------------------
# Main Funktion
# -------------------------------------------------------------------------
def main():
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
