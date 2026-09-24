import { NextRequest, NextResponse } from 'next/server';
import { signalingStore, SignalType } from '../../../../server/state/signaling';

interface RouteContext {
  readonly params: { readonly lobbyId: string };
}

/**
 * GET /api/signaling/[lobbyId]?peerId=xxx
 * Returns and removes all pending signaling messages addressed to this peer.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  const { lobbyId } = params;
  const peerId = req.nextUrl.searchParams.get('peerId');

  if (!peerId) {
    return NextResponse.json({ error: 'MISSING_PEER_ID' }, { status: 400 });
  }

  const messages = signalingStore.consume(lobbyId, peerId);
  return NextResponse.json({ messages });
}

/**
 * POST /api/signaling/[lobbyId]
 * Body: { fromPeerId, toPeerId, type, payload }
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { lobbyId } = params;

  let body: {
    fromPeerId?: string;
    toPeerId?: string;
    type?: SignalType;
    payload?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  const { fromPeerId, toPeerId, type, payload } = body;

  if (!fromPeerId || !toPeerId || !type) {
    return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
  }

  const stored = signalingStore.post({ lobbyId, fromPeerId, toPeerId, type, payload: payload ?? null });
  return NextResponse.json({ ok: true, id: stored.id });
}
