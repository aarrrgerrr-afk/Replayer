import { create } from 'zustand';
import type { ReplayData, PlayerState, KillEvent } from './types';
import type { SeasonId } from './map-presets';
import type { LiveEventId } from './event-presets';
import { normalizeReplayIdentities, getFallbackPlayerName } from './player-identity';

interface ReplayStore {
  // Data
  replayData: ReplayData | null;
  isLoaded: boolean;
  isLoading: boolean;
  loadError: string | null;

  // Playback
  isPlaying: boolean;
  currentTime: number;
  playbackSpeed: number;
  duration: number;

  // UI state
  selectedPlayerId: number | null;
  followPlayer: boolean;
  showKillFeed: boolean;
  showMinimap: boolean;
  showPlayerList: boolean;
  showStorm: boolean;
  showTrails: boolean;
  showPOIs: boolean;
  showKillMarkers: boolean;
  showTerrain: boolean;
  activeSeason: SeasonId;
  mapView: '3d' | 'explore';
  cameraMode: 'free' | 'player' | 'top' | 'first-person' | 'third-person';
  
  // Event mode
  eventMode: boolean;
  currentEventId: LiveEventId | null;

  // Derived data
  currentFrame: PlayerState[];
  currentStorm: ReplayData['frames'][0]['storm'];
  recentKills: KillEvent[];

  // Actions
  setReplayData: (data: ReplayData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  tick: (deltaTime: number) => void;
  selectPlayer: (id: number | null) => void;
  setFollowPlayer: (follow: boolean) => void;
  setCameraMode: (mode: 'free' | 'player' | 'top' | 'first-person' | 'third-person') => void;
  toggleKillFeed: () => void;
  toggleMinimap: () => void;
  togglePlayerList: () => void;
  toggleStorm: () => void;
  toggleTrails: () => void;
  togglePOIs: () => void;
  toggleKillMarkers: () => void;
  toggleTerrain: () => void;
  setActiveSeason: (season: SeasonId) => void;
  setMapView: (view: '3d' | 'explore') => void;
  setEventMode: (mode: boolean) => void;
  setCurrentEventId: (eventId: LiveEventId | null) => void;
  reset: () => void;
}

function interpolateFrame(frames: ReplayData['frames'], time: number) {
  if (frames.length === 0) return { players: [], storm: undefined };

  // Find surrounding frames
  let low = 0;
  let high = frames.length - 1;

  while (low < high - 1) {
    const mid = Math.floor((low + high) / 2);
    if (frames[mid].time <= time) low = mid;
    else high = mid;
  }

  const frameA = frames[low];
  const frameB = frames[Math.min(high, frames.length - 1)];

  if (!frameB || frameA.time === frameB.time) {
    return { players: frameA.players || [], storm: frameA.storm };
  }

  const t = (time - frameA.time) / (frameB.time - frameA.time);

  const lerpVal = (a: number, b: number) => a + (b - a) * t;

  // Interpolate player positions
  const playerMap = new Map<number, PlayerState>();

  for (const pA of frameA.players || []) {
    const pB = (frameB.players || []).find(p => p.id === pA.id);
    if (!pB) {
      playerMap.set(pA.id, pA);
      continue;
    }

    if (!pA.isAlive && !pB.isAlive) {
      playerMap.set(pA.id, pA);
      continue;
    }

    playerMap.set(pA.id, {
      ...pA,
      name: pA.name || getFallbackPlayerName(pA.id),
      position: {
        x: lerpVal(pA.position.x, pB.position.x),
        y: lerpVal(pA.position.y, pB.position.y),
        z: lerpVal(pA.position.z, pB.position.z),
      },
      rotation: lerpVal(pA.rotation, pB.rotation),
      health: pA.isAlive ? lerpVal(pA.health, pB.health) : 0,
      shield: pA.isAlive ? lerpVal(pA.shield, pB.shield) : 0,
      isAlive: pA.isAlive || pB.isAlive,
    });
  }

  // Interpolate storm
  const storm = frameA.storm && frameB.storm
    ? {
        center: {
          x: lerpVal(frameA.storm.center.x, frameB.storm.center.x),
          y: 0,
          z: lerpVal(frameA.storm.center.z, frameB.storm.center.z),
        },
        radius: lerpVal(frameA.storm.radius, frameB.storm.radius),
        phase: frameA.storm.phase,
      }
    : frameA.storm;

  return { players: Array.from(playerMap.values()), storm };
}

export const useReplayStore = create<ReplayStore>((set, get) => ({
  replayData: null,
  isLoaded: false,
  isLoading: false,
  loadError: null,

  isPlaying: false,
  currentTime: 0,
  playbackSpeed: 1,
  duration: 0,

  selectedPlayerId: null,
  followPlayer: true,
  showKillFeed: true,
  showMinimap: true,
  showPlayerList: true,
  showStorm: true,
  showTrails: true,
  showPOIs: true,
  showKillMarkers: true,
  showTerrain: true,
  activeSeason: 'c5s1',
  mapView: '3d',
  cameraMode: 'free',
  eventMode: false,
  currentEventId: null,

  currentFrame: [],
  currentStorm: undefined,
  recentKills: [],

  setReplayData: (data) => {
    const normalizedData = normalizeReplayIdentities(data);
    set({
      replayData: normalizedData,
      isLoaded: true,
      isLoading: false,
      loadError: null,
      duration: normalizedData.metadata.duration,
      activeSeason: normalizedData.metadata.seasonId || get().activeSeason,
      currentTime: 0,
      isPlaying: false,
      currentFrame: normalizedData.frames[0]?.players || [],
      currentStorm: normalizedData.frames[0]?.storm,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ loadError: error, isLoading: false }),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  seek: (time) => {
    const { replayData } = get();
    if (!replayData) return;
    const clamped = Math.max(0, Math.min(time, replayData.metadata.duration));
    const { players, storm } = interpolateFrame(replayData.frames, clamped);
    const recentKills = replayData.kills.filter(
      (k) => k.time >= clamped - 10 && k.time <= clamped
    );
    set({ currentTime: clamped, currentFrame: players, currentStorm: storm, recentKills });
  },

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  tick: (deltaTime) => {
    const { isPlaying, currentTime, playbackSpeed, replayData, duration } = get();
    if (!isPlaying || !replayData) return;

    const newTime = currentTime + deltaTime * playbackSpeed;
    if (newTime >= duration) {
      const { players, storm } = interpolateFrame(replayData.frames, duration);
      set({ currentTime: duration, isPlaying: false, currentFrame: players, currentStorm: storm });
      return;
    }

    const { players, storm } = interpolateFrame(replayData.frames, newTime);
    const recentKills = replayData.kills.filter(
      (k) => k.time >= newTime - 8 && k.time <= newTime
    );
    set({ currentTime: newTime, currentFrame: players, currentStorm: storm, recentKills });
  },

  selectPlayer: (id) => set({ selectedPlayerId: id }),
  setFollowPlayer: (follow) => set({ followPlayer: follow }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  toggleKillFeed: () => set((s) => ({ showKillFeed: !s.showKillFeed })),
  toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),
  togglePlayerList: () => set((s) => ({ showPlayerList: !s.showPlayerList })),
  toggleStorm: () => set((s) => ({ showStorm: !s.showStorm })),
  toggleTrails: () => set((s) => ({ showTrails: !s.showTrails })),
  togglePOIs: () => set((s) => ({ showPOIs: !s.showPOIs })),
  toggleKillMarkers: () => set((s) => ({ showKillMarkers: !s.showKillMarkers })),
  toggleTerrain: () => set((s) => ({ showTerrain: !s.showTerrain })),
  setActiveSeason: (season) => set({ activeSeason: season }),
  setMapView: (view) => set({ mapView: view }),
  setEventMode: (mode) => set({ eventMode: mode }),
  setCurrentEventId: (eventId) => set({ currentEventId: eventId }),

  reset: () =>
    set({
      replayData: null,
      isLoaded: false,
      isLoading: false,
      loadError: null,
      isPlaying: false,
      currentTime: 0,
      playbackSpeed: 1,
      duration: 0,
      selectedPlayerId: null,
      followPlayer: true,
      showTrails: true,
      showPOIs: true,
      showKillMarkers: true,
      showTerrain: true,
      activeSeason: 'c5s1',
      mapView: '3d',
      eventMode: false,
      currentEventId: null,
      currentFrame: [],
      currentStorm: undefined,
      recentKills: [],
    }),
}));
