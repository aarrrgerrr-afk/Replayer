'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ExternalLink,
  Map as MapIcon,
  MapPinned,
  Maximize2,
  Move,
  RotateCcw,
  Target,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { getMapPreset } from '@/lib/map-presets';
import { resolveSeasonMapAsset } from '@/lib/map-archive';
import { useReplayStore } from '@/lib/replay-store';
import type { ArchiveMapAsset } from '@/lib/map-archive';
import type { MapPoi } from '@/lib/map-presets';

const WORLD_RANGE = 80000;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

function worldPercent(value: number): number {
  return ((value + WORLD_RANGE / 2) / WORLD_RANGE) * 100;
}

export default function MapExplorer() {
  const {
    activeSeason,
    replayData,
    showPOIs,
    currentFrame,
    setMapView,
  } = useReplayStore();
  const activeMap = useMemo(() => getMapPreset(activeSeason), [activeSeason]);
  const [asset, setAsset] = useState<ArchiveMapAsset | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selectedPoi, setSelectedPoi] = useState<MapPoi | null>(null);
  const dragState = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setAsset(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setSelectedPoi(null);

    resolveSeasonMapAsset(activeSeason, replayData?.metadata.releaseVersion).then((resolved) => {
      if (cancelled) return;
      setAsset(resolved);
      setStatus(resolved ? 'ready' : 'missing');
    });

    return () => { cancelled = true; };
  }, [activeSeason, replayData?.metadata.releaseVersion]);

  const zoomBy = (amount: number) => {
    setZoom((current) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number((current + amount).toFixed(2)))));
  };

  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setSelectedPoi(null);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragState.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    setOffset({
      x: dragState.current.offsetX + event.clientX - dragState.current.x,
      y: dragState.current.offsetY + event.clientY - dragState.current.y,
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    dragState.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  return (
    <div className="absolute inset-0 z-10 overflow-hidden bg-[#081018]">
      {/* Map image world */}
      <div
        className="absolute inset-0 cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={(event) => {
          event.preventDefault();
          zoomBy(event.deltaY < 0 ? 0.15 : -0.15);
        }}
      >
        {asset && (
          <div
            className="absolute left-1/2 top-1/2 aspect-square w-[min(100vw,100vh)]"
            style={{
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            <img
              src={asset.imageUrl}
              alt={`${activeMap.label} original Fortnite map surface`}
              draggable={false}
              className="h-full w-full object-cover"
              onError={() => setStatus('missing')}
            />

            {/* UI-only POI hotspots; no replacement geometry is drawn. */}
            {showPOIs && zoom >= 1.25 && activeMap.pois.map((poi, index) => (
              <button
                key={`${poi.name}-${index}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedPoi(poi);
                }}
                className={`group absolute -translate-x-1/2 -translate-y-1/2 ${selectedPoi?.name === poi.name ? 'z-20' : 'z-10'}`}
                style={{ left: `${worldPercent(poi.x)}%`, top: `${worldPercent(poi.z)}%` }}
                title={poi.name}
              >
                <span className={`block rounded-full border-2 border-white/80 shadow-lg transition-all ${selectedPoi?.name === poi.name ? 'h-5 w-5 scale-125' : 'h-3 w-3 group-hover:scale-125'}`} style={{ backgroundColor: poi.color }} />
                <span className={`pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 whitespace-nowrap rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm ${selectedPoi?.name === poi.name ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {poi.name}
                </span>
              </button>
            ))}
          </div>
        )}

        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#081018]/90">
            <div className="map-glass rounded-2xl border border-fn-blue/25 px-6 py-5 text-center shadow-2xl">
              <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-fn-blue/20 border-t-fn-blue" />
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-fn-blue">Loading original map</div>
              <div className="mt-1 text-[10px] text-fn-gray">Fetching high-resolution archive surface</div>
            </div>
          </div>
        )}

        {status === 'missing' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#081018]">
            <div className="max-w-sm rounded-2xl border border-fn-gold/30 bg-fn-darker/90 px-6 py-5 text-center shadow-2xl">
              <MapIcon className="mx-auto mb-3 h-8 w-8 text-fn-gold" />
              <div className="text-sm font-bold uppercase tracking-wider text-white">No archived surface found</div>
              <p className="mt-2 text-xs leading-relaxed text-fn-gray">This version has no downloadable original map surface in the selected archive. Nothing procedural is shown in Explore mode.</p>
              <button onClick={() => setMapView('3d')} className="mt-4 rounded-lg bg-fn-purple/20 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-fn-purple hover:bg-fn-purple/30">
                Return to replay view
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Explorer header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between p-4">
        <div className="pointer-events-auto map-glass rounded-2xl border border-white/10 px-4 py-3 shadow-2xl">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fn-blue to-fn-purple text-white shadow-lg shadow-fn-blue/20">
              <MapPinned className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold uppercase tracking-[0.16em] text-white">Map Explorer</span>
                <span className="rounded bg-fn-green/10 px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider text-fn-green">Original surface</span>
              </div>
              <div className="mt-1 text-[9px] uppercase tracking-wider text-fn-gray">{activeMap.label} · {asset?.version || 'archive'} · {currentFrame.filter((player) => player.isAlive).length} players tracked</div>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border border-white/10 bg-fn-darker/85 p-1.5 shadow-2xl backdrop-blur-xl">
          <button onClick={() => zoomBy(-0.25)} className="map-control" title="Zoom out"><ZoomOut className="h-4 w-4" /></button>
          <span className="min-w-[42px] text-center text-[10px] font-mono text-fn-white">{Math.round(zoom * 100)}%</span>
          <button onClick={() => zoomBy(0.25)} className="map-control" title="Zoom in"><ZoomIn className="h-4 w-4" /></button>
          <button onClick={resetView} className="map-control" title="Reset map"><RotateCcw className="h-4 w-4" /></button>
          <div className="mx-1 h-5 w-px bg-white/10" />
          <button onClick={() => setMapView('3d')} className="map-control text-fn-purple" title="Return to 3D replay"><Maximize2 className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Explorer hint */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-fn-darker/75 px-3 py-2 text-[9px] font-mono uppercase tracking-wider text-fn-gray shadow-xl backdrop-blur-md">
        <Move className="h-3 w-3 text-fn-blue" />
        Drag to pan <span className="text-fn-border">•</span> Scroll to zoom <span className="text-fn-border">•</span> Click a POI
      </div>

      {/* Selected location card */}
      {selectedPoi && (
        <div className="pointer-events-auto absolute bottom-4 left-4 z-30 w-72 map-glass rounded-2xl border border-fn-blue/25 p-3 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedPoi.color }} />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-white">{selectedPoi.name}</div>
                <div className="mt-0.5 text-[9px] uppercase tracking-wider text-fn-gray">{selectedPoi.size} location · {activeMap.short}</div>
              </div>
            </div>
            <button onClick={() => setSelectedPoi(null)} className="text-fn-gray hover:text-white" aria-label="Close location details"><X className="h-3.5 w-3.5" /></button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/5 bg-black/20 p-2"><Target className="mb-1 h-3 w-3 text-fn-blue" /><div className="text-[9px] text-fn-gray">World X</div><div className="text-[10px] font-mono text-white">{selectedPoi.x}</div></div>
            <div className="rounded-lg border border-white/5 bg-black/20 p-2"><Target className="mb-1 h-3 w-3 text-fn-purple" /><div className="text-[9px] text-fn-gray">World Z</div><div className="text-[10px] font-mono text-white">{selectedPoi.z}</div></div>
          </div>
          {asset?.sourceUrl && <a href={asset.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1 text-[9px] text-fn-blue hover:underline"><ExternalLink className="h-3 w-3" /> Open map source</a>}
        </div>
      )}
    </div>
  );
}
