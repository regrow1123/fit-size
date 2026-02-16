import { useState, useCallback } from 'react';
import ClothingSketch from './ClothingSketch';
import type { PointMeasurement } from '../types';
import { pointMeasurementsToMap } from '../utils/clothingRenderer';

interface Props {
  onSubmit: (measurements: Map<string, number>) => void;
}

let nextId = 1;

export default function ClothingInputForm({ onSubmit }: Props) {
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

  const handleSubmit = () => {
    const map = pointMeasurementsToMap(measurements);
    onSubmit(map);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">👕 옷 실측치 입력</h2>
      <p className="text-sm text-gray-500">
        도식화에서 두 점을 클릭하여 측정값을 입력하세요.
      </p>

      <ClothingSketch
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
