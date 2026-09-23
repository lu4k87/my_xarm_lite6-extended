from launch import LaunchDescription
from launch.actions import ExecuteProcess, IncludeLaunchDescription, TimerAction
from launch_ros.actions import Node
from launch.launch_description_sources import AnyLaunchDescriptionSource
from ament_index_python.packages import get_package_share_directory
import os
import subprocess


def ensure_self_signed_cert(cert_path, key_path):
    """Legt ein selbstsigniertes Zertifikat an, falls keins da ist.

    certs/ liegt nicht mehr im Git-Repo (ein privater Schluessel gehoert da
    nicht hinein). Auf einem frischen Klon oder nach dem Loeschen entsteht es
    hier beim ersten Start neu. Die Quest muss ein neues Zertifikat einmal im
    Browser akzeptieren.
    """
    if os.path.exists(cert_path) and os.path.exists(key_path):
        return
    os.makedirs(os.path.dirname(cert_path), exist_ok=True)
    print(f'[vr_quest3_teleop] Kein Zertifikat gefunden - erzeuge {cert_path}')
    try:
        subprocess.run([
            'openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
            '-days', '825', '-subj', '/CN=localhost',
            '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1',
            '-keyout', key_path, '-out', cert_path,
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        os.chmod(key_path, 0o600)
    except (OSError, subprocess.CalledProcessError) as e:
        print(f'[vr_quest3_teleop] Zertifikat konnte nicht erzeugt werden: {e}')


def generate_launch_description():
    pkg_dir = get_package_share_directory('vr_quest3_teleop')
    driver_script_path = os.path.join(pkg_dir, 'https_vr_webxr_p8443', 'https_vr_webxr_p8443.py')
    
    # Kill any existing https_server to avoid port conflicts (8443)
    kill_existing = ExecuteProcess(
        cmd=['bash', '-c', 'pkill -9 -f https_vr_webxr_p8443.py || true'],
        output='screen'
    )

    adb_rev_9091 = ExecuteProcess(
        cmd=['adb', 'reverse', 'tcp:9091', 'tcp:9091'],
        output='screen'
    )
    
    adb_rev_8443 = ExecuteProcess(
        cmd=['adb', 'reverse', 'tcp:8443', 'tcp:8443'],
        output='screen'
    )

    ws_root = os.environ.get("ROS2_WS", os.path.expanduser('~/dev_ws'))
    cert_path = os.path.join(ws_root, 'certs', 'cert.pem')
    key_path = os.path.join(ws_root, 'certs', 'key.pem')
    if not os.path.exists(cert_path):
        cert_path = os.path.expanduser('~/dev_ws/certs/cert.pem')
        key_path = os.path.expanduser('~/dev_ws/certs/key.pem')
    ensure_self_signed_cert(cert_path, key_path)

    rosbridge = IncludeLaunchDescription(
        AnyLaunchDescriptionSource(
            os.path.join(get_package_share_directory('rosbridge_server'), 'launch', 'rosbridge_websocket_launch.xml')
        ),
        launch_arguments={
            'port': '9091',
            'ssl': 'true',
            'certfile': cert_path,
            'keyfile': key_path
        }.items()
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
        kill_existing,
        adb_rev_9091,
        adb_rev_8443,
        TimerAction(
            period=1.5,
            actions=[rosbridge, https_server, teleop_node]
        )
    ])
