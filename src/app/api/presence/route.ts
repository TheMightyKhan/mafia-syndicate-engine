import { NextResponse } from 'next/server';

interface OnlineUser {
  readonly id: string;
  readonly username: string;
  readonly tier: string;
  readonly lastSeen: number;
}

const globalPresence = globalThis as unknown as {
  __tdv_presence_map?: Map<string, OnlineUser>;
};

function getPresenceMap(): Map<string, OnlineUser> {
  if (!globalPresence.__tdv_presence_map) {
    globalPresence.__tdv_presence_map = new Map();
  }
  return globalPresence.__tdv_presence_map;
}

function cleanStaleSessions(map: Map<string, OnlineUser>): OnlineUser[] {
  const now = Date.now();
  const active: OnlineUser[] = [];
  for (const [id, user] of map.entries()) {
    if (now - user.lastSeen > 35000) {
      map.delete(id);
    } else {
      active.push(user);
    }
  }
  return active;
}

export async function GET() {
  const map = getPresenceMap();
  const active = cleanStaleSessions(map);
  const count = Math.max(1, active.length);

  return NextResponse.json({
    onlineCount: count,
    users: active.slice(0, 15),
    timestamp: Date.now(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const map = getPresenceMap();
    const userId = String(body.userId || 'guest-' + Math.random().toString(36).substring(2, 8));
    const username = String(body.username || 'Anonim Qonaq');
    const tier = String(body.tier || 'TIER_1');

    map.set(userId, {
      id: userId,
      username,
      tier,
      lastSeen: Date.now(),
    });

    const active = cleanStaleSessions(map);
    return NextResponse.json({
      success: true,
      onlineCount: Math.max(1, active.length),
      users: active.slice(0, 15),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'INVALID_PAYLOAD' }, { status: 400 });
  }
}
