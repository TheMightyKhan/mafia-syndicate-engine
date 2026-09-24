'use client';

import React from 'react';
import { Crown, Bot, Check, Clock, Mic, Shield, Sparkles } from 'lucide-react';
import { PlayerSession } from '../../types/game';
import { ScrubbedPlayerView } from '../../types/engine';
import { AllInDistrict, CivicOfficeType } from '../../types/roles';
import { Badge, BadgeTone } from '../ui/Badge';
import { AZ_CIVIC_OFFICES, AZ_DISTRICTS, AZ_UI } from '../../config/i18n/az';
import { playCard } from '../../utils/sfx';

export interface PlayerCardProps {
  readonly player: PlayerSession | ScrubbedPlayerView;
  readonly isLobbyPhase?: boolean;
  readonly isSelf?: boolean;
  readonly isCurrentTurn?: boolean;
  readonly hasVoteOnTarget?: boolean;
  readonly isSelected?: boolean;
  readonly isAccused?: boolean;
  readonly voteCount?: number;
  readonly isReady?: boolean;
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
  isAccused = false,
  voteCount = 0,
  isReady = false,
  isSpeaking = false,
  onSelect,
}) => {
  const isAlive = player.isAlive;
  const isHost = player.isHost;
  const isBot = isFullSession(player) ? player.isAiBotControlled : false;

  let roleTitle = player.username;
  let roleSubtitle = isLobbyPhase
    ? isHost
      ? 'Masa Rəhbəri (Host)'
      : isBot
      ? 'Gemini 3.8 Ağıllı Bot'
      : isReady
      ? 'Oyuna Hazırdır'
      : 'Gözləyir'
    : isSelf
    ? isFullSession(player)
      ? `Siz: ${player.displayRole.formatted}`
      : `Siz: ${player.ownRoleDisplay ?? 'Gizli Rol'}`
    : isBot
    ? 'AI Bot (Gizli Rol)'
    : 'Vətəndaş (Gizli Rol)';

  const district = !isLobbyPhase ? player.currentDistrict : null;
  const officeRaw = !isLobbyPhase
    ? isFullSession(player)
      ? player.allInIdentity?.layer2Office
      : (player.ownOffice as CivicOfficeType | null)
    : null;

  const handleClick = () => {
    playCard();
    onSelect?.(player);
  };

  // Determine card border and glow styling
  let containerClasses = 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm';

  if (!isAlive && !isLobbyPhase) {
    containerClasses = 'bg-zinc-100/60 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800/60 opacity-60 grayscale-[40%]';
  } else if (isAccused) {
    containerClasses = 'bg-red-500/10 dark:bg-red-950/40 border-red-500 ring-2 ring-red-500/80 shadow-[0_0_25px_rgba(239,68,68,0.5)] animate-pulse';
  } else if (isSelected) {
    containerClasses = 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20';
  } else if (isSpeaking) {
    containerClasses = 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/20';
  } else if (isCurrentTurn) {
    containerClasses = 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/20';
  } else if (hasVoteOnTarget) {
    containerClasses = 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/25';
  } else if (isSelf) {
    // Radiant holographic glow border for player's own card
    containerClasses = 'bg-gradient-to-br from-purple-50/90 via-white to-purple-100/80 dark:from-purple-950/40 dark:via-zinc-900 dark:to-purple-950/30 border-purple-400 dark:border-purple-500 ring-2 ring-purple-500/50 shadow-[0_0_20px_rgba(147,51,234,0.35)]';
  }

  return (
    <div
      onClick={handleClick}
      className={`relative p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-3 overflow-hidden select-none ${
        onSelect ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md' : 'cursor-default'
      } ${containerClasses}`}
    >
      {/* Radiant Glow ambient accent if self */}
      {isSelf && (
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-purple-500/20 rounded-full blur-xl pointer-events-none" />
      )}

      {/* Eliminated Stamp */}
      {!isLobbyPhase && !isAlive && (
        <div className="absolute top-3 right-[-10px] rotate-12 bg-red-600 text-white px-5 py-0.5 text-[10px] font-black tracking-widest uppercase border border-red-400 shadow-lg z-10 pointer-events-none">
          {AZ_UI.eliminated}
        </div>
      )}

      {/* Header: Avatar, Name & Badges */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar Circle */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border shadow-sm transition-transform duration-200 ${
              isHost
                ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-400/50 shadow-amber-500/20'
                : isSelf
                ? 'bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white border-purple-400/50 shadow-purple-500/30'
                : isBot
                ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white border-purple-400/50'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700'
            }`}
          >
            {isBot ? <Bot className="w-5 h-5" /> : player.username.charAt(0).toUpperCase()}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-sm text-zinc-950 dark:text-white truncate">
                {roleTitle}
              </span>

              {/* Bold "SƏN" Badge */}
              {isSelf && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-black px-2 py-0.2 rounded-full tracking-wider uppercase shadow-sm shadow-purple-500/30 shrink-0">
                  <Sparkles className="w-2.5 h-2.5" />
                  SƏN
                </span>
              )}

              {/* Refined 🤖 Gemini AI Badge */}
              {isBot && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-purple-500/15 dark:bg-purple-500/25 text-purple-700 dark:text-purple-300 font-extrabold px-1.5 py-0.2 rounded-md border border-purple-500/30 shrink-0">
                  🤖 Gemini AI
                </span>
              )}

              {isSpeaking && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded-full font-bold border border-emerald-500/30 animate-pulse shrink-0">
                  <Mic className="w-2.5 h-2.5" />
                  Danışır
                </span>
              )}
            </div>

            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              {roleSubtitle}
            </span>
          </div>
        </div>

        {/* Right Status Badges */}
        <div className="flex items-center gap-1 shrink-0">
          {isLobbyPhase ? (
            isHost ? (
              <Badge tone="amber" icon={<Crown className="w-3 h-3" />}>
                HOST
              </Badge>
            ) : isReady ? (
              <Badge tone="emerald" icon={<Check className="w-3 h-3" />}>
                HAZIR
              </Badge>
            ) : (
              <Badge tone="neutral" icon={<Clock className="w-3 h-3" />}>
                GÖZLƏYİR
              </Badge>
            )
          ) : (
            <>
              {voteCount > 0 && (
                <Badge tone="red" className="text-xs font-black px-2 py-0.5 shadow-sm">
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
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
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
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <span>Vəzifə:</span>
          <strong className="text-blue-600 dark:text-blue-400 font-bold">
            {AZ_CIVIC_OFFICES[officeRaw] ?? officeRaw}
          </strong>
        </div>
      )}
    </div>
  );
};
