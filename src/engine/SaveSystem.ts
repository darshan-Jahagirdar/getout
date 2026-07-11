import type { QualityTier } from './Quality';

export type SaveSlot = 1 | 2 | 3 | 'autosave';

export interface SaveData {
  version: 1;
  slot: SaveSlot;
  act: 0;
  missionTime: number;
  completed: boolean;
  quality: QualityTier;
  savedAt: string;
}

const STORAGE_PREFIX = 'getout.save.v1.';

export class SaveSystem {
  public save(
    slot: SaveSlot,
    missionTime: number,
    completed: boolean,
    quality: QualityTier,
  ): SaveData {
    const data: SaveData = {
      version: 1,
      slot,
      act: 0,
      missionTime,
      completed,
      quality,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${STORAGE_PREFIX}${slot}`, JSON.stringify(data));
    return data;
  }

  public load(slot: SaveSlot): SaveData | null {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${slot}`);
    if (raw === null) return null;
    try {
      const candidate = JSON.parse(raw) as Partial<SaveData>;
      if (candidate.version !== 1 || candidate.act !== 0 || typeof candidate.missionTime !== 'number') {
        return null;
      }
      return candidate as SaveData;
    } catch {
      return null;
    }
  }

  public clear(slot: SaveSlot): void {
    localStorage.removeItem(`${STORAGE_PREFIX}${slot}`);
  }
}
