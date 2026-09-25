import React, { useEffect, useState } from 'react';
import { GamePhase } from '@/types/index';
import { Sun, Moon, Scale, Skull } from 'lucide-react';

interface PhaseTransitionOverlayProps {
  phase: GamePhase;
}

export const PhaseTransitionOverlay: React.FC<PhaseTransitionOverlayProps> = ({ phase }) => {
  const [show, setShow] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<GamePhase | null>(null);

  useEffect(() => {
    // Only trigger if phase actually changes to a main phase
    if (
      phase !== currentPhase &&
      ['DAY_DISCUSSION', 'DAY_CENTRAL_ASSEMBLY', 'DAY_VOTING', 'NIGHT_ACTION', 'NIGHT_BUFFER'].includes(phase)
    ) {
      setCurrentPhase(phase);
      setShow(true);
      const timer = setTimeout(() => setShow(false), 3000); // Hide after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [phase, currentPhase]);

  if (!show) return null;

  let Icon = Sun;
  let title = 'Yeni Gün';
  let subtitle = '';
  let bgClass = 'bg-amber-500/10 backdrop-blur-[20px]';
  let textClass = 'text-amber-500';

  if (phase.includes('DAY_DISCUSSION') || phase.includes('DAY_CENTRAL_ASSEMBLY')) {
    Icon = Sun;
    title = 'Səhər Açılır';
    subtitle = 'Şəhər oyanır. Hadisələri müzakirə etmək vaxtıdır.';
    bgClass = 'bg-amber-500/10 backdrop-blur-[20px]';
    textClass = 'text-amber-500';
  } else if (phase.includes('DAY_VOTING')) {
    Icon = Scale;
    title = 'Məhkəmə Başlayır';
    subtitle = 'Günahkarları mühakimə etmək üçün son şansınızdır.';
    bgClass = 'bg-zinc-500/20 backdrop-blur-[20px]';
    textClass = 'text-zinc-200';
  } else if (phase.includes('NIGHT_ACTION') || phase.includes('NIGHT_BUFFER')) {
    Icon = Moon;
    title = 'Gecə Çökür';
    subtitle = 'Məsumlar yatır, cinayətkarlar və müdafiəçilər hərəkətə keçir.';
    bgClass = 'bg-blue-950/40 backdrop-blur-[24px]';
    textClass = 'text-blue-400';
  }

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center ${bgClass} transition-opacity duration-500 pointer-events-none`}>
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
