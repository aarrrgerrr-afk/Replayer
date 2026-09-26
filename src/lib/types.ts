export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface PlayerSkin {
  name: string;
  id?: string;
  source?: 'replay' | 'catalog' | 'estimated';
  primaryColor: string;
  accentColor: string;
  style: 'human' | 'masked' | 'robot' | 'animal' | 'knight' | 'tech';
}

export interface PlayerState {
  id: number;
  name: string;
  skin?: PlayerSkin;
  health: number;
  shield: number;
  position: Vector3;
  rotation: number;
  isAlive: boolean;
  knocked: boolean;
  teamId: number;
  inventory: InventoryItem[];
  materials: { wood: number; stone: number; metal: number };
}

export interface InventoryItem {
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  ammo: number;
  slot: number;
}

export interface KillEvent {
  time: number;
  killer: string;
  killerId: number;
  victim: string;
  victimId: number;
  weapon: string;
  distance: number;
  isHeadshot: boolean;
  damage?: number;
}

export interface GameEvent {
  time: number;
  type: 'storm_circle' | 'supply_drop' | 'elimination' | 'zone_close' | 'game_start' | 'game_end' | 'player_marked';
  data: Record<string, unknown>;
}

export interface Bookmark {
  id: string;
  time: number;
  label: string;
  type: 'kill' | 'death' | 'highlight' | 'custom';
  playerId?: number;
}

export interface PlayerStats {
  playerId: number;
  name: string;
  kills: number;
  damageDealt: number;
  damageTaken: number;
  headshots: number;
  accuracy: number;
  timeAlive: number;
  placement: number;
}

export interface StormCircle {
  center: Vector3;
  radius: number;
  phase: number;
}

export interface ReplayMetadata {
  filename: string;
  fileSize: number;
  duration: number;
  recordingTime: string;
  mapName: string;
  mapPath?: string;
  releaseVersion?: string;
  seasonId?: import('./map-presets').SeasonId;
  eventType?: import('./event-presets').LiveEventId;
  eventName?: string;
  appearanceSource?: 'replay' | 'fallback';
  appearanceCount?: number;
  gameMode: string;
  matchId: string;
  players: PlayerMeta[];
}

export interface PlayerMeta {
  id: number;
  name: string;
  characterId?: string;
  backpackId?: string;
  teamId: number;
  isBot: boolean;
}

export interface ReplayFrame {
  time: number;
  players: PlayerState[];
  storm?: StormCircle;
}

export interface ReplayData {
  metadata: ReplayMetadata;
  frames: ReplayFrame[];
  kills: KillEvent[];
  events: GameEvent[];
}
