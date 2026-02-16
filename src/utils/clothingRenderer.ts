import type { AvatarDimensions, ClothingDimensions } from '../types';
import { cmToPx } from './avatarCalculator';

/**
 * 옷 실측치(cm)를 px로 변환
 */
export function calculateClothingDimensions(
  measurements: Map<string, number>,
  bodyHeight: number,
): ClothingDimensions {
  const toPx = (cm: number) => cmToPx(cm, bodyHeight);

  return {
    shoulderWidth: toPx(measurements.get('shoulderWidth') ?? 45),
    chestWidth: toPx((measurements.get('chestCirc') ?? 100) / Math.PI),
    totalLength: toPx(measurements.get('totalLength') ?? 70),
    sleeveLength: toPx(measurements.get('sleeveLength') ?? 22),
    sleeveWidth: toPx((measurements.get('sleeveCirc') ?? 36) / Math.PI),
    hemWidth: toPx((measurements.get('hemCirc') ?? 100) / Math.PI),
  };
}

/**
 * Canvas에 상의(티셔츠)를 아바타 위에 오버레이
 */
export function drawClothing(
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

  // 몸통 부분
  ctx.beginPath();
  // 목 부분 (V넥 근사)
  ctx.moveTo(cx - avatarDims.neckWidth / 2, shoulderY - 3);
  // 왼쪽 어깨
  ctx.lineTo(cx - shHalf, shoulderY);
  // 왼쪽 소매
  const sleeveY = shoulderY + clothingDims.sleeveLength * 0.8;
  ctx.lineTo(cx - shHalf - clothingDims.sleeveLength * 0.3, sleeveY);
  // 소매 끝
  ctx.lineTo(cx - shHalf - clothingDims.sleeveLength * 0.3 + clothingDims.sleeveWidth, sleeveY + 3);
  // 겨드랑이
  ctx.lineTo(cx - chHalf, shoulderY + clothingDims.sleeveLength * 0.5);
  // 밑단 왼쪽
  ctx.lineTo(cx - hemHalf, shoulderY + totalLen);
  // 밑단 오른쪽
  ctx.lineTo(cx + hemHalf, shoulderY + totalLen);
  // 겨드랑이 오른쪽
  ctx.lineTo(cx + chHalf, shoulderY + clothingDims.sleeveLength * 0.5);
  // 오른쪽 소매
  ctx.lineTo(cx + shHalf + clothingDims.sleeveLength * 0.3 - clothingDims.sleeveWidth, sleeveY + 3);
  ctx.lineTo(cx + shHalf + clothingDims.sleeveLength * 0.3, sleeveY);
  // 오른쪽 어깨
  ctx.lineTo(cx + shHalf, shoulderY);
  // 목 오른쪽
  ctx.lineTo(cx + avatarDims.neckWidth / 2, shoulderY - 3);
  // 목라인
  ctx.quadraticCurveTo(cx, shoulderY + 8, cx - avatarDims.neckWidth / 2, shoulderY - 3);

  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  // 피팅 판정 표시
  drawFitIndicators(ctx, avatarDims, clothingDims, cx, shoulderY);
}

/**
 * 피팅 상태 인디케이터 (여유/딱 맞음/빡빡함)
 */
function drawFitIndicators(
  ctx: CanvasRenderingContext2D,
  avatar: AvatarDimensions,
  clothing: ClothingDimensions,
  cx: number,
  shoulderY: number,
) {
  const indicators: { label: string; diff: number; x: number; y: number }[] = [
    {
      label: '어깨',
      diff: clothing.shoulderWidth - avatar.shoulderWidth,
      x: cx + avatar.shoulderWidth / 2 + 20,
      y: shoulderY + 5,
    },
    {
      label: '가슴',
      diff: clothing.chestWidth - avatar.chestWidth,
      x: cx + avatar.chestWidth / 2 + 20,
      y: shoulderY + avatar.torsoHeight * 0.3,
    },
  ];

  ctx.font = '12px sans-serif';
  ctx.setLineDash([]);

  for (const ind of indicators) {
    const diffCm = ind.diff / ((avatar.totalHeight / 180) * (600 / 180));
    let color: string;
    let text: string;

    if (diffCm > 3) {
      color = '#F59E0B'; // 여유
      text = `${ind.label}: 여유 +${diffCm.toFixed(1)}cm`;
    } else if (diffCm >= -1) {
      color = '#10B981'; // 적당
      text = `${ind.label}: 적당 ${diffCm > 0 ? '+' : ''}${diffCm.toFixed(1)}cm`;
    } else {
      color = '#EF4444'; // 빡빡
      text = `${ind.label}: 빡빡 ${diffCm.toFixed(1)}cm`;
    }

    ctx.fillStyle = color;
    ctx.fillText(text, ind.x, ind.y);
  }
}
