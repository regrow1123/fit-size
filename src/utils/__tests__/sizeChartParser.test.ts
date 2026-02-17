import { describe, it, expect } from 'vitest';
import { parseSizeChart, sizeRowToReverseMeasurements, needsHalving } from '../sizeChartParser';

describe('parseSizeChart', () => {
  // 무신사 스타일 — 탭 구분
  it('무신사 상의 (탭 구분)', () => {
    const text = `사이즈\t어깨너비\t가슴단면\t총장\t소매길이
S\t43\t51\t67\t59
M\t45\t53\t69\t61
L\t47\t56\t71\t63
XL\t49\t59\t73\t65`;

    const result = parseSizeChart(text);
    expect(result).not.toBeNull();
    expect(result!.rows).toHaveLength(4);
    expect(result!.rows[0].sizeLabel).toBe('S');
    expect(result!.rows[0].measurements).toEqual({
      shoulderWidth: 43, chestWidth: 51, totalLength: 67, sleeveLength: 59,
    });
    expect(result!.rows[1].sizeLabel).toBe('M');
    expect(result!.mappedKeys).toEqual([null, 'shoulderWidth', 'chestWidth', 'totalLength', 'sleeveLength']);
  });

  // 무신사 하의 (탭 구분)
  it('무신사 하의 (탭 구분)', () => {
    const text = `사이즈\t허리둘레\t엉덩이둘레\t허벅지단면\t총장\t밑위\t밑단단면
S\t72\t94\t29\t98\t25\t16
M\t76\t98\t31\t100\t26\t17
L\t80\t102\t33\t102\t27\t18`;

    const result = parseSizeChart(text);
    expect(result).not.toBeNull();
    expect(result!.rows).toHaveLength(3);
    // 허리둘레 → waistCirc, 엉덩이둘레 → hipCirc
    expect(result!.rows[0].measurements.waistCirc).toBe(72);
    expect(result!.rows[0].measurements.hipCirc).toBe(94);
    expect(result!.rows[0].measurements.thighCirc).toBe(29);
    expect(result!.rows[0].measurements.rise).toBe(25);
  });

  // 29CM 스타일 — 공백 구분, (cm) 포함
  it('29CM 스타일 (공백 구분, cm 표기)', () => {
    const text = `사이즈(cm)  어깨폭  가슴  총장  소매장
FREE  46  54  70  23`;

    const result = parseSizeChart(text);
    expect(result).not.toBeNull();
    expect(result!.rows).toHaveLength(1);
    expect(result!.rows[0].sizeLabel).toBe('FREE');
    expect(result!.rows[0].measurements.shoulderWidth).toBe(46);
    expect(result!.rows[0].measurements.chestWidth).toBe(54);
  });

  // W컨셉 스타일 — 숫자 사이즈
  it('숫자 사이즈 (95, 100, 105)', () => {
    const text = `사이즈\t어깨너비\t가슴단면\t총장\t소매길이
95\t44\t52\t68\t60
100\t46\t54\t70\t62
105\t48\t56\t72\t64`;

    const result = parseSizeChart(text);
    expect(result).not.toBeNull();
    expect(result!.rows[0].sizeLabel).toBe('95');
    expect(result!.rows[2].sizeLabel).toBe('105');
  });

  // 사이즈 열이 없는 경우 — 첫 열을 사이즈로 사용
  it('사이즈 헤더 없음 (첫 열 기본)', () => {
    const text = `-\t어깨\t가슴단면\t총장
M\t44\t52\t68
L\t46\t54\t70`;

    const result = parseSizeChart(text);
    expect(result).not.toBeNull();
    expect(result!.rows[0].sizeLabel).toBe('M');
  });

  // 쿠팡 스타일 — "단위: cm" 같은 부가 텍스트 포함
  it('부가 텍스트 행 무시', () => {
    const text = `사이즈\t어깨너비\t가슴단면\t총장
단위: cm\t-\t-\t-
M\t44\t52\t68
L\t46\t54\t70`;

    const result = parseSizeChart(text);
    expect(result).not.toBeNull();
    expect(result!.rows).toHaveLength(2);
    expect(result!.rows[0].sizeLabel).toBe('M');
  });

  // 소수점 값
  it('소수점 값 처리', () => {
    const text = `사이즈\t어깨너비\t가슴단면\t총장
M\t44.5\t52.3\t68.0`;

    const result = parseSizeChart(text);
    expect(result).not.toBeNull();
    expect(result!.rows[0].measurements.shoulderWidth).toBe(44.5);
    expect(result!.rows[0].measurements.chestWidth).toBe(52.3);
  });

  // 빈 입력
  it('빈 입력 → null', () => {
    expect(parseSizeChart('')).toBeNull();
    expect(parseSizeChart('어깨너비')).toBeNull(); // 한 줄만
  });

  // 매핑 안 되는 헤더
  it('매핑 안 되는 헤더는 null', () => {
    const text = `사이즈\t색상\t어깨너비\t가격
M\t검정\t44\t29000`;

    const result = parseSizeChart(text);
    expect(result).not.toBeNull();
    expect(result!.mappedKeys).toEqual([null, null, 'shoulderWidth', null]);
    // 가격은 숫자지만 매핑 안 됨
    expect(result!.rows[0].measurements).toEqual({ shoulderWidth: 44 });
  });

  // 세로선(|) 구분 지원
  it('세로선 구분 기본 파싱', () => {
    const text = `사이즈 | 어깨너비 | 가슴단면
M | 44 | 52`;

    const result = parseSizeChart(text);
    expect(result).not.toBeNull();
    expect(result!.rows[0].measurements.shoulderWidth).toBe(44);
    expect(result!.rows[0].measurements.chestWidth).toBe(52);
  });

  // 무신사 실제 복붙 패턴 — 헤더와 데이터 사이에 빈 줄
  it('빈 줄이 섞여도 파싱', () => {
    const text = `사이즈\t어깨너비\t가슴단면\t총장\t소매길이

S\t43\t51\t67\t59

M\t45\t53\t69\t61`;

    const result = parseSizeChart(text);
    expect(result).not.toBeNull();
    expect(result!.rows).toHaveLength(2);
  });

  // 세로 형태 (행/열 전환) — 무신사 일부 상품
  it('세로 형태 (헤더가 행 방향)', () => {
    // 이건 현재 파서가 지원 안 함 — null 반환 확인
    const text = `어깨너비\t43\t45\t47
가슴단면\t51\t53\t56
총장\t67\t69\t71`;

    const result = parseSizeChart(text);
    // 첫 행이 헤더로 인식되는데, "어깨너비"가 사이즈열이 아니고
    // 43, 45, 47은 헤더 매핑이 안 되므로 빈 결과
    if (result) {
      // 파싱되더라도 유용한 데이터가 없을 것
      expect(result.rows.every(r => Object.keys(r.measurements).length === 0)).toBe(true);
    }
  });

  // 세로선(|) 구분 — 일부 쇼핑몰
  it('세로선 구분 파싱', () => {
    const text = `사이즈 | 어깨너비 | 가슴단면 | 총장
M | 44 | 52 | 68
L | 46 | 54 | 70`;

    const result = parseSizeChart(text);
    expect(result).not.toBeNull();
    expect(result!.rows).toHaveLength(2);
    expect(result!.rows[0].sizeLabel).toBe('M');
    expect(result!.rows[0].measurements.shoulderWidth).toBe(44);
    expect(result!.rows[0].measurements.chestWidth).toBe(52);
    expect(result!.rows[0].measurements.totalLength).toBe(68);
  });

  // 스타일리스트 스타일 — 영어 헤더
  it('영어 헤더', () => {
    const text = `Size\tShoulder\tChest\tLength\tSleeve
S\t43\t51\t67\t59
M\t45\t53\t69\t61`;

    const result = parseSizeChart(text);
    expect(result).not.toBeNull();
    expect(result!.rows[0].measurements.shoulderWidth).toBe(43);
    expect(result!.rows[0].measurements.chestWidth).toBe(51);
    expect(result!.rows[0].measurements.totalLength).toBe(67);
  });
});

describe('sizeRowToReverseMeasurements', () => {
  it('상의 키에서 앵커포인트 매핑', () => {
    const row = {
      sizeLabel: 'M',
      measurements: { shoulderWidth: 45, chestWidth: 53, totalLength: 69, sleeveLength: 61 },
    };
    const result = sizeRowToReverseMeasurements(row, 'tshirt');
    expect(result).toHaveLength(4);
    expect(result.find(r => r.startPointId === 'shoulder_end_left' && r.endPointId === 'shoulder_end_right')?.value).toBe(45);
  });

  it('하의에서 상의 전용 키는 제외', () => {
    const row = {
      sizeLabel: 'M',
      measurements: { shoulderWidth: 45, waistCirc: 76, hipCirc: 98 },
    };
    const result = sizeRowToReverseMeasurements(row, 'pants');
    // shoulderWidth는 pants 카테고리에 없으므로 제외
    expect(result.find(r => r.value === 45)).toBeUndefined();
    expect(result.find(r => r.value === 76)).toBeDefined();
    expect(result.find(r => r.value === 98)).toBeDefined();
  });
});

describe('real shopping mall formats', () => {
  // 무신사 실제 복붙 형태 — 모바일에서 드래그 시 탭 구분
  it('무신사 반팔티 실측', () => {
    const text = `사이즈(cm)\t총장\t어깨너비\t가슴단면\t소매길이
S\t66\t44\t50\t20
M\t69\t46\t53\t21
L\t72\t48\t56\t22
XL\t75\t51\t59\t23`;
    const r = parseSizeChart(text)!;
    expect(r.rows).toHaveLength(4);
    expect(r.rows[1].sizeLabel).toBe('M');
    expect(r.rows[1].measurements).toEqual({
      totalLength: 69, shoulderWidth: 46, chestWidth: 53, sleeveLength: 21,
    });
  });

  // 무신사 슬랙스 — 하의 필드
  it('무신사 슬랙스 실측', () => {
    const text = `사이즈\t허리단면\t엉덩이단면\t허벅지단면\t밑위\t총장\t밑단단면
S\t35\t47\t28\t25\t97\t17
M\t37\t49\t30\t26\t99\t18
L\t39\t51\t32\t27\t101\t19`;
    const r = parseSizeChart(text)!;
    expect(r.rows).toHaveLength(3);
    expect(r.rows[0].measurements.waistCirc).toBe(35);
    expect(r.rows[0].measurements.hipCirc).toBe(47);
    expect(r.rows[0].measurements.thighCirc).toBe(28);
    expect(r.rows[0].measurements.rise).toBe(25);
    expect(r.rows[0].measurements.hemCirc).toBe(17);
  });

  // 29CM 스타일 — (단면) 접미사 포함
  it('29CM 가디건', () => {
    const text = `사이즈\t어깨(단면)\t가슴(단면)\t소매길이\t총장
FREE\t60\t57\t50\t63`;
    const r = parseSizeChart(text)!;
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].measurements.shoulderWidth).toBe(60);
    expect(r.rows[0].measurements.chestWidth).toBe(57);
  });

  // W컨셉 — 호수(95, 100) + 소매통 포함
  it('W컨셉 자켓 호수 사이즈', () => {
    const text = `사이즈\t어깨너비\t가슴단면\t소매길이\t소매통\t총장
95\t40\t47\t58\t16\t57
100\t42\t50\t59\t17\t59
105\t44\t53\t60\t18\t61`;
    const r = parseSizeChart(text)!;
    expect(r.rows[0].sizeLabel).toBe('95');
    expect(r.rows[0].measurements.sleeveCirc).toBe(16);
  });

  // 쿠팡 — 줄 사이에 비수치 행 포함
  it('쿠팡 스타일 (비수치 행 무시)', () => {
    const text = `사이즈\t어깨너비\t가슴둘레\t총장\t소매길이
(단위 : cm)\t-\t-\t-\t-
M\t44\t104\t69\t61
L\t46\t110\t71\t63`;
    const r = parseSizeChart(text)!;
    expect(r.rows).toHaveLength(2);
    expect(r.rows[0].measurements.chestWidth).toBe(104);
  });

  // SSF몰 — 세로선 구분
  it('SSF몰 스타일 (세로선)', () => {
    const text = `사이즈 | 어깨 | 가슴 | 소매 | 총장
85 | 42 | 49 | 57 | 65
90 | 44 | 52 | 59 | 67
95 | 46 | 55 | 61 | 69`;
    const r = parseSizeChart(text)!;
    expect(r.rows).toHaveLength(3);
    expect(r.rows[0].sizeLabel).toBe('85');
    expect(r.rows[0].measurements.shoulderWidth).toBe(42);
  });

  // 사이즈 + 기장만 있는 최소 테이블
  it('최소 필드 (기장만)', () => {
    const text = `사이즈\t총장
S\t62
M\t65
L\t68`;
    const r = parseSizeChart(text)!;
    expect(r.rows).toHaveLength(3);
    expect(r.rows[1].measurements).toEqual({ totalLength: 65 });
  });

  // 인심 포함 하의
  it('하의 인심 포함', () => {
    const text = `사이즈\t허리\t힙\t허벅지\t밑위\t인심\t밑단
28\t36\t47\t28\t25\t74\t16
30\t38\t49\t30\t26\t75\t17
32\t40\t51\t32\t27\t76\t18`;
    const r = parseSizeChart(text)!;
    expect(r.rows[0].measurements.waistCirc).toBe(36);
    expect(r.rows[0].measurements.hipCirc).toBe(47);
    expect(r.rows[0].measurements.inseam).toBe(74);
  });
});

describe('needsHalving', () => {
  it('"둘레" 포함 → true', () => {
    expect(needsHalving('허리둘레')).toBe(true);
    expect(needsHalving('엉덩이둘레')).toBe(true);
  });

  it('"단면" 포함 → false', () => {
    expect(needsHalving('가슴단면')).toBe(false);
    expect(needsHalving('허벅지단면')).toBe(false);
  });

  it('"폭" 포함 → false', () => {
    expect(needsHalving('어깨폭')).toBe(false);
  });
});
