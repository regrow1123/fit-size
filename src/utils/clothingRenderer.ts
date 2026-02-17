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

  const base: ClothingDimensions = {
    category,
    shoulderWidth: toPx(measurements.get('shoulderWidth') ?? 45),
    chestWidth: toPx(measurements.get('chestWidth') ?? 50),
    totalLength: toPx(measurements.get('totalLength') ?? 70),
    sleeveLength: toPx(measurements.get('sleeveLength') ?? 22),
    sleeveWidth: toPx((measurements.get('sleeveCirc') ?? 36) / 2),
    hemWidth: toPx((measurements.get('hemCirc') ?? 100) / 2),
  };

  if (category === 'pants') {
    base.waistWidth = toPx((measurements.get('waistCirc') ?? 80) / 2);
    base.hipWidth = toPx((measurements.get('hipCirc') ?? 96) / 2);
    base.thighWidth = toPx((measurements.get('thighCirc') ?? 56) / 2);
    base.kneeWidth = toPx((measurements.get('kneeCirc') ?? 40) / 2);
    base.inseam = toPx(measurements.get('inseam') ?? 76);
    base.rise = toPx(measurements.get('rise') ?? 26);
    base.hemWidth = toPx((measurements.get('hemCirc') ?? 36) / 2);
    base.totalLength = toPx(measurements.get('totalLength') ?? 100);
  }

  if (category === 'long_sleeve' || category === 'jacket') {
    base.sleeveLength = toPx(measurements.get('sleeveLength') ?? 58);
    base.elbowWidth = toPx((measurements.get('elbowCirc') ?? 30) / 2);
    base.cuffWidth = toPx((measurements.get('cuffCirc') ?? 24) / 2);
  }

  if (category === 'jacket') {
    base.shoulderWidth = toPx(measurements.get('shoulderWidth') ?? 48);
    base.totalLength = toPx(measurements.get('totalLength') ?? 75);
  }

  if (category === 'dress') {
    base.totalLength = toPx(measurements.get('totalLength') ?? 100);
    base.hipWidth = toPx((measurements.get('hipCirc') ?? 96) / 2);
  }

  return base;
}

// ── Style ──
const COLORS = {
  top:   { fill: 'rgba(70, 130, 180, 0.30)', stroke: 'rgba(30, 80, 140, 0.75)' },
  pants: { fill: 'rgba(80, 120, 160, 0.30)', stroke: 'rgba(30, 70, 130, 0.75)' },
  dress: { fill: 'rgba(160, 70, 120, 0.25)', stroke: 'rgba(130, 30, 70, 0.75)' },
};

const ARM_ANGLE = 15 * Math.PI / 180; // 아바타와 동일한 팔 각도
const sinA = Math.sin(ARM_ANGLE);
const cosA = Math.cos(ARM_ANGLE);

function setStyle(ctx: CanvasRenderingContext2D, colors: { fill: string; stroke: string }) {
  ctx.fillStyle = colors.fill;
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
}

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

  switch (cl.category) {
    case 'pants': drawPants(ctx, av, cl, canvasWidth); break;
    case 'dress': drawDress(ctx, av, cl, canvasWidth); break;
    default: drawTop(ctx, av, cl, canvasWidth); break;
  }

  ctx.restore();
}

// ════════════════════════════════════════
// TOP (tshirt / long_sleeve / jacket)
// ════════════════════════════════════════
function drawTop(
  ctx: CanvasRenderingContext2D,
  av: AvatarDimensions,
  cl: ClothingDimensions,
  cw: number,
) {
  const cx = cw / 2;
  const colors = COLORS.top;
  const isLong = cl.category === 'long_sleeve' || cl.category === 'jacket';

  // 옷 좌표: 아바타 기준점 활용
  const sy = av.shoulderY;
  const shH = cl.shoulderWidth / 2;
  const chH = cl.chestWidth / 2; // 단면폭 (px)
  const hemH = cl.hemWidth / 2;
  const nkH = av.neckWidth / 2;
  const hemY = sy + cl.totalLength;

  // 몸통의 Y 위치는 아바타 비례 기반
  const torsoLen = cl.totalLength;
  const armpitY = sy + torsoLen * 0.12;
  const chestY = sy + torsoLen * 0.22;
  const waistY = sy + torsoLen * 0.55;

  // ── 소매 (먼저 — 몸통 뒤에) ──
  const slLen = cl.sleeveLength;
  const slTopW = cl.sleeveWidth;
  const slEndW = isLong ? (cl.cuffWidth ?? slTopW * 0.6) : slTopW * 0.9;

  for (const s of [-1, 1]) {
    const sx = cx + s * shH;
    // 소매도 아바타와 같은 15도 각도
    const tipCX = sx + s * slLen * sinA;
    const tipCY = sy + slLen * cosA;

    // 소매 상단폭, 하단폭 (수직에 수직인 방향)
    const perpX = cosA * s;
    const perpY = -sinA;

    // 소매 시작 (어깨-겨드랑이)
    const outerStartX = sx;
    const outerStartY = sy;
    const innerStartX = cx + s * Math.max(chH, shH - 5);
    const innerStartY = armpitY;

    // 소매 끝
    const outerEndX = tipCX + perpX * slEndW / 2;
    const outerEndY = tipCY + perpY * slEndW / 2;
    const innerEndX = tipCX - perpX * slEndW / 2;
    const innerEndY = tipCY - perpY * slEndW / 2;

    setStyle(ctx, colors);
    ctx.beginPath();
    ctx.moveTo(outerStartX, outerStartY);

    // 외측
    ctx.bezierCurveTo(
      outerStartX + (tipCX - sx) * 0.35 + perpX * slTopW * 0.15,
      outerStartY + (tipCY - sy) * 0.35 + perpY * slTopW * 0.15,
      outerEndX - (tipCX - sx) * 0.2,
      outerEndY - (tipCY - sy) * 0.2,
      outerEndX, outerEndY,
    );

    // 소매 끝단
    ctx.lineTo(innerEndX, innerEndY);

    // 내측
    ctx.bezierCurveTo(
      innerEndX - (tipCX - sx) * 0.2,
      innerEndY - (tipCY - sy) * 0.2,
      innerStartX + (tipCX - sx) * 0.15,
      innerStartY + (tipCY - sy) * 0.25,
      innerStartX, innerStartY,
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // ── 몸통 ──
  setStyle(ctx, colors);
  ctx.beginPath();

  // 네크라인
  ctx.moveTo(cx - nkH, sy - 2);
  ctx.quadraticCurveTo(cx, sy + 6, cx + nkH, sy - 2);

  // 오른쪽: 어깨 → 겨드랑이 → 가슴 → 허리 → 밑단
  ctx.lineTo(cx + shH, sy);
  ctx.bezierCurveTo(
    cx + shH + 1, sy + (armpitY - sy) * 0.6,
    cx + chH + 3, armpitY,
    cx + chH, chestY,
  );
  ctx.bezierCurveTo(
    cx + chH - 1, chestY + (waistY - chestY) * 0.5,
    cx + hemH + 2, waistY,
    cx + hemH, hemY,
  );

  // 밑단
  ctx.lineTo(cx - hemH, hemY);

  // 왼쪽 (대칭)
  ctx.bezierCurveTo(
    cx - hemH - 2, waistY,
    cx - chH + 1, chestY + (waistY - chestY) * 0.5,
    cx - chH, chestY,
  );
  ctx.bezierCurveTo(
    cx - chH - 3, armpitY,
    cx - shH - 1, sy + (armpitY - sy) * 0.6,
    cx - shH, sy,
  );

  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.setLineDash([]);
}

// ════════════════════════════════════════
// PANTS
// ════════════════════════════════════════
function drawPants(
  ctx: CanvasRenderingContext2D,
  av: AvatarDimensions,
  cl: ClothingDimensions,
  cw: number,
) {
  const cx = cw / 2;
  const colors = COLORS.pants;

  const wH = (cl.waistWidth ?? av.hipWidth * 0.9) / 2;
  const hipH = (cl.hipWidth ?? av.hipWidth) / 2;
  const thH = (cl.thighWidth ?? av.thighWidth) / 2;
  const knH = (cl.kneeWidth ?? av.kneeWidth) / 2;
  const hemH = cl.hemWidth / 2;
  const rise = cl.rise ?? (av.crotchY - av.waistY) * 0.6;

  // 아바타 기준점 활용
  const waistY = av.waistY;
  const crotchY = waistY + rise;
  const hemY = waistY + cl.totalLength;
  const hipY = waistY + rise * 0.5;
  const kneeY = crotchY + (hemY - crotchY) * 0.45;

  const gap = av.thighWidth * 0.3; // 내측 간격

  setStyle(ctx, colors);

  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx, waistY);
    ctx.lineTo(cx + s * wH, waistY);

    // 외측: 허리 → 엉덩이 → 허벅지 → 무릎 → 밑단
    ctx.bezierCurveTo(
      cx + s * (wH + 1), waistY + rise * 0.2,
      cx + s * (hipH + 1), hipY - 5,
      cx + s * hipH, hipY,
    );
    ctx.bezierCurveTo(
      cx + s * hipH, hipY + (crotchY - hipY) * 0.4,
      cx + s * thH, crotchY - (crotchY - hipY) * 0.15,
      cx + s * thH, crotchY,
    );
    ctx.bezierCurveTo(
      cx + s * thH, crotchY + (kneeY - crotchY) * 0.35,
      cx + s * knH * 1.05, kneeY - (kneeY - crotchY) * 0.15,
      cx + s * knH, kneeY,
    );
    ctx.bezierCurveTo(
      cx + s * knH, kneeY + (hemY - kneeY) * 0.3,
      cx + s * hemH, hemY - (hemY - kneeY) * 0.15,
      cx + s * hemH, hemY,
    );

    // 밑단
    ctx.lineTo(cx + s * gap, hemY);

    // 내측: 밑단 → 가랑이
    ctx.bezierCurveTo(
      cx + s * gap, hemY - (hemY - crotchY) * 0.3,
      cx + s * gap * 0.8, crotchY + 12,
      cx, crotchY + 4,
    );

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 허리밴드
  ctx.setLineDash([]);
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - wH, waistY);
  ctx.lineTo(cx + wH, waistY);
  ctx.stroke();
}

// ════════════════════════════════════════
// DRESS
// ════════════════════════════════════════
function drawDress(
  ctx: CanvasRenderingContext2D,
  av: AvatarDimensions,
  cl: ClothingDimensions,
  cw: number,
) {
  const cx = cw / 2;
  const colors = COLORS.dress;

  const sy = av.shoulderY;
  const shH = cl.shoulderWidth / 2;
  const chH = cl.chestWidth / 2;
  const nkH = av.neckWidth / 2;
  const waistH = chH * 0.85;
  const hipH = (cl.hipWidth ?? chH * 1.1) / 2;
  const hemH = cl.hemWidth / 2;
  const hemY = sy + cl.totalLength;

  const tLen = cl.totalLength;
  const armpitY = sy + tLen * 0.1;
  const chestY = sy + tLen * 0.15;
  const waistY = sy + tLen * 0.35;
  const hipY = sy + tLen * 0.45;

  // 소매
  const slLen = cl.sleeveLength;
  const slW = cl.sleeveWidth;
  for (const s of [-1, 1]) {
    const sx = cx + s * shH;
    const tipCX = sx + s * slLen * sinA;
    const tipCY = sy + slLen * cosA;
    const perpX = cosA * s;
    const perpY = -sinA;

    setStyle(ctx, colors);
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(
      sx + (tipCX - sx) * 0.35 + perpX * slW * 0.15,
      sy + (tipCY - sy) * 0.35 + perpY * slW * 0.15,
      tipCX + perpX * slW / 2 - (tipCX - sx) * 0.2,
      tipCY + perpY * slW / 2 - (tipCY - sy) * 0.2,
      tipCX + perpX * slW / 2, tipCY + perpY * slW / 2,
    );
    ctx.lineTo(tipCX - perpX * slW / 2, tipCY - perpY * slW / 2);
    ctx.bezierCurveTo(
      tipCX - perpX * slW / 2 - (tipCX - sx) * 0.2,
      tipCY - perpY * slW / 2 - (tipCY - sy) * 0.2,
      cx + s * Math.max(chH, shH - 5) + (tipCX - sx) * 0.15,
      armpitY + (tipCY - sy) * 0.25,
      cx + s * Math.max(chH, shH - 5), armpitY,
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 몸통 + 스커트
  setStyle(ctx, colors);
  ctx.beginPath();
  ctx.moveTo(cx - nkH, sy - 2);
  ctx.quadraticCurveTo(cx, sy + 6, cx + nkH, sy - 2);

  ctx.lineTo(cx + shH, sy);
  ctx.bezierCurveTo(cx + shH, armpitY, cx + chH + 2, armpitY, cx + chH, chestY);
  ctx.bezierCurveTo(cx + chH, (chestY + waistY) / 2, cx + waistH, waistY, cx + waistH, waistY);
  ctx.bezierCurveTo(cx + waistH + 1, (waistY + hipY) / 2, cx + hipH, hipY, cx + hipH, hipY);
  ctx.bezierCurveTo(cx + hipH + 3, (hipY + hemY) / 2, cx + hemH + 2, hemY - tLen * 0.06, cx + hemH, hemY);

  ctx.lineTo(cx - hemH, hemY);

  ctx.bezierCurveTo(cx - hemH - 2, hemY - tLen * 0.06, cx - hipH - 3, (hipY + hemY) / 2, cx - hipH, hipY);
  ctx.bezierCurveTo(cx - hipH, hipY, cx - waistH - 1, (waistY + hipY) / 2, cx - waistH, waistY);
  ctx.bezierCurveTo(cx - waistH, waistY, cx - chH, (chestY + waistY) / 2, cx - chH, chestY);
  ctx.bezierCurveTo(cx - chH - 2, armpitY, cx - shH, armpitY, cx - shH, sy);

  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.setLineDash([]);
}

/**
 * PointMeasurement[] → Map<string, number> 변환
 */
export function pointMeasurementsToMap(measurements: PointMeasurement[], category: ClothingCategory = 'tshirt'): Map<string, number> {
  const map = new Map<string, number>();

  type Rule = { starts: string[]; ends: string[]; key: string; transform?: (v: number) => number };

  const topRules: Rule[] = [
    { starts: ['shoulder_end_left'], ends: ['shoulder_end_right'], key: 'shoulderWidth' },
    { starts: ['neck_back_center', 'below_back_neck'], ends: ['hem_center', 'hem_left', 'hem_right'], key: 'totalLength' },
    { starts: ['shoulder_end_left', 'shoulder_end_right', 'shoulder_seam_left', 'shoulder_seam_right'], ends: ['sleeve_end_left', 'sleeve_end_right', 'cuff_left', 'cuff_right'], key: 'sleeveLength' },
    { starts: ['chest_left'], ends: ['chest_right'], key: 'chestWidth' },
    { starts: ['waist_left'], ends: ['waist_right'], key: 'waistCirc', transform: v => v * 2 },
    { starts: ['hem_left'], ends: ['hem_right'], key: 'hemCirc', transform: v => v * 2 },
    { starts: ['armpit_left', 'armpit_right'], ends: ['sleeve_end_left', 'sleeve_end_right', 'cuff_left', 'cuff_right'], key: 'sleeveCirc', transform: v => v * 2 },
    { starts: ['elbow_left'], ends: ['elbow_right'], key: 'elbowCirc', transform: v => v * 2 },
    { starts: ['cuff_left', 'cuff_inner_left'], ends: ['cuff_right', 'cuff_inner_right'], key: 'cuffCirc', transform: v => v * 2 },
  ];

  const pantsRules: Rule[] = [
    { starts: ['waist_left'], ends: ['waist_right'], key: 'waistCirc', transform: v => v * 2 },
    { starts: ['hip_left'], ends: ['hip_right'], key: 'hipCirc', transform: v => v * 2 },
    { starts: ['thigh_left'], ends: ['thigh_right'], key: 'thighCirc', transform: v => v * 2 },
    { starts: ['knee_left'], ends: ['knee_right'], key: 'kneeCirc', transform: v => v * 2 },
    { starts: ['hem_left_outer'], ends: ['hem_left_inner'], key: 'hemCirc', transform: v => v * 2 },
    { starts: ['hem_right_outer'], ends: ['hem_right_inner'], key: 'hemCirc', transform: v => v * 2 },
    { starts: ['rise_top', 'waist_center'], ends: ['crotch', 'inseam_top'], key: 'rise' },
    { starts: ['inseam_top', 'crotch'], ends: ['inseam_bottom_left', 'hem_left_inner', 'hem_right_inner'], key: 'inseam' },
    { starts: ['outseam_top_left', 'waist_left'], ends: ['outseam_bottom_left', 'hem_left_outer', 'hem_right_outer'], key: 'totalLength' },
  ];

  const dressRules: Rule[] = [
    ...topRules,
    { starts: ['hip_left'], ends: ['hip_right'], key: 'hipCirc', transform: v => v * 2 },
    { starts: ['neck_back_center', 'below_back_neck'], ends: ['skirt_hem_center', 'skirt_hem_left', 'skirt_hem_right'], key: 'totalLength' },
    { starts: ['skirt_hem_left'], ends: ['skirt_hem_right'], key: 'hemCirc', transform: v => v * 2 },
  ];

  let rules: Rule[];
  switch (category) {
    case 'pants': rules = pantsRules; break;
    case 'dress': rules = dressRules; break;
    default: rules = topRules; break;
  }

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
