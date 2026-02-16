// 의류 카테고리
export type ClothingCategory = 'tshirt' | 'long_sleeve' | 'jacket' | 'pants' | 'dress';

// 신체 측정값
export interface BodyMeasurements {
  gender: 'male' | 'female';
  height: number;       // cm
  weight: number;       // kg
  shoulderWidth: number; // cm - 어깨너비
  chestCirc?: number;   // cm - 가슴둘레 (선택)
  waistCirc?: number;   // cm - 허리둘레 (선택)
}

// 옷 측정 포인트
export interface MeasurementPoint {
  id: string;
  label: string;
  startPoint: string;
  endPoint: string;
  value: number;        // cm
}

// 포인트 기반 측정 (sketch UI에서 생성)
export interface PointMeasurement {
  id: string;
  startPointId: string;
  endPointId: string;
  value: number;        // cm
}

// 옷 실측치
export interface ClothingMeasurements {
  category: ClothingCategory;
  measurements: MeasurementPoint[];
}

// 아바타 렌더링에 필요한 계산된 치수 (px 단위)
export interface AvatarDimensions {
  totalHeight: number;
  headRadius: number;
  neckWidth: number;
  neckHeight: number;
  shoulderWidth: number;
  shoulderY: number;
  chestWidth: number;
  chestDepth: number;
  waistWidth: number;
  torsoHeight: number;
  armLength: number;
  armWidth: number;
  hipWidth: number;
  legLength: number;
  legWidth: number;
}

// 옷 렌더링 치수 (px 단위)
export interface ClothingDimensions {
  category: ClothingCategory;
  shoulderWidth: number;
  chestWidth: number;
  totalLength: number;
  sleeveLength: number;
  sleeveWidth: number;
  hemWidth: number;
  // Pants-specific
  waistWidth?: number;
  hipWidth?: number;
  thighWidth?: number;
  kneeWidth?: number;
  inseam?: number;
  rise?: number;
  // Long sleeve / jacket extras
  elbowWidth?: number;
  cuffWidth?: number;
}
