const fs = require('fs');
let code = fs.readFileSync('src/components/DailyMission.tsx', 'utf8');

const replacement = `
  const dateStr = new Date().toISOString().split('T')[0];
  const dayIndex = new Date(dateStr).getDay(); // 0 = Sunday, 1 = Monday...
  
  // Games mapping: 1->listen, 2->match/unscramble, 3->spelling, 4->connections, 5->writing, 6->reading
  const dailyGameRotation = [
    { mode: 'listen', name: 'Listen & Write Game', key: 'listening' },
    { mode: 'unscramble', name: 'Memory Game (Match/Unscramble)', key: 'memory' },
    { mode: 'spelling', name: 'Spelling Bee Game', key: 'spelling' },
    { mode: 'connections', name: 'Connections Game', key: 'connections' },
    { mode: 'writing', name: 'Writing AI Game', key: 'writing' },
    { mode: 'reading', name: 'Reading Comprehension Game', key: 'reading' }
  ];

  const currentDailyGame = dailyGameRotation[dayIndex % 6];

  const [missions, setMissions] = useState([
    { id: 1, title: \`Play the \${currentDailyGame.name}\`, xpReward: 50, completed: (student.skills?.[currentDailyGame.key] || 0) >= 1 },
    { id: 2, title: 'Complete 2 Quizzes', xpReward: 50, completed: student.quizAttempts >= 2 },
    { id: 3, title: 'Reach 100% Accuracy in a Session', xpReward: 30, completed: student.correctAnswers > 0 && student.correctAnswers === student.quizAttempts },
    { id: 4, title: 'Add 1 Word to Personal Journal', xpReward: 40, completed: (student.journalEntries && student.journalEntries.length > 0) }
  ]);
`;

code = code.replace(
  /const \[missions, setMissions\] = useState\(\[\s*\{[\s\S]*?\]\);/,
  replacement
);

fs.writeFileSync('src/components/DailyMission.tsx', code);
