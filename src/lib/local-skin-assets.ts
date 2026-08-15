import { useEffect, useMemo, useState } from 'react';
import type { FortniteSkinAsset } from './skin-catalog';

const MANIFEST_URL = '/skins/manifest.json';

type ManifestEntry = {
  url: string;
  label?: string;
  source?: string;
};

type SkinManifest = {
  version?: number;
  skins?: Record<string, ManifestEntry>;
};

export interface LocalSkinAsset {
  key: string;
  url: string;
  label: string;
  source: 'manifest' | 'local-upload';
  catalogSource?: string;
}

const manifestAssets = new Map<string, LocalSkinAsset>();
const uploadedAssets = new Map<string, LocalSkinAsset>();
const listeners = new Set<() => void>();
let manifestLoaded = false;
let manifestRequest: Promise<void> | null = null;

export function localSkinAssetKey(name?: string): string {
  return name?.trim().toLocaleLowerCase() || '';
}

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function loadManifest(): Promise<void> {
  if (manifestLoaded) return;
  if (manifestRequest) return manifestRequest;

  manifestRequest = fetch(MANIFEST_URL, { headers: { Accept: 'application/json' } })
    .then(async (response) => {
      if (!response.ok) return;
      const manifest = (await response.json()) as SkinManifest;
      Object.entries(manifest.skins || {}).forEach(([rawKey, entry]) => {
        if (!entry?.url || !entry.url.toLocaleLowerCase().endsWith('.glb')) return;
        const key = localSkinAssetKey(rawKey);
        if (!key) return;
        manifestAssets.set(key, {
          key,
          url: entry.url,
          label: entry.label || rawKey,
          source: 'manifest',
          catalogSource: entry.source,
        });
      });
    })
    .catch(() => {
      // Missing manifest is a valid installation: the viewer simply uses its
      // icon/procedural avatar until the user adds local assets.
    })
    .finally(() => {
      manifestLoaded = true;
      manifestRequest = null;
      notify();
    });

  return manifestRequest;
}

export function registerLocalSkinFile(file: File, skinName?: string): string | null {
  if (!file.name.toLocaleLowerCase().endsWith('.glb')) return null;

  const filenameKey = file.name.replace(/\.glb$/i, '').replace(/[_-]+/g, ' ');
  const key = localSkinAssetKey(skinName || filenameKey);
  if (!key) return null;

  const previous = uploadedAssets.get(key);
  if (previous?.url.startsWith('blob:')) URL.revokeObjectURL(previous.url);
  uploadedAssets.set(key, {
    key,
    url: URL.createObjectURL(file),
    label: skinName || filenameKey,
    source: 'local-upload',
  });
  notify();
  return key;
}

export function getLocalSkinAsset(name?: string): LocalSkinAsset | undefined {
  const key = localSkinAssetKey(name);
  if (!key) return undefined;
  return uploadedAssets.get(key) || manifestAssets.get(key);
}

export function useLocalSkinAssets(names: string[]): Map<string, LocalSkinAsset> {
  const [revision, setRevision] = useState(0);
  const namesKey = useMemo(
    () => Array.from(new Set(names.map(localSkinAssetKey).filter(Boolean))).sort().join('|'),
    [names],
  );
  const normalizedNames = useMemo(
    () => namesKey ? namesKey.split('|') : [],
    [namesKey],
  );

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribe(() => {
      if (active) setRevision((value) => value + 1);
    });
    void loadManifest();
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return useMemo(() => {
    const result = new Map<string, LocalSkinAsset>();
    normalizedNames.forEach((key) => {
      const asset = getLocalSkinAsset(key);
      if (asset) result.set(key, asset);
    });
    return result;
  }, [normalizedNames, revision]);
}

export function localAssetStatus(
  localAsset: LocalSkinAsset | undefined,
  catalogAsset: FortniteSkinAsset | undefined,
): string {
  if (localAsset?.source === 'local-upload') return 'local upload';
  if (localAsset) return 'local GLB';
  if (catalogAsset) return 'catalog icon';
  return 'procedural fallback';
}
