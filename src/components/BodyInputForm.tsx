import { useState } from 'react';
import type { BodyMeasurements } from '../types';
import { useTranslation } from '../i18n';

interface Props {
  onSubmit: (body: BodyMeasurements) => void;
  initial?: BodyMeasurements;
}

const defaults: BodyMeasurements = {
  gender: 'male',
  height: 175,
  weight: 70,
  shoulderWidth: 45,
};

export default function BodyInputForm({ onSubmit, initial }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<BodyMeasurements>(initial ?? defaults);

  const update = <K extends keyof BodyMeasurements>(key: K, value: BodyMeasurements[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">{t('body.title')}</h2>

      <div className="flex gap-4">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={form.gender === 'male'}
            onChange={() => update('gender', 'male')}
          />
          {t('body.gender.male')}
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={form.gender === 'female'}
            onChange={() => update('gender', 'female')}
          />
          {t('body.gender.female')}
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-600">{t('body.height')}</label>
          <input
            type="number"
            value={form.height}
            onChange={e => update('height', +e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">{t('body.weight')}</label>
          <input
            type="number"
            value={form.weight}
            onChange={e => update('weight', +e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">{t('body.shoulderWidth')}</label>
          <input
            type="number"
            value={form.shoulderWidth}
            onChange={e => update('shoulderWidth', +e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">{t('body.chestCirc')}</label>
          <input
            type="number"
            value={form.chestCirc ?? ''}
            placeholder={t('body.chestPlaceholder')}
            onChange={e => update('chestCirc', e.target.value ? +e.target.value : undefined)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
      </div>

      <button
        onClick={() => onSubmit(form)}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition cursor-pointer"
      >
        {t('body.submit')}
      </button>
    </div>
  );
}
