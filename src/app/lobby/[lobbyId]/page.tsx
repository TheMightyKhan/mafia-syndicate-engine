'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Link as LinkIcon,
  Check,
  Play,
  Bot,
  Zap,
  Users,
  Shield,
  Eye,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
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
      alert(
        'Mafiya oyununa başlamaq üçün ən azı 3-4 oyunçu lazımdır. "⚡ 5 Botla Doldur" düyməsinə klikləyərək AI botları masaya əlavə edə bilərsiniz!'
      );
      return;
    }
    const nextPhase: GamePhase =
      lobbyState.mode === 'ALL_IN' ? 'DAY_REGIONAL_CAUCUS' : 'NIGHT_BUFFER';
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

  const isHost =
    lobbyState.hostUserId === currentUserId || Object.keys(lobbyState.players).length <= 1;
  const isLobbyPhase = lobbyState.phase === 'LOBBY';
  const playersList = Object.values(lobbyState.players);
  const totalPlayersCount = playersList.length;
  const currentPack = PACKS_CONFIG[lobbyState.mode];

  // Derive my faction for voice phase gating
  const myPlayerSession = lobbyState.players[currentUserId];
  const myFaction: string | null = myPlayerSession
    ? myPlayerSession.displayRole?.formatted?.toLowerCase().includes('mafiya') ||
      myPlayerSession.displayRole?.formatted?.toLowerCase().includes('mafia')
      ? 'MAFIA'
      : 'TOWN'
    : null;

  // Voice-chat peers
  const voicePeers = playersList
    .filter((p) => p.userId !== currentUserId && !p.isAiBotControlled)
    .map((p) => ({
      userId: p.userId,
      isAlive: p.isAlive,
    }));

  const [isNewspaperOpen, setIsNewspaperOpen] = useState<boolean>(false);
  const [newspaper] = useState<MorningNewspaper | null>({
    publicDeaths: [],
    privateInvestigationResults: [],
    heresyClue: null,
    jitterAppliedMs: 4000,
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 transition-colors duration-200">
      {/* ─── LOBBY HEADER BAR ───────────────────────────────────────── */}
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-200">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isLobbyPhase ? 'bg-blue-500 ring-2 ring-blue-500/20' : 'bg-emerald-500 ring-2 ring-emerald-500/20 animate-pulse'
              }`}
            />
            <h1 className="text-xl sm:text-2xl font-black text-zinc-950 dark:text-white tracking-tight">
              {isLobbyPhase ? 'Gözləmə Otağı (Lobby)' : AZ_PHASES[lobbyState.phase] ?? lobbyState.phase}{' '}
              <span className="text-sm font-semibold text-zinc-400 font-mono">— {lobbyId}</span>
            </h1>
          </div>

          <div className="flex items-center gap-2.5 mt-2 flex-wrap text-xs text-zinc-600 dark:text-zinc-400">
            <Badge tone="purple">{currentPack?.name || lobbyState.mode.replace(/_/g, ' ')}</Badge>
            <span>•</span>
            <span>
              Masada:{' '}
              <strong className="text-zinc-900 dark:text-zinc-100">{totalPlayersCount} Oyunçu</strong>
            </span>
            <span>•</span>
            <span>
              Siz:{' '}
              <strong className="text-zinc-900 dark:text-zinc-100">{currentUsername}</strong>{' '}
              {isHost && <span className="text-amber-600 dark:text-amber-400 font-bold">(Host)</span>}
            </span>
          </div>

          {currentPack?.roleBreakdown && (
            <div className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>
                <strong>Masa Rolları:</strong> {currentPack.roleBreakdown}
              </span>
            </div>
          )}
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant={copiedLink ? 'secondary' : 'outline'}
            size="sm"
            onClick={handleCopyLink}
            icon={copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <LinkIcon className="w-4 h-4" />}
          >
            {copiedLink ? 'Link Kopyalandı' : 'Linki Kopyala'}
          </Button>

          {isLobbyPhase && (
            <Button
              variant={isReadyLocal ? 'secondary' : 'warning'}
              size="sm"
              onClick={handleToggleReady}
              icon={isReadyLocal ? <Check className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4" />}
            >
              {isReadyLocal ? 'Mən Hazıram' : 'Hazır Ol'}
            </Button>
          )}

          {isLobbyPhase && isHost && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => dispatchAction({ action: 'ADD_BOT' })}
                icon={<Bot className="w-4 h-4" />}
              >
                +1 AI Bot
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => dispatchAction({ action: 'FILL_BOTS', targetCount: 5 })}
                icon={<Zap className="w-4 h-4 text-amber-500" />}
              >
                5 Botla Doldur
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleStartGame}
                icon={<Play className="w-4 h-4" />}
              >
                Oyunu Başlat
              </Button>
            </>
          )}

          {!isLobbyPhase && isHost && lobbyState.phase !== 'ENDED' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => dispatchAction({ action: 'PROGRESS_PHASE' })}
            >
              {lobbyState.phase === 'NIGHT_BUFFER' ? '🌅 Gecəni Bitir → Səhər' : '⚖️ Səsləri Hesabla'}
            </Button>
          )}
        </div>
      </div>

      {/* Copy link confirmation toast */}
      {copiedLink && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Masa linki kopyalandı! Bu linki dostlarınıza göndərin — onlar linkə daxil olan kimi masada görünəcəklər.</span>
        </div>
      )}

      {/* ─── 1. LOBBY PHASE ─────────────────────────────────────────── */}
      {isLobbyPhase ? (
        <div className="flex flex-col gap-6">
          {/* Secret Role Notice */}
          <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                Rollar oyun başlamamışdan əvvəl qətiyyən görünmür!
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                Hər kəs toplaşdıqdan sonra Masa Rəhbəri (Host) &quot;Oyunu Başlat&quot; düyməsinə basacaq və hər bir iştirakçıya öz gizli rolu (Mafiya, Şərif, Həkim və s.) şəxsi olaraq təqdim ediləcək.
              </p>
            </div>
          </div>

          {/* Connected Players Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-zinc-950 dark:text-white">
                  Masadakı Oyunçular
                </h2>
                <Badge tone="neutral">{totalPlayersCount}</Badge>
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Dostlarınız linklə daxil olduqca avtomatik bura əlavə olunurlar
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
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
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                {isHost ? 'Siz bu masanın rəhbərisiniz (Host)' : 'Masa Rəhbərinin oyunu başlatması gözlənilir'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {isHost
                  ? 'Bütün dostlarınız masaya toplaşdıqdan sonra oyunu başlada bilərsiniz.'
                  : 'Hazır olduğunuzu bildirmək üçün "Hazır Ol" düyməsinə klikləyin.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isHost ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleStartGame}
                  icon={<Play className="w-4 h-4" />}
                >
                  Oyunu İndi Başlat
                </Button>
              ) : (
                <Button
                  variant={isReadyLocal ? 'secondary' : 'warning'}
                  size="md"
                  onClick={handleToggleReady}
                  icon={isReadyLocal ? <Check className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4" />}
                >
                  {isReadyLocal ? 'Mən Hazıram' : 'Hazır Ol'}
                </Button>
              )}
            </div>
          </div>

          {/* Collapsible Admin Drawer for Host */}
          {isHost && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAdminTools(!showAdminTools)}
                className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {showAdminTools ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span>{showAdminTools ? 'İnzibati Alətləri Gizlət' : 'Qabaqcıl İnzibati Alətlər (Admin Paneli)'}</span>
              </button>

              {showAdminTools && (
                <div className="mt-4 flex flex-col gap-4 animate-fadeIn">
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
                    onConfigureJitter={(val) =>
                      setLobbyState((prev) => ({ ...prev, nightJitterDelaySeconds: val }))
                    }
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
        /* ─── 2. ACTIVE GAME PHASE ───────────────────────────────────── */
        <div className="flex flex-col gap-6">
          {/* Secret Role Card */}
          <div className="p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                🎭
              </div>
              <div>
                <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
                  Sizin Gizli Şəxsi Rolunuz
                </span>
                <div className="text-lg font-black text-zinc-950 dark:text-white">
                  {lobbyState.players[currentUserId]?.displayRole.formatted ?? `${currentUsername} (Vətəndaş)`}
                </div>
              </div>
            </div>

            <Badge tone="purple">MƏXFİ</Badge>
          </div>

          {/* Interactive Game Board */}
          <GameBoard
            lobbyState={lobbyState}
            currentUserId={currentUserId}
            onOpenNewspaper={() => setIsNewspaperOpen(true)}
            onCastVote={handleCastVote}
            onRetractVote={handleRetractVote}
            onTriggerAction={handleTriggerAction}
            speakingIds={speakingIds}
          />

          {/* Voice Chat */}
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
