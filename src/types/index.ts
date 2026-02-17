// 의류 카테고리
export type ClothingCategory = 'tshirt';

// 신체 측정값
export interface BodyMeasurements {
  gender: 'male' | 'female';
  height: number;       // cm
  weight: number;       // kg
  shoulderWidth?: number; // cm - 어깨너비
  chestCirc?: number;   // cm - 가슴둘레 (선택)
  waistCirc?: number;   // cm - 허리둘레 (선택)
  hipCirc?: number;     // cm - 엉덩이둘레 (선택)
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
/** 아바타 렌더링용 포인트 — 모든 값은 px */
export interface AvatarDimensions {
  totalHeight: number;

  // 머리
  headRadius: number;
  headCY: number;       // 머리 중심 Y

  // 목
  neckWidth: number;
  neckTopY: number;
  neckBottomY: number;

  // 어깨
  shoulderWidth: number;
  shoulderY: number;

  // 몸통 폭 포인트
  chestWidth: number;
  chestY: number;
  chestDepth: number;
  underbustWidth: number;
  underbustY: number;
  waistWidth: number;
  waistY: number;
  hipWidth: number;
  hipY: number;
  crotchY: number;

  // 팔
  armLength: number;
  upperArmWidth: number;
  elbowWidth: number;
  elbowY: number;
  forearmWidth: number;
  wristWidth: number;
  wristY: number;

  // 다리
  legLength: number;
  thighWidth: number;
  kneeWidth: number;
  kneeY: number;
  calfWidth: number;
  calfY: number;
  ankleWidth: number;
  ankleY: number;
  footLength: number;
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
}
