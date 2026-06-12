from setuptools import find_packages, setup

package_name = 'rviz_pose_control'

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
    maintainer='mk1',
    maintainer_email='mk1@todo.todo',
    description='TODO: Package description',
    license='TODO: License declaration',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'set_initial_pose = rviz_pose_control.set_initial_pose_node:main',
            'universal_initial_pose = rviz_pose_control.universal_initial_pose_node:main'
        ],
    },
)
