import { NextResponse } from 'next/server';

export interface LeaderboardSeasonInfo {
  readonly season: string;
  readonly status: string;
  readonly minimumMatchesForRank: number;
  readonly updatedAt: number;
}

export async function GET() {
  const seasonInfo: LeaderboardSeasonInfo = {
    season: 'Mövsüm #1 (TDV Məktəb Deduksiya Liqası)',
    status: 'ACTIVE_INITIAL_QUALIFICATION',
    minimumMatchesForRank: 3,
    updatedAt: Date.now(),
  };

  return NextResponse.json({
    success: true,
    seasonInfo,
    leaderboard: [],
    message: 'Klub masalarda ilk matçlar davam edir. Şəxsi hesabınızla masalara qoşulub xal toplayın.',
  });
}