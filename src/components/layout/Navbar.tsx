'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
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
      // 1. Check URL SSO ticket (?sso_ticket=...)
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
              roleTitle: decoded.role === 'teacher' ? 'Müəllim' : (decoded.schoolClass ? `${decoded.schoolClass} Oyunçusu` : 'Klub Oyunçusu'),
              gamesPlayed: 14,
              winRate: 75
            });
            urlParams.delete('sso_ticket');
            const newSearch = urlParams.toString();
            window.history.replaceState({}, document.title, window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash);
            return;
          }
        }
      }

      // 2. Check local ecosystem session
      const ecoRaw = localStorage.getItem('tdv_ecosystem_session_v1');
      if (ecoRaw) {
        const ecoSess = JSON.parse(ecoRaw);
        if (ecoSess && (ecoSess.fullName || ecoSess.username)) {
          setCurrentUser({
            username: ecoSess.fullName || ecoSess.username,
            tier: 'TIER_1',
            roleTitle: ecoSess.role === 'teacher' ? 'Müəllim' : (ecoSess.schoolClass ? `${ecoSess.schoolClass} Oyunçusu` : 'Klub Oyunçusu'),
            gamesPlayed: 14,
            winRate: 75
          });
          return;
        }
      }

      // 3. Fallback to broker query on Hub
      if (typeof document !== 'undefined') {
        const ifr = document.createElement('iframe');
        ifr.src = 'https://tdv-community-hubs.vercel.app/sso-broker.html';
        ifr.style.display = 'none';
        document.body.appendChild(ifr);
        window.addEventListener('message', (e) => {
          if (!e.origin.includes('vercel.app') && !e.origin.includes('localhost')) return;
          if (e.data && e.data.type === 'TDV_SSO_DATA' && e.data.session) {
            const s = e.data.session;
            localStorage.setItem('tdv_ecosystem_session_v1', JSON.stringify(s));
            setCurrentUser({
              username: s.fullName || s.username,
              tier: 'TIER_1',
              roleTitle: s.role === 'teacher' ? 'Müəllim' : (s.schoolClass ? `${s.schoolClass} Oyunçusu` : 'Klub Oyunçusu'),
              gamesPlayed: 14,
              winRate: 75
            });
          }
        });
        ifr.onload = () => {
          setTimeout(() => {
            if (ifr.contentWindow) ifr.contentWindow.postMessage({ type: 'TDV_SSO_GET' }, '*');
          }, 200);
        };
      }
    } catch {
      // Storage unavailable
    }
  }, []);

  const handleLogin = (user: UserSessionState) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('tdv_mafia_user', JSON.stringify(user));
      localStorage.setItem('tdv_ecosystem_session_v1', JSON.stringify({
        userId: 'tdv-usr-' + Date.now().toString(36),
        username: user.username,
        fullName: user.username,
        role: 'player',
        grade: 10,
        avatar: '🕵️',
        token: 'sec_' + Math.random().toString(36).substring(2),
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
      }));
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

  const topRibbonStyle: CSSProperties = {
    backgroundColor: '#05070c',
    borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '6px 24px',
    fontSize: '11px',
    color: '#94a3b8',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    zIndex: 1001,
  };

  const navStyle: CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(7, 9, 14, 0.92)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
    padding: '10px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7), inset 0 -1px 0 rgba(239, 68, 68, 0.15)',
    gap: '14px',
    flexWrap: 'wrap',
  };

  return (
    <>
      {/* ================= TOP ECOSYSTEM STATUS RIBBON ================= */}
      <aside aria-label="TDV Organization Bar" style={topRibbonStyle}>
        {/* Left: Organization Identity & News */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <a
            href="https://tdv-community-hubs.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#f8fafc',
              textDecoration: 'none',
              fontWeight: 800,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                boxShadow: '0 0 8px #ef4444',
              }}
            />
            <span>TDV Community Labs</span>
          </a>
          <span style={{ color: '#334155' }}>|</span>
          <span style={{ color: '#fef08a', fontSize: '11px', fontWeight: 700 }}>TDV Community Labs • Mafiya Klubu</span>
          <span style={{ color: '#334155' }}>•</span>
          <span style={{ color: '#fca5a5', fontWeight: 600, fontSize: '11px' }}>
            📰 24 Rol Ensiklopediyası və 15 Oyun Formatı aktivdir!
          </span>
        </div>

        {/* Right: Live Server Nodes & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#86efac', fontSize: '11px', fontWeight: 700 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span>Bakı Node-01 (16ms)</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              padding: '2px 8px',
              borderRadius: '6px',
              color: '#6ee7b7',
              fontSize: '10px',
              fontWeight: 700,
            }}
          >
            <i className="fa-solid fa-robot" style={{ fontSize: '10px' }} />
            <span>Anti-AFK Gemini 3.8</span>
          </div>
        </div>
      </aside>

      {/* ================= MAIN NAVIGATION HEADER ================= */}
      <nav style={navStyle}>
        {/* Left: Brand Logo + Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <a
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
            }}
          >
            <img
              src="/assets/tdv-logo.jpg"
              alt="TDV BTL Logo"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'contain',
                border: '2px solid rgba(212, 175, 55, 0.75)',
                boxShadow: '0 0 16px rgba(122, 28, 60, 0.5)',
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontWeight: 900,
                  fontSize: '18px',
                  letterSpacing: '0.04em',
                  color: '#f8fafc',
                  lineHeight: 1.1,
                }}
              >
                TDV BTL <span style={{ color: '#ef4444' }}>MAFIA KLUB</span>
              </span>
              <span style={{ fontSize: '10px', color: '#fbbf24', letterSpacing: '0.08em', fontWeight: 700 }}>
                BAKI TÜRK LİSEYİ • DEDUKSİYA
              </span>
            </div>
          </a>
        </div>

        {/* Center: Ecosystem Switcher Pill & In-Game Navigation */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Unified Ecosystem Switcher Pill */}
          <nav
            aria-label="TDV Ecosystem Switcher"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(51, 65, 85, 0.6)',
              padding: '4px 6px',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: 600,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            }}
          >
            <a
              href="https://tdv-community-hubs.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              title="TDV Hub Mərkəzi Portalı"
              className="btn-pressable"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 11px',
                borderRadius: '11px',
                color: '#cbd5e1',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <i className="fa-solid fa-house" style={{ fontSize: '11px', color: '#60a5fa' }} />
              <span>Mərkəz</span>
            </a>

            <a
              href="https://tdv-e-school.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              title="TDV E-School Təhsil Portalı"
              className="btn-pressable"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 11px',
                borderRadius: '11px',
                color: '#cbd5e1',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <i className="fa-solid fa-graduation-cap" style={{ fontSize: '11px', color: '#34d399' }} />
              <span>E-School</span>
            </a>

            <a
              href="https://school-minifootball-tournament.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              title="TDV Sports Minifutbol Turniri"
              className="btn-pressable"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 11px',
                borderRadius: '11px',
                color: '#cbd5e1',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <i className="fa-solid fa-trophy" style={{ fontSize: '11px', color: '#60a5fa' }} />
              <span>Sports</span>
            </a>

            <a
              href="https://tdv-community-hubs.vercel.app/games"
              title="TDV Games & Mafia (Aktiv)"
              className="btn-pressable"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 11px',
                borderRadius: '11px',
                background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(153, 27, 27, 0.95) 100%)',
                color: '#ffffff',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 0 12px rgba(220, 38, 38, 0.45)',
                border: '1px solid rgba(248, 113, 113, 0.5)',
              }}
            >
              <i className="fa-solid fa-gamepad" style={{ fontSize: '11px', color: '#fca5a5' }} />
              <span>Games</span>
              <span
                style={{
                  fontSize: '9px',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                  color: '#fee2e2',
                  fontWeight: 800,
                  border: '1px solid rgba(254, 202, 202, 0.4)',
                }}
              >
                Mafia
              </span>
            </a>
          </nav>

          {/* In-Game Action Buttons */}
          <button
            type="button"
            className="btn-pressable"
            onClick={() => setIsRulesOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 13px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f8fafc',
            }}
          >
            <i className="fa-solid fa-book-open text-red-400" style={{ color: '#f87171' }} />
            <span>Qaydalar</span>
            <span
              style={{
                fontSize: '9px',
                backgroundColor: 'rgba(239, 68, 68, 0.25)',
                color: '#fca5a5',
                padding: '1px 5px',
                borderRadius: '4px',
                fontWeight: 800,
              }}
            >
              24 Rol
            </span>
          </button>

          <button
            type="button"
            className="btn-pressable"
            onClick={() => setIsLeaderboardOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 13px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: '#f8fafc',
            }}
          >
            <i className="fa-solid fa-trophy" style={{ color: '#fbbf24' }} />
            <span>Reytinq</span>
          </button>

          <button
            type="button"
            className="btn-pressable"
            onClick={() => setIsCatalogOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 13px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 600,
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#f8fafc',
            }}
          >
            <i className="fa-solid fa-layer-group" style={{ color: '#fbbf24' }} />
            <span>Formatlar</span>
          </button>
        </div>

        {/* Right: Quick Action & User Session */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Quick Create Room Button */}
          <button
            type="button"
            className="btn-pressable"
            onClick={() => setIsCreateRoomOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 15px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              border: '1px solid rgba(52, 211, 153, 0.4)',
              boxShadow: '0 0 14px rgba(16, 185, 129, 0.3)',
              cursor: 'pointer',
            }}
          >
            <i className="fa-solid fa-plus" />
            <span>Masa Yarat</span>
          </button>

          {/* User Profile Bar */}
          {currentUser ? (
            <div
              onClick={() => setIsAuthOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '4px 12px',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '9999px',
                transition: 'border-color 150ms ease',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 800,
                }}
              >
                {currentUser.username.charAt(0).toUpperCase()}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#f8fafc' }}>
                  {currentUser.username}
                </span>
                <span style={{ fontSize: '9px', color: '#38bdf8' }}>{currentUser.roleTitle}</span>
              </div>

              <Badge tone={currentUser.tier === 'TIER_3' ? 'purple' : currentUser.tier === 'TIER_2' ? 'amber' : 'neutral'}>
                {currentUser.tier}
              </Badge>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAuthOpen(true)}
              style={{
                borderColor: 'rgba(239, 68, 68, 0.4)',
                color: '#f8fafc',
                fontSize: '12px',
                fontWeight: 700,
                padding: '6px 14px',
              }}
            >
              👤 Giriş
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
    </>
  );
};