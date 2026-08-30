import re

file = '/home/mk/dev_ws/ros2_nexus/ros2_nexus_script.js'
with open(file, 'r', encoding='utf-8') as f:
    content = f.read()

old_func = """    function buildExpandedTooltip(actions) {
       let html = `<ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;">`;
       actions.forEach(a => {
           let expanded = CMD_DETAILS[a.cmd];
           if (!expanded) {
               const aCmdBase = a.cmd.split(' &')[0].trim();
               const matchedKey = Object.keys(CMD_DETAILS)
                                  .sort((k1, k2) => k2.length - k1.length)
                                  .find(k => a.cmd.includes(k) || k.includes(aCmdBase));
               if (matchedKey) expanded = CMD_DETAILS[matchedKey];
           }
           if (expanded) {
               let match = expanded.match(/<ul[^>]*>([\\s\\S]*?)<\\/ul>$/);
               if (match) {
                   html += match[1];
               } else {
                   html += `<li><span class="badge badge-sys" style="margin-right: 6px;">CMD</span><span style="color: var(--c-cmd);">${a.cmd}</span></li>`;
               }
           } else {
               let badge = a.cmd.startsWith('ros2 launch') ? `<span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);">` : `<span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">`;
               let term = a.cmd.split(' ').slice(2).join(' ') || a.cmd;
               if (a.cmd.includes('http.server')) {
                   badge = `<span class="badge badge-server" style="margin-right: 6px;"><i class="fa-solid fa-server" style="margin-right: 4px;"></i>SERVER</span><span style="color: var(--c-cmd);">`;
                   term = "robot_control_web_ui";
               }
               html += `<li>${badge} ${term}</span> <span style="float: right; opacity: 0.7;">(${a.title})</span></li>`;
           }
       });
       html += `</ul>`;
       return html;
    }"""

new_func = """    function buildExpandedTooltip(actions) {
       let html = `<ul style="padding-left: 16px; margin: 0; font-size: 11px; color: var(--mut); line-height: 1.4;">`;
       actions.forEach(a => {
           let subCmds = a.cmd.split(/(?:&&|&)/).map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('sleep') && !s.startsWith('wait'));
           subCmds.forEach(subCmd => {
               let expanded = CMD_DETAILS[subCmd];
               if (!expanded) {
                   const matchedKey = Object.keys(CMD_DETAILS)
                                      .sort((k1, k2) => k2.length - k1.length)
                                      .find(k => subCmd.includes(k));
                   if (matchedKey) expanded = CMD_DETAILS[matchedKey];
               }
               
               if (expanded) {
                   let match = expanded.match(/<ul[^>]*>([\\s\\S]*?)<\\/ul>$/);
                   if (match) {
                       html += match[1];
                   } else {
                       html += `<li><span class="badge badge-sys" style="margin-right: 6px;">CMD</span><span style="color: var(--c-cmd);">${subCmd}</span></li>`;
                   }
               } else if (subCmd.startsWith('(google-chrome') || subCmd.startsWith('google-chrome')) {
                   html += `<li><span class="badge badge-server" style="margin-right: 6px;"><i class="fa-solid fa-globe"></i>WEB</span><span style="color: var(--c-cmd);"> Chrome Browser</span> <span style="float: right; opacity: 0.7;">(Frontend)</span></li>`;
               } else {
                   let badge = subCmd.startsWith('ros2 launch') ? `<span class="badge badge-launch" style="margin-right: 6px;"><i class="fa-solid fa-rocket" style="margin-right: 4px;"></i>LAUNCH</span><span style="color: var(--c-launch);">` : `<span class="badge badge-node" style="margin-right: 6px;"><svg viewBox="0 0 100 100" style="width:10px;height:10px;margin-right:4px;vertical-align:-0.15em;" fill="currentColor"><g stroke="currentColor" stroke-width="8"><line x1="61.3" y1="38.7" x2="80" y2="20"/><line x1="39.7" y1="37.7" x2="25" y2="20"/><line x1="34" y1="50" x2="15" y2="50"/><line x1="50" y1="66" x2="50" y2="85"/></g><circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="8"/><circle cx="80" cy="20" r="11" fill="currentColor"/><circle cx="25" cy="20" r="11" fill="currentColor"/><circle cx="15" cy="50" r="11" fill="currentColor"/><circle cx="50" cy="85" r="11" fill="currentColor"/></svg> NODE</span><span style="color: var(--c-node);">`;
                   let term = subCmd.split(' ').slice(2).join(' ') || subCmd;
                   if (subCmd.includes('http.server')) {
                       badge = `<span class="badge badge-server" style="margin-right: 6px;"><i class="fa-solid fa-server" style="margin-right: 4px;"></i>SERVER</span><span style="color: var(--c-cmd);">`;
                       term = "robot_control_web_ui";
                   }
                   // Use a.title if there's only 1 subCmd, otherwise we don't have a specific title.
                   let lbl = subCmds.length === 1 ? a.title : term;
                   html += `<li>${badge} ${term}</span> <span style="float: right; opacity: 0.7;">(${lbl})</span></li>`;
               }
           });
       });
       html += `</ul>`;
       return html;
    }"""

if old_func in content:
    content = content.replace(old_func, new_func)
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced buildExpandedTooltip successfully.")
else:
    print("Could not find buildExpandedTooltip block!")
