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
        # Child process: set environment and exec bash
        os.environ['TERM'] = 'xterm-256color'
        
        # Falls nötig: Setup scripts direkt vor-sourcen
        # e.g., os.system("source /opt/ros/humble/setup.bash")
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
                    loop.call_soon_threadsafe(output_queue.put_nowait, None) # EOF
            except OSError:
                loop.remove_reader(fd)
                loop.call_soon_threadsafe(output_queue.put_nowait, None)
                
        loop.add_reader(fd, pty_reader)

        async def send_to_ws():
            try:
                await websocket.send(json.dumps({"type": "pid", "pid": pid}))
            except:
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
            await asyncio.gather(send_to_ws(), recv_from_ws())
        except Exception as e:
            print(f"Error: {e}")
        finally:
            # Remove PTY reader
            try:
                loop.remove_reader(fd)
            except:
                pass
            
            # ── Sauberes Beenden aller Prozesse in der Session ──
            # pty.fork() macht den Child zum Session Leader (SID = pid).
            # Alle Prozesse die in diesem Terminal gestartet wurden
            # (auch ros2 launch Kinder) erben diese Session-ID.
            # pkill -s <SID> ist die EINZIGE zuverlässige Methode,
            # die wirklich ALLE Prozesse in der Session erreicht,
            # unabhängig von Prozessgruppen.
            
            print(f"[terminal_server] Beende Session {pid}...")
            
            # 1. SIGTERM an die gesamte Session → sauberes Herunterfahren
            try:
                subprocess.run(
                    ['pkill', '-TERM', '-s', str(pid)],
                    timeout=2, capture_output=True
                )
            except Exception:
                pass
            
            # 2. Warten, damit Ports freigegeben werden (z.B. rosbridge :9090)
            await asyncio.sleep(1.0)
            
            # 3. SIGKILL an alle noch laufenden Prozesse in der Session
            try:
                subprocess.run(
                    ['pkill', '-KILL', '-s', str(pid)],
                    timeout=2, capture_output=True
                )
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
