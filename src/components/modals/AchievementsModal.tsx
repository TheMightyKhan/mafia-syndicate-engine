'use client';

import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Award,
  Medal,
  Sparkles,
  Search,
  X,
  Lock,
  CheckCircle,
  Coins,
  Flame,
  Shield,
  Crosshair,
  Sliders,
} from 'lucide-react';
import { ACHIEVEMENTS_REGISTRY } from '../../config/achievements.config';
import { Achievement, AchievementCategory, AchievementTier } from '../../types/achievements';
import { Badge, BadgeTone } from '../ui/Badge';
import { Button } from '../ui/Button';
import { playCard } from '../../utils/sfx';

export interface AchievementsModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const TIER_BADGE_TONES: Record<AchievementTier, BadgeTone> = {
  BRONZE: 'neutral',
  SILVER: 'blue',
  GOLD: 'amber',
  PLATINUM: 'purple',
  LEGENDARY: 'red',
};

const TIER_LABELS: Record<AchievementTier, string> = {
  BRONZE: 'Bürünc',
  SILVER: 'Gümüş',
  GOLD: 'Qızıl',
  PLATINUM: 'Platin',
  LEGENDARY: 'Əfsanəvi',
};

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose }) => {
  const [activeCategory, setActiveCategory] = useState<AchievementCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<AchievementTier | 'ALL'>('ALL');

  // Stored unlocked IDs in localStorage or default initial sample
  const unlockedIds = useMemo<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set(['town_sheriff_first_bust', 'mafia_first_blood', 'town_voice_of_reason']);
    try {
      const stored = localStorage.getItem('tdv_mafia_unlocked_achievements');
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
    // Default unlocked starter achievements for new players
    return new Set(['town_sheriff_first_bust', 'mafia_first_blood', 'town_voice_of_reason']);
  }, [isOpen]);

  const filteredAchievements = useMemo(() => {
    let list = ACHIEVEMENTS_REGISTRY;
    if (activeCategory !== 'ALL') {
      list = list.filter((a) => a.category === activeCategory);
    }
    if (selectedTier !== 'ALL') {
      list = list.filter((a) => a.tier === selectedTier);
    }
    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(
      (a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
    );
  }, [activeCategory, selectedTier, searchQuery]);

  if (!isOpen) return null;

  const totalCount = ACHIEVEMENTS_REGISTRY.length;
  const unlockedCount = unlockedIds.size;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  const handleCategoryChange = (cat: AchievementCategory) => {
    playCard();
    setActiveCategory(cat);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl flex flex-col h-[90vh] max-h-[850px] overflow-hidden transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── FIXED TOP HEADER ──────────────────────────────────────── */}
        <div className="shrink-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          
          {/* Row 1: Title & Stats Progress */}
          <div className="p-4 sm:px-6 sm:py-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-sm">
                <Medal className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-zinc-950 dark:text-white leading-tight truncate">
                    TDV MAFIA — Nailiyyətlər & Titullar
                  </h2>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    72 Nailiyyət
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                  İntellektual psixoloji tapşırıqlar, XP səviyyəsi və qızıl xəzinəsi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Progress Summary Pill */}
              <div className="hidden sm:flex flex-col items-end">
                <div className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>{unlockedCount} / {totalCount} Tamamlandı</span>
                  <span className="text-amber-600 dark:text-amber-400 font-mono font-bold">({progressPercent}%)</span>
                </div>
                <div className="w-32 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Row 2: Category Tabs & Search Bar */}
          <div className="px-4 sm:px-6 py-3 bg-zinc-50 dark:bg-zinc-950/80 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            {/* Category Tabs */}
            <div className="inline-flex items-center p-1 rounded-2xl bg-zinc-200/80 dark:bg-zinc-800/90 border border-zinc-300/60 dark:border-zinc-700/60 gap-1 overflow-x-auto max-w-full">
              
              <button
                type="button"
                onClick={() => handleCategoryChange('ALL')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer select-none leading-none ${
                  activeCategory === 'ALL'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-700/60'
                }`}
              >
                <span>Hamısı (72)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('TOWN')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer select-none leading-none ${
                  activeCategory === 'TOWN'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-700/60'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Şəhər (15)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('MAFIA')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer select-none leading-none ${
                  activeCategory === 'MAFIA'
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-700/60'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Mafiya (15)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('NEUTRAL')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer select-none leading-none ${
                  activeCategory === 'NEUTRAL'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-700/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Neytral (12)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('MODES')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer select-none leading-none ${
                  activeCategory === 'MODES'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-700/60'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Rejimlər (16)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('MASTERY')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer select-none leading-none ${
                  activeCategory === 'MASTERY'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-700/60'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Usta & Deduksiya (14)</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Nailiyyət axtar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── SCROLLABLE ACHIEVEMENTS GRID ──────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredAchievements.map((item) => {
              const isUnlocked = unlockedIds.has(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 relative overflow-hidden select-none ${
                    isUnlocked
                      ? 'bg-white dark:bg-zinc-900 border-amber-500/30 dark:border-amber-500/30 shadow-sm hover:border-amber-500/60 hover:-translate-y-0.5'
                      : 'bg-zinc-50/70 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800/80 opacity-75'
                  }`}
                >
                  <div>
                    {/* Header: Title, Icon & Tier Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                            isUnlocked
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 shadow-sm'
                              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
                          }`}
                        >
                          <i className={`fa-solid ${item.icon}`} />
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm text-zinc-950 dark:text-white leading-tight truncate">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-zinc-400 block font-mono">
                            ID: {item.id}
                          </span>
                        </div>
                      </div>

                      <Badge tone={TIER_BADGE_TONES[item.tier]} className="text-[10px] shrink-0">
                        {TIER_LABELS[item.tier]}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mt-1">
                      {item.description}
                    </p>
                  </div>

                  {/* Footer: Status, XP and Coins */}
                  <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Coins className="w-3 h-3" />
                        +{item.coinReward} 🪙
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        +{item.xp} XP
                      </span>
                    </div>

                    <div>
                      {isUnlocked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" />
                          AÇIQDIR
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
                          <Lock className="w-3 h-3" />
                          KİLİDLİ
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── FIXED FOOTER ──────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between shrink-0">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Toplam 72 Nailiyyət • Bütün rollar və rejimlər üzrə inteqrasiya
          </span>
          <Button variant="primary" size="sm" onClick={onClose}>
            Başa Düşdüm
          </Button>
        </div>
      </div>
    </div>
  );
};
