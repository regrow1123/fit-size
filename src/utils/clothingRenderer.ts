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

// ── Constants ──

const COLORS = {
  top: { fill: 'rgba(70, 130, 180, 0.35)', stroke: 'rgba(30, 80, 140, 0.8)' },
  pants: { fill: 'rgba(80, 120, 160, 0.35)', stroke: 'rgba(30, 70, 130, 0.8)' },
  dress: { fill: 'rgba(160, 70, 120, 0.3)', stroke: 'rgba(130, 30, 70, 0.8)' },
};

/**
 * Canvas에 옷을 아바타 위에 오버레이
 */
export function drawClothing(
  ctx: CanvasRenderingContext2D,
  avatarDims: AvatarDimensions,
  clothingDims: ClothingDimensions,
  canvasWidth: number,
) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  switch (clothingDims.category) {
    case 'pants':
      drawPants(ctx, avatarDims, clothingDims, canvasWidth);
      break;
    case 'dress':
      drawDress(ctx, avatarDims, clothingDims, canvasWidth);
      break;
    default:
      drawTop(ctx, avatarDims, clothingDims, canvasWidth);
      break;
  }

  ctx.restore();
}

// ── Helpers ──
function setStyle(ctx: CanvasRenderingContext2D, colors: { fill: string; stroke: string }, dashed = true) {
  ctx.fillStyle = colors.fill;
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 1.8;
  if (dashed) ctx.setLineDash([5, 4]);
  else ctx.setLineDash([]);
}

// ── Top (tshirt / long_sleeve / jacket) ──
function drawTop(
  ctx: CanvasRenderingContext2D,
  av: AvatarDimensions,
  cl: ClothingDimensions,
  cw: number,
) {
  const cx = cw / 2;
  const sy = av.shoulderY;
  const isLong = cl.category === 'long_sleeve' || cl.category === 'jacket';
  const colors = COLORS.top;

  // Half widths
  const shH = cl.shoulderWidth / 2;
  const chH = cl.chestWidth / 2;
  const hemH = cl.hemWidth / 2;
  const neckH = av.neckWidth / 2;
  const tLen = cl.totalLength;

  // Y positions
  const armpitY = sy + tLen * 0.15;
  const chestY = sy + tLen * 0.25;
  const waistY = sy + tLen * 0.6;
  const hemY = sy + tLen;

  // ── 1. Draw torso (body part) ──
  setStyle(ctx, colors);
  ctx.beginPath();

  // Neckline
  ctx.moveTo(cx - neckH, sy - 3);
  ctx.quadraticCurveTo(cx, sy + 8, cx + neckH, sy - 3);

  // Right side: shoulder → chest → waist → hem
  ctx.lineTo(cx + shH, sy);
  ctx.bezierCurveTo(cx + shH, armpitY, cx + chH, armpitY, cx + chH, chestY);
  ctx.bezierCurveTo(cx + chH, waistY * 0.6 + chestY * 0.4, cx + hemH, waistY, cx + hemH, hemY);

  // Hem
  ctx.lineTo(cx - hemH, hemY);

  // Left side: hem → waist → chest → shoulder
  ctx.bezierCurveTo(cx - hemH, waistY, cx - chH, waistY * 0.6 + chestY * 0.4, cx - chH, chestY);
  ctx.bezierCurveTo(cx - chH, armpitY, cx - shH, armpitY, cx - shH, sy);

  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ── 2. Draw sleeves (separate shapes on top) ──
  const slLen = cl.sleeveLength;
  const slTopW = cl.sleeveWidth;
  const slEndW = isLong ? (cl.cuffWidth ?? slTopW * 0.6) : slTopW;

  // Sleeve angle: short sleeves flare outward more
  const angle = isLong ? 0.25 : 0.4; // radians from vertical

  for (const side of [-1, 1] as const) {
    const shoulderX = cx + side * shH;
    const armpitX = cx + side * Math.max(chH, shH - 4);

    // Sleeve direction vector
    const dx = Math.sin(angle) * slLen * side;
    const dy = Math.cos(angle) * slLen;

    // Sleeve tip center
    const tipX = shoulderX + dx;
    const tipY = sy + dy;

    // Perpendicular to sleeve direction for width
    const perpX = Math.cos(angle) * side;
    const perpY = -Math.sin(angle);

    // Top and bottom edges of sleeve
    const outerTopX = shoulderX;
    const outerTopY = sy;
    const outerEndX = tipX + perpX * slEndW / 2;
    const outerEndY = tipY + perpY * slEndW / 2;

    const innerTopX = armpitX;
    const innerTopY = armpitY;
    const innerEndX = tipX - perpX * slEndW / 2;
    const innerEndY = tipY - perpY * slEndW / 2;

    setStyle(ctx, colors);
    ctx.beginPath();
    ctx.moveTo(outerTopX, outerTopY);

    // Outer edge: shoulder to tip
    ctx.bezierCurveTo(
      outerTopX + dx * 0.3, outerTopY + dy * 0.3,
      outerEndX - dx * 0.2, outerEndY - dy * 0.2,
      outerEndX, outerEndY,
    );

    // Sleeve end cap
    ctx.lineTo(innerEndX, innerEndY);

    // Inner edge: tip to armpit
    ctx.bezierCurveTo(
      innerEndX - dx * 0.2, innerEndY - dy * 0.2,
      innerTopX + dx * 0.1, innerTopY + dy * 0.3,
      innerTopX, innerTopY,
    );

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.setLineDash([]);
  drawFitBadges(ctx, av, cl, cx, sy);
}

// ── Pants ──
function drawPants(
  ctx: CanvasRenderingContext2D,
  av: AvatarDimensions,
  cl: ClothingDimensions,
  cw: number,
) {
  const cx = cw / 2;
  const waistY = av.shoulderY + (av.crotchY - av.shoulderY);
  const colors = COLORS.pants;

  const wH = (cl.waistWidth ?? av.hipWidth * 0.9) / 2;
  const hipH = (cl.hipWidth ?? av.hipWidth) / 2;
  const thH = (cl.thighWidth ?? av.thighWidth * 1.5) / 2;
  const knH = (cl.kneeWidth ?? av.thighWidth * 1.2) / 2;
  const hemH = cl.hemWidth / 2;
  const rise = cl.rise ?? (av.crotchY - av.shoulderY) * 0.3;
  const tLen = cl.totalLength;

  const hipY = waistY + rise * 0.45;
  const crotchY = waistY + rise;
  const hemY = waistY + tLen;
  const kneeY = crotchY + (hemY - crotchY) * 0.45;

  // Inner leg gap
  const gap = av.thighWidth * 0.4;

  setStyle(ctx, colors);

  // Draw each leg separately then connect at waist
  for (const side of [-1, 1] as const) {
    ctx.beginPath();

    // Waist
    ctx.moveTo(cx, waistY);
    ctx.lineTo(cx + side * wH, waistY);

    // Outer: waist → hip → thigh → knee → hem
    ctx.bezierCurveTo(
      cx + side * (wH + 1), waistY + rise * 0.2,
      cx + side * (hipH + 1), hipY - rise * 0.1,
      cx + side * hipH, hipY,
    );
    ctx.bezierCurveTo(
      cx + side * hipH, hipY + rise * 0.3,
      cx + side * thH, crotchY - rise * 0.1,
      cx + side * thH, crotchY,
    );
    ctx.bezierCurveTo(
      cx + side * thH, crotchY + (kneeY - crotchY) * 0.3,
      cx + side * knH, kneeY - (kneeY - crotchY) * 0.2,
      cx + side * knH, kneeY,
    );
    ctx.bezierCurveTo(
      cx + side * knH, kneeY + (hemY - kneeY) * 0.3,
      cx + side * hemH, hemY - (hemY - kneeY) * 0.2,
      cx + side * hemH, hemY,
    );

    // Hem bottom
    ctx.lineTo(cx + side * gap, hemY);

    // Inner: hem → crotch
    ctx.bezierCurveTo(
      cx + side * gap, hemY - (hemY - crotchY) * 0.3,
      cx + side * gap, crotchY + 15,
      cx, crotchY + 3,
    );

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Waistband accent line
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(cx - wH, waistY);
  ctx.lineTo(cx + wH, waistY);
  ctx.strokeStyle = colors.stroke;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Fit badges
  const scale = pxToCmScale(av);
  const badges: FitBadge[] = [
    { label: '허리', diffCm: ((cl.waistWidth ?? 0) - av.waistWidth) * scale, x: cx + wH + 8, y: waistY + 8 },
    { label: '엉덩이', diffCm: ((cl.hipWidth ?? 0) - av.hipWidth) * scale, x: cx + hipH + 8, y: hipY + 5 },
    { label: '허벅지', diffCm: ((cl.thighWidth ?? 0) - av.thighWidth * 1.3) * scale, x: cx + thH + 8, y: crotchY + 5 },
  ];
  drawBadges(ctx, badges);
}

// ── Dress ──
function drawDress(
  ctx: CanvasRenderingContext2D,
  av: AvatarDimensions,
  cl: ClothingDimensions,
  cw: number,
) {
  const cx = cw / 2;
  const sy = av.shoulderY;
  const colors = COLORS.dress;

  const shH = cl.shoulderWidth / 2;
  const chH = cl.chestWidth / 2;
  const neckH = av.neckWidth / 2;
  const waistH = chH * 0.85;
  const hipH = (cl.hipWidth ?? chH * 1.1) / 2;
  const hemH = cl.hemWidth / 2;
  const tLen = cl.totalLength;

  const armpitY = sy + tLen * 0.1;
  const chestY = sy + tLen * 0.15;
  const waistY = sy + tLen * 0.35;
  const hipY = sy + tLen * 0.45;
  const hemY = sy + tLen;

  // ── Torso + skirt ──
  setStyle(ctx, colors);
  ctx.beginPath();

  // Neckline
  ctx.moveTo(cx - neckH, sy - 3);
  ctx.quadraticCurveTo(cx, sy + 8, cx + neckH, sy - 3);

  // Right side
  ctx.lineTo(cx + shH, sy);
  ctx.bezierCurveTo(cx + shH, armpitY, cx + chH, armpitY, cx + chH, chestY);
  ctx.bezierCurveTo(cx + chH, waistY * 0.7 + chestY * 0.3, cx + waistH, waistY, cx + waistH, waistY);
  ctx.bezierCurveTo(cx + waistH + 1, hipY * 0.5 + waistY * 0.5, cx + hipH, hipY, cx + hipH, hipY);
  ctx.bezierCurveTo(cx + hipH + 3, (hipY + hemY) / 2, cx + hemH + 2, hemY - tLen * 0.08, cx + hemH, hemY);

  // Hem
  ctx.lineTo(cx - hemH, hemY);

  // Left side (mirror)
  ctx.bezierCurveTo(cx - hemH - 2, hemY - tLen * 0.08, cx - hipH - 3, (hipY + hemY) / 2, cx - hipH, hipY);
  ctx.bezierCurveTo(cx - hipH, hipY, cx - waistH - 1, hipY * 0.5 + waistY * 0.5, cx - waistH, waistY);
  ctx.bezierCurveTo(cx - waistH, waistY, cx - chH, waistY * 0.7 + chestY * 0.3, cx - chH, chestY);
  ctx.bezierCurveTo(cx - chH, armpitY, cx - shH, armpitY, cx - shH, sy);

  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ── Short sleeves ──
  const slLen = cl.sleeveLength;
  const slW = cl.sleeveWidth;
  const angle = 0.4;

  for (const side of [-1, 1] as const) {
    const shoulderX = cx + side * shH;
    const armpitX = cx + side * Math.max(chH, shH - 4);
    const dx = Math.sin(angle) * slLen * side;
    const dy = Math.cos(angle) * slLen;
    const tipX = shoulderX + dx;
    const tipY = sy + dy;
    const perpX = Math.cos(angle) * side;
    const perpY = -Math.sin(angle);

    setStyle(ctx, colors);
    ctx.beginPath();
    ctx.moveTo(shoulderX, sy);
    ctx.bezierCurveTo(
      shoulderX + dx * 0.3, sy + dy * 0.3,
      tipX + perpX * slW / 2 - dx * 0.2, tipY + perpY * slW / 2 - dy * 0.2,
      tipX + perpX * slW / 2, tipY + perpY * slW / 2,
    );
    ctx.lineTo(tipX - perpX * slW / 2, tipY - perpY * slW / 2);
    ctx.bezierCurveTo(
      tipX - perpX * slW / 2 - dx * 0.2, tipY - perpY * slW / 2 - dy * 0.2,
      armpitX + dx * 0.1, armpitY + dy * 0.3,
      armpitX, armpitY,
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.setLineDash([]);
  drawFitBadges(ctx, av, cl, cx, sy);
}

// ── Fit badges ──
interface FitBadge {
  label: string;
  diffCm: number;
  x: number;
  y: number;
}

function pxToCmScale(av: AvatarDimensions): number {
  return 1 / ((av.totalHeight / 180) * (600 / 180));
}

function drawFitBadges(
  ctx: CanvasRenderingContext2D,
  av: AvatarDimensions,
  cl: ClothingDimensions,
  cx: number,
  shoulderY: number,
) {
  const scale = pxToCmScale(av);
  const chestY = shoulderY + (av.crotchY - av.shoulderY) * 0.25;

  const badges: FitBadge[] = [
    { label: '어깨', diffCm: (cl.shoulderWidth - av.shoulderWidth) * scale, x: cx + cl.shoulderWidth / 2 + 8, y: shoulderY + 5 },
    { label: '가슴', diffCm: (cl.chestWidth - av.chestWidth) * scale, x: cx + Math.max(cl.chestWidth, av.chestWidth) / 2 + 8, y: chestY },
    { label: '밑단', diffCm: (cl.hemWidth - av.waistWidth) * scale, x: cx + Math.max(cl.hemWidth, av.waistWidth) / 2 + 8, y: shoulderY + cl.totalLength - 5 },
  ];
  drawBadges(ctx, badges);
}

function drawBadges(ctx: CanvasRenderingContext2D, badges: FitBadge[]) {
  ctx.setLineDash([]);
  ctx.textBaseline = 'middle';

  for (const b of badges) {
    const d = b.diffCm;
    let color: string;
    let bgColor: string;
    let status: string;

    if (d > 3) {
      color = '#92400E'; bgColor = 'rgba(253, 230, 138, 0.9)'; status = '여유';
    } else if (d >= -1) {
      color = '#065F46'; bgColor = 'rgba(167, 243, 208, 0.9)'; status = '적당';
    } else {
      color = '#991B1B'; bgColor = 'rgba(254, 202, 202, 0.9)'; status = '빡빡';
    }

    const sign = d > 0 ? '+' : '';
    const text = `${b.label} ${status} ${sign}${d.toFixed(1)}`;

    ctx.font = 'bold 11px system-ui, sans-serif';
    const tw = ctx.measureText(text).width;
    const px = 6, py = 4;

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y - py - 6, tw + px * 2, 16 + py, 4);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.fillText(text, b.x + px, b.y + 2);
  }
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
