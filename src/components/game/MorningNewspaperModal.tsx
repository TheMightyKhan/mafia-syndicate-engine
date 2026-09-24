'use client';

import React from 'react';
import { Newspaper, X, Skull, AlertTriangle, Flame, Clock } from 'lucide-react';
import { MorningNewspaper } from '../../types/engine';
import { MinigameSubStates } from '../../types/minigames';
import { AZ_DEATH_CAUSES, AZ_UI, AZ_DANTE_CIRCLES } from '../../config/i18n/az';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface MorningNewspaperModalProps {
  readonly isOpen: boolean;
  readonly newspaper: MorningNewspaper | null;
  readonly roundNumber: number;
  readonly minigameSubStates?: MinigameSubStates;
  readonly lastLynchedPlayerName?: string | null;
  readonly onClose: () => void;
}

export const MorningNewspaperModal: React.FC<MorningNewspaperModalProps> = ({
  isOpen,
  newspaper,
  roundNumber,
  minigameSubStates,
  lastLynchedPlayerName,
  onClose,
}) => {
  if (!isOpen || !newspaper) return null;

  const dante = minigameSubStates?.dantesInferno;
  const earth = minigameSubStates?.earthStoodStill;
  const valkyrie = minigameSubStates?.valkyrie;
  const prison = minigameSubStates?.stanfordPrison;
  const catenaccio = minigameSubStates?.catenaccio;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-amber-50/95 dark:bg-stone-900/95 text-stone-900 dark:text-stone-100 p-6 sm:p-8 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto font-serif"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Newspaper Masthead */}
        <div className="border-b-4 border-double border-stone-400 dark:border-stone-700 pb-4 text-center">
          <div className="text-[11px] tracking-widest uppercase text-stone-600 dark:text-stone-400 font-sans font-bold">
            TDV MAFIA • Səhər Xüsusi Buraxılışı
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-wider my-1 text-stone-950 dark:text-stone-50 font-serif">
            {AZ_UI.morningBulletin}
          </h1>
          <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400 border-t border-stone-300 dark:border-stone-800 pt-2 font-sans">
            <span>Raund #{roundNumber}</span>
            <span>Gecə Əməliyyatlarının Nəticələri</span>
            <span>Jitter: {(newspaper.jitterAppliedMs / 1000).toFixed(1)}s</span>
          </div>
        </div>

        {/* Yesterday's Lynch Headline */}
        {lastLynchedPlayerName && (
          <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 font-sans">
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-1">
              Məhkəmə İttihamı Nəticəsi
            </div>
            <div className="text-sm text-stone-800 dark:text-stone-200">
              Vətəndaşların səs çoxluğu ilə ittiham olunan{' '}
              <strong className="text-rose-600 dark:text-rose-400">{lastLynchedPlayerName}</strong>{' '}
              edam edildi.
            </div>
          </div>
        )}

        {/* Night Casualties Section */}
        <div className="font-sans">
          <div className="flex items-center gap-2 border-b border-stone-300 dark:border-stone-800 pb-2 mb-3">
            <Skull className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-extrabold uppercase tracking-wide text-stone-900 dark:text-stone-100">
              {AZ_UI.newspaperHeadlineDeaths} ({newspaper.publicDeaths.length})
            </h2>
          </div>

          {newspaper.publicDeaths.length === 0 ? (
            <p className="text-sm italic text-stone-600 dark:text-stone-400 py-2">
              {AZ_UI.newspaperNoDeaths} Şəhər bu gecə sakit qaldı.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {newspaper.publicDeaths.map((death) => (
                <div
                  key={death.victimPlayerId}
                  className="p-3.5 rounded-xl border-l-4 border-l-rose-600 border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-950/50 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      Qurban: {death.victimPlayerId}
                    </span>
                    <Badge tone="red">{AZ_DEATH_CAUSES[death.cause] ?? death.cause}</Badge>
                  </div>

                  {death.isCleaned ? (
                    <div className="text-xs text-rose-600 dark:text-rose-400 italic bg-rose-500/10 p-1.5 rounded">
                      {AZ_UI.cleanedBodyDescription}
                    </div>
                  ) : (
                    <div className="text-xs text-stone-600 dark:text-stone-400">
                      Ölüm Səbəbi: {AZ_DEATH_CAUSES[death.cause] ?? death.cause}
                      {death.killerFaction && ` (${death.killerFaction})`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Heresy Clue Leaked */}
        {newspaper.heresyClue && (
          <div className="p-4 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 font-sans">
            <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 mb-1">
              {AZ_UI.heresyLeakedHeader}
            </div>
            <p className="text-sm italic text-purple-900 dark:text-purple-200">
              {newspaper.heresyClue}
            </p>
          </div>
        )}

        {/* Minigame Event Announcements */}
        {dante && (
          <div className="p-3.5 rounded-xl border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/20 font-sans">
            <div className="text-xs font-bold text-red-700 dark:text-red-400">
              Dante Cəhənnəmi: {AZ_DANTE_CIRCLES[dante.currentCircle]?.name ?? dante.currentCircle}
            </div>
            <div className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
              {AZ_DANTE_CIRCLES[dante.currentCircle]?.rule}
            </div>
          </div>
        )}

        {/* Footer Dismiss Button */}
        <div className="pt-2 font-sans">
          <Button variant="secondary" size="md" onClick={onClose} fullWidth>
            Oxundu & Məhkəməyə Qayıt
          </Button>
        </div>
      </div>
    </div>
  );
};
