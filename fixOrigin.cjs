const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace('fs: 0,', 'fs: 0,\n                  origin: window.location.origin,');
fs.writeFileSync('src/App.tsx', appCode);

let audioCode = fs.readFileSync('src/components/BackgroundAudio.tsx', 'utf8');
audioCode = audioCode.replace('controls: 0,', 'controls: 0,\n                origin: window.location.origin,');
fs.writeFileSync('src/components/BackgroundAudio.tsx', audioCode);

