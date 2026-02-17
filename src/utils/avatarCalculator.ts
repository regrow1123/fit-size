import type { BodyMeasurements, AvatarDimensions } from '../types';
import { estimateBodyDimensions } from '../data/bodyStats';

/**
 * 인체 비례 기반 아바타 치수 계산
 *
 * 핵심 비례 (성인 기준):
 * - 전신 ≈ 머리 7.5개 높이
 * - 어깨선: 위에서 머리 1.5개 (목 포함)
 * - 가랑이: 위에서 머리 4개 (= 전신의 53%)
 * - 무릎: 위에서 머리 6개
 * - 팔 길이: 머리 3개 (어깨~손끝)
 * - 정면 가슴 폭 ≈ 가슴둘레 × 0.30
 * - 정면 허리 폭 ≈ 허리둘레 × 0.28
 * - 정면 엉덩이 폭 ≈ 엉덩이둘레 × 0.30
 */

const CANVAS_H = 600; // 사용 가능 영역 (topMargin 별도)

export function calculateAvatarDimensions(body: BodyMeasurements): AvatarDimensions {
  const stats = estimateBodyDimensions(
    body.gender,
    body.height,
    body.weight,
    body.shoulderWidth,
    body.chestCirc,
    body.waistCirc,
    body.hipCirc,
  );

  // px/cm 스케일: 전체 높이를 캔버스에 맞춤
  const totalHeight = CANVAS_H;
  const pxPerCm = totalHeight / body.height;

  // 머리 단위 (head unit)
  const hu = totalHeight / 7.5;

  // ── 머리 ──
  const headRadius = hu / 2;

  // ── 목 ──
  const neckWidth = stats.neckCirc * 0.28 * pxPerCm;
  const neckHeight = hu * 0.2;

  // ── 기준점 (topMargin 제외, 렌더러에서 더함) ──
  const shoulderY = hu * 1.5; // 머리 1 + 목 0.5

  // ── 둘레→정면폭 변환 ──
  // 인체 단면은 전후로 납작한 타원. 정면폭 ≈ 둘레 × 비율
  const shoulderWidth = stats.shoulderWidth * pxPerCm;
  const chestWidth = stats.chestCirc * 0.30 * pxPerCm;
  const waistWidth = stats.waistCirc * 0.28 * pxPerCm;
  const hipWidth = stats.hipCirc * 0.30 * pxPerCm;

  const chestDepth = chestWidth * 0.7;

  // ── 몸통 ──
  // 어깨~가랑이 = hu * 2.5 (1.5~4.0)
  const torsoHeight = hu * 2.5;

  // ── 팔 ──
  const armLength = hu * 3;
  // 팔 두께: 어깨폭 기준 비례 (상완 ≈ 어깨폭의 8~10%)
  const armWidth = shoulderWidth * 0.09;

  // ── 다리 ──
  // 가랑이~발끝 = hu * 3.5 (4.0~7.5)
  const legLength = hu * 3.5;
  // 허벅지 폭 ≈ 엉덩이폭의 35%
  const legWidth = hipWidth * 0.35;

  return {
    totalHeight,
    headRadius,
    neckWidth,
    neckHeight,
    shoulderWidth,
    shoulderY,
    chestWidth,
    chestDepth,
    waistWidth,
    torsoHeight,
    armLength,
    armWidth,
    hipWidth,
    legLength,
    legWidth,
  };
}

/**
 * cm → 캔버스 px 변환
 */
export function cmToPx(cm: number, bodyHeight: number): number {
  return cm * (CANVAS_H / bodyHeight);
}
