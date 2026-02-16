import { useState } from 'react';
import type { BodyMeasurements } from '../types';

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
  const [form, setForm] = useState<BodyMeasurements>(initial ?? defaults);

  const update = <K extends keyof BodyMeasurements>(key: K, value: BodyMeasurements[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">📏 내 신체 정보</h2>

      <div className="flex gap-4">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={form.gender === 'male'}
            onChange={() => update('gender', 'male')}
          />
          남성
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={form.gender === 'female'}
            onChange={() => update('gender', 'female')}
          />
          여성
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-600">키 (cm)</label>
          <input
            type="number"
            value={form.height}
            onChange={e => update('height', +e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">몸무게 (kg)</label>
          <input
            type="number"
            value={form.weight}
            onChange={e => update('weight', +e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">어깨너비 (cm)</label>
          <input
            type="number"
            value={form.shoulderWidth}
            onChange={e => update('shoulderWidth', +e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">가슴둘레 (cm, 선택)</label>
          <input
            type="number"
            value={form.chestCirc ?? ''}
            placeholder="미입력시 추정"
            onChange={e => update('chestCirc', e.target.value ? +e.target.value : undefined)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
      </div>

      <button
        onClick={() => onSubmit(form)}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition cursor-pointer"
      >
        아바타 생성
      </button>
    </div>
  );
}
