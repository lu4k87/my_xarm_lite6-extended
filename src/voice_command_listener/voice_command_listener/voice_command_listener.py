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
    COLORS = ("red", "green", "blue")

    def __init__(self):
        super().__init__("voice_command_listener")

        # ---- Parameter Initialisierung ----
        self.declare_parameter("cooldown_sec", 0.3)
        self.declare_parameter("refractory_sec", 1.5)
        self.declare_parameter("whisper_topic", "/whisper/transcript_stream")
        
        self.cooldown_sec = float(self.get_parameter("cooldown_sec").value)
        self.refractory_sec = float(self.get_parameter("refractory_sec").value)
        self.whisper_topic = str(self.get_parameter("whisper_topic").value)

        # Startmeldung im Terminal
        print(CLEAR_SCREEN + HIDE_CURSOR, end='')
        print("✅ Voice Command Listener ist bereit.")
        print("   Warte auf Sprachbefehle...")

        # ---- Publisher Setup ----
        qos_cmd = QoSProfile(depth=1, history=HistoryPolicy.KEEP_LAST, reliability=ReliabilityPolicy.RELIABLE, durability=DurabilityPolicy.TRANSIENT_LOCAL)
        self.cmd_pub = self.create_publisher(StringMsg, "/voice_cmd", qos_cmd)

        # <<< Publisher fuer UI-Feedback >>>
        self.feedback_pub = self.create_publisher(StringMsg, UI_VOICE_FEEDBACK_TOPIC, 10)

        # ---- State-Variablen fuer Entprellung und Matching ----
        self.word_buffer = deque(maxlen=50)                     
        self.last_any_trigger_ts = 0.0                          
        self.refractory_until = {c: 0.0 for c in self.COLORS}   
        self.last_match_count = {c: 0 for c in self.COLORS}     
        self.present_last = {c: False for c in self.COLORS}     
        
        # Regex-Pattern fuer die Befehlserkennung
        self.patterns = {
            "red":   [re.compile(r"\bmove to red\b"),   re.compile(r"\bbewege dich zu rot\b")],
            "blue":  [re.compile(r"\bmove to blue\b"),  re.compile(r"\bbewege dich zu blau\b")],
            "green": [re.compile(r"\bmove to green\b"), re.compile(r"\bbewege dich zu gruen\b")],
        }
        self._last_cmd_text = ""

        # ---- Subscriptions ----
        if HAS_WHISPER_IDL:
            self.create_subscription(AudioTranscript, self.whisper_topic, self.on_transcript_msg, 10)
        self.create_subscription(StringMsg, self.whisper_topic, self.on_transcript_string, 10)
        self.create_subscription(StringMsg, "/whisper/transcript_manager/transcript", self.on_transcript_string, 10)
        self.create_subscription(StringMsg, "/whisper/inference", self.on_transcript_string, 10)

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
            self.word_buffer.extend(clean_words)
            text = reconstruct_text_from_words(list(self.word_buffer))
            if text:
                self.handle_text(text)

    def on_transcript_string(self, msg: StringMsg):
        if msg.data:
            self.handle_text(msg.data)

    # -------------------------------------------------------------------------
    # Kernlogik: Textverarbeitung und Matching
    # -------------------------------------------------------------------------
    def handle_text(self, text_raw: str):
        now = time.time()
        if (now - self.last_any_trigger_ts) < self.cooldown_sec: return

        norm = normalize(text_raw).replace("grun", "gruen") 
        
        present_now = {c: False for c in self.COLORS}
        match_count = {c: 0 for c in self.COLORS}
        
        for color, pats in self.patterns.items():
            for p in pats:
                hits = list(p.finditer(norm))
                if hits:
                    present_now[color] = True
                    match_count[color] = max(match_count[color], len(hits))

        for color in self.COLORS:
            if self.present_last[color] and not present_now[color]:
                self.last_match_count[color] = 0
            
            if present_now[color]:
                if now < self.refractory_until[color]:
                    self.get_logger().debug(f"[{color}] suppressed: refractory")
                else:
                    if match_count[color] > self.last_match_count[color]:
                        self.emit_command(color, text_raw) 
                        
                        self.last_any_trigger_ts = now
                        self.refractory_until[color] = now + self.refractory_sec
                        self.last_match_count[color] = match_count[color]
                        break 
                    else:
                         self.get_logger().debug(f"[{color}] suppressed: no new match")

        self.present_last = present_now
        self.word_buffer.clear()

    # -------------------------------------------------------------------------
    # Output: Befehl senden und UI informieren
    # -------------------------------------------------------------------------
    def emit_command(self, color: str, original: str):
        cmd_text = f"move to {color}"
        
        # 1. Im Terminal ausgeben (Kompakte Ausgabe ohne die alten Texte)
        print(CLEAR_SCREEN, end='')
        print(f"✅ Sprachbefehl erkannt: {cmd_text}")
        self.get_logger().debug(f'(Originales Transkript: "{original}")')

        # 2. Kommando auf /voice_cmd publishen (fuer MoveToCoordinator)
        cmd_msg = StringMsg()
        cmd_msg.data = cmd_text
        self.cmd_pub.publish(cmd_msg)
        self._last_cmd_text = cmd_text

        # 3. <<< NEU: Feedback-String auf /ui/voice_feedback publishen >>>
        try:
            feedback_msg = StringMsg()
            # Wir senden NUR noch den reinen Befehl ("move to red") an die JS-Oberflaeche
            feedback_msg.data = cmd_text
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
