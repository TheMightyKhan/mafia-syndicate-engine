'use client';

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Shield,
  User,
  X,
  Info,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { UserSessionState } from './AuthModal';

export interface LeaderboardModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const [currentUser, setCurrentUser] = useState<UserSessionState | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tdv_mafia_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {
      // Storage unavailable
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-xl flex flex-col gap-6 max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-950 dark:text-white leading-tight">
                TDV MAFIA — Klub Məktəb Liqası
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Mövsüm #1: Bakı Deduksiya və İntellektual Reytinq Sistemi
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current User Card */}
        <div className="p-4 sm:p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-amber-500 text-white font-black text-lg flex items-center justify-center shadow-sm">
              {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : '👤'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  {currentUser?.username || 'Qonaq Oyunçu'}
                </span>
                <Badge
                  tone={
                    currentUser?.tier === 'TIER_3'
                      ? 'purple'
                      : currentUser?.tier === 'TIER_2'
                      ? 'amber'
                      : 'neutral'
                  }
                >
                  {currentUser?.tier || 'TIER_1'}
                </Badge>
              </div>
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                {currentUser?.roleTitle || 'Sıravi İştirakçı (Giriş edilməyib)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-amber-500/20">
            <div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Mövsüm Xalı (ELO)</div>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                {currentUser ? '1500 ELO' : '—'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Status</div>
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {currentUser ? 'Aktiv İştirakçı' : 'Qonaq'}
              </div>
            </div>
          </div>
        </div>

        {/* Season Notice */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
            <Info className="w-4 h-4 shrink-0" />
            <span>Klub Turnir və Reytinq Qaydası</span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            TDV Mafia platformasında reytinq xalları yalnız{' '}
            <strong className="text-zinc-900 dark:text-zinc-100">
              başa çatan canlı oyunlar
            </strong>{' '}
            və{' '}
            <strong className="text-zinc-900 dark:text-zinc-100">
              iştirakçıların fərdi profilləri
            </strong>{' '}
            əsasında qeydə alınır. Masalara qoşularaq və intellektual duellərdə qələbə qazanaraq
            şəhərin ən güclü deduksiya ustaları sırasına yüksələ bilərsiniz.
          </p>
        </div>

        {/* Tier Hierarchy Guide */}
        <div>
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-3">
            Liqa Dərəcələri və Tələblər (Tier Structure)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  Tier 1: Əsgər
                </span>
                <Badge tone="neutral">0–1499</Badge>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Başlanğıc dərəcə. Standart 12 nəfərlik masalarda iştirak hüququ.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                  Tier 2: Kapo
                </span>
                <Badge tone="amber">1500–2199</Badge>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Təcrübəli oyunçu. Dante 9 və 20 nəfərlik xüsusi masalarda masa açmaq icazəsi.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 dark:bg-purple-500/10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                  Tier 3: Don
                </span>
                <Badge tone="purple">2200+</Badge>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Elit Usta. 40–50 nəfərlik All-In kütləvi turnir masalarında rəhbərlik hüququ.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Kriptoqrafik Qoruma & Anti-Cheat</span>
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Bağla
          </Button>
        </div>
      </div>
    </div>
  );
};