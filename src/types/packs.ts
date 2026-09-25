/**
 * Pack and Game Mode Type Definitions
 * Enterprise Mafia / Social Deduction Platform - Phase 1 Foundation
 */

import { LobbyAccessRule, PlayerTier } from './access';

export type StandardPackId =
  | 'BLITZ'        // 5–7 players, Tier 1
  | 'STANDARD'  // 8–11 players, Tier 1
  | 'EXTENDED'     // 12–15 players, Tier 2 baseline
  | 'GRAND'              // 16–20 players, Tier 2 baseline
  | 'EPIC'                // 21–24 players, Tier 2 baseline
  | 'MASSIVE'            // 25–30 players, Tier 3 baseline
  | 'LIMITLESS'               // 30+ players, Tier 3 baseline
  | 'CUSTOM_LOBBY';             // Custom lobby

export type MinigameId =
  | 'CATENACCIO'                     // 10–12 players
  | 'STANFORD_PRISON'                // 12–16 players
  | 'OPERATION_VALKYRIE'             // 10–14 players
  | 'THE_DAY_THE_EARTH_STOOD_STILL'  // 12–16 players
  | 'DANTES_INFERNO'                 // 11–13 players
  | 'CHERNOBYL_EXCLUSION_ZONE'       // 10–14 players
  | 'CYBERPUNK_NEO_BAKU'             // 12–16 players
  | 'BERMUDA_TRIANGLE'               // 10–14 players
  | 'MIDNIGHT_SEANCE'                // 11–15 players
  | 'SHERLOCK_BAKER_STREET';         // 8–12 players

export type GameMode = StandardPackId | MinigameId | 'ALL_IN';

export interface PhaseTimingDurations {
  readonly dayRegionalCaucusSeconds?: number;
  readonly dayCentralAssemblySeconds: number;
  readonly dayVotingSeconds: number;
  readonly nightBufferSeconds: number;
}

export interface PackMetadata {
  readonly id: GameMode;
  readonly name: string;
  readonly tagline: string;
  readonly description: string;
  readonly roleBreakdown: string;
  readonly minPlayers: number;
  readonly maxPlayers: number;
  readonly minTier: PlayerTier;
  readonly hostWaiverAllowed: boolean;
  readonly platformAdminRequired: boolean;
  readonly requiresExamProof: boolean;
  readonly defaultTimings: PhaseTimingDurations;
  readonly isMinigame: boolean;
  readonly isAllIn: boolean;
  readonly accessRule: LobbyAccessRule;
}

/** Type guard to determine if a given GameMode is a StandardPackId */
export function isStandardPack(mode: GameMode): mode is StandardPackId {
  return (
    mode === 'BLITZ' ||
    mode === 'STANDARD' ||
    mode === 'EXTENDED' ||
    mode === 'GRAND' ||
    mode === 'EPIC' ||
    mode === 'MASSIVE' ||
    mode === 'LIMITLESS' ||
    mode === 'CUSTOM_LOBBY'
  );
}

/** Type guard to determine if a given GameMode is a MinigameId */
export function isMinigame(mode: GameMode): mode is MinigameId {
  return (
    mode === 'CATENACCIO' ||
    mode === 'STANFORD_PRISON' ||
    mode === 'OPERATION_VALKYRIE' ||
    mode === 'THE_DAY_THE_EARTH_STOOD_STILL' ||
    mode === 'DANTES_INFERNO' ||
    mode === 'CHERNOBYL_EXCLUSION_ZONE' ||
    mode === 'CYBERPUNK_NEO_BAKU' ||
    mode === 'BERMUDA_TRIANGLE' ||
    mode === 'MIDNIGHT_SEANCE' ||
    mode === 'SHERLOCK_BAKER_STREET'
  );
}

/** Type guard to determine if a given GameMode is ALL_IN */
export function isAllInMode(mode: GameMode): mode is 'ALL_IN' {
  return mode === 'ALL_IN';
}
