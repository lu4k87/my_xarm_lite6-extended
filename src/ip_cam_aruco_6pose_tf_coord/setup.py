from setuptools import find_packages, setup

package_name = 'ip_cam_aruco_6pose_tf_coord'

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
    description='IP Cam ArUco 6-Pose TF Coordinate Node',
    license='TODO: License declaration',
    extras_require={
        'test': [
            'pytest',
        ],
    },
    entry_points={
        'console_scripts': [
            'ip_cam_aruco_6pose_tf_coord = ip_cam_aruco_6pose_tf_coord.ip_cam_aruco_6pose_tf_coord:main',
            'ip_cam_aruco_6pose_tf_coord_node = ip_cam_aruco_6pose_tf_coord.ip_cam_aruco_6pose_tf_coord:main',
        ],
    },
)
