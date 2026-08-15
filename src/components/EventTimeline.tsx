'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, Wind, Trophy, Target, Skull, ChevronDown, ChevronUp } from 'lucide-react';
import { useReplayStore } from '@/lib/replay-store';
import type { KillEvent, GameEvent } from '@/lib/types';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const EVENT_ICONS: Record<string, { icon: string; color: string }> = {
  kill: { icon: '💀', color: 'text-fn-red' },
  storm: { icon: '⚡', color: 'text-fn-purple' },
  supply_drop: { icon: '📦', color: 'text-fn-gold' },
  zone_close: { icon: '🌀', color: 'text-fn-blue' },
  game_start: { icon: '🎮', color: 'text-fn-green' },
  game_end: { icon: '🏆', color: 'text-fn-gold' },
};

// ─── Kill Event Card ───────────────────────────────────────────────────
function KillCard({ kill, isRecent }: { kill: KillEvent; isRecent: boolean }) {
  const { seek } = useReplayStore();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => seek(kill.time)}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all
        ${isRecent
          ? 'bg-fn-red/10 border border-fn-red/30 hover:bg-fn-red/15'
          : 'bg-fn-card/30 border border-fn-border/20 hover:bg-fn-card/50'
        }
      `}
    >
      <span className="text-lg">{isRecent ? '💀' : '☠️'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-xs">
          <span className={`font-bold ${isRecent ? 'text-fn-red' : 'text-fn-orange'}`}>
            {kill.killer}
          </span>
          <span className="text-fn-gray">eliminated</span>
          <span className="font-medium text-fn-gray">{kill.victim}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-fn-gray/60">
          <span>{kill.weapon}</span>
          <span>•</span>
          <span>{kill.distance}m</span>
          {kill.isHeadshot && <span className="text-fn-gold">🎯 Headshot</span>}
        </div>
      </div>
      <span className="text-[10px] font-mono text-fn-gray">{formatTime(kill.time)}</span>
    </motion.div>
  );
}

// ─── Storm Phase Card ──────────────────────────────────────────────────
function StormCard({ phase, time, isCurrent }: { phase: number; time: number; isCurrent: boolean }) {
  const { seek } = useReplayStore();

  return (
    <div
      onClick={() => seek(time)}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-all
        ${isCurrent
          ? 'bg-fn-blue/10 border border-fn-blue/30'
          : 'bg-fn-card/20 border border-fn-border/10 hover:bg-fn-card/40'
        }
      `}
    >
      <span className="text-sm">🌀</span>
      <span className={`text-xs font-medium ${isCurrent ? 'text-fn-blue' : 'text-fn-gray'}`}>
        Phase {phase + 1}
      </span>
      <span className="text-[10px] text-fn-gray/50 ml-auto font-mono">{formatTime(time)}</span>
    </div>
  );
}

function WorldEventCard({ event }: { event: GameEvent }) {
  const { seek } = useReplayStore();
  const isSupply = event.type === 'supply_drop';
  const label = typeof event.data.label === 'string'
    ? event.data.label
    : isSupply ? 'Supply drop' : event.type.replace('_', ' ');

  return (
    <div
      onClick={() => seek(event.time)}
      className="flex cursor-pointer items-center gap-2 rounded-lg border border-fn-border/20 bg-fn-card/30 px-3 py-2 transition-colors hover:bg-fn-card/50"
    >
      <span className="text-sm">{isSupply ? '📦' : '📍'}</span>
      <span className={`text-xs font-medium ${isSupply ? 'text-fn-gold' : 'text-fn-blue'}`}>{label}</span>
      <span className="ml-auto text-[10px] font-mono text-fn-gray/50">{formatTime(event.time)}</span>
    </div>
  );
}

// ─── Main Event Timeline Panel ─────────────────────────────────────────
export default function EventTimeline() {
  const { replayData, currentTime, duration } = useReplayStore();
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [filter, setFilter] = React.useState<'all' | 'kills' | 'storm'>('all');

  if (!replayData) return null;

  const { kills } = replayData;
  const worldEvents = replayData.events
    .filter((event) => event.time <= currentTime && (event.type === 'supply_drop' || event.type === 'player_marked'))
    .slice()
    .reverse()
    .slice(0, 12);

  // Count kills per player
  const killLeaders = useMemo(() => {
    const counts: Record<string, number> = {};
    kills.forEach(k => {
      counts[k.killer] = (counts[k.killer] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [kills]);

  // Recent kills (last 30 seconds)
  const recentKills = kills.filter(k => k.time <= currentTime && k.time > currentTime - 30);
  const visibleKills = filter === 'storm' ? [] : kills.filter(k => k.time <= currentTime);

  // Storm phases
  const stormEvents: { phase: number; time: number }[] = [];
  for (let i = 0; i < 8; i++) {
    stormEvents.push({ phase: i, time: i * (duration / 8) });
  }

  const currentPhase = stormEvents.findIndex(s => s.time > currentTime) - 1;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-fn-border/30">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-fn-gold" />
          <span className="text-sm font-medium text-fn-white">Events</span>
          <span className="text-[10px] text-fn-gray bg-fn-card px-2 py-0.5 rounded-full">
            {visibleKills.length} kills
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-fn-gray hover:text-fn-white transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Kill leaders */}
          <div className="px-3 py-2 border-b border-fn-border/20">
            <div className="text-[10px] text-fn-gray/60 uppercase tracking-wider mb-1.5">Kill Leaders</div>
            <div className="flex gap-1 flex-wrap">
              {killLeaders.map(([name, count], i) => (
                <div key={name} className="flex items-center gap-1 bg-fn-card/50 rounded px-1.5 py-0.5 text-[10px]">
                  <span className={i === 0 ? 'text-fn-gold' : i === 1 ? 'text-fn-gray' : 'text-fn-gray/50'}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <span className="text-fn-white font-medium">{name}</span>
                  <span className="text-fn-red font-mono">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="px-3 py-2 flex gap-1 border-b border-fn-border/20">
            {[
              { key: 'all' as const, label: 'All Events' },
              { key: 'kills' as const, label: 'Kills' },
              { key: 'storm' as const, label: 'Storm' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-2 py-1 text-[10px] rounded-md transition-colors ${
                  filter === key
                    ? 'bg-fn-purple/20 text-fn-purple border border-fn-purple/30'
                    : 'text-fn-gray hover:text-fn-white border border-transparent'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Storm phases */}
          {filter !== 'kills' && (
            <div className="px-3 py-2 space-y-1">
              <div className="text-[10px] text-fn-gray/60 uppercase tracking-wider mb-1">Storm Phases</div>
              {stormEvents.map(({ phase, time }) => (
                <StormCard
                  key={phase}
                  phase={phase}
                  time={time}
                  isCurrent={phase === currentPhase}
                />
              ))}
            </div>
          )}

          {/* World events */}
          {filter !== 'kills' && worldEvents.length > 0 && (
            <div className="space-y-1 px-3 py-2">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-fn-gray/60">World events</div>
              {worldEvents.map((event, index) => (
                <WorldEventCard key={`${event.type}-${event.time}-${index}`} event={event} />
              ))}
            </div>
          )}

          {/* Kill list */}
          {filter !== 'storm' && (
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
              <div className="text-[10px] text-fn-gray/60 uppercase tracking-wider mb-1">
                Eliminations ({visibleKills.length})
              </div>
              <AnimatePresence>
                {visibleKills.slice().reverse().slice(0, 100).map((kill, i) => (
                  <KillCard
                    key={`${kill.killer}-${kill.victim}-${kill.time}`}
                    kill={kill}
                    isRecent={recentKills.includes(kill)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
}
