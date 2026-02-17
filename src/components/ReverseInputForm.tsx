import { useState, useCallback, useMemo, useEffect } from 'react';
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
import { estimateBodyDimensions } from '../data/bodyStats';
import {
  loadWardrobe,
  saveGarment as persistGarment,
  updateGarmentName,
  deleteGarment as removeGarmentFromStorage,
  clearAllGarments,
  saveProfile,
} from '../utils/storage';

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

const CATEGORY_ICONS: Record<ClothingCategory, string> = {
  tshirt: '👕', long_sleeve: '🧥', jacket: '🧥', pants: '👖', dress: '👗',
};

let garmentIdCounter = Date.now();
let measurementIdCounter = 1;

export default function ReverseInputForm({ onSubmit }: Props) {
  const [garments, setGarments] = useState<(ReverseGarment & { name?: string; fromStorage?: boolean })[]>([]);
  const [category, setCategory] = useState<ClothingCategory>('tshirt');
  const [sketchMeasurements, setSketchMeasurements] = useState<PointMeasurement[]>([]);
  const [currentReverseMeasurements, setCurrentReverseMeasurements] = useState<ReverseMeasurement[]>([]);
  const [pendingFeedbackIdx, setPendingFeedbackIdx] = useState<number | null>(null);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [isAddingGarment, setIsAddingGarment] = useState(true);
  const [garmentName, setGarmentName] = useState('');
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    const data = loadWardrobe();
    if (data.garments.length > 0) {
      setGarments(data.garments.map(g => ({
        id: g.id,
        category: g.category,
        measurements: g.measurements,
        name: g.name,
        fromStorage: true,
      })));
      setIsAddingGarment(false);
    }
    if (data.profile) {
      setGender(data.profile.gender);
      setHeight(data.profile.height);
      setWeight(data.profile.weight);
    }
  }, []);

  const allGarments = useMemo(() => {
    if (currentReverseMeasurements.length > 0) {
      return [...garments, { id: 'current', category, measurements: currentReverseMeasurements }];
    }
    return garments;
  }, [garments, currentReverseMeasurements, category]);

  const estimates = useMemo(() => estimateBodyFromGarments(allGarments), [allGarments]);

  const handleAddMeasurement = useCallback((startId: string, endId: string, value: number) => {
    const id = `m${measurementIdCounter++}`;
    setSketchMeasurements(prev => [...prev, { id, startPointId: startId, endPointId: endId, value }]);
    setCurrentReverseMeasurements(prev => [
      ...prev,
      { startPointId: startId, endPointId: endId, value, feedback: '적당' },
    ]);
    setPendingFeedbackIdx(currentReverseMeasurements.length);
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
    const id = `g${garmentIdCounter++}`;
    const name = garmentName.trim() || `${CATEGORY_ICONS[category]} 옷 ${garments.length + 1}`;
    const newGarment = { id, category, measurements: currentReverseMeasurements, name, fromStorage: false };
    setGarments(prev => [...prev, newGarment]);

    // Persist to localStorage
    persistGarment({
      id,
      name,
      category,
      measurements: currentReverseMeasurements,
      savedAt: Date.now(),
    });
    saveProfile({ gender, height, weight, updatedAt: Date.now() });

    setCurrentReverseMeasurements([]);
    setSketchMeasurements([]);
    setPendingFeedbackIdx(null);
    setGarmentName('');
    setIsAddingGarment(false);
  };

  const handleAddAnother = () => {
    setIsAddingGarment(true);
    setCurrentReverseMeasurements([]);
    setSketchMeasurements([]);
    setPendingFeedbackIdx(null);
    setGarmentName('');
  };

  const handleRemoveGarment = (id: string) => {
    setGarments(prev => prev.filter(g => g.id !== id));
    removeGarmentFromStorage(id);
  };

  const handleClearAll = () => {
    setGarments([]);
    clearAllGarments();
    setIsAddingGarment(true);
  };

  const handleEditName = (id: string, currentName: string) => {
    setEditingNameId(id);
    setEditingNameValue(currentName);
  };

  const handleSaveName = () => {
    if (!editingNameId) return;
    const newName = editingNameValue.trim();
    if (newName) {
      setGarments(prev => prev.map(g => g.id === editingNameId ? { ...g, name: newName } : g));
      updateGarmentName(editingNameId, newName);
    }
    setEditingNameId(null);
  };

  const handleSubmit = () => {
    let finalGarments = garments;
    if (currentReverseMeasurements.length > 0) {
      finalGarments = [...garments, { id: `g${garmentIdCounter++}`, category, measurements: currentReverseMeasurements }];
    }
    const est = estimateBodyFromGarments(finalGarments);
    const body = estimatesToBodyMeasurements(est, gender, height, weight);

    // Save profile with body measurements
    saveProfile({ gender, height, weight, bodyMeasurements: body, updatedAt: Date.now() });

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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700">📦 내 옷장 ({garments.length}벌)</h3>
            <button
              onClick={handleClearAll}
              className="text-xs text-red-400 hover:text-red-600 cursor-pointer"
            >
              🗑 전체 삭제
            </button>
          </div>
          {garments.map(g => {
            const gc = CLOTHING_CATEGORIES.find(c => c.id === g.category)!;
            const isEditing = editingNameId === g.id;
            return (
              <div key={g.id} className={`flex items-center gap-2 border rounded px-3 py-2 text-sm ${g.fromStorage ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                {g.fromStorage && <span className="text-xs text-blue-400" title="저장됨">💾</span>}
                <span className="text-lg">{gc.icon}</span>
                {isEditing ? (
                  <input
                    autoFocus
                    value={editingNameValue}
                    onChange={e => setEditingNameValue(e.target.value)}
                    onBlur={handleSaveName}
                    onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                    className="flex-1 border rounded px-1 py-0.5 text-sm"
                  />
                ) : (
                  <span
                    className="flex-1 cursor-pointer hover:text-blue-600"
                    onClick={() => handleEditName(g.id, g.name || '')}
                    title="클릭하여 이름 수정"
                  >
                    {g.name || `${gc.label}`} <span className="text-gray-400 text-xs">({g.measurements.length}개 측정)</span>
                  </span>
                )}
                <button onClick={() => handleRemoveGarment(g.id)} className="text-red-400 hover:text-red-600 cursor-pointer text-xs">✕</button>
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

          {/* Garment name input */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">옷 이름 (선택)</label>
            <input
              type="text"
              value={garmentName}
              onChange={e => setGarmentName(e.target.value)}
              placeholder="예: 무신사 흰 티셔츠 L"
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </div>

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

      {/* Estimated body dimensions — full stats panel */}
      <BodyStatsPanel
        gender={gender}
        height={height}
        weight={weight}
        garmentEstimates={estimates}
        totalDataPoints={totalDataPoints}
      />

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

interface BodyStatsPanelProps {
  gender: 'male' | 'female';
  height: number;
  weight: number;
  garmentEstimates: ReturnType<typeof estimateBodyFromGarments>;
  totalDataPoints: number;
}

function BodyStatsPanel({ gender, height, weight, garmentEstimates, totalDataPoints }: BodyStatsPanelProps) {
  // Build BodyMeasurements from garment estimates
  const bodyFromGarments = useMemo(() => {
    return estimatesToBodyMeasurements(garmentEstimates, gender, height, weight);
  }, [garmentEstimates, gender, height, weight]);

  // Full estimation with Size Korea + deviation propagation
  const fullStats = useMemo(() => {
    return estimateBodyDimensions(
      gender, height, weight,
      bodyFromGarments.shoulderWidth,
      bodyFromGarments.chestCirc,
      bodyFromGarments.waistCirc,
      bodyFromGarments.hipCirc,
    );
  }, [gender, height, weight, bodyFromGarments]);

  const items: { key: string; label: string; icon: string; value: number; garmentData?: { value: number; count: number } }[] = [
    { key: 'shoulderWidth', label: '어깨너비', icon: '↔️', value: fullStats.shoulderWidth, garmentData: garmentEstimates.shoulderWidth },
    { key: 'chestCirc', label: '가슴둘레', icon: '📏', value: fullStats.chestCirc, garmentData: garmentEstimates.chestCirc },
    { key: 'waistCirc', label: '허리둘레', icon: '📐', value: fullStats.waistCirc, garmentData: garmentEstimates.waistCirc },
    { key: 'hipCirc', label: '엉덩이둘레', icon: '🍑', value: fullStats.hipCirc, garmentData: garmentEstimates.hipCirc },
    { key: 'armLength', label: '팔길이', icon: '💪', value: fullStats.armLength },
    { key: 'neckCirc', label: '목둘레', icon: '👔', value: fullStats.neckCirc },
    { key: 'torsoLength', label: '상체길이', icon: '📐', value: fullStats.torsoLength },
  ];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-700">📊 추정 체형 수치</h3>
        {totalDataPoints > 0 && (
          <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
            옷 데이터 {totalDataPoints}개 반영
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {items.map(item => {
          const fromGarment = !!item.garmentData;
          return (
            <div key={item.key} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 text-sm">
              <span className="w-5 text-center">{item.icon}</span>
              <span className="flex-1 text-gray-600">{item.label}</span>
              <span className={`font-mono font-semibold ${fromGarment ? 'text-blue-600' : 'text-gray-800'}`}>
                {item.value.toFixed(1)}
                <span className="text-xs text-gray-400 ml-0.5">cm</span>
              </span>
              {fromGarment && item.garmentData && (
                <span className="flex items-center gap-1">
                  <span className="text-xs text-blue-400" title="옷 데이터에서 추정">👔</span>
                  <ConfidenceDots count={item.garmentData.count} />
                </span>
              )}
              {!fromGarment && (
                <span className="text-xs text-gray-300" title="Size Korea 통계 기반">통계</span>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400">
        👔 옷 데이터 기반 &nbsp;|&nbsp; <span className="text-gray-300">통계</span> Size Korea 추정
        {totalDataPoints > 0 && ' + 편차 보정'}
      </p>
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
