'use client';

import React from 'react';
import {
  Activity,
  Cloud,
  Compass,
  Crosshair,
  Eye,
  EyeOff,
  Layers,
  Map,
  Mountain,
  PanelLeft,
  Route,
  Skull,
  Users,
} from 'lucide-react';
import { useReplayStore } from '@/lib/replay-store';
import { SEASON_OPTIONS } from '@/lib/map-presets';
import type { SeasonId } from '@/lib/map-presets';

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function LayerButton({
  label,
  active,
  icon: Icon,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all ${
        active
          ? 'border-fn-border/70 bg-fn-card/90 text-fn-white shadow-lg shadow-black/20'
          : 'border-transparent bg-black/20 text-fn-gray/60 hover:border-fn-border/40 hover:bg-fn-card/60 hover:text-fn-gray'
      }`}
      title={`${active ? 'Hide' : 'Show'} ${label}`}
    >
      <span className={`flex h-6 w-6 items-center justify-center rounded-md ${active ? `${color} bg-white/5` : 'bg-white/[0.03]'}`}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="flex-1 text-[10px] font-medium tracking-wide">{label}</span>
      {active ? <Eye className="h-3 w-3 text-fn-green/80" /> : <EyeOff className="h-3 w-3 text-fn-gray/40" />}
    </button>
  );
}

export default function MapOverlay() {
  const {
    currentTime,
    currentFrame,
    currentStorm,
    replayData,
    cameraMode,
    showStorm,
    showTrails,
    showPOIs,
    showKillMarkers,
    showTerrain,
    activeSeason,
    mapView,
    showPlayerList,
    toggleStorm,
    toggleTrails,
    togglePOIs,
    toggleKillMarkers,
    toggleTerrain,
    togglePlayerList,
    setActiveSeason,
    setMapView,
  } = useReplayStore();

  if (!replayData) return null;

  const alive = currentFrame.filter((player) => player.isAlive).length;
  const phase = currentStorm?.phase ?? 0;
  const killCount = replayData.kills.filter((kill) => kill.time <= currentTime).length;
  const activeMap = SEASON_OPTIONS.find((option) => option.id === activeSeason) || SEASON_OPTIONS[0];

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* Map identity / compass */}
      <div className="pointer-events-auto absolute left-4 top-16 hidden sm:block xl:left-[22rem]">
        <div className="map-glass rounded-2xl border border-white/10 px-4 py-3 shadow-2xl shadow-black/30">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fn-purple to-fn-blue shadow-lg shadow-fn-purple/30">
              <Map className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold uppercase tracking-[0.16em] text-white">Island Tactical</span>
                <span className="rounded bg-fn-green/10 px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider text-fn-green">{activeMap.short}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[9px] font-mono uppercase tracking-wider text-fn-gray">
                <span>{cameraMode === 'top' ? 'Topographic' : cameraMode === 'player' ? 'Player Follow' : 'Free Camera'}</span>
                <span className="text-fn-border">•</span>
                <span>{formatTime(currentTime)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compass */}
      <div className="pointer-events-none absolute left-1/2 top-16 hidden -translate-x-1/2 md:block">
        <div className="map-glass flex items-center gap-4 rounded-full border border-white/10 px-4 py-2 text-[10px] font-mono text-fn-gray shadow-xl">
          <span className="text-fn-gray/50">W</span>
          <span className="text-fn-gray/60">NW</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-fn-purple/50 bg-fn-purple/10 text-fn-purple">
            <Compass className="h-3.5 w-3.5" />
          </span>
          <span className="font-bold text-fn-white">N</span>
          <span className="text-fn-gray/60">NE</span>
          <span className="text-fn-gray/50">E</span>
        </div>
      </div>

      {/* Layer control */}
      <div className="pointer-events-auto absolute right-4 top-16 w-44 sm:w-52">
        <div className="map-glass rounded-2xl border border-white/10 p-2 shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-fn-blue" />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-fn-white">Map layers</span>
            </div>
            <span className="text-[8px] font-mono text-fn-gray/50">LIVE</span>
          </div>
          <div className="mb-2 rounded-xl border border-fn-blue/20 bg-fn-blue/5 p-2">
            <div className="mb-1 text-[8px] font-bold uppercase tracking-[0.16em] text-fn-blue">Season map</div>
            <select
              value={activeSeason}
              onChange={(event) => setActiveSeason(event.target.value as SeasonId)}
              className="w-full rounded-lg border border-white/10 bg-fn-card px-2 py-2 text-[10px] font-medium text-fn-white outline-none transition-colors focus:border-fn-blue/60"
            >
              {SEASON_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.short} · {option.era}
                </option>
              ))}
            </select>
            <div className="mt-1 text-[8px] text-fn-gray/60">{activeMap.label}</div>
            <div className="mt-2 grid grid-cols-2 gap-1">
              <button
                onClick={() => setMapView('3d')}
                className={`rounded-lg px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors ${mapView === '3d' ? 'bg-fn-purple/20 text-fn-purple' : 'bg-white/5 text-fn-gray hover:text-white'}`}
              >
                3D Replay
              </button>
              <button
                onClick={() => setMapView('explore')}
                className={`rounded-lg px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider transition-colors ${mapView === 'explore' ? 'bg-fn-blue/20 text-fn-blue' : 'bg-white/5 text-fn-gray hover:text-white'}`}
              >
                Explore Map
              </button>
            </div>
            <a
              href="https://github.com/yaelbrinkert/fortnite-archives"
              target="_blank"
              rel="noreferrer"
              className="mt-1 block text-[8px] text-fn-blue/70 underline decoration-fn-blue/30 underline-offset-2 hover:text-fn-blue"
            >
              terrain source · GitHub archive
            </a>
            {activeSeason === 'c2s2' && (
              <div className="mt-1 text-[8px] text-fn-green/70">Apollo heightmap layer available</div>
            )}
          </div>
          <div className="grid gap-1">
            <LayerButton label="Terrain & roads" active={showTerrain} icon={Mountain} color="text-fn-green" onClick={toggleTerrain} />
            <LayerButton label="Named locations" active={showPOIs} icon={Map} color="text-fn-gold" onClick={togglePOIs} />
            <LayerButton label="Player trails" active={showTrails} icon={Route} color="text-fn-purple" onClick={toggleTrails} />
            <LayerButton label="Eliminations" active={showKillMarkers} icon={Skull} color="text-fn-red" onClick={toggleKillMarkers} />
            <LayerButton label="Storm circles" active={showStorm} icon={Cloud} color="text-fn-blue" onClick={toggleStorm} />
          </div>
          <button
            onClick={togglePlayerList}
            className="mt-2 flex w-full items-center gap-2 rounded-lg border border-fn-purple/20 bg-fn-purple/10 px-2.5 py-2 text-[10px] font-medium text-fn-purple transition-colors hover:bg-fn-purple/20"
          >
            <PanelLeft className="h-3.5 w-3.5" />
            {showPlayerList ? 'Hide player dock' : 'Show player dock'}
          </button>
        </div>
      </div>

      {/* Bottom-right tactical summary */}
      <div className="pointer-events-auto absolute bottom-28 right-4 hidden w-64 lg:block">
        <div className="map-glass rounded-2xl border border-white/10 p-3 shadow-2xl shadow-black/30">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-fn-green" />
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-fn-white">Match intelligence</span>
            </div>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fn-green shadow-[0_0_8px_#00ff88]" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-white/5 bg-black/20 p-2">
              <Users className="mb-1 h-3 w-3 text-fn-green" />
              <div className="font-display text-lg font-bold text-white">{alive}</div>
              <div className="text-[8px] uppercase tracking-wider text-fn-gray">Alive</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 p-2">
              <Crosshair className="mb-1 h-3 w-3 text-fn-red" />
              <div className="font-display text-lg font-bold text-white">{killCount}</div>
              <div className="text-[8px] uppercase tracking-wider text-fn-gray">Elims</div>
            </div>
            <div className="rounded-xl border border-white/5 bg-black/20 p-2">
              <Cloud className="mb-1 h-3 w-3 text-fn-blue" />
              <div className="font-display text-lg font-bold text-white">{phase + 1}</div>
              <div className="text-[8px] uppercase tracking-wider text-fn-gray">Phase</div>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-fn-gray">Event coverage</span>
              <span className="font-mono text-fn-white">{replayData.events.length + replayData.kills.length} markers</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-4/5 rounded-full bg-gradient-to-r from-fn-purple via-fn-blue to-fn-green" />
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-28 left-4 hidden xl:block xl:left-[22rem]">
        <div className="map-glass rounded-xl border border-white/10 px-3 py-2 shadow-xl">
          <div className="mb-1.5 text-[8px] font-bold uppercase tracking-[0.16em] text-fn-gray">Legend</div>
          <div className="flex items-center gap-3 text-[9px] text-fn-gray">
            <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-fn-green" /> Player</span>
            <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rotate-45 bg-fn-red" /> Elim</span>
            <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full border border-fn-blue" /> Safe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
