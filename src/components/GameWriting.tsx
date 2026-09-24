import React, { useState } from 'react';
import { Send, CheckCircle, XCircle } from 'lucide-react';

export default function GameWriting({ targetWord, onAnswer, disabled }: { targetWord: any, onAnswer: (ans: string, correct: boolean) => void, disabled: boolean }) {
  const [sentence, setSentence] = useState('');
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || !sentence.trim() || isEvaluating) return;

    setIsEvaluating(true);
    setAiFeedback("Evaluating your sentence with AI...");
    
    try {
      const response = await fetch('/api/evaluate-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence, targetWord })
      });
      
      const data = await response.json();
      setAiFeedback(data.feedback);
      setIsCorrect(data.correct);
      onAnswer(sentence, data.correct);
    } catch (e) {
      console.error(e);
      // Fallback
      const containsWord = sentence.toLowerCase().includes(targetWord.word.toLowerCase());
      if (containsWord) {
        setAiFeedback("Great job! (Network fallback)");
        setIsCorrect(true);
        onAnswer(sentence, true);
      } else {
        setAiFeedback("Please include the word in your sentence.");
        setIsCorrect(false);
        onAnswer(sentence, false);
      }
    } finally {
      setIsEvaluating(false);
    }
  };


  return (
    <div className="flex flex-col gap-4">
      <div className="text-center md:text-left mb-2">
        <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Write a Sentence:</h3>
        <p className="text-sm text-gray-600 font-medium">Use the word <strong className="text-orange-600">"{targetWord.word}"</strong> ({targetWord.meaning}) in a complete sentence.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea 
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          disabled={disabled}
          placeholder="Type your sentence here..."
          className="w-full bg-orange-50/50 border-4 border-orange-200 rounded-2xl py-3 px-5 text-lg font-medium focus:outline-none focus:border-orange-500 text-orange-900 shadow-inner h-32 resize-none"
        />
        
        
        {aiFeedback && (
          <div className={`p-3 rounded-xl border flex items-start gap-2 ${isEvaluating ? 'bg-orange-50 border-orange-200 text-orange-800' : isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {isEvaluating ? <div className="w-5 h-5 animate-pulse bg-orange-300 rounded-full shrink-0" /> : isCorrect ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
            <span className="text-sm font-semibold">{aiFeedback}</span>
          </div>
        )}


        
        {!disabled && (
          <button type="submit" disabled={isEvaluating} className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-wait text-white font-bold py-3 rounded-2xl shadow-md border border-orange-400 flex justify-center items-center gap-2 transition-all">
            <Send className="w-5 h-5" /> {isEvaluating ? 'Checking...' : 'Submit to AI Teacher'}
          </button>
        )}

      </form>
    </div>
  );
}
