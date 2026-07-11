import type { ZoneManifest } from '../engine/AssetLoader';

export interface ChecklistItem {
  id: string;
  code: string;
  label: string;
  confirmation: string;
}

export const ACT0_CHECKLIST: readonly ChecklistItem[] = [
  { id: 'battery', code: 'BAT', label: 'Battery buses A / B', confirmation: 'BUS VOLTAGE 28.6' },
  { id: 'flight', code: 'FC', label: 'Flight computers 1 / 2', confirmation: 'GUIDANCE SYNC' },
  { id: 'rcs', code: 'RCS', label: 'RCS heaters', confirmation: 'QUADS NOMINAL' },
  { id: 'cabin', code: 'ECLSS', label: 'Cabin pressure seal', confirmation: '14.7 PSI' },
  { id: 'abort', code: 'ABRT', label: 'Launch escape system', confirmation: 'ARMED' },
  { id: 'comms', code: 'S-BAND', label: 'DHRUVA comms link', confirmation: 'CARRIER LOCK' },
];

export const ACT0_MANIFEST: ZoneManifest = {
  zone: 'capsule',
  assets: [],
};

export const ACT0_TIMING = {
  preflightStart: -120,
  checklistHold: -10,
  liftoff: 0,
  maxQ: 70,
  extraBreath: 112,
  stageSeparation: 150,
  fairingJettison: 180,
  wrongReflection: 204,
  meco: 240,
  orbitBurn: 270,
  dockingStart: 285,
  dockingComplete: 300,
} as const;
