const fs = require('fs');

// We need to mock window
global.window = {};

// Load content.jsx to get GENERATORS and ACHIEVEMENTS
const contentSrc = fs.readFileSync('/Users/jaimearias/ToothClicker/content.jsx', 'utf8');
// remove React/Babel syntax, it's mostly JS. We'll extract only what we need.
// Better: evaluate it in a context or just let's run a node script that loads it.
