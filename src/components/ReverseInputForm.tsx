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
import { parseSizeChart, sizeRowToReverseMeasurements, type ParsedSizeChart } from '../utils/sizeChartParser';
import { useTranslation } from '../i18n';
import { ANCHOR_I18N_KEYS } from '../i18n/anchorKeys';
import { Section, SubSection } from './Section';

interface Props {
  onSubmit: (body: BodyMeasurements) => void;
}

const FEEDBACK_OPTIONS: { value: FitFeedback; labelKey: string; emoji: string; color: string; bg: string }[] = [
  { value: '매우 타이트', labelKey: 'feedback.veryTight', emoji: '😣', color: 'text-red-700', bg: 'bg-red-100 border-red-300 hover:bg-red-200' },
  { value: '타이트', labelKey: 'feedback.tight', emoji: '😅', color: 'text-red-500', bg: 'bg-red-50 border-red-200 hover:bg-red-100' },
  { value: '적당', labelKey: 'feedback.good', emoji: '😊', color: 'text-green-600', bg: 'bg-green-50 border-green-300 hover:bg-green-100' },
  { value: '넉넉', labelKey: 'feedback.loose', emoji: '😌', color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
  { value: '매우 넉넉', labelKey: 'feedback.veryLoose', emoji: '🥳', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300 hover:bg-blue-200' },
];

const CATEGORY_ICONS: Record<ClothingCategory, string> = {
  tshirt: '👕', long_sleeve: '🧥', jacket: '🧥', pants: '👖', dress: '👗',
};

let garmentIdCounter = Date.now();
let measurementIdCounter = 1;

export default function ReverseInputForm({ onSubmit }: Props) {
  const { t } = useTranslation();
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
  const [directShoulder, setDirectShoulder] = useState<string>('');
  const [directChest, setDirectChest] = useState<string>('');
  const [directWaist, setDirectWaist] = useState<string>('');
  const [directHip, setDirectHip] = useState<string>('');
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [parsedChart, setParsedChart] = useState<ParsedSizeChart | null>(null);
  const [parseError, setParseError] = useState(false);
  const [appliedSize, setAppliedSize] = useState<string | null>(null);

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

  const estimates = useMemo(() => {
    const est = estimateBodyFromGarments(allGarments);
    if (directShoulder) est.shoulderWidth = { value: +directShoulder, count: 1 };
    if (directChest) est.chestCirc = { value: +directChest, count: 1 };
    if (directWaist) est.waistCirc = { value: +directWaist, count: 1 };
    if (directHip) est.hipCirc = { value: +directHip, count: 1 };
    return est;
  }, [allGarments, directShoulder, directChest, directWaist, directHip]);

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
    const name = garmentName.trim() || `${CATEGORY_ICONS[category]} ${t('reverse.defaultGarmentName', { num: garments.length + 1 })}`;
    const newGarment = { id, category, measurements: currentReverseMeasurements, name, fromStorage: false };
    setGarments(prev => [...prev, newGarment]);

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

  const handlePasteChange = (text: string) => {
    setPasteText(text);
    setParseError(false);
    setAppliedSize(null);
    if (text.trim().length > 10) {
      const chart = parseSizeChart(text);
      if (chart) { setParsedChart(chart); setParseError(false); }
      else { setParsedChart(null); setParseError(true); }
    } else {
      setParsedChart(null);
    }
  };

  const handleSelectChartSize = (sizeLabel: string) => {
    if (!parsedChart) return;
    const row = parsedChart.rows.find(r => r.sizeLabel === sizeLabel);
    if (!row) return;
    const reverseMeasurements = sizeRowToReverseMeasurements(row, category, '적당');
    if (reverseMeasurements.length === 0) return;

    // Convert to sketch measurements + reverse measurements
    setSketchMeasurements(reverseMeasurements.map((rm) => ({
      id: `chart${measurementIdCounter++}`,
      startPointId: rm.startPointId,
      endPointId: rm.endPointId,
      value: rm.value,
    })));
    setCurrentReverseMeasurements(reverseMeasurements);
    setPendingFeedbackIdx(null);
    setAppliedSize(sizeLabel);
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

    if (directShoulder) body.shoulderWidth = +directShoulder;
    if (directChest) body.chestCirc = +directChest;
    if (directWaist) body.waistCirc = +directWaist;
    if (directHip) body.hipCirc = +directHip;

    saveProfile({ gender, height, weight, bodyMeasurements: body, updatedAt: Date.now() });

    onSubmit(body);
  };

  // Always allow submit — Size Korea stats provide baseline from height/weight alone
  const hasEstimates = true;

  /** Translate anchor point label by its ID */
  const tAnchor = (pointId: string, fallbackLabel: string) => {
    const key = ANCHOR_I18N_KEYS[pointId];
    return key ? t(key) : fallbackLabel;
  };

  return (
    <div className="space-y-5">
      {/* ── SECTION 1: 기본 정보 ── */}
      <Section num={1} title={t('reverse.basicInfo')} tag={t('reverse.tagRequired')}>
        <div className="flex gap-4">
          <label className="flex items-center gap-1 text-sm">
            <input type="radio" checked={gender === 'male'} onChange={() => setGender('male')} /> {t('body.gender.male')}
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input type="radio" checked={gender === 'female'} onChange={() => setGender('female')} /> {t('body.gender.female')}
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500">{t('body.height')}</label>
            <input type="number" value={height} onChange={e => setHeight(+e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500">{t('body.weight')}</label>
            <input type="number" value={weight} onChange={e => setWeight(+e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
          </div>
        </div>
      </Section>

      {/* ── SECTION 2: 체형 보정 (선택) ── */}
      <Section num={2} title={t('reverse.refineTitle')} tag={t('reverse.tagOptional')} tagColor="gray" desc={t('reverse.refineDesc')} collapsible defaultOpen={garments.length > 0 || !!directShoulder || !!directChest || !!directWaist || !!directHip}>
        {/* 2-1: Direct measurement inputs */}
        <SubSection num="2-1" title={t('reverse.directInput')} desc={t('reverse.directInputDesc')}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500">{t('reverse.shoulder')}</label>
              <input type="number" value={directShoulder} placeholder={t('reverse.autoEstimate')} onChange={e => setDirectShoulder(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500">{t('reverse.chest')}</label>
              <input type="number" value={directChest} placeholder={t('reverse.autoEstimate')} onChange={e => setDirectChest(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500">{t('reverse.waist')}</label>
              <input type="number" value={directWaist} placeholder={t('reverse.autoEstimate')} onChange={e => setDirectWaist(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500">{t('reverse.hip')}</label>
              <input type="number" value={directHip} placeholder={t('reverse.autoEstimate')} onChange={e => setDirectHip(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
            </div>
          </div>
        </SubSection>

        {/* 2-2: Garment-based estimation */}
        <SubSection num="2-2" title={t('reverse.garmentSection')} desc={t('reverse.garmentSectionDesc')}>

      {/* Saved garments */}
      {garments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-700">{t('reverse.wardrobe', { count: garments.length })}</h3>
            <button
              onClick={handleClearAll}
              className="text-xs text-red-400 hover:text-red-600 cursor-pointer"
            >
              {t('reverse.clearAll')}
            </button>
          </div>
          {garments.map(g => {
            const gc = CLOTHING_CATEGORIES.find(c => c.id === g.category)!;
            const isEditing = editingNameId === g.id;
            return (
              <div key={g.id} className={`flex items-center gap-2 border rounded px-3 py-2 text-sm ${g.fromStorage ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                {g.fromStorage && <span className="text-xs text-blue-400" title={t('reverse.saved')}>💾</span>}
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
                    title={t('reverse.clickToEditName')}
                  >
                    {g.name || `${gc.label}`} <span className="text-gray-400 text-xs">{t('reverse.measurementCount', { count: g.measurements.length })}</span>
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
            {garments.length === 0 ? t('reverse.firstGarment') : t('reverse.addGarment')}
          </h3>

          {/* Garment name input */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('reverse.garmentName')}</label>
            <input
              type="text"
              value={garmentName}
              onChange={e => setGarmentName(e.target.value)}
              placeholder={t('reverse.garmentNamePlaceholder')}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </div>

          {/* Category selector */}
          <div className="flex flex-wrap gap-1.5">
            {CLOTHING_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setCategory(cat.id); setSketchMeasurements([]); setCurrentReverseMeasurements([]); setPendingFeedbackIdx(null); setAppliedSize(null); setParsedChart(null); setPasteText(''); setParseError(false); }}
                className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition ${
                  category === cat.id ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                          onClick={() => handleSelectChartSize(row.sizeLabel)}
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

          <p className="text-xs text-gray-400">{t('reverse.sketchGuide')}</p>

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
                {t('reverse.feedbackQuestion')}
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
                    {opt.emoji} {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Measurement list with feedback */}
          {currentReverseMeasurements.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-500">{t('reverse.currentMeasurements')}</h4>
              {currentReverseMeasurements.map((rm, i) => {
                const catPts = CLOTHING_CATEGORIES.find(c => c.id === category)!.anchorPoints;
                const sp = catPts.find(p => p.id === rm.startPointId);
                const ep = catPts.find(p => p.id === rm.endPointId);
                const fb = FEEDBACK_OPTIONS.find(f => f.value === rm.feedback)!;
                return (
                  <div key={i} className="flex items-center gap-2 text-xs bg-gray-50 rounded px-2 py-1">
                    <span className="flex-1">{sp ? tAnchor(sp.id, sp.label) : ''} → {ep ? tAnchor(ep.id, ep.label) : ''}: <b>{rm.value}cm</b></span>
                    <button
                      onClick={() => setPendingFeedbackIdx(i)}
                      className={`px-2 py-0.5 rounded-full border text-xs cursor-pointer ${fb.bg} ${fb.color}`}
                    >
                      {fb.emoji} {t(fb.labelKey)}
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
              {t('reverse.saveGarment')}
            </button>
            {garments.length > 0 && (
              <button
                onClick={() => setIsAddingGarment(false)}
                className="px-4 py-2 border rounded text-sm text-gray-500 hover:bg-gray-50 cursor-pointer"
              >
                {t('reverse.cancel')}
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={handleAddAnother}
          className="w-full border-2 border-dashed border-gray-300 text-gray-500 py-3 rounded-lg hover:border-blue-300 hover:text-blue-500 cursor-pointer transition"
        >
          {t('reverse.addAnother')}
        </button>
      )}
        </SubSection>
      </Section>

      {/* ── SECTION 3: 추정 결과 + 제출 ── */}
      <Section num={3} title={t('reverse.estimatedStats')} tag={t('reverse.tagResult')} tagColor="green">
        <BodyStatsPanel
          gender={gender}
          height={height}
          weight={weight}
          garmentEstimates={estimates}
          totalDataPoints={Object.values(estimates).reduce((sum, e) => sum + (e?.count ?? 0), 0)}
        />
        <button
          onClick={handleSubmit}
          disabled={!hasEstimates}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition mt-3"
        >
          {t('reverse.generateAvatar')}
        </button>
      </Section>
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

function BodyStatsPanel({ gender, height, weight, garmentEstimates }: BodyStatsPanelProps) {
  const { t } = useTranslation();
  const bodyFromGarments = useMemo(() => {
    return estimatesToBodyMeasurements(garmentEstimates, gender, height, weight);
  }, [garmentEstimates, gender, height, weight]);

  const fullStats = useMemo(() => {
    return estimateBodyDimensions(
      gender, height, weight,
      bodyFromGarments.shoulderWidth,
      bodyFromGarments.chestCirc,
      bodyFromGarments.waistCirc,
      bodyFromGarments.hipCirc,
    );
  }, [gender, height, weight, bodyFromGarments]);

  const items: { key: string; labelKey: string; value: number; fromGarment: boolean }[] = [
    { key: 'shoulderWidth', labelKey: 'stats.shoulderWidth', value: fullStats.shoulderWidth, fromGarment: !!garmentEstimates.shoulderWidth },
    { key: 'chestCirc', labelKey: 'stats.chestCirc', value: fullStats.chestCirc, fromGarment: !!garmentEstimates.chestCirc },
    { key: 'waistCirc', labelKey: 'stats.waistCirc', value: fullStats.waistCirc, fromGarment: !!garmentEstimates.waistCirc },
    { key: 'hipCirc', labelKey: 'stats.hipCirc', value: fullStats.hipCirc, fromGarment: !!garmentEstimates.hipCirc },
    { key: 'armLength', labelKey: 'stats.armLength', value: fullStats.armLength, fromGarment: false },
    { key: 'neckCirc', labelKey: 'stats.neckCirc', value: fullStats.neckCirc, fromGarment: false },
    { key: 'torsoLength', labelKey: 'stats.torsoLength', value: fullStats.torsoLength, fromGarment: false },
  ];

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
      {items.map(item => (
        <div key={item.key} className="flex items-center justify-between text-sm py-1">
          <span className="text-gray-500">{t(item.labelKey)}</span>
          <span className={`font-mono font-semibold ${item.fromGarment ? 'text-blue-600' : 'text-gray-800'}`}>
            {item.value.toFixed(1)}
            <span className="text-xs text-gray-400 ml-0.5">cm</span>
          </span>
        </div>
      ))}
    </div>
  );
}
