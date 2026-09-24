'use client';

import React, { useState, CSSProperties } from 'react';
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

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    padding: '20px',
  };

  const modalStyle: CSSProperties = {
    backgroundColor: '#090d16',
    border: '1px solid #dc2626',
    borderRadius: '16px',
    padding: '28px',
    maxWidth: '480px',
    width: '100%',
    boxShadow: '0 25px 50px -12px rgba(220, 38, 38, 0.25), 0 0 40px rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    maxHeight: '90vh',
    overflowY: 'auto',
  };

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
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🎭</span>
              <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '20px', fontWeight: 900, letterSpacing: '0.02em' }}>
                {currentUser ? 'Oyunçu Profili' : 'TDV Community Labs Vahid Profili'}
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
              {currentUser
                ? 'Profilinizin cari statusu və dərəcəniz'
                : 'Tək 1 profil bütün ekosistemə (E-School, Futbol, Games, Mafia) bəs edir.'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Logged in view */}
        {currentUser ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                backgroundColor: '#0f172a',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid #1e293b',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
                  {currentUser.username}
                </span>
                <Badge tone="purple">{currentUser.tier}</Badge>
              </div>

              <div style={{ fontSize: '13px', color: '#38bdf8' }}>
                Titul: <strong>{currentUser.roleTitle}</strong>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                  marginTop: '6px',
                  borderTop: '1px solid #1e293b',
                  paddingTop: '10px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Oynanılmış Oyunlar</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#f1f5f9' }}>
                    {currentUser.gamesPlayed} Masa
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Qələbə Əmsalı</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#34d399' }}>
                    {currentUser.winRate}%
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="outline" size="md" fullWidth onClick={onClose} style={{ borderColor: '#334155' }}>
                Bağla
              </Button>
              {onLogout && (
                <Button variant="danger" size="md" fullWidth onClick={onLogout}>
                  Hesabdan Çıx
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Not logged in: Tabbed Interface */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Segmented Switcher */}
            <div
              style={{
                display: 'flex',
                padding: '4px',
                backgroundColor: '#0f172a',
                borderRadius: '10px',
                border: '1px solid #1e293b',
              }}
            >
              <button
                type="button"
                onClick={() => { setTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: tab === 'login' ? '#dc2626' : 'transparent',
                  color: tab === 'login' ? '#ffffff' : '#94a3b8',
                }}
              >
                Daxil Ol
              </button>
              <button
                type="button"
                onClick={() => { setTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: tab === 'register' ? '#0891b2' : 'transparent',
                  color: tab === 'register' ? '#ffffff' : '#94a3b8',
                }}
              >
                Qeydiyyatdan Keç
              </button>
            </div>

            {/* Notifications */}
            {errorMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fca5a5',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                ⚠️ {errorMsg}
              </div>
            )}
            {successMsg && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#6ee7b7',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                ✓ {successMsg}
              </div>
            )}

            {/* TAB 1: LOGIN */}
            {tab === 'login' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                    Oyunçu Ləqəbi (Ad) *
                  </label>
                  <input
                    type="text"
                    placeholder="Məs: Don Corleone, Xəfiyyə..."
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      color: '#f8fafc',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                    Dərəcə (Tier) Seçimi
                  </label>
                  <select
                    value={selectedTier}
                    onChange={(e) => setSelectedTier(e.target.value as PlayerTier)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      color: '#f8fafc',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="TIER_1">{TIER_TITLES.TIER_1}</option>
                    <option value="TIER_2">{TIER_TITLES.TIER_2}</option>
                    <option value="TIER_3">{TIER_TITLES.TIER_3}</option>
                  </select>
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Dərəcəniz hansı paket və masalara daxil ola biləcəyinizi müəyyən edir.
                  </span>
                </div>

                <div style={{ marginTop: '4px' }}>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                    Ad və Soyad *
                  </label>
                  <input
                    type="text"
                    placeholder="Məs: Elmir Qasımov"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      color: '#f8fafc',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                    Oyunçu Ləqəbi (Username) *
                  </label>
                  <input
                    type="text"
                    placeholder="Məs: Don_Elmir"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: '#0f172a',
                      color: '#f8fafc',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                      Sinif / Status
                    </label>
                    <select
                      value={regGrade}
                      onChange={(e) => setRegGrade(Number(e.target.value))}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        color: '#f8fafc',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
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
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                      Başlanğıc Dərəcə
                    </label>
                    <select
                      value={regTier}
                      onChange={(e) => setRegTier(e.target.value as PlayerTier)}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        color: '#f8fafc',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="TIER_1">Əsgər (Tier 1)</option>
                      <option value="TIER_2">Kapo (Tier 2)</option>
                      <option value="TIER_3">Don (Tier 3)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                      Şifrə / PİN
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={regPin}
                      onChange={(e) => setRegPin(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        color: '#f8fafc',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
                      Təkrarı
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={regConfirmPin}
                      onChange={(e) => setRegConfirmPin(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: '#0f172a',
                        color: '#f8fafc',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '4px' }}>
                  <Button
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={handleRegisterSubmit}
                    style={{
                      background: 'linear-gradient(to right, #0891b2, #0d9488)',
                      borderColor: '#06b6d4',
                    }}
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
