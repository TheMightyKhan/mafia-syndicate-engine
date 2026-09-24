/**
 * TDV BTL MAFIA - Achievement System Types
 */

export type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'LEGENDARY';

export type AchievementCategory = 'ALL' | 'TOWN' | 'MAFIA' | 'NEUTRAL' | 'MODES' | 'MASTERY';

export interface Achievement {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: Exclude<AchievementCategory, 'ALL'>;
  readonly tier: AchievementTier;
  readonly icon: string;
  readonly xp: number;
  readonly coinReward: number;
  readonly isSecret?: boolean;
}

export interface PlayerAchievementProgress {
  readonly unlockedAchievementIds: readonly string[];
  readonly totalXp: number;
  readonly totalCoins: number;
}
