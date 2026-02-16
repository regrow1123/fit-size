import { useState, useCallback } from 'react';
import ClothingSketch from './ClothingSketch';
import type { ClothingCategory, PointMeasurement } from '../types';
import { CLOTHING_CATEGORIES } from '../data/anchorPoints';
import { pointMeasurementsToMap } from '../utils/clothingRenderer';

interface Props {
  onSubmit: (measurements: Map<string, number>, category: ClothingCategory) => void;
}

let nextId = 1;

export default function ClothingInputForm({ onSubmit }: Props) {
  const [category, setCategory] = useState<ClothingCategory>('tshirt');
  const [measurements, setMeasurements] = useState<PointMeasurement[]>([]);

  const handleAdd = useCallback((startId: string, endId: string, value: number) => {
    setMeasurements(prev => [
      ...prev,
      { id: `m${nextId++}`, startPointId: startId, endPointId: endId, value },
    ]);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setMeasurements(prev => prev.filter(m => m.id !== id));
  }, []);

  const handleCategoryChange = (cat: ClothingCategory) => {
    setCategory(cat);
    setMeasurements([]); // Reset measurements when changing category
  };

  const handleSubmit = () => {
    const map = pointMeasurementsToMap(measurements, category);
    onSubmit(map, category);
  };

  const catConfig = CLOTHING_CATEGORIES.find(c => c.id === category)!;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">{catConfig.icon} 옷 실측치 입력</h2>

      {/* Category selector */}
      <div className="flex flex-wrap gap-1.5">
        {CLOTHING_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition ${
              category === cat.id
                ? 'bg-blue-600 text-white shadow'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500">
        도식화에서 두 점을 클릭하여 측정값을 입력하세요.
      </p>

      <ClothingSketch
        category={category}
        measurements={measurements}
        onAddMeasurement={handleAdd}
        onDeleteMeasurement={handleDelete}
      />

      <button
        onClick={handleSubmit}
        disabled={measurements.length === 0}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        피팅 확인 ({measurements.length}개 측정)
      </button>
    </div>
  );
}
