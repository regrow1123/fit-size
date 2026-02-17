import type { AvatarDimensions } from '../types';

/**
 * Canvas에 2D 아바타를 그린다 (정면 뷰, 인체 비례 기반)
 */
export function drawAvatar(
  ctx: CanvasRenderingContext2D,
  dims: AvatarDimensions,
  canvasWidth: number,
  canvasHeight: number,
) {
  const cx = canvasWidth / 2;
  const topMargin = 30;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.save();

  // ── Colors ──
  const skinBase = '#F5D1AA';
  const skinLight = '#FCDEC0';
  const skinDark = '#D4A574';
  const skinShadow = 'rgba(180, 140, 100, 0.12)';
  const outlineColor = 'rgba(160, 120, 80, 0.6)';
  const hairColor = '#3A2A1A';

  // ── Helper functions ──
  function drawShadow(fn: () => void) {
    ctx.save();
    ctx.fillStyle = skinShadow;
    ctx.strokeStyle = 'transparent';
    fn();
    ctx.restore();
  }

  // Radial skin gradient for a body part
  function skinGradient(x: number, y: number, r: number): CanvasGradient {
    const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, skinLight);
    g.addColorStop(0.6, skinBase);
    g.addColorStop(1, skinDark);
    return g;
  }

  // ── Measurements ──
  const headR = dims.headRadius;
  const headCY = topMargin + headR;
  const neckW = dims.neckWidth / 2;
  const neckH = dims.neckHeight;
  const neckTop = headCY + headR * 0.85;
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

  // ── 1. HAIR (behind head) ──
  ctx.fillStyle = hairColor;
  ctx.beginPath();
  ctx.ellipse(cx, headCY - headR * 0.08, headR * 1.05, headR * 1.12, 0, -Math.PI, 0);
  ctx.fill();

  // ── 2. NECK (draw before head for layering) ──
  ctx.fillStyle = skinGradient(cx, neckTop + neckH / 2, neckW * 2);
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - neckW, neckTop);
  ctx.bezierCurveTo(cx - neckW * 1.1, neckBottom * 0.5 + neckTop * 0.5, cx - neckW * 1.3, neckBottom, cx - neckW * 1.4, neckBottom + 3);
  ctx.lineTo(cx + neckW * 1.4, neckBottom + 3);
  ctx.bezierCurveTo(cx + neckW * 1.3, neckBottom, cx + neckW * 1.1, neckBottom * 0.5 + neckTop * 0.5, cx + neckW, neckTop);
  ctx.closePath();
  ctx.fill();

  // Neck shadow under chin
  drawShadow(() => {
    ctx.beginPath();
    ctx.ellipse(cx, neckTop + 3, neckW * 0.9, 4, 0, 0, Math.PI);
    ctx.fill();
  });

  // ── 3. TORSO ──
  const chestY = shoulderY + torsoH * 0.25;
  const waistY = shoulderY + torsoH * 0.85;

  ctx.fillStyle = skinGradient(cx, shoulderY + torsoH / 2, Math.max(chHalf, hipHalf));
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(cx - shHalf, shoulderY);
  // Left: shoulder → chest
  ctx.bezierCurveTo(
    cx - shHalf - 2, shoulderY + torsoH * 0.08,
    cx - chHalf - 5, chestY - torsoH * 0.05,
    cx - chHalf, chestY,
  );
  // Left: chest → waist
  ctx.bezierCurveTo(
    cx - chHalf + 2, chestY + torsoH * 0.22,
    cx - waistHalf - 3, waistY - torsoH * 0.15,
    cx - waistHalf, waistY,
  );
  // Left: waist → hip
  ctx.bezierCurveTo(
    cx - waistHalf - 2, waistY + torsoH * 0.06,
    cx - hipHalf - 3, torsoBottom - torsoH * 0.06,
    cx - hipHalf, torsoBottom,
  );
  // Left hip → crotch
  ctx.bezierCurveTo(
    cx - hipHalf, torsoBottom + torsoH * 0.1,
    cx - legW * 1.5, hipBottom - 5,
    cx - legW * 0.8, hipBottom,
  );
  // Crotch curve
  ctx.quadraticCurveTo(cx, hipBottom + 8, cx + legW * 0.8, hipBottom);
  // Right side (mirror)
  ctx.bezierCurveTo(
    cx + legW * 1.5, hipBottom - 5,
    cx + hipHalf, torsoBottom + torsoH * 0.1,
    cx + hipHalf, torsoBottom,
  );
  ctx.bezierCurveTo(
    cx + hipHalf + 3, torsoBottom - torsoH * 0.06,
    cx + waistHalf + 2, waistY + torsoH * 0.06,
    cx + waistHalf, waistY,
  );
  ctx.bezierCurveTo(
    cx + waistHalf + 3, waistY - torsoH * 0.15,
    cx + chHalf - 2, chestY + torsoH * 0.22,
    cx + chHalf, chestY,
  );
  ctx.bezierCurveTo(
    cx + chHalf + 5, chestY - torsoH * 0.05,
    cx + shHalf + 2, shoulderY + torsoH * 0.08,
    cx + shHalf, shoulderY,
  );
  // Neckline
  ctx.quadraticCurveTo(cx + neckW * 1.5, shoulderY - 3, cx + neckW, shoulderY - 2);
  ctx.lineTo(cx - neckW, shoulderY - 2);
  ctx.quadraticCurveTo(cx - neckW * 1.5, shoulderY - 3, cx - shHalf, shoulderY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Torso details — collarbone hints
  ctx.strokeStyle = 'rgba(160, 120, 80, 0.15)';
  ctx.lineWidth = 1;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + side * neckW * 0.8, shoulderY + 2);
    ctx.quadraticCurveTo(
      cx + side * shHalf * 0.5, shoulderY + 6,
      cx + side * shHalf * 0.85, shoulderY + 3,
    );
    ctx.stroke();
  }

  // Navel hint
  drawShadow(() => {
    ctx.beginPath();
    ctx.ellipse(cx, waistY - torsoH * 0.03, 2, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // ── 4. ARMS ──
  for (const side of [-1, 1]) {
    const shoulderX = cx + side * shHalf;
    const elbowX = shoulderX + side * armLen * 0.06;
    const elbowY = shoulderY + armLen * 0.46;
    const wristX = shoulderX + side * armLen * 0.1;
    const wristY = shoulderY + armLen * 0.92;
    const handY = wristY + armW * 2;

    const upperW = armW * 1.15;
    const foreW = armW * 0.85;
    const wristWid = armW * 0.6;

    ctx.fillStyle = skinGradient(shoulderX, shoulderY + armLen / 2, upperW * 2);
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1;

    ctx.beginPath();
    // Outer edge
    ctx.moveTo(shoulderX + side * upperW, shoulderY + 2);
    ctx.bezierCurveTo(
      shoulderX + side * upperW * 1.2, shoulderY + armLen * 0.2,
      elbowX + side * foreW * 1.1, elbowY - armLen * 0.06,
      elbowX + side * foreW, elbowY,
    );
    ctx.bezierCurveTo(
      elbowX + side * foreW * 0.95, elbowY + armLen * 0.12,
      wristX + side * wristWid * 1.1, wristY - armLen * 0.1,
      wristX + side * wristWid, wristY,
    );
    // Hand
    const handW = wristWid * 1.4;
    ctx.bezierCurveTo(
      wristX + side * handW, wristY + 4,
      wristX + side * handW, handY - 5,
      wristX + side * handW * 0.2, handY,
    );
    // Finger hints
    const fBase = handY - 2;
    const fTip = handY + armW * 0.5;
    for (let f = 0; f < 4; f++) {
      const fx = wristX + side * (handW * 0.2 - f * handW * 0.35 / 3);
      ctx.lineTo(fx, fTip - f * 0.5);
      ctx.lineTo(fx - side * handW * 0.08, fBase + f * 0.5);
    }
    // Inner hand → wrist
    ctx.bezierCurveTo(
      wristX - side * wristWid * 0.3, handY - 6,
      wristX - side * wristWid, wristY + 4,
      wristX - side * wristWid, wristY,
    );
    // Inner edge back up
    ctx.bezierCurveTo(
      wristX - side * wristWid * 1.1, wristY - armLen * 0.1,
      elbowX - side * foreW * 0.95, elbowY + armLen * 0.12,
      elbowX - side * foreW * 0.85, elbowY,
    );
    ctx.bezierCurveTo(
      elbowX - side * foreW * 0.9, elbowY - armLen * 0.06,
      shoulderX - side * upperW * 0.2, shoulderY + armLen * 0.12,
      shoulderX, shoulderY + 4,
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Elbow shadow
    drawShadow(() => {
      ctx.beginPath();
      ctx.ellipse(elbowX, elbowY, foreW * 0.6, armLen * 0.025, side * 0.1, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ── 5. LEGS ──
  for (const side of [-1, 1]) {
    const legCX = cx + side * hipHalf * 0.42;
    const thighW = legW * 1.2;
    const calfW = legW * 0.82;
    const ankleW = legW * 0.5;
    const kneeY = legTop + legLen * 0.45;
    const calfBulge = legTop + legLen * 0.62;
    const ankleY = legTop + legLen * 0.95;
    const footLen = legW * 2.5;

    ctx.fillStyle = skinGradient(legCX, legTop + legLen / 2, thighW * 2);
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 1;

    ctx.beginPath();
    // Outer thigh
    ctx.moveTo(legCX + side * thighW, legTop);
    ctx.bezierCurveTo(
      legCX + side * thighW * 1.05, legTop + legLen * 0.15,
      legCX + side * calfW * 1.2, kneeY - legLen * 0.08,
      legCX + side * calfW, kneeY,
    );
    // Outer calf (slight bulge)
    ctx.bezierCurveTo(
      legCX + side * calfW * 1.1, kneeY + legLen * 0.08,
      legCX + side * calfW * 1.15, calfBulge - legLen * 0.03,
      legCX + side * calfW * 0.95, calfBulge,
    );
    // Calf → ankle
    ctx.bezierCurveTo(
      legCX + side * calfW * 0.75, calfBulge + legLen * 0.1,
      legCX + side * ankleW * 1.3, ankleY - legLen * 0.08,
      legCX + side * ankleW, ankleY,
    );
    // Foot — side view hint
    ctx.bezierCurveTo(
      legCX + side * ankleW * 0.8, ankleY + 5,
      legCX + side * footLen * 0.6, ankleY + 9,
      legCX + side * footLen * 0.4, ankleY + 12,
    );
    // Toe
    ctx.quadraticCurveTo(
      legCX + side * footLen * 0.2, ankleY + 14,
      legCX, ankleY + 13,
    );
    // Inner sole
    ctx.quadraticCurveTo(
      legCX - side * ankleW * 0.5, ankleY + 12,
      legCX - side * ankleW, ankleY,
    );
    // Inner ankle → calf
    ctx.bezierCurveTo(
      legCX - side * ankleW * 1.3, ankleY - legLen * 0.08,
      legCX - side * calfW * 0.7, calfBulge + legLen * 0.1,
      legCX - side * calfW * 0.85, calfBulge,
    );
    // Inner calf → knee
    ctx.bezierCurveTo(
      legCX - side * calfW * 1.0, calfBulge - legLen * 0.03,
      legCX - side * calfW * 0.95, kneeY + legLen * 0.08,
      legCX - side * calfW * 0.8, kneeY,
    );
    // Inner thigh → top
    ctx.bezierCurveTo(
      legCX - side * calfW * 1.0, kneeY - legLen * 0.08,
      legCX - side * thighW * 0.85, legTop + legLen * 0.15,
      legCX - side * thighW * 0.65, legTop,
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Knee cap
    drawShadow(() => {
      ctx.beginPath();
      ctx.ellipse(legCX + side * calfW * 0.05, kneeY - legLen * 0.01, calfW * 0.4, legLen * 0.025, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Ankle bone
    drawShadow(() => {
      ctx.beginPath();
      ctx.ellipse(legCX + side * ankleW * 0.9, ankleY - 3, ankleW * 0.3, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ── 6. HEAD (on top of everything) ──
  // Head shape: slightly oval, wider at cheeks
  ctx.fillStyle = skinGradient(cx, headCY, headR);
  ctx.strokeStyle = outlineColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, headCY, headR * 0.92, headR, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Hair on top (overlay)
  ctx.fillStyle = hairColor;
  ctx.beginPath();
  ctx.ellipse(cx, headCY - headR * 0.15, headR * 0.98, headR * 0.75, 0, Math.PI + 0.3, -0.3);
  ctx.quadraticCurveTo(cx + headR * 1.05, headCY - headR * 0.1, cx + headR * 0.85, headCY + headR * 0.15);
  ctx.lineTo(cx + headR * 0.88, headCY - headR * 0.05);
  ctx.quadraticCurveTo(cx + headR * 0.7, headCY - headR * 0.7, cx, headCY - headR * 0.85);
  ctx.quadraticCurveTo(cx - headR * 0.7, headCY - headR * 0.7, cx - headR * 0.88, headCY - headR * 0.05);
  ctx.lineTo(cx - headR * 0.85, headCY + headR * 0.15);
  ctx.quadraticCurveTo(cx - headR * 1.05, headCY - headR * 0.1, cx - headR * 0.88, headCY - headR * 0.65);
  ctx.closePath();
  ctx.fill();

  // Ears
  for (const side of [-1, 1]) {
    const earX = cx + side * headR * 0.88;
    const earY = headCY + headR * 0.05;
    ctx.fillStyle = skinBase;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(earX, earY, headR * 0.1, headR * 0.18, side * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Eyes
  const eyeY = headCY - headR * 0.05;
  const eyeSpacing = headR * 0.32;
  for (const side of [-1, 1]) {
    const ex = cx + side * eyeSpacing;
    // Eye white
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, headR * 0.16, headR * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    // Iris
    ctx.fillStyle = '#4A3520';
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, headR * 0.08, headR * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    // Pupil
    ctx.fillStyle = '#1A1008';
    ctx.beginPath();
    ctx.ellipse(ex, eyeY, headR * 0.04, headR * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eye highlight
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.ellipse(ex + headR * 0.03, eyeY - headR * 0.02, headR * 0.025, headR * 0.02, 0, 0, Math.PI * 2);
    ctx.fill();
    // Upper eyelid line
    ctx.strokeStyle = 'rgba(60, 40, 20, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(ex, eyeY - headR * 0.01, headR * 0.17, headR * 0.07, 0, Math.PI + 0.3, -0.3);
    ctx.stroke();
  }

  // Eyebrows
  ctx.strokeStyle = hairColor;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    const bx = cx + side * eyeSpacing;
    ctx.beginPath();
    ctx.moveTo(bx - side * headR * 0.14, eyeY - headR * 0.18);
    ctx.quadraticCurveTo(bx, eyeY - headR * 0.23, bx + side * headR * 0.14, eyeY - headR * 0.17);
    ctx.stroke();
  }

  // Nose
  ctx.strokeStyle = 'rgba(160, 120, 80, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, eyeY + headR * 0.08);
  ctx.quadraticCurveTo(cx - headR * 0.06, eyeY + headR * 0.28, cx, eyeY + headR * 0.3);
  ctx.stroke();
  // Nostrils hint
  drawShadow(() => {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + side * headR * 0.05, eyeY + headR * 0.3, headR * 0.025, headR * 0.015, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Mouth
  ctx.strokeStyle = '#C08060';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - headR * 0.15, headCY + headR * 0.4);
  ctx.quadraticCurveTo(cx, headCY + headR * 0.48, cx + headR * 0.15, headCY + headR * 0.4);
  ctx.stroke();
  // Upper lip
  ctx.strokeStyle = 'rgba(180, 100, 80, 0.3)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - headR * 0.12, headCY + headR * 0.38);
  ctx.quadraticCurveTo(cx - headR * 0.04, headCY + headR * 0.35, cx, headCY + headR * 0.37);
  ctx.quadraticCurveTo(cx + headR * 0.04, headCY + headR * 0.35, cx + headR * 0.12, headCY + headR * 0.38);
  ctx.stroke();

  ctx.restore();
}
