import { useState } from 'react';
import type { BodyMeasurements } from './types';
import BodyInputForm from './components/BodyInputForm';
import ClothingInputForm from './components/ClothingInputForm';
import FittingCanvas from './components/FittingCanvas';

type Step = 'body' | 'clothing' | 'result';

export default function App() {
  const [step, setStep] = useState<Step>('body');
  const [body, setBody] = useState<BodyMeasurements | null>(null);
  const [clothing, setClothing] = useState<Map<string, number> | null>(null);

  const handleBodySubmit = (b: BodyMeasurements) => {
    setBody(b);
    setStep('clothing');
  };

  const handleClothingSubmit = (m: Map<string, number>) => {
    setClothing(m);
    setStep('result');
  };

  const reset = () => {
    setStep('body');
    setBody(null);
    setClothing(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white py-4 shadow">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold">👕 FitSize</h1>
          <p className="text-blue-100 text-sm">온라인 쇼핑 옷 사이즈, 입어보고 결정하세요</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 스텝 인디케이터 */}
        <div className="flex gap-2 mb-8 text-sm">
          {(['body', 'clothing', 'result'] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`flex-1 text-center py-2 rounded ${
                step === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i + 1}. {s === 'body' ? '신체 정보' : s === 'clothing' ? '옷 실측치' : '피팅 결과'}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 왼쪽: 입력 폼 */}
          <div className="bg-white rounded-lg shadow p-6">
            {step === 'body' && (
              <BodyInputForm onSubmit={handleBodySubmit} initial={body ?? undefined} />
            )}
            {step === 'clothing' && (
              <div>
                <ClothingInputForm onSubmit={handleClothingSubmit} />
                <button
                  onClick={() => setStep('body')}
                  className="mt-3 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  ← 신체 정보 수정
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

          {/* 오른쪽: 캔버스 (body가 있을 때만) */}
          <div className="flex justify-center">
            {body ? (
              <FittingCanvas
                body={body}
                clothingMeasurements={step === 'result' ? clothing ?? undefined : undefined}
              />
            ) : (
              <div className="w-[400px] h-[700px] border rounded-lg bg-white flex items-center justify-center text-gray-400">
                신체 정보를 입력하면<br />아바타가 표시됩니다
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
