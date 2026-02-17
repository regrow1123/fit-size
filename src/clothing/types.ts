import type { AvatarDimensions, ClothingCategory, ClothingDimensions } from '../types';

export interface ClothingRegion {
  id: string;
  buildPath: (av: AvatarDimensions, cl: ClothingDimensions, cx: number) => string;
  fitKey?: string;
}

export interface ClothingTemplate {
  category: ClothingCategory;
  regions: ClothingRegion[];
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
