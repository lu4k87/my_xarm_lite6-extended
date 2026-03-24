from setuptools import setup

package_name = 'voice_command_listener'  # UNTERSTRICH, kein Bindestrich!

setup(
    name=package_name,                   # <- wichtig: 'voice_command_listener'
    version='0.1.0',
    packages=[package_name],
    data_files=[
        ('share/ament_index/resource_index/packages',
         ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='you',
    maintainer_email='you@example.com',
    description='Listens to ros2_whisper transcript and prints DE/EN commands',
    license='MIT',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            # Beide Namen verfügbar machen:
            'listener = voice_command_listener.voice_command_listener:main',
            'voice_command_listener = voice_command_listener.voice_command_listener:main',
        ],
    },
)

