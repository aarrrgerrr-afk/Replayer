export type LiveEventId = 
  | 'the_device'
  | 'galactus'
  | 'collision'
  | 'convergence'
  | 'zero_point'
  | 'final_showdown'
  | 'the_end'
  | 'big_bang'
  | 'fracture'
  | 'reckoning';

export interface LiveEventPhase {
  id: string;
  label: string;
  description: string;
  start: number;
  end: number;
  color: string;
  cameraFocus?: { x: number; y: number; z: number };
  specialEffect?: string;
}

export interface LiveEvent {
  id: LiveEventId;
  name: string;
  subtitle: string;
  releaseVersion: string;
  mapName: string;
  mapPath?: string;
  deviceCenter?: { x: number; y: number; z: number };
  duration: number;
  phases: LiveEventPhase[];
  keyMoments: { time: number; label: string; description: string }[];
  backgroundMusic?: string;
  islandChanges?: { time: number; description: string }[];
}

// The Device Event (Chapter 2 Season 2)
export const THE_DEVICE_EVENT: LiveEvent = {
  id: 'the_device' as const,
  name: 'The Device',
  subtitle: 'Doomsday Event • Apollo • Release 12.61',
  releaseVersion: '12.61',
  mapName: 'Apollo',
  mapPath: '/Game/Athena/Apollo/Maps/Apollo_Terrain',
  deviceCenter: { x: -8000, y: 80, z: -20000 },
  duration: 900,
  phases: [
    {
      id: 'briefing',
      label: 'Briefing',
      description: 'Observers gather around the Agency as the final countdown begins. Midas prepares the Doomsday Device.',
      start: 0,
      end: 150,
      color: '#7e8da8',
      cameraFocus: { x: -8000, y: 200, z: -20000 },
    },
    {
      id: 'activation',
      label: 'Activation',
      description: 'Midas starts the Doomsday Device and the Agency core comes online with golden energy.',
      start: 150,
      end: 300,
      color: '#f2bd52',
      cameraFocus: { x: -8000, y: 300, z: -20000 },
      specialEffect: 'golden_glow',
    },
    {
      id: 'arms-rise',
      label: 'Arms Rise',
      description: 'The mechanical arms unfold from the Agency and lock onto the storm wall.',
      start: 300,
      end: 420,
      color: '#ff7b50',
      cameraFocus: { x: -8000, y: 400, z: -20000 },
      specialEffect: 'mechanical_arms',
    },
    {
      id: 'storm-wall',
      label: 'Storm Wall',
      description: 'The storm wall is pushed back as energy beams fire across Apollo. The island trembles.',
      start: 420,
      end: 570,
      color: '#b477ff',
      cameraFocus: { x: -8000, y: 500, z: -20000 },
      specialEffect: 'energy_beams',
    },
    {
      id: 'pulse',
      label: 'Pulse',
      description: 'A massive pulse tears through the island and the sky fractures above the Device. Reality itself breaks.',
      start: 570,
      end: 690,
      color: '#45dcff',
      cameraFocus: { x: -8000, y: 600, z: -20000 },
      specialEffect: 'reality_fracture',
    },
    {
      id: 'aftermath',
      label: 'Aftermath',
      description: 'The Agency remains at the center of a changed storm and a flooded island. The Device is spent.',
      start: 690,
      end: 900,
      color: '#56e0b3',
      cameraFocus: { x: -8000, y: 250, z: -20000 },
      specialEffect: 'flooded_island',
    },
  ],
  keyMoments: [
    { time: 0, label: 'Event Start', description: 'The Device event begins' },
    { time: 150, label: 'Device Activation', description: 'Midas activates the Doomsday Device' },
    { time: 300, label: 'Mechanical Arms Deploy', description: 'Giant arms rise from the Agency' },
    { time: 420, label: 'Storm Wall Impact', description: 'Energy beams hit the storm' },
    { time: 570, label: 'Reality Pulse', description: 'The island-shattering pulse fires' },
    { time: 690, label: 'Sky Fractures', description: 'The sky above the Agency breaks apart' },
    { time: 900, label: 'Event End', description: 'The Device event concludes' },
  ],
  islandChanges: [
    { time: 420, description: 'Storm wall begins receding' },
    { time: 570, description: 'Island terrain cracks and shifts' },
    { time: 690, description: 'Flooding begins around the Agency' },
  ],
};

// Galactus Event (Chapter 2 Season 4)
export const GALACTUS_EVENT: LiveEvent = {
  id: 'galactus' as const,
  name: 'Galactus Arrives',
  subtitle: 'Nexus War Finale • Marvel • Release 14.60',
  releaseVersion: '14.60',
  mapName: 'Marvel',
  mapPath: '/Game/Athena/Marvel/Maps/Marvel_Terrain',
  duration: 600,
  phases: [
    {
      id: 'gathering',
      label: 'Heroes Gather',
      description: 'All Marvel heroes assemble at the Helicarrier as Galactus approaches.',
      start: 0,
      end: 120,
      color: '#1a237e',
      cameraFocus: { x: 0, y: 500, z: 0 },
    },
    {
      id: 'approach',
      label: 'Galactus Approaches',
      description: 'The Devourer of Worlds appears in the sky, casting a massive shadow over the island.',
      start: 120,
      end: 240,
      color: '#7b1fa2',
      cameraFocus: { x: 0, y: 800, z: 25000 },
      specialEffect: 'galactus_shadow',
    },
    {
      id: 'hero_assault',
      label: 'Hero Assault',
      description: 'The heroes launch their attack on Galactus with combined powers.',
      start: 240,
      end: 360,
      color: '#ff5252',
      cameraFocus: { x: 0, y: 1000, z: 20000 },
      specialEffect: 'hero_beams',
    },
    {
      id: 'ultimate_attack',
      label: 'Ultimate Attack',
      description: 'The final assault on Galactus using the power of the Nexus.',
      start: 360,
      end: 480,
      color: '#00bcd4',
      cameraFocus: { x: 0, y: 1200, z: 15000 },
      specialEffect: 'nexus_blast',
    },
    {
      id: 'defeat',
      label: 'Galactus Defeated',
      description: 'Galactus is repelled, saving the island from destruction.',
      start: 480,
      end: 600,
      color: '#4caf50',
      cameraFocus: { x: 0, y: 600, z: 0 },
      specialEffect: 'victory_explosion',
    },
  ],
  keyMoments: [
    { time: 0, label: 'Event Start', description: 'Heroes begin gathering' },
    { time: 120, label: 'Galactus Arrives', description: 'The Devourer of Worlds appears' },
    { time: 240, label: 'Battle Begins', description: 'Heroes launch their attack' },
    { time: 360, label: 'Nexus Power', description: 'Combined hero powers activate' },
    { time: 480, label: 'Galactus Defeated', description: 'The island is saved' },
    { time: 600, label: 'Event End', description: 'Galactus event concludes' },
  ],
  islandChanges: [
    { time: 120, description: 'Sky darkens as Galactus approaches' },
    { time: 240, description: 'Massive shadow covers the island' },
    { time: 360, description: 'Energy beams light up the sky' },
    { time: 480, description: 'Galactus retreats, normal lighting returns' },
  ],
};

// Collision Event (Chapter 2 Season 5)
export const COLLISION_EVENT: LiveEvent = {
  id: 'collision' as const,
  name: 'Collision',
  subtitle: 'Zero Point Crisis • Release 15.50',
  releaseVersion: '15.50',
  mapName: 'Zero Point',
  mapPath: '/Game/Athena/ZeroPoint/Maps/ZeroPoint_Terrain',
  duration: 480,
  phases: [
    {
      id: 'agent_meeting',
      label: 'Agent Meeting',
      description: 'Agents Jones and Slate discuss the reality crisis at the Zero Point.',
      start: 0,
      end: 60,
      color: '#263238',
      cameraFocus: { x: 0, y: 100, z: 0 },
    },
    {
      id: 'reality_break',
      label: 'Reality Break',
      description: 'Cracks appear in reality as the Zero Point becomes unstable.',
      start: 60,
      end: 180,
      color: '#7c4dff',
      cameraFocus: { x: 0, y: 200, z: 0 },
      specialEffect: 'reality_cracks',
    },
    {
      id: 'island_fracture',
      label: 'Island Fracture',
      description: 'The island begins to break apart as reality collapses.',
      start: 180,
      end: 300,
      color: '#ff4081',
      cameraFocus: { x: 0, y: 300, z: 0 },
      specialEffect: 'island_breaking',
    },
    {
      id: 'the_collider',
      label: 'The Collider',
      description: 'A massive structure appears, attempting to stabilize the Zero Point.',
      start: 300,
      end: 420,
      color: '#2196f3',
      cameraFocus: { x: 0, y: 400, z: 0 },
      specialEffect: 'collider_activation',
    },
    {
      id: 'stabilization',
      label: 'Stabilization',
      description: 'The island is saved as the Collider stabilizes reality.',
      start: 420,
      end: 480,
      color: '#8bc34a',
      cameraFocus: { x: 0, y: 250, z: 0 },
      specialEffect: 'reality_restore',
    },
  ],
  keyMoments: [
    { time: 0, label: 'Event Start', description: 'Agents meet at Zero Point' },
    { time: 60, label: 'Reality Breaks', description: 'Cracks appear in the sky' },
    { time: 180, label: 'Island Fractures', description: 'The island begins to break apart' },
    { time: 300, label: 'Collider Appears', description: 'Massive structure arrives' },
    { time: 420, label: 'Reality Restored', description: 'The island is saved' },
    { time: 480, label: 'Event End', description: 'Collision event concludes' },
  ],
  islandChanges: [
    { time: 60, description: 'Reality cracks appear in the sky' },
    { time: 180, description: 'Island terrain begins to float away' },
    { time: 300, description: 'The Collider structure materializes' },
    { time: 420, description: 'Fractured pieces return to the island' },
  ],
};

// Convergence Event (Chapter 2 Season 6)
export const CONVERGENCE_EVENT: LiveEvent = {
  id: 'convergence' as const,
  name: 'The Convergence',
  subtitle: 'Primal Final Showdown • Release 16.50',
  releaseVersion: '16.50',
  mapName: 'Primal',
  mapPath: '/Game/Athena/Primal/Maps/Primal_Terrain',
  duration: 540,
  phases: [
    {
      id: 'spire_approach',
      label: 'Spire Approach',
      description: 'The Spire rises from the center of the island as the final battle approaches.',
      start: 0,
      end: 120,
      color: '#5d4037',
      cameraFocus: { x: 0, y: 200, z: 0 },
    },
    {
      id: 'beast_summon',
      label: 'Beast Summon',
      description: 'The Spire summons ancient beasts to fight the players.',
      start: 120,
      end: 240,
      color: '#8d6e63',
      cameraFocus: { x: 0, y: 300, z: 0 },
      specialEffect: 'beast_spawn',
    },
    {
      id: 'player_assault',
      label: 'Player Assault',
      description: 'Players battle against the summoned beasts in a massive showdown.',
      start: 240,
      end: 360,
      color: '#d50000',
      cameraFocus: { x: 0, y: 400, z: 0 },
      specialEffect: 'battle_chaos',
    },
    {
      id: 'spire_collapse',
      label: 'Spire Collapse',
      description: 'The Spire begins to collapse as the battle reaches its climax.',
      start: 360,
      end: 480,
      color: '#ff9800',
      cameraFocus: { x: 0, y: 500, z: 0 },
      specialEffect: 'spire_falling',
    },
    {
      id: 'victory',
      label: 'Victory',
      description: 'The Spire is destroyed and the island returns to normal.',
      start: 480,
      end: 540,
      color: '#4caf50',
      cameraFocus: { x: 0, y: 250, z: 0 },
      specialEffect: 'victory_fireworks',
    },
  ],
  keyMoments: [
    { time: 0, label: 'Event Start', description: 'The Spire begins to rise' },
    { time: 120, label: 'Beasts Summoned', description: 'Ancient creatures appear' },
    { time: 240, label: 'Battle Begins', description: 'Players vs Beasts' },
    { time: 360, label: 'Spire Collapses', description: 'The structure begins to fall' },
    { time: 480, label: 'Victory', description: 'The island is saved' },
    { time: 540, label: 'Event End', description: 'Convergence event concludes' },
  ],
  islandChanges: [
    { time: 0, description: 'The Spire emerges from the ground' },
    { time: 120, description: 'Beasts spawn around the island' },
    { time: 360, description: 'Spire starts to crumble' },
    { time: 480, description: 'Spire completely destroyed' },
  ],
};

// Zero Point Event (Chapter 2 Season 5)
export const ZERO_POINT_EVENT: LiveEvent = {
  id: 'zero_point' as const,
  name: 'Zero Point',
  subtitle: 'Agent Jones Mission • Release 15.40',
  releaseVersion: '15.40',
  mapName: 'Zero Point',
  mapPath: '/Game/Athena/ZeroPoint/Maps/ZeroPoint_Terrain',
  duration: 660,
  phases: [
    {
      id: 'agent_briefing',
      label: 'Agent Briefing',
      description: 'Agent Jones receives his mission from The Foundation.',
      start: 0,
      end: 120,
      color: '#1a237e',
      cameraFocus: { x: 0, y: 100, z: 0 },
    },
    {
      id: 'reality_jump',
      label: 'Reality Jump',
      description: 'Jones jumps through reality portals to different dimensions.',
      start: 120,
      end: 240,
      color: '#7c4dff',
      cameraFocus: { x: 0, y: 200, z: 0 },
      specialEffect: 'reality_portals',
    },
    {
      id: 'boss_battle',
      label: 'Boss Battle',
      description: 'Jones battles against powerful bosses in each reality.',
      start: 240,
      end: 480,
      color: '#ff4081',
      cameraFocus: { x: 0, y: 300, z: 0 },
      specialEffect: 'boss_fight',
    },
    {
      id: 'final_showdown',
      label: 'Final Showdown',
      description: 'The ultimate battle against the final boss at the Zero Point.',
      start: 480,
      end: 600,
      color: '#ff9800',
      cameraFocus: { x: 0, y: 400, z: 0 },
      specialEffect: 'final_battle',
    },
    {
      id: 'reality_restored',
      label: 'Reality Restored',
      description: 'Agent Jones restores reality and returns to the island.',
      start: 600,
      end: 660,
      color: '#4caf50',
      cameraFocus: { x: 0, y: 250, z: 0 },
      specialEffect: 'reality_restore',
    },
  ],
  keyMoments: [
    { time: 0, label: 'Event Start', description: 'Jones receives mission' },
    { time: 120, label: 'Reality Jump', description: 'Jones travels through portals' },
    { time: 240, label: 'Boss Battles', description: 'Fighting powerful enemies' },
    { time: 480, label: 'Final Showdown', description: 'Ultimate battle begins' },
    { time: 600, label: 'Reality Restored', description: 'Normal reality returns' },
    { time: 660, label: 'Event End', description: 'Zero Point event concludes' },
  ],
  islandChanges: [
    { time: 120, description: 'Reality portals open across the island' },
    { time: 240, description: 'Different reality versions of POIs appear' },
    { time: 480, description: 'Final boss arena forms at Zero Point' },
    { time: 600, description: 'Island returns to normal state' },
  ],
};

// Final Showdown Event (Chapter 2 Season 7)
export const FINAL_SHOWDOWN_EVENT: LiveEvent = {
  id: 'final_showdown' as const,
  name: 'Final Showdown',
  subtitle: 'Invasion Finale • Release 17.60',
  releaseVersion: '17.60',
  mapName: 'Invasion',
  mapPath: '/Game/Athena/Invasion/Maps/Invasion_Terrain',
  duration: 720,
  phases: [
    {
      id: 'mothership_approach',
      label: 'Mothership Approach',
      description: 'The alien Mothership arrives above the island, deploying saucers.',
      start: 0,
      end: 180,
      color: '#0d47a1',
      cameraFocus: { x: 0, y: 1000, z: 30000 },
      specialEffect: 'mothership_arrival',
    },
    {
      id: 'saucer_attack',
      label: 'Saucer Attack',
      description: 'Alien saucers attack key locations across the island.',
      start: 180,
      end: 300,
      color: '#1565c0',
      cameraFocus: { x: 0, y: 800, z: 20000 },
      specialEffect: 'saucer_beams',
    },
    {
      id: 'ground_assault',
      label: 'Ground Assault',
      description: 'Alien troops deploy to the surface, engaging players in battle.',
      start: 300,
      end: 480,
      color: '#1976d2',
      cameraFocus: { x: 0, y: 300, z: 0 },
      specialEffect: 'alien_invasion',
    },
    {
      id: 'mothership_weakened',
      label: 'Mothership Weakened',
      description: 'Players damage the Mothership, causing it to become unstable.',
      start: 480,
      end: 600,
      color: '#1e88e5',
      cameraFocus: { x: 0, y: 1200, z: 30000 },
      specialEffect: 'mothership_damage',
    },
    {
      id: 'mothership_crash',
      label: 'Mothership Crash',
      description: 'The Mothership crashes into the island, creating massive destruction.',
      start: 600,
      end: 720,
      color: '#90caf9',
      cameraFocus: { x: 0, y: 400, z: 15000 },
      specialEffect: 'mothership_crash',
    },
  ],
  keyMoments: [
    { time: 0, label: 'Event Start', description: 'Mothership arrives' },
    { time: 180, label: 'Saucer Attack', description: 'Alien saucers deploy' },
    { time: 300, label: 'Ground Assault', description: 'Aliens invade the surface' },
    { time: 480, label: 'Mothership Weakened', description: 'Players damage the ship' },
    { time: 600, label: 'Mothership Crashes', description: 'Ship crashes into the island' },
    { time: 720, label: 'Event End', description: 'Final Showdown event concludes' },
  ],
  islandChanges: [
    { time: 0, description: 'Mothership appears in the sky' },
    { time: 180, description: 'Saucer beams strike the island' },
    { time: 300, description: 'Alien troops and structures appear' },
    { time: 480, description: 'Mothership shows damage and fires' },
    { time: 600, description: 'Massive crash creates new landscape features' },
  ],
};

// The End Event (Chapter 2 Finale)
export const THE_END_EVENT: LiveEvent = {
  id: 'the_end' as const,
  name: 'The End',
  subtitle: 'Chapter 2 Finale • Release 18.00',
  releaseVersion: '18.00',
  mapName: 'Cubed',
  mapPath: '/Game/Athena/Cubed/Maps/Cubed_Terrain',
  duration: 840,
  phases: [
    {
      id: 'cube_formation',
      label: 'Cube Formation',
      description: 'The Cube begins to form at the center of the island, growing rapidly.',
      start: 0,
      end: 120,
      color: '#424242',
      cameraFocus: { x: 0, y: 200, z: 0 },
      specialEffect: 'cube_growth',
    },
    {
      id: 'cube_expansion',
      label: 'Cube Expansion',
      description: 'The Cube expands, consuming the island and transforming the landscape.',
      start: 120,
      end: 240,
      color: '#616161',
      cameraFocus: { x: 0, y: 300, z: 0 },
      specialEffect: 'cube_spread',
    },
    {
      id: 'reality_collapse',
      label: 'Reality Collapse',
      description: 'Reality begins to collapse as the Cube takes over everything.',
      start: 240,
      end: 420,
      color: '#757575',
      cameraFocus: { x: 0, y: 500, z: 0 },
      specialEffect: 'reality_collapse',
    },
    {
      id: 'final_resistance',
      label: 'Final Resistance',
      description: 'The last stand against the Cube as the island is consumed.',
      start: 420,
      end: 600,
      color: '#9e9e9e',
      cameraFocus: { x: 0, y: 400, z: 0 },
      specialEffect: 'final_stand',
    },
    {
      id: 'new_beginning',
      label: 'New Beginning',
      description: 'The Cube explodes, revealing a new island and the start of Chapter 3.',
      start: 600,
      end: 840,
      color: '#bdbdbd',
      cameraFocus: { x: 0, y: 600, z: 0 },
      specialEffect: 'new_island',
    },
  ],
  keyMoments: [
    { time: 0, label: 'Event Start', description: 'Cube begins to form' },
    { time: 120, label: 'Cube Expands', description: 'Cube grows and spreads' },
    { time: 240, label: 'Reality Collapses', description: 'The world begins to end' },
    { time: 420, label: 'Final Resistance', description: 'Last stand against the Cube' },
    { time: 600, label: 'New Beginning', description: 'Chapter 3 island appears' },
    { time: 840, label: 'Event End', description: 'The End event concludes' },
  ],
  islandChanges: [
    { time: 0, description: 'Cube forms at island center' },
    { time: 120, description: 'Cube begins consuming the island' },
    { time: 240, description: 'Reality distorts across the entire map' },
    { time: 420, description: 'Most of the island is consumed by the Cube' },
    { time: 600, description: 'Cube explodes, revealing new island' },
  ],
};

// Big Bang Event (Chapter 3 Season 1)
export const BIG_BANG_EVENT: LiveEvent = {
  id: 'big_bang' as const,
  name: 'Big Bang',
  subtitle: 'Chapter 3 Launch • Release 19.00',
  releaseVersion: '19.00',
  mapName: 'Flipped',
  mapPath: '/Game/Athena/Flipped/Maps/Flipped_Terrain',
  duration: 600,
  phases: [
    {
      id: 'foundation_arrival',
      label: 'Foundation Arrival',
      description: 'The Foundation arrives and begins the process of creating a new reality.',
      start: 0,
      end: 120,
      color: '#8d6e63',
      cameraFocus: { x: 0, y: 200, z: 0 },
    },
    {
      id: 'reality_construction',
      label: 'Reality Construction',
      description: 'The Foundation constructs a new reality, forming the Chapter 3 island.',
      start: 120,
      end: 300,
      color: '#bcaaa4',
      cameraFocus: { x: 0, y: 400, z: 0 },
      specialEffect: 'reality_construction',
    },
    {
      id: 'island_formation',
      label: 'Island Formation',
      description: 'The new island takes shape with familiar and new locations.',
      start: 300,
      end: 420,
      color: '#d7ccc8',
      cameraFocus: { x: 0, y: 500, z: 0 },
      specialEffect: 'island_formation',
    },
    {
      id: 'final_touches',
      label: 'Final Touches',
      description: 'The Foundation adds the final details to the new reality.',
      start: 420,
      end: 600,
      color: '#efebe9',
      cameraFocus: { x: 0, y: 300, z: 0 },
      specialEffect: 'final_details',
    },
  ],
  keyMoments: [
    { time: 0, label: 'Event Start', description: 'Foundation arrives' },
    { time: 120, label: 'Reality Construction', description: 'New reality begins forming' },
    { time: 300, label: 'Island Formation', description: 'New island takes shape' },
    { time: 420, label: 'Final Touches', description: 'Details are added to the island' },
    { time: 600, label: 'Event End', description: 'Big Bang event concludes, Chapter 3 begins' },
  ],
  islandChanges: [
    { time: 0, description: 'Foundation appears at the center' },
    { time: 120, description: 'Reality begins to form around the island' },
    { time: 300, description: 'New island terrain and POIs appear' },
    { time: 420, description: 'Final details and landscape features added' },
  ],
};

// Fracture Event (Chapter 3 Season 2)
export const FRACTURE_EVENT: LiveEvent = {
  id: 'fracture' as const,
  name: 'Fracture',
  subtitle: 'Resistance Finale • Release 20.40',
  releaseVersion: '20.40',
  mapName: 'Resistance',
  mapPath: '/Game/Athena/Resistance/Maps/Resistance_Terrain',
  duration: 540,
  phases: [
    {
      id: 'io_invasion',
      label: 'IO Invasion',
      description: 'The IO forces launch a massive invasion of the island.',
      start: 0,
      end: 120,
      color: '#b71c1c',
      cameraFocus: { x: 0, y: 300, z: 0 },
      specialEffect: 'io_forces',
    },
    {
      id: 'resistance_fight',
      label: 'Resistance Fight',
      description: 'The Resistance fights back against the IO invasion.',
      start: 120,
      end: 240,
      color: '#0d47a1',
      cameraFocus: { x: 0, y: 400, z: 0 },
      specialEffect: 'resistance_battle',
    },
    {
      id: 'collider_activation',
      label: 'Collider Activation',
      description: 'The Collider is activated to counter the IO threat.',
      start: 240,
      end: 360,
      color: '#1565c0',
      cameraFocus: { x: 0, y: 500, z: 0 },
      specialEffect: 'collider_power',
    },
    {
      id: 'reality_bridge',
      label: 'Reality Bridge',
      description: 'A bridge to another reality opens, revealing the Chapter 3 Season 3 island.',
      start: 360,
      end: 480,
      color: '#1976d2',
      cameraFocus: { x: 0, y: 600, z: 0 },
      specialEffect: 'reality_bridge',
    },
    {
      id: 'new_world',
      label: 'New World',
      description: 'The event concludes with the transition to a new reality.',
      start: 480,
      end: 540,
      color: '#1e88e5',
      cameraFocus: { x: 0, y: 300, z: 0 },
      specialEffect: 'new_reality',
    },
  ],
  keyMoments: [
    { time: 0, label: 'Event Start', description: 'IO invasion begins' },
    { time: 120, label: 'Resistance Fights', description: 'Counter-attack launched' },
    { time: 240, label: 'Collider Activated', description: 'Massive weapon powers up' },
    { time: 360, label: 'Reality Bridge', description: 'Portal to new reality opens' },
    { time: 480, label: 'New World', description: 'Transition to new season' },
    { time: 540, label: 'Event End', description: 'Fracture event concludes' },
  ],
  islandChanges: [
    { time: 0, description: 'IO forces appear across the island' },
    { time: 120, description: 'Battle damage appears on the landscape' },
    { time: 240, description: 'Collider structure forms at the center' },
    { time: 360, description: 'Reality bridge opens in the sky' },
    { time: 480, description: 'New island begins to form' },
  ],
};

// Reckoning Event (Chapter 3 Season 3)
export const RECKONING_EVENT: LiveEvent = {
  id: 'reckoning' as const,
  name: 'The Reckoning',
  subtitle: 'Vibin Finale • Release 21.40',
  releaseVersion: '21.40',
  mapName: 'Vibin',
  mapPath: '/Game/Athena/Vibin/Maps/Vibin_Terrain',
  duration: 660,
  phases: [
    {
      id: 'herald_awakens',
      label: 'Herald Awakens',
      description: 'The Herald awakens and begins her plan to remake reality.',
      start: 0,
      end: 120,
      color: '#7b1fa2',
      cameraFocus: { x: 0, y: 200, z: 0 },
    },
    {
      id: 'reality_remix',
      label: 'Reality Remix',
      description: 'The Herald remixes reality, changing the island landscape.',
      start: 120,
      end: 240,
      color: '#9c27b0',
      cameraFocus: { x: 0, y: 300, z: 0 },
      specialEffect: 'reality_remix',
    },
    {
      id: 'player_challenge',
      label: 'Player Challenge',
      description: 'Players must overcome the Herald\'s challenges to save reality.',
      start: 240,
      end: 420,
      color: '#e040fb',
      cameraFocus: { x: 0, y: 400, z: 0 },
      specialEffect: 'herald_challenges',
    },
    {
      id: 'final_confrontation',
      label: 'Final Confrontation',
      description: 'The ultimate battle against the Herald to restore reality.',
      start: 420,
      end: 540,
      color: '#ff4081',
      cameraFocus: { x: 0, y: 500, z: 0 },
      specialEffect: 'final_battle',
    },
    {
      id: 'reality_restored',
      label: 'Reality Restored',
      description: 'Reality is restored and the island returns to its true form.',
      start: 540,
      end: 660,
      color: '#4caf50',
      cameraFocus: { x: 0, y: 300, z: 0 },
      specialEffect: 'reality_restore',
    },
  ],
  keyMoments: [
    { time: 0, label: 'Event Start', description: 'Herald awakens' },
    { time: 120, label: 'Reality Remix', description: 'Island landscape changes' },
    { time: 240, label: 'Player Challenge', description: 'Herald tests the players' },
    { time: 420, label: 'Final Confrontation', description: 'Ultimate battle begins' },
    { time: 540, label: 'Reality Restored', description: 'Normal reality returns' },
    { time: 660, label: 'Event End', description: 'Reckoning event concludes' },
  ],
  islandChanges: [
    { time: 0, description: 'Herald appears at the center of the island' },
    { time: 120, description: 'Reality begins to remix, POIs change appearance' },
    { time: 240, description: 'Herald creates challenges across the island' },
    { time: 420, description: 'Final battle arena forms' },
    { time: 540, description: 'Island returns to its true form' },
  ],
};

// Event registry
export const LIVE_EVENTS: Record<LiveEventId, LiveEvent> = {
  the_device: THE_DEVICE_EVENT,
  galactus: GALACTUS_EVENT,
  collision: COLLISION_EVENT,
  convergence: CONVERGENCE_EVENT,
  zero_point: ZERO_POINT_EVENT,
  final_showdown: FINAL_SHOWDOWN_EVENT,
  the_end: THE_END_EVENT,
  big_bang: BIG_BANG_EVENT,
  fracture: FRACTURE_EVENT,
  reckoning: RECKONING_EVENT,
};

// Detection function
export function detectLiveEventFromReplayText(value: string): LiveEventId | null {
  const text = value.toLowerCase();
  
  if (text.includes('the_device') || text.includes('the device') || text.includes('doomsday') || text.includes('midas')) {
    return 'the_device';
  }
  if (text.includes('galactus') || text.includes('devourer') || text.includes('marvel')) {
    return 'galactus';
  }
  if (text.includes('collision') || text.includes('zero point crisis') || text.includes('spire')) {
    return 'collision';
  }
  if (text.includes('convergence') || text.includes('primal') || text.includes('final showdown')) {
    return 'convergence';
  }
  if (text.includes('zero_point') || text.includes('agent jones') || text.includes('foundation')) {
    return 'zero_point';
  }
  if (text.includes('final_showdown') || text.includes('invasion') || text.includes('mothership')) {
    return 'final_showdown';
  }
  if (text.includes('the_end') || text.includes('chapter 2 finale') || text.includes('cube')) {
    return 'the_end';
  }
  if (text.includes('big_bang') || text.includes('chapter 3 launch') || text.includes('flipped')) {
    return 'big_bang';
  }
  if (text.includes('fracture') || text.includes('resistance') || text.includes('io')) {
    return 'fracture';
  }
  if (text.includes('reckoning') || text.includes('herald') || text.includes('vibin')) {
    return 'reckoning';
  }
  
  return null;
}

export function getEventById(id: LiveEventId): LiveEvent | null {
  return LIVE_EVENTS[id] || null;
}

export function getDeviceEventPhase(time: number, eventId?: LiveEventId): LiveEventPhase {
  const event = eventId ? getEventById(eventId) : THE_DEVICE_EVENT;
  if (!event) return THE_DEVICE_EVENT.phases[0];
  
  const phase = event.phases.find((candidate) => time < candidate.end);
  return phase || event.phases[event.phases.length - 1];
}

export function getDeviceEventProgress(time: number, eventId?: LiveEventId): number {
  const event = eventId ? getEventById(eventId) : THE_DEVICE_EVENT;
  if (!event) return 0;
  
  return Math.max(0, Math.min(1, time / event.duration));
}
