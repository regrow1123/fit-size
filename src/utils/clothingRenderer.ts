import type { ClothingCategory, ClothingDimensions, PointMeasurement } from '../types';
import { cmToPx } from './avatarCalculator';

/**
 * 옷 실측치(cm)를 px로 변환
 */
export function calculateClothingDimensions(
  measurements: Map<string, number>,
  bodyHeight: number,
  _category: ClothingCategory,
): ClothingDimensions {
  const toPx = (cm: number) => cmToPx(cm, bodyHeight);

  return {
    category: 'tshirt',
    shoulderWidth: toPx(measurements.get('shoulderWidth') ?? 45),
    chestWidth: toPx(measurements.get('chestWidth') ?? 50),
    totalLength: toPx(measurements.get('totalLength') ?? 70),
    sleeveLength: toPx(measurements.get('sleeveLength') ?? 22),
    sleeveWidth: toPx((measurements.get('sleeveCirc') ?? 36) / 2),
    hemWidth: toPx((measurements.get('hemCirc') ?? 100) / 2),
  };
}

/**
 * PointMeasurement[] → Map<string, number> 변환
 */
export function pointMeasurementsToMap(measurements: PointMeasurement[], _category: ClothingCategory = 'tshirt'): Map<string, number> {
  const map = new Map<string, number>();

  type Rule = { starts: string[]; ends: string[]; key: string; transform?: (v: number) => number };

  const rules: Rule[] = [
    { starts: ['shoulder_end_left'], ends: ['shoulder_end_right'], key: 'shoulderWidth' },
    { starts: ['neck_back_center', 'below_back_neck'], ends: ['hem_center', 'hem_left', 'hem_right'], key: 'totalLength' },
    { starts: ['shoulder_end_left', 'shoulder_end_right', 'shoulder_seam_left', 'shoulder_seam_right'], ends: ['sleeve_end_left', 'sleeve_end_right', 'cuff_left', 'cuff_right'], key: 'sleeveLength' },
    { starts: ['chest_left'], ends: ['chest_right'], key: 'chestWidth' },
    { starts: ['waist_left'], ends: ['waist_right'], key: 'waistCirc', transform: v => v * 2 },
    { starts: ['hem_left'], ends: ['hem_right'], key: 'hemCirc', transform: v => v * 2 },
    { starts: ['armpit_left', 'armpit_right'], ends: ['sleeve_end_left', 'sleeve_end_right', 'cuff_left', 'cuff_right'], key: 'sleeveCirc', transform: v => v * 2 },
  ];

  for (const m of measurements) {
    for (const rule of rules) {
      const matchForward = rule.starts.includes(m.startPointId) && rule.ends.includes(m.endPointId);
      const matchReverse = rule.starts.includes(m.endPointId) && rule.ends.includes(m.startPointId);
      if (matchForward || matchReverse) {
        const val = rule.transform ? rule.transform(m.value) : m.value;
        map.set(rule.key, val);
      }
    }
  }

  return map;
}
