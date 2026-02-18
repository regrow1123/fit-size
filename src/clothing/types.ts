import type { AvatarDimensions, ClothingCategory, ClothingDimensions } from '../types';

export interface SleeveResult {
  path: string;
  transform: string;  // e.g. "rotate(15, 200, 120)"
}

export interface ClothingOverlay {
  id: string;
  fitKey: string;
  buildPath: (av: AvatarDimensions, cl: ClothingDimensions, cx: number) => string;
  /** If overlay needs same transform as sleeve */
  sleeveSide?: 1 | -1;
}

export interface ClothingTemplate {
  category: ClothingCategory;
  buildBody: (av: AvatarDimensions, cl: ClothingDimensions, cx: number) => string;
  buildSleeve: (av: AvatarDimensions, cl: ClothingDimensions, cx: number, side: 1 | -1) => SleeveResult;
  overlays: ClothingOverlay[];
  buildSeams: (av: AvatarDimensions, cl: ClothingDimensions, cx: number) => string[];
}

export type FitLevel = 'good' | 'loose' | 'tight';

export interface RegionFit {
  ease: number;
  level: FitLevel;
}

export interface FitResult {
  overall: FitLevel;
  regions: Record<string, RegionFit>;
}
