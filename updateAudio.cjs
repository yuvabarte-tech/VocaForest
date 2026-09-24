const fs = require('fs');
let code = fs.readFileSync('src/components/BackgroundAudio.tsx', 'utf8');

code = `
import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import ReactPlayer from 'react-player/youtube';

export default function BackgroundAudio() {
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="fixed top-6 right-6 z-50">
      <div className="hidden">
        <ReactPlayer 
          url="https://www.youtube.com/watch?v=syp6Lsd8HOo" 
          playing={isPlaying} 
          loop={true} 
          volume={0.3}
          width="0"
          height="0"
        />
      </div>
      <button 
        onClick={togglePlay}
        className="bg-white/80 backdrop-blur-sm hover:bg-white text-emerald-800 p-3 rounded-full shadow-lg border-2 border-emerald-100 transition-all hover:scale-110 active:scale-95"
        title={isPlaying ? "Mute Music" : "Play Music"}
      >
        {isPlaying ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
      </button>
    </div>
  );
}
`;

fs.writeFileSync('src/components/BackgroundAudio.tsx', code);
