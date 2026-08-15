import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UPSTREAM = 'https://fortnite-api.com/v2/cosmetics/br/search';
const CACHE_TTL_MS = 30 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;

type CosmeticRecord = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  rarity?: { displayValue?: unknown; value?: unknown };
  images?: { icon?: unknown; smallIcon?: unknown };
};

type CosmeticResponse = {
  data?: CosmeticRecord | CosmeticRecord[];
};

type CachedResult = {
  expiresAt: number;
  asset: FortniteSkinAsset | null;
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

const cache = new Map<string, CachedResult>();

function validQuery(value: string | null): value is string {
  return Boolean(value && value.trim().length > 0 && value.trim().length <= 160);
}

function readString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  for (const key of ['name', 'value', 'pathName', 'assetPathName']) {
    if (typeof record[key] === 'string' && record[key].trim()) return record[key].trim();
  }
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
    catalogSource: 'https://github.com/Fortnite-API',
  };
}

async function fetchUpstream(url: string): Promise<FortniteSkinAsset | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as CosmeticResponse;
    const records = Array.isArray(payload.data) ? payload.data : [payload.data];
    return records.map(toAsset).find((asset): asset is FortniteSkinAsset => Boolean(asset)) || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const name = url.searchParams.get('name');
  const query = validQuery(id) ? id.trim() : validQuery(name) ? name.trim() : null;
  const matchMethod = url.searchParams.get('matchMethod') === 'contains' ? 'contains' : 'full';

  if (!query) {
    return NextResponse.json({ error: 'A cosmetic id or name is required' }, { status: 400 });
  }

  const lookupKey = `${id ? 'id' : 'name'}:${matchMethod}:${query.toLocaleLowerCase()}`;
  const cached = cache.get(lookupKey);
  if (cached && cached.expiresAt > Date.now()) {
    if (cached.asset) return NextResponse.json(cached.asset);
    return NextResponse.json({ error: 'Cosmetic not found' }, { status: 404 });
  }

  const params = new URLSearchParams({
    [id ? 'id' : 'name']: query,
    matchMethod,
    type: 'outfit',
    language: 'en',
  });
  const asset = await fetchUpstream(`${UPSTREAM}?${params.toString()}`);
  cache.set(lookupKey, { expiresAt: Date.now() + CACHE_TTL_MS, asset });

  if (!asset) return NextResponse.json({ error: 'Cosmetic not found or catalog unavailable' }, { status: 404 });
  return NextResponse.json(asset);
}
