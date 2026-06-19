# generated from rosidl_generator_py/resource/_idl.py.em
# with input from whisper_idl:msg/WhisperTokens.idl
# generated code does not contain a copyright notice


# Import statements for member types

# Member 'token_ids'
# Member 'token_probs'
# Member 'segment_start_token_idxs'
# Member 'start_times'
# Member 'end_times'
import array  # noqa: E402, I100

import builtins  # noqa: E402, I100

import math  # noqa: E402, I100

import rosidl_parser.definition  # noqa: E402, I100


class Metaclass_WhisperTokens(type):
    """Metaclass of message 'WhisperTokens'."""

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
                'whisper_idl.msg.WhisperTokens')
            logger.debug(
                'Failed to import needed modules for type support:\n' +
                traceback.format_exc())
        else:
            cls._CREATE_ROS_MESSAGE = module.create_ros_message_msg__msg__whisper_tokens
            cls._CONVERT_FROM_PY = module.convert_from_py_msg__msg__whisper_tokens
            cls._CONVERT_TO_PY = module.convert_to_py_msg__msg__whisper_tokens
            cls._TYPE_SUPPORT = module.type_support_msg__msg__whisper_tokens
            cls._DESTROY_ROS_MESSAGE = module.destroy_ros_message_msg__msg__whisper_tokens

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


class WhisperTokens(metaclass=Metaclass_WhisperTokens):
    """Message class 'WhisperTokens'."""

    __slots__ = [
        '_stamp',
        '_token_ids',
        '_token_texts',
        '_token_probs',
        '_segment_start_token_idxs',
        '_start_times',
        '_end_times',
        '_inference_duration',
    ]

    _fields_and_field_types = {
        'stamp': 'builtin_interfaces/Time',
        'token_ids': 'sequence<int32>',
        'token_texts': 'sequence<string>',
        'token_probs': 'sequence<float>',
        'segment_start_token_idxs': 'sequence<int32>',
        'start_times': 'sequence<int64>',
        'end_times': 'sequence<int64>',
        'inference_duration': 'int64',
    }

    SLOT_TYPES = (
        rosidl_parser.definition.NamespacedType(['builtin_interfaces', 'msg'], 'Time'),  # noqa: E501
        rosidl_parser.definition.UnboundedSequence(rosidl_parser.definition.BasicType('int32')),  # noqa: E501
        rosidl_parser.definition.UnboundedSequence(rosidl_parser.definition.UnboundedString()),  # noqa: E501
        rosidl_parser.definition.UnboundedSequence(rosidl_parser.definition.BasicType('float')),  # noqa: E501
        rosidl_parser.definition.UnboundedSequence(rosidl_parser.definition.BasicType('int32')),  # noqa: E501
        rosidl_parser.definition.UnboundedSequence(rosidl_parser.definition.BasicType('int64')),  # noqa: E501
        rosidl_parser.definition.UnboundedSequence(rosidl_parser.definition.BasicType('int64')),  # noqa: E501
        rosidl_parser.definition.BasicType('int64'),  # noqa: E501
    )

    def __init__(self, **kwargs):
        assert all('_' + key in self.__slots__ for key in kwargs.keys()), \
            'Invalid arguments passed to constructor: %s' % \
            ', '.join(sorted(k for k in kwargs.keys() if '_' + k not in self.__slots__))
        from builtin_interfaces.msg import Time
        self.stamp = kwargs.get('stamp', Time())
        self.token_ids = array.array('i', kwargs.get('token_ids', []))
        self.token_texts = kwargs.get('token_texts', [])
        self.token_probs = array.array('f', kwargs.get('token_probs', []))
        self.segment_start_token_idxs = array.array('i', kwargs.get('segment_start_token_idxs', []))
        self.start_times = array.array('q', kwargs.get('start_times', []))
        self.end_times = array.array('q', kwargs.get('end_times', []))
        self.inference_duration = kwargs.get('inference_duration', int())

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
        if self.stamp != other.stamp:
            return False
        if self.token_ids != other.token_ids:
            return False
        if self.token_texts != other.token_texts:
            return False
        if self.token_probs != other.token_probs:
            return False
        if self.segment_start_token_idxs != other.segment_start_token_idxs:
            return False
        if self.start_times != other.start_times:
            return False
        if self.end_times != other.end_times:
            return False
        if self.inference_duration != other.inference_duration:
            return False
        return True

    @classmethod
    def get_fields_and_field_types(cls):
        from copy import copy
        return copy(cls._fields_and_field_types)

    @builtins.property
    def stamp(self):
        """Message field 'stamp'."""
        return self._stamp

    @stamp.setter
    def stamp(self, value):
        if __debug__:
            from builtin_interfaces.msg import Time
            assert \
                isinstance(value, Time), \
                "The 'stamp' field must be a sub message of type 'Time'"
        self._stamp = value

    @builtins.property
    def token_ids(self):
        """Message field 'token_ids'."""
        return self._token_ids

    @token_ids.setter
    def token_ids(self, value):
        if isinstance(value, array.array):
            assert value.typecode == 'i', \
                "The 'token_ids' array.array() must have the type code of 'i'"
            self._token_ids = value
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
                "The 'token_ids' field must be a set or sequence and each value of type 'int' and each integer in [-2147483648, 2147483647]"
        self._token_ids = array.array('i', value)

    @builtins.property
    def token_texts(self):
        """Message field 'token_texts'."""
        return self._token_texts

    @token_texts.setter
    def token_texts(self, value):
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
                "The 'token_texts' field must be a set or sequence and each value of type 'str'"
        self._token_texts = value

    @builtins.property
    def token_probs(self):
        """Message field 'token_probs'."""
        return self._token_probs

    @token_probs.setter
    def token_probs(self, value):
        if isinstance(value, array.array):
            assert value.typecode == 'f', \
                "The 'token_probs' array.array() must have the type code of 'f'"
            self._token_probs = value
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
                "The 'token_probs' field must be a set or sequence and each value of type 'float' and each float in [-340282346600000016151267322115014000640.000000, 340282346600000016151267322115014000640.000000]"
        self._token_probs = array.array('f', value)

    @builtins.property
    def segment_start_token_idxs(self):
        """Message field 'segment_start_token_idxs'."""
        return self._segment_start_token_idxs

    @segment_start_token_idxs.setter
    def segment_start_token_idxs(self, value):
        if isinstance(value, array.array):
            assert value.typecode == 'i', \
                "The 'segment_start_token_idxs' array.array() must have the type code of 'i'"
            self._segment_start_token_idxs = value
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
                "The 'segment_start_token_idxs' field must be a set or sequence and each value of type 'int' and each integer in [-2147483648, 2147483647]"
        self._segment_start_token_idxs = array.array('i', value)

    @builtins.property
    def start_times(self):
        """Message field 'start_times'."""
        return self._start_times

    @start_times.setter
    def start_times(self, value):
        if isinstance(value, array.array):
            assert value.typecode == 'q', \
                "The 'start_times' array.array() must have the type code of 'q'"
            self._start_times = value
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
                 all(val >= -9223372036854775808 and val < 9223372036854775808 for val in value)), \
                "The 'start_times' field must be a set or sequence and each value of type 'int' and each integer in [-9223372036854775808, 9223372036854775807]"
        self._start_times = array.array('q', value)

    @builtins.property
    def end_times(self):
        """Message field 'end_times'."""
        return self._end_times

    @end_times.setter
    def end_times(self, value):
        if isinstance(value, array.array):
            assert value.typecode == 'q', \
                "The 'end_times' array.array() must have the type code of 'q'"
            self._end_times = value
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
                 all(val >= -9223372036854775808 and val < 9223372036854775808 for val in value)), \
                "The 'end_times' field must be a set or sequence and each value of type 'int' and each integer in [-9223372036854775808, 9223372036854775807]"
        self._end_times = array.array('q', value)

    @builtins.property
    def inference_duration(self):
        """Message field 'inference_duration'."""
        return self._inference_duration

    @inference_duration.setter
    def inference_duration(self, value):
        if __debug__:
            assert \
                isinstance(value, int), \
                "The 'inference_duration' field must be of type 'int'"
            assert value >= -9223372036854775808 and value < 9223372036854775808, \
                "The 'inference_duration' field must be an integer in [-9223372036854775808, 9223372036854775807]"
        self._inference_duration = value
