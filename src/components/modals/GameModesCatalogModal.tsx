'use client';

import React, { useState, CSSProperties } from 'react';
import { PACKS_CONFIG } from '../../config/packs.config';
import { GameMode } from '../../types/packs';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { AZ_CIVIC_OFFICES, AZ_INNATE_TRAITS } from '../../config/i18n/az';

export interface GameModesCatalogModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSelectMode?: (mode: GameMode) => void;
}

type ShowcaseTab = 'CLASSIC' | 'MINIGAMES' | 'ALL_IN';

// Helper to style each individual role token into a distinct colored chip
const getRoleChipStyle = (roleText: string) => {
  const r = roleText.toLowerCase();

  // Mafia / Assassin / Dictator / Killer
  if (
    r.includes('mafiya') ||
    r.includes('xaç atası') ||
    r.includes('don') ||
    r.includes('qatil') ||
    r.includes('qəsdçi') ||
    r.includes('diktator') ||
    r.includes('snayper') ||
    r.includes('malebranche') ||
    r.includes('terrorçu') ||
    r.includes('killer') ||
    r.includes('mutant') ||
    r.includes('moriarti') ||
    r.includes('quldur') ||
    r.includes('kölgə') ||
    r.includes('şəbəkə')
  ) {
    return {
      bg: 'rgba(239, 68, 68, 0.18)',
      border: 'rgba(239, 68, 68, 0.42)',
      text: '#fca5a5',
      icon: 'fa-skull-crossbones',
    };
  }

  // Doctor / Medic / Healer / Surgeon
  if (
    r.includes('həkim') ||
    r.includes('mələk') ||
    r.includes('cərrah') ||
    r.includes('sağaldıcı') ||
    r.includes('doctor') ||
    r.includes('likvidator') ||
    r.includes('vatson') ||
    r.includes('ekzorsist')
  ) {
    return {
      bg: 'rgba(16, 185, 129, 0.18)',
      border: 'rgba(16, 185, 129, 0.42)',
      text: '#6ee7b7',
      icon: 'fa-heart-pulse',
    };
  }

  // Law & Investigation: Sheriff, Prosecutor, Lawyer, Investigator, Warden, Police, Inquisitor
  if (
    r.includes('şərif') ||
    r.includes('vergili') ||
    r.includes('prokuror') ||
    r.includes('vəkil') ||
    r.includes('müstəntiq') ||
    r.includes('hakim') ||
    r.includes('nəzarətçi') ||
    r.includes('komissar') ||
    r.includes('inkvizitor') ||
    r.includes('mühafizəçi') ||
    r.includes('sheriff') ||
    r.includes('dozimetrist') ||
    r.includes('holms') ||
    r.includes('şerlok') ||
    r.includes('şturman') ||
    r.includes('naviqator') ||
    r.includes('medium')
  ) {
    return {
      bg: 'rgba(56, 189, 248, 0.18)',
      border: 'rgba(56, 189, 248, 0.42)',
      text: '#7dd3fc',
      icon: 'fa-shield-halved',
    };
  }

  // Jester / Lucifer / Cult / Shadow
  if (
    r.includes('lusifer') ||
    r.includes('dəli') ||
    r.includes('jester') ||
    r.includes('kult') ||
    r.includes('iblis') ||
    r.includes('ruhani') ||
    r.includes('poltergeyst') ||
    r.includes('ruh')
  ) {
    return {
      bg: 'rgba(168, 85, 247, 0.22)',
      border: 'rgba(168, 85, 247, 0.48)',
      text: '#d8b4fe',
      icon: 'fa-masks-theater',
    };
  }

  // Tactical Specialists: Disrupter, Time Traveler, Blackmailer, Puppeteer, Coroner, Martyr, Klaatu, Alien, Armor, Spy
  if (
    r.includes('gözbağlayıcı') ||
    r.includes('şantajçı') ||
    r.includes('pataloqanatom') ||
    r.includes('pataloanatom') ||
    r.includes('kuklaçı') ||
    r.includes('fədai') ||
    r.includes('zaman') ||
    r.includes('illüziyaçı') ||
    r.includes('klaatu') ||
    r.includes('donduran') ||
    r.includes('zireh') ||
    r.includes('yadplanetli') ||
    r.includes('casus') ||
    r.includes('qort') ||
    r.includes('netrunner') ||
    r.includes('xaker') ||
    r.includes('kəşfiyyatçı') ||
    r.includes('neyro') ||
    r.includes('adler') ||
    r.includes('tədqiqatçı')
  ) {
    return {
      bg: 'rgba(245, 158, 11, 0.18)',
      border: 'rgba(245, 158, 11, 0.42)',
      text: '#fde68a',
      icon: 'fa-wand-magic-sparkles',
    };
  }

  // Town / Citizens / Prisoners / Sinners
  return {
    bg: 'rgba(148, 163, 184, 0.14)',
    border: 'rgba(148, 163, 184, 0.28)',
    text: '#cbd5e1',
    icon: 'fa-user',
  };
};

// Unique special abilities and mechanical signatures for each game mode
const PACK_SPECIAL_FEATURES: Record<string, { label: string; icon: string }[]> = {
  SE7EN_DEADLY_SINS: [
    { label: 'Gözbağlama (Əngəl)', icon: 'fa-wand-magic-sparkles' },
    { label: 'Lusifer Qələbəsi (Tək)', icon: 'fa-masks-theater' },
    { label: 'Müstəntiq Təhqiqatı', icon: 'fa-magnifying-glass' },
  ],
  AND_THEN_THERE_WERE_NONE: [
    { label: 'Pataloqanatom Otopsiyası', icon: 'fa-microscope' },
    { label: 'Gözbağlayıcı İllüziyası', icon: 'fa-wand-magic-sparkles' },
    { label: 'Gizli Sui-qəsd', icon: 'fa-crosshairs' },
  ],
  CRIME_AND_PUNISHMENT: [
    { label: 'Prokuror Sərt İttihamı', icon: 'fa-scale-balanced' },
    { label: 'Vəkil Bəraəti', icon: 'fa-file-shield' },
    { label: 'Şantaj (Səssizlik Təzyiqi)', icon: 'fa-comment-slash' },
    { label: 'Pataloqanatom Otopsiyası', icon: 'fa-microscope' },
  ],
  STEINS_GATE: [
    { label: 'Zaman Səyahəti (Döngə)', icon: 'fa-clock-rotate-left' },
    { label: 'Gözbağlayıcı Əngəli', icon: 'fa-wand-magic-sparkles' },
    { label: 'İllüziya Tələsi', icon: 'fa-eye' },
  ],
  DIES_IRAE: [
    { label: 'İnkvizitor Təmizlənməsi', icon: 'fa-fire' },
    { label: 'Kuklaçı İdarəetməsi', icon: 'fa-hands' },
    { label: 'Regional Palata Səsverməsi', icon: 'fa-landmark' },
  ],
  ALL_TOMORROWS: [
    { label: 'Fədai Qurbanı', icon: 'fa-shield-heart' },
    { label: 'Casus Məlumatı', icon: 'fa-user-secret' },
    { label: 'Cüt Müstəqil Qatil', icon: 'fa-skull' },
  ],
  FULL_HOUSE: [
    { label: 'Xaç Atası Toxunulmazlığı', icon: 'fa-crown' },
    { label: 'Kuklaçı & Şantajçı Şəbəkəsi', icon: 'fa-network-wired' },
    { label: '3-lü Şərif & Həkim Alyansı', icon: 'fa-shield-halved' },
  ],
  TABULA_RASA: [
    { label: 'Sərbəst Rol Konstruktoru', icon: 'fa-sliders' },
    { label: 'Bütün Xüsusi Qabiliyyətlər Açıq', icon: 'fa-unlock' },
  ],
  CATENACCIO: [
    { label: 'Tək Snayper (Zirehkeçirən)', icon: 'fa-crosshairs' },
    { label: '3 Səviyyəli Müdafiə Səddi', icon: 'fa-shield-halved' },
    { label: 'Sədd Aşma Mexanikası', icon: 'fa-hammer' },
  ],
  STANFORD_PRISON: [
    { label: 'Baş Nəzarətçi İntizamı', icon: 'fa-person-military-rifle' },
    { label: 'Qatil Məhbus Qisası', icon: 'fa-handcuffs' },
    { label: 'Qiyam Göstəricisi (Revolt Meter)', icon: 'fa-fire-flame-curved' },
  ],
  OPERATION_VALKYRIE: [
    { label: 'Partlayıcı Çanta (Briefcase)', icon: 'fa-briefcase' },
    { label: 'Partlayış Fitil Sayğacı', icon: 'fa-bomb' },
    { label: 'Diktator & Qəsdçilər Savaşı', icon: 'fa-crown' },
  ],
  THE_DAY_THE_EARTH_STOOD_STILL: [
    { label: 'Klaatu: Dünyanı Dondur (Qətllər Durur)', icon: 'fa-snowflake' },
    { label: 'Qort Lazer Buxarlandırması', icon: 'fa-bolt-lightning' },
    { label: 'Qiyamət Saatı 12:00', icon: 'fa-hourglass-end' },
  ],
  DANTES_INFERNO: [
    { label: 'Malebranche İblisləri', icon: 'fa-skull-crossbones' },
    { label: 'Vergili Bələdçiliyi', icon: 'fa-compass' },
    { label: '9 Dairə Əzabları (Limbo, Qəzəb, Xəsislik...)', icon: 'fa-dungeon' },
    { label: 'Kokit Gizli Səsverməsi', icon: 'fa-user-secret' },
    { label: 'Flageleton Qan Çayı', icon: 'fa-droplet' },
  ],
  CHERNOBYL_EXCLUSION_ZONE: [
    { label: 'Radiasiya Sızması (Zonaya Eniş)', icon: 'fa-radiation' },
    { label: 'Dozimetr Skaneri (Gizli Rol)', icon: 'fa-gauge-high' },
    { label: 'Bioloji Mutasiya Təhlükəsi', icon: 'fa-biohazard' },
  ],
  CYBERPUNK_NEO_BAKU: [
    { label: 'Qara Şəbəkə Firewall Hücumu', icon: 'fa-terminal' },
    { label: 'Neyro-İmplant Bloklama', icon: 'fa-microchip' },
    { label: 'Siber Kəşfiyyat & Verilənlər Sızması', icon: 'fa-satellite-dish' },
  ],
  BERMUDA_TRIANGLE: [
    { label: 'Maqnit Anomaliyası (Səslər Sönür)', icon: 'fa-compass' },
    { label: 'Kabus Gəmisi Qəfil Hücumu', icon: 'fa-skull-crossbones' },
    { label: 'Tilsimli Dəniz Qoruyucusu', icon: 'fa-water' },
  ],
  MIDNIGHT_SEANCE: [
    { label: 'Ruhlarla Əlaqə (Məzar Danışır)', icon: 'fa-ghost' },
    { label: 'Ekzorsizm Qoruyucu Şamı', icon: 'fa-fire' },
    { label: 'Qanlı Meri Aynası & Poltergeyst', icon: 'fa-mask' },
  ],
  SHERLOCK_BAKER_STREET: [
    { label: 'Deduktiv Zəka Döyüşü', icon: 'fa-magnifying-glass' },
    { label: 'Moriarti Şahmat Həmləsi', icon: 'fa-chess-knight' },
    { label: 'İren Adler Gizli Şifrəsi', icon: 'fa-envelope-open-text' },
  ],
};

export const GameModesCatalogModal: React.FC<GameModesCatalogModalProps> = ({
  isOpen,
  onClose,
  onSelectMode,
}) => {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('CLASSIC');

  if (!isOpen) return null;

  const packs = Object.values(PACKS_CONFIG);
  const classicPacks = packs.filter((p) => !p.isMinigame && !p.isAllIn);
  const minigamePacks = packs.filter((p) => p.isMinigame);
  const allInPack = packs.find((p) => p.isAllIn);

  const civicOfficesList = Object.values(AZ_CIVIC_OFFICES);
  const innateTraitsList = Object.values(AZ_INNATE_TRAITS);

  const handleLaunchMode = (mode: GameMode) => {
    onClose();
    if (onSelectMode) {
      onSelectMode(mode);
    }
  };

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(3, 7, 18, 0.88)',
    backdropFilter: 'blur(14px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    padding: '20px',
  };

  const modalContainerStyle: CSSProperties = {
    backgroundColor: '#090d16',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    borderRadius: '20px',
    maxWidth: '1100px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.9), 0 0 50px rgba(220, 38, 38, 0.2)',
    overflow: 'hidden',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalContainerStyle} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div
          style={{
            padding: '22px 28px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(145deg, rgba(28, 14, 22, 0.85) 0%, rgba(11, 15, 26, 0.95) 100%)',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                }}
              >
                <i className="fa-solid fa-layer-group" />
              </div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#f8fafc' }}>
                Oyun Formatları & Rollar Kataloqu
              </h2>
            </div>
            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
              14 klub paket, xüsusi qabiliyyətlər, 16 ictimai vəzifə və 12 gizli istedad.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Tab Buttons in Header */}
            <div
              style={{
                display: 'flex',
                gap: '4px',
                background: 'rgba(15, 23, 42, 0.8)',
                padding: '4px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('CLASSIC')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'CLASSIC' ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' : 'transparent',
                  color: activeTab === 'CLASSIC' ? '#ffffff' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                🏛️ Klassik (8)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('MINIGAMES')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'MINIGAMES' ? 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)' : 'transparent',
                  color: activeTab === 'MINIGAMES' ? '#ffffff' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                🎭 Xüsusi Rejimlər (10)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ALL_IN')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: activeTab === 'ALL_IN' ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' : 'transparent',
                  color: activeTab === 'ALL_IN' ? '#ffffff' : '#94a3b8',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                👑 All-In (1)
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '15px',
                transition: 'all 0.15s ease',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flexGrow: 1 }}>
          {/* Tab 1: Classic Packs */}
          {activeTab === 'CLASSIC' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '16px' }}>
              {classicPacks.map((pack) => {
                const rolesList = pack.roleBreakdown.split(',').map((s) => s.trim()).filter(Boolean);
                const features = PACK_SPECIAL_FEATURES[pack.id] || [];

                return (
                  <div
                    key={pack.id}
                    className="card-hover-lift"
                    style={{
                      background: 'linear-gradient(145deg, rgba(26, 16, 24, 0.85) 0%, rgba(11, 15, 26, 0.95) 100%)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#f8fafc', fontWeight: 900 }}>
                          {pack.name}
                        </h3>
                        <Badge tone="blue">{pack.minPlayers}–{pack.maxPlayers} nəfər</Badge>
                      </div>

                      {/* Roles */}
                      <div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, marginBottom: '5px', textTransform: 'uppercase' }}>
                          Rol Tərkibi:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {rolesList.map((role, idx) => {
                            const style = getRoleChipStyle(role);
                            return (
                              <span
                                key={idx}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 7px',
                                  borderRadius: '5px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  background: style.bg,
                                  border: `1px solid ${style.border}`,
                                  color: style.text,
                                }}
                              >
                                <i className={`fa-solid ${style.icon}`} style={{ fontSize: '9px' }} />
                                {role}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Features */}
                      {features.length > 0 && (
                        <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', padding: '7px 9px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <div style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>
                            ⚡ Xüsusi Mexanika:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {features.map((feat, fIdx) => (
                              <span
                                key={fIdx}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '10px',
                                  color: '#e2e8f0',
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  padding: '2px 5px',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                }}
                              >
                                <i className={`fa-solid ${feat.icon}`} style={{ color: '#f87171', fontSize: '9px' }} />
                                {feat.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Crimson Masa Yarat Button */}
                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        onClick={() => handleLaunchMode(pack.id as GameMode)}
                        style={{
                          background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                          boxShadow: '0 0 16px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                          border: '1px solid #fca5a5',
                          fontWeight: 800,
                          fontSize: '12px',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '8px',
                        }}
                      >
                        <i className="fa-solid fa-dice" />
                        Bu Rejimdə Masa Yarat
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Minigames */}
          {activeTab === 'MINIGAMES' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '16px' }}>
              {minigamePacks.map((pack) => {
                const rolesList = pack.roleBreakdown.split(',').map((s) => s.trim()).filter(Boolean);
                const features = PACK_SPECIAL_FEATURES[pack.id] || [];

                return (
                  <div
                    key={pack.id}
                    className="card-hover-lift"
                    style={{
                      background: 'linear-gradient(145deg, rgba(34, 22, 12, 0.85) 0%, rgba(11, 15, 26, 0.95) 100%)',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#fde68a', fontWeight: 900 }}>
                          {pack.name}
                        </h3>
                        <Badge tone="amber">{pack.minPlayers}–{pack.maxPlayers} nəfər</Badge>
                      </div>

                      {/* Roles */}
                      <div>
                        <div style={{ fontSize: '10px', color: '#fef08a', fontWeight: 700, marginBottom: '5px', textTransform: 'uppercase' }}>
                          Rejim Rolları:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                          {rolesList.map((role, idx) => {
                            const style = getRoleChipStyle(role);
                            return (
                              <span
                                key={idx}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 7px',
                                  borderRadius: '5px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  background: style.bg,
                                  border: `1px solid ${style.border}`,
                                  color: style.text,
                                }}
                              >
                                <i className={`fa-solid ${style.icon}`} style={{ fontSize: '9px' }} />
                                {role}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Features */}
                      {features.length > 0 && (
                        <div style={{ background: 'rgba(245, 158, 11, 0.07)', borderRadius: '8px', padding: '7px 9px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                          <div style={{ fontSize: '10px', color: '#fef08a', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>
                            🔥 Xüsusi Mexanikalar:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {features.map((feat, fIdx) => (
                              <span
                                key={fIdx}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '10px',
                                  color: '#fde68a',
                                  background: 'rgba(245, 158, 11, 0.15)',
                                  padding: '2px 5px',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                }}
                              >
                                <i className={`fa-solid ${feat.icon}`} style={{ color: '#fbbf24', fontSize: '9px' }} />
                                {feat.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Crimson Masa Yarat Button */}
                    <div style={{ borderTop: '1px solid rgba(245, 158, 11, 0.15)', paddingTop: '10px' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        onClick={() => handleLaunchMode(pack.id as GameMode)}
                        style={{
                          background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                          boxShadow: '0 0 16px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                          border: '1px solid #fca5a5',
                          fontWeight: 800,
                          fontSize: '12px',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          borderRadius: '8px',
                        }}
                      >
                        <i className="fa-solid fa-dice" />
                        Bu Rejimdə Masa Yarat
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 3: All-In */}
          {activeTab === 'ALL_IN' && allInPack && (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(38, 16, 56, 0.9) 0%, rgba(12, 10, 26, 0.98) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.45)',
                borderRadius: '18px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                boxShadow: '0 12px 35px rgba(124, 58, 237, 0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#f8fafc' }}>
                    {allInPack.name} (40–50 Nəfərlik Şəhər KÃ¼tlÉ™vi DÃ¶yÃ¼ÅŸÃ¼)
                  </h3>
                  <Badge tone="purple">{allInPack.minPlayers}–{allInPack.maxPlayers} nəfər</Badge>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleLaunchMode('ALL_IN')}
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                    boxShadow: '0 0 16px rgba(239, 68, 68, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                    border: '1px solid #fca5a5',
                    fontWeight: 800,
                    fontSize: '13px',
                    color: '#ffffff',
                    padding: '8px 20px',
                    borderRadius: '8px',
                  }}
                >
                  <i className="fa-solid fa-dice" />
                  All-In Masası Yarat
                </Button>
              </div>

              {/* Roster */}
              <div>
                <div style={{ fontSize: '11px', color: '#d8b4fe', fontWeight: 800, marginBottom: '6px', textTransform: 'uppercase' }}>
                  Şəhər Bölgüsü (3 Laylı Kimlik):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {allInPack.roleBreakdown.split(',').map((role, idx) => {
                    const trimmed = role.trim();
                    if (!trimmed) return null;
                    const style = getRoleChipStyle(trimmed);
                    return (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 8px',
                          borderRadius: '5px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: style.bg,
                          border: `1px solid ${style.border}`,
                          color: style.text,
                        }}
                      >
                        <i className={`fa-solid ${style.icon}`} style={{ fontSize: '9px' }} />
                        {trimmed}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* 16 Civic Offices */}
              <div style={{ background: 'rgba(56, 189, 248, 0.05)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <i className="fa-solid fa-landmark text-sky-400" />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#7dd3fc' }}>
                    16 İctimai Vəzifə (Kvartal Səlahiyyətləri & Bonus Səslər):
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {civicOfficesList.map((office, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '5px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#bae6fd',
                      }}
                    >
                      <i className="fa-solid fa-building-columns" style={{ fontSize: '9px', opacity: 0.8 }} />
                      {office}
                    </span>
                  ))}
                </div>
              </div>

              {/* 12 Traits */}
              <div style={{ background: 'rgba(168, 85, 247, 0.06)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <i className="fa-solid fa-bolt text-purple-400" />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#d8b4fe' }}>
                    12 Gizli İstedad (Gecə Passiv & Aktiv Qabiliyyətləri):
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {innateTraitsList.map((trait, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '5px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: 'rgba(168, 85, 247, 0.14)',
                        border: '1px solid rgba(168, 85, 247, 0.35)',
                        color: '#f3e8ff',
                      }}
                    >
                      <i className="fa-solid fa-dna" style={{ fontSize: '9px', opacity: 0.8 }} />
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
