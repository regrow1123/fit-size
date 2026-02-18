import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { BodyMeasurements, ClothingCategory } from '../types';
import { calculateAvatarDimensions } from '../utils/avatarCalculator';
import { calculateClothingDimensions } from '../utils/clothingRenderer';
import { judgeFit, type FitResult, type FitLevel } from '../utils/fitJudgment';
import { estimateBodyDimensions } from '../data/bodyStats';
import { useTranslation } from '../i18n';
import AvatarSvg from './AvatarSvg';
import ClothingSvg from './ClothingSvg';

interface Props {
  body: BodyMeasurements;
  clothingMeasurements: Map<string, number>;
  category: ClothingCategory;
}

const BASE_WIDTH = 400;
const BASE_HEIGHT = 700;
const ASPECT = BASE_HEIGHT / BASE_WIDTH;

// 고정 체형/옷
const FIXED_BODY: BodyMeasurements = {
  height: 175,
  weight: 70,
  gender: 'male' as const,
};
const FIXED_CLOTHING = new Map<string, number>([
  ['shoulderWidth', 48],
  ['chestWidth', 50],
  ['totalLength', 70],
  ['sleeveLength', 25],
  ['hemWidth', 50],
  ['sleeveCirc', 42],
]);

const LEVEL_STYLE: Record<FitLevel, { color: string; bg: string; border: string; emoji: string }> = {
  tight: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', emoji: '🔴' },
  good:  { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', emoji: '🟢' },
  loose: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', emoji: '🟡' },
};

// 부위별 라벨 위치 (SVG viewBox 기준 비율)
const LABEL_POSITIONS: Record<string, { x: number; y: number; side: 'left' | 'right' }> = {
  shoulder: { x: 0.85, y: 0.16, side: 'right' },
  chest:    { x: 0.12, y: 0.28, side: 'left' },
  waist:    { x: 0.85, y: 0.42, side: 'right' },
  hip:      { x: 0.12, y: 0.48, side: 'left' },
  length:   { x: 0.85, y: 0.55, side: 'right' },
  sleeve:   { x: 0.10, y: 0.20, side: 'left' },
};

function FitLabel({ result, x, y, side, t }: {
  result: FitResult;
  x: number;
  y: number;
  side: 'left' | 'right';
  t: (k: string) => string;
}) {
  const style = LEVEL_STYLE[result.level];
  const easeStr = result.ease >= 0 ? `+${result.ease.toFixed(1)}` : result.ease.toFixed(1);

  return (
    <div
      className={`absolute pointer-events-none`}
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: side === 'left' ? 'translate(-100%, -50%)' : 'translate(0%, -50%)',
      }}
    >
      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-xs whitespace-nowrap shadow-sm ${style.bg} ${style.border}`}>
        {side === 'right' && (
          <span className={`text-[10px] ${style.color}`}>◀</span>
        )}
        <div className="flex flex-col">
          <span className="font-semibold text-gray-700 text-[11px]">{t(`fit.part.${result.part}`)}</span>
          {result.bodyValue > 0 ? (
            <span className={`font-bold ${style.color} text-[11px]`}>{easeStr}cm {style.emoji}</span>
          ) : (
            <span className="text-gray-500 text-[11px]">{result.clothValue}cm</span>
          )}
        </div>
        {side === 'left' && (
          <span className={`text-[10px] ${style.color}`}>▶</span>
        )}
      </div>
    </div>
  );
}

export default function FittingResult({ body, clothingMeasurements, category }: Props) {
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

  const avatarDims = useMemo(() => calculateAvatarDimensions(FIXED_BODY), []);
  const clothingDims = useMemo(
    () => calculateClothingDimensions(FIXED_CLOTHING, FIXED_BODY.height, category),
    [category],
  );

  // body에 둘레값이 없으면 추정값으로 채움
  const fullBody = useMemo(() => {
    const stats = estimateBodyDimensions(body.gender, body.height, body.weight, body.shoulderWidth, body.chestCirc, body.waistCirc, body.hipCirc);
    return {
      ...body,
      shoulderWidth: body.shoulderWidth ?? stats.shoulderWidth,
      chestCirc: body.chestCirc ?? stats.chestCirc,
      waistCirc: body.waistCirc ?? stats.waistCirc,
      hipCirc: body.hipCirc ?? stats.hipCirc,
    };
  }, [body]);

  const fitResults = useMemo(
    () => judgeFit(fullBody, clothingMeasurements, category),
    [fullBody, clothingMeasurements, category],
  );

  // 전체 판정 (측정 비교가 있는 부위만)
  const measuredResults = fitResults.filter(r => r.bodyValue > 0);
  const hasTight = measuredResults.some(r => r.level === 'tight');
  const hasLoose = measuredResults.some(r => r.level === 'loose');
  const overallLevel: FitLevel = measuredResults.length === 0 ? 'good' : hasTight ? 'tight' : hasLoose ? 'loose' : 'good';
  const overallStyle = LEVEL_STYLE[overallLevel];

  return (
    <div className="flex flex-col items-center w-full">
      {/* 전체 판정 배너 */}
      <div className={`w-full rounded-xl p-4 mb-4 text-center ${overallStyle.bg} border ${overallStyle.border}`}>
        <div className="text-2xl mb-1">{overallStyle.emoji}</div>
        <div className={`text-lg font-bold ${overallStyle.color}`}>
          {t(`fit.overall.${overallLevel}`)}
        </div>
      </div>

      {/* 아바타 + 라벨 */}
      <div ref={containerRef} className="relative w-full max-w-[400px]">
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
              clothingCm={clothingMeasurements}
              body={FIXED_BODY}
              canvasWidth={BASE_WIDTH}
              canvasHeight={BASE_HEIGHT}
            />
          )}
        </svg>

        {/* 핏 라벨 오버레이 */}
        {fitResults.map(r => {
          const pos = LABEL_POSITIONS[r.part];
          if (!pos) return null;
          return (
            <FitLabel
              key={r.part}
              result={r}
              x={pos.x}
              y={pos.y}
              side={pos.side}
              t={t}
            />
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex gap-4 mt-3 text-xs text-gray-500">
        <span>🔴 {t('fit.level.tight')}</span>
        <span>🟢 {t('fit.level.good')}</span>
        <span>🟡 {t('fit.level.loose')}</span>
      </div>
    </div>
  );
}
