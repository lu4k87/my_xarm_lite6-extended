#!/usr/bin/env python3
import asyncio
import websockets
import os
import pty
import fcntl
import termios
import struct
import json
import signal
import subprocess


async def terminal_handler(websocket):
    # Set up the PTY
    pid, fd = pty.fork()
    if pid == 0:
        # Child process: neue Session erstellen (KRITISCH für pkill -s!)
        # Ohne setsid() bleibt der Child in der Parent-Session → pkill -s <SID> findet nichts!
        os.setsid()
        os.environ['TERM'] = 'xterm-256color'
        os.execvp('bash', ['bash', '-i'])
    else:
        # Parent process: bridge between websocket and PTY

        def set_winsize(row, col):
            winsize = struct.pack("HHHH", row, col, 0, 0)
            fcntl.ioctl(fd, termios.TIOCSWINSZ, winsize)

        loop = asyncio.get_running_loop()

        # Async Queue for output from PTY
        output_queue = asyncio.Queue()

        def pty_reader():
            try:
                data = os.read(fd, 4096)
                if data:
                    loop.call_soon_threadsafe(output_queue.put_nowait, data)
                else:
                    loop.remove_reader(fd)
                    loop.call_soon_threadsafe(output_queue.put_nowait, None)  # EOF
            except OSError:
                loop.remove_reader(fd)
                loop.call_soon_threadsafe(output_queue.put_nowait, None)

        loop.add_reader(fd, pty_reader)

        async def send_to_ws():
            try:
                await websocket.send(json.dumps({"type": "pid", "pid": pid}))
            except Exception:
                pass
            while True:
                data = await output_queue.get()
                if data is None:
                    break
                try:
                    await websocket.send(data.decode('utf-8', errors='replace'))
                except websockets.exceptions.ConnectionClosed:
                    break

        async def recv_from_ws():
            try:
                async for message in websocket:
                    if isinstance(message, str) and message.startswith('{'):
                        try:
                            msg = json.loads(message)
                            if msg.get("type") == "resize":
                                set_winsize(msg['rows'], msg['cols'])
                                continue
                        except (json.JSONDecodeError, KeyError):
                            pass
                    if isinstance(message, str):
                        os.write(fd, message.encode('utf-8'))
                    else:
                        os.write(fd, message)
            except websockets.exceptions.ConnectionClosed:
                pass

        try:
            # ── KRITISCHER FIX ──
            # asyncio.gather() wartet auf ALLE Tasks.
            # Wenn der User das Terminal schließt (WebSocket close),
            # beendet sich recv_from_ws() sofort, ABER send_to_ws()
            # hängt ewig in output_queue.get() fest → finally wird NIE erreicht!
            #
            # Lösung: asyncio.wait mit FIRST_COMPLETED.
            # Sobald recv_from_ws endet (WebSocket zu), wird send_to_ws
            # sofort gecancelt und der Cleanup-Code läuft.
            send_task = asyncio.create_task(send_to_ws())
            recv_task = asyncio.create_task(recv_from_ws())

            done, pending = await asyncio.wait(
                [send_task, recv_task],
                return_when=asyncio.FIRST_COMPLETED
            )

            # Noch laufende Tasks sofort abbrechen
            for task in pending:
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

        except Exception as e:
            print(f"[terminal_server] Error: {e}")
        finally:
            # ── PTY Reader entfernen ──
            try:
                loop.remove_reader(fd)
            except Exception:
                pass

            print(f"[terminal_server] Beende Session {pid}...")

            # ── Sauberes Beenden aller Prozesse in der Session ──
            # Da wir im Child os.setsid() aufrufen, ist der Child Session-Leader
            # mit SID == pid. Alle Kindprozesse des Bash (z.B. ros2 launch)
            # erben diese Session-ID.
            #
            # Strategie:
            #   1. pkill -TERM -s <SID>  → alle Prozesse der Session (SIGTERM)
            #   2. os.killpg(pgid, SIGTERM) als Fallback über die Process Group
            #   3. 2.5s warten → Ports (z.B. rosbridge :9090) können freigegeben werden
            #   4. pkill -KILL -s <SID>  → verbleibende Prozesse hart killen
            #   5. Zombie aufräumen

            # 1. SIGTERM an die gesamte Session
            try:
                result = subprocess.run(
                    ['pkill', '-TERM', '-s', str(pid)],
                    timeout=2, capture_output=True
                )
                print(f"[terminal_server] pkill -TERM -s {pid}: returncode={result.returncode}")
            except Exception as e:
                print(f"[terminal_server] pkill TERM Fehler: {e}")

            # 1b. Fallback: SIGTERM an die Process Group (pgid == pid bei Session-Leader)
            try:
                os.killpg(pid, signal.SIGTERM)
            except Exception:
                pass

            # 2. Warten, damit Ports freigegeben werden (z.B. rosbridge :9090)
            #    2.5s statt 1.5s für sicherere Port-Freigabe
            await asyncio.sleep(2.5)

            # 3. SIGKILL an alle noch laufenden Prozesse in der Session
            try:
                result = subprocess.run(
                    ['pkill', '-KILL', '-s', str(pid)],
                    timeout=2, capture_output=True
                )
                print(f"[terminal_server] pkill -KILL -s {pid}: returncode={result.returncode}")
            except Exception as e:
                print(f"[terminal_server] pkill KILL Fehler: {e}")

            # 3b. Fallback: SIGKILL an die Process Group
            try:
                os.killpg(pid, signal.SIGKILL)
            except Exception:
                pass

            # 4. Zombie aufräumen
            try:
                os.waitpid(pid, os.WNOHANG)
            except ChildProcessError:
                pass

            # 5. PTY File Descriptor schließen
            try:
                os.close(fd)
            except OSError:
                pass

            print(f"[terminal_server] Session {pid} beendet.")


async def main():
    print("Starte echtes Ubuntu Terminal WebSocket-Backend auf Port 8765...")
    async with websockets.serve(terminal_handler, "0.0.0.0", 8765):
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Beendet.")
