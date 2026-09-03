from setuptools import find_packages, setup

package_name = 'teleop_pre_collision_checker'

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
    maintainer='labadmin',
    maintainer_email='labadmin@todo.todo',
    description='TODO: Package description',
    license='TODO: License declaration',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            "teleop_pre_collision_checker = teleop_pre_collision_checker.teleop_pre_collision_checker:main" # <<-----------------add entry point for checker node         'mein_node = mein_paket.mein_script:main',            
        ],
    },
)
