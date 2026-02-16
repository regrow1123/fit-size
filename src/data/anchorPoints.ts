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
  // Center line
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.08);
  ctx.lineTo(w * 0.5, h * 0.78);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// ─── Long Sleeve Top ───
const LONG_SLEEVE_POINTS: AnchorPoint[] = [
  { id: 'neck_back_center', label: '뒷목 중심', labelEn: 'Back neck center', x: 0.5, y: 0.08 },
  { id: 'neck_front_center', label: '앞목 중심', labelEn: 'Front neck center', x: 0.5, y: 0.13 },
  { id: 'neck_left', label: '목 왼쪽', labelEn: 'Neck left', x: 0.42, y: 0.09 },
  { id: 'neck_right', label: '목 오른쪽', labelEn: 'Neck right', x: 0.58, y: 0.09 },
  { id: 'shoulder_end_left', label: '왼쪽 어깨끝', labelEn: 'Shoulder end L', x: 0.22, y: 0.14 },
  { id: 'shoulder_end_right', label: '오른쪽 어깨끝', labelEn: 'Shoulder end R', x: 0.78, y: 0.14 },
  { id: 'armpit_left', label: '왼쪽 겨드랑이', labelEn: 'Armpit L', x: 0.26, y: 0.28 },
  { id: 'armpit_right', label: '오른쪽 겨드랑이', labelEn: 'Armpit R', x: 0.74, y: 0.28 },
  { id: 'elbow_left', label: '왼쪽 팔꿈치', labelEn: 'Elbow L', x: 0.1, y: 0.42 },
  { id: 'elbow_right', label: '오른쪽 팔꿈치', labelEn: 'Elbow R', x: 0.9, y: 0.42 },
  { id: 'cuff_left', label: '왼쪽 소매단', labelEn: 'Cuff L', x: 0.04, y: 0.56 },
  { id: 'cuff_right', label: '오른쪽 소매단', labelEn: 'Cuff R', x: 0.96, y: 0.56 },
  { id: 'cuff_inner_left', label: '왼쪽 소매단 안쪽', labelEn: 'Cuff inner L', x: 0.1, y: 0.58 },
  { id: 'cuff_inner_right', label: '오른쪽 소매단 안쪽', labelEn: 'Cuff inner R', x: 0.9, y: 0.58 },
  { id: 'chest_left', label: '가슴 왼쪽', labelEn: 'Chest L', x: 0.26, y: 0.35 },
  { id: 'chest_right', label: '가슴 오른쪽', labelEn: 'Chest R', x: 0.74, y: 0.35 },
  { id: 'waist_left', label: '허리 왼쪽', labelEn: 'Waist L', x: 0.27, y: 0.58 },
  { id: 'waist_right', label: '허리 오른쪽', labelEn: 'Waist R', x: 0.73, y: 0.58 },
  { id: 'hem_left', label: '밑단 왼쪽', labelEn: 'Hem L', x: 0.28, y: 0.78 },
  { id: 'hem_right', label: '밑단 오른쪽', labelEn: 'Hem R', x: 0.72, y: 0.78 },
  { id: 'hem_center', label: '밑단 중심', labelEn: 'Hem center', x: 0.5, y: 0.78 },
  { id: 'below_back_neck', label: '뒷목 아래', labelEn: 'Below back neck', x: 0.5, y: 0.1 },
];

function drawLongSleeveOutline(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.moveTo(w * 0.42, h * 0.09);
  ctx.quadraticCurveTo(w * 0.5, h * 0.14, w * 0.58, h * 0.09);
  ctx.lineTo(w * 0.78, h * 0.14);
  // Right sleeve down to cuff
  ctx.lineTo(w * 0.9, h * 0.42);
  ctx.lineTo(w * 0.96, h * 0.56);
  ctx.lineTo(w * 0.9, h * 0.58);
  // Back up to armpit
  ctx.lineTo(w * 0.74, h * 0.28);
  ctx.lineTo(w * 0.74, h * 0.35);
  ctx.lineTo(w * 0.73, h * 0.58);
  ctx.lineTo(w * 0.72, h * 0.78);
  ctx.lineTo(w * 0.28, h * 0.78);
  ctx.lineTo(w * 0.27, h * 0.58);
  ctx.lineTo(w * 0.26, h * 0.35);
  ctx.lineTo(w * 0.26, h * 0.28);
  // Left sleeve
  ctx.lineTo(w * 0.1, h * 0.58);
  ctx.lineTo(w * 0.04, h * 0.56);
  ctx.lineTo(w * 0.1, h * 0.42);
  ctx.lineTo(w * 0.22, h * 0.14);
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

// ─── Jacket / Outer ───
const JACKET_POINTS: AnchorPoint[] = [
  { id: 'collar_left', label: '칼라 왼쪽', labelEn: 'Collar L', x: 0.4, y: 0.06 },
  { id: 'collar_right', label: '칼라 오른쪽', labelEn: 'Collar R', x: 0.6, y: 0.06 },
  { id: 'collar_center', label: '칼라 중심', labelEn: 'Collar center', x: 0.5, y: 0.04 },
  { id: 'neck_front_center', label: '앞목 중심', labelEn: 'Front neck center', x: 0.5, y: 0.1 },
  { id: 'shoulder_end_left', label: '왼쪽 어깨끝', labelEn: 'Shoulder end L', x: 0.16, y: 0.13 },
  { id: 'shoulder_end_right', label: '오른쪽 어깨끝', labelEn: 'Shoulder end R', x: 0.84, y: 0.13 },
  { id: 'armpit_left', label: '왼쪽 겨드랑이', labelEn: 'Armpit L', x: 0.22, y: 0.27 },
  { id: 'armpit_right', label: '오른쪽 겨드랑이', labelEn: 'Armpit R', x: 0.78, y: 0.27 },
  { id: 'elbow_left', label: '왼쪽 팔꿈치', labelEn: 'Elbow L', x: 0.08, y: 0.4 },
  { id: 'elbow_right', label: '오른쪽 팔꿈치', labelEn: 'Elbow R', x: 0.92, y: 0.4 },
  { id: 'cuff_left', label: '왼쪽 소매단', labelEn: 'Cuff L', x: 0.02, y: 0.55 },
  { id: 'cuff_right', label: '오른쪽 소매단', labelEn: 'Cuff R', x: 0.98, y: 0.55 },
  { id: 'cuff_inner_left', label: '왼쪽 소매단 안쪽', labelEn: 'Cuff inner L', x: 0.08, y: 0.57 },
  { id: 'cuff_inner_right', label: '오른쪽 소매단 안쪽', labelEn: 'Cuff inner R', x: 0.92, y: 0.57 },
  { id: 'chest_left', label: '가슴 왼쪽', labelEn: 'Chest L', x: 0.22, y: 0.32 },
  { id: 'chest_right', label: '가슴 오른쪽', labelEn: 'Chest R', x: 0.78, y: 0.32 },
  { id: 'pocket_left', label: '왼쪽 포켓', labelEn: 'Pocket L', x: 0.3, y: 0.48 },
  { id: 'pocket_right', label: '오른쪽 포켓', labelEn: 'Pocket R', x: 0.7, y: 0.48 },
  { id: 'waist_left', label: '허리 왼쪽', labelEn: 'Waist L', x: 0.23, y: 0.55 },
  { id: 'waist_right', label: '허리 오른쪽', labelEn: 'Waist R', x: 0.77, y: 0.55 },
  { id: 'hem_left', label: '밑단 왼쪽', labelEn: 'Hem L', x: 0.24, y: 0.82 },
  { id: 'hem_right', label: '밑단 오른쪽', labelEn: 'Hem R', x: 0.76, y: 0.82 },
  { id: 'hem_center', label: '밑단 중심', labelEn: 'Hem center', x: 0.5, y: 0.82 },
  { id: 'below_back_neck', label: '뒷목 아래', labelEn: 'Below back neck', x: 0.5, y: 0.08 },
];

function drawJacketOutline(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  // Collar
  ctx.moveTo(w * 0.4, h * 0.06);
  ctx.lineTo(w * 0.44, h * 0.1);
  ctx.quadraticCurveTo(w * 0.5, h * 0.13, w * 0.56, h * 0.1);
  ctx.lineTo(w * 0.6, h * 0.06);
  // Right shoulder
  ctx.lineTo(w * 0.84, h * 0.13);
  // Right sleeve
  ctx.lineTo(w * 0.92, h * 0.4);
  ctx.lineTo(w * 0.98, h * 0.55);
  ctx.lineTo(w * 0.92, h * 0.57);
  ctx.lineTo(w * 0.78, h * 0.27);
  // Right body
  ctx.lineTo(w * 0.78, h * 0.32);
  ctx.lineTo(w * 0.77, h * 0.55);
  ctx.lineTo(w * 0.76, h * 0.82);
  // Hem
  ctx.lineTo(w * 0.24, h * 0.82);
  // Left body
  ctx.lineTo(w * 0.23, h * 0.55);
  ctx.lineTo(w * 0.22, h * 0.32);
  ctx.lineTo(w * 0.22, h * 0.27);
  // Left sleeve
  ctx.lineTo(w * 0.08, h * 0.57);
  ctx.lineTo(w * 0.02, h * 0.55);
  ctx.lineTo(w * 0.08, h * 0.4);
  ctx.lineTo(w * 0.16, h * 0.13);
  ctx.lineTo(w * 0.4, h * 0.06);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Center zipper line
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.1);
  ctx.lineTo(w * 0.5, h * 0.82);
  ctx.stroke();
  ctx.setLineDash([]);
  // Pockets
  ctx.strokeStyle = '#D1D5DB';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.strokeRect(w * 0.26, h * 0.45, w * 0.1, h * 0.08);
  ctx.strokeRect(w * 0.64, h * 0.45, w * 0.1, h * 0.08);
  ctx.restore();
}

// ─── Pants ───
const PANTS_POINTS: AnchorPoint[] = [
  { id: 'waist_left', label: '허리 왼쪽', labelEn: 'Waist L', x: 0.28, y: 0.06 },
  { id: 'waist_right', label: '허리 오른쪽', labelEn: 'Waist R', x: 0.72, y: 0.06 },
  { id: 'waist_center', label: '허리 중심', labelEn: 'Waist center', x: 0.5, y: 0.06 },
  { id: 'hip_left', label: '엉덩이 왼쪽', labelEn: 'Hip L', x: 0.25, y: 0.18 },
  { id: 'hip_right', label: '엉덩이 오른쪽', labelEn: 'Hip R', x: 0.75, y: 0.18 },
  { id: 'rise_top', label: '밑위 위', labelEn: 'Rise top', x: 0.5, y: 0.06 },
  { id: 'crotch', label: '밑위 아래 (가랑이)', labelEn: 'Crotch', x: 0.5, y: 0.36 },
  { id: 'thigh_left', label: '왼쪽 허벅지', labelEn: 'Thigh L', x: 0.28, y: 0.3 },
  { id: 'thigh_right', label: '오른쪽 허벅지', labelEn: 'Thigh R', x: 0.72, y: 0.3 },
  { id: 'knee_left', label: '왼쪽 무릎', labelEn: 'Knee L', x: 0.3, y: 0.55 },
  { id: 'knee_right', label: '오른쪽 무릎', labelEn: 'Knee R', x: 0.7, y: 0.55 },
  { id: 'knee_inner_left', label: '왼쪽 무릎 안쪽', labelEn: 'Knee inner L', x: 0.4, y: 0.55 },
  { id: 'knee_inner_right', label: '오른쪽 무릎 안쪽', labelEn: 'Knee inner R', x: 0.6, y: 0.55 },
  { id: 'hem_left_outer', label: '왼쪽 밑단 바깥', labelEn: 'Hem outer L', x: 0.3, y: 0.92 },
  { id: 'hem_left_inner', label: '왼쪽 밑단 안쪽', labelEn: 'Hem inner L', x: 0.42, y: 0.92 },
  { id: 'hem_right_outer', label: '오른쪽 밑단 바깥', labelEn: 'Hem outer R', x: 0.7, y: 0.92 },
  { id: 'hem_right_inner', label: '오른쪽 밑단 안쪽', labelEn: 'Hem inner R', x: 0.58, y: 0.92 },
  { id: 'outseam_top_left', label: '왼쪽 아웃심 위', labelEn: 'Outseam top L', x: 0.25, y: 0.06 },
  { id: 'outseam_bottom_left', label: '왼쪽 아웃심 아래', labelEn: 'Outseam bottom L', x: 0.3, y: 0.92 },
  { id: 'inseam_top', label: '인심 위', labelEn: 'Inseam top', x: 0.5, y: 0.36 },
  { id: 'inseam_bottom_left', label: '왼쪽 인심 아래', labelEn: 'Inseam bottom L', x: 0.42, y: 0.92 },
];

function drawPantsOutline(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  // Waistband
  ctx.moveTo(w * 0.28, h * 0.06);
  ctx.lineTo(w * 0.72, h * 0.06);
  // Right side down
  ctx.lineTo(w * 0.75, h * 0.18);
  ctx.lineTo(w * 0.72, h * 0.3);
  // Right leg
  ctx.lineTo(w * 0.7, h * 0.55);
  ctx.lineTo(w * 0.7, h * 0.92);
  // Right hem
  ctx.lineTo(w * 0.58, h * 0.92);
  // Crotch right
  ctx.lineTo(w * 0.6, h * 0.55);
  ctx.quadraticCurveTo(w * 0.5, h * 0.38, w * 0.4, h * 0.55);
  // Left hem
  ctx.lineTo(w * 0.42, h * 0.92);
  ctx.lineTo(w * 0.3, h * 0.92);
  // Left leg up
  ctx.lineTo(w * 0.3, h * 0.55);
  ctx.lineTo(w * 0.28, h * 0.3);
  ctx.lineTo(w * 0.25, h * 0.18);
  ctx.lineTo(w * 0.28, h * 0.06);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Center crease lines
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.moveTo(w * 0.36, h * 0.36);
  ctx.lineTo(w * 0.36, h * 0.92);
  ctx.moveTo(w * 0.64, h * 0.36);
  ctx.lineTo(w * 0.64, h * 0.92);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// ─── Dress ───
const DRESS_POINTS: AnchorPoint[] = [
  { id: 'neck_back_center', label: '뒷목 중심', labelEn: 'Back neck center', x: 0.5, y: 0.05 },
  { id: 'neck_front_center', label: '앞목 중심', labelEn: 'Front neck center', x: 0.5, y: 0.09 },
  { id: 'neck_left', label: '목 왼쪽', labelEn: 'Neck left', x: 0.43, y: 0.06 },
  { id: 'neck_right', label: '목 오른쪽', labelEn: 'Neck right', x: 0.57, y: 0.06 },
  { id: 'shoulder_end_left', label: '왼쪽 어깨끝', labelEn: 'Shoulder end L', x: 0.22, y: 0.1 },
  { id: 'shoulder_end_right', label: '오른쪽 어깨끝', labelEn: 'Shoulder end R', x: 0.78, y: 0.1 },
  { id: 'armpit_left', label: '왼쪽 겨드랑이', labelEn: 'Armpit L', x: 0.25, y: 0.2 },
  { id: 'armpit_right', label: '오른쪽 겨드랑이', labelEn: 'Armpit R', x: 0.75, y: 0.2 },
  { id: 'sleeve_end_left', label: '왼쪽 소매끝', labelEn: 'Sleeve end L', x: 0.12, y: 0.24 },
  { id: 'sleeve_end_right', label: '오른쪽 소매끝', labelEn: 'Sleeve end R', x: 0.88, y: 0.24 },
  { id: 'chest_left', label: '가슴 왼쪽', labelEn: 'Chest L', x: 0.25, y: 0.25 },
  { id: 'chest_right', label: '가슴 오른쪽', labelEn: 'Chest R', x: 0.75, y: 0.25 },
  { id: 'waist_left', label: '허리 왼쪽', labelEn: 'Waist L', x: 0.28, y: 0.38 },
  { id: 'waist_right', label: '허리 오른쪽', labelEn: 'Waist R', x: 0.72, y: 0.38 },
  { id: 'hip_left', label: '엉덩이 왼쪽', labelEn: 'Hip L', x: 0.24, y: 0.48 },
  { id: 'hip_right', label: '엉덩이 오른쪽', labelEn: 'Hip R', x: 0.76, y: 0.48 },
  { id: 'skirt_hem_left', label: '스커트 밑단 왼쪽', labelEn: 'Skirt hem L', x: 0.18, y: 0.92 },
  { id: 'skirt_hem_right', label: '스커트 밑단 오른쪽', labelEn: 'Skirt hem R', x: 0.82, y: 0.92 },
  { id: 'skirt_hem_center', label: '스커트 밑단 중심', labelEn: 'Skirt hem center', x: 0.5, y: 0.92 },
  { id: 'below_back_neck', label: '뒷목 아래', labelEn: 'Below back neck', x: 0.5, y: 0.07 },
];

function drawDressOutline(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  // Neckline
  ctx.moveTo(w * 0.43, h * 0.06);
  ctx.quadraticCurveTo(w * 0.5, h * 0.1, w * 0.57, h * 0.06);
  // Right shoulder
  ctx.lineTo(w * 0.78, h * 0.1);
  // Right sleeve
  ctx.lineTo(w * 0.88, h * 0.24);
  ctx.lineTo(w * 0.75, h * 0.2);
  // Right body
  ctx.lineTo(w * 0.75, h * 0.25);
  ctx.lineTo(w * 0.72, h * 0.38);
  // Hip flare
  ctx.lineTo(w * 0.76, h * 0.48);
  // Skirt
  ctx.quadraticCurveTo(w * 0.82, h * 0.7, w * 0.82, h * 0.92);
  // Hem
  ctx.lineTo(w * 0.18, h * 0.92);
  // Left skirt
  ctx.quadraticCurveTo(w * 0.18, h * 0.7, w * 0.24, h * 0.48);
  // Left body up
  ctx.lineTo(w * 0.28, h * 0.38);
  ctx.lineTo(w * 0.25, h * 0.25);
  ctx.lineTo(w * 0.25, h * 0.2);
  // Left sleeve
  ctx.lineTo(w * 0.12, h * 0.24);
  ctx.lineTo(w * 0.22, h * 0.1);
  ctx.lineTo(w * 0.43, h * 0.06);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Center line
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.05);
  ctx.lineTo(w * 0.5, h * 0.92);
  ctx.stroke();
  // Waist line
  ctx.beginPath();
  ctx.moveTo(w * 0.28, h * 0.38);
  ctx.lineTo(w * 0.72, h * 0.38);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// ─── Category configs ───
export const CLOTHING_CATEGORIES: ClothingCategoryConfig[] = [
  { id: 'tshirt', label: '반팔 상의', icon: '👕', anchorPoints: TSHIRT_POINTS, drawOutline: drawTshirtOutline },
  { id: 'long_sleeve', label: '긴팔 상의', icon: '🧥', anchorPoints: LONG_SLEEVE_POINTS, drawOutline: drawLongSleeveOutline },
  { id: 'jacket', label: '아우터/자켓', icon: '🧥', anchorPoints: JACKET_POINTS, drawOutline: drawJacketOutline },
  { id: 'pants', label: '바지', icon: '👖', anchorPoints: PANTS_POINTS, drawOutline: drawPantsOutline },
  { id: 'dress', label: '원피스', icon: '👗', anchorPoints: DRESS_POINTS, drawOutline: drawDressOutline },
];

export function getCategoryConfig(id: ClothingCategory): ClothingCategoryConfig {
  return CLOTHING_CATEGORIES.find(c => c.id === id) ?? CLOTHING_CATEGORIES[0];
}

// Legacy compat
export const ANCHOR_POINTS = TSHIRT_POINTS;

export function getAnchorById(id: string): AnchorPoint | undefined {
  // Search across all categories
  for (const cat of CLOTHING_CATEGORIES) {
    const found = cat.anchorPoints.find(p => p.id === id);
    if (found) return found;
  }
  return undefined;
}
