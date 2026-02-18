import type { ClothingCategory } from '../types';
import { tshirtTemplate } from '../clothing/templates/tshirt';
import { calculateAvatarDimensions } from '../utils/avatarCalculator';
import { calculateClothingDimensions } from '../utils/clothingRenderer';

export interface AnchorPoint {
  id: string;
  label: string;
  labelEn: string;
  x: number;
  y: number;
}

export interface ClothingCategoryConfig {
  id: ClothingCategory;
  label: string;
  icon: string;
  anchorPoints: AnchorPoint[];
  drawOutline: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

// ─── T-shirt ───
const TSHIRT_POINTS: AnchorPoint[] = [
  { id: 'neck_back_center', label: '뒷목 중심', labelEn: 'Back neck center', x: 0.5, y: 0.08 },
  { id: 'neck_front_center', label: '앞목 중심', labelEn: 'Front neck center', x: 0.5, y: 0.13 },
  { id: 'neck_left', label: '목 왼쪽', labelEn: 'Neck left', x: 0.42, y: 0.09 },
  { id: 'neck_right', label: '목 오른쪽', labelEn: 'Neck right', x: 0.58, y: 0.09 },
  { id: 'shoulder_end_left', label: '왼쪽 어깨끝', labelEn: 'Shoulder end L', x: 0.2, y: 0.14 },
  { id: 'shoulder_end_right', label: '오른쪽 어깨끝', labelEn: 'Shoulder end R', x: 0.8, y: 0.14 },
  { id: 'shoulder_seam_left', label: '왼쪽 어깨 솔기', labelEn: 'Shoulder seam L', x: 0.31, y: 0.115 },
  { id: 'shoulder_seam_right', label: '오른쪽 어깨 솔기', labelEn: 'Shoulder seam R', x: 0.69, y: 0.115 },
  { id: 'armpit_left', label: '왼쪽 겨드랑이', labelEn: 'Armpit L', x: 0.24, y: 0.28 },
  { id: 'armpit_right', label: '오른쪽 겨드랑이', labelEn: 'Armpit R', x: 0.76, y: 0.28 },
  { id: 'sleeve_end_left', label: '왼쪽 소매끝', labelEn: 'Sleeve end L', x: 0.08, y: 0.32 },
  { id: 'sleeve_end_right', label: '오른쪽 소매끝', labelEn: 'Sleeve end R', x: 0.92, y: 0.32 },
  { id: 'chest_left', label: '가슴 왼쪽', labelEn: 'Chest L', x: 0.24, y: 0.35 },
  { id: 'chest_right', label: '가슴 오른쪽', labelEn: 'Chest R', x: 0.76, y: 0.35 },
  { id: 'waist_left', label: '허리 왼쪽', labelEn: 'Waist L', x: 0.25, y: 0.58 },
  { id: 'waist_right', label: '허리 오른쪽', labelEn: 'Waist R', x: 0.75, y: 0.58 },
  { id: 'hem_left', label: '밑단 왼쪽', labelEn: 'Hem L', x: 0.26, y: 0.78 },
  { id: 'hem_right', label: '밑단 오른쪽', labelEn: 'Hem R', x: 0.74, y: 0.78 },
  { id: 'hem_center', label: '밑단 중심', labelEn: 'Hem center', x: 0.5, y: 0.78 },
  { id: 'below_back_neck', label: '뒷목 아래', labelEn: 'Below back neck', x: 0.5, y: 0.1 },
];

function drawTshirtOutline(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // tshirt.ts buildBody의 SVG path를 Canvas에 그리기
  // 기준: 400x700 viewBox → canvas w×h 스케일
  // 고정 175cm/70kg 남성 기본 치수로 path 생성
  const fixedBody = { height: 175, weight: 70, gender: 'male' as const };
  const fixedClothing = new Map<string, number>([
    ['shoulderWidth', 48], ['chestWidth', 50], ['totalLength', 70],
    ['sleeveLength', 25], ['hemWidth', 50], ['sleeveCirc', 42],
  ]);

  const av = calculateAvatarDimensions(fixedBody);
  const cl = calculateClothingDimensions(fixedClothing, fixedBody.height, 'tshirt');
  const pathD = tshirtTemplate.buildBody(av, cl, 200); // cx=200 (400/2)

  ctx.save();
  // 스케일: 400→w, 700→h
  ctx.scale(w / 400, h / 700);

  const path = new Path2D(pathD);
  ctx.fillStyle = '#F0F4F8';
  ctx.fill(path);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2 * (400 / w); // 선 두께 보정
  ctx.stroke(path);

  // 중심선
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.moveTo(200, 80);
  ctx.lineTo(200, 500);
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
