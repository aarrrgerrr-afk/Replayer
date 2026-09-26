'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Crosshair, Zap } from 'lucide-react';
import { useReplayStore } from '@/lib/replay-store';
import type { KillEvent } from '@/lib/types';
import { getFallbackPlayerName } from '@/lib/player-identity';

function KillItem({ kill, index }: { kill: KillEvent; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.8 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="flex items-center gap-2 bg-fn-card/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-fn-border/30"
    >
      {/* Killer */}
      <div className="flex items-center gap-1.5 min-w-0">
        <Skull className="w-3.5 h-3.5 text-fn-red flex-shrink-0" />
        <span className="text-xs font-medium text-fn-red truncate max-w-[80px]">
          {kill.killer || getFallbackPlayerName(kill.killerId)}
        </span>
      </div>

      {/* Kill info */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className="flex items-center gap-1">
          {kill.isHeadshot && (
            <Crosshair className="w-2.5 h-2.5 text-fn-gold" />
          )}
          <span className="text-[9px] text-fn-gray font-mono">
            {kill.distance}m
          </span>
        </div>
        <span className="text-[8px] text-fn-gray/50 truncate max-w-[60px]">
          {kill.weapon}
        </span>
        {kill.damage && (
          <div className="flex items-center gap-0.5">
            <Zap className="w-2 h-2 text-fn-orange" />
            <span className="text-[8px] text-fn-orange font-mono">{kill.damage}</span>
          </div>
        )}
      </div>

      {/* Victim */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-xs font-medium text-fn-gray truncate max-w-[80px]">
          {kill.victim || getFallbackPlayerName(kill.victimId)}
        </span>
      </div>
    </motion.div>
  );
}

export default function KillFeed() {
  const { recentKills, showKillFeed } = useReplayStore();
  const [displayedKills, setDisplayedKills] = useState<KillEvent[]>([]);

  useEffect(() => {
    if (recentKills.length > 0) {
      setDisplayedKills((prev) => {
        const existingIds = new Set(prev.map((k) => `${k.killer}-${k.victim}-${k.time}`));
        const newKills = recentKills.filter(
          (k) => !existingIds.has(`${k.killer}-${k.victim}-${k.time}`)
        );
        return [...newKills, ...prev].slice(0, 10);
      });
    }
  }, [recentKills]);

  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayedKills((prev) => {
        const now = Date.now();
        return prev.slice(0, 8);
      });
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  if (!showKillFeed || displayedKills.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 z-20 pointer-events-none max-w-[320px]">
      <AnimatePresence>
        {displayedKills.map((kill, i) => (
          <KillItem key={`${kill.killer}-${kill.victim}-${kill.time}`} kill={kill} index={i} />
        ))}
      </AnimatePresence>
    </div>
  );
}
