import type { SeasonId } from './map-presets';

const ARCHIVE_ROOT = 'https://raw.githubusercontent.com/yaelbrinkert/fortnite-archives/main';
const MANIFEST_URL = `${ARCHIVE_ROOT}/manifest.json`;
const APOLLO_HEIGHTMAP_URL = 'https://raw.githubusercontent.com/cgcostume/pubg-maps/master/apollo/fortnite_apollo_height_l16_lod0.png';

interface ArchiveVersion {
  version: string;
  chapter: number;
  season: number;
  path: string;
  hasMap?: boolean;
  mapFile?: string;
  mapFiles?: Record<string, string>;
}

interface ArchiveManifest {
  versions: ArchiveVersion[];
}

export interface ArchiveMapAsset {
  imageUrl: string;
  version: string;
  sourceUrl: string;
  heightmapUrl?: string;
}

let manifestPromise: Promise<ArchiveManifest | null> | null = null;

function loadManifest(): Promise<ArchiveManifest | null> {
  if (!manifestPromise) {
    manifestPromise = fetch(MANIFEST_URL, { cache: 'force-cache' })
      .then((response) => (response.ok ? response.json() as Promise<ArchiveManifest> : null))
      .catch(() => null);
  }
  return manifestPromise;
}

function seasonCoordinates(seasonId: SeasonId): { chapter: number; season: number } {
  const match = seasonId.match(/^c(\d+)s(\d+|x)$/);
  if (!match) return { chapter: 5, season: 1 };
  return { chapter: Number(match[1]), season: match[2] === 'x' ? 10 : Number(match[2]) };
}

function versionNumber(version: string): number {
  const match = version.match(/^(\d+)(?:[._-](\d+))?/);
  if (!match) return -1;
  return Number(`${match[1]}.${match[2] || '00'}`);
}

function pathPart(value: string): string {
  return value.split('/').map((part) => encodeURIComponent(part)).join('/');
}

const FALLBACK_IMAGES: Partial<Record<SeasonId, string>> = {
  c2s2: `${ARCHIVE_ROOT}/chapter_2/season_2/12_60/12_60.jpg`,
};

export async function resolveSeasonMapAsset(
  seasonId: SeasonId,
  releaseVersion?: string,
): Promise<ArchiveMapAsset | null> {
  const manifest = await loadManifest();
  const coordinates = seasonCoordinates(seasonId);
  const candidates = manifest?.versions.filter(
    (entry) => entry.chapter === coordinates.chapter && entry.season === coordinates.season && entry.hasMap,
  ) || [];

  let chosen: ArchiveVersion | undefined;
  if (candidates.length > 0) {
    const target = releaseVersion ? versionNumber(releaseVersion) : Number.POSITIVE_INFINITY;
    chosen = candidates
      .slice()
      .sort((a, b) => {
        if (!releaseVersion) return versionNumber(b.version) - versionNumber(a.version);
        return Math.abs(versionNumber(a.version) - target) - Math.abs(versionNumber(b.version) - target);
      })[0];
  }

  const mapFile = chosen?.mapFiles?.br || chosen?.mapFile;
  if (chosen && mapFile) {
    return {
      imageUrl: `${ARCHIVE_ROOT}/${pathPart(chosen.path)}/${encodeURIComponent(mapFile)}`,
      version: chosen.version,
      sourceUrl: `https://github.com/yaelbrinkert/fortnite-archives/tree/main/${chosen.path}`,
      heightmapUrl: seasonId === 'c2s2' ? APOLLO_HEIGHTMAP_URL : undefined,
    };
  }

  const fallbackImage = FALLBACK_IMAGES[seasonId];
  if (fallbackImage) {
    return {
      imageUrl: fallbackImage,
      version: '12.60',
      sourceUrl: 'https://github.com/yaelbrinkert/fortnite-archives/tree/main/chapter_2/season_2/12_60',
      heightmapUrl: APOLLO_HEIGHTMAP_URL,
    };
  }

  return null;
}
