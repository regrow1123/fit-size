import type { AvatarDimensions } from '../types';

/**
 * 아바타 렌더러 — 단색 실루엣, 해부학적 포인트 기반
 *
 * 모든 좌표는 AvatarDimensions에서 계산된 절대값 사용.
 * 그래디언트/얼굴 없이 실루엣의 정확성에 집중.
 */
export function drawAvatar(
  ctx: CanvasRenderingContext2D,
  d: AvatarDimensions,
  canvasWidth: number,
  canvasHeight: number,
) {
  const cx = canvasWidth / 2;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.save();

  // 단색 스타일
  const fillColor = '#D4B896';
  const strokeColor = 'rgba(120, 90, 60, 0.45)';
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 0.8;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // 약한 그림자 (입체감만)
  const shadow = 'rgba(120, 90, 60, 0.08)';

  // ── half-widths ──
  const shH = d.shoulderWidth / 2;
  const chH = d.chestWidth / 2;
  const ubH = d.underbustWidth / 2;
  const waH = d.waistWidth / 2;
  const hiH = d.hipWidth / 2;
  const nkH = d.neckWidth / 2;

  // ════════════════════════════════════════
  // 1. ARMS (뒤에 먼저)
  // ════════════════════════════════════════
  for (const s of [-1, 1]) {
    const sx = cx + s * shH;
    // 팔 각도: 자연스럽게 살짝 벌어짐
    const elX = sx + s * 14;
    const wrX = sx + s * 20;
    const handX = wrX + s * 2;
    const handEndY = d.wristY + d.upperArmWidth * 2.5;

    const upH = d.upperArmWidth / 2;
    const elH = d.elbowWidth / 2;
    const faH = d.forearmWidth / 2;
    const wrH = d.wristWidth / 2;

    ctx.beginPath();
    // 외측: 어깨 → 팔꿈치 → 손목
    ctx.moveTo(sx + s * upH, d.shoulderY + 2);
    ctx.bezierCurveTo(
      sx + s * upH * 1.1, d.shoulderY + (d.elbowY - d.shoulderY) * 0.35,
      elX + s * elH * 1.05, d.elbowY - (d.elbowY - d.shoulderY) * 0.1,
      elX + s * elH, d.elbowY,
    );
    ctx.bezierCurveTo(
      elX + s * faH, d.elbowY + (d.wristY - d.elbowY) * 0.15,
      wrX + s * wrH * 1.1, d.wristY - (d.wristY - d.elbowY) * 0.15,
      wrX + s * wrH, d.wristY,
    );
    // 손 (단순 라운드)
    const hW = wrH * 1.5;
    ctx.quadraticCurveTo(handX + s * hW, d.wristY + 5, handX + s * hW * 0.6, handEndY);
    ctx.quadraticCurveTo(handX, handEndY + 3, handX - s * hW * 0.3, handEndY - 3);
    ctx.quadraticCurveTo(wrX - s * wrH * 0.3, d.wristY + 4, wrX - s * wrH, d.wristY);
    // 내측: 손목 → 팔꿈치 → 어깨
    ctx.bezierCurveTo(
      wrX - s * wrH * 1.1, d.wristY - (d.wristY - d.elbowY) * 0.15,
      elX - s * faH * 0.7, d.elbowY + (d.wristY - d.elbowY) * 0.15,
      elX - s * elH * 0.65, d.elbowY,
    );
    ctx.bezierCurveTo(
      elX - s * elH * 0.6, d.elbowY - (d.elbowY - d.shoulderY) * 0.1,
      sx - s * upH * 0.05, d.shoulderY + (d.elbowY - d.shoulderY) * 0.2,
      sx - s * 2, d.shoulderY + 4,
    );
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // ════════════════════════════════════════
  // 2. TORSO (어깨~가랑이, 하나의 연결된 경로)
  // ════════════════════════════════════════
  ctx.beginPath();

  // 왼쪽 실루엣: 어깨 → 가슴 → 언더바스트 → 허리 → 엉덩이 → 가랑이
  ctx.moveTo(cx - shH, d.shoulderY);

  // 어깨 → 겨드랑이/가슴 (삼각근 커브)
  ctx.bezierCurveTo(
    cx - shH - 1, d.shoulderY + (d.chestY - d.shoulderY) * 0.3,
    cx - chH - 6, d.chestY - (d.chestY - d.shoulderY) * 0.2,
    cx - chH, d.chestY,
  );

  // 가슴 → 언더바스트
  ctx.bezierCurveTo(
    cx - chH + 1, d.chestY + (d.underbustY - d.chestY) * 0.5,
    cx - ubH - 2, d.underbustY - (d.underbustY - d.chestY) * 0.2,
    cx - ubH, d.underbustY,
  );

  // 언더바스트 → 허리 (가장 좁은 부분)
  ctx.bezierCurveTo(
    cx - ubH + 1, d.underbustY + (d.waistY - d.underbustY) * 0.4,
    cx - waH - 2, d.waistY - (d.waistY - d.underbustY) * 0.3,
    cx - waH, d.waistY,
  );

  // 허리 → 엉덩이 (외측으로 넓어짐)
  ctx.bezierCurveTo(
    cx - waH - 1, d.waistY + (d.hipY - d.waistY) * 0.3,
    cx - hiH - 3, d.hipY - (d.hipY - d.waistY) * 0.3,
    cx - hiH, d.hipY,
  );

  // 엉덩이 → 가랑이 (안쪽으로 좁아짐)
  const innerThighH = d.thighWidth / 2;
  ctx.bezierCurveTo(
    cx - hiH + 1, d.hipY + (d.crotchY - d.hipY) * 0.5,
    cx - innerThighH * 1.8, d.crotchY - (d.crotchY - d.hipY) * 0.2,
    cx - innerThighH * 1.2, d.crotchY,
  );

  // 가랑이 아치
  ctx.quadraticCurveTo(cx, d.crotchY + 8, cx + innerThighH * 1.2, d.crotchY);

  // 오른쪽 (대칭)
  ctx.bezierCurveTo(
    cx + innerThighH * 1.8, d.crotchY - (d.crotchY - d.hipY) * 0.2,
    cx + hiH - 1, d.hipY + (d.crotchY - d.hipY) * 0.5,
    cx + hiH, d.hipY,
  );
  ctx.bezierCurveTo(
    cx + hiH + 3, d.hipY - (d.hipY - d.waistY) * 0.3,
    cx + waH + 1, d.waistY + (d.hipY - d.waistY) * 0.3,
    cx + waH, d.waistY,
  );
  ctx.bezierCurveTo(
    cx + waH + 2, d.waistY - (d.waistY - d.underbustY) * 0.3,
    cx + ubH - 1, d.underbustY + (d.waistY - d.underbustY) * 0.4,
    cx + ubH, d.underbustY,
  );
  ctx.bezierCurveTo(
    cx + ubH + 2, d.underbustY - (d.underbustY - d.chestY) * 0.2,
    cx + chH - 1, d.chestY + (d.underbustY - d.chestY) * 0.5,
    cx + chH, d.chestY,
  );
  ctx.bezierCurveTo(
    cx + chH + 6, d.chestY - (d.chestY - d.shoulderY) * 0.2,
    cx + shH + 1, d.shoulderY + (d.chestY - d.shoulderY) * 0.3,
    cx + shH, d.shoulderY,
  );

  // 목 연결
  ctx.quadraticCurveTo(cx + nkH * 1.4, d.shoulderY - 3, cx + nkH, d.neckBottomY);
  ctx.lineTo(cx - nkH, d.neckBottomY);
  ctx.quadraticCurveTo(cx - nkH * 1.4, d.shoulderY - 3, cx - shH, d.shoulderY);

  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 허리라인 그림자 (입체감)
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(cx, d.waistY, waH * 0.9, 3, 0, 0, Math.PI);
  ctx.fill();

  // 배꼽
  ctx.beginPath();
  ctx.ellipse(cx, d.waistY - 8, 1.5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = fillColor;

  // ════════════════════════════════════════
  // 3. LEGS
  // ════════════════════════════════════════
  for (const s of [-1, 1]) {
    const legCX = cx + s * hiH * 0.42;
    const thH = d.thighWidth / 2;
    const knH = d.kneeWidth / 2;
    const caH = d.calfWidth / 2;
    const anH = d.ankleWidth / 2;
    const footEnd = d.ankleY + 14;

    ctx.beginPath();

    // 외측 허벅지
    ctx.moveTo(legCX + s * thH, d.crotchY);
    ctx.bezierCurveTo(
      legCX + s * thH * 1.0, d.crotchY + (d.kneeY - d.crotchY) * 0.3,
      legCX + s * knH * 1.15, d.kneeY - (d.kneeY - d.crotchY) * 0.15,
      legCX + s * knH, d.kneeY,
    );

    // 외측 종아리 (볼록)
    ctx.bezierCurveTo(
      legCX + s * caH * 1.2, d.kneeY + (d.calfY - d.kneeY) * 0.4,
      legCX + s * caH * 1.15, d.calfY - (d.calfY - d.kneeY) * 0.1,
      legCX + s * caH, d.calfY,
    );

    // 종아리 → 발목
    ctx.bezierCurveTo(
      legCX + s * caH * 0.7, d.calfY + (d.ankleY - d.calfY) * 0.4,
      legCX + s * anH * 1.3, d.ankleY - (d.ankleY - d.calfY) * 0.2,
      legCX + s * anH, d.ankleY,
    );

    // 발
    ctx.quadraticCurveTo(
      legCX + s * anH * 0.8, d.ankleY + 6,
      legCX + s * d.footLength, footEnd,
    );
    ctx.quadraticCurveTo(
      legCX + s * d.footLength * 0.3, footEnd + 3,
      legCX - s * anH * 0.2, footEnd - 2,
    );
    ctx.quadraticCurveTo(
      legCX - s * anH * 0.6, d.ankleY + 4,
      legCX - s * anH, d.ankleY,
    );

    // 내측 종아리 ← 발목
    ctx.bezierCurveTo(
      legCX - s * anH * 1.2, d.ankleY - (d.ankleY - d.calfY) * 0.2,
      legCX - s * caH * 0.55, d.calfY + (d.ankleY - d.calfY) * 0.4,
      legCX - s * caH * 0.7, d.calfY,
    );

    // 내측 무릎 ← 종아리
    ctx.bezierCurveTo(
      legCX - s * caH * 0.9, d.calfY - (d.calfY - d.kneeY) * 0.1,
      legCX - s * knH * 1.0, d.kneeY + (d.calfY - d.kneeY) * 0.4,
      legCX - s * knH * 0.65, d.kneeY,
    );

    // 내측 허벅지
    ctx.bezierCurveTo(
      legCX - s * knH * 0.9, d.kneeY - (d.kneeY - d.crotchY) * 0.15,
      legCX - s * thH * 0.75, d.crotchY + (d.kneeY - d.crotchY) * 0.2,
      legCX - s * thH * 0.6, d.crotchY,
    );

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 무릎 힌트
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(legCX + s * 1, d.kneeY, knH * 0.35, d.legLength * 0.015, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fillColor;
  }

  // ════════════════════════════════════════
  // 4. NECK
  // ════════════════════════════════════════
  ctx.beginPath();
  ctx.moveTo(cx - nkH, d.neckTopY);
  ctx.bezierCurveTo(
    cx - nkH * 1.05, (d.neckTopY + d.neckBottomY) / 2,
    cx - nkH * 1.15, d.neckBottomY,
    cx - nkH * 1.25, d.neckBottomY + 2,
  );
  ctx.lineTo(cx + nkH * 1.25, d.neckBottomY + 2);
  ctx.bezierCurveTo(
    cx + nkH * 1.15, d.neckBottomY,
    cx + nkH * 1.05, (d.neckTopY + d.neckBottomY) / 2,
    cx + nkH, d.neckTopY,
  );
  ctx.closePath();
  ctx.fill();

  // ════════════════════════════════════════
  // 5. HEAD (실루엣만 — 얼굴 없음)
  // ════════════════════════════════════════
  const hr = d.headRadius;

  // 머리 형태: 위는 둥글고 아래는 턱으로 좁아짐
  ctx.beginPath();
  // 두개골 상단 (타원)
  ctx.ellipse(cx, d.headCY - hr * 0.08, hr * 0.88, hr * 0.9, 0, Math.PI + 0.25, -0.25);
  // 오른쪽 턱라인
  ctx.quadraticCurveTo(
    cx + hr * 0.82, d.headCY + hr * 0.45,
    cx + hr * 0.4, d.headCY + hr * 0.9,
  );
  // 턱끝
  ctx.quadraticCurveTo(cx, d.headCY + hr * 0.98, cx - hr * 0.4, d.headCY + hr * 0.9);
  // 왼쪽 턱라인
  ctx.quadraticCurveTo(
    cx - hr * 0.82, d.headCY + hr * 0.45,
    cx - hr * 0.88, d.headCY - hr * 0.08,
  );
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 귀
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + s * hr * 0.85, d.headCY + hr * 0.05, hr * 0.07, hr * 0.15, s * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}
