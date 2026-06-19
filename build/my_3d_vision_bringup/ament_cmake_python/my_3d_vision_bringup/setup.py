from setuptools import find_packages
from setuptools import setup

setup(
    name='my_3d_vision_bringup',
    version='0.1.0',
    packages=find_packages(
        include=('my_3d_vision_bringup', 'my_3d_vision_bringup.*')),
)
