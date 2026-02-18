import type { AvatarDimensions, ClothingDimensions } from '../../types';
import type { ClothingTemplate } from '../types';

const ARM_ANGLE = 15 * Math.PI / 180;
const sinA = Math.sin(ARM_ANGLE);
const cosA = Math.cos(ARM_ANGLE);
const perpX = cosA;
const perpY = -sinA;

/** Shared intermediate values computed from avatar + clothing dims */
function calc(av: AvatarDimensions, cl: ClothingDimensions, cx: number) {
  const sy = av.shoulderY;
  const avShH = av.shoulderWidth / 2;
  const avChH = av.chestWidth / 2;
  const avUbH = av.underbustWidth / 2;
  const avWaH = av.waistWidth / 2;
  const avHiH = av.hipWidth / 2;

  // 옷 폭은 최소한 몸 폭 이상 — 몸이 옷 밖으로 튀어나오지 않도록
  const shH = Math.max(cl.shoulderWidth / 2, avShH);
  const chH = Math.max(cl.chestWidth / 2, avChH);
  const hemH = Math.max(cl.hemWidth / 2, avWaH); // 밑단도 최소 허리 이상
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
  const minSleeveW = av.upperArmWidth / 2;
  const slTopW = Math.max(cl.sleeveWidth, minSleeveW);
  const slEndW = Math.max(slTopW * 0.88, minSleeveW * 0.85);
  const slMidW = Math.max(slTopW * 0.94, minSleeveW * 0.9);

  return {
    cx, sy, shH, chH, hemH, nkH, hemY,
    armpitH, armpitY, ubH, waH, hiH,
    waistInRange, hipInRange,
    slLen, slTopW, slEndW, slMidW,
  };
}

function buildBodyPath(av: AvatarDimensions, cl: ClothingDimensions, cx: number): string {
  const c = calc(av, cl, cx);
  const { shH, chH, hemH, hemY, armpitH, armpitY, ubH, waH, hiH, waistInRange, hipInRange } = c;
  const sy = c.sy;

  const p: string[] = [];

  // Start at right shoulder (어깨부터 시작해서 소매와 겹침 보장)
  p.push(`M ${cx + shH} ${sy}`);

  // shoulder → armpit (몸통 옆선)
  p.push(`C ${cx + shH + 1} ${sy + (armpitY - sy) * 0.4}, ${cx + armpitH + 2} ${armpitY - (armpitY - sy) * 0.2}, ${cx + armpitH} ${armpitY}`);

  // armpit → chest
  p.push(`C ${cx + armpitH - 1} ${armpitY + (av.chestY - armpitY) * 0.5}, ${cx + chH + 2} ${av.chestY - (av.chestY - armpitY) * 0.15}, ${cx + chH} ${av.chestY}`);

  // chest → underbust
  p.push(`C ${cx + chH - 0.5} ${av.chestY + (av.underbustY - av.chestY) * 0.5}, ${cx + ubH + 1} ${av.underbustY - (av.underbustY - av.chestY) * 0.15}, ${cx + ubH} ${av.underbustY}`);

  if (waistInRange) {
    p.push(`C ${cx + ubH - 0.5} ${av.underbustY + (av.waistY - av.underbustY) * 0.4}, ${cx + waH + 1.5} ${av.waistY - (av.waistY - av.underbustY) * 0.2}, ${cx + waH} ${av.waistY}`);
    if (hipInRange) {
      p.push(`C ${cx + waH + 1} ${av.waistY + (av.hipY - av.waistY) * 0.35}, ${cx + hiH + 2} ${av.hipY - (av.hipY - av.waistY) * 0.25}, ${cx + hiH} ${av.hipY}`);
      p.push(`C ${cx + hiH - 1} ${av.hipY + (hemY - av.hipY) * 0.4}, ${cx + hemH + 1} ${hemY - (hemY - av.hipY) * 0.15}, ${cx + hemH} ${hemY}`);
    } else {
      p.push(`C ${cx + waH + 1} ${av.waistY + (hemY - av.waistY) * 0.4}, ${cx + hemH + 1} ${hemY - (hemY - av.waistY) * 0.15}, ${cx + hemH} ${hemY}`);
    }
  } else {
    p.push(`C ${cx + ubH - 0.5} ${av.underbustY + (hemY - av.underbustY) * 0.4}, ${cx + hemH + 1} ${hemY - (hemY - av.underbustY) * 0.15}, ${cx + hemH} ${hemY}`);
  }

  // Hem
  p.push(`C ${cx + hemH * 0.6} ${hemY + 2}, ${cx - hemH * 0.6} ${hemY + 2}, ${cx - hemH} ${hemY}`);

  // Left side (mirror)
  if (waistInRange) {
    if (hipInRange) {
      p.push(`C ${cx - hemH - 1} ${hemY - (hemY - av.hipY) * 0.15}, ${cx - hiH + 1} ${av.hipY + (hemY - av.hipY) * 0.4}, ${cx - hiH} ${av.hipY}`);
      p.push(`C ${cx - hiH - 2} ${av.hipY - (av.hipY - av.waistY) * 0.25}, ${cx - waH - 1} ${av.waistY + (av.hipY - av.waistY) * 0.35}, ${cx - waH} ${av.waistY}`);
    } else {
      p.push(`C ${cx - hemH - 1} ${hemY - (hemY - av.waistY) * 0.15}, ${cx - waH - 1} ${av.waistY + (hemY - av.waistY) * 0.4}, ${cx - waH} ${av.waistY}`);
    }
    p.push(`C ${cx - waH - 1.5} ${av.waistY - (av.waistY - av.underbustY) * 0.2}, ${cx - ubH + 0.5} ${av.underbustY + (av.waistY - av.underbustY) * 0.4}, ${cx - ubH} ${av.underbustY}`);
  } else {
    p.push(`C ${cx - hemH - 1} ${hemY - (hemY - av.underbustY) * 0.15}, ${cx - ubH + 0.5} ${av.underbustY + (hemY - av.underbustY) * 0.4}, ${cx - ubH} ${av.underbustY}`);
  }

  // underbust → chest
  p.push(`C ${cx - ubH - 1} ${av.underbustY - (av.underbustY - av.chestY) * 0.15}, ${cx - chH + 0.5} ${av.chestY + (av.underbustY - av.chestY) * 0.5}, ${cx - chH} ${av.chestY}`);

  // chest → armpit
  p.push(`C ${cx - chH - 2} ${av.chestY - (av.chestY - armpitY) * 0.15}, ${cx - armpitH + 1} ${armpitY + (av.chestY - armpitY) * 0.5}, ${cx - armpitH} ${armpitY}`);

  // armpit → left shoulder
  p.push(`C ${cx - armpitH - 2} ${armpitY - (armpitY - sy) * 0.2}, ${cx - shH - 1} ${sy + (armpitY - sy) * 0.4}, ${cx - shH} ${sy}`);

  // shoulder line (top, connects back to right shoulder via neckline area)
  p.push(`L ${cx + shH} ${sy}`);

  p.push('Z');
  return p.join(' ');
}

function buildSleevePath(av: AvatarDimensions, cl: ClothingDimensions, cx: number, side: 1 | -1): string {
  const c = calc(av, cl, cx);
  const { sy, shH, armpitH, armpitY, slLen, slTopW, slEndW, slMidW } = c;

  const tipCX = cx + side * (shH + slLen * sinA);
  const tipCY = sy + slLen * cosA;
  const midCX = cx + side * (shH + slLen * sinA * 0.5);
  const midCY = sy + slLen * cosA * 0.5;

  // For left sleeve, perpendicular flips
  const pX = side * perpX;
  const pY = side * perpY;

  const p: string[] = [];

  // Start at shoulder
  p.push(`M ${cx + side * shH} ${sy}`);

  // Outer: shoulder → mid → tip
  p.push(`C ${cx + side * shH + side * slLen * sinA * 0.15 + pX * slTopW * 0.1} ${sy + slLen * cosA * 0.15 + pY * slTopW * 0.1}, ${midCX + pX * slMidW * 0.52} ${midCY + pY * slMidW * 0.52}, ${midCX + pX * slMidW * 0.5} ${midCY + pY * slMidW * 0.5}`);
  p.push(`C ${midCX + pX * slMidW * 0.48 + side * slLen * sinA * 0.15} ${midCY + pY * slMidW * 0.48 + slLen * cosA * 0.15}, ${tipCX + pX * slEndW * 0.5 - side * slLen * sinA * 0.08} ${tipCY + pY * slEndW * 0.5 - slLen * cosA * 0.08}, ${tipCX + pX * slEndW * 0.5} ${tipCY + pY * slEndW * 0.5}`);

  // Sleeve end cap
  p.push(`C ${tipCX + pX * slEndW * 0.2} ${tipCY + pY * slEndW * 0.2 + 2}, ${tipCX - pX * slEndW * 0.2} ${tipCY - pY * slEndW * 0.2 + 2}, ${tipCX - pX * slEndW * 0.5} ${tipCY - pY * slEndW * 0.5}`);

  // Inner: tip → mid → armpit
  p.push(`C ${tipCX - pX * slEndW * 0.5 - side * slLen * sinA * 0.08} ${tipCY - pY * slEndW * 0.5 - slLen * cosA * 0.08}, ${midCX - pX * slMidW * 0.48 + side * slLen * sinA * 0.15} ${midCY - pY * slMidW * 0.48 + slLen * cosA * 0.15}, ${midCX - pX * slMidW * 0.5} ${midCY - pY * slMidW * 0.5}`);
  p.push(`C ${midCX - pX * slMidW * 0.52 - side * slLen * sinA * 0.15} ${midCY - pY * slMidW * 0.52 - slLen * cosA * 0.15}, ${cx + side * armpitH + side * 3} ${armpitY - (armpitY - sy) * 0.2}, ${cx + side * armpitH} ${armpitY}`);

  p.push('Z');
  return p.join(' ');
}

function buildCollarPath(av: AvatarDimensions, cl: ClothingDimensions, cx: number): string {
  const c = calc(av, cl, cx);
  const { sy, shH, nkH } = c;
  const neckDepth = 8;

  const p: string[] = [];

  // Neckline
  p.push(`M ${cx - nkH} ${sy - 3}`);
  p.push(`C ${cx - nkH * 0.6} ${sy + neckDepth * 0.3}, ${cx + nkH * 0.6} ${sy + neckDepth * 0.3}, ${cx + nkH} ${sy - 3}`);

  // Right shoulder
  p.push(`C ${cx + nkH + (shH - nkH) * 0.3} ${sy - 4}, ${cx + shH - (shH - nkH) * 0.2} ${sy - 1}, ${cx + shH} ${sy}`);

  // Outer shoulder line (thin strip back to left)
  p.push(`L ${cx + shH} ${sy - 2}`);
  p.push(`C ${cx + shH - (shH - nkH) * 0.2} ${sy - 3}, ${cx + nkH + (shH - nkH) * 0.3} ${sy - 6}, ${cx + nkH} ${sy - 5}`);

  // Upper neckline
  p.push(`C ${cx + nkH * 0.6} ${sy + neckDepth * 0.1}, ${cx - nkH * 0.6} ${sy + neckDepth * 0.1}, ${cx - nkH} ${sy - 5}`);

  // Left shoulder back
  p.push(`C ${cx - nkH - (shH - nkH) * 0.3} ${sy - 6}, ${cx - shH + (shH - nkH) * 0.2} ${sy - 3}, ${cx - shH} ${sy - 2}`);
  p.push(`L ${cx - shH} ${sy}`);

  // Left shoulder
  p.push(`C ${cx - shH + (shH - nkH) * 0.2} ${sy - 1}, ${cx - nkH - (shH - nkH) * 0.3} ${sy - 4}, ${cx - nkH} ${sy - 3}`);

  p.push('Z');
  return p.join(' ');
}

/** Shoulder seam lines for stitch detail */
export function buildSeamPaths(av: AvatarDimensions, cl: ClothingDimensions, cx: number): string[] {
  const sy = av.shoulderY;
  const shH = cl.shoulderWidth / 2;
  const nkH = av.neckWidth / 2;

  return [1, -1].map(s => {
    return `M ${cx + s * nkH} ${sy - 3} C ${cx + s * (nkH + (shH - nkH) * 0.4)} ${sy - 3}, ${cx + s * (shH - (shH - nkH) * 0.2)} ${sy - 1}, ${cx + s * shH} ${sy}`;
  });
}

export const tshirtTemplate: ClothingTemplate = {
  category: 'tshirt',
  regions: [
    {
      id: 'body',
      buildPath: buildBodyPath,
      fitKey: 'chest',
    },
    {
      id: 'sleeve_right',
      buildPath: (av, cl, cx) => buildSleevePath(av, cl, cx, 1),
      fitKey: 'sleeve',
    },
    {
      id: 'sleeve_left',
      buildPath: (av, cl, cx) => buildSleevePath(av, cl, cx, -1),
      fitKey: 'sleeve',
    },
    {
      id: 'collar',
      buildPath: buildCollarPath,
      fitKey: 'shoulder',
    },
  ],
};
