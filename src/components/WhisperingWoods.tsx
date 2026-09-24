import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, Mic, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';

interface WhisperingWoodsProps {
  student: any;
  onUpdateStudent: (s: any) => void;
}

export default function WhisperingWoods({ student, onUpdateStudent }: WhisperingWoodsProps) {
  const [loading, setLoading] = useState(false);
  const [currentRiddle, setCurrentRiddle] = useState<any>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Load a riddle on mount
  const loadNewRiddle = async () => {
    setLoading(true);
    setShowHint(false);
    setUserAnswer('');
    setEvaluation(null);

    // Personalization: If they have assigned words, let's query a riddle for one of them!
    let targetWordCode = "";
    if (student.assignedWords && student.assignedWords.length > 0) {
      targetWordCode = student.assignedWords[Math.floor(Math.random() * student.assignedWords.length)];
    }

    try {
      const response = await fetch('/api/whispering-woods/riddle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordCode: targetWordCode })
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentRiddle(data);
      }
    } catch (e) {
      console.error("Failed to load riddle", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNewRiddle();

    // Check for web Speech Recognition
    const SpeechReg = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechReg) {
      const rec = new SpeechReg();
      rec.continuous = false;
      rec.lang = 'en-US';
      rec.interimResults = false;

      rec.onresult = (e: any) => {
        const result = e.results[0][0].transcript;
        // Strip ending punctuation
        const cleanResult = result.replace(/[.\-_?]/g, '').trim();
        setUserAnswer(cleanResult);
        setIsListening(false);
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error:", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
      setSpeechSupported(true);
    }
  }, []);

  // Web Text-to-Speech (Feature 4 Audio Immersion)
  const handleSpeakRiddle = () => {
    if (!currentRiddle) return;
    const synth = window.speechSynthesis;
    if (synth) {
      synth.cancel(); // Stop current speech
      const utterance = new SpeechSynthesisUtterance(currentRiddle.riddle);
      
      // Select a matching voice if possible (Hoppy/Nutty: high pitched, Teacher: professional)
      const voices = synth.getVoices();
      if (currentRiddle.character.includes('Teacher') || currentRiddle.character.includes('Yuva')) {
        const matchingVoice = voices.find(v => v.name.includes('Google US English') || v.lang === 'en-US');
        if (matchingVoice) utterance.voice = matchingVoice;
        utterance.pitch = 1.0;
        utterance.rate = 0.9;
      } else {
        utterance.pitch = 1.4; // Squeaky animal voice!
        utterance.rate = 1.05;
      }
      synth.speak(utterance);
    }
  };

  // Start microphone capture
  const handleMicListen = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognition.start();
    }
  };

  // Submit Answer for verification
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;

    try {
      const response = await fetch('/api/whispering-woods/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: student.username,
          wordCode: currentRiddle.wordCode,
          answer: userAnswer.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setEvaluation(data);
        onUpdateStudent(data.student);
      }
    } catch (e) {
      console.error("Evaluation failed:", e);
    }
  };

  const getCharacterEmoji = (char: string) => {
    if (char.includes('Hoppy')) return '🐇';
    if (char.includes('Nutty')) return '🐿️';
    return '🧑‍🏫';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4">
      {/* Intro section */}
      <div className="glass-panel p-5 border-2 border-emerald-200 bg-white/95 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🗣️🌲</span>
          <div>
            <h2 className="font-display text-xl text-emerald-900 font-bold">Whispering Woods Riddle Quest</h2>
            <p className="text-xs text-gray-500 font-medium">Listen to spoken riddles from forest residents and speak or type the secret word!</p>
          </div>
        </div>
        <button
          onClick={loadNewRiddle}
          disabled={loading}
          className="bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 p-2.5 rounded-xl transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Large Character Dialogue Card */}
        <div className="glass-panel p-8 border-4 border-emerald-400 bg-white/95 text-center relative overflow-hidden md:col-span-2 flex flex-col justify-between items-center min-h-[380px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center my-auto">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-500 font-bold text-sm">Whispering to the ancient wood sprites...</p>
            </div>
          ) : currentRiddle ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentRiddle.wordCode}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full flex flex-col items-center flex-1 justify-between"
              >
                {/* Speaker profile header */}
                <div className="flex flex-col items-center">
                  <span className="text-7xl drop-shadow-lg select-none animate-bounce">{getCharacterEmoji(currentRiddle.character)}</span>
                  <h4 className="font-display font-black text-lg text-emerald-950 mt-3">{currentRiddle.character}</h4>
                  <span className="text-[10px] bg-sky-100 text-sky-800 font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-md mt-1">Spoken Riddle Quest</span>
                </div>

                {/* Riddle Bubble */}
                <div className="bg-emerald-50/50 border-2 border-emerald-200 rounded-3xl p-6 my-6 relative max-w-lg text-emerald-950 font-display text-base font-semibold leading-relaxed shadow-sm">
                  <div className="absolute top-4 left-4 text-emerald-300 font-mono text-4xl leading-none">“</div>
                  <p className="px-6">{currentRiddle.riddle}</p>
                  <div className="absolute bottom-4 right-4 text-emerald-300 font-mono text-4xl leading-none">”</div>
                </div>

                {/* Speech synthesizer play button */}
                <button
                  onClick={handleSpeakRiddle}
                  className="bg-sky-500 hover:bg-sky-400 text-white font-bold px-6 py-3 rounded-2xl shadow-md flex items-center gap-2.5 hover:-translate-y-0.5 transition-all outline-none cursor-pointer"
                >
                  <Volume2 className="w-5 h-5 animate-pulse" />
                  Listen to voice riddle!
                </button>
              </motion.div>
            </AnimatePresence>
          ) : (
            <p className="text-gray-400 font-bold my-auto">No riddle loaded.</p>
          )}
        </div>

        {/* Input Answer Panel */}
        <div className="glass-panel p-6 border-2 border-emerald-200 bg-white/95 flex flex-col justify-between min-h-[380px]">
          <div>
            <h3 className="font-display text-sm font-black text-slate-500 uppercase tracking-widest mb-3.5">Submit Your Answer</h3>

            <div className="space-y-4">
              {/* Text answer input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type secret vocabulary word..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={!!evaluation}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-400 rounded-xl pl-4 pr-12 py-3.5 outline-none font-bold font-display text-sm"
                />
                
                {/* Speech Recognition Mic trigger (Feature 4) */}
                {speechSupported && !evaluation && (
                  <button
                    onClick={handleMicListen}
                    className={`absolute right-2 top-1.5 p-2 rounded-lg transition-all ${
                      isListening ? 'bg-rose-500 text-white animate-ping' : 'hover:bg-slate-200 text-slate-500'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isListening && (
                <div className="text-center text-xs font-bold text-rose-500 animate-pulse bg-rose-50 rounded-xl py-2 px-4 border border-rose-100">
                  🎤 Woods are listening! Speak now...
                </div>
              )}

              {/* Reveal hint panel */}
              {currentRiddle && (
                <div>
                  <button 
                    onClick={() => setShowHint(!showHint)}
                    className="text-xs text-sky-600 font-bold flex items-center gap-1 hover:underline outline-none cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    {showHint ? 'Hide Magic Hints' : 'Reveal Magic Hints'}
                  </button>

                  <AnimatePresence>
                    {showHint && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-sky-50 border border-sky-100 rounded-xl p-3 mt-2 space-y-1 overflow-hidden"
                      >
                        {currentRiddle.hints?.map((h: string, i: number) => (
                          <p key={i} className="text-[10px] text-sky-800 font-semibold">• {h}</p>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Evaluation Result Banner */}
            {evaluation && (
              <div className={`mt-5 p-4 rounded-xl border flex items-start gap-2.5 ${
                evaluation.correct ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {evaluation.correct ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                <div>
                  <h4 className="font-display font-extrabold text-xs">{evaluation.correct ? 'Correct! Success!' : 'Incorrect Guess'}</h4>
                  <p className="text-[10px] font-semibold mt-0.5 leading-relaxed">{evaluation.feedback}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-3.5">
            {evaluation ? (
              <button
                onClick={loadNewRiddle}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all outline-none"
              >
                Next Riddle Quest <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitAnswer}
                disabled={!userAnswer.trim()}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.3)] flex items-center justify-center gap-1.5 transition-all outline-none cursor-pointer"
              >
                Cast Secret Word! <Sparkles className="w-4 h-4 animate-spin" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
