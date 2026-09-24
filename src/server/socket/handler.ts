/**
 * Socket Connection & Event Dispatcher
 * Enterprise Mafia / Social Deduction Platform - Phase 1 Foundation
 */

import {
  CastVotePayload,
  ClientToServerEvents,
  GrantWaiverPayload,
  JoinLobbyPayload,
  LeaveLobbyPayload,
  RequestAdminDualUnlockPayload,
  ServerToClientEvents,
  SubmitNightActionPayload,
} from './events';
import { redisStateAdapter } from '../state/redis';

export interface TypedSocket {
  readonly id: string;
  readonly userId?: string;
  emit<E extends keyof ServerToClientEvents>(event: E, ...args: Parameters<ServerToClientEvents[E]>): void;
  broadcastToRoom<E extends keyof ServerToClientEvents>(
    roomId: string,
    event: E,
    ...args: Parameters<ServerToClientEvents[E]>
  ): void;
  join(roomId: string): void;
  leave(roomId: string): void;
}

export class SocketLobbyDispatcher {
  /** Handle player joining a lobby */
  public async handleJoinLobby(socket: TypedSocket, payload: JoinLobbyPayload): Promise<void> {
    const result = await redisStateAdapter.joinPlayer(payload.lobbyId, payload.player);
    if (!result.success || !result.lobby) {
      socket.emit('ERROR_NOTIFICATION', {
        code: result.error ?? 'JOIN_FAILED',
        message: 'Could not join lobby session.',
        context: payload.lobbyId,
      });
      return;
    }

    socket.join(payload.lobbyId);
    socket.emit('LOBBY_STATE_SYNC', { lobby: result.lobby });
    socket.broadcastToRoom(payload.lobbyId, 'PLAYER_JOINED', {
      lobbyId: payload.lobbyId,
      player: payload.player,
    });
  }

  /** Handle player leaving a lobby */
  public async handleLeaveLobby(socket: TypedSocket, payload: LeaveLobbyPayload): Promise<void> {
    socket.leave(payload.lobbyId);
    socket.broadcastToRoom(payload.lobbyId, 'PLAYER_LEFT', {
      lobbyId: payload.lobbyId,
      userId: payload.userId,
    });
  }

  /** Handle strict Dual-Lock unlock request for platform admins */
  public async handleAdminDualUnlock(
    socket: TypedSocket,
    payload: RequestAdminDualUnlockPayload
  ): Promise<void> {
    const result = await redisStateAdapter.submitAdminUnlock(
      payload.lobbyId,
      payload.adminUserId,
      payload.adminRole
    );

    if (!result.success || !result.lobby) {
      socket.emit('ERROR_NOTIFICATION', {
        code: result.error ?? 'UNLOCK_FAILED',
        message: 'Platform admin dual-lock authorization failed.',
        context: payload.lobbyId,
      });
      return;
    }

    socket.broadcastToRoom(payload.lobbyId, 'ADMIN_UNLOCK_STATE_CHANGED', {
      lobbyId: payload.lobbyId,
      architectUnlocked: result.lobby.adminMasterUnlock.architectUnlocked,
      bailiffUnlocked: result.lobby.adminMasterUnlock.bailiffUnlocked,
      dualLockVerified: result.dualLockVerified,
      updatedByUserId: payload.adminUserId,
      role: payload.adminRole,
    });

    socket.broadcastToRoom(payload.lobbyId, 'LOBBY_STATE_SYNC', { lobby: result.lobby });
  }

  /** Handle waiver grant */
  public async handleGrantWaiver(socket: TypedSocket, payload: GrantWaiverPayload): Promise<void> {
    const success = await redisStateAdapter.recordWaiver(payload.lobbyId, payload.record);
    if (!success) {
      socket.emit('ERROR_NOTIFICATION', {
        code: 'WAIVER_RECORD_FAILED',
        message: 'Failed to record waiver in lobby state.',
        context: payload.lobbyId,
      });
      return;
    }

    const updatedLobby = await redisStateAdapter.getLobby(payload.lobbyId);
    if (updatedLobby) {
      socket.broadcastToRoom(payload.lobbyId, 'LOBBY_STATE_SYNC', { lobby: updatedLobby });
    }
  }

  /** Handle night action submission into jittered buffer */
  public async handleSubmitNightAction(
    socket: TypedSocket,
    payload: SubmitNightActionPayload
  ): Promise<void> {
    const result = await redisStateAdapter.bufferNightAction(payload.lobbyId, {
      actorPlayerId: payload.actorPlayerId,
      targetPlayerId: payload.targetPlayerId,
      actionType: payload.actionType,
      priority: payload.priority,
      timestamp: Date.now(),
    });

    if (!result.success) {
      socket.emit('ERROR_NOTIFICATION', {
        code: 'NIGHT_ACTION_REJECTED',
        message: 'Action rejected by server buffer.',
        context: payload.lobbyId,
      });
      return;
    }

    socket.emit('NIGHT_ACTION_BUFFERED', {
      lobbyId: payload.lobbyId,
      queueCount: result.queueLength,
      actorPlayerId: payload.actorPlayerId,
    });
  }

  /** Register typed event handlers onto socket */
  public registerSocketHandlers(
    socket: TypedSocket,
    bindListener: <E extends keyof ClientToServerEvents>(event: E, handler: ClientToServerEvents[E]) => void
  ): void {
    bindListener('JOIN_LOBBY', (payload) => void this.handleJoinLobby(socket, payload));
    bindListener('LEAVE_LOBBY', (payload) => void this.handleLeaveLobby(socket, payload));
    bindListener('REQUEST_ADMIN_DUAL_UNLOCK', (payload) => void this.handleAdminDualUnlock(socket, payload));
    bindListener('GRANT_WAIVER', (payload) => void this.handleGrantWaiver(socket, payload));
    bindListener('SUBMIT_NIGHT_ACTION', (payload) => void this.handleSubmitNightAction(socket, payload));
  }
}

export const socketLobbyDispatcher = new SocketLobbyDispatcher();
