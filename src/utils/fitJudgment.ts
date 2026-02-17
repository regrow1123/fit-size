/**
 * 부위별 핏 판정
 * 신체 치수(둘레/너비 cm)와 옷 치수(단면/너비 cm)를 비교하여
 * 각 부위의 여유량과 핏 판정을 반환한다.
 */

import type { BodyMeasurements, ClothingCategory } from '../types';

export type FitLevel = 'tight' | 'slim' | 'good' | 'relaxed' | 'loose';

export interface FitResult {
  part: string;       // 내부 키 (shoulder, chest, waist, hip, length, sleeve)
  bodyValue: number;  // 신체 치수 (cm)
  clothValue: number; // 옷 치수 (cm, 비교 가능한 단위로 변환 후)
  ease: number;       // 여유량 (cm) = clothValue - bodyValue
  level: FitLevel;
}

/** 부위별 여유량 기준 (cm) — 상의 */
const EASE_THRESHOLDS: Record<string, { tight: number; slim: number; good: number; relaxed: number }> = {
  shoulder: { tight: -1, slim: 1, good: 5, relaxed: 8 },
  chest:    { tight: 2, slim: 6, good: 14, relaxed: 20 },
  waist:    { tight: 2, slim: 6, good: 16, relaxed: 24 },
  hip:      { tight: 2, slim: 6, good: 14, relaxed: 20 },
  thigh:    { tight: 2, slim: 5, good: 10, relaxed: 15 },
};

function judgeLevel(ease: number, part: string): FitLevel {
  const t = EASE_THRESHOLDS[part] ?? EASE_THRESHOLDS.chest;
  if (ease < t.tight) return 'tight';
  if (ease < t.slim) return 'slim';
  if (ease < t.good) return 'good';
  if (ease < t.relaxed) return 'relaxed';
  return 'loose';
}

/**
 * 핏 판정 실행
 * @param body 신체 치수
 * @param clothing 옷 치수 (Map: key → cm, 단면 값)
 * @param category 의류 카테고리
 */
export function judgeFit(
  body: BodyMeasurements,
  clothing: Map<string, number>,
  category: ClothingCategory,
): FitResult[] {
  const results: FitResult[] = [];

  // 어깨 — 옷 어깨너비 vs 신체 어깨너비 (둘 다 너비)
  if (clothing.has('shoulderWidth') && body.shoulderWidth) {
    const clothVal = clothing.get('shoulderWidth')!;
    const bodyVal = body.shoulderWidth;
    const ease = clothVal - bodyVal;
    results.push({ part: 'shoulder', bodyValue: bodyVal, clothValue: clothVal, ease, level: judgeLevel(ease, 'shoulder') });
  }

  // 가슴 — 옷 가슴단면 × 2 vs 신체 가슴둘레
  if (clothing.has('chestWidth') && body.chestCirc) {
    const clothCirc = clothing.get('chestWidth')! * 2;
    const bodyVal = body.chestCirc;
    const ease = clothCirc - bodyVal;
    results.push({ part: 'chest', bodyValue: bodyVal, clothValue: clothCirc, ease, level: judgeLevel(ease, 'chest') });
  }

  // 허리 — 옷 허리단면/둘레 vs 신체 허리둘레
  if (body.waistCirc) {
    const waistCloth = clothing.has('waistCirc') ? clothing.get('waistCirc')! : null;
    if (waistCloth !== null) {
      // waistCirc 값이 단면인지 둘레인지: 50 이하면 단면으로 판단
      const clothCirc = waistCloth < 50 ? waistCloth * 2 : waistCloth;
      const ease = clothCirc - body.waistCirc;
      results.push({ part: 'waist', bodyValue: body.waistCirc, clothValue: clothCirc, ease, level: judgeLevel(ease, 'waist') });
    }
  }

  // 엉덩이 (하의/드레스)
  if ((category === 'pants' || category === 'dress') && body.hipCirc && clothing.has('hipCirc')) {
    const hipCloth = clothing.get('hipCirc')!;
    const clothCirc = hipCloth < 60 ? hipCloth * 2 : hipCloth;
    const ease = clothCirc - body.hipCirc;
    results.push({ part: 'hip', bodyValue: body.hipCirc, clothValue: clothCirc, ease, level: judgeLevel(ease, 'hip') });
  }

  // 허벅지 (하의)
  if (category === 'pants' && clothing.has('thighCirc')) {
    const thighCloth = clothing.get('thighCirc')!;
    const clothCirc = thighCloth < 40 ? thighCloth * 2 : thighCloth;
    // 신체 허벅지 둘레 추정 (Size Korea 기준: 대략 엉덩이둘레 × 0.6)
    const bodyThigh = body.hipCirc ? body.hipCirc * 0.58 : null;
    if (bodyThigh) {
      const ease = clothCirc - bodyThigh;
      results.push({ part: 'thigh', bodyValue: Math.round(bodyThigh), clothValue: clothCirc, ease, level: judgeLevel(ease, 'thigh') });
    }
  }

  return results;
}
