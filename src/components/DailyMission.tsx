import React, { useState } from 'react';
import { CheckCircle, Target, Zap, Clock } from 'lucide-react';

interface DailyMissionProps {
  student: any;
  onUpdateStudent: (s: any) => void;
}

export default function DailyMission({ student, onUpdateStudent }: DailyMissionProps) {
  // Use a hardcoded set of missions for this demo.
  // In a real app, this would be tied to the current date and user state.
  
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
    { id: 1, title: `Play the ${currentDailyGame.name}`, xpReward: 50, completed: (student.skills?.[currentDailyGame.key] || 0) >= 1 },
    { id: 2, title: 'Complete 2 Quizzes', xpReward: 50, completed: student.quizAttempts >= 2 },
    { id: 3, title: 'Reach 100% Accuracy in a Session', xpReward: 30, completed: student.correctAnswers > 0 && student.correctAnswers === student.quizAttempts },
    { id: 4, title: 'Add 1 Word to Personal Journal', xpReward: 40, completed: (student.journalEntries && student.journalEntries.length > 0) }
  ]);


  const [claimedIds, setClaimedIds] = useState<number[]>([]);

  const handleClaim = async (id: number, reward: number) => {
    if (claimedIds.includes(id)) return;
    
    try {
      const response = await fetch('/api/student/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: student.username, 
          xpGained: reward
        })
      });

      if (response.ok) {
        const data = await response.json();
        onUpdateStudent(data.student);
        setClaimedIds(prev => [...prev, id]);
      }
    } catch (e) {
      console.error("Failed to claim reward", e);
    }
  };

  const progress = missions.filter(m => m.completed).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4">
      <div className="glass-panel p-8 border-4 border-emerald-300 bg-white/95">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <span className="text-5xl drop-shadow-md">🚀</span>
            <div>
              <h2 className="font-display text-3xl text-emerald-900 font-bold tracking-tight">Daily Missions</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Complete tasks every day to earn bonus XP!</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border-2 border-emerald-100 shadow-inner">
            <Clock className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-800 font-bold font-display">Resets in 12h 45m</span>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">
            <span>Daily Progress</span>
            <span className="text-emerald-600">{progress} / {missions.length}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 border border-gray-200 overflow-hidden">
            <div 
              className="bg-emerald-500 h-3 transition-all duration-1000 ease-out"
              style={{ width: `${(progress / missions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-4">
          {missions.map((mission) => {
            const isClaimed = claimedIds.includes(mission.id);
            return (
              <div key={mission.id} className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${isClaimed ? 'bg-gray-50 border-gray-200 opacity-60' : mission.completed ? 'bg-emerald-50 border-emerald-300 shadow-md' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isClaimed ? 'bg-gray-200 text-gray-400' : mission.completed ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {isClaimed ? <CheckCircle className="w-6 h-6" /> : mission.completed ? <CheckCircle className="w-6 h-6 animate-pulse" /> : <Target className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className={`font-display text-lg font-bold ${isClaimed ? 'text-gray-500 line-through' : 'text-slate-800'}`}>{mission.title}</h3>
                    <p className="text-xs text-emerald-600 font-bold flex items-center gap-1 mt-1 uppercase tracking-widest">
                      <Zap className="w-3 h-3" /> +{mission.xpReward} XP Reward
                    </p>
                  </div>
                </div>

                <div className="ml-4 shrink-0">
                  {isClaimed ? (
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 py-2 bg-gray-100 rounded-xl">Claimed</span>
                  ) : mission.completed ? (
                    <button 
                      onClick={() => handleClaim(mission.id, mission.xpReward)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-2.5 rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.4)] hover:-translate-y-0.5 transition-all outline-none"
                    >
                      Claim XP!
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-4 py-2 border-2 border-gray-100 rounded-xl">Incomplete</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
