import { useState } from 'react';

interface MeasurementField {
  key: string;
  label: string;
  startPoint: string;
  endPoint: string;
  placeholder: string;
  defaultValue: number;
}

const TOP_FIELDS: MeasurementField[] = [
  { key: 'totalLength', label: '총장', startPoint: '뒷목 중심', endPoint: '밑단 끝', placeholder: '70', defaultValue: 70 },
  { key: 'shoulderWidth', label: '어깨너비', startPoint: '왼쪽 어깨끝', endPoint: '오른쪽 어깨끝', placeholder: '46', defaultValue: 46 },
  { key: 'chestCirc', label: '가슴둘레', startPoint: '겨드랑이 아래 한바퀴', endPoint: '(둘레)', placeholder: '104', defaultValue: 104 },
  { key: 'sleeveLength', label: '소매길이', startPoint: '어깨끝', endPoint: '소매끝', placeholder: '22', defaultValue: 22 },
  { key: 'sleeveCirc', label: '소매통', startPoint: '소매끝 한바퀴', endPoint: '(둘레)', placeholder: '36', defaultValue: 36 },
  { key: 'hemCirc', label: '밑단둘레', startPoint: '밑단 한바퀴', endPoint: '(둘레)', placeholder: '104', defaultValue: 104 },
];

interface Props {
  onSubmit: (measurements: Map<string, number>) => void;
}

export default function ClothingInputForm({ onSubmit }: Props) {
  const [values, setValues] = useState<Record<string, number>>(
    Object.fromEntries(TOP_FIELDS.map(f => [f.key, f.defaultValue]))
  );

  const update = (key: string, val: number) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  const handleSubmit = () => {
    onSubmit(new Map(Object.entries(values)));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">👕 옷 실측치 입력</h2>
      <p className="text-sm text-gray-500">
        쇼핑몰에서 제공하는 실측치를 입력하세요. 각 항목의 측정 기준을 확인할 수 있습니다.
      </p>

      <div className="space-y-3">
        {TOP_FIELDS.map(field => (
          <div key={field.key} className="border rounded p-3 bg-gray-50">
            <div className="flex justify-between items-center mb-1">
              <label className="font-medium text-sm">{field.label}</label>
              <input
                type="number"
                value={values[field.key]}
                onChange={e => update(field.key, +e.target.value)}
                className="w-20 border rounded px-2 py-1 text-right text-sm"
              />
              <span className="text-xs text-gray-400 ml-1">cm</span>
            </div>
            <div className="text-xs text-gray-400">
              📍 {field.startPoint} → {field.endPoint}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition cursor-pointer"
      >
        피팅 확인
      </button>
    </div>
  );
}
