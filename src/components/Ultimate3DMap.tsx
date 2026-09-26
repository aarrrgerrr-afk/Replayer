'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { Text, Line, OrbitControls, Html, PerspectiveCamera, Environment, useHelper } from '@react-three/drei';
import * as THREE from 'three';
import { useReplayStore } from '@/lib/replay-store';
import { getMapPreset } from '@/lib/map-presets';
import type { MapPoi, MapTheme } from '@/lib/map-presets';
import { resolveSeasonMapAsset } from '@/lib/map-archive';
import { getFallbackPlayerName } from '@/lib/player-identity';
import type { KillEvent, PlayerState, StormCircle, Vector3, GameEvent } from '@/lib/types';
import { getEventById, type LiveEventId, LIVE_EVENTS } from '@/lib/event-presets';

const SCALE = 0.000085;
const TILE_SIZE = 0.2;

function w2s(position: Vector3, y = 0): [number, number, number] {
  return [position.x * SCALE, y + position.y * SCALE * 0.05, position.z * SCALE];
}

const TEAM_COLORS = ['#00ff9d', '#ff5c7c', '#4fc8ff', '#ffbf5c', '#b477ff', '#f783ff'];
function teamColor(player: PlayerState): string {
  return TEAM_COLORS[Math.abs(player.teamId) % TEAM_COLORS.length] || '#00ff9d';
}

// 3D Terrain with heightmap
function Terrain3D({ 
  seasonId, 
  releaseVersion,
  theme,
  visible
}: {
  seasonId: string;
  releaseVersion?: string;
  theme: MapTheme;
  visible: boolean;
}) {
  const [heightTexture, setHeightTexture] = useState<THREE.Texture | null>(null);
  const [mapTexture, setMapTexture] = useState<THREE.Texture | null>(null);
  const { gl } = useThree();

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    
    resolveSeasonMapAsset(seasonId as any, releaseVersion).then((asset) => {
      if (cancelled || !asset) return;
      
      if (asset.heightmapUrl) {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        loader.load(
          asset.heightmapUrl,
          (texture) => {
            if (cancelled) return;
            texture.anisotropy = gl.capabilities.getMaxAnisotropy();
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = true;
            texture.needsUpdate = true;
            setHeightTexture(texture);
          },
          undefined,
          () => {}
        );
      }
      
      if (asset.imageUrl) {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        loader.load(
          asset.imageUrl,
          (texture) => {
            if (cancelled) return;
            texture.anisotropy = gl.capabilities.getMaxAnisotropy();
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = true;
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.needsUpdate = true;
            setMapTexture(texture);
          },
          undefined,
          () => {}
        );
      }
    });
    
    return () => { cancelled = true; };
  }, [seasonId, releaseVersion, visible, gl]);

  if (!visible) return null;

  // Create a large grid of terrain tiles
  const terrainSize = 10;
  const tiles = 20;
  
  return (
    <group>
      {/* Base terrain with heightmap */}
      {heightTexture && mapTexture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
          <planeGeometry args={[terrainSize, terrainSize, 256, 256]} />
          <meshStandardMaterial
            map={mapTexture}
            displacementMap={heightTexture}
            displacementScale={0.5}
            roughness={0.9}
            metalness={0.1}
            color={theme.land}
          />
        </mesh>
      )}
      
      {/* Flat terrain fallback */}
      {mapTexture && !heightTexture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
          <planeGeometry args={[terrainSize, terrainSize]} />
          <meshBasicMaterial map={mapTexture} toneMapped={false} />
        </mesh>
      )}
      
      {/* Grid helper */}
      {!mapTexture && (
        <gridHelper args={[terrainSize, tiles, theme.grid, theme.gridMinor]} position={[0, -0.01, 0]} />
      )}
    </group>
  );
}

// 3D Buildings for POIs
function Building3D({ 
  position, 
  name, 
  color,
  type,
  theme,
  selected
}: {
  position: [number, number, number];
  name: string;
  color: string;
  type: 'skyscraper' | 'house' | 'shop' | 'factory' | 'mansion' | 'landmark';
  theme: MapTheme;
  selected: boolean;
}) {
  const buildingRef = useRef<THREE.Group>(null);
  
  // Building configurations
  const configs = {
    skyscraper: { width: 0.3, depth: 0.3, height: 1.5, floors: 8, floorHeight: 0.18 },
    house: { width: 0.25, depth: 0.25, height: 0.6, floors: 2, floorHeight: 0.3 },
    shop: { width: 0.28, depth: 0.22, height: 0.5, floors: 2, floorHeight: 0.25 },
    factory: { width: 0.4, depth: 0.35, height: 0.8, floors: 3, floorHeight: 0.27 },
    mansion: { width: 0.35, depth: 0.35, height: 0.7, floors: 2, floorHeight: 0.35 },
    landmark: { width: 0.45, depth: 0.45, height: 1.0, floors: 4, floorHeight: 0.25 },
  };
  
  const config = configs[type] || configs.house;
  const opacity = selected ? 1.0 : 0.85;
  
  return (
    <group ref={buildingRef} position={position}>
      {/* Base */}
      <mesh position={[0, config.height / 2, 0]}>
        <boxGeometry args={[config.width, config.height, config.depth]} />
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={opacity}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>
      
      {/* Roof */}
      <mesh position={[0, config.height + 0.05, 0]}>
        <coneGeometry args={[config.width * 0.7, 0.1, 4]} />
        <meshStandardMaterial color={color} transparent opacity={opacity * 0.8} roughness={0.8} />
      </mesh>
      
      {/* Windows */}
      {Array.from({ length: config.floors }).map((_, floorIndex) => {
        const floorHeight = config.height / config.floors;
        const yPos = floorHeight * (floorIndex + 0.5);
        return (
          <React.Fragment key={floorIndex}>
            <mesh position={[config.width / 2 + 0.01, yPos, 0]}>
              <boxGeometry args={[0.04, floorHeight * 0.7, 0.08]} />
              <meshBasicMaterial color="#41c9ff" transparent opacity={0.6} />
            </mesh>
            <mesh position={[-config.width / 2 - 0.01, yPos, 0]}>
              <boxGeometry args={[0.04, floorHeight * 0.7, 0.08]} />
              <meshBasicMaterial color="#41c9ff" transparent opacity={0.6} />
            </mesh>
          </React.Fragment>
        );
      })}
      
      {/* Building name label */}
      <Html distanceFactor={50} position={[0, config.height + 0.2, 0]}>
        <div style={{
          color: color,
          fontSize: '10px',
          fontWeight: 'bold',
          textAlign: 'center',
          textShadow: '1px 1px 1px black',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '2px 6px',
          borderRadius: '3px',
        }}>
          {name}
        </div>
      </Html>
    </group>
  );
}

// POI Buildings
function POIBuildings({ 
  visible, 
  pois,
  theme,
  zoomLevel,
  selectedPoi
}: { 
  visible: boolean;
  pois: MapPoi[];
  theme: MapTheme;
  zoomLevel: number;
  selectedPoi: string | null;
}) {
  if (!visible) return null;

  // POI types for building generation
  const poiTypes: Record<string, 'skyscraper' | 'house' | 'shop' | 'factory' | 'mansion' | 'landmark'> = {
    'Tilted Towers': 'skyscraper',
    'Neo Tilted': 'skyscraper',
    'Tilted Town': 'skyscraper',
    'Daily Bugle': 'skyscraper',
    'Mega City': 'skyscraper',
    'The Agency': 'landmark',
    'The Authority': 'landmark',
    'The Shark': 'landmark',
    'The Yacht': 'landmark',
    'The Grotto': 'landmark',
    'Retail Row': 'shop',
    'Pleasant Park': 'house',
    'Lazy Lake': 'landmark',
    'Loot Lake': 'landmark',
    'Salty Springs': 'house',
    'Sweaty Sands': 'house',
    'Dirty Docks': 'factory',
    'Frenzy Farm': 'house',
    'Misty Meadows': 'house',
    'Steamy Stacks': 'factory',
    'Craggy Cliffs': 'landmark',
    'Holly Hedges': 'house',
    'Greasy Grove': 'shop',
    'The Joneses': 'house',
    'Rocky Reels': 'landmark',
    'Camp Cuddle': 'house',
    'Coney Crossroads': 'shop',
    'Shifty Shafts': 'factory',
    'The Seven Outpost': 'landmark',
    'Command Cavern': 'landmark',
  };

  return (
    <group>
      {pois.map((poi: MapPoi, index) => {
        const position: [number, number, number] = [poi.x * SCALE, 0, poi.z * SCALE];
        const type = poiTypes[poi.name] || 'house';
        const isSelected = selectedPoi === poi.name;
        
        return (
          <Building3D
            key={`${poi.name}-${index}`}
            position={position}
            name={poi.name}
            color={poi.color}
            type={type}
            theme={theme}
            selected={isSelected}
          />
        );
      })}
    </group>
  );
}

// 3D Player Model
function PlayerModel3D({ 
  player,
  selected,
  theme
}: {
  player: PlayerState;
  selected: boolean;
  theme: MapTheme;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const position = w2s(player.position, 0);
  const skin = player.skin;
  const primary = skin?.primaryColor || teamColor(player);
  const accent = skin?.accentColor || '#ffffff';
  const style = skin?.style || 'human';

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = player.rotation;
      groupRef.current.position.y = position[1] + Math.sin(Date.now() * 0.002 + player.id) * 0.002;
    }
  });

  if (!player.isAlive) return null;

  const scale = selected ? 1.2 : 1.0;
  const opacity = selected ? 1.0 : 0.9;

  return (
    <group ref={groupRef} position={[position[0], position[1], position[2]]} scale={scale}>
      {/* Body */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.08, 0.12, 0.06]} />
        <meshStandardMaterial color={primary} transparent opacity={opacity} roughness={0.6} metalness={0.1} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.06, 0.06, 0.06]} />
        <meshStandardMaterial color={primary} transparent opacity={opacity} roughness={0.7} />
      </mesh>
      
      {/* Arms */}
      <mesh position={[-0.05, 0.08, 0]}>
        <boxGeometry args={[0.03, 0.08, 0.02]} />
        <meshStandardMaterial color={accent} transparent opacity={opacity} roughness={0.6} />
      </mesh>
      <mesh position={[0.05, 0.08, 0]}>
        <boxGeometry args={[0.03, 0.08, 0.02]} />
        <meshStandardMaterial color={accent} transparent opacity={opacity} roughness={0.6} />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.025, 0.02, 0]}>
        <boxGeometry args={[0.02, 0.08, 0.02]} />
        <meshStandardMaterial color={primary} transparent opacity={opacity} roughness={0.6} />
      </mesh>
      <mesh position={[0.025, 0.02, 0]}>
        <boxGeometry args={[0.02, 0.08, 0.02]} />
        <meshStandardMaterial color={primary} transparent opacity={opacity} roughness={0.6} />
      </mesh>
      
      {/* Style-specific details */}
      {style === 'masked' && (
        <mesh position={[0, 0.14, 0.02]}>
          <boxGeometry args={[0.04, 0.02, 0.01]} />
          <meshBasicMaterial color={accent} />
        </mesh>
      )}
      
      {style === 'robot' && (
        <>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.03, 8]} />
            <meshStandardMaterial color={accent} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.08, 0.03]}>
            <boxGeometry args={[0.02, 0.02, 0.01]} />
            <meshStandardMaterial color={accent} metalness={0.8} />
          </mesh>
        </>
      )}
      
      {/* Selection effect */}
      {selected && (
        <>
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[0.1, 0.14, 0.08]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
          </mesh>
          <pointLight position={[0, 0.2, 0]} color="#ffffff" intensity={0.5} distance={1} />
        </>
      )}
      
      {/* Health bar */}
      {selected && (
        <Html distanceFactor={50} position={[0, 0.2, 0]}>
          <div style={{
            width: '40px',
            height: '4px',
            backgroundColor: '#333',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${player.health}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #ff4444, #4caf50)',
            }} />
          </div>
          <div style={{
            color: '#fff',
            fontSize: '8px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginTop: '2px',
          }}>
            {player.name || getFallbackPlayerName(player.id)}
          </div>
        </Html>
      )}
    </group>
  );
}

// 3D Trees
function Tree3D({ position, theme }: { position: [number, number, number]; theme: MapTheme }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.015, 0.02, 0.1, 8]} />
        <meshStandardMaterial color="#5d4037" roughness={0.8} />
      </mesh>
      
      {/* Leaves */}
      <mesh position={[0, 0.15, 0]}>
        <coneGeometry args={[0.04, 0.1, 8]} />
        <meshStandardMaterial color={theme.landSecondary} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.22, 0]} rotation={[0, 0.3, 0]}>
        <coneGeometry args={[0.035, 0.08, 8]} />
        <meshStandardMaterial color={theme.landSecondary} roughness={0.9} />
      </mesh>
    </group>
  );
}

// 3D Rocks
function Rock3D({ position, theme, size }: { position: [number, number, number]; theme: MapTheme; size: number }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[size, size * 0.6, size]} />
      <meshStandardMaterial color={theme.land} roughness={0.95} />
    </mesh>
  );
}

// Decorative elements
function DecorativeElements({ theme, visible }: { theme: MapTheme; visible: boolean }) {
  if (!visible) return null;

  // Generate some trees and rocks randomly
  const elements = [];
  for (let i = 0; i < 50; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 2 + Math.random() * 6;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    
    if (Math.random() > 0.5) {
      elements.push(
        <Tree3D key={`tree-${i}`} position={[x, 0, z]} theme={theme} />
      );
    } else {
      elements.push(
        <Rock3D key={`rock-${i}`} position={[x, 0, z]} theme={theme} size={0.05 + Math.random() * 0.05} />
      );
    }
  }

  return <group>{elements}</group>;
}

// Storm Effect
function StormEffect({ circle, visible, theme }: { circle?: StormCircle; visible: boolean; theme: MapTheme }) {
  if (!circle || !visible) return null;
  
  const position = w2s(circle.center, 0);
  const radius = circle.radius * SCALE;
  
  return (
    <group>
      {/* Storm wall */}
      <mesh position={[position[0], 0, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius, radius + 0.02, 128]} />
        <meshStandardMaterial 
          color="#7132bc" 
          transparent 
          opacity={0.3} 
          side={THREE.DoubleSide}
          roughness={0.8}
        />
      </mesh>
      
      {/* Storm particles */}
      <mesh position={[position[0], 0.1, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.01, radius + 0.01, 64]} />
        <meshBasicMaterial color="#41c9ff" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Zone label */}
      <Html distanceFactor={50} position={[position[0], 0.2, position[2]]}>
        <div style={{
          color: '#c18cff',
          fontSize: '12px',
          fontWeight: 'bold',
          textAlign: 'center',
          textShadow: '1px 1px 2px black',
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: '2px 8px',
          borderRadius: '4px',
        }}>
          ZONE {circle.phase + 1}
        </div>
      </Html>
    </group>
  );
}

// Kill Marker 3D
function KillMarker3D({ 
  position,
  victim,
  age
}: {
  position: [number, number, number];
  victim: string;
  age: number;
}) {
  const opacity = 1 - age;
  
  return (
    <group position={position}>
      {/* Skull icon */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.04, 0.04, 0.04]} />
        <meshBasicMaterial color="#ff3f64" transparent opacity={opacity} />
      </mesh>
      
      {/* Blood splatter */}
      <mesh position={[0, 0.01, 0]} rotation={[Math.PI / 4, 0, 0]}>
        <planeGeometry args={[0.1, 0.1]} />
        <meshBasicMaterial color="#ff1a33" transparent opacity={opacity * 0.5} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Victim name */}
      <Html distanceFactor={50} position={[0, 0.15, 0]}>
        <div style={{
          color: '#ff7890',
          fontSize: '9px',
          fontWeight: 'bold',
          textAlign: 'center',
          textShadow: '1px 1px 1px black',
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: '1px 4px',
          borderRadius: '3px',
        }}>
          {victim}
        </div>
      </Html>
    </group>
  );
}

// Camera Controller
function GameCameraController({ 
  cameraMode,
  selectedPlayerId,
  currentFrame,
  setCameraMode
}: {
  cameraMode: 'free' | 'player' | 'top' | 'first-person' | 'third-person' | 'cinematic' | 'death-cam';
  selectedPlayerId: number | null;
  currentFrame: PlayerState[];
  setCameraMode: (mode: 'free' | 'player' | 'top' | 'first-person' | 'third-person' | 'cinematic' | 'death-cam') => void;
}) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3());
  const currentMode = useRef(cameraMode);

  useFrame(() => {
    const player = currentFrame.find((p) => p.id === selectedPlayerId);
    
    if (!player?.isAlive) {
      // Default to free camera if no selected player or player is dead
      if (cameraMode !== 'free') setCameraMode('free');
      return;
    }

    const playerPos = w2s(player.position, 0);
    
    switch (cameraMode) {
      case 'first-person':
        // First person view
        targetPosition.current.set(
          playerPos[0],
          playerPos[1] + 0.15,
          playerPos[2]
        );
        camera.position.lerp(targetPosition.current, 0.1);
        camera.rotation.set(0, player.rotation, 0);
        camera.translateZ(-0.1);
        break;
        
      case 'third-person':
        // Third person view (behind player)
        const offsetX = Math.sin(player.rotation) * 0.3;
        const offsetZ = Math.cos(player.rotation) * 0.3;
        targetPosition.current.set(
          playerPos[0] - offsetX,
          playerPos[1] + 0.25,
          playerPos[2] - offsetZ
        );
        camera.position.lerp(targetPosition.current, 0.08);
        camera.lookAt(playerPos[0], playerPos[1] + 0.1, playerPos[2]);
        break;
        
      case 'top':
        targetPosition.current.set(0, 8, 0);
        camera.position.lerp(targetPosition.current, 0.05);
        camera.lookAt(0, 0, 0);
        break;
      
      case 'player':
        // Player follow mode - smooth follow behind player
        const followOffsetX = Math.sin(player.rotation) * 0.5;
        const followOffsetZ = Math.cos(player.rotation) * 0.5;
        targetPosition.current.set(
          playerPos[0] - followOffsetX,
          playerPos[1] + 0.35,
          playerPos[2] - followOffsetZ
        );
        camera.position.lerp(targetPosition.current, 0.08);
        camera.lookAt(playerPos[0], playerPos[1] + 0.1, playerPos[2]);
        break;
        
      default: // free
        // OrbitControls handles this
        break;
    }
    
    currentMode.current = cameraMode;
  });

  return null;
}

// Main Ultimate3DMap Component
interface Ultimate3DMapProps {
  useArchiveSurface?: boolean;
}

export default function Ultimate3DMap({ useArchiveSurface = true }: Ultimate3DMapProps) {
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
    setCameraMode,
  } = useReplayStore();

  const mapPreset = useMemo(() => getMapPreset(activeSeason), [activeSeason]);
  const [selectedPoi, setSelectedPoi] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const pois = useMemo(() => mapPreset.pois || [], [mapPreset.pois]);
  const releaseVersion = replayData?.metadata.releaseVersion;

  const visiblePlayers = useMemo(() => currentFrame.filter((player) => player.isAlive), [currentFrame]);
  const frames = replayData?.frames || [];
  const kills = replayData?.kills || [];



  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: [0, 3, 4], fov: 60, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        style={{ background: mapPreset.theme.fog }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[5, 10, 3]} 
          intensity={1.0} 
          color="#ffffff" 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-5, 5, -4]} intensity={0.3} color="#ffccaa" />
        <directionalLight position={[0, 10, 0]} intensity={0.2} color="#8888ff" />
        <fog attach="fog" args={[mapPreset.theme.fog, 5, 30]} />
        <Environment preset="city" />

        {/* 3D Terrain */}
        <Terrain3D 
          seasonId={activeSeason} 
          releaseVersion={releaseVersion}
          theme={mapPreset.theme}
          visible={showTerrain}
        />
        
        {/* Decorative elements */}
        <DecorativeElements theme={mapPreset.theme} visible={showTerrain} />
        
        {/* 3D POI Buildings */}
        <POIBuildings 
          visible={showPOIs} 
          pois={pois} 
          theme={mapPreset.theme} 
          zoomLevel={zoomLevel}
          selectedPoi={selectedPoi}
        />
        
        {/* Storm */}
        <StormEffect circle={currentStorm} visible={showStorm} theme={mapPreset.theme} />
        
        {/* Kill Markers */}
        {showKillMarkers && (
          <group>
            {kills
              .filter((kill) => kill.time <= currentTime && kill.time > currentTime - 60)
              .map((kill, index) => {
                const frame = frames.find((f) => f.time <= kill.time);
                const killer = frame?.players.find((p) => p.id === kill.killerId);
                const victim = frame?.players.find((p) => p.id === kill.victimId);
                const position: [number, number, number] = killer && victim ? w2s({
                  x: (killer.position.x + victim.position.x) / 2,
                  y: (killer.position.y + victim.position.y) / 2,
                  z: (killer.position.z + victim.position.z) / 2,
                }, 0) : [0, 0, 0];
                const age = Math.max(0, Math.min(1, (currentTime - kill.time) / 60));
                return (
                  <KillMarker3D 
                    key={`kill-${kill.time}-${index}`} 
                    position={position} 
                    victim={kill.victim || 'Elim'}
                    age={age}
                  />
                );
              })
            }
          </group>
        )}
        
        {/* 3D Player Models */}
        <group>
          {visiblePlayers.map((player) => (
            <PlayerModel3D
              key={player.id}
              player={player}
              selected={player.id === selectedPlayerId}
              theme={mapPreset.theme}
            />
          ))}
        </group>

        {/* Camera Controller */}
        <GameCameraController 
          cameraMode={cameraMode}
          selectedPlayerId={selectedPlayerId}
          currentFrame={currentFrame}
          setCameraMode={setCameraMode}
        />
        
        {/* OrbitControls for free camera */}
        <OrbitControls
          enabled={cameraMode === 'free'}
          enableDamping
          dampingFactor={0.08}
          minDistance={0.5}
          maxDistance={40}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Camera mode controls */}
      <div className="pointer-events-auto absolute top-4 left-4 z-50 flex gap-2 rounded-xl bg-black/60 p-2 backdrop-blur-xl">
        <button
          onClick={() => setCameraMode('free')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            cameraMode === 'free' 
              ? 'bg-white/20 text-white' 
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          Free Camera
        </button>
        <button
          onClick={() => setCameraMode('third-person')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            cameraMode === 'third-person' 
              ? 'bg-white/20 text-white' 
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          3rd Person
        </button>
        <button
          onClick={() => setCameraMode('first-person')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            cameraMode === 'first-person' 
              ? 'bg-white/20 text-white' 
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          1st Person
        </button>
        <button
          onClick={() => setCameraMode('top')}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            cameraMode === 'top' 
              ? 'bg-white/20 text-white' 
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          Top Down
        </button>
      </div>

      {/* Status readout */}
      <div className="pointer-events-none absolute bottom-28 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.18em] text-fn-gray backdrop-blur-md lg:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-fn-green shadow-[0_0_8px_#00ff9d]" />
        {visiblePlayers.length} tracked on {mapPreset.short}
        <span className="text-fn-border">\u2022</span>
        {showTerrain ? '3D Terrain' : 'No terrain'}
        <span className="text-fn-border">\u2022</span>
        Camera: {cameraMode}
        <span className="text-fn-border">\u2022</span>
        3D Players with Models
      </div>
    </div>
  );
}

