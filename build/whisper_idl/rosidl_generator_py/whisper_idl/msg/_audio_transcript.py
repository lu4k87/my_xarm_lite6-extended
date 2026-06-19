# generated from rosidl_generator_py/resource/_idl.py.em
# with input from whisper_idl:msg/AudioTranscript.idl
# generated code does not contain a copyright notice


# Import statements for member types

# Member 'probs'
# Member 'occ'
# Member 'seg_start_words_id'
# Member 'seg_duration_ms'
import array  # noqa: E402, I100

import builtins  # noqa: E402, I100

import math  # noqa: E402, I100

import rosidl_parser.definition  # noqa: E402, I100


class Metaclass_AudioTranscript(type):
    """Metaclass of message 'AudioTranscript'."""

    _CREATE_ROS_MESSAGE = None
    _CONVERT_FROM_PY = None
    _CONVERT_TO_PY = None
    _DESTROY_ROS_MESSAGE = None
    _TYPE_SUPPORT = None

    __constants = {
    }

    @classmethod
    def __import_type_support__(cls):
        try:
            from rosidl_generator_py import import_type_support
            module = import_type_support('whisper_idl')
        except ImportError:
            import logging
            import traceback
            logger = logging.getLogger(
                'whisper_idl.msg.AudioTranscript')
            logger.debug(
                'Failed to import needed modules for type support:\n' +
                traceback.format_exc())
        else:
            cls._CREATE_ROS_MESSAGE = module.create_ros_message_msg__msg__audio_transcript
            cls._CONVERT_FROM_PY = module.convert_from_py_msg__msg__audio_transcript
            cls._CONVERT_TO_PY = module.convert_to_py_msg__msg__audio_transcript
            cls._TYPE_SUPPORT = module.type_support_msg__msg__audio_transcript
            cls._DESTROY_ROS_MESSAGE = module.destroy_ros_message_msg__msg__audio_transcript

            from builtin_interfaces.msg import Time
            if Time.__class__._TYPE_SUPPORT is None:
                Time.__class__.__import_type_support__()

    @classmethod
    def __prepare__(cls, name, bases, **kwargs):
        # list constant names here so that they appear in the help text of
        # the message class under "Data and other attributes defined here:"
        # as well as populate each message instance
        return {
        }


class AudioTranscript(metaclass=Metaclass_AudioTranscript):
    """Message class 'AudioTranscript'."""

    __slots__ = [
        '_words',
        '_probs',
        '_occ',
        '_seg_start_words_id',
        '_seg_start_time',
        '_seg_duration_ms',
        '_active_index',
    ]

    _fields_and_field_types = {
        'words': 'sequence<string>',
        'probs': 'sequence<float>',
        'occ': 'sequence<int32>',
        'seg_start_words_id': 'sequence<int32>',
        'seg_start_time': 'sequence<builtin_interfaces/Time>',
        'seg_duration_ms': 'sequence<int32>',
        'active_index': 'int32',
    }

    SLOT_TYPES = (
        rosidl_parser.definition.UnboundedSequence(rosidl_parser.definition.UnboundedString()),  # noqa: E501
        rosidl_parser.definition.UnboundedSequence(rosidl_parser.definition.BasicType('float')),  # noqa: E501
        rosidl_parser.definition.UnboundedSequence(rosidl_parser.definition.BasicType('int32')),  # noqa: E501
        rosidl_parser.definition.UnboundedSequence(rosidl_parser.definition.BasicType('int32')),  # noqa: E501
        rosidl_parser.definition.UnboundedSequence(rosidl_parser.definition.NamespacedType(['builtin_interfaces', 'msg'], 'Time')),  # noqa: E501
        rosidl_parser.definition.UnboundedSequence(rosidl_parser.definition.BasicType('int32')),  # noqa: E501
        rosidl_parser.definition.BasicType('int32'),  # noqa: E501
    )

    def __init__(self, **kwargs):
        assert all('_' + key in self.__slots__ for key in kwargs.keys()), \
            'Invalid arguments passed to constructor: %s' % \
            ', '.join(sorted(k for k in kwargs.keys() if '_' + k not in self.__slots__))
        self.words = kwargs.get('words', [])
        self.probs = array.array('f', kwargs.get('probs', []))
        self.occ = array.array('i', kwargs.get('occ', []))
        self.seg_start_words_id = array.array('i', kwargs.get('seg_start_words_id', []))
        self.seg_start_time = kwargs.get('seg_start_time', [])
        self.seg_duration_ms = array.array('i', kwargs.get('seg_duration_ms', []))
        self.active_index = kwargs.get('active_index', int())

    def __repr__(self):
        typename = self.__class__.__module__.split('.')
        typename.pop()
        typename.append(self.__class__.__name__)
        args = []
        for s, t in zip(self.__slots__, self.SLOT_TYPES):
            field = getattr(self, s)
            fieldstr = repr(field)
            # We use Python array type for fields that can be directly stored
            # in them, and "normal" sequences for everything else.  If it is
            # a type that we store in an array, strip off the 'array' portion.
            if (
                isinstance(t, rosidl_parser.definition.AbstractSequence) and
                isinstance(t.value_type, rosidl_parser.definition.BasicType) and
                t.value_type.typename in ['float', 'double', 'int8', 'uint8', 'int16', 'uint16', 'int32', 'uint32', 'int64', 'uint64']
            ):
                if len(field) == 0:
                    fieldstr = '[]'
                else:
                    assert fieldstr.startswith('array(')
                    prefix = "array('X', "
                    suffix = ')'
                    fieldstr = fieldstr[len(prefix):-len(suffix)]
            args.append(s[1:] + '=' + fieldstr)
        return '%s(%s)' % ('.'.join(typename), ', '.join(args))

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return False
        if self.words != other.words:
            return False
        if self.probs != other.probs:
            return False
        if self.occ != other.occ:
            return False
        if self.seg_start_words_id != other.seg_start_words_id:
            return False
        if self.seg_start_time != other.seg_start_time:
            return False
        if self.seg_duration_ms != other.seg_duration_ms:
            return False
        if self.active_index != other.active_index:
            return False
        return True

    @classmethod
    def get_fields_and_field_types(cls):
        from copy import copy
        return copy(cls._fields_and_field_types)

    @builtins.property
    def words(self):
        """Message field 'words'."""
        return self._words

    @words.setter
    def words(self, value):
        if __debug__:
            from collections.abc import Sequence
            from collections.abc import Set
            from collections import UserList
            from collections import UserString
            assert \
                ((isinstance(value, Sequence) or
                  isinstance(value, Set) or
                  isinstance(value, UserList)) and
                 not isinstance(value, str) and
                 not isinstance(value, UserString) and
                 all(isinstance(v, str) for v in value) and
                 True), \
                "The 'words' field must be a set or sequence and each value of type 'str'"
        self._words = value

    @builtins.property
    def probs(self):
        """Message field 'probs'."""
        return self._probs

    @probs.setter
    def probs(self, value):
        if isinstance(value, array.array):
            assert value.typecode == 'f', \
                "The 'probs' array.array() must have the type code of 'f'"
            self._probs = value
            return
        if __debug__:
            from collections.abc import Sequence
            from collections.abc import Set
            from collections import UserList
            from collections import UserString
            assert \
                ((isinstance(value, Sequence) or
                  isinstance(value, Set) or
                  isinstance(value, UserList)) and
                 not isinstance(value, str) and
                 not isinstance(value, UserString) and
                 all(isinstance(v, float) for v in value) and
                 all(not (val < -3.402823466e+38 or val > 3.402823466e+38) or math.isinf(val) for val in value)), \
                "The 'probs' field must be a set or sequence and each value of type 'float' and each float in [-340282346600000016151267322115014000640.000000, 340282346600000016151267322115014000640.000000]"
        self._probs = array.array('f', value)

    @builtins.property
    def occ(self):
        """Message field 'occ'."""
        return self._occ

    @occ.setter
    def occ(self, value):
        if isinstance(value, array.array):
            assert value.typecode == 'i', \
                "The 'occ' array.array() must have the type code of 'i'"
            self._occ = value
            return
        if __debug__:
            from collections.abc import Sequence
            from collections.abc import Set
            from collections import UserList
            from collections import UserString
            assert \
                ((isinstance(value, Sequence) or
                  isinstance(value, Set) or
                  isinstance(value, UserList)) and
                 not isinstance(value, str) and
                 not isinstance(value, UserString) and
                 all(isinstance(v, int) for v in value) and
                 all(val >= -2147483648 and val < 2147483648 for val in value)), \
                "The 'occ' field must be a set or sequence and each value of type 'int' and each integer in [-2147483648, 2147483647]"
        self._occ = array.array('i', value)

    @builtins.property
    def seg_start_words_id(self):
        """Message field 'seg_start_words_id'."""
        return self._seg_start_words_id

    @seg_start_words_id.setter
    def seg_start_words_id(self, value):
        if isinstance(value, array.array):
            assert value.typecode == 'i', \
                "The 'seg_start_words_id' array.array() must have the type code of 'i'"
            self._seg_start_words_id = value
            return
        if __debug__:
            from collections.abc import Sequence
            from collections.abc import Set
            from collections import UserList
            from collections import UserString
            assert \
                ((isinstance(value, Sequence) or
                  isinstance(value, Set) or
                  isinstance(value, UserList)) and
                 not isinstance(value, str) and
                 not isinstance(value, UserString) and
                 all(isinstance(v, int) for v in value) and
                 all(val >= -2147483648 and val < 2147483648 for val in value)), \
                "The 'seg_start_words_id' field must be a set or sequence and each value of type 'int' and each integer in [-2147483648, 2147483647]"
        self._seg_start_words_id = array.array('i', value)

    @builtins.property
    def seg_start_time(self):
        """Message field 'seg_start_time'."""
        return self._seg_start_time

    @seg_start_time.setter
    def seg_start_time(self, value):
        if __debug__:
            from builtin_interfaces.msg import Time
            from collections.abc import Sequence
            from collections.abc import Set
            from collections import UserList
            from collections import UserString
            assert \
                ((isinstance(value, Sequence) or
                  isinstance(value, Set) or
                  isinstance(value, UserList)) and
                 not isinstance(value, str) and
                 not isinstance(value, UserString) and
                 all(isinstance(v, Time) for v in value) and
                 True), \
                "The 'seg_start_time' field must be a set or sequence and each value of type 'Time'"
        self._seg_start_time = value

    @builtins.property
    def seg_duration_ms(self):
        """Message field 'seg_duration_ms'."""
        return self._seg_duration_ms

    @seg_duration_ms.setter
    def seg_duration_ms(self, value):
        if isinstance(value, array.array):
            assert value.typecode == 'i', \
                "The 'seg_duration_ms' array.array() must have the type code of 'i'"
            self._seg_duration_ms = value
            return
        if __debug__:
            from collections.abc import Sequence
            from collections.abc import Set
            from collections import UserList
            from collections import UserString
            assert \
                ((isinstance(value, Sequence) or
                  isinstance(value, Set) or
                  isinstance(value, UserList)) and
                 not isinstance(value, str) and
                 not isinstance(value, UserString) and
                 all(isinstance(v, int) for v in value) and
                 all(val >= -2147483648 and val < 2147483648 for val in value)), \
                "The 'seg_duration_ms' field must be a set or sequence and each value of type 'int' and each integer in [-2147483648, 2147483647]"
        self._seg_duration_ms = array.array('i', value)

    @builtins.property
    def active_index(self):
        """Message field 'active_index'."""
        return self._active_index

    @active_index.setter
    def active_index(self, value):
        if __debug__:
            assert \
                isinstance(value, int), \
                "The 'active_index' field must be of type 'int'"
            assert value >= -2147483648 and value < 2147483648, \
                "The 'active_index' field must be an integer in [-2147483648, 2147483647]"
        self._active_index = value
