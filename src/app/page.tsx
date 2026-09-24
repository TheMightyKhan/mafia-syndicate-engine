'use client';

import React, { useState, useEffect } from 'react';
import { GameMode } from '../types/packs';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CreateRoomModal } from '../components/modals/CreateRoomModal';
import { RulesModal } from '../components/modals/RulesModal';
import { LeaderboardModal } from '../components/modals/LeaderboardModal';
import { GameModesCatalogModal } from '../components/modals/GameModesCatalogModal';
import { PublicRoomSummary } from './api/rooms/route';

export default function HomePage() {
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState<boolean>(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState<boolean>(false);
  const [selectedPackForModal, setSelectedPackForModal] = useState<GameMode>('SE7EN_DEADLY_SINS');

  // Join by room code
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [isJoinByCodeOpen, setIsJoinByCodeOpen] = useState<boolean>(false);

  // Live state tracking (Real data only, ZERO fake random stats)
  const [activeRooms, setActiveRooms] = useState<PublicRoomSummary[]>([]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch('/api/rooms');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.rooms)) {
            setActiveRooms(data.rooms);
          }
        }
      } catch {
        // Network resilience
      }
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, []);

  const openCreateModal = (mode?: GameMode) => {
    if (mode) setSelectedPackForModal(mode);
    setIsCreateRoomOpen(true);
  };

  const handleJoinByCode = () => {
    const code = roomCodeInput.trim();
    if (!code) return;
    window.location.href = `/lobby/${encodeURIComponent(code)}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '70px' }}>
      {/* ─── TDV AURA WELCOME BANNER (ROUNDED-3XL WITH GLOW & FEATURE STATS) ──── */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '16px 20px 0' }}>
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '24px',
            background: 'linear-gradient(145deg, rgba(32, 10, 14, 0.96) 0%, rgba(20, 12, 16, 0.96) 50%, rgba(9, 13, 22, 0.98) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.8), 0 0 40px rgba(220, 38, 38, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            padding: '48px 36px 40px',
          }}
        >
          {/* Ambient Glow Orbs */}
          <div
            style={{
              position: 'absolute',
              right: '-60px',
              top: '-60px',
              width: '280px',
              height: '280px',
              borderRadius: '50%',
              backgroundColor: '#ef4444',
              opacity: 0.14,
              filter: 'blur(70px)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '10%',
              bottom: '-80px',
              width: '240px',
              height: '240px',
              borderRadius: '50%',
              backgroundColor: '#dc2626',
              opacity: 0.1,
              filter: 'blur(70px)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ position: 'relative', zIndex: 10, maxWidth: '760px' }}>
            {/* Live Beacon Tag & School Heritage */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 14px',
                borderRadius: '9999px',
                background: 'linear-gradient(135deg, rgba(122, 28, 60, 0.28) 0%, rgba(212, 175, 55, 0.15) 100%)',
                border: '1px solid rgba(212, 175, 55, 0.45)',
                color: '#fef08a',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '16px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <img
                src="/assets/tdv-logo.jpg"
                alt="TDV Emblem"
                style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid #fbbf24' }}
              />
              <span>TDV Community Labs • Mafia Klubu</span>
              <span style={{ color: 'rgba(212, 175, 55, 0.4)' }}>•</span>
              <span style={{ color: '#86efac', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                Mövsüm #1
              </span>
            </div>

            {/* Main Title */}
            <h1
              style={{
                margin: '0 0 12px 0',
                fontSize: 'clamp(32px, 5.5vw, 54px)',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                color: '#ffffff',
                textShadow: '0 4px 25px rgba(0, 0, 0, 0.8)',
              }}
            >
              TDV BTL <span style={{ color: '#ef4444', textShadow: '0 0 35px rgba(239, 68, 68, 0.8), 0 0 70px rgba(220, 38, 38, 0.45)' }}>MAFIA</span>
            </h1>

            {/* Slogan */}
            <p
              style={{
                margin: '0 0 26px 0',
                color: '#cbd5e1',
                fontSize: '15px',
                lineHeight: 1.6,
                maxWidth: '600px',
              }}
            >
              Kölgələrin idarə etdiyi şəhərdə həqiqət ən təhlükəli silahdır. Masa yarat, linki dostlarına göndər və intellektual psixoloji mübarizəyə dərhal başla.
            </p>

            {/* Hero Actions: Masa Yarat, Kodu Daxil Et, and Rejimlər Kataloqu */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => openCreateModal()}
                style={{
                  padding: '13px 30px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '15px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <i className="fa-solid fa-dice" />
                Masa Yarat
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsJoinByCodeOpen(true)}
                style={{
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#f8fafc',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  padding: '13px 22px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '15px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <i className="fa-solid fa-key" />
                Kodu Daxil Et
              </Button>

              <button
                type="button"
                className="btn-pressable"
                onClick={() => setIsRulesOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '13px 22px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '14px',
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.25) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#fee2e2',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(220, 38, 38, 0.2)',
                }}
              >
                <i className="fa-solid fa-book-open" style={{ color: '#fca5a5' }} />
                <span>24 Rol Ensiklopediyası</span>
              </button>

              <button
                type="button"
                className="btn-pressable"
                onClick={() => setIsCatalogOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '13px 22px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '14px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(180, 83, 9, 0.22) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: '#fde68a',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.18)',
                }}
              >
                <i className="fa-solid fa-layer-group" style={{ color: '#fbbf24' }} />
                <span>24 Rol & 15 Rejim</span>
              </button>
            </div>
          </div>
        </div>

        {/* TDV Quick Feature Highlight Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            marginTop: '16px',
          }}
        >
          <div
            onClick={() => setIsCatalogOpen(true)}
            className="card-hover-lift"
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '14px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0,
              }}
            >
              <i className="fa-solid fa-gamepad" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>15 Oyun Formatı</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Kataloqa baxmaq üçün klikləyin ➔</div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '14px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0,
              }}
            >
              <i className="fa-solid fa-stopwatch" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>75s Canlı Faza Vaxtı</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Dinamik Anti-AFK rejimi</div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '14px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0,
              }}
            >
              <i className="fa-solid fa-shield-halved" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>Sıfır-Məlumat Təhlükəsizliyi</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Şifrəli rol idarəetməsi</div>
            </div>
          </div>

          <div
            onClick={() => setIsLeaderboardOpen(true)}
            className="card-hover-lift"
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '14px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                flexShrink: 0,
              }}
            >
              <i className="fa-solid fa-trophy" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#f8fafc' }}>Canlı Reytinq Cədvəli</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Liderlərə bax ➔</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CANLI AKTİV MASALAR BÖLMƏSİ ─────────────────────────────────── */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 20px' }}>
        <div style={{ marginBottom: '14px', borderLeft: '4px solid #ef4444', paddingLeft: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Açıq Canlı Masalar ({activeRooms.length})
          </h2>
          <p style={{ margin: '3px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
            Aktiv masalardan birinə birbaşa qoşula bilərsiniz.
          </p>
        </div>

        {activeRooms.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
            {activeRooms.map((room) => (
              <div
                key={room.lobbyId}
                className="card-hover-lift"
                style={{
                  background: 'linear-gradient(145deg, rgba(16, 24, 38, 0.8) 0%, rgba(10, 15, 26, 0.9) 100%)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '14px',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>
                      {room.name}
                    </h4>
                    <Badge tone="red">{room.mode.replace(/_/g, ' ')}</Badge>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Host: <strong style={{ color: '#f1f5f9' }}>{room.hostUsername}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-users" style={{ fontSize: '11px' }} />
                    {room.playerCount} / {room.maxPlayers} Oyunçu
                  </span>
                  <a
                    href={`/lobby/${room.lobbyId}`}
                    style={{
                      padding: '7px 16px',
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#ffffff',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '12px',
                      fontWeight: 800,
                      boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    Qoşul <i className="fa-solid fa-arrow-right" style={{ fontSize: '10px' }} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.5)',
              backdropFilter: 'blur(10px)',
              border: '1px dashed rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '28px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '24px', opacity: 0.8 }}>🎲</div>
            <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '14px' }}>
              Hazırda heç bir aktiv masa yoxdur
            </div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px', maxWidth: '440px' }}>
              Yuxarıdakı &quot;Masa Yarat&quot; düyməsi ilə ilk masanı aça və ya Formatlar Kataloqundan istədiyiniz rejimi seçə bilərsiniz.
            </p>
          </div>
        )}
      </section>

      {/* ─── VARIANT A: SLEEK COMPACT CATALOG DISCOVERY STRIP (CRIMSON NOIR) ─── */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 20px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(28, 12, 16, 0.9) 0%, rgba(12, 14, 22, 0.95) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '18px',
            padding: '24px 30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', maxWidth: '700px' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.35) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#fca5a5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                flexShrink: 0,
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
              }}
            >
              <i className="fa-solid fa-layer-group" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#f8fafc' }}>
                  Oyun Formatları & 24 Rol Kataloqu
                </h3>
                <Badge tone="red">15 Rejim • 24 Rol</Badge>
              </div>
              <p style={{ margin: 0, color: '#cbd5e1', fontSize: '13px', lineHeight: 1.5 }}>
                Dante&apos;s Inferno (9 Dairə Əzabları), Çernobıl, Cyberpunk, Baker Street, Stanford Prison və 40–50 nəfərlik All-In rejimi daxil olmaqla bütün 24 rolu və xüsusi qabiliyyətləri araşdırın.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={() => setIsCatalogOpen(true)}
            style={{
              borderColor: 'rgba(239, 68, 68, 0.5)',
              color: '#ffffff',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.35) 100%)',
              boxShadow: '0 0 16px rgba(239, 68, 68, 0.3)',
              padding: '11px 24px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <i className="fa-solid fa-book-open" style={{ color: '#fca5a5' }} />
            Kataloqa Bax (15 Rejim) ➔
          </Button>
        </div>
      </section>

      {/* ─── JOIN BY CODE MODAL ────────────────────────────────────────────── */}
      {isJoinByCodeOpen && (
        <div
          style={{
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
          }}
          onClick={() => setIsJoinByCodeOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#090d16',
              border: '1px solid #334155',
              borderRadius: '14px',
              padding: '26px',
              maxWidth: '420px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-key" style={{ color: '#f87171' }} />
                Otaq Kodu ilə Qoşul
              </h3>
              <button
                onClick={() => setIsJoinByCodeOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>
              Dostunuzun göndərdiyi masa kodunu və ya identifikatorunu daxil edin:
            </p>

            <input
              type="text"
              placeholder="Məs: se7en-deadly-sins-baku-1234"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJoinByCode();
              }}
              style={{
                width: '100%',
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="outline" size="md" fullWidth onClick={() => setIsJoinByCodeOpen(false)}>
                Bağla
              </Button>
              <Button variant="primary" size="md" fullWidth disabled={!roomCodeInput.trim()} onClick={handleJoinByCode}>
                Masaya Gir ➔
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        defaultMode={selectedPackForModal}
        onClose={() => setIsCreateRoomOpen(false)}
      />

      <GameModesCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onSelectMode={(mode) => {
          setSelectedPackForModal(mode);
          setIsCreateRoomOpen(true);
        }}
      />

      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />
    </div>
  );
}
