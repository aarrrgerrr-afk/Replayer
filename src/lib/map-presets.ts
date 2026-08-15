export type PoiSize = 'major' | 'minor';

export interface MapPoi {
  name: string;
  x: number;
  z: number;
  color: string;
  size: PoiSize;
}

export interface MapTheme {
  land: string;
  landSecondary: string;
  ocean: string;
  water: string;
  grid: string;
  gridMinor: string;
  accent: string;
  fog: string;
  regionA: string;
  regionB: string;
  regionC: string;
}

export const SEASON_OPTIONS = [
  { id: 'c1s1', label: 'Chapter 1 · Season 1', short: 'C1 S1', chapter: 'Chapter 1', era: 'OG' },
  { id: 'c1s2', label: 'Chapter 1 · Season 2', short: 'C1 S2', chapter: 'Chapter 1', era: 'Medieval' },
  { id: 'c1s3', label: 'Chapter 1 · Season 3', short: 'C1 S3', chapter: 'Chapter 1', era: 'Meteor' },
  { id: 'c1s4', label: 'Chapter 1 · Season 4', short: 'C1 S4', chapter: 'Chapter 1', era: 'Superhero' },
  { id: 'c1s5', label: 'Chapter 1 · Season 5', short: 'C1 S5', chapter: 'Chapter 1', era: 'Worlds Collide' },
  { id: 'c1s6', label: 'Chapter 1 · Season 6', short: 'C1 S6', chapter: 'Chapter 1', era: 'Darkness Rises' },
  { id: 'c1s7', label: 'Chapter 1 · Season 7', short: 'C1 S7', chapter: 'Chapter 1', era: 'Ice Storm' },
  { id: 'c1s8', label: 'Chapter 1 · Season 8', short: 'C1 S8', chapter: 'Chapter 1', era: 'Jungle' },
  { id: 'c1s9', label: 'Chapter 1 · Season 9', short: 'C1 S9', chapter: 'Chapter 1', era: 'Future' },
  { id: 'c1sx', label: 'Chapter 1 · Season X', short: 'C1 SX', chapter: 'Chapter 1', era: 'Time Warp' },
  { id: 'c2s1', label: 'Chapter 2 · Season 1', short: 'C2 S1', chapter: 'Chapter 2', era: 'Apollo' },
  { id: 'c2s2', label: 'Chapter 2 · Season 2', short: 'C2 S2', chapter: 'Chapter 2', era: 'Top Secret' },
  { id: 'c2s3', label: 'Chapter 2 · Season 3', short: 'C2 S3', chapter: 'Chapter 2', era: 'Splashdown' },
  { id: 'c2s4', label: 'Chapter 2 · Season 4', short: 'C2 S4', chapter: 'Chapter 2', era: 'Nexus War' },
  { id: 'c2s5', label: 'Chapter 2 · Season 5', short: 'C2 S5', chapter: 'Chapter 2', era: 'Zero Point' },
  { id: 'c2s6', label: 'Chapter 2 · Season 6', short: 'C2 S6', chapter: 'Chapter 2', era: 'Primal' },
  { id: 'c2s7', label: 'Chapter 2 · Season 7', short: 'C2 S7', chapter: 'Chapter 2', era: 'Invasion' },
  { id: 'c2s8', label: 'Chapter 2 · Season 8', short: 'C2 S8', chapter: 'Chapter 2', era: 'Cubed' },
  { id: 'c3s1', label: 'Chapter 3 · Season 1', short: 'C3 S1', chapter: 'Chapter 3', era: 'Flipped' },
  { id: 'c3s2', label: 'Chapter 3 · Season 2', short: 'C3 S2', chapter: 'Chapter 3', era: 'Resistance' },
  { id: 'c3s3', label: 'Chapter 3 · Season 3', short: 'C3 S3', chapter: 'Chapter 3', era: 'Vibin' },
  { id: 'c3s4', label: 'Chapter 3 · Season 4', short: 'C3 S4', chapter: 'Chapter 3', era: 'Paradise' },
  { id: 'c4s1', label: 'Chapter 4 · Season 1', short: 'C4 S1', chapter: 'Chapter 4', era: 'A New Beginning' },
  { id: 'c4s2', label: 'Chapter 4 · Season 2', short: 'C4 S2', chapter: 'Chapter 4', era: 'Mega' },
  { id: 'c4s3', label: 'Chapter 4 · Season 3', short: 'C4 S3', chapter: 'Chapter 4', era: 'Wilds' },
  { id: 'c4s4', label: 'Chapter 4 · Season 4', short: 'C4 S4', chapter: 'Chapter 4', era: 'Last Resort' },
  { id: 'c5s1', label: 'Chapter 5 · Season 1', short: 'C5 S1', chapter: 'Chapter 5', era: 'Underground' },
  { id: 'c5s2', label: 'Chapter 5 · Season 2', short: 'C5 S2', chapter: 'Chapter 5', era: 'Myths & Mortals' },
  { id: 'c5s3', label: 'Chapter 5 · Season 3', short: 'C5 S3', chapter: 'Chapter 5', era: 'Wrecked' },
  { id: 'c5s4', label: 'Chapter 5 · Season 4', short: 'C5 S4', chapter: 'Chapter 5', era: 'Absolute Doom' },
  { id: 'c5s5', label: 'Chapter 5 · Season 5', short: 'C5 S5', chapter: 'Chapter 5', era: 'Remix' },
  { id: 'c6s1', label: 'Chapter 6 · Season 1', short: 'C6 S1', chapter: 'Chapter 6', era: 'Demon Hunters' },
  { id: 'c6s2', label: 'Chapter 6 · Season 2', short: 'C6 S2', chapter: 'Chapter 6', era: 'Lawless' },
  { id: 'c6s3', label: 'Chapter 6 · Season 3', short: 'C6 S3', chapter: 'Chapter 6', era: 'Super' },
  { id: 'c6s4', label: 'Chapter 6 · Season 4', short: 'C6 S4', chapter: 'Chapter 6', era: 'Galactic Battle' },
  { id: 'c6s5', label: 'Chapter 6 · Season 5', short: 'C6 S5', chapter: 'Chapter 6', era: 'OG Remix' },
  { id: 'c7s1', label: 'Chapter 7 · Season 1', short: 'C7 S1', chapter: 'Chapter 7', era: 'Archive Season' },
  { id: 'c7s2', label: 'Chapter 7 · Season 2', short: 'C7 S2', chapter: 'Chapter 7', era: 'Archive Season' },
  { id: 'c7s3', label: 'Chapter 7 · Season 3', short: 'C7 S3', chapter: 'Chapter 7', era: 'Archive Season' },
] as const;

export type SeasonId = (typeof SEASON_OPTIONS)[number]['id'];

// These slots provide a consistent island coordinate system. Each season swaps the
// POI names and visual identity while retaining a stable replay coordinate space.
const POI_SLOTS = [
  [-8000, -20000], [2000, 4000], [-12000, 8000], [16000, 4000], [0, -6000],
  [-4000, -8000], [14000, -28000], [10000, 30000], [0, 26000], [26000, -8000],
  [22000, -4000], [20000, -16000], [-26000, 14000], [-28000, -14000], [-10000, 18000],
  [-16000, 12000], [-14000, 28000], [28000, 8000], [14000, 24000], [-20000, -4000],
  [-6000, -2000], [-28000, -2000], [-18000, -12000], [6000, -12000], [-2000, -22000],
  [18000, -4000], [-8000, 2000], [0, -4000], [-20000, 8000], [4000, 30000],
  [10000, 36000], [-24000, -20000], [-10000, 34000], [4000, -4000],
] as const;

const THEMES: Record<string, MapTheme> = {
  og: {
    land: '#182b22', landSecondary: '#243e34', ocean: '#06111d', water: '#14506a',
    grid: '#47775b', gridMinor: '#274635', accent: '#9b59f0', fog: '#06101a',
    regionA: '#243e34', regionB: '#403c26', regionC: '#314c30',
  },
  medieval: {
    land: '#252c25', landSecondary: '#3f4935', ocean: '#08131e', water: '#1c5870',
    grid: '#6f8053', gridMinor: '#35472d', accent: '#d6a24d', fog: '#08120f',
    regionA: '#3a4935', regionB: '#57472c', regionC: '#303f4a',
  },
  meteor: {
    land: '#242329', landSecondary: '#3b343d', ocean: '#090e1c', water: '#21526d',
    grid: '#69506e', gridMinor: '#3b3042', accent: '#ff667d', fog: '#0b0b16',
    regionA: '#45333b', regionB: '#323b4e', regionC: '#4d3f35',
  },
  ice: {
    land: '#24343c', landSecondary: '#46606b', ocean: '#071522', water: '#3286a0',
    grid: '#6fa0a8', gridMinor: '#315665', accent: '#65ddff', fog: '#07131c',
    regionA: '#3b6875', regionB: '#55736e', regionC: '#8ca9ad',
  },
  jungle: {
    land: '#16352b', landSecondary: '#2c5a3c', ocean: '#061820', water: '#188394',
    grid: '#4b9a68', gridMinor: '#265c3c', accent: '#ffad48', fog: '#061813',
    regionA: '#255a3a', regionB: '#5c4825', regionC: '#1f4a58',
  },
  future: {
    land: '#18263b', landSecondary: '#2a3f5b', ocean: '#060b1c', water: '#1a6e9e',
    grid: '#4f8fb3', gridMinor: '#263f60', accent: '#00d4ff', fog: '#070b18',
    regionA: '#243c5a', regionB: '#3a304f', regionC: '#1d5262',
  },
  timewarp: {
    land: '#241d32', landSecondary: '#443052', ocean: '#0a0c20', water: '#4e3aa1',
    grid: '#815bb0', gridMinor: '#3f2d5c', accent: '#ff66cc', fog: '#0d091c',
    regionA: '#4a2c4f', regionB: '#33425f', regionC: '#563d30',
  },
  apollo: {
    land: '#19332d', landSecondary: '#2f5540', ocean: '#071724', water: '#1d6e86',
    grid: '#4b936b', gridMinor: '#2c513c', accent: '#00d4ff', fog: '#07161a',
    regionA: '#2a583e', regionB: '#5c4d2c', regionC: '#315268',
  },
  flood: {
    land: '#1a3840', landSecondary: '#30636a', ocean: '#061b2b', water: '#2695b0',
    grid: '#4aaeb3', gridMinor: '#285c68', accent: '#4de7ff', fog: '#061a24',
    regionA: '#2b6570', regionB: '#3d5949', regionC: '#235080',
  },
  marvel: {
    land: '#242333', landSecondary: '#443d55', ocean: '#0b1024', water: '#244e84',
    grid: '#775f98', gridMinor: '#3c3454', accent: '#ff4d7d', fog: '#0d0c1f',
    regionA: '#4e3c5f', regionB: '#3b4b65', regionC: '#5c3c3f',
  },
  primal: {
    land: '#243c25', landSecondary: '#4d6630', ocean: '#091b22', water: '#227b7e',
    grid: '#76a854', gridMinor: '#3d5f36', accent: '#f4b94f', fog: '#0a1916',
    regionA: '#466c31', regionB: '#6a5128', regionC: '#2d5f62',
  },
  alien: {
    land: '#263a31', landSecondary: '#536c3c', ocean: '#09172a', water: '#287da0',
    grid: '#82ba72', gridMinor: '#3e664f', accent: '#b477ff', fog: '#0a1621',
    regionA: '#47683d', regionB: '#63522b', regionC: '#3b5275',
  },
  cube: {
    land: '#241d32', landSecondary: '#493064', ocean: '#0d0b24', water: '#4e4aa0',
    grid: '#9867d1', gridMinor: '#4b3167', accent: '#ff9a3d', fog: '#110b1d',
    regionA: '#503471', regionB: '#463e64', regionC: '#693b4b',
  },
  flipped: {
    land: '#1a332c', landSecondary: '#325a45', ocean: '#061523', water: '#1a7288',
    grid: '#4f9c76', gridMinor: '#2d5943', accent: '#ffcb55', fog: '#07161a',
    regionA: '#2a5b44', regionB: '#5b4a2b', regionC: '#31536a',
  },
  resistance: {
    land: '#202b34', landSecondary: '#3a4d53', ocean: '#081525', water: '#216d8b',
    grid: '#5a9b9a', gridMinor: '#2e5661', accent: '#ff6e5b', fog: '#09151e',
    regionA: '#344f51', regionB: '#4c4535', regionC: '#293f61',
  },
  vibin: {
    land: '#1d3d36', landSecondary: '#3b6d4b', ocean: '#061825', water: '#24a0ad',
    grid: '#6ac88a', gridMinor: '#336a4b', accent: '#f783ff', fog: '#071a1a',
    regionA: '#36734a', regionB: '#5d4e2c', regionC: '#2a6274',
  },
  chrome: {
    land: '#303538', landSecondary: '#53595b', ocean: '#101921', water: '#4d8794',
    grid: '#98b2b4', gridMinor: '#4d6569', accent: '#dfe8e8', fog: '#11181c',
    regionA: '#555c5f', regionB: '#5c5547', regionC: '#435d65',
  },
  medieval4: {
    land: '#29302c', landSecondary: '#4b5942', ocean: '#081520', water: '#236d7b',
    grid: '#769c6b', gridMinor: '#3a573d', accent: '#d9a34e', fog: '#0a1615',
    regionA: '#425b3e', regionB: '#685436', regionC: '#394f62',
  },
  mega: {
    land: '#242d34', landSecondary: '#40505a', ocean: '#081422', water: '#267a95',
    grid: '#5ba2ae', gridMinor: '#2b5265', accent: '#ff56b5', fog: '#0a141e',
    regionA: '#3c5760', regionB: '#57483e', regionC: '#374b6d',
  },
  wilds: {
    land: '#1b3b29', landSecondary: '#3d6940', ocean: '#06171f', water: '#218a8c',
    grid: '#69a75f', gridMinor: '#315d39', accent: '#d6e45a', fog: '#071916',
    regionA: '#32633b', regionB: '#5e512c', regionC: '#28646b',
  },
  heist: {
    land: '#2d2b2a', landSecondary: '#51473d', ocean: '#0b1420', water: '#266b83',
    grid: '#a4956e', gridMinor: '#51483b', accent: '#f0c44f', fog: '#111313',
    regionA: '#51463c', regionB: '#654b2d', regionC: '#3a5261',
  },
  mediterranean: {
    land: '#373328', landSecondary: '#655a39', ocean: '#081823', water: '#1687a1',
    grid: '#c1a766', gridMinor: '#635733', accent: '#00d4ff', fog: '#0d1818',
    regionA: '#6b5b36', regionB: '#815b35', regionC: '#3c6870',
  },
  mythic: {
    land: '#383324', landSecondary: '#675a35', ocean: '#091927', water: '#208ca0',
    grid: '#d1b35f', gridMinor: '#705e34', accent: '#ff9e48', fog: '#0d1817',
    regionA: '#715e30', regionB: '#775134', regionC: '#3b6971',
  },
  wasteland: {
    land: '#3a3028', landSecondary: '#654936', ocean: '#101820', water: '#2d6973',
    grid: '#c28656', gridMinor: '#664535', accent: '#ff634d', fog: '#151513',
    regionA: '#674738', regionB: '#755833', regionC: '#3a5e63',
  },
  doom: {
    land: '#25272e', landSecondary: '#48434c', ocean: '#0b121f', water: '#2b667b',
    grid: '#8d8792', gridMinor: '#48454f', accent: '#74d7ff', fog: '#11151c',
    regionA: '#4a4850', regionB: '#5c4c42', regionC: '#3d5c6e',
  },
};

const POI_NAMES: Record<SeasonId, string[]> = {
  c1s1: ['Dusty Depot', 'Salty Springs', 'Pleasant Park', 'Retail Row', 'Loot Lake', 'Moisty Mire', 'Anarchy Acres', 'Lucky Landing', 'Fatal Fields', 'Wailing Woods', 'Risky Reels', 'Tomato Town', 'Haunted Hills', 'Junk Junction', 'Shifty Shafts', 'Greasy Grove', 'Flush Factory', 'Lonely Lodge', 'Factories', 'Lone House'],
  c1s2: ['Tilted Towers', 'Salty Springs', 'Pleasant Park', 'Retail Row', 'Loot Lake', 'Moisty Mire', 'Anarchy Acres', 'Lucky Landing', 'Fatal Fields', 'Wailing Woods', 'Risky Reels', 'Tomato Town', 'Haunted Hills', 'Junk Junction', 'Shifty Shafts', 'Greasy Grove', 'Flush Factory', 'Lonely Lodge', 'Snobby Shores', 'Dusty Depot'],
  c1s3: ['Tilted Towers', 'Salty Springs', 'Pleasant Park', 'Retail Row', 'Loot Lake', 'Moisty Mire', 'Anarchy Acres', 'Lucky Landing', 'Fatal Fields', 'Wailing Woods', 'Risky Reels', 'Tomato Town', 'Haunted Hills', 'Junk Junction', 'Shifty Shafts', 'Greasy Grove', 'Flush Factory', 'Lonely Lodge', 'Snobby Shores', 'Dusty Depot'],
  c1s4: ['Tilted Towers', 'Salty Springs', 'Pleasant Park', 'Retail Row', 'Loot Lake', 'Dusty Divot', 'Anarchy Acres', 'Lucky Landing', 'Fatal Fields', 'Wailing Woods', 'Risky Reels', 'Tomato Town', 'Haunted Hills', 'Junk Junction', 'Shifty Shafts', 'Greasy Grove', 'Flush Factory', 'Lonely Lodge', 'Snobby Shores', 'Salty Factory'],
  c1s5: ['Tilted Towers', 'Lazy Links', 'Pleasant Park', 'Retail Row', 'Loot Lake', 'Dusty Divot', 'Paradise Palms', 'Lucky Landing', 'Fatal Fields', 'Wailing Woods', 'Risky Reels', 'Tomato Temple', 'Haunted Hills', 'Junk Junction', 'Shifty Shafts', 'Greasy Grove', 'Flush Factory', 'Lonely Lodge', 'Viking Village', 'Snobby Shores'],
  c1s6: ['Tilted Towers', 'Lazy Links', 'Pleasant Park', 'Retail Row', 'Leaky Lake', 'Dusty Divot', 'Paradise Palms', 'Lucky Landing', 'Fatal Fields', 'Wailing Woods', 'Risky Reels', 'Tomato Temple', 'Haunted Hills', 'Junk Junction', 'Shifty Shafts', 'Greasy Grove', 'Flush Factory', 'Lonely Lodge', 'Viking Village', 'Corrupted Areas'],
  c1s7: ['Tilted Towers', 'Happy Hamlet', 'Pleasant Park', 'Retail Row', 'Loot Lake', 'Frosty Flights', 'Paradise Palms', 'Lucky Landing', 'Fatal Fields', 'Wailing Woods', 'Risky Reels', 'Tomato Temple', 'Haunted Hills', 'Junk Junction', 'Shifty Shafts', 'Polar Peak', 'Flush Factory', 'Lonely Lodge', 'Viking Village', 'Iceberg'],
  c1s8: ['Tilted Towers', 'Lazy Lagoon', 'Pleasant Park', 'Retail Row', 'Loot Lake', 'Dusty Divot', 'Sunny Steps', 'Lucky Landing', 'Fatal Fields', 'Wailing Woods', 'Risky Reels', 'Volcano', 'Haunted Hills', 'Junk Junction', 'Shifty Shafts', 'Lazy Links', 'Flush Factory', 'Lonely Lodge', 'Pirate Camp', 'Pressure Plant'],
  c1s9: ['Neo Tilted', 'Mega Mall', 'Pleasant Park', 'Retail Row', 'Loot Lake', 'Pressure Plant', 'Sunny Steps', 'Lucky Landing', 'Fatal Fields', 'Wailing Woods', 'Risky Reels', 'Tomato Temple', 'Haunted Hills', 'Junk Junction', 'Shifty Shafts', 'Greasy Grove', 'Polar Peak', 'Lonely Lodge', 'Retail District', 'Slipstream Hub'],
  c1sx: ['Tilted Town', 'Retail Row', 'Pleasant Park', 'Salty Springs', 'Loot Lake', 'Dusty Depot', 'Sunny Steps', 'Lucky Landing', 'Fatal Fields', 'Wailing Woods', 'Risky Reels', 'Tomato Temple', 'Haunted Hills', 'Junk Junction', 'Shifty Shafts', 'Greasy Grove', 'Flush Factory', 'Lonely Lodge', 'Moisty Palms', 'Evolved Hills'],
  c2s1: ['Sweaty Sands', 'Salty Springs', 'Pleasant Park', 'Retail Row', 'Craggy Cliffs', 'Slurpy Swamp', 'Frenzy Farm', 'Misty Meadows', 'Fatal Fields', 'Weeping Woods', 'Steamy Stacks', 'Dirty Docks', 'The Agency', 'Junk Junction', 'Holly Hedges', 'Lazy Lake', 'The Orchard', 'Cattus Corner', 'Sweaty Station', 'The Rig'],
  c2s2: ['The Agency', 'The Shark', 'Pleasant Park', 'Retail Row', 'Craggy Cliffs', 'The Rig', 'Frenzy Farm', 'Misty Meadows', 'The Grotto', 'Weeping Woods', 'Steamy Stacks', 'Dirty Docks', 'The Yacht', 'Holly Hedges', 'Shanty Town', 'Lazy Lake', 'The Orchard', 'Catty Corner', 'Sweaty Sands', 'Salty Springs'],
  c2s3: ['The Authority', 'The Fortilla', 'Pleasant Park', 'Retail Row', 'Craggy Cliffs', 'Rickety Rig', 'Frenzy Farm', 'Misty Meadows', 'Catty Corner', 'Weeping Woods', 'Steamy Stacks', 'Dirty Docks', 'The Yacht', 'Holly Hedges', 'Coral Castle', 'Lazy Lake', 'The Orchard', 'Sweaty Sands', 'Salty Springs', 'Flooded Farm'],
  c2s4: ['Doom’s Domain', 'Stark Industries', 'Pleasant Park', 'Retail Row', 'Craggy Cliffs', 'The Fortilla', 'Frenzy Farm', 'Misty Meadows', 'Catty Corner', 'Weeping Woods', 'Steamy Stacks', 'Dirty Docks', 'The Authority', 'Holly Hedges', 'Coral Castle', 'Lazy Lake', 'The Orchard', 'Sweaty Sands', 'Salty Springs', 'Sentinel Graveyard'],
  c2s5: ['Colossal Coliseum', 'Hunter’s Haven', 'Pleasant Park', 'Retail Row', 'Craggy Cliffs', 'Slurpy Swamp', 'Frenzy Farm', 'Misty Meadows', 'The Zero Point', 'Weeping Woods', 'Stealthy Stronghold', 'Dirty Docks', 'The Razor Crest', 'Holly Hedges', 'Coral Castle', 'Lazy Lake', 'The Orchard', 'Salty Towers', 'Sweaty Sands', 'Butter Barn'],
  c2s6: ['Boney Burbs', 'The Spire', 'Pleasant Park', 'Retail Row', 'Craggy Cliffs', 'Slurpy Swamp', 'Colossal Crops', 'Misty Meadows', 'The Zero Point', 'Weeping Woods', 'Stealthy Stronghold', 'Dirty Docks', 'The Aftermath', 'Holly Hedges', 'Coral Castle', 'Lazy Lake', 'The Orchard', 'Catty Corner', 'Sweaty Sands', 'Primal Pond'],
  c2s7: ['Believer Beach', 'Corny Complex', 'Pleasant Park', 'Retail Row', 'Craggy Cliffs', 'Slurpy Swamp', 'Corny Crops', 'Misty Meadows', 'The Aftermath', 'Weeping Woods', 'Stealthy Stronghold', 'Dirty Docks', 'Holly Hatchery', 'Holly Hedges', 'Coral Castle', 'Lazy Lake', 'The Orchard', 'Catty Corner', 'Sweaty Sands', 'IO Satellite'],
  c2s8: ['The Sideways', 'Corny Crops', 'Pleasant Park', 'Retail Row', 'Craggy Cliffs', 'Sludgy Swamp', 'Corny Complex', 'Misty Meadows', 'The Convergence', 'Weeping Woods', 'Stealthy Stronghold', 'Dirty Docks', 'Holly Hatchery', 'Holly Hedges', 'Coral Castle', 'Lazy Lake', 'The Orchard', 'Catty Corner', 'Sweaty Sands', 'Cube Town'],
  c3s1: ['Daily Bugle', 'Sanctuary', 'Sleepy Sound', 'Condo Canyon', 'Logjam Lumberyard', 'Greasy Grove', 'The Joneses', 'Rocky Reels', 'Chonker’s Speedway', 'Camp Cuddle', 'Coney Crossroads', 'Shifty Shafts', 'The Seven Outpost', 'Command Cavern', 'Tilted Towers', 'Reality Falls', 'Synapse Station', 'The Collider', 'Butter Barn', 'Windbreakers'],
  c3s2: ['Command Cavern', 'Sanctuary', 'Sleepy Sound', 'Coney Crossroads', 'Logjam Lumberyard', 'Greasy Grove', 'The Joneses', 'Rocky Reels', 'Chonker’s Speedway', 'Camp Cuddle', 'Tilted Towers', 'The Fortress', 'The Daily Bugle', 'Synapse Station', 'The Seven Outpost', 'Reality Falls', 'Condo Canyon', 'Collider Crater', 'Butter Barn', 'IO Airship'],
  c3s3: ['Reality Falls', 'Rave Cave', 'Sleepy Sound', 'Condo Canyon', 'Logjam Lotus', 'Greasy Grove', 'The Joneses', 'Rocky Reels', 'Chonker’s Speedway', 'Camp Cuddle', 'Tilted Towers', 'Shuffled Shrines', 'The Daily Bugle', 'Synapse Station', 'The Collider', 'Sanctuary', 'Coney Crossroads', 'Butter Barn', 'The Glow', 'Lil’ Shaftie'],
  c3s4: ['Chrome Crossroads', 'The Herald’s Sanctum', 'Shiny Sound', 'Cloudy Condos', 'Logjam Junction', 'Greasy Grove', 'Grim Gables', 'Rocky Reels', 'Chonker’s Speedway', 'Shiny Shrine', 'Tilted Towers', 'The Daily Bugle', 'Synapse Station', 'Reality Tree', 'The Driftwood', 'Sanctuary', 'Coney Crossroads', 'Butter Barn', 'Lustrous Lagoon', 'Flutter Barn'],
  c4s1: ['The Citadel', 'Anvil Square', 'Brutal Bastion', 'Faulty Splits', 'Frenzy Fields', 'Slappy Shores', 'Breakwater Bay', 'Lonely Labs', 'Shattered Slabs', 'The Hall of Whispers', 'Crude Harbor', 'Sandy Circle', 'Secluded Spire', 'Hidden Henge', 'Brutal Bridge', 'Frenzy Farm', 'Beep ’N Bounce', 'Cold Cavern', 'The Oathbound', 'Aegis Temple'],
  c4s2: ['Mega City', 'Kenjutsu Crossing', 'Brutal Bastion', 'Steamy Springs', 'Frenzy Fields', 'Slappy Shores', 'Breakwater Bay', 'Lonely Labs', 'Shattered Slabs', 'Knotty Nets', 'The Citadel', 'Evochrome Estate', 'Drift Ridge', 'Bamboo Falls', 'Neon Bay', 'Aegis Temple', 'Cedar Circle', 'Windrush Gorge', 'Cold Cavern', 'The Oathbound'],
  c4s3: ['Creeky Compound', 'Sunswoon Lagoon', 'Brutal Bastion', 'Shady Stilts', 'Frenzy Fields', 'Slappy Shores', 'Breakwater Bay', 'Lonely Labs', 'Shattered Slabs', 'Rumble Ruins', 'Mega City', 'The Citadel', 'Wildwater Way', 'Creaky Canopy', 'Hidden Henge', 'Aegis Temple', 'Bamboo Falls', 'Drift Ridge', 'Cold Cavern', 'The Oathbound'],
  c4s4: ['Sanguine Suites', 'Eclipsed Estate', 'Brutal Bastion', 'Relentless Retreat', 'Frenzy Fields', 'Slappy Shores', 'Breakwater Bay', 'Lonely Labs', 'Shattered Slabs', 'Mega City', 'The Citadel', 'Rumble Ruins', 'Rebel’s Roost', 'Coastal Cradle', 'Hidden Henge', 'Aegis Temple', 'Wildwater Way', 'Drift Ridge', 'Cold Cavern', 'The Oathbound'],
  c5s1: ['Lavish Lair', 'Classy Courts', 'Rebel’s Roost', 'Ritzy Riviera', 'Reckless Railways', 'Fencing Fields', 'Snooty Steppes', 'Pleasant Piazza', 'Ruined Reels', 'Hazy Hillside', 'Grand Glacier', 'Hazy Hillside', 'Rebel’s Roost', 'Coastal Cradle', 'Mount Olympus', 'Fencing Fields', 'Lavish Lair', 'Classy Courts', 'Snooty Steppes', 'Underground Station'],
  c5s2: ['Mount Olympus', 'The Underworld', 'Grim Gate', 'Brawler’s Battleground', 'Reckless Railways', 'Fencing Fields', 'Snooty Steppes', 'Pleasant Piazza', 'Ruined Reels', 'Hazy Hillside', 'Grand Glacier', 'Lavish Lair', 'The Styx', 'Restored Reels', 'Doom’s Domain', 'Pantheon Path', 'Classy Courts', 'Coastal Cradle', 'Olympian Outpost', 'River Styx'],
  c5s3: ['Brutal Beachhead', 'Nitrodrome', 'Redline Rig', 'Sandy Steppes', 'Reckless Railways', 'Fencing Fields', 'Snooty Steppes', 'Pleasant Piazza', 'Ruined Reels', 'Hazy Hillside', 'Grand Glacier', 'Lavish Lair', 'The Wasteland', 'Restored Reels', 'Mount Olympus', 'Brawler’s Battleground', 'Classy Courts', 'Coastal Cradle', 'Nitro Depot', 'Railway Station'],
  c5s4: ['Castle Doom', 'The Raft', 'Doomstadt', 'Reckless Railways', 'Fencing Fields', 'Snooty Steppes', 'Pleasant Piazza', 'Restored Reels', 'Hazy Hillside', 'Grand Glacier', 'Lavish Lair', 'The Underworld', 'Doom’s Courtyard', 'Mount Olympus', 'Brutal Beachhead', 'Nitrodrome', 'Classy Courts', 'Coastal Cradle', 'Latverian Outpost', 'Ruinous Rail'],
  c5s5: ['The Doggpound', 'The Rig', 'Pleasant Park', 'Retail Row', 'Frenzy Fields', 'Loot Lake', 'Lazy Lake', 'Salty Springs', 'Sweaty Sands', 'The Shark', 'The Grotto', 'The Agency', 'Craggy Cliffs', 'Holly Hedges', 'Misty Meadows', 'Dirty Docks', 'Weeping Woods', 'Slurpy Swamp', 'The Yacht', 'The Orchard'],
  c6s1: ['Seaport City', 'Hopeful Heights', 'Flooded Frogs', 'Magic Mosses', 'Demon’s Dojo', 'Nightshift Forest', 'Canyon Crossing', 'Warrior’s Watch', 'Twinkle Terrace', 'Shogun’s Solitude', 'Foxhole Falls', 'Pumpkin Falls', 'Foxy Floodgate', 'Masked Meadows', 'Kappa Kappa Factory', 'The Great Turtle', 'Sandy Steppes', 'Buried Burbs', 'Windmill Woods', 'Demon’s Domain'],
  c6s2: ['Crime City', 'Shiny Shafts', 'Seaport City', 'Magic Mosses', 'Masked Meadows', 'Outlaw Oasis', 'Kappa Kappa Factory', 'Demon’s Dojo', 'Canyon Crossing', 'Hopeful Heights', 'Foxy Floodgate', 'Twinkle Terrace', 'Shogun’s Solitude', 'The Great Turtle', 'Neon Narrows', 'Lawless Lookout', 'Underground Rail', 'Golden Grove', 'Buried Burbs', 'Smuggler’s Run'],
  c6s3: ['Utopia City', 'Supernova Academy', 'Shogun’s Solitude', 'Foxy Floodgate', 'Canyon Crossing', 'Masked Meadows', 'Magic Mosses', 'Seaport City', 'Crime City', 'Shiny Shafts', 'Demon’s Dojo', 'Hopeful Heights', 'Twinkle Terrace', 'The Great Turtle', 'Outlaw Oasis', 'Neon Narrows', 'Hero’s Hangar', 'Academy Annex', 'Foxy Falls', 'Supernova Station'],
  c6s4: ['Utopia City', 'Demon’s Dojo', 'Crime City', 'Shiny Shafts', 'Supernova Academy', 'Foxy Floodgate', 'Canyon Crossing', 'Masked Meadows', 'Magic Mosses', 'Seaport City', 'Hopeful Heights', 'Twinkle Terrace', 'The Great Turtle', 'Outlaw Oasis', 'Neon Narrows', 'Galactic Depot', 'Battle Base', 'Starlight Station', 'Hero’s Hangar', 'Demon’s Gate'],
  c6s5: ['Pleasant Park', 'Tilted Towers', 'Retail Row', 'Dusty Depot', 'Salty Springs', 'Loot Lake', 'Lucky Landing', 'Fatal Fields', 'Wailing Woods', 'Risky Reels', 'Tomato Town', 'Haunted Hills', 'Junk Junction', 'Shifty Shafts', 'Greasy Grove', 'Flush Factory', 'Lonely Lodge', 'Anarchy Acres', 'Moisty Mire', 'Dusty Divot'],
  c7s1: ['Neon Harbor', 'Skyline Springs', 'Crown Canyon', 'Verdant Village', 'Starfall Station', 'Misty Market', 'Copper Coast', 'Summit Square', 'Riverside Row', 'Sunset Silo', 'Cloudbreak Camp', 'Moonlit Marina', 'Eastwatch', 'Westwatch', 'Cinder Creek', 'Wildwood Works', 'Northpoint', 'Southpoint', 'The Foundry', 'Archive Outpost'],
  c7s2: ['Neon Harbor', 'Skyline Springs', 'Crown Canyon', 'Verdant Village', 'Starfall Station', 'Misty Market', 'Copper Coast', 'Summit Square', 'Riverside Row', 'Sunset Silo', 'Cloudbreak Camp', 'Moonlit Marina', 'Eastwatch', 'Westwatch', 'Cinder Creek', 'Wildwood Works', 'Northpoint', 'Southpoint', 'The Foundry', 'Archive Outpost'],
  c7s3: ['Neon Harbor', 'Skyline Springs', 'Crown Canyon', 'Verdant Village', 'Starfall Station', 'Misty Market', 'Copper Coast', 'Summit Square', 'Riverside Row', 'Sunset Silo', 'Cloudbreak Camp', 'Moonlit Marina', 'Eastwatch', 'Westwatch', 'Cinder Creek', 'Wildwood Works', 'Northpoint', 'Southpoint', 'The Foundry', 'Archive Outpost'],
};

function themeForSeason(id: SeasonId): MapTheme {
  if (id === 'c1s2') return THEMES.medieval;
  if (id === 'c1s3' || id === 'c1s4') return THEMES.meteor;
  if (id === 'c1s7') return THEMES.ice;
  if (id === 'c1s8') return THEMES.jungle;
  if (id === 'c1s9') return THEMES.future;
  if (id === 'c1sx') return THEMES.timewarp;
  if (id === 'c2s1' || id === 'c2s2') return THEMES.apollo;
  if (id === 'c2s3') return THEMES.flood;
  if (id === 'c2s4') return THEMES.marvel;
  if (id === 'c2s5') return THEMES.apollo;
  if (id === 'c2s6') return THEMES.primal;
  if (id === 'c2s7') return THEMES.alien;
  if (id === 'c2s8') return THEMES.cube;
  if (id === 'c3s1') return THEMES.flipped;
  if (id === 'c3s2') return THEMES.resistance;
  if (id === 'c3s3') return THEMES.vibin;
  if (id === 'c3s4') return THEMES.chrome;
  if (id === 'c4s1') return THEMES.medieval4;
  if (id === 'c4s2') return THEMES.mega;
  if (id === 'c4s3') return THEMES.wilds;
  if (id === 'c4s4') return THEMES.heist;
  if (id === 'c5s1') return THEMES.mediterranean;
  if (id === 'c5s2') return THEMES.mythic;
  if (id === 'c5s3') return THEMES.wasteland;
  if (id === 'c5s4') return THEMES.doom;
  if (id === 'c5s5') return THEMES.timewarp;
  if (id === 'c6s1') return THEMES.apollo;
  if (id === 'c6s2') return THEMES.heist;
  if (id === 'c6s3') return THEMES.future;
  if (id === 'c6s4') return THEMES.marvel;
  if (id === 'c6s5') return THEMES.og;
  if (id === 'c7s1' || id === 'c7s2' || id === 'c7s3') return THEMES.future;
  return THEMES.og;
}

const PALETTE = ['#ff5368', '#ffb347', '#52d273', '#ff914d', '#a56bff', '#39c6ff', '#ffc14d', '#ff66a8', '#dbad4c', '#54ba62', '#ff795b', '#ff7043', '#9a62db', '#a9a9a9', '#d39449', '#4ac894', '#a7b2c8', '#79b65b', '#f4c85c', '#72ca67'];

function createPois(names: string[]): MapPoi[] {
  return names.map((name, index) => {
    const slot = POI_SLOTS[index % POI_SLOTS.length];
    return {
      name,
      x: slot[0],
      z: slot[1],
      color: PALETTE[index % PALETTE.length],
      size: index < 20 ? 'major' : 'minor',
    };
  });
}

export interface MapPreset {
  id: SeasonId;
  label: string;
  short: string;
  chapter: string;
  era: string;
  theme: MapTheme;
  pois: MapPoi[];
}

export const MAP_PRESETS: MapPreset[] = SEASON_OPTIONS.map((option) => ({
  ...option,
  theme: themeForSeason(option.id),
  pois: createPois(POI_NAMES[option.id]),
}));

export function getMapPreset(id: SeasonId): MapPreset {
  return MAP_PRESETS.find((preset) => preset.id === id) || MAP_PRESETS[MAP_PRESETS.length - 1];
}

/**
 * Convert the release/map strings found in Fortnite replay headers into a map preset.
 * For example, ++Fortnite+Release-12.61 /Game/Athena/Apollo/Maps/Apollo_Terrain
 * is Chapter 2 Season 2 (Apollo / v12.x).
 */
export function detectSeasonIdFromReplayText(value: string): SeasonId | null {
  const text = value.toLowerCase();
  const releaseMatch = text.match(/release[-_ ]?(\d+)(?:\.(\d+))?/i);
  const major = releaseMatch ? Number(releaseMatch[1]) : null;

  if (major !== null) {
    const releaseSeason: Record<number, SeasonId> = {
      1: 'c1s1', 2: 'c1s2', 3: 'c1s3', 4: 'c1s4', 5: 'c1s5',
      6: 'c1s6', 7: 'c1s7', 8: 'c1s8', 9: 'c1s9', 10: 'c1sx',
      11: 'c2s1', 12: 'c2s2', 13: 'c2s3', 14: 'c2s4', 15: 'c2s5',
      16: 'c2s6', 17: 'c2s7', 18: 'c2s8', 19: 'c3s1', 20: 'c3s2',
      21: 'c3s3', 22: 'c3s4', 23: 'c4s1', 24: 'c4s2', 25: 'c4s3',
      26: 'c4s4', 27: 'c5s1', 28: 'c5s2', 29: 'c5s3', 30: 'c5s4', 31: 'c5s4', 32: 'c5s5',
      33: 'c6s1', 34: 'c6s2', 35: 'c6s3', 36: 'c6s4', 37: 'c6s4', 38: 'c6s5',
      39: 'c7s1', 40: 'c7s2', 41: 'c7s3',
    };
    if (releaseSeason[major]) return releaseSeason[major];
  }

  // Map package names are useful when a replay header omits the release number.
  if (text.includes('apollo')) {
    if (text.includes('12.') || text.includes('agency') || text.includes('shark')) return 'c2s2';
    return 'c2s1';
  }
  if (text.includes('artemis')) return 'c3s1';
  if (text.includes('asteria')) return 'c4s1';
  if (text.includes('helio') || text.includes('athena2')) return 'c5s1';
  if (text.includes('athena') && text.includes('release-10')) return 'c1sx';

  return null;
}
