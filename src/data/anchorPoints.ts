import type { ClothingCategory } from '../types';
import { tshirtTemplate } from '../clothing/templates/tshirt';
import { calculateAvatarDimensions } from '../utils/avatarCalculator';
import { calculateClothingDimensions } from '../utils/clothingRenderer';

export interface AnchorPoint {
  id: string;
  label: string;
  labelEn: string;
  x: number; // 0~1 normalized to canvas
  y: number;
}

export interface ClothingCategoryConfig {
  id: ClothingCategory;
  label: string;
  icon: string;
  anchorPoints: AnchorPoint[];
  drawOutline: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

// ─── T-shirt: 실제 buildBody 좌표에서 앵커 포인트 계산 ───
// viewBox 기준: 400×700, cx=200
const VB_W = 400;
const VB_H = 700;

function computeTshirtPoints(): AnchorPoint[] {
  const fixedBody = { height: 175, weight: 70, gender: 'male' as const };
  const fixedClothing = new Map<string, number>([
    ['shoulderWidth', 48], ['chestWidth', 50], ['totalLength', 70],
    ['sleeveLength', 25], ['hemWidth', 50], ['sleeveCirc', 42],
  ]);

  const av = calculateAvatarDimensions(fixedBody);
  const cl = calculateClothingDimensions(fixedClothing, fixedBody.height, 'tshirt');
  const cx = VB_W / 2; // 200

  // tshirt.ts와 동일한 계산
  const sy = av.shoulderY - 15;
  const nkH = av.neckWidth / 2 * 1.3;
  const shH = Math.max(cl.shoulderWidth / 2, av.shoulderWidth / 2 * 1.15);
  const chH = Math.max(cl.chestWidth / 2, av.chestWidth / 2 * 1.1);
  const hemH = Math.max(cl.hemWidth / 2, av.waistWidth / 2 * 1.1);
  const hemY = sy + cl.totalLength;
  const shoulderDrop = 5;
  const shY = sy + shoulderDrop;
  const slLen = cl.sleeveLength;
  const slHalfW = Math.max(cl.sleeveWidth * 0.35, av.upperArmWidth * 0.9);

  const SLEEVE_ANGLE = 15 * Math.PI / 180;
  const sinA = Math.sin(SLEEVE_ANGLE);
  const cosA = Math.cos(SLEEVE_ANGLE);

  // 소매 끝 중심점
  const rSlEndCX = cx + shH + sinA * slLen;
  const rSlEndCY = shY + cosA * slLen;
  const lSlEndCX = cx - shH - sinA * slLen;
  const lSlEndCY = rSlEndCY;

  // 소매-몸통 접합점 Y
  const rArmJoinY = sy + cosA * slLen * 0.3 + sinA * slHalfW;

  // 허리 (waist in range check)
  const waistInRange = av.waistY < hemY;
  const waH = waistInRange ? Math.max(hemH * 0.95, av.waistWidth / 2 * 1.05) : hemH;

  // 가슴 Y 위치
  const chestY = av.chestY;
  const waistY = av.waistY;

  // 네크라인 딥 최저점
  const neckDip = 22;
  const neckBottomY = sy + neckDip;

  // normalize: viewBox → 0~1
  const nx = (x: number) => x / VB_W;
  const ny = (y: number) => y / VB_H;

  return [
    { id: 'neck_back_center', label: '뒷목 중심', labelEn: 'Back neck center', x: nx(cx), y: ny(sy) },
    { id: 'neck_front_center', label: '앞목 중심', labelEn: 'Front neck center', x: nx(cx), y: ny(neckBottomY) },
    { id: 'neck_left', label: '목 왼쪽', labelEn: 'Neck left', x: nx(cx - nkH), y: ny(sy) },
    { id: 'neck_right', label: '목 오른쪽', labelEn: 'Neck right', x: nx(cx + nkH), y: ny(sy) },
    { id: 'shoulder_end_left', label: '왼쪽 어깨끝', labelEn: 'Shoulder end L', x: nx(cx - shH), y: ny(shY) },
    { id: 'shoulder_end_right', label: '오른쪽 어깨끝', labelEn: 'Shoulder end R', x: nx(cx + shH), y: ny(shY) },
    { id: 'shoulder_seam_left', label: '왼쪽 어깨 솔기', labelEn: 'Shoulder seam L', x: nx(cx - (nkH + shH) / 2), y: ny(sy + shoulderDrop / 2) },
    { id: 'shoulder_seam_right', label: '오른쪽 어깨 솔기', labelEn: 'Shoulder seam R', x: nx(cx + (nkH + shH) / 2), y: ny(sy + shoulderDrop / 2) },
    { id: 'armpit_left', label: '왼쪽 겨드랑이', labelEn: 'Armpit L', x: nx(cx - chH), y: ny(rArmJoinY) },
    { id: 'armpit_right', label: '오른쪽 겨드랑이', labelEn: 'Armpit R', x: nx(cx + chH), y: ny(rArmJoinY) },
    { id: 'sleeve_end_left', label: '왼쪽 소매끝', labelEn: 'Sleeve end L', x: nx(lSlEndCX), y: ny(lSlEndCY) },
    { id: 'sleeve_end_right', label: '오른쪽 소매끝', labelEn: 'Sleeve end R', x: nx(rSlEndCX), y: ny(rSlEndCY) },
    { id: 'chest_left', label: '가슴 왼쪽', labelEn: 'Chest L', x: nx(cx - chH), y: ny(chestY) },
    { id: 'chest_right', label: '가슴 오른쪽', labelEn: 'Chest R', x: nx(cx + chH), y: ny(chestY) },
    { id: 'waist_left', label: '허리 왼쪽', labelEn: 'Waist L', x: nx(cx - waH), y: ny(waistY) },
    { id: 'waist_right', label: '허리 오른쪽', labelEn: 'Waist R', x: nx(cx + waH), y: ny(waistY) },
    { id: 'hem_left', label: '밑단 왼쪽', labelEn: 'Hem L', x: nx(cx - hemH), y: ny(hemY) },
    { id: 'hem_right', label: '밑단 오른쪽', labelEn: 'Hem R', x: nx(cx + hemH), y: ny(hemY) },
    { id: 'hem_center', label: '밑단 중심', labelEn: 'Hem center', x: nx(cx), y: ny(hemY) },
    { id: 'below_back_neck', label: '뒷목 아래', labelEn: 'Below back neck', x: nx(cx), y: ny(sy + 5) },
  ];
}

const TSHIRT_POINTS = computeTshirtPoints();

function drawTshirtOutline(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const fixedBody = { height: 175, weight: 70, gender: 'male' as const };
  const fixedClothing = new Map<string, number>([
    ['shoulderWidth', 48], ['chestWidth', 50], ['totalLength', 70],
    ['sleeveLength', 25], ['hemWidth', 50], ['sleeveCirc', 42],
  ]);

  const av = calculateAvatarDimensions(fixedBody);
  const cl = calculateClothingDimensions(fixedClothing, fixedBody.height, 'tshirt');
  const pathD = tshirtTemplate.buildBody(av, cl, VB_W / 2);

  ctx.save();
  ctx.scale(w / VB_W, h / VB_H);

  const path = new Path2D(pathD);
  ctx.fillStyle = '#F0F4F8';
  ctx.fill(path);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2 * (VB_W / w);
  ctx.stroke(path);

  // 중심선
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.moveTo(VB_W / 2, 80);
  ctx.lineTo(VB_W / 2, 500);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

// ─── Category configs ───
export const CLOTHING_CATEGORIES: ClothingCategoryConfig[] = [
  { id: 'tshirt', label: '반팔 상의', icon: '👕', anchorPoints: TSHIRT_POINTS, drawOutline: drawTshirtOutline },
];

export function getCategoryConfig(_id: ClothingCategory): ClothingCategoryConfig {
  return CLOTHING_CATEGORIES[0];
}

export const ANCHOR_POINTS = TSHIRT_POINTS;

export function getAnchorById(id: string): AnchorPoint | undefined {
  return TSHIRT_POINTS.find(p => p.id === id);
}
