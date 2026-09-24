'use client';

import React, { CSSProperties, useState } from 'react';
import { LobbyState } from '../../types/game';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface BailiffConsoleProps {
  readonly lobbyState: LobbyState;
  readonly isSlowModeActive?: boolean;
  readonly onNextSpeaker?: () => void;
  readonly onRemoveSpeaker?: (userId: string) => void;
  readonly onAddSpeaker?: (userId: string) => void;
  readonly onToggleSlowMode?: (enabled: boolean) => void;
  readonly onMutePlayer?: (userId: string, durationSeconds: number) => void;
}

export const BailiffConsole: React.FC<BailiffConsoleProps> = ({
  lobbyState,
  isSlowModeActive = false,
  onNextSpeaker,
  onRemoveSpeaker,
  onAddSpeaker,
  onToggleSlowMode,
  onMutePlayer,
}) => {
  const [selectedMuteTarget, setSelectedMuteTarget] = useState<string>('');
  const [muteSeconds, setMuteSeconds] = useState<number>(30);
  const [selectedAddSpeaker, setSelectedAddSpeaker] = useState<string>('');

  const consoleStyle: CSSProperties = {
    backgroundColor: '#090d16',
    border: '1px solid #ef4444',
    borderRadius: '12px',
    padding: '18px',
    boxShadow: '0 0 25px rgba(239, 68, 68, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '16px',
  };

  const sectionStyle: CSSProperties = {
    backgroundColor: '#0f172a',
    padding: '14px',
    borderRadius: '8px',
    border: '1px solid #1e293b',
  };

  const queue = lobbyState.speakerQueue;
  const currentSpeakerId = queue[0];
  const allPlayers = Object.values(lobbyState.players);

  return (
    <div style={consoleStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, color: '#f87171', fontSize: '17px', fontWeight: 900 }}>
              ⚖️ Məhkəmə İcraçısı Konsolu (The Bailiff Console)
            </h3>
            <Badge tone="red">Məhkəmə Nizam-İntizamı</Badge>
          </div>
          <p style={{ margin: '3px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
            Canlı çıxış növbəsi, yavaş rejim və intizam cəzaları (səssizləşdirmə).
          </p>
        </div>

        {onToggleSlowMode && (
          <Button
            variant={isSlowModeActive ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onToggleSlowMode(!isSlowModeActive)}
            style={{ borderColor: '#ef4444' }}
          >
            {isSlowModeActive ? '🛑 Yavaş Rejim Aktivdir' : '⏳ Yavaş Rejimi Aktivləşdir'}
          </Button>
        )}
      </div>

      {/* Speaker Queue Management */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
            🎤 Canlı Çıxış Növbəsi ({queue.length} Nəfər)
          </span>
          {onNextSpeaker && queue.length > 0 && (
            <Button variant="danger" size="sm" onClick={onNextSpeaker}>
              Növbəti Çıxışçıya Keç ⏭️
            </Button>
          )}
        </div>

        {currentSpeakerId ? (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#1c1917',
              borderRadius: '6px',
              borderLeft: '4px solid #ef4444',
              marginBottom: '10px',
            }}
          >
            <div style={{ fontSize: '11px', color: '#f87171', fontWeight: 800, textTransform: 'uppercase' }}>
              Hazırda Söz Alan:
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fef2f2' }}>
              {lobbyState.players[currentSpeakerId]?.displayRole.formatted ?? currentSpeakerId}
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginBottom: '10px' }}>
            Növbədə heç kim yoxdur.
          </div>
        )}

        {/* Add Speaker Form */}
        {onAddSpeaker && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={selectedAddSpeaker}
              onChange={(e) => setSelectedAddSpeaker(e.target.value)}
              style={{
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #475569',
                fontSize: '13px',
              }}
            >
              <option value="">Növbəyə Əlavə Et...</option>
              {allPlayers
                .filter((p) => p.isAlive && !queue.includes(p.userId))
                .map((p) => (
                  <option key={p.userId} value={p.userId}>
                    {p.username} ({p.displayRole.originalRoleName})
                  </option>
                ))}
            </select>
            <Button
              size="sm"
              variant="secondary"
              disabled={!selectedAddSpeaker}
              onClick={() => {
                if (selectedAddSpeaker) {
                  onAddSpeaker(selectedAddSpeaker);
                  setSelectedAddSpeaker('');
                }
              }}
            >
              Növbəyə Sal
            </Button>
          </div>
        )}
      </div>

      {/* Temporary Mute & Court Discipline Tools */}
      {onMutePlayer && (
        <div style={sectionStyle}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
            🔇 İntizam Cəzası: Müvəqqəti Səssizləşdirmə (Mute)
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={selectedMuteTarget}
              onChange={(e) => setSelectedMuteTarget(e.target.value)}
              style={{
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #475569',
                fontSize: '13px',
              }}
            >
              <option value="">Cəzalandırılacaq Oyunçu...</option>
              {allPlayers
                .filter((p) => p.isAlive)
                .map((p) => (
                  <option key={p.userId} value={p.userId}>
                    {p.username} ({p.tier})
                  </option>
                ))}
            </select>

            <select
              value={muteSeconds}
              onChange={(e) => setMuteSeconds(Number(e.target.value))}
              style={{
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #475569',
                fontSize: '13px',
              }}
            >
              <option value={15}>15 saniyə</option>
              <option value={30}>30 saniyə</option>
              <option value={60}>60 saniyə</option>
              <option value={120}>2 dəqiqə</option>
            </select>

            <Button
              size="sm"
              variant="danger"
              disabled={!selectedMuteTarget}
              onClick={() => {
                if (selectedMuteTarget) {
                  onMutePlayer(selectedMuteTarget, muteSeconds);
                  setSelectedMuteTarget('');
                }
              }}
            >
              Səssizləşdir
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
