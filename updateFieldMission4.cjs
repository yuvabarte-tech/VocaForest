const fs = require('fs');
let code = fs.readFileSync('src/components/FieldMission.tsx', 'utf8');

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

code = code.replace('          {/* Feedback & Proceed Control */}', newRenders + '\n          {/* Feedback & Proceed Control */}');

fs.writeFileSync('src/components/FieldMission.tsx', code);
