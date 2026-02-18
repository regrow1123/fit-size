import type { BodyMeasurements } from '../types';
import type { FitLevel, FitResult } from './types';

// 불투명 옷 색상 — 몸을 완전히 가림
const FIT_COLORS: Record<FitLevel, string> = {
  good: 'rgb(160, 200, 220)',
  loose: 'rgb(220, 200, 140)',
  tight: 'rgb(220, 160, 155)',
};

const STROKE_COLORS: Record<FitLevel, string> = {
  good: 'rgba(60, 120, 160, 0.8)',
  loose: 'rgba(180, 150, 50, 0.8)',
  tight: 'rgba(200, 80, 70, 0.8)',
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
