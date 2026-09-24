'use client';

import React, { CSSProperties } from 'react';
import { PlayerSession } from '../../types/game';
import { ScrubbedPlayerView } from '../../types/engine';
import { AllInDistrict, CivicOfficeType } from '../../types/roles';
import { Badge, BadgeTone } from '../ui/Badge';
import { AZ_CIVIC_OFFICES, AZ_DISTRICTS, AZ_UI } from '../../config/i18n/az';

export interface PlayerCardProps {
  readonly player: PlayerSession | ScrubbedPlayerView;
  readonly isLobbyPhase?: boolean;
  readonly isSelf?: boolean;
  readonly isCurrentTurn?: boolean;
  readonly hasVoteOnTarget?: boolean;
  readonly isSelected?: boolean;
  readonly voteCount?: number;
  readonly isReady?: boolean;
  /** True when this player is actively speaking (voice chat) */
  readonly isSpeaking?: boolean;
  readonly onSelect?: (player: PlayerSession | ScrubbedPlayerView) => void;
}

function isFullSession(p: PlayerSession | ScrubbedPlayerView): p is PlayerSession {
  return 'displayRole' in p;
}

const DISTRICT_TONES: Record<AllInDistrict, BadgeTone> = {
  ELITE: 'purple',
  COMMERCIAL: 'blue',
  INDUSTRIAL: 'amber',
};

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  isLobbyPhase = false,
  isSelf = false,
  isCurrentTurn = false,
  hasVoteOnTarget = false,
  isSelected = false,
  voteCount = 0,
  isReady = false,
  isSpeaking = false,
  onSelect,
}) => {
  const isAlive = player.isAlive;
  const isHost = player.isHost;

  const isBot = isFullSession(player) && player.isAiBotControlled;

  // In LOBBY phase: NO ROLES ARE SHOWN. Everyone is just a player waiting for the game to start!
  let roleTitle = player.username;
  let roleSubtitle = isLobbyPhase
    ? isHost
      ? '👑 Masa Rəhbəri (Host)'
      : isBot
      ? '🤖 Gemini AI Bot (Hazırdır)'
      : isReady
      ? '✅ Oyuna Hazırdır'
      : '⏳ Başlamağı Gözləyir'
    : isSelf
    ? isFullSession(player)
      ? `Siz: ${player.displayRole.formatted}`
      : `Siz: ${player.ownRoleDisplay ?? 'Gizli Rol'}`
    : isBot
    ? '🤖 AI Bot (Gizli Rol)'
    : '🎭 Vətəndaş (Gizli Rol)';

  // All-In Public District & Office (only visible after game starts)
  const district = !isLobbyPhase ? player.currentDistrict : null;
  const officeRaw = !isLobbyPhase
    ? isFullSession(player)
      ? player.allInIdentity?.layer2Office
      : (player.ownOffice as CivicOfficeType | null)
    : null;

  const cardStyle: CSSProperties = {
    position: 'relative',
    padding: '16px',
    backgroundColor: isSelected ? '#172554' : isAlive ? '#090d16' : '#030712',
    border: isSelected
      ? '2px solid #3b82f6'
      : isSpeaking
      ? '2px solid #22c55e'
      : isCurrentTurn
      ? '2px solid #dc2626'
      : hasVoteOnTarget
      ? '2px solid #f59e0b'
      : '1px solid #1e293b',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    cursor: onSelect ? 'pointer' : 'default',
    opacity: isAlive ? 1 : 0.6,
    transition: 'all 180ms ease',
    boxShadow: isSelected
      ? '0 0 16px rgba(59, 130, 246, 0.35)'
      : isSpeaking
      ? '0 0 18px rgba(34, 197, 94, 0.45)'
      : '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    overflow: 'hidden',
  };

  return (
    <div style={cardStyle} onClick={() => onSelect?.(player)}>
      {/* Eliminated Stamp (Only during active game) */}
      {!isLobbyPhase && !isAlive && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '-10px',
            transform: 'rotate(18deg)',
            backgroundColor: 'rgba(185, 28, 28, 0.92)',
            color: '#fef2f2',
            padding: '2px 18px',
            fontSize: '11px',
            fontWeight: 900,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            border: '2px dashed #fca5a5',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          {AZ_UI.eliminated}
        </div>
      )}

      {/* Header: Avatar, Name & Ready Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Avatar Circle */}
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: isHost ? '#d97706' : isSelf ? '#dc2626' : isBot ? '#4f46e5' : '#1e293b',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '15px',
              border: isSelf ? '2px solid #f87171' : isBot ? '2px solid #818cf8' : '1px solid #334155',
            }}
          >
            {isBot ? '🤖' : player.username.charAt(0).toUpperCase()}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '15px' }}>
                {roleTitle}
              </span>
              {isSelf && (
                <span style={{ fontSize: '10px', backgroundColor: '#3b82f6', color: '#ffffff', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                  Siz
                </span>
              )}
              {isBot && (
                <span style={{ fontSize: '10px', backgroundColor: '#4338ca', color: '#e0e7ff', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                  Bot
                </span>
              )}
              {isSpeaking && (
                <span
                  style={{
                    fontSize: '10px',
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    color: '#4ade80',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    border: '1px solid rgba(34, 197, 94, 0.4)',
                    animation: 'speakPulse 0.8s ease-in-out infinite alternate',
                  }}
                >
                  🎙️ Danışır
                </span>
              )}
            </div>

            <span style={{ fontSize: '12px', color: isLobbyPhase ? (isReady || isBot ? '#34d399' : '#94a3b8') : isSelf ? '#38bdf8' : '#64748b' }}>
              {roleSubtitle}
            </span>
          </div>
        </div>

        {/* Right Badges */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {isLobbyPhase ? (
            isHost ? (
              <Badge tone="amber">👑 HOST</Badge>
            ) : isBot ? (
              <Badge tone="purple">🤖 AI BOT</Badge>
            ) : isReady ? (
              <Badge tone="emerald">✅ HAZIRDIR</Badge>
            ) : (
              <Badge tone="neutral">⏳ GÖZLƏYİR</Badge>
            )
          ) : (
            <>
              {voteCount > 0 && (
                <Badge tone="red" style={{ fontSize: '12px', padding: '2px 7px' }}>
                  {voteCount} səs
                </Badge>
              )}
              <Badge tone={isAlive ? 'emerald' : 'red'}>
                {isAlive ? AZ_UI.alive : AZ_UI.eliminated}
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Badges Bar (District or Host) */}
      {!isLobbyPhase && (
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '2px' }}>
          {district && (
            <Badge tone={DISTRICT_TONES[district] ?? 'blue'}>
              {AZ_DISTRICTS[district]}
            </Badge>
          )}
          {isHost && <Badge tone="amber">{AZ_UI.host}</Badge>}
        </div>
      )}

      {/* Office (Visible only during active game if applicable) */}
      {!isLobbyPhase && officeRaw && (
        <div
          style={{
            fontSize: '11px',
            color: '#94a3b8',
            borderTop: '1px solid #1e293b',
            paddingTop: '6px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>Vəzifə:</span>
          <strong style={{ color: '#38bdf8' }}>{AZ_CIVIC_OFFICES[officeRaw] ?? officeRaw}</strong>
        </div>
      )}

      {/* Speaking pulse animation */}
      {isSpeaking && (
        <style>{`
          @keyframes speakPulse {
            from { opacity: 0.65; transform: scale(0.97); }
            to   { opacity: 1;    transform: scale(1.03); }
          }
        `}</style>
      )}
    </div>
  );
};
