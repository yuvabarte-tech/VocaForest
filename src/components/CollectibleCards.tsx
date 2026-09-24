import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Award, Gift, Eye, HelpCircle, ArrowLeftRight } from 'lucide-react';

interface CollectibleCardsProps {
  student: any;
  onUpdateStudent: (s: any) => void;
}

const ALL_CARDS = [
  { code: 'C001', name: 'Elderwood Oak', image: '🌳', element: 'Wood', rarity: 'Legendary', power: 'Ancient Whisper', description: 'Deep within the heart of the forest, the Elderwood whispers ancient synonyms to guide lost travellers.' },
  { code: 'C002', name: 'Lumina Firefly', image: '⚡', element: 'Light', rarity: 'Rare', power: 'Bioluminescent Glow', description: 'Its wings glow brighter whenever a student spells a word perfectly in the Spelling Bee.' },
  { code: 'C003', name: 'Whispering Fern', image: '🌿', element: 'Nature', rarity: 'Common', power: 'Syllable Melody', description: 'It rustles in sweet pentatonic rhythms, singing phonetic sounds to sleeping forest creatures.' },
  { code: 'C004', name: 'Sapphire Sprout', image: '🌱', element: 'Water', rarity: 'Rare', power: 'Durable Resilience', description: 'Sprouts only in soil watered by the persistence of overcoming failed words.' },
  { code: 'C005', name: 'Solar Bloom', image: '🌻', element: 'Sun', rarity: 'Epic', power: 'Solar Radiance', description: 'Radiates gentle golden sunlight that helps vocabulary lists grow evergreen.' },
  { code: 'C006', name: 'Nebula Orchid', image: '🌸', element: 'Cosmic', rarity: 'Legendary', power: 'Streak Aura', description: 'An ultra-rare flower whose petals shift colors based on active student learning streaks.' }
];

export default function CollectibleCards({ student, onUpdateStudent }: CollectibleCardsProps) {
  const [opening, setOpening] = useState(false);
  const [revealedCard, setRevealedCard] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const pouchCount = student.pouchCount !== undefined ? student.pouchCount : 3;
  const unlockedCodes = student.unlockedCards || [];

  const handleOpenPouch = async () => {
    if (pouchCount <= 0) {
      setErrorMsg("No magical seed pouches left! Level up or score correct riddle answers to earn pouches.");
      return;
    }
    setErrorMsg('');
    setOpening(true);
    setRevealedCard(null);

    // Simulate standard card pouch rumble animation for 1500ms
    setTimeout(async () => {
      try {
        const response = await fetch('/api/student/pouch/open', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: student.username })
        });

        if (response.ok) {
          const data = await response.json();
          setRevealedCard(data.card);
          onUpdateStudent(data.student);
        } else {
          const err = await response.json();
          setErrorMsg(err.error || "Failed to open pouch.");
        }
      } catch (e) {
        console.error("Failed to open pouch", e);
        setErrorMsg("Network error opening pouch.");
      } finally {
        setOpening(false);
      }
    }, 1500);
  };

  const getRarityStyle = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'bg-gradient-to-b from-amber-500 via-yellow-400 to-amber-600 border-yellow-300 text-white shadow-yellow-500/35';
      case 'Epic': return 'bg-gradient-to-b from-purple-600 via-pink-500 to-indigo-700 border-pink-300 text-white shadow-purple-500/35';
      case 'Rare': return 'bg-gradient-to-b from-blue-600 via-cyan-400 to-blue-700 border-cyan-200 text-white shadow-cyan-500/35';
      default: return 'bg-gradient-to-b from-slate-100 to-slate-200 border-slate-300 text-slate-800 shadow-slate-300/10';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4">
      {/* Seed Pouch Loot Section (Feature 5) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Magic Pouch Opening Canvas */}
        <div className="glass-panel p-8 border-4 border-emerald-400 bg-white/95 text-center flex flex-col justify-between items-center relative overflow-hidden md:col-span-2 min-h-[360px]">
          <div>
            <h3 className="font-display text-xl text-emerald-900 font-bold mb-1 flex items-center gap-1.5 justify-center">
              <Gift className="w-5 h-5 text-emerald-600 animate-bounce" /> Magic Seed Pouch Opening
            </h3>
            <p className="text-xs text-gray-500 font-semibold">Open sparkling forest pouches to collect rare mystical elements!</p>
          </div>

          <div className="my-8 relative">
            <AnimatePresence mode="wait">
              {opening ? (
                /* Rumble / Vibration animation */
                <motion.div
                  key="pouch-opening"
                  animate={{ 
                    rotate: [-15, 15, -15, 15, -15, 15, 0],
                    scale: [1, 1.2, 1, 1.2, 1]
                  }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                  className="text-8xl select-none filter drop-shadow-2xl"
                >
                  🎒✨
                </motion.div>
              ) : revealedCard ? (
                /* Card reveal bounce animation */
                <motion.div
                  key="revealed-card-view"
                  initial={{ rotateY: 180, scale: 0.5, opacity: 0 }}
                  animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 80 }}
                  className={`w-[180px] h-[240px] rounded-2xl border-4 p-4 flex flex-col justify-between items-center text-center shadow-xl relative overflow-hidden ${getRarityStyle(revealedCard.rarity)}`}
                >
                  <div className="absolute top-2 left-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold font-mono uppercase">
                    {revealedCard.element}
                  </div>
                  <div className="absolute top-2 right-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-black uppercase">
                    {revealedCard.rarity}
                  </div>

                  <span className="text-5xl mt-8 filter drop-shadow-md select-none">{revealedCard.image}</span>
                  
                  <div className="mb-2">
                    <h4 className="font-display font-black text-sm leading-tight">{revealedCard.name}</h4>
                    <p className="text-[9px] font-bold opacity-90 tracking-widest uppercase mt-0.5">{revealedCard.power}</p>
                  </div>
                </motion.div>
              ) : (
                /* Idle seed pouch card */
                <motion.div
                  key="pouch-idle"
                  className="text-7xl select-none filter drop-shadow-lg flex items-center justify-center bg-emerald-50 border-4 border-dashed border-emerald-300 w-28 h-28 rounded-full cursor-pointer hover:bg-emerald-100/50 transition-all"
                  onClick={handleOpenPouch}
                  whileHover={{ scale: 1.1 }}
                >
                  🎒
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-full">
            {errorMsg && (
              <div className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl py-2 px-4 mb-3">
                {errorMsg}
              </div>
            )}
            <button
              onClick={handleOpenPouch}
              disabled={opening || pouchCount <= 0}
              className="w-full max-w-sm bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all outline-none cursor-pointer"
            >
              {opening ? 'Invoking Forest Magic...' : `Open Pouch (${pouchCount} Remaining)`}
            </button>
          </div>
        </div>

        {/* Loot Inventory HUD */}
        <div className="glass-panel p-6 border-2 border-emerald-200 bg-white/95 flex flex-col justify-between">
          <div>
            <h3 className="font-display text-sm font-black text-slate-500 uppercase tracking-widest mb-3">Pouch Tracker</h3>
            <p className="text-xs text-gray-500 font-medium mb-4">
              Unlock collectible cards representing forest elements. Level up or hit correctly generated riddles in the Whispering Woods to win pouch rolls!
            </p>

            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600">POUCHES REMAINING</span>
                <span className="text-xl font-black text-emerald-600 font-display">{pouchCount}</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600">DECK SIZE</span>
                <span className="text-xl font-black text-emerald-600 font-display">{unlockedCodes.length} / 6</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mt-4">
            <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded font-bold uppercase tracking-widest flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 animate-spin" /> Unlocks when you learn
            </span>
          </div>
        </div>
      </div>

      {/* Collectible Card Deck Gallery (Feature 5) */}
      <div className="glass-panel p-8 border-2 border-emerald-200 bg-white/95">
        <h3 className="font-display text-2xl text-emerald-950 font-extrabold mb-2">VocaForest Collectibles Gallery</h3>
        <p className="text-xs text-gray-500 font-semibold mb-6">Can you master all 6 magical entities of the VocaForest?</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {ALL_CARDS.map((card) => {
            const isUnlocked = unlockedCodes.includes(card.code);
            return (
              <div 
                key={card.code}
                className={`relative rounded-xl border-2 p-3 flex flex-col justify-between items-center text-center shadow-sm h-[180px] transition-all ${
                  isUnlocked 
                    ? getRarityStyle(card.rarity) 
                    : 'bg-gray-100/50 border-gray-200 text-gray-400 grayscale opacity-40'
                }`}
              >
                {/* Element */}
                <span className="text-[8px] bg-black/10 px-1 py-0.5 rounded font-bold font-mono uppercase absolute top-1.5 left-1.5">
                  {isUnlocked ? card.element : '???'}
                </span>

                {/* Card Emoji illustration */}
                <span className="text-4xl mt-4 filter drop-shadow-sm">
                  {isUnlocked ? card.image : '❓'}
                </span>

                <div className="w-full">
                  <h4 className="font-display font-black text-xs truncate leading-tight">
                    {isUnlocked ? card.name : 'Unknown Card'}
                  </h4>
                  <p className="text-[8px] font-bold tracking-wider uppercase mt-0.5 opacity-80">
                    {isUnlocked ? card.rarity : 'LOCKED'}
                  </p>
                </div>

                {/* Hover overlay hint */}
                {isUnlocked && (
                  <div className="absolute inset-0 bg-black/90 opacity-0 hover:opacity-100 rounded-xl p-2.5 text-left text-white text-[9px] flex flex-col justify-between transition-all">
                    <p className="font-bold leading-tight text-yellow-300">{card.power}</p>
                    <p className="leading-normal mt-1 opacity-90">{card.description}</p>
                    <span className="text-[8px] uppercase tracking-wider text-right font-black">Code: {card.code}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
