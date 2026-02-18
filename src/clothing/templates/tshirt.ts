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

/** Compute sleeve key points for a side (1=right, -1=left) */
function sp(c: ReturnType<typeof calc>, side: 1 | -1) {
  const { cx, sy, shH, slLen, slEndW, slMidW, slTopW } = c;
  const tipCX = cx + side * (shH + slLen * sinA);
  const tipCY = sy + slLen * cosA;
  const midCX = cx + side * (shH + slLen * sinA * 0.5);
  const midCY = sy + slLen * cosA * 0.5;
  const pX = side * perpX;
  const pY = side * perpY;
  // Outer edge points
  const outerMidX = midCX + pX * slMidW * 0.5;
  const outerMidY = midCY + pY * slMidW * 0.5;
  const outerTipX = tipCX + pX * slEndW * 0.5;
  const outerTipY = tipCY + pY * slEndW * 0.5;
  // Inner edge points
  const innerMidX = midCX - pX * slMidW * 0.5;
  const innerMidY = midCY - pY * slMidW * 0.5;
  const innerTipX = tipCX - pX * slEndW * 0.5;
  const innerTipY = tipCY - pY * slEndW * 0.5;
  return { tipCX, tipCY, midCX, midCY, pX, pY,
    outerMidX, outerMidY, outerTipX, outerTipY,
    innerMidX, innerMidY, innerTipX, innerTipY,
    slLen, slTopW, slEndW, slMidW };
}

/** Build the entire t-shirt as one continuous path (한붓그리기) */
function buildSilhouette(av: AvatarDimensions, cl: ClothingDimensions, cx: number): string {
  const c = calc(av, cl, cx);
  const { sy, shH, nkH, chH, hemH, hemY, armpitH, armpitY, ubH, waH, hiH, waistInRange, hipInRange, slLen } = c;
  const neckDepth = 8;
  const R = sp(c, 1);   // right sleeve
  const L = sp(c, -1);  // left sleeve

  const d: string[] = [];

  // === 1. Start at neckline left ===
  d.push(`M ${cx - nkH} ${sy - 3}`);

  // === 2. Neckline (left → right) ===
  d.push(`C ${cx - nkH * 0.6} ${sy + neckDepth * 0.3}, ${cx + nkH * 0.6} ${sy + neckDepth * 0.3}, ${cx + nkH} ${sy - 3}`);

  // === 3. Right shoulder (neck → shoulder) ===
  d.push(`C ${cx + nkH + (shH - nkH) * 0.3} ${sy - 4}, ${cx + shH - (shH - nkH) * 0.2} ${sy - 1}, ${cx + shH} ${sy}`);

  // === 4. Right sleeve outer: shoulder → mid → tip ===
  d.push(`C ${cx + shH + slLen * sinA * 0.15 + R.pX * R.slTopW * 0.1} ${sy + slLen * cosA * 0.15 + R.pY * R.slTopW * 0.1}, ${R.midCX + R.pX * R.slMidW * 0.52} ${R.midCY + R.pY * R.slMidW * 0.52}, ${R.outerMidX} ${R.outerMidY}`);
  d.push(`C ${R.midCX + R.pX * R.slMidW * 0.48 + slLen * sinA * 0.15} ${R.midCY + R.pY * R.slMidW * 0.48 + slLen * cosA * 0.15}, ${R.outerTipX - slLen * sinA * 0.08} ${R.outerTipY - slLen * cosA * 0.08}, ${R.outerTipX} ${R.outerTipY}`);

  // === 5. Right sleeve cap ===
  d.push(`C ${R.tipCX + R.pX * R.slEndW * 0.2} ${R.tipCY + R.pY * R.slEndW * 0.2 + 2}, ${R.tipCX - R.pX * R.slEndW * 0.2} ${R.tipCY - R.pY * R.slEndW * 0.2 + 2}, ${R.innerTipX} ${R.innerTipY}`);

  // === 6. Right sleeve inner: tip → mid → armpit ===
  d.push(`C ${R.innerTipX - slLen * sinA * 0.08} ${R.innerTipY - slLen * cosA * 0.08}, ${R.midCX - R.pX * R.slMidW * 0.48 + slLen * sinA * 0.15} ${R.midCY - R.pY * R.slMidW * 0.48 + slLen * cosA * 0.15}, ${R.innerMidX} ${R.innerMidY}`);
  d.push(`C ${R.midCX - R.pX * R.slMidW * 0.52 - slLen * sinA * 0.15} ${R.midCY - R.pY * R.slMidW * 0.52 - slLen * cosA * 0.15}, ${cx + armpitH + 3} ${armpitY - (armpitY - sy) * 0.2}, ${cx + armpitH} ${armpitY}`);

  // === 7. Right body: armpit → chest → underbust → ... → hem ===
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

  // === 8. Hem (right → left) ===
  d.push(`C ${cx + hemH * 0.6} ${hemY + 2}, ${cx - hemH * 0.6} ${hemY + 2}, ${cx - hemH} ${hemY}`);

  // === 9. Left body: hem → ... → armpit ===
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

  // === 10. Left sleeve inner: armpit → mid → tip ===
  // (Reverse of right inner: armpit outward to tip)
  d.push(`C ${cx - armpitH - 3} ${armpitY - (armpitY - sy) * 0.2}, ${L.midCX + L.pX * L.slMidW * 0.52 + slLen * sinA * 0.15} ${L.midCY + L.pY * L.slMidW * 0.52 - slLen * cosA * 0.15}, ${L.innerMidX} ${L.innerMidY}`);
  d.push(`C ${L.midCX + L.pX * L.slMidW * 0.48 - slLen * sinA * 0.15} ${L.midCY + L.pY * L.slMidW * 0.48 + slLen * cosA * 0.08}, ${L.innerTipX + slLen * sinA * 0.08} ${L.innerTipY - slLen * cosA * 0.08}, ${L.innerTipX} ${L.innerTipY}`);

  // === 11. Left sleeve cap (inner → outer) ===
  d.push(`C ${L.tipCX - L.pX * L.slEndW * 0.2} ${L.tipCY - L.pY * L.slEndW * 0.2 + 2}, ${L.tipCX + L.pX * L.slEndW * 0.2} ${L.tipCY + L.pY * L.slEndW * 0.2 + 2}, ${L.outerTipX} ${L.outerTipY}`);

  // === 12. Left sleeve outer: tip → mid → shoulder ===
  d.push(`C ${L.outerTipX + slLen * sinA * 0.08} ${L.outerTipY - slLen * cosA * 0.08}, ${L.midCX - L.pX * L.slMidW * 0.48 - slLen * sinA * 0.15} ${L.midCY - L.pY * L.slMidW * 0.48 + slLen * cosA * 0.15}, ${L.outerMidX} ${L.outerMidY}`);
  d.push(`C ${L.midCX - L.pX * L.slMidW * 0.52 + slLen * sinA * 0.15} ${L.midCY - L.pY * L.slMidW * 0.52 + slLen * cosA * 0.15}, ${cx - shH - slLen * sinA * 0.15 - L.pX * L.slTopW * 0.1} ${sy + slLen * cosA * 0.15 - L.pY * L.slTopW * 0.1}, ${cx - shH} ${sy}`);

  // === 13. Left shoulder → neckline close ===
  d.push(`C ${cx - shH + (shH - nkH) * 0.2} ${sy - 1}, ${cx - nkH - (shH - nkH) * 0.3} ${sy - 4}, ${cx - nkH} ${sy - 3}`);

  d.push('Z');
  return d.join(' ');
}

/** Chest/body overlay path — rectangular area covering the torso */
function buildChestOverlay(av: AvatarDimensions, cl: ClothingDimensions, cx: number): string {
  const c = calc(av, cl, cx);
  const { armpitH, armpitY, hemH, hemY } = c;
  // Simple rectangle-ish area from armpit level to hem, armpit width
  const topW = armpitH;
  const botW = hemH;
  return `M ${cx + topW} ${armpitY} L ${cx + botW} ${hemY} L ${cx - botW} ${hemY} L ${cx - topW} ${armpitY} Z`;
}

/** Sleeve overlay path for one side */
function buildSleeveOverlay(av: AvatarDimensions, cl: ClothingDimensions, cx: number, side: 'left' | 'right'): string {
  const s = side === 'right' ? 1 : -1;
  const c = calc(av, cl, cx);
  const { sy, shH, armpitH, armpitY } = c;
  const pts = sp(c, s as 1 | -1);

  // Quadrilateral: shoulder, outer tip, inner tip, armpit
  return [
    `M ${cx + s * shH} ${sy}`,
    `L ${pts.outerTipX} ${pts.outerTipY}`,
    `L ${pts.innerTipX} ${pts.innerTipY}`,
    `L ${cx + s * armpitH} ${armpitY}`,
    'Z',
  ].join(' ');
}

/** Shoulder seam lines */
function buildSeams(av: AvatarDimensions, cl: ClothingDimensions, cx: number): string[] {
  const sy = av.shoulderY;
  const shH = Math.max(cl.shoulderWidth / 2, av.shoulderWidth / 2);
  const nkH = av.neckWidth / 2;

  return [1, -1].map(s => {
    return `M ${cx + s * nkH} ${sy - 3} C ${cx + s * (nkH + (shH - nkH) * 0.4)} ${sy - 3}, ${cx + s * (shH - (shH - nkH) * 0.2)} ${sy - 1}, ${cx + s * shH} ${sy}`;
  });
}

export const tshirtTemplate: ClothingTemplate = {
  category: 'tshirt',
  buildSilhouette,
  overlays: [
    {
      id: 'chest',
      fitKey: 'chest',
      buildPath: buildChestOverlay,
    },
    {
      id: 'sleeve_right',
      fitKey: 'sleeve',
      buildPath: (av, cl, cx) => buildSleeveOverlay(av, cl, cx, 'right'),
    },
    {
      id: 'sleeve_left',
      fitKey: 'sleeve',
      buildPath: (av, cl, cx) => buildSleeveOverlay(av, cl, cx, 'left'),
    },
  ],
  buildSeams,
};
