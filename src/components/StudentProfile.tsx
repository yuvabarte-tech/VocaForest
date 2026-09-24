import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Target, TrendingUp, AlertTriangle, Award, CheckCircle, Lock, Calendar, FileText, X } from 'lucide-react';
import { getAvatarData } from './AvatarSelector';
import { vocabularyDb } from '../vocabulary';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface StudentProfileProps {
  student: any;
}

const TROPHIES_LIST = [
  { id: 'level_1', title: 'Forest Cadet', icon: '🌱', desc: 'Reach Level 1 in VocaForest', condition: (s: any) => s.level >= 1 },
  { id: 'level_3', title: 'Canopy Ranger', icon: '🏹', desc: 'Reach Level 3 in VocaForest', condition: (s: any) => s.level >= 3 },
  { id: 'level_5', title: 'Crown Guardian', icon: '👑', desc: 'Reach Level 5 in VocaForest', condition: (s: any) => s.level >= 5 },
  { id: 'quiz_5', title: 'Epic Explorer', icon: '🧭', desc: 'Complete at least 5 quizzes', condition: (s: any) => s.quizAttempts >= 5 },
  { id: 'accuracy_80', title: 'Perfect Archer', icon: '🎯', desc: 'Maintain accuracy of 80% or above', condition: (s: any) => s.quizAttempts > 0 && ((s.correctAnswers / s.quizAttempts) >= 0.8) },
  { id: 'xp_500', title: 'Gold Gatherer', icon: '✨', desc: 'Amass 500 total Experience Points', condition: (s: any) => s.xp >= 500 }
];

const CERTIFICATES = [
  { id: 'cert_novice', title: 'Forest Explorer Certificate', level: 1, text: 'For successfully navigating the entry woodlands of VocaForest and mastering introductory English vocabulary.', badge: '🌱', tier: 'Bronze Tier' },
  { id: 'cert_intermediate', title: 'Canopy Ranger Certificate', level: 3, text: 'For outstanding lexical precision, showing command over advanced word definitions and spelling patterns.', badge: '🏹', tier: 'Silver Tier' },
  { id: 'cert_master', title: 'Legendary Scholar Certificate', level: 5, text: 'The highest vocabulary academic distinction of the VocaForest, awarded for absolute mastery and perfect recall.', badge: '👑', tier: 'Gold Tier' }
];

export default function StudentProfile({ student }: StudentProfileProps) {
  const avatarData = getAvatarData(student.avatar);
  const [selectedCert, setSelectedCert] = useState<any>(null);
  
  // Calculate weak and strong words
  const failedWordsArr = Object.entries(student.failedWords || {}).map(([code, count]) => ({ code, count: count as number }));
  failedWordsArr.sort((a, b) => b.count - a.count);
  const weakWords = failedWordsArr.slice(0, 3).map(w => {
    const v = vocabularyDb.find(v => v.code === w.code);
    return v ? v.word : w.code;
  });

  const accuracy = student.quizAttempts > 0 ? Math.round((student.correctAnswers / student.quizAttempts) * 100) : 0;
  
  // Dynamic history timeline for charts
  const learningTimeline = [
    { name: 'Day 1', xp: Math.min(student.xp, 40), accuracy: Math.max(0, accuracy - 25) },
    { name: 'Day 2', xp: Math.min(student.xp, 120), accuracy: Math.max(0, accuracy - 15) },
    { name: 'Day 3', xp: Math.min(student.xp, 280), accuracy: Math.max(0, accuracy - 5) },
    { name: 'Today', xp: student.xp, accuracy: accuracy }
  ].filter(item => item.xp > 0 || item.name === 'Today');

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4 pb-12">
      {/* Header Profile Card */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-3xl p-8 border-4 border-emerald-500 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-8 items-center text-center md:text-left">
        <div className="absolute inset-0 bg-[url('https://i.ibb.co/21y2yhC3/forest.png')] opacity-10 bg-cover mix-blend-overlay" />
        
        <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-emerald-400 bg-gradient-to-br ${avatarData.theme} flex items-center justify-center text-6xl shadow-xl z-10 overflow-hidden shrink-0`}>
          <img src={avatarData.img} alt={avatarData.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
        </div>
        
        <div className="z-10 flex-1">
          <div className="inline-block px-3 py-1 bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            Level {student.level} {avatarData.badge}
          </div>
          <h2 className="font-display text-4xl md:text-5xl text-white font-bold mb-2 drop-shadow-md">
            {student.fullName}
          </h2>
          <p className="text-emerald-100/80 font-medium max-w-xl">
            {avatarData.description}
          </p>
          
          <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
            <div className="bg-black/30 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 animate-spin" />
              <span className="text-white font-bold">{student.xp} XP</span>
            </div>
            <div className="bg-black/30 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-orange-400 animate-bounce" />
              <span className="text-white font-bold">
                {TROPHIES_LIST.filter(t => t.condition(student)).length} Trophies
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Overall Progress */}
        <div className="glass-panel p-6 border-2 border-emerald-100 bg-white">
          <h3 className="font-display text-xl text-emerald-800 font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" /> XP & Accuracy progression
          </h3>
          
          <div className="h-44 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={learningTimeline}>
                <defs>
                  <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Area type="monotone" dataKey="xp" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorXp)" name="XP Earned" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                <span>QUIZ ACCURACY</span>
                <span className="text-emerald-700 font-mono font-bold">{accuracy}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-3 rounded-full transition-all duration-1000" 
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-emerald-50/50 p-4 rounded-2xl border-2 border-emerald-100 text-center">
                <span className="block text-2xl font-display font-black text-emerald-600">{student.quizAttempts || 0}</span>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Quizzes Played</span>
              </div>
              <div className="bg-emerald-50/50 p-4 rounded-2xl border-2 border-emerald-100 text-center">
                <span className="block text-2xl font-display font-black text-emerald-600">{student.correctAnswers || 0}</span>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Correct Answers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Needs Improvement & Certs */}
        <div className="flex flex-col gap-6">
          {/* Needs Improvement */}
          <div className="glass-panel p-6 border-2 border-emerald-100 bg-white">
            <h3 className="font-display text-xl text-emerald-800 font-bold mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" /> Vocabulary Focus Areas
            </h3>
            {weakWords.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 font-medium mb-3">Practice these words during your next mission to achieve mastery:</p>
                {weakWords.map((word, i) => (
                  <div key={i} className="flex items-center gap-3 bg-red-50/50 p-3 rounded-2xl border border-red-100">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="font-bold text-rose-800 text-sm">{word}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                  <Star className="w-6 h-6 text-emerald-500 animate-pulse" />
                </div>
                <p className="text-sm font-bold text-emerald-800">No weak words logged!</p>
                <p className="text-xs text-emerald-600 mt-1 font-medium">Keep playing Quiz Land to keep your streak alive!</p>
              </div>
            )}
          </div>

          {/* Award Certificates */}
          <div className="glass-panel p-6 border-2 border-emerald-100 bg-white flex-1">
            <h3 className="font-display text-xl text-emerald-800 font-bold mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" /> Academic Certificates
            </h3>
            <p className="text-xs text-gray-400 font-medium mb-4">Earn certificates by reaching level thresholds. Click to view and printable card.</p>
            
            <div className="space-y-3">
              {CERTIFICATES.map(cert => {
                const isUnlocked = student.level >= cert.level;
                return (
                  <div 
                    key={cert.id} 
                    className={`p-3.5 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all ${
                      isUnlocked 
                        ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50/80' 
                        : 'bg-gray-50 border-gray-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cert.badge}</span>
                      <div>
                        <h4 className="font-display text-xs font-bold text-slate-800 flex items-center gap-2">
                          {cert.title}
                          {isUnlocked && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                        </h4>
                        <p className="text-[10px] text-gray-500 font-semibold">{cert.tier} • Unlocks Lvl {cert.level}</p>
                      </div>
                    </div>

                    {isUnlocked ? (
                      <button 
                        onClick={() => setSelectedCert(cert)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-display text-[11px] font-bold px-3 py-1.5 rounded-xl border border-emerald-400 shadow transition-all cursor-pointer"
                      >
                        Claim Cert
                      </button>
                    ) : (
                      <span className="text-gray-400 font-bold text-[11px] flex items-center gap-1 bg-gray-200/50 px-2 py-1 rounded-xl">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Trophies Grid Section */}
      <div className="glass-panel p-6 border-2 border-emerald-100 bg-white">
        <h3 className="font-display text-xl text-emerald-800 font-bold mb-2 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" /> Unlocked Legendary Trophies
        </h3>
        <p className="text-xs text-gray-400 font-medium mb-6">Gain special vocabulary badges as you build your VocaForest empire.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {TROPHIES_LIST.map(trophy => {
            const isUnlocked = trophy.condition(student);
            return (
              <div 
                key={trophy.id}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center text-center transition-all ${
                  isUnlocked 
                    ? 'bg-gradient-to-b from-amber-50/50 to-amber-100/20 border-amber-300 shadow-sm scale-100 hover:scale-105' 
                    : 'bg-gray-50 border-gray-100 opacity-40'
                }`}
              >
                <span className={`text-4xl mb-2 inline-block ${isUnlocked ? 'animate-bounce' : 'grayscale filter'}`}>
                  {isUnlocked ? trophy.icon : '🔒'}
                </span>
                <h4 className="font-display text-xs font-bold text-slate-800 line-clamp-1">{trophy.title}</h4>
                <p className="text-[9px] text-gray-500 font-semibold mt-1 leading-normal">{trophy.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Certificate Claim Modal */}
      <AnimatePresence>
        {selectedCert && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full border-8 border-emerald-600 shadow-2xl relative overflow-hidden"
            >
              {/* Outer classic certificate border frame */}
              <div className="absolute inset-2 border-2 border-emerald-400 pointer-events-none" />
              
              {/* Close Button */}
              <button 
                onClick={() => setSelectedCert(null)}
                className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full cursor-pointer z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-6 relative py-4">
                <span className="text-6xl block drop-shadow-md">{selectedCert.badge}</span>
                
                <h2 className="font-serif text-emerald-800 text-3xl font-black tracking-tight uppercase">
                  Certificate of Lexical Achievement
                </h2>
                <p className="text-xs text-gray-400 font-bold font-mono tracking-widest uppercase">
                  Presented by VocaForest Academy
                </p>

                <hr className="w-1/2 mx-auto border-emerald-100" />

                <p className="text-xs text-gray-500 font-medium">This document proudly certifies that student explorer</p>
                
                <h1 className="font-display text-4xl text-emerald-900 font-extrabold tracking-tight drop-shadow-sm py-2">
                  {student.fullName}
                </h1>

                <p className="text-sm text-gray-600 max-w-md mx-auto font-medium leading-relaxed italic">
                  "{selectedCert.text}"
                </p>

                <p className="text-xs text-emerald-700 font-bold">
                  Class Canopy Level 2 • Student Profile Level {student.level} Threshold
                </p>

                <hr className="w-1/2 mx-auto border-emerald-100" />

                <div className="flex justify-between items-end pt-6 px-12 text-left">
                  <div>
                    <span className="block font-serif text-gray-800 font-bold text-sm">Yuvabarte Arun Arumugam</span>
                    <span className="block text-[10px] text-gray-400 font-bold font-mono">GUARDIAN TEACHER</span>
                  </div>
                  <div className="text-right">
                    <span className="block font-serif text-gray-800 font-bold text-sm">
                      {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="block text-[10px] text-gray-400 font-bold font-mono">DATE OF ISSUANCE</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
