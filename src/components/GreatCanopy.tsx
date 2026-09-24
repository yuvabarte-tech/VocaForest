import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Award, Droplet, Sun, Zap, Lock, Unlock } from 'lucide-react';

interface GreatCanopyProps {
  student?: any;
  onUpdateStudent?: (s: any) => void;
  isTeacher?: boolean;
}

export default function GreatCanopy({ student, onUpdateStudent, isTeacher = false }: GreatCanopyProps) {
  const [canopy, setCanopy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [watering, setWatering] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [teacherJoined, setTeacherJoined] = useState(false);

  const fetchCanopy = async () => {
    try {
      const response = await fetch('/api/classroom/canopy');
      if (response.ok) {
        const data = await response.json();
        setCanopy(data);
      }
    } catch (e) {
      console.error("Failed to load classroom canopy:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCanopy();
  }, []);

  const handleWaterCanopy = async () => {
    if (watering) return;
    setWatering(true);
    
    try {
      if (isTeacher) {
        // Teacher water action is purely celebratory and triggers a gorgeous visual golden sprinkle
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
        await fetchCanopy();
      } else if (student && onUpdateStudent) {
        const response = await fetch('/api/student/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: student.username,
            xpGained: 15 // Gives the canopy and student some quick XP!
          })
        });

        if (response.ok) {
          const data = await response.json();
          onUpdateStudent(data.student);
          await fetchCanopy();
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }
      }
    } catch (e) {
      console.error("Failed to water Canopy", e);
    } finally {
      setWatering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-bold font-display text-sm">Sunlight feeding the Great Canopy...</p>
      </div>
    );
  }

  const { totalXP = 0, canopyLevel = 1, nextLevelXP = 800, milestones = [], participants = [] } = canopy || {};
  const currentLevelProgress = totalXP % 800;
  const progressPercent = Math.min(100, (currentLevelProgress / 800) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4">
      {/* Introduction Card */}
      <div className="glass-panel p-8 border-4 border-emerald-400 bg-white/95 text-center relative overflow-hidden">
        {/* Decorative background sun rays */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-radial from-yellow-100/40 to-transparent pointer-events-none z-0" />
        
        <div className="relative z-10">
          <span className="text-6xl drop-shadow-lg inline-block animate-bounce mb-3">🌳</span>
          <h2 className="font-display text-4xl text-emerald-900 font-black tracking-tight">The Great Canopy</h2>
          <p className="text-sm text-emerald-700 font-semibold max-w-xl mx-auto mt-2">
            {isTeacher 
              ? "Welcome, Teacher! Your dynamic classroom dashboard tracks and visualizes the collective efforts of your students. Gather here to watch VocaForest grow!"
              : "The heart of VocaForest. Every single point of XP earned by any student in the roster acts as water and sunlight to grow this giant cooperative tree! Together we rise!"}
          </p>
        </div>

        {/* Dynamic Big Tree Display */}
        <div className="relative h-[280px] w-full flex items-end justify-center my-8 z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={`canopy-tree-${canopyLevel}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 60 }}
              className="relative"
            >
              {/* Dynamic Canopy Level SVGs */}
              <svg width="220" height="260" viewBox="0 0 220 260" fill="none">
                {/* Trunk */}
                <path d="M100 170 C100 170, 85 240, 70 250 H150 C135 240, 120 170, 120 170 Z" fill="#5c2d17" />
                <path d="M100 120 L100 180 L120 180 L120 110 Z" fill="#78350f" />
                <path d="M85 130 C95 140, 100 160, 100 160" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />
                <path d="M135 115 C125 125, 120 150, 120 150" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />

                {/* Leaves Layer - Shifts based on level */}
                {canopyLevel >= 1 && (
                  <circle cx="110" cy="110" r="45" fill={canopyLevel >= 5 ? "#eab308" : canopyLevel >= 3 ? "#8b5cf6" : "#10b981"} opacity="0.85" />
                )}
                {canopyLevel >= 2 && (
                  <>
                    <circle cx="80" cy="90" r="35" fill={canopyLevel >= 5 ? "#ca8a04" : canopyLevel >= 3 ? "#a855f7" : "#059669"} opacity="0.9" />
                    <circle cx="140" cy="95" r="38" fill={canopyLevel >= 5 ? "#facc15" : canopyLevel >= 3 ? "#6366f1" : "#34d399"} opacity="0.85" />
                  </>
                )}
                {canopyLevel >= 3 && (
                  <>
                    <circle cx="110" cy="65" r="40" fill={canopyLevel >= 5 ? "#fef08a" : canopyLevel >= 3 ? "#ec4899" : "#6ee7b7"} opacity="0.9" />
                    {/* Glowing spores overlay */}
                    <circle cx="110" cy="80" r="5" fill="#fff" className="animate-ping" />
                    <circle cx="80" cy="100" r="3" fill="#fff" className="animate-ping" />
                    <circle cx="140" cy="110" r="4" fill="#fff" className="animate-ping" />
                  </>
                )}
                {canopyLevel >= 4 && (
                  <>
                    {/* Tiny Treehouse */}
                    <rect x="95" y="140" width="30" height="24" rx="4" fill="#a16207" stroke="#451a03" strokeWidth="2" />
                    <polygon points="90,140 110,125 130,140" fill="#ea580c" />
                    <rect x="107" y="150" width="6" height="14" fill="#fef08a" />
                  </>
                )}
                {canopyLevel >= 5 && (
                  /* Prismatic Double Rainbow overlay behind tree */
                  <path d="M20 220 Q110 30 200 220" fill="none" stroke="#f472b6" strokeWidth="6" strokeDasharray="3 3" />
                )}
              </svg>

              {/* Watering Ripple animation */}
              {watering && (
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 1 }}
                  className="absolute inset-0 bg-sky-400/30 rounded-full z-0"
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Floating water droplet animation */}
          {showCelebration && (
            <motion.div
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: -150, opacity: 0 }}
              className="absolute text-sky-500 font-extrabold text-sm flex items-center justify-center gap-1 z-25"
            >
              {isTeacher ? (
                <div className="bg-amber-500 text-white border-2 border-amber-300 font-display text-xs font-black px-4 py-2 rounded-2xl shadow-lg flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-white animate-spin" />
                  <span>Teacher Yuva sprinkled Golden Blessings! ✨</span>
                </div>
              ) : (
                <div className="bg-sky-500 text-white border-2 border-sky-300 font-display text-xs font-black px-4 py-2 rounded-2xl shadow-lg flex items-center gap-1.5">
                  <Droplet className="w-4 h-4 text-white animate-bounce" />
                  <span>Water & Sunlight Boosted! +15 XP 💦</span>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Global Progress Bar */}
        <div className="max-w-xl mx-auto bg-slate-50 border-2 border-emerald-100 p-6 rounded-3xl shadow-inner relative z-10">
          <div className="flex items-center justify-between font-display mb-2 text-sm text-slate-700">
            <span className="font-bold flex items-center gap-1.5 text-emerald-800">
              <Sparkles className="w-4 h-4 text-emerald-500 animate-spin" /> Classroom Canopy Level {canopyLevel}
            </span>
            <span className="font-bold text-gray-500">{totalXP} XP / {nextLevelXP} XP</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden border border-gray-300">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-sky-400 h-4 transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-[11px] text-gray-500 font-semibold mt-2.5">
            Your class needs <span className="text-emerald-600 font-bold">{nextLevelXP - totalXP} more XP</span> to trigger the next milestone evolution!
          </p>

          {/* Water the tree trigger */}
          <button
            onClick={handleWaterCanopy}
            disabled={watering}
            className="mt-5 w-full bg-sky-500 hover:bg-sky-400 text-white font-bold py-3.5 px-6 rounded-2xl shadow-[0_4px_14px_rgba(14,165,233,0.4)] flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 outline-none cursor-pointer"
          >
            {isTeacher ? (
              <>
                <Sparkles className="w-5 h-5 text-amber-200 animate-spin" />
                {watering ? 'Sprinkling Blessings...' : 'Pour Golden Dew (Teacher Blessing)'}
              </>
            ) : (
              <>
                <Droplet className="w-5 h-5 animate-bounce" />
                {watering ? 'Watering...' : 'Water & Sunlight Boost (+15 XP)'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Classroom Milestones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 border-2 border-emerald-200 bg-white/95">
          <h3 className="font-display text-xl text-emerald-900 font-bold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" /> Cooperative Milestone Unlockables
          </h3>
          <div className="space-y-4">
            {milestones.map((m: any) => (
              <div 
                key={m.level} 
                className={`p-4 rounded-2xl border-2 flex items-start gap-3.5 transition-all ${
                  m.unlocked 
                    ? 'bg-emerald-50 border-emerald-300 shadow-sm' 
                    : 'bg-gray-50 border-gray-100 opacity-60'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  m.unlocked ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  {m.unlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    Level {m.level}: {m.name} 
                    {m.unlocked && <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase">Active</span>}
                  </h4>
                  <p className="text-xs text-gray-600 font-medium mt-1">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Forest Picnic Mode / Roster status */}
        <div className="glass-panel p-6 border-2 border-sky-200 bg-white/95 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-xl text-sky-900 font-bold mb-2 flex items-center gap-2">
              <span>🥪</span> Forest Picnic Gathering
            </h3>
            <p className="text-xs text-gray-500 font-medium mb-4">
              When Classroom Canopy Level 2 is reached, all student explorers assemble here under the cooling shadow of the leaves to share a honey pie picnic!
            </p>

            {canopyLevel >= 2 ? (
              <div className="bg-sky-50 rounded-2xl border border-sky-100 p-4 min-h-[200px] flex flex-col justify-center items-center text-center">
                <span className="text-4xl animate-bounce mb-3">🏕️🥧🪵</span>
                <h4 className="font-display text-sm font-bold text-sky-800">The Forest Picnic Is Open!</h4>
                <p className="text-[11px] text-gray-600 font-semibold max-w-xs mt-1 mb-4">
                  {isTeacher 
                    ? "Look at your wonderful class! Join them at the circle below." 
                    : "You are sitting with Hoppy, Nutty, and your classmate buddies. Learning is better together!"}
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {isTeacher && teacherJoined && (
                    <span className="bg-amber-500 text-white border-2 border-amber-300 font-black px-3 py-1.5 rounded-2xl shadow-md flex items-center gap-1.5 animate-pulse text-xs">
                      <span>🎓</span>
                      <span>Teacher Yuva (Joined Picnic!)</span>
                    </span>
                  )}
                  {participants && participants.length > 0 ? (
                    participants.map((p: any) => {
                      let avatarEmoji = '👶';
                      const lower = (p.avatar || '').toLowerCase();
                      if (lower.includes('explorer')) avatarEmoji = '👨‍🌾';
                      else if (lower.includes('ranger')) avatarEmoji = '🤠';
                      else if (lower.includes('wizard')) avatarEmoji = '🧙‍♂️';
                      else if (lower.includes('ninja')) avatarEmoji = '🥷';
                      else if (lower.includes('dino')) avatarEmoji = '🦖';
                      else if (lower.includes('astronaut')) avatarEmoji = '👨‍🚀';
                      else if (lower.includes('boy')) avatarEmoji = '🧒';

                      const shortName = p.fullName.split(' ')[0];
                      return (
                        <span key={p.username} className="bg-white border border-sky-200 text-sky-700 font-bold px-2.5 py-1 rounded-xl shadow-sm flex items-center gap-1 text-[11px] hover:scale-105 transition-all">
                          <span>{avatarEmoji}</span>
                          <span>{shortName}</span>
                          <span className="text-[9px] text-sky-400 font-medium">L1</span>
                        </span>
                      );
                    })
                  ) : (
                    <>
                      <span className="text-[10px] bg-white border border-sky-200 text-sky-700 font-bold px-2 py-1 rounded-lg">👨‍🌾 Alvin</span>
                      <span className="text-[10px] bg-white border border-sky-200 text-sky-700 font-bold px-2 py-1 rounded-lg">🧙‍♂️ Krishen</span>
                      <span className="text-[10px] bg-white border border-sky-200 text-sky-700 font-bold px-2 py-1 rounded-lg">🥷 Vihaan</span>
                      <span className="text-[10px] bg-white border border-sky-200 text-sky-700 font-bold px-2 py-1 rounded-lg">🦖 Rayyan</span>
                    </>
                  )}
                </div>
                {isTeacher && (
                  <button
                    onClick={() => setTeacherJoined(!teacherJoined)}
                    className={`mt-5 px-5 py-2.5 font-display text-xs font-bold rounded-2xl transition-all shadow-sm cursor-pointer ${
                      teacherJoined 
                        ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                        : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white animate-pulse'
                    }`}
                  >
                    {teacherJoined ? '🛑 Leave Picnic Circle' : '✨ Join Student Picnic Circle!'}
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-gray-100/50 rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
                <span className="text-4xl grayscale opacity-40">⛺</span>
                <h4 className="font-display text-sm font-bold text-gray-400 mt-2">Class Picnic Locked</h4>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  Reach Canopy Level 2 as a class to assemble the camp! Keep practicing vocabulary words to help.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex justify-between items-center text-xs font-bold text-slate-500">
              <span>ACTIVE GUARDIANS</span>
              <span className="text-emerald-600 font-mono">{participants?.length || 33} Students Contributing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
