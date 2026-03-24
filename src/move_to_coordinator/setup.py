from setuptools import setup

package_name = 'move_to_coordinator'

setup(
    name=package_name,
    version='0.1.0',
    packages=[package_name],
    data_files=[
        ('share/ament_index/resource_index/packages', ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='you',
    maintainer_email='you@example.com',
    description='Coordinates voice commands and YOLO poses to command motion sequence services.',
    license='MIT',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'move_to_coordinator = move_to_coordinator.move_to_coordinator:main',
        ],
    },
)

