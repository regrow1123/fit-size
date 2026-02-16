/**
 * 성별/키/몸무게 기반 체형 통계 데이터
 * 출처: 한국인 인체치수조사 (Size Korea) 기반 근사값
 * 
 * 키(cm)와 몸무게(kg)로부터 각 부위 치수를 추정
 */

interface BodyStatRange {
  chestCirc: number;   // 가슴둘레 cm
  waistCirc: number;   // 허리둘레 cm
  hipCirc: number;     // 엉덩이둘레 cm
  shoulderWidth: number; // 어깨너비 cm
  armLength: number;   // 팔길이 cm
  torsoLength: number; // 몸통길이 (어깨~허리) cm
  neckCirc: number;    // 목둘레 cm
}

// BMI 기반으로 체형 보정 계수 산출
function getBmiFactor(height: number, weight: number): number {
  const bmi = weight / ((height / 100) ** 2);
  // BMI 22를 기준(1.0)으로 보정
  return bmi / 22;
}

export function estimateBodyDimensions(
  gender: 'male' | 'female',
  height: number,
  weight: number,
  shoulderWidthInput?: number,
  chestCircInput?: number,
  waistCircInput?: number,
): BodyStatRange {
  const bmiFactor = getBmiFactor(height, weight);
  const heightRatio = height / 170; // 170cm 기준

  if (gender === 'male') {
    const base: BodyStatRange = {
      chestCirc: 95 * bmiFactor,
      waistCirc: 82 * bmiFactor,
      hipCirc: 95 * bmiFactor,
      shoulderWidth: 45 * heightRatio,
      armLength: 58 * heightRatio,
      torsoLength: 44 * heightRatio,
      neckCirc: 37 * bmiFactor,
    };

    // 사용자 입력값이 있으면 덮어쓰기
    if (shoulderWidthInput) base.shoulderWidth = shoulderWidthInput;
    if (chestCircInput) base.chestCirc = chestCircInput;
    if (waistCircInput) base.waistCirc = waistCircInput;

    return base;
  } else {
    const base: BodyStatRange = {
      chestCirc: 86 * bmiFactor,
      waistCirc: 70 * bmiFactor,
      hipCirc: 93 * bmiFactor,
      shoulderWidth: 40 * heightRatio,
      armLength: 52 * heightRatio,
      torsoLength: 40 * heightRatio,
      neckCirc: 32 * bmiFactor,
    };

    if (shoulderWidthInput) base.shoulderWidth = shoulderWidthInput;
    if (chestCircInput) base.chestCirc = chestCircInput;
    if (waistCircInput) base.waistCirc = waistCircInput;

    return base;
  }
}
