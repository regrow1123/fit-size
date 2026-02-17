import type { BodyMeasurements, ClothingCategory } from '../types';
import type { ReverseMeasurement } from './reverseEstimator';

// ─── Types ───

export interface SavedGarment {
  id: string;
  name: string; // user-given label
  category: ClothingCategory;
  measurements: ReverseMeasurement[];
  savedAt: number; // timestamp
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

// ─── Keys ───

const STORAGE_KEY = 'fitsize-wardrobe';

// ─── Helpers ───

function getStorage(): WardrobeData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, garments: [], profile: null };
    const data = JSON.parse(raw) as WardrobeData;
    if (data.version !== 1) return { version: 1, garments: [], profile: null };
    return data;
  } catch {
    return { version: 1, garments: [], profile: null };
  }
}

function setStorage(data: WardrobeData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage full or unavailable — silently fail
  }
}

// ─── Public API ───

export function loadWardrobe(): WardrobeData {
  return getStorage();
}

export function hasStoredProfile(): boolean {
  const data = getStorage();
  return data.profile !== null || data.garments.length > 0;
}

export function saveGarment(garment: SavedGarment): void {
  const data = getStorage();
  data.garments.push(garment);
  setStorage(data);
}

export function updateGarmentName(id: string, name: string): void {
  const data = getStorage();
  const g = data.garments.find(g => g.id === id);
  if (g) { g.name = name; setStorage(data); }
}

export function deleteGarment(id: string): void {
  const data = getStorage();
  data.garments = data.garments.filter(g => g.id !== id);
  setStorage(data);
}

export function clearAllGarments(): void {
  const data = getStorage();
  data.garments = [];
  setStorage(data);
}

export function saveProfile(profile: SavedBodyProfile): void {
  const data = getStorage();
  data.profile = profile;
  setStorage(data);
}

export function clearAll(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Export / Import ───

export function exportWardrobe(): void {
  const data = getStorage();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fitsize-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importWardrobeFromText(text: string): { garments: number; hasProfile: boolean } {
  const data = JSON.parse(text) as WardrobeData;
  if (data.version !== 1 || !Array.isArray(data.garments)) {
    throw new Error('잘못된 데이터 형식입니다.');
  }
  setStorage(data);
  return { garments: data.garments.length, hasProfile: data.profile !== null };
}

export function importWardrobe(file: File): Promise<{ garments: number; hasProfile: boolean }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as WardrobeData;
        if (data.version !== 1 || !Array.isArray(data.garments)) {
          reject(new Error('잘못된 파일 형식입니다.'));
          return;
        }
        setStorage(data);
        resolve({ garments: data.garments.length, hasProfile: data.profile !== null });
      } catch {
        reject(new Error('JSON 파싱에 실패했습니다.'));
      }
    };
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.readAsText(file);
  });
}
