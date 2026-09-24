'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Trophy,
  Layers,
  Plus,
  User as UserIcon,
  Gamepad2,
  GraduationCap,
  Home,
  ShieldCheck,
  Activity,
  LogOut,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ThemeToggle } from '../theme/ThemeToggle';
import { AuthModal, UserSessionState } from '../modals/AuthModal';
import { RulesModal } from '../modals/RulesModal';
import { LeaderboardModal } from '../modals/LeaderboardModal';
import { GameModesCatalogModal } from '../modals/GameModesCatalogModal';
import { CreateRoomModal } from '../modals/CreateRoomModal';
import { GameMode } from '../../types/packs';

export const Navbar: React.FC = () => {
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState<boolean>(false);
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState<boolean>(false);
  const [catalogSelectedMode, setCatalogSelectedMode] = useState<GameMode>('SE7EN_DEADLY_SINS');

  const [currentUser, setCurrentUser] = useState<UserSessionState | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const ssoTicket = urlParams.get('sso_ticket');
        if (ssoTicket) {
          const decoded = JSON.parse(decodeURIComponent(escape(atob(ssoTicket))));
          if (decoded && (decoded.fullName || decoded.username)) {
            localStorage.setItem('tdv_ecosystem_session_v1', JSON.stringify(decoded));
            setCurrentUser({
              username: decoded.fullName || decoded.username,
              tier: 'TIER_1',
              roleTitle:
                decoded.role === 'teacher'
                  ? 'Müəllim'
                  : decoded.schoolClass
                  ? `${decoded.schoolClass} Oyunçusu`
                  : 'Klub Oyunçusu',
              gamesPlayed: 14,
              winRate: 75,
            });
            urlParams.delete('sso_ticket');
            const newSearch = urlParams.toString();
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash
            );
            return;
          }
        }
      }

      const ecoRaw = localStorage.getItem('tdv_ecosystem_session_v1');
      if (ecoRaw) {
        const ecoSess = JSON.parse(ecoRaw);
        if (ecoSess && (ecoSess.fullName || ecoSess.username)) {
          setCurrentUser({
            username: ecoSess.fullName || ecoSess.username,
            tier: 'TIER_1',
            roleTitle:
              ecoSess.role === 'teacher'
                ? 'Müəllim'
                : ecoSess.schoolClass
                ? `${ecoSess.schoolClass} Oyunçusu`
                : 'Klub Oyunçusu',
            gamesPlayed: 14,
            winRate: 75,
          });
          return;
        }
      }
    } catch {
      // Storage unavailable
    }
  }, []);

  const handleLogin = (user: UserSessionState) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('tdv_mafia_user', JSON.stringify(user));
      localStorage.setItem(
        'tdv_ecosystem_session_v1',
        JSON.stringify({
          userId: 'tdv-usr-' + Date.now().toString(36),
          username: user.username,
          fullName: user.username,
          role: 'player',
          grade: 10,
          avatar: '🕵️',
          token: 'sec_' + Math.random().toString(36).substring(2),
          createdAt: Date.now(),
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        })
      );
    } catch {
      // Storage unavailable
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('tdv_mafia_user');
      localStorage.removeItem('tdv_ecosystem_session_v1');
    } catch {
      // Storage unavailable
    }
    setIsAuthOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* ─── TOP STATUS RIBBON ────────────────────────────────────────── */}
      <aside
        aria-label="TDV Organization Status"
        className="w-full bg-zinc-100 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/80 px-4 sm:px-6 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between gap-4 transition-colors duration-200"
      >
        <div className="flex items-center gap-2.5 overflow-hidden whitespace-nowrap">
          <a
            href="https://tdv-community-hubs.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-bold text-zinc-900 dark:text-zinc-100 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-500/20 animate-pulse" />
            <span>TDV Community Labs</span>
          </a>
          <span className="text-zinc-300 dark:text-zinc-700 hidden sm:inline">|</span>
          <span className="font-semibold text-zinc-700 dark:text-zinc-300 hidden sm:inline">
            Mafiya Klubu
          </span>
          <span className="text-zinc-300 dark:text-zinc-700 hidden md:inline">•</span>
          <span className="text-zinc-500 dark:text-zinc-400 hidden md:inline text-[11px]">
            📰 24 Rol Ensiklopediyası və 15 Oyun Rejimi
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bakı Node-01</span>
            <span className="text-[10px] opacity-75">(16ms)</span>
          </div>

          <div className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-semibold">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Anti-AFK Gemini 3.8</span>
          </div>
        </div>
      </aside>

      {/* ─── MAIN NAVIGATION BAR ─────────────────────────────────────── */}
      <nav className="w-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 transition-colors duration-200 shadow-sm dark:shadow-none">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <img
                src="/assets/tdv-logo.jpg"
                alt="TDV Logo"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700 group-hover:ring-red-500 transition-all duration-200"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-600 rounded-full border-2 border-white dark:border-zinc-900" />
            </div>

            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-zinc-950 dark:text-white leading-tight">
                TDV BTL <span className="text-red-600 dark:text-red-500">MAFIA</span>
              </span>
              <span className="text-[10px] font-bold tracking-wider text-amber-600 dark:text-amber-400 uppercase">
                Bakı Türk Liseyi
              </span>
            </div>
          </a>
        </div>

        {/* Center: Ecosystem Switcher & Navigation Links */}
        <div className="hidden xl:flex items-center gap-2">
          {/* Ecosystem Switcher Pill */}
          <div className="inline-flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-xs">
            <a
              href="https://tdv-community-hubs.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-700 transition-all font-medium"
            >
              <Home className="w-3.5 h-3.5 text-blue-500" />
              <span>Mərkəz</span>
            </a>

            <a
              href="https://tdv-e-school.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-700 transition-all font-medium"
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
              <span>E-School</span>
            </a>

            <a
              href="https://school-minifootball-tournament.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-700 transition-all font-medium"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Sports</span>
            </a>

            <a
              href="https://tdv-community-hubs.vercel.app/games"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-600 text-white font-bold shadow-sm shadow-red-500/20"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Games</span>
              <span className="text-[10px] bg-red-800/80 px-1.5 py-0.2 rounded font-black">
                Mafia
              </span>
            </a>
          </div>

          <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

          {/* Quick Modals Triggers */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsRulesOpen(true)}
            icon={<BookOpen className="w-4 h-4 text-red-500" />}
          >
            <span>Qaydalar</span>
            <Badge tone="red" className="ml-1 text-[10px] px-1.5 py-0">
              24 Rol
            </Badge>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLeaderboardOpen(true)}
            icon={<Trophy className="w-4 h-4 text-amber-500" />}
          >
            Reytinq
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCatalogOpen(true)}
            icon={<Layers className="w-4 h-4 text-indigo-500" />}
          >
            Formatlar
          </Button>
        </div>

        {/* Right: Actions, Theme Toggle & User Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateRoomOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Masa Yarat
          </Button>

          {/* Dual Theme Toggle */}
          <ThemeToggle />

          {currentUser ? (
            <div
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200"
            >
              <div className="w-6 h-6 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>

              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-none">
                  {currentUser.username}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                  {currentUser.roleTitle}
                </span>
              </div>

              <Badge
                tone={
                  currentUser.tier === 'TIER_3'
                    ? 'purple'
                    : currentUser.tier === 'TIER_2'
                    ? 'amber'
                    : 'neutral'
                }
                className="text-[10px] px-1.5 py-0"
              >
                {currentUser.tier}
              </Badge>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsAuthOpen(true)}
              icon={<UserIcon className="w-4 h-4" />}
            >
              Giriş
            </Button>
          )}
        </div>
      </nav>

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        currentUser={currentUser}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />

      <GameModesCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelectMode={(mode) => {
          setCatalogSelectedMode(mode);
          setIsCreateRoomOpen(true);
        }}
      />

      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        defaultMode={catalogSelectedMode}
        onClose={() => setIsCreateRoomOpen(false)}
      />
    </header>
  );
};