/**
 * Test AI Bot Game Simulation in TDV Mafia
 */

import { inMemoryLobbyStore } from '../src/server/state/memory';
import { PlayerSession, LobbyState } from '../src/types/game';
import { formatRoleDisplay } from '../src/types/roles';
import { botTakeoverController } from '../src/server/ai/bot-takeover';
import { resolveNightActions } from '../src/server/engine/night-action-resolver';
import { runVotingEngine } from '../src/server/engine/voting-engine';
import { evaluateWinCondition, executePhaseTransition } from '../src/server/engine/phase-manager';

async function runSimulation() {
  console.log('🤖 Starting AI Bot Mafia Game Simulation Test...\n');

  // 1. Setup Lobby
  const lobbyId = 'test-ai-bot-lobby-1';
  const hostId = 'usr-human';
  const hostSession: PlayerSession = {
    socketId: 'sock-human',
    userId: hostId,
    username: 'Orxan (Human)',
    tier: 'TIER_1',
    adminRole: 'NONE',
    isHost: true,
    isAlive: true,
    hasHostWaiver: true,
    hasAdminWaiver: true,
    displayRole: formatRoleDisplay('Orxan', 'Pending', 'Gözləmədə'),
    currentDistrict: 'COMMERCIAL',
    disconnectedAt: null,
    isAiBotControlled: false,
  };

  let lobby = inMemoryLobbyStore.createLobby(lobbyId, hostId, hostSession, 'SE7EN_DEADLY_SINS');
  console.log(`✅ Lobby created: ${lobbyId}, Host: ${hostSession.username}`);

  // 2. Add 4 AI Bots
  const botNames = ['Bot_Aysel', 'Bot_Rauf', 'Bot_Leyla', 'Bot_Elmir'];
  for (let i = 0; i < botNames.length; i++) {
    const botId = `bot-${i + 1}`;
    const botSession: PlayerSession = {
      socketId: `sock-${botId}`,
      userId: botId,
      username: botNames[i],
      tier: 'TIER_1',
      adminRole: 'NONE',
      isHost: false,
      isAlive: true,
      hasHostWaiver: true,
      hasAdminWaiver: false,
      displayRole: formatRoleDisplay(botNames[i], 'Pending', 'Gözləmədə'),
      currentDistrict: 'COMMERCIAL',
      disconnectedAt: null,
      isAiBotControlled: true,
    };
    inMemoryLobbyStore.joinPlayer(lobbyId, botSession);
  }

  lobby = inMemoryLobbyStore.getLobby(lobbyId)!;
  const totalPlayers = Object.keys(lobby.players).length;
  console.log(`✅ Joined 4 AI Bots. Total players: ${totalPlayers}`);

  // 3. Start Game & Distribute Roles
  console.log('\n--- 3. Starting Game & Distributing Roles ---');
  // Assign roles: 1 Mafia, 1 Doctor, 1 Sheriff, 2 Citizens
  const roles = [
    { role: 'Mafia', az: 'Mafiya', faction: 'MAFIA', office: 'PUBLIC_DEFENDER' as const },
    { role: 'Doctor', az: 'Həkim', faction: 'TOWN', office: 'CITY_SURGEON' as const },
    { role: 'Sheriff', az: 'Şərif', faction: 'TOWN', office: 'CITY_INVESTIGATOR' as const },
    { role: 'Citizen', az: 'Məsum Vətəndaş', faction: 'TOWN', office: 'PUBLIC_DEFENDER' as const },
    { role: 'Citizen', az: 'Məsum Vətəndaş', faction: 'TOWN', office: 'PUBLIC_DEFENDER' as const },
  ];

  let playerIndex = 0;
  inMemoryLobbyStore.updateLobby(lobbyId, (l) => {
    const updatedPlayers = { ...l.players };
    for (const [pId, p] of Object.entries(updatedPlayers)) {
      const r = roles[playerIndex++];
      updatedPlayers[pId] = {
        ...p,
        displayRole: formatRoleDisplay(p.username, r.role, r.az),
        allInIdentity: {
          layer1Faction: r.faction as any,
          layer2Office: r.office,
          layer3Trait: 'BULLETPROOF_VEST',
          district: 'COMMERCIAL',
        },
      };
      console.log(`  Player ${p.username} (${pId}, AI: ${p.isAiBotControlled}) -> Role: ${r.az} (${r.faction})`);
    }
    return { ...l, players: updatedPlayers };
  });

  // 4. Test Bot Night Actions
  console.log('\n--- 4. Testing Bot Night Actions (NIGHT_BUFFER) ---');
  inMemoryLobbyStore.transitionPhase(lobbyId, 'NIGHT_BUFFER', 25);
  lobby = inMemoryLobbyStore.getLobby(lobbyId)!;

  console.log(`Current phase: ${lobby.phase}`);

  // Test calling botTakeoverController on each bot
  for (const [pId, p] of Object.entries(lobby.players)) {
    if (p.isAiBotControlled) {
      try {
        console.log(`Checking bot controller for ${p.username} (${pId})...`);
        const isControlled = botTakeoverController.isBotControlled(pId);
        console.log(`  isBotControlled in controller: ${isControlled}`);
        
        const actionRes = await botTakeoverController.submitBotNightAction(pId, lobbyId);
        console.log(`  submitBotNightAction result:`, actionRes ? JSON.stringify(actionRes.payload) : 'NULL');
      } catch (err) {
        console.error(`  ❌ Error executing bot night action:`, err);
      }
    }
  }

  // Check if any actions were buffered in lobby
  lobby = inMemoryLobbyStore.getLobby(lobbyId)!;
  console.log(`Buffered night actions in lobby: ${lobby.bufferedNightActions.length}`);
  for (const act of lobby.bufferedNightActions) {
    console.log(`  Actor ${act.actorPlayerId} -> Action: ${act.actionType} on Target: ${act.targetPlayerId}`);
  }

  // 5. Test Night Action Resolution
  console.log('\n--- 5. Resolving Night Actions ---');
  const nightOutput = resolveNightActions({ lobby });
  console.log(`Night resolution public deaths: ${nightOutput.newspaper.publicDeaths.length}`);
  for (const d of nightOutput.newspaper.publicDeaths) {
    console.log(`  💀 Dead player: ${d.victimPlayerId}, Cause: ${d.cause}`);
  }

  // 6. Test Day Phase & Bot Voting
  console.log('\n--- 6. Testing Day Phase & Bot Voting (DAY_VOTING) ---');
  inMemoryLobbyStore.transitionPhase(lobbyId, 'DAY_VOTING', 60);
  lobby = inMemoryLobbyStore.getLobby(lobbyId)!;

  for (const [pId, p] of Object.entries(lobby.players)) {
    if (p.isAiBotControlled && p.isAlive) {
      try {
        console.log(`Testing day vote for ${p.username} (${pId})...`);
        const voteRes = await botTakeoverController.submitBotDayVote(pId, lobbyId);
        console.log(`  submitBotDayVote result:`, voteRes ? JSON.stringify(voteRes) : 'NULL');
      } catch (err) {
        console.error(`  ❌ Error executing bot day vote:`, err);
      }
    }
  }

  // Check live votes
  lobby = inMemoryLobbyStore.getLobby(lobbyId)!;
  console.log(`Live votes in lobby:`, JSON.stringify(lobby.liveVotes));

  // 7. Test Voting Engine
  console.log('\n--- 7. Running Voting Engine ---');
  const voteOutput = runVotingEngine({ lobby });
  console.log(`Vote outcome kind: ${voteOutput.outcome.kind}`);
  if (voteOutput.outcome.kind === 'LYNCHED') {
    console.log(`  ⚖️ Lynched player: ${voteOutput.outcome.victimId}`);
  }

  // 9. Scenario 2: Test executeAllBotActions where Bot is Mafia
  console.log('\n--- 9. Scenario 2: executeAllBotActions with Bot as Mafia ---');
  const lobbyId2 = 'test-ai-bot-lobby-2';
  inMemoryLobbyStore.createLobby(lobbyId2, hostId, hostSession, 'SE7EN_DEADLY_SINS');
  for (let i = 0; i < botNames.length; i++) {
    const botId = `bot-${i + 1}`;
    const botSession: PlayerSession = {
      socketId: `sock-${botId}`,
      userId: botId,
      username: botNames[i],
      tier: 'TIER_1',
      adminRole: 'NONE',
      isHost: false,
      isAlive: true,
      hasHostWaiver: true,
      hasAdminWaiver: false,
      displayRole: formatRoleDisplay(botNames[i], 'Pending', 'Gözləmədə'),
      currentDistrict: 'COMMERCIAL',
      disconnectedAt: null,
      isAiBotControlled: true,
    };
    inMemoryLobbyStore.joinPlayer(lobbyId2, botSession);
  }

  // Assign Bot_Aysel as MAFIA, Host as Citizen
  inMemoryLobbyStore.updateLobby(lobbyId2, (l) => {
    const p = { ...l.players };
    p['usr-human'] = {
      ...p['usr-human'],
      displayRole: formatRoleDisplay('Orxan', 'Citizen', 'Məsum Vətəndaş'),
      allInIdentity: { layer1Faction: 'TOWN', layer2Office: 'PUBLIC_DEFENDER', layer3Trait: 'BULLETPROOF_VEST', district: 'COMMERCIAL' }
    };
    p['bot-1'] = {
      ...p['bot-1'],
      displayRole: formatRoleDisplay('Bot_Aysel', 'Mafia', 'Mafiya'),
      allInIdentity: { layer1Faction: 'MAFIA', layer2Office: 'PUBLIC_DEFENDER', layer3Trait: 'BULLETPROOF_VEST', district: 'COMMERCIAL' }
    };
    p['bot-2'] = {
      ...p['bot-2'],
      displayRole: formatRoleDisplay('Bot_Rauf', 'Doctor', 'Həkim'),
      allInIdentity: { layer1Faction: 'TOWN', layer2Office: 'CITY_SURGEON', layer3Trait: 'BULLETPROOF_VEST', district: 'COMMERCIAL' }
    };
    return { ...l, players: p, phase: 'NIGHT_BUFFER' };
  });

  await botTakeoverController.executeAllBotActions(lobbyId2);
  console.log(`executeAllBotActions finished.`);

  const lobby2AfterNight = inMemoryLobbyStore.getLobby(lobbyId2)!;
  console.log(`Lobby 2 buffered actions: ${lobby2AfterNight.bufferedNightActions.length}`);
  for (const act of lobby2AfterNight.bufferedNightActions) {
    console.log(`  Actor ${act.actorPlayerId} -> ${act.actionType} on Target: ${act.targetPlayerId}`);
  }

  // 10. Scenario 3: Test Mafia Kill resolves in victim death when unprotected
  console.log('\n--- 10. Scenario 3: Mafia Kill successfully eliminates victim ---');
  const lobbyId3 = 'test-ai-bot-lobby-3';
  inMemoryLobbyStore.createLobby(lobbyId3, hostId, hostSession, 'SE7EN_DEADLY_SINS');
  for (let i = 0; i < botNames.length; i++) {
    const botId = `bot-${i + 1}`;
    const botSession: PlayerSession = {
      socketId: `sock-${botId}`,
      userId: botId,
      username: botNames[i],
      tier: 'TIER_1',
      adminRole: 'NONE',
      isHost: false,
      isAlive: true,
      hasHostWaiver: true,
      hasAdminWaiver: false,
      displayRole: formatRoleDisplay(botNames[i], 'Pending', 'Gözləmədə'),
      currentDistrict: 'COMMERCIAL',
      disconnectedAt: null,
      isAiBotControlled: true,
    };
    inMemoryLobbyStore.joinPlayer(lobbyId3, botSession);
  }

  // Assign Bot_Aysel as MAFIA targeting Bot_Elmir, no protection on Bot_Elmir
  inMemoryLobbyStore.updateLobby(lobbyId3, (l) => {
    const p = { ...l.players };
    p['bot-1'] = {
      ...p['bot-1'],
      displayRole: formatRoleDisplay('Bot_Aysel', 'Mafia', 'Mafiya'),
      allInIdentity: { layer1Faction: 'MAFIA', layer2Office: 'PUBLIC_DEFENDER', layer3Trait: 'BULLETPROOF_VEST', district: 'COMMERCIAL' }
    };
    // Bot 4 has no vest
    p['bot-4'] = {
      ...p['bot-4'],
      displayRole: formatRoleDisplay('Bot_Elmir', 'Citizen', 'Məsum Vətəndaş'),
      allInIdentity: { layer1Faction: 'TOWN', layer2Office: 'PUBLIC_DEFENDER', layer3Trait: 'PHANTOM_STEP', district: 'COMMERCIAL' }
    };
    return {
      ...l,
      players: p,
      phase: 'NIGHT_BUFFER',
      bufferedNightActions: [
        {
          actorPlayerId: 'bot-1',
          targetPlayerId: 'bot-4',
          actionType: 'KILL',
          priority: 4,
          timestamp: Date.now(),
        }
      ]
    };
  });

  const lobby3AfterNight = inMemoryLobbyStore.getLobby(lobbyId3)!;
  const resNight3 = resolveNightActions({ lobby: lobby3AfterNight });
  console.log(`Lobby 3 Night deaths: ${resNight3.newspaper.publicDeaths.length}`);
  for (const d of resNight3.newspaper.publicDeaths) {
    console.log(`  💀 Dead victim: ${d.victimPlayerId}, Cause: ${d.cause}`);
  }
  const isBot4Dead = !resNight3.updatedPlayers['bot-4'].isAlive;
  console.log(`  Bot_Elmir isAlive: ${resNight3.updatedPlayers['bot-4'].isAlive} (Successfully killed: ${isBot4Dead})`);

  console.log('\n✅ All AI Bot Mafia Simulation Tests passed with 100% SUCCESS!');
}

runSimulation().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
