import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { vocabularyDb } from '../vocabulary';
import { Search, Volume2, Sparkles, BookOpen, Plus, Coins } from 'lucide-react';

interface MagicJournalProps {
  student?: any;
  onUpdateStudent?: (s: any) => void;
  mode?: 'global' | 'personal';
}

export default function MagicJournal({ student, onUpdateStudent, mode = 'global' }: MagicJournalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [newExample, setNewExample] = useState('');

  // Depending on mode, show different words
  const allWords = useMemo(() => {
    if (mode === 'personal') {
      return student?.journalEntries || [];
    }
    // Global mode: just vocabularyDb
    return vocabularyDb;
  }, [student?.journalEntries, mode]);

  const filteredWords = useMemo(() => {
    const clean = searchTerm.toLowerCase().trim();
    if (!clean) return allWords;
    return allWords.filter(
      (v: any) =>
        v.word.toLowerCase().includes(clean) ||
        v.meaning.toLowerCase().includes(clean) ||
        (v.code && v.code.toLowerCase().includes(clean))
    );
  }, [searchTerm, allWords]);

  const handleSpeak = (word: string, sentence: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const wordUtterance = new SpeechSynthesisUtterance(word);
      wordUtterance.lang = 'en-US';
      wordUtterance.rate = 0.85;

      const sentenceUtterance = new SpeechSynthesisUtterance(sentence);
      sentenceUtterance.lang = 'en-US';
      sentenceUtterance.rate = 0.9;

      window.speechSynthesis.speak(wordUtterance);
      setTimeout(() => {
        window.speechSynthesis.speak(sentenceUtterance);
      }, 900);
    } else {
      alert("Text-to-speech is not supported on this device/browser.");
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newMeaning.trim() || !student || !onUpdateStudent) return;

    const entry = {
      code: `MY-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      word: newWord.trim(),
      meaning: newMeaning.trim(),
      example: newExample.trim(),
      pronunciation: `/${newWord.trim().toLowerCase()}/`
    };

    try {
      const response = await fetch('/api/student/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: student.username, 
          xpGained: 10, // 10 points for adding a word
          newJournalEntry: entry
        })
      });

      if (response.ok) {
        const data = await response.json();
        onUpdateStudent(data.student);
        setNewWord('');
        setNewMeaning('');
        setNewExample('');
        setShowAddForm(false);
      }
    } catch (e) {
      console.error("Failed to add word", e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Card */}
      <div className="glass-panel p-6 flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{mode === 'personal' ? '📒' : '📖'}</span>
          <div>
            <h2 className="font-display text-3xl text-emerald-800 font-bold">
              {mode === 'personal' ? 'My Personal Journal' : 'Woodland Magic Journal'}
            </h2>
            <p className="text-xs text-gray-500 font-medium">Browse and listen to {mode === 'personal' ? 'your added words.' : `all ${allWords.length} words.`}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search words..."
              className="w-full bg-emerald-50/50 border-4 border-emerald-100 rounded-2xl py-2 pl-12 pr-4 text-base focus:outline-none focus:border-emerald-500 focus:bg-white font-body font-semibold text-emerald-900 shadow-inner"
            />
          </div>
          
          {student && mode === 'personal' && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all border-2 border-emerald-400 shadow-md"
            >
              <Plus className="w-5 h-5" /> Add Word (+10 XP)
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-panel p-6 bg-emerald-50/90 border-4 border-emerald-300">
              <h3 className="font-display text-xl text-emerald-800 font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" /> Discover a New Word
              </h3>
              <form onSubmit={handleAddWord} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Word"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  className="w-full bg-white border-2 border-emerald-200 rounded-xl py-2 px-4 focus:outline-none focus:border-emerald-500 font-semibold text-emerald-900"
                  required
                />
                <input
                  type="text"
                  placeholder="Meaning"
                  value={newMeaning}
                  onChange={(e) => setNewMeaning(e.target.value)}
                  className="w-full bg-white border-2 border-emerald-200 rounded-xl py-2 px-4 focus:outline-none focus:border-emerald-500 font-semibold text-emerald-900"
                  required
                />
                <input
                  type="text"
                  placeholder="Example Sentence"
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  className="w-full bg-white border-2 border-emerald-200 rounded-xl py-2 px-4 focus:outline-none focus:border-emerald-500 font-semibold text-emerald-900"
                  required
                />
                <button
                  type="submit"
                  className="md:col-span-3 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-5 h-5" /> Save to Journal
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of Word Cards */}
      {filteredWords.length === 0 ? (
        <div className="glass-panel p-12 text-center border-4 border-dashed border-gray-300 bg-white/90">
          <span className="text-5xl">🧐</span>
          <h3 className="font-display text-2xl text-gray-600 mt-4 font-bold">No words match your search</h3>
          <p className="text-xs text-gray-400 font-medium mt-1">Try spelling another word, or browse the categories!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {filteredWords.map((v: any) => {
              const isSelected = selectedWord === v.code;
              return (
                <motion.div
                  key={v.code}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedWord(isSelected ? null : v.code)}
                  className={`cursor-pointer glass-panel p-5 border-b-8 transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/90 shadow-lg'
                      : 'border-emerald-500 bg-white/95 hover:bg-emerald-50/30'
                  }`}
                >
                  <div>
                    {/* Code & Speak Button */}
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                        {v.code.startsWith('MY-') ? 'MY WORD' : v.code}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSpeak(v.word, v.example);
                        }}
                        className="w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-500 hover:text-white text-emerald-700 flex items-center justify-center transition-colors shadow-sm focus:outline-none"
                        title="Listen Pronunciation"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Word */}
                    <h3 className="font-display text-2xl text-amber-800 font-bold capitalize">
                      {v.word}
                    </h3>
                    
                    {/* Phonetic Pronunciation */}
                    <span className="text-xs text-gray-400 font-mono tracking-wide">
                      {v.pronunciation}
                    </span>

                    {/* Meaning */}
                    <p className="text-sm text-gray-600 font-semibold mt-3 bg-emerald-50/40 p-2 rounded-xl border border-emerald-100/50">
                      {v.meaning}
                    </p>
                  </div>

                  {/* Context Example Sentence */}
                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <span className="text-[10px] text-amber-600 font-bold uppercase block mb-1">
                      Usage Sentence:
                    </span>
                    <p className="text-xs text-gray-700 font-medium italic leading-relaxed">
                      "{v.example}"
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
