const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newImports = `
import AITeacherChat from './components/AITeacherChat';
import BackgroundAudio from './components/BackgroundAudio';
`;
code = code.replace("import StudentProfile from \"./components/StudentProfile\";", "import StudentProfile from \"./components/StudentProfile\";\n" + newImports);


// Add the footer at the very end of the <div className="min-h-screen bg-slate-50 font-body relative overflow-hidden">
const footerHtml = `
      {/* Trademark / Created By */}
      <div className="fixed bottom-0 left-0 w-full p-2 bg-black/80 text-white text-center text-xs flex justify-center items-center gap-2 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
        <span>© 2026 Created by: <strong>yuvabarte arun arumugam</strong></span>
        <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-[8px] font-bold">TM</div>
      </div>
`;

code = code.replace(/<\/div>\n  \);\n\}\n$/, footerHtml + '\n    </div>\n  );\n}\n');

// Add BackgroundAudio and AITeacherChat for students
const studentFeatures = `
      {role === 'student' && student && (
        <>
          <BackgroundAudio />
          <AITeacherChat student={student} />
        </>
      )}
`;

// Insert it right after <div className="min-h-screen bg-slate-50 font-body relative overflow-hidden">
code = code.replace('<div className="min-h-screen bg-slate-50 font-body relative overflow-hidden">', '<div className="min-h-screen bg-slate-50 font-body relative overflow-hidden">\n' + studentFeatures);

fs.writeFileSync('src/App.tsx', code);
