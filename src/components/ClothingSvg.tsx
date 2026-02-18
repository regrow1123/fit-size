import { useMemo } from 'react';
import type { AvatarDimensions, ClothingDimensions } from '../types';
import { tshirtTemplate } from '../clothing/templates/tshirt';
import { SILHOUETTE_FILL, SILHOUETTE_STROKE } from '../clothing/fitAnalysis';

interface Props {
  avatarDims: AvatarDimensions;
  clothingDims: ClothingDimensions;
  clothingCm: Map<string, number>;
  body: import('../types').BodyMeasurements;
  canvasWidth: number;
  canvasHeight?: number;
}

/**
 * 아바타 상체(목~팔~밑단)를 완전히 덮는 마스크 path 생성.
 * 옷보다 넓게 — 아바타 팔/어깨/몸통이 절대 비치지 않도록.
 */
function buildBodyMask(av: AvatarDimensions, hemY: number, cx: number): string {
  const ARM_ANGLE = 15 * Math.PI / 180;
  const sinA = Math.sin(ARM_ANGLE);
  const cosA = Math.cos(ARM_ANGLE);

  const shH = av.shoulderWidth / 2 + 8; // 어깨보다 8px 여유
  const sy = av.shoulderY;

  // 팔 끝까지 (wristY 또는 hemY 중 짧은 곳 + 여유)
  const armLen = Math.min(av.wristY - sy, hemY - sy + 20);
  const armW = av.upperArmWidth * 0.8; // 팔 폭 + 여유

  // 오른쪽 팔 끝
  const rArmEndX = cx + shH + sinA * armLen;
  const rArmEndY = sy + cosA * armLen;
  // 왼쪽 팔 끝
  const lArmEndX = cx - shH - sinA * armLen;
  const lArmEndY = rArmEndY;

  const bodyW = Math.max(av.chestWidth, av.hipWidth, av.waistWidth) / 2 + 10;

  // 단순한 다각형: 목 → 오른쪽 어깨 → 오른쪽 팔끝 → 오른쪽 몸통 밑단 → 왼쪽 몸통 밑단 → 왼쪽 팔끝 → 왼쪽 어깨 → 목
  return [
    `M ${cx} ${sy - 5}`,
    // 오른쪽
    `L ${cx + shH} ${sy - 3}`,
    `L ${rArmEndX + cosA * armW} ${rArmEndY - sinA * armW}`,
    `L ${rArmEndX - cosA * armW} ${rArmEndY + sinA * armW}`,
    `L ${cx + bodyW} ${hemY + 10}`,
    // 밑단
    `L ${cx - bodyW} ${hemY + 10}`,
    // 왼쪽
    `L ${lArmEndX + cosA * armW} ${lArmEndY + sinA * armW}`,
    `L ${lArmEndX - cosA * armW} ${lArmEndY - sinA * armW}`,
    `L ${cx - shH} ${sy - 3}`,
    'Z',
  ].join(' ');
}

export default function ClothingSvg({
  avatarDims,
  clothingDims,
  clothingCm: _clothingCm,
  body: _body,
  canvasWidth,
}: Props) {
  const cx = canvasWidth / 2;
  const template = tshirtTemplate;

  const bodyPath = useMemo(
    () => template.buildBody(avatarDims, clothingDims, cx),
    [avatarDims, clothingDims, cx],
  );

  const hemY = avatarDims.shoulderY + clothingDims.totalLength;

  const maskPath = useMemo(
    () => buildBodyMask(avatarDims, hemY, cx),
    [avatarDims, hemY, cx],
  );

  const seams = useMemo(
    () => template.buildSeams(avatarDims, clothingDims, cx),
    [avatarDims, clothingDims, cx],
  );

  return (
    <g>
      {/* Layer 0: 아바타 상체를 완전히 가리는 흰색 마스크 */}
      <path d={maskPath} fill="white" stroke="none" />

      {/* Layer 1: 옷 — 단색 실루엣 */}
      <path
        d={bodyPath}
        fill={SILHOUETTE_FILL}
        stroke={SILHOUETTE_STROKE}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Layer 2: 봉제선 */}
      {seams.map((d, i) => (
        <path
          key={`seam-${i}`}
          d={d}
          fill="none"
          stroke="rgba(80, 100, 120, 0.25)"
          strokeWidth={0.5}
          strokeDasharray="3 4"
        />
      ))}
    </g>
  );
}
