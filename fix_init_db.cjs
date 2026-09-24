const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldCode = `    const defaultPasswordHash = hashPassword("vocaforest123");
    Object.keys(finalData.students).forEach((uname) => {
      const s = finalData.students[uname];
      if (!s.passwordHash) s.passwordHash = defaultPasswordHash;
      if (s.xp === undefined) s.xp = 0;
      if (s.level === undefined) s.level = 1;
      if (s.quizAttempts === undefined) s.quizAttempts = 0;
      if (s.correctAnswers === undefined) s.correctAnswers = 0;
      if (s.incorrectAnswers === undefined) s.incorrectAnswers = 0;
    });
  }

  saveDbLocal(finalData);
  await syncToFirestore(finalData);
}`;

const newCode = `    const defaultPasswordHash = hashPassword("vocaforest123");
    Object.keys(finalData.students).forEach((uname) => {
      const s = finalData.students[uname];
      if (!s.passwordHash) s.passwordHash = defaultPasswordHash;
      if (s.xp === undefined) s.xp = 0;
      if (s.level === undefined) s.level = 1;
      if (s.quizAttempts === undefined) s.quizAttempts = 0;
      if (s.correctAnswers === undefined) s.correctAnswers = 0;
      if (s.incorrectAnswers === undefined) s.incorrectAnswers = 0;
    });
  }

  // Set the in-memory authoritative db
  memDb = finalData;
  saveDbLocal(memDb);
  await syncToFirestore();
}`;

code = code.replace(oldCode, newCode);

fs.writeFileSync('server.ts', code);
console.log("Fixed asyncInitDatabase remainder");
