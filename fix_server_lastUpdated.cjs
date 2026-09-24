const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// We will replace `saveDb(db);` with `if (typeof student !== 'undefined' && student) student.lastUpdated = Date.now(); saveDb(db);`
// Wait, some places use `student` as a variable name.

code = code.replace(/saveDb\(db\);/g, `if (typeof student !== 'undefined' && student) { student.lastUpdated = Date.now(); }\n  saveDb(db);`);

fs.writeFileSync('server.ts', code);
console.log("lastUpdated injected.");
