from setuptools import find_packages, setup

package_name = 'gaze_control_ui_tobii_glasses'

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
    description='TODO: Package description',
    license='TODO: License declaration',
    extras_require={
        'test': [
            'pytest',
        ],
    },
    entry_points={
        'console_scripts': [
            'gaze_ui = gaze_control_ui_tobii_glasses.gaze_ui_node_tobii_glasses:main',
            'gaze_ui_zedm = gaze_control_ui_tobii_glasses.gaze_ui_node_tobii_glasses_zedm:main',
            'gaze_ui_tobii = gaze_control_ui_tobii_glasses.gaze_ui_node_tobii_4c:main',
            'tobii_publisher = gaze_control_ui_tobii_glasses.tobii_4c_publisher_node:main',
        ],
    },
)
