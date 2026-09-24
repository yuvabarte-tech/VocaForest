const fs = require('fs');
let code = fs.readFileSync('src/components/FieldMission.tsx', 'utf8');

// Add gameModes
code = code.replace(
  "const [gameMode, setGameMode] = useState<'match' | 'unscramble' | 'bonus' | 'listen' | null>(null);",
  "const [gameMode, setGameMode] = useState<'match' | 'unscramble' | 'bonus' | 'listen' | 'spelling' | 'connections' | 'writing' | 'reading' | null>(null);"
);

// Add skillCategoryMap
code = code.replace(
  "const handleAnswer = async (selection: string | null, correct: boolean) => {",
  `const handleAnswer = async (selection: string | null, correct: boolean) => {
    const skillCategoryMap: Record<string, string> = {
      'match': 'memory',
      'unscramble': 'memory',
      'bonus': 'memory',
      'listen': 'listening',
      'spelling': 'spelling',
      'connections': 'connections',
      'writing': 'writing',
      'reading': 'reading'
    };
    const skillCategory = skillCategoryMap[gameMode || 'match'];
`
);

// Add skillCategory to fetch body
code = code.replace(
  "wordCode: targetWord?.code,",
  "wordCode: targetWord?.code,\n              skillCategory,"
);

fs.writeFileSync('src/components/FieldMission.tsx', code);
