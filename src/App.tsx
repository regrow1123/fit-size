import { useState } from 'react';
import type { BodyMeasurements, ClothingCategory } from './types';
import BodyInputForm from './components/BodyInputForm';
import ClothingInputForm from './components/ClothingInputForm';
import FittingCanvas from './components/FittingCanvas';
import ReverseInputForm from './components/ReverseInputForm';

type Mode = 'direct' | 'reverse';
type Step = 'mode' | 'body' | 'clothing' | 'result';

const CATEGORY_ICONS: Record<ClothingCategory, string> = {
  tshirt: '👕', long_sleeve: '🧥', jacket: '🧥', pants: '👖', dress: '👗',
};

export default function App() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [step, setStep] = useState<Step>('mode');
  const [body, setBody] = useState<BodyMeasurements | null>(null);
  const [clothing, setClothing] = useState<Map<string, number> | null>(null);
  const [category, setCategory] = useState<ClothingCategory>('tshirt');

  const handleModeSelect = (m: Mode) => {
    setMode(m);
    setStep(m === 'direct' ? 'body' : 'body'); // 'body' step shows either BodyInputForm or ReverseInputForm
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
    setStep('mode');
    setMode(null);
    setBody(null);
    setClothing(null);
  };

  const stepLabels = mode === 'reverse'
    ? ['체형 추정', '새 옷 실측치', '피팅 결과']
    : ['신체 정보', '옷 실측치', '피팅 결과'];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white py-4 shadow">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold">{CATEGORY_ICONS[category]} FitSize</h1>
          <p className="text-blue-100 text-sm">온라인 쇼핑 옷 사이즈, 입어보고 결정하세요</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Step indicator (hidden on mode select) */}
        {step !== 'mode' && (
          <div className="flex gap-2 mb-8 text-sm">
            {(['body', 'clothing', 'result'] as Step[]).map((s, i) => (
              <div
                key={s}
                className={`flex-1 text-center py-2 rounded ${
                  step === s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i + 1}. {stepLabels[i]}
              </div>
            ))}
          </div>
        )}

        {/* Mode selector */}
        {step === 'mode' && (
          <div className="max-w-lg mx-auto space-y-6">
            <h2 className="text-xl font-bold text-center text-gray-800">어떻게 시작할까요?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleModeSelect('direct')}
                className="bg-white border-2 border-gray-200 hover:border-blue-400 rounded-xl p-6 text-left space-y-2 cursor-pointer transition shadow-sm hover:shadow-md"
              >
                <div className="text-3xl">📏</div>
                <div className="font-bold text-gray-800">직접 입력</div>
                <p className="text-sm text-gray-500">신체 치수를 알고 있어요</p>
              </button>
              <button
                onClick={() => handleModeSelect('reverse')}
                className="bg-white border-2 border-gray-200 hover:border-green-400 rounded-xl p-6 text-left space-y-2 cursor-pointer transition shadow-sm hover:shadow-md"
              >
                <div className="text-3xl">👔</div>
                <div className="font-bold text-gray-800">내 옷으로 추정</div>
                <p className="text-sm text-gray-500">가진 옷의 실측치 + 착용감으로 체형 추정</p>
              </button>
            </div>
          </div>
        )}

        {step !== 'mode' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow p-6">
              {step === 'body' && mode === 'direct' && (
                <BodyInputForm onSubmit={handleBodySubmit} initial={body ?? undefined} />
              )}
              {step === 'body' && mode === 'reverse' && (
                <ReverseInputForm onSubmit={handleBodySubmit} />
              )}
              {step === 'body' && (
                <button
                  onClick={reset}
                  className="mt-3 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  ← 모드 선택으로
                </button>
              )}
              {step === 'clothing' && (
                <div>
                  <ClothingInputForm onSubmit={handleClothingSubmit} />
                  <button
                    onClick={() => setStep('body')}
                    className="mt-3 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    ← {mode === 'reverse' ? '체형 추정 수정' : '신체 정보 수정'}
                  </button>
                </div>
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
                <div className="w-[400px] h-[700px] border rounded-lg bg-white flex items-center justify-center text-gray-400">
                  {mode === 'reverse' ? '옷 정보를 입력하면' : '신체 정보를 입력하면'}<br />아바타가 표시됩니다
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
