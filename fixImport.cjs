const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace("import ReactPlayer from 'react-player/youtube';", "import ReactPlayer from 'react-player';");
fs.writeFileSync('src/App.tsx', appCode);

let audioCode = fs.readFileSync('src/components/BackgroundAudio.tsx', 'utf8');
audioCode = audioCode.replace("import ReactPlayer from 'react-player/youtube';", "import ReactPlayer from 'react-player';");
fs.writeFileSync('src/components/BackgroundAudio.tsx', audioCode);
