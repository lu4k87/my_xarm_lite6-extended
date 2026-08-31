from setuptools import find_packages, setup

package_name = 'vr_quest3_teleop'

setup(
    name=package_name,
    version='0.0.0',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        ('share/' + package_name + '/launch', ['launch/vr_quest3_teleop.launch.py']),
        ('share/' + package_name + '/https_vr_webxr_p8443', ['https_vr_webxr_p8443/https_vr_webxr_p8443.py', 'https_vr_webxr_p8443/controller_reader.html']),
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
            'vr_quest3_teleop_node = vr_quest3_teleop.vr_quest3_teleop_node:main'
        ],
    },
)
