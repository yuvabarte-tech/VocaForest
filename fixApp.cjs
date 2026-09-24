const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const mainDiv = '<div className="relative w-full h-screen overflow-hidden font-body flex bg-[#122614] bg-cover bg-center" style={{ backgroundImage: "url(\'https://i.ibb.co/21y2yhC3/forest.png\')" }}>';

const studentFeatures = `
      {role === 'student' && student && (
        <>
          <BackgroundAudio />
          <AITeacherChat student={student} />
        </>
      )}
`;

if (code.includes(mainDiv) && !code.includes('<BackgroundAudio />')) {
  code = code.replace(mainDiv, mainDiv + '\n' + studentFeatures);
}

// Update trademark footer
code = code.replace(
  '<span>© 2026 Created by: <strong>yuvabarte arun arumugam</strong></span>',
  '<span>© 2026 Created by: <strong>YUVABARTE ARUN ARUMUGAM</strong></span>'
);

// Remove the old footer
const oldFooterRegex = /<footer className="relative z-10 px-6 py-3 bg-black\/40 backdrop-blur-xl border-t border-white\/10 flex justify-between items-center text-white\/70 select-none">[\s\S]*?<\/footer>/;
code = code.replace(oldFooterRegex, '');

fs.writeFileSync('src/App.tsx', code);
