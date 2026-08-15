'use client';

import React, { useState } from 'react';
import { Clock3, Pause, Play, Radio, X, Zap } from 'lucide-react';
import { useReplayStore } from '@/lib/replay-store';
import { getDeviceEventPhase, getDeviceEventProgress, THE_DEVICE_EVENT } from '@/lib/event-presets';

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default function LiveEventPanel() {
  const { replayData, currentTime, duration, isPlaying, togglePlay, seek } = useReplayStore();
  const [isOpen, setIsOpen] = useState(true);

  if (replayData?.metadata.eventType !== 'the_device') return null;

  if (!isOpen) return null;

  const phase = getDeviceEventPhase(currentTime);
  const progress = getDeviceEventProgress(currentTime);

  return (
    <div className="pointer-events-auto absolute left-1/2 top-28 z-[35] w-[min(560px,calc(100%-2rem))] -translate-x-1/2">
      <div className="map-glass rounded-2xl border border-fn-blue/25 p-3 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fn-blue/30 to-fn-purple/30 text-fn-blue">
              <Radio className="h-4 w-4" />
              <span className="absolute right-1 top-1 h-1.5 w-1.5 animate-pulse rounded-full bg-fn-red shadow-[0_0_8px_#ff3355]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-bold uppercase tracking-[0.16em] text-white">The Device</span>
                <span className="rounded bg-fn-red/10 px-1.5 py-0.5 text-[8px] font-mono uppercase tracking-wider text-fn-red">Live Event</span>
              </div>
              <div className="mt-1 text-[9px] uppercase tracking-wider text-fn-gray">Apollo · Release 12.61 · Event reconstruction</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={togglePlay}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-fn-blue/15 text-fn-blue transition-colors hover:bg-fn-blue/30"
              title={isPlaying ? 'Pause event' : 'Play event'}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-fn-gray transition-colors hover:bg-fn-red/15 hover:text-fn-red"
              title="Close event panel"
              aria-label="Close event panel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5" style={{ color: phase.color }} />
              <span className="text-xs font-bold uppercase tracking-wider text-white">{phase.label}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-fn-gray">
              <Clock3 className="h-3 w-3" />
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-fn-gray">{phase.description}</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-fn-blue via-fn-purple to-fn-gold transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>

        <div className="mt-2 grid grid-cols-6 gap-1">
          {THE_DEVICE_EVENT.phases.map((eventPhase) => {
            const active = eventPhase.id === phase.id;
            const completed = currentTime >= eventPhase.end;
            return (
              <button
                key={eventPhase.id}
                onClick={() => seek(Math.min(eventPhase.start + 1, duration))}
                className={`rounded-lg border px-1 py-1.5 text-center transition-all ${
                  active
                    ? 'border-fn-blue/50 bg-fn-blue/15 text-white'
                    : completed
                      ? 'border-fn-green/20 bg-fn-green/5 text-fn-green/80'
                      : 'border-white/5 bg-white/[0.02] text-fn-gray/60 hover:border-white/15 hover:text-fn-gray'
                }`}
              >
                <span className="block text-[8px] font-bold uppercase tracking-wider">{eventPhase.label}</span>
                <span className="mt-0.5 block text-[8px] font-mono opacity-60">{formatTime(eventPhase.start)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
