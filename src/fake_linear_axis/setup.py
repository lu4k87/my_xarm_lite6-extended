from setuptools import find_packages, setup

package_name = 'fake_linear_axis'

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
    description='Fake linear axis TF broadcaster and RViz marker visualizer',
    license='TODO: License declaration',
    extras_require={
        'test': [
            'pytest',
        ],
    },
    entry_points={
        'console_scripts': [
            'fake_linear_axis = fake_linear_axis.fake_linear_axis_node:main'
        ],
    },
)

