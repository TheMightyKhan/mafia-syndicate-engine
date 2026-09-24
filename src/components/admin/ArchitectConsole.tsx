'use client';

import React, { CSSProperties, useState } from 'react';
import { GamePhase, LobbyState } from '../../types/game';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { AZ_PHASES } from '../../config/i18n/az';

export interface ArchitectConsoleProps {
  readonly lobbyState: LobbyState;
  readonly isTimerPaused?: boolean;
  readonly onOverridePhase: (phase: GamePhase, durationSeconds: number) => void;
  readonly onToggleTimerPause?: () => void;
  readonly onConfigureJitter?: (jitterSeconds: number) => void;
}

const PHASES_LIST: readonly GamePhase[] = [
  'DAY_REGIONAL_CAUCUS',
  'DAY_CENTRAL_ASSEMBLY',
  'DAY_VOTING',
  'NIGHT_BUFFER',
  'ENDED',
];

export const ArchitectConsole: React.FC<ArchitectConsoleProps> = ({
  lobbyState,
  isTimerPaused = false,
  onOverridePhase,
  onToggleTimerPause,
  onConfigureJitter,
}) => {
  const [selectedPhase, setSelectedPhase] = useState<GamePhase>('DAY_CENTRAL_ASSEMBLY');
  const [durationSec, setDurationSec] = useState<number>(300);
  const [jitterSec, setJitterSec] = useState<number>(lobbyState.nightJitterDelaySeconds);
  const [showSnapshot, setShowSnapshot] = useState<boolean>(false);

  const consoleStyle: CSSProperties = {
    backgroundColor: '#090d16',
    border: '1px solid #d97706',
    borderRadius: '12px',
    padding: '18px',
    boxShadow: '0 0 25px rgba(217, 119, 6, 0.15)',
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

  return (
    <div style={consoleStyle}>
      {/* Console Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '17px', fontWeight: 900 }}>
              🏛️ Memar Konsolu (The Architect Console)
            </h3>
            <Badge tone="amber">Platform Admin</Badge>
          </div>
          <p style={{ margin: '3px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
            Mərhələlərin səlahiyyətli dəyişdirilməsi, taymer idarəsi, jitter tənzimləməsi və sistem anlıq görüntüsü.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {onToggleTimerPause && (
            <Button variant={isTimerPaused ? 'primary' : 'warning'} size="sm" onClick={onToggleTimerPause}>
              {isTimerPaused ? '▶️ Taymeri Davam Etdir' : '⏸️ Taymeri Pauzaya Qoy'}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSnapshot(!showSnapshot)}
            style={{ borderColor: '#d97706' }}
          >
            {showSnapshot ? 'Görüntünü Gizlət' : '🔍 Dövlət Snapshot'}
          </Button>
        </div>
      </div>

      {/* Phase Override Controls */}
      <div style={sectionStyle}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
          Mərhələni Müstəqil Dəyişdir (Phase Override)
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value as GamePhase)}
            style={{
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #475569',
              fontSize: '13px',
            }}
          >
            {PHASES_LIST.map((p) => (
              <option key={p} value={p}>
                {AZ_PHASES[p]} ({p})
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Müddət (san):</span>
            <input
              type="number"
              value={durationSec}
              onChange={(e) => setDurationSec(Number(e.target.value))}
              style={{
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid #475569',
                width: '90px',
                fontSize: '13px',
              }}
            />
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onOverridePhase(selectedPhase, durationSec)}
          >
            Mərhələni Dərhal Tətbiq Et
          </Button>
        </div>
      </div>

      {/* Jitter Delay Configuration */}
      {onConfigureJitter && (
        <div style={sectionStyle}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
            Gecə Anti-Deduksiya Jitter Tənzimləməsi (3–7 saniyə)
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="range"
              min={3}
              max={7}
              step={1}
              value={jitterSec}
              onChange={(e) => {
                const val = Number(e.target.value);
                setJitterSec(val);
                onConfigureJitter(val);
              }}
              style={{ width: '180px' }}
            />
            <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '14px' }}>
              {jitterSec} saniyə
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              (Süni intellekt botları ilə insan oyunçuların reaksiya vaxtını maskalayır)
            </span>
          </div>
        </div>
      )}

      {/* State Snapshot Inspector */}
      {showSnapshot && (
        <div
          style={{
            backgroundColor: '#030712',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #334155',
            maxHeight: '260px',
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
            Canlı Otaq Vəziyyəti JSON
          </div>
          <pre style={{ margin: 0, fontSize: '11px', color: '#38bdf8', fontFamily: 'monospace' }}>
            {JSON.stringify(
              {
                lobbyId: lobbyState.lobbyId,
                phase: lobbyState.phase,
                roundNumber: lobbyState.roundNumber,
                playersCount: Object.keys(lobbyState.players).length,
                liveVotes: lobbyState.liveVotes,
                bufferedNightActionsCount: lobbyState.bufferedNightActions.length,
                adminUnlock: lobbyState.adminMasterUnlock,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
};
