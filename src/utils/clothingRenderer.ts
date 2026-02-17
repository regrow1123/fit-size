import type { AvatarDimensions, ClothingCategory, ClothingDimensions, PointMeasurement } from '../types';
import { cmToPx } from './avatarCalculator';

/**
 * 옷 실측치(cm)를 px로 변환
 */
export function calculateClothingDimensions(
  measurements: Map<string, number>,
  bodyHeight: number,
  category: ClothingCategory,
): ClothingDimensions {
  const toPx = (cm: number) => cmToPx(cm, bodyHeight);

  return {
    category,
    shoulderWidth: toPx(measurements.get('shoulderWidth') ?? 45),
    chestWidth: toPx(measurements.get('chestWidth') ?? 50),
    totalLength: toPx(measurements.get('totalLength') ?? 70),
    sleeveLength: toPx(measurements.get('sleeveLength') ?? 22),
    sleeveWidth: toPx((measurements.get('sleeveCirc') ?? 36) / 2),
    hemWidth: toPx((measurements.get('hemCirc') ?? 100) / 2),
  };
}

// ── Style ──
const COLORS = {
  fill: 'rgba(70, 130, 180, 0.30)',
  stroke: 'rgba(30, 80, 140, 0.75)',
};

const ARM_ANGLE = 15 * Math.PI / 180;
const sinA = Math.sin(ARM_ANGLE);
const cosA = Math.cos(ARM_ANGLE);

/**
 * Canvas에 옷을 아바타 위에 오버레이
 */
export function drawClothing(
  ctx: CanvasRenderingContext2D,
  av: AvatarDimensions,
  cl: ClothingDimensions,
  canvasWidth: number,
) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.fillStyle = COLORS.fill;
  ctx.strokeStyle = COLORS.stroke;
  ctx.lineWidth = 1.5;

  drawTshirt(ctx, av, cl, canvasWidth);

  ctx.restore();
}

// ════════════════════════════════════════
// T-SHIRT — 몸통과 소매를 하나의 연속 경로로 그림
// ════════════════════════════════════════
function drawTshirt(
  ctx: CanvasRenderingContext2D,
  av: AvatarDimensions,
  cl: ClothingDimensions,
  cw: number,
) {
  const cx = cw / 2;

  const sy = av.shoulderY;
  const shH = cl.shoulderWidth / 2;
  const chH = cl.chestWidth / 2;
  const hemH = cl.hemWidth / 2;
  const nkH = av.neckWidth / 2;
  const hemY = sy + cl.totalLength;

  const torsoLen = cl.totalLength;
  const armpitY = sy + torsoLen * 0.12;
  const chestY = sy + torsoLen * 0.22;
  const waistY = sy + torsoLen * 0.55;

  const slLen = cl.sleeveLength;
  const slTopW = cl.sleeveWidth;
  const slEndW = slTopW * 0.9;

  // 하나의 연속 경로: 네크라인 → 오른쪽 어깨 → 오른쪽 소매 → 겨드랑이 →
  // 몸통 오른쪽 → 밑단 → 몸통 왼쪽 → 겨드랑이 → 왼쪽 소매 → 왼쪽 어깨 → 네크라인
  ctx.beginPath();

  // 네크라인
  ctx.moveTo(cx - nkH, sy - 2);
  ctx.quadraticCurveTo(cx, sy + 6, cx + nkH, sy - 2);

  // 오른쪽 어깨 → 소매
  ctx.lineTo(cx + shH, sy);

  // 오른쪽 소매 외측
  const rTipCX = cx + shH + slLen * sinA;
  const rTipCY = sy + slLen * cosA;
  const rPerpX = cosA;
  const rPerpY = -sinA;

  ctx.bezierCurveTo(
    cx + shH + (rTipCX - cx - shH) * 0.35 + rPerpX * slTopW * 0.15,
    sy + (rTipCY - sy) * 0.35 + rPerpY * slTopW * 0.15,
    rTipCX + rPerpX * slEndW / 2 - (rTipCX - cx - shH) * 0.2,
    rTipCY + rPerpY * slEndW / 2 - (rTipCY - sy) * 0.2,
    rTipCX + rPerpX * slEndW / 2, rTipCY + rPerpY * slEndW / 2,
  );

  // 오른쪽 소매 끝단
  ctx.lineTo(rTipCX - rPerpX * slEndW / 2, rTipCY - rPerpY * slEndW / 2);

  // 오른쪽 소매 내측 → 겨드랑이 (몸통에 자연스럽게 합류)
  const rInnerArmpit = cx + Math.max(chH, shH - 5);
  ctx.bezierCurveTo(
    rTipCX - rPerpX * slEndW / 2 - (rTipCX - cx - shH) * 0.2,
    rTipCY - rPerpY * slEndW / 2 - (rTipCY - sy) * 0.2,
    rInnerArmpit + (rTipCX - cx - shH) * 0.1,
    armpitY + (rTipCY - sy) * 0.15,
    rInnerArmpit, armpitY,
  );

  // 겨드랑이 → 가슴 → 허리 → 밑단 (오른쪽 몸통)
  ctx.bezierCurveTo(
    rInnerArmpit - 1, armpitY + (chestY - armpitY) * 0.6,
    cx + chH + 2, chestY - 2,
    cx + chH, chestY,
  );
  ctx.bezierCurveTo(
    cx + chH - 1, chestY + (waistY - chestY) * 0.5,
    cx + hemH + 2, waistY,
    cx + hemH, hemY,
  );

  // 밑단
  ctx.lineTo(cx - hemH, hemY);

  // 왼쪽 몸통 (대칭)
  ctx.bezierCurveTo(
    cx - hemH - 2, waistY,
    cx - chH + 1, chestY + (waistY - chestY) * 0.5,
    cx - chH, chestY,
  );

  const lInnerArmpit = cx - Math.max(chH, shH - 5);
  ctx.bezierCurveTo(
    cx - chH - 2, chestY - 2,
    lInnerArmpit + 1, armpitY + (chestY - armpitY) * 0.6,
    lInnerArmpit, armpitY,
  );

  // 왼쪽 소매 내측 ← 겨드랑이
  const lTipCX = cx - shH - slLen * sinA;
  const lTipCY = sy + slLen * cosA;
  const lPerpX = -cosA;
  const lPerpY = -sinA;

  ctx.bezierCurveTo(
    lInnerArmpit - (lTipCX - cx + shH) * 0.1,
    armpitY + (lTipCY - sy) * 0.15,
    lTipCX - lPerpX * slEndW / 2 + (lTipCX - cx + shH) * 0.2,
    lTipCY - lPerpY * slEndW / 2 - (lTipCY - sy) * 0.2,
    lTipCX - lPerpX * slEndW / 2, lTipCY - lPerpY * slEndW / 2,
  );

  // 왼쪽 소매 끝단
  ctx.lineTo(lTipCX + lPerpX * slEndW / 2, lTipCY + lPerpY * slEndW / 2);

  // 왼쪽 소매 외측 → 어깨
  ctx.bezierCurveTo(
    lTipCX + lPerpX * slEndW / 2 + (lTipCX - cx + shH) * 0.2,
    lTipCY + lPerpY * slEndW / 2 - (lTipCY - sy) * 0.2,
    cx - shH - (cx + shH - lTipCX) * 0.35 - cosA * slTopW * 0.15,
    sy + (lTipCY - sy) * 0.35 - sinA * slTopW * 0.15,
    cx - shH, sy,
  );

  ctx.closePath();
  ctx.fill();
  ctx.stroke();
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
