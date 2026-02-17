import type { BodyMeasurements, AvatarDimensions } from '../types';
import { estimateBodyDimensions } from '../data/bodyStats';

/**
 * 인체 비례 기반 아바타 포인트 계산 (7.5등신 기준)
 *
 * Y좌표는 topMargin(30)을 포함한 캔버스 절대좌표.
 * 폭은 절반(half-width)이 아닌 전체폭.
 */

const CANVAS_H = 600;
const TOP_MARGIN = 30;

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

  const px = CANVAS_H / body.height; // px per cm
  const hu = CANVAS_H / 7.5;         // head unit
  const isFemale = body.gender === 'female';

  // ── 머리 ──
  const headRadius = hu * 0.5;
  const headCY = TOP_MARGIN + headRadius;

  // ── 목 ──
  const neckWidth = stats.neckCirc * 0.26 * px;
  const neckTopY = headCY + headRadius * 0.8;
  const neckBottomY = TOP_MARGIN + hu * 1.3;

  // ── 어깨 ──
  const shoulderY = TOP_MARGIN + hu * 1.45;
  const shoulderWidth = stats.shoulderWidth * px;

  // ── 둘레 → 정면폭 변환 ──
  // 인체 단면 비율: 정면폭 ≈ 둘레 × k
  const chestFrontK = isFemale ? 0.29 : 0.30;
  const waistFrontK = isFemale ? 0.27 : 0.28;
  const hipFrontK = isFemale ? 0.31 : 0.29;

  // ── 몸통 폭 포인트 ──
  const chestWidth = stats.chestCirc * chestFrontK * px;
  const chestY = TOP_MARGIN + hu * 1.85;
  const chestDepth = chestWidth * 0.7;

  const underbustWidth = chestWidth * (isFemale ? 0.88 : 0.95);
  const underbustY = TOP_MARGIN + hu * 2.2;

  const waistWidth = stats.waistCirc * waistFrontK * px;
  const waistY = TOP_MARGIN + hu * 2.8;

  const hipWidth = stats.hipCirc * hipFrontK * px;
  const hipY = TOP_MARGIN + hu * 3.5;

  const crotchY = TOP_MARGIN + hu * 4.0;

  // ── 팔 ──
  const armLength = hu * 3.0;
  const upperArmCirc = stats.chestCirc * 0.32; // 상완둘레 ≈ 가슴둘레의 32%
  const upperArmWidth = upperArmCirc * 0.30 * px;
  const elbowWidth = upperArmWidth * 0.85;
  const elbowY = shoulderY + armLength * 0.43;
  const forearmWidth = upperArmWidth * 0.75;
  const wristWidth = upperArmWidth * 0.55;
  const wristY = shoulderY + armLength * 0.88;

  // ── 다리 ──
  const legLength = hu * 3.5;
  const thighCirc = stats.hipCirc * 0.58; // 허벅지둘레 ≈ 엉덩이둘레의 58%
  const thighWidth = thighCirc * 0.30 * px;
  const kneeWidth = thighWidth * 0.7;
  const kneeY = crotchY + legLength * 0.46;
  const calfWidth = thighWidth * 0.72;
  const calfY = crotchY + legLength * 0.6;
  const ankleWidth = thighWidth * 0.4;
  const ankleY = crotchY + legLength * 0.94;
  const footLength = hu * 0.38;

  return {
    totalHeight: CANVAS_H,
    headRadius, headCY,
    neckWidth, neckTopY, neckBottomY,
    shoulderWidth, shoulderY,
    chestWidth, chestY, chestDepth,
    underbustWidth, underbustY,
    waistWidth, waistY,
    hipWidth, hipY,
    crotchY,
    armLength, upperArmWidth, elbowWidth, elbowY, forearmWidth, wristWidth, wristY,
    legLength, thighWidth, kneeWidth, kneeY, calfWidth, calfY, ankleWidth, ankleY, footLength,
  };
}

/** cm → 캔버스 px */
export function cmToPx(cm: number, bodyHeight: number): number {
  return cm * (CANVAS_H / bodyHeight);
}
