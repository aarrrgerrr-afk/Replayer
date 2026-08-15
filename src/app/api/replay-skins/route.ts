import { NextResponse } from 'next/server';
import parseReplay from 'fortnite-replay-parser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_REPLAY_BYTES = 512 * 1024 * 1024;

type ParsedPlayer = Record<string, unknown>;

type ParsedReplay = {
  gameData?: Record<string, unknown>;
  players?: unknown;
};

function readProperty(player: ParsedPlayer, names: string[]): unknown {
  const entries = Object.entries(player);
  for (const name of names) {
    const exact = entries.find(([key]) => key === name);
    if (exact) return exact[1];
    const insensitive = entries.find(([key]) => key.toLowerCase() === name.toLowerCase());
    if (insensitive) return insensitive[1];
  }
  return undefined;
}

function readString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value !== 'number' && value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['name', 'value', 'pathName', 'assetPathName', 'id']) {
      const nested = readString(record[key]);
      if (nested) return nested;
    }
  }
  return undefined;
}

function readStringProperty(player: ParsedPlayer, names: string[]): string | undefined {
  return readString(readProperty(player, names));
}

function readNumberProperty(player: ParsedPlayer, names: string[]): number | undefined {
  const value = readProperty(player, names);
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(readString(value));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readBooleanProperty(player: ParsedPlayer, names: string[]): boolean {
  const value = readProperty(player, names);
  if (typeof value === 'boolean') return value;
  const normalized = readString(value)?.toLowerCase();
  return normalized === 'true' || normalized === '1';
}

function normalizeAssetId(value: unknown, prefix: 'CID' | 'BID'): string | undefined {
  const raw = readString(value);
  if (!raw) return undefined;
  const match = raw.match(new RegExp(`(${prefix}_[A-Za-z0-9_]+)`, 'i'));
  return match?.[1] ? `${prefix}_${match[1].slice(prefix.length + 1)}` : undefined;
}

function asPlayerArray(value: unknown): ParsedPlayer[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is ParsedPlayer => Boolean(entry && typeof entry === 'object'));
  }
  if (value && typeof value === 'object') {
    return Object.values(value).filter((entry): entry is ParsedPlayer => Boolean(entry && typeof entry === 'object'));
  }
  return [];
}

function findParsedPlayers(parsed: unknown): ParsedPlayer[] {
  if (!parsed || typeof parsed !== 'object') return [];
  const root = parsed as ParsedReplay;
  const gameData = root.gameData;
  const candidates = [
    gameData?.players,
    gameData?.Players,
    gameData?.playerStates,
    gameData?.PlayerStates,
    root.players,
  ];
  for (const candidate of candidates) {
    const players = asPlayerArray(candidate);
    if (players.length > 0) return players;
  }
  return [];
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof (file as Blob).arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Replay file is required' }, { status: 400 });
    }

    const blob = file as Blob;
    if (blob.size > MAX_REPLAY_BYTES) {
      return NextResponse.json({ error: 'Replay file is larger than 512 MB' }, { status: 413 });
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    const parsed = await parseReplay(buffer, {
      // PlayerState and PlayerPawn properties contain Character/CID_* values.
      // Events are not needed for this endpoint and skipping them keeps uploads
      // small enough to process interactively.
      parseLevel: 10,
      parseEvents: false,
      parsePackets: true,
      debug: false,
    });

    const players = findParsedPlayers(parsed);
    const seen = new Set<number>();
    const result = players
      .map((player, index) => {
        const id = readNumberProperty(player, ['PlayerID', 'PlayerId', 'playerId', 'NetId', 'Id', 'id']) ?? index;
        const characterId = normalizeAssetId(
          readProperty(player, ['Character', 'CharacterId', 'CharacterID', 'PawnCharacter']),
          'CID',
        );
        const backpackId = normalizeAssetId(
          readProperty(player, ['Backpack', 'BackpackId', 'BackpackID', 'BackBling']),
          'BID',
        );
        return {
          id,
          name: readStringProperty(player, ['PlayerNamePrivate', 'PlayerName', 'Name', 'DisplayName']) || '',
          characterId,
          backpackId,
          teamId: readNumberProperty(player, ['TeamIndex', 'TeamId', 'TeamID', 'Team']) ?? 0,
          isBot: readBooleanProperty(player, ['bIsABot', 'bIsBot', 'IsBot', 'Bot']),
        };
      })
      .filter((player) => {
        if (!Number.isFinite(player.id) || seen.has(player.id)) return false;
        seen.add(player.id);
        return Boolean(player.name || player.characterId);
      });

    if (result.length === 0) {
      return NextResponse.json({ error: 'No player appearance records were found' }, { status: 422 });
    }

    return NextResponse.json({
      source: 'fortnite-replay-parser',
      players: result,
      playerCount: result.length,
      withCharacter: result.filter((player) => Boolean(player.characterId)).length,
    });
  } catch (error) {
    // A replay can still be shown with the existing browser/demo decoder when a
    // packet version is unsupported, so this endpoint reports a normal 422.
    console.warn('Replay appearance extraction failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'This replay packet stream could not be decoded' }, { status: 422 });
  }
}
