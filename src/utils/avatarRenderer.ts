import type { AvatarDimensions } from '../types';

/**
 * Canvas에 2D 아바타를 그린다 (정면 뷰, 부드러운 실루엣)
 */
export function drawAvatar(
  ctx: CanvasRenderingContext2D,
  dims: AvatarDimensions,
  canvasWidth: number,
  _canvasHeight: number,
) {
  const cx = canvasWidth / 2;
  const topMargin = 30;

  ctx.clearRect(0, 0, canvasWidth, _canvasHeight);
  ctx.save();

  // ── Colors ──
  const skinGradient = ctx.createLinearGradient(cx - 60, 0, cx + 60, _canvasHeight);
  skinGradient.addColorStop(0, '#FCDEC0');
  skinGradient.addColorStop(0.5, '#F5D1AA');
  skinGradient.addColorStop(1, '#E8C49A');

  const shadowColor = 'rgba(139, 115, 85, 0.15)';
  const outlineColor = '#A08060';

  // ── Helper: smooth outline style ──
  function skinFill() {
    ctx.fillStyle = skinGradient;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1.2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
  }

  function shadowFill() {
    ctx.fillStyle = shadowColor;
    ctx.strokeStyle = 'transparent';
    ctx.lineWidth = 0;
  }

  // ── Measurements ──
  const headR = dims.headRadius;
  const headCY = topMargin + headR;
  const neckW = dims.neckWidth / 2;
  const neckH = dims.neckHeight;
  const neckTop = headCY + headR * 0.88; // overlap with head slightly
  const neckBottom = neckTop + neckH;

  const shoulderY = topMargin + dims.shoulderY;
  const shHalf = dims.shoulderWidth / 2;
  const chHalf = dims.chestWidth / 2;
  const waistHalf = dims.waistWidth / 2;
  const hipHalf = dims.hipWidth / 2;
  const torsoH = dims.torsoHeight;
  const torsoBottom = shoulderY + torsoH;

  const hipBottom = torsoBottom + torsoH * 0.22;
  const legTop = hipBottom;
  const legLen = dims.legLength;
  const legW = dims.legWidth / 2;
  const armLen = dims.armLength;
  const armW = dims.armWidth / 2;

  // ── 1. HEAD ──
  // Slightly oval head (taller than wide)
  skinFill();
  ctx.beginPath();
  ctx.ellipse(cx, headCY, headR * 0.92, headR, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Simple face features
  const eyeY = headCY - headR * 0.08;
  const eyeSpacing = headR * 0.35;
  const eyeW = headR * 0.18;
  const eyeH = headR * 0.1;

  // Eyes
  ctx.fillStyle = '#5C4033';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + side * eyeSpacing, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subtle mouth
  ctx.strokeStyle = '#C4956A';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, headCY + headR * 0.35, headR * 0.18, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  // ── 2. NECK ──
  skinFill();
  ctx.beginPath();
  ctx.moveTo(cx - neckW, neckTop);
  ctx.quadraticCurveTo(cx - neckW - 2, neckBottom, cx - neckW * 1.3, neckBottom + 4);
  ctx.lineTo(cx + neckW * 1.3, neckBottom + 4);
  ctx.quadraticCurveTo(cx + neckW + 2, neckBottom, cx + neckW, neckTop);
  ctx.closePath();
  ctx.fill();

  // Neck shadow
  shadowFill();
  ctx.beginPath();
  ctx.ellipse(cx, neckTop + 2, neckW * 0.8, 3, 0, 0, Math.PI);
  ctx.fill();

  // ── 3. TORSO (smooth continuous path) ──
  skinFill();

  const chestY = shoulderY + torsoH * 0.25;
  const waistY = shoulderY + torsoH * 0.85;

  ctx.beginPath();
  // Start at left shoulder
  ctx.moveTo(cx - shHalf, shoulderY);
  // Shoulder to chest (slight outward curve)
  ctx.bezierCurveTo(
    cx - shHalf - 3, shoulderY + torsoH * 0.08,
    cx - chHalf - 6, chestY - torsoH * 0.05,
    cx - chHalf, chestY,
  );
  // Chest to waist (inward curve)
  ctx.bezierCurveTo(
    cx - chHalf + 2, chestY + torsoH * 0.2,
    cx - waistHalf - 3, waistY - torsoH * 0.15,
    cx - waistHalf, waistY,
  );
  // Waist to hip (outward curve)
  ctx.bezierCurveTo(
    cx - waistHalf - 2, waistY + torsoH * 0.05,
    cx - hipHalf - 4, torsoBottom - torsoH * 0.05,
    cx - hipHalf, torsoBottom,
  );
  // Hip curve down to crotch
  ctx.bezierCurveTo(
    cx - hipHalf, torsoBottom + torsoH * 0.1,
    cx - legW * 1.5, hipBottom - 5,
    cx - legW * 0.8, hipBottom,
  );
  // Crotch
  ctx.quadraticCurveTo(cx, hipBottom + 8, cx + legW * 0.8, hipBottom);
  // Mirror right side
  ctx.bezierCurveTo(
    cx + legW * 1.5, hipBottom - 5,
    cx + hipHalf, torsoBottom + torsoH * 0.1,
    cx + hipHalf, torsoBottom,
  );
  ctx.bezierCurveTo(
    cx + hipHalf + 4, torsoBottom - torsoH * 0.05,
    cx + waistHalf + 2, waistY + torsoH * 0.05,
    cx + waistHalf, waistY,
  );
  ctx.bezierCurveTo(
    cx + waistHalf + 3, waistY - torsoH * 0.15,
    cx + chHalf - 2, chestY + torsoH * 0.2,
    cx + chHalf, chestY,
  );
  ctx.bezierCurveTo(
    cx + chHalf + 6, chestY - torsoH * 0.05,
    cx + shHalf + 3, shoulderY + torsoH * 0.08,
    cx + shHalf, shoulderY,
  );
  // Connect shoulders across neckline
  ctx.quadraticCurveTo(cx + neckW * 1.5, shoulderY - 3, cx + neckW, shoulderY - 2);
  ctx.lineTo(cx - neckW, shoulderY - 2);
  ctx.quadraticCurveTo(cx - neckW * 1.5, shoulderY - 3, cx - shHalf, shoulderY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Subtle torso shadow (center line suggestion)
  shadowFill();
  ctx.beginPath();
  ctx.moveTo(cx, shoulderY + 8);
  ctx.quadraticCurveTo(cx - 2, shoulderY + torsoH * 0.5, cx, torsoBottom);
  ctx.quadraticCurveTo(cx + 2, shoulderY + torsoH * 0.5, cx, shoulderY + 8);
  ctx.fill();

  // ── 4. ARMS ──
  for (const side of [-1, 1]) {
    const shoulderX = cx + side * shHalf;
    // Arm hangs slightly out from body
    const elbowX = shoulderX + side * armLen * 0.08;
    const elbowY = shoulderY + armLen * 0.45;
    const wristX = shoulderX + side * armLen * 0.12;
    const wristY = shoulderY + armLen * 0.92;
    const handY = wristY + armW * 1.6;

    // Arm thickness tapers
    const upperArmW = armW * 1.1;
    const forearmW = armW * 0.85;
    const wristW = armW * 0.65;

    skinFill();
    ctx.beginPath();
    // Outer edge
    ctx.moveTo(shoulderX + side * upperArmW, shoulderY + 2);
    ctx.bezierCurveTo(
      shoulderX + side * upperArmW * 1.15, shoulderY + armLen * 0.2,
      elbowX + side * forearmW * 1.1, elbowY - armLen * 0.05,
      elbowX + side * forearmW, elbowY,
    );
    ctx.bezierCurveTo(
      elbowX + side * forearmW, elbowY + armLen * 0.1,
      wristX + side * wristW * 1.1, wristY - armLen * 0.1,
      wristX + side * wristW, wristY,
    );
    // Hand (rounded rectangle shape)
    const handW = wristW * 1.3;
    ctx.bezierCurveTo(
      wristX + side * handW, wristY + 3,
      wristX + side * handW, handY - 3,
      wristX + side * handW * 0.3, handY,
    );
    // Inner hand
    ctx.bezierCurveTo(
      wristX - side * handW * 0.2, handY - 3,
      wristX - side * wristW, wristY + 3,
      wristX - side * wristW, wristY,
    );
    // Inner edge back up
    ctx.bezierCurveTo(
      wristX - side * wristW * 1.1, wristY - armLen * 0.1,
      elbowX - side * forearmW, elbowY + armLen * 0.1,
      elbowX - side * forearmW, elbowY,
    );
    ctx.bezierCurveTo(
      elbowX - side * forearmW * 1.1, elbowY - armLen * 0.05,
      shoulderX - side * upperArmW * 0.3, shoulderY + armLen * 0.15,
      shoulderX, shoulderY + 5,
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // ── 5. LEGS ──
  for (const side of [-1, 1]) {
    const legCX = cx + side * hipHalf * 0.42;
    const thighW = legW * 1.15;
    const calfW = legW * 0.82;
    const ankleW = legW * 0.55;
    const kneeY = legTop + legLen * 0.45;
    const ankleY = legTop + legLen * 0.95;
    const footLen = legW * 2.2;

    skinFill();
    ctx.beginPath();
    // Outer thigh
    ctx.moveTo(legCX + side * thighW, legTop);
    ctx.bezierCurveTo(
      legCX + side * thighW * 1.05, legTop + legLen * 0.15,
      legCX + side * calfW * 1.15, kneeY - legLen * 0.08,
      legCX + side * calfW, kneeY,
    );
    // Outer calf → ankle
    ctx.bezierCurveTo(
      legCX + side * calfW * 1.05, kneeY + legLen * 0.15,
      legCX + side * ankleW * 1.2, ankleY - legLen * 0.1,
      legCX + side * ankleW, ankleY,
    );
    // Foot
    ctx.bezierCurveTo(
      legCX + side * ankleW, ankleY + 6,
      legCX + side * footLen * 0.8, ankleY + 10,
      legCX + side * footLen * 0.5, ankleY + 12,
    );
    // Foot bottom
    ctx.bezierCurveTo(
      legCX - side * footLen * 0.1, ankleY + 13,
      legCX - side * ankleW * 0.5, ankleY + 10,
      legCX - side * ankleW, ankleY,
    );
    // Inner ankle → calf
    ctx.bezierCurveTo(
      legCX - side * ankleW * 1.2, ankleY - legLen * 0.1,
      legCX - side * calfW * 1.05, kneeY + legLen * 0.15,
      legCX - side * calfW, kneeY,
    );
    // Inner thigh → top
    ctx.bezierCurveTo(
      legCX - side * calfW * 1.15, kneeY - legLen * 0.08,
      legCX - side * thighW * 0.9, legTop + legLen * 0.15,
      legCX - side * thighW * 0.7, legTop,
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Knee shadow hint
    shadowFill();
    ctx.beginPath();
    ctx.ellipse(legCX, kneeY, calfW * 0.6, legLen * 0.03, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
