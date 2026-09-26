'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Environment, PerspectiveCamera, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { useReplayStore } from '@/lib/replay-store';
import { getMapPreset } from '@/lib/map-presets';
import type { MapPoi, MapTheme } from '@/lib/map-presets';
import { resolveSeasonMapAsset } from '@/lib/map-archive';
import { getFallbackPlayerName } from '@/lib/player-identity';
import type { KillEvent, PlayerState, StormCircle, Vector3 } from '@/lib/types';

// Real Fortnite coordinate scaling
const SCALE = 0.000085;
const WORLD_SIZE = 100000;
const SCENE_SIZE = WORLD_SIZE * SCALE;

function w2s(position: Vector3, y = 0): [number, number, number] {
  return [position.x * SCALE, y, position.z * SCALE];
}

const TEAM_COLORS = ['#00ff9d', '#ff5c7c', '#4fc8ff', '#ffbf5c', '#b477ff', '#f783ff'];
function teamColor(player: PlayerState): string {
  return TEAM_COLORS[Math.abs(player.teamId) % TEAM_COLORS.length] || '#00ff9d';
}

// Fortnite Island Terrain
function FortniteIsland({ 
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
  const [mapTexture, setMapTexture] = useState<THREE.Texture | null>(null);
  const [heightTexture, setHeightTexture] = useState<THREE.Texture | null>(null);
  const { gl } = useThree();

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    
    resolveSeasonMapAsset(seasonId as any, releaseVersion).then((asset) => {
      if (cancelled || !asset) return;
      
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
    });
    
    return () => { cancelled = true; };
  }, [seasonId, releaseVersion, visible, gl]);

  if (!visible) return null;

  return (
    <group>
      {mapTexture && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <planeGeometry args={[SCENE_SIZE, SCENE_SIZE, 512, 512]} />
          <meshStandardMaterial
            map={mapTexture}
            displacementMap={heightTexture}
            displacementScale={heightTexture ? 2 : 0}
            roughness={0.95}
            metalness={0.05}
            color={theme.land}
            toneMapped={true}
          />
        </mesh>
      )}
    </group>
  );
}

// Fortnite Building Models
function FortniteBuilding({ 
  position, 
  name, 
  color,
  type,
  theme,
  scale = 1
}: {
  position: [number, number, number];
  name: string;
  color: string;
  type: 'city' | 'house' | 'shop' | 'factory' | 'mansion' | 'landmark' | 'small';
  theme: MapTheme;
  scale?: number;
}) {
  const buildingRef = useRef<THREE.Group>(null);
  
  const buildingConfigs: Record<string, any> = {
    city: { 
      baseWidth: 0.4, baseDepth: 0.4, baseHeight: 2.0, 
      floors: 10, floorHeight: 0.2, 
      roofHeight: 0.15, roofWidth: 0.35,
      windowWidth: 0.03, windowHeight: 0.1, windowDepth: 0.01, windowSpacing: 0.08,
      colorOffset: 0.1
    },
    house: { 
      baseWidth: 0.3, baseDepth: 0.25, baseHeight: 0.8, 
      floors: 2, floorHeight: 0.4, 
      roofHeight: 0.2, roofWidth: 0.25,
      windowWidth: 0.025, windowHeight: 0.08, windowDepth: 0.01, windowSpacing: 0.06,
      colorOffset: 0
    },
    shop: { 
      baseWidth: 0.35, baseDepth: 0.25, baseHeight: 0.7, 
      floors: 2, floorHeight: 0.35, 
      roofHeight: 0.15, roofWidth: 0.3,
      windowWidth: 0.03, windowHeight: 0.1, windowDepth: 0.01, windowSpacing: 0.07,
      colorOffset: -0.05
    },
    factory: { 
      baseWidth: 0.5, baseDepth: 0.4, baseHeight: 1.2, 
      floors: 4, floorHeight: 0.3, 
      roofHeight: 0.1, roofWidth: 0.45,
      windowWidth: 0.04, windowHeight: 0.12, windowDepth: 0.01, windowSpacing: 0.1,
      colorOffset: -0.1
    },
    mansion: { 
      baseWidth: 0.45, baseDepth: 0.45, baseHeight: 1.0, 
      floors: 3, floorHeight: 0.33, 
      roofHeight: 0.25, roofWidth: 0.4,
      windowWidth: 0.035, windowHeight: 0.12, windowDepth: 0.01, windowSpacing: 0.08,
      colorOffset: 0.05
    },
    landmark: { 
      baseWidth: 0.5, baseDepth: 0.5, baseHeight: 1.5, 
      floors: 5, floorHeight: 0.3, 
      roofHeight: 0.2, roofWidth: 0.45,
      windowWidth: 0.04, windowHeight: 0.15, windowDepth: 0.01, windowSpacing: 0.1,
      colorOffset: 0
    },
    small: { 
      baseWidth: 0.2, baseDepth: 0.2, baseHeight: 0.4, 
      floors: 1, floorHeight: 0.4, 
      roofHeight: 0.1, roofWidth: 0.18,
      windowWidth: 0.02, windowHeight: 0.06, windowDepth: 0.01, windowSpacing: 0.05,
      colorOffset: 0
    },
  };
  
  const config = buildingConfigs[type] || buildingConfigs.house;
  const finalScale = scale;
  const adjustedColor = new THREE.Color(color);
  adjustedColor.offsetHSL(config.colorOffset, 0, 0);

  return (
    <group ref={buildingRef} position={position} scale={finalScale}>
      <group>
        <mesh position={[0, config.baseHeight / 2, 0]}>
          <boxGeometry args={[config.baseWidth, config.baseHeight, config.baseDepth]} />
          <meshStandardMaterial 
            color={adjustedColor.getStyle()}
            roughness={0.7}
            metalness={0.05}
          />
        </mesh>
        
        {Array.from({ length: config.floors - 1 }).map((_, i) => {
          const floorY = config.baseHeight + (i + 1) * config.floorHeight;
          return (
            <mesh key={`floor-${i}`} position={[0, floorY, 0]}>
              <boxGeometry args={[config.baseWidth * 0.95, config.floorHeight, config.baseDepth * 0.95]} />
              <meshStandardMaterial 
                color={adjustedColor.getStyle()}
                roughness={0.7}
                metalness={0.05}
              />
            </mesh>
          );
        })}
        
        <mesh position={[0, config.baseHeight + (config.floors - 1) * config.floorHeight + config.roofHeight / 2, 0]}>
          <boxGeometry args={[config.roofWidth, config.roofHeight, config.roofWidth]} />
          <meshStandardMaterial 
            color={adjustedColor.clone().offsetHSL(-0.05, 0, -0.1).getStyle()}
            roughness={0.8}
            metalness={0.02}
          />
        </mesh>
        
        {Array.from({ length: config.floors }).map((_, floorIndex) => {
          const floorY = config.baseHeight / 2 + floorIndex * config.floorHeight;
          const windowY = floorY + config.floorHeight / 2;
          const windowCount = Math.floor(config.baseWidth / (config.windowSpacing + config.windowWidth));
          
          return (
            <React.Fragment key={`windows-f-${floorIndex}`}>
              {Array.from({ length: windowCount }).map((_, w) => {
                const windowX = (w - (windowCount - 1) / 2) * (config.windowSpacing + config.windowWidth);
                return (
                  <mesh key={`window-f-${floorIndex}-${w}`} position={[windowX, windowY, config.baseDepth / 2 + 0.01]}>
                    <boxGeometry args={[config.windowWidth, config.windowHeight, config.windowDepth]} />
                    <meshStandardMaterial 
                      color="#41c9ff"
                      transparent
                      opacity={0.7}
                      emissive="#41c9ff"
                      emissiveIntensity={0.2}
                    />
                  </mesh>
                );
              })}
              
              {Array.from({ length: windowCount }).map((_, w) => {
                const windowX = (w - (windowCount - 1) / 2) * (config.windowSpacing + config.windowWidth);
                return (
                  <mesh key={`window-b-${floorIndex}-${w}`} position={[windowX, windowY, -config.baseDepth / 2 - 0.01]}>
                    <boxGeometry args={[config.windowWidth, config.windowHeight, config.windowDepth]} />
                    <meshStandardMaterial 
                      color="#41c9ff"
                      transparent
                      opacity={0.7}
                      emissive="#41c9ff"
                      emissiveIntensity={0.2}
                    />
                  </mesh>
                );
              })}
            </React.Fragment>
          );
        })}
        
        <mesh position={[0, config.baseHeight / 2, config.baseDepth / 2 + 0.01]}>
          <boxGeometry args={[0.08, 0.12, 0.02]} />
          <meshStandardMaterial color="#5d4037" roughness={0.8} metalness={0.1} />
        </mesh>
      </group>
      
      <Html distanceFactor={80} position={[0, config.baseHeight + config.roofHeight + 0.3, 0]}>
        <div style={{
          color: color,
          fontSize: '11px',
          fontWeight: 'bold',
          textAlign: 'center',
          textShadow: '2px 2px 4px black',
          backgroundColor: 'rgba(0,0,0,0.8)',
          padding: '3px 8px',
          borderRadius: '4px',
          border: `1px solid ${color}`,
        }}>
          {name}
        </div>
      </Html>
    </group>
  );
}

// Fortnite POIs
function FortnitePOIs({ 
  visible, 
  pois,
  theme,
  selectedPoi
}: { 
  visible: boolean;
  pois: MapPoi[];
  theme: MapTheme;
  selectedPoi: string | null;
}) {
  if (!visible) return null;

  const poiToBuildingType: Record<string, any> = {
    'Tilted Towers': 'city', 'Neo Tilted': 'city', 'Mega City': 'city',
    'Daily Bugle': 'city', 'The Agency': 'landmark', 'The Authority': 'landmark',
    'Pleasant Park': 'house', 'Salty Springs': 'house', 'Sweaty Sands': 'house',
    'Retail Row': 'shop', 'Greasy Grove': 'shop', 'Dirty Docks': 'factory',
    'Steamy Stacks': 'factory', 'Lazy Lake': 'landmark', 'Loot Lake': 'landmark',
    'Craggy Cliffs': 'landmark', 'Rocky Reels': 'landmark',
  };

  return (
    <group>
      {pois.map((poi: MapPoi, index) => {
        const position: [number, number, number] = [poi.x * SCALE, 0, poi.z * SCALE];
        const type = poiToBuildingType[poi.name] || 'small';
        const isSelected = selectedPoi === poi.name;
        const scale = isSelected ? 1.1 : 1.0;
        
        return (
          <FortniteBuilding
            key={`${poi.name}-${index}`}
            position={position}
            name={poi.name}
            color={poi.color}
            type={type}
            theme={theme}
            scale={scale}
          />
        );
      })}
    </group>
  );
}

// Fortnite Player
function FortnitePlayer({ 
  player,
  selected,
  theme
}: {
  player: PlayerState;
  selected: boolean;
  theme: MapTheme;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const position = w2s(player.position);
  const skin = player.skin;
  const primary = skin?.primaryColor || teamColor(player);
  const accent = skin?.accentColor || '#ffffff';

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = player.rotation;
      groupRef.current.position.y = position[1] + Math.sin(Date.now() * 0.003 + player.id) * 0.003;
    }
  });

  if (!player.isAlive) return null;

  const scale = selected ? 1.3 : 1.0;

  return (
    <group ref={groupRef} position={[position[0], position[1], position[2]]} scale={scale}>
      <group>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[0.1, 0.12, 0.08]} />
          <meshStandardMaterial color={primary} roughness={0.6} metalness={0.05} />
        </mesh>
        
        <mesh position={[0, 0.155, 0]}>
          <boxGeometry args={[0.07, 0.07, 0.07]} />
          <meshStandardMaterial color={primary} roughness={0.7} />
        </mesh>
        
        <mesh position={[-0.065, 0.11, 0]}>
          <boxGeometry args={[0.04, 0.09, 0.03]} />
          <meshStandardMaterial color={accent} roughness={0.6} />
        </mesh>
        
        <mesh position={[0.065, 0.11, 0]}>
          <boxGeometry args={[0.04, 0.09, 0.03]} />
          <meshStandardMaterial color={accent} roughness={0.6} />
        </mesh>
        
        <mesh position={[-0.035, 0.04, 0]}>
          <boxGeometry args={[0.03, 0.09, 0.03]} />
          <meshStandardMaterial color={primary} roughness={0.6} />
        </mesh>
        
        <mesh position={[0.035, 0.04, 0]}>
          <boxGeometry args={[0.03, 0.09, 0.03]} />
          <meshStandardMaterial color={primary} roughness={0.6} />
        </mesh>
        
        <mesh position={[0, 0.12, -0.04]}>
          <boxGeometry args={[0.02, 0.04, 0.01]} />
          <meshStandardMaterial color={accent} metalness={0.3} roughness={0.5} />
        </mesh>
      </group>
      
      {selected && (
        <>
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[0.12, 0.16, 0.1]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
          </mesh>
          <pointLight position={[0, 0.3, 0]} color="#ffffff" intensity={0.8} distance={2} />
        </>
      )}
      
      {selected && (
        <Html distanceFactor={80} position={[0, 0.35, 0]}>
          <div style={{
            width: '50px',
            backgroundColor: 'rgba(0,0,0,0.8)',
            borderRadius: '3px',
            padding: '2px',
            border: '1px solid #333',
          }}>
            <div style={{
              width: '100%', height: '6px', backgroundColor: '#333',
              borderRadius: '2px', marginBottom: '1px', overflow: 'hidden',
            }}>
              <div style={{
                width: `${player.health}%`, height: '100%',
                background: player.health > 50 ? '#4caf50' : player.health > 25 ? '#ffc107' : '#f44336',
              }} />
            </div>
            {player.shield > 0 && (
              <div style={{
                width: '100%', height: '4px', backgroundColor: '#333',
                borderRadius: '2px', overflow: 'hidden',
              }}>
                <div style={{ width: `${player.shield}%`, height: '100%', background: '#41c9ff' }} />
              </div>
            )}
            <div style={{
              color: '#fff', fontSize: '8px', fontWeight: 'bold',
              textAlign: 'center', marginTop: '1px',
            }}>
              {player.name || getFallbackPlayerName(player.id)}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Fortnite Trees
function FortniteTree({ position, theme }: { position: [number, number, number]; theme: MapTheme }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 0.15, 8]} />
        <meshStandardMaterial color="#5d4037" roughness={0.9} />
      </mesh>
      
      <mesh position={[0, 0.2, 0]}>
        <coneGeometry args={[0.06, 0.12, 8]} />
        <meshStandardMaterial color={theme.landSecondary} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.28, 0]} rotation={[0, 0.3, 0]}>
        <coneGeometry args={[0.05, 0.08, 8]} />
        <meshStandardMaterial color={theme.landSecondary} roughness={0.95} />
      </mesh>
    </group>
  );
}

// Fortnite Rocks
function FortniteRock({ position, theme, size }: { position: [number, number, number]; theme: MapTheme; size: number }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[size, size * 0.5, size]} />
      <meshStandardMaterial color={theme.land} roughness={0.98} metalness={0.02} />
    </mesh>
  );
}

// Fortnite Environment
function FortniteEnvironment({ theme, visible }: { theme: MapTheme; visible: boolean }) {
  if (!visible) return null;

  const elements = [];
  
  for (let i = 0; i < 150; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 3 + Math.random() * (SCENE_SIZE / 2 - 3);
    const x = Math.cos(angle) * distance * (0.7 + Math.random() * 0.6);
    const z = Math.sin(angle) * distance * (0.7 + Math.random() * 0.6);
    
    if (Math.random() > 0.4) {
      elements.push(<FortniteTree key={`tree-${i}`} position={[x, 0, z]} theme={theme} />);
    }
  }
  
  for (let i = 0; i < 100; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 2 + Math.random() * (SCENE_SIZE / 2 - 2);
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const size = 0.03 + Math.random() * 0.07;
    
    if (Math.random() > 0.6) {
      elements.push(<FortniteRock key={`rock-${i}`} position={[x, 0, z]} theme={theme} size={size} />);
    }
  }
  
  return <group>{elements}</group>;
}

// Fortnite Storm
function FortniteStorm({ circle, visible, theme }: { circle?: StormCircle; visible: boolean; theme: MapTheme }) {
  if (!circle || !visible) return null;
  
  const position = w2s(circle.center);
  const radius = circle.radius * SCALE;
  
  return (
    <group>
      <mesh position={[position[0], 0, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius, radius + 0.03, 128]} />
        <meshStandardMaterial 
          color="#7132bc" 
          transparent 
          opacity={0.4}
          side={THREE.DoubleSide}
          roughness={0.8}
          emissive="#7132bc"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      <mesh position={[position[0], 0.01, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.02, radius + 0.02, 64]} />
        <meshBasicMaterial color="#41c9ff" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      
      <Html distanceFactor={80} position={[position[0], 0.3, position[2]]}>
        <div style={{
          color: '#c18cff', fontSize: '13px', fontWeight: 'bold',
          textAlign: 'center', textShadow: '2px 2px 4px black',
          backgroundColor: 'rgba(0,0,0,0.9)', padding: '3px 10px',
          borderRadius: '5px', border: '1px solid #c18cff',
        }}>
          STORM PHASE {circle.phase + 1}
        </div>
      </Html>
    </group>
  );
}

// Fortnite Kill Marker
function FortniteKillMarker({ 
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
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.05, 0.05, 0.05]} />
        <meshBasicMaterial color="#ff3f64" transparent opacity={opacity * 0.9} />
      </mesh>
      
      <mesh position={[0, 0.01, 0]} rotation={[Math.PI / 4, 0, 0]}>
        <planeGeometry args={[0.15, 0.15]} />
        <meshBasicMaterial color="#ff1a33" transparent opacity={opacity * 0.4} side={THREE.DoubleSide} />
      </mesh>
      
      <Html distanceFactor={80} position={[0, 0.2, 0]}>
        <div style={{
          color: '#ff7890', fontSize: '10px', fontWeight: 'bold',
          textAlign: 'center', textShadow: '2px 2px 4px black',
          backgroundColor: 'rgba(0,0,0,0.7)', padding: '2px 6px',
          borderRadius: '4px', border: '1px solid #ff7890',
        }}>
          {victim}
        </div>
      </Html>
    </group>
  );
}

// Fortnite Camera Controller
function FortniteCameraController({ 
  cameraMode,
  selectedPlayerId,
  currentFrame,
  setCameraMode
}: {
  cameraMode: 'free' | 'player' | 'top' | 'first-person' | 'third-person';
  selectedPlayerId: number | null;
  currentFrame: PlayerState[];
  setCameraMode: (mode: 'free' | 'player' | 'top' | 'first-person' | 'third-person') => void;
}) {
  const { camera } = useThree();
  const targetPosition = useRef(new THREE.Vector3());

  useFrame(() => {
    const player = currentFrame.find((p) => p.id === selectedPlayerId);
    
    if (!player?.isAlive) {
      if (cameraMode !== 'free') setCameraMode('free');
      return;
    }

    const playerPos = w2s(player.position);
    
    switch (cameraMode) {
      case 'first-person':
        targetPosition.current.set(playerPos[0], playerPos[1] + 0.18, playerPos[2]);
        camera.position.lerp(targetPosition.current, 0.15);
        camera.rotation.set(0, player.rotation, 0);
        camera.translateZ(-0.05);
        break;
        
      case 'third-person':
        const tpOffsetX = Math.sin(player.rotation) * 0.4;
        const tpOffsetZ = Math.cos(player.rotation) * 0.4;
        targetPosition.current.set(
          playerPos[0] - tpOffsetX,
          playerPos[1] + 0.35,
          playerPos[2] - tpOffsetZ
        );
        camera.position.lerp(targetPosition.current, 0.1);
        camera.lookAt(playerPos[0], playerPos[1] + 0.15, playerPos[2]);
        break;
        
      case 'player':
        const followOffsetX = Math.sin(player.rotation) * 0.8;
        const followOffsetZ = Math.cos(player.rotation) * 0.8;
        targetPosition.current.set(
          playerPos[0] - followOffsetX,
          playerPos[1] + 0.5,
          playerPos[2] - followOffsetZ
        );
        camera.position.lerp(targetPosition.current, 0.08);
        camera.lookAt(playerPos[0], playerPos[1] + 0.15, playerPos[2]);
        break;
        
      case 'top':
        targetPosition.current.set(0, 12, 0);
        camera.position.lerp(targetPosition.current, 0.05);
        camera.lookAt(0, 0, 0);
        break;
        
      default:
        break;
    }
  });

  return null;
}

// Main Component
interface TrueFortnite3DMapProps {
  useArchiveSurface?: boolean;
}

export default function TrueFortnite3DMap({ useArchiveSurface = true }: TrueFortnite3DMapProps) {
  const {
    currentFrame,
    currentStorm,
    selectedPlayerId,
    showStorm,
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

  const pois = useMemo(() => mapPreset.pois || [], [mapPreset.pois]);
  const releaseVersion = replayData?.metadata.releaseVersion;

  const visiblePlayers = useMemo(() => currentFrame.filter((player) => player.isAlive), [currentFrame]);
  const frames = replayData?.frames || [];
  const kills = replayData?.kills || [];

  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: [0, 5, 8], fov: 70, near: 0.1, far: 1000 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        style={{ background: mapPreset.theme.fog }}
        shadows
      >
        <ambientLight intensity={0.4} color="#ffffff" />
        
        <directionalLight 
          position={[10, 20, 5]} 
          intensity={1.2} 
          color="#ffffff" 
          castShadow 
          shadow-mapSize-width={4096} 
          shadow-mapSize-height={4096}
        />
        
        <directionalLight position={[-10, 10, -5]} intensity={0.3} color="#ffccaa" />
        <directionalLight position={[0, 30, 0]} intensity={0.2} color="#8888ff" />
        

        
        <fog attach="fog" args={[mapPreset.theme.fog, 8, 50]} />
        <Environment preset="city" />

        <FortniteIsland 
          seasonId={activeSeason} 
          releaseVersion={releaseVersion}
          theme={mapPreset.theme}
          visible={showTerrain}
        />
        
        <FortniteEnvironment theme={mapPreset.theme} visible={showTerrain} />
        <FortnitePOIs visible={showPOIs} pois={pois} theme={mapPreset.theme} selectedPoi={selectedPoi} />
        
        <FortniteStorm circle={currentStorm} visible={showStorm} theme={mapPreset.theme} />
        
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
                }) : [0, 0, 0];
                const age = Math.max(0, Math.min(1, (currentTime - kill.time) / 60));
                return (
                  <FortniteKillMarker 
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
        
        <group>
          {visiblePlayers.map((player) => (
            <FortnitePlayer
              key={player.id}
              player={player}
              selected={player.id === selectedPlayerId}
              theme={mapPreset.theme}
            />
          ))}
        </group>

        <FortniteCameraController 
          cameraMode={cameraMode}
          selectedPlayerId={selectedPlayerId}
          currentFrame={currentFrame}
          setCameraMode={setCameraMode}
        />
        
        <OrbitControls
          enabled={cameraMode === 'free'}
          enableDamping
          dampingFactor={0.05}
          minDistance={0.5}
          maxDistance={100}
          maxPolarAngle={Math.PI / 2.05}
          target={[0, 0, 0]}
          makeDefault
        />
        
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={['#ff4444', '#4caf50', '#41c9ff']} labelColor="white" />
        </GizmoHelper>
      </Canvas>

      <div className="pointer-events-auto absolute top-4 left-4 z-50 flex gap-2 rounded-xl bg-black/70 p-2 backdrop-blur-xl border border-white/10">
        <button onClick={() => setCameraMode('free')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${cameraMode === 'free' ? 'bg-white/20 text-white border border-white/30' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>🎥 Free</button>
        <button onClick={() => setCameraMode('player')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${cameraMode === 'player' ? 'bg-white/20 text-white border border-white/30' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>👤 Follow</button>
        <button onClick={() => setCameraMode('third-person')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${cameraMode === 'third-person' ? 'bg-white/20 text-white border border-white/30' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>3rd Person</button>
        <button onClick={() => setCameraMode('first-person')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${cameraMode === 'first-person' ? 'bg-white/20 text-white border border-white/30' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>1st Person</button>
        <button onClick={() => setCameraMode('top')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${cameraMode === 'top' ? 'bg-white/20 text-white border border-white/30' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>🗺️ Top Down</button>
      </div>

      <div className="pointer-events-none absolute bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-fn-gray backdrop-blur-md">
        <span className="h-2 w-2 rounded-full bg-fn-green shadow-[0_0_8px_#00ff9d]" />
        <span>{visiblePlayers.length} PLAYERS</span>
        <span className="text-fn-border">|</span>
        <span>{mapPreset.short}</span>
        <span className="text-fn-border">|</span>
        <span>CAMERA: {cameraMode}</span>
        <span className="text-fn-border">|</span>
        <span className="text-fn-purple">REAL FORTNITE 3D</span>
      </div>

      {selectedPoi && (
        <div className="pointer-events-auto absolute bottom-28 left-4 bg-black/70 backdrop-blur-xl border border-white/10 rounded-xl p-3 max-w-xs">
          <div className="text-xs font-bold text-white truncate">{selectedPoi}</div>
          <button onClick={() => setSelectedPoi(null)} className="text-xs text-gray-400 hover:text-white mt-1">Close</button>
        </div>
      )}
    </div>
  );
}
