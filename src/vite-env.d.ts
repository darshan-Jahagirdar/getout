/// <reference types="vite/client" />

import type { Act0Snapshot } from './game/act0/Act0Director';

interface GetoutQaApi {
  completeChecklist(): void;
  setMissionTime(seconds: number): void;
  triggerStageSeparation(): void;
  alignDocking(): void;
  snapshot(): Act0Snapshot & { fps: number; backend: string; quality: string };
}

declare global {
  interface Window {
    __GETOUT_QA__?: GetoutQaApi;
  }
}

export {};
