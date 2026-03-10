from setuptools import find_packages, setup

package_name = 'motion_sequence' # Passe diesen Namen an dein Paket an!

setup(
    name=package_name,
    version='0.0.0',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/' + package_name, ['package.xml']),
        ('share/' + package_name + '/launch', ['launch/motion_sequence_launch.py']), # Optional: Füge deine Launch-Dateien hier hinzu
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='Your Name',
    maintainer_email='user@example.com',
    description='TODO: Package description',
    license='TODO: License declaration',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'motion_sequence = motion_sequence.motion_sequence:main', # Passe 'dein_python_paket_name' und 'motion_sequence_node' an
        ],
    },
)
