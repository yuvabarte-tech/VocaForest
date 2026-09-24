import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Zap, Award, ChevronRight, Gift } from 'lucide-react';

interface VocaPetProps {
  student: any;
  onUpdateStudent: (s: any) => void;
}

export default function VocaPet({ student, onUpdateStudent }: VocaPetProps) {
  const [petType, setPetType] = useState<'firefly' | 'fox' | 'guardian' | null>(null);
  const [petName, setPetName] = useState('');
  const [feeding, setFeeding] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Adopt your new pet seed
  const handleAdopt = async () => {
    if (!petType || !petName.trim()) {
      setFeedback("Please choose a seed type and give your pet a magical name!");
      return;
    }
    try {
      const response = await fetch('/api/student/pet/adopt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: student.username,
          petType,
          petName: petName.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        onUpdateStudent(data.student);
        setFeedback(`Hooray! Your ${petType} seed is securely planted!`);
      }
    } catch (e) {
      console.error("Adoption failed:", e);
      setFeedback("Failed to plant seed. Please try again!");
    }
  };

  // Feed the pet
  const handleFeed = async () => {
    if (feeding) return;
    setFeeding(true);
    try {
      const response = await fetch('/api/student/pet/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: student.username })
      });

      if (response.ok) {
        const data = await response.json();
        onUpdateStudent(data.student);
        setFeedback(`${student.pet.name} gobbled up a sweet magic berry! +25 Pet XP!`);
        setTimeout(() => setFeedback(''), 3000);
      }
    } catch (e) {
      console.error("Feeding failed:", e);
    } finally {
      setFeeding(false);
    }
  };

  const getPetVisual = (type: string, level: number) => {
    if (level === 1) return { icon: '🌱', stage: 'Mystical Seed' };
    
    if (type === 'firefly') {
      if (level === 2) return { icon: '🐛', stage: 'Bioluminescent Larva' };
      if (level === 3) return { icon: '🐝', stage: 'Glowing Starfly' };
      return { icon: '🦋✨', stage: 'Celestial Starfly Deity' };
    }
    if (type === 'fox') {
      if (level === 2) return { icon: '🦊', stage: 'Leaf Fox Pup' };
      if (level === 3) return { icon: '🦊🍀', stage: 'Sprout Ranger Fox' };
      return { icon: '🦊👑✨', stage: 'Nine-Tailed Forest Emperor' };
    }
    // guardian
    if (level === 2) return { icon: '🪨', stage: 'Mossy Pebble' };
    if (level === 3) return { icon: '🤖', stage: 'Rune Golem' };
    return { icon: '🏔️✨', stage: 'Granite Earth Titan' };
  };

  const pet = student.pet;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4">
      <AnimatePresence mode="wait">
        {!pet ? (
          /* Adoption Stage (Feature 2) */
          <motion.div
            key="adopt-pet-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-panel p-8 border-4 border-emerald-300 bg-white/95 text-center"
          >
            <span className="text-6xl animate-bounce inline-block mb-2">🥚✨</span>
            <h2 className="font-display text-3xl text-emerald-900 font-bold tracking-tight">Adopt your Evolving Guardian</h2>
            <p className="text-sm text-gray-500 font-medium max-w-lg mx-auto mt-2">
              Before you study, adopt a tiny mystical forest seed that matches your learning style. It will hatch and evolve as you master vocabulary!
            </p>

            {/* Seed selection grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-8">
              <button
                onClick={() => setPetType('firefly')}
                className={`p-6 rounded-2xl border-2 text-center transition-all ${
                  petType === 'firefly' ? 'border-cyan-400 bg-cyan-50/50 shadow-md' : 'border-gray-100 hover:bg-slate-50 bg-white'
                }`}
              >
                <span className="text-4xl block mb-2">⚡</span>
                <h4 className="font-display font-bold text-cyan-800">Bioluminescent Seed</h4>
                <p className="text-[11px] text-gray-500 mt-1">For bright scholars who love typing games.</p>
              </button>

              <button
                onClick={() => setPetType('fox')}
                className={`p-6 rounded-2xl border-2 text-center transition-all ${
                  petType === 'fox' ? 'border-emerald-400 bg-emerald-50/50 shadow-md' : 'border-gray-100 hover:bg-slate-50 bg-white'
                }`}
              >
                <span className="text-4xl block mb-2">🦊</span>
                <h4 className="font-display font-bold text-emerald-800">Leaf-Crowned Seed</h4>
                <p className="text-[11px] text-gray-500 mt-1">For agile explorers who maintain streaks.</p>
              </button>

              <button
                onClick={() => setPetType('guardian')}
                className={`p-6 rounded-2xl border-2 text-center transition-all ${
                  petType === 'guardian' ? 'border-amber-400 bg-amber-50/50 shadow-md' : 'border-gray-100 hover:bg-slate-50 bg-white'
                }`}
              >
                <span className="text-4xl block mb-2">🪨</span>
                <h4 className="font-display font-bold text-amber-800">Moss-Covered Seed</h4>
                <p className="text-[11px] text-gray-500 mt-1">For resilient warriors who conquer hard words.</p>
              </button>
            </div>

            {/* Name input */}
            <div className="max-w-md mx-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 text-left uppercase tracking-widest mb-1.5">
                  Give Your Guardian a Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sparky, Leafy, Pebble..."
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-400 rounded-xl px-4 py-3 outline-none text-sm font-bold font-display"
                />
              </div>

              {feedback && (
                <div className="text-xs font-bold text-emerald-600 bg-emerald-50 rounded-xl py-2.5 px-4 border border-emerald-100">
                  {feedback}
                </div>
              )}

              <button
                onClick={handleAdopt}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all outline-none"
              >
                Plant Magical Seed 🌱
              </button>
            </div>
          </motion.div>
        ) : (
          /* Nurturing / Active Companion Stage */
          <motion.div
            key="nurture-pet-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Main Pet Display Card */}
            <div className="glass-panel p-8 border-4 border-emerald-400 bg-white/95 text-center flex flex-col justify-between items-center relative overflow-hidden md:col-span-2">
              <div className="absolute top-4 right-4 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" /> Pet Level {pet.level}
              </div>

              {/* Animated Floating Avatar representation */}
              <div className="my-8 flex flex-col items-center">
                <motion.div
                  animate={{ 
                    y: [-12, 12, -12],
                    rotate: pet.level === 1 ? [-3, 3, -3] : [0, 0, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                  className="text-8xl filter drop-shadow-xl select-none"
                >
                  {getPetVisual(pet.type, pet.level).icon}
                </motion.div>

                <h3 className="font-display text-2xl text-slate-800 font-extrabold mt-6">{pet.name}</h3>
                <span className="text-xs bg-emerald-100 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full font-bold uppercase tracking-widest mt-1.5">
                  {getPetVisual(pet.type, pet.level).stage}
                </span>
              </div>

              {/* Speech bubble utilizing target words (Feature 2) */}
              <div className="bg-sky-50 border-2 border-sky-200 rounded-3xl p-4 max-w-sm relative text-sky-800 text-xs font-semibold">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-4 h-4 bg-sky-50 border-l-2 border-t-2 border-sky-200 rotate-45 translate-y-2 z-10" />
                <span className="block text-[10px] font-bold text-sky-600 mb-1">📢 COMPANION MESSAGE</span>
                {pet.level === 1 ? (
                  "I am just a sleeping seed! Keep practicing your spelling and quizes to help me hatch!"
                ) : pet.type === 'fox' ? (
                  `Oh brave explorer! I am feeling incredibly resilient today. Let's study Malaysia and Britain to make our forest flourish!`
                ) : pet.type === 'firefly' ? (
                  `Buzz! The vocabulary list is so bright! I want to help you find more treasure and gold in the desert!`
                ) : (
                  `The ancient stone runes whisper to me. If we maintain our learning streak, we will unlock magnificent ancient secrets!`
                )}
              </div>
            </div>

            {/* Interactions Panel */}
            <div className="glass-panel p-6 border-2 border-emerald-200 bg-white/95 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-lg text-emerald-900 font-bold mb-4 flex items-center gap-1.5">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500 animate-bounce" /> Guardian Care
                </h3>

                {/* Progress bar to next level */}
                <div className="mb-6">
                  <div className="flex justify-between text-[11px] font-bold text-gray-400 mb-1 uppercase tracking-wider">
                    <span>Evolutions progress</span>
                    <span className="text-emerald-600">{pet.xp} / 100 XP</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3.5 border overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-3.5 transition-all duration-500"
                      style={{ width: `${pet.xp}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium mt-1">
                    Needs {100 - pet.xp} more XP to reach Pet Level {pet.level + 1}!
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
                    <span className="text-2xl">🍒</span>
                    <div>
                      <h4 className="font-display text-xs font-bold text-slate-800">Feed Magic Berries</h4>
                      <p className="text-[10px] text-gray-500">Each feed awards 25 Pet XP.</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
                    <span className="text-2xl">🛡️</span>
                    <div>
                      <h4 className="font-display text-xs font-bold text-slate-800">Evolutions Schedule</h4>
                      <p className="text-[10px] text-gray-500">Hatch at lvl 2, evolve at lvl 3 and lvl 4+!</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {feedback && (
                  <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                    {feedback}
                  </div>
                )}

                <button
                  onClick={handleFeed}
                  disabled={feeding}
                  className="w-full bg-rose-500 hover:bg-rose-400 text-white font-bold py-3 px-4 rounded-xl shadow-[0_4px_12px_rgba(244,63,94,0.4)] flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all cursor-pointer outline-none"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  {feeding ? 'Feeding...' : 'Feed Companion Berry'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
