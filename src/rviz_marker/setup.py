from setuptools import find_packages, setup

package_name = 'rviz_marker'

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
    maintainer='user',
    maintainer_email='user@todo.todo',
    description='Visualisierung von Markern in Rviz2',
    license='TODO: License declaration',
    tests_require=['pytest'],
    # HIER WIRD DER EINSTIEGSPUNKT FÜR DEN KNOTEN DEFINIERT
    entry_points={
        'console_scripts': [
            # Name des Befehls = Paketname.Modulname: Funktionsname
            'marker_publisher = rviz_marker.marker_publisher:main',
        ],
    },
)
