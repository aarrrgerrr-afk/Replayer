import type { ReplayData, PlayerState, PlayerMeta, PlayerSkin, KillEvent } from './types';

// These are deliberately neutral display callsigns. They are only used when a
// replay does not expose a usable display name; names found in the replay always
// win and are never replaced.
const FALLBACK_CALLSIGNS = [
  'Rift Fox',
  'Neon Viper',
  'Storm Scout',
  'Astra Vale',
  'Cloud Runner',
  'Ember Hawk',
  'Night Shift',
  'Iron Comet',
  'Frost Nova',
  'Echo Wolf',
  'Pixel Ace',
  'Orbit Sage',
  'Shadow Kite',
  'Solar Drift',
  'Quartz King',
  'Blue Mirage',
  'Rapid Raven',
  'Zone Ghost',
  'Copper Lynx',
  'Lucky Orbit',
  'Violet Rush',
  'Cinder Fox',
  'North Star',
  'Aero Pulse',
  'Golden Arc',
  'Silent Tide',
  'Prism Scout',
  'Rocket Bloom',
  'Misty Vex',
  'Turbo Finch',
  'Crimson Vale',
  'Hyper Echo',
];

const PLACEHOLDER_NAME = /^(?:player|unknown|unnamed|operator|participant|user|bot)(?:[\s_-]*(?:#?\d+|\d+[_-]\d+))?$/i;
const PLAYER_ID_PATTERN = /^player[_\s-]*\d+(?:[_\s-]*\d+)*$/i;

export function isPlaceholderPlayerName(value?: string | null): boolean {
  const name = value?.trim();
  if (!name) return true;
  return PLACEHOLDER_NAME.test(name) || PLAYER_ID_PATTERN.test(name);
}

export function getFallbackPlayerName(id: number): string {
  const safeId = Number.isFinite(id) ? Math.abs(Math.trunc(id)) : 0;
  return FALLBACK_CALLSIGNS[safeId % FALLBACK_CALLSIGNS.length];
}

export function resolvePlayerName(
  value: string | undefined,
  id: number,
  usedNames?: Set<string>,
): string {
  const trimmed = value?.trim();
  if (trimmed && !isPlaceholderPlayerName(trimmed)) return trimmed;

  const base = getFallbackPlayerName(id);
  if (!usedNames || !usedNames.has(base)) return base;

  let suffix = 2;
  let candidate = `${base} ${suffix}`;
  while (usedNames.has(candidate)) {
    suffix += 1;
    candidate = `${base} ${suffix}`;
  }
  return candidate;
}

const REPLAY_SKIN_STYLES: PlayerSkin['style'][] = ['human', 'masked', 'robot', 'animal', 'knight', 'tech'];
const REPLAY_SKIN_COLORS = [
  ['#e3b84c', '#fff1a8'],
  ['#5279a4', '#d6e8ff'],
  ['#d65b8a', '#f5b7d2'],
  ['#2e384c', '#db3d72'],
  ['#4e6e80', '#67e6ff'],
  ['#6d83d9', '#f5c55a'],
] as const;

function skinFromCharacterId(characterId: string, playerId: number, existing?: PlayerSkin): PlayerSkin {
  const seed = Array.from(characterId).reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, Math.abs(playerId));
  const color = REPLAY_SKIN_COLORS[seed % REPLAY_SKIN_COLORS.length];
  return {
    name: `Character ${characterId}`,
    id: characterId,
    source: 'replay',
    primaryColor: existing?.primaryColor || color[0],
    accentColor: existing?.accentColor || color[1],
    style: existing?.style || REPLAY_SKIN_STYLES[seed % REPLAY_SKIN_STYLES.length],
  };
}

function normalizePlayerMeta(
  player: PlayerMeta,
  usedNames: Set<string>,
): PlayerMeta {
  const name = resolvePlayerName(player.name, player.id, usedNames);
  usedNames.add(name);
  return { ...player, name };
}

export function normalizeReplayIdentities(data: ReplayData): ReplayData {
  const usedNames = new Set<string>();
  const identityById = new Map<number, string>();
  const metadataPlayers = data.metadata.players.map((player) => {
    const normalized = normalizePlayerMeta(player, usedNames);
    identityById.set(normalized.id, normalized.name);
    return normalized;
  });

  const metadataById = new Map(metadataPlayers.map((player) => [player.id, player]));
  const frames = data.frames.map((frame) => ({
    ...frame,
    players: frame.players.map((player) => {
      const metadataPlayer = metadataById.get(player.id);
      const knownName = identityById.get(player.id);
      const name = knownName || resolvePlayerName(player.name, player.id, usedNames);
      const skin = player.skin?.id
        ? player.skin
        : metadataPlayer?.characterId
          ? skinFromCharacterId(metadataPlayer.characterId, player.id, player.skin)
          : player.skin;
      if (!identityById.has(player.id)) {
        identityById.set(player.id, name);
        usedNames.add(name);
        const discoveredMeta: PlayerMeta = {
          id: player.id,
          name,
          characterId: skin?.id,
          teamId: player.teamId,
          isBot: false,
        };
        metadataPlayers.push(discoveredMeta);
        metadataById.set(player.id, discoveredMeta);
      }
      return { ...player, name, skin };
    }),
  }));

  const resolveEventName = (name: string, id: number): string => {
    const knownName = identityById.get(id);
    if (knownName) return knownName;
    const resolved = resolvePlayerName(name, id, usedNames);
    identityById.set(id, resolved);
    usedNames.add(resolved);
    return resolved;
  };

  const kills: KillEvent[] = data.kills.map((kill) => ({
    ...kill,
    killer: resolveEventName(kill.killer, kill.killerId),
    victim: resolveEventName(kill.victim, kill.victimId),
  }));

  return {
    ...data,
    metadata: {
      ...data.metadata,
      players: metadataPlayers,
    },
    frames,
    kills,
  };
}

export function normalizePlayerState(player: PlayerState): PlayerState {
  return { ...player, name: resolvePlayerName(player.name, player.id) };
}
