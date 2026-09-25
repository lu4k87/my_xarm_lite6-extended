#!/usr/bin/env python3
"""ROS 2 Nexus Webapp als rahmenloses Fenster: nur das Start-Popup.

Kein Ubuntu-Fensterrahmen, transparenter Hintergrund (abgerundete Ecken),
verschiebbar ueber den Popup-Header. Das X im Popup beendet die App.

Usage: python3 ros2_nexus_popup_window.py [URL]
"""
import os
import sys


def _reexec_without_snap_env():
    # Aus einem Snap (z. B. VS-Code-Terminal) gestartet, ziehen GTK/GIO die
    # Snap-Bibliotheken und WebKit stuerzt ab (__libc_pthread_init).
    env = dict(os.environ)
    keys = [k for k in env if k.startswith("SNAP") or k in (
        "GIO_MODULE_DIR", "GTK_PATH", "GTK_EXE_PREFIX", "GDK_PIXBUF_MODULEDIR",
        "GDK_PIXBUF_MODULE_FILE", "GTK_IM_MODULE_FILE", "GSETTINGS_SCHEMA_DIR", "LOCPATH",
        "GIO_LAUNCHED_DESKTOP_FILE", "GIO_LAUNCHED_DESKTOP_FILE_PID")]
    if not keys:
        return
    for k in keys:
        env.pop(k, None)
    for var in ("XDG_DATA_DIRS", "XDG_CONFIG_DIRS"):
        orig = env.pop(f"{var}_VSCODE_SNAP_ORIG", None)
        if orig is not None:
            env[var] = orig
        elif var in env:
            env[var] = ":".join(d for d in env[var].split(":") if "/snap/" not in d)
    if "/snap/" in env.get("XDG_DATA_HOME", ""):
        env.pop("XDG_DATA_HOME")
    os.execve(sys.executable, [sys.executable] + sys.argv, env)


_reexec_without_snap_env()

import gi  # noqa: E402
gi.require_version("Gtk", "3.0")
gi.require_version("Gdk", "3.0")
gi.require_version("WebKit2", "4.0")
from gi.repository import Gdk, GLib, Gtk, WebKit2  # noqa: E402

URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:5000/"
DATA_DIR = os.path.expanduser("~/.ros2_nexus_webkit")
# Anteil der Bildschirmflaeche; knapp unter Vollbild, sonst maximiert GNOME.
# Breite = 80 % der frueheren 0.88 (passend zum Popup-Inhalt auf 80 %).
SIZE_W, SIZE_H = 0.7, 0.9


def frameless_url(url):
    return url + ("&" if "?" in url else "?") + "frameless=1"


class NexusPopupWindow(Gtk.Window):
    def __init__(self):
        super().__init__(title="ROS 2 Nexus")
        self.set_wmclass("ros2-nexus", "ros2-nexus")
        self.set_decorated(False)
        self.set_app_paintable(True)
        icon = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ros2_nexus_icon.png")
        if os.path.exists(icon):
            self.set_icon_from_file(icon)

        # RGBA-Visual: ohne Compositor bleibt der Hintergrund schwarz statt transparent
        visual = self.get_screen().get_rgba_visual()
        if visual is not None and self.get_screen().is_composited():
            self.set_visual(visual)

        geo = self._monitor_geometry()
        self.set_default_size(int(geo.width * SIZE_W), int(geo.height * SIZE_H))
        self.set_position(Gtk.WindowPosition.CENTER)

        # Eigenes Profil, damit localStorage (Theme, FAKE/REAL, Layout) bleibt
        data_manager = WebKit2.WebsiteDataManager(
            base_data_directory=DATA_DIR, base_cache_directory=os.path.join(DATA_DIR, "cache"))
        context = WebKit2.WebContext.new_with_website_data_manager(data_manager)
        content = WebKit2.UserContentManager()
        content.connect("script-message-received::nexus", self._on_message)
        content.register_script_message_handler("nexus")

        self.view = WebKit2.WebView(web_context=context, user_content_manager=content)
        self.view.set_background_color(Gdk.RGBA(0, 0, 0, 0))
        settings = self.view.get_settings()
        settings.set_enable_developer_extras(True)
        settings.set_hardware_acceleration_policy(WebKit2.HardwareAccelerationPolicy.ALWAYS)
        self.view.connect("load-failed", self._on_load_failed)
        self.view.load_uri(frameless_url(URL))
        self.add(self.view)

        self.connect("destroy", Gtk.main_quit)

    def _on_load_failed(self, view, _event, uri, error):
        # Sonst bliebe das transparente Fenster unsichtbar
        view.load_alternate_html(
            "<body style='margin:0;height:100vh;display:flex;align-items:center;justify-content:center;"
            "background:#0b1120;color:#e2e8f0;font:16px sans-serif;border-radius:20px'>"
            f"<div>Nexus Web Backend nicht erreichbar: {GLib.markup_escape_text(uri)}<br><br>"
            "<a href='#' style='color:#38bdf8' onclick='location.reload()'>Neu laden</a> &middot; "
            "<a href='#' style='color:#38bdf8' onclick=\"webkit.messageHandlers.nexus.postMessage('close')\">"
            "Schlie&szlig;en</a></div></body>", uri, None)
        return True

    def _monitor_geometry(self):
        display = Gdk.Display.get_default()
        monitor = display.get_primary_monitor() or display.get_monitor(0)
        return monitor.get_workarea()

    def _on_message(self, _manager, result):
        value = result.get_js_value()
        msg = value.to_string() if value is not None else ""
        if msg == "drag":
            self._begin_drag()
        elif msg == "close":
            self.close()
        elif msg == "minimize":
            self.iconify()
        elif msg == "maximize":
            if self.is_maximized():
                self.unmaximize()
            else:
                self.maximize()

    def _begin_drag(self):
        seat = Gdk.Display.get_default().get_default_seat()
        pointer = seat.get_pointer()
        _screen, x, y = pointer.get_position()
        self.begin_move_drag(1, x, y, Gtk.get_current_event_time())


def main():
    GLib.set_prgname("ros2-nexus")
    win = NexusPopupWindow()
    win.show_all()
    Gtk.main()


if __name__ == "__main__":
    main()
