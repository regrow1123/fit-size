import type { BodyMeasurements } from '../types';
import type { FitLevel, FitResult } from './types';

// 기본 실루엣 색상
export const SILHOUETTE_FILL = 'rgb(200, 210, 220)';
export const SILHOUETTE_STROKE = 'rgba(80, 100, 120, 0.6)';

// Overlay 색상 (반투명)
const FIT_OVERLAY_COLORS: Record<FitLevel, string> = {
  good: 'rgba(76, 175, 80, 0.35)',
  loose: 'rgba(255, 193, 7, 0.35)',
  tight: 'rgba(244, 67, 54, 0.35)',
};

function classify(ease: number, min: number, max: number): FitLevel {
  if (ease < min) return 'tight';
  if (ease > max) return 'loose';
  return 'good';
}

export function analyzeFit(
  clothingCm: Map<string, number>,
  body: BodyMeasurements,
): FitResult {
  const regions: FitResult['regions'] = {};

  const clShoulder = clothingCm.get('shoulderWidth');
  if (clShoulder && body.shoulderWidth) {
    const ease = clShoulder - body.shoulderWidth;
    regions['shoulder'] = { ease, level: classify(ease, 1, 3) };
  }

  const clChest = clothingCm.get('chestWidth');
  if (clChest && body.chestCirc) {
    const ease = clChest - body.chestCirc / 2;
    regions['chest'] = { ease, level: classify(ease, 2, 4) };
  }

  regions['sleeve'] = { ease: 0, level: 'good' };

  const levels = Object.values(regions).map(r => r.level);
  let overall: FitLevel = 'good';
  if (levels.includes('tight')) overall = 'tight';
  else if (levels.includes('loose')) overall = 'loose';

  return { overall, regions };
}

export function getFitColor(level: FitLevel): string {
  return FIT_OVERLAY_COLORS[level];
}
