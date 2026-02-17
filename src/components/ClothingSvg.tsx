import { useMemo } from 'react';
import type { AvatarDimensions, BodyMeasurements, ClothingDimensions } from '../types';
import { tshirtTemplate, buildSeamPaths } from '../clothing/templates/tshirt';
import { analyzeFit, getFitColor, getFitStrokeColor } from '../clothing/fitAnalysis';
import type { FitResult } from '../clothing/types';

interface Props {
  avatarDims: AvatarDimensions;
  clothingDims: ClothingDimensions;
  clothingCm: Map<string, number>;
  body: BodyMeasurements;
  canvasWidth: number;
  canvasHeight: number;
}

const REGION_LABELS: Record<string, string> = {
  body: '몸통',
  sleeve_right: '오른쪽 소매',
  sleeve_left: '왼쪽 소매',
  collar: '어깨/넥라인',
};

function getRegionFitKey(regionId: string): string {
  const map: Record<string, string> = {
    body: 'chest',
    sleeve_right: 'sleeve',
    sleeve_left: 'sleeve',
    collar: 'shoulder',
  };
  return map[regionId] ?? regionId;
}

export default function ClothingSvg({
  avatarDims,
  clothingDims,
  clothingCm,
  body,
  canvasWidth,
  canvasHeight,
}: Props) {
  const fitResult: FitResult = useMemo(
    () => analyzeFit(clothingCm, body),
    [clothingCm, body],
  );

  const cx = canvasWidth / 2;

  const regions = useMemo(
    () =>
      tshirtTemplate.regions.map(region => ({
        ...region,
        path: region.buildPath(avatarDims, clothingDims, cx),
      })),
    [avatarDims, clothingDims, cx],
  );

  const seams = useMemo(
    () => buildSeamPaths(avatarDims, clothingDims, cx),
    [avatarDims, clothingDims, cx],
  );

  return (
    <svg
      width={canvasWidth}
      height={canvasHeight}
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    >
      {regions.map(region => {
        const fitKey = getRegionFitKey(region.id);
        const regionFit = fitResult.regions[fitKey];
        const level = regionFit?.level ?? 'good';
        const ease = regionFit?.ease ?? 0;
        const label = REGION_LABELS[region.id] ?? region.id;
        const tooltip = `${label}: ${ease >= 0 ? '+' : ''}${ease.toFixed(1)}cm`;

        return (
          <path
            key={region.id}
            d={region.path}
            fill={getFitColor(level)}
            stroke={getFitStrokeColor(level)}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
          >
            <title>{tooltip}</title>
          </path>
        );
      })}
      {/* Seam lines */}
      {seams.map((d, i) => (
        <path
          key={`seam-${i}`}
          d={d}
          fill="none"
          stroke="rgba(30, 80, 140, 0.2)"
          strokeWidth={0.5}
          strokeDasharray="3 4"
        />
      ))}
    </svg>
  );
}
