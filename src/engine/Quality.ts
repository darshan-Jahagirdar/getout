export type QualityTier = 'low' | 'medium' | 'high' | 'cinema';

export interface QualityProfile {
  tier: QualityTier;
  label: string;
  pixelRatioCap: number;
  antialias: boolean;
  shadows: boolean;
  bloomStrength: number;
  bloomScale: number;
  starCount: number;
}

export const QUALITY_PROFILES: Readonly<Record<QualityTier, QualityProfile>> = {
  low: {
    tier: 'low',
    label: 'LOW',
    pixelRatioCap: 1,
    antialias: false,
    shadows: false,
    bloomStrength: 0.12,
    bloomScale: 0.3,
    starCount: 900,
  },
  medium: {
    tier: 'medium',
    label: 'MED',
    pixelRatioCap: 1.35,
    antialias: true,
    shadows: true,
    bloomStrength: 0.2,
    bloomScale: 0.4,
    starCount: 1_600,
  },
  high: {
    tier: 'high',
    label: 'HIGH',
    pixelRatioCap: 1.75,
    antialias: true,
    shadows: true,
    bloomStrength: 0.28,
    bloomScale: 0.5,
    starCount: 2_600,
  },
  cinema: {
    tier: 'cinema',
    label: 'CINEMA',
    pixelRatioCap: 2,
    antialias: true,
    shadows: true,
    bloomStrength: 0.38,
    bloomScale: 0.65,
    starCount: 4_000,
  },
};

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

export function detectQualityTier(): QualityTier {
  const memory = (navigator as NavigatorWithMemory).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency || 4;
  const compactViewport = Math.min(window.innerWidth, window.innerHeight) < 700;
  if (compactViewport || memory <= 4 || cores <= 4) return 'medium';
  return memory >= 8 && cores >= 8 ? 'high' : 'medium';
}
