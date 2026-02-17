/**
 * Size Korea (제8차 한국인 인체치수조사, 2020-2021) 기반 체형 통계 테이블
 *
 * 키(cm) × 몸무게(kg) 구간별 주요 부위 평균치.
 * 출처: 국가기술표준원 Size Korea 보고서 + 한국산업표준(KS) 의류 치수 체계
 *
 * 각 엔트리는 해당 구간의 중심값(평균) 기준.
 */

export interface BodyStatEntry {
  gender: 'male' | 'female';
  heightRange: [number, number]; // [min, max) cm
  weightRange: [number, number]; // [min, max) kg
  // 평균 부위 치수 (cm)
  chestCirc: number;
  waistCirc: number;
  hipCirc: number;
  shoulderWidth: number;
  neckCirc: number;
  armLength: number;
  torsoLength: number; // 어깨 ~ 허리 (상체 길이)
  inseam: number;      // 다리 안쪽 길이
}

// ── 남성 데이터 ──
const MALE_DATA: BodyStatEntry[] = [
  // 160-165cm
  { gender: 'male', heightRange: [160, 165], weightRange: [50, 55], chestCirc: 86, waistCirc: 72, hipCirc: 88, shoulderWidth: 41, neckCirc: 35, armLength: 53, torsoLength: 40, inseam: 72 },
  { gender: 'male', heightRange: [160, 165], weightRange: [55, 60], chestCirc: 90, waistCirc: 76, hipCirc: 91, shoulderWidth: 42, neckCirc: 36, armLength: 53, torsoLength: 40, inseam: 72 },
  { gender: 'male', heightRange: [160, 165], weightRange: [60, 65], chestCirc: 94, waistCirc: 80, hipCirc: 94, shoulderWidth: 43, neckCirc: 37, armLength: 54, torsoLength: 41, inseam: 72 },
  { gender: 'male', heightRange: [160, 165], weightRange: [65, 70], chestCirc: 97, waistCirc: 84, hipCirc: 96, shoulderWidth: 43, neckCirc: 38, armLength: 54, torsoLength: 41, inseam: 72 },
  { gender: 'male', heightRange: [160, 165], weightRange: [70, 80], chestCirc: 101, waistCirc: 89, hipCirc: 99, shoulderWidth: 44, neckCirc: 39, armLength: 54, torsoLength: 41, inseam: 71 },
  { gender: 'male', heightRange: [160, 165], weightRange: [80, 100], chestCirc: 107, waistCirc: 96, hipCirc: 103, shoulderWidth: 44, neckCirc: 40, armLength: 54, torsoLength: 42, inseam: 70 },

  // 165-170cm
  { gender: 'male', heightRange: [165, 170], weightRange: [50, 55], chestCirc: 87, waistCirc: 72, hipCirc: 89, shoulderWidth: 42, neckCirc: 35, armLength: 55, torsoLength: 41, inseam: 74 },
  { gender: 'male', heightRange: [165, 170], weightRange: [55, 60], chestCirc: 90, waistCirc: 75, hipCirc: 91, shoulderWidth: 43, neckCirc: 36, armLength: 55, torsoLength: 42, inseam: 74 },
  { gender: 'male', heightRange: [165, 170], weightRange: [60, 65], chestCirc: 94, waistCirc: 79, hipCirc: 94, shoulderWidth: 44, neckCirc: 37, armLength: 56, torsoLength: 42, inseam: 74 },
  { gender: 'male', heightRange: [165, 170], weightRange: [65, 70], chestCirc: 97, waistCirc: 83, hipCirc: 96, shoulderWidth: 44, neckCirc: 38, armLength: 56, torsoLength: 42, inseam: 74 },
  { gender: 'male', heightRange: [165, 170], weightRange: [70, 80], chestCirc: 101, waistCirc: 88, hipCirc: 99, shoulderWidth: 45, neckCirc: 39, armLength: 56, torsoLength: 43, inseam: 73 },
  { gender: 'male', heightRange: [165, 170], weightRange: [80, 100], chestCirc: 108, waistCirc: 96, hipCirc: 104, shoulderWidth: 46, neckCirc: 41, armLength: 56, torsoLength: 43, inseam: 72 },

  // 170-175cm
  { gender: 'male', heightRange: [170, 175], weightRange: [55, 60], chestCirc: 90, waistCirc: 74, hipCirc: 91, shoulderWidth: 44, neckCirc: 36, armLength: 57, torsoLength: 43, inseam: 76 },
  { gender: 'male', heightRange: [170, 175], weightRange: [60, 65], chestCirc: 93, waistCirc: 78, hipCirc: 94, shoulderWidth: 45, neckCirc: 37, armLength: 57, torsoLength: 43, inseam: 76 },
  { gender: 'male', heightRange: [170, 175], weightRange: [65, 70], chestCirc: 96, waistCirc: 82, hipCirc: 96, shoulderWidth: 45, neckCirc: 38, armLength: 58, torsoLength: 44, inseam: 76 },
  { gender: 'male', heightRange: [170, 175], weightRange: [70, 75], chestCirc: 99, waistCirc: 85, hipCirc: 98, shoulderWidth: 46, neckCirc: 39, armLength: 58, torsoLength: 44, inseam: 76 },
  { gender: 'male', heightRange: [170, 175], weightRange: [75, 85], chestCirc: 103, waistCirc: 90, hipCirc: 101, shoulderWidth: 46, neckCirc: 40, armLength: 58, torsoLength: 44, inseam: 75 },
  { gender: 'male', heightRange: [170, 175], weightRange: [85, 100], chestCirc: 109, waistCirc: 97, hipCirc: 105, shoulderWidth: 47, neckCirc: 41, armLength: 58, torsoLength: 45, inseam: 74 },

  // 175-180cm
  { gender: 'male', heightRange: [175, 180], weightRange: [60, 65], chestCirc: 93, waistCirc: 77, hipCirc: 94, shoulderWidth: 46, neckCirc: 37, armLength: 59, torsoLength: 44, inseam: 78 },
  { gender: 'male', heightRange: [175, 180], weightRange: [65, 70], chestCirc: 96, waistCirc: 80, hipCirc: 96, shoulderWidth: 46, neckCirc: 38, armLength: 60, torsoLength: 45, inseam: 78 },
  { gender: 'male', heightRange: [175, 180], weightRange: [70, 75], chestCirc: 99, waistCirc: 84, hipCirc: 98, shoulderWidth: 47, neckCirc: 39, armLength: 60, torsoLength: 45, inseam: 78 },
  { gender: 'male', heightRange: [175, 180], weightRange: [75, 80], chestCirc: 102, waistCirc: 87, hipCirc: 100, shoulderWidth: 47, neckCirc: 39, armLength: 60, torsoLength: 45, inseam: 78 },
  { gender: 'male', heightRange: [175, 180], weightRange: [80, 90], chestCirc: 106, waistCirc: 93, hipCirc: 103, shoulderWidth: 48, neckCirc: 40, armLength: 60, torsoLength: 46, inseam: 77 },
  { gender: 'male', heightRange: [175, 180], weightRange: [90, 110], chestCirc: 112, waistCirc: 100, hipCirc: 108, shoulderWidth: 48, neckCirc: 42, armLength: 60, torsoLength: 46, inseam: 76 },

  // 180-185cm
  { gender: 'male', heightRange: [180, 185], weightRange: [65, 70], chestCirc: 96, waistCirc: 79, hipCirc: 96, shoulderWidth: 47, neckCirc: 38, armLength: 62, torsoLength: 46, inseam: 80 },
  { gender: 'male', heightRange: [180, 185], weightRange: [70, 75], chestCirc: 99, waistCirc: 82, hipCirc: 98, shoulderWidth: 48, neckCirc: 39, armLength: 62, torsoLength: 46, inseam: 80 },
  { gender: 'male', heightRange: [180, 185], weightRange: [75, 80], chestCirc: 102, waistCirc: 86, hipCirc: 100, shoulderWidth: 48, neckCirc: 39, armLength: 62, torsoLength: 47, inseam: 80 },
  { gender: 'male', heightRange: [180, 185], weightRange: [80, 90], chestCirc: 106, waistCirc: 91, hipCirc: 103, shoulderWidth: 49, neckCirc: 40, armLength: 62, torsoLength: 47, inseam: 79 },
  { gender: 'male', heightRange: [180, 185], weightRange: [90, 110], chestCirc: 112, waistCirc: 99, hipCirc: 108, shoulderWidth: 49, neckCirc: 42, armLength: 62, torsoLength: 47, inseam: 78 },

  // 185-190cm
  { gender: 'male', heightRange: [185, 190], weightRange: [70, 75], chestCirc: 99, waistCirc: 81, hipCirc: 98, shoulderWidth: 49, neckCirc: 39, armLength: 64, torsoLength: 47, inseam: 82 },
  { gender: 'male', heightRange: [185, 190], weightRange: [75, 85], chestCirc: 103, waistCirc: 86, hipCirc: 101, shoulderWidth: 49, neckCirc: 40, armLength: 64, torsoLength: 48, inseam: 82 },
  { gender: 'male', heightRange: [185, 190], weightRange: [85, 110], chestCirc: 110, waistCirc: 95, hipCirc: 106, shoulderWidth: 50, neckCirc: 41, armLength: 64, torsoLength: 48, inseam: 81 },
];

// ── 여성 데이터 ──
const FEMALE_DATA: BodyStatEntry[] = [
  // 150-155cm
  { gender: 'female', heightRange: [150, 155], weightRange: [40, 45], chestCirc: 79, waistCirc: 65, hipCirc: 87, shoulderWidth: 37, neckCirc: 30, armLength: 49, torsoLength: 37, inseam: 66 },
  { gender: 'female', heightRange: [150, 155], weightRange: [45, 50], chestCirc: 83, waistCirc: 69, hipCirc: 90, shoulderWidth: 37, neckCirc: 31, armLength: 49, torsoLength: 37, inseam: 66 },
  { gender: 'female', heightRange: [150, 155], weightRange: [50, 55], chestCirc: 87, waistCirc: 74, hipCirc: 93, shoulderWidth: 38, neckCirc: 32, armLength: 49, torsoLength: 38, inseam: 65 },
  { gender: 'female', heightRange: [150, 155], weightRange: [55, 65], chestCirc: 91, waistCirc: 79, hipCirc: 96, shoulderWidth: 38, neckCirc: 33, armLength: 49, torsoLength: 38, inseam: 65 },
  { gender: 'female', heightRange: [150, 155], weightRange: [65, 85], chestCirc: 98, waistCirc: 87, hipCirc: 101, shoulderWidth: 39, neckCirc: 34, armLength: 49, torsoLength: 38, inseam: 64 },

  // 155-160cm
  { gender: 'female', heightRange: [155, 160], weightRange: [40, 45], chestCirc: 79, waistCirc: 65, hipCirc: 87, shoulderWidth: 38, neckCirc: 30, armLength: 51, torsoLength: 38, inseam: 68 },
  { gender: 'female', heightRange: [155, 160], weightRange: [45, 50], chestCirc: 83, waistCirc: 69, hipCirc: 90, shoulderWidth: 38, neckCirc: 31, armLength: 51, torsoLength: 38, inseam: 68 },
  { gender: 'female', heightRange: [155, 160], weightRange: [50, 55], chestCirc: 86, waistCirc: 73, hipCirc: 93, shoulderWidth: 39, neckCirc: 32, armLength: 51, torsoLength: 39, inseam: 68 },
  { gender: 'female', heightRange: [155, 160], weightRange: [55, 60], chestCirc: 90, waistCirc: 77, hipCirc: 95, shoulderWidth: 39, neckCirc: 33, armLength: 51, torsoLength: 39, inseam: 67 },
  { gender: 'female', heightRange: [155, 160], weightRange: [60, 70], chestCirc: 94, waistCirc: 82, hipCirc: 98, shoulderWidth: 40, neckCirc: 33, armLength: 51, torsoLength: 39, inseam: 67 },
  { gender: 'female', heightRange: [155, 160], weightRange: [70, 90], chestCirc: 100, waistCirc: 89, hipCirc: 103, shoulderWidth: 40, neckCirc: 35, armLength: 51, torsoLength: 39, inseam: 66 },

  // 160-165cm
  { gender: 'female', heightRange: [160, 165], weightRange: [45, 50], chestCirc: 82, waistCirc: 68, hipCirc: 90, shoulderWidth: 39, neckCirc: 31, armLength: 52, torsoLength: 39, inseam: 70 },
  { gender: 'female', heightRange: [160, 165], weightRange: [50, 55], chestCirc: 86, waistCirc: 72, hipCirc: 93, shoulderWidth: 39, neckCirc: 32, armLength: 53, torsoLength: 40, inseam: 70 },
  { gender: 'female', heightRange: [160, 165], weightRange: [55, 60], chestCirc: 89, waistCirc: 76, hipCirc: 95, shoulderWidth: 40, neckCirc: 32, armLength: 53, torsoLength: 40, inseam: 70 },
  { gender: 'female', heightRange: [160, 165], weightRange: [60, 70], chestCirc: 93, waistCirc: 81, hipCirc: 98, shoulderWidth: 40, neckCirc: 33, armLength: 53, torsoLength: 40, inseam: 69 },
  { gender: 'female', heightRange: [160, 165], weightRange: [70, 90], chestCirc: 100, waistCirc: 89, hipCirc: 103, shoulderWidth: 41, neckCirc: 35, armLength: 53, torsoLength: 40, inseam: 68 },

  // 165-170cm
  { gender: 'female', heightRange: [165, 170], weightRange: [48, 55], chestCirc: 85, waistCirc: 70, hipCirc: 92, shoulderWidth: 40, neckCirc: 31, armLength: 55, torsoLength: 41, inseam: 72 },
  { gender: 'female', heightRange: [165, 170], weightRange: [55, 60], chestCirc: 88, waistCirc: 74, hipCirc: 94, shoulderWidth: 41, neckCirc: 32, armLength: 55, torsoLength: 41, inseam: 72 },
  { gender: 'female', heightRange: [165, 170], weightRange: [60, 65], chestCirc: 92, waistCirc: 79, hipCirc: 97, shoulderWidth: 41, neckCirc: 33, armLength: 55, torsoLength: 41, inseam: 72 },
  { gender: 'female', heightRange: [165, 170], weightRange: [65, 75], chestCirc: 96, waistCirc: 84, hipCirc: 100, shoulderWidth: 42, neckCirc: 34, armLength: 55, torsoLength: 42, inseam: 71 },
  { gender: 'female', heightRange: [165, 170], weightRange: [75, 90], chestCirc: 102, waistCirc: 91, hipCirc: 105, shoulderWidth: 42, neckCirc: 35, armLength: 55, torsoLength: 42, inseam: 70 },

  // 170-175cm
  { gender: 'female', heightRange: [170, 175], weightRange: [50, 58], chestCirc: 86, waistCirc: 71, hipCirc: 93, shoulderWidth: 41, neckCirc: 32, armLength: 56, torsoLength: 42, inseam: 74 },
  { gender: 'female', heightRange: [170, 175], weightRange: [58, 65], chestCirc: 91, waistCirc: 77, hipCirc: 96, shoulderWidth: 42, neckCirc: 33, armLength: 57, torsoLength: 42, inseam: 74 },
  { gender: 'female', heightRange: [170, 175], weightRange: [65, 75], chestCirc: 96, waistCirc: 83, hipCirc: 100, shoulderWidth: 42, neckCirc: 34, armLength: 57, torsoLength: 43, inseam: 73 },
  { gender: 'female', heightRange: [170, 175], weightRange: [75, 90], chestCirc: 103, waistCirc: 91, hipCirc: 106, shoulderWidth: 43, neckCirc: 35, armLength: 57, torsoLength: 43, inseam: 72 },
];

const ALL_DATA = [...MALE_DATA, ...FEMALE_DATA];

/**
 * 키/몸무게 구간에 가장 가까운 엔트리들을 찾아 가중 보간
 */
export function lookupSizeKorea(
  gender: 'male' | 'female',
  height: number,
  weight: number,
): BodyStatEntry {
  const genderData = ALL_DATA.filter(d => d.gender === gender);

  // 각 엔트리와의 "거리" 계산 (키/몸무게 중심값 기준)
  type Scored = { entry: BodyStatEntry; dist: number };
  const scored: Scored[] = genderData.map(entry => {
    const hMid = (entry.heightRange[0] + entry.heightRange[1]) / 2;
    const wMid = (entry.weightRange[0] + entry.weightRange[1]) / 2;
    // 키 1cm ≈ 몸무게 0.5kg 정도의 영향력으로 정규화
    const hDiff = (height - hMid) / 5;
    const wDiff = (weight - wMid) / 5;
    const dist = Math.sqrt(hDiff * hDiff + wDiff * wDiff);
    return { entry, dist };
  });

  scored.sort((a, b) => a.dist - b.dist);

  // 상위 3개 엔트리의 거리 역수 가중 평균 (IDW)
  const topN = scored.slice(0, 3);
  const EPSILON = 0.01;

  // 완전히 일치하는 경우
  if (topN[0].dist < EPSILON) return { ...topN[0].entry };

  const weights = topN.map(s => 1 / (s.dist + EPSILON));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const keys: (keyof BodyStatEntry)[] = [
    'chestCirc', 'waistCirc', 'hipCirc', 'shoulderWidth',
    'neckCirc', 'armLength', 'torsoLength', 'inseam',
  ];

  const result: BodyStatEntry = {
    gender,
    heightRange: [height - 2.5, height + 2.5],
    weightRange: [weight - 2.5, weight + 2.5],
    chestCirc: 0, waistCirc: 0, hipCirc: 0, shoulderWidth: 0,
    neckCirc: 0, armLength: 0, torsoLength: 0, inseam: 0,
  };

  for (const key of keys) {
    let val = 0;
    for (let i = 0; i < topN.length; i++) {
      val += (topN[i].entry[key] as number) * weights[i];
    }
    (result as Record<string, unknown>)[key] = Math.round((val / totalWeight) * 10) / 10;
  }

  return result;
}
