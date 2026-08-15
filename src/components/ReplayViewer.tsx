'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Header from './Header';
import PlayerControls from './PlayerControls';
import PlayerList from './PlayerList';
import EventTimeline from './EventTimeline';
import KillFeed from './KillFeed';
import Minimap from './Minimap';
import MapOverlay from './MapOverlay';
import LiveEventPanel from './LiveEventPanel';
import MapExplorer from './MapExplorer';
import { useReplayStore } from '@/lib/replay-store';

const Map3D = dynamic(() => import('./Map3D'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-fn-darker">
      <div className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-fn-purple/30 border-t-fn-purple" />
        <p className="font-medium text-fn-purple">Loading full island...</p>
        <p className="mt-1 text-sm text-fn-gray">Building terrain, POIs and event layers</p>
      </div>
    </div>
  ),
});

type SidebarTab = 'players' | 'events';

export default function ReplayViewer() {
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('players');
  const { showPlayerList, mapView } = useReplayStore();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-fn-darker">
      {/* The map owns the entire viewport now; all UI floats above it. */}
      <div className="absolute inset-0">
        <Map3D />
        {mapView === 'explore' && <MapExplorer />}
      </div>

      {/* Top navigation HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40">
        <div className="pointer-events-auto">
          <Header />
        </div>
      </div>

      {/* Tactical overlays and layer controls */}
      <MapOverlay />
      {mapView === '3d' && <LiveEventPanel />}
      {mapView === '3d' && <KillFeed />}
      {mapView === '3d' && <Minimap />}

      {/* Floating analysis dock; it disappears on smaller screens to preserve map scale. */}
      {mapView === '3d' && showPlayerList && (
        <aside className="pointer-events-auto absolute bottom-28 left-4 top-16 z-30 hidden w-80 flex-col overflow-hidden rounded-2xl border border-white/10 bg-fn-darker/80 shadow-2xl shadow-black/40 backdrop-blur-xl lg:flex">
          <div className="flex border-b border-white/10 bg-black/20">
            <button
              onClick={() => setSidebarTab('players')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors ${
                sidebarTab === 'players'
                  ? 'border-b-2 border-fn-purple bg-fn-purple/10 text-fn-purple'
                  : 'text-fn-gray hover:text-fn-white'
              }`}
            >
              👥 Players
            </button>
            <button
              onClick={() => setSidebarTab('events')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors ${
                sidebarTab === 'events'
                  ? 'border-b-2 border-fn-gold bg-fn-gold/10 text-fn-gold'
                  : 'text-fn-gray hover:text-fn-white'
              }`}
            >
              ⚡ Events
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden">
            {sidebarTab === 'players' ? <PlayerList /> : <EventTimeline />}
          </div>
        </aside>
      )}

      {/* Playback deck */}
      {mapView === '3d' && (
        <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-40">
          <PlayerControls />
        </div>
      )}
    </div>
  );
}
