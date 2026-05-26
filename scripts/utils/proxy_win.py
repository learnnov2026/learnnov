"""
LearnNov localhost proxy — no admin required
Windows localhost:8888  -->  wsl nc  -->  Docker 127.0.0.1:8888 inside WSL2

Each TCP connection spawns a wsl subprocess (Ubuntu-22.04 is already running so
startup is ~50ms).  Works even when mirrored-mode localhost-forwarding is broken.
"""
import socket
import subprocess
import threading
import sys

import os

LOCAL_PORT  = 8888
WSL_DISTRO  = os.environ.get("WSL_DISTRO", "Ubuntu-22.04")
REMOTE_PORT = 8888


def _relay(src_read, dst_write, stop: threading.Event):
    try:
        while not stop.is_set():
            data = src_read(65536)
            if not data:
                break
            dst_write(data)
    except Exception:
        pass
    finally:
        stop.set()


def handle(client: socket.socket):
    try:
        wsl_cmd = ["wsl"]
        if WSL_DISTRO:
            wsl_cmd.extend(["-d", WSL_DISTRO])
        wsl_cmd.extend(["--", "nc", "127.0.0.1", str(REMOTE_PORT)])

        proc = subprocess.Popen(
            wsl_cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
        )
    except Exception as e:
        print(f"  [!] wsl/nc failed: {e}")
        client.close()
        return

    stop = threading.Event()

    def client_to_wsl():
        _relay(
            lambda n: client.recv(n),
            lambda d: (proc.stdin.write(d), proc.stdin.flush()),
            stop,
        )
        try:
            proc.stdin.close()
        except Exception:
            pass

    def wsl_to_client():
        _relay(proc.stdout.read, client.sendall, stop)

    t1 = threading.Thread(target=client_to_wsl, daemon=True)
    t2 = threading.Thread(target=wsl_to_client, daemon=True)
    t1.start()
    t2.start()
    t2.join(timeout=300)
    stop.set()
    try:
        proc.terminate()
    except Exception:
        pass
    try:
        client.close()
    except Exception:
        pass


def main():
    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        srv.bind(("127.0.0.1", LOCAL_PORT))
    except OSError as e:
        print(f"ERROR: Cannot bind 127.0.0.1:{LOCAL_PORT} -> {e}")
        print("  Something else is using this port. Kill it and retry.")
        sys.exit(1)

    srv.listen(128)
    print(f"[LearnNov Proxy] http://localhost:{LOCAL_PORT}/")
    print(f"  Routing via WSL2 ({WSL_DISTRO}) -> Docker:{REMOTE_PORT}")
    print("  Press Ctrl+C to stop\n")
    try:
        while True:
            client, _ = srv.accept()
            threading.Thread(target=handle, args=(client,), daemon=True).start()
    except KeyboardInterrupt:
        print("\n[LearnNov Proxy] stopped.")
    finally:
        srv.close()


if __name__ == "__main__":
    main()
