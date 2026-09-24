import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  BookOpen, 
  Volume2, 
  Sparkles, 
  CheckCircle2, 
  Award, 
  Lightbulb, 
  Lock, 
  Brain, 
  RefreshCw, 
  BookMarked,
  Hash,
  HelpCircle,
  Zap,
  Tag
} from 'lucide-react';

interface ThesaurusActivityProps {
  student: any;
  onUpdateStudent: (s: any) => void;
}

export default function ThesaurusActivity({ student, onUpdateStudent }: ThesaurusActivityProps) {
  // Form State for Active Classroom Dictionary Inquiry
  const [word, setWord] = useState('');
  const [pageNumber, setPageNumber] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('Noun');
  const [userDefinition, setUserDefinition] = useState('');
  const [userSynonyms, setUserSynonyms] = useState('');
  const [userAntonyms, setUserAntonyms] = useState('');
  const [originalSentence, setOriginalSentence] = useState('');
  const [classroomNote, setClassroomNote] = useState('');
  const [memoryHook, setMemoryHook] = useState('');

  // Auxiliary state
  const [referenceData, setReferenceData] = useState<any>(null);
  const [fetchingReference, setFetchingReference] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSubmittedFeedback, setLastSubmittedFeedback] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'entry' | 'vault'>('entry');

  // Popular classroom word suggestions
  const classroomWordSuggestions = [
    { word: 'Resilient', pos: 'Adjective', pageHint: 'Page 412' },
    { word: 'Curiosity', pos: 'Noun', pageHint: 'Page 188' },
    { word: 'Illuminate', pos: 'Verb', pageHint: 'Page 294' },
    { word: 'Flourish', pos: 'Verb', pageHint: 'Page 230' },
    { word: 'Ecosystem', pos: 'Noun', pageHint: 'Page 205' },
    { word: 'Harmony', pos: 'Noun', pageHint: 'Page 270' }
  ];

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  // Text to Speech
  const speakWord = (textToSpeak: string) => {
    if ('speechSynthesis' in window && textToSpeak) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Fetch optional AI Reference to help student compare what they found
  const handleFetchReference = async () => {
    if (!word || !word.trim()) {
      showToast("Please enter a word first!", "error");
      return;
    }
    setFetchingReference(true);
    try {
      const response = await fetch('/api/thesaurus/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.trim() })
      });
      if (response.ok) {
        const data = await response.json();
        setReferenceData(data);
        showToast(`AI Dictionary Guide loaded reference entry for "${data.word}"!`);
      } else {
        showToast("Could not load AI reference guide.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Error loading reference guide.", "error");
    } finally {
      setFetchingReference(false);
    }
  };

  // Submit Inquiry Log
  const handleSubmitInquiryEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!word.trim()) {
      showToast("Please enter the word you looked up!", "error");
      return;
    }
    if (!pageNumber.trim()) {
      showToast("Please enter the Dictionary Page Number (e.g. Page 245) to prove your lookup!", "error");
      return;
    }
    if (!userDefinition.trim()) {
      showToast("Please write out the definition you found in the dictionary!", "error");
      return;
    }

    setSaving(true);
    setLastSubmittedFeedback(null);

    try {
      const response = await fetch('/api/student/inquiry-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: student.username,
          word: word.trim(),
          pageNumber: pageNumber.trim(),
          partOfSpeech,
          definition: userDefinition.trim(),
          synonyms: userSynonyms,
          antonyms: userAntonyms,
          classroomNote: classroomNote.trim(),
          originalSentence: originalSentence.trim(),
          memoryHook: memoryHook.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        onUpdateStudent(data.student);
        setLastSubmittedFeedback(data.inquiryRecord?.aiFeedback || null);
        showToast(`🎉 Verified! Word "${word}" (Page ${pageNumber}) locked into long-term memory! +25 XP awarded!`, "success");

        // Keep word loaded for feedback view, but reset after user acknowledges or changes
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast(errData.error || "Failed to save inquiry entry.", "error");
      }
    } catch (e) {
      console.error("Submit inquiry entry error:", e);
      showToast("Network error saving entry", "error");
    } finally {
      setSaving(false);
    }
  };

  // Clear form for a fresh word search
  const handleNewEntry = () => {
    setWord('');
    setPageNumber('');
    setPartOfSpeech('Noun');
    setUserDefinition('');
    setUserSynonyms('');
    setUserAntonyms('');
    setOriginalSentence('');
    setClassroomNote('');
    setMemoryHook('');
    setReferenceData(null);
    setLastSubmittedFeedback(null);
  };

  const inquiryEntries = student?.inquiryEntries || [];

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-display font-bold text-base border-2 ${
              toast.type === 'success'
                ? 'bg-emerald-500 text-white border-emerald-300'
                : 'bg-rose-500 text-white border-rose-300'
            }`}
          >
            <Sparkles className="w-6 h-6 animate-spin" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-900 to-indigo-950 p-8 text-white shadow-2xl border-4 border-emerald-400/30">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-300 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
              <Brain className="w-4 h-4 text-emerald-300" /> Active Inquiry Learning
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-black tracking-wide text-white drop-shadow-md">
              Classroom Dictionary & Thesaurus Log
            </h2>
            <p className="text-emerald-100/90 text-sm md:text-base font-body max-w-2xl leading-relaxed">
              Found a word in your school or classroom dictionary? Record your self-discovered entry below—including the <strong>Dictionary Page Number</strong>—to prove your lookup research and lock the word into your long-term memory!
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2 text-amber-300 font-display font-bold text-lg">
              <Award className="w-6 h-6 text-amber-400" /> +25 XP Per Discovery
            </div>
            <p className="text-xs text-emerald-200">
              Inquiry Memory Vault: <span className="font-bold text-white">{inquiryEntries.length} Words Logged</span>
            </p>
          </div>
        </div>

        {/* Tab Switching */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
          <button
            onClick={() => setActiveTab('entry')}
            className={`px-5 py-2.5 rounded-xl font-display font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'entry'
                ? 'bg-emerald-400 text-emerald-950 shadow-lg scale-105'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Log My Dictionary Search
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`px-5 py-2.5 rounded-xl font-display font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'vault'
                ? 'bg-emerald-400 text-emerald-950 shadow-lg scale-105'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <BookMarked className="w-4 h-4" /> My Inquiry Vault ({inquiryEntries.length})
          </button>
        </div>
      </div>

      {activeTab === 'entry' && (
        <div className="space-y-6">
          {/* AI Teacher Feedback Alert (If just submitted) */}
          {lastSubmittedFeedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-amber-50 to-emerald-50 border-4 border-emerald-400 p-6 rounded-3xl shadow-xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500 text-white rounded-2xl shadow-md">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-black text-emerald-950">
                      Inquiry Entry Verified! (+25 XP)
                    </h3>
                    <p className="text-xs font-bold text-emerald-700">
                      Accuracy Rating: <span className="text-emerald-900 bg-emerald-200 px-2 py-0.5 rounded-lg">{lastSubmittedFeedback.definitionAccuracy}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleNewEntry}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  + Log Another Word
                </button>
              </div>

              <p className="text-sm font-body font-semibold text-emerald-950 bg-white/80 p-3.5 rounded-2xl border border-emerald-200">
                💬 <strong>AI Teacher Feedback:</strong> "{lastSubmittedFeedback.praise}"
              </p>

              {lastSubmittedFeedback.suggestedRefinement && (
                <p className="text-xs font-medium text-amber-900 bg-amber-100/80 p-3 rounded-xl border border-amber-200">
                  💡 <strong>Refinement Tip:</strong> {lastSubmittedFeedback.suggestedRefinement}
                </p>
              )}

              {lastSubmittedFeedback.memoryTip && (
                <p className="text-xs font-medium text-teal-900 bg-teal-100/80 p-3 rounded-xl border border-teal-200 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-teal-700 flex-shrink-0" />
                  <span><strong>Memory Hook:</strong> {lastSubmittedFeedback.memoryTip}</span>
                </p>
              )}
            </motion.div>
          )}

          {/* Core Student Entry Form */}
          <div className="bg-white/95 backdrop-blur-md p-6 md:p-8 rounded-3xl border-4 border-emerald-200 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-100 pb-5">
              <div>
                <h3 className="font-display text-2xl font-black text-emerald-950 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-emerald-600" /> Enter Your Classroom Dictionary Lookup
                </h3>
                <p className="text-xs font-semibold text-emerald-700 mt-1">
                  Fill in what you found in the dictionary at school to store it into your long-term memory.
                </p>
              </div>

              {/* Quick Classroom Helper Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Quick Suggestions:</span>
                {classroomWordSuggestions.slice(0, 4).map((s) => (
                  <button
                    key={s.word}
                    type="button"
                    onClick={() => {
                      setWord(s.word);
                      setPartOfSpeech(s.pos);
                      setPageNumber(s.pageHint);
                    }}
                    className="bg-emerald-100 hover:bg-emerald-500 hover:text-white text-emerald-950 text-xs font-display font-bold px-2.5 py-1 rounded-xl border border-emerald-200 transition-all cursor-pointer"
                  >
                    + {s.word}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmitInquiryEntry} className="space-y-6">
              {/* Row 1: Word + Page Number (Mandatory!) + Part of Speech */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                {/* Word */}
                <div className="sm:col-span-5 space-y-1">
                  <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                    Word Looked Up <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={word}
                      onChange={(e) => setWord(e.target.value)}
                      placeholder="e.g. Resilient, Flourish..."
                      className="w-full bg-emerald-50/50 border-2 border-emerald-200 rounded-2xl py-3 px-4 font-display font-bold text-base text-emerald-950 focus:outline-none focus:border-emerald-500"
                      required
                    />
                    {word && (
                      <button
                        type="button"
                        onClick={() => speakWord(word)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 hover:text-emerald-800 p-1"
                        title="Listen"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dictionary Page Number (Proves physical search!) */}
                <div className="sm:col-span-4 space-y-1">
                  <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-amber-600" /> Dictionary Page No. <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={pageNumber}
                    onChange={(e) => setPageNumber(e.target.value)}
                    placeholder="e.g. Page 412 or p. 188"
                    className="w-full bg-amber-50/60 border-2 border-amber-300 rounded-2xl py-3 px-4 font-display font-bold text-base text-amber-950 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                {/* Part of Speech */}
                <div className="sm:col-span-3 space-y-1">
                  <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    Part of Speech
                  </label>
                  <select
                    value={partOfSpeech}
                    onChange={(e) => setPartOfSpeech(e.target.value)}
                    className="w-full bg-emerald-50/50 border-2 border-emerald-200 rounded-2xl py-3 px-3 font-display font-bold text-sm text-emerald-950 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Noun">Noun</option>
                    <option value="Verb">Verb</option>
                    <option value="Adjective">Adjective</option>
                    <option value="Adverb">Adverb</option>
                    <option value="Preposition">Preposition</option>
                    <option value="Conjunction">Conjunction</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Definition Found in Dictionary */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                    Definition Found in Dictionary <span className="text-rose-500">*</span>
                  </label>
                  
                  {/* Option to load reference guide */}
                  <button
                    type="button"
                    onClick={handleFetchReference}
                    disabled={fetchingReference || !word.trim()}
                    className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    {fetchingReference ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-500" />}
                    <span>Check AI Dictionary Guide</span>
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={userDefinition}
                  onChange={(e) => setUserDefinition(e.target.value)}
                  placeholder="Write the definition as you found it in your school dictionary..."
                  className="w-full bg-emerald-50/30 border-2 border-emerald-200 rounded-2xl py-3 px-4 text-sm font-semibold text-emerald-950 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* AI Reference Comparison Panel (If loaded) */}
              {referenceData && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-teal-50 border-2 border-teal-200 p-4 rounded-2xl space-y-2 text-xs"
                >
                  <p className="font-bold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-600" /> Reference Dictionary Entry for "{referenceData.word}":
                  </p>
                  <p className="text-teal-900 font-medium"><strong>Standard Meaning:</strong> {referenceData.meaning}</p>
                  <p className="text-teal-800"><strong>Pronunciation:</strong> {referenceData.pronunciation}</p>
                  {referenceData.synonyms && referenceData.synonyms.length > 0 && (
                    <p className="text-teal-900"><strong>Suggested Synonyms:</strong> {referenceData.synonyms.join(', ')}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (!userDefinition) setUserDefinition(referenceData.meaning);
                      if (!userSynonyms && referenceData.synonyms) setUserSynonyms(referenceData.synonyms.join(', '));
                      if (!userAntonyms && referenceData.antonyms) setUserAntonyms(referenceData.antonyms.join(', '));
                    }}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1 rounded-lg text-[11px] mt-1 cursor-pointer"
                  >
                    Use as Helper Reference
                  </button>
                </motion.div>
              )}

              {/* Row 3: Synonyms & Antonyms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-teal-900 uppercase tracking-wider">
                    Synonyms Discovered (Similar Meaning)
                  </label>
                  <input
                    type="text"
                    value={userSynonyms}
                    onChange={(e) => setUserSynonyms(e.target.value)}
                    placeholder="e.g. Tough, strong, durable (separated by commas)"
                    className="w-full bg-teal-50/40 border-2 border-teal-200 rounded-2xl py-2.5 px-4 text-sm font-semibold text-teal-950 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider">
                    Antonyms Discovered (Opposite Meaning)
                  </label>
                  <input
                    type="text"
                    value={userAntonyms}
                    onChange={(e) => setUserAntonyms(e.target.value)}
                    placeholder="e.g. Weak, fragile, delicate (separated by commas)"
                    className="w-full bg-rose-50/40 border-2 border-rose-200 rounded-2xl py-2.5 px-4 text-sm font-semibold text-rose-950 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Row 4: My Original Sentence */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  My Original Sentence
                </label>
                <textarea
                  rows={2}
                  value={originalSentence}
                  onChange={(e) => setOriginalSentence(e.target.value)}
                  placeholder="Write a sentence showing how you use this word in your own writing..."
                  className="w-full bg-emerald-50/30 border-2 border-emerald-200 rounded-2xl py-2.5 px-4 text-sm font-semibold text-emerald-950 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Row 5: Memory Hook & Classroom Context */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    Classroom Discovery Context
                  </label>
                  <input
                    type="text"
                    value={classroomNote}
                    onChange={(e) => setClassroomNote(e.target.value)}
                    placeholder="e.g. Science lesson on ecosystems with Mr. Yuva"
                    className="w-full bg-emerald-50/30 border-2 border-emerald-200 rounded-2xl py-2.5 px-4 text-xs font-semibold text-emerald-950 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" /> Personal Memory Hook
                  </label>
                  <input
                    type="text"
                    value={memoryHook}
                    onChange={(e) => setMemoryHook(e.target.value)}
                    placeholder="e.g. Reminds me of an oak tree bouncing back after a storm"
                    className="w-full bg-amber-50/40 border-2 border-amber-200 rounded-2xl py-2.5 px-4 text-xs font-semibold text-amber-950 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 hover:from-emerald-700 hover:to-indigo-800 text-white font-display font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 text-base cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Lock className="w-5 h-5 text-amber-300" />
                )}
                <span>🔒 Submit Dictionary Entry & Lock Memory (+25 XP)</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Vault Tab: All Saved Inquiry Entries */}
      {activeTab === 'vault' && (
        <div className="space-y-6">
          <div className="bg-white/95 backdrop-blur-md p-6 md:p-8 border-4 border-emerald-200 rounded-3xl shadow-xl">
            <div className="flex items-center justify-between mb-6 border-b border-emerald-100 pb-4">
              <div>
                <h3 className="font-display text-2xl font-black text-emerald-900 flex items-center gap-2">
                  <BookMarked className="w-6 h-6 text-emerald-600" /> My Inquiry Memory Vault
                </h3>
                <p className="text-xs font-semibold text-emerald-700">
                  Review all dictionary lookups and classroom inquiry entries you recorded.
                </p>
              </div>

              <span className="bg-emerald-100 text-emerald-900 text-xs font-display font-bold px-3.5 py-1.5 rounded-xl border border-emerald-300">
                {inquiryEntries.length} Saved Entries
              </span>
            </div>

            {inquiryEntries.length === 0 ? (
              <div className="text-center py-12 bg-emerald-50/50 rounded-3xl border-2 border-dashed border-emerald-200 p-8 space-y-3">
                <Brain className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="font-display text-lg font-bold text-emerald-900">No Dictionary Entries Yet</h4>
                <p className="text-xs text-emerald-700 max-w-md mx-auto">
                  When you search for a word in your school or classroom dictionary, log its page number and definition here to start building your long-term memory vault!
                </p>
                <button
                  onClick={() => setActiveTab('entry')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold px-6 py-2.5 rounded-2xl text-xs shadow-md transition-all cursor-pointer mt-2"
                >
                  Log My First Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inquiryEntries.map((entry: any, idx: number) => (
                  <motion.div
                    key={entry.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-5 rounded-2xl border-2 border-emerald-200 shadow-md space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between border-b border-emerald-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display text-2xl font-black text-emerald-950 capitalize">
                            {entry.word}
                          </h4>
                          <button
                            onClick={() => speakWord(entry.word)}
                            className="text-emerald-600 hover:text-emerald-800 p-1"
                            title="Listen"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          {/* Dictionary Page Number Badge */}
                          <span className="bg-amber-100 text-amber-900 text-xs font-display font-extrabold px-2.5 py-0.5 rounded-lg border border-amber-300 flex items-center gap-1">
                            <Hash className="w-3 h-3 text-amber-700" /> Dict {entry.pageNumber || 'Classroom Search'}
                          </span>

                          <span className="bg-teal-100 text-teal-800 text-[11px] font-bold px-2 py-0.5 rounded-md capitalize">
                            {entry.partOfSpeech || 'Word'}
                          </span>
                        </div>
                      </div>

                      <span className="bg-emerald-100 text-emerald-900 text-xs font-display font-bold px-2.5 py-1 rounded-xl border border-emerald-300">
                        +25 XP
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <strong className="text-emerald-800 uppercase font-bold text-[10px] block">Dictionary Definition Logged:</strong>
                        <p className="text-emerald-950 font-medium bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 leading-relaxed">
                          "{entry.definition}"
                        </p>
                      </div>

                      {entry.synonyms && entry.synonyms.length > 0 && (
                        <div>
                          <strong className="text-teal-800 uppercase font-bold text-[10px] block">Synonyms:</strong>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {entry.synonyms.map((syn: string, sIdx: number) => (
                              <span key={sIdx} className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                {syn}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {entry.originalSentence && (
                        <div>
                          <strong className="text-indigo-800 uppercase font-bold text-[10px] block">My Sentence:</strong>
                          <p className="bg-indigo-50/70 p-2 rounded-xl text-indigo-950 italic font-semibold">
                            "{entry.originalSentence}"
                          </p>
                        </div>
                      )}

                      {entry.memoryHook && (
                        <p className="text-amber-900 text-[11px] font-medium flex items-center gap-1">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          <span><strong>Hook:</strong> {entry.memoryHook}</span>
                        </p>
                      )}

                      {entry.aiFeedback && (
                        <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 space-y-1">
                          <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-600" /> AI Guide Feedback:
                          </p>
                          <p className="text-[11px] text-amber-950 font-medium">{entry.aiFeedback.praise}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
