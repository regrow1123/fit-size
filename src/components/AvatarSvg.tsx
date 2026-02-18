import type { AvatarDimensions } from '../types';

interface Props {
  avatarDims: AvatarDimensions;
  canvasWidth: number;
  canvasHeight: number;
}

/**
 * 아바타 SVG — avatarRenderer.ts의 drawAvatar를 1:1 SVG 변환
 * <g> 래퍼로 부모 <svg> 안에 포함됨
 */
export default function AvatarSvg({ avatarDims: d, canvasWidth }: Props) {
  const cx = canvasWidth / 2;

  const fillColor = '#D4B896';
  const strokeColor = 'rgba(120, 90, 60, 0.45)';
  const sw = 0.8;
  const shadow = 'rgba(120, 90, 60, 0.08)';

  const shH = d.shoulderWidth / 2;
  const chH = d.chestWidth / 2;
  const ubH = d.underbustWidth / 2;
  const waH = d.waistWidth / 2;
  const hiH = d.hipWidth / 2;
  const nkH = d.neckWidth / 2;

  const ARM_ANGLE = 15 * Math.PI / 180;
  const sinA = Math.sin(ARM_ANGLE);
  const cosA = Math.cos(ARM_ANGLE);

  const commonStyle = {
    fill: fillColor,
    stroke: strokeColor,
    strokeWidth: sw,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
  };

  // ── ARM PATHS ──
  const armPaths: string[] = [];
  for (const s of [-1, 1]) {
    const sx = cx + s * shH;
    const axillaX = cx + s * chH;
    const axillaY = d.chestY;
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
    const midDist = elbowDist * 0.4;
    const midArmX = sx + s * midDist * sinA;
    const midArmY = d.shoulderY + midDist * cosA;
    const bicepBulge = upH * 1.2;
    const handW = wrH * 1.6;
    const handLen = d.upperArmWidth * 1.2;
    const handEndY = wrY + handLen;
    const palmEndY = wrY + handLen * 0.6;
    const fingerTipY = handEndY;
    const fingerW = handW * 0.85;
    const innerBicep = upH * 0.9;

    let p = '';
    // 외측
    p += `M ${sx + s * upH * 0.5} ${d.shoulderY - 2}`;
    p += ` C ${sx + s * (upH * 1.3)} ${d.shoulderY + 4}, ${sx + s * (upH * 1.35)} ${d.shoulderY + (midArmY - d.shoulderY) * 0.4}, ${midArmX + s * bicepBulge} ${midArmY}`;
    p += ` C ${midArmX + s * bicepBulge * 0.9} ${midArmY + (elY - midArmY) * 0.5}, ${elX + s * elH * 1.1} ${elY - (elY - midArmY) * 0.2}, ${elX + s * elH} ${elY}`;
    p += ` C ${elX + s * faH * 1.05} ${elY + (wrY - elY) * 0.2}, ${wrX + s * wrH * 1.15} ${wrY - (wrY - elY) * 0.2}, ${wrX + s * wrH} ${wrY}`;
    // 손
    p += ` C ${wrX + s * handW} ${wrY + 3}, ${wrX + s * handW * 1.05} ${palmEndY - 5}, ${wrX + s * handW * 0.95} ${palmEndY}`;
    for (let f = 0; f < 4; f++) {
      const t = f / 3;
      const fx = wrX + s * (fingerW * (1 - t * 0.6));
      const tipY = fingerTipY - f * 1.5;
      if (f === 0) {
        p += ` L ${fx} ${tipY}`;
      } else {
        const prevFx = wrX + s * (fingerW * (1 - (f - 1) / 3 * 0.6));
        p += ` Q ${(fx + prevFx) / 2} ${palmEndY + 2}, ${fx} ${tipY}`;
      }
      p += ` Q ${fx - s * handW * 0.06} ${tipY + 2}, ${fx - s * handW * 0.12} ${tipY - 1}`;
    }
    p += ` Q ${wrX - s * handW * 0.15} ${palmEndY + 3}, ${wrX - s * handW * 0.2} ${palmEndY - 2}`;
    // 엄지
    const thumbY = wrY + handLen * 0.2;
    p += ` Q ${wrX - s * handW * 0.4} ${thumbY + 8}, ${wrX - s * handW * 0.5} ${thumbY + 3}`;
    p += ` Q ${wrX - s * handW * 0.45} ${thumbY - 3}, ${wrX - s * wrH * 0.8} ${wrY + 2}`;
    // 내측
    p += ` L ${wrX - s * wrH} ${wrY}`;
    p += ` C ${wrX - s * wrH * 1.1} ${wrY - (wrY - elY) * 0.2}, ${elX - s * faH * 0.85} ${elY + (wrY - elY) * 0.2}, ${elX - s * elH * 0.6} ${elY}`;
    p += ` C ${elX - s * elH * 0.55} ${elY - (elY - midArmY) * 0.2}, ${midArmX - s * innerBicep * 0.85} ${midArmY + (elY - midArmY) * 0.3}, ${midArmX - s * innerBicep} ${midArmY}`;
    p += ` C ${midArmX - s * innerBicep * 0.9} ${midArmY - (midArmY - d.shoulderY) * 0.4}, ${axillaX + s * 2} ${axillaY + 5}, ${axillaX} ${axillaY}`;
    p += ` C ${axillaX + s * 1} ${axillaY - (axillaY - d.shoulderY) * 0.3}, ${cx + s * (shH - 3)} ${d.shoulderY + (axillaY - d.shoulderY) * 0.2}, ${sx + s * upH * 0.5} ${d.shoulderY - 2}`;
    p += ' Z';
    armPaths.push(p);
  }

  // ── AXILLA GAP FILL ──
  const axillaPaths: string[] = [];
  for (const s of [-1, 1]) {
    const sx = cx + s * shH;
    const axX = cx + s * chH;
    const midDist = (d.elbowY - d.shoulderY) * 0.4;
    const midArmX = sx + s * midDist * sinA;
    const midArmY = d.shoulderY + midDist * cosA;
    const innerBicep = d.upperArmWidth / 2 * 0.9;

    let p = `M ${sx} ${d.shoulderY}`;
    p += ` C ${sx - s * 1} ${d.shoulderY + (d.chestY - d.shoulderY) * 0.3}, ${axX + s * 4} ${d.chestY - (d.chestY - d.shoulderY) * 0.15}, ${axX} ${d.chestY}`;
    p += ` C ${axX + s * 2} ${d.chestY - 5}, ${midArmX - s * innerBicep * 0.9} ${midArmY + 10}, ${midArmX - s * innerBicep} ${midArmY}`;
    p += ` C ${midArmX - s * innerBicep * 0.85} ${midArmY - (midArmY - d.shoulderY) * 0.5}, ${sx + s * d.upperArmWidth / 2 * 0.3} ${d.shoulderY + 5}, ${sx} ${d.shoulderY}`;
    p += ' Z';
    axillaPaths.push(p);
  }

  // ── TORSO ──
  const innerThighH = d.thighWidth / 2;
  let torso = `M ${cx - shH} ${d.shoulderY}`;
  torso += ` C ${cx - shH - 1} ${d.shoulderY + (d.chestY - d.shoulderY) * 0.3}, ${cx - chH - 6} ${d.chestY - (d.chestY - d.shoulderY) * 0.2}, ${cx - chH} ${d.chestY}`;
  torso += ` C ${cx - chH + 1} ${d.chestY + (d.underbustY - d.chestY) * 0.5}, ${cx - ubH - 2} ${d.underbustY - (d.underbustY - d.chestY) * 0.2}, ${cx - ubH} ${d.underbustY}`;
  torso += ` C ${cx - ubH + 1} ${d.underbustY + (d.waistY - d.underbustY) * 0.4}, ${cx - waH - 2} ${d.waistY - (d.waistY - d.underbustY) * 0.3}, ${cx - waH} ${d.waistY}`;
  torso += ` C ${cx - waH - 1} ${d.waistY + (d.hipY - d.waistY) * 0.3}, ${cx - hiH - 3} ${d.hipY - (d.hipY - d.waistY) * 0.3}, ${cx - hiH} ${d.hipY}`;
  torso += ` C ${cx - hiH + 1} ${d.hipY + (d.crotchY - d.hipY) * 0.5}, ${cx - innerThighH * 1.8} ${d.crotchY - (d.crotchY - d.hipY) * 0.2}, ${cx - innerThighH * 1.2} ${d.crotchY}`;
  torso += ` Q ${cx} ${d.crotchY + 8}, ${cx + innerThighH * 1.2} ${d.crotchY}`;
  torso += ` C ${cx + innerThighH * 1.8} ${d.crotchY - (d.crotchY - d.hipY) * 0.2}, ${cx + hiH - 1} ${d.hipY + (d.crotchY - d.hipY) * 0.5}, ${cx + hiH} ${d.hipY}`;
  torso += ` C ${cx + hiH + 3} ${d.hipY - (d.hipY - d.waistY) * 0.3}, ${cx + waH + 1} ${d.waistY + (d.hipY - d.waistY) * 0.3}, ${cx + waH} ${d.waistY}`;
  torso += ` C ${cx + waH + 2} ${d.waistY - (d.waistY - d.underbustY) * 0.3}, ${cx + ubH - 1} ${d.underbustY + (d.waistY - d.underbustY) * 0.4}, ${cx + ubH} ${d.underbustY}`;
  torso += ` C ${cx + ubH + 2} ${d.underbustY - (d.underbustY - d.chestY) * 0.2}, ${cx + chH - 1} ${d.chestY + (d.underbustY - d.chestY) * 0.5}, ${cx + chH} ${d.chestY}`;
  torso += ` C ${cx + chH + 6} ${d.chestY - (d.chestY - d.shoulderY) * 0.2}, ${cx + shH + 1} ${d.shoulderY + (d.chestY - d.shoulderY) * 0.3}, ${cx + shH} ${d.shoulderY}`;
  torso += ` Q ${cx + nkH * 1.4} ${d.shoulderY - 3}, ${cx + nkH} ${d.neckBottomY}`;
  torso += ` L ${cx - nkH} ${d.neckBottomY}`;
  torso += ` Q ${cx - nkH * 1.4} ${d.shoulderY - 3}, ${cx - shH} ${d.shoulderY}`;
  torso += ' Z';

  // ── WAIST SHADOW (half ellipse, 0 to π) ──
  const waistShadowRx = waH * 0.9;
  const waistShadow = `M ${cx + waistShadowRx} ${d.waistY} A ${waistShadowRx} 3 0 0 1 ${cx - waistShadowRx} ${d.waistY} Z`;

  // ── LEG PATHS ──
  const legPaths: string[] = [];
  const kneeCenters: { cx: number; cy: number; rx: number; ry: number; s: number }[] = [];
  for (const s of [-1, 1]) {
    const legCX = cx + s * hiH * 0.42;
    const thH = d.thighWidth / 2;
    const knH = d.kneeWidth / 2;
    const caH = d.calfWidth / 2;
    const anH = d.ankleWidth / 2;
    const footEnd = d.ankleY + 14;

    // 정면 다리: 바깥쪽(+s)은 완만, 안쪽(-s)은 종아리 볼록
    let p = `M ${legCX + s * thH} ${d.crotchY}`;
    // 바깥쪽: 허벅지→무릎 (약간 볼록)
    p += ` C ${legCX + s * thH * 0.98} ${d.crotchY + (d.kneeY - d.crotchY) * 0.35}, ${legCX + s * knH * 1.05} ${d.kneeY - (d.kneeY - d.crotchY) * 0.15}, ${legCX + s * knH} ${d.kneeY}`;
    // 바깥쪽: 무릎→종아리 (완만한 볼록)
    p += ` C ${legCX + s * caH * 1.05} ${d.kneeY + (d.calfY - d.kneeY) * 0.4}, ${legCX + s * caH * 1.0} ${d.calfY - (d.calfY - d.kneeY) * 0.1}, ${legCX + s * caH * 0.85} ${d.calfY}`;
    // 바깥쪽: 종아리→발목
    p += ` C ${legCX + s * caH * 0.6} ${d.calfY + (d.ankleY - d.calfY) * 0.4}, ${legCX + s * anH * 1.1} ${d.ankleY - (d.ankleY - d.calfY) * 0.2}, ${legCX + s * anH} ${d.ankleY}`;
    // 발 (바깥쪽으로)
    p += ` Q ${legCX + s * anH * 0.8} ${d.ankleY + 6}, ${legCX + s * d.footLength} ${footEnd}`;
    p += ` Q ${legCX + s * d.footLength * 0.3} ${footEnd + 3}, ${legCX - s * anH * 0.2} ${footEnd - 2}`;
    p += ` Q ${legCX - s * anH * 0.6} ${d.ankleY + 4}, ${legCX - s * anH} ${d.ankleY}`;
    // 안쪽: 발목→종아리 (종아리 내측 볼록 — 정면 특징)
    p += ` C ${legCX - s * anH * 1.0} ${d.ankleY - (d.ankleY - d.calfY) * 0.2}, ${legCX - s * caH * 0.85} ${d.calfY + (d.ankleY - d.calfY) * 0.3}, ${legCX - s * caH * 0.75} ${d.calfY}`;
    // 안쪽: 종아리→무릎 (내측 볼록)
    p += ` C ${legCX - s * caH * 0.95} ${d.calfY - (d.calfY - d.kneeY) * 0.15}, ${legCX - s * knH * 0.85} ${d.kneeY + (d.calfY - d.kneeY) * 0.35}, ${legCX - s * knH * 0.6} ${d.kneeY}`;
    // 안쪽: 무릎→허벅지
    p += ` C ${legCX - s * knH * 0.7} ${d.kneeY - (d.kneeY - d.crotchY) * 0.15}, ${legCX - s * thH * 0.65} ${d.crotchY + (d.kneeY - d.crotchY) * 0.2}, ${legCX - s * thH * 0.55} ${d.crotchY}`;
    p += ' Z';
    legPaths.push(p);
    kneeCenters.push({ cx: legCX + s * 1, cy: d.kneeY, rx: knH * 0.35, ry: d.legLength * 0.015, s });
  }

  // ── NECK ──
  let neck = `M ${cx - nkH} ${d.neckTopY}`;
  neck += ` C ${cx - nkH * 1.05} ${(d.neckTopY + d.neckBottomY) / 2}, ${cx - nkH * 1.15} ${d.neckBottomY}, ${cx - nkH * 1.25} ${d.neckBottomY + 2}`;
  neck += ` L ${cx + nkH * 1.25} ${d.neckBottomY + 2}`;
  neck += ` C ${cx + nkH * 1.15} ${d.neckBottomY}, ${cx + nkH * 1.05} ${(d.neckTopY + d.neckBottomY) / 2}, ${cx + nkH} ${d.neckTopY}`;
  neck += ' Z';

  // ── HEAD ──
  const hr = d.headRadius;
  const headCY = d.headCY - hr * 0.08;
  const headRx = hr * 0.88;
  const headRy = hr * 0.9;
  // Partial ellipse arc: startAngle = π+0.25, endAngle = -0.25, clockwise
  const sa = Math.PI + 0.25;
  const ea = -0.25;
  const startX = cx + headRx * Math.cos(sa);
  const startY = headCY + headRy * Math.sin(sa);
  const endX = cx + headRx * Math.cos(ea);
  const endY = headCY + headRy * Math.sin(ea);
  // Arc span = (ea - sa + 2π) = π - 0.5 ≈ 2.64, < π → large-arc=0, sweep=1
  let head = `M ${startX} ${startY}`;
  head += ` A ${headRx} ${headRy} 0 0 1 ${endX} ${endY}`;
  // Right jawline
  head += ` Q ${cx + hr * 0.82} ${d.headCY + hr * 0.45}, ${cx + hr * 0.4} ${d.headCY + hr * 0.9}`;
  // Chin
  head += ` Q ${cx} ${d.headCY + hr * 0.98}, ${cx - hr * 0.4} ${d.headCY + hr * 0.9}`;
  // Left jawline
  head += ` Q ${cx - hr * 0.82} ${d.headCY + hr * 0.45}, ${cx - hr * 0.88} ${d.headCY - hr * 0.08}`;
  head += ' Z';

  return (
    <g>
      {/* 1. Arms */}
      {armPaths.map((p, i) => (
        <path key={`arm-${i}`} d={p} {...commonStyle} />
      ))}

      {/* 2. Axilla gap fill */}
      {axillaPaths.map((p, i) => (
        <path key={`axilla-${i}`} d={p} fill={fillColor} stroke="none" />
      ))}

      {/* 3. Torso */}
      <path d={torso} {...commonStyle} />

      {/* 4. Waist shadow */}
      <path d={waistShadow} fill={shadow} stroke="none" />

      {/* 5. Navel */}
      <ellipse cx={cx} cy={d.waistY - 8} rx={1.5} ry={2.5} fill={shadow} stroke="none" />

      {/* 6. Legs + knee hints */}
      {legPaths.map((p, i) => (
        <path key={`leg-${i}`} d={p} {...commonStyle} />
      ))}
      {kneeCenters.map((k, i) => (
        <ellipse key={`knee-${i}`} cx={k.cx} cy={k.cy} rx={k.rx} ry={k.ry} fill={shadow} stroke="none" />
      ))}

      {/* 7. Neck */}
      <path d={neck} fill={fillColor} stroke="none" />

      {/* 8. Head */}
      <path d={head} {...commonStyle} />

      {/* Ears */}
      {[-1, 1].map(s => (
        <ellipse
          key={`ear-${s}`}
          cx={cx + s * hr * 0.85}
          cy={d.headCY + hr * 0.05}
          rx={hr * 0.07}
          ry={hr * 0.15}
          transform={`rotate(${s * 0.15 * 180 / Math.PI} ${cx + s * hr * 0.85} ${d.headCY + hr * 0.05})`}
          {...commonStyle}
        />
      ))}
    </g>
  );
}
