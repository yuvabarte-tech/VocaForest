const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'style={{ backgroundImage: "url(\'https://i.ibb.co/21y2yhC3/forest.png\')" }}',
  'style={{ backgroundImage: role !== null ? "url(\'https://i.ibb.co/21y2yhC3/forest.png\')" : "none" }}'
);

code = code.replace(
  'fs: 0',
  'fs: 0,\n                  playsinline: 1,\n                  autoplay: 1,\n                  mute: 1'
);

fs.writeFileSync('src/App.tsx', code);
