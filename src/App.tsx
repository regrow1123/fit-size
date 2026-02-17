import { useState, useEffect } from 'react';
import type { BodyMeasurements, ClothingCategory } from './types';
import ClothingInputForm from './components/ClothingInputForm';
import FittingCanvas from './components/FittingCanvas';
import ReverseInputForm from './components/ReverseInputForm';
import ProductRecommendations from './components/ProductRecommendations';
import { hasStoredProfile, loadWardrobe, exportWardrobe, importWardrobe } from './utils/storage';
import { estimateBodyFromGarments, estimatesToBodyMeasurements } from './utils/reverseEstimator';

type Step = 'body' | 'clothing' | 'result';

const CATEGORY_ICONS: Record<ClothingCategory, string> = {
  tshirt: '👕', long_sleeve: '🧥', jacket: '🧥', pants: '👖', dress: '👗',
};

export default function App() {
  const [step, setStep] = useState<Step>('body');
  const [body, setBody] = useState<BodyMeasurements | null>(null);
  const [clothing, setClothing] = useState<Map<string, number> | null>(null);
  const [category, setCategory] = useState<ClothingCategory>('tshirt');
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  useEffect(() => {
    if (hasStoredProfile()) {
      setShowWelcomeBack(true);
    }
  }, []);

  const handleLoadProfileDirect = () => {
    const data = loadWardrobe();
    if (data.profile?.bodyMeasurements) {
      setBody(data.profile.bodyMeasurements);
      setStep('clothing');
    } else if (data.garments.length > 0 && data.profile) {
      const garments = data.garments.map(g => ({ id: g.id, category: g.category, measurements: g.measurements }));
      const estimates = estimateBodyFromGarments(garments);
      const bodyM = estimatesToBodyMeasurements(estimates, data.profile.gender, data.profile.height, data.profile.weight);
      setBody(bodyM);
      setStep('clothing');
    }
    setShowWelcomeBack(false);
  };

  const handleBodySubmit = (b: BodyMeasurements) => {
    setBody(b);
    setStep('clothing');
  };

  const handleClothingSubmit = (m: Map<string, number>, cat: ClothingCategory) => {
    setClothing(m);
    setCategory(cat);
    setStep('result');
  };

  const reset = () => {
    setStep('body');
    setBody(null);
    setClothing(null);
  };

  const stepLabels = ['체형 설정', '새 옷 실측치', '피팅 결과'];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white py-4 shadow">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold">{CATEGORY_ICONS[category]} FitSize</h1>
          <p className="text-blue-100 text-sm">온라인 쇼핑 옷 사이즈, 입어보고 결정하세요</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        {/* Welcome back banner */}
        {showWelcomeBack && step === 'body' && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-300 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-bold text-green-800 mb-1">👋 다시 오셨네요!</h2>
            <p className="text-sm text-green-700 mb-3">저장된 프로필이 있습니다. 바로 새 옷 피팅을 시작할 수 있어요.</p>
            <div className="flex gap-2">
              <button
                onClick={handleLoadProfileDirect}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 cursor-pointer transition"
              >
                ✅ 저장된 프로필로 시작
              </button>
              <button
                onClick={() => setShowWelcomeBack(false)}
                className="border border-green-400 text-green-700 px-4 py-2 rounded-lg text-sm hover:bg-green-50 cursor-pointer transition"
              >
                체형 다시 설정
              </button>
            </div>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex gap-2 mb-8 text-sm">
          {(['body', 'clothing', 'result'] as Step[]).map((s, i) => {
            const stepOrder: Step[] = ['body', 'clothing', 'result'];
            const currentIdx = stepOrder.indexOf(step);
            const targetIdx = i;
            const canGo = targetIdx <= currentIdx
              || (targetIdx === 1 && body !== null)
              || (targetIdx === 2 && body !== null && clothing !== null);
            const isCurrent = step === s;

            return (
              <button
                key={s}
                disabled={!canGo}
                onClick={() => { if (canGo && !isCurrent) setStep(s); }}
                className={`flex-1 text-center py-2 rounded transition cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600 text-white font-bold'
                    : canGo
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-gray-200 text-gray-400 !cursor-not-allowed'
                }`}
              >
                {i + 1}. {stepLabels[i]}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            {step === 'body' && (
              <>
                <ReverseInputForm onSubmit={handleBodySubmit} />

                {/* Export / Import */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 text-center mb-3">다른 기기에서도 사용하고 싶다면?</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={exportWardrobe}
                      className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 cursor-pointer transition"
                    >
                      📤 내보내기
                    </button>
                    <label className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 cursor-pointer transition">
                      📥 불러오기
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const result = await importWardrobe(file);
                            setImportMsg(`✅ 옷 ${result.garments}벌${result.hasProfile ? ', 프로필 포함' : ''}`);
                            setShowWelcomeBack(true);
                          } catch (err: unknown) {
                            setImportMsg(`❌ ${err instanceof Error ? err.message : '실패'}`);
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                  {importMsg && <p className="text-sm text-center mt-2 text-gray-700">{importMsg}</p>}
                </div>
              </>
            )}
            {step === 'clothing' && (
              <ClothingInputForm onSubmit={handleClothingSubmit} />
            )}
            {step === 'result' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">✅ 피팅 결과</h2>
                <p className="text-gray-600 text-sm">
                  캔버스에서 아바타에 옷이 어떻게 맞는지 확인하세요.
                  파란색 영역이 옷이고, 피부색이 아바타입니다.
                </p>
                <div className="text-sm space-y-1 text-gray-500">
                  <p>🟢 <b>적당</b>: 차이 -1cm ~ +3cm</p>
                  <p>🟡 <b>여유</b>: +3cm 이상</p>
                  <p>🔴 <b>빡빡</b>: -1cm 이하</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep('clothing')}
                    className="flex-1 border border-blue-600 text-blue-600 py-2 rounded hover:bg-blue-50 cursor-pointer"
                  >
                    실측치 수정
                  </button>
                  <button
                    onClick={reset}
                    className="flex-1 border border-gray-400 text-gray-600 py-2 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    처음부터
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            {body ? (
              <FittingCanvas
                body={body}
                clothingMeasurements={step === 'result' ? clothing ?? undefined : undefined}
                category={category}
              />
            ) : (
              <div className="w-full max-w-[400px] aspect-[4/7] border rounded-lg bg-white flex items-center justify-center text-gray-400 text-center px-4">
                체형을 설정하면<br />아바타가 표시됩니다
              </div>
            )}
          </div>
        </div>

        {step === 'result' && (
          <ProductRecommendations category={category} />
        )}
      </main>
    </div>
  );
}
