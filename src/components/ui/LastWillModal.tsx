'use client';

import React, { useState, useEffect } from 'react';
import { PenTool, X, Save } from 'lucide-react';
import { Button } from './Button';

interface LastWillModalProps {
  readonly isOpen: boolean;
  readonly initialWill: string;
  readonly onClose: () => void;
  readonly onSave: (text: string) => void;
}

export const LastWillModal: React.FC<LastWillModalProps> = ({
  isOpen,
  initialWill,
  onClose,
  onSave,
}) => {
  const [text, setText] = useState(initialWill);

  useEffect(() => {
    setText(initialWill);
  }, [initialWill, isOpen]);

  const handleSave = () => {
    onSave(text);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80  animate-fadeIn">
      <div className="w-full max-w-md bg-[url('https://www.transparenttextures.com/patterns/lined-paper.png')] bg-amber-50 dark:bg-zinc-900 border border-amber-200 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="bg-amber-100/80 dark:bg-zinc-950/80 p-4 border-b border-amber-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-amber-700 dark:text-amber-500" />
            <h3 className="font-serif font-bold text-amber-900 dark:text-amber-100 text-lg">
              Son Vəsiyyət
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-xs text-amber-800/80 dark:text-zinc-400 italic mb-4 font-serif">
            Bu vəsiyyət yalnız siz öldüyünüz zaman Səhər Qəzetində bütün şəhərə oxunacaq. Diriykən məxfi qalır.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={300}
            placeholder="Mənə nəsə olsa, bilməlisiniz ki..."
            className="w-full h-32 bg-transparent border-0 focus:ring-0 p-0 text-amber-950 dark:text-zinc-100 placeholder-amber-900/40 dark:placeholder-zinc-600 font-serif resize-none"
          />
          <div className="text-right text-[10px] text-amber-700/60 dark:text-zinc-500 mb-4 font-mono">
            {text.length} / 300
          </div>
          <Button onClick={handleSave} fullWidth className="bg-amber-700 hover:bg-amber-800 text-amber-50 border-0">
            <Save className="w-4 h-4 mr-2" /> Vəsiyyəti Möhürlə
          </Button>
        </div>
      </div>
    </div>
  );
};
