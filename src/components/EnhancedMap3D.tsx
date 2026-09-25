'use client';

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, OrbitControls, Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { useReplayStore } from '@/lib/replay-store';
import { getMapPreset } from '@/lib/map-presets';
import type { MapPoi, MapTheme, MapPreset } from '@/lib/map-presets';
import { getDeviceEventPhase, getDeviceEventProgress, THE_DEVICE_EVENT, type LiveEvent, type LiveEventId, type LiveEventPhase, LIVE_EVENTS, getEventById } from '@/lib/event-presets';
import { getFallbackPlayerName } from '@/lib/player-identity';
import type { GameEvent, KillEvent, PlayerState, StormCircle, Vector3 } from '@/lib/types';

const SCALE = 0.000085;
const ISLAND_RADIUS = 4.45;

function w2s(position: Vector3, y = 0): [number, number, number] {
  return [position.x * SCALE, y + position.y * SCALE * 0.05, position.z * SCALE];
}

function worldLine(points: Vector3[], y = 0.025): [number, number, number][] {
  return points.map((point) => w2s(point, y));
}

// Enhanced POI definitions with building information
interface EnhancedPOI extends MapPoi {
  buildingType?: 'skyscraper' | 'house' | 'shop' | 'factory' | 'mansion' | 'barn' | 'gas_station' | 'landmark';
  buildingCount?: number;
  elevation?: number;
}

// Enhanced terrain patches with more detail
const ENHANCED_TERRAIN_PATCHES = [
  { x: -22000, z: -18000, radius: 17000, color: '#243e34', opacity: 0.8, type: 'forest' },
  { x: 16000, z: -17000, radius: 15000, color: '#403c26', opacity: 0.72, type: 'desert' },
  { x: 18000, z: 18000, radius: 18000, color: '#44351f', opacity: 0.78, type: 'mountain' },
  { x: -19000, z: 22000, radius: 17000, color: '#314c30', opacity: 0.76, type: 'forest' },
  { x: 0, z: 0, radius: 15000, color: '#243c42', opacity: 0.62, type: 'urban' },
  { x: -4000, z: -8000, radius: 6500, color: '#14506a', opacity: 0.85, type: 'water' },
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

// Enhanced Terrain with better elevation and detail
function EnhancedTerrain({ theme }: { theme: MapTheme }) {
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
      {/* Deep ocean with better material */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]}>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial color={theme.ocean} roughness={0.9} metalness={0.1} />
      </mesh>
      
      {/* Island base with elevation */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}>
        <shapeGeometry args={[islandShape]} />
        <meshStandardMaterial 
          color={theme.land} 
          roughness={0.95} 
          metalness={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Enhanced coastal rim with waves effect */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[4.2, 4.44, 96]} />
        <meshStandardMaterial 
          color={theme.water} 
          transparent 
          opacity={0.42} 
          roughness={0.8}
          side={THREE.DoubleSide} 
        />
      </mesh>
      
      {/* Terrain color regions with more variety */}
      {ENHANCED_TERRAIN_PATCHES.map((patch, index) => {
        const colors = [theme.regionA, theme.regionB, theme.regionC, theme.landSecondary, theme.regionC, theme.water];
        const roughness = patch.type === 'water' ? 0.9 : patch.type === 'forest' ? 0.95 : 0.85;
        return (
          <mesh key={`${patch.x}-${patch.z}`} rotation={[-Math.PI / 2, 0, 0]} position={[patch.x * SCALE, 0.005, patch.z * SCALE]}>
            <circleGeometry args={[patch.radius * SCALE, 48]} />
            <meshStandardMaterial 
              color={colors[index % colors.length]} 
              transparent 
              opacity={patch.opacity} 
              roughness={roughness}
              metalness={0.05}
              side={THREE.DoubleSide} 
            />
          </mesh>
        );
      })}
      
      {/* Enhanced Lake with depth effect */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4000 * SCALE, 0.025, -8000 * SCALE]}>
        <circleGeometry args={[0.63, 48]} />
        <meshStandardMaterial color={theme.water} transparent opacity={0.86} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4000 * SCALE, 0.03, -8000 * SCALE]}>
        <ringGeometry args={[0.62, 0.68, 48]} />
        <meshStandardMaterial color={theme.accent} transparent opacity={0.38} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Enhanced topographic contour rings */}
      {[1.3, 2.05, 2.8, 3.55, 4.2].map((radius) => (
        <mesh key={radius} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <ringGeometry args={[radius, radius + 0.008, 96]} />
          <meshBasicMaterial color={theme.landSecondary} transparent opacity={0.14} side={THREE.DoubleSide} />
        </mesh>
      ))}
      
      {/* Enhanced Roads with better materials */}
      {ROAD_NETWORK.map((road, index) => (
        <React.Fragment key={`road-${index}`}>
          <Line points={worldLine(road, 0.035)} color={theme.landSecondary} lineWidth={4} transparent opacity={0.4} />
          <Line points={worldLine(road, 0.039)} color={theme.accent} lineWidth={1} transparent opacity={0.7} />
        </React.Fragment>
      ))}
      
      {/* Enhanced Rivers */}
      {RIVER_PATHS.map((river, index) => (
        <React.Fragment key={`river-${index}`}>
          <Line points={worldLine(river, 0.042)} color={theme.water} lineWidth={8} transparent opacity={0.3} />
          <Line points={worldLine(river, 0.045)} color={theme.accent} lineWidth={2} transparent opacity={0.8} />
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

// Enhanced Mountain Decor with better geometry
function EnhancedMountainDecor({ theme }: { theme: MapTheme }) {
  const mountains = [
    { x: -3.1, z: -2.9, radius: 0.28, height: 0.35, segments: 8 },
    { x: -2.7, z: -3.1, radius: 0.19, height: 0.25, segments: 6 },
    { x: 2.8, z: -2.5, radius: 0.25, height: 0.32, segments: 8 },
    { x: 2.9, z: 2.45, radius: 0.3, height: 0.4, segments: 10 },
    { x: 1.2, z: 3.2, radius: 0.2, height: 0.28, segments: 6 },
    { x: -3.15, z: 1.8, radius: 0.22, height: 0.3, segments: 8 },
    { x: -1.3, z: 2.9, radius: 0.18, height: 0.24, segments: 6 },
    { x: 0.2, z: -3.1, radius: 0.22, height: 0.28, segments: 6 },
  ];

  return (
    <group>
      {mountains.map((mountain, index) => (
        <mesh key={index} position={[mountain.x, mountain.height * 0.5, mountain.z]}>
          <coneGeometry args={[mountain.radius, mountain.height, mountain.segments]} />
          <meshStandardMaterial 
            color={index % 2 ? theme.landSecondary : theme.land} 
            roughness={0.85} 
            metalness={0.05}
          />
        </mesh>
      ))}
    </group>
  );
}

// Enhanced POI Markers with 3D buildings
function EnhancedPOIMarkers({ visible, pois, theme }: { visible: boolean; pois: MapPoi[]; theme: MapTheme }) {
  if (!visible) return null;

  // Define building configurations for different POI types
  const poiConfigurations: Record<string, { 
    buildingType: string; 
    buildingCount: number; 
    color: string;
    scale: number;
  }> = {
    'Tilted Towers': { buildingType: 'skyscraper', buildingCount: 8, color: '#ff5368', scale: 1.2 },
    'Salty Springs': { buildingType: 'house', buildingCount: 6, color: '#ffb347', scale: 0.8 },
    'Pleasant Park': { buildingType: 'house', buildingCount: 10, color: '#52d273', scale: 0.7 },
    'Retail Row': { buildingType: 'shop', buildingCount: 8, color: '#ff914d', scale: 0.9 },
    'Dusty Depot': { buildingType: 'factory', buildingCount: 4, color: '#a56bff', scale: 1.0 },
    'Loot Lake': { buildingType: 'landmark', buildingCount: 1, color: '#39c6ff', scale: 1.5 },
    'Sunny Steps': { buildingType: 'mansion', buildingCount: 3, color: '#ffc14d', scale: 1.1 },
    'Lucky Landing': { buildingType: 'shop', buildingCount: 6, color: '#ff66a8', scale: 0.8 },
    'Fatal Fields': { buildingType: 'barn', buildingCount: 5, color: '#dbad4c', scale: 0.9 },
    'Wailing Woods': { buildingType: 'landmark', buildingCount: 1, color: '#54ba62', scale: 1.3 },
    'Risky Reels': { buildingType: 'landmark', buildingCount: 1, color: '#ff795b', scale: 1.4 },
    'Tomato Temple': { buildingType: 'landmark', buildingCount: 1, color: '#ff7043', scale: 1.2 },
    'Haunted Hills': { buildingType: 'mansion', buildingCount: 2, color: '#9a62db', scale: 1.0 },
    'Junk Junction': { buildingType: 'factory', buildingCount: 4, color: '#a9a9a9', scale: 1.0 },
    'Shifty Shafts': { buildingType: 'factory', buildingCount: 3, color: '#d39449', scale: 0.9 },
    'Greasy Grove': { buildingType: 'shop', buildingCount: 6, color: '#4ac894', scale: 0.8 },
  };

  return (
    <group>
      {pois.map((poi: MapPoi, index) => {
        const isMajor = poi.size === 'major';
        const position: [number, number, number] = [poi.x * SCALE, 0.07, poi.z * SCALE];
        const dotSize = isMajor ? 0.03 : 0.018;
        const config = poiConfigurations[poi.name] || { buildingType: 'house', buildingCount: 3, color: poi.color, scale: 0.8 };

        return (
          <group key={`${poi.name}-${index}`} position={position}>
            {isMajor && (
              <>
                {/* Base glow effect */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.055, 0]}>
                  <circleGeometry args={[0.18, 32]} />
                  <meshBasicMaterial color={config.color} transparent opacity={0.12} side={THREE.DoubleSide} />
                </mesh>
                
                {/* Create 3D buildings based on POI type */}
                {Array.from({ length: config.buildingCount }).map((_, buildingIndex) => {
                  const angle = (buildingIndex / config.buildingCount) * Math.PI * 2;
                  const distance = 0.08 + (buildingIndex % 3) * 0.02;
                  const bx = Math.cos(angle) * distance;
                  const bz = Math.sin(angle) * distance;
                  const buildingHeight = 0.08 + Math.random() * 0.04;
                  
                  return (
                    <group key={buildingIndex} position={[bx, buildingHeight * 0.5, bz]}>
                      {config.buildingType === 'skyscraper' && (
                        <RoundedBox args={[0.045 * config.scale, buildingHeight, 0.045 * config.scale]} radius={0.01} smoothness={4}>
                          <meshStandardMaterial 
                            color={config.color} 
                            transparent 
                            opacity={0.85} 
                            roughness={0.3} 
                            metalness={0.2}
                          />
                        </RoundedBox>
                      )}
                      {config.buildingType === 'house' && (
                        <RoundedBox args={[0.035 * config.scale, buildingHeight, 0.035 * config.scale]} radius={0.008} smoothness={4}>
                          <meshStandardMaterial 
                            color={config.color} 
                            transparent 
                            opacity={0.8} 
                            roughness={0.5} 
                            metalness={0.1}
                          />
                        </RoundedBox>
                      )}
                      {config.buildingType === 'shop' && (
                        <RoundedBox args={[0.04 * config.scale, buildingHeight, 0.03 * config.scale]} radius={0.006} smoothness={4}>
                          <meshStandardMaterial 
                            color={config.color} 
                            transparent 
                            opacity={0.75} 
                            roughness={0.4} 
                            metalness={0.15}
                          />
                        </RoundedBox>
                      )}
                      {config.buildingType === 'factory' && (
                        <RoundedBox args={[0.05 * config.scale, buildingHeight, 0.04 * config.scale]} radius={0.005} smoothness={4}>
                          <meshStandardMaterial 
                            color={config.color} 
                            transparent 
                            opacity={0.8} 
                            roughness={0.4} 
                            metalness={0.3}
                          />
                        </RoundedBox>
                      )}
                      {(config.buildingType === 'mansion' || config.buildingType === 'landmark') && (
                        <RoundedBox args={[0.055 * config.scale, buildingHeight, 0.055 * config.scale]} radius={0.012} smoothness={4}>
                          <meshStandardMaterial 
                            color={config.color} 
                            transparent 
                            opacity={0.85} 
                            roughness={0.35} 
                            metalness={0.15}
                          />
                        </RoundedBox>
                      )}
                    </group>
                  );
                })}
              </>
            )}
            
            {/* POI dot marker */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[dotSize, dotSize * 0.75, isMajor ? 0.05 : 0.03, 16]} />
              <meshBasicMaterial color={poi.color} transparent opacity={isMajor ? 0.98 : 0.7} />
            </mesh>
            
            {/* POI name label */}
            <Text
              position={[0, isMajor ? 0.14 : 0.09, 0]}
              fontSize={isMajor ? 0.055 : 0.035}
              color={poi.color}
              anchorX="center"
              anchorY="bottom"
              outlineWidth={0.004}
              outlineColor="#050508"
              maxWidth={isMajor ? 1.2 : 0.8}
            >
              {poi.name}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

// Player trail with enhanced visuals
function EnhancedPlayerTrail({ positions, color, selected }: { positions: Vector3[]; color: string; selected: boolean }) {
  if (positions.length < 2) return null;
  
  return (
    <Line
      points={positions.map((position) => w2s(position, 0.09))}
      color={color}
      lineWidth={selected ? 3.2 : 1.4}
      transparent
      opacity={selected ? 0.95 : 0.35}
      dashed={!selected}
      dashSize={0.03}
      gapSize={0.02}
    />
  );
}

// Enhanced Player Dot with better 3D models
function EnhancedPlayerDot({
  player,
  selected,
}: {
  player: PlayerState;
  selected: boolean;
}) {
  const avatarRef = useRef<THREE.Group>(null);
  const position = w2s(player.position, 0.14);
  const skin = player.skin;
  const primary = skin?.primaryColor || teamColor(player);
  const accent = skin?.accentColor || '#ffffff';
  const style = skin?.style || 'human';

  useFrame(() => {
    if (avatarRef.current) {
      avatarRef.current.position.y = position[1] + Math.sin(Date.now() * 0.002 + player.id) * 0.008;
    }
  });

  if (!player.isAlive) return null;

  return (
    <group>
      <group ref={avatarRef} position={position}>
        {/* Enhanced player model */}
        <>
          {/* Head */}
          <mesh position={[0, 0.06, 0]}>
            <sphereGeometry args={[selected ? 0.03 : 0.022, 16, 16]} />
            <meshStandardMaterial color={primary} transparent opacity={selected ? 1 : 0.98} roughness={0.4} metalness={0.1} />
          </mesh>
          
          {/* Body */}
          <mesh position={[0, 0.015, 0]}>
            <boxGeometry args={[selected ? 0.05 : 0.038, selected ? 0.065 : 0.05, selected ? 0.03 : 0.022]} />
            <meshStandardMaterial color={primary} transparent opacity={selected ? 1 : 0.95} roughness={0.5} metalness={0.1} />
          </mesh>
          
          {/* Arms */}
          <mesh position={[-0.014, -0.025, 0]}>
            <boxGeometry args={[0.014, 0.04, 0.018]} />
            <meshStandardMaterial color={accent} transparent opacity={0.95} roughness={0.4} metalness={0.15} />
          </mesh>
          <mesh position={[0.014, -0.025, 0]}>
            <boxGeometry args={[0.014, 0.04, 0.018]} />
            <meshStandardMaterial color={accent} transparent opacity={0.95} roughness={0.4} metalness={0.15} />
          </mesh>
          
          {/* Legs */}
          <mesh position={[-0.008, -0.05, 0]}>
            <boxGeometry args={[0.012, 0.045, 0.016]} />
            <meshStandardMaterial color={primary} transparent opacity={0.9} roughness={0.5} metalness={0.1} />
          </mesh>
          <mesh position={[0.008, -0.05, 0]}>
            <boxGeometry args={[0.012, 0.045, 0.016]} />
            <meshStandardMaterial color={primary} transparent opacity={0.9} roughness={0.5} metalness={0.1} />
          </mesh>
          
          {/* Style-specific details */}
          {style === 'masked' && (
            <mesh position={[0, 0.06, 0.02]}>
              <boxGeometry args={[0.03, 0.01, 0.008]} />
              <meshStandardMaterial color={accent} metalness={0.3} />
            </mesh>
          )}
          
          {style === 'robot' && (
            <>
              <mesh position={[0, 0.095, 0]}>
                <cylinderGeometry args={[0.005, 0.005, 0.03, 8]} />
                <meshStandardMaterial color={accent} metalness={0.6} />
              </mesh>
              <mesh position={[0, 0.04, 0.025]}>
                <boxGeometry args={[0.018, 0.012, 0.008]} />
                <meshStandardMaterial color={accent} metalness={0.5} />
              </mesh>
            </>
          )}
          
          {style === 'animal' && (
            <>
              <mesh position={[-0.014, 0.08, 0]} rotation={[0, 0, -0.4]}>
                <coneGeometry args={[0.01, 0.022, 4]} />
                <meshStandardMaterial color={accent} roughness={0.3} />
              </mesh>
              <mesh position={[0.014, 0.08, 0]} rotation={[0, 0, 0.4]}>
                <coneGeometry args={[0.01, 0.022, 4]} />
                <meshStandardMaterial color={accent} roughness={0.3} />
              </mesh>
            </>
          )}
          
          {/* Selection ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.14, 0]}>
            <ringGeometry args={[selected ? 0.06 : 0.04, selected ? 0.075 : 0.05, 24]} />
            <meshBasicMaterial color={selected ? '#ffffff' : primary} transparent opacity={selected ? 0.95 : 0.4} side={THREE.DoubleSide} />
          </mesh>
        </>
      </group>
      
      {/* Player info display */}
      {selected && (
        <group position={[position[0], position[1] + 0.16, position[2]]}>
          {/* Health bar background */}
          <mesh>
            <planeGeometry args={[0.2, 0.01]} />
            <meshBasicMaterial color="#18221f" transparent opacity={0.95} />
          </mesh>
          
          {/* Health bar */}
          <mesh position={[-(0.2 * (1 - player.health / 100)) / 2, 0, 0.002]}>
            <planeGeometry args={[0.2 * Math.max(0, player.health / 100), 0.01]} />
            <meshBasicMaterial color="#00ff9d" />
          </mesh>
          
          {/* Shield bar (if shield > 0) */}
          {player.shield > 0 && (
            <mesh position={[-(0.2 * (1 - player.shield / 100)) / 2, -0.015, 0.002]}>
              <planeGeometry args={[0.2 * Math.max(0, player.shield / 100), 0.008]} />
              <meshBasicMaterial color="#4fc8ff" />
            </mesh>
          )}
          
          {/* Player name */}
          <Text position={[0, 0.04, 0]} fontSize={0.032} color="#ffffff" anchorX="center" anchorY="bottom" outlineWidth={0.004} outlineColor="#050508">
            {player.name || getFallbackPlayerName(player.id)}
          </Text>
          
          {/* Skin name */}
          {skin && (
            <Text position={[0, 0.01, 0]} fontSize={0.018} color={accent} anchorX="center" anchorY="bottom" outlineWidth={0.002} outlineColor="#050508">
              {skin.name}
            </Text>
          )}
        </group>
      )}
    </group>
  );
}

// Enhanced Storm Visualization
function EnhancedStormVisualization({ circle, visible, theme }: { circle?: StormCircle; visible: boolean; theme: MapTheme }) {
  if (!circle || !visible) return null;
  
  const position = w2s(circle.center, 0);
  const radius = circle.radius * SCALE;
  
  return (
    <group>
      {/* Outer storm ring */}
      <mesh position={[position[0], 0.02, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius, radius + 5, 128]} />
        <meshBasicMaterial color="#7132bc" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Inner storm ring with glow */}
      <mesh position={[position[0], 0.028, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.015, radius + 0.015, 128]} />
        <meshBasicMaterial color="#41c9ff" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Storm edge effect */}
      <mesh position={[position[0], 0.023, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.05, radius - 0.025, 128]} />
        <meshBasicMaterial color="#a869ff" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Zone label */}
      <Text position={[position[0], 0.09, position[2]]} fontSize={0.04} color="#c18cff" anchorX="center" anchorY="bottom" outlineWidth={0.004} outlineColor="#050508">
        {`ZONE ${circle.phase + 1}`}
      </Text>
    </group>
  );
}

// Enhanced Kill Markers
function EnhancedKillMarkers({ kills, frames, currentTime, visible }: { kills: KillEvent[]; frames: { time: number; players: PlayerState[] }[]; currentTime: number; visible: boolean }) {
  if (!visible) return null;

  const olderKills = kills.filter((kill) => kill.time <= currentTime - 45).slice(-80);
  const recentKills = kills.filter((kill) => kill.time <= currentTime && kill.time > currentTime - 45);

  function killPosition(kill: KillEvent): Vector3 {
    const frame = frames.find((f) => f.time <= kill.time);
    const killer = frame?.players.find((player) => player.id === kill.killerId);
    const victim = frame?.players.find((player) => player.id === kill.victimId);
    
    if (killer && victim) {
      return {
        x: (killer.position.x + victim.position.x) / 2,
        y: (killer.position.y + victim.position.y) / 2,
        z: (killer.position.z + victim.position.z) / 2,
      };
    }
    return killer?.position || victim?.position || { x: 0, y: 0, z: 0 };
  }

  return (
    <group>
      {olderKills.map((kill, index) => {
        const position = w2s(killPosition(kill), 0.1);
        return (
          <mesh key={`old-kill-${kill.time}-${index}`} position={position}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshBasicMaterial color="#ff496d" transparent opacity={0.4} />
          </mesh>
        );
      })}
      
      {recentKills.map((kill, index) => {
        const age = Math.max(0, Math.min(1, (currentTime - kill.time) / 45));
        const position = w2s(killPosition(kill), 0.13);
        return (
          <group key={`recent-kill-${kill.time}-${index}`} position={position}>
            <mesh>
              <octahedronGeometry args={[0.032]} />
              <meshBasicMaterial color="#ff3f64" transparent opacity={1 - age * 0.5} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.045, 0.055, 24]} />
              <meshBasicMaterial color="#ff3f64" transparent opacity={0.4} side={THREE.DoubleSide} />
            </mesh>
            <Text position={[0, 0.075, 0]} fontSize={0.028} color="#ff7890" anchorX="center" anchorY="bottom" outlineWidth={0.003} outlineColor="#050508">
              {kill.victim || 'Elimination'}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

// Event-specific 3D structures
function EventStructure({ eventId, time, theme }: { eventId: LiveEventId; time: number; theme: MapTheme }) {
  const event = getEventById(eventId);
  if (!event) return null;

  const phase = event.phases.find((p) => time >= p.start && time < p.end) || event.phases[event.phases.length - 1];
  const progress = Math.max(0, Math.min(1, (time - phase.start) / (phase.end - phase.start)));
  
  // Event-specific structures
  switch (eventId) {
    case 'the_device':
      return <DeviceStructure time={time} theme={theme} />;
    case 'galactus':
      return <GalactusStructure time={time} theme={theme} />;
    case 'collision':
      return <CollisionStructure time={time} theme={theme} />;
    case 'final_showdown':
      return <FinalShowdownStructure time={time} theme={theme} />;
    case 'the_end':
      return <TheEndStructure time={time} theme={theme} />;
    default:
      return <GenericEventStructure event={event} phase={phase} progress={progress} theme={theme} />;
  }
}

function DeviceStructure({ time, theme }: { time: number; theme: MapTheme }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const phase = getDeviceEventPhase(time, 'the_device');
  const progress = getDeviceEventProgress(time, 'the_device');
  const activation = Math.max(0, Math.min(1, (time - 150) / 270));
  const pulse = Math.max(0, Math.min(1, (time - 570) / 120));
  const device = w2s(THE_DEVICE_EVENT.deviceCenter || { x: -8000, y: 80, z: -20000 }, 0.08);
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
        {/* Base */}
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.52, 0.64, 0.12, 32]} />
          <meshStandardMaterial color="#29323c" metalness={0.8} roughness={0.3} />
        </mesh>
        
        {/* Core structure */}
        <mesh position={[0, 0.17, 0]}>
          <cylinderGeometry args={[0.32, 0.42, 0.06, 32]} />
          <meshBasicMaterial color="#e4ac4e" transparent opacity={0.8} />
        </mesh>
        
        {/* Rotating core */}
        <mesh ref={coreRef} position={[0, 0.38, 0]}>
          <octahedronGeometry args={[0.21, 1]} />
          <meshBasicMaterial color={phase.color} transparent opacity={0.9} />
        </mesh>
        
        {/* Energy sphere */}
        <mesh position={[0, 0.38, 0]}>
          <sphereGeometry args={[0.36 + activation * 0.08, 20, 20]} />
          <meshBasicMaterial color={phase.color} transparent opacity={0.08 + activation * 0.1} />
        </mesh>
        
        {/* Mechanical arms */}
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
        
        {/* Labels */}
        <Text position={[0, 0.76 + activation * 0.2, 0]} fontSize={0.065} color="#f6c867" anchorX="center" anchorY="bottom" outlineWidth={0.004} outlineColor="#050508">
          THE DEVICE
        </Text>
        <Text position={[0, 0.68 + activation * 0.2, 0]} fontSize={0.028} color={phase.color} anchorX="center" anchorY="bottom" outlineWidth={0.002} outlineColor="#050508">
          {phase.label.toUpperCase()}
        </Text>
      </group>

      {/* Energy beams */}
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

      {/* Pulse rings */}
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

      {/* Storm wall displacement */}
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
  const event = LIVE_EVENTS.galactus;
  const phase = event.phases.find((p) => time >= p.start && time < p.end) || event.phases[event.phases.length - 1];
  const progress = Math.max(0, Math.min(1, (time - phase.start) / (phase.end - phase.start)));
  
  // Galactus appears at position (0, 8, 4) in normalized coordinates
  const galactusPosition: [number, number, number] = [0, 8, 4];
  const approachProgress = Math.max(0, Math.min(1, time / 240));
  const actualY = 8 - approachProgress * 3;

  return (
    <group>
      {/* Galactus mothership */}
      <group position={[0, actualY, 4]}>
        <mesh>
          <boxGeometry args={[3, 0.5, 1]} />
          <meshStandardMaterial color="#1565c0" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.75, 0]}>
          <boxGeometry args={[0.5, 1, 0.5]} />
          <meshStandardMaterial color="#1976d2" metalness={0.9} roughness={0.2} />
        </mesh>
        <Text position={[0, 1.2, 0]} fontSize={0.05} color="#ffffff" anchorX="center" anchorY="bottom">
          GALACTUS
        </Text>
      </group>
      
      {/* Hero beams during attack phase */}
      {time >= 240 && time < 480 && (
        <>
          <Line points={[[0, 3, 2], [0, 8, 4]]} color="#ff5252" lineWidth={2} transparent opacity={0.9} />
          <Line points={[[0, 3, 2], [0, 8, 4]]} color="#ffeb3b" lineWidth={1} transparent opacity={0.7} />
        </>
      )}
      
      {/* Explosion effect during defeat */}
      {time >= 480 && (
        <mesh position={[0, 5, 4]}>
          <sphereGeometry args={[1 + (time - 480) * 0.02, 16, 16]} />
          <meshBasicMaterial color="#4caf50" transparent opacity={0.4 - (time - 480) * 0.002} />
        </mesh>
      )}
    </group>
  );
}

function CollisionStructure({ time, theme }: { time: number; theme: MapTheme }) {
  const event = LIVE_EVENTS.collision;
  const phase = event.phases.find((p) => time >= p.start && time < p.end) || event.phases[event.phases.length - 1];
  const progress = Math.max(0, Math.min(1, (time - phase.start) / (phase.end - phase.start)));
  
  return (
    <group>
      {/* Zero Point at center */}
      <group position={[0, 0.5, 0]}>
        <mesh>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#7c4dff" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.5, 0.05, 16, 32]} />
          <meshStandardMaterial color="#408cff" metalness={0.6} roughness={0.3} />
        </mesh>
        
        {/* Reality cracks */}
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
        
        {/* The Collider */}
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

function FinalShowdownStructure({ time, theme }: { time: number; theme: MapTheme }) {
  const event = LIVE_EVENTS.final_showdown;
  const phase = event.phases.find((p) => time >= p.start && time < p.end) || event.phases[event.phases.length - 1];
  const progress = Math.max(0, Math.min(1, (time - phase.start) / (phase.end - phase.start)));
  
  // Mothership position
  const mothershipY = time < 600 ? 8 : 5 - (time - 600) * 0.01;

  return (
    <group>
      {/* Mothership */}
      <group position={[0, mothershipY, 4]}>
        <mesh>
          <boxGeometry args={[3, 0.8, 1.5]} />
          <meshStandardMaterial color="#0d47a1" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[1, 1, 0.5]} />
          <meshStandardMaterial color="#1565c0" metalness={0.9} roughness={0.2} />
        </mesh>
        
        {/* Damage effects */}
        {time >= 480 && (
          <>
            <mesh position={[-0.5, 0.2, 0]}>
              <boxGeometry args={[0.2, 0.2, 0.2]} />
              <meshBasicMaterial color="#ff5252" transparent opacity={0.8} />
            </mesh>
            <mesh position={[0.5, 0.2, 0]}>
              <boxGeometry args={[0.2, 0.2, 0.2]} />
              <meshBasicMaterial color="#ff5252" transparent opacity={0.8} />
            </mesh>
          </>
        )}
      </group>
      
      {/* Saucer attacks */}
      {time >= 180 && time < 480 && (
        <>
          <group position={[-1, 1, -1]}>
            <mesh>
              <boxGeometry args={[0.5, 0.2, 0.5]} />
              <meshStandardMaterial color="#1565c0" metalness={0.7} roughness={0.3} />
            </mesh>
            <Line points={[[0, 0, 0], [0, -2, 0]]} color="#4fc8ff" lineWidth={1} transparent opacity={0.8} />
          </group>
          <group position={[1, 1, -1]}>
            <mesh>
              <boxGeometry args={[0.5, 0.2, 0.5]} />
              <meshStandardMaterial color="#1565c0" metalness={0.7} roughness={0.3} />
            </mesh>
            <Line points={[[0, 0, 0], [0, -2, 0]]} color="#4fc8ff" lineWidth={1} transparent opacity={0.8} />
          </group>
        </>
      )}
      
      {/* Crash site */}
      {time >= 600 && (
        <group position={[0, 0.5, 0]}>
          <mesh>
            <boxGeometry args={[2, 0.1, 2]} />
            <meshStandardMaterial color="#333333" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshBasicMaterial color="#ff5252" transparent opacity={0.6} />
          </mesh>
        </group>
      )}
      
      <Text position={[0, mothershipY + 1.2, 4]} fontSize={0.05} color="#ffffff" anchorX="center" anchorY="bottom">
        MOTHERSHIP
      </Text>
    </group>
  );
}

function TheEndStructure({ time, theme }: { time: number; theme: MapTheme }) {
  const event = LIVE_EVENTS.the_end;
  const phase = event.phases.find((p) => time >= p.start && time < p.end) || event.phases[event.phases.length - 1];
  const progress = Math.max(0, Math.min(1, (time - phase.start) / (phase.end - phase.start)));
  
  // Cube growth
  const cubeScale = Math.min(1, time / 240) * 1.5;
  const cubeOpacity = Math.min(1, time / 120);

  return (
    <group>
      {/* The Cube */}
      <group position={[0, 0.5, 0]}>
        <mesh>
          <boxGeometry args={[cubeScale, cubeScale, cubeScale]} />
          <meshStandardMaterial color="#424242" roughness={0.7} metalness={0.3} />
        </mesh>
        
        {/* Cube energy field */}
        {time >= 120 && (
          <mesh>
            <sphereGeometry args={[cubeScale * 0.6, 16, 16]} />
            <meshBasicMaterial color="#757575" transparent opacity={0.2 + progress * 0.3} />
          </mesh>
        )}
        
        {/* Reality collapse effects */}
        {time >= 240 && (
          <>
            <mesh position={[1, 0, 0]}>
              <boxGeometry args={[0.2, 0.2, 0.2]} />
              <meshBasicMaterial color="#9e9e9e" transparent opacity={0.5} />
            </mesh>
            <mesh position={[-1, 0, 0]}>
              <boxGeometry args={[0.2, 0.2, 0.2]} />
              <meshBasicMaterial color="#9e9e9e" transparent opacity={0.5} />
            </mesh>
          </>
        )}
      </group>
      
      {/* New island formation */}
      {time >= 600 && (
        <group position={[0, 0.5, 0]}>
          <mesh>
            <sphereGeometry args={[0.5 + (time - 600) * 0.01, 16, 16]} />
            <meshBasicMaterial color="#bdbdbd" transparent opacity={0.8} />
          </mesh>
        </group>
      )}
      
      <Text position={[0, 1.5, 0]} fontSize={0.06} color="#ffffff" anchorX="center" anchorY="bottom">
        THE CUBE
      </Text>
    </group>
  );
}

function GenericEventStructure({ event, phase, progress, theme }: { event: LiveEvent; phase: LiveEventPhase; progress: number; theme: MapTheme }) {
  return (
    <group>
      <Text position={[0, 1, 0]} fontSize={0.05} color={phase.color} anchorX="center" anchorY="bottom">
        {event.name.toUpperCase()}
      </Text>
      <Text position={[0, 0.85, 0]} fontSize={0.03} color="#ffffff" anchorX="center" anchorY="bottom">
        {phase.label}
      </Text>
    </group>
  );
}

// Camera Controller
function EnhancedCameraController() {
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
        const position = w2s(player.position, 0.15);
        targetPosition.current.set(position[0] + 0.35, position[1] + 0.25, position[2] + 0.35);
        camera.position.lerp(targetPosition.current, 0.045);
        camera.lookAt(position[0], position[1], position[2]);
      }
    }
  });

  return null;
}

// Main EnhancedMap3D Component
export default function EnhancedMap3D({ eventId }: { eventId?: LiveEventId }) {
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
  const isEventMode = !!eventId && LIVE_EVENTS[eventId];
  const frames = replayData?.frames || [];
  const kills = replayData?.kills || [];
  const events = replayData?.events || [];

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

  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: [5.5, 7.2, 5.5], fov: 50 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        style={{ background: mapPreset.theme.fog }}
      >
        {/* Enhanced lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 7, 3]} intensity={1.0} color="#b4c9ff" castShadow />
        <directionalLight position={[-5, 3, -4]} intensity={0.4} color="#ff9d84" />
        <directionalLight position={[0, 10, 0]} intensity={0.3} color="#ffffff" />
        <fog attach="fog" args={[mapPreset.theme.fog, 5, 15]} />

        {/* Enhanced Terrain */}
        {showTerrain && <EnhancedTerrain theme={mapPreset.theme} />}
        {!showTerrain && <gridHelper args={[9.2, 46, mapPreset.theme.grid, mapPreset.theme.gridMinor]} position={[0, 0, 0]} />}
        
        {/* Enhanced Mountain Decor */}
        {showTerrain && <EnhancedMountainDecor theme={mapPreset.theme} />}
        
        {/* Enhanced POI Markers with 3D buildings */}
        <EnhancedPOIMarkers visible={showPOIs} pois={mapPreset.pois} theme={mapPreset.theme} />
        
        {/* Enhanced Storm Visualization */}
        <EnhancedStormVisualization circle={currentStorm} visible={showStorm && !isEventMode} theme={mapPreset.theme} />
        
        {/* Enhanced Kill Markers */}
        <EnhancedKillMarkers kills={kills} frames={frames} currentTime={currentTime} visible={showKillMarkers} />
        
        {/* Event-specific structures */}
        {isEventMode && <EventStructure eventId={eventId!} time={currentTime} theme={mapPreset.theme} />}
        
        {/* Player trails and dots */}
        {visiblePlayers.map((player) => (
          <React.Fragment key={player.id}>
            {showTrails && (
              <EnhancedPlayerTrail
                positions={playerTrails.get(player.id) || []}
                color={player.id === selectedPlayerId ? '#ffffff' : teamColor(player)}
                selected={player.id === selectedPlayerId}
              />
            )}
            <EnhancedPlayerDot
              player={player}
              selected={player.id === selectedPlayerId}
            />
          </React.Fragment>
        ))}

        {/* Camera Controller */}
        <EnhancedCameraController />
        
        {/* Orbit Controls */}
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

      {/* Status readout */}
      <div className="pointer-events-none absolute bottom-28 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[9px] font-mono uppercase tracking-[0.18em] text-fn-gray backdrop-blur-md lg:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-fn-green shadow-[0_0_8px_#00ff9d]" />
        {visiblePlayers.length} tracked on {mapPreset.short}
        <span className="text-fn-border">2220</span>
        {showTerrain ? 'Enhanced 3D Terrain' : 'Grid'}
        <span className="text-fn-border">2220</span>
        {showPOIs ? '3D POIs with Buildings' : 'POIs hidden'}
        {isEventMode && <>
          <span className="text-fn-border">2220</span>
          <span className="text-fn-purple">EVENT MODE: {eventId}</span>
        </>}
      </div>
    </div>
  );
}
