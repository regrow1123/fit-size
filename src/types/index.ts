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
  startPoint: string;   // 시작점 설명 (예: "왼쪽 어깨 끝")
  endPoint: string;     // 끝점 설명 (예: "오른쪽 어깨 끝")
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
  category: 'top';      // MVP: 상의만
  measurements: MeasurementPoint[];
}

// 아바타 렌더링에 필요한 계산된 치수 (px 단위)
export interface AvatarDimensions {
  // 전체
  totalHeight: number;
  // 상체
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
  // 하체
  hipWidth: number;
  legLength: number;
  legWidth: number;
}

// 옷 렌더링 치수 (px 단위)
export interface ClothingDimensions {
  shoulderWidth: number;
  chestWidth: number;
  totalLength: number;
  sleeveLength: number;
  sleeveWidth: number;
  hemWidth: number;
}
