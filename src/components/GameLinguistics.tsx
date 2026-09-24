import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, HelpCircle, BookOpen, Volume2, ArrowRight } from 'lucide-react';
import { linguisticsQuestions, LinguisticsQuestion } from '../data/linguisticsData';

interface GameLinguisticsProps {
  onAnswer: (selection: string, correct: boolean) => void;
  disabled: boolean;
}

export default function GameLinguistics({ onAnswer, disabled }: GameLinguisticsProps) {
  const [currentQuestion, setCurrentQuestion] = useState<LinguisticsQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintOption, setHintOption] = useState<string | null>(null);

  // Initialize or select random question
  useEffect(() => {
    if (!currentQuestion || !disabled) {
      const randomQ = linguisticsQuestions[Math.floor(Math.random() * linguisticsQuestions.length)];
      setCurrentQuestion(randomQ);
      setSelectedOption(null);
      setShowExplanation(false);
      setHintUsed(false);
      setHintOption(null);
    }
  }, [disabled]);

  if (!currentQuestion) return null;

  const handleSelect = (option: string) => {
    if (disabled) return;
    setSelectedOption(option);
    const isCorrect = option === currentQuestion.correctAnswer;
    setShowExplanation(true);
    onAnswer(option, isCorrect);
  };

  const useHint = () => {
    if (hintUsed || disabled) return;
    setHintUsed(true);
    // Find an incorrect option to remove
    const incorrectOptions = currentQuestion.options.filter(
      opt => opt !== currentQuestion.correctAnswer
    );
    const randomIncorrect = incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)];
    setHintOption(randomIncorrect);
  };

  const speakText = () => {
    const textToSpeak = currentQuestion.type === 'homophone' 
      ? currentQuestion.sentence?.replace('___', currentQuestion.correctAnswer) || ''
      : `${currentQuestion.questionText}. The word is ${currentQuestion.word}`;
    
    const u = new SpeechSynthesisUtterance(textToSpeak);
    u.lang = 'en-US';
    window.speechSynthesis.speak(u);
  };

  // Badge configuration based on question type
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'synonym':
        return {
          label: 'Synonym Quest 🌟',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          desc: 'Find the word with the SAME meaning!'
        };
      case 'antonym':
        return {
          label: 'Antonym Quest 🌓',
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          desc: 'Find the word with the OPPOSITE meaning!'
        };
      case 'homophone':
        return {
          label: 'Homophone Detective 🔍',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          desc: 'Choose the correct spelling for the sentence!'
        };
      default:
        return {
          label: 'Linguistic Challenge',
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          desc: 'Select the correct linguistic option.'
        };
    }
  };

  const config = getTypeConfig(currentQuestion.type);

  return (
    <div id="game-linguistics-root" className="w-full bg-white rounded-3xl p-6 border-4 border-emerald-100 shadow-sm relative overflow-hidden">
      {/* Decorative background circle */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-50 rounded-full -z-10 opacity-60"></div>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-5">
        <div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.bg}`}>
            {config.label}
          </span>
          <p className="text-xs text-gray-400 mt-1 font-medium">{config.desc}</p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={speakText}
            className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-lg transition-all"
            title="Listen to Question"
          >
            <Volume2 className="w-4 h-4 text-emerald-500 animate-pulse" />
            Listen
          </button>
          
          <button 
            type="button"
            onClick={useHint}
            disabled={hintUsed || disabled}
            className="flex items-center gap-1 text-xs bg-amber-50 hover:bg-amber-100 disabled:opacity-40 text-amber-700 font-bold px-3 py-1.5 rounded-lg transition-all border border-amber-200"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Hint
          </button>
        </div>
      </div>

      {/* Main Question Display */}
      <div className="text-center my-6">
        <h4 className="text-gray-500 font-medium text-sm mb-4">{currentQuestion.questionText}</h4>
        
        {currentQuestion.type === 'homophone' ? (
          <div className="bg-amber-50/50 border-2 border-amber-200/50 rounded-2xl py-5 px-6 max-w-xl mx-auto mb-6">
            <span className="font-display text-2xl font-bold text-gray-800 leading-relaxed">
              {currentQuestion.sentence?.split('___').map((part, index, arr) => (
                <React.Fragment key={index}>
                  {part}
                  {index < arr.length - 1 && (
                    <span className="underline decoration-amber-400 decoration-wavy px-3 py-0.5 mx-1 bg-amber-100 rounded-lg text-amber-700">
                      {selectedOption || '___'}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </span>
          </div>
        ) : (
          <div className="bg-emerald-50 border-2 border-emerald-200/60 rounded-3xl py-6 px-8 max-w-sm mx-auto mb-6 shadow-sm hover:rotate-1 transition-all">
            <span className="text-xs text-emerald-600 font-extrabold uppercase tracking-widest block mb-1">Target Word</span>
            <span className="font-display text-4xl font-extrabold text-emerald-800 tracking-tight">
              {currentQuestion.word}
            </span>
          </div>
        )}
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {currentQuestion.options.map((option, i) => {
          const isCorrectOption = option === currentQuestion.correctAnswer;
          const isSelected = selectedOption === option;
          const isEliminated = hintOption === option;

          let optionStyle = "bg-white hover:bg-emerald-50/30 border-2 border-gray-200 text-gray-800";
          
          if (disabled) {
            if (isCorrectOption) {
              optionStyle = "bg-emerald-500 border-emerald-600 text-white shadow-emerald-200";
            } else if (isSelected) {
              optionStyle = "bg-rose-500 border-rose-600 text-white shadow-rose-200";
            } else {
              optionStyle = "bg-gray-50 border-gray-100 text-gray-400 opacity-50";
            }
          } else if (isEliminated) {
            optionStyle = "bg-red-50/30 border-red-100 text-red-300 opacity-40 cursor-not-allowed";
          }

          return (
            <motion.button
              key={i}
              whileHover={!disabled && !isEliminated ? { scale: 1.02 } : {}}
              whileTap={!disabled && !isEliminated ? { scale: 0.98 } : {}}
              disabled={disabled || isEliminated}
              onClick={() => handleSelect(option)}
              className={`w-full py-3.5 px-5 rounded-2xl font-bold transition-all text-base text-center shadow-xs flex items-center justify-between ${optionStyle}`}
            >
              <span className="flex-1 text-center">{option}</span>
              {isEliminated && <span className="text-xs text-red-400 font-medium">Eliminated</span>}
            </motion.button>
          );
        })}
      </div>

      {/* Educational Explanation Box */}
      {showExplanation && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-start gap-3 p-4 rounded-2xl border ${
            selectedOption === currentQuestion.correctAnswer 
              ? 'bg-emerald-50/60 text-emerald-800 border-emerald-200' 
              : 'bg-rose-50/60 text-rose-800 border-rose-200'
          }`}
        >
          <BookOpen className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
          <div>
            <h5 className="font-bold text-sm mb-0.5">
              {selectedOption === currentQuestion.correctAnswer ? '🎉 Brilliant Work!' : '💡 Let\'s Learn!'}
            </h5>
            <p className="text-xs leading-relaxed opacity-90 font-medium">
              {currentQuestion.explanation}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
