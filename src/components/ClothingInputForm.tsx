import { useState, useCallback, useMemo } from 'react';
import ClothingSketch from './ClothingSketch';
import type { ClothingCategory, PointMeasurement, BodyMeasurements } from '../types';
import { CLOTHING_CATEGORIES } from '../data/anchorPoints';
import { pointMeasurementsToMap } from '../utils/clothingRenderer';
import { estimateBodyDimensions } from '../data/bodyStats';
import { useTranslation } from '../i18n';
import { parseSizeChart, type ParsedSizeChart } from '../utils/sizeChartParser';

interface Props {
  onSubmit: (measurements: Map<string, number>, category: ClothingCategory) => void;
  body: BodyMeasurements;
}

/** 체형 기반으로 "적당한 옷" 기본 치수 생성 (체형 + ease) */
function generateBodyDefaults(body: BodyMeasurements, category: ClothingCategory): Map<string, number> {
  const stats = estimateBodyDimensions(
    body.gender, body.height, body.weight,
    body.shoulderWidth, body.chestCirc, body.waistCirc, body.hipCirc,
  );

  const map = new Map<string, number>();

  const EASE = { shoulder: 2, circ: 8, hem: 10, sleeve: 2 };

  if (category === 'tshirt' || category === 'long_sleeve' || category === 'jacket' || category === 'dress') {
    map.set('shoulderWidth', stats.shoulderWidth + EASE.shoulder);
    map.set('chestWidth', (stats.chestCirc + EASE.circ) / 2);
    map.set('hemCirc', stats.waistCirc + EASE.hem);
    map.set('totalLength', stats.torsoLength + 25);

    if (category === 'tshirt') {
      map.set('sleeveLength', 22);
      map.set('sleeveCirc', 38);
    } else if (category === 'long_sleeve') {
      map.set('sleeveLength', stats.armLength);
      map.set('sleeveCirc', 34);
      map.set('elbowCirc', 30);
      map.set('cuffCirc', 24);
    } else if (category === 'jacket') {
      map.set('shoulderWidth', stats.shoulderWidth + 3);
      map.set('chestWidth', (stats.chestCirc + 12) / 2);
      map.set('sleeveLength', stats.armLength + 2);
      map.set('sleeveCirc', 38);
      map.set('elbowCirc', 34);
      map.set('cuffCirc', 28);
      map.set('totalLength', stats.torsoLength + 30);
    } else if (category === 'dress') {
      map.set('hipCirc', stats.hipCirc + EASE.circ);
      map.set('sleeveLength', 18);
      map.set('sleeveCirc', 36);
      map.set('totalLength', stats.torsoLength + 55);
      map.set('hemCirc', stats.hipCirc + 20);
    }
  }

  if (category === 'pants') {
    map.set('waistCirc', stats.waistCirc + 4);
    map.set('hipCirc', stats.hipCirc + 6);
    map.set('thighCirc', (stats.hipCirc / 2) * 0.65 * 2 + 8);
    map.set('kneeCirc', 40);
    map.set('hemCirc', 36);
    map.set('rise', 26);
    map.set('inseam', (body.height - stats.torsoLength - stats.shoulderWidth * 0.4) * 0.48);
    map.set('totalLength', body.height * 0.55);
  }

  return map;
}

/** Measurement key → i18n key mapping */
const MEASUREMENT_LABEL_KEYS: Record<string, string> = {
  shoulderWidth: 'measure.shoulderWidth',
  chestWidth: 'measure.chestWidth',
  waistCirc: 'measure.waistCirc',
  hipCirc: 'measure.hipCirc',
  hemCirc: 'measure.hemCirc',
  totalLength: 'measure.totalLength',
  sleeveLength: 'measure.sleeveLength',
  sleeveCirc: 'measure.sleeveCirc',
  elbowCirc: 'measure.elbowCirc',
  cuffCirc: 'measure.cuffCirc',
  thighCirc: 'measure.thighCirc',
  kneeCirc: 'measure.kneeCirc',
  rise: 'measure.rise',
  inseam: 'measure.inseam',
};

/** 카테고리별 표시할 측정 키 순서 */
const CATEGORY_KEYS: Record<ClothingCategory, string[]> = {
  tshirt: ['shoulderWidth', 'chestWidth', 'totalLength', 'sleeveLength', 'hemCirc'],
  long_sleeve: ['shoulderWidth', 'chestWidth', 'totalLength', 'sleeveLength', 'cuffCirc', 'hemCirc'],
  jacket: ['shoulderWidth', 'chestWidth', 'totalLength', 'sleeveLength', 'cuffCirc', 'hemCirc'],
  pants: ['waistCirc', 'hipCirc', 'totalLength', 'thighCirc', 'kneeCirc', 'hemCirc', 'rise', 'inseam'],
  dress: ['shoulderWidth', 'chestWidth', 'hipCirc', 'totalLength', 'sleeveLength', 'hemCirc'],
};

let nextId = 1;

export default function ClothingInputForm({ onSubmit, body }: Props) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<ClothingCategory>('tshirt');
  const [measurements, setMeasurements] = useState<PointMeasurement[]>([]);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [parsedChart, setParsedChart] = useState<ParsedSizeChart | null>(null);
  const [parseError, setParseError] = useState(false);
  const [appliedSize, setAppliedSize] = useState<string | null>(null);
  const [chartOverrides, setChartOverrides] = useState<Map<string, number>>(new Map());

  const handleAdd = useCallback((startId: string, endId: string, value: number) => {
    setMeasurements(prev => [
      ...prev,
      { id: `m${nextId++}`, startPointId: startId, endPointId: endId, value },
    ]);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setMeasurements(prev => prev.filter(m => m.id !== id));
  }, []);

  const handleCategoryChange = (cat: ClothingCategory) => {
    setCategory(cat);
    setMeasurements([]);
    setChartOverrides(new Map());
    setAppliedSize(null);
    setParsedChart(null);
    setPasteText('');
    setParseError(false);
  };

  const handlePasteChange = (text: string) => {
    setPasteText(text);
    setParseError(false);
    setAppliedSize(null);
    if (text.trim().length > 10) {
      const chart = parseSizeChart(text);
      if (chart) {
        setParsedChart(chart);
        setParseError(false);
      } else {
        setParsedChart(null);
        setParseError(true);
      }
    } else {
      setParsedChart(null);
    }
  };

  const handleSelectSize = (sizeLabel: string) => {
    if (!parsedChart) return;
    const row = parsedChart.rows.find(r => r.sizeLabel === sizeLabel);
    if (!row) return;
    setChartOverrides(new Map(Object.entries(row.measurements)));
    setAppliedSize(sizeLabel);
  };

  const userMap = useMemo(() => pointMeasurementsToMap(measurements, category), [measurements, category]);
  const defaults = useMemo(() => generateBodyDefaults(body, category), [body, category]);
  const finalMap = useMemo(() => {
    const merged = new Map(defaults);
    // 사이즈표 값 적용 (체형 기본값 위에)
    for (const [k, v] of chartOverrides) {
      merged.set(k, v);
    }
    // 스케치 입력값이 최우선
    for (const [k, v] of userMap) {
      merged.set(k, v);
    }
    return merged;
  }, [defaults, chartOverrides, userMap]);

  const handleSubmit = () => {
    onSubmit(finalMap, category);
  };

  const keys = CATEGORY_KEYS[category] ?? [];
  const catConfig = CLOTHING_CATEGORIES.find(c => c.id === category)!;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">{t('clothing.title', { icon: catConfig.icon })}</h2>

      {/* Category selector */}
      <div className="flex flex-wrap gap-1.5">
        {CLOTHING_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition ${
              category === cat.id
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.icon} {t(`category.${cat.id}`)}
          </button>
        ))}
      </div>

      {/* Size chart paste */}
      <div>
        <button
          onClick={() => setShowPaste(!showPaste)}
          className="flex items-center justify-between w-full text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-100 cursor-pointer transition"
        >
          <span>{t('clothing.paste')}</span>
          <span className="text-blue-400">{showPaste ? '▲' : '▼'}</span>
        </button>
        {showPaste && (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-gray-400">{t('clothing.pasteDesc')}</p>
            <textarea
              value={pasteText}
              onChange={e => handlePasteChange(e.target.value)}
              placeholder={t('clothing.pastePlaceholder')}
              className="w-full border rounded-lg px-3 py-2 text-xs font-mono h-28 resize-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
            />
            {parseError && (
              <p className="text-xs text-red-500">{t('clothing.parseFailed')}</p>
            )}
            {parsedChart && (
              <div className="space-y-2">
                <p className="text-xs text-green-600">
                  {t('clothing.mappedCount', { count: parsedChart.mappedKeys.filter(k => k !== null).length })}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {parsedChart.rows.map(row => (
                    <button
                      key={row.sizeLabel}
                      onClick={() => handleSelectSize(row.sizeLabel)}
                      className={`px-3 py-1.5 rounded-full text-sm border cursor-pointer transition ${
                        appliedSize === row.sizeLabel
                          ? 'bg-green-600 text-white border-green-600 shadow'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {row.sizeLabel}
                    </button>
                  ))}
                </div>
                {appliedSize && (
                  <p className="text-xs text-green-600 font-medium">
                    {t('clothing.applied', { size: appliedSize })}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500">{t('clothing.sketchGuide')}</p>

      <ClothingSketch
        category={category}
        measurements={measurements}
        onAddMeasurement={handleAdd}
        onDeleteMeasurement={handleDelete}
      />

      {/* Clothing dimensions table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="text-left px-3 py-2 font-medium">{t('clothing.tableHeader.part')}</th>
              <th className="text-right px-3 py-2 font-medium">{t('clothing.tableHeader.size')}</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(key => {
              const labelKey = MEASUREMENT_LABEL_KEYS[key];
              const label = labelKey ? t(labelKey) : key;
              const clothVal = finalMap.get(key);
              const userEntered = userMap.has(key);
              const fromChart = !userEntered && chartOverrides.has(key);

              return (
                <tr key={key} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-gray-700">{label}</td>
                  <td className={`px-3 py-2 text-right font-mono font-semibold ${userEntered ? 'text-blue-600' : fromChart ? 'text-green-600' : 'text-gray-400'}`}>
                    {clothVal != null ? clothVal.toFixed(0) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition cursor-pointer"
      >
        {t('clothing.submit')}
      </button>
    </div>
  );
}
