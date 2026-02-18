import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { BodyMeasurements, ClothingCategory } from '../types';
import { calculateAvatarDimensions } from '../utils/avatarCalculator';
import { calculateClothingDimensions } from '../utils/clothingRenderer';
import { judgeFit, type FitLevel } from '../utils/fitJudgment';
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

const FIXED_BODY: BodyMeasurements = { height: 175, weight: 70, gender: 'male' as const };
const FIXED_CLOTHING = new Map<string, number>([
  ['shoulderWidth', 48], ['chestWidth', 50], ['totalLength', 70],
  ['sleeveLength', 25], ['hemWidth', 50], ['sleeveCirc', 42],
]);

const LEVEL_STYLE: Record<FitLevel, { color: string; bg: string; border: string; emoji: string; line: string }> = {
  tight: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', emoji: '🔴', line: 'bg-red-300' },
  good:  { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', emoji: '🟢', line: 'bg-green-300' },
  loose: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', emoji: '🟡', line: 'bg-yellow-300' },
};

// 부위별 Y 위치 (아바타 높이 비율) 및 좌우 배치
const PART_CONFIG: Record<string, { yRatio: number; side: 'left' | 'right' }> = {
  shoulder: { yRatio: 0.15, side: 'right' },
  chest:    { yRatio: 0.27, side: 'left' },
  waist:    { yRatio: 0.40, side: 'right' },
  length:   { yRatio: 0.53, side: 'left' },
  sleeve:   { yRatio: 0.22, side: 'right' },
};

export default function FittingResult({ body, clothingMeasurements, category }: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [avatarH, setAvatarH] = useState(500);

  const measureAvatar = useCallback(() => {
    if (!containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (svg) setAvatarH(svg.clientHeight);
  }, []);

  useEffect(() => {
    measureAvatar();
    const ro = new ResizeObserver(measureAvatar);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measureAvatar]);

  const avatarDims = useMemo(() => calculateAvatarDimensions(FIXED_BODY), []);
  const clothingDims = useMemo(
    () => calculateClothingDimensions(FIXED_CLOTHING, FIXED_BODY.height, category),
    [category],
  );

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

  const measuredResults = fitResults.filter(r => r.bodyValue > 0);
  const hasTight = measuredResults.some(r => r.level === 'tight');
  const hasLoose = measuredResults.some(r => r.level === 'loose');
  const overallLevel: FitLevel = measuredResults.length === 0 ? 'good' : hasTight ? 'tight' : hasLoose ? 'loose' : 'good';
  const overallStyle = LEVEL_STYLE[overallLevel];

  const leftLabels = fitResults.filter(r => PART_CONFIG[r.part]?.side === 'left');
  const rightLabels = fitResults.filter(r => PART_CONFIG[r.part]?.side === 'right');

  return (
    <div className="flex flex-col items-center w-full">
      {/* 전체 판정 배너 */}
      <div className={`w-full rounded-xl p-4 mb-4 text-center ${overallStyle.bg} border ${overallStyle.border}`}>
        <div className="text-2xl mb-1">{overallStyle.emoji}</div>
        <div className={`text-lg font-bold ${overallStyle.color}`}>
          {t(`fit.overall.${overallLevel}`)}
        </div>
      </div>

      {/* 3컬럼: 왼쪽 라벨 | 아바타 | 오른쪽 라벨 */}
      <div className="w-full bg-white rounded-xl border shadow-sm p-2 sm:p-4">
        <div className="flex items-stretch">
          {/* 왼쪽 라벨 */}
          <div className="flex-1 flex flex-col justify-start relative min-w-0" style={{ minHeight: avatarH }}>
            {leftLabels.map(r => {
              const cfg = PART_CONFIG[r.part];
              if (!cfg) return null;
              const style = LEVEL_STYLE[r.level];
              const easeStr = r.ease >= 0 ? `+${r.ease.toFixed(1)}` : r.ease.toFixed(1);
              return (
                <div
                  key={r.part}
                  className="absolute right-0 flex items-center gap-1"
                  style={{ top: `${cfg.yRatio * 100}%` }}
                >
                  <div className={`px-2 py-1 rounded-lg border text-right ${style.bg} ${style.border}`}>
                    <div className="font-semibold text-gray-700 text-[11px] sm:text-xs">{t(`fit.part.${r.part}`)}</div>
                    {r.bodyValue > 0 ? (
                      <div className={`font-bold ${style.color} text-[11px] sm:text-xs`}>{easeStr}cm</div>
                    ) : (
                      <div className="text-gray-500 text-[11px] sm:text-xs">{r.clothValue}cm</div>
                    )}
                  </div>
                  <div className={`w-3 sm:w-5 h-[2px] ${style.line}`} />
                </div>
              );
            })}
          </div>

          {/* 아바타 */}
          <div ref={containerRef} className="flex-shrink-0" style={{ width: '45%', maxWidth: 220 }}>
            <svg
              viewBox={`0 0 ${BASE_WIDTH} ${BASE_HEIGHT}`}
              className="w-full h-auto"
            >
              <AvatarSvg avatarDims={avatarDims} canvasWidth={BASE_WIDTH} canvasHeight={BASE_HEIGHT} />
              {clothingDims && (
                <ClothingSvg
                  avatarDims={avatarDims} clothingDims={clothingDims}
                  clothingCm={clothingMeasurements} body={FIXED_BODY}
                  canvasWidth={BASE_WIDTH} canvasHeight={BASE_HEIGHT}
                />
              )}
            </svg>
          </div>

          {/* 오른쪽 라벨 */}
          <div className="flex-1 flex flex-col justify-start relative min-w-0" style={{ minHeight: avatarH }}>
            {rightLabels.map(r => {
              const cfg = PART_CONFIG[r.part];
              if (!cfg) return null;
              const style = LEVEL_STYLE[r.level];
              const easeStr = r.ease >= 0 ? `+${r.ease.toFixed(1)}` : r.ease.toFixed(1);
              return (
                <div
                  key={r.part}
                  className="absolute left-0 flex items-center gap-1"
                  style={{ top: `${cfg.yRatio * 100}%` }}
                >
                  <div className={`w-3 sm:w-5 h-[2px] ${style.line}`} />
                  <div className={`px-2 py-1 rounded-lg border text-left ${style.bg} ${style.border}`}>
                    <div className="font-semibold text-gray-700 text-[11px] sm:text-xs">{t(`fit.part.${r.part}`)}</div>
                    {r.bodyValue > 0 ? (
                      <div className={`font-bold ${style.color} text-[11px] sm:text-xs`}>{easeStr}cm</div>
                    ) : (
                      <div className="text-gray-500 text-[11px] sm:text-xs">{r.clothValue}cm</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
