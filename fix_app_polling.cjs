const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the polling logic
const oldPollLogic = `// If the local state is currently ahead of the fetched server state (race condition during API save),
              // we ignore the stale server state. Otherwise, the server state is newer, so we accept it entirely!
              if (prevStudent.xp > data.xp) {
                 return prevStudent;
              }`;

const newPollLogic = `// Use lastUpdated timestamp to prevent stale server responses from overwriting new local saves!
              if (prevStudent.lastUpdated && data.lastUpdated && prevStudent.lastUpdated > data.lastUpdated) {
                 return prevStudent;
              }`;

code = code.replace(oldPollLogic, newPollLogic);

// Remove the localStorage useEffect
const localStorageSave = `  // Persist student progress to localStorage so it is never lost on refresh/re-login/container restart
  useEffect(() => {
    if (student && student.username) {
      localStorage.setItem(\`student_progress_\${student.username.toLowerCase().trim()}\`, JSON.stringify(student));
    }
  }, [student]);`;

code = code.replace(localStorageSave, '');

fs.writeFileSync('src/App.tsx', code);
console.log("App.tsx modified successfully.");
