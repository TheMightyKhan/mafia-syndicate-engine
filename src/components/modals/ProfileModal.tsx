'use client';

import React, { useState } from 'react';
import { User, Trophy, Shield, Settings, Check, Edit2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface ProfileModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly currentUsername: string;
  readonly onUpdateUsername: (newName: string) => void;
  readonly tier: string;
  readonly totalXp: number;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUsername, 
  onUpdateUsername,
  tier,
  totalXp
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(currentUsername);

  if (!isOpen) return null;

  const handleSave = () => {
    if (draftName.trim().length >= 3) {
      onUpdateUsername(draftName.trim());
      setIsEditing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="h-32 bg-gradient-to-br from-indigo-900 to-purple-900 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
            <Check className="w-6 h-6" />
          </button>
        </div>
        
        <div className="px-6 pb-6 relative">
          <div className="absolute -top-12 left-6 w-24 h-24 rounded-2xl bg-zinc-800 border-4 border-zinc-900 flex items-center justify-center shadow-lg">
            <User className="w-12 h-12 text-zinc-400" />
          </div>
          
          <div className="pt-14">
            <div className="flex items-center justify-between mb-6">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={draftName} 
                    onChange={e => setDraftName(e.target.value)}
                    className="bg-zinc-800 text-white rounded-lg px-3 py-1.5 outline-none border border-zinc-700 w-40"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                  />
                  <Button variant="primary" size="sm" onClick={handleSave}>Yadda Saxla</Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-white">{currentUsername}</h2>
                  <button onClick={() => setIsEditing(true)} className="text-zinc-500 hover:text-white transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50 flex flex-col items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-400 mb-2" />
                <span className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Reytinq</span>
                <span className="text-lg font-black text-white mt-1">{tier}</span>
              </div>
              <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50 flex flex-col items-center justify-center">
                <Trophy className="w-6 h-6 text-amber-400 mb-2" />
                <span className="text-xs text-zinc-400 uppercase font-bold tracking-wider">Təcrübə (XP)</span>
                <span className="text-lg font-black text-white mt-1">{totalXp}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
