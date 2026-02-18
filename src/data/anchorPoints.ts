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

// ─── T-shirt: 실제 buildBody 좌표 → bounding box fit ───
// 원본 viewBox 기준 좌표를 계산한 뒤, 캔버스에 꽉 차게 스케일

const FIXED_BODY = { height: 175, weight: 70, gender: 'male' as const };
const FIXED_CLOTHING = new Map<string, number>([
  ['shoulderWidth', 48], ['chestWidth', 50], ['totalLength', 70],
  ['sleeveLength', 25], ['hemWidth', 50], ['sleeveCirc', 42],
]);
const PADDING = 0.06; // 캔버스 여백 비율 (양쪽 6%)

interface TshirtKeyCoords {
  cx: number; sy: number; nkH: number; shH: number; chH: number;
  hemH: number; hemY: number; shY: number; slLen: number; slHalfW: number;
  rSlEndCX: number; rSlEndCY: number; lSlEndCX: number; lSlEndCY: number;
  rArmJoinY: number; waH: number; chestY: number; waistY: number;
  neckBottomY: number; shoulderDrop: number;
  // bounding box (원본 좌표)
  minX: number; maxX: number; minY: number; maxY: number;
}

function computeKeyCoords(): TshirtKeyCoords {
  const av = calculateAvatarDimensions(FIXED_BODY);
  const cl = calculateClothingDimensions(FIXED_CLOTHING, FIXED_BODY.height, 'tshirt');
  const cx = 200; // 원래 viewBox 기준

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

  const ANG = 15 * Math.PI / 180;
  const sinA = Math.sin(ANG);
  const cosA = Math.cos(ANG);

  const rSlEndCX = cx + shH + sinA * slLen;
  const rSlEndCY = shY + cosA * slLen;
  const lSlEndCX = cx - shH - sinA * slLen;
  const lSlEndCY = rSlEndCY;

  const rSlEndOutX_R = rSlEndCX + cosA * slHalfW;
  const rSlEndOutY_R = rSlEndCY - sinA * slHalfW;
  const lSlEndOutX_L = lSlEndCX - cosA * slHalfW;

  const rArmJoinY = sy + cosA * slLen * 0.3 + sinA * slHalfW;

  const waistInRange = av.waistY < hemY;
  const waH = waistInRange ? Math.max(hemH * 0.95, av.waistWidth / 2 * 1.05) : hemH;
  const neckDip = 22;
  const neckBottomY = sy + neckDip;

  // bounding box
  const allX = [cx - nkH, cx + nkH, cx - shH, cx + shH, lSlEndOutX_L, rSlEndOutX_R, cx - chH, cx + chH, cx - hemH, cx + hemH, cx - waH, cx + waH];
  const allY = [sy, neckBottomY, shY, rSlEndCY, rSlEndOutY_R, lSlEndCY, rArmJoinY, av.chestY, av.waistY, hemY + 3];
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);

  return {
    cx, sy, nkH, shH, chH, hemH, hemY, shY, slLen, slHalfW,
    rSlEndCX, rSlEndCY, lSlEndCX, lSlEndCY,
    rArmJoinY, waH, chestY: av.chestY, waistY: av.waistY,
    neckBottomY, shoulderDrop,
    minX, maxX, minY, maxY,
  };
}

const KEY = computeKeyCoords();

// uniform scale: 종횡비 유지하면서 캔버스에 fit
// ClothingSketch 캔버스: 400×700
const SKETCH_W = 400;
const SKETCH_H = 700;

function computeFitTransform() {
  const rangeX = KEY.maxX - KEY.minX;
  const rangeY = KEY.maxY - KEY.minY;
  const padX = rangeX * PADDING;
  const padY = rangeY * PADDING;
  const contentW = rangeX + padX * 2;
  const contentH = rangeY + padY * 2;
  // uniform scale: 비율 유지
  const scale = Math.min(SKETCH_W / contentW, SKETCH_H / contentH);
  const fittedW = contentW * scale;
  const fittedH = contentH * scale;
  // center offset
  const offsetX = (SKETCH_W - fittedW) / 2;
  const offsetY = (SKETCH_H - fittedH) / 2;
  return { scale, padX, padY, offsetX, offsetY };
}

const FIT = computeFitTransform();

function normX(x: number): number {
  return (FIT.offsetX + ((x - KEY.minX) + FIT.padX) * FIT.scale) / SKETCH_W;
}
function normY(y: number): number {
  return (FIT.offsetY + ((y - KEY.minY) + FIT.padY) * FIT.scale) / SKETCH_H;
}

const TSHIRT_POINTS: AnchorPoint[] = [
  { id: 'neck_back_center', label: '뒷목 중심', labelEn: 'Back neck center', x: normX(KEY.cx), y: normY(KEY.sy) },
  { id: 'neck_front_center', label: '앞목 중심', labelEn: 'Front neck center', x: normX(KEY.cx), y: normY(KEY.neckBottomY) },
  { id: 'neck_left', label: '목 왼쪽', labelEn: 'Neck left', x: normX(KEY.cx - KEY.nkH), y: normY(KEY.sy) },
  { id: 'neck_right', label: '목 오른쪽', labelEn: 'Neck right', x: normX(KEY.cx + KEY.nkH), y: normY(KEY.sy) },
  { id: 'shoulder_end_left', label: '왼쪽 어깨끝', labelEn: 'Shoulder end L', x: normX(KEY.cx - KEY.shH), y: normY(KEY.shY) },
  { id: 'shoulder_end_right', label: '오른쪽 어깨끝', labelEn: 'Shoulder end R', x: normX(KEY.cx + KEY.shH), y: normY(KEY.shY) },
  { id: 'shoulder_seam_left', label: '왼쪽 어깨 솔기', labelEn: 'Shoulder seam L', x: normX(KEY.cx - (KEY.nkH + KEY.shH) / 2), y: normY(KEY.sy + KEY.shoulderDrop / 2) },
  { id: 'shoulder_seam_right', label: '오른쪽 어깨 솔기', labelEn: 'Shoulder seam R', x: normX(KEY.cx + (KEY.nkH + KEY.shH) / 2), y: normY(KEY.sy + KEY.shoulderDrop / 2) },
  { id: 'armpit_left', label: '왼쪽 겨드랑이', labelEn: 'Armpit L', x: normX(KEY.cx - KEY.chH), y: normY(KEY.rArmJoinY) },
  { id: 'armpit_right', label: '오른쪽 겨드랑이', labelEn: 'Armpit R', x: normX(KEY.cx + KEY.chH), y: normY(KEY.rArmJoinY) },
  { id: 'sleeve_end_left', label: '왼쪽 소매끝', labelEn: 'Sleeve end L', x: normX(KEY.lSlEndCX), y: normY(KEY.lSlEndCY) },
  { id: 'sleeve_end_right', label: '오른쪽 소매끝', labelEn: 'Sleeve end R', x: normX(KEY.rSlEndCX), y: normY(KEY.rSlEndCY) },
  { id: 'chest_left', label: '가슴 왼쪽', labelEn: 'Chest L', x: normX(KEY.cx - KEY.chH), y: normY(KEY.chestY) },
  { id: 'chest_right', label: '가슴 오른쪽', labelEn: 'Chest R', x: normX(KEY.cx + KEY.chH), y: normY(KEY.chestY) },
  { id: 'waist_left', label: '허리 왼쪽', labelEn: 'Waist L', x: normX(KEY.cx - KEY.waH), y: normY(KEY.waistY) },
  { id: 'waist_right', label: '허리 오른쪽', labelEn: 'Waist R', x: normX(KEY.cx + KEY.waH), y: normY(KEY.waistY) },
  { id: 'hem_left', label: '밑단 왼쪽', labelEn: 'Hem L', x: normX(KEY.cx - KEY.hemH), y: normY(KEY.hemY) },
  { id: 'hem_right', label: '밑단 오른쪽', labelEn: 'Hem R', x: normX(KEY.cx + KEY.hemH), y: normY(KEY.hemY) },
  { id: 'hem_center', label: '밑단 중심', labelEn: 'Hem center', x: normX(KEY.cx), y: normY(KEY.hemY) },
  { id: 'below_back_neck', label: '뒷목 아래', labelEn: 'Below back neck', x: normX(KEY.cx), y: normY(KEY.sy + 5) },
];

function drawTshirtOutline(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const av = calculateAvatarDimensions(FIXED_BODY);
  const cl = calculateClothingDimensions(FIXED_CLOTHING, FIXED_BODY.height, 'tshirt');
  const pathD = tshirtTemplate.buildBody(av, cl, KEY.cx);

  // uniform scale: 종횡비 유지, 캔버스 중앙 배치
  // w,h는 실제 canvas 크기 (SKETCH_W, SKETCH_H와 같을 수도 다를 수도)
  const rangeX = KEY.maxX - KEY.minX;
  const rangeY = KEY.maxY - KEY.minY;
  const padX = rangeX * PADDING;
  const padY = rangeY * PADDING;
  const contentW = rangeX + padX * 2;
  const contentH = rangeY + padY * 2;
  const s = Math.min(w / contentW, h / contentH);
  const offX = (w - contentW * s) / 2;
  const offY = (h - contentH * s) / 2;

  ctx.save();
  ctx.translate(offX, offY);
  ctx.scale(s, s);
  ctx.translate(-KEY.minX + padX, -KEY.minY + padY);

  const path = new Path2D(pathD);
  ctx.fillStyle = '#F0F4F8';
  ctx.fill(path);
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2 / s;
  ctx.stroke(path);

  // 중심선
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1 / s;
  ctx.beginPath();
  ctx.moveTo(KEY.cx, KEY.sy);
  ctx.lineTo(KEY.cx, KEY.hemY);
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
