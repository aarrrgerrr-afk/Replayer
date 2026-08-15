'use client';

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, OrbitControls, Text } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinnedModel } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { useReplayStore } from '@/lib/replay-store';
import { getMapPreset } from '@/lib/map-presets';
import type { MapPoi, MapTheme } from '@/lib/map-presets';
import { resolveSeasonMapAsset } from '@/lib/map-archive';
import type { ArchiveMapAsset } from '@/lib/map-archive';
import { getDeviceEventPhase, getDeviceEventProgress, THE_DEVICE_EVENT } from '@/lib/event-presets';
import { getFallbackPlayerName } from '@/lib/player-identity';
import { skinAssetKey, useSkinAssets } from '@/lib/skin-catalog';
import type { FortniteSkinAsset } from '@/lib/skin-catalog';
import { localSkinAssetKey, useLocalSkinAssets } from '@/lib/local-skin-assets';
import type { LocalSkinAsset } from '@/lib/local-skin-assets';
import type { GameEvent, KillEvent, PlayerState, StormCircle, Vector3 } from '@/lib/types';

const SCALE = 0.000085;
const ISLAND_RADIUS = 4.45;

function w2s(position: Vector3, y = 0): [number, number, number] {
  return [position.x * SCALE, y + position.y * SCALE * 0.05, position.z * SCALE];
}

function worldLine(points: Vector3[], y = 0.025): [number, number, number][] {
  return points.map((point) => w2s(point, y));
}

// A broad Chapter 1-style island catalogue. The map layer is intentionally data-driven
// so a real replay decoder can replace this catalogue with its map's POIs later.
const POIS = [
  { name: 'Tilted Towers', x: -8000, z: -20000, color: '#ff5368', size: 'major' },
  { name: 'Salty Springs', x: 2000, z: 4000, color: '#ffb347', size: 'major' },
  { name: 'Pleasant Park', x: -12000, z: 8000, color: '#52d273', size: 'major' },
  { name: 'Retail Row', x: 16000, z: 4000, color: '#ff914d', size: 'major' },
  { name: 'Dusty Depot', x: 0, z: -6000, color: '#a56bff', size: 'major' },
  { name: 'Loot Lake', x: -4000, z: -8000, color: '#39c6ff', size: 'major' },
  { name: 'Sunny Steps', x: 14000, z: -28000, color: '#ffc14d', size: 'major' },
  { name: 'Lucky Landing', x: 10000, z: 30000, color: '#ff66a8', size: 'major' },
  { name: 'Fatal Fields', x: 0, z: 26000, color: '#dbad4c', size: 'major' },
  { name: 'Wailing Woods', x: 26000, z: -8000, color: '#54ba62', size: 'major' },
  { name: 'Risky Reels', x: 22000, z: -4000, color: '#ff795b', size: 'major' },
  { name: 'Tomato Temple', x: 20000, z: -16000, color: '#ff7043', size: 'major' },
  { name: 'Haunted Hills', x: -26000, z: 14000, color: '#9a62db', size: 'major' },
  { name: 'Junk Junction', x: -28000, z: -14000, color: '#a9a9a9', size: 'major' },
  { name: 'Shifty Shafts', x: -10000, z: 18000, color: '#d39449', size: 'major' },
  { name: 'Greasy Grove', x: -16000, z: 12000, color: '#4ac894', size: 'major' },
  { name: 'Flush Factory', x: -14000, z: 28000, color: '#a7b2c8', size: 'major' },
  { name: 'Lonely Lodge', x: 28000, z: 8000, color: '#79b65b', size: 'major' },
  { name: 'Paradise Palms', x: 14000, z: 24000, color: '#f4c85c', size: 'major' },
  { name: 'Livid Farm', x: -20000, z: -4000, color: '#72ca67', size: 'major' },
  { name: 'The Block', x: -6000, z: -2000, color: '#c6d0d3', size: 'minor' },
  { name: 'Snobby Shores', x: -28000, z: -2000, color: '#8fd4ed', size: 'minor' },
  { name: 'Valley Villas', x: -18000, z: -12000, color: '#d0a5e8', size: 'minor' },
  { name: 'Tiny Town', x: 6000, z: -12000, color: '#f1aa8a', size: 'minor' },
  { name: 'East of Tilted', x: -2000, z: -22000, color: '#e991a2', size: 'minor' },
  { name: 'North of Retail', x: 18000, z: -4000, color: '#eec68a', size: 'minor' },
  { name: 'South of Pleasant', x: -8000, z: 2000, color: '#86d28d', size: 'minor' },
  { name: 'Dusty Divot', x: 0, z: -4000, color: '#8d71df', size: 'minor' },
  { name: 'Champion Speedway', x: -20000, z: 8000, color: '#53b2e7', size: 'minor' },
  { name: 'Polar Peak', x: 4000, z: 30000, color: '#a6d5ed', size: 'minor' },
  { name: 'Happy Hamlet', x: 10000, z: 36000, color: '#f0a7ad', size: 'minor' },
  { name: 'Viking Village', x: -24000, z: -20000, color: '#82b7d9', size: 'minor' },
  { name: 'Frosty Flights', x: -10000, z: 34000, color: '#c6d9ee', size: 'minor' },
  { name: 'Eye Land', x: 4000, z: -4000, color: '#53e18e', size: 'minor' },
];

type Poi = (typeof POIS)[number];

const TERRAIN_PATCHES = [
  { x: -22000, z: -18000, radius: 17000, color: '#243e34', opacity: 0.8 },
  { x: 16000, z: -17000, radius: 15000, color: '#403c26', opacity: 0.72 },
  { x: 18000, z: 18000, radius: 18000, color: '#44351f', opacity: 0.78 },
  { x: -19000, z: 22000, radius: 17000, color: '#314c30', opacity: 0.76 },
  { x: 0, z: 0, radius: 15000, color: '#243c42', opacity: 0.62 },
  { x: -4000, z: -8000, radius: 6500, color: '#14506a', opacity: 0.85 },
];

const ROAD_NETWORK: Vector3[][] = [
  [{ x: -30000, y: 0, z: -15000 }, { x: -16000, y: 0, z: -12000 }, { x: -8000, y: 0, z: -20000 }, { x: 2000, y: 0, z: -13000 }, { x: 16000, y: 0, z: -16000 }, { x: 28000, y: 0, z: -10000 }],
  [{ x: -26000, y: 0, z: 14000 }, { x: -12000, y: 0, z: 8000 }, { x: 2000, y: 0, z: 4000 }, { x: 16000, y: 0, z: 4000 }, { x: 28000, y: 0, z: 8000 }],
  [{ x: -14000, y: 0, z: 28000 }, { x: -9000, y: 0, z: 18000 }, { x: 0, y: 0, z: 26000 }, { x: 14000, y: 0, z: 24000 }, { x: 10000, y: 0, z: 36000 }],
  [{ x: -28000, y: 0, z: -14000 }, { x: -12000, y: 0, z: -6000 }, { x: 0, y: 0, z: -6000 }, { x: 22000, y: 0, z: -4000 }, { x: 26000, y: 0, z: -8000 }],
  [{ x: -24000, y: 0, z: -20000 }, { x: -8000, y: 0, z: -20000 }, { x: 0, y: 0, z: -6000 }, { x: 14000, y: 0, z: 4000 }, { x: 14000, y: 0, z: 24000 }],
];

const RIVER_PATHS: Vector3[][] = [
  [{ x: -35000, y: 0, z: 26000 }, { x: -25000, y: 0, z: 17000 }, { x: -12000, y: 0, z: 8000 }, { x: -4000, y: 0, z: -8000 }, { x: 9000, y: 0, z: -26000 }],
  [{ x: -4000, y: 0, z: -8000 }, { x: 1000, y: 0, z: 0 }, { x: 9000, y: 0, z: 12000 }, { x: 12000, y: 0, z: 36000 }],
];

const TEAM_COLORS = ['#00ff9d', '#ff5c7c', '#4fc8ff', '#ffbf5c', '#b477ff', '#f783ff'];

function teamColor(player: PlayerState): string {
  return TEAM_COLORS[Math.abs(player.teamId) % TEAM_COLORS.length] || '#00ff9d';
}

function ArchiveSurface({
  seasonId,
  releaseVersion,
  theme,
  visible,
  onStatus,
}: {
  seasonId: Parameters<typeof getMapPreset>[0];
  releaseVersion?: string;
  theme: MapTheme;
  visible: boolean;
  onStatus: (status: 'loading' | 'authentic' | 'fallback') => void;
}) {
  const { gl } = useThree();
  const [asset, setAsset] = React.useState<ArchiveMapAsset | null>(null);
  const [mapTexture, setMapTexture] = React.useState<THREE.Texture | null>(null);
  const [heightTexture, setHeightTexture] = React.useState<THREE.Texture | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setAsset(null);
    setMapTexture(null);
    setHeightTexture(null);
    onStatus('loading');
    resolveSeasonMapAsset(seasonId, releaseVersion).then((resolved) => {
      if (cancelled) return;
      if (!resolved) onStatus('fallback');
      setAsset(resolved);
    });
    return () => { cancelled = true; };
  }, [onStatus, releaseVersion, seasonId]);

  React.useEffect(() => {
    if (!asset?.imageUrl || !visible) return;
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(asset.imageUrl, (texture) => {
      if (cancelled) return;
      texture.anisotropy = gl.capabilities.getMaxAnisotropy();
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      setMapTexture(texture);
      onStatus('authentic');
    }, undefined, () => {
      if (!cancelled) {
        setMapTexture(null);
        if (!asset.heightmapUrl) onStatus('fallback');
      }
    });
    return () => { cancelled = true; };
  }, [asset, gl, onStatus, visible]);

  React.useEffect(() => {
    if (!asset?.heightmapUrl || !visible) return;
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(asset.heightmapUrl, (texture) => {
      if (cancelled) return;
      texture.anisotropy = gl.capabilities.getMaxAnisotropy();
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.needsUpdate = true;
      setHeightTexture(texture);
      onStatus('authentic');
    }, undefined, () => {
      if (!cancelled) setHeightTexture(null);
    });
    return () => { cancelled = true; };
  }, [asset, gl, onStatus, visible]);

  if (!visible || (!mapTexture && !heightTexture)) return null;

  return (
    <group>
      {heightTexture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
          <planeGeometry args={[8.65, 8.65, 160, 160]} />
          <meshStandardMaterial
            color={theme.landSecondary}
            roughness={1}
            displacementMap={heightTexture}
            displacementScale={0.34}
          />
        </mesh>
      )}
      {mapTexture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.068, 0]}>
          <planeGeometry args={[8.8, 8.8]} />
          <meshBasicMaterial map={mapTexture} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function Terrain({ theme }: { theme: MapTheme }) {
  const islandShape = useMemo(() => {
    const shape = new THREE.Shape();
    const outline = [
      [-0.25, -4.36], [1.15, -4.18], [2.4, -3.55], [3.55, -2.55],
      [4.35, -1.05], [4.28, 0.65], [3.72, 2.0], [2.63, 3.42],
      [1.08, 4.25], [-0.55, 4.36], [-2.12, 3.85], [-3.43, 2.72],
      [-4.22, 1.22], [-4.4, -0.48], [-3.8, -2.06], [-2.7, -3.35],
      [-1.35, -4.1],
    ];
    shape.moveTo(outline[0][0], outline[0][1]);
    outline.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
    shape.closePath();
    return shape;
  }, []);

  return (
    <group>
      {/* Deep ocean */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <planeGeometry args={[24, 24]} />
        <meshBasicMaterial color={theme.ocean} />
      </mesh>
      {/* Island silhouette */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <shapeGeometry args={[islandShape]} />
        <meshStandardMaterial color={theme.land} roughness={1} metalness={0} />
      </mesh>
      {/* Coastal rim */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[4.2, 4.44, 96]} />
        <meshBasicMaterial color={theme.water} transparent opacity={0.42} side={THREE.DoubleSide} />
      </mesh>
      {/* Terrain color regions */}
      {TERRAIN_PATCHES.map((patch, index) => {
        const colors = [theme.regionA, theme.regionB, theme.regionC, theme.landSecondary, theme.regionC, theme.water];
        return (
          <mesh key={`${patch.x}-${patch.z}`} rotation={[-Math.PI / 2, 0, 0]} position={[patch.x * SCALE, 0.005, patch.z * SCALE]}>
            <circleGeometry args={[patch.radius * SCALE, 48]} />
            <meshBasicMaterial color={colors[index % colors.length]} transparent opacity={patch.opacity} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      {/* Lake */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4000 * SCALE, 0.025, -8000 * SCALE]}>
        <circleGeometry args={[0.63, 48]} />
        <meshBasicMaterial color={theme.water} transparent opacity={0.86} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4000 * SCALE, 0.03, -8000 * SCALE]}>
        <ringGeometry args={[0.62, 0.68, 48]} />
        <meshBasicMaterial color={theme.accent} transparent opacity={0.38} side={THREE.DoubleSide} />
      </mesh>
      {/* Topographic contour rings */}
      {[1.3, 2.05, 2.8, 3.55, 4.2].map((radius) => (
        <mesh key={radius} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <ringGeometry args={[radius, radius + 0.008, 96]} />
          <meshBasicMaterial color={theme.landSecondary} transparent opacity={0.14} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Roads */}
      {ROAD_NETWORK.map((road, index) => (
        <React.Fragment key={`road-${index}`}>
          <Line points={worldLine(road, 0.035)} color={theme.landSecondary} lineWidth={3} transparent opacity={0.34} />
          <Line points={worldLine(road, 0.039)} color={theme.accent} lineWidth={0.8} transparent opacity={0.55} />
        </React.Fragment>
      ))}
      {/* Rivers */}
      {RIVER_PATHS.map((river, index) => (
        <React.Fragment key={`river-${index}`}>
          <Line points={worldLine(river, 0.042)} color={theme.water} lineWidth={6} transparent opacity={0.25} />
          <Line points={worldLine(river, 0.045)} color={theme.accent} lineWidth={1.6} transparent opacity={0.68} />
        </React.Fragment>
      ))}
      {/* Tactical grid */}
      <gridHelper args={[9.2, 46, theme.grid, theme.gridMinor]} position={[0, 0.06, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.064, 0]}>
        <ringGeometry args={[4.43, 4.5, 128]} />
        <meshBasicMaterial color={theme.accent} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function MountainDecor({ theme }: { theme: MapTheme }) {
  const mountains = [
    [-3.1, -2.9, 0.28], [-2.7, -3.1, 0.19], [2.8, -2.5, 0.25],
    [2.9, 2.45, 0.3], [1.2, 3.2, 0.2], [-3.15, 1.8, 0.22],
    [-1.3, 2.9, 0.18], [0.2, -3.1, 0.22],
  ];

  return (
    <group>
      {mountains.map(([x, z, radius], index) => (
        <mesh key={index} position={[x, radius * 0.55, z]}>
          <coneGeometry args={[radius, radius * 1.1, 6]} />
          <meshStandardMaterial color={index % 2 ? theme.landSecondary : theme.land} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function POIMarkers({ visible, pois }: { visible: boolean; pois: MapPoi[] }) {
  if (!visible) return null;

  const buildingOffsets = [[-420, -260], [330, -280], [-260, 260], [380, 240], [0, 0]];

  return (
    <group>
      {pois.map((poi: MapPoi, index) => {
        const isMajor = poi.size === 'major';
        const position: [number, number, number] = [poi.x * SCALE, 0.07, poi.z * SCALE];
        const dotSize = isMajor ? 0.026 : 0.014;

        return (
          <group key={`${poi.name}-${index}`} position={position}>
            {isMajor && (
              <>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.055, 0]}>
                  <circleGeometry args={[0.14, 24]} />
                  <meshBasicMaterial color={poi.color} transparent opacity={0.08} side={THREE.DoubleSide} />
                </mesh>
                {buildingOffsets.map(([x, z], buildingIndex) => (
                  <mesh key={buildingIndex} position={[x * SCALE, 0.09 + (buildingIndex % 2) * 0.012, z * SCALE]}>
                    <boxGeometry args={[0.065, 0.05 + (buildingIndex % 3) * 0.02, 0.065]} />
                    <meshBasicMaterial color={poi.color} transparent opacity={0.22} />
                  </mesh>
                ))}
              </>
            )}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[dotSize, dotSize * 0.75, isMajor ? 0.045 : 0.025, 12]} />
              <meshBasicMaterial color={poi.color} transparent opacity={isMajor ? 0.96 : 0.62} />
            </mesh>
            <Text
              position={[0, isMajor ? 0.12 : 0.075, 0]}
              fontSize={isMajor ? 0.048 : 0.028}
              color={poi.color}
              anchorX="center"
              anchorY="bottom"
              outlineWidth={0.003}
              outlineColor="#050508"
              maxWidth={isMajor ? 0.9 : 0.65}
            >
              {poi.name}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function PlayerTrail({ positions, color, selected }: { positions: Vector3[]; color: string; selected: boolean }) {
  if (positions.length < 2) return null;
  return (
    <Line
      points={positions.map((position) => w2s(position, 0.08))}
      color={color}
      lineWidth={selected ? 2.8 : 1.1}
      transparent
      opacity={selected ? 0.9 : 0.28}
      dashed={!selected}
      dashSize={0.025}
      gapSize={0.016}
    />
  );
}

function findFrameAtTime(frames: { time: number; players: PlayerState[] }[], time: number) {
  if (!frames.length) return undefined;
  let low = 0;
  let high = frames.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (frames[middle].time <= time) low = middle;
    else high = middle - 1;
  }
  return frames[low];
}

function fallbackEventPosition(seedA: number, seedB: number): Vector3 {
  return {
    x: Math.sin(seedA * 13.7) * 30000 + Math.cos(seedB * 7.3) * 12000,
    y: 0,
    z: Math.cos(seedA * 11.3) * 26000 + Math.sin(seedB * 9.1) * 11000,
  };
}

function killPosition(kill: KillEvent, frames: { time: number; players: PlayerState[] }[]): Vector3 {
  const frame = findFrameAtTime(frames, kill.time);
  const killer = frame?.players.find((player) => player.id === kill.killerId);
  const victim = frame?.players.find((player) => player.id === kill.victimId);
  if (killer && victim) {
    return {
      x: (killer.position.x + victim.position.x) / 2,
      y: (killer.position.y + victim.position.y) / 2,
      z: (killer.position.z + victim.position.z) / 2,
    };
  }
  return killer?.position || victim?.position || fallbackEventPosition(kill.killerId, kill.victimId);
}

function KillMarkers({
  kills,
  frames,
  currentTime,
  visible,
}: {
  kills: KillEvent[];
  frames: { time: number; players: PlayerState[] }[];
  currentTime: number;
  visible: boolean;
}) {
  if (!visible) return null;

  const olderKills = kills.filter((kill) => kill.time <= currentTime - 45).slice(-80);
  const recentKills = kills.filter((kill) => kill.time <= currentTime && kill.time > currentTime - 45);

  return (
    <group>
      {olderKills.map((kill, index) => {
        const position = w2s(killPosition(kill, frames), 0.095);
        return (
          <mesh key={`old-kill-${kill.time}-${index}`} position={position}>
            <sphereGeometry args={[0.009, 8, 8]} />
            <meshBasicMaterial color="#ff496d" transparent opacity={0.34} />
          </mesh>
        );
      })}
      {recentKills.map((kill, index) => {
        const age = Math.max(0, Math.min(1, (currentTime - kill.time) / 45));
        const position = w2s(killPosition(kill, frames), 0.12);
        return (
          <group key={`recent-kill-${kill.time}-${index}`} position={position}>
            <mesh>
              <octahedronGeometry args={[0.026]} />
              <meshBasicMaterial color="#ff3f64" transparent opacity={1 - age * 0.45} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.035, 0.045, 20]} />
              <meshBasicMaterial color="#ff3f64" transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
            <Text position={[0, 0.065, 0]} fontSize={0.022} color="#ff7890" anchorX="center" anchorY="bottom" outlineWidth={0.002} outlineColor="#050508">
              {kill.victim || 'Elimination'}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function EventMarkers({ events, currentTime }: { events: GameEvent[]; currentTime: number }) {
  const visibleEvents = events.filter(
    (event) => event.time <= currentTime && (event.type === 'supply_drop' || event.type === 'player_marked')
  );
  return (
    <group>
      {visibleEvents.slice(-50).map((event, index) => {
        const rawPosition = event.data.position as Partial<Vector3> | undefined;
        const eventPosition: Vector3 = rawPosition && typeof rawPosition.x === 'number' && typeof rawPosition.z === 'number'
          ? { x: rawPosition.x, y: rawPosition.y || 0, z: rawPosition.z }
          : fallbackEventPosition(event.time, index + 17);
        const position = w2s(eventPosition, 0.11);
        const isSupply = event.type === 'supply_drop';
        const color = isSupply ? '#ffc94d' : '#56d5ff';
        return (
          <group key={`${event.type}-${event.time}-${index}`} position={position}>
            <mesh>
              <boxGeometry args={[0.025, 0.025, 0.025]} />
              <meshBasicMaterial color={color} transparent opacity={0.9} />
            </mesh>
            <Text position={[0, 0.055, 0]} fontSize={0.018} color={color} anchorX="center" anchorY="bottom" outlineWidth={0.002} outlineColor="#050508">
              {isSupply ? 'SUPPLY' : 'MARK'}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

function StormVisualization({ circle, visible }: { circle?: StormCircle; visible: boolean }) {
  if (!circle || !visible) return null;
  const position = w2s(circle.center, 0);
  const radius = circle.radius * SCALE;
  return (
    <group>
      <mesh position={[position[0], 0.018, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius, radius + 4.5, 128]} />
        <meshBasicMaterial color="#7132bc" transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[position[0], 0.025, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.012, radius + 0.012, 128]} />
        <meshBasicMaterial color="#41c9ff" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[position[0], 0.021, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.045, radius - 0.025, 128]} />
        <meshBasicMaterial color="#a869ff" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[position[0], 0.08, position[2]]} fontSize={0.035} color="#c18cff" anchorX="center" anchorY="bottom" outlineWidth={0.003} outlineColor="#050508">
        {`ZONE ${circle.phase + 1}`}
      </Text>
    </group>
  );
}

function LocalSkinModel({
  asset,
  selected,
  onReady,
}: {
  asset?: LocalSkinAsset;
  selected: boolean;
  onReady: (ready: boolean) => void;
}) {
  const [model, setModel] = React.useState<THREE.Object3D | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setModel(null);
    onReady(false);

    if (!asset?.url) return () => { cancelled = true; };

    const loader = new GLTFLoader();
    loader.load(asset.url, (gltf) => {
      if (cancelled) return;

      const scene = cloneSkinnedModel(gltf.scene);
      const bounds = new THREE.Box3().setFromObject(scene);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const sourceHeight = Math.max(size.y, size.x, size.z, 0.001);
      const targetHeight = selected ? 0.17 : 0.13;
      const scale = targetHeight / sourceHeight;

      scene.scale.setScalar(scale);
      // Put the feet on the replay world plane and center the exported model.
      scene.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.castShadow = false;
        object.receiveShadow = false;
        object.frustumCulled = true;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          material.transparent = material.transparent || false;
          material.needsUpdate = true;
        });
      });

      setModel(scene);
      onReady(true);
    }, undefined, () => {
      if (!cancelled) onReady(false);
    });

    return () => { cancelled = true; };
  }, [asset?.url, onReady, selected]);

  if (!model) return null;
  return <primitive object={model} />;
}

function SkinPortrait({ asset, selected }: { asset?: FortniteSkinAsset; selected: boolean }) {
  const [texture, setTexture] = React.useState<THREE.Texture | null>(null);

  React.useEffect(() => {
    if (!asset?.iconUrl) {
      setTexture(null);
      return;
    }

    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(asset.iconUrl, (loadedTexture) => {
      if (cancelled) return;
      loadedTexture.colorSpace = THREE.SRGBColorSpace;
      loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
      loadedTexture.magFilter = THREE.LinearFilter;
      loadedTexture.generateMipmaps = true;
      loadedTexture.needsUpdate = true;
      setTexture(loadedTexture);
    }, undefined, () => {
      if (!cancelled) setTexture(null);
    });

    return () => { cancelled = true; };
  }, [asset?.iconUrl]);

  if (!texture) return null;

  const size = selected ? 0.094 : 0.068;
  return (
    <sprite position={[0, 0.06, 0.025]} scale={[size, size, 1]} renderOrder={4}>
      <spriteMaterial map={texture} transparent alphaTest={0.08} depthWrite={false} depthTest={false} toneMapped={false} />
    </sprite>
  );
}

function PlayerDot({
  player,
  selected,
  skinAsset,
  localAsset,
}: {
  player: PlayerState;
  selected: boolean;
  skinAsset?: FortniteSkinAsset;
  localAsset?: LocalSkinAsset;
}) {
  const avatarRef = useRef<THREE.Group>(null);
  const [modelReady, setModelReady] = React.useState(false);
  const position = w2s(player.position, 0.13);
  const skin = player.skin;
  const primary = skin?.primaryColor || teamColor(player);
  const accent = skin?.accentColor || '#ffffff';
  const style = skin?.style || 'human';
  const handleModelReady = React.useCallback((ready: boolean) => setModelReady(ready), []);

  React.useEffect(() => {
    setModelReady(false);
  }, [localAsset?.url]);

  useFrame(() => {
    if (avatarRef.current) {
      avatarRef.current.position.y = position[1] + Math.sin(Date.now() * 0.002 + player.id) * 0.006;
    }
  });

  if (!player.isAlive) return null;

  return (
    <group>
      <group ref={avatarRef} position={position}>
        {(!localAsset || !modelReady) && (
          <>
            {/* Compact skin avatar: head, outfit, legs and cosmetic accent. */}
        <mesh position={[0, 0.055, 0]}>
          <sphereGeometry args={[selected ? 0.026 : 0.019, 12, 12]} />
          <meshBasicMaterial color={primary} transparent opacity={selected ? 1 : 0.96} />
        </mesh>
        <mesh position={[0, 0.012, 0]}>
          <boxGeometry args={[selected ? 0.045 : 0.034, selected ? 0.058 : 0.045, selected ? 0.025 : 0.02]} />
          <meshBasicMaterial color={primary} transparent opacity={selected ? 1 : 0.92} />
        </mesh>
        <mesh position={[-0.012, -0.033, 0]}>
          <boxGeometry args={[0.012, 0.035, 0.015]} />
          <meshBasicMaterial color={accent} transparent opacity={0.9} />
        </mesh>
        <mesh position={[0.012, -0.033, 0]}>
          <boxGeometry args={[0.012, 0.035, 0.015]} />
          <meshBasicMaterial color={accent} transparent opacity={0.9} />
        </mesh>
        {style === 'masked' && (
          <mesh position={[0, 0.055, 0.017]}>
            <boxGeometry args={[0.025, 0.008, 0.006]} />
            <meshBasicMaterial color={accent} />
          </mesh>
        )}
        {style === 'robot' && (
          <mesh position={[0, 0.087, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 0.025, 8]} />
            <meshBasicMaterial color={accent} />
          </mesh>
        )}
        {style === 'animal' && (
          <>
            <mesh position={[-0.012, 0.076, 0]} rotation={[0, 0, -0.4]}>
              <coneGeometry args={[0.008, 0.018, 4]} />
              <meshBasicMaterial color={accent} />
            </mesh>
            <mesh position={[0.012, 0.076, 0]} rotation={[0, 0, 0.4]}>
              <coneGeometry args={[0.008, 0.018, 4]} />
              <meshBasicMaterial color={accent} />
            </mesh>
          </>
        )}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.125, 0]}>
          <ringGeometry args={[selected ? 0.055 : 0.035, selected ? 0.068 : 0.043, 20]} />
          <meshBasicMaterial color={selected ? '#ffffff' : primary} transparent opacity={selected ? 0.9 : 0.36} side={THREE.DoubleSide} />
        </mesh>
          </>
        )}
        <LocalSkinModel asset={localAsset} selected={selected} onReady={handleModelReady} />
        {!modelReady && <SkinPortrait asset={skinAsset} selected={selected} />}
      </group>
      {selected && (
        <group position={[position[0], position[1] + 0.13, position[2]]}>
          <mesh>
            <planeGeometry args={[0.17, 0.008]} />
            <meshBasicMaterial color="#18221f" transparent opacity={0.9} />
          </mesh>
          <mesh position={[-(0.17 * (1 - player.health / 100)) / 2, 0, 0.001]}>
            <planeGeometry args={[0.17 * Math.max(0, player.health / 100), 0.008]} />
            <meshBasicMaterial color="#00ff9d" />
          </mesh>
          <Text position={[0, 0.03, 0]} fontSize={0.027} color="#ffffff" anchorX="center" anchorY="bottom" outlineWidth={0.003} outlineColor="#050508">
            {player.name || getFallbackPlayerName(player.id)}
          </Text>
          {skin && (
            <Text position={[0, 0.005, 0]} fontSize={0.016} color={accent} anchorX="center" anchorY="bottom" outlineWidth={0.0015} outlineColor="#050508">
              {skinAsset?.name || skin.name}
            </Text>
          )}
        </group>
      )}
    </group>
  );
}

function DeviceEventScene({ time }: { time: number }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const phase = getDeviceEventPhase(time);
  const progress = getDeviceEventProgress(time);
  const activation = Math.max(0, Math.min(1, (time - 150) / 270));
  const pulse = Math.max(0, Math.min(1, (time - 570) / 120));
  const device = w2s(THE_DEVICE_EVENT.deviceCenter, 0.08);
  const armAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
  const beamRadius = 2.2 + progress * 1.1;
  const beamOpacity = Math.max(0, Math.min(0.85, (time - 360) / 130));

  useFrame((_, delta) => {
    if (coreRef.current) coreRef.current.rotation.y += delta * (0.35 + activation * 2.2);
  });

  return (
    <group>
      {/* The Device complex at The Agency */}
      <group position={[device[0], 0, device[2]]}>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.52, 0.64, 0.12, 32]} />
          <meshStandardMaterial color="#29323c" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.32, 0.42, 0.06, 32]} />
          <meshBasicMaterial color="#e4ac4e" transparent opacity={0.8} />
        </mesh>
        <mesh ref={coreRef} position={[0, 0.38, 0]}>
          <octahedronGeometry args={[0.21, 1]} />
          <meshBasicMaterial color={phase.color} transparent opacity={0.9} />
        </mesh>
        <mesh position={[0, 0.38, 0]}>
          <sphereGeometry args={[0.36 + activation * 0.08, 20, 20]} />
          <meshBasicMaterial color={phase.color} transparent opacity={0.08 + activation * 0.1} />
        </mesh>
        {armAngles.map((angle, index) => (
          <group key={angle} rotation={[0, angle + activation * 0.22 * (index % 2 ? -1 : 1), 0]}>
            <mesh position={[0.7, 0.22 + activation * 0.72, 0]} rotation={[0, 0, activation * 0.35]}>
              <boxGeometry args={[1.35, 0.1, 0.16]} />
              <meshStandardMaterial color="#53616b" metalness={0.75} roughness={0.28} />
            </mesh>
            <mesh position={[1.36, 0.22 + activation * 0.72, 0]}>
              <sphereGeometry args={[0.12, 12, 12]} />
              <meshBasicMaterial color="#ff784d" transparent opacity={0.72 + activation * 0.2} />
            </mesh>
          </group>
        ))}
        <Text position={[0, 0.76 + activation * 0.2, 0]} fontSize={0.065} color="#f6c867" anchorX="center" anchorY="bottom" outlineWidth={0.004} outlineColor="#050508">
          THE DEVICE
        </Text>
        <Text position={[0, 0.68 + activation * 0.2, 0]} fontSize={0.028} color={phase.color} anchorX="center" anchorY="bottom" outlineWidth={0.002} outlineColor="#050508">
          {phase.label.toUpperCase()}
        </Text>
      </group>

      {/* Energy beams shooting from the Agency */}
      {armAngles.map((angle) => {
        const start: [number, number, number] = [device[0], 0.45 + activation * 0.4, device[2]];
        const end: [number, number, number] = [
          Math.cos(angle) * beamRadius,
          0.8 + beamOpacity * 1.7,
          Math.sin(angle) * beamRadius,
        ];
        return (
          <React.Fragment key={`device-beam-${angle}`}>
            <Line points={[start, end]} color="#70ddff" lineWidth={beamOpacity * 4 + 0.5} transparent opacity={beamOpacity * 0.75} />
            <Line points={[start, end]} color="#ffffff" lineWidth={0.55} transparent opacity={beamOpacity} />
          </React.Fragment>
        );
      })}

      {/* Pulse rings expand over Apollo */}
      {pulse > 0 && [0, 1, 2].map((ring) => {
        const ringProgress = Math.max(0, Math.min(1, pulse * 1.5 - ring * 0.25));
        const ringRadius = 0.3 + ringProgress * 4.5;
        return (
          <mesh key={`pulse-${ring}`} position={[device[0], 0.075 + ring * 0.008, device[2]]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[ringRadius, ringRadius + 0.035, 128]} />
            <meshBasicMaterial color="#63e8ff" transparent opacity={Math.max(0, 0.72 - ringProgress * 0.62)} side={THREE.DoubleSide} />
          </mesh>
        );
      })}

      {/* The displaced storm wall */}
      {time >= 390 && (
        <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.2 + progress * 0.55, 3.2 + progress * 0.55 + 0.08, 160]} />
          <meshBasicMaterial color="#a365ff" transparent opacity={0.18 + beamOpacity * 0.28} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function CameraController() {
  const { cameraMode, selectedPlayerId, currentFrame } = useReplayStore();
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(2.8, 4.5, 2.8));

  useFrame(() => {
    if (cameraMode === 'top') {
      targetPosition.current.set(0, 9.2, 0.01);
      camera.position.lerp(targetPosition.current, 0.055);
      camera.lookAt(0, 0, 0);
      return;
    }

    if (cameraMode === 'player' && selectedPlayerId !== null) {
      const player = currentFrame.find((candidate) => candidate.id === selectedPlayerId);
      if (player?.isAlive) {
        const position = w2s(player.position, 0.14);
        targetPosition.current.set(position[0] + 0.32, position[1] + 0.22, position[2] + 0.32);
        camera.position.lerp(targetPosition.current, 0.045);
        camera.lookAt(position[0], position[1], position[2]);
      }
    }
  });

  return null;
}

export default function Map3D() {
  const {
    currentFrame,
    currentStorm,
    selectedPlayerId,
    showStorm,
    showTrails,
    showPOIs,
    showKillMarkers,
    showTerrain,
    activeSeason,
    replayData,
    currentTime,
    cameraMode,
  } = useReplayStore();

  const mapPreset = useMemo(() => getMapPreset(activeSeason), [activeSeason]);
  const [archiveStatus, setArchiveStatus] = React.useState<'loading' | 'authentic' | 'fallback'>('loading');
  const usingAuthenticSurface = showTerrain && archiveStatus === 'authentic';
  const releaseVersion = replayData?.metadata.releaseVersion;

  const playerTrails = useMemo(() => {
    const trails = new Map<number, Vector3[]>();
    if (!replayData || !showTrails) return trails;

    const frames = replayData.frames.filter((frame) => frame.time <= currentTime);
    const stride = Math.max(1, Math.ceil(frames.length / 150));
    for (let index = 0; index < frames.length; index += stride) {
      for (const player of frames[index].players || []) {
        if (!player.position) continue;
        const trail = trails.get(player.id) || [];
        trail.push(player.position);
        trails.set(player.id, trail);
      }
    }
    return trails;
  }, [currentTime, replayData, showTrails]);

  const visiblePlayers = useMemo(() => currentFrame.filter((player) => player.isAlive), [currentFrame]);
  const skinNames = useMemo(
    () => visiblePlayers.map((player) => player.skin?.id ? `id:${player.skin.id}` : player.skin?.name || '').filter(Boolean),
    [visiblePlayers],
  );
  const skinAssets = useSkinAssets(skinNames);
  const localSkinAssets = useLocalSkinAssets(skinNames);
  const frames = replayData?.frames || [];
  const kills = replayData?.kills || [];
  const events = replayData?.events || [];
  const isDeviceEvent = replayData?.metadata.eventType === 'the_device';

  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: [5.5, 7.2, 5.5], fov: 50 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        style={{ background: mapPreset.theme.fog }}
      >
        <ambientLight intensity={0.52} />
        <directionalLight position={[4, 7, 3]} intensity={0.8} color="#b4c9ff" />
        <directionalLight position={[-5, 3, -4]} intensity={0.32} color="#ff9d84" />
        <fog attach="fog" args={[mapPreset.theme.fog, 5, 12]} />

        <ArchiveSurface
          seasonId={activeSeason}
          releaseVersion={releaseVersion}
          theme={mapPreset.theme}
          visible={showTerrain}
          onStatus={setArchiveStatus}
        />
        {!usingAuthenticSurface && (
          showTerrain
            ? <Terrain theme={mapPreset.theme} />
            : <gridHelper args={[9.2, 46, mapPreset.theme.grid, mapPreset.theme.gridMinor]} position={[0, 0, 0]} />
        )}
        {!usingAuthenticSurface && showTerrain && <MountainDecor theme={mapPreset.theme} />}
        {!usingAuthenticSurface && <POIMarkers visible={showPOIs} pois={mapPreset.pois} />}
        {/* The authentic map must not be covered by a custom Device model. The event is
            represented by the real map surface plus the timeline/marker overlays. */}
        <StormVisualization circle={currentStorm} visible={showStorm && !isDeviceEvent} />
        <KillMarkers kills={kills} frames={frames} currentTime={currentTime} visible={showKillMarkers} />
        <EventMarkers events={events} currentTime={currentTime} />

        {visiblePlayers.map((player) => (
          <React.Fragment key={player.id}>
            {showTrails && (
              <PlayerTrail
                positions={playerTrails.get(player.id) || []}
                color={player.id === selectedPlayerId ? '#ffffff' : teamColor(player)}
                selected={player.id === selectedPlayerId}
              />
            )}
            <PlayerDot
              player={player}
              selected={player.id === selectedPlayerId}
              skinAsset={skinAssets.get(skinAssetKey(player.skin?.id ? `id:${player.skin.id}` : player.skin?.name))}
              localAsset={localSkinAssets.get(localSkinAssetKey(player.skin?.id ? `id:${player.skin.id}` : player.skin?.name))}
            />
          </React.Fragment>
        ))}

        <CameraController />
        <OrbitControls
          enabled={cameraMode === 'free'}
          enableDamping
          dampingFactor={0.08}
          minDistance={0.8}
          maxDistance={14}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Small map-only readout; larger tactical cards live in MapOverlay. */}
      <div className="pointer-events-none absolute bottom-28 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.18em] text-fn-gray backdrop-blur-md lg:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-fn-green shadow-[0_0_8px_#00ff9d]" />
        {visiblePlayers.length} tracked on {mapPreset.short}
        <span className="text-fn-border">•</span>
        {usingAuthenticSurface ? 'authentic Fortnite map' : archiveStatus === 'loading' ? 'loading exact map' : showTerrain ? 'procedural fallback' : 'grid'}
        <span className="text-fn-border">•</span>
        {usingAuthenticSurface ? 'GitHub archive surface' : showPOIs ? 'fallback POIs' : 'POIs hidden'}
      </div>
    </div>
  );
}
