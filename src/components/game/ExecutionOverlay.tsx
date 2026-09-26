import React, { useEffect, useState } from 'react';
import { Gavel, Skull } from 'lucide-react';
import { playElimination } from '../../utils/sfx';

interface ExecutionOverlayProps {
  lynchedPlayerName: string | null;
  lynchedRole?: string | null;
}

export const ExecutionOverlay: React.FC<ExecutionOverlayProps> = ({ lynchedPlayerName, lynchedRole }) => {
  const [show, setShow] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState<string | null>(null);

  useEffect(() => {
    if (lynchedPlayerName && lynchedPlayerName !== currentPlayer) {
      setCurrentPlayer(lynchedPlayerName);
      setShow(true);
      playElimination();
      
      const timer = setTimeout(() => {
        setShow(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [lynchedPlayerName, currentPlayer]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-red-950/80 backdrop-blur-[24px] backdrop-grayscale-[50%] transition-opacity duration-500 pointer-events-none">
      <div className="flex flex-col items-center gap-6 animate-[executeDrop_0.5s_cubic-bezier(0.25,1,0.5,1)_forwards]">
        <div className="relative">
          <Gavel className="w-32 h-32 text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] z-10 relative animate-[gavelSmash_0.5s_ease-in_forwards]" strokeWidth={1} />
          <Skull className="w-16 h-16 text-zinc-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 animate-[skullReveal_1s_ease-out_1s_forwards]" />
        </div>
        
        <div className="text-center mt-4">
          <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-widest text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]">
            EDAM EDİLDİ
          </h1>
          <p className="text-white font-black tracking-widest uppercase mt-6 text-2xl sm:text-4xl bg-red-600/30 px-6 py-2 border-y-2 border-red-500/50 inline-block animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]">
            {currentPlayer}
          </p>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes executeDrop {
          0% { transform: translateY(-100px) scale(1.2); opacity: 0; filter: blur(10px); }
          100% { transform: translateY(0) scale(1); opacity: 1; filter: blur(0px); }
        }
        @keyframes gavelSmash {
          0% { transform: rotate(-45deg) scale(1.5); }
          100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes skullReveal {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
          100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
        }
      `}} />
    </div>
  );
};
