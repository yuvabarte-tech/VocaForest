const fs = require('fs');
let code = fs.readFileSync('src/components/GameWriting.tsx', 'utf8');

const newHandleSubmit = `
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
`;

code = code.replace(
  /const handleSubmit = \(e: React\.FormEvent\) => \{[\s\S]*?^  \};/m,
  newHandleSubmit
);

// Update the aiFeedback div to use isCorrect instead of checking string length and word presence
const newAiFeedbackRender = `
        {aiFeedback && (
          <div className={\`p-3 rounded-xl border flex items-start gap-2 \${isEvaluating ? 'bg-orange-50 border-orange-200 text-orange-800' : isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}\`}>
            {isEvaluating ? <div className="w-5 h-5 animate-pulse bg-orange-300 rounded-full shrink-0" /> : isCorrect ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
            <span className="text-sm font-semibold">{aiFeedback}</span>
          </div>
        )}
`;

code = code.replace(
  /\{aiFeedback && \([\s\S]*?^\s*\)\}/m,
  newAiFeedbackRender
);

const newButtonRender = `
        {!disabled && (
          <button type="submit" disabled={isEvaluating} className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-wait text-white font-bold py-3 rounded-2xl shadow-md border border-orange-400 flex justify-center items-center gap-2 transition-all">
            <Send className="w-5 h-5" /> {isEvaluating ? 'Checking...' : 'Submit to AI Teacher'}
          </button>
        )}
`;

code = code.replace(
  /\{!disabled && \([\s\S]*?^\s*\)\}/m,
  newButtonRender
);

fs.writeFileSync('src/components/GameWriting.tsx', code);
