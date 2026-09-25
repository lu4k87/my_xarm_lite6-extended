from setuptools import find_packages, setup

package_name = 'window_x11_streamer'

setup(
    name=package_name,
    version='0.0.0',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='mk',
    maintainer_email='lu4k87@live.de',
    description='Captures an X11 window (default: RViz2) and publishes it as sensor_msgs/Image',
    license='TODO: License declaration',
    extras_require={
        'test': [
            'pytest',
        ],
    },
    entry_points={
        'console_scripts': [
            'window_capture_node = window_x11_streamer.window_capture_node:main'
        ],
    },
)
