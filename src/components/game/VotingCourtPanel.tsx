'use client';

import React, { CSSProperties } from 'react';
import { LobbyState, PlayerSession } from '../../types/game';
import { AllInDistrict } from '../../types/roles';
import { AZ_DISTRICTS, AZ_UI } from '../../config/i18n/az';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface VotingCourtPanelProps {
  readonly lobbyState: LobbyState;
  readonly currentUserId: string;
  readonly selectedCandidateId: string | null;
  readonly districtFinalists?: readonly string[];
  readonly onCastVote: (candidateId: string) => void;
  readonly onRetractVote: () => void;
  readonly onSkipVote?: () => void;
}

export const VotingCourtPanel: React.FC<VotingCourtPanelProps> = ({
  lobbyState,
  currentUserId,
  selectedCandidateId,
  districtFinalists = [],
  onCastVote,
  onRetractVote,
  onSkipVote,
}) => {
  const dante = lobbyState.minigameSubStates.dantesInferno;
  const isWrath = dante?.wrathNoAbstainEnforced === true;
  const isTreacheryBlind = dante?.treacherySecretVotingActive === true;
  const isAllIn = lobbyState.mode === 'ALL_IN';

  const currentUser = lobbyState.players[currentUserId];
  const isAlive = currentUser?.isAlive ?? false;
  const currentVotedCandidateId = lobbyState.liveVotes[currentUserId];

  // Calculate vote tallies per candidate
  const tallies: Record<string, number> = {};
  for (const candidateId of Object.values(lobbyState.liveVotes)) {
    tallies[candidateId] = (tallies[candidateId] ?? 0) + 1;
  }

  // Quorum threshold: strict majority of alive players
  const alivePlayers = Object.values(lobbyState.players).filter((p) => p.isAlive);
  const majorityThreshold = Math.floor(alivePlayers.length / 2) + 1;

  const panelStyle: CSSProperties = {
    backgroundColor: '#090d16',
    border: '1px solid #1e293b',
    borderRadius: '10px',
    padding: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
  };

  return (
    <div style={panelStyle}>
      {/* Court Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isAllIn ? AZ_UI.districtPlebiscite : AZ_UI.currentPhase}
          </span>
          <h2 style={{ margin: '2px 0 0 0', color: '#f8fafc', fontSize: '18px', fontWeight: 800 }}>
            {AZ_UI.accuse} & {AZ_UI.vote} Ziyili
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Badge tone="neutral">
            Tələb Olunan Çoxluq: {majorityThreshold} / {alivePlayers.length} səs
          </Badge>

          {isWrath && (
            <Badge tone="red">
              {AZ_UI.mandatoryVoting} (V Dairə)
            </Badge>
          )}

          {isTreacheryBlind && (
            <Badge tone="purple">
              {AZ_UI.blindVoting} (IX Dairə)
            </Badge>
          )}
        </div>
      </div>

      {/* Dante Special Mode Notices */}
      {isWrath && (
        <div
          style={{
            backgroundColor: 'rgba(220, 38, 38, 0.12)',
            border: '1px solid #ef4444',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#fca5a5',
          }}
        >
          <strong>Dantenin V Dairəsi (Qəzəb):</strong> Bitərəf qalmaq və ya səsverməni keçmək qadağandır! Hər bir canlı vətəndaş
          hökm verməlidir.
        </div>
      )}

      {isTreacheryBlind && (
        <div
          style={{
            backgroundColor: 'rgba(168, 85, 247, 0.12)',
            border: '1px solid #a855f7',
            padding: '10px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            color: '#d8b4fe',
          }}
        >
          <strong>Dantenin IX Dairəsi (Xəyanət / Kokit):</strong> {AZ_UI.blindVotingDesc} Heç kim kimin kimə səs verdiyini
          mərhələ kilidlənənə qədər görə bilməz.
        </div>
      )}

      {/* All-In District Caucus Finalist Visualizer */}
      {isAllIn && districtFinalists.length > 0 && (
        <div
          style={{
            backgroundColor: '#111827',
            border: '1px solid #3b82f6',
            padding: '12px',
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
            {AZ_UI.districtFinalists} (3 Kvartal Finalisti)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
            {districtFinalists.map((finalistId, index) => {
              const p = lobbyState.players[finalistId];
              const distName = p?.currentDistrict ? AZ_DISTRICTS[p.currentDistrict] : `Rayon #${index + 1}`;
              return (
                <div
                  key={finalistId}
                  style={{
                    backgroundColor: '#1e293b',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    borderLeft: '3px solid #38bdf8',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{distName}</div>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '14px' }}>
                    {p?.displayRole.formatted ?? finalistId}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Selection & Action Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#0f172a',
          padding: '12px 16px',
          borderRadius: '8px',
          border: '1px solid #334155',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Seçilmiş İttiham Hədəfi:</span>
          <div style={{ fontSize: '15px', fontWeight: 700, color: selectedCandidateId ? '#f8fafc' : '#64748b' }}>
            {selectedCandidateId
              ? lobbyState.players[selectedCandidateId]?.displayRole.formatted ?? selectedCandidateId
              : 'Heç bir oyunçu seçilməyib'}
          </div>
          {currentVotedCandidateId && (
            <div style={{ fontSize: '12px', color: '#fbbf24', marginTop: '2px' }}>
              Sizin cari səsiniz:{' '}
              <strong>{lobbyState.players[currentVotedCandidateId]?.displayRole.nickname ?? currentVotedCandidateId}</strong>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {currentVotedCandidateId && (
            <Button variant="secondary" size="md" onClick={onRetractVote} disabled={!isAlive}>
              {AZ_UI.retractVote}
            </Button>
          )}

          {!isWrath && onSkipVote && (
            <Button variant="outline" size="md" onClick={onSkipVote} disabled={!isAlive}>
              {AZ_UI.skipOrAbstain}
            </Button>
          )}

          <Button
            variant="danger"
            size="md"
            disabled={!isAlive || !selectedCandidateId || currentVotedCandidateId === selectedCandidateId}
            onClick={() => selectedCandidateId && onCastVote(selectedCandidateId)}
          >
            {AZ_UI.vote}
          </Button>
        </div>
      </div>
    </div>
  );
};
