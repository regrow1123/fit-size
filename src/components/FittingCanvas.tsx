import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { BodyMeasurements, AvatarDimensions, ClothingDimensions, ClothingCategory } from '../types';
import { calculateAvatarDimensions } from '../utils/avatarCalculator';
import { drawAvatar } from '../utils/avatarRenderer';
import { calculateClothingDimensions, drawClothing } from '../utils/clothingRenderer';
import { estimateBodyDimensions } from '../data/bodyStats';

interface Props {
  body: BodyMeasurements;
  clothingMeasurements?: Map<string, number>;
  category?: ClothingCategory;
}

const BASE_WIDTH = 400;
const BASE_HEIGHT = 700;
const ASPECT = BASE_HEIGHT / BASE_WIDTH;

export default function FittingCanvas({ body, clothingMeasurements, category = 'tshirt' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: BASE_WIDTH, h: BASE_HEIGHT });

  const measure = useCallback(() => {
    if (!containerRef.current) return;
    const maxW = Math.min(containerRef.current.clientWidth, BASE_WIDTH);
    const w = Math.max(280, maxW);
    setSize({ w, h: Math.round(w * ASPECT) });
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = BASE_WIDTH;
    canvas.height = BASE_HEIGHT;

    const avatarDims: AvatarDimensions = calculateAvatarDimensions(body);
    drawAvatar(ctx, avatarDims, BASE_WIDTH, BASE_HEIGHT);

    if (clothingMeasurements) {
      const clothingDims: ClothingDimensions = calculateClothingDimensions(
        clothingMeasurements,
        body.height,
        category,
      );
      drawClothing(ctx, avatarDims, clothingDims, BASE_WIDTH);
    }
  }, [body, clothingMeasurements, category, size]);

  // 추정된 체형 수치
  const stats = useMemo(() => {
    return estimateBodyDimensions(
      body.gender,
      body.height,
      body.weight,
      body.shoulderWidth,
      body.chestCirc,
      body.waistCirc,
      body.hipCirc,
    );
  }, [body]);

  // 사용자가 직접 입력한 부위인지 판별
  const isUserInput = (key: string): boolean => {
    switch (key) {
      case 'shoulderWidth': return !!body.shoulderWidth;
      case 'chestCirc': return !!body.chestCirc;
      case 'waistCirc': return !!body.waistCirc;
      case 'hipCirc': return !!body.hipCirc;
      default: return false;
    }
  };

  const statItems: { key: string; label: string; icon: string; value: number; unit: string }[] = [
    { key: 'shoulderWidth', label: '어깨너비', icon: '↔️', value: stats.shoulderWidth, unit: 'cm' },
    { key: 'chestCirc', label: '가슴둘레', icon: '📏', value: stats.chestCirc, unit: 'cm' },
    { key: 'waistCirc', label: '허리둘레', icon: '📐', value: stats.waistCirc, unit: 'cm' },
    { key: 'hipCirc', label: '엉덩이둘레', icon: '🍑', value: stats.hipCirc, unit: 'cm' },
    { key: 'armLength', label: '팔길이', icon: '💪', value: stats.armLength, unit: 'cm' },
    { key: 'neckCirc', label: '목둘레', icon: '👔', value: stats.neckCirc, unit: 'cm' },
  ];

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center">
      <canvas
        ref={canvasRef}
        style={{ width: size.w, height: size.h }}
        className="border rounded-lg bg-white shadow-inner"
      />

      {/* 피팅 범례 */}
      <div className="mt-2 flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-500 inline-block" /> 적당
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-yellow-500 inline-block" /> 여유
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-500 inline-block" /> 빡빡
        </span>
      </div>

      {/* 추정 체형 수치 */}
      <div className="mt-4 w-full max-w-sm bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h3 className="text-sm font-bold text-gray-700 mb-3">📊 추정 체형 수치</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {statItems.map(item => {
            const fromUser = isUserInput(item.key);
            return (
              <div key={item.key} className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {item.icon} {item.label}
                </span>
                <span className={`font-mono font-semibold ${fromUser ? 'text-blue-600' : 'text-gray-800'}`}>
                  {item.value.toFixed(1)}
                  <span className="text-xs text-gray-400 ml-0.5">{item.unit}</span>
                  {fromUser && <span className="text-xs text-blue-400 ml-1" title="직접 입력값">✎</span>}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-gray-400">
          <span className="text-blue-400">✎</span> 직접 입력 &nbsp;|&nbsp; 나머지는 Size Korea 통계 기반 추정
        </p>
      </div>
    </div>
  );
}
