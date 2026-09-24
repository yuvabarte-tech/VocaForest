const fs = require('fs');
let code = fs.readFileSync('src/components/BackgroundAudio.tsx', 'utf8');

code = code.replace('const [isPlaying, setIsPlaying] = useState(false);', 'const [isPlaying, setIsPlaying] = useState(true);');

fs.writeFileSync('src/components/BackgroundAudio.tsx', code);
