import { useEffect, useMemo, useState } from 'react';

const SEARCH_ENDPOINT = 'https://fortnite-api.com/v2/cosmetics/br/search';
const LOCAL_SEARCH_ENDPOINT = '/api/skin-catalog';
const CATALOG_SOURCE = 'https://github.com/Fortnite-Datamining/Fortnite-Datamining';

type CosmeticRecord = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  rarity?: { displayValue?: unknown; value?: unknown };
  images?: { icon?: unknown; smallIcon?: unknown };
};

type CosmeticApiResponse = {
  status?: number;
  data?: CosmeticRecord | CosmeticRecord[];
};

export interface FortniteSkinAsset {
  id: string;
  name: string;
  description?: string;
  rarity?: string;
  iconUrl: string;
  smallIconUrl?: string;
  catalogSource: string;
}

const cache = new Map<string, FortniteSkinAsset | null>();
const pending = new Map<string, Promise<FortniteSkinAsset | null>>();

export function skinAssetKey(name?: string): string {
  return name?.trim().toLocaleLowerCase() || '';
}

function readString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return undefined;
}

function toAsset(record: CosmeticRecord | undefined): FortniteSkinAsset | null {
  const id = readString(record?.id);
  const name = readString(record?.name);
  const iconUrl = readString(record?.images?.icon) || readString(record?.images?.smallIcon);
  if (!id || !name || !iconUrl) return null;

  return {
    id,
    name,
    description: readString(record?.description),
    rarity: readString(record?.rarity?.displayValue) || readString(record?.rarity?.value),
    iconUrl,
    smallIconUrl: readString(record?.images?.smallIcon),
    catalogSource: CATALOG_SOURCE,
  };
}

function readAssetPayload(payload: CosmeticApiResponse | FortniteSkinAsset): FortniteSkinAsset | null {
  if ('iconUrl' in payload && typeof payload.iconUrl === 'string') return payload;
  if (!('data' in payload)) return null;
  const records = Array.isArray(payload.data) ? payload.data : [payload.data];
  return records.map(toAsset).find((asset): asset is FortniteSkinAsset => Boolean(asset)) || null;
}

async function requestJson(url: string): Promise<FortniteSkinAsset | null> {
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    return readAssetPayload((await response.json()) as CosmeticApiResponse | FortniteSkinAsset);
  } catch {
    return null;
  }
}

async function requestSkin(query: string, matchMethod: 'full' | 'contains'): Promise<FortniteSkinAsset | null> {
  const isIdQuery = query.startsWith('id:');
  const value = isIdQuery ? query.slice(3) : query;
  const field = isIdQuery ? 'id' : 'name';
  const params = new URLSearchParams({
    [field]: value,
    matchMethod,
    type: 'outfit',
    language: 'en',
  });

  // Prefer same-origin lookup so browsers do not lose the real name/icon to
  // CORS, ad blockers, or a public API rate limit. The direct request remains a
  // useful fallback for static deployments that do not include the Next route.
  if (typeof window !== 'undefined') {
    const localAsset = await requestJson(`${LOCAL_SEARCH_ENDPOINT}?${params.toString()}`);
    if (localAsset) return localAsset;
  }

  return requestJson(`${SEARCH_ENDPOINT}?${params.toString()}`);
}

export async function fetchSkinAsset(query?: string): Promise<FortniteSkinAsset | null> {
  const key = skinAssetKey(query);
  if (!key) return null;
  if (cache.has(key)) return cache.get(key) || null;

  const existingRequest = pending.get(key);
  if (existingRequest) return existingRequest;

  const request = (async () => {
    try {
      // Exact matching prevents a name search from silently displaying a
      // different variant. ID queries are always preferred for real replays.
      const exact = await requestSkin(key, 'full');
      const result = exact || await requestSkin(key, 'contains');
      cache.set(key, result);
      return result;
    } finally {
      pending.delete(key);
    }
  })();

  pending.set(key, request);
  return request;
}

async function fetchWithConcurrency(
  names: string[],
  worker: (name: string) => Promise<FortniteSkinAsset | null>,
  limit = 4,
): Promise<readonly (readonly [string, FortniteSkinAsset | null])[]> {
  const results: (readonly [string, FortniteSkinAsset | null])[] = [];
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < names.length) {
      const index = nextIndex;
      nextIndex += 1;
      const name = names[index];
      results[index] = [name, await worker(name)] as const;
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, names.length) }, () => runWorker()));
  return results;
}

export function useSkinAssets(names: string[]): Map<string, FortniteSkinAsset> {
  const namesKey = useMemo(
    () => Array.from(new Set(names.map(skinAssetKey).filter(Boolean))).sort().join('|'),
    [names],
  );
  const normalizedNames = useMemo(
    () => namesKey ? namesKey.split('|') : [],
    [namesKey],
  );
  const [assets, setAssets] = useState<Record<string, FortniteSkinAsset>>({});

  useEffect(() => {
    let active = true;
    if (normalizedNames.length === 0) return () => { active = false; };

    fetchWithConcurrency(normalizedNames, fetchSkinAsset)
      .then((results) => {
        if (!active) return;
        setAssets((previous) => {
          const next = { ...previous };
          results.forEach(([key, asset]) => {
            if (asset) next[key] = asset;
          });
          return next;
        });
      });

    return () => { active = false; };
  }, [normalizedNames]);

  return useMemo(() => {
    const result = new Map<string, FortniteSkinAsset>();
    normalizedNames.forEach((key) => {
      const asset = assets[key] || cache.get(key);
      if (asset) result.set(key, asset);
    });
    return result;
  }, [assets, normalizedNames]);
}
