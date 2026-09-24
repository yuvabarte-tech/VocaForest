const fs = require('fs');
let code = fs.readFileSync('src/components/TeacherDashboard.tsx', 'utf8');

// Add a state for selectedStudent
code = code.replace(
  "const [activeTab, setActiveTab] = useState<'overview' | 'student_progress' | 'add_words' | 'assign_board' | 'points' | 'certificates' | 'add_student'>('overview');",
  "const [activeTab, setActiveTab] = useState<'overview' | 'student_progress' | 'add_words' | 'assign_board' | 'points' | 'certificates' | 'add_student'>('overview');\n  const [selectedStudent, setSelectedStudent] = useState<any>(null);"
);

// We need to import StudentProfile
code = code.replace(
  "import {",
  "import StudentProfile from './StudentProfile';\nimport {"
);

// We also need to fetch all students, but the leaderboard has them.
// Let's replace the content of activeTab === 'student_progress'

const oldProgressTab = /\{activeTab === 'student_progress' && \([\s\S]*?^      \{activeTab === 'add_words'/m;
const newProgressTab = `      {activeTab === 'student_progress' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 border-4 border-emerald-100 bg-white/95">
            <h3 className="font-display text-2xl text-emerald-800 font-bold mb-4">Student Progress Profiles</h3>
            
            {selectedStudent ? (
              <div>
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="mb-4 text-emerald-700 font-bold hover:text-emerald-500 transition-colors flex items-center gap-2"
                >
                  ← Back to Student List
                </button>
                <div className="border-4 border-emerald-200 rounded-3xl overflow-hidden shadow-lg relative bg-slate-50">
                  <div className="pointer-events-none">
                    <StudentProfile student={selectedStudent} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-emerald-200 bg-emerald-50 text-emerald-900 font-bold">
                      <th className="p-4 rounded-tl-xl">Student Name</th>
                      <th className="p-4">Username</th>
                      <th className="p-4">Level</th>
                      <th className="p-4 rounded-tr-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.leaderboard?.map((student: any, idx: number) => (
                      <tr key={student.username} className={\`border-b border-emerald-100 hover:bg-emerald-50/50 transition-colors \${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}\`}>
                        <td className="p-4 font-bold text-gray-800">{student.fullName}</td>
                        <td className="p-4 text-gray-600">@{student.username}</td>
                        <td className="p-4 text-emerald-700 font-bold">Lvl {student.level} ({student.xp} XP)</td>
                        <td className="p-4">
                          <button 
                            onClick={() => setSelectedStudent(student)}
                            className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-sm"
                          >
                            View Progress Card
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'add_words'`;

code = code.replace(oldProgressTab, newProgressTab);

fs.writeFileSync('src/components/TeacherDashboard.tsx', code);
