'use client';

import React, { useState } from 'react';
import { Settings, Play, Pause, Search, Sliders, Shield, Terminal } from 'lucide-react';
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

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-amber-500/30 bg-white dark:bg-zinc-900 shadow-sm flex flex-col gap-4 transition-colors duration-200">
      {/* Console Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-5 h-5 text-amber-500" />
            <h3 className="font-extrabold text-base text-zinc-950 dark:text-white">
              Memar Konsolu (The Architect Console)
            </h3>
            <Badge tone="amber">Platform Admin</Badge>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Mərhələlərin səlahiyyətli dəyişdirilməsi, taymer idarəsi və sistem snapshot tənzimləmələri.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onToggleTimerPause && (
            <Button
              variant={isTimerPaused ? 'primary' : 'warning'}
              size="sm"
              onClick={onToggleTimerPause}
              icon={isTimerPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            >
              {isTimerPaused ? 'Davam Etdir' : 'Pauza'}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSnapshot(!showSnapshot)}
            icon={<Terminal className="w-3.5 h-3.5" />}
          >
            {showSnapshot ? 'Gizlət' : 'Snapshot'}
          </Button>
        </div>
      </div>

      {/* Phase Override Controls */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col gap-3">
        <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
          Mərhələni Müstəqil Dəyişdir (Phase Override)
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value as GamePhase)}
            className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            {PHASES_LIST.map((p) => (
              <option key={p} value={p}>
                {AZ_PHASES[p]} ({p})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Müddət:</span>
            <input
              type="number"
              value={durationSec}
              onChange={(e) => setDurationSec(Number(e.target.value))}
              className="w-20 px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-amber-500"
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">san</span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => onOverridePhase(selectedPhase, durationSec)}
          >
            Dərhal Tətbiq Et
          </Button>
        </div>
      </div>

      {/* Jitter Delay Configuration */}
      {onConfigureJitter && (
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col gap-2">
          <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
            Gecə Anti-Deduksiya Jitter Tənzimləməsi (3–7 saniyə)
          </div>
          <div className="flex items-center gap-3 flex-wrap">
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
              className="w-44 accent-amber-500 cursor-pointer"
            />
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
              {jitterSec} saniyə
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
              (AI botları ilə insan oyunçuların reaksiya vaxtını maskalayır)
            </span>
          </div>
        </div>
      )}

      {/* State Snapshot Inspector */}
      {showSnapshot && (
        <div className="p-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-950 font-mono text-xs max-h-60 overflow-y-auto">
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 font-bold">
            Canlı Otaq Vəziyyəti JSON
          </div>
          <pre className="text-blue-600 dark:text-blue-400 text-xs">
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
