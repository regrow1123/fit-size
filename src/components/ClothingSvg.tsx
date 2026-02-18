import { useMemo } from 'react';
import type { AvatarDimensions, BodyMeasurements, ClothingDimensions } from '../types';
import { tshirtTemplate } from '../clothing/templates/tshirt';
import { analyzeFit, getFitColor, SILHOUETTE_FILL, SILHOUETTE_STROKE } from '../clothing/fitAnalysis';
import type { FitResult } from '../clothing/types';

interface Props {
  avatarDims: AvatarDimensions;
  clothingDims: ClothingDimensions;
  clothingCm: Map<string, number>;
  body: BodyMeasurements;
  canvasWidth: number;
  canvasHeight?: number;
}

export default function ClothingSvg({
  avatarDims,
  clothingDims,
  clothingCm,
  body,
  canvasWidth,
}: Props) {
  const fitResult: FitResult = useMemo(
    () => analyzeFit(clothingCm, body),
    [clothingCm, body],
  );

  const cx = canvasWidth / 2;
  const template = tshirtTemplate;

  const silhouettePath = useMemo(
    () => template.buildSilhouette(avatarDims, clothingDims, cx),
    [avatarDims, clothingDims, cx],
  );

  const overlayPaths = useMemo(
    () => template.overlays.map(ov => ({
      id: ov.id,
      fitKey: ov.fitKey,
      path: ov.buildPath(avatarDims, clothingDims, cx),
    })),
    [avatarDims, clothingDims, cx],
  );

  const seams = useMemo(
    () => template.buildSeams(avatarDims, clothingDims, cx),
    [avatarDims, clothingDims, cx],
  );

  return (
    <g>
      {/* clipPath definition */}
      <defs>
        <clipPath id="clothing-clip">
          <path d={silhouettePath} />
        </clipPath>
      </defs>

      {/* Base silhouette */}
      <path
        d={silhouettePath}
        fill={SILHOUETTE_FILL}
        stroke={SILHOUETTE_STROKE}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Fit color overlays (clipped to silhouette) */}
      <g clipPath="url(#clothing-clip)">
        {overlayPaths.map(ov => {
          const regionFit = fitResult.regions[ov.fitKey];
          const level = regionFit?.level ?? 'good';
          return (
            <path
              key={ov.id}
              d={ov.path}
              fill={getFitColor(level)}
              stroke="none"
            />
          );
        })}
      </g>

      {/* Seam lines */}
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
