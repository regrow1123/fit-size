import type { BodyMeasurements, ClothingCategory } from '../types';

export type FitFeedback = '매우 타이트' | '타이트' | '적당' | '넉넉' | '매우 넉넉';

export interface ReverseMeasurement {
  startPointId: string;
  endPointId: string;
  value: number; // cm
  feedback: FitFeedback;
}

export interface ReverseGarment {
  id: string;
  category: ClothingCategory;
  measurements: ReverseMeasurement[];
}

// Offset in cm for flat (non-circumference) measurements
const FEEDBACK_OFFSET: Record<FitFeedback, number> = {
  '매우 타이트': 3,
  '타이트': 1.5,
  '적당': -1,
  '넉넉': -4,
  '매우 넉넉': -7,
};

// Which body part does a point-pair map to?
type BodyPartKey = keyof BodyMeasurements;

interface MappingRule {
  starts: string[];
  ends: string[];
  bodyPart: BodyPartKey;
  isCircumference: boolean;
  // Some measurements need transform (e.g. flat width → circumference)
  transform?: (v: number) => number;
}

const TOP_RULES: MappingRule[] = [
  { starts: ['shoulder_end_left'], ends: ['shoulder_end_right'], bodyPart: 'shoulderWidth', isCircumference: false },
  { starts: ['chest_left'], ends: ['chest_right'], bodyPart: 'chestCirc', isCircumference: true, transform: v => v * 2 },
  { starts: ['waist_left'], ends: ['waist_right'], bodyPart: 'waistCirc', isCircumference: true, transform: v => v * 2 },
];

function getRules(_category: ClothingCategory): MappingRule[] {
  return TOP_RULES;
}

function estimateBodyValue(clothingValue: number, feedback: FitFeedback, isCircumference: boolean): number {
  const offset = FEEDBACK_OFFSET[feedback];
  const multiplier = isCircumference ? 2 : 1;
  return clothingValue + offset * multiplier;
}

export interface BodyEstimate {
  value: number;
  count: number; // number of data points contributing
}

export type BodyEstimates = Partial<Record<keyof BodyMeasurements, BodyEstimate>>;

export function estimateBodyFromGarments(garments: ReverseGarment[]): BodyEstimates {
  // Accumulate all estimates per body part
  const accumulator: Partial<Record<keyof BodyMeasurements, number[]>> = {};

  for (const garment of garments) {
    const rules = getRules(garment.category);

    for (const m of garment.measurements) {
      for (const rule of rules) {
        const matchFwd = rule.starts.includes(m.startPointId) && rule.ends.includes(m.endPointId);
        const matchRev = rule.starts.includes(m.endPointId) && rule.ends.includes(m.startPointId);
        if (matchFwd || matchRev) {
          const clothingVal = rule.transform ? rule.transform(m.value) : m.value;
          const bodyVal = estimateBodyValue(clothingVal, m.feedback, rule.isCircumference);
          if (!accumulator[rule.bodyPart]) accumulator[rule.bodyPart] = [];
          accumulator[rule.bodyPart]!.push(bodyVal);
        }
      }
    }
  }

  // Average
  const result: BodyEstimates = {};
  for (const [key, values] of Object.entries(accumulator)) {
    if (values && values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      result[key as keyof BodyMeasurements] = { value: Math.round(avg * 10) / 10, count: values.length };
    }
  }
  return result;
}

export function estimatesToBodyMeasurements(
  estimates: BodyEstimates,
  gender: 'male' | 'female',
  height: number,
  weight: number,
): BodyMeasurements {
  return {
    gender,
    height,
    weight,
    shoulderWidth: estimates.shoulderWidth?.value,
    chestCirc: estimates.chestCirc?.value,
    waistCirc: estimates.waistCirc?.value,
    hipCirc: estimates.hipCirc?.value,
  };
}
