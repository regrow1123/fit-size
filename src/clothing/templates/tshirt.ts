import type { AvatarDimensions, ClothingDimensions } from '../../types';
import type { ClothingTemplate, SleeveResult } from '../types';

const SLEEVE_ANGLE_DEG = 15;
const SLEEVE_ANGLE = SLEEVE_ANGLE_DEG * Math.PI / 180;

/** Shared intermediate values */
function calc(av: AvatarDimensions, cl: ClothingDimensions, cx: number) {
  const sy = av.shoulderY;
  const avShH = av.shoulderWidth / 2;
  const avChH = av.chestWidth / 2;
  const avWaH = av.waistWidth / 2;
  const avHiH = av.hipWidth / 2;

  // 어깨: 아바타보다 최소 10% 넓게
  const shH = Math.max(cl.shoulderWidth / 2, avShH * 1.1);
  // 가슴: 아바타보다 살짝만 넓게 (너무 과하지 않게)
  const chH = Math.max(cl.chestWidth / 2, avChH * 1.05);
  const hemH = Math.max(cl.hemWidth / 2, avWaH);
  const nkH = av.neckWidth / 2;
  const hemY = sy + cl.totalLength;

  // 소매: 아바타 팔 전체를 덮을 수 있도록 넉넉하게
  const slLen = cl.sleeveLength;
  const minSlW = av.upperArmWidth * 1.4; // 팔 폭의 140% 이상
  const slTopW = Math.max(cl.sleeveWidth * 0.6, minSlW);
  const slEndW = Math.max(slTopW * 0.88, av.upperArmWidth * 1.2);

  // 소매 끝점 계산 (어깨에서 15도 각도로)
  const sinA = Math.sin(SLEEVE_ANGLE);
  const cosA = Math.cos(SLEEVE_ANGLE);

  // 겨드랑이 Y (어깨와 가슴 사이)
  const armpitY = sy + (av.chestY - sy) * 0.65;

  return {
    cx, sy, shH, chH, hemH, nkH, hemY,
    armpitY, avChH, avWaH, avHiH,
    slLen, slTopW, slEndW, sinA, cosA,
  };
}

/**
 * 일체형 티셔츠 실루엣 — 몸통+소매를 하나의 path로.
 * v4 스타일: 자연스러운 어깨-소매 연결, 부드러운 겨드랑이 곡선.
 */
function buildBody(av: AvatarDimensions, cl: ClothingDimensions, cx: number): string {
  const c = calc(av, cl, cx);
  const { sy, shH, nkH, chH, hemH, hemY, armpitY, sinA, cosA, slLen, slTopW, slEndW } = c;

  // 소매 끝점 (어깨에서 slLen만큼 15도 각도)
  const sleeveOuterHalfW = slTopW * 0.55;
  const sleeveEndHalfW = slEndW * 0.5;

  // 허리/엉덩이 영역
  const waistInRange = av.waistY < hemY;
  const hipInRange = av.hipY < hemY;
  const waH = waistInRange ? Math.max(hemH * 0.95, av.waistWidth / 2) : hemH;
  const hiH = hipInRange ? Math.max(hemH, av.hipWidth / 2) : hemH;

  // 몸통 폭 (겨드랑이 레벨)
  const bodyW = Math.max(chH, shH * 0.95);

  const d: string[] = [];

  // ===== 시작: 목 중앙 왼쪽 =====
  d.push(`M ${cx - nkH} ${sy - 2}`);

  // 네크라인 V (왼→오)
  d.push(`Q ${cx} ${sy + 8}, ${cx + nkH} ${sy - 2}`);

  // 오른쪽 어깨선 (목→어깨점)
  d.push(`L ${cx + shH} ${sy}`);

  // ===== 오른쪽 소매 =====
  // 어깨점 → 소매 끝 외측
  const rSleeveEndX = cx + shH + sinA * slLen;
  const rSleeveEndY = sy + cosA * slLen;
  // 소매 외측 라인 (약간 볼록한 커브)
  const rOutCtrl1X = cx + shH + sinA * slLen * 0.4 + cosA * sleeveOuterHalfW;
  const rOutCtrl1Y = sy + cosA * slLen * 0.4 - sinA * sleeveOuterHalfW;
  d.push(`Q ${rOutCtrl1X} ${rOutCtrl1Y}, ${rSleeveEndX + cosA * sleeveEndHalfW} ${rSleeveEndY - sinA * sleeveEndHalfW}`);

  // 소매 끝단 (둥글게)
  d.push(`Q ${rSleeveEndX} ${rSleeveEndY + 3}, ${rSleeveEndX - cosA * sleeveEndHalfW} ${rSleeveEndY + sinA * sleeveEndHalfW}`);

  // 소매 내측 → 겨드랑이 (부드러운 오목 곡선)
  const rArmPitX = cx + bodyW;
  const rArmPitY = armpitY;
  const rInCtrl1X = cx + shH + sinA * slLen * 0.3 - cosA * sleeveOuterHalfW * 0.3;
  const rInCtrl1Y = sy + cosA * slLen * 0.3 + sinA * sleeveOuterHalfW * 0.3;
  d.push(`C ${rInCtrl1X} ${rInCtrl1Y}, ${rArmPitX + 5} ${rArmPitY - 15}, ${rArmPitX} ${rArmPitY}`);

  // ===== 오른쪽 몸통 =====
  // 겨드랑이 → 가슴
  d.push(`C ${rArmPitX - 1} ${rArmPitY + (av.chestY - rArmPitY) * 0.5}, ${cx + chH + 1} ${av.chestY - 5}, ${cx + chH} ${av.chestY}`);

  // 가슴 → 밑단 (거의 직선, 살짝 안쪽 테이퍼)
  if (waistInRange && hipInRange) {
    d.push(`C ${cx + chH - 1} ${av.chestY + (av.waistY - av.chestY) * 0.5}, ${cx + waH + 1} ${av.waistY - 5}, ${cx + waH} ${av.waistY}`);
    d.push(`C ${cx + waH + 1} ${av.waistY + (av.hipY - av.waistY) * 0.4}, ${cx + hiH + 1} ${av.hipY - 5}, ${cx + hiH} ${av.hipY}`);
    d.push(`C ${cx + hiH - 0.5} ${av.hipY + (hemY - av.hipY) * 0.5}, ${cx + hemH + 1} ${hemY - 5}, ${cx + hemH} ${hemY}`);
  } else if (waistInRange) {
    d.push(`C ${cx + chH - 1} ${av.chestY + (av.waistY - av.chestY) * 0.5}, ${cx + waH + 1} ${av.waistY - 5}, ${cx + waH} ${av.waistY}`);
    d.push(`C ${cx + waH + 0.5} ${av.waistY + (hemY - av.waistY) * 0.5}, ${cx + hemH + 1} ${hemY - 5}, ${cx + hemH} ${hemY}`);
  } else {
    d.push(`C ${cx + chH - 0.5} ${av.chestY + (hemY - av.chestY) * 0.4}, ${cx + hemH + 1} ${hemY - 10}, ${cx + hemH} ${hemY}`);
  }

  // ===== 밑단 (거의 직선, 살짝 아래로 볼록) =====
  d.push(`Q ${cx} ${hemY + 3}, ${cx - hemH} ${hemY}`);

  // ===== 왼쪽 몸통 (역순) =====
  if (waistInRange && hipInRange) {
    d.push(`C ${cx - hemH - 1} ${hemY - 5}, ${cx - hiH + 0.5} ${av.hipY + (hemY - av.hipY) * 0.5}, ${cx - hiH} ${av.hipY}`);
    d.push(`C ${cx - hiH - 1} ${av.hipY - 5}, ${cx - waH - 1} ${av.waistY + (av.hipY - av.waistY) * 0.4}, ${cx - waH} ${av.waistY}`);
    d.push(`C ${cx - waH - 1} ${av.waistY - 5}, ${cx - chH + 1} ${av.chestY + (av.waistY - av.chestY) * 0.5}, ${cx - chH} ${av.chestY}`);
  } else if (waistInRange) {
    d.push(`C ${cx - hemH - 1} ${hemY - 5}, ${cx - waH - 0.5} ${av.waistY + (hemY - av.waistY) * 0.5}, ${cx - waH} ${av.waistY}`);
    d.push(`C ${cx - waH - 1} ${av.waistY - 5}, ${cx - chH + 1} ${av.chestY + (av.waistY - av.chestY) * 0.5}, ${cx - chH} ${av.chestY}`);
  } else {
    d.push(`C ${cx - hemH - 1} ${hemY - 10}, ${cx - chH + 0.5} ${av.chestY + (hemY - av.chestY) * 0.4}, ${cx - chH} ${av.chestY}`);
  }

  // 겨드랑이
  const lArmPitX = cx - bodyW;
  d.push(`C ${cx - chH - 1} ${av.chestY - 5}, ${lArmPitX + 1} ${rArmPitY + (av.chestY - rArmPitY) * 0.5}, ${lArmPitX} ${rArmPitY}`);

  // ===== 왼쪽 소매 =====
  const lSleeveEndX = cx - shH - sinA * slLen;
  const lSleeveEndY = sy + cosA * slLen;

  // 겨드랑이 → 소매 내측
  const lInCtrl1X = cx - shH - sinA * slLen * 0.3 + cosA * sleeveOuterHalfW * 0.3;
  const lInCtrl1Y = sy + cosA * slLen * 0.3 + sinA * sleeveOuterHalfW * 0.3;
  d.push(`C ${lArmPitX - 5} ${rArmPitY - 15}, ${lInCtrl1X} ${lInCtrl1Y}, ${lSleeveEndX + cosA * sleeveEndHalfW} ${lSleeveEndY + sinA * sleeveEndHalfW}`);

  // 소매 끝단
  d.push(`Q ${lSleeveEndX} ${lSleeveEndY + 3}, ${lSleeveEndX - cosA * sleeveEndHalfW} ${lSleeveEndY - sinA * sleeveEndHalfW}`);

  // 소매 외측 → 어깨
  const lOutCtrl1X = cx - shH - sinA * slLen * 0.4 - cosA * sleeveOuterHalfW;
  const lOutCtrl1Y = sy + cosA * slLen * 0.4 - sinA * sleeveOuterHalfW;
  d.push(`Q ${lOutCtrl1X} ${lOutCtrl1Y}, ${cx - shH} ${sy}`);

  // 왼쪽 어깨선 → 목
  d.push(`L ${cx - nkH} ${sy - 2}`);

  d.push('Z');
  return d.join(' ');
}

/**
 * 소매 path — 일체형이므로 실제로는 빈 path 반환.
 * ClothingSvg.tsx 호환을 위해 존재.
 */
function buildSleeve(_av: AvatarDimensions, _cl: ClothingDimensions, _cx: number, _side: 1 | -1): SleeveResult {
  return {
    path: '',
    transform: undefined,
  };
}

/** 가슴/몸통 overlay */
function buildChestOverlay(av: AvatarDimensions, cl: ClothingDimensions, cx: number): string {
  const c = calc(av, cl, cx);
  const bodyW = Math.max(c.chH, c.shH * 0.95);
  const w = bodyW + 5;
  return `M ${cx - w} ${c.armpitY} L ${cx + w} ${c.armpitY} L ${cx + w} ${c.hemY + 5} L ${cx - w} ${c.hemY + 5} Z`;
}

/** 소매 overlay */
function buildSleeveOverlay(av: AvatarDimensions, cl: ClothingDimensions, cx: number, side: 1 | -1): string {
  const c = calc(av, cl, cx);
  const { sy, shH, slLen, slTopW, sinA, cosA } = c;

  // 소매 영역을 회전된 사각형으로 커버
  const shoulderX = cx + side * shH;
  const endX = shoulderX + side * sinA * slLen;
  const endY = sy + cosA * slLen;
  const hw = slTopW * 0.6;
  const perpX = cosA * hw;
  const perpY = -sinA * hw;

  return `M ${shoulderX + side * perpX} ${sy + perpY} L ${endX + side * perpX} ${endY + perpY} L ${endX - side * perpX} ${endY - perpY} L ${shoulderX - side * perpX} ${sy - perpY} Z`;
}

/** 봉제선 */
function buildSeams(av: AvatarDimensions, cl: ClothingDimensions, cx: number): string[] {
  const c = calc(av, cl, cx);
  const { sy, shH, nkH } = c;

  // 어깨 봉제선
  const shoulderSeams = [1, -1].map(s =>
    `M ${cx + s * nkH} ${sy - 2} L ${cx + s * shH} ${sy}`
  );

  return shoulderSeams;
}

export const tshirtTemplate: ClothingTemplate = {
  category: 'tshirt',
  buildBody,
  buildSleeve,
  overlays: [
    { id: 'chest', fitKey: 'chest', buildPath: buildChestOverlay },
    { id: 'sleeve_right', fitKey: 'sleeve', buildPath: (av, cl, cx) => buildSleeveOverlay(av, cl, cx, 1), sleeveSide: 1 },
    { id: 'sleeve_left', fitKey: 'sleeve', buildPath: (av, cl, cx) => buildSleeveOverlay(av, cl, cx, -1), sleeveSide: -1 },
  ],
  buildSeams,
};
