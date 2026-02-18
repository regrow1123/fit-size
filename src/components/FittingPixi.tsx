import { useRef, useEffect, useMemo } from 'react';
import * as PIXI from 'pixi.js';
import type { BodyMeasurements, AvatarDimensions, ClothingCategory } from '../types';
import { calculateAvatarDimensions } from '../utils/avatarCalculator';
import { calculateClothingDimensions } from '../utils/clothingRenderer';
import { useTranslation } from '../i18n';

interface Props {
  body: BodyMeasurements;
  clothingMeasurements?: Map<string, number>;
  category?: ClothingCategory;
}

const W = 400;
const H = 700;
const GRID_X = 20;
const GRID_Y = 30;

/** 기준 체형 (175cm/70kg male) */
function getBaseDims(): AvatarDimensions {
  return calculateAvatarDimensions({
    height: 175, weight: 70, gender: 'male',
    shoulderWidth: 45.7, chestCirc: 97, waistCirc: 82.3, hipCirc: 96.7,
  });
}

/**
 * Y좌표에서의 body 반폭 (보간)
 */
function halfWidthAt(y: number, dims: AvatarDimensions): number {
  const pts: [number, number][] = [
    [dims.shoulderY, dims.shoulderWidth / 2],
    [dims.chestY, dims.chestWidth / 2],
    [dims.underbustY, dims.underbustWidth / 2],
    [dims.waistY, dims.waistWidth / 2],
    [dims.hipY, dims.hipWidth / 2],
    [dims.crotchY, dims.thighWidth * 0.6],
  ];
  if (y <= pts[0][0]) return pts[0][1];
  if (y >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 0; i < pts.length - 1; i++) {
    if (y >= pts[i][0] && y <= pts[i + 1][0]) {
      const t = (y - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
      return pts[i][1] + t * (pts[i + 1][1] - pts[i][1]);
    }
  }
  return pts[0][1];
}

const ARM_ANGLE = 15 * Math.PI / 180;

/**
 * 메시 정점을 체형 차이에 따라 워핑.
 * isTshirt=true이면 소매 영역 정점을 T-포즈 → 15도로 회전.
 */
function warpMesh(
  mesh: PIXI.SimplePlane,
  baseDims: AvatarDimensions,
  targetDims: AvatarDimensions,
  widthExtra: number = 1,
  isTshirt: boolean = false,
) {
  const buf = mesh.geometry.buffers[0];
  const verts = buf.data as unknown as Float32Array;
  const cols = GRID_X + 1;
  const cx = W / 2;

  const shX = targetDims.shoulderWidth / 2; // 어깨 반폭
  const shoulderY = targetDims.shoulderY;
  const chestY = targetDims.chestY;

  for (let j = 0; j <= GRID_Y; j++) {
    const origY = (j / GRID_Y) * H;
    const baseHW = halfWidthAt(origY, baseDims);
    const targetHW = halfWidthAt(origY, targetDims);
    const ratio = baseHW > 0 ? (targetHW / baseHW) * widthExtra : widthExtra;

    for (let i = 0; i <= GRID_X; i++) {
      const idx = (j * cols + i) * 2;
      const origX = (i / GRID_X) * W;
      const dx = origX - cx;

      let newX = cx + dx * ratio;
      let newY = origY;

      // 티셔츠 소매 워핑: 어깨 바깥 영역 + 상체 영역
      if (isTshirt && origY >= shoulderY - 40 && origY <= chestY + 20) {
        const absDx = Math.abs(newX - cx);
        if (absDx > shX * 0.8) {
          // 어깨 밖 영역 — T-포즈에서 15도로 꺾기
          const side = newX > cx ? 1 : -1;
          const pivotX = cx + side * shX;
          const pivotY = shoulderY;
          const relX = newX - pivotX;
          const relY = newY - pivotY;

          // T-포즈에서 relX는 팔 방향(수평), relY는 수직
          // 15도 회전 적용 (오른쪽: 시계방향, 왼쪽: 반시계)
          const cos = Math.cos(side * ARM_ANGLE);
          const sin = Math.sin(side * ARM_ANGLE);
          newX = pivotX + relX * cos - relY * sin;
          newY = pivotY + relX * sin + relY * cos;
        }
      }

      verts[idx] = newX;
      verts[idx + 1] = newY;
    }
  }
  buf.update();
}

export default function FittingPixi({ body, clothingMeasurements, category = 'tshirt' }: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const mannequinRef = useRef<PIXI.SimplePlane | null>(null);
  const tshirtRef = useRef<PIXI.SimplePlane | null>(null);
  const initDone = useRef(false);

  const avatarDims = useMemo(() => calculateAvatarDimensions(body), [body]);
  const baseDims = useMemo(() => getBaseDims(), []);
  const clothingDims = useMemo(
    () => clothingMeasurements
      ? calculateClothingDimensions(clothingMeasurements, body.height, category)
      : null,
    [clothingMeasurements, body.height, category],
  );

  // 초기화
  useEffect(() => {
    if (!containerRef.current || initDone.current) return;
    initDone.current = true;

    const app = new PIXI.Application({
      width: W,
      height: H,
      backgroundColor: 0xffffff,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    try {
      const view = app.view as unknown as HTMLCanvasElement;
      containerRef.current.appendChild(view);
    } catch (e) {
      console.error('PixiJS init failed:', e);
      return;
    }
    appRef.current = app;

    // 텍스처 로드
    const mannequinTex = PIXI.Texture.from('/fit-size/mannequin-base.png');
    const tshirtTex = PIXI.Texture.from('/fit-size/tshirt-base.png');

    const mannequin = new PIXI.SimplePlane(mannequinTex, GRID_X + 1, GRID_Y + 1);
    app.stage.addChild(mannequin);
    mannequinRef.current = mannequin;

    const tshirt = new PIXI.SimplePlane(tshirtTex, GRID_X + 1, GRID_Y + 1);
    tshirt.visible = false;
    app.stage.addChild(tshirt);
    tshirtRef.current = tshirt;

    return () => {
      app.destroy(true, { children: true, texture: true });
      appRef.current = null;
      initDone.current = false;
    };
  }, []);

  // 워핑 업데이트
  useEffect(() => {
    if (!mannequinRef.current) return;

    warpMesh(mannequinRef.current, baseDims, avatarDims, 1, false);

    if (tshirtRef.current) {
      if (clothingDims) {
        const scale = Math.max(1, clothingDims.chestWidth / avatarDims.chestWidth);
        warpMesh(tshirtRef.current, baseDims, avatarDims, scale, true);
        tshirtRef.current.visible = true;
      } else {
        tshirtRef.current.visible = false;
      }
    }
  }, [avatarDims, baseDims, clothingDims]);

  return (
    <div className="w-full flex flex-col items-center">
      <div
        ref={containerRef}
        className="border rounded-lg bg-white shadow-inner overflow-hidden"
        style={{ width: W, height: H, maxWidth: '100%' }}
      />
      <div className="mt-2 flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-500 inline-block" /> {t('fit.good')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-yellow-500 inline-block" /> {t('fit.loose')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-500 inline-block" /> {t('fit.tight')}
        </span>
      </div>
    </div>
  );
}
