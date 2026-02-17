import type { ClothingCategory } from '../types';

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
  ctx.save();
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.moveTo(w * 0.42, h * 0.09);
  ctx.quadraticCurveTo(w * 0.5, h * 0.14, w * 0.58, h * 0.09);
  ctx.lineTo(w * 0.8, h * 0.14);
  ctx.lineTo(w * 0.92, h * 0.32);
  ctx.lineTo(w * 0.76, h * 0.28);
  ctx.lineTo(w * 0.76, h * 0.35);
  ctx.lineTo(w * 0.75, h * 0.58);
  ctx.lineTo(w * 0.74, h * 0.78);
  ctx.lineTo(w * 0.26, h * 0.78);
  ctx.lineTo(w * 0.25, h * 0.58);
  ctx.lineTo(w * 0.24, h * 0.35);
  ctx.lineTo(w * 0.24, h * 0.28);
  ctx.lineTo(w * 0.08, h * 0.32);
  ctx.lineTo(w * 0.2, h * 0.14);
  ctx.lineTo(w * 0.42, h * 0.09);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.08);
  ctx.lineTo(w * 0.5, h * 0.78);
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
