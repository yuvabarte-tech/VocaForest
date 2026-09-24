import React, { useState, useEffect } from 'react';

const CONNECTIONS_DATA = [
  { category: 'Adverbs of Frequency', words: ['Always', 'Usually', 'Sometimes', 'Never'] },
  { category: 'Countries', words: ['Malaysia', 'Britain', 'Mexico', 'Brazil'] },
  { category: 'Sports', words: ['Skateboarding', 'Swimming', 'Chess', 'Badminton'] },
  { category: 'Subjects', words: ['Maths', 'History', 'Science', 'English'] },
  { category: 'Food', words: ['Butter', 'Peach', 'Chocolate', 'Lemonade'] },
  { category: 'Animals', words: ['Squirrel', 'Snail', 'Panda', 'Rhino'] }
];

export default function GameConnections({ onAnswer, disabled }: { onAnswer: (ans: string, correct: boolean) => void, disabled: boolean }) {
  const [tiles, setTiles] = useState<{word: string, category: string, selected: boolean, solved: boolean}[]>([]);
  const [solvedGroups, setSolvedGroups] = useState<{category: string, words: string[]}[]>([]);
  
  useEffect(() => {
    // Pick 4 random categories
    const shuffledCats = [...CONNECTIONS_DATA].sort(() => 0.5 - Math.random()).slice(0, 4);
    const newTiles: {word: string, category: string, selected: boolean, solved: boolean}[] = [];
    
    shuffledCats.forEach(c => {
      c.words.forEach(w => {
        newTiles.push({ word: w, category: c.category, selected: false, solved: false });
      });
    });
    
    setTiles(newTiles.sort(() => 0.5 - Math.random()));
    setSolvedGroups([]);
  }, []);

  const handleTileClick = (index: number) => {
    if (disabled || tiles[index].solved) return;
    
    const newTiles = [...tiles];
    const currentlySelected = newTiles.filter(t => t.selected).length;
    
    if (newTiles[index].selected) {
      newTiles[index].selected = false;
      setTiles(newTiles);
    } else if (currentlySelected < 4) {
      newTiles[index].selected = true;
      setTiles(newTiles);
    }
  };

  const handleCheck = () => {
    const selectedTiles = tiles.filter(t => t.selected);
    if (selectedTiles.length !== 4) return;

    const firstCat = selectedTiles[0].category;
    const allSame = selectedTiles.every(t => t.category === firstCat);

    if (allSame) {
      // Correct group!
      const newSolved = [...solvedGroups, { category: firstCat, words: selectedTiles.map(t => t.word) }];
      setSolvedGroups(newSolved);
      
      const newTiles = tiles.map(t => {
        if (t.selected) return { ...t, selected: false, solved: true };
        return t;
      });
      setTiles(newTiles);
      
      if (newSolved.length === 4) {
        onAnswer("Won Connections!", true);
      }
    } else {
      // Incorrect
      const newTiles = tiles.map(t => ({ ...t, selected: false }));
      setTiles(newTiles);
      // Let's just deduct a little or give feedback, but we'll say incorrect for the whole thing?
      // For simplicity, we just unselect.
    }
  };

  const activeTiles = tiles.filter(t => !t.solved);

  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="text-center w-full mb-2">
        <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Connections</h3>
        <p className="text-sm text-gray-600 font-medium">Find groups of 4 related words.</p>
      </div>

      <div className="w-full flex flex-col gap-2">
        {solvedGroups.map((g, i) => (
          <div key={i} className="bg-purple-200 border-4 border-purple-300 rounded-2xl p-4 text-center">
            <h4 className="font-bold text-purple-900 uppercase tracking-widest">{g.category}</h4>
            <p className="text-purple-700 font-medium mt-1">{g.words.join(', ')}</p>
          </div>
        ))}
      </div>

      {activeTiles.length > 0 && (
        <div className="grid grid-cols-4 gap-2 w-full">
          {tiles.map((t, i) => !t.solved && (
            <button
              key={i}
              onClick={() => handleTileClick(i)}
              className={`aspect-video flex items-center justify-center rounded-xl font-bold text-sm transition-all border-b-4 
                ${t.selected ? 'bg-purple-600 text-white border-purple-800 scale-95' : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'}`}
            >
              {t.word}
            </button>
          ))}
        </div>
      )}

      {activeTiles.length > 0 && (
        <button 
          onClick={handleCheck}
          disabled={tiles.filter(t => t.selected).length !== 4}
          className="mt-4 px-8 py-3 bg-purple-500 disabled:bg-gray-300 text-white font-bold rounded-full transition-all"
        >
          Submit 4 Words
        </button>
      )}
    </div>
  );
}
