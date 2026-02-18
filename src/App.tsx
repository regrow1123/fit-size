import { useState, useEffect } from 'react';
import type { BodyMeasurements, ClothingCategory } from './types';
import ClothingInputForm from './components/ClothingInputForm';
import FittingCanvas from './components/FittingCanvas';
import FittingResult from './components/FittingResult';
// import FittingPixi from './components/FittingPixi';
import ReverseInputForm from './components/ReverseInputForm';
import ProductRecommendations from './components/ProductRecommendations';
// import FitResultPanel from './components/FitResultPanel';
import { importWardrobeFromText, exportWardrobeText, subscribe, loadWardrobe } from './utils/storage';
import { useTranslation, type Locale } from './i18n';
import { useAuth, saveToCloud, loadFromCloud } from './firebase';

type Step = 'body' | 'clothing' | 'result';

const CATEGORY_ICONS: Record<ClothingCategory, string> = {
  tshirt: '👕',
};

const LOCALES: Locale[] = ['ko', 'en', 'ja'];

const STEP_ICONS = ['🧍', '📐', '✅'];

function StepIndicator({
  step,
  body,
  clothing,
  onStepClick,
}: {
  step: Step;
  body: BodyMeasurements | null;
  clothing: Map<string, number> | null;
  onStepClick: (s: Step) => void;
}) {
  const { t } = useTranslation();
  const steps: { key: Step; label: string; desc: string }[] = [
    { key: 'body', label: t('app.step.body'), desc: t('app.step.bodyDesc') },
    { key: 'clothing', label: t('app.step.clothing'), desc: t('app.step.clothingDesc') },
    { key: 'result', label: t('app.step.result'), desc: t('app.step.resultDesc') },
  ];
  const stepOrder: Step[] = ['body', 'clothing', 'result'];
  const currentIdx = stepOrder.indexOf(step);

  return (
    <div className="mb-8">
      <div className="flex items-start">
        {steps.map((s, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          const canGo = i <= currentIdx
            || (i === 1 && body !== null)
            || (i === 2 && body !== null && clothing !== null);

          return (
            <div key={s.key} className="flex-1 flex flex-col items-center relative">
              {/* Connecting line */}
              {i > 0 && (
                <div className={`absolute top-5 right-1/2 w-full h-0.5 -translate-y-1/2 ${
                  i <= currentIdx ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
              )}

              {/* Circle */}
              <button
                disabled={!canGo}
                onClick={() => canGo && onStepClick(s.key)}
                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-lg transition cursor-pointer
                  ${isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-200 shadow-lg'
                    : isDone
                      ? 'bg-green-500 text-white shadow'
                      : canGo
                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        : 'bg-gray-200 text-gray-400 !cursor-not-allowed'
                  }`}
              >
                {isDone ? '✓' : STEP_ICONS[i]}
              </button>

              {/* Label */}
              <span className={`mt-2 text-xs font-bold text-center ${
                isCurrent ? 'text-blue-700' : isDone ? 'text-green-600' : 'text-gray-400'
              }`}>
                {s.label}
              </span>

              {/* Description (current step only) */}
              {isCurrent && (
                <span className="mt-0.5 text-[11px] text-gray-400 text-center max-w-[100px]">
                  {s.desc}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const { t, locale, setLocale } = useTranslation();
  const { user, loading: authLoading, signInWithGoogle, signOut, isConfigured: authConfigured } = useAuth();
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [step, setStep] = useState<Step>('body');
  const [body, setBody] = useState<BodyMeasurements | null>(() => {
    const w = loadWardrobe();
    return w.profile?.bodyMeasurements ?? null;
  });
  const [clothing, setClothing] = useState<Map<string, number> | null>(null);
  const [category, setCategory] = useState<ClothingCategory>('tshirt');
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [showExportText, setShowExportText] = useState(false);
  const [showImportText, setShowImportText] = useState(false);
  const [importTextValue, setImportTextValue] = useState('');
  // Force re-render when in-memory store changes
  const [, setTick] = useState(0);

  // Subscribe to in-memory store changes
  useEffect(() => subscribe(() => setTick(t => t + 1)), []);

  // Auto-save to cloud on store changes
  useEffect(() => {
    if (!user || !cloudLoaded) return;
    return subscribe(() => {
      saveToCloud(user).catch(() => {});
    });
  }, [user, cloudLoaded]);

  // 로그인 시 클라우드에서 로드 → 저장된 프로필을 body state에 반영
  useEffect(() => {
    if (!user || cloudLoaded) return;
    (async () => {
      const data = await loadFromCloud(user);
      setCloudLoaded(true);
      if (data?.profile?.bodyMeasurements) {
        setBody(data.profile.bodyMeasurements);
      }
    })();
  }, [user, cloudLoaded]);

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

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white py-4 shadow">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{CATEGORY_ICONS[category]} FitSize</h1>
            <p className="text-blue-100 text-sm">{t('app.subtitle')}</p>
          </div>
          <div className="flex items-center gap-1 flex-wrap justify-end">
            {/* Language selector */}
            <div className="flex gap-0.5">
              {LOCALES.map(l => {
                const flag: Record<string, string> = { ko: '🇰🇷', en: '🇺🇸', ja: '🇯🇵' };
                return (
                  <button
                    key={l}
                    onClick={() => setLocale(l)}
                    className={`w-7 h-7 rounded-full text-base flex items-center justify-center cursor-pointer transition ${
                      locale === l ? 'bg-white/25 ring-2 ring-white' : 'hover:bg-blue-500'
                    }`}
                    title={t(`lang.${l}`)}
                  >
                    {flag[l]}
                  </button>
                );
              })}
            </div>
            {/* Auth button */}
            {authConfigured && !authLoading && (
              user ? (
                <button
                  onClick={signOut}
                  className="flex items-center gap-1 text-xs text-blue-100 hover:text-white cursor-pointer ml-1"
                >
                  <img
                    src={user.photoURL ?? undefined}
                    alt=""
                    className="w-6 h-6 rounded-full border border-white/50"
                  />
                  {t('auth.logout')}
                </button>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1 rounded-full cursor-pointer transition ml-1"
                >
                  ☁️ <span className="hidden sm:inline">{t('auth.login')}</span>
                </button>
              )
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        {/* Step indicator */}
        <StepIndicator step={step} body={body} clothing={clothing} onStepClick={setStep} />

        {step !== 'result' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            {step === 'body' && (
              <>
                <ReverseInputForm onSubmit={handleBodySubmit} />

                {/* Cloud sync status / Export / Import */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 text-center mb-3">
                    {user
                      ? `☁️ ${t('auth.cloudSynced')}`
                      : authConfigured
                        ? t('auth.loginPrompt')
                        : t('app.importPrompt')}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => { setShowExportText(!showExportText); setShowImportText(false); }}
                      className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 cursor-pointer transition"
                    >
                      {t('app.export')}
                    </button>
                    <button
                      onClick={() => { setShowImportText(!showImportText); setShowExportText(false); setImportMsg(null); setImportTextValue(''); }}
                      className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 cursor-pointer transition"
                    >
                      {t('app.import')}
                    </button>
                  </div>

                  {showExportText && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-500">{t('app.exportCopyGuide')}</p>
                      <textarea
                        readOnly
                        value={exportWardrobeText()}
                        onFocus={e => e.target.select()}
                        className="w-full border rounded-lg px-3 py-2 text-xs font-mono h-24 resize-none bg-gray-50"
                      />
                    </div>
                  )}

                  {showImportText && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-500">{t('app.importPasteGuide')}</p>
                      <textarea
                        value={importTextValue}
                        onChange={e => setImportTextValue(e.target.value)}
                        placeholder={t('app.importPastePlaceholder')}
                        className="w-full border rounded-lg px-3 py-2 text-xs font-mono h-24 resize-none"
                      />
                      <button
                        onClick={() => {
                          try {
                            const result = importWardrobeFromText(importTextValue);
                            setImportMsg(t('app.importSuccess', {
                              garments: result.garments,
                              profile: result.hasProfile ? t('app.importProfileIncluded') : '',
                            }));
                            setShowImportText(false);
                            setImportTextValue('');
                          } catch (err: unknown) {
                            setImportMsg(t('app.importFailed', {
                              error: err instanceof Error ? err.message : t('app.importFailedGeneric'),
                            }));
                          }
                        }}
                        disabled={!importTextValue.trim()}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        {t('app.importApply')}
                      </button>
                    </div>
                  )}

                  {importMsg && <p className="text-sm text-center mt-2 text-gray-700">{importMsg}</p>}
                </div>
              </>
            )}
            {step === 'clothing' && body && (
              <ClothingInputForm onSubmit={handleClothingSubmit} body={body} />
            )}
          </div>

          <div className="flex justify-center">
            {body ? (
              <FittingCanvas
                body={body}
                category={category}
              />
            ) : (
              <div className="w-full max-w-[400px] aspect-[4/7] border rounded-lg bg-white flex items-center justify-center text-gray-400 text-center px-4 whitespace-pre-line">
                {t('app.avatarPlaceholder')}
              </div>
            )}
          </div>
        </div>
        )}

        {/* 3단계: 결과 — 별도 레이아웃 (아바타 중심 + 라벨) */}
        {step === 'result' && body && clothing && (
          <div className="space-y-6">
            <FittingResult
              body={body}
              clothingMeasurements={clothing}
              category={category}
            />

            <div className="flex gap-3 max-w-md mx-auto">
              <button
                onClick={() => setStep('clothing')}
                className="flex-1 border border-blue-600 text-blue-600 py-3 rounded-xl font-medium hover:bg-blue-50 cursor-pointer transition"
              >
                {t('app.result.editMeasurements')}
              </button>
              <button
                onClick={reset}
                className="flex-1 border border-gray-400 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 cursor-pointer transition"
              >
                {t('app.result.startOver')}
              </button>
            </div>

            <ProductRecommendations category={category} />
          </div>
        )}
      </main>
    </div>
  );
}
