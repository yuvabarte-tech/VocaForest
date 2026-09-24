import GameSpellingBee from './GameSpellingBee';
import GameConnections from './GameConnections';
import GameWriting from './GameWriting';
import GameReading from './GameReading';
import GameLinguistics from './GameLinguistics';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { vocabularyDb } from '../vocabulary';
import { Sparkles, Trophy, Heart, Timer, Check, X, AlertTriangle, Gamepad2, Type, Coins, Volume2 } from 'lucide-react';

const generateUniqueTypos = (word: string, count: number): string[] => {
  const typos = new Set<string>();
  const wordLower = word.toLowerCase();
  
  let attempts = 0;
  while (typos.size < count && attempts < 200) {
    attempts++;
    const strategy = Math.floor(Math.random() * 5);
    let typo = "";
    const arr = word.split('');
    
    if (strategy === 0) {
      // Adjacent Swap (Transpose)
      if (arr.length >= 2) {
        const idx = Math.floor(Math.random() * (arr.length - 1));
        if (arr[idx].toLowerCase() !== arr[idx+1].toLowerCase()) {
          const temp = arr[idx];
          arr[idx] = arr[idx+1];
          arr[idx+1] = temp;
          typo = arr.join('');
        }
      }
    } else if (strategy === 1) {
      // Vowel Switch
      const vowels = ['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U'];
      const vowelIndices: number[] = [];
      for (let i = 0; i < arr.length; i++) {
        if (vowels.includes(arr[i])) {
          vowelIndices.push(i);
        }
      }
      if (vowelIndices.length > 0) {
        const idx = vowelIndices[Math.floor(Math.random() * vowelIndices.length)];
        const isUpper = arr[idx] === arr[idx].toUpperCase();
        const pool = isUpper ? ['A', 'E', 'I', 'O', 'U'] : ['a', 'e', 'i', 'o', 'u'];
        const currentVowel = arr[idx];
        const filteredPool = pool.filter(v => v.toLowerCase() !== currentVowel.toLowerCase());
        const newVowel = filteredPool[Math.floor(Math.random() * filteredPool.length)];
        arr[idx] = newVowel;
        typo = arr.join('');
      }
    } else if (strategy === 2) {
      // Double a Character
      const idx = Math.floor(Math.random() * arr.length);
      arr.splice(idx, 0, arr[idx]);
      typo = arr.join('');
    } else if (strategy === 3) {
      // Omit a Character
      if (arr.length > 3) {
        const idx = Math.floor(Math.random() * arr.length);
        arr.splice(idx, 1);
        typo = arr.join('');
      }
    } else {
      // Replace a random character
      const idx = Math.floor(Math.random() * arr.length);
      const isUpper = arr[idx] === arr[idx].toUpperCase();
      const alphabet = isUpper ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "abcdefghijklmnopqrstuvwxyz";
      const currentLetter = arr[idx];
      const filteredAlphabet = alphabet.split('').filter(l => l.toLowerCase() !== currentLetter.toLowerCase());
      const newLetter = filteredAlphabet[Math.floor(Math.random() * filteredAlphabet.length)];
      arr[idx] = newLetter;
      typo = arr.join('');
    }
    
    if (typo && typo.toLowerCase() !== wordLower) {
      typos.add(typo);
    }
  }
  
  let backupIndex = 0;
  while (typos.size < count && backupIndex < 10) {
    backupIndex++;
    const backupTypo = word + backupIndex;
    if (backupTypo.toLowerCase() !== wordLower) {
      typos.add(backupTypo);
    }
  }
  
  return Array.from(typos);
};

interface FieldMissionProps {
  student: any;
  onUpdateStudent: (updatedStudent: any) => void;
}

export default function FieldMission({ student, onUpdateStudent }: FieldMissionProps) {
  const [level, setLevel] = useState(student.level || 0);
  const [gameMode, setGameMode] = useState<'match' | 'unscramble' | 'bonus' | 'listen' | 'spelling' | 'connections' | 'writing' | 'reading' | 'linguistics' | null>(null);
  
  // Game states
  const [targetWord, setTargetWord] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [scrambledWord, setScrambledWord] = useState('');
  const [unscrambleInput, setUnscrambleInput] = useState('');
  
  const [timerCount, setTimerCount] = useState(10);
  const [timerActive, setTimerActive] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [yuvaState, setYuvaState] = useState<'thinking' | 'celebrating' | 'pointing' | 'waving' | 'wrong'>('pointing');
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionPlayedWords, setSessionPlayedWords] = useState<string[]>([]);

  // Difficulty scaling thresholds
  const mode = useMemo(() => {
    if (student.xp < 300) return { name: 'Easy Mode', options: 2, hasTimer: false, reward: 10 };
    if (student.xp < 600) return { name: 'Medium Mode', options: 4, hasTimer: false, reward: 15 };
    return { name: 'Hard Mode', options: 4, hasTimer: true, reward: 20 };
  }, [student.xp]);

  // Generate question based on mode
  const generateQuestion = () => {
    if (!gameMode) return;
    setHasAnswered(false);
    setIsCorrect(null);
    setSelectedOption(null);
    setUnscrambleInput('');
    setTimerCount(10);
    setYuvaState('thinking');

    // Filter out played words, reset if all words have been played
    let baseWords = vocabularyDb;
    if (student.assignedWords && student.assignedWords.length > 0) {
      baseWords = vocabularyDb.filter(w => student.assignedWords.includes(w.code));
      if (baseWords.length === 0) {
        baseWords = vocabularyDb;
      }
    }

    let availableWords = baseWords.filter(w => !sessionPlayedWords.includes(w.code));
    if (availableWords.length === 0) {
      availableWords = baseWords;
      setSessionPlayedWords([]); // Reset for next loop
    }

    const target = availableWords[Math.floor(Math.random() * availableWords.length)];
    setTargetWord(target);
    setSessionPlayedWords(prev => [...prev, target.code]);

    if (gameMode === 'linguistics') {
      setTargetWord({ word: 'Linguistics Quest', meaning: 'Synonyms, Antonyms & Homonyms', code: 'LING_QUEST' });
      setOptions([]);
      setScrambledWord('');
      setUnscrambleInput('');
      setTimerActive(false);
      return;
    }

    if (gameMode === 'match') {
      const count = mode.options;
      const choices = [target];
      while (choices.length < count) {
        const rand = vocabularyDb[Math.floor(Math.random() * vocabularyDb.length)];
        if (!choices.find((c) => c.code === rand.code)) {
          choices.push(rand);
        }
      }
      choices.sort(() => Math.random() - 0.5);
      setOptions(choices);
    } else if (gameMode === 'unscramble') {
      let scrambled = target.word.split('').sort(() => Math.random() - 0.5).join('');
      // ensure it's not the exact word
      while(scrambled === target.word && target.word.length > 1) {
        scrambled = target.word.split('').sort(() => Math.random() - 0.5).join('');
      }
      setScrambledWord(scrambled);
    } else if (gameMode === 'bonus') {
      // Bonus Mode: Spell Check (Find the correctly spelled word among typos)
      const uniqueTypos = generateUniqueTypos(target.word, 3);
      const choices = [
        { word: target.word, isCorrect: true },
        ...uniqueTypos.map(t => ({ word: t, isCorrect: false }))
      ];
      choices.sort(() => Math.random() - 0.5);
      setOptions(choices);
    }

    setTimerActive(mode.hasTimer && gameMode === 'match');
  };

  useEffect(() => {
    let timer: any = null;
    if (timerActive && timerCount > 0 && !hasAnswered) {
      timer = setInterval(() => {
        setTimerCount((prev) => prev - 1);
      }, 1000);
    } else if (timerCount === 0 && !hasAnswered) {
      handleAnswer(null, false);
    }
    return () => clearInterval(timer);
  }, [timerActive, timerCount, hasAnswered]);

  const handleAnswer = async (selection: string | null, correct: boolean) => {
    const skillCategoryMap: Record<string, string> = {
      'match': 'memory',
      'unscramble': 'memory',
      'bonus': 'memory',
      'listen': 'listening',
      'spelling': 'spelling',
      'connections': 'connections',
      'writing': 'writing',
      'reading': 'reading',
      'linguistics': 'linguistics'
    };
    const skillCategory = skillCategoryMap[gameMode || 'match'];

    setTimerActive(false);
    setHasAnswered(true);
    setIsCorrect(correct);
    setSelectedOption(selection);

    // Bonus mode gives double reward
    const currentReward = gameMode === 'bonus' ? mode.reward * 2 : mode.reward;

    if (correct) {
      setYuvaState('celebrating');
      setSessionScore((prev) => prev + currentReward);
    } else {
      setYuvaState('wrong');
    }

    const xpGained = correct ? currentReward : 0;

    try {
      const response = await fetch('/api/student/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: student.username,
          xpGained,
          isCorrect: correct,
          wordCode: targetWord?.code,
          skillCategory,
          gameMode
        })
      });

      if (response.ok) {
        const data = await response.json();
        onUpdateStudent(data.student);
      }
    } catch (e) {
      console.warn("Failed to sync progress to server:", e);
    }
  };

  const checkUnscramble = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unscrambleInput.trim() || hasAnswered) return;
    const isAnsCorrect = unscrambleInput.toLowerCase().trim() === targetWord.word.toLowerCase();
    handleAnswer(unscrambleInput, isAnsCorrect);
  };

  useEffect(() => {
    generateQuestion();
  }, [gameMode]); // Removed student.xp to prevent auto-skipping when student gains XP

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4">
      {/* Menu Screen when no game mode is selected */}
      {gameMode === null ? (
        <div className="flex flex-col items-center justify-center min-h-[500px]">
          <div className="glass-panel p-8 text-center max-w-4xl w-full border-4 border-emerald-300 bg-white/90">
            <h2 className="font-display text-4xl text-emerald-800 font-bold mb-2">Quiz Land</h2>
            <p className="text-gray-600 font-medium mb-8">Choose your training challenge to earn XP and unlock medals!</p>

            {student.assignedWords && student.assignedWords.length > 0 && (
              <div className="bg-sky-50 border-2 border-sky-300 text-sky-800 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 max-w-2xl mx-auto text-left shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">🎯</span>
                  <div>
                    <h4 className="font-bold font-display text-sm">Assigned Words Mode Active</h4>
                    <p className="text-xs text-gray-600 font-semibold mt-0.5">
                      Your games are customized! You will study the {student.assignedWords.length} words assigned by your teacher.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-sky-200 text-sky-800 font-bold px-2 py-1 rounded-md uppercase whitespace-nowrap">
                  {student.assignedWords.length} Words
                </span>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <button 
                onClick={() => setGameMode('match')}
                className="flex flex-col items-center p-6 bg-emerald-50 border-2 border-emerald-200 rounded-2xl hover:bg-emerald-100 transition-all hover:scale-105 active:scale-95"
              >
                <Gamepad2 className="w-12 h-12 text-emerald-500 mb-4" />
                <h3 className="font-display text-xl font-bold text-emerald-800 mb-2">Word Match</h3>
                <p className="text-xs text-gray-500">Match the word to its correct meaning.</p>
              </button>

              <button 
                onClick={() => setGameMode('unscramble')}
                className="flex flex-col items-center p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl hover:bg-amber-100 transition-all hover:scale-105 active:scale-95"
              >
                <Type className="w-12 h-12 text-amber-500 mb-4" />
                <h3 className="font-display text-xl font-bold text-amber-800 mb-2">Unscramble</h3>
                <p className="text-xs text-gray-500">Fix the scrambled letters to spell the word.</p>
              </button>
              
              <button 
                onClick={() => setGameMode('listen')}
                className="flex flex-col items-center p-6 bg-sky-50 border-2 border-sky-200 rounded-2xl hover:bg-sky-100 transition-all hover:scale-105 active:scale-95"
              >
                <Volume2 className="w-12 h-12 text-sky-500 mb-4" />
                <h3 className="font-display text-xl font-bold text-sky-800 mb-2">Listen & Spell</h3>
                <p className="text-xs text-gray-500">Listen to the word and type it correctly.</p>
              </button>

              <button 
                onClick={() => setGameMode('bonus')}
                className="flex flex-col items-center p-6 bg-indigo-50 border-2 border-indigo-200 rounded-2xl hover:bg-indigo-100 transition-all hover:scale-105 active:scale-95"
              >
                <Coins className="w-12 h-12 text-indigo-500 mb-4" />
                <h3 className="font-display text-xl font-bold text-indigo-800 mb-2">Bonus Level</h3>
                <p className="text-xs text-gray-500">Spot the correct spelling for double XP!</p>
              </button>

              <button 
                onClick={() => setGameMode('spelling')}
                className="flex flex-col items-center p-6 bg-rose-50 border-2 border-rose-200 rounded-2xl hover:bg-rose-100 transition-all hover:scale-105 active:scale-95"
              >
                <span className="text-4xl mb-3">🐝</span>
                <span className="font-display font-bold text-rose-800">Spelling Bee</span>
              </button>

              <button 
                onClick={() => setGameMode('connections')}
                className="flex flex-col items-center p-6 bg-purple-50 border-2 border-purple-200 rounded-2xl hover:bg-purple-100 transition-all hover:scale-105 active:scale-95"
              >
                <span className="text-4xl mb-3">🔗</span>
                <span className="font-display font-bold text-purple-800">Connections</span>
              </button>

              <button 
                onClick={() => setGameMode('writing')}
                className="flex flex-col items-center p-6 bg-orange-50 border-2 border-orange-200 rounded-2xl hover:bg-orange-100 transition-all hover:scale-105 active:scale-95"
              >
                <span className="text-4xl mb-3">✍️</span>
                <span className="font-display font-bold text-orange-800">Writing AI</span>
              </button>

              <button 
                onClick={() => setGameMode('reading')}
                className="flex flex-col items-center p-6 bg-teal-50 border-2 border-teal-200 rounded-2xl hover:bg-teal-100 transition-all hover:scale-105 active:scale-95"
              >
                <span className="text-4xl mb-3">📖</span>
                <span className="font-display font-bold text-teal-800">Reading</span>
              </button>

              <button 
                onClick={() => setGameMode('linguistics')}
                className="flex flex-col items-center p-6 bg-emerald-50 border-2 border-emerald-200 rounded-2xl hover:bg-emerald-100 transition-all hover:scale-105 active:scale-95 sm:col-span-2 md:col-span-4"
              >
                <span className="text-4xl mb-3">🌟</span>
                <span className="font-display font-bold text-emerald-800 text-lg">Linguistic Quest</span>
                <p className="text-xs text-gray-500 mt-1">Master Synonyms, Antonyms, and Homophones with instant explanations!</p>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Quiz Dashboard Row */}
          <div className="glass-panel p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button onClick={() => setGameMode(null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors mr-2">
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-3xl">🎯</span>
              <div>
                <h3 className="font-display text-xl text-emerald-800 font-bold">Quiz Land</h3>
                <p className="text-xs text-gray-500 font-medium">Difficulty Level: <span className="text-emerald-600 font-bold">{mode.name}</span></p>
              </div>
            </div>

            <div className="flex items-center gap-6 w-full md:w-auto justify-end">
              <div className="text-right">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Session Reward</span>
            <span className="font-display text-lg text-emerald-600 font-bold">+{sessionScore} XP</span>
          </div>
        </div>
      </div>

      {/* Main Game Stage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Interactive Guide: Teacher Yuva */}
        <div className="glass-panel p-6 flex flex-col items-center justify-center text-center relative overflow-hidden h-[380px]">
          <div className="absolute w-40 h-40 bg-emerald-100 rounded-full blur-2xl opacity-75 -z-10 animate-pulse" />

          <AnimatePresence mode="wait">
            {yuvaState === 'thinking' && (
              <motion.img key="thinking" src="https://i.ibb.co/2LHv23q/thinking-removebg-preview.png" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-48 h-48 object-contain drop-shadow-lg mb-4" alt="Teacher Yuva Thinking" />
            )}
            {yuvaState === 'celebrating' && (
              <motion.img key="celebrating" src="https://i.ibb.co/XrJtHGh5/celebrating-removebg-preview.png" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-48 h-48 object-contain drop-shadow-lg mb-4 animate-bounce" alt="Teacher Yuva Celebrating" />
            )}
            {yuvaState === 'pointing' && (
              <motion.img key="pointing" src="https://i.ibb.co/vyq6B8w/teacher-icon-removebg-preview.png" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-48 h-48 object-contain drop-shadow-lg mb-4" alt="Teacher Yuva Pointing" />
            )}
            {yuvaState === 'wrong' && (
              <motion.img key="wrong" src="https://i.ibb.co/GQJfF6Vk/wrong-answer.png" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-48 h-48 object-contain drop-shadow-lg mb-4" alt="Teacher Yuva Wrong" />
            )}
            {yuvaState === 'waving' && (
              <motion.img key="waving" src="https://i.ibb.co/vyq6B8w/teacher-icon-removebg-preview.png" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="w-48 h-48 object-contain drop-shadow-lg mb-4" alt="Teacher Yuva Waving" />
            )}
          </AnimatePresence>

          <h4 className="font-display text-lg text-emerald-800 font-bold mb-1">Teacher Yuva</h4>
          <p className="text-xs text-gray-600 font-semibold px-2 italic leading-relaxed">
            {yuvaState === 'thinking' && '"Analyze the clues carefully before choosing!"'}
            {yuvaState === 'celebrating' && '"Excellent! Your magical forest trees are blooming green!"'}
            {yuvaState === 'pointing' && '"Oops! Look closely at the hints. Try another!"'}
          </p>
        </div>

        {/* Question Panel */}
        <div className="md:col-span-2 glass-panel p-6 flex flex-col justify-between min-h-[380px] relative">
          
          {mode.hasTimer && gameMode === 'match' && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full text-rose-600 font-bold text-xs shadow-sm">
              <Timer className="w-4 h-4 animate-spin" />
              <span>{timerCount}s Remaining</span>
            </div>
          )}

          <div className="space-y-4">
            {['match', 'unscramble', 'listen', 'bonus'].includes(gameMode || '') && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest block w-max ${gameMode === 'match' ? 'bg-emerald-100 text-emerald-800' : gameMode === 'unscramble' ? 'bg-amber-100 text-amber-800' : gameMode === 'listen' ? 'bg-sky-100 text-sky-800' : 'bg-indigo-100 text-indigo-800'}`}>
                {gameMode === 'match' ? 'Meaning Match' : gameMode === 'unscramble' ? 'Unscramble Challenge' : gameMode === 'listen' ? 'Listen & Spell' : 'Bonus: Spell Check'}
              </span>
            )}

            {targetWord && gameMode === 'match' && (
              <div className="text-center md:text-left">
                <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Meaning Of:</h3>
                <h2 className="font-display text-4xl text-emerald-900 font-bold capitalize select-none drop-shadow-xs inline-block bg-emerald-50 px-5 py-1.5 rounded-2xl border-2 border-emerald-100 border-dashed">
                  {targetWord.word}
                </h2>
              </div>
            )}
            
            {targetWord && gameMode === 'unscramble' && (
              <div className="text-center md:text-left">
                <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Unscramble this word:</h3>
                <h2 className="font-display text-4xl tracking-[0.2em] text-amber-600 font-bold uppercase select-none drop-shadow-xs inline-block bg-amber-50 px-5 py-1.5 rounded-2xl border-2 border-amber-200 border-dashed">
                  {scrambledWord}
                </h2>
                <p className="text-xs text-gray-500 mt-2 font-medium bg-gray-50 inline-block px-3 py-1 rounded-lg">Hint: {targetWord.meaning}</p>
              </div>
            )}

            {targetWord && gameMode === 'listen' && (
              <div className="text-center md:text-left">
                <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Listen & Spell the word:</h3>
                <button 
                  onClick={() => {
                     const u = new SpeechSynthesisUtterance(targetWord.word);
                     u.lang = 'en-US';
                     window.speechSynthesis.speak(u);
                  }}
                  className="bg-sky-100 hover:bg-sky-200 text-sky-700 p-4 rounded-full transition-colors mb-4 inline-block"
                >
                  <Volume2 className="w-8 h-8" />
                </button>
                <div className="w-full"></div>
                <p className="text-sm text-gray-500 mt-1 font-medium bg-sky-50 inline-block px-3 py-1 rounded-lg border border-sky-100">Meaning: {targetWord.meaning}</p>
              </div>
            )}

            {targetWord && gameMode === 'bonus' && (
              <div className="text-center md:text-left">
                <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Select the correctly spelled word:</h3>
                <p className="text-sm text-gray-500 mt-1 font-medium bg-indigo-50 inline-block px-3 py-1 rounded-lg border border-indigo-100">Meaning: {targetWord.meaning}</p>
              </div>
            )}
          </div>

          {/* Interaction Area */}
          <div className="my-4">
            {gameMode === 'match' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {options.map((opt) => {
                  const isTarget = opt.code === targetWord?.code;
                  const isSelected = selectedOption === opt.code;
                  
                  let btnClass = "bg-white border-4 border-gray-200/80 text-gray-700 hover:bg-emerald-50/50 hover:border-emerald-300";
                  if (hasAnswered) {
                    if (isTarget) btnClass = "bg-emerald-500 border-emerald-600 text-white";
                    else if (isSelected) btnClass = "bg-rose-500 border-rose-600 text-white";
                    else btnClass = "bg-gray-100 border-gray-200 text-gray-400 opacity-60";
                  }

                  return (
                    <button key={opt.code} disabled={hasAnswered} onClick={() => handleAnswer(opt.code, isTarget)} className={`w-full py-3 px-4 rounded-2xl font-body font-bold text-sm text-left transition-all flex items-center justify-between outline-none ${btnClass}`}>
                      <span className="leading-tight">{opt.meaning}</span>
                      {hasAnswered && isTarget && <Check className="w-4 h-4 text-white shrink-0" />}
                      {hasAnswered && isSelected && !isTarget && <X className="w-4 h-4 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {gameMode === 'bonus' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {options.map((opt, i) => {
                  const isTarget = opt.isCorrect;
                  const isSelected = selectedOption === opt.word;
                  
                  let btnClass = "bg-white border-4 border-indigo-100 text-indigo-900 hover:bg-indigo-50/50 hover:border-indigo-300";
                  if (hasAnswered) {
                    if (isTarget) btnClass = "bg-emerald-500 border-emerald-600 text-white";
                    else if (isSelected) btnClass = "bg-rose-500 border-rose-600 text-white";
                    else btnClass = "bg-gray-100 border-gray-200 text-gray-400 opacity-60";
                  }

                  return (
                    <button key={i} disabled={hasAnswered} onClick={() => handleAnswer(opt.word, isTarget)} className={`w-full py-4 px-4 rounded-2xl font-display text-xl text-center font-bold transition-all outline-none ${btnClass}`}>
                      {opt.word}
                    </button>
                  );
                })}
              </div>
            )}

            {gameMode === 'unscramble' && (
              <form onSubmit={checkUnscramble} className="flex flex-col gap-3">
                <input 
                  type="text" 
                  value={unscrambleInput}
                  onChange={(e) => setUnscrambleInput(e.target.value)}
                  disabled={hasAnswered}
                  placeholder="Type the correct word..."
                  className="w-full bg-amber-50/50 border-4 border-amber-200 rounded-2xl py-3 px-5 text-xl font-bold focus:outline-none focus:border-amber-500 text-amber-900 shadow-inner"
                />
                {!hasAnswered && (
                  <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-2xl shadow-md border border-amber-400">
                    Check Answer
                  </button>
                )}
              </form>
            )}

            {gameMode === 'listen' && (
              <form onSubmit={checkUnscramble} className="flex flex-col gap-3">
                <input 
                  type="text" 
                  value={unscrambleInput}
                  onChange={(e) => setUnscrambleInput(e.target.value)}
                  disabled={hasAnswered}
                  placeholder="Type what you hear..."
                  className="w-full bg-sky-50/50 border-4 border-sky-200 rounded-2xl py-3 px-5 text-xl font-bold focus:outline-none focus:border-sky-500 text-sky-900 shadow-inner"
                />
                {!hasAnswered && (
                  <button type="submit" className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-2xl shadow-md border border-sky-400">
                    Check Spelling
                  </button>
                )}
              </form>
            )}
          </div>


            {gameMode === 'spelling' && targetWord && (
              <GameSpellingBee targetWord={targetWord} onAnswer={handleAnswer} disabled={hasAnswered} />
            )}
            
            {gameMode === 'connections' && (
              <GameConnections onAnswer={handleAnswer} disabled={hasAnswered} />
            )}

            {gameMode === 'writing' && targetWord && (
              <GameWriting targetWord={targetWord} onAnswer={handleAnswer} disabled={hasAnswered} />
            )}

            {gameMode === 'reading' && targetWord && (
              <GameReading targetWord={targetWord} onAnswer={handleAnswer} disabled={hasAnswered} />
            )}

            {gameMode === 'linguistics' && (
              <GameLinguistics onAnswer={handleAnswer} disabled={hasAnswered} />
            )}

          {/* Feedback & Proceed Control */}
          <div className="border-t border-gray-100 pt-3 flex justify-between items-center h-12">
            <div>
              {hasAnswered && (
                <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${isCorrect ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {isCorrect ? (
                    <>🎉 Correct! Forest levels grown!</>
                  ) : (
                    <>🔍 Incorrect. The correct word is {targetWord.word}.</>
                  )}
                </span>
              )}
            </div>

            {hasAnswered && (
              <motion.button initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={generateQuestion} className="bg-emerald-600 hover:bg-emerald-500 text-white font-display text-sm font-semibold px-6 py-2 rounded-full shadow-md hover:scale-105 active:scale-95 transition-all outline-none">
                Next Case →
              </motion.button>
            )}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
