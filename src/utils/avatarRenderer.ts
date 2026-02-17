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
  const ARM_ANGLE = 15 * Math.PI / 180; // 팔 벌림 각도
  const sinA = Math.sin(ARM_ANGLE);
  const cosA = Math.cos(ARM_ANGLE);

  for (const s of [-1, 1]) {
    // 어깨 끝점
    const sx = cx + s * shH;
    // 겨드랑이 (팔 내측 시작점 — 가슴 높이, 가슴 폭 위치)
    const axillaX = cx + s * chH;
    const axillaY = d.chestY;

    // 팔 중심선: 각도 기반 (어깨에서 벌림)
    const elbowDist = d.elbowY - d.shoulderY;
    const wristDist = d.wristY - d.shoulderY;
    const elX = sx + s * elbowDist * sinA;
    const elY = d.shoulderY + elbowDist * cosA;
    const wrX = sx + s * wristDist * sinA;
    const wrY = d.shoulderY + wristDist * cosA;

    const upH = d.upperArmWidth / 2;
    const elH = d.elbowWidth / 2;
    const faH = d.forearmWidth / 2;
    const wrH = d.wristWidth / 2;

    // 삼두근 볼륨 포인트 (상완 40% 지점)
    const midDist = elbowDist * 0.4;
    const midArmX = sx + s * midDist * sinA;
    const midArmY = d.shoulderY + midDist * cosA;
    const bicepBulge = upH * 1.2; // 이두근/삼두근 볼륨

    ctx.beginPath();

    // ── 외측 (삼각근 → 삼두근 → 팔꿈치 → 전완 → 손목) ──
    // 삼각근: 어깨 위에서 시작, 둥근 어깨캡
    ctx.moveTo(sx + s * upH * 0.5, d.shoulderY - 2);
    // 어깨 캡 (삼각근 볼록)
    ctx.bezierCurveTo(
      sx + s * (upH * 1.3), d.shoulderY + 4,
      sx + s * (upH * 1.35), d.shoulderY + (midArmY - d.shoulderY) * 0.4,
      midArmX + s * bicepBulge, midArmY,
    );
    // 상완 → 팔꿈치 (살짝 테이퍼)
    ctx.bezierCurveTo(
      midArmX + s * bicepBulge * 0.9, midArmY + (elY - midArmY) * 0.5,
      elX + s * elH * 1.1, elY - (elY - midArmY) * 0.2,
      elX + s * elH, elY,
    );
    // 전완: 팔꿈치 → 손목 (점진적 테이퍼)
    ctx.bezierCurveTo(
      elX + s * faH * 1.05, elY + (wrY - elY) * 0.2,
      wrX + s * wrH * 1.15, wrY - (wrY - elY) * 0.2,
      wrX + s * wrH, wrY,
    );

    // ── 손 ──
    const handW = wrH * 1.6;
    const handLen = d.upperArmWidth * 1.2;
    const handEndY = wrY + handLen;
    const palmEndY = wrY + handLen * 0.6;
    const fingerTipY = handEndY;

    // 손목 → 손바닥 외측
    ctx.bezierCurveTo(
      wrX + s * handW, wrY + 3,
      wrX + s * handW * 1.05, palmEndY - 5,
      wrX + s * handW * 0.95, palmEndY,
    );
    // 손가락들 (4개 — 살짝 구분)
    const fingerW = handW * 0.85;
    for (let f = 0; f < 4; f++) {
      const t = f / 3; // 0~1
      const fx = wrX + s * (fingerW * (1 - t * 0.6));
      const tipY = fingerTipY - f * 1.5; // 중지가 가장 긺
      if (f === 0) {
        ctx.lineTo(fx, tipY);
      } else {
        const prevFx = wrX + s * (fingerW * (1 - (f - 1) / 3 * 0.6));
        ctx.quadraticCurveTo((fx + prevFx) / 2, palmEndY + 2, fx, tipY);
      }
      // 손가락 끝 라운드
      ctx.quadraticCurveTo(
        fx - s * handW * 0.06, tipY + 2,
        fx - s * handW * 0.12, tipY - 1,
      );
    }
    // 손바닥 내측으로 돌아옴
    ctx.quadraticCurveTo(
      wrX - s * handW * 0.15, palmEndY + 3,
      wrX - s * handW * 0.2, palmEndY - 2,
    );
    // 엄지 (내측, 짧고 옆으로)
    const thumbY = wrY + handLen * 0.2;
    ctx.quadraticCurveTo(
      wrX - s * handW * 0.4, thumbY + 8,
      wrX - s * handW * 0.5, thumbY + 3,
    );
    ctx.quadraticCurveTo(
      wrX - s * handW * 0.45, thumbY - 3,
      wrX - s * wrH * 0.8, wrY + 2,
    );

    // ── 내측 (손목 → 전완 → 팔꿈치 → 겨드랑이) ──
    // 손목에서 올라감
    ctx.lineTo(wrX - s * wrH, wrY);
    // 전완 내측 (약간 볼록 — 전완 근육)
    ctx.bezierCurveTo(
      wrX - s * wrH * 1.1, wrY - (wrY - elY) * 0.2,
      elX - s * faH * 0.85, elY + (wrY - elY) * 0.2,
      elX - s * elH * 0.6, elY,
    );
    // 팔꿈치 → 상완 내측 (이두근 볼록)
    const innerBicep = upH * 0.9;
    ctx.bezierCurveTo(
      elX - s * elH * 0.55, elY - (elY - midArmY) * 0.2,
      midArmX - s * innerBicep * 0.85, midArmY + (elY - midArmY) * 0.3,
      midArmX - s * innerBicep, midArmY,
    );
    // 상완 내측 → 겨드랑이
    ctx.bezierCurveTo(
      midArmX - s * innerBicep * 0.9, midArmY - (midArmY - d.shoulderY) * 0.4,
      axillaX + s * 2, axillaY + 5,
      axillaX, axillaY,
    );
    // 겨드랑이 → 몸통 가슴라인을 따라 올라감 → 어깨 내측
    // (겨드랑이 갭을 없애기 위해 몸통 측면을 포함)
    ctx.bezierCurveTo(
      axillaX + s * 1, axillaY - (axillaY - d.shoulderY) * 0.3,
      cx + s * (shH - 3), d.shoulderY + (axillaY - d.shoulderY) * 0.2,
      sx + s * upH * 0.5, d.shoulderY - 2,
    );

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // ═══ 겨드랑이 삼각형 채우기 (팔-몸통 갭 제거) ═══
  for (const s of [-1, 1]) {
    const sx = cx + s * shH;
    const axX = cx + s * chH;
    const midDist = (d.elbowY - d.shoulderY) * 0.4;
    const midArmX = sx + s * midDist * sinA;
    const midArmY = d.shoulderY + midDist * cosA;
    const innerBicep = d.upperArmWidth / 2 * 0.9;

    ctx.beginPath();
    // 어깨 끝
    ctx.moveTo(sx, d.shoulderY);
    // 몸통 측면: 어깨 → 가슴
    ctx.bezierCurveTo(
      sx - s * 1, d.shoulderY + (d.chestY - d.shoulderY) * 0.3,
      axX + s * 4, d.chestY - (d.chestY - d.shoulderY) * 0.15,
      axX, d.chestY,
    );
    // 가슴에서 팔 내측으로
    ctx.bezierCurveTo(
      axX + s * 2, d.chestY - 5,
      midArmX - s * innerBicep * 0.9, midArmY + 10,
      midArmX - s * innerBicep, midArmY,
    );
    // 팔 내측을 따라 어깨로 복귀
    ctx.bezierCurveTo(
      midArmX - s * innerBicep * 0.85, midArmY - (midArmY - d.shoulderY) * 0.5,
      sx + s * d.upperArmWidth / 2 * 0.3, d.shoulderY + 5,
      sx, d.shoulderY,
    );
    ctx.closePath();
    ctx.fill();
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
