'use client';

import React, { useRef, useEffect } from 'react';
import { useReplayStore } from '@/lib/replay-store';
import { getMapPreset } from '@/lib/map-presets';
import { getFallbackPlayerName } from '@/lib/player-identity';

const MAP_SIZE = 270;
const WORLD_RANGE = 80000;

const MINI_POIS = [
  { name: 'TT', x: -8000, z: -20000, major: true },
  { name: 'SS', x: 2000, z: 4000, major: true },
  { name: 'PP', x: -12000, z: 8000, major: true },
  { name: 'RR', x: 16000, z: 4000, major: true },
  { name: 'DD', x: 0, z: -6000, major: true },
  { name: 'LL', x: -4000, z: -8000, major: true },
  { name: 'SS', x: 14000, z: -28000, major: false },
  { name: 'FL', x: 10000, z: 30000, major: true },
  { name: 'FF', x: 0, z: 26000, major: true },
  { name: 'WW', x: 26000, z: -8000, major: true },
  { name: 'RR', x: 22000, z: -4000, major: false },
  { name: 'TT', x: 20000, z: -16000, major: true },
  { name: 'HH', x: -26000, z: 14000, major: true },
  { name: 'JJ', x: -28000, z: -14000, major: true },
  { name: 'ShS', x: -10000, z: 18000, major: true },
  { name: 'GG', x: -16000, z: 12000, major: true },
  { name: 'FF', x: -14000, z: 28000, major: false },
  { name: 'LL', x: 28000, z: 8000, major: false },
  { name: 'PP', x: 14000, z: 24000, major: true },
];

export default function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { currentFrame, currentStorm, showMinimap, selectedPlayerId, activeSeason } = useReplayStore();
  const activeMap = getMapPreset(activeSeason);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showMinimap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = MAP_SIZE;
    canvas.height = MAP_SIZE;

    const toMini = (wx: number, wz: number): [number, number] => {
      const nx = (wx + WORLD_RANGE / 2) / WORLD_RANGE;
      const nz = (wz + WORLD_RANGE / 2) / WORLD_RANGE;
      return [nx * MAP_SIZE, nz * MAP_SIZE];
    };

    // Background
    ctx.fillStyle = '#060d06';
    ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

    // Grid
    ctx.strokeStyle = '#112211';
    ctx.lineWidth = 0.3;
    for (let i = 0; i <= 14; i++) {
      const p = (i / 14) * MAP_SIZE;
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, MAP_SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(MAP_SIZE, p); ctx.stroke();
    }

    // Island outline
    ctx.strokeStyle = '#1a3a1a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(MAP_SIZE / 2, MAP_SIZE / 2, MAP_SIZE * 0.45, 0, Math.PI * 2);
    ctx.stroke();

    // Storm
    if (currentStorm) {
      const [sx, sz] = toMini(currentStorm.center.x, currentStorm.center.z);
      const sr = (currentStorm.radius / WORLD_RANGE) * MAP_SIZE;

      // Storm fill (outside safe zone)
      ctx.save();
      ctx.fillStyle = 'rgba(100, 40, 180, 0.2)';
      ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(sx, sz, sr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Safe zone border
      ctx.strokeStyle = '#00aaff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sx, sz, sr, 0, Math.PI * 2);
      ctx.stroke();
    }

    // POI labels
    ctx.fillStyle = '#335533';
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const poi of activeMap.pois) {
      const [px, pz] = toMini(poi.x, poi.z);
      if (px < 5 || px > MAP_SIZE - 5 || pz < 5 || pz > MAP_SIZE - 5) continue;

      if (poi.size === 'major') {
        ctx.fillStyle = '#2a4a2a';
        ctx.beginPath();
        ctx.arc(px, pz, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#335533';
      ctx.fillText(poi.name.length > 7 ? `${poi.name.slice(0, 7)}…` : poi.name, px, pz - 4);
    }

    // Players: use the detected/generated skin palette and a silhouette shape
    // instead of painting every player as the same purple dot.
    const alivePlayers = currentFrame.filter(p => p.isAlive);
    for (const player of alivePlayers) {
      const [px, pz] = toMini(player.position.x, player.position.z);
      if (px < 0 || px > MAP_SIZE || pz < 0 || pz > MAP_SIZE) continue;

      const isSelected = player.id === selectedPlayerId;
      const skin = player.skin;
      const markerSize = isSelected ? 3.6 : 2.2;
      const markerColor = skin?.primaryColor || '#9b59f0';
      const accentColor = skin?.accentColor || '#ffffff';

      ctx.save();
      ctx.globalAlpha = isSelected ? 1 : 0.8;
      ctx.fillStyle = markerColor;
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = isSelected ? 1 : 0.45;
      ctx.beginPath();
      if (skin?.style === 'animal') {
        ctx.moveTo(px, pz - markerSize);
        ctx.lineTo(px + markerSize, pz + markerSize);
        ctx.lineTo(px - markerSize, pz + markerSize);
      } else if (skin?.style === 'robot') {
        ctx.rect(px - markerSize, pz - markerSize, markerSize * 2, markerSize * 2);
      } else if (skin?.style === 'masked' || skin?.style === 'knight') {
        ctx.moveTo(px, pz - markerSize);
        ctx.lineTo(px + markerSize, pz);
        ctx.lineTo(px, pz + markerSize);
        ctx.lineTo(px - markerSize, pz);
      } else {
        ctx.arc(px, pz, markerSize, 0, Math.PI * 2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(px, pz, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 3;
        ctx.fillText(player.name || getFallbackPlayerName(player.id), px + 8, pz - 5);
      }
      ctx.restore();
    }

    // Border
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, MAP_SIZE, MAP_SIZE);

  }, [activeMap.pois, activeSeason, currentFrame, currentStorm, showMinimap, selectedPlayerId]);

  if (!showMinimap) return null;

  return (
    <div className="absolute bottom-28 left-4 z-30 xl:left-[22rem]">
      <div className="relative overflow-hidden rounded-2xl border border-white/15 shadow-2xl shadow-black/60">
        <canvas ref={canvasRef} className="block" />
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-fn-card/80 rounded text-[8px] text-fn-gray font-mono backdrop-blur-sm">
          TACTICAL MAP
        </div>
        <div className="absolute bottom-1.5 right-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[8px] font-mono text-fn-gray backdrop-blur-sm">
          {currentFrame.filter((player) => player.isAlive).length} LIVE
        </div>
      </div>
    </div>
  );
}
