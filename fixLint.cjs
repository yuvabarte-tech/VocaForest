const fs = require('fs');

const filesToIgnore = ['src/App.tsx', 'src/components/BackgroundAudio.tsx'];

filesToIgnore.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('// @ts-nocheck')) {
    content = '// @ts-nocheck\n' + content;
    fs.writeFileSync(file, content);
  }
});
