from setuptools import find_packages, setup

package_name = 'tobii_glasses_and_yolo_to_grasp_routine'

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
    maintainer_email='mk@lab.local',
    description='TODO: Package description',
    license='TODO: License declaration',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'tobii_glasses_and_yolo_to_grasp_routine = tobii_glasses_and_yolo_to_grasp_routine.tobii_glasses_and_yolo_to_grasp_routine:main'
        ],
    },
)
