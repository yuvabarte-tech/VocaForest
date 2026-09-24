const fs = require('fs');
let code = fs.readFileSync('src/components/AITeacherChat.tsx', 'utf8');

code = code.replace(/bottom-6/g, 'bottom-16');

fs.writeFileSync('src/components/AITeacherChat.tsx', code);
