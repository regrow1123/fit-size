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

/**
 * Canvas에 옷을 아바타 위에 오버레이
 */
export function drawClothing(
  ctx: CanvasRenderingContext2D,
  avatarDims: AvatarDimensions,
  clothingDims: ClothingDimensions,
  canvasWidth: number,
) {
  switch (clothingDims.category) {
    case 'pants':
      drawPantsOverlay(ctx, avatarDims, clothingDims, canvasWidth);
      break;
    case 'dress':
      drawDressOverlay(ctx, avatarDims, clothingDims, canvasWidth);
      break;
    case 'tshirt':
    case 'long_sleeve':
    case 'jacket':
    default:
      drawTopOverlay(ctx, avatarDims, clothingDims, canvasWidth);
      break;
  }
}

function drawTopOverlay(
  ctx: CanvasRenderingContext2D,
  avatarDims: AvatarDimensions,
  clothingDims: ClothingDimensions,
  canvasWidth: number,
) {
  const cx = canvasWidth / 2;
  const topMargin = 20;
  const shoulderY = topMargin + avatarDims.shoulderY;
  const clothColor = 'rgba(70, 130, 180, 0.45)';
  const clothOutline = 'rgba(30, 80, 140, 0.9)';

  ctx.fillStyle = clothColor;
  ctx.strokeStyle = clothOutline;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 3]);

  const shHalf = clothingDims.shoulderWidth / 2;
  const chHalf = clothingDims.chestWidth / 2;
  const hemHalf = clothingDims.hemWidth / 2;
  const totalLen = clothingDims.totalLength;
  const isLong = clothingDims.category === 'long_sleeve' || clothingDims.category === 'jacket';

  ctx.beginPath();
  ctx.moveTo(cx - avatarDims.neckWidth / 2, shoulderY - 3);
  ctx.lineTo(cx - shHalf, shoulderY);

  if (isLong) {
    // Long sleeve: angled down further
    const slEndY = shoulderY + clothingDims.sleeveLength * 0.9;
    const slEndX = cx - shHalf - clothingDims.sleeveLength * 0.5;
    const cuffW = clothingDims.cuffWidth ?? clothingDims.sleeveWidth * 0.7;
    ctx.lineTo(slEndX, slEndY);
    ctx.lineTo(slEndX + cuffW, slEndY + 3);
    ctx.lineTo(cx - chHalf, shoulderY + clothingDims.sleeveLength * 0.35);
  } else {
    const sleeveY = shoulderY + clothingDims.sleeveLength * 0.8;
    ctx.lineTo(cx - shHalf - clothingDims.sleeveLength * 0.3, sleeveY);
    ctx.lineTo(cx - shHalf - clothingDims.sleeveLength * 0.3 + clothingDims.sleeveWidth, sleeveY + 3);
    ctx.lineTo(cx - chHalf, shoulderY + clothingDims.sleeveLength * 0.5);
  }

  ctx.lineTo(cx - hemHalf, shoulderY + totalLen);
  ctx.lineTo(cx + hemHalf, shoulderY + totalLen);

  if (isLong) {
    ctx.lineTo(cx + chHalf, shoulderY + clothingDims.sleeveLength * 0.35);
    const slEndY = shoulderY + clothingDims.sleeveLength * 0.9;
    const slEndX = cx + shHalf + clothingDims.sleeveLength * 0.5;
    const cuffW = clothingDims.cuffWidth ?? clothingDims.sleeveWidth * 0.7;
    ctx.lineTo(slEndX - cuffW, slEndY + 3);
    ctx.lineTo(slEndX, slEndY);
  } else {
    ctx.lineTo(cx + chHalf, shoulderY + clothingDims.sleeveLength * 0.5);
    const sleeveY = shoulderY + clothingDims.sleeveLength * 0.8;
    ctx.lineTo(cx + shHalf + clothingDims.sleeveLength * 0.3 - clothingDims.sleeveWidth, sleeveY + 3);
    ctx.lineTo(cx + shHalf + clothingDims.sleeveLength * 0.3, sleeveY);
  }

  ctx.lineTo(cx + shHalf, shoulderY);
  ctx.lineTo(cx + avatarDims.neckWidth / 2, shoulderY - 3);
  ctx.quadraticCurveTo(cx, shoulderY + 8, cx - avatarDims.neckWidth / 2, shoulderY - 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  drawFitIndicators(ctx, avatarDims, clothingDims, cx, shoulderY);
}

function drawPantsOverlay(
  ctx: CanvasRenderingContext2D,
  avatarDims: AvatarDimensions,
  clothingDims: ClothingDimensions,
  canvasWidth: number,
) {
  const cx = canvasWidth / 2;
  const topMargin = 20;
  const waistY = topMargin + avatarDims.shoulderY + avatarDims.torsoHeight;
  const clothColor = 'rgba(70, 130, 180, 0.45)';
  const clothOutline = 'rgba(30, 80, 140, 0.9)';

  const waistHalf = (clothingDims.waistWidth ?? avatarDims.hipWidth * 0.9) / 2;
  const hipHalf = (clothingDims.hipWidth ?? avatarDims.hipWidth) / 2;
  const thighHalf = (clothingDims.thighWidth ?? avatarDims.legWidth * 1.5) / 2;
  const kneeHalf = (clothingDims.kneeWidth ?? avatarDims.legWidth * 1.2) / 2;
  const hemHalf = clothingDims.hemWidth / 2;
  const rise = clothingDims.rise ?? avatarDims.torsoHeight * 0.3;
  const totalLen = clothingDims.totalLength;
  const crotchY = waistY + rise;
  const hemY = waistY + totalLen;
  const kneeY = crotchY + (hemY - crotchY) * 0.45;
  const legGap = avatarDims.legWidth * 0.3;

  ctx.fillStyle = clothColor;
  ctx.strokeStyle = clothOutline;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 3]);

  ctx.beginPath();
  // Waist
  ctx.moveTo(cx - waistHalf, waistY);
  ctx.lineTo(cx + waistHalf, waistY);
  // Right hip
  ctx.lineTo(cx + hipHalf, waistY + rise * 0.5);
  // Right thigh
  ctx.lineTo(cx + thighHalf, crotchY);
  // Right knee
  ctx.lineTo(cx + kneeHalf, kneeY);
  // Right hem
  ctx.lineTo(cx + hemHalf, hemY);
  ctx.lineTo(cx + legGap, hemY);
  // Crotch right
  ctx.lineTo(cx + legGap, crotchY + 5);
  ctx.quadraticCurveTo(cx, crotchY - 5, cx - legGap, crotchY + 5);
  // Left inner leg
  ctx.lineTo(cx - legGap, hemY);
  ctx.lineTo(cx - hemHalf, hemY);
  // Left knee
  ctx.lineTo(cx - kneeHalf, kneeY);
  // Left thigh
  ctx.lineTo(cx - thighHalf, crotchY);
  ctx.lineTo(cx - hipHalf, waistY + rise * 0.5);
  ctx.lineTo(cx - waistHalf, waistY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  // Fit indicators for pants
  const indicators: { label: string; diff: number; x: number; y: number }[] = [
    { label: '허리', diff: (clothingDims.waistWidth ?? 0) - avatarDims.hipWidth * 0.85, x: cx + waistHalf + 10, y: waistY + 10 },
    { label: '엉덩이', diff: (clothingDims.hipWidth ?? 0) - avatarDims.hipWidth, x: cx + hipHalf + 10, y: waistY + rise * 0.5 },
  ];
  drawIndicatorList(ctx, indicators, avatarDims);
}

function drawDressOverlay(
  ctx: CanvasRenderingContext2D,
  avatarDims: AvatarDimensions,
  clothingDims: ClothingDimensions,
  canvasWidth: number,
) {
  const cx = canvasWidth / 2;
  const topMargin = 20;
  const shoulderY = topMargin + avatarDims.shoulderY;
  const clothColor = 'rgba(180, 70, 130, 0.4)';
  const clothOutline = 'rgba(140, 30, 80, 0.9)';

  const shHalf = clothingDims.shoulderWidth / 2;
  const chHalf = clothingDims.chestWidth / 2;
  const waistHalf = chHalf * 0.85;
  const hipHalf = (clothingDims.hipWidth ?? chHalf * 1.1) / 2;
  const hemHalf = clothingDims.hemWidth / 2;
  const totalLen = clothingDims.totalLength;
  const waistAt = totalLen * 0.35;
  const hipAt = totalLen * 0.45;

  ctx.fillStyle = clothColor;
  ctx.strokeStyle = clothOutline;
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 3]);

  ctx.beginPath();
  ctx.moveTo(cx - avatarDims.neckWidth / 2, shoulderY - 3);
  ctx.lineTo(cx - shHalf, shoulderY);
  // Short sleeves
  const sleeveY = shoulderY + clothingDims.sleeveLength * 0.8;
  ctx.lineTo(cx - shHalf - clothingDims.sleeveLength * 0.2, sleeveY);
  ctx.lineTo(cx - chHalf, shoulderY + clothingDims.sleeveLength * 0.5);
  // Body to waist
  ctx.lineTo(cx - waistHalf, shoulderY + waistAt);
  // Hip flare
  ctx.lineTo(cx - hipHalf, shoulderY + hipAt);
  // Skirt hem
  ctx.quadraticCurveTo(cx - hemHalf * 1.1, shoulderY + totalLen * 0.8, cx - hemHalf, shoulderY + totalLen);
  ctx.lineTo(cx + hemHalf, shoulderY + totalLen);
  ctx.quadraticCurveTo(cx + hemHalf * 1.1, shoulderY + totalLen * 0.8, cx + hipHalf, shoulderY + hipAt);
  // Mirror right side
  ctx.lineTo(cx + waistHalf, shoulderY + waistAt);
  ctx.lineTo(cx + chHalf, shoulderY + clothingDims.sleeveLength * 0.5);
  ctx.lineTo(cx + shHalf + clothingDims.sleeveLength * 0.2, sleeveY);
  ctx.lineTo(cx + shHalf, shoulderY);
  ctx.lineTo(cx + avatarDims.neckWidth / 2, shoulderY - 3);
  ctx.quadraticCurveTo(cx, shoulderY + 8, cx - avatarDims.neckWidth / 2, shoulderY - 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  drawFitIndicators(ctx, avatarDims, clothingDims, cx, shoulderY);
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

function drawFitIndicators(
  ctx: CanvasRenderingContext2D,
  avatar: AvatarDimensions,
  clothing: ClothingDimensions,
  cx: number,
  shoulderY: number,
) {
  const indicators: { label: string; diff: number; x: number; y: number }[] = [
    { label: '어깨', diff: clothing.shoulderWidth - avatar.shoulderWidth, x: cx + avatar.shoulderWidth / 2 + 20, y: shoulderY + 5 },
    { label: '가슴', diff: clothing.chestWidth - avatar.chestWidth, x: cx + avatar.chestWidth / 2 + 20, y: shoulderY + avatar.torsoHeight * 0.3 },
  ];
  drawIndicatorList(ctx, indicators, avatar);
}

function drawIndicatorList(
  ctx: CanvasRenderingContext2D,
  indicators: { label: string; diff: number; x: number; y: number }[],
  avatar: AvatarDimensions,
) {
  ctx.font = '12px sans-serif';
  ctx.setLineDash([]);

  for (const ind of indicators) {
    const diffCm = ind.diff / ((avatar.totalHeight / 180) * (600 / 180));
    let color: string;
    let text: string;

    if (diffCm > 3) {
      color = '#F59E0B';
      text = `${ind.label}: 여유 +${diffCm.toFixed(1)}cm`;
    } else if (diffCm >= -1) {
      color = '#10B981';
      text = `${ind.label}: 적당 ${diffCm > 0 ? '+' : ''}${diffCm.toFixed(1)}cm`;
    } else {
      color = '#EF4444';
      text = `${ind.label}: 빡빡 ${diffCm.toFixed(1)}cm`;
    }

    ctx.fillStyle = color;
    ctx.fillText(text, ind.x, ind.y);
  }
}
