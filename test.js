const vocabularyDb = [{code:'V1'},{code:'V2'},{code:'V3'}];
let sessionPlayedWords = [];
const setSessionPlayedWords = (cb) => {
    sessionPlayedWords = cb(sessionPlayedWords);
}
let targetWord;
const setTargetWord = (t) => { targetWord = t; }

const generateQuestion = () => {
    let availableWords = vocabularyDb.filter(w => !sessionPlayedWords.includes(w.code));
    if (availableWords.length === 0) {
      availableWords = vocabularyDb;
      setSessionPlayedWords(() => []); // Reset for next loop
    }

    const target = availableWords[Math.floor(Math.random() * availableWords.length)];
    setTargetWord(target);
    setSessionPlayedWords(prev => [...prev, target.code]);
}

generateQuestion();
console.log(targetWord, sessionPlayedWords);
generateQuestion();
console.log(targetWord, sessionPlayedWords);
