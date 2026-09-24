'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { PACKS_CONFIG } from '../../config/packs.config';
import { GameMode } from '../../types/packs';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface CreateRoomModalProps {
  readonly isOpen: boolean;
  readonly defaultMode?: GameMode;
  readonly onClose: () => void;
  readonly onRoomCreated?: (roomUrl: string) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  defaultMode = 'SE7EN_DEADLY_SINS',
  onClose,
  onRoomCreated,
}) => {
  const [roomName, setRoomName] = useState<string>('Bakı Gecələri #1');
  const [selectedMode, setSelectedMode] = useState<GameMode>(defaultMode);
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [roomPassword, setRoomPassword] = useState<string>('');

  useEffect(() => {
    if (defaultMode) {
      setSelectedMode(defaultMode);
    }
  }, [defaultMode]);

  if (!isOpen) return null;

  const currentPack = PACKS_CONFIG[selectedMode];

  const handleLaunch = async () => {
    const slug = roomName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'tdv-masa';

    const lobbyId = `${selectedMode.toLowerCase()}-${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
    const targetUrl = `/lobby/${lobbyId}`;

    let hostName = 'Host';
    try {
      const saved = localStorage.getItem('tdv_mafia_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.username) hostName = parsed.username;
      }
    } catch {
      // Ignore
    }

    try {
      await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lobbyId,
          name: roomName.trim() || 'Yeni Mafiya Masası',
          mode: selectedMode,
          hostUsername: hostName,
          isPrivate,
          maxPlayers: currentPack?.maxPlayers || 12,
        }),
      });
    } catch {
      // Continue even if network fail
    }

    if (onRoomCreated) {
      onRoomCreated(targetUrl);
    } else {
      window.location.href = targetUrl;
    }
  };

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
    background: 'linear-gradient(145deg, rgba(20, 24, 38, 0.95) 0%, rgba(10, 14, 24, 0.98) 100%)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    borderRadius: '16px',
    padding: '30px',
    maxWidth: '540px',
    width: '100%',
    boxShadow: '0 25px 60px -12px rgba(220, 38, 38, 0.35), 0 0 50px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🎲</span>
              <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '20px', fontWeight: 900, letterSpacing: '0.02em' }}>
                Yeni Mafiya Masası Yarat
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
              Rejimi və parametrləri tənzimləyərək dərhal yeni canlı oyun otağı açın
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

        {/* Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Room Name */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
              Masa Adı *
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Məs: Bakı Gecələri #1"
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

          {/* Game Mode Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
              Oyun Rejimi (14 Klub Rejim)
            </label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as GameMode)}
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
              <optgroup label="Klassik Paketlər">
                <option value="SE7EN_DEADLY_SINS">Se7en Deadly Sins (5–7 Oyunçu)</option>
                <option value="AND_THEN_THERE_WERE_NONE">And Then There Were None (8–11 Oyunçu)</option>
                <option value="CRIME_AND_PUNISHMENT">Crime and Punishment (12–15 Oyunçu)</option>
                <option value="STEINS_GATE">Steins;Gate (16–20 Oyunçu)</option>
                <option value="DIES_IRAE">Dies Irae (21–24 Oyunçu)</option>
                <option value="ALL_TOMORROWS">All Tomorrows (25–30 Oyunçu)</option>
                <option value="FULL_HOUSE">Full House (30–39 Oyunçu)</option>
                <option value="TABULA_RASA">Tabula Rasa (5–50 Oyunçu)</option>
              </optgroup>
              <optgroup label="Asimmetrik Xüsusi Rejimlər">
                <option value="CATENACCIO">Catenaccio (10–12 Oyunçu)</option>
                <option value="STANFORD_PRISON">Stanford Prison (12–16 Oyunçu)</option>
                <option value="OPERATION_VALKYRIE">Operation Valkyrie (10–14 Oyunçu)</option>
                <option value="THE_DAY_THE_EARTH_STOOD_STILL">The Day the Earth Stood Still (12–16 Oyunçu)</option>
                <option value="DANTES_INFERNO">Dante's Inferno (11–13 Oyunçu)</option>
                <option value="CHERNOBYL_EXCLUSION_ZONE">Çernobıl: Təcrid Zonası (10–14 Oyunçu)</option>
                <option value="CYBERPUNK_NEO_BAKU">Cyberpunk 2077: Neo-Bakı (12–16 Oyunçu)</option>
                <option value="BERMUDA_TRIANGLE">Bermud Üçbucağı: Ruhlar Donanması (10–14 Oyunçu)</option>
                <option value="MIDNIGHT_SEANCE">Gecəyarısı Seansı: Qanlı Meri (11–15 Oyunçu)</option>
                <option value="SHERLOCK_BAKER_STREET">Baker Street: Holms vs Moriarti (8–12 Oyunçu)</option>
              </optgroup>
              <optgroup label="BÃ¶yÃ¼k ÅÉ™hÉ™r ArenasÄ±">
                <option value="ALL_IN">All-In (40–50 Oyunçu)</option>
              </optgroup>
            </select>
          </div>

          {/* Selected Pack Info Snapshot */}
          {currentPack && (
            <div
              style={{
                backgroundColor: '#0f172a',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #1e293b',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '14px' }}>
                  {currentPack.name}
                </span>
                <Badge tone={currentPack.isAllIn ? 'purple' : currentPack.isMinigame ? 'amber' : 'blue'}>
                  {currentPack.minPlayers}–{currentPack.maxPlayers} Oyunçu
                </Badge>
              </div>
              <div style={{ fontSize: '12px', color: '#fca5a5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🎭</span>
                <span><strong>Rollar:</strong> {currentPack.roleBreakdown}</span>
              </div>
            </div>
          )}

          {/* Privacy Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="privateToggle"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#dc2626' }}
            />
            <label htmlFor="privateToggle" style={{ fontSize: '13px', color: '#cbd5e1', cursor: 'pointer' }}>
              Qapalı / Şifrəli Masa (Yalnız dostlar üçün)
            </label>
          </div>

          {isPrivate && (
            <div>
              <input
                type="password"
                placeholder="Masa şifrəsi təyin edin..."
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
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
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <Button variant="outline" size="md" fullWidth onClick={onClose} style={{ borderColor: '#334155' }}>
            İmtina Et
          </Button>
          <Button variant="primary" size="md" fullWidth onClick={handleLaunch}>
            🚀 Masaya Daxil Ol
          </Button>
        </div>
      </div>
    </div>
  );
};
