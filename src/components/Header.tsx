'use client';

import React, { useMemo } from 'react';
import { Play, MapPin, Clock, Users, Gamepad2, Trophy, Skull, Zap } from 'lucide-react';
import { useReplayStore } from '@/lib/replay-store';
import { getMapPreset } from '@/lib/map-presets';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatFileSize(bytes: number): string {
  if (bytes > 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes > 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export default function Header() {
  const { replayData, isPlaying, currentFrame, currentTime, duration, activeSeason } = useReplayStore();
  const kills = replayData?.kills || [];

  if (!replayData) return null;

  const { metadata } = replayData;
  const activeMap = getMapPreset(activeSeason);
  const aliveCount = currentFrame.filter(p => p.isAlive).length;
  const deadCount = currentFrame.length - aliveCount;

  // Find kill leader
  const killLeader = useMemo(() => {
    const counts: Record<string, number> = {};
    kills.forEach(k => { counts[k.killer] = (counts[k.killer] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0] || null;
  }, [kills]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-fn-darker/90 backdrop-blur-md border-b border-fn-border/30 px-4 py-2.5 flex items-center justify-between z-30 relative">
      {/* Left: Logo + match info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-fn-purple to-fn-blue flex items-center justify-center shadow-lg shadow-fn-purple/20">
            <Play className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <div>
            <span className="text-sm font-display font-bold tracking-tight block leading-tight">
              <span className="text-fn-purple">Replay</span>{' '}
              <span className="text-fn-blue">Viewer</span>
            </span>
            <span className="text-[9px] text-fn-gray/50 block leading-tight">
              {metadata.filename} • {formatFileSize(metadata.fileSize)}{metadata.appearanceSource === 'replay' ? ` • ${metadata.appearanceCount || 0} skins decoded` : ''}
            </span>
          </div>
        </div>

        <div className="w-px h-8 bg-fn-border/30" />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-fn-gray">
            <Gamepad2 className="w-3.5 h-3.5 text-fn-blue" />
            <span>{metadata.gameMode}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-fn-gray">
            <MapPin className="w-3.5 h-3.5 text-fn-purple" />
            <span>{activeMap.short} · {activeMap.era}{metadata.releaseVersion ? ` · v${metadata.releaseVersion}` : ''}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-fn-gray">
            <Clock className="w-3.5 h-3.5 text-fn-gold" />
            <span>{formatDuration(metadata.duration)}</span>
          </div>
        </div>
      </div>

      {/* Center: Live match stats */}
      <div className="flex items-center gap-3">
        {/* Alive / Dead */}
        <div className="flex items-center gap-2 bg-fn-card/50 rounded-lg px-3 py-1.5 border border-fn-border/30">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-fn-green alive-pulse" />
            <span className="text-xs font-mono text-fn-green">{aliveCount}</span>
          </div>
          <div className="w-px h-3 bg-fn-border/30" />
          <div className="flex items-center gap-1">
            <Skull className="w-3 h-3 text-fn-red/60" />
            <span className="text-xs font-mono text-fn-red/60">{deadCount}</span>
          </div>
        </div>

        {/* Total kills */}
        <div className="flex items-center gap-1.5 bg-fn-card/50 rounded-lg px-3 py-1.5 border border-fn-border/30">
          <Skull className="w-3.5 h-3.5 text-fn-red" />
          <span className="text-xs font-mono text-fn-white">{kills.length}</span>
          <span className="text-[10px] text-fn-gray">kills</span>
        </div>

        {/* Kill leader */}
        {killLeader && (
          <div className="flex items-center gap-1.5 bg-fn-gold/10 rounded-lg px-3 py-1.5 border border-fn-gold/30">
            <Trophy className="w-3.5 h-3.5 text-fn-gold" />
            <span className="text-xs font-medium text-fn-gold">{killLeader[0]}</span>
            <span className="text-[10px] text-fn-gold/60 font-mono">{killLeader[1]}</span>
          </div>
        )}

        {/* Match progress */}
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-fn-border/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-fn-purple to-fn-blue rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-fn-gray font-mono">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Right: Live indicator */}
      <div className="flex items-center gap-3">
        {isPlaying && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-fn-red animate-pulse" />
            <span className="text-[10px] text-fn-red font-mono font-bold tracking-wider">LIVE</span>
          </div>
        )}
        <div className="text-[10px] text-fn-gray/40 font-mono">
          {metadata.players.length} players
        </div>
      </div>
    </div>
  );
}
