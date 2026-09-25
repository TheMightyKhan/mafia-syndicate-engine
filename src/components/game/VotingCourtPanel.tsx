'use client';

import React from 'react';
import { Gavel, AlertCircle, EyeOff, Users, ArrowRight } from 'lucide-react';
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

  const alivePlayers = Object.values(lobbyState.players).filter((p) => p.isAlive);
  const majorityThreshold = Math.floor(alivePlayers.length / 2) + 1;

  return (
    <div className="p-5 sm:p-6 rounded-[20px] p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col gap-4 transition-colors duration-200">
      {/* Court Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[8px] bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center shrink-0">
            <Gavel className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">
              {isAllIn ? AZ_UI.districtPlebiscite : AZ_UI.currentPhase}
            </span>
            <h3 className="font-extrabold text-lg text-zinc-950 dark:text-white leading-tight">
              {AZ_UI.accuse} & {AZ_UI.vote} Məclisi
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge tone="neutral">
            Tələb: {majorityThreshold} / {alivePlayers.length} səs
          </Badge>

          {isWrath && (
            <Badge tone="red">
              {AZ_UI.mandatoryVoting} (V Dairə)
            </Badge>
          )}

          {isTreacheryBlind && (
            <Badge tone="purple" icon={<EyeOff className="w-3 h-3" />}>
              {AZ_UI.blindVoting} (IX Dairə)
            </Badge>
          )}
        </div>
      </div>

      {/* Dante Special Mode Notices */}
      {isWrath && (
        <div className="p-3.5 rounded-[8px] border border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>
            <strong>Dantenin V Dairəsi (Qəzəb):</strong> Bitərəf qalmaq qadağandır! Hər bir canlı vətəndaş hökm verməlidir.
          </span>
        </div>
      )}

      {isTreacheryBlind && (
        <div className="p-3.5 rounded-[8px] border border-purple-500/30 bg-purple-500/10 text-purple-800 dark:text-purple-300 text-xs flex items-center gap-2">
          <EyeOff className="w-4 h-4 shrink-0 text-purple-600" />
          <span>
            <strong>Dantenin IX Dairəsi (Xəyanət / Kokit):</strong> {AZ_UI.blindVotingDesc}
          </span>
        </div>
      )}

      {/* All-In District Finalists */}
      {isAllIn && districtFinalists.length > 0 && (
        <div className="p-4 rounded-[8px] border border-blue-500/30 bg-blue-500/5 dark:bg-blue-950/20">
          <div className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-2">
            {AZ_UI.districtFinalists} (3 Kvartal Finalisti)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {districtFinalists.map((finalistId, index) => {
              const p = lobbyState.players[finalistId];
              const distName = p?.currentDistrict
                ? AZ_DISTRICTS[p.currentDistrict]
                : `Rayon #${index + 1}`;
              return (
                <div
                  key={finalistId}
                  className="p-3 rounded-lg border border-blue-500/20 bg-white dark:bg-zinc-900 border-l-4 border-l-blue-500"
                >
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{distName}</div>
                  <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {p?.username ?? finalistId}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Selection & Action Controls */}
      <div className="p-4 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Seçilmiş İttiham Hədəfi:
          </span>
          <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
            {selectedCandidateId
              ? lobbyState.players[selectedCandidateId]?.username ?? selectedCandidateId
              : 'Heç bir oyunçu seçilməyib (kartlardan birinə toxunun)'}
          </div>
          {currentVotedCandidateId && (
            <div className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
              Sizin cari səsiniz:{' '}
              {lobbyState.players[currentVotedCandidateId]?.username ??
                currentVotedCandidateId}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
            disabled={
              !isAlive || !selectedCandidateId || currentVotedCandidateId === selectedCandidateId
            }
            onClick={() => selectedCandidateId && onCastVote(selectedCandidateId)}
          >
            {AZ_UI.vote}
          </Button>
        </div>
      </div>
    </div>
  );
};
