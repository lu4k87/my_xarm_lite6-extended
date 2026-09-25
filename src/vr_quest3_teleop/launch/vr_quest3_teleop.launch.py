from launch import LaunchDescription
from launch.actions import ExecuteProcess
from launch_ros.actions import Node
from ament_index_python.packages import get_package_share_directory
import os
import subprocess
import socket


def get_san_ips():
    ips = {'127.0.0.1'}
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ips.add(s.getsockname()[0])
        s.close()
    except Exception:
        pass
    return ips


def ensure_self_signed_cert(cert_path, key_path):
    """Legt ein selbstsigniertes Zertifikat an bzw. erneuert es, falls die aktuelle IP fehlt."""
    san_ips = get_san_ips()
    if os.path.exists(cert_path) and os.path.exists(key_path):
        try:
            res = subprocess.run(['openssl', 'x509', '-in', cert_path, '-noout', '-text'],
                                 capture_output=True, text=True)
            if all(ip in res.stdout for ip in san_ips):
                return
        except Exception:
            return
    os.makedirs(os.path.dirname(cert_path), exist_ok=True)
    san_str = 'DNS:localhost,' + ','.join(f'IP:{ip}' for ip in sorted(san_ips))
    print(f'[vr_quest3_teleop] Erzeuge/aktualisiere Zertifikat mit SAN: {san_str} ({cert_path})')
    try:
        subprocess.run([
            'openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
            '-days', '825', '-subj', '/CN=localhost',
            '-addext', f'subjectAltName={san_str}',
            '-keyout', key_path, '-out', cert_path,
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        os.chmod(key_path, 0o600)
    except (OSError, subprocess.CalledProcessError) as e:
        print(f'[vr_quest3_teleop] Zertifikat konnte nicht erzeugt werden: {e}')


def generate_launch_description():
    pkg_dir = get_package_share_directory('vr_quest3_teleop')
    driver_script_path = os.path.join(pkg_dir, 'https_vr_webxr_p8443', 'https_vr_webxr_p8443.py')
    
    # 1. Beende eventuell alte Server-Prozesse auf Port 8443
    try:
        subprocess.run(['fuser', '-k', '8443/tcp'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass

    # 2. Richte ADB Reverse ein, falls eine Meta Quest per USB angeschlossen ist
    try:
        if subprocess.run(['which', 'adb'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0:
            res = subprocess.run(['adb', 'get-state'], capture_output=True, text=True)
            if 'device' in res.stdout:
                subprocess.run(['adb', 'reverse', 'tcp:9091', 'tcp:9091'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                subprocess.run(['adb', 'reverse', 'tcp:8443', 'tcp:8443'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass

    ws_root = os.environ.get("ROS2_WS", os.path.expanduser('~/dev_ws'))
    cert_path = os.path.join(ws_root, 'certs', 'cert.pem')
    key_path = os.path.join(ws_root, 'certs', 'key.pem')
    if not os.path.exists(cert_path):
        cert_path = os.path.expanduser('~/dev_ws/certs/cert.pem')
        key_path = os.path.expanduser('~/dev_ws/certs/key.pem')
    ensure_self_signed_cert(cert_path, key_path)

    # SSL-rosbridge fuer die Quest (wss://<host>:9091). Direkt als Node statt
    # ueber rosbridge_websocket_launch.xml: das XML startet immer auch einen
    # eigenen /rosapi. Laeuft daneben die Robot Control UI (9090), gibt es
    # zwei /rosapi - dann haengt /rosapi/nodes. rosapi_guard startet deshalb
    # nur dann einen, wenn keiner da ist.
    # Eigener Node-Name: zwei Nodes namens /rosbridge_websocket teilen sich
    # sonst Parameter und Services.
    # call_services_in_new_thread + Timeout wie in der UI (9090): ohne sie
    # arbeitet rosbridge Service-Aufrufe im Hauptthread ab - ein haengender
    # Aufruf blockiert dann alles Weitere der VR-Seite (Topics, Buttons).
    rosbridge = Node(
        package='rosbridge_server',
        executable='rosbridge_websocket',
        name='rosbridge_websocket_ssl_9091',
        output='screen',
        parameters=[{
            'port': 9091,
            'address': '',
            'certfile': cert_path,
            'keyfile': key_path,
            'call_services_in_new_thread': True,
            'send_action_goals_in_new_thread': True,
            'default_call_service_timeout': 10.0,
        }],
    )

    rosapi_guard = Node(
        package='vr_quest3_teleop',
        executable='rosapi_guard',
        name='vr_rosapi_guard',
        output='screen',
    )

    https_server = ExecuteProcess(
        cmd=['python3', driver_script_path],
        output='screen'
    )
    
    teleop_node = Node(
        package='vr_quest3_teleop',
        executable='vr_quest3_teleop_node',
        name='vr_quest3_teleop_node',
        output='screen'
    )
    
    return LaunchDescription([
        rosbridge,
        rosapi_guard,
        https_server,
        teleop_node
    ])
