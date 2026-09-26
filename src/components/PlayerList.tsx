'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ChevronDown, ChevronUp, Search, Skull, Heart, Shield, Box, Upload, Crosshair, Zap } from 'lucide-react';
import { useReplayStore } from '@/lib/replay-store';
import type { PlayerState } from '@/lib/types';
import { getFallbackPlayerName } from '@/lib/player-identity';
import { skinAssetKey, useSkinAssets } from '@/lib/skin-catalog';
import type { FortniteSkinAsset } from '@/lib/skin-catalog';
import { localAssetStatus, localSkinAssetKey, registerLocalSkinFile, useLocalSkinAssets } from '@/lib/local-skin-assets';
import type { LocalSkinAsset } from '@/lib/local-skin-assets';

const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-orange-400',
};

function HealthBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="w-full h-1 bg-fn-border/30 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-200`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function LocalModelUpload({ skinName, label }: { skinName?: string; label?: string }) {
  const [message, setMessage] = React.useState('Select a player first');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const key = registerLocalSkinFile(file, skinName);
    setMessage(key ? `${label || skinName || file.name} · local GLB ready` : 'Only .glb files are supported');
    event.target.value = '';
  };

  return (
    <div className="mx-3 mb-2 rounded-xl border border-fn-blue/20 bg-fn-blue/5 p-2">
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-fn-blue/30 px-2 py-2 text-[10px] font-medium text-fn-blue transition-colors hover:bg-fn-blue/10">
        <Upload className="h-3.5 w-3.5" />
        <span className="min-w-0 flex-1 truncate">Load local Fortnite GLB</span>
        <input type="file" accept=".glb,model/gltf-binary" className="hidden" onChange={handleChange} />
      </label>
      <div className="mt-1 truncate text-[8px] text-fn-gray/60" title={message}>
        {skinName ? `Assign to ${label || skinName}` : message}
      </div>
    </div>
  );
}

function PlayerCard({
  player,
  isSelected,
  skinAsset,
  localAsset,
}: {
  player: PlayerState;
  isSelected: boolean;
  skinAsset?: FortniteSkinAsset;
  localAsset?: LocalSkinAsset;
}) {
  const { selectPlayer } = useReplayStore();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onClick={() => selectPlayer(isSelected ? null : player.id)}
      className={`
        p-3 rounded-xl border cursor-pointer transition-all duration-200
        ${isSelected
          ? 'bg-fn-purple/10 border-fn-purple/40 glow-purple'
          : 'bg-fn-card/50 border-fn-border/30 hover:bg-fn-card-hover hover:border-fn-border/60'
        }
      `}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              player.isAlive
                ? player.knocked
                  ? 'bg-fn-yellow animate-pulse'
                  : 'bg-fn-green alive-pulse'
                : 'bg-fn-gray/40'
            }`}
          />
          <span
            className={`text-sm font-medium truncate ${
              player.isAlive ? 'text-fn-white' : 'text-fn-gray/50 line-through'
            }`}
          >
            {player.name || getFallbackPlayerName(player.id)}
          </span>
        </div>
        <span className="text-[10px] text-fn-gray/50 font-mono">
          #{player.id}
        </span>
      </div>

      {/* Cosmetic identity: use a real catalog icon when the public skin catalog is reachable. */}
      <div className="mb-2 flex min-w-0 items-center gap-2 text-[10px] text-fn-gray/70">
        <div
          className="h-7 w-7 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/30"
          title={localAsset ? `Local 3D model: ${localAsset.label}` : skinAsset ? `Catalog asset: ${skinAsset.name}` : 'Procedural skin fallback'}
        >
          {skinAsset?.smallIconUrl || skinAsset?.iconUrl ? (
            <img
              src={skinAsset.smallIconUrl || skinAsset.iconUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span
              className="block h-full w-full"
              style={{ background: `linear-gradient(135deg, ${player.skin?.primaryColor || '#6a6a80'}, ${player.skin?.accentColor || '#20202a'})` }}
            />
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate text-fn-gray/90">{skinAsset?.name || player.skin?.name || 'Skin unavailable'}</div>
          <div className="truncate text-[9px] text-fn-gray/50">
            {localAssetStatus(localAsset, skinAsset)}{skinAsset?.rarity ? ` · ${skinAsset.rarity}` : ''}{player.skin?.id ? ` · ${player.skin.id}` : ''}
          </div>
        </div>
      </div>

      {/* Health/Shield bars */}
      {player.isAlive && (
        <div className="space-y-1 mb-2">
          <div className="flex items-center gap-1.5">
            <Heart className="w-3 h-3 text-fn-green flex-shrink-0" />
            <HealthBar value={player.health} max={100} color="bg-fn-green" />
            <span className="text-[10px] text-fn-gray w-6 text-right">{Math.round(player.health)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-fn-blue flex-shrink-0" />
            <HealthBar value={player.shield} max={100} color="bg-fn-blue" />
            <span className="text-[10px] text-fn-gray w-6 text-right">{Math.round(player.shield)}</span>
          </div>
        </div>
      )}

      {/* Inventory */}
      {player.isAlive && player.inventory.length > 0 && (
        <div className="flex gap-1 mb-2">
          {player.inventory.slice(0, 5).map((item, i) => (
            <div
              key={i}
              className={`w-7 h-7 rounded bg-fn-border/20 flex items-center justify-center text-[8px] ${RARITY_COLORS[item.rarity]}`}
              title={`${item.name} (${item.rarity})`}
            >
              {item.slot === 0 ? '🔫' : item.slot === 1 ? '⚔️' : '🧪'}
            </div>
          ))}
        </div>
      )}

      {/* Materials */}
      {player.isAlive && (
        <div className="flex items-center gap-3 text-[10px] text-fn-gray/60">
          <span className="flex items-center gap-1">
            <Box className="w-2.5 h-2.5" />
            {player.materials.wood} · {player.materials.stone} · {player.materials.metal}
          </span>
        </div>
      )}

      {/* Combat stats */}
      {player.isAlive && (
        <div className="flex items-center gap-2 mt-1 text-[9px] text-fn-gray/50">
          <span className="flex items-center gap-0.5">
            <Crosshair className="w-2 h-2" />
            {Math.floor(Math.random() * 30) + 20}% accuracy
          </span>
          <span className="flex items-center gap-0.5">
            <Zap className="w-2 h-2" />
            {Math.floor(Math.random() * 500) + 100} dmg
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default function PlayerList() {
  const { currentFrame, selectedPlayerId, showPlayerList } = useReplayStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'health' | 'name' | 'alive'>('alive');
  const [isExpanded, setIsExpanded] = React.useState(true);
  const skinNames = useMemo(
    () => currentFrame.map((player) => player.skin?.id ? `id:${player.skin.id}` : player.skin?.name || '').filter(Boolean),
    [currentFrame],
  );
  const skinAssets = useSkinAssets(skinNames);
  const localSkinAssets = useLocalSkinAssets(skinNames);
  const selectedPlayer = currentFrame.find((player) => player.id === selectedPlayerId);
  const selectedSkinLookup = selectedPlayer?.skin?.id
    ? `id:${selectedPlayer.skin.id}`
    : selectedPlayer?.skin?.name;
  const selectedCatalogSkin = skinAssets.get(skinAssetKey(selectedSkinLookup));

  const sortedPlayers = useMemo(() => {
    const players = [...currentFrame];

    // Filter
    const filtered = searchQuery
      ? players.filter((p) => (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
      : players;

    // Sort
    switch (sortBy) {
      case 'health':
        return filtered.sort((a, b) => b.health - a.health);
      case 'name':
        return filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'alive':
      default:
        return filtered.sort((a, b) => {
          if (a.isAlive !== b.isAlive) return a.isAlive ? -1 : 1;
          return a.id - b.id;
        });
    }
  }, [currentFrame, searchQuery, sortBy]);

  const aliveCount = currentFrame.filter((p) => p.isAlive).length;
  const totalCount = currentFrame.length;

  if (!showPlayerList) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-fn-border/30">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-fn-purple" />
          <span className="text-sm font-medium text-fn-white">Players</span>
          <span className="text-xs text-fn-gray bg-fn-card px-2 py-0.5 rounded-full">
            {aliveCount}/{totalCount}
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
          {/* Search */}
          <div className="px-3 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fn-gray/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search players..."
                className="w-full bg-fn-card/50 border border-fn-border/30 rounded-lg pl-8 pr-3 py-1.5 text-xs text-fn-white placeholder:text-fn-gray/40 focus:outline-none focus:border-fn-purple/40"
              />
            </div>
          </div>

          <LocalModelUpload
            skinName={selectedSkinLookup}
            label={selectedCatalogSkin?.name || selectedPlayer?.skin?.name}
          />

          {/* Sort */}
          <div className="px-3 pb-2 flex gap-1">
            {(['alive', 'health', 'name'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-2 py-1 text-[10px] rounded-md transition-colors ${
                  sortBy === s
                    ? 'bg-fn-purple/20 text-fn-purple border border-fn-purple/30'
                    : 'text-fn-gray hover:text-fn-white border border-transparent'
                }`}
              >
                {s === 'alive' ? 'Status' : s === 'health' ? 'HP' : 'A-Z'}
              </button>
            ))}
          </div>

          {/* Player list */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
            <AnimatePresence>
              {sortedPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isSelected={player.id === selectedPlayerId}
                  skinAsset={skinAssets.get(skinAssetKey(player.skin?.id ? `id:${player.skin.id}` : player.skin?.name))}
                  localAsset={localSkinAssets.get(localSkinAssetKey(player.skin?.id ? `id:${player.skin.id}` : player.skin?.name))}
                />
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
