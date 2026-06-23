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
    HAS_WHISPER_IDL = True
except Exception:
    HAS_WHISPER_IDL = False

from std_msgs.msg import String as StringMsg
from std_srvs.srv import Trigger

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
        print("   Warte auf Sprachbefehle (z.B. 'Greife apfel', 'Grasp cup')...")

        # ---- Publisher Setup ----
        qos_cmd = QoSProfile(depth=1, history=HistoryPolicy.KEEP_LAST, reliability=ReliabilityPolicy.RELIABLE, durability=DurabilityPolicy.TRANSIENT_LOCAL)
        self.cmd_pub = self.create_publisher(StringMsg, "/ui/grasp_object_cmd", qos_cmd)

        # <<< Publisher fuer UI-Feedback >>>
        self.feedback_pub = self.create_publisher(StringMsg, UI_VOICE_FEEDBACK_TOPIC, 10)

        # ---- State-Variablen fuer Entprellung und Matching ----
        self.word_buffer = deque(maxlen=50)                     
        self.last_trigger_ts = 0.0                          
        
        # Regex-Pattern fuer die Befehlserkennung (Deutsch & Englisch)
        # 1. Grasp Commands
        trigger_words = r"greife|greif|bewege dich zu|geh zu|gehe zu|grab|grasp|move to|pick|pick up|catch"
        # Match trigger word, optional colon, and up to 3 following words as object name
        self.cmd_pattern = re.compile(rf"\b(?:{trigger_words})\s*:?\s*([a-z0-9]+(?:\s+[a-z0-9]+){{0,2}})", re.IGNORECASE)
        
        # 2. Move to Absolute Pose Commands
        pose_trigger = r"fahr zur pose|fahre zur pose|move to pose|go to pose|zur pose fahren|bewege dich zur absoluten position|absolute position"
        self.pose_pattern = re.compile(rf"\b(?:{pose_trigger})\b", re.IGNORECASE)
        
        self._last_cmd_text = ""
        self._last_transcript = ""
        self._search_start_idx = 0

        # ---- Subscriptions ----
        # Nur auf Text-Kommandos aus dem Web UI (Action Server Result) hoeren,
        # um Endlosschleifen durch continuous streams zu vermeiden.
        self.create_subscription(StringMsg, "/ui/voice_command_text", self.on_transcript_string, 10)

        # ---- Services ----
        self.create_service(Trigger, "/voice_cmd/last", self._on_last_command)

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
    def handle_text(self, text_raw: str):
        norm = normalize(text_raw)
        if not norm: return

        # Falls der neue Text nicht mit dem alten beginnt (z.B. Transcript wurde geleert oder es ist ein neuer Aufruf)
        if not norm.startswith(self._last_transcript):
            self._search_start_idx = 0
            
        self._last_transcript = norm
        search_text = norm[self._search_start_idx:]
        
        if not search_text.strip(): return
        
        now = time.time()
        
        # Pruefen auf "Move to Pose" Befehl (hat Prioritaet)
        match_pose = self.pose_pattern.search(search_text)
        if match_pose:
            if (now - self.last_trigger_ts) >= self.cooldown_sec:
                self.emit_pose_command(text_raw)
                self.last_trigger_ts = now
            self._search_start_idx += match_pose.end()
            self.word_buffer.clear()
            return
        
        # Suchen nach dem Grasp Befehl im Text
        matches = list(self.cmd_pattern.finditer(search_text))
        if matches:
            last_match = matches[-1]
            obj_name = last_match.group(1).strip()
            
            if len(obj_name) >= 2:
                if (now - self.last_trigger_ts) >= self.cooldown_sec:
                    self.emit_command(obj_name, text_raw)
                    self.last_trigger_ts = now
                self._search_start_idx += last_match.end()
                self.word_buffer.clear()

    # -------------------------------------------------------------------------
    # Output: Befehl senden und UI informieren
    # -------------------------------------------------------------------------
    def emit_command(self, obj_name: str, original: str):
        # 1. Im Terminal ausgeben
        print(CLEAR_SCREEN, end='')
        print(f"✅ Sprachbefehl erkannt: Grasp '{obj_name}'")
        self.get_logger().debug(f'(Originales Transkript: "{original}")')

        # 2. Kommando auf /ui/grasp_object_cmd publishen (Triggert den YOLO Grasp Executor)
        cmd_msg = StringMsg()
        cmd_msg.data = obj_name
        self.cmd_pub.publish(cmd_msg)
        
        cmd_feedback = f"Grasp: {obj_name}"
        self._last_cmd_text = cmd_feedback

        # 3. Feedback-String auf /ui/voice_feedback publishen (fuer Web UI)
        try:
            feedback_msg = StringMsg()
            feedback_msg.data = cmd_feedback
            self.feedback_pub.publish(feedback_msg)
        except Exception as e:
            self.get_logger().error(f"Error publishing voice feedback: {e}")

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
