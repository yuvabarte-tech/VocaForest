const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'style={{ backgroundImage: role !== null ? "url(\'https://i.ibb.co/21y2yhC3/forest.png\')" : "none" }}',
  'style={{ backgroundImage: "url(\'https://i.ibb.co/21y2yhC3/forest.png\')" }}'
);

code = code.replace(
  'width="100vw"\n            height="100vh"',
  'width="100%"\n            height="100%"'
);

code = code.replace(
  'style={{ transform: \'scale(1.5)\' }}',
  'style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) scale(1.5)", pointerEvents: "none" }}'
);

fs.writeFileSync('src/App.tsx', code);
