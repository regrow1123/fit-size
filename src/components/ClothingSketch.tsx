import { useRef, useEffect, useState, useCallback } from 'react';
import { ANCHOR_POINTS, type AnchorPoint } from '../data/anchorPoints';
import type { PointMeasurement } from '../types';

const CANVAS_W = 460;
const CANVAS_H = 580;
const POINT_RADIUS = 7;
const HOVER_RADIUS = 10;

interface Props {
  measurements: PointMeasurement[];
  onAddMeasurement: (startId: string, endId: string, value: number) => void;
  onDeleteMeasurement: (id: string) => void;
}

// Colors for measurement lines
const LINE_COLORS = [
  '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
];

export default function ClothingSketch({ measurements, onAddMeasurement, onDeleteMeasurement }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [pendingEnd, setPendingEnd] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const toCanvas = useCallback((p: AnchorPoint) => ({
    x: p.x * CANVAS_W,
    y: p.y * CANVAS_H,
  }), []);

  const getPointAt = useCallback((cx: number, cy: number): AnchorPoint | null => {
    for (const p of ANCHOR_POINTS) {
      const { x, y } = toCanvas(p);
      const dist = Math.hypot(cx - x, cy - y);
      if (dist <= HOVER_RADIUS + 4) return p;
    }
    return null;
  }, [toCanvas]);

  // Draw everything
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw t-shirt outline
    drawTshirt(ctx);

    // Draw measurement lines
    measurements.forEach((m, i) => {
      const startPt = ANCHOR_POINTS.find(p => p.id === m.startPointId);
      const endPt = ANCHOR_POINTS.find(p => p.id === m.endPointId);
      if (!startPt || !endPt) return;
      const s = toCanvas(startPt);
      const e = toCanvas(endPt);
      const color = LINE_COLORS[i % LINE_COLORS.length];

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([]);
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(e.x, e.y);
      ctx.stroke();

      // Label
      const mx = (s.x + e.x) / 2;
      const my = (s.y + e.y) / 2;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = color;
      const label = `${m.value}cm`;
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = 'white';
      ctx.fillRect(mx - tw / 2 - 3, my - 8, tw + 6, 16);
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, mx, my);

      // Arrowheads
      drawArrow(ctx, s, e, color);
    });

    // Draw in-progress line
    if (selectedStart && pendingEnd) {
      const s = toCanvas(ANCHOR_POINTS.find(p => p.id === selectedStart)!);
      const e = toCanvas(ANCHOR_POINTS.find(p => p.id === pendingEnd)!);
      ctx.beginPath();
      ctx.strokeStyle = '#6366F1';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(e.x, e.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw anchor points
    for (const p of ANCHOR_POINTS) {
      const { x, y } = toCanvas(p);
      const isHovered = hoveredPoint === p.id;
      const isSelected = selectedStart === p.id;

      ctx.beginPath();
      ctx.arc(x, y, isHovered ? HOVER_RADIUS : POINT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#6366F1' : isHovered ? '#3B82F6' : 'rgba(59,130,246,0.6)';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (isHovered || isSelected) {
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#1F2937';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        const bg = ctx.measureText(p.label).width;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(x - bg / 2 - 4, y - HOVER_RADIUS - 20, bg + 8, 18);
        ctx.fillStyle = '#1F2937';
        ctx.fillText(p.label, x, y - HOVER_RADIUS - 5);
      }
    }
  }, [hoveredPoint, selectedStart, pendingEnd, measurements, toCanvas]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) * (CANVAS_W / rect.width);
    const y = (e.clientY - rect.top) * (CANVAS_H / rect.height);
    const pt = getPointAt(x, y);
    setHoveredPoint(pt?.id ?? null);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = pt ? 'pointer' : 'default';
    }
  }, [getPointAt]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) * (CANVAS_W / rect.width);
    const y = (e.clientY - rect.top) * (CANVAS_H / rect.height);
    const pt = getPointAt(x, y);
    if (!pt) {
      setSelectedStart(null);
      setPendingEnd(null);
      return;
    }

    if (!selectedStart) {
      setSelectedStart(pt.id);
    } else if (pt.id !== selectedStart) {
      setPendingEnd(pt.id);
      setInputValue('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [selectedStart, getPointAt]);

  const handleConfirm = useCallback(() => {
    const val = parseFloat(inputValue);
    if (!selectedStart || !pendingEnd || isNaN(val) || val <= 0) return;
    onAddMeasurement(selectedStart, pendingEnd, val);
    setSelectedStart(null);
    setPendingEnd(null);
    setInputValue('');
  }, [selectedStart, pendingEnd, inputValue, onAddMeasurement]);

  const handleCancel = useCallback(() => {
    setSelectedStart(null);
    setPendingEnd(null);
    setInputValue('');
  }, []);

  const startLabel = selectedStart ? ANCHOR_POINTS.find(p => p.id === selectedStart)?.label : '';
  const endLabel = pendingEnd ? ANCHOR_POINTS.find(p => p.id === pendingEnd)?.label : '';

  return (
    <div className="space-y-3">
      {/* Status bar */}
      <div className="text-sm text-gray-600 bg-gray-50 rounded px-3 py-2 min-h-[2.5rem] flex items-center">
        {!selectedStart && !pendingEnd && '📍 시작점을 클릭하세요'}
        {selectedStart && !pendingEnd && (
          <span>📍 <b>{startLabel}</b> 선택됨 → 끝점을 클릭하세요 <button onClick={handleCancel} className="ml-2 text-red-500 text-xs cursor-pointer">취소</button></span>
        )}
        {pendingEnd && (
          <div className="flex items-center gap-2 w-full">
            <span className="shrink-0">📏 <b>{startLabel}</b> → <b>{endLabel}</b></span>
            <input
              ref={inputRef}
              type="number"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              placeholder="cm"
              className="w-20 border rounded px-2 py-1 text-sm"
            />
            <button onClick={handleConfirm} className="bg-blue-600 text-white px-3 py-1 rounded text-sm cursor-pointer hover:bg-blue-700">확인</button>
            <button onClick={handleCancel} className="text-red-500 text-sm cursor-pointer">취소</button>
          </div>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="border rounded-lg bg-white w-full"
        style={{ maxWidth: CANVAS_W }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />

      {/* Measurement list */}
      {measurements.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-gray-700">📐 측정 목록</h3>
          {measurements.map((m, i) => {
            const sp = ANCHOR_POINTS.find(p => p.id === m.startPointId);
            const ep = ANCHOR_POINTS.find(p => p.id === m.endPointId);
            return (
              <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-1.5 text-sm">
                <span>
                  <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: LINE_COLORS[i % LINE_COLORS.length] }} />
                  {sp?.label} → {ep?.label}: <b>{m.value}cm</b>
                </span>
                <button onClick={() => onDeleteMeasurement(m.id)} className="text-red-400 hover:text-red-600 cursor-pointer text-xs">✕</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function drawTshirt(ctx: CanvasRenderingContext2D) {
  const w = CANVAS_W;
  const h = CANVAS_H;
  ctx.save();
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.fillStyle = '#F8FAFC';

  ctx.beginPath();
  // Neckline
  ctx.moveTo(w * 0.42, h * 0.09);
  ctx.quadraticCurveTo(w * 0.5, h * 0.14, w * 0.58, h * 0.09);
  // Right shoulder
  ctx.lineTo(w * 0.8, h * 0.14);
  // Right sleeve
  ctx.lineTo(w * 0.92, h * 0.32);
  ctx.lineTo(w * 0.76, h * 0.28);
  // Right body
  ctx.lineTo(w * 0.76, h * 0.35);
  ctx.lineTo(w * 0.75, h * 0.58);
  ctx.lineTo(w * 0.74, h * 0.78);
  // Hem
  ctx.lineTo(w * 0.26, h * 0.78);
  // Left body
  ctx.lineTo(w * 0.25, h * 0.58);
  ctx.lineTo(w * 0.24, h * 0.35);
  ctx.lineTo(w * 0.24, h * 0.28);
  // Left sleeve
  ctx.lineTo(w * 0.08, h * 0.32);
  ctx.lineTo(w * 0.2, h * 0.14);
  // Left shoulder back to neck
  ctx.lineTo(w * 0.42, h * 0.09);

  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Center line (dashed)
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#E2E8F0';
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.08);
  ctx.lineTo(w * 0.5, h * 0.78);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

function drawArrow(ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }, color: string) {
  const headLen = 8;
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.fillStyle = color;

  // Arrow at end
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}
