const fs = require('fs');

let chatCode = fs.readFileSync('src/components/AITeacherChat.tsx', 'utf8');
chatCode = chatCode.replace(/bottom-16/g, 'bottom-20');
chatCode = chatCode.replace(/bottom-6/g, 'bottom-20'); // in case it was still bottom-6 anywhere
fs.writeFileSync('src/components/AITeacherChat.tsx', chatCode);

let audioCode = fs.readFileSync('src/components/BackgroundAudio.tsx', 'utf8');
audioCode = audioCode.replace(/top-6/g, 'bottom-[160px]');
fs.writeFileSync('src/components/BackgroundAudio.tsx', audioCode);

