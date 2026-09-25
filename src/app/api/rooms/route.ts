import { NextResponse } from 'next/server';

export interface PublicRoomSummary {
  readonly lobbyId: string;
  readonly name: string;
  readonly mode: string;
  readonly hostUsername: string;
  readonly isPrivate: boolean;
  readonly playerCount: number;
  readonly maxPlayers: number;
  readonly createdAt: number;
}

const globalRooms = globalThis as unknown as {
  __tdv_rooms_map?: Map<string, PublicRoomSummary>;
};

function getRoomsMap(): Map<string, PublicRoomSummary> {
  if (!globalRooms.__tdv_rooms_map) {
    // Start with empty map — ZERO fake or random rooms!
    globalRooms.__tdv_rooms_map = new Map<string, PublicRoomSummary>();
  }
  return globalRooms.__tdv_rooms_map;
}

export async function GET() {
  const map = getRoomsMap();
  const rooms = Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
  return NextResponse.json({
    rooms,
    totalCount: rooms.length,
    timestamp: Date.now(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const map = getRoomsMap();

    const lobbyId = String(body.lobbyId || `room-${Date.now()}`);
    const name = String(body.name || 'Yeni Mafiya Masası');
    const mode = String(body.mode || 'CLASSIC_7');
    const hostUsername = String(body.hostUsername || 'Host');
    const isPrivate = Boolean(body.isPrivate);
    const maxPlayers = Number(body.maxPlayers) || 12;

    const newRoom: PublicRoomSummary = {
      lobbyId,
      name,
      mode,
      hostUsername,
      isPrivate,
      playerCount: 1,
      maxPlayers,
      createdAt: Date.now(),
    };

    map.set(lobbyId, newRoom);

    return NextResponse.json({
      success: true,
      room: newRoom,
      roomUrl: `/lobby/${lobbyId}`,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'INVALID_ROOM_PAYLOAD' }, { status: 400 });
  }
}
