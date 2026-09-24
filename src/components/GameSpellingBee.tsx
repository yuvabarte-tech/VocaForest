import React, { useState, useEffect } from 'react';
import { Delete, Check } from 'lucide-react';

export default function GameSpellingBee({ targetWord, onAnswer, disabled }: { targetWord: any, onAnswer: (ans: string, correct: boolean) => void, disabled: boolean }) {
  const [jumbled, setJumbled] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');

  useEffect(() => {
    if (targetWord) {
      const letters = targetWord.word.toLowerCase().split('');
      // add 2 random letters to make it harder
      const alphabet = "abcdefghijklmnopqrstuvwxyz";
      letters.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
      letters.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
      setJumbled(letters.sort(() => 0.5 - Math.random()));
      setCurrentInput('');
    }
  }, [targetWord]);

  const handleLetterClick = (letter: string) => {
    if (!disabled) {
      setCurrentInput(prev => prev + letter);
    }
  };

  const handleBackspace = () => {
    if (!disabled) {
      setCurrentInput(prev => prev.slice(0, -1));
    }
  };

  const handleSubmit = () => {
    if (!disabled) {
      const isCorrect = currentInput.toLowerCase() === targetWord.word.toLowerCase();
      onAnswer(currentInput, isCorrect);
    }
  };

  return (
    <div className="flex flex-col gap-6 items-center">
      <div className="text-center w-full">
        <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">Spelling Bee</h3>
        <p className="text-sm text-gray-500 mb-4">Meaning: {targetWord.meaning}</p>
        
        <div className="h-16 w-full max-w-sm mx-auto bg-rose-50 border-4 border-rose-200 rounded-2xl flex items-center justify-center text-3xl font-display font-bold text-rose-800 tracking-[0.2em] uppercase shadow-inner">
          {currentInput}
          {!disabled && <span className="w-1 h-8 bg-rose-400 animate-pulse ml-1" />}
        </div>
      </div>

      <div className="flex flex-wrap justify-center max-w-sm gap-3">
        {jumbled.map((letter, i) => (
          <button
            key={i}
            disabled={disabled}
            onClick={() => handleLetterClick(letter)}
            className="w-12 h-12 bg-white border-2 border-rose-200 rounded-full font-display font-bold text-xl text-rose-700 hover:bg-rose-100 hover:scale-110 active:scale-95 transition-all shadow-sm"
          >
            {letter.toUpperCase()}
          </button>
        ))}
      </div>

      {!disabled && (
        <div className="flex gap-4 w-full max-w-sm">
          <button onClick={handleBackspace} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-2xl flex justify-center items-center gap-2 hover:bg-gray-200">
            <Delete className="w-5 h-5" /> Delete
          </button>
          <button onClick={handleSubmit} className="flex-1 bg-rose-500 text-white font-bold py-3 rounded-2xl flex justify-center items-center gap-2 hover:bg-rose-600 shadow-md">
            <Check className="w-5 h-5" /> Submit
          </button>
        </div>
      )}
    </div>
  );
}
