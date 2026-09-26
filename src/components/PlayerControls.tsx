'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Rewind,
  Camera, Eye, Map, Users, Zap, XCircle, ChevronLeft,
  ChevronRight, Volume2, Maximize2
} from 'lucide-react';
import { useReplayStore } from '@/lib/replay-store';
import { getFallbackPlayerName } from '@/lib/player-identity';
import { skinAssetKey, useSkinAssets } from '@/lib/skin-catalog';

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4, 8, 16];

export default function PlayerControls() {
  const {
    isPlaying, currentTime, playbackSpeed, duration, togglePlay,
    seek, setPlaybackSpeed, tick, togglePlay: _tp,
    showKillFeed, showMinimap, showPlayerList, showStorm,
    toggleKillFeed, toggleMinimap, togglePlayerList, toggleStorm,
    replayData, reset, cameraMode, setCameraMode, selectedPlayerId,
    currentFrame,
  } = useReplayStore();

  const lastTickRef = useRef<number>(Date.now());
  const timelineRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      tick(delta);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [tick]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          seek(currentTime - 5);
          break;
        case 'ArrowRight':
          seek(currentTime + 5);
          break;
        case 'ArrowUp':
          setPlaybackSpeed(Math.min(16, playbackSpeed * 2));
          break;
        case 'ArrowDown':
          setPlaybackSpeed(Math.max(0.25, playbackSpeed / 2));
          break;
        case 'KeyF':
          setCameraMode('free');
          break;
        case 'KeyV':
          setCameraMode(selectedPlayerId !== null ? 'player' : 'free');
          break;
        case 'KeyT':
          setCameraMode('top');
          break;
        case 'Key1':
          setCameraMode('first-person');
          break;
        case 'Key3':
          setCameraMode('third-person');
          break;
        case 'Escape':
          reset();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay, seek, currentTime, setPlaybackSpeed, playbackSpeed, setCameraMode, selectedPlayerId, reset]);

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!timelineRef.current || !duration) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      seek(x * duration);
    },
    [duration, seek]
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const selectedPlayer = currentFrame.find((p) => p.id === selectedPlayerId);
  const selectedSkinLookup = selectedPlayer?.skin?.id
    ? `id:${selectedPlayer.skin.id}`
    : selectedPlayer?.skin?.name;
  const selectedSkinAssets = useSkinAssets(selectedSkinLookup ? [selectedSkinLookup] : []);
  const selectedSkinAsset = selectedSkinAssets.get(skinAssetKey(selectedSkinLookup));

  return (
    <div className="bg-fn-darker/95 backdrop-blur-md border-t border-fn-border/30">
      {/* Kill markers on timeline */}
      <div className="relative px-4 pt-2">
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          className="relative h-8 bg-fn-card/50 rounded-lg cursor-pointer group hover:bg-fn-card transition-colors overflow-hidden"
        >
          {/* Progress bar */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-fn-purple/40 to-fn-blue/30 rounded-lg transition-all duration-75"
            style={{ width: `${progress}%` }}
          />

          {/* Kill markers */}
          {replayData?.kills.map((kill, i) => {
            const pos = (kill.time / duration) * 100;
            return (
              <div
                key={`kill-${i}`}
                className="absolute top-0 bottom-0 w-px bg-fn-red/40"
                style={{ left: `${pos}%` }}
                title={`${kill.killer} eliminated ${kill.victim}`}
              />
            );
          })}

          {/* Storm phase markers */}
          {[1,2,3,4,5,6,7].map(phase => {
            const pos = (phase * (duration / 8) / duration) * 100;
            return (
              <div
                key={`storm-${phase}`}
                className="absolute top-0 bottom-0 w-px bg-fn-blue/30"
                style={{ left: `${pos}%` }}
                title={`Storm Phase ${phase}`}
              />
            );
          })}

          {/* Elimination density zones (every 10% of timeline) */}
          {Array.from({length: 10}, (_, i) => {
            if (!replayData) return null;
            const start = (i / 10) * duration;
            const end = ((i + 1) / 10) * duration;
            const count = replayData.kills.filter(k => k.time >= start && k.time < end).length;
            const height = Math.min(100, (count / (replayData.kills.length / 10 + 1)) * 100);
            return (
              <div
                key={`density-${i}`}
                className="absolute bottom-0 bg-fn-red/10 rounded-t"
                style={{
                  left: `${i * 10}%`,
                  width: '10%',
                  height: `${height * 0.4}%`,
                  minHeight: '1px'
                }}
              />
            );
          })}

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg shadow-white/30 transition-all duration-75"
            style={{ left: `${progress}%` }}
          >
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white rounded-full shadow-lg" />
          </div>

          {/* Tooltip */}
          <div
            className="absolute -top-8 px-2 py-1 bg-fn-card rounded text-[10px] text-fn-white font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
          >
            {formatTime(currentTime)}
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: Time & play */}
        <div className="flex items-center gap-3">
          {/* Time */}
          <span className="text-xs font-mono text-fn-gray w-20">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Skip back */}
          <button
            onClick={() => seek(currentTime - 30)}
            className="text-fn-gray hover:text-fn-white transition-colors"
            title="Back 30s"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-fn-purple flex items-center justify-center hover:bg-fn-purple-light transition-colors glow-purple"
            title="Play/Pause (Space)"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            )}
          </button>

          {/* Skip forward */}
          <button
            onClick={() => seek(currentTime + 30)}
            className="text-fn-gray hover:text-fn-white transition-colors"
            title="Forward 30s"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed */}
          <div className="flex items-center gap-1 bg-fn-card/50 rounded-lg px-2 py-1 border border-fn-border/30">
            {SPEED_OPTIONS.map((speed) => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-1.5 py-0.5 text-[10px] rounded font-mono transition-colors ${
                  playbackSpeed === speed
                    ? 'bg-fn-purple/20 text-fn-purple'
                    : 'text-fn-gray hover:text-fn-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Center: Selected player info */}
        {selectedPlayer && (
          <div className="flex items-center gap-2 bg-fn-card/50 rounded-lg px-3 py-1.5 border border-fn-border/30">
            <div className={`w-2 h-2 rounded-full ${selectedPlayer.isAlive ? 'bg-fn-green' : 'bg-fn-gray'}`} />
            <span className="text-xs font-medium text-fn-white">{selectedPlayer.name || getFallbackPlayerName(selectedPlayer.id)}</span>
            {selectedPlayer.skin && <span className="text-[10px] text-fn-purple">{selectedSkinAsset?.name || selectedPlayer.skin.name}</span>}
            <span className="text-[10px] text-fn-gray">
              HP:{Math.round(selectedPlayer.health)} | SH:{Math.round(selectedPlayer.shield)}
            </span>
          </div>
        )}

        {/* Right: View toggles */}
        <div className="flex items-center gap-1">
          {/* Camera modes */}
          <div className="flex items-center bg-fn-card/50 rounded-lg border border-fn-border/30 overflow-hidden">
            {[
              { mode: 'free' as const, icon: Camera, label: 'Free Cam', key: 'F' },
              { mode: 'player' as const, icon: Eye, label: 'Player View', key: 'V' },
              { mode: 'top' as const, icon: Map, label: 'Top Down', key: 'T' },
              { mode: 'first-person' as const, icon: Eye, label: '1st Person', key: '1' },
              { mode: 'third-person' as const, icon: Users, label: '3rd Person', key: '3' },
            ].map(({ mode, icon: Icon, label, key }) => (
              <button
                key={mode}
                onClick={() => setCameraMode(mode)}
                className={`flex items-center gap-1 px-2 py-1.5 text-[10px] transition-colors ${
                  cameraMode === mode
                    ? 'bg-fn-purple/20 text-fn-purple'
                    : 'text-fn-gray hover:text-fn-white'
                }`}
                title={`${label} (${key})`}
              >
                <Icon className="w-3 h-3" />
                <span className="hidden xl:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-fn-border/30 mx-1" />

          {/* Toggle buttons */}
          {[
            { active: showKillFeed, toggle: toggleKillFeed, icon: Zap, label: 'Kills' },
            { active: showPlayerList, toggle: togglePlayerList, icon: Users, label: 'Players' },
            { active: showStorm, toggle: toggleStorm, icon: XCircle, label: 'Storm' },
            { active: showMinimap, toggle: toggleMinimap, icon: Map, label: 'Map' },
          ].map(({ active, toggle, icon: Icon, label }) => (
            <button
              key={label}
              onClick={toggle}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] transition-colors ${
                active
                  ? 'bg-fn-purple/20 text-fn-purple'
                  : 'text-fn-gray/40 hover:text-fn-gray'
              }`}
              title={label}
            >
              <Icon className="w-3 h-3" />
              <span className="hidden xl:inline">{label}</span>
            </button>
          ))}

          <div className="w-px h-5 bg-fn-border/30 mx-1" />

          {/* Exit */}
          <button
            onClick={reset}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] text-fn-red/60 hover:text-fn-red transition-colors"
            title="Exit Viewer (Esc)"
          >
            <ChevronLeft className="w-3 h-3" />
            <span className="hidden xl:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="px-4 pb-1 flex justify-center">
        <div className="flex items-center gap-3 text-[9px] text-fn-gray/30">
          <span>Space: Play/Pause</span>
          <span>←→: Seek ±5s</span>
          <span>↑↓: Speed</span>
          <span>F/V/T: Camera</span>
          <span>Esc: Exit</span>
        </div>
      </div>
    </div>
  );
}
