import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { vocabularyDb } from '../vocabulary';
import { Volume2, RefreshCw, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

export default function TrainingCards() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  const currentWord = vocabularyDb[currentIndex];

  const handleNext = () => {
    setDirection(1);
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % vocabularyDb.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + vocabularyDb.length) % vocabularyDb.length);
  };

  const handleRandom = () => {
    setDirection(Math.random() > 0.5 ? 1 : -1);
    setIsFlipped(false);
    const randomIndex = Math.floor(Math.random() * vocabularyDb.length);
    setCurrentIndex(randomIndex);
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(currentWord.word);
      u.lang = 'en-US';
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped && 'speechSynthesis' in window) {
      // Speak definition when flipped over!
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(currentWord.meaning);
      u.lang = 'en-US';
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center space-y-6 pt-4">
      {/* Intro Guide Card */}
      <div className="glass-panel p-5 w-full flex items-center gap-4">
        <img src="https://i.ibb.co/KzqgjmG3/nutty.png" className="w-16 h-16 object-contain" alt="Nutty" />
        <div>
          <h4 className="font-display text-lg text-emerald-800 font-bold">Nutty's Training Cards</h4>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Flip cards to review spelling, pronunciation, and sentences before testing your skills in active Field Missions!
          </p>
        </div>
      </div>

      {/* 3D Card Stage */}
      <div className="relative w-full h-[340px] flex items-center justify-center perspective-1000">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: direction * 150, rotateY: 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 150 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            className="w-full h-full cursor-pointer relative style-3d"
            onClick={handleFlip}
          >
            {/* Front of Card */}
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 w-full h-full backface-hidden"
            >
              <div className="w-full h-full rounded-3xl border-8 border-emerald-500 bg-gradient-to-br from-[#fefae0] to-yellow-100/50 shadow-2xl flex flex-col justify-between p-8 text-center relative overflow-hidden">
                
                {/* Decorative Background Icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                  <BookOpen className="w-64 h-64" />
                </div>

                <div className="flex justify-between items-center">
                  <span className="bg-emerald-500 text-white font-display text-xs px-3 py-1 rounded-full uppercase font-bold tracking-wider">
                    {currentWord.code}
                  </span>
                  <button
                    onClick={handleSpeak}
                    className="w-10 h-10 rounded-full bg-emerald-100 hover:bg-emerald-500 hover:text-white text-emerald-700 flex items-center justify-center transition-all shadow-md focus:outline-none"
                    title="Speak word"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="my-auto space-y-4">
                  <h2 className="font-display text-5xl text-emerald-900 font-bold capitalize tracking-wide select-none drop-shadow-sm">
                    {currentWord.word}
                  </h2>
                  <p className="text-sm font-mono text-gray-400 select-none">
                    {currentWord.pronunciation}
                  </p>
                </div>

                <div className="text-xs text-emerald-600 font-bold uppercase tracking-widest animate-pulse mt-auto flex items-center justify-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" /> Tap to reveal meaning
                </div>
              </div>
            </motion.div>

            {/* Back of Card */}
            <motion.div
              animate={{ rotateY: isFlipped ? 0 : -180 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 w-full h-full backface-hidden"
            >
              <div className="w-full h-full rounded-3xl border-8 border-amber-500 bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-2xl flex flex-col justify-between p-8 text-center text-white relative">
                
                <div className="flex justify-start">
                  <span className="bg-amber-500 text-white font-display text-xs px-3 py-1 rounded-full uppercase font-bold">
                    Meaning Revealed
                  </span>
                </div>

                <div className="my-auto space-y-6">
                  <h3 className="text-2xl font-bold font-body text-yellow-100 select-none drop-shadow-sm leading-relaxed px-4">
                    {currentWord.meaning}
                  </h3>
                  
                  <div className="bg-black/25 p-4 rounded-2xl border border-white/10 max-w-md mx-auto">
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mb-2 text-left">
                      Context Sentence:
                    </span>
                    <p className="text-sm font-medium italic text-emerald-50 leading-relaxed text-left">
                      "{currentWord.example}"
                    </p>
                  </div>
                </div>

                <div className="text-xs text-amber-300 font-bold uppercase tracking-widest animate-pulse mt-auto flex items-center justify-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" /> Tap to return
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={handlePrev}
          className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-500 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all focus:outline-none"
          title="Previous word"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleRandom}
          className="bg-amber-500 text-white font-display text-sm font-semibold px-6 py-2.5 rounded-full shadow-lg hover:bg-amber-400 hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 focus:outline-none"
        >
          <RefreshCw className="w-4 h-4" /> Random Word
        </button>

        <button
          onClick={handleNext}
          className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-500 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all focus:outline-none"
          title="Next word"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">
        Card {currentIndex + 1} of {vocabularyDb.length}
      </p>
    </div>
  );
}
