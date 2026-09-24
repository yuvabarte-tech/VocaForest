import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Sun, Moon, Leaf, CloudRain } from 'lucide-react';

interface ForestCanvasProps {
  xp: number;
  level: number;
  streak?: number;
  perfectScore?: boolean;
}

export default function ForestCanvas({ xp, level, streak = 0, perfectScore = false }: ForestCanvasProps) {
  // Let students manually cast magical spells to override or play with the weather!
  const [selectedWeather, setSelectedWeather] = useState<string>('auto');

  // Determine current active weather theme
  const weatherTheme = useMemo(() => {
    if (selectedWeather !== 'auto') return selectedWeather;
    if (perfectScore) return 'rainbow';
    if (streak >= 5) return 'bioluminescence';
    if (streak === 0) return 'autumn';
    return 'spring';
  }, [selectedWeather, streak, perfectScore]);

  // Seeding pseudo-random generator
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const forestState = useMemo(() => {
    const numTrees = Math.min(45, Math.floor(xp / 15) + 3);
    const numFlowers = Math.min(30, Math.floor(xp / 10));
    const numAnimals = Math.min(10, Math.floor(xp / 80));

    const trees = Array.from({ length: numTrees }).map((_, i) => {
      const seedVal = i * 7.5;
      const x = 5 + seededRandom(seedVal) * 90;
      const y = 45 + seededRandom(seedVal + 1) * 35;
      const scale = 0.6 + seededRandom(seedVal + 2) * 0.8;
      const types = ['pine', 'oak', 'bushy', 'golden'];
      const type = types[Math.floor(seededRandom(seedVal + 3) * types.length)];
      return { id: `tree-${i}`, x, y, scale, type };
    });

    const flowers = Array.from({ length: numFlowers }).map((_, i) => {
      const seedVal = i * 11.2;
      const x = 5 + seededRandom(seedVal) * 90;
      const y = 50 + seededRandom(seedVal + 1) * 40;
      const scale = 0.5 + seededRandom(seedVal + 2) * 0.6;
      const colors = weatherTheme === 'bioluminescence' 
        ? ['#22d3ee', '#f43f5e', '#a855f7', '#38bdf8', '#818cf8', '#f472b6'] // neon neon
        : ['#ec4899', '#f43f5e', '#e11d48', '#fbbf24', '#a855f7', '#6366f1'];
      const color = colors[Math.floor(seededRandom(seedVal + 3) * colors.length)];
      return { id: `flower-${i}`, x, y, scale, color };
    });

    const animalTypes = [
      { name: 'Bunny', icon: '🐇', speed: 2 },
      { name: 'Squirrel', icon: '🐿️', speed: 1.5 },
      { name: 'Deer', icon: '🦌', speed: 4 },
      { name: 'Bird', icon: '🐦', speed: 3 },
      { name: 'Butterfly', icon: '🦋', speed: 1 },
      { name: 'Fox', icon: '🦊', speed: 3.5 }
    ];

    const animals = Array.from({ length: numAnimals }).map((_, i) => {
      const seedVal = i * 23.4;
      const x = 10 + seededRandom(seedVal) * 80;
      const y = 55 + seededRandom(seedVal + 1) * 35;
      const scale = 0.8 + seededRandom(seedVal + 2) * 0.5;
      const animal = animalTypes[i % animalTypes.length];
      return { id: `animal-${i}`, x, y, scale, ...animal };
    });

    return { trees, flowers, animals };
  }, [xp, weatherTheme]);

  // Generate falling particles based on weather
  const particles = useMemo(() => {
    const num = weatherTheme === 'autumn' ? 12 : weatherTheme === 'bioluminescence' ? 20 : 8;
    return Array.from({ length: num }).map((_, i) => ({
      id: `part-${i}`,
      left: `${5 + (i * 91) % 95}%`,
      delay: i * 0.7,
      duration: 6 + (i % 4) * 2,
      size: weatherTheme === 'autumn' ? 14 : 6
    }));
  }, [weatherTheme]);

  // Weather theme styling configurations
  const themeStyles = {
    spring: {
      bg: "bg-gradient-to-b from-sky-300 via-sky-100 to-emerald-200",
      sun: "bg-yellow-400 shadow-[0_0_40px_rgba(250,204,21,0.6)]",
      meadow: "from-emerald-600 to-emerald-500",
      mountain: "text-emerald-800/40",
      hill: "text-emerald-600/50"
    },
    rainbow: {
      bg: "bg-gradient-to-b from-sky-400 via-sky-100 to-emerald-200",
      sun: "bg-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.8)]",
      meadow: "from-emerald-600 to-emerald-500",
      mountain: "text-emerald-800/40",
      hill: "text-emerald-600/50"
    },
    bioluminescence: {
      bg: "bg-gradient-to-b from-slate-950 via-purple-950 to-emerald-950",
      sun: "bg-cyan-300 shadow-[0_0_60px_rgba(34,211,238,0.75)]",
      meadow: "from-emerald-950 to-emerald-900 border-t-cyan-500/30",
      mountain: "text-purple-900/30",
      hill: "text-cyan-950/50"
    },
    autumn: {
      bg: "bg-gradient-to-b from-amber-600 via-amber-200 to-yellow-100",
      sun: "bg-orange-400 shadow-[0_0_30px_rgba(251,146,60,0.5)]",
      meadow: "from-amber-800 to-amber-700",
      mountain: "text-amber-950/20",
      hill: "text-orange-950/30"
    }
  };

  const currentTheme = themeStyles[weatherTheme as keyof typeof themeStyles] || themeStyles.spring;

  return (
    <div className="relative w-full rounded-3xl overflow-hidden border-4 border-emerald-500 shadow-2xl transition-all duration-1000">
      {/* Interactive forest view stage */}
      <div id="visual-forest-stage" className={`relative w-full h-[360px] ${currentTheme.bg} transition-all duration-1000`}>
        
        {/* Sun / Moon Orb */}
        <div className={`absolute top-6 left-12 w-24 h-24 rounded-full blur-xs opacity-90 animate-pulse transition-all duration-1000 ${currentTheme.sun}`} />
        
        {/* Atmospheric overlays */}
        <div className="absolute top-10 right-20 bg-white/40 w-32 h-8 rounded-full blur-xs opacity-80" />
        <div className="absolute top-16 left-40 bg-white/40 w-24 h-6 rounded-full blur-xs opacity-70" />

        {/* 🌈 SVG Rainbow overlay (Feature 3) */}
        {weatherTheme === 'rainbow' && (
          <svg className="absolute inset-0 w-full h-full opacity-60 z-5" viewBox="0 0 400 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="20%" stopColor="#f97316" />
                <stop offset="40%" stopColor="#eab308" />
                <stop offset="60%" stopColor="#22c55e" />
                <stop offset="80%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <path d="M 0,200 Q 200,30 400,200" fill="none" stroke="url(#rainbowGrad)" strokeWidth="24" strokeLinecap="round" />
          </svg>
        )}

        {/* Background Mountains */}
        <div className="absolute bottom-16 left-0 right-0 h-40 flex items-end opacity-60 transition-all duration-1000">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={`w-full h-full transition-all duration-1000 ${currentTheme.mountain}`}>
            <polygon points="0,100 25,20 50,70 75,30 100,100" fill="currentColor" />
          </svg>
        </div>

        {/* Midground Hills */}
        <div className="absolute bottom-6 left-0 right-0 h-32 flex items-end opacity-80 transition-all duration-1000">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={`w-full h-full transition-all duration-1000 ${currentTheme.hill}`}>
            <path d="M0,80 Q30,40 60,70 T100,60 L100,100 L0,100 Z" fill="currentColor" />
          </svg>
        </div>

        {/* Foreground Meadow */}
        <div className={`absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t transition-all duration-1000 ${currentTheme.meadow} border-t-2 border-emerald-400/30`} />

        {/* Dynamic Weather Particles (Autumn leaves, Neon sparkles, or Sun pollen) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-25">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ y: -50, opacity: 0, x: 0 }}
              animate={{ 
                y: 380, 
                opacity: [0, 0.8, 0.8, 0],
                x: weatherTheme === 'autumn' ? [-20, 20, -20] : [-5, 5, -5]
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: "linear"
              }}
              style={{ left: p.left }}
              className="absolute text-center"
            >
              {weatherTheme === 'autumn' ? (
                <span style={{ fontSize: `${p.size}px` }} className="opacity-75">🍁</span>
              ) : weatherTheme === 'bioluminescence' ? (
                <div 
                  className="rounded-full bg-cyan-400 animate-pulse" 
                  style={{ 
                    width: `${p.size}px`, 
                    height: `${p.size}px`, 
                    boxShadow: '0 0 8px #22d3ee' 
                  }} 
                />
              ) : (
                <div 
                  className="rounded-full bg-yellow-200/60" 
                  style={{ width: '4px', height: '4px' }} 
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* 1. Flowers Layer */}
        {forestState.flowers.map((flower) => (
          <motion.div
            key={flower.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: flower.scale, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 100, delay: 0.1 }}
            style={{ left: `${flower.x}%`, top: `${flower.y}%` }}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 12V24" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
              <path d="M12 18Q8 16 10 14" stroke="#10b981" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="5" fill={flower.color} />
              <circle cx="8" cy="12" r="4" fill={flower.color} />
              <circle cx="16" cy="12" r="4" fill={flower.color} />
              <circle cx="12" cy="8" r="4" fill={flower.color} />
              <circle cx="12" cy="16" r="4" fill={flower.color} />
              <circle cx="12" cy="12" r="3.5" fill="#facc15" />
            </svg>
          </motion.div>
        ))}

        {/* 2. Trees Layer */}
        {forestState.trees.map((tree) => (
          <motion.div
            key={tree.id}
            initial={{ scale: 0, y: 50, opacity: 0 }}
            animate={{ scale: tree.scale, y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 80, delay: 0.05 }}
            style={{ left: `${tree.x}%`, top: `${tree.y}%` }}
            className="absolute z-20 -translate-x-1/2 -translate-y-full"
          >
            {tree.type === 'pine' && (
              <svg width="48" height="64" viewBox="0 0 48 64" fill="none">
                <path d="M20 48H28V64H20V48Z" fill="#78350f" />
                <polygon points="24,4 42,28 6,28" fill={weatherTheme === 'bioluminescence' ? '#042f2e' : '#047857'} stroke={weatherTheme === 'bioluminescence' ? '#22d3ee' : undefined} strokeWidth={weatherTheme === 'bioluminescence' ? 1.5 : 0} />
                <polygon points="24,14 38,38 10,38" fill={weatherTheme === 'bioluminescence' ? '#115e59' : '#059669'} stroke={weatherTheme === 'bioluminescence' ? '#22d3ee' : undefined} strokeWidth={weatherTheme === 'bioluminescence' ? 1.5 : 0} />
                <polygon points="24,24 34,48 14,48" fill={weatherTheme === 'bioluminescence' ? '#0d9488' : '#10b981'} stroke={weatherTheme === 'bioluminescence' ? '#22d3ee' : undefined} strokeWidth={weatherTheme === 'bioluminescence' ? 1.5 : 0} />
              </svg>
            )}

            {tree.type === 'oak' && (
              <svg width="48" height="64" viewBox="0 0 48 64" fill="none">
                <path d="M21 44H27V64H21V44Z" fill="#78350f" />
                <circle cx="24" cy="24" r="18" fill={weatherTheme === 'bioluminescence' ? '#581c87' : '#15803d'} stroke={weatherTheme === 'bioluminescence' ? '#a855f7' : undefined} strokeWidth={weatherTheme === 'bioluminescence' ? 1 : 0} />
                <circle cx="16" cy="28" r="12" fill={weatherTheme === 'bioluminescence' ? '#3b0764' : '#166534'} />
                <circle cx="32" cy="24" r="14" fill={weatherTheme === 'bioluminescence' ? '#6b21a8' : '#16a34a'} />
                <circle cx="24" cy="16" r="12" fill={weatherTheme === 'bioluminescence' ? '#d8b4fe' : '#22c55e'} />
              </svg>
            )}

            {tree.type === 'bushy' && (
              <svg width="40" height="48" viewBox="0 0 40 48" fill="none">
                <path d="M17 32H23V48H17V32Z" fill="#78350f" />
                <path d="M20 8C28 8 34 14 34 22C34 30 28 32 20 32C12 32 6 30 6 22C6 14 12 8 20 8Z" fill={weatherTheme === 'bioluminescence' ? '#1e1b4b' : '#065f46'} stroke={weatherTheme === 'bioluminescence' ? '#818cf8' : undefined} />
                <ellipse cx="20" cy="18" rx="11" ry="8" fill={weatherTheme === 'bioluminescence' ? '#312e81' : '#059669'} />
              </svg>
            )}

            {tree.type === 'golden' && (
              <svg width="48" height="64" viewBox="0 0 48 64" fill="none">
                <path d="M20 44H28V64H20V44Z" fill="#78350f" />
                <circle cx="24" cy="22" r="16" fill={weatherTheme === 'autumn' ? '#c2410c' : '#ca8a04'} />
                <circle cx="18" cy="26" r="10" fill={weatherTheme === 'autumn' ? '#7c2d12' : '#a16207'} />
                <circle cx="30" cy="20" r="12" fill={weatherTheme === 'autumn' ? '#ea580c' : '#eab308'} />
                <circle cx="24" cy="14" r="10" fill={weatherTheme === 'autumn' ? '#f97316' : '#facc15'} />
              </svg>
            )}
          </motion.div>
        ))}

        {/* 3. Wildlife Layer */}
        {forestState.animals.map((ani) => (
          <motion.div
            key={ani.id}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1.5, type: 'tween' }}
            style={{ left: `${ani.x}%`, top: `${ani.y}%` }}
            className="absolute z-30 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none filter drop-shadow-md text-2xl"
          >
            <motion.span
              animate={{ y: [-4, 4, -4] }}
              transition={{ repeat: Infinity, duration: ani.speed, ease: 'easeInOut' }}
              className="inline-block"
              style={{ transform: `scale(${ani.scale})` }}
            >
              {ani.icon}
            </motion.span>
          </motion.div>
        ))}

        {/* Current weather HUD overlay */}
        <div className="absolute top-4 left-4 right-4 md:right-auto glass-panel p-3 border border-white/60 bg-white/80 flex items-center gap-3 shadow-md max-w-sm">
          <span className="text-3xl">
            {weatherTheme === 'rainbow' && '🌈'}
            {weatherTheme === 'spring' && '☀️'}
            {weatherTheme === 'bioluminescence' && '🌌'}
            {weatherTheme === 'autumn' && '🍂'}
          </span>
          <div>
            <h4 className="font-display text-sm text-emerald-800 leading-tight font-bold">
              {weatherTheme === 'rainbow' && 'Rainbow Bliss Weather'}
              {weatherTheme === 'spring' && 'Green Spring Canopy'}
              {weatherTheme === 'bioluminescence' && 'Bioluminescent Dusk'}
              {weatherTheme === 'autumn' && 'Cozy Amber Autumn'}
            </h4>
            <p className="text-[11px] text-gray-700 font-medium">
              {weatherTheme === 'rainbow' && 'Perfect scores unlocked a colorful double rainbow!'}
              {weatherTheme === 'spring' && 'Your vocabulary feeds the spring sunshine.'}
              {weatherTheme === 'bioluminescence' && '5+ Day Streak lights up neon spores!'}
              {weatherTheme === 'autumn' && 'Inactivity or Sleep mode covers the moss.'}
            </p>
          </div>
        </div>
      </div>

      {/* Magical Climate Spells Panel (Feature 3 Interactive Control) */}
      <div className="bg-emerald-50 border-t border-emerald-100 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3.5">
        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
          <Sparkles className="w-4 h-4 text-emerald-600 animate-spin" /> Casting Magical Weather Spells:
        </span>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setSelectedWeather('auto')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedWeather === 'auto' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200'}`}
          >
            🔮 Auto-Sync ({streak >= 5 ? 'Night' : streak === 0 ? 'Autumn' : 'Spring'})
          </button>
          <button 
            onClick={() => setSelectedWeather('spring')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${selectedWeather === 'spring' ? 'bg-amber-500 text-white shadow-md' : 'bg-white hover:bg-amber-50 text-amber-800 border border-amber-200'}`}
          >
            <Sun className="w-3.5 h-3.5" /> Spring
          </button>
          <button 
            onClick={() => setSelectedWeather('bioluminescence')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${selectedWeather === 'bioluminescence' ? 'bg-indigo-950 text-cyan-300 shadow-md border border-cyan-500/50' : 'bg-white hover:bg-indigo-50 text-indigo-950 border border-indigo-200'}`}
          >
            <Moon className="w-3.5 h-3.5 text-cyan-400" /> Neon Night
          </button>
          <button 
            onClick={() => setSelectedWeather('autumn')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${selectedWeather === 'autumn' ? 'bg-orange-600 text-white shadow-md' : 'bg-white hover:bg-orange-50 text-orange-800 border border-orange-200'}`}
          >
            <Leaf className="w-3.5 h-3.5" /> Autumn
          </button>
          <button 
            onClick={() => setSelectedWeather('rainbow')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${selectedWeather === 'rainbow' ? 'bg-pink-500 text-white shadow-md' : 'bg-white hover:bg-pink-50 text-pink-700 border border-pink-200'}`}
          >
            🌈 Rainbow
          </button>
        </div>
      </div>
    </div>
  );
}
