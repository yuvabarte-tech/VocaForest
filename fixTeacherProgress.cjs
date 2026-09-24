const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherDashboard.tsx', 'utf8');

code = code.replace('<div className="pointer-events-none">', '<div className="pointer-events-auto">');

fs.writeFileSync('src/components/TeacherDashboard.tsx', code);
