import React, { useState, useEffect } from 'react';
import { vocabularyDb } from '../vocabulary';

export default function GameReading({ targetWord, onAnswer, disabled }: { targetWord: any, onAnswer: (ans: string, correct: boolean) => void, disabled: boolean }) {
  const [options, setOptions] = useState<string[]>([]);
  const [blankSentence, setBlankSentence] = useState('');

  useEffect(() => {
    if (targetWord) {
      // Create fill in the blank from example
      const regex = new RegExp(`(${targetWord.word})`, 'i');
      let sentence = targetWord.example;
      if (!sentence.toLowerCase().includes(targetWord.word.toLowerCase())) {
        sentence = `The meaning is ${targetWord.meaning}, so we use the word ${targetWord.word}.`;
      }
      setBlankSentence(sentence.replace(regex, '_________'));

      const opts = [targetWord.word];
      const shuffledDb = [...vocabularyDb].sort(() => 0.5 - Math.random());
      for (const w of shuffledDb) {
        if (opts.length >= 4) break;
        if (w.word !== targetWord.word) opts.push(w.word);
      }
      setOptions(opts.sort(() => 0.5 - Math.random()));
    }
  }, [targetWord]);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center md:text-left mb-4">
        <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Reading Comprehension:</h3>
        <p className="text-xl text-teal-900 font-medium bg-teal-50 p-4 rounded-xl border-2 border-teal-100 leading-relaxed">
          "{blankSentence}"
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((opt, i) => (
          <button 
            key={i} 
            disabled={disabled} 
            onClick={() => onAnswer(opt, opt === targetWord.word)} 
            className={`w-full py-4 px-4 rounded-2xl font-display text-xl text-center font-bold transition-all outline-none 
              ${disabled ? 
                  (opt === targetWord.word ? "bg-emerald-500 border-4 border-emerald-600 text-white" : "bg-gray-100 border-4 border-gray-200 text-gray-400 opacity-60") 
                  : "bg-white border-4 border-teal-100 text-teal-900 hover:bg-teal-50 hover:border-teal-300"
              }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
