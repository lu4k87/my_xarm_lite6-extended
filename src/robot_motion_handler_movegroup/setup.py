from setuptools import find_packages, setup

package_name = 'robot_motion_handler_movegroup'

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
    maintainer_email='mk@todo.todo',
    description='Universal robot motion handler using MoveGroup and Servo',
    license='TODO: License declaration',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'robot_motion_handler_movegroup = robot_motion_handler_movegroup.robot_motion_handler_movegroup:main'
        ],
    },
)
