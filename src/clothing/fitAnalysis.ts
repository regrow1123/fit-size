import type { BodyMeasurements } from '../types';
import type { FitLevel, FitResult } from './types';

const FIT_COLORS: Record<FitLevel, string> = {
  good: 'rgba(76, 175, 80, 0.3)',
  loose: 'rgba(255, 193, 7, 0.3)',
  tight: 'rgba(244, 67, 54, 0.3)',
};

const STROKE_COLORS: Record<FitLevel, string> = {
  good: 'rgba(76, 175, 80, 0.75)',
  loose: 'rgba(255, 193, 7, 0.75)',
  tight: 'rgba(244, 67, 54, 0.75)',
};

function classify(ease: number, min: number, max: number): FitLevel {
  if (ease < min) return 'tight';
  if (ease > max) return 'loose';
  return 'good';
}

/**
 * Analyze fit using original cm measurements.
 * @param clothingCm - clothing measurements map (cm), keys like 'shoulderWidth', 'chestWidth', 'hemCirc'
 * @param body - body measurements (cm)
 */
export function analyzeFit(
  clothingCm: Map<string, number>,
  body: BodyMeasurements,
): FitResult {
  const regions: FitResult['regions'] = {};

  // Shoulder: clothing shoulderWidth vs body shoulderWidth, ideal ease 1~3cm
  const clShoulder = clothingCm.get('shoulderWidth');
  if (clShoulder && body.shoulderWidth) {
    const ease = clShoulder - body.shoulderWidth;
    regions['shoulder'] = { ease, level: classify(ease, 1, 3) };
  }

  // Chest: clothing chestWidth (flat, pit-to-pit) vs body chestCirc/2
  // ideal ease 2~4cm (half-body comparison)
  const clChest = clothingCm.get('chestWidth');
  if (clChest && body.chestCirc) {
    const ease = clChest - body.chestCirc / 2;
    regions['chest'] = { ease, level: classify(ease, 2, 4) };
  }

  // Sleeve - no direct body comparison available
  regions['sleeve'] = { ease: 0, level: 'good' };

  // Overall
  const levels = Object.values(regions).map(r => r.level);
  let overall: FitLevel = 'good';
  if (levels.includes('tight')) overall = 'tight';
  else if (levels.includes('loose')) overall = 'loose';

  return { overall, regions };
}

export function getFitColor(level: FitLevel): string {
  return FIT_COLORS[level];
}

export function getFitStrokeColor(level: FitLevel): string {
  return STROKE_COLORS[level];
}
