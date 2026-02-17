import { judgeFit, type FitLevel, type FitResult } from '../utils/fitJudgment';
import type { BodyMeasurements, ClothingCategory } from '../types';
import { useTranslation } from '../i18n';

interface Props {
  body: BodyMeasurements;
  clothing: Map<string, number>;
  category: ClothingCategory;
}

const LEVEL_CONFIG: Record<FitLevel, { emoji: string; color: string; bg: string }> = {
  tight: { emoji: '🔴', color: 'text-red-600',    bg: 'bg-red-50' },
  good:  { emoji: '🟢', color: 'text-green-600',  bg: 'bg-green-50' },
  loose: { emoji: '🟡', color: 'text-yellow-600', bg: 'bg-yellow-50' },
};

export default function FitResultPanel({ body, clothing, category }: Props) {
  const { t } = useTranslation();
  const results = judgeFit(body, clothing, category);

  if (results.length === 0) return null;

  // 전체 판정: 가장 많은 레벨
  const levelCounts = results.reduce((acc, r) => {
    acc[r.level] = (acc[r.level] || 0) + 1;
    return acc;
  }, {} as Record<FitLevel, number>);

  const hasTight = results.some(r => r.level === 'tight');
  const hasLoose = results.some(r => r.level === 'loose');
  const overallLevel: FitLevel = hasTight ? 'tight' : hasLoose ? 'loose'
    : (Object.entries(levelCounts).sort((a, b) => b[1] - a[1])[0][0] as FitLevel);

  return (
    <div className="space-y-3">
      {/* 전체 판정 */}
      <div className={`rounded-lg p-3 ${LEVEL_CONFIG[overallLevel].bg}`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{LEVEL_CONFIG[overallLevel].emoji}</span>
          <span className={`font-bold ${LEVEL_CONFIG[overallLevel].color}`}>
            {t(`fit.overall.${overallLevel}`)}
          </span>
        </div>
      </div>

      {/* 부위별 판정 */}
      <div className="space-y-1.5">
        {results.map(r => (
          <FitPartRow key={r.part} result={r} t={t} />
        ))}
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-400 pt-1">
        <span>🔴 {t('fit.level.tight')}</span>
        <span>🟢 {t('fit.level.good')}</span>
        <span>🟡 {t('fit.level.loose')}</span>
      </div>
    </div>
  );
}

function FitPartRow({ result, t }: { result: FitResult; t: (k: string) => string }) {
  const config = LEVEL_CONFIG[result.level];
  const easeStr = result.ease >= 0 ? `+${result.ease.toFixed(1)}` : result.ease.toFixed(1);

  return (
    <div className={`flex items-center justify-between rounded-md px-3 py-2 ${config.bg}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm">{config.emoji}</span>
        <span className="text-sm font-medium text-gray-700">{t(`fit.part.${result.part}`)}</span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-gray-400">
          {t('fit.body')} {result.bodyValue}cm → {t('fit.cloth')} {result.clothValue}cm
        </span>
        <span className={`font-bold ${config.color}`}>
          {easeStr}cm
        </span>
      </div>
    </div>
  );
}
