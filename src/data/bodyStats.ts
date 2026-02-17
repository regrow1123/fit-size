/**
 * 체형 추정 엔진 v2
 *
 * 1단계: Size Korea 통계 테이블에서 키/몸무게 기반 IDW 보간
 * 2단계: 사용자 직접 입력값으로 덮어쓰기
 * 3단계: 옷 역추정 데이터가 통계와 차이나면, 상관관계 기반으로 다른 부위도 보정
 */

import { lookupSizeKorea } from './sizeKoreaTable';

export interface BodyStatRange {
  chestCirc: number;
  waistCirc: number;
  hipCirc: number;
  shoulderWidth: number;
  armLength: number;
  torsoLength: number;
  neckCirc: number;
}

/**
 * 부위 간 상관관계 테이블
 *
 * 예: 사용자의 가슴둘레가 통계보다 10% 크면,
 *     허리둘레도 corr * 10% 만큼 보정.
 *
 * 값은 피어슨 상관계수의 근사치 (0~1).
 * 같은 "둘레 계열"끼리는 높고, 길이/너비는 낮음.
 */
type BodyKey = keyof BodyStatRange;

const CORRELATION: Record<BodyKey, Partial<Record<BodyKey, number>>> = {
  chestCirc: {
    waistCirc: 0.75,
    hipCirc: 0.65,
    shoulderWidth: 0.50,
    neckCirc: 0.70,
    armLength: 0.10,
    torsoLength: 0.15,
  },
  waistCirc: {
    chestCirc: 0.75,
    hipCirc: 0.70,
    shoulderWidth: 0.30,
    neckCirc: 0.65,
    armLength: 0.05,
    torsoLength: 0.10,
  },
  hipCirc: {
    chestCirc: 0.65,
    waistCirc: 0.70,
    shoulderWidth: 0.35,
    neckCirc: 0.50,
    armLength: 0.08,
    torsoLength: 0.12,
  },
  shoulderWidth: {
    chestCirc: 0.50,
    waistCirc: 0.30,
    hipCirc: 0.35,
    neckCirc: 0.45,
    armLength: 0.40,
    torsoLength: 0.30,
  },
  neckCirc: {
    chestCirc: 0.70,
    waistCirc: 0.65,
    hipCirc: 0.50,
    shoulderWidth: 0.45,
    armLength: 0.10,
    torsoLength: 0.10,
  },
  armLength: {
    chestCirc: 0.10,
    waistCirc: 0.05,
    hipCirc: 0.08,
    shoulderWidth: 0.40,
    neckCirc: 0.10,
    torsoLength: 0.55,
  },
  torsoLength: {
    chestCirc: 0.15,
    waistCirc: 0.10,
    hipCirc: 0.12,
    shoulderWidth: 0.30,
    neckCirc: 0.10,
    armLength: 0.55,
  },
};

/**
 * 메인 추정 함수
 *
 * @param gender 성별
 * @param height 키 (cm)
 * @param weight 몸무게 (kg)
 * @param shoulderWidthInput 사용자 입력 어깨너비 (선택)
 * @param chestCircInput 사용자 입력 가슴둘레 (선택)
 * @param waistCircInput 사용자 입력 허리둘레 (선택)
 * @param hipCircInput 사용자 입력 엉덩이둘레 (선택)
 */
export function estimateBodyDimensions(
  gender: 'male' | 'female',
  height: number,
  weight: number,
  shoulderWidthInput?: number,
  chestCircInput?: number,
  waistCircInput?: number,
  hipCircInput?: number,
): BodyStatRange {
  // ── 1단계: Size Korea 통계 기반 기본값 ──
  const stats = lookupSizeKorea(gender, height, weight);
  const baseline: BodyStatRange = {
    chestCirc: stats.chestCirc,
    waistCirc: stats.waistCirc,
    hipCirc: stats.hipCirc,
    shoulderWidth: stats.shoulderWidth,
    neckCirc: stats.neckCirc,
    armLength: stats.armLength,
    torsoLength: stats.torsoLength,
  };

  // 기본값 복사 (보정 전)
  const result: BodyStatRange = { ...baseline };

  // ── 2단계: 사용자 입력값 수집 + 편차 계산 ──
  const overrides: Partial<Record<BodyKey, number>> = {};
  if (shoulderWidthInput) overrides.shoulderWidth = shoulderWidthInput;
  if (chestCircInput) overrides.chestCirc = chestCircInput;
  if (waistCircInput) overrides.waistCirc = waistCircInput;
  if (hipCircInput) overrides.hipCirc = hipCircInput;

  // 편차 비율 수집: (입력값 - 통계값) / 통계값
  const deviations: Partial<Record<BodyKey, number>> = {};
  for (const [key, inputVal] of Object.entries(overrides) as [BodyKey, number][]) {
    const statVal = baseline[key];
    if (statVal > 0) {
      deviations[key] = (inputVal - statVal) / statVal;
    }
    // 입력값으로 덮어쓰기
    result[key] = inputVal;
  }

  // ── 3단계: 편차 전파 보정 ──
  // 입력하지 않은 부위에 대해, 입력된 부위들의 편차를 상관관계 가중 평균으로 전파
  const allKeys: BodyKey[] = ['chestCirc', 'waistCirc', 'hipCirc', 'shoulderWidth', 'neckCirc', 'armLength', 'torsoLength'];
  const inputKeys = Object.keys(overrides) as BodyKey[];
  const nonInputKeys = allKeys.filter(k => !inputKeys.includes(k));

  for (const targetKey of nonInputKeys) {
    let weightedDeviation = 0;
    let totalCorrelation = 0;

    for (const sourceKey of inputKeys) {
      const dev = deviations[sourceKey];
      const corr = CORRELATION[sourceKey]?.[targetKey] ?? 0;
      if (dev !== undefined && corr > 0) {
        weightedDeviation += dev * corr;
        totalCorrelation += corr;
      }
    }

    if (totalCorrelation > 0) {
      const avgDeviation = weightedDeviation / totalCorrelation;
      // 보정 강도를 줄임 (상관관계가 약할수록 덜 보정)
      // 최대 상관 합이 클수록 확신이 높으므로 더 강하게 보정
      const confidence = Math.min(totalCorrelation / inputKeys.length, 1);
      const adjustment = avgDeviation * confidence;
      result[targetKey] = Math.round((baseline[targetKey] * (1 + adjustment)) * 10) / 10;
    }
  }

  return result;
}
