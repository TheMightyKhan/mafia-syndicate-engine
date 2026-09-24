'use client';

import React, { useState } from 'react';
import {
  User,
  Shield,
  Key,
  X,
  CheckCircle,
  AlertCircle,
  Trophy,
  Gamepad2,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { PlayerTier } from '../../types/access';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface UserSessionState {
  readonly username: string;
  readonly tier: PlayerTier;
  readonly roleTitle: string;
  readonly gamesPlayed: number;
  readonly winRate: number;
}

export interface AuthModalProps {
  readonly isOpen: boolean;
  readonly currentUser: UserSessionState | null;
  readonly onClose: () => void;
  readonly onLogin: (user: UserSessionState) => void;
  readonly onLogout?: () => void;
}

const TIER_TITLES: Record<PlayerTier, string> = {
  TIER_1: 'Əsgər (Soldier) — Başlanğıc',
  TIER_2: 'Kapo (Caporegime) — Təcrübəli',
  TIER_3: 'Don (Consigliere) — Elit Usta',
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onLogin,
  onLogout,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');

  // Login inputs
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<PlayerTier>('TIER_1');

  // Register inputs
  const [regFullName, setRegFullName] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regGrade, setRegGrade] = useState<number>(10);
  const [regTier, setRegTier] = useState<PlayerTier>('TIER_1');
  const [regPin, setRegPin] = useState<string>('');
  const [regConfirmPin, setRegConfirmPin] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleLoginSubmit = () => {
    if (!usernameInput.trim()) return;

    const user: UserSessionState = {
      username: usernameInput.trim(),
      tier: selectedTier,
      roleTitle: selectedTier === 'TIER_3' ? 'Don' : selectedTier === 'TIER_2' ? 'Kapo' : 'Əsgər',
      gamesPlayed: 14,
      winRate: 68.4,
    };

    onLogin(user);
    onClose();
  };

  const handleRegisterSubmit = () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!regFullName.trim()) {
      setErrorMsg('Zəhmət olmasa ad və soyadınızı daxil edin.');
      return;
    }
    if (!regUsername.trim()) {
      setErrorMsg('Zəhmət olmasa oyunçu ləqəbi / istifadəçi adı daxil edin.');
      return;
    }
    if (regPin && regConfirmPin && regPin !== regConfirmPin) {
      setErrorMsg('Daxil edilən şifrələr bir-birinə uyğun gəlmir.');
      return;
    }

    const roleTitle = regTier === 'TIER_3' ? 'Don' : regTier === 'TIER_2' ? 'Kapo' : 'Əsgər';
    const user: UserSessionState = {
      username: regUsername.trim(),
      tier: regTier,
      roleTitle: roleTitle,
      gamesPlayed: 0,
      winRate: 100,
    };

    try {
      const regUsersRaw = localStorage.getItem('tdv_registered_users_v1');
      const regUsers = regUsersRaw ? JSON.parse(regUsersRaw) : [];
      regUsers.push({
        fullName: regFullName.trim(),
        username: regUsername.trim(),
        roleTitle: roleTitle,
        tier: regTier,
        grade: regGrade,
        schoolClass: regGrade > 0 ? `${regGrade}A` : 'Müəllim',
        pin: regPin,
        avatar: '🎭',
        createdAt: Date.now(),
      });
      localStorage.setItem('tdv_registered_users_v1', JSON.stringify(regUsers));
    } catch {}

    setSuccessMsg('Hesabınız uğurla yaradıldı! Masaya qoşulur...');
    setTimeout(() => {
      onLogin(user);
      onClose();
    }, 450);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-950 dark:text-white leading-tight">
                {currentUser ? 'Oyunçu Profili' : 'TDV Vahid Giriş Portalı'}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {currentUser
                  ? 'Profilinizin cari statusu və dərəcəniz'
                  : 'Tək vahid profil bütün platforma üçün bəs edir.'}
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

        {/* Logged in view */}
        {currentUser ? (
          <div className="flex flex-col gap-5">
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-red-600 text-white font-bold text-sm flex items-center justify-center">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-zinc-950 dark:text-white">
                      {currentUser.username}
                    </h3>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      Titul: {currentUser.roleTitle}
                    </p>
                  </div>
                </div>
                <Badge tone="purple">{currentUser.tier}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mb-1">
                    <Gamepad2 className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Oyunlar</span>
                  </div>
                  <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                    {currentUser.gamesPlayed} Masa
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mb-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    <span>Qələbə</span>
                  </div>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {currentUser.winRate}%
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button variant="secondary" size="md" onClick={onClose}>
                Bağla
              </Button>
              {onLogout && (
                <Button
                  variant="danger"
                  size="md"
                  onClick={onLogout}
                  icon={<LogOut className="w-4 h-4" />}
                >
                  Hesabdan Çıx
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Not logged in: Tabbed Interface */
          <div className="flex flex-col gap-4">
            {/* Segmented Switcher */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  tab === 'login'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Daxil Ol
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  tab === 'register'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Qeydiyyatdan Keç
              </button>
            </div>

            {/* Error / Success Notifications */}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* TAB 1: LOGIN */}
            {tab === 'login' ? (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Oyunçu Ləqəbi (Ad) *
                  </label>
                  <input
                    type="text"
                    placeholder="Məs: Don Corleone, Xəfiyyə..."
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    autoFocus
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Dərəcə (Tier) Seçimi
                  </label>
                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value as PlayerTier)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all cursor-pointer"
                  >
                    <option value="TIER_1">{TIER_TITLES.TIER_1}</option>
                    <option value="TIER_2">{TIER_TITLES.TIER_2}</option>
                    <option value="TIER_3">{TIER_TITLES.TIER_3}</option>
                  </select>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 block">
                    Dərəcəniz hansı paket və masalara daxil ola biləcəyinizi müəyyən edir.
                  </span>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    disabled={!usernameInput.trim()}
                    onClick={handleLoginSubmit}
                  >
                    Dərhal Daxil Ol & Masaya Başla
                  </Button>
                </div>
              </div>
            ) : (
              /* TAB 2: REGISTER */
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Ad və Soyad *
                  </label>
                  <input
                    type="text"
                    placeholder="Məs: Elmir Qasımov"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Oyunçu Ləqəbi (Username) *
                  </label>
                  <input
                    type="text"
                    placeholder="Məs: Don_Elmir"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Sinif / Status
                    </label>
                    <select
                      value={regGrade}
                      onChange={(e) => setRegGrade(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                    >
                      <option value={10}>10-cu Sinif</option>
                      <option value={11}>11-ci Sinif</option>
                      <option value={9}>9-cu Sinif</option>
                      <option value={8}>8-ci Sinif</option>
                      <option value={7}>7-ci Sinif</option>
                      <option value={6}>6-cı Sinif</option>
                      <option value={0}>Fənn Müəllimi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Başlanğıc Dərəcə
                    </label>
                    <select
                      value={regTier}
                      onChange={(e) => setRegTier(e.target.value as PlayerTier)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                    >
                      <option value="TIER_1">Əsgər (Tier 1)</option>
                      <option value="TIER_2">Kapo (Tier 2)</option>
                      <option value="TIER_3">Don (Tier 3)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Şifrə / PİN
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={regPin}
                      onChange={(e) => setRegPin(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      Təkrarı
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={regConfirmPin}
                      onChange={(e) => setRegConfirmPin(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={handleRegisterSubmit}
                  >
                    Vahid Profil Yarat & Masaya Başla
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
