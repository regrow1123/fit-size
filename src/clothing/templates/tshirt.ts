import type { AvatarDimensions, ClothingDimensions } from '../../types';
import type { ClothingTemplate } from '../types';

const ARM_ANGLE = 15 * Math.PI / 180;
const sinA = Math.sin(ARM_ANGLE);
const cosA = Math.cos(ARM_ANGLE);

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
  const minSlW = av.upperArmWidth / 2;
  const slTopW = Math.max(cl.sleeveWidth, minSlW);
  const slEndW = Math.max(slTopW * 0.88, minSlW * 0.85);
  const slMidW = Math.max(slTopW * 0.94, minSlW * 0.9);

  return {
    cx, sy, shH, chH, hemH, nkH, hemY,
    armpitH, armpitY, ubH, waH, hiH,
    waistInRange, hipInRange,
    slLen, slTopW, slEndW, slMidW,
  };
}

/**
 * 옷 전체를 한붓그리기 — 원래 Canvas drawTshirt 코드를 1:1 SVG 변환.
 * perpX/perpY는 side로 뒤집지 않고 원본 그대로 사용.
 */
function buildSilhouette(av: AvatarDimensions, cl: ClothingDimensions, cx: number): string {
  const c = calc(av, cl, cx);
  const { sy, shH, nkH, chH, hemH, hemY, armpitH, armpitY, ubH, waH, hiH, waistInRange, hipInRange, slLen, slTopW, slEndW, slMidW } = c;

  const perpX = cosA;
  const perpY = -sinA;
  const neckDepth = 8;

  // 오른쪽 소매 포인트
  const rTipCX = cx + shH + slLen * sinA;
  const rTipCY = sy + slLen * cosA;
  const rMidCX = cx + shH + slLen * sinA * 0.5;
  const rMidCY = sy + slLen * cosA * 0.5;

  // 왼쪽 소매 포인트
  const lTipCX = cx - shH - slLen * sinA;
  const lTipCY = sy + slLen * cosA;
  const lMidCX = cx - shH - slLen * sinA * 0.5;
  const lMidCY = sy + slLen * cosA * 0.5;

  const d: string[] = [];

  // ── 네크라인 ──
  d.push(`M ${cx - nkH} ${sy - 3}`);
  d.push(`C ${cx - nkH * 0.6} ${sy + neckDepth * 0.3}, ${cx + nkH * 0.6} ${sy + neckDepth * 0.3}, ${cx + nkH} ${sy - 3}`);

  // ── 오른쪽 어깨선 ──
  d.push(`C ${cx + nkH + (shH - nkH) * 0.3} ${sy - 4}, ${cx + shH - (shH - nkH) * 0.2} ${sy - 1}, ${cx + shH} ${sy}`);

  // ── 오른쪽 소매 외측: 어깨 → 중간 → 끝 ──
  d.push(`C ${cx + shH + slLen * sinA * 0.15 + perpX * slTopW * 0.1} ${sy + slLen * cosA * 0.15 + perpY * slTopW * 0.1}, ${rMidCX + perpX * slMidW * 0.52} ${rMidCY + perpY * slMidW * 0.52}, ${rMidCX + perpX * slMidW * 0.5} ${rMidCY + perpY * slMidW * 0.5}`);
  d.push(`C ${rMidCX + perpX * slMidW * 0.48 + slLen * sinA * 0.15} ${rMidCY + perpY * slMidW * 0.48 + slLen * cosA * 0.15}, ${rTipCX + perpX * slEndW * 0.5 - slLen * sinA * 0.08} ${rTipCY + perpY * slEndW * 0.5 - slLen * cosA * 0.08}, ${rTipCX + perpX * slEndW * 0.5} ${rTipCY + perpY * slEndW * 0.5}`);

  // ── 오른쪽 소매 끝단 ──
  d.push(`C ${rTipCX + perpX * slEndW * 0.2} ${rTipCY + perpY * slEndW * 0.2 + 2}, ${rTipCX - perpX * slEndW * 0.2} ${rTipCY - perpY * slEndW * 0.2 + 2}, ${rTipCX - perpX * slEndW * 0.5} ${rTipCY - perpY * slEndW * 0.5}`);

  // ── 오른쪽 소매 내측 → 겨드랑이 ──
  d.push(`C ${rTipCX - perpX * slEndW * 0.5 - slLen * sinA * 0.08} ${rTipCY - perpY * slEndW * 0.5 - slLen * cosA * 0.08}, ${rMidCX - perpX * slMidW * 0.48 + slLen * sinA * 0.15} ${rMidCY - perpY * slMidW * 0.48 + slLen * cosA * 0.15}, ${rMidCX - perpX * slMidW * 0.5} ${rMidCY - perpY * slMidW * 0.5}`);
  d.push(`C ${rMidCX - perpX * slMidW * 0.52 - slLen * sinA * 0.15} ${rMidCY - perpY * slMidW * 0.52 - slLen * cosA * 0.15}, ${cx + armpitH + 3} ${armpitY - (armpitY - sy) * 0.2}, ${cx + armpitH} ${armpitY}`);

  // ── 오른쪽 몸통 ──
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

  // ── 밑단 ──
  d.push(`C ${cx + hemH * 0.6} ${hemY + 2}, ${cx - hemH * 0.6} ${hemY + 2}, ${cx - hemH} ${hemY}`);

  // ── 왼쪽 몸통 ──
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

  // ── 왼쪽 소매 (perpX/perpY 뒤집지 않고 원본 그대로) ──
  // 겨드랑이 → 소매 내측 중간
  d.push(`C ${cx - armpitH - 3} ${armpitY - (armpitY - sy) * 0.2}, ${lMidCX + perpX * slMidW * 0.52 - slLen * sinA * 0.15} ${lMidCY + perpY * slMidW * 0.52 - slLen * cosA * 0.15}, ${lMidCX + perpX * slMidW * 0.5} ${lMidCY + perpY * slMidW * 0.5}`);
  // 중간 → 소매끝 내측
  d.push(`C ${lMidCX + perpX * slMidW * 0.48 + slLen * sinA * 0.15} ${lMidCY + perpY * slMidW * 0.48 + slLen * cosA * 0.15}, ${lTipCX + perpX * slEndW * 0.5 - slLen * sinA * 0.08} ${lTipCY + perpY * slEndW * 0.5 - slLen * cosA * 0.08}, ${lTipCX + perpX * slEndW * 0.5} ${lTipCY + perpY * slEndW * 0.5}`);

  // 왼쪽 소매 끝단
  d.push(`C ${lTipCX + perpX * slEndW * 0.2} ${lTipCY + perpY * slEndW * 0.2 + 2}, ${lTipCX - perpX * slEndW * 0.2} ${lTipCY - perpY * slEndW * 0.2 + 2}, ${lTipCX - perpX * slEndW * 0.5} ${lTipCY - perpY * slEndW * 0.5}`);

  // 왼쪽 소매 외측 → 어깨
  d.push(`C ${lTipCX - perpX * slEndW * 0.5 + slLen * sinA * 0.08} ${lTipCY - perpY * slEndW * 0.5 - slLen * cosA * 0.08}, ${lMidCX - perpX * slMidW * 0.48 - slLen * sinA * 0.15} ${lMidCY - perpY * slMidW * 0.48 - slLen * cosA * 0.15}, ${lMidCX - perpX * slMidW * 0.5} ${lMidCY - perpY * slMidW * 0.5}`);
  d.push(`C ${lMidCX - perpX * slMidW * 0.52 + slLen * sinA * 0.15} ${lMidCY - perpY * slMidW * 0.52 + slLen * cosA * 0.15}, ${cx - shH - slLen * sinA * 0.15 - perpX * slTopW * 0.1} ${sy + slLen * cosA * 0.15 - perpY * slTopW * 0.1}, ${cx - shH} ${sy}`);

  // ── 왼쪽 어깨선 → 네크라인 닫기 ──
  d.push(`C ${cx - shH + (shH - nkH) * 0.2} ${sy - 1}, ${cx - nkH - (shH - nkH) * 0.3} ${sy - 4}, ${cx - nkH} ${sy - 3}`);

  d.push('Z');
  return d.join(' ');
}

/** 가슴/몸통 overlay (겨드랑이~밑단) */
function buildChestOverlay(av: AvatarDimensions, cl: ClothingDimensions, cx: number): string {
  const c = calc(av, cl, cx);
  const { armpitH, armpitY, hemH, hemY } = c;
  // 넉넉한 사각형 — clipPath가 실루엣 밖을 잘라줌
  const w = Math.max(armpitH, hemH) + 5;
  return `M ${cx - w} ${armpitY} L ${cx + w} ${armpitY} L ${cx + w} ${hemY + 5} L ${cx - w} ${hemY + 5} Z`;
}

/** 소매 overlay */
function buildSleeveOverlay(av: AvatarDimensions, cl: ClothingDimensions, cx: number, side: 'left' | 'right'): string {
  const c = calc(av, cl, cx);
  const { sy, shH, armpitH, armpitY, slLen, slEndW } = c;
  const s = side === 'right' ? 1 : -1;

  const tipCX = cx + s * (shH + slLen * sinA);
  const tipCY = sy + slLen * cosA;
  // 넉넉한 사각형 — clipPath가 잘라줌
  const shoulderX = cx + s * shH;
  const armpitX = cx + s * armpitH;
  const outerTipX = tipCX + s * slEndW * 0.6;

  return [
    `M ${shoulderX} ${sy - 5}`,
    `L ${outerTipX} ${tipCY - 5}`,
    `L ${outerTipX} ${tipCY + 10}`,
    `L ${armpitX} ${armpitY + 5}`,
    'Z',
  ].join(' ');
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
  buildSilhouette,
  overlays: [
    { id: 'chest', fitKey: 'chest', buildPath: buildChestOverlay },
    { id: 'sleeve_right', fitKey: 'sleeve', buildPath: (av, cl, cx) => buildSleeveOverlay(av, cl, cx, 'right') },
    { id: 'sleeve_left', fitKey: 'sleeve', buildPath: (av, cl, cx) => buildSleeveOverlay(av, cl, cx, 'left') },
  ],
  buildSeams,
};
