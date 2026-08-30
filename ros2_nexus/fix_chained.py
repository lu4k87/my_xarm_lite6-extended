import re

file = '/home/mk/dev_ws/ros2_nexus/ros2_nexus_script.js'
with open(file, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to replace the tooltip logic in renderTab
old_logic = """          let tooltipHtml = '';
          const aCmdBase = a.cmd.split(' &')[0].trim();
          let matchedKey = Object.keys(CMD_DETAILS)
                              .sort((k1, k2) => k2.length - k1.length)
                              .find(k => a.cmd.includes(k) || k.includes(aCmdBase));
          
          if (matchedKey) {
             tooltipHtml = CMD_DETAILS[matchedKey];
          } else if (a.cmd.startsWith('ros2 launch')) {"""

new_logic = """          let tooltipHtml = '';
          let subCmds = a.cmd.split(/(?:&&|&)/).map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('sleep') && !s.startsWith('wait'));
          
          if (subCmds.length > 1) {
             tooltipHtml = `<div style="font-size: 11px; color: var(--mut); margin-bottom: 4px;"><b>Included Source Files:</b></div><ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;">`;
             subCmds.forEach(subCmd => {
                 let mKey = Object.keys(CMD_DETAILS)
                              .sort((k1, k2) => k2.length - k1.length)
                              .find(k => subCmd.includes(k));
                 if (mKey) {
                     let match = CMD_DETAILS[mKey].match(/<ul[^>]*>([\\s\\S]*?)<\\/ul>$/);
                     if (match) {
                         tooltipHtml += match[1];
                     } else {
                         tooltipHtml += CMD_DETAILS[mKey];
                     }
                 } else if (subCmd.startsWith('ros2 run')) {
                     const parts = subCmd.split(' ');
                     const pkg = parts[2] || '';
                     let node = parts[3] || '';
                     if (!node.includes('.')) node += ' (Source: .py / .cpp)';
                     tooltipHtml += `<li><span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width: 10px; height: 10px; margin-right: 4px; vertical-align: -0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);"> ${node}</span> <span style="float: right; opacity: 0.7;">(${pkg})</span></li>`;
                 } else if (subCmd.startsWith('(google-chrome') || subCmd.startsWith('google-chrome')) {
                     tooltipHtml += `<li><span class="badge badge-server" style="margin-right: 6px;"><i class="fa-solid fa-globe"></i>WEB</span><span style="color: var(--c-cmd);"> Chrome Browser</span> <span style="float: right; opacity: 0.7;">(Frontend)</span></li>`;
                 }
             });
             tooltipHtml += `</ul>`;
          } else {
             const aCmdBase = a.cmd.split(' &')[0].trim();
             let matchedKey = Object.keys(CMD_DETAILS)
                                 .sort((k1, k2) => k2.length - k1.length)
                                 .find(k => a.cmd.includes(k) || k.includes(aCmdBase));
             
             if (matchedKey) {
                tooltipHtml = CMD_DETAILS[matchedKey];
             } else if (a.cmd.startsWith('ros2 launch')) {"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully replaced chained command logic.")
else:
    print("Could not find old_logic block!")

