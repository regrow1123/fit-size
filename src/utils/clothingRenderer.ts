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
    chestWidth: toPx((measurements.get('chestCirc') ?? 100) / 2),
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
const TOP_MARGIN = 30;
const CLOTH_COLOR = 'rgba(70, 130, 180, 0.4)';
const CLOTH_OUTLINE = 'rgba(30, 80, 140, 0.85)';
const PANTS_COLOR = 'rgba(70, 130, 180, 0.4)';
const PANTS_OUTLINE = 'rgba(30, 80, 140, 0.85)';
const DRESS_COLOR = 'rgba(170, 70, 130, 0.35)';
const DRESS_OUTLINE = 'rgba(140, 30, 80, 0.85)';

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

// ── Top (tshirt / long_sleeve / jacket) ──
function drawTop(
  ctx: CanvasRenderingContext2D,
  av: AvatarDimensions,
  cl: ClothingDimensions,
  cw: number,
) {
  const cx = cw / 2;
  const sy = TOP_MARGIN + av.shoulderY;
  const isLong = cl.category === 'long_sleeve' || cl.category === 'jacket';

  // All half-widths (center to edge)
  const shH = cl.shoulderWidth / 2;  // 어깨: 전체 너비의 반
  const chH = cl.chestWidth / 2;     // 가슴: 둘레/2의 반 = 정면 반폭
  const hemH = cl.hemWidth / 2;
  const neckH = av.neckWidth / 2;
  const tLen = cl.totalLength;

  // Body Y positions
  const armpitY = sy + tLen * 0.12;  // 겨드랑이
  const chestY = sy + tLen * 0.25;
  const hemY = sy + tLen;

  // Sleeve: hangs down from shoulder, angled slightly outward
  const slLen = cl.sleeveLength;
  const endSlW = isLong ? (cl.cuffWidth ?? cl.sleeveWidth * 0.7) / 2 : cl.sleeveWidth / 2;

  // Sleeve angle from vertical
  const slAngle = isLong ? 0.1 : 0.2;
  const slDx = Math.sin(slAngle) * slLen;
  const slDy = Math.cos(slAngle) * slLen;

  // Sleeve outer/inner endpoints (left side)
  // Outer: shoulder edge outward
  const lOuterStartX = cx - shH;
  const lOuterEndX = lOuterStartX - slDx;
  const lOuterEndY = sy + slDy;
  // Inner: from armpit area (max of chH or slightly inside shoulder)
  const lInnerStartX = cx - Math.max(chH, shH - 5);
  const lInnerEndX = lOuterEndX + endSlW * 2;
  const lInnerEndY = lOuterEndY + 2;

  // Ensure inner end doesn't cross past body
  const lInnerEndXSafe = Math.min(lInnerEndX, lInnerStartX + 2);

  setClothStyle(ctx, CLOTH_COLOR, CLOTH_OUTLINE);

  ctx.beginPath();

  // Start: left neckline
  ctx.moveTo(cx - neckH, sy - 2);
  ctx.lineTo(cx - shH, sy);

  // Left sleeve outer edge (shoulder → sleeve end)
  ctx.bezierCurveTo(
    cx - shH - slDx * 0.4, sy + slDy * 0.3,
    lOuterEndX + endSlW * 0.3, lOuterEndY - slDy * 0.15,
    lOuterEndX, lOuterEndY,
  );

  // Sleeve bottom (outer → inner)
  ctx.lineTo(lInnerEndXSafe, lInnerEndY);

  // Left sleeve inner edge (sleeve end → armpit/chest)
  ctx.bezierCurveTo(
    lInnerEndXSafe + slDx * 0.1, lInnerEndY - slDy * 0.3,
    lInnerStartX - 1, armpitY + (chestY - armpitY) * 0.3,
    lInnerStartX, chestY,
  );

  // Left body: chest → hem
  ctx.bezierCurveTo(
    cx - chH, chestY + tLen * 0.15,
    cx - hemH - 2, hemY - tLen * 0.15,
    cx - hemH, hemY,
  );

  // Bottom hem
  ctx.lineTo(cx + hemH, hemY);

  // Right body: hem → chest (mirror)
  ctx.bezierCurveTo(
    cx + hemH + 2, hemY - tLen * 0.15,
    cx + chH, chestY + tLen * 0.15,
    cx + chH, chestY,
  );

  // Right sleeve (mirror of left)
  const rInnerStartX = cx + Math.max(chH, shH - 5);
  const rOuterEndX = cx + shH + slDx;
  const rOuterEndY = sy + slDy;
  const rInnerEndX = rOuterEndX - endSlW * 2;
  const rInnerEndXSafe = Math.max(rInnerEndX, rInnerStartX - 2);

  // Right sleeve inner edge (chest → sleeve end)
  ctx.bezierCurveTo(
    rInnerStartX + 1, armpitY + (chestY - armpitY) * 0.3,
    rInnerEndXSafe - slDx * 0.1, rOuterEndY + 2 - slDy * 0.3,
    rInnerEndXSafe, rOuterEndY + 2,
  );

  // Sleeve bottom (inner → outer)
  ctx.lineTo(rOuterEndX, rOuterEndY);

  // Right sleeve outer edge (sleeve end → shoulder)
  ctx.bezierCurveTo(
    rOuterEndX - endSlW * 0.3, rOuterEndY - slDy * 0.15,
    cx + shH + slDx * 0.4, sy + slDy * 0.3,
    cx + shH, sy,
  );

  // Right neckline
  ctx.lineTo(cx + neckH, sy - 2);
  ctx.quadraticCurveTo(cx, sy + 10, cx - neckH, sy - 2);

  ctx.closePath();
  ctx.fill();
  ctx.stroke();
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
  const waistY = TOP_MARGIN + av.shoulderY + av.torsoHeight;

  const wH = (cl.waistWidth ?? av.hipWidth * 0.9) / 2;
  const hipH = (cl.hipWidth ?? av.hipWidth) / 2;
  const thH = (cl.thighWidth ?? av.legWidth * 1.5) / 2;
  const knH = (cl.kneeWidth ?? av.legWidth * 1.2) / 2;
  const hemH = cl.hemWidth / 2;
  const rise = cl.rise ?? av.torsoHeight * 0.3;
  const tLen = cl.totalLength;

  const crotchY = waistY + rise;
  const hemY = waistY + tLen;
  const kneeY = crotchY + (hemY - crotchY) * 0.45;
  const hipY = waistY + rise * 0.5;

  // Leg separation
  const legSpread = av.hipWidth * 0.22;

  setClothStyle(ctx, PANTS_COLOR, PANTS_OUTLINE);

  // Draw LEFT leg
  ctx.beginPath();
  ctx.moveTo(cx - wH, waistY);
  // Waist to hip
  ctx.bezierCurveTo(cx - wH - 2, waistY + rise * 0.2, cx - hipH - 2, hipY - rise * 0.1, cx - hipH, hipY);
  // Hip to thigh
  ctx.bezierCurveTo(cx - hipH, hipY + rise * 0.2, cx - thH - 2, crotchY - rise * 0.1, cx - thH, crotchY);
  // Thigh to knee
  ctx.bezierCurveTo(cx - thH + 1, crotchY + (kneeY - crotchY) * 0.3, cx - knH - 1, kneeY - (kneeY - crotchY) * 0.2, cx - knH, kneeY);
  // Knee to hem
  ctx.bezierCurveTo(cx - knH + 1, kneeY + (hemY - kneeY) * 0.3, cx - hemH - 1, hemY - (hemY - kneeY) * 0.2, cx - hemH, hemY);
  // Bottom of left leg
  ctx.lineTo(cx - legSpread, hemY);
  // Inner leg up to crotch
  ctx.bezierCurveTo(cx - legSpread, hemY - tLen * 0.2, cx - legSpread, crotchY + 10, cx - legSpread * 0.3, crotchY + 5);
  // Crotch curve
  ctx.quadraticCurveTo(cx, crotchY - 3, cx + legSpread * 0.3, crotchY + 5);
  // Inner right leg down
  ctx.bezierCurveTo(cx + legSpread, crotchY + 10, cx + legSpread, hemY - tLen * 0.2, cx + legSpread, hemY);
  // Bottom of right leg
  ctx.lineTo(cx + hemH, hemY);
  // Right knee
  ctx.bezierCurveTo(cx + hemH + 1, hemY - (hemY - kneeY) * 0.2, cx + knH - 1, kneeY + (hemY - kneeY) * 0.3, cx + knH, kneeY);
  // Right thigh
  ctx.bezierCurveTo(cx + knH + 1, kneeY - (kneeY - crotchY) * 0.2, cx + thH - 1, crotchY + (kneeY - crotchY) * 0.3, cx + thH, crotchY);
  // Right hip
  ctx.bezierCurveTo(cx + thH + 2, crotchY - rise * 0.1, cx + hipH, hipY + rise * 0.2, cx + hipH, hipY);
  // Right waist
  ctx.bezierCurveTo(cx + hipH + 2, hipY - rise * 0.1, cx + wH + 2, waistY + rise * 0.2, cx + wH, waistY);
  // Top
  ctx.lineTo(cx - wH, waistY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  // Fit indicators
  const scale = pxToCmScale(av);
  const badges: FitBadge[] = [
    { label: '허리', diffCm: ((cl.waistWidth ?? 0) - av.waistWidth) * scale, x: cx + wH + 8, y: waistY + 8 },
    { label: '엉덩이', diffCm: ((cl.hipWidth ?? 0) - av.hipWidth) * scale, x: cx + hipH + 8, y: hipY + 5 },
    { label: '허벅지', diffCm: ((cl.thighWidth ?? 0) - av.legWidth * 1.3) * scale, x: cx + thH + 8, y: crotchY + 5 },
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
  const sy = TOP_MARGIN + av.shoulderY;

  const shH = cl.shoulderWidth / 2;
  const chH = cl.chestWidth / 2;
  const neckH = av.neckWidth / 2;
  const waistH = chH * 0.85;
  const hipH = (cl.hipWidth ?? chH * 1.1) / 2;
  const hemH = cl.hemWidth / 2;
  const tLen = cl.totalLength;
  const slLen = cl.sleeveLength;
  const slW = cl.sleeveWidth / 2;

  const waistAt = tLen * 0.35;
  const hipAt = tLen * 0.45;
  const hemY = sy + tLen;

  setClothStyle(ctx, DRESS_COLOR, DRESS_OUTLINE);

  ctx.beginPath();
  ctx.moveTo(cx - neckH, sy - 2);
  ctx.lineTo(cx - shH, sy);

  // Left sleeve (short)
  const slDy = slLen * 0.85;
  const slDx = slLen * 0.25;
  ctx.bezierCurveTo(cx - shH - slDx * 0.5, sy + slDy * 0.3, cx - shH - slDx, slDy + sy - slDy * 0.1, cx - shH - slDx, sy + slDy);
  ctx.lineTo(cx - shH - slDx + slW * 2, sy + slDy + 2);
  ctx.bezierCurveTo(cx - chH - 2, sy + slDy * 0.5, cx - chH, sy + waistAt * 0.5, cx - chH, sy + waistAt * 0.7);

  // Left body contour
  ctx.bezierCurveTo(cx - waistH - 1, sy + waistAt, cx - waistH, sy + waistAt, cx - waistH, sy + waistAt);
  ctx.bezierCurveTo(cx - waistH - 2, sy + hipAt * 0.9, cx - hipH - 3, sy + hipAt, cx - hipH, sy + hipAt);

  // Skirt flare
  ctx.bezierCurveTo(cx - hipH - 5, sy + tLen * 0.7, cx - hemH - 3, hemY - tLen * 0.1, cx - hemH, hemY);
  ctx.lineTo(cx + hemH, hemY);
  // Right skirt
  ctx.bezierCurveTo(cx + hemH + 3, hemY - tLen * 0.1, cx + hipH + 5, sy + tLen * 0.7, cx + hipH, sy + hipAt);
  ctx.bezierCurveTo(cx + hipH + 3, sy + hipAt, cx + waistH + 2, sy + hipAt * 0.9, cx + waistH, sy + waistAt);
  ctx.bezierCurveTo(cx + waistH, sy + waistAt, cx + waistH + 1, sy + waistAt, cx + chH, sy + waistAt * 0.7);

  // Right sleeve
  ctx.bezierCurveTo(cx + chH, sy + waistAt * 0.5, cx + chH + 2, sy + slDy * 0.5, cx + shH + slDx - slW * 2, sy + slDy + 2);
  ctx.lineTo(cx + shH + slDx, sy + slDy);
  ctx.bezierCurveTo(cx + shH + slDx, sy + slDy - slDy * 0.1, cx + shH + slDx * 0.5, sy + slDy * 0.3, cx + shH, sy);

  ctx.lineTo(cx + neckH, sy - 2);
  ctx.quadraticCurveTo(cx, sy + 10, cx - neckH, sy - 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  drawFitBadges(ctx, av, cl, cx, sy);
}

// ── Styling helper ──
function setClothStyle(ctx: CanvasRenderingContext2D, fill: string, stroke: string) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
}

// ── Fit badges ──
interface FitBadge {
  label: string;
  diffCm: number;
  x: number;
  y: number;
}

function pxToCmScale(av: AvatarDimensions): number {
  // Convert px diff back to cm
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
  const chestY = shoulderY + av.torsoHeight * 0.25;

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
    const bx = b.x;
    const by = b.y;

    // Badge background
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(bx, by - py - 6, tw + px * 2, 16 + py, 4);
    ctx.fill();

    // Badge border
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Badge text
    ctx.fillStyle = color;
    ctx.fillText(text, bx + px, by + 2);
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
    { starts: ['chest_left'], ends: ['chest_right'], key: 'chestCirc', transform: v => v * 2 },
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
