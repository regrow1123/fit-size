import { useState, useCallback, useMemo } from 'react';
import ClothingSketch from './ClothingSketch';
import type { ClothingCategory, PointMeasurement, BodyMeasurements } from '../types';
import { CLOTHING_CATEGORIES } from '../data/anchorPoints';
import {
  type FitFeedback,
  type ReverseGarment,
  type ReverseMeasurement,
  estimateBodyFromGarments,
  estimatesToBodyMeasurements,
} from '../utils/reverseEstimator';

interface Props {
  onSubmit: (body: BodyMeasurements) => void;
}

const FEEDBACK_OPTIONS: { value: FitFeedback; label: string; emoji: string; color: string; bg: string }[] = [
  { value: '매우 타이트', label: '매우 타이트', emoji: '😣', color: 'text-red-700', bg: 'bg-red-100 border-red-300 hover:bg-red-200' },
  { value: '타이트', label: '타이트', emoji: '😅', color: 'text-red-500', bg: 'bg-red-50 border-red-200 hover:bg-red-100' },
  { value: '적당', label: '적당', emoji: '😊', color: 'text-green-600', bg: 'bg-green-50 border-green-300 hover:bg-green-100' },
  { value: '넉넉', label: '넉넉', emoji: '😌', color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
  { value: '매우 넉넉', label: '매우 넉넉', emoji: '🥳', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300 hover:bg-blue-200' },
];

let garmentIdCounter = 1;
let measurementIdCounter = 1;

export default function ReverseInputForm({ onSubmit }: Props) {
  const [garments, setGarments] = useState<ReverseGarment[]>([]);
  const [category, setCategory] = useState<ClothingCategory>('tshirt');
  const [sketchMeasurements, setSketchMeasurements] = useState<PointMeasurement[]>([]);
  const [currentReverseMeasurements, setCurrentReverseMeasurements] = useState<ReverseMeasurement[]>([]);
  const [pendingFeedbackIdx, setPendingFeedbackIdx] = useState<number | null>(null);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [isAddingGarment, setIsAddingGarment] = useState(true);

  const allGarments = useMemo(() => {
    // Include current in-progress garment for live estimation
    if (currentReverseMeasurements.length > 0) {
      return [...garments, { id: 'current', category, measurements: currentReverseMeasurements }];
    }
    return garments;
  }, [garments, currentReverseMeasurements, category]);

  const estimates = useMemo(() => estimateBodyFromGarments(allGarments), [allGarments]);

  const handleAddMeasurement = useCallback((startId: string, endId: string, value: number) => {
    const id = `m${measurementIdCounter++}`;
    setSketchMeasurements(prev => [...prev, { id, startPointId: startId, endPointId: endId, value }]);
    // Add to reverse measurements without feedback yet
    setCurrentReverseMeasurements(prev => [
      ...prev,
      { startPointId: startId, endPointId: endId, value, feedback: '적당' },
    ]);
    setPendingFeedbackIdx(currentReverseMeasurements.length); // index of the just-added one
  }, [currentReverseMeasurements.length]);

  const handleDeleteMeasurement = useCallback((id: string) => {
    setSketchMeasurements(prev => {
      const idx = prev.findIndex(m => m.id === id);
      if (idx >= 0) {
        setCurrentReverseMeasurements(rm => rm.filter((_, i) => i !== idx));
        if (pendingFeedbackIdx === idx) setPendingFeedbackIdx(null);
        else if (pendingFeedbackIdx !== null && pendingFeedbackIdx > idx) {
          setPendingFeedbackIdx(pendingFeedbackIdx - 1);
        }
      }
      return prev.filter(m => m.id !== id);
    });
  }, [pendingFeedbackIdx]);

  const handleFeedbackSelect = useCallback((feedback: FitFeedback) => {
    if (pendingFeedbackIdx === null) return;
    setCurrentReverseMeasurements(prev => prev.map((m, i) =>
      i === pendingFeedbackIdx ? { ...m, feedback } : m
    ));
    setPendingFeedbackIdx(null);
  }, [pendingFeedbackIdx]);

  const handleSaveGarment = () => {
    if (currentReverseMeasurements.length === 0) return;
    setGarments(prev => [...prev, {
      id: `g${garmentIdCounter++}`,
      category,
      measurements: currentReverseMeasurements,
    }]);
    setCurrentReverseMeasurements([]);
    setSketchMeasurements([]);
    setPendingFeedbackIdx(null);
    setIsAddingGarment(false);
  };

  const handleAddAnother = () => {
    setIsAddingGarment(true);
    setCurrentReverseMeasurements([]);
    setSketchMeasurements([]);
    setPendingFeedbackIdx(null);
  };

  const handleRemoveGarment = (id: string) => {
    setGarments(prev => prev.filter(g => g.id !== id));
  };

  const handleSubmit = () => {
    // Save current garment if any
    let finalGarments = garments;
    if (currentReverseMeasurements.length > 0) {
      finalGarments = [...garments, { id: `g${garmentIdCounter++}`, category, measurements: currentReverseMeasurements }];
    }
    const est = estimateBodyFromGarments(finalGarments);
    const body = estimatesToBodyMeasurements(est, gender, height, weight);
    onSubmit(body);
  };

  const hasEstimates = Object.keys(estimates).length > 0;
  const totalDataPoints = Object.values(estimates).reduce((sum, e) => sum + (e?.count ?? 0), 0);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">👔 내 옷으로 체형 추정</h2>
      <p className="text-sm text-gray-500">
        가지고 있는 옷의 실측치와 착용감을 입력하면 체형을 추정합니다.
      </p>

      {/* Basic info */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-3">
        <h3 className="text-sm font-bold text-gray-700">기본 정보</h3>
        <div className="flex gap-4">
          <label className="flex items-center gap-1 text-sm">
            <input type="radio" checked={gender === 'male'} onChange={() => setGender('male')} /> 남성
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input type="radio" checked={gender === 'female'} onChange={() => setGender('female')} /> 여성
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500">키 (cm)</label>
            <input type="number" value={height} onChange={e => setHeight(+e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500">몸무게 (kg)</label>
            <input type="number" value={weight} onChange={e => setWeight(+e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
          </div>
        </div>
      </div>

      {/* Saved garments */}
      {garments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-gray-700">📦 입력한 옷 ({garments.length}벌)</h3>
          {garments.map(g => {
            const gc = CLOTHING_CATEGORIES.find(c => c.id === g.category)!;
            return (
              <div key={g.id} className="flex items-center justify-between bg-white border rounded px-3 py-2 text-sm">
                <span>{gc.icon} {gc.label} — {g.measurements.length}개 측정</span>
                <button onClick={() => handleRemoveGarment(g.id)} className="text-red-400 hover:text-red-600 cursor-pointer text-xs">✕ 삭제</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Garment input area */}
      {isAddingGarment ? (
        <div className="border-2 border-dashed border-blue-200 rounded-lg p-3 space-y-3">
          <h3 className="text-sm font-bold text-gray-700">
            {garments.length === 0 ? '첫 번째 옷 입력' : '새 옷 추가'}
          </h3>

          {/* Category selector */}
          <div className="flex flex-wrap gap-1.5">
            {CLOTHING_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setCategory(cat.id); setSketchMeasurements([]); setCurrentReverseMeasurements([]); setPendingFeedbackIdx(null); }}
                className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition ${
                  category === cat.id ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-400">도식화에서 두 점을 클릭 → 실측치 입력 → 착용감 선택</p>

          <ClothingSketch
            category={category}
            measurements={sketchMeasurements}
            onAddMeasurement={handleAddMeasurement}
            onDeleteMeasurement={handleDeleteMeasurement}
          />

          {/* Feedback selector popup */}
          {pendingFeedbackIdx !== null && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-yellow-800">
                이 옷을 입었을 때 느낌은?
              </p>
              <div className="flex flex-wrap gap-1.5">
                {FEEDBACK_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleFeedbackSelect(opt.value)}
                    className={`px-3 py-1.5 rounded-full text-sm border cursor-pointer transition ${opt.bg} ${
                      currentReverseMeasurements[pendingFeedbackIdx]?.feedback === opt.value ? 'ring-2 ring-offset-1 ring-blue-400' : ''
                    }`}
                  >
                    {opt.emoji} {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Measurement list with feedback */}
          {currentReverseMeasurements.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-500">현재 옷 측정</h4>
              {currentReverseMeasurements.map((rm, i) => {
                const catPts = CLOTHING_CATEGORIES.find(c => c.id === category)!.anchorPoints;
                const sp = catPts.find(p => p.id === rm.startPointId);
                const ep = catPts.find(p => p.id === rm.endPointId);
                const fb = FEEDBACK_OPTIONS.find(f => f.value === rm.feedback)!;
                return (
                  <div key={i} className="flex items-center gap-2 text-xs bg-gray-50 rounded px-2 py-1">
                    <span className="flex-1">{sp?.label} → {ep?.label}: <b>{rm.value}cm</b></span>
                    <button
                      onClick={() => setPendingFeedbackIdx(i)}
                      className={`px-2 py-0.5 rounded-full border text-xs cursor-pointer ${fb.bg} ${fb.color}`}
                    >
                      {fb.emoji} {fb.label}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSaveGarment}
              disabled={currentReverseMeasurements.length === 0}
              className="flex-1 bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ✅ 이 옷 저장
            </button>
            {garments.length > 0 && (
              <button
                onClick={() => setIsAddingGarment(false)}
                className="px-4 py-2 border rounded text-sm text-gray-500 hover:bg-gray-50 cursor-pointer"
              >
                취소
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={handleAddAnother}
          className="w-full border-2 border-dashed border-gray-300 text-gray-500 py-3 rounded-lg hover:border-blue-300 hover:text-blue-500 cursor-pointer transition"
        >
          ➕ 다른 옷 추가하기
        </button>
      )}

      {/* Estimated body dimensions */}
      {hasEstimates && (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-bold text-green-800">🧍 추정된 체형</h3>
          <p className="text-xs text-green-600">데이터 포인트: {totalDataPoints}개 (많을수록 정확)</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {estimates.shoulderWidth && (
              <div className="bg-white rounded px-2 py-1">
                어깨너비: <b>{estimates.shoulderWidth.value}cm</b>
                <ConfidenceDots count={estimates.shoulderWidth.count} />
              </div>
            )}
            {estimates.chestCirc && (
              <div className="bg-white rounded px-2 py-1">
                가슴둘레: <b>{estimates.chestCirc.value}cm</b>
                <ConfidenceDots count={estimates.chestCirc.count} />
              </div>
            )}
            {estimates.waistCirc && (
              <div className="bg-white rounded px-2 py-1">
                허리둘레: <b>{estimates.waistCirc.value}cm</b>
                <ConfidenceDots count={estimates.waistCirc.count} />
              </div>
            )}
            {estimates.hipCirc && (
              <div className="bg-white rounded px-2 py-1">
                엉덩이둘레: <b>{(estimates.hipCirc.value as number)}cm</b>
                <ConfidenceDots count={estimates.hipCirc.count} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!hasEstimates}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        🧍 추정 체형으로 아바타 생성
      </button>
    </div>
  );
}

function ConfidenceDots({ count }: { count: number }) {
  const dots = Math.min(count, 5);
  return (
    <span className="ml-1 inline-flex gap-0.5" title={`${count}개 데이터`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`inline-block w-1.5 h-1.5 rounded-full ${i < dots ? 'bg-green-500' : 'bg-gray-200'}`} />
      ))}
    </span>
  );
}
