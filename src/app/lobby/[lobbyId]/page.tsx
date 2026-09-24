'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AdminDualLockPanel } from '../../../components/admin/AdminDualLockPanel';
import { ArchitectConsole } from '../../../components/admin/ArchitectConsole';
import { BailiffConsole } from '../../../components/admin/BailiffConsole';
import { GameBoard } from '../../../components/game/GameBoard';
import { MorningNewspaperModal } from '../../../components/game/MorningNewspaperModal';
import { PlayerCard } from '../../../components/game/PlayerCard';
import { VoiceChat } from '../../../components/voice/VoiceChat';
import { formatRoleDisplay } from '../../../types/roles';
import { GamePhase, LobbyState, NightActionType, PlayerSession } from '../../../types/game';
import { MorningNewspaper } from '../../../types/engine';
import { AZ_PHASES, AZ_UI } from '../../../config/i18n/az';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { PACKS_CONFIG } from '../../../config/packs.config';

interface LobbyPageProps {
  readonly params: {
    readonly lobbyId: string;
  };
}

export default function LobbyPage({ params }: LobbyPageProps) {
  const { lobbyId } = params;

  // Persistent user identity from localStorage
  const [currentUserId, setCurrentUserId] = useState<string>('usr-guest');
  const [currentUsername, setCurrentUsername] = useState<string>('Oyunçu');
  const [currentUserTier, setCurrentUserTier] = useState<string>('TIER_1');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showAdminTools, setShowAdminTools] = useState<boolean>(false);
  const [isReadyLocal, setIsReadyLocal] = useState<boolean>(false);
  const [speakingIds, setSpeakingIds] = useState<Set<string>>(new Set());

  // Initialize lobby state in clean waiting room phase
  const [lobbyState, setLobbyState] = useState<LobbyState>(() => {
    const isAllIn = lobbyId.toUpperCase().includes('ALL_IN');
    const isInferno = lobbyId.toUpperCase().includes('INFERNO');
    const mode = isAllIn ? 'ALL_IN' : isInferno ? 'DANTES_INFERNO' : 'SE7EN_DEADLY_SINS';

    return {
      lobbyId,
      hostUserId: 'usr-host-initial',
      mode,
      phase: 'LOBBY',
      players: {},
      hostReady: false,
      adminMasterUnlock: {
        architectUnlocked: false,
        bailiffUnlocked: false,
        dualLockVerified: !isAllIn,
        unlockedAt: isAllIn ? null : Date.now(),
      },
      assignedArchitectId: null,
      assignedBailiffId: null,
      phaseDurationSeconds: 300,
      phaseTimeRemaining: 300,
      nightJitterDelaySeconds: 4,
      liveVotes: {},
      speakerQueue: [],
      bufferedNightActions: [],
      minigameSubStates: {
        dantesInferno: {
          currentCircle: 'CIRCLE_1_LIMBO',
          completedCircles: [],
          deflectionRate: 0.2,
          slowModeCharLimit: 80,
          greedVoteCostDebts: {},
          wrathNoAbstainEnforced: false,
          heresyLeakedClues: [],
          violenceCleanedVictimIds: [],
          fraudBlurActive: false,
          treacherySecretVotingActive: false,
          jesterLuciferShadowActive: false,
          luciferShadowWinnerUserId: null,
        },
      },
      roundNumber: 1,
      lastLynchedUserId: null,
      globalNightKillCap: isAllIn ? 3 : 99,
    };
  });

  // Load user session & join lobby via server API
  useEffect(() => {
    let resolvedId = 'usr-anon';
    let resolvedName = 'Anonim Qonaq';
    let resolvedTier = 'TIER_1';

    try {
      const saved = localStorage.getItem('tdv_mafia_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.username) {
          resolvedName = parsed.username;
          resolvedId = `usr-${parsed.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
          resolvedTier = parsed.tier || 'TIER_1';
        }
      } else {
        const guestId = `usr-guest-${Math.random().toString(36).substring(2, 7)}`;
        resolvedId = guestId;
        resolvedName = `Qonaq_${guestId.substring(10)}`;
      }
    } catch {
      // Ignore
    }

    setCurrentUserId(resolvedId);
    setCurrentUsername(resolvedName);
    setCurrentUserTier(resolvedTier);

    // Join room on server
    const joinLobby = async () => {
      try {
        const res = await fetch(`/api/lobby/${lobbyId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'JOIN',
            userId: resolvedId,
            username: resolvedName,
            tier: resolvedTier,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.rawLobby) {
            setLobbyState(data.rawLobby);
          }
        }
      } catch {
        // Fallback: create local session if network unavailable
        setLobbyState((prev) => {
          if (prev.players[resolvedId]) return prev;
          const hostSession: PlayerSession = {
            socketId: `sock-${resolvedId}`,
            userId: resolvedId,
            username: resolvedName,
            tier: resolvedTier as any,
            adminRole: prev.mode === 'ALL_IN' ? 'THE_ARCHITECT' : 'NONE',
            isHost: Object.keys(prev.players).length === 0,
            isAlive: true,
            hasHostWaiver: true,
            hasAdminWaiver: true,
            displayRole: formatRoleDisplay(resolvedName, 'Citizen', 'Vətəndaş'),
            currentDistrict: 'COMMERCIAL',
            disconnectedAt: null,
            isAiBotControlled: false,
          };
          return {
            ...prev,
            hostUserId: prev.hostUserId === 'usr-host-initial' ? resolvedId : prev.hostUserId,
            players: {
              ...prev.players,
              [resolvedId]: hostSession,
            },
          };
        });
      }
    };

    joinLobby();

    // Poll lobby state every 2.5s to sync other players
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/lobby/${lobbyId}?userId=${resolvedId}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.rawLobby) {
            setLobbyState(data.rawLobby);
          }
        }
      } catch {
        // Ignore
      }
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [lobbyId]);

  // Dispatch action to server
  const dispatchAction = useCallback(
    async (payload: Record<string, unknown>) => {
      try {
        const res = await fetch(`/api/lobby/${lobbyId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUserId,
            username: currentUsername,
            ...payload,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.rawLobby) {
            setLobbyState(data.rawLobby);
          }
        }
      } catch {
        // Network fail
      }
    },
    [lobbyId, currentUserId, currentUsername]
  );

  // Copy Room Link to Clipboard
  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  // Start Game Trigger (Only for Host)
  const handleStartGame = () => {
    if (totalPlayersCount < 3) {
      alert('Mafiya oyununa başlamaq üçün ən azı 3-4 oyunçu lazımdır. "⚡ 5 Botla Doldur" düyməsinə klikləyərək AI botları masaya əlavə edə bilərsiniz!');
      return;
    }
    const nextPhase: GamePhase = lobbyState.mode === 'ALL_IN' ? 'DAY_REGIONAL_CAUCUS' : 'NIGHT_BUFFER';
    const duration = lobbyState.mode === 'ALL_IN' ? 180 : 90;
    dispatchAction({ action: 'START_GAME', nextPhase, durationSeconds: duration });
  };

  // Toggle Ready status
  const handleToggleReady = () => {
    const nextVal = !isReadyLocal;
    setIsReadyLocal(nextVal);
    dispatchAction({ action: 'READY', ready: nextVal });
  };

  // Governance & Admin Handlers
  const handleDualUnlock = (role: 'THE_ARCHITECT' | 'THE_BAILIFF') => {
    dispatchAction({ action: 'DUAL_UNLOCK', role });
  };

  const handleOverridePhase = (nextPhase: GamePhase, durationSeconds: number) => {
    dispatchAction({ action: 'OVERRIDE_PHASE', nextPhase, durationSeconds });
  };

  const handleCastVote = (candidateId: string) => {
    dispatchAction({ action: 'VOTE', candidateId });
  };

  const handleRetractVote = () => {
    dispatchAction({ action: 'RETRACT_VOTE' });
  };

  const handleTriggerAction = (actionType: NightActionType, targetPlayerId: string) => {
    dispatchAction({ action: 'NIGHT_ACTION', actionType, targetPlayerId });
    alert(`Əmr serverə göndərildi: ${actionType} -> ${targetPlayerId}`);
  };

  const isHost = lobbyState.hostUserId === currentUserId || Object.keys(lobbyState.players).length <= 1;
  const isLobbyPhase = lobbyState.phase === 'LOBBY';
  const playersList = Object.values(lobbyState.players);
  const totalPlayersCount = playersList.length;
  const currentPack = PACKS_CONFIG[lobbyState.mode];

  // Derive my faction for voice phase gating (MAFIA = can hear mafia during night)
  const myPlayerSession = lobbyState.players[currentUserId];
  const myFaction: string | null = myPlayerSession
    ? myPlayerSession.displayRole?.formatted?.toLowerCase().includes('mafiya') ||
      myPlayerSession.displayRole?.formatted?.toLowerCase().includes('mafia')
      ? 'MAFIA'
      : 'TOWN'
    : null;

  // Voice-chat peers: all other players (bots can be ignored in voice)
  const voicePeers = playersList
    .filter((p) => p.userId !== currentUserId && !p.isAiBotControlled)
    .map((p) => ({
      userId: p.userId,
      isAlive: p.isAlive,
    }));

  // Newspaper Modal State (only used during game)
  const [isNewspaperOpen, setIsNewspaperOpen] = useState<boolean>(false);
  const [newspaper] = useState<MorningNewspaper | null>({
    publicDeaths: [],
    privateInvestigationResults: [],
    heresyClue: null,
    jitterAppliedMs: 4000,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 16px' }}>
      {/* ─── LOBBY HEADER BAR (RICH OBSIDIAN GLASS) ───────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'linear-gradient(145deg, rgba(18, 22, 34, 0.85) 0%, rgba(10, 14, 24, 0.95) 100%)',
          backdropFilter: 'blur(16px)',
          padding: '22px 26px',
          borderRadius: '14px',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: isLobbyPhase ? '#3b82f6' : '#22c55e',
                boxShadow: isLobbyPhase ? '0 0 10px #3b82f6' : '0 0 10px #22c55e',
                display: 'inline-block',
              }}
            />
            <h1 style={{ fontSize: '22px', margin: 0, color: '#f8fafc', fontWeight: 900 }}>
              {isLobbyPhase ? 'Gözləmə Otağı (Lobby)' : AZ_PHASES[lobbyState.phase] ?? lobbyState.phase} — {lobbyId}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
            <Badge tone="purple">{currentPack?.name || lobbyState.mode.replace(/_/g, ' ')}</Badge>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>
              Masada: <strong style={{ color: '#38bdf8' }}>{totalPlayersCount} Oyunçu</strong>
            </span>
            <span style={{ fontSize: '13px', color: '#64748b' }}>•</span>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>
              Siz: <strong style={{ color: '#f8fafc' }}>{currentUsername}</strong> {isHost && <span style={{ color: '#fbbf24' }}>(Host)</span>}
            </span>
          </div>

          {currentPack?.roleBreakdown && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🎭</span>
              <span><strong>Masa Rolları:</strong> {currentPack.roleBreakdown}</span>
            </div>
          )}
        </div>

        {/* Top Header Actions */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant={copiedLink ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleCopyLink}
            style={{ fontWeight: 800 }}
          >
            {copiedLink ? '✅ Link Kopyalandı!' : '🔗 Masanın Linkini Kopyala'}
          </Button>

          {isLobbyPhase && (
            <Button
              variant={isReadyLocal ? 'secondary' : 'warning'}
              size="sm"
              onClick={handleToggleReady}
              style={{ fontWeight: 700 }}
            >
              {isReadyLocal ? '✅ Mən Hazıram' : '⏳ Hazır Ol'}
            </Button>
          )}

          {isLobbyPhase && isHost && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => dispatchAction({ action: 'ADD_BOT' })}
                style={{ fontWeight: 700, backgroundColor: '#1e1b4b', border: '1px solid #4f46e5', color: '#c7d2fe' }}
              >
                🤖 +1 AI Bot
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => dispatchAction({ action: 'FILL_BOTS', targetCount: 5 })}
                style={{ fontWeight: 700, backgroundColor: '#312e81', border: '1px solid #6366f1', color: '#e0e7ff' }}
              >
                ⚡ 5 Botla Doldur
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleStartGame}
                style={{ fontWeight: 900, boxShadow: '0 0 20px rgba(220, 38, 38, 0.5)' }}
              >
                🚀 Oyunu Başlat
              </Button>
            </>
          )}

          {!isLobbyPhase && isHost && lobbyState.phase !== 'ENDED' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => dispatchAction({ action: 'PROGRESS_PHASE' })}
              style={{ fontWeight: 800, boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)' }}
            >
              {lobbyState.phase === 'NIGHT_BUFFER' ? '🌅 Gecəni Bitir → Səhər' : '⚖️ Səsləri Hesabla (Məhkəmə)'}
            </Button>
          )}
        </div>
      </div>

      {/* Copy link confirmation toast */}
      {copiedLink && (
        <div
          style={{
            backgroundColor: '#064e3b',
            border: '1px solid #059669',
            color: '#a7f3d0',
            padding: '12px 18px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>🎉</span>
          <span>Masa linki kopyalandı! Bu linki dostlarınıza göndərin (WhatsApp / Telegram) — onlar linki açan kimi masada canlı görünəcəklər!</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. LOBBY PHASE (SADƏ, SƏLİQƏLİ VƏ YÜNGÜL GÖZLƏMƏ OTAĞI)              */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {isLobbyPhase ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Secret Role Notice */}
          <div
            style={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '24px' }}>🎭</span>
            <div>
              <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '14px' }}>
                Rollar oyun başlamamışdan əvvəl qətiyyən görünmür!
              </div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                Hər kəs toplaşdıqdan sonra Masa Rəhbəri (Host) "Oyunu Başlat" düyməsinə basacaq və hər bir oyunçuya öz gizli rolu (Mafiya, Şərif, Həkim və s.) şəxsi olaraq təqdim ediləcək.
              </div>
            </div>
          </div>

          {/* Connected Players Grid (Lightweight, No Roles) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
                Masadakı Oyunçular ({totalPlayersCount})
              </h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Dostlarınız linkə daxil olduqca avtomatik bura əlavə olunurlar
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '14px',
              }}
            >
              {playersList.map((p) => (
                <PlayerCard
                  key={p.userId}
                  player={p}
                  isLobbyPhase={true}
                  isSelf={p.userId === currentUserId}
                  isReady={p.isHost || isReadyLocal}
                />
              ))}
            </div>
          </div>

          {/* Lobby Footer Action Box */}
          <div
            style={{
              backgroundColor: '#090d16',
              border: '1px solid #1e293b',
              borderRadius: '14px',
              padding: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#f8fafc' }}>
                {isHost ? 'Siz bu masanın rəhbərisiniz (Host)' : 'Masa Rəhbərinin oyunu başlatması gözlənilir'}
              </div>
              <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
                {isHost
                  ? 'Bütün dostlarınız masaya toplaşdıqdan sonra oyunu başlada bilərsiniz.'
                  : 'Hazır olduğunuzu bildirmək üçün "Mən Hazıram" düyməsinə klikləyin.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {isHost ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleStartGame}
                  style={{
                    backgroundColor: '#16a34a',
                    borderColor: '#15803d',
                    fontWeight: 900,
                    padding: '12px 28px',
                    boxShadow: '0 0 25px rgba(34, 197, 94, 0.4)',
                  }}
                >
                  🚀 Oyunu İndi Başlat
                </Button>
              ) : (
                <Button
                  variant={isReadyLocal ? 'secondary' : 'warning'}
                  size="lg"
                  onClick={handleToggleReady}
                  style={{ fontWeight: 800, padding: '12px 24px' }}
                >
                  {isReadyLocal ? '✅ Mən Hazıram' : '⏳ Hazır Ol'}
                </Button>
              )}
            </div>
          </div>

          {/* Optional Collapsible Admin Tools for Host/Architect */}
          {isHost && (
            <div style={{ marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setShowAdminTools(!showAdminTools)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: '4px 0',
                  textDecoration: 'underline',
                }}
              >
                {showAdminTools ? '▲ İnzibati Alətləri Gizlət' : '▼ Qabaqcıl İnzibati Alətlər (Admin Paneli)'}
              </button>

              {showAdminTools && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {lobbyState.mode === 'ALL_IN' && (
                    <AdminDualLockPanel
                      unlockState={lobbyState.adminMasterUnlock}
                      currentUserRole="THE_ARCHITECT"
                      currentUserId={currentUserId}
                      isHost={isHost}
                      hostReady={lobbyState.hostReady}
                      assignedArchitectId={lobbyState.assignedArchitectId}
                      assignedBailiffId={lobbyState.assignedBailiffId}
                      eligibleWaiverPlayers={[]}
                      onUnlockSubmit={handleDualUnlock}
                      onHostReadyToggle={(ready) => dispatchAction({ action: 'READY', ready })}
                      onGrantWaiver={() => {}}
                    />
                  )}

                  <ArchitectConsole
                    lobbyState={lobbyState}
                    onOverridePhase={handleOverridePhase}
                    onConfigureJitter={(val) => setLobbyState((prev) => ({ ...prev, nightJitterDelaySeconds: val }))}
                  />

                  <BailiffConsole
                    lobbyState={lobbyState}
                    onNextSpeaker={() => {}}
                    onAddSpeaker={() => {}}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────────── */
        /* 2. ACTIVE GAME PHASE (OYUN BAŞLADIQDAN SONRAKİ MƏRHƏLƏ)             */
        /* ─────────────────────────────────────────────────────────────────── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Secret Role Card (Only shown to this player!) */}
          <div
            style={{
              backgroundColor: '#1e1b4b',
              border: '2px solid #6366f1',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 0 25px rgba(99, 102, 241, 0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>🎭</span>
              <div>
                <span style={{ fontSize: '11px', color: '#c7d2fe', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                  Sizin Gizli Şəxsi Rolunuz
                </span>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#f8fafc' }}>
                  {lobbyState.players[currentUserId]?.displayRole.formatted ?? `${currentUsername} (Vətəndaş)`}
                </div>
              </div>
            </div>

            <Badge tone="purple">MƏXFİ</Badge>
          </div>

          {/* Full Interactive Game Board */}
          <GameBoard
            lobbyState={lobbyState}
            currentUserId={currentUserId}
            onOpenNewspaper={() => setIsNewspaperOpen(true)}
            onCastVote={handleCastVote}
            onRetractVote={handleRetractVote}
            onTriggerAction={handleTriggerAction}
            speakingIds={speakingIds}
          />

          {/* ─── VOICE CHAT ──────────────────────────────────────────────────── */}
          <VoiceChat
            lobbyId={lobbyId}
            myUserId={currentUserId}
            myFaction={myFaction}
            phase={lobbyState.phase}
            peers={voicePeers}
            onSpeakingChange={setSpeakingIds}
          />

          {/* Morning Newspaper Modal */}
          <MorningNewspaperModal
            isOpen={isNewspaperOpen}
            newspaper={newspaper}
            roundNumber={lobbyState.roundNumber}
            minigameSubStates={lobbyState.minigameSubStates}
            onClose={() => setIsNewspaperOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
