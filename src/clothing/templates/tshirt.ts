import type { AvatarDimensions, ClothingDimensions } from '../../types';
import type { ClothingTemplate, SleeveResult } from '../types';

const SLEEVE_ANGLE = 15; // degrees — used in SVG transform, NOT trig

/** Shared intermediate values — 옷 폭은 최소 몸 폭 이상 보장 */
function calc(av: AvatarDimensions, cl: ClothingDimensions, cx: number) {
  const sy = av.shoulderY;
  const avShH = av.shoulderWidth / 2;
  const avChH = av.chestWidth / 2;
  const avUbH = av.underbustWidth / 2;
  const avWaH = av.waistWidth / 2;
  const avHiH = av.hipWidth / 2;

  const shH = Math.max(cl.shoulderWidth / 2, avShH);
  const chH = Math.max(cl.chestWidth / 2, avChH);
  const hemH = Math.max(cl.hemWidth / 2, avWaH);
  const nkH = av.neckWidth / 2;
  const hemY = sy + cl.totalLength;

  const clothToBodyRatio = chH / avChH;
  const armpitH = Math.max(chH * 0.97, avChH);
  const armpitY = av.chestY - (av.chestY - sy) * 0.35;
  const ubH = Math.max(avUbH * clothToBodyRatio, avUbH);

  const waistInRange = av.waistY < hemY;
  const waH = waistInRange
    ? Math.max(avWaH * clothToBodyRatio, hemH * 0.95, avWaH)
    : hemH;

  const hipInRange = av.hipY < hemY;
  const hiH = hipInRange
    ? Math.max(avHiH * clothToBodyRatio * 0.95, hemH, avHiH)
    : hemH;

  const slLen = cl.sleeveLength;
  const minSlW = av.upperArmWidth * 0.6;
  // cl.sleeveWidth = 소매반둘레(px). 정면폭은 약 60%
  const slTopW = Math.max(cl.sleeveWidth * 0.6, minSlW);
  const slEndW = Math.max(slTopW * 0.88, minSlW * 0.85);

  return {
    cx, sy, shH, chH, hemH, nkH, hemY,
    armpitH, armpitY, ubH, waH, hiH,
    waistInRange, hipInRange,
    slLen, slTopW, slEndW,
  };
}

/** 몸통 path — 어깨~밑단, 네크라인 포함, 소매 제외 */
function buildBody(av: AvatarDimensions, cl: ClothingDimensions, cx: number): string {
  const c = calc(av, cl, cx);
  const { sy, shH, nkH, chH, hemH, hemY, armpitH, armpitY, ubH, waH, hiH, waistInRange, hipInRange } = c;
  const neckDepth = 8;
  const d: string[] = [];

  // 네크라인
  d.push(`M ${cx - nkH} ${sy - 3}`);
  d.push(`C ${cx - nkH * 0.6} ${sy + neckDepth * 0.3}, ${cx + nkH * 0.6} ${sy + neckDepth * 0.3}, ${cx + nkH} ${sy - 3}`);

  // 오른쪽 어깨선
  d.push(`C ${cx + nkH + (shH - nkH) * 0.3} ${sy - 4}, ${cx + shH - (shH - nkH) * 0.2} ${sy - 1}, ${cx + shH} ${sy}`);

  // 오른쪽: 어깨 → 겨드랑이
  d.push(`C ${cx + shH + 2} ${sy + (armpitY - sy) * 0.3}, ${cx + armpitH + 3} ${armpitY - (armpitY - sy) * 0.3}, ${cx + armpitH} ${armpitY}`);

  // 오른쪽 몸통: 겨드랑이 → 가슴 → 언더바스트 → 허리 → 엉덩이 → 밑단
  d.push(`C ${cx + armpitH - 1} ${armpitY + (av.chestY - armpitY) * 0.5}, ${cx + chH + 2} ${av.chestY - (av.chestY - armpitY) * 0.15}, ${cx + chH} ${av.chestY}`);
  d.push(`C ${cx + chH - 0.5} ${av.chestY + (av.underbustY - av.chestY) * 0.5}, ${cx + ubH + 1} ${av.underbustY - (av.underbustY - av.chestY) * 0.15}, ${cx + ubH} ${av.underbustY}`);

  if (waistInRange) {
    d.push(`C ${cx + ubH - 0.5} ${av.underbustY + (av.waistY - av.underbustY) * 0.4}, ${cx + waH + 1.5} ${av.waistY - (av.waistY - av.underbustY) * 0.2}, ${cx + waH} ${av.waistY}`);
    if (hipInRange) {
      d.push(`C ${cx + waH + 1} ${av.waistY + (av.hipY - av.waistY) * 0.35}, ${cx + hiH + 2} ${av.hipY - (av.hipY - av.waistY) * 0.25}, ${cx + hiH} ${av.hipY}`);
      d.push(`C ${cx + hiH - 1} ${av.hipY + (hemY - av.hipY) * 0.4}, ${cx + hemH + 1} ${hemY - (hemY - av.hipY) * 0.15}, ${cx + hemH} ${hemY}`);
    } else {
      d.push(`C ${cx + waH + 1} ${av.waistY + (hemY - av.waistY) * 0.4}, ${cx + hemH + 1} ${hemY - (hemY - av.waistY) * 0.15}, ${cx + hemH} ${hemY}`);
    }
  } else {
    d.push(`C ${cx + ubH - 0.5} ${av.underbustY + (hemY - av.underbustY) * 0.4}, ${cx + hemH + 1} ${hemY - (hemY - av.underbustY) * 0.15}, ${cx + hemH} ${hemY}`);
  }

  // 밑단
  d.push(`C ${cx + hemH * 0.6} ${hemY + 2}, ${cx - hemH * 0.6} ${hemY + 2}, ${cx - hemH} ${hemY}`);

  // 왼쪽 몸통 (역순)
  if (waistInRange) {
    if (hipInRange) {
      d.push(`C ${cx - hemH - 1} ${hemY - (hemY - av.hipY) * 0.15}, ${cx - hiH + 1} ${av.hipY + (hemY - av.hipY) * 0.4}, ${cx - hiH} ${av.hipY}`);
      d.push(`C ${cx - hiH - 2} ${av.hipY - (av.hipY - av.waistY) * 0.25}, ${cx - waH - 1} ${av.waistY + (av.hipY - av.waistY) * 0.35}, ${cx - waH} ${av.waistY}`);
    } else {
      d.push(`C ${cx - hemH - 1} ${hemY - (hemY - av.waistY) * 0.15}, ${cx - waH - 1} ${av.waistY + (hemY - av.waistY) * 0.4}, ${cx - waH} ${av.waistY}`);
    }
    d.push(`C ${cx - waH - 1.5} ${av.waistY - (av.waistY - av.underbustY) * 0.2}, ${cx - ubH + 0.5} ${av.underbustY + (av.waistY - av.underbustY) * 0.4}, ${cx - ubH} ${av.underbustY}`);
  } else {
    d.push(`C ${cx - hemH - 1} ${hemY - (hemY - av.underbustY) * 0.15}, ${cx - ubH + 0.5} ${av.underbustY + (hemY - av.underbustY) * 0.4}, ${cx - ubH} ${av.underbustY}`);
  }
  d.push(`C ${cx - ubH - 1} ${av.underbustY - (av.underbustY - av.chestY) * 0.15}, ${cx - chH + 0.5} ${av.chestY + (av.underbustY - av.chestY) * 0.5}, ${cx - chH} ${av.chestY}`);
  d.push(`C ${cx - chH - 2} ${av.chestY - (av.chestY - armpitY) * 0.15}, ${cx - armpitH + 1} ${armpitY + (av.chestY - armpitY) * 0.5}, ${cx - armpitH} ${armpitY}`);

  // 왼쪽: 겨드랑이 → 어깨
  d.push(`C ${cx - armpitH - 3} ${armpitY - (armpitY - sy) * 0.3}, ${cx - shH - 2} ${sy + (armpitY - sy) * 0.3}, ${cx - shH} ${sy}`);

  // 왼쪽 어깨선 → 네크라인
  d.push(`C ${cx - shH + (shH - nkH) * 0.2} ${sy - 1}, ${cx - nkH - (shH - nkH) * 0.3} ${sy - 4}, ${cx - nkH} ${sy - 3}`);

  d.push('Z');
  return d.join(' ');
}

/**
 * 직선 소매 path — 회전 전 (아래로 뻗은 사다리꼴).
 * SVG transform="rotate(±15, shoulderX, shoulderY)"로 기울임.
 * 삼각함수 사용 없음!
 */
function buildSleeve(av: AvatarDimensions, cl: ClothingDimensions, cx: number, side: 1 | -1): SleeveResult {
  const c = calc(av, cl, cx);
  const { sy, shH, slLen, slTopW, slEndW } = c;

  const shoulderX = cx + side * shH;
  const shoulderY = sy;
  const botY = shoulderY + slLen;

  // 소매: 어깨점에서 **아래로** 뻗는 튜브 모양
  // 회전 전 = 팔이 완전히 아래로 내려간 상태
  // rotate(±15) 후 팔 각도를 따라감
  const halfW = slTopW * 0.5;
  const halfEndW = slEndW * 0.5;
  
  const d: string[] = [];

  // 외측 (side 방향)
  d.push(`M ${shoulderX + side * halfW} ${shoulderY}`);
  d.push(`C ${shoulderX + side * halfW} ${shoulderY + slLen * 0.4}, ${shoulderX + side * halfEndW} ${botY - slLen * 0.2}, ${shoulderX + side * halfEndW} ${botY}`);

  // 소매 끝단 (둥글게)
  d.push(`C ${shoulderX + side * halfEndW * 0.3} ${botY + 2}, ${shoulderX - side * halfEndW * 0.3} ${botY + 2}, ${shoulderX - side * halfEndW} ${botY}`);

  // 내측 (몸 방향)
  d.push(`C ${shoulderX - side * halfEndW} ${botY - slLen * 0.2}, ${shoulderX - side * halfW} ${shoulderY + slLen * 0.4}, ${shoulderX - side * halfW} ${shoulderY}`);


  d.push('Z');

  // 회전 방향: 오른쪽(side=1)은 시계방향(+)으로 벌어짐, 왼쪽(side=-1)은 반시계(-)
  const angle = side * SLEEVE_ANGLE;
  return {
    path: d.join(' '),
    transform: `rotate(${angle}, ${shoulderX}, ${shoulderY})`,
  };
}

/** 가슴/몸통 overlay (겨드랑이~밑단) */
function buildChestOverlay(av: AvatarDimensions, cl: ClothingDimensions, cx: number): string {
  const c = calc(av, cl, cx);
  const { armpitH, armpitY, hemH, hemY } = c;
  const w = Math.max(armpitH, hemH) + 5;
  return `M ${cx - w} ${armpitY} L ${cx + w} ${armpitY} L ${cx + w} ${hemY + 5} L ${cx - w} ${hemY + 5} Z`;
}

/** 소매 overlay — 직선 사각형, transform으로 회전됨 */
function buildSleeveOverlay(av: AvatarDimensions, cl: ClothingDimensions, cx: number, side: 1 | -1): string {
  const c = calc(av, cl, cx);
  const { sy, shH, slLen, slTopW, slEndW } = c;

  const shoulderX = cx + side * shH;
  const w = Math.max(slTopW, slEndW) * 0.7;
  return `M ${shoulderX - w} ${sy - 5} L ${shoulderX + w} ${sy - 5} L ${shoulderX + w} ${sy + slLen + 5} L ${shoulderX - w} ${sy + slLen + 5} Z`;
}

/** 어깨 봉제선 */
function buildSeams(av: AvatarDimensions, cl: ClothingDimensions, cx: number): string[] {
  const sy = av.shoulderY;
  const shH = Math.max(cl.shoulderWidth / 2, av.shoulderWidth / 2);
  const nkH = av.neckWidth / 2;

  return [1, -1].map(s =>
    `M ${cx + s * nkH} ${sy - 3} C ${cx + s * (nkH + (shH - nkH) * 0.4)} ${sy - 3}, ${cx + s * (shH - (shH - nkH) * 0.2)} ${sy - 1}, ${cx + s * shH} ${sy}`
  );
}

export const tshirtTemplate: ClothingTemplate = {
  category: 'tshirt',
  buildBody,
  buildSleeve: buildSleeve,
  overlays: [
    { id: 'chest', fitKey: 'chest', buildPath: buildChestOverlay },
    { id: 'sleeve_right', fitKey: 'sleeve', buildPath: (av, cl, cx) => buildSleeveOverlay(av, cl, cx, 1), sleeveSide: 1 },
    { id: 'sleeve_left', fitKey: 'sleeve', buildPath: (av, cl, cx) => buildSleeveOverlay(av, cl, cx, -1), sleeveSide: -1 },
  ],
  buildSeams,
};
