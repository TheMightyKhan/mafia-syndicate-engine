import { NextResponse } from 'next/server';
import { inMemoryLobbyStore } from '../../../../server/state/memory';
import { buildScrubbedLobbyView } from '../../../../server/socket/dispatcher';
import { formatRoleDisplay } from '../../../../types/roles';
import { LobbyState, PlayerSession } from '../../../../types/game';
import { GameMode } from '../../../../types/packs';
import { PACKS_CONFIG } from '../../../../config/packs.config';
import { PlayerTier } from '../../../../types/access';
import { CoreFaction } from '../../../../types/roles';
import { resolveNightActions } from '../../../../server/engine/night-action-resolver';
import { runVotingEngine } from '../../../../server/engine/voting-engine';
import { evaluateWinCondition } from '../../../../server/engine/phase-manager';
import { botTakeoverController } from '../../../../server/ai/bot-takeover';

interface RouteContext {
  readonly params: {
    readonly lobbyId: string;
  };
}

const BOT_NAME_POOL = [
  'Bot_Aysel',
  'Bot_Rauf',
  'Bot_Leyla',
  'Bot_Elmir',
  'Bot_Kamran',
  'Bot_Nigar',
  'Bot_Murad',
  'Bot_Sevda',
  'Bot_Togrul',
  'Bot_Ayan',
];

function deriveModeFromLobbyId(lobbyId: string): GameMode {
  const lower = lobbyId.toLowerCase();
  const allModes = Object.keys(PACKS_CONFIG) as GameMode[];
  for (const mode of allModes) {
    if (lower.startsWith(mode.toLowerCase())) {
      return mode;
    }
  }
  return 'SE7EN_DEADLY_SINS';
}

/**
 * Distribute secret roles ONLY WHEN GAME STARTS.
 * In LOBBY phase, every player is purely in waiting status without any role assigned.
 */
function distributeSecretRoles(lobby: LobbyState): LobbyState {
  const playerList = Object.values(lobby.players);
  const count = playerList.length;
  if (count === 0) return lobby;

  // Shuffle player list
  const shuffled = [...playerList].sort(() => Math.random() - 0.5);

  // Deck generation based on player count and mode
  const isInferno = lobby.mode === 'DANTES_INFERNO';
  const mafiaCount = count >= 6 ? 2 : 1;
  const docCount = count >= 3 ? 1 : 0;
  const sheriffCount = count >= 4 ? 1 : 0;

  const roleDeck: Array<{ nickname: string; base: string; az: string; faction: CoreFaction; office: any }> = [];
  for (let i = 0; i < mafiaCount; i++) {
    roleDeck.push({
      nickname: isInferno ? 'Malebranche İblisi' : 'Qatil (Don)',
      base: 'Killer',
      az: 'Mafiya',
      faction: 'MAFIA',
      office: 'PUBLIC_DEFENDER',
    });
  }
  if (docCount > 0) {
    roleDeck.push({
      nickname: isInferno ? 'Mərhəmət Mələyi' : 'Həkim',
      base: 'Doctor',
      az: 'Həkim',
      faction: 'TOWN',
      office: 'CITY_SURGEON',
    });
  }
  if (sheriffCount > 0) {
    roleDeck.push({
      nickname: isInferno ? 'Vergili' : 'Şərif',
      base: 'Investigator',
      az: 'Şərif',
      faction: 'TOWN',
      office: 'CITY_INVESTIGATOR',
    });
  }
  while (roleDeck.length < count) {
    roleDeck.push({
      nickname: isInferno ? 'Günahkar Ruh' : 'Vətəndaş',
      base: 'Citizen',
      az: 'Məsum Vətəndaş',
      faction: 'TOWN',
      office: 'PUBLIC_DEFENDER',
    });
  }

  // Shuffle deck
  roleDeck.sort(() => Math.random() - 0.5);

  const updatedPlayers: Record<string, PlayerSession> = {};
  for (let i = 0; i < count; i++) {
    const p = shuffled[i];
    const assigned = roleDeck[i];
    updatedPlayers[p.userId] = {
      ...p,
      displayRole: formatRoleDisplay(p.username, assigned.base, assigned.az),
      allInIdentity: {
        layer1Faction: assigned.faction,
        layer2Office: assigned.office,
        layer3Trait: 'BULLETPROOF_VEST',
        district: (['ELITE', 'COMMERCIAL', 'INDUSTRIAL'] as const)[i % 3],
      },
    };
  }

  return {
    ...lobby,
    players: updatedPlayers,
  };
}

function getOrCreateLobby(lobbyId: string, initialHostUser?: { userId: string; username: string; tier: PlayerTier }): LobbyState {
  let lobby = inMemoryLobbyStore.getLobby(lobbyId);
  if (!lobby) {
    const mode = deriveModeFromLobbyId(lobbyId);
    const hostId = initialHostUser?.userId || 'usr-host-initial';
    const hostName = initialHostUser?.username || 'Host';
    const hostTier = initialHostUser?.tier || 'TIER_1';

    // In LOBBY phase, role is strictly pending / unassigned!
    const hostSession: PlayerSession = {
      socketId: `sock-${hostId}`,
      userId: hostId,
      username: hostName,
      tier: hostTier,
      adminRole: mode === 'ALL_IN' ? 'THE_ARCHITECT' : 'NONE',
      isHost: true,
      isAlive: true,
      hasHostWaiver: true,
      hasAdminWaiver: true,
      displayRole: formatRoleDisplay(hostName, 'Pending', 'Gözləmədə'),
      currentDistrict: 'ELITE',
      disconnectedAt: null,
      isAiBotControlled: false,
    };

    lobby = inMemoryLobbyStore.createLobby(lobbyId, hostId, hostSession, mode);
  }
  return lobby;
}

export async function GET(request: Request, context: RouteContext) {
  const { lobbyId } = context.params;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId') || 'anon';

  let lobby = getOrCreateLobby(lobbyId);

  // Auto-execute pending bot actions if in an active phase
  if (lobby.phase === 'NIGHT_BUFFER' || lobby.phase === 'DAY_VOTING') {
    await botTakeoverController.executeAllBotActions(lobbyId);
    lobby = inMemoryLobbyStore.getLobby(lobbyId) || lobby;
  }

  const scrubbed = buildScrubbedLobbyView(lobby, userId);

  return NextResponse.json({
    success: true,
    lobby: scrubbed,
    rawLobby: lobby,
    timestamp: Date.now(),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const { lobbyId } = context.params;

  try {
    const body = await request.json();
    const action = String(body.action || 'SYNC');
    const userId = String(body.userId || 'usr-' + Math.random().toString(36).substring(2, 8));
    const username = String(body.username || 'Oyunçu');
    const tier = (body.tier as PlayerTier) || 'TIER_1';

    let lobby = inMemoryLobbyStore.getLobby(lobbyId);
    if (!lobby) {
      lobby = getOrCreateLobby(lobbyId, { userId, username, tier });
    }

    if (action === 'JOIN') {
      if (!lobby.players[userId]) {
        const isHost = Object.keys(lobby.players).length === 0;
        const newPlayer: PlayerSession = {
          socketId: `sock-${userId}`,
          userId,
          username,
          tier,
          adminRole: 'NONE',
          isHost,
          isAlive: true,
          hasHostWaiver: true,
          hasAdminWaiver: false,
          displayRole: formatRoleDisplay(username, 'Pending', 'Gözləmədə'),
          currentDistrict: 'COMMERCIAL',
          disconnectedAt: null,
          isAiBotControlled: false,
        };
        const joinRes = inMemoryLobbyStore.joinPlayer(lobbyId, newPlayer);
        if (joinRes.success && joinRes.lobby) {
          lobby = joinRes.lobby;
        }
      }
    } else if (action === 'ADD_BOT') {
      // Add a single AI Bot
      const existingNames = new Set(Object.values(lobby.players).map(p => p.username));
      const chosenName = BOT_NAME_POOL.find(n => !existingNames.has(n)) || `Bot_${Math.floor(100 + Math.random() * 900)}`;
      const botId = `bot-${chosenName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
      const botSession: PlayerSession = {
        socketId: `sock-${botId}`,
        userId: botId,
        username: chosenName,
        tier: 'TIER_1',
        adminRole: 'NONE',
        isHost: false,
        isAlive: true,
        hasHostWaiver: true,
        hasAdminWaiver: false,
        displayRole: formatRoleDisplay(chosenName, 'Pending', 'Gözləmədə'),
        currentDistrict: 'COMMERCIAL',
        disconnectedAt: null,
        isAiBotControlled: true,
      };
      inMemoryLobbyStore.joinPlayer(lobbyId, botSession);
      botTakeoverController.registerBot(botId, lobbyId);
      lobby = inMemoryLobbyStore.getLobby(lobbyId) || lobby;

    } else if (action === 'FILL_BOTS') {
      // Fill room with bots to desired target (default: 5)
      const targetCount = Math.max(4, Math.min(10, Number(body.targetCount) || 5));
      let currentCount = Object.keys(lobby.players).length;
      const existingNames = new Set(Object.values(lobby.players).map(p => p.username));
      for (const name of BOT_NAME_POOL) {
        if (currentCount >= targetCount) break;
        if (!existingNames.has(name)) {
          const botId = `bot-${name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
          const botSession: PlayerSession = {
            socketId: `sock-${botId}`,
            userId: botId,
            username: name,
            tier: 'TIER_1',
            adminRole: 'NONE',
            isHost: false,
            isAlive: true,
            hasHostWaiver: true,
            hasAdminWaiver: false,
            displayRole: formatRoleDisplay(name, 'Pending', 'Gözləmədə'),
            currentDistrict: 'COMMERCIAL',
            disconnectedAt: null,
            isAiBotControlled: true,
          };
          inMemoryLobbyStore.joinPlayer(lobbyId, botSession);
          botTakeoverController.registerBot(botId, lobbyId);
          existingNames.add(name);
          currentCount++;
        }
      }
      lobby = inMemoryLobbyStore.getLobby(lobbyId) || lobby;

    } else if (action === 'REMOVE_BOT') {
      const botUserId = String(body.botUserId);
      if (lobby && lobby.players[botUserId]?.isAiBotControlled) {
        inMemoryLobbyStore.removePlayer(lobbyId, botUserId);
        lobby = inMemoryLobbyStore.getLobby(lobbyId) || lobby;
      }

    } else if (action === 'START_GAME' || (action === 'OVERRIDE_PHASE' && lobby?.phase === 'LOBBY')) {
      if (!lobby) lobby = getOrCreateLobby(lobbyId);
      // Start game and distribute secret roles
      lobby = distributeSecretRoles(lobby);
      // Persist distributed roles into inMemoryLobbyStore!
      const currentPlayers = lobby.players;
      inMemoryLobbyStore.updateLobby(lobbyId, (l) => ({
        ...l,
        players: currentPlayers,
      }));

      const nextPhase = (body.nextPhase as any) || (lobby.mode === 'ALL_IN' ? 'DAY_REGIONAL_CAUCUS' : 'NIGHT_BUFFER');
      const duration = Number(body.durationSeconds) || 90;
      inMemoryLobbyStore.transitionPhase(lobbyId, nextPhase, duration);

      // Immediately execute bot night actions if started into NIGHT_BUFFER!
      if (nextPhase === 'NIGHT_BUFFER') {
        await botTakeoverController.executeAllBotActions(lobbyId);
      }
      lobby = inMemoryLobbyStore.getLobby(lobbyId) || lobby;

    } else if (action === 'READY') {
      const readyVal = Boolean(body.ready);
      inMemoryLobbyStore.updateLobby(lobbyId, (l) => ({
        ...l,
        hostReady: readyVal,
      }));
      lobby = inMemoryLobbyStore.getLobby(lobbyId) || lobby;

    } else if (action === 'VOTE') {
      const candidateId = String(body.candidateId);
      inMemoryLobbyStore.castVote(lobbyId, userId, candidateId);
      // Ensure all bots also cast their votes
      await botTakeoverController.executeAllBotActions(lobbyId);
      lobby = inMemoryLobbyStore.getLobby(lobbyId) || lobby;

    } else if (action === 'RETRACT_VOTE') {
      inMemoryLobbyStore.retractVote(lobbyId, userId);
      lobby = inMemoryLobbyStore.getLobby(lobbyId) || lobby;

    } else if (action === 'NIGHT_ACTION') {
      const targetPlayerId = String(body.targetPlayerId);
      const actionType = body.actionType;
      const priority = actionType === 'BLOCK' ? 1 : actionType === 'PROTECT' ? 3 : 4;
      inMemoryLobbyStore.bufferNightAction(lobbyId, {
        actorPlayerId: userId,
        targetPlayerId,
        actionType,
        priority,
        timestamp: Date.now(),
      });
      // Ensure all living bots also submit night actions
      await botTakeoverController.executeAllBotActions(lobbyId);
      lobby = inMemoryLobbyStore.getLobby(lobbyId) || lobby;

    } else if (action === 'PROGRESS_PHASE' || action === 'OVERRIDE_PHASE') {
      // Advance to next logical phase with full night/vote resolution
      if (lobby.phase === 'NIGHT_BUFFER') {
        // 1. Ensure all bots acted
        await botTakeoverController.executeAllBotActions(lobbyId);
        lobby = inMemoryLobbyStore.getLobby(lobbyId) || lobby;

        // 2. Resolve night actions (kills, protections, etc.)
        const resolution = resolveNightActions({ lobby });

        // 3. Update lobby state with resolved players
        inMemoryLobbyStore.updateLobby(lobbyId, (l) => ({
          ...l,
          players: resolution.updatedPlayers,
          lastLynchedUserId: null,
          bufferedNightActions: [],
        }));

        lobby = inMemoryLobbyStore.getLobby(lobbyId) || lobby;
        const win = evaluateWinCondition(lobby);
        if (win.kind !== 'GAME_CONTINUES') {
          inMemoryLobbyStore.transitionPhase(lobbyId, 'ENDED', 0);
        } else {
          inMemoryLobbyStore.transitionPhase(lobbyId, 'DAY_VOTING', 90);
          // Trigger bots to vote during DAY_VOTING!
          await botTakeoverController.executeAllBotActions(lobbyId);
        }
        lobby = inMemoryLobbyStore.getLobby(lobbyId) || lobby;

      } else if (lobby.phase === 'DAY_VOTING') {
        // 1. Ensure all bots voted
        await botTakeoverController.executeAllBotActions(lobbyId);
        lobby = inMemoryLobbyStore.getLobby(lobbyId) || lobby;

        // 2. Run voting court engine
        const voteOutput = runVotingEngine({ lobby });
        const updatedPlayers = { ...lobby.players };
        let lynchedId: string | null = null;
        if (voteOutput.outcome.kind === 'LYNCHED') {
          lynchedId = voteOutput.outcome.victimId;
          if (updatedPlayers[lynchedId]) {
            updatedPlayers[lynchedId] = {
              ...updatedPlayers[lynchedId],
              isAlive: false,
            };
          }
        }

        inMemoryLobbyStore.updateLobby(lobbyId, (l) => ({
          ...l,
          players: updatedPlayers,
          lastLynchedUserId: lynchedId,
          liveVotes: {},
        }));

        lobby = inMemoryLobbyStore.getLobby(lobbyId) || lobby;
        const win = evaluateWinCondition(lobby);
        if (win.kind !== 'GAME_CONTINUES') {
          inMemoryLobbyStore.transitionPhase(lobbyId, 'ENDED', 0);
        } else {
          inMemoryLobbyStore.transitionPhase(lobbyId, 'NIGHT_BUFFER', 90);
          // Trigger bots to submit night actions!
          await botTakeoverController.executeAllBotActions(lobbyId);
        }
        lobby = inMemoryLobbyStore.getLobby(lobbyId) || lobby;

      } else if (body.nextPhase) {
        inMemoryLobbyStore.transitionPhase(lobbyId, body.nextPhase, Number(body.durationSeconds) || 90);
        lobby = inMemoryLobbyStore.getLobby(lobbyId) || lobby;
      }

    } else if (action === 'DUAL_UNLOCK') {
      const role = body.role === 'THE_ARCHITECT' ? 'THE_ARCHITECT' : 'THE_BAILIFF';
      const unlockRes = inMemoryLobbyStore.submitAdminUnlock(lobbyId, userId, role);
      if (unlockRes.lobby) lobby = unlockRes.lobby;
    }

    const scrubbed = buildScrubbedLobbyView(lobby, userId);
    return NextResponse.json({
      success: true,
      lobby: scrubbed,
      rawLobby: lobby,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'ACTION_FAILED' }, { status: 400 });
  }
}
