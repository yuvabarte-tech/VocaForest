import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function BackgroundAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((err) => {
          console.warn("Autoplay prevented or failed:", err);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    setHasInteracted(true);
  };

  return (
    <div className="fixed bottom-[160px] right-6 z-50">
      <audio
        ref={audioRef}
        src="https://upload.wikimedia.org/wikipedia/commons/4/4b/Enchanted_Valley.ogg"
        loop
      />
      <button 
        onClick={togglePlay}
        className={`bg-white/80 backdrop-blur-sm hover:bg-white text-emerald-800 p-3 rounded-full shadow-lg border-2 border-emerald-100 transition-all hover:scale-110 active:scale-95 relative z-10 ${!hasInteracted ? 'animate-pulse ring-4 ring-emerald-400' : ''}`}
        title={isPlaying ? "Mute Music" : "Play Music"}
      >
        {isPlaying ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
      </button>
    </div>
  );
}
