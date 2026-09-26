'use client';

import React, { useEffect, useState } from 'react';
import { GamePhase } from '../../types/game';
import { getTheme } from '../../config/themes.config';
import { playGavel } from '../../utils/sfx';

interface GameIntroOverlayProps {
  readonly phase: GamePhase;
  readonly roleName: string;
  readonly roleFaction: 'MAFIA' | 'TOWN' | 'NEUTRAL';
}

export const GameIntroOverlay: React.FC<GameIntroOverlayProps> = ({ phase, roleName, roleFaction }) => {
  const [show, setShow] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    if (phase !== 'LOBBY' && phase !== 'ENDED' && !hasShown) {
      setHasShown(true);
      setShow(true);
      
      playGavel();
      setTimeout(playGavel, 600);
    }
  }, [phase, hasShown]);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setShow(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!show) return null;

  const factionColors = {
    TOWN: 'from-emerald-900 to-teal-950 text-emerald-400',
    MAFIA: 'from-red-950 to-orange-950 text-red-500',
    NEUTRAL: 'from-purple-950 to-fuchsia-950 text-purple-400'
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-1000 cursor-pointer"
      onClick={() => setShow(false)}
    >
      
      {/* Background vignette */}
      <div className={`absolute inset-0 bg-gradient-to-br ${factionColors[roleFaction]} opacity-40 mix-blend-overlay`} />
      
      {/* Central Role Text */}
      <div className="relative z-10 flex flex-col items-center animate-[zoomIn_2s_ease-out_forwards] scale-50 opacity-0">
        <span className="text-sm font-black tracking-[0.5em] text-zinc-400 uppercase mb-4">Sizin Həqiqi Rolunuz</span>
        <h1 className={`text-6xl md:text-8xl font-black uppercase tracking-tighter drop-shadow-[0_0_30px_currentColor]`}>
          {roleName}
        </h1>
        <span className="mt-8 text-xs text-white/50 uppercase tracking-[0.2em] animate-pulse">
          Keçmək üçün toxunun
        </span>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes zoomIn {
          0% { transform: scale(0.5); opacity: 0; }
          40% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}} />
    </div>
  );
};
