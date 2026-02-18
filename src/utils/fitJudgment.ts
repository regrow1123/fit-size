/**
 * 부위별 핏 판정
 * 신체 치수(둘레/너비 cm)와 옷 치수(단면/너비 cm)를 비교하여
 * 각 부위의 여유량과 핏 판정을 반환한다.
 */

import type { BodyMeasurements, ClothingCategory } from '../types';

export type FitLevel = 'tight' | 'good' | 'loose';

export interface FitResult {
  part: string;       // 내부 키 (shoulder, chest, waist, hip, length, sleeve)
  bodyValue: number;  // 신체 치수 (cm)
  clothValue: number; // 옷 치수 (cm, 비교 가능한 단위로 변환 후)
  ease: number;       // 여유량 (cm) = clothValue - bodyValue
  level: FitLevel;
}

/** 부위별 여유량 기준 (cm) — tight 미만이면 타이트, good 초과면 루즈 */
const EASE_THRESHOLDS: Record<string, { tight: number; good: number }> = {
  shoulder: { tight: 0, good: 6 },
  chest:    { tight: 4, good: 16 },
  waist:    { tight: 4, good: 18 },
  hip:      { tight: 4, good: 16 },
  thigh:    { tight: 3, good: 12 },
};

function judgeLevel(ease: number, part: string): FitLevel {
  const t = EASE_THRESHOLDS[part] ?? EASE_THRESHOLDS.chest;
  if (ease < t.tight) return 'tight';
  if (ease > t.good) return 'loose';
  return 'good';
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
  _category: ClothingCategory,
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

  // 허리 — 옷 허리단면/둘레 vs 신체 허리둘레, 또는 밑단폭으로 대체
  if (body.waistCirc) {
    const waistCloth = clothing.has('waistCirc') ? clothing.get('waistCirc')! : null;
    if (waistCloth !== null) {
      const clothCirc = waistCloth < 50 ? waistCloth * 2 : waistCloth;
      const ease = clothCirc - body.waistCirc;
      results.push({ part: 'waist', bodyValue: body.waistCirc, clothValue: clothCirc, ease, level: judgeLevel(ease, 'waist') });
    } else if (clothing.has('hemWidth')) {
      // 밑단폭 × 2로 허리 대용
      const clothCirc = clothing.get('hemWidth')! * 2;
      const ease = clothCirc - body.waistCirc;
      results.push({ part: 'waist', bodyValue: body.waistCirc, clothValue: clothCirc, ease, level: judgeLevel(ease, 'waist') });
    }
  }

  // 총기장 — 참고 표시 (판정 없이 수치만)
  if (clothing.has('totalLength')) {
    const clothVal = clothing.get('totalLength')!;
    results.push({ part: 'length', bodyValue: 0, clothValue: clothVal, ease: 0, level: 'good' });
  }

  // 소매 길이
  if (clothing.has('sleeveLength')) {
    const clothVal = clothing.get('sleeveLength')!;
    results.push({ part: 'sleeve', bodyValue: 0, clothValue: clothVal, ease: 0, level: 'good' });
  }

  return results;
}
