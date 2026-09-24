import React from 'react';
import { motion } from 'motion/react';

interface AvatarSelectorProps {
  currentAvatar: string;
  onSelectAvatar: (avatarKey: string) => void;
}

const AVATARS = [
  {
    key: 'explorer',
    name: 'Forest Explorer',
    img: 'https://i.ibb.co/G4JPKvzf/forest-explorer.png',
    theme: 'from-amber-400 to-orange-500',
    border: 'border-amber-400',
    description: 'Equipped with a compass, ready to map the entire vocabulary forest!',
    badge: 'Trailblazer'
  },
  {
    key: 'guardian',
    name: 'Forest Guardian',
    img: 'https://i.ibb.co/RGwMVvRS/guardian.png',
    theme: 'from-emerald-400 to-teal-600',
    border: 'border-emerald-500',
    description: 'Guardian of the wild woodland, keeping the flora and fauna healthy.',
    badge: 'Forest Warden'
  },
  {
    key: 'wizard',
    name: 'Forest Wizard',
    img: 'https://i.ibb.co/Y7FzC7gr/wizard-no-bg.png',
    theme: 'from-violet-500 to-indigo-700',
    border: 'border-violet-500',
    description: 'Casts magical spelling spells and unlocks ancient words.',
    badge: 'Spellcaster'
  },
  {
    key: 'ninja',
    name: 'Woodland Ninja',
    img: 'https://i.ibb.co/3yb0tZkv/ninja.png',
    theme: 'from-green-500 to-slate-800',
    border: 'border-green-600',
    description: 'Glides silently through the shadows of high canopy trees.',
    badge: 'Silent Sleuth'
  },
  {
    key: 'defender',
    name: 'Grove Defender',
    img: 'https://i.ibb.co/0VQkgMxz/grove.png',
    theme: 'from-lime-400 to-yellow-600',
    border: 'border-lime-500',
    description: 'Unearthing ancient vocabulary fossils buried beneath the roots.',
    badge: 'Grove Hero'
  },
  {
    key: 'mystic',
    name: 'Emerald Mystic',
    img: 'https://i.ibb.co/Vc9cNZr2/emerld.png',
    theme: 'from-emerald-300 to-green-500',
    border: 'border-emerald-400',
    description: 'Wielding the power of emerald magic in the deep woods.',
    badge: 'Mystic'
  },
  {
    key: 'enchanter',
    name: 'Wild Enchanter',
    img: 'https://i.ibb.co/VcJW9v22/wild.png',
    theme: 'from-rose-400 to-red-600',
    border: 'border-rose-500',
    description: 'Brings wild words to life with enchanted tales.',
    badge: 'Enchanter'
  },
  {
    key: 'whisperer',
    name: 'Nature Whisperer',
    img: 'https://i.ibb.co/gFvzRkH7/nature.png',
    theme: 'from-sky-400 to-blue-600',
    border: 'border-sky-500',
    description: 'Listens to the whispers of the ancient trees.',
    badge: 'Whisperer'
  }
];

export default function AvatarSelector({ currentAvatar, onSelectAvatar }: AvatarSelectorProps) {
  return (
    <div className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">🛡️</span>
        <div>
          <h3 className="font-display text-2xl text-emerald-800 font-bold">Select Your Avatar</h3>
          <p className="text-xs text-gray-500 font-medium">Choose a woodland avatar to guide your forest journey.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {AVATARS.map((av) => {
          const isSelected = currentAvatar === av.key;
          return (
            <motion.button
              key={av.key}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectAvatar(av.key)}
              className={`relative flex flex-col items-center text-center p-4 rounded-2xl border-4 transition-all focus:outline-none ${
                isSelected
                  ? `${av.border} bg-gradient-to-b from-white to-emerald-50 shadow-[0_8px_20px_rgba(16,185,129,0.2)]`
                  : 'border-gray-200/60 bg-white hover:border-gray-300'
              }`}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider z-10">
                  Selected
                </span>
              )}
              
              {/* Avatar Icon Glimpse */}
              <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md mb-2 bg-slate-100 overflow-hidden`}>
                <img src={av.img} alt={av.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
              </div>
              
              <span className="font-display text-base text-gray-800 font-bold leading-tight">
                {av.name}
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                {av.badge}
              </span>
              
              <p className="text-xs text-gray-500 font-medium mt-2 leading-relaxed">
                {av.description}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export { AVATARS };

export function getAvatarData(key: string) {
  return AVATARS.find(a => a.key === key) || AVATARS[0];
}
