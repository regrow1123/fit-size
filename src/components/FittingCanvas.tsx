import { useRef, useEffect } from 'react';
import type { BodyMeasurements, AvatarDimensions, ClothingCategory, ClothingDimensions } from '../types';
import { calculateAvatarDimensions } from '../utils/avatarCalculator';
import { drawAvatar } from '../utils/avatarRenderer';
import { calculateClothingDimensions, drawClothing } from '../utils/clothingRenderer';

interface Props {
  body: BodyMeasurements;
  clothingMeasurements?: Map<string, number>;
  category?: ClothingCategory;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 700;

export default function FittingCanvas({ body, clothingMeasurements, category = 'tshirt' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const avatarDims: AvatarDimensions = calculateAvatarDimensions(body);
    drawAvatar(ctx, avatarDims, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (clothingMeasurements) {
      const clothingDims: ClothingDimensions = calculateClothingDimensions(
        clothingMeasurements,
        body.height,
        category,
      );
      drawClothing(ctx, avatarDims, clothingDims, CANVAS_WIDTH);
    }
  }, [body, clothingMeasurements, category]);

  return (
    <div className="flex flex-col items-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
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
