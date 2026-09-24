'use client';

import React, { CSSProperties, useState } from 'react';
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

  // Filter players by active district tab if in All-In
  const allPlayers = Object.values(lobbyState.players);
  const displayedPlayers = allPlayers.filter((p) => {
    if (!isAllIn || activeDistrictTab === 'ALL') return true;
    return p.currentDistrict === activeDistrictTab;
  });

  // Action Bar capability derivation based on civic office / faction
  const office = currentUser?.allInIdentity?.layer2Office;
  const faction = currentUser?.allInIdentity?.layer1Faction ?? 'TOWN';

  let primaryActionLabel: string = AZ_UI.investigate;
  let primaryActionType: NightActionType = 'INVESTIGATE';
  if (faction === 'MAFIA' || faction === 'YAKUZA' || faction === 'VOID_CULT' || faction === 'NEUTRAL_KILLER') {
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

  // Container styling
  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  };

  // Top HUD styling
  const hudStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 24px',
    backgroundColor: '#090d16',
    borderRadius: '12px',
    border: '1px solid #1e293b',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
    flexWrap: 'wrap',
    gap: '12px',
  };

  return (
    <div style={containerStyle}>
      {/* ─── TOP PHASE HUD ─────────────────────────────────────────────────── */}
      <div style={hudStyle}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {AZ_UI.currentPhase}
            </span>
            <Badge tone="purple">{lobbyState.mode}</Badge>
            <Badge tone="neutral">
              {AZ_UI.round} {lobbyState.roundNumber}
            </Badge>
          </div>
          <h1 style={{ margin: '4px 0 0 0', color: '#f8fafc', fontSize: '22px', fontWeight: 900 }}>
            {AZ_PHASES[lobbyState.phase] ?? lobbyState.phase}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
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
            <Button variant="outline" size="sm" onClick={onOpenNewspaper} style={{ borderColor: '#475569' }}>
              📰 {AZ_UI.morningNewspaper}
            </Button>
          )}

          <div
            style={{
              textAlign: 'right',
              backgroundColor: '#030712',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid #1e293b',
            }}
          >
            <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>{AZ_UI.timeRemaining}</span>
            <div style={{ fontSize: '20px', fontWeight: 900, color: lobbyState.phaseTimeRemaining <= 10 ? '#ef4444' : '#38bdf8' }}>
              {lobbyState.phaseTimeRemaining}s
            </div>
          </div>
        </div>
      </div>

      {/* ─── DYNAMIC MINIGAME BANNERS ───────────────────────────────────────── */}
      {/* 1. Dante's Inferno */}
      {dante && (
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#270808',
            border: '1px solid #991b1b',
            borderRadius: '10px',
            boxShadow: '0 0 20px rgba(153, 27, 27, 0.25)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 800, color: '#fca5a5', fontSize: '14px' }}>
              🌋 {AZ_UI.danteCircle}: {AZ_DANTE_CIRCLES[dante.currentCircle]?.name ?? dante.currentCircle}
            </span>
            <Badge tone="red">{dante.completedCircles.length + 1} / 9 Dairə</Badge>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#fee2e2' }}>
            {AZ_DANTE_CIRCLES[dante.currentCircle]?.rule}
          </p>
        </div>
      )}

      {/* 2. The Day The Earth Stood Still */}
      {earth && (
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#0c1b33',
            border: '1px solid #1d4ed8',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, color: '#93c5fd', fontSize: '15px' }}>
                ⌛ {AZ_UI.doomsdayClock}: {earth.doomsdayClockHours} / 12 Saat
              </span>
              <Badge tone={earth.doomsdayClockHours >= 10 ? 'red' : 'blue'}>
                {earth.doomsdayClockHours >= 12 ? 'PLANETAR MƏHV' : 'QORT AKTİV'}
              </Badge>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#bfdbfe' }}>
              Hər günahsız vətəndaş edamı saatı 1 pillə irəli aparır. 12-də Qortun lazeri bütün şəhəri buxarlandıracaq!
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
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#3b1803',
            border: '1px solid #d97706',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ fontWeight: 800, color: '#fde68a', fontSize: '14px' }}>
              💼 {AZ_UI.briefcaseLocation}: {valkyrie.briefcaseLocationPlayerId}
            </span>
            <div style={{ fontSize: '12px', color: '#fef3c7', marginTop: '2px' }}>
              {AZ_UI.fuseCountdown}: {valkyrie.fuseTimerDaysRemaining} gün qalır. Çanta partlayanda hədəf məhv ediləcək!
            </div>
          </div>
          <Badge tone="amber">{valkyrie.fuseTimerDaysRemaining} GÜN</Badge>
        </div>
      )}

      {/* 4. Stanford Prison */}
      {prison && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#171717',
            border: '1px solid #525252',
            borderRadius: '10px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontWeight: 800, color: '#e5e5e5', fontSize: '14px' }}>
              ⛓️ {AZ_UI.revoltMeter}: {prison.revoltMeter}%
            </span>
            <Badge tone={prison.revoltMeter >= 80 ? 'red' : 'neutral'}>
              {prison.riotTriggered ? 'QİYAM BAŞLADI' : 'NƏZARƏT ALTINDA'}
            </Badge>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#262626', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${prison.revoltMeter}%`,
                height: '100%',
                backgroundColor: prison.revoltMeter >= 75 ? '#dc2626' : '#f59e0b',
                transition: 'width 300ms ease',
              }}
            />
          </div>
        </div>
      )}

      {/* 5. Catenaccio */}
      {catenaccio && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 800, color: '#94a3b8', fontSize: '14px' }}>
            🛡️ {AZ_UI.defensiveWall} ({catenaccio.defensiveWallPlayerIds.length} Qalxan)
          </span>
          <Badge tone={catenaccio.wallBreached ? 'red' : 'emerald'}>
            {catenaccio.wallBreached ? AZ_UI.wallBreachedAlert : 'SƏDD BÖLÜNMƏZ'}
          </Badge>
        </div>
      )}

      {/* ─── VOTING COURT PANEL (WHEN IN DAY_VOTING) ───────────────────────── */}
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

      {/* ─── ALL-IN DISTRICT TABS (CENTER STAGE) ───────────────────────────── */}
      {isAllIn && (
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
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

      {/* ─── ACTIVE PLAYERS GRID ───────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: '17px', fontWeight: 800 }}>
            {AZ_UI.activeParticipants} ({displayedPlayers.length})
          </h2>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Hədəf seçmək üçün oyunçu kartına klikləyin
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '14px',
          }}
        >
          {displayedPlayers.map((player) => (
            <PlayerCard
              key={player.userId}
              player={player}
              isSelected={selectedPlayerId === player.userId}
              isCurrentTurn={lobbyState.speakerQueue[0] === player.userId}
              hasVoteOnTarget={lobbyState.liveVotes[currentUserId] === player.userId}
              voteCount={Object.values(lobbyState.liveVotes).filter((id) => id === player.userId).length}
              isSpeaking={speakingIds?.has(player.userId) ?? false}
              onSelect={handleCardClick}
            />
          ))}
        </div>
      </div>

      {/* ─── BOTTOM ACTION BAR ─────────────────────────────────────────────── */}
      <div
        style={{
          position: 'sticky',
          bottom: '16px',
          backgroundColor: 'rgba(9, 13, 22, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '14px 20px',
          borderRadius: '12px',
          border: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8)',
          zIndex: 50,
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {AZ_UI.nightOrder} & Əməliyyat Paneli
          </span>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
            {selectedPlayerId
              ? `Seçilmiş Hədəf: ${lobbyState.players[selectedPlayerId]?.displayRole.formatted ?? selectedPlayerId}`
              : 'Əmr icra etmək üçün yuxarıdakı kartlardan hədəf seçin'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="primary"
            size="md"
            disabled={!isAlive || !selectedPlayerId || selectedPlayerId === currentUserId}
            onClick={() => {
              if (selectedPlayerId && onTriggerAction) {
                onTriggerAction(primaryActionType, selectedPlayerId);
              }
            }}
          >
            ⚡ {primaryActionLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
