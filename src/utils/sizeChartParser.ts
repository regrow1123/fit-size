/**
 * 쇼핑몰 사이즈표 붙여넣기 파서
 *
 * 사용자가 쇼핑몰에서 사이즈표를 드래그 → 복사 → 붙여넣기하면
 * 탭/공백 구분 텍스트를 파싱하여 사이즈별 치수 맵으로 변환한다.
 */

export interface SizeChartRow {
  sizeLabel: string; // "S", "M", "L", "95", "100" 등
  measurements: Record<string, number>; // key → cm 값
}

export interface ParsedSizeChart {
  headers: string[];           // 원본 헤더 (표시용)
  mappedKeys: (string | null)[]; // 매핑된 내부 키 (null = 미매핑)
  rows: SizeChartRow[];
}

/**
 * 한국 쇼핑몰 사이즈표 헤더 → 내부 키 매핑
 * 쇼핑몰마다 표현이 달라서 동의어를 넉넉하게 잡는다.
 */
const HEADER_ALIASES: Record<string, string[]> = {
  shoulderWidth: [
    '어깨너비', '어깨폭', '어깨단면', '어깨', 'shoulder', 'shoulder width',
  ],
  chestWidth: [
    '가슴단면', '가슴폭', '가슴너비', '가슴', '흉위', 'chest', 'chest width', 'bust',
  ],
  totalLength: [
    '총장', '기장', '총기장', '전체길이', 'length', 'total length',
  ],
  sleeveLength: [
    '소매길이', '소매장', '소매', 'sleeve', 'sleeve length',
  ],
  hemCirc: [
    '밑단', '밑단둘레', '밑단폭', '밑단단면', 'hem',
  ],
  waistCirc: [
    '허리단면', '허리폭', '허리둘레', '허리', 'waist', 'waist width',
  ],
  hipCirc: [
    '엉덩이단면', '엉덩이폭', '엉덩이둘레', '엉덩이', '힙', 'hip', 'hip width',
  ],
  thighCirc: [
    '허벅지단면', '허벅지폭', '허벅지둘레', '허벅지', '넓적다리', 'thigh',
  ],
  kneeCirc: [
    '무릎단면', '무릎폭', '무릎둘레', '무릎', 'knee',
  ],
  rise: [
    '밑위', '밑위길이', 'rise', 'front rise',
  ],
  inseam: [
    '인심', '안쪽길이', '안쪽솔기', 'inseam', 'inside leg',
  ],
  sleeveCirc: [
    '소매통', '소매둘레', '소매단면', 'sleeve width',
  ],
  cuffCirc: [
    '소매단', '소매끝단', '소매부리', 'cuff',
  ],
  elbowCirc: [
    '팔꿈치', '팔꿈치단면', 'elbow',
  ],
  neckCirc: [
    '목둘레', '목폭', '목', 'neck',
  ],
};

// 사이즈 열을 식별하는 키워드
const SIZE_COLUMN_ALIASES = [
  '사이즈', '사이즈(cm)', 'size', 'sz', '호수', '치수',
];

/** 역매핑 테이블: 소문자 별칭 → 내부 키 */
const aliasToKey = new Map<string, string>();
for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
  for (const alias of aliases) {
    aliasToKey.set(alias.toLowerCase().trim(), key);
  }
}

function matchHeader(header: string): string | null {
  const h = header.toLowerCase().trim()
    .replace(/\(cm\)/g, '')
    .replace(/\(단면\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // 직접 매칭
  if (aliasToKey.has(h)) return aliasToKey.get(h)!;

  // 부분 매칭 (헤더가 별칭을 포함하는 경우)
  for (const [alias, key] of aliasToKey) {
    if (h.includes(alias) || alias.includes(h)) {
      return key;
    }
  }

  return null;
}

function isSizeColumn(header: string): boolean {
  const h = header.toLowerCase().trim();
  return SIZE_COLUMN_ALIASES.some(a => h.includes(a)) || h === '' || h === '-';
}

/** 사이즈 라벨로 인식할 수 있는 토큰 패턴 */
const SIZE_LABEL_PATTERN = /^(XXS|XS|S|M|L|XL|XXL|XXXL|FREE|[0-9]{2,3})$/i;

/**
 * 한 줄로 붙여넣어진 사이즈표를 복원한다.
 * 예: "M L XL 총장 어깨너비 가슴단면 소매길이 65 49 58 62 66 51 60 63 67 53 62 64"
 * → 테이블 형태로 변환
 */
function tryParseFlattened(text: string): ParsedSizeChart | null {
  // 공백으로 토큰화
  const tokens = text.split(/\s+/).filter(t => t.length > 0);
  if (tokens.length < 4) return null;

  // 1) 헤더 후보 찾기 (정확 매칭만 — 부분 매칭은 "L"→"length" 같은 오탐 유발)
  const headerIndices: number[] = [];
  const headerKeys: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const h = tokens[i].toLowerCase().trim()
      .replace(/\(cm\)/g, '').replace(/\(단면\)/g, '').replace(/\s+/g, ' ').trim();
    const key = aliasToKey.get(h);
    if (key && !headerKeys.includes(key)) {
      headerIndices.push(i);
      headerKeys.push(key);
    }
  }
  if (headerKeys.length < 1) return null;

  // 2) 사이즈 라벨 찾기 (헤더 앞에 위치한 S/M/L/XL 등)
  const firstHeaderIdx = headerIndices[0];
  const sizeLabels: string[] = [];
  for (let i = 0; i < firstHeaderIdx; i++) {
    if (SIZE_LABEL_PATTERN.test(tokens[i])) {
      sizeLabels.push(tokens[i]);
    }
  }
  if (sizeLabels.length === 0) return null;

  // 3) 숫자 추출 (헤더 뒤의 모든 숫자)
  const lastHeaderIdx = headerIndices[headerIndices.length - 1];
  const numbers: number[] = [];
  for (let i = lastHeaderIdx + 1; i < tokens.length; i++) {
    const n = parseFloat(tokens[i]);
    if (!isNaN(n)) numbers.push(n);
  }

  // 숫자 개수 = 사이즈 수 × 헤더 수 여야 함
  const nHeaders = headerKeys.length;
  const nSizes = sizeLabels.length;
  if (numbers.length !== nHeaders * nSizes && numbers.length !== nSizes * nHeaders) return null;

  // 4) 테이블 구성 (행 우선: 각 사이즈별로 헤더 순서대로)
  const headers = ['사이즈', ...headerIndices.map(i => tokens[i])];
  const mappedKeys: (string | null)[] = [null, ...headerKeys];
  const rows: SizeChartRow[] = [];

  for (let s = 0; s < nSizes; s++) {
    const measurements: Record<string, number> = {};
    for (let h = 0; h < nHeaders; h++) {
      const val = numbers[s * nHeaders + h];
      if (val > 0) measurements[headerKeys[h]] = val;
    }
    if (Object.keys(measurements).length > 0) {
      rows.push({ sizeLabel: sizeLabels[s], measurements });
    }
  }

  return rows.length > 0 ? { headers, mappedKeys, rows } : null;
}

/**
 * 탭/공백 구분 텍스트를 파싱한다.
 * 첫 번째 행은 헤더, 나머지는 데이터 행.
 * 한 줄로 붙여넣어진 경우도 자동 감지하여 처리.
 */
export function parseSizeChart(text: string): ParsedSizeChart | null {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // 한 줄인 경우 flattened 파서 시도
  if (lines.length === 1) {
    return tryParseFlattened(lines[0]);
  }

  if (lines.length < 2) return null;

  // 구분자 감지: 탭 → 세로선(|) → 2+공백
  const hasTab = lines[0].includes('\t');
  const hasPipe = !hasTab && lines[0].includes('|');
  const splitLine = (line: string) =>
    hasTab
      ? line.split('\t').map(s => s.trim())
      : hasPipe
        ? line.split('|').map(s => s.trim())
        : line.split(/\s{2,}/).map(s => s.trim());

  const headerCells = splitLine(lines[0]);
  if (headerCells.length < 2) return null;

  // 사이즈 열 찾기 (보통 첫 번째 열)
  let sizeColIdx = headerCells.findIndex(h => isSizeColumn(h));
  if (sizeColIdx === -1) sizeColIdx = 0; // 기본: 첫 열

  // 헤더 매핑
  const mappedKeys: (string | null)[] = headerCells.map((h, i) =>
    i === sizeColIdx ? null : matchHeader(h)
  );
  const headers = headerCells;

  // 데이터 행 파싱
  const rows: SizeChartRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    if (cells.length < 2) continue;

    const sizeLabel = cells[sizeColIdx] ?? `Row${i}`;
    // 숫자가 아닌 행은 스킵 (예: "단위: cm" 같은 부가 텍스트)
    const hasNumbers = cells.some((c, idx) => idx !== sizeColIdx && !isNaN(parseFloat(c)));
    if (!hasNumbers) continue;

    const measurements: Record<string, number> = {};
    for (let j = 0; j < cells.length; j++) {
      if (j === sizeColIdx) continue;
      const key = mappedKeys[j];
      if (!key) continue;
      const val = parseFloat(cells[j]);
      if (!isNaN(val) && val > 0) {
        measurements[key] = val;
      }
    }

    if (Object.keys(measurements).length > 0) {
      rows.push({ sizeLabel, measurements });
    }
  }

  if (rows.length === 0) return null;

  return { headers, mappedKeys, rows };
}

/**
 * 사이즈표 키 → 앵커포인트 쌍 + 카테고리 매핑
 * ReverseInputForm에서 사이즈표를 ReverseMeasurement[]로 변환할 때 사용
 */
import type { ClothingCategory } from '../types';
import type { FitFeedback, ReverseMeasurement } from './reverseEstimator';

interface AnchorMapping {
  startPointId: string;
  endPointId: string;
  categories: ClothingCategory[];
}

const SIZE_KEY_TO_ANCHORS: Record<string, AnchorMapping> = {
  shoulderWidth: {
    startPointId: 'shoulder_end_left', endPointId: 'shoulder_end_right',
    categories: ['tshirt', 'long_sleeve', 'jacket', 'dress'],
  },
  chestWidth: {
    startPointId: 'chest_left', endPointId: 'chest_right',
    categories: ['tshirt', 'long_sleeve', 'jacket', 'dress'],
  },
  waistCirc: {
    startPointId: 'waist_left', endPointId: 'waist_right',
    categories: ['tshirt', 'long_sleeve', 'jacket', 'dress', 'pants'],
  },
  hipCirc: {
    startPointId: 'hip_left', endPointId: 'hip_right',
    categories: ['pants', 'dress'],
  },
  totalLength: {
    startPointId: 'below_back_neck', endPointId: 'hem_center',
    categories: ['tshirt', 'long_sleeve', 'jacket', 'dress'],
  },
  sleeveLength: {
    startPointId: 'shoulder_end_left', endPointId: 'sleeve_end_left',
    categories: ['tshirt', 'long_sleeve', 'jacket', 'dress'],
  },
};

/**
 * 파싱된 사이즈표의 한 행을 ReverseMeasurement[]로 변환
 */
export function sizeRowToReverseMeasurements(
  row: SizeChartRow,
  category: ClothingCategory,
  feedback: FitFeedback = '적당',
): ReverseMeasurement[] {
  const result: ReverseMeasurement[] = [];

  for (const [key, value] of Object.entries(row.measurements)) {
    const mapping = SIZE_KEY_TO_ANCHORS[key];
    if (!mapping || !mapping.categories.includes(category)) continue;

    result.push({
      startPointId: mapping.startPointId,
      endPointId: mapping.endPointId,
      value,
      feedback,
    });
  }

  return result;
}

/**
 * 단면(반폭) 값을 둘레로 변환해야 하는 키 목록
 * 쇼핑몰은 보통 "가슴단면 52cm" = 반폭. 둘레 = 52 * 2 = 104cm.
 * 하지만 우리 앱에서 옷 치수는 단면(half)으로 저장하므로 변환 불필요.
 *
 * 다만 허리/엉덩이/허벅지는 이름에 "단면"이 있으면 이미 반폭이고,
 * "둘레"가 있으면 /2 해줘야 함.
 */
export function needsHalving(originalHeader: string): boolean {
  const h = originalHeader.toLowerCase();
  return h.includes('둘레') && !h.includes('단면') && !h.includes('폭');
}
