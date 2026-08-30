import re

file = '/home/mk/dev_ws/ros2_nexus/ros2_nexus_script.js'
with open(file, 'r', encoding='utf-8') as f:
    content = f.read()

def replacer(match):
    p1 = match.group(1)
    p2 = match.group(2)
    p3 = match.group(3)
    
    # Remove inner ul
    new_html = re.sub(r'<ul style="padding-left: 14px;[^>]*>.*?<\/ul>', '', p2)
    
    if 'web_video_server' in p1:
        new_html = new_html.replace('web_video_server.cpp', 'web_video_server')
        
    return p1 + new_html + p3

# Find all "ros2 run ...": `...`
new_content = re.sub(r'("ros2 run [^"]+": `)(.*?)(`)', replacer, content, flags=re.DOTALL)

with open(file, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Fixed node action cards.')
