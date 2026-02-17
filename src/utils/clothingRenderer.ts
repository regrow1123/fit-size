import type { AvatarDimensions, ClothingCategory, ClothingDimensions, PointMeasurement } from '../types';
import { cmToPx } from './avatarCalculator';

/**
 * 옷 실측치(cm)를 px로 변환
 */
export function calculateClothingDimensions(
  measurements: Map<string, number>,
  bodyHeight: number,
  _category: ClothingCategory,
): ClothingDimensions {
  const toPx = (cm: number) => cmToPx(cm, bodyHeight);

  return {
    category: 'tshirt',
    shoulderWidth: toPx(measurements.get('shoulderWidth') ?? 45),
    chestWidth: toPx(measurements.get('chestWidth') ?? 50),
    totalLength: toPx(measurements.get('totalLength') ?? 70),
    sleeveLength: toPx(measurements.get('sleeveLength') ?? 22),
    sleeveWidth: toPx((measurements.get('sleeveCirc') ?? 36) / 2),
    hemWidth: toPx((measurements.get('hemCirc') ?? 100) / 2),
  };
}

// ── Style ──
const COLORS = {
  fill: 'rgba(70, 130, 180, 0.30)',
  stroke: 'rgba(30, 80, 140, 0.75)',
};

const ARM_ANGLE = 15 * Math.PI / 180;
const sinA = Math.sin(ARM_ANGLE);
const cosA = Math.cos(ARM_ANGLE);

/**
 * Canvas에 옷을 아바타 위에 오버레이
 */
export function drawClothing(
  ctx: CanvasRenderingContext2D,
  av: AvatarDimensions,
  cl: ClothingDimensions,
  canvasWidth: number,
) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.fillStyle = COLORS.fill;
  ctx.strokeStyle = COLORS.stroke;
  ctx.lineWidth = 1.5;

  drawTshirt(ctx, av, cl, canvasWidth);

  ctx.restore();
}

/**
 * 아바타 해부학적 좌표를 기준으로 옷의 폭을 각 높이에서 계산.
 * 옷 치수(어깨/가슴/밑단)와 아바타 비율을 결합하여
 * 중간 포인트(언더바스트, 허리 등)에서의 옷 폭을 보간한다.
 */
function drawTshirt(
  ctx: CanvasRenderingContext2D,
  av: AvatarDimensions,
  cl: ClothingDimensions,
  cw: number,
) {
  const cx = cw / 2;

  // ── 기본 치수 ──
  const sy = av.shoulderY;
  const shH = cl.shoulderWidth / 2;        // 옷 어깨 반폭
  const chH = cl.chestWidth / 2;           // 옷 가슴 반폭 (단면)
  const hemH = cl.hemWidth / 2;            // 옷 밑단 반폭
  const nkH = av.neckWidth / 2;
  const hemY = sy + cl.totalLength;

  // ── 아바타 해부학적 포인트에서 옷 폭 보간 ──
  // 옷의 가슴단면과 아바타의 체형 비율을 결합
  const avChH = av.chestWidth / 2;         // 아바타 가슴 반폭
  const avUbH = av.underbustWidth / 2;     // 아바타 언더바스트 반폭
  const avWaH = av.waistWidth / 2;         // 아바타 허리 반폭
  const avHiH = av.hipWidth / 2;           // 아바타 엉덩이 반폭

  // 옷/아바타 가슴폭 비율로 다른 높이의 옷 폭 추정
  const clothToBodyRatio = chH / avChH;

  // 겨드랑이 (가슴보다 살짝 좁음 — 봉제선)
  const armpitH = chH * 0.97;
  const armpitY = av.chestY - (av.chestY - sy) * 0.35;

  // 언더바스트 폭: 아바타 비율 유지
  const ubH = avUbH * clothToBodyRatio;

  // 허리 폭: 밑단과 가슴 사이 보간 (옷은 체형보다 직선적)
  // 허리가 hemY보다 아래면 밑단이 더 좁으므로 hemH 사용
  const waistInRange = av.waistY < hemY;
  const waH = waistInRange
    ? Math.max(avWaH * clothToBodyRatio, hemH * 0.95)
    : hemH;

  // 엉덩이 폭 (hemY 위에 있을 때만)
  const hipInRange = av.hipY < hemY;
  const hiH = hipInRange
    ? Math.max(avHiH * clothToBodyRatio * 0.95, hemH)
    : hemH;

  // ── 소매 ──
  const slLen = cl.sleeveLength;
  const slTopW = cl.sleeveWidth;            // 소매 상단 반폭
  const slEndW = slTopW * 0.88;             // 소매 하단 반폭

  // 소매 중간 포인트 (팔꿈치 방향으로 약간 테이퍼)
  const slMidW = slTopW * 0.94;

  // ════════════════════════════════════════
  // 하나의 연속 경로
  // ════════════════════════════════════════
  ctx.beginPath();

  // ── 네크라인 (라운드넥) ──
  const neckDepth = 8;
  ctx.moveTo(cx - nkH, sy - 3);
  ctx.bezierCurveTo(
    cx - nkH * 0.6, sy + neckDepth * 0.3,
    cx + nkH * 0.6, sy + neckDepth * 0.3,
    cx + nkH, sy - 3,
  );

  // ── 오른쪽 어깨선 ──
  // 어깨는 약간 곡선 (봉제선 표현)
  ctx.bezierCurveTo(
    cx + nkH + (shH - nkH) * 0.3, sy - 4,
    cx + shH - (shH - nkH) * 0.2, sy - 1,
    cx + shH, sy,
  );

  // ── 오른쪽 소매 외측 ──
  // 어깨에서 소매 팁까지 — 아바타와 같은 15도 각도
  const rTipCX = cx + shH + slLen * sinA;
  const rTipCY = sy + slLen * cosA;

  // 수직에 수직인 방향 (소매 폭 방향)
  const perpX = cosA;
  const perpY = -sinA;

  // 소매 중간 지점
  const rMidCX = cx + shH + slLen * sinA * 0.5;
  const rMidCY = sy + slLen * cosA * 0.5;

  // 외측: 어깨 → 중간 → 끝
  ctx.bezierCurveTo(
    cx + shH + slLen * sinA * 0.15 + perpX * slTopW * 0.1,
    sy + slLen * cosA * 0.15 + perpY * slTopW * 0.1,
    rMidCX + perpX * slMidW * 0.52,
    rMidCY + perpY * slMidW * 0.52,
    rMidCX + perpX * slMidW * 0.5,
    rMidCY + perpY * slMidW * 0.5,
  );
  ctx.bezierCurveTo(
    rMidCX + perpX * slMidW * 0.48 + slLen * sinA * 0.15,
    rMidCY + perpY * slMidW * 0.48 + slLen * cosA * 0.15,
    rTipCX + perpX * slEndW * 0.5 - slLen * sinA * 0.08,
    rTipCY + perpY * slEndW * 0.5 - slLen * cosA * 0.08,
    rTipCX + perpX * slEndW * 0.5,
    rTipCY + perpY * slEndW * 0.5,
  );

  // ── 오른쪽 소매 끝단 (약간 곡선) ──
  ctx.bezierCurveTo(
    rTipCX + perpX * slEndW * 0.2, rTipCY + perpY * slEndW * 0.2 + 2,
    rTipCX - perpX * slEndW * 0.2, rTipCY - perpY * slEndW * 0.2 + 2,
    rTipCX - perpX * slEndW * 0.5, rTipCY - perpY * slEndW * 0.5,
  );

  // ── 오른쪽 소매 내측 → 겨드랑이 ──
  // 내측 중간 포인트
  ctx.bezierCurveTo(
    rTipCX - perpX * slEndW * 0.5 - slLen * sinA * 0.08,
    rTipCY - perpY * slEndW * 0.5 - slLen * cosA * 0.08,
    rMidCX - perpX * slMidW * 0.48 + slLen * sinA * 0.15,
    rMidCY - perpY * slMidW * 0.48 + slLen * cosA * 0.15,
    rMidCX - perpX * slMidW * 0.5,
    rMidCY - perpY * slMidW * 0.5,
  );
  // 중간 → 겨드랑이
  ctx.bezierCurveTo(
    rMidCX - perpX * slMidW * 0.52 - slLen * sinA * 0.15,
    rMidCY - perpY * slMidW * 0.52 - slLen * cosA * 0.15,
    cx + armpitH + 3, armpitY - (armpitY - sy) * 0.2,
    cx + armpitH, armpitY,
  );

  // ── 오른쪽 몸통: 겨드랑이 → 가슴 → 언더바스트 → 허리 → [엉덩이] → 밑단 ──
  // 겨드랑이 → 가슴
  ctx.bezierCurveTo(
    cx + armpitH - 1, armpitY + (av.chestY - armpitY) * 0.5,
    cx + chH + 2, av.chestY - (av.chestY - armpitY) * 0.15,
    cx + chH, av.chestY,
  );

  // 가슴 → 언더바스트
  ctx.bezierCurveTo(
    cx + chH - 0.5, av.chestY + (av.underbustY - av.chestY) * 0.5,
    cx + ubH + 1, av.underbustY - (av.underbustY - av.chestY) * 0.15,
    cx + ubH, av.underbustY,
  );

  if (waistInRange) {
    // 언더바스트 → 허리
    ctx.bezierCurveTo(
      cx + ubH - 0.5, av.underbustY + (av.waistY - av.underbustY) * 0.4,
      cx + waH + 1.5, av.waistY - (av.waistY - av.underbustY) * 0.2,
      cx + waH, av.waistY,
    );

    if (hipInRange) {
      // 허리 → 엉덩이
      ctx.bezierCurveTo(
        cx + waH + 1, av.waistY + (av.hipY - av.waistY) * 0.35,
        cx + hiH + 2, av.hipY - (av.hipY - av.waistY) * 0.25,
        cx + hiH, av.hipY,
      );
      // 엉덩이 → 밑단
      ctx.bezierCurveTo(
        cx + hiH - 1, av.hipY + (hemY - av.hipY) * 0.4,
        cx + hemH + 1, hemY - (hemY - av.hipY) * 0.15,
        cx + hemH, hemY,
      );
    } else {
      // 허리 → 밑단 (짧은 옷)
      ctx.bezierCurveTo(
        cx + waH + 1, av.waistY + (hemY - av.waistY) * 0.4,
        cx + hemH + 1, hemY - (hemY - av.waistY) * 0.15,
        cx + hemH, hemY,
      );
    }
  } else {
    // 언더바스트 → 밑단 (매우 짧은 옷)
    ctx.bezierCurveTo(
      cx + ubH - 0.5, av.underbustY + (hemY - av.underbustY) * 0.4,
      cx + hemH + 1, hemY - (hemY - av.underbustY) * 0.15,
      cx + hemH, hemY,
    );
  }

  // ── 밑단 (살짝 곡선) ──
  ctx.bezierCurveTo(
    cx + hemH * 0.6, hemY + 2,
    cx - hemH * 0.6, hemY + 2,
    cx - hemH, hemY,
  );

  // ── 왼쪽 몸통 (대칭) ──
  if (waistInRange) {
    if (hipInRange) {
      // 밑단 → 엉덩이
      ctx.bezierCurveTo(
        cx - hemH - 1, hemY - (hemY - av.hipY) * 0.15,
        cx - hiH + 1, av.hipY + (hemY - av.hipY) * 0.4,
        cx - hiH, av.hipY,
      );
      // 엉덩이 → 허리
      ctx.bezierCurveTo(
        cx - hiH - 2, av.hipY - (av.hipY - av.waistY) * 0.25,
        cx - waH - 1, av.waistY + (av.hipY - av.waistY) * 0.35,
        cx - waH, av.waistY,
      );
    } else {
      // 밑단 → 허리
      ctx.bezierCurveTo(
        cx - hemH - 1, hemY - (hemY - av.waistY) * 0.15,
        cx - waH - 1, av.waistY + (hemY - av.waistY) * 0.4,
        cx - waH, av.waistY,
      );
    }
    // 허리 → 언더바스트
    ctx.bezierCurveTo(
      cx - waH - 1.5, av.waistY - (av.waistY - av.underbustY) * 0.2,
      cx - ubH + 0.5, av.underbustY + (av.waistY - av.underbustY) * 0.4,
      cx - ubH, av.underbustY,
    );
  } else {
    // 밑단 → 언더바스트
    ctx.bezierCurveTo(
      cx - hemH - 1, hemY - (hemY - av.underbustY) * 0.15,
      cx - ubH + 0.5, av.underbustY + (hemY - av.underbustY) * 0.4,
      cx - ubH, av.underbustY,
    );
  }

  // 언더바스트 → 가슴
  ctx.bezierCurveTo(
    cx - ubH - 1, av.underbustY - (av.underbustY - av.chestY) * 0.15,
    cx - chH + 0.5, av.chestY + (av.underbustY - av.chestY) * 0.5,
    cx - chH, av.chestY,
  );

  // 가슴 → 겨드랑이
  ctx.bezierCurveTo(
    cx - chH - 2, av.chestY - (av.chestY - armpitY) * 0.15,
    cx - armpitH + 1, armpitY + (av.chestY - armpitY) * 0.5,
    cx - armpitH, armpitY,
  );

  // ── 왼쪽 소매 ──
  const lTipCX = cx - shH - slLen * sinA;
  const lTipCY = sy + slLen * cosA;
  const lMidCX = cx - shH - slLen * sinA * 0.5;
  const lMidCY = sy + slLen * cosA * 0.5;

  // 겨드랑이 → 소매 내측 중간
  ctx.bezierCurveTo(
    cx - armpitH - 3, armpitY - (armpitY - sy) * 0.2,
    lMidCX + perpX * slMidW * 0.52 - slLen * sinA * 0.15,
    lMidCY + perpY * slMidW * 0.52 - slLen * cosA * 0.15,
    lMidCX + perpX * slMidW * 0.5,
    lMidCY + perpY * slMidW * 0.5,
  );
  // 중간 → 소매끝 내측
  ctx.bezierCurveTo(
    lMidCX + perpX * slMidW * 0.48 + slLen * sinA * 0.15,
    lMidCY + perpY * slMidW * 0.48 + slLen * cosA * 0.15,
    lTipCX + perpX * slEndW * 0.5 - slLen * sinA * 0.08,
    lTipCY + perpY * slEndW * 0.5 - slLen * cosA * 0.08,
    lTipCX + perpX * slEndW * 0.5,
    lTipCY + perpY * slEndW * 0.5,
  );

  // 왼쪽 소매 끝단
  ctx.bezierCurveTo(
    lTipCX + perpX * slEndW * 0.2, lTipCY + perpY * slEndW * 0.2 + 2,
    lTipCX - perpX * slEndW * 0.2, lTipCY - perpY * slEndW * 0.2 + 2,
    lTipCX - perpX * slEndW * 0.5, lTipCY - perpY * slEndW * 0.5,
  );

  // 왼쪽 소매 외측 → 어깨
  ctx.bezierCurveTo(
    lTipCX - perpX * slEndW * 0.5 + slLen * sinA * 0.08,
    lTipCY - perpY * slEndW * 0.5 - slLen * cosA * 0.08,
    lMidCX - perpX * slMidW * 0.48 - slLen * sinA * 0.15,
    lMidCY - perpY * slMidW * 0.48 - slLen * cosA * 0.15,
    lMidCX - perpX * slMidW * 0.5,
    lMidCY - perpY * slMidW * 0.5,
  );
  ctx.bezierCurveTo(
    lMidCX - perpX * slMidW * 0.52 + slLen * sinA * 0.15,
    lMidCY - perpY * slMidW * 0.52 + slLen * cosA * 0.15,
    cx - shH - slLen * sinA * 0.15 - perpX * slTopW * 0.1,
    sy + slLen * cosA * 0.15 - perpY * slTopW * 0.1,
    cx - shH, sy,
  );

  // ── 왼쪽 어깨선 → 네크라인 닫기 ──
  ctx.bezierCurveTo(
    cx - shH + (shH - nkH) * 0.2, sy - 1,
    cx - nkH - (shH - nkH) * 0.3, sy - 4,
    cx - nkH, sy - 3,
  );

  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // ── 봉제선 디테일 (옵션) ──
  ctx.save();
  ctx.strokeStyle = 'rgba(30, 80, 140, 0.2)';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([3, 4]);

  // 어깨 봉제선
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + s * nkH, sy - 3);
    ctx.bezierCurveTo(
      cx + s * (nkH + (shH - nkH) * 0.4), sy - 3,
      cx + s * (shH - (shH - nkH) * 0.2), sy - 1,
      cx + s * shH, sy,
    );
    ctx.stroke();
  }

  ctx.setLineDash([]);
  ctx.restore();
}

/**
 * PointMeasurement[] → Map<string, number> 변환
 */
export function pointMeasurementsToMap(measurements: PointMeasurement[], _category: ClothingCategory = 'tshirt'): Map<string, number> {
  const map = new Map<string, number>();

  type Rule = { starts: string[]; ends: string[]; key: string; transform?: (v: number) => number };

  const rules: Rule[] = [
    { starts: ['shoulder_end_left'], ends: ['shoulder_end_right'], key: 'shoulderWidth' },
    { starts: ['neck_back_center', 'below_back_neck'], ends: ['hem_center', 'hem_left', 'hem_right'], key: 'totalLength' },
    { starts: ['shoulder_end_left', 'shoulder_end_right', 'shoulder_seam_left', 'shoulder_seam_right'], ends: ['sleeve_end_left', 'sleeve_end_right', 'cuff_left', 'cuff_right'], key: 'sleeveLength' },
    { starts: ['chest_left'], ends: ['chest_right'], key: 'chestWidth' },
    { starts: ['waist_left'], ends: ['waist_right'], key: 'waistCirc', transform: v => v * 2 },
    { starts: ['hem_left'], ends: ['hem_right'], key: 'hemCirc', transform: v => v * 2 },
    { starts: ['armpit_left', 'armpit_right'], ends: ['sleeve_end_left', 'sleeve_end_right', 'cuff_left', 'cuff_right'], key: 'sleeveCirc', transform: v => v * 2 },
  ];

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
