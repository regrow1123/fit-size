import { useState, useCallback, useMemo } from 'react';
import ClothingSketch from './ClothingSketch';
import type { ClothingCategory, PointMeasurement, BodyMeasurements } from '../types';
import { CLOTHING_CATEGORIES } from '../data/anchorPoints';
import { pointMeasurementsToMap } from '../utils/clothingRenderer';
import { estimateBodyDimensions } from '../data/bodyStats';

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

  // Ease = 옷이 몸보다 여유 있는 양 (cm)
  const EASE = { shoulder: 2, circ: 8, hem: 10, sleeve: 2 };

  if (category === 'tshirt' || category === 'long_sleeve' || category === 'jacket' || category === 'dress') {
    map.set('shoulderWidth', stats.shoulderWidth + EASE.shoulder);
    map.set('chestCirc', stats.chestCirc + EASE.circ);
    map.set('hemCirc', stats.waistCirc + EASE.hem);
    map.set('totalLength', stats.torsoLength + 25); // 어깨~엉덩이 + 여유

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
      map.set('chestCirc', stats.chestCirc + 12);
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
    map.set('thighCirc', (stats.hipCirc / 2) * 0.65 * 2 + 8); // rough thigh from hip
    map.set('kneeCirc', 40);
    map.set('hemCirc', 36);
    map.set('rise', 26);
    map.set('inseam', (body.height - stats.torsoLength - stats.shoulderWidth * 0.4) * 0.48);
    map.set('totalLength', body.height * 0.55);
  }

  return map;
}

/** 측정 키별 사람이 읽을 수 있는 라벨 */
const MEASUREMENT_LABELS: Record<string, string> = {
  shoulderWidth: '어깨너비',
  chestCirc: '가슴둘레',
  waistCirc: '허리둘레',
  hipCirc: '엉덩이둘레',
  hemCirc: '밑단둘레',
  totalLength: '총장',
  sleeveLength: '소매길이',
  sleeveCirc: '소매둘레',
  elbowCirc: '팔꿈치둘레',
  cuffCirc: '소매단둘레',
  thighCirc: '허벅지둘레',
  kneeCirc: '무릎둘레',
  rise: '밑위',
  inseam: '안쪽솔기',
};

/** 카테고리별 표시할 측정 키 순서 */
const CATEGORY_KEYS: Record<ClothingCategory, string[]> = {
  tshirt: ['shoulderWidth', 'chestCirc', 'totalLength', 'sleeveLength', 'hemCirc'],
  long_sleeve: ['shoulderWidth', 'chestCirc', 'totalLength', 'sleeveLength', 'cuffCirc', 'hemCirc'],
  jacket: ['shoulderWidth', 'chestCirc', 'totalLength', 'sleeveLength', 'cuffCirc', 'hemCirc'],
  pants: ['waistCirc', 'hipCirc', 'totalLength', 'thighCirc', 'kneeCirc', 'hemCirc', 'rise', 'inseam'],
  dress: ['shoulderWidth', 'chestCirc', 'hipCirc', 'totalLength', 'sleeveLength', 'hemCirc'],
};

let nextId = 1;

export default function ClothingInputForm({ onSubmit, body }: Props) {
  const [category, setCategory] = useState<ClothingCategory>('tshirt');
  const [measurements, setMeasurements] = useState<PointMeasurement[]>([]);

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
  };

  // 사용자 입력 → Map
  const userMap = useMemo(() => pointMeasurementsToMap(measurements, category), [measurements, category]);

  // 체형 기반 기본값
  const defaults = useMemo(() => generateBodyDefaults(body, category), [body, category]);

  // 최종 합산 (사용자 입력 우선, 없으면 기본값)
  const finalMap = useMemo(() => {
    const merged = new Map(defaults);
    for (const [k, v] of userMap) {
      merged.set(k, v);
    }
    return merged;
  }, [defaults, userMap]);

  // 체형 수치 (비교용)
  const bodyStats = useMemo(() => {
    return estimateBodyDimensions(
      body.gender, body.height, body.weight,
      body.shoulderWidth, body.chestCirc, body.waistCirc, body.hipCirc,
    );
  }, [body]);

  // 체형 수치를 cm Map으로
  const bodyMap = useMemo(() => {
    const m = new Map<string, number>();
    m.set('shoulderWidth', bodyStats.shoulderWidth);
    m.set('chestCirc', bodyStats.chestCirc);
    m.set('waistCirc', bodyStats.waistCirc);
    m.set('hipCirc', bodyStats.hipCirc);
    m.set('neckCirc', bodyStats.neckCirc);
    return m;
  }, [bodyStats]);

  const handleSubmit = () => {
    onSubmit(finalMap, category);
  };

  const keys = CATEGORY_KEYS[category] ?? [];

  const catConfig = CLOTHING_CATEGORIES.find(c => c.id === category)!;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">{catConfig.icon} 새 옷 실측치</h2>

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
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500">
        도식화에서 두 점을 클릭하여 측정값을 입력하세요.
      </p>

      <ClothingSketch
        category={category}
        measurements={measurements}
        onAddMeasurement={handleAdd}
        onDeleteMeasurement={handleDelete}
      />

      {/* Comparison table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              <th className="text-left px-3 py-2 font-medium">부위</th>
              <th className="text-right px-3 py-2 font-medium">내 체형</th>
              <th className="text-right px-3 py-2 font-medium">옷 치수</th>
              <th className="text-right px-3 py-2 font-medium">차이</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(key => {
              const label = MEASUREMENT_LABELS[key] ?? key;
              const clothVal = finalMap.get(key);
              const bodyVal = bodyMap.get(key);
              const userEntered = userMap.has(key);
              const diff = (clothVal != null && bodyVal != null) ? clothVal - bodyVal : null;

              let diffColor = 'text-gray-400';
              let diffLabel = '';
              if (diff !== null) {
                if (diff > 3) { diffColor = 'text-yellow-600'; diffLabel = '여유'; }
                else if (diff >= -1) { diffColor = 'text-green-600'; diffLabel = '적당'; }
                else { diffColor = 'text-red-600'; diffLabel = '빡빡'; }
              }

              return (
                <tr key={key} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-gray-700">{label}</td>
                  <td className="px-3 py-2 text-right text-gray-400 font-mono">
                    {bodyVal != null ? `${bodyVal.toFixed(0)}` : '—'}
                  </td>
                  <td className={`px-3 py-2 text-right font-mono font-semibold ${userEntered ? 'text-blue-600' : 'text-gray-500'}`}>
                    {clothVal != null ? `${clothVal.toFixed(0)}` : '—'}
                    {!userEntered && clothVal != null && <span className="text-xs text-gray-300 ml-1">추정</span>}
                  </td>
                  <td className={`px-3 py-2 text-right font-mono ${diffColor}`}>
                    {diff !== null ? (
                      <span>
                        {diff > 0 ? '+' : ''}{diff.toFixed(0)}
                        <span className="text-xs ml-1">{diffLabel}</span>
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400">
        <span className="text-blue-500">파란색</span> = 직접 입력 · 회색 = 체형 기반 추정
      </p>

      <button
        onClick={handleSubmit}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition cursor-pointer"
      >
        피팅 확인
      </button>
    </div>
  );
}
