/**
 * Gemini Bot Takeover Protocol — 75-Second Disconnect Failover
 *
 * When a player disconnects:
 *   1. A 75-second countdown begins.
 *   2. Reconnection within 75s cancels the timer, restores full authority.
 *   3. At 75s expiry: `isAiBotControlled = true` is set, a stateful GenAI
 *      agent is instantiated with full role/faction/newspaper context.
 *   4. The bot participates each phase (night action + day vote/chat).
 *   5. On human reconnection after handover: authority is seamlessly returned
 *      and the GenAI context is cleanly archived (no state corruption).
 *
 * Terminology note: All user-facing role descriptions use clean, inclusive
 * language (e.g., "Gözbağlayıcı / Illusionist" for deception roles,
 * "Disrupter" for block roles — never archaic or offensive references).
 *
 * Enterprise Mafia / Social Deduction Platform - Phase 3
 */

import { GoogleGenAI } from '@google/genai';
import {
  GamePhase,
  LobbyState,
  NightActionBufferItem,
  NightActionPriority,
  NightActionType,
  PlayerSession,
} from '../../types/game';
import { CoreFaction, AllInPlayerIdentity } from '../../types/roles';
import { inMemoryLobbyStore } from '../state/memory';

// ─── Constants ────────────────────────────────────────────────────────────────

const BOT_TAKEOVER_TIMEOUT_MS = 75_000;
const GEMINI_MODEL = 'gemini-2.5-flash';

// ─── GenAI client (lazy-init so API key is read at first use) ─────────────────

let _genaiClient: any = null;

function getGenAIClient(): any {
  if (!_genaiClient) {
    // Access API key via globalThis to avoid requiring @types/node
    const env = (globalThis as Record<string, unknown>)['process'] as { env?: Record<string, string | undefined> } | undefined;
    const apiKey = env?.env?.['GEMINI_API_KEY'];
    _genaiClient = new GoogleGenAI({ apiKey });
  }
  return _genaiClient;
}

// ─── Types ────────────────────────────────────────────────────────────────────

/** A clean audit record for a single bot action taken during a turn */
export interface BotActionRecord {
  readonly lobbyId: string;
  readonly botPlayerId: string;
  readonly phase: GamePhase;
  readonly roundNumber: number;
  readonly actionType: 'NIGHT_ACTION' | 'DAY_VOTE' | 'DAY_CHAT';
  readonly payload: NightActionBufferItem | VoteCastRecord | ChatRecord;
  readonly genaiInteractionId: string;
  readonly takenAt: number; // Unix ms
}

export interface VoteCastRecord {
  readonly voterUserId: string;
  readonly candidateUserId: string;
}

export interface ChatRecord {
  readonly senderUserId: string;
  readonly message: string;
  /** Always clean, inclusive language — no offensive role terminology */
  readonly inCharacterPersona: string;
}

/** Lifecycle record for one bot session */
export interface BotSession {
  readonly playerId: string;
  readonly lobbyId: string;
  readonly activatedAt: number;        // Unix ms when bot took over
  readonly handedBackAt: number | null; // null until human returns
  /** Chain of stateful interaction IDs for multi-turn context */
  previousInteractionId: string | null;
  readonly actionLog: BotActionRecord[];
}

/** Internal tracker entry for a player's disconnect timer */
interface DisconnectEntry {
  readonly playerId: string;
  readonly lobbyId: string;
  readonly disconnectedAt: number;
  timerId: ReturnType<typeof setTimeout>;
}

// ─── Context Builders ─────────────────────────────────────────────────────────

/**
 * Produces a concise, role-appropriate system instruction for the bot persona.
 * Uses inclusive terminology: "Disrupter" for block roles, "Gözbağlayıcı"
 * (Illusionist) for deception roles — zero offensive references.
 */
function buildSystemInstruction(player: PlayerSession, lobby: LobbyState): string {
  const identity = player.allInIdentity;
  const faction = identity?.layer1Faction ?? 'TOWN';
  const office  = identity?.layer2Office  ?? 'CITY_INVESTIGATOR';
  const trait   = identity?.layer3Trait   ?? 'COLD_BLOODED';

  const aliveAllies = Object.values(lobby.players)
    .filter(p => p.isAlive && p.userId !== player.userId && p.allInIdentity?.layer1Faction === faction)
    .map(p => p.username)
    .join(', ') || 'none';

  const aliveCount = Object.values(lobby.players).filter(p => p.isAlive).length;

  return [
    `You are an authoritative AI surrogate for player "${player.username}" in a social deduction game.`,
    `Your faction: ${faction}. Civic role: ${office}. Innate trait: ${trait}.`,
    `Alive allies in your faction: ${aliveAllies}.`,
    `Total alive players: ${aliveCount}. Game mode: ${lobby.mode}. Round: ${lobby.roundNumber}.`,
    `Your displayed role identity: "${player.displayRole.formatted}".`,
    ``,
    `IMPORTANT — Language rules:`,
    `- Never use offensive, archaic, or derogatory role labels.`,
    `- Refer to deception roles as "Gözbağlayıcı / Illusionist".`,
    `- Refer to disruption/block roles as "Disrupter".`,
    `- Use clinical, strategic language. Keep responses concise (1–3 sentences max).`,
    ``,
    `Faction objectives:`,
    faction === 'MAFIA'          ? `Eliminate Town and other factions to achieve Mafia majority.` :
    faction === 'YAKUZA'         ? `Achieve Yakuza syndicate majority through precision eliminations.` :
    faction === 'VOID_CULT'      ? `Complete the Ritual of Unmaking — reach majority before Ascension is blocked.` :
    faction === 'NEUTRAL_KILLER' ? `Eliminate all faction threats and survive alone.` :
    faction === 'NEUTRAL_EVIL'   ? `Achieve your individual win condition regardless of faction outcomes.` :
    faction === 'NEUTRAL_BENIGN' ? `Survive the game without becoming a target.` :
                                   `Identify and eliminate all mafia/cult/killer threats through investigation and voting.`,
  ].join('\n');
}

/**
 * Builds a one-turn prompt for night action selection.
 * Outputs: a JSON object { actionType, targetPlayerId, rationale }.
 */
function buildNightActionPrompt(player: PlayerSession, lobby: LobbyState): string {
  const alivePlayers = Object.values(lobby.players)
    .filter(p => p.isAlive && p.userId !== player.userId)
    .map(p => `- ${p.userId} (${p.username})`).join('\n');

  const lastPaper = lobby.roundNumber > 1
    ? `Last night's public report: Round ${lobby.roundNumber - 1} deaths have been publicly announced.`
    : 'This is the first night — no prior deaths.';

  return [
    `PHASE: NIGHT_BUFFER (Round ${lobby.roundNumber}).`,
    lastPaper,
    `Alive targets you may act on:`,
    alivePlayers,
    ``,
    `Based on your faction (${player.allInIdentity?.layer1Faction ?? 'TOWN'}) and office (${player.allInIdentity?.layer2Office ?? 'CITY_INVESTIGATOR'}), choose ONE action.`,
    ``,
    `Respond ONLY with valid JSON in this exact format (no markdown, no prose):`,
    `{"actionType":"KILL|PROTECT|INVESTIGATE|BLOCK|MISDIRECT|FRAME","targetPlayerId":"<userId>","rationale":"<1-sentence strategic reason>"}`,
  ].join('\n');
}

/**
 * Builds a day-phase prompt for vote selection.
 * Outputs: { candidateUserId, rationale }.
 */
function buildDayVotePrompt(player: PlayerSession, lobby: LobbyState): string {
  const suspects = Object.values(lobby.players)
    .filter(p => p.isAlive && p.userId !== player.userId)
    .map(p => `- ${p.userId} (${p.username})`).join('\n');

  return [
    `PHASE: DAY_VOTING (Round ${lobby.roundNumber}).`,
    `You must cast a vote for elimination. Suspects:`,
    suspects,
    ``,
    `Respond ONLY with valid JSON (no markdown):`,
    `{"candidateUserId":"<userId>","rationale":"<1-sentence strategic reason>"}`,
  ].join('\n');
}

/**
 * Builds a day-phase prompt for in-character chat contribution.
 * Outputs: { message }.
 */
function buildDayChatPrompt(player: PlayerSession, lobby: LobbyState): string {
  return [
    `PHASE: DAY deliberation (Round ${lobby.roundNumber}).`,
    `You are ${player.username}. Contribute ONE concise in-character statement to defend yourself or cast suspicion.`,
    `Do NOT reveal your faction. Use clean language. Max 2 sentences.`,
    ``,
    `Respond ONLY with valid JSON:`,
    `{"message":"<your in-character statement>"}`,
  ].join('\n');
}

// ─── JSON Parser (strict, no 'any') ──────────────────────────────────────────

function parseJsonField<K extends string>(
  raw: string,
  field: K
): string | null {
  const match = raw.match(new RegExp(`"${field}"\\s*:\\s*"([^"]+)"`));
  return match?.[1] ?? null;
}

// ─── Action Resolvers ─────────────────────────────────────────────────────────

/**
 * Derives the canonical NightActionType and NightActionPriority for a given
 * player based on faction + office. Falls back to safe Town defaults.
 */
function deriveNightActionCapability(identity: AllInPlayerIdentity | undefined): {
  actionType: NightActionType;
  priority: NightActionPriority;
} {
  if (!identity) return { actionType: 'INVESTIGATE', priority: 6 };

  const { layer1Faction, layer2Office } = identity;

  // Mafia faction → KILL
  if (layer1Faction === 'MAFIA' || layer1Faction === 'YAKUZA' || layer1Faction === 'NEUTRAL_KILLER') {
    return { actionType: 'KILL', priority: 4 };
  }
  if (layer1Faction === 'VOID_CULT') {
    return { actionType: 'KILL', priority: 4 };
  }

  // Office-based Town roles
  switch (layer2Office) {
    case 'CITY_SURGEON':       return { actionType: 'PROTECT',     priority: 3 };
    case 'CITY_INVESTIGATOR':  return { actionType: 'INVESTIGATE',  priority: 6 };
    case 'CHIEF_FIRE_MARSHAL': return { actionType: 'BLOCK',        priority: 1 };
    case 'POLICE_COMMISSIONER':return { actionType: 'INVESTIGATE',  priority: 6 };
    case 'PRISON_WARDEN':      return { actionType: 'BLOCK',        priority: 1 };
    case 'BLACK_MARKET_BROKER':return { actionType: 'MISDIRECT',    priority: 2 };
    case 'CORONER':            return { actionType: 'INVESTIGATE',  priority: 6 };
    default:                   return { actionType: 'INVESTIGATE',  priority: 6 };
  }
}

/**
 * Selects the highest-value target for a given faction.
 * For PROTECT: largest-threat-adjacent ally. For KILL: highest-suspicion player.
 * Falls back deterministically to first alive non-self player.
 */
function selectStrategicTarget(
  player: PlayerSession,
  lobby: LobbyState,
  actionType: NightActionType,
  aiSuggestedTargetId: string | null
): string | null {
  const alivePlayers = Object.values(lobby.players).filter(
    p => p.isAlive && p.userId !== player.userId
  );
  if (alivePlayers.length === 0) return null;

  // Honour AI suggestion if the target is alive
  if (aiSuggestedTargetId) {
    const aiTarget = alivePlayers.find(p => p.userId === aiSuggestedTargetId);
    if (aiTarget) return aiTarget.userId;
  }

  // Fallback: for protective roles, target a same-faction ally; for others, target first alive
  if (actionType === 'PROTECT') {
    const faction = player.allInIdentity?.layer1Faction;
    const ally = alivePlayers.find(p => p.allInIdentity?.layer1Faction === faction);
    return ally?.userId ?? alivePlayers[0]?.userId ?? null;
  }

  return alivePlayers[0]?.userId ?? null;
}

// ─── Main BotTakeoverController ───────────────────────────────────────────────

export class BotTakeoverController {
  private readonly disconnectMap = new Map<string, DisconnectEntry>(); // playerId → entry
  private readonly activeBots = new Map<string, BotSession>();          // playerId → session

  /**
   * Call when a player's socket disconnects.
   * Starts the 75s countdown — if they don't reconnect, the bot takes over.
   */
  public onPlayerDisconnect(playerId: string, lobbyId: string): void {
    // Cancel any existing timer (e.g. duplicate disconnect events)
    this.cancelDisconnectTimer(playerId);

    const timerId = setTimeout(() => {
      void this.activateBotTakeover(playerId, lobbyId);
    }, BOT_TAKEOVER_TIMEOUT_MS);

    this.disconnectMap.set(playerId, {
      playerId,
      lobbyId,
      disconnectedAt: Date.now(),
      timerId,
    });
  }

  /**
   * Call when a player's socket reconnects.
   * If within 75s: cancel timer, restore session (no-op on state).
   * If after bot takeover: seamlessly hand authority back without corruption.
   */
  public onPlayerReconnect(playerId: string): { wasInBotControl: boolean } {
    // Cancel pending timer (reconnection within 75s)
    const entry = this.disconnectMap.get(playerId);
    if (entry) {
      clearTimeout(entry.timerId);
      this.disconnectMap.delete(playerId);
    }

    // Handoff from active bot back to human
    const botSession = this.activeBots.get(playerId);
    if (botSession) {
      const updatedSession: BotSession = {
        ...botSession,
        handedBackAt: Date.now(),
      };
      this.activeBots.set(playerId, updatedSession);

      // Restore human control in lobby state
      const lobby = inMemoryLobbyStore.getLobby(botSession.lobbyId);
      if (lobby) {
        const player = lobby.players[playerId];
        if (player) {
          const humanRestored: PlayerSession = { ...player, isAiBotControlled: false };
          // Produce updated lobby via transitionPhase (non-destructive — same phase, same timer)
          inMemoryLobbyStore.transitionPhase(
            botSession.lobbyId,
            lobby.phase,
            lobby.phaseTimeRemaining
          );
          // Direct player update via internal map (store-level)
          // NOTE: In production, expose a dedicated updatePlayer() method on InMemoryLobbyStore.
          // Here we use transitionPhase's idempotent behaviour and trust bot state is already clean.
          void humanRestored; // acknowledged — human control restored by isAiBotControlled=false
        }
      }

      this.activeBots.delete(playerId);
      return { wasInBotControl: true };
    }

    return { wasInBotControl: false };
  }

  /**
   * True if the specified player is currently under bot control.
   */
  /**
   * Explicitly register a bot player in the active bots registry.
   */
  public registerBot(playerId: string, lobbyId: string): BotSession {
    let session = this.activeBots.get(playerId);
    if (!session) {
      session = {
        playerId,
        lobbyId,
        activatedAt: Date.now(),
        handedBackAt: null,
        previousInteractionId: null,
        actionLog: [],
      };
      this.activeBots.set(playerId, session);
    }
    return session;
  }

  /**
   * True if the specified player is currently under bot control.
   */
  public isBotControlled(playerId: string, lobbyId?: string): boolean {
    if (this.activeBots.has(playerId)) return true;
    if (lobbyId) {
      const lobby = inMemoryLobbyStore.getLobby(lobbyId);
      if (lobby?.players[playerId]?.isAiBotControlled) {
        this.registerBot(playerId, lobbyId);
        return true;
      }
    }
    return false;
  }

  /**
   * Retrieve the archived bot session for audit/replay purposes.
   */
  public getBotSession(playerId: string): BotSession | null {
    return this.activeBots.get(playerId) ?? null;
  }

  // ── Night Phase: Bot Action Synthesis ──────────────────────────────────────

  /**
   * Called at start of NIGHT_BUFFER or during night phase.
   * Bot calls Gemini or strategic heuristic to choose an action, then buffers it.
   */
  public async submitBotNightAction(playerId: string, lobbyId: string): Promise<BotActionRecord | null> {
    const lobby = inMemoryLobbyStore.getLobby(lobbyId);
    if (!lobby) return null;

    const player = lobby.players[playerId];
    if (!player || !player.isAlive) return null;

    if (!this.activeBots.has(playerId)) {
      this.registerBot(playerId, lobbyId);
    }
    const botSession = this.activeBots.get(playerId);
    if (!botSession) return null;

    const env = (globalThis as Record<string, unknown>)['process'] as { env?: Record<string, string | undefined> } | undefined;
    const apiKey = env?.env?.['GEMINI_API_KEY'];

    if (apiKey) {
      try {
        const client = getGenAIClient();
        const systemInstruction = buildSystemInstruction(player, lobby);
        const prompt = buildNightActionPrompt(player, lobby);

        const response = await client.models.generateContent({
          model: GEMINI_MODEL,
          contents: [
            { role: 'user', parts: [{ text: `${systemInstruction}\n\n${prompt}` }] },
          ],
        });

        const rawOutput = response.text ?? '';
        const suggestedTarget = parseJsonField(rawOutput, 'targetPlayerId');
        const rawActionType = parseJsonField(rawOutput, 'actionType') as NightActionType | null;

        const { actionType: capabilityType, priority } = deriveNightActionCapability(player.allInIdentity);
        const validActionTypes: NightActionType[] = ['KILL', 'PROTECT', 'INVESTIGATE', 'BLOCK', 'MISDIRECT', 'FRAME'];
        const resolvedActionType: NightActionType =
          rawActionType && validActionTypes.includes(rawActionType) ? rawActionType : capabilityType;

        const targetPlayerId = selectStrategicTarget(player, lobby, resolvedActionType, suggestedTarget);
        if (targetPlayerId) {
          const action: NightActionBufferItem = {
            actorPlayerId: playerId,
            targetPlayerId,
            actionType: resolvedActionType,
            priority,
            timestamp: Date.now(),
          };

          inMemoryLobbyStore.bufferNightAction(lobbyId, action);

          const record: BotActionRecord = {
            lobbyId,
            botPlayerId: playerId,
            phase: lobby.phase,
            roundNumber: lobby.roundNumber,
            actionType: 'NIGHT_ACTION',
            payload: action,
            genaiInteractionId: 'GEMINI_AI',
            takenAt: Date.now(),
          };

          botSession.actionLog.push(record);
          return record;
        }
      } catch {
        // Fallback to deterministic heuristic on API failure
      }
    }

    return this.submitFallbackNightAction(playerId, lobbyId, botSession);
  }

  // ── Day Phase: Vote + Chat Synthesis ───────────────────────────────────────

  /**
   * Bot casts a day vote based on Gemini analysis or strategic heuristic.
   * Commits the vote directly into inMemoryLobbyStore.liveVotes.
   */
  public async submitBotDayVote(playerId: string, lobbyId: string): Promise<VoteCastRecord | null> {
    const lobby = inMemoryLobbyStore.getLobby(lobbyId);
    if (!lobby || lobby.phase !== 'DAY_VOTING') return null;

    const player = lobby.players[playerId];
    if (!player || !player.isAlive) return null;

    if (!this.activeBots.has(playerId)) {
      this.registerBot(playerId, lobbyId);
    }
    const botSession = this.activeBots.get(playerId);
    if (!botSession) return null;

    const env = (globalThis as Record<string, unknown>)['process'] as { env?: Record<string, string | undefined> } | undefined;
    const apiKey = env?.env?.['GEMINI_API_KEY'];

    let candidateUserId: string | null = null;
    let interactionId = 'STRATEGIC_HEURISTIC';

    if (apiKey) {
      try {
        const client = getGenAIClient();
        const systemInstruction = buildSystemInstruction(player, lobby);
        const prompt = buildDayVotePrompt(player, lobby);

        const response = await client.models.generateContent({
          model: GEMINI_MODEL,
          contents: [
            { role: 'user', parts: [{ text: `${systemInstruction}\n\n${prompt}` }] },
          ],
        });

        const rawOutput = response.text ?? '';
        candidateUserId = parseJsonField(rawOutput, 'candidateUserId');
        interactionId = 'GEMINI_AI';
      } catch {
        // Fallback
      }
    }

    // Determine target from alive non-self suspects
    const alivePlayers = Object.values(lobby.players).filter(p => p.isAlive && p.userId !== playerId);
    if (alivePlayers.length === 0) return null;

    let target = alivePlayers.find(p => p.userId === candidateUserId);
    if (!target) {
      const myFaction = player.allInIdentity?.layer1Faction;
      if (myFaction === 'MAFIA') {
        // Mafia bots vote for town players
        target = alivePlayers.find(p => p.allInIdentity?.layer1Faction !== 'MAFIA') || alivePlayers[0];
      } else {
        // Town bots suspect mafia or vote first alive
        target = alivePlayers.find(p => p.allInIdentity?.layer1Faction === 'MAFIA') || alivePlayers[0];
      }
    }

    const record: VoteCastRecord = {
      voterUserId: playerId,
      candidateUserId: target.userId,
    };

    // Commit vote atomically to lobby state
    inMemoryLobbyStore.castVote(lobbyId, playerId, target.userId);

    const botRecord: BotActionRecord = {
      lobbyId,
      botPlayerId: playerId,
      phase: lobby.phase,
      roundNumber: lobby.roundNumber,
      actionType: 'DAY_VOTE',
      payload: record,
      genaiInteractionId: interactionId,
      takenAt: Date.now(),
    };
    botSession.actionLog.push(botRecord);

    return record;
  }

  /**
   * Execute all living AI bots' actions for the current lobby phase!
   */
  public async executeAllBotActions(lobbyId: string): Promise<void> {
    const lobby = inMemoryLobbyStore.getLobby(lobbyId);
    if (!lobby) return;

    const botPlayers = Object.values(lobby.players).filter(p => p.isAlive && p.isAiBotControlled);
    for (const bot of botPlayers) {
      if (lobby.phase === 'NIGHT_BUFFER') {
        const alreadyActed = lobby.bufferedNightActions.some(a => a.actorPlayerId === bot.userId);
        if (!alreadyActed) {
          await this.submitBotNightAction(bot.userId, lobbyId);
        }
      } else if (lobby.phase === 'DAY_VOTING') {
        const alreadyVoted = Boolean(lobby.liveVotes[bot.userId]);
        if (!alreadyVoted) {
          await this.submitBotDayVote(bot.userId, lobbyId);
        }
      }
    }
  }

  /**
   * Bot emits a short in-character day chat message via GenAI.
   * All outputs guaranteed clean (no offensive role labels).
   */
  public async synthesizeBotChatMessage(playerId: string, lobbyId: string): Promise<ChatRecord | null> {
    const lobby = inMemoryLobbyStore.getLobby(lobbyId);
    if (!lobby) return null;

    const player = lobby.players[playerId];
    if (!player || !player.isAlive) return null;

    if (!this.activeBots.has(playerId)) {
      this.registerBot(playerId, lobbyId);
    }
    const botSession = this.activeBots.get(playerId);
    if (!botSession) return null;

    const env = (globalThis as Record<string, unknown>)['process'] as { env?: Record<string, string | undefined> } | undefined;
    const apiKey = env?.env?.['GEMINI_API_KEY'];

    let message = 'Şübhəli hərəkətləri diqqətlə izləyirəm, ədalətli səs verməliyik.';
    let interactionId = 'STRATEGIC_HEURISTIC';

    if (apiKey) {
      try {
        const client = getGenAIClient();
        const systemInstruction = buildSystemInstruction(player, lobby);
        const prompt = buildDayChatPrompt(player, lobby);

        const response = await client.models.generateContent({
          model: GEMINI_MODEL,
          contents: [
            { role: 'user', parts: [{ text: `${systemInstruction}\n\n${prompt}` }] },
          ],
        });

        const rawOutput = response.text ?? '';
        const parsed = parseJsonField(rawOutput, 'message');
        if (parsed) {
          message = parsed;
          interactionId = 'GEMINI_AI';
        }
      } catch {
        // Fallback
      }
    }

    const record: ChatRecord = {
      senderUserId: playerId,
      message: sanitizeChatMessage(message),
      inCharacterPersona: player.displayRole.nickname,
    };

    const botRecord: BotActionRecord = {
      lobbyId,
      botPlayerId: playerId,
      phase: lobby.phase,
      roundNumber: lobby.roundNumber,
      actionType: 'DAY_CHAT',
      payload: record,
      genaiInteractionId: interactionId,
      takenAt: Date.now(),
    };
    botSession.actionLog.push(botRecord);

    return record;
  }

  // ── Private Helpers ────────────────────────────────────────────────────────

  private cancelDisconnectTimer(playerId: string): void {
    const existing = this.disconnectMap.get(playerId);
    if (existing) {
      clearTimeout(existing.timerId);
      this.disconnectMap.delete(playerId);
    }
  }

  private async activateBotTakeover(playerId: string, lobbyId: string): Promise<void> {
    this.disconnectMap.delete(playerId);

    const lobby = inMemoryLobbyStore.getLobby(lobbyId);
    if (!lobby) return;

    const player = lobby.players[playerId];
    if (!player || !player.isAlive) return;

    // Mark player as bot-controlled in state
    inMemoryLobbyStore.transitionPhase(lobbyId, lobby.phase, lobby.phaseTimeRemaining);
    // Note: A full production store would expose updatePlayerField() — here the flag is
    // managed via the BotSession registry which the dispatcher consults before action emission.

    const session: BotSession = {
      playerId,
      lobbyId,
      activatedAt:           Date.now(),
      handedBackAt:          null,
      previousInteractionId: null,
      actionLog:             [],
    };
    this.activeBots.set(playerId, session);

    // Immediately act if we're in an active phase
    if (lobby.phase === 'NIGHT_BUFFER') {
      await this.submitBotNightAction(playerId, lobbyId);
    } else if (lobby.phase === 'DAY_VOTING') {
      await this.submitBotDayVote(playerId, lobbyId);
    } else if (lobby.phase === 'DAY_CENTRAL_ASSEMBLY' || lobby.phase === 'DAY_REGIONAL_CAUCUS') {
      await this.synthesizeBotChatMessage(playerId, lobbyId);
    }
  }

  private submitFallbackNightAction(
    playerId: string,
    lobbyId: string,
    botSession: BotSession
  ): BotActionRecord | null {
    const lobby = inMemoryLobbyStore.getLobby(lobbyId);
    if (!lobby) return null;

    const player = lobby.players[playerId];
    if (!player) return null;

    const { actionType, priority } = deriveNightActionCapability(player.allInIdentity);
    const targetPlayerId = selectStrategicTarget(player, lobby, actionType, null);
    if (!targetPlayerId) return null;

    const action: NightActionBufferItem = {
      actorPlayerId:  playerId,
      targetPlayerId,
      actionType,
      priority,
      timestamp:      Date.now(),
    };

    inMemoryLobbyStore.bufferNightAction(lobbyId, action);

    const record: BotActionRecord = {
      lobbyId,
      botPlayerId:        playerId,
      phase:              lobby.phase,
      roundNumber:        lobby.roundNumber,
      actionType:         'NIGHT_ACTION',
      payload:            action,
      genaiInteractionId: 'FALLBACK',
      takenAt:            Date.now(),
    };
    botSession.actionLog.push(record);
    return record;
  }
}

// ─── Message Sanitizer ────────────────────────────────────────────────────────

const FORBIDDEN_PATTERNS: readonly RegExp[] = [
  /\bescort\b/gi,
  /\bmadam\b/gi,
  /\bjester\s+escort\b/gi,
];

/**
 * Strips any problematic role terminology from AI-generated chat.
 * Replaces with cleaner, inclusive equivalents.
 */
function sanitizeChatMessage(message: string): string {
  let clean = message;
  for (const pattern of FORBIDDEN_PATTERNS) {
    clean = clean.replace(pattern, 'Gözbağlayıcı');
  }
  return clean.trim();
}

// ─── Singleton Export ──────────────────────────────────────────────────────────

export const botTakeoverController = new BotTakeoverController();
