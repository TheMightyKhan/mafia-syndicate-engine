'use client';

import React, { useState } from 'react';
import { Gavel, Mic, MicOff, UserCheck, ShieldAlert, SkipForward } from 'lucide-react';
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

  const queue = lobbyState.speakerQueue;
  const currentSpeakerId = queue[0];
  const allPlayers = Object.values(lobbyState.players);

  return (
    <div className="p-5 sm:p-6 rounded-2xl border border-rose-500/30 bg-white dark:bg-zinc-900 shadow-sm flex flex-col gap-4 transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gavel className="w-5 h-5 text-rose-500" />
            <h3 className="font-extrabold text-base text-zinc-950 dark:text-white">
              Məhkəmə İcraçısı Konsolu (The Bailiff Console)
            </h3>
            <Badge tone="red">Məhkəmə Nizam-İntizamı</Badge>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Canlı çıxış növbəsi, yavaş rejim və intizam cəzaları (səssizləşdirmə).
          </p>
        </div>

        {onToggleSlowMode && (
          <Button
            variant={isSlowModeActive ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onToggleSlowMode(!isSlowModeActive)}
          >
            {isSlowModeActive ? 'Yavaş Rejim Aktivdir' : 'Yavaş Rejimi Aktivləşdir'}
          </Button>
        )}
      </div>

      {/* Speaker Queue Management */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-rose-500" />
            <span>Canlı Çıxış Növbəsi ({queue.length} Nəfər)</span>
          </span>
          {onNextSpeaker && queue.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={onNextSpeaker}
              iconRight={<SkipForward className="w-3.5 h-3.5" />}
            >
              Növbəti Çıxışçı
            </Button>
          )}
        </div>

        {currentSpeakerId ? (
          <div className="p-3 rounded-lg border-l-4 border-l-rose-500 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Hazırda Söz Alan:
            </div>
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {lobbyState.players[currentSpeakerId]?.username ?? currentSpeakerId}
            </div>
          </div>
        ) : (
          <div className="text-xs text-zinc-500 italic py-1">
            Növbədə heç kim yoxdur.
          </div>
        )}

        {/* Add Speaker Form */}
        {onAddSpeaker && (
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <select
              value={selectedAddSpeaker}
              onChange={(e) => setSelectedAddSpeaker(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-rose-500 cursor-pointer"
            >
              <option value="">Növbəyə Əlavə Et...</option>
              {allPlayers
                .filter((p) => p.isAlive && !queue.includes(p.userId))
                .map((p) => (
                  <option key={p.userId} value={p.userId}>
                    {p.username}
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
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col gap-2.5">
          <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
            <MicOff className="w-3.5 h-3.5 text-rose-500" />
            <span>İntizam Cəzası: Müvəqqəti Səssizləşdirmə (Mute)</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <select
              value={selectedMuteTarget}
              onChange={(e) => setSelectedMuteTarget(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-rose-500 cursor-pointer"
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
              className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-rose-500 cursor-pointer"
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
