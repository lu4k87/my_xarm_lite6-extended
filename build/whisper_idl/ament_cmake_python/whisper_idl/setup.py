from setuptools import find_packages
from setuptools import setup

setup(
    name='whisper_idl',
    version='1.4.0',
    packages=find_packages(
        include=('whisper_idl', 'whisper_idl.*')),
)
