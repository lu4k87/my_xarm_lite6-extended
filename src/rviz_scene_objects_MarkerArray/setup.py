import os
from glob import glob
from setuptools import find_packages, setup

package_name = 'rviz_scene_objects_MarkerArray'

setup(
    name=package_name,
    version='0.0.0',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        # Exportiert den URDF-Ordner
        (os.path.join('share', package_name, 'urdf'), glob('urdf/*')),
        # Exportiert den Meshes-Ordner (für ZEDM.stl)
        (os.path.join('share', package_name, 'meshes'), glob('meshes/*')),
        # Exportiert den Launch-Ordner (NEU HINZUGEFÜGT)
        (os.path.join('share', package_name, 'launch'), glob('launch/*.py')),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='user',
    maintainer_email='user@todo.todo',
    description='Visualisierung von Markern in Rviz2',
    license='TODO: License declaration',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'rviz_scene_objects_MarkerArray = rviz_scene_objects_MarkerArray.rviz_scene_objects_MarkerArray:main',
        ],
    },
)
