#!/usr/bin/env python3
import asyncio
import websockets
import os
import pty
import fcntl
import termios
import struct
import json
import traceback

# Dictionary to keep track of running terminals (optional, for later extension)
terminals = {}

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
                    if isinstance(message, str) and message.startswith('{"type":"resize"'):
                        try:
                            msg = json.loads(message)
                            set_winsize(msg['rows'], msg['cols'])
                        except:
                            pass
                    else:
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
            try:
                loop.remove_reader(fd)
            except:
                pass
            
            try:
                import psutil
                import signal
                import time
                try:
                    parent = psutil.Process(pid)
                    children = parent.children(recursive=True)
                    
                    # 1. Graceful Shutdown: send SIGTERM to all children
                    for child in children:
                        try:
                            child.terminate()
                        except psutil.NoSuchProcess:
                            pass
                    try:
                        parent.terminate()
                    except psutil.NoSuchProcess:
                        pass
                    
                    # Give processes time to release ports (e.g. rosbridge)
                    time.sleep(0.5)
                    
                    # 2. Force Kill remaining processes
                    for child in children:
                        if child.is_running():
                            try:
                                child.kill()
                            except psutil.NoSuchProcess:
                                pass
                    if parent.is_running():
                        try:
                            parent.kill()
                        except psutil.NoSuchProcess:
                            pass
                            
                except psutil.NoSuchProcess:
                    pass
                
                # Fallback to killpg
                try:
                    os.killpg(pid, signal.SIGKILL)
                except OSError:
                    pass
                
                os.waitpid(pid, 0)
            except Exception:
                pass
                
            try:
                os.close(fd)
            except OSError:
                pass

async def main():
    print("Starte echtes Ubuntu Terminal WebSocket-Backend auf Port 8765...")
    async with websockets.serve(terminal_handler, "0.0.0.0", 8765):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Beendet.")
