import { useMemo } from 'react';
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

const SVG_W = 400;
const SVG_H = 700;

const FIXED_BODY: BodyMeasurements = { height: 175, weight: 70, gender: 'male' as const };
const FIXED_CLOTHING = new Map<string, number>([
  ['shoulderWidth', 48], ['chestWidth', 50], ['totalLength', 70],
  ['sleeveLength', 25], ['hemWidth', 50], ['sleeveCirc', 42],
]);

const LEVEL_STYLE: Record<FitLevel, { color: string; bg: string; border: string; emoji: string; stroke: string }> = {
  tight: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', emoji: '🔴', stroke: '#fca5a5' },
  good:  { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', emoji: '🟢', stroke: '#86efac' },
  loose: { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', emoji: '🟡', stroke: '#fde047' },
};

// 전체 캔버스(SVG+라벨 패딩)에서의 라벨/화살표 설정
// viewBox를 넓혀서 양옆에 라벨 공간 확보
const PADDED_W = 550; // SVG_W(400) + 좌75 + 우75
const PAD_LEFT = 75;
// 아바타 부위별 타겟 좌표 (원래 400x700 viewBox 기준 → padded 기준으로 오프셋)
// side: 라벨이 어느 쪽에 위치하는지
interface PartTarget {
  tx: number; ty: number; // 아바타 위 타겟 점 (padded viewBox)
  side: 'left' | 'right';
  labelY: number; // 라벨 Y (padded viewBox)
}

function getPartTargets(av: ReturnType<typeof calculateAvatarDimensions>): Record<string, PartTarget> {
  const cx = SVG_W / 2 + PAD_LEFT; // 아바타 중심 (padded)
  const shH = av.shoulderWidth / 2;
  const clothSY = av.shoulderY - 15; // 옷 시작 Y (tshirt.ts에서 -15 오프셋)
  return {
    shoulder: { tx: cx + shH, ty: clothSY + 5, side: 'right', labelY: clothSY + 5 },
    sleeve:   { tx: cx + shH + 25, ty: clothSY + 60, side: 'right', labelY: clothSY + 60 },
    waist:    { tx: cx + av.waistWidth / 2, ty: av.waistY, side: 'right', labelY: av.waistY },
    chest:    { tx: cx - av.chestWidth / 2, ty: av.chestY, side: 'left', labelY: av.chestY },
    length:   { tx: cx - 10, ty: clothSY + 240, side: 'left', labelY: clothSY + 240 },
  };
}

export default function FittingResult({ body, clothingMeasurements, category }: Props) {
  const { t } = useTranslation();

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

  const partTargets = useMemo(() => getPartTargets(avatarDims), [avatarDims]);

  // 라벨 크기 (viewBox 단위)
  const LABEL_W = 85;
  const LABEL_H = 52;
  const LABEL_PAD = 0;

  return (
    <div className="flex flex-col items-center w-full">
      {/* 전체 판정 배너 */}
      <div className={`w-full rounded-xl p-4 mb-4 text-center ${overallStyle.bg} border ${overallStyle.border}`}>
        <div className="text-2xl mb-1">{overallStyle.emoji}</div>
        <div className={`text-lg font-bold ${overallStyle.color}`}>
          {t(`fit.overall.${overallLevel}`)}
        </div>
      </div>

      {/* 통합 SVG: 아바타 + 옷 + 라벨 + 화살표 */}
      <div className="w-full bg-white rounded-xl border shadow-sm p-2">
        <svg viewBox={`0 0 ${PADDED_W} ${SVG_H}`} className="w-full h-auto">
          {/* 아바타 + 옷 (원래 위치에서 PAD_LEFT만큼 오른쪽으로) */}
          <g transform={`translate(${PAD_LEFT}, 0)`}>
            <AvatarSvg avatarDims={avatarDims} canvasWidth={SVG_W} canvasHeight={SVG_H} />
            {clothingDims && (
              <ClothingSvg
                avatarDims={avatarDims} clothingDims={clothingDims}
                clothingCm={clothingMeasurements} body={FIXED_BODY}
                canvasWidth={SVG_W} canvasHeight={SVG_H}
              />
            )}
          </g>

          {/* 라벨 + 화살표 */}
          {fitResults.map(r => {
            const cfg = partTargets[r.part];
            if (!cfg) return null;
            const style = LEVEL_STYLE[r.level];
            const easeStr = r.ease >= 0 ? `+${r.ease.toFixed(1)}` : r.ease.toFixed(1);

            // 라벨 위치 (아바타 바로 옆에 배치)
            const GAP = 4;
            const lx = cfg.side === 'left' ? PAD_LEFT - LABEL_W - GAP : PAD_LEFT + SVG_W + GAP;
            const ly = cfg.labelY - LABEL_H / 2;

            // 화살표 시작점 (라벨 끝)
            const arrowStartX = cfg.side === 'left' ? lx + LABEL_W : lx;
            const arrowStartY = cfg.labelY;

            return (
              <g key={r.part}>
                {/* 화살표 선 */}
                <line
                  x1={arrowStartX} y1={arrowStartY}
                  x2={cfg.tx} y2={cfg.ty}
                  stroke={style.stroke} strokeWidth={2}
                  strokeDasharray="4 3"
                />
                {/* 화살표 끝 점 */}
                <circle cx={cfg.tx} cy={cfg.ty} r={4} fill={style.stroke} />

                {/* 라벨 배경 */}
                <rect x={lx} y={ly} width={LABEL_W} height={LABEL_H} rx={8}
                  fill="white" stroke={style.stroke} strokeWidth={1.5} />

                {/* 라벨 텍스트 */}
                <text x={lx + LABEL_W / 2} y={ly + 20} textAnchor="middle"
                  fontSize={18} fontWeight={600} fill="#374151">
                  {t(`fit.part.${r.part}`)}
                </text>
                <text x={lx + LABEL_W / 2} y={ly + 42} textAnchor="middle"
                  fontSize={17} fontWeight={700}
                  fill={r.level === 'tight' ? '#dc2626' : r.level === 'loose' ? '#ca8a04' : '#16a34a'}>
                  {r.bodyValue > 0 ? `${easeStr}cm` : `${r.clothValue}cm`}
                </text>
              </g>
            );
          })}
        </svg>
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
