import type { AvatarDimensions, ClothingDimensions } from '../../types';
import type { ClothingTemplate, SleeveResult } from '../types';

const SLEEVE_ANGLE = 15 * Math.PI / 180;
const sinA = Math.sin(SLEEVE_ANGLE);
const cosA = Math.cos(SLEEVE_ANGLE);

/**
 * 일체형 티셔츠 path.
 * 겨드랑이 없이 소매→몸통이 자연스럽게 이어지는 단순한 형태.
 *
 * 경로: 목 → 오른쪽 어깨 → 오른쪽 소매 외측 → 소매 끝 → 소매 내측 → 오른쪽 몸통 → 밑단 → 왼쪽 몸통 → 왼쪽 소매 → 목
 */
function buildBody(av: AvatarDimensions, cl: ClothingDimensions, cx: number): string {
  const sy = av.shoulderY - 15; // 옷을 위로 올림
  const nkH = av.neckWidth / 2 * 1.3; // 목 구멍 넓게

  // 옷 치수 (아바타보다 넓게 보장)
  const shH = Math.max(cl.shoulderWidth / 2, av.shoulderWidth / 2 * 1.15);
  const chH = Math.max(cl.chestWidth / 2, av.chestWidth / 2 * 1.1);
  const hemH = Math.max(cl.hemWidth / 2, av.waistWidth / 2 * 1.1);
  const hemY = sy + cl.totalLength;

  // 소매 치수
  const slLen = cl.sleeveLength;
  const slHalfW = Math.max(cl.sleeveWidth * 0.35, av.upperArmWidth * 0.9);

  // 어깨 높이 (목보다 살짝 아래)
  const shoulderDrop = 5;
  const shY = sy + shoulderDrop;

  // 소매 끝 중심점 (어깨에서 15도 각도로 slLen)
  const rSlEndCX = cx + shH + sinA * slLen;
  const rSlEndCY = shY + cosA * slLen;
  const lSlEndCX = cx - shH - sinA * slLen;
  const lSlEndCY = rSlEndCY;

  // 소매 끝 외측/내측 점 (소매 방향에 수직)
  // perpendicular: (cosA, -sinA) 방향
  const rSlEndOutX = rSlEndCX + cosA * slHalfW;
  const rSlEndOutY = rSlEndCY - sinA * slHalfW;
  const rSlEndInX = rSlEndCX - cosA * slHalfW;
  const rSlEndInY = rSlEndCY + sinA * slHalfW;

  const lSlEndOutX = lSlEndCX - cosA * slHalfW;
  const lSlEndOutY = lSlEndCY - sinA * slHalfW;
  const lSlEndInX = lSlEndCX + cosA * slHalfW;
  const lSlEndInY = lSlEndCY + sinA * slHalfW;

  // 소매 내측이 몸통과 만나는 점 — 겨드랑이 파임 없이 바로 몸통 옆선으로
  // 소매 내측 시작점 = 몸통 옆 (chH) at 소매 내측 높이
  const rArmJoinY = sy + cosA * slLen * 0.3 + sinA * slHalfW; // 소매 내측이 몸통에 닿는 Y
  const lArmJoinY = rArmJoinY;

  // 몸통 Y 포인트
  const waistInRange = av.waistY < hemY;
  const hipInRange = av.hipY < hemY;
  const waH = waistInRange ? Math.max(hemH * 0.95, av.waistWidth / 2 * 1.05) : hemH;
  const hiH = hipInRange ? Math.max(hemH, av.hipWidth / 2 * 1.05) : hemH;

  const d: string[] = [];

  // === 네크라인 (둥글게 U자) ===
  const neckDip = 22; // 목 파임 깊이 (크게)
  d.push(`M ${cx - nkH} ${sy}`);
  d.push(`C ${cx - nkH * 0.5} ${sy + neckDip}, ${cx + nkH * 0.5} ${sy + neckDip}, ${cx + nkH} ${sy}`);

  // === 오른쪽 어깨 (살짝 위로 경사) ===
  d.push(`L ${cx + shH} ${shY}`);

  // === 오른쪽 소매 외측 (어깨→소매끝) ===
  d.push(`L ${rSlEndOutX} ${rSlEndOutY}`);

  // === 소매 끝단 (둥글게) ===
  d.push(`Q ${rSlEndCX} ${rSlEndCY + 3}, ${rSlEndInX} ${rSlEndInY}`);

  // === 오른쪽 소매 내측 → 몸통 (파임 없이 직선적으로) ===
  d.push(`L ${cx + chH} ${rArmJoinY}`);

  // === 오른쪽 몸통 아래로 ===
  if (waistInRange && hipInRange) {
    d.push(`L ${cx + chH} ${av.chestY}`);
    d.push(`C ${cx + chH} ${av.waistY - 10}, ${cx + waH} ${av.waistY - 5}, ${cx + waH} ${av.waistY}`);
    d.push(`C ${cx + waH} ${av.hipY - 10}, ${cx + hiH} ${av.hipY - 5}, ${cx + hiH} ${av.hipY}`);
    d.push(`L ${cx + hemH} ${hemY}`);
  } else if (waistInRange) {
    d.push(`L ${cx + chH} ${av.chestY}`);
    d.push(`C ${cx + chH} ${av.waistY - 10}, ${cx + waH} ${av.waistY - 5}, ${cx + waH} ${av.waistY}`);
    d.push(`L ${cx + hemH} ${hemY}`);
  } else {
    d.push(`L ${cx + hemH} ${hemY}`);
  }

  // === 밑단 ===
  d.push(`Q ${cx} ${hemY + 3}, ${cx - hemH} ${hemY}`);

  // === 왼쪽 몸통 (역순) ===
  if (waistInRange && hipInRange) {
    d.push(`L ${cx - hiH} ${av.hipY}`);
    d.push(`C ${cx - hiH} ${av.hipY - 5}, ${cx - waH} ${av.hipY - 10}, ${cx - waH} ${av.waistY}`);
    d.push(`C ${cx - waH} ${av.waistY - 5}, ${cx - chH} ${av.waistY - 10}, ${cx - chH} ${av.chestY}`);
  } else if (waistInRange) {
    d.push(`L ${cx - waH} ${av.waistY}`);
    d.push(`C ${cx - waH} ${av.waistY - 5}, ${cx - chH} ${av.waistY - 10}, ${cx - chH} ${av.chestY}`);
  }

  // === 왼쪽 소매 내측 (몸통→소매끝) ===
  d.push(`L ${cx - chH} ${lArmJoinY}`);
  d.push(`L ${lSlEndInX} ${lSlEndInY}`);

  // === 왼쪽 소매 끝단 ===
  d.push(`Q ${lSlEndCX} ${lSlEndCY + 3}, ${lSlEndOutX} ${lSlEndOutY}`);

  // === 왼쪽 소매 외측 → 어깨 ===
  d.push(`L ${cx - shH} ${shY}`);

  // === 왼쪽 어깨 → 목 ===
  d.push(`L ${cx - nkH} ${sy}`);

  d.push('Z');
  return d.join(' ');
}

function buildSleeve(_av: AvatarDimensions, _cl: ClothingDimensions, _cx: number, _side: 1 | -1): SleeveResult {
  return { path: '', transform: undefined };
}

function buildSeams(av: AvatarDimensions, cl: ClothingDimensions, cx: number): string[] {
  const shH = Math.max(cl.shoulderWidth / 2, av.shoulderWidth / 2 * 1.15);
  const nkH = av.neckWidth / 2 * 1.3;
  const sy = av.shoulderY - 15;
  const shY = sy + 5;
  return [1, -1].map(s => `M ${cx + s * nkH} ${sy} L ${cx + s * shH} ${shY}`);
}

export const tshirtTemplate: ClothingTemplate = {
  category: 'tshirt',
  buildBody,
  buildSleeve,
  overlays: [],
  buildSeams,
};
