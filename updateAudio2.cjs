const fs = require('fs');
let code = fs.readFileSync('src/components/BackgroundAudio.tsx', 'utf8');

code = code.replace('https://upload.wikimedia.org/wikipedia/commons/5/5b/Forest_Ambience_-_Morning.ogg', 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Enchanted_Valley.ogg');

fs.writeFileSync('src/components/BackgroundAudio.tsx', code);
