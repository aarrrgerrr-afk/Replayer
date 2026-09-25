'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Line, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useReplayStore } from '@/lib/replay-store';
import { getMapPreset } from '@/lib/map-presets';
import type { MapPoi, MapTheme } from '@/lib/map-presets';
import { resolveSeasonMapAsset } from '@/lib/map-archive';
import type { KillEvent, PlayerState, StormCircle, Vector3 } from '@/lib/types';

const SCALE = 0.000085;

function w2s(position: Vector3, y = 0): [number, number, number] {
  return [position.x * SCALE, y + position.y * SCALE * 0.05, position.z * SCALE];
}

const TEAM_COLORS = ['#00ff9d', '#ff5c7c', '#4fc8ff', '#ffbf5c', '#b477ff', '#f783ff'];
function teamColor(player: PlayerState): string {
  return TEAM_COLORS[Math.abs(player.teamId) % TEAM_COLORS.length] || '#00ff9d';
}

function FortniteMapTexture({ 
  seasonId, 
  releaseVersion,
  visible,
  onLoad,
  onError
}: {
  seasonId: string;
  releaseVersion?: string;
  visible: boolean;
  onLoad: () => void;
  onError: () => void;
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const { gl } = useThree();

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setTexture(null);

    resolveSeasonMapAsset(seasonId as any, releaseVersion).then((asset) => {
      if (cancelled || !asset?.imageUrl) {
        onError();
        return;
      }
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');
      loader.load(
        asset.imageUrl,
        (loadedTexture) => {
          if (cancelled) return;
          loadedTexture.anisotropy = gl.capabilities.getMaxAnisotropy();
          loadedTexture.minFilter = THREE.LinearMipmapLinearFilter;
          loadedTexture.magFilter = THREE.LinearFilter;
          loadedTexture.generateMipmaps = true;
          loadedTexture.colorSpace = THREE.SRGBColorSpace;
          loadedTexture.needsUpdate = true;
          setTexture(loadedTexture);
          onLoad();
        },
        undefined,
        () => { if (!cancelled) onError(); }
      );
    });
    return () => { cancelled = true; };
  }, [seasonId, releaseVersion, visible, gl, onLoad, onError]);

  if (!visible || !texture) return null;
  const mapScale = 8.65;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0001, 0]}>
      <planeGeometry args={[mapScale, mapScale]} />
      <meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

function POIMarkers({ visible, pois, theme, zoomLevel }: { visible: boolean; pois: MapPoi[]; theme: MapTheme; zoomLevel: number }) {
  if (!visible) return null;
  const showMajor = zoomLevel > 0.5;
  const showMinor = zoomLevel > 1.5;

  return (
    <group>
      {pois.map((poi: MapPoi, index) => {
        const isMajor = poi.size === 'major';
        if (!isMajor && !showMinor) return null;
        if (!showMajor) return null;
        const position: [number, number, number] = [poi.x * SCALE, 0.0002, poi.z * SCALE];
        const iconSize = isMajor ? 0.08 : 0.05;
        const textSize = isMajor ? 12 : 10;
        return (
          <group key={`${poi.name}-${index}`} position={position}>
            <mesh position={[0, 0, 0]}>
              <circleGeometry args={[iconSize, 32]} />
              <meshBasicMaterial color={poi.color} />
            </mesh>
            <Html distanceFactor={100} position={[0, 0.08, 0]}>
              <div style={{
                color: poi.color,
                fontSize: `${textSize - 4}px`,
                fontWeight: 'bold',
                textAlign: 'center',
                textShadow: '1px 1px 1px black',
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: '1px 4px',
                borderRadius: '3px',
                transform: 'translateX(-50%)',
              }}>
                {poi.name}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function PlayerDot({ player, selected, zoomLevel }: { player: PlayerState; selected: boolean; zoomLevel: number }) {
  const avatarRef = useRef<THREE.Group>(null);
  const position = w2s(player.position, 0.0003);
  const skin = player.skin;
  const primary = skin?.primaryColor || teamColor(player);
  const dotSize = selected ? 0.04 : 0.025;

  useFrame(() => {
    if (avatarRef.current) {
      avatarRef.current.position.y = position[1] + Math.sin(Date.now() * 0.002 + player.id) * 0.0005;
    }
  });

  if (!player.isAlive) return null;

  return (
    <group>
      <group ref={avatarRef} position={position}>
        <mesh position={[0, 0, 0]}>
          <circleGeometry args={[dotSize, 16]} />
          <meshBasicMaterial color={primary} />
        </mesh>
        {selected && (
          <mesh position={[0, 0, 0]}>
            <ringGeometry args={[dotSize * 1.4, dotSize * 1.8, 24]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        )}
        <mesh position={[0, 0, 0]} rotation={[0, 0, player.rotation]}>
          <coneGeometry args={[dotSize * 0.6, dotSize * 1.5, 8]} />
          <meshBasicMaterial color={selected ? '#ffffff' : primary} />
        </mesh>
      </group>
      {selected && zoomLevel > 1 && (
        <Html distanceFactor={100} position={[position[0], 0.06, position[2]]}>
          <div style={{
            color: '#ffffff',
            fontSize: '9px',
            fontWeight: 'bold',
            textAlign: 'center',
            textShadow: '1px 1px 1px black',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '1px 6px',
            borderRadius: '3px',
            transform: 'translateX(-50%)',
          }}>
            {player.name || getFallbackPlayerName(player.id)}
          </div>
        </Html>
      )}
    </group>
  );
}

function PlayerTrail({ positions, color, selected, zoomLevel }: { positions: Vector3[]; color: string; selected: boolean; zoomLevel: number }) {
  if (positions.length < 2 || zoomLevel < 0.8) return null;
  return (
    <Line
      points={positions.map((position) => w2s(position, 0.0002))}
      color={color}
      lineWidth={selected ? 1.5 : 0.8}
      transparent
      opacity={selected ? 0.9 : 0.5}
    />
  );
}

function StormCircle({ circle, visible, theme }: { circle?: StormCircle; visible: boolean; theme: MapTheme }) {
  if (!circle || !visible) return null;
  const position = w2s(circle.center, 0);
  const radius = circle.radius * SCALE;
  return (
    <group>
      <mesh position={[position[0], 0.0003, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 64]} />
        <meshBasicMaterial color="#7132bc" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[position[0], 0.0004, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.002, radius + 0.002, 128]} />
        <meshBasicMaterial color="#41c9ff" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      <Html distanceFactor={100} position={[position[0], 0.03, position[2]]}>
        <div style={{
          color: '#c18cff',
          fontSize: '11px',
          fontWeight: 'bold',
          textAlign: 'center',
          textShadow: '1px 1px 1px black',
        }}>
          ZONE {circle.phase + 1}
        </div>
      </Html>
    </group>
  );
}

function KillMarkers({ kills, frames, currentTime, visible, zoomLevel }: { kills: KillEvent[]; frames: { time: number; players: PlayerState[] }[]; currentTime: number; visible: boolean; zoomLevel: number }) {
  if (!visible || zoomLevel < 0.5) return null;
  const recentKills = kills.filter((kill) => kill.time <= currentTime && kill.time > currentTime - 60);
  function killPosition(kill: KillEvent): Vector3 {
    const frame = frames.find((f) => f.time <= kill.time);
    const killer = frame?.players.find((player) => player.id === kill.killerId);
    const victim = frame?.players.find((player) => player.id === kill.victimId);
    if (killer && victim) {
      return { x: (killer.position.x + victim.position.x) / 2, y: (killer.position.y + victim.position.y) / 2, z: (killer.position.z + victim.position.z) / 2 };
    }
    return killer?.position || victim?.position || { x: 0, y: 0, z: 0 };
  }
  return (
    <group>
      {recentKills.map((kill, index) => {
        const position = w2s(killPosition(kill), 0.0004);
        const age = Math.max(0, Math.min(1, (currentTime - kill.time) / 60));
        return (
          <group key={`kill-${kill.time}-${index}`} position={position}>
            <mesh>
              <circleGeometry args={[0.02, 16]} />
              <meshBasicMaterial color="#ff3f64" transparent opacity={1 - age} />
            </mesh>
            <Html distanceFactor={100} position={[0, 0.05, 0]}>
              <div style={{
                color: '#ff7890',
                fontSize: '8px',
                fontWeight: 'bold',
                textAlign: 'center',
                textShadow: '1px 1px 1px black',
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: '1px 3px',
                borderRadius: '2px',
              }}>
                {kill.victim || 'Elim'}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function MapGrid({ visible, theme }: { visible: boolean; theme: MapTheme }) {
  if (!visible) return null;
  return (
    <group>
      <gridHelper args={[9.2, 46, theme.grid, theme.gridMinor]} position={[0, 0, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.00005, 0]}>
        <ringGeometry args={[4.43, 4.5, 128]} />
        <meshBasicMaterial color={theme.accent} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function MapCameraController({ setZoomLevel }: { setZoomLevel: (zoom: number) => void }) {
  const { cameraMode, selectedPlayerId, currentFrame } = useReplayStore();
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3(0, 6, 0));

  useFrame(() => {
    const distance = camera.position.length();
    const normalizedZoom = Math.min(2, Math.max(0, (distance - 2) / 6));
    setZoomLevel(normalizedZoom);

    if (cameraMode === 'top') {
      targetPosition.current.set(0, 9.2, 0.01);
      camera.position.lerp(targetPosition.current, 0.055);
      camera.lookAt(0, 0, 0);
      return;
    }

    if (cameraMode === 'player' && selectedPlayerId !== null) {
      const player = currentFrame.find((candidate) => candidate.id === selectedPlayerId);
      if (player?.isAlive) {
        const position = w2s(player.position, 0.001);
        targetPosition.current.set(position[0], position[1] + 0.3, position[2]);
        camera.position.lerp(targetPosition.current, 0.045);
        camera.lookAt(position[0], position[1], position[2]);
      }
    }
  });
  return null;
}

interface RealFortniteMapProps {
  useArchiveSurface?: boolean;
}

export default function RealFortniteMap({ useArchiveSurface = true }: RealFortniteMapProps) {
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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  const pois = useMemo(() => mapPreset.pois || [], [mapPreset.pois]);
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
  const frames = replayData?.frames || [];
  const kills = replayData?.kills || [];

  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: [0, 6, 0], fov: 60, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        style={{ background: mapPreset.theme.fog }}
      >
        <ambientLight intensity={1.0} />
        <directionalLight position={[5, 8, 3]} intensity={0.5} color="#ffffff" />
        <fog attach="fog" args={[mapPreset.theme.fog, 2, 20]} />

        {useArchiveSurface && showTerrain && (
          <FortniteMapTexture seasonId={activeSeason} releaseVersion={releaseVersion} visible={true} onLoad={() => setMapLoaded(true)} onError={() => setMapError(true)} />
        )}
        {(!useArchiveSurface || mapError || !mapLoaded) && showTerrain && <MapGrid visible={true} theme={mapPreset.theme} />}
        <POIMarkers visible={showPOIs} pois={pois} theme={mapPreset.theme} zoomLevel={zoomLevel} />
        <StormCircle circle={currentStorm} visible={showStorm} theme={mapPreset.theme} />
        <KillMarkers kills={kills} frames={frames} currentTime={currentTime} visible={showKillMarkers} zoomLevel={zoomLevel} />
        {visiblePlayers.map((player) => (
          <React.Fragment key={player.id}>
            {showTrails && <PlayerTrail positions={playerTrails.get(player.id) || []} color={player.id === selectedPlayerId ? '#ffffff' : teamColor(player)} selected={player.id === selectedPlayerId} zoomLevel={zoomLevel} />}
            <PlayerDot player={player} selected={player.id === selectedPlayerId} zoomLevel={zoomLevel} />
          </React.Fragment>
        ))}
        <MapCameraController setZoomLevel={setZoomLevel} />
        <OrbitControls enabled={cameraMode === 'free'} enableDamping dampingFactor={0.08} minDistance={1} maxDistance={20} maxPolarAngle={Math.PI / 2.05} target={[0, 0, 0]} />
      </Canvas>
      <div className="pointer-events-none absolute bottom-28 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.18em] text-fn-gray backdrop-blur-md lg:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-fn-green shadow-[0_0_8px_#00ff9d]" />
        {visiblePlayers.length} tracked on {mapPreset.short}
        <span className="text-fn-border">\u2022</span>
        {useArchiveSurface && showTerrain && mapLoaded ? 'Real Fortnite Map' : showTerrain ? 'Grid' : 'No terrain'}
        <span className="text-fn-border">\u2022</span>
        {showPOIs ? 'POIs shown' : 'POIs hidden'}
        <span className="text-fn-border">\u2022</span>
        Zoom: {zoomLevel > 1.5 ? 'High' : zoomLevel > 0.8 ? 'Medium' : 'Low'}
      </div>
    </div>
  );
}

function getFallbackPlayerName(id: number): string {
  const names = ['Player', 'Unknown', 'Bot', 'AI', 'Enemy', 'Ally', 'Observer', 'Spectator'];
  return `${names[id % names.length]} ${id}`;
}

// Helper to format player name
function formatPlayerName(player: PlayerState): string {
  return player.name || getFallbackPlayerName(player.id);
}
