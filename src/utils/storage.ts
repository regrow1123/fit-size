import type { BodyMeasurements, ClothingCategory } from '../types';
import type { ReverseMeasurement } from './reverseEstimator';

// ─── Types ───

export interface SavedGarment {
  id: string;
  name: string;
  category: ClothingCategory;
  measurements: ReverseMeasurement[];
  savedAt: number;
}

export interface SavedBodyProfile {
  gender: 'male' | 'female';
  height: number;
  weight: number;
  bodyMeasurements?: BodyMeasurements;
  updatedAt: number;
}

export interface WardrobeData {
  version: 1;
  garments: SavedGarment[];
  profile: SavedBodyProfile | null;
}

// ─── In-memory store ───
// 세션 중에만 유지. 영속성은 Firebase 또는 텍스트 내보내기/불러오기로.

let store: WardrobeData = { version: 1, garments: [], profile: null };

/** 변경 리스너 (App에서 re-render 트리거용) */
type Listener = () => void;
const listeners: Set<Listener> = new Set();
export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify() {
  listeners.forEach(fn => fn());
}

// ─── Public API ───

export function loadWardrobe(): WardrobeData {
  return store;
}

export function hasStoredProfile(): boolean {
  return store.profile !== null;
}

export function saveGarment(garment: SavedGarment): void {
  store.garments.push(garment);
  notify();
}

export function updateGarmentName(id: string, name: string): void {
  const g = store.garments.find(g => g.id === id);
  if (g) { g.name = name; notify(); }
}

export function deleteGarment(id: string): void {
  store.garments = store.garments.filter(g => g.id !== id);
  notify();
}

export function clearAllGarments(): void {
  store.garments = [];
  notify();
}

export function saveProfile(profile: SavedBodyProfile): void {
  store.profile = profile;
  notify();
}

export function clearAll(): void {
  store = { version: 1, garments: [], profile: null };
  notify();
}

/** 전체 데이터를 한번에 로드 (Firebase/텍스트 불러오기용) */
export function loadWardrobeData(data: WardrobeData): void {
  store = { ...data, version: 1 };
  notify();
}

// ─── Text Export / Import ───

export function exportWardrobeText(): string {
  return JSON.stringify(store);
}

export function importWardrobeFromText(text: string): { garments: number; hasProfile: boolean } {
  const data = JSON.parse(text) as WardrobeData;
  if (data.version !== 1 || !Array.isArray(data.garments)) {
    throw new Error('잘못된 데이터 형식입니다.');
  }
  loadWardrobeData(data);
  return { garments: data.garments.length, hasProfile: data.profile !== null };
}
