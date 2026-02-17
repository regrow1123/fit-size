import { useState, useEffect } from 'react';
import type { BodyMeasurements, ClothingCategory } from './types';
import ClothingInputForm from './components/ClothingInputForm';
import FittingCanvas from './components/FittingCanvas';
import ReverseInputForm from './components/ReverseInputForm';
import ProductRecommendations from './components/ProductRecommendations';
import { hasStoredProfile, loadWardrobe, exportWardrobe, importWardrobe } from './utils/storage';
import { estimateBodyFromGarments, estimatesToBodyMeasurements } from './utils/reverseEstimator';
import { useTranslation, type Locale } from './i18n';

type Step = 'body' | 'clothing' | 'result';

const CATEGORY_ICONS: Record<ClothingCategory, string> = {
  tshirt: '👕', long_sleeve: '🧥', jacket: '🧥', pants: '👖', dress: '👗',
};

const LOCALES: Locale[] = ['ko', 'en', 'ja'];

export default function App() {
  const { t, locale, setLocale } = useTranslation();
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

  const stepLabels = [t('app.step.body'), t('app.step.clothing'), t('app.step.result')];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white py-4 shadow">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{CATEGORY_ICONS[category]} FitSize</h1>
            <p className="text-blue-100 text-sm">{t('app.subtitle')}</p>
          </div>
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
                  <p className="text-sm text-gray-500 text-center mb-3">{t('app.importPrompt')}</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={exportWardrobe}
                      className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 cursor-pointer transition"
                    >
                      {t('app.export')}
                    </button>
                    <label className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 cursor-pointer transition">
                      {t('app.import')}
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const result = await importWardrobe(file);
                            setImportMsg(t('app.importSuccess', {
                              garments: result.garments,
                              profile: result.hasProfile ? t('app.importProfileIncluded') : '',
                            }));
                            setShowWelcomeBack(true);
                          } catch (err: unknown) {
                            setImportMsg(t('app.importFailed', {
                              error: err instanceof Error ? err.message : t('app.importFailedGeneric'),
                            }));
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
