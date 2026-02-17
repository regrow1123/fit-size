import { useState, useEffect } from 'react';
import type { BodyMeasurements, ClothingCategory } from './types';
import ClothingInputForm from './components/ClothingInputForm';
import FittingCanvas from './components/FittingCanvas';
import ReverseInputForm from './components/ReverseInputForm';
import ProductRecommendations from './components/ProductRecommendations';
import { hasStoredProfile, loadWardrobe, importWardrobeFromText } from './utils/storage';
import { estimateBodyFromGarments, estimatesToBodyMeasurements } from './utils/reverseEstimator';
import { useTranslation, type Locale } from './i18n';
import { useAuth, saveToCloud, loadFromCloud, migrateLocalToCloud, syncToLocal } from './firebase';

type Step = 'body' | 'clothing' | 'result';

const CATEGORY_ICONS: Record<ClothingCategory, string> = {
  tshirt: '👕', long_sleeve: '🧥', jacket: '🧥', pants: '👖', dress: '👗',
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
  const [cloudSynced, setCloudSynced] = useState(false);
  const [step, setStep] = useState<Step>('body');
  const [body, setBody] = useState<BodyMeasurements | null>(null);
  const [clothing, setClothing] = useState<Map<string, number> | null>(null);
  const [category, setCategory] = useState<ClothingCategory>('tshirt');
  const [showWelcomeBack, setShowWelcomeBack] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [showExportText, setShowExportText] = useState(false);
  const [showImportText, setShowImportText] = useState(false);
  const [importTextValue, setImportTextValue] = useState('');

  useEffect(() => {
    if (hasStoredProfile()) {
      setShowWelcomeBack(true);
    }
  }, []);

  // 로그인 시 클라우드 동기화
  useEffect(() => {
    if (!user || cloudSynced) return;
    (async () => {
      // 1. 로컬 → 클라우드 마이그레이션 시도
      const migrated = await migrateLocalToCloud(user);
      if (!migrated) {
        // 2. 클라우드 → 로컬 동기화
        const cloudData = await loadFromCloud(user);
        if (cloudData && cloudData.garments.length > 0) {
          syncToLocal(cloudData);
          setShowWelcomeBack(true);
        }
      }
      setCloudSynced(true);
    })();
  }, [user, cloudSynced]);

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
    if (user) saveToCloud(user).catch(() => {});
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
          <div className="flex items-center gap-2">
            {/* Auth button */}
            {authConfigured && !authLoading && (
              user ? (
                <div className="flex items-center gap-2">
                  <img
                    src={user.photoURL ?? undefined}
                    alt=""
                    className="w-7 h-7 rounded-full border-2 border-white/50"
                  />
                  <button
                    onClick={signOut}
                    className="text-xs text-blue-100 hover:text-white cursor-pointer"
                  >
                    {t('auth.logout')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-full cursor-pointer transition"
                >
                  <span>☁️</span> {t('auth.login')}
                </button>
              )
            )}
            {/* Language selector */}
            <div className="flex gap-1">
              {LOCALES.map(l => {
                const flag: Record<string, string> = { ko: '🇰🇷', en: '🇺🇸', ja: '🇯🇵' };
                return (
                  <button
                    key={l}
                    onClick={() => setLocale(l)}
                    className={`w-8 h-8 rounded-full text-lg flex items-center justify-center cursor-pointer transition ${
                      locale === l ? 'bg-white/25 ring-2 ring-white' : 'hover:bg-blue-500'
                    }`}
                    title={t(`lang.${l}`)}
                  >
                    {flag[l]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        {/* Welcome back banner */}
        {showWelcomeBack && step === 'body' && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-300 rounded-xl p-5 shadow-sm">
            <h2 className="text-lg font-bold text-green-800 mb-1">{t('app.welcome.title')}</h2>
            <p className="text-sm text-green-700 mb-3">{t('app.welcome.desc')}</p>
            <div className="flex gap-2">
              <button
                onClick={handleLoadProfileDirect}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 cursor-pointer transition"
              >
                {t('app.welcome.loadProfile')}
              </button>
              <button
                onClick={() => setShowWelcomeBack(false)}
                className="border border-green-400 text-green-700 px-4 py-2 rounded-lg text-sm hover:bg-green-50 cursor-pointer transition"
              >
                {t('app.welcome.resetBody')}
              </button>
            </div>
          </div>
        )}

        {/* Step indicator */}
        <StepIndicator step={step} body={body} clothing={clothing} onStepClick={setStep} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            {step === 'body' && (
              <>
                <ReverseInputForm onSubmit={handleBodySubmit} />

                {/* Cloud sync status / Export / Import */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  {user ? (
                    <p className="text-sm text-green-600 text-center mb-3">☁️ {t('auth.cloudSynced')}</p>
                  ) : (
                    <p className="text-sm text-gray-500 text-center mb-3">
                      {authConfigured ? t('auth.loginPrompt') : t('app.importPrompt')}
                    </p>
                  )}
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
                        value={JSON.stringify(loadWardrobe())}
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
                            setShowWelcomeBack(true);
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
            {step === 'result' && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold">{t('app.result.title')}</h2>
                <p className="text-gray-600 text-sm">{t('app.result.desc')}</p>
                <div className="text-sm space-y-1 text-gray-500">
                  <p dangerouslySetInnerHTML={{ __html: t('app.result.fitGood') }} />
                  <p dangerouslySetInnerHTML={{ __html: t('app.result.fitLoose') }} />
                  <p dangerouslySetInnerHTML={{ __html: t('app.result.fitTight') }} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStep('clothing')}
                    className="flex-1 border border-blue-600 text-blue-600 py-2 rounded hover:bg-blue-50 cursor-pointer"
                  >
                    {t('app.result.editMeasurements')}
                  </button>
                  <button
                    onClick={reset}
                    className="flex-1 border border-gray-400 text-gray-600 py-2 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    {t('app.result.startOver')}
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
              <div className="w-full max-w-[400px] aspect-[4/7] border rounded-lg bg-white flex items-center justify-center text-gray-400 text-center px-4 whitespace-pre-line">
                {t('app.avatarPlaceholder')}
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
