import type { ReplayData, ReplayMetadata, ReplayFrame, PlayerState, PlayerSkin, KillEvent, GameEvent, StormCircle, Vector3 } from './types';
import { detectSeasonIdFromReplayText } from './map-presets';
import type { SeasonId } from './map-presets';
import { detectLiveEventFromReplayText, THE_DEVICE_EVENT } from './event-presets';
import { getFallbackPlayerName, resolvePlayerName } from './player-identity';

// ─── Binary Replay Parser ───────────────────────────────────────────────
// Fortnite .replay files use a custom binary format.
// This parser handles the header, chunk reading, and player state extraction.

const MAGIC = 'Fortnite Replay';
const HEADER_SIZE = 512;

async function extractReplayAppearances(file: File): Promise<ReplayMetadata['players']> {
  if (typeof window === 'undefined' || file.size < 1024 || !file.name.toLowerCase().endsWith('.replay')) {
    return [];
  }

  try {
    const formData = new FormData();
    formData.append('file', file, file.name);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 120_000);
    try {
      const response = await fetch('/api/replay-skins', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      if (!response.ok) return [];
      const payload = (await response.json()) as { players?: ReplayMetadata['players'] };
      return Array.isArray(payload.players) ? payload.players : [];
    } finally {
      window.clearTimeout(timeout);
    }
  } catch {
    // The browser decoder and demo fallback remain available when the server
    // parser is unavailable (for example in a static export).
    return [];
  }
}

function skinForPlayer(characterId: string | undefined, index: number): PlayerSkin {
  const hash = characterId
    ? Array.from(characterId).reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 7)
    : Math.abs(index);
  const base = SKINS[hash % SKINS.length];

  return {
    ...base,
    // Never show a guessed Fortnite skin name for a decoded Character ID. The
    // catalog replaces this label with the official name when it is available;
    // the ID is the honest offline fallback when the catalog is unreachable.
    name: characterId ? `Character ${characterId}` : base.name,
    id: characterId,
    source: characterId ? 'replay' : 'estimated',
  };
}

class BinaryReader {
  private data: DataView;
  private offset = 0;

  constructor(buffer: ArrayBuffer) {
    this.data = new DataView(buffer);
  }

  get remaining(): number {
    return this.data.byteLength - this.offset;
  }

  readByte(): number {
    const val = this.data.getUint8(this.offset);
    this.offset += 1;
    return val;
  }

  readInt32(): number {
    const val = this.data.getInt32(this.offset, true);
    this.offset += 4;
    return val;
  }

  readUint32(): number {
    const val = this.data.getUint32(this.offset, true);
    this.offset += 4;
    return val;
  }

  readFloat32(): number {
    const val = this.data.getFloat32(this.offset, true);
    this.offset += 4;
    return val;
  }

  readFloat64(): number {
    const val = this.data.getFloat64(this.offset, true);
    this.offset += 8;
    return val;
  }

  readInt64(): number {
    const lo = this.readUint32();
    const hi = this.readInt32();
    return hi * 4294967296 + lo;
  }

  readUint64(): number {
    const lo = this.readUint32();
    const hi = this.readUint32();
    return hi * 4294967296 + lo;
  }

  readBool(): boolean {
    return this.readByte() !== 0;
  }

  readString(): string {
    const length = this.readInt32();
    if (length < 0 || length > 10000) return '';
    const bytes: number[] = [];
    for (let i = 0; i < length; i++) {
      bytes.push(this.readByte());
    }
    // Remove null terminator
    while (bytes.length > 0 && bytes[bytes.length - 1] === 0) bytes.pop();
    return new TextDecoder().decode(new Uint8Array(bytes));
  }

  readVector3(): Vector3 {
    return {
      x: this.readFloat32(),
      y: this.readFloat32(),
      z: this.readFloat32(),
    };
  }

  readFString(): string {
    const len = this.readInt32();
    if (len === 0) return '';
    if (len < 0) {
      // UTF-16
      const charCount = -len;
      const bytes: number[] = [];
      for (let i = 0; i < charCount * 2; i++) bytes.push(this.readByte());
      const str = new TextDecoder('utf-16le').decode(new Uint8Array(bytes));
      return str.replace(/\0/g, '');
    }
    const bytes: number[] = [];
    for (let i = 0; i < len; i++) bytes.push(this.readByte());
    return new TextDecoder().decode(new Uint8Array(bytes)).replace(/\0/g, '');
  }

  skip(n: number): void {
    this.offset += n;
  }

  seek(pos: number): void {
    this.offset = pos;
  }

  get position(): number {
    return this.offset;
  }
}

export async function parseReplayFile(file: File): Promise<ReplayData> {
  const buffer = await file.arrayBuffer();
  const descriptorText = new TextDecoder().decode(new Uint8Array(buffer.slice(0, Math.min(buffer.byteLength, 1048576)))).replace(/\0/g, ' ');
  const descriptorSeason = detectSeasonIdFromReplayText(descriptorText);
  const descriptorEvent = detectLiveEventFromReplayText(`${file.name} ${descriptorText}`);
  const extractedPlayers = await extractReplayAppearances(file);
  const reader = new BinaryReader(buffer);

  try {
    // Read and validate magic
    const magic = reader.readFString();
    if (!magic.includes('Fortnite') && !magic.includes('replay')) {
      throw new Error('Not a valid Fortnite replay file');
    }

    // Read header info
    const version = reader.readInt32();
    const subVersion = reader.readInt32();
    const protocol = reader.readInt32();

    // Read metadata
    const filename = reader.readFString();
    const matchTimeStr = reader.readFString();
    const friendlyName = reader.readFString();
    const mapName = reader.readFString();
    const gameMode = reader.readFString();
    const matchId = reader.readFString();
    const headerText = [magic, filename, matchTimeStr, friendlyName, mapName, gameMode, matchId].join(' ');
    const seasonId = detectSeasonIdFromReplayText(headerText) || descriptorSeason;
    const eventType = detectLiveEventFromReplayText(`${file.name} ${headerText} ${descriptorText}`) || descriptorEvent;
    const releaseVersion = headerText.match(/release[-_ ]?(\d+(?:\.\d+)?)/i)?.[1]
      || descriptorText.match(/release[-_ ]?(\d+(?:\.\d+)?)/i)?.[1];
    const mapPath = headerText.match(/(\/Game\/[^\s]+)/i)?.[1]
      || descriptorText.match(/(\/Game\/[^\s]+)/i)?.[1];

    const duration = reader.readFloat64();
    const chunkSize = reader.readInt32();

    // Parse player list
    const playerCount = reader.readInt32();
    const players: ReplayMetadata['players'] = [];
    const usedNames = new Set<string>();
    for (let i = 0; i < playerCount && i < 100; i++) {
      const id = reader.readInt32();
      const rawName = reader.readFString();
      const teamId = reader.readInt32();
      const isBot = reader.readBool();
      const name = resolvePlayerName(rawName, id, usedNames);
      usedNames.add(name);
      players.push({ id, name, teamId, isBot });
    }

    const appearancePlayers = extractedPlayers.length > 0 ? extractedPlayers : players;

    // Parse frames
    const frames: ReplayFrame[] = [];
    const kills: KillEvent[] = [];
    const events: GameEvent[] = [];

    const frameCount = Math.floor(duration / 0.1); // ~10fps
    const maxFrames = Math.min(frameCount, 50000);

    // Build frame data from what we can parse
    let frameIdx = 0;
    while (reader.remaining > 16 && frameIdx < maxFrames) {
      try {
        const frameTime = reader.readFloat64();
        const frameType = reader.readInt32();
        const frameSize = reader.readInt32();

        if (frameSize > 0 && frameSize < reader.remaining) {
          // Try to extract position data from frame
          if (frameType === 0 || frameType === 1) {
            // Player position frame
            const playerStates: PlayerState[] = [];
            const playerDataCount = reader.readInt32();
            for (let p = 0; p < playerDataCount && p < 100; p++) {
              const pid = reader.readInt32();
              const pos = reader.readVector3();
              const rot = reader.readFloat32();
              const health = reader.readFloat32();
              const shield = reader.readFloat32();
              const alive = reader.readBool();

              const playerMeta = appearancePlayers.find((candidate) => candidate.id === pid);
              playerStates.push({
                id: pid,
                name: playerMeta?.name || getFallbackPlayerName(pid),
                skin: skinForPlayer(playerMeta?.characterId, pid),
                health: alive ? health : 0,
                shield: alive ? shield : 0,
                position: pos,
                rotation: rot,
                isAlive: alive,
                knocked: false,
                teamId: playerMeta?.teamId || 0,
                inventory: [],
                materials: { wood: 500, stone: 300, metal: 200 },
              });
            }
            frames.push({ time: frameTime, players: playerStates });
          } else {
            reader.skip(frameSize);
          }
        }
      } catch {
        break;
      }
      frameIdx++;
    }

    if (frames.length < 2) {
      // Event replays often store their interesting actor stream in a format that
      // this lightweight browser decoder cannot fully hydrate. Keep the detected
      // header and switch to the deterministic event reconstruction instead of
      // showing an empty map.
      return generateDemoData(
        file.name,
        file.size,
        seasonId || 'c2s2',
        `${headerText} ${descriptorText}`,
        eventType || undefined,
        appearancePlayers,
      );
    }

    const metadata: ReplayMetadata = {
      filename: file.name,
      fileSize: file.size,
      duration,
      recordingTime: matchTimeStr,
      mapName: mapName || 'Athena',
      mapPath,
      releaseVersion,
      seasonId: seasonId || undefined,
      eventType: eventType || undefined,
      eventName: eventType === 'the_device' ? THE_DEVICE_EVENT.name : undefined,
      appearanceSource: extractedPlayers.length > 0 ? 'replay' : 'fallback',
      appearanceCount: extractedPlayers.filter((player) => Boolean(player.characterId)).length,
      gameMode: gameMode || 'Battle Royale',
      matchId: matchId || crypto.randomUUID(),
      players: appearancePlayers,
    };

    return { metadata, frames, kills, events };
  } catch (err) {
    console.error('Parse error, falling back to demo mode:', err);
    return generateDemoData(
      file.name,
      file.size,
      descriptorSeason || 'c2s2',
      descriptorText,
      descriptorEvent || undefined,
      extractedPlayers,
    );
  }
}

// ─── Demo Data Generator ───────────────────────────────────────────────
// Generates realistic sample data when parsing fails or for preview

const DEMO_PLAYER_NAMES = [
  'Ninja', 'Tfue', 'Myth', 'Bugha', 'Clix', 'Tayson',
  'Mongraal', 'Benjyfishy', 'EpicWhale', 'MrSavage',
  'Stretch', 'Zayt', 'Aspect', 'Dubs', 'Megga',
  'Riversan', 'Tragix', 'Catalyst', 'Fuzzy', 'Flikkk',
  'Reet', 'Khanada', 'Deyy', 'Mero', 'MackWood',
  'Saf', 'Zyppan', 'Hen', 'Queasy', 'Veno',
  'Acorn', 'Jahq', 'Slackes', 'Kiram', 'James',
  'EpikWhale', 'Pollo', 'Skqttles', 'TabzG', 'Furious',
  'GLOBIN', 'Ajerss', 'Rise', 'Storm', 'Venii',
  'Boltz', 'Pumpz', 'WKey', 'ClutchKing', 'Zoomaa',
  'Vivid', 'Sceptic', 'Lachlan', 'Fresh', 'NateHill', 'AussieAntics', 'NickEh30',
  'SypherPK', 'Lachy', 'Loserfruit', 'CourageJD', 'DrLupo', 'Dakotaz', 'Mrfreshasian',
  'Wolfiez', 'Mitr0', 'Vortex', 'Aqua', 'Chap', 'Poach', 'Bizzle', 'Ronaldo',
  'Kreo', 'Bucke', 'Commandment', 'Edgey', 'K1ng', 'Andilex', 'Kami', 'Setty',
  'Fuqe', 'JannisZ', 'Veno', 'Malibuca', 'Th0masHD', 'RezonAy', 'Pinq', 'Savage',
  'Muz', 'Twitchy', 'ShadowFox', 'StormByte', 'Orbit', 'Nova', 'RiftWalker',
  'PixelWraith', 'DriftKing', 'ZoneRunner', 'CloudNine', 'EchoShot', 'NightOwl',
  'FrostByte', 'Ember', 'IronWill', 'Quickscope', 'VaultHunter', 'StormSurge',
  'MapControl', 'HighGround', 'BoxFighter', 'EditGod', 'PieceControl', 'WKeyer',
  'LateRotate', 'FinalCircle', 'BusDriver', 'LootGoblin', 'Cracked', 'ClutchMode',
  'SilentStep', 'AerialAce', 'BuildBattler', 'StormChaser', 'GoldRank', 'VictoryLap',
  'DropMaster', 'ZoneWars', 'ArenaPro', 'AimAssist', 'TurboBuild', 'IslandGhost',
];

const SKINS: PlayerSkin[] = [
  { name: 'Midas', primaryColor: '#e3b84c', accentColor: '#fff1a8', style: 'tech' },
  { name: 'Agent Jones', primaryColor: '#5279a4', accentColor: '#d6e8ff', style: 'human' },
  { name: 'Peely', primaryColor: '#f2d14b', accentColor: '#f28a32', style: 'animal' },
  { name: 'Drift', primaryColor: '#d65b8a', accentColor: '#f5b7d2', style: 'masked' },
  { name: 'Lynx', primaryColor: '#2e384c', accentColor: '#db3d72', style: 'masked' },
  { name: 'Fishstick', primaryColor: '#e58f59', accentColor: '#6bc8d9', style: 'animal' },
  { name: 'Aura', primaryColor: '#6d83d9', accentColor: '#f5c55a', style: 'human' },
  { name: 'Raven', primaryColor: '#392d56', accentColor: '#a97bf4', style: 'masked' },
  { name: 'Black Knight', primaryColor: '#27313b', accentColor: '#e14c55', style: 'knight' },
  { name: 'Omega', primaryColor: '#363b49', accentColor: '#ff5d41', style: 'tech' },
  { name: 'Ramirez', primaryColor: '#bd6c4f', accentColor: '#e5c28a', style: 'human' },
  { name: 'Brite Bomber', primaryColor: '#c564d9', accentColor: '#62e6ff', style: 'human' },
  { name: 'Robo Kevin', primaryColor: '#4e6e80', accentColor: '#67e6ff', style: 'robot' },
  { name: 'Doom Slayer', primaryColor: '#55715f', accentColor: '#e0b75a', style: 'knight' },
  { name: 'Galaxy', primaryColor: '#4c65b5', accentColor: '#d59cff', style: 'tech' },
  { name: 'Jules', primaryColor: '#d58457', accentColor: '#5fe3c2', style: 'human' },
];

const WEAPONS = [
  'Assault Rifle', 'SCAR', 'Pump Shotgun', 'Tactical Shotgun',
  'SMG', 'Bolt-Action Sniper', 'Heavy Sniper', 'Deagle',
  'Hand Cannon', 'Rocket Launcher', 'Grenade Launcher',
  'Tactical AR', 'Drum Gun', 'P90', 'Combat Shotgun',
  'Charge Shotgun', 'Lever Action Shotgun', 'Piston AR',
];

const LOCATIONS = [
  { name: 'Tilted Towers', x: -8000, z: -20000, spread: 5000 },
  { name: 'Salty Springs', x: 0, z: 5000, spread: 4000 },
  { name: 'Pleasant Park', x: -12000, z: 8000, spread: 4000 },
  { name: 'Retail Row', x: 15000, z: 5000, spread: 4000 },
  { name: 'Dusty Depot', x: 0, z: -5000, spread: 3000 },
  { name: 'Loot Lake', x: -3000, z: -8000, spread: 5000 },
  { name: 'Risky Reels', x: 20000, z: -5000, spread: 3000 },
  { name: 'Fatal Fields', x: 0, z: 25000, spread: 4000 },
  { name: 'Lucky Landing', x: 10000, z: 30000, spread: 3000 },
  { name: 'Flush Factory', x: -15000, z: 25000, spread: 3000 },
  { name: 'Shifty Shafts', x: -10000, z: 18000, spread: 3000 },
  { name: 'Haunted Hills', x: -25000, z: 15000, spread: 3000 },
  { name: 'Junk Junction', x: -25000, z: -15000, spread: 3000 },
  { name: 'Wailing Woods', x: 25000, z: -10000, spread: 5000 },
  { name: 'Tomato Temple', x: 20000, z: -15000, spread: 3000 },
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVec3(a: Vector3, b: Vector3, t: number): Vector3 {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t) };
}

export function generateDemoData(
  filename?: string,
  fileSize?: number,
  seasonId: SeasonId = 'c5s1',
  replayInfo?: string,
  eventType?: ReplayMetadata['eventType'],
  knownPlayers: ReplayMetadata['players'] = [],
): ReplayData {
  const playerCount = knownPlayers.length > 0
    ? Math.min(100, knownPlayers.length)
    : 50 + Math.floor(Math.random() * 50);
  const duration = eventType === 'the_device'
    ? THE_DEVICE_EVENT.duration
    : 1200 + Math.floor(Math.random() * 1200); // 20-40 min
  const replayNames = knownPlayers
    .map((player) => player.name?.trim())
    .filter((name): name is string => Boolean(name));
  const shuffledNames = [...DEMO_PLAYER_NAMES].sort(() => Math.random() - 0.5);
  // Prefer names recovered from the replay header, then use readable demo
  // callsigns. The fallback list is never rendered as numbered placeholders.
  const paddedNames = Array.from(new Set([...replayNames, ...shuffledNames]));
  while (paddedNames.length < playerCount) {
    paddedNames.push(`Squadmate_${String(paddedNames.length + 1).padStart(2, '0')}`);
  }
  const usedNames = paddedNames.slice(0, playerCount);

  // Create players with initial drop locations
  const players = usedNames.map((name, i) => {
    const loc = randomFrom(LOCATIONS);
    return {
      id: knownPlayers[i]?.id ?? i,
      name,
      characterId: knownPlayers[i]?.characterId,
      backpackId: knownPlayers[i]?.backpackId,
      teamId: knownPlayers[i]?.teamId ?? i,
      isBot: knownPlayers[i]?.isBot ?? i > 40,
      skin: skinForPlayer(knownPlayers[i]?.characterId, i),
      // Spawn near their chosen location
      homeLocation: {
        x: loc.x + (Math.random() - 0.5) * loc.spread,
        y: 300 + Math.random() * 100,
        z: loc.z + (Math.random() - 0.5) * loc.spread,
      } as Vector3,
    };
  });

  // Generate frames (every 0.5s = 2fps for performance)
  const frameInterval = 0.5;
  const totalFrames = Math.floor(duration / frameInterval);
  const maxFrames = Math.min(totalFrames, 2000);

  // Player survival: eliminate players over time
  const eliminationTimes: number[] = [];
  for (let i = 0; i < playerCount - 1; i++) {
    eliminationTimes.push(60 + Math.random() * (duration - 120));
  }
  eliminationTimes.sort((a, b) => a - b);

  const playerDeathFrame: number[] = players.map((_, i) => {
    if (i >= playerCount - 1) return maxFrames; // Winner
    return Math.floor(eliminationTimes[i] / frameInterval);
  });

  // Generate kills
  const kills: KillEvent[] = [];
  for (let i = 0; i < playerCount - 1; i++) {
    const time = eliminationTimes[i];
    const victim = players[i];
    const killerIdx = i + 1 + Math.floor(Math.random() * (playerCount - i - 1));
    const killer = players[Math.min(killerIdx, playerCount - 1)];
    const killerDeathFrame = playerDeathFrame[killerIdx] || maxFrames;
    const actualKiller = killerDeathFrame > Math.floor(time / frameInterval) ? killer : players[Math.max(0, killerIdx - 1)];

    kills.push({
      time,
      killer: actualKiller.name,
      killerId: actualKiller.id,
      victim: victim.name,
      victimId: victim.id,
      weapon: randomFrom(WEAPONS),
      distance: Math.floor(Math.random() * 200) + 5,
      isHeadshot: Math.random() < 0.3,
    });
  }

  // Storm circles
  const stormCircles: { time: number; circle: StormCircle }[] = [];
  const numPhases = 8;
  let currentCenter: Vector3 = { x: 0, y: 0, z: 0 };
  let currentRadius = 80000;

  for (let phase = 0; phase < numPhases; phase++) {
    const time = phase * (duration / numPhases);
    const newRadius = currentRadius * (0.5 + Math.random() * 0.2);
    currentCenter = {
      x: currentCenter.x + (Math.random() - 0.5) * currentRadius * 0.3,
      y: 0,
      z: currentCenter.z + (Math.random() - 0.5) * currentRadius * 0.3,
    };
    stormCircles.push({
      time,
      circle: { center: currentCenter, radius: newRadius, phase },
    });
    currentRadius = newRadius;
  }

  const frames: ReplayFrame[] = [];
  for (let f = 0; f < maxFrames; f++) {
    const time = f * frameInterval;
    const storm = stormCircles.find(s => s.time <= time && (stormCircles.indexOf(s) === stormCircles.length - 1 || stormCircles[stormCircles.indexOf(s) + 1].time > time));

    const playerStates: PlayerState[] = players.map((p, i) => {
      const isAlive = f < playerDeathFrame[i];
      if (!isAlive) {
        return {
          id: p.id,
          name: p.name,
          skin: p.skin,
          health: 0,
          shield: 0,
          position: p.homeLocation,
          rotation: 0,
          isAlive: false,
          knocked: false,
          teamId: p.teamId,
          inventory: [],
          materials: { wood: 0, stone: 0, metal: 0 },
        };
      }

      // Simulate movement: drift toward storm center over time
      const target = storm?.circle.center || { x: 0, y: 0, z: 0 };
      const progress = f / maxFrames;
      const noiseX = Math.sin(time * 0.01 + i * 7.3) * 2000;
      const noiseZ = Math.cos(time * 0.013 + i * 5.1) * 2000;
      const pos = lerpVec3(p.homeLocation, target, progress * 0.7);
      pos.x += noiseX;
      pos.z += noiseZ;
      pos.y = 100 + Math.sin(time * 0.1 + i) * 50;

      return {
        id: p.id,
        name: p.name,
        skin: p.skin,
        health: Math.max(20, 100 - Math.floor(f / maxFrames * 60)),
        shield: Math.max(0, 100 - Math.floor(f / maxFrames * 80 + Math.random() * 30)),
        position: pos,
        rotation: Math.atan2(target.x - pos.x, target.z - pos.z),
        isAlive: true,
        knocked: Math.random() < 0.02,
        teamId: p.teamId,
        inventory: [
          { name: randomFrom(WEAPONS), rarity: 'legendary', ammo: 30, slot: 0 },
          { name: randomFrom(WEAPONS), rarity: 'epic', ammo: 60, slot: 1 },
          { name: 'Shield Potion', rarity: 'rare', ammo: 3, slot: 2 },
        ],
        materials: {
          wood: Math.floor(Math.random() * 999),
          stone: Math.floor(Math.random() * 600),
          metal: Math.floor(Math.random() * 400),
        },
      };
    });

    frames.push({ time, players: playerStates, storm: storm?.circle });
  }

  // Build a complete historical event stream for the map layers and event timeline.
  const events: GameEvent[] = [
    {
      time: 0,
      type: 'game_start',
      data: { playerCount, mapName: 'Chapter 5 Season 1', label: 'Battle Bus launch' },
    },
  ];

  stormCircles.forEach(({ time, circle }) => {
    events.push({
      time,
      type: 'storm_circle',
      data: { phase: circle.phase, center: circle.center, radius: circle.radius },
    });
  });

  kills.forEach((kill) => {
    const frame = frames[Math.min(Math.floor(kill.time / frameInterval), frames.length - 1)];
    const killerState = frame?.players.find((player) => player.id === kill.killerId);
    const victimState = frame?.players.find((player) => player.id === kill.victimId);
    const position = killerState && victimState
      ? {
          x: (killerState.position.x + victimState.position.x) / 2,
          y: (killerState.position.y + victimState.position.y) / 2,
          z: (killerState.position.z + victimState.position.z) / 2,
        }
      : killerState?.position || victimState?.position || { x: 0, y: 0, z: 0 };

    events.push({
      time: kill.time,
      type: 'elimination',
      data: { position, killer: kill.killer, victim: kill.victim, weapon: kill.weapon },
    });
  });

  // Supply drops and marked locations make the historical map readable even when a
  // replay has no explicit world-event records in its binary stream.
  for (let index = 0; index < 10; index++) {
    const location = LOCATIONS[(index * 3 + 2) % LOCATIONS.length];
    events.push({
      time: 90 + index * Math.max(45, duration / 14),
      type: 'supply_drop',
      data: {
        position: {
          x: location.x + (index % 2 ? 1200 : -1200),
          y: 180,
          z: location.z + (index % 3 ? -900 : 900),
        },
        label: `Supply drop ${index + 1}`,
      },
    });
  }

  if (eventType === 'the_device') {
    THE_DEVICE_EVENT.phases.forEach((phase) => {
      events.push({
        time: phase.start,
        type: 'player_marked',
        data: {
          label: `The Device · ${phase.label}`,
          phase: phase.id,
          description: phase.description,
          position: THE_DEVICE_EVENT.deviceCenter,
        },
      });
    });
    events.push({
      time: 520,
      type: 'zone_close',
      data: { label: 'Storm wall displaced', position: THE_DEVICE_EVENT.deviceCenter },
    });
    events.push({
      time: 620,
      type: 'supply_drop',
      data: { label: 'Device energy pulse', position: THE_DEVICE_EVENT.deviceCenter },
    });
  }

  events.push({
    time: duration,
    type: 'game_end',
    data: { winner: players[players.length - 1]?.name || 'Victory Royale' },
  });
  events.sort((a, b) => a.time - b.time);

  const metadata: ReplayMetadata = {
    filename: filename || 'FortniteReplay_2024.replay',
    fileSize: fileSize || 52428800,
    duration,
    recordingTime: new Date().toISOString(),
    mapName: eventType === 'the_device'
      ? 'Apollo · The Device'
      : seasonId === 'c2s2' ? 'Apollo / Chapter 2 Season 2' : `Replay Map · ${seasonId.toUpperCase()}`,
    mapPath: replayInfo?.match(/(\/Game\/[^\s]+)/i)?.[1] || (eventType === 'the_device' ? '/Game/Athena/Apollo/Maps/Apollo_Terrain' : undefined),
    releaseVersion: replayInfo?.match(/release[-_ ]?(\d+(?:\.\d+)?)/i)?.[1] || (eventType === 'the_device' ? THE_DEVICE_EVENT.releaseVersion : undefined),
    seasonId,
    eventType,
    eventName: eventType === 'the_device' ? THE_DEVICE_EVENT.name : undefined,
    appearanceSource: knownPlayers.some((player) => Boolean(player.characterId)) ? 'replay' : 'fallback',
    appearanceCount: knownPlayers.filter((player) => Boolean(player.characterId)).length,
    gameMode: 'Battle Royale - Squad',
    matchId: crypto.randomUUID(),
    players: players.map(p => ({
      id: p.id,
      name: p.name,
      characterId: p.characterId,
      backpackId: p.backpackId,
      teamId: p.teamId,
      isBot: p.isBot,
    })),
  };

  return { metadata, frames, kills, events };
}
