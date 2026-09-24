const fs = require('fs');
let code = fs.readFileSync('src/components/BackgroundAudio.tsx', 'utf8');

code = code.replace('autoplay: 0,', 'autoplay: 1,');

fs.writeFileSync('src/components/BackgroundAudio.tsx', code);
