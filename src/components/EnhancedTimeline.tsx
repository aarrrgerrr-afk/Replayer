'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward, Rewind, Bookmark,
  Flag, Target, Zap, Trophy, Star, ChevronLeft, ChevronRight,
  Volume2, Maximize2, Eye, Users
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

export default function EnhancedTimeline() {
  const {
    isPlaying, currentTime, playbackSpeed, duration, togglePlay,
    seek, setPlaybackSpeed, tick,
    replayData, reset, cameraMode, setCameraMode, selectedPlayerId,
    currentFrame,     bookmarks, addBookmark, removeBookmark, showBookmarks, toggleBookmarks,
    deathCamTarget, setDeathCamTarget, showDeathFeed, toggleDeathFeed,
    playerStats, toggleMatchStats, showMatchStats,
    showVictoryScreen, setShowVictoryScreen,
  } = useReplayStore();

  const lastTickRef = useRef<number>(Date.now());
  const timelineRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const [isAddingBookmark, setIsAddingBookmark] = useState(false);

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
        case 'KeyC':
          setCameraMode('cinematic');
          break;
        case 'KeyD':
          if (deathCamTarget) {
            setCameraMode('death-cam');
            seek(deathCamTarget.time);
          }
          break;
        case 'KeyB':
          setIsAddingBookmark(true);
          break;
        case 'KeyS':
          toggleMatchStats();
          break;
        case 'Escape':
          if (showVictoryScreen) {
            setShowVictoryScreen(false);
          } else if (showMatchStats) {
            toggleMatchStats();
          } else {
            reset();
          }
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay, seek, currentTime, setPlaybackSpeed, playbackSpeed, setCameraMode, selectedPlayerId, reset, deathCamTarget, showVictoryScreen, showMatchStats, toggleMatchStats, setShowVictoryScreen]);

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!timelineRef.current || !duration) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      seek(x * duration);
    },
    [duration, seek]
  );

  const handleAddBookmark = useCallback(() => {
    const label = prompt('Bookmark label:') || 'Highlight';
    addBookmark({
      id: `bookmark-${Date.now()}`,
      time: currentTime,
      label,
      type: 'custom',
    });
    setIsAddingBookmark(false);
  }, [currentTime, addBookmark]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const selectedPlayer = currentFrame.find((p) => p.id === selectedPlayerId);
  const selectedSkinLookup = selectedPlayer?.skin?.id
    ? `id:${selectedPlayer.skin.id}`
    : selectedPlayer?.skin?.name;
  const selectedSkinAssets = useSkinAssets(selectedSkinLookup ? [selectedSkinLookup] : []);
  const selectedSkinAsset = selectedSkinAssets.get(skinAssetKey(selectedSkinLookup));

  // Key moments from event presets
  const keyMoments = replayData?.metadata?.eventType 
    ? getKeyMomentsForEvent(replayData.metadata.eventType, duration)
    : [];

  return (
    <div className="bg-fn-darker/95 backdrop-blur-md border-t border-fn-border/30">
      {/* Kill markers on timeline */}
      <div className="relative px-4 pt-2">
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          className="relative h-10 bg-fn-card/50 rounded-lg cursor-pointer group hover:bg-fn-card transition-colors overflow-hidden"
        >
          {/* Progress bar */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-fn-purple/40 to-fn-blue/30 rounded-lg transition-all duration-75"
            style={{ width: `${progress}%` }}
          />

          {/* Key moments markers */}
          {keyMoments.map((moment, i) => {
            const pos = (moment.time / duration) * 100;
            return (
              <div
                key={`moment-${i}`}
                className="absolute top-0 bottom-0 w-1 bg-fn-gold/60 hover:bg-fn-gold transition-colors cursor-pointer"
                style={{ left: `${pos}%` }}
                title={moment.label}
                onClick={(e) => {
                  e.stopPropagation();
                  seek(moment.time);
                }}
              />
            );
          })}

          {/* Kill markers */}
          {replayData?.kills.map((kill, i) => {
            const pos = (kill.time / duration) * 100;
            return (
              <div
                key={`kill-${i}`}
                className="absolute top-0 bottom-0 w-px bg-fn-red/40 hover:bg-fn-red/80 transition-colors cursor-pointer"
                style={{ left: `${pos}%` }}
                title={`${kill.killer} eliminated ${kill.victim}`}
                onClick={(e) => {
                  e.stopPropagation();
                  seek(kill.time);
                }}
              />
            );
          })}

          {/* Bookmark markers */}
          {showBookmarks && bookmarks.map((bookmark) => {
            const pos = (bookmark.time / duration) * 100;
            return (
              <div
                key={bookmark.id}
                className="absolute top-0 bottom-0 w-1.5 bg-fn-gold cursor-pointer hover:scale-y-110 transition-transform"
                style={{ left: `${pos}%` }}
                title={`${bookmark.label} - ${formatTime(bookmark.time)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  seek(bookmark.time);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeBookmark(bookmark.id);
                }}
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

          {/* Elimination density zones */}
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
              { mode: 'free' as const, icon: Play, label: 'Free Cam', key: 'F' },
              { mode: 'player' as const, icon: Eye, label: 'Player View', key: 'V' },
              { mode: 'top' as const, icon: Maximize2, label: 'Top Down', key: 'T' },
              { mode: 'first-person' as const, icon: Eye, label: '1st Person', key: '1' },
              { mode: 'third-person' as const, icon: Users, label: '3rd Person', key: '3' },
              { mode: 'cinematic' as const, icon: Star, label: 'Cinematic', key: 'C' },
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
            { active: showBookmarks, toggle: toggleBookmarks, icon: Bookmark, label: 'Bookmarks' },
            { active: showMatchStats, toggle: toggleMatchStats, icon: Trophy, label: 'Stats' },
            { active: showDeathFeed && !!deathCamTarget, toggle: toggleDeathFeed, icon: Target, label: 'Death Cam' },
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

          {/* Add bookmark */}
          <button
            onClick={handleAddBookmark}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] text-fn-gold hover:bg-fn-gold/10 transition-colors"
            title="Add Bookmark (B)"
          >
            <Flag className="w-3 h-3" />
            <span className="hidden xl:inline">Mark</span>
          </button>

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
          <span>C: Cinematic</span>
          <span>B: Bookmark</span>
          <span>S: Stats</span>
          <span>Esc: Exit</span>
        </div>
      </div>

      {/* Victory Royale Overlay */}
      {showVictoryScreen && (
        <VictoryRoyaleOverlay />
      )}

      {/* Match Stats Overlay */}
      {showMatchStats && (
        <MatchStatsOverlay />
      )}
    </div>
  );
}

function getKeyMomentsForEvent(eventType: string, duration: number) {
  if (eventType === 'the_device') {
    return [
      { time: 0, label: 'Event Start' },
      { time: 150, label: 'Device Activation' },
      { time: 300, label: 'Arms Deploy' },
      { time: 420, label: 'Storm Wall Impact' },
      { time: 570, label: 'Reality Pulse' },
      { time: 900, label: 'Event End' },
    ];
  }
  if (eventType === 'galactus') {
    return [
      { time: 0, label: 'Heroes Gather' },
      { time: 120, label: 'Galactus Arrives' },
      { time: 240, label: 'Battle Begins' },
      { time: 360, label: 'Nexus Power' },
      { time: 480, label: 'Galactus Defeated' },
      { time: 600, label: 'Event End' },
    ];
  }
  return [];
}

function VictoryRoyaleOverlay() {
  const { setShowVictoryScreen, setCameraMode, cameraMode } = useReplayStore();

  React.useEffect(() => {
    setCameraMode('cinematic');
  }, [setCameraMode]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="text-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-9xl mb-4"
        >
          🏆
        </motion.div>
        <h1 className="text-6xl font-display font-bold text-fn-gold mb-2 text-glow-gold">
          VICTORY ROYALE!
        </h1>
        <p className="text-xl text-fn-white mb-8">Congratulations to the winner!</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setShowVictoryScreen(false)}
            className="px-6 py-3 bg-fn-purple rounded-lg text-white font-medium hover:bg-fn-purple-light transition-colors"
          >
            Continue Watching
          </button>
          <button
            onClick={() => {
              setShowVictoryScreen(false);
              setCameraMode('free');
            }}
            className="px-6 py-3 bg-fn-card border border-fn-border rounded-lg text-fn-white font-medium hover:bg-fn-card-hover transition-colors"
          >
            Free Camera
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MatchStatsOverlay() {
  const { playerStats, showMatchStats, toggleMatchStats, replayData } = useReplayStore();

  if (!showMatchStats || !replayData) return null;

  const winner = playerStats[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="w-full max-w-4xl bg-fn-darker/95 border border-fn-border/30 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-fn-purple/20 to-fn-blue/20 px-6 py-4 border-b border-fn-border/30 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-display font-bold text-fn-white">Match Statistics</h2>
            <p className="text-sm text-fn-gray">{replayData.metadata.gameMode} • {replayData.metadata.mapName}</p>
          </div>
          <button
            onClick={toggleMatchStats}
            className="text-fn-gray hover:text-fn-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Winner banner */}
        {winner && (
          <div className="bg-fn-gold/10 border-b border-fn-gold/30 px-6 py-3 flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <div className="text-lg font-bold text-fn-gold">Winner: {winner.name}</div>
              <div className="text-sm text-fn-gray">Placement: #{winner.placement} • {winner.kills} Eliminations</div>
            </div>
          </div>
        )}

        {/* Stats table */}
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-fn-border/30">
                <th className="pb-2 text-xs font-bold uppercase tracking-wider text-fn-gray">Player</th>
                <th className="pb-2 text-xs font-bold uppercase tracking-wider text-fn-gray text-center">Place</th>
                <th className="pb-2 text-xs font-bold uppercase tracking-wider text-fn-gray text-center">Kills</th>
                <th className="pb-2 text-xs font-bold uppercase tracking-wider text-fn-gray text-center">Damage</th>
                <th className="pb-2 text-xs font-bold uppercase tracking-wider text-fn-gray text-center">Headshots</th>
                <th className="pb-2 text-xs font-bold uppercase tracking-wider text-fn-gray text-center">Accuracy</th>
                <th className="pb-2 text-xs font-bold uppercase tracking-wider text-fn-gray text-center">Time Alive</th>
              </tr>
            </thead>
            <tbody>
              {playerStats.map((stat, i) => (
                <tr 
                  key={stat.playerId} 
                  className={`border-b border-fn-border/10 ${
                    i === 0 ? 'bg-fn-gold/5' : ''
                  }`}
                >
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </span>
                      <span className={`text-sm font-medium ${i === 0 ? 'text-fn-gold' : 'text-fn-white'}`}>
                        {stat.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 text-center">
                    <span className={`text-sm font-mono ${i === 0 ? 'text-fn-gold font-bold' : 'text-fn-gray'}`}>
                      #{stat.placement}
                    </span>
                  </td>
                  <td className="py-2 text-center">
                    <span className="text-sm font-mono text-fn-red">{stat.kills}</span>
                  </td>
                  <td className="py-2 text-center">
                    <span className="text-sm font-mono text-fn-white">{stat.damageDealt}</span>
                  </td>
                  <td className="py-2 text-center">
                    <span className="text-sm font-mono text-fn-gold">{stat.headshots}</span>
                  </td>
                  <td className="py-2 text-center">
                    <span className="text-sm font-mono text-fn-blue">{stat.accuracy}%</span>
                  </td>
                  <td className="py-2 text-center">
                    <span className="text-sm font-mono text-fn-gray">{formatTime(stat.timeAlive)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}