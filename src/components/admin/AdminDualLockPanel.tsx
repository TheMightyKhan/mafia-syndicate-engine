'use client';

import React, { CSSProperties, useState } from 'react';
import { AdminRole } from '../../types/access';
import { AdminMasterUnlockState, PlayerSession } from '../../types/game';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { AZ_UI } from '../../config/i18n/az';

export interface AdminDualLockPanelProps {
  readonly unlockState: AdminMasterUnlockState;
  readonly currentUserRole: AdminRole;
  readonly currentUserId: string;
  readonly isHost?: boolean;
  readonly hostReady?: boolean;
  readonly assignedArchitectId: string | null;
  readonly assignedBailiffId: string | null;
  readonly eligibleWaiverPlayers?: readonly PlayerSession[];
  readonly onUnlockSubmit: (role: 'THE_ARCHITECT' | 'THE_BAILIFF') => void;
  readonly onHostReadyToggle?: (ready: boolean) => void;
  readonly onGrantWaiver?: (targetUserId: string, reason: string) => void;
}

export const AdminDualLockPanel: React.FC<AdminDualLockPanelProps> = ({
  unlockState,
  currentUserRole,
  currentUserId,
  isHost = false,
  hostReady = false,
  assignedArchitectId,
  assignedBailiffId,
  eligibleWaiverPlayers = [],
  onUnlockSubmit,
  onHostReadyToggle,
  onGrantWaiver,
}) => {
  const [selectedWaiverTarget, setSelectedWaiverTarget] = useState<string>('');
  const [waiverReason, setWaiverReason] = useState<string>('Tier 1 İcazəli Güzəşt');

  const isArchitect = currentUserRole === 'THE_ARCHITECT';
  const isBailiff = currentUserRole === 'THE_BAILIFF';
  const canArchitectUnlock = isArchitect && !unlockState.architectUnlocked;
  const canBailiffUnlock = isBailiff && !unlockState.bailiffUnlocked;

  const containerStyle: CSSProperties = {
    padding: '18px',
    backgroundColor: '#090d16',
    border: '1px solid #1e293b',
    borderRadius: '12px',
    marginBottom: '16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
  };

  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '14px',
    marginTop: '14px',
  };

  const cardStyle: CSSProperties = {
    padding: '14px',
    backgroundColor: '#0f172a',
    borderRadius: '8px',
    border: '1px solid #334155',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '10px',
  };

  return (
    <div style={containerStyle}>
      {/* Header & Lock State */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '16px', fontWeight: 800 }}>
              🔐 Cüt Açarlı Platforma Admin İcazəsi (All-In 40–50)
            </h3>
            {isHost && (
              <Badge tone={hostReady ? 'emerald' : 'amber'}>
                Host: {hostReady ? 'HAZIRDIR' : 'GÖZLƏNİLİR'}
              </Badge>
            )}
          </div>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
            All-In metropolitan rejimini başlatmaq üçün həm Memar, həm də Məhkəmə İcraçısının müstəqil açarları tələb olunur.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isHost && onHostReadyToggle && (
            <Button
              size="sm"
              variant={hostReady ? 'outline' : 'primary'}
              onClick={() => onHostReadyToggle(!hostReady)}
            >
              {hostReady ? 'Hazırlığı Geri Götür' : 'Host Hazırdır'}
            </Button>
          )}

          <Badge tone={unlockState.dualLockVerified ? 'emerald' : 'red'}>
            {unlockState.dualLockVerified ? AZ_UI.dualLockVerified : AZ_UI.dualLockRequired}
          </Badge>
        </div>
      </div>

      {/* Dual Key Panels */}
      <div style={gridStyle}>
        {/* Key 1: The Architect */}
        <div style={cardStyle}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '14px' }}>
                🔑 Açar 1: {AZ_UI.architect}
              </span>
              <Badge tone={unlockState.architectUnlocked ? 'emerald' : 'amber'}>
                {unlockState.architectUnlocked ? AZ_UI.turned : AZ_UI.awaitingTurn}
              </Badge>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Təyin edilib: <strong>{assignedArchitectId ?? 'Otaqda yoxdur'}</strong>
            </div>
          </div>

          <Button
            size="sm"
            variant="warning"
            disabled={!canArchitectUnlock}
            onClick={() => onUnlockSubmit('THE_ARCHITECT')}
            fullWidth
          >
            {unlockState.architectUnlocked ? 'Memar Təsdiqləndi' : AZ_UI.authorizeAsArchitect}
          </Button>
        </div>

        {/* Key 2: The Bailiff */}
        <div style={cardStyle}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '14px' }}>
                🔑 Açar 2: {AZ_UI.bailiff}
              </span>
              <Badge tone={unlockState.bailiffUnlocked ? 'emerald' : 'amber'}>
                {unlockState.bailiffUnlocked ? AZ_UI.turned : AZ_UI.awaitingTurn}
              </Badge>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Təyin edilib: <strong>{assignedBailiffId ?? 'Otaqda yoxdur'}</strong>
            </div>
          </div>

          <Button
            size="sm"
            variant="danger"
            disabled={!canBailiffUnlock}
            onClick={() => onUnlockSubmit('THE_BAILIFF')}
            fullWidth
          >
            {unlockState.bailiffUnlocked ? 'İcraçı Təsdiqləndi' : AZ_UI.authorizeAsBailiff}
          </Button>
        </div>
      </div>

      {/* Host Waiver Manager for 20-39 Lobbies */}
      {onGrantWaiver && eligibleWaiverPlayers.length > 0 && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px 14px',
            backgroundColor: '#030712',
            borderRadius: '8px',
            border: '1px solid #1e293b',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#93c5fd', marginBottom: '8px' }}>
            🎟️ Host / Admin Güzəşt Meneceri (20–39 Nəfərlik Otaqlar)
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={selectedWaiverTarget}
              onChange={(e) => setSelectedWaiverTarget(e.target.value)}
              style={{
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #334155',
                fontSize: '13px',
              }}
            >
              <option value="">Oyunçu Seçin...</option>
              {eligibleWaiverPlayers.map((p) => (
                <option key={p.userId} value={p.userId}>
                  {p.username} ({p.tier})
                </option>
              ))}
            </select>

            <input
              type="text"
              value={waiverReason}
              onChange={(e) => setWaiverReason(e.target.value)}
              placeholder="Güzəşt səbəbi..."
              style={{
                backgroundColor: '#0f172a',
                color: '#f8fafc',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #334155',
                fontSize: '13px',
                flex: 1,
                minWidth: '180px',
              }}
            />

            <Button
              size="sm"
              variant="primary"
              disabled={!selectedWaiverTarget}
              onClick={() => {
                if (selectedWaiverTarget) {
                  onGrantWaiver(selectedWaiverTarget, waiverReason);
                  setSelectedWaiverTarget('');
                }
              }}
            >
              Güzəşt Təsdiq Et
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
