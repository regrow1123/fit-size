import type { AvatarDimensions } from '../types';

/**
 * Canvas에 2D 아바타를 그린다.
 * 핵심: 인체 실루엣의 자연스러운 곡선과 비례.
 */
export function drawAvatar(
  ctx: CanvasRenderingContext2D,
  dims: AvatarDimensions,
  canvasWidth: number,
  canvasHeight: number,
) {
  const cx = canvasWidth / 2;
  const top = 30; // topMargin

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.save();

  // ── Colors ──
  const skin = '#F0CBA8';
  const skinHighlight = '#FADCC4';
  const skinShadow = '#D4A574';
  const outline = 'rgba(140, 100, 65, 0.5)';
  const shadowTint = 'rgba(160, 120, 80, 0.1)';

  function radialSkin(x: number, y: number, r: number): CanvasGradient {
    const g = ctx.createRadialGradient(x - r * 0.15, y - r * 0.2, r * 0.05, x, y, r * 1.1);
    g.addColorStop(0, skinHighlight);
    g.addColorStop(0.5, skin);
    g.addColorStop(1, skinShadow);
    return g;
  }

  // ── Key positions ──
  const headR = dims.headRadius;
  const headCY = top + headR;

  const shY = top + dims.shoulderY;
  const shHalf = dims.shoulderWidth / 2;
  const chHalf = dims.chestWidth / 2;
  const waHalf = dims.waistWidth / 2;
  const hiHalf = dims.hipWidth / 2;
  const torH = dims.torsoHeight;

  const chestY = shY + torH * 0.22;
  const waistY = shY + torH * 0.70;
  const hipY = shY + torH * 0.92;

  const legTop = shY + torH + torH * 0.08;
  const legLen = dims.legLength;
  const legW = dims.legWidth / 2;

  const armLen = dims.armLength;
  const armW = Math.max(dims.armWidth / 2, 8);

  const neckW = dims.neckWidth / 2;

  // ═══════════════════════════════════════
  // DRAW ORDER: arms behind → torso+legs → head on top
  // ═══════════════════════════════════════

  // ── ARMS (behind torso) ──
  for (const s of [-1, 1]) {
    const sx = cx + s * shHalf; // shoulder joint
    // Arm hangs with slight natural outward angle
    const elbowX = sx + s * 12;
    const elbowY = shY + armLen * 0.43;
    const wristX = sx + s * 16;
    const wristY = shY + armLen * 0.88;
    const handEndY = wristY + armW * 2.8;

    // Taper: shoulder → elbow → wrist
    const upW = armW * 1.3;
    const elW = armW * 1.0;
    const wrW = armW * 0.7;
    const handW = wrW * 1.5;

    ctx.fillStyle = radialSkin(sx, shY + armLen * 0.4, upW * 3);
    ctx.strokeStyle = outline;
    ctx.lineWidth = 0.8;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    // Outer arm
    ctx.moveTo(sx + s * upW, shY + 3);
    ctx.bezierCurveTo(
      sx + s * upW * 1.15, shY + armLen * 0.15,
      elbowX + s * elW * 1.05, elbowY - armLen * 0.08,
      elbowX + s * elW, elbowY,
    );
    ctx.bezierCurveTo(
      elbowX + s * elW * 0.95, elbowY + armLen * 0.08,
      wristX + s * wrW * 1.1, wristY - armLen * 0.1,
      wristX + s * wrW, wristY,
    );
    // Hand (simple rounded)
    ctx.quadraticCurveTo(
      wristX + s * handW, wristY + 5,
      wristX + s * handW * 0.8, handEndY - 8,
    );
    ctx.quadraticCurveTo(
      wristX + s * handW * 0.3, handEndY,
      wristX - s * handW * 0.2, handEndY - 5,
    );
    ctx.quadraticCurveTo(
      wristX - s * wrW * 0.5, wristY + 5,
      wristX - s * wrW, wristY,
    );
    // Inner arm back up
    ctx.bezierCurveTo(
      wristX - s * wrW * 1.1, wristY - armLen * 0.1,
      elbowX - s * elW * 0.8, elbowY + armLen * 0.08,
      elbowX - s * elW * 0.7, elbowY,
    );
    ctx.bezierCurveTo(
      elbowX - s * elW * 0.65, elbowY - armLen * 0.08,
      sx - s * upW * 0.1, shY + armLen * 0.1,
      sx - s * 2, shY + 5,
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // ── TORSO + HIPS (single connected shape) ──
  ctx.fillStyle = radialSkin(cx, shY + torH * 0.4, Math.max(shHalf, hiHalf));
  ctx.strokeStyle = outline;
  ctx.lineWidth = 0.8;

  ctx.beginPath();
  // Start: left shoulder
  ctx.moveTo(cx - shHalf, shY);

  // Left side: shoulder → chest (deltoid curve, slight outward then in)
  ctx.bezierCurveTo(
    cx - shHalf - 2, shY + torH * 0.06,
    cx - chHalf - 8, chestY - torH * 0.04,
    cx - chHalf, chestY,
  );

  // Chest → waist (inward taper — the V)
  ctx.bezierCurveTo(
    cx - chHalf + 1, chestY + torH * 0.15,
    cx - waHalf - 2, waistY - torH * 0.1,
    cx - waHalf, waistY,
  );

  // Waist → hip (outward flare)
  ctx.bezierCurveTo(
    cx - waHalf - 1, waistY + torH * 0.04,
    cx - hiHalf - 3, hipY - torH * 0.06,
    cx - hiHalf, hipY,
  );

  // Hip → inner thigh
  ctx.bezierCurveTo(
    cx - hiHalf + 1, hipY + torH * 0.06,
    cx - legW * 1.8, legTop - 8,
    cx - legW * 1.2, legTop,
  );

  // Crotch arch
  ctx.quadraticCurveTo(cx, legTop + 10, cx + legW * 1.2, legTop);

  // Right side (mirror)
  ctx.bezierCurveTo(
    cx + legW * 1.8, legTop - 8,
    cx + hiHalf - 1, hipY + torH * 0.06,
    cx + hiHalf, hipY,
  );
  ctx.bezierCurveTo(
    cx + hiHalf + 3, hipY - torH * 0.06,
    cx + waHalf + 1, waistY + torH * 0.04,
    cx + waHalf, waistY,
  );
  ctx.bezierCurveTo(
    cx + waHalf + 2, waistY - torH * 0.1,
    cx + chHalf - 1, chestY + torH * 0.15,
    cx + chHalf, chestY,
  );
  ctx.bezierCurveTo(
    cx + chHalf + 8, chestY - torH * 0.04,
    cx + shHalf + 2, shY + torH * 0.06,
    cx + shHalf, shY,
  );

  // Neckline (connect shoulders across)
  ctx.quadraticCurveTo(cx + neckW * 1.5, shY - 4, cx + neckW, shY - 3);
  ctx.lineTo(cx - neckW, shY - 3);
  ctx.quadraticCurveTo(cx - neckW * 1.5, shY - 4, cx - shHalf, shY);

  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Subtle waist indentation shadow
  ctx.fillStyle = shadowTint;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + s * waHalf, waistY - torH * 0.05);
    ctx.quadraticCurveTo(
      cx + s * (waHalf + 3), waistY,
      cx + s * waHalf, waistY + torH * 0.05,
    );
    ctx.quadraticCurveTo(
      cx + s * (waHalf - 2), waistY,
      cx + s * waHalf, waistY - torH * 0.05,
    );
    ctx.fill();
  }

  // ── LEGS ──
  for (const s of [-1, 1]) {
    const legCX = cx + s * hiHalf * 0.42;
    const thighW = legW * 1.25;
    const kneeW = legW * 0.75;
    const calfW = legW * 0.8;
    const ankleW = legW * 0.45;

    const kneeY = legTop + legLen * 0.46;
    const calfPeak = legTop + legLen * 0.60;
    const ankleY = legTop + legLen * 0.94;
    const footTip = ankleY + 14;

    ctx.fillStyle = radialSkin(legCX, legTop + legLen * 0.4, thighW * 2);
    ctx.strokeStyle = outline;
    ctx.lineWidth = 0.8;

    ctx.beginPath();
    // Outer thigh (tapers)
    ctx.moveTo(legCX + s * thighW, legTop);
    ctx.bezierCurveTo(
      legCX + s * thighW, legTop + legLen * 0.15,
      legCX + s * kneeW * 1.1, kneeY - legLen * 0.06,
      legCX + s * kneeW, kneeY,
    );
    // Outer calf (bulge then taper)
    ctx.bezierCurveTo(
      legCX + s * calfW * 1.15, kneeY + legLen * 0.06,
      legCX + s * calfW * 1.1, calfPeak,
      legCX + s * calfW * 0.9, calfPeak + legLen * 0.05,
    );
    ctx.bezierCurveTo(
      legCX + s * calfW * 0.6, calfPeak + legLen * 0.15,
      legCX + s * ankleW * 1.2, ankleY - legLen * 0.05,
      legCX + s * ankleW, ankleY,
    );
    // Foot
    ctx.quadraticCurveTo(
      legCX + s * ankleW * 0.8, ankleY + 7,
      legCX + s * legW * 1.8, footTip,
    );
    ctx.quadraticCurveTo(
      legCX + s * legW * 0.5, footTip + 3,
      legCX - s * ankleW * 0.3, footTip - 1,
    );
    ctx.quadraticCurveTo(
      legCX - s * ankleW * 0.8, ankleY + 5,
      legCX - s * ankleW, ankleY,
    );
    // Inner calf
    ctx.bezierCurveTo(
      legCX - s * ankleW * 1.1, ankleY - legLen * 0.05,
      legCX - s * calfW * 0.5, calfPeak + legLen * 0.15,
      legCX - s * calfW * 0.7, calfPeak + legLen * 0.05,
    );
    ctx.bezierCurveTo(
      legCX - s * calfW * 0.9, calfPeak,
      legCX - s * kneeW * 0.95, kneeY + legLen * 0.06,
      legCX - s * kneeW * 0.7, kneeY,
    );
    // Inner thigh
    ctx.bezierCurveTo(
      legCX - s * kneeW * 0.9, kneeY - legLen * 0.06,
      legCX - s * thighW * 0.8, legTop + legLen * 0.12,
      legCX - s * thighW * 0.65, legTop,
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Knee highlight
    ctx.fillStyle = shadowTint;
    ctx.beginPath();
    ctx.ellipse(legCX, kneeY, kneeW * 0.35, legLen * 0.02, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── NECK ──
  const neckTop = headCY + headR * 0.82;
  const neckBot = shY - 2;
  ctx.fillStyle = radialSkin(cx, (neckTop + neckBot) / 2, neckW * 2);
  ctx.strokeStyle = outline;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx - neckW, neckTop);
  ctx.bezierCurveTo(cx - neckW * 1.1, (neckTop + neckBot) / 2, cx - neckW * 1.2, neckBot, cx - neckW * 1.3, neckBot + 2);
  ctx.lineTo(cx + neckW * 1.3, neckBot + 2);
  ctx.bezierCurveTo(cx + neckW * 1.2, neckBot, cx + neckW * 1.1, (neckTop + neckBot) / 2, cx + neckW, neckTop);
  ctx.closePath();
  ctx.fill();

  // ── HEAD ──
  // Slightly narrower at jaw
  ctx.fillStyle = radialSkin(cx, headCY, headR);
  ctx.strokeStyle = outline;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  // Top of head (round)
  ctx.ellipse(cx, headCY - headR * 0.05, headR * 0.88, headR * 0.95, 0, Math.PI + 0.2, -0.2);
  // Jaw line (narrower, V-shape hint)
  ctx.quadraticCurveTo(cx + headR * 0.85, headCY + headR * 0.5, cx + headR * 0.45, headCY + headR * 0.92);
  ctx.quadraticCurveTo(cx, headCY + headR * 1.02, cx - headR * 0.45, headCY + headR * 0.92);
  ctx.quadraticCurveTo(cx - headR * 0.85, headCY + headR * 0.5, cx - headR * 0.88, headCY - headR * 0.05);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Simple hair silhouette
  ctx.fillStyle = '#3A2A1A';
  ctx.beginPath();
  ctx.ellipse(cx, headCY - headR * 0.12, headR * 0.94, headR * 0.72, 0, Math.PI, 0);
  ctx.fill();

  // Ears
  for (const s of [-1, 1]) {
    ctx.fillStyle = skin;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.ellipse(cx + s * headR * 0.86, headCY + headR * 0.05, headR * 0.08, headR * 0.16, s * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Minimal face: just eyes and mouth
  const eyeY = headCY + headR * 0.0;
  const eyeGap = headR * 0.3;
  ctx.fillStyle = '#3A2A1A';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + s * eyeGap, eyeY, headR * 0.09, headR * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mouth
  ctx.strokeStyle = '#C08060';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, headCY + headR * 0.48, headR * 0.15, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();

  ctx.restore();
}
