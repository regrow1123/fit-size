import type { AvatarDimensions } from '../types';

/**
 * Canvas에 2D 아바타를 그린다 (정면 뷰)
 */
export function drawAvatar(
  ctx: CanvasRenderingContext2D,
  dims: AvatarDimensions,
  canvasWidth: number,
  canvasHeight: number,
) {
  const cx = canvasWidth / 2; // 중심 X
  const topMargin = 20;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const skinColor = '#F5D6B8';
  const outlineColor = '#8B7355';

  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 1.5;
  ctx.fillStyle = skinColor;

  // === 머리 ===
  const headCenterY = topMargin + dims.headRadius;
  ctx.beginPath();
  ctx.arc(cx, headCenterY, dims.headRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // === 목 ===
  const neckTop = headCenterY + dims.headRadius;
  const neckW = dims.neckWidth / 2;
  ctx.beginPath();
  ctx.rect(cx - neckW, neckTop, neckW * 2, dims.neckHeight);
  ctx.fill();
  ctx.stroke();

  // === 몸통 (어깨 → 허리) ===
  const shoulderY = topMargin + dims.shoulderY;
  const torsoBottom = shoulderY + dims.torsoHeight;
  const shoulderHalf = dims.shoulderWidth / 2;
  const chestHalf = dims.chestWidth / 2;
  const waistHalf = dims.waistWidth / 2;
  const hipHalf = dims.hipWidth / 2;

  // 몸통: 어깨 → 가슴 → 허리 → 엉덩이
  ctx.beginPath();
  // 왼쪽 어깨
  ctx.moveTo(cx - shoulderHalf, shoulderY);
  // 왼쪽 가슴 (어깨에서 약간 아래)
  ctx.quadraticCurveTo(
    cx - chestHalf - 5, shoulderY + dims.torsoHeight * 0.3,
    cx - waistHalf, torsoBottom
  );
  // 왼쪽 엉덩이
  ctx.quadraticCurveTo(
    cx - hipHalf - 3, torsoBottom + dims.torsoHeight * 0.15,
    cx - hipHalf, torsoBottom + dims.torsoHeight * 0.2
  );
  // 아래쪽 가랑이
  ctx.lineTo(cx - dims.legWidth / 2, torsoBottom + dims.torsoHeight * 0.2);

  // 오른쪽으로 이동
  ctx.lineTo(cx + dims.legWidth / 2, torsoBottom + dims.torsoHeight * 0.2);
  ctx.lineTo(cx + hipHalf, torsoBottom + dims.torsoHeight * 0.2);

  // 오른쪽 허리 → 어깨
  ctx.quadraticCurveTo(
    cx + hipHalf + 3, torsoBottom + dims.torsoHeight * 0.15,
    cx + waistHalf, torsoBottom
  );
  ctx.quadraticCurveTo(
    cx + chestHalf + 5, shoulderY + dims.torsoHeight * 0.3,
    cx + shoulderHalf, shoulderY
  );

  // 어깨 상단 닫기
  ctx.lineTo(cx - shoulderHalf, shoulderY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // === 팔 (양쪽) ===
  const armW = dims.armWidth / 2;
  for (const side of [-1, 1]) {
    const armStartX = cx + side * shoulderHalf;
    const armEndX = armStartX + side * dims.armLength * 0.35;
    const armEndY = shoulderY + dims.armLength * 0.93;

    ctx.beginPath();
    ctx.moveTo(armStartX, shoulderY);
    // 팔 바깥쪽
    ctx.quadraticCurveTo(
      armStartX + side * dims.armLength * 0.2, shoulderY + dims.armLength * 0.5,
      armEndX, armEndY
    );
    // 손
    ctx.arc(armEndX, armEndY, armW * 0.8, 0, Math.PI * 2);
    // 팔 안쪽
    ctx.moveTo(armEndX, armEndY);
    ctx.quadraticCurveTo(
      armStartX + side * (dims.armLength * 0.15), shoulderY + dims.armLength * 0.5,
      armStartX, shoulderY + 10
    );
    ctx.fill();
    ctx.stroke();
  }

  // === 다리 (양쪽) ===
  const legTop = torsoBottom + dims.torsoHeight * 0.2;
  for (const side of [-1, 1]) {
    const legCenterX = cx + side * (hipHalf * 0.45);
    const legW = dims.legWidth / 2;

    ctx.beginPath();
    ctx.moveTo(legCenterX - legW, legTop);
    // 허벅지 → 발목 (약간 테이퍼)
    ctx.lineTo(legCenterX - legW * 0.7, legTop + dims.legLength);
    // 발
    ctx.lineTo(legCenterX + legW * 0.7 + side * 5, legTop + dims.legLength);
    ctx.lineTo(legCenterX + legW * 0.7 + side * 5, legTop + dims.legLength + 8);
    ctx.lineTo(legCenterX - legW * 0.7, legTop + dims.legLength + 8);
    // 올라오기
    ctx.lineTo(legCenterX + legW * 0.7, legTop + dims.legLength);
    ctx.lineTo(legCenterX + legW, legTop);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}
