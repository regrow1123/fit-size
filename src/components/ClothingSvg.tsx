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

  const seams = useMemo(
    () => template.buildSeams(avatarDims, clothingDims, cx),
    [avatarDims, clothingDims, cx],
  );

  return (
    <g>
      {/* 옷 path 자체를 마스크로 사용 — 흰색으로 아바타 가림 후 옷 색상 */}
      <path d={bodyPath} fill="white" stroke="none" />
      <path
        d={bodyPath}
        fill={SILHOUETTE_FILL}
        stroke={SILHOUETTE_STROKE}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* 봉제선 */}
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
