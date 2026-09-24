const fs = require('fs');
let code = fs.readFileSync('src/components/FieldMission.tsx', 'utf8');

const imports = `import GameSpellingBee from './GameSpellingBee';
import GameConnections from './GameConnections';
import GameWriting from './GameWriting';
import GameReading from './GameReading';
`;

code = imports + code;

const newRenders = `
            {gameMode === 'spelling' && targetWord && (
              <GameSpellingBee targetWord={targetWord} onAnswer={handleAnswer} disabled={hasAnswered} />
            )}
            
            {gameMode === 'connections' && (
              <GameConnections onAnswer={handleAnswer} disabled={hasAnswered} />
            )}

            {gameMode === 'writing' && targetWord && (
              <GameWriting targetWord={targetWord} onAnswer={handleAnswer} disabled={hasAnswered} />
            )}

            {gameMode === 'reading' && targetWord && (
              <GameReading targetWord={targetWord} onAnswer={handleAnswer} disabled={hasAnswered} />
            )}
`;

// Insert the renders before the "Next Mission" button logic block which starts near the end
code = code.replace('{/* Next button overlay if answered */}', newRenders + '\n            {/* Next button overlay if answered */}');

fs.writeFileSync('src/components/FieldMission.tsx', code);
