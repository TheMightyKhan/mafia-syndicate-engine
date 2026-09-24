/**
 * Access Control & Identity Verification Type Definitions
 * Enterprise Mafia / Social Deduction Platform - Phase 1 Foundation
 */

export type PlayerTier = 'TIER_1' | 'TIER_2' | 'TIER_3';

export type AdminRole = 'NONE' | 'THE_ARCHITECT' | 'THE_BAILIFF';

export interface UserAchievement {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly unlockedAt: string; // ISO 8601 string
}

export interface UserProfile {
  readonly id: string;
  readonly username: string;
  readonly avatarUrl: string;
  readonly tier: PlayerTier;
  readonly completedGames: number;
  readonly fastTrackCertified: boolean;
  readonly achievements: readonly UserAchievement[];
  readonly createdAt: string; // ISO 8601 string
}

export interface LobbyAccessRule {
  readonly minTier: PlayerTier;
  /** True for standard and large lobbies (20–39 players), enabling host waiver bypass */
  readonly hostWaiverAllowed: boolean;
  /** Strictly true for All-In (40–50 players) requiring dual-lock platform admin authorization */
  readonly platformAdminRequired: boolean;
  /** Requires verified examination / certificate completion for high-tier entry */
  readonly requiresExamProof: boolean;
}

export type WaiverGranterRole = 'HOST' | 'THE_ARCHITECT' | 'THE_BAILIFF';

export interface WaiverRecord {
  readonly grantedToUserId: string;
  readonly grantedByUserId: string;
  readonly grantedByRole: WaiverGranterRole;
  readonly lobbyId: string;
  readonly timestamp: number; // Unix timestamp in milliseconds
  readonly reason: string;
}

/** Tier priority mapping for runtime comparisons (higher number = higher tier) */
export const TIER_RANK_MAP: Readonly<Record<PlayerTier, number>> = {
  TIER_1: 1,
  TIER_2: 2,
  TIER_3: 3,
} as const;

/** Helper to assert whether user meets minimum tier criteria */
export function satisfiesTierRequirement(userTier: PlayerTier, requiredTier: PlayerTier): boolean {
  return TIER_RANK_MAP[userTier] >= TIER_RANK_MAP[requiredTier];
}

/** Helper to identify platform admin roles */
export function isPlatformAdmin(role: AdminRole): role is 'THE_ARCHITECT' | 'THE_BAILIFF' {
  return role === 'THE_ARCHITECT' || role === 'THE_BAILIFF';
}
