from setuptools import setup
import os
from glob import glob

package_name = 'yolo_object_detector'

setup(
    name=package_name,
    version='0.1.0',
    packages=[package_name],
    data_files=[
        ('share/ament_index/resource_index/packages', ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        ('share/' + package_name + '/launch', glob('launch/*.launch.py')),  # <--- NEU
        # falls du schon config/ hast, kannst du hier auch YAMLs listen
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='you',
    maintainer_email='you@example.com',
    description='YOLO detector with homography.',
    license='MIT',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'yolo_homography_node = yolo_object_detector.yolo_homography_node:main',
        ],
    },
)

