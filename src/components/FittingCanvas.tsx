import { useRef, useEffect, useState, useCallback } from 'react';
import type { BodyMeasurements, AvatarDimensions, ClothingDimensions, ClothingCategory } from '../types';
import { calculateAvatarDimensions } from '../utils/avatarCalculator';
import { drawAvatar } from '../utils/avatarRenderer';
import { calculateClothingDimensions, drawClothing } from '../utils/clothingRenderer';

interface Props {
  body: BodyMeasurements;
  clothingMeasurements?: Map<string, number>;
  category?: ClothingCategory;
}

const BASE_WIDTH = 400;
const BASE_HEIGHT = 700;
const ASPECT = BASE_HEIGHT / BASE_WIDTH; // 1.75

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

    // Draw at base resolution, CSS scales down
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

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center">
      <canvas
        ref={canvasRef}
        style={{ width: size.w, height: size.h }}
        className="border rounded-lg bg-white shadow-inner"
      />
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
    </div>
  );
}
