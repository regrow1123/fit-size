import type { BodyMeasurements, AvatarDimensions } from '../types';
import { estimateBodyDimensions } from '../data/bodyStats';

const CANVAS_HEIGHT = 600;
const SCALE = CANVAS_HEIGHT / 180; // 180cm → 600px

/**
 * 신체 측정값으로부터 아바타 렌더링용 픽셀 치수 계산
 */
export function calculateAvatarDimensions(body: BodyMeasurements): AvatarDimensions {
  const stats = estimateBodyDimensions(
    body.gender,
    body.height,
    body.weight,
    body.shoulderWidth,
    body.chestCirc,
    body.waistCirc,
  );

  const scale = (body.height / 180) * SCALE;

  // 머리 크기: 키의 약 1/7.5
  const headRadius = (body.height / 7.5 / 2) * SCALE;
  const neckWidth = (stats.neckCirc / Math.PI) * SCALE;
  const neckHeight = 4 * scale;

  // 어깨
  const shoulderWidth = stats.shoulderWidth * SCALE;
  const shoulderY = headRadius * 2 + neckHeight;

  // 가슴/허리 (둘레 → 정면 너비: 둘레 / π 근사)
  const chestWidth = (stats.chestCirc / Math.PI) * SCALE;
  const chestDepth = chestWidth * 0.7;
  const waistWidth = (stats.waistCirc / Math.PI) * SCALE;

  // 몸통
  const torsoHeight = stats.torsoLength * SCALE;

  // 팔
  const armLength = stats.armLength * SCALE;
  const armWidth = 8 * scale;

  // 엉덩이
  const hipWidth = (stats.hipCirc / Math.PI) * SCALE;

  // 다리: 전체에서 상체 빼기
  const totalHeight = body.height * SCALE;
  const legLength = totalHeight - shoulderY - torsoHeight;
  const legWidth = hipWidth * 0.3;

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
 * cm → 캔버스 px 변환 (현재 아바타 스케일 기준)
 */
export function cmToPx(cm: number, bodyHeight: number): number {
  const scale = (bodyHeight / 180) * SCALE;
  return cm * scale;
}
