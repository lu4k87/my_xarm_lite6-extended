import re

file = '/home/mk/dev_ws/ros2_nexus/ros2_nexus_script.js'
with open(file, 'r', encoding='utf-8') as f:
    content = f.read()

# Add missing nodes to lite6_moveit_servo_fake popup
node_badge = """<li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span>"""

# For FAKE
fake_target = f"""{node_badge}<span style="color: var(--c-node);"> servo_node</span> <span style="float:right;opacity:0.7;">(MoveIt Servo)</span></li>"""
fake_replacement = f"""{node_badge}<span style="color: var(--c-node);"> servo_node</span> <span style="float:right;opacity:0.7;">(MoveIt Servo)</span></li>{node_badge}<span style="color: var(--c-node);"> joy_to_servo_node</span> <span style="float:right;opacity:0.7;">(Gamepad to Servo)</span></li>"""
content = content.replace(fake_target, fake_replacement)

fake_target_checker = f"""{node_badge}<span style="color: var(--c-node);"> checker</span> <span style="float:right;opacity:0.7;">(Collision Check)</span></li>"""
fake_replacement_checker = f"""{node_badge}<span style="color: var(--c-node);"> checker</span> <span style="float:right;opacity:0.7;">(Collision Check)</span></li>{node_badge}<span style="color: var(--c-node);"> robot_motion_handler_movegroup</span> <span style="float:right;opacity:0.7;">(Pose MoveIt Node)</span></li>"""
# We must replace only the one inside fake popup (which is the first occurrence usually, but let's be careful).
# Actually both fake and real have checker. So this replace will do it for both! Which is perfect since BOTH need robot_motion_handler_movegroup.
content = content.replace(fake_target_checker, fake_replacement_checker)

# For REAL
real_target = f"""{node_badge}<span style="color: var(--c-node);"> robot_state_publisher</span> <span style="float:right;opacity:0.7;">(URDF / TF)</span></li>\n{node_badge}<span style="color: var(--c-node);"> servo_node</span>"""
# We want to insert static_tf2_broadcaster between robot_state_publisher and servo_node, but the spacing might not match perfectly if there's no newline. Let's use regex.
content = re.sub(
    r'(<span style="color: var\(--c-node\);"> robot_state_publisher</span> <span style="float:right;opacity:0.7;">\(URDF / TF\)</span></li>)(.*?<span style="color: var\(--c-node\);"> servo_node</span>)',
    r'\1' + node_badge + r'<span style="color: var(--c-node);"> static_tf2_broadcaster</span> <span style="float:right;opacity:0.7;">(TF: world → link_base)</span></li>\2',
    content,
    count=1 # only the first one might be fake, wait...
)

# It's better to just replace the whole string for the REAL launch.
real_key = '"ros2 launch xarm_moveit_servo lite6_moveit_servo_realmove.launch.py robot_ip:=192.168.1.175 add_vacuum_gripper:=true report_type:=dev":'
if real_key in content:
    start_idx = content.find(real_key)
    end_idx = content.find('`', content.find('`', start_idx) + 1) + 1
    real_str = content[start_idx:end_idx]
    
    # insert static_tf2_broadcaster
    real_str = real_str.replace(
        f"""{node_badge}<span style="color: var(--c-node);"> servo_node</span>""",
        f"""{node_badge}<span style="color: var(--c-node);"> static_tf2_broadcaster</span> <span style="float:right;opacity:0.7;">(TF: world → link_base)</span></li>{node_badge}<span style="color: var(--c-node);"> servo_node</span>"""
    )
    # insert joy_to_servo_node
    real_str = real_str.replace(
        f"""{node_badge}<span style="color: var(--c-node);"> servo_node</span> <span style="float:right;opacity:0.7;">(MoveIt Servo)</span></li>""",
        f"""{node_badge}<span style="color: var(--c-node);"> servo_node</span> <span style="float:right;opacity:0.7;">(MoveIt Servo)</span></li>{node_badge}<span style="color: var(--c-node);"> joy_to_servo_node</span> <span style="float:right;opacity:0.7;">(Gamepad to Servo)</span></li>"""
    )
    # insert joint_state_publisher
    real_str = real_str.replace(
        f"""{node_badge}<span style="color: var(--c-node);"> rviz2</span>""",
        f"""{node_badge}<span style="color: var(--c-node);"> joint_state_publisher</span> <span style="float:right;opacity:0.7;">(Joint State Publisher)</span></li>{node_badge}<span style="color: var(--c-node);"> rviz2</span>"""
    )
    
    content = content[:start_idx] + real_str + content[end_idx:]

with open(file, 'w', encoding='utf-8') as f:
    f.write(content)
