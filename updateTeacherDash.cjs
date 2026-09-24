const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherDashboard.tsx', 'utf8');

// Add activeTab type
code = code.replace(
  "const [activeTab, setActiveTab] = useState<'overview' | 'add_words' | 'assign_board' | 'points' | 'certificates' | 'add_student'>('overview');",
  "const [activeTab, setActiveTab] = useState<'overview' | 'student_progress' | 'add_words' | 'assign_board' | 'points' | 'certificates' | 'add_student'>('overview');"
);

const newSidebarBtn = `
            <button onClick={() => setActiveTab('student_progress')} className={\`px-5 py-4 rounded-2xl font-display font-bold text-sm flex items-center gap-3 transition-all \${activeTab === 'student_progress' ? 'bg-emerald-500 text-white shadow-md' : 'bg-transparent text-emerald-900 hover:bg-emerald-50'}\`}>
              <UserPlus className="w-5 h-5" /> Student Progress
            </button>
`;

code = code.replace(
  '<LayoutDashboard className="w-5 h-5" /> Controls & Analytics\n            </button>',
  '<LayoutDashboard className="w-5 h-5" /> Controls & Analytics\n            </button>\n' + newSidebarBtn
);

// Add the new tab content
const newTabContent = `
      {activeTab === 'student_progress' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 border-4 border-emerald-100 bg-white/95">
            <h3 className="font-display text-2xl text-emerald-800 font-bold mb-4">Student Progress Profiles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics?.leaderboard?.map((student: any) => (
                <div key={student.username} className="bg-emerald-50 p-4 rounded-xl border-2 border-emerald-200">
                  <h4 className="font-bold text-emerald-900 text-lg mb-2">{student.fullName} (@{student.username})</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Level:</strong> {student.level} ({student.xp} XP)</p>
                    <p><strong>Quizzes:</strong> {student.correctAnswers} / {student.quizAttempts} correct</p>
                    {student.skills && (
                      <div className="mt-2">
                        <p className="font-semibold text-emerald-800 border-b border-emerald-200 pb-1 mb-1">Skills Performance:</p>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                          {Object.entries(student.skills).map(([skill, count]) => (
                            <span key={skill} className="capitalize">
                              {skill}: <strong className="text-emerald-700">{count as number}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(
  "{activeTab === 'add_words' && (",
  newTabContent + "\n      {activeTab === 'add_words' && ("
);

fs.writeFileSync('src/components/TeacherDashboard.tsx', code);
