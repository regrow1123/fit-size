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

  const bodyPath = useMemo(
    () => template.buildBody(avatarDims, clothingDims, cx),
    [avatarDims, clothingDims, cx],
  );

  const leftSleeve = useMemo(
    () => template.buildSleeve(avatarDims, clothingDims, cx, -1),
    [avatarDims, clothingDims, cx],
  );

  const rightSleeve = useMemo(
    () => template.buildSleeve(avatarDims, clothingDims, cx, 1),
    [avatarDims, clothingDims, cx],
  );

  const overlayPaths = useMemo(
    () => template.overlays.map(ov => ({
      id: ov.id,
      fitKey: ov.fitKey,
      path: ov.buildPath(avatarDims, clothingDims, cx),
      sleeveSide: ov.sleeveSide,
    })),
    [avatarDims, clothingDims, cx],
  );

  const seams = useMemo(
    () => template.buildSeams(avatarDims, clothingDims, cx),
    [avatarDims, clothingDims, cx],
  );

  const getSleeveTransform = (side?: 1 | -1): string | undefined => {
    if (side === 1) return rightSleeve.transform;
    if (side === -1) return leftSleeve.transform;
    return undefined;
  };

  return (
    <g>
      {/* clipPath: body + both sleeves */}
      <defs>
        <clipPath id="clothing-clip">
          <path d={bodyPath} />
          {leftSleeve.path && <path d={leftSleeve.path} transform={leftSleeve.transform} />}
          {rightSleeve.path && <path d={rightSleeve.path} transform={rightSleeve.transform} />}
        </clipPath>
      </defs>

      {/* Layer 1-2: Sleeves behind body (skip if integrated into body path) */}
      {leftSleeve.path && (
        <g transform={leftSleeve.transform}>
          <path d={leftSleeve.path} fill={SILHOUETTE_FILL} stroke={SILHOUETTE_STROKE} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        </g>
      )}
      {rightSleeve.path && (
        <g transform={rightSleeve.transform}>
          <path d={rightSleeve.path} fill={SILHOUETTE_FILL} stroke={SILHOUETTE_STROKE} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        </g>
      )}

      {/* Layer 3: Body in front */}
      <path
        d={bodyPath}
        fill={SILHOUETTE_FILL}
        stroke={SILHOUETTE_STROKE}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Layer 4: Fit color overlays (clipped to full silhouette) */}
      <g clipPath="url(#clothing-clip)">
        {overlayPaths.map(ov => {
          const regionFit = fitResult.regions[ov.fitKey];
          const level = regionFit?.level ?? 'good';
          const transform = getSleeveTransform(ov.sleeveSide);
          return (
            <path
              key={ov.id}
              d={ov.path}
              fill={getFitColor(level)}
              stroke="none"
              transform={transform}
            />
          );
        })}
      </g>

      {/* Layer 5: Seam lines */}
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
