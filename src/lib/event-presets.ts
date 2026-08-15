export type LiveEventId = 'the_device';

export interface LiveEventPhase {
  id: string;
  label: string;
  description: string;
  start: number;
  end: number;
  color: string;
}

export const THE_DEVICE_EVENT = {
  id: 'the_device' as const,
  name: 'The Device',
  subtitle: 'Doomsday Event · Apollo · Release 12.61',
  releaseVersion: '12.61',
  mapName: 'Apollo',
  deviceCenter: { x: -8000, y: 80, z: -20000 },
  duration: 900,
  phases: [
    {
      id: 'briefing',
      label: 'Briefing',
      description: 'Observers gather around the Agency as the final countdown begins.',
      start: 0,
      end: 150,
      color: '#7e8da8',
    },
    {
      id: 'activation',
      label: 'Activation',
      description: 'Midas starts the Doomsday Device and the Agency core comes online.',
      start: 150,
      end: 300,
      color: '#f2bd52',
    },
    {
      id: 'arms-rise',
      label: 'Arms Rise',
      description: 'The mechanical arms unfold from the Agency and lock onto the storm.',
      start: 300,
      end: 420,
      color: '#ff7b50',
    },
    {
      id: 'storm-wall',
      label: 'Storm Wall',
      description: 'The storm wall is pushed back as energy beams fire across Apollo.',
      start: 420,
      end: 570,
      color: '#b477ff',
    },
    {
      id: 'pulse',
      label: 'Pulse',
      description: 'A massive pulse tears through the island and the sky fractures above the Device.',
      start: 570,
      end: 690,
      color: '#45dcff',
    },
    {
      id: 'aftermath',
      label: 'Aftermath',
      description: 'The Agency remains at the center of a changed storm and a flooded island.',
      start: 690,
      end: 900,
      color: '#56e0b3',
    },
  ] as LiveEventPhase[],
};

export function detectLiveEventFromReplayText(value: string): LiveEventId | null {
  const text = value.toLowerCase();
  if (
    text.includes('the_device') ||
    text.includes('the device') ||
    text.includes('doomsday') ||
    text.includes('midas')
  ) {
    return 'the_device';
  }
  return null;
}

export function getDeviceEventPhase(time: number): LiveEventPhase {
  const phase = THE_DEVICE_EVENT.phases.find((candidate) => time < candidate.end);
  return phase || THE_DEVICE_EVENT.phases[THE_DEVICE_EVENT.phases.length - 1];
}

export function getDeviceEventProgress(time: number): number {
  return Math.max(0, Math.min(1, time / THE_DEVICE_EVENT.duration));
}
