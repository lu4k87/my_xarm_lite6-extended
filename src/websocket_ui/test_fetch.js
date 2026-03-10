const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('/home/mk1/dev_ws/src/websocket_ui/dashboard_index.html', 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;

const sections = document.querySelectorAll('section[data-view]');
console.log(`Found ${sections.length} views to load.`);
sections.forEach(s => console.log(s.id, s.getAttribute('data-view')));

