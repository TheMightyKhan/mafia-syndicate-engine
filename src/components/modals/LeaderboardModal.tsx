'use client';

import React, { useState, useEffect, CSSProperties } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { UserSessionState } from './AuthModal';

export interface LeaderboardModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const [currentUser, setCurrentUser] = useState<UserSessionState | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tdv_mafia_user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {
      // Storage unavailable
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    padding: '20px',
  };

  const modalStyle: CSSProperties = {
    backgroundColor: '#090d16',
    border: '1px solid rgba(245, 158, 11, 0.35)',
    borderRadius: '18px',
    padding: '26px 28px',
    maxWidth: '740px',
    width: '100%',
    maxHeight: '88vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(245, 158, 11, 0.2), 0 0 50px rgba(0, 0, 0, 0.9)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>🏆</span>
              <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '22px', fontWeight: 900 }}>
                TDV MAFIA - Klub Məktəb Liqası
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
              Mövsüm #1: Bakı Deduksiya və İntellektual Reytinq Sistemi
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: '#94a3b8',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '6px 12px',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Current User Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(180, 83, 9, 0.15) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '14px',
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 900,
                boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)',
              }}
            >
              {currentUser?.username ? currentUser.username.charAt(0).toUpperCase() : '👤'}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
                  {currentUser?.username || 'Qonaq Oyunçu'}
                </span>
                <Badge tone={currentUser?.tier === 'TIER_3' ? 'purple' : currentUser?.tier === 'TIER_2' ? 'amber' : 'neutral'}>
                  {currentUser?.tier || 'TIER_1'}
                </Badge>
              </div>
              <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 600 }}>
                {currentUser?.roleTitle || 'Sıravi İştirakçı (Giriş edilməyib)'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Mövsüm Xalı (ELO)</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#34d399' }}>
                {currentUser ? '1500 ELO' : '—'}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Status</div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#38bdf8' }}>
                {currentUser ? 'Aktiv İştirakçı' : 'Qonaq'}
              </div>
            </div>
          </div>
        </div>

        {/* Season Status Notice */}
        <div
          style={{
            backgroundColor: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 800, fontSize: '14px' }}>
            <i className="fa-solid fa-circle-info" />
            <span>Klub Turnir və Reytinq Qaydası</span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>
            TDV Mafia platformasında saxta və ya uydurma reytinq xalları istifadə edilmir! Reytinq cədvəli yalnız <strong>klub masalarda başa çatan canlı oyunlar</strong> və <strong>şagirdlərin şəxsi hesabları</strong> əsasında avtomatik formalaşır. Masalara qoşularaq və dostlarınızla intellektual duellərdə qələbə qazanaraq şəhərin ən güclü deduksiya ustaları sırasına yüksələ bilərsiniz.
          </p>
        </div>

        {/* Tier Hierarchy Guide */}
        <div>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>
            Liqa Dərəcələri və Tələblər (Tier Structure)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 800, color: '#94a3b8', fontSize: '13px' }}>Tier 1: Əsgər</span>
                <Badge tone="neutral">0 - 1499 ELO</Badge>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                Başlanğıc dərəcə. Standart 12 nəfərlik masalarda iştirak hüququ.
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '10px',
                padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 800, color: '#fbbf24', fontSize: '13px' }}>Tier 2: Kapo</span>
                <Badge tone="amber">1500 - 2199 ELO</Badge>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#cbd5e1' }}>
                Təcrübəli oyunçu. Dante 9 və 20 nəfərlik xüsusi masalarda masa açmaq icazəsi.
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                borderRadius: '10px',
                padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 800, color: '#c084fc', fontSize: '13px' }}>Tier 3: Don</span>
                <Badge tone="purple">2200+ ELO</Badge>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#e9d5ff' }}>
                Elit Usta. 40-50 nəfərlik All-In kütləvi məktəb turnir masalarında rəhbərlik hüququ.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', borderTop: '1px solid #1e293b', paddingTop: '14px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Klub Nəticələr • Kriptoqrafik Qoruma • Anti-Cheat
          </span>
          <Button variant="outline" size="sm" onClick={onClose} style={{ borderColor: '#334155' }}>
            Bağla
          </Button>
        </div>
      </div>
    </div>
  );
};