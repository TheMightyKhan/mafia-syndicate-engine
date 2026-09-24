'use client';

import React, { CSSProperties } from 'react';
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

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '20px',
  };

  const paperStyle: CSSProperties = {
    backgroundColor: '#0c0a09',
    color: '#e7e5e4',
    border: '2px solid #78716c',
    borderRadius: '4px',
    maxWidth: '680px',
    width: '100%',
    maxHeight: '88vh',
    overflowY: 'auto',
    padding: '28px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), inset 0 0 60px rgba(120, 113, 108, 0.08)',
    fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
  };

  const headerBorder: CSSProperties = {
    borderBottom: '4px double #78716c',
    paddingBottom: '12px',
    marginBottom: '20px',
    textAlign: 'center',
  };

  const dante = minigameSubStates?.dantesInferno;
  const earth = minigameSubStates?.earthStoodStill;
  const valkyrie = minigameSubStates?.valkyrie;
  const prison = minigameSubStates?.stanfordPrison;
  const catenaccio = minigameSubStates?.catenaccio;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={paperStyle} onClick={(e) => e.stopPropagation()}>
        {/* Newspaper Masthead */}
        <div style={headerBorder}>
          <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a8a29e' }}>
            Klub Hökumət & Məhkəmə Xəbərləri
          </div>
          <h1
            style={{
              margin: '6px 0',
              fontSize: '32px',
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#fafaf9',
              textShadow: '0 2px 4px rgba(0,0,0,0.6)',
            }}
          >
            {AZ_UI.morningBulletin}
          </h1>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#d6d3d1',
              borderTop: '1px solid #44403c',
              paddingTop: '6px',
            }}
          >
            <span>Raund: {roundNumber}</span>
            <span>Tarix: Gecə Əməliyyatlarının Şəfəqi</span>
            <span>Jitter: {(newspaper.jitterAppliedMs / 1000).toFixed(1)}s</span>
          </div>
        </div>

        {/* Yesterday's Lynch Headline */}
        {lastLynchedPlayerName && (
          <div
            style={{
              backgroundColor: '#1c1917',
              border: '1px solid #57534e',
              padding: '12px',
              marginBottom: '16px',
              borderRadius: '4px',
            }}
          >
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#f87171', fontWeight: 700 }}>
              Məhkəmə İttihamı Nəticəsi
            </div>
            <div style={{ fontSize: '15px', color: '#f5f5f4', marginTop: '4px' }}>
              Vətəndaşlar tərəfindən ittiham olunan <strong>{lastLynchedPlayerName}</strong> xalqın qərarı ilə edam
              edildi.
            </div>
          </div>
        )}

        {/* Night Casualties Section */}
        <div style={{ marginBottom: '20px' }}>
          <h2
            style={{
              fontSize: '18px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              borderBottom: '1px solid #57534e',
              paddingBottom: '4px',
              color: '#f87171',
              margin: '0 0 12px 0',
            }}
          >
            {AZ_UI.newspaperHeadlineDeaths} ({newspaper.publicDeaths.length})
          </h2>

          {newspaper.publicDeaths.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: '#a8a29e', margin: '8px 0' }}>
              {AZ_UI.newspaperNoDeaths}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {newspaper.publicDeaths.map((death) => (
                <div
                  key={death.victimPlayerId}
                  style={{
                    backgroundColor: '#181412',
                    borderLeft: '4px solid #b91c1c',
                    padding: '10px 14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: '#fecaca' }}>
                      Qurban: {death.victimPlayerId}
                    </span>
                    <Badge tone="red">{AZ_DEATH_CAUSES[death.cause] ?? death.cause}</Badge>
                  </div>

                  {death.isCleaned ? (
                    <div
                      style={{
                        marginTop: '6px',
                        fontSize: '12px',
                        color: '#fca5a5',
                        fontStyle: 'italic',
                        backgroundColor: '#450a0a',
                        padding: '4px 8px',
                        borderRadius: '2px',
                      }}
                    >
                      {AZ_UI.cleanedBodyDescription}
                    </div>
                  ) : (
                    <div style={{ marginTop: '4px', fontSize: '12px', color: '#d6d3d1' }}>
                      Ölüm Səbəbi: {AZ_DEATH_CAUSES[death.cause] ?? death.cause}
                      {death.killerFaction && ` (${death.killerFaction})`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Heresy Clue Leaked (Dante Circle 6) */}
        {newspaper.heresyClue && (
          <div
            style={{
              backgroundColor: '#2e1065',
              border: '1px solid #7c3aed',
              padding: '12px',
              marginBottom: '16px',
              borderRadius: '4px',
            }}
          >
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#c4b5fd', fontWeight: 800 }}>
              {AZ_UI.heresyLeakedHeader}
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#ede9fe', fontStyle: 'italic' }}>
              {newspaper.heresyClue}
            </p>
          </div>
        )}

        {/* Minigame Event Announcements */}
        {dante && (
          <div
            style={{
              backgroundColor: '#450a0a',
              border: '1px solid #991b1b',
              padding: '10px 12px',
              marginBottom: '12px',
              borderRadius: '4px',
            }}
          >
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#fca5a5', fontWeight: 700 }}>
              Dante Cəhənnəminə Eniş: {AZ_DANTE_CIRCLES[dante.currentCircle]?.name ?? dante.currentCircle}
            </div>
            <div style={{ fontSize: '12px', color: '#fee2e2', marginTop: '3px' }}>
              {AZ_DANTE_CIRCLES[dante.currentCircle]?.rule}
            </div>
          </div>
        )}

        {earth && (
          <div
            style={{
              backgroundColor: '#172554',
              border: '1px solid #2563eb',
              padding: '10px 12px',
              marginBottom: '12px',
              borderRadius: '4px',
            }}
          >
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#93c5fd', fontWeight: 700 }}>
              {AZ_UI.doomsdayClock}: {earth.doomsdayClockHours} / 12 Saat
            </div>
            {earth.worldFrozenActive && (
              <div style={{ fontSize: '12px', color: '#60a5fa', marginTop: '2px' }}>
                {AZ_UI.worldFrozenActive}
              </div>
            )}
            {earth.planetaryWipeTriggered && (
              <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: 700, marginTop: '2px' }}>
                {AZ_UI.planetaryWipeWarning}
              </div>
            )}
          </div>
        )}

        {valkyrie && valkyrie.briefcaseLocationPlayerId && (
          <div
            style={{
              backgroundColor: '#451a03',
              border: '1px solid #d97706',
              padding: '10px 12px',
              marginBottom: '12px',
              borderRadius: '4px',
            }}
          >
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#fde68a', fontWeight: 700 }}>
              {AZ_UI.briefcaseLocation}: {valkyrie.briefcaseLocationPlayerId} | {AZ_UI.fuseCountdown}:{' '}
              {valkyrie.fuseTimerDaysRemaining} Gün
            </div>
          </div>
        )}

        {prison && (
          <div
            style={{
              backgroundColor: '#262626',
              border: '1px solid #737373',
              padding: '10px 12px',
              marginBottom: '12px',
              borderRadius: '4px',
            }}
          >
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#d4d4d4', fontWeight: 700 }}>
              {AZ_UI.revoltMeter}: {prison.revoltMeter}% {prison.riotTriggered && '— QİYAM BAŞLADI!'}
            </div>
          </div>
        )}

        {catenaccio && catenaccio.wallBreached && (
          <div
            style={{
              backgroundColor: '#7f1d1d',
              border: '1px solid #ef4444',
              padding: '10px 12px',
              marginBottom: '12px',
              borderRadius: '4px',
            }}
          >
            <div style={{ fontSize: '12px', color: '#fef2f2', fontWeight: 800 }}>
              {AZ_UI.wallBreachedAlert}
            </div>
          </div>
        )}

        {/* Footer Dismiss Button */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Button variant="outline" size="md" onClick={onClose} fullWidth style={{ borderColor: '#78716c' }}>
            Oxundu & Məhkəmə Ziyilinə Qayıt
          </Button>
        </div>
      </div>
    </div>
  );
};
