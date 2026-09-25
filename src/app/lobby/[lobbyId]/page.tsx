'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Sliders,
  Volume2,
  VolumeX,
  Trophy,
  RotateCcw,
  X,
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
import { playCard, playDay, playNight, isSoundMuted, toggleSound, subscribeSound } from '../../../utils/sfx';

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
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [speakingIds, setSpeakingIds] = useState<Set<string>>(new Set());

  // Toast notifications
  const [toast, setToast] = useState<{
    message: string;
    tone: 'info' | 'success' | 'warning' | 'danger';
  } | null>(null);

  const showToast = useCallback(
    (message: string, tone: 'info' | 'success' | 'warning' | 'danger' = 'info') => {
      setToast({ message, tone });
    },
    []
  );

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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

  // Track sound
  useEffect(() => {
    setSoundMuted(isSoundMuted());
    const unsub = subscribeSound((muted) => setSoundMuted(muted));
    return () => unsub();
  }, []);

  // Load user session & join lobby via server API
  useEffect(() => {
    let resolvedId = 'usr-anon';
    let resolvedName = 'Anonim Qonaq';
    let resolvedTier = 'TIER_1';

    try {
      const ecoRaw = localStorage.getItem('tdv_ecosystem_session_v1');
      if (ecoRaw) {
        const parsedEco = JSON.parse(ecoRaw);
        if (parsedEco?.username || parsedEco?.fullName) {
          resolvedName = parsedEco.fullName || parsedEco.username;
          resolvedId = `usr-${(parsedEco.username || parsedEco.fullName).toLowerCase().replace(/[^a-z0-9]/g, '')}`;
          resolvedTier = parsedEco.tier || 'TIER_1';
        }
      } else {
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

  // Copy Room Link to Clipboard with vibrant green toast feedback
  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      playCard();
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  // Start Game Trigger (Only for Host)
  const handleStartGame = () => {
    if (totalPlayersCount < 3) {
      showToast(
        'Mafiya oyununa başlamaq üçün ən azı 3-4 oyunçu lazımdır. "⚡ 5 Botla Doldur" düyməsinə klikləyərək AI botları masaya əlavə edə bilərsiniz!',
        'warning'
      );
      return;
    }
    const nextPhase: GamePhase =
      lobbyState.mode === 'ALL_IN' ? 'DAY_REGIONAL_CAUCUS' : 'NIGHT_BUFFER';
    const duration = lobbyState.mode === 'ALL_IN' ? 180 : 90;
    playNight();
    dispatchAction({ action: 'START_GAME', nextPhase, durationSeconds: duration });
  };

  // Toggle Ready status
  const handleToggleReady = () => {
    playCard();
    const nextVal = !isReadyLocal;
    setIsReadyLocal(nextVal);
    dispatchAction({ action: 'READY', ready: nextVal });
  };

  // Add bots handlers
  const handleAddBot = () => {
    playCard();
    dispatchAction({ action: 'ADD_BOT' });
  };

  const handleFillBots = () => {
    playCard();
    dispatchAction({ action: 'FILL_BOTS', targetCount: 5 });
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
    playCard();
    dispatchAction({ action: 'NIGHT_ACTION', actionType, targetPlayerId });
    const targetName = lobbyState.players[targetPlayerId]?.username || targetPlayerId;
    const actionNames: Record<NightActionType, string> = {
      KILL: 'Qətl əmri',
      PROTECT: 'Mühafizə əmri',
      INVESTIGATE: 'Təhqiqat sorğusu',
      BLOCK: 'Bloklama əmri',
      MISDIRECT: 'Yönləndirmə əmri',
      FRAME: 'Şər atma əmri',
    };
    showToast(
      `Əmr qeydə alındı: ${actionNames[actionType] || actionType} ➔ ${targetName}`,
      'success'
    );
  };

  const isHost =
    lobbyState.hostUserId === currentUserId ||
    (lobbyState.players[currentUserId]?.isHost ?? false) ||
    Object.keys(lobbyState.players).length <= 1;
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

  // Auto-progression countdown timer
  const autoProgressTriggeredRef = useRef<string | null>(null);

  useEffect(() => {
    if (lobbyState.phase === 'LOBBY' || lobbyState.phase === 'ENDED') return;

    const timer = setInterval(() => {
      setLobbyState((prev) => {
        if (prev.phase === 'LOBBY' || prev.phase === 'ENDED') return prev;

        let remaining = prev.phaseTimeRemaining;
        if (prev.phaseEndsAt) {
          remaining = Math.max(0, Math.ceil((prev.phaseEndsAt - Date.now()) / 1000));
        } else {
          remaining = Math.max(0, prev.phaseTimeRemaining - 1);
        }

        const phaseKey = `${prev.phase}-${prev.roundNumber}`;
        if (remaining === 0 && autoProgressTriggeredRef.current !== phaseKey) {
          const isUserHost =
            prev.hostUserId === currentUserId ||
            (prev.players[currentUserId]?.isHost ?? false) ||
            Object.keys(prev.players).length <= 1;
          if (isUserHost) {
            autoProgressTriggeredRef.current = phaseKey;
            dispatchAction({ action: 'PROGRESS_PHASE' });
          }
        }

        return {
          ...prev,
          phaseTimeRemaining: remaining,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lobbyState.phase, currentUserId, dispatchAction]);

  // Phase transition detector (audio cues and dawn newspaper auto-popup)
  const prevPhaseRef = useRef<GamePhase>(lobbyState.phase);

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    const currentPhase = lobbyState.phase;

    if (prevPhase !== currentPhase) {
      prevPhaseRef.current = currentPhase;
      autoProgressTriggeredRef.current = null;

      if (currentPhase === 'NIGHT_BUFFER') {
        playNight();
      } else if (
        currentPhase === 'DAY_VOTING' ||
        currentPhase === 'DAY_CENTRAL_ASSEMBLY' ||
        currentPhase === 'DAY_REGIONAL_CAUCUS'
      ) {
        playDay();
        // If coming from night, automatically reveal morning newspaper
        if (prevPhase === 'NIGHT_BUFFER') {
          setIsNewspaperOpen(true);
        }
      }
    }
  }, [lobbyState.phase]);

  // Derived state for Newspaper, Investigations, and Winner Modal
  const fallbackNewspaper: MorningNewspaper = {
    publicDeaths: [],
    privateInvestigationResults: [],
    heresyClue: null,
    jitterAppliedMs: 4000,
  };
  const activeNewspaper = lobbyState.latestNewspaper || fallbackNewspaper;

  const playerNames: Record<string, string> = Object.fromEntries(
    Object.values(lobbyState.players).map((p) => [p.userId, p.username])
  );
  const lastLynchedName = lobbyState.lastLynchedUserId
    ? lobbyState.players[lobbyState.lastLynchedUserId]?.username || lobbyState.lastLynchedUserId
    : null;
  const myPrivateInvestigations = lobbyState.privateInvestigations?.[currentUserId] || [];

  const isGameOver =
    lobbyState.phase === 'ENDED' ||
    Boolean(
      lobbyState.winnerResult?.kind && lobbyState.winnerResult.kind !== 'GAME_CONTINUES'
    );
  const winnerKind = lobbyState.winnerResult?.kind;
  const isTownVictory = winnerKind === 'TOWN_VICTORY';
  const isMafiaVictory =
    winnerKind === 'MAFIA_MAJORITY' || winnerKind === 'YAKUZA_MAJORITY';
  const winnerIds = lobbyState.winnerResult?.winnerPlayerIds || [];
  const winnerNames = winnerIds.map((id) => lobbyState.players[id]?.username || id);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 transition-colors duration-200">
      {/* ─── LOBBY HEADER BAR ───────────────────────────────────────── */}
      <div className="p-6 rounded-[24px] border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-200">
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
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant={copiedLink ? 'secondary' : 'outline'}
            size="sm"
            onClick={handleCopyLink}
            icon={copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <LinkIcon className="w-4 h-4" />}
          >
            {copiedLink ? 'Link Kopyalandı' : 'Dəvət Linkini Kopyala'}
          </Button>

          {/* Sound Toggle in Lobby */}
          <button
            type="button"
            onClick={() => {
              const next = toggleSound();
              setSoundMuted(next);
              if (!next) playCard();
            }}
            title={soundMuted ? 'Səsi Aç' : 'Səsi Bağla'}
            className={`p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
              soundMuted
                ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-400'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

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
                onClick={handleAddBot}
                icon={<Bot className="w-4 h-4" />}
              >
                +1 AI Bot
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleFillBots}
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
              onClick={() => {
                playDay();
                dispatchAction({ action: 'PROGRESS_PHASE' });
              }}
            >
              {lobbyState.phase === 'NIGHT_BUFFER' ? '🌅 Gecəni Bitir → Səhər' : '⚖️ Səsləri Hesabla'}
            </Button>
          )}
        </div>
      </div>

      {/* ─── GREEN TOAST FEEDBACK FOR COPIED LINK ───────────────────── */}
      {copiedLink && (
        <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 text-sm font-bold flex items-center justify-between shadow-lg shadow-emerald-500/10 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 stroke-[3]" />
            </span>
            <span>
              <strong>Dəvət Linki Panoya Kopyalandı!</strong> Dostlarınıza göndərin — daxil olduqda dərhal bu masada görünəcəklər.
            </span>
          </div>
          <span className="text-xs bg-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
            URL Hazırdır
          </span>
        </div>
      )}

      {/* ─── 1. LOBBY PHASE ─────────────────────────────────────────── */}
      {isLobbyPhase ? (
        <div className="flex flex-col gap-6">
          {/* Table Configuration & Rules Summary Card */}
          <div className="p-5 sm:p-6 rounded-[24px] border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-red-500" />
                <h3 className="font-extrabold text-sm sm:text-base text-zinc-950 dark:text-white">
                  Masa Konfiqurasiyası və Qaydalar Xülasəsi
                </h3>
              </div>
              <Badge tone="purple">{currentPack?.minTier || 'TIER_1'}</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Oyun Rejimi
                </span>
                <span className="font-extrabold text-zinc-900 dark:text-zinc-100 text-sm">
                  {currentPack?.name || lobbyState.mode.replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                  {currentPack?.isMinigame ? 'Xüsusi Mini-oyun Formatı' : 'Klassik Sosial Deduksiya'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Oyunçu Limiti
                </span>
                <span className="font-extrabold text-zinc-900 dark:text-zinc-100 text-sm">
                  {currentPack?.minPlayers ?? 5} - {currentPack?.maxPlayers ?? 7} İştirakçı
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                  Hazırda: <strong>{totalPlayersCount} oyunçu</strong> qoşulub
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Fazaların Müddəti
                </span>
                <span className="font-extrabold text-zinc-900 dark:text-zinc-100 text-sm">
                  Gündüz: {currentPack?.defaultTimings.dayCentralAssemblySeconds ?? 180}s | Gecə: {currentPack?.defaultTimings.nightBufferSeconds ?? 45}s
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                  Səsvermə: {currentPack?.defaultTimings.dayVotingSeconds ?? 60}s
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Mühafizə & Audio
                </span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  Anti-AFK Gemini 3.8
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mt-0.5">
                  WebRTC P2P Canlı Səsli Rabitə
                </span>
              </div>
            </div>

            {currentPack?.roleBreakdown && (
              <div className="p-3.5 rounded-xl bg-red-500/10 dark:bg-red-950/30 border border-red-500/25 flex items-start gap-2.5 text-xs text-red-900 dark:text-red-200">
                <Sparkles className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-black text-red-600 dark:text-red-400 uppercase tracking-wide">
                    Bu Masanın Rol Bölgüsü:
                  </strong>
                  <p className="mt-0.5 font-medium leading-relaxed">
                    {currentPack.roleBreakdown}
                  </p>
                </div>
              </div>
            )}
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
          <div className="p-6 rounded-[24px] border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
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
          {/* Secret Role Card with Radiant Glow */}
          <div className="p-5 rounded-2xl border border-purple-500/40 bg-gradient-to-r from-purple-500/15 via-purple-600/10 to-purple-500/15 shadow-[0_0_25px_rgba(147,51,234,0.25)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 to-fuchsia-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-purple-500/30">
                🎭
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-purple-700 dark:text-purple-300 uppercase tracking-widest block">
                  Sizin Gizli Şəxsi Rolunuz
                </span>
                <div className="text-xl font-black text-zinc-950 dark:text-white tracking-tight">
                  {lobbyState.players[currentUserId]?.displayRole.formatted ?? `${currentUsername} (Vətəndaş)`}
                </div>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-600 text-white shadow-md shadow-purple-600/30">
              MƏXFİ
            </span>
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
            newspaper={activeNewspaper}
            roundNumber={lobbyState.roundNumber}
            minigameSubStates={lobbyState.minigameSubStates}
            lastLynchedPlayerName={lastLynchedName}
            playerNames={playerNames}
            privateInvestigations={myPrivateInvestigations}
            onClose={() => setIsNewspaperOpen(false)}
          />
        </div>
      )}

      {/* ─── GAME OVER / VICTORY MODAL ───────────────────────────────── */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-purple-500/40 bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 flex items-center justify-center text-4xl shadow-xl shadow-purple-500/30">
              {isTownVictory ? '🏆' : isMafiaVictory ? '🕶️' : '💀'}
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
                Oyun Nəticəsi
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mt-1">
                {isTownVictory
                  ? 'Şəhər (Dinc Vətəndaşlar) Qalib Gəldi!'
                  : isMafiaVictory
                  ? 'Mafiya Şəhəri Ələ Keçirdi!'
                  : 'Oyun Başa Çatdı!'}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 max-w-sm">
                {lobbyState.winnerResult?.reason ||
                  'Bütün rəqiblər aradan qaldırıldı və qələbə şərti tam təmin olundu.'}
              </p>
            </div>

            {/* Winners list if available */}
            {winnerNames.length > 0 && (
              <div className="w-full p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left">
                <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Qalib Heyət:
                </div>
                <div className="flex flex-wrap gap-2">
                  {winnerNames.map((name, i) => (
                    <Badge key={i} tone="purple">
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 w-full mt-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => {
                  playCard();
                  dispatchAction({ action: 'RESTART_GAME' });
                }}
                icon={<RotateCcw className="w-4 h-4" />}
              >
                Yenidən Başla (Lobbiyə Qayıt)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── FLOATING TOAST NOTIFICATION ─────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-md transition-all animate-bounceIn max-w-md ${
            toast.tone === 'success'
              ? 'border-emerald-500/40 bg-emerald-950/95 text-emerald-100 shadow-emerald-500/20'
              : toast.tone === 'warning'
              ? 'border-amber-500/40 bg-amber-950/95 text-amber-100 shadow-amber-500/20'
              : toast.tone === 'danger'
              ? 'border-red-500/40 bg-red-950/95 text-red-100 shadow-red-500/20'
              : 'border-purple-500/40 bg-purple-950/95 text-purple-100 shadow-purple-500/20'
          }`}
        >
          <span className="text-base shrink-0">
            {toast.tone === 'success'
              ? '✅'
              : toast.tone === 'warning'
              ? '⚠️'
              : toast.tone === 'danger'
              ? '⛔'
              : 'ℹ️'}
          </span>
          <span className="text-xs sm:text-sm font-semibold leading-snug">
            {toast.message}
          </span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-auto p-1 text-xs opacity-70 hover:opacity-100 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
