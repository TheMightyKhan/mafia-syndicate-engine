/**
 * Typed Socket Event Definitions & Payloads
 * Enterprise Mafia / Social Deduction Platform - Phase 1 + Phase 2
 */

import { AdminRole, WaiverRecord } from '@/types/access';
import { GamePhase, LobbyState, NightActionPriority, NightActionType, PlayerSession } from '@/types/game';
import {
  InvestigationResult,
  LynchOutcome,
  MorningNewspaper,
  ScrubbedLobbyView,
  VoteTally,
  WinConditionResult,
} from '@/types/engine';
import { AllInDistrict } from '@/types/roles';

// === CLIENT TO SERVER EVENT PAYLOADS ===

export interface JoinLobbyPayload {
  readonly lobbyId: string;
  readonly player: PlayerSession;
}

export interface LeaveLobbyPayload {
  readonly lobbyId: string;
  readonly userId: string;
}

export interface CastVotePayload {
  readonly lobbyId: string;
  readonly voterUserId: string;
  readonly candidateUserId: string;
}

export interface SubmitNightActionPayload {
  readonly lobbyId: string;
  readonly actorPlayerId: string;
  readonly targetPlayerId: string;
  readonly actionType: NightActionType;
  readonly priority: NightActionPriority;
}

export interface RequestAdminDualUnlockPayload {
  readonly lobbyId: string;
  readonly adminUserId: string;
  readonly adminRole: 'THE_ARCHITECT' | 'THE_BAILIFF';
}

export interface GrantWaiverPayload {
  readonly lobbyId: string;
  readonly record: WaiverRecord;
}

export interface SetHostReadyPayload {
  readonly lobbyId: string;
  readonly hostUserId: string;
  readonly ready: boolean;
}

export interface ClientToServerEvents {
  JOIN_LOBBY: (payload: JoinLobbyPayload) => void;
  LEAVE_LOBBY: (payload: LeaveLobbyPayload) => void;
  CAST_VOTE: (payload: CastVotePayload) => void;
  SUBMIT_NIGHT_ACTION: (payload: SubmitNightActionPayload) => void;
  REQUEST_ADMIN_DUAL_UNLOCK: (payload: RequestAdminDualUnlockPayload) => void;
  GRANT_WAIVER: (payload: GrantWaiverPayload) => void;
  SET_HOST_READY: (payload: SetHostReadyPayload) => void;
}

// === SERVER TO CLIENT EVENT PAYLOADS ===

export interface LobbyStateSyncPayload {
  readonly lobby: LobbyState;
}

export interface PhaseTransitionPayload {
  readonly lobbyId: string;
  readonly fromPhase: GamePhase;
  readonly toPhase: GamePhase;
  readonly durationSeconds: number;
  readonly roundNumber: number;
}

export interface AdminUnlockStateChangedPayload {
  readonly lobbyId: string;
  readonly architectUnlocked: boolean;
  readonly bailiffUnlocked: boolean;
  readonly dualLockVerified: boolean;
  readonly updatedByUserId: string;
  readonly role: AdminRole;
}

export interface NightActionBufferedPayload {
  readonly lobbyId: string;
  readonly queueCount: number;
  readonly actorPlayerId: string;
}

export interface ErrorNotificationPayload {
  readonly code: string;
  readonly message: string;
  readonly context?: string;
}

export interface ServerToClientEvents {
  // Phase 1 events
  LOBBY_STATE_SYNC: (payload: LobbyStateSyncPayload) => void;
  PHASE_TRANSITION: (payload: PhaseTransitionPayload) => void;
  ADMIN_UNLOCK_STATE_CHANGED: (payload: AdminUnlockStateChangedPayload) => void;
  NIGHT_ACTION_BUFFERED: (payload: NightActionBufferedPayload) => void;
  ERROR_NOTIFICATION: (payload: ErrorNotificationPayload) => void;
  PLAYER_JOINED: (payload: { lobbyId: string; player: PlayerSession }) => void;
  PLAYER_LEFT: (payload: { lobbyId: string; userId: string }) => void;
  // Phase 2 events
  SCRUBBED_LOBBY_VIEW: (payload: ScrubbedLobbyView) => void;
  MORNING_NEWSPAPER: (payload: MorningNewspaper) => void;
  PRIVATE_INVESTIGATION_RESULT: (payload: InvestigationResult) => void;
  VOTE_TALLY_UPDATE: (payload: VoteTallyUpdatePayload) => void;
  LYNCH_OUTCOME: (payload: LynchOutcomePayload) => void;
  WIN_CONDITION_REACHED: (payload: WinConditionResult) => void;
  DISTRICT_ROOM_ASSIGNED: (payload: DistrictRoomAssignedPayload) => void;
  FACTION_CHAT_MESSAGE: (payload: FactionChatPayload) => void;
}

// === PHASE 2 SERVER-TO-CLIENT PAYLOADS =====================================

export interface VoteTallyUpdatePayload {
  readonly lobbyId: string;
  readonly tallies: readonly VoteTally[];
  /** Null during Treachery blind phase — revealed at lock */
  readonly blindRevealPending: boolean;
}

export interface LynchOutcomePayload {
  readonly lobbyId: string;
  readonly outcome: LynchOutcome;
  /** Cleaned means role card is masked (CIRCLE_7_VIOLENCE) */
  readonly victimRoleRevealed: string | null;
}

export interface DistrictRoomAssignedPayload {
  readonly lobbyId: string;
  readonly district: AllInDistrict;
  /** Socket room name to join */
  readonly roomName: string;
}

export interface FactionChatPayload {
  readonly lobbyId: string;
  readonly senderUserId: string;
  readonly message: string;
  readonly faction: string;
  readonly timestamp: number;
}

