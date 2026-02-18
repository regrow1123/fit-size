import type { AvatarDimensions, ClothingCategory, ClothingDimensions } from '../types';

export interface ClothingOverlay {
  id: string;       // 'chest' | 'sleeve_left' | 'sleeve_right'
  fitKey: string;    // analyzeFit의 key
  buildPath: (av: AvatarDimensions, cl: ClothingDimensions, cx: number) => string;
}

export interface ClothingTemplate {
  category: ClothingCategory;
  buildSilhouette: (av: AvatarDimensions, cl: ClothingDimensions, cx: number) => string;
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
