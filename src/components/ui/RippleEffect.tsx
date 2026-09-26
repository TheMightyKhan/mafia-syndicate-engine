'use client';

import React, { useEffect, useState } from 'react';

interface Ripple {
  x: number;
  y: number;
  id: number;
}

export function RippleEffect() {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Don't add ripple if they clicked a button that already has an effect, 
      // but a global subtle one is usually fine.
      const newRipple = {
        x: e.clientX,
        y: e.clientY,
        id: Date.now()
      };
      setRipples(prev => [...prev, newRipple]);
      
      // Remove it after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {ripples.map(r => (
        <div
          key={r.id}
          className="absolute rounded-full border-2 border-white/20 dark:border-white/10 opacity-0 animate-ripple"
          style={{
            left: r.x,
            top: r.y,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes ripple {
          0% {
            width: 0px;
            height: 0px;
            opacity: 1;
            border-width: 4px;
          }
          100% {
            width: 100px;
            height: 100px;
            opacity: 0;
            border-width: 0px;
          }
        }
        .animate-ripple {
          animation: ripple 0.6s ease-out forwards;
        }
      `}} />
    </div>
  );
}
