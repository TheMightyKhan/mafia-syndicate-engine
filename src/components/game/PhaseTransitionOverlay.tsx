'use client';

import React, { useEffect, useState } from 'react';
import { GamePhase } from '../../types/game';
import { Sun, Moon, Scale, Skull } from 'lucide-react';
import { playNight, playDay, playGavel } from '../../utils/sfx';

interface PhaseTransitionOverlayProps {
  phase: GamePhase;
}

const PhaseTransitionOverlayComponent: React.FC<PhaseTransitionOverlayProps> = ({ phase }) => {
  const [show, setShow] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<GamePhase | null>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (show) setIsRendered(true);
    else {
      const t = setTimeout(() => setIsRendered(false), 500);
      return () => clearTimeout(t);
    }
  }, [show]);

  useEffect(() => {
    if (
      phase !== currentPhase &&
      ['DAY_DISCUSSION', 'DAY_CENTRAL_ASSEMBLY', 'DAY_VOTING', 'NIGHT_ACTION', 'NIGHT_BUFFER'].includes(phase)
    ) {
      setCurrentPhase(phase);
      setShow(true);
      
      if (phase.includes('NIGHT')) {
        playNight();
      } else if (phase.includes('VOTING')) {
        playGavel();
      } else if (phase.includes('DAY')) {
        playDay();
      }
    }
  }, [phase, currentPhase]);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!isRendered) return null;

  let Icon = Sun;
  let title = 'Yeni Gün';
  let subtitle = '';
  let bgClass = 'bg-amber-500/10';
  let textClass = 'text-amber-500';

  if (phase.includes('DAY_DISCUSSION') || phase.includes('DAY_CENTRAL_ASSEMBLY')) {
    Icon = Sun;
    title = 'Səhər Açılır';
    subtitle = 'Şəhər oyanır. Hadisələri müzakirə etmək vaxtıdır.';
    bgClass = 'bg-amber-500/10';
    textClass = 'text-amber-500';
  } else if (phase.includes('DAY_VOTING')) {
    Icon = Scale;
    title = 'Məhkəmə Başlayır';
    subtitle = 'Günahkarları mühakimə etmək üçün son şansınızdır.';
    bgClass = 'bg-zinc-500/20';
    textClass = 'text-zinc-200';
  } else if (phase.includes('NIGHT_ACTION') || phase.includes('NIGHT_BUFFER')) {
    Icon = Moon;
    title = 'Gecə Çökür';
    subtitle = 'Məsumlar yatır, cinayətkarlar və müdafiəçilər hərəkətə keçir.';
    bgClass = 'bg-blue-950/40';
    textClass = 'text-blue-400';
  }

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center ${bgClass} transition-opacity duration-500 pointer-events-none ${show ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex flex-col items-center gap-6 animate-[scaleIn_0.5s_ease-out_forwards]">
        <Icon className={`w-24 h-24 ${textClass} drop-shadow-[0_0_20px_currentColor] animate-pulse`} strokeWidth={1} />
        <div className="text-center">
          <h1 className={`text-5xl sm:text-7xl font-black uppercase tracking-widest ${textClass} drop-shadow-lg`}>
            {title}
          </h1>
          <p className="text-zinc-300 font-medium tracking-widest uppercase mt-4 text-sm sm:text-base opacity-80">
            {subtitle}
          </p>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scaleIn {
          0% { transform: scale(0.85); opacity: 0; filter: blur(10px); }
          50% { filter: blur(0px); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}} />
    </div>
  );
};

export const PhaseTransitionOverlay = React.memo(PhaseTransitionOverlayComponent);
