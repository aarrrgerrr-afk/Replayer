'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useReplayStore } from '@/lib/replay-store';
import { getEventById, type LiveEvent, type LiveEventPhase, LIVE_EVENTS } from '@/lib/event-presets';
import { getMapPreset } from '@/lib/map-presets';
import type { MapTheme, MapPoi } from '@/lib/map-presets';
import type { PlayerState, KillEvent, StormCircle, Vector3, GameEvent } from '@/lib/types';

const SCALE = 0.000085;

function w2s(position: Vector3, y = 0): [number, number, number] {
  return [position.x * SCALE, y + position.y * SCALE * 0.05, position.z * SCALE];
}

function worldLine(points: Vector3[], y = 0.025): [number, number, number][] {
  return points.map((point) => w2s(point, y));
}

// Enhanced Terrain for event mode
function EventTerrain({ theme }: { theme: MapTheme }) {
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
        <meshStandardMaterial color={theme.ocean} roughness={0.9} metalness={0.1} />
      </mesh>
      
      {/* Island silhouette */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <shapeGeometry args={[islandShape]} />
        <meshStandardMaterial color={theme.land} roughness={0.95} metalness={0.05} />
      </mesh>
      
      {/* Coastal rim */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[4.2, 4.44, 96]} />
        <meshBasicMaterial color={theme.water} transparent opacity={0.42} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Tactical grid */}
      <gridHelper args={[9.2, 46, theme.grid, theme.gridMinor]} position={[0, 0.06, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.064, 0]}>
        <ringGeometry args={[4.43, 4.5, 128]} />
        <meshBasicMaterial color={theme.accent} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// POI Markers for event mode
function EventPOIMarkers({ visible, pois, theme }: { visible: boolean; pois: MapPoi[]; theme: MapTheme }) {
  if (!visible) return null;

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
                <mesh position={[0, 0.09, 0]}>
                  <boxGeometry args={[0.065, 0.05, 0.065]} />
                  <meshBasicMaterial color={poi.color} transparent opacity={0.22} />
                </mesh>
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

// Player Dot for event mode
function EventPlayerDot({
  player,
  selected,
}: {
  player: PlayerState;
  selected: boolean;
}) {
  const avatarRef = useRef<THREE.Group>(null);
  const position = w2s(player.position, 0.13);
  const skin = player.skin;
  const primary = skin?.primaryColor || getTeamColor(player);
  const accent = skin?.accentColor || '#ffffff';
  const style = skin?.style || 'human';

  useFrame(() => {
    if (avatarRef.current) {
      avatarRef.current.position.y = position[1] + Math.sin(Date.now() * 0.002 + player.id) * 0.006;
    }
  });

  if (!player.isAlive) return null;

  return (
    <group>
      <group ref={avatarRef} position={position}>
        <>
          {/* Head */}
          <mesh position={[0, 0.055, 0]}>
            <sphereGeometry args={[selected ? 0.026 : 0.019, 12, 12]} />
            <meshBasicMaterial color={primary} transparent opacity={selected ? 1 : 0.96} />
          </mesh>
          {/* Body */}
          <mesh position={[0, 0.012, 0]}>
            <boxGeometry args={[selected ? 0.045 : 0.034, selected ? 0.058 : 0.045, selected ? 0.025 : 0.02]} />
            <meshBasicMaterial color={primary} transparent opacity={selected ? 1 : 0.92} />
          </mesh>
          {/* Arms */}
          <mesh position={[-0.012, -0.033, 0]}>
            <boxGeometry args={[0.012, 0.035, 0.015]} />
            <meshBasicMaterial color={accent} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0.012, -0.033, 0]}>
            <boxGeometry args={[0.012, 0.035, 0.015]} />
            <meshBasicMaterial color={accent} transparent opacity={0.9} />
          </mesh>
          {/* Selection ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.125, 0]}>
            <ringGeometry args={[selected ? 0.055 : 0.035, selected ? 0.068 : 0.043, 20]} />
            <meshBasicMaterial color={selected ? '#ffffff' : primary} transparent opacity={selected ? 0.9 : 0.36} side={THREE.DoubleSide} />
          </mesh>
        </>
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
              {skin.name}
            </Text>
          )}
        </group>
      )}
    </group>
  );
}

function getTeamColor(player: PlayerState): string {
  const TEAM_COLORS = ['#00ff9d', '#ff5c7c', '#4fc8ff', '#ffbf5c', '#b477ff', '#f783ff'];
  return TEAM_COLORS[Math.abs(player.teamId) % TEAM_COLORS.length] || '#00ff9d';
}

// Event-specific structures
function DeviceStructure({ time, theme }: { time: number; theme: MapTheme }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const event = LIVE_EVENTS.the_device;
  const phase = event.phases.find((p) => time >= p.start && time < p.end) || event.phases[event.phases.length - 1];
  const progress = Math.max(0, Math.min(1, time / event.duration));
  const activation = Math.max(0, Math.min(1, (time - 150) / 270));
  const pulse = Math.max(0, Math.min(1, (time - 570) / 120));
  const device = w2s(event.deviceCenter || { x: 0, y: 0, z: 0 }, 0.08);
  const armAngles = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
  const beamRadius = 2.2 + progress * 1.1;
  const beamOpacity = Math.max(0, Math.min(0.85, (time - 360) / 130));

  useFrame((_, delta) => {
    if (coreRef.current) coreRef.current.rotation.y += delta * (0.35 + activation * 2.2);
  });

  return (
    <group>
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
      </group>

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

      {time >= 390 && (
        <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.2 + progress * 0.55, 3.2 + progress * 0.55 + 0.08, 160]} />
          <meshBasicMaterial color="#a365ff" transparent opacity={0.18 + beamOpacity * 0.28} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function GalactusStructure({ time, theme }: { time: number; theme: MapTheme }) {
  const approachProgress = Math.max(0, Math.min(1, time / 240));
  const actualY = 8 - approachProgress * 3;

  return (
    <group>
      <group position={[0, actualY, 4]}>
        <mesh>
          <boxGeometry args={[3, 0.8, 1.5]} />
          <meshStandardMaterial color="#0d47a1" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[1, 1, 0.5]} />
          <meshStandardMaterial color="#1565c0" metalness={0.9} roughness={0.2} />
        </mesh>
        <Text position={[0, 1.5, 0]} fontSize={0.05} color="#ffffff" anchorX="center" anchorY="bottom">
          GALACTUS
        </Text>
      </group>
      
      {time >= 240 && time < 480 && (
        <Line points={[[0, 3, 2], [0, actualY, 4]]} color="#ff5252" lineWidth={2} transparent opacity={0.9} />
      )}
      
      {time >= 480 && (
        <mesh position={[0, 5, 4]}>
          <sphereGeometry args={[1 + (time - 480) * 0.02, 16, 16]} />
          <meshBasicMaterial color="#4caf50" transparent opacity={Math.max(0, 0.4 - (time - 480) * 0.002)} />
        </mesh>
      )}
    </group>
  );
}

function CollisionStructure({ time, theme }: { time: number; theme: MapTheme }) {
  const event = LIVE_EVENTS.collision;
  const phase = event.phases.find((p) => time >= p.start && time < p.end) || event.phases[event.phases.length - 1];

  return (
    <group>
      <group position={[0, 0.5, 0]}>
        <mesh>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#7c4dff" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.5, 0.05, 16, 32]} />
          <meshStandardMaterial color="#408cff" metalness={0.6} roughness={0.3} />
        </mesh>
        
        {time >= 60 && time < 300 && (
          <>
            <mesh position={[0, 1, 0]} rotation={[Math.PI / 4, 0, 0]}>
              <planeGeometry args={[2, 0.1]} />
              <meshBasicMaterial color="#7c4dff" transparent opacity={0.6} />
            </mesh>
            <mesh position={[0, 1, 0]} rotation={[-Math.PI / 4, 0, 0]}>
              <planeGeometry args={[2, 0.1]} />
              <meshBasicMaterial color="#7c4dff" transparent opacity={0.6} />
            </mesh>
          </>
        )}
        
        {time >= 300 && (
          <group position={[0, 2, 0]}>
            <mesh>
              <torusGeometry args={[1, 0.1, 16, 32]} />
              <meshStandardMaterial color="#2196f3" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.3, 0.3, 0.3]} />
              <meshStandardMaterial color="#ffffff" metalness={0.9} roughness={0.1} />
            </mesh>
          </group>
        )}
      </group>
      
      <Text position={[0, 1.5, 0]} fontSize={0.05} color="#ffffff" anchorX="center" anchorY="bottom">
        ZERO POINT
      </Text>
    </group>
  );
}

// Camera Controller for event mode
function EventCameraController({ eventId, currentTime }: { eventId: string; currentTime: number }) {
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

// Main EventReplaySystem component
interface EventReplaySystemProps {
  eventId: string;
}

export default function EventReplaySystem({ eventId }: EventReplaySystemProps) {
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
  const event = useMemo(() => getEventById(eventId as any), [eventId]);
  const frames = replayData?.frames || [];
  const kills = replayData?.kills || [];

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

  // Render event-specific structure
  const renderEventStructure = () => {
    switch (eventId) {
      case 'the_device':
        return <DeviceStructure time={currentTime} theme={mapPreset.theme} />;
      case 'galactus':
        return <GalactusStructure time={currentTime} theme={mapPreset.theme} />;
      case 'collision':
        return <CollisionStructure time={currentTime} theme={mapPreset.theme} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: [5.5, 7.2, 5.5], fov: 50 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        style={{ background: mapPreset.theme.fog }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 7, 3]} intensity={1.0} color="#b4c9ff" />
        <directionalLight position={[-5, 3, -4]} intensity={0.4} color="#ff9d84" />
        <directionalLight position={[0, 10, 0]} intensity={0.3} color="#ffffff" />
        <fog attach="fog" args={[mapPreset.theme.fog, 5, 15]} />

        {showTerrain && <EventTerrain theme={mapPreset.theme} />}
        {!showTerrain && <gridHelper args={[9.2, 46, mapPreset.theme.grid, mapPreset.theme.gridMinor]} position={[0, 0, 0]} />}
        
        <EventPOIMarkers visible={showPOIs} pois={mapPreset.pois} theme={mapPreset.theme} />
        
        {renderEventStructure()}

        {visiblePlayers.map((player) => (
          <React.Fragment key={player.id}>
            {showTrails && (
              <Line
                points={(playerTrails.get(player.id) || []).map((position) => w2s(position, 0.08))}
                color={player.id === selectedPlayerId ? '#ffffff' : getTeamColor(player)}
                lineWidth={player.id === selectedPlayerId ? 2.8 : 1.1}
                transparent
                opacity={player.id === selectedPlayerId ? 0.9 : 0.28}
                dashed={!selectedPlayerId}
                dashSize={0.025}
                gapSize={0.016}
              />
            )}
            <EventPlayerDot
              player={player}
              selected={player.id === selectedPlayerId}
            />
          </React.Fragment>
        ))}

        <EventCameraController eventId={eventId} currentTime={currentTime} />
        
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

      <div className="pointer-events-none absolute bottom-28 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.18em] text-fn-gray backdrop-blur-md lg:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-fn-purple shadow-[0_0_8px_#7b1fa2]" />
        {visiblePlayers.length} tracked on {mapPreset.short}
        <span className="text-fn-border">2220</span>
        {showTerrain ? 'Event Terrain' : 'Grid'}
        <span className="text-fn-border">2220</span>
        Event Mode: {event?.name || eventId}
      </div>
    </div>
  );
}

// Helper function
function getFallbackPlayerName(id: number): string {
  const names = ['Player', 'Unknown', 'Bot', 'AI', 'Enemy', 'Ally', 'Observer', 'Spectator'];
  return `${names[id % names.length]} ${id}`;
}
