import sys
sys.path.append('/home/mk1/dev_ws/src/voice_command_listener/voice_command_listener')
import voice_command_listener
print(voice_command_listener.clean_and_map_object("den apfel"))
print(voice_command_listener.clean_and_map_object("die rote tasse"))
print(voice_command_listener.clean_and_map_object("eine flasche bitte"))
