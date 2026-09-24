const fs = require('fs');
let code = fs.readFileSync('src/components/FieldMission.tsx', 'utf8');

const newButtons = `
              <button 
                onClick={() => setGameMode('spelling')}
                className="flex flex-col items-center p-6 bg-rose-50 border-2 border-rose-200 rounded-2xl hover:bg-rose-100 transition-all hover:scale-105 active:scale-95"
              >
                <span className="text-4xl mb-3">🐝</span>
                <span className="font-display font-bold text-rose-800">Spelling Bee</span>
              </button>

              <button 
                onClick={() => setGameMode('connections')}
                className="flex flex-col items-center p-6 bg-purple-50 border-2 border-purple-200 rounded-2xl hover:bg-purple-100 transition-all hover:scale-105 active:scale-95"
              >
                <span className="text-4xl mb-3">🔗</span>
                <span className="font-display font-bold text-purple-800">Connections</span>
              </button>

              <button 
                onClick={() => setGameMode('writing')}
                className="flex flex-col items-center p-6 bg-orange-50 border-2 border-orange-200 rounded-2xl hover:bg-orange-100 transition-all hover:scale-105 active:scale-95"
              >
                <span className="text-4xl mb-3">✍️</span>
                <span className="font-display font-bold text-orange-800">Writing AI</span>
              </button>

              <button 
                onClick={() => setGameMode('reading')}
                className="flex flex-col items-center p-6 bg-teal-50 border-2 border-teal-200 rounded-2xl hover:bg-teal-100 transition-all hover:scale-105 active:scale-95"
              >
                <span className="text-4xl mb-3">📖</span>
                <span className="font-display font-bold text-teal-800">Reading</span>
              </button>
            </div>`;

code = code.replace(/<\/button>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\)/, '</button>\n' + newButtons + '\n          </div>\n        </div>\n      )');

fs.writeFileSync('src/components/FieldMission.tsx', code);
