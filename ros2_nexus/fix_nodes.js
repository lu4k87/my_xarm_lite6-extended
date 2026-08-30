const fs = require('fs');
const file = '/home/mk/dev_ws/ros2_nexus/ros2_nexus_script.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /("ros2 run [^"]+": `)(.*?)(`)/g;

content = content.replace(regex, (match, p1, p2, p3) => {
    // p2 is the HTML content.
    // We want to remove the inner <ul ...> ... </ul> completely.
    // The inner ul always starts with <ul style="padding-left: 14px;
    let newHtml = p2.replace(/<ul style="padding-left: 14px;[^>]*>.*?<\/ul>/, '');
    
    // Also, if the command is web_video_server, replace web_video_server.cpp with web_video_server
    if (p1.includes('web_video_server')) {
        newHtml = newHtml.replace(/web_video_server\.cpp/g, 'web_video_server');
    }
    
    return p1 + newHtml + p3;
});

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed node action cards.');
