'use client';

import React from 'react';
import { Crown, Bot, Check, Clock, Mic, User, Shield, Skull } from 'lucide-react';
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

  let roleTitle = player.username;
  let roleSubtitle = isLobbyPhase
    ? isHost
      ? 'Masa Rəhbəri (Host)'
      : isBot
      ? 'Gemini AI Bot'
      : isReady
      ? 'Oyuna Hazırdır'
      : 'Gözləyir'
    : isSelf
    ? isFullSession(player)
      ? `Siz: ${player.displayRole.formatted}`
      : `Siz: ${player.ownRoleDisplay ?? 'Gizli Rol'}`
    : isBot
    ? 'AI Bot (Gizli)'
    : 'Vətəndaş (Gizli)';

  const district = !isLobbyPhase ? player.currentDistrict : null;
  const officeRaw = !isLobbyPhase
    ? isFullSession(player)
      ? player.allInIdentity?.layer2Office
      : (player.ownOffice as CivicOfficeType | null)
    : null;

  return (
    <div
      onClick={() => onSelect?.(player)}
      className={`relative p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between gap-3 overflow-hidden select-none ${
        onSelect ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default'
      } ${
        isSelected
          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
          : isSpeaking
          ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/25 shadow-md'
          : isCurrentTurn
          ? 'bg-red-50/80 dark:bg-red-950/30 border-red-500 ring-2 ring-red-500/25 shadow-md'
          : hasVoteOnTarget
          ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/20'
          : isAlive
          ? 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm dark:shadow-none'
          : 'bg-zinc-100/60 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800/60 opacity-60'
      }`}
    >
      {/* Eliminated Stamp */}
      {!isLobbyPhase && !isAlive && (
        <div className="absolute top-3 right-[-8px] rotate-12 bg-rose-600 text-white px-4 py-0.5 text-[10px] font-black tracking-widest uppercase border border-rose-400 shadow-md z-10 pointer-events-none">
          {AZ_UI.eliminated}
        </div>
      )}

      {/* Header: Avatar, Name & Status */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Avatar Circle */}
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
              isHost
                ? 'bg-amber-500 text-white border-amber-400'
                : isSelf
                ? 'bg-red-600 text-white border-red-400'
                : isBot
                ? 'bg-indigo-600 text-white border-indigo-400'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700'
            }`}
          >
            {isBot ? <Bot className="w-4 h-4" /> : player.username.charAt(0).toUpperCase()}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                {roleTitle}
              </span>
              {isSelf && (
                <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-bold shrink-0">
                  Siz
                </span>
              )}
              {isBot && (
                <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-bold shrink-0">
                  Bot
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
            ) : isBot ? (
              <Badge tone="purple" icon={<Bot className="w-3 h-3" />}>
                BOT
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
                <Badge tone="red" className="text-xs font-bold">
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
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
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
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <span>Vəzifə:</span>
          <strong className="text-blue-600 dark:text-blue-400">
            {AZ_CIVIC_OFFICES[officeRaw] ?? officeRaw}
          </strong>
        </div>
      )}
    </div>
  );
};
