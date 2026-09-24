'use client';

import React, { useState } from 'react';
import {
  Clock,
  Newspaper,
  Shield,
  Zap,
  Flame,
  AlertTriangle,
  Building,
  Target,
} from 'lucide-react';
import { LobbyState, NightActionType, PlayerSession } from '../../types/game';
import { ScrubbedPlayerView } from '../../types/engine';
import { AllInDistrict } from '../../types/roles';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { PlayerCard } from './PlayerCard';
import { VotingCourtPanel } from './VotingCourtPanel';
import {
  AZ_DANTE_CIRCLES,
  AZ_DISTRICTS,
  AZ_PHASES,
  AZ_UI,
} from '../../config/i18n/az';

export interface GameBoardProps {
  readonly lobbyState: LobbyState;
  readonly currentUserId: string;
  readonly onSelectPlayer?: (player: PlayerSession) => void;
  readonly onOpenNewspaper?: () => void;
  readonly onCastVote?: (candidateId: string) => void;
  readonly onRetractVote?: () => void;
  readonly onTriggerAction?: (actionType: NightActionType, targetPlayerId: string) => void;
  readonly onTriggerKlaatuFreeze?: () => void;
  readonly districtFinalists?: readonly string[];
  /** Set of player IDs currently speaking via voice chat */
  readonly speakingIds?: ReadonlySet<string>;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  lobbyState,
  currentUserId,
  onSelectPlayer,
  onOpenNewspaper,
  onCastVote,
  onRetractVote,
  onTriggerAction,
  onTriggerKlaatuFreeze,
  districtFinalists = [],
  speakingIds,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [activeDistrictTab, setActiveDistrictTab] = useState<AllInDistrict | 'ALL'>('ALL');

  const currentUser = lobbyState.players[currentUserId];
  const isAlive = currentUser?.isAlive ?? false;
  const isAllIn = lobbyState.mode === 'ALL_IN';
  const phase = lobbyState.phase;

  const dante = lobbyState.minigameSubStates.dantesInferno;
  const earth = lobbyState.minigameSubStates.earthStoodStill;
  const valkyrie = lobbyState.minigameSubStates.valkyrie;
  const prison = lobbyState.minigameSubStates.stanfordPrison;
  const catenaccio = lobbyState.minigameSubStates.catenaccio;

  const handleCardClick = (player: PlayerSession | ScrubbedPlayerView) => {
    setSelectedPlayerId(player.userId);
    if ('socketId' in player) {
      onSelectPlayer?.(player);
    }
  };

  const allPlayers = Object.values(lobbyState.players);
  const displayedPlayers = allPlayers.filter((p) => {
    if (!isAllIn || activeDistrictTab === 'ALL') return true;
    return p.currentDistrict === activeDistrictTab;
  });

  const office = currentUser?.allInIdentity?.layer2Office;
  const faction = currentUser?.allInIdentity?.layer1Faction ?? 'TOWN';

  let primaryActionLabel: string = AZ_UI.investigate;
  let primaryActionType: NightActionType = 'INVESTIGATE';
  if (
    faction === 'MAFIA' ||
    faction === 'YAKUZA' ||
    faction === 'VOID_CULT' ||
    faction === 'NEUTRAL_KILLER'
  ) {
    primaryActionLabel = AZ_UI.strike;
    primaryActionType = 'KILL';
  } else if (office === 'CITY_SURGEON') {
    primaryActionLabel = AZ_UI.protect;
    primaryActionType = 'PROTECT';
  } else if (office === 'CHIEF_FIRE_MARSHAL' || office === 'PRISON_WARDEN') {
    primaryActionLabel = AZ_UI.disrupt;
    primaryActionType = 'BLOCK';
  } else if (office === 'BLACK_MARKET_BROKER') {
    primaryActionLabel = AZ_UI.misdirect;
    primaryActionType = 'MISDIRECT';
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ─── TOP PHASE HUD ─────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-200">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {AZ_UI.currentPhase}
            </span>
            <Badge tone="purple">{lobbyState.mode}</Badge>
            <Badge tone="neutral">
              {AZ_UI.round} {lobbyState.roundNumber}
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white tracking-tight">
            {AZ_PHASES[lobbyState.phase] ?? lobbyState.phase}
          </h2>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {isAllIn && (
            <Badge tone="purple">
              {AZ_UI.maxKillsPerNight}: {lobbyState.globalNightKillCap}
            </Badge>
          )}

          {phase === 'NIGHT_BUFFER' && (
            <Badge tone="amber">
              {AZ_UI.nightJitter}: {lobbyState.nightJitterDelaySeconds}s
            </Badge>
          )}

          {onOpenNewspaper && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenNewspaper}
              icon={<Newspaper className="w-4 h-4 text-blue-500" />}
            >
              {AZ_UI.morningNewspaper}
            </Button>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
            <Clock className="w-4 h-4 text-zinc-400" />
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block leading-none">
                {AZ_UI.timeRemaining}
              </span>
              <span
                className={`text-base font-black leading-tight ${
                  lobbyState.phaseTimeRemaining <= 10
                    ? 'text-red-600 animate-pulse'
                    : 'text-zinc-900 dark:text-zinc-100'
                }`}
              >
                {lobbyState.phaseTimeRemaining}s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── DYNAMIC MINIGAME BANNERS ───────────────────────────────── */}
      {/* 1. Dante's Inferno */}
      {dante && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-950 dark:text-red-200 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" />
              <span>{AZ_UI.danteCircle}: {AZ_DANTE_CIRCLES[dante.currentCircle]?.name ?? dante.currentCircle}</span>
            </span>
            <Badge tone="red">{dante.completedCircles.length + 1} / 9 Dairə</Badge>
          </div>
          <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
            {AZ_DANTE_CIRCLES[dante.currentCircle]?.rule}
          </p>
        </div>
      )}

      {/* 2. The Day The Earth Stood Still */}
      {earth && (
        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-blue-700 dark:text-blue-300">
                ⌛ {AZ_UI.doomsdayClock}: {earth.doomsdayClockHours} / 12 Saat
              </span>
              <Badge tone={earth.doomsdayClockHours >= 10 ? 'red' : 'blue'}>
                {earth.doomsdayClockHours >= 12 ? 'PLANETAR MƏHV' : 'QORT AKTİV'}
              </Badge>
            </div>
            <p className="text-xs text-blue-800 dark:text-blue-300 mt-1">
              Hər günahsız vətəndaş edamı saatı 1 pillə irəli aparır.
            </p>
          </div>

          {!earth.worldFrozenUsed && onTriggerKlaatuFreeze && (
            <Button variant="warning" size="sm" onClick={onTriggerKlaatuFreeze}>
              ❄️ {AZ_UI.freezeWorld}
            </Button>
          )}
        </div>
      )}

      {/* 3. Operation Valkyrie */}
      {valkyrie && valkyrie.briefcaseLocationPlayerId && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-3">
          <div>
            <span className="font-bold text-sm text-amber-800 dark:text-amber-300">
              💼 {AZ_UI.briefcaseLocation}: {valkyrie.briefcaseLocationPlayerId}
            </span>
            <div className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              {AZ_UI.fuseCountdown}: {valkyrie.fuseTimerDaysRemaining} gün qalır.
            </div>
          </div>
          <Badge tone="amber">{valkyrie.fuseTimerDaysRemaining} GÜN</Badge>
        </div>
      )}

      {/* 4. Stanford Prison */}
      {prison && (
        <div className="p-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/60 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-zinc-800 dark:text-zinc-200">
              ⛓️ {AZ_UI.revoltMeter}: {prison.revoltMeter}%
            </span>
            <Badge tone={prison.revoltMeter >= 80 ? 'red' : 'neutral'}>
              {prison.riotTriggered ? 'QİYAM BAŞLADI' : 'NƏZARƏT ALTINDA'}
            </Badge>
          </div>
          <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                prison.revoltMeter >= 75 ? 'bg-red-600' : 'bg-amber-500'
              }`}
              style={{ width: `${prison.revoltMeter}%` }}
            />
          </div>
        </div>
      )}

      {/* 5. Catenaccio */}
      {catenaccio && (
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between">
          <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>{AZ_UI.defensiveWall} ({catenaccio.defensiveWallPlayerIds.length} Qalxan)</span>
          </span>
          <Badge tone={catenaccio.wallBreached ? 'red' : 'emerald'}>
            {catenaccio.wallBreached ? AZ_UI.wallBreachedAlert : 'SƏDD BÖLÜNMƏZ'}
          </Badge>
        </div>
      )}

      {/* ─── VOTING COURT PANEL (WHEN IN DAY_VOTING) ────────────────── */}
      {phase === 'DAY_VOTING' && onCastVote && onRetractVote && (
        <VotingCourtPanel
          lobbyState={lobbyState}
          currentUserId={currentUserId}
          selectedCandidateId={selectedPlayerId}
          districtFinalists={districtFinalists}
          onCastVote={onCastVote}
          onRetractVote={onRetractVote}
        />
      )}

      {/* ─── ALL-IN DISTRICT TABS ───────────────────────────────────── */}
      {isAllIn && (
        <div className="flex items-center gap-2 pb-2 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
          <Button
            variant={activeDistrictTab === 'ALL' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveDistrictTab('ALL')}
          >
            Bütün Kvartallar ({allPlayers.length})
          </Button>
          {(['ELITE', 'COMMERCIAL', 'INDUSTRIAL'] as AllInDistrict[]).map((dist) => {
            const count = allPlayers.filter((p) => p.currentDistrict === dist).length;
            return (
              <Button
                key={dist}
                variant={activeDistrictTab === dist ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setActiveDistrictTab(dist)}
              >
                {AZ_DISTRICTS[dist]} ({count})
              </Button>
            );
          })}
        </div>
      )}

      {/* ─── ACTIVE PLAYERS GRID ────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-zinc-950 dark:text-white">
              {AZ_UI.activeParticipants}
            </h3>
            <Badge tone="neutral">{displayedPlayers.length}</Badge>
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Hədəf seçmək üçün oyunçu kartına klikləyin
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {displayedPlayers.map((player) => (
            <PlayerCard
              key={player.userId}
              player={player}
              isSelected={selectedPlayerId === player.userId}
              isCurrentTurn={lobbyState.speakerQueue[0] === player.userId}
              hasVoteOnTarget={lobbyState.liveVotes[currentUserId] === player.userId}
              voteCount={
                Object.values(lobbyState.liveVotes).filter((id) => id === player.userId).length
              }
              isSpeaking={speakingIds?.has(player.userId) ?? false}
              onSelect={handleCardClick}
            />
          ))}
        </div>
      </div>

      {/* ─── STICKY BOTTOM ACTION BAR ───────────────────────────────── */}
      <div className="sticky bottom-4 z-40 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
              {AZ_UI.nightOrder} & Əməliyyat Paneli
            </span>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {selectedPlayerId
                ? `Seçilmiş Hədəf: ${
                    lobbyState.players[selectedPlayerId]?.displayRole.formatted ?? selectedPlayerId
                  }`
                : 'Əmr icra etmək üçün yuxarıdakı kartlardan hədəf seçin'}
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          disabled={!isAlive || !selectedPlayerId || selectedPlayerId === currentUserId}
          onClick={() => {
            if (selectedPlayerId && onTriggerAction) {
              onTriggerAction(primaryActionType, selectedPlayerId);
            }
          }}
          icon={<Zap className="w-4 h-4" />}
          className="shrink-0"
        >
          {primaryActionLabel}
        </Button>
      </div>
    </div>
  );
};
