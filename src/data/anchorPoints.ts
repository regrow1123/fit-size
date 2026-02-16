export interface AnchorPoint {
  id: string;
  label: string;
  labelEn: string;
  /** x position as fraction of canvas width (0-1) */
  x: number;
  /** y position as fraction of canvas height (0-1) */
  y: number;
}

// Positions on a flat t-shirt sketch (도식화), normalized 0-1
// The sketch is drawn on a 500x600 canvas conceptually
export const ANCHOR_POINTS: AnchorPoint[] = [
  // Neck
  { id: 'neck_back_center', label: '뒷목 중심', labelEn: 'Back neck center', x: 0.5, y: 0.08 },
  { id: 'neck_front_center', label: '앞목 중심', labelEn: 'Front neck center', x: 0.5, y: 0.13 },
  { id: 'neck_left', label: '목 왼쪽', labelEn: 'Neck left', x: 0.42, y: 0.09 },
  { id: 'neck_right', label: '목 오른쪽', labelEn: 'Neck right', x: 0.58, y: 0.09 },

  // Shoulders
  { id: 'shoulder_end_left', label: '왼쪽 어깨끝', labelEn: 'Shoulder end L', x: 0.2, y: 0.14 },
  { id: 'shoulder_end_right', label: '오른쪽 어깨끝', labelEn: 'Shoulder end R', x: 0.8, y: 0.14 },
  { id: 'shoulder_seam_left', label: '왼쪽 어깨 솔기', labelEn: 'Shoulder seam L', x: 0.31, y: 0.115 },
  { id: 'shoulder_seam_right', label: '오른쪽 어깨 솔기', labelEn: 'Shoulder seam R', x: 0.69, y: 0.115 },

  // Armpits
  { id: 'armpit_left', label: '왼쪽 겨드랑이', labelEn: 'Armpit L', x: 0.24, y: 0.28 },
  { id: 'armpit_right', label: '오른쪽 겨드랑이', labelEn: 'Armpit R', x: 0.76, y: 0.28 },

  // Sleeve ends
  { id: 'sleeve_end_left', label: '왼쪽 소매끝', labelEn: 'Sleeve end L', x: 0.08, y: 0.32 },
  { id: 'sleeve_end_right', label: '오른쪽 소매끝', labelEn: 'Sleeve end R', x: 0.92, y: 0.32 },

  // Chest level
  { id: 'chest_left', label: '가슴 왼쪽', labelEn: 'Chest L', x: 0.24, y: 0.35 },
  { id: 'chest_right', label: '가슴 오른쪽', labelEn: 'Chest R', x: 0.76, y: 0.35 },

  // Waist level
  { id: 'waist_left', label: '허리 왼쪽', labelEn: 'Waist L', x: 0.25, y: 0.58 },
  { id: 'waist_right', label: '허리 오른쪽', labelEn: 'Waist R', x: 0.75, y: 0.58 },

  // Hem
  { id: 'hem_left', label: '밑단 왼쪽', labelEn: 'Hem L', x: 0.26, y: 0.78 },
  { id: 'hem_right', label: '밑단 오른쪽', labelEn: 'Hem R', x: 0.74, y: 0.78 },
  { id: 'hem_center', label: '밑단 중심', labelEn: 'Hem center', x: 0.5, y: 0.78 },

  // Below back neck (for total length)
  { id: 'below_back_neck', label: '뒷목 아래', labelEn: 'Below back neck', x: 0.5, y: 0.1 },
];

export function getAnchorById(id: string): AnchorPoint | undefined {
  return ANCHOR_POINTS.find(p => p.id === id);
}
