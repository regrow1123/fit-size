import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { BodyMeasurements, AvatarDimensions, ClothingDimensions, ClothingCategory } from '../types';
import { calculateAvatarDimensions } from '../utils/avatarCalculator';
import { calculateClothingDimensions } from '../utils/clothingRenderer';
import { useTranslation } from '../i18n';
import AvatarSvg from './AvatarSvg';
import ClothingSvg from './ClothingSvg';

interface Props {
  body: BodyMeasurements;
  clothingMeasurements?: Map<string, number>;
  category?: ClothingCategory;
}

const BASE_WIDTH = 400;
const BASE_HEIGHT = 700;
const ASPECT = BASE_HEIGHT / BASE_WIDTH;

// ── 고정 체형 (175cm / 70kg 남성) ──
const FIXED_BODY: BodyMeasurements = {
  height: 175,
  weight: 70,
  gender: 'male' as const,
};

// ── 고정 옷 수치 (기본 반팔 상의) ──
const FIXED_CLOTHING = new Map<string, number>([
  ['shoulderWidth', 48],
  ['chestWidth', 50],
  ['totalLength', 70],
  ['sleeveLength', 25],
  ['hemWidth', 50],
  ['sleeveCirc', 42],
]);

export default function FittingCanvas({ body: _body, clothingMeasurements, category = 'tshirt' }: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: BASE_WIDTH, h: BASE_HEIGHT });

  const measure = useCallback(() => {
    if (!containerRef.current) return;
    const maxW = Math.min(containerRef.current.clientWidth, BASE_WIDTH);
    const w = Math.max(280, maxW);
    setSize({ w, h: Math.round(w * ASPECT) });
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // 고정값 사용 (체형/옷 수치 변화 무시)
  const avatarDims: AvatarDimensions = useMemo(
    () => calculateAvatarDimensions(FIXED_BODY),
    [],
  );

  const clothingDims: ClothingDimensions | null = useMemo(
    () => calculateClothingDimensions(FIXED_CLOTHING, FIXED_BODY.height, category),
    [category],
  );

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center">
      <svg
        viewBox={`0 0 ${BASE_WIDTH} ${BASE_HEIGHT}`}
        style={{ width: size.w, height: size.h }}
        className="border rounded-lg bg-white shadow-inner"
      >
        <AvatarSvg
          avatarDims={avatarDims}
          canvasWidth={BASE_WIDTH}
          canvasHeight={BASE_HEIGHT}
        />
        {clothingDims && (
          <ClothingSvg
            avatarDims={avatarDims}
            clothingDims={clothingDims}
            clothingCm={clothingMeasurements ?? FIXED_CLOTHING}
            body={FIXED_BODY}
            canvasWidth={BASE_WIDTH}
            canvasHeight={BASE_HEIGHT}
          />
        )}
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-500 inline-block" /> {t('fit.good')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-yellow-500 inline-block" /> {t('fit.loose')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-500 inline-block" /> {t('fit.tight')}
        </span>
      </div>
    </div>
  );
}
